// Banc local de la voie ct4a (dev seulement, jamais livré, données SIMULÉES) : monte le VRAI assistant de recette (BrewWizard) sur la recette de test
// « Weissbier essai girofle » avec une levure sèche US-05. ?theme=clair|cave&qty=1|none (1 sachet, ou dose non écrite).
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { BrewWizard } from '../../../../../../src/pages/BrewWizard';
import { defaultConfig } from '../../../../../../src/services/storage';
import { yeastFlowRecipe } from '../../../../../../tests/fixtures/yeastRecipeFlow';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }

const base = yeastFlowRecipe();
const sansDose = q.get('qty') === 'none';
const yeast = { ...base.yeast, name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', pitching: undefined, qty: sansDose ? undefined : 1, unit: sansDose ? undefined : 'sachet' };
const noop = () => undefined;

createRoot(document.getElementById('root')!).render(
  <BrewWizard draftKey="banc-ct4a:REC-CT4A" seed={{ recipe: { ...base, id: 'REC-CT4A', name: 'ZZ Weissbier essai', yeast } as never }}
    config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={noop} onSave={noop} onCreateStockItem={noop} onLearnIngredient={noop} onSaveWaterSource={noop} />
);
