import hopRecipeGuideBootstrap from '../../data/hopRecipeGuideBootstrap.json';
import { hopSourceError, type HopDescription, type HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial } from './types';
import type { HopGuideFamily } from '../hopIndex/recipeGuide';

const guideFamilies = hopRecipeGuideBootstrap as HopGuideFamily[];
const guideFamiliesById = new Map(guideFamilies.map(family => [family.id, family]));

/** Curated family choices with their editorial mapping provenance, returned by copy. */
export function listHopIntentEvidenceFamilies(): HopGuideFamily[] {
  return structuredClone(guideFamilies.filter(family => !hopSourceError(family.source)));
}

export type HopIntentEvidenceRole = 'seek' | 'preserve' | 'avoid' | 'pairWith' | 'observation' | 'constraint';
export type HopIntentEvidenceOrigin = 'user' | 'proposal';

/** A relation to preserve or examine; no free-text relationship is inferred. */
export type HopIntentEvidencePartner =
  | { kind: 'material'; id: string; additionId?: string }
  | { kind: 'observation'; id: string; descriptions?: readonly HopDescription[] }
  | { kind: 'freeContext'; text: string; context?: string; source?: HopSource };

/**
 * Structured subset of the current intent criterion with an optional, explicit
 * link to the already curated local aroma-family vocabulary. `description` is
 * always retained as the caller's wording; it is never parsed to invent a family.
 */
export interface HopIntentEvidenceCriterion {
  id: string;
  description: string;
  role: HopIntentEvidenceRole;
  origin: HopIntentEvidenceOrigin;
  familyId?: string;
  partner?: HopIntentEvidencePartner;
}

export type HopIntentEvidencePolarity = 'positiveMention' | 'explicitNegation' | 'ambiguousMention';
export interface HopIntentDescriptorEvidence {
  side: 'candidate' | 'partner';
  familyId: string;
  familyName: string;
  term: string;
  quote: string;
  context: HopDescription['context'];
  polarity: HopIntentEvidencePolarity;
  source: HopSource;
  mappingSource: HopSource;
}

export type HopIntentEvidenceStatus =
  | 'documentedSupport'
  | 'documentedTension'
  | 'documentedAgainst'
  | 'documentedOverlap'
  | 'candidateOnly'
  | 'partnerOnly'
  | 'observationToPreserve'
  | 'notDocumented'
  | 'unknown'
  | 'ambiguous'
  | 'notApplicable';

export interface HopIntentEvidenceEvaluation {
  criterion: HopIntentEvidenceCriterion;
  candidateId: string;
  partnerReference: HopIntentEvidencePartner | null;
  status: HopIntentEvidenceStatus;
  /** Source-backed descriptions remain visible even when no curated family matches them. */
  candidateDescriptions: HopDescription[];
  partnerDescriptions: HopDescription[];
  candidateEvidence: HopIntentDescriptorEvidence[];
  partnerEvidence: HopIntentDescriptorEvidence[];
  familyIds: string[];
  sharedFamilyIds: string[];
  missingInformation: string[];
  consequence: string;
}

export interface EvaluateHopIntentEvidenceInput {
  criterion: HopIntentEvidenceCriterion;
  candidate: HopDecisionMaterial;
  materials?: readonly HopDecisionMaterial[];
}

const normalize = (value: string): string => value.normalize('NFKD').replace(/\p{M}/gu, '')
  .toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

type MatchPolarity = HopIntentEvidencePolarity;

function polarityAtTerm(normalizedText: string, termStart: number, termLength: number): MatchPolarity {
  const before = normalizedText.slice(0, termStart).trim();
  const lastWords = before.split(/\s+/u).filter(Boolean).slice(-4).join(' ');
  const after = normalizedText.slice(termStart + termLength).trimStart();
  const firstWords = after.split(/\s+/u).filter(Boolean).slice(0, 4).join(' ');
  if (/\b(?:not only|not merely|not just|pas seulement|pas uniquement|non seulement|pas que)\s*$/u.test(lastWords)) {
    return 'ambiguousMention';
  }
  if (/(?:^|\s)(?:no|not|non|sans|without|aucun|aucune|pas de|pas d|n est pas|ne sont pas|ne semble pas)\s*$/u.test(lastWords)) {
    return 'explicitNegation';
  }
  if (/^(?:(?:is|are|was|were)\s+)?(?:absent|absente|absents|absentes|not\s+(?:present|detected|listed|reported|found)|non present|non detecte|non detectee|non mentionne|non mentionnee|n est pas present|n est pas detecte|ne sont pas presents)\b/u.test(firstWords)) {
    return 'explicitNegation';
  }
  if (/^(?:maybe|possibly|perhaps|might be|may be|could be|peut etre|pourrait|semble|suggere)\b/u.test(firstWords)) {
    return 'ambiguousMention';
  }
  // A nearby but unsupported negation construction is kept uncertain instead
  // of being treated as a positive descriptor or a proof of absence.
  if (/(?:^|\s)(?:no|not|non|sans|without|pas|ne|n)\b/u.test(lastWords)
    || /\b(?:not|non|sans|without|pas|ne|n)\b/u.test(firstWords)) return 'ambiguousMention';
  return 'positiveMention';
}

