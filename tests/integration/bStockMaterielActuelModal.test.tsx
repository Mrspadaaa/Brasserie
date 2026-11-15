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

describe('Nouveau brassin (uv4) : volume de la brasserie, capacités lues, sans alerte', () => {
  it('part du volume de la brasserie, lit cuve et fermenteur sans alerte AM-47, et « ↻ N L » ramène à la recette', () => {
    render(<QuickActionModal isOpen recipes={[recette]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    expect(screen.getByLabelText('Volume du brassin')).toHaveValue('24'); // la brasserie « perso », pas les 60 L de la recette
    // Capacités connues (practicalEquipment) : lues en neutre, ni rouge ni alerte.
    expect(screen.getByText(/^cuve/)).toHaveTextContent('cuve 45 L');
    expect(screen.getByText(/^fermenteur/)).toHaveTextContent('fermenteur 30 L');
    expect(screen.queryByText(/contenance à renseigner/)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(/Sur ton matériel actuel/)).toBeNull();
    expect(screen.getByRole('button', { name: /^Lancer à 24 L$/ })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /^Volume de la recette, 60 L/ }));
    expect(screen.getByLabelText('Volume du brassin')).toHaveValue('60');
    // Plus que le fermenteur (30 L) : aucun refus, aucune alerte (AM-47 retiré, la capacité reste lisible).
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: /^Lancer à 60 L$/ })).toBeEnabled();
  });

  it('au-delà du fermenteur : dit en mots, ton attention, sans « < » ni refus (passe 3)', () => {
    render(<QuickActionModal isOpen recipes={[recette]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    fireEvent.click(screen.getByRole('button', { name: /^Volume de la recette, 60 L/ }));
    const ligne = screen.getByText(/^fermenteur/);
    expect(ligne).toHaveTextContent('fermenteur 30 L, trop petit pour 60 L');
    expect(ligne.textContent).not.toContain('<');
    expect(ligne.closest('p')).toHaveClass('text-attention');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('« Ce qui manque » : liste sur place des ingrédients dont le stock est sous la dose à N L, lecture seule (passe 3)', () => {
    vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [{ name: 'Pils', currentStock: 3, unit: 'kg' }], cleaning: [], equipment: [] } as unknown as ReturnType<typeof StorageService.getStocks>);
    render(<QuickActionModal isOpen recipes={[recette]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    expect(screen.queryByRole('region', { name: 'Ce qui manque' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ce qui manque/ }));
    const liste = screen.getByRole('region', { name: 'Ce qui manque' });
    // 12 kg pour 60 L, à 24 L : 4,8 kg ; en stock 3 kg ; il manque 1,8 kg.
    expect(liste).toHaveTextContent('Pils');
    expect(liste).toHaveTextContent('4,8 kg');
    expect(liste).toHaveTextContent('en stock 3 kg');
    expect(liste).toHaveTextContent('manque 1,8 kg');
    expect(StorageService.setUiState).not.toHaveBeenCalled();
  });

  it('« Ce qui manque » : « Rien ne manque » quand le stock couvre la dose', () => {
    vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [{ name: 'Pils', currentStock: 20, unit: 'kg' }], cleaning: [], equipment: [] } as unknown as ReturnType<typeof StorageService.getStocks>);
    render(<QuickActionModal isOpen recipes={[recette]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    fireEvent.click(screen.getByRole('button', { name: /Ce qui manque/ }));
    expect(screen.getByRole('region', { name: 'Ce qui manque' })).toHaveTextContent('Rien ne manque pour 24 L');
  });

  it('sans capacité renseignée : « contenance à renseigner › », pas de fermenteur inventé', () => {
    const sansMateriel = { ...config, brewhouses: [{ ...actuel, equipment: undefined }] } as unknown as AppConfig;
    vi.spyOn(StorageService, 'getConfig').mockReturnValue(sansMateriel);
    render(<QuickActionModal isOpen recipes={[recette]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    expect(screen.getByText(/contenance à renseigner/)).toBeInTheDocument();
    expect(screen.queryByText(/^fermenteur/)).toBeNull();
  });

  it('« contenance à renseigner › » envoie l’événement vers Réglages et ferme la modale quand App le prend (sinon elle reste)', () => {
    vi.spyOn(StorageService, 'getConfig').mockReturnValue({ ...config, brewhouses: [{ ...actuel, equipment: undefined }] } as unknown as AppConfig);
    const prend = vi.fn((e: Event) => e.preventDefault());
    window.addEventListener('affinee:ouvrir-reglages', prend);
    const close = vi.fn();
    render(<QuickActionModal isOpen recipes={[recette]} onClose={close} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    fireEvent.click(screen.getByRole('button', { name: /contenance de la cuve/ }));
    window.removeEventListener('affinee:ouvrir-reglages', prend);
    expect(prend).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /contenance de la cuve/ })); // sans écouteur : rien ne se ferme
    expect(close).toHaveBeenCalledOnce();
  });

  it('« Ce qui manque » envoie l’événement annulable vers Stocks › Courses (App l’écoute)', () => {
    const vu = vi.fn((e: Event) => e.preventDefault());
    window.addEventListener('affinee:ouvrir-stocks', vu);
    const close = vi.fn();
    render(<QuickActionModal isOpen recipes={[recette]} onClose={close} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    // Passe 3 : « Ce qui manque » déplie la liste sur place ; le lien Stocks › Courses est dedans.
    fireEvent.click(screen.getByRole('button', { name: /Ce qui manque/ }));
    expect(screen.getByRole('region', { name: 'Ce qui manque' })).toBeVisible();
    expect(vu).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Stocks › Courses/ }));
    window.removeEventListener('affinee:ouvrir-stocks', vu);
    expect(vu).toHaveBeenCalledOnce();
    expect(StorageService.setUiState).toHaveBeenCalledWith('stocks_subtab', 'courses');
    expect(close).toHaveBeenCalledOnce();
  });
});
