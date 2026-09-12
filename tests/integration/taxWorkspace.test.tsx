import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { webcrypto } from 'node:crypto';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import * as financeDocuments from '../../src/services/financeDocuments';
import * as taxArchive from '../../src/services/taxArchive';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';
const { loadFinanceDocument } = financeDocuments;
import { useStorageValue } from '../../src/hooks/useLiveData';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { TAX_REVIEWS } from '../../src/domain/finance/fribourgTax';
import { TaxWorkspace } from '../../src/ui/finance/TaxWorkspace';
import type { FinanceTransaction } from '../../src/domain/finance/types';
const read = () => ({ ...FinanceService.snapshot(), transactions: StorageService.getTransactions() });
function Workspace() {
  const data = useStorageValue(read), closing = data.closings[0];
  const report = buildAnnualReport({ year: 2025, transactions: data.transactions, payments: data.payments, assets: data.assets, profile: data.profile, closing });
  return <TaxWorkspace report={report} closing={closing} transactions={data.transactions} assets={data.assets} profile={data.profile} companyName={defaultConfig.company.name} onProfile={() => {}} onInventories={() => {}} onAsset={() => {}} onVersion={() => {}}/>;
}
beforeEach(() => {
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue(null);
  vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
  vi.stubGlobal('crypto', webcrypto);
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
  FinanceService.saveProfile({ ...FinanceService.getProfile(), openingCash: { date: '2025-01-01', amountCents: 0, confirmed: true } });
  FinanceService.saveClosing({ id: 'C-2025', year: 2025, createdAt: '2026-01-01T12:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [] });
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Parcours fiscal enregistré dans les clôtures', () => {
  it('propose de reconnecter Drive puis reprend explicitement le même volume sans perdre le premier', async () => {
    let connected = false;
    vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockImplementation(() => connected);
    const reconnect = vi.spyOn(FirebaseAuthService, 'refreshDriveAccess').mockImplementation(async () => { connected = true; return { success: true }; });
    const first: taxArchive.TaxArchiveResult = { blob: new Blob(['volume1']), fileName: 'volume1.zip', entries: [], totalDocuments: 2, nextIndex: 1, missingCount: 1 };
    const final: taxArchive.TaxArchiveResult = { ...first, blob: new Blob(['volume2']), fileName: 'volume2.zip', nextIndex: null, missingCount: 0 };
    const create = vi.spyOn(taxArchive, 'createTaxArchive').mockResolvedValueOnce(first).mockRejectedValueOnce(Object.assign(Error('Reconnecte Google Drive.'), { code: 'drive/auth-required' })).mockResolvedValueOnce(final);
    const download = vi.spyOn(taxArchive, 'downloadTaxArchive').mockImplementation(() => {});
    render(<Workspace/>); fireEvent.click(screen.getByRole('tab', { name: 'Dossier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger le dossier avec justificatifs' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Télécharger la suite · volume 2' }));
    const connect = await screen.findByRole('button', { name: 'Connecter Drive' });
    await waitFor(() => expect(connect).toBeEnabled());
    expect(download).toHaveBeenCalledOnce(); expect(screen.getByRole('button', { name: 'Télécharger la suite · volume 2' })).toBeEnabled();
    fireEvent.click(connect);
    await waitFor(() => expect(reconnect).toHaveBeenCalledOnce());
    await screen.findByText('Drive connecté. Tu peux reprendre le téléchargement ou figer la version.');
    expect(create).toHaveBeenCalledTimes(2); // Reconnection itself must not restart any download.
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger la suite · volume 2' }));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(2));
    expect(create.mock.calls[1][0]).toMatchObject({ volume: 2, startIndex: 1 });
    expect(create.mock.calls[2][0]).toMatchObject({ volume: 2, startIndex: 1 });
    expect(download.mock.calls[0][0]).toBe(first); expect(download.mock.calls[1][0]).toBe(final);
    expect(screen.getByText('1 pièce(s) non jointe(s) dans les volumes téléchargés')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Télécharger la suite/ })).not.toBeInTheDocument();
  });
  it('enregistre l’activité accessoire, les contrôles et le report confirmé puis copie le bon montant', async () => {
    const clipboard = vi.fn(async () => {}); Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboard }, configurable: true });
    render(<Workspace/>);
    fireEvent.click(screen.getByRole('button', { name: /^Vérifications de l’année/ }));
    fireEvent.change(screen.getByLabelText('La brasserie est mon activité'), { target: { value: 'secondary' } });
    for (const r of TAX_REVIEWS) fireEvent.click(screen.getByRole('checkbox', { name: r.label }));
    fireEvent.change(screen.getByLabelText('Étape à compléter'), { target: { value: 'wealth' } });
    fireEvent.change(screen.getByLabelText('Provenance et rapprochement'), { target: { value: 'Annexe 05 vérifiée pour cette année.' } });
    expect(screen.getByRole('checkbox', { name: /J’ai vérifié ce montant/ })).toBeDisabled(); // a note must never invent a zero amount
    fireEvent.change(screen.getByLabelText('Montant de fortune issu de l’annexe 05 (CHF)'), { target: { value: '0' } });
    fireEvent.blur(screen.getByLabelText('Montant de fortune issu de l’annexe 05 (CHF)'));
    fireEvent.click(screen.getByRole('checkbox', { name: /J’ai vérifié ce montant/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(FinanceService.getClosings()[0].tax?.activity).toBe('secondary');
    fireEvent.click(screen.getByRole('tab', { name: 'Reporter' }));
    expect(screen.getByText('Code 1.220')).toBeVisible();
    const copy = screen.getByRole('button', { name: 'Copier Revenu de la brasserie · activité accessoire' });
    expect(copy).toBeEnabled(); fireEvent.click(copy); await waitFor(() => expect(clipboard).toHaveBeenCalledWith('0.00'));
    expect(screen.getByRole('button', { name: 'Copier Fortune mobilière de l’exploitation' })).toBeEnabled();
  });
  it('stocke un justificatif complémentaire original sans IA et le conserve dans la version figée', async () => {
    const pdf = new jsPDF(); pdf.text('Relevé bancaire fictif', 20, 20);
    const original = pdf.output('arraybuffer');
    render(<Workspace/>); fireEvent.click(screen.getByRole('tab', { name: 'Dossier' }));
    fireEvent.click(screen.getByRole('button', { name: /^Pièces complémentaires/ }));
    const file = new File([original], 'releve-test.pdf', { type: 'application/pdf' });
    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText('releve-test.pdf')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const draft = FinanceService.getClosings()[0], attachment = draft.tax!.attachments[0];
    const stored = await loadFinanceDocument(attachment.documentId);
    expect(stored.dataUrl.split(',')[1]).toBe(btoa(String.fromCharCode(...new Uint8Array(original))));
    let frozen: Awaited<ReturnType<typeof FinanceService.finalizeClosing>>;
    await act(async () => { frozen = await FinanceService.finalizeClosing(draft); });
    expect(frozen!.report!.tax!.attachments[0].documentId).toBe(attachment.documentId);
    expect(() => FinanceService.saveClosing({ ...frozen!, tax: { ...frozen!.tax!, attachments: [] } })).toThrow('figée');
  });
  it('fige les anciens justificatifs intégrés aux transactions avant toute modification ultérieure', async () => {
    const pdf = new jsPDF(); pdf.text('Ancien original', 20, 20);
    const source = `data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(pdf.output('arraybuffer'))))}`;
    const tx: FinanceTransaction = { id: 'LEGACY-TAX', date: '2025-09-01', description: 'Facture historique', amountHT: 10, amountTTC: 10, tvaRate: 0, tvaAmount: 0, category: 'brassage', subcategory: '', proofUrl: source, proofType: 'application/pdf', proofFileName: 'historique.pdf' };
    StorageService.addTransaction(tx);
    const frozen = await FinanceService.finalizeClosing(FinanceService.getClosings()[0]);
    const saved = frozen.report!.documents[0];
    expect(saved.proofSource).toBe('document'); expect(saved.proofDocumentId).toMatch(/^TAXDOC-/);
    expect(JSON.stringify(frozen)).not.toContain('base64');
    expect((await loadFinanceDocument(saved.proofDocumentId!)).dataUrl).toBe(source);
    expect(StorageService.getTransactions()[0].proofUrl).toBe(source); // freezing never rewrites the invoice
    const again = await FinanceService.finalizeClosing(FinanceService.getClosings().find(c => c.id === 'C-2025')!);
    expect(again.report!.documents[0].proofDocumentId).toBe(saved.proofDocumentId); // same original reused across versions
  });
  it('conserve le fichier et ne publie pas de référence lors d’un échec puis reprend le même original', async () => {
    const upload = vi.spyOn(financeDocuments, 'saveFinanceDocumentConfirmed').mockRejectedValueOnce(Error('Connexion interrompue pendant le justificatif.'));
    const pdf = new jsPDF(); pdf.text('Document à conserver après échec', 20, 20);
    render(<Workspace/>); fireEvent.click(screen.getByRole('tab', { name: 'Dossier' }));
    fireEvent.click(screen.getByRole('button', { name: /^Pièces complémentaires/ }));
    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File([pdf.output('arraybuffer')], 'a-reessayer.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(screen.getByText('a-reessayer.pdf')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connexion interrompue'));
    expect(FinanceService.getClosings()[0].tax?.attachments ?? []).toHaveLength(0);
    expect(screen.getByText('a-reessayer.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload.mock.calls[0][0].id).toBe(upload.mock.calls[1][0].id);
    const attachment = FinanceService.getClosings()[0].tax!.attachments[0];
    expect((await loadFinanceDocument(attachment.documentId)).fileName).toBe('a-reessayer.pdf');
  });
  it('ne fige pas une année si un ancien original échoue et réutilise les copies confirmées au réessai', async () => {
    const pdf = new jsPDF(); pdf.text('Deux anciens originaux', 20, 20);
    const source = `data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(pdf.output('arraybuffer'))))}`;
    for (const id of ['ANCIEN-A', 'ANCIEN-B']) StorageService.addTransaction({ id, date: '2025-09-01', description: id, amountHT: 10, amountTTC: 10, tvaRate: 0, tvaAmount: 0, category: 'brassage', subcategory: '', proofUrl: source, proofType: 'application/pdf', proofFileName: `${id}.pdf` });
    const originalUpload = financeDocuments.saveFinanceDocumentConfirmed;
    const upload = vi.spyOn(financeDocuments, 'saveFinanceDocumentConfirmed').mockImplementationOnce(originalUpload).mockRejectedValueOnce(Error('Envoi interrompu'));
    const draft = FinanceService.getClosings()[0];
    await expect(FinanceService.finalizeClosing(draft)).rejects.toThrow('interrompu');
    expect(FinanceService.getClosings()).toHaveLength(1);
    expect(FinanceService.getClosings()[0].report).toBeUndefined();
    expect(FirestoreRepo.all<any>('financeDocuments').filter(doc => doc.chunkCount)).toHaveLength(1);
    const frozen = await FinanceService.finalizeClosing(draft);
    expect(frozen.report!.documents.every(doc => doc.proofSource === 'document')).toBe(true);
    expect(FirestoreRepo.all<any>('financeDocuments').filter(doc => doc.chunkCount)).toHaveLength(2);
    expect(upload.mock.calls[0][0].id).toBe(upload.mock.calls[2][0].id);
  });
  it('protège les reports et garde les étapes utilisables au clavier lorsque les données manquent', () => {
    render(<Workspace/>);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Préparer' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Reporter' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Copier Revenu de la brasserie' })).toBeDisabled();
    expect(screen.queryByText('Code 1.210')).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Reporter' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Dossier' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Télécharger le dossier avec justificatifs' })).toBeVisible();
  });
});
