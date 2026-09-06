import { describe, it, expect } from 'vitest';
import {
  solveSalts,
  minimalDilution,
  rebalanceRatio,
  targetRaForGrist,
  residualAlkalinity,
  dilute
} from '../../src/domain/water';
import { STYLE_WATERS, styleByCode, styleWaterForName, midpoint } from '../../src/domain/waterStyles';
import { WaterIons } from '../../src/types';

/*
 * ⚠️ CE QU'UN BRASSEUR VERSERAIT — pas « dans la fourchette ».
 *
 * Les autres tests vérifient que rien ne dépasse. Celui-ci vérifie que la
 * proposition a du SENS : une suite verte a laissé passer 6.8 g de sel de table
 * dans une impériale, parce que 80 ppm de sodium étaient « dans la fourchette ».
 * Chaque règle ici est une pratique, pas une formule.
 */

const FRIBOURG: WaterIons = { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 };
const OSMOSEE: WaterIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };

/** Couleur typique de chaque style, en EBC. */
const EBC: Record<string, number> = {
  '01A': 5, '05B': 7, '05D': 7, '04A': 8, '06C': 45, '08B': 60, '10A': 8, '11C': 20, '13C': 50,
  '15B': 80, '16A': 70, '20C': 90, '18B': 14, '21A': 12, '21B': 70, '21C': 10, '23A': 6, '27': 6,
  '24A': 6, '24C': 16, '25B': 8, '26C': 9, '26D': 40, 'NA-BLONDE': 8, 'NA-IPA': 10, 'NA-WEISS': 8,
  'NA-STOUT': 70, 'NA-LAGER': 6, '—': 15
};

const DARK = ['06C', '08B', '13C', '15B', '16A', '20C', '26D', 'NA-STOUT'];
const PALE_LAGERS = ['01A', '05B', '05D', '04A', '10A', '23A', '24A', 'NA-LAGER', 'NA-WEISS'];
const NOLO = STYLE_WATERS.filter((s) => s.code.startsWith('NA-')).map((s) => s.code);

function brew(code: string, start: WaterIons, mashL = 20, spargeL = 10, gristKg = 5.7) {
  const style = styleByCode(code);
  const ratio = (style.ratio.min + style.ratio.max) / 2;
  const target = rebalanceRatio(midpoint(style), ratio);
  const ranges = {} as typeof style.ions;
  (Object.keys(style.ions) as Array<keyof WaterIons>).forEach((ion) => {
    ranges[ion] = {
      min: Math.min(style.ions[ion].min, target[ion]),
      max: Math.max(style.ions[ion].max, target[ion])
    };
  });
  return solveSalts({
    start,
    target,
    ranges,
    totalWaterL: mashL + spargeL,
    mashWaterL: mashL,
    targetRa: targetRaForGrist(EBC[code], undefined, mashL / gristKg),
    ratio,
    allSaltsInMash: true
  });
}

