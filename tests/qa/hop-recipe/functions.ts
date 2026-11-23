// Local callable adapter. Attempts remain counted; unexpected (especially paid)
// tasks fail immediately, and this module contains no Firebase transport.
import { sha256 } from '@noble/hashes/sha2.js';
import { loadBrewingCatalogueReferences } from '../../../src/domain/brewingCatalogueReferences';
import { canonicalBrewerCatalogueFingerprintInput, projectBrewerCatalogueEntity } from '../../../functions/src/brewerCatalogueCore';
import { BREWER_CATALOGUE_KINDS, brewerCatalogueIdentityKeys,
  type BrewerCatalogueEntity, type BrewerCatalogueKind } from '../../../functions/src/brewerCatalogueSchema';
import type { BrewerCatalogueLookupRecord } from '../../../functions/src/brewerCatalogueStore';
import type { StorageService } from '../../../src/services/storage';

export const qaCalls: string[] = [];
export const qaInputs: { name: string; input: any }[] = [];
export const qaLookup = new Map<string, unknown>();
const QA_BREWER_CATALOGUE_LOOKUP_LIMIT = 100;

const queryKey = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
function isQaCatalogueReference(value: unknown, kind: BrewerCatalogueKind): value is BrewerCatalogueEntity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (kind === 'hopVariety') return typeof row.id === 'string' && !('kind' in row) && Array.isArray(row.aliases);
  if (kind === 'yeastStrain') return row.kind === 'yeast' && typeof row.id === 'string';
  return row.kind === 'styleGuide' && typeof row.id === 'string';
}
function sha256Hex(value: string): string {
  return Array.from(sha256(new TextEncoder().encode(value)), byte => byte.toString(16).padStart(2, '0')).join('');
}
function qaStyleIdForQuery(record: BrewerCatalogueEntity, normalizedQuery: string): string | undefined {
  if (!('kind' in record) || record.kind !== 'styleGuide') return undefined;
  for (const style of record.styles) {
    const styleRecord = { ...record, catalogueMeta: undefined, styles: [style] } as BrewerCatalogueEntity;
    if (brewerCatalogueIdentityKeys(styleRecord).some(key => key.toLocaleLowerCase('fr').includes(normalizedQuery))) return style.id;
  }
  return undefined;
}

/** Read-only replica of the catalogue lookup contract over the same bundled references as production. */
async function readQaBrewingCatalogue(input: unknown): Promise<{ records: BrewerCatalogueLookupRecord[]; truncated: boolean }> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Recherche de catalogue invalide.');
  const query = (input as Record<string, unknown>).query;
  const rawKind = (input as Record<string, unknown>).kind;
  if (!BREWER_CATALOGUE_KINDS.includes(rawKind as BrewerCatalogueKind) || typeof query !== 'string'
    || !query.trim() || query.length > 200) throw Error('Recherche de catalogue invalide.');
  const kind = rawKind as BrewerCatalogueKind;

  let references: Awaited<ReturnType<typeof loadBrewingCatalogueReferences>>;
  try { references = await loadBrewingCatalogueReferences(); }
  catch { return { records: [], truncated: true }; }
  const rawRows = kind === 'hopVariety' ? references.varieties
    : references.knowledge.filter(row => row.kind === (kind === 'yeastStrain' ? 'yeast' : 'styleGuide'));
  const bundled: BrewerCatalogueLookupRecord[] = [];
  try {
    for (const raw of rawRows) {
      if (!isQaCatalogueReference(raw, kind)) throw Error(`Référence QA invalide pour le catalogue ${kind}.`);
      const record = structuredClone(raw);
      // These are the same canonical reader/projection and fingerprint input used by lookup.
      const projection = projectBrewerCatalogueEntity(record);
      if (projection.kind !== kind) throw Error(`Projection canonique divergente pour ${kind}/${record.id}.`);
      bundled.push({ kind, id: record.id, record, revision: record.catalogueMeta?.revision ?? 0,
        fingerprint: sha256Hex(canonicalBrewerCatalogueFingerprintInput(record)), origin: 'bundled' });
    }
  } catch {
    return { records: [], truncated: true };
  }

  // Match production's identity merge: later bundled references with the same kind/id win,
  // and no user-specific Firestore data is fabricated in this local-only fixture.
  const byIdentity = new Map<string, BrewerCatalogueLookupRecord>();
  for (const row of bundled) byIdentity.set(`${row.kind}\0${row.id}`, row);
  const needle = queryKey(query);
  const matches: BrewerCatalogueLookupRecord[] = [];
  for (const row of byIdentity.values()) {
    const projection = projectBrewerCatalogueEntity(row.record);
    const haystack = queryKey(`${row.id}\n${projection.searchTerms.join('\n')}`);
    if (!haystack.includes(needle)) continue;
    matches.push({ ...structuredClone(row), ...(qaStyleIdForQuery(row.record, needle) ? { styleId: qaStyleIdForQuery(row.record, needle) } : {}) });
  }
  return { records: matches.slice(0, QA_BREWER_CATALOGUE_LOOKUP_LIMIT), truncated: matches.length > QA_BREWER_CATALOGUE_LOOKUP_LIMIT };
}

