import { describe, it, expect } from 'vitest';
import {
  SALTS,
  SALT_IDS,
  ACIDS,
  ALKALINE_SALTS,
  dilute,
  ionsFromSalts,
  addIons,
  saltIons,
  alkalinityAsCaCO3,
  alkalinityFractionToRemove,
  residualAlkalinity,
  netRaPerGramPerLitre,
  targetRaForColor,
  targetRaForGrist,
  raForGrist,
  raSaltCeilingForGrist,
  raAcidTarget,

  hco3BandForRa,
  MALT_BUFFER_MEQ_PER_KG_PH,
  CHALK_RA_CAP_PPM,
  estimateMashPh,
  hopBalanceHint,
  phShiftFromRa,
  MASH_PH_BAND,
  acidNeeded,
  acidCorrectionFromMeasuredPh,
  ionsAfterAcid,
  spargeAcidNeeded,
  lactateInBeer,
  LACTATE_TASTE_THRESHOLD,
  saltCautions,
  CAUTION_APPROACH,
  sulfateChlorideRatio,
  rebalanceRatio,
  solveSalts,
  splitDoses,
  waterFromPlan,
  parseWaterTarget,
  DEFAULT_WATER_SOURCE
} from '../../src/domain/water';
import {
  STYLE_WATERS,
  styleByCode,
  styleWaterForName,
  midpoint,
  positionInRange,
  fillInRange,
  styleFromTargetIons,
  CUSTOM_STYLE_CODE
} from '../../src/domain/waterStyles';
import { WaterIons } from '../../src/types';

/** L'eau du réseau fribourgeois : dure, calcaire. C'est le cas réel. */
const FRIBOURG: WaterIons = { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 };
const OSMOSEE: WaterIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };

/** Le solveur tel que l'atelier l'appelle : cible au milieu, plafonds au style. */
function solveFor(
  code: string,
  start: WaterIons,
  mashWaterL: number,
  spargeWaterL: number,
  ebc: number | null,
  disabled: Parameters<typeof solveSalts>[0]['disabled'] = []
) {
  const style = styleByCode(code);
  const ratio = (style.ratio.min + style.ratio.max) / 2;
  return solveSalts({
    start,
    target: rebalanceRatio(midpoint(style), ratio),
    ranges: style.ions,
    totalWaterL: mashWaterL + spargeWaterL,
    mashWaterL,
    disabled,
    targetRa: targetRaForColor(ebc),
    ratio
  });
}

describe('Contributions ioniques', () => {
  it('1 g de gypse dans 1 L donne 232.8 ppm de calcium et 557.7 de sulfate', () => {
    const r = ionsFromSalts({ gypse: 1 }, 1);
    expect(r.ca).toBeCloseTo(232.8, 1);
    expect(r.so4).toBeCloseTo(557.7, 1);
  });

  it('la concentration se dilue avec le volume', () => {
    expect(ionsFromSalts({ gypse: 4 }, 20).so4).toBeCloseTo(111.5, 1);
  });

  it('un volume nul ne divise pas par zéro', () => {
    expect(ionsFromSalts({ gypse: 4 }, 0)).toEqual({ ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 });
  });

  it('chaque sel déclaré apporte au moins un ion', () => {
    SALT_IDS.forEach((id) => {
      expect(Object.keys(SALTS[id].ions).length).toBeGreaterThan(0);
    });
  });

  it('les sels s’additionnent', () => {
    const a = ionsFromSalts({ gypse: 2 }, 10);
    const b = ionsFromSalts({ cacl2: 2 }, 10);
    const somme = addIons(a, b);
    expect(somme.ca).toBeCloseTo(a.ca + b.ca, 1);
    expect(somme.cl).toBeCloseTo(b.cl, 1);
  });

  it('⚠️ la craie ne compte QUE pour moitié — sa solubilité entre dans le calcul', () => {
    // Sa fiche disait « compte au mieux la moitié » ; le solveur la dosait à 100 %.
    expect(saltIons('caco3').ca).toBeCloseTo(200.2, 1);
    expect(saltIons('caco3').hco3).toBeCloseTo(609.5, 1);
    expect(ionsFromSalts({ caco3: 1 }, 1).ca).toBeCloseTo(200.2, 1);
  });

  it('la chaux apporte du calcium et de l’alcalinité, jamais de sodium', () => {
    expect(SALTS.chaux.ions.na).toBeUndefined();
    expect(saltIons('chaux').ca).toBeCloseTo(540.9, 1);
  });
});

describe('Dilution', () => {
  it('couper de moitié divise tous les ions par deux', () => {
    const d = dilute(FRIBOURG, 50);
    expect(d.hco3).toBeCloseTo(125, 1);
    expect(d.ca).toBeCloseTo(42.5, 1);
  });

  it('l’osmosée pure ne laisse rien', () => {
    expect(dilute(FRIBOURG, 100)).toEqual(OSMOSEE);
  });

  it('zéro pour cent laisse l’eau intacte', () => {
    expect(dilute(FRIBOURG, 0)).toEqual(FRIBOURG);
  });

  it('un pourcentage hors bornes est ramené dans [0, 100]', () => {
    expect(dilute(FRIBOURG, 150).ca).toBe(0);
    expect(dilute(FRIBOURG, -50).ca).toBeCloseTo(FRIBOURG.ca, 1);
  });
});

describe('Alcalinité', () => {
  it('convertit les bicarbonates en CaCO₃', () => {
    expect(alkalinityAsCaCO3(250)).toBeCloseTo(204.9, 1);
  });

  /*
   * ⚠️ LA correction. Le code retranchait Ca/3.5 et Mg/7, qui sont les
   * diviseurs de Kolbach pour des duretés EXPRIMÉES EN CaCO₃ — pas pour des
   * ppm d'ion. Sur des ppm d'ion, ce sont 1.4 et 1.7.
   *
   *   204.9 − 85/1.4 − 14/1.7 = 136.1
   *
   * L'ancienne valeur attendue, 178.6, était la formule fausse figée en test :
   * la suite était verte et l'acide surdosé d'un tiers.
   */
  it('⚠️ l’AR retranche les duretés converties en CaCO₃, pas les ppm d’ion bruts', () => {
    expect(residualAlkalinity(FRIBOURG)).toBeCloseTo(136.1, 0);
  });

  it('les diviseurs valent bien 1.4 et 1.7', () => {
    expect(residualAlkalinity({ ...OSMOSEE, ca: 140 })).toBeCloseTo(-100, 0);
    expect(residualAlkalinity({ ...OSMOSEE, mg: 170 })).toBeCloseTo(-100, 0);
  });

  it('une eau très calcique peut avoir une AR négative', () => {
    expect(residualAlkalinity({ ...FRIBOURG, ca: 400, hco3: 20 })).toBeLessThan(0);
  });

  /*
   * ⚠️ UNE COURBE, PLUS QUATRE MARCHES.
   *
   * Ce test épinglait les bords des anciens paliers — `targetRaForColor(8).max`
   * valait 0 parce que 8 EBC tombait dans la classe « pâle », et 13 EBC dans la
   * suivante. C'est exactement la marche que Gaëtan a signalée : un point d'EBC
   * et l'eau changeait de profil. Il vérifie maintenant les propriétés de la
   * COURBE, qui sont ce qu'on veut vraiment garantir.
   */
  it('la cible d’AR monte avec la couleur, sans marche', () => {
    // Les quatre repères historiques, au centre de leur classe : inchangés.
    expect(targetRaForColor(6).min).toBe(-60);
    expect(targetRaForColor(6).max).toBe(0);
    expect(targetRaForColor(21).min).toBe(0);
    expect(targetRaForColor(45).min).toBe(60);
    expect(targetRaForColor(80).min).toBe(120);

    // Monotone, et bornée aux deux bouts.
    let precedent = -Infinity;
    for (let ebc = 0; ebc <= 120; ebc += 1) {
      const b = targetRaForColor(ebc);
      expect(b.max - b.min).toBe(60);
      expect(b.min).toBeGreaterThanOrEqual(precedent);
      precedent = b.min;
    }
    expect(targetRaForColor(0).min).toBe(-60);
    expect(targetRaForColor(200).min).toBe(120);

    // ⚠️ LE POINT DU DÉFAUT : plus jamais 60 ppm d'écart pour 1 EBC.
    for (let ebc = 1; ebc <= 120; ebc += 1) {
      const saut = targetRaForColor(ebc).min - targetRaForColor(ebc - 1).min;
      expect(saut).toBeLessThanOrEqual(5);
    }
  });

  it('une couleur inconnue élargit la fenêtre et le DIT', () => {
    expect(targetRaForColor(null).label).toBe('bière de couleur inconnue');
    // L'étiquette entre dans « pour une ${label} » : elle doit désigner une bière.
    expect(targetRaForColor(null).label.startsWith('bière')).toBe(true);
  });

  it('l’AR nette d’un sel alcalin tient compte du calcium qu’il traîne', () => {
    // La chaux apporte beaucoup de calcium, qui annule une part de son alcalinité.
    expect(netRaPerGramPerLitre('nahco3')).toBeCloseTo(595, -1);
    expect(netRaPerGramPerLitre('chaux')).toBeCloseTo(964, -1);
    expect(netRaPerGramPerLitre('caco3')).toBeCloseTo(357, -1);
    // La chaux reste la plus efficace, et c'est pour ça qu'elle existe ici.
    expect(netRaPerGramPerLitre('chaux')).toBeGreaterThan(netRaPerGramPerLitre('nahco3'));
  });
});

