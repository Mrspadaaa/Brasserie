import { describe, expect, it } from 'vitest';
import { editFermentationTimelineStep, insertFermentationTimelineStep, moveFermentationTimelinePhaseEnd, planFermentationTimeline,
  positionFermentationContact, removeFermentationTimelineStep } from '../../src/domain/fermentationTimeline';

describe('jours cumulés des paliers de fermentation', () => {
  it('sépare les durées saisies du jour de changement de température et de la fin de consigne', () => {
    const timeline = planFermentationTimeline([
      { kind: 'primaire', name: 'Primaire', tempC: 18, days: 10 },
      { kind: 'garde', name: 'Garde', tempC: 4, days: 10 },
    ]);
    expect(timeline.phases.map(({ days, start, end }) => [days, start, end])).toEqual([[10, 0, 10], [10, 10, 20]]);
    expect(timeline.transitions).toEqual([{ phaseIndex: 1, day: 10, fromTempC: 18, toTempC: 4, kind: 'temperature-change' }]);
    expect(timeline.endDay).toBe(20);
    expect(timeline.transitions.some(transition => transition.day === timeline.endDay)).toBe(false);
  });

  it('marque le passage à J10 même si le prochain palier garde la même température', () => {
    const timeline = planFermentationTimeline([
      { kind: 'primaire', name: 'Départ', tempC: 18, days: 10 },
      { kind: 'ajout', name: 'Maintien après ajout', tempC: 18, days: 10 },
    ]);
    expect(timeline.transitions).toEqual([{ phaseIndex: 1, day: 10, fromTempC: 18, toTempC: 18, kind: 'same-temperature' }]);
    expect(timeline.endDay).toBe(20);
  });

  it('garde 0 j ponctuel distinct d’une durée inconnue, qui interrompt les jours suivants', () => {
    const zero = planFermentationTimeline([
      { kind: 'primaire', name: 'Primaire', tempC: 18, days: 10 },
      { kind: 'ajout', name: 'Ajout ponctuel', tempC: 18, days: 0 },
      { kind: 'garde', name: 'Garde', tempC: 4, days: 10 },
    ]);
    expect(zero.phases.map(({ start, end }) => [start, end])).toEqual([[0, 10], [10, 10], [10, 20]]);
    expect(zero.transitions.map(({ day, kind }) => [day, kind])).toEqual([[10, 'same-temperature'], [10, 'temperature-change']]);
    expect(zero.endDay).toBe(20);

    const unknown = planFermentationTimeline([
      { kind: 'primaire', name: 'Primaire', tempC: 18, days: 10 },
      { kind: 'ajout', name: 'Attente', tempC: 18, days: undefined },
      { kind: 'garde', name: 'Garde', tempC: 4, days: 10 },
    ]);
    expect(unknown.transitions.map(({ day }) => day)).toEqual([10, null]);
    expect(unknown.endDay).toBeNull();

    const unknownTemperature = planFermentationTimeline([
      { kind: 'primaire', name: 'Température à préciser', tempC: undefined, days: 10 },
      { kind: 'garde', name: 'Garde', tempC: 4, days: 10 },
    ]);
    expect(unknownTemperature.phases.map(({ start, end }) => [start, end])).toEqual([[0, 10], [10, 20]]);
    expect(unknownTemperature.transitions[0]).toMatchObject({ day: 10, kind: 'unknown-temperature' });
    expect(unknownTemperature.endDay).toBe(20);
  });

  it('positionne un contact indépendamment des phases et conserve son début si sa durée manque', () => {
    expect(positionFermentationContact({ dayOffset: 18, contactHours: 72 })).toEqual({ start: 18, end: 21 });
    expect(positionFermentationContact({ dayOffset: 22 })).toEqual({ start: 22, end: null });
    expect(positionFermentationContact({ dayOffset: 0, contactHours: 0 })).toEqual({ start: 0, end: 0 });
    expect(positionFermentationContact({ contactHours: 48 })).toEqual({ start: null, end: null });
  });

  it.each([
    { durations: [1.5, 2.25], boundaries: [0, 1.5, 3.75] },
    { durations: [3, 0, 5, 1.25], boundaries: [0, 3, 3, 8, 9.25] },
    { durations: [0.5, 0.75, 2.5, 0, 1.25], boundaries: [0, 0.5, 1.25, 3.75, 3.75, 5] },
  ])('cumule $durations en jours sans supposer un style ni un nombre fixe de phases', ({ durations, boundaries }) => {
    const steps = durations.map((days, index) => ({ kind: index === 0 ? 'primaire' as const : 'garde' as const,
      name: `Phase ${index + 1}`, tempC: 18 + index, days }));
    const timeline = planFermentationTimeline(steps);
    expect(timeline.phases.map(({ start }) => start)).toEqual(boundaries.slice(0, -1));
    expect(timeline.phases.map(({ end }) => end)).toEqual(boundaries.slice(1));
    expect(timeline.transitions.map(({ day }) => day)).toEqual(boundaries.slice(1, -1));
    expect(timeline.endDay).toBe(boundaries.at(-1));
  });

  it('garde les mêmes Jn si seuls les noms et températures des phases changent', () => {
    const durations = [2.5, 0, 4, 3];
    const make = (prefix: string, temperature: (index: number) => number) => durations.map((days, index) => ({
      kind: index === 0 ? 'primaire' as const : 'ajout' as const, name: `${prefix} ${index}`, tempC: temperature(index), days,
    }));
    const first = planFermentationTimeline(make('A', index => 18 + index));
    const renamed = planFermentationTimeline(make('B', () => 18));
    expect(renamed.phases.map(({ start, end }) => [start, end])).toEqual(first.phases.map(({ start, end }) => [start, end]));
    expect(renamed.transitions.map(({ day }) => day)).toEqual(first.transitions.map(({ day }) => day));
    expect(renamed.transitions.some(transition => transition.kind === 'same-temperature')).toBe(true);
  });

  it('déplace la fin du palier sélectionné et décale les suivants sans redistribuer leurs durées', () => {
    const initial = [
      { kind: 'primaire' as const, name: 'Primaire', tempC: 18, days: 4 },
      { kind: 'reposDiacetyle' as const, name: 'Repos', tempC: 20, days: 2, note: 'Contrôle VDK.' },
      { kind: 'garde' as const, name: 'Garde', tempC: 2, days: 7 },
    ];
    const moved = moveFermentationTimelinePhaseEnd(initial, 0, 6)!;
    expect(moved.map(step => step.days)).toEqual([6, 2, 7]);
    expect(planFermentationTimeline(moved).phases.map(phase => [phase.start, phase.end])).toEqual([[0, 6], [6, 8], [8, 15]]);
    expect(moved[1]).toMatchObject({ name: 'Repos', note: 'Contrôle VDK.' });
    expect(initial.map(step => step.days)).toEqual([4, 2, 7]);
    expect(moveFermentationTimelinePhaseEnd(moved, 0, 0)?.[0].days).toBe(0);
  });

  it('refuse le glissement temporel quand le début du palier est inconnu', () => {
    const unknown = [
      { kind: 'primaire' as const, name: 'Primaire', tempC: 18, days: undefined },
      { kind: 'garde' as const, name: 'Garde', tempC: 2, days: 7 },
    ];
    expect(planFermentationTimeline(unknown).phases.map(phase => [phase.start, phase.end])).toEqual([[0, null], [null, null]]);
    expect(moveFermentationTimelinePhaseEnd(unknown, 1, 14)).toBeUndefined();
  });

  it('ajoute, corrige puis retire une phase sans muter ni répartir les phases restantes', () => {
    const initial = [
      { kind: 'primaire' as const, name: 'Primaire', tempC: 18, days: 4 },
      { kind: 'garde' as const, name: 'Garde', tempC: 2, days: 7, note: 'Cuverie.' },
    ];
    const added = insertFermentationTimelineStep(initial, 0, { kind: 'reposDiacetyle', name: 'Repos' });
    expect(added.map(step => step.name)).toEqual(['Primaire', 'Repos', 'Garde']);
    expect(added[1].tempC).toBeUndefined(); expect(added[1].days).toBeUndefined();
    const completed = editFermentationTimelineStep(added, 1, { tempC: 20, days: 0 });
    expect(completed[1]).toMatchObject({ tempC: 20, days: 0 });
    expect(initial.map(step => step.name)).toEqual(['Primaire', 'Garde']);
    const removed = removeFermentationTimelineStep(completed, 0);
    expect(removed).toEqual([completed[1], completed[2]]);
    expect(removed.map(step => step.days)).toEqual([0, 7]);
    expect(removed[1].note).toBe('Cuverie.');
  });
});
