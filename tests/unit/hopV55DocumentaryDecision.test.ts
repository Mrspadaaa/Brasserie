import { describe, expect, it, vi } from 'vitest';
import * as documentaryDomain from '../../src/domain/hopDecision/documentaryAnswer';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import { applyHopV55DecisionCriteriaCorrection } from '../../src/services/hopV55/decisionCorrection';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import {
  buildHopV55DocumentaryAnswerRecord,
  createHopV55DocumentaryDossierRecord,
  prepareHopV55DocumentaryRequest,
  readHopV55DocumentaryAnswerRecord,
  readHopV55DocumentaryDossierRecord,
  resumeHopV55DocumentaryRequestDraft,
  reviseHopV55DocumentaryRequest,
} from '../../src/services/hopV55/documentaryDecision';

function fixture(mode: 'planning' | 'nolo' = 'planning', style?: string) {
  const context = makeHopV55FixtureContext(mode);
  if (style && context.recipe) context.recipe.style = style;
  const prepared = prepareBrewingScenarioContext(context);
  return { context, prepared };
}

function read(question: string, prepared: ReturnType<typeof fixture>['prepared']): HopV55QuestionReading {
  return readHopV55Question(question, prepared);
}

function withPairingRole(reading: HopV55QuestionReading): HopV55QuestionReading {
  const updated = structuredClone(reading);
  if (!updated.response || !updated.response.intent.criteria?.length) throw new Error('La fixture exige un critère explicite.');
  const first = updated.response.intent.criteria[0];
  updated.response.intent.criteria = [{ ...first, role: 'pairWith', partner: { kind: 'freeContext', text: 'Banane, préférence utilisateur explicitement rapportée.' } }];
  return updated;
}

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    const pair = Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
    ];
    return JSON.stringify(pair);
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
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const snapshot = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
    try { return await work(); }
    catch (error) { this.workspaces.rows = snapshot; throw error; }
  }
  close() { /* Local in-memory repository fixture. */ }
}

