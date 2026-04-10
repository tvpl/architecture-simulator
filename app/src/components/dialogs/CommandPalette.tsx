"use client";
/**
 * CommandPalette — global ⌘K / Ctrl+K command palette.
 * Search across: actions, layers, nodes on canvas, services.
 * Built with Radix Dialog + framer-motion for buttery smooth UX.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Layers, Boxes, DollarSign, Play, LayoutTemplate, History,
  ShieldAlert, Calculator, Download, LayoutGrid, Grid3x3, Moon, Sun,
  Presentation, Cpu, FileCode2, ImageDown, Link, Trash2, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommandPaletteStore } from "@/stores/command-palette-store";
import { useLayerStore } from "@/stores/layer-store";
import { useFlowStore, selectDomainNodes, selectDomainEdges } from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";
import { useThemeStore } from "@/stores/theme-store";
import { useHistoryStore } from "@/stores/history-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { registry } from "@/registry";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";
import { toast } from "sonner";
import type { LayerType } from "@/domain/entities/layer";

// ── Command definition ────────────────────────────────────────────────────────

interface Command {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  group: string;
  keywords?: string[];
  action: () => void;
}

// ── CommandPalette ────────────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { setActiveLayer } = useLayerStore();
  const { nodes, solutionNodes, clearCanvas } = useFlowStore();
  const {
    toggleValidationPanel, toggleWhatIfPanel, requestAutoLayout,
    toggleSnapToGrid, togglePresentationMode, openSimulationPanel,
    openPropertiesPanel,
  } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleHistoryPanel } = useHistoryStore();
  const { setRunning, setResult, setError, reset } = useSimulationStore();

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveIdx(0);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ── Define all static commands ────────────────────────────────────────────

  const staticCommands = useMemo<Command[]>(() => [
    // Layer switches
    { id: "layer-l1", label: "L1 — Arquitetura", sublabel: "Infraestrutura AWS", icon: <Layers className="w-4 h-4 text-blue-500" />, group: "Camadas", keywords: ["layer", "aws", "infra"], action: () => { setActiveLayer("architecture"); close(); } },
    { id: "layer-l2", label: "L2 — Design de Solução", sublabel: "Microsserviços e K8s", icon: <Boxes className="w-4 h-4 text-violet-500" />, group: "Camadas", keywords: ["layer", "k8s", "pods"], action: () => { setActiveLayer("solution-design"); close(); } },
    { id: "layer-l3", label: "L3 — Custos", sublabel: "Dashboard de custos", icon: <DollarSign className="w-4 h-4 text-emerald-500" />, group: "Camadas", keywords: ["cost", "custo", "billing"], action: () => { setActiveLayer("cost"); close(); } },
    { id: "layer-l4", label: "L4 — Simulação", sublabel: "Performance e latência", icon: <Play className="w-4 h-4 text-orange-500" />, group: "Camadas", keywords: ["simulation", "latency", "throughput"], action: () => { setActiveLayer("simulation"); close(); } },

    // Actions
    { id: "act-simulate", label: "Simular arquitetura", sublabel: "Executar análise completa", icon: <Play className="w-4 h-4" />, group: "Ações", keywords: ["run", "execute"], action: async () => { close(); const domainNodes = selectDomainNodes(useFlowStore.getState()); const domainEdges = selectDomainEdges(useFlowStore.getState()); if (!domainNodes.length) { toast.warning("Adicione componentes primeiro."); return; } setRunning(); openSimulationPanel(); toast.loading("Simulando...", { id: "sim" }); try { const res = await fetch("/api/simulation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodes: domainNodes, edges: domainEdges }) }); const result = await res.json(); setResult(result); toast.success("Simulação concluída!", { id: "sim" }); } catch { setError("Erro"); toast.error("Falha na simulação.", { id: "sim" }); } } },
    { id: "act-layout", label: "Auto-organizar diagrama", sublabel: "Layout Dagre top-to-bottom", icon: <LayoutGrid className="w-4 h-4" />, group: "Ações", action: () => { requestAutoLayout("TB"); close(); } },
    { id: "act-templates", label: "Abrir templates", icon: <LayoutTemplate className="w-4 h-4" />, group: "Ações", keywords: ["template", "exemplo"], action: () => { close(); /* templates dialog handled externally */ toast.info("Use o menu Painéis → Templates"); } },
    { id: "act-history", label: "Histórico de versões", icon: <History className="w-4 h-4" />, group: "Ações", action: () => { toggleHistoryPanel(); close(); } },
    { id: "act-validation", label: "Painel de validação", icon: <ShieldAlert className="w-4 h-4" />, group: "Ações", action: () => { toggleValidationPanel(); close(); } },
    { id: "act-whatif", label: "Análise what-if", icon: <Calculator className="w-4 h-4" />, group: "Ações", action: () => { toggleWhatIfPanel(); close(); } },
    { id: "act-results", label: "Ver resultados da simulação", icon: <Play className="w-4 h-4" />, group: "Ações", action: () => { openSimulationPanel(); close(); } },

    // View
    { id: "view-snap", label: "Ativar/desativar grade", icon: <Grid3x3 className="w-4 h-4" />, group: "Visualização", action: () => { toggleSnapToGrid(); close(); } },
    { id: "view-presentation", label: "Modo apresentação", icon: <Presentation className="w-4 h-4" />, group: "Visualização", action: () => { togglePresentationMode(); close(); } },
    { id: "view-theme", label: theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro", icon: theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />, group: "Visualização", action: () => { toggleTheme(); close(); } },

    // Danger
    { id: "act-clear", label: "Limpar canvas", sublabel: "Remove todos os componentes", icon: <Trash2 className="w-4 h-4 text-destructive" />, group: "Perigo", action: () => { if (confirm("Limpar canvas?")) { clearCanvas(); reset(); toast.info("Canvas limpo."); } close(); } },
  ], [setActiveLayer, close, requestAutoLayout, toggleValidationPanel, toggleWhatIfPanel, toggleHistoryPanel, toggleSnapToGrid, togglePresentationMode, openSimulationPanel, theme, toggleTheme, clearCanvas, reset, setRunning, setResult, setError]);

  // ── Dynamic commands from canvas nodes ───────────────────────────────────

  const nodeCommands = useMemo<Command[]>(() => {
    return nodes.map((n) => {
      const def = registry.get(n.data.type);
      return {
        id: `node-${n.id}`,
        label: n.data.label,
        sublabel: def?.label ?? n.data.type,
        icon: def ? (
          <div className={cn("p-1 rounded-md", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-3 h-3", def.color)} />
          </div>
        ) : <Cpu className="w-4 h-4" />,
        group: "Componentes no canvas",
        keywords: [n.data.type, def?.category ?? ""],
        action: () => {
          close();
        },
      };
    });
  }, [nodes, close]);

  // ── Fuzzy filter ──────────────────────────────────────────────────────────

  const allCommands = useMemo(() => [...staticCommands, ...nodeCommands], [staticCommands, nodeCommands]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands.slice(0, 12);
    const q = query.toLowerCase();
    return allCommands.filter((cmd) => {
      const haystack = [cmd.label, cmd.sublabel ?? "", ...(cmd.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    }).slice(0, 12);
  }, [allCommands, query]);

  // Group filtered results
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    }
    return map;
  }, [filtered]);

  // Flatten for keyboard nav index
  const flatFiltered = useMemo(() => filtered, [filtered]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatFiltered[activeIdx]?.action();
      } else if (e.key === "Escape") {
        close();
      }
    },
    [flatFiltered, activeIdx, close]
  );

  // ── Global shortcut ───────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useCommandPaletteStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset activeIdx when query changes
  useEffect(() => setActiveIdx(0), [query]);

  let globalIdx = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" data-command-dialog>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar ação, camada, componente..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shrink-0">
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1.5">
                {grouped.size === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum resultado para</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">"{query}"</p>
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([group, cmds]) => (
                    <div key={group}>
                      <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {group}
                      </div>
                      {cmds.map((cmd) => {
                        const idx = globalIdx++;
                        const isActive = idx === activeIdx;
                        return (
                          <button
                            key={cmd.id}
                            onMouseEnter={() => setActiveIdx(idx)}
                            onClick={cmd.action}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                              isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
                            )}
                          >
                            <span className="shrink-0 text-muted-foreground">{cmd.icon}</span>
                            <span className="flex-1 truncate font-medium">{cmd.label}</span>
                            {cmd.sublabel && (
                              <span className="text-xs text-muted-foreground shrink-0">{cmd.sublabel}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-muted px-1 py-0.5 rounded border border-border font-mono">↑↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-muted px-1 py-0.5 rounded border border-border font-mono">↵</kbd>
                  executar
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-muted px-1 py-0.5 rounded border border-border font-mono">Esc</kbd>
                  fechar
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
