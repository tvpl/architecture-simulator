/**
 * Internal app component registry instance.
 * Imported by component modules to avoid circular deps.
 */
import type { AppComponentType, AppComponentCategory } from "@/domain/entities/app-component";
import type {
  AppComponentDefinition,
  IAppComponentRegistry,
  AppPaletteCategory,
} from "./types";

const CATEGORY_LABELS: Record<AppComponentCategory, string> = {
  application: "Aplicação",
  "messaging-app": "Mensageria",
  "networking-app": "Rede & Roteamento",
  scheduling: "Agendamento",
  "data-access": "Acesso a Dados",
};

const CATEGORY_ORDER: AppComponentCategory[] = [
  "application",
  "messaging-app",
  "networking-app",
  "scheduling",
  "data-access",
];

class AppComponentRegistry implements IAppComponentRegistry {
  private components = new Map<AppComponentType, AppComponentDefinition>();

  register(definition: AppComponentDefinition): void {
    this.components.set(definition.type, definition);
  }

  get(type: AppComponentType): AppComponentDefinition | undefined {
    return this.components.get(type);
  }

  getAll(): AppComponentDefinition[] {
    return Array.from(this.components.values());
  }

  getByCategory(category: AppComponentCategory): AppComponentDefinition[] {
    return this.getAll().filter((c) => c.category === category);
  }

  buildPalette(): AppPaletteCategory[] {
    return CATEGORY_ORDER
      .map((category) => ({
        id: category,
        label: CATEGORY_LABELS[category],
        services: this.getByCategory(category).map((c) => ({
          type: c.type,
          label: c.label,
          description: c.description,
          iconName: c.iconName,
          color: c.color,
          bgColor: c.bgColor,
        })),
      }))
      .filter((c) => c.services.length > 0);
  }
}

export const appComponentRegistry = new AppComponentRegistry();
