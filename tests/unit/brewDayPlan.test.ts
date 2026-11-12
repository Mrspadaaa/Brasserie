import { describe, expect, it } from 'vitest';
import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';
import { PREPARATIONS } from '../../src/domain/brewCompanion';
import { ATTENTES_DEFAUT, planJournee } from '../../src/domain/brewDayPlan';
import { brewState, recipe as recetteReelle } from '../fixtures/brewCompanion';

// Le scénario p2c : 11 h 45 au 17 h 20. Les heures se lisent en heure locale, comme à l'écran.
const h = (hh: number, mm = 0) => new Date(2026, 10, 12, hh, mm).getTime();
const min = (ms: number | null) => (ms == null ? null : Math.round(ms / 60000));
const hm = (ms: number | null) => {
  if (ms == null) return null;
  const d = new Date(ms);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};

const ATT = { eau: 65, empatage: 15, sparge: 24, refroidissement: 35, ensemencement: 15, chauffeRincage: 25, desinfectionAvantFin: 25 };
const RATE = 0.8; // °C/min : 67 → 76 en 11 min, 76 → 100 en 30 min

const etapes = (): BrewDayStep[] => [
  { id: 'eau', label: 'Eau et sels', durationMin: 0 },
  { id: 'concassage', label: 'Concassage', durationMin: 0 },
  { id: 'mash-0', label: 'Saccharification', durationMin: 60, tempC: 67 },
  { id: 'mashout', label: 'Mashout', durationMin: 10, tempC: 76 },
  { id: 'sparge', label: 'Rinçage par bacs', durationMin: 0, tempC: 76 },
  { id: 'preboil', label: 'Contrôle avant ébullition', durationMin: 0 },
  { id: 'boil-0', label: 'Ébullition', durationMin: 60, boilElapsedMin: 0 },
  { id: 'whirlpool', label: 'Whirlpool', durationMin: 20, tempC: 80 },
  { id: 'refroidissement', label: 'Refroidissement', durationMin: 0, tempC: 18 },
  { id: 'ensemencement', label: 'Ensemencement', durationMin: 0, tempC: 18 }
];
const recette = (over: Partial<RecipeSnapshot> = {}) =>
  ({ name: 'neipa v3', boilMin: 60, mash: { steps: [], heatingRateCPerMin: RATE }, yeast: { name: 'US-05', qty: 1, unit: 'sachet' }, ...over }) as unknown as RecipeSnapshot;
const sansVitesse = () => recette({ mash: { steps: [] } } as Partial<RecipeSnapshot>);

/** E1 : 13 h 05, la saccharification tourne depuis 13 h 05. */
function e1(over: Partial<BrewDayState> = {}, stepOver: Record<string, Partial<BrewDayStep>> = {}): BrewDayState {
  const steps = etapes().map((s) => {
    const patch: Partial<BrewDayStep> =
      s.id === 'eau' || s.id === 'concassage' ? { doneAt: h(12, 50) }
      : s.id === 'mash-0' ? { rampStartedAt: h(12, 50), startedAt: h(13, 5) } : {};
    return { ...s, ...patch, ...stepOver[s.id] };
  });
  return { steps, currentIndex: 2, startedAt: h(11, 45), readings: [], ...over };
}
/** Tout ce qui précède l'ébullition est fait à l'heure prévue. */
const avantEbullition = (over: Partial<BrewDayState> = {}): BrewDayState =>
  e1(over, { 'mash-0': { doneAt: h(14, 5) }, mashout: { rampStartedAt: h(14, 5), startedAt: h(14, 16), doneAt: h(14, 26) }, sparge: { doneAt: h(14, 50) } });

const plan = (s: BrewDayState, now: number, r = recette()) => planJournee(s, r, now, { attentes: ATT })!;

