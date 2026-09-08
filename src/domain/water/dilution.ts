import { WaterIons, SaltId, AcidId } from '../../types';
import type { IonBand } from '../../types';
import { solveSalts } from './solve';
import { RaBand } from './mashPh';
import { ACIDS, LACTATE_TASTE_THRESHOLD } from './substances';
import { dilute } from './ions';
import { ION_LABEL } from './labels';
import { calculateSpargeTreatment, lactateInBeer } from './acid';
import { calculateWaterTreatment } from './treatment';
import type { MineralTargetMode } from './practice';
import { assessWaterProfile } from './profileAssessment';

// --- Juste assez d'osmosée ----------------------------------------------------

export interface MinimalDilutionInput {
  mineralTargetMode?: MineralTargetMode;
  fitBicarbonate?: boolean;
  profilePriority?: boolean;
  targetedIons?: Array<keyof WaterIons>;
  hco3Target?: number;
  hco3Range?: IonBand;
  hco3Preferred?: number;
  acidOverride?: { mash?: number; sparge?: number };
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
  /** False when even pure RO cannot satisfy the retained treatment constraints. */
  feasible: boolean;
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
    return { feasible: false, pct: 0, reasons: ['Volumes d’eau nécessaires pour proposer une dilution.'], acid: { mash: 0, sparge: 0, unit: def.unit, name: def.name, hco3Left: 0 } };
  }

  const cache = new Map<number, ReturnType<typeof solveSalts>>();
  const solveAt = (pct: number) => {
    if (cache.has(pct)) return cache.get(pct)!;
    const start = dilute(input.source, pct);
    const solved = solveSalts({
      mineralTargetMode: input.mineralTargetMode,
      fitBicarbonate: input.fitBicarbonate,
      profilePriority: input.profilePriority,
      targetedIons: input.targetedIons,
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
      allSaltsInMash: input.allSaltsInMash,
      mashAcidHco3Mg: (input.acidOverride?.mash ?? 0) * ACIDS[input.acid].hco3NeutralizedPerUnit,
      spargeHco3AfterAcid: input.fitBicarbonate ?? input.mineralTargetMode === 'target'
        ? calculateSpargeTreatment(start, input.spargeWaterL, input.acid, {
          sourcePh: input.sourcePh, override: input.acidOverride?.sparge
        }).ions.hco3 : undefined
    });
    cache.set(pct, solved);
    return solved;
  };
  const treatmentAt = (pct: number) => calculateWaterTreatment(
    { ...input.source, id: 'dilution', name: 'Eau de départ', ph: input.sourcePh },
    {
      diRatioPct: pct, doses: solveAt(pct).doses,
      mashWaterL: input.mashWaterL, spargeWaterL: input.spargeWaterL,
      allSaltsInMash: input.allSaltsInMash, acidId: input.acid,
      acidOverride: input.acidOverride, hco3Target: input.hco3Target, hco3Range: input.hco3Range,
      hco3Preferred: input.hco3Preferred
    },
    input.targetRa
  );
  const evaluate = (pct: number): string[] => {
    const start = dilute(input.source, pct);
    const reasons: string[] = [];
    if (input.profilePriority) {
      const result = assessWaterProfile(treatmentAt(pct).treatedTotal, input.ranges, input.targetedIons);
      for (const deviation of result.deviations)
        reasons.push(`${ION_LABEL[deviation.ion]} après traitement : ${deviation.value} ppm pour ${deviation.min}–${deviation.max} visés`);
    }

    (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
      const max = input.ranges?.[ion]?.max;
      if (max == null || !Number.isFinite(max)) return;
      if (start[ion] > max + 2) {
        reasons.push(`${ION_LABEL[ion].toLowerCase()} du réseau à ${Math.round(input.source[ion])} ppm pour ${max} au maximum du style`);
      }
    });

    /** Repère de confort maison pour limiter les acides. Ce seuil de dilution est une politique, pas une limite chimique de neutralisation. */
    const hco3Max = input.ranges?.hco3?.max;
    if (hco3Max != null && Number.isFinite(hco3Max) && start.hco3 > hco3Max + HCO3_ACID_TOLERANCE_PPM) {
      reasons.push(
        `bicarbonate du réseau à ${Math.round(input.source.hco3)} ppm ; repère de dilution ${hco3Max + HCO3_ACID_TOLERANCE_PPM} ppm pour limiter la charge d’acide`
      );
    }

    if (input.acid === 'lactique' && input.beerVolumeL > 0) {
      const treatment = treatmentAt(pct);
      const mash = treatment.mashAcid.amount;
      const sparge = treatment.spargeAcid.amount;
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
    const treatment = treatmentAt(pct);
    const mash = treatment.mashAcid;
    const sparge = treatment.spargeAcid;
    return { mash: mash.amount, sparge: sparge.amount, unit: mash.unit, name: mash.name, hco3Left: start.hco3 };
  };

  const atZero = evaluate(0);
  if (atZero.length === 0) return { feasible: true, pct: 0, reasons: [], acid: acidAt(0) };

  for (let pct = 5; pct <= 100; pct += 5) {
    if (evaluate(pct).length === 0) return { feasible: true, pct, reasons: atZero, acid: acidAt(pct) };
  }
  return { feasible: false, pct: 100, reasons: [
    'La dilution seule ne suffit pas avec les doses d’acide retenues.', ...evaluate(100)
  ], acid: acidAt(100) };
}
