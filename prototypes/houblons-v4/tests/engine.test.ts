import { describe, expect, it } from 'vitest';
import {
  FAMILIES, additionIbu, applyVoie, gramsForIbu, hopProfile, hopRef, matrixContext, proposeVoies, recipeIbu, recipeProfile, styleFit, getStyleScale, yeastInfo, STOCK, CATALOGUE,
  type Recipe,
} from '../src/engine';
import { s1Recipe } from '../src/pack/buildPack';

const stout = (additions: Recipe['additions'], yeastId: string | null = 'fermentis-us05'): Recipe => ({ ...s1Recipe(), yeastId, additions });

describe('Moteur v4 sur le moteur V5.5 importé', () => {
  const s1 = proposeVoies(s1Recipe(), { floral: 1, resin: -1 });

  it('S1 stout export, Nugget à 60′, « plus floral, moins résineux » : au moins 2 voies du stock avec dose, moment, effet par famille, IBU et stock', () => {
    const fromStock = s1.voies.filter((v) => v.domain === 'stock');
    expect(fromStock.length).toBeGreaterThanOrEqual(2);
    for (const v of fromStock.slice(0, 2)) {
      expect(v.actions.length).toBeGreaterThan(0);
      for (const a of v.actions) {
        expect(a.hopName).toBeTruthy();
        expect(a.momentLabel).toBeTruthy();
        expect(a.grams).toBeGreaterThan(0);
        expect(a.gramsPerLitre).toBeCloseTo(a.grams / 20, 2);
      }
      expect(Object.keys(v.effect)).toHaveLength(12);
      expect(v.effect.floral.established).toBe(true);
      expect(v.effect.floral.central!).toBeGreaterThan(0);
      expect(Number.isFinite(v.ibu.after)).toBe(true);
      expect(['suffisant', 'manque']).toContain(v.stock.status);
      expect(v.after).not.toBeNull();
    }
    expect(s1.ibu).toBeCloseTo(59.7, 1);
  });

  it('direction relative à la recette : « plus floral » monte la cible d’un cran du style, « moins résineux » la baisse (pas seulement une exclusion)', () => {
    const floral = s1.direction.find((d) => d.family === 'floral')!, resin = s1.direction.find((d) => d.family === 'resin')!;
    const scale = getStyleScale('16D');
    expect(floral.delta).toBeCloseTo(scale.families.floral.cran, 1);
    expect(resin.delta).toBeCloseTo(-scale.families.resin.cran, 1);
    expect(floral.targetAbsolute).toBeCloseTo(s1.before.profile.floral.central! + floral.delta, 1);
    // Exclusion en plus de la cible : un houblon cité résineux (Cascade : « pine ») est en conflit.
    const cascade = proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, { limit: 40, perHop: 4 }).voies.filter((v) => v.actions.some((a) => a.hopKey === 'beermaverick-cascade'));
    expect(cascade.length).toBeGreaterThan(0);
    for (const v of cascade) expect(v.conflicts.join(' ')).toMatch(/exclu par ta direction/);
    // Deux crans visent deux fois plus loin.
    expect(proposeVoies(s1Recipe(), { floral: 2 }).direction[0].delta).toBeCloseTo(2 * scale.families.floral.cran, 1);
  });

  it('classement lexicographique : conflits, puis distance en unités du style, puis stock, puis dérive d’IBU ; stock d’abord, à acheter ensuite', () => {
    const domains = s1.voies.map((v) => v.domain);
    expect(domains.lastIndexOf('stock')).toBeLessThan(domains.indexOf('à acheter') === -1 ? Infinity : domains.indexOf('à acheter'));
    const stockVoies = s1.voies.filter((v) => v.domain === 'stock');
    for (let i = 1; i < stockVoies.length; i++) {
      const [p, q] = [stockVoies[i - 1], stockVoies[i]];
      expect(p.conflicts.length).toBeLessThanOrEqual(q.conflicts.length);
      if (p.conflicts.length === q.conflicts.length && p.distance.total !== null && q.distance.total !== null) expect(p.distance.total).toBeLessThanOrEqual(q.distance.total + 1e-9);
    }
    expect(s1.voies.some((v) => v.domain === 'à acheter' && v.stock.status === 'à acheter')).toBe(true);
  });

  it('stock libre = stock moins les ajouts de la recette', () => {
    const r = proposeVoies(stout([...s1Recipe().additions, { id: 'm', hopKey: 'beermaverick-motueka', moment: 'dryPost', grams: 15 }]), { floral: 1 }, { limit: 40, perHop: 6 });
    const v = r.voies.find((x) => x.actions.length === 1 && x.actions[0].hopKey === 'beermaverick-motueka' && x.actions[0].grams === 10);
    expect(v).toBeDefined();
    expect(v!.stock.status).toBe('manque');
    expect(v!.stock.missing[0].grams).toBe(5);
  });

  it('remplacer un ajout d’amertume à IBU égal, à 0,5 IBU près', () => {
    const r = proposeVoies(stout([{ id: 'c', hopKey: 'beermaverick-cascade', moment: 'b60', grams: 60 }]), { resin: -1 }, { limit: 40, perHop: 4 });
    const swaps = r.voies.filter((v) => v.type === 'remplacer à IBU égal');
    expect(swaps.length).toBeGreaterThan(0);
    for (const v of swaps) expect(Math.abs(v.ibu.after - v.ibu.before)).toBeLessThanOrEqual(0.5 + 0.05);
    expect(swaps[0].effect.resin.central!).toBeLessThan(0);
  });

  it('remplacer un ajout d’arôme à masse égale', () => {
    const r = proposeVoies(stout([...s1Recipe().additions, { id: 'w', hopKey: 'beermaverick-cascade', moment: 'wp', grams: 40 }]), { resin: -1 }, { limit: 40, perHop: 4 });
    const swaps = r.voies.filter((v) => v.type === 'remplacer à masse égale');
    expect(swaps.length).toBeGreaterThan(0);
    for (const v of swaps) expect(v.actions[0].grams).toBe(40);
  });

  it('assemblage de deux houblons et dry hop en fermentation active : marqués estimés', () => {
    const blend = s1.voies.find((v) => v.type === 'assemblage');
    expect(blend).toBeDefined();
    expect(blend!.estimated).toBe(true);
    expect(blend!.actions).toHaveLength(2);
    const active = proposeVoies(s1Recipe(), { floral: 1 }, { moments: ['dryActive'], limit: 20 }).voies.filter((v) => v.type === 'ajouter');
    expect(active.length).toBeGreaterThan(0);
    for (const v of active) expect(v.estimatedWhy.join(' ')).toMatch(/biotransformation/);
  });

  it('une inconnue reste « inconnu », jamais 0 (levure absente, houblon sans descripteur)', () => {
    const p = recipeProfile(stout(s1Recipe().additions, 'levure-inexistante'));
    for (const f of FAMILIES) {
      expect(p.profile[f].status).toBe('inconnu');
      expect(p.profile[f].range).toBeNull();
      expect(p.profile[f].central).toBeUndefined();
    }
    expect(p.yeast.status).toBe('absente');
    const r = proposeVoies(stout(s1Recipe().additions, 'levure-inexistante'), { floral: 1 });
    expect(r.voies.every((v) => v.distance.total === null)).toBe(true);
    const bare = CATALOGUE.find((c) => c.tags.length === 0 && !c.hopsteinerId)!;
    expect(hopProfile(bare.id).families.floral.citation).toBe('sans descripteur');
  });

  it('levure : caractérisée (3 souches du modèle) ou inconnue, jamais neutre', () => {
    expect(yeastInfo('fermentis-us05').status).toBe('caractérisée');
    expect(yeastInfo('lalbrew-diamond').status).toBe('inconnue');
    const known = recipeProfile(s1Recipe()).profile.floral.range!, unknown = recipeProfile(stout(s1Recipe().additions, 'lalbrew-nottingham')).profile.floral.range!;
    expect(unknown.max - unknown.min).toBeGreaterThan(known.max - known.min);
  });

  it('matrice et masquage : facteur V5.5 rendu comme hypothèse, contexte de la bière listé en inconnues, aucun coefficient inventé', () => {
    const m = matrixContext(s1Recipe());
    expect(m.contextApplied).toBe(false);
    expect(m.factor.range).toEqual({ min: 0.85, max: 1.15 });
    expect(m.unknowns.join(' ')).toMatch(/torréfié/);
    expect(m.context.find((c) => c.label.startsWith('Couleur'))!.value).toBe('70 EBC');
    expect(recipeProfile({ ...s1Recipe(), ebc: 10 }).profile).toEqual(recipeProfile({ ...s1Recipe(), ebc: 80 }).profile);
  });

  it('IBU par BrewingMath.hopIbu (importé) et dose inverse', () => {
    const r = s1Recipe();
    expect(additionIbu(r.additions[0], r).value).toBeCloseTo(59.73, 1);
    expect(gramsForIbu(60, hopRef('beermaverick-nugget')!, 'b60', r)).toBeCloseTo(46.2, 1);
    expect(recipeIbu({ ...r, additions: [{ id: 'd', hopKey: 'beermaverick-galaxy', moment: 'dryPost', grams: 80 }] }).value).toBe(0);
  });

  it('poser une voie puis annuler : la recette d’avant reste intacte', () => {
    const before = s1Recipe();
    const after = applyVoie(before, s1.voies[0]);
    expect(after.additions.length).toBeGreaterThan(before.additions.length - 1);
    expect(before).toEqual(s1Recipe());
  });

  it('adéquation au style : tout le stock classé pour une American IPA, sans score chiffré', () => {
    const rows = styleFit(STOCK.map((s) => s.key), getStyleScale('21A'));
    expect(rows).toHaveLength(STOCK.length);
    expect(rows[0].fit).toBe('usage attesté');
    expect(rows.every((r) => !('score' in r))).toBe(true);
  });
});
