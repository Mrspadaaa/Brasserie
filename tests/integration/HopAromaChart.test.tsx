import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { HopExplorationChart, HopAromaRadar } from '../../src/ui/hopIndex/HopAromaChart';
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
    expect(screen.queryByRole('img', { name: /Radar des saveurs/ })).not.toBeInTheDocument();
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
    expect(screen.getByLabelText('Légende du radar')).toHaveTextContent('Trait inférieur : comparaison conservée');
    const group = screen.getByRole('img', { name: /Radar des saveurs/ }).querySelector('[data-axis="panel"]')!;
    const marker = group.querySelector('circle[data-aroma-baseline]')!;
    expect(Math.hypot(Number(marker.getAttribute('cx')) - 220, Number(marker.getAttribute('cy')) - 190)).toBeCloseTo(92 * 5.2 / 15, 10);
    const band = screen.getByRole('group', { name: 'Estimation · Agrumes du panel' }).querySelector('[data-aroma-baseline]') as HTMLElement;
    expect(parseFloat(band.style.left)).toBeCloseTo(100 * 4.25 / 15, 10);
    expect(parseFloat(band.style.width)).toBeCloseTo(100 * (6.15 - 4.25) / 15, 10);
    expect(group.querySelector('line.text-hop')).toBeNull();
    expect(group.querySelector('[data-aroma-point]')).toBeNull();
    expect(group).toHaveTextContent('simulation indéterminée · conservé : 4,2–6,2');
  });
  it('ne représente pas une comparaison inconnue par une intensité grise ou un zéro', () => {
    render(<HopExplorationChart prediction={{ profile: {} }} baseline={{ profile: { citrus: estimate(0, 10, 'low') } }} axes={[testHopAxis]} target={{}} showAll />);
    expect(screen.getByText('Conservé : intensité indéterminée')).toBeInTheDocument();
    expect(document.querySelector('[data-aroma-baseline]')).toBeNull();
    expect(document.querySelector('circle')).toBeNull();
  });
  it('aucune vue ne dessine de faux radar lorsque toutes les intensités sont indéterminées', () => {
    const props = { prediction: { profile: { citrus: estimate(0, 10, 'low') } }, axes: [testHopAxis], target: {} };
    const { rerender } = render(<HopExplorationChart {...props} />);
    expect(screen.queryByRole('img', { name: /Radar des saveurs/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Les données ne permettent pas encore/)).toBeVisible();
    rerender(<HopExplorationChart {...props} showAll />);
    expect(screen.queryByRole('img', { name: /Radar des saveurs/ })).not.toBeInTheDocument();
    expect(screen.getByText('Plage 0–10')).toBeVisible();
    expect(screen.queryByTestId('aroma-central-marker')).not.toBeInTheDocument();
  });
  it('les douze plages presque entières de la capture ne deviennent ni étoile verte ni profil central', () => {
    const axes=Array.from({length:12},(_,i)=>({...testHopAxis,id:'axis-'+i,name:'Famille '+i,scale:{min:0,max:100},lowMax:33,mediumMax:66}));
    const profile=Object.fromEntries(axes.map(a=>[a.id,estimate(0,99.6,'low')]));
    render(<HopExplorationChart prediction={{profile}} axes={axes} target={{}} showAll/>);
    expect(screen.queryByRole('img',{name:/Radar des saveurs/})).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('aroma-central-marker')).toHaveLength(0);
    expect(document.querySelectorAll('[data-aroma-unresolved="true"]')).toHaveLength(12);
    expect(screen.getAllByText('Plage 0–99,6')).toHaveLength(12);
  });
  it('connecte les valeurs centrales connues ; un trou ne devient pas un sommet zéro', () => {
    const axes=Array.from({length:4},(_,i)=>({...testHopAxis,id:'a'+i}));
    const profile=Object.fromEntries(axes.map(a=>[a.id,estimate(4,6,'high')]));
    const {rerender}=render(<HopAromaRadar prediction={{profile}} axes={axes} target={{}}/>);
    expect(document.querySelectorAll('[data-aroma-point]')).toHaveLength(4);
    expect(document.querySelector('[data-aroma-contour="prediction"] polygon')).not.toBeNull();
    delete profile.a1;
    rerender(<HopAromaRadar prediction={{profile}} axes={axes} target={{}}/>);
    expect(document.querySelector('[data-aroma-contour="prediction"] polygon')).toBeNull();
    expect(document.querySelector('[data-axis="a1"] [data-aroma-point]')).toBeNull();
    expect(document.querySelectorAll('[data-aroma-contour="prediction"] line')).toHaveLength(2);
  });
});
