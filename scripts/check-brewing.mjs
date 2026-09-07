import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/**
 * Contrôle des calculs de brassage.
 *
 * Chaque cas ci-dessous fixe un comportement qui a MORDU dans la vraie vie, ou
 * qui aurait produit un chiffre faux sur lequel on aurait brassé :
 *
 *   - le houblonnage à cru comptait comme une ébullition de 60 minutes ;
 *   - la couleur et la densité prédite se calculaient sur des factures de grain
 *     incomplètes, donnant un chiffre crédible et faux ;
 *   - les recettes américaines n'étaient pas converties.
 *
 * Un chiffre absent est un résultat valide. Un chiffre inventé n'en est pas un.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const require_ = createRequire(join(ROOT, 'package.json'));
const { buildSync } = require_('esbuild');

const OUT = join(ROOT, 'node_modules', '.check-brewing');
mkdirSync(OUT, { recursive: true });

/** Bundle chaque entrée avec ses dépendances TypeScript, comme le build applicatif. */
function compile(name, relPath) {
  const file = join(OUT, name + '.mjs');
  buildSync({ entryPoints: [join(ROOT, relPath)], outfile: file, bundle: true, platform: 'node', format: 'esm', target: 'node22', logLevel: 'silent' });
  return file;
}

compile('types', 'src/types/index.ts');
compile('units', 'src/services/units.ts');
compile('hopStage', 'src/domain/hopStage.ts');
compile('beerColor', 'src/domain/beerColor.ts');
compile('brewingMath', 'src/services/brewingMath.ts');
compile('recipeParser', 'src/services/recipeParser.ts');

const { BrewingMath } = await import(`file:///${join(OUT, 'brewingMath.mjs').split('\\').join('/')}`);
const { computeBeerColor } = await import(`file:///${join(OUT, 'beerColor.mjs').split('\\').join('/')}`);
const { Units } = await import(`file:///${join(OUT, 'units.mjs').split('\\').join('/')}`);
const { normalizeHop, stageFromLegacy } = await import(
  `file:///${join(OUT, 'hopStage.mjs').split('\\').join('/')}`
);
const { RecipeTextParser } = await import(
  `file:///${join(OUT, 'recipeParser.mjs').split('\\').join('/')}`
);

