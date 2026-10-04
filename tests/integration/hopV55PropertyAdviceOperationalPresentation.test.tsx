import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { hopPropertyAdviceViewModelV3 } from '../../src/domain/hopDecision/propertyAdviceViewModel';
import type { HopPropertyAdviceIntentV3, HopPropertyAdviceRequestV3, HopPropertyAdviceAnswerV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { PropertyAdviceDecisionCore, type DecisionCoreAdapter } from '../../src/ui/hopV55/propertyAdviceDecisionCore';
import { HopV55PropertyAdviceDecisionV3 } from '../../src/ui/hopV55/PropertyAdviceDecisionV3';
import { makeHopPropertyCompensationRequestV3 } from '../fixtures/hopPropertyCompensation';

afterEach(() => cleanup());

function characterizationAnswer() {
  const request = makeHopPropertyCompensationRequestV3();
  const text = 'mon houblon';
  const start = request.originalQuestion.indexOf(text);
  const characterization: HopPropertyAdviceIntentV3 = {
    id: 'fixture:reported-hop-character', property: 'materialCharacter', label: text, role: 'reportedObservation', direction: null,
    qualification: null, required: false, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'material', label: 'Échantillon maison', materialId: null, sensoryContext: 'rawHop' },
    sourceSpans: [{ start, end: start + text.length, text }], interpretationOrigin: 'user',
    basis: 'Constat de fixture à caractériser sans attribuer une analyse ou un emploi.', relatedIntentIds: [],
  };
  return buildHopPropertyAdviceV3({ ...request, propertyIntents: [...request.propertyIntents, characterization] });
}

function strategyCard(container: HTMLElement, kind: string): HTMLElement {
  const card = [...container.querySelectorAll<HTMLElement>('.hv-property-strategy')]
    .find((row) => row.querySelector('h4')?.textContent === kind);
  if (!card) throw new Error(`Carte de stratégie absente : ${kind}`);
  return card;
}

describe('suite du choix opérationnelle · portée de la voie conservée', () => {
  it('présente une caractérisation documentaire sans programme/copie obligatoires et garde son motif canonique au détail', async () => {
    const answer = characterizationAnswer();
    const strategy = answer.strategies.find((row) => row.kind === 'material-characterization')!;
    expect(strategy).toMatchObject({ scope: 'documentation', intervention: 'none', contribution: 'characterization',
      preparation: { operational: { status: 'notProvided' } } });
    const view = render(<HopV55PropertyAdviceDecisionV3 answer={answer} answerRecordReference="record:characterization" />);
    const card = strategyCard(view.container, strategy.title);
    const withinCard = within(card);
    expect(withinCard.getByText('Aucune opération fournie')).toBeInTheDocument();
    expect(withinCard.getByText('Cette voie reste documentaire; elle ne demande ni programme ni copie de recette.')).toBeInTheDocument();
    expect(withinCard.queryByText(/programme à préparer|prépare.{0,20}copie de recette/iu)).not.toBeInTheDocument();
    const reason = withinCard.getByText('Pourquoi cette portée · documentation');
    expect(reason.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(reason);
    expect(withinCard.getByText(strategy.preparation.operational.reason)).toBeInTheDocument();
  });

  it('garde une option future conditionnelle au choix de poursuivre, sans annoncer un programme déjà fourni', () => {
    const answer = buildHopPropertyAdviceV3(makeHopPropertyCompensationRequestV3());
    const strategy = answer.strategies.find((row) => row.scope === 'futureBrew' && row.contribution === 'option')!;
    expect(strategy.preparation.operational.status).toBe('notProvided');
    const view = render(<HopV55PropertyAdviceDecisionV3 answer={answer} answerRecordReference="record:future-option" />);
    const card = within(strategyCard(view.container, strategy.title));
    expect(card.getByText('Brassin futur · aucun programme fourni')).toBeInTheDocument();
    expect(card.getByText('Tu peux préparer et vérifier un programme si tu choisis de poursuivre cette voie.')).toBeInTheDocument();
    expect(card.queryByText(/copie de recette|programme à préparer/iu)).not.toBeInTheDocument();
    expect(card.getByText('Pourquoi cette portée · brassage futur')).toBeInTheDocument();
  });

  it('conserve une voie opérationnelle reçue dans la projection sans la rabattre sur « aucune opération »', () => {
    const answer: HopPropertyAdviceAnswerV3 = buildHopPropertyAdviceV3(makeHopPropertyCompensationRequestV3());
    const view = structuredClone(hopPropertyAdviceViewModelV3(answer));
    const strategy = view.strategies.find((row) => row.scope === 'futureBrew' && row.contribution === 'option')!;
    strategy.preparation.operational = { status: 'requiresReceivedAdapter', adapterId: 'received-adapter:fixture',
      reason: 'Prévisualisation possible par le chemin reçu, après vérification du témoin et des conditions.' };
    const adapter: DecisionCoreAdapter<HopPropertyAdviceAnswerV3, HopPropertyAdviceRequestV3> = {
      versionLabel: 'V3', interpretationVersion: '2', viewModel: () => view,
      requestOf: (source) => structuredClone(source.requestSnapshot), renderEditor: () => <div />,
    };
    const result = render(<PropertyAdviceDecisionCore adapter={adapter} answer={answer} answerRecordReference="record:received-preview" />);
    const card = within(strategyCard(result.container, strategy.title));
    expect(card.getByText('Préparation opérationnelle possible')).toBeInTheDocument();
    expect(card.getByText('Une préparation peut s’ouvrir par cette voie après vérification des paramètres et conditions.')).toBeInTheDocument();
    expect(card.queryByText('Aucune opération fournie')).not.toBeInTheDocument();
    const reason = card.getByText('Pourquoi cette portée · brassage futur');
    fireEvent.click(reason);
    expect(card.getByText(strategy.preparation.operational.reason)).toBeInTheDocument();
    expect(card.getByText('received-adapter:fixture')).toBeInTheDocument();
  });
});
