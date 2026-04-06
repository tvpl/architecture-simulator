"use client";
/**
 * useKeyboardShortcuts — global keyboard handler for canvas actions.
 * Must be called inside ReactFlow context (via CanvasEffects).
 *
 * Shortcuts:
 *   Ctrl+Z           → undo
 *   Ctrl+Y / Ctrl+⇧Z → redo
 *   Ctrl+D           → duplicate selected node
 *   Ctrl+C           → copy selected node (to internal clipboard)
 *   Ctrl+V           → paste from internal clipboard
 *   Escape           → clear selection
 */
import { useEffect, useRef } from "react";
import { useFlowStore } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";

interface UseKeyboardShortcutsOptions {
  onStartRename?: (nodeId: string) => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onStartRename } = options;
  const clipboardNodeId = useRef<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Never intercept while user is typing in an input/textarea/contenteditable
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // ── Undo ──────────────────────────────────────────────────────────────
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        // Access temporal store directly (vanilla store, no hook needed)
        (useFlowStore as unknown as { temporal: { getState: () => { undo: () => void } } })
          .temporal.getState().undo();
        return;
      }

      // ── Redo ──────────────────────────────────────────────────────────────
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        (useFlowStore as unknown as { temporal: { getState: () => { redo: () => void } } })
          .temporal.getState().redo();
        return;
      }

      // ── Copy ──────────────────────────────────────────────────────────────
      if (ctrl && e.key === "c") {
        const { selectedNodeId } = useSelectionStore.getState();
        if (selectedNodeId) {
          clipboardNodeId.current = selectedNodeId;
        }
        return;
      }

      // ── Paste ─────────────────────────────────────────────────────────────
      if (ctrl && e.key === "v") {
        if (clipboardNodeId.current) {
          useFlowStore.getState().duplicateNode(clipboardNodeId.current);
        }
        return;
      }

      // ── Duplicate ─────────────────────────────────────────────────────────
      if (ctrl && e.key === "d") {
        e.preventDefault();
        const { selectedNodeId } = useSelectionStore.getState();
        if (selectedNodeId) {
          useFlowStore.getState().duplicateNode(selectedNodeId);
        }
        return;
      }

      // ── F2: rename selected node ──────────────────────────────────────────
      if (e.key === "F2" && onStartRename) {
        const { selectedNodeId } = useSelectionStore.getState();
        if (selectedNodeId) {
          e.preventDefault();
          onStartRename(selectedNodeId);
        }
        return;
      }

      // ── Escape: clear selection ───────────────────────────────────────────
      if (e.key === "Escape") {
        useSelectionStore.getState().clearSelection();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onStartRename]);
}
