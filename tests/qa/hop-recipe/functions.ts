// Local callable adapter. Attempts remain counted; unexpected (especially paid)
// tasks fail immediately, and this module contains no Firebase transport.
export const qaCalls: string[] = [];
export const qaInputs: { name: string; input: any }[] = [];
export const qaLookup = new Map<string, unknown>();
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
        const item = window.__hopQa?.storage.getStocks().rawMaterials.find((row: any) => row.ref === ref);
        const fact = change.documentaryFact;
        if (!item || item.yeastFlocculation !== change.before || change.value !== 'Low' || fact?.key !== 'flocculation'
          || fact?.reported !== change.value || fact?.context !== 'Beer' || fact?.origin !== 'ai')
          throw Error('QA : paire scalaire/fait companion flocculation invalide.');
        const companion = { ...structuredClone(fact), acceptedScalarFields: ['yeastFlocculation'] };
        const facts = [...(item.yeastTechnicalFacts ?? []).filter((row: any) => !(row.key === companion.key && row.context === companion.context)), companion];
        window.__hopQa.storage.updateStockItem('rawMaterials', { ...item, yeastFlocculation: change.value, yeastTechnicalFacts: facts });
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
