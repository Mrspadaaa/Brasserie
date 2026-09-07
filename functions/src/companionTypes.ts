/** JSON-only contract shared with the browser. No credentials or Firebase dependencies. */
export interface BrewerScope {
  kind: 'recipe' | 'batch' | 'draft';
  id: string;
}
export interface BrewerAdvice {
  level: 'info' | 'attention' | 'urgent';
  summary: string;
  action: string;
  why: string;
  watch: string;
  question: string;
  evidenceIds: string[];
}
export interface BrewerEvidence {
  id: string;
  name: string;
  label: string;
  facts: string[];
  limits: string[];
  data: unknown;
  sources?: Array<{ title: string; url: string }>;
}
export interface BrewerContext {
  recipe?: any;
  journal?: any;
  batch?: any;
  equipment?: any;
  inventory: any[];
  material: any[];
  waterSources: any[];
  phase: string;
  now: number;
  provenance: string[];
  localJournal?: any;
}
export interface BrewerTurn {
  id: string;
  operationId: string;
  question: string;
  advice: BrewerAdvice;
  evidence: BrewerEvidence[];
  createdAt: number;
  model: string;
  reviewed: boolean;
  contextLabel: string;
}
export interface BrewerChatInput {
  scope: BrewerScope;
  operationId: string;
  question: string;
  draft?: unknown;
  localJournal?: unknown;
  phase?: string;
}
