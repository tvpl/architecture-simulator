"use client";
import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  propertiesPanelOpen: boolean;
  simulationPanelOpen: boolean;
  costPanelOpen: boolean;
  /** Snap nodes to a 16×16 grid while dragging */
  snapToGrid: boolean;
  /** Presentation mode: hides sidebar and all panels, full-screen canvas */
  presentationMode: boolean;
  /** Set to true to trigger a Dagre auto-layout pass in CanvasEffects */
  autoLayoutPending: boolean;
  /** Direction for auto-layout: top-to-bottom or left-to-right */
  autoLayoutDirection: "TB" | "LR";

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  openPropertiesPanel: () => void;
  closePropertiesPanel: () => void;
  toggleSimulationPanel: () => void;
  openSimulationPanel: () => void;
  closeSimulationPanel: () => void;
  toggleCostPanel: () => void;
  toggleSnapToGrid: () => void;
  togglePresentationMode: () => void;
  requestAutoLayout: (direction?: "TB" | "LR") => void;
  clearAutoLayout: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  propertiesPanelOpen: false,
  simulationPanelOpen: false,
  costPanelOpen: false,
  snapToGrid: false,
  presentationMode: false,
  autoLayoutPending: false,
  autoLayoutDirection: "TB",

  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  openPropertiesPanel: () => set({ propertiesPanelOpen: true }),
  closePropertiesPanel: () => set({ propertiesPanelOpen: false }),

  toggleSimulationPanel: () =>
    set((s) => ({ simulationPanelOpen: !s.simulationPanelOpen })),
  openSimulationPanel: () => set({ simulationPanelOpen: true }),
  closeSimulationPanel: () => set({ simulationPanelOpen: false }),

  toggleCostPanel: () =>
    set((s) => ({ costPanelOpen: !s.costPanelOpen })),

  toggleSnapToGrid: () =>
    set((s) => ({ snapToGrid: !s.snapToGrid })),

  togglePresentationMode: () =>
    set((s) => ({
      presentationMode: !s.presentationMode,
      // Collapse sidebar and close panels when entering presentation mode
      ...(!s.presentationMode
        ? {
            sidebarCollapsed: true,
            propertiesPanelOpen: false,
            simulationPanelOpen: false,
          }
        : { sidebarCollapsed: false }),
    })),

  requestAutoLayout: (direction = "TB") =>
    set({ autoLayoutPending: true, autoLayoutDirection: direction }),

  clearAutoLayout: () => set({ autoLayoutPending: false }),
}));
