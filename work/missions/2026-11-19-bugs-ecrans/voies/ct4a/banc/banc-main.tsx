// Banc local de la voie ct4a (dev seulement, jamais livré, données SIMULÉES) : monte la VRAIE feuille BatchDetailSheet sur un brassin en fermentation
// « ZZ Stout export » (LOT-041 simulé : 20 L visés, 29 L brassés, US-05, FG non écrite dans la recette). ?theme=clair|cave&auj=1 (un relevé du jour)
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { BatchDetailSheet } from '../../../../../../src/ui/BatchDetailSheet';
import type { Batch } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }

const JOUR = 86400000;
const maintenant = Date.now();
const suisse = (t: number) => { const d = new Date(t); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
const levure = maintenant - 8 * JOUR;
const gravityLog: unknown[] = [
  { date: suisse(maintenant - 7 * JOUR), sg: 1.058, tempC: 19, notes: 'Cuve 19 °C' },
  { date: suisse(maintenant - 5 * JOUR), sg: 1.03, tempC: 20, notes: 'Cuve 20 °C' },
  { date: suisse(maintenant - 2 * JOUR), sg: 1.016, tempC: 20, notes: 'Cuve 20 °C' },
  ...(q.get('auj') === '1' ? [{ date: suisse(maintenant), sg: 1.012, tempC: 20, notes: 'Cuve 20 °C' }] : []),
];

// Simulé : 20 L visés, 29 L brassés ; la recette n'écrit pas de FG (la levure US-05 en donne une plage).
const lot = {
  id: 'LOT-041', name: 'ZZ Stout export', style: 'Stout export', volumeL: 20, volumeBrewedL: 29, brewDate: suisse(levure), status: 'fermentation',
  og: '1,064', gravityLog, stockAccountingVersion: 1,
  stockConsumption: { appliedAt: '2026-10-01', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] },
  brewDay: { pitchedAt: levure, steps: [], currentIndex: 0 },
  recipeSnapshot: {
    name: 'ZZ Stout export', style: 'Stout export', volumeL: 20, ogTarget: 1.064, efficiencyPct: 75, capturedAt: '2026-11-01', steps: [], notes: [],
    fermentables: [], hops: [],
    yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 3, unit: 'sachet' },
    fermentation: [{ kind: 'primaire', name: 'Primaire', days: 6, tempC: 19 }, { kind: 'garde', name: 'Garde', days: 7, tempC: 2 }],
  },
} as unknown as Batch;

createRoot(document.getElementById('root')!).render(<BatchDetailSheet batch={lot} initialSection="measurements" onClose={() => undefined} />);
