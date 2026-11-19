// Banc local de la voie r1 (dev seulement, jamais livré, données SIMULÉES) : monte la VRAIE fiche recette et le VRAI carnet Recettes.
// ?vue=fiche|carnet&theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { RecipePage } from '../../../../../../src/pages/RecipePage';
import { CarnetRecettes } from '../../../../../../src/ui/production/recettes/CarnetRecettes';
import { defaultConfig } from '../../../../../../src/services/storage';
import { fullRecipe } from '../../../../../../tests/fixtures/fullRecipe';
import type { Recipe } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }

// Simulé : « ZZ TEST — Pale US-05 », SafAle US-05 11,5 g, houblons Galaxy (sans dose pour la Hefe).
const us05: Recipe = {
  ...structuredClone(fullRecipe), id: 'ZZ-R1', name: 'ZZ TEST — Pale US-05', style: 'Pale Ale', styleRef: undefined, nolo: undefined,
  yeastDesign: undefined, yeastGuide: undefined, waterPlan: undefined, volumeL: 20, boilMin: 60, ogTarget: undefined, fgTarget: undefined,
  abvTarget: undefined, ibuTarget: undefined, colorEbc: undefined,
  fermentables: [{ name: 'Pale Ale', weightKg: 4.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 7 },
    { name: 'Crystal 150', weightKg: 0.4, kind: 'grain', use: 'empatage', potentialPpg: 34, colorEbc: 150 }] as Recipe['fermentables'],
  yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g', pitchTempC: 18 } as Recipe['yeast'],
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 18, days: 10 }],
  hops: [{ name: 'Galaxy', stage: 'boil', weightG: 20, alpha: 17.2, timeMin: 60 },
    { name: 'Citra', stage: 'whirlpool', weightG: 30, alpha: 12.5, timeMin: 20, tempC: 78 },
    { name: 'Citra', stage: 'dryHop', weightG: 40, alpha: 0, dayOffset: 3 }]
};
const hefe: Recipe = { ...us05, id: 'ZZ-R2', name: 'ZZ TEST — Hefe sans dose', style: 'Hefeweizen', hops: [{ name: 'Galaxy', stage: 'boil', weightG: 0, alpha: 17.2, timeMin: 60 }] };
const rien = () => undefined;

const vue = q.get('vue') ?? 'fiche';
createRoot(document.getElementById('root')!).render(
  vue === 'carnet'
    ? <CarnetRecettes recipes={[us05, hefe]} batches={[]} onOpenRecipe={rien} onEditRecipe={rien} />
    : <RecipePage recipe={q.get('r') === 'hefe' ? hefe : us05} batches={[]} config={defaultConfig} onClose={rien} onEdit={rien} onDuplicate={rien} onDelete={rien} onBrew={rien} onOpenBatch={rien} />
);
