"use client";
import React, { useRef, useCallback, useState } from "react";
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
} from "lucide-react";
import { TemplatesDialog } from "@/components/dialogs/TemplatesDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LayerSwitcher } from "./LayerSwitcher";
import { useFlowStore, selectDomainNodes, selectDomainEdges, useTemporalFlowStore } from "@/stores/flow-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useUIStore } from "@/stores/ui-store";
import { useThemeStore } from "@/stores/theme-store";
import { useHistoryStore } from "@/stores/history-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  } = useUIStore();

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const { toggleHistoryPanel } = useHistoryStore();

  // ── Undo / Redo ────────────────────────────────────────────────────────
  const canUndo = useTemporalFlowStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalFlowStore((s) => s.futureStates.length > 0);
  const undo = useTemporalFlowStore((s) => s.undo);
  const redo = useTemporalFlowStore((s) => s.redo);

  const isSimulating = status === "running";

  // ── Simulation ─────────────────────────────────────────────────────────

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
      toast.success("Simulação concluída com sucesso!", { id: "sim" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao simular";
      setError(msg);
      toast.error(`Falha na simulação: ${msg}`, { id: "sim" });
    }
  }, [setRunning, setResult, setError, openSimulationPanel]);

  // ── Export/Import ──────────────────────────────────────────────────────

  const handleExportJson = useCallback(() => {
    try {
      const data = exportProject();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON exportado com sucesso.");
    } catch {
      toast.error("Erro ao exportar JSON.");
    }
  }, [exportProject, projectName]);

  const handleImportJson = useCallback(() => {
    importRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target?.result as string);
          importProject(data);
          toast.success("Projeto importado com sucesso.");
        } catch {
          toast.error("Arquivo JSON inválido ou corrompido.");
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
      if (!viewport) {
        toast.error("Nenhum diagrama encontrado para exportar.");
        return;
      }
      const dataUrl = await toPng(viewport);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `arquitetura-${Date.now()}.png`;
      a.click();
      toast.success("Imagem exportada com sucesso.");
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

  // ── Share URL ──────────────────────────────────────────────────────────

  // ── CloudFormation Export ──────────────────────────────────────────────────

  const handleExportCloudFormation = useCallback(async () => {
    const domainNodes = selectDomainNodes(useFlowStore.getState());
    const domainEdges = selectDomainEdges(useFlowStore.getState());
    if (domainNodes.length === 0) {
      toast.warning("Adicione pelo menos um componente ao diagrama antes de exportar.");
      return;
    }

    toast.loading("Gerando template CloudFormation...", { id: "cf" });
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
      toast.success("Template CloudFormation exportado!", { id: "cf" });
    } catch {
      toast.error("Erro ao gerar template.", { id: "cf" });
    }
  }, [projectName]);

  // ── K8s YAML Export ─────────────────────────────────────────────────────

  const handleExportK8s = useCallback(() => {
    const state = useFlowStore.getState();
    const appNodes = state.solutionNodes.map((n) => n.data);
    const infraNodes = state.nodes.map((n) => n.data);
    if (appNodes.length === 0) {
      toast.warning("Adicione componentes na aba Design de Solução antes de exportar K8s.");
      return;
    }
    import("@/domain/services/k8s-export").then(({ generateK8sManifests }) => {
      const yaml = generateK8sManifests(appNodes, infraNodes);
      const blob = new Blob([yaml], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-k8s.yaml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Manifests K8s exportados!");
    });
  }, [projectName]);

  // ── Share URL ──────────────────────────────────────────────────────────

  const handleShare = useCallback(() => {
    try {
      const data = exportProject();
      const json = JSON.stringify(data);
      const encoded = btoa(encodeURIComponent(json));
      const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Link copiado para a área de transferência!");
      });
    } catch {
      toast.error("Erro ao gerar link compartilhável.");
    }
  }, [exportProject]);

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm z-10 shrink-0">
        {/* Left: brand + project name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Cpu className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground hidden sm:block">
              AWS Architect
            </span>
          </div>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <input
            className="text-sm font-medium bg-transparent border-none outline-none text-muted-foreground hover:text-foreground focus:text-foreground w-48 truncate"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nome do projeto..."
          />
        </div>

        {/* Center: layer switcher */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <LayerSwitcher />
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => undo()}
                disabled={!canUndo}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => redo()}
                disabled={!canRedo}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

          {/* Auto-layout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => requestAutoLayout("TB")}
                disabled={nodes.length === 0}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto-organizar diagrama (Dagre)</TooltipContent>
          </Tooltip>

          {/* Snap to grid */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8", snapToGrid && "bg-primary/10 text-primary")}
                onClick={toggleSnapToGrid}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{snapToGrid ? "Desativar grade" : "Ativar grade (snap)"}</TooltipContent>
          </Tooltip>

          {/* Presentation mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8", presentationMode && "bg-primary/10 text-primary")}
                onClick={togglePresentationMode}
              >
                <Presentation className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {presentationMode ? "Sair da apresentação" : "Modo apresentação"}
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

          {/* Simulate */}
          {!isSimulating ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleSimulate}
                  disabled={nodes.length === 0}
                  className="gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Simular</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Executar simulação de arquitetura</TooltipContent>
            </Tooltip>
          ) : (
            <Button size="sm" variant="destructive" onClick={reset} className="gap-1.5">
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Parar</span>
            </Button>
          )}

          {/* Toggle simulation panel */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleSimulationPanel}
                className="gap-1.5"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resultados</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Painel de resultados</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

          {/* Share URL */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleShare}>
                <Link className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar link compartilhável</TooltipContent>
          </Tooltip>

          {/* Export JSON */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExportJson}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar JSON</TooltipContent>
          </Tooltip>

          {/* Import JSON */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleImportJson}>
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar JSON</TooltipContent>
          </Tooltip>

          {/* Export image */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExportImage}>
                <ImageDown className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar como imagem</TooltipContent>
          </Tooltip>

          {/* Export CloudFormation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExportCloudFormation}>
                <FileCode2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar CloudFormation</TooltipContent>
          </Tooltip>

          {/* Export K8s YAML */}
          {solutionNodes.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExportK8s}>
                  <Cpu className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar K8s YAML</TooltipContent>
            </Tooltip>
          )}

          {/* Version history */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleHistoryPanel}>
                <History className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Histórico de versões</TooltipContent>
          </Tooltip>

          {/* Templates */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setTemplatesOpen(true)}>
                <LayoutTemplate className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Templates de arquitetura</TooltipContent>
          </Tooltip>

          {/* Validation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8", validationPanelOpen && "bg-primary/10 text-primary")}
                onClick={toggleValidationPanel}
              >
                <ShieldAlert className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Painel de validação</TooltipContent>
          </Tooltip>

          {/* What-if analysis */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8", whatIfPanelOpen && "bg-primary/10 text-primary")}
                onClick={toggleWhatIfPanel}
              >
                <Calculator className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Análise what-if de custos</TooltipContent>
          </Tooltip>

          {/* Dark mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Modo claro" : "Modo escuro"}</TooltipContent>
          </Tooltip>

          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleClear}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpar canvas</TooltipContent>
          </Tooltip>

          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </nav>

      <TemplatesDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
    </TooltipProvider>
  );
}
