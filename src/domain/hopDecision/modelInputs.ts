import { hopMeasurementError, hopSourceError, validHopRange, type HopMeasurement } from '../../../functions/src/hopIndexSchema';
import type { HopAlphaModelParameter, HopDecisionMaterial, HopNumericResult, HopProgramAddition } from './types';
import { hopDecisionReference, nominalResult, numericBounds, readHopAnalysis, unknownResult } from './measurements';

export const HOP_MODEL_ALPHA_UNIT = '% alpha pour le modèle';
export interface HopModelAlphaReading extends HopNumericResult {
  inputVersion: 'hop-model-alpha-v1';
  selectedParameter: HopAlphaModelParameter | null;
  observations: HopMeasurement[];
  relationToAnalysis: 'notSelected' | 'notComparable' | 'sameReportedValue' | 'withinReportedBounds' | 'differentValue';
}

const finitePercent = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;

export function hopAlphaModelParameterError(p: HopAlphaModelParameter): string | null {
  if (!p || p.analyte !== 'alpha' || p.unit !== 'percentAlpha' || !['point', 'range'].includes(p.kind)
    || !['recipe', 'selectedObservation', 'workingHypothesis'].includes(p.origin)
    || !['asIs', 'dryMatter', 'unknown'].includes(p.analyticalBasis)
    || typeof p.selectionReason !== 'string' || !p.selectionReason.trim()
    || hopSourceError(p.source)) return 'Paramètre alpha incomplet, unité ou provenance invalide.';
  if ((p.origin === 'selectedObservation' || p.observationRef !== undefined) && (typeof p.observationRef !== 'string' || !p.observationRef.trim())) return 'Identifier l’observation sélectionnée ou référencée pour le modèle.';
  if (p.kind === 'point' && (!finitePercent(p.value) || p.range !== undefined)) return 'Valeur de modèle hors de 0–100 % ou confondue avec une plage.';
  if (p.kind === 'range' && (!validHopRange(p.range) || p.range.min < 0 || p.range.max > 100 || p.value !== undefined)) return 'Plage alpha de modèle invalide.';
  if (p.origin === 'recipe' && p.kind === 'point' && p.value === 0) return 'Le zéro du champ de recette historique signifie non fourni ; aucun alpha nul déduit.';
  return null;
}

export const hopAlphaObservationReference = (observation: HopMeasurement) => hopDecisionReference(observation);

const qualifiedAlphaObservation = (m: HopMeasurement) => !hopMeasurementError(m) && m.analyte === 'alpha'
  && m.unit === 'percentMass' && ['asIs', 'dryMatter', 'unknown'].includes(m.basis);

function parameterFromObservation(m: HopMeasurement, selectionReason: string): HopAlphaModelParameter | null {
  if (!qualifiedAlphaObservation(m) || m.kind === 'unknown') return null;
  const common = { analyte: 'alpha' as const, unit: 'percentAlpha' as const, origin: 'selectedObservation' as const,
    analyticalBasis: m.basis as HopAlphaModelParameter['analyticalBasis'], source: m.source,
    observationRef: hopAlphaObservationReference(m), selectionReason };
  const range = m.range ?? (m.kind === 'below' && m.limit !== undefined ? { min: 0, max: m.limit } : undefined);
  if (range) return { ...common, kind: 'range', range: { ...range } };
  return m.kind === 'point' ? { ...common, kind: 'point', value: m.value } : null;
}

type AlphaAddition = Pick<HopProgramAddition, 'materialId' | 'alphaForModel'>;
function effectiveModelMaterial(material: HopDecisionMaterial, addition?: AlphaAddition): HopDecisionMaterial {
  if (addition && addition.materialId !== material.id) throw Error('L’ajout ne correspond pas à la matière du modèle alpha.');
  return addition?.alphaForModel !== undefined ? { ...material, alphaForModel: addition.alphaForModel } : material;
}