describe('Ce qu’un brasseur verserait — tous les styles, deux eaux', () => {
  const waters: Array<[string, WaterIons]> = [['Fribourg', FRIBOURG], ['osmosée', OSMOSEE]];

  STYLE_WATERS.forEach((style) => {
    waters.forEach(([waterName, water]) => {
      const nolo = style.code.startsWith('NA-');
      const r = nolo ? brew(style.code, water, 30, 15, 5) : brew(style.code, water);
      const label = `${style.code} depuis ${waterName}`;

      it(`${label} : sodium sous plafond, y compris quand NaCl porte le chlorure`, () => {
        // Global fitting can use NaCl to relieve a calcium ceiling (NEIPA on
        // Fribourg: 1.8 g). The old zero-dose assertion encoded cascade order.
        expect(r.achievedWort.na).toBeLessThanOrEqual(Math.max(water.na, style.ions.na.max) + 0.1);
      });

      it(`${label} : le sodium reste sous le plafond, sans le frôler par du sel`, () => {
        expect(r.achievedWort.na).toBeLessThanOrEqual(style.ions.na.max + 2);
        if ((r.doses.nacl ?? 0) > 0 && style.code !== '27') {
          expect(r.achievedWort.na).toBeLessThan(style.ions.na.max);
        }
      });

      it(`${label} : les porteurs de magnésium respectent la marge disponible`, () => {
        // Mg is a low objective in mode A, not a prohibition: Black IPA can
        // need Epsom to reach sulfate without excessive calcium.
        expect(r.achievedWort.mg).toBeLessThanOrEqual(Math.max(water.mg, style.ions.mg.max) + 0.1);
      });

      /*
       * ⚠️ QUESTION OUVERTE : ce test dit « pas de magnésium », c'est-à-dire
       * JAMAIS, puisque le plancher vaut 0 dans presque tous les styles. Gaëtan
       * le conteste — « c'est un sel important » — et il a raison sur le fond.
       * Les quatre configurations mesurées, et ce que chacune coûte, sont dans
       * `water.test.ts`, au test du magnésium. L'arbitrage lui revient.
       *
       * Ce qui est garanti dans tous les cas, et qui doit le rester : le
       * magnésium ne sort jamais de la fourchette du style.
       */
      it(`${label} : le magnésium reste dans la fourchette du style`, () => {
        /* Le plafond ne vaut que pour ce que le solveur AJOUTE : l'eau de
           Fribourg porte déjà 14 ppm de magnésium, une lager légère en tolère
           12, et aucune dose ne peut faire baisser un ion. */
        const apporte = Math.max(style.ions.mg.max, water.mg);
        expect(r.achievedWort.mg).toBeLessThanOrEqual(apporte + 1);
        expect(r.achievedWort.mg).toBeGreaterThanOrEqual(style.ions.mg.min - 1);
      });

      it(`${label} : aucun sel alcalin sur une bière pâle`, () => {
        if (EBC[style.code] <= 12) {
          expect((r.doses.nahco3 ?? 0) + (r.doses.chaux ?? 0) + (r.doses.caco3 ?? 0)).toBe(0);
        }
      });

      it(`${label} : jamais de craie quand la chaux est disponible`, () => {
        expect(r.doses.caco3 ?? 0).toBe(0);
      });

      /*
       * ⚠️ LA RÈGLE A CHANGÉ, et voici pourquoi.
       *
       * Elle disait « pas de KCl de lui-même » : le sel était exclu d'office au
       * motif que le potassium se goûte au-delà de 50 ppm et que beaucoup de
       * brasseurs l'écartent. Gaëtan : « je comprends pas pourquoi ce sel assez
       * banal est exclus ». En chiffrant, la raison ne tenait pas — sur un
       * Kölsch depuis Fribourg il manquait 17 ppm de chlorure, soit 1.1 g de
       * KCl, soit 19 ppm de potassium pour un seuil à 50.
       *
       * Le garde-fou était un SEUIL, et le code en avait fait un INTERDIT. Le
       * seuil est désormais posé là où le sont ceux de tous les autres sels —
       * dans `capFlavour` — et le KCl entre en dernier recours. Ce test vérifie
       * donc le seuil, pas l'abstinence.
       *
       * Balayage sur tous les styles depuis Fribourg : neuf l'emploient, entre
       * 0.5 et 1.1 g, pour 8.7 à 19.2 ppm de potassium. Le pire reste à 40 % du
       * seuil.
       */
      it(`${label} : le potassium du KCl reste sous son seuil`, () => {
        const g = r.doses.kcl ?? 0;
        if (g === 0) return;
        /*
         * ⚠️ SUR LE VOLUME RÉEL, pas sur 30 L en dur. Les sans-alcool brassent
         * 45 L (30 d'empâtage + 15 de rinçage) : le test lisait 73 ppm de
         * potassium là où il y en a 49, et accusait le solveur d'un dépassement
         * qui n'existait que dans son propre diviseur. Le plafond de
         * `capFlavour` porte sur le MOÛT — c'est la bière qu'on goûte.
         */
        const litres = nolo ? 45 : 30;
        expect((524.4 * g) / litres).toBeLessThanOrEqual(50);
      });


      it(`${label} : aucune pesée sous un demi-gramme, sauf la chaux`, () => {
        /*
         * La chaux fait exception, et c'est le seul sel qui la mérite : 0.1 g
         * pèse 5 ppm d'alcalinité résiduelle, quand le même dixième de gramme
         * de bicarbonate en vaut 3 et de craie 1.8.
         */
        (Object.entries(r.doses) as Array<[string, number]>).forEach(([id, g]) =>
          expect(g).toBeGreaterThanOrEqual(id === 'chaux' ? 0.1 : 0.5)
        );
      });
    });
  });
});

