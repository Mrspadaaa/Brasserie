import React from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { readYeastRecipeDesign, classifyYeastRecipeDesignChange, YEAST_RECIPE_GOAL_LABELS } from '../domain/yeastRecipeDesign';
const number = (n?: number | null, digits = 1) => Number.isFinite(n)
  ? n!.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';

/** Closed overview keeps the adopted intent separate from today's actual setpoint.
 * This summary has no workshop, catalogue picker or chart dependency. */
export function YeastRecipeHeading({ recipe }: { recipe: TrialRecipe }) {
  const intent = readYeastRecipeDesign(recipe);
  const primary = recipe.fermentation?.find(s => s.kind === 'primaire');
  const change = intent ? classifyYeastRecipeDesignChange(recipe, intent) : 'unchanged';
  const changeLabel = change === 'settings' ? 'réglages modifiés' : change === 'documentary' ? 'fiche actualisée' : '';
  return <span>{recipe.yeast.name || 'Souche à préciser'} · {recipe.yeast.qty > 0 && recipe.yeast.unit ? `${number(recipe.yeast.qty, 20)} ${recipe.yeast.unit}` : 'quantité à préciser'}{intent && <span className="block">Objectif : {intent.goalExplicit === false ? 'non exprimé' : YEAST_RECIPE_GOAL_LABELS[intent.goal]} · primaire {number(primary?.tempC)} °C{changeLabel ? ` · ${changeLabel}` : ''}</span>}</span>;
}