/** One precedence rule for every consumer: explicit addition input first, otherwise the material input. */
export function readHopAlphaForAddition(material: HopDecisionMaterial, addition: AlphaAddition): HopModelAlphaReading {
  return readHopAlphaForModel(effectiveModelMaterial(material, addition));
}

/** Reported domain informing a new choice; a previous working number never becomes an immutable bound. */
export function readHopAlphaChoiceDomainForAddition(material: HopDecisionMaterial, addition: AlphaAddition): HopModelAlphaReading {
  const effective = effectiveModelMaterial(material, addition);
  const parameter = effective.alphaForModel;
  if (parameter !== undefined && hopAlphaModelParameterError(parameter)) throw Error('Paramètre alpha effectif invalide ; corriger sa référence avant le choix.');
  if (parameter?.origin === 'selectedObservation') {
    const selected = readHopAlphaForModel(effective);
    if (!numericBounds(selected)) throw Error('La sélection alpha effective ne correspond pas à une observation utilisable.');
    return selected;
  }
  if (parameter?.observationRef) {
    const observations = readHopAnalysis(material, 'alpha').measurements;
    const observation = observations.find(m => hopAlphaObservationReference(m) === parameter.observationRef && qualifiedAlphaObservation(m));
    if (!observation) throw Error('La référence de l’hypothèse alpha ne correspond plus à une observation qualifiée.');
    const reported = parameterFromObservation(observation, 'Référence documentaire conservée derrière le choix de travail éditable.');
    if (!reported) throw Error('La référence retenue ne fournit pas de domaine numérique pour ce choix.');
    const reading = readHopAlphaForModel({ ...material, alphaForModel: reported });
    if (!numericBounds(reading)) throw Error('La référence alpha effective est incompatible avec la matière.');
    return reading;
  }
  return readHopAlphaForModel({ ...material, alphaForModel: undefined });
}

function parameterValue(p: HopAlphaModelParameter): HopNumericResult {
  if (p.kind === 'point') return nominalResult(p.value!, HOP_MODEL_ALPHA_UNIT, p.selectionReason, [p.source]);
  return { status: 'range', unit: HOP_MODEL_ALPHA_UNIT, value: null, range: { ...p.range! }, uncertainty: 'reportedBounds', sources: [p.source], reasons: [p.selectionReason] };
}