function validDescriptions(descriptions: readonly HopDescription[] | undefined): {
  descriptions: HopDescription[];
  invalidTextCount: number;
  invalidContextCount: number;
  invalidSourceCount: number;
} {
  const rows = Array.isArray(descriptions) ? descriptions : [];
  const valid: HopDescription[] = [];
  let invalidTextCount = 0;
  let invalidContextCount = 0;
  let invalidSourceCount = 0;
  for (const description of rows) {
    if (!description || typeof description.text !== 'string' || !description.text.trim()) { invalidTextCount++; continue; }
    if (!['rawHop', 'infusion', 'beer', 'unspecified'].includes(description.context)) { invalidContextCount++; continue; }
    if (hopSourceError(description.source)) { invalidSourceCount++; continue; }
    valid.push(description);
  }
  return { descriptions: valid, invalidTextCount, invalidContextCount, invalidSourceCount };
}

function invalidDescriptionMessages(scope: string, validation: ReturnType<typeof validDescriptions>): string[] {
  return [
    ...(validation.invalidTextCount ? [`${scope}: ${validation.invalidTextCount} description(s) ignorée(s), texte absent ou vide.`] : []),
    ...(validation.invalidContextCount ? [`${scope}: ${validation.invalidContextCount} description(s) ignorée(s), contexte absent ou hors des quatre contextes reconnus (rawHop/infusion/beer/unspecified).`] : []),
    ...(validation.invalidSourceCount ? [`${scope}: ${validation.invalidSourceCount} description(s) ignorée(s), provenance invalide.`] : []),
  ];
}

function matchFamily(
  descriptions: readonly HopDescription[],
  family: HopGuideFamily,
  side: HopIntentDescriptorEvidence['side'],
): HopIntentDescriptorEvidence[] {
  const rows: HopIntentDescriptorEvidence[] = [];
  for (const description of descriptions) {
    const normalizedText = ` ${normalize(description.text)} `;
    for (const term of family.terms) {
      const normalizedTerm = normalize(term);
      if (!normalizedTerm) continue;
      const phrase = ` ${normalizedTerm} `;
      let cursor = 0;
      while (cursor < normalizedText.length) {
        const start = normalizedText.indexOf(phrase, cursor);
        if (start < 0) break;
        rows.push({
          side,
          familyId: family.id,
          familyName: family.name,
          term,
          quote: description.text,
          context: description.context,
          polarity: polarityAtTerm(normalizedText, start, phrase.length),
          source: structuredClone(description.source),
          mappingSource: structuredClone(family.source),
        });
        cursor = start + phrase.length - 1;
      }
    }
  }
  return rows;
}

function positiveFamilyIds(evidence: readonly HopIntentDescriptorEvidence[]): string[] {
  return [...new Set(evidence.filter(row => row.polarity === 'positiveMention').map(row => row.familyId))];
}

function familiesWithDocumentaryDivergence(evidence: readonly HopIntentDescriptorEvidence[]): string[] {
  const polarities = new Map<string, Set<HopIntentEvidencePolarity>>();
  for (const row of evidence) {
    const familyPolarities = polarities.get(row.familyId) ?? new Set<HopIntentEvidencePolarity>();
    familyPolarities.add(row.polarity);
    polarities.set(row.familyId, familyPolarities);
  }
  return [...polarities.entries()].filter(([, values]) => values.has('positiveMention') && values.has('explicitNegation')).map(([familyId]) => familyId);
}

