import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KegBoard } from '../../src/ui/KegBoard';
import { KegSheet } from '../../src/ui/KegSheet';
import { EquipmentList } from '../../src/ui/EquipmentList';
import { EquipmentSheet } from '../../src/ui/EquipmentSheet';
import { StorageService } from '../../src/services/storage';
import type { Batch, EquipmentItem, KegItem } from '../../src/types';

vi.mock('../../src/services/storage', () => ({
  StorageService: { updateKeg: vi.fn(), deleteKeg: vi.fn() }
}));

const fullKeg: KegItem = {
  id: 'F-001', capacityL: 30, state: 'plein', batchRef: 'B-IPA',
  beerName: 'IPA du lac', style: 'IPA', fillDate: '10.09.2026',
  clientName: 'Café de la Rive', notes: 'Joint remplacé'
};

function board(kegs: KegItem[], batches: Batch[] = []) {
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}>
    <KegBoard kegs={kegs} batches={batches}/>
  </VirtuosoMockContext.Provider>;
}

const equipment: EquipmentItem[] = [
  { id: '1', ref: 'EQ-1', name: 'Cuve 50 L', category: 'Brassage', state: 'Bon', maintenance: 'Rincer après usage' },
  { id: '2', ref: 'EQ-2', name: 'Pompe de transfert', category: 'Brassage', state: 'À réparer', maintenance: 'Remplacer le joint', notes: 'Couper le courant avant démontage', purchaseDate: '05.03.2025', purchasePrice: 128.5 },
  { id: '3', ref: 'EQ-3', name: 'pH-mètre de précision', category: 'Mesure', state: 'À entretenir', maintenance: 'Étalonner avant brassage' }
];
const batch = (id: string, status: string, extra = {}): Batch => ({ id, name: `Bière ${id}`, style: 'Pale Ale', status, ...extra } as Batch);

beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('parc de fûts et matériel compacts', () => {
  it.each([
    ['lavage', undefined, false], ['propre', 'ancien', true],
    ['plein', 'constructor', false], ['livre', null, true]
  ] as const)('répare explicitement un état inconnu en %s sans perdre le contenu (%s, coarse=%s)', async (chosen, unknown, coarse) => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: coarse && query === '(pointer: coarse)', media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }));
    // Le stockage ne valide pas les anciens états à la lecture.
    const imported = { ...fullKeg, state: unknown } as unknown as KegItem;
    const view = render(board([imported, { id: 'F-002', capacityL: 20, state: 'propre' }]));
    expect(await screen.findByRole('button', { name: 'Ouvrir le fût F-001' })).toHaveAccessibleDescription(/30 L.*IPA du lac.*Café de la Rive.*État inconnu/);
    expect(screen.getByRole('radio', { name: 'À laver · 0' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Propres · 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'État inconnu · 1' }));
    expect(screen.queryByRole('button', { name: 'Ouvrir le fût F-002' })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le fût F-001' }));
    const dialog = screen.getByRole('dialog', { name: 'Fût F-001' });
    for (const value of ['IPA du lac', 'B-IPA', '10.09.2026', 'Café de la Rive', 'Joint remplacé']) expect(dialog).toHaveTextContent(value);
    const state = within(dialog).getByRole('combobox', { name: 'État réel du fût' });
    expect(state).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Enregistrer l’état' })).toBeDisabled();
    fireEvent.keyDown(state, { key: 'Enter', ctrlKey: true });
    expect(StorageService.updateKeg).not.toHaveBeenCalled();
    expect(state).toHaveFocus();
    expect(state).toHaveAttribute('aria-invalid', 'true');
    expect(state).toHaveAccessibleDescription('Choisis l’état du fût avant d’enregistrer.');
    fireEvent.change(state, { target: { value: chosen } });
    expect(state).toHaveAttribute('aria-invalid', 'false');
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(StorageService.updateKeg).not.toHaveBeenCalled();
    fireEvent.keyDown(state, { key: 'Enter', ctrlKey: true });
    expect(StorageService.updateKeg).toHaveBeenCalledTimes(1);
    expect(StorageService.updateKeg).toHaveBeenCalledWith({ ...fullKeg, state: chosen });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    view.rerender(board([{ ...fullKeg, state: chosen }]));
    expect(screen.getByRole('radio', { name: 'État inconnu · 0' })).toBeChecked();
    expect(screen.getByText('Aucun fût « État inconnu »')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Voir tous les fûts' }));
    expect(await screen.findByRole('button', { name: 'Ouvrir le fût F-001' })).toBeVisible();
  });

  it('annule le choix d’un état inconnu et conserve les données synchronisées pendant sa correction', async () => {
    const imported = { ...fullKeg, state: undefined } as unknown as KegItem;
    const view = render(board([imported]));
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le fût F-001' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'État réel du fût' }), { target: { value: 'plein' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(StorageService.updateKeg).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le fût F-001' }));
    const state = screen.getByRole('combobox', { name: 'État réel du fût' });
    expect(state).toHaveValue('');
    fireEvent.change(state, { target: { value: 'livre' } });
    const synced = { ...imported, clientName: 'Auberge du Lac', notes: 'Contrôle du joint effectué' };
    view.rerender(board([synced]));
    expect(screen.getByRole('dialog')).toHaveTextContent('Auberge du Lac');
    expect(screen.getByRole('dialog')).toHaveTextContent('Contrôle du joint effectué');
    fireEvent.keyDown(state, { key: 'Enter', ctrlKey: true });
    expect(StorageService.updateKeg).toHaveBeenCalledTimes(1);
    expect(StorageService.updateKeg).toHaveBeenCalledWith({ ...synced, state: 'livre' });
  });

  it('conserve le contenu du fût livré puis le détache seulement au retour à laver', async () => {
    const view = render(board([fullKeg]));
    const kegOpener = await screen.findByRole('button', { name: /F-001/ });
    expect(kegOpener).toHaveAccessibleDescription(/30 L.*IPA du lac.*Plein/);
    fireEvent.click(kegOpener);
    fireEvent.click(screen.getByRole('button', { name: /Passer à « Livré »|Livrer le fût/ }));
    expect(StorageService.updateKeg).toHaveBeenLastCalledWith({ ...fullKeg, state: 'livre' });

    view.rerender(board([{ ...fullKeg, state: 'livre' }]));
    fireEvent.click(await screen.findByRole('button', { name: /F-001/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('IPA du lac');
    fireEvent.click(screen.getByRole('button', { name: /Passer à « À laver »|Retour à laver/ }));
    expect(StorageService.updateKeg).toHaveBeenLastCalledWith({
      ...fullKeg, state: 'lavage', batchRef: undefined, beerName: undefined,
      style: undefined, fillDate: undefined, clientName: undefined
    });
  });

  it('combine filtre des fûts, recherche du client et récupération après résultat vide', async () => {
    render(board([fullKeg, { id: 'F-002', capacityL: 20, state: 'propre' }, { ...fullKeg, id: 'F-003', state: 'livre', clientName: 'Café des Marées' }]));
    expect(await screen.findByRole('button', { name: 'Ouvrir le fût F-001' })).toBeVisible();
    const delivered = screen.getByRole('radio', { name: 'Livrés · 1' });
    const revealDelivered = vi.spyOn(delivered, 'scrollIntoView');
    fireEvent.click(delivered);
    expect(revealDelivered).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    expect(screen.getByRole('radio', { name: 'Livrés · 1' })).toBeChecked();
    expect(await screen.findByRole('button', { name: 'Ouvrir le fût F-003' })).toHaveTextContent('Café des Marées');
    expect(screen.queryByRole('button', { name: 'Ouvrir le fût F-001' })).toBeNull();
    const search = screen.getByRole('textbox', { name: 'Chercher un fût, une bière, un client…' });
    fireEvent.change(search, { target: { value: 'marees' } });
    expect(await screen.findByRole('button', { name: 'Ouvrir le fût F-003' })).toBeVisible();
    fireEvent.change(search, { target: { value: 'xyz987' } });
    expect(screen.getByText('Rien ne correspond à « xyz987 »')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
    fireEvent.keyDown(delivered, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Tous · 3' })).toHaveFocus();
    expect(await screen.findByRole('button', { name: 'Ouvrir le fût F-001' })).toBeVisible();
    fireEvent.click(screen.getByRole('radio', { name: 'À laver · 0' }));
    expect(screen.getByText('Aucun fût « À laver »')).toBeVisible();
    const revealAll = vi.spyOn(screen.getByRole('radio', { name: 'Tous · 3' }), 'scrollIntoView');
    fireEvent.click(screen.getByRole('button', { name: 'Voir tous les fûts' }));
    expect(screen.getByRole('radio', { name: 'Tous · 3' })).toBeChecked();
    expect(revealAll).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  });

  it('demande une bière éligible puis une confirmation explicite pour remplir', async () => {
    const clean: KegItem = { id: 'F-010', capacityL: 50, state: 'propre', notes: 'Désinfecté' };
    render(board([clean], [batch('OK', 'garde'), batch('FUTUR', 'planifie'), batch('ANNULE', 'annule'), batch('ARCHIVE', 'conditionne', { archivedAt: '2026-09-10' })]));
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le fût F-010' }));
    const fill = screen.getByRole('button', { name: 'Remplir le fût' });
    expect(fill).toBeDisabled();
    const picker = screen.getByRole('combobox', { name: 'Brassin à enfûter' });
    fireEvent.click(picker);
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.click(screen.getByRole('option', { name: /Bière OK/ }));
    expect(StorageService.updateKeg).not.toHaveBeenCalled();
    expect(fill).toBeEnabled();
    fireEvent.click(fill);
    expect(StorageService.updateKeg).toHaveBeenLastCalledWith(expect.objectContaining({ ...clean, state: 'plein', batchRef: 'OK', beerName: 'Bière OK', style: 'Pale Ale', fillDate: expect.stringMatching(/^\d{2}\.\d{2}\.\d{4}$/) }));
  });

  it('garde la sortie accessible pour un fût sans brassin disponible', async () => {
    render(board([{ id: 'F-011', capacityL: 20, state: 'propre' }]));
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le fût F-011' }));
    expect(screen.getByText(/Aucun brassin disponible à enfûter/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remplir le fût' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(StorageService.updateKeg).not.toHaveBeenCalled();
  });

  it('priorise les réparations, filtre le travail et retrouve un entretien sans accents', async () => {
    const open = vi.fn();
    render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}><EquipmentList equipment={equipment} onOpen={open}/></VirtuosoMockContext.Provider>);
    await screen.findByRole('button', { name: 'Ouvrir Cuve 50 L' });
    const rows = screen.getAllByRole('button', { name: /^Ouvrir / });
    expect(rows.map(row => row.getAttribute('aria-label'))).toEqual(['Ouvrir Pompe de transfert', 'Ouvrir pH-mètre de précision', 'Ouvrir Cuve 50 L']);
    fireEvent.click(screen.getByRole('radio', { name: 'À traiter · 2' }));
    expect(screen.queryByRole('button', { name: 'Ouvrir Cuve 50 L' })).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'Chercher un équipement…' }), { target: { value: 'etalonner' } });
    const result = await screen.findByRole('button', { name: 'Ouvrir pH-mètre de précision' });
    expect(result).toHaveTextContent('Étalonner avant brassage');
    expect(result).toHaveAccessibleDescription(/À entretenir.*Étalonner avant brassage/);
    fireEvent.click(result);
    expect(open).toHaveBeenLastCalledWith(equipment[2]);
  });

  it('distingue parc vide et filtre matériel sans travail', async () => {
    const view = render(<EquipmentList equipment={[]}/>);
    expect(screen.getByText('Aucun équipement enregistré')).toBeVisible();
    view.rerender(<EquipmentList equipment={[equipment[0]]}/>);
    fireEvent.click(screen.getByRole('radio', { name: 'À traiter · 0' }));
    expect(screen.getByText('Aucun matériel à entretenir ou réparer')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Voir tout le matériel' }));
    expect(screen.getByRole('radio', { name: 'Tout · 1' })).toBeChecked();
  });

  it('valide le nom au clavier et conserve achats et notes pendant une correction d’entretien', () => {
    const save = vi.fn();
    render(<EquipmentSheet item={equipment[1]} onClose={() => {}} onSave={save} onDelete={() => {}}/>);
    const name = screen.getByLabelText('Nom');
    fireEvent.change(name, { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled();
    fireEvent.keyDown(name, { key: 'Enter', ctrlKey: true });
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('au moins 2 caractères');
    fireEvent.change(name, { target: { value: 'Pompe de transfert' } });
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'Atelier' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Bon', exact: true }));
    fireEvent.change(screen.getByLabelText('Entretien'), { target: { value: 'Joint remplacé le 12.09.2026' } });
    fireEvent.click(screen.getByText('Achat', { exact: false, selector: 'summary' }));
    expect(screen.getByLabelText('Prix payé (CHF)')).toHaveValue('128,5');
    fireEvent.change(screen.getByLabelText('Prix payé (CHF)'), { target: { value: '129,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    expect(save).toHaveBeenLastCalledWith({ ...equipment[1], category: 'Atelier', state: 'Bon', maintenance: 'Joint remplacé le 12.09.2026', purchasePrice: 129.5 });
  });

  it('nettoie aussi le client au retour dans la fiche et préserve une capacité non standard', () => {
    const save = vi.fn();
    render(<KegSheet keg={{ ...fullKeg, capacityL: 10, state: 'livre' }} batches={[batch('B-IPA', 'conditionne')]} onClose={() => {}} onSave={save} onDelete={() => {}}/>);
    expect(screen.getByLabelText('Client')).toHaveValue('Café de la Rive');
    expect(screen.getByRole('radio', { name: '10 L', exact: true })).toBeChecked();
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'État du fût' })).getByRole('radio', { name: 'À laver' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    expect(save).toHaveBeenLastCalledWith({ ...fullKeg, capacityL: 10, state: 'lavage', clientName: undefined, beerName: undefined, batchRef: undefined, style: undefined, fillDate: undefined });
  });

  it('affiche et préserve la bière enregistrée même si son brassin a quitté le catalogue', () => {
    const save = vi.fn();
    render(<KegSheet keg={fullKeg} batches={[]} onClose={() => {}} onSave={save} onDelete={() => {}}/>);
    const picker = screen.getByRole('combobox', { name: 'Bière du fût' });
    expect(picker).toHaveValue('B-IPA — IPA du lac');
    fireEvent.click(picker);
    fireEvent.click(screen.getByRole('option', { name: /B-IPA — IPA du lac/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    expect(save).toHaveBeenLastCalledWith(fullKeg);
  });
});
