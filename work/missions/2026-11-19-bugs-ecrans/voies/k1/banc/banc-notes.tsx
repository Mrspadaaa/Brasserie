// Banc local de la voie k1 (dev seulement, jamais livré, données SIMULÉES) : monte la VRAIE page BrewDayPage sur un brassin « ZZ TEST »
// dont le texte de notes est figé avec des points (RL-13) ; l'écran doit les lire à la virgule. ?theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { BrewDayPage } from '../../../../../../src/pages/BrewDayPage';
import { defaultConfig } from '../../../../../../src/services/storage';
import type { AppConfig, Batch } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }

const config = { ...defaultConfig, activeBrewhouseId: 'bh-30' } as AppConfig;
const lot = {
  id: 'ZZ-LOT-007', name: 'ZZ TEST — Hazy IPA', style: 'Hazy IPA', volumeL: 22.8, volumeBrewedL: 22.8,
  recipeSnapshot: {
    id: 'ZZ-R1', name: 'ZZ TEST — Hazy IPA', totalGristKg: 5.2, ogTarget: 1.031, boilMin: 60, fermentables: [], hops: [],
    instructions: 'OG 1.031 · 11.3 % AA · ensemencement 27.5 °C · Empâtage 22.8 L · enregistré le 05.09.2026',
    waterPlan: { sourceId: 'reseau', diRatioPct: 0, mashWaterL: 22.8, spargeWaterL: 10, mash: {}, sparge: {}, acid: { id: 'lactique', mash: 0, sparge: 0 }, targetPh: 5.4 },
  },
  brewDay: {
    steps: [
      { id: 'eau', label: 'Eau et sels', durationMin: 10 },
      { id: 'concassage', label: 'Concassage', durationMin: 10 },
      { id: 'mash-0', label: 'Saccharification', durationMin: 60, tempC: 66 },
      { id: 'mash-out', label: 'Filtration', durationMin: 30 },
    ],
    currentIndex: 0,
  },
} as unknown as Batch;

createRoot(document.getElementById('root')!).render(
  <BrewDayPage batch={lot} config={config} onClose={() => undefined} onSave={() => undefined} onFinish={() => undefined} />,
);
