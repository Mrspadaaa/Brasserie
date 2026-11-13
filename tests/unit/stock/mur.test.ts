import { describe, expect, it } from 'vitest';
import {
  ALPHA_MAX, ALPHA_MIN, COLONNES_STYLE, SOMMET, bornesAttenuation, classerHoublons, couleurALaClarte, couleurHoublon, couleurLevure, couleurMalt, couleurSocle,
  flotMin, formeCereale, hexDeLab, labDeHex, lAlpha, lAttenuation, lEbc, ordreColonne, pastillesVides, traceCereale, traceHoublon, typiciteColonne,
} from '../../../src/domain/stock/mur';

/** Énumération exhaustive : le coût minimal d'une affectation avec capacités (petits cas seulement). */
function exhaustif(c: number[][], cap: number[]): number {
  let best = Infinity;
  const reste = [...cap];
  (function rec(i: number, somme: number) {
    if (i === c.length) { best = Math.min(best, somme); return; }
    for (let j = 0; j < cap.length; j++) if (reste[j] > 0) { reste[j]--; rec(i + 1, somme + c[i][j]); reste[j]++; }
  })(0, 0);
  return best;
}
let graine = 7;
const alea = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };

describe('mur : classement des houblons par style (flot de coût minimum)', () => {
  it('trouve le coût minimal de l\'énumération exhaustive sur 60 petits cas', () => {
    for (let t = 0; t < 60; t++) {
      const n = 3 + Math.floor(alea() * 4), k = 2 + Math.floor(alea() * 2);
      const cap = Array.from({ length: k }, () => 1 + Math.floor(alea() * 3));
      if (cap.reduce((a, b) => a + b, 0) < n) cap[0] += n;
      const c = Array.from({ length: n }, () => Array.from({ length: k }, () => Math.round(alea() * 100) / 100));
      const r = flotMin(c, cap);
      expect(r.cout).toBeCloseTo(exhaustif(c, cap), 9);
      const charge = cap.map((_, j) => r.col.filter((x) => x === j).length);
      charge.forEach((x, j) => expect(x).toBeLessThanOrEqual(cap[j]));
    }
  });

  it('respecte la capacité de six par colonne et déplace les moins typiques', () => {
    // 8 houblons qui préfèrent tous Hazy : seuls 6 y restent, les 2 moins typiques vont dans leur deuxième colonne
    const hs = Array.from({ length: 8 }, (_, i) => ({ id: 'h' + i, parts: { '21C': 0.5 - i * 0.01, '21A': 0.3 - i * 0.01 } }));
    const r = classerHoublons(hs);
    const nbHazy = Object.values(r).filter((x) => x.colonne === 'hazy').length;
    expect(nbHazy).toBe(6);
    expect(Object.values(r).filter((x) => x.colonne === 'westcoast').length).toBe(2);
    // le coût est RELATIF à la meilleure typicité de chaque houblon : partent ceux qui perdent le moins (h0 : 0,40 ; h7 : 0,46), pas « les moins typiques »
    expect(Object.entries(r).filter(([, x]) => x.deplace).map(([id]) => id).sort()).toEqual(['h0', 'h1']);
    expect(r.h7.deplace).toBe(false);
    for (const c of COLONNES_STYLE) expect(Object.values(r).filter((x) => x.colonne === c.id).length).toBeLessThanOrEqual(6);
  });

  it('un houblon hors table va à la colonne de sa famille, marqué « par défaut » ; un style absent n\'est jamais 0', () => {
    const r = classerHoublons([{ id: 'x', parts: null, famille: 'nobles' }, { id: 'y', parts: {} }]);
    expect(r.x).toEqual({ colonne: 'lager', parDefaut: true, deplace: false });
    expect(r.y.colonne).toBe('pale');
    expect(typiciteColonne({ '21A': 0.2 }, COLONNES_STYLE[0])).toBeNull();
    expect(typiciteColonne({ '21A': 0.2, '22A': 0.4 }, COLONNES_STYLE[1])).toBe(0.4);
  });

  it('au-delà de 36 houblons classés, chacun reste dans sa meilleure colonne', () => {
    const hs = Array.from({ length: 40 }, (_, i) => ({ id: 'h' + i, parts: { '21C': 0.9 - i * 0.001, '3B': 0.1 } }));
    const r = classerHoublons(hs);
    expect(Object.values(r).every((x) => x.colonne === 'hazy')).toBe(true);
  });
});

