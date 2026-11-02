// @vitest-environment jsdom
/**
 * Voie d3c, contrat de la notification d'échec (PLAN § 2.3, T4) : persistante, une seule, ses deux gestes ; retardée par une feuille ouverte ;
 * absente des vues exclues. Drive, Firestore et session factices. Le chemin « Renvoyer » jusqu'à la fiche ouverte est joué dans Chrome (cas 3).
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const S = vi.hoisted(() => ({ txs: [] as any[], ready: true, refresh: vi.fn(), prepare: vi.fn(), abandon: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getTransactions: () => S.txs, isReady: () => S.ready } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { subscribe: () => () => undefined } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: vi.fn(), saveFinanceDocumentConfirmed: vi.fn() }));
vi.mock('../../../../src/services/purchaseEntry', () => ({ resendProof: vi.fn() }));
vi.mock('../../../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u1' }), ensureDriveAccessToken: async () => 'jeton',
  prepareGoogleLogin: () => S.prepare(), refreshDriveAccess: () => S.refresh() } }));
import * as queue from '../../../../src/services/proofQueue';
import { computeProofAlerts, proofUploadStatus } from '../../../../src/services/proofUploadStatus';
import { ProofUploadNotice } from '../../../../src/ui/finance/ProofUploadNotice';

const HOUR = 3_600_000, DAY = 24 * HOUR;
const expense = (id: string, proofUpload: any, extra: any = {}) => ({ id: `TX-${id}`, date: '27.04.2026', description: `Achat ${id}`, category: 'brassage', amountTTC: 10,
  finance: { version: 1, kind: 'expense', amountCents: 1000, lines: [], vendor: 'Malterie', proofUpload, ...extra } });
const failed = (reason: string, at = new Date().toISOString()) => ({ state: 'failed', reason, uid: 'u1', at });
let store: ReturnType<typeof queue.createMemoryProofStore>;
const settle = async () => { await act(async () => { await proofUploadStatus.refresh(); }); };
beforeEach(() => { S.txs = []; S.ready = true; S.refresh.mockReset().mockResolvedValue({ success: true }); S.prepare.mockReset().mockResolvedValue(undefined); store = queue.createMemoryProofStore(); queue.setProofFileStore(store); });
afterEach(async () => { cleanup(); S.txs = []; queue.setProofFileStore(undefined); vi.useRealTimers(); document.body.innerHTML = ''; await proofUploadStatus.refresh(); });
const show = async (props: any = {}) => { await settle(); const onResend = vi.fn(); const view = render(createElement(ProofUploadNotice, { onResend, ...props })); await settle(); return { onResend, view }; };

describe('Calcul des alertes (pur)', () => {
  const base = { ready: true, now: Date.parse('2026-11-10T10:00:00Z') };
  const job = (over: any = {}): any => ({ submissionId: 's1-aaaaaaa', transactionId: 'TX-s1-aaaaaaa', documentId: 'proof-s1-aaaaaaa', uid: 'u1', state: 'queued', at: '2026-11-10T09:00:00Z', createdAt: '2026-11-10T09:00:00Z', dataUrl: 'data:x', ...over });
  it('une dépense annulée n’alerte jamais, même avec un état failed', () => {
    expect(computeProofAlerts({ ...base, transactions: [expense('s1-aaaaaaa', failed('quota'), { voidedAt: '2026-11-02' })] as any, jobs: [] })).toEqual([]);
  });
  it('un job voided n’alerte jamais ; une attente récente non plus', () => {
    expect(computeProofAlerts({ ...base, transactions: [expense('s1-aaaaaaa', { state: 'queued', uid: 'u1', at: '2026-11-10T09:00:00Z' })] as any, jobs: [job({ state: 'voided' })] })).toEqual([]);
    expect(computeProofAlerts({ ...base, transactions: [expense('s1-aaaaaaa', { state: 'queued', uid: 'u1', at: '2026-11-10T09:00:00Z' })] as any, jobs: [job()] })).toEqual([]);
  });
  it('queued depuis plus de 48 h : alerte d’attente', () => {
    const alerts = computeProofAlerts({ ...base, transactions: [expense('s1-aaaaaaa', { state: 'queued', uid: 'u1', at: '2026-11-07T09:00:00Z' })] as any, jobs: [] });
    expect(alerts).toMatchObject([{ kind: 'waiting', transactionId: 'TX-s1-aaaaaaa' }]);
  });
  it('un fichier sans dépense : alerte après 7 jours seulement, et seulement cache prêt', () => {
    const old = job({ createdAt: '2026-11-01T09:00:00Z' });
    expect(computeProofAlerts({ ...base, transactions: [], jobs: [old] })).toMatchObject([{ kind: 'no-expense' }]);
    expect(computeProofAlerts({ ...base, ready: false, transactions: [], jobs: [old] })).toEqual([]);
    expect(computeProofAlerts({ ...base, transactions: [], jobs: [job({ createdAt: '2026-11-08T09:00:00Z' })] })).toEqual([]);
  });
  it('failed dans Firestore + job local failed : une seule alerte pour la dépense', () => {
    const alerts = computeProofAlerts({ ...base, transactions: [expense('s1-aaaaaaa', failed('quota'))] as any, jobs: [job({ state: 'failed', reason: 'quota' })] });
    expect(alerts).toHaveLength(1);
  });
});

describe('ProofUploadNotice', () => {
  it('failed dans Firestore : rôle alert, cause dite, toujours là après 10 s', async () => {
    S.txs = [expense('n1-aaaaaaa', failed('quota'))];
    await show();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Justificatif non envoyé · Ton espace Drive est plein.');
    expect(alert.textContent).toContain('Malterie · Achat n1-aaaaaaa');
    await new Promise(r => setTimeout(r, 150));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Renvoyer le justificatif' })).toBeTruthy();
  });
  it('N dépenses : un seul bandeau', async () => {
    S.txs = [expense('n2-aaaaaaa', failed('quota')), expense('n3-aaaaaaa', failed('network'))];
    await show();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert').textContent).toContain('2 justificatifs à renvoyer');
  });
  it('motif auth : « Reconnecter Drive » ; après la reconnexion, les envois arrêtés repartent', async () => {
    S.txs = [expense('n4-aaaaaaa', failed('auth'))];
    await show();
    const button = await screen.findByRole('button', { name: /Reconnecter Drive/ });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(S.refresh).toHaveBeenCalledTimes(1));
  });
  it('un autre motif : pas de bouton Drive', async () => {
    S.txs = [expense('n5-aaaaaaa', failed('quota'))];
    await show();
    expect(screen.queryByRole('button', { name: /Reconnecter Drive/ })).toBeNull();
  });
  it('« Renvoyer le justificatif » rend l’identifiant de LA dépense (le passage à Finances + fiche est joué dans Chrome)', async () => {
    S.txs = [expense('n6-aaaaaaa', failed('quota'))];
    const { onResend } = await show();
    fireEvent.click(screen.getByRole('button', { name: 'Renvoyer le justificatif' }));
    expect(onResend).toHaveBeenCalledWith('TX-n6-aaaaaaa');
  });
  it('aucune notification si une feuille est ouverte ; elle paraît à sa fermeture', async () => {
    S.txs = [expense('n7-aaaaaaa', failed('quota'))];
    const sheet = document.createElement('div'); sheet.setAttribute('role', 'dialog'); document.body.appendChild(sheet);
    await show();
    expect(screen.queryByRole('alert')).toBeNull();
    act(() => { sheet.remove(); });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    const confirm = document.createElement('div'); confirm.setAttribute('role', 'alertdialog'); document.body.appendChild(confirm);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    act(() => { confirm.remove(); });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });
  it('vues exclues (wizard, hopV55) : absente ; présente à la sortie', async () => {
    S.txs = [expense('n8-aaaaaaa', failed('quota'))];
    const { view, onResend } = await show({ hidden: true });
    expect(screen.queryByRole('alert')).toBeNull();
    view.rerender(createElement(ProofUploadNotice, { hidden: false, onResend }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });
  it('un job voided, une dépense annulée, un queued récent : rien', async () => {
    S.txs = [expense('n9-aaaaaaa', failed('quota'), { voidedAt: '2026-11-01' }), expense('na-aaaaaaa', { state: 'queued', uid: 'u1', at: new Date().toISOString() })];
    await show();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('un fichier sans dépense depuis plus de 7 jours : bandeau avec « Abandonner » (et non « Renvoyer »)', async () => {
    const created = await queue.enqueueProof({ submissionId: 'nb-aaaaaaa', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK', mimeType: 'application/pdf', driveName: 'x.pdf', year: 2026, uid: 'u1' });
    await store.put({ ...created, createdAt: new Date(Date.now() - 8 * DAY).toISOString() });
    await show();
    expect(screen.getByRole('alert').textContent).toContain('attend sa dépense');
    expect(screen.queryByRole('button', { name: 'Renvoyer le justificatif' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }));
    await waitFor(async () => expect((await store.get('nb-aaaaaaa'))?.state).toBe('voided'));
    expect((await store.get('nb-aaaaaaa'))?.reason).toBe('abandoned');
    await settle();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
  it('« Plus tard » réduit sans effacer l’état', async () => {
    S.txs = [expense('nc-aaaaaaa', failed('quota'))];
    await show();
    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /1 justificatif à renvoyer/ }));
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
