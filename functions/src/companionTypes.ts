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
  products?: BrewerProduct[];
  model?: string;
}
export interface BrewerProduct {
  name: string;
  supplier: string;
  url: string;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  availabilityText: string;
  checkedAt: number;
}
export interface BrewerPending {
  operationId: string;
  question: string;
  until: number;
}
export interface BrewerReply {
  turn?: BrewerTurn;
  pending?: BrewerPending;
  generation?: number;
  job?: BrewerJob;
}
export type BrewerStage =
  | 'queued'
  | 'context'
  | 'analysis'
  | 'tools'
  | 'research'
  | 'review'
  | 'repair'
  | 'saving'
  | 'retry';
export interface BrewerJob {
  id: string;
  operationId: string;
  scope: BrewerScope;
  generation: number;
  question: string;
  label: string;
  status: 'queued' | 'running' | 'done' | 'error' | 'cancelled';
  stage: BrewerStage;
  detail?: string;
  model?: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  finishedAt?: number;
  readAt?: number;
  attempt: number;
  error?: { code: string; message: string; retryable: boolean };
}
export interface BrewerFieldChange {
  id: string;
  path: string;
  label: string;
  before: any;
  value: any;
  reason: string;
  unit?: string;
}
export interface BrewerProposal {
  target: 'recipe' | 'journal' | 'batch';
  title: string;
  changes: BrewerFieldChange[];
  basis?: string;
  status?: 'applied' | 'dismissed';
  acceptedIds?: string[];
  decidedAt?: number;
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
  editableTargets?: BrewerProposal['target'][];
}
export type BrewerMode = 'fast' | 'auto' | 'deep';
export interface BrewerTurn {
  id: string;
  operationId: string;
  question: string;
  advice: BrewerAdvice;
  evidence: BrewerEvidence[];
  createdAt: number;
  model: string;
  reviewed: boolean;
  reviewModel?: string;
  reviewReason?: 'fast' | 'requested' | 'sensitive' | 'repair' | 'complexity' | 'research';
  mode?: BrewerMode;
  contextLabel: string;
  proposal?: BrewerProposal;
}
export interface BrewerChatInput {
  scope: BrewerScope;
  operationId: string;
  question: string;
  draft?: unknown;
  localJournal?: unknown;
  phase?: string;
  mode?: BrewerMode;
  generation?: number;
  editableTargets?: BrewerProposal['target'][];
}
