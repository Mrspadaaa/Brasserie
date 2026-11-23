import { describe, it, expect } from 'vitest';
import { RecipeTextParser } from '../../src/services/recipeParser';

/**
 * Lecture d'une recette collée.
 *
 * La règle tenue ici : **ce qui n'est pas lu reste vide et se dit**. Un parseur
 * qui invente un alpha à 5 % produit un IBU faux que personne ne remet en
 * question ; un champ vide assorti d'un avertissement, si.
 */

const BYO = `New England IPA
(5 gallons/19 L, all-grain)

OG = 1.061 FG = 1.012 IBU = 56 SRM = 5 ABV = 6.5%

Ingredients
9 lbs. (4.1 kg) US 2-row malt
12 oz. (340 g) flaked oats
12.9 AAU Amarillo hops (first wort hop) (1.5 oz./43 g at 8.6% alpha acids)
1 oz. (28 g) Citra hops (hop stand)
3 oz. (85 g) Citra hops (dry hop)
GigaYeast GY054 (Vermont IPA) yeast
Step by Step
Mash in all the grains at 152 °F (67 °C) and hold this temperature for 60 minutes.
Boil the wort for 75 minutes.`;

describe('Recette américaine', () => {
  const r = RecipeTextParser.parse(BYO);

  it('prend le métrique donné entre parenthèses', () => {
    expect(r.volumeL).toBe(19);
    expect(r.malts[0].weightKg).toBeCloseTo(4.1, 3);
    expect(r.hops[0].weightG).toBe(43);
  });

  it('nettoie les restes d’unité dans les noms', () => {
    expect(r.malts.map((m) => m.name)).toEqual(['US 2-row', 'flaked oats']);
    expect(r.hops.map((h) => h.name)).toEqual(['Amarillo', 'Citra', 'Citra']);
  });

  it('range chaque houblon à son étape', () => {
    expect(r.hops.map((h) => h.stage)).toEqual(['firstWort', 'whirlpool', 'dryHop']);
  });

  it('laisse l’alpha à zéro quand la recette ne le donne pas', () => {
    expect(r.hops[0].alpha).toBe(8.6);
    expect(r.hops[1].alpha).toBe(0);
    // Un seul avertissement pour tous les houblons concernés, et émis APRÈS le
    // report d'alpha d'une ligne à l'autre : sinon un houblon dont la recette
    // donne l'alpha plus haut se faisait signaler à tort.
    expect(r.warnings.some((w) => /^Alpha absent : .*Citra/.test(w))).toBe(true);
  });

  it('convertit l’empâtage en degrés Celsius', () => {
    expect(r.mashSteps[0].tempC).toBe(67);
    expect(r.mashSteps[0].durationMin).toBe(60);
  });

  it('lit les densités et la durée d’ébullition', () => {
    expect(r.ogTarget).toBeCloseTo(1.061, 4);
    expect(r.fgTarget).toBeCloseTo(1.012, 4);
    expect(r.ibuTarget).toBe(56);
    expect(r.abvTarget).toBeCloseTo(6.5, 2);
    expect(r.boilMin).toBe(75);
  });

  it('convertit le SRM annoncé en EBC', () => {
    // 5 SRM ≈ 9.85 EBC (×1.97).
    expect(r.colorEbc).toBeGreaterThan(9);
    expect(r.colorEbc).toBeLessThan(11);
  });

  it('reconnaît la levure sans répéter le laboratoire dans son nom', () => {
    expect(r.yeast?.lab).toBe('GigaYeast');
    expect(r.yeast?.strain).toBe('GY054');
    expect(r.yeast?.name).not.toMatch(/GigaYeast/);
    expect(r.yeast?.name).not.toMatch(/GY054/);
  });

  it('recopie le déroulé sans le réécrire', () => {
    expect(r.instructions).toContain('Boil the wort for 75 minutes.');
    expect(r.instructions).not.toContain('Ingredients');
  });
});

