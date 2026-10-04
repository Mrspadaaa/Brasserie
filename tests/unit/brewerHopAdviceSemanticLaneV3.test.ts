import { describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes.js';
import { validateHopAdviceV1ChatInput, brewerHopAdviceSemanticHarnessOptionsV5 } from '../../functions/src/brewerHopAdviceSemanticAdapter.js';
import {
  HOP_ADVICE_PROTOCOL_V1,
  buildHopAdviceV1WireV3,
  type HopAdviceV1WireInputV3,
} from '../../functions/src/brewerHopAdviceTransportV1.js';
import { parseHopAdviceV1Wire, hopAdviceV1InputDigest } from '../../functions/src/brewerHopAdviceLaneV1.js';
import { BREWER_HOP_ADVICE_REQUEST_FORMAT } from '../../functions/src/brewerHopAdviceProposal.js';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT_V3,
  BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V5,
  brewerHopAdviceProviderInputV3,
  createBrewerHopAdviceRequestV3,
} from '../../functions/src/brewerHopAdviceSemanticV3.js';
import { createHopV55DecisionReadingArchiveV4, readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { projectBrewerHopAdviceContext } from '../../functions/src/brewerHopAdviceContextBinding.js';
import { validateChatInput } from '../../functions/src/brewerContext.js';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { recipe, brewState } from '../fixtures/brewCompanion';

const ownerKey = 'owner:semantic-v3-lane-fixture';
const workspaceId = 'workspace:semantic-v3-lane-fixture';
const scope = { kind: 'recipe' as const, id: 'semantic-v3-recipe' };
const question = 'Que montre exactement cette lecture sémantique ?';

function contextFixture(): BrewerContext {
  const fixtureRecipe = { ...recipe({ efficiencyPct: 75 }), id: scope.id } as ReturnType<typeof recipe> & { id: string };
  return {
    recipe: fixtureRecipe,
    journal: brewState(fixtureRecipe),
    now: Date.parse('2026-10-04T08:00:00.000Z'),
    phase: 'planning',
    provenance: ['Fixture locale.'],
    inventory: [],
    material: [],
    waterSources: [],
    editableTargets: [],
    equipment: { id: 'test', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment },
  };
}

function requestFixture(context = contextFixture(), sourceQuestion = question) {
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55QuestionSemanticV1(sourceQuestion, prepared);
  const sourceArchive = createHopV55DecisionReadingArchiveV4({
    id: 'reading:semantic-v3-lane-fixture', ownerKey, workspaceId,
    recordedAt: '2026-10-04T08:00:00.000Z', reading,
    source: { kind: 'recipe', id: scope.id },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
  const projection = projectBrewerHopAdviceContext({ scope, context, runtime: prepared.runtime });
  if (projection.status !== 'ready') throw new Error(`Fixture invalide : ${projection.reason}`);
  const contextLaunch = {
    format: 'brewer-hop-advice-context-launch-v1' as const,
    ownerKey,
    workspaceId,
    sourceReadingReference: sourceArchive.contentReference,
    source: { kind: 'recipe' as const, id: scope.id },
    sourceRuntimeReference: sourceArchive.runtimeReference,
    scope,
    expected: projection.projection,
  };
  return { context, sourceArchive, request: createBrewerHopAdviceRequestV3({ sourceArchive, contextLaunch }) };
}

function wireFixture(): { context: BrewerContext; request: ReturnType<typeof createBrewerHopAdviceRequestV3>; wire: HopAdviceV1WireInputV3 } {
  const { context, request } = requestFixture();
  const wire = buildHopAdviceV1WireV3({
    operationId: 'semantic-v3-lane-operation-01',
    question: request.question,
    scope,
    analysisMode: 'auto',
    hopAdvice: request,
  });
  return { context, request, wire };
}

describe('RequestV3 sur le transport assisté V1', () => {
  it('garde la question source4 longue exacte sans élargir la limite du chat ordinaire', () => {
    const longQuestion = `${question}\n${Array.from({ length: 50 }, (_, index) =>
      `Contexte ${index + 1} : lot observé en atelier, détail qualitatif conservé pour cette lecture.`).join('\n')}`;
    expect(longQuestion.length).toBeGreaterThan(3000);
    const { request } = requestFixture(contextFixture(), longQuestion);
    const wire = buildHopAdviceV1WireV3({ scope, operationId: 'semantic-long-question-operation',
      question: request.question, analysisMode: 'auto', hopAdvice: request });
    const parsed = parseHopAdviceV1Wire(wire);
    expect(validateHopAdviceV1ChatInput(parsed, ownerKey).input.question).toBe(longQuestion);
    expect(() => validateChatInput({ scope, operationId: wire.operationId, question: longQuestion })).toThrow('2 à 3000');
  });
  it('construit puis admet une RequestV3 explicite avec question, scope et archive liés', () => {
    const { request, wire } = wireFixture();
    const parsed = parseHopAdviceV1Wire(wire);
    expect(request.format).toBe(BREWER_HOP_ADVICE_REQUEST_FORMAT_V3);
    expect(request.sourceView.format).toBe('hop-v55-source4-assistance-view-v1');
    expect(wire.hopAdvice).not.toHaveProperty('sourceArchive');
    expect(wire.hopAdvice.sourceView.archiveIdentity.contentReference).toBe(request.sourceReadingReference);
    expect(wire.mode).toBe(HOP_ADVICE_PROTOCOL_V1.name);
    expect(parsed.requestVersion).toBe('request-v3');
    if (parsed.requestVersion === 'request-v3') {
      expect(parsed.semanticRequest).toEqual(request);
      expect(parsed.chatInput.question).toBe(question);
      expect(parsed.originalBytes).toBe(Buffer.byteLength(JSON.stringify(wire), 'utf8'));
    }
  });

  it('garde la branche V2 distincte et la fait toujours passer au validateur V2 strict', () => {
    const { wire } = wireFixture();
    const oldWire = { ...wire, hopAdvice: { format: BREWER_HOP_ADVICE_REQUEST_FORMAT } };
    const parsed = parseHopAdviceV1Wire(oldWire);
    expect(parsed.requestVersion).toBe('request-v2');
    expect(() => validateHopAdviceV1ChatInput(parsed, ownerKey)).toThrow();
  });

  it('rejette format inconnu, mélange V2/V3 et clés de transport non prévues', () => {
    const { wire, request } = wireFixture();
    expect(() => parseHopAdviceV1Wire({ ...wire, hopAdvice: { ...request, format: 'request-v99' } })).toThrow(/Version/);
    expect(() => parseHopAdviceV1Wire({ ...wire, hopAdvice: { ...request, readerAnnotations: [] } })).toThrow();
    expect(() => parseHopAdviceV1Wire({ ...wire, unrecognizedTransportField: true })).toThrow(/champ de transport inconnu/);
  });

  it('mesure le wire complet, sa profondeur et son digest, pas seulement le handoff', () => {
    const { wire } = wireFixture();
    const first = parseHopAdviceV1Wire(wire);
    if (first.requestVersion !== 'request-v3') throw new Error('Fixture V3 non discriminée.');
    const digest = hopAdviceV1InputDigest(first.wireInput);
    const changed = parseHopAdviceV1Wire({ ...wire, phase: 'fermentation' });
    if (changed.requestVersion !== 'request-v3') throw new Error('Wire modifié perdu hors branche V3.');
    expect(hopAdviceV1InputDigest(changed.wireInput)).not.toBe(digest);

    expect(() => parseHopAdviceV1Wire({ ...wire, phase: 'x'.repeat(100_000) })).toThrow(/volumineux/);
    let nested: Record<string, unknown> = {};
    let cursor = nested;
    for (let index = 0; index < 25; index++) {
      const child: Record<string, unknown> = {};
      cursor.child = child;
      cursor = child;
    }
    expect(() => parseHopAdviceV1Wire({ ...wire, phase: nested } as unknown)).toThrow(/profond/);
  });

  it('refuse owner et scope divergents avant le harness et construit un profile V5 lecture seule', async () => {
    const { context, request, wire } = wireFixture();
    const parsed = parseHopAdviceV1Wire(wire);
    expect(() => validateHopAdviceV1ChatInput(parsed, 'owner:other')).toThrow(/owner/);

    const changedScope = parseHopAdviceV1Wire({ ...wire, scope: { kind: 'app', id: 'stocks-hops' } });
    expect(() => validateHopAdviceV1ChatInput(changedScope, ownerKey)).toThrow(/scope/);

    const access = {
      lookup: vi.fn(async () => ({ records: [], truncated: false })),
      write: vi.fn(async () => ({ status: 'done' })),
    };
    const options = brewerHopAdviceSemanticHarnessOptionsV5(request, context,
      { scope, catalogue: access, ownerUid: ownerKey });
    expect(options.profile.id).toBe('hopAdviceSemanticProposalV5');
    expect(options.profile.finish.name).toBe(BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V5);
    expect(options.profile.promptData.assistedReading).toEqual(brewerHopAdviceProviderInputV3(request));
    expect(options).not.toHaveProperty('scenarios');
    expect(options.profile.readTools).toContain('prepare_brewing_scenario');
    expect(options.profile.readTools).not.toContain('create_brewing_catalogue_entry');
    expect(options.catalogue).toBeDefined();
    await expect(options.catalogue!.write({} as never)).rejects.toThrow(/n’écrit pas/);
    expect(access.write).not.toHaveBeenCalled();
  });
});
