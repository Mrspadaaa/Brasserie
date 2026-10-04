import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_COLLECTIONS,
  assertOrdinaryCompanionJob,
  assertOrdinaryCompanionWire,
  assertHopAdviceV1JobBinding,
  hasHopAdviceV1Stamp,
  hopAdviceV1InputDigest,
  hopAdviceV1ThreadKey,
  isHopAdviceV1JobInCurrentGeneration,
  parseHopAdviceV1Wire,
  validateHopAdviceV1Job,
  validateHopAdviceV1RetrySource,
  type HopAdviceV1CanonicalChatInput,
  type ParsedHopAdviceV1Wire
} from '../../functions/src/brewerHopAdviceLaneV1.js';

const makeWire = (overrides: Record<string, unknown> = {}) => ({
  mode: 'hopAdviceReadonlyV1',
  analysisMode: 'auto',
  scope: { kind: 'batch' as const, id: 'LOT-1' },
  operationId: 'operation-0123456789',
  question: 'Question source exacte ?',
  localJournal: { steps: [{ id: 'j4', note: 'valeur locale' }] },
  phase: 'J4',
  hopAdvice: { requestId: 'handoff-1' },
  ...overrides
});

describe('transport hopAdviceReadonlyV1', () => {
  it('mesure le payload complet avant extraction et garde les champs propres à la source', () => {
    const wire = makeWire();
    const parsed = parseHopAdviceV1Wire(wire);
    expect(parsed.originalBytes).toBe(Buffer.byteLength(JSON.stringify(wire), 'utf8'));
    expect(parsed.chatInput).toMatchObject({
      mode: 'auto',
      question: wire.question,
      localJournal: wire.localJournal,
      phase: 'J4',
      scope: { kind: 'batch', id: 'LOT-1' },
      hopAdvice: wire.hopAdvice
    });
    expect(parsed.chatInput).not.toHaveProperty('analysisMode');
    expect(parsed.chatInput).not.toHaveProperty('mode', 'hopAdviceReadonlyV1');
  });

  it('ne change pas les trois modes d’analyse et conserve le brouillon seulement comme donnée source', () => {
    for (const analysisMode of ['fast', 'auto', 'deep'] as const) {
      const parsed = parseHopAdviceV1Wire(makeWire({ analysisMode, scope: { kind: 'draft', id: 'recipe-1' }, draft: { name: 'Brouillon' } }));
      expect(parsed.chatInput.mode).toBe(analysisMode);
      expect(parsed.chatInput.draft).toEqual({ name: 'Brouillon' });
      expect(parsed.wireInput.mode).toBe('hopAdviceReadonlyV1');
    }
  });

  it('refuse marqueur absent, mode futur, transmission absente, option modifiable et champs inconnus', () => {
    expect(() => parseHopAdviceV1Wire(makeWire({ mode: 'auto' }))).toThrow(/Protocole/);
    expect(() => parseHopAdviceV1Wire(makeWire({ mode: 'hopAdviceReadonlyV2' }))).toThrow(/Protocole/);
    expect(() => parseHopAdviceV1Wire(makeWire({ hopAdvice: undefined }))).toThrow();
    expect(() => parseHopAdviceV1Wire(makeWire({ editableTargets: ['recipe'] }))).toThrow(/modification/);
    expect(() => parseHopAdviceV1Wire(makeWire({ traceMode: 'debug' }))).toThrow(/champ de transport inconnu/);
    expect(() => parseHopAdviceV1Wire(makeWire({ analysisMode: 'future' }))).toThrow(/Mode d’analyse/);
  });

  it('refuse tout repli de l’endpoint ordinaire dès qu’un champ assisté est présent', () => {
    expect(() => assertOrdinaryCompanionWire(makeWire())).toThrow(/endpoint versionné/);
    expect(() => assertOrdinaryCompanionWire({ mode: 'auto', question: 'Question', hopAdvice: {} })).toThrow(/endpoint versionné/);
    expect(() => assertOrdinaryCompanionWire({ mode: 'hopAdviceReadonlyV1', question: 'Question' })).toThrow(/endpoint versionné/);
    expect(() => assertOrdinaryCompanionWire({ mode: 'auto', question: 'Ordinaire' })).not.toThrow();
  });

  it('lie stamp, digest et reprise à la version V1 et interdit la consommation par le worker ordinaire', () => {
    const wireInput = makeWire();
    // This suite checks the transport layer; canonical handoff admission is covered separately.
    const digest = hopAdviceV1InputDigest(parseHopAdviceV1Wire(wireInput).wireInput);
    const uid = 'uid-1';
    const id = createJobId(uid, wireInput.operationId);
    const job = {
      id, uid, operationId: wireInput.operationId, threadId: hopAdviceV1ThreadKey(uid, wireInput.scope),
      question: wireInput.question, scope: wireInput.scope, generation: 0,
      protocol: HOP_ADVICE_PROTOCOL_V1, wireInput, inputDigest: digest
    };
    const canonicalInput = { operationId: wireInput.operationId, question: wireInput.question, scope: wireInput.scope };
    expect(hasHopAdviceV1Stamp(job)).toBe(true);
    expect(validateHopAdviceV1Job(job).wireInput).toEqual(wireInput);
    expect(() => assertHopAdviceV1JobBinding(job, canonicalInput, id)).not.toThrow();
    expect(() => assertHopAdviceV1JobBinding({ ...job, question: 'altérée' }, canonicalInput, id)).toThrow(/question reçue/);
    expect(() => assertHopAdviceV1JobBinding({ ...job, threadId: '0'.repeat(64) }, canonicalInput, id)).toThrow(/question reçue/);
    expect(() => validateHopAdviceV1Job({ ...job, protocol: { name: 'hopAdviceReadonlyV2', version: 2 } })).toThrow(/Version/);
    expect(hasHopAdviceV1Stamp({ ...job, protocol: { ...HOP_ADVICE_PROTOCOL_V1, future: true } })).toBe(false);
    expect(() => validateHopAdviceV1Job({ ...job, inputDigest: '0'.repeat(64) })).toThrow(/altérée/);
    expect(() => assertOrdinaryCompanionJob({ input: { mode: 'hopAdviceReadonlyV1' } })).toThrow(/file ordinaire/);
    expect(() => assertOrdinaryCompanionJob({ protocol: HOP_ADVICE_PROTOCOL_V1, input: {} })).toThrow(/file ordinaire/);
    expect(() => assertOrdinaryCompanionJob({ input: { mode: 'auto' } })).not.toThrow();
  });

  it('refuse une reprise ancienne avant création et refuse un wire source altéré avec son ancien digest', () => {
    const source = makeRetrySource(7);
    expect(isHopAdviceV1JobInCurrentGeneration(source.job, { protocol: HOP_ADVICE_PROTOCOL_V1.name, generation: 8 })).toBe(false);
    expect(isHopAdviceV1JobInCurrentGeneration(source.job, { protocol: HOP_ADVICE_PROTOCOL_V1.name, generation: 7 })).toBe(true);
    let staleCreates = 0;
    expect(() => {
      const admitted = validateRetrySource(source, 8, 8);
      staleCreates += 1;
      return admitted;
    }).toThrow(/génération ancienne/);
    expect(staleCreates).toBe(0);

    const altered = { ...source.job, wireInput: { ...source.job.wireInput, question: 'Question réécrite.' } };
    let alteredCreates = 0;
    expect(() => {
      validateRetrySource({ ...source, job: altered }, 7, 7);
      alteredCreates += 1;
    }).toThrow(/altérée/);
    expect(alteredCreates).toBe(0);
  });

  it('préserve le wire source d’une reprise V1 courante lors de validations répétées', () => {
    const source = makeRetrySource(7);
    const first = validateRetrySource(source, 7, 7);
    const second = validateRetrySource(source, 7, 7);
    expect(first).toEqual(second);
    expect(first.wireInput).toEqual(source.wire);
    expect(first.input).toEqual(source.job.input);
  });

  it('isole les conversations assistées et les collections de l’outbox ordinaire', () => {
    const thread = hopAdviceV1ThreadKey('uid-1', { kind: 'recipe', id: 'R1' });
    expect(thread).toMatch(/^[a-f0-9]{64}$/);
    expect(hopAdviceV1ThreadKey('uid-1', { kind: 'draft', id: 'R1' })).toBe(thread);
    expect(hopAdviceV1ThreadKey('uid-1', { kind: 'batch', id: 'R1' })).not.toBe(thread);
    expect(Object.values(HOP_ADVICE_V1_COLLECTIONS)).not.toContain('brewerJobs');
    expect(new Set(Object.values(HOP_ADVICE_V1_COLLECTIONS)).size).toBe(4);
  });

  it('garde le contenu complet dans le plafond initial et refuse les nombres non finis', () => {
    expect(() => parseHopAdviceV1Wire(makeWire({ unusedPayload: 'x'.repeat(100_001) }))).toThrow(/volumineux/);
    expect(() => parseHopAdviceV1Wire(makeWire({ draft: { og: Number.NaN } }))).toThrow(/non finie/);
  });
});

