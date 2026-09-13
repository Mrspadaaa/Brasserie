import { describe, expect, it } from 'vitest';
import type { YeastCatalogueFact } from '../../functions/src/yeastCatalogueSchema';
import type { YeastReference } from '../../src/domain/yeastReferences';
import { yeastStyleEvidence } from '../../src/domain/yeastStyleEvidence';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import { YEAST_RECIPE_PROFILES } from '../../src/data/yeastRecipeProfiles';

const source = { title: 'Observation du laboratoire', author: 'Laboratoire témoin', year: null, kind: 'manufacturer' as const, reference: 'https://example.org/yeast/observed' };
const fact = (key: YeastCatalogueFact['key'], reported: string, context?: string): YeastCatalogueFact => ({ key, label: key, reported, source, ...(context ? { context } : {}) });
function reference(facts: YeastCatalogueFact[], extra: Partial<YeastReference> = {}): YeastReference {
  const row = structuredClone(catalogue[0]) as YeastReference;
  return { ...row, id: 'personal-observed', name: 'Nom commercial libre', ...extra,
    catalogue: { ...row.catalogue!, categories: [], facts, ...extra.catalogue } };
}
const entry = (id: string) => catalogue.find(r => r.id === id)! as YeastReference;
const styles = (reported: string) => yeastStyleEvidence(reference([fact('styles', reported)])).styles;

describe('Familles de brassage établies par les usages, pas par le nom ou le goût', () => {
  it('n’interprète pas le nom commercial, le nom du laboratoire, les alias ou un goût seul', () => {
    const r = reference([fact('aroma', 'Banana, clove, fruity')], { name: 'German Hefeweizen Hazy Lager Saison', aliases: ['Wyeast 3068', 'American Wheat'] });
    r.catalogue!.manufacturer = 'Hefeweizen Laboratory';
    expect(yeastStyleEvidence(r).styles).toEqual([]);
    expect(yeastStyleEvidence(r).goalReasons.banana).toBeDefined();
    expect(yeastStyleEvidence(reference([fact('styles', 'Ale, Wheat Beer, Kveik')])).styles).toEqual([]);
  });
  it.each([
    ['American Wheat Beer', ['american-wheat']],
    ['Ideal for American-style Hefeweizen and Altbier.', ['american-wheat', 'kolsch-alt']],
    ['German Wheat Beer', ['weissbier']],
    ['Bières de blé allemandes', ['weissbier']],
    ['Bières de blé américaines', ['american-wheat']],
    ['Weizenbock, Hefeweizen, Dunkelweizen', ['weissbier']],
    ['Belgian Wheat Beer, Witbier', ['witbier']],
    ['Berliner Weisse', ['sour']],
    ['Belgian Pale Ale, Belgian IPA', ['belgian-ale']],
    ['English IPA', ['english-ale']],
    ['Hazy IPA, New England style IPA, NEIPA', ['hazy-ipa']],
    ['American IPA, Pale American Ale', ['clean-ale']],
    ['IPA', ['clean-ale']],
    ['Helles, Pilsner, Märzen, Bock, Schwarzbier', ['lager']],
    ['American Stout, Porter, Irish Dry Stout', ['stout-porter']],
    ['Kölsch, Altbier', ['kolsch-alt']],
    ['European Sour Ale, American Wild Ale, Lambic', ['sour']],
    ['Saison, Strong Belgian Ale', ['saison', 'belgian-ale']]
  ])('classe « %s » sans élargissement à une autre famille', (reported, expected) => {
    expect(styles(reported).sort()).toEqual([...expected].sort());
  });
  it('ne transforme ni une souche ale en lager ni une lager en ale', () => {
    expect(yeastStyleEvidence(reference([fact('application', 'Ale')])).styles).toEqual([]);
    expect(yeastStyleEvidence(reference([fact('application', 'Lager')])).styles).toEqual(['lager']);
    expect(styles('American Lager, English Ale').sort()).toEqual(['english-ale', 'lager']);
    expect(styles('Kveik')).toEqual([]);
  });
  it('reconnaît une phrase d’usage classée aroma mais ignore une comparaison entre produits', () => {
    const f = fact('aroma', 'This classic strain is used for the production of Kölsch beers, with light fruity esters.');
    const e = yeastStyleEvidence(reference([f]));
    expect(e.styles).toEqual(['kolsch-alt']);
    expect(e.styleMatches[0]).toMatchObject({ origin: 'catalogue-described-use', reported: f.reported, source });
    expect(yeastStyleEvidence(reference([fact('aroma', 'Produces banana and clove esters typical of weissbier.')])).styles).toEqual([]);
    expect(yeastStyleEvidence(reference([fact('aroma', 'Similar to a German wheat yeast used for Hefeweizen.')])).styles).toEqual([]);
  });
});

