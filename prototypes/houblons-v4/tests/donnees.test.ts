import { describe, expect, it } from 'vitest';
import facts from '../data/faits-cites.json';
import { NO_GOUTS, afterCrans, beerCrans, citations, hopRef, shoppingList, targetCrans } from '../src/engine';
import { CHARACTERIZED_YEASTS, applyVoie, compareRankKeys, yeastDoubleImpact, yeastSignals } from '../src/engine';
import { ROUE_AROMES, afterLevelsDelta, hopSheet, beerContinuous, targetContinuous, afterContinuous } from '../src/engine';
import { FAMILIES, IBU_MOMENTS, QUICK_ADD_RULE, additionIbu, afterLevels, beerLevels, ficheLevels, ibuByMoment, loadedRecipe, momentCatalogue, quickAddKey, recipeIbu, recipeLines, targetLevels, tastingMention, describeFamilies, gapSummary, getStyleScale, hopProfile, offModelLeads, proposeVoies, quickAdds, readBeer, readingSummary, recipeProfile, situateBeer, tastingFrom, voiesSummary, type QuickAdd } from '../src/engine';
import { S1_DIRECTION, S1_TASTING, s1Recipe, s2Recipe } from '../src/pack/buildPack';

describe('Les quatre objets de l’écran (niveaux)', () => {
  const s16d = getStyleScale('16D');
  const beer = beerLevels(recipeProfile(s1Recipe()).profile, S1_TASTING, s16d);

  it('profil de ma bière : la dégustation prime sur le modèle ; une famille non située reste null ; intensité sur 0–3', () => {
    expect(beer.map((b) => b.family)).toEqual(s16d.order);
    expect(beer.find((b) => b.family === 'resin')).toMatchObject({ level: 3, source: 'dégustation' });
    // Sans dégustation, la résine vient du modèle (repère central 6,5 → faible).
    expect(beerLevels(recipeProfile(s1Recipe()).profile, null, s16d).find((b) => b.family === 'resin')).toMatchObject({ level: 1, source: 'modèle' });
    for (const b of beer.filter((x) => x.source === 'non situé')) expect(b.level).toBeNull();
    expect(beer.some((b) => b.source === 'non situé')).toBe(true);
    for (const b of beer.filter((x) => x.level !== null)) expect([0, 1, 2, 3]).toContain(b.level);
    expect(beer.filter((b) => b.level === 0)).toEqual([]); // aucune absence prouvée par le modèle ici
  });

  it('cible du style sur la même échelle ; profil après une voie ; fiches sur 0–2', () => {
    const target = targetLevels(s16d);
    expect(target.find((t) => t.family === 'floral')).toMatchObject({ min: 0, max: 2, status: 'attendue' });
    expect(target.find((t) => t.family === 'resin')).toMatchObject({ min: 0, max: 1, status: 'neutre' });
    expect(targetLevels(getStyleScale('3B')).find((t) => t.family === 'floral')).toMatchObject({ min: 2, max: 3 });
    expect(targetLevels(getStyleScale('21C')).find((t) => t.family === 'green')).toMatchObject({ min: 0, max: 0 });
    for (const t of target) { expect(t.min).toBeGreaterThanOrEqual(0); expect(t.max).toBeLessThanOrEqual(3); expect(t.min).toBeLessThanOrEqual(t.max); }
    const r = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING });
    for (const v of r.voies) {
      const after = afterLevels(beer, v.effect);
      for (const a of after) {
        const b = beer.find((x) => x.family === a.family)!;
        if (a.effet === 'non établi') expect(a.level).toBe(b.level);
        if (a.level !== null) expect([0, 1, 2, 3]).toContain(a.level);
      }
      // La résine dégustée « marqué » ne change de classe qu'avec un effet assez grand : jamais ici.
      expect(after.find((a) => a.family === 'resin')!.level).toBe(3);
    }
    for (const f of ficheLevels('beermaverick-nugget', s16d)) expect([0, 1, 2]).toContain(f.level);
    expect(ficheLevels('beermaverick-nugget', s16d).find((f) => f.family === 'resin')).toMatchObject({ level: 2, sources: 2, of: 4 });
    expect(ficheLevels('beermaverick-nugget', s16d).find((f) => f.family === 'stoneFruit')).toMatchObject({ level: 0, sources: 0 });
  });
});

