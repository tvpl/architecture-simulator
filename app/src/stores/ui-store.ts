"use client";
import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  propertiesPanelOpen: boolean;
  simulationPanelOpen: boolean;
  costPanelOpen: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  openPropertiesPanel: () => void;
  closePropertiesPanel: () => void;
  toggleSimulationPanel: () => void;
  openSimulationPanel: () => void;
  closeSimulationPanel: () => void;
  toggleCostPanel: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  propertiesPanelOpen: false,
  simulationPanelOpen: false,
  costPanelOpen: false,

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
}));
