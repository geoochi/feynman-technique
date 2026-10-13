import type { ComponentType } from "react";
import type { Simulation } from "../runtime/simulation";
import type { Localized, Locale } from "../i18n/locales";
export type Params = Record<string, number>;
/** A resistor, an ideal voltage source or a wire between two numbered nodes. */
export interface NetlistElement {
  id: string;
  kind: "resistor" | "source" | "wire";
  /** Node index, an integer in [0, maxNodes). */
  a: number;
  b: number;
  /** Resistance in Ω, EMF in V, or 0 for a wire. */
  value: number;
}
export interface Netlist {
  elements: NetlistElement[];
}
/** A structured parameter value, alongside the plain numeric ones. */
export type ParamValue = number | Netlist;
export type ParamValues = Record<string, ParamValue>;
export interface NumberParameter {
  type: "number";
  title: string;
  labels: Localized<string>;
  default: number;
  minimum: number;
  maximum: number;
  step: number;
  unit: string;
}
export interface ValueRange {
  minimum: number;
  maximum: number;
  step: number;
  unit: string;
}
/**
 * A structured parameter: a small netlist the case edits itself. The runtime
 * validates it against these bounds and persists it in the snapshot, but the
 * course shell renders no numeric control for it.
 */
export interface NetlistParameter {
  type: "netlist";
  title: string;
  labels: Localized<string>;
  default: Netlist;
  maxNodes: number;
  maxElements: number;
  resistance: ValueRange;
  emf: ValueRange;
}
export type Parameter = NumberParameter | NetlistParameter;
export interface ParameterSchema {
  type: "object";
  additionalProperties: false;
  required: string[];
  properties: Record<string, Parameter>;
}
export interface SeoCopy {
  title: Localized<string>;
  description: Localized<string>;
}
export interface Manifest {
  schemaVersion: string;
  playback?: boolean;
  preloadImages?: string[];
  id: string;
  slug: string;
  version: string;
  sdkRange: string;
  title: Localized<string>;
  summary: Localized<string>;
  seo?: { experiment?: SeoCopy; lesson?: SeoCopy };
  subjects: string[];
  levels: string[];
  locales: Locale[];
  lessons: Localized<string>;
  capabilities: { network: boolean; audio: boolean };
  tags: Localized<string[]>;
  learningObjectives: Localized<string[]>;
  prerequisites: Localized<string[]>;
  estimatedMinutes: number;
  layout: string;
  theme: string;
  renderer: string;
  entry: string;
  parameterSchema: string;
  snapshotSchema: string;
  preview: string;
  authors: { name: string }[];
  licenses: { code: string; content: string };
  modelAssumptions: Localized<string[]>;
  references: { title: string; url: string }[];
  status: "experimental" | "reviewed" | "draft";
}
export interface Question {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Lab extends Manifest {
  path: string;
  previewUrl: string;
  parameters: ParameterSchema;
  stateSchema: Record<string, unknown>;
  presets: { id: string; title: string; params: Params }[];
  question: Question;
  content: Localized<{
    lessonHtml: string;
    chapters: { id: string; title: string; html: string }[];
    searchText: string;
  }>;
  formulas: Record<string, Localized<PreparedFormula>>;
  contentHash: string;
}
export interface RuntimeLabConfig {
  id: string;
  version: string;
  parameters: ParameterSchema;
  stateSchema: Record<string, unknown>;
  chapterCount: number;
}
export interface Model {
  initial(params: Params): Params;
  step(state: Params, params: Params, dt: number): Params;
}
export interface ViewProps {
  simulation: Simulation;
  params: Params;
  /** The structured netlist parameter, when the case declares one. */
  netlist: Netlist | null;
  state: Params;
  time: number;
  camera: number;
}
export interface PreparedFormula {
  math: string;
  html: string;
}
export interface ReadoutProps extends ViewProps {
  formulas: Record<string, PreparedFormula>;
}
export interface LabController {
  Readouts: ComponentType<ReadoutProps>;
  model: Model;
}
export type SceneModule = { default: ComponentType<ViewProps> };
export interface Snapshot {
  labId: string;
  labVersion: string;
  sdkVersion: "0.1.0";
  snapshotSchemaVersion: "1";
  params: ParamValues;
  seed: number;
  simulationTime: number;
  internalState: Params;
  camera: { distance: number };
  activeChapter: number;
}
