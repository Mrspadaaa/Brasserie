import { WaterIons, SaltId, AcidId } from '../../types';
import type { IonBand } from '../../types';
import { solveSalts } from './solve';
import { RaBand, raAcidTarget } from './mashPh';
import { ACIDS, LACTATE_TASTE_THRESHOLD } from './substances';
import { dilute } from './ions';
import { ION_LABEL } from './labels';
import { acidNeeded, spargeAcidNeeded, SPARGE_TARGET_PH, lactateInBeer } from './acid';
import type { MineralTargetMode } from './practice';

// --- Juste assez d'osmosée ----------------------------------------------------

export interface MinimalDilutionInput {
  mineralTargetMode?: MineralTargetMode;
  source: WaterIons;
  target: WaterIons;
  ranges: Record<keyof WaterIons, IonBand>;
  totalWaterL: number;
  mashWaterL: number;
  spargeWaterL: number;
  targetRa: RaBand;
  raCeiling?: number | null;
  ratio?: number;
  disabled?: SaltId[];
  allSaltsInMash?: boolean;
  acid: AcidId;
  /** Litres de bière en cuve : c'est là que l'acide lactique se goûte. */
  beerVolumeL: number;
  sourcePh?: number;
}

export interface MinimalDilution {
  /** Part d'osmosée, en %, la même pour les deux eaux. */
  pct: number;
  /** Ce qui a imposé cette part. Vide : le réseau suffit tel quel. */
  reasons: string[];
  /**
   * Ce que l'acide neutralise ENCORE à cette part — le bicarbonate qui reste
   * n'est pas exempté, il est corrigé. Doses d'empâtage et de rinçage, dans
   * l'unité de l'acide choisi.
   */
  acid: { mash: number; sparge: number; unit: string; name: string; hco3Left: number };
}

/**
 * La part d'osmosée la plus BASSE qui permette encore d'atteindre le style.
 *
 * ⚠️ L'osmosée coûte cher, et « coupe à l'osmosée » était laissé au jugement :
 * on coupait à 50 % par habitude, ou à 100 % « pour être tranquille ». Or un
 * sel ne fait que MONTER une concentration : la seule raison de couper, c'est
 * un ion du réseau déjà AU-DESSUS du maximum du style — ou un acide lactique
 * qu'on goûterait. Rien d'autre. Sur une stout depuis Fribourg, c'est 0 %.
 *
 * On rejoue donc tout le calcul — dilution, sels, acides — de 0 à 100 % et on
 * s'arrête à la première part qui passe. Deux critères, et pas un de plus :
 *
 *   1. aucun ion du MOÛT au-dessus du maximum du style à cause du réseau ;
 *   2. l'acide lactique, empâtage et rinçage CUMULÉS, sous son seuil de
 *      perception — critère levé pour le phosphorique, qui ne se goûte pas.
 *
 * Le pas est de 5 % : on ne prépare pas 17.3 % d'osmosée dans un bidon.
 */
/** Bicarbonate qu'on accepte de neutraliser à l'acide au-delà du maximum du style, en ppm. */
export const HCO3_ACID_TOLERANCE_PPM = 100;

