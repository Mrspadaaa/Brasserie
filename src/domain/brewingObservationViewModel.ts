import type { HopSource } from '../../functions/src/hopIndexSchema';
import { createBrewingSensoryComparison, type BrewingSensoryComparisonDTO, type BrewingSensoryComparisonValue,
  type BrewingSensoryDefinitionReference, type BrewingSensoryValueProvenance } from './brewingSensory';
import { readBrewingObservationProjection, type BrewingObservationProjection } from './brewingObservationProjection';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

export interface BrewingObservationProjectionView {
  format: 'brewing-observation-projection-view-v1';
  projectionReference: string;
  /** Raw note remains available even when its scale/definition cannot form a numerical cell. */
  observation: BrewingObservationProjection['requestSnapshot']['anchor']['observation'];
  currentApplicability: BrewingObservationProjection['currentApplicability'];
  anchorApplicability: BrewingObservationProjection['anchorApplicability'];
  comparison: BrewingSensoryComparisonDTO;
  series: Array<{ candidateId: string; frameId: string; frameIndex: number }>;
  results: Array<{ candidateId: string; frame: BrewingObservationProjection['frames'][number] }>;
  limitations: string[];
}

/** Same DTO for every representation. This reader does not resolve, simulate or rescale. */
export function brewingObservationProjectionViewModel(value: BrewingObservationProjection): BrewingObservationProjectionView {
  const read = readBrewingObservationProjection(value);
  if (read.status !== 'readOnly') throw Error('Un format de projection futur reste consultable comme archive, sans nouveau graphe numérique.');
  const projection = read.projection, request = projection.requestSnapshot, observation = request.anchor.observation;
  const source: HopSource = { title: `Note d’origine · ${observation.id}`, author: observation.author.label,
    year: new Date(observation.observedAt).getUTCFullYear(), kind: 'observation', reference: request.anchor.observationReference,
    locator: `${observation.id}, version ${observation.version}, ${observation.observedAt}` };
  const series = projection.frames.map((frame, frameIndex) => ({ candidateId: `frame-${hopAdviceContentReference('brewing-observation-series-v1',
    { question: projection.questionReference, id: frame.id, frameIndex }).split(':').pop()}`, frameId: frame.id, frameIndex }));
  const candidates = [{ id: 'source-observation', name: 'Observation d’origine, à son état et sur son échelle' },
    { id: 'working-anchor', name: 'Point de départ dans la métrique de travail' },
    ...projection.frames.map((frame, index) => ({ id: series[index].candidateId, name: frame.name }))];
  const definitions = new Map<string, BrewingSensoryDefinitionReference>();
  if (observation.dimension.status === 'resolved') definitions.set(observation.dimension.definition.contentReference, observation.dimension.definition);
  definitions.set(request.arithmetic.definition.contentReference, request.arithmetic.definition);
  const targetRef = request.arithmetic.definition.contentReference;
  const originalRef = observation.dimension.status === 'resolved' ? observation.dimension.definition.contentReference : null;
  const provenance = (explanation: string, hypothesisRefs: string[] = []): BrewingSensoryValueProvenance => ({
    sourceRefs: [source], hypothesisRefs, explanation, limitations: [...projection.limitations] });
  const unknown = (candidateId: string, reason: string): BrewingSensoryComparisonValue => ({ candidateId, status: 'unknown', reason, provenance: provenance(reason) });
  const numeric = (candidateId: string, number: number | { min: number; max: number }, status: 'observed' | 'hypothetical',
    explanation: string, hypotheses: string[] = []): BrewingSensoryComparisonValue => typeof number === 'number'
    ? { candidateId, status, value: number, provenance: provenance(explanation, hypotheses) }
    : { candidateId, status, range: structuredClone(number), provenance: provenance(explanation, hypotheses) };
  const dimensions = [...definitions.values()].map(definition => {
    const values: BrewingSensoryComparisonValue[] = [];
    values.push(definition.contentReference === originalRef && observation.scale.status === 'known' && observation.sense.kind !== 'qualitative'
      ? numeric('source-observation', observation.sense.value, 'observed',
        `Fait original à ${observation.observedAt}, comparaison ${observation.comparison.kind} ; aucune conversion ni promesse d’applicabilité au présent.`)
      : unknown('source-observation', observation.scale.status === 'unknown' ? 'Échelle inconnue : la valeur d’origine est conservée séparément.' : 'L’observation possède une autre définition ou reste qualitative.'));
    values.push(definition.contentReference === targetRef && projection.numerical.status === 'comparable'
      ? numeric('working-anchor', projection.numerical.observationValue,
        projection.numerical.valueStatus === 'hypotheticalInterpretation' ? 'hypothetical' : 'observed',
        projection.numerical.valueStatus === 'hypotheticalInterpretation' ? 'Interprétation numérique g(x)=x explicitement adoptée ; la note originale reste distincte.' : 'Valeur originale directement compatible, sans conversion.',
        [projection.numerical.contractReference])
      : unknown('working-anchor', projection.numerical.status === 'nonComparable'
        ? projection.numerical.reasons.map(row => row.message).join(' ') : 'Cette définition n’est pas celle du cadre numérique.'));
    projection.frames.forEach((frame, index) => values.push(definition.contentReference === targetRef && frame.status === 'projected' && frame.rawProjection !== null
      ? numeric(series[index].candidateId, frame.rawProjection, 'hypothetical', 'Observation interprétée + différence des deux centrales couplées, sous stabilité déclarée du reste.',
        [frame.planReference, projection.numerical.contractReference])
      : unknown(series[index].candidateId, definition.contentReference !== targetRef ? 'Le résultat appartient à une autre métrique ; aucun changement d’échelle.'
        : frame.issues.map(row => row.message).join(' ') || 'Ce cadre ne fournit pas de projection numérique compatible.')));
    return { definition, values };
  });
  const comparison = createBrewingSensoryComparison({
    context: { id: request.id, version: '1', kind: 'anchoredScenario', contentReference: projection.questionReference,
      label: 'Question et états figés de la projection', sourceRefs: [source] },
    reference: { id: request.anchor.id, version: '1', kind: 'observationAnchor', contentReference: request.anchor.reference, sourceRefs: [source] },
    candidateOrder: candidates.map(row => row.id), candidates, dimensionOrder: [...definitions.keys()], dimensions,
  });
  return { format: 'brewing-observation-projection-view-v1', projectionReference: projection.reference,
    observation: structuredClone(observation), currentApplicability: structuredClone(projection.currentApplicability),
    anchorApplicability: structuredClone(projection.anchorApplicability), comparison, series,
    results: projection.frames.map((frame, index) => ({ candidateId: series[index].candidateId, frame: structuredClone(frame) })),
    limitations: [...projection.limitations] };
}
