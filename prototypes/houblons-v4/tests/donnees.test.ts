import { describe, expect, it } from 'vitest';
import facts from '../data/faits-cites.json';
import { FAMILIES, IBU_MOMENTS, QUICK_ADD_RULE, additionIbu, ibuByMoment, momentCatalogue, quickAddKey, describeFamilies, gapSummary, getStyleScale, hopProfile, offModelLeads, proposeVoies, quickAdds, readBeer, readingSummary, recipeProfile, situateBeer, tastingFrom, voiesSummary, type QuickAdd } from '../src/engine';
import { S1_DIRECTION, S1_TASTING, s1Recipe, s2Recipe } from '../src/pack/buildPack';

describe('IBU par moment (ibuParMoment)', () => {
  it('Nugget de la recette : IBU de BrewingMath par moment, IBU par gramme cohérent, à froid non modélisé', () => {
    const r = s1Recipe();
    const rows = ibuByMoment('beermaverick-nugget', 46, r);
    expect(rows.map((x) => x.code)).toEqual(IBU_MOMENTS);
    const at = (c: string) => rows.find((x) => x.code === c)!;
    expect(at('b60').ibu!.value).toBeCloseTo(additionIbu(r.additions[0], r).value, 1);
    for (const x of rows.filter((y) => y.modelled)) expect(x.ibu!.value).toBeCloseTo(46 * x.ibuPerGram!.value, 0);
    expect(at('b60').ibu!.value).toBeGreaterThan(at('b10').ibu!.value);
    expect(at('b10').ibu!.value).toBeGreaterThan(at('wp').ibu!.value);
    expect(at('b0').ibu!.value).toBe(0);
    for (const c of ['dryActive', 'dryPost']) expect(at(c)).toMatchObject({ modelled: false, ibu: null, ibuPerGram: null, raison: expect.stringMatching(/cru/) });
    const cat = momentCatalogue(60);
    expect(cat.find((m) => m.code === 'wp')!.when).toMatchObject({ temperatureC: 80, minutes: 20 });
    expect(cat.find((m) => m.code === 'dryPost')!.when.unit).toBe('jour de houblonnage à cru');
  });

  it('chaque ajout rapide porte son IBU par moment à la dose proposée', () => {
    const q = quickAdds(s1Recipe(), getStyleScale('16D'), S1_TASTING);
    for (const e of q.disponibles) {
      expect(e.ibuParMoment).toHaveLength(IBU_MOMENTS.length);
      expect(e.ibuParMoment.find((x) => x.code === 'b10')!.ibu!.value).toBeCloseTo(e.ibuAdded!.value, 1);
    }
  });
});

describe('Ajout en un toucher (ajoutsRapides)', () => {
  const keyOf = (r: QuickAdd) => [['usage attesté', 'cohérent', 'peu documenté', 'non documenté', 'hors style'].indexOf(r.fit), r.tastingConflicts.length ? 1 : 0, r.offStyleWeight, -r.supports.length, -r.stock.free];
  const ordered = (list: QuickAdd[]) => { for (let i = 1; i < list.length; i++) { const a = keyOf(list[i - 1]), b = keyOf(list[i]); const d = a.findIndex((x, j) => x !== b[j]); if (d >= 0) expect(a[d]).toBeLessThan(b[d]); expect(quickAddKey(list[i - 1])).toEqual(a); } };

  it('16D avec la dégustation : un houblon qui cite la famille « trop » ne passe pas devant un houblon qui ne la cite pas, à catégorie égale', () => {
    const q = quickAdds(s1Recipe(), getStyleScale('16D'), S1_TASTING);
    expect(q.tastingTrop).toEqual(['resin']);
    for (const list of [q.disponibles, q.epuises]) {
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        if (list[i].fit === list[j].fit && list[j].tastingConflicts.length === 0) expect(list[i].tastingConflicts).toEqual([]);
      }
      for (const r of list) expect(r.tags).toEqual(r.tastingConflicts.map(() => '+ boisé et résineux'));
    }
    const cascade = q.disponibles.find((r) => r.name === 'Cascade')!;
    expect(cascade.tastingConflicts).toEqual(['resin']);
    ordered(q.disponibles); ordered(q.epuises);
  });

  it('16D : stock disponible d’abord, épuisés à part, classement selon la règle écrite, 10′ et 10 g plafonnés au stock libre', () => {
    const q = quickAdds(s1Recipe(), getStyleScale('16D'));
    expect(q.rule).toEqual(QUICK_ADD_RULE);
    expect(q.disponibles.every((r) => r.stock.free > 0)).toBe(true);
    expect(q.epuises.every((r) => r.stock.free <= 0)).toBe(true);
    expect(q.disponibles.length + q.epuises.length).toBe(16);
    ordered(q.disponibles); ordered(q.epuises);
    for (const r of q.disponibles) {
      expect(r.moment).toBe('b10');
      expect(r.dose!.grams).toBe(Math.min(10, r.stock.free));
      expect(r.ibuAdded!.value).toBeCloseTo(additionIbu({ id: 'q', hopKey: r.key, moment: 'b10', grams: r.dose!.grams }, s1Recipe()).value, 1);
      expect(r.cited.every((c) => c.level !== 'non décrit')).toBe(true);
    }
    expect(q.disponibles.find((r) => r.name === 'Target')!.dose).toMatchObject({ grams: 5, rule: 'tout le stock libre' });
  });

  it('3B, recette sans houblon : 60′ et la dose qui amène l’IBU au milieu de la bande', () => {
    const recipe = s2Recipe(), scale = getStyleScale('3B');
    const q = quickAdds(recipe, scale);
    const mid = (scale.ibu![0] + scale.ibu![1]) / 2;
    for (const r of q.disponibles) {
      expect(r.moment).toBe('b60');
      expect(Math.abs(r.ibuAdded!.value - mid)).toBeLessThanOrEqual(0.5);
    }
    ordered(q.disponibles);
  });
});

