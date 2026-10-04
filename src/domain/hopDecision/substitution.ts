import { introducedHopAmounts, replacementHopDose } from './calculations';
import { compareHopMaterials, hopDecisionReference, numericBounds, readHopAnalysis } from './measurements';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition, HopReplacementBasis, HopSubstitutionOption } from './types';
import { previewHopProgramChanges } from './programs';

export interface HopSubstitutionRequest {
  program: HopDecisionProgram;
  additionId: string;
  materials: HopDecisionMaterial[];
  candidateIds?: string[];
  basis: HopReplacementBasis;
  /** Explicit fraction of the reference addition, not a silently chosen partial substitute. */
  fraction?: number;
  /** Internal composition step: never announces a partial candidate as ready. */
  deferProgramCheck?: boolean;
}

export function availableHopUses(stage: HopDecisionProgram['stage']): HopProgramAddition['use'][] {
  if (stage === 'planning') return ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
  if (stage === 'hotSide') return ['boil', 'whirlpool', 'fermentation', 'postFermentation'];
  if (stage === 'fermenting') return ['fermentation', 'postFermentation'];
  if (stage === 'conditioning') return ['postFermentation'];
  return [];
}

/** No aroma score: each option declares which input quantity it preserves. */
export function findHopSubstitutions(request: HopSubstitutionRequest): HopSubstitutionOption[] {
  const addition = request.program.additions.find(a => a.id === request.additionId);
  const source = request.materials.find(m => m.id === addition?.materialId);
  if (!addition || !source) return [];
  const candidates = request.materials.filter(m => m.id !== source.id && (!request.candidateIds || request.candidateIds.includes(m.id)));
  return candidates.map(candidate => {
    const fraction = request.fraction ?? 1;
    const dose = replacementHopDose({ from: source, to: candidate, grams: addition.grams, basis: request.basis, use: addition.use, fraction });
    const bounds = numericBounds(dose);
    const reasons = [...dose.reasons];
    const missing: string[] = [];
    let applicability: HopSubstitutionOption['applicability'] = dose.status === 'nominal' ? 'ready' : dose.status === 'range' ? 'chooseDose' : 'conditional';
    const blockers: string[] = [];
    const block = (reason: string) => { blockers.push(reason); reasons.push(reason); };
    for (const item of [source, candidate]) {
      if (item.lot && item.variety && item.lot.varietyId !== item.variety.id) block('Identité du lot et de la variété contradictoire.');
      if (item.lot && item.form !== 'unknown' && item.lot.form !== 'unknown' && item.lot.form !== item.form) block('Forme du lot et de la matière contradictoire.');
    }
    if (addition.status === 'performed') block('Cet ajout a déjà été effectué ; préparer une variante pour le prochain brassin.');
    if (!availableHopUses(request.program.stage).includes(addition.use)) block('Cet emploi n’est plus disponible à ce stade ; une nouvelle stratégie doit changer explicitement le programme.');
    if (candidate.product && !candidate.product.supportedUses.includes(addition.use)) block('Emploi absent des usages documentés de ce produit commercial.');
    if (candidate.product && candidate.product.form !== candidate.form) block('Identité produit et forme contradictoires.');
    if (candidate.variety?.archived || candidate.lot?.archived) block('Référence archivée.');
    const maximum = candidate.product?.replacement?.maxDoseGL;
    if (request.basis === 'manufacturer' && maximum !== undefined) {
      if (request.program.volumeL == null || request.program.volumeL <= 0) missing.push('Volume requis pour vérifier la plage de dosage du fabricant.');
      else if (bounds && bounds.min / request.program.volumeL > maximum) block('Dose minimale supérieure à la plage publiée pour ce produit.');
      else if (bounds && bounds.max / request.program.volumeL > maximum) missing.push('Vérifier la dose choisie contre la limite documentée du produit.');
    }
    if (fraction < 1 && addition.grams != null) {
      const remaining = addition.grams * (1 - fraction);
      if (source.availableGrams != null && source.availableGrams < remaining) block('Le remplacement partiel conserve une matière indisponible.');
      else if (source.availableGrams == null) missing.push('Disponibilité du reliquat conservé de la matière initiale.');
    }
    const rest = request.program.additions.filter(a => a.status === 'planned' && a.id !== addition.id && a.materialId === candidate.id);
    const reserved = rest.reduce((total, a) => total + (a.grams ?? 0), 0);
    if (rest.some(a => a.grams === null)) missing.push('Quantité des autres ajouts utilisant cette matière.');
    if (candidate.lot?.referenceOnly) missing.push('Le lot est un échantillon documentaire ; sélectionner un lot réellement disponible.');
    if (candidate.availableGrams == null) missing.push('Stock réellement disponible.');
    else if (!Number.isFinite(candidate.availableGrams) || candidate.availableGrams < 0) block('Stock invalide.');
    else if (bounds && bounds.min + reserved > candidate.availableGrams) block('Stock insuffisant pour la dose minimale et les autres ajouts prévus.');
    else if (!bounds && candidate.availableGrams === 0 && addition.grams !== 0) block('Matière explicitement indisponible.');
    else if (bounds && bounds.max + reserved > candidate.availableGrams) missing.push('La partie haute de la plage dépasse le stock ; choisir et vérifier une dose compatible.');
    if (dose.status === 'unknown' || dose.status === 'conflict') missing.push('Analyse compatible ou convention de dosage explicite.');
    if (source.form === 'unknown' && !source.product || candidate.form === 'unknown' && !candidate.product) missing.push('Forme réelle du produit.');
    if (request.basis === 'alphaLoad' || request.basis === 'totalOil') {
      if (source.lot?.form === 'unknown' || candidate.lot?.form === 'unknown' || source.variety?.form === 'unknown' || candidate.variety?.form === 'unknown') missing.push('La forme d’une référence analytique n’est pas documentée ; confirmer son applicabilité.');
      const analyte = request.basis === 'alphaLoad' ? 'alpha' : 'totalOil';
      const readings = [readHopAnalysis(source, analyte), readHopAnalysis(candidate, analyte)];
      if (readings.some(r => r.scope === 'variety')) missing.push('Les teneurs sont des références variétales ; confirmer les valeurs des produits utilisés.');
      if (dose.status === 'range') missing.push('Dose possible selon les teneurs : un point choisi dans cette plage ne garantit pas une charge identique.');
    }
    if (missing.length) applicability = 'conditional';
    if (blockers.length) applicability = 'blocked';
    const concrete = dose.status === 'nominal' && dose.value !== null;
    const option: HopSubstitutionOption = {
      id: `${addition.id}:${candidate.id}:${request.basis}`, materialId: candidate.id, basis: request.basis,
      doseGrams: dose, use: addition.use, applicability, reasons, missing,
      tradeoffs: [
        request.basis === 'alphaLoad' ? 'Objectif de même charge alpha sous les teneurs retenues ; huile, matière végétale et caractère peuvent changer.'
          : request.basis === 'totalOil' ? 'Objectif de même volume d’huile sous les teneurs retenues ; composition et charge alpha peuvent changer.'
          : 'La convention de masse ne prédit pas une équivalence en bière.',
        'Même emploi ne garantit pas même extraction ; analyse du lot et procédé restent déterminants.',
        ...candidate.product?.cautions ?? []
      ],
      comparison: compareHopMaterials(source, candidate),
      changes: concrete && applicability !== 'blocked' ? [{ kind: 'replace', additionId: addition.id,
        additions: [ ...(fraction < 1 ? [{ ...addition, id: `${addition.id}:retained`, grams: addition.grams! * (1 - fraction) }] : []),
          { ...addition, materialId: candidate.id, grams: dose.value, alphaForModel: undefined }] }] : null,
      introduced: introducedHopAmounts(candidate, dose),
      reference: hopDecisionReference({ program: request.program, source, candidate, basis: request.basis, fraction })
    };
    if (request.deferProgramCheck && option.applicability !== 'blocked') {
      option.applicability = 'conditional';
      option.reasons.push('Partie d’un programme composé ; faisabilité à vérifier sur la composition complète.');
    } else if (option.changes) {
      try {
        const preview = previewHopProgramChanges(request.program, option.changes, request.materials);
        option.programPreview = preview;
        option.reasons.push(...preview.conditions);
        if (preview.applicability === 'unavailable') { option.applicability = 'blocked'; option.changes = null; }
        else if (preview.applicability === 'conditional') option.applicability = 'conditional';
      } catch (error) {
        option.applicability = 'blocked'; option.changes = null;
        option.reasons.push(error instanceof Error ? error.message : 'Programme non applicable.');
      }
    }
    return option;
  });
}

