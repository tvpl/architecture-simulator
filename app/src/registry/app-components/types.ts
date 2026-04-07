/**
 * AppComponentDefinition — the contract for Layer 2 application component modules.
 * Parallel to ServiceDefinition but for app-level components.
 */
import type { AppComponentType, AppComponentCategory } from "@/domain/entities/app-component";
import type { ConnectionProtocol } from "@/domain/entities/edge";
import type { AWSServiceType } from "@/domain/entities/node";
import type { ConfigSection } from "../types";

export interface AppPaletteCategory {
  id: AppComponentCategory;
  label: string;
  services: AppPaletteEntry[];
}

export interface AppPaletteEntry {
  type: AppComponentType;
  label: string;
  description: string;
  iconName: string;
  color: string;
  bgColor: string;
}

export interface AppComponentDefinition {
  type: AppComponentType;
  label: string;
  description: string;
  /** Detailed description shown as tooltip to help users who don't know K8s */
  helpText: string;
  category: AppComponentCategory;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;

  /** Which Layer 1 infrastructure types can host this component */
  allowedHostTypes: AWSServiceType[];

  /** Allowed incoming connection protocols */
  allowedIncomingProtocols: ConnectionProtocol[];
  /** Allowed outgoing connection protocols */
  allowedOutgoingProtocols: ConnectionProtocol[];

  /** Config panel sections */
  configSections: ConfigSection[];
}

export interface IAppComponentRegistry {
  register(definition: AppComponentDefinition): void;
  get(type: AppComponentType): AppComponentDefinition | undefined;
  getAll(): AppComponentDefinition[];
  getByCategory(category: AppComponentCategory): AppComponentDefinition[];
  buildPalette(): AppPaletteCategory[];
}
