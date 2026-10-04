import { describe, expect, it } from 'vitest';
import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import { answerQualifiedHopAdvice } from '../../src/domain/hopDecision/qualifiedAdvice';
import { answerQualifiedHopDecision } from '../../src/domain/hopDecision/qualifiedDecision';
import { createHopAdviceDossier, type HopAdviceDossierRead, type HopAdviceEventRead } from '../../src/domain/hopDecision/adviceDossier';
import { createHopDecisionDossierV2, type HopDecisionDossierRead, type HopDecisionEventRead } from '../../src/domain/hopDecision/dossier';
import type { HopCommercialProduct } from '../../src/domain/hopDecision/types';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import {
  appendHopV55QualifiedStudyLink,
  appendHopV55QualifiedStudyPreparation,
  createHopV55QualifiedStudyPreparationV1,
  createHopV55QualifiedAdvicePreparationContextV1,
  readHopV55QualifiedAdvicePreparationContextV1,
  readHopV55QualifiedStudyLink,
  readHopV55QualifiedStudyPreparation,
  saveHopV55QualifiedStudy,
} from '../../src/services/hopV55/qualifiedStudyWorkspace';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopAdviceJourneyFixture } from '../fixtures/hopAdviceJourney';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey,
      (value as HopV55WorkspaceEnvelopeV1).workspaceId,
    ]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const snapshot = new Map([...this.workspaces.rows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = snapshot; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory fixture only. */ }
}

class MemoryQualifiedStudies implements HopDecisionLocalRepository {
  readonly dossiers = new Map<string, HopDecisionDossierRead>();
  readonly firstEvents = new Map<string, HopDecisionEventRead | HopAdviceEventRead>();
  readonly events = new Map<string, Array<HopDecisionEventRead | HopAdviceEventRead>>();
  createCalls = 0;
  private key(ownerKey: string, dossierId: string) { return `${ownerKey}\0${dossierId}`; }
  async create(input: Parameters<HopDecisionLocalRepository['create']>[0]) {
    this.createCalls++;
    const key = this.key(input.ownerKey, input.dossierId);
    const existing = this.dossiers.get(key);
    const priorEvent = this.firstEvents.get(key);
    if (existing && priorEvent) return { status: 'duplicate' as const, dossier: existing, event: priorEvent };
    const created = 'formatVersion' in input.study && input.study.formatVersion === 3
      ? createHopAdviceDossier(input as Parameters<typeof createHopAdviceDossier>[0])
      : createHopDecisionDossierV2(input as Parameters<typeof createHopDecisionDossierV2>[0]);
    this.dossiers.set(key, created.dossier as HopDecisionDossierRead);
    this.firstEvents.set(key, created.event as HopDecisionEventRead | HopAdviceEventRead);
    this.events.set(key, [created.event as HopDecisionEventRead | HopAdviceEventRead]);
    return { status: 'created' as const, dossier: created.dossier as HopDecisionDossierRead,
      event: created.event as HopDecisionEventRead | HopAdviceEventRead };
  }
  async append(): Promise<never> { throw new Error('Append hors périmètre du test.'); }
  async read(ownerKey: string, dossierId: string) { return this.dossiers.get(this.key(ownerKey, dossierId)) ?? null; }
  async list(ownerKey: string) { return [...this.dossiers.values()].filter(row => row.ownerKey === ownerKey); }
  async readEvents(ownerKey: string, dossierId: string) { return structuredClone(this.events.get(this.key(ownerKey, dossierId)) ?? []); }
  close() { /* Memory fixture only. */ }
}

const productSource: HopSource = { kind: 'manufacturer', title: 'Fiche synthétique', author: 'Fixture', year: 2026,
  reference: 'https://fixture.invalid/product', locator: 'Donnée synthétique non commerciale.' };
