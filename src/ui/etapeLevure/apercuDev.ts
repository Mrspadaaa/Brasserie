// Banc local de l'étape Levure (mission 2026-11-09-levure-port, voie u1) : `?dev-local&etape=levure` ouvre l'assistant à l'étape 4
// sur une recette de démonstration (SafAle US-05, OG 1,066, 30 L, 19 °C ; la recette de la maquette l5b), `&recette=vide` sur une
// recette sans levure. Chargé seulement en développement, derrière `import.meta.env.DEV` et `?dev-local` (App.tsx) : jamais dans
// `dist/`. Une fixture, pas une donnée du brasseur : elle n'est écrite nulle part (le brouillon local du wizard seulement).
import type { Recipe } from '../../types';

/** Quatre paliers : 19 °C ×3 puis 4 °C (fin J12), comme le cadre 1 de la maquette l5b. */
const PALIERS = [
  { name: 'Fermentation principale', kind: 'primaire', tempC: 19, days: 4 },
  { name: 'Repos diacétyle', kind: 'reposDiacetyle', tempC: 19, days: 3 },
  { name: 'Fin de fermentation', kind: 'garde', tempC: 19, days: 2 },
  { name: 'Garde froide', kind: 'garde', tempC: 4, days: 3 },
];

/** Recherche SIMULÉE du banc (`&recherche=simulee`) : aucun appel IA ; répond après 2,5 s une valeur marquée « simulé ». Jamais dans `dist/`. */
export const rechercheSimulee = (): Promise<{ ok: true; facts: { technicalFacts: unknown[] } }> => new Promise(fin => setTimeout(() => fin({ ok: true, facts: { technicalFacts: [
  { key: 'flocculation', reported: 'moyenne (simulé)', source: 'SIMULÉ · banc local, aucun appel IA', origin: 'ai' },
  { key: 'pof', reported: 'négatif (simulé)', source: 'SIMULÉ · banc local, aucun appel IA', origin: 'ai' },
  { key: 'biotransformation', reported: 'faible (simulé)', source: 'SIMULÉ · banc local, aucun appel IA', origin: 'ai' },
] } }), 2500));

export function recetteApercuEtapeLevure(): Recipe {
  return {
    id: 'apercu-etape-levure', name: 'American IPA', style: '21A', volumeL: 30, boilMin: 60, ogTarget: 1.066, efficiencyPct: 80, colorEbc: 12,
    fermentables: [{ name: 'Pilsner', weightKg: 8, kind: 'grain', use: 'empatage', colorEbc: 4, potentialPpg: 37 }],
    hops: [{ name: 'Citra', alpha: 12, weightG: 60, stage: 'boil', timeMin: 20 }],
    yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', pitchTempC: 19 },
    fermentation: PALIERS.map(p => ({ ...p })),
  } as unknown as Recipe;
}

/**
 * La forme de la vraie recette « ZZ TEST — Recette » (Double IPA, 24 L, US-05), trouvée en ligne le 09.11 : levure sans `form`, `qty: 0` enregistrée (donnée
 * ancienne), sans `pitching` ; des fermentables sans potentiel (le moût ne s'estime pas par `estimatePitchingWort`) mais une DI de recette (`ogTarget`) que le
 * bandeau et le moteur lisent. Sert au test de la dose et au banc `&recette=ancienne`.
 */
export function recetteApercuAncienne(): Recipe {
  return {
    id: 'apercu-etape-levure-ancienne', name: 'ZZ TEST — Recette', style: '22A', volumeL: 24, boilMin: 60, ogTarget: 1.085, efficiencyPct: 75, colorEbc: 14,
    fermentables: [{ name: 'Pilsner', weightKg: 9, kind: 'grain', use: 'empatage', colorEbc: 4 }],
    hops: [{ name: 'Citra', alpha: 12, weightG: 80, stage: 'boil', timeMin: 20 }],
    yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', qty: 0, unit: 'sachet' },
    fermentation: PALIERS.map(p => ({ ...p })),
  } as unknown as Recipe;
}

/** La même recette, sans levure ni palier : l'état « recette sans levure » (`&recette=vide`). */
export function recetteApercuSansLevure(): Recipe {
  const { yeast: _levure, fermentation: _paliers, ...reste } = recetteApercuEtapeLevure() as unknown as Record<string, unknown>;
  return { ...reste, id: 'apercu-etape-levure-vide', yeast: { name: '' } } as unknown as Recipe;
}
