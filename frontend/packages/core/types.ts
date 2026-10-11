import type { ComponentType } from "react";
import type { Simulation } from "../runtime/simulation";
export type Params = Record<string, number>;
export interface Parameter {
  type: "number";
  title: string;
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
export interface Manifest {
  schemaVersion: string;
  id: string;
  slug: string;
  version: string;
  sdkRange: string;
  title: Record<string, string>;
  summary: Record<string, string>;
  subjects: string[];
  levels: string[];
  locales: string[];
  lessons: Record<string, string>;
  capabilities: { network: boolean; audio: boolean };
  tags: string[];
  learningObjectives: string[];
  prerequisites: string[];
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
  modelAssumptions: string[];
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
  lessonHtml: string;
  chapters: { id: string; title: string; html: string }[];
  contentHash: string;
  searchText: string;
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
