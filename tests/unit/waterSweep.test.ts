import { describe, it, expect } from 'vitest';
import * as W from '../../src/domain/water';
import { STYLE_WATERS, styleByCode, midpoint } from '../../src/domain/waterStyles';
import { WaterIons, SaltId } from '../../src/types';

/*
 * BALAYAGE LARGE — la classe de défaut, pas le cas particulier.
 *
 * ⚠️ Demandé ainsi : « fais des tests larges pour tout balayer et voir s'il n'y
 * a pas d'autres incohérences de ce type ». « Ce type », c'est ce que la
 * question de l'EBC a révélé : une petite variation d'entrée qui déplace
 * beaucoup la sortie, un impossible que personne n'annonce, un chiffre qui ne
 * décrit pas l'état réel.
 *
 * Ce fichier ne teste aucun cas nommé. Il balaie 435 plans et toutes les
 * entrées continues, et il échoue si une PROPRIÉTÉ tombe. Les quatre défauts
 * qu'il a trouvés au premier passage sont corrigés et cités ici, pour qu'on
 * sache ce qu'il garde :
 *
 *   1. huit plans portaient une pesée impossible (0.1 g de gypse, 0.2 de CaCl₂)
 *   2. six fonctions laissaient sortir NaN ou Infinity — `NaN <= 0` vaut faux
 *   3. le KCl n'entrait jamais tous sels allumés
 *   4. la fenêtre d'alcalinité sautait de 60 ppm pour un point d'EBC
 */

const EAUX: Array<[string, WaterIons]> = [
  ['osmosée', { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 }],
  ['Fribourg', { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 }],
  ['douce', { ca: 12, mg: 3, na: 5, so4: 8, cl: 6, hco3: 30 }],
  ['Burton', { ca: 275, mg: 40, na: 25, so4: 610, cl: 35, hco3: 270 }],
  ['salée', { ca: 40, mg: 8, na: 120, so4: 30, cl: 150, hco3: 90 }]
];

const IONS: Array<keyof WaterIons> = ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'];

interface Cas {
  style: string;
  eau: string;
  ebc: number;
  totalL: number;
  mashL: number;
  ratio: number;
  di: number;
}

function resous(c: Cas) {
  const style = styleByCode(c.style);
  const start = W.dilute(EAUX.find(([n]) => n === c.eau)![1], c.di);
  const target = W.rebalanceRatio(midpoint(style), c.ratio);
  const ranges = {} as typeof style.ions;
  (Object.keys(style.ions) as Array<keyof WaterIons>).forEach((ion) => {
    ranges[ion] = {
      min: Math.min(style.ions[ion].min, target[ion]),
      max: Math.max(style.ions[ion].max, target[ion])
    };
  });
  return {
    ranges,
    r: W.solveSalts({
      start,
      target,
      ranges,
      totalWaterL: c.totalL,
      mashWaterL: c.mashL,
      targetRa: W.targetRaForColor(c.ebc),
      ratio: c.ratio,
      allSaltsInMash: true
    })
  };
}

const TOUS: Cas[] = STYLE_WATERS.flatMap((s) =>
  EAUX.flatMap(([eau]) =>
    [0, 50, 100].map((di) => ({
      style: s.code,
      eau,
      ebc: s.code.startsWith('NA-') ? 20 : 25,
      totalL: 30,
      mashL: 20,
      ratio: (s.ratio.min + s.ratio.max) / 2,
      di
    }))
  )
);