describe('Les noires : sulfate bas, calcium modéré, chlorure au moins au plancher', () => {
  DARK.forEach((code) => {
    it(`${code} depuis l’osmosée`, () => {
      const r = brew(code, OSMOSEE);
      expect(r.achievedWort.so4).toBeLessThanOrEqual(80);
      expect(r.achievedWort.ca).toBeLessThanOrEqual(130);
      expect(r.achievedWort.cl).toBeGreaterThanOrEqual(styleByCode(code).ions.cl.min - 2);
      // Le gypse, s'il y en a, reste une pincée.
      expect(r.doses.gypse ?? 0).toBeLessThan(5);
    });
    it(`${code} depuis Fribourg : le chlorure atteint le plancher sans saler`, () => {
      const r = brew(code, FRIBOURG);
      expect(r.achievedWort.cl).toBeGreaterThanOrEqual(styleByCode(code).ions.cl.min - 3);
      expect(r.achievedWort.na).toBeLessThan(40);
    });
  });
});

describe('Les lagers pâles : rien qui dépasse', () => {
  PALE_LAGERS.forEach((code) => {
    it(`${code} depuis l’osmosée : sels de saveur seulement, calcium modéré`, () => {
      const r = brew(code, OSMOSEE);
      // NA-WEISS can use KCl to preserve low calcium. It remains capped.
      const others = Object.keys(r.doses).filter((k) => !['gypse', 'cacl2', 'nacl', 'kcl', 'epsom', 'mgcl2'].includes(k));
      expect(others).toEqual([]);
      expect(r.achievedWort.ca).toBeLessThanOrEqual(90);
    });
  });
});

describe('Sans alcool : rond, doux, alcalinité tenue', () => {
  NOLO.forEach((code) => {
    it(`${code} à 6 L/kg depuis l’osmosée : chlorure dominant, sulfate bas`, () => {
      const r = brew(code, OSMOSEE, 30, 15, 5);
      expect(r.achievedWort.cl).toBeGreaterThan(r.achievedWort.so4);
      expect(r.achievedWort.so4).toBeLessThanOrEqual(90);
    });
  });

  it('la fenêtre d’AR d’une NOLO stout à 6 L/kg est plus basse que celle d’une stout pleine', () => {
    const pleine = targetRaForGrist(70, undefined, 3.5);
    const mince = targetRaForGrist(70, undefined, 6);
    expect(mince.max).toBeLessThan(pleine.max);
    expect(mince.min).toBeCloseTo(Math.round(pleine.min * 3.5 / 6), 0);
  });

  it('une NOLO stout depuis l’osmosée reçoit moins de bicarbonate qu’une stout pleine', () => {
    const pleine = brew('20C', OSMOSEE);
    const mince = brew('NA-STOUT', OSMOSEE, 30, 15, 5);
    // Par litre d'eau : l'alcalinité pèse double par kilo de malt.
    expect((mince.doses.nahco3 ?? 0) / 45).toBeLessThan((pleine.doses.nahco3 ?? 0) / 30);
  });

  it('les noms de sans-alcool trouvent leur déclinaison', () => {
    expect(styleWaterForName('Stout sans alcool').code).toBe('NA-STOUT');
    expect(styleWaterForName('NOLO IPA').code).toBe('NA-IPA');
    expect(styleWaterForName('Weissbier alkoholfrei 0,5 %').code).toBe('NA-WEISS');
    expect(styleWaterForName('Lager NA').code).toBe('NA-LAGER');
    expect(styleWaterForName('Bière sans alcool').code).toBe('NA-BLONDE');
    // « na » minuscule n'est pas « NA ».
    expect(styleWaterForName('Saisonale').code).toBe('25B');
  });
});

describe('La Gose et les composés', () => {
  it('la Gose est salée par le sel de table, pas par le CaCl₂', () => {
    const r = brew('27', OSMOSEE);
    expect(r.doses.nacl ?? 0).toBeGreaterThan(3);
    expect(r.achievedWort.na).toBeGreaterThanOrEqual(55);
    expect(r.achievedWort.ca).toBeLessThan(60);
  });

  it('Black IPA, Irish Stout, ESB, Kölsch, Schwarzbier sont reconnus avant les mots qu’ils contiennent', () => {
    expect(styleWaterForName('Black IPA').code).toBe('21B');
    expect(styleWaterForName('Irish Dry Stout').code).toBe('15B');
    expect(styleWaterForName('ESB').code).toBe('11C');
    expect(styleWaterForName('Kölsch').code).toBe('05B');
    expect(styleWaterForName('Schwarzbier').code).toBe('08B');
  });

  it('le rinçage coupé à 90 % d’osmosée est la façon la moins chère de brasser une pâle à Fribourg', () => {
    const r = brew('05D', FRIBOURG);
    expect(residualAlkalinity(r.achievedMash)).toBeGreaterThan(100);
    expect(dilute(FRIBOURG, 90).hco3).toBeCloseTo(25, 0);
  });
});

