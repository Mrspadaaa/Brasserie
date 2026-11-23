import { describe, expect, it, vi } from 'vitest';
import type { BrewerCatalogueAccess } from '../../functions/src/brewerCatalogueTools.js';
import type { BrewerContext } from '../../functions/src/companionTypes.js';
import { runBrewerHarness } from '../../functions/src/brewerHarness.js';
import {
  brewerHopAdviceSemanticHarnessOptionsV5,
  validateHopAdviceV1ChatInput,
} from '../../functions/src/brewerHopAdviceSemanticAdapter.js';
import { parseHopAdviceV1Wire } from '../../functions/src/brewerHopAdviceLaneV1.js';
import {
  buildHopAdviceV1WireV3,
} from '../../functions/src/brewerHopAdviceTransportV1.js';
import {
  BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V5,
  brewerHopAdviceProviderInputV3,
  createBrewerHopAdviceRequestV3,
  readBrewerHopAdviceProposalEnvelopeV5,
} from '../../functions/src/brewerHopAdviceSemanticV3.js';
import {
  createHopV55DecisionReadingArchiveV4,
  readHopV55QuestionSemanticV1,
} from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { projectBrewerHopAdviceContext } from '../../functions/src/brewerHopAdviceContextBinding.js';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { recipe, brewState } from '../fixtures/brewCompanion';

const ownerKey = 'owner:semantic-profile-v5-fixture';
const workspaceId = 'workspace:semantic-profile-v5-fixture';
const scope = { kind: 'recipe' as const, id: 'semantic-profile-recipe' };
const question = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
const operationId = 'semantic-profile-v5-operation-01';

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

function fixture() {
  const context = contextFixture();
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55QuestionSemanticV1(question, prepared);
  const sourceArchive = createHopV55DecisionReadingArchiveV4({
    id: 'reading:semantic-profile-v5', ownerKey, workspaceId,
    recordedAt: '2026-10-04T08:00:00.000Z', reading,
    source: { kind: 'recipe', id: scope.id },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
  const projection = projectBrewerHopAdviceContext({ scope, context, runtime: prepared.runtime });
  if (projection.status !== 'ready') throw new Error(`Fixture contexte invalide : ${projection.reason}`);
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
  const request = createBrewerHopAdviceRequestV3({ sourceArchive, contextLaunch });
  const wire = buildHopAdviceV1WireV3({ operationId, question: request.question, scope, analysisMode: 'auto', hopAdvice: request });
  return { context, prepared, sourceArchive, request, wire };
}

const toolCalls = (...calls: Array<[string, unknown]>) => ({
  candidates: [{ content: { role: 'model', parts: calls.map(([name, args]) => ({ functionCall: { name, args } })) } }],
});
const approved = () => ({
  candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }],
});

