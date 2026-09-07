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
  mode?: 'auto' | 'deep';
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
  mode?: 'auto' | 'deep';
  generation?: number;
  editableTargets?: BrewerProposal['target'][];
}
