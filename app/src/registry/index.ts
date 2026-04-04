/**
 * Public registry export.
 * Importing this module triggers auto-registration of all AWS services.
 * Use `registry` for all service lookups.
 */

// Load all service definitions (side effects = registration)
import "./compute/index";
import "./networking/index";
import "./messaging/index";
import "./storage/index";
import "./security/index";
import "./integration/index";

// Re-export the populated registry
export { registry } from "./index-internal";
export type {
  ServiceDefinition,
  PaletteCategory,
  ServicePaletteEntry,
  ConfigSection,
  ConfigField,
  NumberField,
  SelectField,
  TextFieldDef,
  SwitchField,
  SliderField,
} from "./types";
