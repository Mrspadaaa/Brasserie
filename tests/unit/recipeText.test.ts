import { describe, it, expect } from 'vitest';
import { recipeToText, RecipeTextInput } from '../../src/domain/recipeText';
import { Recipe } from '../../src/types';

/**
 * L'export texte doit être LISIBLE et HONNÊTE.
 *
 * ⚠️ Demandé ainsi : « à la fin de la recette une fois terminé je veux pouvoir
 * les extraire au format texte ». Ces tests ne vérifient pas une mise en page —
 * elle bougera — mais les deux propriétés qui la rendent utile : tout ce qui a
 * servi à brasser y est, et rien qui n'ait été saisi n'y apparaît.
 */

const DATE = new Date('2026-09-05T10:00:00Z');

const BASE: RecipeTextInput = {
  name: 'New England IPA',
  style: 'NEIPA',
  volumeL: 19,
  boilMin: 60,
  og: 1.061,
  fg: 1.012,
  abv: 6.4,
  ibu: 67,
  ebc: 9.4,
  efficiencyPct: 75,
  fermentables: [
    { name: 'US 2-row', weightKg: 4.1, kind: 'grain', use: 'empatage', colorEbc: 4 },
    { name: 'Lactose', weightKg: 0.4, kind: 'lactose', use: 'ebullition' }
  ] as RecipeTextInput['fermentables'],
  totalGristKg: 4.1,
  hops: [
    { name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop', dayOffset: 3 },
    { name: 'Magnum', weightG: 20, alpha: 12, stage: 'boil', timeMin: 60 }
  ] as RecipeTextInput['hops'],
  yeast: {
    name: 'US-05',
    lab: 'Fermentis',
    form: 'sèche',
    qty: 2,
    unit: 'sachet',
    attenuationPct: 81,
    fermTempMinC: 18,
    fermTempMaxC: 22
  } as RecipeTextInput['yeast'],
  mashSteps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }],
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 7 }] as RecipeTextInput['fermentation'],
  notes: 'Concasser la veille.'
};

describe('Export texte d’une recette', () => {
  it('porte l’identité et les cibles en tête', () => {
    const t = recipeToText(BASE, DATE);
    expect(t).toContain('New England IPA — NEIPA');
    expect(t).toContain('19 L en fermenteur');
    expect(t).toMatch(/OG 1\.061.*FG 1\.012.*IBU 67/);
  });

  it('donne la facture de grain avec les parts', () => {
    const t = recipeToText(BASE, DATE);
    expect(t).toContain('4,1 kg');
    expect(t).toContain('US 2-row');
    expect(t).toContain('100 %');
  });

  /*
   * ⚠️ Les houblons se lisent dans l'ORDRE DE LA JOURNÉE, pas dans l'ordre de
   * saisie. On les pèse et on les jette dans cet ordre : une liste triée
   * autrement obligerait à la relire trois fois pendant l'ébullition.
   */
  it('⚠️ groupe les houblons par moment, dans l’ordre chronologique', () => {
    const t = recipeToText(BASE, DATE);
    expect(t.indexOf('Ébullition :')).toBeLessThan(t.indexOf('Houblonnage à cru :'));
    expect(t).toContain('J+3');
  });

  it('sous le kilo, les fermentescibles se pèsent en grammes', () => {
    const t = recipeToText(BASE, DATE);
    expect(t).toContain('400 g');
  });

  /*
   * ⚠️ LA SECTION QUI MANQUE À TOUTES LES RECETTES PARTAGÉES. Une même facture
   * de grain sur deux eaux différentes donne deux bières différentes : les
   * sels et l'acide sont de la recette au même titre que le houblon.
   */
  it('⚠️ écrit le traitement de l’eau — sels et acide compris', () => {
    const t = recipeToText(
      {
        ...BASE,
        water: {
          sourceName: 'Réseau — Villars-sur-Glâne',
          styleName: 'Hazy IPA',
          mashWaterL: 18.5,
          spargeWaterL: 12.5,
          mashOsmoseeL: 13,
          spargeOsmoseeL: 8.8,
          doses: { gypse: 2, cacl2: 6 },
          acidId: 'lactique',
          mashAcid: { amount: 2.1, unit: 'mL' },
          spargeAcid: { amount: 1.4, unit: 'mL' },
          ra: -40
        }
      },
      DATE
    );
    expect(t).toContain('Réseau — Villars-sur-Glâne');
    expect(t).toContain('dont 13 L osmosée');
    expect(t).toContain('Gypse');
    expect(t).toMatch(/lactique.*2\.1 mL à l’empâtage.*1\.4 mL au rinçage/);
  });

  /*
   * ⚠️ Règle « ne rien inventer », tenue jusque dans l'export : une valeur
   * absente disparaît AVEC SA LIGNE. Une fiche courte vaut mieux qu'une fiche
   * qui affirme un chiffre que personne n'a saisi.
   */
  it('⚠️ n’écrit pas les lignes dont la valeur manque', () => {
    const t = recipeToText(
      { ...BASE, og: null, fg: null, ibu: null, ebc: null, abv: null, water: undefined, notes: '' },
      DATE
    );
    /*
     * On vise la LIGNE DES CIBLES, pas le mot : « 4 EBC » reste écrit à côté du
     * malt, où c'est sa couleur mesurée et non une prédiction manquante.
     */
    expect(t).not.toMatch(/OG 1\./);
    expect(t).not.toMatch(/IBU \d/);
    expect(t).not.toMatch(/EBC \d+\n/);
    expect(t).not.toContain('EAU');
    expect(t).not.toContain('NOTES');
    // Mais le reste tient toujours debout.
    expect(t).toContain('New England IPA');
    expect(t).toContain('US 2-row');
  });

  it('ne casse pas sur une recette vide', () => {
    const vide: RecipeTextInput = {
      name: '',
      style: '',
      volumeL: 0,
      boilMin: 0,
      fermentables: [],
      totalGristKg: 0,
      hops: [],
      yeast: { name: '', form: 'sèche', qty: 0, unit: 'sachet' } as RecipeTextInput['yeast'],
      mashSteps: [],
      fermentation: []
    };
    expect(() => recipeToText(vide, DATE)).not.toThrow();
    expect(recipeToText(vide, DATE)).toContain('Recette sans nom');
  });
});