describe('raccord V5.5 vers la réponse documentaire SYNTH01', () => {
  it('conserve la question et les critères; propose le besoin sucrosité depuis le critère, jamais depuis le nom de style', () => {
    const question = 'Ma bière est trop sucrée. Quel équilibre le houblon peut-il examiner ?';
    const { prepared } = fixture('planning', 'Pastry Stout');
    const reading = read(question, prepared);
    const beforeReading = structuredClone(reading);
    const draft = prepareHopV55DocumentaryRequest({ reading, prepared, requestId: 'request:sweetness', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:source:sweetness' });

    expect(draft.request.originalQuestion).toBe(question);
    expect(draft.request.criteria).toEqual(reading.response?.intent.criteria);
    expect(draft.request.needs).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'balancePerceivedSweetness', criterionIds: [reading.response!.intent.criteria![0].id] }),
    ]));
    expect(draft.request.context.stage).toBe(prepared.runtime.current?.program?.stage);
    expect(draft.request.context.access.bulkBeer).toMatchObject({ state: 'unknown', assertionIds: [] });
    expect(draft.request.context.access.sampling).toMatchObject({ state: 'unknown', assertionIds: [] });
    expect(draft.request.context.access.separatePortion).toMatchObject({ state: 'unknown', assertionIds: [] });
    expect(draft.request.materials).toEqual(prepared.runtime.materials);
    expect(draft.request.materials.every(material => material.id !== 'documentary:hopsteiner-exi-30')).toBe(true);
    expect(reading).toEqual(beforeReading);

    const { prepared: otherContext } = fixture('planning', 'Champagne');
    const other = prepareHopV55DocumentaryRequest({ reading, prepared: otherContext, requestId: 'request:sweetness-other-style',
      ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:source:sweetness' });
    expect(other.request.needs.map(need => need.kind)).toEqual(draft.request.needs.map(need => need.kind));

    const constrainedRequest = structuredClone(draft.request);
    const sweetCriterionId = constrainedRequest.criteria[0].id;
    constrainedRequest.exclusions = [{ id: 'user-no-bitterness-change', intervention: 'changeBitterness', certainty: 'certain',
      criterionIds: [sweetCriterionId], reason: 'Contrainte explicitement reliée au critère sélectionné.' }];
    const constrainedDraft = reviseHopV55DocumentaryRequest({ draft, request: constrainedRequest });
    const constrainedAnswer = buildHopV55DocumentaryAnswerRecord({ draft: constrainedDraft, prepared, answerRecordId: 'answer:sweetness-constrained' });
    const bitterRoute = constrainedAnswer.answerSnapshot.routes.find(route => route.intervention === 'changeBitterness')!;
    expect(bitterRoute.applicability.status).toBe('incompatible');
    expect(bitterRoute.applicability.conditions).toEqual(expect.arrayContaining([
      expect.objectContaining({ state: 'unmet', criterionIds: [sweetCriterionId] }),
    ]));
  });

  it('propose NOLO depuis le domaine explicite et laisse une association sans partenaire comme unresolved', () => {
    const { prepared: noloPrepared } = fixture('nolo');
    const noloReading = read('Je cherche des leviers pour soutenir le fruité.', noloPrepared);
    const noloDraft = prepareHopV55DocumentaryRequest({ reading: noloReading, prepared: noloPrepared, requestId: 'request:nolo',
      ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:nolo' });
    expect(noloDraft.request.needs).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'lowAlcoholCharacter', criterionIds: [], explanation: expect.stringMatching(/proposition contextuelle.*nolo/i) }),
      expect.objectContaining({ kind: 'unresolved', criterionIds: expect.arrayContaining([noloReading.response!.intent.criteria![0].id]) }),
    ]));

    const { prepared } = fixture('planning');
    const pairingReading = withPairingRole(read('Plus de tropical.', prepared));
    const pairingDraft = prepareHopV55DocumentaryRequest({ reading: pairingReading, prepared, requestId: 'request:pairing',
      ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:pairing' });
    const pairing = pairingDraft.request.needs.find(need => need.kind === 'aromaPairing');
    expect(pairing).toMatchObject({ candidateIds: [], criterionIds: [pairingReading.response!.intent.criteria![0].id] });
    expect(pairingReading.response!.intent.criteria![0].partner).toEqual({
      kind: 'freeContext', text: 'Banane, préférence utilisateur explicitement rapportée.',
    });
    const noImplicitAll = structuredClone(pairingDraft.request);
    delete noImplicitAll.needs[0].candidateIds;
    const normalized = reviseHopV55DocumentaryRequest({ draft: pairingDraft, request: noImplicitAll });
    expect(normalized.request.needs[0].candidateIds).toEqual([]);
  });

  it('relie une préférence de partenaire explicitement formulée et garde les mentions NOLO contextualisées', async () => {
    const { prepared } = fixture('planning');
    const question = 'Je veux une blanche ultra tropicale qui se marie bien avec mon goût de banane.';
    const reading = read(question, prepared);
    const sourceArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:banana-pairing', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', recordedAt: '2026-10-03T08:00:00.000Z', reading,
      source: { kind: 'exploration' }, runtimeReference: 'runtime:banana-pairing' });
    const sourceArchiveBefore = structuredClone(sourceArchive);
    const archiveRead = readHopV55DecisionReadingArchive(sourceArchive);
    expect(archiveRead.status).toBe('available');
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw new Error('La lecture V2 source doit être relue avant le raccord documentaire.');
    }
    const draft = prepareHopV55DocumentaryRequest({ reading: archiveRead.archive.reading, prepared, requestId: 'request:banana-pairing', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', sourceReadingReference: sourceArchive.contentReference });
    expect(draft.sourceReadingReference).toBe(sourceArchive.contentReference);

    expect(reading.intent.question).toBe(question);
    const sourceCriterion = reading.response!.intent.criteria!.find(row => row.familyId === 'tropical')!;
    const pairingCriterion = draft.request.criteria.find(row => row.role === 'pairWith')!;
    expect(pairingCriterion).toMatchObject({ origin: 'proposal', familyId: 'tropical', partner: { kind: 'freeContext', text: 'mon goût de banane' } });
    expect(pairingCriterion.description).toBe('tropicale qui se marie bien avec mon goût de banane');
    const pairingNeed = draft.request.needs.find(row => row.kind === 'aromaPairing')!;
    expect(pairingNeed.criterionIds).toEqual([sourceCriterion.id, pairingCriterion.id]);
    expect(pairingNeed.candidateIds).toEqual([]);
    expect(draft.request.needs.some(row => row.kind === 'unresolved')).toBe(false);
    expect(draft.request.originalQuestion).toBe(question);
    expect(sourceArchive).toEqual(sourceArchiveBefore);

    const answerRecord = buildHopV55DocumentaryAnswerRecord({ draft, prepared, answerRecordId: 'answer:banana-pairing' });
    const answer = answerRecord.answerSnapshot;
    expect(answerRecord.sourceReadingReference).toBe(sourceArchive.contentReference);
    expect(answer.requestSnapshot.criteria.find(row => row.id === pairingCriterion.id)?.partner).toEqual(pairingCriterion.partner);
    expect(answer.coverage.points).toEqual(expect.arrayContaining([
      expect.objectContaining({ needId: pairingNeed.id, status: 'answered' }),
    ]));
    expect(answer.arguments.some(row => row.criterionIds.includes(pairingCriterion.id))).toBe(true);
    const pairingRoute = answer.routes.find(row => row.needIds.includes(pairingNeed.id))!;
    expect(pairingRoute.materialIds).toEqual([]);
    expect(pairingRoute.preparation.missingRequirements.join(' ')).toMatch(/Matières.*protocole/i);
    const dossier = createHopV55DocumentaryDossierRecord({ answerRecord, dossierId: 'dossier:banana-pairing',
      expectedAnswerReference: answerRecord.answerReference, expectedInterpretationReference: answer.interpretationReference,
      routeId: pairingRoute.id, expectedRouteReference: pairingRoute.reference,
      motive: 'Conserver cette proposition de recherche d’accord avec son partenaire cité.',
      createdAt: '2026-10-03T08:01:00.000Z', createdBy: { origin: 'fixture', label: 'Fixture locale' } });
    expect(dossier.dossierSnapshot.answerSnapshot.requestSnapshot.criteria.find(row => row.id === pairingCriterion.id)?.partner)
      .toEqual(pairingCriterion.partner);
    expect(dossier.sourceReadingReference).toBe(sourceArchive.contentReference);
    expect(readHopV55DocumentaryDossierRecord(structuredClone(dossier))).toMatchObject({ status: 'readOnly', record: dossier });
    expect(sourceArchive).toEqual(sourceArchiveBefore);

    const workspace: HopV55Workspace = {
      format: 'hop-v55-workspace-v1', id: 'workspace:fixture', ownerKey: 'owner:fixture', revision: 0,
      title: 'Q08 local V2 pairing fixture', intent: structuredClone(reading.intent), decisionReadings: [sourceArchive],
      scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-03T08:00:00.000Z',
    };
    const repository = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database: new MemoryDatabase() });
    const opened = await repository.save(workspace, null);
    const savedAnswer = await repository.save({ ...opened, documentaryAnswers: [answerRecord] }, opened.revision);
    const savedDossier = await repository.save({ ...savedAnswer, documentaryDossiers: [dossier] }, savedAnswer.revision);
    expect(savedAnswer.decisionReadings?.[0].contentReference).toBe(sourceArchive.contentReference);
    expect(savedAnswer.documentaryAnswers?.[0].answerSnapshot.requestSnapshot.criteria.find(row => row.id === pairingCriterion.id)?.partner)
      .toEqual(pairingCriterion.partner);
    expect(savedDossier.documentaryDossiers?.[0].sourceReadingReference).toBe(sourceArchive.contentReference);
    expect(savedDossier.documentaryDossiers?.[0].dossierSnapshot.answerSnapshot.requestSnapshot.criteria.find(row => row.id === pairingCriterion.id)?.partner)
      .toEqual(pairingCriterion.partner);

    const relationRemovedDrafts = structuredClone(reading.criterionDrafts);
    relationRemovedDrafts.find(row => row.term === 'banane')!.qualification = 'Annotation corrigée, sans relation de partenaire.';
    const relationRemoved = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: relationRemovedDrafts, prepared,
      sourceReadingReference: sourceArchive.contentReference, recordedAt: '2026-10-03T08:02:00.000Z' });
    const relationRemovedArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:banana-pairing-corrected', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', recordedAt: '2026-10-03T08:02:00.000Z', reading: relationRemoved,
      source: { kind: 'exploration' }, runtimeReference: 'runtime:banana-pairing' });
    const relationRemovedRead = readHopV55DecisionReadingArchive(relationRemovedArchive);
    expect(relationRemovedRead.status).toBe('available');
    if (relationRemovedRead.status !== 'available') throw new Error('La lecture corrigée doit rester relisible.');
    const correctedRequest = prepareHopV55DocumentaryRequest({ reading: relationRemovedRead.archive.reading, prepared,
      requestId: 'request:banana-pairing-corrected', ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture',
      sourceReadingReference: relationRemovedArchive.contentReference });
    expect(correctedRequest.request.criteria.some(row => row.role === 'pairWith')).toBe(false);
    expect(correctedRequest.request.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: sourceCriterion.id, role: 'seek', familyId: 'tropical' }),
    ]));

    const targetAvoidDrafts = structuredClone(reading.criterionDrafts);
    targetAvoidDrafts.find(row => row.term === 'tropicale')!.direction = 'exclude';
    const targetAvoid = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: targetAvoidDrafts, prepared,
      sourceReadingReference: sourceArchive.contentReference, recordedAt: '2026-10-03T08:03:00.000Z' });
    const targetAvoidArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:banana-target-avoided', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', recordedAt: '2026-10-03T08:03:00.000Z', reading: targetAvoid,
      source: { kind: 'exploration' }, runtimeReference: 'runtime:banana-pairing' });
    const targetAvoidArchiveRead = readHopV55DecisionReadingArchive(targetAvoidArchive);
    expect(targetAvoidArchiveRead.status).toBe('available');
    if (targetAvoidArchiveRead.status !== 'available') throw new Error('La correction du critère cible doit rester relisible.');
    const targetAvoidRequest = prepareHopV55DocumentaryRequest({ reading: targetAvoidArchiveRead.archive.reading, prepared,
      requestId: 'request:banana-target-avoided', ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture',
      sourceReadingReference: targetAvoidArchive.contentReference });
    expect(targetAvoidRequest.request.criteria.some(row => row.role === 'pairWith')).toBe(false);
    expect(targetAvoidRequest.request.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: sourceCriterion.id, role: 'avoid', familyId: 'tropical' }),
    ]));

    const { prepared: noloPrepared } = fixture('nolo');
    const noloQuestion = 'Dans cette bière sans alcool, quelles pistes documentaires peuvent accompagner une note de banane, et quelles limites empêchent de transférer directement une biotransformation observée en bière alcoolisée ?';
    const noloReading = read(noloQuestion, noloPrepared);
    const noloDraft = prepareHopV55DocumentaryRequest({ reading: noloReading, prepared: noloPrepared, requestId: 'request:nolo-transfer-limits',
      ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:nolo-transfer-limits' });
    const biologyCriterion = noloDraft.request.criteria.find(row => /biotransformation/i.test(row.description))!;
    expect(biologyCriterion.role).toBe('observation');
    expect(noloDraft.request.needs).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'lowAlcoholCharacter', criterionIds: expect.arrayContaining([biologyCriterion.id]) }),
    ]));
    expect(noloDraft.request.needs.some(row => row.kind === 'unresolved' && row.criterionIds.includes(biologyCriterion.id))).toBe(false);
    expect(noloDraft.request.criteria.some(row => row.role === 'avoid' && /alcool|biotransformation|banane/i.test(row.description))).toBe(false);
    expect(noloDraft.request.originalQuestion).toBe(noloQuestion);
    const noloAnswer = buildHopV55DocumentaryAnswerRecord({ draft: noloDraft, prepared: noloPrepared, answerRecordId: 'answer:nolo-transfer-limits' }).answerSnapshot;
    expect(noloAnswer.requestSnapshot.needs.find(row => row.kind === 'lowAlcoholCharacter')?.criterionIds).toContain(biologyCriterion.id);
    expect(noloAnswer.body.some(row => /transfert|biotransformation|levure/i.test(row.text))).toBe(true);

    const noGuaranteeQuestion = 'Dans cette bière sans alcool, sans garantir une biotransformation, quelles limites documentaires faut-il examiner ?';
    const noGuaranteeReading = read(noGuaranteeQuestion, noloPrepared);
    const noGuaranteeDraft = prepareHopV55DocumentaryRequest({ reading: noGuaranteeReading, prepared: noloPrepared,
      requestId: 'request:nolo-no-guarantee', ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture',
      sourceReadingReference: 'reading:nolo-no-guarantee' });
    const noGuaranteeCriterion = noGuaranteeDraft.request.criteria.find(row => /biotransformation/i.test(row.description))!;
    expect(noGuaranteeReading.criterionDrafts.find(row => /biotransformation/i.test(row.term))).toMatchObject({
      direction: 'investigate', requirement: 'required',
    });
    expect(noGuaranteeDraft.request.needs).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'lowAlcoholCharacter', criterionIds: expect.arrayContaining([noGuaranteeCriterion.id]) }),
    ]));
    expect(noGuaranteeDraft.request.exclusions).toEqual([]);
    expect(noGuaranteeDraft.request.criteria.some(row => row.role === 'avoid' && /biotransformation/i.test(row.description))).toBe(false);
  });

  it('permet de corriger accès et candidat exacts, construit un answer record canonical et ne fabrique aucune matière ISO', () => {
    const { prepared } = fixture('planning');
    const reading = withPairingRole(read('Plus de tropical.', prepared));
    const sourceReadingReference = 'reading:source:pairing';
    const draft = prepareHopV55DocumentaryRequest({ reading, prepared, requestId: 'request:pairing-edit', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', sourceReadingReference });
    const request = structuredClone(draft.request);
    const need = request.needs.find(row => row.kind === 'aromaPairing')!;
    need.candidateIds = ['variety:hop-v55-fixture-identity-a'];
    request.context.assertions.push({ id: 'user-access-portion', subject: 'separatePortion',
      statement: 'Le brasseur déclare une portion séparée accessible pour cette étude.', state: 'reported', value: true, dimension: 'process' });
    request.context.access.separatePortion = { state: 'yes', basis: 'Déclaration explicite de la portion séparée.', assertionIds: ['user-access-portion'] };
    const revised = reviseHopV55DocumentaryRequest({ draft, request });

    expect(revised.reference).not.toBe(draft.reference);
    expect(revised.request.originalQuestion).toBe(draft.request.originalQuestion);
    expect(revised.request.criteria).toEqual(draft.request.criteria);
    expect(revised.request.materials).toEqual(prepared.runtime.materials);
    expect(revised.request.needs.find(row => row.id === need.id)?.candidateIds).toEqual(['variety:hop-v55-fixture-identity-a']);

    const record = buildHopV55DocumentaryAnswerRecord({ draft: revised, prepared, answerRecordId: 'answer:pairing' });
    expect(record).toMatchObject({ ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture', sourceReadingReference,
      answerReference: record.answerSnapshot.reference });
    expect(record.answerSnapshot.requestSnapshot.materials).toEqual(prepared.runtime.materials);
    expect(record.answerSnapshot.requestSnapshot.materials.some(material => material.id.includes('hopsteiner-exi'))).toBe(false);
    expect(record.answerSnapshot.requestSnapshot.needs.find(row => row.id === need.id)?.candidateIds)
      .toEqual(['variety:hop-v55-fixture-identity-a']);
    expect(record.answerSnapshot.requestSnapshot.context.access.separatePortion).toMatchObject({ state: 'yes', assertionIds: ['user-access-portion'] });
    const resumedDraft = resumeHopV55DocumentaryRequestDraft(record);
    expect(resumedDraft.reference).toBe(record.requestDraftReference);
    expect(resumedDraft.request).toEqual(record.answerSnapshot.requestSnapshot);

    const staleCandidateRequest = structuredClone(draft.request);
    staleCandidateRequest.needs.find(row => row.kind === 'aromaPairing')!.candidateIds = ['variety:not-loaded'];
    const staleDraft = reviseHopV55DocumentaryRequest({ draft, request: staleCandidateRequest });
    const staleRecord = buildHopV55DocumentaryAnswerRecord({ draft: staleDraft, prepared, answerRecordId: 'answer:missing-candidate' });
    expect(staleRecord.answerSnapshot.coverage.status).toBe('partial');
    expect(staleRecord.answerSnapshot.requestSnapshot.needs.find(row => row.kind === 'aromaPairing')?.candidateIds)
      .toEqual(['variety:not-loaded']);
    expect(staleRecord.answerSnapshot.requestSnapshot.materials).toEqual(prepared.runtime.materials);
    expect(staleRecord.answerSnapshot.routes.every(route => !route.materialIds.includes('variety:not-loaded'))).toBe(true);

    const canonicalBuilder = vi.spyOn(documentaryDomain, 'buildHopDocumentaryAnswer');
    try {
      expect(readHopV55DocumentaryAnswerRecord(structuredClone(record))).toMatchObject({ status: 'readOnly', record });
      expect(canonicalBuilder).not.toHaveBeenCalled();
    } finally {
      canonicalBuilder.mockRestore();
    }
    expect(() => buildHopV55DocumentaryAnswerRecord({ draft: revised, prepared: { ...prepared,
      runtime: { ...prepared.runtime, materials: prepared.runtime.materials.slice(1) } }, answerRecordId: 'answer:stale' }))
      .toThrow(/contexte préparé a changé/i);
    expect(() => reviseHopV55DocumentaryRequest({ draft, request: { ...request, originalQuestion: 'texte altéré' } }))
      .toThrow(/question, les critères/i);
  });

  it('lie le dossier aux références canoniques attendues et conserve les dossiers futurs en lecture seule', () => {
    const { prepared } = fixture('planning');
    const reading = read('Ma bière est trop sucrée; quel équilibre peut être examiné ?', prepared);
    const draft = prepareHopV55DocumentaryRequest({ reading, prepared, requestId: 'request:dossier', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:dossier' });
    const answerRecord = buildHopV55DocumentaryAnswerRecord({ draft, prepared, answerRecordId: 'answer:dossier' });
    const route = answerRecord.answerSnapshot.routes[0];
    expect(route).toBeDefined();
    const dossierRecord = createHopV55DocumentaryDossierRecord({ answerRecord, dossierId: 'dossier:sweetness',
      expectedAnswerReference: answerRecord.answerReference,
      expectedInterpretationReference: answerRecord.answerSnapshot.interpretationReference,
      routeId: route.id, expectedRouteReference: route.reference, motive: 'Comparer cette voie documentaire.',
      createdAt: '2026-10-02T20:00:00.000Z', createdBy: { origin: 'user', label: 'Brasseur' } });
    expect(dossierRecord).toMatchObject({ ownerKey: answerRecord.ownerKey, workspaceId: answerRecord.workspaceId,
      sourceReadingReference: answerRecord.sourceReadingReference, answerRecordReference: answerRecord.reference,
      answerReference: answerRecord.answerReference, dossierReference: dossierRecord.dossierSnapshot.reference });
    expect(readHopV55DocumentaryDossierRecord(structuredClone(dossierRecord))).toMatchObject({ status: 'readOnly', record: dossierRecord });
    expect(() => createHopV55DocumentaryDossierRecord({ answerRecord, dossierId: 'dossier:stale',
      expectedAnswerReference: 'changed', expectedInterpretationReference: answerRecord.answerSnapshot.interpretationReference,
      routeId: route.id, expectedRouteReference: route.reference, motive: 'Motif.', createdAt: '2026-10-02T20:00:00.000Z',
      createdBy: { origin: 'user', label: 'Brasseur' } })).toThrow(/périmée/i);
    const future = { format: 'hop-v55-documentary-dossier-record-v9', ownerKey: 'owner', opaque: true };
    expect(readHopV55DocumentaryDossierRecord(future)).toEqual({ status: 'unsupportedReadOnly', snapshot: future, reason: expect.any(String) });
  });

  it('scelle la provenance de réinterprétation dans l’enveloppe sans la verser dans les faits ou l’interprétation', () => {
    const { prepared } = fixture('planning');
    const reading = read('Ma bière est trop sucrée; quel équilibre peut être examiné ?', prepared);
    const draft = prepareHopV55DocumentaryRequest({ reading, prepared, requestId: 'request:revision', ownerKey: 'owner:fixture',
      workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:revision' });
    const source = buildHopV55DocumentaryAnswerRecord({ draft, prepared, answerRecordId: 'answer:revision-source' });
    const revisionContext = { sourceAnswerRecordReference: source.reference, sourceAnswerReference: source.answerReference,
      reason: 'Comparer cette reformulation avec les besoins déjà conservés.', recordedAt: '2026-10-02T21:00:00.000Z',
      recordedBy: { origin: 'user' as const, label: 'Brasseur' } };
    const revised = buildHopV55DocumentaryAnswerRecord({ draft, prepared, answerRecordId: 'answer:revision-next', revisionContext });

    expect(revised.revisionContext).toEqual(revisionContext);
    expect(revised.answerSnapshot.requestSnapshot).toEqual(source.answerSnapshot.requestSnapshot);
    expect(revised.answerSnapshot.requestSnapshot.context.assertions).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.stringContaining('revision'), statement: revisionContext.reason }),
    ]));
    expect(revised.answerSnapshot.requestSnapshot.interpretation).toEqual(source.answerSnapshot.requestSnapshot.interpretation);
    const canonicalBuilder = vi.spyOn(documentaryDomain, 'buildHopDocumentaryAnswer');
    try {
      expect(readHopV55DocumentaryAnswerRecord(structuredClone(revised))).toMatchObject({
        status: 'readOnly', record: { revisionContext },
      });
      expect(canonicalBuilder).not.toHaveBeenCalled();
    } finally {
      canonicalBuilder.mockRestore();
    }
    const malformed = structuredClone(revised);
    malformed.revisionContext!.reason = '';
    expect(() => readHopV55DocumentaryAnswerRecord(malformed)).toThrow(/reason/i);
  });
});
