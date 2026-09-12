import React from 'react';
import type { Recipe, RecipeSnapshot } from '../../types';
import { Button } from '../../components/ui/Button';
import { HopRecipeSimulationPanel } from './HopRecipeSimulationPanel';
import { HopRecipeWorkbench } from './HopRecipeWorkbench';

/** Finished recipe report: no draft, no writes. Editing is the parent's explicit route. */
export function HopRecipePanel({ recipe, onEdit }: {
  recipe: Recipe | RecipeSnapshot; batchId?: string; onEdit?: () => void;
}) {
  return <section className="space-y-4" aria-label="Potentiel aromatique de la recette">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-cave-400">{recipe.yeast?.name || 'Levure à choisir'} · lecture seule</p>{onEdit && <Button type="button" onClick={onEdit}>Modifier dans l’atelier de recette</Button>}</div>
    <HopRecipeWorkbench recipe={recipe} />
    <details><summary className="min-h-touch cursor-pointer text-[13px] text-cave-200">Analyses aromatiques avancées</summary><HopRecipeSimulationPanel recipe={recipe} readOnly /></details>
  </section>;
}
