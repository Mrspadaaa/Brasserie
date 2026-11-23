// Fixture écrite à la main d'après la capture du brasseur (25.10, étape 3 du wizard, app déployée) : Saaz (US) 8 g à 120′,
// Saaz (CZ) 22 g à 10′ ; 5 kg de grain (flocons d'avoine 1 kg, Maris Otter 4 kg) ; OG 1,047 ; EBC 7,9 à l'étape 2.
// Les lignes de houblon n'ont pas de lot au stock : α 0 (convention de l'app : α ≤ 0 = inconnu), l'écran affiche alors la
// plage variétale (« α 3–4,5 % », « α 2–5 % »). `colorEbc` est absent du brouillon (build() écrit details.colorEbc, jamais posé) ;
// l'EBC de l'étape 2 vient des grains. Aucune donnée réelle.
import type { Recipe } from '../../src/types';

export const RECETTE_SAAZ = {
  id: 'REC-SAAZ', name: 'Pale avoine', style: '', volumeL: 20, boilMin: 120, ogTarget: 1.047,
  fermentables: [
    { name: 'Flocons d\'avoine', weightKg: 1, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 },
    { name: 'Maris Otter', weightKg: 4, kind: 'grain', use: 'empatage', colorEbc: 6, potentialPpg: 38 },
  ],
  hops: [
    { name: 'Saaz (US)', alpha: 0, weightG: 8, stage: 'boil', timeMin: 120 },
    { name: 'Saaz (CZ)', alpha: 0, weightG: 22, stage: 'boil', timeMin: 10 },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

/** Brouillon créé en jouant (relevé en lecture seule dans son Chrome, 25.10), sans grain : OG inconnue, « ? » alors juste. */
export const RECETTE_SAAZ_SANS_GRAIN = {
  id: 'REC-SAAZ-0', name: '', style: '', volumeL: 24, boilMin: 60, ogTarget: null, totalGristKg: 0, fermentables: [],
  hops: [{ name: 'Saaz (CZ)', alpha: 0, weightG: 12, stage: 'boil', hopVarietyId: 'beermaverick-saaz-cz', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
