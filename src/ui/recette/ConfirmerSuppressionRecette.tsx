// La feuille de confirmation de « Supprimer la recette », une seule pour les trois portes (16.11, 36) : la page de la recette,
// la fiche du carnet et l'éditeur (menu du « + »). Même titre, même phrase, mêmes boutons de 44 px : un geste qui détruit se
// reconnaît partout pareil.
import React from 'react';
import type { Batch, Recipe } from '../../types';
import { StorageService } from '../../services/storage';
import { formatLitres } from '../../domain/recipeMetrics';
import { ConfirmSheet } from '../Sheet';

/** Les brassins lancés depuis cette recette : chacun garde sa copie figée. */
export const brassinsDeLaRecette = (recipe: Recipe, batches: Batch[]): Batch[] =>
  batches.filter((b) => b.recipeRef === recipe.id || b.recipeSnapshot?.sourceRecipeId === recipe.id);

const lireBrassins = (): Batch[] => {
  try { return StorageService.getBatches(); } catch { return []; }
};

export function ConfirmerSuppressionRecette({ recipe, batches, open, onClose, onConfirm }: {
  recipe: Recipe | null | undefined;
  /** Absents (l'éditeur ne les reçoit pas) : lus au stockage. */
  batches?: Batch[];
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!recipe) return null;
  const lies = open ? brassinsDeLaRecette(recipe, batches ?? lireBrassins()).length : 0;
  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title="Supprimer cette recette ?"
      gros
      // Le style n'est dit que s'il diffère du nom (« American IPA — American IPA, 30 L » répétait le nom).
      what={`${recipe.name} — ${[recipe.style && recipe.style.trim() !== recipe.name.trim() ? recipe.style : '', formatLitres(recipe.volumeL)].filter(Boolean).join(', ')}`}
      consequence={
        lies > 0
          ? `${lies} brassin${lies > 1 ? 's ont' : ' a'} été lancé${lies > 1 ? 's' : ''} depuis cette recette. Chacun garde sa propre copie figée : leur historique reste intact.`
          : 'La recette quitte le catalogue. La suppression est journalisée.'
      }
      confirmLabel="Supprimer la recette"
      onConfirm={onConfirm}
    />
  );
}
