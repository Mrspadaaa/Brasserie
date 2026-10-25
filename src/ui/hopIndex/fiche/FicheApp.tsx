// La fiche d'un houblon dans l'app (T13, #173) : l'hôte de l'app. La feuille (Sheet de l'app) s'ouvre par-dessus l'écran qui
// la demande (l'étape Houblons du wizard, Comparer, Suggérer) par l'appui long sur un nom ; la fermer revient à cet écran, intact.
// Les houblons retenus sont ceux de ./comparaison.ts ; « Comparer » et « Substituts › » empilent la couche de l'outil (pile de
// l'app, ouvrirCouche) sur le brouillon `draftId`, après avoir fermé la feuille.
// L'écran qui la monte pose d'abord son brouillon (`ContexteFicheApp`) ; la fiche, un composant stable (`FicheDeLApp`), le lit.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { RecetteParcours } from '../parcours/types';
import { ouvrirCouche } from '../ouvrirCouche';
import { basculerComparaison, useComparaisonRetenue } from './comparaison';
import { FicheHoublon } from './FicheHoublon';
import { HoteFicheProvider, type HoteFiche, type RouteFiche } from './hote';

export interface BrouillonFiche {
  /** La recette ouverte dessous (le brouillon). */
  recette: RecetteParcours;
  /** L'identifiant du brouillon visé par les couches que la fiche ouvre. */
  draftId: string;
}

const Ctx = createContext<BrouillonFiche | null>(null);

export function ContexteFicheApp({ valeur, children }: { valeur: BrouillonFiche; children: ReactNode }) {
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

/** La fiche d'un houblon (clé du moteur), sur le brouillon posé par `ContexteFicheApp`. `onFermer` ferme la feuille. */
export function FicheDeLApp({ houblon, onFermer }: { houblon: string; onFermer?: () => void }) {
  const b = useContext(Ctx);
  if (!b) throw new Error('FicheDeLApp hors de ContexteFicheApp');
  const aComparer = useComparaisonRetenue();
  const { recette, draftId } = b;
  const valeur = useMemo<HoteFiche>(() => ({
    recette, visee: {}, aComparer, basculerComparaison,
    aller: (r: RouteFiche) => {
      onFermer?.();
      if (r.ecran === 'comparer') ouvrirCouche({ view: 'hopCompare', recipeId: draftId, hops: r.houblons });
      else ouvrirCouche({ view: 'hopSubstitute', recipeId: draftId, hopKey: r.houblon });
    },
  }), [recette, aComparer, draftId, onFermer]);
  return <HoteFicheProvider valeur={valeur}><FicheHoublon key={houblon} cle={houblon} onFermer={onFermer ?? (() => {})} /></HoteFicheProvider>;
}
