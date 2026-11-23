import { describe, it, expect } from 'vitest';
import {
  STYLE_WATERS,
  midpoint,
  styleByCode,
  styleWaterForName,
  styleIonRange,
  styleFromTargetIons
} from '../../src/domain/waterStyles';
import { ratioLabel, sulfateChlorideRatio } from '../../src/domain/water/ions';
import { solveSalts, rebalanceRatio, targetRaForColor, dilute } from '../../src/domain/water';
import { WaterIons } from '../../src/types';

describe('Profils : audit des identités et des plages', () => {
  it.each([
    ['American Light Lager', '01A'],
    ['Berliner Weisse', '23A'],
    ['Gose', '23G'],
    ['Black IPA', '21B'],
    ['Hazy IPA', '21C'],
    ['Russian Imperial Stout', '20C'],
    ['Milk Stout', '16A'],
    ['Irish Dry Stout', '15B'],
    ['Dunkles Bock', '06C'],
    ['Irish Red', '—'],
    ['Belgian Golden Strong', '—'],
    ['Dubbel', '—'],
    ['Barleywine', '—'],
    ['Czech Pilsner', '—'],
    ['Munich Dunkel', '—']
  ])('%s trouve son profil ou reste explicitement générique', (name, code) => {
    expect(styleWaterForName(name).code).toBe(code);
  });
  it('lit les anciennes Gose sans casser les recettes enregistrées', () => {
    expect(styleByCode('27')).toBe(styleByCode('23G'));
    expect(new Set(STYLE_WATERS.map((s) => s.code)).size).toBe(STYLE_WATERS.length);
  });
  it.each(STYLE_WATERS)('$code : plages finies et ratio compatible avec SO4/Cl', (s) => {
    for (const r of Object.values(s.ions)) {
      expect(Number.isFinite(r.min) && Number.isFinite(r.max)).toBe(true);
      expect(r.min).toBeGreaterThanOrEqual(0);
      expect(r.max).toBeGreaterThanOrEqual(r.min);
    }
    // Une intersection ne suffit pas : les deux extrémités du ratio doivent
    // avoir au moins une paire de concentrations dans les plages annoncées.
    for (const ratio of [s.ratio.min, s.ratio.max]) {
      expect(Math.max(s.ions.cl.min, s.ions.so4.min / ratio)).toBeLessThanOrEqual(
        Math.min(s.ions.cl.max, s.ions.so4.max / ratio) + 1e-8
      );
    }
    expect(s.ions.mg.min).toBe(0);
    expect(styleIonRange(s, 'hco3')).toEqual(s.ions.hco3);
  });
  it('un profil chiffré conserve aussi sa cible HCO3', () => {
    const s = styleFromTargetIons({ ca: 80, mg: 10, na: 20, so4: 100, cl: 100, hco3: 100 });
    expect(styleIonRange(s, 'hco3')).toEqual({ min: 80, max: 120 });
  });
  it.each([20, 30, 31, 40, 60])('Gose : le plancher Na est pesable sur %i L', (litres) => {
    const style = styleByCode('23G');
    const target = rebalanceRatio(midpoint(style), 0.4);
    const r = solveSalts({
      start: { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 },
      target,
      ranges: style.ions,
      totalWaterL: litres,
      mashWaterL: litres * 0.6,
      targetRa: targetRaForColor(8)
    });
    expect(r.achievedWort.na).toBeGreaterThanOrEqual(60);
    expect(r.achievedWort.na).toBeLessThanOrEqual(150);
  });
  it('le même ratio ne promet ni amertume, ni arômes de houblon', () => {
    for (const ratio of [0, 0.35, 0.5, 0.9, 1.9, 2.8, 5]) {
      expect(ratioLabel(ratio)).not.toMatch(/amer|malt|houblon/i);
    }
    const tiny = sulfateChlorideRatio({ ca: 0, mg: 0, na: 0, so4: 2, cl: 1, hco3: 0 });
    expect(tiny.label).toBe('Sulfate et chlorure faibles');
  });
  it('ne déduit pas la minéralité globale de SO₄ et Cl seuls', () => {
    const mineralWater = { ca: 200, mg: 25, na: 300, so4: 2, cl: 1, hco3: 400 };
    expect(sulfateChlorideRatio(mineralWater)).toEqual({ ratio: 2, label: 'Sulfate et chlorure faibles' });
    expect(sulfateChlorideRatio({ ...mineralWater, so4: 0, cl: 0 }))
      .toEqual({ ratio: null, label: 'Sulfate et chlorure absents' });
    expect(sulfateChlorideRatio({ ...mineralWater, so4: 80, cl: 0 }))
      .toEqual({ ratio: null, label: 'Sans chlorure' });
  });
  it.each([
    [79.6, 0.8, 'Côté rond'],
    [120.4, 1.2, 'Côté sec'],
    [199.6, 2, 'Côté sec']
  ])('classe %s/100 avant l’arrondi de lecture', (so4, rounded, label) => {
    expect(sulfateChlorideRatio({ ca: 0, mg: 0, na: 0, so4: Number(so4), cl: 100, hco3: 0 }))
      .toEqual({ ratio: rounded, label });
  });
});

describe('Tous les profils sur cinq eaux, après osmosée et sels', () => {
  const waters: WaterIons[] = [
    { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 },
    { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 },
    { ca: 56.5, mg: 0.8, na: 0, so4: 2.5, cl: 0.9, hco3: 197.6 },
    { ca: 49, mg: 1.1, na: 1.9, so4: 7.1, cl: 1.3, hco3: 157.4 },
    { ca: 140, mg: 25, na: 100, so4: 180, cl: 160, hco3: 300 }
  ];
  it.each(STYLE_WATERS)('$code : aucun contre-ion ne dépasse son plafond', (s) => {
    for (const source of waters)
      for (const di of [0, 50, 100]) {
        const start = dilute(source, di);
        const target = rebalanceRatio(midpoint(s), (s.ratio.min + s.ratio.max) / 2);
        const r = solveSalts({
          start,
          target,
          ranges: s.ions,
          totalWaterL: 40,
          mashWaterL: 30,
          targetRa: targetRaForColor(s.ions.hco3.min > 40 ? 70 : 10),
          allSaltsInMash: true
        });
        for (const ion of ['ca', 'mg', 'na', 'so4', 'cl'] as const) {
          expect(Number.isFinite(r.achievedWort[ion])).toBe(true);
          expect(r.achievedWort[ion]).toBeLessThanOrEqual(
            Math.max(start[ion], s.ions[ion].max) + 0.2
          );
          if (r.achievedWort[ion] < s.ions[ion].min - 2)
            expect(r.issues?.some((issue) => issue.code === 'low' && issue.ion === ion)).toBe(true);
        }
      }
  });
});
