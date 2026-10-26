// Suggérer dans l'app (T13, #173) : l'hôte de l'écran q2b (base v4.10, son choix) pour la pile des outils. Un seul code d'écran
// (./index.tsx), deux hôtes ; ici le brouillon du wizard (pont comparer/porte.ts), les données du brasseur (useHopData), la porte
// d'écriture unique (applyHopV4Change, via la porte) et les couches de la pile. Chargé à la demande (HopToolLayer), jamais au
// démarrage. Même principe que comparer/EcranApp.tsx.
// - « Ajouter » du mode Radar (vue-radar.tsx) écrit le brouillon par la porte (ajouter, moment, dose, remplacer, retirer) ;
// - « Comparer (n) » ouvre la route hopCompare avec les houblons retenus (fiche/comparaison.ts) ;
// - la visée : celle que l'hôte passe (`visee`), sinon celle posée dans Ma bière (parcours/visee.ts, t12e : transmise par la porte),
//   sinon aucune. L'app n'invente aucune demande (t12d, 25.10 : la fixture S1 « + floral, − résineux » n'est plus lue) : sans visée,
//   Suggérer le dit et ne propose rien.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { PageShell } from '../../../pages/PageShell';
import { idAjout, toHopRecipe, versPatch } from '../../../domain/hopIndex/v4/recipeConversion';
import { configurerDonnees } from '../parcours/adaptateur';
import { ajouter, changerDose, changerMoment, remplacer, retirer } from '../parcours/operations';
import type { RecetteParcours } from '../parcours/types';
import { abonnerVisee, lireVisee, type Visee } from '../parcours/visee';
import { ContexteFicheApp, FicheDeLApp } from '../fiche/FicheApp';
import { basculerComparaison, fixerComparaison, useComparaisonRetenue } from '../fiche/comparaison';
import { JeuPictos } from '../Pictos';
import { ouvrirCouche } from '../ouvrirCouche';
import { useHopData } from '../useHopData';
import { usePorteEtape, type PorteEtape } from '../comparer/porte';
import { CadreApp, CadreSuggererCtx } from './CadreApp';
import { HoteSuggererProvider, type HoteSuggerer, type RouteSuggerer } from './hote';
import Suggerer from './index';

export interface EcranSuggererProps {
  /** L'identifiant du brouillon visé par la route ; absent : le brouillon ouvert dessous. */
  recipeId?: string;
  onClose: () => void;
  /** La visée posée par le brasseur (palier par famille) ; absente : aucune demande, Suggérer n'a rien à viser. */
  visee?: Visee;
}

function SansBrouillon({ onClose }: { onClose: () => void }) {
  return (
    <PageShell title="Suggérer" onClose={onClose}>
      <p data-role="suggerer-sans-brouillon" className="text-sm text-cave-200">Suggérer travaille sur le brouillon de l’étape Houblons : ouvre-le depuis la recette en cours.</p>
    </PageShell>
  );
}

export default function EcranSuggererApp(p: EcranSuggererProps) {
  const porte = usePorteEtape();
  if (!porte || (p.recipeId && p.recipeId !== porte.draftId)) return <SansBrouillon onClose={p.onClose} />;
  return <Contenu onClose={p.onClose} porte={porte} visee={p.visee} />;
}

const BASE: RouteSuggerer = { ecran: 'suggerer' };

