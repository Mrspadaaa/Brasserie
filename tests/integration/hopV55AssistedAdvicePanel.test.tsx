import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import type { CompareHopV55AssistedContextAtReceptionResult } from '../../src/services/hopV55/assistedAdviceContext';
import { interpolateColdHopBuReference } from '../../src/domain/hopDecision/coldIbuReference';
import { readAssistedColdContactEvidence } from '../../src/services/hopV55/assistedColdContactEvidence';
import type { PrepareHopV55AssistedAdviceResult } from '../../src/services/hopV55/assistedAdviceProposal';
import { AssistedAdvicePanel } from '../../src/ui/hopV55/AssistedAdvicePanel';

afterEach(() => cleanup());

const question = 'Ma bière est trop douce. Puis-je comparer le houblon floral tout en gardant la poire ?';
const sourceReadingReference = 'reading:assisted-panel-A';
const exactSpan = { start: question.indexOf('houblon floral'), end: question.indexOf('houblon floral') + 'houblon floral'.length, text: 'houblon floral' };
const localIntent: HopPropertyAdviceIntentV3 = {
  id: 'intent:floral', property: 'aroma', label: 'floral', role: 'reportedObservation', direction: null,
  qualification: null, required: false, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
  subject: { kind: 'beer', label: 'Ma bière', materialId: null, sensoryContext: 'beer' }, sourceSpans: [exactSpan],
  interpretationOrigin: 'user', basis: 'Constat issu de la lecture locale.', relatedIntentIds: [],
};
const proposedIntent: HopPropertyAdviceIntentV3 = {
  ...localIntent, property: 'bitterness', role: 'investigation', direction: 'investigate', label: 'Comparer le floral',
  qualification: 'Sans conclure à une hausse d’amertume.', interpretationOrigin: 'proposal',
  basis: 'Proposition à examiner avec le brasseur.',
};

const contextCheck = (): CompareHopV55AssistedContextAtReceptionResult => ({
  history: { status: 'matched', catalogueDependenciesChanged: false, calculationDependenciesChanged: false,
    runtimeDataRevisionChanged: false, stockAvailabilityChanged: false },
  applicability: { status: 'current', recalculationRequired: false, catalogueDependenciesChanged: false,
    calculationDependenciesChanged: false, runtimeDataRevisionChanged: false, stockAvailabilityChanged: false },
  stage: 'reception', historicalSourceReadingReference: sourceReadingReference, currentSourceReadingReference: 'reading:assisted-panel-B',
});

const missingColdEvidence = readAssistedColdContactEvidence({ id: 'E-cold-unknown', name: 'cold_contact_bitterness_reference',
  data: interpolateColdHopBuReference({ dose: { value: null, unit: 'g/L' } }) });

