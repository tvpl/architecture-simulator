"use client";
import React from "react";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const SHORTCUT_GROUPS = [
  {
    title: "Canvas",
    color: "text-blue-500",
    shortcuts: [
      { keys: ["Ctrl", "Z"], label: "Desfazer" },
      { keys: ["Ctrl", "Y"], label: "Refazer" },
      { keys: ["Ctrl", "Shift", "L"], label: "Auto-organizar layout" },
      { keys: ["Ctrl", "A"], label: "Selecionar tudo" },
      { keys: ["Escape"], label: "Limpar seleção" },
      { keys: ["Del"], label: "Remover selecionado" },
    ],
  },
  {
    title: "Nós",
    color: "text-violet-500",
    shortcuts: [
      { keys: ["Ctrl", "D"], label: "Duplicar nó selecionado" },
      { keys: ["Ctrl", "C"], label: "Copiar nó" },
      { keys: ["Ctrl", "V"], label: "Colar nó" },
      { keys: ["F2"], label: "Renomear nó" },
      { keys: ["Double-click"], label: "Renomear nó" },
      { keys: ["Right-click"], label: "Menu de contexto" },
    ],
  },
  {
    title: "Navegação",
    color: "text-emerald-500",
    shortcuts: [
      { keys: ["Ctrl", "K"], label: "Abrir paleta de comandos" },
      { keys: ["?"], label: "Ver atalhos" },
      { keys: ["Ctrl", "Scroll"], label: "Zoom in/out" },
      { keys: ["Space + Drag"], label: "Mover canvas (pan)" },
    ],
  },
  {
    title: "Camadas",
    color: "text-orange-500",
    shortcuts: [
      { keys: ["1"], label: "L1 — Infraestrutura" },
      { keys: ["2"], label: "L2 — Design de Solução" },
      { keys: ["3"], label: "L3 — Custos" },
      { keys: ["4"], label: "L4 — Simulação" },
    ],
  },
  {
    title: "Ações Rápidas",
    color: "text-pink-500",
    shortcuts: [
      { keys: ["Ctrl", "S"], label: "Exportar JSON" },
      { keys: ["Ctrl", "Enter"], label: "Executar simulação" },
      { keys: ["Shift + Drag"], label: "Seleção múltipla" },
      { keys: ["P"], label: "Modo apresentação" },
    ],
  },
];

interface ShortcutGroup {
  title: string;
  color: string;
  shortcuts: { keys: string[]; label: string }[];
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="text-muted-foreground/50 text-[10px]">+</span>
            )}
            <kbd className="bg-muted border border-border rounded px-1.5 py-0.5 text-[11px] font-mono text-foreground">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ShortcutGroupCard({ group }: { group: ShortcutGroup }) {
  return (
    <div className="space-y-1">
      <h3 className={cn("text-xs font-semibold uppercase tracking-wider mb-2", group.color)}>
        {group.title}
      </h3>
      <div className="divide-y divide-border/40">
        {group.shortcuts.map((shortcut, i) => (
          <ShortcutRow key={i} keys={shortcut.keys} label={shortcut.label} />
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal() {
  const shortcutsModalOpen = useUIStore((s) => s.shortcutsModalOpen);
  const closeShortcutsModal = useUIStore((s) => s.closeShortcutsModal);

  return (
    <Dialog open={shortcutsModalOpen} onOpenChange={(open) => { if (!open) closeShortcutsModal(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">Atalhos de Teclado</DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mt-2">
          {SHORTCUT_GROUPS.map((group) => (
            <ShortcutGroupCard key={group.title} group={group} />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Dica: pressione{" "}
            <kbd className="bg-muted border border-border rounded px-1.5 py-0.5 text-[11px] font-mono">
              ?
            </kbd>{" "}
            a qualquer momento para ver esta lista
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
