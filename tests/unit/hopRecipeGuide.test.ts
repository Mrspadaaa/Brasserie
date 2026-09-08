import { describe, expect, it } from 'vitest';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { hopSourceError } from '../../functions/src/hopIndexSchema';
import {
  findRecipeHopMatches, findRecipeYeastMatches, normalizeRecipeIngredientName, rankDocumentaryHopLeads,
} from '../../src/domain/hopIndex/recipeGuide';
import type { HopGuideFamily } from '../../src/domain/hopIndex/recipeGuide';
import guideBootstrap from '../../src/data/hopRecipeGuideBootstrap.json';
import axesBootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import manufacturerBootstrap from '../../src/data/hopManufacturerBootstrap.json';
import databaseBootstrap from '../../src/data/hopDatabaseBootstrap.json';
import maverickBootstrap from '../../src/data/hopBeerMaverickBootstrap.json';
import yeastBootstrap from '../../src/data/hopYeastBootstrap.json';

const source: HopSource = { title: 'Fiche témoin', author: 'Fabricant témoin', year: 2026, kind: 'manufacturer', reference: 'https://example.test/catalogue' };
const mappingSource: HopSource = { ...source, title: 'Lexique témoin', kind: 'judgment', reference: 'Décision éditoriale de test' };
const variety = (id: string, name: string, text = 'Citrus, floral.'): HopVariety => ({
  id, name, aliases: [], form: 'unknown', analysis: [], descriptions: [{ text, context: 'rawHop', source }],
});
const families: HopGuideFamily[] = [
  { id: 'citrus', name: 'Agrumes', terms: ['citrus', 'agrumes', 'grapefruit'], source: mappingSource },
  { id: 'floral', name: 'Floral', terms: ['floral'], source: mappingSource },
  { id: 'resin', name: 'Boisé et résineux', terms: ['pine', 'résineux'], source: mappingSource },
  { id: 'tropical', name: 'Fruits tropicaux', terms: ['pineapple', 'tropical fruit'], source: mappingSource },
];
const publicVarieties = [
  ...manufacturerBootstrap.hopVarieties, ...databaseBootstrap.hopVarieties, ...maverickBootstrap.hopVarieties,
] as HopVariety[];

