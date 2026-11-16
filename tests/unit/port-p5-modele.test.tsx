import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { avecVerdict, datesDeMarches, jourPropose, planDecale, teinteBiere, verdictDe, volumesConditionnes } from '../../src/ui/production/fiche/ficheModel';

const batch = (p: Partial<Batch>): Batch => ({ id: 'ZZ-T', name: 'ZZ test', style: 'Pils', status: 'garde', ...p } as Batch);
// Samedi 14.11.2026, 10 h UTC.
const NOW = Date.UTC(2026, 10, 14, 10);
const plan = (leadMin = 12, leadMax = 36) => ({
  id: 'ZZ-plan', startAt: '2026-11-14T08:00:00.000Z', targetPitchAt: '2026-11-14T16:00:00',
  steps: [{ id: 's0', label: 'Chauffer', dueAt: '2026-11-14T08:00:00.000Z' }, { id: 's1', label: 'Transférer', dueAt: '2026-11-14T16:00:00' }, { id: 's2', label: 'Sans date' }],
  protocol: { leadHours: { min: leadMin, max: leadMax } }
}) as unknown as Parameters<typeof jourPropose>[0];

describe('port p5 : e1a, le jour proposé et le starter en aperçu', () => {
  it('date dépassée et plan : le premier jour où le starter tient, jamais aujourd’hui', () => {
    expect(jourPropose(plan(), '12.11.2026', NOW)).toBe('16.11.2026');
  });
  it('sans plan, sans date, ou date pas dépassée : aucune proposition', () => {
    expect(jourPropose(undefined, '12.11.2026', NOW)).toBeNull();
    expect(jourPropose(plan(), null, NOW)).toBeNull();
    expect(jourPropose(plan(), '20.11.2026', NOW)).toBeNull();
  });
  it('aucun jour faisable : rien d’inventé', () => {
    expect(jourPropose(plan(500, 900), '12.11.2026', NOW)).toBeNull();
  });
  it('l’aperçu décale le plan de jours entiers et laisse intact ce qui n’a pas de date', () => {
    const p = plan();
    const d = planDecale(p, '17.11.2026');
    expect(Date.parse(d.targetPitchAt) - Date.parse(p.targetPitchAt)).toBe(3 * 86400000);
    expect(Date.parse(d.startAt) - Date.parse(p.startAt)).toBe(3 * 86400000);
    expect(d.steps[0].dueAt).not.toBe(p.steps[0].dueAt);
    expect(d.steps[2].dueAt).toBeUndefined();
    expect(planDecale(p, '14.11.2026')).toBe(p);
  });
});

describe('port p5 : e2a, verdict sans champ neuf', () => {
  it('pose, remplace et retire la ligne sans toucher au reste de la note', () => {
    const n1 = avecVerdict('Trop sucrée.', 'à refaire');
    expect(n1).toBe('Trop sucrée.\nVerdict : à refaire');
    expect(verdictDe(n1)).toBe('à refaire');
    const n2 = avecVerdict(n1, 'sans suite');
    expect(n2).toBe('Trop sucrée.\nVerdict : sans suite');
    expect(avecVerdict(n2, null)).toBe('Trop sucrée.');
    expect(avecVerdict(undefined, 'à corriger')).toBe('Verdict : à corriger');
    expect(verdictDe(undefined)).toBeNull();
    expect(verdictDe('Verdict : peut-être')).toBeNull();
  });
});

describe('port p5 : e2a et e4c, volumes dérivés de volumePackagedL', () => {
  it('un fût : le reste y tient, il se dit dedans', () => {
    const v = volumesConditionnes(batch({ volumePackagedL: 29.9, packaging: { bottles33: 30, bottles75: 0, kegIds: ['F-01'] } }), [{ capacityL: 20 }]);
    expect(v).toMatchObject({ bouteillesL: 9.9, resteL: 20, capFutsL: 20, nonRepartisL: 0, enFutL: 20 });
  });
  it('volume conditionné au-dessus des contenants : litres non répartis', () => {
    const v = volumesConditionnes(batch({ volumePackagedL: 40, packaging: { bottles33: 30, bottles75: 0, kegIds: ['F-01'] } }), [{ capacityL: 20 }]);
    expect(v?.nonRepartisL).toBe(10.1);
    expect(v?.enFutL).toBeNull();
  });
  it('sans volume conditionné : inconnu, pas zéro', () => {
    expect(volumesConditionnes(batch({}), [])).toBeNull();
  });
});

describe('port p5 : e4c, dates connues et teinte', () => {
  it('la garde n’a pas de date d’entrée : seule sa fin, si l’étape est passée', () => {
    const b = batch({ status: 'conditionne', brewDate: '01.11.2026', bottlingDate: '12.11.2026' });
    expect(datesDeMarches(b, NOW)).toEqual({ fermentation: 'dès 01.11', garde: '→ 12.11', conditionne: '12.11', termine: null });
    const g = datesDeMarches(batch({ status: 'garde', brewDate: '01.11.2026' }), NOW);
    expect(g.garde).toBeNull();
    expect(g.conditionne).toBeNull();
  });
  it('sans couleur de malt, pas de teinte', () => {
    expect(teinteBiere(batch({}))).toBeNull();
  });
});
