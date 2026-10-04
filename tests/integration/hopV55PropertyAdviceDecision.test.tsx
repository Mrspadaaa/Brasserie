import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildHopPropertyAdvice } from '../../src/domain/hopDecision/propertyAdvice';
import { createHopPropertyAdviceDossier, type HopPropertyAdviceRequest } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { getHopPropertyAdviceCorpus } from '../../src/domain/hopDecision/propertyAdviceEvidence';
import { HopV55PropertyAdviceDecision, type HopV55PropertyAdviceDossierSaveRequest,
  type HopV55PropertyAdviceReinterpretRequest } from '../../src/ui/hopV55/PropertyAdviceDecision';

function span(question: string, text: string) {
  const start = question.indexOf(text);
  if (start < 0) throw Error(`Fragment absent de la fixture : ${text}`);
  return { start, end: start + text.length, text };
}

function request(): HopPropertyAdviceRequest {
  const originalQuestion = 'Je veux un arôme intense avec une amertume légère; examiner une contribution de culture et préserver l’odeur résineuse de mon houblon maison.';
  const intent = (input: Omit<HopPropertyAdviceRequest['propertyIntents'][number], 'sourceSpans'>, fragments: string[]) => ({
    ...input, sourceSpans: fragments.map((text) => span(originalQuestion, text)),
  });
  const unknownAccess = () => ({ state: 'unknown' as const, basis: 'Accès non déclaré dans cette fixture.', assertionIds: [] });
  return {
    format: 'hop-documentary-request-v2', id: 'property-advice-panel-fixture', originalQuestion,
    interpretation: { id: 'property-advice-reading-fixture', version: 'fixture-1', origin: 'proposal',
      text: 'Cibles qualitatives et question d’investigation séparées; aucune mesure actuelle ajoutée.' },
    propertyIntents: [
      intent({ id: 'intent-aroma', property: 'aroma', label: 'arôme', role: 'target', direction: 'increase',
        qualification: 'intense', required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
        subject: { kind: 'beer', label: 'Bière à concevoir', materialId: null, sensoryContext: 'beer' },
        interpretationOrigin: 'fixture', basis: 'Cible qualitative; aucun niveau sensoriel mesuré.', relatedIntentIds: [] }, ['arôme intense']),
      intent({ id: 'intent-bitterness', property: 'bitterness', label: 'amertume', role: 'target', direction: null,
        qualification: 'légère', required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
        subject: { kind: 'beer', label: 'Bière à concevoir', materialId: null, sensoryContext: 'beer' },
        interpretationOrigin: 'fixture', basis: 'Cible qualitative; aucune valeur IBU ajoutée.', relatedIntentIds: [] }, ['amertume légère']),
      intent({ id: 'intent-bio', property: 'bioContribution', label: 'contribution de culture', role: 'investigation', direction: 'investigate',
        qualification: null, required: true, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified',
        subject: { kind: 'culture', label: 'Culture non identifiée', materialId: null, sensoryContext: 'unspecified' },
        interpretationOrigin: 'fixture', basis: 'Question exploratoire; aucun effet fermentaire affirmé.', relatedIntentIds: [] }, ['contribution de culture']),
      intent({ id: 'intent-material', property: 'materialCharacter', familyId: 'resin', label: 'odeur résineuse', role: 'reportedObservation', direction: null,
        qualification: null, required: false, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
        subject: { kind: 'material', label: 'Houblon maison', materialId: null, sensoryContext: 'rawHop' },
        interpretationOrigin: 'fixture', basis: 'Observation de matière sans identité liée ni analyse.', relatedIntentIds: [] }, ['odeur résineuse']),
    ],
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière choisie dans cette fixture; les options restent documentaires.' },
    context: { stage: 'planning', stageBasis: 'Projet explicitement planifié dans la fixture.', assertions: [{ id: 'assertion-fixture-stage',
      subject: 'batch-stage', statement: 'Projet planifié dans cette fixture.', state: 'reported', value: 'planning', dimension: 'process',
      source: { title: 'Contexte de fixture', author: 'Test local', year: null, kind: 'judgment', reference: 'fixture:property-advice-stage', locator: 'Source préparée synthétique.' } }],
      access: { bulkBeer: unknownAccess(), sampling: unknownAccess(), separatePortion: unknownAccess() } },
    exclusions: [], materials: [],
  };
}

afterEach(() => cleanup());

function makeAnswer() { return buildHopPropertyAdvice(request()); }

