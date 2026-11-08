import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'IPA', style: 'IPA', volumeL: 30, brewDate: '01.09.2026', status: 'fermentation', stockAccountingVersion: 1, ...over });
const pitchedDay = { currentIndex: 0, steps: [], pitchedAt: Date.parse('2026-09-01T12:00:00Z') } as Batch['brewDay'];
const consumed = { appliedAt: '2026-09-01', eventId: 'e', items: [], pendingItems: [], completedStages: ['brewday', 'remaining'] as ('brewday' | 'remaining')[] };

let confirmSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'completeBrewStock').mockReturnValue({ success: true, issues: [] });
  confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const selector = () => screen.getByRole('combobox', { name: 'Étape du brassin' });
const optionLabels = () => within(selector()).getAllByRole('option').map(o => o.textContent);
const open = (b: Batch, section: 'overview' | 'measurements' = 'overview') => render(<BatchDetailSheet batch={b} initialSection={section} onClose={vi.fn()} />);

describe('AM 4 · le sélecteur d’étape n’offre que ce qui est permis', () => {
  it('planifié sans levure ajoutée : seulement Annulé, et la raison est écrite', () => {
    open(base({ status: 'planifie', stockAccountingVersion: 1 }));
    expect(optionLabels()).toEqual(['Planifié', 'Annulé (abandon)']);
    expect(screen.queryByRole('button', { name: /Passer en/ })).not.toBeInTheDocument();
    expect(screen.getByText(/la fermentation commence à cet instant/)).toBeInTheDocument();
  });

  it('planifié avec levure ajoutée : Fermentation s’offre et suit le service de stock', () => {
    open(base({ status: 'planifie', brewDay: pitchedDay }));
    expect(optionLabels()).toContain('Fermentation');
    fireEvent.click(screen.getByRole('button', { name: 'Passer en « Fermentation »' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'fermentation' }), 'brewday', false);
  });

  it('fermentation : jamais Planifié, Terminé non plus ; garde et conditionné oui', () => {
    open(base());
    expect(optionLabels()).toEqual(['Fermentation', 'Garde froide', 'Conditionné', 'Annulé (abandon)']);
  });

  it('un retour en arrière se confirme dans la page, dit ce qu’il défait et n’appelle jamais confirm()', () => {
    open(base({ status: 'conditionne', stockConsumption: consumed }));
    expect(optionLabels()).toEqual(['Conditionné', 'Revenir à « Garde froide »', 'Terminé', 'Annulé (abandon)']);
    fireEvent.change(selector(), { target: { value: 'garde' } });
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Revenir à « Garde froide » ?' })).toBeInTheDocument();
    expect(screen.getByText(/Le stock déjà retiré reste retiré/)).toBeInTheDocument();
    expect(screen.getByText(/aucun ingrédient n’est remis en rayon/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Étape du brassin', hidden: true })).toHaveValue('conditionne');
    fireEvent.click(screen.getByRole('button', { name: 'Revenir à « Garde froide »' }));
    expect(StorageService.updateBatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 'garde' }));
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('RJ-15 · « Annulé (abandon) » se confirme dans la page, comme le retour en arrière, sans confirm()', () => {
    open(base({ status: 'planifie' }));
    fireEvent.change(selector(), { target: { value: 'annule' } });
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Abandonner ce brassin ?' })).toBeInTheDocument();
    expect(screen.getByText(/Rien n’a été déstocké/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(selector()).toHaveValue('planifie');
    fireEvent.change(selector(), { target: { value: 'annule' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner le brassin' }));
    expect(StorageService.updateBatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 'annule' }));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('annuler la confirmation laisse le brassin tel quel', () => {
    open(base({ status: 'termine' }));
    fireEvent.change(selector(), { target: { value: 'conditionne' } });
    expect(screen.getByText(/Rien n’a été déstocké/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(selector()).toHaveValue('termine');
  });

  it('une étape non permise ne s’applique pas, même forcée', () => {
    open(base({ status: 'garde' }));
    fireEvent.change(selector(), { target: { value: 'termine' } });
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('n’est pas une étape permise');
  });

  it('si le déstockage est refusé, le statut ne change pas, ni à l’écran ni dans le stockage', () => {
    vi.mocked(StorageService.completeBrewStock).mockReturnValue({ success: false, issues: ['Pale : stock insuffisant'] });
    vi.mocked(StorageService.getBatches).mockReturnValue([base({ status: 'planifie', brewDay: pitchedDay })]);
    open(base({ status: 'planifie', brewDay: pitchedDay }));
    fireEvent.click(screen.getByRole('button', { name: 'Passer en « Fermentation »' }));
    expect(screen.getByRole('status')).toHaveTextContent('Le statut reste « Planifié »');
    expect(selector()).toHaveValue('planifie');
    expect(screen.getByText('Pale : stock insuffisant')).toBeInTheDocument();
    // Réessayer depuis « Revérifier et déstocker » vise de nouveau la fermentation.
    vi.mocked(StorageService.completeBrewStock).mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Revérifier et déstocker' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'fermentation' }), 'brewday', false);
  });
});

const og = () => screen.getByPlaceholderText('À mesurer');
const fg = () => screen.getByPlaceholderText('Non confirmée');
const typeBlur = (el: HTMLElement, value: string) => { fireEvent.change(el, { target: { value } }); fireEvent.blur(el); };

describe('AM 5 · OG et FG bornées', () => {
  it('OG 1,150 : improbable mais possible, à confirmer ; rien n’est écrit tant qu’elle n’est pas gardée', () => {
    open(base(), 'measurements');
    typeBlur(og(), '1,150');
    expect(screen.getByRole('alert')).toHaveTextContent('OG 1,150');
    expect(screen.getByRole('alert')).toHaveTextContent('1,130');
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette valeur' }));
    expect(StorageService.updateBatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ og: '1,150' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('« Annuler la saisie » rétablit la dernière valeur enregistrée', () => {
    open(base({ og: '1.050' }), 'measurements');
    typeBlur(og(), '5');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la saisie' }));
    expect(og()).toHaveValue('1.050');
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });

  it('OG 1,050 et FG 1,010 plausibles : enregistrées sans confirmation, alcool 5,3 %', () => {
    open(base({ og: '1.050' }), 'measurements');
    typeBlur(fg(), '1.010');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(StorageService.updateBatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ fg: '1.010', abv: '5.3%' }));
  });

  it('FG 0,992 : improbable mais possible, à confirmer, et jamais un alcool de plusieurs centaines de %', () => {
    open(base({ og: '1.050' }), 'measurements');
    typeBlur(fg(), '0,992');
    expect(screen.getByRole('alert')).toHaveTextContent('FG 0,992');
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette valeur' }));
    const written = vi.mocked(StorageService.updateBatch).mock.calls[0][0];
    expect(written.fg).toBe('0,992');
  });

  it('RJ-2 · une densité impossible ne s’enregistre pas et n’offre pas « Garder cette valeur »', () => {
    open(base({ og: '1.050' }), 'measurements');
    for (const [champ, saisie] of [[fg, '0,5'], [og, '-5'], [og, '5'], [og, '1,300'], [og, '0'], [fg, '1,060']] as const) {
      typeBlur(champ(), saisie);
      expect(screen.getByRole('alert')).toHaveTextContent('ne s’enregistre pas');
      expect(screen.queryByRole('button', { name: 'Garder cette valeur' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Annuler la saisie' }));
    }
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });

  it('RJ-2 · FG au-dessus de l’OG : refusée, l’ancien alcool reste', () => {
    open(base({ og: '1.050', fg: '1.010', abv: '5.3%' }), 'measurements');
    expect(screen.getByText(/Alcool calculé/)).toHaveTextContent('5');
    typeBlur(fg(), '1.060');
    expect(screen.getByRole('alert')).toHaveTextContent('au-dessus de l’OG 1,050');
    expect(screen.queryByRole('button', { name: 'Garder cette valeur' })).not.toBeInTheDocument();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });

  it('RJ-2 · une saisie refusée n’est pas emportée par l’enregistrement de l’autre champ', () => {
    open(base({ og: '1.050' }), 'measurements');
    typeBlur(og(), '-5');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    typeBlur(fg(), '1.010');
    expect(StorageService.updateBatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ og: '1.050', fg: '1.010' }));
  });

  it('RJ-2 · une OG sous la FG déjà notée est refusée', () => {
    open(base({ og: '1.050', fg: '1.030', abv: '2.6%' }), 'measurements');
    typeBlur(og(), '1.025');
    expect(screen.getByRole('alert')).toHaveTextContent('sous la FG 1,030');
    expect(screen.queryByRole('button', { name: 'Garder cette valeur' })).not.toBeInTheDocument();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });


  it('un texte illisible n’est pas enregistré', () => {
    open(base(), 'measurements');
    typeBlur(og(), 'abc');
    expect(screen.getByRole('alert')).toHaveTextContent('illisible');
    expect(screen.queryByRole('button', { name: 'Garder cette valeur' })).not.toBeInTheDocument();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });

  it('vider un champ l’enregistre vide, sans alerte', () => {
    open(base({ og: '1.050' }), 'measurements');
    typeBlur(og(), '');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(StorageService.updateBatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ og: '' }));
  });
});
