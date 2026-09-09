import { describe, it, expect } from 'vitest';
import { BrewingMath, kettleHopGrams } from '../../src/services/brewingMath';
import { HopIngredient, Fermentable, Batch } from '../../src/types';

/**
 * Calculs de brassage.
 *
 * Chaque cas fixe soit un chiffre qu'un brasseur peut vérifier à la main, soit
 * un comportement qui a MORDU en production. Les seconds portent la mention de
 * ce qui se passait avant.
 */

const hop = (o: Partial<HopIngredient>): HopIngredient => ({
  name: 'X',
  alpha: 10,
  weightG: 30,
  stage: 'boil',
  timeMin: 60,
  ...o
});

const grain = (weightKg: number, ppg = 37): Fermentable => ({
  name: 'Malt',
  weightKg,
  kind: 'grain',
  use: 'empatage',
  potentialPpg: ppg
});

describe('ABV', () => {
  it('applique le facteur 131.25 des douanes suisses', () => {
    expect(BrewingMath.calculateABV(1.061, 1.012)).toBeCloseTo(6.4, 1);
  });

  it('rend zéro quand la finale dépasse l’initiale — une fermentation ne remonte pas', () => {
    expect(BrewingMath.calculateABV(1.01, 1.02)).toBe(0);
  });

  it('rend zéro sur une densité manquante plutôt que NaN', () => {
    expect(BrewingMath.calculateABV(0, 1.01)).toBe(0);
    expect(BrewingMath.calculateABV(1.05, 0)).toBe(0);
  });
});

describe('Plato', () => {
  it('convertit 1.040 en ~10 °P', () => {
    expect(BrewingMath.sgToPlato(1.04)).toBeCloseTo(10, 0);
  });

  it('fait l’aller-retour sans dériver', () => {
    const sg = BrewingMath.platoToSG(BrewingMath.sgToPlato(1.061));
    expect(sg).toBeCloseTo(1.061, 3);
  });

  it('ne descend jamais sous zéro', () => {
    expect(BrewingMath.sgToPlato(0.99)).toBe(0);
  });
});

describe('Amertume, par étape', () => {
  it('⚠️ le houblonnage à cru ne compte pour RIEN — il gonflait toute NEIPA d’une centaine d’IBU', () => {
    expect(BrewingMath.hopIbu(hop({ stage: 'dryHop', weightG: 170, alpha: 12 }), 19, 1.061)).toBe(0);
  });

  it('un alpha inconnu n’attribue aucune amertume plutôt qu’une amertume moyenne', () => {
    expect(BrewingMath.hopIbu(hop({ alpha: 0, weightG: 100 }), 19, 1.061)).toBe(0);
  });

  it('un poids nul ne produit rien', () => {
    expect(BrewingMath.hopIbu(hop({ weightG: 0 }), 19, 1.061)).toBe(0);
  });

  it('un volume nul ne divise pas par zéro', () => {
    expect(BrewingMath.hopIbu(hop({}), 0, 1.061)).toBe(0);
  });

  it('l’amertume augmente avec la durée d’ébullition', () => {
    const court = BrewingMath.hopIbu(hop({ timeMin: 10 }), 19, 1.061);
    const long = BrewingMath.hopIbu(hop({ timeMin: 60 }), 19, 1.061);
    expect(long).toBeGreaterThan(court);
  });

  it('l’amertume baisse quand la densité monte — moût dense, extraction moindre', () => {
    const leger = BrewingMath.hopIbu(hop({}), 19, 1.04);
    const dense = BrewingMath.hopIbu(hop({}), 19, 1.09);
    expect(leger).toBeGreaterThan(dense);
  });

  it('le premier moût dépasse la même durée en ébullition, du bonus d’utilisation', () => {
    const fwh = BrewingMath.hopIbu(hop({ stage: 'firstWort' }), 19, 1.061, 60);
    const boil = BrewingMath.hopIbu(hop({ stage: 'boil', timeMin: 60 }), 19, 1.061, 60);
    expect(fwh).toBeGreaterThan(boil);
    expect(fwh / boil).toBeCloseTo(1.1, 1);
  });

  it('le whirlpool extrait d’autant plus qu’il est chaud', () => {
    const chaud = BrewingMath.hopIbu(hop({ stage: 'whirlpool', timeMin: 20, tempC: 95 }), 19, 1.061);
    const tiede = BrewingMath.hopIbu(hop({ stage: 'whirlpool', timeMin: 20, tempC: 70 }), 19, 1.061);
    expect(chaud).toBeGreaterThan(tiede * 2);
  });

  it('un whirlpool sans température retombe sur 80 °C, la valeur conventionnelle', () => {
    const implicite = BrewingMath.hopIbu(hop({ stage: 'whirlpool', timeMin: 20 }), 19, 1.061);
    const explicite = BrewingMath.hopIbu(
      hop({ stage: 'whirlpool', timeMin: 20, tempC: 80 }),
      19,
      1.061
    );
    expect(implicite).toBeCloseTo(explicite, 6);
  });

  it('le total est la somme des ajouts', () => {
    const hops = [hop({ timeMin: 60 }), hop({ timeMin: 15 }), hop({ stage: 'dryHop' })];
    const somme = hops.reduce((s, h) => s + BrewingMath.hopIbu(h, 19, 1.061, 60), 0);
    expect(BrewingMath.calculateTinsethIBU(hops, 19, 1.061, 60)).toBe(Math.round(somme));
  });
});