describe('renderer PropertyAdvice V2 · couche candidate, non activée dans Page', () => {
  it('affiche la réponse directe puis les voies, avec détails conservés et inventaire après les stratégies', () => {
    const answer = makeAnswer();
    const view = render(<HopV55PropertyAdviceDecision answer={answer} answerRecordReference="answer-record:fixture" />);
    const body = view.container.querySelector('.hv-property-body');
    const strategySection = view.container.querySelector('.hv-property-strategies');
    const contextSection = view.container.querySelector('.hv-property-context');
    const coverageSection = view.container.querySelector('.hv-property-coverage-section');
    const candidateSection = view.container.querySelector('.hv-property-candidates-section');
    expect(view.container.querySelectorAll('.hv-property-section').item(0)).toBe(body);
    expect(view.container.querySelectorAll('.hv-property-section').item(1)).toBe(strategySection);
    expect(body!.compareDocumentPosition(strategySection!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(strategySection!.compareDocumentPosition(candidateSection!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(strategySection!.compareDocumentPosition(contextSection!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(contextSection!.compareDocumentPosition(coverageSection!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(coverageSection!.compareDocumentPosition(candidateSection!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(view.container.querySelector('.hv-property-body-more')).toHaveTextContent('Autres passages de la réponse');
    expect(view.container.querySelector('.hv-property-body-more')).not.toHaveAttribute('open');
    for (const paragraph of answer.body) expect(view.container).toHaveTextContent(paragraph.text);
    expect(screen.getByRole('heading', { name: 'Réponse documentaire' })).toBeInTheDocument();
    expect(screen.getByText('Question originale conservée')).toBeInTheDocument();
    expect(screen.getByText(answer.requestSnapshot.originalQuestion)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Réponse et raisons' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Portée de la réponse' })).toBeInTheDocument();
    expect(screen.getByText('Contexte source')).toBeInTheDocument();
    expect(screen.getByText('Stade fourni par la source')).toBeInTheDocument();
    expect(screen.getByText('Planification')).toBeInTheDocument();
    expect(screen.getAllByText('Inconnu / non déclaré').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Arôme · Cible qualitative · arôme · intense').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contribution de culture · Question à examiner · contribution de culture').length).toBeGreaterThan(0);
    expect(screen.getByText('Contexte conservé')).toBeInTheDocument();
    expect(answer.strategies.some((row) => row.contribution === 'option')).toBe(true);
    expect(answer.strategies.some((row) => row.contribution === 'investigation')).toBe(true);
    expect(answer.strategies.some((row) => row.contribution === 'characterization')).toBe(true);
    for (const strategy of answer.strategies) {
      const strategyCard = view.container.querySelectorAll('.hv-property-strategy')[answer.strategies.indexOf(strategy)]!;
      expect(strategyCard.querySelectorAll('.hv-property-effects > article')).toHaveLength(answer.requestSnapshot.propertyIntents.length);
      expect(strategyCard).toHaveTextContent('Suite du choix');
      expect(strategyCard).toHaveTextContent(strategy.scope === 'futureBrew' ? 'Brassin futur · aucun programme fourni' : 'Aucune opération fournie');
      expect(strategyCard).not.toHaveTextContent('Programme à préparer');
      expect(within(strategyCard).queryByRole('button', { name: /appliquer|recette|brassage/i })).not.toBeInTheDocument();
    }
  });

  it('ajoute une intention issue d’un fragment exact au draft sans réécrire les intentions existantes', async () => {
    const user = userEvent.setup();
    const answer = makeAnswer();
    let persistedAnswer = answer;
    const onReinterpret = vi.fn(async (input: HopV55PropertyAdviceReinterpretRequest) => {
      persistedAnswer = buildHopPropertyAdvice(input.request, answer.corpusSnapshot);
      return { kind: 'revision' as const, answer: persistedAnswer, answerRecordReference: 'answer-record:append-intent' };
    });
    render(<HopV55PropertyAdviceDecision answer={answer} answerRecordReference="answer-record:append-source" onReinterpret={onReinterpret} />);
    await user.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    await user.click(screen.getByText('Ajouter un terme oublié, depuis un passage exact de la question'));
    await user.type(screen.getByLabelText('Fragment exact à annoter'), 'l’odeur résineuse');
    await user.selectOptions(screen.getByLabelText('Propriété de la nouvelle intention'), 'aroma');
    await user.selectOptions(screen.getByLabelText('Rôle de la nouvelle intention'), 'target');
    await user.selectOptions(screen.getByLabelText('Direction de la nouvelle intention'), 'increase');
    await user.selectOptions(screen.getByLabelText('Base de comparaison de la nouvelle intention'), 'qualitativeTarget');
    await user.selectOptions(screen.getByLabelText('Sujet de la nouvelle intention'), 'beer');
    await user.type(screen.getByLabelText('Libellé du sujet de la nouvelle intention'), 'Bière visée');
    await user.type(screen.getByLabelText('Motif de la nouvelle intention'), 'Question additionnelle explicitement attachée au fragment source.');
    await user.click(screen.getByRole('button', { name: 'Ajouter cette intention à la lecture' }));
    expect(await screen.findByText('Terme ajouté à la lecture à valider; rien n’est enregistré avant la nouvelle réponse.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Lecture corrigée'), 'Lecture enrichie par une intention user distincte.');
    await user.type(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), 'Ajouter la cible formulée dans un fragment exact.');
    await user.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    await waitFor(() => expect(onReinterpret).toHaveBeenCalledTimes(1));

    const submitted = onReinterpret.mock.calls[0][0].request;
    expect(submitted.propertyIntents).toHaveLength(answer.requestSnapshot.propertyIntents.length + 1);
    expect(submitted.propertyIntents.slice(0, answer.requestSnapshot.propertyIntents.length)).toEqual(answer.requestSnapshot.propertyIntents);
    const added = submitted.propertyIntents.at(-1)!;
    const start = answer.requestSnapshot.originalQuestion.indexOf('l’odeur résineuse');
    expect(added).toMatchObject({ property: 'aroma', role: 'target', direction: 'increase', interpretationOrigin: 'user',
      label: 'l’odeur résineuse', sourceSpans: [{ start, end: start + 'l’odeur résineuse'.length, text: 'l’odeur résineuse' }] });
    expect(persistedAnswer.requestSnapshot.propertyIntents.at(-1)?.id).toBe(added.id);
  });

  it('conserve le même commandId et les références exactes après un échec de sauvegarde', async () => {
    const user = userEvent.setup();
    const answer = makeAnswer();
    const answerRecordReference = 'answer-record:property-v2-stable';
    const strategy = answer.strategies.find((row) => row.preparation.documentaryDossier.status === 'available');
    expect(strategy).toBeTruthy();
    let attempts = 0;
    const onSaveDossier = vi.fn(async (input: HopV55PropertyAdviceDossierSaveRequest) => {
      attempts += 1;
      if (attempts === 1) throw Error('CAS indisponible, commande non confirmée.');
      return createHopPropertyAdviceDossier({ id: input.commandId, answer,
        expectedAnswerReference: input.expectedAnswerReference, expectedInterpretationReference: input.expectedInterpretationReference,
        strategyId: input.strategyId, expectedStrategyReference: input.expectedStrategyReference,
        motive: input.motive, createdAt: '2026-10-03T12:00:00.000Z', createdBy: { origin: 'user', label: 'Brasseur fixture' } });
    });
    const view = render(<HopV55PropertyAdviceDecision answer={answer} answerRecordReference={answerRecordReference} onSaveDossier={onSaveDossier} />);
    const strategyCard = [...view.container.querySelectorAll('.hv-property-strategy')]
      .find((node) => node.querySelector('h4')?.textContent === strategy!.title)!;
    await user.type(within(strategyCard).getByLabelText('Pourquoi conserver ce dossier documentaire ?'), 'Conserver cette piste et ses limites avant une comparaison ultérieure.');
    await user.click(within(strategyCard).getByRole('button', { name: 'Conserver ce dossier documentaire' }));
    expect(await screen.findByText('CAS indisponible, commande non confirmée.')).toBeInTheDocument();
    const firstRequest = onSaveDossier.mock.calls[0][0];
    expect(firstRequest.expectedAnswerRecordReference).toBe(answerRecordReference);
    expect(firstRequest.expectedAnswerReference).toBe(answer.reference);
    expect(firstRequest.expectedInterpretationReference).toBe(answer.interpretationReference);
    expect(firstRequest.strategyId).toBe(strategy!.id);
    expect(firstRequest.expectedStrategyReference).toBe(strategy!.reference);

    await user.click(screen.getByRole('button', { name: 'Réessayer le même choix' }));
    await waitFor(() => expect(onSaveDossier).toHaveBeenCalledTimes(2));
    expect(onSaveDossier.mock.calls[1][0]).toEqual(firstRequest);
    expect(screen.getByText('Dossier déjà conservé pour cette réponse et cette stratégie.')).toBeInTheDocument();
    expect(screen.getByText('Dossier documentaire conservé. Aucune opération, recette ou réservation n’a été créée.')).toBeInTheDocument();
  });

  it('garde le stade source figé dans la correction et archive l’ancienne réponse après un changement d’intention', async () => {
    const user = userEvent.setup();
    const answer = makeAnswer();
    let nextAnswer = answer;
    const onReinterpret = vi.fn(async (input: HopV55PropertyAdviceReinterpretRequest) => {
      nextAnswer = buildHopPropertyAdvice(input.request, answer.corpusSnapshot);
      return { kind: 'revision' as const, answer: nextAnswer, answerRecordReference: 'answer-record:property-v2-corrected' };
    });
    const view = render(<HopV55PropertyAdviceDecision answer={answer} answerRecordReference="answer-record:property-v2-original" onReinterpret={onReinterpret} />);
    await user.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    expect(screen.getByRole('group', { name: 'Stade source en lecture seule' })).toHaveTextContent('Planification');
    expect(screen.getByRole('group', { name: 'Stade source en lecture seule' })).toHaveTextContent(answer.requestSnapshot.context.stageBasis);
    const stageControls = [...view.container.querySelectorAll('input, textarea, select')]
      .filter((element) => /stade|phase/i.test(element.getAttribute('aria-label') ?? ''));
    expect(stageControls).toHaveLength(0);
    await user.selectOptions(screen.getByLabelText('Direction de l’intention 1'), 'keep');
    await user.selectOptions(screen.getByLabelText('Base de comparaison de l’intention 1'), 'current');
    const accessSection = view.container.querySelector('.hvp-access')!;
    const bulkAccessCard = [...accessSection.querySelectorAll('.hvp-access-card')]
      .find((node) => node.querySelector('strong')?.textContent === 'Bière entière')!;
    await user.click(within(bulkAccessCard).getByText('Corriger cet accès par une nouvelle déclaration'));
    await user.selectOptions(within(bulkAccessCard).getByLabelText('État d’accès Bière entière'), 'yes');
    await user.type(within(bulkAccessCard).getByLabelText('Motif d’accès Bière entière'), 'Déclaration explicite avant cet essai documentaire.');
    await user.type(within(bulkAccessCard).getByLabelText('Déclaration d’accès Bière entière'), 'J’ai accès au lot concerné.');
    await user.selectOptions(within(bulkAccessCard).getByLabelText('Accès Bière entière · Mode de source'), 'personal');
    await user.type(within(bulkAccessCard).getByLabelText('Accès Bière entière · Titre de la déclaration'), 'Accès déclaré');
    await user.type(within(bulkAccessCard).getByLabelText('Accès Bière entière · Acteur de la déclaration'), 'Brasseur test');
    await user.type(within(bulkAccessCard).getByLabelText('Accès Bière entière · Motif de la déclaration'), 'Le lot est physiquement accessible pour cette comparaison.');
    await user.click(within(bulkAccessCard).getByRole('button', { name: 'Ajouter cette attestation à la lecture' }));
    expect(screen.getByText('Nouvelle attestation ajoutée à la lecture à valider; la sauvegarde dépend du parent.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), 'Préciser la direction qualitative retenue.');
    await user.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    await waitFor(() => expect(onReinterpret).toHaveBeenCalledTimes(1));
    const corrected = onReinterpret.mock.calls[0][0];
    expect(corrected.expectedAnswerRecordReference).toBe('answer-record:property-v2-original');
    expect(corrected.expectedAnswerReference).toBe(answer.reference);
    expect(corrected.expectedInterpretationReference).toBe(answer.interpretationReference);
    expect(corrected.request.originalQuestion).toBe(answer.requestSnapshot.originalQuestion);
    expect(corrected.request.context.stage).toBe(answer.requestSnapshot.context.stage);
    expect(corrected.request.context.stageBasis).toBe(answer.requestSnapshot.context.stageBasis);
    expect(corrected.request.context.assertions.filter((assertion) => assertion.subject === 'batch-stage'))
      .toEqual(answer.requestSnapshot.context.assertions.filter((assertion) => assertion.subject === 'batch-stage'));
    const accessAssertion = corrected.request.context.assertions.find((assertion) => assertion.subject === 'bulkBeer');
    expect(accessAssertion).toMatchObject({ state: 'reported', value: true, statement: 'J’ai accès au lot concerné.' });
    expect(accessAssertion?.source).toMatchObject({ title: 'Accès déclaré', author: 'Brasseur test', kind: 'observation' });
    expect(accessAssertion?.source?.reference).toMatch(/^local-declaration:/);
    expect(corrected.request.context.access.bulkBeer).toMatchObject({ state: 'yes', assertionIds: [accessAssertion?.id] });
    expect(nextAnswer.reference).not.toBe(answer.reference);
    expect(screen.getByRole('button', { name: 'Ouvrir en lecture figée' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ouvrir en lecture figée' }));
    expect(screen.getByText('Réponse antérieure affichée en lecture seule; aucune synthèse n’a été reconstruite.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Corriger cette interprétation' })).not.toBeInTheDocument();
  });

  it('n’accepte un nouvel ID que pour un réexamen filié aux références exactes de la réponse source', async () => {
    const user = userEvent.setup();
    const answer = makeAnswer();
    const source = { answerRecordReference: 'answer-record:reexam-source', answerReference: answer.reference,
      interpretationReference: answer.interpretationReference, requestId: answer.requestSnapshot.id };
    let calls = 0;
    const onReinterpret = vi.fn(async (input: HopV55PropertyAdviceReinterpretRequest) => {
      calls += 1;
      const request = structuredClone(input.request);
      request.id = 'property-advice-panel-reexam-request';
      request.context.stage = 'hotSide';
      request.context.stageBasis = 'Source relue : nouveau stade chaud fourni par le contexte préparé.';
      request.context.assertions = [{ id: 'assertion-reexam-stage', subject: 'batch-stage',
        statement: 'Brassage chaud relu depuis la nouvelle source préparée.', state: 'reported', value: 'hotSide', dimension: 'process',
        source: { title: 'Contexte relu', author: 'Fixture locale', year: null, kind: 'judgment', reference: 'fixture:reexam-stage', locator: 'Stade fourni après réexamen.' } }];
      const reexamined = buildHopPropertyAdvice(request, answer.corpusSnapshot);
      return { kind: 'reexamination' as const, answer: reexamined, answerRecordReference: 'answer-record:reexam-result',
        source: calls === 1 ? { ...source, answerReference: 'answer-reference-stale' } : source };
    });
    render(<HopV55PropertyAdviceDecision answer={answer} answerRecordReference={source.answerRecordReference} onReinterpret={onReinterpret} />);
    await user.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    await user.type(screen.getByLabelText('Lecture corrigée'), 'Lecture corrigée avant la phase chaude.');
    await user.type(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), 'Relire la même question avec le contexte préparé actualisé.');
    await user.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Le réexamen ne correspond pas à la réponse et à la demande source choisies.');
    expect(screen.queryByRole('button', { name: 'Ouvrir en lecture figée' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    await waitFor(() => expect(onReinterpret).toHaveBeenCalledTimes(2));
    const sourceRequest = onReinterpret.mock.calls[1][0];
    expect(sourceRequest.expectedAnswerRecordReference).toBe(source.answerRecordReference);
    expect(sourceRequest.expectedAnswerReference).toBe(source.answerReference);
    expect(sourceRequest.expectedInterpretationReference).toBe(source.interpretationReference);
    await expect(onReinterpret.mock.results[1].value).resolves.toMatchObject({ kind: 'reexamination', answer: {
      requestSnapshot: { id: 'property-advice-panel-reexam-request', originalQuestion: answer.requestSnapshot.originalQuestion,
        context: { stage: 'hotSide', stageBasis: 'Source relue : nouveau stade chaud fourni par le contexte préparé.' } },
    }, source });
    expect(screen.getByText('Brassage chaud')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ouvrir en lecture figée' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ouvrir en lecture figée' }));
    expect(screen.getByRole('group', { name: 'Stade préparé et figé' })).toHaveTextContent('Planification');
  });

  it('reste en lecture seule quand le parent transmet une archive', () => {
    const answer = makeAnswer();
    const onSaveDossier = vi.fn(async () => { throw Error('ne doit pas être appelé'); });
    const onReinterpret = vi.fn(async () => { throw Error('ne doit pas être appelé'); });
    render(<HopV55PropertyAdviceDecision answer={answer} answerRecordReference="archive:read-only" readOnly
      onSaveDossier={onSaveDossier} onReinterpret={onReinterpret} />);
    expect(screen.getByText('Cette réponse est affichée en lecture seule.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Corriger cette interprétation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Conserver ce dossier documentaire' })).not.toBeInTheDocument();
    expect(onSaveDossier).not.toHaveBeenCalled();
    expect(onReinterpret).not.toHaveBeenCalled();
  });
});
