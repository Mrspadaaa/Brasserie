/**
 * Voie n2-pages : le cadre commun des tests d'écran (feuille « Nouvelle dépense » complète). Gemini, Drive, le stockage et la lecture du QR sont simulés ;
 * l'assemblage du PDF est simulé (jsdom n'a pas de canvas) : tout le reste de `pagesJustificatif` est le vrai code.
 * Les fabriques sont importées dans chaque fichier de test par `vi.mock(chemin, async importOriginal => (await import('./cadre')).xxx(...))`.
 */
import { vi } from 'vitest';
import { createHash, webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

export const etat = {
  transactions: [] as any[], scanned: vi.fn(), pages: vi.fn(), save: vi.fn(), confirmed: vi.fn(), attach: vi.fn(), assembler: vi.fn(), qr: vi.fn(), encodeur: vi.fn(),
  onSaved: vi.fn(), onClose: vi.fn(), coarse: false
};
export const storageMock = () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => etat.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } });
export const financeMock = () => ({ FinanceService: { getPlans: () => [], getPayments: () => [] } });
export const firestoreMock = () => ({ isConfirmedWriteRejection: (error: any) => error?.status === 'rejected' });
export const scannerMock = () => ({ GeminiScannerService: {
  scanDocument: (...a: any[]) => etat.scanned(...a), scanPages: (...a: any[]) => etat.pages(...a),
  fileToDataUrl: async (f: File) => `data:${f.type || 'application/pdf'};base64,JVBERi0xLjQK`, normalizeMimeType: (f: File) => f.type } });
export const purchaseMock = (original: any) => ({ ...original,
  savePurchaseWithProofReceipt: (...a: any[]) => etat.save(...a), confirmPurchase: (...a: any[]) => etat.confirmed(...a), attachProofToPurchase: (...a: any[]) => etat.attach(...a) });
/** `allegerPhoto` garde sa logique ; son encodeur est simulé (jsdom n'a pas de canvas : par défaut il refuse, d'où le refus d'aujourd'hui). */
export const pagesMock = (original: any) => ({ ...original, assemblerPdf: (...a: any[]) => etat.assembler(...a), allegerPhoto: (f: File, encoder?: unknown) => original.allegerPhoto(f, encoder ?? etat.encodeur) });
export const qrMock = () => ({ lireQrDuFichier: (...a: any[]) => etat.qr(...a) });
export const viewportMock = (original: any) => ({ ...original, useCoarsePointer: () => etat.coarse });

export const RECEIPT = { driveFileId: 'drive-1', fileName: '2026-10-14 Malzhaus Nord F-1.pdf', bytes: 9, sha256: 'a'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026' };
export const resultatLu = (extra: Record<string, unknown> = {}, review: Record<string, unknown> | null = { status: 'checked', findings: [], readers: 2 }) => ({ documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Malzhaus Nord', date: '14.10.2026', currency: 'CHF', invoiceNumber: 'F-1',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 10, category: 'brassage', subcategory: '', description: 'Achat', issues: [], fieldWarnings: [], ...(review ? { review } : {}),
  items: [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 1, unit: 'pce', amountTTC: 10, stockCategory: '' }], ...extra });
export const lectureOk = (pagesLues?: number, extra: Record<string, unknown> = {}, review?: Record<string, unknown> | null) =>
  ({ ok: true, model: 'rejeu', ...(pagesLues ? { pagesLues } : {}), result: resultatLu(extra, review === undefined ? { status: 'checked', findings: [], readers: 2 } : review) });

/** Une image fictive : contenu propre (donc empreinte propre), `arrayBuffer` posé (jsdom n'en a pas), taille réglable. */
export const image = (nom: string, contenu = `contenu de ${nom}`, taille?: number, type = 'image/jpeg') => {
  const file = new File([contenu], nom, { type });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode(contenu).buffer });
  if (taille !== undefined) Object.defineProperty(file, 'size', { value: taille });
  return file;
};
export const MO = 1024 * 1024;

export function preparer() {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  (URL as any).createObjectURL = vi.fn(() => 'blob:fictif'); (URL as any).revokeObjectURL = vi.fn();
  etat.transactions = []; etat.coarse = false;
  for (const m of [etat.scanned, etat.pages, etat.save, etat.confirmed, etat.attach, etat.assembler, etat.qr, etat.encodeur, etat.onSaved, etat.onClose]) m.mockReset();
  etat.encodeur.mockRejectedValue(new Error('pas de canvas dans jsdom'));
  etat.qr.mockResolvedValue({ statut: 'sans' });
  etat.save.mockResolvedValue({ transactionId: 'TX-test', proof: RECEIPT });
  etat.confirmed.mockResolvedValue(undefined);
  etat.assembler.mockImplementation(async (pages: File[]) => {
    const file = new File(['%PDF-1.4 fictif'], `Justificatif-${pages.length}-pages.pdf`, { type: 'application/pdf' });
    return { file, octets: 2_100_000, reduite: false };
  });
}
export async function monter(props: Record<string, unknown> = { startWithScan: true }) {
  const { ExpenseSheet } = await import('../../../../src/ui/finance/ExpenseSheet');
  const { FirebaseAuthService } = await import('../../../../src/services/firebaseAuth');
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('jeton-factice');
  vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true);
  return render(createElement(ExpenseSheet, { onClose: etat.onClose, onSaved: etat.onSaved, ...props } as any));
}
export const champPages = (view: { container: HTMLElement }) => view.container.querySelector('input[aria-label="Ajouter une page"]') as HTMLInputElement;
export const champFichier = (view: { container: HTMLElement }) => view.container.querySelector('input[aria-label="Importer un justificatif"]') as HTMLInputElement;
export const nbPages = (view: { container: HTMLElement }) => view.container.querySelectorAll('[data-dp="rangee-pages"] [data-dp="page"]').length;
export const bouton = (nom: string | RegExp) => screen.getByRole('button', { name: nom });
/** « Documents » puis une page par fichier (un fichier à la fois, par le sélecteur « + page » : un seul fichier par « Documents » se lirait tout de suite, D382). */
export async function ouvrirRangee(view: { container: HTMLElement }, fichiers: File[]) {
  fireEvent.click(bouton('Documents'));
  for (const [i, f] of fichiers.entries()) {
    fireEvent.change(champPages(view), { target: { files: [f] } });
    await waitFor(() => expect(nbPages(view)).toBe(i + 1));
  }
}
export { fireEvent, screen, waitFor };
import { expect } from 'vitest';

/** L'empreinte attendue d'un lot de pages, calculée ici (la formule du serveur : sha256 de la suite des sha256 bruts), sans passer par le module simulé. */
export const empreinteAttendue = async (fichiers: File[]) => createHash('sha256').update(Buffer.concat(await Promise.all(fichiers.map(async f => Buffer.from(await webcrypto.subtle.digest('SHA-256', await f.arrayBuffer())))))).digest('hex');
