// @vitest-environment jsdom
/**
 * Voie ecr4 (24.11) : Modifier = la feuille de saisie (E41-4 : « changer », règlement dans la carte, pièce après le montant),
 * la date d'une pièce payée déplace son paiement (E41-5), la piste de date de la saisie finit à aujourd'hui et nomme le mois (E41-6).
 * Fixtures simulées, aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { poserDate } from '../helpers/poserDate';

const store = new Map<string, Map<string, Record<string, unknown>>>();
const fakeRepo = {
  all: <T,>(name: string): T[] => Array.from(store.get(name)?.entries() ?? []).map(([__docId, doc]) => ({ ...doc, __docId }) as T),
  put: (name: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
    if (!store.has(name)) store.set(name, new Map());
    const value = options?.merge ? { ...store.get(name)!.get(id), ...(doc as object) } : doc;
    store.get(name)!.set(id, JSON.parse(JSON.stringify(value)));
  },
  adjustNumber: () => {}, remove: (name: string, id: string) => { store.get(name)?.delete(id); },
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, consumeWriteError: () => null, clearMemoryCache: () => store.clear()
};
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: fakeRepo, ALL_COLLECTIONS: [] }));
const { StorageService } = await import('../../src/services/storage');
const { FinanceService } = await import('../../src/services/financeService');
const { EditTransactionModal } = await import('../../src/components/EditTransactionModal');
const { ChoixDate } = await import('../../src/ui/ChoixDate');
const { avecGenre, brouillonNeuf, preparer } = await import('../../src/ui/saisie/modele');
const { planDeplacerPaiement } = await import('../../src/domain/finance/deplacerPaiement');
const { paymentState } = await import('../../src/domain/finance/ledger');
type Tx = import('../../src/types').Transaction;
type Pay = import('../../src/domain/finance/types').FinancialPayment;

beforeEach(() => { store.clear(); localStorage.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-24T10:00:00')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

function poserAchat(genre: 'achat' | 'loyer' = 'achat'): Tx {
  const e = preparer({ ...avecGenre(brouillonNeuf('2026-11-19'), genre), cents: 350, nom: 'ZZ TEST — Achat' }, { id: 'TX-M', maintenant: '2026-11-19T10:00:00Z', transactions: [], tvaInscrit: false });
  StorageService.addTransaction(e.transaction as never);
  if (e.paiement) FinanceService.recordPayment(e.paiement);
  return e.transaction as unknown as Tx;
}

describe('E41-4 : Modifier a la forme de la saisie', () => {
  it('« changer » dans la bande ; le règlement est dans la carte ; la pièce vient après le montant', () => {
    const tx = poserAchat();
    render(<EditTransactionModal isOpen transaction={tx} onClose={() => undefined} onSave={() => undefined} />);
    const bande = document.querySelector('[data-modifier-bande]')!;
    expect(bande.textContent).toContain('Ça sort');
    expect(bande.querySelector('[data-modifier-changer]')?.textContent).toBe('changer');
    const carte = document.querySelector('[data-modifier-carte]')!;
    expect(carte.querySelector('[data-modifier-reglement]')?.textContent).toMatch(/Payé le 19\.11/);
    expect(carte.querySelector('[data-modifier-reglement]')?.textContent).toContain('Banque');
    // la pièce (ici « Pas encore de pièce ») est après la carte, jamais en tête
    const drop = document.querySelector('.mod-drop')!;
    expect(carte.compareDocumentPosition(drop) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('« changer » propose les sortes voisines (même sens) et pose la catégorie de la sorte choisie', async () => {
    const tx = poserAchat();
    const sauve = vi.fn();
    render(<EditTransactionModal isOpen transaction={tx} onClose={() => undefined} onSave={sauve} />);
    expect(document.querySelector('[data-modifier-sortes]')).toBeNull();
    act(() => { fireEvent.click(document.querySelector('[data-modifier-changer]')!); });
    const sortes = [...document.querySelectorAll('[data-modifier-sorte]')].map(e => e.getAttribute('data-modifier-sorte'));
    expect(sortes.sort()).toEqual(['abo', 'autreo', 'impot', 'loyer', 'salaire']);
    act(() => { fireEvent.click(document.querySelector('[data-modifier-sorte="loyer"]')!); });
    expect(document.querySelector('[data-modifier-bande]')?.textContent).toContain('Loyer');
    await act(async () => { fireEvent.submit(document.querySelector('form')!); });
    await waitFor(() => expect(sauve).toHaveBeenCalled());
    const ecrit = StorageService.getTransactions().find(t => t.id === 'TX-M')!;
    expect(ecrit.subcategory).toBe('Loyer');
    expect(ecrit.category).toBe('chargesFixes');
  });
  it('un apport n’a pas de « changer » (sa nature fixe le grand livre)', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf('2026-11-19'), 'apport'), cents: 500, nom: 'ZZ TEST — Apport' }, { id: 'TX-AP', maintenant: '2026-11-19T10:00:00Z', transactions: [], tvaInscrit: false });
    StorageService.addTransaction(e.transaction as never);
    render(<EditTransactionModal isOpen transaction={e.transaction as never} onClose={() => undefined} onSave={() => undefined} />);
    expect(document.querySelector('[data-modifier-changer]')).toBeNull();
  });
});

describe('E41-5 : la date d’une pièce payée déplace son paiement', () => {
  const pay = (id: string, date: string): Pay => ({ id, transactionId: 'TX-M', date, amountCents: 350, direction: 'out', method: 'bank', recordedAt: `${date}T10:00:00Z` }) as Pay;
  it('plan : un contre-paiement et le paiement réécrit au nouveau jour ; rien si le paiement n’est pas au jour de la pièce ou si la date est future', () => {
    const tx = { id: 'TX-M', date: '2026-11-19' } as Tx;
    expect(planDeplacerPaiement(tx, [pay('P1', '2026-11-19')], '2026-11-04', '2026-11-24')).toEqual([
      { type: 'contre', paiementId: 'P1', note: expect.any(String) },
      { type: 'paiement', cents: 350, direction: 'out', method: 'bank', date: '2026-11-04', note: expect.any(String) }]);
    expect(planDeplacerPaiement(tx, [pay('P1', '2026-11-20')], '2026-11-04', '2026-11-24')).toEqual([]);
    expect(planDeplacerPaiement(tx, [pay('P1', '2026-11-19')], '2026-12-04', '2026-11-24')).toEqual([]);
    expect(planDeplacerPaiement(tx, [], '2026-11-04', '2026-11-24')).toEqual([]);
    expect(planDeplacerPaiement(tx, [pay('P1', '2026-11-19')], '2026-11-19', '2026-11-24')).toEqual([]);
  });
  it('Modifier : la date glissée au 04.11, Enregistrer : la pièce et son paiement sont au 04.11, l’achat reste payé', async () => {
    const tx = poserAchat();
    render(<EditTransactionModal isOpen transaction={tx} onClose={() => undefined} onSave={() => undefined} />);
    act(() => { fireEvent.click(document.querySelector('[data-modifier-date]')!); });
    poserDate('Date de l’opération', '2026-11-04');
    expect(document.querySelector('[data-modifier-reglement]')?.textContent).toMatch(/Payé le 04\.11/);
    await act(async () => { fireEvent.submit(document.querySelector('form')!); });
    await waitFor(() => expect(StorageService.getTransactions().find(t => t.id === 'TX-M')?.date).toMatch(/2026-11-04|04\.11\.2026/));
    const paiements = FinanceService.getPayments() as Pay[];
    const vivants = paiements.filter(p => p.transactionId === 'TX-M' && !p.reversalOfId && !paiements.some(c => c.reversalOfId === p.id));
    expect(vivants.map(p => p.date)).toEqual(['2026-11-04']);
    const piece = StorageService.getTransactions().find(t => t.id === 'TX-M')!;
    expect(paymentState(piece as never, paiements, StorageService.getTransactions() as never).state).toBe('paid');
  });
});

describe('E41-6 : la piste de date de la saisie finit à aujourd’hui et nomme le mois', () => {
  const lire = (props: { saisie: boolean; max?: string }) => {
    render(<ChoixDate ouvert label="Date" valeur="2026-11-24" rangee="achats" onChange={() => undefined} {...props} />);
    const piste = document.querySelector<HTMLElement>('.cal-f-duree-piste')!;
    const reps = [...piste.querySelectorAll<HTMLElement>('.cal-f-duree-rep')];
    const poi = parseFloat(piste.querySelector<HTMLElement>('[data-date-point]')!.style.left);
    return { poi, derniers: Math.max(...reps.map(r => parseFloat(r.style.left))), mois: reps.map(r => r.querySelector('small')?.textContent).filter(Boolean) as string[] };
  };
  it('avec la borne : rien de dessiné au-delà de deux jours après le repère ; le mois du jour est écrit', () => {
    const { poi, derniers, mois } = lire({ saisie: true, max: '2026-11-24' });
    expect(derniers).toBeLessThanOrEqual(poi + 3 * (366 / 42) + 1);
    expect(mois).toContain('nov.');
    expect(mois).not.toContain('déc.');
  });
  it('sans borne (Calendrier, fiches) : la piste continue après le repère, comme avant', () => {
    const { poi, derniers } = lire({ saisie: false });
    expect(derniers).toBeGreaterThan(poi + 100);
  });
});

describe('E41-1 (fiche) : la confirmation du retrait dit ce que devient le remboursement et dit pourquoi elle refuse', () => {
  async function fiche() {
    const { TransactionDetails } = await import('../../src/ui/finance/TransactionDetails');
    const achat = preparer({ ...avecGenre(brouillonNeuf('2026-11-19'), 'achat'), cents: 450, nom: 'ZZ TEST — Achat' }, { id: 'TX-A', maintenant: '2026-11-19T10:00:00Z', transactions: [], tvaInscrit: false });
    StorageService.addTransaction(achat.transaction as never);
    FinanceService.recordPayment(achat.paiement!);
    const r = preparer({ ...avecGenre(brouillonNeuf('2026-11-20'), 'rembt'), cents: 100, pieceId: 'TX-A' }, { id: 'TX-R', maintenant: '2026-11-20T10:00:00Z', transactions: [achat.transaction], tvaInscrit: false });
    StorageService.addTransaction(r.transaction as never);
    FinanceService.recordPayment(r.paiement!);
    const txs = StorageService.getTransactions();
    render(<TransactionDetails transaction={txs.find(t => t.id === 'TX-A')!} transactions={txs} payments={FinanceService.getPayments()} plans={[]}
      onClose={() => undefined} onEdit={() => undefined} onPay={() => undefined} onRefund={() => undefined} />);
    const ouvrir = [...document.querySelectorAll('button')].find(b => b.textContent === 'Retirer cette écriture')!;
    act(() => { fireEvent.click(ouvrir); });
  }
  it('le texte annonce le remboursement lié, et le retrait aboutit', async () => {
    await fiche();
    expect(document.querySelector('.fiche-corriger')?.textContent).toMatch(/remboursement lié/);
    const confirmer = [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmer le retrait')!;
    await act(async () => { fireEvent.click(confirmer); });
    await waitFor(() => expect(StorageService.getTransactions().find(t => t.id === 'TX-A')?.finance?.voidedAt).toBeTruthy());
    expect(StorageService.getTransactions().find(t => t.id === 'TX-R')?.finance?.voidedAt).toBeTruthy();
  });
  it('un refus s’écrit sous le bouton touché, la confirmation reste ouverte', async () => {
    await fiche();
    fakeRepo.put('financialAssets', 'AS-1', { id: 'AS-1', transactionId: 'TX-A' });
    const confirmer = [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmer le retrait')!;
    await act(async () => { fireEvent.click(confirmer); });
    await waitFor(() => expect(document.querySelector('.fiche-corriger [role="alert"]')).toBeTruthy());
    expect(document.querySelector('.fiche-corriger [role="alert"]')?.textContent).toMatch(/amortissement/);
    expect(document.querySelector('.fiche-corriger')).toBeTruthy();
  });
});
