import type { HopLot, HopVariety } from '../../../functions/src/hopIndexSchema';
import { HOP_COMMERCIAL_PRODUCTS } from './products';
import { hopDecisionReference } from './measurements';
import { hopCatalogueRecordKey, qualifyHopCatalogueVariants,
  type HopBasisEvidence, type HopCatalogueOrigin, type HopCatalogueQualificationInput, type HopCatalogueVariant } from './catalogueQualification';

export interface HopCatalogueAssembly {
  version: 'hop-catalogue-assembly-v1';
  sources: Array<{ key: string; kind: 'seed' | 'saved' | 'provided'; varieties: number; lots: number; products: number; assignments?: number }>;
  links: Array<{ materialId: string; lotVariantId: string; varietyRecordKey: string; varietyVariantIds: string[]; kind: 'unique' | 'selected' | 'equivalent' }>;
  evidenceBindings: Array<{ evidenceId: string; originalEvidenceId: string; fromVariantId: string; toVariantId: string; recordId: string }>;
  notices: Array<{ materialId: string; relatedRecordKey: string; reason: string }>;
  limitations: string[];
}

export type HopAssembledCatalogueInput = HopCatalogueQualificationInput & { assembly: HopCatalogueAssembly };

export interface HopCatalogueLoaderInput {
  /** Already-read records supplied by the caller. This loader never opens storage or a network connection. */
  saved?: { varieties?: HopVariety[]; lots?: HopLot[] };
  /** Complete explicitly associated materials, for example recipe/stock assignments. */
  additionalVariants?: HopCatalogueVariant[];
  basisEvidence?: HopBasisEvidence[];
  selectedVariantByRecord?: Record<string, string>;
}

async function contentId(value: unknown): Promise<string> {
  if (!globalThis.crypto?.subtle) throw Error('Les références de contenu demandent Web Crypto sur cet appareil.');
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(hopDecisionReference(value)));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Lossless input for the qualified decision facade. Unlike the legacy Map loader,
 * it does not overwrite a saved/proposed record or mistake a content ID for an import receipt.
 */
