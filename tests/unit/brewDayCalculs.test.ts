import { describe, expect, it } from 'vitest';
import { recipe, brewState } from '../fixtures/brewCompanion';
import {
  EXTRAIT_SEC_PPG_REFERENCE,
  correctionsAvantEbullition,
  grainPourProchain,
  infusionParDegre,
  infusionPourMaische,
  rendementVise,
  zonesDeCible
} from '../../src/domain/brewDayCalculs';
import { boilScenario, wortRescue } from '../../src/domain/brewAssist';
import { cibleMesure } from '../../src/domain/brewDay';
import { BrewDayState, RecipeSnapshot } from '../../src/types';

/** Le scénario unifié de p2c : 6,6 kg de Pilsner et 2 kg de flocons (8,6 kg), 18,5 L d'eau d'empâtage, 28,5 L visés avant
 * l'ébullition, OG 1,061, évaporation prévue 4,2 L/h (cible avant ébullition 1,052) et lue 4,5 L/h le jour J. Relevé : 27,9 L à 1,048. */
const equipment = {
  kettleCapacityL: 50, kettleWorkingL: 40, spargeCapacityL: 30, fermenterCapacityL: 30, fermenterHeadspacePct: 20,
  roPackL: 20, boilOffLPerHour: 4.2, grainAbsorptionLPerKg: 1, grainDisplacementLPerKg: 0.7, coolingShrinkagePct: 0, heatingRateCPerMin: 1
};
const scenario = (): { r: RecipeSnapshot; s: BrewDayState } => {
  const r = recipe({
    volumeL: 22,
    ogTarget: 1.061,
    totalGristKg: 8.6,
    preBoilL: 28.5,
    preBoilHotL: 28.5,
    boilMin: 60,
    fermentables: [
      { name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 6.6, potentialPpg: 37 },
      { name: 'Flocons', kind: 'grain', use: 'empatage', weightKg: 2, potentialPpg: 33 }
    ],
    brewhouse: { equipment } as RecipeSnapshot['brewhouse']
  });
  r.waterPlan!.mashWaterL = 18.5;
  const t = Date.UTC(2026, 10, 12, 14, 0);
  const s = brewState(r, {
    boilOffLPerHour: 4.5,
    readings: [
      { kind: 'volume', value: 27.9, unit: 'L', at: t, stepId: 'preboil', roomTemp: true },
      { kind: 'densite', value: 1.048, unit: 'SG', at: t + 60000, stepId: 'preboil', roomTemp: true }
    ]
  });
  return { r, s };
};

describe('Infusion de la maische : la formule de Palmer', () => {
  it('p2c : 0,6 L d’eau bouillante et 0,4 L d’eau froide par °C pour 8,6 kg et 18,5 L', () => {
    const i = infusionParDegre({ eauL: 18.5, grainKg: 8.6, bordBasC: 66, bordHautC: 68, eauFroideC: 15 })!;
    expect(i.masseEquivalenteL).toBeCloseTo(0.41 * 8.6 + 18.5, 6);
    expect(i.chaudeLParC!).toBeCloseTo((0.41 * 8.6 + 18.5) / (100 - 66), 6);
    expect(i.froideLParC!).toBeCloseTo((0.41 * 8.6 + 18.5) / (68 - 15), 6);
    expect(i.chaudeLParC!.toFixed(1)).toBe('0.6');
    expect(i.froideLParC!.toFixed(1)).toBe('0.4');
  });
  it('plus d’eau dans la cuve, plus de litres par °C : pas une constante', () => {
    const a = infusionParDegre({ eauL: 18.5, grainKg: 8.6, bordBasC: 66, bordHautC: 68, eauFroideC: 15 })!;
    const b = infusionParDegre({ eauL: 25, grainKg: 8.6, bordBasC: 66, bordHautC: 68, eauFroideC: 15 })!;
    expect(b.chaudeLParC!).toBeGreaterThan(a.chaudeLParC!);
  });
  it('une donnée manquante donne null, jamais un 0', () => {
    expect(infusionParDegre({ eauL: null, grainKg: 8.6, bordBasC: 66, bordHautC: 68 })).toBeNull();
    expect(infusionParDegre({ eauL: 18.5, grainKg: undefined, bordBasC: 66, bordHautC: 68 })).toBeNull();
    expect(infusionParDegre({ eauL: 0, grainKg: 8.6, bordBasC: 66, bordHautC: 68 })).toBeNull();
    expect(infusionParDegre({ eauL: 18.5, grainKg: 8.6, bordBasC: null, bordHautC: null })).toBeNull();
  });
  it('une eau froide aussi chaude que la bande ne refroidit pas : null pour ce sens seulement', () => {
    const i = infusionParDegre({ eauL: 18.5, grainKg: 8.6, bordBasC: 66, bordHautC: 68, eauFroideC: 70 })!;
    expect(i.froideLParC).toBeNull();
    expect(i.chaudeLParC).not.toBeNull();
  });
  it('l’eau froide : celle relevée si elle existe, sinon 15 °C dits comme hypothèse', () => {
    const { r, s } = scenario();
    const cible = { min: 66, max: 68 };
    const sans = infusionPourMaische(r, s, cible)!;
    expect(sans.froideHypothese).toBe(true);
    expect(sans.froideC).toBe(15);
    const avec = infusionPourMaische(r, { ...s, coolingWaterC: 10 }, cible)!;
    expect(avec.froideHypothese).toBe(false);
    expect(avec.froideC).toBe(10);
    expect(avec.froideLParC!).toBeLessThan(sans.froideLParC!);
  });
  it('lit l’eau et le grain de la maische ; une eau ajoutée entre dans la masse', () => {
    const { r, s } = scenario();
    const cible = { min: 66, max: 68 };
    const a = infusionPourMaische(r, s, cible)!;
    expect(a.masseEquivalenteL).toBeCloseTo(0.41 * 8.6 + 18.5, 6);
    const b = infusionPourMaische(r, s, cible, { eauAjouteeL: 1.2 })!;
    expect(b.masseEquivalenteL).toBeCloseTo(0.41 * 8.6 + 19.7, 6);
    expect(infusionPourMaische(r, s, null)).toBeNull();
  });
});

