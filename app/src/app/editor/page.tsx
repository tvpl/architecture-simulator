"use client";
import { ReactFlowProvider } from "@xyflow/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";

export default function EditorPage() {
  return (
    <ReactFlowProvider>
      <div className="h-full flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 min-h-0 relative">
          <Sidebar />
          <main className="flex-1 relative min-w-0">
            <FlowCanvas />
            <PropertiesPanel />
            <SimulationPanel />
          </main>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
