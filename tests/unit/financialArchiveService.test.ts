import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FinancialArchive, FinanceTransaction } from '../../src/domain/finance/types';
import { archiveIndex, isTransactionArchived } from '../../src/domain/finance/archive';
import { assertFinancialArchive } from '../../functions/src/financialArchiveCore';

const memory = vi.hoisted(() => {
  const docs = new Map<string, any>();
  class WriteError extends Error { constructor(public status: string, public path: string, public operationId: string, message = status) { super(message); } }
  return { docs, WriteError, session: 0, state: { status: 'confirmed', operationId: 'write-1' },
    put: vi.fn((name: string, id: string, value: any) => docs.set(`${name}/${id}`, structuredClone(value))),
    all: (name: string) => [...docs].filter(([key]) => key.startsWith(`${name}/`)).map(([, value]) => structuredClone(value)),
    waitForDocument: vi.fn(), refreshDocument: vi.fn(async () => true)
  };
});
vi.mock('../../src/services/firestoreRepo', () => ({ DocumentWriteError: memory.WriteError, FirestoreRepo: {
  all: memory.all, put: memory.put, waitForDocument: memory.waitForDocument, refreshDocument: memory.refreshDocument,
  syncSession: () => memory.session, documentWriteState: () => memory.state
} }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getCurrentUser: () => 'Gaëtan' } }));
import { FinancialArchiveService } from '../../src/services/financialArchiveService';

