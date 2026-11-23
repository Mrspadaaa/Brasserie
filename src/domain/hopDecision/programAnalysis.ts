import { estimateBoilIbu, hopDosePerLitre, introducedHopAmounts } from './calculations';
import { combineNumeric, nominalResult, readHopAnalysis, unknownResult } from './measurements';
import { readHopAlphaForAddition } from './modelInputs';
import type { HopDecisionMaterial, HopDecisionProgram, HopNumericResult } from './types';

export interface HopProgramAnalysis {
  additions: Array<{ id: string; status: 'planned' | 'performed'; doseGL: HopNumericResult; alphaGrams: HopNumericResult; oilMl: HopNumericResult; boilIbu: HopNumericResult }>;
  alphaGrams: HopNumericResult;
  oilMl: HopNumericResult;
  /** Only the known subtotal; never presented as a complete total when an addition is unknown. */
  documentedSubtotals: { alphaGrams: HopNumericResult; oilMl: HopNumericResult; boilIbu: HopNumericResult };
  hotIbu: HopNumericResult;
  finalBeerIbu: HopNumericResult;
  limits: string[];
}

function sum(values: HopNumericResult[], unit: string) {
  if (!values.length) return nominalResult(0, unit, 'Aucun ajout contributeur.');
  return combineNumeric(values, unit, bounds => ({ min: bounds.reduce((n, b) => n + b.min, 0), max: bounds.reduce((n, b) => n + b.max, 0) }), 'Somme de charges ou d’estimations documentées ; les incertitudes ne sont pas réduites par répétition.');
}

export function analyzeHopProgram(program: HopDecisionProgram, materials: HopDecisionMaterial[]): HopProgramAnalysis {
  const additions = program.additions.map(addition => {
    const material = materials.find(m => m.id === addition.materialId);
    const amounts = material ? introducedHopAmounts(material, addition.grams)
      : { alphaGrams: unknownResult('g alpha', 'Matière non résolue.'), oilMl: unknownResult('mL huile', 'Matière non résolue.') };
    const boilIbu = material
      ? estimateBoilIbu({ grams: addition.grams, alpha: readHopAlphaForAddition(material, addition), volumeL: program.volumeL, wortGravity: program.wortGravity, minutes: addition.boilMinutes ?? null, use: addition.use, modelContext: program.ibuModelContext })
      : unknownResult('IBU estimés', 'Matière non résolue.');
    return { id: addition.id, status: addition.status, doseGL: hopDosePerLitre(addition.grams, program.volumeL), ...amounts, boilIbu };
  });
  const hotRows = additions.filter((_, i) => !['fermentation', 'postFermentation'].includes(program.additions[i].use) && program.additions[i].grams !== 0);
  const hotSum = sum(hotRows.map(a => a.boilIbu), 'IBU estimés');
  const hotIbu = { ...hotSum, reasons: [...new Set([...hotSum.reasons, ...hotRows.flatMap(a => a.boilIbu.reasons)])] };
  const cold = program.additions.some(a => ['fermentation', 'postFermentation'].includes(a.use) && a.grams !== 0);
  const subtotal = (values: HopNumericResult[], unit: string) => {
    const known = values.filter(v => v.status === 'nominal' || v.status === 'range');
    if (!known.length && values.length) return unknownResult(unit, 'Aucun ajout documenté pour calculer ce sous-total.');
    const result = sum(known, unit);
    return { ...result, reasons: [...result.reasons, `${known.length}/${values.length} ajouts documentés ; ce sous-total n’est pas le total si des valeurs manquent.`] };
  };
  return { additions, alphaGrams: sum(additions.map(a => a.alphaGrams), 'g alpha'), oilMl: sum(additions.map(a => a.oilMl), 'mL huile'),
    documentedSubtotals: { alphaGrams: subtotal(additions.map(a => a.alphaGrams), 'g alpha'), oilMl: subtotal(additions.map(a => a.oilMl), 'mL huile'), boilIbu: subtotal(hotRows.map(a => a.boilIbu), 'IBU estimés') },
    hotIbu,
    finalBeerIbu: unknownResult('IBU finaux', cold
      ? 'Houblonnage à cru : extraction d’humulinones et pertes d’iso-alpha possibles ; aucun IBU final universel déduit du seul dosage.'
      : 'Tinseth estime l’amertume des ajouts à l’ébullition ; aucune analyse de la bière finie n’a été fournie.'),
    limits: ['Les masses et huiles sont des charges introduites ; leur rétention et la perception ne sont pas calculées.',
      'Les bornes arithmétiques sont conditionnelles aux analyses et ne sont pas des intervalles de confiance de bière.',
      'Les modèles sensoriels expérimentaux historiques restent séparés de ce bilan analytique.'] };
}

export function compareHopPrograms(before: HopDecisionProgram, after: HopDecisionProgram, materials: HopDecisionMaterial[]) {
  const baseline = analyzeHopProgram(before, materials), candidate = analyzeHopProgram(after, materials);
  const delta = (a: HopNumericResult, b: HopNumericResult) => combineNumeric([a, b], a.unit, ([x, y]) => ({ min: y.min - x.max, max: y.max - x.min }), 'Après − avant ; bornes conservatrices, pas variation sensorielle.');
  return { before: baseline, after: candidate, delta: { alphaGrams: delta(baseline.alphaGrams, candidate.alphaGrams), oilMl: delta(baseline.oilMl, candidate.oilMl), hotIbu: delta(baseline.hotIbu, candidate.hotIbu) } };
}