function divergenceConsequence(side: string, familyIds: readonly string[], evidence: readonly HopIntentDescriptorEvidence[]): string {
  const rows = evidence.filter(row => familyIds.includes(row.familyId));
  const contexts = unique(rows.map(row => row.context));
  const sources = unique(rows.map(row => row.source.title));
  return `Les descriptions divergent pour ${familyIds.join(', ')} sur le ${side} (${contexts.join(', ')}; ${sources.join(', ')}). Garder ces sources/contextes séparés; cela ne prouve pas une contradiction physique de la matière ou de la bière.`;
}

function derivePartnerMaterial(input: EvaluateHopIntentEvidenceInput): {
  descriptions: HopDescription[];
  reference: HopIntentEvidenceEvaluation['partnerReference'];
  missing: string[];
} {
  const partner = input.criterion.partner;
  if (!partner) return { descriptions: [], reference: null, missing: [] };
  if (partner.kind === 'freeContext') {
    const text = partner.text.trim();
    return {
      descriptions: [],
      reference: structuredClone(partner),
      missing: text ? ['Le contexte partenaire est conservé tel quel; aucune famille ne lui est attribuée par lecture libre. Fournir un partenaire ou une famille explicitement interprétée si cela change la décision.']
        : ['Décrire le contexte partenaire ou fournir une observation explicite.'],
    };
  }
  if (partner.kind === 'observation') {
    const validated = validDescriptions(partner.descriptions);
    return {
      descriptions: validated.descriptions,
      reference: structuredClone(partner),
      missing: [
        ...(!validated.descriptions.length ? ['Observation partenaire sans description sourcée exploitable; conserver son identifiant et demander le fait précis seulement s’il départage les options.'] : []),
        ...invalidDescriptionMessages('Observation partenaire', validated),
      ],
    };
  }
  const resolved = input.materials?.find(material => material.id === partner.id);
  const validated = validDescriptions(resolved?.variety?.archived || resolved?.lot?.archived ? [] : resolved?.variety?.descriptions);
  return {
    descriptions: validated.descriptions,
    reference: structuredClone(partner),
    missing: [
      ...(!resolved ? [`Partenaire matière ${partner.id} introuvable; aucune identité de remplacement supposée.`] : []),
      ...(resolved?.variety?.archived || resolved?.lot?.archived ? ['Partenaire archivé; ses descriptions ne sont pas employées.'] : []),
      ...(resolved && !validated.descriptions.length ? ['Aucune description sourcée disponible pour le partenaire; un accord ne peut pas être documenté.'] : []),
      ...invalidDescriptionMessages('Partenaire matière', validated),
    ],
  };
}

