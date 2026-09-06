import { describe, it, expect } from 'vitest';
import { BrewingMath } from '../../src/services/brewingMath';
import { BrewhouseProfile, Recipe } from '../../src/types';

/**
 * Mise à l'échelle d'une recette, et carbonatation.
 *
 * ⚠️ Ce que ces tests protègent : `scaleRecipe` lisait `recipe.malts`, un champ
 * qu'aucune recette ne renseigne plus depuis que les fermentescibles ont
 * remplacé les malts. L'onglet de mise à l'échelle ne se contentait pas de mal
 * calculer, il JETAIT — `undefined.map is not a function` — sur toute recette
 * créée depuis la refonte.
 */

const bh = (over: Partial<BrewhouseProfile> = {}): BrewhouseProfile =>
  ({
    id: 'bh-30',
    name: 'Cuve 30 L',
    volumeL: 30,
    efficiencyPct: 75,
    mashRatioLPerKg: 3,
    boilOffRatePct: 10,
    deadSpaceL: 2,
    ...over
  }) as BrewhouseProfile;

const recipe = (over: Partial<Recipe> = {}): Recipe =>
  ({
    id: 'R-1',
    name: 'NEIPA',
    style: 'NEIPA',
    volumeL: 30,
    boilMin: 60,
    fermentables: [
      { name: 'US 2-row', weightKg: 6, kind: 'grain', use: 'empatage' },
      { name: 'Lactose', weightKg: 0.5, kind: 'lactose', use: 'ebullition' }
    ],
    hops: [
      { name: 'Magnum', weightG: 30, alpha: 12, stage: 'boil', timeMin: 60 },
      { name: 'Citra', weightG: 100, alpha: 12, stage: 'dryHop', dayOffset: 3 }
    ],
    yeast: { name: 'SafAle US-05', form: 'sèche', qty: 2, unit: 'sachet' },
    ...over
  }) as Recipe;

describe('Mise à l’échelle', () => {
  it('ne jette pas sur une recette du modèle actuel', () => {
    const r = BrewingMath.scaleRecipe(recipe(), 60, bh(), bh({ id: 'bh-60', volumeL: 60 }));
    expect(r.scaledRecipe.fermentables).toHaveLength(2);
  });

  it('double les fermentescibles quand on double le volume', () => {
    const r = BrewingMath.scaleRecipe(recipe(), 60, bh(), bh({ id: 'bh-60' }));
    expect(r.scaledRecipe.fermentables[0].weightKg).toBe(12);
    expect(r.scaledRecipe.fermentables[1].weightKg).toBe(1);
  });

  it('corrige du rendement de la cuve visée', () => {
    // Une cuve à 60 % de rendement demande plus de grain pour la même densité.
    const r = BrewingMath.scaleRecipe(recipe(), 30, bh(), bh({ efficiencyPct: 60 }));
    expect(r.scaledRecipe.fermentables[0].weightKg).toBe(7.5);
  });

  /*
   * ⚠️ Le ratio d'empâtage COMMANDE, sans exception. Il était jeté dès qu'il
   * donnait un empâtage plus petit que le rinçage, et remplacé par une coupe
   * 50/50 du moût : la cuve suivait alors un chiffre que personne n'avait
   * demandé (23.9 L ici, pour 3 L/kg réclamés sur 6 kg).
   */
  it('ne compte que le grain dans le ratio d’empâtage, et le respecte', () => {
    // 6 kg de grain (les 500 g de lactose ne retiennent pas d'eau).
    const r = BrewingMath.scaleRecipe(recipe(), 30, bh(), bh());
    expect(r.scaledRecipe.totalGristKg).toBe(6);
    expect(r.mashWaterL).toBe(18); // 6 × 3.0, comme demandé
  });

  it('lit encore une recette d’avant la refonte', () => {
    const ancienne = recipe({
      fermentables: undefined,
      malts: [{ name: 'Pilsner', weightKg: 5 }]
    } as Partial<Recipe>);
    const r = BrewingMath.scaleRecipe(ancienne, 30, bh(), bh());
    expect(r.scaledRecipe.fermentables[0].weightKg).toBe(5);
    expect(r.scaledRecipe.fermentables[0].kind).toBe('grain');
  });

  it('réduit le houblon d’arôme en grand volume, pas celui d’amérisation', () => {
    const r = BrewingMath.scaleRecipe(recipe(), 300, bh(), bh({ id: 'bh-300' }));
    // ×10 sur le volume : amérisation 300 g pleins, houblonnage à cru −10 %.
    expect(r.scaledRecipe.hops[0].weightG).toBe(300);
    expect(r.scaledRecipe.hops[1].weightG).toBe(900);
  });

  it('ensemence par palier, pas au prorata', () => {
    const r = BrewingMath.scaleRecipe(recipe(), 60, bh(), bh());
    expect(r.scaledRecipe.yeast?.qty).toBe(3); // 60 L ➔ 3 sachets
  });

  it('ne fabrique pas de levure quand la recette n’en déclare pas', () => {
    const r = BrewingMath.scaleRecipe(recipe({ yeast: undefined }), 60, bh(), bh());
    expect(r.scaledRecipe.yeast).toBeUndefined();
  });

  it('n’explose pas sur une recette sans houblon', () => {
    const r = BrewingMath.scaleRecipe(recipe({ hops: undefined }), 60, bh(), bh());
    expect(r.scaledRecipe.hops).toEqual([]);
  });

  it('compte l’évaporation, l’absorption, le volume mort et ce que boit le houblon', () => {
    const r = BrewingMath.scaleRecipe(recipe(), 30, bh(), bh());
    // 30 L visés + 3 évaporés + 2 de volume mort + 0.2 bus par les 30 g de
    // houblon d'ébullition + 1.2 de contraction = 36.4 L.
    // ⚠️ Les 100 g de houblonnage à cru n'en sont PAS : ils se perdent au
    // fermenteur, pas dans la cuve dont on calcule l'eau ici.
    expect(r.preBoilVolumeL).toBe(36.4);
    expect(r.grainAbsorptionL).toBe(5.8);
    // Premier jus = 18 − 5.8 = 12.2 ; il reste 36.4 − 12.2 à rincer.
    expect(r.spargeWaterL).toBe(24.2);
  });

  it('donne un identifiant distinct pour ne pas écraser l’original', () => {
    const r = BrewingMath.scaleRecipe(recipe(), 60, bh(), bh());
    expect(r.scaledRecipe.id).not.toBe('R-1');
    expect(r.scaledRecipe.volumeL).toBe(60);
  });
});