describe('Acidification', () => {
  it('l’acide se dose sur le volume d’empâtage, proportionnellement', () => {
    const a20 = acidNeeded(FRIBOURG, 20, 0).amount;
    const a40 = acidNeeded(FRIBOURG, 40, 0).amount;
    expect(a40).toBeCloseTo(a20 * 2, 0);
  });

  it('⚠️ 20 L de Fribourg vers AR 0 demandent 5.5 mL, pas 7.3', () => {
    // Le surdosage d'un tiers venait en droite ligne des diviseurs de l'AR.
    expect(acidNeeded(FRIBOURG, 20, 0).amount).toBeCloseTo(5.5, 1);
  });

  it('rien à ajouter si l’alcalinité est déjà sous la cible', () => {
    expect(acidNeeded(dilute(FRIBOURG, 100), 20, 0).amount).toBe(0);
  });

  it('le phosphorique, plus concentré, se dose moins', () => {
    expect(acidNeeded(FRIBOURG, 20, 0, 'phosphorique').amount).toBeLessThan(
      acidNeeded(FRIBOURG, 20, 0, 'lactique').amount
    );
  });

  /*
   * ⚠️ 830 mg de HCO₃ par mL supposait 1.13 équivalent par mole, qu'aucune
   * concentration commerciale ne donne : à pH d'empâtage, le phosphorique ne
   * cède que son premier proton. Le rapport entre les deux acides était faux de
   * 20 %, donc changer d'acidifiant sous-dosait.
   */
  it('⚠️ le phosphorique titre 750 mg de HCO₃/mL, soit ~1.25 fois le lactique', () => {
    expect(ACIDS.phosphorique.hco3NeutralizedPerUnit).toBe(750);
    const rapport =
      ACIDS.phosphorique.hco3NeutralizedPerUnit / ACIDS.lactique.hco3NeutralizedPerUnit;
    expect(rapport).toBeCloseTo(1.25, 2);
  });

  it('un volume nul ne demande rien', () => {
    expect(acidNeeded(FRIBOURG, 0, 0).amount).toBe(0);
  });

  it('le rinçage s’acidifie — sans quoi il extrait les tanins des drêches', () => {
    const s = spargeAcidNeeded(FRIBOURG, 10);
    expect(s.targetPh).toBe(5.5);
    expect(s.amount).toBeGreaterThan(3);
  });

  /*
   * ⚠️ Le code retirait 100 % de l'alcalinité en annonçant pH 5.8. Retirer la
   * totalité mène au point d'équivalence, vers pH 4.4. La part à retirer se
   * déduit de la répartition du carbonate (pKa₁ 6.35).
   */
  it('⚠️ on ne retire PAS toute l’alcalinité : 87 % pour pH 5.5, 76 % pour 5.8', () => {
    expect(alkalinityFractionToRemove(5.5)).toBeCloseTo(0.865, 2);
    expect(alkalinityFractionToRemove(5.8)).toBeCloseTo(0.76, 2);
    // Descendre vraiment à zéro d'alcalinité, c'est viser 4.4.
    expect(alkalinityFractionToRemove(4.4)).toBeGreaterThan(0.98);
  });

  it('viser un pH plus bas demande plus d’acide', () => {
    expect(spargeAcidNeeded(FRIBOURG, 10, 'lactique', 5.2).amount).toBeGreaterThan(
      spargeAcidNeeded(FRIBOURG, 10, 'lactique', 5.8).amount
    );
  });

  it('l’acide de rinçage suit son PROPRE volume, pas celui de l’empâtage', () => {
    expect(spargeAcidNeeded(FRIBOURG, 20).amount).toBeCloseTo(
      spargeAcidNeeded(FRIBOURG, 10).amount * 2,
      0
    );
  });

  it('une osmosée pure ne demande rien au rinçage', () => {
    expect(spargeAcidNeeded(dilute(FRIBOURG, 100), 10).amount).toBe(0);
  });

  /* ⚠️ Il rendait des GRAMMES de malt acidulé pour une eau sans grain. */
  it('⚠️ le malt acidulé est refusé au rinçage : il n’y a pas de grain à ce stade', () => {
    const s = spargeAcidNeeded(FRIBOURG, 10, 'maltAcidule');
    expect(s.amount).toBe(0);
    expect(s.warning).toMatch(/grain/i);
  });

  it('chaque acidifiant déclare son unité', () => {
    (Object.keys(ACIDS) as Array<keyof typeof ACIDS>).forEach((k) => {
      expect(['mL', 'g']).toContain(ACIDS[k].unit);
      expect(ACIDS[k].hco3NeutralizedPerUnit).toBeGreaterThan(0);
    });
  });

  /*
   * ⚠️ La note du produit vaut par AJOUT. Personne ne somme l'empâtage et le
   * rinçage — et c'est le cumul qu'on goûte dans la bière.
   */
  it('⚠️ l’acide lactique CUMULÉ des deux eaux se compte en g/L de bière', () => {
    expect(lactateInBeer(10.8, 30)).toBeCloseTo(0.34, 2);
    expect(lactateInBeer(0, 30)).toBe(0);
    expect(lactateInBeer(5, 0)).toBe(0);
  });

  it('une Pils sur eau de Fribourg pure franchit le seuil de perception', () => {
    const r = solveFor('05D', FRIBOURG, 20, 15, 6);
    const mash = acidNeeded(r.achievedMash, 20, targetRaForColor(6).max).amount;
    const sparge = spargeAcidNeeded(r.achievedSparge, 15).amount;
    expect(lactateInBeer(mash + sparge, 30)).toBeGreaterThan(0.3);
  });
});

describe('Rapport sulfate / chlorure', () => {
  it('interprète le rapport en bouche', () => {
    expect(sulfateChlorideRatio({ ...FRIBOURG, so4: 300, cl: 60 }).label).toMatch(/sèche/i);
    expect(sulfateChlorideRatio({ ...FRIBOURG, so4: 100, cl: 200 }).label).toMatch(/rond/i);
  });

  it('sans chlorure, le dit franchement au lieu de diviser par zéro', () => {
    expect(sulfateChlorideRatio({ ...FRIBOURG, cl: 0 }).ratio).toBeNull();
  });

  it('rééquilibre à minéralité totale constante', () => {
    const base: WaterIons = { ca: 100, mg: 10, na: 10, so4: 150, cl: 150, hco3: 0 };
    const amer = rebalanceRatio(base, 4);
    expect(amer.so4 + amer.cl).toBeCloseTo(300, 1);
    expect(amer.so4 / amer.cl).toBeCloseTo(4, 1);
    expect(amer.ca).toBe(100);
  });

  it('un rapport nul porte toute la somme vers le chlorure ; un rapport négatif est ignoré', () => {
    const base: WaterIons = { ca: 100, mg: 10, na: 10, so4: 150, cl: 150, hco3: 0 };
    expect(rebalanceRatio(base, 0)).toEqual({ ...base, so4: 0, cl: 300 });
    expect(rebalanceRatio(base, -1)).toEqual(base);
  });
});

