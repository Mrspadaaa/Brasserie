import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Contrôle de la chimie de l'eau.
 *
 * Chaque cas fixe un chiffre qu'un brasseur peut vérifier à la main, ou un
 * comportement qui a manqué dans une version précédente : alcalinité résiduelle
 * absente, acide dosé sur le volume total au lieu de l'empâtage seul, additif
 * impossible à écarter.
 *
 * ⚠️ CE FICHIER A DÉJÀ MENTI. Il figeait `AR = alcalinité − Ca/3.5 − Mg/7` comme
 * valeur attendue — la formule de Kolbach appliquée à des ppm d'ion au lieu de
 * duretés en CaCO₃. Tout était vert pendant que l'acide était surdosé d'un
 * tiers. Un contrôle ne vaut que par le calcul qu'on peut refaire à la main :
 * chaque nombre attendu ci-dessous porte donc son calcul en commentaire.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const require_ = createRequire(join(ROOT, 'package.json'));
const { buildSync } = require_('esbuild');

const OUT = join(ROOT, 'node_modules', '.check-water');
mkdirSync(OUT, { recursive: true });

function compile(name, relPath, rewrites = {}) {
  const file = join(OUT, `${name}.mjs`);
  buildSync({ entryPoints: [join(ROOT, relPath)], bundle: true, platform: 'node', format: 'esm', outfile: file });
  return file;
}

compile('types', 'src/types/index.ts');
compile('water', 'src/domain/water/index.ts');
compile('waterStyles', 'src/domain/waterStyles.ts', { '../types': './types.mjs' });

const load = (name) => import(`file:///${join(OUT, name).split('\\').join('/')}`);
const W = await load('water.mjs');
const S = await load('waterStyles.mjs');

let failed = 0;
const check = (label, actual, expected, tolerance = 0) => {
  const ok =
    typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(actual - expected) <= tolerance
      : JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed += 1;
    console.log(
      `   ❌ ${label}\n      attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`
    );
  }
};

const FRIBOURG = { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 };
const OSMOSEE = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };

/** Le solveur tel que l'atelier l'appelle. */
const solve = (code, start, mashL, spargeL, ebc, disabled = []) => {
  const style = S.styleByCode(code);
  const ratio = (style.ratio.min + style.ratio.max) / 2;
  return W.solveSalts({
    start,
    target: W.rebalanceRatio(S.midpoint(style), ratio),
    ranges: style.ions,
    totalWaterL: mashL + spargeL,
    mashWaterL: mashL,
    disabled,
    targetRa: W.targetRaForColor(ebc),
    ratio
  });
};

// --- 1. Contributions ioniques, vérifiables à la main ------------------------
const gypse1g = W.ionsFromSalts({ gypse: 1 }, 1);
check('1 g de gypse dans 1 L : calcium', gypse1g.ca, 232.8, 0.1);
check('1 g de gypse dans 1 L : sulfate', gypse1g.so4, 557.7, 0.1);

const cacl2 = W.ionsFromSalts({ cacl2: 1 }, 1);
check('1 g de CaCl₂ dans 1 L : chlorure', cacl2.cl, 482.3, 0.1);

const dose20L = W.ionsFromSalts({ gypse: 4 }, 20);
check('4 g de gypse dans 20 L : sulfate', dose20L.so4, 111.5, 0.5);

// La craie ne se dissout qu'à moitié, et le CALCUL le compte : 400.4 × 0.5.
check('1 g de craie dans 1 L : la moitié seulement', W.ionsFromSalts({ caco3: 1 }, 1).ca, 200.2, 0.2);
// Ca(OH)₂ : 1 ÷ 74.09 = 13.50 mmol ➔ Ca 13.50 × 40.08 = 541 ppm.
check('1 g de chaux dans 1 L : calcium', W.saltIons('chaux').ca, 540.9, 0.5);

