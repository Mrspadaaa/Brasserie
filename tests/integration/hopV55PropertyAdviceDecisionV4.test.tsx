import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import type { HopV55PropertyAdviceAnswerRecordV4, HopV55PropertyAdviceDossierRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import type { HopV55PropertyAdviceV4CorrectionRequest, HopV55PropertyAdviceV4DossierRequest } from '../../src/ui/hopV55/propertyAdviceV4UiContracts';
import {
  HopV55PropertyAdviceDecisionV4,
  verifyDossierResultV4,
  verifyRecordResultV4,
  type V4RecordExpectation,
} from '../../src/ui/hopV55/PropertyAdviceDecisionV4';

/*
 * Contre-épreuves UI02 de la façade V4. Les fixtures sont des enregistrements de forme V4 construits à la main :
 * le composant ne recalcule aucun sceau, il compare des structures. Le parent simulé (`applyCorrection`) reproduit
 * le contrat Prep/Records : registre append-only, motifs exacts, issue domainAnswer | allRejected.
 */
type AnswerRecord = HopV55PropertyAdviceAnswerRecordV4;
type DossierRecord = HopV55PropertyAdviceDossierRecordV4;
type Entry = AnswerRecord['ledger']['entries'][number];
type Intent = HopPropertyAdviceIntentV3;
type ReadingContext = AnswerRecord['readingContext'];
type CorrectionRequest = HopV55PropertyAdviceV4CorrectionRequest;
type DossierRequest = HopV55PropertyAdviceV4DossierRequest;

const Q = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
const AT = '2026-10-03T10:00:00.000Z';
const USER = { origin: 'user' as const, label: 'Brasseur' };
const PROPOSAL = { origin: 'proposal' as const, label: 'Lecteur de la question' };
const PRESET_LIAISON = 'Mot de liaison ou de construction, pas un terme de ma bière';
const PRESET_CONTRESENS = 'Contresens : la question dit autre chose';
const PRESET_HORS_SUJET = 'Hors sujet pour cette question';
const SUCCESS = 'Nouvelle lecture conservée. La version précédente reste consultable dans les versions.';

function span(text: string) {
  const start = Q.indexOf(text);
  if (start < 0) throw new Error(`Fragment absent : ${text}`);
  return { start, end: start + text.length, text };
}

function intent(id: string, label: string, patch: Partial<Intent> = {}): Intent {
  return { id, property: 'unresolved', label, role: 'investigation', direction: 'investigate', qualification: null, required: true,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified',
    subject: { kind: 'beer', label: 'Ma bière', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [span(label)], interpretationOrigin: 'proposal', basis: `Lu dans « ${label} ».`, relatedIntentIds: [], ...patch };
}

const douce = intent('a-douce', 'douce', { property: 'sweetness', role: 'reportedObservation', direction: null, metric: 'sensory',
  comparisonBasis: { kind: 'current', assertionIds: [] } });
const si = intent('a-si', 'si');
const compenser = intent('a-compenser', 'compenser', { property: 'sweetness', metric: 'sensory', relatedIntentIds: ['a-douce'],
  investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: ['a-douce'] } });
const augmenter = intent('a-augmenter', 'augmenter', { property: 'bitterness', role: 'constraint', direction: 'exclude', metric: 'sensory' });
const poire = intent('a-poire', 'poire', { property: 'aroma', role: 'constraint', direction: 'keep', metric: 'sensory',
  comparisonBasis: { kind: 'current', assertionIds: [] } });
const amertume = intent('a-amertume', 'amertume', { property: 'bitterness', role: 'target', direction: 'increase', metric: 'sensory',
  comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
const jardin = intent('a-jardin', 'mon houblon de jardin', { property: 'materialCharacter', interpretationOrigin: 'user',
  subject: { kind: 'material', label: 'Houblon de jardin', materialId: null, sensoryContext: 'rawHop' }, basis: 'Caractériser avant de choisir.' });
const SOURCES = [douce, si, compenser, augmenter, poire, amertume];

function entry(source: Intent, kind: Entry['decision']['kind'], options: {
  actId: string; reason: string; prior?: Entry; active?: Intent; actor?: typeof USER | typeof PROPOSAL;
  sourceKind?: Entry['sourceKind']; additionActId?: string; sourceQuestionReference?: string; at?: string;
}): Entry {
  const entryId = `entry:${source.id}:${kind}:${options.actId}`;
  const additionActId = options.additionActId ?? options.prior?.additionActId;
  const sourceQuestionReference = options.sourceQuestionReference ?? options.prior?.sourceQuestionReference;
  return {
    entryId, annotationId: source.id, sourceAnnotation: structuredClone(source), sourceKind: options.sourceKind ?? options.prior?.sourceKind ?? 'initial',
    ...(additionActId ? { additionActId } : {}), ...(sourceQuestionReference ? { sourceQuestionReference } : {}),
    disposition: kind === 'reject' ? 'rejected' : 'active',
    decision: { kind, actId: options.actId, reason: options.reason, recordedAt: options.at ?? AT, recordedBy: options.actor ?? USER,
      ...(options.prior ? { predecessorEntryReference: options.prior.reference } : {}) },
    ...(kind === 'reject' ? {} : { activeIntent: structuredClone(options.active ?? source) }),
    reference: `ref:${entryId}`,
  };
}

const unknownAccess = (basis = 'Accès non déclaré.') => ({ state: 'unknown' as const, basis, assertionIds: [] as string[] });
const EXCLUSION = { id: 'excl-bitterness', intervention: 'changeBitterness' as const, certainty: 'certain' as const,
  intentIds: ['a-augmenter'], reason: 'Sans décider d’augmenter l’amertume.' };

function readingContext(patch: Record<string, unknown> = {}): ReadingContext {
  return {
    interpretation: { id: 'interp-1', version: 'hop-v55-property-advice-reading-v4', origin: 'proposal',
      text: 'Constat de douceur, question de compensation, garde sur la poire.' },
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière demandée explicitement.' },
    context: { stage: 'conditioning', stageBasis: 'Stade fourni par le brassin source.',
      access: { bulkBeer: unknownAccess(), sampling: unknownAccess(), separatePortion: unknownAccess() }, assertions: [] },
    exclusions: [EXCLUSION],
    ...patch,
  } as unknown as ReadingContext;
}

function strategy(id: string, title: string, contribution: string, distinctiveReason: string, effects: unknown[]) {
  return { id, kind: id, contribution, title, purpose: `But : ${title.toLocaleLowerCase('fr-CH')}.`, distinctiveReason, scope: 'documentation',
    intervention: 'none', argumentIds: ['arg-1'], candidateIds: [], documentaryProductRefs: [], effects,
    tradeoffs: [{ text: 'Ne retire pas de sucre de la bière.', intentIds: ['a-douce'], argumentIds: ['arg-2'] }],
    nextSteps: [{ kind: 'compare', text: 'Comparer deux portions dégustées.', argumentIds: [] }],
    applicability: { status: 'notEvaluated', conditions: [] },
    preparation: { documentaryDossier: { status: 'available', kind: 'choice', label: 'Dossier de choix documentaire' },
      operational: { status: 'notProvided', reason: 'Aucune opération fournie.' }, missingRequirements: [], refusalReasons: [] },
    reference: `strategy-ref:${id}` };
}

function answerFor(active: Intent[], rc: ReadingContext, recordId: string) {
  return {
    format: 'hop-documentary-answer-v3',
    requestSnapshot: { format: 'hop-documentary-request-v3', id: `request-${recordId}`, originalQuestion: Q, interpretation: structuredClone(rc.interpretation),
      propertyIntents: structuredClone(active), candidatePolicy: structuredClone(rc.candidatePolicy), context: structuredClone(rc.context),
      exclusions: structuredClone(rc.exclusions), materials: [] },
    corpusSnapshot: { version: 'corpus-test-1', reference: 'corpus-ref-1',
      sources: [{ id: 'src-1', source: { title: 'Étude test', author: 'Auteur test', year: 2024, kind: 'research', reference: 'https://example.org/etude' },
        nature: 'research', readingLevel: 'secondary', locator: 'p. 3', domain: 'houblon', limits: [] }],
      claims: [{ id: 'claim-1', role: 'support', statement: 'Énoncé documenté borné.', domain: 'houblon', sourceIds: ['src-1'],
        transferConditions: [], forbiddenInferences: ['Aucune efficacité sensorielle promise.'] }] },
    rulesVersion: 'rules-test', inputReference: `input-${recordId}`, interpretationReference: `interpretation-ref-${recordId}`,
    coverage: { status: 'partial', points: [] },
    body: [{ id: 'body-1', text: 'Le houblon peut être examiné comme compensation perceptive, sans choix d’amertume.', argumentIds: ['arg-1'] }],
    arguments: [
      { id: 'arg-1', kind: 'adviceInference', text: 'Une compensation perçue reste une hypothèse à qualifier.', intentIds: ['a-compenser'],
        assertionIds: [], claimIds: ['claim-1'], materialEvidence: [] },
      { id: 'arg-2', kind: 'documentaryFact', text: 'Un apport aromatique peut se superposer à la poire.', intentIds: ['a-poire'],
        assertionIds: [], claimIds: [], materialEvidence: [] },
    ],
    candidateAssessments: [],
    strategies: [
      strategy('s-comp', 'Comparer des compensations de la douceur', 'investigation', 'Examine ce qui pourrait masquer la douceur perçue.', [
        { intentId: 'a-poire', status: 'structuralGuard', text: 'La poire reste une garde à préserver.', argumentIds: ['arg-1'] },
        { intentId: 'a-compenser', status: 'hypothesis', text: 'Compensation à qualifier par dégustation comparée.', argumentIds: ['arg-1', 'arg-2'] }]),
      strategy('s-char', 'Caractériser le houblon de jardin', 'characterization', 'Qualifie la matière avant de lui confier un rôle.', [
        { intentId: 'a-poire', status: 'tension', text: 'Un apport aromatique pourrait masquer la poire.', argumentIds: ['arg-2'] }]),
    ],
    limits: ['Aucune promesse de résultat sensoriel.'],
    reference: `answer-ref-${recordId}`,
  };
}

function makeRecord(options: { id: string; reference: string; sources: Intent[]; entries: Entry[]; rc: ReadingContext;
  transition: AnswerRecord['transition']; sourceReadingReference?: string; ledgerReference?: string }): AnswerRecord {
  const latest = new Map<string, Entry>();
  for (const row of options.entries) latest.set(row.annotationId, row);
  const active = options.sources.flatMap((source) => {
    const row = latest.get(source.id);
    return row?.disposition === 'active' && row.activeIntent ? [structuredClone(row.activeIntent)] : [];
  });
  const outcome = active.length
    ? { kind: 'domainAnswer', requestDraftReference: `draft-${options.id}`, answerSnapshot: answerFor(active, options.rc, options.id), answerReference: `answer-ref-${options.id}` }
    : { kind: 'allRejected' };
  return {
    format: 'hop-v55-documentary-answer-record-v4', id: options.id, ownerKey: 'owner:test', workspaceId: 'workspace:test',
    sourceReadingReference: options.sourceReadingReference ?? 'reading-1', originalQuestion: Q, transition: options.transition,
    ledger: { format: 'hop-v55-property-advice-annotation-ledger-v1', sourceAnnotations: structuredClone(options.sources), entries: structuredClone(options.entries),
      reference: options.ledgerReference ?? `ledger-${options.id}` },
    preparation: { preparedReference: `prepared-${options.id}`, source: { kind: 'batch', id: 'batch-1' } },
    readingContext: structuredClone(options.rc), outcome, reference: options.reference,
  } as unknown as AnswerRecord;
}

function baseEntries(): Entry[] {
  const initial = SOURCES.map((source) => entry(source, 'initialize', { actId: 'act-create', reason: 'Lecture initiale proposée.', actor: PROPOSAL }));
  return [...initial, entry(amertume, 'reject', { prior: initial[5], actId: 'act-r1', reason: 'Cible fabriquée : je ne demande pas plus d’amertume' })];
}

function recordA(): AnswerRecord {
  return makeRecord({ id: 'record-a', reference: 'record-ref-a', sources: SOURCES, entries: baseEntries(), rc: readingContext(),
    transition: { actId: 'act-r1', kind: 'revise', parentRecordReference: 'record-ref-0', parentReadingReference: 'reading-1',
      reason: 'Écarter « amertume ».', actor: USER, recordedAt: AT } });
}

function recordB(): AnswerRecord {
  return makeRecord({ id: 'record-b', reference: 'record-ref-b', sources: SOURCES, entries: baseEntries(), rc: readingContext(),
    transition: { actId: 'act-b', kind: 'revise', parentRecordReference: 'record-ref-a', parentReadingReference: 'reading-1',
      reason: 'Version installée par une autre session.', actor: USER, recordedAt: '2026-10-03T11:00:00.000Z' } });
}

/** Parent simulé conforme : ajoute les actes envoyés, reprend le readingContext déclaré et rend une issue cohérente. */
function applyCorrection(base: AnswerRecord, request: CorrectionRequest): AnswerRecord {
  const sources = [...base.ledger.sourceAnnotations];
  const entries = [...base.ledger.entries];
  const lastOf = (id: string) => [...entries].reverse().find((row) => row.annotationId === id) as Entry;
  for (const action of request.actions) {
    if (action.kind === 'add') {
      sources.push(action.sourceAnnotation);
      entries.push(entry(action.sourceAnnotation, 'add', { actId: request.commandId, reason: action.reason, active: action.activeIntent,
        sourceKind: 'added', additionActId: request.commandId, sourceQuestionReference: base.sourceReadingReference }));
    } else {
      const prior = lastOf(action.annotationId);
      entries.push(entry(prior.sourceAnnotation, action.kind, { prior, actId: request.commandId, reason: action.reason,
        ...(action.kind === 'reject' ? {} : { active: action.activeIntent }) }));
    }
  }
  return makeRecord({ id: `${base.id}:${request.commandId}`, reference: `record-ref:${request.commandId}`, sources, entries,
    rc: structuredClone(request.readingContext), sourceReadingReference: base.sourceReadingReference, ledgerReference: `ledger:${request.commandId}`,
    transition: { actId: request.commandId, kind: 'revise', parentRecordReference: base.reference, parentReadingReference: base.sourceReadingReference,
      reason: request.reason, actor: USER, recordedAt: '2026-10-03T12:00:00.000Z' } });
}

function makeDossier(record: AnswerRecord, request: DossierRequest): DossierRecord {
  const answer = (record.outcome as unknown as { answerSnapshot: ReturnType<typeof answerFor> }).answerSnapshot;
  const chosen = answer.strategies.find((row) => row.id === request.strategyId);
  const snapshotReference = `dossier-snapshot:${request.commandId}`;
  return {
    format: 'hop-v55-documentary-dossier-record-v4', id: `dossier:${request.commandId}`, ownerKey: record.ownerKey, workspaceId: record.workspaceId,
    sourceReadingReference: record.sourceReadingReference, answerRecordReference: request.expectedRecordReference,
    answerReference: request.expectedAnswerReference, ledgerReference: request.expectedLedgerReference, strategyId: request.strategyId,
    strategyReference: request.expectedStrategyReference,
    dossierSnapshot: { format: 'hop-documentary-dossier-v3', id: `dossier:${request.commandId}`, answerSnapshot: answer,
      answerReference: request.expectedAnswerReference, interpretationReference: request.expectedInterpretationReference,
      strategyId: request.strategyId, strategySnapshot: chosen, strategyReference: request.expectedStrategyReference, motive: request.motive,
      createdAt: AT, createdBy: USER, preparation: chosen?.preparation, reference: snapshotReference },
    dossierReference: snapshotReference, reference: `dossier-record:${request.commandId}`,
  } as unknown as DossierRecord;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
/* Les voies sont des <details> : on les ouvre comme le ferait le brasseur avant de chercher leurs commandes. */
const openWays = (container: HTMLElement) => container.querySelectorAll('details.hv4-way').forEach((way) => way.setAttribute('open', ''));
const confirmButton = () => button('Confirmer la nouvelle lecture');

function rejectTerm(label: string, preset: string) {
  fireEvent.click(button(`Écarter « ${label} »`));
  fireEvent.click(screen.getByRole('radio', { name: preset }));
  fireEvent.click(button('Écarter ce terme'));
}

afterEach(() => cleanup());

describe('HopV55PropertyAdviceDecisionV4 — écarter, restaurer, confirmer', () => {
  it('garde la question mot pour mot et marque les passages exacts retenus ou écartés', () => {
    const { container } = render(<HopV55PropertyAdviceDecisionV4 record={recordA()} onCorrect={vi.fn()} />);
    expect(screen.getByLabelText('Question originale, mot pour mot').textContent).toBe(Q);
    const rejected = [...container.querySelectorAll('mark.hv4-frag.is-rejected')].map((mark) => mark.textContent);
    expect(rejected).toEqual(['amertume']);
    expect([...container.querySelectorAll('mark.hv4-frag.is-active')].map((mark) => mark.textContent)).toEqual(['douce', 'si', 'compenser', 'augmenter', 'poire']);
    rejectTerm('si', PRESET_LIAISON);
    expect([...container.querySelectorAll('mark.hv4-frag.is-rejecting')].map((mark) => mark.textContent)).toEqual(['si']);
  });

  it('écarte un faux terme avec motif, envoie l’acte exact et n’annonce le succès qu’après vérification du retour', async () => {
    const base = recordA();
    const onCorrect = vi.fn((request: CorrectionRequest) => Promise.resolve(applyCorrection(base, request)));
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    rejectTerm('si', PRESET_LIAISON);
    expect(screen.getByRole('radio', { name: 'Actualiser le résumé proposé après confirmation' })).toBeTruthy();
    expect(screen.getByText('Le résumé proposé sera actualisé à la confirmation pour refléter les termes retenus.')).toBeTruthy();
    const changes = screen.getByRole('list', { name: 'Ce qui sera conservé' });
    expect(within(changes).getByText('Écarter « si »')).toBeTruthy();
    expect(within(changes).getByText('écartée, trace conservée', { selector: 'ins' })).toBeTruthy();
    fireEvent.click(confirmButton());
    expect(onCorrect).toHaveBeenCalledTimes(1);
    const request = onCorrect.mock.calls[0][0];
    expect(request.commandId).toMatch(/^property-advice-v4-correction-/);
    expect(request.expectedRecordReference).toBe('record-ref-a');
    expect(request.expectedLedgerReference).toBe('ledger-record-a');
    expect(request.actions).toEqual([{ kind: 'reject', annotationId: 'a-si', reason: PRESET_LIAISON }]);
    expect(request.readingContext).toEqual(base.readingContext);
    expect(request.reason).toBe(`Écarter « si » : ${PRESET_LIAISON}.`);
    expect(await screen.findByText(SUCCESS)).toBeTruthy();
    expect(button('Restaurer « si »')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Relire cette version' }).length).toBe(1);
  });

  it('refuse un retour cohérent mais d’un autre motif, puis renvoie exactement la même commande', async () => {
    const base = recordA();
    const onCorrect = vi.fn((request: CorrectionRequest) => {
      const result = applyCorrection(base, request);
      if (onCorrect.mock.calls.length === 1) {
        const appended = result.ledger.entries[result.ledger.entries.length - 1];
        appended.decision.reason = 'Motif d’un autre acte';
      }
      return Promise.resolve(result);
    });
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    rejectTerm('si', PRESET_LIAISON);
    fireEvent.click(confirmButton());
    expect((await screen.findByRole('alert')).textContent).toContain('Le motif enregistré pour a-si diffère de celui confirmé.');
    expect(screen.queryByText(SUCCESS)).toBeNull();
    fireEvent.click(button('Réessayer la même correction'));
    expect(onCorrect).toHaveBeenCalledTimes(2);
    expect(onCorrect.mock.calls[1][0]).toBe(onCorrect.mock.calls[0][0]);
    expect(await screen.findByText(SUCCESS)).toBeTruthy();
  });

  it('erreur réseau : même commandId au retry; un nouveau geste crée une nouvelle commande', async () => {
    const base = recordA();
    const onCorrect = vi.fn((_request: CorrectionRequest): Promise<AnswerRecord> => Promise.reject(new Error('Réseau indisponible')));
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    rejectTerm('si', PRESET_LIAISON);
    fireEvent.click(confirmButton());
    expect((await screen.findByRole('alert')).textContent).toContain('Réseau indisponible');
    fireEvent.click(button('Réessayer la même correction'));
    await screen.findByRole('alert');
    expect(onCorrect.mock.calls[1][0]).toBe(onCorrect.mock.calls[0][0]);
    rejectTerm('poire', PRESET_HORS_SUJET);
    expect(screen.queryByRole('button', { name: 'Réessayer la même correction' })).toBeNull();
    await act(async () => { fireEvent.click(confirmButton()); });
    const third = onCorrect.mock.calls[2][0];
    expect(third.commandId).not.toBe(onCorrect.mock.calls[0][0].commandId);
    expect(third.actions.map((action) => action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId)).toEqual(['a-si', 'a-poire']);
  });

  it('retour tardif : une réponse A arrivée après l’installation de B n’est pas annoncée comme succès', async () => {
    const base = recordA();
    const pending = deferred<AnswerRecord>();
    const onCorrect = vi.fn((_request: CorrectionRequest) => pending.promise);
    const { rerender } = render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    rejectTerm('si', PRESET_LIAISON);
    fireEvent.click(confirmButton());
    rerender(<HopV55PropertyAdviceDecisionV4 record={recordB()} onCorrect={onCorrect} />);
    expect(screen.getByText(/Une autre version courante a été reçue/)).toBeTruthy();
    await act(async () => { pending.resolve(applyCorrection(base, onCorrect.mock.calls[0][0])); });
    expect(screen.getByText(/a répondu après un changement de version/)).toBeTruthy();
    expect(screen.queryByText(SUCCESS)).toBeNull();
    expect(screen.getByText('Version installée par une autre session.')).toBeTruthy();
  });
});

describe('HopV55PropertyAdviceDecisionV4 — liens pendants et avant/après', () => {
  it('écarter un constat comparé bloque jusqu’à un geste explicite; rien n’est délié en silence', async () => {
    const base = recordA();
    const onCorrect = vi.fn((request: CorrectionRequest) => Promise.resolve(applyCorrection(base, request)));
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    rejectTerm('douce', PRESET_HORS_SUJET);
    const blockers = screen.getByRole('group', { name: 'À résoudre avant de confirmer' });
    expect(within(blockers).getByText(/« compenser » reste relié à « douce » \(lien, constat comparé\)/)).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(button('Délier « douce » de « compenser »'));
    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(button('Garder une question ouverte, sans comparaison'));
    expect(confirmButton().disabled).toBe(false);
    const changes = screen.getByRole('list', { name: 'Ce qui sera conservé' });
    expect(within(changes).getByText('Corriger « compenser »')).toBeTruthy();
    expect(within(changes).getByText('compensations de « douce »', { selector: 'del' })).toBeTruthy();
    expect(within(changes).getByText('aucune', { selector: 'ins' })).toBeTruthy();
    fireEvent.click(confirmButton());
    const request = onCorrect.mock.calls[0][0];
    const { investigation: _removed, ...compenserWithoutQuestion } = compenser;
    expect(request.actions).toEqual([
      { kind: 'reject', annotationId: 'a-douce', reason: PRESET_HORS_SUJET },
      { kind: 'revise', annotationId: 'a-compenser', activeIntent: { ...compenserWithoutQuestion, relatedIntentIds: [], interpretationOrigin: 'user' }, reason: request.reason },
    ]);
    expect(await screen.findByText(SUCCESS)).toBeTruthy();
  });

  it('écarter « augmenter » exige de relier explicitement l’exclusion qui le cite', async () => {
    const base = recordA();
    const onCorrect = vi.fn((request: CorrectionRequest) => Promise.resolve(applyCorrection(base, request)));
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    rejectTerm('augmenter', PRESET_CONTRESENS);
    expect(screen.getByText(/L’exclusion « Modifier l’amertume » \(certaine\) cite « augmenter »/)).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(screen.getByRole('combobox', { name: 'Relier l’exclusion « Modifier l’amertume » à un terme retenu' }), { target: { value: 'a-compenser' } });
    const changes = screen.getByRole('list', { name: 'Ce qui sera conservé' });
    expect(within(changes).getByText('« augmenter »', { selector: 'del' })).toBeTruthy();
    expect(within(changes).getByText('« compenser »', { selector: 'ins' })).toBeTruthy();
    fireEvent.click(confirmButton());
    const request = onCorrect.mock.calls[0][0];
    expect(request.actions).toEqual([{ kind: 'reject', annotationId: 'a-augmenter', reason: PRESET_CONTRESENS }]);
    expect(request.readingContext.exclusions).toEqual([{ ...EXCLUSION, intentIds: ['a-compenser'] }]);
    expect(await screen.findByText(SUCCESS)).toBeTruthy();
  });

  it('une correction de rôle montre l’avant/après, s’annule sans trace et part en révision d’origine user', async () => {
    const base = recordA();
    const onCorrect = vi.fn((request: CorrectionRequest) => Promise.resolve(applyCorrection(base, request)));
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    fireEvent.click(button('Corriger « poire »'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Rôle de l’intention 5' }), { target: { value: 'preference' } });
    let changes = screen.getByRole('list', { name: 'Ce qui sera conservé' });
    expect(within(changes).getByText('Garde', { selector: 'del' })).toBeTruthy();
    expect(within(changes).getByText('Préférence', { selector: 'ins' })).toBeTruthy();
    fireEvent.click(button('Annuler la correction de « poire »'));
    expect(screen.queryByText('Nouvelle lecture à confirmer')).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Rôle de l’intention 5' }), { target: { value: 'preference' } });
    changes = screen.getByRole('list', { name: 'Ce qui sera conservé' });
    expect(within(changes).getByText('Corriger « poire »')).toBeTruthy();
    fireEvent.click(confirmButton());
    const request = onCorrect.mock.calls[0][0];
    expect(request.reason).toContain('rôle : Garde → Préférence');
    expect(request.actions).toEqual([{ kind: 'revise', annotationId: 'a-poire',
      activeIntent: { ...poire, role: 'preference', interpretationOrigin: 'user' }, reason: request.reason }]);
    expect(await screen.findByText(SUCCESS)).toBeTruthy();
  });
});

describe('HopV55PropertyAdviceDecisionV4 — tout écarté, histoire, lecture seule', () => {
  function allRejectedRecord(): AnswerRecord {
    const douceRevised: Intent = { ...douce, qualification: 'trop douce', interpretationOrigin: 'user' };
    const sources = [douce, si, compenser];
    const initial = sources.map((source) => entry(source, 'initialize', { actId: 'act-create', reason: 'Lecture initiale proposée.', actor: PROPOSAL }));
    const revised = entry(douce, 'revise', { prior: initial[0], actId: 'act-r1', reason: 'Préciser le constat.', active: douceRevised });
    const entries = [...initial, revised,
      entry(douce, 'reject', { prior: revised, actId: 'act-r2', reason: 'Écarté pour tester.' }),
      entry(si, 'reject', { prior: initial[1], actId: 'act-r2', reason: PRESET_LIAISON }),
      entry(compenser, 'reject', { prior: initial[2], actId: 'act-r2', reason: 'Question reformulée ailleurs.' })];
    return makeRecord({ id: 'record-empty', reference: 'record-ref-empty', sources, entries, rc: readingContext({ exclusions: [] }),
      transition: { actId: 'act-r2', kind: 'revise', parentRecordReference: 'record-ref-a', parentReadingReference: 'reading-1',
        reason: 'Tout écarter.', actor: USER, recordedAt: AT } });
  }

  it('sans terme retenu : aucune réponse, voie ni dossier; restauration explicite de la projection d’avant l’écart', async () => {
    const base = allRejectedRecord();
    const onCorrect = vi.fn((request: CorrectionRequest) => Promise.resolve(applyCorrection(base, request)));
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} onSaveDossier={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Lecture conservée, sans conseil' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Aucun terme retenu' })).toBeTruthy();
    expect(screen.queryByText('Voies possibles')).toBeNull();
    expect(screen.queryByRole('button', { name: /Conserver la voie/ })).toBeNull();
    expect(screen.getByText('Aucune : tous les termes sont écartés dans cette version.')).toBeTruthy();
    fireEvent.click(button('Restaurer « douce »'));
    expect(screen.getByRole('radio', { name: 'Comme avant l’écart' })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Écarté par erreur' }));
    fireEvent.click(button('Restaurer ce terme'));
    fireEvent.click(confirmButton());
    const request = onCorrect.mock.calls[0][0];
    expect(request.actions).toEqual([{ kind: 'restore', annotationId: 'a-douce',
      activeIntent: { ...douce, qualification: 'trop douce', interpretationOrigin: 'user' }, reason: 'Écarté par erreur' }]);
    expect(await screen.findByRole('heading', { name: 'Réponse documentaire' })).toBeTruthy();
  });

  it('le repère « contexte relu » suit la version affichée; l’ancienne version reste figée et sans geste', () => {
    const r1Context = readingContext({ context: { stage: 'conditioning', stageBasis: 'Stade fourni par le brassin source.',
      access: { bulkBeer: unknownAccess(), sampling: { state: 'yes', basis: 'Échantillon déclaré disponible.', assertionIds: ['assert-sampling'] },
        separatePortion: unknownAccess() },
      assertions: [{ id: 'assert-sampling', subject: 'sampling', statement: 'Un échantillon peut être prélevé.', state: 'reported', value: true,
        dimension: 'process', source: { title: 'Accès déclaré · Échantillon', author: 'Brasseur', year: null, kind: 'observation',
          reference: 'local-declaration:assert-sampling', locator: 'Motif déclaré : Un échantillon peut être prélevé.' } }] } });
    const r1 = makeRecord({ id: 'record-r1', reference: 'record-ref-r1', sources: SOURCES, entries: baseEntries(), rc: r1Context,
      transition: { actId: 'act-create', kind: 'create', reason: 'Première lecture.', actor: USER, recordedAt: '2026-10-02T09:00:00.000Z' } });
    const r2 = makeRecord({ id: 'record-r2', reference: 'record-ref-r2', sources: SOURCES, entries: baseEntries(), rc: readingContext(),
      sourceReadingReference: 'reading-2',
      transition: { actId: 'act-reexam', kind: 'reexamine', parentRecordReference: 'record-ref-r1', parentReadingReference: 'reading-1',
        reason: 'Relire avec le brassin actuel.', actor: USER, recordedAt: '2026-10-03T09:00:00.000Z' } });
    render(<HopV55PropertyAdviceDecisionV4 record={r2} previousRecords={[r1]} onCorrect={vi.fn()} />);
    expect(screen.getByText('Contexte relu pour cette version')).toBeTruthy();
    expect(screen.getByText('Déclaration de la version précédente, non reprise ici :')).toBeTruthy();
    expect(screen.getByText(/Échantillon · avant : Oui \(Échantillon déclaré disponible\.\) · cette version : Inconnu/)).toBeTruthy();
    fireEvent.click(button('Voir la version précédente'));
    expect(screen.getByText(/affichée telle qu’enregistrée et en lecture seule/)).toBeTruthy();
    expect(screen.queryByText('Contexte relu pour cette version')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Écarter « si »' })).toBeNull();
    expect(screen.getAllByText('Déclaré · oui').length).toBeGreaterThan(0);
    expect(screen.queryByText(/\btrue\b/)).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Revenir à la version courante' })[0]);
    expect(screen.getByText('Contexte relu pour cette version')).toBeTruthy();
  });

  it('conserve le repère de relecture après une correction d’accès sans présenter le nouvel oui comme relu auparavant', () => {
    const r1 = makeRecord({ id: 'record-r1', reference: 'record-ref-r1', sources: SOURCES, entries: baseEntries(),
      rc: readingContext({ context: { stage: 'conditioning', stageBasis: 'Stade du brassin.',
        access: { bulkBeer: unknownAccess(), sampling: { state: 'yes', basis: 'Échantillon déclaré avant la relecture.', assertionIds: ['assert-sampling-before'] },
          separatePortion: unknownAccess() }, assertions: [] } }),
      transition: { actId: 'act-create', kind: 'create', reason: 'Première lecture.', actor: USER, recordedAt: '2026-10-02T09:00:00.000Z' } });
    const r2 = makeRecord({ id: 'record-r2', reference: 'record-ref-r2', sources: SOURCES, entries: baseEntries(), rc: readingContext(),
      sourceReadingReference: 'reading-2',
      transition: { actId: 'act-reexam', kind: 'reexamine', parentRecordReference: r1.reference, parentReadingReference: r1.sourceReadingReference,
        reason: 'Relire avec le brassin actuel.', actor: USER, recordedAt: '2026-10-03T09:00:00.000Z' } });
    const r3Context = readingContext();
    r3Context.context.access.sampling = { state: 'yes', basis: 'Échantillon déclaré après la relecture.', assertionIds: ['assert-sampling-after'] };
    r3Context.context.assertions.push({ id: 'assert-sampling-after', subject: 'sampling', statement: 'Un échantillon peut être prélevé après la relecture.',
      state: 'reported', value: true, dimension: 'process', source: { title: 'Attestation d’accès · Échantillon', author: 'Brasseur', year: null,
        kind: 'observation', reference: 'local-declaration:assert-sampling-after', locator: 'Motif déclaré après le réexamen.' } });
    const r3 = makeRecord({ id: 'record-r3', reference: 'record-ref-r3', sources: SOURCES, entries: baseEntries(), rc: r3Context,
      sourceReadingReference: 'reading-2',
      transition: { actId: 'act-correct-access', kind: 'revise', parentRecordReference: r2.reference, parentReadingReference: 'reading-2',
        reason: 'Déclarer la possibilité de prélever un échantillon.', actor: USER, recordedAt: '2026-10-03T10:00:00.000Z' } });
    render(<HopV55PropertyAdviceDecisionV4 record={r3} previousRecords={[r2, r1]} onCorrect={vi.fn()} />);
    expect(screen.getByText('Contexte relu dans une version précédente')).toBeTruthy();
    expect(screen.getByText(/Stade retenu lors de la relecture : Conditionnement/)).toBeTruthy();
    expect(screen.getByText(/Échantillon · lors de la relecture : Inconnu \(Accès non déclaré\.\) · maintenant : Oui \(Échantillon déclaré après la relecture\.\)/)).toBeTruthy();
    expect(screen.getByText(/Accès inconnus lors de la relecture/)).toBeTruthy();
    expect(screen.getAllByText('assert-sampling-after').length).toBeGreaterThan(0);
    fireEvent.click(button('Voir la version relue'));
    expect(screen.getByText('Contexte relu pour cette version')).toBeTruthy();
    expect(screen.getByText(/Échantillon · avant : Oui \(Échantillon déclaré avant la relecture\.\) · cette version : Inconnu/)).toBeTruthy();
  });

  it.each([
    ['parent V4 absent', recordA(), 'Version précédente non disponible'],
    ['filiation cyclique', (() => { const row = structuredClone(recordA()); row.transition.parentRecordReference = row.reference; return row; })(), 'Historique des versions incohérent'],
  ])('qualifie une %s sans deviner le contexte relu', (_label, record, expectedHeading) => {
    render(<HopV55PropertyAdviceDecisionV4 record={record} previousRecords={[]} onCorrect={vi.fn()} />);
    expect(screen.getByText(expectedHeading)).toBeTruthy();
    expect(screen.getByText(/Les accès affichés ici ne sont pas présentés comme ayant été relus auparavant/)).toBeTruthy();
    expect(screen.queryByText(/Stade retenu lors de la relecture/)).toBeNull();
  });

  it('distingue une reprise V3 sans inventer de relecture antérieure', () => {
    const upgraded = structuredClone(recordA());
    upgraded.transition = { actId: 'act:upgrade-v3', kind: 'upgradeV3', parentRecordReference: 'record:source-v3',
      parentReadingReference: upgraded.sourceReadingReference, reason: 'Reprise V4 explicite.', actor: USER, recordedAt: AT };
    render(<HopV55PropertyAdviceDecisionV4 record={upgraded} previousRecords={[]} onCorrect={vi.fn()} />);
    expect(screen.getByText('Contexte repris d’une réponse antérieure')).toBeTruthy();
    expect(screen.getByText(/L’historique disponible n’identifie pas de relecture V4 avant cette reprise/)).toBeTruthy();
    expect(screen.queryByText('Version précédente non disponible')).toBeNull();
    expect(screen.queryByText(/Stade retenu lors de la relecture/)).toBeNull();
  });

  it('readOnly : aucun geste de correction, de restauration ou de dossier', () => {
    render(<HopV55PropertyAdviceDecisionV4 record={recordA()} readOnly onCorrect={vi.fn()} onSaveDossier={vi.fn()} onReexamine={vi.fn()} />);
    expect(screen.getByText('Cette lecture est affichée en lecture seule.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Écarter « si »' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restaurer « amertume »' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Conserver la voie/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Relire avec le contexte actuel de la source' })).toBeNull();
  });
});

describe('HopV55PropertyAdviceDecisionV4 — accès sourcé, dossier, séparation A→B', () => {
  it('publie l’identité exacte de la version affichée à l’ouverture, au choix B puis au retour A, sans boucle', async () => {
    const a = recordA(), b = recordB(), previousRecords = [b];
    const onDisplayedRecordChange = vi.fn();
    const onCorrect = vi.fn();
    const view = render(<HopV55PropertyAdviceDecisionV4 record={a} previousRecords={previousRecords}
      onDisplayedRecordChange={onDisplayedRecordChange} onCorrect={onCorrect} />);
    const identity = (record: AnswerRecord) => ({ ownerKey: record.ownerKey, workspaceId: record.workspaceId, recordId: record.id,
      recordReference: record.reference, sourceReadingReference: record.sourceReadingReference, ledgerReference: record.ledger.reference });

    await waitFor(() => expect(onDisplayedRecordChange).toHaveBeenCalledTimes(1));
    expect(onDisplayedRecordChange).toHaveBeenNthCalledWith(1, identity(a));
    fireEvent.click(screen.getByRole('button', { name: 'Relire cette version' }));
    await waitFor(() => expect(onDisplayedRecordChange).toHaveBeenCalledTimes(2));
    expect(onDisplayedRecordChange).toHaveBeenNthCalledWith(2, identity(b));
    view.rerender(<HopV55PropertyAdviceDecisionV4 record={a} previousRecords={previousRecords}
      onDisplayedRecordChange={onDisplayedRecordChange} onCorrect={onCorrect} />);
    await act(async () => { await Promise.resolve(); });
    expect(onDisplayedRecordChange).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getAllByRole('button', { name: 'Revenir à la version courante' })[0]);
    await waitFor(() => expect(onDisplayedRecordChange).toHaveBeenCalledTimes(3));
    expect(onDisplayedRecordChange).toHaveBeenNthCalledWith(3, identity(a));
    expect(onCorrect).not.toHaveBeenCalled();
  });

  it('notifie l’identité parent exacte lorsque le lien de contexte relu ouvre la version précédente', async () => {
    const a = recordA();
    const reexamined = structuredClone(recordB());
    reexamined.sourceReadingReference = 'reading:reexamined';
    reexamined.transition = { actId: 'act:reexamined', kind: 'reexamine', parentRecordReference: a.reference,
      parentReadingReference: a.sourceReadingReference, reason: 'Relecture de fixture.', actor: USER, recordedAt: AT };
    const onDisplayedRecordChange = vi.fn();
    render(<HopV55PropertyAdviceDecisionV4 record={reexamined} previousRecords={[a]} onDisplayedRecordChange={onDisplayedRecordChange} />);
    const identity = (record: AnswerRecord) => ({ ownerKey: record.ownerKey, workspaceId: record.workspaceId, recordId: record.id,
      recordReference: record.reference, sourceReadingReference: record.sourceReadingReference, ledgerReference: record.ledger.reference });
    await waitFor(() => expect(onDisplayedRecordChange).toHaveBeenCalledTimes(1));
    expect(onDisplayedRecordChange).toHaveBeenNthCalledWith(1, identity(reexamined));
    fireEvent.click(screen.getByRole('button', { name: 'Voir la version précédente' }));
    await waitFor(() => expect(onDisplayedRecordChange).toHaveBeenCalledTimes(2));
    expect(onDisplayedRecordChange).toHaveBeenNthCalledWith(2, identity(a));
  });

  it('déclare un accès oui en un seul constat; la source locale est construite du geste et visible', async () => {
    const base = recordA();
    const onCorrect = vi.fn((request: CorrectionRequest) => Promise.resolve(applyCorrection(base, request)));
    render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={onCorrect} />);
    fireEvent.click(button('Préciser l’accès · Échantillon · Inconnu'));
    expect((button('Appliquer à la lecture')).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Oui' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Ce que tu constates' }), { target: { value: 'Je peux prélever au robinet du fermenteur.' } });
    expect(screen.getByText(/Source : ta déclaration locale · « Accès déclaré · Échantillon » · Brasseur/)).toBeTruthy();
    fireEvent.click(button('Appliquer à la lecture'));
    const changes = screen.getByRole('list', { name: 'Ce qui sera conservé' });
    expect(within(changes).getByText('Inconnu', { selector: 'del' })).toBeTruthy();
    expect(within(changes).getByText('Oui', { selector: 'ins' })).toBeTruthy();
    fireEvent.click(confirmButton());
    const request = onCorrect.mock.calls[0][0];
    expect(request.actions).toEqual([]);
    const sampling = request.readingContext.context.access.sampling;
    expect(sampling.state).toBe('yes');
    expect(sampling.basis).toBe('Je peux prélever au robinet du fermenteur.');
    const assertion = request.readingContext.context.assertions.find((row) => row.id === sampling.assertionIds[0]);
    expect(assertion).toMatchObject({ subject: 'sampling', state: 'reported', value: true, statement: 'Je peux prélever au robinet du fermenteur.',
      source: { title: 'Accès déclaré · Échantillon', author: 'Brasseur', year: null, kind: 'observation',
        reference: `local-declaration:${sampling.assertionIds[0]}`, locator: 'Motif déclaré : Je peux prélever au robinet du fermenteur.' } });
    expect(request.readingContext.context.access.bulkBeer).toEqual(base.readingContext.context.access.bulkBeer);
    expect(request.reason).toContain('Accès échantillon : oui — Je peux prélever au robinet du fermenteur.');
    expect(await screen.findByText(SUCCESS)).toBeTruthy();
  });

  it('conserve une voie avec les références exactes, refuse un reçu étranger et rejoue la même commande', async () => {
    const base = recordA();
    const onSaveDossier = vi.fn((request: DossierRequest) => Promise.resolve(makeDossier(base, request)));
    onSaveDossier.mockImplementationOnce((request: DossierRequest) => {
      const foreign = makeDossier(base, request) as unknown as { ledgerReference: string };
      foreign.ledgerReference = 'ledger-autre-version';
      return Promise.resolve(foreign as unknown as DossierRecord);
    });
    const { container } = render(<HopV55PropertyAdviceDecisionV4 record={base} onCorrect={vi.fn()} onSaveDossier={onSaveDossier} />);
    openWays(container);
    expect(screen.getByText('« poire » · Garde de structure')).toBeTruthy();
    expect(screen.getByText('« poire » · Tension documentaire')).toBeTruthy();
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Pourquoi conserver cette voie ?' })[0], { target: { value: 'Comparer avant de toucher à la recette.' } });
    fireEvent.click(button('Conserver la voie 1 · Comparer des compensations de la douceur'));
    expect((await screen.findByRole('alert')).textContent).toContain('ne correspond pas à la version, à la réponse ou à la voie choisies');
    const request = onSaveDossier.mock.calls[0][0];
    expect(request).toMatchObject({ expectedRecordReference: 'record-ref-a', expectedLedgerReference: 'ledger-record-a',
      expectedAnswerReference: 'answer-ref-record-a', expectedInterpretationReference: 'interpretation-ref-record-a',
      strategyId: 's-comp', expectedStrategyReference: 'strategy-ref:s-comp', motive: 'Comparer avant de toucher à la recette.' });
    fireEvent.click(button('Réessayer le même choix'));
    expect(onSaveDossier.mock.calls[1][0]).toBe(request);
    expect(await screen.findByText('Dossier conservé · motif : Comparer avant de toucher à la recette.')).toBeTruthy();
    expect(screen.getByText(/Dossier documentaire conservé pour cette version/)).toBeTruthy();
  });

  it('A→B : motifs de dossier et de relecture, reçu affiché ne passent pas sur B, même avec le même strategyId', async () => {
    const a = recordA();
    const onSaveDossier = vi.fn((request: DossierRequest) => Promise.resolve(makeDossier(a, request)));
    const props = { onCorrect: vi.fn(), onSaveDossier, onReexamine: vi.fn() };
    const { container, rerender } = render(<HopV55PropertyAdviceDecisionV4 record={a} {...props} />);
    openWays(container);
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Pourquoi conserver cette voie ?' })[0], { target: { value: 'Motif dossier A' } });
    fireEvent.click(button('Conserver la voie 1 · Comparer des compensations de la douceur'));
    expect(await screen.findByText(/Dossier documentaire conservé pour cette version/)).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Pourquoi conserver cette voie ?' }), { target: { value: 'Motif dossier A, voie 2' } });
    fireEvent.click(button('Relire avec le contexte actuel de la source'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif de la relecture du contexte' }), { target: { value: 'Motif relecture A' } });
    rerender(<HopV55PropertyAdviceDecisionV4 record={recordB()} {...props} />);
    openWays(container);
    expect(screen.queryByText(/Dossier documentaire conservé pour cette version/)).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Motif de la relecture du contexte' })).toBeNull();
    const motives = screen.getAllByRole('textbox', { name: 'Pourquoi conserver cette voie ?' }) as HTMLTextAreaElement[];
    expect(motives).toHaveLength(2);
    expect(motives.map((field) => field.value)).toEqual(['', '']);
    fireEvent.click(button('Relire avec le contexte actuel de la source'));
    expect((screen.getByRole('textbox', { name: 'Motif de la relecture du contexte' }) as HTMLTextAreaElement).value).toBe('');
    expect(props.onReexamine).not.toHaveBeenCalled();
  });
});

describe('verifyRecordResultV4 / verifyDossierResultV4 — contre-épreuves de retours incohérents', () => {
  const base = recordA();
  const request = {
    commandId: 'cmd-1', expectedRecordReference: base.reference, expectedLedgerReference: base.ledger.reference,
    actions: [{ kind: 'reject', annotationId: 'a-si', reason: 'Mot outil' },
      { kind: 'add', sourceAnnotation: jardin, activeIntent: jardin, reason: 'Caractériser avant de choisir.' }],
    readingContext: structuredClone(base.readingContext), reason: 'Écarter « si ». Ajouter « mon houblon de jardin ».',
  } as unknown as CorrectionRequest;
  const expectation: V4RecordExpectation = { kind: 'revise', base, commandId: 'cmd-1', reason: request.reason, actions: request.actions,
    expectedReadingContext: request.readingContext,
    allowProposalRefresh: true,
    expectedActiveIds: ['a-douce', 'a-compenser', 'a-augmenter', 'a-poire', 'a-jardin'], expectedAccess: request.readingContext.context.access };
  const good = applyCorrection(base, request);
  type Mutable = { transition: { actId: string; reason: string }; sourceReadingReference: string; outcome: unknown;
    readingContext: { context: { access: Record<string, unknown> } };
    ledger: { entries: Array<{ annotationId: string; decision: { kind: string; reason: string; predecessorEntryReference?: string }; sourceAnnotation: { label: string } }>;
      sourceAnnotations: Array<{ id: string; label: string }> } };
  const mutate = (change: (record: Mutable) => void) => { const copy = structuredClone(good) as unknown as Mutable; change(copy); return copy; };
  const appended = (record: Mutable, id: string) => record.ledger.entries.find((row) => row.annotationId === id && row.decision.kind !== 'initialize'
    && row.decision.reason !== 'Lecture initiale proposée.') as Mutable['ledger']['entries'][number];

  it('accepte le retour conforme', () => { expect(verifyRecordResultV4(expectation, good)).toBeNull(); });
  it.each([
    ['un autre acte', (record: Mutable) => { record.transition.actId = 'cmd-autre'; }, /ne correspond pas à la commande/],
    ['un autre motif global', (record: Mutable) => { record.transition.reason = 'Autre motif'; }, /motif de la nouvelle version/],
    ['un autre motif de rejet', (record: Mutable) => { appended(record, 'a-si').decision.reason = 'Autre'; }, /motif enregistré pour a-si/],
    ['une autre annotation source ajoutée', (record: Mutable) => {
      appended(record, 'a-jardin').sourceAnnotation.label = 'jardin';
      (record.ledger.sourceAnnotations.find((row) => row.id === 'a-jardin') as { label: string }).label = 'jardin';
    }, /annotation source exacts/],
    ['une trace amputée', (record: Mutable) => { record.ledger.entries.splice(0, 1); }, /toute la trace précédente/],
    ['un prédécesseur faux', (record: Mutable) => { appended(record, 'a-si').decision.predecessorEntryReference = 'ref:autre'; }, /ne prolonge pas exactement/],
    ['une autre lecture source', (record: Mutable) => { record.sourceReadingReference = 'reading-2'; }, /même lecture source/],
    ['une issue sans réponse', (record: Mutable) => { record.outcome = { kind: 'allRejected' }; }, /doit porter sa réponse/],
    ['un accès recopié', (record: Mutable) => { record.readingContext.context.access.sampling = { state: 'yes', basis: 'Ancien oui', assertionIds: [] }; }, /contexte de la correction/],
  ])('refuse %s', (_name, change, message) => {
    expect(verifyRecordResultV4(expectation, mutate(change))).toMatch(message);
  });
  it('refuse une révision présentée comme réexamen et des termes retenus différents', () => {
    expect(verifyRecordResultV4({ ...expectation, kind: 'reexamine' }, good)).toMatch(/n’est pas une relecture du contexte/);
    expect(verifyRecordResultV4({ ...expectation, expectedActiveIds: ['a-douce'] }, good)).toMatch(/termes retenus/);
  });
  it('exige les projections exactes et le cadre de lecture de cette version', () => {
    const loose = (change: (record: Record<string, any>) => void) => {
      const copy = structuredClone(good) as unknown as Record<string, any>;
      change(copy);
      return copy;
    };
    expect(verifyRecordResultV4(expectation, loose((record) => {
      record.outcome.answerSnapshot.requestSnapshot.propertyIntents[0].direction = 'decrease';
    }))).toMatch(/projections retenues/);
    expect(verifyRecordResultV4(expectation, loose((record) => {
      record.readingContext.candidatePolicy.basis = 'Autre périmètre';
    }))).toMatch(/périmètre des matières/);
    expect(verifyRecordResultV4(expectation, loose((record) => {
      record.outcome.answerSnapshot.requestSnapshot.context.access.bulkBeer = { state: 'yes', basis: 'Autre', assertionIds: [] };
    }))).toMatch(/cadre exact de la réponse/);
  });
  it('autorise seulement le résumé proposé régénéré sur le cadre parent inchangé', () => {
    const regenerated = structuredClone(good) as unknown as Record<string, any>;
    const interpretation = { ...request.readingContext.interpretation, id: 'interp-new', text: 'Résumé proposé depuis les termes retenus.' };
    regenerated.reference = 'record-ref-regenerated';
    regenerated.readingContext.interpretation = interpretation;
    regenerated.outcome.answerSnapshot.requestSnapshot.interpretation = interpretation;
    expect(verifyRecordResultV4(expectation, regenerated)).toBeNull();
    const falselyUserAuthored = structuredClone(regenerated);
    falselyUserAuthored.readingContext.interpretation.origin = 'user';
    falselyUserAuthored.outcome.answerSnapshot.requestSnapshot.interpretation.origin = 'user';
    expect(verifyRecordResultV4(expectation, falselyUserAuthored)).toMatch(/résumé de lecture/);
  });
  it('refuse un dossier au motif ou au registre différent', () => {
    const dossierRequest: DossierRequest = { commandId: 'cmd-d', expectedRecordReference: base.reference, expectedLedgerReference: base.ledger.reference,
      expectedAnswerReference: 'answer-ref-record-a', expectedInterpretationReference: 'interpretation-ref-record-a', strategyId: 's-comp',
      expectedStrategyReference: 'strategy-ref:s-comp', motive: 'Motif exact' };
    expect(verifyDossierResultV4(dossierRequest, makeDossier(base, dossierRequest))).toBeNull();
    expect(verifyDossierResultV4(dossierRequest, makeDossier(base, { ...dossierRequest, motive: 'Autre motif' }))).toMatch(/motif conservé/);
    expect(verifyDossierResultV4(dossierRequest, makeDossier(base, { ...dossierRequest, expectedLedgerReference: 'ledger-x' }))).toMatch(/ne correspond pas/);
  });
});