/** A percentage used by a model does not establish the physical basis of an assay. */
export function readHopAlphaForModel(material: HopDecisionMaterial): HopModelAlphaReading {
  const physical = readHopAnalysis(material, 'alpha');
  const observations = structuredClone(physical.measurements);
  const finish = (value: HopNumericResult, selectedParameter: HopAlphaModelParameter | null = null,
    relationToAnalysis: HopModelAlphaReading['relationToAnalysis'] = 'notSelected'): HopModelAlphaReading => ({
    ...value, inputVersion: 'hop-model-alpha-v1', selectedParameter: selectedParameter ? structuredClone(selectedParameter) : null,
    observations, relationToAnalysis,
    reasons: [...value.reasons, 'Pourcentage alpha employé comme entrée conventionnelle ; aucune base « tel quel » ni charge physique n’en est déduite.'],
  });
  if (material.lot && material.variety && material.lot.varietyId !== material.variety.id
    || material.lot && material.form !== 'unknown' && material.lot.form !== 'unknown' && material.form !== material.lot.form) {
    return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'Identité ou forme de matière contradictoire.'));
  }
  if (material.alphaForModel !== undefined) {
    const parameter = material.alphaForModel;
    const error = hopAlphaModelParameterError(parameter);
    if (error) return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, error));
    if (parameter.observationRef && physical.scope === 'variety' && material.variety
      && material.variety.form !== 'unknown' && material.variety.form !== material.form) {
      return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'L’observation choisie porte sur une autre forme ; elle ne qualifie pas l’alpha de cette matière.'));
    }
    const referenced = parameter.observationRef ? observations.find(m => hopAlphaObservationReference(m) === parameter.observationRef && qualifiedAlphaObservation(m)) : undefined;
    if (parameter.observationRef && !referenced) return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'La référence alpha ne correspond pas à une observation qualifiée conservée.'));
    const reported = referenced ? parameterFromObservation(referenced, parameter.selectionReason) : null;
    if (parameter.origin === 'selectedObservation' && (!reported || reported.kind !== parameter.kind
      || reported.analyticalBasis !== parameter.analyticalBasis || hopDecisionReference(reported.source) !== hopDecisionReference(parameter.source)
      || reported.value !== parameter.value || hopDecisionReference(reported.range) !== hopDecisionReference(parameter.range))) {
      return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'La sélection ne correspond pas à l’observation figée ; préciser une hypothèse de travail distincte si elle est voulue.'));
    }
    const result = parameterValue(parameter);
    const base = observations.length === 1 ? observations[0].basis : null;
    let relation: HopModelAlphaReading['relationToAnalysis'] = 'notComparable';
    const actual = numericBounds(physical), selected = numericBounds(result);
    if (base && base !== 'unknown' && base === parameter.analyticalBasis && actual && selected) {
      relation = actual.min === selected.min && actual.max === selected.max ? 'sameReportedValue'
        : selected.min >= actual.min && selected.max <= actual.max ? 'withinReportedBounds' : 'differentValue';
    }
    result.sources.push(...physical.sources);
    if (observations.length) result.reasons.push(relation === 'differentValue'
      ? 'La valeur de travail diffère de l’analyse comparable ; le choix est conservé avec sa raison, l’analyse reste distincte.'
      : relation === 'notComparable' ? 'Bases, domaines ou références non comparables ; aucune contradiction physique déduite de cette seule différence.'
        : relation === 'withinReportedBounds' ? 'Valeur de travail choisie dans les bornes rapportées ; la plage d’analyse reste conservée.'
        : 'La valeur rapportée est concordante ; cela ne fournit pas un rendement d’utilisation.');
    return finish(result, parameter, relation);
  }
  if (!observations.length) return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'Pourcentage alpha identifié absent.'));
  if (physical.scope === 'variety' && material.variety && material.variety.form !== 'unknown' && material.variety.form !== material.form) {
    return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'La référence analytique est d’une autre forme ; aucun alpha transféré au produit choisi.'));
  }
  if (observations.some(m => hopMeasurementError(m) || m.analyte !== 'alpha' || m.unit !== 'percentMass'
    || !['asIs', 'dryMatter', 'unknown'].includes(m.basis))) {
    return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'Le modèle attend un pourcentage alpha identifié, pas une unité inconnue, une fraction d’huile ou une grandeur relative différente.', observations.map(m => m.source)));
  }
  const signatures = observations.map(m => JSON.stringify([m.kind, m.value, m.range, m.limit, m.basis, m.method]));
  if (new Set(signatures).size > 1) return finish(unknownResult(HOP_MODEL_ALPHA_UNIT,
    'Plusieurs références alpha distinctes ou non comparables ; sélectionner explicitement celle du modèle sans les moyenner.', observations.map(m => m.source)));
  const m = observations[0];
  if (m.kind === 'unknown') return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'Alpha non déterminé.', [m.source]));
  if (m.kind === 'point' && m.range === undefined) return finish(nominalResult(m.value!, HOP_MODEL_ALPHA_UNIT, 'Pourcentage alpha rapporté, retenu comme convention de calcul.', observations.map(m => m.source)));
  const range = m.range ?? (m.kind === 'below' && m.limit !== undefined ? { min: 0, max: m.limit } : null);
  if (!range) return finish(unknownResult(HOP_MODEL_ALPHA_UNIT, 'Non-détection sans limite ; pas de zéro imputé.', [m.source]));
  return finish({ status: 'range', unit: HOP_MODEL_ALPHA_UNIT, value: null, range: { ...range }, uncertainty: 'reportedBounds',
    sources: observations.map(m => m.source), reasons: ['Bornes alpha rapportées, utilisées dans la convention de calcul sans conversion de base.'] });
}
