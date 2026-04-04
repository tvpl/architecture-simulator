/**
 * Internal registry instance — imported by service modules to avoid circular deps.
 * The public `registry/index.ts` re-exports this after triggering all registrations.
 */
import type { AWSServiceType, NodeCategory } from "@/domain/entities/node";
import type {
  ServiceDefinition,
  IServiceRegistry,
  PaletteCategory,
} from "./types";

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  compute: "Computação",
  networking: "Rede",
  messaging: "Mensageria",
  storage: "Armazenamento",
  security: "Segurança",
  integration: "Integração",
};

const CATEGORY_ORDER: NodeCategory[] = [
  "compute",
  "networking",
  "messaging",
  "storage",
  "security",
  "integration",
];

class ServiceRegistry implements IServiceRegistry {
  private services = new Map<AWSServiceType, ServiceDefinition>();

  register(definition: ServiceDefinition): void {
    this.services.set(definition.type, definition);
  }

  get(type: AWSServiceType): ServiceDefinition | undefined {
    return this.services.get(type);
  }

  getAll(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  getByCategory(category: NodeCategory): ServiceDefinition[] {
    return this.getAll().filter((s) => s.category === category);
  }

  buildPalette(): PaletteCategory[] {
    return CATEGORY_ORDER.map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category],
      services: this.getByCategory(category).map((s) => ({
        type: s.type,
        label: s.label,
        description: s.description,
        iconName: s.iconName,
        color: s.color,
        bgColor: s.bgColor,
      })),
    })).filter((c) => c.services.length > 0);
  }
}

export const registry = new ServiceRegistry();
