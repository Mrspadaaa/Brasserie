import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BrewhouseSettings } from '../../src/ui/BrewhouseSettings';
import { BrewEquipmentSummary } from '../../src/ui/BrewEquipmentSummary';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { SettingsModal } from '../../src/components/SettingsModal';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { Recipe } from '../../src/types';
const rig = { ...defaultConfig.brewhouses[0], volumeL: 24, equipment: { ...practicalEquipment } };
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('Réglages matériels discrets', () => {
  it('propose une adaptation explicite de la recette existante au volume utile', () => {
    const r = { ...recipe(), id: 'old', volumeL: 30 } as Recipe;
    render(
      <BrewWizard
        seed={{ recipe: r }}
        config={{ ...defaultConfig, brewhouses: [rig], activeBrewhouseId: rig.id }}
        stockItems={[]}
        knownStyles={[]}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onCreateStockItem={vi.fn()}
        onSaveWaterSource={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Adapter la recette à 24 L' }));
    expect(
      screen
        .getAllByRole('status')
        .map((e) => e.textContent)
        .join('|')
    ).toContain('Recette adaptée à 24 L');
    expect(
      screen.queryByRole('button', { name: 'Adapter la recette à 24 L' })
    ).not.toBeInTheDocument();
  });
  it('reste replié et recalcule le volume utile lorsque la place pour la mousse change', () => {
    const change = vi.fn();
    render(<BrewhouseSettings profile={rig} onChange={change} />);
    const title = screen.getByText('Matériel, capacités et eau');
    expect(title.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(title);
    fireEvent.change(screen.getByLabelText('Place pour la mousse (%)'), {
      target: { value: '25' }
    });
    expect(change.mock.calls[0][0].volumeL).toBe(22.5);
  });
  it('enregistre le profil de l’onglet Brasserie et empêche une limite utile supérieure à la cuve', async () => {
    vi.spyOn(StorageService, 'confirmPendingWrites').mockResolvedValue();
    const saved = vi.spyOn(StorageService, 'saveConfig').mockImplementation(() => {});
    const cfg = { ...defaultConfig, brewhouses: [rig], activeBrewhouseId: rig.id };
    render(
      <SettingsModal
        isOpen
        onClose={vi.fn()}
        config={cfg}
        onConfigUpdated={vi.fn()}
        onOpenAuditLogs={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Brasserie/ }));
    fireEvent.click(screen.getByText('Matériel, capacités et eau'));
    fireEvent.change(screen.getByLabelText('Place pour la mousse (%)'), {
      target: { value: '25' }
    });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' })));
    expect(saved.mock.calls[0][0].brewhouses[0].volumeL).toBe(22.5);
    fireEvent.change(screen.getByLabelText('Cuve · limite utile à chaud (L)'), {
      target: { value: '50' }
    });
    expect(screen.getByRole('button', { name: 'Sauvegarder' })).toBeDisabled();
  });
  it('les packs reflètent la coupe réellement consignée et un fermenteur trop plein est signalé', () => {
    const r = recipe({ volumeL: 30 }),
      s = brewState(r, { waterMix: { mash: { roL: 5 }, sparge: { roL: 2.3 } } });
    render(<BrewEquipmentSummary recipe={r} state={s} profile={rig} />);
    fireEvent.click(screen.getByText('Mon matériel'));
    expect(screen.getByText('Volume à revoir')).toBeInTheDocument();
    expect(screen.getByText('2 packs de 5 L d’osmosée')).toBeInTheDocument();
    expect(screen.getByText(/Garder 2.7 L/)).toBeInTheDocument();
    expect(screen.getByText(/Répartis le surplus/)).toBeInTheDocument();
  });
});
