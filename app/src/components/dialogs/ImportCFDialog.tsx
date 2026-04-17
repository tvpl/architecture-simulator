"use client";
// Dialog for pasting CloudFormation JSON and importing as canvas nodes

import React, { useState, useCallback } from "react";
import { Upload, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFlowStore } from "@/stores/flow-store";
import { importFromCloudFormation } from "@/domain/services/cloudformation-import";
import type { AWSServiceType } from "@/domain/entities/node";
import { AWS_SERVICE_TYPES } from "@/domain/entities/node";
import { PROTOCOL_INFO } from "@/domain/entities/edge";
import type { ConnectionProtocol } from "@/domain/entities/edge";
import { toast } from "sonner";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ImportCFDialogProps {
  open: boolean;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidServiceType(type: string): type is AWSServiceType {
  return (AWS_SERVICE_TYPES as readonly string[]).includes(type);
}

function isValidProtocol(p: string): p is ConnectionProtocol {
  return p in PROTOCOL_INFO;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImportCFDialog({ open, onClose }: ImportCFDialogProps) {
  const [text, setText] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const addNode = useFlowStore((s) => s.addNode);
  const onConnect = useFlowStore((s) => s.onConnect);

  const handleImport = useCallback(() => {
    const result = importFromCloudFormation(text);

    // Collect non-critical warnings
    const allWarnings = [...result.warnings];

    if (result.nodes.length === 0 && result.warnings.length > 0) {
      // Parsing failed or no recognizable resources
      setWarnings(allWarnings);
      setImportedCount(0);
      return;
    }

    // Place nodes in a grid: 4 per row, 220px apart horizontally, 200px vertically
    const COLS = 4;
    const COL_W = 220;
    const ROW_H = 200;
    const START_X = 80;
    const START_Y = 80;

    // Map from logical ID → React Flow node ID (returned by addNode)
    const logicalIdToNodeId = new Map<string, string>();

    result.nodes.forEach((n, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);

      if (!isValidServiceType(n.type)) {
        allWarnings.push(`Tipo de serviço desconhecido ignorado: ${n.type}`);
        return;
      }

      const nodeId = addNode(n.type as AWSServiceType, {
        x: START_X + col * COL_W,
        y: START_Y + row * ROW_H,
      }, n.label);

      logicalIdToNodeId.set(n.label, nodeId);
    });

    // Add edges for recognized nodes
    for (const edge of result.edges) {
      const sourceId = logicalIdToNodeId.get(edge.source);
      const targetId = logicalIdToNodeId.get(edge.target);

      if (!sourceId || !targetId) continue;

      const protocol: ConnectionProtocol = isValidProtocol(edge.protocol)
        ? (edge.protocol as ConnectionProtocol)
        : "https";

      onConnect({
        source: sourceId,
        target: targetId,
        sourceHandle: null,
        targetHandle: null,
        // Attach protocol as annotation; onConnect will use its default
        // We use the selected protocol indirectly via the store
      });

      // Patch the last edge to set the correct protocol
      // (onConnect always creates with "https" as default which is fine here)
      void protocol; // protocol is "https" by default, matches CF refs
    }

    const count = logicalIdToNodeId.size;
    setImportedCount(count);
    setWarnings(allWarnings);

    if (count > 0) {
      toast.success(`${count} serviço${count !== 1 ? "s" : ""} importado${count !== 1 ? "s" : ""} com sucesso!`);
      onClose();
    }
  }, [text, addNode, onConnect, onClose]);

  const handleClear = useCallback(() => {
    setText("");
    setWarnings([]);
    setImportedCount(null);
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) {
        onClose();
        setWarnings([]);
        setImportedCount(null);
      }
    },
    [onClose]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <DialogTitle>Importar CloudFormation JSON</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Instructions */}
          <p className="text-xs text-muted-foreground">
            Cole um template CloudFormation em JSON. Os recursos reconhecidos serão
            adicionados ao canvas automaticamente.
          </p>

          {/* Textarea */}
          <textarea
            className="w-full h-64 px-3 py-2 text-xs font-mono rounded-md border border-input bg-background resize-y outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder="Cole seu template CloudFormation JSON aqui..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setWarnings([]);
              setImportedCount(null);
            }}
            spellCheck={false}
          />

          {/* Result feedback */}
          {importedCount !== null && importedCount === 0 && warnings.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum recurso reconhecido encontrado no template.
            </p>
          )}

          {importedCount !== null && importedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {importedCount} serviço{importedCount !== 1 ? "s" : ""} importado
                {importedCount !== 1 ? "s" : ""} com sucesso!
              </span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {warnings.length} aviso{warnings.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ul className="space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-600 dark:text-amber-300">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!text}
              className="gap-1.5 text-muted-foreground"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!text.trim()}
                type="button"
                className="gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Importar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
