// @vitest-environment jsdom
/**
 * LO-1 (rejeu en ligne du 08.11, doc3 : deux bulletins QR de prime d'assurance de 150,00 chacun, photographiés ensemble) : l'écran disait « lu sur la page 300,00 »
 * et posait 300,00 en Total TTC, alors que la pièce n'imprime nulle part 300,00 ; l'en-tête du sceau gardait 150,00, sans alerte ni « 2 bulletins ».
 * Cause : la lecture de la page a rendu 300 (une des trois lectures somme les deux bulletins, le vote 2 contre 1 la retient) ; la somme des lignes
 * lui donne raison (300 = 150 + 150), donc aucun contrôle ne bronche. Seul le QR, lu dans l'appareil, sait que la pièce porte DEUX bulletins.
 * Règle : un total de page égal à la somme des bulletins (et à aucun d'eux) est un total CALCULÉ, jamais « lu sur la page » ; il se dit, et reste à trancher.
 * Fixture anonymisée : « Assurance Fictive SA », rien de la pièce réelle (ni nom, ni adresse, ni contrat) ; les montants seuls sont gardés. zxing-wasm, Gemini : simulés.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { charge } from './aide';

const state = vi.hoisted(() => ({ scanned: vi.fn(), saved: vi.fn(), onSaved: vi.fn(), qr: vi.fn() }));
vi.mock('zxing-wasm/reader', () => ({ readBarcodes: vi.fn(), prepareZXingModule: vi.fn() }));
vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: '/assets/zxing_reader-test.wasm' }));
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/assets/pdf.worker.min-test.mjs' }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/qrLecture', async importOriginal => ({ ...await importOriginal<any>(), lireQrDuFichier: (...a: any[]) => state.qr(...a) }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: async (draft: any) => { state.saved(structuredClone(draft)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { classer, type CodeLu, type ResultatQr } from '../../../../src/services/qrLecture';
import { confronterQr, parseSwissQr, type LectureQr } from '../../../../src/services/qrFacture';
import { resumeQr, sommeDesBulletins, vueQr } from '../../../../src/ui/depense/qrVue';

const CREANCIER = ['S', 'Assurance Fictive SA', 'Rue Fictive', '1', '1000', 'Lausanne', 'CH'];
/** Un bulletin d'exemple (IBAN, référence QRR : ceux, publics, des Guidelines SIX) ; `message` le distingue d'un autre bulletin du même créancier. */
const bulletin = (montant: string, message = 'Prime'): CodeLu => ({ decode: true, texte: charge({ creancier: CREANCIER, debiteur: ['', '', '', '', '', '', ''], montant, message }) });
const deux = (): CodeLu[] => [bulletin('150.00', 'Prime 1'), bulletin('150.00', 'Prime 2')];
const lectureDe = (montant: number | null): LectureQr => ({ vendor: 'Assurance Fictive SA', date: '', currency: 'CHF', invoiceNumber: '', amountTTC: montant });
const resultatDeux = (): ResultatQr => ({ statut: 'lu', ms: 500, ...(() => { const r = classer(deux()); return { qr: r.qr!, bulletins: r.bulletins, montantsBulletins: r.montantsBulletins }; })() });
const vue = (r: ResultatQr, l: LectureQr) => vueQr(r, r.statut === 'lu' ? confronterQr(r.qr, l) : null, l);

