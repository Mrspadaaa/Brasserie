// Banc local de l'étape Houblons (T12b, #170) : la recette de sa maquette (base v4.10, recette S1 du lot 20 : Stout export
// 16D, 20 L, OG 1,066, EBC 70, Nugget 46 g à 60′, α du lot 13 %, SafAle US-05), pour `?dev-local&etape=houblons`.
// Chargé seulement en développement, derrière `import.meta.env.DEV` et `?dev-local` (App.tsx) : jamais dans `dist/`.
// Une fixture, pas une donnée du brasseur : elle n'est écrite nulle part (le brouillon local du wizard seulement).
import type { Recipe } from '../../../types';

export function recetteApercuEtapeHoublons(): Recipe {
  return {
    id: 'apercu-etape-houblons', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
    fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
    yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
  } as unknown as Recipe;
}
