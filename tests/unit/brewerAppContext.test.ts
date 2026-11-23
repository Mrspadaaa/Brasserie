import { beforeEach, describe, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({ records: new Map<string, any[]>(), reads: [] as string[] }));
vi.mock('../../functions/src/brewerFinanceContext', () => ({ loadBrewerFinanceContext: async () => ({ version: 1, coverage: { transactions: { loaded: 82, limit: 1500, complete: true, totalAtLeast: 82, order: 'document-id' } }, ledger: { observedExpensesCents: 886420, cashCents: null } }) }));
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
  it('donne aussi le contexte financier au laboratoire pour ses projets de matériel', async () => {
    const context = await loadBrewerAppContext('production-lab');
    expect(context.finance?.version).toBe(1);
    expect(fake.reads).toEqual(['creativeItems', 'recipes']);
  });
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
  it('utilise le résumé financier dédié plutôt que les 80 premières écritures brutes', async () => {
    fake.records.set('transactions', Array.from({ length: 82 }, () => ({ amountTTC: 108.1, tvaAmount: 8.1, proofUrl: 'private-file' })));
    const context = await loadBrewerAppContext('finances');
    expect(context.records).toEqual({});
    expect(context.finance?.version).toBe(1);
    expect(context.coverage?.transactions).toMatchObject({ loaded: 82, complete: true });
    expect(JSON.stringify(context)).not.toContain('private-file');
    expect(fake.reads).toEqual([]);
  });
});
