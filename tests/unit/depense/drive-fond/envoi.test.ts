import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie d3c, contrat du travailleur (PLAN § 2.2, T1 à T8) : Drive, Firestore, session et temps sont factices ; aucun Gemini, aucun appel réel.
 * Chaque cas dit ce qu'il prouve. Sur HEAD le module `proofQueue` n'existe pas : ces tests prouvent un contrat, pas un défaut.
 */
const S = vi.hoisted(() => ({
  txs: [] as any[], ready: true, user: { uid: 'u1' } as any, reads: 0, log: [] as string[], writes: [] as any[],
  writeStatus: {} as Record<string, string>, waitFail: null as null | ((id: string, identity?: any) => any),
  upload: vi.fn(), token: vi.fn(),
}));
vi.mock('../../../../src/services/storage', () => ({ StorageService: {
  getTransactions: () => { S.reads++; return S.txs; }, isReady: () => S.ready,
  updateTransaction: (next: any) => {
    const old = S.txs.find(t => t.id === next.id);
    if (old?.finance?.voidedAt) throw new Error('Cette écriture est annulée. Crée une nouvelle opération pour la remplacer.');
    S.writes.push(structuredClone(next)); S.log.push(`write:${next.finance?.proofUpload?.state ?? (next.finance?.proofDocumentId ? 'link' : 'clear')}`);
    S.txs = S.txs.map(t => t.id === next.id ? next : t);
  } } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({
  isConfirmedWriteRejection: (error: any) => error?.status === 'rejected',
  FirestoreRepo: {
    documentWriteState: (_n: string, id: string) => ({ status: S.writeStatus[id] ?? 'confirmed' }),
    waitForDocument: async (_n: string, id: string, _ms: number, identity?: (value: any) => boolean) => {
      const failure = S.waitFail?.(id, identity); if (failure) throw failure;
      const found = S.txs.find(t => t.id === id); if (!found) throw new Error('absent');
      if (identity && !identity(found)) throw new Error('identité');
      S.log.push('accusé'); return found;
    }, subscribe: () => () => undefined } }));
vi.mock('../../../../src/services/financeDocuments', () => ({
  prepareFinanceDocument: (id: string, dataUrl: string, fileName: string, mimeType: string) => ({ id, fileName, mimeType, parts: [dataUrl] }),
  saveFinanceDocumentConfirmed: (...args: any[]) => S.upload(...args) }));
vi.mock('../../../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => S.user, ensureDriveAccessToken: () => S.token() } }));
import * as queue from '../../../../src/services/proofQueue';
import { computeProofAlerts } from '../../../../src/services/proofUploadStatus';

const DAY = 86_400_000, T0 = Date.parse('2026-11-01T10:00:00Z');
const PDF = 'data:application/pdf;base64,JVBERi0xLjQK', PDF2 = 'data:application/pdf;base64,JVBERi0xLjUK';
const expense = (id: string, finance: any = {}, extra: any = {}) => ({ id: `TX-${id}`, date: '27.04.2026', description: `Achat ${id}`, category: 'brassage', amountTTC: 10,
  finance: { version: 1, kind: 'expense', amountCents: 1000, lines: [], vendor: 'Fournisseur', proofUpload: { state: 'queued', uid: 'u1', at: new Date(T0).toISOString() }, ...finance }, ...extra });
const job = (id: string, over: any = {}) => queue.enqueueProof({ submissionId: id, dataUrl: PDF, mimeType: 'application/pdf', driveName: `${id}.pdf`, year: 2026, uid: 'u1', ...over });
let store: ReturnType<typeof queue.createMemoryProofStore>;
const run = (wake = `w${Math.random()}`) => queue.runProofQueue('test', wake);
const rows = async () => Object.fromEntries((await store.all()).map(row => [row.submissionId, row]));
const receipt = { driveFileId: 'drive-1', fileName: 'Drive.pdf', bytes: 9, sha256: 'a'.repeat(64), verified: true };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0);
  S.txs = []; S.ready = true; S.user = { uid: 'u1' }; S.reads = 0; S.log = []; S.writes = []; S.writeStatus = {}; S.waitFail = null;
  S.upload.mockReset().mockResolvedValue(receipt); S.token.mockReset().mockResolvedValue('jeton');
  store = queue.createMemoryProofStore(); queue.setProofFileStore(store);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); queue.setProofFileStore(undefined); });

