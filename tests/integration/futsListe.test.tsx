// Port 1:1 de la maquette G4 « L2 avec les lignes de L1 » (15.11) : jauge-filtre à choix multiple, « Voir tout », résumé, sections, lignes, Tout marquer propre + Annuler.
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KegBoard } from '../../src/ui/KegBoard';
import type { Batch, KegHistoryEntry, KegItem } from '../../src/types';

vi.mock('../../src/services/storage', () => ({ StorageService: { updateKeg: vi.fn(), addKeg: vi.fn(), deleteKeg: vi.fn() } }));
afterEach(() => { cleanup(); vi.useRealTimers(); });

const H = (date: string, quoi: KegHistoryEntry['quoi'], detail?: string): KegHistoryEntry => (detail ? { date, quoi, detail } : { date, quoi });
const PARC: KegItem[] = [
  { id: 'F-001', capacityL: 30, state: 'plein', batchRef: 'LOT-002', beerName: 'NEIPA Test', style: 'NEIPA', fillDate: '02.11.2026', historique: [H('02.11.2026', 'rempli', 'NEIPA Test LOT-002')] },
  { id: 'F-002', capacityL: 30, state: 'lavage', historique: [H('13.11.2026', 'retour-vide', 'Café du Marché')] },
  { id: 'F-003', capacityL: 30, state: 'lavage', historique: [H('10.11.2026', 'retour-vide', 'Bar Le Zinc')] },
  { id: 'F-004', capacityL: 30, state: 'lavage', historique: [H('10.11.2026', 'retour-vide', 'Bar Le Zinc')] },
  { id: 'F-005', capacityL: 20, state: 'propre', historique: [H('12.11.2026', 'lave')] },
  { id: 'F-006', capacityL: 30, state: 'livre', batchRef: 'LOT-002', beerName: 'NEIPA Test', style: 'NEIPA', fillDate: '02.11.2026', clientName: 'Café du Marché', deliveryDate: '04.11.2026' },
  { id: 'F-007', capacityL: 30, state: 'livre', batchRef: 'LOT-001', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: '03.10.2026', clientName: 'Bar Le Zinc', deliveryDate: '06.10.2026' },
  { id: 'F-008', capacityL: 20, state: 'plein', batchRef: 'LOT-001', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: '03.10.2026' }
];
const lots = [] as Batch[];

/** Parc en mémoire : les écritures du tableau reviennent comme nouveau parc, comme le fait le stockage en direct. */
const Parc: React.FC<{ kegs?: KegItem[]; onSave?: (k: KegItem) => void }> = ({ kegs = PARC, onSave }) => {
  const [parc, setParc] = useState(kegs);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1400, itemHeight: 60 }}>
    <KegBoard kegs={parc} batches={lots} today="15.11.2026"
      onSaveKeg={(k) => { onSave?.(k); setParc((p) => p.map((x) => (x.id === k.id ? k : x))); }} onAddKegs={vi.fn()} onRemoveKeg={vi.fn()}/>
  </VirtuosoMockContext.Provider>;
};
const ids = () => screen.getAllByRole('button', { name: /^Ouvrir le fût/ }).map((b) => b.getAttribute('aria-label')!.replace('Ouvrir le fût ', ''));
const sections = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.querySelector('span')!.textContent);
const seg = (name: string) => screen.getByRole('button', { name });