const policy = (patch: Partial<FinancialArchive> = {}): FinancialArchive => ({ id: 'ARCHIVE-2025', year: 2025, status: 'archived', archivedAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', operationId: 'archive-op-123', ...patch });
const tx = (date: string, recordedAt?: string): FinanceTransaction => ({ id: 'old', date, finance: recordedAt == null ? undefined : { recordedAt } } as FinanceTransaction);
const waitNormally = async (name: string, id: string, _ms: number, identity: (value: any) => boolean) => {
  const value = memory.docs.get(`${name}/${id}`);
  if (!identity(value)) throw new memory.WriteError('conflict', `${name}/${id}`, memory.state.operationId);
  return { ...value, __docId: id };
};
beforeEach(() => {
  memory.session++; memory.docs.clear(); memory.put.mockClear(); memory.refreshDocument.mockClear();
  memory.state = { status: 'confirmed', operationId: 'write-1' };
  memory.waitForDocument.mockReset().mockImplementation(waitNormally);
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('Classement réversible par exercice', () => {
  it('conserve les pièces à date inconnue ou invalide dans le courant', () => {
    const index = archiveIndex([policy()]);
    expect(isTransactionArchived(tx('2025-02-28'), index)).toBe(true);
    expect(isTransactionArchived(tx('28.2.2025'), index)).toBe(true);
    for (const date of ['', '31.02.2025', '2025-02-29', '01/12/2025', '2026-01-01']) expect(isTransactionArchived(tx(date), index)).toBe(false);
    expect(isTransactionArchived(tx('2025-01-01', '2026-02-30T12:00:00Z'), index)).toBe(false);
  });
  it('classe à la limite exacte et conserve les saisies antidatées plus récentes', () => {
    const index = archiveIndex([policy()]);
    expect(isTransactionArchived(tx('2025-01-01', '2026-03-01T12:00:00Z'), index)).toBe(true);
    expect(isTransactionArchived(tx('2025-01-01', '2026-03-01T12:00:00.001Z'), index)).toBe(false);
    expect(isTransactionArchived(tx('2025-01-01', 'inconnu'), index)).toBe(false);
    expect(isTransactionArchived(tx('2025-01-01'), archiveIndex([policy({ status: 'open' })]))).toBe(false);
  });
  it('prend la dernière politique et ignore les métadonnées invalides', () => {
    const old = policy({ updatedAt: '2026-03-01T12:00:00Z' });
    const restored = policy({ status: 'open', updatedAt: '2026-03-01T12:00:00.001Z' });
    expect(archiveIndex([restored, old, policy({ year: 2024 })]).get(2025)).toEqual(restored);
    expect(archiveIndex([policy({ archivedAt: undefined }), policy({ year: 2201 })]).size).toBe(0);
  });
  it.each([1899, 2201, 2025.1, NaN, Infinity])('refuse l’année %s', async year => {
    await expect(FinancialArchiveService.setYearArchived(year, true)).rejects.toThrow('exercice valide');
    expect(memory.put).not.toHaveBeenCalled();
  });
  it('refuse année actuelle ou future mais autorise la réouverture', async () => {
    await expect(FinancialArchiveService.setYearArchived(2026, true)).rejects.toThrow('terminés');
    await expect(FinancialArchiveService.setYearArchived(2027, true)).rejects.toThrow('terminés');
    expect(memory.put).not.toHaveBeenCalled();
    await expect(FinancialArchiveService.setYearArchived(2027, false)).resolves.toMatchObject({ status: 'open' });
  });
  it('détermine le nouvel exercice à Zurich au passage de l’année', async () => {
    vi.setSystemTime(new Date('2025-12-31T23:00:01Z'));
    await expect(FinancialArchiveService.setYearArchived(2025, true)).resolves.toMatchObject({ year: 2025 });
  });
  it('écrit uniquement politique et audit lié puis confirme l’identité exacte', async () => {
    const record = await FinancialArchiveService.setYearArchived(2025, true);
    expect(record).toEqual(policy({ operationId: record.operationId, archivedAt: '2026-09-09T12:00:00.000Z', updatedAt: '2026-09-09T12:00:00.000Z' }));
    expect(memory.put.mock.calls.map(([name]) => name)).toEqual(['financialArchives', 'auditLogs']);
    const audit = memory.all('auditLogs')[0];
    expect(audit).toMatchObject({ id: `LOG-${record.operationId}`, operationId: record.operationId, entityId: record.id });
    expect(audit.id).toMatch(/^LOG-\d{14}-\d{6}-[a-f0-9-]+$/);
    expect(memory.waitForDocument).toHaveBeenCalledWith('financialArchives', record.id, 15000, expect.any(Function));
    const identity = memory.waitForDocument.mock.calls[0][3];
    expect(identity({ ...record, operationId: 'other-operation' })).toBe(false);
    expect(identity({ ...record, status: 'open' })).toBe(false);
    expect(identity({ ...record, archivedAt: '2026-09-08T12:00:00.000Z' })).toBe(false);
    expect(FinancialArchiveService.getArchives()).toEqual([record]);
  });
  it('réouvre et réarchive le même identifiant avec un nouveau seuil', async () => {
    const first = await FinancialArchiveService.setYearArchived(2025, true);
    const open = await FinancialArchiveService.setYearArchived(2025, false);
    expect(open.id).toBe(first.id); expect(open.status).toBe('open');
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    const second = await FinancialArchiveService.setYearArchived(2025, true);
    expect(second.id).toBe(first.id); expect(second.operationId).not.toBe(first.operationId);
    expect(Date.parse(second.archivedAt!)).toBeGreaterThan(Date.parse(first.archivedAt!));
    expect(memory.all('financialArchives')).toHaveLength(1); expect(memory.all('auditLogs')).toHaveLength(3);
  });
});

describe('Acquittement ciblé et reprise d’archivage', () => {
  it('reprend uniquement la lecture après timeout, sans nouveau seuil ou audit', async () => {
    memory.waitForDocument.mockRejectedValueOnce(new memory.WriteError('pending', 'financialArchives/ARCHIVE-2025', 'write-1'));
    await expect(FinancialArchiveService.setYearArchived(2025, true)).rejects.toThrow('pending');
    const first = memory.all('financialArchives')[0];
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    await expect(FinancialArchiveService.setYearArchived(2025, true)).resolves.toEqual(first);
    expect(memory.put).toHaveBeenCalledTimes(2); expect(memory.waitForDocument).toHaveBeenCalledTimes(2);
  });
  it('ne change pas de choix pendant une confirmation incertaine', async () => {
    memory.waitForDocument.mockRejectedValueOnce(new memory.WriteError('pending', 'financialArchives/ARCHIVE-2025', 'write-1'));
    await expect(FinancialArchiveService.setYearArchived(2025, true)).rejects.toThrow();
    await expect(FinancialArchiveService.setYearArchived(2025, false)).rejects.toThrow('attend sa confirmation');
    expect(memory.put).toHaveBeenCalledTimes(2);
  });
  it('partage la vérification de deux clics simultanés', async () => {
    let release!: (value: any) => void;
    memory.waitForDocument.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const first = FinancialArchiveService.setYearArchived(2025, true), second = FinancialArchiveService.setYearArchived(2025, true);
    expect(memory.put).toHaveBeenCalledTimes(2); expect(memory.waitForDocument).toHaveBeenCalledTimes(1);
    release(memory.all('financialArchives')[0]);
    expect(await first).toEqual(await second);
  });
  it('permet un vrai nouvel essai après refus et absence confirmée', async () => {
    memory.waitForDocument.mockRejectedValueOnce(new memory.WriteError('rejected', 'financialArchives/ARCHIVE-2025', 'write-1'));
    await expect(FinancialArchiveService.setYearArchived(2025, true)).rejects.toThrow('rejected');
    const first = memory.all('financialArchives')[0];
    const second = await FinancialArchiveService.setYearArchived(2025, true);
    expect(second.operationId).not.toBe(first.operationId); expect(memory.put).toHaveBeenCalledTimes(4);
  });
  it('permet un nouvel essai après refus d’une mise à jour laissant la politique précédente', async () => {
    memory.state.status = 'rejected';
    memory.waitForDocument.mockRejectedValueOnce(new memory.WriteError('conflict', 'financialArchives/ARCHIVE-2025', 'write-1'));
    await expect(FinancialArchiveService.setYearArchived(2025, false)).rejects.toThrow('refusée');
    expect(memory.refreshDocument).toHaveBeenCalledWith('financialArchives', 'ARCHIVE-2025');
    await expect(FinancialArchiveService.setYearArchived(2025, false)).resolves.toMatchObject({ status: 'open' });
    expect(memory.put).toHaveBeenCalledTimes(4);
  });
  it('signale une politique concurrente sans l’annoncer comme confirmée', async () => {
    memory.waitForDocument.mockRejectedValueOnce(new memory.WriteError('conflict', 'financialArchives/ARCHIVE-2025', 'write-1'));
    await expect(FinancialArchiveService.setYearArchived(2025, true)).rejects.toThrow('autre appareil');
    expect(memory.put).toHaveBeenCalledTimes(2); expect(memory.refreshDocument).toHaveBeenCalledTimes(1);
  });
});

describe('Validation des politiques importées', () => {
  it.each([
    { id: 'ARCHIVE-2024' }, { year: 1899 }, { year: 2201 }, { year: 2025.5 }, { status: 'deleted' }, { operationId: '' },
    { updatedAt: '2026-02-30T12:00:00.000Z' }, { archivedAt: 'bad' }, { archivedAt: '2026-04-01T12:00:00.000Z' }
  ])('refuse %j', patch => expect(() => assertFinancialArchive(policy(patch as Partial<FinancialArchive>))).toThrow());
});
