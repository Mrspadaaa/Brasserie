import { beforeEach, describe, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({ records: new Map<string, any[]>(), reads: [] as string[] }));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({
  getFirestore: () => ({ collection: (name: string) => ({ select: (...fields: string[]) => ({ limit: (limit: number) => ({ get: async () => {
    fake.reads.push(name);
    const rows = (fake.records.get(name) ?? []).slice(0, limit);
    return { size: rows.length, docs: rows.map((row, i) => ({ id: String(i), data: () => Object.fromEntries(Object.entries(row).filter(([key]) => fields.includes(key))) })) };
  } }) }) }) })
}));
import { loadBrewerAppContext } from '../../functions/src/brewerAppContext';
import { validateChatInput, validateScope } from '../../functions/src/brewerContext';
import { brewerAppScreen } from '../../functions/src/brewerAppScreens';
beforeEach(() => { fake.records.clear(); fake.reads.length = 0; });
describe('Contexte des écrans du compagnon', () => {
  it('autorise seulement les écrans connus et aucune modification de recette depuis un écran général', () => {
    expect(validateScope({ kind: 'app', id: 'stocks-materiel' })).toEqual({ kind: 'app', id: 'stocks-materiel' });
    expect(() => validateScope({ kind: 'app', id: 'config' })).toThrow();
    const input = { scope: { kind: 'app', id: 'dashboard' }, operationId: 'operation-local-123456', question: 'Que vérifier ?', editableTargets: [] };
    expect(validateChatInput(input).editableTargets).toEqual([]);
    expect(() => validateChatInput({ ...input, editableTargets: ['recipe'] })).toThrow();
    expect(brewerAppScreen('production', 'futs').scope.id).toBe('production-batches');
  });
  it('charge les données de la bonne section, sans coordonnées ni configuration secrète', async () => {
    fake.records.set('clients', [{ name: 'Client test', type: 'Pro', phone: 'privé', email: 'privé', geminiApiKey: 'secret' }]);
    const context = await loadBrewerAppContext('clients-crm');
    expect(fake.reads).toEqual(['clients']);
    expect(context.records.clients).toEqual([{ id: '0', name: 'Client test', type: 'Pro' }]);
    expect(JSON.stringify(context)).not.toMatch(/privé|secret/);
  });
  it('reprend les champs financiers réels et signale les aperçus partiels', async () => {
    fake.records.set('transactions', Array.from({ length: 82 }, () => ({ amountTTC: 108.1, tvaAmount: 8.1, proofUrl: 'private-file' })));
    const context = await loadBrewerAppContext('finances');
    expect(context.records.transactions).toHaveLength(80);
    expect(context.truncated).toEqual(['transactions']);
    expect(context.records.transactions[0]).toMatchObject({ amountTTC: 108.1, tvaAmount: 8.1 });
    expect(JSON.stringify(context)).not.toContain('private-file');
    fake.records.set('transactions', [{ amountTTC: 30 }]);
    expect((await loadBrewerAppContext('finances')).records.transactions).toEqual([{ id: '0', amountTTC: 30 }]);
  });
});
