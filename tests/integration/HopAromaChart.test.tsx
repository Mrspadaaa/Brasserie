import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { HopExplorationChart } from '../../src/ui/hopIndex/HopAromaChart';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import { testHopAxis } from '../fixtures/hopPrediction';
import { hopTestSource, hopTestVariety } from '../fixtures/hopIndex';

afterEach(cleanup);
const estimate = (min: number, max: number, confidence: 'low' | 'medium' | 'high') => ({ range: { min, max }, central: (min + max) / 2, confidence, sources: [hopTestSource], reasons: [] });

describe('Radar et plages aromatiques fidèles au calcul', () => {
  it.each(['medium', 'high'] as const)('conserve la confiance %s et les bornes au lieu du libellé faible fixe', confidence => {
    const prediction = { profile: { citrus: estimate(4.25, 6.15, confidence) } };
    const before = structuredClone(prediction);
    render(<HopExplorationChart prediction={prediction} axes={[testHopAxis]} target={{}} showAll />);
    const row = within(screen.getByRole('group', { name: 'Estimation · Agrumes' }));
    expect(row.getByText('Plage 4,2–6,2')).toBeInTheDocument();
    expect(row.getByText('Échelle 0–10')).toBeInTheDocument();
    expect(row.getByText(`Confiance ${confidence === 'high' ? 'élevée' : 'moyenne'}`)).toBeInTheDocument();
    expect(row.getByTestId('aroma-central-marker')).toBeInTheDocument();
    expect(prediction).toEqual(before);
  });
  it('ne transforme pas une échelle entière en intensité moyenne ni en absence', () => {
    render(<HopExplorationChart prediction={{ profile: { citrus: estimate(0, 10, 'low') } }} axes={[testHopAxis]} target={{ citrus: { min: 7, max: 10 } }} />);
    expect(screen.getByText('Intensité indéterminée')).toBeInTheDocument();
    expect(screen.queryByTestId('aroma-central-marker')).not.toBeInTheDocument();
    expect(screen.queryByText(/Tendance moyenne|présence non établie/)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Radar des saveurs/ }).querySelectorAll('circle')).toHaveLength(0);
  });
  it('garde un descripteur sourcé hors objectif distinct de la prédiction inconnue', () => {
    const models = [{ axes: [{ id: testHopAxis.id, version: testHopAxis.version, terms: ['agrumes'] }] }] as HopExtrapolation[];
    render(<HopExplorationChart prediction={{ profile: { citrus: { range: null, confidence: 'low', reasons: [], sources: [] } } }} axes={[testHopAxis]} target={{}} variety={hopTestVariety()} models={models} />);
    expect(screen.getByText('Descripteur documenté pour Variété témoin')).toBeInTheDocument();
    expect(screen.getByText('Non quantifiable')).toBeInTheDocument();
    expect(screen.queryByText('Peu documenté')).not.toBeInTheDocument();
    expect(screen.getByText('Plage inconnue')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Estimation ·/ }).closest('details')).not.toHaveAttribute('open');
    expect(screen.getByText('Repères documentés de Variété témoin')).toBeInTheDocument();
  });
  it('met une mesure documentée en avant et retire du radar les échelles d’étude inapplicables', () => {
    const study = { ...testHopAxis, id: 'study-citrus', name: 'Agrumes du panel' };
    const missingStudy = { ...testHopAxis, id: 'other-study', name: 'Autre panel' };
    render(<HopExplorationChart prediction={{ profile: { citrus: estimate(0, 10, 'low'), 'study-citrus': estimate(4, 6, 'high'), 'other-study': { range: null, confidence: 'low', reasons: [], sources: [] } } }} axes={[testHopAxis, study, missingStudy]} target={{}} />);
    expect(screen.getByRole('group', { name: 'Estimation · Agrumes du panel' })).toBeVisible();
    const radar = screen.getByRole('img', { name: /Radar des saveurs/ });
    expect(radar.querySelector('[data-axis="study-citrus"]')).not.toBeNull();
    expect(radar.querySelector('[data-axis="other-study"]')).toBeNull();
  });
  it('garde la comparaison et son échelle publiée quand la nouvelle condition est indéterminée', () => {
    const study = { ...testHopAxis, id: 'panel', name: 'Agrumes du panel', scale: { min: 0, max: 15 } };
    const baseline = { profile: { panel: estimate(4.25, 6.15, 'medium') } };
    const prediction = { profile: { panel: { range: null, confidence: 'low' as const, sources: [], reasons: [] } } };
    render(<HopExplorationChart prediction={prediction} baseline={baseline} axes={[study]} target={{}} />);
    const row = within(screen.getByRole('group', { name: 'Estimation · Agrumes du panel' }));
    expect(row.getByText('Non quantifiable')).toBeVisible();
    expect(row.getByText('Conservé : 4,2–6,2 · confiance moyenne')).toBeVisible();
    expect(row.getByText('Échelle 0–15')).toBeVisible();
    expect(screen.getByText('Gris : comparaison conservée')).toBeVisible();
    const group = screen.getByRole('img', { name: /Radar des saveurs/ }).querySelector('[data-axis="panel"]')!;
    const band = group.querySelector('line[data-aroma-baseline]')!;
    for (const [edge, value] of [['1', 4.25], ['2', 6.15]] as const) {
      expect(Math.hypot(Number(band.getAttribute('x' + edge)) - 220, Number(band.getAttribute('y' + edge)) - 190)).toBeCloseTo(110 * value / 15, 10);
    }
    expect(group.querySelector('line.text-hop')).toBeNull();
    expect(group.querySelector('circle')).toBeNull();
    expect(group).toHaveTextContent('simulation indéterminée · conservé : 4,2–6,2');
  });
  it('ne représente pas une comparaison inconnue par une intensité grise ou un zéro', () => {
    render(<HopExplorationChart prediction={{ profile: {} }} baseline={{ profile: { citrus: estimate(0, 10, 'low') } }} axes={[testHopAxis]} target={{}} showAll />);
    expect(screen.getByText('Conservé : intensité indéterminée')).toBeInTheDocument();
    expect(document.querySelector('[data-aroma-baseline]')).toBeNull();
    expect(document.querySelector('circle')).toBeNull();
  });
  it('la vue compacte ne réserve pas un grand radar vide ; la vue complète reste disponible', () => {
    const props = { prediction: { profile: { citrus: estimate(0, 10, 'low') } }, axes: [testHopAxis], target: {} };
    const { rerender } = render(<HopExplorationChart {...props} />);
    expect(screen.queryByRole('img', { name: /Radar des saveurs/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Les données ne permettent pas encore/)).toBeVisible();
    rerender(<HopExplorationChart {...props} showAll />);
    expect(screen.getByRole('img', { name: /Radar des saveurs/ })).toBeVisible();
    expect(screen.queryByTestId('aroma-central-marker')).not.toBeInTheDocument();
  });
});