// --- 2. Alcalinité et alcalinité résiduelle ----------------------------------
// 250 × 50 ÷ 61 = 204.9
check('alcalinité de Fribourg en CaCO₃', W.alkalinityAsCaCO3(250), 204.9, 0.5);
/*
 * ⚠️ AR = 204.9 − 85/1.4 − 14/1.7 = 204.9 − 60.7 − 8.2 = 136.0
 *
 * Les diviseurs sont 1.4 et 1.7, pas 3.5 et 7 : Kolbach retranche les duretés
 * EXPRIMÉES EN CaCO₃ (Ca × 2.497, Mg × 4.118), et l'application travaille en
 * ppm d'ion. L'ancienne valeur figée ici, 178.6, sous-estimait la correction
 * d'un facteur 2.5 sur le calcium.
 */
check('AR de l’eau de Fribourg', W.residualAlkalinity(FRIBOURG), 136.0, 1);

const cut70 = W.dilute(FRIBOURG, 70);
check('couper à 70 % d’osmosée divise les ions par ~3.3', cut70.hco3, 75, 1);
// 61.5 − 25.5/1.4 − 4.2/1.7 = 61.5 − 18.2 − 2.5 = 40.8
check('AR après coupe à 70 %', W.residualAlkalinity(cut70), 40.8, 1);

check('l’osmosée pure a une AR nulle', W.residualAlkalinity(W.dilute(FRIBOURG, 100)), 0, 0.01);

// AR nette par gramme : la chaux est la plus efficace, et sans sodium.
check('AR nette du bicarbonate', W.netRaPerGramPerLitre('nahco3'), 595, 2);
check('AR nette de la chaux', W.netRaPerGramPerLitre('chaux'), 964, 2);
check('AR nette de la craie, solubilité comprise', W.netRaPerGramPerLitre('caco3'), 357, 2);

// --- 3. Fenêtre d'AR selon la couleur ----------------------------------------
// ⚠️ La fenêtre GLISSE, elle ne saute plus : un point d'EBC valait 60 ppm d'AR
// au passage d'une classe à l'autre — et 3.9 g de bicarbonate sur une Hazy IPA.
// On contrôle donc les quatre repères, et l'absence de marche entre eux.
check('bière pâle : AR visée négative', W.targetRaForColor(6).max, 0);
check('ambrée : AR visée à zéro', W.targetRaForColor(21).min, 0);
check('brune : AR visée à 60', W.targetRaForColor(45).min, 60);
check('stout : AR visée haute', W.targetRaForColor(80).min, 120);
let plusGrandSaut = 0;
for (let ebc = 1; ebc <= 120; ebc += 1) {
  plusGrandSaut = Math.max(
    plusGrandSaut,
    W.targetRaForColor(ebc).min - W.targetRaForColor(ebc - 1).min
  );
}
check('aucune marche : 1 EBC ne déplace pas la fenêtre de plus de 5 ppm', plusGrandSaut <= 5, true);
check('couleur inconnue : fenêtre large et annoncée', W.targetRaForColor(null).label, 'bière de couleur inconnue');

// --- 4. Acide : sur l'eau d'empâtage SEULE -----------------------------------
const acid20 = W.acidNeeded(FRIBOURG, 20, 0);
const acid40 = W.acidNeeded(FRIBOURG, 40, 0);
check('l’acide suit le volume d’empâtage', acid40.amount, acid20.amount * 2, 0.3);
/*
 * 136.0 ppm d'AR × 61 ÷ 50 = 165.9 mg/L de HCO₃ ; × 20 L = 3319 mg ;
 * ÷ 600 mg/mL = 5.5 mL. L'ancienne attente était 7.3 mL — un tiers de trop,
 * conséquence directe des diviseurs de l'AR.
 */
check('acide lactique pour 20 L de Fribourg vers AR 0', acid20.amount, 5.5, 0.3);
check(
  'aucun acide si l’AR est déjà sous la cible',
  W.acidNeeded(W.dilute(FRIBOURG, 100), 20, 0).amount,
  0
);
// 1.579 × 0.75 ÷ 97.99 = 12.09 mmol/mL, ~1.015 éq à pH 5.4 ➔ 750 mg de HCO₃.
check('pouvoir neutralisant du phosphorique', W.ACIDS.phosphorique.hco3NeutralizedPerUnit, 750);
check(
  'le phosphorique est plus concentré, donc moins dosé',
  W.acidNeeded(FRIBOURG, 20, 0, 'phosphorique').amount < acid20.amount,
  true
);

