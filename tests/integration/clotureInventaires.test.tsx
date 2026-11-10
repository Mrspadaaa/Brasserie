/* Voie ci (CP-10) : étape 3 de la clôture comme sa maquette g6 : une petite ligne par nature, des cases qui renvoient à la feuille d'inventaire,
   un estimé « ≈ » pour le malt, les houblons et les emballages. Banc : la démo `financeDemoEntries()` + des articles de stock ajoutés en mémoire. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { ClosingSheet } from '../../src/ui/finance/FinanceForms';
import { AUJOURDHUI, Banc, seedDemo } from './annuelSupport';

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJOURDHUI}T10:00:00`)); window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); seedDemo(); });
afterEach(() => { cleanup(); vi.useRealTimers(); FirestoreRepo.stopSync(); });
const piste = (n: number) => screen.getByRole('button', { name: new RegExp(`^${n}\\. `) });
const stock = (ref: string, name: string, category: string, unit: string, currentStock: number) => FirestoreRepo.put('stockItems', ref, { id: ref, ref, name, category, unit, currentStock, minStock: 0, reorder: false, kind: 'rawMaterials' });
/** Onze malts : la démo en a un (Pilsner, 3 kg) ; on en ajoute dix, dont trois à 0 kg. */
const onzeMalts = () => {
  stock('M-PILS', 'Pilsner Malz', 'Malt', 'kg', 10); stock('M-WEIZ', 'Weizenmalz', 'Malt', 'kg', 8.5); stock('M-MAR', 'Malt Maris Otter', 'Malt', 'kg', 6.5);
  stock('M-AVO', 'Flocons d’Avoine', 'Malt', 'kg', 3); stock('M-MUN', 'Munich', 'Malt', 'kg', 2); stock('M-VIE', 'Vienna', 'Malt', 'kg', 1.5); stock('M-CAR', 'Carapils', 'Malt', 'kg', 1);
  stock('M-CHO', 'Malt Chocolat', 'Malt', 'kg', 0); stock('M-CRI', 'Crystal', 'Malt', 'kg', 0); stock('M-ROT', 'Rôti', 'Malt', 'kg', 0);
};
const nature = (libelle: string) => screen.getByText(libelle, { selector: 'span' }).closest('.n') as HTMLElement;
const petite = (libelle: string) => nature(libelle).querySelector('small') as HTMLElement | null;

describe('Étape 3 : la petite ligne tient sur une ligne, les articles à 0 sont exclus', () => {
  it('onze malts dont trois à 0 kg : les deux plus gros, puis « +N », « aujourd’hui » une seule fois', () => {
    onzeMalts();
    render(<Banc/>); fireEvent.click(piste(3));
    const l = petite('Malt')!;
    expect(l.textContent).toBe('Pilsner Malz 10 kg, Weizenmalz 8,5 kg +6 aujourd’hui');
    expect(l.textContent).not.toMatch(/Chocolat|\b0 kg/);
    expect((l.textContent!.match(/aujourd’hui/g) ?? [])).toHaveLength(1);
  });
  it('un seul article : « Pilsner 3 kg aujourd’hui » ; emballages : les noms, sans quantité', () => {
    stock('E-BOU', 'Bouteilles 33 cl', 'Emballage', 'pièces', 400); stock('E-CAP', 'Capsules', 'Emballage', 'pièce', 900); stock('E-ETI', 'Étiquettes', 'Emballage', 'pièce', 0);
    render(<Banc/>); fireEvent.click(piste(3));
    expect(petite('Malt')!.textContent).toBe('Pilsner 3 kg aujourd’hui');
    expect(petite('Emballages')!.textContent).toBe('Capsules, Bouteilles 33 cl');
  });
  it('plus de phrase « La bière en cave se saisit dans la feuille »', () => {
    render(<Banc/>); fireEvent.click(piste(3));
    expect(screen.queryByText(/se saisit dans la feuille/)).toBeNull();
    expect(screen.queryByText(/Ajouter une ligne/)).toBeNull();
  });
});

describe('Étape 3 : chaque case « ? » ou « ≈ » renvoie à la feuille, du bon côté, avec sa nature', () => {
  it('« ? » Malt 31 déc. (onze malts, un seul facturé) ouvre la clôture, nature malt, proposition du stock', () => {
    onzeMalts();
    const onInventories = vi.fn();
    render(<Banc spies={{ onInventories }}/>); fireEvent.click(piste(3));
    const b = screen.getByRole('button', { name: 'Noter Malt au 31 déc.' });
    expect(b.textContent).toBe('?');
    fireEvent.click(b);
    expect(onInventories).toHaveBeenCalledWith(expect.objectContaining({ cote: 'closingInventory', nature: 'malt', proposer: true }));
  });
  it('« ? » du 1er janv. ouvre l’ouverture ; le stock d’aujourd’hui n’y est pas proposé', () => {
    const onInventories = vi.fn();
    render(<Banc spies={{ onInventories }}/>); fireEvent.click(piste(3));
    fireEvent.click(screen.getByRole('button', { name: 'Noter Malt au 1er janv.' }));
    expect(onInventories).toHaveBeenCalledWith(expect.objectContaining({ cote: 'openingInventory', nature: 'malt' }));
    expect(onInventories.mock.calls[0][0].proposer).toBeFalsy();
    expect(onInventories.mock.calls[0][0].propositions ?? []).toHaveLength(0);
  });
  it('Bière en cave : la nature bière est déjà choisie', () => {
    const onInventories = vi.fn();
    render(<Banc spies={{ onInventories }}/>); fireEvent.click(piste(3));
    fireEvent.click(screen.getByRole('button', { name: 'Noter Bière en cave au 31 déc.' }));
    expect(onInventories).toHaveBeenCalledWith(expect.objectContaining({ cote: 'closingInventory', nature: 'biere' }));
  });
  it('la case « ≈ 22,42 » est aussi un bouton, avec l’estimé en une ligne ; le brouillon reste vide', () => {
    const onInventories = vi.fn();
    render(<Banc spies={{ onInventories }}/>); fireEvent.click(piste(3));
    const b = screen.getByRole('button', { name: 'Noter Malt au 31 déc.' });
    expect(b.textContent).toBe('≈ 22,42');
    expect(screen.getByText('≈ 22,42 : 3 kg au prix de la dernière facture, estimé')).toBeVisible();
    fireEvent.click(b);
    expect(onInventories).toHaveBeenCalledWith(expect.objectContaining({ cote: 'closingInventory', nature: 'malt', propositions: [expect.objectContaining({ valueCents: 2242 })] }));
  });
});