describe('Réussite', () => {
  it('le lien est posé sur la dépense relue (proofDocumentId, proofUpload retiré) et le job n’est effacé qu’APRÈS l’accusé', async () => {
    S.txs = [expense('sub-0001')]; await job('sub-0001');
    const realDelete = store.delete; store.delete = async id => { S.log.push('effacé'); await realDelete(id); };
    await run();
    const link = S.writes.at(-1);
    expect(link.finance.proofDocumentId).toBe('proof-sub-0001');
    expect('proofUpload' in link.finance && link.finance.proofUpload !== undefined).toBe(false);
    expect(link.proofFileName).toBe('Drive.pdf');
    expect(S.log.lastIndexOf('accusé')).toBeGreaterThan(S.log.indexOf('write:link'));
    expect(S.log.indexOf('effacé')).toBeGreaterThan(S.log.lastIndexOf('accusé'));
    expect(await rows()).toEqual({});
  });
  it('accusé du lien raté : le fichier est gardé, rien n’est perdu', async () => {
    S.txs = [expense('sub-0002')]; await job('sub-0002');
    S.waitFail = (_id, identity) => identity ? new Error('délai') : null;
    await run();
    expect((await rows())['sub-0002']).toMatchObject({ state: 'queued', dataUrl: PDF });
  });
});

describe('T1 : jamais d’effacement sur un cache', () => {
  it('cache non prêt : 0 lecture de dépense, 0 effacement, 0 appel Drive', async () => {
    S.ready = false; S.txs = [expense('sub-0003')]; await job('sub-0003');
    S.reads = 0;
    await run();
    expect(S.reads).toBe(0); expect(S.upload).not.toHaveBeenCalled(); expect(S.token).not.toHaveBeenCalled();
    expect((await rows())['sub-0003'].state).toBe('queued');
  });
  it('dépense absente : le job reste intact, rien envoyé', async () => {
    await job('sub-0004'); await run();
    expect((await rows())['sub-0004']).toMatchObject({ state: 'queued', dataUrl: PDF }); expect(S.upload).not.toHaveBeenCalled();
  });
  it('session non restaurée : rien n’est tenté ni compté', async () => {
    S.user = null; S.txs = [expense('sub-0005')]; await job('sub-0005'); await run();
    expect(S.upload).not.toHaveBeenCalled(); expect((await rows())['sub-0005'].failures).toBeUndefined();
  });
  it('le job d’un autre compte n’est jamais travaillé', async () => {
    S.txs = [expense('sub-0006')]; await job('sub-0006', { uid: 'autre' }); await run();
    expect(S.upload).not.toHaveBeenCalled(); expect((await rows())['sub-0006'].state).toBe('queued');
  });
});

describe('T2 : dépense annulée, écriture refusée', () => {
  it('annulée : voided, 0 appel Drive, 0 écriture, 0 alerte ; fichier présent à J+29, absent à J+31', async () => {
    S.txs = [expense('sub-0007', { voidedAt: '2026-11-01' })]; await job('sub-0007'); await run();
    expect((await rows())['sub-0007']).toMatchObject({ state: 'voided', reason: 'cancelled' });
    expect(S.upload).not.toHaveBeenCalled(); expect(S.writes).toEqual([]);
    expect(computeProofAlerts({ transactions: S.txs, jobs: await store.all(), ready: true, now: Date.now() + 40 * DAY })).toEqual([]);
    vi.setSystemTime(T0 + 29 * DAY); await run(); expect((await rows())['sub-0007']).toBeDefined();
    vi.setSystemTime(T0 + 31 * DAY); await run(); expect((await rows())['sub-0007']).toBeUndefined();
    expect(S.writes).toEqual([]);
  });
  it('écriture refusée (rejected) : voided refused, le lien n’est jamais écrit', async () => {
    S.txs = [expense('sub-0008')]; S.writeStatus['TX-sub-0008'] = 'rejected'; await job('sub-0008'); await run();
    expect((await rows())['sub-0008']).toMatchObject({ state: 'voided', reason: 'refused' }); expect(S.writes).toEqual([]); expect(S.upload).not.toHaveBeenCalled();
  });
  it('écriture initiale pas confirmée et accusé qui ne vient pas : le job reste', async () => {
    S.txs = [expense('sub-0009')]; S.writeStatus['TX-sub-0009'] = 'pending'; S.waitFail = () => new Error('en attente'); await job('sub-0009'); await run();
    expect((await rows())['sub-0009'].state).toBe('queued'); expect(S.upload).not.toHaveBeenCalled();
  });
});

