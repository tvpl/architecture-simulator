"use client";
/**
 * NodeContextMenu — floating right-click context menu for canvas nodes.
 * Layer-aware: shows L2-specific actions for app components.
 */
import React, { useEffect, useRef } from "react";
import { Copy, Trash2, PenLine, Layers, Server, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore, selectInfraHostOptions } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";

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
  const { removeNode, duplicateNode, removeAppComponent, duplicateAppComponent, solutionNodes, updateAppComponentData } = useFlowStore();
  const infraHosts = useFlowStore(selectInfraHostOptions);
  const { selectNode } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

  // Determine if this is an L2 node
  const isL2 = solutionNodes.some((n) => n.id === menu.nodeId);
  const l2Node = isL2 ? solutionNodes.find((n) => n.id === menu.nodeId) : null;

  // Close on outside click or Escape
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

  // Adjust position so menu doesn't overflow viewport
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const menuWidth = 220;
  const menuHeight = isL2 ? 280 : 160;
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
      className="fixed z-50 w-52 bg-background border border-border rounded-lg shadow-xl overflow-hidden py-1"
    >
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
        icon={<Layers className="w-3.5 h-3.5" />}
        label="Propriedades"
        onClick={() => action(() => {
          selectNode(menu.nodeId);
          openPropertiesPanel();
        })}
      />

      {/* L2-specific: Change host submenu */}
      {isL2 && l2Node && infraHosts.length > 1 && (
        <>
          <div className="my-1 border-t border-border" />
          <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Mover para host
          </div>
          {infraHosts
            .filter((h) => h.id !== l2Node.data.hostInfrastructureNodeId)
            .slice(0, 5)
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
        </>
      )}

      {/* L2-specific: Quick scale */}
      {isL2 && l2Node && (l2Node.data.config as unknown as Record<string, unknown>).replicas !== undefined && (
        <>
          <div className="my-1 border-t border-border" />
          <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Escalar réplicas
          </div>
          {[1, 2, 3, 5, 10].map((count) => (
            <MenuItem
              key={count}
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
              label={`${count} réplica${count > 1 ? "s" : ""}`}
              active={(l2Node.data.config as unknown as Record<string, unknown>).replicas === count}
              onClick={() =>
                action(() =>
                  useFlowStore.getState().updateAppComponentConfig(menu.nodeId, { replicas: count })
                )
              }
            />
          ))}
        </>
      )}

      <div className="my-1 border-t border-border" />
      <MenuItem
        icon={<Trash2 className="w-3.5 h-3.5" />}
        label="Remover"
        shortcut="Del"
        danger
        onClick={() => action(() => handleRemove(menu.nodeId))}
      />
    </div>
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
          ? "bg-primary/10 text-primary hover:bg-primary/15"
          : "text-foreground hover:bg-muted"
      )}
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      {shortcut && (
        <kbd className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border font-mono">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
