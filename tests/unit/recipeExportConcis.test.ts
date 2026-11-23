import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Recipe } from '../../src/types';
import { recipeToText, type RecipeTextInput } from '../../src/domain/recipeText';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { normalizeRecipeImport, parseLocalRecipe } from '../../src/domain/recipeImport';
import { readYeastRecipeDesign, yeastRecipeDesignChanged, applyYeastRecipeDesign, createYeastRecipeDraft } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { fullRecipe } from '../fixtures/fullRecipe';

/**
 * D184 (26.10) : le brasseur a collé l'export de « neipa v3 » : « Ah oui il y a beaucoup trop d'info extrait?? Wtf ».
 * Le texte lisible se lit à l'œil nu : ni JSON, ni URL, ni fait de levure répété. Ce dont l'import a besoin
 * vit dans UN bloc final, séparé par un marqueur.
 */
const MARQUEUR = '— Données de réimport (ne pas modifier) —';
/**
 * Plafond du texte lisible. Mesuré sur la fixture : 51 lignes (titre 4, cibles, 4 malts, 5 houblons et 3 moments, levure,
 * ajouts, 2 paliers, 2 étapes de fermentation, notes, avec 3 lignes par titre de section). N = 70 laisse 35 % de marge à une recette
 * plus fournie (deux malts, un houblon, une ligne d'eau de plus), mais refuse le retour des blocs : le format complet v1 de la même
 * fixture fait 148 lignes, et plus de 400 avec les trois fournisseurs de levure du brasseur.
 */
const N = 70;

const DATE = new Date('2026-10-26T10:00:00Z');
const SOURCES = [
  { source: 'Lallemand', sourceUrl: 'https://www.lallemandbrewing.com/fr/verdant-ipa', retrievedAt: '2026-09-12', att: [74, 80], t: [18, 22] },
  { source: 'Brau Rauch', sourceUrl: 'https://brau-rauch.example/verdant-ipa', retrievedAt: '2026-09-27', att: [75, 82], t: [18, 23] },
  { source: 'Malt Miller', sourceUrl: 'https://maltmiller.example/verdant', retrievedAt: '2026-10-01', att: [76, 80], t: [17, 22] }
];

function neipaV3(): Recipe {
  const base: Recipe = {
    ...structuredClone(fullRecipe), name: 'neipa v3', style: 'NEIPA', styleRef: undefined, nolo: undefined,
    yeastDesign: undefined, yeastGuide: undefined, volumeL: 20, boilMin: 60, ogTarget: 1.064, fgTarget: 1.014, abvTarget: 6.6, ibuTarget: 38,
    brewhouse: { id: 'cuve-30', name: 'Cuve 30 L', volumeL: 20, efficiencyPct: 72 } as Recipe['brewhouse'],
    fermentables: [
      { name: 'Pilsner', weightKg: 3.6, kind: 'grain', use: 'empatage', colorEbc: 3.5 },
      { name: 'Flocons d’avoine', weightKg: 1, kind: 'grain', use: 'empatage', colorEbc: 2 },
      { name: 'Froment', weightKg: 0.8, kind: 'grain', use: 'empatage', colorEbc: 4 },
      { name: 'Lactose', weightKg: 0.3, kind: 'lactose', use: 'ebullition', fermentabilityPct: 0 }
    ],
    totalGristKg: 5.4,
    yeast: {
      name: 'Wyeast 3068', lab: 'Wyeast', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 125, unit: 'mL',
      technicalFacts: SOURCES.flatMap(s => [
        { key: 'attenuation', reported: `Atténuation apparente ${s.att[0]}–${s.att[1]} %`, range: { min: s.att[0], max: s.att[1] }, unit: '%', qualifier: 'range', origin: 'manufacturer', source: s.source, sourceUrl: s.sourceUrl, retrievedAt: s.retrievedAt },
        { key: 'temperature', reported: `Fermentation ${s.t[0]}–${s.t[1]} °C`, range: { min: s.t[0], max: s.t[1] }, unit: '°C', qualifier: 'range', origin: 'manufacturer', source: s.source, sourceUrl: s.sourceUrl, retrievedAt: s.retrievedAt },
        { key: 'flocculation', reported: 'Floculation faible', origin: 'manufacturer', source: s.source, sourceUrl: s.sourceUrl, retrievedAt: s.retrievedAt }
      ]) as any
    },
    fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 19, days: 8 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 7 }],
    mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }, { name: 'Mash-out', tempC: 76, durationMin: 10 }] },
    waterPlan: undefined,
    hops: [{ name: 'Magnum', stage: 'boil', weightG: 10, alpha: 12, timeMin: 60 }]
  };
  const refs = yeastReferences([]);
  // Le scénario de levure est adopté avec l'ancien plan de houblons (un seul houblon) ; la liste réelle change ensuite.
  const adopted = applyYeastRecipeDesign(base, { ...createYeastRecipeDraft(base, refs), goal: 'clove', goalExplicit: true, ferulicRest: false, pressureBar: 0 }, refs);
  return { ...adopted, hops: [
    { name: 'Magnum', stage: 'boil', weightG: 10, alpha: 12, timeMin: 60 },
    { name: 'Lotus', stage: 'boil', weightG: 25, alpha: 14, timeMin: 40 },
    { name: 'Citra', stage: 'whirlpool', weightG: 60, alpha: 12.5, timeMin: 20, tempC: 80 },
    { name: 'Mosaic', stage: 'dryHop', weightG: 80, alpha: 11, dayOffset: 3, timeMin: 2880 },
    { name: 'Citra', stage: 'dryHop', weightG: 60, alpha: 12.5, dayOffset: 6 }
  ] };
}

