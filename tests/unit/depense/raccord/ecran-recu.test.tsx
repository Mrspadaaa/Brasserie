// @vitest-environment jsdom
/**
 * Voie r1-raccord, R4 (DR1 + DR4 à l'écran) : le reçu Drive est gardé, dit par les textes déjà présents, passé à `onSaved` ; un envoi de plus de
 * 15 s est un état, pas une erreur. Jugé en jsdom seulement (sous ?dev-local aucun reçu n'existe) ; Drive et Gemini simulés.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], scanned: vi.fn(), save: vi.fn(), confirmed: vi.fn(), attach: vi.fn(), onSaved: vi.fn(), onClose: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: (error: any) => error?.status === 'rejected' }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: (...a: any[]) => state.save(...a), confirmPurchase: (...a: any[]) => state.confirmed(...a), attachProofToPurchase: (...a: any[]) => state.attach(...a) }));
import { ExpenseSheet, receiptSentence } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

const RECEIPT = { driveFileId: 'drive-1', fileName: '2026-04-27 Brau- und Rauchshop GmbH 372765.jpg', bytes: 735721, sha256: 'a'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/abc/view' };
const SENTENCE = 'Justificatif rangé dans « L’Affinée / Justificatifs / 2026 » sous « 2026-04-27 Brau- und Rauchshop GmbH 372765.jpg », empreinte vérifiée.';
const inProgress = (text: string) => Object.assign(new Error(text), { code: 'drive/in-progress' });
const scan = () => ({ ok: true, model: 'rejeu', result: { documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Fournisseur A', date: '12.03.2026', currency: 'CHF', invoiceNumber: 'MB-1',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 10, category: 'brassage', subcategory: '', description: 'Achat', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
  items: [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 1, unit: 'pce', amountTTC: 10, stockCategory: '' }] } });
const open = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockResolvedValueOnce(scan());
  const view = render(createElement(ExpenseSheet, { onClose: state.onClose, onSaved: state.onSaved }));
  const file = new File(['%PDF-1.4\n'], 'f.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const CONFIRM = 'Confirmer et enregistrer';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.transactions = [];
  for (const mock of [state.scanned, state.save, state.confirmed, state.attach, state.onSaved, state.onClose]) mock.mockReset();
  state.confirmed.mockResolvedValue(undefined);
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('receiptSentence : chaque morceau vient du reçu, rien d’autre', () => {
  const base = { driveFileId: 'd', bytes: 1, sha256: 'x' };
  it.each([
    ['dossier + nom + vérifié + lien', RECEIPT, SENTENCE, 'https://drive.google.com/file/d/abc/view'],
    ['vérifié seul (le cas réel de financeDocuments)', { ...base, verified: true }, 'Justificatif rangé sur ton Drive, empreinte vérifiée.', undefined],
    ['dossier seul', { ...base, verified: false, folder: 'D' }, 'Justificatif rangé dans « D ».', undefined],
    ['nom seul', { ...base, verified: false, fileName: 'N.pdf' }, 'Justificatif rangé sur ton Drive sous « N.pdf ».', undefined],
    ['rien', { ...base, verified: false }, 'Justificatif rangé sur ton Drive.', undefined],
    ['verified absent', { ...base }, 'Justificatif rangé sur ton Drive.', undefined]
  ])('%s', (_name, receipt, text, link) => {
    expect(receiptSentence(receipt as any)).toEqual(link ? { text, link } : { text });
  });
  it.each(['http://drive.google.com/file/d/abc', 'https://drive.google.com.exemple.test/x', 'https://exemple.test/x', 'javascript:alert(1)', 'pas une adresse'])('le lien « %s » n’est pas gardé', href => {
    expect(receiptSentence({ ...RECEIPT, webViewLink: href } as any).link).toBeUndefined();
  });
});

describe('R4 : le reçu arrive à l’écran', () => {
  it('au premier clic : onSaved reçoit le reçu de Drive ; la feuille reste ouverte sur le reçu et ne se ferme qu’à « Terminé » (e-port, T5)', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    await open();
    click(CONFIRM);
    await waitFor(() => expect(state.onSaved).toHaveBeenCalled());
    expect(state.onSaved).toHaveBeenCalledWith(expect.objectContaining({ folder: RECEIPT.folder, fileName: RECEIPT.fileName, webViewLink: RECEIPT.webViewLink }));
    expect(state.onClose).not.toHaveBeenCalled();
    expect(await screen.findByText(RECEIPT.fileName)).toBeInTheDocument();
    click('Terminé');
    expect(state.onClose).toHaveBeenCalledTimes(1);
  });
  it('sans reçu Drive à montrer, la feuille se ferme comme avant (e-port, T5)', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test' });
    await open();
    click(CONFIRM);
    await waitFor(() => expect(state.onSaved).toHaveBeenCalled());
    expect(state.onClose).toHaveBeenCalled();
  });
  it('Drive confirmé puis confirmation en attente : la ligne du pied dit le reçu et son lien ; la reprise ne renvoie rien et rend le même reçu', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    state.confirmed.mockRejectedValueOnce(new Error('Synchronisation lente'));
    await open();
    click(CONFIRM);
    await screen.findByText(SENTENCE);
    expect(screen.getByRole('link', { name: /Ouvrir dans Drive/ })).toHaveAttribute('href', RECEIPT.webViewLink);
    expect(screen.queryByText(/sera rangé dans ton Drive privé/)).toBeNull();
    expect(state.onSaved).not.toHaveBeenCalled();
    click('Vérifier la synchronisation');
    await waitFor(() => expect(state.onSaved).toHaveBeenCalled());
    expect(state.save).toHaveBeenCalledTimes(1);
    expect(state.confirmed).toHaveBeenCalledTimes(2);
    expect(state.onSaved).toHaveBeenCalledWith(expect.objectContaining({ folder: RECEIPT.folder }));
  });
  it('rejet confirmé de la dépense : le reçu est remis à zéro, le pied redit « sera rangé », le clic suivant rappelle l’enregistrement complet', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    state.confirmed.mockRejectedValueOnce(Object.assign(new Error('Écriture refusée par le serveur'), { status: 'rejected' }));
    await open();
    click(CONFIRM);
    expect(await screen.findByRole('alert')).toHaveTextContent('Écriture refusée');
    expect(screen.queryByText(/Justificatif rangé/)).toBeNull();
    expect(screen.getByText(/sera rangé dans ton Drive privé/)).toBeInTheDocument();
    expect(state.save).toHaveBeenCalledTimes(1);
    click(CONFIRM);
    await waitFor(() => expect(state.onSaved).toHaveBeenCalled());
    expect(state.save).toHaveBeenCalledTimes(2);
    expect(state.onSaved).toHaveBeenCalledWith(expect.objectContaining({ folder: RECEIPT.folder }));
  });
  it('Drive qui ne rend ni dossier ni nom : rien d’inventé', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: { driveFileId: 'd', bytes: 1, sha256: 'x', verified: true } });
    state.confirmed.mockRejectedValueOnce(new Error('Synchronisation lente'));
    await open();
    click(CONFIRM);
    await screen.findByText('Justificatif rangé sur ton Drive, empreinte vérifiée.');
    expect(screen.queryByRole('link', { name: /Drive/ })).toBeNull();
  });
  it('rattachement à une dépense existante : la ligne « Justificatif rattaché… » dit le reçu', async () => {
    state.transactions = [{ id: 'TX-old', date: '12.03.2026', description: 'Achat', amountTTC: 10, finance: { version: 1, kind: 'expense', amountCents: 1000, vendor: 'Fournisseur A', invoiceNumber: 'MB-1', lines: [] } }];
    state.attach.mockResolvedValue(RECEIPT);
    await open();
    click('Même achat');
    click('Rattacher le justificatif');
    const line = await screen.findByText(/Justificatif rattaché à/);
    expect(line.closest('[role="status"]')).toHaveTextContent(SENTENCE);
    expect(screen.getByRole('link', { name: /Ouvrir dans Drive/ })).toHaveAttribute('href', RECEIPT.webViewLink);
    expect(state.save).not.toHaveBeenCalled();
  });
});

describe('DR4 : un envoi long est un état, pas une erreur', () => {
  const texte = 'Envoi du justificatif en cours sur ton Drive : il peut encore aboutir.';
  it('plus de 15 s à l’enregistrement : role="status", aucune alerte ; le second clic réussit', async () => {
    state.save.mockRejectedValueOnce(inProgress(texte)).mockResolvedValueOnce({ transactionId: 'TX-test', proof: RECEIPT });
    await open();
    click(CONFIRM);
    const message = await screen.findByText(/Envoi du justificatif en cours/);
    expect(message.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(state.onSaved).not.toHaveBeenCalled();
    click(CONFIRM);
    await waitFor(() => expect(state.onSaved).toHaveBeenCalled());
    expect(screen.queryByText(/Envoi du justificatif en cours/)).toBeNull();
  });
  it('plus de 15 s au rattachement : même état, texte vrai pour ce bouton ; le second clic réussit', async () => {
    state.transactions = [{ id: 'TX-old', date: '12.03.2026', description: 'Achat', amountTTC: 10, finance: { version: 1, kind: 'expense', amountCents: 1000, vendor: 'Fournisseur A', invoiceNumber: 'MB-1', lines: [] } }];
    state.attach.mockRejectedValueOnce(inProgress('Envoi du justificatif en cours sur ton Drive : il peut encore aboutir. Rien n’a encore été rattaché. Touche de nouveau « Rattacher le justificatif » dans un instant.')).mockResolvedValueOnce(RECEIPT);
    await open();
    click('Même achat');
    click('Rattacher le justificatif');
    const message = await screen.findByText(/Envoi du justificatif en cours/);
    expect(message.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(message.textContent).not.toContain('Confirmer et enregistrer');
    click('Rattacher le justificatif');
    await screen.findByText(/Justificatif rattaché à/);
    expect(screen.queryByText(/Envoi du justificatif en cours/)).toBeNull();
  });
  it('hors ligne : une erreur (role="alert"), ni état « en cours » ni reçu', async () => {
    state.save.mockRejectedValueOnce(Object.assign(new Error('Hors connexion : le justificatif n’a pas pu être envoyé sur ton Drive, donc rien n’est enregistré.'), { code: 'unavailable' }));
    await open();
    click(CONFIRM);
    expect(await screen.findByRole('alert')).toHaveTextContent('Hors connexion');
    expect(screen.queryByText(/Envoi du justificatif en cours/)).toBeNull();
    expect(screen.queryByText(/Justificatif rangé/)).toBeNull();
  });
  it('deux clics rapides pendant l’envoi : un seul appel', async () => {
    let finish!: (value: unknown) => void;
    state.save.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    await open();
    const bouton = screen.getByRole('button', { name: CONFIRM });
    fireEvent.click(bouton); fireEvent.click(bouton);
    expect(state.save).toHaveBeenCalledTimes(1);
    finish({ transactionId: 'TX-test', proof: RECEIPT });
    await waitFor(() => expect(state.onSaved).toHaveBeenCalledTimes(1));
    expect(state.save).toHaveBeenCalledTimes(1);
  });
});
