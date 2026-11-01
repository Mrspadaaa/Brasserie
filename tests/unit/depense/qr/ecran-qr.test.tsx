// @vitest-environment jsdom
/**
 * Voie qr-app : le sceau QR de z2 (D246) dans l'écran en ligne. La lecture du QR (`lireQrDuFichier`) est SIMULÉE (le vrai décodage se joue dans Chrome) ;
 * Gemini, Drive et l'enregistrement aussi. Pièce fictive : « Malterie Fictive SA », F-1001, 110,40 CHF, 12.10.2026.
 * Règles tenues : le QR est lu à côté de Gemini (jamais attendu) ; « Confirmer » n'est jamais bloqué ; aucun champ ne change sans un geste du brasseur.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { charge, QR_IBAN, QRR } from './aide';

const state = vi.hoisted(() => ({ scanned: vi.fn(), saved: vi.fn(), onSaved: vi.fn(), qr: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/qrLecture', () => ({ lireQrDuFichier: (...a: any[]) => state.qr(...a) }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: async (draft: any) => { state.saved(structuredClone(draft)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { parseSwissQr } from '../../../../src/services/qrFacture';

const S1 = '//S1/10/F-1001/11/261012/32/8.1/40/0:30';
const CREANCIER = ['S', 'Malterie Fictive SA', 'Route de la Malterie', '1', '1000', 'Lausanne', 'CH'];
const qrLu = (o = {}) => ({ statut: 'lu' as const, ms: 500, qr: parseSwissQr(charge({ creancier: CREANCIER, debiteur: ['', '', '', '', '', '', ''], montant: '110.40', s1: S1, ...o }))! });
const lecture = (montant = 110.4, more: Record<string, unknown> = {}) => ({ documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Malterie Fictive SA', date: '12.10.2026', currency: 'CHF', invoiceNumber: 'F-1001',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: montant, category: 'brassage', subcategory: '', description: 'Malts', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
  items: [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 25, unit: 'Kg', price: 2.1, amountTTC: 52.5, stockCategory: '' }, { id: 'line-2', name: 'Pilsner Malz', kind: 'stock', quantity: 30, unit: 'Kg', price: 1.93, amountTTC: 57.9, stockCategory: '' }], ...more });

const send = (view: ReturnType<typeof render>, name = 'facture-qr.png') => {
  const file = new File(['%PDF-1.4\n' + name], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n' + name).buffer });
  fireEvent.change(view.container.querySelector('input[aria-label="Importer un justificatif"]')!, { target: { files: [file] } });
  return file;
};
const open = async (qr: unknown, montant = 110.4) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.qr.mockImplementation(() => qr instanceof Promise ? qr : Promise.resolve(qr));
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'simule', result: lecture(montant) });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: state.onSaved }));
  const file = send(view);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return { view, file };
};
const sceau = () => document.querySelector<HTMLButtonElement>('[data-dp="sceau-qr"]');
const total = () => Number((screen.getByLabelText('Total TTC en CHF') as HTMLInputElement).value.replace(',', '.'));
const confirmer = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
  await waitFor(() => expect(state.saved).toHaveBeenCalled());
  return state.saved.mock.calls.at(-1)![0];
};

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.saved.mockReset(); state.onSaved.mockReset(); state.qr.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('le QR est lu à côté de Gemini, avec le fichier choisi', () => {
  it('la lecture du QR reçoit le fichier choisi', async () => {
    const { file } = await open(qrLu());
    await waitFor(() => expect(sceau()).not.toBeNull());
    expect(state.qr).toHaveBeenCalledTimes(1);
    expect(state.qr.mock.calls[0][0]).toBe(file);
  });
  it('un QR qui ne finit jamais ne retarde ni la lecture de Gemini ni « Confirmer » : le sceau attend, la dépense s’enregistre', async () => {
    await open(new Promise(() => undefined));
    expect(sceau()).toHaveAttribute('data-q', 'wait');
    expect(sceau()).toHaveAccessibleName('QR-facture : lecture en cours');
    const sent = await confirmer();
    expect(sent.amount).toBe(110.4);
  });
  it('le QR arrive après Gemini : le sceau passe de « lecture… » à « QR ✓ » sans rien changer d’autre', async () => {
    let fin!: (r: unknown) => void;
    await open(new Promise(r => { fin = r; }));
    expect(sceau()).toHaveAttribute('data-q', 'wait');
    fin(qrLu());
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    expect(total()).toBe(110.4);
  });
});

describe('confirme', () => {
  it('le sceau dit « QR ✓ » ; son toucher ouvre « Ce que dit le QR » avec l’IBAN et la référence à copier', async () => {
    await open(qrLu());
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    expect(within(sceau()!).getByText('QR ✓')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ce que dit le QR' })).toBeNull();
    fireEvent.click(sceau()!);
    const fiche = await screen.findByRole('region', { name: 'Ce que dit le QR' });
    expect(within(fiche).getByText('110,40 CHF')).toBeInTheDocument();
    expect(within(fiche).getByText('F-1001')).toBeInTheDocument();
    expect(fiche.textContent).toContain('CH44 3199 9123 0008');
    expect(fiche.textContent).toContain('21 00000 00003 13947 14300 09017');
  });
  it('Copier met l’IBAN (sans espace) dans le presse-papiers et dit « copié » ; la référence aussi', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: ecrire } });
    await open(qrLu());
    await waitFor(() => expect(sceau()).not.toBeNull());
    fireEvent.click(sceau()!);
    const fiche = await screen.findByRole('region', { name: 'Ce que dit le QR' });
    fireEvent.click(within(fiche).getByRole('button', { name: 'Copier IBAN' }));
    await waitFor(() => expect(within(fiche).getByRole('button', { name: 'Copier IBAN' })).toHaveTextContent('copié'));
    expect(ecrire).toHaveBeenCalledWith(QR_IBAN);
    fireEvent.click(within(fiche).getByRole('button', { name: 'Copier Référence' }));
    await waitFor(() => expect(ecrire).toHaveBeenCalledWith(QRR));
  });
  it('« Fermer ce que dit le QR » referme la feuille ; le sceau la rouvre', async () => {
    await open(qrLu());
    await waitFor(() => expect(sceau()).not.toBeNull());
    fireEvent.click(sceau()!);
    fireEvent.click(await screen.findByRole('button', { name: 'Fermer ce que dit le QR' }));
    expect(screen.queryByRole('region', { name: 'Ce que dit le QR' })).toBeNull();
    expect(sceau()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('contredit : le désaccord côte à côte, sans rien changer sans lui', () => {
  const ouvrir = async () => { await open(qrLu(), 110.04); await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'diff')); };

  it('le sceau dit le montant du QR ; le champ reste ce que la page a dit ; deux tuiles ; la chip ① « Total » renvoie au duel', async () => {
    await ouvrir();
    expect(within(sceau()!).getByText('110,40')).toBeInTheDocument();
    expect(total()).toBe(110.04);
    expect(screen.getByRole('button', { name: 'lu sur la page 110,04' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'QR-facture 110,40' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '1 Total' })).toBeInTheDocument();
  });
  it('sans geste, rien n’a changé tout seul ; « Confirmer » reste actif, et seule la règle de la base (détail des lignes = total) parle : le QR ne bloque rien', async () => {
    await ouvrir();
    expect(screen.getByRole('button', { name: 'Confirmer et enregistrer' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    const alerte = await screen.findByText('À corriger');
    expect(alerte.parentElement!.textContent).toContain('Le détail des lignes doit correspondre exactement au total TTC.');
    expect(alerte.parentElement!.textContent).not.toMatch(/QR/);
    expect(state.saved).not.toHaveBeenCalled();
    expect(total()).toBe(110.04);
  });
  it('prendre le QR pose 110,40, règle la chip, et la dépense s’enregistre à 110,40 ; reprendre la page remet 110,04', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'QR-facture 110,40' }));
    expect(total()).toBe(110.4);
    expect(screen.getByRole('button', { name: 'QR-facture 110,40' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1 Total réglé' })).toBeInTheDocument();
    expect(within(sceau()!).getByText('QR ✓')).toBeInTheDocument();
    const sent = await confirmer();
    expect(sent.amount).toBe(110.4);
    fireEvent.click(screen.getByRole('button', { name: 'lu sur la page 110,04' }));
    expect(total()).toBe(110.04);
    expect(screen.getByRole('button', { name: '1 Total réglé' })).toBeInTheDocument();
    expect(within(sceau()!).getByText('lu gardé')).toBeInTheDocument();
  });
  it('garder la page ne change rien au champ', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'lu sur la page 110,04' }));
    expect(total()).toBe(110.04);
  });
  it('le témoin « Somme des lignes 110,40 · deux contre un » n’est dit que parce que les lignes font 110,40', async () => {
    await ouvrir();
    expect(screen.getByText(/deux contre un/)).toBeInTheDocument();
  });
  it('la preuve dit l’écart de la somme (« 110,40 ≠ 110,04 ») et le statut n’est pas « vérifiée »', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Détails de la lecture' }));
    const preuve = screen.getByRole('region', { name: 'Preuve de la lecture' });
    expect(preuve.textContent).toContain('110,40 ≠ 110,04');
    expect(preuve.textContent).not.toContain('Lecture vérifiée');
  });
});

describe('partiel, illisible, sans, non vérifié', () => {
  it('partiel : un bulletin sans montant : « partiel », « pas dans le QR » avec la valeur lue à côté', async () => {
    await open(qrLu({ montant: '', s1: '' }));
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'partiel'));
    fireEvent.click(sceau()!);
    const fiche = await screen.findByRole('region', { name: 'Ce que dit le QR' });
    expect(fiche.textContent).toContain('pas dans le QR');
    expect(fiche.textContent).toContain('lu 110,40');
    expect(total()).toBe(110.4);
  });
  it('illisible : le QR est vu, rien n’est décodé ; « Photographier le QR » relit seulement le QR, sans changer la dépense', async () => {
    await open({ statut: 'illisible' });
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'off'));
    expect(within(sceau()!).getByText('illisible')).toBeInTheDocument();
    const avant = state.scanned.mock.calls.length;
    const photo = new File(['p'], 'qr.jpg', { type: 'image/jpeg' });
    state.qr.mockResolvedValueOnce(qrLu());
    fireEvent.change(screen.getByLabelText('Photographier le QR', { selector: 'input' }), { target: { files: [photo] } });
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    expect(state.qr.mock.calls.at(-1)![0]).toBe(photo);
    expect(state.scanned.mock.calls.length).toBe(avant);
    expect(total()).toBe(110.4);
  });
  it('sans QR : un cercle en pointillé, distinct d’un sceau ; rien à ouvrir', async () => {
    await open({ statut: 'sans' });
    await waitFor(() => expect(document.querySelector('[data-dp="sans-qr"]')).not.toBeNull());
    expect(sceau()).toBeNull();
    expect(screen.getByText('sans QR')).toBeInTheDocument();
  });
  it('non vérifié (bibliothèque non chargée, hors ligne) : ni sceau ni « sans QR », et la dépense se confirme', async () => {
    await open({ statut: 'non-verifie', motif: 'hors ligne' });
    await new Promise(r => setTimeout(r, 20));
    expect(sceau()).toBeNull();
    expect(document.querySelector('[data-dp="sans-qr"]')).toBeNull();
    const sent = await confirmer();
    expect(sent.amount).toBe(110.4);
  });
  it('sans sceau, le bandeau de la base est inchangé (pas de grille)', async () => {
    await open({ statut: 'non-verifie', motif: 'x' });
    expect(document.querySelector('[data-dp="bandeau"]')!.className).toContain('space-y-1');
    expect(document.querySelector('[data-dp="bandeau"]')!.className).not.toContain('grid');
  });
});

describe('un autre fichier remet le sceau à zéro', () => {
  it('le résultat du premier fichier n’est jamais montré pour le second', async () => {
    const { view } = await open(qrLu());
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    state.qr.mockImplementation(() => new Promise(() => undefined));
    state.scanned.mockResolvedValueOnce({ ok: true, model: 'simule', result: lecture(110.4) });
    send(view, 'autre.png');
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'wait'));
  });
});
