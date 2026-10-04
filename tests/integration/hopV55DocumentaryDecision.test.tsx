import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import { buildHopDocumentaryAnswer } from '../../src/domain/hopDecision/documentaryAnswer';
import { createHopDocumentaryCorpus, createHopDocumentaryDossier, type HopDocumentaryRequest } from '../../src/domain/hopDecision/documentaryAnswerSchema';
import { getHopDocumentaryCorpus, HOP_DOCUMENTARY_CLAIM_IDS } from '../../src/domain/hopDecision/documentaryEvidence';
import { hopTestSource, hopTestVariety } from '../fixtures/hopIndex';
import { HopV55DocumentaryDecision, type HopV55DocumentaryDossierSaveRequest,
  type HopV55DocumentaryReinterpretRequest } from '../../src/ui/hopV55/DocumentaryDecision';

const source: HopSource = { ...hopTestSource, title: 'Description fabricant de fixture', reference: 'doc-decision:candidate-source' };

function variety(id: string, name: string, text: string): HopVariety {
  return { ...hopTestVariety(), id, name, descriptions: [{ text, context: 'beer', source }], analysis: [] };
}

function material(id: string, name: string, text: string): HopDecisionMaterial {
  const row = variety(id, name, text);
  return { id: `variety:${row.id}`, name: row.name, form: row.form, variety: row };
}

function makeRequest(materials: HopDecisionMaterial[]): HopDocumentaryRequest {
  return {
    format: 'hop-documentary-request-v1', id: 'documentary-decision-user-question',
    originalQuestion: 'Quelles pistes examiner pour une impression trop sucrée ? (formulation conservée verbatim)',
    interpretation: { id: 'reading-proposed-v1', version: '1', origin: 'proposal',
      text: 'Lecture proposée : rééquilibrer une perception, sans revendiquer un retrait de sucre.' },
    criteria: [
      { id: 'goal-balance', description: 'Rééquilibrer la sucrosité perçue.', role: 'seek', origin: 'user' },
      { id: 'fact-sweet', description: 'Impression sucrée rapportée par l’utilisateur.', role: 'observation', origin: 'user' },
    ],
    needs: [{ id: 'need-balance', kind: 'balancePerceivedSweetness', criterionIds: ['goal-balance', 'fact-sweet'],
      explanation: 'Comparer une piste de perception sans promettre une modification du sucre.', candidateIds: materials.map((row) => row.id) }],
    context: { stage: 'unknown', stageBasis: 'Stade non établi à partir du dossier transmis.',
      assertions: [{ id: 'stage-unknown', subject: 'batch-stage', statement: 'Aucun stade fourni.', state: 'unknown', value: null, dimension: 'process' },
        { id: 'bulk-unknown', subject: 'access.bulkBeer', statement: 'Accès au lot inconnu.', state: 'unknown', value: null, dimension: 'process' }],
      access: {
        bulkBeer: { state: 'unknown', basis: 'Accès au lot non déclaré.', assertionIds: [] },
        sampling: { state: 'unknown', basis: 'Accès au prélèvement non déclaré.', assertionIds: [] },
        separatePortion: { state: 'unknown', basis: 'Aucune portion séparée n’est déclarée.', assertionIds: [] },
      } },
    exclusions: [], materials: structuredClone(materials),
  };
}

afterEach(() => cleanup());

