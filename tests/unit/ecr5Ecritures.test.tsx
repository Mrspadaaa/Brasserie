// @vitest-environment jsdom
/**
 * Voie ecr5 (24.11, tour 43) : E43-1 (date d'un achat payé : « Missing or insufficient permissions »), E41-1 (retirer un achat qui a un remboursement),
 * E41-2 (« De quelle pièce ? » ne montre que les ZZ). Le dépôt est le serveur simulé de ecr5ServeurSimule.ts : il refuse ce que les règles refusent.
 * Fixtures simulées, aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { poserDate } from '../helpers/poserDate';
import { creerServeurSimule } from './ecr5ServeurSimule';

const sim = creerServeurSimule();
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: sim.depot, ALL_COLLECTIONS: [] }));
const { StorageService } = await import('../../src/services/storage');
const { FinanceService } = await import('../../src/services/financeService');
const { EditTransactionModal } = await import('../../src/components/EditTransactionModal');
const { avecGenre, brouillonNeuf, preparer } = await import('../../src/ui/saisie/modele');
const { retirerEcriture } = await import('../../src/ui/finance/modifier/retirerEcriture');
type Tx = import('../../src/types').Transaction;

beforeEach(() => { sim.depot.clearMemoryCache(); localStorage.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-24T10:00:00')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

/** Comme la saisie : la pièce et son paiement dans le même tour synchrone (un seul lot). */
function saisir(id: string, genre: 'achat' | 'rembt', jour: string, cents: number, extra: Record<string, unknown> = {}): Tx {
  const e = preparer({ ...avecGenre(brouillonNeuf(jour), genre), cents, nom: `ZZ TEST — ${id}`, ...extra } as never,
    { id, maintenant: `${jour}T10:00:00Z`, transactions: StorageService.getTransactions() as never, tvaInscrit: false });
  StorageService.addTransaction(e.transaction as never);
  if (e.paiement) FinanceService.recordPayment(e.paiement);
  return e.transaction as unknown as Tx;
}
const ctx = () => ({ aujourdhui: '2026-11-24', maintenant: '2026-11-24T10:00:00Z' });

describe('E43-1 : déplacer la date d’un achat payé n’est jamais refusé par le serveur', () => {
  it('Modifier : date 19.11 → 14.11, Enregistrer : aucun lot refusé, pièce et paiement au 14.11, achat payé', async () => {
    const tx = saisir('TX-D', 'achat', '2026-11-19', 450);
    await sim.attendre();
    expect(sim.refus).toEqual([]);
    render(<EditTransactionModal isOpen transaction={tx} onClose={() => undefined} onSave={() => undefined} />);
    act(() => { fireEvent.click(document.querySelector('[data-modifier-date]')!); });
    poserDate('Date de l’opération', '2026-11-14');
    await act(async () => { fireEvent.submit(document.querySelector('form')!); });
    await act(async () => { await sim.attendre(); });
    expect(sim.refus).toEqual([]);
    expect(String(sim.piece('TX-D')?.date)).toMatch(/2026-11-14|14\.11\.2026/);
    const vivants = sim.paiements().filter(p => !p.reversalOfId && !sim.paiements().some(c => c.reversalOfId === p.id));
    expect(vivants.map(p => p.date)).toEqual(['2026-11-14']);
    expect(sim.piece('TX-D')?.settlementBalanceCents).toBe(450);
  });
});

describe('E41-1 : retirer un achat qui a un remboursement lié', () => {
  it('le remboursement part avec l’achat, tous deux annulés, aucun lot refusé', async () => {
    saisir('TX-A', 'achat', '2026-11-19', 450);
    saisir('TX-R', 'rembt', '2026-11-20', 100, { pieceId: 'TX-A' });
    await sim.attendre();
    expect(sim.refus).toEqual([]);
    await act(async () => { await retirerEcriture('TX-A', FinanceService.getPayments(), ctx()); });
    await act(async () => { await sim.attendre(); });
    expect(sim.refus).toEqual([]);
    expect(sim.piece('TX-A')?.finance?.voidedAt).toBeTruthy();
    expect(sim.piece('TX-R')?.finance?.voidedAt).toBeTruthy();
  });
});