describe('G4 — au repos', () => {
  it('jauge : un segment par état présent, libellé et nombre ; « Voir tout » actif devant', () => {
    render(<Parc/>);
    const group = screen.getByRole('group', { name: /Filtrer les fûts par état/ });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['À laver3', 'Propre1', 'Pleins2', 'Livrés2']);
    expect(seg('Voir tout')).toHaveAttribute('aria-pressed', 'true');
    for (const n of ['À laver 3', 'Propre 1', 'Pleins 2', 'Livrés 2']) expect(seg(n)).toHaveAttribute('aria-pressed', 'false');
    expect(seg('Livrés 2')).toHaveStyle({ flexGrow: '2' });
    expect(seg('À laver 3')).toHaveStyle({ flexGrow: '3' });
  });
  it('résumé calculé sous la jauge', () => {
    render(<Parc/>);
    expect(screen.getByText('8 fûts · 220 L')).toBeVisible();
    expect(screen.getByText('50 L pleins en cave · 2 dehors')).toBeVisible();
  });
  it('quatre sections dans l’ordre Livrés, Pleins, À laver, Propres, le plus ancien d’abord', () => {
    render(<Parc/>);
    expect(sections()).toEqual(['Livrés · 2', 'Pleins · 2', 'À laver · 3', 'Propres · 1']);
    expect(ids()).toEqual(['F-007', 'F-006', 'F-008', 'F-001', 'F-003', 'F-004', 'F-002', 'F-005']);
  });
  it('lignes de L1 : bière · client, date et âge, « À reprendre », bière · lot, lavé, revenu', () => {
    render(<Parc/>);
    const ligne = (id: string) => screen.getByRole('button', { name: `Ouvrir le fût ${id}` });
    expect(ligne('F-007')).toHaveTextContent('30 LPale Ale · Bar Le ZincLivré le 06.10 · 40 j dehors');
    expect(ligne('F-007')).toHaveTextContent('À reprendre');
    expect(within(ligne('F-007')).getByText('40 j dehors')).toHaveAttribute('data-ancien', 'true');
    expect(ligne('F-006')).toHaveTextContent('NEIPA Test · Café du MarchéLivré le 04.11 · 11 j dehors');
    expect(ligne('F-006')).not.toHaveTextContent('À reprendre');
    expect(within(ligne('F-006')).getByText('11 j dehors')).toHaveAttribute('data-ancien', 'false');
    expect(ligne('F-001')).toHaveTextContent('NEIPA Test · LOT-002Rempli le 02.11 · 13 j');
    expect(ligne('F-008')).toHaveTextContent('Pale Ale · LOT-001Rempli le 03.10 · 43 j');
    expect(ligne('F-005')).toHaveTextContent('Lavé le 12.11');
    expect(ligne('F-002')).toHaveTextContent('Revenu le 13.11 · Café du Marché');
    expect(ligne('F-002')).toHaveAccessibleDescription(/30 L.*Revenu le 13.11.*À laver/);
    expect(ligne('F-007')).toHaveAccessibleDescription(/Livré,s*À reprendre/);
  });
});

