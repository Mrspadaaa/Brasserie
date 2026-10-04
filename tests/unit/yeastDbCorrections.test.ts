import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';

const state = vi.hoisted(() => ({ docs: new Map<string, any>(), commits: 0 }));
const aiProvider = vi.hoisted(() => ({ content: '' }));
const ref = (path: string) => ({ path, get: async () => ({ exists: state.docs.has(path), data: () => structuredClone(state.docs.get(path)) }) });
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
  getFirestore: () => ({
    doc: ref,
    runTransaction: async (run: any) => {
      const writes: Array<() => void> = [];
      const result = await run({
        get: async (row: any) => ({ exists: state.docs.has(row.path), data: () => structuredClone(state.docs.get(row.path)), ref: row }),
        create: (row: any, data: any) => writes.push(() => {
          if (state.docs.has(row.path)) throw Error('already exists');
          state.docs.set(row.path, structuredClone(data));
        }),
        update: (row: any, patch: any) => writes.push(() => state.docs.set(row.path, { ...state.docs.get(row.path), ...structuredClone(patch) })),
        set: (row: any, data: any) => writes.push(() => state.docs.set(row.path, structuredClone(data)))
      });
      writes.forEach(write => write()); state.commits++;
      return result;
    }
  })
}));
vi.mock('../../functions/src/brewSession.js', () => ({ requireBrewer: () => 'qa-user' }));
vi.mock('../../functions/src/ai.js', () => ({ GEMINI_API_KEY: { value: () => 'unused-test-secret' } }));
vi.mock('../../functions/src/brewerHarness.js', () => ({ geminiTransport: () => async () => ({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ text: aiProvider.content }] } }]
}) }));
vi.mock('../../functions/src/monthlyAiBudget.js', () => ({ runWithMonthlyAiBudget: (_model: unknown, _body: unknown, generate: (body: unknown) => Promise<unknown>) => generate(_body) }));
vi.mock('../../functions/src/models.js', () => ({ modelChain: () => ['test-model'] }));

import { applyYeastDbCorrection, proposeYeastDbCorrection, yeastDbCorrectionRevision, type YeastDbCorrectionProposal, type YeastDbCorrectionTarget } from '../../functions/src/yeastDbCorrections';
import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { harvestedYeastTechnicalFact } from '../../functions/src/yeastDocumentarySheet';
import type { YeastOffer, YeastProductDocument, YeastStarterProtocol } from '../../functions/src/yeastSupplySchema';
import { stableJson } from '../../functions/src/backupCore';
import { effectiveYeastTechnicalFacts, reviewedYeastReplacements } from '../../src/domain/yeastReferences';
import { resolveYeastDossier } from '../../src/domain/yeastProjection';
import { yeastStrainInformation } from '../../src/domain/yeastStrainInformation';

const checkedAt = '2026-09-27T12:00:00.000Z';
const source = { title: 'Fiche fabricant · levure exacte', url: 'https://example.test/products/yeast', checkedAt, origin: 'ai' as const };
const scalarAttenuationFact = (value: number): YeastTechnicalFact => ({ key: 'attenuation', reported: `${value} %`, range: { min: value, max: value }, unit: '%',
  qualifier: 'reportedPoint', origin: 'ai', source: source.title, sourceUrl: source.url, retrievedAt: source.checkedAt, context: 'Atténuation apparente de bière' });
