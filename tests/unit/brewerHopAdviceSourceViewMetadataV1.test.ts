import { describe, expect, it } from 'vitest';
import { readBrewerHopAdviceSourceViewMetadataV1 } from '../../functions/src/brewerHopAdviceSourceViewMetadataV1.js';
import {
  assertBrewerHopAdviceSourceViewV1,
  createBrewerHopAdviceSourceViewV1,
} from '../../functions/src/brewerHopAdviceSemanticV3.js';
import { createHopV55DecisionReadingArchiveV4 } from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference.js';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext.js';
import { prepareHopV55DecisionProgram } from '../../src/services/hopV55/decisionProgramPreparation.js';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime.js';
import {
  createHopV55QuestionScopeLedgerV1,
  readHopV55QuestionSemanticWithScopesV1,
  type HopV55QuestionScopeTransitionV1,
} from '../../src/services/hopV55/questionScopeReading.js';

const ownerKey = 'owner:source-view-metadata-fixture';
const workspaceId = 'workspace:source-view-metadata-fixture';
const recordedAt = '2026-10-04T12:00:00.000Z';
const question = 'Ajouter un houblon au whirlpool. Quand utiliser les houblons avec ma levure et lesquels ?';
const source = { kind: 'exploration' as const };
const actor: HopV55QuestionScopeTransitionV1['actor'] = { origin: 'fixture', label: 'Fixture de contrat' };

function span(text: string) {
  const start = question.indexOf(text);
  if (start < 0) throw new Error(`Fragment absent de la question fixture: ${text}`);
  return { start, end: start + text.length, text };
}

function programPreparation() {
  const input = {
    branch: { id: 'branch:metadata-fixture', label: 'Ajout à préciser' },
    program: { id: 'program:metadata-fixture', revision: 1, stage: 'planning' as const,
      volumeL: 20, wortGravity: null, additions: [] },
    materials: [],
    intent: { question, interpretation: 'Une opération future reste à préciser.', criteria: [] },
    operations: [{ id: 'operation:metadata-fixture', label: 'Compléter l’ajout', kind: 'add' as const,
      additionId: 'addition:metadata-fixture', grams: null, targetScope: 'hotSide' as const,
      sourceSpan: span('Ajouter un houblon au whirlpool') }],
  };
  return { input, result: prepareHopV55DecisionProgram(input) };
}

function sourceViewFixture() {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
  const { reading, scopeDrafts } = readHopV55QuestionSemanticWithScopesV1(question, prepared);
  const transition: HopV55QuestionScopeTransitionV1 = {
    actId: 'act:metadata-fixture', kind: 'create', reason: 'Portées archivées pour la fixture.', recordedAt, actor,
  };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading, scopeDrafts, transition });
  const parent = createHopV55DecisionReadingArchiveV4({ id: 'reading:metadata-parent', ownerKey, workspaceId,
    recordedAt, reading, source, runtimeReference: 'runtime:metadata-parent' });
  const archive = createHopV55DecisionReadingArchiveV4({ id: 'reading:metadata-child', ownerKey, workspaceId,
    recordedAt, reading, source, runtimeReference: 'runtime:metadata-child', scopeLedger, transition,
    lineage: { kind: 'reinterpretation', parentReadingReference: parent.contentReference,
      parentReadingFormat: parent.format, reason: 'Successeur de fixture.', recordedAt,
      actor: { origin: 'user', label: 'Brasseur fixture' } },
    programPreparation: programPreparation() });
  return { archive, view: createBrewerHopAdviceSourceViewV1(archive) };
}

function rehashView<T extends Record<string, unknown>>(view: T): T {
  const { reference: _reference, ...body } = view;
  return { ...view, reference: hopAdviceContentReference('hop-v55-source4-assistance-view-v1', body) };
}

