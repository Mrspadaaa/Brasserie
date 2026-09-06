import { describe, it, expect } from 'vitest';
import { BrewingMath, kettleHopGrams } from '../../src/services/brewingMath';
import { HopIngredient, Fermentable, BrewhouseProfile, Batch } from '../../src/types';

describe('Vérification Scientifique des Standards Brassicoles (BrewingMath Double-Check)', () => {

  describe('1. Standard Plato & Densité Spécifique (Lincoln / ASBC)', () => {
    it('0 °P correspond rigoureusement à l’eau pure (1.000 SG)', () => {
      expect(BrewingMath.sgToPlato(1.000)).toBe(0);
      expect(BrewingMath.platoToSG(0)).toBe(1.000);
    });

    it('10.0 °P correspond à 1.040 SG (table ASBC)', () => {
      expect(BrewingMath.sgToPlato(1.040)).toBe(10.0);
      expect(BrewingMath.platoToSG(10.0)).toBe(1.040);
    });

    it('12.0 °P (moût classique pilsner/lager) correspond à 1.048 SG', () => {
      expect(BrewingMath.platoToSG(12.0)).toBe(1.048);
      expect(BrewingMath.sgToPlato(1.0484)).toBe(12.0);
    });

    it('14.74 °P (moût d’ale standard) correspond à 1.060 SG', () => {
      expect(BrewingMath.platoToSG(14.74)).toBe(1.060);
      expect(BrewingMath.sgToPlato(1.060)).toBe(14.7);
    });

    it('20.0 °P (doppelbock / bière forte) correspond à 1.083 SG', () => {
      expect(BrewingMath.platoToSG(20.0)).toBe(1.083);
      expect(BrewingMath.sgToPlato(1.083)).toBe(20.0);
    });

    it('aller-retour parfait sur toute la plage utile de brassage (1 à 25 °P)', () => {
      for (let p = 1; p <= 25; p += 1) {
        const sg = BrewingMath.platoToSG(p);
        const backP = BrewingMath.sgToPlato(sg);
        // Tolérance maximale de 0.15 °P due à l'arrondi au millième de la densité
        expect(Math.abs(backP - p)).toBeLessThanOrEqual(0.15);
      }
    });

    it('sécurisé contre les valeurs hors-limites et dégénérées', () => {
      expect(BrewingMath.sgToPlato(-1)).toBe(0);
      expect(BrewingMath.sgToPlato(0.999)).toBe(0);
      expect(BrewingMath.sgToPlato(NaN)).toBe(0);
      expect(BrewingMath.platoToSG(-10)).toBe(1.0);
      expect(BrewingMath.platoToSG(NaN)).toBe(1.0);
      expect(BrewingMath.platoToSG(300)).toBe(1.0);
    });
  });

  describe('2. Formule Glenn Tinseth pour l’IBU', () => {
    it('calcule exactement l’utilisation de référence Glenn Tinseth à 60 min', () => {
      const hop: HopIngredient = {
        name: 'Centennial',
        weightG: 30,
        alpha: 10,
        stage: 'boil',
        timeMin: 60
      };
      const ibu = BrewingMath.hopIbu(hop, 20, 1.050, 60);
      expect(ibu).toBeCloseTo(34.62, 1);
    });

    it('reflète la cinétique d’isomérisation selon la durée d’ébullition', () => {
      const hopBase = { name: 'Cascade', weightG: 30, alpha: 6, stage: 'boil' as const };
      const ibu10 = BrewingMath.hopIbu({ ...hopBase, timeMin: 10 }, 20, 1.050);
      const ibu30 = BrewingMath.hopIbu({ ...hopBase, timeMin: 30 }, 20, 1.050);
      const ibu60 = BrewingMath.hopIbu({ ...hopBase, timeMin: 60 }, 20, 1.050);
      const ibu90 = BrewingMath.hopIbu({ ...hopBase, timeMin: 90 }, 20, 1.050);

      expect(ibu10).toBeLessThan(ibu30);
      expect(ibu30).toBeLessThan(ibu60);
      expect(ibu60).toBeLessThan(ibu90);
      expect(ibu60 / ibu10).toBeGreaterThan(2.5);
    });

    it('prend en compte l’inhibition de l’extraction par la densité du moût', () => {
      const hop = { name: 'Magnum', weightG: 20, alpha: 14, stage: 'boil' as const, timeMin: 60 };
      const ibuFaible = BrewingMath.hopIbu(hop, 20, 1.030);
      const ibuMoyen = BrewingMath.hopIbu(hop, 20, 1.050);
      const ibuDense = BrewingMath.hopIbu(hop, 20, 1.080);

      expect(ibuFaible).toBeGreaterThan(ibuMoyen);
      expect(ibuMoyen).toBeGreaterThan(ibuDense);
    });

    it('attribue le bonus de 10 % au First Wort Hopping (FWH)', () => {
      const hopBoil = { name: 'Saaz', weightG: 30, alpha: 4, stage: 'boil' as const, timeMin: 60 };
      const hopFwh = { name: 'Saaz', weightG: 30, alpha: 4, stage: 'firstWort' as const };

      const ibuBoil = BrewingMath.hopIbu(hopBoil, 20, 1.050, 60);
      const ibuFwh = BrewingMath.hopIbu(hopFwh, 20, 1.050, 60);
      expect(ibuFwh / ibuBoil).toBeCloseTo(1.10, 2);
    });

    it('atténue l’amertume de whirlpool selon la cinétique d’Arrhenius', () => {
      const hopWp = { name: 'Citra', weightG: 50, alpha: 12, stage: 'whirlpool' as const, timeMin: 20 };
      const wp100 = BrewingMath.hopIbu({ ...hopWp, tempC: 100 }, 20, 1.050);
      const wp90 = BrewingMath.hopIbu({ ...hopWp, tempC: 90 }, 20, 1.050);
      const wp80 = BrewingMath.hopIbu({ ...hopWp, tempC: 80 }, 20, 1.050);
      const wp70 = BrewingMath.hopIbu({ ...hopWp, tempC: 70 }, 20, 1.050);

      expect(wp90 / wp100).toBeCloseTo(0.50, 2);
      expect(wp80 / wp100).toBeCloseTo(0.25, 2);
      expect(wp70 / wp100).toBeCloseTo(0.125, 2);
    });

    it('le houblonnage à cru (dry hop) ne produit rigoureusement aucun IBU isomérisé', () => {
      const dryHop: HopIngredient = {
        name: 'Mosaic',
        weightG: 200,
        alpha: 13.5,
        stage: 'dryHop'
      };
      expect(BrewingMath.hopIbu(dryHop, 20, 1.060)).toBe(0);
    });

    it('calcul global Tinseth cumulatif et arrondi', () => {
      const hops: HopIngredient[] = [
        { name: 'Magnum', weightG: 20, alpha: 14, stage: 'boil', timeMin: 60 },
        { name: 'Cascade', weightG: 30, alpha: 6, stage: 'boil', timeMin: 15 },
        { name: 'Citra', weightG: 50, alpha: 12, stage: 'whirlpool', timeMin: 20, tempC: 80 },
        { name: 'Simcoe', weightG: 100, alpha: 13, stage: 'dryHop' }
      ];
      const total = BrewingMath.calculateTinsethIBU(hops, 20, 1.050, 60);
      expect(total).toBeGreaterThan(30);
      expect(Number.isInteger(total)).toBe(true);
    });
  });

  describe('3. Titre Alcoométrique Volumique (ABV)', () => {
    it('applique la formule des douanes suisses (OG - FG) * 131.25', () => {
      expect(BrewingMath.calculateABV(1.050, 1.010)).toBe(5.3);
      expect(BrewingMath.calculateABV(1.080, 1.016)).toBe(8.4);
    });

    it('refuse toute inversion physique de densité (FG >= OG)', () => {
      expect(BrewingMath.calculateABV(1.010, 1.050)).toBe(0);
      expect(BrewingMath.calculateABV(1.020, 1.020)).toBe(0);
    });

    it('protégé contre les entrées nulles, non finies ou négatives', () => {
      expect(BrewingMath.calculateABV(NaN, 1.010)).toBe(0);
      expect(BrewingMath.calculateABV(1.050, NaN)).toBe(0);
      expect(BrewingMath.calculateABV(1.050, -5)).toBe(0);
      expect(BrewingMath.calculateABV(0.8, 0.7)).toBe(0);
    });
  });

  describe('4. Points d’Extrait, OG, FG et Non-Fermentescibles', () => {
    it('dissout 100 % du sucre sans le pénaliser du rendement de la cuve', () => {
      const sucre: Fermentable = {
        name: 'Sucre candi blanc',
        weightKg: 1,
        potentialPpg: 46,
        kind: 'sucre'
      };
      const pts = BrewingMath.extractPoints([sucre], 20, 75)!;
      expect(pts.total).toBeCloseTo(19.2, 1);
      expect(pts.unfermentable).toBe(0);
    });

    it('isole rigoureusement le lactose pour empêcher la levure de le consommer', () => {
      const lactose: Fermentable = {
        name: 'Lactose',
        weightKg: 0.5,
        potentialPpg: 35,
        kind: 'lactose'
      };
      const pts = BrewingMath.extractPoints([lactose], 20, 75)!;
      expect(pts.total).toBeGreaterThan(0);
      expect(pts.unfermentable).toBe(pts.total);
    });

    it('la FG d’une bière au lactose préserve l’intégralité des points de lactose', () => {
      const fgAvecLactose = BrewingMath.calculateFg(1.050, 80, 10);
      const fgSansLactose = BrewingMath.calculateFg(1.050, 80, 0);

      expect(fgAvecLactose).toBe(1.018);
      expect(fgSansLactose).toBe(1.010);
    });

    it('modèle d’influence de la température d’empâtage sur l’atténuation', () => {
      expect(BrewingMath.attenuationForMashTemp(75, 66.5)).toBe(75.0);
      expect(BrewingMath.attenuationForMashTemp(75, 63)).toBeCloseTo(80.3, 1);
      expect(BrewingMath.attenuationForMashTemp(75, 69)).toBeCloseTo(71.3, 1);
      expect(BrewingMath.attenuationForMashTemp(75, 50)).toBe(83.0);
      expect(BrewingMath.attenuationForMashTemp(75, 80)).toBe(67.0);
    });

    it('perte de rendement aux très hautes densités (saturation moût > 1.065)', () => {
      expect(BrewingMath.efficiencyAtGravity(75, 1.050).lostPoints).toBe(0);
      const imp = BrewingMath.efficiencyAtGravity(75, 1.085);
      expect(imp.lostPoints).toBe(4.0);
      expect(imp.correctedPct).toBe(71.0);
    });
  });

  describe('5. Taux d’Ensemencement de Levure (Pitch Rate White & Zainasheff)', () => {
    it('calcule le besoin en cellules selon le type de fermentation', () => {
      const ale = BrewingMath.pitchRate(1.050, 20, 'ale')!;
      expect(ale.cellsNeededB).toBe(186);
      expect(ale.sachetsDry).toBe(1);

      const lager = BrewingMath.pitchRate(1.050, 20, 'lager')!;
      expect(lager.cellsNeededB).toBe(372);
      expect(lager.sachetsExact).toBe(2.5);
      expect(lager.sachetsDry).toBe(2);
    });

    it('augmente le taux sur les moûts forts en ale (OG >= 1.075)', () => {
      const strongAle = BrewingMath.pitchRate(1.080, 20, 'ale')!;
      expect(strongAle.rate).toBe(1.0);
      expect(strongAle.cellsNeededB).toBe(386);
    });
  });

  describe('6. Bilan Hydrique et Thermodynamique (waterVolumes)', () => {
    const brewhouse: Partial<BrewhouseProfile> = {
      mashRatioLPerKg: 3.5,
      boilOffRatePct: 10,
      deadSpaceL: 1.5
    };

    it('respecte la conservation de la masse et du volume à 100 %', () => {
      const v = BrewingMath.waterVolumes(6, 30, brewhouse, 'batch', 60, 100);

      expect(v.boilOffL).toBe(3.0);
      expect(v.grainAbsorptionL).toBe(5.8);
      expect(v.hopLossL).toBe(0.6);
      expect(v.preBoilVolumeL).toBe(36.3);
      expect(v.mashWaterL).toBe(21.0);
      expect(v.spargeWaterL).toBe(21.1);

      // (Eau empâtage + Eau rinçage) - Rétention drêches === Pré-ébullition
      expect(v.mashWaterL + v.spargeWaterL - v.grainAbsorptionL).toBeCloseTo(v.preBoilVolumeL, 1);
    });

    it('en mode BIAB (spargeType: none), toute l’eau passe par l’empâtage', () => {
      const v = BrewingMath.waterVolumes(6, 30, brewhouse, 'none', 60, 0);
      expect(v.spargeWaterL).toBe(0);
      expect(v.mashWaterL).toBeCloseTo(v.preBoilVolumeL + v.grainAbsorptionL, 1);
    });

    it('le houblonnage à cru (dry hop) ne boit pas d’eau dans la cuve d’ébullition', () => {
      const hops = [
        { weightG: 50, stage: 'boil' as const },
        { weightG: 30, stage: 'whirlpool' as const },
        { weightG: 150, stage: 'dryHop' as const }
      ];
      expect(kettleHopGrams(hops)).toBe(80);
    });
  });

  describe('7. Correction Réfractomètre (Modèle Cubique Sean Terrill)', () => {
    it('sur un échantillon non fermenté, restitue la densité initiale exacte', () => {
      const og = 1.055;
      const brix = BrewingMath.sgToBrix(og);
      const corrected = BrewingMath.calculateSeanTerrillRefractometer(og, brix);
      expect(corrected).toBeCloseTo(og, 2);
    });

    it('corrige la présence d’alcool sur un moût fermenté', () => {
      const corrected = BrewingMath.calculateSeanTerrillRefractometer(1.050, 6.0);
      expect(corrected).toBeCloseTo(1.010, 2);
    });
  });

  describe('8. Carbonatation, CO2 Résiduel et Resucrage (Loi de Henry)', () => {
    it('le CO2 résiduel dissous diminue avec l’élévation de la température', () => {
      const co2Froid = BrewingMath.calculateResidualCo2Vol(4);
      const co2Cave = BrewingMath.calculateResidualCo2Vol(15);
      const co2Ambiant = BrewingMath.calculateResidualCo2Vol(20);
      const co2Chaud = BrewingMath.calculateResidualCo2Vol(25);

      expect(co2Froid).toBeGreaterThan(co2Cave);
      expect(co2Cave).toBeGreaterThan(co2Ambiant);
      expect(co2Ambiant).toBeGreaterThan(co2Chaud);
      expect(co2Ambiant).toBeCloseTo(0.86, 1);
    });

    it('stœchiométrie exacte du sucre de refermentation (dextrose monohydraté vs saccharose)', () => {
      const dextroseG = BrewingMath.calculatePrimingSugarG(2.5, 20, 20, 'dextrose');
      const saccharoseG = BrewingMath.calculatePrimingSugarG(2.5, 20, 20, 'saccharose');

      expect(dextroseG).toBe(131);
      expect(saccharoseG).toBe(127);
      expect(saccharoseG).toBeLessThan(dextroseG);
    });

    it('pression d’équilibre en fût (abaque de Zahm & Nagel)', () => {
      // 2.5 volumes à 4 °C demande environ 0.82 bar (11.9 PSI)
      expect(BrewingMath.calculateKegPressureBar(2.5, 4)).toBeCloseTo(0.82, 1);
      // 2.5 volumes à 10 °C demande environ 1.21 bar (17.55 PSI)
      expect(BrewingMath.calculateKegPressureBar(2.5, 10)).toBeCloseTo(1.21, 1);
    });
  });

  describe('9. Impôt Suisse sur la Bière (OFDF / BAZG RS 641.411)', () => {
    it('applique le tarif légal par palier et taxe uniquement les volumes conditionnés', () => {
      const batches: Batch[] = [
        {
          id: 'B1',
          name: 'Blonde',
          style: 'Ale',
          volumeL: 100,
          volumePackagedL: 95,
          status: 'termine',
          brewDate: '01.03.2026',
          bottlingDate: '20.03.2026'
        },
        {
          id: 'B2',
          name: 'Ambrée',
          style: 'Ale',
          volumeL: 100,
          volumePackagedL: 0,
          status: 'fermentation',
          brewDate: '15.03.2026'
        },
        {
          id: 'B3',
          name: 'Ratée',
          style: 'Ale',
          volumeL: 100,
          volumePackagedL: 100,
          status: 'annule',
          brewDate: '10.03.2026'
        }
      ];

      const res = BrewingMath.calculateSwissBeerTax(batches);
      expect(res.totalVolumeL).toBe(95);
      expect(res.totalHectoliters).toBe(0.95);
      expect(res.isSmallBrewerRate).toBe(true);
      expect(res.reductionPct).toBe(40);
      expect(res.taxDueCHF).toBe(14.36);
    });
  });

});
