// Voie d99-apport-c-defaut (D99, 26.10) : l'option c de g2d (le débordement de style ne compte dans le RANG que pour une famille marquée) est active PAR DÉFAUT
// au dry hop (actif et après). Contrôle de D167 : sur la 21C, « plus d'agrumes », Citra, Mosaic et Nelson Sauvin sont dans le premier tiers de la liste.
// Garde « les barres ne changent pas » : voie par voie, à CHAQUE moment (leçon g2d : un seul moment a déjà caché 65 doses changées à 10′).
// 'aucun' est l'ancien défaut (HEAD de g2d, à l'octet : scripts/eval-hop/apport-octet.ts) : il sert de témoin, la même liste sans D99.
import { describe, expect, it, vi } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { MomentId, Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../../src/domain/hopIndex/v4';
import { MOMENTS_APPORT_C_DEFAUT } from '../../../src/domain/hopIndex/v4/minoritaire';

vi.setConfig({ testTimeout: 180_000 });
const moteur0 = creerMoteur({ catalogue: CATALOGUE, stock: [] }); // les 318 variétés, sans stock : comme les mesures de g2d
// D125 (a4) : ce fichier éprouve la règle de D99 (famille marquée), mesurée quand le dépassement d'une famille neutre comptait dans le rang ; il le rejoue donc avec `debordementNeutre: true`
// (l'ordre d'avant). La règle neutre a ses propres tests (a4Biais.test.ts).
const m = { ...moteur0, proposeVoies: (r: Recipe, d: Record<string, number>, o: object = {}) => moteur0.proposeVoies(r, d, { debordementNeutre: true, saturation: false, ...o }) };
// D195 (s3) : ce fichier éprouve des clés mesurées avant la règle « la demande prime sur la bande » ; il rejoue `saturation: false` (l'ordre d'avant). La règle a ses tests (saturationD195.test.ts).
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
const CITRA = 'beermaverick-citra', MOSAIC = 'beermaverick-mosaic', NS = 'beermaverick-nelson-sauvin';

const ajouts = (vs: Voie[]) => vs.filter((v) => v.type === 'ajouter');
const position = (vs: Voie[], key: string) => ajouts(vs).findIndex((v) => v.actions[0].hopKey === key) + 1;
const liste = (moment: MomentId, dir: Record<string, number>, apport?: 'aucun', r: Recipe = R21C) =>
  m.proposeVoies(r, dir, { ...GRAND, moments: [moment], departage: 'k3', ...(apport ? { apportMinoritaire: apport } : {}) }).voies;
/** Ce que le brasseur lit d'une voie : barres (effet), débordements affichés, distances, IBU, doses. Tout sauf le rang et overflowRang. */
const lu = (v: Voie) => JSON.stringify({ e: v.effect, o: v.styleOverflow, t: v.overflowTotal, d: v.distance, i: v.ibu, a: v.actions, s: v.sideEffects, c: v.conflicts, k: v.stock });

describe('D167 : sur la 21C, « plus d\'agrumes », dry hop actif, les houblons établis remontent', () => {
  const def = liste('dryActive', { citrus: 1 }), avant = liste('dryActive', { citrus: 1 }, 'aucun');
  const tiers = Math.ceil(ajouts(def).length / 3);
  it('la liste est celle des 152 ajouts de g2d', () => { expect(ajouts(def).length).toBeGreaterThan(100); expect(ajouts(avant).length).toBe(ajouts(def).length); });
  it.each([['Citra', CITRA], ['Mosaic', MOSAIC], ['Nelson Sauvin', NS]])('%s est dans le premier tiers avec le défaut', (_n, key) => {
    expect(position(def, key)).toBeGreaterThan(0);
    expect(position(def, key)).toBeLessThanOrEqual(tiers);
  });
  it('témoin : avec l\'ancien défaut (\'aucun\' = HEAD), aucun des trois n\'y est (Citra 54e, Mosaic 134e, Nelson Sauvin 107e)', () => {
    for (const key of [CITRA, MOSAIC, NS]) expect(position(avant, key)).toBeGreaterThan(tiers);
  });
  it('la mesure de g2d : Citra 2e, Mosaic 20e, Nelson Sauvin 31e (k3)', () => {
    expect(position(def, CITRA)).toBeLessThanOrEqual(5);
    expect(position(def, MOSAIC)).toBeLessThanOrEqual(25);
    expect(position(def, NS)).toBeLessThanOrEqual(35);
  });
  it('dry hop après fermentation : les trois remontent aussi', () => {
    const d = liste('dryPost', { citrus: 1 }), a = liste('dryPost', { citrus: 1 }, 'aucun');
    for (const key of [CITRA, MOSAIC, NS]) expect(position(d, key)).toBeLessThan(position(a, key));
  });
  it('le vrai dry hop (g2b) : le groupe actif est classé avec la même règle, ses voies sont les mêmes', () => {
    const o = { maxBuy: 400, limit: 400, buyLimit: 400, perHop: 100, assemblages: false, dryHop: true, departage: 'k3' } as const;
    const d = m.proposeVoies(R21C, { citrus: 1 }, o).dryHop!.actif, a = m.proposeVoies(R21C, { citrus: 1 }, { ...o, apportMinoritaire: 'aucun' }).dryHop!.actif;
    expect(d.map((v) => v.id).sort()).toEqual(a.map((v) => v.id).sort());
    for (const key of [CITRA, MOSAIC, NS]) expect(position(d, key)).toBeLessThan(position(a, key));
  });
});

describe('où c agit par défaut : seulement les voies dont tous les ajouts sont au dry hop', () => {
  it('les moments sont le dry hop actif et après', () => { expect([...MOMENTS_APPORT_C_DEFAUT]).toEqual(['dryActive', 'dryPost']); });
  it('au dry hop, chaque ajout porte overflowRang, jamais au-dessus de overflowTotal', () => {
    for (const mo of ['dryActive', 'dryPost'] as const) for (const v of ajouts(liste(mo, { citrus: 1 }))) {
      expect(v.overflowRang).toBeDefined();
      expect(v.overflowRang!).toBeLessThanOrEqual(v.overflowTotal + 1e-9);
    }
  });
  it('à 10′ et en whirlpool : une voie qui ajoute à ce moment n\'a aucune clé de plus et reste telle qu\'avant, à l\'octet près', () => {
    for (const mo of ['b10', 'wp'] as const) for (const dir of [{ citrus: 1 }, { floral: 1 }]) {
      const d = liste(mo, dir), a = liste(mo, dir, 'aucun');
      // Hors rang et ex æquo : une voie de dry hop de la recette (Cascade) peut se placer autrement parmi elles, ce qui décale rank et tieWith, pas la voie.
      const ids = (vs: Voie[]) => new Map(ajouts(vs).map((v) => [v.id, JSON.stringify({ ...v, rank: 0, tieWith: [] })]));
      expect(ids(d)).toEqual(ids(a));
      for (const v of ajouts(d)) expect(v.overflowRang).toBeUndefined();
    }
  });
  it('les voies sur l\'ajout de dry hop DÉJÀ dans la recette (retirer, augmenter, diminuer Cascade) sont des voies de dry hop : c y agit ; aucune autre voie hors dry hop', () => {
    const d = liste('b10', { citrus: 1 });
    const avecRang = d.filter((v) => v.overflowRang !== undefined);
    expect(avecRang.length).toBeGreaterThan(0);
    for (const v of avecRang) expect(v.actions.every((a) => a.moment === 'dryActive' || a.moment === 'dryPost')).toBe(true);
  });
  it('une voie sans houblon changé (levure) garde son rang d\'avant', () => {
    const r = m.proposeVoies(R21C, { citrus: 1 }, { leviersLevure: true, assemblages: false });
    for (const v of r.voies.filter((x) => x.type === 'levure' && x.actions.length === 0)) expect(v.overflowRang).toBeUndefined();
  });
});

describe('les barres ne changent pas : voie par voie, à chaque moment, sur deux recettes et plusieurs visées', () => {
  const MOMENTS: MomentId[] = ['b10', 'wp', 'dryActive', 'dryPost'];
  const DIRS: Record<string, number>[] = [{ citrus: 1 }, { tropical: 1 }, { floral: 1 }, { resin: -1 }, { citrus: 1, resin: -1 }];
  for (const [nom, r] of [['21C', R21C], ['stout 16D', R16D]] as const) for (const mo of MOMENTS) {
    it(`${nom} · ${mo} : mêmes voies, mêmes barres, mêmes doses, mêmes débordements affichés (${DIRS.length} visées)`, () => {
      for (const dir of DIRS) {
        const d = liste(mo, dir, undefined, r), a = liste(mo, dir, 'aucun', r);
        expect(d.length).toBe(a.length);
        const parId = new Map(d.map((v) => [v.id, v]));
        for (const v of a) {
          const w = parId.get(v.id);
          expect(w, `${v.id} absente de la liste par défaut`).toBeDefined();
          expect(lu(w!)).toBe(lu(v));
        }
      }
    });
  }
  it('leviers levure et assemblages (liste de l\'app) : mêmes voies, mêmes barres', () => {
    for (const r of [R21C, R16D]) {
      const o = { assemblages: true, leviersLevure: true } as const;
      const d = m.proposeVoies(r, { citrus: 1, resin: -1 }, o).voies, a = m.proposeVoies(r, { citrus: 1, resin: -1 }, { ...o, apportMinoritaire: 'aucun' }).voies;
      const parId = new Map(d.map((v) => [v.id, v]));
      for (const v of a) if (parId.has(v.id)) expect(lu(parId.get(v.id)!)).toBe(lu(v));
    }
  });
  it('le groupe du vrai dry hop : mêmes doses, mêmes barres', () => {
    const o = { maxBuy: 400, limit: 400, buyLimit: 400, perHop: 100, assemblages: false, dryHop: true } as const;
    for (const g of ['actif', 'apres'] as const) {
      const d = m.proposeVoies(R21C, { citrus: 1 }, o).dryHop![g], a = m.proposeVoies(R21C, { citrus: 1 }, { ...o, apportMinoritaire: 'aucun' }).dryHop![g];
      const parId = new Map(d.map((v) => [v.id, v]));
      expect(d.length).toBe(a.length);
      for (const v of a) { expect(parId.get(v.id)).toBeDefined(); expect(lu(parId.get(v.id)!)).toBe(lu(v)); expect(parId.get(v.id)!.dose).toEqual(v.dose); }
    }
  });
  it('additionEffect : défaut = \'aucun\' (aucune barre de Ma bière ne change)', () => {
    const a = { id: 'x', hopKey: NS, moment: 'dryActive' as const, grams: 40 };
    expect(JSON.stringify(m.additionEffect(a, R21C))).toBe(JSON.stringify(m.additionEffect(a, R21C, 'aucun')));
  });
});
