// @vitest-environment jsdom
/**
 * Voie r2-details, détail 7 : « Changer » le fichier après un premier envoi. Un fichier ne se change plus dès qu'un justificatif est parti sous ce
 * `submissionId` (la dépense attend sa confirmation, ou l'envoi a été tenté) : aucun fichier n'est annoncé « rangé » sans avoir été envoyé, aucun
 * achat n'est écrit deux fois. Le nouveau fichier n'est ni lu, ni scanné, ni posé dans le brouillon. Drive et Gemini simulés ; jsdom seulement.
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
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

const RECEIPT = { driveFileId: 'drive-1', fileName: '2026-03-12 Fournisseur A MB-1.pdf', bytes: 9, sha256: 'a'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026' };
const scan = () => ({ ok: true, model: 'rejeu', result: { documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Fournisseur A', date: '12.03.2026', currency: 'CHF', invoiceNumber: 'MB-1',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 10, category: 'brassage', subcategory: '', description: 'Achat', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
  items: [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 1, unit: 'pce', amountTTC: 10, stockCategory: '' }] } });
const pdf = (content: string, name: string) => {
  const file = new File([content], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode(content).buffer });
  return file;
};
const hashOf = async (content: string) => Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(content))), b => b.toString(16).padStart(2, '0')).join('');
const FIRST = '%PDF-1.4\npremier\n', SECOND = '%PDF-1.4\nsecond, autre contenu\n';
const sendFile = (view: { container: HTMLElement }, selector: string, file: File) => fireEvent.change(view.container.querySelector(selector)!, { target: { files: [file] } });
const open = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockResolvedValueOnce(scan());
  const view = render(createElement(ExpenseSheet, { onClose: state.onClose, onSaved: state.onSaved }));
  sendFile(view, 'input[type="file"]', pdf(FIRST, 'premier.pdf'));
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const CONFIRM = 'Confirmer et enregistrer', VERIFY = 'Vérifier la synchronisation';
const WAITING = /L’enregistrement attend sa confirmation : le fichier ne peut plus être changé\. Touche « Vérifier la synchronisation »\./;
const SENT = /Ce fichier est déjà parti pour cette saisie\. Pour en joindre un autre, ferme et rouvre : rien n’a été enregistré\./;

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.transactions = [];
  for (const mock of [state.scanned, state.save, state.confirmed, state.attach, state.onSaved, state.onClose]) mock.mockReset();
  state.confirmed.mockResolvedValue(undefined);
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('D7 : la dépense attend sa confirmation, le fichier ne change plus', () => {
  it('un second fichier (autre contenu) est refusé par le champ caché ; deux échecs de confirmation de suite ; le reçu et l’empreinte restent ceux du premier', async () => {
    expect(await hashOf(FIRST)).not.toBe(await hashOf(SECOND));
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    state.confirmed.mockRejectedValueOnce(new Error('Confirmation ciblée 1')).mockRejectedValueOnce(new Error('Confirmation ciblée 2')).mockResolvedValue(undefined);
    state.scanned.mockResolvedValueOnce(scan());
    const view = await open();
    click(CONFIRM);
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation ciblée 1');
    expect(screen.getByText(/Justificatif rangé/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Changer' })).toBeDisabled();

    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(WAITING);
    expect(screen.getByRole('alert').textContent).not.toMatch(/rouvre|déjà parti/);
    expect(state.scanned).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Justificatif rangé/)).toBeInTheDocument();
    expect(screen.queryByText(/sera rangé/)).toBeNull();

    click(VERIFY);
    expect(await screen.findByText('Confirmation ciblée 2')).toBeInTheDocument();
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(WAITING);
    click(VERIFY);
    await waitFor(() => expect(state.onSaved).toHaveBeenCalledTimes(1));
    expect(state.onSaved).toHaveBeenCalledWith(expect.objectContaining({ folder: RECEIPT.folder }));
    expect(state.save).toHaveBeenCalledTimes(1);
    const hashes = state.confirmed.mock.calls.map(call => call[0].documentHash);
    expect(hashes).toHaveLength(3);
    expect(new Set(hashes)).toEqual(new Set([await hashOf(FIRST)]));
    expect(state.confirmed.mock.calls.map(call => call[0].proofFileName)).toEqual(['premier.pdf', 'premier.pdf', 'premier.pdf']);
  });
  it('même refus par l’entrée « photographier » (input capture)', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    state.confirmed.mockRejectedValueOnce(new Error('Confirmation ciblée'));
    state.scanned.mockResolvedValueOnce(scan());
    const view = await open();
    click(CONFIRM);
    await screen.findByRole('alert');
    sendFile(view, 'input[capture]', pdf(SECOND, 'photo.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(WAITING);
    expect(state.scanned).toHaveBeenCalledTimes(1);
    expect(state.save).toHaveBeenCalledTimes(1);
  });
  it('la zone de dépôt et « Joindre des documents » ne sont pas rendus pendant la confirmation en attente', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    state.confirmed.mockRejectedValueOnce(new Error('Confirmation ciblée'));
    await open();
    click(CONFIRM);
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Joindre des documents' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Justificatif de la dépense' })).toBeNull();
  });
});

describe('D7 : un envoi tenté, rien d’écrit', () => {
  it('rejet confirmé de la dépense : le fichier ne change pas non plus (il est déjà dans Drive sous cette saisie) ; le texte ne parle pas de confirmation', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    state.confirmed.mockRejectedValueOnce(Object.assign(new Error('Écriture refusée par le serveur'), { status: 'rejected' }));
    state.scanned.mockResolvedValueOnce(scan());
    const view = await open();
    click(CONFIRM);
    await screen.findByRole('alert');
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(SENT);
    expect(screen.getByRole('alert').textContent).not.toMatch(/attend sa confirmation|Vérifier la synchronisation/);
    expect(state.scanned).toHaveBeenCalledTimes(1);
  });
  it('envoi de plus de 15 s (drive/in-progress) : même refus, même texte', async () => {
    state.save.mockRejectedValueOnce(Object.assign(new Error('Envoi du justificatif en cours'), { code: 'drive/in-progress' }));
    state.scanned.mockResolvedValueOnce(scan());
    const view = await open();
    click(CONFIRM);
    expect(await screen.findByRole('status')).toHaveTextContent('Envoi du justificatif en cours');
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(SENT);
    expect(state.scanned).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['drive/auth-required', 'Connecte ton compte Drive. Ton brouillon est conservé.'],
    ['unavailable', 'Hors connexion : le justificatif n’a pas pu être envoyé'],
    [undefined, 'Ce justificatif est déjà enregistré. Ouvre l’achat existant.'],
  ])('rien n’est parti (%s : avant l’envoi ou prévol refusé) : le fichier peut encore être changé, aucun texte de refus', async (code, message) => {
    state.save.mockRejectedValueOnce(Object.assign(new Error(message), code ? { code } : {}));
    state.scanned.mockResolvedValueOnce(scan());
    const view = await open();
    click(CONFIRM);
    await screen.findByRole('alert');
    state.scanned.mockResolvedValueOnce(scan());
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    await waitFor(() => expect(state.scanned).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/déjà parti|attend sa confirmation/)).toBeNull();
  });
  it('un envoi de plus de 15 s au RATTACHEMENT : le fichier ne change plus non plus', async () => {
    state.transactions = [{ id: 'TX-old', date: '12.03.2026', description: 'Achat', amountTTC: 10, finance: { version: 1, kind: 'expense', amountCents: 1000, vendor: 'Fournisseur A', invoiceNumber: 'MB-1', lines: [] } }];
    state.attach.mockRejectedValueOnce(Object.assign(new Error('Envoi du justificatif en cours sur ton Drive'), { code: 'drive/in-progress' }));
    const view = await open();
    click('Même achat');
    click('Rattacher le justificatif');
    await screen.findByText(/Envoi du justificatif en cours/);
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(SENT);
    expect(state.scanned).toHaveBeenCalledTimes(1);
  });
  it('justificatif rattaché avec succès : le fichier ne change plus, le texte dit qu’il est rattaché', async () => {
    state.transactions = [{ id: 'TX-old', date: '12.03.2026', description: 'Achat', amountTTC: 10, finance: { version: 1, kind: 'expense', amountCents: 1000, vendor: 'Fournisseur A', invoiceNumber: 'MB-1', lines: [] } }];
    state.attach.mockResolvedValueOnce(RECEIPT);
    const view = await open();
    click('Même achat');
    click('Rattacher le justificatif');
    await screen.findByText(/Justificatif rattaché à/);
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Le justificatif est déjà rattaché à cette dépense : le fichier ne peut plus être changé.');
    expect(screen.getByRole('alert').textContent).not.toMatch(/rouvre|rien n’a été enregistré/);
    expect(state.scanned).toHaveBeenCalledTimes(1);
  });
});

describe('D7 : le texte est vrai dans chaque cas', () => {
  it('sans justificatif joint, la dépense en attente : le texte « attend sa confirmation », ni « rouvre » ni « déjà parti »', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test' });
    state.confirmed.mockRejectedValueOnce(new Error('Confirmation ciblée'));
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const view = render(createElement(ExpenseSheet, { onClose: state.onClose, onSaved: state.onSaved }));
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'), { target: { value: '40' } }); fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Pour quoi ?'), { target: { value: 'Malt sans papier' } });
    click('Enregistrer la dépense');
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation ciblée');
    state.scanned.mockResolvedValueOnce(scan());
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'tard.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(WAITING);
    expect(screen.getByRole('alert').textContent).not.toMatch(/rouvre|déjà parti/);
    expect(state.scanned).not.toHaveBeenCalled();
  });
  it('hors ligne à la confirmation (confirmPurchase rejeté, code unavailable) : texte d’attente, ni « rouvre » ni « déjà parti »', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
    state.confirmed.mockRejectedValueOnce(Object.assign(new Error('Hors connexion : la dépense attend le serveur'), { code: 'unavailable' }));
    const view = await open();
    click(CONFIRM);
    expect(await screen.findByRole('alert')).toHaveTextContent('Hors connexion');
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(WAITING);
    expect(screen.getByRole('alert').textContent).not.toMatch(/rouvre|déjà parti/);
    click(VERIFY);
    await waitFor(() => expect(state.onSaved).toHaveBeenCalledTimes(1));
    expect(state.save).toHaveBeenCalledTimes(1);
  });
  it('sans justificatif joint et sans enregistrement tenté : un fichier s’ajoute, sans aucun refus', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.scanned.mockResolvedValueOnce(scan());
    const view = render(createElement(ExpenseSheet, { onClose: state.onClose, onSaved: state.onSaved }));
    sendFile(view, 'input[type="file"]', pdf(FIRST, 'premier.pdf'));
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(state.scanned).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/déjà parti|attend sa confirmation/)).toBeNull();
  });
  it('témoin : avant tout enregistrement, « Changer » fonctionne (second fichier lu et scanné)', async () => {
    state.scanned.mockResolvedValueOnce(scan());
    const view = await open();
    expect(screen.getByRole('button', { name: 'Changer' })).toBeEnabled();
    sendFile(view, 'input[type="file"]', pdf(SECOND, 'second.pdf'));
    await waitFor(() => expect(state.scanned).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/déjà parti|attend sa confirmation/)).toBeNull();
    expect(state.save).not.toHaveBeenCalled();
  });
});
