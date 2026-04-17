"use client";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, GitCompare, Plus, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";
import { useHistoryStore, type Snapshot } from "@/stores/history-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

// ── Diff helpers ──────────────────────────────────────────────────────────────

interface DiffResult {
  nodesAdded: Array<{ id: string; label: string }>;
  nodesRemoved: Array<{ id: string; label: string }>;
  edgesAdded: Array<{ id: string; label: string }>;
  edgesRemoved: Array<{ id: string; label: string }>;
}

function computeDiff(snapshot: Snapshot): DiffResult {
  const flowState = useFlowStore.getState();
  const currentNodes = flowState.nodes;
  const currentEdges = flowState.edges;

  const snapNodeIds = new Set(snapshot.nodes.map((n) => n.id));
  const currentNodeIds = new Set(currentNodes.map((n) => n.id));
  const snapEdgeIds = new Set(snapshot.edges.map((e) => e.id));
  const currentEdgeIds = new Set(currentEdges.map((e) => e.id));

  const nodesAdded = currentNodes
    .filter((n) => !snapNodeIds.has(n.id))
    .map((n) => ({ id: n.id, label: n.data.label ?? n.id }));

  const nodesRemoved = snapshot.nodes
    .filter((n) => !currentNodeIds.has(n.id))
    .map((n) => ({ id: n.id, label: n.data.label ?? n.id }));

  const edgesAdded = currentEdges
    .filter((e) => !snapEdgeIds.has(e.id))
    .map((e) => ({
      id: e.id,
      label: e.data
        ? `${e.source} → ${e.target}`
        : `${e.source} → ${e.target}`,
    }));

  const edgesRemoved = snapshot.edges
    .filter((e) => !currentEdgeIds.has(e.id))
    .map((e) => ({
      id: e.id,
      label: e.data
        ? `${e.source} → ${e.target}`
        : `${e.source} → ${e.target}`,
    }));

  return { nodesAdded, nodesRemoved, edgesAdded, edgesRemoved };
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function DiffBadge({
  count,
  variant,
}: {
  count: number;
  variant: "added" | "removed";
}) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
        variant === "added"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
      )}
    >
      {variant === "added" ? (
        <Plus className="w-2.5 h-2.5" />
      ) : (
        <Minus className="w-2.5 h-2.5" />
      )}
      {count}
    </span>
  );
}

// ── Diff item list ────────────────────────────────────────────────────────────

function DiffList({
  items,
  variant,
  label,
}: {
  items: Array<{ id: string; label: string }>;
  variant: "added" | "removed";
  label: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <div
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          variant === "added"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        )}
      >
        {label}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
            variant === "added"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300"
          )}
        >
          {variant === "added" ? (
            <Plus className="w-3 h-3 shrink-0" />
          ) : (
            <Minus className="w-3 h-3 shrink-0" />
          )}
          <span className="truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Snapshot list item ────────────────────────────────────────────────────────

function SnapshotItem({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: Snapshot;
  selected: boolean;
  onSelect: () => void;
}) {
  const date = new Date(snapshot.timestamp);
  const formatted = `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border",
        selected
          ? "bg-primary/10 border-primary/40 text-primary"
          : "bg-muted/40 border-transparent hover:bg-muted/70 text-foreground"
      )}
    >
      <div className="font-medium truncate">{snapshot.name}</div>
      <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
        <span>{formatted}</span>
        <span>·</span>
        <span>{snapshot.nodes.length} nós</span>
        <span>·</span>
        <span>{snapshot.edges.length} conexões</span>
      </div>
    </button>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ComparisonPanel() {
  const comparisonModeActive = useUIStore((s) => s.comparisonModeActive);
  const toggleComparisonMode = useUIStore((s) => s.toggleComparisonMode);
  const snapshots = useHistoryStore((s) => s.snapshots);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSnapshot = useMemo(
    () => snapshots.find((s) => s.id === selectedId) ?? null,
    [snapshots, selectedId]
  );

  // Recompute diff whenever nodes/edges change or snapshot changes
  const currentNodes = useFlowStore((s) => s.nodes);
  const currentEdges = useFlowStore((s) => s.edges);

  const diff = useMemo<DiffResult | null>(() => {
    if (!selectedSnapshot) return null;
    return computeDiff(selectedSnapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSnapshot, currentNodes, currentEdges]);

  const totalChanges = diff
    ? diff.nodesAdded.length +
      diff.nodesRemoved.length +
      diff.edgesAdded.length +
      diff.edgesRemoved.length
    : 0;

  return (
    <AnimatePresence>
      {comparisonModeActive && (
        <motion.div
          key="comparison-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="absolute top-3 right-3 z-20 w-80 flex flex-col rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl overflow-hidden"
          style={{ maxHeight: "calc(100vh - 5rem)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <GitCompare className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-none">
                Modo Comparação
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Compare o estado atual com um snapshot
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={toggleComparisonMode}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 overflow-hidden">
            <div className="px-4 py-3 space-y-4">
              {/* Snapshot list */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Snapshots disponíveis
                </div>
                {snapshots.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
                    Nenhum snapshot salvo ainda.
                    <br />
                    Use o painel de Histórico para criar snapshots.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {snapshots.map((snap) => (
                      <SnapshotItem
                        key={snap.id}
                        snapshot={snap}
                        selected={selectedId === snap.id}
                        onSelect={() =>
                          setSelectedId(
                            selectedId === snap.id ? null : snap.id
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Diff summary */}
              {diff && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex-1">
                      Diferenças
                    </div>
                    <div className="flex items-center gap-1">
                      <DiffBadge
                        count={
                          diff.nodesAdded.length + diff.edgesAdded.length
                        }
                        variant="added"
                      />
                      <DiffBadge
                        count={
                          diff.nodesRemoved.length + diff.edgesRemoved.length
                        }
                        variant="removed"
                      />
                    </div>
                  </div>

                  {totalChanges === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                      Nenhuma diferença encontrada.
                      <br />O estado atual é idêntico ao snapshot.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Nodes section */}
                      {(diff.nodesAdded.length > 0 ||
                        diff.nodesRemoved.length > 0) && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                            <span>Nós</span>
                            <DiffBadge
                              count={diff.nodesAdded.length}
                              variant="added"
                            />
                            <DiffBadge
                              count={diff.nodesRemoved.length}
                              variant="removed"
                            />
                          </div>
                          <DiffList
                            items={diff.nodesAdded}
                            variant="added"
                            label="Adicionados"
                          />
                          <DiffList
                            items={diff.nodesRemoved}
                            variant="removed"
                            label="Removidos"
                          />
                        </div>
                      )}

                      {/* Edges section */}
                      {(diff.edgesAdded.length > 0 ||
                        diff.edgesRemoved.length > 0) && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            <span>Conexões</span>
                            <DiffBadge
                              count={diff.edgesAdded.length}
                              variant="added"
                            />
                            <DiffBadge
                              count={diff.edgesRemoved.length}
                              variant="removed"
                            />
                          </div>
                          <DiffList
                            items={diff.edgesAdded}
                            variant="added"
                            label="Adicionadas"
                          />
                          <DiffList
                            items={diff.edgesRemoved}
                            variant="removed"
                            label="Removidas"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={toggleComparisonMode}
            >
              <X className="w-3.5 h-3.5" />
              Sair do modo comparação
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