describe('Solveur de sels', () => {
  it('viser une IPA depuis une eau coupée demande du gypse', () => {
    const r = solveFor('21A', dilute(FRIBOURG, 50), 20, 10, 20);
    expect(r.doses.gypse ?? 0).toBeGreaterThan(5);
  });

  /*
   * ⚠️ LA règle du solveur, et ce qui remplace les rustines sel par sel : aucun
   * sel n'est dosé au-delà de ce que le plus contraint de ses ions peut
   * absorber. On la vérifie sur TOUS les styles et trois eaux de départ.
   */
  it('⚠️ ne fait JAMAIS sortir un ion du haut de sa fourchette', () => {
    const eaux: Array<[string, WaterIons]> = [
      ['osmosée', OSMOSEE],
      ['Fribourg', FRIBOURG],
      ['Fribourg 50 %', dilute(FRIBOURG, 50)]
    ];
    const debordements: string[] = [];

    STYLE_WATERS.forEach((style) => {
      eaux.forEach(([nom, eau]) => {
        [6, 20, 45, 80].forEach((ebc) => {
          const r = solveFor(style.code, eau, 20, 10, ebc);
          (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
            const max = style.ions[ion].max;
            // Une SOURCE déjà trop chargée n'est pas la faute du solveur :
            // elle ne se corrige qu'à l'osmosée, et le solveur le dit.
            if (eau[ion] > max) return;
            if (r.achievedWort[ion] > max + 2) {
              debordements.push(`${style.code}/${nom}/EBC ${ebc} : ${ion} ${r.achievedWort[ion]} > ${max}`);
            }
          });
        });
      });
    });

    expect(debordements).toEqual([]);
  });

  /*
   * ⚠️ Le sel de table était dosé APRÈS le chlorure : ses 606.6 ppm de Cl par
   * g/L tombaient en pur dépassement — 197 ppm atteints pour 120 visés — et le
   * message accusait ensuite l'eau de départ, qui était de l'osmosée pure.
   */
  it('⚠️ le chlorure du sel de table est décompté, et la source n’est plus accusée à tort', () => {
    const r = solveFor('20C', OSMOSEE, 20, 10, 80);
    expect(r.achievedWort.cl).toBeLessThanOrEqual(styleByCode('20C').ions.cl.max + 2);
    expect(r.unreachable.some((m) => m.includes('osmosée'))).toBe(false);
  });

  /*
   * ⚠️ Le sodium du bicarbonate n'était jamais confronté à sa cible : une
   * impériale sortait à 116 ppm pour 50 visés, et personne ne le disait.
   */
  it('⚠️ le sodium du bicarbonate est compté dans la cible', () => {
    const r = solveFor('20C', OSMOSEE, 20, 10, 80);
    expect(r.achievedWort.na).toBeLessThanOrEqual(styleByCode('20C').ions.na.max + 2);
  });

  /*
   * ⚠️ Le calcium n'était jamais une cible : il n'arrivait qu'en sous-produit,
   * et seul l'EXCÈS était signalé. Une Pils sortait à 31 ppm, une impériale à
   * 71, sans un mot.
   */
  it('⚠️ le calcium atteint son plancher, ou le manque est ANNONCÉ', () => {
    ([['05D', 6], ['20C', 80], ['13C', 45], ['21A', 20]] as Array<[string, number]>).forEach(
      ([code, ebc]) => {
        const style = styleByCode(code);
        const r = solveFor(code, OSMOSEE, 20, 10, ebc);
        const atteint = r.achievedMash.ca >= style.ions.ca.min - 2;
        const annonce = r.unreachable.some((m) => m.startsWith('Calcium'));
        expect(atteint || annonce).toBe(true);
        expect(atteint).toBe(true);
      }
    );
  });

  it('le manque de calcium est dit quand les deux sels calciques sont écartés', () => {
    const r = solveFor('21C', OSMOSEE, 20, 10, 12, ['cacl2', 'mgcl2']);
    expect(r.unreachable.some((m) => m.startsWith('Calcium'))).toBe(true);
  });

  /*
   * ⚠️ Sans plafond, le repli sur le MgCl₂ montait le magnésium à 59 ppm —
   * laxatif au-delà de 30 — et le test d'origine figeait ce comportement.
   */
  it('⚠️ un repli reste plafonné : le MgCl₂ ne noie pas la bière de magnésium', () => {
    const r = solveFor('21C', OSMOSEE, 20, 10, 12, ['cacl2']);
    expect(r.doses.mgcl2 ?? 0).toBeGreaterThan(0);
    expect(r.achievedWort.mg).toBeLessThanOrEqual(styleByCode('21C').ions.mg.max + 2);
  });

  /* ⚠️ Le potassium n'a pas de champ : il était versé sans que rien ne le dise. */
  it('le KCl est plafonné, ses informations de seuil viennent des doses réelles', () => {
    const r = solveFor('21C', OSMOSEE, 20, 10, 12, ['cacl2', 'mgcl2']);
    expect(r.doses.kcl ?? 0).toBeGreaterThan(0);
    // A contribution is not an unreachable target. saltCautions handles the
    // conditional threshold warning, avoiding a permanent solver warning.
    expect((r.doses.kcl ?? 0) * 524.4 / 30).toBeLessThanOrEqual(50);
    expect(r.unreachable.some((m) => /potassium/i.test(m))).toBe(false);
  });

  /*
   * L'eau de Burton titre 270 ppm de bicarbonate, et c'est le profil
   * historique d'une IPA. Personne ne remonte l'alcalinité pour en brasser
   * une : elle se règle sur la COULEUR. Même style, même eau, deux couleurs —
   * seule la version ambrée reçoit un sel alcalin.
   */
  it('⚠️ l’alcalinité suit la couleur de la bière, jamais le profil historique', () => {
    const alcalins = (r: ReturnType<typeof solveSalts>) =>
      ALKALINE_SALTS.reduce((s, id) => s + (r.doses[id] ?? 0), 0);

    const pale = solveFor('21A', dilute(FRIBOURG, 50), 20, 10, 6);
    /*
     * ⚠️ 35 EBC ET NON 20. Depuis que la fenêtre glisse au lieu de sauter, une
     * bière de 20 EBC vise −4 à 56 : son plancher est encore négatif, et on
     * n'achète pas d'alcalinité pour atteindre une cible négative. C'est à
     * 21 EBC que le plancher passe zéro. Prendre 35 garde au test son sujet —
     * « plus foncé, plus alcalin » — sans le faire reposer sur le point de
     * bascule lui-même.
     */
    const foncee = solveFor('21A', dilute(FRIBOURG, 50), 20, 10, 35);

    // Une pâle peut recevoir une pincée (l'osmosée coupée avec du CaCl₂ tombe
    // sous −60), jamais autant qu'une foncée.
    expect(alcalins(pale)).toBeLessThan(1);
    expect(alcalins(foncee)).toBeGreaterThan(alcalins(pale));
    expect(residualAlkalinity(foncee.achievedMash)).toBeGreaterThan(
      residualAlkalinity(pale.achievedMash)
    );
  });

  it('remonte l’alcalinité quand la bière foncée la réclame', () => {
    const r = solveFor('20C', dilute(FRIBOURG, 100), 20, 10, 80);
    const alcalins = ALKALINE_SALTS.reduce((s, id) => s + (r.doses[id] ?? 0), 0);
    expect(alcalins).toBeGreaterThan(0);
    expect(residualAlkalinity(r.achievedMash)).toBeGreaterThan(100);
  });

  /*
   * ⚠️ Le bicarbonate seul fait dépasser le sodium bien avant d'atteindre la
   * fenêtre d'alcalinité d'une impériale depuis l'osmosée. La chaux est la
   * seule source alcaline soluble sans sodium — sans elle, la fenêtre est
   * inatteignable.
   */
  it('⚠️ une impériale depuis l’osmosée atteint sa fenêtre d’AR sans se saler', () => {
    const style = styleByCode('20C');
    const r = solveFor('20C', OSMOSEE, 20, 10, 80);
    expect(residualAlkalinity(r.achievedMash)).toBeGreaterThan(110);
    expect(r.achievedWort.na).toBeLessThanOrEqual(style.ions.na.max + 2);
    // ⚠️ Plus de sel de table « pour atteindre » le sodium : le bicarbonate a
    // désormais la place, et la chaux ne sert que si lui bute sur le plafond.
    expect(r.doses.nacl ?? 0).toBe(0);
  });

  it('un additif écarté n’est jamais dosé, et le manque est ANNONCÉ', () => {
    const r = solveFor('21C', dilute(FRIBOURG, 80), 20, 10, 12, ['cacl2', 'mgcl2', 'kcl']);
    expect(r.doses.cacl2 ?? 0).toBe(0);
    expect(r.unreachable.some((m) => m.startsWith('Chlorure'))).toBe(true);
  });

  it('dit que seule l’osmosée peut faire baisser un ion déjà trop haut', () => {
    // 85 ppm de calcium à Fribourg, 70 au maximum d'une American Light Lager :
    // aucun sel ne fait baisser une concentration.
    const r = solveFor('01A', FRIBOURG, 20, 10, 6);
    expect(r.unreachable.some((m) => m.includes('osmosée'))).toBe(true);
    expect(r.unreachable.some((m) => /l’eau de départ en apporte déjà/.test(m))).toBe(true);
  });

  it('une AR trop haute renvoie à l’acide, jamais au sel', () => {
    const r = solveFor('05D', FRIBOURG, 20, 10, 6);
    expect(r.unreachable.some((m) => /acide, pas au sel/.test(m))).toBe(true);
  });

  /*
   * ⚠️ C'est l'état de DÉPART de tout nouveau brassin : l'assistant ouvre
   * l'atelier avant que les volumes soient posés. Le message doit dire quoi
   * faire, pas seulement constater.
   */
  it('⚠️ un volume nul dit quoi faire, au lieu de produire des doses infinies', () => {
    const r = solveFor('21A', FRIBOURG, 0, 0, 20);
    expect(r.doses).toEqual({});
    expect(r.unreachable).toHaveLength(1);
    expect(r.unreachable[0]).toMatch(/pose d’abord les volumes/);
  });
});

describe('Empâtage et rinçage sont deux eaux', () => {
  /*
   * ⚠️ Le bicarbonate était dosé sur le volume TOTAL : une part partait au
   * rinçage, où `spargeAcidNeeded` calculait ensuite l'acide pour la détruire.
   * Deux produits achetés et pesés pour s'annuler.
   */
  it('⚠️ les sels alcalins vont ENTIÈREMENT à l’empâtage', () => {
    // En mode proportionnel : c'est là que la règle des ALCALINS se voit.
    // Tout à l'empâtage, elle serait triviale — tout y va de toute façon.
    const s = splitDoses({ nahco3: 7.2, gypse: 9, chaux: 3, caco3: 2 }, 20, 10, false);
    expect(s.mash.nahco3).toBe(7.2);
    expect(s.mash.chaux).toBe(3);
    expect(s.mash.caco3).toBe(2);
    expect(s.sparge.nahco3).toBeUndefined();
    expect(s.sparge.chaux).toBeUndefined();
    expect(s.sparge.caco3).toBeUndefined();
    // Les sels de saveur, eux, se répartissent toujours au prorata.
    expect(s.mash.gypse).toBeCloseTo(6, 1);
    expect(s.sparge.gypse).toBeCloseTo(3, 1);
  });

  it('⚠️ l’eau de rinçage ne porte donc AUCUNE alcalinité apportée par les sels', () => {
    const w = waterFromPlan(OSMOSEE, { nahco3: 7.2, gypse: 9 }, 20, 10);
    expect(w.sparge.hco3).toBe(0);
    expect(w.mash.hco3).toBeGreaterThan(200);
    // Et l'acide de rinçage n'a donc plus rien à neutraliser.
    expect(spargeAcidNeeded(w.sparge, 10).amount).toBe(0);
  });

  it('l’eau d’empâtage est plus alcaline que celle du rinçage, jamais l’inverse', () => {
    const r = solveFor('20C', dilute(FRIBOURG, 50), 20, 10, 80);
    expect(r.achievedMash.hco3).toBeGreaterThan(r.achievedSparge.hco3);
  });

  /* ⚠️ Le prorata n'est plus le défaut — il se demande explicitement. */
  it('répartit les sels de saveur au prorata des volumes, quand on le demande', () => {
    const s = splitDoses({ gypse: 10 }, 20, 10, false);
    expect(s.mash.gypse).toBeCloseTo(6.7, 1);
    expect(s.sparge.gypse).toBeCloseTo(3.3, 1);
  });

  it('conserve la somme', () => {
    const s = splitDoses({ cacl2: 6 }, 20, 10, false);
    expect((s.mash.cacl2 ?? 0) + (s.sparge.cacl2 ?? 0)).toBeCloseTo(6, 1);
  });

  it('sans rinçage, tout va à l’empâtage', () => {
    const s = splitDoses({ gypse: 8, nahco3: 2 }, 25, 0);
    expect(s.mash.gypse).toBeCloseTo(8, 1);
    expect(s.mash.nahco3).toBe(2);
    expect(s.sparge.gypse).toBeUndefined();
  });

  it('sans rinçage, l’eau de rinçage vaut l’eau de départ et ne demande rien', () => {
    const w = waterFromPlan(FRIBOURG, { gypse: 8 }, 25, 0);
    expect(w.sparge).toEqual(FRIBOURG);
    expect(spargeAcidNeeded(w.sparge, 0).amount).toBe(0);
  });

  it('un volume total nul ne produit aucune dose', () => {
    expect(splitDoses({ gypse: 8 }, 0, 0)).toEqual({ mash: {}, sparge: {} });
  });

  it('avec allSaltsInMash: true, tous les sels vont à l’empâtage et aucun au rinçage', () => {
    const s = splitDoses({ gypse: 10, cacl2: 5, nahco3: 3 }, 20, 10, true);
    expect(s.mash.gypse).toBe(10);
    expect(s.mash.cacl2).toBe(5);
    expect(s.mash.nahco3).toBe(3);
    expect(s.sparge).toEqual({});
  });

  it('avec allSaltsInMash: true, l’eau de rinçage conserve sa composition de base et son calcul d’acide', () => {
    const w = waterFromPlan(FRIBOURG, { gypse: 10, cacl2: 5 }, 20, 10, FRIBOURG, true);
    expect(w.sparge).toEqual(FRIBOURG);
    expect(w.mash.ca).toBeGreaterThan(FRIBOURG.ca);
    const acid = spargeAcidNeeded(w.sparge, 10);
    expect(acid.amount).toBeGreaterThan(0);
  });
});