describe('E41-1 : achat corrigé de 3,50 à 4,50 (deux paiements) avec un remboursement lié', () => {
  it('Modifier le montant, rembourser, retirer : tout part, le serveur ne refuse aucun lot', async () => {
    const { executerPlan } = await import('../../src/ui/finance/modifier/executerCorrection');
    saisir('TX-A', 'achat', '2026-11-19', 350);
    await sim.attendre();
    await act(async () => {
      await executerPlan([{ type: 'montant', cents: 450 }, { type: 'paiement', cents: 100, direction: 'out', method: 'bank' }] as never, 'TX-A', ctx(),
        v => ({ ...v, amountTTC: 4.5, amountHT: 4.5, finance: { ...v.finance!, amountCents: 450 } }) as never);
    });
    await sim.attendre();
    expect(sim.refus).toEqual([]);
    saisir('TX-R', 'rembt', '2026-11-20', 100, { pieceId: 'TX-A' });
    await sim.attendre();
    expect(sim.refus).toEqual([]);
    await act(async () => { await retirerEcriture('TX-A', FinanceService.getPayments(), ctx()); });
    await act(async () => { await sim.attendre(); });
    expect(sim.refus).toEqual([]);
    expect(sim.piece('TX-A')?.finance?.voidedAt).toBeTruthy();
    expect(sim.piece('TX-R')?.finance?.voidedAt).toBeTruthy();
  });
});

describe('E41-1 : état laissé à moitié par l’ancien E43-1 (paiements au 14.11, pièce au 19.11) puis retrait', () => {
  it('les paiements déplacés sans la pièce, un remboursement lié : le retrait aboutit', async () => {
    const { executerPlan } = await import('../../src/ui/finance/modifier/executerCorrection');
    const { planDeplacerPaiement } = await import('../../src/domain/finance/deplacerPaiement');
    saisir('TX-A', 'achat', '2026-11-19', 450);
    await sim.attendre();
    const tx = StorageService.getTransactions().find(t => t.id === 'TX-A')!;
    const plan = planDeplacerPaiement(tx, FinanceService.getPayments(), '2026-11-14', '2026-11-24');
    await act(async () => { await executerPlan(plan, 'TX-A', ctx(), v => v); });
    await sim.attendre();
    saisir('TX-R', 'rembt', '2026-11-20', 100, { pieceId: 'TX-A' });
    await sim.attendre();
    expect(sim.refus).toEqual([]);
    await act(async () => { await retirerEcriture('TX-A', FinanceService.getPayments(), ctx()); });
    await act(async () => { await sim.attendre(); });
    expect(sim.refus).toEqual([]);
    expect(sim.piece('TX-A')?.finance?.voidedAt).toBeTruthy();
    expect(sim.piece('TX-R')?.finance?.voidedAt).toBeTruthy();
  });
});

describe('E41-2 : « De quelle pièce ? » trouve les pièces réelles, dont la date est écrite 19.11.2026', () => {
  const reel = (id: string, date: string, desc: string, vendor: string | undefined, ttc: number) => ({
    id, date, description: desc, category: 'brassage', subcategory: '', amountHT: ttc, amountTTC: ttc, tvaRate: 0, tvaAmount: 0,
    finance: { version: 1, kind: 'expense', amountCents: Math.round(ttc * 100), lines: [], ...(vendor ? { vendor } : {}) }
  }) as never;
  const pay = (id: string, tx: string, date: string, cents: number) => ({ id, transactionId: tx, date, amountCents: cents, direction: 'out', method: 'bank', recordedAt: `${date}T10:00:00Z` }) as never;
  it('le format jj.mm.aaaa d’une pièce ancienne ne l’écarte pas ; recherche par nom et par montant ; tri du plus récent', async () => {
    const { piecesRemboursables, habituels } = await import('../../src/ui/saisie/modele');
    const txs = [reel('R1', '19.11.2026', 'consomable ( masque gant)', undefined, 23), reel('R2', '27.04.2026', 'Brau- und Rauchshop', 'Brau- und Rauchshop', 110.4), reel('R3', '2026-11-20', 'ZZ TEST — Achat', undefined, 4.5)];
    const paiements = [pay('P1', 'R1', '2026-11-19', 2300), pay('P2', 'R2', '2026-04-27', 11040), pay('P3', 'R3', '2026-11-20', 450)];
    expect(piecesRemboursables(txs, '', 30, true, paiements).map(p => p.id)).toEqual(['R3', 'R1', 'R2']);
    expect(piecesRemboursables(txs, 'masque', 30, true, paiements).map(p => p.id)).toEqual(['R1']);
    expect(piecesRemboursables(txs, '23', 30, true, paiements).map(p => p.id)).toEqual(['R1']);
    expect(piecesRemboursables(txs, 'Brau', 30, true, paiements).map(p => p.id)).toEqual(['R2']);
    expect(piecesRemboursables(txs, 'masque', 30, true, paiements)[0].sous).toContain('19.11');
    expect(piecesRemboursables(txs, 'masque', 30, true, paiements)[0].date).toBe('2026-11-19');
    // les habituels lisent les mêmes pièces (leur date n'est pas non plus écartée)
    expect(habituels(txs, [], '2026-11-24').map(h => h.nom)).toEqual(['ZZ TEST — Achat', 'consomable ( masque gant)', 'Brau- und Rauchshop']);
  });
});