describe('Rapprochement explicite des ingrédients du guide', () => {
  it.each([
    ['Houblon Idaho 7 12.7%', 'idaho 7'],
    ['Houblon : Idaho 7 (AA : 12,7 %)', 'idaho 7'],
    ['Houblons Cascade 5.5% AA', 'cascade'],
    ['Houblon Cascade (5,5 % alpha)', 'cascade'],
    ['50 g Houblon Idaho 7 12,7 % 100 g', 'idaho 7'],
    ['Houblon Cascade - 100 g - 5,5 %', 'cascade'],
    ['Cascade® (12.7%)', 'cascade'],
    ['Cascade™ [AA 5,5%]', 'cascade'],
    ['HBC 630', 'hbc 630'],
    ['Idaho 7', 'idaho 7'],
    ['Cascade (NZ)', 'cascade (nz)'],
    ['Cascade Cryo', 'cascade cryo'],
  ])('normalise seulement les annotations explicites : %s', (name, expected) => {
    expect(normalizeRecipeIngredientName(name)).toBe(expected);
  });

  it('garde chaque fiche Idaho 7 et chaque source Cascade sans extraire les AA', () => {
    const before = structuredClone(publicVarieties);
    const matches = findRecipeHopMatches('Houblon Idaho 7 12.7%', publicVarieties);
    expect(matches.map(match => match.item.id)).toEqual(['hopdb-f729bfeedb9906301d', 'beermaverick-idaho-7']);
    expect(matches.every(match => match.via === 'name' && match.matchedName === 'Idaho 7')).toBe(true);
    expect(matches.every(match => Object.keys(match).sort().join(',') === 'item,matchedName,normalizedName,via')).toBe(true);
    expect(publicVarieties).toEqual(before);
    const cascade = findRecipeHopMatches('Houblon Cascade 5,5%', publicVarieties);
    expect(cascade.map(match => match.item.id)).toEqual(['hopsteiner-cas', 'hopdb-dfddf7bb51dfebebe8', 'beermaverick-cascade']);
  });

  it('conserve une ambiguïté nom/alias au lieu de choisir la première fiche', () => {
    const first = variety('cascade-fabricant', 'Cascade');
    const second = { ...variety('cascade-etude', 'Cascade · cônes'), aliases: ['Cascade'] };
    const matches = findRecipeHopMatches('Houblon Cascade', [first, second]);
    expect(matches.map(match => [match.item.id, match.via])).toEqual([
      ['cascade-fabricant', 'name'], ['cascade-etude', 'alias'],
    ]);
    expect(findRecipeHopMatches('ID7', publicVarieties).map(match => match.item.id)).toEqual(['beermaverick-idaho-7']);
  });

  it.each(['Casca', 'Cascade / Citra 12%', 'Cascade NZ', 'Idaho7', 'Idaho 7 T90', 'HBC 63', '12.7%', 'Houblon 100 g', ''])('ne devine pas de variété pour %s', name => {
    expect(findRecipeHopMatches(name, [variety('cas', 'Cascade'), variety('i7', 'Idaho 7'), variety('hbc', 'HBC 630')])).toEqual([]);
  });

  it('ignore les fiches archivées et ne transforme pas un alias vide en correspondance', () => {
    expect(findRecipeHopMatches('Cascade', [{ ...variety('old', 'Cascade'), archived: true }])).toEqual([]);
    expect(findRecipeHopMatches('', [{ ...variety('cas', 'Cascade'), aliases: [''] }])).toEqual([]);
  });

  it('rapproche une levure sur son nom exact sans supposer de synonymes commerciaux', () => {
    expect(findRecipeYeastMatches('Levure LalBrew Verdant IPA 11,5 g', yeastBootstrap).map(match => match.item.id)).toEqual(['lalbrew-verdant-ipa']);
    expect(findRecipeYeastMatches('Verdant IPA', yeastBootstrap)).toEqual([]);
    const yeasts = [{ id: 'us05', name: 'SafAle US-05', aliases: ['US-05'] }, { id: 'bry97', name: 'BRY-97' }];
    expect(findRecipeYeastMatches('Levure US-05 11.5 g', yeasts)).toMatchObject([{ item: { id: 'us05' }, via: 'alias' }]);
    expect(findRecipeYeastMatches('US05', yeasts)).toEqual([]);
    expect(findRecipeYeastMatches('US 05', yeasts)).toEqual([]);
    expect(findRecipeYeastMatches('BRY-97 12%', yeasts)).toEqual([]);
  });
});

