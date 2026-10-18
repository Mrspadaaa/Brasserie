import { describe, expect, it } from 'vitest';
import facts from '../data/faits-cites.json';
import { FAMILIES, describeFamilies, getStyleScale, hopProfile, offModelLeads, proposeVoies, recipeProfile, situateBeer, tastingFrom } from '../src/engine';
import { S1_DIRECTION, S1_TASTING, s1Recipe } from '../src/pack/buildPack';

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
