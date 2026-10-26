// Les outils à brouillon dans l'app (T15c, #174) : l'hôte commun de Substituer, Dryhopper et Levure pour la pile des outils. Un seul
// code d'écran par outil (substituer/, dryhopper/, levure/), deux hôtes ; ici le brouillon du wizard (pont comparer/porte.ts), les
// données du brasseur (useHopData), la porte d'écriture unique (applyHopV4Change, via la porte) et les couches de la pile.
// Chargé à la demande (HopToolLayer), jamais au démarrage. Même principe que comparer/EcranApp.tsx et suggerer/EcranApp.tsx.
//
// Le brouillon d'outil (D120, « Annuler jette le brouillon ») : une copie de la recette du wizard, tenue ICI, que les gestes de
// l'écran changent (moment, dose, remplaçant, levure). Rien ne part vers le wizard avant « Remplacer » ou « Ajouter à ma bière » :
// ils écrivent alors, d'un seul coup, par la porte unique (versPatch puis applyHopV4Change). La croix et « Annuler » ferment
// la couche et le jettent ; la recette du wizard ne bouge pas. Un geste de rail (une trentaine de crans sous le doigt) ne réécrit
// donc ni le brouillon enregistré ni le wizard.
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { PageShell } from '../../../pages/PageShell';
import { useStorageValue } from '../../../hooks/useLiveData';
import { StorageService } from '../../../services/storage';
import { toHopRecipe, versPatch } from '../../../domain/hopIndex/v4/recipeConversion';
import { useAppuiLong } from '../gestes';
import { configurerDonnees } from '../parcours/adaptateur';
import { changerDose, changerMoment, choisirLevure, remplacer } from '../parcours/operations';
import type { Brouillon, RecetteParcours } from '../parcours/types';
import { usePorteEtape, type PorteEtape } from '../comparer/porte';
import { ContexteFicheApp, FicheDeLApp } from '../fiche/FicheApp';
import { basculerComparaison, useComparaisonRetenue } from '../fiche/comparaison';
import { useGestesFiche } from '../maBiere/gestesFiche';
import { JeuPictos } from '../Pictos';
import { ouvrirCouche } from '../ouvrirCouche';
import { useHopData } from '../useHopData';
import { CadreApp, CadreOutilCtx } from './CadreApp';
import { HoteOutilProvider, type FicheLocale, type FicheSurOutil, type HoteOutil, type RouteOutil, type TermesOutil } from './hote';

/** La fiche posée sur Substituer : appui long sur une ligne, survol long d'un nom ; la feuille se ferme par sa croix. */
function useFicheApp(): FicheLocale {
  const [cle, setCle] = useState<string | null>(null);
  const g = useGestesFiche(setCle);
  return { ...g, rendu: cle ? <FicheDeLApp houblon={cle} onFermer={() => setCle(null)} /> : null };
}

/** Les révisions de connaissances du brasseur ; undefined quand le stockage ne les lit pas (les doublures de test de plusieurs suites
 * n'ont que les lectures de l'étape Houblons) : x1 prend alors la graine livrée avec l'app. */
const lireConnaissances = () => (typeof StorageService.getHopKnowledge === 'function' ? StorageService.getHopKnowledge() : undefined);

const SURVOL_MS = 650;
/** La fiche posée sur Dryhopper et Levure : appui long au doigt, survol long à l'ordinateur (comme la maquette), sans entrée
 * d'historique (le Sheet de l'app n'en a pas ; T13). */
function useFicheSurOutilApp(cle: string): FicheSurOutil {
  const [ouverte, setOuverte] = useState(false);
  const ouvrir = useCallback(() => setOuverte(true), []);
  const minuterie = useRef<number | null>(null);
  const annuler = () => { if (minuterie.current != null) window.clearTimeout(minuterie.current); minuterie.current = null; };
  const appui = useAppuiLong(ouvrir);
  const declencheur = {
    ...appui,
    onPointerMove: (e: React.PointerEvent) => {
      appui.onPointerMove?.(e);
      if (e.pointerType === 'mouse' && !e.buttons && minuterie.current == null) minuterie.current = window.setTimeout(() => { minuterie.current = null; ouvrir(); }, SURVOL_MS);
    },
    onPointerLeave: () => { annuler(); appui.onPointerLeave(); },
    'data-role': 'ouvrir-fiche',
    'data-houblon': cle,
  };
  return { declencheur, feuille: ouverte ? <FicheDeLApp houblon={cle} onFermer={() => { annuler(); setOuverte(false); }} /> : null };
}

function Message({ titre, texte, role, onClose }: { titre: string; texte: string; role: string; onClose: () => void }) {
  return (
    <PageShell title={titre} onClose={onClose}>
      <p data-role={role} className="text-sm text-cave-200">{texte}</p>
    </PageShell>
  );
}

export interface OutilAppProps {
  /** L'identifiant du brouillon visé par la route ; absent : le brouillon ouvert dessous. */
  recipeId?: string;
  onClose: () => void;
  titre: string;
  /** Le brouillon d'outil, à partir de la recette du wizard ; null : l'ajout ou le houblon visé n'y est plus. */
  creer: (recette: RecetteParcours) => Brouillon | null;
  /** Pourquoi `creer` a refusé. */
  absent: string;
  /** Levure : dans la couche de Dryhopper, on change d'étape sans quitter le brouillon. */
  versLevure?: () => void;
  retour?: () => void;
  /** L'ajout vient d'être posé par un outil (Dryhopper s'ouvre alors sur ★). */
  ajoutNeuf?: (recette: RecetteParcours, ajoutId: string) => boolean;
  children: ReactNode;
}