describe('Étape 3 : l’estimé « ≈ » pour les houblons et les emballages, jamais 0', () => {
  it('houblons et emballages facturés : « ≈ » ; houblon sans facture : « ? » hachuré', () => {
    stock('H-CIT', 'Citra', 'Houblon', 'g', 250); stock('E-CAP', 'Capsules', 'Emballage', 'pièces', 400);
    const t = FirestoreRepo.all<any>('transactions').find(x => x.id === 'DEMO-T1');
    FirestoreRepo.put('transactions', 'ZZ-T-HOUBLON', { ...t, id: 'ZZ-T-HOUBLON', description: 'Houblons ZZ', finance: { ...t.finance, lines: [{ id: 'h', description: 'Citra', kind: 'ingredient', quantity: 500, unit: 'g', stockItemRef: 'H-CIT', amountCents: 4000 }, { id: 'c', description: 'Capsules', kind: 'packaging', quantity: 1000, unit: 'pièce', stockItemRef: 'E-CAP', amountCents: 5000 }] } });
    render(<Banc/>); fireEvent.click(piste(3));
    expect(screen.getAllByRole('button', { name: 'Noter Houblons au 31 déc.' })[0].textContent).toBe('≈ 20,00');
    expect(screen.getAllByRole('button', { name: 'Noter Emballages au 31 déc.' })[0].textContent).toBe('≈ 20,00');
    expect(screen.getByText(/Houblons ≈ 20,00 : 250 g au prix de la dernière facture, estimé/)).toBeVisible();
    expect(screen.getByText(/Emballages ≈ 20,00 : 400 pièces au prix de la dernière facture, estimé/)).toBeVisible();
    // l'inconnu reste « ? » : Bière en cave n'a ni stock ni facture
    expect(screen.getByRole('button', { name: 'Noter Bière en cave au 31 déc.' }).textContent).toBe('?');
  });
  it('un article en stock sans facture empêche l’estimé de la nature : « ? », pas un total partiel', () => {
    stock('H-CIT', 'Citra', 'Houblon', 'g', 250); stock('H-MOS', 'Mosaic', 'Houblon', 'g', 100);
    const t = FirestoreRepo.all<any>('transactions').find(x => x.id === 'DEMO-T1');
    FirestoreRepo.put('transactions', 'ZZ-T-HOUBLON', { ...t, id: 'ZZ-T-HOUBLON', finance: { ...t.finance, lines: [{ id: 'h', description: 'Citra', kind: 'ingredient', quantity: 500, unit: 'g', stockItemRef: 'H-CIT', amountCents: 4000 }] } });
    render(<Banc/>); fireEvent.click(piste(3));
    expect(screen.getByRole('button', { name: 'Noter Houblons au 31 déc.' }).textContent).toBe('?');
  });
});

describe('La feuille d’inventaire reçoit la nature visée', () => {
  const stocks = () => FirestoreRepo.all<any>('stockItems');
  const ouvre = (p: Record<string, unknown>) => render(<ClosingSheet year={2026} stockItems={stocks()} onClose={() => {}} {...p}/>);
  it('nature biere sans ligne : une ligne vide, nature « Bière conditionnée » déjà choisie, valeur non saisie', () => {
    ouvre({ cote: 'closingInventory', nature: 'biere' });
    expect((screen.getByLabelText('Nature') as HTMLSelectElement).value).toBe('finished');
    expect((screen.getByLabelText(/Valeur totale/) as HTMLInputElement).value).toBe('');
  });
  it('nature malt + proposer : seulement les malts en stock (0 kg exclus), valeurs non saisies', () => {
    onzeMalts(); stock('H-CIT', 'Citra', 'Houblon', 'g', 250);
    ouvre({ cote: 'closingInventory', nature: 'malt', proposer: true });
    const noms = screen.getAllByLabelText('Article ou brassin').map(i => (i as HTMLInputElement).value);
    expect(noms).toHaveLength(8); expect(noms).toContain('Pilsner Malz'); expect(noms).not.toContain('Citra'); expect(noms).not.toContain('Malt Chocolat');
    for (const v of screen.getAllByLabelText(/Valeur totale/)) expect((v as HTMLInputElement).value).toBe('');
  });
  it('nature emballages sans proposition : une ligne vide « Emballages »', () => {
    ouvre({ cote: 'openingInventory', nature: 'emballages' });
    expect((screen.getByLabelText('Nature') as HTMLSelectElement).value).toBe('packaging');
  });
});