describe('Extrait et densités', () => {
  it('rend null si un seul potentiel manque — mieux vaut vide que crédible et faux', () => {
    expect(
      BrewingMath.calculateOg([grain(4), { ...grain(1), potentialPpg: undefined }], 19, 75)
    ).toBeNull();
  });

  it('rend null sur un volume nul ou une facture vide', () => {
    expect(BrewingMath.calculateOg([grain(4)], 0, 75)).toBeNull();
    expect(BrewingMath.calculateOg([], 19, 75)).toBeNull();
  });

  it('l’OG suit la masse de grain', () => {
    const petite = BrewingMath.calculateOg([grain(4)], 19, 75)!;
    const grande = BrewingMath.calculateOg([grain(6)], 19, 75)!;
    expect(grande).toBeGreaterThan(petite);
  });

  it('l’OG suit le rendement de l’installation', () => {
    expect(BrewingMath.calculateOg([grain(5)], 19, 85)!).toBeGreaterThan(
      BrewingMath.calculateOg([grain(5)], 19, 65)!
    );
  });

  it('⚠️ le rendement d’empâtage ne s’applique PAS au sucre — il se dissout entièrement', () => {
    const sucre: Fermentable = {
      name: 'Candi',
      weightKg: 1,
      kind: 'sucre',
      use: 'ebullition',
      potentialPpg: 46
    };
    const pointsSucre = BrewingMath.extractPoints([sucre], 30, 50)!;
    const pointsGrain = BrewingMath.extractPoints([{ ...sucre, kind: 'grain' }], 30, 50)!;
    expect(pointsSucre.total).toBeCloseTo(pointsGrain.total * 2, 1);
  });

  it('⚠️ le lactose ne fermente pas — compté comme du sucre, il faussait la FG des milk stouts', () => {
    const lactose: Fermentable = {
      name: 'Lactose',
      weightKg: 1,
      kind: 'lactose',
      use: 'ebullition',
      potentialPpg: 35,
      fermentabilityPct: 0
    };
    const pts = BrewingMath.extractPoints([grain(5), lactose], 30, 75)!;
    expect(pts.unfermentable).toBeGreaterThan(8);

    const sans = BrewingMath.extractPoints([grain(5)], 30, 75)!;
    const fgSans = BrewingMath.calculateFg(1 + sans.total / 1000, 75, sans.unfermentable)!;
    const fgAvec = BrewingMath.calculateFg(1 + pts.total / 1000, 75, pts.unfermentable)!;
    expect(fgAvec).toBeGreaterThan(fgSans);
  });

  it('sans non-fermentescible, la FG suit l’atténuation', () => {
    expect(BrewingMath.calculateFg(1.061, 80)).toBeCloseTo(1.012, 3);
  });

  it('une atténuation de 100 % ne descend pas sous 1.000', () => {
    expect(BrewingMath.calculateFg(1.05, 100)).toBeCloseTo(1.0, 3);
  });

  it('préserve une atténuation nulle et distingue une atténuation inconnue', () => {
    expect(BrewingMath.calculateFg(1.05, 0)).toBe(1.05);
    expect(BrewingMath.calculateFg(1.05, NaN)).toBeNull();
    expect(BrewingMath.calculateFg(1, 75)).toBeNull();
  });
});

