// Ma bière dans l'app (p6, #174) : l'hôte de l'écran de l'onglet Ma bière (base v4.10, son choix : « Ça aussi ») pour la pile des
// outils, à la place de l'écran provisoire (HopToolLayer.tsx). Un seul code d'écran (./index.tsx), un hôte ; ici le brouillon du
// wizard (pont comparer/porte.ts), les données du brasseur (useHopData : stock, dégustation, catalogue du moteur), la visée posée
// (parcours/visee.ts, lue ensuite par Suggérer et la fiche) et les couches de la pile. Chargé à la demande (HopToolLayer), jamais
// au démarrage ; les calculs (voies d'une visée) passent par le client des calculs hors fil (parcours/useCalcul.ts). Rien n'est
// écrit dans la recette : Ma bière lit, et pose une visée en mémoire. Même principe que suggerer/EcranApp.tsx.
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { PageShell } from '../../../pages/PageShell';
import { toHopRecipe } from '../../../domain/hopIndex/v4/recipeConversion';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { configurerDonnees } from '../parcours/adaptateur';
import { abonnerVisee, lireVisee, poserVisee } from '../parcours/visee';
import { useComparaisonRetenue } from '../fiche/comparaison';
import { ouvrirCouche } from '../ouvrirCouche';
import { useHopData } from '../useHopData';
import { usePorteEtape, type PorteEtape } from '../comparer/porte';
import { CadreApp, CadreBiereCtx } from './CadreApp';
import { HoteBiereProvider, type HoteBiere, type RouteBiere } from './hote';
import Biere from './index';

export interface EcranBiereProps {
  /** L'identifiant du brouillon visé par la route ; absent : le brouillon ouvert dessous. */
  recipeId?: string;
  onClose: () => void;
}

function SansBrouillon({ onClose }: { onClose: () => void }) {
  return (
    <PageShell title="Ma bière" onClose={onClose}>
      <p data-role="biere-sans-brouillon" className="text-sm text-cave-200">Ma bière lit le brouillon de l’étape Houblons : ouvre-la depuis la recette en cours.</p>
    </PageShell>
  );
}

export default function EcranBiereApp(p: EcranBiereProps) {
  const porte = usePorteEtape();
  if (!porte || (p.recipeId && p.recipeId !== porte.draftId)) return <SansBrouillon onClose={p.onClose} />;
  return <Contenu onClose={p.onClose} porte={porte} />;
}

/** Le brouillon auquel la visée posée appartient : une visée ne passe pas d'une recette à l'autre (une valeur d'une autre bière
 * ne se lit jamais sur celle-ci). */
let viseeDe: string | null = null;

function Contenu({ onClose, porte }: { onClose: () => void; porte: PorteEtape }) {
  const { recipe, boilOg, draftId } = porte;
  if (viseeDe !== draftId) { viseeDe = draftId; poserVisee(null); }
  const visee = useSyncExternalStore(abonnerVisee, lireVisee, lireVisee);
  const donnees = useHopData(recipe);
  // La conversion ne se refait que si la porte change d'identité (son contenu lu change : porte.ts) ou le stock.
  const conversion = useMemo(() => toHopRecipe(recipe, {
    ...(boilOg === undefined ? {} : { boilOg }),
    alphaDuStock: (cle: string) => donnees.stock.find((s) => s.key === cle)?.alpha ?? null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [porte, donnees.stock]);

  // Les données du brasseur entrent dans l'adaptateur avant le premier calcul (comme l'étape Houblons et Suggérer).
  const posees = useRef<{ stock: unknown; degustation: unknown; recette: unknown } | null>(null);
  if (!posees.current || posees.current.stock !== donnees.stock || posees.current.degustation !== donnees.degustation || posees.current.recette !== conversion) {
    const tasting = donnees.degustation;
    const degustee = conversion.recette;
    configurerDonnees({ stock: donnees.stock, degustation: tasting ? { tasting, recette: () => structuredClone(degustee) } : null });
    posees.current = { stock: donnees.stock, degustation: donnees.degustation, recette: conversion };
  }

  const recette = conversion.recette;
  const comparaison = useComparaisonRetenue();
  const fixerVisee = useCallback((f: FamilyId, niveau: number | null) => {
    const v = { ...lireVisee() };
    if (niveau == null) delete v[f]; else v[f] = niveau;
    poserVisee(v);
  }, []);
  const aller = useCallback((r: RouteBiere) => {
    if (r.ecran === 'suggerer') ouvrirCouche({ view: 'hopSuggest', recipeId: draftId });
    else ouvrirCouche({ view: 'hopCompare', recipeId: draftId, hops: r.houblons });
  }, [draftId]);

  const valeur = useMemo<HoteBiere>(() => ({ recette, visee, fixerVisee, aComparer: comparaison, aller, Cadre: CadreApp }),
    [recette, visee, fixerVisee, comparaison, aller]);
  const cadre = useMemo(() => ({
    fermer: onClose,
    suggerer: () => aller({ ecran: 'suggerer' }),
    comparer: () => aller({ ecran: 'comparer', houblons: comparaison }),
    nbHoublons: comparaison.length,
  }), [onClose, aller, comparaison]);

  return (
    <CadreBiereCtx.Provider value={cadre}>
      <HoteBiereProvider valeur={valeur}>
        <Biere />
      </HoteBiereProvider>
    </CadreBiereCtx.Provider>
  );
}
