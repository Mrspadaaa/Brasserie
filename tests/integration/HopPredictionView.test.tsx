import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { predictHopTriplet } from '../../functions/src/hopPredictionCore';
import { HopPredictionView } from '../../src/ui/hopIndex/HopPredictionView';
import { hopDoseLabel, hopDurationLabel, hopRangeLabel } from '../../src/ui/hopIndex/presentation';
import { testHopAxis, testHopData, testHopTriplet } from '../fixtures/hopPrediction';

const target = { citrus: { min: 7, max: 8 } };

describe('Lecture des prédictions aromatiques', () => {
  it('affiche la dose en français, une durée lisible et le nom de levure connu sans inventer son association', () => {
    const triplet = { ...testHopTriplet, doseGL: 7 / 12, contactHours: 95 / 60, temperatureC: null, yeastId: null };
    const prediction = predictHopTriplet(triplet, target, testHopData());
    const before = structuredClone(prediction);
    render(<HopPredictionView prediction={prediction} axes={[testHopAxis]} target={target} names={{ variety: 'Citra', yeast: 'US-05' }} />);

    expect(screen.getByText(/Citra/)).toHaveTextContent('Citra × US-05');
    expect(screen.getByText('Levure non associée à l’index')).toBeInTheDocument();
    expect(screen.getByLabelText('Conditions de houblonnage')).toHaveTextContent('0,58 g/L · Température non précisée · 1 h 35 min');
    expect(screen.queryByText('Levure inconnue')).not.toBeInTheDocument();
    expect(prediction).toEqual(before);
  });

  it('nomme les informations absentes sans les remplacer par zéro ou un point d’interrogation', () => {
    const prediction = predictHopTriplet({ ...testHopTriplet, varietyId: null, yeastId: null, timing: null, doseGL: null, temperatureC: null, contactHours: null }, target, testHopData());
    render(<HopPredictionView prediction={prediction} axes={[]} target={target} />);

    expect(screen.getByText(/Houblon non renseigné/)).toHaveTextContent('Houblon non renseigné × Levure non renseignée');
    expect(screen.getByText('Moment d’ajout non précisé')).toBeInTheDocument();
    expect(screen.getByLabelText('Conditions de houblonnage')).toHaveTextContent('Dose non précisée · Température non précisée · Durée non précisée');
    expect(screen.queryByText('Référence variété')).not.toBeInTheDocument();
  });

  it('distingue une cible absente alors qu’un modèle existe', () => {
    const prediction = predictHopTriplet(testHopTriplet, {}, testHopData());
    render(<HopPredictionView prediction={prediction} axes={[]} target={{}} />);
    const card = within(screen.getByLabelText('Adéquation au profil recherché'));

    expect(card.getByText('Aucun objectif aromatique')).toBeInTheDocument();
    expect(card.getByText('Définissez un profil recherché pour calculer son adéquation.')).toBeInTheDocument();
    expect(card.queryByText('Aucun modèle applicable')).not.toBeInTheDocument();
  });

  it('signale un modèle absent pour une cible renseignée sans demander de renseigner cette cible', () => {
    const data = testHopData(); data.knowledge = data.knowledge.filter(k => k.kind !== 'model');
    const prediction = predictHopTriplet(testHopTriplet, target, data);
    render(<HopPredictionView prediction={prediction} axes={[]} target={target} />);
    const card = within(screen.getByLabelText('Adéquation au profil recherché'));

    expect(card.getByText('Aucun modèle applicable')).toBeInTheDocument();
    expect(card.getByText('Aucun modèle documenté ne couvre ce houblon, cette levure et ces conditions.')).toBeInTheDocument();
    expect(card.queryByText(/Définissez un profil/)).not.toBeInTheDocument();
  });

  it('garde visibles les deux limites si la cible et le modèle manquent', () => {
    const data = testHopData(); data.knowledge = data.knowledge.filter(k => k.kind !== 'model');
    render(<HopPredictionView prediction={predictHopTriplet(testHopTriplet, {}, data)} axes={[]} target={{}} />);
    const card = within(screen.getByLabelText('Adéquation au profil recherché'));

    expect(card.getByText('Aucun objectif aromatique')).toBeInTheDocument();
    expect(card.getByText('Aucun modèle documenté ne couvre ce houblon, cette levure et ces conditions.')).toBeInTheDocument();
  });

  it('conserve une plage et sa confiance lorsque l’adéquation est calculable', () => {
    const prediction = predictHopTriplet(testHopTriplet, target, testHopData());
    render(<HopPredictionView prediction={prediction} axes={[]} target={target} />);
    const card = within(screen.getByLabelText('Adéquation au profil recherché'));

    expect(card.getByText(hopRangeLabel(prediction.score.range))).toHaveTextContent('/ 100');
    expect(card.getByText('Confiance moyenne')).toBeInTheDocument();
    expect(card.getByText('Une plage de rapprochement, pas une probabilité de réussite.')).toBeInTheDocument();
  });

  it('préserve les petites doses non nulles et les bornes lors de l’arrondi d’affichage', () => {
    expect(hopDoseLabel(0)).toBe('0 g/L');
    expect(hopDoseLabel(0.00058)).toBe('0,00058 g/L');
    expect(hopDurationLabel(0)).toBe('0 min');
    expect(hopDurationLabel(1 / 120)).toBe('1 min');
    expect(hopDurationLabel(1 / 3600)).toBe('< 1 min');
    expect(hopDurationLabel(48)).toBe('2 j');
    expect(hopDurationLabel(47.999)).toBe('2 j');
    expect(hopRangeLabel({ min: 1.234, max: 2.341 })).toBe('1,2–2,4');
  });
});