describe('Cas de figure S4 (sans houblon) et S5 (recette chargée)', () => {
  const s16d = getStyleScale('16D');

  it('S4 : IBU 0, ajouts rapides à 60′ pour atteindre le milieu de la bande, aucun niveau dégusté', () => {
    const recipe = { ...s1Recipe(), additions: [] };
    expect(recipeIbu(recipe).value).toBe(0);
    const q = quickAdds(recipe, s16d, null);
    for (const r of q.disponibles) { expect(r.moment).toBe('b60'); expect(Math.abs(r.ibuAdded!.value - 60)).toBeLessThanOrEqual(0.5); }
    expect(beerLevels(recipeProfile(recipe).profile, null, s16d).filter((b) => b.source === 'dégustation')).toEqual([]);
  });

  it('S5 : quatre ajouts par règle (60′, 10′, whirlpool, à froid J+3), IBU total au milieu de la bande', () => {
    const recipe = loadedRecipe(s1Recipe(), s16d);
    const lines = recipeLines(recipe);
    expect(lines.map((l) => [l.type, l.moment])).toEqual([['ébullition', 'b60'], ['ébullition', 'b10'], ['whirlpool', 'wp'], ['à froid', 'dryActive']]);
    expect(lines[0].hopKey).toBe('beermaverick-nugget');
    expect(lines[3]).toMatchObject({ day: 3, dayLabel: 'J+3', ibu: null });
    expect(new Set(lines.slice(1).map((l) => l.hopKey)).size).toBe(3);
    for (const l of lines.slice(1)) expect(l.stock.status).toBe('suffisant');
    expect(Math.abs(recipeIbu(recipe).value - 60)).toBeLessThanOrEqual(0.5);
    const sum = lines.reduce((s, l) => s + (l.ibu?.value ?? 0), 0);
    expect(sum).toBeCloseTo(recipeIbu(recipe).value, 0);
  });

  it('mention d’un niveau dégusté : brassin si connu, sinon la phrase datée du brasseur', () => {
    const resin = beerLevels(recipeProfile(s1Recipe()).profile, S1_TASTING, s16d).find((b) => b.family === 'resin')!;
    expect(resin.mention).toMatch(/^dégustation du brasseur, 18\.10 : « ma stout est trop résineuses/);
    expect(tastingMention({ ...S1_TASTING, batch: { id: 'B-12', date: '2026-09-30' } })).toBe('brassin du 30.09');
    expect(beerLevels(recipeProfile(s1Recipe()).profile, S1_TASTING, s16d).filter((b) => b.source !== 'dégustation').every((b) => b.mention === undefined)).toBe(true);
  });
});