describe('Classement documentaire, sans prédiction sensorielle', () => {
  it('classe par familles mentionnées, puis nom, en exposant le texte et les deux provenances', () => {
    const both = variety('both', 'Zulu', 'Agrumes et floral.');
    const one = variety('one', 'Alpha', 'citrus citrus grapefruit');
    const none = variety('none', 'Aucun', 'Descripteur absent');
    const before = structuredClone([one, both, none]);
    const result = rankDocumentaryHopLeads([one, both, none], ['citrus', 'floral'], families);
    expect(result.map(lead => lead.variety.id)).toEqual(['both', 'one']);
    expect(result[0].matchedFamilyIds).toEqual(['citrus', 'floral']);
    expect(result[0].evidence[0]).toEqual({ familyId: 'citrus', term: 'agrumes', description: both.descriptions[0], source, mappingSource });
    expect(Object.keys(result[0]).sort()).toEqual(['evidence', 'matchedFamilyIds', 'variety']);
    expect([one, both, none]).toEqual(before);
  });

  it('une description répétée ne favorise pas une source ni ne fusionne les fiches homonymes', () => {
    const a = variety('a', 'Cascade', 'citrus');
    const b = variety('b', 'Cascade', 'citrus');
    b.descriptions = [b.descriptions[0], { ...b.descriptions[0], source: { ...source, author: 'Autre source', reference: 'https://example.test/other' } }];
    const result = rankDocumentaryHopLeads([b, a], ['citrus', 'citrus'], families);
    expect(result.map(lead => lead.variety.id)).toEqual(['a', 'b']);
    expect(result[1].evidence.map(item => item.source.author)).toEqual(['Fabricant témoin', 'Autre source']);
    expect(result.map(lead => lead.matchedFamilyIds)).toEqual([['citrus'], ['citrus']]);
  });

  it('respecte les mots entiers, les expressions et les tags anglais sans sous-chaînes trompeuses', () => {
    const hop = variety('fruit', 'Fruit', '#pineapple, #tropical_fruit, résineux.');
    const result = rankDocumentaryHopLeads([hop], ['resin', 'tropical'], families);
    expect(result[0].evidence.map(item => item.term)).toEqual(['résineux', 'pineapple', 'tropical fruit']);
    expect(result[0].evidence.some(item => item.term === 'pine')).toBe(false);
    expect(rankDocumentaryHopLeads([variety('word', 'Word', 'antifloral')], ['floral'], families)).toEqual([]);
  });

  it('ne classe pas un élément sans description sourcée ou une famille sans provenance', () => {
    const unsourced = variety('missing', 'Sans provenance', 'citrus');
    unsourced.descriptions[0].source = undefined as any;
    expect(rankDocumentaryHopLeads([unsourced], ['citrus'], families)).toEqual([]);
    expect(rankDocumentaryHopLeads([variety('hop', 'Témoin')], ['citrus'], [{ ...families[0], source: {} as HopSource }])).toEqual([]);
    expect(rankDocumentaryHopLeads([variety('hop', 'Témoin')], [], families)).toEqual([]);
    expect(rankDocumentaryHopLeads([variety('hop', 'Témoin')], ['unknown'], families)).toEqual([]);
    expect(rankDocumentaryHopLeads([{ ...variety('hop', 'Témoin'), archived: true }], ['citrus'], families)).toEqual([]);
  });

  it('conserve le contexte original : houblon brut, infusion ou bière restent des descriptions', () => {
    for (const context of ['rawHop', 'infusion', 'beer', 'unspecified'] as const) {
      const hop = variety('hop', 'Témoin'); hop.descriptions[0].context = context;
      const lead = rankDocumentaryHopLeads([hop], ['citrus'], families)[0];
      expect(lead.evidence[0].description.context).toBe(context);
      expect(lead).not.toHaveProperty('score'); expect(lead).not.toHaveProperty('confidence');
    }
  });

  it('le lexique public couvre exactement les axes existants et identifie son jugement éditorial', () => {
    const guide = guideBootstrap as HopGuideFamily[];
    expect(guide.map(family => family.id).sort()).toEqual(axesBootstrap.filter(axis => axis.kind === 'axis').map(axis => axis.id).sort());
    expect(new Set(guide.map(family => family.id)).size).toBe(guide.length);
    for (const family of guide) {
      expect(hopSourceError(family.source, true)).toBeNull();
      expect(family.source.kind).toBe('judgment'); expect(family.terms.length).toBeGreaterThan(0);
      expect(family).not.toHaveProperty('weight');
    }
    expect(rankDocumentaryHopLeads([variety('vague', 'Vague', 'Fruité, fruity.')], ['tropical', 'berries', 'stoneFruit'], guide)).toEqual([]);
    const idaho = publicVarieties.filter(hop => hop.name === 'Idaho 7');
    const result = rankDocumentaryHopLeads(idaho, ['citrus', 'tropical'], guide);
    expect(result).toHaveLength(2);
    expect(result.every(lead => lead.matchedFamilyIds.join(',') === 'citrus,tropical')).toBe(true);
    expect(result.flatMap(lead => lead.evidence).every(item => item.source.reference && item.mappingSource.kind === 'judgment')).toBe(true);
  });
});