function makeRetrySource(generation: number) {
  const wire = makeWire({ generation });
  const parsed = parseHopAdviceV1Wire(wire);
  const uid = 'retry-owner';
  const id = createJobId(uid, String(wire.operationId));
  const threadId = hopAdviceV1ThreadKey(uid, wire.scope as { kind: 'batch'; id: string });
  const job = {
    id, uid, threadId, operationId: wire.operationId, question: wire.question,
    scope: wire.scope, generation, protocol: HOP_ADVICE_PROTOCOL_V1,
    wireInput: wire, inputDigest: hopAdviceV1InputDigest(parsed.wireInput), input: parsed.chatInput,
    status: 'error'
  };
  return { uid, id, threadId, wire, job };
}

function validateRetrySource(source: ReturnType<typeof makeRetrySource>, currentGeneration: number, requestedGeneration?: number) {
  return validateHopAdviceV1RetrySource({
    sourceJob: source.job,
    sourceDocumentId: source.id,
    ownerUid: source.uid,
    expectedThreadId: source.threadId,
    currentGeneration,
    requestedGeneration,
    canonicalize: (parsed: ParsedHopAdviceV1Wire) => parsed.chatInput as unknown as HopAdviceV1CanonicalChatInput,
    stableJson: (value: unknown) => JSON.stringify(value)
  });
}

function createJobId(uid: string, operationId: string): string {
  return createHash('sha256').update(`${uid}:${operationId}`, 'utf8').digest('hex');
}
