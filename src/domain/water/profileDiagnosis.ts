import type { IonBand, SaltId, WaterIons } from '../../types';
import type { calculateWaterTreatment } from './treatment';
import { assessWaterProfile, PROFILE_IONS } from './profileAssessment';
import { SALTS, SALT_IDS, saltIons } from './substances';
import { ION_LABEL, ION_SYMBOL_SHORT } from './labels';

type Treatment = ReturnType<typeof calculateWaterTreatment>;
export interface ProfileDiagnosis {
  code: 'proposal' | 'manual-acid' | 'source' | 'sparge' | 'excluded' | 'coupled' | 'weighing' | 'ratio' | 'retained';
  ions: Array<keyof WaterIons>;
  message: string;
}
const number = (value: number) => Number(value.toFixed(1)).toLocaleString('fr-CH');
const ratioNumber = (value: number) => Number(value.toFixed(2)).toLocaleString('fr-CH');

/** Explanations are based on a measured gap, a calculated alternative, or an
 * explicit bound. A failed local fit alone is never a proof of impossibility.
 */
export function diagnoseWaterProfile(input: {
  actual: Treatment;
  proposal?: Treatment;
  automaticAcid?: Treatment;
  ranges: Record<keyof WaterIons, IonBand>;
  targeted?: ReadonlyArray<keyof WaterIons>;
  disabled?: SaltId[];
  totalWaterL: number;
  spargeWaterL: number;
  requestedRatio?: number;
}) {
  const { actual, proposal, automaticAcid, ranges } = input;
  const diagnoses: ProfileDiagnosis[] = [];
  const off = new Set(input.disabled ?? []);
  const assessment = assessWaterProfile(actual.treatedTotal, ranges, input.targeted);
  const inside = (water: WaterIons, ion: keyof WaterIons) => water[ion] >= ranges[ion].min && water[ion] <= ranges[ion].max;
  const recoverable: Array<keyof WaterIons> = [];
  for (const deviation of assessment.deviations) {
    const { ion, min, max, value } = deviation;
    if (ion === 'hco3' && automaticAcid && inside(automaticAcid.treatedTotal, ion)) {
      diagnoses.push({ code: 'manual-acid', ions: [ion], message:
        `Les doses d’acide retenues donnent ${number(value)} ppm de HCO₃. Avec les mêmes sels et les acides calculés : ${number(automaticAcid.treatedTotal.hco3)} ppm, dans la cible. Recalculer l’acide reste un choix explicite.` });
      continue;
    }
    if (proposal && inside(proposal.treatedTotal, ion)) {
      recoverable.push(ion);
      continue;
    }
    if (ion !== 'hco3' && actual.startTotal[ion] > max) {
      diagnoses.push({ code: 'source', ions: [ion], message:
        `${ION_LABEL[ion]} : l’eau après dilution en apporte déjà ${number(actual.startTotal[ion])} ppm, au-dessus du maximum ${number(max)}. Un sel ne peut pas en retirer ; revoir la dilution ou la source.` });
      continue;
    }
    const spargeFloor = input.totalWaterL > 0 ? actual.treated.sparge.hco3 * input.spargeWaterL / input.totalWaterL : 0;
    if (ion === 'hco3' && spargeFloor > max) {
      diagnoses.push({ code: 'sparge', ions: [ion], message:
        `Le rinçage apporte à lui seul ${number(spargeFloor)} ppm de HCO₃ dans la moyenne, pour ${number(max)} au maximum. Corriger seulement l’empâtage ne suffit pas ; revoir la dilution ou l’acide du rinçage.` });
      continue;
    }
    const carriers = SALT_IDS.filter(id => (saltIons(id)[ion] ?? 0) > 0);
    if (value < min && carriers.every(id => off.has(id))) {
      diagnoses.push({ code: 'excluded', ions: [ion], message:
        `${ION_LABEL[ion]} : les sels qui peuvent combler le manque sont écartés (${carriers.map(id => SALTS[id].name).join(', ')}). Réactiver un produit disponible permet de chercher un autre dosage.` });
      continue;
    }
    if (!proposal && input.disabled == null) {
      // Reading a saved recipe does not run the solver or invent its inventory.
      diagnoses.push({ code: 'retained', ions: [ion], message:
        `${ION_LABEL[ion]} : départ dilué ${number(actual.startTotal[ion])}, sels +${number(Math.max(0, actual.total[ion] - actual.startTotal[ion]))}${ion === 'hco3' ? `, acide −${number(Math.max(0, actual.total[ion] - value))}` : ''}, résultat ${number(value)} ppm. Les doses retenues expliquent cet écart ; ouvrir l’atelier pour comparer un nouveau dosage.` });
      continue;
    }
    // A concrete single-addition tradeoff. This does not claim that a full
    // redistribution of the other salts is mathematically impossible.
    const base = proposal?.treatedTotal ?? actual.treatedTotal;
    const coupled = value < min && input.totalWaterL > 0 && ion !== 'hco3'
      ? carriers.filter(id => !off.has(id)).map(id => {
        const coefficients = saltIons(id);
        const grams = Math.ceil(Math.max(0, min - base[ion]) * input.totalWaterL / coefficients[ion]! * 10) / 10;
        const blockers = PROFILE_IONS.filter(other => other !== ion && other !== 'hco3')
          .map(other => ({ ion: other, value: base[other] + (coefficients[other] ?? 0) * grams / input.totalWaterL, max: ranges[other].max }))
          .filter(item => item.value > item.max + 0.05);
        return { id, grams, blockers };
      }).filter(item => item.grams > 0 && item.blockers.length > 0)
        .sort((a, b) => a.blockers.length - b.blockers.length || a.grams - b.grams)[0] : undefined;
    if (coupled) {
      diagnoses.push({ code: 'coupled', ions: [ion], message:
        `Combler ${ION_SYMBOL_SHORT[ion]} avec ${number(coupled.grams)} g de ${SALTS[coupled.id].name} seuls porterait ${coupled.blockers.map(item => `${ION_SYMBOL_SHORT[item.ion]} à ${number(item.value)} ppm (maximum ${number(item.max)})`).join(' et ')}. Cet ajout seul dépasserait une limite ; chercher une autre répartition des sels ou revoir la dilution.` });
    } else {
      diagnoses.push({ code: 'weighing', ions: [ion], message:
        `${ION_LABEL[ion]} reste hors plage avec les doses retenues. Aucun dosage conforme n’a été trouvé avec ces sels, ces acides et la précision de pesée ; les plages n’ont pas été élargies. Revoir les doses manuelles ou les produits autorisés.` });
    }
  }
  if (recoverable.length) diagnoses.unshift({ code: 'proposal', ions: recoverable, message:
    `La proposition ramène ${recoverable.map(ion => ION_SYMBOL_SHORT[ion]).join(', ')} dans les plages. « Doser » applique ces pesées et conserve les doses d’acide manuelles.` });

  const requested = input.requestedRatio;
  const ratio = actual.treatedTotal.cl > 0 ? actual.treatedTotal.so4 / actual.treatedTotal.cl : null;
  if (Number.isFinite(requested) && (ratio == null || Math.abs(ratio - requested!) > 0.03)) {
    const min = ranges.cl.max > 0 ? ranges.so4.min / ranges.cl.max : Infinity;
    const max = ranges.cl.min > 0 ? ranges.so4.max / ranges.cl.min : Infinity;
    const conflict = requested! < min || requested! > max;
    const proof = requested! > max
      ? `Avec Cl ≥ ${number(ranges.cl.min)}, il faudrait SO₄ ≥ ${number(requested! * ranges.cl.min)} ppm ; le profil le limite à ${number(ranges.so4.max)}.`
      : `Avec SO₄ ≥ ${number(ranges.so4.min)} et Cl ≤ ${number(ranges.cl.max)}, le rapport minimum est d’environ ${ratioNumber(min)}.`;
    diagnoses.push({ code: 'ratio', ions: ['so4', 'cl'], message: conflict
      ? `Le rapport demandé ${ratioNumber(requested!)}:1 est incompatible avec les plages SO₄/Cl. ${proof}`
      : `Le rapport obtenu ${ratio == null ? 'n’est pas défini' : `est ${ratioNumber(ratio)}:1`} pour ${ratioNumber(requested!)}:1 demandé. Les concentrations, les apports liés des sels et les pesées au dixième restent pris en compte ; le rapport seul ne suffit pas à décrire le goût.` });
  }
  return diagnoses;
}
