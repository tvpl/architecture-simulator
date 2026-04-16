"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectData } from "@/stores/flow-store";

export interface UserTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  data: ProjectData;
  nodeCount: number;
  edgeCount: number;
  tags: string[];
}

interface UserTemplatesState {
  templates: UserTemplate[];
  saveTemplate: (name: string, description: string, tags: string[], data: ProjectData) => void;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<Pick<UserTemplate, "name" | "description" | "tags">>) => void;
}

export const useUserTemplatesStore = create<UserTemplatesState>()(
  persist(
    (set) => ({
      templates: [],
      saveTemplate: (name, description, tags, data) =>
        set((s) => ({
          templates: [
            ...s.templates,
            {
              id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name,
              description,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              data,
              nodeCount: data.infrastructure.nodes.length,
              edgeCount: data.infrastructure.edges.length,
              tags,
            },
          ],
        })),
      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        })),
    }),
    { name: "aws-arch-user-templates" }
  )
);