describe('LO-1 : les bulletins sont comptés avec leur montant', () => {
  it('deux bulletins distincts : nombre et montants de chacun, dans l’ordre de lecture', () => {
    const r = classer(deux());
    expect(r.bulletins).toBe(2);
    expect(r.montantsBulletins).toEqual([150, 150]);
  });
  it('le même bulletin décodé deux fois (même texte) n’en fait qu’un', () => {
    const b = bulletin('150.00');
    expect(classer([b, { ...b }]).bulletins).toBeUndefined();
  });
  it('un bulletin sans montant ou non conforme garde sa place, montant inconnu (jamais 0)', () => {
    expect(classer([bulletin('150.00', 'Prime 1'), bulletin('', 'Prime 2')]).montantsBulletins).toEqual([150, null]);
    expect(classer([bulletin('150.00', 'Prime 1'), { decode: true, texte: charge({ iban: 'CH0000000000000000000', montant: '150.00' }) }]).montantsBulletins).toEqual([150, null]);
  });
  it('la lecture d’une photo à deux bulletins rend les montants', async () => {
    const photo = new File([new Uint8Array([1, 2, 3])], 'bulletins.jpg', { type: 'image/jpeg' });
    const { lireQrDuFichier } = await vi.importActual<typeof import('../../../../src/services/qrLecture')>('../../../../src/services/qrLecture');
    const r = await lireQrDuFichier(photo, { lireCodes: async () => deux(), pagesPdf: async function* () { /* aucune page */ }, agrandir: async () => null });
    expect(r).toMatchObject({ statut: 'lu', bulletins: 2, montantsBulletins: [150, 150] });
  });
});

