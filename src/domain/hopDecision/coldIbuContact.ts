import { hopSourceError, type HopSource } from '../../../functions/src/hopIndexSchema';
import { hopAdviceContentReference as contentReference } from './adviceContentReference';
import { qualifyHopCatalogueVariants } from './catalogueQualification';
import type { HopQualifiedAssemblyInput } from './qualifiedDecision';
import { programFingerprint } from './programs';
import type { HopDecisionMaterial, HopDecisionProgram } from './types';
import { interpolateColdHopBuReference, interpolateColdHopBuFromMass, coldHopBuCalibrationReference,
  type ColdHopBuCalibration, type ColdHopBuReferenceResult } from './coldIbuReference';
import { coldDecimal, coldDecimalToNumber, coldDecimalSnapshot, sumColdDecimalNumbers, divideColdDecimals, subtractColdDecimals } from './coldIbuDecimal';

export const HOP_COLD_CONTACT_BINDING_FORMAT = 'hop-cold-contact-binding-v1' as const;
export const HOP_COLD_CONTACT_ASSESSMENT_FORMAT = 'hop-cold-contact-assessment-v1' as const;
export const HOP_COLD_CONTACT_COMPARISON_FORMAT = 'hop-cold-contact-comparison-v1' as const;

export interface HopColdContactBinding {
  format: typeof HOP_COLD_CONTACT_BINDING_FORMAT;
  reference: string;
  contactId: string;
  programId: string;
  programRevision: number;
  programReference: string;
  additionIds: string[];
  grouping: { kind: 'singleHomogeneousContact'; origin: 'userDeclaration' | 'scenarioAssumption'; reason: string };
}

export interface HopColdBeerContext {
  volumeBasis?: 'beerAtContact' | 'unspecified';
  abvPct?: number | null;
  filteredBeforeContact?: boolean | null;
  yeastStatus?: 'removedBeforeContact' | 'present' | 'unknown';
  contactMode?: 'static' | 'agitated' | 'unknown';
  materialPreparation?: string | null;
  beerDescription?: string | null;
  initialBitterness?: {
    value: number | null; unit: 'BU'; origin: 'measured' | 'reported' | 'modelEstimate';
    method: string | null; source: HopSource | null;
    timing: 'beforeSelectedContact' | 'afterSelectedContact' | 'unknown';
    includesContactIds: string[];
  } | null;
}

export interface HopColdDomainComparison {
  property: string;
  status: 'numericallyComparable' | 'different' | 'unknown' | 'providedButUnassessed';
  actual: unknown;
  reference: unknown;
  reason: string;
}

export interface AssessQualifiedColdHopContactInput {
  program: HopDecisionProgram;
  contact: HopColdContactBinding;
  qualificationInput: HopQualifiedAssemblyInput;
  context?: HopColdBeerContext;
  calibration?: ColdHopBuCalibration;
}

export interface HopColdContactAssessment {
  format: typeof HOP_COLD_CONTACT_ASSESSMENT_FORMAT;
  reference: string;
  inputSnapshot: {
    program: HopDecisionProgram; contact: HopColdContactBinding;
    qualificationInput: HopQualifiedAssemblyInput; context: HopColdBeerContext | null;
  };
  qualificationSnapshot: ReturnType<typeof qualifyHopCatalogueVariants>;
  referenceResult: ColdHopBuReferenceResult;
  programBinding: {
    contact: HopColdContactBinding;
    selectedAdditions: HopDecisionProgram['additions'];
    materials: HopDecisionMaterial[];
    unresolvedMaterialIds: string[];
    status: 'bound' | 'incompleteQuantities' | 'unsupportedCompositeContact';
    totalMassGrams: number | null;
    knownMassSubtotalGrams: number;
    massArithmetic: { method: 'exactDecimalSum-v1'; knownSubtotal: { numerator: string; denominator: string }; complete: boolean };
    missingMassAdditionIds: string[];
    volumeL: number | null;
    doseGL: number | null;
    quantityOrigins: { mass: 'selectedProgramAdditions'; volume: 'program.volumeL' };
    compositeReasons: string[];
    coordinateAssumptions: string[];
  };
  domainComparisons: HopColdDomainComparison[];
  targetAssessment: {
    status: 'insufficientData' | 'conditionsDiffer' | 'transferNotEstablished';
    quantity: 'spectrophotometricBU'; unit: 'BU'; valueBU: null;
    initialBitterness: HopColdBeerContext['initialBitterness'];
    reasons: string[];
  };
  limitations: string[];
}

