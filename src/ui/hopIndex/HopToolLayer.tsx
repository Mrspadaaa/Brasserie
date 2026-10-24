/**
 * Couche provisoire d'un outil houblons v4 (#162).
 *
 * Elle prouve la pile : posée par-dessus le wizard ou la recette, qui restent montés dessous. Elle ne porte AUCUN
 * contenu métier : les écrans de la maquette viendront ici (T12), sous le drapeau `hopV4`. Tant qu'il est éteint,
 * seul le crochet de développement (`devHook.ts`) l'ouvre.
 */
import React from 'react';
import { PageShell } from '../../pages/PageShell';
import type { LayerRoute } from '../../pages/useFullScreenRoute';

export type HopToolRoute = Exclude<LayerRoute, { view: 'hopV55' }>;

const TITLES: Record<HopToolRoute['view'], string> = {
  hopBeer: 'Ma bière',
  hopSuggest: 'Suggérer',
  hopCompare: 'Comparer',
  hopTiming: 'Dryhopper',
  hopSubstitute: 'Substituer'
};

export const hopToolTitle = (route: HopToolRoute) =>
  route.view === 'hopTiming' && route.step === 'yeast' ? 'Levure' : TITLES[route.view];

export default function HopToolLayer({ route, level, onClose }: { route: HopToolRoute; level: number; onClose: () => void }) {
  return (
    <PageShell title={hopToolTitle(route)} subtitle={`Outil houblons · niveau ${level}`} onClose={onClose}>
      <div data-hop-tool-layer={route.view} data-hop-tool-level={level} className="space-y-1 text-sm text-cave-200">
        <p>Écran provisoire : l’outil v4 viendra ici.</p>
        <p className="text-xs text-cave-400">{route.recipeId ? `Recette ${route.recipeId}` : 'Brouillon de la recette ouverte dessous'}</p>
      </div>
    </PageShell>
  );
}