function buildEvidence(
  descriptions: readonly HopDescription[],
  familyIds: readonly string[],
  side: HopIntentDescriptorEvidence['side'],
): HopIntentDescriptorEvidence[] {
  const evidence: HopIntentDescriptorEvidence[] = [];
  for (const familyId of familyIds) {
    const family = guideFamiliesById.get(familyId);
    if (family && !hopSourceError(family.source)) evidence.push(...matchFamily(descriptions, family, side));
  }
  return evidence;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function statusForSingleFamily(role: HopIntentEvidenceRole, evidence: readonly HopIntentDescriptorEvidence[], hasDescriptions: boolean): HopIntentEvidenceStatus {
  const polarities = new Set(evidence.map(row => row.polarity));
  if (polarities.has('ambiguousMention') || polarities.has('positiveMention') && polarities.has('explicitNegation')) return 'ambiguous';
  if (polarities.has('positiveMention')) return role === 'avoid' ? 'documentedTension' : 'documentedSupport';
  if (polarities.has('explicitNegation')) return 'documentedAgainst';
  return hasDescriptions ? 'notDocumented' : 'unknown';
}

function singleFamilyConsequence(role: HopIntentEvidenceRole, status: HopIntentEvidenceStatus, familyName: string): string {
  if (role === 'avoid' && status === 'documentedTension') return `${familyName} est cité dans les descriptions du candidat; cela signale une tension possible avec l'évitement, pas sa présence certaine dans la bière.`;
  if (role === 'avoid' && status === 'documentedAgainst') return `Une description nie explicitement la mention de ${familyName}; ce texte ne prouve pas l'absence sensorielle dans la bière.`;
  if (role === 'seek' && status === 'documentedSupport') return `Une description du candidat cite ${familyName}; elle peut informer une voie conditionnelle, sans cible d'intensité ni résultat garanti.`;
  if (role === 'seek' && status === 'documentedAgainst') return `Une description nie explicitement la mention de ${familyName}; cela n'établit pas une impossibilité sensorielle.`;
  if (role === 'preserve' && status === 'documentedSupport') return `Une description du candidat cite ${familyName}; garder ce lien documentaire ne fixe pas une intensité à maintenir.`;
  if (status === 'ambiguous') return `Les preuves documentaires de ${familyName} sont ambiguës ou divergentes; garder les citations et leurs contextes, sans en déduire une contradiction physique.`;
  if (status === 'notDocumented') return `${familyName} n'est pas documenté dans les descriptions disponibles du candidat; cette absence de mention ne démontre pas l'absence du caractère.`;
  if (status === 'unknown') return `Les descriptions sourcées du candidat ne permettent pas d'évaluer ${familyName}; caractère inconnu.`;
  return `Les données documentaires sont conservées comme preuve conditionnelle, pas comme résultat sensoriel.`;
}

function evaluatePairing(
  candidateEvidence: HopIntentDescriptorEvidence[],
  partnerEvidence: HopIntentDescriptorEvidence[],
  partnerReference: HopIntentEvidenceEvaluation['partnerReference'],
  partnerDescriptions: readonly HopDescription[],
  candidateHasDescriptions: boolean,
  missing: string[],
): { status: HopIntentEvidenceStatus; familyIds: string[]; sharedFamilyIds: string[]; consequence: string } {
  const candidateFamilies = positiveFamilyIds(candidateEvidence);
  const partnerFamilies = positiveFamilyIds(partnerEvidence);
  const familyIds = unique([...candidateEvidence, ...partnerEvidence].map(row => row.familyId));
  const sharedFamilyIds = candidateFamilies.filter(id => partnerFamilies.includes(id));
  if (!partnerReference) {
    missing.push('Identifier le partenaire, ou fournir une observation explicite; aucun compagnon n’est inventé.');
    return { status: 'unknown', familyIds, sharedFamilyIds, consequence: 'La piste candidat reste consultable, mais la relation d’accord ne peut pas être évaluée sans partenaire identifié.' };
  }
  if (partnerReference.kind === 'freeContext') {
    return { status: 'unknown', familyIds, sharedFamilyIds,
      consequence: `Le contexte libre « ${partnerReference.text ?? ''} » est conservé tel quel; il n'est pas converti en une famille de houblon ni en intensité.` };
  }
  if (!partnerDescriptions.length) {
    if (!missing.length) missing.push('Le partenaire est identifié mais ses descriptions sourcées sont absentes; fournir ce fait seulement s’il départage les options.');
    return { status: 'unknown', familyIds, sharedFamilyIds,
      consequence: 'Le partenaire est identifié mais n’apporte pas de preuve documentaire exploitable pour qualifier l’accord.' };
  }
  const candidateDivergence = familiesWithDocumentaryDivergence(candidateEvidence);
  if (candidateDivergence.length) {
    missing.push('Descriptions de la même famille divergentes sur le candidat; choisir le contexte/provenance pertinent si cela change la voie.');
    return { status: 'ambiguous', familyIds, sharedFamilyIds: [],
      consequence: divergenceConsequence('candidat', candidateDivergence, candidateEvidence) };
  }
  const partnerDivergence = familiesWithDocumentaryDivergence(partnerEvidence);
  if (partnerDivergence.length) {
    missing.push('Descriptions de la même famille divergentes sur le partenaire; choisir le contexte/provenance pertinent si cela change la voie.');
    return { status: 'ambiguous', familyIds, sharedFamilyIds: [],
      consequence: divergenceConsequence('partenaire', partnerDivergence, partnerEvidence) };
  }
  if (partnerEvidence.some(row => row.polarity === 'ambiguousMention') || candidateEvidence.some(row => row.polarity === 'ambiguousMention')) {
    return { status: 'ambiguous', familyIds, sharedFamilyIds,
      consequence: 'Une mention liée au partenaire ou au candidat est ambiguë; conserver les citations et demander une précision uniquement si elle départage les voies.' };
  }
  if (sharedFamilyIds.length) {
    return { status: 'documentedOverlap', familyIds, sharedFamilyIds,
      consequence: `Les deux côtés ont une mention documentée commune (${sharedFamilyIds.join(', ')}); c'est un indice lexical contextualisé, pas une mesure d'accord, de synergie ou d'intensité.` };
  }
  if ((candidateEvidence.some(row => row.polarity === 'explicitNegation') || partnerEvidence.some(row => row.polarity === 'explicitNegation'))
    && !sharedFamilyIds.length) {
    return { status: 'documentedAgainst', familyIds, sharedFamilyIds,
      consequence: 'Une description nie explicitement une mention correspondante; cela ne démontre pas un contraste sensoriel ni une incompatibilité.' };
  }
  if (candidateFamilies.length && partnerFamilies.length) {
    return { status: 'notDocumented', familyIds, sharedFamilyIds,
      consequence: 'Les documents citent des familles différentes; cela ne démontre ni incompatibilité ni caractère complémentaire.' };
  }
  if (candidateFamilies.length) {
    return { status: 'candidateOnly', familyIds, sharedFamilyIds,
      consequence: 'Le candidat a une mention documentaire pertinente, mais le partenaire ne documente pas de famille commune; la relation demandée reste inconnue.' };
  }
  if (partnerFamilies.length) {
    return { status: 'partnerOnly', familyIds, sharedFamilyIds,
      consequence: 'Le partenaire a une mention documentaire pertinente, mais le candidat ne documente pas de famille commune; le manque de mention n’est pas une incompatibilité.' };
  }
  if (candidateHasDescriptions && partnerDescriptions.length) {
    return { status: 'notDocumented', familyIds, sharedFamilyIds,
      consequence: 'Les deux côtés ont des descriptions sourcées, mais aucune famille du lexique ne les relie; aucun parsing libre n’est tenté.' };
  }
  if (!missing.length) missing.push('Une description sourcée et un rattachement au lexique du partenaire départageraient cette relation.');
  return { status: 'unknown', familyIds, sharedFamilyIds,
    consequence: 'Les preuves disponibles ne permettent pas de qualifier la relation; ne pas maximiser une famille par défaut.' };
}

/**
 * Evaluates only documentary evidence for one criterion and one candidate.
 * It returns no numeric aroma score, predicted intensity, or dose.
 */
export function evaluateHopIntentEvidence(input: EvaluateHopIntentEvidenceInput): HopIntentEvidenceEvaluation {
  const { criterion, candidate } = input;
  const missing: string[] = [];
  const candidateIsArchived = !!candidate.variety?.archived || !!candidate.lot?.archived;
  const candidateRows = validDescriptions(candidateIsArchived ? [] : candidate.variety?.descriptions);
  if (candidateIsArchived) missing.push('Candidat archivé; ses descriptions ne sont pas employées.');
  missing.push(...invalidDescriptionMessages('Candidat', candidateRows));
  const partner = derivePartnerMaterial(input);
  missing.push(...partner.missing);
  const partnerDescriptions = structuredClone(partner.descriptions);
  const candidateDescriptions = structuredClone(candidateRows.descriptions);

  const requestedFamilyId = criterion.familyId;
  const requestedFamily = requestedFamilyId ? guideFamiliesById.get(requestedFamilyId) : undefined;
  if (requestedFamilyId && (!requestedFamily || hopSourceError(requestedFamily.source))) {
    missing.push(`Famille « ${requestedFamilyId} » absente ou non sourcée dans le lexique local; aucun rapprochement libre n'est inventé.`);
    return {
      criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
      status: 'unknown', candidateDescriptions, partnerDescriptions, candidateEvidence: [], partnerEvidence: [], familyIds: [], sharedFamilyIds: [],
      missingInformation: unique(missing), consequence: 'Le critère et son texte sont conservés, mais aucun mapping documentaire qualifié ne permet de l’évaluer.',
    };
  }

  const isPairing = criterion.role === 'pairWith';
  const partnerFamilyIds = partner.descriptions.length
    ? requestedFamilyId ? [requestedFamilyId] : guideFamilies.filter(family => !hopSourceError(family.source)
      && matchFamily(partner.descriptions, family, 'partner').length > 0).map(family => family.id)
    : [];
  const familyIdsToUse = requestedFamilyId ? [requestedFamilyId] : isPairing ? partnerFamilyIds : [];
  const candidateEvidence = buildEvidence(candidateRows.descriptions, familyIdsToUse, 'candidate');
  const partnerEvidence = buildEvidence(partner.descriptions, familyIdsToUse, 'partner');

  if (criterion.role === 'constraint') {
    return { criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
      status: 'notApplicable', candidateDescriptions, partnerDescriptions, candidateEvidence, partnerEvidence, familyIds: familyIdsToUse, sharedFamilyIds: [],
      missingInformation: unique(missing), consequence: 'Cette contrainte relève des gardes d’identité, d’emploi, de stade ou de stock; elle ne se valide pas avec des descripteurs aromatiques.' };
  }

  if ((criterion.role === 'observation' || criterion.role === 'preserve') && criterion.partner?.kind === 'observation') {
    const observationIsUsable = partnerDescriptions.length > 0;
    if (!observationIsUsable && !missing.length) missing.push('Observation à préserver sans description sourcée exploitable.');
    return { criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
      status: observationIsUsable ? 'observationToPreserve' : 'unknown', candidateDescriptions, partnerDescriptions,
      candidateEvidence, partnerEvidence, familyIds: familyIdsToUse, sharedFamilyIds: [], missingInformation: unique(missing),
      consequence: observationIsUsable ? 'Conserver cette observation utilisateur et son contexte; elle n’est ni une cible de gain ni une prévision du candidat.'
        : 'Observation non reliée; demander sa provenance/contexte si cela change la sélection.' };
  }

  if (criterion.role === 'pairWith') {
    if (!requestedFamilyId && !partnerFamilyIds.length && partner.reference?.kind !== 'freeContext') {
      missing.push('Le partenaire n’a pas de famille explicitement interprétée ni de terme rattaché au lexique; garder son contexte libre ou faire une interprétation corrigible.');
    }
    if (!requestedFamilyId && !partnerFamilyIds.length) {
      return { criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
        status: 'unknown', candidateDescriptions, partnerDescriptions, candidateEvidence, partnerEvidence,
        familyIds: [], sharedFamilyIds: [], missingInformation: unique(missing),
        consequence: 'Le contexte est conservé, mais aucun terme des descriptions du partenaire n’est rattaché à une famille locale; aucune relation n’est inventée.' };
    }
    const pairing = evaluatePairing(candidateEvidence, partnerEvidence, partner.reference, partner.descriptions,
      candidateRows.descriptions.length > 0, missing);
    return { criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
      status: pairing.status, candidateDescriptions, partnerDescriptions, candidateEvidence, partnerEvidence, familyIds: pairing.familyIds,
      sharedFamilyIds: pairing.sharedFamilyIds, missingInformation: unique(missing), consequence: pairing.consequence };
  }

  if (criterion.role === 'observation') {
    const hasObservation = criterion.partner?.kind === 'observation' && partner.descriptions.length > 0;
    if (!hasObservation) missing.push('Relier cette observation à une référence et à une description sourcée; ne pas reconstruire une observation depuis le profil variétal.');
    return { criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
      status: hasObservation ? 'observationToPreserve' : 'unknown', candidateDescriptions, partnerDescriptions, candidateEvidence, partnerEvidence,
      familyIds: familyIdsToUse, sharedFamilyIds: [], missingInformation: unique(missing),
      consequence: hasObservation ? 'Conserver l’observation utilisateur comme fait de ce partenaire/échantillon; elle n’est ni une cible de gain ni une prévision du candidat.'
        : 'Observation non reliée; demander sa provenance/contexte si cela change la sélection.' };
  }

  if (!requestedFamily) {
    missing.push('Rattacher explicitement le critère à une famille du lexique si c’est bien l’intention; le texte libre est conservé sans classification automatique.');
    return { criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
      status: 'unknown', candidateDescriptions, partnerDescriptions, candidateEvidence, partnerEvidence, familyIds: [], sharedFamilyIds: [],
      missingInformation: unique(missing), consequence: 'Aucune famille cible explicite; le moteur n’invente ni propriété aromatique ni cible chiffrée.' };
  }

  const status = statusForSingleFamily(criterion.role, candidateEvidence, candidateRows.descriptions.length > 0);
  const divergentFamilyIds = familiesWithDocumentaryDivergence(candidateEvidence);
  if (divergentFamilyIds.length) missing.push('Descriptions de la même famille divergentes sur le candidat; contextualiser les sources avant de les utiliser pour le conseil.');
  return { criterion: structuredClone(criterion), candidateId: candidate.id, partnerReference: partner.reference,
    status, candidateDescriptions, partnerDescriptions, candidateEvidence, partnerEvidence, familyIds: [requestedFamily.id], sharedFamilyIds: [],
    missingInformation: unique(missing), consequence: divergentFamilyIds.length
      ? divergenceConsequence('candidat', divergentFamilyIds, candidateEvidence)
      : singleFamilyConsequence(criterion.role, status, requestedFamily.name) };
}