describe('E43-2 : la carte d’une chose lit le montant exact', () => {
  it('2,50 reste 2,50 ; les francs ronds restent entiers ; le signe est un vrai moins', async () => {
    const { francsExacts, francsSignesExacts, francsSignes } = await import('../../src/domain/calendrier');
    expect(francsSignesExacts(-250)).toBe('−2,50');
    expect(francsSignesExacts(480)).toBe('+4,80');
    expect(francsSignesExacts(110)).toBe('+1,10');
    expect(francsSignesExacts(-506400)).toBe('−5 064');
    expect(francsSignesExacts(-5)).toBe('−0,05');
    expect(francsExacts(0)).toBe('0');
    expect(francsSignes(-250)).toBe('−3'); // les rangées gardent les francs entiers
  });
});

describe('E43-3 : trois récurrentes ne prennent pas toute la place des habituels', () => {
  it('au plus deux prévisions ; « De ma poche » (dernier mouvement réel) garde sa place ; la sous-ligne dit l’échéance et l’action', async () => {
    const { habituels } = await import('../../src/ui/saisie/modele');
    const plan = (id: string, titre: string, dir: 'in' | 'out') => ({ id, title: titre, date: '2026-11-22', amountCents: 1000, direction: dir, category: 'apports', source: 'recurring', status: 'active', recurrence: { frequency: 'monthly' }, createdAt: '2026-11-01' }) as never;
    const apport = { id: 'T-A', date: '03.10.2026', description: 'De ma poche', category: 'apports', subcategory: 'Apport privé', amountHT: 1500, amountTTC: 1500, tvaRate: 0, tvaAmount: 0,
      finance: { version: 1, kind: 'contribution', amountCents: 150000, lines: [] } } as never;
    const h = habituels([apport], [plan('P1', 'ZZ TEST — Apport', 'in'), plan('P2', 'ZZ TEST — Salaire', 'out'), plan('P3', 'ZZ TEST — Pour moi', 'out')], '2026-11-24');
    expect(h).toHaveLength(3);
    expect(h.map(x => x.nom)).toEqual(['ZZ TEST — Apport', 'ZZ TEST — Salaire', 'De ma poche']);
    expect(h[0].sous).toBe('échéance le 22.11 · à enregistrer');
    expect(h[2].sous).toBe('apport · dernier le 03.10');
  });
});

describe('E43-4 et E43-5 : icône par compte ; Modifier d’un Apport = la saisie', () => {
  it('chaque compte a son icône (TWINT n’est plus la banque)', async () => {
    const { IconeCompte } = await import('../../src/ui/saisie/IconeCompte');
    const lire = (m: string) => { const { container, unmount } = render(<IconeCompte methode={m} />); const svg = container.querySelector('svg')!; const c = svg.getAttribute('class') ?? ''; unmount(); return c; };
    const classes = ['bank', 'cash', 'twint', 'other'].map(lire);
    expect(new Set(classes).size).toBe(4);
    expect(lire('twint')).not.toBe(lire('bank'));
  });
  it('Modifier d’un Apport : « Apports privés », pas de champ « Tiers » ; un achat garde son « Chez »', async () => {
    const a = preparer({ ...avecGenre(brouillonNeuf('2026-11-19'), 'apport'), cents: 1000, nom: 'ZZ TEST — Apport' } as never, { id: 'TX-AP', maintenant: '2026-11-19T10:00:00Z', transactions: [], tvaInscrit: false });
    StorageService.addTransaction(a.transaction as never);
    if (a.paiement) FinanceService.recordPayment(a.paiement);
    render(<EditTransactionModal isOpen transaction={a.transaction as never} onClose={() => undefined} onSave={() => undefined} />);
    expect(document.querySelector('[data-modifier-carte] .finance-tag')?.textContent).toMatch(/Apports privés/);
    expect(document.querySelector('[data-modifier-tiers]')).toBeNull();
    cleanup();
    const v = saisir('TX-V', 'achat', '2026-11-19', 350);
    render(<EditTransactionModal isOpen transaction={v} onClose={() => undefined} onSave={() => undefined} />);
    expect(document.querySelector('[data-modifier-tiers]')).not.toBeNull();
  });
});
