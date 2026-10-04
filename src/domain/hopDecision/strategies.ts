import { replacementHopDose } from './calculations';
import { compareHopPrograms } from './programAnalysis';
import { previewHopProgramChanges } from './programs';
import { chooseHopSubstitutionDose, findHopSubstitutions } from './substitution';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition, HopProgramChange, HopReplacementBasis, HopUse } from './types';

/** Exact physical references only. Names or variety IDs never merge two supplies. */
export function samePhysicalHopMaterial(a: HopDecisionMaterial, b: HopDecisionMaterial): boolean {
  if (a.id === b.id) return true;
  const aStock = a.stockItemRef ?? a.lot?.stockItemRef, bStock = b.stockItemRef ?? b.lot?.stockItemRef;
  const aLot = a.lot?.id, bLot = b.lot?.id;
  if (!aStock && !aLot || !bStock && !bLot) return false;
  return aStock === bStock && aLot === bLot && a.form === b.form
    && (!a.product || !b.product || a.product.id === b.product.id);
}

/** Explicit allocations conserve the chosen input quantity; sensory profiles are not blended. */
export function proposeHopBlend(input: {
  program: HopDecisionProgram; additionId: string; materials: HopDecisionMaterial[];
  basis: Exclude<HopReplacementBasis, 'manufacturer'>;
  allocations: Array<{ materialId: string; fraction: number; chosenGrams?: number }>;
}) {
  const sourceAddition = input.program.additions.find(a => a.id === input.additionId);
  const source = input.materials.find(m => m.id === sourceAddition?.materialId);
  if (!sourceAddition || !source) throw Error('Ajout ou matière de référence introuvable.');
  if (sourceAddition.status !== 'planned') throw Error('Un ajout effectué ne peut pas être remplacé par un mélange.');
  if (input.allocations.length < 2 || new Set(input.allocations.map(a => a.materialId)).size !== input.allocations.length
    || input.allocations.some(a => !Number.isFinite(a.fraction) || a.fraction <= 0)
    || Math.abs(input.allocations.reduce((n, a) => n + a.fraction, 0) - 1) > 1e-10) throw Error('Donner au moins deux matières distinctes et des fractions positives dont la somme vaut 1.');
  const parts = input.allocations.map((allocation, index) => {
    const material = input.materials.find(m => m.id === allocation.materialId);
    if (!material) throw Error('Matière du mélange introuvable.');
    const dose = replacementHopDose({ from: source, to: material, grams: sourceAddition.grams, basis: input.basis, use: sourceAddition.use, fraction: allocation.fraction });
    const chosen = allocation.chosenGrams ?? dose.value;
    if (allocation.chosenGrams !== undefined && (!Number.isFinite(allocation.chosenGrams) || allocation.chosenGrams < 0
      || dose.status === 'unknown' || dose.status === 'conflict'
      || dose.range && (allocation.chosenGrams < dose.range.min || allocation.chosenGrams > dose.range.max)
      || dose.status === 'nominal' && allocation.chosenGrams !== dose.value)) throw Error('La dose choisie ne correspond pas à la convention du mélange.');
    const addition: HopProgramAddition = { ...sourceAddition, id: `${sourceAddition.id}:blend:${index + 1}`, materialId: material.id, grams: chosen,
      alphaForModel: material.id === sourceAddition.materialId ? sourceAddition.alphaForModel : undefined };
    return { materialId: material.id, fraction: allocation.fraction, dose, addition };
  });
  const complete = parts.every(p => p.addition.grams !== null);
  const proposal = complete ? previewHopProgramChanges(input.program,
    [{ kind: 'replace', additionId: sourceAddition.id, additions: parts.map(p => p.addition) }], input.materials) : null;
  return { parts, proposal, comparison: proposal ? compareHopPrograms(input.program, proposal.program, input.materials) : null,
    reasons: ['Les fractions partagent la charge de référence choisie, pas le goût.',
      'Aucune synergie chiffrée ni profil sensoriel obtenu par moyenne des matières.',
      'Les doses issues de plages restent des hypothèses conditionnelles ; le bilan expose les charges possibles.'],
    missing: complete ? [] : ['Choisir explicitement les doses dans les plages ou fournir les analyses utiles.'] };
}

