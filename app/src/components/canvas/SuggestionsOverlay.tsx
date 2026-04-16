"use client";
/**
 * SuggestionsOverlay — shows best-practice hints as a collapsible pill
 * at the bottom-left of the canvas. Must be rendered INSIDE <ReactFlow>.
 */
import { useNodes, useEdges } from "@xyflow/react";
import { useMemo, useState } from "react";
import { Lightbulb, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  getArchitectureSuggestions,
  type NodeSuggestion,
  type SuggestionSeverity,
} from "@/domain/services/architecture-suggestions";
import { cn } from "@/lib/utils";

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_ICON: Record<SuggestionSeverity, string> = {
  tip: "💡",
  warning: "⚠️",
  improvement: "📈",
};

const SEVERITY_COLOR: Record<SuggestionSeverity, string> = {
  tip: "text-blue-500",
  warning: "text-amber-500",
  improvement: "text-emerald-500",
};

const SEVERITY_BORDER: Record<SuggestionSeverity, string> = {
  tip: "border-blue-500/30",
  warning: "border-amber-500/30",
  improvement: "border-emerald-500/30",
};

const SEVERITY_BG: Record<SuggestionSeverity, string> = {
  tip: "bg-blue-500/5",
  warning: "bg-amber-500/5",
  improvement: "bg-emerald-500/5",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SuggestionsOverlay() {
  const rawNodes = useNodes();
  const rawEdges = useEdges();

  // Map ReactFlow nodes to the shape expected by the suggestions engine
  const inputNodes = useMemo(
    () =>
      rawNodes.map((n) => ({
        id: n.id,
        type: n.type ?? "",
        data: {
          type: (n.data as { type?: string }).type ?? "",
          config: (n.data as { config?: Record<string, unknown> }).config ?? {},
        },
      })),
    [rawNodes]
  );

  const inputEdges = useMemo(
    () =>
      rawEdges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
    [rawEdges]
  );

  const allSuggestions = useMemo(
    () => getArchitectureSuggestions(inputNodes, inputEdges),
    [inputNodes, inputEdges]
  );

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(
    () => allSuggestions.filter((s) => !dismissed.has(`${s.nodeId}-${s.title}`)),
    [allSuggestions, dismissed]
  );

  const dismiss = (s: NodeSuggestion) => {
    setDismissed((prev) => new Set(prev).add(`${s.nodeId}-${s.title}`));
  };

  const dismissAll = () => {
    const next = new Set(dismissed);
    for (const s of visible) next.add(`${s.nodeId}-${s.title}`);
    setDismissed(next);
    setExpanded(false);
  };

  // Nothing to show
  if (visible.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-2">
      {/* Expanded card list */}
      {expanded && (
        <div
          className={cn(
            "w-72 rounded-xl border border-border bg-popover shadow-xl overflow-hidden",
            "transition-all duration-200"
          )}
        >
          {/* List */}
          <ul className="max-h-64 overflow-y-auto divide-y divide-border/50">
            {visible.map((s) => {
              const key = `${s.nodeId}-${s.title}`;
              return (
                <li
                  key={key}
                  className={cn(
                    "flex gap-2.5 px-3 py-2.5 transition-all duration-150",
                    SEVERITY_BG[s.severity]
                  )}
                >
                  {/* Icon */}
                  <span className="text-base leading-none mt-0.5 shrink-0">
                    {SEVERITY_ICON[s.severity]}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-semibold leading-tight",
                        SEVERITY_COLOR[s.severity]
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {s.description}
                    </p>
                    {s.action && (
                      <p className="text-[10px] text-foreground/60 mt-1 font-medium">
                        → {s.action}
                      </p>
                    )}
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => dismiss(s)}
                    className={cn(
                      "shrink-0 p-0.5 rounded hover:bg-muted transition-colors",
                      "text-muted-foreground hover:text-foreground"
                    )}
                    title="Dispensar"
                    aria-label="Dispensar sugestão"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {visible.length} {visible.length === 1 ? "sugestão" : "sugestões"}
            </span>
            <button
              onClick={dismissAll}
              className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Dispensar todas
            </button>
          </div>
        </div>
      )}

      {/* Collapsed pill */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full",
          "bg-popover border border-border shadow-md",
          "hover:bg-accent transition-colors duration-150",
          "text-sm font-medium text-foreground"
        )}
        aria-expanded={expanded}
        aria-label="Sugestões de arquitetura"
      >
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs">
          {visible.length} {visible.length === 1 ? "sugestão" : "sugestões"}
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
