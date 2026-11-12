import { describe, expect, it } from 'vitest';
import {
  compteReleves,
  heuresTenues,
  losangesFrise,
  pasReleves,
  phraseEcartCentral,
  relevesDuJour,
  trierTuiles,
  tuilesDuJour
} from '../../src/domain/brewDayBilan';
import { classerReleves, heureCoupure, mesuresAttendues } from '../../src/domain/brewMeasures';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

/**
 * Port A1 (p2c) : les relevés de la journée du brassin « neipa v3 » : 13 h 05 (palier lancé), 15 h 05 (avant ébullition hors cible),
 * 16 h 19 (Citra en retard, coupure dans 1 min), 17 h 20 (clôture). Le compteur donne 0, 4, 4 et 6 sur 9.
 */
const h = (hh: number, mm: number) => new Date(2026, 10, 12, hh, mm).getTime();
const MIN = 60000;

const recette = {
  ogTarget: 1.061,
  volumeL: 22,
  preBoilL: 28.5,
  preBoilHotL: 30,
  boilMin: 60,
  brewhouse: { equipment: { boilOffLPerHour: 4.5, coolingShrinkagePct: 4, grainAbsorptionLPerKg: 0.96 } },
  waterPlan: { mashWaterL: 18.5, spargeWaterL: 14 },
  hops: [
    { name: 'Magnum', weightG: 10, stage: 'boil', timeMin: 60 },
    { name: 'Citra', weightG: 25, stage: 'boil', timeMin: 5 },
    { name: 'Amarillo', weightG: 43, stage: 'boil', timeMin: 0 }
  ]
} as unknown as RecipeSnapshot;

const pas = (o: Partial<BrewDayStep> & { id: string }): BrewDayStep => ({ label: o.id, durationMin: 0, ...o });
const lecture = (o: Partial<BrewDayReading> & Pick<BrewDayReading, 'kind' | 'value' | 'at'>): BrewDayReading => ({
  unit: o.kind === 'densite' ? 'SG' : o.kind === 'volume' ? 'L' : o.kind === 'ph' ? '' : '°C',
  ...o
});

const maische = lecture({ id: 'r1', at: h(13, 10), stepId: 'mash-1', kind: 'temperature', value: 66.4 });
const ph = lecture({ id: 'r2', at: h(13, 15), stepId: 'mash-1', kind: 'ph', value: 5.35, roomTemp: true });
const avantV = lecture({ id: 'r3', at: h(15, 5), stepId: 'preboil', kind: 'volume', value: 27.9 });
const avantD = lecture({ id: 'r4', at: h(15, 5), stepId: 'preboil', kind: 'densite', value: 1.048 });
const og = lecture({ id: 'r5', at: h(17, 10), stepId: 'ensemencement', kind: 'densite', value: 1.059, roomTemp: true });
const ferm = lecture({ id: 'r6', at: h(17, 10), stepId: 'ensemencement', kind: 'volume', value: 21.5, roomTemp: true });

/** Le déroulé du jour ; `courant` : l'id de l'étape en cours, les étapes d'avant sont faites. */
function journee(courant: string, extra: Partial<BrewDayState> = {}, surcharge: Record<string, Partial<BrewDayStep>> = {}): BrewDayState {
  const ids = ['eau', 'mash-1', 'mash-2', 'sparge', 'preboil', 'boil-0', 'whirlpool', 'refroidissement', 'ensemencement'];
  const base: Record<string, Partial<BrewDayStep>> = {
    eau: { label: 'Eau et sels' },
    'mash-1': { label: 'Saccharification', durationMin: 60, tempC: 67 },
    'mash-2': { label: 'Mashout', durationMin: 10, tempC: 76 },
    sparge: { label: 'Rinçage', durationMin: 20, tempC: 76 },
    preboil: { label: 'Contrôle avant ébullition' },
    'boil-0': { label: 'Ébullition', durationMin: 60, boilElapsedMin: 0 },
    whirlpool: { label: 'Whirlpool', durationMin: 20, tempC: 80 },
    refroidissement: { label: 'Refroidissement', tempC: 18 },
    ensemencement: { label: 'Ensemencement', tempC: 18 }
  };
  const idx = ids.indexOf(courant);
  const steps = ids.map((id, i) => pas({ id, ...base[id], ...(i < idx ? { doneAt: h(12, 0) + i * MIN } : {}), ...surcharge[id] }));
  return { steps, currentIndex: idx, readings: [], ...extra };
}