describe('Fourchettes de style', () => {
  it('la NEIPA vise le chlorure, la West Coast le sulfate', () => {
    expect(styleByCode('21C').ions.cl.min).toBeGreaterThan(styleByCode('21C').ions.so4.min);
    expect(styleByCode('21A').ions.so4.min).toBeGreaterThan(150);
  });

  it('l’impériale réclame de l’alcalinité, la Pils n’en veut pas', () => {
    expect(styleByCode('20C').ions.hco3.min).toBeGreaterThanOrEqual(120);
    expect(styleByCode('05D').ions.hco3.max).toBeLessThanOrEqual(40);
  });

  it('la Gose est salée — le sel fait partie de la recette', () => {
    expect(styleByCode('27').ions.na.min).toBeGreaterThanOrEqual(60);
  });

  it('chaque style a des fourchettes cohérentes et un rapport valide', () => {
    STYLE_WATERS.forEach((s) => {
      (Object.keys(s.ions) as Array<keyof WaterIons>).forEach((ion) => {
        expect(s.ions[ion].max).toBeGreaterThanOrEqual(s.ions[ion].min);
      });
      expect(s.ratio.max).toBeGreaterThan(s.ratio.min);
      expect(s.note.length).toBeGreaterThan(10);
    });
  });

  it('devine le style d’eau depuis le nom de la bière', () => {
    expect(styleWaterForName('NEIPA Tropicale').code).toBe('21C');
    expect(styleWaterForName('Milk Stout #2').code).toBe('16A');
    expect(styleWaterForName('Pilsner maison').code).toBe('05D');
    expect(styleWaterForName('Gose au sel de mer').code).toBe('23G');
  });

  it('un style inconnu retombe sur le profil neutre plutôt que de planter', () => {
    expect(styleWaterForName('Bière bizarre').code).toBe('—');
    expect(styleByCode('inexistant').code).toBe('—');
    expect(styleByCode(undefined).code).toBe('—');
  });

  it('situe une valeur dans sa fourchette', () => {
    expect(positionInRange(400, { min: 20, max: 60 })).toBe(1);
    expect(positionInRange(5, { min: 20, max: 60 })).toBe(-1);
    expect(positionInRange(40, { min: 20, max: 60 })).toBe(0);
    expect(fillInRange(40, { min: 20, max: 60 })).toBeCloseTo(0.5, 2);
    expect(fillInRange(200, { min: 20, max: 60 })).toBe(1);
  });

  it('une fourchette dégénérée ne divise pas par zéro', () => {
    expect(fillInRange(30, { min: 30, max: 30 })).toBe(0.5);
  });
});

describe('Eau par défaut', () => {
  it('porte une note disant que ce sont des valeurs à confirmer', () => {
    expect(DEFAULT_WATER_SOURCE.note).toMatch(/analyse/i);
  });
});

describe('Le pH d’empâtage lu dans la facture de grain', () => {
  const pale = [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage', colorEbc: 3 }];
  const stout = [
    { name: 'Maris Otter', weightKg: 5, kind: 'grain', use: 'empatage', colorEbc: 6 },
    { name: 'Orge rôtie', weightKg: 0.5, kind: 'grain', use: 'empatage', colorEbc: 1300 }
  ];

  it('une facture torréfiée titre plus acide qu’une facture pâle', () => {
    const a = estimateMashPh(pale, 0, 4.2);
    const b = estimateMashPh(stout, 0, 4.2);
    expect(a.known && b.known).toBe(true);
    expect(b.phDistilled).toBeLessThan(a.phDistilled);
    // Un pale seul reste au-dessus de la fenêtre : c'est là que l'acide sert.
    expect(a.phDistilled).toBeGreaterThan(MASH_PH_BAND.max);
  });

  /*
   * ⚠️ LE CAS QUE LA COULEUR NE VERRA JAMAIS. Le malt acidulé fait 5 EBC : à la
   * couleur, cette facture est une blonde. Dans la cuve, 3 % font tomber le pH
   * de près d'un dixième, et l'acide versé par-dessus descend trop bas.
   */
  it('⚠️ le malt acidulé fait chuter le pH, invisible à la couleur', () => {
    const sans = estimateMashPh(pale, 0, 4.2);
    const avec = estimateMashPh(
      [...pale, { name: 'Malt acidulé', weightKg: 0.2, kind: 'grain', use: 'empatage', colorEbc: 5 }],
      0,
      4.2
    );
    expect(avec.acidulatedPct).toBeGreaterThan(0);
    expect(avec.phDistilled).toBeLessThan(sans.phDistilled - 0.05);
  });

  it('sans couleur renseignée, il ne dit rien plutôt qu’un chiffre inventé', () => {
    const muet = estimateMashPh(
      [{ name: 'Un malt', weightKg: 5, kind: 'grain', use: 'empatage' }],
      0,
      4.2
    );
    expect(muet.known).toBe(false);
    expect(muet.note).toMatch(/EBC/);
  });

  it('le sucre d’ébullition ne pèse pas dans le pH de la maische', () => {
    const avecSucre = estimateMashPh(
      [...pale, { name: 'Sucre candi', weightKg: 1, kind: 'sucre', use: 'ebullition' }],
      0,
      4.2
    );
    expect(avecSucre.phDistilled).toBeCloseTo(estimateMashPh(pale, 0, 4.2).phDistilled, 2);
  });

  /* La même eau sur une maische mince apporte plus d'alcalinité par kilo de malt. */
  it('⚠️ le rapport eau/grain change le décalage de pH, à alcalinité égale', () => {
    expect(phShiftFromRa(100, 4.5)).toBeGreaterThan(phShiftFromRa(100, 3));
    expect(phShiftFromRa(-100, 4.2)).toBeLessThan(0);
    expect(phShiftFromRa(0, 4.2)).toBe(0);
  });

  it('l’alcalinité résiduelle remonte le pH prédit', () => {
    const sec = estimateMashPh(stout, 0, 4.2);
    const alcalin = estimateMashPh(stout, 120, 4.2);
    expect(alcalin.phPredicted).toBeGreaterThan(sec.phPredicted);
  });
});

describe('La facture de grain ne peut que RELÂCHER la cible d’alcalinité', () => {
  /*
   * ⚠️ La garantie demandée mot pour mot : « je ne veux pas sur-acidifier ».
   * Monter la cible d'AR, c'est demander MOINS d'acide. Le contraire n'est
   * jamais permis : sur une facture douce, c'est la couleur qui tranche et le
   * pH-mètre qui arbitre à la cuve.
   */
  const grists: Array<Array<Record<string, unknown>>> = [
    [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage', colorEbc: 3 }],
    [
      { name: 'Maris Otter', weightKg: 5, kind: 'grain', use: 'empatage', colorEbc: 6 },
      { name: 'Orge rôtie', weightKg: 0.6, kind: 'grain', use: 'empatage', colorEbc: 1300 }
    ],
    [
      { name: 'Pale', weightKg: 5, kind: 'grain', use: 'empatage', colorEbc: 5 },
      { name: 'Malt acidulé', weightKg: 0.5, kind: 'grain', use: 'empatage', colorEbc: 5 }
    ]
  ];

  it('⚠️ jamais une cible plus basse que celle de la couleur seule', () => {
    [null, 6, 25, 45, 80].forEach((ebc) => {
      const couleur = targetRaForColor(ebc);
      grists.forEach((g) => {
        // À 3.5 L/kg, le rapport de référence des fenêtres : au-delà, la
        // fenêtre se divise par ratio/3.5 (Kolbach), et ce n'est pas la facture.
        const avecGrain = targetRaForGrist(ebc, g as never, 3.5);
        expect(avecGrain.max).toBeGreaterThanOrEqual(couleur.max);
        expect(avecGrain.min).toBeGreaterThanOrEqual(couleur.min);
      });
    });
  });

  it('une facture acidulée relâche la cible, et le dit', () => {
    const acidulee = grists[2] as never;
    const band = targetRaForGrist(6, acidulee, 4.2);
    expect(band.max).toBeGreaterThan(targetRaForColor(6).max);
    expect(band.hint).toMatch(/moins d’acide/i);
  });

  it('sans facture lisible, la couleur reste seule maîtresse', () => {
    expect(targetRaForGrist(80, undefined, 3.5)).toEqual(targetRaForColor(80));
    // ⚠️ Maische mince : la même fenêtre, divisée par ratio/3.5 (Kolbach).
    expect(targetRaForGrist(80, undefined, 7).min).toBe(60);
    expect(targetRaForGrist(80, undefined, 7).max).toBe(90);
  });
});

describe('Le houblonnage penche la balance sulfate ⇄ chlorure', () => {
  const fourchette = { min: 0.4, max: 3.0 };

  const amerisante = [
    { weightG: 60, stage: 'boil', timeMin: 60 },
    { weightG: 30, stage: 'whirlpool', timeMin: 20 }
  ];
  const aromatique = [
    { weightG: 20, stage: 'boil', timeMin: 60 },
    { weightG: 120, stage: 'whirlpool', timeMin: 20 },
    { weightG: 200, stage: 'dryHop' }
  ];

  it('⚠️ ne sort JAMAIS de la fourchette du style — le style commande', () => {
    [amerisante, aromatique].forEach((h) => {
      [1.04, 1.05, 1.08].forEach((og) => {
        [15, 40, 90].forEach((ibu) => {
          const hint = hopBalanceHint(h, ibu, og, fourchette);
          expect(hint!.ratio).toBeGreaterThanOrEqual(fourchette.min);
          expect(hint!.ratio).toBeLessThanOrEqual(fourchette.max);
        });
      });
    });
  });

  /*
   * ⚠️ C'est ce que le BU:GU seul confond : deux bières peuvent porter la même
   * amertume et la même densité, et vouloir des eaux opposées. C'est la PART
   * versée pour amériser qui les sépare — une West Coast d'une NEIPA.
   */
  it('⚠️ à amertume et densité ÉGALES, l’aromatique penche moins vers le sulfate', () => {
    const a = hopBalanceHint(amerisante, 50, 1.055, fourchette)!;
    const b = hopBalanceHint(aromatique, 50, 1.055, fourchette)!;
    expect(a.ratio).toBeGreaterThan(b.ratio);
    expect(a.note).toMatch(/sulfate/);
  });

  it('une NEIPA — houblon d’arôme et amertume modérée — va au chlorure', () => {
    const neipa = hopBalanceHint(aromatique, 35, 1.065, fourchette)!;
    expect(neipa.note).toMatch(/chlorure/);
    // Bas de fourchette : c'est bien le chlorure que le style demande.
    expect(neipa.ratio).toBeLessThan((fourchette.min + fourchette.max) / 2);
  });

  it('le houblonnage à cru ne compte pas comme de l’amertume', () => {
    const sansCru = hopBalanceHint(
      aromatique.filter((h) => h.stage !== 'dryHop'),
      50,
      1.055,
      fourchette
    )!;
    const avecCru = hopBalanceHint(aromatique, 50, 1.055, fourchette)!;
    // Ajouter 200 g à cru dilue la part amère : la balance glisse vers le malt.
    expect(avecCru.ratio).toBeLessThan(sansCru.ratio);
  });

  it('sans houblon, sans amertume ou sans densité, il se tait', () => {
    expect(hopBalanceHint([], 50, 1.05, fourchette)).toBeNull();
    expect(hopBalanceHint(amerisante, null, 1.05, fourchette)).toBeNull();
    expect(hopBalanceHint(amerisante, 50, null, fourchette)).toBeNull();
  });
});

describe('⚠️ Où vont les sels change la MAISCHE, pas le moût', () => {
  /*
   * L'AUDIT DU 05.09.2026. Le solveur ignorait `allSaltsInMash`. Il modélisait
   * l'eau d'empâtage comme « sels de saveur au volume TOTAL + sels alcalins au
   * volume d'empâtage » — vrai en répartition proportionnelle, faux dans le
   * mode que l'app recommande ET enregistre par défaut.
   *
   * Sur 20 L d'empâtage pour 30 au total, le calcium réel de la maische vaut
   * 1.5 fois celui qu'il voyait. Il SURESTIMAIT donc son alcalinité résiduelle
   * et sous-dosait les sels alcalins des bières foncées — celles qui en ont
   * précisément besoin.
   */
  const OSM: WaterIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };

  const plan = (code: string, allSaltsInMash: boolean) => {
    const style = styleByCode(code);
    const ratio = (style.ratio.min + style.ratio.max) / 2;
    return solveSalts({
      start: OSM,
      target: rebalanceRatio(midpoint(style), ratio),
      ranges: style.ions,
      totalWaterL: 30,
      mashWaterL: 20,
      targetRa: targetRaForColor(80),
      ratio,
      allSaltsInMash
    });
  };

  it('⚠️ l’impériale atteint sa fenêtre d’AR dans LES DEUX modes', () => {
    [true, false].forEach((tout) => {
      const ra = residualAlkalinity(plan('20C', tout).achievedMash);
      // La fenêtre vise 120 ; le solveur s'arrête à quelques ppm près.
      expect(ra).toBeGreaterThan(110);
    });
  });

  it('⚠️ la maische est PLUS concentrée quand tout y va — et c’est normal', () => {
    const tout = plan('20C', true);
    const prorata = plan('20C', false);
    // Même masse de sel, volume plus petit : le calcium de la maische monte.
    expect(tout.achievedMash.ca).toBeGreaterThan(tout.achievedWort.ca);
    /*
     * En proportionnel, un ion de SAVEUR titre pareil dans les deux eaux — le
     * sulfate, qu'aucun sel alcalin ne transporte. Le calcium ne conviendrait
     * pas : la chaux en apporte, et elle va dans la seule maische MÊME en
     * répartition proportionnelle. La maische y reste donc plus calcique.
     */
    // Tolérance de 2 ppm : c'est le bruit de la balance, les doses étant
    // tronquées au dixième de gramme puis réparties avec un second arrondi.
    expect(Math.abs(prorata.achievedMash.so4 - prorata.achievedWort.so4)).toBeLessThanOrEqual(2);
    // Sans chaux (le bicarbonate suffit depuis que le sel de table ne mange
    // plus le sodium), la maische n'est pas MOINS calcique que le moût.
    expect(prorata.achievedMash.ca).toBeGreaterThanOrEqual(prorata.achievedWort.ca - 0.2);
  });

  /*
   * ⚠️ C'est le MOÛT que le style borne — la bière qu'on boit. Le contrôle
   * lisait la maische : avec tous les sels dedans, il criait au dépassement sur
   * un moût parfaitement dans la cible, et le solveur s'interdisait la chaux
   * dont l'impériale avait besoin.
   */
  it('⚠️ le MOÛT reste dans la fourchette, quel que soit le mode', () => {
    const debordements: string[] = [];
    ['20C', '21C', '05D', '13C'].forEach((code) => {
      const style = styleByCode(code);
      [true, false].forEach((tout) => {
        const r = plan(code, tout);
        (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
          if (r.achievedWort[ion] > style.ions[ion].max + 2) {
            debordements.push(`${code}/${tout ? 'tout' : 'prorata'} : ${ion} ${r.achievedWort[ion]}`);
          }
        });
      });
    });
    expect(debordements).toEqual([]);
  });

  /*
   * ⚠️ Une seule convention dans toute l'app : ABSENT = TOUT À L'EMPÂTAGE.
   * L'atelier lisait `?? false` là où l'assistant lisait `!== false` : sur une
   * recette sans le champ, l'écran montrait une répartition proportionnelle
   * pendant que le plan enregistré disait l'inverse.
   */
  it('⚠️ absent vaut « tout à l’empâtage », partout', () => {
    expect(splitDoses({ gypse: 9 }, 20, 10).mash.gypse).toBe(9);
    expect(splitDoses({ gypse: 9 }, 20, 10).sparge.gypse).toBeUndefined();
    expect(waterFromPlan(OSM, { gypse: 9 }, 20, 10).sparge.so4).toBe(0);
    // Le solveur aussi : sans le drapeau, il raisonne tout-à-l'empâtage.
    const sansDrapeau = solveSalts({
      start: OSM,
      target: rebalanceRatio(midpoint(styleByCode('20C')), 0.65),
      ranges: styleByCode('20C').ions,
      totalWaterL: 30,
      mashWaterL: 20,
      targetRa: targetRaForColor(80),
      ratio: 0.65
    });
    expect(sansDrapeau.achievedSparge.so4).toBe(0);
  });
});

