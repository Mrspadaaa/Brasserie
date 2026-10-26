// L'étape 3 « Houblons » du wizard, drapeau hopV4 allumé (T12, #170) : son écran choisi (base v4.10, D107 ; légende v2a,
// D140), le MÊME code que la maquette (EtapeHoublonsContenu). Ici, l'hôte de l'app :
// - la recette vient du brouillon du wizard (toHopRecipe), les données du brasseur de useHopData (stock relié, dégustation
//   de la recette ; aucune donnée inventée : sans dégustation, le profil est tout simulé, « ~ ») ;
// - chaque geste écrit par la seule porte du wizard (applyHopV4Change, reçue en onChange) : un patch de `hops` ;
//   le glisser du rail suit le doigt en mémoire et n'écrit qu'au repos (400 ms après le dernier cran) ;
// - les outils s'ouvrent par la pile de l'app (Suggérer, Comparer : T13, T15) ; la fiche d'un houblon (appui long) s'ouvre en
//   feuille par-dessus l'étape (fiche/FicheApp.tsx), sans couche ;
// - aucun état d'attente : ce module est chargé avec le moteur ; le wizard le précharge dès son ouverture.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Recipe } from '../../../types';
import { toHopRecipe, versPatch, type ChangementHoublonsV4 } from '../../../domain/hopIndex/v4/recipeConversion';
import { configurerDonnees, lireBiere, type BiereLue } from '../parcours/adaptateur';
import { ajouter, changerDose, changerMoment, retirer } from '../parcours/operations';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { useHopData } from '../useHopData';
import { ouvrirCouche } from '../ouvrirCouche';
import { ContexteFicheApp, FicheDeLApp } from '../fiche/FicheApp';
import { HoteEtapeProvider, type HoteEtape, type RouteEtape } from './hote';
import { EtapeHoublonsContenu } from './index';
import { JeuPictos } from '../Pictos';
import { usePrechauffeSuggerer } from '../suggerer/prechauffe';
import './theme-app.css';

export interface EtapeHoublonsProps {
  /** Le brouillon exact du wizard (build()). */
  recipe: Recipe;
  /** La DI d'ébullition du wizard (boilOg) : même IBU que l'étape V5.5 et la page recette. */
  boilOg?: number | null;
  /** L'identifiant du brouillon ouvert (draftRecipeId). */
  draftId: string;
  /** La porte d'écriture du wizard (applyHopV4Change) ; elle lève une erreur si elle refuse. */
  onChange: (change: ChangementHoublonsV4) => void;
  /** Les mesures de la recette à l'écran (IBU en plage, EBC), rendues au bandeau du wizard à chaque geste (t12c) : l'étape
   * n'a plus de bandeau propre, elle partage celui des autres étapes. */
  onMesures?: (m: MesuresEtape) => void;
  /** Les renvois de l'étape vers le wizard : « Ébullition 60′ › » ouvre le champ Durée d'ébullition (Identité), la ligne de la
   * levure ouvre l'étape Levure (t12d). */
  onAller?: (cible: 'duree-ebullition' | 'levure') => void;
}
/** IBU total (valeur, plage, ajouts incalculables) et EBC de la recette de l'étape. */
export type MesuresEtape = { ibu: BiereLue['ibu']; ebc: number | null; og: number; /** la bande d'IBU du style (piste du bandeau) */ bande?: [number, number] | null };

/** Ce que la conversion lit du brouillon : la recette n'est reconvertie que si l'un de ces champs change. */
const signature = (r: Recipe) => JSON.stringify([r.hops, r.yeast, r.styleRef, r.style, r.boilMin, r.ogTarget, r.volumeL, r.name, r.fermentables?.map((f) => [f.use, f.weightKg])]);

/** La route d'une couche de l'app pour un écran de l'étape ; null : rien à ouvrir (la fiche est une feuille, tenue par l'étape). */
function coucheDe(r: RouteEtape, recipeId: string) {
  switch (r.ecran) {
    case 'biere': return { view: 'hopBeer' as const, recipeId };
    case 'suggerer': return { view: 'hopSuggest' as const, recipeId };
    case 'substituer': return { view: 'hopSubstitute' as const, recipeId, hopKey: r.houblon };
    case 'dryhopper': return { view: 'hopTiming' as const, recipeId, additionId: r.ajout };
    case 'levure': return { view: 'hopTiming' as const, recipeId, additionId: r.ajout, step: 'yeast' as const };
    default: return null;
  }
}

