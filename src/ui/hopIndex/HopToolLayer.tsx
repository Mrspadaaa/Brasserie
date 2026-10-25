/**
 * Couche provisoire d'un outil houblons v4 (#162).
 *
 * Elle prouve la pile : posée par-dessus le wizard ou la recette, qui restent montés dessous. Elle ne porte AUCUN
 * contenu métier : les écrans de la maquette viendront ici (T12), sous le drapeau `hopV4`. Tant qu'il est éteint,
 * seul le crochet de développement (`devHook.ts`) l'ouvre.
 */
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { PageShell } from '../../pages/PageShell';
import { hopV4Enabled } from './flags';
import type { LayerRoute } from '../../pages/useFullScreenRoute';
import { chargerOutils, outilsCharges, type Outils } from './chargement';

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

/** Les outils (moteur, données, client), chargés à la demande. Déjà préchargés : disponibles au premier rendu. */
export function useOutils(): { outils: Outils | null; echec: boolean; reessayer: () => void } {
  const [outils, setOutils] = useState<Outils | null>(outilsCharges);
  const [echec, setEchec] = useState(false);
  const [essai, setEssai] = useState(0);
  useEffect(() => {
    if (outils) return;
    let vivant = true;
    setEchec(false);
    chargerOutils().then(o => { if (vivant) setOutils(o); }, () => { if (vivant) setEchec(true); });
    return () => { vivant = false; };
  }, [outils, essai]);
  return { outils, echec, reessayer: () => setEssai(n => n + 1) };
}

// Comparer (T15b, #174) : l'écran cmc2k, son choix, chargé à la demande et seulement drapeau hopV4 allumé.
const EcranComparer = lazy(() => import('./comparer/EcranApp'));
const comparerActif = hopV4Enabled();
// Suggérer (T13, #173) : l'écran q2b, son choix, chargé à la demande, drapeau hopV4 allumé seulement.
const EcranSuggerer = lazy(() => import('./suggerer/EcranApp'));

// Dryhopper et Levure (T15c, #174) : l'écran p4b2f, son choix, et la feuille « Souche », chargés à la demande, drapeau hopV4 allumé seulement.
const EcranTiming = lazy(() => import('./dryhopper/EcranApp'));
// Substituer (T15c, #174) : l'écran u4, son choix, chargé à la demande, drapeau hopV4 allumé seulement.
const EcranSubstituer = lazy(() => import('./substituer/EcranApp'));

export default function HopToolLayer({ route, level, onClose }: { route: HopToolRoute; level: number; onClose: () => void }) {
  if (route.view === 'hopTiming' && comparerActif) {
    const titre = hopToolTitle(route);
    return (
      <Suspense fallback={<PageShell title={titre} onClose={onClose}><p data-hop-tool-layer="hopTiming" data-hop-tool-level={level} className="text-xs text-cave-400">Ouverture de {titre}…</p></PageShell>}>
        <EcranTiming additionId={route.additionId} {...(route.step ? { step: route.step } : {})} recipeId={route.recipeId} onClose={onClose} />
      </Suspense>
    );
  }
  if (route.view === 'hopSubstitute' && comparerActif) {
    return (
      <Suspense fallback={<PageShell title="Substituer" onClose={onClose}><p data-hop-tool-layer="hopSubstitute" data-hop-tool-level={level} className="text-xs text-cave-400">Ouverture de Substituer…</p></PageShell>}>
        <EcranSubstituer hopKey={route.hopKey} recipeId={route.recipeId} onClose={onClose} />
      </Suspense>
    );
  }
  if (route.view === 'hopCompare' && comparerActif) {
    return (
      <Suspense fallback={<PageShell title="Comparer" onClose={onClose}><p data-hop-tool-layer="hopCompare" data-hop-tool-level={level} className="text-xs text-cave-400">Ouverture de Comparer…</p></PageShell>}>
        <EcranComparer houblons={route.hops} pin={route.pinned} recipeId={route.recipeId} onClose={onClose} />
      </Suspense>
    );
  }
  if (route.view === 'hopSuggest' && comparerActif) {
    return (
      <Suspense fallback={<PageShell title="Suggérer" onClose={onClose}><p data-hop-tool-layer="hopSuggest" data-hop-tool-level={level} className="text-xs text-cave-400">Ouverture de Suggérer…</p></PageShell>}>
        <EcranSuggerer recipeId={route.recipeId} onClose={onClose} />
      </Suspense>
    );
  }
  return <CoucheProvisoire route={route} level={level} onClose={onClose} />;
}

function CoucheProvisoire({ route, level, onClose }: { route: HopToolRoute; level: number; onClose: () => void }) {
  const { outils, echec, reessayer } = useOutils();
  return (
    <PageShell title={hopToolTitle(route)} subtitle={`Outil houblons · niveau ${level}`} onClose={onClose}>
      <div data-hop-tool-layer={route.view} data-hop-tool-level={level} data-hop-tool-moteur={outils ? 'pret' : echec ? 'echec' : 'attente'}
        className="space-y-1 text-sm text-cave-200">
        <p>Écran provisoire : l’outil v4 viendra ici.</p>
        {outils && <p className="text-xs text-cave-400">Moteur v4 chargé ({Object.keys(outils.moteur).length} fonctions et tables ; données du prototype, non réelles).</p>}
        {echec && <div role="alert" className="text-xs text-cave-200">
          <p>Les outils ne sont pas encore chargés. Vérifie la connexion, puis réessaie.</p>
          <button type="button" className="mt-1 min-h-touch rounded-control bg-ebc-straw px-2 text-cave-950" onClick={reessayer}>Réessayer</button>
        </div>}
        <p className="text-xs text-cave-400">{route.recipeId ? `Recette ${route.recipeId}` : 'Brouillon de la recette ouverte dessous'}</p>
      </div>
    </PageShell>
  );
}