export class HopColdContactError extends Error {
  constructor(readonly code: 'invalidInput' | 'staleBinding' | 'staleAssessment' | 'unsupportedFormat', message: string) {
    super(message); this.name = 'HopColdContactError';
  }
}
const clone = <T>(value: T): T => structuredClone(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
function requireInput(condition: unknown, message: string): asserts condition {
  if (!condition) throw new HopColdContactError('invalidInput', message);
}
const same = (left: unknown, right: unknown) => contentReference('cold-contact-equality-v1', left) === contentReference('cold-contact-equality-v1', right);
const sortedUnique = (values: string[]) => [...new Set(values)].sort();

export function coldHopContactBindingReference(binding: Omit<HopColdContactBinding, 'reference'> | HopColdContactBinding): string {
  const { reference: _reference, ...content } = binding as HopColdContactBinding;
  return contentReference(HOP_COLD_CONTACT_BINDING_FORMAT, content);
}

/** A contact is explicitly declared; names, dates or missing values never create one implicitly. */
export function bindColdHopProgramContact(input: {
  program: HopDecisionProgram; contactId: string; additionIds: string[]; grouping: HopColdContactBinding['grouping'];
}): HopColdContactBinding {
  const programReference = programFingerprint(input.program);
  requireInput(nonempty(input.contactId) && Array.isArray(input.additionIds) && input.additionIds.every(nonempty)
    && new Set(input.additionIds).size === input.additionIds.length, 'Identité ou sélection de contact froid invalide.');
  requireInput(input.grouping?.kind === 'singleHomogeneousContact'
    && ['userDeclaration', 'scenarioAssumption'].includes(input.grouping.origin) && nonempty(input.grouping.reason),
  'Le regroupement d’un contact doit être explicitement décrit et motivé.');
  requireInput(input.additionIds.every(id => input.program.additions.some(row => row.id === id)), 'Une ligne du contact manque dans le programme.');
  const content = { format: HOP_COLD_CONTACT_BINDING_FORMAT, contactId: input.contactId,
    programId: input.program.id, programRevision: input.program.revision, programReference,
    additionIds: [...input.additionIds].sort(), grouping: clone(input.grouping) };
  return { ...content, reference: coldHopContactBindingReference(content) };
}

function assertBinding(input: AssessQualifiedColdHopContactInput): void {
  if (input.contact?.format !== HOP_COLD_CONTACT_BINDING_FORMAT) throw new HopColdContactError('unsupportedFormat', 'Format de liaison froide non pris en charge.');
  if (input.contact.programReference !== programFingerprint(input.program)) throw new HopColdContactError('staleBinding', 'Le programme lié a changé; créer une nouvelle liaison explicite.');
  const actual = bindColdHopProgramContact({ program: input.program, contactId: input.contact.contactId,
    additionIds: input.contact.additionIds, grouping: input.contact.grouping });
  if (!same(actual, input.contact)) throw new HopColdContactError('staleBinding', 'Programme, révision, sélection ou déclaration de contact changés; créer une liaison courante explicite.');
}

function validateContext(context?: HopColdBeerContext): void {
  if (context === undefined) return;
  requireInput(!!context && typeof context === 'object' && !Array.isArray(context), 'Contexte froid invalide.');
  requireInput(context.volumeBasis === undefined || ['beerAtContact', 'unspecified'].includes(context.volumeBasis), 'Rôle du volume inconnu.');
  requireInput(context.abvPct === undefined || context.abvPct === null || Number.isFinite(context.abvPct) && context.abvPct >= 0 && context.abvPct <= 100, 'Valeur d’alcool invalide.');
  requireInput(context.filteredBeforeContact === undefined || context.filteredBeforeContact === null || typeof context.filteredBeforeContact === 'boolean', 'État de filtration invalide.');
  requireInput(context.yeastStatus === undefined || ['removedBeforeContact', 'present', 'unknown'].includes(context.yeastStatus), 'État de levure inconnu.');
  requireInput(context.contactMode === undefined || ['static', 'agitated', 'unknown'].includes(context.contactMode), 'Mode de contact inconnu.');
  for (const text of [context.materialPreparation, context.beerDescription]) requireInput(text === undefined || text === null || nonempty(text), 'Description de contexte invalide.');
  const base = context.initialBitterness;
  if (base === undefined || base === null) return;
  requireInput(base.unit === 'BU' && (base.value === null || Number.isFinite(base.value) && base.value >= 0)
    && ['measured', 'reported', 'modelEstimate'].includes(base.origin) && (base.method === null || nonempty(base.method))
    && (base.source === null || !hopSourceError(base.source)) && ['beforeSelectedContact', 'afterSelectedContact', 'unknown'].includes(base.timing)
    && Array.isArray(base.includesContactIds) && base.includesContactIds.every(nonempty)
    && new Set(base.includesContactIds).size === base.includesContactIds.length, 'La base de bière doit conserver quantité BU, origine, méthode et périmètre temporel explicites.');
}

function qualifiedMaterials(input: AssessQualifiedColdHopContactInput, ids: string[]) {
  if (input.qualificationInput.assembly && input.qualificationInput.assembly.version !== 'hop-catalogue-assembly-v1') {
    throw new HopColdContactError('unsupportedFormat', 'Version d’assemblage inconnue pour cette nouvelle analyse.');
  }
  const snapshot = qualifyHopCatalogueVariants(input.qualificationInput), materials: HopDecisionMaterial[] = [], unresolved: string[] = [];
  for (const id of ids) {
    const groups = snapshot.groups.filter(group => group.rawVariants.some(row => row.material.id === id));
    const group = groups.length === 1 ? groups[0] : null;
    const projection = group && (group.status === 'ready' || group.status === 'equivalentVariants' ? group.calculationProjection
      : group.status === 'collisionNeedsSelection' ? group.commonCalculationProjection : null);
    if (projection?.material.id === id) materials.push(clone(projection.material)); else unresolved.push(id);
  }
  return { snapshot, materials, unresolved };
}

/** The only numeric output is in the named reference. The target beer receives no numeric fallback. */
export function assessQualifiedColdHopContact(input: AssessQualifiedColdHopContactInput): HopColdContactAssessment {
  assertBinding(input); validateContext(input.context);
  const selected = input.contact.additionIds.map(id => clone(input.program.additions.find(row => row.id === id)!));
  const materialIds = sortedUnique(selected.map(row => row.materialId));
  const { snapshot, materials, unresolved } = qualifiedMaterials(input, materialIds);
  const compositeReasons: string[] = [];
  if (selected.some(row => !['fermentation', 'postFermentation'].includes(row.use))) compositeReasons.push('Une ligne sélectionnée ne décrit pas un contact de fermentation ou post-fermentation.');
  if (materialIds.length > 1) compositeReasons.push('Plusieurs identités de matière ne constituent pas le traitement homogène de cette référence; comparer des contacts distincts.');
  for (const field of ['use', 'status', 'dayOffset', 'contactHours', 'temperatureC'] as const) {
    const known = selected.map(row => row[field] ?? null).filter(value => value !== null);
    if (new Set(known).size > 1) compositeReasons.push(`Les lignes diffèrent sur ${field}; aucune fusion en un contact unique n’est établie.`);
  }
  const missingMassAdditionIds = selected.filter(row => row.grams === null).map(row => row.id);
  const knownMasses = selected.filter(row => row.grams !== null).map(row => row.grams!);
  const exactMass = sumColdDecimalNumbers(knownMasses);
  const knownMassSubtotalGrams = coldDecimalToNumber(exactMass);
  requireInput(Number.isFinite(knownMassSubtotalGrams), 'La masse cumulée n’est pas finie.');
  const totalMassGrams = missingMassAdditionIds.length ? null : knownMassSubtotalGrams;
  const volumeL = input.program.volumeL;
  requireInput(volumeL === null || Number.isFinite(volumeL) && volumeL > 0, 'Le volume fourni doit être positif; aucune valeur de repli.');
  const doseGL = compositeReasons.length || totalMassGrams === null || volumeL === null ? null : coldDecimalToNumber(divideColdDecimals(exactMass, coldDecimal(volumeL)));
  const referenceResult = doseGL === null
    ? interpolateColdHopBuReference({ calibration: input.calibration, dose: { value: null, unit: 'g/L' } })
    : interpolateColdHopBuFromMass({ calibration: input.calibration, massesGrams: knownMasses, volumeL: volumeL! });
  const calibration = referenceResult.calibrationSnapshot, context = input.context ?? {};
  const checks: HopColdDomainComparison[] = [];
  const check = (property: string, actual: unknown, expected: unknown, known: boolean, equal: boolean, reason: string) =>
    checks.push({ property, actual, reference: expected, status: !known ? 'unknown' : equal ? 'numericallyComparable' : 'different', reason });
  const allPresent = (field: 'contactHours' | 'temperatureC') => selected.length > 0 && selected.every(row => row[field] !== null && row[field] !== undefined);
  check('employment', selected.map(row => row.use), 'postFermentation', selected.length > 0,
    selected.every(row => row.use === 'postFermentation'), 'L’emploi déclaré situe le scénario; il ne prouve pas une opération déjà effectuée.');
  check('durationHours', selected.map(row => row.contactHours ?? null), calibration.conditions.contact.durationHours,
    allPresent('contactHours'), selected.every(row => row.contactHours === calibration.conditions.contact.durationHours), 'Cette courbe ne comporte pas de cinétique selon la durée.');
  const temperatures = calibration.conditions.contact.meanObservedTemperatureC;
  check('reportedMeanTemperatures', selected.map(row => row.temperatureC ?? null), temperatures, allPresent('temperatureC'),
    selected.every(row => row.temperatureC! >= temperatures.min && row.temperatureC! <= temperatures.max),
    'Comparaison aux moyennes publiées seulement : être dans cet intervalle ne valide ni une température cible ni une cinétique.');
  const expectedForm = calibration.conditions.hop.form === 'whole-cone' ? 'cone' : calibration.conditions.hop.form;
  check('materialForm', materials.map(row => ({ materialId: row.id, form: row.form })), expectedForm,
    materialIds.length > 0 && unresolved.length === 0 && materials.every(row => row.form !== 'unknown'), materials.every(row => row.form === expectedForm),
    'La masse est une coordonnée comparative; aucune conversion physique entre formes ou humidités n’est implicite.');
  check('volumeBasis', context.volumeBasis ?? null, 'beerAtContact', !!context.volumeBasis && context.volumeBasis !== 'unspecified', context.volumeBasis === 'beerAtContact',
    'Le dénominateur est la valeur fournie par le programme, pas un volume mesuré inventé.');
  check('abvPct', context.abvPct ?? null, calibration.conditions.beer.abvPct, context.abvPct != null,
    context.abvPct === calibration.conditions.beer.abvPct, 'Une même teneur en alcool ne démontre pas la même matrice.');
  check('filteredBeforeContact', context.filteredBeforeContact ?? null, calibration.conditions.beer.filtered, context.filteredBeforeContact != null,
    context.filteredBeforeContact === calibration.conditions.beer.filtered, 'La filtration rapportée ne prouve pas à elle seule une absence de cellules viables.');
  check('yeastHandling', context.yeastStatus ?? null, calibration.conditions.beer.yeastStatus, !!context.yeastStatus && context.yeastStatus !== 'unknown',
    context.yeastStatus === calibration.conditions.beer.yeastStatus, 'Il s’agit du traitement rapporté, pas d’une mesure de viabilité.');
  check('contactMode', context.contactMode ?? null, calibration.conditions.contact.mode, !!context.contactMode && context.contactMode !== 'unknown',
    context.contactMode === calibration.conditions.contact.mode, 'Aucune équivalence statique/agité ni facteur de transfert n’est présumé.');
  for (const [property, actual, expected] of [['materialPreparation', context.materialPreparation, calibration.conditions.hop.preparation],
    ['beerDescription', context.beerDescription, calibration.conditions.beer.description]] as const) {
    checks.push({ property, actual: actual ?? null, reference: expected, status: actual ? 'providedButUnassessed' : 'unknown',
      reason: 'Description conservée, sans interprétation de texte ni correspondance déduite d’un nom.' });
  }
  const quantityMissing = totalMassGrams === null || volumeL === null;
  const status = compositeReasons.length || referenceResult.status === 'outOfDomain' || checks.some(row => row.status === 'different') ? 'conditionsDiffer'
    : quantityMissing || unresolved.length || checks.some(row => row.status === 'unknown') ? 'insufficientData' : 'transferNotEstablished';
  const reasons = [
    ...compositeReasons,
    ...checks.filter(row => row.status === 'different').map(row => `${row.property} diffère de la référence publiée.`),
    ...checks.filter(row => row.status === 'unknown').map(row => `${row.property} n’est pas renseigné ou résolu.`),
    ...(quantityMissing ? ['La dose du contact ne peut pas être calculée avec les masses et le volume fournis.'] : []),
    ...(unresolved.length ? [`Identités matière sans projection qualifiée univoque : ${unresolved.join(', ')}.`] : []),
    ...(referenceResult.status === 'outOfDomain' ? ['La dose dépasse le domaine numérique de cette courbe.'] : []),
    'La calibration décrit son expérience, pas cette bière : une ressemblance de coordonnées ne prouve pas le transfert. Aucun IBU cible n’est calculé.',
  ];
  const base = context.initialBitterness ?? null;
  if (base) reasons.push(base.timing === 'afterSelectedContact' || base.includesContactIds.includes(input.contact.contactId)
    ? 'La base fournie peut déjà inclure ce contact; aucun effet ne lui est ajouté une seconde fois.'
    : 'La base fournie est conservée avec son origine; le contraste au contrôle publié ne lui est pas ajouté.');
  const result = {
    format: HOP_COLD_CONTACT_ASSESSMENT_FORMAT,
    inputSnapshot: { program: clone(input.program), contact: clone(input.contact), qualificationInput: clone(input.qualificationInput), context: clone(input.context ?? null) },
    qualificationSnapshot: snapshot, referenceResult,
    programBinding: { contact: clone(input.contact), selectedAdditions: selected, materials, unresolvedMaterialIds: unresolved,
      status: compositeReasons.length ? 'unsupportedCompositeContact' as const : quantityMissing ? 'incompleteQuantities' as const : 'bound' as const,
      totalMassGrams, knownMassSubtotalGrams, missingMassAdditionIds, volumeL, doseGL,
      massArithmetic: { method: 'exactDecimalSum-v1' as const, knownSubtotal: coldDecimalSnapshot(exactMass), complete: missingMassAdditionIds.length === 0 },
      quantityOrigins: { mass: 'selectedProgramAdditions' as const, volume: 'program.volumeL' as const }, compositeReasons,
      coordinateAssumptions: ['La masse cumulée et le volume fournis servent à une coordonnée dans la référence, sans convertir la forme de la matière ni calibrer la bière cible.',
        'Seules les lignes explicitement rattachées à ce contact sont cumulées; le passé et les autres contacts restent séparés.'] },
    domainComparisons: checks,
    targetAssessment: { status, quantity: 'spectrophotometricBU' as const, unit: 'BU' as const, valueBU: null, initialBitterness: clone(base), reasons },
    limitations: ['Analyse autonome en mémoire; aucune persistance ou écriture de recette/brassin/stock.',
      'Les statuts planned/performed restent ceux de l’entrée; la courbe ne simule aucune exécution.',
      'Les BU de référence, l’équivalent iso-alpha historique et la perception restent des quantités distinctes.'],
  } satisfies Omit<HopColdContactAssessment, 'reference'>;
  return { ...result, reference: contentReference(HOP_COLD_CONTACT_ASSESSMENT_FORMAT, result) };
}

/** Explicit freshness check, never called by an archive reader. */
export function assertColdHopContactAssessmentCurrent(assessment: HopColdContactAssessment, input: AssessQualifiedColdHopContactInput): void {
  if (assessment?.format !== HOP_COLD_CONTACT_ASSESSMENT_FORMAT) throw new HopColdContactError('unsupportedFormat', 'Format d’analyse froide inconnu.');
  const { reference, ...content } = assessment;
  if (reference !== contentReference(HOP_COLD_CONTACT_ASSESSMENT_FORMAT, content)
    || reference !== assessQualifiedColdHopContact(input).reference) throw new HopColdContactError('staleAssessment', 'Programme, contact, données ou calibration changés; conserver l’ancien résultat et calculer une nouvelle analyse explicite.');
}

export function compareQualifiedColdHopContacts(input: { before: AssessQualifiedColdHopContactInput; after: AssessQualifiedColdHopContactInput }) {
  const before = assessQualifiedColdHopContact(input.before), after = assessQualifiedColdHopContact(input.after);
  requireInput(coldHopBuCalibrationReference(before.referenceResult.calibrationSnapshot) === coldHopBuCalibrationReference(after.referenceResult.calibrationSnapshot),
    'Le contraste exige la même calibration; deux références différentes ne sont pas soustraites comme un effet du procédé.');
  const from = before.referenceResult.valueBU, to = after.referenceResult.valueBU;
  const result = { format: HOP_COLD_CONTACT_COMPARISON_FORMAT, before, after,
    referenceDifferenceBU: from === null || to === null ? null : coldDecimalToNumber(subtractColdDecimals(coldDecimal(to), coldDecimal(from))),
    targetDifferenceBU: null, unit: 'BU' as const,
    meaning: 'Différence entre deux coordonnées de la même référence, pas un delta mesuré avant/après de la bière cible.',
    limitations: ['Aucun contrôle publié compté deux fois, aucun cumul de contacts ni ajout à Tinseth ou à une mesure de bière.'] };
  return { ...result, reference: contentReference(HOP_COLD_CONTACT_COMPARISON_FORMAT, result) };
}
