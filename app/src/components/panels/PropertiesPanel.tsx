"use client";
/**
 * PropertiesPanel — config panel for the selected node or edge.
 * Layer-aware: routes to infrastructure or solution design properties.
 * Renders fields from configSections dynamically via shared FieldRenderer.
 */
import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Copy, Server, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import { appComponentRegistry } from "@/registry/app-components";
import { useSelectionStore } from "@/stores/selection-store";
import { useFlowStore, selectInfraHostOptions } from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";
import { PROTOCOL_INFO, CONNECTION_PROTOCOLS } from "@/domain/entities/edge";
import type { ConfigField } from "@/registry/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";

interface PropertiesPanelProps {
  /** When true, renders as a docked split panel (no absolute positioning, no animation wrapper) */
  docked?: boolean;
}

export function PropertiesPanel({ docked = false }: PropertiesPanelProps) {
  const { propertiesPanelOpen, closePropertiesPanel, propertiesPanelDocked, togglePropertiesPanelDocked } = useUIStore();
  const { selectedNodeId, selectedEdgeId } = useSelectionStore();
  const {
    nodes, edges, updateNodeData, updateNodeConfig, updateEdgeData,
    removeNode, removeEdge, duplicateNode,
    solutionNodes, solutionEdges, removeSolutionEdge,
  } = useFlowStore();

  const hasSelection = !!selectedNodeId || !!selectedEdgeId;
  const isVisible = docked ? hasSelection : (propertiesPanelOpen && hasSelection);

  // Determine if selection is L2
  const isL2Node = selectedNodeId
    ? solutionNodes.some((n) => n.id === selectedNodeId)
    : false;
  const isL2Edge = selectedEdgeId
    ? solutionEdges.some((e) => e.id === selectedEdgeId)
    : false;

  // Dock/undock toggle button
  const DockButton = () => (
    <button
      onClick={togglePropertiesPanelDocked}
      title={propertiesPanelDocked ? "Destacar painel" : "Ancorar painel"}
      className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {propertiesPanelDocked
        ? <PanelRightOpen className="w-3.5 h-3.5" />
        : <PanelRightClose className="w-3.5 h-3.5" />}
    </button>
  );

  const panelContent = isVisible ? (
    <div className={cn(
      "flex flex-col bg-background overflow-hidden",
      docked
        ? "h-full w-full"
        : "absolute top-2 right-2 bottom-2 w-80 z-20 border border-border rounded-xl shadow-xl"
    )}>
      {/* L1 Node */}
      {selectedNodeId && !isL2Node && (
        <NodePropertiesContent
          key={selectedNodeId}
          nodeId={selectedNodeId}
          nodes={nodes}
          onUpdate={updateNodeData}
          onUpdateConfig={updateNodeConfig}
          onRemove={removeNode}
          onDuplicate={duplicateNode}
          onClose={closePropertiesPanel}
          extraHeaderActions={<DockButton />}
        />
      )}

      {/* L2 Node */}
      {selectedNodeId && isL2Node && (
        <AppComponentPropertiesContent
          key={selectedNodeId}
          nodeId={selectedNodeId}
          onClose={closePropertiesPanel}
        />
      )}

      {/* L1 Edge */}
      {selectedEdgeId && !selectedNodeId && !isL2Edge && (
        <EdgePropertiesContent
          edgeId={selectedEdgeId}
          edges={edges}
          nodes={nodes}
          onUpdate={updateEdgeData}
          onRemove={removeEdge}
          onClose={closePropertiesPanel}
        />
      )}

      {/* L2 Edge */}
      {selectedEdgeId && !selectedNodeId && isL2Edge && (
        <EdgePropertiesContent
          edgeId={selectedEdgeId}
          edges={solutionEdges}
          nodes={nodes}
          onUpdate={updateEdgeData}
          onRemove={removeSolutionEdge}
          onClose={closePropertiesPanel}
        />
      )}

      {/* Docked but nothing selected */}
      {docked && !hasSelection && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="p-3 rounded-xl bg-muted/50">
            <Server className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Selecione um nó ou conexão no canvas para ver e editar suas propriedades.
          </p>
          <button
            onClick={togglePropertiesPanelDocked}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <PanelRightOpen className="w-3 h-3" />
            Fechar painel lateral
          </button>
        </div>
      )}
    </div>
  ) : null;

  if (docked) {
    return panelContent;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute top-2 right-2 bottom-2 w-80 z-20"
        >
          {panelContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── L1 Node Properties ──────────────────────────────────────────────────────

function NodePropertiesContent({
  nodeId,
  nodes,
  onUpdate,
  onUpdateConfig,
  onRemove,
  onDuplicate,
  onClose,
  extraHeaderActions,
}: {
  nodeId: string;
  nodes: import("@/stores/flow-store").FlowNode[];
  onUpdate: (id: string, patch: Partial<import("@/domain/entities/node").ArchitectureNode>) => void;
  onUpdateConfig: (id: string, config: Partial<Record<string, unknown>>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onClose: () => void;
  extraHeaderActions?: React.ReactNode;
}) {
  const flowNode = nodes.find((n) => n.id === nodeId);
  const data = flowNode?.data;
  const def = data ? registry.get(data.type) : undefined;

  const [label, setLabel] = useState(data?.label ?? "");
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(
    (data?.config as unknown as Record<string, unknown>) ?? {}
  );

  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      const updated = { ...localConfig, [key]: value };
      setLocalConfig(updated);
      onUpdateConfig(nodeId, { [key]: value });
    },
    [localConfig, nodeId, onUpdateConfig]
  );

  if (!flowNode || !data) return null;

  const applyLabel = () => {
    if (label !== data.label) onUpdate(nodeId, { label });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
        {def && (
          <div className={cn("p-1.5 rounded-lg", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-4 h-4", def.color)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{data.label}</div>
          <div className="text-xs text-muted-foreground">{def?.label ?? data.type}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
        {extraHeaderActions}
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 px-3 pt-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-7 text-xs"
          onClick={() => onDuplicate(nodeId)}
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-7 text-xs text-destructive hover:text-destructive"
          onClick={() => { onRemove(nodeId); onClose(); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remover
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={applyLabel}
              onKeyDown={(e) => e.key === "Enter" && applyLabel()}
              className="h-8 text-sm"
            />
          </div>

          <Separator />

          {/* Config sections */}
          {def?.configSections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </div>
              {section.fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={localConfig[field.key]}
                  onChange={(v) => handleConfigChange(field.key, v)}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

// ── L2 App Component Properties ─────────────────────────────────────────────

function AppComponentPropertiesContent({
  nodeId,
  onClose,
}: {
  nodeId: string;
  onClose: () => void;
}) {
  const solutionNodes = useFlowStore((s) => s.solutionNodes);
  const updateAppComponentData = useFlowStore((s) => s.updateAppComponentData);
  const updateAppComponentConfig = useFlowStore((s) => s.updateAppComponentConfig);
  const removeAppComponent = useFlowStore((s) => s.removeAppComponent);
  const duplicateAppComponent = useFlowStore((s) => s.duplicateAppComponent);
  const infraHosts = useFlowStore(selectInfraHostOptions);

  const flowNode = solutionNodes.find((n) => n.id === nodeId);
  const data = flowNode?.data;
  const def = data ? appComponentRegistry.get(data.type) : undefined;

  const [label, setLabel] = useState(data?.label ?? "");
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(
    (data?.config as unknown as Record<string, unknown>) ?? {}
  );

  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      const updated = { ...localConfig, [key]: value };
      setLocalConfig(updated);
      updateAppComponentConfig(nodeId, { [key]: value });
    },
    [localConfig, nodeId, updateAppComponentConfig]
  );

  if (!flowNode || !data) return null;

  const applyLabel = () => {
    if (label !== data.label) updateAppComponentData(nodeId, { label });
  };

  const currentHostId = data.hostInfrastructureNodeId;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
        {def && (
          <div className={cn("p-1.5 rounded-lg", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-4 h-4", def.color)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{data.label}</div>
          <div className="text-xs text-muted-foreground">{def?.label ?? data.type}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Help text */}
      {def?.helpText && (
        <div className="px-3 py-2 bg-blue-50/50 dark:bg-blue-950/20 border-b border-border text-[11px] text-blue-700 dark:text-blue-400">
          {def.helpText}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 px-3 pt-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-7 text-xs"
          onClick={() => duplicateAppComponent(nodeId)}
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-7 text-xs text-destructive hover:text-destructive"
          onClick={() => { removeAppComponent(nodeId); onClose(); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remover
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={applyLabel}
              onKeyDown={(e) => e.key === "Enter" && applyLabel()}
              className="h-8 text-sm"
            />
          </div>

          <Separator />

          {/* Host infrastructure selector */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-muted-foreground" />
              <Label className="text-xs">Infraestrutura Host</Label>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Selecione o componente de infraestrutura (Layer 1) que hospeda este serviço
            </p>
            <Select
              value={currentHostId}
              onValueChange={(v) =>
                updateAppComponentData(nodeId, { hostInfrastructureNodeId: v })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selecionar host..." />
              </SelectTrigger>
              <SelectContent>
                {infraHosts.map((host) => (
                  <SelectItem key={host.id} value={host.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {host.data.label}
                      <span className="text-[10px] text-muted-foreground">
                        ({host.data.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Config sections from registry */}
          {def?.configSections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </div>
              {section.fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={localConfig[field.key]}
                  onChange={(v) => handleConfigChange(field.key, v)}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

// ── Edge Properties ──────────────────────────────────────────────────────────

function EdgePropertiesContent({
  edgeId,
  edges,
  nodes,
  onUpdate,
  onRemove,
  onClose,
}: {
  edgeId: string;
  edges: import("@/stores/flow-store").FlowEdge[];
  nodes: import("@/stores/flow-store").FlowNode[];
  onUpdate: (id: string, patch: Partial<import("@/domain/entities/edge").ConnectionEdge>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge || !edge.data) return null;

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const update = (patch: Partial<typeof edge.data>) => onUpdate(edgeId, patch as Partial<import("@/domain/entities/edge").ConnectionEdge>);

  return (
    <>
      <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
        <div className="flex-1">
          <div className="text-sm font-semibold">Conexão</div>
          <div className="text-xs text-muted-foreground truncate">
            {sourceNode?.data.label ?? edge.source} → {targetNode?.data.label ?? edge.target}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Protocol */}
          <div className="space-y-1.5">
            <Label className="text-xs">Protocolo</Label>
            <Select
              value={edge.data.protocol}
              onValueChange={(v) => update({ protocol: v as import("@/domain/entities/edge").ConnectionProtocol })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_PROTOCOLS.map((p) => {
                  const info = PROTOCOL_INFO[p];
                  return (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: info.color }}
                        />
                        {info.displayName}
                        {info.isAsync && <span className="text-xs text-muted-foreground">(async)</span>}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Latency */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs">Latência</Label>
              <span className="text-xs text-muted-foreground">{edge.data.latencyMs} ms</span>
            </div>
            <Slider
              min={0}
              max={5000}
              step={5}
              value={[edge.data.latencyMs]}
              onValueChange={([v]) => update({ latencyMs: v })}
            />
          </div>

          {/* Throughput */}
          <div className="space-y-1.5">
            <Label className="text-xs">Throughput (RPS)</Label>
            <Input
              type="number"
              value={edge.data.throughputRPS}
              onChange={(e) => update({ throughputRPS: Number(e.target.value) })}
              className="h-8 text-sm"
            />
          </div>

          {/* Message count */}
          <div className="space-y-1.5">
            <Label className="text-xs">Mensagens (por simulação)</Label>
            <Input
              type="number"
              value={edge.data.messageCount}
              onChange={(e) => update({ messageCount: Number(e.target.value) })}
              className="h-8 text-sm"
            />
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-destructive hover:text-destructive"
            onClick={() => { onRemove(edgeId); onClose(); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover conexão
          </Button>
        </div>
      </ScrollArea>
    </>
  );
}

// ── Generic field renderer (shared across L1 and L2) ────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{field.label}</Label>
        {field.kind === "number" && field.unit && (
          <span className="text-xs text-muted-foreground">{field.unit}</span>
        )}
        {field.kind === "slider" && (
          <span className="text-xs text-muted-foreground">
            {value as number} {field.unit ?? ""}
          </span>
        )}
      </div>

      {field.description && (
        <p className="text-[10px] text-muted-foreground">{field.description}</p>
      )}

      {field.kind === "number" && (
        <Input
          type="number"
          value={(value as number) ?? 0}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 text-sm"
        />
      )}

      {field.kind === "text" && (
        <Input
          type="text"
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      )}

      {field.kind === "select" && (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.kind === "switch" && (
        <div className="flex items-center gap-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className="text-xs text-muted-foreground">
            {Boolean(value) ? "Ativado" : "Desativado"}
          </span>
        </div>
      )}

      {field.kind === "slider" && (
        <Slider
          min={field.min}
          max={field.max}
          step={field.step}
          value={[(value as number) ?? field.min]}
          onValueChange={([v]) => onChange(v)}
        />
      )}
    </div>
  );
}