// --- 5. Ratio sulfate / chlorure ---------------------------------------------
check('West Coast : très houblonné', W.sulfateChlorideRatio({ ...FRIBOURG, so4: 300, cl: 60 }).label, 'très houblonné, amertume sèche');
check('NEIPA : très malté', W.sulfateChlorideRatio({ ...FRIBOURG, so4: 100, cl: 200 }).label, 'malté, rond');
check('aucun chlorure : dit franchement', W.sulfateChlorideRatio({ ...FRIBOURG, cl: 0 }).ratio, null);

// --- 6. Solveur ---------------------------------------------------------------
const ipa = solve('21A', W.dilute(FRIBOURG, 50), 20, 10, 20);
check('viser une IPA demande du gypse', (ipa.doses.gypse ?? 0) > 5, true);
check('le sulfate atteint approche la cible', ipa.achievedWort.so4, S.midpoint(S.styleByCode('21A')).so4, 40);

const neipa = solve('21C', W.dilute(FRIBOURG, 80), 20, 10, 12);
check('viser une NEIPA demande du chlorure de calcium', (neipa.doses.cacl2 ?? 0) > 5, true);
check('le chlorure atteint approche la cible', neipa.achievedWort.cl, 175, 40);

/*
 * ⚠️ LA règle du solveur : aucun sel n'est dosé au-delà de ce que le plus
 * contraint de ses ions peut absorber. Sans elle, le sel de table faisait
 * dépasser le chlorure de 77 ppm et le bicarbonate le sodium de 66 ppm — puis
 * le message accusait l'eau de départ, qui était de l'osmosée pure.
 *
 * On la vérifie sur TOUS les styles, trois eaux et quatre couleurs.
 */
let debordements = 0;
for (const style of S.STYLE_WATERS) {
  for (const eau of [OSMOSEE, FRIBOURG, W.dilute(FRIBOURG, 50)]) {
    for (const ebc of [6, 20, 45, 80]) {
      const r = solve(style.code, eau, 20, 10, ebc);
      for (const ion of ['ca', 'mg', 'na', 'so4', 'cl']) {
        // Une source déjà trop chargée ne se corrige qu'à l'osmosée.
        if (eau[ion] > style.ions[ion].max) continue;
        if (r.achievedWort[ion] > style.ions[ion].max + 2) {
          debordements += 1;
          console.log(
            `   ❌ ${style.code} : ${ion} à ${r.achievedWort[ion]} ppm pour un maximum de ${style.ions[ion].max}`
          );
        }
      }
    }
  }
}
check('aucun ion poussé hors de sa fourchette par le solveur', debordements, 0);

// Le calcium n'était jamais une cible : il n'arrivait qu'en sous-produit.
for (const [code, ebc] of [['05D', 6], ['20C', 80], ['13C', 45], ['21A', 20]]) {
  const r = solve(code, OSMOSEE, 20, 10, ebc);
  check(
    `${code} : le calcium atteint son plancher`,
    r.achievedWort.ca >= S.styleByCode(code).ions.ca.min - 2,
    true
  );
}

// Une impériale depuis l'osmosée doit atteindre sa fenêtre d'AR SANS se saler :
// c'est ce que la chaux permet quand le bicarbonate bute sur le sodium.
const stout = solve('20C', OSMOSEE, 20, 10, 80);
check('impériale : AR remontée', W.residualAlkalinity(stout.achievedMash) > 110, true);
check('impériale : sodium tenu', stout.achievedWort.na <= S.styleByCode('20C').ions.na.max + 2, true);
// Plus de sel de table « pour atteindre » le sodium : le bicarbonate a la place.
check('impériale : pas de sel de table', (stout.doses.nacl ?? 0) === 0, true);

// Additifs écartés : le solveur le DIT au lieu de contourner en silence.
const noCl = solve('21C', W.dilute(FRIBOURG, 80), 20, 10, 12, ['cacl2', 'mgcl2', 'kcl']);
check('tous les chlorures écartés : aucune dose', noCl.doses.cacl2 ?? 0, 0);
check(
  'tous les chlorures écartés : le manque est annoncé',
  noCl.unreachable.some((m) => m.startsWith('Chlorure')),
  true
);

