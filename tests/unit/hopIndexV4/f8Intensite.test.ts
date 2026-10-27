// Voie f8 (D118, D191) : le départage par intensité (k3k1 : radar Beer Maverick de la famille, la cascade k1 en repli, l'inconnu après le connu) est le DÉFAUT de Suggérer.
// Dans la liste principale (qui mêle des voies neutres aux ajouts d'arôme) il se place après la distance, comme k1, k2 et k3 ; dans les groupes du vrai dry hop (option `dryHop`, g2b : des ajouts d'arôme
// seulement) il passe AVANT le débordement de style. Mesuré en 22A (Double IPA du brasseur, 27.10) : avant, « plus d'agrumes » au dry hop rangeait Hallertau Mittelfrüh, Mount Hood, Saaz devant El Dorado
// (223e sur 235) : la pureté (une seule famille citée, aucun débordement) battait l'intensité. `departage: 'aucun'` rend le comportement d'avant, à l'octet près.
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { DEPARTAGE_DEFAUT, ETAPES, cleDeVoie, cleHoublon, comparerCles } from '../../../src/domain/hopIndex/v4/departage';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { compareRankKeys, proposeVoies } from '../../../src/domain/hopIndex/v4/voies';
import { s1Recipe } from '../../../prototypes/houblons-v4/src/pack/buildPack';

const CLE = (id: string) => `beermaverick-${id}`;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const R22A: Recipe = { name: '22A Double IPA', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 10, additions: [
  { id: 'a1', hopKey: CLE('columbus'), moment: 'b60', grams: 40 }, { id: 'a2', hopKey: CLE('columbus'), moment: 'b10', grams: 40 }, { id: 'a3', hopKey: CLE('lotus'), moment: 'dryActive', grams: 100 }] };