describe('Refermentation et carbonatation', () => {
  it('convertit densité et degré Brix dans les deux sens', () => {
    expect(BrewingMath.sgToBrix(1.062)).toBeCloseTo(15.2, 1);
    expect(BrewingMath.sgToBrix(1.0)).toBe(0);
  });

  it('sur un échantillon non fermenté, le réfractomètre redonne la densité de départ', () => {
    // Le garde-fou du modèle : l'ancienne formule renvoyait 1.041 pour 1.062.
    const fg = BrewingMath.calculateSeanTerrillRefractometer(1.062, BrewingMath.sgToBrix(1.062));
    expect(fg).toBeGreaterThan(1.058);
    expect(fg).toBeLessThan(1.064);
  });

  it('le CO₂ résiduel décroît quand la fermentation a fini chaud', () => {
    const froid = BrewingMath.calculateResidualCo2Vol(15);
    const chaud = BrewingMath.calculateResidualCo2Vol(24);
    expect(BrewingMath.calculateResidualCo2Vol(20)).toBeCloseTo(0.86, 1);
    expect(chaud).toBeLessThan(froid);
  });

  it('déduit le CO₂ déjà dissous du sucre de refermentation', () => {
    // 2.4 vol visés, 20 L, fin de fermentation à 20 °C ➔ (2.4 − 0.86) × 4 × 20.
    expect(BrewingMath.calculatePrimingSugarG(2.4, 20, 20)).toBe(123);
  });

  it('demande moins de saccharose que de dextrose, à carbonatation égale', () => {
    const dextrose = BrewingMath.calculatePrimingSugarG(2.4, 20, 20, 'dextrose');
    const saccharose = BrewingMath.calculatePrimingSugarG(2.4, 20, 20, 'saccharose');
    expect(saccharose).toBeLessThan(dextrose);
  });

  it('ne propose jamais un sucrage négatif', () => {
    // Bière déjà plus carbonatée que la cible : on n'ajoute rien.
    expect(BrewingMath.calculatePrimingSugarG(0.5, 20, 4)).toBe(0);
  });

  it('donne la pression de fût attendue', () => {
    // Contrôle du modèle : 2.5 volumes à 4 °C ➔ environ 0.82 bar.
    expect(BrewingMath.calculateKegPressureBar(2.5, 4)).toBeCloseTo(0.82, 1);
  });

  it('demande plus de pression quand le fût est plus chaud', () => {
    expect(BrewingMath.calculateKegPressureBar(2.5, 12)).toBeGreaterThan(
      BrewingMath.calculateKegPressureBar(2.5, 4)
    );
  });
});