describe('Balayage — invariants sur 435 plans', () => {
  /* ⚠️ Trouvé ici : 0.1 g de gypse, 0.2 à 0.4 g de CaCl₂ sur huit plans. */
  it('⚠️ aucune pesée sous un demi-gramme, sauf la chaux', () => {
    const fautes: string[] = [];
    for (const c of TOUS) {
      for (const [id, g] of Object.entries(resous(c).r.doses) as Array<[SaltId, number]>) {
        if (g > 0 && g < (id === 'chaux' ? 0.1 : 0.5)) {
          fautes.push(`${c.style}/${c.eau}/di${c.di} ${id}=${g}`);
        }
      }
    }
    expect(fautes).toEqual([]);
  });

  it('les doses sont finies, positives, au dixième de gramme, et jamais absurdes', () => {
    const fautes: string[] = [];
    for (const c of TOUS) {
      for (const [id, g] of Object.entries(resous(c).r.doses) as Array<[SaltId, number]>) {
        if (!Number.isFinite(g) || g < 0 || g > 30) fautes.push(`${c.style}/${c.eau} ${id}=${g}`);
        if (Math.abs(g * 10 - Math.round(g * 10)) > 1e-6) fautes.push(`${c.style} ${id}=${g} non arrondi`);
      }
    }
    expect(fautes).toEqual([]);
  });

  /* Ce que le solveur AJOUTE ne franchit jamais le plafond du style. */
  it('aucun plafond de style franchi par les sels', () => {
    const fautes: string[] = [];
    for (const c of TOUS) {
      const { r, ranges } = resous(c);
      const depart = W.dilute(EAUX.find(([n]) => n === c.eau)![1], c.di);
      for (const ion of IONS) {
        if (ion === 'hco3') continue; // c'est l'acide qui le traite, après
        if (r.achievedWort[ion] > ranges[ion].max + 2 && depart[ion] <= ranges[ion].max + 2) {
          fautes.push(`${c.style}/${c.eau}/di${c.di} ${ion}=${Math.round(r.achievedWort[ion])}`);
        }
      }
    }
    expect(fautes).toEqual([]);
  });

  /* ⚠️ Un manque important qui ne se dit pas se lit comme une panne. */
  it('un plancher manqué de plus de 15 ppm est toujours ANNONCÉ', () => {
    const fautes: string[] = [];
    for (const c of TOUS) {
      const { r, ranges } = resous(c);
      const dit = r.unreachable.join(' ').toLowerCase();
      for (const ion of IONS) {
        if (ion === 'hco3') continue;
        const manque = ranges[ion].min - r.achievedWort[ion];
        if (manque > 15 && !dit.includes(W.ION_LABEL[ion].toLowerCase())) {
          fautes.push(`${c.style}/${c.eau}/di${c.di} ${ion} manque ${Math.round(manque)} ppm`);
        }
      }
    }
    expect(fautes).toEqual([]);
  });

  it('les messages sont du texte propre, et le solveur est déterministe', () => {
    const fautes: string[] = [];
    for (const c of TOUS) {
      const a = resous(c).r;
      const b = resous(c).r;
      if (JSON.stringify(a.doses) !== JSON.stringify(b.doses)) fautes.push(`${c.style}/${c.eau} non déterministe`);
      for (const m of a.unreachable) {
        if (/NaN|undefined|Infinity/.test(m)) fautes.push(`${c.style} message cassé : ${m.slice(0, 50)}`);
        if (m.trim() === '') fautes.push(`${c.style} message vide`);
      }
    }
    expect(fautes).toEqual([]);
  });
});

describe('Balayage — continuité des entrées continues', () => {
  const base: Cas = { style: '21C', eau: 'Fribourg', ebc: 25, totalL: 30, mashL: 20, ratio: 1, di: 40 };

  /**
   * Le seul saut tolérable est celui d'UN sel qui franchit le plancher de
   * pesée : une balance ne descend pas sous le demi-gramme. Tout ce qui
   * dépasse est une marche de calcul, et c'est ce qu'on traque.
   */
  const sansGrosSaut = (
    valeurs: number[],
    applique: (v: number) => Cas,
    demiGrammeEnPpm: number
  ) => {
    const sauts: string[] = [];
    let prec: { doses: Partial<Record<SaltId, number>>; eau: WaterIons } | null = null;
    let precV = 0;
    for (const v of valeurs) {
      const { r } = resous(applique(v));
      if (prec) {
        const bougeMax = Math.max(
          ...W.SALT_IDS.map((id) => Math.abs((r.doses[id] ?? 0) - (prec!.doses[id] ?? 0)))
        );
        for (const ion of IONS) {
          const d = Math.abs(r.achievedWort[ion] - prec.eau[ion]);
          if (d > demiGrammeEnPpm && bougeMax > 0.55) {
            sauts.push(`${precV}→${v} : ${ion} bouge de ${d.toFixed(0)} pour ${bougeMax.toFixed(1)} g`);
          }
        }
      }
      prec = { doses: r.doses, eau: r.achievedWort };
      precV = v;
    }
    return sauts;
  };

  const suite = (de: number, a: number, pas: number) => {
    const out: number[] = [];
    for (let v = de; v <= a + 1e-9; v += pas) out.push(Math.round(v * 100) / 100);
    return out;
  };

  /*
   * ⚠️ LE DÉFAUT D'ORIGINE. « Si ma hazy IPA est plus sombre ou plus claire je
   * m'en fiche » — et pourtant, à 12 → 13 EBC, l'eau passait de rien à 3.9 g de
   * bicarbonate et 36 ppm de sodium. La fenêtre glisse maintenant ; il ne reste
   * que le seuil d'achat d'alcalinité, à 21 EBC, épinglé dans `water.test.ts`.
   */
  it('⚠️ l’EBC ne fait plus sauter l’eau, sauf au seuil d’achat d’alcalinité', () => {
    const sauts = sansGrosSaut(suite(2, 90, 1), (v) => ({ ...base, ebc: v }), 25);
    expect(sauts).toEqual([]);
  });

  it('la part d’osmosée ne fait pas sauter l’eau', () => {
    expect(sansGrosSaut(suite(0, 100, 1), (v) => ({ ...base, di: v }), 25)).toEqual([]);
  });

  it('le curseur SO₄ ⇄ Cl ne fait pas sauter l’eau', () => {
    expect(sansGrosSaut(suite(0.2, 4, 0.05), (v) => ({ ...base, ratio: v }), 30)).toEqual([]);
  });

  it('les volumes ne font pas sauter l’eau', () => {
    expect(sansGrosSaut(suite(8, 29, 0.5), (v) => ({ ...base, mashL: v }), 25)).toEqual([]);
    expect(
      sansGrosSaut(suite(15, 60, 1), (v) => ({ ...base, totalL: v, mashL: Math.min(20, v - 5) }), 30)
    ).toEqual([]);
  });
});