describe('planJournee — heures de la journée', () => {
  it('E1 : la fin de journée est ~17 h 30, à l’heure (0 min d’avance)', () => {
    const p = plan(e1(), h(13, 5));
    expect(hm(p.debut)).toBe('11 h 45');
    expect(hm(p.finEstimee)).toBe('17 h 30');
    expect(p.avanceMin).toBe(0);
  });

  it('les quatre phases se suivent, comme la frise de p2c', () => {
    const p = plan(e1(), h(13, 5));
    expect(p.phases.map((x) => [x.area, hm(x.debut), hm(x.fin)])).toEqual([
      ['preparation', '11 h 45', '12 h 50'],
      ['mash', '12 h 50', '14 h 50'],
      ['boil', '14 h 50', '16 h 20'],
      ['finish', '16 h 20', '17 h 30']
    ]);
  });

  it('les graduations marquent chaque début de montée et de palier', () => {
    const p = plan(e1(), h(13, 5));
    const t = (a: string) => p.phases.find((x) => x.area === a)!.ticks.map(hm);
    expect(t('preparation')).toEqual([]);
    expect(t('mash')).toEqual(['13 h 05', '14 h 05', '14 h 16']);
    expect(t('boil')).toEqual(['15 h 20']);
    expect(t('finish')).toEqual(['16 h 40']);
  });

  it('les heures des étapes : passées réelles, à venir estimées', () => {
    const p = plan(e1(), h(13, 5));
    const e = p.etapes;
    expect(e['mash-0']).toMatchObject({ origine: 'en-cours' });
    expect(hm(e['mash-0'].tenue)).toBe('13 h 05');
    expect(hm(e['mash-0'].fin)).toBe('14 h 05');
    expect(e.mashout.origine).toBe('estime');
    expect(hm(e.mashout.debut)).toBe('14 h 05');
    expect(hm(e.sparge.fin)).toBe('14 h 50');
    expect(hm(e.preboil.debut)).toBe('15 h 05');
    expect(hm(e['boil-0'].debut)).toBe('15 h 20');
    expect(hm(e['boil-0'].fin)).toBe('16 h 20');
    expect(hm(e.whirlpool.debut)).toBe('16 h 20');
    expect(hm(e.whirlpool.fin)).toBe('16 h 40');
    expect(e.eau.origine).toBe('reel');
    expect(hm(e.eau.fin)).toBe('12 h 50');
  });

  it('E3 : « bouillir +20 min » repousse la fin de 20 min, dite en retard', () => {
    const p = plan(avantEbullition({ boilDurationMin: 80 }), h(15, 5));
    expect(hm(p.etapes['boil-0'].debut)).toBe('15 h 20');
    expect(hm(p.etapes['boil-0'].fin)).toBe('16 h 40');
    expect(hm(p.finEstimee)).toBe('17 h 50');
    expect(p.avanceMin).toBe(-20);
  });

  it('une pause décale la suite d’autant', () => {
    const s = e1({}, { 'mash-0': { pausedAt: h(13, 30) } });
    const p = plan(s, h(13, 37));
    expect(hm(p.etapes['mash-0'].fin)).toBe('14 h 12');
    expect(hm(p.finEstimee)).toBe('17 h 37');
    expect(p.avanceMin).toBe(-7);
  });

  it('une étape qui déborde sa durée finit « maintenant », jamais dans le passé', () => {
    const p = plan(e1(), h(14, 20));
    expect(hm(p.etapes['mash-0'].fin)).toBe('14 h 20');
    expect(hm(p.finEstimee)).toBe('17 h 45');
    expect(p.avanceMin).toBe(-15);
  });

  it('une étape finie en retard décale la suite sur l’heure réelle', () => {
    const p = plan(e1({}, { 'mash-0': { doneAt: h(14, 15) } }), h(14, 16));
    expect(p.etapes['mash-0'].origine).toBe('reel');
    expect(hm(p.finEstimee)).toBe('17 h 40');
    expect(p.avanceMin).toBe(-10);
  });

  it('E4 : fini à 17 h 20, la fin est l’heure réelle et l’avance de 10 min', () => {
    const fini = avantEbullition({
      boilStartedAt: h(15, 20), boilFinishedAt: h(16, 20), finishedAt: h(17, 20),
      steps: etapes().map((s) => ({ ...s, doneAt: h(17, 0) }))
    });
    const p = plan(fini, h(17, 20));
    expect(hm(p.finEstimee)).toBe('17 h 20');
    expect(p.avanceMin).toBe(10);
  });

  it('montée sans vitesse de chauffe connue : l’heure est null, jamais 0', () => {
    const p = planJournee(e1(), sansVitesse(), h(13, 5), { attentes: ATT })!;
    expect(p.etapes.mashout.debut).toBe(h(14, 5)); // le début est connu : le palier précédent finit à 14 h 05
    expect(p.etapes.mashout.tenue).toBeNull();
    expect(p.etapes.mashout.fin).toBeNull();
    expect(p.etapes.sparge.fin).toBeNull();
    expect(p.finEstimee).toBeNull();
    expect(p.avanceMin).toBeNull();
    expect(p.aCote.find((c) => c.id === 'levure')!.heure).toBeNull();
    // les phases dont une borne est inconnue ne sont pas dessinées
    expect(p.phases.map((x) => x.area)).toEqual(['preparation']);
    expect(p.phasesInconnues).toEqual(['mash', 'boil', 'finish']);
  });

  it('la suite se recale sur une étape réellement commencée, même après une montée inconnue', () => {
    const s = e1({ boilStartedAt: h(15, 20) }, { 'mash-0': { doneAt: h(14, 5) } });
    const p = planJournee(s, sansVitesse(), h(15, 25), { attentes: ATT })!;
    expect(p.etapes.mashout.tenue).toBeNull();
    expect(p.etapes.sparge.fin).toBeNull();
    expect(hm(p.etapes['boil-0'].fin)).toBe('16 h 20');
    expect(hm(p.finEstimee)).toBe('17 h 30');
  });

  it('un palier plus froid que le précédent : montée inconnue (null)', () => {
    const s = e1({}, { mashout: { tempC: 60 } });
    const p = plan(s, h(13, 5));
    expect(p.etapes.mashout.tenue).toBeNull();
    expect(p.finEstimee).toBeNull();
  });

  it('la montée en cours se projette sur la vitesse de chauffe, au plus tôt « maintenant »', () => {
    const s = e1({}, { 'mash-0': { startedAt: undefined, rampStartedAt: h(12, 50) } });
    const p = plan(s, h(13, 0));
    expect(p.etapes['mash-0'].origine).toBe('en-cours');
    expect(hm(p.etapes['mash-0'].tenue)).toBe('13 h 05');
  });

  it('les préparations « à côté » ont leur heure : rinçage, levure, refroidisseur', () => {
    const p = plan(e1({ preparations: { rinçage: true } }), h(13, 5));
    expect(p.aCote.map((c) => c.id)).toEqual(['rinçage', 'levure', 'froid']);
    for (const c of p.aCote) expect(PREPARATIONS.map((x) => x.id)).toContain(c.id);
    expect(p.aCote.map((c) => c.nom)).toEqual(['rinçage 76 °C', 'levure', 'refroidisseur']);
    expect(p.aCote.map((c) => hm(c.heure))).toEqual(['14 h 01', '15 h 20', '15 h 55']);
    expect(p.aCote.map((c) => c.fait)).toEqual([true, false, false]);
  });

  it('sans durées données, les hypothèses sont dites, et la fin reste calculable', () => {
    const p = planJournee(e1(), recette(), h(13, 5))!;
    expect(p.finEstimee).not.toBeNull();
    expect(p.hypotheses.length).toBeGreaterThan(0);
    expect(p.hypotheses.join(' ')).toContain('rinçage');
    expect(ATTENTES_DEFAUT.sparge).toBeGreaterThan(0);
  });

  it('avec les durées données et tout réel, aucune hypothèse', () => {
    const p = plan(avantEbullition({ boilStartedAt: h(15, 20), boilFinishedAt: h(16, 20) }), h(16, 21));
    expect(p.hypotheses.join(' ')).not.toContain('rinçage');
  });

  it('un brassin sans heure de départ part de maintenant', () => {
    const s = { ...e1(), startedAt: undefined };
    const p = planJournee(s, recette(), h(9, 0), { attentes: ATT })!;
    expect(hm(p.debut)).toBe('9 h 00');
  });

  it('sur le vrai déroulé d’une recette : houblons posés à leur minute, fin calculable', () => {
    const r = recetteReelle({ mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }, { name: 'Mashout', tempC: 76, durationMin: 10 }], spargeType: 'batch', heatingRateCPerMin: 0.8 } });
    const s = { ...brewState(r), startedAt: h(8, 0) };
    const p = planJournee(s, r, h(8, 0))!;
    const debut = p.etapes['hop-0'].debut!;
    expect(min(p.etapes['hop-0'].debut! - debut)).toBe(0); // 60 min avant la fin : au premier bouillon
    expect(min(p.etapes['hop-50'].debut! - debut)).toBe(50);
    expect(min(p.etapes['boil-fin'].fin! - debut)).toBe(60);
    expect(p.finEstimee).not.toBeNull();
    expect(p.phases.map((x) => x.area)).toEqual(['preparation', 'mash', 'boil', 'finish']);
    expect(p.hypotheses.length).toBeGreaterThan(0);
  });
});