describe('SourceView V1 : lecture des métadonnées V4 par le reader source4 exact', () => {
  it('accepte les métadonnées non vides de portées, transition, filiation et préparation', () => {
    const { view } = sourceViewFixture();
    expect(view.scopeLedger).toBeDefined();
    expect(view.transition).toBeDefined();
    expect(view.lineage).toBeDefined();
    expect(view.programPreparation).toBeDefined();
    expect(readBrewerHopAdviceSourceViewMetadataV1(view)).toMatchObject({ status: 'readOnly' });
    expect(() => assertBrewerHopAdviceSourceViewV1(view)).not.toThrow();
  });

  it('refuse chaque sous-arbre connu mal formé même si la référence entière de SourceView est recalculée', () => {
    const { view } = sourceViewFixture();

    const badLedger = structuredClone(view) as any;
    badLedger.scopeLedger.sourceScopes[0].sourceSpan.text += ' altéré';
    const badLedgerRehashed = rehashView(badLedger);
    expect(() => assertBrewerHopAdviceSourceViewV1(badLedgerRehashed)).toThrow();
    expect(readBrewerHopAdviceSourceViewMetadataV1(badLedgerRehashed)).toMatchObject({ status: 'invalid' });

    const badTransition = structuredClone(view) as any;
    badTransition.transition.actId = 'act:wrong';
    expect(() => assertBrewerHopAdviceSourceViewV1(rehashView(badTransition))).toThrow();
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(badTransition))).toMatchObject({ status: 'invalid' });

    const selfLineage = structuredClone(view) as any;
    selfLineage.lineage.parentReadingReference = selfLineage.archiveIdentity.contentReference;
    expect(() => assertBrewerHopAdviceSourceViewV1(rehashView(selfLineage))).toThrow();
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(selfLineage))).toMatchObject({ status: 'invalid' });

    const wrongQuestionPreparation = structuredClone(view) as any;
    wrongQuestionPreparation.programPreparation.input.intent.question = 'Une autre question.';
    expect(() => assertBrewerHopAdviceSourceViewV1(rehashView(wrongQuestionPreparation))).toThrow();
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(wrongQuestionPreparation))).toMatchObject({ status: 'invalid' });
  });

  it('garde les sous-formats futurs opaques après validation des champs connus', () => {
    const { view } = sourceViewFixture();
    const futureLedger = structuredClone(view) as any;
    futureLedger.scopeLedger.format = 'hop-v55-question-scope-ledger-v2';
    futureLedger.scopeLedger.reference = 'future-ledger-reference';
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(futureLedger))).toMatchObject({ status: 'unsupportedReadOnly' });

    const futureAndCorrupt = structuredClone(futureLedger) as any;
    futureAndCorrupt.transition.actor.label = '';
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(futureAndCorrupt))).toMatchObject({ status: 'invalid' });

    const futureSemanticAndCorrupt = structuredClone(view) as any;
    futureSemanticAndCorrupt.semantic.sourceFormat = 'hop-v55-question-semantic-reading-v2';
    futureSemanticAndCorrupt.transition.actor.label = '';
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(futureSemanticAndCorrupt))).toMatchObject({ status: 'invalid' });

    const futureSemantic = structuredClone(view) as any;
    futureSemantic.semantic.sourceFormat = 'hop-v55-question-semantic-reading-v2';
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(futureSemantic))).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('refuse une identité V3 et n’authentifie pas le contentReference absent de SourceView', () => {
    const { view } = sourceViewFixture();
    const legacyIdentity = structuredClone(view) as any;
    legacyIdentity.archiveIdentity.archiveFormat = 'hop-v55-decision-reading-v3';
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(legacyIdentity))).toMatchObject({ status: 'invalid' });

    const wrongArchiveReference = structuredClone(view) as any;
    wrongArchiveReference.archiveIdentity.contentReference = 'declared-only-reference';
    expect(readBrewerHopAdviceSourceViewMetadataV1(rehashView(wrongArchiveReference))).toMatchObject({ status: 'readOnly' });
  });
});