describe('LO-1 : un total égal à la somme des bulletins est un total calculé', () => {
  it('300 = 150 + 150, et aucun bulletin ne vaut 300 : somme reconnue, détail écrit', () => {
    expect(sommeDesBulletins(resultatDeux(), lectureDe(300))).toMatchObject({ n: 2, somme: 300, detail: '150,00 + 150,00 = 300,00' });
  });
  it('un total égal à un bulletin, une lecture sans total, un autre total, un seul bulletin : rien à dire', () => {
    expect(sommeDesBulletins(resultatDeux(), lectureDe(150))).toBeNull();
    expect(sommeDesBulletins(resultatDeux(), lectureDe(null))).toBeNull();
    expect(sommeDesBulletins(resultatDeux(), lectureDe(450))).toBeNull();
    const seul = classer([bulletin('150.00')]);
    expect(sommeDesBulletins({ statut: 'lu', ms: 1, qr: seul.qr! }, lectureDe(150))).toBeNull();
  });
  it('un bulletin de montant inconnu : la somme ne se calcule pas, jamais de 0 supposé', () => {
    const r = classer([bulletin('150.00', 'Prime 1'), bulletin('', 'Prime 2')]);
    expect(sommeDesBulletins({ statut: 'lu', ms: 1, qr: r.qr!, bulletins: r.bulletins, montantsBulletins: r.montantsBulletins }, lectureDe(150))).toBeNull();
  });
  it('le sceau ne dit plus « lu sur la page » ni 150,00 : « 2 QR », le duel nomme la somme et le premier bulletin', () => {
    const v = vue(resultatDeux(), lectureDe(300))!;
    expect(v).toMatchObject({ etat: 'diff', verdict: '2 QR', contredit: true });
    expect(v.aria).toMatch(/2 bulletins/);
    expect(v.duel).toMatchObject({ luNombre: 300, qrNombre: 150, bulletins: { n: 2, somme: true, detail: '150,00 + 150,00 = 300,00' } });
    const montant = v.lignes.find(l => l.cle === 'montant')!;
    expect(montant.note).toBe('somme 300,00');
    expect(montant.note).not.toMatch(/^lu /);
    expect(v.lignes.find(l => l.cle === 'qr')).toMatchObject({ libelle: 'Bulletins', statut: 'ko' });
    expect(v.lignes.find(l => l.cle === 'qr')!.valeur).toMatch(/2 bulletins QR.*150,00 \+ 150,00/);
  });
  it('un total égal au premier bulletin n’est pas « QR ✓ » : la pièce porte deux bulletins, le sceau le dit', () => {
    const v = vue(resultatDeux(), lectureDe(150))!;
    expect(v.verdict).not.toBe('QR ✓');
    expect(v).toMatchObject({ etat: 'partiel', verdict: '2 QR' });
    expect(v.lignes.find(l => l.cle === 'qr')!.valeur).toMatch(/2 bulletins QR/);
  });
  it('un seul bulletin : le sceau est inchangé', () => {
    const r = classer([bulletin('150.00')]);
    const v = vue({ statut: 'lu', ms: 1, qr: r.qr! }, lectureDe(150))!;
    expect(v).toMatchObject({ etat: 'ok', verdict: 'QR ✓' });
    expect(v.lignes.some(l => l.cle === 'qr')).toBe(false);
  });
  it('le résumé « QR : … » dit les montants des bulletins', () => {
    expect(resumeQr(resultatDeux())).toContain('2 bulletins QR sur la pièce (150,00 · 150,00)');
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------
// L'écran : ce que le brasseur voit et ce qui s'enregistre
// ------------------------------------------------------------------------------------------------------------------------------------------------------
const ligne = (n: number, nom: string) => ({ id: `line-${n}`, name: nom, kind: 'service', quantity: null, unit: '', price: null, amountTTC: 150, stockCategory: '' });
const lecture = (montant: number | null) => ({ documentType: 'invoice', paymentEvidence: 'unknown', vendor: 'Assurance Fictive SA', date: '01.03.2027', currency: 'CHF', invoiceNumber: '',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: montant, category: 'autre', subcategory: '', description: 'Primes', issues: [], fieldWarnings: [], controls: { lines: { checked: 0, failed: 0, skipped: 2, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'ok', base: null }, totals: { statut: 'ok' } }, review: { status: 'checked', findings: [], readers: 3 },
  items: [ligne(1, 'Prime 01.03.2027'), ligne(2, 'Prime 01.04.2027')] });
const ouvre = async (montant: number | null) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.qr.mockResolvedValue(resultatDeux());
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'simule', result: lecture(montant) });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: state.onSaved }));
  const file = new File(['%PDF-1.4\nbulletins'], 'bulletins.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\nbulletins').buffer });
  fireEvent.change(view.container.querySelector('input[aria-label="Importer un justificatif"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await waitFor(() => expect(document.querySelector('[data-dp="sceau-qr"]')).toHaveAttribute('data-q', 'diff'));
};
const total = () => Number((screen.getByLabelText('Total TTC en CHF') as HTMLInputElement).value.replace(',', '.'));

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.saved.mockReset(); state.onSaved.mockReset(); state.qr.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('LO-1 : l’écran d’une pièce à deux bulletins dont le total de la page est leur somme', () => {
  it('le sceau dit « 2 QR », le duel nomme « somme des 2 bulletins » (pas « lu sur la page ») et le premier bulletin', async () => {
    await ouvre(300);
    expect(document.querySelector('[data-dp="sceau-qr"]')!.textContent).toMatch(/2 QR/);
    const duel = document.querySelector('[data-dp="duel"]')!;
    expect(duel.textContent).not.toMatch(/lu sur la page/);
    expect(duel.textContent).toMatch(/somme des 2 bulletins/);
    expect(duel.textContent).toMatch(/1er bulletin QR/);
  });
  it('le total posé (300,00) est dit calculé, pas imprimé : mention sous le total, rangée « Total non imprimé », aucune rangée « Somme = imprimé »', async () => {
    await ouvre(300);
    expect(total()).toBe(300);
    expect(document.body.textContent).toMatch(/Total non imprimé/);
    expect(document.body.textContent).not.toMatch(/Somme = imprimé/);
    expect(document.getElementById('scan-hint-amountTTC')?.textContent).toMatch(/Somme des 2 bulletins QR.*150,00 \+ 150,00.*pas imprimé/);
  });
  it('à l’enregistrement, le total est marqué « somme des lignes » (line_sum), jamais « imprimé »', async () => {
    await ouvre(300);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(state.saved).toHaveBeenCalled());
    expect(state.saved.mock.calls.at(-1)![0]).toMatchObject({ amount: 300, sourceTotalBasis: 'line_sum' });
  });
  it('rien ne change sans le geste du brasseur : toucher le premier bulletin pose 150,00, toucher la somme remet 300,00', async () => {
    await ouvre(300);
    fireEvent.click(document.querySelector('[data-dp-duel="qr"]')!);
    expect(total()).toBe(150);
    fireEvent.click(document.querySelector('[data-dp-duel="lu"]')!);
    expect(total()).toBe(300);
  });
});
