// @vitest-environment jsdom
/**
 * Voie r1-raccord, R1 à R3 : ce que s1/s2 ont réparé arrive jusqu'à l'écran. L'écran est jugé sur le brouillon qu'il envoie à l'enregistrement
 * (`savePurchaseWithProofReceipt` simulé). Gemini simulé, Drive jamais touché, aucune donnée réelle.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ scanned: vi.fn(), saved: vi.fn(), onSaved: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: async (draft: any) => { state.saved(structuredClone(draft)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { toucherUnite, unitePressee } from '../aide-plateau';
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { swissToday } from '../../../../src/ui/DateField';

const result = (more: Record<string, unknown> = {}, items?: any[]) => ({ documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Malterie du Banc SA', date: '12.03.2026', currency: 'CHF', invoiceNumber: 'MB-1',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 10, category: 'brassage', subcategory: '', description: 'Achat', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
  items: items ?? [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 1, unit: 'Kg', amountTTC: 10, stockCategory: '' }], ...more });
const send = (view: ReturnType<typeof render>, name: string) => {
  const file = new File(['%PDF-1.4\n' + name], name + '.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n' + name).buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
};
const open = async (first: any) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: first });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: state.onSaved }));
  send(view, 'un');
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const rescan = async (view: ReturnType<typeof render>, outcome: any, until: () => void) => {
  state.scanned.mockResolvedValueOnce(outcome);
  send(view, 'deux');
  await waitFor(until);
};
const save = async (label = 'Confirmer et enregistrer') => {
  fireEvent.click(screen.getByRole('button', { name: label }));
  try { await waitFor(() => expect(state.saved).toHaveBeenCalled()); }
  catch (error) { throw new Error('L’enregistrement n’est pas parti. Alertes : ' + screen.queryAllByRole('alert').map(node => node.textContent).join(' | '), { cause: error }); }
  return state.saved.mock.calls.at(-1)![0];
};
const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.saved.mockReset(); state.onSaved.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('R1 : le prix unitaire lu est gardé', () => {
  const items = [
    { id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 6, unit: 'Kg', price: 2.3, amountTTC: 13.8, stockCategory: '' },
    { id: 'line-2', name: 'Target', kind: 'stock', quantity: 40, unit: 'g', price: 0.04, amountTTC: 1.6, stockCategory: '' },
    { id: 'line-3', name: 'Port', kind: 'shipping', quantity: 1, unit: 'pce', price: null, amountTTC: 5, stockCategory: '' }
  ];
  it('chaque ligne scannée porte son prix lu, la ligne sans prix lu n’en reçoit pas', async () => {
    await open(result({ amountTTC: 20.4 }, items));
    const sent = await save();
    expect(sent.lines.map((l: any) => [l.unit, l.unitPrice])).toEqual([['Kg', 2.3], ['g', 0.04], ['pce', undefined]]);
  });
  it('R1b : retaper l’unité de la ligne retire le prix lu (il valait pour l’unité imprimée)', async () => {
    await open(result({ amountTTC: 20.4 }, items));
    // 28c98cba (pu4d, D350) : l'unité est un segment (un toucher sur « g »). Test périmé sur un point : d'une masse à l'autre la quantité et le prix se CONVERTISSENT (B2 n° 3, 5cf2f99d, work/missions/2026-10-31-ecran-depense/banc-b2/RESULTAT.md : 2 Kg × 1,55 = 2 000 g × 0,00155) au lieu de retirer le prix ; le montant lu reste.
    toucherUnite(1, 'g');
    expect(unitePressee(1)).toBe('g');
    const sent = await save();
    expect(sent.lines[0]).toMatchObject({ unit: 'g', quantity: 6000, amount: 13.8 });
    expect(sent.lines[0].unitPrice).toBeCloseTo(0.0023, 6);
    expect(sent.lines[1].unitPrice).toBe(0.04);
  });
});

describe('R1 : cas limites du prix unitaire', () => {
  const kilo = [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 6, unit: 'Kg', price: 2.3, amountTTC: 13.8, stockCategory: '' }];
  it('Conception n° 14 : retaper la MÊME unité garde le prix unitaire (une autre unité le retire : voir R1b)', async () => {
    await open(result({ amountTTC: 13.8 }, kilo));
    // 28c98cba (pu4d, D350) : « retaper la même unité » = un toucher sur « Kg », déjà allumé : rien ne change.
    expect(unitePressee(1)).toBe('Kg');
    toucherUnite(1, 'Kg');
    expect(unitePressee(1)).toBe('Kg');
    const sent = await save();
    expect(sent.lines[0]).toMatchObject({ unit: 'Kg', unitPrice: 2.3 });
  });
  it('une facture hors CHF : la ligne lue ne reçoit aucun prix unitaire (il serait en EUR, pas en CHF), même quand le brasseur tape le total en CHF', async () => {
    await open(result({ currency: 'EUR', amountTTC: 13.8 }, kilo));
    fireEvent.change(field('Total TTC en CHF'), { target: { value: '13,8' } });
    const sent = await save();
    expect(sent.sourceCurrency).toBe('EUR');
    expect(sent.lines).toHaveLength(1);
    expect(sent.lines[0].unitPrice).toBeUndefined();
  });
});

describe('R2 : une description tapée n’est jamais écrasée par un scan', () => {
  it('scan 1, saisie « Pour quoi ? », scan 2 : la saisie reste, la source est « typed », le fournisseur change', async () => {
    const view = await open(result());
    fireEvent.change(field('Pour quoi ?'), { target: { value: 'Malt pour la Pale Ale' } });
    await rescan(view, { ok: true, model: 'rejeu', result: result({ vendor: 'Autre Malterie SA', invoiceNumber: 'MB-2' }) }, () => expect(field('Fournisseur').value).toBe('Autre Malterie SA'));
    expect(field('Pour quoi ?').value).toBe('Malt pour la Pale Ale');
    const sent = await save();
    expect(sent.description).toBe('Malt pour la Pale Ale');
    expect(sent.descriptionSource).toBe('typed');
  });
  it('témoin : sans saisie, le second scan remplace la description lue par la sienne', async () => {
    const view = await open(result());
    const first = field('Pour quoi ?').value;
    expect(first).toContain('Malterie du Banc');
    await rescan(view, { ok: true, model: 'rejeu', result: result({ vendor: 'Autre Malterie SA', invoiceNumber: 'MB-2' }) }, () => expect(field('Fournisseur').value).toBe('Autre Malterie SA'));
    expect(field('Pour quoi ?').value).toContain('Autre Malterie');
    expect(field('Pour quoi ?').value).not.toContain('Banc');
  });
  it('un second scan en échec garde la saisie, qui devient aussi le libellé de la ligne : l’enregistrement part', async () => {
    const view = await open(result());
    fireEvent.change(field('Pour quoi ?'), { target: { value: 'Malt pour la Pale Ale' } });
    await rescan(view, { ok: false, error: 'Lecture indisponible.' }, () => expect(screen.getByRole('alert')).toHaveTextContent('Lecture indisponible'));
    expect(field('Pour quoi ?').value).toBe('Malt pour la Pale Ale');
    fireEvent.change(field('Total TTC en CHF'), { target: { value: '10' } });
    const sent = await save('Enregistrer la dépense');
    expect(sent.description).toBe('Malt pour la Pale Ale');
    expect(sent.lines).toHaveLength(1);
    expect(sent.lines[0].description).toBe('Malt pour la Pale Ale');
  });
});

describe('R3 : une date de paiement tapée n’est jamais écrasée par un scan', () => {
  // D233 : le champ de la date du paiement n'apparaît que sur « Autre date » (une seule date par défaut : celle de l'achat).
  const hier = () => { const p = within(document.querySelector('[data-purchase-payment]') as HTMLElement); const autre = p.queryByRole('button', { name: 'Autre date' }); if (autre) fireEvent.click(autre); return p.getByRole('button', { name: 'Hier' }); };
  it('scan 1, date de paiement tapée (« Hier »), scan 2 : la date reste, sa base est « typed », la date du document suit le scan', async () => {
    const view = await open(result());
    fireEvent.click(hier());
    const typed = swissToday(-1);
    expect(screen.getByText(`Payé le ${typed}`)).toBeInTheDocument();
    await rescan(view, { ok: true, model: 'rejeu', result: result({ date: '15.03.2026', invoiceNumber: 'MB-2' }) }, () => expect(field('N° de facture').value).toBe('MB-2'));
    expect(screen.getByText(`Payé le ${typed}`)).toBeInTheDocument();
    const sent = await save();
    expect(sent.paymentDate).toBe(typed);
    expect(sent.paymentDateBasis).toBe('typed');
    expect(sent.date).toBe('15.03.2026');
  });
  it('témoin : une date supposée (celle du document) est remplacée par celle du second scan', async () => {
    const view = await open(result());
    await rescan(view, { ok: true, model: 'rejeu', result: result({ date: '15.03.2026', invoiceNumber: 'MB-2' }) }, () => expect(field('N° de facture').value).toBe('MB-2'));
    const sent = await save();
    expect(sent.paymentDate).toBe('15.03.2026');
    expect(sent.paymentDateBasis).toBe('document_date');
  });
});