const stock = () => ({ id: 'US05-LOT-A', ref: 'US05-LOT-A', name: 'SafAle US-05', category: 'Levure', unit: 'g', currentStock: 11.5, minStock: 1, reorder: false,
  yeastLab: 'Fermentis', yeastStrain: 'US-05', yeastAttenuationPct: 72, yeastTempMinC: 18, yeastTempMaxC: 24,
  yeastTechnicalFacts: [{ key: 'temperature', reported: '18–24 °C', range: { min: 18, max: 24 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Ancienne fiche', sourceUrl: 'https://example.test/old', retrievedAt: '2026-09-01T00:00:00Z', context: 'Beer' }] });
const yeast = (): HopYeast => ({ id: 'fixture-yeast', kind: 'yeast', name: 'Levure test', betaLyase: 'unknown', form: 'sèche',
  source: { title: 'Fiche fabricant', author: 'Brasseur', year: 2026, kind: 'manufacturer', reference: 'https://example.test/products/yeast' },
  catalogue: { manufacturer: 'Brasserie Test', productId: 'test-01', productCode: 'T-01', aliases: [], categories: ['ale'], status: 'listed',
    facts: [{ key: 'temperature', label: 'Fermentation', reported: '18–24 °C', range: { min: 18, max: 24 }, unit: '°C', qualifier: 'range', context: 'Beer',
      source: { title: 'Fiche fabricant', author: 'Brasserie Test', year: 2026, kind: 'manufacturer', reference: 'https://example.test/products/yeast' } }],
    documents: [{ title: 'Fiche fabricant', url: 'https://example.test/products/yeast' }],
    retrievals: [{ url: 'https://example.test/products/yeast', retrievedAt: checkedAt, sha256: 'a'.repeat(64), etag: null, lastModified: null }],
    publishedAt: null, pageUpdatedAt: null, parserVersion: 'yeast-parser-v1', contentSha256: 'b'.repeat(64), gaps: []
  }
});
const productDoc = (): YeastProductDocument => ({ id: 'product-01', version: 1, revision: 2,
  product: { id: 'product-01', referenceId: 'fixture-yeast', label: 'Levure test 11 g', manufacturer: 'Brasserie Test', form: 'sèche',
    source: { title: 'Fiche fabricant', url: 'https://example.test/products/yeast', checkedAt },
    dose: { range: { min: 50, max: 80 }, qualifier: 'range', unit: 'g/hL', conditions: 'Moût standard', source: { title: 'Fiche fabricant', url: 'https://example.test/products/yeast', checkedAt, origin: 'manufacturer' } } },
  offers: [{ id: 'offer-01', productId: 'product-01', seller: 'Brewstore', url: 'https://brewstore.ch/products/yeast-11g',
    stock: { status: 'unknown', text: 'Pas de disponibilité lisible', source: { title: 'Fiche vendeur', url: 'https://brewstore.ch/products/yeast-11g', checkedAt } },
    price: { amount: 4.9, currency: 'CHF', packs: 1, source: { title: 'Fiche vendeur', url: 'https://brewstore.ch/products/yeast-11g', checkedAt, origin: 'merchant' } } }]
});
const manualSource = (title: string, path: string) => ({ title, url: `https://example.test/${path}`, checkedAt });
const manualProductDraft = (): YeastProductDocument => ({ id: 'manual-product-01', version: 1, revision: 0, offers: [], product: {
  id: 'manual-product-01', referenceId: 'fixture-yeast', label: 'Levure test exacte 11 g', manufacturer: 'Brasserie Test', form: 'sèche',
  source: manualSource('Produit saisi', 'manual/product'),
  format: { amount: 11, unit: 'g', label: 'sachet 11 g', source: manualSource('Conditionnement saisi', 'manual/format') },
  dose: { range: { min: 50, max: 80 }, qualifier: 'range', unit: 'g/hL', conditions: 'Moût standard', source: manualSource('Dose saisie', 'manual/dose') },
  cellsPerPack: { range: { min: 5, max: 6 }, kind: 'viable', qualifier: 'range', conditions: 'À la fabrication', source: manualSource('Cellules saisies', 'manual/cells') }
} });
const manualOfferDraft = (productId: string, id = 'offer-manual-02'): YeastOffer => {
  const source = manualSource('Offre saisie', 'manual/offer');
  return { id, productId, seller: 'Marchand test', sellerCountry: 'CH', sellerSource: source, url: source.url,
    stock: { status: 'unknown', text: 'Disponibilité non vérifiée', source },
    shipping: { destination: 'CH', status: 'unknown', conditions: 'Non vérifiées', source },
    price: { amount: 4.9, currency: 'CHF', packs: 1, source } };
};
const manualStarterDraft = (id = 'starter-manual-01'): YeastStarterProtocol => ({ id, label: 'Starter M20 à 1,040',
  source: manualSource('Notice de préparation saisie', 'manual/starter-m20'), method: 'Culture dans un milieu au malt', medium: 'malt-extract', targetSg: 1.04,
  conditions: 'Vérifier gravité et activité avant transfert; rendement cellulaire non publié.', leadHours: { min: 24, max: 36 },
  leadHoursMeaning: 'culture', steps: ['Préparer 1 L de milieu au malt', 'Refroidir et oxygéner selon la notice', 'Ajouter la culture et suivre son activité'] });
const proposeManualProduct = async (document = manualProductDraft()) => proposeYeastDbCorrection.run({ data: {
  target: { scope: 'product', id: document.id, fallback: document }, request: 'Créer ce produit exact saisi par le brasseur.', manual: { kind: 'product-create' }
} } as any) as Promise<YeastDbCorrectionProposal>;
const proposeManualOffer = async (target: { id: string; fallback?: YeastProductDocument }, offer: YeastOffer) => proposeYeastDbCorrection.run({ data: {
  target: { scope: 'offer', id: target.id, offerId: offer.id, ...(target.fallback ? { fallback: target.fallback } : {}) },
  request: 'Ajouter cette offre exacte saisie par le brasseur.', manual: { kind: 'offer-create', offer }
} } as any) as Promise<YeastDbCorrectionProposal>;
const proposeManualStarter = async (target: { id: string; fallback?: YeastProductDocument }, protocol: YeastStarterProtocol) => proposeYeastDbCorrection.run({ data: {
  target: { scope: 'product', id: target.id, ...(target.fallback ? { fallback: target.fallback } : {}) },
  request: 'Compléter manuellement la notice de starter de ce produit exact.', manual: { kind: 'starter-set', protocol }
} } as any) as Promise<YeastDbCorrectionProposal>;
const call = (proposal: YeastDbCorrectionProposal, selectedIds: string[]) => applyYeastDbCorrection.run({ data: { proposal, selectedIds } } as any);
const proposal = (target: YeastDbCorrectionTarget, data: any, changes: YeastDbCorrectionProposal['changes'], exists = true): YeastDbCorrectionProposal => {
  const unsigned = { id: 'c'.repeat(32), target, targetExists: exists, expectedRevision: yeastDbCorrectionRevision(target, exists, data),
    ...(exists ? {} : { fallback: data }), changes, generatedAt: Date.now(), model: 'Gemini test', title: 'Correction test' };
  return { ...unsigned, proposedByUid: 'qa-user', signature: createHmac('sha256', 'unused-test-secret').update(stableJson({ uid: 'qa-user', proposal: unsigned })).digest('hex') };
};

beforeEach(() => { state.docs.clear(); state.commits = 0; aiProvider.content = ''; });

describe('correction IA des fiches canoniques', () => {
  it('corrige un champ stock déjà renseigné sans toucher à la quantité, et garde reçu + audit atomiques', async () => {
    const before = stock(), target: YeastDbCorrectionTarget = { scope: 'stock', ref: before.ref };
    state.docs.set('stockItems/US05-LOT-A', structuredClone(before));
    const candidate = proposal(target, before, [{ id: 'C1', field: 'stock.yeastAttenuationPct', label: 'Atténuation', before: 72, value: 76,
      reason: 'La réponse IA propose un point publié.', context: 'Atténuation apparente de bière', source, documentaryFact: scalarAttenuationFact(76) }]);
    const receipt = await call(candidate, ['C1']) as any;
    expect(receipt).toMatchObject({ status: 'server-confirmed', targetCreated: false, revisionBefore: candidate.expectedRevision });
    expect(state.docs.get('stockItems/US05-LOT-A')).toMatchObject({ currentStock: 11.5, unit: 'g', yeastAttenuationPct: 76 });
    expect(state.docs.get('stockItems/US05-LOT-A').yeastTechnicalFacts).toEqual(expect.arrayContaining([
      { ...scalarAttenuationFact(76), acceptedScalarFields: ['yeastAttenuationPct'] }
    ]));
    expect(state.docs.get(`auditLogs/${receipt.auditId}`)).toMatchObject({ approvedByUid: 'qa-user', changes: candidate.changes, receipt });
    const committed = structuredClone([...state.docs]);
    expect(await call(candidate, ['C1'])).toEqual(receipt);
    expect([...state.docs]).toEqual(committed);
  });

  it('refuse une saisie manuelle arrivée après la proposition, sans audit ni perte', async () => {
    const before = stock(), target: YeastDbCorrectionTarget = { scope: 'stock', ref: before.ref };
    state.docs.set('stockItems/US05-LOT-A', structuredClone(before));
    const candidate = proposal(target, before, [{ id: 'C1', field: 'stock.yeastAttenuationPct', label: 'Atténuation', before: 72, value: 76,
      reason: 'La réponse IA propose un point publié.', context: 'Atténuation apparente de bière', source, documentaryFact: scalarAttenuationFact(76) }]);
    state.docs.get('stockItems/US05-LOT-A').yeastAttenuationPct = 74;
    const manual = structuredClone([...state.docs]);
    await expect(call(candidate, ['C1'])).rejects.toThrow(/changé depuis la proposition/);
    expect([...state.docs]).toEqual(manual);
  });

  it('refuse un avant/après retouché côté navigateur après la proposition signée', async () => {
    const before = stock(), target: YeastDbCorrectionTarget = { scope: 'stock', ref: before.ref };
    state.docs.set('stockItems/US05-LOT-A', structuredClone(before));
    const candidate = proposal(target, before, [{ id: 'C1', field: 'stock.yeastAttenuationPct', label: 'Atténuation', before: 72, value: 76,
      reason: 'La réponse IA propose un point publié.', context: 'Atténuation apparente de bière', source, documentaryFact: scalarAttenuationFact(76) }]);
    const tampered = { ...candidate, changes: [{ ...candidate.changes[0], value: 95 }] };
    const untouched = structuredClone([...state.docs]);
    await expect(call(tampered, ['C1'])).rejects.toThrow(/modifiée après sa création/);
    expect([...state.docs]).toEqual(untouched);
  });

  it('remplace un fait récolté dans la surcouche IA et laisse le catalogue brut et son hash identiques', async () => {
    const before = yeast(), target: YeastDbCorrectionTarget = { scope: 'catalogue', id: before.id };
    const oldFact = harvestedYeastTechnicalFact(before.catalogue!.facts[0], before.catalogue!);
    state.docs.set(`hopKnowledge/${before.id}`, structuredClone(before));
    const value = { ...oldFact, reported: '17–23 °C', range: { min: 17, max: 23 }, origin: 'ai' as const,
      source: 'Fiche fabricant consultée', sourceUrl: 'https://example.test/products/yeast', retrievedAt: checkedAt };
    const candidate = proposal(target, before, [{ id: 'C1', field: 'catalogue.technicalFact', label: 'temperature · Beer', before: oldFact, value,
      reason: 'La plage publiée est 17–23 °C.', context: 'Beer', source }]);
    const receipt = await call(candidate, ['C1']) as any;
    const saved = state.docs.get(`hopKnowledge/${before.id}`);
    assertHopKnowledge(saved, before.id);
    expect(saved.catalogue).toEqual(before.catalogue);
    expect(saved.catalogue.contentSha256).toBe('b'.repeat(64));
    expect(saved.reviewedDocumentary).toMatchObject({ version: 1, hopIndexId: before.id, technicalFacts: [value] });
    expect(saved.reviewedDocumentaryRevision).toMatchObject({ revision: 1, replacements: [{ before: JSON.stringify([oldFact.key, oldFact.reported, oldFact.range.min, oldFact.range.max, oldFact.unit, oldFact.qualifier, oldFact.context, oldFact.source, oldFact.sourceUrl]), after: expect.any(String) }] });
    expect(effectiveYeastTechnicalFacts(saved).map(fact => fact.reported)).toContain('17–23 °C');
    expect(effectiveYeastTechnicalFacts(saved).map(fact => fact.reported)).not.toContain('18–24 °C');
    expect(reviewedYeastReplacements(saved)).toHaveLength(1);
    expect(resolveYeastDossier({ name: saved.name, hopIndexId: saved.id } as any, saved).temperature?.range).toEqual({ min: 17, max: 23 });
    const adopted = resolveYeastDossier({ name: saved.name, hopIndexId: saved.id, technicalFacts: [
      { key: 'temperature', reported: '20–21 °C', range: { min: 20, max: 21 }, unit: '°C', qualifier: 'range', origin: 'personal', source: 'Fiche adoptée', sourceUrl: 'https://example.test/adopted', context: 'Beer' }
    ] } as any, saved);
    expect(adopted.temperature?.range).toEqual({ min: 20, max: 21 });
    expect(yeastStrainInformation(saved, 'sèche')?.reviewedCorrections).toHaveLength(1);
    expect(receipt.status).toBe('server-confirmed');
  });

  it('conserve origin IA et le lien brut lors d’une correction de lien seul', async () => {
    const before = stock(), target: YeastDbCorrectionTarget = { scope: 'stock', ref: before.ref };
    state.docs.set('stockItems/US05-LOT-A', structuredClone(before));
    const oldFact = before.yeastTechnicalFacts[0];
    const value = { ...oldFact, source: 'Fiche fabricant corrigée', sourceUrl: 'https://example.test/products/yeast', retrievedAt: checkedAt };
    const candidate = proposal(target, before, [{ id: 'C1', field: 'stock.technicalFact', label: 'Température · Beer', before: oldFact, value,
      reason: 'Le lien direct de cette fiche a été corrigé.', context: 'Beer', source: { ...source, linkCorrection: { originalUrl: oldFact.sourceUrl, correctedAt: checkedAt } } }]);
    const receipt = await call(candidate, ['C1']) as any;
    const saved = state.docs.get('stockItems/US05-LOT-A');
    expect(saved.yeastTechnicalFacts).toEqual([oldFact, value]);
    expect(state.docs.get(`auditLogs/${receipt.auditId}`).changes[0].before.sourceUrl).toBe('https://example.test/old');
    expect(state.docs.get(`auditLogs/${receipt.auditId}`).changes[0].value.origin).toBe('ai');
  });

  it('corrige la plage produit sans la transformer en point ni en dose de recette', async () => {
    const before = productDoc(), target: YeastDbCorrectionTarget = { scope: 'product', id: before.id };
    state.docs.set('yeastProducts/product-01', structuredClone(before));
    const value = { range: { min: 40, max: 65 }, qualifier: 'range' as const, unit: 'g/hL' as const, conditions: 'Selon la fiche fabricant',
      source: { title: 'Fiche fabricant actualisée', url: source.url, checkedAt, origin: 'ai' as const } };
    const candidate = proposal(target, before, [{ id: 'C1', field: 'product.dose', label: 'Dose fabricant · g/hL', before: before.product.dose, value,
      reason: 'La source publie une plage différente.', context: value.conditions, source: value.source }]);
    const receipt = await call(candidate, ['C1']) as any;
    const saved = state.docs.get('yeastProducts/product-01');
    expect(saved.product.dose).toEqual(value);
    expect(saved.revision).toBe(3);
    expect(saved.offers).toEqual(before.offers);
    expect(receipt.status).toBe('server-confirmed');
  });

  it('crée une offre bootstrap seulement si le document canonique est encore absent', async () => {
    const fallback = productDoc(), target: YeastDbCorrectionTarget = { scope: 'offer', id: fallback.id, offerId: 'offer-01' };
    const oldOffer = fallback.offers[0];
    const value = { status: 'out-of-stock' as const, text: 'Ausverkauft', source: { title: 'Levure test 11 g', url: oldOffer.url, checkedAt, origin: 'merchant' as const } };
    const candidate = proposal(target, fallback, [{ id: 'C1', field: 'offer.stock', label: 'Disponibilité', before: oldOffer.stock, value,
      reason: 'La page produit exacte annonce Ausverkauft.', context: 'Brewstore · page vérifiée', source: value.source }], false);
    const receipt = await call(candidate, ['C1']) as any;
    const saved = state.docs.get('yeastProducts/product-01');
    expect(saved.revision).toBe(3);
    expect(saved.offers[0].revision).toBe(1);
    expect(saved.offers[0].stock).toEqual(value);
    expect(receipt).toMatchObject({ targetCreated: true, status: 'server-confirmed' });
  });

  it('met à jour prix/devise tout en conservant la base de pack explicite', async () => {
    const before = productDoc(), target: YeastDbCorrectionTarget = { scope: 'offer', id: before.id, offerId: 'offer-01' };
    state.docs.set('yeastProducts/product-01', structuredClone(before));
    const oldPrice = before.offers[0].price!, value = { amount: 4.45, currency: 'EUR' as const, packs: oldPrice.packs,
      source: { title: 'Fiche vendeur', url: oldPrice.source.url, checkedAt, origin: 'merchant' as const } };
    const candidate = proposal(target, before, [{ id: 'C1', field: 'offer.price', label: 'Prix · base 1 pack', before: oldPrice, value,
      reason: 'La fiche exacte indique EUR 4,45.', source: value.source }]);
    await call(candidate, ['C1']);
    expect(state.docs.get('yeastProducts/product-01').offers[0].price).toEqual(value);
    expect(state.docs.get('yeastProducts/product-01').offers[0].stock).toEqual(before.offers[0].stock);
  });

  it('prépare une observation manuelle sans appel Gemini ni écriture avant confirmation', async () => {
    const fallback = productDoc();
    const generated = await proposeYeastDbCorrection.run({ data: {
      target: { scope: 'offer', id: fallback.id, offerId: 'offer-01', fallback },
      request: 'La page exacte affiche une rupture de stock.',
      manual: { kind: 'stock', status: 'out-of-stock', text: 'Rupture de stock', source: { title: 'Offre lue par le brasseur', url: 'https://brewstore.ch/products/yeast-11g', checkedAt } }
    } } as any) as YeastDbCorrectionProposal;
    expect(generated.model).toBe('Saisie manuelle');
    expect(generated.targetExists).toBe(false);
    expect(generated.changes[0].value).toMatchObject({ status: 'out-of-stock', source: { origin: 'manual' } });
    expect(state.docs.size).toBe(0);
    expect(await call(generated, ['C1'])).toMatchObject({ status: 'server-confirmed', targetCreated: true });
  });

  it('attribue les motifs de correction IA à la réponse et cite la page sans prétendre l’avoir vérifiée', async () => {
    const responseUrl = 'https://example.test/lookup/us05';
    const factUrl = 'https://example.test/manufacturer/us05';
    aiProvider.content = JSON.stringify({ found: true, name: 'SafAle US-05', sourceUrl: responseUrl, retrievedAt: checkedAt,
      note: 'La fiche consultée indique une autre plage.', lab: 'Fermentis Brewing', technicalFacts: [{ key: 'temperature', reported: '16–22 °C',
        range: { min: 16, max: 22 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Fiche Fermentis citée', sourceUrl: factUrl,
        retrievedAt: checkedAt, context: 'Beer' }] });
    const beforeStock = stock();
    state.docs.set('stockItems/US05-LOT-A', structuredClone(beforeStock));
    const generated = await proposeYeastDbCorrection.run({ data: {
      target: { scope: 'stock', ref: beforeStock.ref }, request: 'Vérifie la température et le laboratoire déjà enregistrés.'
    } } as any) as YeastDbCorrectionProposal;
    const temperature = generated.changes.find(change => change.field === 'stock.technicalFact')!;
    const laboratory = generated.changes.find(change => change.field === 'stock.yeastLab')!;
    expect(temperature.reason).toContain('La réponse IA propose « 16–22 °C »');
    expect(temperature.reason).toContain('Fiche Fermentis citée');
    expect(temperature.reason).toContain('Motif fourni par la réponse IA : La fiche consultée indique une autre plage.');
    expect(temperature.reason).toContain('n’a pas été archivé ni vérifié indépendamment');
    expect(temperature.reason).not.toMatch(/^La fiche consultée/);
    expect(temperature.source).toMatchObject({ title: 'Fiche Fermentis citée', url: factUrl, origin: 'ai' });
    expect(laboratory.reason).toContain('La réponse IA propose « Fermentis Brewing »');
    expect(laboratory.source).toMatchObject({ title: 'Source citée par la réponse IA', url: responseUrl, origin: 'ai' });
    expect(state.docs.get('stockItems/US05-LOT-A')).toEqual(beforeStock);

    state.docs.set('yeastProducts/product-01', productDoc());
    aiProvider.content = JSON.stringify({ found: true, name: 'Levure test 11 g', sourceUrl: responseUrl, retrievedAt: checkedAt,
      technicalFacts: [{ key: 'pitchRate', reported: '40–65 g/hL', range: { min: 40, max: 65 }, unit: 'g/hL', qualifier: 'range', origin: 'ai',
        source: 'Fiche M20 citée', sourceUrl: factUrl, retrievedAt: checkedAt, context: 'Beer · moût standard' }] });
    const productProposal = await proposeYeastDbCorrection.run({ data: {
      target: { scope: 'product', id: 'product-01' }, request: 'Vérifie la dose fabricant déjà enregistrée.'
    } } as any) as YeastDbCorrectionProposal;
    expect(productProposal.changes[0].reason).toContain('La réponse IA propose « 40–65 g/hL »');
    expect(productProposal.changes[0].reason).toContain('Fiche M20 citée');
    expect(productProposal.changes[0].reason).toContain('n’a pas été archivé ni vérifié indépendamment');
    expect(productProposal.changes[0].reason).not.toMatch(/^La fiche consultée/);
    expect(state.docs.get('yeastProducts/product-01')).toEqual(productDoc());
  });

  it('conserve les bornes attenuation min=max sans les adopter comme points lors de la sauvegarde', async () => {
    const cases = [
      { qualifier: 'greaterThan' as const, reported: '>12 %' },
      { qualifier: 'atLeast' as const, reported: '≥12 %' },
      { qualifier: 'lessThan' as const, reported: '<12 %' },
      { qualifier: 'upTo' as const, reported: '≤12 %' }
    ];
    for (const [index, input] of cases.entries()) {
      const item = stock(); item.id = `BOUND-${index}`; item.ref = item.id;
      state.docs.set(`stockItems/${item.ref}`, structuredClone(item));
      const fact: YeastTechnicalFact = { key: 'attenuation', reported: input.reported, range: { min: 12, max: 12 }, unit: '%',
        qualifier: input.qualifier, origin: 'ai', source: 'Fiche fabricant citée', sourceUrl: `https://example.test/attenuation/${index}`,
        retrievedAt: checkedAt, context: 'Atténuation apparente de bière' };
      aiProvider.content = JSON.stringify({ found: true, name: item.name, source: 'Réponse IA', sourceUrl: 'https://example.test/lookup/attenuation',
        retrievedAt: checkedAt, attenuationPct: 12, technicalFacts: [fact] });
      const generated = await proposeYeastDbCorrection.run({ data: {
        target: { scope: 'stock', ref: item.ref }, request: 'Vérifie la borne d’atténuation et sa source.'
      } } as any) as YeastDbCorrectionProposal;
      expect(generated.changes.map(change => change.field)).toEqual(['stock.technicalFact']);
      expect(generated.changes[0].value).toMatchObject({ reported: input.reported, range: { min: 12, max: 12 }, qualifier: input.qualifier,
        unit: '%', origin: 'ai', source: fact.source, sourceUrl: fact.sourceUrl, retrievedAt: checkedAt, context: fact.context });
      const receipt = await call(generated, [generated.changes[0].id]) as any;
      const saved = state.docs.get(`stockItems/${item.ref}`);
      expect(saved.yeastAttenuationPct).toBe(72);
      expect(saved.yeastTechnicalFacts).toEqual(expect.arrayContaining([fact]));
      expect(state.docs.get(`auditLogs/${receipt.auditId}`).changes[0].value).toEqual(fact);
    }
  });

  it('propage les quatre opérateurs de dose IA jusque dans le produit canonique et son reçu', async () => {
    const cases = [
      { qualifier: 'greaterThan' as const, reported: '>50 g/hL', stored: 'strict-lower-bound' as const },
      { qualifier: 'atLeast' as const, reported: '≥50 g/hL', stored: 'lower-bound' as const },
      { qualifier: 'lessThan' as const, reported: '<80 g/hL', stored: 'strict-upper-bound' as const },
      { qualifier: 'upTo' as const, reported: '≤80 g/hL', stored: 'upper-bound' as const }
    ];
    for (const [index, input] of cases.entries()) {
      const before = productDoc();
      state.docs.set('yeastProducts/product-01', structuredClone(before));
      const fact: YeastTechnicalFact = { key: 'pitchRate', reported: input.reported,
        range: { min: Number(input.reported.match(/\d+/)?.[0]), max: Number(input.reported.match(/\d+/)?.[0]) }, unit: 'g/hL',
        qualifier: input.qualifier, origin: 'ai', source: 'Fiche fabricant citée',
        sourceUrl: `https://example.test/dose/${index}`, retrievedAt: checkedAt, context: 'Moût standard · guide fabricant' };
      aiProvider.content = JSON.stringify({ found: true, name: before.product.label, sourceUrl: fact.sourceUrl,
        retrievedAt: checkedAt, technicalFacts: [fact] });
      const generated = await proposeYeastDbCorrection.run({ data: {
        target: { scope: 'product', id: before.id }, request: 'Vérifie la borne de dose fabricant et son signe.'
      } } as any) as YeastDbCorrectionProposal;
      const dose = generated.changes.find(change => change.field === 'product.dose')!;
      expect(dose.value).toMatchObject({ range: fact.range, qualifier: input.stored, unit: 'g/hL', conditions: fact.context,
        source: { title: fact.source, url: fact.sourceUrl, checkedAt, origin: 'ai' } });
      expect(dose.reason).toContain(input.reported);
      const receipt = await call(generated, [dose.id]) as any;
      const saved = state.docs.get('yeastProducts/product-01');
      expect(saved.revision).toBe(before.revision + 1);
      expect(saved.product.dose).toEqual(dose.value);
      expect(receipt).toMatchObject({ status: 'server-confirmed', targetCreated: false });
      expect(state.docs.get(`auditLogs/${receipt.auditId}`).changes[0].value).toEqual(dose.value);
    }
  });

  it('lie un scalaire point compatible à sa source et l’applique atomiquement avec le fait typé', async () => {
    const before = stock();
    state.docs.set('stockItems/US05-LOT-A', structuredClone(before));
    const fact: YeastTechnicalFact = scalarAttenuationFact(76);
    aiProvider.content = JSON.stringify({ found: true, name: before.name, source: source.title, sourceUrl: source.url, retrievedAt: checkedAt,
      attenuationPct: 76, technicalFacts: [fact] });
    const generated = await proposeYeastDbCorrection.run({ data: {
      target: { scope: 'stock', ref: before.ref }, request: 'Vérifie le point d’atténuation retenu.'
    } } as any) as YeastDbCorrectionProposal;
    const typedChange = generated.changes.find(change => change.field === 'stock.technicalFact')!;
    const scalar = generated.changes.find(change => change.field === 'stock.yeastAttenuationPct')!;
    expect(typedChange.group).toBeTruthy();
    expect(scalar.group).toBe(typedChange.group);
    expect(scalar.documentaryFact).toEqual(fact);
    expect(scalar.source).toMatchObject({ title: fact.source, url: fact.sourceUrl, checkedAt: fact.retrievedAt, origin: 'ai' });
    await expect(call(generated, [scalar.id])).rejects.toThrow(/Sélection de corrections invalide ou incomplète/);
    const receipt = await call(generated, [typedChange.id, scalar.id]) as any;
    const saved = state.docs.get('stockItems/US05-LOT-A');
    expect(saved.yeastAttenuationPct).toBe(76);
    expect(saved.yeastTechnicalFacts).toEqual(expect.arrayContaining([
      { ...fact, acceptedScalarFields: ['yeastAttenuationPct'] }
    ]));
    expect(state.docs.get(`auditLogs/${receipt.auditId}`).changes).toEqual(generated.changes);
  });

  it('ne lie un scalaire inchangé à son nouveau fait que par la paire appliquée, en gardant l’observation précédente', async () => {
    const before = stock();
    before.yeastFlocculation = 'Low';
    const oldFact: YeastTechnicalFact = { key: 'flocculation', reported: 'Low', origin: 'ai', source: 'Ancienne notice citée',
      sourceUrl: 'https://example.test/old-flocculation', retrievedAt: '2026-09-01T12:00:00.000Z', context: 'Beer' };
    before.yeastTechnicalFacts.push(oldFact);
    state.docs.set('stockItems/US05-LOT-A', structuredClone(before));
    const currentFact: YeastTechnicalFact = { key: 'flocculation', reported: 'Low', origin: 'ai', source: 'Nouvelle notice citée',
      sourceUrl: 'https://example.test/current-flocculation', retrievedAt: checkedAt,
      context: 'Beer · flocculation recommandée' };
    aiProvider.content = JSON.stringify({ found: true, name: before.name, source: 'Recherche IA',
      sourceUrl: 'https://example.test/lookup/flocculation', retrievedAt: checkedAt, flocculation: 'Low', technicalFacts: [currentFact] });

    const generated = await proposeYeastDbCorrection.run({ data: {
      target: { scope: 'stock', ref: before.ref }, request: 'Vérifie la floculation déjà retenue et son origine.'
    } } as any) as YeastDbCorrectionProposal;
    const factChange = generated.changes.find(change => change.field === 'stock.technicalFact')!;
    const scalarLink = generated.changes.find(change => change.field === 'stock.yeastFlocculation')!;
    expect(factChange.value).not.toHaveProperty('acceptedScalarFields');
    expect(scalarLink).toMatchObject({ before: 'Low', value: 'Low', documentaryFact: {
      source: currentFact.source, sourceUrl: currentFact.sourceUrl, retrievedAt: checkedAt, context: currentFact.context
    } });
    expect(scalarLink.group).toBe(factChange.group);
    await expect(call(generated, [factChange.id])).rejects.toThrow(/Sélection de corrections invalide ou incomplète/);

    const receipt = await call(generated, [factChange.id, scalarLink.id]) as any;
    const saved = state.docs.get('stockItems/US05-LOT-A');
    expect(saved.yeastFlocculation).toBe('Low');
    expect(saved.yeastTechnicalFacts).toContainEqual(oldFact);
    const accepted = saved.yeastTechnicalFacts.filter((fact: YeastTechnicalFact) => fact.acceptedScalarFields?.includes('yeastFlocculation'));
    expect(accepted).toEqual([{ ...currentFact, acceptedScalarFields: ['yeastFlocculation'] }]);
    expect(saved.yeastTechnicalFacts.filter((fact: YeastTechnicalFact) => fact.acceptedScalarFields?.includes('yeastFlocculation'))).toHaveLength(1);
    expect(receipt.status).toBe('server-confirmed');
  });

  it('refuse au modèle de déclarer qu’un fait a déjà été accepté pour un champ scalaire', async () => {
    const before = stock(); state.docs.set('stockItems/US05-LOT-A', structuredClone(before));
    aiProvider.content = JSON.stringify({ found: true, name: before.name, source: 'Recherche IA', sourceUrl: 'https://example.test/lookup', retrievedAt: checkedAt,
      technicalFacts: [{ key: 'flocculation', reported: 'Low', origin: 'ai', source: 'Fiche citée', sourceUrl: 'https://example.test/flocculation',
        retrievedAt: checkedAt, context: 'Beer', acceptedScalarFields: ['yeastFlocculation'] }] });
    await expect(proposeYeastDbCorrection.run({ data: {
      target: { scope: 'stock', ref: before.ref }, request: 'Vérifie la floculation.'
    } } as any)).rejects.toThrow(/ne peut pas déclarer/);
    expect(state.docs.get('stockItems/US05-LOT-A')).toEqual(before);
    expect(state.commits).toBe(0);
  });

  it('permet une observation manuelle de livraison CH sans marquer la page comme vérifiée par le serveur', async () => {
    const fallback = productDoc();
    const generated = await proposeYeastDbCorrection.run({ data: {
      target: { scope: 'offer', id: fallback.id, offerId: 'offer-01', fallback },
      request: 'Le vendeur ne livre pas en Suisse.',
      manual: { kind: 'shipping', status: 'no', conditions: 'La politique exclut la Suisse.', source: { title: 'Politique de livraison', url: 'https://brewstore.ch/shipping/switzerland', checkedAt } }
    } } as any) as YeastDbCorrectionProposal;
    expect(generated.changes[0].field).toBe('offer.shipping');
    expect(generated.changes[0].value).toMatchObject({ destination: 'CH', status: 'no', source: { origin: 'manual' } });
    expect(state.docs.size).toBe(0);
    const receipt = await call(generated, ['C1']) as any;
    expect(state.docs.get('yeastProducts/product-01').offers[0].shipping).toMatchObject({ destination: 'CH', status: 'no', source: { origin: 'manual' } });
    expect(receipt.status).toBe('server-confirmed');
  });

  it('refuse la création bootstrap si un document concurrent arrive avant la confirmation', async () => {
    const fallback = productDoc(), target: YeastDbCorrectionTarget = { scope: 'offer', id: fallback.id, offerId: 'offer-01' };
    const oldOffer = fallback.offers[0], value = { status: 'in-stock' as const, text: 'Auf Lager', source: { title: 'Levure test 11 g', url: oldOffer.url, checkedAt, origin: 'merchant' as const } };
    const candidate = proposal(target, fallback, [{ id: 'C1', field: 'offer.stock', label: 'Disponibilité', before: oldOffer.stock, value,
      reason: 'La fiche exacte est lue.', source: value.source }], false);
    state.docs.set('yeastProducts/product-01', { ...fallback, revision: 1 });
    const concurrent = structuredClone([...state.docs]);
    await expect(call(candidate, ['C1'])).rejects.toThrow(/créée pendant la vérification/);
    expect([...state.docs]).toEqual(concurrent);
  });

  it('propose puis crée un produit manuel neuf avec ses sources explicitement manuelles', async () => {
    const generated = await proposeManualProduct();
    expect(state.docs.size).toBe(0);
    expect(generated).toMatchObject({ target: { scope: 'product', id: 'manual-product-01' }, targetExists: false, model: 'Saisie manuelle' });
    expect(generated.changes).toHaveLength(1);
    expect(generated.changes[0]).toMatchObject({ field: 'product.create', before: null, value: {
      id: 'manual-product-01', format: { source: { origin: 'manual' } }, dose: { qualifier: 'range', source: { origin: 'manual' } },
      cellsPerPack: { qualifier: 'range', source: { origin: 'manual' } }, source: { origin: 'manual' }
    } });
    const receipt = await call(generated, ['C1']) as any;
    const saved = state.docs.get('yeastProducts/manual-product-01');
    expect(saved).toMatchObject({ id: 'manual-product-01', version: 1, revision: 0, offers: [], product: generated.changes[0].value });
    expect(receipt).toMatchObject({ status: 'server-confirmed', targetCreated: true, entityCreated: 'product', target: { scope: 'product', id: 'manual-product-01' } });
    expect(state.docs.get(`auditLogs/${receipt.auditId}`).receipt).toEqual(receipt);
  });

  it('refuse sans écrasement la création produit si un document apparaît après la proposition', async () => {
    const generated = await proposeManualProduct();
    const concurrent = { ...manualProductDraft(), revision: 1, product: { ...manualProductDraft().product, label: 'Produit ajouté ailleurs' } };
    state.docs.set('yeastProducts/manual-product-01', concurrent);
    const before = structuredClone([...state.docs]);
    await expect(call(generated, ['C1'])).rejects.toThrow(/créée pendant la vérification/);
    expect([...state.docs]).toEqual(before);
    expect([...state.docs.keys()].some(path => path.startsWith('auditLogs/'))).toBe(false);
  });

  it('ajoute une offre manuelle au parent existant en gardant les autres offres et données', async () => {
    const before = productDoc();
    state.docs.set('yeastProducts/product-01', structuredClone(before));
    const offer = manualOfferDraft(before.id), generated = await proposeManualOffer({ id: before.id }, offer);
    expect(state.docs.get('yeastProducts/product-01')).toEqual(before);
    expect(generated).toMatchObject({ targetExists: true, model: 'Saisie manuelle', changes: [{ field: 'offer.create', value: { id: offer.id, productId: before.id, stock: { source: { origin: 'manual' } }, shipping: { source: { origin: 'manual' } }, price: { source: { origin: 'manual' } }, sellerSource: { origin: 'manual' } } }] });
    const receipt = await call(generated, ['C1']) as any;
    const saved = state.docs.get('yeastProducts/product-01');
    expect(saved.revision).toBe(before.revision + 1);
    expect(saved.product).toEqual(before.product);
    expect(saved.offers).toHaveLength(before.offers.length + 1);
    expect(saved.offers[0]).toEqual(before.offers[0]);
    expect(saved.offers[1]).toMatchObject({ id: offer.id, productId: before.id, revision: 1, stock: { source: { origin: 'manual' } } });
    expect(receipt).toMatchObject({ targetCreated: false, entityCreated: 'offer', status: 'server-confirmed' });
    expect(state.docs.get(`auditLogs/${receipt.auditId}`).receipt).toEqual(receipt);
  });

  it('crée une offre depuis un fallback parent absent sans dupliquer ni perdre ses offres bootstrap', async () => {
    const fallback = productDoc(), offer = manualOfferDraft(fallback.id), generated = await proposeManualOffer({ id: fallback.id, fallback }, offer);
    expect(state.docs.size).toBe(0);
    expect(generated.fallback?.offers).toHaveLength(1);
    const receipt = await call(generated, ['C1']) as any;
    const saved = state.docs.get('yeastProducts/product-01');
    expect(saved.offers).toHaveLength(fallback.offers.length + 1);
    expect(saved.offers.filter((row: YeastOffer) => row.id === offer.id)).toHaveLength(1);
    expect(saved.offers[0]).toEqual(fallback.offers[0]);
    expect(saved.product).toEqual(fallback.product);
    expect(receipt).toMatchObject({ targetCreated: true, entityCreated: 'offer', status: 'server-confirmed' });
  });

  it('propose un protocole manuel typé, l’ajoute au produit liquide après confirmation et préserve les copies recette', async () => {
    const before = productDoc();
    before.product.form = 'liquide'; delete before.product.dose;
    state.docs.set('yeastProducts/product-01', structuredClone(before));
    const recipeCopy = { id: 'recipe-copy', yeast: { name: before.product.label, pitching: { version: 1, product: before.product } } };
    state.docs.set('recipes/recipe-copy', structuredClone(recipeCopy));
    const protocol = manualStarterDraft(), generated = await proposeManualStarter({ id: before.id }, protocol);
    expect(generated).toMatchObject({ target: { scope: 'product', id: before.id }, targetExists: true, model: 'Saisie manuelle',
      changes: [{ field: 'product.starter', before: null, value: { ...protocol, source: { ...protocol.source, origin: 'manual' } } }] });
    expect(state.docs.get('yeastProducts/product-01')).toEqual(before);
    expect(state.docs.get('recipes/recipe-copy')).toEqual(recipeCopy);

    const receipt = await call(generated, ['C1']) as any;
    const saved = state.docs.get('yeastProducts/product-01');
    expect(saved.revision).toBe(before.revision + 1);
    expect(saved.product.starter).toMatchObject({ ...protocol, source: { ...protocol.source, origin: 'manual' } });
    expect(saved.offers).toEqual(before.offers);
    expect(state.docs.get('recipes/recipe-copy')).toEqual(recipeCopy);
    expect(receipt).toMatchObject({ status: 'server-confirmed', targetCreated: false, target: { scope: 'product', id: before.id } });
    expect(state.docs.get(`auditLogs/${receipt.auditId}`).receipt).toEqual(receipt);
  });

  it('crée une notice depuis le fallback absent et refuse un protocole périmé après changement parent', async () => {
    const fallback = productDoc();
    fallback.product.form = 'liquide'; delete fallback.product.dose;
    const protocol = manualStarterDraft();
    const createdProposal = await proposeManualStarter({ id: fallback.id, fallback }, protocol);
    const createdReceipt = await call(createdProposal, ['C1']) as any;
    expect(state.docs.get('yeastProducts/product-01').product.starter).toMatchObject({ id: protocol.id, source: { origin: 'manual' } });
    expect(createdReceipt).toMatchObject({ targetCreated: true, status: 'server-confirmed' });

    const parent = productDoc(); parent.product.form = 'liquide'; delete parent.product.dose;
    state.docs.set('yeastProducts/product-02', { ...parent, id: 'product-02', product: { ...parent.product, id: 'product-02' },
      offers: parent.offers.map(offer => ({ ...offer, productId: 'product-02' })) });
    const stale = await proposeManualStarter({ id: 'product-02' }, manualStarterDraft('starter-stale'));
    const concurrent = structuredClone(state.docs.get('yeastProducts/product-02'));
    concurrent.revision += 1;
    concurrent.product.starter = { ...manualStarterDraft('starter-concurrent'), source: { ...manualStarterDraft().source, origin: 'manual' } };
    state.docs.set('yeastProducts/product-02', concurrent);
    const saved = structuredClone([...state.docs]);
    await expect(call(stale, ['C1'])).rejects.toThrow(/a changé depuis la proposition/);
    expect([...state.docs]).toEqual(saved);
  });

  it('refuse une notice starter sèche ou un payload de protocole non prévu', async () => {
    const dry = productDoc();
    state.docs.set('yeastProducts/product-01', structuredClone(dry));
    await expect(proposeManualStarter({ id: dry.id }, manualStarterDraft())).rejects.toThrow(/liquide ou une culture/);
    const liquidParent = { ...dry, id: 'product-02', revision: 1, product: { ...dry.product, id: 'product-02', form: 'liquide' as const, dose: undefined },
      offers: dry.offers.map(offer => ({ ...offer, productId: 'product-02' })) };
    state.docs.set('yeastProducts/product-02', liquidParent);
    const invalid = { ...manualStarterDraft(), leadHours: { min: 24, max: 36, total: 48 } } as any;
    await expect(proposeManualStarter({ id: liquidParent.id }, invalid)).rejects.toThrow(/protocole manuel doit être complet/);
    expect(state.docs.get('yeastProducts/product-02')).toEqual(liquidParent);
  });

  it('accepte la date civile CH du jour à 00:12 et refuse demain pour création produit et offre', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T22:12:00.000Z')); // 00:12 le 28.09 à Zurich
    try {
      const today = '2026-09-28', tomorrow = '2026-09-29';
      const product = manualProductDraft();
      for (const source of [product.product.source, product.product.format?.source, product.product.dose?.source, product.product.cellsPerPack?.source])
        if (source) source.checkedAt = today;
      const productProposal = await proposeManualProduct(product);
      expect(productProposal.targetExists).toBe(false);
      expect(await call(productProposal, ['C1'])).toMatchObject({ status: 'server-confirmed', entityCreated: 'product' });

      const parent = productDoc();
      state.docs.set('yeastProducts/product-01', structuredClone(parent));
      const offer = manualOfferDraft(parent.id);
      for (const source of [offer.sellerSource, offer.stock.source, offer.shipping?.source, offer.price?.source])
        if (source) source.checkedAt = today;
      const offerProposal = await proposeManualOffer({ id: parent.id }, offer);
      expect(await call(offerProposal, ['C1'])).toMatchObject({ status: 'server-confirmed', targetCreated: false, entityCreated: 'offer' });

      const tomorrowProduct = manualProductDraft();
      tomorrowProduct.id = 'manual-product-tomorrow';
      tomorrowProduct.product.id = tomorrowProduct.id;
      for (const source of [tomorrowProduct.product.source, tomorrowProduct.product.format?.source, tomorrowProduct.product.dose?.source,
        tomorrowProduct.product.cellsPerPack?.source]) if (source) source.checkedAt = tomorrow;
      await expect(proposeManualProduct(tomorrowProduct)).rejects.toThrow(/Produit manuel invalide/);

      const tomorrowOffer = manualOfferDraft(parent.id, 'offer-manual-tomorrow');
      for (const source of [tomorrowOffer.sellerSource, tomorrowOffer.stock.source, tomorrowOffer.shipping?.source, tomorrowOffer.price?.source])
        if (source) source.checkedAt = tomorrow;
      await expect(proposeManualOffer({ id: parent.id }, tomorrowOffer)).rejects.toThrow(/Offre manuelle invalide/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('refuse une offre d’un autre produit et un payload avec un champ non prévu', async () => {
    const fallback = productDoc(), offer = manualOfferDraft(fallback.id);
    await expect(proposeManualOffer({ id: fallback.id, fallback }, { ...offer, productId: 'other-product' })).rejects.toThrow(/offre doit avoir un ID stable/);
    await expect(proposeManualOffer({ id: fallback.id, fallback }, { ...offer, stock: { ...offer.stock, verified: true } } as any)).rejects.toThrow(/offre doit avoir un ID stable/);
    const invalidProduct = manualProductDraft();
    (invalidProduct.product as any).unreviewedClaim = 'extra key';
    await expect(proposeManualProduct(invalidProduct)).rejects.toThrow(/produit exact, neuf, valide/);
    expect(state.docs.size).toBe(0);
  });

  it('refuse sans écrasement si le parent bootstrap est créé pendant la revue d’ajout d’offre', async () => {
    const fallback = productDoc(), offer = manualOfferDraft(fallback.id), generated = await proposeManualOffer({ id: fallback.id, fallback }, offer);
    const concurrent = { ...fallback, revision: fallback.revision + 1 };
    state.docs.set('yeastProducts/product-01', concurrent);
    const before = structuredClone([...state.docs]);
    await expect(call(generated, ['C1'])).rejects.toThrow(/créée pendant la vérification/);
    expect([...state.docs]).toEqual(before);
    expect([...state.docs.keys()].some(path => path.startsWith('auditLogs/'))).toBe(false);
  });

  it('refuse un ID d’offre devenu concurrent ou une révision parent modifiée', async () => {
    const before = productDoc();
    state.docs.set('yeastProducts/product-01', structuredClone(before));
    const offer = manualOfferDraft(before.id), generated = await proposeManualOffer({ id: before.id }, offer);
    const concurrent = structuredClone(before);
    concurrent.revision += 1;
    concurrent.offers.push({ ...offer, revision: 1 });
    state.docs.set('yeastProducts/product-01', concurrent);
    const rows = structuredClone([...state.docs]);
    await expect(call(generated, ['C1'])).rejects.toThrow(/a changé depuis la proposition/);
    expect([...state.docs]).toEqual(rows);
    expect([...state.docs.keys()].some(path => path.startsWith('auditLogs/'))).toBe(false);
  });
});
