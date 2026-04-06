"use client";
/**
 * ValidationPanel — lists all architecture errors and warnings.
 * Clicking a row selects and highlights the affected node.
 * Shows a badge on the Navbar toggle button when issues exist.
 */
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useValidationStore } from "@/stores/validation-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function ValidationPanel() {
  const { result } = useValidationStore();
  const { validationPanelOpen, closeValidationPanel } = useUIStore();
  const { selectNode } = useSelectionStore();

  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const total = errors.length + warnings.length;

  const handleItemClick = (nodeId?: string) => {
    if (nodeId) {
      selectNode(nodeId);
    }
  };

  return (
    <AnimatePresence>
      {validationPanelOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute left-2 right-2 bottom-2 z-20 max-h-72 flex flex-col bg-background border border-border rounded-xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
            {total === 0 ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : errors.length > 0 ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-sm font-semibold">Validação da Arquitetura</span>
              {errors.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                  {errors.length} erro{errors.length > 1 ? "s" : ""}
                </span>
              )}
              {warnings.length > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                  {warnings.length} aviso{warnings.length > 1 ? "s" : ""}
                </span>
              )}
              {total === 0 && (
                <span className="text-xs text-muted-foreground">Arquitetura válida</span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeValidationPanel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {total === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <ShieldCheck className="w-8 h-8 text-green-500 opacity-60" />
                <p className="text-sm">Nenhum problema encontrado.</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {errors.map((err, i) => (
                  <ValidationItem
                    key={`err-${i}`}
                    kind="error"
                    message={err.message}
                    code={err.code}
                    nodeId={err.nodeId}
                    edgeId={err.edgeId}
                    onClick={() => handleItemClick(err.nodeId)}
                  />
                ))}
                {errors.length > 0 && warnings.length > 0 && (
                  <Separator className="my-1" />
                )}
                {warnings.map((warn, i) => (
                  <ValidationItem
                    key={`warn-${i}`}
                    kind="warning"
                    message={warn.message}
                    code={warn.code}
                    nodeId={warn.nodeId}
                    edgeId={warn.edgeId}
                    onClick={() => handleItemClick(warn.nodeId)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ValidationItem({
  kind,
  message,
  code,
  nodeId,
  edgeId,
  onClick,
}: {
  kind: "error" | "warning";
  message: string;
  code: string;
  nodeId?: string;
  edgeId?: string;
  onClick: () => void;
}) {
  const isClickable = !!nodeId || !!edgeId;
  return (
    <button
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
        isClickable ? "cursor-pointer hover:bg-muted/60" : "cursor-default",
        kind === "error"
          ? "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
          : "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30"
      )}
    >
      {kind === "error" ? (
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium leading-snug",
          kind === "error" ? "text-red-800 dark:text-red-300" : "text-yellow-800 dark:text-yellow-300"
        )}>
          {message}
        </p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{code}</p>
      </div>
      {isClickable && (
        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
          → selecionar
        </span>
      )}
    </button>
  );
}
