/**
 * Public app-component registry export.
 * Importing this module triggers auto-registration of all application components.
 */

// Load all component definitions (side effects = registration)
import "./application/index";
import "./messaging-app/index";
import "./networking-app/index";
import "./scheduling/index";
import "./data-access/index";

// Re-export the populated registry
export { appComponentRegistry } from "./index-internal";
export type {
  AppComponentDefinition,
  AppPaletteCategory,
  AppPaletteEntry,
  IAppComponentRegistry,
} from "./types";
