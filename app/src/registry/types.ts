/**
 * ServiceDefinition — the contract every AWS service module must fulfill.
 * Registering a service makes it available in the sidebar, canvas, config panels,
 * cost calculator, and simulation engine automatically.
 */
import type { NodeCategory, AWSServiceType } from "@/domain/entities/node";
import type { ConnectionProtocol } from "@/domain/entities/edge";

export interface PaletteCategory {
  id: NodeCategory;
  label: string;
  services: ServicePaletteEntry[];
}

export interface ServicePaletteEntry {
  type: AWSServiceType;
  label: string;
  description: string;
  iconName: string; // lucide icon name
  color: string;   // tailwind text color class
  bgColor: string; // tailwind bg color class
}

export interface ServiceDefinition {
  /** Unique identifier matching AWSServiceType */
  type: AWSServiceType;
  /** Display name */
  label: string;
  /** Short description shown in sidebar */
  description: string;
  /** Node category */
  category: NodeCategory;
  /** Lucide icon name */
  iconName: string;
  /** Tailwind text color (e.g., "text-orange-500") */
  color: string;
  /** Tailwind background color (e.g., "bg-orange-50") */
  bgColor: string;
  /** Border color for selected state */
  borderColor: string;

  /** Can this node contain other nodes (VPC, Subnet)? */
  isContainer?: boolean;
  /** Should this node be inside a container of this type? */
  requiredParent?: AWSServiceType;

  /** Allowed incoming protocols for validation hints */
  allowedIncomingProtocols: ConnectionProtocol[];
  /** Allowed outgoing protocols for validation hints */
  allowedOutgoingProtocols: ConnectionProtocol[];

  /**
   * Config panel sections rendered for this service.
   * Each section is a group of fields.
   */
  configSections: ConfigSection[];
}

export interface ConfigSection {
  title: string;
  fields: ConfigField[];
}

export type ConfigField =
  | NumberField
  | SelectField
  | TextFieldDef
  | SwitchField
  | SliderField;

interface BaseField {
  key: string;
  label: string;
  description?: string;
}

export interface NumberField extends BaseField {
  kind: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface SelectField extends BaseField {
  kind: "select";
  options: { value: string; label: string }[];
}

export interface TextFieldDef extends BaseField {
  kind: "text";
  placeholder?: string;
}

export interface SwitchField extends BaseField {
  kind: "switch";
}

export interface SliderField extends BaseField {
  kind: "slider";
  min: number;
  max: number;
  step: number;
  unit?: string;
}

// ── Registry API ─────────────────────────────────────────────────────────────

export interface IServiceRegistry {
  register(definition: ServiceDefinition): void;
  get(type: AWSServiceType): ServiceDefinition | undefined;
  getAll(): ServiceDefinition[];
  getByCategory(category: NodeCategory): ServiceDefinition[];
  buildPalette(): PaletteCategory[];
}
