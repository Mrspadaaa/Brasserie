import type { Recipe } from '../types';
import type {
  YeastOffer, YeastPitchingWort, YeastProduct, YeastStarterProtocol, YeastSupply
} from '../../functions/src/yeastSupplySchema';
import {
  evaluateYeastPitching, rankYeastOffers, yeastOfferState, type YeastPitchingAdvice
} from './yeastPitching';

export interface YeastSupplyComparisonRequest {
  supply: YeastSupply;
  referenceId: string;
  alternativeReferenceIds?: string[];
  /** One shared wort observation or estimate is copied to every product row. */
  wort: YeastPitchingWort;
  /** Required only to validate a recipe-estimated wort's existing basis. */
  recipeContext?: Pick<Recipe, 'volumeL' | 'fermentables' | 'efficiencyPct'>;
  /** Inject time for reproducible offer freshness; defaults once per comparison. */
  now?: number;
}

export type YeastSupplyComparisonPitching = Pick<YeastPitchingAdvice,
  'method' | 'range' | 'unit' | 'packs' | 'surplus' | 'conditions' | 'source' | 'reasons' | 'stale'>;

export interface YeastSupplyComparisonOffer {
  offer: YeastOffer;
  state: ReturnType<typeof yeastOfferState>;
}

export interface YeastSupplyComparisonRow {
  /** Exact product/format id. Variants for one strain remain separate rows. */
  productId: string;
  referenceId: string;
  referenceRole: 'selected-reference' | 'alternative-reference';
  product: YeastProduct;
  pitching: YeastSupplyComparisonPitching;
  preparationProtocol?: YeastStarterProtocol;
  offers: YeastSupplyComparisonOffer[];
}

export interface YeastSupplyComparison {
  referenceId: string;
  alternativeReferenceIds: string[];
  /** The one input wort used by every row; no row-specific wort is synthesized. */
  wort: YeastPitchingWort;
  rows: YeastSupplyComparisonRow[];
  unmatchedReferenceIds: string[];
}

const adviceFor = (
  product: YeastProduct,
  wort: YeastPitchingWort,
  recipeContext?: YeastSupplyComparisonRequest['recipeContext']
): YeastSupplyComparisonPitching => {
  // Create a clean evaluation context per candidate. The selected recipe's
  // quantity, lot, stock link, rate, and preparation never flow to alternatives.
  // Recipe fields are only used by evaluateYeastPitching to verify an existing
  // recipe-estimate basis; they do not produce or alter the shared wort.
  const recipe = {
    volumeL: recipeContext?.volumeL ?? wort.volumeL ?? 0,
    fermentables: recipeContext?.fermentables ?? [],
    efficiencyPct: recipeContext?.efficiencyPct ?? 0,
    yeast: {
      name: product.label,
      hopIndexId: product.referenceId,
      form: product.form,
      qty: 0,
      unit: product.form === 'sèche' ? 'g' : 'pack',
      pitching: {
        version: 1 as const,
        product: structuredClone(product),
        wort: structuredClone(wort)
      }
    }
  } as Parameters<typeof evaluateYeastPitching>[0];
  const advice = evaluateYeastPitching(recipe);
  const { method, range, unit, packs, surplus, conditions, source, reasons, stale } = advice;
  return { method, range, unit, packs, surplus, conditions, source, reasons, stale };
};

/** Compare documented product variants under one already-qualified wort. */
export function compareYeastSupply(request: YeastSupplyComparisonRequest): YeastSupplyComparison {
  const now = request.now ?? Date.now();
  const alternatives = [...new Set((request.alternativeReferenceIds ?? []).filter(id => id !== request.referenceId))];
  const requestedReferences = [request.referenceId, ...alternatives];
  const referenceOrder = new Map(requestedReferences.map((id, index) => [id, index]));
  const products = request.supply.products
    .filter(product => referenceOrder.has(product.referenceId))
    .sort((a, b) => referenceOrder.get(a.referenceId)! - referenceOrder.get(b.referenceId)! || a.label.localeCompare(b.label, 'fr'));
  const foundReferences = new Set(products.map(product => product.referenceId));

  const rows = products.map(product => {
    const offers = rankYeastOffers(
      request.supply.offers.filter(offer => offer.productId === product.id), now
    ).map(offer => ({ offer: structuredClone(offer), state: yeastOfferState(offer, now) }));
    return {
      productId: product.id,
      referenceId: product.referenceId,
      referenceRole: product.referenceId === request.referenceId ? 'selected-reference' as const : 'alternative-reference' as const,
      product: structuredClone(product),
      pitching: adviceFor(product, request.wort, request.recipeContext),
      ...(product.starter ? { preparationProtocol: structuredClone(product.starter) } : {}),
      offers
    };
  });

  return {
    referenceId: request.referenceId,
    alternativeReferenceIds: alternatives,
    wort: structuredClone(request.wort),
    rows,
    unmatchedReferenceIds: requestedReferences.filter(id => !foundReferences.has(id))
  };
}