export default function EtapeHoublons({ recipe, boilOg, draftId, onChange, onMesures, onAller }: EtapeHoublonsProps) {
  const sig = signature(recipe) + String(boilOg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const conversion = useMemo(() => toHopRecipe(recipe, boilOg === undefined ? {} : { boilOg }), [sig]);
  const donnees = useHopData(recipe);

  // Les données du brasseur entrent dans l'adaptateur avant le premier calcul, puis à chaque changement réel (useHopData
  // garde la même identité tant que le contenu ne change pas).
  const posees = useRef<{ stock: unknown; degustation: unknown; recette: unknown } | null>(null);
  if (!posees.current || posees.current.stock !== donnees.stock || posees.current.degustation !== donnees.degustation || posees.current.recette !== conversion) {
    const tasting = donnees.degustation;
    // La recette dégustée : celle du brouillon tel qu'il est lu (le brassin dégusté est celui de cette recette).
    const degustee = conversion.recette;
    configurerDonnees({ stock: donnees.stock, degustation: tasting ? { tasting, recette: () => structuredClone(degustee) } : null });
    posees.current = { stock: donnees.stock, degustation: donnees.degustation, recette: conversion };
  }

  // La recette à l'écran : celle du brouillon, ou celle du geste en cours tant que le brouillon ne l'a pas reprise.
  const [locale, setLocale] = useState<RecetteParcours | null>(null);
  useEffect(() => { setLocale(null); }, [conversion]);
  const recette = locale ?? conversion.recette;
  const recetteRef = useRef(recette); recetteRef.current = recette;
  usePrechauffeSuggerer(recette);
  const mesures = useMemo<MesuresEtape>(() => { const b = lireBiere(recette); return { ibu: b.ibu, ebc: b.ebc, og: b.og, bande: b.bandeIbu }; }, [recette]);
  useEffect(() => { onMesures?.(mesures); }, [mesures, onMesures]);
  const [erreur, setErreur] = useState<string | null>(null);

  const ecrire = useCallback((suivante: RecetteParcours) => {
    try {
      const { patch } = versPatch(conversion, suivante);
      onChange({ draftId, patch });
      setErreur(null);
    } catch (e) {
      setLocale(null);
      setErreur(e instanceof Error ? e.message : String(e));
    }
  }, [conversion, draftId, onChange]);

  const minuterie = useRef<number | null>(null);
  const enAttente = useRef<RecetteParcours | null>(null);
  const vider = useCallback(() => {
    if (minuterie.current != null) window.clearTimeout(minuterie.current);
    minuterie.current = null;
    const r = enAttente.current; enAttente.current = null;
    if (r) ecrire(r);
  }, [ecrire]);
  useEffect(() => () => vider(), [vider]);

  const geste = useCallback((f: (r: RecetteParcours) => RecetteParcours) => {
    vider();
    const suivante = f(recetteRef.current);
    recetteRef.current = suivante;
    setLocale(suivante);
    ecrire(suivante);
  }, [ecrire, vider]);

  // La fiche d'un houblon (appui long) : une feuille par-dessus l'étape, qui reste montée dessous.
  const [fiche, setFiche] = useState<string | null>(null);
  const fermerFiche = useCallback(() => setFiche(null), []);
  const ouvrir = useCallback((r: RouteEtape) => {
    vider();
    if (r.ecran === 'fiche') { setFiche(r.houblon); return; }
    const couche = coucheDe(r, draftId);
    if (couche) ouvrirCouche(couche);
  }, [draftId, vider]);

  const valeur = useMemo<HoteEtape>(() => ({
    recette,
    route: { ecran: fiche ? 'fiche' : 'ma-biere' },
    aller: ouvrir,
    ouvrir,
    allerWizard: onAller,
    gestes: {
      ajouter: (_sur, a: AjoutParcours) => geste((r) => ajouter(r, a)),
      dose: (_sur, id, g) => geste((r) => changerDose(r, id, g)),
      retirer: (_sur, id) => geste((r) => retirer(r, id)),
      moment: (_sur, id, q) => geste((r) => changerMoment(r, id, q)),
    },
    // Le glisser : chaque cran suit le doigt en mémoire ; l'écriture part au repos (un seul patch par glisser).
    modifierAjout: (id, f) => {
      const r = recetteRef.current;
      const suivante = { ...r, additions: r.additions.map((a) => (a.id === id ? f(a, r) : a)) };
      recetteRef.current = suivante;
      setLocale(suivante);
      enAttente.current = suivante;
      if (minuterie.current != null) window.clearTimeout(minuterie.current);
      minuterie.current = window.setTimeout(vider, 400);
    },
  }), [recette, fiche, ouvrir, geste, vider, onAller]);
  const brouillon = useMemo(() => ({ recette, draftId }), [recette, draftId]);

  return (
    <HoteEtapeProvider valeur={valeur}>
      <div data-hop-v4-etape="houblons">
        {/* Le jeu de pictos des familles (symboles SVG <use>), posé par la coquille dans la maquette. */}
        <JeuPictos />
        {erreur && <p role="alert" className="mb-1 text-sm text-cave-200">{erreur}</p>}
        <EtapeHoublonsContenu bandeau={false} />
        {fiche && <ContexteFicheApp valeur={brouillon}><FicheDeLApp houblon={fiche} onFermer={fermerFiche} /></ContexteFicheApp>}
      </div>
    </HoteEtapeProvider>
  );
}
