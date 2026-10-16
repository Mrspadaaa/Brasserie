import { describe, expect, it } from 'vitest';
import { recipeImportFieldLabel, sanitizeRecipeImport } from '../../functions/src/recipeImportResult';
import { TASKS } from '../../functions/src/prompts';

/** #100.3 : un import lu par Gemini ne transmet aucun nombre impossible ; règle dans recipeImportResult.ts. */
const base = () => ({
  name: 'Brown ale', style: 'English Brown', volumeL: 20, ogTarget: 1.052, fgTarget: 1.012, ibuTarget: 25, colorEbc: 40,
  fermentables: [{ name: 'Maris Otter', weightKg: 4.2, kind: 'grain', use: 'empatage', colorEbc: 6 }, { name: 'Lactose', weightKg: 0, kind: 'lactose', use: 'ebullition' }],
  hops: [{ name: 'Fuggle', weightG: 30, alpha: 4.5, stage: 'boil', timeMin: 60 }, { name: 'EKG', weightG: 20, stage: 'boil', timeMin: 0 }],
  yeast: { name: 'S-04', fermTempMinC: 18, fermTempMaxC: 20, attenuationPct: 75,
    technicalFacts: [{ key: 'pitchRate', reported: '0,5-1 g/L', range: { min: 0.5, max: 1 }, unit: 'g/L', qualifier: 'range', origin: 'ai' }] },
  mashSteps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }],
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 }, { kind: 'garde', name: 'Garde à froid', tempC: -1, days: 7 }],
  waterPlan: { mash: { gypse: 2.5, cacl2: 0 }, acid: { id: 'lactique', mash: 1.5 }, targetPh: 5.4 },
  waterTarget: { so4: 150, cl: 0 }
});

describe('Validation serveur des nombres d’un import de recette', () => {
  it('laisse intacte une recette plausible, zéros et garde sous 0 °C compris', () => {
    const recipe = base();
    expect(sanitizeRecipeImport(recipe)).toEqual(recipe);
  });

  it('retire dénormaux, négatifs, non finis et valeurs hors bornes métier, avec un avertissement chacun', () => {
    const recipe: any = base();
    recipe.hops[0].timeMin = 6e-323;          // banc #91, 3.8 medium
    recipe.hops[1].alpha = -3;                // négatif
    recipe.volumeL = 0;                       // un brassin sans volume n'existe pas
    recipe.ogTarget = 12;                     // °P écrit dans un champ de densité
    recipe.mashSteps[0].tempC = 670;          // hors bornes
    recipe.fermentation[0].days = Number.NaN; // non fini
    recipe.yeast.attenuationPct = 150;
    recipe.waterPlan.mash.gypse = 5e-324;
    recipe.waterTarget.so4 = 1e9;
    const result: any = sanitizeRecipeImport(recipe);
    expect(result.hops[0]).toEqual({ name: 'Fuggle', weightG: 30, alpha: 4.5, stage: 'boil' });
    expect(result.hops[1]).toEqual({ name: 'EKG', weightG: 20, stage: 'boil', timeMin: 0 });
    expect(result).not.toHaveProperty('volumeL');
    expect(result).not.toHaveProperty('ogTarget');
    expect(result.fgTarget).toBe(1.012);
    expect(result.mashSteps[0]).toEqual({ name: 'Saccharification', durationMin: 60 });
    expect(result.fermentation[0]).toEqual({ kind: 'primaire', name: 'Primaire', tempC: 19 });
    expect(result.fermentation[1].tempC).toBe(-1);
    expect(result.yeast).not.toHaveProperty('attenuationPct');
    expect(result.yeast.technicalFacts[0].range).toEqual({ min: 0.5, max: 1 });
    expect(result.waterPlan.mash).toEqual({ cacl2: 0 });
    expect(result.waterTarget).toEqual({ cl: 0 });
    // V3 m9: the brewer reads the ingredient and the field, never a schema key, a path or 6e-323.
    const removed = (who: string, field: string) => `${who} : ${field} impossible, valeur écartée. À compléter.`;
    expect(result.importWarnings).toEqual([
      removed('Recette', 'volume du brassin'),
      removed('Recette', 'densité initiale'),
      removed('Fuggle', 'durée d’ajout'),
      removed('EKG', 'acide alpha'),
      removed('S-04', 'atténuation'),
      removed('Saccharification', 'température'),
      removed('Primaire', 'durée'),
      removed('Eau', 'gypse à l’empâtage'),
      removed('Eau', 'sulfate cible')
    ]);
    for (const warning of result.importWarnings)
      expect(warning).not.toMatch(/[a-z][A-Z]|\w\.\w|\[|\de-?\d|=/);
  });

  it('nomme une ligne sans nom par sa section et son rang, et garde un repli lisible pour un champ inconnu', () => {
    const recipe: any = base();
    delete recipe.hops[1].name; recipe.hops[1].weightG = -5;
    delete recipe.mashSteps[0].name; recipe.mashSteps[0].durationMin = 5e-324;
    recipe.mysteryScore = -1;
    expect(sanitizeRecipeImport(recipe).importWarnings).toEqual([
      'Houblon 2 : quantité impossible, valeur écartée. À compléter.',
      'Palier 1 : durée impossible, valeur écartée. À compléter.',
      'Recette : une valeur impossible a été écartée. À compléter.'
    ]);
  });

  it('a un libellé de brasseur pour chaque nombre du schéma d’import', () => {
    const numbers: string[] = [];
    const walk = (node: any, pattern: string) => {
      if (node?.type === 'NUMBER' || node?.type === 'INTEGER') numbers.push(pattern);
      if (node?.type === 'ARRAY') walk(node.items, `${pattern}[]`);
      for (const [key, child] of Object.entries(node?.properties ?? {})) walk(child, pattern ? `${pattern}.${key}` : key);
    };
    walk(TASKS.importRecipe.schema, '');
    expect(numbers.length).toBeGreaterThan(80);
    expect(numbers.filter(pattern => !recipeImportFieldLabel(pattern))).toEqual([]);
  });

  it('ne modifie pas l’objet reçu et ignore ce qui n’est pas un objet', () => {
    const recipe: any = base(); recipe.hops[0].timeMin = 6e-323;
    const before = structuredClone(recipe);
    sanitizeRecipeImport(recipe);
    expect(recipe).toEqual(before);
    expect(sanitizeRecipeImport(null)).toBeNull();
    expect(sanitizeRecipeImport('texte')).toBe('texte');
  });
});