describe('mur : échelles de clarté continues (CIELAB)', () => {
  it('α : 3,3 % → L* 92, 15,2 % → L* 22, linéaire, plus fort = plus foncé', () => {
    expect(lAlpha(ALPHA_MIN)).toBeCloseTo(92, 6);
    expect(lAlpha(ALPHA_MAX)).toBeCloseTo(22, 6);
    expect(lAlpha(9.25)).toBeCloseTo(57, 6);
    expect(lAlpha(3.3) - lAlpha(4.3)).toBeCloseTo(5.88, 1);
    expect(lAlpha(20)).toBe(22);
    expect(lAlpha(null)).toBeCloseTo(57, 6);
  });
  it('EBC : logarithmique, 3 → 92, 1 400 → 14', () => {
    expect(lEbc(3)).toBeCloseTo(92, 6);
    expect(lEbc(1400)).toBeCloseTo(14, 6);
    expect(lEbc(25)).toBeGreaterThan(lEbc(120));
  });
  it('atténuation : la plus atténuante L* 26, la moins L* 88 ; une seule levure : le milieu', () => {
    const b = bornesAttenuation([73, 78, null, 82])!;
    expect(b).toEqual({ min: 73, max: 82 });
    expect(lAttenuation(82, b)).toBeCloseTo(26, 6);
    expect(lAttenuation(73, b)).toBeCloseTo(88, 6);
    expect(lAttenuation(78, { min: 78, max: 78 })).toBe(57);
    expect(bornesAttenuation([null, undefined])).toBeNull();
  });
  it('la couleur rendue a la clarté demandée (±1,5 L*) et reste dans le gamut', () => {
    for (const hex of ['#d9b414', '#ee9b2f', '#7a4e3a', '#2f6b5f', '#9b3f74', '#8C8279']) {
      for (const a of [3.5, 6, 9, 12, 15]) {
        const c = couleurHoublon(hex, a);
        expect(c).toMatch(/^#[0-9a-f]{6}$/);
        expect(Math.abs(labDeHex(c)[0] - lAlpha(a))).toBeLessThan(1.5);
      }
    }
    for (const e of [3, 7, 25, 120, 900, 1300]) expect(Math.abs(labDeHex(couleurMalt(e))[0] - lEbc(e))).toBeLessThan(1.5);
  });
  it('un α plus fort est plus foncé, un EBC plus fort aussi ; une levure sans atténuation garde la teinte de sa colonne', () => {
    expect(labDeHex(couleurHoublon('#d9b414', 12))[0]).toBeLessThan(labDeHex(couleurHoublon('#d9b414', 4))[0]);
    expect(labDeHex(couleurMalt(900))[0]).toBeLessThan(labDeHex(couleurMalt(7))[0]);
    expect(couleurLevure('#9D8249', null, { min: 70, max: 80 })).toBe('#9D8249');
    const b = { min: 70, max: 80 };
    expect(labDeHex(couleurLevure('#9D8249', 80, b))[0]).toBeLessThan(labDeHex(couleurLevure('#9D8249', 70, b))[0]);
  });
  it('aller-retour hex ↔ Lab', () => {
    const [L, a, b] = labDeHex('#C87A2C');
    expect(hexDeLab(L, a, b).toLowerCase()).toBe('#c87a2c');
    expect(couleurALaClarte('#7a4e3a', 40)).toMatch(/^#/);
  });
});

describe('mur : formes, ordre, socle, pastilles', () => {
  it('sommets des houblons (q10) et formes des céréales (m1)', () => {
    expect(SOMMET).toEqual({ modernes: 'pointe', nobles: 'dome', classiques: 'creux', amerisants: 'plat', autre: 'plat' });
    expect(formeCereale('Pilsner Malz')).toBe('droite');
    expect(formeCereale('Weizenmalz hell')).toBe('pointe');
    expect(formeCereale('Malt de seigle')).toBe('biseau');
    expect(formeCereale('Avoine floconnée')).toBe('dome');
    expect(formeCereale('Dextrose')).toBe('creux');
    expect(traceHoublon('pointe', 20)).toBe('M0 20V5L4 0L8 5V20Z');
    expect(traceHoublon('plat', 9)).toBe('M0 9V0H8V9Z');
    expect(traceCereale('droite', 10)).toBe('M0 10V0H8V10Z');
  });
  it('ordre : du plus fort au moins fort, inconnu en dernier, égalité par la quantité', () => {
    const xs = [{ n: 'a', f: 5, q: 1 }, { n: 'b', f: null, q: 9 }, { n: 'c', f: 12, q: 1 }, { n: 'd', f: 5, q: 4 }];
    expect(ordreColonne(xs, (x) => x.f, (x) => x.q).map((x) => x.n)).toEqual(['c', 'd', 'a', 'b']);
  });
  it('socle en dégradé : foncé pour la valeur la plus forte, clair pour la plus faible, rien pour l\'inconnu', () => {
    const fort = couleurSocle('#4C6B2A', 15, 4, 15)!, faible = couleurSocle('#4C6B2A', 4, 4, 15)!;
    expect(labDeHex(fort)[0]).toBeLessThan(labDeHex(faible)[0]);
    expect(couleurSocle('#4C6B2A', null, 4, 15)).toBeNull();
    expect(couleurSocle('#4C6B2A', 6, 6, 6)).toBe(hexDeLab(...labDeHex('#4C6B2A')));
  });
  it('catégories vides : 3 pastilles au plus, jamais pour une colonne remplie', () => {
    expect(pastillesVides(['Saison', 'Sour'], ['IPA'])).toEqual(['Saison', 'Sour']);
    expect(pastillesVides(['a', 'b', 'c', 'd', 'e'], ['b'])).toEqual(['a', 'c', 'd']);
    expect(pastillesVides(['a'], ['a'])).toEqual([]);
  });
});
