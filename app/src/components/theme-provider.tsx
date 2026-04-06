"use client";
/**
 * ThemeProvider — syncs Zustand theme state to the `dark` class on <html>.
 * Must wrap the app in layout.tsx so the class is applied before paint.
 */
import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}