describe('Radars en intensité absolue (D24) et fiches houblons', () => {
  const s16d = getStyleScale('16D');
  const beer = beerLevels(recipeProfile(s1Recipe()).profile, S1_TASTING, s16d);

  it('profilApresNiveaux et deltaNiveaux : la dégustation prime, « ≈ » sous le seuil, null sans effet établi', () => {
    const r = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING, leviersLevure: true });
    for (const v of r.voies) {
      const { niveaux, delta } = afterLevelsDelta(beer, v.effect, s16d);
      expect(niveaux.map((n) => n.family)).toEqual(s16d.order);
      expect(niveaux.find((n) => n.family === 'resin')!.level).toBe(3);
      for (const f of FAMILIES) {
        const e = v.effect[f];
        if (!e.established) expect(delta[f]).toBeNull();
        else if (Math.abs(e.central!) < s16d.families[f].threshold) expect(delta[f]).toBe('≈');
        else expect(delta[f] === null || Number.isInteger(delta[f])).toBe(true);
      }
    }
    expect(new Set(ROUE_AROMES.map((r) => r.id)).size).toBe(12);
    expect(ROUE_AROMES.map((r) => r.id)).toEqual(['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin']);
  });

  it('échelle continue 0–3 : la dégustation prime (marqué 2,5), repère / 33,33, null sans effet établi ou non situé', () => {
    const avant = beerContinuous(beer);
    expect(avant.map((a) => a.family)).toEqual(s16d.order);
    expect(avant.find((a) => a.family === 'resin')).toEqual({ family: 'resin', value: 2.5, source: 'dégustation' });
    const floral0 = avant.find((a) => a.family === 'floral')!;
    expect(floral0.source).toBe('modèle');
    expect(floral0.value).toBeCloseTo(beer.find((b) => b.family === 'floral')!.basis!.central! / (100 / 3), 2);
    for (const a of avant.filter((x) => x.source === 'non situé')) expect(a.value).toBeNull();
    const r = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING });
    const golding = r.voies.find((v) => v.actions.some((a) => a.hopKey === 'beermaverick-golding'))!;
    const apres = afterContinuous(beer, golding.effect);
    expect(apres.find((a) => a.family === 'floral')!.value!).toBeGreaterThan(floral0.value! + 0.4);
    for (const a of apres) if (!golding.effect[a.family].established) expect(a.value).toBeNull();
    const cible = targetContinuous(s16d);
    expect(cible.find((c) => c.family === 'floral')).toMatchObject({ bas: 0, haut: 1.65 });
    expect(cible.find((c) => c.family === 'resin')).toMatchObject({ bas: 0, haut: 0.9 });
  });

  it('fiche houblon : sources et divergences, composants absents à null avec raison, recette, IBU par gramme, goût', () => {
    const ctx = { recipes: [{ scenario: 'S1', recipe: s1Recipe() }, { scenario: 'S5', recipe: loadedRecipe(s1Recipe(), s16d) }], ibuBase: s1Recipe(), gouts: NO_GOUTS };
    const f = hopSheet('beermaverick-nugget', ctx);
    expect(f.alpha.sources.map((s) => s.source)).toEqual(['Beer Maverick', 'Hopsteiner']);
    expect(f.alpha.divergence).toBe('recouvrantes');
    expect(f.alpha.retenu).toMatchObject({ value: 13, from: 'fiche de stock' });
    expect(f.huiles.composants.myrcene).toMatchObject({ min: 48, max: 59, unite: '% de l’huile' });
    expect(f.huiles.composants.farnesene).toBeNull();
    expect(f.huiles.composants.farneseneRaison).toMatch(/non importé/);
    expect(f.substituts).toBeNull();
    expect(f.dansRecette.map((d) => [d.scenario, d.grams])).toEqual([['S1', 46], ['S5', 42.5]]);
    expect(f.dansRecette[0].ibu).toBeCloseTo(59.7, 1);
    const b60 = f.ibuParGramme.moments.find((m) => m.code === 'b60')!;
    expect(b60.ibuPerGram!.value).toBeCloseTo(1.3, 1);
    expect(f.ibuParGramme.moments.find((m) => m.code === 'dryPost')).toMatchObject({ ibuPerGram: null });
    expect(f.gout).toEqual({ aime: false, exclu: false });
    expect(f.aromes.find((a) => a.family === 'resin')).toMatchObject({ level: 2, sources: 2, of: 4 });
    expect(f.stock).toMatchObject({ etat: 'épuisé', libre: { S1: -46, S5: -42.5 } });
    expect(hopSheet('beermaverick-saaz-late', ctx).stock.etat).toBe('hors stock');
  });
});