const E1 = (): BrewDayState => journee('mash-1', {}, { eau: { doneAt: h(12, 50) }, 'mash-1': { startedAt: h(13, 5) } });
const E2 = (): BrewDayState =>
  journee('boil-0', { readings: [maische, ph, avantV, avantD], boilStartedAt: h(15, 20) }, {
    'mash-1': { startedAt: h(13, 5), doneAt: h(14, 5) },
    'boil-0': { startedAt: h(15, 20) }
  });
const E3 = (): BrewDayState => journee('preboil', { readings: [maische, ph, avantV, avantD] }, { 'mash-1': { startedAt: h(13, 5), doneAt: h(14, 5) } });
const E4 = (): BrewDayState =>
  journee('ensemencement', { readings: [maische, ph, avantV, avantD, og, ferm], boilStartedAt: h(15, 20), boilFinishedAt: h(16, 20), pitchedAt: h(17, 12) }, {
    'mash-1': { startedAt: h(13, 5), doneAt: h(14, 5) },
    'boil-0': { startedAt: h(15, 20), doneAt: h(16, 20) }
  });

const compte = (s: BrewDayState, now: number) => compteReleves(relevesDuJour(s, recette, now));

describe('relevés du jour : le scénario p2c', () => {
  it('le compteur suit la journée, pas l’étape : 0, 4, 4 et 6 sur 9', () => {
    expect(compte(E1(), h(13, 5)).libelle).toBe('0 relevé sur 9');
    expect(compte(E3(), h(15, 5)).libelle).toBe('4 relevés sur 9');
    expect(compte(E2(), h(16, 19)).libelle).toBe('4 relevés sur 9');
    expect(compte(E4(), h(17, 20)).libelle).toBe('6 relevés sur 9');
  });

  it('les 9 relevés, dans l’ordre de la journée', () => {
    const r = relevesDuJour(E1(), recette, h(13, 5));
    expect(r.map((x) => x.id)).toEqual(['eau-temp', 'maische', 'ph', 'avant-volume', 'avant-densite', 'coupure', 'og', 'fermenteur', 'ensemencement-temp']);
  });

  it('une valeur absente reste « ? », jamais 0', () => {
    for (const x of relevesDuJour(E1(), recette, h(13, 5))) {
      expect(x.lu).toBe(false);
      expect(x.valeur).toBe('?');
    }
    const pasLu = pasReleves(relevesDuJour(E4(), recette, h(17, 20)));
    expect(pasLu.valeurs).toBe('? ? ?');
  });

  it('E1 à 13 h 05 : la maische est due, le pH attend, l’eau est un relevé manqué', () => {
    const r = Object.fromEntries(relevesDuJour(E1(), recette, h(13, 5)).map((x) => [x.id, x]));
    expect(r['maische']).toMatchObject({ etat: 'du', quand: 'maintenant', cible: '67 °C' });
    expect(r['ph']).toMatchObject({ etat: 'afaire', cible: '5,2–5,5' });
    expect(r['ph'].quand).toBe('dès 13 h 15');
    expect(r['eau-temp']).toMatchObject({ etat: 'manque', quand: 'température non relevée' });
    expect(r['avant-volume'].cible).toBe('28,5 L');
    expect(r['avant-densite'].cible).toBe('1,052');
    expect(r['og'].cible).toBe('1,061');
    expect(r['fermenteur'].cible).toBe('22 L');
    expect(r['ensemencement-temp'].cible).toBe('18 °C');
  });

  it('le pH devient dû 10 min après le départ du palier', () => {
    const r = relevesDuJour(E1(), recette, h(13, 15)).find((x) => x.id === 'ph')!;
    expect(r).toMatchObject({ etat: 'du', quand: 'maintenant' });
  });

  it('E3 à 15 h 05 : volume dans la bande, densité 1,048 hors cible (écart, « −4 points »)', () => {
    const r = Object.fromEntries(relevesDuJour(E3(), recette, h(15, 5)).map((x) => [x.id, x]));
    expect(r['maische']).toMatchObject({ etat: 'ok', valeur: '66,4', quand: '✓ dans la cible' });
    expect(r['ph']).toMatchObject({ etat: 'ok', valeur: '5,35' });
    expect(r['avant-volume']).toMatchObject({ etat: 'ok', valeur: '27,9' });
    expect(r['avant-densite']).toMatchObject({ etat: 'ecart', valeur: '1,048', quand: '−4 points' });
  });

  it('E2 à 16 h 19 : la coupure est due « dans 1 min », la maische et l’avant ébullition ne sont plus à faire', () => {
    const r = Object.fromEntries(relevesDuJour(E2(), recette, h(16, 19)).map((x) => [x.id, x]));
    expect(r['coupure']).toMatchObject({ etat: 'du', quand: 'dans 1 min', cible: 'à 16 h 20' });
    expect(r['coupure'].heure).toBe(h(16, 20));
    expect(r['og']).toMatchObject({ etat: 'afaire' });
  });

  it('E4 à 17 h 20 : OG 1,059 et 21,5 L lus ; eau, coupure et ensemencement °C restent « ? » (manqués)', () => {
    const r = Object.fromEntries(relevesDuJour(E4(), recette, h(17, 20)).map((x) => [x.id, x]));
    expect(r['og']).toMatchObject({ lu: true, valeur: '1,059' });
    expect(r['fermenteur']).toMatchObject({ lu: true, valeur: '21,5' });
    for (const id of ['eau-temp', 'coupure', 'ensemencement-temp']) expect(r[id]).toMatchObject({ lu: false, valeur: '?', etat: 'manque' });
    const sans = pasReleves(relevesDuJour(E4(), recette, h(17, 20)));
    expect(sans.noms).toEqual(['eau d’empâtage °C', 'coupure', 'moût à l’ajout °C']);
    expect(sans.libelle).toBe('restent « ? » au journal');
  });

  it('la température à l’ensemencement vient de l’état (recordPitch) : 18,5 °C est lue, dans la cible 18 ± 1', () => {
    const s = { ...E4(), pitchTemperatureC: 18.5 };
    const r = relevesDuJour(s, recette, h(17, 20)).find((x) => x.id === 'ensemencement-temp')!;
    expect(r).toMatchObject({ lu: true, valeur: '18,5', etat: 'ok', heure: h(17, 12) });
    expect(compteReleves(relevesDuJour(s, recette, h(17, 20))).libelle).toBe('7 relevés sur 9');
  });

  it('une cible que la recette ne donne pas n’est pas inventée', () => {
    const r = relevesDuJour(E1(), {} as RecipeSnapshot, h(13, 5));
    expect(r.find((x) => x.id === 'og')!.cible).toBeUndefined();
    expect(r.find((x) => x.id === 'avant-densite')!.cible).toBeUndefined();
    expect(r.find((x) => x.id === 'fermenteur')!.cible).toBeUndefined();
  });

  it('une heure prévue absente du plan reste null (« ? »), celle du plan est reprise', () => {
    const sans = relevesDuJour(E1(), recette, h(13, 5)).find((x) => x.id === 'avant-densite')!;
    expect(sans.heure).toBeNull();
    const avec = relevesDuJour(E1(), recette, h(13, 5), { 'avant-densite': h(15, 5) }).find((x) => x.id === 'avant-densite')!;
    expect(avec.heure).toBe(h(15, 5));
    expect(avec.quand).toBe(`vers 15 h 05`);
  });

  it('un brassin sans ébullition ne liste pas la coupure : « sur 8 »', () => {
    const s = E1();
    s.steps = s.steps.filter((x) => !['boil-0', 'whirlpool'].includes(x.id));
    const r = relevesDuJour(s, recette, h(13, 5));
    expect(r.some((x) => x.id === 'coupure')).toBe(false);
    expect(compteReleves(r).libelle).toBe('0 relevé sur 8');
  });
});

