/** JSON-only contract shared with the browser. No credentials or Firebase dependencies. */
export interface BrewerScope {
  kind: 'recipe' | 'batch' | 'draft' | 'app';
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
  /** Exact verified product/pack URLs selected as relevant for this advice. */
  productUrls?: string[];
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
  /** Set only after the server has read an actual supplier product page. */
  verifiedBy?: 'product-page';
  stockEvidence?: 'visible-text' | 'structured-data' | 'none';
  canonicalUrl?: string;
  packageLabel?: string;
  priceText?: string;
  sku?: string;
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
  /** Present only for the isolated assisted-read lane; ordinary jobs stay untagged. */
  protocol?: typeof import('./brewerHopAdviceTransportV1.js').HOP_ADVICE_PROTOCOL_V1.name | 'unsupported';
  /** Confirmed side effects survive a rejected/interrupted advice response. */
  catalogueReceipts?: Array<{
    operationId: string; kind: string; targetId: string; revision: number;
    fingerprint: string; committedAt: string; status: 'committed';
  }>;
  scenarioReceipts?: Array<{ scenarioId: string; operationId: string; revision: number; reference: string; committedAt: string }>;
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
  /** Coupled physical changes must be approved or dismissed together. */
  group?: string;
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
  hopIndex?: import('./hopPredictionCore.js').HopEngineData & { predictions: import('./hopPredictionSchema.js').HopPredictionComparison[]; tastings: import('./hopPredictionSchema.js').HopTasting[]; truncated: string[] };
  workspace?: { screen: string; records: Record<string, any[]>; truncated: string[]; finance?: any; coverage?: Record<string, { loaded: number; limit: number; complete: boolean; totalAtLeast: number; order: 'document-id'; firstDate?: string; lastDate?: string; unavailable?: boolean }> };
  recipe?: any;
  journal?: any;
  batch?: any;
  equipment?: any;
  inventory: any[];
  /** Formal pending reservations loaded with the inventory. Every active row
   * explicitly carries stockConsumption (null means confirmed absent).
   * Plans/purchases are not reservations; omitted fields never prove zero. */
  stockReservations?: { complete: boolean; batches: unknown[]; source?: 'firestoreReadOnlyTransaction' | 'localCache' };
  material: any[];
  waterSources: any[];
  phase: string;
  now: number;
  provenance: string[];
  localJournal?: any;
  editableTargets?: BrewerProposal['target'][];
}
export interface BrewerReferenceRequest {
  varietyIds?: string[];
  lotIds?: string[];
  knowledgeIds?: string[];
  /** Targeted supplement to an already loaded bounded context. */
  onlyReferences?: boolean;
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
  /** Assisted reading: a corrigible proposal for the local V3/V4 path, never an adoption. */
  hopAdviceProposal?: import('./brewerHopAdviceProposal.js').BrewerHopAdviceProposalEnvelope;
  /** Identifies turns written by the versioned assisted-read lane. */
  protocol?: typeof import('./brewerHopAdviceTransportV1.js').HOP_ADVICE_PROTOCOL_V1.name;
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
  /** Typed handoff of the archived local reading; selects the bounded read-only profile. */
  hopAdvice?: import('./brewerHopAdviceProposal.js').BrewerHopAdviceRequest;
}