describe('Atténuation selon le palier d’empâtage', () => {
  it('empâter bas donne un moût plus fermentescible', () => {
    expect(BrewingMath.attenuationForMashTemp(75, 63)).toBeGreaterThan(75);
  });

  it('empâter haut laisse du corps', () => {
    expect(BrewingMath.attenuationForMashTemp(75, 69)).toBeLessThan(75);
  });

  it('à 66.5 °C, rien ne bouge', () => {
    expect(BrewingMath.attenuationForMashTemp(75, 66.5)).toBeCloseTo(75, 1);
  });

  it('l’écart reste borné à ±8 points, même sur un palier absurde', () => {
    expect(BrewingMath.attenuationForMashTemp(75, 20)).toBeLessThanOrEqual(83);
    expect(BrewingMath.attenuationForMashTemp(75, 95)).toBeGreaterThanOrEqual(67);
  });

  it('reste dans les bornes physiques 45–95 %', () => {
    expect(BrewingMath.attenuationForMashTemp(92, 60)).toBeLessThanOrEqual(95);
    expect(BrewingMath.attenuationForMashTemp(46, 72)).toBeGreaterThanOrEqual(45);
  });
});

describe('Ensemencement', () => {
  it('⚠️ une lager réclame deux fois plus de cellules qu’une ale', () => {
    const lager = BrewingMath.pitchRate(1.05, 30, 'lager')!;
    const ale = BrewingMath.pitchRate(1.05, 30, 'ale')!;
    expect(lager.rate).toBe(1.5);
    expect(ale.rate).toBe(0.75);
    expect(lager.cellsNeededB).toBeCloseTo(ale.cellsNeededB * 2, -1);
  });

  it('une petite ale tient dans un sachet', () => {
    expect(BrewingMath.pitchRate(1.045, 20, 'ale')!.sachetsDry).toBe(1);
  });

  it('⚠️ une lager forte en réclame plusieurs — l’app en proposait toujours un seul', () => {
    expect(BrewingMath.pitchRate(1.07, 30, 'lager')!.sachetsDry).toBeGreaterThan(1);
  });

  it('au-delà de trois sachets, le pied de cuve est conseillé', () => {
    expect(BrewingMath.pitchRate(1.1, 30, 'lager')!.starterAdvised).toBe(true);
  });

  it('au-dessus de 1.075, le taux monte même en ale', () => {
    expect(BrewingMath.pitchRate(1.08, 20, 'ale')!.rate).toBe(1);
  });

  it('rend null sur des entrées absurdes plutôt que des cellules négatives', () => {
    expect(BrewingMath.pitchRate(1, 20, 'ale')).toBeNull();
    expect(BrewingMath.pitchRate(1.05, 0, 'ale')).toBeNull();
  });
});

describe('Rendement à haute densité', () => {
  it('ne corrige rien sous 1.065', () => {
    const r = BrewingMath.efficiencyAtGravity(75, 1.05);
    expect(r.lostPoints).toBe(0);
    expect(r.note).toBeNull();
  });

  it('une impériale perd du rendement, et on le DIT', () => {
    const r = BrewingMath.efficiencyAtGravity(75, 1.1);
    expect(r.lostPoints).toBeCloseTo(7, 0);
    expect(r.correctedPct).toBeLessThan(75);
    expect(r.note).toContain('%');
  });

  it('ne descend jamais sous 40 % de rendement', () => {
    expect(BrewingMath.efficiencyAtGravity(50, 1.2).correctedPct).toBeGreaterThanOrEqual(40);
  });
});

describe('Écart de rendement au brassin', () => {
  it('une OG sous la cible signale une efficacité réelle inférieure', () => {
    const g = BrewingMath.brewEfficiency(1.061, 1.05, 75)!;
    expect(g.deltaPoints).toBe(-11);
    expect(g.realEfficiencyPct).toBeLessThan(75);
    expect(g.verdict).toMatch(/concassage|rin[çc]age/i);
  });

  it('un écart de deux points ou moins vaut « dans la cible »', () => {
    expect(BrewingMath.brewEfficiency(1.061, 1.06, 75)!.verdict).toMatch(/dans la cible/i);
  });

  it('rend null sans mesure', () => {
    expect(BrewingMath.brewEfficiency(1.061, 0, 75)).toBeNull();
  });
});

