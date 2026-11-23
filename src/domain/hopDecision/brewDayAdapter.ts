import type { BrewDayState, HopIngredient } from '../../types';
import { bindHopRecipe } from './recipeAdapter';
import { hopDecisionReference } from './measurements';
import type { HopDecisionMaterial, HopProcessStage, HopUse } from './types';

/** Read-only view of the actual journal. This adapter never edits a launched batch. */
export function bindHopBrewDay(input: {
  programId: string;
  recipeSnapshot: { volumeL: number; hops: HopIngredient[] };
  journal: BrewDayState;
  stage: HopProcessStage;
  wortGravity: number | null;
  materials: HopDecisionMaterial[];
  materialByIndex?: Record<number, string>;
  useByIndex?: Record<number, HopUse>;
}) {
  const assumptions: string[] = [];
  const performed: number[] = [];
  const materialByIndex = { ...input.materialByIndex };
  const hops = input.recipeSnapshot.hops.map((original, index) => {
    const event = input.journal.additions?.[`hop-${index}`];
    if (!event) return structuredClone(original);
    const confirmed = typeof event.doneAt === 'number' && Number.isFinite(event.doneAt) && event.doneAt >= 0;
    if (confirmed) performed.push(index);
    const unit = event.unit ?? 'g';
    const grams = Number.isFinite(event.amount) && event.amount >= 0 && ['g', 'kg'].includes(unit)
      ? event.amount * (unit === 'kg' ? 1000 : 1) : Number.NaN;
    if (!Number.isFinite(grams)) assumptions.push(`hop-${index} : quantité du journal non convertible en grammes ; aucune masse prévue reprise à sa place.`);
    if (!event.unit) assumptions.push(`hop-${index} : unité g du contrat d’ajout houblon historique, non fournie dans le journal.`);
    const hop: HopIngredient = { ...original, weightG: grams };
    if (confirmed) {
      // A confirmed addition does not confirm its intended contact or temperature.
      hop.timeMin = undefined; hop.aromaContactHours = undefined;
      hop.tempC = undefined; hop.aromaTemperatureC = undefined;
      assumptions.push(`hop-${index} : contact et température prévus conservés dans le snapshot, sans être déclarés mesurés.`);
    }
    if (event.temperatureC !== undefined) {
      if (Number.isFinite(event.temperatureC) && event.temperatureC >= -273.15) {
        hop.tempC = event.temperatureC; hop.aromaTemperatureC = event.temperatureC;
      } else {
        hop.tempC = undefined; hop.aromaTemperatureC = undefined;
        assumptions.push(`hop-${index} : température journalisée invalide ; aucune température prévue reprise.`);
      }
    }
    if (event.replacement) {
      hop.name = event.replacement.name;
      hop.hopVarietyId = undefined; hop.hopLotId = undefined; hop.stockItemRef = undefined; hop.alpha = Number.NaN;
      delete materialByIndex[index];
      assumptions.push(`hop-${index} : remplacement journalisé ; identité et alpha de l’ancienne matière non transférés.`);
    }
    if (confirmed && hop.stage === 'boil' && Number.isFinite(input.journal.boilStartedAt) && Number.isFinite(input.journal.boilFinishedAt)) {
      const duration = (input.journal.boilFinishedAt! - Math.max(event.doneAt!, input.journal.boilStartedAt!)) / 60000;
      if (duration >= 0) { hop.timeMin = duration; hop.aromaContactHours = duration / 60; }
      else { hop.timeMin = undefined; hop.aromaContactHours = undefined; assumptions.push(`hop-${index} : chronologie d’ébullition contradictoire ; contact laissé inconnu.`); }
    }
    else if (confirmed && hop.stage === 'boil') assumptions.push(`hop-${index} : horodatages de contact incomplets ; durée réelle inconnue.`);
    return hop;
  });
  const binding = bindHopRecipe({ id: input.programId, volumeL: input.recipeSnapshot.volumeL, hops }, {
    materials: input.materials, materialByIndex, useByIndex: input.useByIndex, performedIndices: performed,
    stage: input.stage, revision: input.journal.revision ?? 0, wortGravity: input.wortGravity,
  });
  return { ...binding, assumptions: [...binding.assumptions, ...assumptions],
    journalReference: hopDecisionReference(input.journal), recipeSnapshotReference: hopDecisionReference(input.recipeSnapshot),
    sourceJournal: structuredClone(input.journal), sourceRecipeSnapshot: structuredClone(input.recipeSnapshot),
    scope: 'batch-read-only' as const };
}
