"use client";
import { useEffect } from "react";
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
import { CostDashboard } from "@/components/views/CostDashboard";
import { SimulationView } from "@/components/views/SimulationView";
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
  const viewType = LAYER_CONFIGS[activeLayer].viewType;

  return (
    <main className="flex-1 relative min-w-0">
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
      {!presentationMode && viewType === "canvas" && <PropertiesPanel />}
      {!presentationMode && viewType === "canvas" && <WhatIfPanel />}
      {!presentationMode && <HistoryPanel />}
      {!presentationMode && viewType !== "dashboard" && <SimulationPanel />}
      {!presentationMode && viewType === "canvas" && <ValidationPanel />}
    </main>
  );
}

export default function EditorPage() {
  const presentationMode = useUIStore((s) => s.presentationMode);

  return (
    <ReactFlowProvider>
      <HashImporter />
      <div className="h-full flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 min-h-0 relative">
          {!presentationMode && <Sidebar />}
          <EditorMain />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