describe('la coupure n’est pas l’OG', () => {
  it('une densité relevée pendant l’ébullition est la coupure ; à l’ensemencement, l’OG', () => {
    const coupure = lecture({ id: 'c', at: h(16, 20), stepId: 'boil-0', kind: 'densite', value: 1.058 });
    const lus = classerReleves({ ...E2(), readings: [coupure, og] });
    expect(lus.coupure?.value).toBe(1.058);
    expect(lus.og?.value).toBe(1.059);
  });
  it('une densité au whirlpool ou marquée « après ébullition » est aussi la coupure', () => {
    const w = lecture({ id: 'w', at: h(16, 30), stepId: 'whirlpool', kind: 'densite', value: 1.057 });
    expect(classerReleves({ ...E2(), readings: [w] }).coupure?.value).toBe(1.057);
    const p = lecture({ id: 'p', at: h(16, 30), stepId: 'refroidissement', kind: 'densite', value: 1.057, measurementStage: 'postboil' });
    expect(classerReleves({ ...E2(), readings: [p] }).coupure?.value).toBe(1.057);
    expect(classerReleves({ ...E2(), readings: [p] }).og).toBeUndefined();
  });
  it('le compteur compte les deux séparément', () => {
    const coupure = lecture({ id: 'c', at: h(16, 20), stepId: 'boil-0', kind: 'densite', value: 1.058 });
    const s = { ...E4(), readings: [...E4().readings!, coupure] };
    expect(compteReleves(relevesDuJour(s, recette, h(17, 20))).libelle).toBe('7 relevés sur 9');
  });
  it('au volume de cuve refroidie (kettle-cold), rien ne devient « au fermenteur »', () => {
    const v = lecture({ id: 'v', at: h(17, 0), stepId: 'refroidissement', kind: 'volume', value: 23, measurementStage: 'kettle-cold' });
    expect(classerReleves({ ...E4(), readings: [v] }).fermenteur).toBeUndefined();
  });
});

