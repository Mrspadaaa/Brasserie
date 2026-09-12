import { describe, expect, it } from 'vitest';
import { compareBrewerObjectives, compareLotEnvelopeMethods, compareRecipeArithmetic } from '../scientific/hopSecondPass';

describe('Seconde passe : utilité, couverture et objectifs distincts', () => {
  it('refuse un gain apparent de largeur qui perd des observations réservées', () => {
    const [current, paired, single] = compareLotEnvelopeMethods();
    expect(current.metrics.informativeCovered).toBe(26);
    for (const candidate of [paired, single]) {
      expect(candidate.metrics.unknown).toBe(current.metrics.unknown);
      expect(candidate.metrics.mae).toBeCloseTo(current.metrics.mae!, 12);
      expect(candidate.metrics.meanWidth).toBeLessThan(current.metrics.meanWidth!);
      expect(candidate.metrics.informativeCovered).toBe(25);
      expect(candidate.deployed).toBe(false);
    }
  });
  it('garde les prédictions indépendantes de la consigne et expose les classements ambigus', () => {
    const goals = compareBrewerObjectives();
    expect(goals.every(g => g.profilesUnchangedByTarget)).toBe(true);
    expect(new Set(goals.map(g => g.ranked[0].doseGL)).size).toBeGreaterThan(1);
    expect(goals[0].ranked.filter(r => r.overlapsFirst).length).toBeGreaterThan(1);
  });
  it('compare douze situations et toutes leurs complétions sans inventer de centre ou de confiance', () => {
    const report = compareRecipeArithmetic();
    expect(report.failures).toEqual([]);
    expect(report.summaries).toHaveLength(12);
    const boiled = report.summaries.find(r => r.id === 'dose-inconnue-ebullition-60min')!;
    expect(boiled.after.meanWidthPercentOfScale).toBeLessThan(boiled.before.meanWidthPercentOfScale!);
    expect(boiled.after.centralCount).toBe(0);
    expect(report.summaries.find(r => r.id === 'phase-inconnue')!.after.fullScale).toBeGreaterThan(0);
    expect(report.summaries.find(r => r.id === 'levure-inconnue')!.after.unknown).toBeGreaterThan(0);
    expect(report.summaries.find(r => r.id === 'test-houb')!.narrowerAxes).toBe(0);
  });
});
