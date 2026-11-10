// Banc local (dev seulement, jamais livré) : monte la VRAIE page `RecipePage` sur une recette de démonstration SIMULÉE.
// Pourquoi : sous `?dev-local` le carnet est vide (Firestore refuse sans jeton : « Recettes (0) » après « Enregistrer »), la fiche n'est donc pas atteignable
// par le parcours. Cette page contourne seulement la lecture du carnet ; la fiche, ses calculs et ses styles sont ceux de l'app.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../src/index.css';
import { RecipePage } from '../../../../../src/pages/RecipePage';
import { recetteApercuIdentite } from '../../../../../src/ui/identite/apercuDev';
import { recipe as recetteCompagnon } from '../../../../../tests/fixtures/brewCompanion';
import { recetteApercuEtapeLevure } from '../../../../../src/ui/etapeLevure/apercuDev';
import type { AppConfig } from '../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }

// Valeurs de DÉMONSTRATION, simulées : la recette de l'étape Identité plus ce que l'assistant écrit à l'enregistrement.
const recette = {
  ...recetteApercuIdentite(),
  id: 'banc-fiche', ref: 'REC-BANC', version: 1,
  mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }] },
  fermentation: [
    { name: 'Fermentation primaire', tempC: 19, days: 10 },
    { name: 'Maturation', tempC: 4, days: 5 },
  ],
  yeast: { name: 'SafAle US-05', form: 'sèche', qty: 2, unit: 'sachet', hopIndexId: 'fermentis-us05' },
  waterPlan: undefined,
};

createRoot(document.getElementById('root')!).render(
  <div className="mx-auto max-w-3xl p-2">
    <RecipePage
      recipe={(q.get('fixture') === 'companion' ? recetteCompagnon() : q.get('fixture') === 'plage' ? { ...recetteApercuEtapeLevure(), id: 'banc-plage', name: 'US-05 sans dose' } : recette) as never}
      batches={[]}
      config={{ brewhouses: [], stockItems: [], clients: [] } as unknown as AppConfig}
      onClose={() => undefined} onEdit={() => undefined} onDuplicate={() => undefined} onDelete={() => undefined} onBrew={() => undefined} onOpenBatch={() => undefined}
    />
  </div>,
);