describe('Zones « sous · dans · sur » et leur « Et donc »', () => {
  it('maische : « sous 66 », « 66–68 », « sur 68 » et les trois phrases de p2c', () => {
    const { r, s } = scenario();
    const step = { id: 'mash-0', label: 'Saccharification', durationMin: 60, tempC: 67 };
    const cible = cibleMesure('temperature', step, r)!;
    expect(cible).toEqual({ min: 66, max: 68 });
    const infusion = infusionPourMaische(r, s, cible);
    const z = zonesDeCible('temperature', cible, { contexte: 'maische', infusion, phA: '13 h 15' });
    expect(z.map((x) => x.borne)).toEqual(['sous', 'dans', 'sur']);
    expect(z.map((x) => x.libelle)).toEqual(['sous 66', '66–68', 'sur 68']);
    expect(z[0].etDonc).toBe('≈ 0,6 L d’eau bouillante par °C, remuer');
    expect(z[1].etDonc).toBe('rien : l’horloge tourne, pH à 13 h 15');
    expect(z[2].etDonc).toBe('≈ 0,4 L d’eau froide (15 °C supposés) par °C, remuer');
  });
  it('eau froide relevée : le texte donne sa température, sans « supposés »', () => {
    const { r, s } = scenario();
    const cible = { min: 66, max: 68 };
    const infusion = infusionPourMaische(r, { ...s, coolingWaterC: 12 }, cible);
    const z = zonesDeCible('temperature', cible, { contexte: 'maische', infusion });
    expect(z[2].etDonc).toMatch(/d’eau froide \(12 °C\) par °C, remuer$/);
    expect(z[2].etDonc).not.toMatch(/supposés/);
    expect(z[1].etDonc).toBe('rien : l’horloge tourne');
  });
  it('sans calcul d’infusion possible : null, pas une phrase inventée', () => {
    const z = zonesDeCible('temperature', { min: 66, max: 68 }, { contexte: 'maische', infusion: null });
    expect(z[0].etDonc).toBeNull();
    expect(z[2].etDonc).toBeNull();
  });
  it('densité avant ébullition : renvoi aux 3 choix hors de la bande ; les autres mesures : null', () => {
    const z = zonesDeCible('densite', { min: 1.05, max: 1.054 }, { contexte: 'avant-ebullition' });
    expect(z.map((x) => x.libelle)).toEqual(['sous 1,050', '1,050–1,054', 'sur 1,054']);
    expect(z[0].etDonc).toMatch(/3 choix/);
    expect(z[2].etDonc).toMatch(/3 choix/);
    expect(z[1].etDonc).toBeNull();
    for (const kind of ['ph', 'volume', 'densite', 'temperature'] as const) {
      const autres = zonesDeCible(kind, { min: 1, max: 2 });
      expect(autres.every((x) => x.etDonc === null)).toBe(true);
    }
    expect(zonesDeCible('ph', { min: 5.2, max: 5.5 }).map((x) => x.libelle)).toEqual(['sous 5,2', '5,2–5,5', 'sur 5,5']);
  });
});

