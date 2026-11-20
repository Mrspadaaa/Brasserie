/**
 * Banc de la voie f1 (T3B-6, T3B-11, T3B-12) : la fiche de la recette « Milk Stout » avec les défauts vus en ligne le 20.11,
 * sur des DONNÉES SIMULÉES (jamais le compte du brasseur) : accents perdus dans les noms, Lactose et Whirlfloc rangés parmi les houblons,
 * aucune durée d'ébullition enregistrée, un brassin LOT-001 lié par `batchRef` (sans `recipeRef`). Le stock simulé porte les noms justes.
 * Le banc montre le code ACTUEL ; l'« avant » est la capture du rapport en ligne (RAPPORT-4, 20.11).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import '/src/index.css';
import { RecipePage } from '/src/pages/RecipePage';
import { StorageService, defaultConfig } from '/src/services/storage';
import { yeastFlowRecipe } from '/tests/fixtures/yeastRecipeFlow';
import type { Batch, Recipe } from '/src/types';

const NOMS_DU_STOCK = ['Maris Otter', 'Röstgerste (orge torréfiée)', 'Caramünch Typ 2', 'Flocons d’avoine', 'Target', 'East Kent Goldings'];
(StorageService as any).getStocks = () => ({
  rawMaterials: NOMS_DU_STOCK.map((name, i) => ({ id: `s${i}`, ref: `S${i}`, name, category: i < 4 ? 'Malt' : 'Houblon', quantity: 5, unit: 'kg' })),
  cleaning: [], equipment: [], kegs: [],
});

const base = yeastFlowRecipe() as Recipe & { boilMin?: number };
delete base.boilMin;
const recette = {
  ...base, id: 'rec-ms', name: 'Milk Stout', style: 'Milk Stout', volumeL: 30, ogTarget: 1.062, fgTarget: 1.015, abvTarget: 6.3 /* ASBC Beer-4 pour 1,062 → 1,015 : 6,28 % (la fixture de base portait 6,49 : k2, ABV 6,5 % incohérent) */, batchRef: 'LOT-001', adjuncts: [],
  fermentables: [
    { name: 'Maris Otter', weightKg: 5.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 },
    { name: 'Rstgerste (orge torrfie)', weightKg: 0.4, kind: 'grain', use: 'empatage', potentialPpg: 30, colorEbc: 1100 },
    { name: 'Caramnch Typ 2', weightKg: 0.6, kind: 'grain', use: 'empatage', potentialPpg: 33, colorEbc: 120 },
  ],
  hops: [
    { name: 'Target', weightG: 35, alpha: 11.3, stage: 'boil', timeMin: 60 },
    { name: 'East Kent Goldings', weightG: 20, alpha: 5.5, stage: 'boil', timeMin: 60 },
    { name: 'Lactose', weightG: 300, stage: 'boil', timeMin: 15 },
    { name: 'Whirlfloc', weightG: 1, stage: 'boil', timeMin: 15 },
  ],
} as unknown as Recipe;
const lot = { id: 'LOT-001', name: 'Milk Stout', style: 'Milk Stout', volumeL: 30, status: 'termine', brewDate: '01.05.2026', og: '1.062' } as Batch;
const rien = () => {};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RecipePage recipe={recette} batches={[lot]} config={defaultConfig} onClose={rien} onEdit={rien} onDuplicate={rien} onDelete={rien} onBrew={rien} onOpenBatch={rien} />
);