describe('Recette métrique francophone', () => {
  const r = RecipeTextParser.parse(`Milk Stout de la Sarine
30 L

DI = 1.058 DF = 1.020 IBU = 28

Ingrédients
5 kg Malt Pilsner
800 g Malt chocolat
500 g Lactose
40 g Magnum (60 min) à 12% AA
SafAle S-04
Déroulé
Empâtage à 68 °C pendant 75 minutes.
Ébullition 60 minutes.`);

  it('lit les kilos et les grammes tels quels', () => {
    expect(r.volumeL).toBe(30);
    expect(r.malts.find((m) => /Pilsner/.test(m.name))?.weightKg).toBe(5);
    expect(r.malts.find((m) => /chocolat/i.test(m.name))?.weightKg).toBeCloseTo(0.8, 3);
  });

  it('lit le houblon avec sa durée et son alpha', () => {
    expect(r.hops).toHaveLength(1);
    expect(r.hops[0].weightG).toBe(40);
    expect(r.hops[0].timeMin).toBe(60);
    expect(r.hops[0].alpha).toBe(12);
    expect(r.hops[0].stage).toBe('boil');
  });

  it('lit le palier d’empâtage en Celsius sans conversion', () => {
    expect(r.mashSteps[0].tempC).toBe(68);
    expect(r.mashSteps[0].durationMin).toBe(75);
  });

  it('trouve la levure sans laboratoire annoncé', () => {
    expect(r.yeast?.strain ?? r.yeast?.name).toMatch(/S-04/);
  });
});

describe('Texte qu’on ne sait pas lire', () => {
  const r = RecipeTextParser.parse('Une bière bien houblonnée, faite comme d’habitude.');

  it('ne remplit rien et le dit', () => {
    expect(r.malts).toHaveLength(0);
    expect(r.hops).toHaveLength(0);
    expect(r.yeast).toBeNull();
    expect(r.volumeL).toBeNull();
  });

  it('signale chaque manque plutôt que de deviner', () => {
    expect(r.warnings).toContain('Aucun malt reconnu.');
    expect(r.warnings).toContain('Aucun houblon reconnu.');
    expect(r.warnings).toContain('Aucune levure reconnue.');
    expect(r.warnings).toContain('Volume introuvable — à saisir à la main.');
  });

  it('conserve le texte d’origine pour que rien ne se perde', () => {
    expect(r.rawText).toContain('houblonnée');
  });
});