describe('Lecture commune (reading)', () => {
  it('S1 : une entrée par famille dans l’ordre du style, la dégustation prime, comptes et phrases calculés', () => {
    const scale = getStyleScale('16D');
    const reading = readBeer(recipeProfile(s1Recipe()).profile, S1_TASTING, scale);
    expect(reading.map((r) => r.family)).toEqual(scale.order);
    expect(reading.find((r) => r.family === 'resin')).toMatchObject({ source: 'dégustation', verdict: 'trop', perceived: 'marqué', verdictFrom: 'dégustation' });
    for (const r of reading.filter((x) => x.source === 'non situé')) expect(r).toMatchObject({ verdict: 'non situé', byCentral: null });
    const s = readingSummary(reading);
    expect(Object.values(s.counts).reduce((a, b) => a + b, 0)).toBe(12);
    expect(s.sentence).toContain(`${s.counts['au style']} au style`);
    expect(s.sentence).toContain(`${s.counts['non situé']} non situées`);
    expect(s.sentence.startsWith('Boisé et résineux trop marqué')).toBe(true);
    const r1 = proposeVoies(s1Recipe(), S1_DIRECTION);
    const v = voiesSummary(r1);
    const floral = r1.voies.filter((x) => x.effect.floral.established && x.effect.floral.central! > 0);
    expect(v.byFamily[0].sensible + v.byFamily[0].weak).toBe(floral.length);
    expect(v.byFamily[1].sensible).toBe(0);
    expect(v.sentence).toMatch(/^Plus floral : \d+ voies?.* · Moins boisé et résineux : \d+ voies?, faibles?$/);
  });

  it('S2 : résumé des écarts entre houblons, compté sur les paires', () => {
    const s = gapSummary(['A', 'B'], [{ families: { floral: { verdict: '≈', why: 'plages recouvrantes' }, spice: { verdict: 'écart', why: 'au-delà du seuil' } } }]);
    expect(s.counts).toEqual({ '≈ (plages recouvrantes)': 1, 'écart (au-delà du seuil)': 1 });
    expect(s.sentence).toContain('sur 2 comparaisons');
  });
});

