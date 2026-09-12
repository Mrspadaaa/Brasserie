import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../src/types';
import { recipeToText, type RecipeTextInput } from '../../src/domain/recipeText';
import { normalizeRecipeImport, parseLocalRecipe } from '../../src/domain/recipeImport';
import { readRecipeFields, readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { readYeastRecipeDesign, yeastRecipeDesignChanged } from '../../src/domain/yeastRecipeDesign';
import { RecipeTextParser } from '../../src/services/recipeParser';
import { newNoloConfig } from '../../src/domain/nolo';
import { fullRecipe } from '../fixtures/fullRecipe';

function wheatRecipe(pressureBar?: number): Recipe {
  const recipe: Recipe = {
    ...structuredClone(fullRecipe), name: 'Weissbier — essai girofle', style: 'Weissbier',
    styleRef: { guideId: 'bjcp-2021', version: '2021', styleId: 'weissbier' },
    volumeL: 20, waterPlan: undefined,
    yeast: { name: 'Weihenstephan Weizen', lab: 'Wyeast', strain: '3068',
      hopIndexId: 'wyeast-3068', form: 'liquide', qty: 125, unit: 'mL', pitchTempC: 18,
      fermTempMinC: 18, fermTempMaxC: 24, attenuationPct: 75,
      fermentationFacts: { version: 1, strainName: '3068', retrievedAt: '2026-09-12',
        source: { author: 'Wyeast', title: '3068 Weihenstephan Weizen', year: 2026,
          kind: 'manufacturer', reference: 'https://wyeastlab.com/product/weihenstephan-weizen/' },
        conditions: 'Fenêtre documentaire ; utilisation des sucres non précisée.',
        sugars: { glucose: 'unknown' }, pof: 'positive', hydrolysis: 'unknown', temperatureC: { min: 18, max: 24 } },
      notes: 'Dose déclarée ; viabilité inconnue.' },
    mash: { ratioLPerKg: 3.5, steps: [
      { name: 'Repos férulique', tempC: 44, durationMin: 15 },
      { name: 'Saccharification conservée', tempC: 66.5, durationMin: 61 },
      { name: 'Mash-out', tempC: 76, durationMin: 10 }
    ] },
    fermentation: [
      { kind: 'primaire', name: 'Fermentation', tempC: 18, days: 7, note: 'Suivre la densité.' },
      { kind: 'garde', name: 'Garde conservée', tempC: -1, days: 14, note: 'Après densité stable.' }
    ],
    hops: [
      { name: 'Hallertau', weightG: 20, alpha: 4.2, stage: 'boil', timeMin: 60 },
      { name: 'Mandarina Bavaria', weightG: 25, alpha: 0, stage: 'dryHop', dayOffset: 0,
        aromaTiming: 'fermentation', aromaTemperatureC: 18, aromaContactHours: 48 },
      { name: 'Hallertau Blanc', weightG: 30, alpha: 0, stage: 'dryHop', dayOffset: 7,
        aromaTiming: 'postFermentation', aromaTemperatureC: 0, aromaContactHours: 0 }
    ]
  };
  recipe.yeastDesign = { modelVersion: 'yeast-recipe-1', yeastId: 'wyeast-3068',
    styleId: 'weissbier', goal: 'clove', ...(pressureBar !== undefined ? { pressureBar } : {}),
    ferulicRest: true, applied: structuredClone({ yeast: recipe.yeast, volumeL: recipe.volumeL,
      fermentation: recipe.fermentation!, mashSteps: recipe.mash!.steps,
      style: recipe.style, styleRef: recipe.styleRef }) };
  return recipe;
}

function textInput(recipe: Recipe): RecipeTextInput {
  return { recipe, name: 'Projection obsolète', style: 'IPA', volumeL: 1, boilMin: 0,
    fermentables: [], totalGristKg: 0, hops: [], yeast: fullRecipe.yeast,
    mashSteps: [], fermentation: [] };
}

function expectYeastFlow(actual: Partial<Recipe>, expected: Recipe) {
  for (const key of ['name', 'style', 'styleRef', 'volumeL', 'yeast', 'yeastDesign', 'mash', 'fermentation', 'hops'] as const) {
    expect(actual[key], key).toEqual(expected[key]);
  }
}

describe('Export puis import réellement employés pour le scénario levure', () => {
  it.each([0, undefined, 0.65])('conserve la pression %s, l’identité et les consignes entre étapes', pressure => {
    const recipe = wheatRecipe(pressure);
    const before = structuredClone(recipe);
    const text = recipeToText(textInput(recipe));
    const own = normalizeRecipeImport(readRecipeText(text), 'local', true);
    const local = parseLocalRecipe(text);
    expectYeastFlow(readRecipeFields(own), recipe);
    expectYeastFlow(readRecipeFields(local), recipe);
    expect(local.complete).toBe(true);
    expect(local.present).toEqual(expect.arrayContaining(['yeast', 'yeastDesign', 'styleRef', 'mash', 'fermentation', 'hops']));
    expect(yeastRecipeDesignChanged(own as Recipe, readYeastRecipeDesign(own as Recipe)!)).toBe(false);
    expect(recipe).toEqual(before);
    expect(text).not.toContain('Projection obsolète');
  });

  it('garde les valeurs absentes distinctes des zéros, y compris dans le snapshot', () => {
    const recipe = wheatRecipe();
    delete recipe.yeast.pitchTempC;
    delete recipe.yeast.fermTempMaxC;
    delete recipe.hops[1].aromaTiming;
    delete recipe.hops[1].aromaContactHours;
    delete recipe.hops[1].aromaTemperatureC;
    recipe.yeastDesign!.applied.yeast = structuredClone(recipe.yeast);
    const restored = parseLocalRecipe(recipeToText(textInput(recipe)));
    expectYeastFlow(readRecipeFields(restored), recipe);
    expect(restored.yeastDesign).not.toHaveProperty('pressureBar');
    expect(restored.hops[1]).not.toHaveProperty('aromaTiming');
    expect(restored.hops[2]).toMatchObject({ aromaTemperatureC: 0, aromaContactHours: 0 });
  });

  it.each([undefined, null])('réimporte une copie complète dont des mesures restent inconnues (%s)', missing => {
    const recipe = wheatRecipe();
    recipe.yeast.qty = missing as any;
    recipe.yeast.unit = undefined as any;
    recipe.yeast.form = undefined as any;
    recipe.yeast.pitchTempC = missing;
    recipe.fermentation![0].tempC = missing as any;
    recipe.fermentation![0].days = missing as any;
    recipe.mash!.steps[0].durationMin = missing as any;
    recipe.yeastDesign!.ferulicRest = false;
    recipe.yeastDesign!.applied.yeast = structuredClone(recipe.yeast);
    recipe.yeastDesign!.applied.fermentation = structuredClone(recipe.fermentation!);
    recipe.yeastDesign!.applied.mashSteps = structuredClone(recipe.mash!.steps);
    const restored = parseLocalRecipe(recipeToText(textInput(recipe)));
    expectYeastFlow(readRecipeFields(restored), recipe);
    expect(restored.warnings.join(' ')).toMatch(/manquante/);
    expect(yeastRecipeDesignChanged(restored as Recipe, restored.yeastDesign!)).toBe(false);
  });

  it('transmet la référence de souche sans recréer un lien vers le stock de l’auteur', () => {
    const recipe = wheatRecipe(0);
    recipe.yeast.stockItemRef = 'private-local-yeast-stock';
    recipe.yeastDesign!.applied.yeast = structuredClone(recipe.yeast);
    const text = recipeToText(textInput(recipe));
    const restored = parseLocalRecipe(text);
    expect(text).not.toContain('private-local-yeast-stock');
    expect(restored.yeast?.hopIndexId).toBe('wyeast-3068');
    expect(restored.yeastDesign?.applied.yeast.hopIndexId).toBe('wyeast-3068');
    expect(yeastRecipeDesignChanged(restored as Recipe, restored.yeastDesign!)).toBe(false);
    expect(recipe.yeast.stockItemRef).toBe('private-local-yeast-stock');
  });

  it('signale un ancien scénario sans rétablir ses anciennes consignes', () => {
    const recipe = wheatRecipe(0);
    recipe.yeast.qty = 150;
    recipe.fermentation![0].tempC = 20;
    recipe.mash!.steps[1].tempC = 67;
    const text = recipeToText(textInput(recipe));
    const restored = parseLocalRecipe(text);
    expectYeastFlow(readRecipeFields(restored), recipe);
    expect(yeastRecipeDesignChanged(restored as Recipe, restored.yeastDesign!)).toBe(true);
    expect(restored.warnings.join(' ')).toMatch(/scénario.*(?:ancien|périmé|modifi)/i);
    expect(text).toMatch(/(?:ancien|périmé|modifi).*scénario|scénario.*(?:ancien|périmé|modifi)/i);
  });

  it('donne une intention lisible une seule fois, sans créer de note métier au réimport', () => {
    const recipe = wheatRecipe(0);
    const text = recipeToText(textInput(recipe));
    expect(text).toMatch(/Intention levure à la copie :.*Girofle.*0 bar/);
    expect(text.match(/Intention levure à la copie :/g)).toHaveLength(1);
    expect(text).not.toContain('undefined');
    const restored = parseLocalRecipe(text);
    expect(restored.notesCreation).toBe(recipe.notesCreation);
    expect(restored.notes).toEqual(recipe.notes);
    expect(recipeToText(textInput(wheatRecipe()))).toMatch(/pression (?:non renseignée|inconnue)/i);
    const noScenario = wheatRecipe(); delete noScenario.yeastDesign;
    expect(recipeToText(textInput(noScenario))).not.toContain('Intention levure à la copie');
  });

  it('préserve aussi la configuration NOLO versionnée et ses inconnues', () => {
    const recipe = wheatRecipe(0);
    recipe.nolo = newNoloConfig();
    recipe.nolo.wort.sugarsGL = { glucose: { min: 0, max: 0 }, maltose: null };
    recipe.nolo.wort.sugarsComplete = false;
    recipe.fgTarget = null;
    const restored = parseLocalRecipe(recipeToText(textInput(recipe)));
    expect(restored.nolo).toEqual(recipe.nolo);
    expect(restored.fgTarget).toBeNull();
    expectYeastFlow(readRecipeFields(restored), recipe);
  });
});

describe('Frontière entre données de levure lues, absentes et invalides', () => {
  it.each([
    ['version future', (s: any) => { s.modelVersion = 'yeast-recipe-99'; }],
    ['pression négative', (s: any) => { s.pressureBar = -1; }],
    ['référence incohérente', (s: any) => { s.yeastId = 'white-labs-wlp300'; }],
    ['palier endommagé', (s: any) => { s.applied.mashSteps = [null]; }],
    ['température non numérique', (s: any) => { s.applied.fermentation[0].tempC = 'froid'; }],
    ['dose négative', (s: any) => { s.applied.yeast.qty = -5; }]
  ])('refuse un snapshot %s et avertit sans inventer de remplacement', (_, corrupt) => {
    const recipe = wheatRecipe(0);
    corrupt(recipe.yeastDesign);
    const imported = normalizeRecipeImport(recipe, 'ia');
    expect(imported.yeastDesign).toBeUndefined();
    expect(imported.warnings.join(' ')).toMatch(/scénario.*(?:invalide|non reconnu)/i);
    expect(imported.notesCreation).toContain('Scénario levure non importé');
    expect(imported.yeast).toEqual(recipe.yeast);
    expect(() => normalizeRecipeImport(recipe, 'local', true)).toThrow(/scénario/i);
    expect(() => recipeToText(textInput(recipe))).toThrow(/scénario/i);
  });

  it('ne transforme pas une copie L’Affinée tronquée en recette étrangère plausible', () => {
    const text = writeRecipeText(wheatRecipe(0));
    expect(() => parseLocalRecipe(text.replace(/FIN DE RECETTE$/, ''))).toThrow();
    expect(() => parseLocalRecipe(text.replace('RECETTE v1', 'RECETTE v9'))).toThrow();
  });

  it('conserve une levure partielle sans dose, unité, forme ou référence supposée', () => {
    const imported = normalizeRecipeImport({ yeast: { name: 'Bavarian Wheat', lab: 'Wyeast', strain: '3638' } }, 'ia');
    expect(imported.yeast).toEqual({ name: 'Bavarian Wheat', lab: 'Wyeast', strain: '3638' });
    expect(imported.yeastDesign).toBeUndefined();
    expect(imported.warnings.join(' ')).toMatch(/levure.*(?:quantité|dose).*manquant/i);
    expect(imported.warnings.join(' ')).toMatch(/forme/i);
  });

  it('conserve le zéro déclaré et avertit lorsqu’un champ invalide est rejeté', () => {
    const imported = normalizeRecipeImport({ yeast: { name: 'Essai', form: 'liquide', qty: 0,
      unit: 'mL', pitchTempC: NaN }, hops: [{ name: 'Citra', weightG: 10, alpha: 0, stage: 'dryHop', aromaTiming: 'jour 3' }] }, 'ia');
    expect(imported.yeast).toMatchObject({ qty: 0, unit: 'mL', form: 'liquide' });
    expect(imported.yeast).not.toHaveProperty('pitchTempC');
    expect(imported.hops[0]).not.toHaveProperty('aromaTiming');
    expect(imported.warnings.join(' ')).toMatch(/ensemencement|température/i);
    expect(imported.warnings.join(' ')).toMatch(/contact|phase.*houblon|houblon.*phase/i);
  });

  it('ne classe pas une recette étrangère partielle depuis un objectif aromatique', () => {
    const raw = 'Essai de froment\nLevure : Wyeast 3068\nInstructions\nRenforcer le girofle, pression à choisir.';
    const imported = parseLocalRecipe(raw);
    expect(imported.complete).toBe(false);
    expect(imported.yeast).toMatchObject({ strain: '3068', lab: 'Wyeast' });
    expect(imported.yeast).not.toHaveProperty('qty');
    expect(imported.yeast).not.toHaveProperty('form');
    expect(imported.yeastDesign).toBeUndefined();
    expect(imported.styleRef).toBeUndefined();
    expect(imported.present).not.toContain('style');
    expect(imported.notesCreation).toBe(raw);
  });

  it.each([
    ['Levure : Wyeast 3068 (Weihenstephan Weizen), liquide, 125 mL, ensemencement 18 °C', 125, 'mL', 'liquide'],
    ['Levure : Lallemand Munich Classic, sèche, 11,5 g', 11.5, 'g', 'sèche'],
    ['Levure : WLP300, 2 flacons', 2, 'flacon', undefined]
  ])('lit uniquement la quantité, la forme et l’unité annoncées : %s', (line, qty, unit, form) => {
    const result = RecipeTextParser.parse(`Essai Weissbier\n20 L\n${line}`);
    expect(result.yeast).toMatchObject({ qty, unit });
    expect(result.yeast?.form).toBe(form);
    expect(result.yeast?.name).not.toMatch(/125|11,5|flacons|sèche|liquide/);
  });

  it('ne confond pas température de fermentation et température d’ensemencement', () => {
    const result = RecipeTextParser.parse('Essai\nLevure : Wyeast 3068, fermentation 20 °C');
    expect(result.yeast?.pitchTempC).toBeUndefined();
  });

  it('ne prend ni la dose ni la forme dans la levure proposée comme alternative', () => {
    const result = RecipeTextParser.parse('Essai\nLevure : White Labs WLP300 ou Lallemand Munich Classic sèche 11 g');
    expect(result.yeast?.strain).toBe('WLP300');
    expect(result.yeast?.form).toBeUndefined();
    expect(result.yeast?.qty).toBeUndefined();
    expect(result.yeast?.notes).toContain('sans équivalence validée');
  });

  it('ne transforme pas une dose négative en dose positive', () => {
    const result = RecipeTextParser.parse('Essai\nLevure : Munich Classic, Lallemand, sèche, -11 g');
    expect(result.yeast?.qty).toBeUndefined();
    expect(result.yeast?.unit).toBe('g');
    expect(result.warnings.join(' ')).toMatch(/quantité.*négative/i);
  });

  it.each([
    'Levure : Lallemand Munich Classic, dosage 50 g/hL',
    'Levure : Wyeast 3068 pour 20 L de moût',
    'Levure : Lallemand Munich Classic, dose 10–20 g'
  ])('ne transforme pas un taux, un volume de brassin ou une plage en dose : %s', line => {
    const result = parseLocalRecipe(`Essai Weissbier\n20 L\n${line}`);
    expect(result.yeast?.qty).toBeUndefined();
    expect(result.warnings.join(' ')).toMatch(/taux|volume de moût|plage de quantité/);
    expect(result.notesCreation).toContain(line);
  });

  it('refuse une exportation qui ferait disparaître une consigne actuelle invalide', () => {
    const recipe = wheatRecipe(0);
    recipe.yeast.pitchTempC = NaN;
    expect(() => recipeToText(textInput(recipe))).toThrow(/température.*invalide/i);
    recipe.yeast.pitchTempC = 18;
    recipe.hops[1].aromaContactHours = -48;
    expect(() => recipeToText(textInput(recipe))).toThrow(/contact.*invalide/i);
  });

  it('signale des données documentaires rejetées au lieu de faire disparaître leur provenance', () => {
    const recipe = wheatRecipe();
    recipe.yeast.fermentationFacts!.source = { title: 'Sans auteur ni référence' } as any;
    const imported = normalizeRecipeImport(recipe, 'ia');
    expect(imported.yeast?.fermentationFacts).toBeUndefined();
    expect(imported.warnings.join(' ')).toMatch(/données fermentaires sourcées.*invalide/i);
    expect(imported.notesCreation).toContain('Sans auteur ni référence');
    expect(() => recipeToText(textInput(recipe))).toThrow(/données fermentaires sourcées/i);
  });

  it('conserve les fragments structurés incomplets dans des notes explicites', () => {
    const result = normalizeRecipeImport({ yeast: { lab: 'Wyeast', strain: '3068' },
      hops: [{ name: 'Citra', stage: 'dryHop', aromaTiming: 'fermentation' }],
      mashSteps: [{ name: 'Repos férulique', tempC: 44 }],
      fermentation: [{ kind: 'garde', name: 'Garde' }] }, 'ia');
    expect(result.yeast).toBeUndefined();
    expect(result.hops).toEqual([]);
    expect(result.mashSteps).toEqual([]);
    expect(result.fermentation).toEqual([]);
    expect(result.notesCreation).toMatch(/3068[\s\S]*Citra[\s\S]*Repos férulique[\s\S]*Garde|Citra[\s\S]*3068[\s\S]*Repos férulique[\s\S]*Garde/);
    expect(result.warnings.join(' ')).toMatch(/levure.*incomplète/i);
  });

  it('lit les paliers annoncés et la garde froide sans ajouter de durée à la fermentation', () => {
    const result = parseLocalRecipe('Essai Hefeweizen\n20 L\nLevure : Wyeast 3068\nInstructions\nRepos férulique à 44 °C pendant 15 min.\nSaccharification à 66,5 °C pendant 61 min.\nFermentation à 18 °C.\nGarde à -1 °C pendant 14 jours.');
    expect(result.style).toBe('Hefeweizen');
    expect(result.mashSteps).toEqual([
      { name: 'Repos férulique', tempC: 44, durationMin: 15 },
      { name: 'Saccharification', tempC: 66.5, durationMin: 61 }
    ]);
    expect(result.fermentation).toHaveLength(2);
    expect(result.fermentation[0]).not.toHaveProperty('days');
    expect(result.fermentation[1]).toMatchObject({ kind: 'garde', tempC: -1, days: 14 });
    expect(result.warnings.join(' ')).toMatch(/durée de fermentation manquante/i);
  });

  it('lit des contacts explicitement annoncés sans déduire une phase du jour', () => {
    const result = parseLocalRecipe('Essai\n20 L\n25 g Citra hops (dry hop, J+0, fermentation active, 18 °C, contact 48 heures)\n30 g Mosaic hops (dry hop, J+7, après fermentation, 0 °C, contact 2 jours)\n10 g Saaz hops (dry hop, J+3)');
    expect(result.hops[0]).toMatchObject({ dayOffset: 0, aromaTiming: 'fermentation', aromaTemperatureC: 18, aromaContactHours: 48 });
    expect(result.hops[1]).toMatchObject({ dayOffset: 7, aromaTiming: 'postFermentation', aromaTemperatureC: 0, aromaContactHours: 48 });
    expect(result.hops[2]).not.toHaveProperty('aromaTiming');
    expect(result.hops[2]).not.toHaveProperty('aromaContactHours');
  });

  it('ne déclare pas terminé un contact de fin de fermentation ou une indication négative', () => {
    const result = parseLocalRecipe('Essai\n20 L\n25 g Citra hops (dry hop, en fin de fermentation, J+3)\n25 g Mosaic hops (dry hop, not during active fermentation)');
    expect(result.hops).toHaveLength(2);
    result.hops.forEach(hop => expect(hop).not.toHaveProperty('aromaTiming'));
  });
});
