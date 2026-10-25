// Comparer dans l'app (T15b, #174) : l'hôte de l'écran cmc2k (son choix) pour la pile des outils. Un seul code d'écran
// (./index.tsx), deux hôtes ; ici le brouillon du wizard (pont ./porte.ts), les données du brasseur (useHopData), la
// porte d'écriture unique (applyHopV4Change, via la porte) et les couches de la pile. Chargé à la demande
// (HopToolLayer), jamais au démarrage. Même principe que maBiere/EtapeHoublons.tsx.
import { useCallback, useMemo, useRef, useState } from 'react';
import { PageShell } from '../../../pages/PageShell';
import { idAjout, toHopRecipe, versPatch } from '../../../domain/hopIndex/v4/recipeConversion';
import { configurerDonnees } from '../parcours/adaptateur';
import { ajouter } from '../parcours/operations';
import { placer } from '../parcours/quand';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { JeuPictos } from '../Pictos';
import { ouvrirCouche } from '../ouvrirCouche';
import { useHopData } from '../useHopData';
import { CONDITIONS } from './cas';
import { CadreApp, CadreCtx } from './CadreApp';
import { HoteComparerProvider, type HoteComparer, type RouteComparer, type TermesComparer } from './hote';
import { usePorteEtape, type PorteEtape } from './porte';
import Comparer from './index';

export interface EcranComparerProps {
  /** Les houblons comparés (les clés du moteur de la route). */
  houblons: string[];
  /** Le houblon épinglé par Substituer. */
  pin?: string;
  /** L'identifiant du brouillon visé par la route ; absent : le brouillon ouvert dessous. */
  recipeId?: string;
  onClose: () => void;
}

/** Ajout neuf posé par « Placer <houblon> » : 4 g/L, dry hop en fermentation active, 3 j (la carte : « actif · 3 j »). */
const ajoutPlace = (recette: RecetteParcours, id: string, hopKey: string): AjoutParcours =>
  placer({ id, hopKey, grams: CONDITIONS.doseGL * recette.volumeL, moment: 'dryActive' }, { type: 'dryhop', phase: 'actif', jours: CONDITIONS.jours }, recette);

function SansBrouillon({ onClose }: { onClose: () => void }) {
  return (
    <PageShell title="Comparer" onClose={onClose}>
      <p data-role="comparer-sans-brouillon" className="text-sm text-cave-200">Comparer travaille sur le brouillon de l’étape Houblons : ouvre-le depuis la recette en cours.</p>
    </PageShell>
  );
}

export default function EcranComparerApp(p: EcranComparerProps) {
  const porte = usePorteEtape();
  if (!porte || (p.recipeId && p.recipeId !== porte.draftId)) return <SansBrouillon onClose={p.onClose} />;
  return <Contenu {...p} porte={porte} />;
}

function Contenu({ houblons, pin, onClose, porte }: EcranComparerProps & { porte: PorteEtape }) {
  const { recipe, boilOg, draftId } = porte;
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

  const [erreur, setErreur] = useState<string | null>(null);
  const conversionRef = useRef(conversion); conversionRef.current = conversion;
  const porteRef = useRef(porte); porteRef.current = porte;

  /** Pose un houblon neuf dans le brouillon par la porte unique ; rend l'identifiant qu'il y aura, ou null si refusé. */
  const poser = useCallback((id: string, hopKey: string): string | null => {
    const conv = conversionRef.current;
    if (conv.recette.additions.some((a) => a.id === id)) return id;
    try {
      const { patch } = versPatch(conv, ajouter(conv.recette, ajoutPlace(conv.recette, id, hopKey)));
      porteRef.current.onChange({ draftId, patch });
      setErreur(null);
      // Un ajout neuf s'écrit en fin de liste : son identifiant, à la relecture, est sa position (a1, a2…).
      return idAjout(patch.hops.length - 1);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [draftId]);

  const ouvrir = useCallback((r: RouteComparer) => {
    if (r.ecran === 'suggerer') { ouvrirCouche({ view: 'hopSuggest', recipeId: draftId }); return; }
    if (r.ecran === 'dryhopper' || r.ecran === 'levure') {
      const id = r.houblon ? poser(r.ajout, r.houblon) : r.ajout;
      if (!id) return;
      ouvrirCouche(r.ecran === 'levure'
        ? { view: 'hopTiming', recipeId: draftId, additionId: id, step: 'yeast' }
        : { view: 'hopTiming', recipeId: draftId, additionId: id });
    }
  }, [draftId, poser]);

  // La fiche (g1) n'est pas encore une couche de l'app : l'appui long n'ouvre rien (Fiche absente).
  const aller = useCallback(() => {}, []);

  const recette = conversion.recette;
  // Les mots de la bière : ceux du brouillon, jamais ceux du cas S1 (stout 16D, dégustation du 18.10). Sans dégustation : null.
  const dateDeg = donnees.degustation?.date ?? null;
  const termes = useMemo<TermesComparer>(() => ({
    biere: 'bière', style: recette.styleCode || 'style',
    degustation: dateDeg ? dateDeg.split('-').slice(1).reverse().join('.') : null,
  }), [recette.styleCode, dateDeg]);
  const valeur = useMemo<HoteComparer>(() => ({
    recette, route: { ecran: 'comparer', ...(pin ? { pin } : {}) }, aller, ouvrir, Cadre: CadreApp, termes,
  }), [recette, pin, aller, ouvrir, termes]);
  const cadre = useMemo(() => ({ fermer: onClose, suggerer: () => { ouvrirCouche({ view: 'hopSuggest', recipeId: draftId }); }, nbHoublons: houblons.length }), [onClose, draftId, houblons.length]);

  return (
    <CadreCtx.Provider value={cadre}>
      <HoteComparerProvider valeur={valeur}>
        <JeuPictos />
        {erreur && <p role="alert" data-role="comparer-erreur" className="fixed left-2 right-2 top-14 z-40 rounded-control bg-cave-900 p-2 text-sm text-cave-50">{erreur}</p>}
        <div data-hop-v4-comparer="app"><Comparer houblons={houblons} /></div>
      </HoteComparerProvider>
    </CadreCtx.Provider>
  );
}
