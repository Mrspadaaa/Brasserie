// Banc local de l'étape Identité (voie p1-port, relance 2) : une recette de démonstration AVEC grains, pour `?dev-local&etape=houblons&recette=identite`.
// Pourquoi une seconde fixture : « Stout export » (apercuDev des Houblons) n'a aucun grain ; sans grain, le plan d'eau est vide, il n'y a pas de moût avant
// ébullition et la cuve ne peut ni être mesurée ni déborder. Celle-ci ajoute des malts à la même recette (Foreign Extra Stout, 16D du BJCP 2021, un style qui se résout seul : un code seul comme « 16D » n'est pas un alias, donc sans plages ; 20 L, OG 1,066).
// Chargée seulement en développement, derrière `import.meta.env.DEV` et `?dev-local` (App.tsx) : jamais dans `dist/`.
// FIXTURE, pas une donnée du brasseur : les masses sont des valeurs de démonstration (SIMULÉES), écrites nulle part (brouillon local seulement).
import type { Recipe } from '../../types';

export function recetteApercuIdentite(): Recipe {
  return {
    id: 'apercu-identite', name: 'Stout export', style: 'Foreign Extra Stout', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
    fermentables: [
      { name: 'Pale Ale', kind: 'grain', use: 'empatage', weightKg: 4.6, potentialPpg: 37, colorEbc: 7 },
      { name: 'Munich', kind: 'grain', use: 'empatage', weightKg: 1.0, potentialPpg: 36, colorEbc: 20 },
      { name: 'Orge torréfiée', kind: 'grain', use: 'empatage', weightKg: 0.5, potentialPpg: 25, colorEbc: 1000 },
    ],
    hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
    yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
  } as unknown as Recipe;
}