describe('Lire un profil d’eau collé depuis une recette', () => {
  it('lit la forme courante — symboles, virgules, ppm', () => {
    const r = parseWaterTarget('Target water: Ca 110, Mg 5, Na 12, SO4 200, Cl 55, HCO3 0 ppm');
    expect(r.ions).toEqual({ ca: 110, mg: 5, na: 12, so4: 200, cl: 55, hco3: 0 });
    expect(r.found).toHaveLength(6);
  });

  it('lit les noms complets, en français comme en anglais', () => {
    const fr = parseWaterTarget(
      'calcium : 90 ppm · magnésium : 8 · sodium : 15 · sulfate : 150 · chlorure : 75 · bicarbonate : 40'
    );
    expect(fr.ions).toEqual({ ca: 90, mg: 8, na: 15, so4: 150, cl: 75, hco3: 40 });
    const en = parseWaterTarget('Calcium 90, Magnesium 8, Sodium 15, Sulphate 150, Chloride 75');
    expect(en.ions.so4).toBe(150);
    expect(en.ions.cl).toBe(75);
  });

  /*
   * ⚠️ « mg/L » suit CHAQUE valeur d'une analyse. Un motif « mg » suivi d'un
   * nombre attrapait donc le chiffre du voisin de gauche : le magnésium prenait
   * la valeur du calcium, silencieusement.
   */
  it('⚠️ « mg/L » est une unité, pas du magnésium', () => {
    const r = parseWaterTarget('Ca 110 mg/L, Mg 5 mg/L, Na 12 mg/L, SO4 200 mg/L');
    expect(r.ions.ca).toBe(110);
    expect(r.ions.mg).toBe(5);
    expect(r.ions.na).toBe(12);
  });

  /*
   * ⚠️ L'alcalinité s'écrit souvent en CaCO₃. 50 ppm de CaCO₃ valent 61 de
   * bicarbonate : les confondre fausse la cible d'un cinquième, et l'acide avec.
   */
  it('⚠️ convertit une alcalinité donnée en CaCO₃', () => {
    const r = parseWaterTarget('Ca 50, Alkalinity 50 as CaCO3');
    expect(r.alkalinityAsCaCO3).toBe(true);
    expect(r.ions.hco3).toBeCloseTo(61, 0);
  });

  it('une alcalinité en bicarbonate reste telle quelle', () => {
    const r = parseWaterTarget('Ca 50, HCO3 50');
    expect(r.alkalinityAsCaCO3).toBe(false);
    expect(r.ions.hco3).toBe(50);
  });

  /* ⚠️ Le « Ca » de CaCl₂ n'est pas une teneur en calcium. */
  it('⚠️ ne prend pas un nom de sel pour une teneur', () => {
    const r = parseWaterTarget('Ajouter 4 g de CaCl2 et 2 g de CaSO4');
    expect(r.found).not.toContain('ca');
  });

  it('ce qui manque reste à zéro, et se dit', () => {
    const r = parseWaterTarget('Ca 110, SO4 200');
    expect(r.found).toEqual(['ca', 'so4']);
    expect(r.ions.cl).toBe(0);
  });

  it('un texte sans profil ne trouve rien plutôt que d’inventer', () => {
    expect(parseWaterTarget('Empâter à 67 °C pendant 60 minutes.').found).toEqual([]);
    expect(parseWaterTarget('').found).toEqual([]);
  });
});

describe('Une cible chiffrée devient une fourchette', () => {
  const cible: WaterIons = { ca: 110, mg: 5, na: 12, so4: 200, cl: 55, hco3: 0 };

  it('ouvre ±20 %, avec un plancher de ±10 ppm', () => {
    const s = styleFromTargetIons(cible);
    expect(s.ions.ca).toEqual({ min: 88, max: 132 }); // 110 ± 22
    // ⚠️ 20 % de 5 ppm ne ferait qu'une fenêtre de 2 ppm : le plancher joue.
    expect(s.ions.mg).toEqual({ min: 0, max: 15 });
    expect(s.ions.so4).toEqual({ min: 160, max: 240 });
  });

  it('⚠️ ne descend jamais sous zéro', () => {
    const s = styleFromTargetIons({ ...cible, na: 4, hco3: 0 });
    expect(s.ions.na.min).toBe(0);
    expect(s.ions.hco3.min).toBe(0);
  });

  it('le rapport SO₄:Cl vient du point, avec la même marge', () => {
    const s = styleFromTargetIons(cible); // 200 / 55 = 3.64
    expect(s.ratio.min).toBeCloseTo(2.9, 1);
    expect(s.ratio.max).toBeCloseTo(4.4, 1);
  });

  it('sans chlorure, le rapport n’a pas de sens : on retombe sur l’équilibre', () => {
    const s = styleFromTargetIons({ ...cible, cl: 0 });
    expect(s.ratio.min).toBeCloseTo(0.8, 1);
    expect(s.ratio.max).toBeCloseTo(1.2, 1);
  });

  it('porte le code des cibles personnalisées et son nom', () => {
    const s = styleFromTargetIons(cible, 'Eau de la recette BYO');
    expect(s.code).toBe(CUSTOM_STYLE_CODE);
    expect(s.name).toBe('Eau de la recette BYO');
    expect(s.note).toMatch(/±20/);
  });

  /* La cible saisie doit tomber DANS sa propre fourchette — sinon rien ne va. */
  it('le point visé est toujours dans la fourchette qu’il engendre', () => {
    const s = styleFromTargetIons(cible);
    (['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as Array<keyof WaterIons>).forEach((ion) => {
      expect(positionInRange(cible[ion], s.ions[ion])).toBe(0);
    });
  });
});

/*
 * Audit du 05.09.2026, second passage : ce que la couleur ne sait pas, la
 * facture le dit ; ce que le solveur ne voyait pas, le rinçage coupé.
 */
