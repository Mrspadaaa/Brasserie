import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BrewhouseSettings } from '../../src/ui/BrewhouseSettings';
import { BrewEquipmentSummary } from '../../src/ui/BrewEquipmentSummary';
import { practicalEquipment, practicalBrewingPreferences } from '../../src/domain/brewEquipment';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { SettingsModal } from '../../src/components/SettingsModal';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { Recipe } from '../../src/types';
import { brewerJobs } from '../../src/services/brewerJobs';
import { BrewerChat as brewerApi } from '../../src/services/brewerChat';
const rig = { ...defaultConfig.brewhouses[0], volumeL: 24, equipment: { ...practicalEquipment } };
afterEach(() => {
  cleanup();
  brewerJobs.stop(); // The app-wide poller must not outlive this browser fixture.
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
  it('garde le wizard utilisable en dev-local sans appeler le compagnon distant', async () => {
    const history = vi.spyOn(brewerApi, 'history');
    const activity = vi.spyOn(brewerApi, 'activity');
    const userKey = vi.spyOn(brewerApi, 'userKey');
    render(
      <BrewWizard
        localOnly
        config={defaultConfig}
        stockItems={[]}
        knownStyles={[]}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onCreateStockItem={vi.fn()}
        onLearnIngredient={vi.fn()}
        onSaveWaterSource={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Nom de la bière'), { target: { value: 'Test local' } });
    await act(async () => {});
    expect(screen.getByLabelText('Nom de la bière')).toHaveValue('Test local');
    expect(history).not.toHaveBeenCalled();
    expect(activity).not.toHaveBeenCalled();
    expect(userKey).not.toHaveBeenCalled();
  });
  it('conserve le volume habituel quand le repère de mousse change', () => {
    const change = vi.fn();
    render(<BrewhouseSettings profile={rig} onChange={change} />);
    const title = screen.getByText('Mon installation');
    expect(title.closest('details')).toHaveAttribute('open');
    fireEvent.change(screen.getByLabelText('Place pour la mousse (%)'), {
      target: { value: '25' }
    });
    expect(change.mock.calls[0][0].volumeL).toBe(24);
    expect(change.mock.calls[0][0].equipment.fermenterHeadspacePct).toBe(25);
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
    fireEvent.change(screen.getByLabelText('Place pour la mousse (%)'), {
      target: { value: '25' }
    });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' })));
    expect(saved.mock.calls[0][0].brewhouses[0].volumeL).toBe(24);
    expect(saved.mock.calls[0][0].brewhouses[0].equipment.fermenterHeadspacePct).toBe(25);
    fireEvent.change(screen.getByLabelText('Cuve · limite utile à chaud (L)'), {
      target: { value: '50' }
    });
    expect(screen.getByRole('button', { name: 'Sauvegarder' })).toBeDisabled();
  });
  it('les packs reflètent la coupe réellement consignée et un fermenteur trop plein est signalé', () => {
    const r = recipe({ volumeL: 30 }),
      s = brewState(r, { waterMix: { mash: { roL: 5 }, sparge: { roL: 2.3 } } });
    render(<BrewEquipmentSummary recipe={r} state={s} profile={rig} />);
    expect(screen.getByText('À revoir')).toBeVisible();
    expect(screen.getByText(/Répartis le surplus/)).toBeVisible();
    expect(screen.getByText(/Répartis le surplus/).closest('details')).toBeNull();
    fireEvent.click(screen.getByText('Repères et osmosée'));
    expect(screen.getByText('2 packs de 5 L d’osmosée')).toBeInTheDocument();
    expect(screen.getByText(/Garder 2,7 L/)).toBeInTheDocument();
    expect(screen.getByText(/Répartis le surplus/)).toBeInTheDocument();
  });
  it('montre l’appoint et permet de l’accepter sans ouvrir les détails', () => {
    const accept = vi.fn();
    const r = recipe();
    r.waterPlan!.spargeWaterL = 20;
    render(<BrewEquipmentSummary recipe={r} profile={{ ...rig, preferences: practicalBrewingPreferences }} onAcceptSpargeException={accept} />);
    expect(screen.getByText('Appoint nécessaire')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Bouilloire annexe : 2,6 L à chaud');
    expect(screen.getByRole('status').closest('details')).toBeNull();
    expect(screen.queryByText(/chauffes/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Prévoir cet appoint' }));
    expect(accept).toHaveBeenCalledOnce();
  });
  it('distingue un remplissage au-dessus du conseil de la capacité totale', () => {
    render(<BrewEquipmentSummary recipe={recipe({ volumeL: 26 })} profile={rig} />);
    expect(screen.getByText(/Remplissage au-dessus du repère de 24 L/)).toBeVisible();
    expect(screen.queryByText(/Le volume atteint la capacité totale/)).not.toBeInTheDocument();
    expect(screen.getByText('26 / 30 L')).toBeVisible();
  });
  it('conserve l’acceptation de l’appoint du brassin tant que le volume ne change pas', () => {
    const r = recipe({ installation: { spargeExceptionAccepted: true } });
    r.waterPlan!.spargeWaterL = 20;
    const { rerender } = render(<BrewEquipmentSummary recipe={r} state={brewState(r)} profile={{ ...rig, preferences: practicalBrewingPreferences }} />);
    expect(screen.getByText('Exception acceptée pour cette recette.')).toBeVisible();
    expect(screen.queryByText(/Confirme cet appoint/)).not.toBeInTheDocument();
    rerender(<BrewEquipmentSummary recipe={r} state={brewState(r, { additions: { 'water-sparge': { amount: 21 } } })} profile={{ ...rig, preferences: practicalBrewingPreferences }} />);
    expect(screen.queryByText('Exception acceptée pour cette recette.')).not.toBeInTheDocument();
    expect(screen.getByText(/Confirme cet appoint/)).toBeVisible();
  });
  it('garde le matériel du brassin figé et ne remplace pas l’eau absente par zéro', () => {
    const r = recipe({ volumeL: 26, waterPlan: undefined, brewhouse: { ...rig, equipment: { ...practicalEquipment, fermenterCapacityL: 40 } } });
    render(<BrewEquipmentSummary recipe={r} state={brewState(r)} profile={rig} />);
    expect(screen.getByText('26 / 40 L')).toBeVisible();
    expect(screen.getAllByText('À renseigner')).toHaveLength(2);
    expect(screen.queryByText('0 L')).not.toBeInTheDocument();
    expect(screen.queryByText(/Maische sous/)).not.toBeInTheDocument();
  });
});
