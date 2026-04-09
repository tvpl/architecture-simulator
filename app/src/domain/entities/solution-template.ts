/**
 * SolutionTemplate — reusable patterns for Layer 2 (Solution Design).
 * Users can save their own templates or use built-in patterns.
 */
import type { AppComponentNode, AppComponentType } from "./app-component";
import type { ConnectionEdge } from "./edge";
import type { AWSServiceType } from "./node";

export const TEMPLATE_CATEGORIES = [
  "pod-pattern",
  "messaging-pattern",
  "api-pattern",
  "scheduling-pattern",
  "infrastructure-pattern",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export interface SolutionTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** The components that make up this template */
  components: AppComponentNode[];
  /** Internal connections between template components */
  edges: ConnectionEdge[];
  /** Which infrastructure types from Layer 1 can host this template */
  requiredHostTypes: AWSServiceType[];
  /** Component types used in this template (for quick filtering) */
  componentTypes: AppComponentType[];
  /** Whether this is a built-in template (read-only) or user-created */
  isBuiltIn: boolean;
  /** ISO timestamp of creation */
  createdAt: string;
}