describe('Audit 05.09 — facture, rinçage coupé, magnésium, unités', () => {
  const STOUT = [
    { name: 'Pale', weightKg: 4.6, colorEbc: 6 },
    { name: 'Crystal', weightKg: 0.55, colorEbc: 300 },
    { name: 'Roasted barley', weightKg: 0.55, colorEbc: 1000 }
  ];
  const PILS = [{ name: 'Pilsner', weightKg: 5.7, colorEbc: 4 }];

  const solve = (
    code: string,
    start: WaterIons,
    extra: Partial<Parameters<typeof solveSalts>[0]> = {},
    ebc = 80
  ) => {
    const style = styleByCode(code);
    const ratio = (style.ratio.min + style.ratio.max) / 2;
    return solveSalts({
      start,
      target: rebalanceRatio(midpoint(style), ratio),
      ranges: style.ions,
      totalWaterL: 30,
      mashWaterL: 20,
      targetRa: targetRaForColor(ebc),
      ratio,
      allSaltsInMash: true,
      ...extra
    });
  };

  it('ΔpH = (AR/50) · ratio / B, B = 45 meq/(kg·pH)', () => {
    expect(MALT_BUFFER_MEQ_PER_KG_PH).toBe(45);
    // 136 ppm d'AR (Fribourg) à 3.5 L/kg : 2.72 meq/L × 3.5 ÷ 45 = 0.21
    expect(phShiftFromRa(136, 3.5)).toBeCloseTo(0.21, 2);
  });

  it('1 % de malt acidulé abaisse le pH de 0.1 (Weyermann)', () => {
    const sans = estimateMashPh(PILS, 0, 3.5).phDistilled;
    const avec = estimateMashPh(
      [{ name: 'Pilsner', weightKg: 9.9, colorEbc: 4 }, { name: 'Acidulated', weightKg: 0.1, colorEbc: 4 }],
      0,
      3.5
    ).phDistilled;
    expect(sans - avec).toBeCloseTo(0.1, 1);
  });

  it('l’acide vise le MILIEU de la fenêtre, pas le haut', () => {
    /*
     * ⚠️ −22 et non −30 : depuis que la fenêtre glisse, 8 EBC n'est plus au
     * centre de la classe « pâle » mais deux points au-dessus de son repère.
     * La cible d'acide MONTE donc de 8 ppm — c'est-à-dire un demi-millilitre de
     * MOINS à verser. La garantie « jamais une goutte de plus » tient.
     */
    expect(raAcidTarget(targetRaForColor(8))).toBe(-22);
    expect(raAcidTarget(targetRaForColor(6))).toBe(-30); // le repère, inchangé
    // 136 − (−22) = 158 ppm × 61/50 × 20 L ÷ 600 = 6.43 mL
    expect(acidNeeded(FRIBOURG, 20, raAcidTarget(targetRaForColor(8))).amount).toBeCloseTo(6.4, 1);
  });

  it('⚠️ la facture PLAFONNE les sels alcalins que la couleur réclame', () => {
    const ceiling = raForGrist(STOUT, 20 / 5.7);
    expect(ceiling).not.toBeNull();
    expect(ceiling!).toBeLessThan(0);
    const aveugle = solve('20C', OSMOSEE);
    const eclaire = solve('20C', OSMOSEE, { raCeiling: ceiling });
    const alcalins = (d: typeof aveugle.doses) => (d.chaux ?? 0) + (d.nahco3 ?? 0) + (d.caco3 ?? 0);
    expect(alcalins(eclaire.doses)).toBeLessThan(alcalins(aveugle.doses));
    // Et le pH prédit sur cette eau retombe dans la fenêtre.
    const ph = estimateMashPh(STOUT, residualAlkalinity(eclaire.achievedMash), 20 / 5.7).phPredicted;
    expect(ph).toBeGreaterThanOrEqual(MASH_PH_BAND.min);
    expect(ph).toBeLessThanOrEqual(MASH_PH_BAND.max);
  });

  /*
   * ⚠️ « Pour une stout ou une impériale, avec de l'eau très osmosée, Doser
   * n'ajoute pas de HCO₃. »
   *
   * Le plafond de facture était `raForGrist`, qui vise le MILIEU de la fenêtre
   * de pH : sur une stout à 5.47 en eau distillée il vaut −47, et le solveur se
   * donnait donc pour cible −47 d'AR sur une bière dont le style demande +120.
   * L'AR obtenue par le seul calcium du gypse et du CaCl₂ étant déjà plus
   * basse, il n'avait rien à faire — pas un gramme, et pas un mot, pendant que
   * la toile allumait l'alarme du bicarbonate à zéro.
   *
   * Le plafond des SELS vise maintenant le HAUT de la fenêtre : « jusqu'où
   * peut-on suivre la couleur sans faire monter la maische trop haut ».
   */
  it('⚠️ une stout sur osmosée reçoit du bicarbonate, et le solveur dit pourquoi il n’en met pas plus', () => {
    const ratio = 20 / 5.7;
    const plafond = raSaltCeilingForGrist(STOUT, ratio)!;
    expect(plafond).toBeGreaterThan(raForGrist(STOUT, ratio)!);

    const r = solve('20C', OSMOSEE, { raCeiling: plafond });

    // 1. Du bicarbonate, vraiment — c'est le défaut signalé.
    expect((r.doses.nahco3 ?? 0) + (r.doses.chaux ?? 0) + (r.doses.caco3 ?? 0)).toBeGreaterThan(0);
    expect(r.achievedWort.hco3).toBeGreaterThan(0);

    // 2. Mais pas au prix du pH : la maische reste dans sa fenêtre.
    const ph = estimateMashPh(STOUT, residualAlkalinity(r.achievedMash), ratio).phPredicted;
    expect(ph).toBeGreaterThanOrEqual(MASH_PH_BAND.min);
    expect(ph).toBeLessThanOrEqual(MASH_PH_BAND.max);

    // 3. Et l'écart avec la fourchette du style est DIT, pas subi en silence.
    expect(r.unreachable.join(' ')).toMatch(/la facture limite l’objectif à .* au lieu des 120/);
  });

  /*
   * Le pendant : un plafond NÉGATIF reste négatif. Le forcer à zéro « pour que
   * la toile soit verte » ferait monter la maische au-dessus de 5.5, ce qui est
   * précisément ce que le plafond existe pour empêcher.
   */
  it('⚠️ le plafond de facture peut rester négatif — c’est le pH qui commande', () => {
    const ratio = 3.5;
    /* Une facture plus torréfiée encore : elle se suffit à elle-même. */
    const TRES_NOIRE = [
      { name: 'Pale', weightKg: 4.0, colorEbc: 6 },
      { name: 'Flocons', weightKg: 0.6, colorEbc: 4 },
      { name: 'Orge torréfié', weightKg: 0.5, colorEbc: 1200 }
    ];
    const plafond = raSaltCeilingForGrist(TRES_NOIRE, ratio)!;
    expect(plafond).toBeLessThan(0);

    const r = solve('20C', OSMOSEE, { raCeiling: plafond });
    const ph = estimateMashPh(TRES_NOIRE, residualAlkalinity(r.achievedMash), ratio).phPredicted;
    expect(ph).toBeLessThanOrEqual(MASH_PH_BAND.max);
  });

  it('⚠️ le rinçage coupé à l’osmosée entre dans le moût que juge le solveur', () => {
    const sparge = dilute(FRIBOURG, 90);
    const r = solve('13C', FRIBOURG, { startSparge: sparge, totalWaterL: 31, mashWaterL: 18.5 }, 45);
    const w = waterFromPlan(FRIBOURG, r.doses, 18.5, 12.5, sparge, true);
    (['ca', 'so4', 'cl', 'hco3'] as Array<keyof WaterIons>).forEach((ion) => {
      const vrai = (w.mash[ion] * 18.5 + w.sparge[ion] * 12.5) / 31;
      expect(r.achievedWort[ion]).toBeCloseTo(vrai, 0);
    });
    // Sans le rinçage coupé, le solveur voyait 31 ppm de calcium de trop.
    expect(r.achievedWort.hco3).toBeLessThan(200);
  });

  /*
   * ⚠️ QUESTION OUVERTE, POSÉE À GAËTAN LE 06.09.2026, ET NON TRANCHÉE ICI.
   *
   * « Le solveur n'ajoute quasiment jamais de magnésium — on devrait viser un
   * profil cohérent et dans la moyenne, pas le minimum de chaque ion. » C'est
   * exact : mesuré sur 261 plans, ZÉRO n'en recevait. Le reste du profil, lui,
   * est déjà centré : Ca 0.57, SO₄ 0.56, Na 0.50, Cl 0.37 de leur fourchette.
   *
   * Quatre configurations ont été essayées et mesurées. Aucune n'est gratuite,
   * parce qu'on ne monte pas le magnésium sans monter le sulfate ou le
   * chlorure — il n'entre que par l'Epsom ou le MgCl₂ :
   *
   *   config                        Ca    Mg    Na   SO₄    Cl   ce qui cède
   *   aujourd'hui                 0.57  0.15  0.50  0.56  0.37   Mg et Na à 0
   *   Mg au milieu, Ca au plancher 0.40  0.49  0.50  0.57  0.44   le calcium
   *   + sodium dosé en amont       0.44  0.49  0.55  0.64  0.49   le calcium
   *   + calcium à sa cible         0.73  0.49  0.57  0.83  0.72   le sulfate
   *
   * La dernière pousse le sulfate à 0.96 de médiane — près du plafond. Et la
   * troisième a fait apparaître une oscillation du choix chaux/bicarbonate
   * entre 46 et 48 % d'osmosée, qui reste à corriger.
   *
   * On revient donc au comportement vérifié en attendant l'arbitrage : c'est
   * un choix sur SA bière, pas un bug à un seul bon correctif.
   */
  it('⚠️ le magnésium ne vise que le PLANCHER du style, au rapport SO₄:Cl demandé', () => {
    const r = solve('—', OSMOSEE, {}, 20);
    const floor = styleByCode('—').ions.mg.min;
    expect(r.achievedWort.mg).toBeGreaterThanOrEqual(floor - 1);
    expect(r.achievedWort.mg).toBeLessThan(floor + 3);
    expect(r.achievedWort.so4 / r.achievedWort.cl).toBeCloseTo(102 / 98, 1);
  });

  it('sodium modéré sur une stout, prioritaire sur une Gose', () => {
    const stout = solve('20C', FRIBOURG, {}, 376);
    // The global fit uses 1 g to carry chloride when calcium is constrained.
    // Test the resulting sodium, not the old order's exclusion of table salt.
    expect(stout.achievedWort.na).toBeLessThan(40);
    expect(stout.achievedWort.na).toBeLessThan(styleByCode('20C').ions.na.max);
    const gose = solve('27', OSMOSEE, {}, 8);
    expect(gose.doses.nacl ?? 0).toBeGreaterThan(0);
    expect(gose.achievedWort.na).toBeGreaterThan(40);
  });

  it('la craie ne se voit prêter que 75 ppm d’AR', () => {
    const r = solve('20C', OSMOSEE, { disabled: ['nahco3', 'chaux'] });
    const raCraie = ((r.doses.caco3 ?? 0) / 20) * netRaPerGramPerLitre('caco3');
    expect(raCraie).toBeLessThanOrEqual(CHALK_RA_CAP_PPM + 1);
  });

  it('un appel sans fourchettes ne plante pas', () => {
    expect(() =>
      solveSalts({ start: OSMOSEE, target: midpoint(styleByCode('05D')), totalWaterL: 20, mashWaterL: 20 } as never)
    ).not.toThrow();
  });

  it('⚠️ TAC en °fH et Karbonathärte en °dH sont convertis en HCO₃', () => {
    const fh = parseWaterTarget('Ca 85, Mg 14, TAC 20.5 °fH');
    expect(fh.alkalinityUnit).toBe('fH');
    expect(fh.ions.hco3).toBeCloseTo(250, 0);
    const dh = parseWaterTarget('Calcium 85, Karbonathärte 11.5 °dH');
    expect(dh.alkalinityUnit).toBe('dH');
    expect(dh.ions.hco3).toBeCloseTo(250.7, 0);
    expect(parseWaterTarget('HCO3 250').alkalinityUnit).toBe('hco3');
  });

  it('la pureté d’un sel pèse sur ses ions', () => {
    const def = SALTS.cacl2;
    const avant = saltIons('cacl2').ca!;
    def.purity = 0.8;
    try {
      expect(saltIons('cacl2').ca!).toBeCloseTo(avant * 0.8, 1);
    } finally {
      delete def.purity;
    }
  });
});

