"use client";
import React, { useState } from "react";
import { BookMarked, Tag, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFlowStore } from "@/stores/flow-store";
import { useUserTemplatesStore } from "@/stores/user-templates-store";
import { toast } from "sonner";

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SaveTemplateDialog({ open, onClose }: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const exportProject = useFlowStore((s) => s.exportProject);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const { saveTemplate } = useUserTemplatesStore();

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "," || e.key === "Enter") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,$/, "");
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome obrigatório.");
      return;
    }
    if (nodes.length === 0) {
      toast.error("Canvas vazio. Adicione serviços primeiro.");
      return;
    }
    const data = exportProject();
    saveTemplate(name.trim(), description.trim(), tags, data);
    toast.success(`Template "${name}" salvo!`);
    setName("");
    setDescription("");
    setTags([]);
    setTagInput("");
    onClose();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-primary" />
            <DialogTitle>Salvar como Template</DialogTitle>
          </div>
          <DialogDescription>
            Salve a arquitetura atual como um template reutilizável.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Node count preview */}
          <div className="flex gap-3 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <span>{nodes.length} serviços</span>
            <span>·</span>
            <span>{edges.length} conexões</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Nome *</Label>
            <Input
              id="tpl-name"
              placeholder="Ex: API Gateway + Lambda + RDS"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc">Descrição</Label>
            <textarea
              id="tpl-desc"
              placeholder="Descreva o caso de uso deste template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-20 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-tags">Tags (pressione vírgula para adicionar)</Label>
            <div className="flex flex-wrap gap-1.5 p-2 border border-input rounded-md min-h-[40px] bg-background">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                    type="button"
                    aria-label={`Remover tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                id="tpl-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "serverless, api, auth..." : ""}
                className="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || nodes.length === 0}
              type="button"
            >
              <BookMarked className="w-4 h-4 mr-1.5" />
              Salvar Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
