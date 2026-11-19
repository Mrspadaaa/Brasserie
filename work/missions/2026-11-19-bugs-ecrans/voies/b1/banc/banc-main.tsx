// Banc local de la voie b1 (dev seulement, jamais livré, données SIMULÉES) : monte la VRAIE feuille BatchDetailSheet, ou la VRAIE courbe
// FermentationTemperatureChart, sans passer par le carnet (vide sous ?dev-local). ?vue=feuille|courbe&theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { BatchDetailSheet } from '../../../../../../src/ui/BatchDetailSheet';
import { FermentationTemperatureChart } from '../../../../../../src/ui/FermentationTemperatureChart';
import type { Batch } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }

// Simulé : « ZZ TEST — Hazy IPA », 19,8 L visés, 57,9 L conditionnés (BR-115), densité à saisir pour BR-114.
const lot = {
  id: 'ZZ-LOT-004', name: 'ZZ TEST — Hazy IPA', style: 'Hazy IPA', volumeL: 19.8, volumeBrewedL: 19.8, volumePackagedL: Number(q.get('cond') ?? 57.9),
  brewDate: '01.10.2026', status: 'conditionne', og: '1.060', fg: '1.012',
  stockAccountingVersion: 1,
  stockConsumption: { appliedAt: '2026-10-01', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] },
} as unknown as Batch;

const vue = q.get('vue') ?? 'feuille';
createRoot(document.getElementById('root')!).render(
  vue === 'courbe'
    ? <div className="mx-auto max-w-3xl p-3">
        <FermentationTemperatureChart
          steps={[{ name: 'Fermentation primaire', tempC: 20.5, days: 5 }, { name: 'Montée de fin', tempC: 22, days: 2 }, { name: 'Maturation', tempC: 4, days: 2 }]}
          bands={[{ min: 18, max: 22 } as never, undefined, undefined]} pitchTempC={19} />
      </div>
    : <BatchDetailSheet batch={lot} initialSection={(q.get('section') as never) ?? 'measurements'} onClose={() => undefined} />,
);
