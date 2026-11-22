import { describe, expect, it, vi } from 'vitest';
/** Voie d3c, la table des échecs du plan § 2.2 : chaque cause, son genre. Le comptage et les seuils sont dans `envoi.test.ts`. */
vi.mock('../../../../src/services/storage', () => ({ StorageService: {} }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: {} }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: vi.fn(), saveFinanceDocumentConfirmed: vi.fn() }));
import { classifyProofFailure } from '../../../../src/services/proofQueue';

const coded = (code: string, text = 'x') => Object.assign(new Error(text), { code });
const table: Array<[string, unknown, string, string?]> = [
  ['drive/network (fetch échoué : aucun serveur atteint)', coded('drive/network'), 'wait'],
  ['functions/unavailable (renouvellement du jeton)', coded('functions/unavailable'), 'wait'],
  ['functions/deadline-exceeded', coded('functions/deadline-exceeded'), 'wait'],
  ['session pas restaurée (functions/unauthenticated)', coded('functions/unauthenticated'), 'wait'],
  ['client is offline', new Error('Failed to get document because the client is offline.'), 'wait'],
  ['envoi annulé (AbortError)', Object.assign(new Error('Envoi annulé'), { name: 'AbortError' }), 'wait'],
  ['drive/in-progress', coded('drive/in-progress'), 'wait'],
  ['drive/unavailable (5xx)', coded('drive/unavailable'), 'transient'],
  ['drive/rate-limit', coded('drive/rate-limit'), 'transient'],
  ['functions/internal', coded('functions/internal'), 'transient'],
  ['functions/resource-exhausted', coded('functions/resource-exhausted'), 'transient'],
  ['code nu `unavailable` de saveFinanceDocumentConfirmed', coded('unavailable'), 'transient'],
  ['drive/auth-required (jeton nul, 401, session)', coded('drive/auth-required'), 'stop', 'auth'],
  ['drive/quota', coded('drive/quota'), 'stop', 'quota'],
  ['drive/forbidden', coded('drive/forbidden'), 'stop', 'forbidden'],
  ['drive/not-found', coded('drive/not-found'), 'not-found'],
  ['drive/invalid-file', coded('drive/invalid-file'), 'file'],
  ['drive/integrity', coded('drive/integrity'), 'file'],
  ['identifiant pris par un autre contenu', new Error('Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.'), 'file'],
  ['erreur réellement inconnue', new Error('quelque chose de neuf'), 'unknown'],
];
describe('Table des échecs', () => {
  it.each(table)('%s', (_name, error, genre, reason) => {
    const result = classifyProofFailure(error) as any;
    expect(result.genre).toBe(genre);
    if (reason) expect(result.reason).toBe(reason);
  });
  it('navigator.onLine ne décide jamais du genre', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(classifyProofFailure(coded('drive/unavailable')).genre).toBe('transient');
    expect(classifyProofFailure(coded('drive/quota')).genre).toBe('stop');
    vi.unstubAllGlobals();
  });
});