describe('synthèse documentaire au poste du brasseur', () => {
  it('affiche le corps et ses raisons avant les voies, distingue couverture/applicabilité/préparation et conserve un dossier exact', async () => {
    const user = userEvent.setup();
    const candidate = material('candidate-documentary-a', 'Candidat exact A', 'Mangue mûre et citron vert.');
    let currentAnswer = buildHopDocumentaryAnswer(makeRequest([candidate]));
    const onSaveDossier = vi.fn(async (input: HopV55DocumentaryDossierSaveRequest) => createHopDocumentaryDossier({
      id: 'dossier-documentary-fixture-1', answer: currentAnswer,
      expectedAnswerReference: input.expectedAnswerReference,
      expectedInterpretationReference: input.expectedInterpretationReference,
      routeId: input.routeId, expectedRouteReference: input.expectedRouteReference,
      motive: input.motive, createdAt: '2026-10-02T21:00:00.000Z', createdBy: { origin: 'user', label: 'Brasseuse fixture' },
    }));
    const onReinterpret = vi.fn(async (input: HopV55DocumentaryReinterpretRequest) => {
      currentAnswer = buildHopDocumentaryAnswer(input.request, currentAnswer.corpusSnapshot);
      return currentAnswer;
    });
    const onChooseCandidates = vi.fn(async (input: { expectedAnswerReference: string; needId: string; query: string; loadedMaterialIds: string[] }) => {
      expect(input.expectedAnswerReference).toBe(currentAnswer.reference);
      expect(input.needId).toBe('need-balance');
      expect(input.query).toBe('Candidat exact B');
      expect(input.loadedMaterialIds).toEqual([candidate.id]);
      return [material('candidate-documentary-b', 'Candidat exact B', 'Pamplemousse rose et herbe fraîche.')];
    });
    const answer = currentAnswer;
    const view = render(<HopV55DocumentaryDecision answer={answer} onSaveDossier={onSaveDossier}
      onReinterpret={onReinterpret} onChooseCandidates={onChooseCandidates} />);

    const body = view.container.querySelector('.hv-doc-answer');
    const routes = view.container.querySelector('.hv-doc-routes');
    const sections = [...view.container.querySelectorAll('.hv-doc-section')];
    expect(sections.indexOf(body!)).toBeLessThan(sections.indexOf(routes!));
    expect(screen.getByText(answer.requestSnapshot.originalQuestion)).toBeInTheDocument();
    expect(screen.queryByText(/version candidate/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Réponse directe et raisons' })).toBeInTheDocument();
    expect(screen.getByText(/Objectif de l’utilisateur/)).toBeInTheDocument();
    expect(screen.getByText(/Constat rapporté par l’utilisateur/)).toBeInTheDocument();
    expect(screen.getAllByText('Stade inconnu ou non établi')).toHaveLength(2);
    expect(screen.getAllByText('Inconnu / non déclaré').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(coverageLabelText(answer.coverage.status))).toBeInTheDocument();
    const coveragePoint = view.container.querySelector('.hv-doc-points article');
    expect(coveragePoint?.querySelector('b')).toHaveTextContent('Équilibre de sucrosité perçue');
    expect(coveragePoint?.querySelector(':scope > span')).toHaveTextContent('Rééquilibrer la sucrosité perçue. · Impression sucrée rapportée par l’utilisateur.');
    expect(coveragePoint?.querySelector('.hv-doc-coverage-detail')).toHaveTextContent(answer.coverage.points[0].reason);
    expect(coveragePoint?.querySelector('.hv-doc-coverage-detail code')).toBeInTheDocument();
    expect(screen.getAllByText(/Aucune suite opérationnelle fournie/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Extrait de source primaire/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Repère :/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/pas des matières ni des stocks/).length).toBeGreaterThan(0);

    const routeCard = view.container.querySelector('.hv-doc-route');
    expect(routeCard).toBeTruthy();
    fireEvent.change(within(routeCard!).getByLabelText('Pourquoi conserver ce dossier ?'), {
      target: { value: 'Garder la lecture documentaire et ses limites avant tout essai.' },
    });
    await user.click(within(routeCard!).getByRole('button', { name: 'Conserver ce dossier documentaire' }));
    await waitFor(() => expect(onSaveDossier).toHaveBeenCalledTimes(1));
    const saveRequest = onSaveDossier.mock.calls[0][0];
    expect(saveRequest.expectedAnswerReference).toBe(answer.reference);
    expect(saveRequest.expectedInterpretationReference).toBe(answer.interpretationReference);
    expect(saveRequest.routeId).toBe(answer.routes[0].id);
    expect(saveRequest.expectedRouteReference).toBe(answer.routes[0].reference);
    expect(screen.getByText(/Dossiers documentaires conservés/)).toBeInTheDocument();
    expect(screen.getByText(/Garder la lecture documentaire/)).toBeInTheDocument();
    expect(screen.getByText(/Aucune opération ni recette n’a été créée/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Corriger cette lecture' }));
    expect(screen.queryByLabelText('Stade documentaire')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Source ou raison du stade')).not.toBeInTheDocument();
    const immutableStage = screen.getByRole('group', { name: 'Stade fourni par la source' });
    expect(immutableStage).toHaveTextContent('Stade inconnu ou non établi');
    expect(immutableStage).toHaveTextContent(answer.requestSnapshot.context.stageBasis);
    expect(immutableStage).toHaveTextContent('Pour changer de phase, relis ou actualise la source de cette réponse.');
    await user.click(screen.getByText(/Matières exactes liées/));
    await user.type(screen.getByLabelText('Rechercher les candidats du besoin 1'), 'Candidat exact B');
    await user.click(screen.getByRole('button', { name: 'Choisir d’autres matières exactes dans les références chargées' }));
    await waitFor(() => expect(onChooseCandidates).toHaveBeenCalledTimes(1));
    await user.clear(screen.getByLabelText('Rechercher les candidats du besoin 1'));
    await user.type(screen.getByLabelText('Rechercher les candidats du besoin 1'), 'Candidat exact B');
    const newCandidate = await screen.findByLabelText(/Candidat exact B/);
    await user.click(newCandidate);

    await user.selectOptions(screen.getByLabelText('Type du besoin 1'), 'unresolved');
    await user.clear(screen.getByLabelText('Explication du besoin 1'));
    await user.type(screen.getByLabelText('Explication du besoin 1'), 'Le besoin doit rester à qualifier.');
    await user.selectOptions(screen.getByLabelText('État Accès au lot'), 'yes');
    expect(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' })).toBeDisabled();
    await user.click(screen.getByText('Ajouter un constat utilisateur sourcé'));
    expect(screen.queryByRole('option', { name: 'Stade' })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Accès constaté'), 'yes');
    await user.type(screen.getByLabelText('Texte du constat'), 'Le brasseur déclare un accès au lot pour cet examen.');
    await user.type(screen.getByLabelText('Titre de la source'), 'Déclaration du brasseur');
    await user.type(screen.getByLabelText('Repère de source'), 'Déclaration saisie le jour de la question.');
    await user.click(screen.getByRole('button', { name: 'Ajouter et rattacher explicitement ce constat' }));
    await user.type(screen.getByLabelText('Pourquoi corriger cette lecture ?'), 'Corriger le type de besoin et la portée d’accès rapportée.');
    const reinterpretButton = screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' });
    await waitFor(() => expect(reinterpretButton).toBeEnabled());
    await user.click(reinterpretButton);
    await waitFor(() => expect(onReinterpret).toHaveBeenCalledTimes(1));
    const correctedRequest = onReinterpret.mock.calls[0][0].request;
    expect(correctedRequest.originalQuestion).toBe(answer.requestSnapshot.originalQuestion);
    expect(correctedRequest.interpretation.origin).toBe('user');
    expect(correctedRequest.needs[0].kind).toBe('unresolved');
    expect(correctedRequest.needs[0].candidateIds).toContain('variety:candidate-documentary-b');
    expect(correctedRequest.materials.map((row) => row.id)).toEqual(['variety:candidate-documentary-a', 'variety:candidate-documentary-b']);
    expect(correctedRequest.context.stage).toBe(answer.requestSnapshot.context.stage);
    expect(correctedRequest.context.stageBasis).toBe(answer.requestSnapshot.context.stageBasis);
    expect(correctedRequest.context.assertions.filter((assertion) => assertion.subject === 'batch-stage'))
      .toEqual(answer.requestSnapshot.context.assertions.filter((assertion) => assertion.subject === 'batch-stage'));
    expect(correctedRequest.context.access.bulkBeer.state).toBe('yes');
    expect(correctedRequest.context.access.bulkBeer.assertionIds).toHaveLength(1);
    expect(correctedRequest.context.access.sampling.state).toBe('unknown');
    expect(correctedRequest.context.access.separatePortion.state).toBe('unknown');
    expect(onSaveDossier.mock.calls[0][0].expectedAnswerReference).toBe(answer.reference);
    expect(currentAnswer.reference).not.toBe(answer.reference);
    expect(currentAnswer.requestSnapshot.context.access.sampling.state).toBe('unknown');

    await user.click(screen.getByRole('button', { name: 'Ouvrir en lecture figée' }));
    expect(screen.getByText('Réponse antérieure en lecture figée. Aucune synthèse n’a été reconstruite.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Corriger cette lecture' })).not.toBeInTheDocument();
    const savedDossier = screen.getByText(/Dossiers documentaires conservés/);
    expect(savedDossier).toBeInTheDocument();
    expect(onSaveDossier).toHaveBeenCalledTimes(1);
  });

  it('reste en lecture seule quand le parent indique une archive', () => {
    const answer = buildHopDocumentaryAnswer(makeRequest([]));
    const onSaveDossier = vi.fn(async () => { throw Error('ne doit pas être appelé'); });
    const onReinterpret = vi.fn(async () => answer);
    render(<HopV55DocumentaryDecision answer={answer} readOnly onSaveDossier={onSaveDossier} onReinterpret={onReinterpret} />);
    expect(screen.getByText('Cette réponse est affichée en lecture seule.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Corriger cette lecture' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Conserver ce dossier documentaire' })).not.toBeInTheDocument();
    expect(onSaveDossier).not.toHaveBeenCalled();
    expect(onReinterpret).not.toHaveBeenCalled();
  });

  it('replie seulement une raison textuellement reprise par le corps et conserve son type visible', () => {
    const fullCorpus = getHopDocumentaryCorpus();
    const supportedClaim = fullCorpus.claims.find((row) => row.id === HOP_DOCUMENTARY_CLAIM_IDS.BITTERNESS_PERCEPTION);
    expect(supportedClaim).toBeTruthy();
    const corpus = createHopDocumentaryCorpus({ version: 'ui-duplicate-body-proof-v1',
      claims: [supportedClaim!], sources: fullCorpus.sources.filter((row) => supportedClaim!.sourceIds.includes(row.id)) });
    const answer = buildHopDocumentaryAnswer(makeRequest([]), corpus);
    const duplicateParagraph = answer.body.find((paragraph) => paragraph.argumentIds.some((id) => {
      const argument = answer.arguments.find((row) => row.id === id);
      return argument && sameDisplayTextForTest(paragraph.text, argument.text);
    }));
    expect(duplicateParagraph).toBeTruthy();
    const duplicateArgument = duplicateParagraph?.argumentIds.map((id) => answer.arguments.find((row) => row.id === id))
      .find((row) => row && sameDisplayTextForTest(duplicateParagraph.text, row.text));
    expect(duplicateArgument).toBeTruthy();

    const view = render(<HopV55DocumentaryDecision answer={answer} />);
    const bodyParagraph = [...view.container.querySelectorAll('.hv-doc-body-paragraph')]
      .find((node) => node.querySelector(':scope > p')?.textContent === duplicateParagraph?.text);
    const duplicateCard = bodyParagraph?.querySelector(`.hv-doc-kind-${duplicateArgument?.kind}`)?.closest('.hv-doc-argument');
    expect(duplicateCard?.querySelector('.hv-doc-kind')).toHaveTextContent('Inférence conditionnelle');
    expect(duplicateCard?.querySelector('.hv-doc-argument-development summary')).toHaveTextContent('Développement de cette raison');
    expect(duplicateCard?.querySelector('.hv-doc-argument-development p')).toHaveTextContent(duplicateArgument!.text);
    expect(duplicateCard?.querySelector(':scope > p')).toBeNull();
    const goalCard = view.container.querySelector('.hv-doc-answer .hv-doc-kind-userGoal')?.closest('.hv-doc-argument');
    expect(goalCard?.querySelector(':scope > p')).toBeInTheDocument();
  });
});

function coverageLabelText(status: HopDocumentaryAnswer['coverage']['status']): string {
  return status === 'answered' ? 'Réponse dans le domaine fourni' : status === 'partial' ? 'Réponse partielle · lacunes nommées' : 'Hors du domaine de réponse';
}

function sameDisplayTextForTest(left: string, right: string): boolean {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/[.!?…]+$/u, '').toLocaleLowerCase('fr-CH');
  return normalize(left) === normalize(right);
}
