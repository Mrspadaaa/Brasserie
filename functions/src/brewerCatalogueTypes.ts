// Types partagés entre le magasin serveur et le front. Ce module n'importe jamais firebase-admin :
// le front le lit, et ce paquet n'est installé que dans functions/node_modules.
import type {
  BrewerCatalogueEntity, BrewerCatalogueIdentityCandidate, BrewerCatalogueKind
} from './brewerCatalogueSchema.js';

export interface BrewerCatalogueReceipt {
  schemaVersion: 1;
  ownerKey: string;
  namespace: string;
  operationId: string;
  commandFingerprint: string;
  kind: BrewerCatalogueKind;
  targetId: string;
  status: 'committed';
  revision: number;
  fingerprint: string;
  committedAt: string;
}

export interface BrewerCatalogueLookupRecord {
  kind: BrewerCatalogueKind;
  id: string;
  record: BrewerCatalogueEntity;
  revision: number;
  fingerprint: string;
  origin: 'persisted' | 'bundled';
  /** Set only for a particular style nested in a shared guide. */
  styleId?: string;
}

export type BrewerCatalogueWriteResult =
  | { status: 'applied' | 'duplicate'; kind: BrewerCatalogueKind; id: string; record: BrewerCatalogueEntity; revision: number; fingerprint: string; receipt: BrewerCatalogueReceipt }
  | { status: 'conflict' | 'invalid'; reason: string; identityCandidates?: BrewerCatalogueIdentityCandidate[] };