export function proposeHopUseChange(input: {
  program: HopDecisionProgram; additionId: string; grams: number; use: HopUse;
  parameters?: Pick<HopProgramAddition, 'boilMinutes' | 'contactHours' | 'temperatureC' | 'dayOffset'>;
  materials: HopDecisionMaterial[];
}) {
  const source = input.program.additions.find(a => a.id === input.additionId);
  if (!source || source.status !== 'planned' || source.grams === null) throw Error('Ajout prévu et masse de référence connus requis.');
  if (!Number.isFinite(input.grams) || input.grams <= 0 || input.grams > source.grams || input.use === source.use) throw Error('Choisir une quantité disponible et un emploi différent.');
  const remainder = source.grams - input.grams;
  const shifted: HopProgramAddition = { id: `${source.id}:shifted`, materialId: source.materialId, grams: input.grams,
    status: 'planned', use: input.use, alphaForModel: source.alphaForModel, ...input.parameters };
  const changes: HopProgramChange[] = [{ kind: 'replace', additionId: source.id,
    additions: [...(remainder > 0 ? [{ ...source, grams: remainder }] : []), shifted] }];
  const proposal = previewHopProgramChanges(input.program, changes, input.materials);
  return { proposal, comparison: compareHopPrograms(input.program, proposal.program, input.materials),
    reasons: ['La charge de matière déplacée est conservée ; extraction, rétention et transformation ne le sont pas automatiquement.',
      'Le temps, la température et le contact de l’ancien emploi ne sont pas recopiés comme conditions du nouveau.'] };
}

/** Replace every still-planned occurrence, while retaining performed additions verbatim. */
export function proposeRemainingHopReplacement(input: {
  program: HopDecisionProgram; sourceMaterialId: string; candidateId: string;
  materials: HopDecisionMaterial[]; basisByUse: Partial<Record<HopUse, HopReplacementBasis>>;
  chosenDoses?: Record<string, number>;
}) {
  const reference = input.materials.find(m => m.id === input.sourceMaterialId);
  const replacement = input.materials.find(m => m.id === input.candidateId);
  if (!reference || !replacement) throw Error('Matière source ou remplacement introuvable.');
  if (samePhysicalHopMaterial(reference, replacement)) throw Error('Choisir une matière de remplacement physiquement distincte.');
  const planned = input.program.additions.filter(a => a.status === 'planned' && input.materials.some(m => m.id === a.materialId && samePhysicalHopMaterial(reference, m)));
  const missing: string[] = [];
  const parts = planned.map(addition => {
    const basis = input.basisByUse[addition.use];
    if (!basis) { missing.push(`${addition.id} : préciser la fonction/quantité à préserver pour cet emploi.`); return null; }
    const request = { program: input.program, additionId: addition.id, materials: input.materials, candidateIds: [input.candidateId], basis, deferProgramCheck: true };
    let option = findHopSubstitutions(request)[0];
    if (!option) { missing.push(`${addition.id} : matière de remplacement absente.`); return null; }
    if (input.chosenDoses?.[addition.id] !== undefined) option = chooseHopSubstitutionDose(option, input.chosenDoses[addition.id], request);
    if (!option.changes) missing.push(`${addition.id} : ${option.applicability === 'blocked' ? 'remplacement non applicable' : 'dose à choisir ou données à préciser'}.`);
    return option;
  });
  if (!planned.length) missing.push('Aucun ajout restant de cette matière ; les opérations faites ne sont pas remplacées.');
  const changes = parts.flatMap(part => part?.changes ?? []);
  const proposal = !missing.length ? previewHopProgramChanges(input.program, changes, input.materials) : null;
  return { parts, proposal, comparison: proposal ? compareHopPrograms(input.program, proposal.program, input.materials) : null, missing,
    reasons: ['Tous les ajouts restants de la matière sélectionnée sont traités ensemble.',
      'Les emplois ont leur propre convention ; les opérations déjà effectuées restent inchangées.',
      'Le verdict de stock porte sur le programme entier, pas la meilleure ligne isolée.'] };
}
