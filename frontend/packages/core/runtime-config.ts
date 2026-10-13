import type { Lab, RuntimeLabConfig } from "./types";
import { chapterIds } from "../i18n/locales";
export function runtimeConfig(
  lab: Pick<Lab, "id" | "version" | "parameters" | "stateSchema">,
): RuntimeLabConfig {
  return {
    id: lab.id,
    version: lab.version,
    parameters: lab.parameters,
    stateSchema: lab.stateSchema,
    chapterCount: chapterIds.length,
  };
}
