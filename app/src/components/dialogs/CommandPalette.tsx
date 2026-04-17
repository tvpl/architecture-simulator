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
  ShieldAlert, Calculator, LayoutGrid, Grid3x3, Moon, Sun,
  Presentation, Cpu, Trash2,
  Plus,
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

// ── Quick action card data ────────────────────────────────────────────────────

interface QuickActionCard {
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

// ── CommandPalette ────────────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Recent command tracking (in-memory only)
  const recentCommandIds = useRef<string[]>([]);

  const trackRecent = useCallback((id: string) => {
    recentCommandIds.current = [id, ...recentCommandIds.current.filter((r) => r !== id)].slice(0, 5);
  }, []);

  const { setActiveLayer } = useLayerStore();
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const { nodes, clearCanvas } = useFlowStore();
  const {
    toggleValidationPanel, toggleWhatIfPanel, requestAutoLayout,
    toggleSnapToGrid, togglePresentationMode, openSimulationPanel,
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
    { id: "layer-l1", label: "L1 — Arquitetura", sublabel: "Infraestrutura AWS", icon: <Layers className="w-4 h-4 text-blue-500" />, group: "Camadas", keywords: ["layer", "aws", "infra"], action: () => { trackRecent("layer-l1"); setActiveLayer("architecture"); close(); } },
    { id: "layer-l2", label: "L2 — Design de Solução", sublabel: "Microsserviços e K8s", icon: <Boxes className="w-4 h-4 text-violet-500" />, group: "Camadas", keywords: ["layer", "k8s", "pods"], action: () => { trackRecent("layer-l2"); setActiveLayer("solution-design"); close(); } },
    { id: "layer-l3", label: "L3 — Custos", sublabel: "Dashboard de custos", icon: <DollarSign className="w-4 h-4 text-emerald-500" />, group: "Camadas", keywords: ["cost", "custo", "billing"], action: () => { trackRecent("layer-l3"); setActiveLayer("cost"); close(); } },
    { id: "layer-l4", label: "L4 — Simulação", sublabel: "Performance e latência", icon: <Play className="w-4 h-4 text-orange-500" />, group: "Camadas", keywords: ["simulation", "latency", "throughput"], action: () => { trackRecent("layer-l4"); setActiveLayer("simulation"); close(); } },

    // Actions
    { id: "act-simulate", label: "Simular arquitetura", sublabel: "Executar análise completa", icon: <Play className="w-4 h-4" />, group: "Ações", keywords: ["run", "execute"], action: async () => { trackRecent("act-simulate"); close(); const domainNodes = selectDomainNodes(useFlowStore.getState()); const domainEdges = selectDomainEdges(useFlowStore.getState()); if (!domainNodes.length) { toast.warning("Adicione componentes primeiro."); return; } setRunning(); openSimulationPanel(); toast.loading("Simulando...", { id: "sim" }); try { const res = await fetch("/api/simulation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodes: domainNodes, edges: domainEdges }) }); const result = await res.json(); setResult(result); toast.success("Simulação concluída!", { id: "sim" }); } catch { setError("Erro"); toast.error("Falha na simulação.", { id: "sim" }); } } },
    { id: "act-layout", label: "Auto-organizar diagrama", sublabel: "Layout Dagre top-to-bottom", icon: <LayoutGrid className="w-4 h-4" />, group: "Ações", action: () => { trackRecent("act-layout"); requestAutoLayout("TB"); close(); } },
    { id: "act-templates", label: "Abrir templates", icon: <LayoutTemplate className="w-4 h-4" />, group: "Ações", keywords: ["template", "exemplo"], action: () => { trackRecent("act-templates"); useUIStore.getState().openTemplatesDialog(); close(); } },
    { id: "act-history", label: "Histórico de versões", icon: <History className="w-4 h-4" />, group: "Ações", action: () => { trackRecent("act-history"); toggleHistoryPanel(); close(); } },
    { id: "act-validation", label: "Painel de validação", icon: <ShieldAlert className="w-4 h-4" />, group: "Ações", action: () => { trackRecent("act-validation"); toggleValidationPanel(); close(); } },
    { id: "act-whatif", label: "Análise what-if", icon: <Calculator className="w-4 h-4" />, group: "Ações", action: () => { trackRecent("act-whatif"); toggleWhatIfPanel(); close(); } },
    { id: "act-results", label: "Ver resultados da simulação", icon: <Play className="w-4 h-4" />, group: "Ações", action: () => { trackRecent("act-results"); openSimulationPanel(); close(); } },

    // View
    { id: "view-snap", label: "Ativar/desativar grade", icon: <Grid3x3 className="w-4 h-4" />, group: "Visualização", action: () => { trackRecent("view-snap"); toggleSnapToGrid(); close(); } },
    { id: "view-presentation", label: "Modo apresentação", icon: <Presentation className="w-4 h-4" />, group: "Visualização", action: () => { trackRecent("view-presentation"); togglePresentationMode(); close(); } },
    { id: "view-theme", label: theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro", icon: theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />, group: "Visualização", action: () => { trackRecent("view-theme"); toggleTheme(); close(); } },

    // Danger
    { id: "act-clear", label: "Limpar canvas", sublabel: "Remove todos os componentes", icon: <Trash2 className="w-4 h-4 text-destructive" />, group: "Perigo", action: () => { trackRecent("act-clear"); if (confirm("Limpar canvas?")) { clearCanvas(); reset(); toast.info("Canvas limpo."); } close(); } },
  ], [setActiveLayer, close, requestAutoLayout, toggleValidationPanel, toggleWhatIfPanel, toggleHistoryPanel, toggleSnapToGrid, togglePresentationMode, openSimulationPanel, theme, toggleTheme, clearCanvas, reset, setRunning, setResult, setError, trackRecent]);

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
          trackRecent(`node-${n.id}`);
          close();
        },
      };
    });
  }, [nodes, close, trackRecent]);

  // ── Service quick-add commands (only on architecture layer) ───────────────

  const serviceAddCommands = useMemo<Command[]>(() => {
    if (activeLayer !== "architecture") return [];
    return registry.getAll().slice(0, 20).map((def) => ({
      id: `add-svc-${def.type}`,
      label: `Adicionar ${def.label}`,
      sublabel: def.description ?? def.category,
      icon: (
        <div className={cn("p-1 rounded-md", def.bgColor)}>
          <ServiceIcon iconName={def.iconName} className={cn("w-3 h-3", def.color)} />
        </div>
      ),
      group: "Adicionar Serviço",
      keywords: [def.type, def.label, def.category],
      action: () => {
        trackRecent(`add-svc-${def.type}`);
        useFlowStore.getState().addNode(
          def.type,
          { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 }
        );
        close();
      },
    }));
  }, [activeLayer, close, trackRecent]);

  // ── Fuzzy filter ──────────────────────────────────────────────────────────

  const allCommands = useMemo(
    () => [...staticCommands, ...nodeCommands, ...serviceAddCommands],
    [staticCommands, nodeCommands, serviceAddCommands]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands.slice(0, 12);
    const q = query.toLowerCase();

    // Also search all registry services (not just first 20)
    const extraServiceResults: Command[] = [];
    if (activeLayer === "architecture") {
      registry.getAll().slice(20).forEach((def) => {
        const haystack = [def.type, def.label, def.category, def.description ?? ""].join(" ").toLowerCase();
        if (haystack.includes(q)) {
          extraServiceResults.push({
            id: `add-svc-${def.type}`,
            label: `Adicionar ${def.label}`,
            sublabel: def.description ?? def.category,
            icon: (
              <div className={cn("p-1 rounded-md", def.bgColor)}>
                <ServiceIcon iconName={def.iconName} className={cn("w-3 h-3", def.color)} />
              </div>
            ),
            group: "Adicionar Serviço",
            keywords: [def.type, def.label, def.category],
            action: () => {
              trackRecent(`add-svc-${def.type}`);
              useFlowStore.getState().addNode(
                def.type,
                { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 }
              );
              close();
            },
          });
        }
      });
    }

    const baseResults = allCommands.filter((cmd) => {
      const haystack = [cmd.label, cmd.sublabel ?? "", ...(cmd.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });

    // Deduplicate extras (in case they overlap with first 20)
    const seen = new Set(baseResults.map((c) => c.id));
    const deduped = extraServiceResults.filter((c) => !seen.has(c.id));

    return [...baseResults, ...deduped].slice(0, 12);
  }, [allCommands, query, activeLayer, close, trackRecent]);

  // Group filtered results
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    }
    return map;
  }, [filtered]);

  // ── Recent commands (shown when query is empty) ───────────────────────────

  const recentCommands = useMemo<Command[]>(() => {
    if (query.trim()) return [];
    return recentCommandIds.current
      .map((id) => allCommands.find((c) => c.id === id))
      .filter((c): c is Command => c !== undefined);
  }, [query, allCommands, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flatten for keyboard nav index
  const flatFiltered = useMemo(() => filtered, [filtered]);

  // ── Quick action cards (shown when no query and no recents) ───────────────

  const quickActions = useMemo<QuickActionCard[]>(() => [
    { id: "act-simulate", label: "Simular", icon: <Play className="w-5 h-5" />, colorClass: "text-orange-500 bg-orange-500/10" },
    { id: "act-templates", label: "Templates", icon: <LayoutTemplate className="w-5 h-5" />, colorClass: "text-blue-500 bg-blue-500/10" },
    { id: "act-layout", label: "Auto-organizar", icon: <LayoutGrid className="w-5 h-5" />, colorClass: "text-violet-500 bg-violet-500/10" },
    { id: "act-clear", label: "Limpar", icon: <Trash2 className="w-5 h-5" />, colorClass: "text-destructive bg-destructive/10" },
  ], []);

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

  const showQuickCards = !query.trim() && recentCommands.length === 0;
  const showRecents = !query.trim() && recentCommands.length > 0;

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
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
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

              {/* Quick action cards (no query, no recents) */}
              {showQuickCards && (
                <div className="px-4 pt-4 pb-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Ações rápidas
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {quickActions.map((card) => {
                      const cmd = allCommands.find((c) => c.id === card.id);
                      return (
                        <button
                          key={card.id}
                          onClick={() => cmd?.action()}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-center group"
                        >
                          <span className={cn("p-2 rounded-lg transition-colors", card.colorClass)}>
                            {card.icon}
                          </span>
                          <span className="text-[11px] font-medium text-foreground leading-tight">
                            {card.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent commands (no query, has recents) */}
              {showRecents && (
                <div className="pt-1.5">
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Recentes
                  </div>
                  {recentCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors text-foreground hover:bg-accent/50"
                    >
                      <span className="shrink-0 text-muted-foreground">{cmd.icon}</span>
                      <span className="flex-1 truncate font-medium">{cmd.label}</span>
                      {cmd.sublabel && (
                        <span className="text-xs text-muted-foreground shrink-0">{cmd.sublabel}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Results */}
              <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1.5">
                {query.trim() && grouped.size === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                    <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum resultado para</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5 mb-4">{'"'}{query}{'"'}</p>
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        Adicionar via arrastar-e-soltar a partir da barra lateral
                      </div>
                      <button
                        onClick={() => {
                          useUIStore.getState().openTemplatesDialog();
                          close();
                        }}
                        className="text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded-lg px-3 py-2 flex items-center gap-2 transition-colors"
                      >
                        <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
                        Pesquisar em 55+ serviços →
                      </button>
                    </div>
                  </div>
                ) : query.trim() ? (
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
                              <span className="text-xs text-muted-foreground shrink-0 max-w-[140px] truncate">{cmd.sublabel}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : null}
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