let failed = 0;
const check = (label, actual, expected, tolerance = 0) => {
  const ok =
    typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(actual - expected) <= tolerance
      : JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed += 1;
    console.log(`   ❌ ${label}\n      attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
  }
  return ok;
};

// --- 1. Amertume par étape ---------------------------------------------------
const VOL = 19;
const OG = 1.061;

check(
  'houblonnage à cru : ZÉRO IBU',
  BrewingMath.hopIbu({ weightG: 170, alpha: 12, stage: 'dryHop' }, VOL, OG),
  0
);

const boil60 = BrewingMath.hopIbu(
  { weightG: 43, alpha: 8.6, stage: 'boil', timeMin: 60 },
  VOL,
  OG,
  75
);
check('ébullition 60 min : amertume non nulle', boil60 > 10, true);

const fwh = BrewingMath.hopIbu({ weightG: 43, alpha: 8.6, stage: 'firstWort' }, VOL, OG, 75);
check('premier moût : ~10 % de plus que la même durée en ébullition', fwh > boil60, true);

const wpHot = BrewingMath.hopIbu(
  { weightG: 28, alpha: 12, stage: 'whirlpool', timeMin: 20, tempC: 95 },
  VOL,
  OG
);
const wpCool = BrewingMath.hopIbu(
  { weightG: 28, alpha: 12, stage: 'whirlpool', timeMin: 20, tempC: 70 },
  VOL,
  OG
);
check('whirlpool : plus chaud extrait plus d’amertume', wpHot > wpCool * 2, true);

check(
  'alpha inconnu (0 %) : aucune amertume attribuée',
  BrewingMath.hopIbu({ weightG: 100, alpha: 0, stage: 'boil', timeMin: 60 }, VOL, OG),
  0
);

// --- 2. Couleur --------------------------------------------------------------
check(
  'couleur incalculable si un malt n’a pas d’EBC',
  computeBeerColor([{ name: 'A', weightKg: 4, colorEbc: 5 }, { name: 'B', weightKg: 1 }], 19),
  null
);

const neipaColor = computeBeerColor(
  [
    { name: '2-row', weightKg: 4.1, colorEbc: 4 },
    { name: 'Golden Promise', weightKg: 0.91, colorEbc: 6 },
    { name: 'flaked wheat', weightKg: 0.45, colorEbc: 4 },
    { name: 'flaked oats', weightKg: 0.34, colorEbc: 2 }
  ],
  19
);
check('NEIPA : couleur paille ou dorée', ['straw', 'gold'].includes(neipaColor?.band), true);

const stoutColor = computeBeerColor(
  [
    { name: 'Maris Otter', weightKg: 5, colorEbc: 6 },
    { name: 'Röstgerste', weightKg: 0.5, colorEbc: 1300 }
  ],
  30
);
check('Stout : couleur noire', stoutColor?.band, 'stout');

// --- 3. Densité prédite ------------------------------------------------------
check(
  'OG incalculable si un potentiel manque',
  BrewingMath.calculateOg([{ weightKg: 4, potentialPpg: 37 }, { weightKg: 1 }], 19, 75),
  null
);

const og = BrewingMath.calculateOg(
  [
    { weightKg: 4.1, potentialPpg: 37 },
    { weightKg: 0.91, potentialPpg: 38 },
    { weightKg: 0.45, potentialPpg: 34 },
    { weightKg: 0.34, potentialPpg: 33 }
  ],
  19,
  72
);
check('OG NEIPA prédite dans la fourchette annoncée', og > 1.05 && og < 1.075, true);

check('FG depuis l’atténuation', BrewingMath.calculateFg(1.061, 80), 1.012, 0.001);

// --- 4. Écart de rendement ---------------------------------------------------
const gap = BrewingMath.brewEfficiency(1.061, 1.05, 75);
check('OG sous la cible : efficacité réelle inférieure', gap.realEfficiencyPct < 75, true);
check('écart en points, arrondi', gap.deltaPoints, -11);

// --- 5. Unités américaines ---------------------------------------------------
check('9 lb en kg', Units.convert(9, 'lb', 'kg'), 4.08, 0.01);
check('12 oz en g', Units.convert(12, 'oz', 'g'), 340.2, 0.5);
check('5 gal en L', Units.convert(5, 'gal', 'L'), 18.93, 0.02);
check('152 °F en °C', Units.fToC(152), 66.7, 0.1);
check('lbs (pluriel) reconnu', Units.convert(1, 'lbs', 'g'), 453.6, 0.5);

// --- 6. Anciens enregistrements ----------------------------------------------
check('« Dry hop #2 » ➔ houblonnage à cru', stageFromLegacy('Dry hop #2'), 'dryHop');
check('« Whirlpool 80C » ➔ whirlpool', stageFromLegacy('Whirlpool 80C'), 'whirlpool');
check('« Boil » ➔ ébullition', stageFromLegacy('Boil'), 'boil');
const migrated = normalizeHop({ name: 'Citra', alpha: 12, weightG: 60, timeMin: 0, step: 'Dry hop #2' });
check('migration : le rang devient un jour', migrated.dayOffset, 3);
check('migration : plus de durée d’ébullition sur un dry hop', migrated.timeMin, undefined);

// --- 7. Import d'une recette américaine --------------------------------------
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

const parsed = RecipeTextParser.parse(BYO);
check('import : volume métrique préféré', parsed.volumeL, 19);
check('import : durée d’ébullition', parsed.boilMin, 75);
check('import : 2 malts', parsed.malts.length, 2);
check('import : masse métrique des parenthèses', parsed.malts[0].weightKg, 4.1, 0.001);
check('import : nom de malt sans reste d’unité', parsed.malts[0].name, 'US 2-row');
check('import : 3 houblons', parsed.hops.length, 3);
check('import : étapes distinctes', parsed.hops.map((h) => h.stage), [
  'firstWort',
  'whirlpool',
  'dryHop'
]);
check('import : alpha lu quand il est donné', parsed.hops[0].alpha, 8.6);
check('import : alpha absent reste à 0, jamais deviné', parsed.hops[1].alpha, 0);
check('import : levure reconnue', parsed.yeast?.strain, 'GY054');
check('import : empâtage converti en °C', parsed.mashSteps[0]?.tempC, 67);
check('import : durée d’empâtage', parsed.mashSteps[0]?.durationMin, 60);
check('import : instructions conservées', parsed.instructions.length > 50, true);

// --- 8. Fermentescibles : le lactose ne fermente pas -------------------------
const GRIST = [
  { name: 'Maris Otter', weightKg: 5, potentialPpg: 38, kind: 'grain' },
  { name: 'Röstgerste', weightKg: 0.5, potentialPpg: 25, kind: 'grain' }
];
const LACTOSE = { name: 'Lactose', weightKg: 1, potentialPpg: 35, kind: 'lactose', fermentabilityPct: 0 };

const sans = BrewingMath.calculateOg(GRIST, 30, 75);
const avec = BrewingMath.calculateOg([...GRIST, LACTOSE], 30, 75);
check('le lactose remonte la densité initiale', avec > sans, true);

const ptsSans = BrewingMath.extractPoints(GRIST, 30, 75);
const ptsAvec = BrewingMath.extractPoints([...GRIST, LACTOSE], 30, 75);
check('sans lactose, rien d’infermentescible', ptsSans.unfermentable, 0, 0.2);
check('le lactose est compté entièrement infermentescible', ptsAvec.unfermentable > 8, true);

const fgSans = BrewingMath.calculateFg(sans, 75, ptsSans.unfermentable);
const fgAvec = BrewingMath.calculateFg(avec, 75, ptsAvec.unfermentable);
check('une milk stout finit PLUS HAUT qu’une stout sans lactose', fgAvec > fgSans + 0.005, true);

// Le bug d'origine : traiter le lactose comme du sucre donnait une FG trop basse.
const fgBuggy = BrewingMath.calculateFg(avec, 75, 0);
check('l’ancien calcul sous-estimait bien la densité finale', fgAvec > fgBuggy, true);

// Le sucre échappe au rendement d'empâtage — il se dissout entièrement.
const sucre = [{ name: 'Candi', weightKg: 1, potentialPpg: 46, kind: 'sucre' }];
const ptsSucre = BrewingMath.extractPoints(sucre, 30, 50);
const ptsGrain = BrewingMath.extractPoints(
  [{ name: 'X', weightKg: 1, potentialPpg: 46, kind: 'grain' }],
  30,
  50
);
check('le rendement d’empâtage ne s’applique pas au sucre', ptsSucre.total > ptsGrain.total * 1.9, true);
check('le sucre est entièrement fermentescible', ptsSucre.unfermentable, 0, 0.2);

// --- 9. Atténuation selon le palier d'empâtage -------------------------------
check('empâter à 63 °C atténue plus', BrewingMath.attenuationForMashTemp(75, 63) > 75, true);
check('empâter à 69 °C atténue moins', BrewingMath.attenuationForMashTemp(75, 69) < 75, true);
check('à 66.5 °C, rien ne change', BrewingMath.attenuationForMashTemp(75, 66.5), 75, 0.1);
check('l’écart reste borné', BrewingMath.attenuationForMashTemp(75, 50) <= 83, true);

// --- 10. Ensemencement --------------------------------------------------------
const aleLight = BrewingMath.pitchRate(1.045, 20, 'ale');
check('une petite ale tient dans un sachet', aleLight.sachetsDry, 1);

const lagerFort = BrewingMath.pitchRate(1.07, 30, 'lager');
check('une lager à 1.070 dans 30 L demande plus d’un sachet', lagerFort.sachetsDry > 1, true);
check('une lager demande deux fois plus qu’une ale', lagerFort.rate, 1.5);
check(
  'au-delà de trois sachets, le pied de cuve est conseillé',
  BrewingMath.pitchRate(1.1, 30, 'lager').starterAdvised,
  true
);
check(
  'à densité et volume égaux, la lager demande plus que l’ale',
  BrewingMath.pitchRate(1.05, 30, 'lager').cellsNeededB >
    BrewingMath.pitchRate(1.05, 30, 'ale').cellsNeededB,
  true
);

// --- 11. Rendement à haute densité -------------------------------------------
check('sous 1.065, aucune correction', BrewingMath.efficiencyAtGravity(75, 1.05).lostPoints, 0);
check('sous 1.065, aucun avertissement', BrewingMath.efficiencyAtGravity(75, 1.05).note, null);
const imperiale = BrewingMath.efficiencyAtGravity(75, 1.1);
check('une impériale perd du rendement', imperiale.lostPoints, 7, 0.5);
check('le rendement corrigé est annoncé', imperiale.correctedPct, 68, 0.5);

// --- Verdict -----------------------------------------------------------------
if (resolve(OUT) !== resolve(ROOT, 'node_modules', '.check-brewing')) throw Error('Unexpected check output path.');
rmSync(OUT, { recursive: true, force: true });

if (failed > 0) {
  console.log(`\n⛔ ${failed} contrôle(s) de brassage en échec.`);
  process.exit(1);
}
console.log('✅ Calculs de brassage vérifiés : amertume par étape, couleur, densité, unités US, import.');