describe('Données citées, niveaux de citation, dégustation (D25)', () => {
  it('Nugget : la résine devient citée par deux fiches sourcées (boutique Hopsteiner US, Yakima Chief)', () => {
    for (const f of facts.facts) {
      expect(f.description.source.reference).toMatch(/^https:\/\//);
      expect(f.description.source.locator).toMatch(/18\.10\.2026/);
    }
    const d = describeFamilies('beermaverick-nugget');
    expect(d.resin).toMatchObject({ level: 'marqué', sources: 2, of: 4 });
    expect(d.resin.authors).toEqual(expect.arrayContaining(['Hopsteiner (boutique US)', 'Yakima Chief Hops']));
  });

  it('en S1, une voie « diminuer ou remplacer Nugget » est établie et classée, sans conflit', () => {
    const r = proposeVoies(s1Recipe(), S1_DIRECTION);
    const nugget = r.voies.filter((v) => v.actions.some((a) => a.additionId === 'a1'));
    expect(nugget.length).toBeGreaterThan(0);
    for (const v of nugget) {
      expect(v.effect.resin.established).toBe(true);
      expect(v.effect.resin.central!).toBeLessThan(0);
      expect(v.conflicts).toEqual([]);
      expect(v.rank).toBeGreaterThan(0);
    }
    expect(nugget.some((v) => v.type === 'remplacer à IBU égal')).toBe(true);
    expect(r.direction.find((d) => d.family === 'resin')!.note).toBeNull();
  });

  it('cible : la dégustation « trop » fixe le retour dans la bande ; sans dégustation, repère du modèle moins un cran', () => {
    const tasted = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING }).direction;
    expect(tasted.find((d) => d.family === 'resin')).toMatchObject({ targetAbsolute: 30, targetFrom: 'dégustation' });
    expect(tasted.find((d) => d.family === 'floral')!.targetFrom).toBe('modèle');
    const plain = proposeVoies(s1Recipe(), S1_DIRECTION).direction.find((d) => d.family === 'resin')!;
    expect(plain).toMatchObject({ targetAbsolute: 0, targetFrom: 'modèle' });
    // Bord : « faible » (0–33) touche le bas de la bande floral 3B (33–68) ; ce n'est pas « peu »
    // (plage pas entièrement sous la bande), la règle du modèle reste. Aucune bande actuelle n'a
    // un bas au-dessus de 33 : « peu » par la dégustation ne survient pas avec la table v1.
    const lager = { ...s1Recipe(), styleCode: '3B' };
    const weak = tastingFrom({ floral: 'faible' }, { origin: 'test', date: '2026-10-18', quote: null, source: 'test' });
    expect(proposeVoies(lager, { floral: 1 }, { tasting: weak }).direction[0].targetFrom).toBe('modèle');
  });

  it('trois niveaux : non décrit, cité, marqué ; un « non décrit » reste « non décrit », jamais 0', () => {
    const d = describeFamilies('beermaverick-nugget');
    expect(d.stoneFruit).toMatchObject({ level: 'non décrit', sources: 0, of: 4 });
    expect(d.citrus).toMatchObject({ level: 'cité', sources: 1, first: false });
    expect(d.herbal.first).toBe(true);
    expect(d.herbal.level).toBe('marqué');
    const p = hopProfile('beermaverick-nugget');
    expect(p.families.stoneFruit.description.level).toBe('non décrit');
    expect(p.families.stoneFruit.description).not.toHaveProperty('intensity');
  });

  it('pistes hors houblon pour « moins résineux » : liste fixe, sourcée, sans chiffres, hors modèle', () => {
    const [resin] = offModelLeads(S1_DIRECTION);
    expect(resin.family).toBe('resin');
    expect(resin.leads.map((l) => l.id)).toEqual(['amertume', 'torrefie', 'oxydation', 'dose-ebullition']);
    for (const l of resin.leads) {
      expect(l.horsModele).toBe(true);
      expect(l.sources.length).toBeGreaterThan(0);
      for (const s of l.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(`${l.title} ${l.why} ${l.action}`).not.toMatch(/\d/);
    }
    expect(offModelLeads({ floral: 1 })).toEqual([]);
  });

  it('plages pleines : « non situé », jamais affichées en 0–100', () => {
    for (const e of Object.values(hopProfile('beermaverick-saaz-cz').families)) if (e.completeDomain) expect(e.situated).toBe(false);
    const before = recipeProfile(s1Recipe()).profile;
    expect(before.stoneFruit.situated).toBe(false);
    expect(before.floral.situated).toBe(true);
  });

  it('dégustation : seule la phrase du brasseur est saisie (résine marquée) ; elle situe la bière avant le modèle', () => {
    const resin = S1_TASTING.axes.find((a) => a.family === 'resin')!;
    expect(resin).toMatchObject({ perceived: 'marqué', perceivedRange: { min: 66, max: 100 } });
    expect(resin.source).toMatch(/trop résineuses/);
    for (const a of S1_TASTING.axes.filter((x) => x.family !== 'resin')) expect(a).toMatchObject({ perceived: null, perceivedRange: null, source: null });
    const situated = situateBeer(recipeProfile(s1Recipe()).profile, S1_TASTING, getStyleScale('16D'));
    expect(situated.resin).toMatchObject({ basis: 'dégustation', verdict: 'trop' });
    expect(situated.floral.basis).toBe('modèle');
    expect(situated.stoneFruit.basis).toBe('non situé');
    const none = situateBeer(recipeProfile(s1Recipe()).profile, tastingFrom({}, { origin: 'test', date: '2026-10-18', quote: null, source: 'test' }), getStyleScale('16D'));
    expect(FAMILIES.filter((f) => none[f].basis === 'dégustation')).toEqual([]);
  });
});
