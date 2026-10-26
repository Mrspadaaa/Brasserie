// Voie f4-cout-et-usage (D106) : (1) le premier affichage de Suggérer ne calcule pas les remplacements (`remplacements: false`) et ne change rien d'autre ;
// (2) à 60′, un remplaçant d'usage « arôme » (Beer Maverick) recule dans Substituer, comme Suggérer le lit, avec sa raison écrite.
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../../src/domain/hopIndex/v4';

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const CLE = (id: string) => `beermaverick-${id}`;
const R21C: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 20 }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 46 }] };
const estRemplacement = (v: Voie) => v.type === 'remplacer à IBU égal' || v.type === 'remplacer à masse égale';
const effets = (v: Voie) => JSON.stringify({ e: v.effect, d: v.distance, i: v.ibu, o: v.overflowTotal, c: v.conflicts, a: v.actions });

describe('premier affichage de Suggérer : sans les remplacements (D106)', () => {
  it('le défaut est inchangé : `remplacements` absent, undefined ou true rendent le même résultat, à l\'octet près', () => {
    const a = JSON.stringify(m.proposeVoies(R16D, { resin: -1 }, { assemblages: true }));
    expect(JSON.stringify(m.proposeVoies(R16D, { resin: -1 }, { assemblages: true, remplacements: undefined }))).toBe(a);
    expect(JSON.stringify(m.proposeVoies(R16D, { resin: -1 }, { assemblages: true, remplacements: true }))).toBe(a);
  });

  it('`remplacements: false` : aucune voie « remplacer », et moins d\'évaluations', () => {
    const plein = m.proposeVoies(R16D, { resin: -1 }, { assemblages: true });
    const rapide = m.proposeVoies(R16D, { resin: -1 }, { assemblages: true, remplacements: false });
    expect(plein.voies.some(estRemplacement)).toBe(true); // témoin positif : l'appel complet en rend (16D « moins résineux »)
    expect(rapide.voies.some(estRemplacement)).toBe(false);
    expect(rapide.evaluated).toBeLessThan(plein.evaluated);
  });

  it('les voies qui ne sont pas des remplacements gardent leur ordre et leurs effets, sur trois visées', () => {
    for (const [r, dir] of [[R21C, { citrus: 1 }], [R16D, { floral: 1 }], [R16D, { resin: -1 }]] as const) {
      const plein = m.proposeVoies(r, dir, { assemblages: true });
      const rapide = m.proposeVoies(r, dir, { assemblages: true, remplacements: false });
      const communes = rapide.voies.filter((v) => plein.voies.some((w) => w.id === v.id));
      expect(communes.map((v) => v.id)).toEqual(plein.voies.filter((v) => !estRemplacement(v) && rapide.voies.some((w) => w.id === v.id)).map((v) => v.id));
      for (const v of communes) expect(effets(v)).toBe(effets(plein.voies.find((w) => w.id === v.id)!));
      // La seule différence de contenu : une place rendue aux ajouts quand un remplacement l'occupait (au plus autant de voies en plus que de remplacements).
      const enPlus = rapide.voies.filter((v) => !plein.voies.some((w) => w.id === v.id)).length;
      expect(enPlus).toBeLessThanOrEqual(plein.voies.filter(estRemplacement).length);
    }
  });

  it('les leviers levure (dry hop actif, souches) sont les mêmes sans les remplacements ; seuls `rank` et `tieWith` peuvent changer', () => {
    const sansRang = (vs: Voie[]) => vs.filter((v) => v.type === 'levure').map(({ rank: _r, tieWith: _t, ...reste }) => reste);
    for (const [r, dir] of [[R21C, { citrus: 1 }], [R16D, { resin: -1 }]] as const) {
      const plein = m.proposeVoies(r, dir, { assemblages: false, leviersLevure: true });
      const rapide = m.proposeVoies(r, dir, { assemblages: false, leviersLevure: true, remplacements: false, maxBuy: 0, moments: ['dryActive'] });
      expect(sansRang(rapide.voies).length).toBeGreaterThan(0);
      expect(JSON.stringify(sansRang(rapide.voies))).toBe(JSON.stringify(sansRang(plein.voies)));
    }
  });
});

describe('Substituer à 60′ : l\'usage « arôme » recule comme dans Suggérer (D106)', () => {
  const usage = (key: string) => CATALOGUE.find((c) => `beermaverick-${c.id}` === key || c.id === key)?.purpose ?? null;
  const nugget = (options: object = {}) => m.substitutes(CLE('nugget'), { moment: 'b60', grams: 46, recipe: R16D, ...options });

  it('aucun houblon d\'usage « arôme » dans les 10 premiers de Nugget à 60′', () => {
    const top = nugget({ limit: 10 }).remplacants;
    expect(top).toHaveLength(10);
    expect(top.filter((s) => usage(s.key) === 'aroma')).toEqual([]);
  });

  it('chaque remplaçant d\'usage « arôme » porte sa démotion écrite et passe après tous ceux qui n\'en ont pas', () => {
    const tous = nugget().remplacants;
    const aroma = tous.filter((s) => usage(s.key) === 'aroma');
    expect(aroma.length).toBeGreaterThan(10); // témoin positif : le catalogue en compte (Falconer's Flight, Altus, Akoya, Loral, Sequoia Blend…)
    for (const s of aroma) expect(s.amertumeDeconseillee).toBeTruthy();
    for (const nom of ['Falconer\'s Flight', 'Altus', 'Akoya', 'Loral', 'Sequoia Blend']) {
      const s = tous.find((x) => x.name === nom);
      if (s) expect(s.amertumeDeconseillee).toMatch(/cher pour amériser/);
    }
    const dernierNonDemote = Math.max(...tous.filter((s) => !s.amertumeDeconseillee && s.couverture.fiabilite !== 'faible').map((s) => s.rank));
    for (const s of aroma.filter((x) => x.couverture.fiabilite !== 'faible')) expect(s.rank).toBeGreaterThan(dernierNonDemote);
    expect(aroma.some((s) => /usage « arôme » \(Beer Maverick\)/.test(s.raison))).toBe(true);
  });

  it('un original d\'usage « arôme », ou un moment d\'arôme : la règle ne s\'applique pas (choix délibéré du brasseur)', () => {
    const original = CATALOGUE.find((c) => c.purpose === 'aroma' && c.alpha && c.alpha[0] > 0)!;
    const r = m.substitutes(original.id, { moment: 'b60', grams: 30, recipe: R16D });
    expect(r.remplacants.every((s) => s.amertumeDeconseillee === null)).toBe(true);
    const arome = m.substitutes(CLE('nugget'), { moment: 'dryActive', grams: 80, recipe: R21C });
    expect(arome.remplacants.every((s) => s.amertumeDeconseillee === null)).toBe(true);
  });
});