describe('mesures attendues : eau °C et coupure', () => {
  it('à l’étape Eau : la température de l’eau d’empâtage, sans cible inventée', () => {
    const s = journee('eau');
    const a = mesuresAttendues(s.steps[0], s, recette, h(12, 0));
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ kind: 'temperature', nom: 'Eau d’empâtage', court: '°C', due: true });
    expect(a[0].cible).toBeUndefined();
    expect(a[0].reading).toBeUndefined();
  });
  it('un relevé fait à l’étape Eau remplit la case', () => {
    const r = lecture({ id: 'e', at: h(12, 5), stepId: 'eau', kind: 'temperature', value: 62 });
    const s = { ...journee('eau'), readings: [r] };
    expect(mesuresAttendues(s.steps[0], s, recette, h(12, 10))[0].reading?.value).toBe(62);
  });
  it('à la dernière étape d’ébullition : la densité à la coupure, dans 5 min c’est dû', () => {
    const s = E2();
    const bouillon = s.steps.find((x) => x.id === 'boil-0')!;
    const tot = mesuresAttendues(bouillon, s, recette, h(15, 30));
    expect(tot).toHaveLength(1);
    expect(tot[0]).toMatchObject({ kind: 'densite', nom: 'Densité à la coupure', due: false, quand: 'vers 16 h 20' });
    const proche = mesuresAttendues(bouillon, s, recette, h(16, 16));
    expect(proche[0]).toMatchObject({ due: true, quand: 'avant le refroidissement' });
  });
  it('une étape d’ébullition qui n’est pas la dernière n’attend pas la coupure', () => {
    const s = E2();
    s.steps.splice(5, 0, pas({ id: 'boil-1', boilElapsedMin: 0, durationMin: 30 }));
    expect(mesuresAttendues(s.steps[5], s, recette, h(15, 30))).toEqual([]);
  });
  it('la coupure relevée pendant l’ébullition reste lue au whirlpool', () => {
    const c = lecture({ id: 'c', at: h(16, 20), stepId: 'boil-0', kind: 'densite', value: 1.058 });
    const s = { ...journee('whirlpool', { readings: [c] }) };
    const a = mesuresAttendues(s.steps.find((x) => x.id === 'whirlpool')!, s, recette, h(16, 30));
    expect(a[0].reading?.value).toBe(1.058);
  });
  it('heureCoupure : début réel plus durée ; null avant le début', () => {
    expect(heureCoupure(E2(), recette)).toBe(h(16, 20));
    expect(heureCoupure(E1(), recette)).toBeNull();
  });
});

