// Les mesures v4 du bandeau du wizard aux étapes autres que Houblons (t12c) : le bandeau Grain · OG · IBU · EBC montre le même
// IBU à toutes les étapes, drapeau hopV4 allumé : le calcul v4 (plage de la variété quand l'α du lot est absent, « ~ »).
// À l'étape Houblons, c'est l'étape elle-même qui rend ses mesures (recette du geste en cours, EtapeHoublons `onMesures`).
// Ce composant ne rend rien ; il lit les mêmes données du brasseur que l'étape (useHopData, configurerDonnees) et la même
// conversion (toHopRecipe, avec la DI d'ébullition du wizard). Chargé à la demande (import dynamique du wizard).
import { useEffect, useMemo, useRef } from 'react';
import type { Recipe } from '../../../types';
import { toHopRecipe } from '../../../domain/hopIndex/v4/recipeConversion';
import { configurerDonnees, lireBiere } from '../parcours/adaptateur';
import { useHopData } from '../useHopData';
import type { MesuresEtape } from './EtapeHoublons';

const signature = (r: Recipe) => JSON.stringify([r.hops, r.yeast, r.styleRef, r.style, r.boilMin, r.ogTarget, r.volumeL, r.name, r.colorEbc, r.fermentables?.map((f) => [f.use, f.weightKg, f.kind, f.colorEbc])]);

export default function MesuresWizard({ recipe, boilOg, onMesures }: { recipe: Recipe; boilOg?: number | null; onMesures: (m: MesuresEtape) => void }) {
  const sig = signature(recipe) + String(boilOg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const conversion = useMemo(() => toHopRecipe(recipe, boilOg === undefined ? {} : { boilOg }), [sig]);
  const donnees = useHopData(recipe);
  const posees = useRef<{ stock: unknown; degustation: unknown; recette: unknown } | null>(null);
  if (!posees.current || posees.current.stock !== donnees.stock || posees.current.degustation !== donnees.degustation || posees.current.recette !== conversion) {
    const tasting = donnees.degustation;
    const degustee = conversion.recette;
    configurerDonnees({ stock: donnees.stock, degustation: tasting ? { tasting, recette: () => structuredClone(degustee) } : null });
    posees.current = { stock: donnees.stock, degustation: donnees.degustation, recette: conversion };
  }
  const mesures = useMemo<MesuresEtape>(() => { const b = lireBiere(conversion.recette); return { ibu: b.ibu, ebc: b.ebc, og: b.og, bande: b.bandeIbu }; }, [conversion, donnees.stock, donnees.degustation]);
  useEffect(() => { onMesures(mesures); }, [mesures, onMesures]);
  return null;
}
