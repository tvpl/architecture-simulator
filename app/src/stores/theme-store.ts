"use client";
/**
 * Theme Store — persists light/dark preference to localStorage.
 * On first load, detects OS prefers-color-scheme if no saved preference exists.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: getSystemTheme(),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "aws-arch-theme",
      // Only restore if a value was explicitly saved (version guard)
      onRehydrateStorage: () => (state) => {
        // If no persisted state existed, the initializer already ran getSystemTheme()
        // Nothing extra needed here
        void state;
      },
    }
  )
);
