"use client";
/**
 * NodeContextMenu — floating right-click context menu for canvas nodes.
 * Appears at mouse position and provides quick actions.
 */
import React, { useEffect, useRef } from "react";
import { Copy, Trash2, PenLine, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";

export interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

interface NodeContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onStartRename: (nodeId: string) => void;
}

export function NodeContextMenu({ menu, onClose, onStartRename }: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { removeNode, duplicateNode } = useFlowStore();
  const { selectNode } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const menuWidth = 192;
  const menuHeight = 160;
  const x = Math.min(menu.x, viewportWidth - menuWidth - 8);
  const y = Math.min(menu.y, viewportHeight - menuHeight - 8);

  const action = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: x, top: y }}
      className="fixed z-50 w-48 bg-background border border-border rounded-lg shadow-xl overflow-hidden py-1"
    >
      <MenuItem
        icon={<PenLine className="w-3.5 h-3.5" />}
        label="Renomear"
        shortcut="F2"
        onClick={() => action(() => onStartRename(menu.nodeId))}
      />
      <MenuItem
        icon={<Copy className="w-3.5 h-3.5" />}
        label="Duplicar"
        shortcut="Ctrl+D"
        onClick={() => action(() => duplicateNode(menu.nodeId))}
      />
      <MenuItem
        icon={<Layers className="w-3.5 h-3.5" />}
        label="Propriedades"
        onClick={() => action(() => {
          selectNode(menu.nodeId);
          openPropertiesPanel();
        })}
      />
      <div className="my-1 border-t border-border" />
      <MenuItem
        icon={<Trash2 className="w-3.5 h-3.5" />}
        label="Remover"
        shortcut="Del"
        danger
        onClick={() => action(() => removeNode(menu.nodeId))}
      />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted"
      )}
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border font-mono">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