describe('La levure : double impact, leviers, signaux (R43, R44)', () => {
  const s16d = getStyleScale('16D');

  it('double impact : arôme propre par famille (spécifique ou enveloppe) séparé de l’expression du houblon ; souche non caractérisée « inconnu »', () => {
    const y = yeastDoubleImpact(s1Recipe());
    expect(y.status).toBe('caractérisée');
    expect(y.aromePropre.citrus).toMatchObject({ specifique: true });
    expect(y.aromePropre.floral).toMatchObject({ specifique: false });
    expect(y.expression).toMatchObject({ parFamille: false, facteur: { min: 0.65, max: 1.35 } });
    const lager = yeastDoubleImpact({ ...s1Recipe(), yeastId: 'lalbrew-diamond' });
    expect(lager.expression).toBe('inconnu');
    for (const f of FAMILIES) expect(lager.aromePropre[f]).toBe('inconnu');
  });

  it('leviers levure dans les voies de S1 : changer vers chaque souche caractérisée, et houblonner à froid en fermentation active', () => {
    const r = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING, leviersLevure: true });
    const levure = r.voies.filter((v) => v.type === 'levure');
    expect(levure.filter((v) => v.yeastChange).map((v) => v.yeastChange!.to).sort()).toEqual(CHARACTERIZED_YEASTS.filter((y) => y !== 'fermentis-us05').sort());
    for (const v of levure.filter((x) => x.yeastChange)) {
      expect(v.estimated).toBe(true);
      expect(applyVoie(s1Recipe(), v).yeastId).toBe(v.yeastChange!.to);
      expect(Object.values(v.effect).some((e) => e.established)).toBe(true);
    }
    const dry = levure.find((v) => v.actions[0]?.moment === 'dryActive')!;
    expect(dry.effect.floral.central!).toBeGreaterThan(0);
    expect(dry.estimatedWhy.join(' ')).toMatch(/biotransformation/);
    // Les rangs restent ceux du classement commun.
    for (let i = 1; i < r.voies.length; i++) expect(compareRankKeys(r.voies[i - 1], r.voies[i])).toBeLessThanOrEqual(0);
  });

  it('signaux d’un ajout à froid (S5, Citra cryo J+3) : sourcés, non quantifiés ; aucun signal hors ajout à froid', () => {
    const recipe = loadedRecipe(s1Recipe(), s16d);
    const cold = recipe.additions.find((a) => a.moment === 'dryActive')!;
    const s = yeastSignals(cold, recipe)!;
    expect(s.jour).toBe('J+3');
    expect(s.signaux.map((x) => x.id)).toEqual(['geraniol-citronellol', 'thiols', 'hop-creep']);
    for (const x of s.signaux) { expect(x.quantifie).toBe(false); expect(x.sources.length).toBeGreaterThan(0); }
    expect(s.signaux.find((x) => x.id === 'thiols')!.statut).toBe('possible');
    expect(s.signaux.find((x) => x.id === 'geraniol-citronellol')!.statut).toBe('non évaluable');
    expect(s.signaux.find((x) => x.id === 'hop-creep')!.statut).toBe('possible');
    expect(yeastSignals(recipe.additions[0], recipe)).toBeNull();
  });
});

describe('Crans du style (objets 1, 2 et 4)', () => {
  const s16d = getStyleScale('16D');
  const beer = beerLevels(recipeProfile(s1Recipe()).profile, S1_TASTING, s16d);
  const r = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING });

  it('la résine dégustée est au-dessus de la bande (4) ; le floral est à 0 cran ; les non situées restent null', () => {
    const pos = beerCrans(beer, s16d);
    expect(pos.map((p) => p.family)).toEqual(s16d.order);
    expect(pos.find((p) => p.family === 'resin')).toMatchObject({ crans: 4, source: 'dégustation', display: 'au-dessus' });
    expect(pos.find((p) => p.family === 'floral')).toMatchObject({ crans: 0, source: 'modèle' });
    for (const p of pos.filter((x) => x.source === 'non situé')) expect(p).toMatchObject({ crans: null, display: 'non situé' });
    for (const p of pos.filter((x) => x.crans !== null)) expect([-1, 0, 1, 2, 3, 4]).toContain(p.crans);
  });

  it('Golding fait passer le floral de 0 à 1 cran ; deltaCrans « ≈ » sous le seuil, « non établi » sans effet', () => {
    const golding = r.voies.find((v) => v.actions.some((a) => a.hopKey === 'beermaverick-golding'))!;
    const after = afterCrans(beer, golding.effect, s16d);
    expect(after.find((a) => a.family === 'floral')).toMatchObject({ crans: 1, deltaCrans: 1 });
    for (const v of r.voies) for (const a of afterCrans(beer, v.effect, s16d)) {
      const e = v.effect[a.family];
      if (!e.established) expect(a.deltaCrans).toBe('non établi');
      else if (Math.abs(e.central!) < s16d.families[a.family].threshold) expect(a.deltaCrans).toBe('≈');
      else expect(Number.isInteger(a.deltaCrans)).toBe(true);
    }
    const target = targetCrans(s16d, r.direction);
    expect(target.find((t) => t.family === 'floral')).toMatchObject({ bande: { min: 0, max: 3 }, visee: 1 });
    expect(target.find((t) => t.family === 'resin')).toMatchObject({ visee: 3 });
    expect(targetCrans(getStyleScale('21C')).find((t) => t.family === 'green')!.bande).toEqual({ min: 0, max: 1 });
  });
});

