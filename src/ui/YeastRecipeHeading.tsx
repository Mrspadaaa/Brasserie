import React from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { uniteAccordee } from '../domain/fermentables/parts';
import { readYeastSupply } from '../../functions/src/yeastSupplySchema';
import bootstrap from '../data/yeastSupplyBootstrap.json';
import { doseDeLaLevure } from './etapeLevure/dose';
import { readYeastRecipeDesign, classifyYeastRecipeDesignChange, YEAST_RECIPE_GOAL_LABELS } from '../domain/yeastRecipeDesign';
const number = (n?: number | null, digits = 1) => Number.isFinite(n)
  ? n!.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';

const approvisionnement = readYeastSupply(bootstrap);

/**
 * A-b (verdict final) : quand aucune dose n'est saisie mais que le produit et le volume donnent une PLAGE de sachets (#132 : « 2–3 sachets »), la plage
 * se montre, jamais son milieu. Sans produit connu : rien (l'inconnu n'est jamais 0 ni une plage inventée).
 */
export function doseConseillee(recipe: TrialRecipe): string | null {
  if (!approvisionnement) return null;
  try {
    const { yeast, conseil } = doseDeLaLevure(recipe, approvisionnement);
    const packs = conseil.packs;
    if (!packs || conseil.stale || !(packs.min > 0)) return null;
    const mot = yeast.pitching?.product?.form === 'sèche' ? 'sachet' : 'pack';
    const nb = packs.min === packs.max ? number(packs.min, 0) : `${number(packs.min, 0)}–${number(packs.max, 0)}`;
    return `${nb} ${mot}${packs.max > 1 ? 's' : ''}`;
  } catch { return null; }
}

/** Closed overview keeps the adopted intent separate from today's actual setpoint.
 * This summary has no workshop, catalogue picker or chart dependency. */
export function YeastRecipeHeading({ recipe }: { recipe: TrialRecipe }) {
  const intent = readYeastRecipeDesign(recipe);
  const primary = recipe.fermentation?.find(s => s.kind === 'primaire');
  const change = intent ? classifyYeastRecipeDesignChange(recipe, intent) : 'unchanged';
  const changeLabel = change === 'settings' ? 'réglages modifiés' : change === 'documentary' ? 'fiche actualisée' : '';
  return <span>{recipe.yeast.name || 'Souche à préciser'} · {recipe.yeast.qty > 0 && recipe.yeast.unit ? `${number(recipe.yeast.qty, 20)} ${uniteAccordee(recipe.yeast.unit, recipe.yeast.qty)}` : (doseConseillee(recipe) ?? 'quantité à préciser')}{intent && <span className="block">Objectif : {intent.goalExplicit === false ? 'non exprimé' : YEAST_RECIPE_GOAL_LABELS[intent.goal]} · primaire {number(primary?.tempC)} °C{changeLabel ? ` · ${changeLabel}` : ''}</span>}</span>;
}
