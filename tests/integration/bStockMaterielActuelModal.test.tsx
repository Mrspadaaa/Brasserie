// Mission levure-port, voie b-stock (09.11) : AM-47 sur l'écran « Préparer un brassin ».
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

describe('AM-47 — Préparer un brassin : le volume de la recette contre le matériel actuel', () => {
  it('avertit, propose d’adapter, ne change pas le volume seul et ne bloque pas le bouton', () => {
    render(<QuickActionModal isOpen recipes={[recette]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    expect(screen.getByLabelText('Volume du brassin')).toHaveValue('60');
    const alerte = screen.getByRole('status', { name: /matériel actuel/i });
    expect(alerte).toHaveTextContent(/Sur ton matériel actuel \(Mon installation\)/);
    expect(screen.getByRole('button', { name: 'Créer le brassin à brasser' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /Adapter à \d+(,\d)? L/ }));
    expect(Number(String((screen.getByLabelText('Volume du brassin') as HTMLInputElement).value).replace(',', '.'))).toBeLessThan(30);
    expect(screen.queryByRole('status', { name: /matériel actuel/i })).toBeNull();
  });
});