describe('Impôt suisse sur la bière', () => {
  /** L'assiette est le volume CONDITIONNÉ, jamais le volume visé. */
  const batch = (o: Partial<Batch>): Batch => ({
    id: 'LOT-1',
    name: 'Test',
    style: 'Ale',
    volumeL: 30,
    brewDate: '15.03.2026',
    status: 'termine',
    ...o
  });

  it('taxe la production et applique la réduction petit brasseur', () => {
    const r = BrewingMath.calculateSwissBeerTax([
      batch({ volumePackagedL: 30 }),
      batch({ id: 'LOT-2', volumePackagedL: 25 })
    ]);
    expect(r.totalHectoliters).toBeCloseTo(0.55, 2);
    expect(r.taxDueCHF).toBeGreaterThan(0);
    expect(r.reductionPct).toBe(40);
  });

  it('⚠️ ignore les brassins annulés — ils ne sont jamais sortis de la cuve', () => {
    const avec = BrewingMath.calculateSwissBeerTax([
      batch({ volumePackagedL: 30 }),
      batch({ id: 'LOT-2', volumePackagedL: 30, status: 'annule' })
    ]);
    const sans = BrewingMath.calculateSwissBeerTax([batch({ volumePackagedL: 30 })]);
    expect(avec.totalHectoliters).toBeCloseTo(sans.totalHectoliters, 4);
  });

  it('ne taxe rien sans production', () => {
    expect(BrewingMath.calculateSwissBeerTax([]).taxDueCHF).toBe(0);
  });
});

