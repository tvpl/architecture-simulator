"use client";
import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { HistoryPanel } from "@/components/panels/HistoryPanel";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";
import { ValidationPanel } from "@/components/panels/ValidationPanel";
import { WhatIfPanel } from "@/components/panels/WhatIfPanel";
import { ErrorBoundary } from "@/components/error-boundary";
import { useFlowStore } from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";

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

export default function EditorPage() {
  const presentationMode = useUIStore((s) => s.presentationMode);

  return (
    <ReactFlowProvider>
      <HashImporter />
      <div className="h-full flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 min-h-0 relative">
          {!presentationMode && <Sidebar />}
          <main className="flex-1 relative min-w-0">
            <ErrorBoundary>
              <FlowCanvas />
            </ErrorBoundary>
            {!presentationMode && <PropertiesPanel />}
            {!presentationMode && <WhatIfPanel />}
            {!presentationMode && <HistoryPanel />}
            {!presentationMode && <SimulationPanel />}
            {!presentationMode && <ValidationPanel />}
          </main>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