export function OutilApp(p: OutilAppProps) {
  const porte = usePorteEtape();
  if (!porte || (p.recipeId && p.recipeId !== porte.draftId)) {
    return <Message titre={p.titre} role="outil-sans-brouillon" onClose={p.onClose} texte={`${p.titre} travaille sur le brouillon de l’étape Houblons : ouvre-le depuis la recette en cours.`} />;
  }
  return <Contenu {...p} porte={porte} />;
}

function Contenu({ onClose, titre, creer, absent, versLevure, retour, ajoutNeuf, porte, children }: OutilAppProps & { porte: PorteEtape }) {
  const { recipe, boilOg, draftId } = porte;
  const donnees = useHopData(recipe);
  // Les révisions de connaissances du brasseur : l'amertume au dry hop lit la sienne (froid.ts, x1), désactivée comprise.
  const connaissances = useStorageValue(lireConnaissances);
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

  const conversionRef = useRef(conversion); conversionRef.current = conversion;
  const porteRef = useRef(porte); porteRef.current = porte;
  const [erreur, setErreur] = useState<string | null>(null);

  // Le brouillon d'outil : pris une fois, à l'ouverture, sur la recette du wizard. Tenu dans une référence pour que deux gestes
  // qui se suivent avant le rendu (remplacer, dose, inscrire) partent chacun du précédent.
  const brouillonRef = useRef<Brouillon | null | undefined>(undefined);
  if (brouillonRef.current === undefined) brouillonRef.current = creer(conversion.recette);
  const [, rendre] = useState(0);

  const appliquer = useCallback((f: (r: RecetteParcours) => RecetteParcours) => {
    const b = brouillonRef.current;
    if (!b) return;
    try {
      brouillonRef.current = { ...b, recette: f(b.recette) };
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
    rendre((n) => n + 1);
  }, []);

  const inscrire = useCallback((): boolean => {
    const b = brouillonRef.current;
    if (!b) return false;
    try {
      const { patch } = versPatch(conversionRef.current, b.recette);
      porteRef.current.onChange({ draftId, patch });
      setErreur(null);
      return true;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, [draftId]);

  const comparaison = useComparaisonRetenue();
  const gestes = useMemo<HoteOutil['gestes']>(() => ({
    moment: (_s, id, q) => appliquer((r) => changerMoment(r, id, q)),
    dose: (_s, id, g) => appliquer((r) => changerDose(r, id, g)),
    remplacer: (_s, id, cle) => appliquer((r) => remplacer(r, id, cle)),
    levure: (_s, id) => appliquer((r) => choisirLevure(r, id)),
    inscrire, basculerComparaison,
  }), [appliquer, inscrire]);

  const aller = useCallback((r: RouteOutil) => {
    if (r.ecran === 'comparer') ouvrirCouche({ view: 'hopCompare', recipeId: draftId, hops: r.houblons, ...(r.pin ? { pinned: r.pin } : {}) });
    else versLevure?.();
  }, [draftId, versLevure]);

  const recette = conversion.recette;
  // Les mots de la bière : ceux du brouillon, jamais ceux du cas S1 (stout 16D, dégustation du 18.10). Sans dégustation : null.
  const dateDeg = donnees.degustation?.date ?? null;
  const termes = useMemo<TermesOutil>(() => ({
    biere: 'bière', style: recette.styleCode || 'style',
    degustation: dateDeg ? dateDeg.split('-').slice(1).reverse().join('.') : null,
  }), [recette.styleCode, dateDeg]);

  const brouillon = brouillonRef.current ?? null;
  const valeur = useMemo<HoteOutil>(() => ({
    brouillon, recette, aComparer: comparaison, gestes, aller, retour: retour ?? onClose, revenirMaBiere: onClose, annuler: onClose,
    Cadre: CadreApp, useFiche: useFicheApp, useFicheSurOutil: useFicheSurOutilApp, termes, connaissances,
    ...(ajoutNeuf ? { ajoutNeuf: (id: string) => ajoutNeuf(recette, id) } : {}),
  }), [brouillon, recette, comparaison, gestes, aller, retour, onClose, termes, ajoutNeuf, connaissances]);
  const pourFiche = useMemo(() => ({ recette, draftId }), [recette, draftId]);
  const cadre = useMemo(() => ({ fermer: onClose }), [onClose]);

  if (!brouillon) return <Message titre={titre} role="outil-sans-ajout" onClose={onClose} texte={absent} />;
  return (
    <CadreOutilCtx.Provider value={cadre}>
      <HoteOutilProvider valeur={valeur}>
        <ContexteFicheApp valeur={pourFiche}>
          <JeuPictos />
          {erreur && <p role="alert" data-role="outil-erreur" className="fixed left-2 right-2 top-14 z-40 rounded-control bg-cave-900 p-2 text-sm text-cave-50">{erreur}</p>}
          <div data-hop-v4-outil="app">{children}</div>
        </ContexteFicheApp>
      </HoteOutilProvider>
    </CadreOutilCtx.Provider>
  );
}
