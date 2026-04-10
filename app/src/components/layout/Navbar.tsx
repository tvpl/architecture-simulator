"use client";
import React, { useRef, useCallback, useState, useEffect } from "react";
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
  CheckCircle2,
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

// ── NavDropdown ───────────────────────────────────────────────────────────────

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  shortcut?: string;
  active?: boolean;
  danger?: boolean;
  separator?: boolean;
  onClick: () => void;
}

function NavDropdown({
  trigger,
  items,
  align = "right",
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((p) => !p)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1.5 z-50 min-w-[200px] bg-background border border-border rounded-xl shadow-xl overflow-hidden py-1.5",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 border-t border-border/60" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left",
                  item.danger
                    ? "text-destructive hover:bg-destructive/10"
                    : item.active
                    ? "bg-primary/8 text-primary font-medium"
                    : "text-foreground hover:bg-muted/70"
                )}
              >
                <span className={cn("shrink-0", item.active ? "text-primary" : "text-muted-foreground")}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.sublabel && (
                  <span className="text-[10px] text-muted-foreground">{item.sublabel}</span>
                )}
                {item.shortcut && (
                  <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono ml-auto">
                    {item.shortcut}
                  </kbd>
                )}
                {item.active && !item.shortcut && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-auto" />
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

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

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const canUndo = useTemporalFlowStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalFlowStore((s) => s.futureStates.length > 0);
  const undo = useTemporalFlowStore((s) => s.undo);
  const redo = useTemporalFlowStore((s) => s.redo);

  const isSimulating = status === "running";

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
      toast.success("Simulação concluída com sucesso!", { id: "sim" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao simular";
      setError(msg);
      toast.error(`Falha na simulação: ${msg}`, { id: "sim" });
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

  // ── Dropdown item definitions ──────────────────────────────────────────────

  const exportItems: DropdownItem[] = [
    {
      icon: <Link className="w-3.5 h-3.5" />,
      label: "Copiar link",
      sublabel: "URL compartilhável",
      onClick: handleShare,
    },
    { separator: true, icon: null!, label: "", onClick: () => {} },
    {
      icon: <Download className="w-3.5 h-3.5" />,
      label: "Exportar JSON",
      shortcut: "Ctrl+S",
      onClick: handleExportJson,
    },
    {
      icon: <Upload className="w-3.5 h-3.5" />,
      label: "Importar JSON",
      onClick: handleImportJson,
    },
    { separator: true, icon: null!, label: "", onClick: () => {} },
    {
      icon: <ImageDown className="w-3.5 h-3.5" />,
      label: "Exportar imagem",
      sublabel: "PNG",
      onClick: handleExportImage,
    },
    {
      icon: <FileCode2 className="w-3.5 h-3.5" />,
      label: "CloudFormation",
      sublabel: "JSON template",
      onClick: handleExportCloudFormation,
    },
    ...(solutionNodes.length > 0
      ? [
          {
            icon: <Cpu className="w-3.5 h-3.5" />,
            label: "K8s Manifests",
            sublabel: "YAML",
            onClick: handleExportK8s,
          } as DropdownItem,
        ]
      : []),
  ];

  const viewItems: DropdownItem[] = [
    {
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      label: "Auto-organizar",
      sublabel: "Dagre layout",
      onClick: () => requestAutoLayout("TB"),
    },
    { separator: true, icon: null!, label: "", onClick: () => {} },
    {
      icon: <Grid3x3 className="w-3.5 h-3.5" />,
      label: "Grade (snap)",
      active: snapToGrid,
      onClick: toggleSnapToGrid,
    },
    {
      icon: <Presentation className="w-3.5 h-3.5" />,
      label: "Modo apresentação",
      active: presentationMode,
      onClick: togglePresentationMode,
    },
  ];

  const panelsItems: DropdownItem[] = [
    {
      icon: <LayoutTemplate className="w-3.5 h-3.5" />,
      label: "Templates",
      onClick: () => setTemplatesOpen(true),
    },
    {
      icon: <History className="w-3.5 h-3.5" />,
      label: "Histórico",
      onClick: toggleHistoryPanel,
    },
    { separator: true, icon: null!, label: "", onClick: () => {} },
    {
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      label: "Validação",
      active: validationPanelOpen,
      onClick: toggleValidationPanel,
    },
    {
      icon: <Calculator className="w-3.5 h-3.5" />,
      label: "Análise What-if",
      active: whatIfPanelOpen,
      onClick: toggleWhatIfPanel,
    },
    { separator: true, icon: null!, label: "", onClick: () => {} },
    {
      icon: <RotateCcw className="w-3.5 h-3.5" />,
      label: "Limpar canvas",
      danger: true,
      onClick: handleClear,
    },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm z-10 shrink-0">
        {/* Left: brand + project name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Cpu className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground hidden sm:block">
              AWS Architect
            </span>
          </div>
          <div className="h-5 w-px bg-border hidden sm:block shrink-0" />
          <input
            className="text-sm font-medium bg-transparent border-none outline-none text-muted-foreground hover:text-foreground focus:text-foreground w-40 truncate"
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
        <div className="flex items-center gap-1 shrink-0">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-md"
                  onClick={() => undo()}
                  disabled={!canUndo}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-md"
                  onClick={() => redo()}
                  disabled={!canRedo}
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-5 w-px bg-border mx-0.5" />

          {/* Export dropdown */}
          <NavDropdown
            align="right"
            trigger={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs px-2.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Exportar</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Opções de exportação e importação</TooltipContent>
              </Tooltip>
            }
            items={exportItems}
          />

          {/* View dropdown */}
          <NavDropdown
            align="right"
            trigger={
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Configurações de visualização</TooltipContent>
              </Tooltip>
            }
            items={viewItems}
          />

          {/* Panels dropdown */}
          <NavDropdown
            align="right"
            trigger={
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Templates, histórico e painéis</TooltipContent>
              </Tooltip>
            }
            items={panelsItems}
          />

          <div className="h-5 w-px bg-border mx-0.5" />

          {/* Simulate / Results */}
          {!isSimulating ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleSimulate}
                  disabled={nodes.length === 0}
                  className="gap-1.5 h-8 text-xs px-3 bg-primary hover:bg-primary/90 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-medium">Simular</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Executar simulação de arquitetura</TooltipContent>
            </Tooltip>
          ) : (
            <Button size="sm" variant="destructive" onClick={reset} className="gap-1.5 h-8 text-xs px-3">
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Parar</span>
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleSimulationPanel}
                className="gap-1.5 h-8 text-xs px-2.5"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resultados</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Painel de resultados</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border mx-0.5" />

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Modo claro" : "Modo escuro"}</TooltipContent>
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
