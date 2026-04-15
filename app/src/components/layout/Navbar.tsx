"use client";
import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  ImageDown,
  ChevronDown,
  Cpu,
  Moon,
  Sun,
  Undo2,
  Redo2,
  LayoutGrid,
  Grid3x3,
  Presentation,
  Link,
  FileCode2,
  History,
  LayoutTemplate,
  ShieldAlert,
  Calculator,
  PanelRight,
  Eye,
  Command,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LayerSwitcher } from "./LayerSwitcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useFlowStore, selectDomainNodes, selectDomainEdges, useTemporalFlowStore } from "@/stores/flow-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useUIStore } from "@/stores/ui-store";
import { useThemeStore } from "@/stores/theme-store";
import { useHistoryStore } from "@/stores/history-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCommandPaletteStore } from "@/stores/command-palette-store";

export function Navbar() {
  const importRef = useRef<HTMLInputElement>(null);

  const { exportProject, importProject, clearCanvas, projectName, setProjectName, nodes, solutionNodes } =
    useFlowStore();
  const { status, setRunning, setResult, setError, reset } = useSimulationStore();
  const {
    toggleSimulationPanel,
    openSimulationPanel,
    snapToGrid,
    toggleSnapToGrid,
    presentationMode,
    togglePresentationMode,
    requestAutoLayout,
    toggleValidationPanel,
    validationPanelOpen,
    toggleWhatIfPanel,
    whatIfPanelOpen,
    openTemplatesDialog,
  } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleHistoryPanel } = useHistoryStore();
  const { open: openCommandPalette } = useCommandPaletteStore();

  const canUndo = useTemporalFlowStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalFlowStore((s) => s.futureStates.length > 0);
  const undo = useTemporalFlowStore((s) => s.undo);
  const redo = useTemporalFlowStore((s) => s.redo);

  const isSimulating = status === "running";
  const isComplete = status === "complete";

  // ── Simulation ─────────────────────────────────────────────────────────────

  const handleSimulate = useCallback(async () => {
    const domainNodes = selectDomainNodes(useFlowStore.getState());
    const domainEdges = selectDomainEdges(useFlowStore.getState());

    if (domainNodes.length === 0) {
      toast.warning("Adicione pelo menos um componente ao diagrama antes de simular.");
      return;
    }

    setRunning();
    openSimulationPanel();
    toast.loading("Simulando arquitetura...", { id: "sim" });

    try {
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: domainNodes, edges: domainEdges }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setResult(result);
      toast.success("Simulação concluída!", { id: "sim" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao simular";
      setError(msg);
      toast.error(`Falha: ${msg}`, { id: "sim" });
    }
  }, [setRunning, setResult, setError, openSimulationPanel]);

  // ── Export/Import ──────────────────────────────────────────────────────────

  const handleExportJson = useCallback(() => {
    try {
      const data = exportProject();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON exportado.");
    } catch {
      toast.error("Erro ao exportar JSON.");
    }
  }, [exportProject, projectName]);

  const handleImportJson = useCallback(() => importRef.current?.click(), []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          importProject(JSON.parse(evt.target?.result as string));
          toast.success("Projeto importado.");
        } catch {
          toast.error("Arquivo inválido ou corrompido.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [importProject]
  );

  const handleExportImage = useCallback(async () => {
    try {
      const { toPng } = await import("html-to-image");
      const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
      if (!viewport) { toast.error("Nenhum diagrama encontrado."); return; }
      const dataUrl = await toPng(viewport, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `arquitetura-${Date.now()}.png`;
      a.click();
      toast.success("Imagem exportada (2x).");
    } catch {
      toast.error("Erro ao exportar imagem.");
    }
  }, []);

  const handleClear = useCallback(() => {
    if (confirm("Limpar canvas? Esta ação não pode ser desfeita.")) {
      clearCanvas();
      reset();
      toast.info("Canvas limpo.");
    }
  }, [clearCanvas, reset]);

  const handleExportCloudFormation = useCallback(async () => {
    const domainNodes = selectDomainNodes(useFlowStore.getState());
    const domainEdges = selectDomainEdges(useFlowStore.getState());
    if (domainNodes.length === 0) { toast.warning("Adicione componentes primeiro."); return; }
    toast.loading("Gerando CloudFormation...", { id: "cf" });
    try {
      const res = await fetch("/api/export/cloudformation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: domainNodes, edges: domainEdges, projectName }),
      });
      const { template } = await res.json();
      const blob = new Blob([template], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-cloudformation.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CloudFormation exportado!", { id: "cf" });
    } catch {
      toast.error("Erro ao gerar template.", { id: "cf" });
    }
  }, [projectName]);

  const handleExportK8s = useCallback(() => {
    const state = useFlowStore.getState();
    const appNodes = state.solutionNodes.map((n) => n.data);
    const infraNodes = state.nodes.map((n) => n.data);
    if (appNodes.length === 0) { toast.warning("Adicione componentes L2 primeiro."); return; }
    import("@/domain/services/k8s-export").then(({ generateK8sManifests }) => {
      const yaml = generateK8sManifests(appNodes, infraNodes);
      const blob = new Blob([yaml], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-k8s.yaml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("K8s manifests exportados!");
    });
  }, [projectName]);

  const handleShare = useCallback(() => {
    try {
      const data = exportProject();
      const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
      const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
      navigator.clipboard.writeText(url).then(() => toast.success("Link copiado!"));
    } catch {
      toast.error("Erro ao gerar link.");
    }
  }, [exportProject]);

  return (
    <TooltipProvider delayDuration={400}>
      <nav className="h-14 flex items-center justify-between px-4 border-b border-border glass z-10 shrink-0">
        {/* ── Left: brand + project name ──────────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            className="flex items-center gap-2 shrink-0"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm ring-1 ring-primary/20">
              <Cpu className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">
              AWS Architect
            </span>
          </motion.div>

          <div className="h-5 w-px bg-border hidden sm:block shrink-0" />

          <input
            className="text-sm font-medium bg-transparent border-none outline-none text-muted-foreground hover:text-foreground focus:text-foreground w-40 truncate transition-colors"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nome do projeto..."
          />
        </div>

        {/* ── Center: layer switcher ───────────────────────────────────────── */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <LayerSwitcher />
        </div>

        {/* ── Right: actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Command palette shortcut */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 px-2.5 text-muted-foreground hidden md:flex"
                onClick={openCommandPalette}
              >
                <Command className="w-3.5 h-3.5" />
                <span className="text-xs">Buscar</span>
                <kbd className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded border border-border ml-1">
                  ⌘K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Command palette (Ctrl+K)</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border mx-0.5 hidden md:block" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => undo()} disabled={!canUndo}>
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desfazer <DropdownMenuShortcut className="ml-1">Ctrl+Z</DropdownMenuShortcut></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => redo()} disabled={!canRedo}>
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refazer <DropdownMenuShortcut className="ml-1">Ctrl+Y</DropdownMenuShortcut></TooltipContent>
            </Tooltip>
          </div>

          <div className="h-5 w-px bg-border mx-0.5" />

          {/* ── Export dropdown ──────────────────────────────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs px-2.5">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exportar</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Compartilhar</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleShare}>
                <Link className="w-3.5 h-3.5 text-muted-foreground" />
                Copiar link
                <DropdownMenuShortcut>URL</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Projeto</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportJson}>
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                Salvar JSON
                <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportJson}>
                <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                Abrir JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Exportar como</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportImage}>
                <ImageDown className="w-3.5 h-3.5 text-muted-foreground" />
                Imagem PNG
                <DropdownMenuShortcut>2×</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCloudFormation} disabled={nodes.length === 0}>
                <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
                CloudFormation
              </DropdownMenuItem>
              {solutionNodes.length > 0 && (
                <DropdownMenuItem onClick={handleExportK8s}>
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                  K8s Manifests
                  <DropdownMenuShortcut>YAML</DropdownMenuShortcut>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── View dropdown ────────────────────────────────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "gap-1.5 h-8 text-xs px-2.5",
                  (snapToGrid || presentationMode) && "text-primary border-primary/40 bg-primary/5"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Visão</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Layout</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => requestAutoLayout("TB")} disabled={nodes.length === 0}>
                <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                Auto-organizar
                <DropdownMenuShortcut>TB</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Configuração</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={snapToGrid} onCheckedChange={toggleSnapToGrid}>
                <Grid3x3 className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                Grade (snap)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={presentationMode} onCheckedChange={togglePresentationMode}>
                <Presentation className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                Apresentação
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Panels dropdown ──────────────────────────────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "gap-1.5 h-8 text-xs px-2.5",
                  (validationPanelOpen || whatIfPanelOpen) && "text-primary border-primary/40 bg-primary/5"
                )}
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Painéis</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Biblioteca</DropdownMenuLabel>
              <DropdownMenuItem onClick={openTemplatesDialog}>
                <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground" />
                Templates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleHistoryPanel}>
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                Histórico
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Análise</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={validationPanelOpen} onCheckedChange={toggleValidationPanel}>
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                Validação
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={whatIfPanelOpen} onCheckedChange={toggleWhatIfPanel}>
                <Calculator className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                What-if
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleClear}>
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar canvas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-border mx-0.5" />

          {/* ── Simulate CTA ─────────────────────────────────────────────── */}
          {!isSimulating ? (
            <motion.div whileTap={{ scale: 0.96 }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleSimulate}
                    disabled={nodes.length === 0}
                    className={cn(
                      "gap-1.5 h-8 text-xs px-3 font-semibold shadow-sm transition-all",
                      isComplete && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isComplete ? "Re-simular" : "Simular"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Executar simulação de arquitetura</TooltipContent>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button size="sm" variant="destructive" onClick={reset} className="gap-1.5 h-8 text-xs px-3 font-semibold">
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Parar</span>
              </Button>
            </motion.div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={toggleSimulationPanel} className="gap-1.5 h-8 text-xs px-2">
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-muted-foreground">Resultados</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Painel de resultados da simulação</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border mx-0.5" />

          {/* Theme toggle */}
          <motion.div whileTap={{ rotate: 20 }} transition={{ duration: 0.15 }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === "dark" ? "Modo claro" : "Modo escuro"}</TooltipContent>
            </Tooltip>
          </motion.div>
        </div>
      </nav>

      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
    </TooltipProvider>
  );
}