describe('Achats, catalogue à acheter et goûts du brasseur', () => {
  const s16d = getStyleScale('16D');

  it('le stock informe, il ne limite pas : catalogue « à acheter » classé par la même règle, liste d’achats en g', () => {
    const q = quickAdds(s1Recipe(), s16d, S1_TASTING);
    expect(q.catalogue.length).toBe(10);
    expect(q.catalogueTotal).toBeGreaterThan(250);
    // Listes longues : pas d'IBU par moment (taille du pack) ; l'IBU au moment proposé reste.
    for (const r of [...q.catalogue, ...q.epuises]) { expect(r.ibuParMoment).toBeUndefined(); expect(r).toHaveProperty('ibuAdded'); }
    for (const r of q.disponibles) expect(r.ibuParMoment).toHaveLength(IBU_MOMENTS.length);
    for (const r of q.catalogue) expect(r.stock).toMatchObject({ grams: 0, free: 0, status: 'à acheter' });
    for (let i = 1; i < q.catalogue.length; i++) {
      const a = quickAddKey(q.catalogue[i - 1]), b = quickAddKey(q.catalogue[i]); const d = a.findIndex((x, j) => x !== b[j]);
      if (d >= 0) expect(a[d]).toBeLessThan(b[d]);
    }
    const achats = shoppingList(s1Recipe());
    expect(achats.unite).toBe('g');
    expect(achats.lignes[0]).toMatchObject({ hopKey: 'beermaverick-nugget', besoin: 46, stockLibre: 0, manque: 46 });
    expect(achats.totalManque).toBe(46);
    const s5 = shoppingList(loadedRecipe(s1Recipe(), s16d));
    expect(s5.aAcheter.map((v) => v.hopKey)).toEqual(['beermaverick-nugget']);
    for (const v of proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING }).voies) for (const m of v.stock.missing) expect(typeof m.grams).toBe('number');
  });

  it('goûts : vides par défaut ; une variété exclue disparaît, l’ordre relatif des autres voies ne change pas ; une famille exclue met en conflit', () => {
    const base = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING });
    const withEmpty = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING, gouts: NO_GOUTS });
    expect(withEmpty.voies.map((v) => v.id)).toEqual(base.voies.map((v) => v.id));
    const ex = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING, gouts: { aime: [], exclut: [{ type: 'variété', id: 'beermaverick-motueka', source: 'test' }] } });
    expect(ex.voies.some((v) => v.actions.some((a) => a.hopKey === 'beermaverick-motueka'))).toBe(false);
    const kept = ex.voies.map((v) => v.id).filter((id) => base.voies.some((w) => w.id === id));
    expect(kept).toEqual(base.voies.map((v) => v.id).filter((id) => kept.includes(id)));
    const fam = proposeVoies(s1Recipe(), { floral: 1 }, { gouts: { aime: [], exclut: [{ type: 'famille', id: 'citrus', source: 'test' }] }, limit: 40 });
    for (const v of fam.voies.filter((x) => x.actions.some((a) => a.op === 'ajouter' && citations(hopRef(a.hopKey)!.varietyId).citrus.status === 'cité'))) expect(v.conflicts.join(' ')).toMatch(/exclu par tes goûts/);
    const qa = quickAdds(s1Recipe(), s16d, null, { gouts: { aime: [], exclut: [{ type: 'variété', id: 'beermaverick-cascade', source: 'test' }] } });
    expect([...qa.disponibles, ...qa.epuises, ...qa.catalogue].some((r) => r.key === 'beermaverick-cascade')).toBe(false);
  });
});

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
    expect(q.disponibles.find((r) => r.name === 'Target')!.dose).toMatchObject({ grams: 5, rule: 'stock libre' });
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