describe('Juste ce qu’il faut d’osmosée', () => {
  const ask = (code: string, source: WaterIons, acid: 'lactique' | 'phosphorique' = 'lactique') => {
    const style = styleByCode(code);
    const ratio = (style.ratio.min + style.ratio.max) / 2;
    const target = rebalanceRatio(midpoint(style), ratio);
    const ranges = {} as typeof style.ions;
    (Object.keys(style.ions) as Array<keyof WaterIons>).forEach((ion) => {
      ranges[ion] = {
        min: Math.min(style.ions[ion].min, target[ion]),
        max: Math.max(style.ions[ion].max, target[ion])
      };
    });
    return minimalDilution({
      source,
      target,
      ranges,
      totalWaterL: 30,
      mashWaterL: 20,
      spargeWaterL: 10,
      targetRa: targetRaForGrist(EBC[code], undefined, 3.5),
      ratio,
      acid,
      beerVolumeL: 25
    });
  };

  it('une stout depuis Fribourg : 0 % — rien ne dépasse, l’acide reste sous le seuil', () => {
    const r = ask('20C', FRIBOURG);
    expect(r.pct).toBe(0);
    expect(r.reasons).toEqual([]);
  });

  it('une Light Lager depuis Fribourg : le calcium (85 pour 70) impose de couper', () => {
    const r = ask('01A', FRIBOURG);
    expect(r.pct).toBeGreaterThanOrEqual(20);
    expect(r.reasons.some((m) => m.startsWith('calcium'))).toBe(true);
  });

  it('une Pils au lactique depuis Fribourg : c’est le goût de l’acide qui impose la coupe', () => {
    const lactique = ask('05D', FRIBOURG, 'lactique');
    const phospho = ask('05D', FRIBOURG, 'phosphorique');
    expect(lactique.pct).toBeGreaterThan(0);
    expect(lactique.reasons.some((m) => m.includes('lactique'))).toBe(true);
    expect(phospho.pct).toBeLessThanOrEqual(lactique.pct);
  });

  it('depuis l’osmosée, il n’y a rien à couper', () => {
    expect(ask('01A', OSMOSEE).pct).toBe(0);
  });

  it('la part retenue est la plus basse qui passe : un cran en dessous échoue', () => {
    const r = ask('01A', FRIBOURG);
    expect(r.pct % 5).toBe(0);
    // Un cran en dessous, le calcium peut déjà passer : c'est alors l'acide
    // lactique qui tient la part. Les deux raisons sont dites.
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(dilute(FRIBOURG, r.pct).ca).toBeLessThanOrEqual(styleByCode('01A').ions.ca.max + 2);
  });
});

describe('Juste ce qu’il faut d’osmosée — le bicarbonate compte aussi', () => {
  const ask = (code: string, acid: 'lactique' | 'phosphorique') => {
    const style = styleByCode(code);
    const ratio = (style.ratio.min + style.ratio.max) / 2;
    const target = rebalanceRatio(midpoint(style), ratio);
    const ranges = {} as typeof style.ions;
    (Object.keys(style.ions) as Array<keyof WaterIons>).forEach((ion) => {
      ranges[ion] = {
        min: Math.min(style.ions[ion].min, target[ion]),
        max: Math.max(style.ions[ion].max, target[ion])
      };
    });
    return minimalDilution({
      source: FRIBOURG,
      target,
      ranges,
      totalWaterL: 30,
      mashWaterL: 20,
      spargeWaterL: 10,
      targetRa: targetRaForGrist(EBC[code], undefined, 3.5),
      ratio,
      acid,
      beerVolumeL: 25
    });
  };

  it('⚠️ une Pils depuis Fribourg coupe même au phosphorique : 250 ppm de HCO₃ pour 40', () => {
    const r = ask('05D', 'phosphorique');
    expect(r.pct).toBeGreaterThanOrEqual(40);
    expect(r.reasons.some((m) => m.startsWith('bicarbonate'))).toBe(true);
    // 250 × (1 − 0.45) = 137.5 ≤ 40 + 100 : c'est le premier cran qui passe.
    expect(dilute(FRIBOURG, r.pct).hco3).toBeLessThanOrEqual(40 + 100);
    expect(dilute(FRIBOURG, r.pct - 5).hco3).toBeGreaterThan(40 + 100);
  });

  it('une IPA et une Wit coupent aussi, une porter et une stout non', () => {
    expect(ask('21A', 'phosphorique').pct).toBeGreaterThanOrEqual(35);
    expect(ask('24A', 'phosphorique').pct).toBeGreaterThanOrEqual(35);
    expect(ask('13C', 'phosphorique').pct).toBe(0);
    expect(ask('20C', 'phosphorique').pct).toBe(0);
  });
});