describe('Rendement visé et grain pour le prochain brassin', () => {
  it('visé ≈ 57 % : la même fonction que le rendement lu, sur les cibles avant ébullition', () => {
    const { r, s } = scenario();
    expect(rendementVise(r, s)).toBeCloseTo(57.2, 1);
  });
  it('grain pour le prochain : ≈ +0,9 kg à 51,7 % lus (0,8 si l’on arrondit le lu à 52 %)', () => {
    const { r, s } = scenario();
    const g = grainPourProchain(r, s)!;
    expect(g.luPct).toBeCloseTo(51.7, 1);
    expect(g.visePct).toBeCloseTo(57.2, 1);
    expect(g.kg).toBe(0.9);
    expect(Math.round(8.6 * (57 / 52 - 1) * 10) / 10).toBe(0.8);
  });
  it('une donnée manquante donne null : pas de relevé, pas de densité cible, pas de potentiel', () => {
    const { r, s } = scenario();
    expect(grainPourProchain(r, { ...s, readings: [] })).toBeNull();
    expect(rendementVise({ ...r, ogTarget: undefined as unknown as number }, s)).toBeNull();
    const sansPotentiel = { ...r, fermentables: r.fermentables!.map((f) => ({ ...f, potentialPpg: undefined })) };
    expect(rendementVise(sansPotentiel, s)).toBeNull();
    expect(grainPourProchain(sansPotentiel, s)).toBeNull();
  });
  it('un rendement lu au-dessus du visé demande moins de grain (signe négatif)', () => {
    const { r, s } = scenario();
    s.readings![1].value = 1.055;
    expect(grainPourProchain(r, s)!.kg).toBeLessThan(0);
  });
});

describe('Trois choix avant l’ébullition, par les calculs existants', () => {
  const fin = new Date(2026, 10, 12, 16, 20).getTime();
  it('p2c : bouillir +20 min, extrait sec ≈ 250 g, accepter OG ≈ 1,057', () => {
    const { r, s } = scenario();
    const c = correctionsAvantEbullition(r, s, { finEbullitionMs: fin })!;
    expect(c.options.map((o) => o.id)).toEqual(['bouillir', 'extrait', 'accepter']);
    const [b, e, a] = c.options;
    expect(b.titre).toBe('Bouillir +20 min');
    expect(b.minutesEbullition).toBe(80);
    expect(b.detail).toBe('≈ 21,9 L à 1,061 · fin ~16 h 40');
    expect(e.titre).toBe('Extrait sec ≈ 250 g');
    expect(e.detail).toBe('≈ 23,4 L à 1,061 · au premier bouillon');
    expect(a.titre).toBe('Accepter');
    expect(a.detail).toBe('OG ≈ 1,057 · ≈ 23,4 L');
    expect(c.note).toBe('≈ calculé par l’app · évaporation 4,5 L/h · rendement ≈ 52 %, visé ≈ 57 %');
  });
  it('aucune formule doublée : les chiffres sont ceux de boilScenario et de wortRescue', () => {
    const { r, s } = scenario();
    const c = correctionsAvantEbullition(r, s)!;
    const accepte = boilScenario(r, s, 60)!;
    expect(c.options[2].detail).toContain(String(accepte.finalOg!.toFixed(3)).replace('.', ',').replace(/0$/, ''));
    const plus = boilScenario(r, s, c.options[0].minutesEbullition!)!;
    expect(plus.finalOg!).toBeCloseTo(1.061, 3);
    expect(plus.finalL!).toBeCloseTo(wortRescue(s, 'preboil', 1.061, r)!.targetL, 0);
  });
  it('sans heure de fin donnée, pas de « fin ~ » inventée', () => {
    const { r, s } = scenario();
    const c = correctionsAvantEbullition(r, s)!;
    expect(c.options[0].detail).toBe('≈ 21,9 L à 1,061');
  });
  it('l’extrait sec : le potentiel d’un extrait de la recette sinon 42 PPG, et le texte le dit', () => {
    const { r, s } = scenario();
    const c = correctionsAvantEbullition(r, s)!;
    expect(c.hypotheses.join(' ')).toContain(`${EXTRAIT_SEC_PPG_REFERENCE} PPG`);
    const dme = correctionsAvantEbullition(r, s, { extraitSec: { nom: 'DME Light', potentialPpg: 44 } })!;
    expect(dme.hypotheses).toEqual([]);
    const g = (o: typeof c) => Number(o.options[1].titre.match(/(\d+) g/)![1]);
    expect(g(dme)).toBeLessThan(g(c));
  });
  it('un moût déjà trop dense : le seul choix est d’accepter', () => {
    const { r, s } = scenario();
    s.readings![1].value = 1.07;
    const c = correctionsAvantEbullition(r, s)!;
    expect(c.options.map((o) => o.id)).toEqual(['accepter']);
  });
  it('une donnée manquante donne null : pas de paire, pas d’évaporation, pas d’OG visée', () => {
    const { r, s } = scenario();
    expect(correctionsAvantEbullition(r, { ...s, readings: [] })).toBeNull();
    expect(correctionsAvantEbullition(r, { ...s, boilOffLPerHour: undefined, readings: s.readings }) ).not.toBeNull(); // l'évaporation de l'installation suffit
    const sansEvap = { ...r, brewhouse: undefined };
    expect(correctionsAvantEbullition(sansEvap, { ...s, boilOffLPerHour: undefined })).toBeNull();
    expect(correctionsAvantEbullition({ ...r, ogTarget: undefined as unknown as number }, s)).toBeNull();
  });
});
