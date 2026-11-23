import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import { compactHopEvidence } from './hopIndex/companionPrediction';
import type { BrewingScenarioResult } from './brewingScenario';

const MAX_BYTES = 8_000_000;
export interface BrewingScenarioArchive {
  format: 'brewing-scenario-archive-v1'; encoding: 'deflate-json-base64';
  decodedBytes: number; reference: string; payload: string;
}
/** Lossless JSON storage; decoding never invokes the prediction engine. */
export function encodeBrewingScenarioArchive(value: unknown): BrewingScenarioArchive {
  const json = JSON.stringify(value, function (_key, entry) {
    if (typeof entry === 'number' && !Number.isFinite(entry) || ['bigint', 'function', 'symbol'].includes(typeof entry)
      || entry === undefined && Array.isArray(this)) throw Error('L’archive exige des valeurs JSON finies.');
    return entry;
  });
  if (json === undefined) throw Error('Archive de scénario absente.');
  const bytes = strToU8(json);
  if (bytes.length > MAX_BYTES) throw Error('Archive supérieure à8Mo; aucune donnée tronquée.');
  const compressed = deflateSync(bytes);
  let binary = '';
  for (let offset = 0; offset < compressed.length; offset += 8192) binary += String.fromCharCode(...compressed.subarray(offset, offset + 8192));
  const payload = btoa(binary);
  if (payload.length > 1_200_000) throw Error('Archive compressée trop volumineuse; aucune donnée tronquée.');
  return { format: 'brewing-scenario-archive-v1', encoding: 'deflate-json-base64', decodedBytes: bytes.length,
    reference: hopAdviceContentReference('brewing-scenario-archive-content-v1', json), payload };
}
export function decodeBrewingScenarioArchive(value: unknown): any {
  const archive = value as Partial<BrewingScenarioArchive> | null;
  if (!archive || typeof archive !== 'object' || !String(archive.format ?? '').startsWith('brewing-scenario-archive-')) return value;
  if (archive.format !== 'brewing-scenario-archive-v1' || archive.encoding !== 'deflate-json-base64') throw Error('Format d’archive de scénario non pris en charge.');
  if (!Number.isSafeInteger(archive.decodedBytes) || archive.decodedBytes! < 1 || archive.decodedBytes! > MAX_BYTES
    || typeof archive.payload !== 'string' || archive.payload.length > 1_200_000 || typeof archive.reference !== 'string') throw Error('Enveloppe d’archive invalide.');
  const compressed = Uint8Array.from(atob(archive.payload), character => character.charCodeAt(0));
  const decoded = inflateSync(compressed, { out: new Uint8Array(archive.decodedBytes!) });
  const json = strFromU8(decoded);
  if (decoded.length !== archive.decodedBytes || hopAdviceContentReference('brewing-scenario-archive-content-v1', json) !== archive.reference) throw Error('Empreinte d’archive incorrecte.');
  return JSON.parse(json);
}

/** Structured numbers and deduplicated citations for Gemini; full exact data
 * remains in a bounded archive for storage, the UI and independent inspection. */
export function compactBrewingScenarioEvidence(data: { result: BrewingScenarioResult; view?: unknown }, detail: 'summary' | 'chemistry' | 'additions' | 'full' = 'summary') {
  const result = data.result;
  const prediction = (value: BrewingScenarioResult['baseline']['hopPrediction']) => detail === 'full' ? value : {
    engineVersion: value.engineVersion, input: value.input, overall: value.overall, warnings: value.warnings,
    ...(detail === 'chemistry' ? { chemistry: value.chemistry } : {}),
    ...(detail === 'additions' ? { additions: value.additions } : {})
  };
  const branch = (row: BrewingScenarioResult['baseline']) => ({
    id: row.id, label: row.label, reference: row.reference, applicability: row.applicability, input: row.input,
    hopPrediction: prediction(row.hopPrediction),
    ...(row.yeastBaselineModel ? { yeastBaselineModel: prediction(row.yeastBaselineModel) } : {}),
    assumptions: row.assumptions, usedAssumptionIds: row.usedAssumptionIds, proposedAssumptionIds: row.proposedAssumptionIds,
    unappliedAssumptionIds: row.unappliedAssumptionIds, analogies: row.analogies,
    biologicalContributions: row.biologicalContributions, biologicalAssessments: row.biologicalAssessments,
    ...(row.programAnalysis ? { programAnalysis: row.programAnalysis } : {}),
    ...(row.programProposal ? { programProposal: row.programProposal } : {}), culture: row.culture, beerContext: row.beerContext,
    cultureProjections: row.cultureProjections.map(value => ({ ...value, hopPrediction: prediction(value.hopPrediction),
      ...(value.yeastBaselineModel ? { yeastBaselineModel: prediction(value.yeastBaselineModel) } : {}) })),
    dependencyReference: row.dependencySnapshot.reference, limitations: row.limitations
  });
  return { format: 'brewing-scenario-evidence-v1', resultReference: result.reference,
    detail, availableDetails: ['summary', 'chemistry', 'additions', 'full'],
    referenceFormat: 'sourceRef/sourceSetRef/reasonSetRef renvoient aux dictionnaires de resultSummary. L’archive intégrale reste lisible séparément, sans recalcul.',
    resultSummary: compactHopEvidence({ version: result.version, scenarioId: result.scenarioId, revision: result.revision, reference: result.reference,
      requestSnapshot: result.requestSnapshot, status: result.status, inputReference: result.inputReference, dataReference: result.dataReference,
      baseline: branch(result.baseline), branches: result.branches.map(branch), comparisons: result.comparisons, limitations: result.limitations }),
    archive: encodeBrewingScenarioArchive(data) };
}
export function readBrewingScenarioEvidence(value: any, resolveEvidence?: (id: string) => unknown): { result: BrewingScenarioResult; view?: unknown } {
  if (value?.format === 'brewing-scenario-evidence-v1') {
    if (!value.archive && value.archiveReference) {
      const referenced = resolveEvidence?.(value.archiveReference.evidenceId) as any;
      if (!referenced?.archive || referenced.resultReference !== value.resultReference) throw Error('La preuve référencée doit accompagner cette relecture de scénario.');
      return readBrewingScenarioEvidence(referenced);
    }
    const decoded = decodeBrewingScenarioArchive(value.archive);
    if (!decoded?.result || decoded.result.reference !== value.resultReference) throw Error('Archive et résumé du scénario ne correspondent pas.');
    return decoded;
  }
  if (!value?.result) throw Error('Preuve de scénario absente.');
  return value;
}
export function scenarioEvidenceForModel<T>(evidence: T): T {
  const entry = evidence as any;
  const format = entry?.data?.format;
  if (!['brewing-scenario-evidence-v1', 'brewing-nuance-evidence-v1', 'brewing-nuance-plans-v1'].includes(format)) return evidence;
  const { archive: _archive, sourceModelArchive, ...data } = entry.data;
  return { ...entry, data: { ...data, ...(format !== 'brewing-nuance-plans-v1' ? { fullArchiveAvailable: true } : {}),
    ...(sourceModelArchive ? { sourceModelArchiveAvailable: true, sourceModelArchiveReference: sourceModelArchive.reference } : {}) } };
}
