"use client";
/**
 * NodeContextMenu — floating right-click context menu for canvas nodes.
 * Layer-aware: shows L2-specific actions for app components.
 * Modern design: node info header, grouped actions, keyboard shortcut badges.
 */
import React, { useEffect, useRef } from "react";
import { Copy, Trash2, PenLine, Server, ArrowUpDown, Settings, Zap } from "lucide-react";

// ── Config presets per service type ───────────────────────────────────────────
type PresetConfig = Record<string, unknown>;
interface ServicePreset { label: string; config: PresetConfig }

const SERVICE_PRESETS: Partial<Record<string, ServicePreset[]>> = {
  lambda: [
    { label: "Dev", config: { memoryMB: 128, timeoutSec: 30, requestsPerMonth: 100_000 } },
    { label: "Prod", config: { memoryMB: 1024, timeoutSec: 30, requestsPerMonth: 5_000_000 } },
    { label: "High-Mem", config: { memoryMB: 3008, timeoutSec: 30, requestsPerMonth: 10_000_000 } },
  ],
  ec2: [
    { label: "t3.micro", config: { instanceType: "t3.micro", count: 1 } },
    { label: "t3.medium", config: { instanceType: "t3.medium", count: 2 } },
    { label: "m5.large", config: { instanceType: "m5.large", count: 2 } },
  ],
  ecs: [
    { label: "Small", config: { cpu: 256, memoryMB: 512, taskCount: 1 } },
    { label: "Standard", config: { cpu: 512, memoryMB: 1024, taskCount: 2 } },
    { label: "Large", config: { cpu: 1024, memoryMB: 2048, taskCount: 5 } },
  ],
  rds: [
    { label: "Dev", config: { instanceClass: "db.t3.micro", storageGB: 20, multiAZ: false, readReplicas: 0 } },
    { label: "Prod", config: { instanceClass: "db.m5.large", storageGB: 100, multiAZ: true, readReplicas: 1 } },
    { label: "HA", config: { instanceClass: "db.r5.large", storageGB: 500, multiAZ: true, readReplicas: 2 } },
  ],
  dynamodb: [
    { label: "On-Demand", config: { capacityMode: "on-demand", readCapacityUnits: 0, writeCapacityUnits: 0 } },
    { label: "Low", config: { capacityMode: "provisioned", readCapacityUnits: 5, writeCapacityUnits: 5 } },
    { label: "High", config: { capacityMode: "provisioned", readCapacityUnits: 100, writeCapacityUnits: 100 } },
  ],
  elasticache: [
    { label: "t3.micro ×1", config: { nodeType: "cache.t3.micro", nodeCount: 1 } },
    { label: "t3.medium ×2", config: { nodeType: "cache.t3.medium", nodeCount: 2 } },
    { label: "r6g.large ×3", config: { nodeType: "cache.r6g.large", nodeCount: 3 } },
  ],
  eks: [
    { label: "Dev (1 nó)", config: { nodeCount: 1, instanceType: "t3.medium", minNodes: 1, maxNodes: 3 } },
    { label: "Prod (3 nós)", config: { nodeCount: 3, instanceType: "m5.large", minNodes: 2, maxNodes: 10 } },
    { label: "HA (5 nós)", config: { nodeCount: 5, instanceType: "m5.xlarge", minNodes: 3, maxNodes: 20 } },
  ],
  bedrock: [
    { label: "Haiku", config: { modelId: "anthropic.claude-3-haiku", requestsPerMonth: 50_000, inputTokensPerRequest: 500, outputTokensPerRequest: 200 } },
    { label: "Sonnet", config: { modelId: "anthropic.claude-3-sonnet", requestsPerMonth: 10_000, inputTokensPerRequest: 1000, outputTokensPerRequest: 500 } },
    { label: "Titan", config: { modelId: "amazon.titan-text-express", requestsPerMonth: 100_000, inputTokensPerRequest: 300, outputTokensPerRequest: 150 } },
  ],
  "sfn-express": [
    { label: "Low", config: { executionsPerMonth: 10_000, avgDurationSec: 2, memoryMB: 64 } },
    { label: "Standard", config: { executionsPerMonth: 100_000, avgDurationSec: 5, memoryMB: 64 } },
    { label: "High", config: { executionsPerMonth: 1_000_000, avgDurationSec: 10, memoryMB: 128 } },
  ],
  "eventbridge-pipes": [
    { label: "Low", config: { eventsPerMonth: 100_000, filterRatio: 0.5 } },
    { label: "Standard", config: { eventsPerMonth: 1_000_000, filterRatio: 1.0 } },
    { label: "High", config: { eventsPerMonth: 10_000_000, filterRatio: 1.0 } },
  ],
};
import { cn } from "@/lib/utils";
import { useFlowStore, selectInfraHostOptions } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { registry } from "@/registry";
import { appComponentRegistry } from "@/registry/app-components";

export interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

interface NodeContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onStartRename: (nodeId: string) => void;
}

export function NodeContextMenu({ menu, onClose, onStartRename }: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    removeNode,
    duplicateNode,
    removeAppComponent,
    duplicateAppComponent,
    solutionNodes,
    nodes,
    updateAppComponentData,
    updateNodeConfig,
  } = useFlowStore();
  const infraHosts = useFlowStore(selectInfraHostOptions);
  const { selectNode } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

  const isL2 = solutionNodes.some((n) => n.id === menu.nodeId);
  const l2Node = isL2 ? solutionNodes.find((n) => n.id === menu.nodeId) : null;
  const l1Node = !isL2 ? nodes.find((n) => n.id === menu.nodeId) : null;

  // Resolve node label and type for header
  const nodeLabel = isL2 ? l2Node?.data.label : l1Node?.data.label;
  const nodeType = isL2 ? l2Node?.data.type : l1Node?.data.type;
  const nodeTypeDef = isL2
    ? (nodeType ? appComponentRegistry.get(nodeType as never) : null)
    : (nodeType ? registry.get(nodeType as never) : null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const menuWidth = 240;
  const menuHeight = isL2 ? 360 : 200;
  const x = Math.min(menu.x, viewportWidth - menuWidth - 8);
  const y = Math.min(menu.y, viewportHeight - menuHeight - 8);

  const action = (fn: () => void) => {
    fn();
    onClose();
  };

  const handleRemove = isL2 ? removeAppComponent : removeNode;
  const handleDuplicate = isL2 ? duplicateAppComponent : duplicateNode;

  return (
    <div
      ref={menuRef}
      style={{ left: x, top: y }}
      className="fixed z-50 w-60 bg-background/95 backdrop-blur-sm border border-border/80 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Node info header */}
      <div className="px-3 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          {nodeTypeDef && (
            <div className={cn("p-1 rounded-md shrink-0", nodeTypeDef.bgColor)}>
              <div className={cn("w-3 h-3", nodeTypeDef.color)}>
                {/* Small type indicator */}
              </div>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{nodeLabel}</p>
            <p className="text-[10px] text-muted-foreground">
              {nodeTypeDef?.label ?? nodeType}
              {isL2 && <span className="ml-1 text-violet-500 font-medium">· L2</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Primary actions */}
      <div className="py-1">
        <MenuSection label="Ações">
          <MenuItem
            icon={<PenLine className="w-3.5 h-3.5" />}
            label="Renomear"
            shortcut="F2"
            onClick={() => action(() => onStartRename(menu.nodeId))}
          />
          <MenuItem
            icon={<Copy className="w-3.5 h-3.5" />}
            label="Duplicar"
            shortcut="Ctrl+D"
            onClick={() => action(() => handleDuplicate(menu.nodeId))}
          />
          <MenuItem
            icon={<Settings className="w-3.5 h-3.5" />}
            label="Propriedades"
            onClick={() =>
              action(() => {
                selectNode(menu.nodeId);
                openPropertiesPanel();
              })
            }
          />
        </MenuSection>
      </div>

      {/* L2-specific: Move to host */}
      {isL2 && l2Node && infraHosts.length > 1 && (
        <>
          <div className="border-t border-border/60" />
          <div className="py-1">
            <MenuSection label="Mover para host">
              {infraHosts
                .filter((h) => h.id !== l2Node.data.hostInfrastructureNodeId)
                .slice(0, 4)
                .map((host) => (
                  <MenuItem
                    key={host.id}
                    icon={<Server className="w-3.5 h-3.5" />}
                    label={host.data.label}
                    sublabel={host.data.type}
                    onClick={() =>
                      action(() =>
                        updateAppComponentData(menu.nodeId, {
                          hostInfrastructureNodeId: host.id,
                        })
                      )
                    }
                  />
                ))}
            </MenuSection>
          </div>
        </>
      )}

      {/* L2-specific: Quick scale */}
      {isL2 && l2Node && (l2Node.data.config as unknown as Record<string, unknown>).replicas !== undefined && (
        <>
          <div className="border-t border-border/60" />
          <div className="py-1">
            <MenuSection label="Escalar réplicas">
              <div className="flex gap-1 px-3 py-1.5 flex-wrap">
                {[1, 2, 3, 5, 10].map((count) => {
                  const isActive =
                    (l2Node.data.config as unknown as Record<string, unknown>).replicas === count;
                  return (
                    <button
                      key={count}
                      onClick={() =>
                        action(() =>
                          useFlowStore.getState().updateAppComponentConfig(menu.nodeId, { replicas: count })
                        )
                      }
                      className={cn(
                        "flex items-center justify-center gap-0.5 w-9 h-7 rounded-md text-xs font-semibold transition-all",
                        isActive
                          ? "bg-violet-500 text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <ArrowUpDown className="w-2.5 h-2.5 shrink-0" />
                      {count}
                    </button>
                  );
                })}
              </div>
            </MenuSection>
          </div>
        </>
      )}

      {/* L1-specific: Config presets */}
      {!isL2 && l1Node && nodeType && SERVICE_PRESETS[nodeType] && (
        <>
          <div className="border-t border-border/60" />
          <div className="py-1">
            <MenuSection label="Configurações rápidas">
              <div className="flex gap-1 px-3 py-1.5 flex-wrap">
                {SERVICE_PRESETS[nodeType]!.map((preset) => {
                  const cfg = l1Node.data.config as unknown as Record<string, unknown>;
                  const isActive = Object.entries(preset.config).every(([k, v]) => cfg[k] === v);
                  return (
                    <button
                      key={preset.label}
                      onClick={() =>
                        action(() => updateNodeConfig(menu.nodeId, preset.config))
                      }
                      className={cn(
                        "flex items-center justify-center gap-0.5 px-2.5 h-7 rounded-md text-xs font-semibold transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <Zap className="w-2.5 h-2.5 shrink-0" />
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </MenuSection>
          </div>
        </>
      )}

      {/* Danger zone */}
      <div className="border-t border-border/60 py-1">
        <MenuItem
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label="Remover"
          shortcut="Del"
          danger
          onClick={() => action(() => handleRemove(menu.nodeId))}
        />
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </div>
      {children}
    </>
  );
}

function MenuItem({
  icon,
  label,
  sublabel,
  shortcut,
  danger,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  shortcut?: string;
  danger?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : active
          ? "bg-primary/8 text-primary font-medium"
          : "text-foreground hover:bg-muted/70"
      )}
      onClick={onClick}
    >
      <span className={cn("shrink-0", danger ? "text-destructive" : active ? "text-primary" : "text-muted-foreground")}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {sublabel && <span className="text-[10px] text-muted-foreground shrink-0">{sublabel}</span>}
      {shortcut && (
        <kbd className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono ml-auto shrink-0">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