/** A range is not silently collapsed to its midpoint. The brewer's choice stays explicit. */
export function chooseHopSubstitutionDose(option: HopSubstitutionOption, grams: number, request: HopSubstitutionRequest): HopSubstitutionOption {
  if (option.applicability === 'blocked' || !Number.isFinite(grams) || grams < 0) throw Error('Option indisponible ou dose invalide.');
  const fresh = findHopSubstitutions(request).find(candidate => candidate.id === option.id);
  if (!fresh || fresh.reference !== option.reference || fresh.applicability === 'blocked') throw Error('Le programme, le stock ou une analyse a changé ; recalculer les options.');
  const addition = request.program.additions.find(a => a.id === request.additionId)!;
  const material = request.materials.find(m => m.id === fresh.materialId)!;
  const bounds = numericBounds(fresh.doseGrams);
  if (!bounds || grams < bounds.min || grams > bounds.max) throw Error('La dose doit appartenir à la plage proposée ; changer de convention pour explorer une autre dose.');
  if (request.basis === 'manufacturer' && material.product?.replacement?.maxDoseGL !== undefined) {
    if (request.program.volumeL == null || grams / request.program.volumeL > material.product.replacement.maxDoseGL) throw Error('Volume absent ou dose supérieure à la plage publiée du produit.');
  }
  const remaining = request.program.additions.filter(a => a.id !== addition.id && a.status === 'planned' && a.materialId === material.id).reduce((sum, a) => sum + (a.grams ?? 0), 0);
  if (material.availableGrams != null && remaining + grams > material.availableGrams) throw Error('La dose choisie dépasse le stock disponible.');
  if (addition.status !== 'planned' || addition.use !== option.use || !option.id.startsWith(`${addition.id}:`) || material.id !== option.materialId) throw Error('L’ajout ne correspond plus à cette option.');
  const selected: HopSubstitutionOption = { ...fresh, applicability: fresh.missing.length ? 'conditional' : 'ready',
    reasons: [...fresh.reasons, `Dose de travail choisie explicitement : ${grams} g ; la plage documentaire reste conservée.`, 'Le bilan avec cette dose décrit les charges possibles ; aucun point d’équivalence garanti dans une plage.'],
    changes: [{ kind: 'replace', additionId: addition.id, additions: [ ...((request.fraction ?? 1) < 1 ? [{ ...addition, id: `${addition.id}:retained`, grams: addition.grams! * (1 - request.fraction!) }] : []), { ...addition, materialId: option.materialId, grams, alphaForModel: undefined }] }],
    introduced: introducedHopAmounts(material, grams) };
  if (!request.deferProgramCheck) {
    const preview = previewHopProgramChanges(request.program, selected.changes!, request.materials);
    selected.programPreview = preview;
    if (preview.applicability === 'unavailable') selected.applicability = 'blocked';
    else if (preview.applicability === 'conditional') selected.applicability = 'conditional';
    selected.reasons.push(...preview.conditions);
  }
  return selected;
}
