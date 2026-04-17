"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  /** Width of the sidebar in pixels (user-resizable) */
  sidebarWidth: number;
  propertiesPanelOpen: boolean;
  /** Whether the properties panel is docked as a fixed split (vs floating overlay) */
  propertiesPanelDocked: boolean;
  simulationPanelOpen: boolean;
  costPanelOpen: boolean;
  /** Validation panel (bottom slide-up) */
  validationPanelOpen: boolean;
  /** What-if cost analysis panel */
  whatIfPanelOpen: boolean;
  /** Templates dialog */
  templatesDialogOpen: boolean;
  /** Keyboard shortcuts modal */
  shortcutsModalOpen: boolean;
  /** Well-Architected Score panel */
  wellArchitectedPanelOpen: boolean;
  /** Comparison mode: show snapshot diff overlay */
  comparisonModeActive: boolean;
  /** Snap nodes to a 16×16 grid while dragging */
  snapToGrid: boolean;
  /** Presentation mode: hides sidebar and all panels, full-screen canvas */
  presentationMode: boolean;
  /** Set to true to trigger a Dagre auto-layout pass in CanvasEffects */
  autoLayoutPending: boolean;
  /** Direction for auto-layout: top-to-bottom or left-to-right */
  autoLayoutDirection: "TB" | "LR";
  /** Whether the user has completed the onboarding tour */
  onboardingCompleted: boolean;
  /** IDs of sidebar categories that are expanded */
  expandedCategories: string[];

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarWidth: (w: number) => void;
  openPropertiesPanel: () => void;
  closePropertiesPanel: () => void;
  togglePropertiesPanelDocked: () => void;
  toggleSimulationPanel: () => void;
  openSimulationPanel: () => void;
  closeSimulationPanel: () => void;
  toggleCostPanel: () => void;
  toggleValidationPanel: () => void;
  openValidationPanel: () => void;
  closeValidationPanel: () => void;
  toggleWhatIfPanel: () => void;
  openTemplatesDialog: () => void;
  closeTemplatesDialog: () => void;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  toggleShortcutsModal: () => void;
  toggleWellArchitectedPanel: () => void;
  openWellArchitectedPanel: () => void;
  toggleComparisonMode: () => void;
  toggleSnapToGrid: () => void;
  togglePresentationMode: () => void;
  requestAutoLayout: (direction?: "TB" | "LR") => void;
  clearAutoLayout: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  toggleExpandedCategory: (id: string) => void;
  setExpandedCategories: (ids: string[]) => void;
}

const DEFAULT_EXPANDED = ["compute", "networking", "messaging", "application", "messaging-app"];

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: 288,
      propertiesPanelOpen: false,
      propertiesPanelDocked: false,
      simulationPanelOpen: false,
      costPanelOpen: false,
      validationPanelOpen: false,
      whatIfPanelOpen: false,
      templatesDialogOpen: false,
      shortcutsModalOpen: false,
      wellArchitectedPanelOpen: false,
      comparisonModeActive: false,
      snapToGrid: false,
      presentationMode: false,
      autoLayoutPending: false,
      autoLayoutDirection: "TB",
      onboardingCompleted: false,
      expandedCategories: DEFAULT_EXPANDED,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(200, Math.min(480, w)) }),

      openPropertiesPanel: () => set({ propertiesPanelOpen: true }),
      closePropertiesPanel: () => set({ propertiesPanelOpen: false }),
      togglePropertiesPanelDocked: () =>
        set((s) => ({ propertiesPanelDocked: !s.propertiesPanelDocked })),

      toggleSimulationPanel: () =>
        set((s) => ({ simulationPanelOpen: !s.simulationPanelOpen })),
      openSimulationPanel: () => set({ simulationPanelOpen: true }),
      closeSimulationPanel: () => set({ simulationPanelOpen: false }),

      toggleCostPanel: () =>
        set((s) => ({ costPanelOpen: !s.costPanelOpen })),

      toggleValidationPanel: () =>
        set((s) => ({ validationPanelOpen: !s.validationPanelOpen })),
      openValidationPanel: () => set({ validationPanelOpen: true }),
      closeValidationPanel: () => set({ validationPanelOpen: false }),

      toggleWhatIfPanel: () =>
        set((s) => ({ whatIfPanelOpen: !s.whatIfPanelOpen })),

      openTemplatesDialog: () => set({ templatesDialogOpen: true }),
      closeTemplatesDialog: () => set({ templatesDialogOpen: false }),

      openShortcutsModal: () => set({ shortcutsModalOpen: true }),
      closeShortcutsModal: () => set({ shortcutsModalOpen: false }),
      toggleShortcutsModal: () => set((s) => ({ shortcutsModalOpen: !s.shortcutsModalOpen })),

      toggleWellArchitectedPanel: () =>
        set((s) => ({ wellArchitectedPanelOpen: !s.wellArchitectedPanelOpen })),
      openWellArchitectedPanel: () => set({ wellArchitectedPanelOpen: true }),

      toggleComparisonMode: () =>
        set((s) => ({ comparisonModeActive: !s.comparisonModeActive })),

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

      completeOnboarding: () => set({ onboardingCompleted: true }),
      resetOnboarding: () => set({ onboardingCompleted: false }),

      toggleExpandedCategory: (id) =>
        set((s) => ({
          expandedCategories: s.expandedCategories.includes(id)
            ? s.expandedCategories.filter((c) => c !== id)
            : [...s.expandedCategories, id],
        })),
      setExpandedCategories: (ids) => set({ expandedCategories: ids }),
    }),
    {
      name: "aws-arch-ui",
      // Only persist user preferences, not ephemeral panel/dialog states
      partialize: (s) => ({
        sidebarWidth: s.sidebarWidth,
        sidebarCollapsed: s.sidebarCollapsed,
        propertiesPanelDocked: s.propertiesPanelDocked,
        snapToGrid: s.snapToGrid,
        onboardingCompleted: s.onboardingCompleted,
        expandedCategories: s.expandedCategories,
      }),
    }
  )
);
