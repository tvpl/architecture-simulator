"use client";
/**
 * TemplatesDialog — modal with pre-built architecture templates.
 * User picks a template and it loads directly onto the canvas.
 */
import React, { useState } from "react";
import { LayoutTemplate, ChevronRight, DollarSign, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/stores/flow-store";
import { ARCHITECTURE_TEMPLATES, TEMPLATE_CATEGORY_LABELS } from "@/lib/templates";
import type { ArchitectureTemplate } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatUSD } from "@/lib/formatters";

interface TemplatesDialogProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<ArchitectureTemplate["category"], string> = {
  serverless: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  containers: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  data: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  security: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  microservices: "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
  "full-stack": "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
};

export function TemplatesDialog({ open, onClose }: TemplatesDialogProps) {
  const { importProject } = useFlowStore();
  const [selected, setSelected] = useState<ArchitectureTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<ArchitectureTemplate["category"] | "all">("all");

  type CategoryFilter = ArchitectureTemplate["category"] | "all";
  const categories: CategoryFilter[] = ["all", ...(Object.keys(TEMPLATE_CATEGORY_LABELS) as ArchitectureTemplate["category"][])];

  const filtered =
    activeCategory === "all"
      ? ARCHITECTURE_TEMPLATES
      : ARCHITECTURE_TEMPLATES.filter((t) => t.category === activeCategory);

  const handleLoad = (template: ArchitectureTemplate) => {
    importProject(template.data);
    toast.success(`Template "${template.name}" carregado!`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <DialogTitle>Templates de Arquitetura</DialogTitle>
          </div>
          <DialogDescription>
            Escolha um template para começar. Você pode personalizar livremente após carregar.
          </DialogDescription>
        </DialogHeader>

        {/* Category filter */}
        <div className="flex gap-1.5 px-6 py-3 border-b border-border shrink-0 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {cat === "all" ? "Todos" : TEMPLATE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelected(selected?.id === template.id ? null : template)}
                className={cn(
                  "relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md",
                  selected?.id === template.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/40"
                )}
              >
                {/* Category badge */}
                <div className="flex items-start justify-between mb-3">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider", CATEGORY_COLORS[template.category])}>
                    {TEMPLATE_CATEGORY_LABELS[template.category]}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    <span>~{formatUSD(template.estimatedCostUSD)}/mês</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-1">{template.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{template.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                  <span>{template.data.infrastructure.nodes.length} serviços</span>
                  <span>·</span>
                  <span>{template.data.infrastructure.edges.length} conexões</span>
                  {template.data.solutionDesign.nodes.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {template.data.solutionDesign.nodes.length} componentes L2
                      </span>
                    </>
                  )}
                </div>

                {/* Tags */}
                <div className="flex gap-1 flex-wrap">
                  {template.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      <Tag className="w-2 h-2" />
                      {tag}
                    </span>
                  ))}
                </div>

                {selected?.id === template.id && (
                  <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-2 mt-3 border-t border-primary/20">
                    <Button
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={(e) => { e.stopPropagation(); handleLoad(template); }}
                    >
                      Usar este template
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
                {selected?.id === template.id && <div className="h-8" />}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