describe('tuiles, tri, frise', () => {
  it('7 tuiles (le rendement vient de A2), tuiles doubles avec leurs parties, « ? » jamais 0', () => {
    const t = tuilesDuJour(relevesDuJour(E1(), recette, h(13, 5)), recette);
    expect(t.map((x) => x.id)).toEqual(['eau', 'empatage', 'avant', 'coupure', 'og', 'fermenteur', 'ensemencement']);
    expect(t[0]).toMatchObject({ nom: 'Eau d’empâtage', complement: '18,5 L', valeur: '?', etat: 'manque', quand: 'température non relevée' });
    expect(t[1]).toMatchObject({ kind: 'paire', cible: 'cible 67 °C · pH 5,2–5,5', quand: 'maintenant · pH 13 h 15', etat: 'du' });
    expect(t[1].parties).toHaveLength(2);
    expect(t[2]).toMatchObject({ nom: 'Avant ébullition', cible: 'cible 28,5 L · 1,052', kind: 'paire' });
    expect(t[3]).toMatchObject({ nom: 'Densité à la coupure', cible: 'pour agir avant le refroidissement' });
    expect(t[4].cible).toBe('cible 1,061');
    expect(t[5].cible).toBe('cible 22 L');
    expect(t[6].cible).toBe('cible 18 °C');
  });
  it('E3 : la tuile « Avant ébullition » est en écart, « relevé à 15 h 05 »', () => {
    const t = tuilesDuJour(relevesDuJour(E3(), recette, h(15, 5)), recette);
    const avant = t.find((x) => x.id === 'avant')!;
    expect(avant).toMatchObject({ etat: 'ecart', quand: 'relevé à 15 h 05' });
    expect(t.find((x) => x.id === 'empatage')).toMatchObject({ etat: 'ok', quand: '✓ dans la cible' });
  });
  it('tri : dû d’abord, puis écart, puis le reste dans l’ordre de la journée', () => {
    const t = tuilesDuJour(relevesDuJour(E2(), recette, h(16, 19)), recette);
    const tri = trierTuiles(t).map((x) => x.id);
    expect(tri.slice(0, 2)).toEqual(['coupure', 'avant']);
    expect(tri.slice(2)).toEqual(t.filter((x) => !['coupure', 'avant'].includes(x.id)).map((x) => x.id));
    expect(t.map((x) => x.id)[0]).toBe('eau');
  });
  it('la frise a 6 losanges : eau, maische, pH, avant ébullition, coupure, OG et fermenteur', () => {
    const l = losangesFrise(relevesDuJour(E1(), recette, h(13, 5)));
    expect(l.map((x) => x.nom)).toEqual(['Eau d’empâtage · ? °C', 'Maische', 'pH d’empâtage', 'Avant ébullition', 'Densité à la coupure', 'OG et fermenteur']);
    expect(l.map((x) => x.etat)).toEqual(['manque', 'du', 'afaire', 'afaire', 'afaire', 'afaire']);
  });
  it('phraseEcartCentral : points de densité, litres, degrés', () => {
    expect(phraseEcartCentral('densite', 1.059, 1.061)).toBe('−2 points');
    expect(phraseEcartCentral('densite', 1.062, 1.061)).toBe('+1 point');
    expect(phraseEcartCentral('volume', 21.5, 22)).toBe('−0,5 L');
    expect(phraseEcartCentral('temperature', 67.6, 67)).toBe('+0,6 °C');
  });
});

