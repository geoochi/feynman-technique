import type { ComponentType } from "react";
import type { Simulation } from "../runtime/simulation";
import type { Localized, Locale } from "../i18n/locales";
export type Params = Record<string, number>;
export interface Parameter {
  type: "number";
  title: string;
  labels: Localized<string>;
  default: number;
  minimum: number;
  maximum: number;
  step: number;
  unit: string;
}
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
  contentHash: string;
}
export interface Model {
  initial(params: Params): Params;
  step(state: Params, params: Params, dt: number): Params;
}
export interface ViewProps {
  simulation: Simulation;
  params: Params;
  state: Params;
  time: number;
  camera: number;
}
export interface LabModule {
  playback?: boolean;
  Readouts: ComponentType<ViewProps>;
  default: ComponentType<ViewProps>;
  model: Model;
}
export interface Snapshot {
  labId: string;
  labVersion: string;
  sdkVersion: "0.1.0";
  snapshotSchemaVersion: "1";
  params: Params;
  seed: number;
  simulationTime: number;
  internalState: Params;
  camera: { distance: number };
  activeChapter: number;
}