describe('T3 : un autre fichier = un autre identifiant', () => {
  it('quota après réservation, puis autre fichier : fileNo+1, un seul fichier lié ; le même fichier garde son identifiant', async () => {
    S.txs = [expense('sub-0010')]; await job('sub-0010');
    S.upload.mockRejectedValueOnce(Object.assign(new Error('plein'), { code: 'drive/quota' }));
    await run();
    expect((await rows())['sub-0010']).toMatchObject({ state: 'failed', reason: 'quota' });
    expect(S.writes.at(-1).finance.proofUpload).toMatchObject({ state: 'failed', reason: 'quota', uid: 'u1' });
    const second = await job('sub-0010', { dataUrl: PDF2, fileNo: 2 });
    expect(second.documentId).toBe('proof-sub-0010-2');
    expect((await job('sub-0010', { fileNo: 1 })).documentId).toBe('proof-sub-0010');
    await job('sub-0010', { dataUrl: PDF2, fileNo: 2 });
    await queue.requeueProof('TX-sub-0010', 'resend'); await vi.waitFor(async () => expect(await rows()).toEqual({}));
    expect(S.upload.mock.calls.map(call => call[0].id)).toEqual(['proof-sub-0010', 'proof-sub-0010-2']);
    expect(S.txs[0].finance.proofDocumentId).toBe('proof-sub-0010-2');
  });
});

describe('T6 : reprise sur événements, comptage, 30 s', () => {
  const transient = () => S.upload.mockRejectedValue(Object.assign(new Error('Drive indisponible'), { code: 'drive/unavailable' }));
  it('30 s au moins entre deux essais d’un même job', async () => {
    S.txs = [expense('sub-0011')]; await job('sub-0011'); transient();
    await run('a'); vi.setSystemTime(T0 + 10_000); await run('b');
    expect(S.upload).toHaveBeenCalledTimes(1);
    vi.setSystemTime(T0 + 31_000); await run('c'); expect(S.upload).toHaveBeenCalledTimes(2);
  });
  it('un essai raté faute de réseau (aucun serveur atteint) n’attend pas 30 s : le retour du réseau relance tout de suite', async () => {
    S.txs = [expense('sub-0032')]; await job('sub-0032');
    S.upload.mockRejectedValueOnce(Object.assign(new Error('Google Drive ne répond pas'), { code: 'drive/network' }));
    await run('a'); vi.setSystemTime(T0 + 5_000); await run('online');
    expect(S.upload).toHaveBeenCalledTimes(2); expect(await rows()).toEqual({});
  });
  it('6 échecs passagers sur 6 réveils distincts mais en 3 minutes : toujours en attente (délai minimal de 2 h)', async () => {
    S.txs = [expense('sub-0012')]; await job('sub-0012'); transient();
    for (let i = 0; i < 7; i++) { vi.setSystemTime(T0 + i * 31_000); await run(`w${i}`); }
    expect((await rows())['sub-0012']).toMatchObject({ state: 'queued' }); expect((await rows())['sub-0012'].failures).toBeGreaterThanOrEqual(6);
    expect(S.writes.some(w => w.finance.proofUpload?.state === 'failed')).toBe(false);
  });
  it('6 échecs sur 6 réveils distincts étalés sur plus de 2 h : failed network, écrit sur la dépense', async () => {
    S.txs = [expense('sub-0013')]; await job('sub-0013'); transient();
    for (let i = 0; i < 6; i++) { vi.setSystemTime(T0 + i * 25 * 60_000); await run(`w${i}`); }
    expect((await rows())['sub-0013']).toMatchObject({ state: 'failed', reason: 'network' });
    expect(S.writes.at(-1).finance.proofUpload).toMatchObject({ state: 'failed', reason: 'network' });
  });
  it('6 échecs au même réveil : un seul compté', async () => {
    S.txs = [expense('sub-0014')]; await job('sub-0014'); transient();
    for (let i = 0; i < 6; i++) { vi.setSystemTime(T0 + i * 31_000); await run('meme-reveil'); }
    expect((await rows())['sub-0014'].failures).toBe(1);
  });
  it('erreur inconnue : failed unknown au deuxième échec', async () => {
    S.txs = [expense('sub-0015')]; await job('sub-0015'); S.upload.mockRejectedValue(new Error('bizarre'));
    await run('a'); expect((await rows())['sub-0015'].state).toBe('queued');
    vi.setSystemTime(T0 + 31_000); await run('b');
    expect((await rows())['sub-0015']).toMatchObject({ state: 'failed', reason: 'unknown' });
  });
  it('functions/unavailable au renouvellement du jeton : attente, 0 alerte, rien d’écrit, rien de compté', async () => {
    S.txs = [expense('sub-0016')]; await job('sub-0016'); S.token.mockRejectedValue(Object.assign(new Error('indisponible'), { code: 'functions/unavailable' }));
    await run();
    const row = (await rows())['sub-0016'];
    expect(row.state).toBe('queued'); expect(row.failures).toBeUndefined(); expect(S.writes).toEqual([]); expect(S.upload).not.toHaveBeenCalled();
    expect(computeProofAlerts({ transactions: S.txs, jobs: await store.all(), ready: true, now: Date.now() })).toEqual([]);
  });
  it('hors ligne déclaré : aucun essai, rien de compté ; l’envoi attend le réseau', async () => {
    S.txs = [expense('sub-0017')]; await job('sub-0017'); vi.stubGlobal('navigator', { onLine: false });
    await run(); expect(S.upload).not.toHaveBeenCalled(); expect((await rows())['sub-0017'].failures).toBeUndefined();
    vi.stubGlobal('navigator', { onLine: true }); vi.setSystemTime(T0 + 31_000); await run(); expect(S.upload).toHaveBeenCalledTimes(1);
  });
  it('`sending` périmé (travailleur disparu) : repasse queued sans compter, puis repart', async () => {
    S.txs = [expense('sub-0018')]; const created = await job('sub-0018');
    await store.put({ ...created, state: 'sending', lastWakeAt: T0 - 3 * 60_000 });
    S.upload.mockRejectedValue(Object.assign(new Error('réseau'), { code: 'drive/network' }));
    await run(); const row = (await rows())['sub-0018'];
    expect(row.state).toBe('queued'); expect(row.failures).toBeUndefined(); expect(S.upload).toHaveBeenCalledTimes(1);
  });
});