function readyResult(): Extract<PrepareHopV55AssistedAdviceResult, { status: 'ready' }> {
  const requestSnapshot = { id: 'request:assisted-panel', originalQuestion: question,
    interpretation: { id: 'reading:local', version: 'v4', origin: 'user', text: 'Constat local conservé.' },
    propertyIntents: [localIntent], candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucun houblon choisi.' },
    context: {}, exclusions: [], materials: [] };
  const requestDraft = { requestSnapshot, reference: 'draft:assisted-panel' };
  const suggestion = { kind: 'revise' as const, annotationId: localIntent.id, proposedIntent, reason: 'Direction à confirmer.' };
  const envelope = {
    request: { question, sourceReadingReference, contextLaunch: {} },
    proposal: {
      annotations: [{ id: localIntent.id, spans: [exactSpan], reading: {} }], scopes: [],
      answer: { summary: 'Comparer cette piste sans l’appliquer.', readingNote: 'La lecture assistée reste une proposition.',
        options: [{ id: 'option:compare', kind: 'investigation', title: 'Comparer séparément',
          rationale: 'Le résultat du protocole froid ne décide pas de l’IBU de la cible.', conditions: ['Dose connue pour lire la courbe.'],
          tradeoffs: ['La référence est propre au protocole publié.'], relatedIds: [localIntent.id], evidenceIds: ['E-source'],
          provenance: 'documentaryReference' }], unknowns: [{ id: 'unknown:dose', question: 'Quelle dose sera utilisée ?',
          changesChoice: 'Elle détermine si un point du protocole est consultable.', relatedIds: [localIntent.id] }],
        program: { kind: 'none', note: 'Aucun programme préparé.', qualification: 'none', operational: 'notProvided' },
        refusals: [{ text: 'Aucune valeur ne prédit l’IBU de la bière cible.', relatedIds: [] }] },
    },
  };
  return {
    status: 'ready', envelope: envelope as never, contextCheck: contextCheck(), readerDraft: requestDraft as never,
    assistedDraft: { requestSnapshot: { ...requestSnapshot, propertyIntents: [proposedIntent] } } as never,
    changedFromReader: true,
    annotations: [{ id: localIntent.id, source: 'reader', disposition: 'revised', intent: proposedIntent,
      proposedIntent, reason: 'Direction proposée; garde de poire conservée.' }],
    conflicts: [{ annotationId: localIntent.id, kind: 'hypotheticalObservation', resolved: true }], scopeDrafts: [],
    openQuestions: [{ id: 'open:dose', kind: 'conditionalRisk', spans: [exactSpan], restatement: 'La dose reste à préciser.',
      whyOpen: 'Aucune dose n’est déclarée.', relatedIds: [localIntent.id] }],
    materials: [{ id: 'material:floral', span: exactSpan, identity: 'personalUnidentified', candidates: [], note: 'Identité non confirmée.' }],
    answer: envelope.proposal.answer, evidenceRecords: [{ id: 'E-source', tool: 'lookup_hop_reference', label: 'Référence reçue', kind: 'reference' }],
    coldContactEvidence: [missingColdEvidence], v4Suggestions: [suggestion], notes: ['Lecture exacte attachée à la source archivée A.'],
  };
}

function renderPanel(options: {
  result?: PrepareHopV55AssistedAdviceResult;
  readOnly?: boolean;
  check?: CompareHopV55AssistedContextAtReceptionResult;
  onConfirmSuggestion?: (input: { suggestion: unknown; confirmation: unknown; commandId: string }) => Promise<void>;
} = {}) {
  return render(<AssistedAdvicePanel result={options.result ?? readyResult()} question={question}
    sourceReadingReference={sourceReadingReference} contextCheckAtReception={options.check ?? contextCheck()}
    readOnly={options.readOnly ?? false} onConfirmSuggestion={options.onConfirmSuggestion as never} />);
}

