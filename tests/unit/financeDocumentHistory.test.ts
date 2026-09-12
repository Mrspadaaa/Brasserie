import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { stableJson } from '../../functions/src/backupCore';
const state = vi.hoisted(() => ({ rows: new Map<string, any>() }));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({ getFirestore: () => ({
  doc: (path: string) => path,
  batch: () => {
    const rows: Array<[string, any]> = [];
    return { create: (path: string, value: any) => rows.push([path, value]), commit: async () => {
      if (rows.some(([path]) => state.rows.has(path))) throw { code: 6 };
      rows.forEach(([path, value]) => state.rows.set(path, value));
    } };
  }
}) }));
import { recordDataChange } from '../../functions/src/dataHistory';
const event = (id: string, after: any, before: any = null) => ({ params: { collection: 'financeDocuments', documentId: id }, id: `event-${id}`, source: 'firestore', time: '2026-09-09T12:00:00Z', authType: 'system', data: { before: { data: () => before }, after: { data: () => after } } });
beforeEach(() => state.rows.clear());
describe('Historique compact des originaux immuables', () => {
  it('conserve la référence Drive et son SHA sans transformer les métadonnées en copie du fichier', async () => {
    const value = { id: 'original-drive', provider: 'google-drive', driveFileId: 'drive-file-123', sha256: 'a'.repeat(64), bytes: 2048, mimeType: 'application/pdf', fileName: 'Fermenteur.pdf', createdAt: '2026-09-09T12:00:00Z' };
    await recordDataChange.run(event(value.id, value) as any);
    const history = [...state.rows.values()][0];
    expect(history.originalMetadata.after).toEqual(value);
    expect(history.snapshotsIncluded).toBe(false); expect(history).not.toHaveProperty('after');
    expect(history.afterHash).toBe(createHash('sha256').update(stableJson(value)).digest('hex'));
  });
  it('expurge l’ancien fichier inline des snapshots transaction tout en gardant ses empreintes', async () => {
    const source = 'data:application/pdf;base64,' + 'A'.repeat(10000);
    const before = { id: 'SALE-MIGRATED', amountTTC: 50, proofUrl: source, proofFileName: 'Quittance.pdf' };
    const after = { id: before.id, amountTTC: 50, proofFileName: before.proofFileName, finance: { proofDocumentId: 'original-drive' } };
    const input = event(before.id, after, before); input.params.collection = 'transactions';
    await recordDataChange.run(input as any);
    const history = [...state.rows.values()][0];
    expect(history.snapshotsIncluded).toBe(true); expect(history.before).not.toHaveProperty('proofUrl');
    expect(history.before.originalProofHash).toBe(createHash('sha256').update(source).digest('hex'));
    expect(history.before.originalProofEncodedLength).toBe(source.length);
    expect(history.beforeHash).toBe(createHash('sha256').update(stableJson(before)).digest('hex'));
    expect(history.after).toEqual(after); expect(JSON.stringify(history)).not.toContain(source);
  });
  it('garde empreinte et métadonnées d’un bloc de 400 ko sans en recopier les octets', async () => {
    const data = { id: 'original-test-0', documentId: 'original-test', index: 0, data: 'A'.repeat(400_000) };
    const input = event(data.id, data);
    await recordDataChange.run(input as any); await recordDataChange.run(input as any);
    expect(state.rows.size).toBe(1);
    const history = [...state.rows.values()][0];
    expect(history.snapshotsIncluded).toBe(false);
    expect(history).not.toHaveProperty('after'); expect(history).not.toHaveProperty('before');
    expect(history.originalMetadata).toEqual({ before: null, after: { id: data.id, documentId: data.documentId, index: 0, encodedLength: 400_000 } });
    expect(history.afterHash).toBe(createHash('sha256').update(stableJson(data)).digest('hex'));
    expect(JSON.stringify(history).length).toBeLessThan(2000);
  });
  it('conserve le nom et le format du document, sans modifier des événements précédents', async () => {
    const previous = { snapshotsIncluded: true, after: { data: 'ancien historique conservé' } };
    state.rows.set('dataHistory/historique-existant', previous);
    const data = { id: 'original-test', fileName: 'facture-fermenteur.pdf', mimeType: 'application/pdf', chunkCount: 3, length: 850_000, createdAt: '2026-09-09T12:00:00Z' };
    await recordDataChange.run(event(data.id, data) as any);
    expect(state.rows.get('dataHistory/historique-existant')).toBe(previous);
    const history = [...state.rows.values()][1];
    expect(history.originalMetadata.after).toEqual(data);
    expect(history.afterHash).toBe(createHash('sha256').update(stableJson(data)).digest('hex'));
    expect(history.snapshotsIncluded).toBe(false);
  });
});
