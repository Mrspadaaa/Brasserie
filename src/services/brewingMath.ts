import { Recipe, BrewhouseProfile, Batch, HopStage, FermentableKind,
  Fermentable
} from '../types';

/**
 * Les grammes de houblon qui RESTENT dans la cuve d'ébullition.
 *
 * ⚠️ Le houblonnage à cru est exclu : il se perd au fermenteur, bien après le
 * moment où l'on décide combien d'eau chauffer. Sur la NEIPA de la brasserie,
 * les confondre ajoutait 171 g — soit un litre d'eau imaginaire.
 */
export function kettleHopGrams(
  hops: Array<{ weightG?: number; stage?: HopStage }> | undefined
): number {
  return (hops ?? []).reduce(
    (sum, h) => (h.stage === 'dryHop' ? sum : sum + (h.weightG || 0)),
    0
  );
}

export const BrewingMath = {
  // 1. ABV Calculator
  calculateABV(og: number, fg: number): number {
    if (!og || !fg || !Number.isFinite(og) || !Number.isFinite(fg) || og <= fg || og <= 1.0 || fg <= 0) return 0;
    // Standard formula used in craft brewing & Swiss customs: (OG - FG) * 131.25
    return Math.round((og - fg) * 131.25 * 10) / 10;
  },

  // 2. Plato Conversion (Swiss OFDF official standard)
  sgToPlato(sg: number): number {
    if (!sg || !Number.isFinite(sg) || sg < 1.0) return 0;
    // Lincoln equation: °P = -616.868 + (1111.14 * sg) - (630.272 * sg^2) + (135.997 * sg^3)
    const p = -616.868 + 1111.14 * sg - 630.272 * Math.pow(sg, 2) + 135.997 * Math.pow(sg, 3);
    return Math.max(0, Math.round(p * 10) / 10);
  },

  platoToSG(plato: number): number {
    if (!plato || !Number.isFinite(plato) || plato <= 0) return 1.0;
    // sg = 1 + (plato / (258.6 - ((plato / 258.2) * 227.1)))
    const denom = 258.6 - (plato / 258.2) * 227.1;
    if (denom <= 0) return 1.0;
    const sg = 1 + plato / denom;
    return Math.max(1.0, Math.round(sg * 1000) / 1000);
  },

  // 3. Tinseth IBU calculation
  /**
   * Amertume d'UN ajout de houblon, selon l'étape à laquelle il entre.
   *
   * ⚠️ La version précédente lisait l'étape dans une chaîne libre et retombait
   * sur « ébullition » quand elle n'y trouvait rien — ce qui était le cas de
   * tous les houblons saisis par l'application, l'éditeur ne remplissant jamais
   * ce champ. Une NEIPA à 170 g de houblonnage à cru récoltait ainsi une
   * centaine d'IBU qui n'existent pas.
   *
   * Chaque étape a désormais son traitement :
   *   Premier moût — présent toute l'ébullition, avec le bonus d'utilisation
   *                  d'environ 10 % que la pratique lui reconnaît.
   *   Ébullition   — Tinseth, sur la durée restante.
   *   Whirlpool    — Tinseth sur la durée de contact, atténué par la
   *                  température : l'isomérisation ralentit de moitié environ
   *                  tous les 10 °C sous l'ébullition.
   *   À cru        — ZÉRO. Le houblonnage à froid n'isomérise rien.
   */
  hopIbu(
    hop: { weightG: number; alpha: number; stage: HopStage; timeMin?: number; tempC?: number },
    boilVolumeL: number,
    og: number,
    boilMin: number = 60
  ): number {
    if (!boilVolumeL || boilVolumeL <= 0 || !Number.isFinite(boilVolumeL)) return 0;
    if (hop.stage === 'dryHop') return 0;
    if (!hop.alpha || !hop.weightG || hop.alpha <= 0 || hop.weightG <= 0) return 0;
    if (!Number.isFinite(hop.alpha) || !Number.isFinite(hop.weightG)) return 0;

    const safeOg = Number.isFinite(og) && og >= 1.0 ? og : 1.050;
    const gravityFactor = 1.65 * Math.pow(0.000125, Math.max(0, safeOg - 1));
    const tinseth = (min: number) => (1 - Math.exp(-0.04 * Math.max(0, min))) / 4.15;
    const safeBoilMin = Number.isFinite(boilMin) && boilMin >= 0 ? boilMin : 60;

    let utilization = 0;

    switch (hop.stage) {
      case 'firstWort':
        utilization = gravityFactor * tinseth(safeBoilMin) * 1.1;
        break;

      case 'boil': {
        const timeMin = Number.isFinite(hop.timeMin) ? Math.max(0, hop.timeMin!) : 0;
        utilization = gravityFactor * tinseth(timeMin);
        break;
      }

      case 'whirlpool': {
        // 80 °C est la température de whirlpool conventionnelle ; l'assistant
        // la demande explicitement, cette valeur n'est qu'un repli.
        const tempC = Number.isFinite(hop.tempC) ? Math.max(0, Math.min(hop.tempC!, 100)) : 80;
        const slowdown = Math.pow(2, (tempC - 100) / 10);
        const timeMin = Number.isFinite(hop.timeMin) ? Math.max(0, hop.timeMin!) : 20;
        utilization = gravityFactor * tinseth(timeMin) * slowdown;
        break;
      }
      default:
        utilization = 0;
    }

    const hopMgPerL = (hop.weightG * 1000) / boilVolumeL;
    const rawIbu = hopMgPerL * (hop.alpha / 100) * utilization;
    return Number.isFinite(rawIbu) ? Math.max(0, rawIbu) : 0;
  },

  /** Amertume totale d'une recette, arrondie à l'IBU. */
  calculateTinsethIBU(
    hops: Array<{
      weightG: number;
      alpha: number;
      stage: HopStage;
      timeMin?: number;
      tempC?: number;
    }>,
    boilVolumeL: number,
    og: number,
    boilMin: number = 60
  ): number {
    const total = hops.reduce(
      (sum, hop) => sum + this.hopIbu(hop, boilVolumeL, og, boilMin),
      0
    );
    return Math.round(total);
  },

  /**
   * Points de densité apportés par les fermentescibles, séparés en ce que la
   * levure peut manger et ce qu'elle ne peut pas.
   *
   * ⚠️ Deux distinctions qui manquaient et qui faussaient tout :
   *
   * 1. **Le sucre n'est pas du grain.** Un sucre se dissout entièrement : le
   *    rendement d'empâtage ne s'y applique pas. Lui appliquer 75 % sous-estimait
   *    d'un quart l'apport du candi d'une belge forte.
   * 2. **Tout le sucre n'est pas fermentescible.** Le lactose ne fermente pas du
   *    tout. Compté comme du saccharose, il donnait une densité finale de milk
   *    stout inférieure de plusieurs points à la réalité.
   */
  extractPoints(
    fermentables: Array<{
      weightKg: number;
      potentialPpg?: number;
      kind?: FermentableKind;
      fermentabilityPct?: number;
    }>,
    volumeL: number,
    efficiencyPct: number
  ): { total: number; unfermentable: number } | null {
    if (!volumeL || !Number.isFinite(volumeL) || volumeL <= 0 || !fermentables.length) return null;
    if (!Number.isFinite(efficiencyPct) || efficiencyPct <= 0) return null;
    if (fermentables.some((f) => f.potentialPpg == null || !Number.isFinite(f.potentialPpg))) {
      return null;
    }

    const volumeGal = volumeL * 0.26417205;
    let total = 0;
    let unfermentable = 0;

    fermentables.forEach((f) => {
      const weightKg = Number.isFinite(f.weightKg) ? Math.max(0, f.weightKg) : 0;
      const isGrain = (f.kind ?? 'grain') === 'grain';
      // Le rendement d'empâtage ne concerne que ce qui passe par la maische.
      const yieldFactor = isGrain ? efficiencyPct / 100 : 1;
      const points =
        ((f.potentialPpg as number) * (weightKg * 2.2046226) * yieldFactor) / volumeGal;

      // Par défaut : un grain donne un moût atténuable normalement (la levure
      // s'en charge), un sucre pur fermente à 100 %, le lactose à 0 %.
      const fermentability =
        Number.isFinite(f.fermentabilityPct)
          ? Math.max(0, Math.min(100, f.fermentabilityPct!))
          : (f.kind === 'lactose' ? 0 : 100);

      total += points;
      unfermentable += points * (1 - fermentability / 100);
    });

    return {
      total: Math.round(total * 10) / 10,
      unfermentable: Math.round(unfermentable * 10) / 10
    };
  },

  /**
   * Densité initiale PRÉDITE depuis les fermentescibles et l'efficacité de
   * l'installation.
   *
   * Renvoie `null` si un seul ingrédient n'a pas son potentiel renseigné : une
   * OG prédite sur une facture incomplète serait plus trompeuse qu'une case vide.
   */
  calculateOg(
    fermentables: Array<{
      weightKg: number;
      potentialPpg?: number;
      kind?: FermentableKind;
      fermentabilityPct?: number;
    }>,
    volumeL: number,
    efficiencyPct: number
  ): number | null {
    const points = this.extractPoints(fermentables, volumeL, efficiencyPct);
    if (!points) return null;
    return Math.round((1 + points.total / 1000) * 1000) / 1000;
  },

  /**
   * Densité finale prédite.
   *
   * ⚠️ L'atténuation ne s'applique QU'À l'extrait fermentescible. Sans
   * `unfermentablePoints`, 500 g de lactose dans une milk stout étaient traités
   * comme du sucre que la levure allait manger — la FG annoncée était de
   * plusieurs points trop basse, et l'alcool trop haut.
   *
   *   FG = 1 + [ P_non_ferm + (P_total − P_non_ferm) × (1 − atténuation) ] ÷ 1000
   */
  calculateFg(
    og: number,
    attenuationPct: number,
    unfermentablePoints = 0
  ): number | null {
    if (!og || !Number.isFinite(og) || og <= 1 || !attenuationPct || !Number.isFinite(attenuationPct) || attenuationPct <= 0) return null;
    const safeUnfermentable = Number.isFinite(unfermentablePoints) ? Math.max(0, unfermentablePoints) : 0;
    const totalPoints = (og - 1) * 1000;
    const fermentable = Math.max(0, totalPoints - safeUnfermentable);
    const remaining = safeUnfermentable + fermentable * (1 - Math.min(100, attenuationPct) / 100);
    return Math.round((1 + remaining / 1000) * 1000) / 1000;
  },

  /**
   * Atténuation réelle attendue, corrigée par la température d'empâtage.
   *
   * ⚠️ L'atténuation annoncée par le fabricant vaut pour un moût standard.
   * Empâter à 63 °C favorise la β-amylase et donne un moût nettement plus
   * fermentescible ; empâter à 69 °C laisse des dextrines et du corps. Traiter
   * l'atténuation comme une constante, c'est ignorer le levier le plus simple
   * dont dispose un brasseur pour régler la sécheresse de sa bière.
   *
   * Modèle borné : ±1.5 point d'atténuation par degré autour de 66.5 °C,
   * plafonné à ±8 points — au-delà, le palier ne suffit plus à l'expliquer.
   */
  attenuationForMashTemp(baseAttenuationPct: number, mashTempC: number): number {
    if (!baseAttenuationPct || !Number.isFinite(baseAttenuationPct) || baseAttenuationPct <= 0) return 0;
    if (!Number.isFinite(mashTempC)) return baseAttenuationPct;
    const shift = Math.max(-8, Math.min(8, (66.5 - mashTempC) * 1.5));
    return Math.round(Math.max(45, Math.min(95, baseAttenuationPct + shift)) * 10) / 10;
  },

  /**
   * Rendement d'empâtage attendu à haute densité.
   *
   * ⚠️ Au-delà d'environ 1.065, le moût sature et l'extraction chute : une
   * impériale à 1.100 perd couramment 7 à 10 points de rendement. Annoncer le
   * rendement nominal fait rater la cible d'un brassin entier.
   *
   * Le chiffre corrigé est RENDU, jamais appliqué en silence : c'est à Gaëtan
   * de décider s'il ajuste sa facture ou son volume.
   */
  efficiencyAtGravity(nominalPct: number, og: number): {
    correctedPct: number;
    lostPoints: number;
    note: string | null;
  } {
    if (!Number.isFinite(og) || og <= 1 || !Number.isFinite(nominalPct) || nominalPct <= 0) {
      const safeNominal = Number.isFinite(nominalPct) && nominalPct > 0 ? nominalPct : 75;
      return { correctedPct: safeNominal, lostPoints: 0, note: null };
    }
    const points = (og - 1) * 1000;
    if (points <= 65) {
      return { correctedPct: nominalPct, lostPoints: 0, note: null };
    }
    const lost = Math.round((points - 65) * 0.2 * 10) / 10;
    const corrected = Math.round(Math.max(40, nominalPct - lost) * 10) / 10;
    return {
      correctedPct: corrected,
      lostPoints: lost,
      note: `À ${og.toFixed(3)}, le moût sature : compte plutôt ${corrected} % de rendement que ${nominalPct} %. Prévois plus de grain ou moins de volume.`
    };
  },

  /**
   * Combien de levure ensemencer, vraiment.
   *
   * ⚠️ Le manque le plus criant du modèle précédent : la quantité valait
   * « 1 sachet » quelle que soit la bière. Une lager à 1.070 dans 30 L réclame
   * environ 550 milliards de cellules — quatre sachets, ou un pied de cuve.
   * Sous-ensemencer, c'est une fermentation lente, des esters non voulus et un
   * risque d'arrêt.
   *
   * Taux de la pratique : 0.75 million de cellules par mL et par °Plato en ale,
   * 1.5 en lager (la levure basse travaille au froid et se multiplie moins),
   * 1.0 au-dessus de 1.075 où le moût stresse la levure.
   *
   * ⚠️ Le nombre de cellules par sachet a été calé, pas choisi au hasard. Un
   * sachet de 11.5 g titre entre 10 et 20 milliards de cellules par gramme
   * selon la fraîcheur ; retenir 13 (soit ~150 milliards par sachet) fait
   * coïncider ce calcul avec la table de dosage de Fermentis — 50 à 80 g/hL
   * pour une ale de densité courante. Prendre le minimum garanti aurait fait
   * réclamer deux sachets pour une simple pale ale de 20 L.
   *
   * On ARRONDIT au plus proche plutôt qu'au supérieur : à 1.1 sachet, un seul
   * passe. C'est au-delà que le manque devient un vrai risque.
   */
  pitchRate(
    og: number,
    volumeL: number,
    kind: 'ale' | 'lager'
  ): {
    degreesPlato: number;
    rate: number;
    cellsNeededB: number;
    sachetsExact: number;
    sachetsDry: number;
    starterAdvised: boolean;
    verdict: string;
  } | null {
    if (!og || !Number.isFinite(og) || og <= 1 || !volumeL || !Number.isFinite(volumeL) || volumeL <= 0) return null;

    const CELLS_PER_SACHET_B = 150;
    const plato = this.sgToPlato(og);
    const highGravity = og >= 1.075;
    const rate = kind === 'lager' ? 1.5 : highGravity ? 1.0 : 0.75;

    // cellules = taux (M/mL/°P) × °P × volume (mL) ➔ ramené en milliards
    const cellsNeededB = Math.round(rate * plato * volumeL);
    const sachetsExact = Math.round((cellsNeededB / CELLS_PER_SACHET_B) * 10) / 10;
    const sachetsDry = Math.max(1, Math.round(cellsNeededB / CELLS_PER_SACHET_B));
    const starterAdvised = sachetsDry > 3;

    const verdict =
      sachetsDry <= 1
        ? `Un sachet suffit (${sachetsExact} en théorie).`
        : starterAdvised
          ? `${sachetsDry} sachets, ou un pied de cuve — au-delà de trois, le starter revient moins cher.`
          : `${sachetsDry} sachets (${sachetsExact} en théorie).`;

    return {
      degreesPlato: Math.round(plato * 10) / 10,
      rate,
      cellsNeededB,
      sachetsExact,
      sachetsDry,
      starterAdvised,
      verdict
    };
  },

  /**
   * L'écart entre ce qui était visé et ce qui est sorti de la cuve — le « vrai
   * problème sur le brassin ».
   *
   * Une OG mesurée sous la cible signifie une efficacité réelle inférieure :
   * concassage trop grossier, empâtage trop court, rinçage incomplet. On rend
   * l'efficacité réellement atteinte, qui est l'information actionnable.
   */
  brewEfficiency(
    ogTarget: number,
    ogMeasured: number,
    efficiencyPct: number
  ): { deltaPoints: number; realEfficiencyPct: number; verdict: string } | null {
    if (!ogTarget || !Number.isFinite(ogTarget) || ogTarget <= 1 || !ogMeasured || !Number.isFinite(ogMeasured) || ogMeasured <= 1) return null;
    const safeEff = Number.isFinite(efficiencyPct) && efficiencyPct > 0 ? efficiencyPct : 75;

    const targetPoints = (ogTarget - 1) * 1000;
    const measuredPoints = (ogMeasured - 1) * 1000;
    const deltaPoints = Math.round(measuredPoints - targetPoints);
    const realEfficiencyPct =
      Math.round((measuredPoints / targetPoints) * safeEff * 10) / 10;

    const verdict =
      Math.abs(deltaPoints) <= 2
        ? 'Dans la cible.'
        : deltaPoints < 0
          ? 'Sous la cible : concassage, durée d’empâtage ou rinçage à revoir.'
          : 'Au-dessus de la cible : volume récolté plus faible que prévu, ou meilleure extraction.';

    return { deltaPoints, realEfficiencyPct, verdict };
  },

  /**
   * Volumes d'eau d'un brassin : empâtage, rinçage, moût avant ébullition.
   *
   * ⚠️ IL Y AVAIT DEUX MODÈLES CONCURRENTS. L'assistant de recette posait
   * `empâtage = grain × 3` et `rinçage = volume × 1.25 − empâtage`, SANS
   * l'absorption du grain ; `scaleRecipe` avait le vrai modèle. Sur 6 kg de
   * grain pour 30 L, l'écart atteignait 4.5 L — et comme les sels se dosent au
   * litre, une erreur de volume est une erreur de concentration : 11 % sur
   * toute la minéralité.
   *
   * Ce calcul est désormais le seul. Ce qu'il compte :
   *
   *   absorption du grain  ≈ 0.96 L/kg, retenue par les drêches ;
   *   évaporation          — taux de l'installation, PAR HEURE, sur la durée
   *                          d'ébullition réelle ;
   *   houblons de cuve     — 6 mL retenus par gramme resté dans la cuve ;
   *   fond de cuve         — ce qui ne sort jamais ;
   *   rétraction au froid  — 4 % entre l'ébullition et la mise en cuve.
   *
   * ⚠️ CORRIGÉ LE 04.09.2026, deux fautes qui gonflaient le rinçage de 8 L sur
   * un brassin de 30 L :
   *
   * 1. **L'ébullition ne durait jamais.** `boilOffRatePct` est documenté « %/h »
   *    dans son propre type, et le calcul l'appliquait à plat : une ébullition
   *    de 90 minutes évaporait autant qu'une de 45.
   *
   * 2. **Le ratio d'empâtage était ignoré une fois sur deux.** Quand il donnait
   *    un empâtage plus petit que le rinçage, le calcul le jetait et coupait le
   *    moût 50/50 — sur 7.1 kg pour 30 L, cela donnait 21 L de rinçage pour un
   *    rinçage qui se fait au-dessus du panier d'un monocuve, où l'on rince un
   *    lit de grain, on ne le noie pas. Le ratio commande maintenant, sans
   *    exception : l'empâtage vaut `grain × ratio`, et le rinçage est CE QUI
   *    RESTE à collecter. Le seul garde-fou est le zéro — un empâtage qui
   *    dépasse à lui seul le moût à collecter ramène le cas « aucun rinçage ».
   *
   * ⚠️ Rinçage « aucun » (BIAB, empâtage à volume plein) : toute l'eau part à
   * l'empâtage. Le rinçage ne se contente pas de valoir zéro, il change le
   * volume de l'empâtage — et donc la dose de tous les sels.
   */
  waterVolumes(
    totalGristKg: number,
    volumeL: number,
    brewhouse?: Partial<BrewhouseProfile>,
    spargeType: 'fly' | 'batch' | 'none' = 'batch',
    /** Durée d'ébullition réelle. L'évaporation est un débit, pas un forfait. */
    boilMin: number = 60,
    /** Houblons qui restent dans la cuve (tout sauf le houblonnage à cru). */
    kettleHopG: number = 0
  ): {
    mashWaterL: number;
    spargeWaterL: number;
    preBoilVolumeL: number;
    grainAbsorptionL: number;
    boilOffL: number;
    hopLossL: number;
    /** L'épaisseur réellement appliquée, en L/kg — c'est elle qu'on affiche. */
    mashRatioLPerKg: number;
  } {
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const vide = {
      mashWaterL: 0,
      spargeWaterL: 0,
      preBoilVolumeL: 0,
      grainAbsorptionL: 0,
      boilOffL: 0,
      hopLossL: 0,
      mashRatioLPerKg: 0
    };
    if (!Number.isFinite(totalGristKg) || totalGristKg <= 0 || !Number.isFinite(volumeL) || volumeL <= 0) {
      return vide;
    }

    const grainAbsorptionL = round1(totalGristKg * 0.96);
    const boilOffRate = Number.isFinite(brewhouse?.boilOffRatePct) ? Math.max(0, brewhouse!.boilOffRatePct!) : 10;
    const safeBoilMin = Number.isFinite(boilMin) && boilMin >= 0 ? boilMin : 60;
    const boilOffL = round1(volumeL * (boilOffRate / 100) * (safeBoilMin / 60));
    /*
     * Le houblon boit. Six millilitres par gramme est la valeur de la pratique
     * pour du cône ou du pellet resté dans la cuve — whirlpool compris, où les
     * grosses charges d'une NEIPA se comptent en centaines de grammes. Le
     * houblonnage à cru n'entre pas ici : il se perd au fermenteur, après.
     */
    const safeHopG = Number.isFinite(kettleHopG) && kettleHopG > 0 ? kettleHopG : 0;
    const hopLossL = round1(safeHopG * 0.006);
    const deadSpaceL = Number.isFinite(brewhouse?.deadSpaceL) ? Math.max(0, brewhouse!.deadSpaceL!) : 2.0;
    const coolingShrinkageL = volumeL * 0.04;
    const preBoilVolumeL = round1(
      Math.max(0, volumeL + boilOffL + deadSpaceL + hopLossL + coolingShrinkageL)
    );

    const plein = {
      mashWaterL: round1(preBoilVolumeL + grainAbsorptionL),
      spargeWaterL: 0,
      preBoilVolumeL,
      grainAbsorptionL,
      boilOffL,
      hopLossL,
      mashRatioLPerKg: round1((preBoilVolumeL + grainAbsorptionL) / totalGristKg)
    };

    if (spargeType === 'none') return plein;

    /*
     * 4.2 L/kg par défaut : l'épaisseur d'un monocuve où l'on empâte près du
     * volume plein et où l'on rince le panier par-dessus. Les 3 L/kg d'avant
     * décrivaient une cuve de filtration séparée, que la brasserie n'a pas.
     */
    const rawRatio = brewhouse?.mashRatioLPerKg;
    const ratio = Number.isFinite(rawRatio) && (rawRatio ?? 0) > 0 ? rawRatio! : 4.2;
    const mashWaterL = round1(Math.max(0, totalGristKg * ratio));
    const firstRunningsL = mashWaterL - grainAbsorptionL;

    // L'empâtage porte déjà tout le moût : il n'y a plus rien à rincer.
    if (firstRunningsL >= preBoilVolumeL) return plein;

    return {
      mashWaterL,
      spargeWaterL: round1(Math.max(0, preBoilVolumeL - firstRunningsL)),
      preBoilVolumeL: round1(Math.max(0, preBoilVolumeL)),
      grainAbsorptionL: round1(Math.max(0, grainAbsorptionL)),
      boilOffL: round1(Math.max(0, boilOffL)),
      hopLossL: round1(Math.max(0, hopLossL)),
      mashRatioLPerKg: round1(ratio)
    };
  },

  // 4. Recipe Scaler (30L -> 50L -> 300L)
  scaleRecipe(
    recipe: Recipe,
    targetVolumeL: number,
    currentBrewhouse: BrewhouseProfile,
    targetBrewhouse: BrewhouseProfile
  ): {
    scaledRecipe: Recipe;
    mashWaterL: number;
    spargeWaterL: number;
    preBoilVolumeL: number;
    grainAbsorptionL: number;
  } {
    const baseVolume = recipe.volumeL || 30;
    const volumeRatio = targetVolumeL / baseVolume;
    const efficiencyRatio = (currentBrewhouse.efficiencyPct || 75) / (targetBrewhouse.efficiencyPct || 75);
    const grainRatio = volumeRatio * efficiencyRatio;

    /*
     * ⚠️ On lit `fermentables`, avec `malts` en repli pour les anciennes
     * recettes. Lire `recipe.malts` directement JETAIT — le champ n'existe
     * plus sur aucune recette créée depuis la refonte, et l'onglet de mise à
     * l'échelle plantait au lieu d'afficher quoi que ce soit.
     */
    const sourceFermentables: Fermentable[] =
      recipe.fermentables ??
      (recipe.malts ?? []).map((m) => ({ ...m, kind: 'grain' as const, use: 'empatage' as const }));

    const scaledFermentables = sourceFermentables.map((f) => ({
      ...f,
      weightKg: Math.round(f.weightKg * grainRatio * 100) / 100
    }));

    // Le ratio d'empâtage se calcule sur le GRAIN seul : le sucre et le lactose
    // ne retiennent pas d'eau et n'entrent pas dans la maische.
    const totalGristKg =
      Math.round(
        scaledFermentables
          .filter((f) => f.kind === 'grain')
          .reduce((sum, f) => sum + f.weightKg, 0) * 100
      ) / 100;

    // Scale hops
    // Bittering hops scale with volume and gravity, aroma hops scale primarily with volume
    const scaledHops = (recipe.hops ?? []).map((h) => {
      let weight = Math.round(h.weightG * volumeRatio);
      // Sur 300 L, whirlpool et houblonnage à cru extraient mieux : environ
      // 10 % de houblon en moins pour le même résultat aromatique.
      if (targetVolumeL >= 250 && (h.stage === 'whirlpool' || h.stage === 'dryHop')) {
        weight = Math.round(weight * 0.9);
      }
      return {
        ...h,
        weightG: weight
      };
    });

    // Scale yeast — la levure ne suit pas le volume linéairement : on
    // ensemence par palier (environ un sachet pour 20 L de moût).
    const sachetCount = Math.max(1, Math.ceil(targetVolumeL / 20));
    // Une recette d'avant la refonte peut n'avoir aucune levure déclarée : on
    // ne fabrique pas de souche, on met simplement le nombre de sachets.
    const baseYeast = recipe.yeast;
    const scaledYeast: Recipe['yeast'] = baseYeast
      ? {
          ...baseYeast,
          qty:
            baseYeast.unit === 'sachet'
              ? sachetCount
              : Math.round(baseYeast.qty * volumeRatio * 10) / 10
        }
      : undefined;

    // Volumes d'eau — un seul modèle, partagé avec l'assistant de recette.
    const { mashWaterL, spargeWaterL, preBoilVolumeL, grainAbsorptionL } = this.waterVolumes(
      totalGristKg,
      targetVolumeL,
      targetBrewhouse,
      recipe.mash?.spargeType ?? 'batch',
      recipe.boilMin ?? 60,
      // Les houblons mis à l'échelle : ce sont eux qui boiront dans la cuve.
      kettleHopGrams(scaledHops)
    );

    const scaledRecipe: Recipe = {
      ...recipe,
      id: `${recipe.id}-scale-${targetVolumeL}L`,
      volumeL: targetVolumeL,
      fermentables: scaledFermentables,
      // `malts` reste renseigné le temps que les anciens écrans migrent, mais
      // `fermentables` fait foi.
      malts: scaledFermentables.map(({ name, weightKg, colorEbc }) => ({ name, weightKg, colorEbc })),
      totalGristKg,
      hops: scaledHops,
      yeast: scaledYeast
    };

    return {
      scaledRecipe,
      mashWaterL,
      spargeWaterL,
      preBoilVolumeL,
      grainAbsorptionL
    };
  },

  // 5. Impôt fédéral sur la bière (OFDF — formulaire 45.60)
  //
  // ⚠️ Les taux et seuils ci-dessous sont des VALEURS PAR DÉFAUT paramétrables
  // dans `config.fiscal`. Ils doivent être vérifiés contre le tarif OFDF en
  // vigueur avant toute déclaration réelle. Ce qui est garanti ici, c'est la
  // STRUCTURE du calcul :
  //   - l'assiette est le volume RÉELLEMENT CONDITIONNÉ (bouteilles + fûts),
  //     jamais un volume planifié ;
  //   - le seuil « petit brasseur » se compte en HECTOLITRES de production
  //     annuelle, pas en litres ;
  //   - la réduction est GRADUÉE par paliers, pas binaire.
  calculateSwissBeerTax(
    batches: Batch[],
    options?: {
      ratePerHl?: number;              // taux plein CHF/hl
      maxSmallBrewerHl?: number;       // plafond du régime petit brasseur, en hl/an
      reliefTiersHl?: Array<{ upToHl: number; reductionPct: number }>;
      selectedMonthYear?: string;      // MM.YYYY
    }
  ): {
    totalVolumeL: number;
    totalHectoliters: number;
    ratePerHl: number;
    fullRatePerHl: number;
    reductionPct: number;
    taxDueCHF: number;
    batchesCount: number;
    isSmallBrewerRate: boolean;
  } {
    const fullRate = options?.ratePerHl ?? 25.20;
    const maxSmallHl = options?.maxSmallBrewerHl ?? 55000;
    // Paliers de réduction dégressifs (production annuelle cumulée, en hl).
    const tiers = options?.reliefTiersHl ?? [
      { upToHl: 15000, reductionPct: 40 },
      { upToHl: 22000, reductionPct: 20 },
      { upToHl: 45000, reductionPct: 10 }
    ];

    let eligibleBatches = batches.filter((b) => b.status !== 'annule');

    // Assiette : uniquement la bière effectivement mise en bouteille / en fût.
    // Un brassin planifié ou encore en cuve n'est pas imposable.
    eligibleBatches = eligibleBatches.filter(
      (b) => typeof b.volumePackagedL === 'number' && b.volumePackagedL > 0
    );

    if (options?.selectedMonthYear) {
      eligibleBatches = eligibleBatches.filter((b) => {
        // On impose à la date de conditionnement, pas à la date de brassage.
        const refDate = b.bottlingDate || b.brewDate;
        if (!refDate) return false;
        const parts = refDate.split('.');
        if (parts.length === 3) {
          const mY = `${parts[1].padStart(2, '0')}.${parts[2]}`;
          return mY === options.selectedMonthYear;
        }
        return false;
      });
    }

    const totalVolumeL = Math.round(eligibleBatches.reduce((acc, b) => acc + (b.volumePackagedL || 0), 0) * 100) / 100;
    // 4 décimales : 0.0001 hl = 0.01 L. Arrondir l'hectolitre à 2 décimales
    // perdrait jusqu'à 0.5 L par déclaration.
    const totalHectoliters = Math.round((totalVolumeL / 100) * 10000) / 10000;

    const isSmallBrewerRate = totalHectoliters < maxSmallHl;
    const matchedTier = isSmallBrewerRate
      ? tiers.find((t) => totalHectoliters < t.upToHl)
      : undefined;
    const reductionPct = matchedTier?.reductionPct ?? 0;

    const appliedRate = Math.round(fullRate * (1 - reductionPct / 100) * 100) / 100;
    // L'impôt se calcule sur le volume exact, on n'arrondit qu'au centime final.
    const taxDueCHF = Math.round((totalVolumeL / 100) * appliedRate * 100) / 100;

    return {
      totalVolumeL,
      totalHectoliters,
      ratePerHl: appliedRate,
      fullRatePerHl: fullRate,
      reductionPct,
      taxDueCHF,
      batchesCount: eligibleBatches.length,
      isSmallBrewerRate
    };
  },

  /*
   * L'ancien modèle d'eau — profil de base codé en dur, dilution et dosage des
   * sels — vivait ici. Il est SUPPRIMÉ, pas déprécié : `src/domain/water.ts` le
   * remplace intégralement, avec les huit sels, l'alcalinité résiduelle, la
   * séparation empâtage/rinçage et des cibles par style au lieu de cibles
   * devinées. Deux modèles d'eau côte à côte, c'est l'assurance de corriger un
   * jour celui que l'application n'utilise pas.
   */

  // 7. Correction réfractomètre sur moût en fermentation (cubique standard).
  //
  // L'alcool fausse l'indice de réfraction : une lecture brute en cours de
  // fermentation surestime largement la densité. Cette cubique corrige l'effet.
  // OB = Brix initial (déduit de l'OG), FB = Brix lu sur l'échantillon.
  //
  // GARDE-FOU : sur un échantillon NON fermenté (FB === OB), la fonction doit
  // redonner la densité de départ. OG 1.062 (15.21 °Bx) ➔ ~1.060. C'est ce
  // contrôle que l'ancienne formule échouait (elle renvoyait 1.041).
  calculateSeanTerrillRefractometer(ogSG: number, currentBrix: number): number {
    if (!ogSG || !Number.isFinite(ogSG) || ogSG <= 1.0 || !Number.isFinite(currentBrix) || currentBrix < 0) return 1.0;
    const ob = this.sgToBrix(ogSG);
    const fb = currentBrix;
    const fg =
      1.001843 -
      0.002318474 * ob -
      0.000007775 * Math.pow(ob, 2) -
      0.000000034 * Math.pow(ob, 3) +
      0.00574 * fb +
      0.00003344 * Math.pow(fb, 2) +
      0.000000086 * Math.pow(fb, 3);
    return Math.max(1.0, Math.round(fg * 1000) / 1000);
  },

  // 7.b Conversion densité ➔ degré Brix (polynôme usuel de raffinage)
  sgToBrix(sg: number): number {
    if (!sg || !Number.isFinite(sg) || sg <= 1.0) return 0;
    const brix = 182.4601 * Math.pow(sg, 3) - 775.6821 * Math.pow(sg, 2) + 1262.7794 * sg - 669.5622;
    return Math.max(0, Math.round(brix * 100) / 100);
  },

  // 8. Résiduel de CO2 déjà dissous dans la bière avant conditionnement.
  // Dépend de la température LA PLUS HAUTE atteinte en fin de fermentation
  // (c'est elle qui fixe la quantité de CO2 restée en solution).
  // Formule de référence (température en °F) : 20 °C ➔ ~0.86 volume.
  calculateResidualCo2Vol(tempC: number): number {
    if (!Number.isFinite(tempC)) return 0;
    const tempF = (tempC * 9) / 5 + 32;
    const vol = 3.0378 - 0.050062 * tempF + 0.00026555 * Math.pow(tempF, 2);
    return Number.isFinite(vol) ? Math.max(0, Math.round(vol * 100) / 100) : 0;
  },

  // 8.b Sucre de refermentation (priming) nécessaire, en grammes.
  // 1 volume de CO2 par litre demande ~4.0 g/L de dextrose (3.86 g/L pour du saccharose).
  calculatePrimingSugarG(
    targetCo2Vol: number,
    packagedVolumeL: number,
    maxFermentTempC: number,
    sugarType: 'dextrose' | 'saccharose' = 'dextrose'
  ): number {
    if (!Number.isFinite(targetCo2Vol) || targetCo2Vol <= 0) return 0;
    if (!Number.isFinite(packagedVolumeL) || packagedVolumeL <= 0) return 0;
    const residual = this.calculateResidualCo2Vol(maxFermentTempC);
    const gramsPerLPerVol = sugarType === 'saccharose' ? 3.86 : 4.0;
    const delta = Math.max(0, targetCo2Vol - residual);
    const sugar = Math.round(delta * gramsPerLPerVol * Math.max(0, packagedVolumeL));
    return Number.isFinite(sugar) ? Math.max(0, sugar) : 0;
  },

  // 9. Pression de carbonatation forcée en fût (loi de Henry).
  // Polynôme standard volumes de CO2 ➔ PSI, température en °F.
  // Contrôle : 2.5 vol à 4 °C ➔ ~11.9 psi ➔ ~0.82 bar.
  calculateKegPressureBar(targetCo2Vol: number, tempC: number): number {
    if (!Number.isFinite(targetCo2Vol) || targetCo2Vol <= 0 || !Number.isFinite(tempC)) return 0;
    const tempF = (tempC * 9 / 5) + 32;
    const psi =
      -16.6999 -
      0.0101059 * tempF +
      0.00116512 * Math.pow(tempF, 2) +
      0.173354 * tempF * targetCo2Vol +
      4.24267 * targetCo2Vol -
      0.0684226 * Math.pow(targetCo2Vol, 2);
    const bar = Math.max(0, Math.round((psi * 0.0689476) * 100) / 100);
    return Number.isFinite(bar) ? bar : 0;
  }
};

