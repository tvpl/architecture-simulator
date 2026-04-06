"use client";
/**
 * NoteNode — sticky-note style annotation node.
 * Supports color variants and inline text editing.
 * Unlike ServiceNode, it has no layer-specific overlays.
 */
import React, { memo, useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/stores/flow-store";
import type { FlowNode } from "@/stores/flow-store";
import type { NoteConfig } from "@/domain/entities/node";

const COLOR_STYLES: Record<NoteConfig["color"], { bg: string; border: string; text: string }> = {
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-900 dark:text-yellow-100",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-100",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-900 dark:text-green-100",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    border: "border-pink-300 dark:border-pink-700",
    text: "text-pink-900 dark:text-pink-100",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-900 dark:text-purple-100",
  },
};

const NoteNode = memo(function NoteNode({ data, selected }: NodeProps<FlowNode>) {
  const config = data.config as NoteConfig;
  const color = config?.color ?? "yellow";
  const styles = COLOR_STYLES[color] ?? COLOR_STYLES.yellow;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeConfig = useFlowStore((s) => s.updateNodeConfig);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(config?.content ?? "");
    setIsEditing(true);
  }, [config?.content]);

  const handleBlur = () => {
    setIsEditing(false);
    if (draft !== config?.content) {
      updateNodeConfig(data.id, { content: draft });
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={cn(
        "relative min-w-[160px] max-w-[280px] rounded-lg border-2 shadow-sm transition-all",
        styles.bg,
        styles.border,
        selected && "shadow-lg ring-2 ring-offset-1 ring-primary/30"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/40 !border-2 !border-background hover:!bg-muted-foreground transition-colors"
      />

      {/* Note header bar */}
      <div className={cn("h-1.5 rounded-t-md opacity-60", {
        "bg-yellow-400": color === "yellow",
        "bg-blue-400": color === "blue",
        "bg-green-400": color === "green",
        "bg-pink-400": color === "pink",
        "bg-purple-400": color === "purple",
      })} />

      <div className="p-3 min-h-[60px]">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleBlur();
            }}
            className={cn(
              "w-full resize-none bg-transparent text-xs leading-relaxed outline-none",
              "min-h-[60px] max-h-[200px]",
              styles.text
            )}
            placeholder="Adicione uma anotação..."
          />
        ) : (
          <p
            className={cn(
              "text-xs leading-relaxed whitespace-pre-wrap break-words cursor-text",
              styles.text,
              !config?.content && "text-muted-foreground italic"
            )}
          >
            {config?.content || "Clique duas vezes para editar..."}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/40 !border-2 !border-background hover:!bg-muted-foreground transition-colors"
      />
    </div>
  );
});

export { NoteNode };