describe('Causes communes, droits, fichier', () => {
  it('auth : failed, file arrêtée (le 2e job n’est pas tenté), reprise après reconnexion avec bascule queued puis liée', async () => {
    S.txs = [expense('sub-0019'), expense('sub-0020')]; await job('sub-0019'); await new Promise(r => setTimeout(r, 2)); await job('sub-0020');
    S.token.mockResolvedValue(null);
    await run();
    expect((await rows())['sub-0019']).toMatchObject({ state: 'failed', reason: 'auth' });
    expect((await rows())['sub-0020'].state).toBe('queued'); expect(S.upload).not.toHaveBeenCalled();
    expect(S.writes.at(-1).finance.proofUpload).toMatchObject({ state: 'failed', reason: 'auth' });
    S.token.mockResolvedValue('jeton'); S.log = [];
    expect(await queue.requeueAfterReconnect()).toBe(1);
    await vi.waitFor(async () => expect(await rows()).toEqual({}));
    expect(S.log.indexOf('write:queued')).toBeGreaterThanOrEqual(0);
    expect(S.log.indexOf('write:queued')).toBeLessThan(S.log.indexOf('write:link'));
    expect(S.txs.map(t => t.finance.proofDocumentId).sort()).toEqual(['proof-sub-0019', 'proof-sub-0020']);
  });
  it('un fichier refusé (drive/integrity) : failed file, le job suivant continue', async () => {
    S.txs = [expense('sub-0021'), expense('sub-0022')]; await job('sub-0021'); await new Promise(r => setTimeout(r, 2)); await job('sub-0022');
    S.upload.mockRejectedValueOnce(Object.assign(new Error('autre'), { code: 'drive/integrity' }));
    await run();
    expect((await rows())['sub-0021']).toMatchObject({ state: 'failed', reason: 'file' });
    expect((await rows())['sub-0022']).toBeUndefined(); expect(S.upload).toHaveBeenCalledTimes(2);
  });
  it('drive/not-found : un essai de plus, puis failed not-found', async () => {
    S.txs = [expense('sub-0023')]; await job('sub-0023'); S.upload.mockRejectedValue(Object.assign(new Error('introuvable'), { code: 'drive/not-found' }));
    await run('a'); expect((await rows())['sub-0023'].state).toBe('queued');
    vi.setSystemTime(T0 + 31_000); await run('b'); expect((await rows())['sub-0023']).toMatchObject({ state: 'failed', reason: 'not-found' });
  });
});