describe('Volumes d’eau', () => {
  /*
   * ⚠️ IL Y AVAIT DEUX MODÈLES CONCURRENTS. L'assistant de recette posait
   * `empâtage = grain × 3` et `rinçage = volume × 1.25 − empâtage`, SANS
   * l'absorption du grain ; `scaleRecipe` avait le vrai modèle. Sur 6 kg pour
   * 30 L, l'écart atteignait 4.5 L — et comme les sels se dosent au litre, une
   * erreur de volume est une erreur de concentration.
   */
  it('compte l’absorption du grain, l’évaporation, le volume mort et la rétraction', () => {
    const v = BrewingMath.waterVolumes(6, 30);
    expect(v.grainAbsorptionL).toBeCloseTo(5.8, 1); // 6 × 0.96
    expect(v.preBoilVolumeL).toBe(36.2); // 30 + 3 + 2 + 1.2
    expect(v.mashWaterL).toBe(25.2); // 6 × 4.2, l'épaisseur d'un monocuve
    expect(v.spargeWaterL).toBe(16.8); // 36.2 − (25.2 − 5.8)
    expect(v.mashWaterL).toBeGreaterThan(v.spargeWaterL);
  });

  it('⚠️ l’ancien calcul de l’assistant sous-estimait l’eau totale de 4.5 L', () => {
    const v = BrewingMath.waterVolumes(6, 30);
    const ancien = 18 + (30 * 1.25 - 18); // 37.5 L
    expect(v.mashWaterL + v.spargeWaterL).toBeCloseTo(42, 1);
    expect(v.mashWaterL + v.spargeWaterL - ancien).toBeCloseTo(4.5, 1);
  });

  /*
   * ⚠️ LA PANNE SIGNALÉE : « le sparge water me semble très haut, je mets
   * normal entre 10 et 15 L ». Sur le brassin type de la brasserie — 7.1 kg
   * pour 30 L sur le monocuve — l'ancien calcul sortait 21 L de rinçage, parce
   * qu'il jetait l'épaisseur de maische dès qu'elle donnait un empâtage plus
   * petit que le rinçage et coupait le moût en deux parts égales.
   */
  it('⚠️ le brassin type de la brasserie tombe dans les 10 à 15 L de rinçage', () => {
    const monocuve = { boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2 };
    const v = BrewingMath.waterVolumes(7.1, 30, monocuve, 'batch', 60, 120);
    expect(v.spargeWaterL).toBeGreaterThanOrEqual(10);
    expect(v.spargeWaterL).toBeLessThanOrEqual(15);
    expect(v.mashWaterL).toBe(29.8); // 7.1 × 4.2
  });

  /*
   * ⚠️ `boilOffRatePct` est documenté « %/h » dans son propre type, et le
   * calcul l'appliquait à plat : une ébullition de 90 minutes évaporait autant
   * qu'une de 45. Sur une NEIPA à 75 minutes, c'était un litre d'eau manquant.
   */
  it('⚠️ l’évaporation suit la DURÉE d’ébullition, pas un forfait', () => {
    const court = BrewingMath.waterVolumes(6, 30, undefined, 'batch', 30);
    const long = BrewingMath.waterVolumes(6, 30, undefined, 'batch', 90);
    expect(court.boilOffL).toBe(1.5); // 30 × 10 % × 0.5 h
    expect(long.boilOffL).toBe(4.5); // 30 × 10 % × 1.5 h
    expect(long.preBoilVolumeL - court.preBoilVolumeL).toBeCloseTo(3, 1);
  });

  /* Le houblon boit — 6 mL par gramme resté dans la cuve. Le cru n'y est pas. */
  it('⚠️ les houblons de cuve prennent de l’eau, le houblonnage à cru non', () => {
    const sans = BrewingMath.waterVolumes(6, 30, undefined, 'batch', 60, 0);
    const avec = BrewingMath.waterVolumes(6, 30, undefined, 'batch', 60, 300);
    expect(avec.hopLossL).toBe(1.8);
    expect(avec.preBoilVolumeL - sans.preBoilVolumeL).toBeCloseTo(1.8, 1);
    expect(kettleHopGrams([
      { weightG: 50, stage: 'boil' },
      { weightG: 80, stage: 'whirlpool' },
      { weightG: 200, stage: 'dryHop' }
    ])).toBe(130);
  });

  /*
   * ⚠️ L'épaisseur commande, même quand elle donne un empâtage plus petit que
   * le rinçage : c'est une consigne du brasseur, pas une préférence.
   */
  it('⚠️ une maische épaisse reste épaisse, et le rinçage porte le reste', () => {
    const v = BrewingMath.waterVolumes(6, 30, { mashRatioLPerKg: 2.6 });
    expect(v.mashWaterL).toBe(15.6);
    expect(v.spargeWaterL).toBeGreaterThan(v.mashWaterL);
    // L'eau totale reste juste : premier jus + rinçage = moût à collecter.
    expect(v.mashWaterL - v.grainAbsorptionL + v.spargeWaterL).toBeCloseTo(
      v.preBoilVolumeL,
      1
    );
  });

  /*
   * ⚠️ Sans rinçage — BIAB, empâtage à volume plein — toute l'eau passe par la
   * maische. Le rinçage ne vaut pas seulement zéro : il change le VOLUME de
   * l'empâtage, donc la dose de tous les sels et de l'acide.
   */
  it('⚠️ sans rinçage, toute l’eau va à l’empâtage', () => {
    const v = BrewingMath.waterVolumes(6, 30, undefined, 'none');
    expect(v.spargeWaterL).toBe(0);
    expect(v.mashWaterL).toBeCloseTo(42, 1); // 36.2 + 5.76
  });

  it('suit le profil de l’installation', () => {
    const v = BrewingMath.waterVolumes(6, 30, {
      mashRatioLPerKg: 4,
      boilOffRatePct: 15,
      deadSpaceL: 1
    });
    expect(v.mashWaterL).toBe(24); // 6 × 4
    expect(v.preBoilVolumeL).toBe(36.7); // 30 + 4.5 + 1 + 1.2
  });

  it('ne rend rien sans grain ni volume, au lieu de diviser dans le vide', () => {
    expect(BrewingMath.waterVolumes(0, 30).mashWaterL).toBe(0);
    expect(BrewingMath.waterVolumes(6, 0).spargeWaterL).toBe(0);
  });

  it('ne rend jamais un rinçage négatif', () => {
    // Un empâtage très mince porte à lui seul tout le moût à collecter :
    // on retombe alors sur le cas « aucun rinçage », drêches comprises.
    const v = BrewingMath.waterVolumes(2, 30, { mashRatioLPerKg: 30 });
    expect(v.spargeWaterL).toBe(0);
    expect(v.mashWaterL).toBeCloseTo(v.preBoilVolumeL + v.grainAbsorptionL, 1);
  });
});