describe('Négations, conditions et catalogues personnels contradictoires', () => {
  it('applique une exclusion à sa liste, puis conserve le choix affirmatif après mais', () => {
    const e = yeastStyleEvidence(reference([fact('styles', 'Not suitable for lagers, pilsners or bock, but ideal for American IPA.')]));
    expect(e.styles).toEqual(['clean-ale']);
    expect(e.exclusions.map(m => m.styleId)).toContain('lager');
    expect(e.exclusions[0].reported).toContain('Not suitable');
    expect(e.exclusions[0].source).toEqual(source);
    expect(styles('Not only lager, but also American IPA').sort()).toEqual(['clean-ale', 'lager']);
  });
  it('gère exclusion postposée, sauf et exclusion française', () => {
    expect(styles('Lagers are not recommended. English ales.')).toEqual(['english-ale']);
    expect(styles('American IPA except Hazy IPA')).toEqual(['clean-ale']);
    expect(styles('Ne convient pas aux lagers, mais adaptée pour les Witbier.')).toEqual(['witbier']);
  });
  it('conserve le contexte exact et ne généralise pas son exclusion aux autres familles', () => {
    const f = fact('styles', 'American IPA, Lager', 'Not recommended for lager. For the ale, oxygenation must follow the lot instructions.');
    const e = yeastStyleEvidence(reference([f]));
    expect(e.styles).toEqual(['clean-ale']);
    expect(e.styleMatches[0].context).toBe(f.context);
    expect(e.exclusions[0].context).toBe(f.context);
    expect(yeastStyleEvidence(reference([fact('styles', 'American IPA, Lager', 'Lagers are not recommended.')])).styles).toEqual(['clean-ale']);
    const conditional = fact('styles', 'Saison', 'Only with an appropriate companion strain; secondary fermentation.');
    expect(yeastStyleEvidence(reference([conditional])).styleMatches[0]).toMatchObject({ styleId: 'saison', context: conditional.context });
  });
  it('retire un style en conflit sans faire disparaître la négation', () => {
    const positive = fact('styles', 'Hazy IPA');
    const negative = { ...fact('application', 'Not suitable for Hazy IPA.'), source: { ...source, reference: 'https://example.org/yeast/other-lot' } };
    const e = yeastStyleEvidence(reference([positive, negative]));
    expect(e.styles).toEqual([]);
    expect(e.exclusions).toContainEqual(expect.objectContaining({ styleId: 'hazy-ipa', source: negative.source, reported: negative.reported }));
    expect(e.styleMatches).toContainEqual(expect.objectContaining({ styleId: 'hazy-ipa', source: positive.source, reported: positive.reported }));
    expect(e.warnings.join(' ')).toContain('conflit');
  });
  it('complète une ancienne fiche connue mais donne priorité aux usages personnels explicites', () => {
    expect(yeastStyleEvidence(reference([], { id: 'wyeast-3068' })).styles).toEqual(['weissbier']);
    const personal = yeastStyleEvidence(reference([fact('styles', 'American Wheat Beer')], { id: 'wyeast-3068' }));
    expect(personal.styles).toEqual(['american-wheat']);
    expect(personal.styleMatches.every(m => m.origin !== 'curated-profile')).toBe(true);
    expect(yeastStyleEvidence(reference([fact('styles', 'Autre usage non classé')], { id: 'wyeast-3068' })).styles).toEqual([]);
    expect(yeastStyleEvidence(reference([fact('application', 'Not recommended for wheat beer.')], { id: 'wyeast-3068' })).styles).toEqual([]);
  });
  it('ne prend pas non-phénolique pour une exclusion de style belge', () => {
    expect(styles('Malty Belgian styles — non phenolic.')).toEqual(['belgian-ale']);
    expect(yeastStyleEvidence(reference([fact('application', 'A non-phenolic strain suitable for Belgian Blond Ale.')])).styles).toEqual(['belgian-ale']);
  });
});

