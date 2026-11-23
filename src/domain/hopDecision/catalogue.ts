import type { HopLot, HopProductForm, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopCommercialProduct, HopDecisionMaterial } from './types';

export interface HopMaterialAssignment {
  id: string;
  varietyId?: string;
  lotId?: string;
  productId?: string;
  name: string;
  form: HopProductForm;
  stockItemRef?: string;
  availableGrams?: number | null;
}

/** Catalogue assembly only; an association with a product or stock is always explicit. */
export function buildHopDecisionCatalogue(input: {
  varieties: HopVariety[]; lots?: HopLot[]; products?: HopCommercialProduct[]; assignments?: HopMaterialAssignment[];
}): HopDecisionMaterial[] {
  const varieties = new Map(input.varieties.map(v => [v.id, v]));
  const lots = new Map((input.lots ?? []).map(l => [l.id, l]));
  const products = new Map((input.products ?? []).map(p => [p.id, p]));
  const documentary: HopDecisionMaterial[] = [
    ...input.varieties.map(variety => ({ id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety })),
    ...(input.lots ?? []).map(lot => ({ id: `lot:${lot.id}`, name: lot.name, form: lot.form, lot, variety: varieties.get(lot.varietyId) }))
  ];
  const assigned = (input.assignments ?? []).map(assignment => {
    const lot = assignment.lotId ? lots.get(assignment.lotId) : undefined;
    const variety = varieties.get(assignment.varietyId ?? lot?.varietyId ?? '');
    const product = assignment.productId ? products.get(assignment.productId) : undefined;
    if (assignment.varietyId && !variety || assignment.lotId && !lot || assignment.productId && !product) throw Error('Une référence explicite de matière est introuvable.');
    if (lot && variety && lot.varietyId !== variety.id || product && product.form !== assignment.form || lot && lot.form !== 'unknown' && lot.form !== assignment.form) throw Error('Lot, variété, forme ou produit commercial contradictoires.');
    if (lot?.referenceOnly && (assignment.stockItemRef || assignment.availableGrams != null)) throw Error('Un échantillon documentaire ne peut pas être associé au stock réel.');
    return { ...assignment, variety, lot, product };
  });
  const result = [...documentary, ...assigned];
  if (new Set(result.map(m => m.id)).size !== result.length) throw Error('Identité de matière dupliquée.');
  return result;
}

/** Bundled, offline references. Saved IDs, including archived rows, override their seeds. */
export async function loadHopDecisionReferences(saved: { varieties?: HopVariety[]; lots?: HopLot[] } = {}) {
  const [manufacturer, guide, styles, studies, trials, publicLots] = await Promise.all([
    import('../../data/hopManufacturerBootstrap.json'), import('../../data/hopGuideVarietyBootstrap.json'),
    import('../../data/hopStyleVarietyBootstrap.json'), import('../../data/hopStudyBootstrap.json'),
    import('../../data/hopTrialBootstrap.json'), import('../../data/hopPublicLotBootstrap.json')
  ]);
  const varieties = [...new Map([...manufacturer.default.hopVarieties, ...guide.default.hopVarieties,
    ...styles.default.hopVarieties, ...studies.default.hopVarieties, ...trials.default.hopVarieties,
    ...publicLots.default.hopVarieties, ...saved.varieties ?? []].map(v => [v.id, v])).values()] as HopVariety[];
  const lots = [...new Map([...studies.default.hopLots, ...publicLots.default.hopLots, ...saved.lots ?? []].map(l => [l.id, l])).values()] as HopLot[];
  return { varieties, lots };
}
