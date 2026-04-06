"use client";
import { create } from "zustand";
import type { LayerType } from "@/domain/entities/layer";

interface LayerState {
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
}

export const useLayerStore = create<LayerState>()((set) => ({
  activeLayer: "architecture",
  setActiveLayer: (layer) => set({ activeLayer: layer }),
}));