describe('Juste ce qu’il faut d’osmosée — le bicarbonate restant passe à l’acide', () => {
  it('Pils depuis Fribourg à la part retenue : l’acide neutralise ce qui reste, empâtage ET rinçage', () => {
    const style = styleByCode('05D');
    const ratio = (style.ratio.min + style.ratio.max) / 2;
    const target = rebalanceRatio(midpoint(style), ratio);
    const r = minimalDilution({
      source: FRIBOURG,
      target,
      ranges: style.ions,
      totalWaterL: 30,
      mashWaterL: 20,
      spargeWaterL: 10,
      targetRa: targetRaForGrist(7, undefined, 3.5),
      ratio,
      acid: 'lactique',
      beerVolumeL: 25
    });
    expect(r.pct).toBe(45);
    expect(r.acid.hco3Left).toBeCloseTo(137.5, 0);
    // Eau coupée seule : AR ≈ 77 vers −30 → 4.4 mL. Mais les sels (gypse, CaCl₂)
    // vont tous dans la maische et son calcium fait tomber l'AR : ≈ 2.7 mL.
    expect(r.acid.mash).toBeGreaterThan(2);
    expect(r.acid.mash).toBeLessThan(5.5);
    expect(r.acid.sparge).toBeGreaterThan(1.5);
    expect(r.acid.unit).toBe('mL');
  });
});

/*
 * ⚠️ « Le KCl semble toujours pas toujours être ajouté. »
 *
 * Mesuré avant correction sur 29 styles × 5 eaux × 3 combinaisons de sels
 * écartés : il n'entrait que dans 221 cas sur 435, et JAMAIS avec tous les sels
 * allumés — il fallait éteindre le chlorure de calcium ET celui de magnésium.
 * Deux causes, aucune chimique : il passait après le magnésium, et le
 * chlorure de magnésium avait le droit de monter jusqu'au PLAFOND de magnésium
 * du style pour transporter du chlorure.
 */
describe('Le chlorure de potassium, quand le calcium est bloqué', () => {
  /* L'eau de Fribourg porte déjà 85 ppm de calcium : un Kölsch en tolère 80. */
  const KOLSCH = '05B';

  it('⚠️ il entre TOUS SELS ALLUMÉS quand le calcium est déjà au plafond', () => {
    const r = brew(KOLSCH, FRIBOURG);
    expect(r.doses.cacl2 ?? 0).toBe(0); // le calcium ne peut plus monter
    expect(r.doses.kcl ?? 0).toBeGreaterThan(0);
  });

  /*
   * ⚠️ ET IL PASSE AVANT LE MAGNÉSIUM. De ces deux passagers, le potassium est
   * le seul que le malt fournit déjà par centaines de ppm, et le seul qui ne se
   * goûte pas sous son plafond. Saturer le magnésium — qu'on goûte — pour aller
   * chercher du chlorure était l'ordre inverse du bon.
   */
  it('⚠️ et le magnésium n’est plus saturé pour transporter du chlorure', () => {
    const r = brew(KOLSCH, FRIBOURG);
    const style = styleByCode(KOLSCH);
    // Le magnésium reste celui de l'eau : aucun n'a été ajouté pour le chlorure.
    expect(r.achievedWort.mg).toBeLessThanOrEqual(Math.max(style.ions.mg.min, FRIBOURG.mg) + 1);
    expect(r.doses.mgcl2 ?? 0).toBe(0);
  });

  it('son potassium reste sous le plafond sans avertissement systématique', () => {
    const r = brew(KOLSCH, FRIBOURG);
    expect((524.4 * (r.doses.kcl ?? 0)) / 30).toBeLessThanOrEqual(50);
    // Threshold notifications live in saltCautions, based on the actual dose.
    expect(r.unreachable.join(' ')).not.toMatch(/potassium/);
  });

  /* Écarté, il ne s'impose évidemment pas : c'est un plafond, pas un dogme. */
  it('écarté, il laisse la place aux autres', () => {
    const r = solveSalts({
      start: FRIBOURG,
      target: midpoint(styleByCode(KOLSCH)),
      ranges: styleByCode(KOLSCH).ions,
      totalWaterL: 30,
      mashWaterL: 20,
      ratio: 1,
      disabled: ['kcl'],
      allSaltsInMash: true
    });
    expect(r.doses.kcl ?? 0).toBe(0);
  });
});