const finishV5 = {
  annotationReviews: [],
  propertyIntentProposals: [],
  semanticRevisionProposals: [],
  openQuestions: [],
  materials: [],
  answer: {
    summary: 'La lecture conserve une demande de caractérisation avant tout choix.',
    readingNote: 'La question exacte demande de caractériser le houblon sans décider d’augmenter l’amertume.',
    options: [{ id: 'assist-characterize', kind: 'investigation', title: 'Caractériser avant de choisir',
      rationale: 'Une caractérisation garde ouverte la décision de levier.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [] }],
    unknowns: [],
    program: { kind: 'none', note: 'Aucun programme préparé.' },
    refusals: [],
  },
};

describe('Profil sémantique V5 sur le vrai harness', () => {
  it('lie RequestV3 au contexte avant Generate, puis termine V5 sans archive brute, projection modèle ni writer', async () => {
    const { context, request, wire, sourceArchive } = fixture();
    const catalogue = {
      readReceipts: vi.fn(async () => []),
      lookup: vi.fn(async () => ({ records: [], truncated: false })),
      write: vi.fn(async () => ({ status: 'applied' })),
    } as unknown as BrewerCatalogueAccess & { write: ReturnType<typeof vi.fn>; lookup: ReturnType<typeof vi.fn> };
    const scenarios = { read: vi.fn(), write: vi.fn() };

    const preGenerate = async (rawWire: unknown, uid: string, generate: ReturnType<typeof vi.fn>) => {
      const parsed = parseHopAdviceV1Wire(rawWire);
      const validated = validateHopAdviceV1ChatInput(parsed, uid);
      if (validated.requestVersion !== 'request-v3') throw new Error('La fixture doit rester RequestV3.');
      const options = brewerHopAdviceSemanticHarnessOptionsV5(validated.request, context,
        { scope: validated.input.scope, catalogue, ownerUid: uid });
      return runBrewerHarness(context, validated.input.question, [], generate as any,
        { mode: validated.input.mode, ...options, scenarios: scenarios as any });
    };

    const foreignGenerate = vi.fn();
    await expect(preGenerate(wire, 'owner:other', foreignGenerate)).rejects.toThrow(/owner/);
    expect(foreignGenerate).not.toHaveBeenCalled();
    const mismatchedScope = { ...wire, scope: { kind: 'recipe', id: 'another-recipe' } };
    const staleGenerate = vi.fn();
    await expect(preGenerate(mismatchedScope, ownerKey, staleGenerate)).rejects.toThrow(/scope/);
    expect(staleGenerate).not.toHaveBeenCalled();

    const steps = [
      toolCalls(
        ['create_brewing_catalogue_entry', { commandJson: '{}' }],
        ['save_brewing_scenario', { evidenceId: 'E0', operationId: 'fake' }],
        ['propose_changes', { target: 'recipe', title: 'No write', changes: [] }],
        ['finish_advice', { level: 'info', summary: 'ordinary fallback', action: 'x', why: '', watch: '', question: '', evidenceIds: [] }],
      ),
      toolCalls([BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V5, finishV5]),
    ];
    const generate = vi.fn(async (_model: string, body: any) => body.generationConfig?.responseMimeType === 'application/json'
      ? approved() : steps.shift());
    const result = await preGenerate(wire, ownerKey, generate);

    expect(Object.keys(brewerHopAdviceSemanticHarnessOptionsV5(request, context, { scope, catalogue, ownerUid: ownerKey })).sort())
      .toEqual(['catalogue', 'profile']);
    expect(catalogue.write).not.toHaveBeenCalled();
    expect(scenarios.write).not.toHaveBeenCalled();
    expect(result.trace.filter((entry) => entry.error).map((entry) => entry.name))
      .toEqual(['create_brewing_catalogue_entry', 'save_brewing_scenario', 'propose_changes', 'finish_advice']);
    expect(result.trace.filter((entry) => entry.error).every((entry) => /indisponible dans ce mode de proposition/.test(entry.error!))).toBe(true);

    const initialBody = generate.mock.calls[0][1] as any;
    const declared = initialBody.tools[0].functionDeclarations.map((tool: any) => tool.name);
    expect(declared).toContain(BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V5);
    expect(declared).toContain('lookup_brewing_catalogue');
    for (const forbidden of ['create_brewing_catalogue_entry', 'enrich_brewing_catalogue_entry', 'save_brewing_scenario',
      'observe_brewing_scenario', 'propose_changes', 'finish_advice', 'find_brewing_suppliers']) expect(declared).not.toContain(forbidden);

    const promptData = JSON.parse(initialBody.contents[0].parts[0].text);
    expect(promptData.assistedReading).toEqual(brewerHopAdviceProviderInputV3(request));
    expect(promptData.assistedReading).not.toHaveProperty('sourcePropertyProjection');
    expect(promptData).not.toHaveProperty('sourceArchive');
    expect(promptData).not.toHaveProperty('sourcePropertyProjection');
    expect(request.sourceView.semantic).not.toHaveProperty('response');
    expect(promptData.assistedReading.archivedReaderOutput.provenance)
      .toBe('source4ArchiveOnlyNotCurrentToolEvidenceOrPermission');
    expect(promptData.assistedReading.archivedReaderOutput.readingResponse)
      .toEqual(request.sourceView.localDerivations.readingResponse);
    if (sourceArchive.reading.response !== undefined) {
      expect(request.sourceView.localDerivations.readingResponse).toMatchObject({ state: 'localOnly', path: 'reading.response' });
      expect(JSON.stringify(promptData)).not.toContain(JSON.stringify(sourceArchive.reading.response));
    }

    expect(result.profileResult?.id).toBe('hopAdviceSemanticProposalV5');
    expect(result.advice.summary).toBe(finishV5.answer.summary);
    const read = readBrewerHopAdviceProposalEnvelopeV5(result.profileResult!.payload);
    expect(read.status).toBe('readOnly');
    if (read.status === 'readOnly') {
      expect(read.envelope.requestSnapshot).toEqual(request);
      expect(read.envelope.sourcePropertyProjection.sourceReadingReference).toBe(request.sourceReadingReference);
      expect(read.envelope.proposal.answer.summary).toBe(finishV5.answer.summary);
    }
  });
});
