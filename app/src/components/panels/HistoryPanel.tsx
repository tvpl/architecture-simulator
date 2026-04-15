"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, RotateCcw, Trash2, Clock, Save, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHistoryStore, type Snapshot } from "@/stores/history-store";
import { useFlowStore } from "@/stores/flow-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DiffBadge {
  nodeDiff: number;
  edgeDiff: number;
}

function computeDiff(snap: Snapshot, currentNodes: number, currentEdges: number): DiffBadge {
  return {
    nodeDiff: snap.nodes.length - currentNodes,
    edgeDiff: snap.edges.length - currentEdges,
  };
}

function DiffBadges({ diff }: { diff: DiffBadge }) {
  if (diff.nodeDiff === 0 && diff.edgeDiff === 0) {
    return <span className="text-[9px] text-muted-foreground">igual ao atual</span>;
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {diff.nodeDiff !== 0 && (
        <span className={cn(
          "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
          diff.nodeDiff > 0
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
        )}>
          {diff.nodeDiff > 0 ? <Plus className="w-2 h-2" /> : <Minus className="w-2 h-2" />}
          {Math.abs(diff.nodeDiff)} {Math.abs(diff.nodeDiff) === 1 ? "nó" : "nós"}
        </span>
      )}
      {diff.edgeDiff !== 0 && (
        <span className={cn(
          "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
          diff.edgeDiff > 0
            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
            : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
        )}>
          {diff.edgeDiff > 0 ? <Plus className="w-2 h-2" /> : <Minus className="w-2 h-2" />}
          {Math.abs(diff.edgeDiff)} {Math.abs(diff.edgeDiff) === 1 ? "conexão" : "conexões"}
        </span>
      )}
    </div>
  );
}

export function HistoryPanel() {
  const { snapshots, historyPanelOpen, saveSnapshot, loadSnapshot, deleteSnapshot, toggleHistoryPanel } =
    useHistoryStore();
  const currentNodeCount = useFlowStore((s) => s.nodes.length);
  const currentEdgeCount = useFlowStore((s) => s.edges.length);

  const [snapshotName, setSnapshotName] = useState("");

  const handleSave = () => {
    saveSnapshot(snapshotName || undefined);
    setSnapshotName("");
    toast.success("Snapshot salvo com sucesso.");
  };

  const handleLoad = (id: string, name: string) => {
    loadSnapshot(id);
    toast.success(`Versão "${name}" restaurada.`);
  };

  const handleDelete = (id: string, name: string) => {
    deleteSnapshot(id);
    toast.info(`Snapshot "${name}" removido.`);
  };

  return (
    <AnimatePresence>
      {historyPanelOpen && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute top-2 left-2 bottom-2 w-72 z-20 flex flex-col bg-background border border-border rounded-xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Histórico de Versões</div>
              <div className="text-xs text-muted-foreground">{snapshots.length} snapshot(s) salvo(s)</div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleHistoryPanel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Save current state */}
          <div className="p-3 border-b border-border shrink-0 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Salvar estado atual
            </div>
            <div className="flex gap-2">
              <Input
                className="h-8 text-sm flex-1"
                placeholder="Nome do snapshot (opcional)"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button size="sm" className="h-8 gap-1.5 shrink-0" onClick={handleSave}>
                <Save className="w-3.5 h-3.5" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Snapshot list */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {snapshots.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Nenhum snapshot salvo ainda.
                </div>
              )}
              {[...snapshots]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((snap, idx) => (
                  <div key={snap.id}>
                    {idx > 0 && <Separator className="mb-2" />}
                    <div className="rounded-lg border border-border p-2.5 space-y-1.5 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{snap.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(snap.timestamp)}
                          </div>
                          <div className="mt-1.5">
                            <DiffBadges diff={computeDiff(snap, currentNodeCount, currentEdgeCount)} />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive")}
                          onClick={() => handleDelete(snap.id, snap.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 gap-1.5 text-xs"
                        onClick={() => handleLoad(snap.id, snap.name)}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