describe('Texte vide', () => {
  it('ne jette pas', () => {
    const r = RecipeTextParser.parse('');
    expect(r.name).toBeFalsy();
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

/**
 * La NEIPA de Brew Your Own, collée telle quelle depuis le site.
 *
 * Gaëtan : « j’ai vraiment l’impression qu’il manque des info ». Il avait
 * raison : la lecture rendait bien les INGRÉDIENTS et perdait presque tout le
 * PROCÉDÉ. Chaque test ci-dessous fixe une de ces pertes.
 */
describe('NEIPA de BYO — ce que la lecture perdait', () => {
  const NEIPA = "New England IPA\n\n(5 gallons/19 L, all-grain)\n\nOG = 1.061 FG = 1.012 IBU = 56 SRM = 5 ABV = 6.5%\n\nIngredients\n\n9 lbs. (4.1 kg) US 2-row malt\n\n2 lbs. (0.91 kg) UK Golden Promise malt\n\n1 lb. (0.45 kg) flaked wheat\n\n12 oz. (340 g) flaked oats\n\n12.9 AAU Amarillo® hops (first wort hop) (1.5 oz./43 g at 8.6% alpha acids)\n\n1.5 oz. (43 g) Amarillo® hops (0 min.)\n\n1 oz. (28 g) Citra® hops (hop stand)\n\n1 oz. (28 g) GalaxyTM hops (hop stand)\n\n1 oz. (28 g) Mosaic® hops (hop stand)\n\n3 oz. (85 g) Citra® hops (dry hop)\n\n1.5 oz. (43 g) GalaxyTM hops (dry hop)\n\n1.5 oz. (43 g) Mosaic® hops (dry hop)\n\nGigaYeast GY054 (Vermont IPA) or White Labs WLP095 (Burlington Ale) yeast\n\n3/4 cup corn sugar (if priming)\n\nStep by Step\n\nOn brew day, prepare your ingredients; mill the grains, measure your hops, and prepare your water. This recipe uses reverse osmosis (RO) water. Add 1/4 tsp 10% phosphoric acid per 5 gallons (19 L) of brewing water, or until water measures pH 5.5 at room temperature. Add 3/4 tsp. calcium chloride (CaCl2) and 1/4 tsp. calcium sulfate (CaSO4) to the mash.\n\nOn brew day, mash in all the grains at 152 °F (67 °C) in 5 gallons (19 L) of water, and hold this temperature for 60 minutes. Raise the temperature by infusion or direct heating to 168 °F (76 °C) to mashout. Recirculate for 15 minutes. Fly sparge with 168 °F (76 °C) water until 6.5 gallons (25 L) of wort is collected.\n\nBoil the wort for 75 minutes, adding the hops at times indicated in the recipe. The first wort hops are added to the kettle just before lautering begins. The 0 minute hops get added right after the heat is turned off. Stir the wort gently and allow to cool to 180 °F (82 °C) then add the hop stand hops. Allow to stand for 20 minutes then chill to 64 °F (18 °C) and rack to the fermenter.\n\nOxygenate, then pitch the yeast. Start fermentation at 64 °F (18 °C), allowing temperature to rise naturally as fermentation progresses. Mix the dry hops and divide into three equal portions. The first portion gets added after two days of active fermentation. The second portion gets added at the end of fermentation.\n\nThe third portion gets added three days after fermentation ends. Allow each dry hop addition to be in contact with the beer for two to three days, then remove.\n\nRack the beer, prime and bottle condition, or keg and force carbonate to 2.5 volumes. Do not filter or fine the beer\n";
  const r = RecipeTextParser.parse(NEIPA);

  it('lit l’en-tête et préfère les valeurs métriques', () => {
    expect(r.name).toBe('New England IPA');
    expect(r.volumeL).toBe(19);
    expect(r.ogTarget).toBe(1.061);
    expect(r.ibuTarget).toBe(56);
    expect(r.boilMin).toBe(75);
    // SRM 5 annoncé ➔ EBC, la recette ne donne pas d’EBC.
    expect(r.colorEbc).toBeCloseTo(9.9, 1);
  });

  /**
   * ⚠️ Le hop stand vivait dans le DÉROULÉ, pas sur la ligne d’ingrédient :
   * « cool to 180 °F (82 °C) then add the hop stand hops. Allow to stand for
   * 20 minutes ». Sans température ni durée, l’IBU du whirlpool ne se calcule
   * pas — et sur une NEIPA, c’est la moitié de l’arôme.
   */
  it('récupère la température et la durée du hop stand dans le déroulé', () => {
    const stand = r.hops.filter((h) => h.stage === 'whirlpool');
    expect(stand).toHaveLength(3);
    stand.forEach((h) => {
      expect(h.tempC).toBe(82);
      expect(h.timeMin).toBe(20);
    });
  });

  /**
   * ⚠️ « 1.5 oz Amarillo at 8.6% alpha » puis « 1.5 oz Amarillo (0 min.) » :
   * c’est le même sachet. Le second ajout repartait à zéro d’amertume.
   */
  it('reporte l’alpha d’un houblon sur ses autres ajouts', () => {
    const amarillo = r.hops.filter((h) => h.name === 'Amarillo');
    expect(amarillo).toHaveLength(2);
    amarillo.forEach((h) => expect(h.alpha).toBe(8.6));
  });

  it('ne signale que les houblons dont l’alpha manque vraiment', () => {
    const alphaWarning = r.warnings.find((w) => w.startsWith('Alpha absent'));
    expect(alphaWarning).toBeDefined();
    expect(alphaWarning).not.toContain('Amarillo');
    expect(alphaWarning).toContain('Citra');
  });

  /** ⚠️ Le ™ d’un PDF se recopie en deux lettres : « GalaxyTM » ne se
   *  rapprochait plus jamais du « Galaxy » du stock. */
  it('nettoie le ™ aplati en lettres ordinaires', () => {
    expect(r.hops.map((h) => h.name)).toContain('Galaxy');
    expect(r.hops.map((h) => h.name)).not.toContain('GalaxyTM');
  });

  /** ⚠️ « 3⁄4 cup corn sugar » disparaissait SANS un mot : ni masse en
   *  grammes, ni volume en mL, donc la ligne était abandonnée en silence. */
  it('garde le sucre de réamorçage dans son unité d’origine', () => {
    const sucre = r.adjuncts.find((a) => /corn sugar/i.test(a.name));
    expect(sucre).toBeDefined();
    expect(sucre.amount).toBeCloseTo(0.75, 2);
    expect(sucre.unit).toBe('cup');
    // Surtout PAS de conversion en grammes : la densité de tassement est inconnue.
  });

  it('lit les volumes du déroulé sans les confondre avec le brassin', () => {
    expect(r.mashWaterL).toBe(19);
    expect(r.preBoilL).toBe(25);
    expect(r.volumeL).toBe(19);
  });

  it('retient la carbonatation visée', () => {
    expect(r.carboVolumes).toBe(2.5);
  });

  /** ⚠️ Le point de « tsp. » n’est pas une fin de phrase : la note d’eau
   *  perdait sa dose de chlorure de calcium. */
  it('recopie le traitement d’eau en entier, dose comprise', () => {
    expect(r.waterNote).toContain('reverse osmosis');
    expect(r.waterNote).toContain('phosphoric acid');
    expect(r.waterNote).toContain('Add 3/4 tsp. calcium chloride');
    expect(r.waterNote).toContain('calcium sulfate');
  });

  it('recopie le calendrier de houblonnage à cru et prévient qu’il reste à fixer', () => {
    expect(r.dryHopNote).toContain('three equal portions');
    expect(r.warnings.some((w) => /houblonnage à cru/.test(w))).toBe(true);
  });

  /** ⚠️ Dix minutes de mashout sortaient de nulle part. */
  it('n’invente plus de durée de mashout', () => {
    const mashout = r.mashSteps.find((s) => s.name === 'Mashout');
    expect(mashout.tempC).toBe(76);
    expect(mashout.durationMin).toBe(0);
    expect(r.warnings).toContain('Durée du mashout absente — à saisir.');
  });

  it('lit la levure et garde l’équivalence en note', () => {
    expect(r.yeast.lab).toBe('GigaYeast');
    expect(r.yeast.strain).toBe('GY054');
    expect(r.yeast.name).toBe('Vermont IPA');
    expect(r.yeast.notes).toContain('WLP095');
  });

  it('lit distinctement l’eau d’empâtage et l’eau de rinçage sans les intervertir', () => {
    const text = `
      Recette de Test
      Volume du brassin : 20 L
      Densité initiale : 1.050

      Ingrédients :
      - 4 kg Malt Pilsen
      - 20 g Saaz (60 min)
      - SafLager W-34/70

      Instructions :
      Empâtage : 18 L d'eau à 65 °C pendant 60 min.
      Rinçage : 14 L d'eau à 78 °C.
      Faire bouillir 60 minutes.
    `;
    const res = RecipeTextParser.parse(text);
    expect(res.mashWaterL).toBe(18);
    expect(res.spargeWaterL).toBe(14);
  });
});