function Contenu({ onClose, porte, visee: viseeProp }: { onClose: () => void; porte: PorteEtape; visee?: Visee }) {
  const { recipe, boilOg, draftId } = porte;
  const viseePosee = useSyncExternalStore(abonnerVisee, lireVisee, lireVisee);
  const visee = viseeProp ?? viseePosee;
  const donnees = useHopData(recipe);
  // La conversion ne se refait que si la porte change d'identité (son contenu lu change : porte.ts) ou le stock.
  const conversion = useMemo(() => toHopRecipe(recipe, {
    ...(boilOg === undefined ? {} : { boilOg }),
    alphaDuStock: (cle: string) => donnees.stock.find((s) => s.key === cle)?.alpha ?? null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [porte, donnees.stock]);

  // Les données du brasseur entrent dans l'adaptateur avant le premier calcul (comme l'étape Houblons).
  const posees = useRef<{ stock: unknown; degustation: unknown; recette: unknown } | null>(null);
  if (!posees.current || posees.current.stock !== donnees.stock || posees.current.degustation !== donnees.degustation || posees.current.recette !== conversion) {
    const tasting = donnees.degustation;
    const degustee = conversion.recette;
    configurerDonnees({ stock: donnees.stock, degustation: tasting ? { tasting, recette: () => structuredClone(degustee) } : null });
    posees.current = { stock: donnees.stock, degustation: donnees.degustation, recette: conversion };
  }

  // La recette à l'écran : celle du brouillon, ou celle du geste en cours tant que le brouillon ne l'a pas reprise (le mode
  // Radar enchaîne plusieurs gestes dans le même instant : chacun part du précédent).
  const [locale, setLocale] = useState<RecetteParcours | null>(null);
  useEffect(() => { setLocale(null); }, [conversion]);
  const recette = locale ?? conversion.recette;
  const recetteRef = useRef(recette); recetteRef.current = recette;
  const conversionRef = useRef(conversion); conversionRef.current = conversion;
  const porteRef = useRef(porte); porteRef.current = porte;
  const [erreur, setErreur] = useState<string | null>(null);
  // Un ajout neuf s'écrit en fin de liste : son identifiant, à la relecture, est sa position (a1, a2…). Les gestes suivants (et
  // « défaire ») parlent encore de l'identifiant que la voie lui avait donné : cette table les rapproche.
  const alias = useRef(new Map<string, string>());
  const idDe = (r: RecetteParcours, id: string) => (r.additions.some((a) => a.id === id) ? id : alias.current.get(id) ?? id);

  const geste = useCallback((f: (r: RecetteParcours) => RecetteParcours, nouvel?: string) => {
    try {
      const suivante = f(recetteRef.current);
      const { patch } = versPatch(conversionRef.current, suivante);
      porteRef.current.onChange({ draftId, patch });
      if (nouvel) alias.current.set(nouvel, idAjout(patch.hops.length - 1));
      recetteRef.current = suivante;
      setLocale(suivante);
      setErreur(null);
    } catch (e) {
      setLocale(null);
      setErreur(e instanceof Error ? e.message : String(e));
    }
  }, [draftId]);

  const comparaison = useComparaisonRetenue();
  const gestes = useMemo<HoteSuggerer['gestes']>(() => ({
    ajouter: (_s, a) => geste((r) => ajouter(r, a), a.id),
    moment: (_s, id, q) => geste((r) => changerMoment(r, idDe(r, id), q)),
    dose: (_s, id, g) => geste((r) => changerDose(r, idDe(r, id), g)),
    remplacer: (_s, id, cle) => geste((r) => remplacer(r, idDe(r, id), cle)),
    retirer: (_s, id) => geste((r) => retirer(r, idDe(r, id))),
    basculerComparaison, fixerComparaison,
  }), [geste]);

  // La fiche (appui long) se pose par-dessus : Suggérer pousse une entrée de « route » (aller) pour la repérer, et la ferme par `onFermer`.
  const [route, aller] = useState<RouteSuggerer>(BASE);
  const ouvrir = useCallback((r: RouteSuggerer) => {
    if (r.ecran === 'comparer') ouvrirCouche({ view: 'hopCompare', recipeId: draftId, hops: r.houblons });
  }, [draftId]);

  const valeur = useMemo<HoteSuggerer>(() => ({
    recette, visee, aComparer: comparaison, route, aller, ouvrir, gestes, Cadre: CadreApp, Fiche: FicheDeLApp,
  }), [recette, visee, comparaison, route, ouvrir, gestes]);
  const brouillon = useMemo(() => ({ recette, draftId }), [recette, draftId]);
  const cadre = useMemo(() => ({
    fermer: onClose, comparer: () => { ouvrirCouche({ view: 'hopCompare', recipeId: draftId, hops: comparaison }); }, nbHoublons: comparaison.length,
  }), [onClose, draftId, comparaison]);

  return (
    <CadreSuggererCtx.Provider value={cadre}>
      <HoteSuggererProvider valeur={valeur}>
        <ContexteFicheApp valeur={brouillon}>
          <JeuPictos />
          {erreur && <p role="alert" data-role="suggerer-erreur" className="fixed left-2 right-2 top-14 z-40 rounded-control bg-cave-900 p-2 text-sm text-cave-50">{erreur}</p>}
          <div data-hop-v4-suggerer="app"><Suggerer /></div>
        </ContexteFicheApp>
      </HoteSuggererProvider>
    </CadreSuggererCtx.Provider>
  );
}
