// Port 1:1 des maquettes choisies le 15.11 : F2 « La carte d'identité », R1 « Le lot d'abord » (remplir et ajouter). Banc : parc de la planche, au 15.11.2026.
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KegBoard } from '../../src/ui/KegBoard';
import { optionsClients } from '../../src/ui/KegFiche';
import type { Batch, Client, KegItem } from '../../src/types';

vi.mock('../../src/services/storage', () => ({ StorageService: { updateKeg: vi.fn(), addKeg: vi.fn(), deleteKeg: vi.fn() } }));
afterEach(() => cleanup());

const H = (date: string, quoi: NonNullable<KegItem['historique']>[number]['quoi'], detail?: string) => (detail ? { date, quoi, detail } : { date, quoi });
const f001: KegItem = { id: 'F-001', capacityL: 30, state: 'plein', batchRef: 'LOT-002', beerName: 'NEIPA Test', style: 'NEIPA', fillDate: '02.11.2026',
  historique: [H('10.09.2026', 'ajoute'), H('20.09.2026', 'rempli', 'Pale Ale LOT-001'), H('24.09.2026', 'livre', 'Café du Marché'), H('28.10.2026', 'retour-vide', 'Café du Marché'), H('01.11.2026', 'lave'), H('02.11.2026', 'rempli', 'NEIPA Test LOT-002')] };
const f006: KegItem = { id: 'F-006', capacityL: 30, state: 'livre', batchRef: 'LOT-002', beerName: 'NEIPA Test', style: 'NEIPA', fillDate: '02.11.2026', clientId: 'CL-001', clientName: 'Café du Marché', deliveryDate: '04.11.2026',
  historique: [H('24.10.2026', 'retour-vide', 'Café du Marché'), H('31.10.2026', 'lave'), H('02.11.2026', 'rempli', 'NEIPA Test LOT-002'), H('04.11.2026', 'livre', 'Café du Marché')] };
const f002: KegItem = { id: 'F-002', capacityL: 30, state: 'lavage', historique: [H('13.11.2026', 'retour-vide', 'Café du Marché')] };
const f005: KegItem = { id: 'F-005', capacityL: 20, state: 'propre', historique: [H('12.11.2026', 'lave')] };
const f007: KegItem = { id: 'F-007', capacityL: 30, state: 'livre', batchRef: 'LOT-001', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: '03.10.2026', clientName: 'Bar Le Zinc', deliveryDate: '06.10.2026' };
const lots = [
  { id: 'LOT-002', name: 'NEIPA Test', style: 'NEIPA', status: 'garde', volumeL: 60, volumePackagedL: 60, brewDate: '20.10.2026' },
  { id: 'LOT-003', name: 'Ambrée', style: 'Ambrée', status: 'garde', volumeL: 60, volumePackagedL: 60, brewDate: '05.11.2026' }
] as unknown as Batch[];
const clients = [
  { id: 'CL-002', name: 'Bar Le Zinc', type: 'Pro', contact: '', phone: '', email: '', favorite: true },
  { id: 'CL-009', name: 'Auberge', type: 'Pro', contact: '', phone: '', email: '' },
  { id: 'CL-001', name: 'Café du Marché', type: 'Pro', contact: '', phone: '', email: '', favorite: true }
] as Client[];

function monter(kegs: KegItem[], extra: Partial<React.ComponentProps<typeof KegBoard>> = {}) {
  return render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}>
    <KegBoard kegs={kegs} batches={lots} clients={clients} today="15.11.2026" onSaveKeg={vi.fn()} onAddKegs={vi.fn()} onRemoveKeg={vi.fn()} {...extra}/>
  </VirtuosoMockContext.Provider>);
}
const ouvrir = async (id: string) => fireEvent.click(await screen.findByRole('button', { name: `Ouvrir le fût ${id}` }));