// Le repli reste plafonné : sans ça le MgCl₂ montait le magnésium à 59 ppm.
const replis = solve('21C', OSMOSEE, 20, 10, 12, ['cacl2']);
check('repli sur le MgCl₂', (replis.doses.mgcl2 ?? 0) > 0, true);
check('le repli ne noie pas la bière de magnésium', replis.achievedWort.mg <= 22, true);

// Le potassium n'a pas de champ dans le modèle : on annonce ce qu'on verse.
const viaKcl = solve('21C', OSMOSEE, 20, 10, 12, ['cacl2', 'mgcl2']);
// A potassium contribution is not an unreachable target. Actual threshold
// warnings are handled by saltCautions; the optimizer must respect the cap.
check('le KCl respecte son plafond de potassium', (viaKcl.doses.kcl ?? 0) * 524.4 / 30 <= 50, true);

// Une source déjà au-dessus de la cible ne peut que se diluer.
const dure = solve('01A', FRIBOURG, 20, 10, 6);
check(
  'lager légère sur eau dure : l’osmosée est la seule issue',
  dure.unreachable.some((m) => m.includes('osmosée')),
  true
);

// --- 7. Répartition empâtage / rinçage ---------------------------------------
const split = W.splitDoses({ gypse: 10, cacl2: 6, nahco3: 7.2, chaux: 3 }, 20, 10, false);
check('deux tiers du gypse vont à l’empâtage', split.mash.gypse, 6.7, 0.1);
check('un tiers va au rinçage', split.sparge.gypse, 3.3, 0.1);
check(
  'la somme est conservée',
  Math.round(((split.mash.cacl2 ?? 0) + (split.sparge.cacl2 ?? 0)) * 10) / 10,
  6,
  0.1
);
/*
 * ⚠️ Les sels ALCALINS vont entièrement à l'empâtage. Répartis au prorata, une
 * part partait au rinçage — où l'acidification calculait ensuite la dose pour
 * la détruire. On achetait et pesait deux produits pour qu'ils s'annulent :
 * 2.9 mL d'acide lactique pour effacer 2.4 g de bicarbonate.
 */
check('le bicarbonate ne part pas au rinçage', split.sparge.nahco3 ?? 0, 0);
check('la chaux non plus', split.sparge.chaux ?? 0, 0);
check('tout le bicarbonate est à l’empâtage', split.mash.nahco3, 7.2, 0.01);

const deuxEaux = W.waterFromPlan(OSMOSEE, { nahco3: 7.2, gypse: 9 }, 20, 10);
check('l’eau de rinçage ne porte aucune alcalinité ajoutée', deuxEaux.sparge.hco3, 0);
check('l’eau d’empâtage la porte entièrement', deuxEaux.mash.hco3 > 200, true);
check('et le rinçage ne demande donc plus d’acide', W.spargeAcidNeeded(deuxEaux.sparge, 10).amount, 0);

// --- 8. Acidification du rinçage ---------------------------------------------
const sparge = W.spargeAcidNeeded(FRIBOURG, 10);
check('le rinçage vise pH 5.5', sparge.targetPh, 5.5);
/*
 * ⚠️ On ne retire PAS toute l'alcalinité. Le code le faisait en annonçant viser
 * pH 5.8 ; retirer la totalité, c'est le point d'équivalence d'un titrage, vers
 * pH 4.4. La part à retirer suit la répartition du carbonate (pKa₁ 6.35) :
 *
 *   f = 1 − α₁(5.5)/α₁(7.4),  α₁ = 1/(1 + 10^(6.35 − pH))
 *     = 1 − 0.1238/0.9177 = 0.865
 *
 * 204.9 × 0.865 = 177.2 ppm CaCO₃ ; × 61 ÷ 50 = 216.2 mg/L ; × 10 L ÷ 600 = 3.6 mL.
 */