/*
 * ⚠️ Demandé ainsi : « je veux qu'on calcule si je dois ajouter de l'acide ou
 * pas… une fois au mash pendant le brassage ». `acidCorrectionFromMeasuredPh`
 * répond à ce qu'un pH relevé au pH-mètre laissait jusqu'ici sans suite.
 */
describe('Correction d’acide sur pH relevé pendant le brassage', () => {
  /*
   * Même conversion que `acidNeeded` — 61/50 pour passer des ppm CaCO₃ aux mg
   * de HCO₃⁻ — appliquée à l'AR IMPLIQUÉE par l'écart de pH plutôt qu'à l'AR
   * mesurée sur les ions. Calcul à la main :
   *   Δph = 5.7 − 5.4 = 0.3
   *   ΔAR = 0.3 × (50×45) ÷ 3.5 = 192.857 ppm CaCO₃
   *   mg  = 192.857 × 61/50 × 20 L = 4705.7
   *   mL  = 4705.7 ÷ 600 (lactique) = 7.84
   */
  it('⚠️ un pH mesuré au-dessus de la fenêtre chiffre la correction en mL', () => {
    const c = acidCorrectionFromMeasuredPh(5.7, 20, 3.5, 'lactique');
    expect(c.deltaPh).toBeCloseTo(0.3, 2);
    expect(c.amount).toBeCloseTo(7.8, 1);
    expect(c.unit).toBe('mL');
  });

  it('à la limite haute de la fenêtre (5.5), rien à ajouter', () => {
    expect(acidCorrectionFromMeasuredPh(MASH_PH_BAND.max, 20, 3.5).amount).toBe(0);
  });

  /*
   * ⚠️ LA RÈGLE DE SÛRETÉ. En dessous de la fenêtre, la maische est déjà plus
   * acide qu'il ne faut : la fonction ne réclame jamais de sel alcalin pour
   * faire remonter un pH, elle dit seulement qu'il n'y a rien à verser.
   */
  it('⚠️ un pH mesuré sous la fenêtre ne réclame jamais d’acide', () => {
    expect(acidCorrectionFromMeasuredPh(5.1, 20, 3.5).amount).toBe(0);
    expect(acidCorrectionFromMeasuredPh(MASH_PH_BAND.min, 20, 3.5).amount).toBe(0);
  });

  it('une maische plus ÉPAISSE (ratio plus haut) réclame moins d’acide, à écart de pH égal', () => {
    // La même alcalinité déplace davantage un rapport eau/grain élevé
    // (`phShiftFromRa`) : il en faut donc RETIRER moins pour le même ΔpH.
    const mince = acidCorrectionFromMeasuredPh(5.7, 20, 3.5, 'lactique').amount;
    const epaisse = acidCorrectionFromMeasuredPh(5.7, 20, 7, 'lactique').amount;
    expect(epaisse).toBeCloseTo(mince / 2, 1);
  });

  it('l’acide phosphorique, plus fort, demande moins de volume que le lactique', () => {
    const lactique = acidCorrectionFromMeasuredPh(5.7, 20, 3.5, 'lactique').amount;
    const phosphorique = acidCorrectionFromMeasuredPh(5.7, 20, 3.5, 'phosphorique').amount;
    expect(phosphorique).toBeLessThan(lactique);
    expect(phosphorique).toBeCloseTo(6.3, 1);
  });

  it('sans volume d’empâtage posé, ne calcule rien plutôt que de diviser par zéro', () => {
    expect(acidCorrectionFromMeasuredPh(5.7, 0, 3.5).amount).toBe(0);
  });

  it('un pH non renseigné (NaN) ne casse rien', () => {
    const c = acidCorrectionFromMeasuredPh(NaN, 20, 3.5);
    expect(c.amount).toBe(0);
    expect(Number.isFinite(c.deltaPh)).toBe(true);
  });
});

/*
 * ⚠️ Seconde passe : la correction ne doit pas INVENTER ce qui lui manque.
 * Elle retombait silencieusement sur 3.5 L/kg quand la facture de grain était
 * absente, et annonçait quand même des millilitres avec l'aplomb d'un calcul.
 */
describe('Correction d’acide — ce qu’elle refuse de deviner', () => {
  it('⚠️ sans rapport eau/grain, elle ne chiffre RIEN et le dit', () => {
    const c = acidCorrectionFromMeasuredPh(5.7, 20, 0, 'lactique');
    expect(c.known).toBe(false);
    expect(c.amount).toBe(0);
  });

  it('⚠️ le rapport inventé valait un facteur deux sur la dose', () => {
    // C'est l'écart que le repli silencieux à 3.5 L/kg pouvait produire.
    const mince = acidCorrectionFromMeasuredPh(5.7, 20, 3.5, 'lactique');
    const epaisse = acidCorrectionFromMeasuredPh(5.7, 20, 7, 'lactique');
    expect(mince.amount / epaisse.amount).toBeCloseTo(2, 1);
  });

  /*
   * La correction n'a besoin QUE du rapport eau/grain — pas de la couleur des
   * malts. Elle doit donc rester chiffrable là où `estimateMashPh`, qui exige
   * les couleurs, renonce.
   */
  it('reste chiffrable même quand le pH ESTIMÉ, lui, ne l’est pas', () => {
    const sansCouleur = estimateMashPh([{ name: 'Pilsner', weightKg: 5 }], 0, 3.5);
    expect(sansCouleur.known).toBe(false);
    expect(acidCorrectionFromMeasuredPh(5.7, 20, 3.5).known).toBe(true);
  });

  it('un volume d’empâtage absent est aussi un refus, pas un zéro tranquille', () => {
    expect(acidCorrectionFromMeasuredPh(5.7, 0, 3.5).known).toBe(false);
  });

  it('dans la fenêtre, la réponse est connue ET vaut zéro', () => {
    const c = acidCorrectionFromMeasuredPh(5.3, 20, 3.5);
    expect(c.known).toBe(true);
    expect(c.amount).toBe(0);
  });
});

/*
 * ⚠️ « On voit directement les changements dans le spidergraph. » Les sels
 * APPORTENT des ions, l'acide en RETIRE un : l'eau qu'on verse est le résultat
 * des deux, et c'est elle que la toile doit montrer.
 */
describe('L’eau une fois l’acide versé', () => {
  const EAU = { ...FRIBOURG };

  it('retire le bicarbonate à hauteur de la force de l’acide', () => {
    // 5 mL de lactique à 600 mg de HCO₃/mL, sur 20 L : 150 ppm retirés.
    const apres = ionsAfterAcid(EAU, 5, 'lactique', 20);
    expect(EAU.hco3 - apres.hco3).toBeCloseTo(150, 0);
  });

  it('⚠️ ne touche à AUCUN autre ion — un acide ne dépose rien', () => {
    const apres = ionsAfterAcid(EAU, 5, 'lactique', 20);
    (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
      expect(apres[ion]).toBe(EAU[ion]);
    });
  });

  it('le phosphorique, plus fort, en retire davantage à volume égal', () => {
    const lactique = ionsAfterAcid(EAU, 5, 'lactique', 20).hco3;
    const phospho = ionsAfterAcid(EAU, 5, 'phosphorique', 20).hco3;
    expect(phospho).toBeLessThan(lactique);
  });

  it('ne descend jamais sous zéro, même surdosé', () => {
    expect(ionsAfterAcid(EAU, 999, 'lactique', 20).hco3).toBe(0);
  });

  it('sans dose ni volume, elle rend l’eau intacte', () => {
    expect(ionsAfterAcid(EAU, 0, 'lactique', 20)).toEqual(EAU);
    expect(ionsAfterAcid(EAU, 5, 'lactique', 0)).toEqual(EAU);
  });
});

/*
 * ⚠️ « Tous les warnings de seuil, uniquement utiles quand c'est vraiment le
 * cas. » Une phrase juste au mauvais moment apprend à ne plus lire les
 * avertissements.
 */
