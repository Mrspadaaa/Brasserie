import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_COLLECTIONS,
  HOP_ADVICE_V1_FUNCTIONS,
  buildHopAdviceV1Wire,
  hopAdviceV1ClientPartitionKey
} from '../../functions/src/brewerHopAdviceTransportV1.js';

const candidate = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('contrat client browser-safe hopAdviceReadonlyV1', () => {
  it('publie un seul vocabulaire de protocole, collections et callables V1', () => {
    expect(HOP_ADVICE_PROTOCOL_V1).toEqual({ name: 'hopAdviceReadonlyV1', version: 1 });
    expect(Object.values(HOP_ADVICE_V1_COLLECTIONS)).toEqual([
      'brewerHopAdviceJobsV1', 'brewerHopAdviceConversationsV1',
      'brewerHopAdviceChatsV1', 'brewerHopAdviceContextsV1'
    ]);
    expect(Object.values(HOP_ADVICE_V1_FUNCTIONS)).toEqual([
      'askBrewerHopAdviceV1', 'dispatchBrewerHopAdviceV1', 'processBrewerHopAdviceV1',
      'getBrewerHopAdviceConversationV1', 'resetBrewerHopAdviceConversationV1',
      'getBrewerHopAdviceActivityV1', 'markBrewerHopAdviceReadV1', 'retryBrewerHopAdviceQuestionV1'
    ]);
  });

  it('construit le wire avec le mode d’analyse séparé et préserve question, journal et phase', () => {
    const handoff = Object.freeze({ question: 'une lecture déjà archivée' }) as never;
    const entry = {
      scope: { kind: 'batch', id: 'LOT-17' } as const,
      operationId: 'operation-client-0001',
      question: '  garder ce profil houblonné ?  ',
      analysisMode: 'deep' as const,
      generation: 4,
      localJournal: { currentIndex: 2, notes: ['valeur locale'] },
      phase: 'J4 · garde froide',
      hopAdvice: handoff
    };
    const wire = buildHopAdviceV1Wire(entry);
    expect(wire).toEqual({
      mode: HOP_ADVICE_PROTOCOL_V1.name,
      analysisMode: 'deep',
      scope: entry.scope,
      operationId: entry.operationId,
      question: entry.question,
      generation: 4,
      localJournal: entry.localJournal,
      phase: entry.phase,
      hopAdvice: handoff
    });
    expect(wire).not.toHaveProperty('mode', 'deep');
    expect(wire).not.toHaveProperty('editableTargets');
    expect(JSON.parse(JSON.stringify(wire))).toEqual(wire);
  });

  it('garde le brouillon sur une source draft et n’injecte pas de journal batch', () => {
    const entry = {
      scope: { kind: 'draft', id: 'RECETTE-2' } as const,
      operationId: 'operation-client-0002',
      question: 'question exacte',
      analysisMode: 'auto' as const,
      draft: { name: 'Bière en cours', hops: [{ name: 'Saaz', grams: 22 }] },
      phase: 'écriture',
      hopAdvice: {} as never
    };
    const wire = buildHopAdviceV1Wire(entry);
    expect(wire.draft).toEqual(entry.draft);
    expect(wire.phase).toBe(entry.phase);
    expect(wire).not.toHaveProperty('localJournal');
    expect(JSON.parse(JSON.stringify(wire))).toEqual(wire);
  });

  it('forme une clé locale non ambiguë incluant protocole, propriétaire et source', () => {
    const recipe = { kind: 'recipe', id: 'R:1' } as const;
    const key = hopAdviceV1ClientPartitionKey('uid:alpha', recipe);
    expect(hopAdviceV1ClientPartitionKey('uid:alpha', recipe)).toBe(key);
    expect(JSON.parse(key)).toEqual(['laffinee', HOP_ADVICE_PROTOCOL_V1.name, 1, 'uid:alpha', 'recipe', 'R:1']);
    expect(hopAdviceV1ClientPartitionKey('uid:alpha', { kind: 'draft', id: 'R:1' })).toBe(key);
    expect(hopAdviceV1ClientPartitionKey('uid:beta', recipe)).not.toBe(key);
    expect(hopAdviceV1ClientPartitionKey('uid:alpha', { kind: 'batch', id: 'R:1' })).not.toBe(key);
    expect(hopAdviceV1ClientPartitionKey('uid:alpha', { kind: 'recipe', id: '1' })).not.toBe(key);
    expect(hopAdviceV1ClientPartitionKey('uid', { kind: 'recipe', id: 'alpha:R:1' })).not.toBe(key);
    expect(() => hopAdviceV1ClientPartitionKey('', recipe)).toThrow(/propriétaire/);
  });

  it('se bundle pour navigateur sans dépendance Node, Firebase ou provider', async () => {
    const entry = resolve(candidate, 'functions/src/brewerHopAdviceTransportV1.ts');
    const result = await build({
      entryPoints: [entry],
      absWorkingDir: candidate,
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'esm',
      metafile: true,
      logLevel: 'silent'
    });
    const bundle = result.outputFiles[0].text;
    expect(bundle).not.toMatch(/node:crypto|firebase-admin|firebase-functions|\bBuffer\b/);
    const bundleInputs = Object.keys(result.metafile?.inputs ?? {}).map((input) => resolve(candidate, input));
    expect(bundleInputs).toEqual([entry]);
  });
});
