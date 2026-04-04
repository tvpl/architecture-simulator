"use client";
import React, { useRef, useCallback } from "react";
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  ImageDown,
  ChevronDown,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayerSwitcher } from "./LayerSwitcher";
import { useFlowStore } from "@/stores/flow-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useUIStore } from "@/stores/ui-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { selectDomainNodes, selectDomainEdges } from "@/stores/flow-store";
import { cn } from "@/lib/utils";

export function Navbar() {
  const importRef = useRef<HTMLInputElement>(null);

  const { exportProject, importProject, clearCanvas, projectName, setProjectName, nodes } =
    useFlowStore();
  const { status, setRunning, setResult, setError, reset } = useSimulationStore();
  const { toggleSimulationPanel, openSimulationPanel } = useUIStore();

  const isSimulating = status === "running";

  // ── Simulation ─────────────────────────────────────────────────────────

  const handleSimulate = useCallback(async () => {
    const domainNodes = selectDomainNodes(useFlowStore.getState());
    const domainEdges = selectDomainEdges(useFlowStore.getState());

    if (domainNodes.length === 0) {
      alert("Adicione pelo menos um componente ao diagrama antes de simular.");
      return;
    }

    setRunning();
    openSimulationPanel();

    try {
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: domainNodes, edges: domainEdges }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao simular");
    }
  }, [setRunning, setResult, setError, openSimulationPanel]);

  // ── Export/Import ──────────────────────────────────────────────────────

  const handleExportJson = useCallback(() => {
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
        } catch {
          alert("Arquivo JSON inválido.");
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
      if (!viewport) return;
      const dataUrl = await toPng(viewport);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `arquitetura-${Date.now()}.png`;
      a.click();
    } catch {
      alert("Export de imagem não disponível neste ambiente.");
    }
  }, []);

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
        <div className="flex items-center gap-1.5">
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
                className={cn("gap-1.5")}
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resultados</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Painel de resultados</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

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

          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm("Limpar canvas? Esta ação não pode ser desfeita.")) {
                    clearCanvas();
                    reset();
                  }
                }}
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
    </TooltipProvider>
  );
}