describe('Les avertissements de seuil ne parlent qu’au seuil', () => {
  const eau = (over: Partial<WaterIons> = {}): WaterIons => ({
    ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0, ...over
  });

  it('le sel de table se tait à 12 ppm de sodium, parle à 130', () => {
    expect(saltCautions({ nacl: 0.4 }, [], eau({ na: 12 }), 30)).toEqual([]);

    const proche = saltCautions({ nacl: 6 }, [], eau({ na: 130 }), 30);
    expect(proche).toHaveLength(1);
    expect(proche[0].id).toBe('nacl');
    expect(proche[0].text).toMatch(/^Sodium à 130 ppm —/);
    // Approché, pas franchi : ton d'information, pas d'alarme.
    expect(proche[0].franchi).toBe(false);

    expect(saltCautions({ nacl: 8 }, [], eau({ na: 165 }), 30)[0].franchi).toBe(true);
  });

  it('exactement 80 % du seuil déclenche, 79 % non', () => {
    expect(saltCautions({ epsom: 1 }, [], eau({ mg: 24 }), 30)).toHaveLength(1);
    expect(saltCautions({ epsom: 1 }, [], eau({ mg: 23.6 }), 30)).toEqual([]);
    expect(CAUTION_APPROACH).toBe(0.8);
  });

  it('le potassium du KCl se lit sur la DOSE : aucun ion ne le porte', () => {
    // 524.4 ppm par g/L : 2.3 g dans 30 L = 40 ppm, soit 80 % de 50.
    expect(saltCautions({ kcl: 2.3 }, [], eau(), 30)).toHaveLength(1);
    expect(saltCautions({ kcl: 1 }, [], eau(), 30)).toEqual([]);
    // Et l'eau du moût n'y change rien : c'est bien la dose qu'on lit.
    expect(saltCautions({ kcl: 1 }, [], eau({ cl: 400 }), 30)).toEqual([]);
  });

  it('un fait de MANIPULATION n’a pas de seuil : il vaut dès le premier gramme', () => {
    const c = saltCautions({ cacl2: 0.1 }, [], eau(), 30);
    expect(c).toHaveLength(1);
    expect(c[0].text).toMatch(/dihydrate/);
    // Pas de valeur en tête : il n'y a pas de seuil à situer.
    expect(c[0].text).not.toMatch(/ppm —/);
  });

  it('un sel écarté, ou non pesé, ne dit rien', () => {
    expect(saltCautions({ nacl: 8 }, ['nacl'], eau({ na: 165 }), 30)).toEqual([]);
    expect(saltCautions({ nacl: 0 }, [], eau({ na: 165 }), 30)).toEqual([]);
    expect(saltCautions(undefined, undefined, eau({ na: 165 }), 30)).toEqual([]);
  });

  it('le seuil de goût de l’acide lactique est le MÊME des deux côtés', () => {
    // Une note qui annonce 0.3 pendant qu'une alerte part à 0.4 est pire
    // qu'aucune note : on ne sait plus lequel des deux chiffres croire.
    expect(ACIDS.lactique.taste!.gPerL).toBe(LACTATE_TASTE_THRESHOLD);
    expect(ACIDS.lactique.taste!.text).toMatch(String(LACTATE_TASTE_THRESHOLD));
    // Les acides sans seuil de perception n'en déclarent pas.
    expect(ACIDS.phosphorique.taste).toBeUndefined();
  });
});

/*
 * ⚠️ « On utilise beaucoup la couleur EBC pour le calcul, mais est-ce vraiment
 * correct ? Si ma hazy IPA est plus sombre ou plus claire je m'en fiche. »
 *
 * Ces tests fixent la réponse pour qu'elle ne se perde pas : la couleur ne
 * touche QUE l'alcalinité, elle cède le pas dès que la facture parle, et elle
 * n'a aucune influence sur le profil de goût.
 */
describe('Ce que la couleur commande, et ce qu’elle ne commande pas', () => {
  const CLAIRE = [
    { name: 'Pilsner', weightKg: 5.0, colorEbc: 4 },
    { name: 'Blé', weightKg: 1.0, colorEbc: 4 }
  ];
  /* Le cas d'école : 5 EBC, invisible à la couleur, et franchement acide. */
  const PILS_ACIDULE = [
    { name: 'Pilsner', weightKg: 5.4, colorEbc: 4 },
    { name: 'Malt acidulé', weightKg: 0.3, colorEbc: 5 }
  ];

  it('⚠️ la couleur ne déplace AUCUN ion de goût : deux teintes, un seul profil', () => {
    const style = styleByCode('21C'); // Hazy IPA
    const commun = {
      start: { ...OSMOSEE },
      target: rebalanceRatio(midpoint(style), 1),
      ranges: style.ions,
      totalWaterL: 30,
      mashWaterL: 20,
      ratio: 1,
      allSaltsInMash: true
    };
    /* Deux teintes de la MÊME classe : la comparaison entre classes est
       traitée à part — voir la marche mesurée aux seuils. */
    const claire = solveSalts({ ...commun, targetRa: targetRaForColor(6) });
    const foncee = solveSalts({ ...commun, targetRa: targetRaForColor(12) });

    (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
      expect(claire.achievedWort[ion]).toBeCloseTo(foncee.achievedWort[ion], 1);
    });
    expect(claire.doses).toEqual(foncee.doses);
  });

  /*
   * La couleur n'est qu'un SUBSTITUT de l'acidité du grain. Dès que la facture
   * est connue, c'est elle qui corrige — et l'écran doit le dire.
   */
  it('⚠️ la facture reprend la main sur la couleur, et le dit', () => {
    const ratio = 3.5;
    const parLaCouleur = targetRaForColor(8);
    const parLaFacture = targetRaForGrist(8, PILS_ACIDULE, ratio);

    expect(parLaFacture.min).toBeGreaterThan(parLaCouleur.min);
    expect(parLaFacture.from).toBe('facture');
    expect(parLaFacture.hint).toMatch(/ta facture/);

    // Sans facture, la couleur reste seule aux commandes, et ne le cache pas.
    expect(targetRaForGrist(8, undefined, ratio).from).toBeUndefined();
  });

  /*
   * ⚠️ ET ELLE NE PEUT QUE RELÂCHER. Une facture PLUS douce que sa couleur ne
   * durcit pas la cible : c'est la garantie « jamais une goutte d'acide de
   * plus ». Les sels alcalins, eux, sont bornés séparément.
   */
  it('une facture plus douce que sa couleur ne durcit pas la fenêtre', () => {
    const parLaCouleur = targetRaForColor(80);
    const parLaFacture = targetRaForGrist(80, CLAIRE, 3.5);
    expect(parLaFacture.min).toBe(parLaCouleur.min);
    expect(parLaFacture.max).toBe(parLaCouleur.max);
  });
});

/*
 * ⚠️ LA MARCHE RÉSIDUELLE, ÉPINGLÉE POUR QU'ELLE NE SE DÉPLACE PAS EN SILENCE.
 *
 * La fenêtre glisse maintenant continûment, mais UNE décision reste booléenne :
 * achète-t-on de l'alcalinité, oui ou non. Elle bascule au moment où le
 * plancher de la fenêtre passe zéro — 21 EBC — et l'eau saute alors de rien à
 * 3.9 g de bicarbonate, parce qu'à cet instant la cible vaut 0 et l'eau
 * osmosée additionnée de ses sels de goût est à −100.
 *
 * On ne peut pas la faire disparaître sans inventer une rampe sans fondement
 * brassicole. On peut en revanche la POSER là où elle nuit le moins : 21 EBC,
 * c'est une ambrée franche, loin des pâles et des IPA — là où elle était
 * (12 EBC), elle traversait toutes les Hazy IPA.
 */
describe('Le seuil d’achat d’alcalinité, et lui seul', () => {
  const balaye = (de: number, a: number) => {
    const sauts: Array<{ ebc: number; delta: number }> = [];
    const style = styleByCode('21C');
    let precedent: number | null = null;
    for (let ebc = de; ebc <= a; ebc += 1) {
      const r = solveSalts({
        start: { ...OSMOSEE },
        target: rebalanceRatio(midpoint(style), 1),
        ranges: style.ions,
        totalWaterL: 30,
        mashWaterL: 20,
        ratio: 1,
        targetRa: targetRaForColor(ebc),
        allSaltsInMash: true
      });
      // Grams of lime and bicarbonate are not interchangeable. Check their
      // actual alkalinity; waterSweep also checks continuity of all six ions.
      const alcalins = residualAlkalinity(r.achievedMash);
      if (precedent !== null && Math.abs(alcalins - precedent) > 10) {
        sauts.push({ ebc, delta: alcalins - precedent });
      }
      precedent = alcalins;
    }
    return sauts;
  };

  it('⚠️ une seule marche sur toute l’échelle, et elle est à 21 EBC', () => {
    const sauts = balaye(2, 90);
    expect(sauts).toHaveLength(1);
    expect(sauts[0].ebc).toBe(21);
  });

  /* Le point du défaut signalé : plus rien ne bouge autour d'une Hazy IPA. */
  it('⚠️ rien ne saute entre 4 et 20 EBC — la zone des pâles et des IPA', () => {
    expect(balaye(4, 20)).toEqual([]);
  });

  /* Les deux autres marches d'avant — 30 et 60 EBC — ont disparu. */
  it('⚠️ ni autour de 30, ni autour de 60 EBC', () => {
    expect(balaye(25, 70)).toEqual([]);
  });
});

/*
 * ⚠️ « Le HCO₃ n'est pas toujours dans le target. »
 *
 * Le même écran donnait deux verdicts contraires sur la même eau : le panneau
 * jugeait l'alcalinité sur l'AR — qui retranche le calcium — et la toile sur le
 * bicarbonate brut du profil de style, qui l'ignore. Mesuré sur 145
 * combinaisons style × eau : 37 % tombaient hors de la fourchette du style
 * alors que l'AR était sur sa cible.
 */
describe('La fenêtre d’alcalinité, retraduite en bicarbonate', () => {
  const eau = (ca: number, mg: number) => ({ ca, mg });

  it('⚠️ inverse exactement la définition de Kolbach', () => {
    const bande = { min: -46, max: 14 };
    const b = hco3BandForRa(bande, eau(68, 5));
    // compensation = 68/1.4 + 5/1.7 = 48.6 + 2.9 = 51.5 ppm de CaCO₃
    // bas  = (-46 + 51.5) × 61/50 = 6.7   →  7
    // haut = ( 14 + 51.5) × 61/50 = 79.9  →  80
    expect(b.min).toBe(7);
    expect(b.max).toBe(80);
  });

  /* Aller-retour : une eau posée sur une borne y retombe. */
  it('une eau dont l’AR vaut la borne tombe sur la borne', () => {
    for (const [ca, mg] of [[0, 0], [68, 5], [150, 30], [275, 40]] as Array<[number, number]>) {
      for (const cible of [-60, -30, 0, 60, 150]) {
        const b = hco3BandForRa({ min: cible, max: cible }, eau(ca, mg));
        const ra = residualAlkalinity({ ca, mg, na: 0, so4: 0, cl: 0, hco3: b.min });
        // ±1 ppm : la fenêtre est arrondie au ppm entier.
        if (b.min > 0) expect(Math.abs(ra - cible)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('plus l’eau est calcaire, plus la fenêtre monte', () => {
    const douce = hco3BandForRa({ min: -30, max: 30 }, eau(20, 2));
    const dure = hco3BandForRa({ min: -30, max: 30 }, eau(120, 25));
    expect(dure.min).toBeGreaterThan(douce.min);
    expect(dure.max).toBeGreaterThan(douce.max);
  });

  it('ne descend jamais sous zéro, et survit aux entrées cassées', () => {
    expect(hco3BandForRa({ min: -60, max: 0 }, eau(0, 0)).min).toBe(0);
    const casse = hco3BandForRa({ min: -30, max: 30 }, { ca: NaN, mg: Infinity } as never);
    expect(Number.isFinite(casse.min)).toBe(true);
    expect(Number.isFinite(casse.max)).toBe(true);
  });
});
