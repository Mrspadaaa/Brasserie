import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { canMoveTo, fermentationBlockedReason, needsConfirmation, statusOptions, suggestedNextStatus, transitionConsequence } from '../../src/domain/batchTransitions';

const base = (patch: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'IPA', style: 'IPA', volumeL: 30, brewDate: '01.09.2026', status: 'planifie', ...patch });
const pitchedDay = { currentIndex: 0, steps: [], pitchedAt: 1 } as Batch['brewDay'];
const ids = (b: Batch) => statusOptions(b).map(o => o.status);

describe('AM 4 · étapes permises d’un brassin', () => {
  it('planifié sans levure ajoutée : ni fermentation, ni garde, ni conditionné, ni terminé', () => {
    const b = base();
    expect(ids(b)).toEqual(['annule']);
    for (const s of ['fermentation', 'garde', 'conditionne', 'termine'] as const) expect(canMoveTo(b, s)).toBe(false);
    expect(suggestedNextStatus(b)).toBeNull();
    expect(fermentationBlockedReason(b)).toContain('ajout réel de levure');
  });
  it('planifié avec levure ajoutée : la fermentation est offerte, sans confirmation', () => {
    const b = base({ brewDay: pitchedDay });
    expect(ids(b)).toEqual(['fermentation', 'annule']);
    expect(suggestedNextStatus(b)).toBe('fermentation');
    expect(needsConfirmation(b, 'fermentation')).toBe(false);
    expect(fermentationBlockedReason(b)).toBeNull();
  });
  it('on avance d’une étape (la garde froide reste facultative)', () => {
    expect(ids(base({ status: 'fermentation' }))).toEqual(['garde', 'conditionne', 'annule']);
    expect(ids(base({ status: 'garde' }))).toEqual(['fermentation', 'conditionne', 'annule']);
    expect(ids(base({ status: 'conditionne' }))).toEqual(['garde', 'termine', 'annule']);
    expect(canMoveTo(base({ status: 'fermentation' }), 'termine')).toBe(false);
    expect(canMoveTo(base({ status: 'garde' }), 'termine')).toBe(false);
  });
  it('« planifié » n’est jamais offert à une bière déjà brassée', () => {
    for (const status of ['fermentation', 'garde', 'conditionne', 'termine'] as const)
      expect(canMoveTo(base({ status }), 'planifie')).toBe(false);
    expect(ids(base({ status: 'termine' }))).toEqual(['conditionne']);
  });
  it('un retour en arrière se confirme ; un avant, non', () => {
    expect(needsConfirmation(base({ status: 'termine' }), 'conditionne')).toBe(true);
    expect(needsConfirmation(base({ status: 'garde' }), 'fermentation')).toBe(true);
    expect(needsConfirmation(base({ status: 'garde' }), 'conditionne')).toBe(false);
  });
  it('un brassin annulé reprend là où il a vécu', () => {
    expect(ids(base({ status: 'annule' }))).toEqual(['planifie']);
    expect(ids(base({ status: 'annule', brewDay: pitchedDay }))).toEqual(['fermentation']);
    expect(needsConfirmation(base({ status: 'annule' }), 'planifie')).toBe(true);
  });
  it('RJ-15 · abandonner se confirme, avant comme après déstockage (même panneau que le retour en arrière)', () => {
    const consumed = { appliedAt: '2026-09-01', eventId: 'e', items: [], pendingItems: [], completedStages: ['brewday'] as const };
    expect(needsConfirmation(base({ status: 'fermentation', stockConsumption: { ...consumed, completedStages: ['brewday'] } }), 'annule')).toBe(true);
    expect(needsConfirmation(base({ status: 'fermentation' }), 'annule')).toBe(true);
    expect(needsConfirmation(base({ status: 'planifie' }), 'annule')).toBe(true);
  });
  it('la conséquence dit ce qui arrive au stock', () => {
    const consumed = { appliedAt: '2026-09-01', eventId: 'e', items: [], pendingItems: [], completedStages: ['brewday', 'remaining'] as ('brewday' | 'remaining')[] };
    expect(transitionConsequence(base({ status: 'garde' }), 'fermentation')).toContain('Rien n’a été déstocké');
    const texte = transitionConsequence(base({ status: 'conditionne', stockConsumption: consumed }), 'garde');
    expect(texte).toContain('reste retiré');
    expect(texte).toContain('aucun ingrédient n’est remis en rayon');
    expect(texte).toContain('ajouts de fermentation déjà confirmés');
  });
});
