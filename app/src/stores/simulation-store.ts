"use client";
import { create } from "zustand";
import type { SimulationResult } from "@/domain/entities/simulation";

type SimulationStatus = "idle" | "running" | "complete" | "error";

interface SimulationState {
  status: SimulationStatus;
  result: SimulationResult | null;
  error: string | null;

  setRunning: () => void;
  setResult: (result: SimulationResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>()((set) => ({
  status: "idle",
  result: null,
  error: null,

  setRunning: () => set({ status: "running", result: null, error: null }),
  setResult: (result) => set({ status: "complete", result, error: null }),
  setError: (error) => set({ status: "error", error }),
  reset: () => set({ status: "idle", result: null, error: null }),
}));
