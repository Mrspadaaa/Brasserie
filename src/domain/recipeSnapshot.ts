import {
  Batch,
  Recipe,
  RecipeSnapshot,
  YeastSpec,
  MaltIngredient,
  Fermentable,
  HopIngredient
} from '../types';
import { normalizeHop } from './hopStage';
import { snapshotBrewhouse } from './brewPreferences';

/**
 * Normalisation à la LECTURE, et copie figée d'une recette.
 *
 * Deux problèmes distincts, réglés au même endroit parce qu'ils portent sur les
 * mêmes données :
 *
 * 1. **Les anciens enregistrements.** Les brassins et recettes déjà en base
 *    portent `step: '60 min'` et `yeastName: 'SafAle US-05'`. On les traduit à
 *    la lecture, jamais en réécrivant la base : une migration qui touche des
 *    données réelles ne se rejoue pas si elle se trompe.
 *
 * 2. **L'historique.** Sans copie figée, corriger une faute de frappe dans une
 *    recette réécrit rétroactivement ce qu'on croit avoir brassé six mois plus
 *    tôt. C'est `captureSnapshot()` qui fige, au lancement du brassin.
 */

/** Levure ancienne (`yeastName: string`) ramenée à la forme structurée. */
export function yeastFromLegacy(name: string | undefined): YeastSpec | undefined {
  if (!name) return undefined;

  // « LALLEMAND Verdant IPA (2 sachets) » ➔ nom, quantité, unité.
  const qtyMatch = /\((\d+(?:[.,]\d+)?)\s*(sachets?|flacons?|g|mL|L)\)/i.exec(name);
  const lab = /\b(Lallemand|Fermentis|White Labs|Wyeast|Omega|GigaYeast|Imperial)\b/i.exec(name)?.[1];

  return {
    name: (qtyMatch ? name.replace(qtyMatch[0], '') : name).trim(),
    lab,
    ...(qtyMatch ? { qty: Number(qtyMatch[1].replace(',', '.')), unit: /^ml$/i.test(qtyMatch[2]) ? 'mL' : /^l$/i.test(qtyMatch[2]) ? 'L' : qtyMatch[2].replace(/s$/i, '').toLowerCase() } : {})
  };
}

/** Recette relue : houblons typés, levure structurée. Aucun champ inventé. */
export function normalizeRecipe(recipe: Recipe): Recipe {
  const input = recipe.yeast as Omit<YeastSpec, 'qty'> & { qty?: number | string; pitchTemp?: number };
  // Form is optional documentary data, not a version discriminator. Modern
  // partial objects must survive exactly, including an unknown product form.
  const yeast: YeastSpec = !input ? { name: '' }
    : typeof input === 'string' ? yeastFromLegacy(input) ?? { name: '' }
    : typeof input.qty === 'string' || 'pitchTemp' in input ? (() => {
      const { pitchTemp, qty, ...rest } = input;
      const parsed = typeof qty === 'string' ? yeastFromLegacy(`${input.name} (${qty})`) : undefined;
      return { ...rest,
        ...(typeof qty === 'number' ? { qty } : parsed?.qty !== undefined ? { qty: parsed.qty } : {}),
        ...(input.unit ? {} : parsed?.unit ? { unit: parsed.unit } : {}),
        ...(input.pitchTempC !== undefined ? {} : pitchTemp !== undefined ? { pitchTempC: pitchTemp } : {}),
        ...(typeof qty === 'string' && parsed?.qty === undefined ? { notes: [input.notes, `Quantité d’origine : ${qty}`].filter(Boolean).join('\n') } : {}) };
    })() : input as YeastSpec;

  return {
    ...recipe,
    hops: (recipe.hops ?? []).map(normalizeHop),
    // Les recettes enregistrées avant la distinction grain / sucre n'ont que
    // `malts` : tout y était du grain à l'empâtage, on le déclare tel quel.
    fermentables: recipe.fermentables ?? (recipe.malts ?? []).map(asGrain),
    yeast
  };
}

/** Un ancien malt, ramené à la forme typée. */
function asGrain(m: MaltIngredient): Fermentable {
  return { ...m, kind: m.kind ?? 'grain', use: m.use ?? 'empatage' };
}

/** Brassin relu : houblons typés, levure structurée, snapshot normalisé. */
export function normalizeBatch(batch: Batch): Batch {
  return {
    ...batch,
    hops: batch.hops ? batch.hops.map(normalizeHop) : undefined,
    yeast: batch.yeast ?? yeastFromLegacy(batch.yeastName),
    recipeSnapshot: batch.recipeSnapshot
      ? {
          ...batch.recipeSnapshot,
          hops: (batch.recipeSnapshot.hops ?? []).map(normalizeHop),
          fermentables:
            batch.recipeSnapshot.fermentables ??
            (batch.recipeSnapshot.malts ?? []).map(asGrain)
        }
      : undefined
  };
}

/**
 * Fige une recette dans un brassin. Appelé UNE fois, au lancement.
 * Le `sourceRecipeId` garde la provenance ; c'est le snapshot qui fait foi.
 */
export function captureSnapshot(recipe: Recipe): RecipeSnapshot {
  const { id, favorite, batchRef, archivedAt, ...rest } = normalizeRecipe(recipe);
  return {
    ...structuredClone(rest),
    ...(rest.brewhouse ? { brewhouse: snapshotBrewhouse(rest.brewhouse) } : {}),
    sourceRecipeId: id,
    capturedAt: new Date().toISOString()
  };
}

/**
 * Les ingrédients qui font foi pour un brassin : le snapshot d'abord, puis les
 * champs directs des brassins enregistrés avant la refonte.
 */
export function ingredientsOf(batch: Batch): {
  fermentables: Fermentable[];
  hops: HopIngredient[];
  yeast?: YeastSpec;
  volumeL: number;
  source: 'snapshot' | 'batch';
} {
  const snap = batch.recipeSnapshot;
  if (snap) {
    return {
      fermentables: snap.fermentables ?? (snap.malts ?? []).map(asGrain),
      hops: (snap.hops ?? []).map(normalizeHop),
      yeast: snap.yeast,
      volumeL: snap.volumeL || batch.volumeL,
      source: 'snapshot'
    };
  }
  return {
    fermentables: (batch.malts ?? []).map(asGrain),
    hops: (batch.hops ?? []).map(normalizeHop),
    yeast: batch.yeast ?? yeastFromLegacy(batch.yeastName),
    volumeL: batch.volumeL,
    source: 'batch'
  };
}
