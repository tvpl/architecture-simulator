"use client";
import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { InfrastructureSummaryPanel } from "@/components/panels/InfrastructureSummaryPanel";
import { HistoryPanel } from "@/components/panels/HistoryPanel";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";
import { ValidationPanel } from "@/components/panels/ValidationPanel";
import { WhatIfPanel } from "@/components/panels/WhatIfPanel";
import { WellArchitectedPanel } from "@/components/panels/WellArchitectedPanel";
import { ComparisonPanel } from "@/components/panels/ComparisonPanel";
import { CostDashboard } from "@/components/views/CostDashboard";
import { SimulationView } from "@/components/views/SimulationView";
import { CommandPalette } from "@/components/dialogs/CommandPalette";
import { TemplatesDialog } from "@/components/dialogs/TemplatesDialog";
import { KeyboardShortcutsModal } from "@/components/dialogs/KeyboardShortcutsModal";
import { SaveTemplateDialog } from "@/components/dialogs/SaveTemplateDialog";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ErrorBoundary } from "@/components/error-boundary";
import { useFlowStore } from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";
import { useLayerStore } from "@/stores/layer-store";
import { LAYER_CONFIGS } from "@/domain/entities/layer";

function HashImporter() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const json = decodeURIComponent(atob(hash));
      const data = JSON.parse(json);
      useFlowStore.getState().importProject(data);
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      // Invalid or malformed hash — silently ignore
    }
  }, []);
  return null;
}

function EditorMain() {
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const presentationMode = useUIStore((s) => s.presentationMode);
  const propertiesPanelDocked = useUIStore((s) => s.propertiesPanelDocked);
  const viewType = LAYER_CONFIGS[activeLayer].viewType;

  return (
    <main
      className="flex-1 relative min-w-0 flex"
      data-tour="canvas"
    >
      {/* Canvas / dashboard area */}
      <div className="flex-1 relative min-w-0">
        <ErrorBoundary>
          {viewType === "canvas" && (
            <>
              <FlowCanvas />
              <InfrastructureSummaryPanel />
            </>
          )}
          {viewType === "dashboard" && <CostDashboard />}
          {viewType === "simulation-view" && <SimulationView />}
        </ErrorBoundary>

        {/* Floating panels (only when not docked) */}
        {!presentationMode && viewType === "canvas" && !propertiesPanelDocked && <PropertiesPanel />}
        {!presentationMode && viewType === "canvas" && <WhatIfPanel />}
        {!presentationMode && viewType === "canvas" && <WellArchitectedPanel />}
        {!presentationMode && viewType === "canvas" && <ComparisonPanel />}
        {!presentationMode && <HistoryPanel />}
        {!presentationMode && viewType !== "dashboard" && <SimulationPanel />}
        {!presentationMode && viewType === "canvas" && <ValidationPanel />}
      </div>

      {/* Docked properties panel (split mode) */}
      {!presentationMode && viewType === "canvas" && propertiesPanelDocked && (
        <div className="w-80 shrink-0 border-l border-border bg-background overflow-y-auto">
          <PropertiesPanel docked />
        </div>
      )}
    </main>
  );
}

function GlobalDialogs() {
  const templatesDialogOpen = useUIStore((s) => s.templatesDialogOpen);
  const closeTemplatesDialog = useUIStore((s) => s.closeTemplatesDialog);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  // Expose save template open state globally via custom event
  useEffect(() => {
    const handler = () => setSaveTemplateOpen(true);
    window.addEventListener("open-save-template", handler);
    return () => window.removeEventListener("open-save-template", handler);
  }, []);

  return (
    <>
      <TemplatesDialog open={templatesDialogOpen} onClose={closeTemplatesDialog} />
      <KeyboardShortcutsModal />
      <SaveTemplateDialog open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} />
    </>
  );
}

export default function EditorPage() {
  const presentationMode = useUIStore((s) => s.presentationMode);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;

      // ? = open shortcuts modal
      if (e.key === "?") {
        useUIStore.getState().toggleShortcutsModal();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <ReactFlowProvider>
      <HashImporter />
      <CommandPalette />
      <GlobalDialogs />
      <OnboardingTour />
      <div className="h-full flex flex-col overflow-hidden">
        <div data-tour="layer-switcher">
          <Navbar />
        </div>
        <div className="flex flex-1 min-h-0 relative">
          {!presentationMode && (
            <div data-tour="sidebar">
              <Sidebar />
            </div>
          )}
          <EditorMain />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