const product: HopCommercialProduct = { id: 'fixture-product-q03', name: 'Produit synthétique', manufacturer: 'Fixture',
  form: 'pelletT90', supportedUses: ['boil'], source: productSource, reviewedOn: '2026-10-02', cautions: ['Synthèse de test.'] };

function journey(kind: 'products' | 'advice') {
  const ownerKey = `owner-${kind}-qualified-study`;
  const workspaceId = `workspace-${kind}-qualified-study`;
  const context = makeHopV55FixtureContext('unknown');
  const prepared = prepareBrewingScenarioContext(context);
  const question = kind === 'products' ? 'Comparer ce produit houblonné.' : 'Quelles stratégies comparer pour cette bière ?';
  const reading = readHopV55Question(question, prepared);
  const archive = createHopV55DecisionReadingArchiveV2({ id: `reading-${kind}`, ownerKey, workspaceId,
    recordedAt: '2026-10-02T10:00:00.000Z', reading, source: { kind: 'exploration' }, runtimeReference: `runtime-${kind}` });
  const study = kind === 'products'
    ? (() => {
      const result = answerQualifiedHopDecision({
        intent: { originalQuestion: question, interpretation: 'Étude produit de fixture.' },
        action: { kind: 'understandProducts', productIds: [product.id] },
        qualificationInput: { variants: [{ variantId: 'fixture-product-variant', scope: 'product', recordId: product.id,
          origin: { kind: 'seed' }, material: { id: product.id, name: product.name, form: product.form, product } }] },
      });
      if (result.kind !== 'calculated') throw new Error('Étude produit fixture calculée attendue.');
      return result;
    })()
    : answerQualifiedHopAdvice(makeHopAdviceJourneyFixture('planning'));
  const recordedAt = '2026-10-02T10:01:00.000Z';
  const createCommand = { kind, ownerKey, dossierId: `dossier-${kind}`, eventId: `event-${kind}`, recordedAt, study } as const;
  const advicePreparationContext = kind === 'advice'
    ? createHopV55QualifiedAdvicePreparationContextV1({ explicitFutureStage: {
      kind: 'futureExploration', stage: 'planning', basis: 'Le stade futur planning est explicitement déclaré dans la fixture.',
    } }) : undefined;
  const preparation = createHopV55QualifiedStudyPreparationV1({ id: `preparation-${kind}`, ownerKey, workspaceId,
    sourceReadingReference: archive.contentReference, preparedReference: `prepared-reference-${kind}`, createCommand,
    ...(advicePreparationContext ? { advicePreparationContext } : {}) });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: `Étude ${kind} de fixture`, intent: { question, criteria: [] }, decisionReadings: [archive],
    scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-02T10:00:00.000Z',
  };
  return { ownerKey, workspaceId, workspace, archive, preparation, study };
}

function repository(ownerKey: string) {
  return createHopV55WorkspaceRepository({ ownerKey, database: new MemoryDatabase() });
}