check('part de l’alcalinité à retirer pour pH 5.5', W.alkalinityFractionToRemove(5.5), 0.865, 0.005);
check('part à retirer pour pH 5.8', W.alkalinityFractionToRemove(5.8), 0.76, 0.005);
check('acide de rinçage pour 10 L de Fribourg', sparge.amount, 3.6, 0.2);
check(
  'l’acide de rinçage suit son propre volume',
  W.spargeAcidNeeded(FRIBOURG, 20).amount,
  sparge.amount * 2,
  0.3
);
check(
  'une osmosée pure ne demande rien au rinçage',
  W.spargeAcidNeeded(W.dilute(FRIBOURG, 100), 10).amount,
  0
);
check('sans rinçage, aucun acide', W.spargeAcidNeeded(FRIBOURG, 0).amount, 0);
// ⚠️ Il n'y a pas de grain au rinçage : le malt acidulé y est refusé.
const maltAuRincage = W.spargeAcidNeeded(FRIBOURG, 10, 'maltAcidule');
check('le malt acidulé est refusé au rinçage', maltAuRincage.amount, 0);
check('et le refus est expliqué', /grain/i.test(maltAuRincage.warning ?? ''), true);

// --- 9. Acide cumulé dans la bière -------------------------------------------
/*
 * ⚠️ La note du produit — « au-delà de 5 mL pour 20 L » — vaut par AJOUT.
 * Personne ne sommait l'empâtage et le rinçage, et c'est le cumul qu'on goûte.
 * 1 mL d'acide lactique à 80 % titre 0.952 g d'acide pur.
 */
const pils = solve('05D', FRIBOURG, 20, 15, 6);
const mashMl = W.acidNeeded(pils.achievedMash, 20, W.targetRaForColor(6).max).amount;
const spargeMl = W.spargeAcidNeeded(pils.achievedSparge, 15).amount;
check('acide cumulé converti en g/L de bière', W.lactateInBeer(10.8, 30), 0.34, 0.01);
check(
  'une Pils sur eau de Fribourg pure franchit le seuil de perception',
  W.lactateInBeer(mashMl + spargeMl, 30) > W.LACTATE_TASTE_THRESHOLD,
  true
);

// --- 10. Rééquilibrage par le rapport SO₄:Cl ---------------------------------
const base = { ca: 100, mg: 10, na: 10, so4: 150, cl: 150, hco3: 0 };
const amer = W.rebalanceRatio(base, 4);
check('à somme constante', amer.so4 + amer.cl, 300, 1);
check('rapport 4 : le sulfate domine', Math.round((amer.so4 / amer.cl) * 10) / 10, 4, 0.15);
const malte = W.rebalanceRatio(base, 0.5);
check('rapport 0.5 : le chlorure domine', malte.cl > malte.so4, true);
check('les autres ions ne bougent pas', malte.ca, 100);

// --- 11. Fourchettes de style -------------------------------------------------
const neipaStyle = S.styleByCode('21C');
check('la NEIPA vise le chlorure', neipaStyle.ions.cl.min > neipaStyle.ions.so4.min, true);
check('la West Coast vise le sulfate', S.styleByCode('21A').ions.so4.min > 150, true);
check('l’impériale demande de l’alcalinité', S.styleByCode('20C').ions.hco3.min >= 120, true);
check('la Pils n’en veut pas', S.styleByCode('05D').ions.hco3.max <= 40, true);
check('la Gose est salée', S.styleByCode('27').ions.na.min >= 60, true);

check('hors fourchette par le haut', S.positionInRange(400, { min: 20, max: 60 }), 1);
check('hors fourchette par le bas', S.positionInRange(5, { min: 20, max: 60 }), -1);
check('dans la fourchette', S.positionInRange(40, { min: 20, max: 60 }), 0);
check('milieu de fourchette', S.fillInRange(40, { min: 20, max: 60 }), 0.5, 0.01);

check('« NEIPA Tropicale » ➔ 21C', S.styleWaterForName('NEIPA Tropicale').code, '21C');
check('« Milk Stout #2 » ➔ 16A', S.styleWaterForName('Milk Stout #2').code, '16A');
check('« Pils » ➔ 05D', S.styleWaterForName('Pilsner maison').code, '05D');
check('style inconnu ➔ profil neutre', S.styleWaterForName('Bière bizarre').code, '—');

// --- Verdict -----------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });

if (failed > 0) {
  console.log(`\n⛔ ${failed} contrôle(s) de chimie de l’eau en échec.`);
  process.exit(1);
}
console.log(
  '✅ Chimie de l’eau vérifiée : alcalinité résiduelle (Kolbach en ppm d’ion), acides, ' +
    'plafonnement de tous les sels, alcalinité sur l’empâtage seul, acide cumulé.'
);
