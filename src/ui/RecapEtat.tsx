import React from 'react';
import type { RecipeFieldIssue, RecipeReadiness } from '../domain/recipeValidation';

/**
 * Le bandeau d'état de la fiche de brassage (Récapitulatif).
 *
 * VI-7 (rejeu b47cd90b n° 7) : « 1 valeur à corriger avant enregistrement » en rouge ne disait ni laquelle ni où, sections fermées : le brasseur ouvrait tout
 * pour trouver. Chaque valeur à corriger est maintenant écrite (le message de la validation) avec un bouton qui mène à son champ, à son étape.
 * Un compte seul ne suffit pas non plus à « À compléter » : ses repères restent comptés, sans liste (ils n'empêchent pas d'enregistrer).
 */
export const RecapEtat: React.FC<{
  readiness: RecipeReadiness;
  /** Le nom de l'étape d'un champ. */
  etape: (issue: RecipeFieldIssue) => string;
  /** Mène au champ de la valeur à corriger. */
  onCorriger: (issue: RecipeFieldIssue) => void;
}> = ({ readiness, etape, onCorriger }) => {
  const invalide = readiness.status === 'invalid';
  const incomplet = readiness.status === 'incomplete';
  return (
    <div role="status" aria-label="État de la recette"
      className={`px-2 py-1 text-xs border rounded-control ${invalide ? 'border-alert-strong/50 text-alert-strong' : incomplet ? 'border-attention/50 text-attention' : 'border-hop/50 text-cave-200'}`}>
      {invalide ? `${readiness.invalid.length} valeur${readiness.invalid.length > 1 ? 's' : ''} à corriger avant enregistrement`
        : incomplet ? `À compléter · ${readiness.missing.length} repère${readiness.missing.length > 1 ? 's' : ''} avant brassin · enregistrement possible`
        : 'Données prêtes pour le brassin'}
      {invalide && (
        <ul data-role="valeurs-a-corriger" className="mt-1 space-y-0.5">
          {readiness.invalid.map(issue => (
            <li key={`${issue.field}|${issue.message}`} className="flex flex-wrap items-baseline gap-x-2">
              <span className="min-w-0 break-words">{issue.message || issue.field}</span>
              <button type="button" onClick={() => onCorriger(issue)} className="shrink-0 min-h-touch-sm underline underline-offset-2">
                Corriger · {etape(issue)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