describe('panneau de proposition assistée', () => {
  it('garde la question et les références exactes, sépare lecture locale, proposition, preuves et réserves', async () => {
    const result = readyResult();
    const onConfirmSuggestion = vi.fn(async () => {});
    renderPanel({ result, onConfirmSuggestion });
    expect(screen.getByLabelText('Question originale conservée')).toHaveTextContent(question);
    expect(screen.getByLabelText('Lecture d’origine et contexte actuel')).toHaveTextContent('Correspond à la lecture de départ');
    expect(screen.getByLabelText('Lecture d’origine et contexte actuel')).toHaveTextContent('Applicable au contexte actuel');
    expect(screen.getByLabelText('Lecture d’origine et contexte actuel')).toHaveTextContent('La proposition peut être présentée pour une confirmation individuelle.');
    expect(screen.getByText('Proposition à examiner')).toBeInTheDocument();
    expect(screen.getByText('Lecture locale A')).toBeInTheDocument();
    expect(screen.getByText('Projection assistée')).toBeInTheDocument();
    expect(screen.getByText('Comparer séparément')).toBeInTheDocument();
    expect(screen.getByText('La dose reste à préciser.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Impact of static dry-hopping/ })).toHaveAttribute('href', 'https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517');
    expect(screen.getByText('Dose inconnue')).toBeInTheDocument();
    expect(screen.getByText('Aucune valeur BU n’est attribuée à une dose inconnue.')).toBeInTheDocument();
    expect(screen.getByText('Aucune valeur ne prédit l’IBU de la bière cible.')).toBeInTheDocument();
    expect(onConfirmSuggestion).not.toHaveBeenCalled();
  });

  it('ne confirme pas au montage ni sur simple saisie de motif; retry réutilise le même acte et succès bloque un second envoi', async () => {
    const user = userEvent.setup();
    const requests: Array<{ suggestion: unknown; confirmation: unknown; commandId: string }> = [];
    let failOnce = true;
    const onConfirmSuggestion = vi.fn(async (request: { suggestion: unknown; confirmation: unknown; commandId: string }) => {
      requests.push(structuredClone(request));
      if (failOnce) { failOnce = false; throw new Error('Reprise de confirmation fixture.'); }
    });
    renderPanel({ onConfirmSuggestion });
    expect(onConfirmSuggestion).not.toHaveBeenCalled();
    const button = screen.getByRole('button', { name: 'Réviser ce terme' });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText(`Motif de confirmation · ${localIntent.id}`), 'Je confirme cette correction individuelle.');
    expect(button).toBeDisabled();
    await user.click(screen.getByLabelText(`Confirmer explicitement · ${localIntent.id}`));
    await user.click(screen.getByRole('button', { name: 'Réviser ce terme' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Reprise de confirmation fixture.');
    const retry = screen.getByRole('button', { name: 'Réessayer la même confirmation' });
    await user.click(retry);
    expect(await screen.findByRole('status')).toHaveTextContent('Confirmation transmise pour cette annotation.');
    expect(onConfirmSuggestion).toHaveBeenCalledTimes(2);
    expect(requests[1]).toEqual(requests[0]);
    expect(requests[0].commandId).toMatch(/^assisted-v4:/);
    expect(requests[0].confirmation).toMatchObject({ kind: 'brewerConfirmation', reason: 'Je confirme cette correction individuelle.' });
    expect(screen.queryByRole('button', { name: 'Réviser ce terme' })).not.toBeInTheDocument();
    expect(onConfirmSuggestion).toHaveBeenCalledTimes(2);
  });

  it('laisse un résultat historique ou devenu périmé en lecture seule', () => {
    const onConfirmSuggestion = vi.fn(async () => {});
    const staleCheck = contextCheck();
    staleCheck.applicability = { status: 'stale', conflicts: ['La source actuelle diffère de A.'], reason: 'La source a changé depuis la réponse.' };
    const oldResult = readyResult();
    const historicalCheck = contextCheck();
    const historicalSnapshot = structuredClone(historicalCheck);
    renderPanel({ result: oldResult, readOnly: true, check: historicalCheck, onConfirmSuggestion });
    expect(screen.getByText('Lecture seule')).toBeInTheDocument();
    const archivedContext = screen.getByLabelText('Lecture d’origine et contexte à la réception');
    expect(archivedContext).toHaveTextContent('Contexte à la réception');
    expect(archivedContext).toHaveTextContent('Statut enregistré · applicable à la réception');
    expect(archivedContext).toHaveTextContent('Cette vérification est figée à la réception');
    expect(archivedContext).not.toHaveTextContent('Applicable au contexte actuel');
    expect(archivedContext).not.toHaveTextContent('peut être présentée pour une confirmation');
    fireEvent.click(within(archivedContext).getByText('Références exactes A et B'));
    expect(archivedContext).toHaveTextContent(sourceReadingReference);
    expect(archivedContext).toHaveTextContent('reading:assisted-panel-B');
    expect(archivedContext).toHaveTextContent('Contexte à la réception B');
    expect(archivedContext).not.toHaveTextContent('Contexte actuel B');
    expect(historicalCheck).toEqual(historicalSnapshot);
    expect(screen.getByRole('button', { name: 'Réviser ce terme' })).toBeDisabled();
    expect(onConfirmSuggestion).not.toHaveBeenCalled();

    cleanup();
    renderPanel({ result: readyResult(), check: staleCheck, onConfirmSuggestion });
    expect(screen.getByText('Le contexte a changé; cette proposition reste consultable sans action.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réviser ce terme' })).toBeDisabled();
    expect(onConfirmSuggestion).not.toHaveBeenCalled();
  });

  it('une proposition périmée n’affiche pas de réponse ni de métrique reconstruite', () => {
    renderPanel({ result: { status: 'stale', reason: 'La lecture d’origine ne correspond plus.' } });
    expect(screen.getByLabelText('Question originale conservée')).toHaveTextContent(question);
    expect(screen.getByText('La lecture d’origine ne correspond plus.')).toBeInTheDocument();
    expect(screen.queryByText('Comparer séparément')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('BU du protocole de référence')).not.toBeInTheDocument();
  });
});
