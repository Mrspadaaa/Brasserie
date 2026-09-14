import React from 'react';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { buildYeastCompanion } from '../domain/yeastCompanion';
import { BrewSheet, type BrewSheetProps } from './BrewSheet';

type Props = Omit<BrewSheetProps, 'reviewData'> & {
  recipeForCompanion: TrialRecipe;
  knowledge: HopKnowledge[];
  reviewData?: Record<string, unknown>;
};

/**
 * Keeps the companion builder with the recap chunk. The editor can therefore
 * open its first step without downloading the full yeast reference library.
 */
export function BrewSheetWithCompanion({ recipeForCompanion, knowledge, reviewData, ...props }: Props) {
  return <BrewSheet
    {...props}
    reviewData={{
      ...(reviewData ?? {}),
      yeastContext: buildYeastCompanion(recipeForCompanion, knowledge, { maxAlternatives: 3 })
    }}
  />;
}