export async function loadHopCatalogueQualificationInput(options: HopCatalogueLoaderInput = {}): Promise<HopAssembledCatalogueInput> {
  const [manufacturer, guide, styles, studies, trials, publicLots] = await Promise.all([
    import('../../data/hopManufacturerBootstrap.json'), import('../../data/hopGuideVarietyBootstrap.json'),
    import('../../data/hopStyleVarietyBootstrap.json'), import('../../data/hopStudyBootstrap.json'),
    import('../../data/hopTrialBootstrap.json'), import('../../data/hopPublicLotBootstrap.json'),
  ]);
  const packs = [
    ['src/data/hopManufacturerBootstrap.json', manufacturer.default], ['src/data/hopGuideVarietyBootstrap.json', guide.default],
    ['src/data/hopStyleVarietyBootstrap.json', styles.default], ['src/data/hopStudyBootstrap.json', studies.default],
    ['src/data/hopTrialBootstrap.json', trials.default], ['src/data/hopPublicLotBootstrap.json', publicLots.default],
  ] as const;
  const assembly: HopCatalogueAssembly = { version: 'hop-catalogue-assembly-v1', sources: [], links: [], evidenceBindings: [], notices: [],
    limitations: ['Six packs de références hors ligne et les dossiers commerciaux embarqués seulement ; ce chargement ne prétend pas couvrir tous les fichiers houblon ou les données réelles.',
      'Les références d’identités sont des SHA du contenu canonique, pas des empreintes de fichiers importés ni la preuve d’un geste humain.',
      'Une association variétale non résolue laisse le lot avec ses faits propres ; toutes les versions de la variété restent disponibles séparément.',
      'Les stocks et associations recette/produit doivent être fournis explicitement ; aucune disponibilité n’est inventée.'] };
  const records: Array<{ key: string; origin: HopCatalogueOrigin; varieties: HopVariety[]; lots: HopLot[] }> = packs.map(([path, pack]) => ({
    key: `seed:${path}`, origin: { kind: 'seed', packPath: path },
    varieties: (('hopVarieties' in pack ? pack.hopVarieties : []) ?? []) as HopVariety[],
    lots: (('hopLots' in pack ? pack.hopLots : []) ?? []) as HopLot[],
  }));
  records.push({ key: 'saved:caller', origin: { kind: 'saved' }, varieties: options.saved?.varieties ?? [], lots: options.saved?.lots ?? [] });
  const variants: HopCatalogueVariant[] = [];
  const duplicateContent = new Map<string, number>();
  const idFor = async (scope: string, sourceKey: string, record: unknown) => {
    const base = `hop-variant-v1:${await contentId([scope, sourceKey, record])}`;
    const occurrence = (duplicateContent.get(base) ?? 0) + 1; duplicateContent.set(base, occurrence);
    return occurrence === 1 ? base : `${base}:${occurrence}`;
  };
  for (const source of records) {
    assembly.sources.push({ key: source.key, kind: source.origin.kind as 'seed' | 'saved', varieties: source.varieties.length, lots: source.lots.length, products: 0 });
    for (const variety of source.varieties) variants.push({ variantId: await idFor('variety', source.key, variety), scope: 'variety',
      recordId: variety.id, origin: structuredClone(source.origin),
      material: { id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety: structuredClone(variety) } });
  }
  const provided = structuredClone(options.additionalVariants ?? []);
  variants.push(...provided.filter(variant => variant.scope === 'variety'));
  const evidence = structuredClone(options.basisEvidence ?? []);
  // A unique or genuinely equivalent source may be linked; a divergent saved row
  // never wins by its array position. This pass selects no alpha model parameter.
  const varietyGroups = new Map(qualifyHopCatalogueVariants({ variants, basisEvidence: evidence,
    selectedVariantByRecord: options.selectedVariantByRecord }).groups.map(group => [group.key, group]));
  for (const source of records) for (const lot of source.lots) {
    const variantId = await idFor('lot', source.key, lot), materialId = `lot:${lot.id}`;
    const recordKey = hopCatalogueRecordKey('variety', lot.varietyId), group = varietyGroups.get(recordKey);
    const sourceIds = group?.status === 'ready' && group.selectedVariantId ? [group.selectedVariantId]
      : group?.status === 'equivalentVariants' ? group.equivalentVariantIds : [];
    const representative = sourceIds.length ? [...sourceIds].sort().map(id => group!.rawVariants.find(row => row.variantId === id)!).find(Boolean) : undefined;
    const variety = representative?.material.variety;
    variants.push({ variantId, scope: 'lot', recordId: lot.id, origin: structuredClone(source.origin),
      material: { id: materialId, name: lot.name, form: lot.form, lot: structuredClone(lot), ...(variety ? { variety: structuredClone(variety) } : {}) } });
    if (!variety) {
      assembly.notices.push({ materialId, relatedRecordKey: recordKey,
        reason: group ? `Référence variétale non associée (${group.status}) ; les faits propres du lot restent disponibles et les variantes ne sont pas effacées.`
          : 'Référence variétale absente du périmètre chargé ; aucune référence de remplacement inventée.' });
      continue;
    }
    assembly.links.push({ materialId, lotVariantId: variantId, varietyRecordKey: recordKey, varietyVariantIds: sourceIds.slice().sort(),
      kind: group!.status === 'equivalentVariants' ? 'equivalent' : group!.rawVariants.length > 1 ? 'selected' : 'unique' });
    // Reusing an accepted assertion for the same exact fact in a linked material
    // is a recorded technical binding, never another declaration attributed to a human.
    const acceptedIds = new Set(group!.observations.filter(row => sourceIds.includes(row.variantId)).flatMap(row => row.evidenceIds));
    for (const original of options.basisEvidence ?? []) {
      if (!sourceIds.includes(original.variantId) || !acceptedIds.has(original.evidenceId) || original.scope !== 'variety'
        || original.recordId !== lot.varietyId || original.location !== 'variety.analysis') continue;
      const evidenceId = `hop-evidence-binding-v1:${await contentId([original.evidenceId, original.variantId, variantId])}`;
      evidence.push({ ...structuredClone(original), evidenceId, variantId });
      assembly.evidenceBindings.push({ evidenceId, originalEvidenceId: original.evidenceId, fromVariantId: original.variantId,
        toVariantId: variantId, recordId: original.recordId });
    }
  }
  assembly.sources.push({ key: 'seed:commercial-products', kind: 'seed', varieties: 0, lots: 0, products: HOP_COMMERCIAL_PRODUCTS.length });
  for (const product of HOP_COMMERCIAL_PRODUCTS) variants.push({ variantId: await idFor('product', 'seed:commercial-products', product), scope: 'product',
    recordId: product.id, origin: { kind: 'seed', packPath: 'src/domain/hopDecision/products.ts' },
    material: { id: `product:${product.id}`, name: product.name, form: product.form, product: structuredClone(product) } });
  if (provided.length) {
    variants.push(...provided.filter(variant => variant.scope !== 'variety'));
    assembly.sources.push({ key: 'provided:complete-materials', kind: 'provided', varieties: provided.filter(row => row.scope === 'variety').length,
      lots: provided.filter(row => row.scope === 'lot').length, products: provided.filter(row => row.scope === 'product').length,
      assignments: provided.filter(row => row.scope === 'assignment').length });
  }
  return { variants, basisEvidence: evidence, ...(options.selectedVariantByRecord ? { selectedVariantByRecord: structuredClone(options.selectedVariantByRecord) } : {}), assembly };
}