/** The original QA main installs `__hopQa` with `storage: StorageService`; other hosts may leave it absent. */
type QaHarnessWindow = Window & { __hopQa?: { storage: typeof StorageService } };
const yeastCorrectionStoreKey = '__HOP_QA_YEAST_CORRECTION_SERVER__';
type QaYeastCorrectionServer = { products: Record<string, any> };
const readYeastCorrectionServer = (): QaYeastCorrectionServer => {
  try { return JSON.parse(localStorage.getItem(yeastCorrectionStoreKey) || '{"products":{}}'); }
  catch { return { products: {} }; }
};
const saveYeastCorrectionServer = (server: QaYeastCorrectionServer) => localStorage.setItem(yeastCorrectionStoreKey, JSON.stringify(server));
const revisionToken = (character: string) => character.repeat(64);
const qaCorrectionReceipt = (target: any, selectedIds: string[], targetCreated: boolean, entityCreated?: 'product' | 'offer') => ({
  id: `qa-receipt-${Date.now()}`, target: target.scope === 'offer'
    ? { scope: 'offer', id: target.id, offerId: target.offerId }
    : target.scope === 'stock' ? { scope: 'stock', id: target.ref }
      : { scope: 'product', id: target.id },
  selectedIds, auditId: `qa-audit-${Date.now()}`, status: 'server-confirmed', confirmedAt: Date.now(),
  revisionBefore: revisionToken('0'), revisionAfter: revisionToken('1'), targetCreated,
  ...(entityCreated ? { entityCreated } : {})
});
// Browser regression fixture only: these are synthetic values, never a real
// laboratory recommendation or a substitute for the separately recorded live check.
qaLookup.set('Culture QA R-125', { found: true, name: 'Culture QA R-125', lab: 'Micro laboratoire QA',
  strain: 'R-125', form: 'liquide', attenuationPct: 81, tempMinC: 17, tempMaxC: 24,
  flocculation: 'Moyenne', alcoholTolerancePct: 12.5,
  note: 'Fixture synthétique : données de contrôle, aucune recommandation de brassage.',
  source: 'Fixture QA synthétique · https://example.invalid/r-125', sourceUrl: 'https://example.invalid/r-125', technicalFacts: [
    { key: 'attenuation', reported: '77,25–82,75 %', range: { min: 77.25, max: 82.75 }, unit: '%', qualifier: 'range', origin: 'ai', source: 'Fixture QA synthétique', sourceUrl: 'https://example.invalid/r-125', retrievedAt: '2026-09-20', context: 'Moût témoin QA' },
    { key: 'alcoholTolerance', reported: 'Au moins 12,5 %', range: { min: 12.5, max: 12.5 }, unit: '% v/v', qualifier: 'atLeast', origin: 'ai', source: 'Fixture QA synthétique', sourceUrl: 'https://example.invalid/r-125' },
    { key: 'fermentationTime', reported: '12 jours indicatifs', range: { min: 12, max: 12 }, unit: 'd', qualifier: 'reportedPoint', origin: 'ai', source: 'Fixture QA synthétique', context: 'Moût témoin QA ; aucune fin de fermentation garantie.' },
  ] });
