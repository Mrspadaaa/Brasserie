import { WaterIons, SaltId } from '../../types';
import { SALT_IDS, isAlkaline, ionsFromSalts } from './substances';
import { addIons } from './ions';

/**
 * Répartition des doses entre l'empâtage et le rinçage.
 *
 * ⚠️ Dans la plupart des brasseries, on ne dose pas de sels minéraux dans la
 * cuve d'eau de rinçage : tous les sels vont dans la maische (`allSaltsInMash: true`),
 * et le rinçage n'est ajusté qu'à l'acide.
 * Si `allSaltsInMash` est faux : les sels de saveur se répartissent au prorata des volumes,
 * et les sels ALCALINS vont entièrement à l'empâtage.
 */
export function splitDoses(
  doses: Partial<Record<SaltId, number>>,
  mashWaterL: number,
  spargeWaterL: number,
  /** ⚠️ VRAI par défaut : c'est la pratique recommandée, et ce que l'assistant enregistre. */
  allSaltsInMash: boolean = true
): { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> } {
  const total = mashWaterL + spargeWaterL;
  const mash: Partial<Record<SaltId, number>> = {};
  const sparge: Partial<Record<SaltId, number>> = {};
  if (total <= 0) return { mash, sparge };

  if (allSaltsInMash) {
    SALT_IDS.forEach((id) => {
      const g = doses[id];
      if (g && g > 0) {
        mash[id] = g;
      }
    });
    return { mash, sparge };
  }

  SALT_IDS.forEach((id) => {
    const g = doses[id];
    if (!g) return;
    if (isAlkaline(id)) {
      mash[id] = g;
      return;
    }
    const m = Math.round(g * (mashWaterL / total) * 10) / 10;
    mash[id] = m;
    const s = Math.round((g - m) * 10) / 10;
    if (s > 0) sparge[id] = s;
  });
  return { mash, sparge };
}

/**
 * Les deux eaux d'un plan : celle de l'empâtage et celle du rinçage.
 *
 * ⚠️ Ce ne sont pas deux fois la même. Les sels alcalins ne sont versés que
 * dans la première, et sur son seul volume. Tout ce qui lit une composition
 * d'eau passe par ici, pour qu'aucun écran ne calcule la sienne.
 *
 * ⚠️ `startSparge` : les deux eaux ne partent plus forcément du même point. On
 * coupe couramment le RINÇAGE à 90 % d'osmosée alors que l'empâtage reste sur
 * le réseau — c'est la façon la moins chère d'éviter l'astringence, et elle ne
 * coûte pas un millilitre d'acide. Absent, il vaut `start` : tous les appels
 * qui ne connaissent qu'une dilution restent justes.
 */
export function waterFromPlan(
  start: WaterIons,
  doses: Partial<Record<SaltId, number>>,
  mashWaterL: number,
  spargeWaterL: number,
  startSparge: WaterIons = start,
  /** ⚠️ VRAI par défaut — même convention que `splitDoses`. */
  allSaltsInMash: boolean = true
): { mash: WaterIons; sparge: WaterIons } {
  const total = mashWaterL + spargeWaterL;
  const { mash, sparge } = splitDoses(doses, mashWaterL, spargeWaterL, allSaltsInMash);
  return {
    mash: addIons(start, ionsFromSalts(mash, mashWaterL > 0 ? mashWaterL : total)),
    sparge: addIons(startSparge, ionsFromSalts(sparge, spargeWaterL))
  };
}

