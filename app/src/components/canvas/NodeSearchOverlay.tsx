"use client";
/**
 * NodeSearchOverlay — Cmd+F / Ctrl+F floating search over canvas nodes.
 * Filters by label, shows up to 8 results, navigates to node on click.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useFlowStore } from "@/stores/flow-store";
import { cn } from "@/lib/utils";

export function NodeSearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setCenter } = useReactFlow();

  const nodes = useFlowStore((s) => s.nodes);

  // Toggle on Cmd+F / Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        // Allow default browser find only if we are not taking over
        e.preventDefault();
        if (!isEditable) {
          setOpen((prev) => !prev);
        }
        return;
      }

      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter nodes by label
  const filtered = query.trim()
    ? nodes.filter((n) =>
        n.data.label.toLowerCase().includes(query.trim().toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = useCallback(
    (node: typeof nodes[number]) => {
      setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 500 });
      setOpen(false);
    },
    [setCenter]
  );

  if (!open) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-72">
      <div className="bg-background border border-border shadow-2xl rounded-xl overflow-hidden">
        {/* Search input row */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Buscar nó..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          />
          <kbd className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results list */}
        {filtered.length > 0 && (
          <ul>
            {filtered.map((node) => (
              <li key={node.id}>
                <button
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-left",
                    "hover:bg-muted/70 transition-colors"
                  )}
                  onClick={() => handleSelect(node)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {node.data.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {node.data.type}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state when typing but no results */}
        {query.trim() && filtered.length === 0 && (
          <div className="px-3 py-3 text-xs text-muted-foreground text-center">
            Nenhum nó encontrado
          </div>
        )}
      </div>
    </div>
  );
}
