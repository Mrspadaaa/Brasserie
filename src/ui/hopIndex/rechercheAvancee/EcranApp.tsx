// La recherche avancée des houblons dans l'app (09.11 : « Faire la même chose que levure pour la recherche pour les houblons ») :
// une couche de la pile des outils (route `hopSearch`), ouverte par le bouton « Recherche avancée » du champ d'ajout de l'étape
// Houblons (maBiere/Ajouter.tsx), comme Suggérer et Comparer. Même hôte que Suggérer (suggerer/EcranApp.tsx) : le brouillon du
// wizard par la porte (comparer/porte.ts), les données du brasseur (useHopData), l'écriture unique (applyHopV4Change, via la porte).
// - « Ajouter à ma recette » ajoute le houblon par la même porte que le champ (`ajouter` de parcours/operations), à la dose et au
//   moment que le moteur propose (quickAdds, comme les ajouts proposés), puis referme la couche sur l'étape ;
// - « Fiche » ouvre la fiche existante (FicheApp) par-dessus.
// Chargé à la demande (HopToolLayer), jamais au démarrage.
import { useCallback, useMemo, useRef, useState } from 'react';
import { PageShell } from '../../../pages/PageShell';
import { toHopRecipe, versPatch } from '../../../domain/hopIndex/v4/recipeConversion';
import type { QuickAdd } from '../../../domain/hopIndex/v4';
import { configurerDonnees, donnees, style } from '../parcours/adaptateur';
import { ajouter, nouvelId, placer } from '../parcours/operations';
import { quickAdds } from '../parcours/v4';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { ContexteFicheApp, FicheDeLApp } from '../fiche/FicheApp';
import { JeuPictos } from '../Pictos';
import { useHopData } from '../useHopData';
import { usePorteEtape, type PorteEtape } from '../comparer/porte';
import { useCataloguePlein } from '../fiche/marques';
import { RechercheAvancee } from '../../rechercheAvancee/RechercheAvancee';
import { catalogueHoublons, fichesHoublons, type ActionsHoublon, type FicheHoublon } from './catalogue';

export interface EcranRechercheProps {
  /** L'identifiant du brouillon visé par la route ; absent : le brouillon ouvert dessous. */
  recipeId?: string;
  onClose: () => void;
}

export default function EcranRechercheHoublons(p: EcranRechercheProps) {
  const porte = usePorteEtape();
  if (!porte || (p.recipeId && p.recipeId !== porte.draftId)) {
    return (
      <PageShell title="Recherche avancée" onClose={p.onClose}>
        <p data-role="recherche-sans-brouillon" className="text-sm text-cave-200">La recherche avancée ajoute au brouillon de l’étape Houblons : ouvre-la depuis la recette en cours.</p>
      </PageShell>
    );
  }
  return <Contenu porte={porte} onClose={p.onClose} />;
}

/** L'ajout que le moteur propose pour ce houblon dans cette recette (dose, moment), comme le champ d'ajout (Ajouter.tsx). */
export function ajoutPropose(recette: RecetteParcours, cle: string, propositions: readonly QuickAdd[]): AjoutParcours {
  const q = propositions.find((r) => r.key === cle);
  const minutes = q?.moment === 'b60' ? 60 : 10;
  return placer({ id: nouvelId(recette, cle), hopKey: cle, grams: q?.dose?.grams ?? 10, moment: 'b10' }, { type: 'ebullition', minutes: Math.min(recette.boilMin, minutes) }, recette);
}

function Contenu({ porte, onClose }: { porte: PorteEtape; onClose: () => void }) {
  const { recipe, boilOg, draftId } = porte;
  const donneesBrasseur = useHopData(recipe);
  const plein = useCataloguePlein();
  const conversion = useMemo(() => toHopRecipe(recipe, {
    ...(boilOg === undefined ? {} : { boilOg }),
    alphaDuStock: (cle: string) => donneesBrasseur.stock.find((s) => s.key === cle)?.alpha ?? null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [porte, donneesBrasseur.stock]);

  // Les données du brasseur entrent dans l'adaptateur avant la première lecture (comme l'étape Houblons et Suggérer).
  const posees = useRef<{ stock: unknown; degustation: unknown; recette: unknown } | null>(null);
  if (!posees.current || posees.current.stock !== donneesBrasseur.stock || posees.current.degustation !== donneesBrasseur.degustation || posees.current.recette !== conversion) {
    const tasting = donneesBrasseur.degustation;
    const degustee = conversion.recette;
    configurerDonnees({ stock: donneesBrasseur.stock, degustation: tasting ? { tasting, recette: () => structuredClone(degustee) } : null });
    posees.current = { stock: donneesBrasseur.stock, degustation: donneesBrasseur.degustation, recette: conversion };
  }
  const recette = conversion.recette;
  const [erreur, setErreur] = useState<string | null>(null);
  const [fiche, setFiche] = useState<string | null>(null);

  // Les propositions du moteur (dose, moment), calculées une fois par recette, à la première ligne ouverte.
  const propositions = useRef<{ cle: string; liste: QuickAdd[] } | null>(null);
  const proposees = useCallback((): QuickAdd[] => {
    const cle = JSON.stringify([recette.styleCode, recette.volumeL, recette.og, recette.boilMin, recette.additions]);
    if (propositions.current?.cle !== cle) {
      const m = quickAdds(recette, style(recette.styleCode), donnees().degustation?.tasting ?? null, { catalogueLimit: 10000, aromatique: true });
      propositions.current = { cle, liste: [...m.disponibles, ...m.epuises, ...m.catalogue] };
    }
    return propositions.current.liste;
  }, [recette]);

  const courant = useRef<ActionsHoublon | null>(null);
  courant.current = {
    ajouter: (f: FicheHoublon) => {
      try {
        const suivante = ajouter(recette, ajoutPropose(recette, f.cle, proposees()));
        const { patch } = versPatch(conversion, suivante);
        porte.onChange({ draftId, patch });
        onClose();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    proposition: (f: FicheHoublon) => {
      const a = ajoutPropose(recette, f.cle, proposees());
      const g = Math.round(a.grams * 10) / 10;
      return `${String(g).replace('.', ',')} g à ${a.minutes ?? 10}′`;
    },
    fiche: (f: FicheHoublon) => setFiche(f.cle),
  };
  // Les fiches et la recherche ne se refont qu'à l'arrivée du catalogue plein ou d'un stock changé : la recette n'y entre pas.
  // L'ordre par défaut est celui du moteur pour le style de la recette (le rang des ajouts proposés), pas l'alphabet.
  const catalogue = useMemo(() => {
    const sc = style(recette.styleCode);
    const rangs = new Map(proposees().map((q) => [q.key, q.rank] as const));
    return catalogueHoublons(fichesHoublons(), () => courant.current!, sc.documented ? { nom: sc.name || recette.styleCode, rang: (cle) => rangs.get(cle) } : undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plein, donneesBrasseur.stock, recette.styleCode]);
  const brouillon = useMemo(() => ({ recette, draftId }), [recette, draftId]);

  return (
    <PageShell title="Recherche avancée" subtitle="Houblons" onClose={onClose}>
      <ContexteFicheApp valeur={brouillon}>
        <JeuPictos />
        {erreur && <p role="alert" data-role="recherche-erreur" className="rounded-control bg-cave-900 p-2 text-sm text-cave-50">{erreur}</p>}
        <div data-hop-v4-recherche="app"><RechercheAvancee catalogue={catalogue} /></div>
        {fiche && <FicheDeLApp houblon={fiche} onFermer={() => setFiche(null)} />}
      </ContexteFicheApp>
    </PageShell>
  );
}