describe('G4 — le filtre à choix multiple', () => {
  it('À laver puis Propres montre ces deux sections ; retoucher un segment le retire', () => {
    render(<Parc/>);
    fireEvent.click(seg('À laver 3'));
    expect(seg('À laver 3')).toHaveAttribute('aria-pressed', 'true');
    expect(seg('Voir tout')).toHaveAttribute('aria-pressed', 'false');
    expect(ids()).toEqual(['F-003', 'F-004', 'F-002']);
    expect(screen.getByText('Filtre : À laver')).toBeVisible();
    fireEvent.click(seg('Propre 1'));
    expect(screen.getByText('Filtre : À laver + Propres')).toBeVisible();
    expect(ids()).toEqual(['F-003', 'F-004', 'F-002', 'F-005']);
    expect(sections()).toEqual(['À laver · 3', 'Propres · 1']);
    fireEvent.click(seg('À laver 3'));
    expect(ids()).toEqual(['F-005']);
    fireEvent.click(seg('Propre 1'));
    expect(ids()).toHaveLength(8);
    expect(seg('Voir tout')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('8 fûts · 220 L')).toBeVisible();
  });
  it('« Voir tout » vide le filtre d’un seul geste ; « Voir tout » de la ligne de filtre aussi', () => {
    render(<Parc/>);
    fireEvent.click(seg('À laver 3')); fireEvent.click(seg('Livrés 2'));
    expect(ids()).toHaveLength(5);
    fireEvent.click(seg('Voir tout'));
    expect(ids()).toHaveLength(8);
    fireEvent.click(seg('Pleins 2'));
    expect(ids()).toEqual(['F-008', 'F-001']);
    fireEvent.click(screen.getByRole('button', { name: 'Retirer le filtre' }));
    expect(ids()).toHaveLength(8);
  });
  it('la recherche se combine au filtre', () => {
    render(<Parc/>);
    fireEvent.click(seg('Livrés 2'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Chercher un fût, une bière, un client…' }), { target: { value: 'zinc' } });
    expect(ids()).toEqual(['F-007']);
  });
});

describe('G4 — Tout marquer propre', () => {
  const ouvrirConfirmation = () => fireEvent.click(screen.getByRole('button', { name: 'Tout marquer propre' }));
  it('le lien est en tête de la section À laver, la confirmation s’ouvre sur place et Annuler la ferme sans rien écrire', () => {
    const onSave = vi.fn();
    render(<Parc onSave={onSave}/>);
    ouvrirConfirmation();
    const c = screen.getByRole('group', { name: 'Marquer 3 fûts propres ?' });
    expect(c).toHaveTextContent('F-002, F-003, F-004 · lavés aujourd’hui');
    expect(c).toHaveFocus();
    fireEvent.click(within(c).getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('group', { name: /Marquer/ })).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });
  it('confirmer : chaque fût passe propre avec « lavé » du jour, le filtre est levé, le bandeau propose Annuler', () => {
    const onSave = vi.fn();
    render(<Parc onSave={onSave}/>);
    fireEvent.click(seg('À laver 3'));
    ouvrirConfirmation();
    fireEvent.click(screen.getByRole('button', { name: 'Marquer propres' }));
    expect(onSave).toHaveBeenCalledTimes(3);
    onSave.mock.calls.forEach(([k]) => { expect(k.state).toBe('propre'); expect(k.historique.at(-1)).toEqual({ date: '15.11.2026', quoi: 'lave' }); });
    expect(screen.getByRole('status')).toHaveTextContent('3 fûts marqués propres');
    expect(screen.queryByRole('button', { name: 'Tout marquer propre' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'À laver 0' })).toBeNull();
    expect(seg('Propres 4')).toBeVisible();
    expect(seg('Voir tout')).toHaveAttribute('aria-pressed', 'true');
    expect(sections()).toEqual(['Livrés · 2', 'Pleins · 2', 'Propres · 4']);
    expect(ids().slice(-4)).toEqual(['F-005', 'F-002', 'F-003', 'F-004']);
    expect(screen.getAllByText('Lavé le 15.11')).toHaveLength(3);
  });
  it('Annuler du bandeau rétablit l’état précédent', () => {
    const onSave = vi.fn();
    render(<Parc onSave={onSave}/>);
    ouvrirConfirmation();
    fireEvent.click(screen.getByRole('button', { name: 'Marquer propres' }));
    onSave.mockClear();
    fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: 'Annuler' }));
    expect(onSave).toHaveBeenCalledTimes(3);
    onSave.mock.calls.forEach(([k]) => expect(k.state).toBe('lavage'));
    expect(onSave.mock.calls.map(([k]) => k.id)).toEqual(['F-002', 'F-003', 'F-004']);
    expect(screen.queryByRole('status')).toBeNull();
    expect(seg('À laver 3')).toBeVisible();
    expect(screen.getByText('Revenu le 13.11 · Café du Marché')).toBeVisible();
  });
  it('le bandeau s’éteint de lui-même', () => {
    vi.useFakeTimers();
    render(<Parc/>);
    ouvrirConfirmation();
    fireEvent.click(screen.getByRole('button', { name: 'Marquer propres' }));
    expect(screen.getByRole('status')).toBeVisible();
    act(() => { vi.advanceTimersByTime(16_000); });
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('pas de lien quand la recherche cache une partie des fûts à laver', () => {
    render(<Parc kegs={PARC.map((k) => (k.id === 'F-002' ? { ...k, notes: 'Joint à changer' } : k))}/>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Chercher un fût, une bière, un client…' }), { target: { value: 'joint' } });
    expect(ids()).toEqual(['F-002']);
    expect(screen.queryByRole('button', { name: 'Tout marquer propre' })).toBeNull();
  });
  it('un seul fût à laver : singulier', () => {
    render(<Parc kegs={PARC.filter((k) => k.id !== 'F-003' && k.id !== 'F-004')}/>);
    ouvrirConfirmation();
    expect(screen.getByRole('group', { name: 'Marquer 1 fût propre ?' })).toHaveTextContent('F-002 · lavés aujourd’hui');
  });
});

describe('G4 — états vides', () => {
  it('parc vide : pas de jauge, la phrase du « + »', () => {
    render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}><KegBoard kegs={[]} batches={[]}/></VirtuosoMockContext.Provider>);
    expect(screen.queryByRole('button', { name: 'Voir tout' })).toBeNull();
    expect(screen.getByText(/Ajoute des fûts avec le bouton « \+ »/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remplir depuis un lot' })).toBeVisible();
  });
  it('un fût sans date ni bière ne montre ni ligne vide ni valeur inventée', () => {
    render(<Parc kegs={[{ id: 'F-020', capacityL: 20, state: 'plein' }, { id: 'F-021', capacityL: 20, state: 'propre' }]}/>);
    const l = screen.getByRole('button', { name: 'Ouvrir le fût F-020' });
    expect(l).toHaveTextContent('F-02020 LBière non renseignée');
    expect(l).not.toHaveTextContent(' j');
    expect(screen.getByRole('button', { name: 'Ouvrir le fût F-021' })).toHaveTextContent('F-02120 LPropre');
  });
  it('toucher une ligne ouvre toujours la fiche F2', () => {
    render(<Parc/>);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le fût F-001' }));
    expect(screen.getByRole('dialog', { name: 'Fût F-001' })).toBeVisible();
  });
});