export function minimalDilution(input: MinimalDilutionInput): MinimalDilution {
  const total = input.totalWaterL;
  if (!total || !Number.isFinite(total) || total <= 0) {
    const def = ACIDS[input.acid];
    return { pct: 0, reasons: [], acid: { mash: 0, sparge: 0, unit: def.unit, name: def.name, hco3Left: 0 } };
  }

  const cache = new Map<number, ReturnType<typeof solveSalts>>();
  const solveAt = (pct: number) => {
    if (cache.has(pct)) return cache.get(pct)!;
    const start = dilute(input.source, pct);
    const solved = solveSalts({
      mineralTargetMode: input.mineralTargetMode,
      start,
      startSparge: start,
      target: input.target,
      ranges: input.ranges,
      totalWaterL: total,
      mashWaterL: input.mashWaterL,
      disabled: input.disabled,
      targetRa: input.targetRa,
      raCeiling: input.raCeiling,
      ratio: input.ratio,
      allSaltsInMash: input.allSaltsInMash
    });
    cache.set(pct, solved);
    return solved;
  };
  const evaluate = (pct: number): string[] => {
    const start = dilute(input.source, pct);
    const solved = solveAt(pct);
    const reasons: string[] = [];

    (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
      const max = input.ranges?.[ion]?.max;
      if (max == null || !Number.isFinite(max)) return;
      if (start[ion] > max + 2) {
        reasons.push(`${ION_LABEL[ion].toLowerCase()} du réseau à ${Math.round(input.source[ion])} ppm pour ${max} au maximum du style`);
      }
    });

    /*
     * ⚠️ Le bicarbonate compte AUSSI, dans la limite de ce que l'acide corrige
     * honnêtement. Sans ce critère, une Pils depuis Fribourg sortait à 0 %
     * d'osmosée au phosphorique : 250 ppm de bicarbonate « neutralisés », mais
     * l'anion de l'acide reste dans la bière (4 mmol/L de phosphate ou de
     * lactate), le calcium précipite en phosphate, et ce n'est plus une eau de
     * Pils. Au-delà de 100 ppm de HCO₃ au-dessus du maximum du style — ce que
     * n'importe quel brasseur corrige à l'acide sans y penser —, on coupe.
     * Sur une porter (max 180) ou une stout (250), Fribourg passe tel quel.
     */
    const hco3Max = input.ranges?.hco3?.max;
    if (hco3Max != null && Number.isFinite(hco3Max) && start.hco3 > hco3Max + HCO3_ACID_TOLERANCE_PPM) {
      reasons.push(
        `bicarbonate du réseau à ${Math.round(input.source.hco3)} ppm pour ${hco3Max} au maximum du style — l’acide n’en corrige raisonnablement que ${HCO3_ACID_TOLERANCE_PPM} de plus`
      );
    }

    if (input.acid === 'lactique' && input.beerVolumeL > 0) {
      const mash = acidNeeded(solved.achievedMash, input.mashWaterL, raAcidTarget(input.targetRa), 'lactique').amount;
      const sparge = spargeAcidNeeded(
        solved.achievedSparge,
        input.spargeWaterL,
        'lactique',
        SPARGE_TARGET_PH,
        input.sourcePh ?? 7.4
      ).amount;
      const lactate = lactateInBeer(mash + sparge, input.beerVolumeL);
      if (lactate > LACTATE_TASTE_THRESHOLD) {
        reasons.push(
          `acide lactique à ${lactate} g/L de bière (seuil ${LACTATE_TASTE_THRESHOLD}) — ou passe au phosphorique, qui ne se goûte pas`
        );
      }
    }
    return reasons;
  };

  /* Les doses d'acide à une part donnée : ce qui reste du bicarbonate y passe. */
  const acidAt = (pct: number): MinimalDilution['acid'] => {
    const start = dilute(input.source, pct);
    const solved = solveAt(pct);
    const mash = acidNeeded(solved.achievedMash, input.mashWaterL, raAcidTarget(input.targetRa), input.acid);
    const sparge = spargeAcidNeeded(
      solved.achievedSparge,
      input.spargeWaterL,
      input.acid,
      SPARGE_TARGET_PH,
      input.sourcePh ?? 7.4
    );
    return { mash: mash.amount, sparge: sparge.amount, unit: mash.unit, name: mash.name, hco3Left: start.hco3 };
  };

  const atZero = evaluate(0);
  if (atZero.length === 0) return { pct: 0, reasons: [], acid: acidAt(0) };

  for (let pct = 5; pct <= 100; pct += 5) {
    if (evaluate(pct).length === 0) return { pct, reasons: atZero, acid: acidAt(pct) };
  }
  return { pct: 100, reasons: atZero, acid: acidAt(100) };
}
