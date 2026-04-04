"use client";
/**
 * PropertiesPanel — config panel for the selected node or edge.
 * Renders fields from the ServiceDefinition.configSections dynamically.
 */
import React, { useEffect, useState, useCallback } from "react";
import { X, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import { useSelectionStore } from "@/stores/selection-store";
import { useFlowStore } from "@/stores/flow-store";
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

export function PropertiesPanel() {
  const { propertiesPanelOpen, closePropertiesPanel } = useUIStore();
  const { selectedNodeId, selectedEdgeId } = useSelectionStore();
  const { nodes, edges, updateNodeData, updateNodeConfig, updateEdgeData, removeNode, removeEdge, duplicateNode } =
    useFlowStore();

  if (!propertiesPanelOpen || (!selectedNodeId && !selectedEdgeId)) return null;

  return (
    <div className="absolute top-2 right-2 bottom-2 w-80 z-20 flex flex-col bg-background border border-border rounded-xl shadow-xl overflow-hidden">
      {selectedNodeId && (
        <NodePropertiesContent
          nodeId={selectedNodeId}
          nodes={nodes}
          onUpdate={updateNodeData}
          onUpdateConfig={updateNodeConfig}
          onRemove={removeNode}
          onDuplicate={duplicateNode}
          onClose={closePropertiesPanel}
        />
      )}
      {selectedEdgeId && !selectedNodeId && (
        <EdgePropertiesContent
          edgeId={selectedEdgeId}
          edges={edges}
          nodes={nodes}
          onUpdate={updateEdgeData}
          onRemove={removeEdge}
          onClose={closePropertiesPanel}
        />
      )}
    </div>
  );
}

// ── Node Properties ──────────────────────────────────────────────────────────

function NodePropertiesContent({
  nodeId,
  nodes,
  onUpdate,
  onUpdateConfig,
  onRemove,
  onDuplicate,
  onClose,
}: {
  nodeId: string;
  nodes: import("@/stores/flow-store").FlowNode[];
  onUpdate: (id: string, patch: Partial<import("@/domain/entities/node").ArchitectureNode>) => void;
  onUpdateConfig: (id: string, config: Partial<Record<string, unknown>>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onClose: () => void;
}) {
  const flowNode = nodes.find((n) => n.id === nodeId);
  if (!flowNode) return null;

  const data = flowNode.data;
  const def = registry.get(data.type);

  const [label, setLabel] = useState(data.label);
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(
    data.config as unknown as Record<string, unknown>
  );

  useEffect(() => {
    setLabel(data.label);
    setLocalConfig(data.config as unknown as Record<string, unknown>);
  }, [nodeId, data.label, data.config]);

  const applyLabel = () => {
    if (label !== data.label) onUpdate(nodeId, { label });
  };

  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      const updated = { ...localConfig, [key]: value };
      setLocalConfig(updated);
      onUpdateConfig(nodeId, { [key]: value });
    },
    [localConfig, nodeId, onUpdateConfig]
  );

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

// ── Generic field renderer ───────────────────────────────────────────────────

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