describe('Balayage — rien ne rend NaN ni Infinity', () => {
  /*
   * ⚠️ QUATRE FONCTIONS SE GARDAIENT PAR `x <= 0`, ce qui arrête un zéro et un
   * négatif mais laisse passer un NaN. Un champ de volume vidé pour être
   * retapé suffisait à écrire « NaN mL » sur la fiche de brassage.
   */
  const eau: WaterIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 250 };
  const CASSES = [NaN, Infinity, -Infinity, -1, 0, 1e12];

  it('⚠️ acide, lactate, rapport, dilution, pH : aucune sortie non finie', () => {
    const fautes: string[] = [];
    const verifie = (nom: string, v: unknown) => {
      const t = JSON.stringify(v, (_k, x) =>
        typeof x === 'number' && !Number.isFinite(x) ? `!!${x}` : x
      );
      if (t !== undefined && /!!/.test(t)) fautes.push(`${nom} → ${t.slice(0, 80)}`);
    };
    for (const x of CASSES) {
      verifie(`acidNeeded(volume ${x})`, W.acidNeeded(eau, x, 0));
      verifie(`acidNeeded(cible ${x})`, W.acidNeeded(eau, 20, x));
      verifie(`spargeAcidNeeded(${x})`, W.spargeAcidNeeded(eau, x));
      verifie(`lactateInBeer(${x}, 20)`, W.lactateInBeer(x, 20));
      verifie(`lactateInBeer(5, ${x})`, W.lactateInBeer(5, x));
      verifie(`rebalanceRatio(${x})`, W.rebalanceRatio(midpoint(styleByCode('21C')), x));
      verifie(`dilute(${x})`, W.dilute(eau, x));
      verifie(`phShiftFromRa(${x})`, W.phShiftFromRa(x, 3.5));
      verifie(`targetRaForColor(${x})`, W.targetRaForColor(x));
      verifie(`radarScaleMax([${x}])`, W.radarScaleMax([x]));
      verifie(`saltCautions(litres ${x})`, W.saltCautions({ nacl: 3 }, [], eau, x));
      verifie(`ionsAfterAcid(litres ${x})`, W.ionsAfterAcid(eau, 5, 'lactique', x));
      verifie(`acidCorrection(ratio ${x})`, W.acidCorrectionFromMeasuredPh(5.8, 20, x, 'lactique'));
      verifie(`estimateMashPh(ratio ${x})`, W.estimateMashPh([{ name: 'a', weightKg: 5, colorEbc: 6 }], 0, x));
    }
    expect(fautes).toEqual([]);
  });

  it('le solveur survit aux volumes et aux eaux absurdes', () => {
    const fautes: string[] = [];
    const style = styleByCode('21C');
    const essais: Array<[string, Partial<W.SolveInput>]> = [
      ['volume nul', { totalWaterL: 0 }],
      ['volume négatif', { totalWaterL: -5 }],
      ['NaN en volume', { totalWaterL: NaN }],
      ['Infinity en volume', { totalWaterL: Infinity }],
      ['empâtage > total', { totalWaterL: 20, mashWaterL: 50 }],
      ['tous les sels écartés', { disabled: W.SALT_IDS }],
      ['ratio nul', { ratio: 0 }],
      ['ratio énorme', { ratio: 1e6 }],
      ['eau absurde', { start: { ca: 1e6, mg: 1e6, na: 1e6, so4: 1e6, cl: 1e6, hco3: 1e6 } }],
      ['eau négative', { start: { ca: -50, mg: -50, na: -50, so4: -50, cl: -50, hco3: -50 } }]
    ];
    for (const [nom, patch] of essais) {
      const r = W.solveSalts({
        start: { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 },
        target: midpoint(style),
        ranges: style.ions,
        totalWaterL: 30,
        mashWaterL: 20,
        ratio: 1,
        targetRa: W.targetRaForColor(25),
        allSaltsInMash: true,
        ...patch
      });
      for (const [id, g] of Object.entries(r.doses)) {
        if (!Number.isFinite(g) || g > 1000) fautes.push(`${nom} : ${id}=${g}`);
      }
      for (const ion of IONS) {
        if (!Number.isFinite(r.achievedWort[ion])) fautes.push(`${nom} : ${ion} non fini`);
      }
      for (const m of r.unreachable) {
        if (/NaN|undefined|Infinity/.test(m)) fautes.push(`${nom} : « ${m.slice(0, 40)} »`);
      }
    }
    expect(fautes).toEqual([]);
  });
});
