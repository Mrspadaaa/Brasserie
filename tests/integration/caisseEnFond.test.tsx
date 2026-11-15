import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Voie bg (CP-2, 10.11) : « Ça prend énormément de temps d'enregistrer une facture… faire le job en background ».
 * Ici l'écriture de la vente et la file des justificatifs sont les VRAIS services ; seuls Drive (10 s simulées, jamais appelé pour de vrai),
 * Firestore et la session sont simulés.
 *
 * BG_ANCIEN=1 rejoue l'ancien comportement (la caisse attend l'envoi au Drive avant d'écrire) : ces tests doivent alors ÉCHOUER.
 */
const state = vi.hoisted(() => ({ drive: vi.fn(), dossier: new Map<string, unknown>(), ack: vi.fn() }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u-test' }), ensureDriveAccessToken: async () => 'jeton-simule' } }));
vi.mock('../../src/services/financeDocuments', async importOriginal => ({ ...(await importOriginal<any>()), saveFinanceDocumentConfirmed: (...args: any[]) => state.drive(...args) }));
vi.mock('../../src/services/incomeEntry', async importOriginal => {
  const o = await importOriginal<any>();
  if (!process.env.BG_ANCIEN) return o;
  return { ...o, saveIncomeEntryInBackground: async (entry: any) => ({ receipt: await o.saveIncomeEntry(entry), queued: false, confirmed: true }) };
});
vi.mock('../../src/services/swissQrBill', async importOriginal => {
  const o = await importOriginal<any>();
  return { ...o, preparerQrFacture: (e: any) => o.preparerQrFacture({ ...e, rasteriser: async () => `data:image/png;base64,${'A'.repeat(1500)}` }),
    SwissQrBillService: { generateInvoicePdf: () => ({ dataUrl: 'data:application/pdf;filename=f.pdf;base64,JVBERg==', fileName: 'Facture.pdf', doc: { save: vi.fn() }, totals: {} }) } };
});
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { ReceiptService } from '../../src/services/receiptService';
import { createMemoryProofStore, listProofJobs, requeueProof, runProofQueue, setProofFileStore } from '../../src/services/proofQueue';
import { effacerBrouillon } from '../../src/ui/vente/brouillon';
import type { AppConfig, Batch, Client, PricingItem, Transaction } from '../../src/types';

const IBAN_TEST = 'CH93 0076 2011 6238 5295 7'; // IBAN d'EXEMPLE public du guide SIX
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081 }, company: { name: 'Brasserie Test', owner: '', uid: 'CHE-123.456.789', iban: IBAN_TEST,
  adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, brewhouses: [] } as unknown as AppConfig;
const client: Client = { id: 'C2', name: 'Martin Rey', type: 'Privé', contact: '', phone: '', email: '', adresse: { rue: 'Chemin des Fixtures', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' } };
const batch = { id: 'B1', name: 'Pale Ale', style: 'Pale Ale', status: 'conditionne', brewDate: '2026-09-05', volumeL: 30, volumePackagedL: 27, packaging: { bottles33: 96, bottles75: 24, kegIds: [] } } as unknown as Batch;
const tarif = (product: string, priceHT: number): PricingItem => ({ product, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT, marginCHF: 0, marginPercent: 0 });

let grandLivre: Transaction[], paiements: any[], close: ReturnType<typeof vi.fn>, message: ReturnType<typeof vi.fn>, delivrerDrive: () => void, enLigne: boolean;
const drivePrepare = () => new Promise<any>(resolve => { delivrerDrive = () => resolve({ fileName: 'Quittance-Drive.pdf', folderName: 'Drive test', verified: true }); });
const ouvrir = () => render(<QuickActionModal isOpen recipes={[]} onClose={close as any} onSuccessMessage={message as any} initialScreen="quick-sale" />);
const tuile = (nom: RegExp) => screen.getByRole('button', { name: nom });
const primaire = () => screen.getByRole('button', { name: /^(Facturer|Encaisser)/ });

beforeEach(() => {
  effacerBrouillon(); grandLivre = []; paiements = []; close = vi.fn(); message = vi.fn(); enLigne = true;
  setProofFileStore(createMemoryProofStore());
  state.drive.mockReset().mockImplementation(drivePrepare);
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => enLigne);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
  vi.spyOn(StorageService, 'getClients').mockReturnValue([client]);
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([batch]);
  vi.spyOn(StorageService, 'getTarifs').mockReturnValue([tarif('Pale Ale 33 cl', 5)]);
  vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => grandLivre);
  vi.spyOn(StorageService, 'addTransaction').mockImplementation((tx: any) => { grandLivre = [...grandLivre, tx]; });
  vi.spyOn(StorageService, 'updateTransaction').mockImplementation((tx: any) => { grandLivre = grandLivre.map(t => t.id === tx.id ? tx : t); });
  vi.spyOn(FirestoreRepo, 'put').mockImplementation(((name: string, _id: string, value: any) => { if (name === 'financialPayments') paiements.push(value); }) as any);
  vi.spyOn(FirestoreRepo, 'all').mockImplementation(((name: string) => name === 'financialPayments' ? paiements : []) as any);
  vi.spyOn(FirestoreRepo, 'documentWriteState').mockReturnValue({ operationId: 'op', status: 'confirmed' } as any);
  vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation((async (name: string, id: string, _t: number, identite?: (v: any) => boolean) => {
    const valeur: any = name === 'transactions' ? grandLivre.find(t => t.id === id) : paiements.find(p => p.id === id);
    if (!valeur || (identite && !identite(valeur))) throw new Error('Identité inattendue');
    return valeur;
  }) as any);
  vi.spyOn(ReceiptService, 'generateReceiptPdf').mockReturnValue({ doc: { save: vi.fn() } as any, dataUrl: 'data:application/pdf;filename=q.pdf;base64,JVBERg==', fileName: 'Quittance.pdf' });
});
/* Le travailleur de la file est un singleton du module : un envoi laissé en vol l'occuperait pour le test suivant. On rend la main à Drive et on laisse finir. */
afterEach(async () => { delivrerDrive?.(); await new Promise(r => setTimeout(r, 120)); cleanup(); vi.restoreAllMocks(); setProofFileStore(undefined); });

const encaisserEspeces = () => { ouvrir(); fireEvent.click(tuile(/^33 cl/)); fireEvent.click(screen.getByRole('button', { name: 'TWINT' })); fireEvent.click(primaire()); };

describe('La vente s\'écrit d\'abord, l\'envoi au Drive part en arrière-plan', () => {
  it('Drive lent (10 s) : la vente est écrite et la caisse fermée en moins d\'une seconde, le justificatif reste en file', async () => {
    const t0 = performance.now();
    encaisserEspeces();
    await waitFor(() => expect(close).toHaveBeenCalled(), { timeout: 1000 });
    expect(performance.now() - t0).toBeLessThan(1000);
    // la vente et son paiement sont écrits ; le lien Drive n'y est pas encore, et rien ne dit « synchronisé »
    expect(grandLivre).toHaveLength(1);
    const tx: any = grandLivre[0];
    expect(tx.id).toMatch(/^REC-/);
    expect(paiements).toHaveLength(1);
    expect(tx.syncedToDrive).toBe(false);
    expect(tx.finance.proofDocumentId).toBeUndefined();
    expect(tx.finance.proofUpload).toMatchObject({ state: 'queued', uid: 'u-test' });
    // le job attend (ou part) dans la file : il porte le PDF, la vente et le nom du fichier
    const [job] = await listProofJobs();
    expect(job).toMatchObject({ transactionId: tx.id, mimeType: 'application/pdf', driveName: 'Quittance.pdf', documentId: `proof-${job.submissionId}` });
    expect(['queued', 'sending']).toContain(job.state);
    expect(job.dataUrl).toMatch(/^data:application\/pdf;base64,/);
    // le message ne dit pas « conservée dans Drive » avant que ce soit vrai
    const dit: string = message.mock.calls[0][0];
    expect(dit).toMatch(/enregistrée/);
    expect(dit).toMatch(/en cours d’envoi vers Drive/);
    expect(dit).not.toMatch(/conservée dans Drive/);
  });

  it('l\'envoi part en arrière-plan ; une fois fait, le lien est posé et syncedToDrive dit vrai', async () => {
    encaisserEspeces();
    await waitFor(() => expect(close).toHaveBeenCalled(), { timeout: 1000 });
    await waitFor(() => expect(state.drive).toHaveBeenCalledOnce()); // la file l'a pris, Drive répond dans 10 s
    expect((grandLivre[0] as any).syncedToDrive).toBe(false);
    delivrerDrive();
    await waitFor(() => expect((grandLivre[0] as any).syncedToDrive).toBe(true));
    const tx: any = grandLivre[0];
    expect(tx.finance.proofDocumentId).toMatch(/^proof-/);
    expect(tx.finance.proofUpload).toBeUndefined();
    expect(tx.proofFileName).toBe('Quittance-Drive.pdf');
    await waitFor(async () => expect(await listProofJobs()).toHaveLength(0));
  });

  it('hors ligne : la vente est gardée, la caisse se ferme sans attendre, Drive n\'est pas appelé ; au retour du réseau l\'envoi repart', async () => {
    enLigne = false;
    vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation(() => new Promise(() => undefined)); // aucun accusé sans réseau
    encaisserEspeces();
    await waitFor(() => expect(close).toHaveBeenCalled(), { timeout: 1000 });
    expect(grandLivre).toHaveLength(1);
    expect(message.mock.calls[0][0]).toMatch(/synchronise au retour du réseau/);
    expect(state.drive).not.toHaveBeenCalled();
    const [job] = await listProofJobs();
    expect(job.state).toBe('queued');
    // retour du réseau
    enLigne = true;
    vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation((async (name: string, id: string, _t: number, identite?: (v: any) => boolean) => {
      const valeur: any = name === 'transactions' ? grandLivre.find(t => t.id === id) : paiements.find(p => p.id === id);
      if (!valeur || (identite && !identite(valeur))) throw new Error('Identité inattendue');
      return valeur;
    }) as any);
    void runProofQueue('online');
    await waitFor(() => expect(state.drive).toHaveBeenCalledOnce());
    delivrerDrive();
    await waitFor(() => expect((grandLivre[0] as any).syncedToDrive).toBe(true));
  });

  it('facture QR : l\'écran de résultat montre l\'état d\'envoi, « en cours » puis « dans Drive »', async () => {
    ouvrir(); fireEvent.click(screen.getByRole('button', { name: /Martin Rey/ })); fireEvent.click(tuile(/^33 cl/));
    fireEvent.click(primaire());
    expect(await screen.findByText(/Facture .* enregistrée/, undefined, { timeout: 1000 })).toBeTruthy();
    expect(screen.getByText(/PDF en cours d’envoi vers Drive/)).toBeTruthy();
    expect(message.mock.calls[0][0]).not.toMatch(/conservée dans Drive/);
    await waitFor(() => expect(state.drive).toHaveBeenCalledOnce());
    delivrerDrive();
    expect(await screen.findByText('PDF dans Drive')).toBeTruthy();
    expect((grandLivre[0] as any).syncedToDrive).toBe(true);
  });

  it('un échec d\'envoi (Drive à reconnecter) ne perd rien : la vente reste, l\'envoi se rejoue par « Renvoyer » (requeueProof sur le numéro de la vente)', async () => {
    state.drive.mockReset().mockRejectedValueOnce(Object.assign(new Error('Drive à reconnecter'), { code: 'drive/auth-required' })).mockImplementation(drivePrepare);
    encaisserEspeces();
    await waitFor(() => expect(close).toHaveBeenCalled(), { timeout: 1000 });
    await waitFor(async () => expect((await listProofJobs())[0]?.state).toBe('failed'));
    const tx: any = grandLivre[0];
    expect(tx.finance.proofUpload).toMatchObject({ state: 'failed', reason: 'auth' });
    expect(tx.syncedToDrive).toBe(false);
    expect(await requeueProof(tx.id)).toBe(true);
    await waitFor(() => expect(state.drive).toHaveBeenCalledTimes(2));
    delivrerDrive();
    await waitFor(() => expect((grandLivre[0] as any).syncedToDrive).toBe(true));
  });

  it('sans file locale (pas d\'IndexedDB) : le chemin d\'avant, l\'envoi est confirmé AVANT l\'écriture, et le message le dit vrai', async () => {
    setProofFileStore(null);
    encaisserEspeces();
    await waitFor(() => expect(state.drive).toHaveBeenCalledOnce());
    expect(grandLivre).toHaveLength(0); // rien d'écrit tant que Drive n'a pas répondu
    delivrerDrive();
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(grandLivre).toHaveLength(1);
    expect(message.mock.calls[0][0]).toMatch(/conservée dans Drive/);
  });
});
