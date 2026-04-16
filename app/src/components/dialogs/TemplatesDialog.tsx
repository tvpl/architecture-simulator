"use client";
/**
 * TemplatesDialog — modal with pre-built architecture templates.
 * User picks a template and it loads directly onto the canvas.
 * Also shows user-saved templates in a second tab.
 */
import React, { useState } from "react";
import { LayoutTemplate, ChevronRight, DollarSign, Tag, X, BookMarked, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/stores/flow-store";
import { ARCHITECTURE_TEMPLATES, TEMPLATE_CATEGORY_LABELS } from "@/lib/templates";
import type { ArchitectureTemplate } from "@/lib/templates";
import { useUserTemplatesStore, type UserTemplate } from "@/stores/user-templates-store";
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

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function TemplatesDialog({ open, onClose }: TemplatesDialogProps) {
  const { importProject } = useFlowStore();
  const { templates: userTemplates, deleteTemplate } = useUserTemplatesStore();

  const [selected, setSelected] = useState<ArchitectureTemplate | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<ArchitectureTemplate["category"] | "all">("all");
  const [activeTab, setActiveTab] = useState<"gallery" | "mine">("gallery");

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

  const handleLoadUser = (template: UserTemplate) => {
    importProject(template.data);
    toast.success(`Template "${template.name}" carregado!`);
    onClose();
  };

  const handleDeleteUser = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Excluir template "${name}"?`)) {
      deleteTemplate(id);
      if (selectedUser?.id === id) setSelectedUser(null);
      toast.info("Template excluído.");
    }
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

        {/* Tab switcher */}
        <div className="flex gap-1 px-6 py-2 border-b border-border bg-muted/20 shrink-0">
          <button
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === "gallery"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Templates Oficiais
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === "mine"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Meus Templates
            {userTemplates.length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                {userTemplates.length}
              </span>
            )}
          </button>
        </div>

        {/* Category filter — only for gallery tab */}
        {activeTab === "gallery" && (
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
        )}

        {/* Gallery tab content */}
        {activeTab === "gallery" && (
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
        )}

        {/* Mine tab content */}
        {activeTab === "mine" && (
          <div className="flex-1 overflow-y-auto p-6">
            {userTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookMarked className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Nenhum template salvo ainda</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Use o menu <span className="font-medium text-foreground">Exportar → Salvar como Template</span> no canvas para criar um.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedUser(selectedUser?.id === template.id ? null : template)}
                    className={cn(
                      "relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md",
                      selectedUser?.id === template.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-muted text-muted-foreground">
                        Meu Template
                      </span>
                      <button
                        onClick={(e) => handleDeleteUser(e, template.id, template.name)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir template"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground mb-1">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{template.description}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                      <span>{template.nodeCount} serviços</span>
                      <span>·</span>
                      <span>{template.edgeCount} conexões</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDate(template.createdAt)}
                      </span>
                    </div>

                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-1">
                        {template.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="flex items-center gap-0.5 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            <Tag className="w-2 h-2" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedUser?.id === template.id && (
                      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-2 mt-3 border-t border-primary/20">
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={(e) => { e.stopPropagation(); handleLoadUser(template); }}
                        >
                          Usar template
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    {selectedUser?.id === template.id && <div className="h-8" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
