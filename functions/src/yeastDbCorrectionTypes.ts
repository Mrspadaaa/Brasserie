import type { HopYeast } from './hopPredictionSchema.js';
import type { YeastOffer, YeastProductDocument, YeastStarterProtocol, YeastSupplySource } from './yeastSupplySchema.js';
import type { YeastTechnicalFact } from './yeastTechnicalFacts.js';

/** Pure transport contracts shared with the browser; no Firebase/Node runtime. */
export type YeastDbCorrectionScope = 'catalogue' | 'product' | 'offer' | 'stock';
export type YeastDbCorrectionTarget =
  | { scope: 'catalogue'; id: string; fallback?: HopYeast; context?: YeastAlternativeContext }
  | { scope: 'product'; id: string; fallback?: YeastProductDocument; context?: YeastAlternativeContext }
  | { scope: 'offer'; id: string; offerId: string; fallback?: YeastProductDocument; context?: YeastAlternativeContext }
  | { scope: 'stock'; ref: string; context?: YeastAlternativeContext };
export type YeastDbCorrectionIdentity =
  | { scope: 'catalogue'; id: string }
  | { scope: 'product'; id: string }
  | { scope: 'offer'; id: string; offerId: string }
  | { scope: 'stock'; id: string };
export interface YeastAlternativeContext {
  recipe?: { name?: string; style?: string; volumeL?: number; ogTarget?: number; fermentation?: Array<{ name?: string; tempC?: number; days?: number }> };
}
export type YeastDbCorrectionManualOfferObservation =
  | { kind: 'stock'; status: 'in-stock' | 'out-of-stock' | 'unknown'; text: string; source: { title: string; url: string; checkedAt: string } }
  | { kind: 'shipping'; status: 'yes' | 'no' | 'unknown'; conditions: string; source: { title: string; url: string; checkedAt: string } };
/** Manual canonical creation; product data is the target fallback, offer data is appended to its exact parent. */
export type YeastDbCorrectionManualCreate =
  | { kind: 'product-create' }
  | { kind: 'offer-create'; offer: YeastOffer }
  | { kind: 'starter-set'; protocol: YeastStarterProtocol };
export type YeastDbCorrectionSource = YeastSupplySource;
export interface YeastDbCorrectionChange {
  id: string;
  field: string;
  label: string;
  before: unknown;
  value: unknown;
  reason: string;
  context?: string;
  source: YeastDbCorrectionSource;
  /** A numeric compatibility scalar is committed with this sourced observation. */
  documentaryFact?: YeastTechnicalFact;
  group?: string;
}
export interface YeastDbCorrectionProposal {
  id: string;
  target: YeastDbCorrectionTarget;
  proposedByUid: string;
  signature: string;
  targetExists: boolean;
  expectedRevision: string;
  fallback?: HopYeast | YeastProductDocument;
  changes: YeastDbCorrectionChange[];
  generatedAt: number;
  model: string;
  title: string;
}
export interface YeastDbCorrectionReceipt {
  id: string;
  target: YeastDbCorrectionIdentity;
  selectedIds: string[];
  auditId: string;
  status: 'server-confirmed';
  confirmedAt: number;
  revisionBefore: string;
  revisionAfter: string;
  /** Whether the parent Firestore document was absent before this transaction. */
  targetCreated: boolean;
  /** Logical product/offer created by a manual creation proposal. */
  entityCreated?: 'product' | 'offer';
}
export interface YeastDbCorrectionClientReceipt extends YeastDbCorrectionReceipt {
  readback: 'refreshed' | 'pending';
}
