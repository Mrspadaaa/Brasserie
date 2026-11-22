// Mission levure-port, voie b-stock (09.11) : AM-70 — la fiche d'un fût refuse ce qui n'existe pas en cave.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { KegSheet } from '../../src/ui/KegSheet';
import { KegBoard } from '../../src/ui/KegBoard';
import { brassinsAFuter, litresDansLesAutresFuts, problemeLivraison, problemeRemplissage, volumeProduit } from '../../src/domain/stock/futs';
import type { Batch, KegItem } from '../../src/types';

afterEach(cleanup);
const brassin = (id: string, status: Batch['status'], extra: Partial<Batch> = {}) => ({ id, name: `Bière ${id}`, style: 'IPA', status, volumeL: 20, brewDate: '2026-10-01', ...extra }) as Batch;
const vide: KegItem = { id: 'F-9', capacityL: 30, state: 'propre' };
const batches = [brassin('B-PLAN', 'planifie'), brassin('B-FERM', 'fermentation'), brassin('B-GARDE', 'garde'), brassin('B-COND', 'conditionne'), brassin('B-ANN', 'annule'), brassin('B-FIN', 'termine')];
const monter = (keg: KegItem, extra: Partial<React.ComponentProps<typeof KegSheet>> = {}) => {
  const save = vi.fn();
  render(<KegSheet keg={keg} batches={batches} kegs={[]} onClose={() => {}} onSave={save} onDelete={() => {}} {...extra} />);
  return save;
};

describe('AM-70 (1) — un fût ne se remplit que d’un brassin fini', () => {
  it('la règle : ni le planifié, ni l’annulé, ni le terminé', () => {
    expect(brassinsAFuter(batches).map((b) => b.id)).toEqual(['B-FERM', 'B-GARDE', 'B-COND']);
    expect(brassinsAFuter(batches, 'B-PLAN').map((b) => b.id)).toEqual(['B-PLAN', 'B-FERM', 'B-GARDE', 'B-COND']);
  });
  it('la fiche ne propose ni le planifié, ni l’annulé, ni le terminé', () => {
    monter({ ...vide, state: 'plein' });
    fireEvent.click(screen.getByRole('combobox', { name: 'Bière du fût' }));
    const options = screen.getAllByRole('option').map((o) => o.textContent ?? '');
    expect(options.some((t) => t.includes('B-GARDE'))).toBe(true);
    expect(options.some((t) => t.includes('B-COND'))).toBe(true);
    for (const interdit of ['B-PLAN', 'B-ANN', 'B-FIN']) expect(options.some((t) => t.includes(interdit)), interdit).toBe(false);
  });
});

describe('AM-70 (2) — la contenance des fûts ne dépasse pas ce que le brassin a produit', () => {
  const kegs: KegItem[] = [
    { id: 'F-1', capacityL: 20, state: 'plein', batchRef: 'B-COND' },
    { id: 'F-2', capacityL: 30, state: 'lavage', batchRef: 'B-COND' }
  ];
  it('le volume produit : conditionné, sinon récolté, sinon visé ; l’inconnu n’est pas 0', () => {
    expect(volumeProduit({ volumePackagedL: 18, volumeBrewedL: 19, volumeL: 20 })).toBe(18);
    expect(volumeProduit({ volumeBrewedL: 19, volumeL: 20 })).toBe(19);
    expect(volumeProduit({ volumeL: 20 })).toBe(20);
    expect(volumeProduit({ volumeL: 0 })).toBeUndefined();
  });
  it('seuls les fûts pleins ou livrés comptent, et pas le fût lui-même', () => {
    expect(litresDansLesAutresFuts('B-COND', kegs, 'F-9')).toBe(20);
    expect(litresDansLesAutresFuts('B-COND', kegs, 'F-1')).toBe(0);
  });
  it('refuse un second fût quand le premier couvre déjà les 20 L ; accepte un fût en partie vide', () => {
    const second: KegItem = { id: 'F-9', capacityL: 30, state: 'plein', batchRef: 'B-COND' };
    expect(problemeRemplissage(second, batches, kegs)).toMatch(/20 L déjà|contiennent déjà 20 L pour 20 L/);
    expect(problemeRemplissage({ ...second, batchRef: 'B-GARDE' }, batches, kegs)).toBeUndefined();
    expect(problemeRemplissage({ ...second, state: 'lavage' }, batches, kegs)).toBeUndefined();
  });
  it('la fiche éteint Enregistrer et dit pourquoi', () => {
    const save = monter({ id: 'F-9', capacityL: 30, state: 'plein', batchRef: 'B-COND', beerName: 'Bière B-COND', fillDate: '01.10.2026' }, { kegs });
    expect(screen.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled();
    expect(screen.getByText(/contiennent déjà 20 L pour 20 L/)).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
});

describe('AM-70 (3) — un fût livré dit chez qui', () => {
  it('la règle', () => {
    expect(problemeLivraison({ state: 'livre', clientName: '  ' })).toMatch(/client/);
    expect(problemeLivraison({ state: 'livre', clientName: 'Café de la Rive' })).toBeUndefined();
    expect(problemeLivraison({ state: 'plein' })).toBeUndefined();
  });
  it('la fiche : sans client, Enregistrer est éteint ; avec client, le fût s’enregistre', () => {
    const save = monter({ id: 'F-9', capacityL: 30, state: 'livre', batchRef: 'B-COND', beerName: 'Bière B-COND', fillDate: '01.10.2026' });
    const enregistrer = screen.getByRole('button', { name: 'Enregistrer', exact: true });
    expect(enregistrer).toBeDisabled();
    expect(screen.getByText('Indique le client chez qui ce fût est livré.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'Café de la Rive' } });
    expect(enregistrer).toBeEnabled();
    fireEvent.click(enregistrer);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ state: 'livre', clientName: 'Café de la Rive' }));
    void within;
  });
});

describe('AM-70 — le tableau des fûts (remplir, livrer) suit les mêmes règles', () => {
  const kegsParc: KegItem[] = [{ id: 'F-1', capacityL: 20, state: 'plein', batchRef: 'B-COND' }, { id: 'F-9', capacityL: 30, state: 'propre' }];
  const monterTableau = () => render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}><KegBoard kegs={kegsParc} batches={batches} /></VirtuosoMockContext.Provider>);
  it('remplir : un brassin déjà couvert par les autres fûts est refusé avec son motif', () => {
    monterTableau();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le fût F-9' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Brassin à enfûter' }));
    expect(screen.queryByRole('option', { name: /B-PLAN/ })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /B-COND/ }));
    expect(screen.getByText(/contiennent déjà 20 L pour 20 L/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remplir le fût' })).toBeDisabled();
  });
  it('livrer : sans client, le bouton est éteint', () => {
    render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}><KegBoard kegs={[kegsParc[0]]} batches={batches} /></VirtuosoMockContext.Provider>);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le fût F-1' }));
    expect(screen.getByRole('button', { name: 'Livrer le fût' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Client de livraison'), { target: { value: 'Café de la Rive' } });
    expect(screen.getByRole('button', { name: 'Livrer le fût' })).toBeEnabled();
  });
});
