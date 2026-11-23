import { describe, expect, it } from 'vitest';
import { validateSession, stampSession } from '../../functions/src/brewSessionCore';
import { recordPitch } from '../../src/domain/brewDay';
import type { BrewDayState } from '../../src/types';

const now = Date.UTC(2026, 8, 27, 12);
const before = (): BrewDayState => ({ steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }], currentIndex: 0,
  phase: 'awaiting-pitch', transferredAt: now - 1000 });
describe('Confirmation levure : contrat journal partagé serveur', () => {
  it('transporte une quantité réelle et son unité par le stamp serveur sans réutiliser le prévu', () => {
    const pitched = recordPitch(before(), now, 18, { mode: 'measured', amount: 1, unit: 'sachet' });
    const saved = stampSession(pitched, undefined, now, now + 500);
    expect(saved.additions!.yeast).toMatchObject({ amount: 1, unit: 'sachet', doneAt: now + 500 });
    expect(saved.pitchQuantityConfirmation).toBe('measured'); expect(saved.pitchedAt).toBe(now + 500);
  });
  it('conserve non mesuré sans montant inventé et refuse un montant incohérent', () => {
    const pitched = recordPitch(before(), now, undefined, { mode: 'unmeasured' });
    expect(validateSession(pitched).additions?.yeast).toBeUndefined();
    expect(() => validateSession({ ...pitched, additions: { yeast: { amount: 5, unit: 'g' } } })).toThrow(/substitution/);
  });
  it('refuse une confirmation sans événement, une mesure sans unité et le faux zéro ajouté', () => {
    expect(() => validateSession({ ...before(), pitchQuantityConfirmation: 'measured' })).toThrow();
    const pitched = recordPitch(before(), now, undefined, { mode: 'planned', amount: 1, unit: 'pack' });
    expect(() => validateSession({ ...pitched, additions: { yeast: { amount: 1 } } })).toThrow();
    expect(() => validateSession({ ...pitched, additions: { yeast: { amount: 0, unit: 'pack' } } })).toThrow();
  });
  it('préserve historiques sans nouvelle nature et distingue volume culture/inoculum', () => {
    const historical = { steps: before().steps, currentIndex: 0, pitchedAt: now - 100000, finishedAt: now - 100000 };
    expect(validateSession(historical)).toEqual(historical);
    const transferred = recordPitch(before(), now, 18, { mode: 'starter-transferred', cultureVolumeL: 1.2 });
    expect(validateSession(transferred).additions!.yeast).toMatchObject({ amount: 1.2, unit: 'L' });
    expect(() => validateSession({ ...transferred, additions: { yeast: { amount: 1, unit: 'pack' } } })).toThrow(/culture/);
  });
});