/** Les groupes du vrai dry hop (g2b) de « plus <famille> », pool entier, rang d'un houblon dans le groupe actif (0 : absent). */
const dryHop = (departage: 'aucun' | undefined, dir: Record<string, number>) => {
  const r = m.proposeVoies(R22A, dir, { maxBuy: 1, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'], dryHop: true, ...(departage ? { departage } : {}) });
  const vs = r.dryHop!.actif;
  return { vs, rang: (id: string) => vs.findIndex((v) => v.actions[0].hopKey === CLE(id)) + 1 };
};

describe('la clé k3k1', () => {
  it('est le défaut, et ses étapes sont : famille citée, radar, puis les cinq de k1', () => {
    expect(DEPARTAGE_DEFAUT).toBe('k3k1');
    expect(ETAPES.k3k1).toHaveLength(7);
    expect(ETAPES.k3k1.slice(0, 2)).toEqual(['famille citée par une fiche', 'radar Beer Maverick']);
    expect(ETAPES.k3k1.slice(2)).toEqual(ETAPES.k1);
  });
  it('lit le radar de la famille d\'abord (Mandarina Bavaria 4 en agrumes, El Dorado 3)', () => {
    const md = cleHoublon('k3k1', CLE('mandarina-bavaria'), 'citrus'), ed = cleHoublon('k3k1', CLE('el-dorado'), 'citrus');
    expect(md.cle.slice(0, 2)).toEqual([1, 4]);
    expect(ed.cle.slice(0, 2)).toEqual([1, 3]);
    expect(md.origine[1]).toMatch(/radar Beer Maverick/);
    expect(comparerCles(md.cle, ed.cle)).toBeLessThan(0); // Mandarina avant El Dorado
  });
  it('une variété sans radar passe après toutes celles qui en ont, et se range par k1 entre elles (l\'inconnu n\'est jamais 0)', () => {
    const sansRadar = CATALOGUE.filter((h) => !h.bm?.arome).map((h) => h.id).find((id) => cleHoublon('k3k1', id, 'citrus').cle[0] === 1)!;
    expect(sansRadar).toBeTruthy();
    const x = cleHoublon('k3k1', sansRadar, 'citrus');
    expect(x.cle[1]).toBeNull();
    expect(x.cle.slice(2).some((v) => v !== null)).toBe(true); // k1 renseigne ce que les fiches disent
    const radarBas = cleHoublon('k3k1', CLE('pacific-jade'), 'citrus'); // radar 2
    expect(comparerCles(radarBas.cle, x.cle)).toBeLessThan(0);
  });
  it('une famille que nulle fiche ne cite passe après celles que les fiches citent, même avec un radar fort', () => {
    const a = cleHoublon('k3k1', CLE('citra'), 'citrus'), b = { cle: [0, 5, ...a.cle.slice(2)] };
    expect(comparerCles(a.cle, b.cle)).toBeLessThan(0);
  });
  it('une voie sans ajout qui monte n\'a rien à départager : tout est inconnu', () => {
    const v = cleDeVoie('k3k1', [], ['citrus']);
    expect(v.cle).toEqual(ETAPES.k3k1.map(() => null));
  });
});

describe('D191 (22A, groupes du vrai dry hop, actif)', () => {
  const agrumes = dryHop(undefined, { citrus: 1 }), tropicaux = dryHop(undefined, { tropical: 1 });
  const avant = dryHop('aucun', { citrus: 1 });
  it('les voies sont les mêmes, seul l\'ordre change ; les effets (barres) ne changent pas', () => {
    expect(agrumes.vs.map((v) => v.id).sort()).toEqual(avant.vs.map((v) => v.id).sort());
    const effets = (vs: typeof agrumes.vs) => JSON.stringify(vs.map((v) => [v.id, v.effect, v.distance]).sort());
    expect(effets(agrumes.vs)).toBe(effets(avant.vs));
  }, 120_000);
  it('avant : les nobles en tête, El Dorado au fond ; après : les houblons d\'agrumes d\'abord', () => {
    expect(avant.rang('el-dorado')).toBeGreaterThan(avant.vs.length / 2);
    expect(['hallertau-mittelfruh', 'saaz-cz', 'mount-hood'].some((id) => avant.rang(id) > 0 && avant.rang(id) <= 10)).toBe(true);
    expect(agrumes.rang('citra')).toBeLessThanOrEqual(3);
    for (const id of ['hallertau-mittelfruh', 'saaz-cz', 'mount-hood', 'golding']) expect(agrumes.rang(id) === 0 || agrumes.rang(id) > 30, `${id} : ${agrumes.rang(id)}`).toBe(true);
    expect(agrumes.rang('mandarina-bavaria')).toBeLessThanOrEqual(10);
    // El Dorado 223 → 57, Mosaic 136 → 50, Idaho 7 141 → 55 sur 235 : ils montent de plus de 80 rangs, sans entrer dans les 10 premiers (radar agrumes : 3, 3, 3 ; 23 variétés ont 4 ou 5).
    for (const id of ['el-dorado', 'mosaic', 'idaho-7']) { expect(agrumes.rang(id), id).toBeGreaterThan(10); expect(agrumes.rang(id), id).toBeLessThanOrEqual(60); expect(avant.rang(id) - agrumes.rang(id), id).toBeGreaterThan(80); }
  }, 120_000);
  it('tropicaux : Idaho 7 dans les 20 premiers, El Dorado dans les 25, Mosaic dans les 40 (radar tropical : 4, 4, 3 ; 32 variétés ont 4 ou 5)', () => {
    expect(tropicaux.rang('idaho-7')).toBeLessThanOrEqual(20);
    expect(tropicaux.rang('el-dorado')).toBeLessThanOrEqual(25);
    expect(tropicaux.rang('mosaic')).toBeLessThanOrEqual(40);
  }, 120_000);
  it('la clé est dans chaque voie, avec ses origines, et le rang est un ordre total', () => {
    const v = agrumes.vs[0];
    // D120 (t2) : le défaut est k3k1t (la typicité du style entre la famille citée et le radar) ; la table n'est pas posée dans ce fichier, la typicité y est inconnue (null), le radar vient en 3e.
    expect(v.departage?.mode).toBe('k3k1t');
    expect(v.departage!.cle).toHaveLength(ETAPES.k3k1t.length);
    expect(v.departage!.cle[1]).toBeNull();
    expect(v.departage!.origine[2]).toMatch(/radar/);
    for (let i = 1; i < agrumes.vs.length; i++) expect(compareRankKeys(agrumes.vs[i - 1], agrumes.vs[i])).toBeLessThanOrEqual(0);
  });
});

describe('la liste principale garde ses voies neutres (stout S1, « plus floral, moins résineux »)', () => {
  it('les gestes d\'avant restent : Remplacer Nugget, Diminuer Nugget, des ajouts à 10′ (pas de liste chassée par la clé)', () => {
    const apres = proposeVoies(s1Recipe(), { floral: 1, resin: -1 }), avant = proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, { departage: 'aucun' });
    const n = (r: typeof apres, t: string) => r.voies.filter((v) => v.type === t).length;
    expect(n(apres, 'remplacer à IBU égal')).toBe(n(avant, 'remplacer à IBU égal'));
    expect(apres.voies.some((v) => v.label.startsWith('Diminuer Nugget'))).toBe(true);
    expect(apres.voies.some((v) => v.type === 'ajouter' && v.actions[0].moment === 'b10')).toBe(true);
  });
});
