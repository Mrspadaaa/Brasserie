// Mission levure-port, voie b-stock (09.11) : AM-47 sur l'écran « Préparer un brassin ».
// 14.11, port uv4 (mission atelier) : le brasseur a choisi uv4, qui retire l'avertissement de matériel au lancement ; le moteur n'a pas de contenance de cuve
// (`kettleCapacityL`) à comparer. Le volume de la recette reste repris tel quel, sur la règle, sans alerte ni blocage. `domain/materielActuel.ts` et son test unitaire restent.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { GoogleDriveService } from '../../src/services/googleDriveService';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import type { AppConfig, BrewhouseProfile, Recipe } from '../../src/types';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
const actuel: BrewhouseProfile = { id: 'perso', name: 'Mon installation', volumeL: 24, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences } };
const recette = { id: 'R', name: 'Pale Ale', style: 'Pale Ale', volumeL: 60, boilMin: 60, fermentables: [{ name: 'Pils', weightKg: 12, kind: 'grain', use: 'empatage' }], hops: [], brewhouse: { ...actuel, volumeL: 100 } } as unknown as Recipe;
const config = { fiscal: { isTvaRegistered: false }, activeBrewhouseId: 'perso', brewhouses: [actuel] } as unknown as AppConfig;

beforeEach(() => {
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'getUiState').mockImplementation((_k, fallback) => fallback);
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Nouveau brassin (uv4) : le volume de la recette, sans avertissement de matériel', () => {
  it('reprend le volume de la recette sur la règle, ne montre aucune alerte AM-47 et ne bloque pas le lancement', () => {
    render(<QuickActionModal isOpen recipes={[recette]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    expect(screen.getByLabelText('Volume du brassin')).toHaveValue('60');
    expect(screen.queryByRole('status', { name: /matériel actuel/i })).toBeNull();
    expect(screen.queryByText(/Sur ton matériel actuel/)).toBeNull();
    expect(screen.getByRole('button', { name: /^Lancer à 60 L$/ })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Volume du brassin'), { target: { value: '30' } });
    expect(screen.getByRole('button', { name: /^Lancer à 30 L$/ })).toBeEnabled();
  });
});
