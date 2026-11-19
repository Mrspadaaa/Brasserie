// Banc local de la voie x1 (dev seulement, jamais livré, données SIMULÉES) : monte la VRAIE fiche recette (RecipePage) pour BR-98.
// ?theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { RecipePage } from '../../../../../../src/pages/RecipePage';
import { defaultConfig } from '../../../../../../src/services/storage';
import { fullRecipe } from '../../../../../../tests/fixtures/fullRecipe';
import type { Recipe } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }

// Simulé : « ZZ TEST — Double IPA », houblons Galaxy et Citra.
const dipa: Recipe = {
  ...structuredClone(fullRecipe), id: 'ZZ-X1', name: 'ZZ TEST — Double IPA', style: 'Double IPA', styleRef: undefined, nolo: undefined,
  yeastDesign: undefined, yeastGuide: undefined, waterPlan: undefined, volumeL: 20, boilMin: 60,
  hops: [{ name: 'Galaxy', stage: 'boil', weightG: 20, alpha: 17.2, timeMin: 60 }, { name: 'Citra', stage: 'dryHop', weightG: 60, alpha: 12.5, dayOffset: 3 }]
};
const rien = () => undefined;
createRoot(document.getElementById('root')!).render(
  <RecipePage recipe={dipa} batches={[]} config={defaultConfig} onClose={rien} onEdit={rien} onDuplicate={rien} onDelete={rien} onBrew={rien} onOpenBatch={rien} />
);
