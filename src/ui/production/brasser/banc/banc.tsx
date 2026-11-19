/**
 * Banc de la voie recette (tour 3, T2B-1). Développement seulement : monte la modale « Brasser » sur une recette SIMULÉE dont le matériel
 * n'est pas figé (`?figee=1` : recette au matériel figé, pour comparer). Rien n'est lu ni écrit sur les vraies données : le stockage est
 * remplacé par une fixture « ZZ TEST — … » en mémoire. Aucun import depuis l'app : la page n'est atteinte que par son adresse.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../../../index.css';
import { initialiserTheme } from '../../../../theme/theme';
import { QuickActionModal } from '../../../../components/QuickActionModal';
import { StorageService, defaultConfig } from '../../../../services/storage';
import { practicalBrewingPreferences, practicalEquipment } from '../../../../domain/brewEquipment';
import { adaptRecipeEquipment } from '../../../../domain/adaptRecipeEquipment';
import type { Batch, BrewhouseProfile, Recipe } from '../../../../types';

initialiserTheme();
const q = new URLSearchParams(location.search);

const profil: BrewhouseProfile = {
  id: 'zz-rig', name: 'ZZ TEST — Royal Catering', volumeL: 24, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2,
  equipment: q.get('sans-materiel') ? undefined : { ...practicalEquipment }, preferences: q.get('sans-materiel') ? undefined : { ...practicalBrewingPreferences }
};
const config = { ...defaultConfig, brewhouses: [profil], activeBrewhouseId: profil.id };
const legacy: Recipe = {
  id: 'zz-legacy', name: 'ZZ TEST — Pale ancienne', style: 'Pale Ale', volumeL: 24, boilMin: 60, version: 1, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5,
  totalGristKg: 5, steps: [], notes: [],
  fermentables: [{ name: 'ZZ TEST — Pale', kind: 'grain', use: 'empatage', weightKg: 5, colorEbc: 6, potentialPpg: 36 }],
  hops: [{ name: 'ZZ TEST — Citra', stage: 'boil', weightG: 30, alpha: 12, timeMin: 60 }],
  yeast: { name: 'ZZ TEST — US-05', form: 'sèche', qty: 1, unit: 'sachet' },
  mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }], spargeType: 'batch' },
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }]
} as unknown as Recipe;
const recette = q.get('figee') ? adaptRecipeEquipment(legacy, profil, 24) : legacy;
const lots: Batch[] = [];

// Fixture en mémoire : le banc n'écrit rien. `addBatch` garde le lot pour que la confirmation d'écriture réussisse.
const S = StorageService as unknown as Record<string, unknown>;
S.getConfig = () => config;
S.getStocks = () => ({ rawMaterials: [], cleaning: [], equipment: [] });
S.getBatches = () => lots;
S.addBatch = (b: Batch) => { lots.push(structuredClone(b)); (window as unknown as { __lots: Batch[] }).__lots = lots; };
S.getUiState = (_k: string, fallback: unknown) => fallback;
S.setUiState = () => undefined;
S.subscribe = () => () => undefined;
import('../../../../services/firestoreRepo').then(({ FirestoreRepo }) => {
  (FirestoreRepo as unknown as Record<string, unknown>).waitForDocument = async (_n: string, id: string) => lots.find((b) => b.id === id);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QuickActionModal isOpen initialScreen="brew-batch" initialRecipeId={recette.id} recipes={[recette]}
    onClose={() => { document.title = 'ferme'; }} onBatchCreated={() => { document.title = 'planifie'; }} />
);