describe('Motifs sensoriels sourcés et cultures distinctes', () => {
  it('retient seulement un motif explicite avec ses conditions, sans prédire un gain de goût', () => {
    const f = fact('aroma', 'Banana and baking spice.', 'Expression described at the warm end of the manufacturer range.');
    const e = yeastStyleEvidence(reference([f]));
    expect(e.goalReasons.banana?.text).toContain(f.context);
    expect(e.goalReasons.banana?.text).toContain('Aucun gain d’intensité');
    expect(e.goalReasons.banana?.source).toEqual(source);
    expect(e.goalMatches.every(m => !('score' in m) && !('intensity' in m))).toBe(true);
    expect(e.styles).toEqual([]);
  });
  it('ne propose pas banana ni clove depuis des mentions négatives ou faibles', () => {
    for (const sentence of ['No banana, clove or phenolic notes.', 'Banana-free, non-phenolic.', 'Low banana and subtle clove.']) {
      const e = yeastStyleEvidence(reference([fact('aroma', sentence)]));
      expect(e.goalReasons.banana).toBeUndefined();
      expect(e.goalReasons.clove).toBeUndefined();
      expect(e.goalMatches.every(m => m.polarity !== 'positive')).toBe(true);
    }
    const e = yeastStyleEvidence(reference([fact('aroma', 'Banana dominant.'), fact('aroma', 'No banana.')], { id: 'white-labs-wlp300' }));
    expect(e.goalReasons.banana).toBeUndefined();
    expect(e.goalMatches.filter(m => m.goal === 'banana').map(m => m.polarity)).toEqual(['positive', 'negative']);
  });
  it('ne transforme ni POF, β-lyase ni sécheresse du produit en bénéfice sensoriel', () => {
    const e = yeastStyleEvidence(reference([fact('pof', 'positive'), fact('betaLyase', 'High'), fact('application', 'Dry pitching recommended.')], { betaLyase: { min: 0.9, max: 1.1 } }));
    expect(e.goalReasons).toEqual({});
    expect(yeastStyleEvidence(reference([fact('aroma', 'Clover honey and pear.')])).goalReasons.clove).toBeUndefined();
    expect(yeastStyleEvidence(reference([fact('aroma', 'Unwanted green apple from acetaldehyde.')])).goalReasons.fruit).toBeUndefined();
  });
  it('garde le texte brut traçable et nettoie seulement le descriptif affiché', () => {
    const raw = '<!-- td { color:red; } --><b>Banana</b>, citrus &amp; spice.';
    const e = yeastStyleEvidence(reference([fact('aroma', raw)]));
    expect(e.descriptor).toBe('Banana, citrus & spice.');
    expect(e.goalReasons.banana?.text).not.toContain('<');
    expect(e.goalMatches.find(m => m.goal === 'banana')?.reported).toBe(raw);
  });
  it('retire bactéries pures et usages vin, sans confondre barley wine et vin', () => {
    const bacteria = yeastStyleEvidence(reference([fact('species', 'Lactobacillus plantarum'), fact('styles', 'Berliner Weisse, Gose')]));
    expect(bacteria.culture).toBe('bacteria'); expect(bacteria.styles).toEqual([]);
    expect(bacteria.warnings.join(' ')).toContain('ne remplace pas');
    const mixed = yeastStyleEvidence(reference([fact('species', 'Saccharomyces cerevisiae and Lactobacillus blend'), fact('styles', 'American Wild Ale')]));
    expect(mixed.culture).toBe('mixed'); expect(mixed.styles).toEqual(['sour']);
    expect(yeastStyleEvidence(reference([fact('species', 'Blend of two Saccharomyces yeast strains'), fact('styles', 'Hazy IPA')])).culture).toBe('mixed');
    expect(yeastStyleEvidence(reference([fact('species', 'Saccharomyces cerevisiae, without bacteria. Not a blend of yeast strains.')])).culture).toBe('yeast');
    expect(yeastStyleEvidence(reference([fact('species', 'Lactobacillus plantarum, without Saccharomyces or other yeast.')])).culture).toBe('bacteria');
    const wine = yeastStyleEvidence(reference([fact('species', 'Saccharomyces cerevisiae'), fact('styles', 'White wine, red wine')]));
    expect(wine.culture).toBe('other-fermentation'); expect(wine.styles).toEqual([]);
    expect(yeastStyleEvidence(reference([fact('styles', 'White wine'), fact('aroma', 'Tropical fruity esters.')])).goalReasons).toEqual({});
    expect(yeastStyleEvidence(reference([fact('application', 'White wine. Not suitable for beer.')])).culture).toBe('other-fermentation');
    const wineBlend = yeastStyleEvidence(reference([fact('species', 'Blend of yeast strains'), fact('styles', 'White wines'), fact('aroma', 'Fruity esters.')]));
    expect(wineBlend.culture).toBe('other-fermentation'); expect(wineBlend.goalReasons).toEqual({});
    const ale = yeastStyleEvidence(reference([fact('styles', 'American Stout, American Barley Wine')]));
    expect(ale.styles).toContain('stout-porter'); expect(ale.culture).not.toBe('other-fermentation');
  });
  it('reste pur avec références gelées et provenance détachée', () => {
    const r = reference([fact('styles', 'Witbier'), fact('aroma', 'Spicy, fruity.')]);
    const frozen = (v: unknown) => { if (v && typeof v === 'object') { Object.values(v).forEach(frozen); Object.freeze(v); } };
    frozen(r); const before = JSON.stringify(r); const e = yeastStyleEvidence(r);
    e.styleMatches[0].source.title = 'Autre titre';
    e.goalReasons.clove!.source.title = 'Autre titre';
    expect(JSON.stringify(r)).toBe(before);
    expect(yeastStyleEvidence(r).styleMatches[0].source.title).toBe(source.title);
  });
});