const entree = (recipe: Recipe): RecipeTextInput => ({
  recipe, name: recipe.name, style: recipe.style ?? '', volumeL: recipe.volumeL, boilMin: recipe.boilMin,
  og: 1.064, fg: 1.014, abv: 6.6, ibu: 38, ebc: 8, efficiencyPct: 72,
  fermentables: recipe.fermentables, totalGristKg: recipe.totalGristKg, hops: recipe.hops, yeast: recipe.yeast,
  mashSteps: recipe.mash?.steps ?? [], fermentation: recipe.fermentation ?? []
});

const lisible = (text: string) => text.split(MARQUEUR)[0];
const compte = (text: string, re: RegExp) => (text.match(re) ?? []).length;

describe('Export texte concis (D184)', () => {
  it('le texte lisible n’a ni JSON, ni URL, ni fait de levure répété, et tient en moins de N lignes', () => {
    const recipe = neipaV3();
    const text = recipeToText(entree(recipe), DATE);
    const lu = lisible(text);
    if (process.env.X2_DUMP) {
      mkdirSync(process.env.X2_DUMP, { recursive: true });
      writeFileSync(join(process.env.X2_DUMP, process.env.X2_NOM ?? 'export.txt'), text);
    }
    expect(lu).not.toContain('{');
    expect(lu).not.toContain('}');
    expect(lu).not.toContain('[');
    expect(lu).not.toMatch(/https?:/i);
    expect(lu).not.toContain('retrievedAt');
    expect(compte(lu, /Atténuation/gi)).toBe(1);
    expect(compte(lu, /Floculation/gi)).toBe(1);
    expect(compte(lu, /Fermentation \d/g)).toBeLessThanOrEqual(1);
    expect(compte(lu, /Lallemand|Brau Rauch|Malt Miller/g)).toBe(0);
    expect(lu).toContain('74–82 %');
    expect(lu).toContain('17–23 °C');
    expect(lu.split('\n').length).toBeLessThan(N);
    expect(lu).not.toContain('undefined');
    expect(lu).not.toContain('NaN');
  });

  it('garde ce qu’un brasseur lit : cibles, malts, houblons avec moment, durée, masse, α, levure, paliers, matériel', () => {
    const lu = lisible(recipeToText(entree(neipaV3()), DATE));
    expect(lu).toContain('neipa v3 — NEIPA');
    expect(lu).toContain('20 L');
    expect(lu).toMatch(/OG 1\.064.*FG 1\.014.*ABV 6\.6.*IBU 38/);
    expect(lu).toContain('Flocons d’avoine');
    expect(lu).toMatch(/25 g\s+Lotus\s+\(40 min · 14 % AA/);
    expect(lu).toMatch(/80 g\s+Mosaic\s+\(J\+3 · 48 h/);
    expect(lu).toMatch(/Wyeast Wyeast 3068|Wyeast 3068/);
    expect(lu).toContain('Saccharification');
    expect(lu).toContain('Matériel : Cuve 30 L');
  });

  it('l’ancien plan de houblons du scénario de levure ne figure pas dans le texte lisible', () => {
    const recipe = neipaV3();
    expect(recipe.yeastDesign?.applied.hops).toHaveLength(1);
    const lu = lisible(recipeToText(entree(recipe), DATE));
    // Dans le scénario, un seul houblon : Magnum. La liste réelle en compte 5, une seule fois chacun.
    expect(compte(lu, /Magnum/g)).toBe(1);
    expect(compte(lu, /Lotus/g)).toBe(1);
  });

  it('ne perd rien à l’aller-retour : la lecture du bloc égale celle du format complet v1', () => {
    const recipe = neipaV3();
    const complet = readRecipeText(writeRecipeText(recipe))!;
    const text = recipeToText(entree(recipe), DATE);
    expect(text).toContain(MARQUEUR);
    expect(text.trimEnd().endsWith('FIN DE RECETTE')).toBe(true);
    expect(readRecipeText(text)).toEqual(complet);
    const local = parseLocalRecipe(text);
    expect(local.complete).toBe(true);
    expect(local.yeast).toEqual(recipe.yeast);
    expect(local.hops).toEqual(recipe.hops);
    // Ré-export après import : même texte.
    const { warnings, via, complete, present, ...contenu } = local as any;
    const reexport = recipeToText(entree({ ...recipe, ...contenu } as Recipe), DATE);
    expect(reexport).toBe(text);
  });

  it('le bloc de réimport est une seule ligne, sans doublon de la levure, et tient bien plus court que le format v1', () => {
    const recipe = neipaV3();
    const text = recipeToText(entree(recipe), DATE);
    const bloc = text.split(MARQUEUR)[1].trim().split('\n');
    expect(bloc).toHaveLength(2);
    expect(bloc[1]).toBe('FIN DE RECETTE');
    // Les faits de la levure ne sont écrits qu'une fois : le scénario renvoie à la levure de la recette.
    const fait = /Atténuation apparente 74–80 %/g;
    expect(compte(text, fait)).toBe(1);
    expect(compte(writeRecipeText(recipe), fait)).toBeGreaterThanOrEqual(2);
    expect(text.split('\n').length).toBeLessThan(writeRecipeText(recipe).split('\n').length / 2);
  });

  it('garde l’ancien plan de houblons pour l’import seul : le scénario reste signalé comme ancien', () => {
    const recipe = neipaV3();
    expect(yeastRecipeDesignChanged(recipe, readYeastRecipeDesign(recipe)!)).toBe(true);
    const lu = parseLocalRecipe(recipeToText(entree(recipe), DATE));
    expect(lu.warnings.join(' ')).toMatch(/Scénario de levure ancien/);
    expect(lu.yeastDesign?.applied.hops).toEqual(recipe.yeastDesign!.applied.hops);
  });

  it('refuse un bloc de réimport tronqué ou modifié au lieu de le prendre pour du texte libre', () => {
    const text = recipeToText(entree(neipaV3()), DATE);
    expect(() => readRecipeText(text.replace(/\nFIN DE RECETTE\s*$/, ''))).toThrow();
    expect(() => readRecipeText(text.replace('"format":3', '"format":4'))).toThrow();
    const lignes = text.split('\n');
    lignes[lignes.length - 2] = lignes[lignes.length - 2].slice(0, 200);
    expect(() => readRecipeText(lignes.join('\n'))).toThrow();
    expect(() => normalizeRecipeImport(readRecipeText(text), 'local', true)).not.toThrow();
  });
});