describe('Raccord CAS des études qualifiées produit et stratégie', () => {
  it.each(['products', 'advice'] as const)('prépare, crée et relie une étude %s sans fusionner les deux dépôts', async kind => {
    const row = journey(kind);
    const workspaces = repository(row.ownerKey);
    const domain = new MemoryQualifiedStudies();
    const opened = await workspaces.save(row.workspace, null);

    // La collection n’est pas une écriture autonome : un lien ne peut pas précéder son CAS de préparation.
    expect(() => appendHopV55QualifiedStudyLink(opened, row.preparation)).toThrow(/préparation/i);
    const saved = await saveHopV55QualifiedStudy({ workspaces, qualifiedStudies: domain,
      preparation: row.preparation, validateFreshness: async () => ({ status: 'current' }) });

    expect(saved.status).toBe('linked');
    expect(saved.repositoryStatus).toBe('created');
    expect(saved.freshContext).toEqual({ status: 'current' });
    expect(saved.link).toMatchObject({ ownerKey: row.ownerKey, workspaceId: row.workspaceId,
      sourceReadingReference: row.archive.contentReference, preparationReference: row.preparation.reference,
      dossierId: row.preparation.dossierId, eventId: row.preparation.eventId,
      kind, studyReference: row.preparation.studyReference });
    expect(saved.dossier).toMatchObject({ ownerKey: row.ownerKey, dossierId: row.preparation.dossierId,
      formatVersion: kind === 'products' ? 2 : 3 });
    expect(saved.events).toHaveLength(1);
    expect(saved.studySavedEvent).toMatchObject({ kind: 'studySaved', eventId: row.preparation.eventId,
      payload: { snapshotFormatVersion: kind === 'products' ? 2 : 3 } });
    expect(saved.workspace.qualifiedStudyPreparations?.[0]).toEqual(row.preparation);
    expect(saved.workspace.qualifiedStudyLinks?.[0]).toEqual(saved.link);
    if (kind === 'products') {
      expect((row.study as { actionKind: string }).actionKind).toBe('understandProducts');
      expect(row.preparation).not.toHaveProperty('advicePreparationContext');
    } else {
      expect(row.study).toMatchObject({ formatVersion: 3, kind: 'advice' });
      expect(saved.workspace.qualifiedStudyPreparations?.[0]).toMatchObject({ advicePreparationContext: {
        format: 'hop-v55-qualified-advice-preparation-context-v1', explicitFutureStage: {
          kind: 'futureExploration', stage: 'planning', basis: 'Le stade futur planning est explicitement déclaré dans la fixture.',
        },
      } });
      expect(row.preparation.createCommand).not.toHaveProperty('advicePreparationContext');
    }

    const reloaded = await workspaces.read(row.ownerKey, row.workspaceId);
    expect(reloaded?.qualifiedStudyLinks).toEqual([saved.link]);
    const retry = await saveHopV55QualifiedStudy({ workspaces, qualifiedStudies: domain,
      preparation: row.preparation, validateFreshness: async () => ({ status: 'current' }) });
    expect(retry.status).toBe('alreadyLinked');
    expect(retry.repositoryStatus).toBe('duplicate');
    expect(domain.createCalls).toBe(1);
    const changedCommand = createHopV55QualifiedStudyPreparationV1({ id: row.preparation.id,
      ownerKey: row.ownerKey, workspaceId: row.workspaceId, sourceReadingReference: row.archive.contentReference,
      preparedReference: 'changed-content-under-the-same-operation-id', createCommand: row.preparation.createCommand });
    await expect(saveHopV55QualifiedStudy({ workspaces, qualifiedStudies: domain,
      preparation: changedCommand, validateFreshness: async () => ({ status: 'current' }) }))
      .rejects.toMatchObject({ code: 'eventConflict' });
  });

  it('scelle le stade futur advice dans le workspace, le relit après reload et garde les V1 historiques sans champ', async () => {
    const row = journey('advice');
    const readContext = readHopV55QualifiedAdvicePreparationContextV1(row.preparation.advicePreparationContext);
    expect(readContext).toMatchObject({ status: 'available', context: {
      format: 'hop-v55-qualified-advice-preparation-context-v1', explicitFutureStage: {
        kind: 'futureExploration', stage: 'planning',
        basis: 'Le stade futur planning est explicitement déclaré dans la fixture.',
      },
    } });
    expect(readHopV55QualifiedStudyPreparation(row.preparation)).toEqual({ status: 'available', preparation: row.preparation });

    const historicWithoutContext = createHopV55QualifiedStudyPreparationV1({ id: 'preparation-advice-historical-v1',
      ownerKey: row.ownerKey, workspaceId: row.workspaceId, sourceReadingReference: row.archive.contentReference,
      preparedReference: 'prepared-reference-advice-historical', createCommand: row.preparation.createCommand });
    expect(historicWithoutContext).not.toHaveProperty('advicePreparationContext');
    expect(readHopV55QualifiedStudyPreparation(historicWithoutContext))
      .toEqual({ status: 'available', preparation: historicWithoutContext });

    const database = new MemoryDatabase();
    const workspaces = createHopV55WorkspaceRepository({ ownerKey: row.ownerKey, database });
    const opened = await workspaces.save(row.workspace, null);
    const prepared = await workspaces.save(appendHopV55QualifiedStudyPreparation(opened, row.preparation), opened.revision);
    const reloaded = await workspaces.read(row.ownerKey, row.workspaceId);
    expect(reloaded?.qualifiedStudyPreparations?.[0]).toEqual(row.preparation);
    expect(reloaded?.qualifiedStudyPreparations?.[0]).toMatchObject({ advicePreparationContext: {
      explicitFutureStage: { kind: 'futureExploration', stage: 'planning',
        basis: 'Le stade futur planning est explicitement déclaré dans la fixture.' },
    } });

    const changedContext = createHopV55QualifiedAdvicePreparationContextV1({ explicitFutureStage: {
      kind: 'futureExploration', stage: 'planning', basis: 'Motif différent sous la même préparation.' } });
    const changedPreparation = createHopV55QualifiedStudyPreparationV1({ id: row.preparation.id, ownerKey: row.ownerKey,
      workspaceId: row.workspaceId, sourceReadingReference: row.archive.contentReference,
      preparedReference: row.preparation.preparedReference, createCommand: row.preparation.createCommand,
      advicePreparationContext: changedContext });
    expect(changedPreparation.reference).not.toBe(row.preparation.reference);
    await expect(workspaces.save({ ...prepared, qualifiedStudyPreparations: [changedPreparation] }, prepared.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const tampered = structuredClone(row.preparation) as typeof row.preparation;
    if (!tampered.advicePreparationContext?.explicitFutureStage) throw new Error('Stade futur scellé attendu.');
    tampered.advicePreparationContext.explicitFutureStage.basis = 'Altéré sans reseal.';
    expect(() => readHopV55QualifiedStudyPreparation(tampered)).toThrow(/référence|scellée/i);
    expect(() => createHopV55QualifiedStudyPreparationV1({ id: 'preparation-products-with-stage', ownerKey: row.ownerKey,
      workspaceId: row.workspaceId, sourceReadingReference: row.archive.contentReference,
      preparedReference: 'prepared-products-stage', createCommand: journey('products').preparation.createCommand,
      advicePreparationContext: changedContext })).toThrow(/advice|produit/i);

    const wrongStage = createHopV55QualifiedAdvicePreparationContextV1({ explicitFutureStage: {
      kind: 'futureExploration', stage: 'fermenting', basis: 'Stade divergent pour cette réponse planning.',
    } });
    expect(() => createHopV55QualifiedStudyPreparationV1({ id: 'preparation-advice-wrong-stage', ownerKey: row.ownerKey,
      workspaceId: row.workspaceId, sourceReadingReference: row.archive.contentReference,
      preparedReference: 'prepared-wrong-stage', createCommand: row.preparation.createCommand,
      advicePreparationContext: wrongStage })).toThrow(/stade futur.*diffère/i);
  });

  it('refuse propriétaire étranger, archive absente et contenu de preparation ou lien altéré', async () => {
    const row = journey('products');
    const workspaces = repository(row.ownerKey);
    await expect(workspaces.save(appendHopV55QualifiedStudyPreparation(row.workspace, row.preparation), null))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const opened = await workspaces.save(row.workspace, null);
    await expect(workspaces.read('autre-owner', row.workspaceId)).rejects.toMatchObject({ code: 'ownerMismatch' });

    const foreignCommand = { ...row.preparation.createCommand, ownerKey: 'autre-owner',
      dossierId: 'dossier-other-owner', eventId: 'event-other-owner' };
    const wrongOwner = createHopV55QualifiedStudyPreparationV1({ id: 'preparation-other-owner', ownerKey: 'autre-owner',
      workspaceId: row.workspaceId, sourceReadingReference: row.archive.contentReference,
      preparedReference: 'prepared-reference-other-owner', createCommand: foreignCommand });
    expect(() => appendHopV55QualifiedStudyPreparation(opened, wrongOwner)).toThrow(/owner/i);

    const noArchive = { ...opened, decisionReadings: [] };
    expect(() => appendHopV55QualifiedStudyPreparation(noArchive as HopV55Workspace, row.preparation)).toThrow(/archive/i);

    const freshWorkspaces = repository(row.ownerKey);
    const noReadingYet = await freshWorkspaces.save({ ...row.workspace, decisionReadings: [] }, null);
    await expect(freshWorkspaces.save({ ...noReadingYet, decisionReadings: [row.archive],
      qualifiedStudyPreparations: [row.preparation] }, noReadingYet.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const preparationTamper = structuredClone(row.preparation) as typeof row.preparation;
    preparationTamper.createCommand.study = { ...preparationTamper.createCommand.study, reference: 'tampered' } as never;
    expect(() => readHopV55QualifiedStudyPreparation(preparationTamper)).toThrow();
    const goodPrep = appendHopV55QualifiedStudyPreparation(opened, row.preparation);
    const withPrep = await workspaces.save(goodPrep, opened.revision);
    const malformedLink = { ...withPrep, qualifiedStudyLinks: [{ ...row.preparation, format: 'hop-v55-qualified-study-link-v1' }] } as unknown as HopV55Workspace;
    await expect(workspaces.save(malformedLink, withPrep.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const validLink = appendHopV55QualifiedStudyLink(withPrep, row.preparation).qualifiedStudyLinks?.[0];
    const linkTamper = { ...validLink!, studyReference: 'other-study' };
    expect(() => readHopV55QualifiedStudyLink(linkTamper)).toThrow();
  });

  it('un CAS concurrent pendant le lien garde la préparation/dossier exacts et ne relance pas create', async () => {
    const row = journey('advice');
    const base = repository(row.ownerKey);
    const opened = await base.save(row.workspace, null);
    const domain = new MemoryQualifiedStudies();
    let calls = 0;
    let raced = false;
    const workspaces = {
      read: base.read.bind(base),
      async save(workspace: HopV55Workspace, expectedRevision: number | null) {
        calls++;
        if (!raced && calls === 2) {
          raced = true;
          const current = await base.read(row.ownerKey, row.workspaceId);
          if (!current) throw new Error('Workspace concurrent attendu.');
          await base.save({ ...current, title: 'Modification concurrente conservée' }, current.revision);
        }
        return base.save(workspace, expectedRevision);
      },
    };
    const saved = await saveHopV55QualifiedStudy({ workspaces, qualifiedStudies: domain,
      preparation: row.preparation, validateFreshness: async ({ phase }) => ({ status: phase === 'beforeLink' && raced ? 'historical' : 'current',
        ...(phase === 'beforeLink' && raced ? { reason: 'Le contexte a changé pendant l’écriture.' } : {}) }) });
    expect(saved.status).toBe('recoveredHistorical');
    expect(saved.freshContext).toEqual({ status: 'historical', reason: 'Le contexte a changé pendant l’écriture.' });
    expect(saved.workspace.title).toBe('Modification concurrente conservée');
    expect(saved.link.studyReference).toBe(row.preparation.studyReference);
    expect(domain.createCalls).toBe(1);
    expect(calls).toBe(3);
  });

  it('refuse la création si la lecture n’est plus actuelle, mais conserve la préparation exacte', async () => {
    const row = journey('products');
    const workspaces = repository(row.ownerKey);
    await workspaces.save(row.workspace, null);
    const domain = new MemoryQualifiedStudies();
    await expect(saveHopV55QualifiedStudy({ workspaces, qualifiedStudies: domain,
      preparation: row.preparation, validateFreshness: async () => ({ status: 'historical', reason: 'Lecture dépassée.' }) }))
      .rejects.toMatchObject({ code: 'staleRevision' });
    const savedWorkspace = await workspaces.read(row.ownerKey, row.workspaceId);
    expect(savedWorkspace?.qualifiedStudyPreparations?.[0]).toEqual(row.preparation);
    expect(savedWorkspace?.qualifiedStudyLinks).toBeUndefined();
    expect(domain.createCalls).toBe(0);
  });

  it('reprend après commit du dossier domaine interrompu avant le CAS de lien, sans recréer ni requalifier', async () => {
    const row = journey('advice');
    const base = repository(row.ownerKey);
    await base.save(row.workspace, null);
    const domain = new MemoryQualifiedStudies();
    let interruptLink = true;
    const interrupted = {
      read: base.read.bind(base),
      async save(workspace: HopV55Workspace, expectedRevision: number | null) {
        if (interruptLink && (workspace.qualifiedStudyLinks?.length ?? 0) > 0) {
          interruptLink = false;
          throw new Error('interruption après commit domaine');
        }
        return base.save(workspace, expectedRevision);
      },
    };
    await expect(saveHopV55QualifiedStudy({ workspaces: interrupted, qualifiedStudies: domain,
      preparation: row.preparation, validateFreshness: async () => ({ status: 'current' }) }))
      .rejects.toThrow('interruption après commit domaine');
    expect(domain.createCalls).toBe(1);
    const pending = await base.read(row.ownerKey, row.workspaceId);
    expect(pending?.qualifiedStudyPreparations).toEqual([row.preparation]);
    expect(pending?.qualifiedStudyLinks).toBeUndefined();

    const recovered = await saveHopV55QualifiedStudy({ workspaces: base, qualifiedStudies: domain,
      preparation: row.preparation, validateFreshness: async () => ({ status: 'historical', reason: 'La lecture est conservée pour archive.' }) });
    expect(recovered.status).toBe('recoveredHistorical');
    expect(recovered.repositoryStatus).toBe('duplicate');
    expect(recovered.freshContext).toEqual({ status: 'historical', reason: 'La lecture est conservée pour archive.' });
    expect(recovered.events).toHaveLength(1);
    expect(recovered.studySavedEvent.eventId).toBe(row.preparation.eventId);
    expect(domain.createCalls).toBe(1);
  });

  it('préserve les records futurs bruts et bloque un writer courant sur la même lecture', async () => {
    const row = journey('products');
    const future = { format: 'hop-v55-qualified-study-preparation-v99', id: 'preparation-future',
      ownerKey: row.ownerKey, workspaceId: row.workspaceId, sourceReadingReference: row.archive.contentReference,
      sourcePayload: { preserveExactly: ['v99', 42, null], optionalUndefined: undefined } };
    const database = new MemoryDatabase();
    const historicalWorkspace = { ...row.workspace, revision: 1, qualifiedStudyPreparations: [future] };
    database.workspaces.rows.set(JSON.stringify([row.ownerKey, row.workspaceId]), {
      format: 'hop-v55-workspace-envelope-v1', ownerKey: row.ownerKey, workspaceId: row.workspaceId,
      revision: 1, workspace: historicalWorkspace,
    });
    const workspaces = createHopV55WorkspaceRepository({ ownerKey: row.ownerKey, database });
    const opened = await workspaces.read(row.ownerKey, row.workspaceId);
    if (!opened) throw new Error('Workspace historique seedé attendu.');
    const withFuture = await workspaces.save({ ...opened, title: 'Lecture de format futur' }, opened.revision);
    expect(withFuture.qualifiedStudyPreparations?.[0]).toEqual(future);
    const unrelated = await workspaces.save({ ...withFuture, title: 'Édition hors historique d’étude' }, withFuture.revision);
    expect(unrelated.qualifiedStudyPreparations?.[0]).toEqual(future);
    expect(() => appendHopV55QualifiedStudyPreparation(unrelated, row.preparation)).toThrow(/future|lecture/i);
  });
});