describe('Catalogue complet et cas hors ancienne sélection', () => {
  it('trouve Überweizen, Imperial Kurt et BSI W177 avec leurs véritables usages', () => {
    const uber = yeastStyleEvidence(entry('yeast-escarpment-4559494873220'));
    expect(uber.styles).toEqual(['weissbier']); expect(uber.goalReasons.banana).toBeDefined();
    expect(uber.styleMatches.some(m => m.source.reference === 'https://escarpmentlabs.com/products/uberweizen')).toBe(true);
    expect(yeastStyleEvidence(entry('yeast-imperial-0164fe55-05a5-4407-aa5b-045dfd6104c5')).styles.sort()).toEqual(['american-wheat', 'kolsch-alt']);
    expect(yeastStyleEvidence(entry('yeast-bsi-26009')).styles).toEqual(['kolsch-alt']);
    expect(yeastStyleEvidence(entry('white-labs-wlp380')).goalReasons.clove).toBeDefined();
    for (const id of ['yeast-omega-9188921278718', 'yeast-omega-9188921344254']) {
      const evidence = yeastStyleEvidence(entry(id));
      expect(evidence.styles).toEqual(['weissbier']);
      expect(evidence.styleMatches[0].origin).toBe('catalogue-described-use');
    }
  });
  it('n’attribue pas arbitrairement le tag agrégé NovaLager à un des trois fournisseurs', () => {
    const incomplete = structuredClone(entry('lalbrew-novalager'));
    incomplete.catalogue!.facts = incomplete.catalogue!.facts.filter(f => f.key !== 'styles');
    const e = yeastStyleEvidence(incomplete);
    expect(e.styles).toEqual([]);
    expect(e.warnings.join(' ')).toContain('provenance par catégorie');
    expect(e.culture).toBe('yeast');
    const documented = structuredClone(incomplete);
    const tds = { title: 'LalBrew NovaLager — Technical Data Sheet', author: 'Lallemand Brewing', year: null, kind: 'manufacturer' as const,
      reference: 'https://files.scottlab.com/uploads/NOVALAGER%20TDS.pdf', locator: 'Page 1 — Quick Facts / Beer Styles' };
    documented.catalogue!.facts.push({ key: 'styles', label: 'Beer Styles', reported: 'Lagers', source: tds });
    expect(yeastStyleEvidence(documented).styles).toEqual(['lager']);
    expect(yeastStyleEvidence(documented).styleMatches[0].source).toEqual(tds);
    expect(incomplete.catalogue!.facts.some(f => f.key === 'styles')).toBe(false);
  });
  it('conserve le descriptif girofle de Hefeweizen II et signale son désaccord POF sans changer les faits', () => {
    const r = entry('yeast-omega-9188921278718'), before = JSON.stringify(r);
    const e = yeastStyleEvidence(r);
    expect(e.styles).toEqual(['weissbier']);
    expect(e.goalReasons.clove).toBeDefined();
    expect(e.warnings.join(' ')).toContain('statut POF négatif');
    expect(e.warnings.join(' ')).toContain('ne justifie pas un repos férulique');
    expect(JSON.stringify(r)).toBe(before);
  });
  it('élargit Foggy London et Imperial Julius sans assimiler chaque IPA à une NEIPA', () => {
    expect(yeastStyleEvidence(entry('yeast-escarpment-4559493300356')).styles.sort()).toEqual(['clean-ale', 'english-ale', 'hazy-ipa']);
    expect(yeastStyleEvidence(entry('yeast-imperial-01fec54f-7ce5-4b51-b5d3-f1627d4313a6')).styles.sort()).toEqual(['clean-ale', 'english-ale']);
    expect(yeastStyleEvidence(entry('yeast-bsi-2958')).culture).toBe('bacteria');
    expect(yeastStyleEvidence(entry('yeast-lallemand-wine-anchor-alchemy-i')).goalReasons).toEqual({});
    expect(yeastStyleEvidence(entry('yeast-lallemand-distilling-distilamax-rm')).goalReasons).toEqual({});
  });
  it('mesure la couverture sans faire des 1733 fiches autant de souches uniques', () => {
    const laboratories: Record<string, { references: number; classified: number; goalReasons: number }> = {};
    const families: Record<string, { references: number; laboratories: Set<string> }> = {};
    const curated = new Set(YEAST_RECIPE_PROFILES.map(p => p.yeastId));
    let classified = 0, outsideCurated = 0, withGoals = 0;
    for (const r of catalogue as YeastReference[]) {
      const e = yeastStyleEvidence(r), lab = r.catalogue!.manufacturer;
      laboratories[lab] ??= { references: 0, classified: 0, goalReasons: 0 };
      laboratories[lab].references++;
      if (e.styles.length) { classified++; laboratories[lab].classified++; if (!curated.has(r.id)) outsideCurated++; }
      if (Object.keys(e.goalReasons).length) { withGoals++; laboratories[lab].goalReasons++; }
      for (const s of e.styles) { families[s] ??= { references: 0, laboratories: new Set() }; families[s].references++; families[s].laboratories.add(lab); }
      expect(e.styles.every(s => e.styleMatches.some(m => m.styleId === s && m.source.reference))).toBe(true);
      expect(e.styles.some(s => e.exclusions.some(m => m.styleId === s))).toBe(false);
    }
    expect(classified).toBeGreaterThan(250);
    expect(outsideCurated).toBeGreaterThan(220);
    expect(families['weissbier'].laboratories.size).toBeGreaterThanOrEqual(4);
    expect(families['hazy-ipa'].laboratories.size).toBeGreaterThanOrEqual(3);
    console.info('YEAST_STYLE_COVERAGE', JSON.stringify({ total: catalogue.length, classified, outsideCurated, withGoals, laboratories,
      families: Object.fromEntries(Object.entries(families).map(([id, f]) => [id, { references: f.references, laboratories: [...f.laboratories].sort() }])) }));
  });
});