export const getFunctions = () => ({});
export const connectFunctionsEmulator = () => {};
export function httpsCallable(_functions: unknown, name: string) {
  return async (input: any) => {
    qaCalls.push(name);
    qaInputs.push({name,input});
    if (name === 'getBrewerActivity') return { data: { jobs: [] } };
    if (name === 'getBrewerConversation') return { data: { turns: [], generation: 0 } };
    if (name === 'readBrewingCatalogue') return { data: await readQaBrewingCatalogue(input) };
    if (name === 'proposeYeastDbCorrection') {
      const { target, manual } = input ?? {};
      if (target?.scope === 'stock' && target.ref === 'QA-FLOC-COMPANION' && /flocculation\s+low/i.test(input?.request ?? '')) {
        const source = { title: 'Companion IA QA · flocculation', url: 'https://example.invalid/qa-flocculation-low',
          checkedAt: '2026-09-28T00:00:00.000Z', origin: 'ai' };
        const fact = { key: 'flocculation', reported: 'Low', origin: 'ai', source: source.title,
          sourceUrl: source.url, retrievedAt: source.checkedAt, context: 'Beer' };
        return { data: {
          id: 'qa-proposal-flocculation-low', target: { scope: 'stock', ref: target.ref }, proposedByUid: 'qa-fixture-local',
          signature: `qa-local-${Date.now()}`, targetExists: true, expectedRevision: revisionToken('a'),
          changes: [{ id: 'QA-FLOC-LOW', field: 'stock.yeastFlocculation', label: 'Floculation · Low',
            before: 'Medium', value: 'Low', reason: 'Fixture synthétique : floculation Low dans le contexte Beer.',
            context: 'Beer', source, documentaryFact: fact, group: 'qa-flocculation-low-beer' }],
          generatedAt: Date.now(), model: 'Gemini QA mock', title: 'Floculation Low · fixture companion'
        } };
      }
      if (!target || !manual || !['product-create', 'offer-create', 'starter-set'].includes(manual.kind))
        throw Error('QA : seules les créations manuelles produit/offre et la notice starter sont mockées dans ce parcours.');
      const server = readYeastCorrectionServer();
      const current = server.products[target.id];
      const product = manual.kind === 'product-create' ? target.fallback?.product : current?.product ?? target.fallback?.product;
      if (!product) throw Error('QA : document fallback absent pour la création manuelle.');
      const offer = manual.kind === 'offer-create' ? manual.offer : undefined;
      const starter = manual.kind === 'starter-set' ? manual.protocol : undefined;
      const proposalTarget = manual.kind === 'offer-create'
        ? { scope: 'offer', id: target.id, offerId: offer?.id }
        : { scope: 'product', id: target.id };
      const value = manual.kind === 'product-create' ? product : manual.kind === 'offer-create' ? offer : starter;
      const before = manual.kind === 'starter-set' ? product.starter ?? null : null;
      const source = manual.kind === 'product-create' ? product.source : manual.kind === 'offer-create' ? offer?.stock.source : starter?.source;
      const field = manual.kind === 'product-create' ? 'product.create' : manual.kind === 'offer-create' ? 'offer.create' : 'product.starter';
      const label = manual.kind === 'product-create' ? 'Produit exact' : manual.kind === 'offer-create' ? 'Offre exacte' : 'Notice de préparation';
      return { data: {
        id: `qa-proposal-${manual.kind}-${Date.now()}`, target: proposalTarget, proposedByUid: 'qa-fixture-local',
        signature: `qa-local-${Date.now()}`, targetExists: !!current,
        expectedRevision: current ? revisionToken('a') : revisionToken('0'),
        fallback: current ? undefined : target.fallback,
        changes: [{ id: 'QA-CREATE-1', field, label, before, value,
          reason: 'Valeur manuelle de la fixture QA, proposée pour vérification explicite.', source }],
        generatedAt: Date.now(), model: 'Saisie manuelle',
        title: manual.kind === 'product-create' ? `Création QA · ${product.label}`
          : manual.kind === 'offer-create' ? `Offre QA · ${offer?.seller ?? target.id}` : `Notice QA · ${product.label}`
      } };
    }
    if (name === 'applyYeastDbCorrection') {
      const { proposal, selectedIds } = input ?? {};
      const change = proposal?.changes?.find((item: any) => selectedIds?.includes(item.id));
      if (!proposal?.target || !change) throw Error('QA : sélection de correction manuelle vide.');
      const server = readYeastCorrectionServer();
      if (proposal.target.scope === 'offer' && String(change.value?.url).includes('/offer-conflict'))
        throw Error('Conflit QA : une révision concurrente a changé le produit. La proposition reste à relire.');
      if (proposal.target.scope === 'product' && change.field === 'product.starter') {
        const id = proposal.target.id;
        const fallback = proposal.fallback;
        const existing = server.products[id] ?? (fallback ? structuredClone(fallback) : undefined);
        if (!existing?.product || !change.value?.id || change.value?.medium !== 'malt-extract')
          throw Error('QA : notice starter ou produit parent invalide.');
        const targetCreated = !server.products[id];
        const document = { ...existing, revision: Math.max(0, existing.revision ?? 0) + 1,
          product: { ...existing.product, starter: structuredClone(change.value) } };
        server.products[id] = structuredClone(document);
        saveYeastCorrectionServer(server);
        // Exact local readback for this mocked server receipt; no remote Firestore write.
        (window as any).__hopQa?.storage.saveYeastProduct(document);
        return { data: qaCorrectionReceipt(proposal.target, selectedIds, targetCreated) };
      }
      if (proposal.target.scope === 'stock' && change.field === 'stock.yeastFlocculation') {
        const ref = proposal.target.ref;
        const item = (window as QaHarnessWindow).__hopQa?.storage.getStocks().rawMaterials.find((row: any) => row.ref === ref);
        const fact = change.documentaryFact;
        if (!item || item.yeastFlocculation !== change.before || change.value !== 'Low' || fact?.key !== 'flocculation'
          || fact?.reported !== change.value || fact?.context !== 'Beer' || fact?.origin !== 'ai')
          throw Error('QA : paire scalaire/fait companion flocculation invalide.');
        const companion = { ...structuredClone(fact), acceptedScalarFields: ['yeastFlocculation'] };
        const facts = [...(item.yeastTechnicalFacts ?? []).filter((row: any) => !(row.key === companion.key && row.context === companion.context)), companion];
        (window as QaHarnessWindow).__hopQa.storage.updateStockItem('rawMaterials', { ...item, yeastFlocculation: change.value, yeastTechnicalFacts: facts });
        return { data: qaCorrectionReceipt(proposal.target, selectedIds, false) };
      }
      if (proposal.target.scope === 'product') {
        const id = proposal.target.id;
        if (server.products[id]) throw Error('Conflit QA : le produit a été créé depuis la proposition.');
        const fallback = proposal.fallback;
        if (!fallback?.product || fallback.id !== id) throw Error('QA : fallback produit incorrect.');
        // Simulated server state persists across the fixture reload, but the local cache intentionally does not
        // receive this product here. The service must therefore report readback=pending.
        server.products[id] = structuredClone(fallback);
        saveYeastCorrectionServer(server);
        return { data: qaCorrectionReceipt(proposal.target, selectedIds, true, 'product') };
      }
      if (proposal.target.scope === 'offer') {
        const id = proposal.target.id, offer = change.value;
        const fallback = proposal.fallback;
        let document = server.products[id] ?? (fallback ? structuredClone(fallback) : undefined);
        if (!document || !offer || offer.productId !== id) throw Error('QA : document/offre de création incorrects.');
        if (document.offers.some((item: any) => item.id === offer.id)) throw Error('Conflit QA : cette offre existe déjà.');
        const targetCreated = !server.products[id];
        document = { ...document, revision: Math.max(0, document.revision ?? 0) + 1,
          offers: [...document.offers, structuredClone(offer)] };
        server.products[id] = structuredClone(document);
        saveYeastCorrectionServer(server);
        // The offer receipt has a refreshed local readback; this is the only canonical adapter write in this mock.
        (window as any).__hopQa?.storage.saveYeastProduct(document);
        return { data: qaCorrectionReceipt(proposal.target, selectedIds, targetCreated, 'offer') };
      }
      throw Error(`Appel correction hors périmètre du banc QA : ${proposal.target.scope}`);
    }
    if (name === 'aiTask' && input.task === 'lookupIngredient' && qaLookup.has(input.context?.name))
      return { data: {ok:true, data:qaLookup.get(input.context.name)} };
    throw Error(`Appel distant exclu du banc QA : ${name}`);
  };
}