describe('heures tenues (Z01)', () => {
  const fin = (): BrewDayState => ({
    ...E4(),
    steps: E4().steps.map((s) => (s.id === 'whirlpool' ? { ...s, startedAt: h(16, 25), doneAt: h(16, 45) } : s)),
    additions: {
      'hop-0': { amount: 10, doneAt: h(15, 20) },
      'hop-1': { amount: 25, doneAt: h(16, 19) },
      'hop-2': { amount: 43, doneAt: h(16, 20) }
    }
  });
  it('le scénario de p2c : paliers, ébullition, ajouts avec le retard de Citra, whirlpool, ensemencement', () => {
    const t = heuresTenues(fin(), recette);
    expect(t.map((x) => [x.nom, x.plage, x.verdict])).toEqual([
      ['Saccharification', '13 h 05–14 h 05', '60 min ✓'],
      ['Ébullition', '15 h 20–16 h 20', '60 min ✓'],
      ['Ajouts', '3 sur 3', 'Citra 4 min en retard'],
      ['Whirlpool 80 °C', '16 h 25–16 h 45', '20 min ✓'],
      ['Ensemencement', '17 h 12', '✓']
    ]);
    expect(t.find((x) => x.id === 'ajouts')!.ton).toBe('ocre');
    expect(t.find((x) => x.id === 'ebullition')!.ton).toBe('ok');
  });
  it('une durée qui s’écarte du prévu se dit en minutes, en ocre', () => {
    const s = fin();
    s.steps = s.steps.map((x) => (x.id === 'mash-1' ? { ...x, doneAt: h(14, 15) } : x));
    const sac = heuresTenues(s, recette)[0];
    expect(sac).toMatchObject({ dureeMin: 70, verdict: '70 min · +10 min', ton: 'ocre' });
  });
  it('un ajout versé à l’heure : ✓ ; un ajout jamais versé après l’ébullition est dit', () => {
    const a = fin();
    a.additions = { 'hop-0': { amount: 10, doneAt: h(15, 20) }, 'hop-1': { amount: 25, doneAt: h(16, 15) }, 'hop-2': { amount: 43, doneAt: h(16, 20) } };
    expect(heuresTenues(a, recette).find((x) => x.id === 'ajouts')!.verdict).toBe('✓');
    const b = fin();
    b.additions = { 'hop-0': { amount: 10, doneAt: h(15, 20) }, 'hop-1': { amount: 25, doneAt: h(16, 15) } };
    expect(heuresTenues(b, recette).find((x) => x.id === 'ajouts')).toMatchObject({ plage: '2 sur 3', verdict: 'Amarillo non versé', ton: 'ocre' });
  });
  it('un ajout sauté (dose 0) n’est pas attendu', () => {
    const s = fin();
    s.additions = { 'hop-0': { amount: 10, doneAt: h(15, 20) }, 'hop-1': { amount: 0 }, 'hop-2': { amount: 43, doneAt: h(16, 20) } };
    expect(heuresTenues(s, recette).find((x) => x.id === 'ajouts')).toMatchObject({ plage: '2 sur 2', verdict: '✓' });
  });
  it('rien n’est inventé : une journée à son début n’a aucune heure tenue', () => {
    expect(heuresTenues(E1(), recette)).toEqual([]);
  });
});