describe('T7 et T8', () => {
  it('drive/in-progress : on rappelle jusqu’au résultat', async () => {
    S.txs = [expense('sub-0024')]; await job('sub-0024');
    const progress = Object.assign(new Error('encore'), { code: 'drive/in-progress' });
    S.upload.mockRejectedValueOnce(progress).mockRejectedValueOnce(progress).mockRejectedValueOnce(progress);
    await run(); expect(S.upload).toHaveBeenCalledTimes(4); expect(await rows()).toEqual({});
  });
  it('proofDocumentId déjà posé par un autre appareil : voided, rien n’est écrit, aucun envoi', async () => {
    S.txs = [expense('sub-0025', { proofDocumentId: 'proof-autre-appareil' })]; await job('sub-0025'); await run();
    expect((await rows())['sub-0025']).toMatchObject({ state: 'voided', reason: 'cancelled' }); expect(S.writes).toEqual([]); expect(S.upload).not.toHaveBeenCalled();
  });
  it('le lien arrive pendant l’envoi (relu juste avant d’écrire) : jamais écrasé, orphelin noté', async () => {
    S.txs = [expense('sub-0026')]; await job('sub-0026');
    S.upload.mockImplementation(async () => { S.txs = S.txs.map(t => ({ ...t, finance: { ...t.finance, proofDocumentId: 'proof-concurrent-1' } })); return receipt; });
    await run();
    const row = (await rows())['sub-0026'];
    expect(row).toMatchObject({ state: 'voided', reason: 'cancelled' }); expect(row.lastFailure?.message).toContain('proof-sub-0026'); expect(S.writes).toEqual([]);
  });
  it('dépense annulée pendant l’envoi : attrapée, rien n’est écrit', async () => {
    S.txs = [expense('sub-0027')]; await job('sub-0027');
    S.upload.mockImplementation(async () => { S.txs = S.txs.map(t => ({ ...t, finance: { ...t.finance, voidedAt: '2026-11-01' } })); return receipt; });
    await run(); expect((await rows())['sub-0027']).toMatchObject({ state: 'voided', reason: 'cancelled' }); expect(S.writes).toEqual([]);
  });
  it('permission-denied (paiement arrivé entre-temps) : relu et réessayé une fois', async () => {
    S.txs = [expense('sub-0028')]; await job('sub-0028'); let refused = false;
    S.waitFail = (_id, identity) => { if (identity && !refused) { refused = true; /* la règle refuse : le SDK annule l’écriture optimiste */ S.txs = S.txs.map(t => ({ ...t, finance: { ...t.finance, proofDocumentId: undefined } })); return Object.assign(new Error('refusé'), { status: 'rejected' }); } return null; };
    await run(); expect(S.writes.filter(w => w.finance.proofDocumentId).length).toBe(2); expect(await rows()).toEqual({});
  });
});

describe('Ordre et exclusivité', () => {
  it('deux dépenses : ordre d’arrivée, un envoi à la fois', async () => {
    S.txs = [expense('sub-0029'), expense('sub-0030')]; await job('sub-0029'); await new Promise(r => setTimeout(r, 2)); await job('sub-0030');
    let active = 0, peak = 0; const order: string[] = [];
    S.upload.mockImplementation(async (prepared: any) => { active++; peak = Math.max(peak, active); order.push(prepared.id); await new Promise(r => setTimeout(r, 5)); active--; return receipt; });
    await run(); expect(order).toEqual(['proof-sub-0029', 'proof-sub-0030']); expect(peak).toBe(1);
  });
  it('même documentId, deux travailleurs : uploadDriveOriginal appelé une fois', async () => {
    S.txs = [expense('sub-0031')]; await job('sub-0031');
    S.upload.mockImplementation(async () => { await new Promise(r => setTimeout(r, 10)); return receipt; });
    await Promise.all([run('x'), run('y')]); expect(S.upload).toHaveBeenCalledTimes(1);
  });
});