describe('F2 — fût plein', () => {
  it('titre, sous-titre, bière, jauge 13 j sur 30 j, aide, historique des 4 dernières étapes (F2b)', async () => {
    monter([f001]); await ouvrir('F-001');
    const d = screen.getByRole('dialog', { name: 'Fût F-001' });
    expect(d).toHaveTextContent('30 L · en cave');
    expect(d).toHaveTextContent('NEIPA Test · LOT-002');
    expect(d).toHaveTextContent('Rempli le 02.11 · 13 j en fût · repère NEIPA 30 j');
    expect(d).not.toHaveTextContent('réglable');
    const jauge = within(d).getByRole('meter');
    expect(jauge).toHaveAttribute('aria-valuetext', '13 jours sur 30');
    const items = within(within(d).getByRole('list', { name: /Historique/ })).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toHaveLength(4);
    expect(items.slice(0, 3)).toEqual(['02.11Rempli · NEIPA Test LOT-002', '01.11Lavé', '28.10Revenu vide · Café du Marché']);
  });
  it('« Tout voir » déplie les six étapes, « Réduire » les replie', async () => {
    monter([f001]); await ouvrir('F-001');
    fireEvent.click(screen.getByRole('button', { name: 'Tout voir' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: 'Réduire' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
  it('Livrer éteint sans client ; un client choisi dans la liste Clients, favoris en tête, livre et ferme', async () => {
    const onSaveKeg = vi.fn();
    monter([f001], { onSaveKeg }); await ouvrir('F-001');
    expect(screen.getByRole('button', { name: 'Livrer' })).toBeDisabled();
    fireEvent.click(screen.getByRole('combobox', { name: 'Client' }));
    const noms = screen.getAllByRole('option').map((o) => o.textContent ?? '');
    expect(noms[0]).toContain('Bar Le Zinc');
    expect(noms[1]).toContain('Café du Marché');
    expect(noms[2]).toContain('Auberge');
    fireEvent.click(screen.getByRole('option', { name: /Café du Marché/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Livrer' }));
    expect(onSaveKeg).toHaveBeenCalledWith(expect.objectContaining({ id: 'F-001', state: 'livre', clientId: 'CL-001', clientName: 'Café du Marché', deliveryDate: '15.11.2026', beerName: 'NEIPA Test' }));
  });
  it('un ancien fût sans historique dit « Aucune étape enregistrée » et n’a pas de « Tout voir »', async () => {
    monter([{ ...f001, historique: undefined }]); await ouvrir('F-001');
    expect(screen.getByText('Aucune étape enregistrée')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tout voir' })).toBeNull();
  });
});

describe('F2 — fût livré', () => {
  it('sous-titre chez le client, jauge 11 j sur 30 j, « Livré le 04.11 · 11 j dehors », pied Revenu plein / Retour vide', async () => {
    monter([f006]); await ouvrir('F-006');
    const d = screen.getByRole('dialog', { name: 'Fût F-006' });
    expect(d).toHaveTextContent('30 L · chez Café du Marché');
    expect(d).toHaveTextContent('Livré le 04.11 · 11 j dehors');
    expect(within(d).getByRole('meter')).toHaveAttribute('aria-valuetext', '11 jours sur 30');
    expect(within(d).getByRole('button', { name: 'Revenu plein' })).toBeEnabled();
    expect(within(d).getByRole('button', { name: 'Retour vide' })).toBeEnabled();
  });
  it('au-delà de 30 j dehors, la jauge est marquée dépassée', async () => {
    monter([f007]); await ouvrir('F-007');
    expect(screen.getByText('Livré le 06.10 · 40 j dehors')).toBeVisible();
    expect(screen.getByRole('meter')).toHaveAttribute('data-depasse', 'true');
  });
  it('livré sans date de livraison : rien n’est inventé, pas de jauge', async () => {
    monter([{ ...f007, deliveryDate: undefined }]); await ouvrir('F-007');
    expect(screen.getByText('Date de livraison non enregistrée')).toBeVisible();
    expect(screen.queryByRole('meter')).toBeNull();
  });
});

describe('F2 — propre et à laver (même gabarit)', () => {
  it('à laver : « Revenu le 13.11 », pied « Marquer propre » qui écrit l’étape Lavé', async () => {
    const onSaveKeg = vi.fn();
    monter([f002], { onSaveKeg }); await ouvrir('F-002');
    expect(screen.getByRole('dialog')).toHaveTextContent('Revenu le 13.11');
    fireEvent.click(screen.getByRole('button', { name: 'Marquer propre' }));
    expect(onSaveKeg).toHaveBeenCalledWith(expect.objectContaining({ id: 'F-002', state: 'propre', historique: [H('13.11.2026', 'retour-vide', 'Café du Marché'), H('15.11.2026', 'lave')] }));
  });
  it('propre : « Lavé le 12.11 », « Remplir depuis un lot » ouvre R1 avec ce fût coché', async () => {
    monter([f005]); await ouvrir('F-005');
    expect(screen.getByRole('dialog', { name: 'Fût F-005' })).toHaveTextContent('Lavé le 12.11');
    fireEvent.click(screen.getByRole('button', { name: 'Remplir depuis un lot' }));
    expect(screen.getByRole('dialog', { name: 'Remplir depuis un lot' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /F-005/ })).toBeChecked();
  });
});

describe('Gestion du fût', () => {
  it('Retirer du parc : la confirmation dit que l’historique reste au journal', async () => {
    const onRemoveKeg = vi.fn();
    monter([f001], { onRemoveKeg }); await ouvrir('F-001');
    fireEvent.click(screen.getByText('Gestion du fût'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer du parc' }));
    expect(screen.getByText(/Son historique reste au journal\./)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer le fût' }));
    expect(onRemoveKeg).toHaveBeenCalledWith('F-001');
  });
});

describe('R1 — Remplir depuis un lot', () => {
  const parc = [f001, { ...f002, state: 'propre' as const }, f005, { id: 'F-003', capacityL: 30, state: 'propre' as const }, { id: 'F-004', capacityL: 30, state: 'propre' as const }];
  it('la barre des litres : LOT-003, F-002 et F-005 cochés, 10 L restent ; pied « Remplir 2 fûts »', async () => {
    const onSaveKeg = vi.fn(), onMessage = vi.fn();
    monter(parc, { onSaveKeg, onMessage });
    fireEvent.click(await screen.findByRole('button', { name: 'Remplir depuis un lot' }));
    const d = screen.getByRole('dialog', { name: 'Remplir depuis un lot' });
    expect(d).toHaveTextContent('Choisis le lot, puis les fûts propres');
    expect(within(d).getByText('Fûts propres · 4')).toBeVisible();
    expect(within(d).getByRole('button', { name: 'Remplir' })).toBeDisabled();
    fireEvent.click(within(d).getByRole('combobox', { name: 'Lot' }));
    fireEvent.click(screen.getByRole('option', { name: /Ambrée · LOT-003 · en garde/ }));
    fireEvent.click(within(d).getByRole('checkbox', { name: /F-002 · 30 L/ }));
    fireEvent.click(within(d).getByRole('checkbox', { name: /F-005 · 20 L/ }));
    expect(within(d).getByText('60 L produits · aucun en fût · 50 L choisis · 10 L restent')).toBeVisible();
    fireEvent.click(within(d).getByRole('button', { name: 'Remplir 2 fûts' }));
    expect(onSaveKeg).toHaveBeenCalledTimes(2);
    expect(onSaveKeg).toHaveBeenCalledWith(expect.objectContaining({ id: 'F-002', state: 'plein', batchRef: 'LOT-003', beerName: 'Ambrée', fillDate: '15.11.2026' }));
    expect(onSaveKeg).toHaveBeenCalledWith(expect.objectContaining({ id: 'F-005', state: 'plein', batchRef: 'LOT-003', fillDate: '15.11.2026' }));
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining('2 fûts remplis'));
  });
  it('trois fûts de 30 L sur 60 L : refusé avec son motif, pied éteint', async () => {
    monter(parc);
    fireEvent.click(await screen.findByRole('button', { name: 'Remplir depuis un lot' }));
    const d = screen.getByRole('dialog', { name: 'Remplir depuis un lot' });
    fireEvent.click(within(d).getByRole('combobox', { name: 'Lot' }));
    fireEvent.click(screen.getByRole('option', { name: /LOT-003/ }));
    ['F-002', 'F-003', 'F-004'].forEach((id) => fireEvent.click(within(d).getByRole('checkbox', { name: new RegExp(id) })));
    expect(within(d).getByRole('alert')).toHaveTextContent(/un fût resterait vide/);
    expect(within(d).getByRole('button', { name: 'Remplir 3 fûts' })).toBeDisabled();
  });
  it('« Hier » et « Autre date » donnent la date du remplissage', async () => {
    const onSaveKeg = vi.fn();
    monter(parc, { onSaveKeg });
    fireEvent.click(await screen.findByRole('button', { name: 'Remplir depuis un lot' }));
    const d = screen.getByRole('dialog', { name: 'Remplir depuis un lot' });
    fireEvent.click(within(d).getByRole('combobox', { name: 'Lot' }));
    fireEvent.click(screen.getByRole('option', { name: /LOT-003/ }));
    fireEvent.click(within(d).getByRole('checkbox', { name: /F-005/ }));
    fireEvent.click(within(d).getByRole('radio', { name: 'Hier' }));
    fireEvent.click(within(d).getByRole('button', { name: 'Remplir 1 fût' }));
    expect(onSaveKeg).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'F-005', fillDate: '14.11.2026' }));
  });
});

describe('Ajouter des fûts (le bouton rond « + »)', () => {
  it('3 fûts de 30 L : aperçu F-009, F-010, F-011 · propres, pied « Ajouter 3 fûts »', async () => {
    const onAddKegs = vi.fn(), onAddClose = vi.fn();
    const parc = Array.from({ length: 8 }, (_, i) => ({ id: `F-00${i + 1}`, capacityL: 30, state: 'propre' as const }));
    monter(parc, { addOpen: true, onAddKegs, onAddClose });
    const d = await screen.findByRole('dialog', { name: 'Ajouter des fûts' });
    expect(d).toHaveTextContent('Numéros donnés à la suite du parc');
    expect(within(d).getAllByRole('radio').map((r) => r.textContent)).toEqual(['20 L', '30 L', '50 L', 'Autre']);
    expect(within(d).getByRole('radio', { name: '30 L' })).toBeChecked();
    expect(within(d).getByText('Note commune')).toBeVisible();
    fireEvent.click(within(d).getByRole('button', { name: 'Un fût de plus' }));
    fireEvent.click(within(d).getByRole('button', { name: 'Un fût de plus' }));
    expect(within(d).getByText('F-009, F-010, F-011 · propres')).toBeVisible();
    fireEvent.click(within(d).getByRole('button', { name: 'Ajouter 3 fûts' }));
    expect(onAddKegs).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'F-009', capacityL: 30, state: 'propre', historique: [H('15.11.2026', 'ajoute')] }),
      expect.objectContaining({ id: 'F-010' }), expect.objectContaining({ id: 'F-011' })
    ]);
    expect(onAddClose).toHaveBeenCalled();
  });
  it('« Autre » : saisie texte (jamais type=number), refusée si ce n’est pas un nombre de litres', async () => {
    const onAddKegs = vi.fn();
    monter([], { addOpen: true, onAddKegs });
    const d = await screen.findByRole('dialog', { name: 'Ajouter des fûts' });
    fireEvent.click(within(d).getByRole('radio', { name: 'Autre' }));
    const saisie = within(d).getByRole('textbox', { name: /Capacité en litres/ });
    expect(saisie).not.toHaveAttribute('type', 'number');
    expect(saisie).toHaveAttribute('inputmode', 'decimal');
    expect(within(d).getByRole('button', { name: 'Ajouter 1 fût' })).toBeDisabled();
    fireEvent.change(saisie, { target: { value: 'abc' } });
    expect(within(d).getByRole('button', { name: 'Ajouter 1 fût' })).toBeDisabled();
    fireEvent.change(saisie, { target: { value: '25' } });
    fireEvent.click(within(d).getByRole('button', { name: 'Ajouter 1 fût' }));
    expect(onAddKegs).toHaveBeenCalledWith([expect.objectContaining({ id: 'F-001', capacityL: 25 })]);
  });
  it('le nombre reste entre 1 et 20', async () => {
    monter([], { addOpen: true });
    const d = await screen.findByRole('dialog', { name: 'Ajouter des fûts' });
    expect(within(d).getByRole('button', { name: 'Un fût de moins' })).toBeDisabled();
    for (let i = 0; i < 25; i += 1) fireEvent.click(within(d).getByRole('button', { name: 'Un fût de plus' }));
    expect(within(d).getByLabelText('Nombre de fûts')).toHaveTextContent('20');
    expect(within(d).getByRole('button', { name: 'Un fût de plus' })).toBeDisabled();
    expect(within(d).getByText('F-001 à F-020 · propres')).toBeVisible();
  });
});

describe('clients', () => {
  it('favoris en tête, puis ordre alphabétique', () => {
    expect(optionsClients(clients).map((o) => o.label)).toEqual(['Bar Le Zinc', 'Café du Marché', 'Auberge']);
  });
});
