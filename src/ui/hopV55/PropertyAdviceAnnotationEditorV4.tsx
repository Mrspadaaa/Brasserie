import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { HopSource, HopSourceKind } from '../../../functions/src/hopIndexSchema';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type { HopPropertyAdviceIntentV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopV55PropertyAdviceLedgerActionV4 } from '../../services/hopV55/propertyAdvicePreparationV4';
import type {
  HopV55PropertyAdviceAnnotationLedgerV1,
  HopV55PropertyAdviceLedgerEntryV1,
  HopV55PropertyAdviceV4ReadingContext,
} from '../../services/hopV55/propertyAdviceRecordsV4';
import { Input, Textarea } from '../Input';
import {
  COMPENSATION_KIND,
  applyCompensationFix,
  blockingCompensationIssues,
  type CompensationFix,
  type CompensationIssue,
} from './propertyAdviceCompensationV3';
import { interventionLabels } from './propertyAdviceDecisionCore';
import { PropertyAdviceIntentEditorCore } from './propertyAdviceIntentEditorCore';
import './property-advice-intent-editor.css';
import './property-advice-v4.css';

/*
 * Éditeur d’annotations du service V4.
 * Il ne modifie jamais le registre : il tient un brouillon de gestes (corriger, écarter, restaurer, ajouter,
 * déclarer un accès) et en dérive les actions du contrat Prep V4. Le parent scelle, prépare et construit.
 * Aucun lien n’est retiré en silence : chaque lien vers un terme écarté attend une correction explicite.
 */
export type V4Intent = HopPropertyAdviceIntentV3;
export type V4ReadingContext = HopV55PropertyAdviceV4ReadingContext;
export type V4AccessScope = keyof V4ReadingContext['context']['access'];
type V4Access = V4ReadingContext['context']['access'][V4AccessScope];
type V4Exclusion = V4ReadingContext['exclusions'][number];
type LedgerEntry = HopV55PropertyAdviceLedgerEntryV1;
type LedgerAction = HopV55PropertyAdviceLedgerActionV4;

export const ACCESS_SCOPES_V4: readonly V4AccessScope[] = ['bulkBeer', 'sampling', 'separatePortion'];
export const accessScopeLabelsV4: Record<V4AccessScope, string> = { bulkBeer: 'Lot de bière', sampling: 'Échantillon', separatePortion: 'Portion séparée' };
export const accessStateLabelsV4 = { yes: 'Oui', no: 'Non', unknown: 'Inconnu' } as const;
export const rejectPresetsV4 = [
  'Mot de liaison ou de construction, pas un terme de ma bière',
  'Contresens : la question dit autre chose',
  'Doublon d’un autre terme',
  'Hors sujet pour cette question',
] as const;
export const restorePresetsV4 = ['Écarté par erreur', 'Ce terme compte finalement pour ma question'] as const;

const roleShort: Record<V4Intent['role'], string> = {
  target: 'Cible', reportedObservation: 'Constat', measurement: 'Mesure', investigation: 'Question', preference: 'Préférence', constraint: 'Garde',
};
const propertyShort: Record<V4Intent['property'], string> = {
  aroma: 'arôme', bitterness: 'amertume', sweetness: 'douceur, sucrosité', acidity: 'acidité',
  bioContribution: 'apport de culture', materialCharacter: 'caractère de la matière', unresolved: 'à qualifier',
};
const directionShort: Record<Exclude<V4Intent['direction'], null>, string> = {
  increase: 'en avoir plus', decrease: 'en avoir moins', keep: 'garder tel quel', exclude: 'éviter', investigate: 'examiner',
};
const decisionLabels: Record<LedgerEntry['decision']['kind'], string> = {
  initialize: 'Lu dans la question', add: 'Ajouté depuis un passage exact', revise: 'Corrigé', reject: 'Écarté', restore: 'Restauré',
};
const certaintyLabels: Record<V4Exclusion['certainty'], string> = { certain: 'certaine', possible: 'possible', unknown: 'incertaine' };
const sourceKindRows: Array<{ value: HopSourceKind; label: string }> = [
  { value: 'coa', label: 'Certificat d’analyse' }, { value: 'manufacturer', label: 'Fabricant' }, { value: 'research', label: 'Recherche' },
  { value: 'review', label: 'Revue' }, { value: 'observation', label: 'Observation' }, { value: 'community', label: 'Communauté' },
  { value: 'judgment', label: 'Jugement' },
];

/* ---------- égalité structurelle et nettoyage JSON (aucune référence scellée n’est recalculée ici) ---------- */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(row).filter((key) => row[key] !== undefined).sort().map((key) => [key, canonical(row[key])]));
  }
  return value;
}
export const sameV4 = (left: unknown, right: unknown): boolean => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
/** Les DTO refusent les propriétés `undefined`; un champ vidé par l’éditeur disparaît au lieu d’être envoyé indéfini. */
export function withoutUndefinedV4<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
const withoutOrigin = ({ interpretationOrigin: _origin, ...rest }: V4Intent) => rest;
/** Une révision n’existe que si la projection change hors origine; l’origine confirmée est toujours `user`. */
export const projectionChangedV4 = (before: V4Intent, after: V4Intent): boolean => !sameV4(withoutOrigin(before), withoutOrigin(after));
const asUser = (intent: V4Intent): V4Intent => withoutUndefinedV4({ ...intent, interpretationOrigin: 'user' });
const sentence = (text: string): string => text.trim().replace(/[.!?…]+$/u, '');

export function formatInstantV4(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return iso;
  try { return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(time)); } catch { return iso; }
}

/* ---------- registre : partition active/écartée par dernière entrée ---------- */
export interface V4LedgerAnnotation {
  annotationId: string;
  source: V4Intent;
  sourceKind: LedgerEntry['sourceKind'];
  entries: LedgerEntry[];
  latest: LedgerEntry;
  disposition: LedgerEntry['disposition'];
  active?: V4Intent;
  /** Dernière projection active connue (courante, ou celle d’avant l’écart). */
  lastActive?: V4Intent;
}

export function ledgerAnnotationsV4(ledger: HopV55PropertyAdviceAnnotationLedgerV1): V4LedgerAnnotation[] {
  const grouped = new Map<string, LedgerEntry[]>();
  for (const entry of ledger.entries) grouped.set(entry.annotationId, [...(grouped.get(entry.annotationId) ?? []), entry]);
  return ledger.sourceAnnotations.flatMap((source): V4LedgerAnnotation[] => {
    const entries = grouped.get(source.id) ?? [];
    const latest = entries[entries.length - 1];
    if (!latest) return [];
    const lastActive = [...entries].reverse().find((entry) => entry.activeIntent)?.activeIntent;
    return [{ annotationId: source.id, source, sourceKind: latest.sourceKind, entries, latest, disposition: latest.disposition,
      ...(latest.disposition === 'active' && latest.activeIntent ? { active: latest.activeIntent } : {}),
      ...(lastActive ? { lastActive } : {}) }];
  });
}

/* ---------- brouillon de gestes ---------- */
export interface V4AnnotationDraft {
  baseRecordReference: string;
  /** Projection éditée d’un terme retenu (révision) ou restauré. */
  edits: Record<string, V4Intent>;
  revisionReasons: Record<string, string>;
  /** Terme retenu à écarter → motif. */
  rejections: Record<string, string>;
  /** Terme écarté à restaurer → motif. */
  restorations: Record<string, string>;
  /** Ajouts explicites depuis un passage exact; jamais enregistrés avant confirmation. */
  additions: V4Intent[];
  readingContext: V4ReadingContext;
  accessAssertionIds: Partial<Record<V4AccessScope, string>>;
  accessNotes: Partial<Record<V4AccessScope, string>>;
  /** Fiches exactes reçues pour l’affichage et les liens; jamais envoyées comme sélection. */
  materials: HopDecisionMaterial[];
}

export function emptyAnnotationDraftV4(baseRecordReference: string, readingContext: V4ReadingContext,
  materials: readonly HopDecisionMaterial[] = []): V4AnnotationDraft {
  return { baseRecordReference, edits: {}, revisionReasons: {}, rejections: {}, restorations: {}, additions: [],
    readingContext: structuredClone(readingContext), accessAssertionIds: {}, accessNotes: {}, materials: [...materials] };
}

export type V4RowState = 'kept' | 'revised' | 'restored' | 'added' | 'rejecting' | 'rejected';
export interface V4AnnotationRow { annotationId: string; state: V4RowState; intent: V4Intent; base?: V4LedgerAnnotation }

export function annotationRowsV4(annotations: readonly V4LedgerAnnotation[], draft?: V4AnnotationDraft): V4AnnotationRow[] {
  const rows: V4AnnotationRow[] = annotations.map((base): V4AnnotationRow => {
    const id = base.annotationId;
    const edit = draft?.edits[id];
    if (base.disposition === 'active' && base.active) {
      if (draft && draft.rejections[id] !== undefined) return { annotationId: id, state: 'rejecting', intent: edit ?? base.active, base };
      return { annotationId: id, state: edit && projectionChangedV4(base.active, edit) ? 'revised' : 'kept', intent: edit ?? base.active, base };
    }
    const known = base.lastActive ?? base.source;
    if (draft && draft.restorations[id] !== undefined) return { annotationId: id, state: 'restored', intent: edit ?? known, base };
    return { annotationId: id, state: 'rejected', intent: known, base };
  });
  for (const addition of draft?.additions ?? []) rows.push({ annotationId: addition.id, state: 'added', intent: addition });
  return rows;
}

export const isActiveRowV4 = (row: V4AnnotationRow): boolean => row.state === 'kept' || row.state === 'revised'
  || row.state === 'restored' || row.state === 'added';
export const projectedActiveV4 = (rows: readonly V4AnnotationRow[]): V4Intent[] => rows.filter(isActiveRowV4).map((row) => row.intent);

/** Actions du contrat Prep V4, une par terme touché, dans l’ordre du registre puis des ajouts. */
export function annotationActionsV4(annotations: readonly V4LedgerAnnotation[], draft: V4AnnotationDraft, fallbackReason: string): LedgerAction[] {
  const actions: LedgerAction[] = [];
  for (const base of annotations) {
    const id = base.annotationId;
    if (base.disposition === 'active' && base.active) {
      const rejection = draft.rejections[id];
      if (rejection !== undefined) { actions.push({ kind: 'reject', annotationId: id, reason: rejection.trim() || fallbackReason }); continue; }
      const edit = draft.edits[id];
      if (edit && projectionChangedV4(base.active, edit)) {
        actions.push({ kind: 'revise', annotationId: id, activeIntent: asUser(edit), reason: draft.revisionReasons[id]?.trim() || fallbackReason });
      }
    } else if (draft.restorations[id] !== undefined) {
      const projection = draft.edits[id] ?? base.lastActive ?? base.source;
      actions.push({ kind: 'restore', annotationId: id, activeIntent: asUser(projection), reason: draft.restorations[id].trim() || fallbackReason });
    }
  }
  for (const addition of draft.additions) {
    actions.push({ kind: 'add', sourceAnnotation: asUser(addition), activeIntent: asUser(addition), reason: addition.basis.trim() || fallbackReason });
  }
  return actions;
}

/* ---------- liens pendants : relations, constats comparés, partenaire, exclusions ---------- */
export type V4LinkVia = 'related' | 'observation' | 'partner';
export type V4PendingLink =
  | { kind: 'intent'; ownerId: string; targetId: string; via: V4LinkVia[] }
  | { kind: 'exclusion'; exclusionId: string; targetId: string };

/**
 * Le registre refuse un lien actif vers un terme écarté (relation, constat comparé, partenaire observation).
 * La request V3 exige en plus que chaque exclusion cite des termes retenus : ce lien est donc aussi signalé
 * dès qu’une réponse doit être construite (au moins un terme retenu).
 */
export function pendingLinksV4(active: readonly V4Intent[], readingContext: V4ReadingContext, annotationIds: ReadonlySet<string>): V4PendingLink[] {
  const activeIds = new Set(active.map((intent) => intent.id));
  const links: V4PendingLink[] = [];
  for (const intent of active) {
    const byTarget = new Map<string, V4LinkVia[]>();
    const note = (targetId: string, via: V4LinkVia) => {
      if (activeIds.has(targetId)) return;
      const rows = byTarget.get(targetId) ?? [];
      if (!rows.includes(via)) rows.push(via);
      byTarget.set(targetId, rows);
    };
    intent.relatedIntentIds.forEach((id) => note(id, 'related'));
    intent.investigation?.observationIntentIds.forEach((id) => note(id, 'observation'));
    if (intent.partner?.kind === 'observation' && annotationIds.has(intent.partner.id)) note(intent.partner.id, 'partner');
    for (const [targetId, via] of byTarget) links.push({ kind: 'intent', ownerId: intent.id, targetId, via });
  }
  if (active.length) {
    for (const exclusion of readingContext.exclusions) {
      for (const targetId of exclusion.intentIds) if (!activeIds.has(targetId)) links.push({ kind: 'exclusion', exclusionId: exclusion.id, targetId });
    }
  }
  return links;
}

export interface V4DraftBlockers { links: V4PendingLink[]; compensation: CompensationIssue[] }

export function draftBlockersV4(rows: readonly V4AnnotationRow[], readingContext: V4ReadingContext): V4DraftBlockers {
  const active = projectedActiveV4(rows);
  const links = pendingLinksV4(active, readingContext, new Set(rows.map((row) => row.annotationId)));
  /* Un constat comparé écarté est déjà nommé comme lien pendant, avec son geste « délier ». */
  const compensation = blockingCompensationIssues(active).filter((issue) => issue.code !== 'missingObservation');
  return { links, compensation };
}

export function setProjectionV4(draft: V4AnnotationDraft, intentId: string, intent: V4Intent): V4AnnotationDraft {
  if (draft.additions.some((row) => row.id === intentId)) {
    return { ...draft, additions: draft.additions.map((row) => row.id === intentId ? structuredClone(intent) : row) };
  }
  return { ...draft, edits: { ...draft.edits, [intentId]: structuredClone(intent) } };
}

/** Délie explicitement un terme : relation, constat comparé et partenaire observation pointant cette cible. */
export function unlinkV4(draft: V4AnnotationDraft, owner: V4Intent, targetId: string): V4AnnotationDraft {
  const { investigation, partner, ...rest } = owner;
  const next: V4Intent = {
    ...rest,
    relatedIntentIds: owner.relatedIntentIds.filter((id) => id !== targetId),
    ...(investigation ? { investigation: { ...investigation, observationIntentIds: investigation.observationIntentIds.filter((id) => id !== targetId) } } : {}),
    ...(partner && !(partner.kind === 'observation' && partner.id === targetId) ? { partner } : {}),
  };
  return setProjectionV4(draft, owner.id, next);
}

const withExclusions = (draft: V4AnnotationDraft, exclusions: V4Exclusion[]): V4AnnotationDraft =>
  ({ ...draft, readingContext: { ...draft.readingContext, exclusions } });

export function relinkExclusionV4(draft: V4AnnotationDraft, exclusionId: string, fromId: string, toId: string): V4AnnotationDraft {
  return withExclusions(draft, draft.readingContext.exclusions.map((row) => row.id !== exclusionId ? row
    : { ...row, intentIds: [...new Set(row.intentIds.map((id) => id === fromId ? toId : id))] }));
}
export function unlinkExclusionV4(draft: V4AnnotationDraft, exclusionId: string, targetId: string): V4AnnotationDraft {
  return withExclusions(draft, draft.readingContext.exclusions.map((row) => row.id !== exclusionId ? row
    : { ...row, intentIds: row.intentIds.filter((id) => id !== targetId) }));
}
export function removeExclusionV4(draft: V4AnnotationDraft, exclusionId: string): V4AnnotationDraft {
  return withExclusions(draft, draft.readingContext.exclusions.filter((row) => row.id !== exclusionId));
}

function omitKey<V>(row: Record<string, V>, key: string): Record<string, V> {
  const next = { ...row };
  delete next[key];
  return next;
}

export function cancelRejectionV4(draft: V4AnnotationDraft, id: string): V4AnnotationDraft {
  return { ...draft, rejections: omitKey(draft.rejections, id) };
}
export function restoreV4(draft: V4AnnotationDraft, base: V4LedgerAnnotation, reason: string, projection: 'lastActive' | 'source' = 'lastActive'): V4AnnotationDraft {
  const intent = projection === 'source' ? base.source : base.lastActive ?? base.source;
  return { ...draft, restorations: { ...draft.restorations, [base.annotationId]: reason }, edits: { ...draft.edits, [base.annotationId]: structuredClone(intent) } };
}

/* ---------- déclaration d’accès : un seul renseignement sert la déclaration, le motif et la source locale ---------- */
export interface V4AccessDeclarationInput {
  state: 'yes' | 'no' | 'unknown';
  statement: string;
  title: string;
  author: string;
  external?: { kind: HopSourceKind; reference: string; year: number | null };
}
export interface V4AccessDeclaration { access: V4Access; assertion?: HopAdviceAssertion; note: string }

export function accessDeclarationV4(scope: V4AccessScope, input: V4AccessDeclarationInput, assertionId: string): V4AccessDeclaration {
  const statement = input.statement.trim();
  const note = `${accessScopeLabelsV4[scope].toLocaleLowerCase('fr-CH')} : ${accessStateLabelsV4[input.state].toLocaleLowerCase('fr-CH')}${statement ? ` — ${sentence(statement)}` : ''}`;
  if (input.state === 'unknown') {
    return { access: { state: 'unknown', basis: statement || 'Accès déclaré inconnu par le brasseur.', assertionIds: [] }, note };
  }
  if (!statement) throw new Error('Une déclaration oui/non doit dire ce qui est constaté.');
  const source: HopSource = input.external
    ? { title: input.title.trim(), author: input.author.trim(), year: input.external.year, kind: input.external.kind, reference: input.external.reference.trim() }
    : { title: input.title.trim(), author: input.author.trim(), year: null, kind: 'observation', reference: `local-declaration:${assertionId}`,
      locator: `Motif déclaré : ${statement}` };
  const assertion: HopAdviceAssertion = { id: assertionId, subject: scope, statement, state: 'reported', value: input.state === 'yes', dimension: 'process', source };
  return { access: { state: input.state, basis: statement, assertionIds: [assertionId] }, assertion, note };
}

export function applyAccessDeclarationV4(draft: V4AnnotationDraft, scope: V4AccessScope, declaration: V4AccessDeclaration): V4AnnotationDraft {
  const previous = draft.accessAssertionIds[scope];
  const kept = draft.readingContext.context.assertions.filter((row) => row.id !== previous);
  const assertions = declaration.assertion ? [...kept, declaration.assertion] : kept;
  const access = { ...draft.readingContext.context.access, [scope]: declaration.access } as V4ReadingContext['context']['access'];
  const accessAssertionIds = { ...draft.accessAssertionIds };
  if (declaration.assertion) accessAssertionIds[scope] = declaration.assertion.id; else delete accessAssertionIds[scope];
  return { ...draft, readingContext: { ...draft.readingContext, context: { ...draft.readingContext.context, assertions, access } },
    accessAssertionIds, accessNotes: { ...draft.accessNotes, [scope]: declaration.note } };
}

export function resetAccessV4(draft: V4AnnotationDraft, scope: V4AccessScope, base: V4ReadingContext): V4AnnotationDraft {
  const previous = draft.accessAssertionIds[scope];
  const assertions = draft.readingContext.context.assertions.filter((row) => row.id !== previous);
  const access = { ...draft.readingContext.context.access, [scope]: structuredClone(base.context.access[scope]) } as V4ReadingContext['context']['access'];
  const accessAssertionIds = { ...draft.accessAssertionIds };
  delete accessAssertionIds[scope];
  const accessNotes = { ...draft.accessNotes };
  delete accessNotes[scope];
  return { ...draft, readingContext: { ...draft.readingContext, context: { ...draft.readingContext.context, assertions, access } }, accessAssertionIds, accessNotes };
}

/* ---------- avant/après d’une projection : ce que le brasseur vérifie avant de confirmer ---------- */
const metricShort: Record<V4Intent['metric'], string> = {
  sensory: 'perception', pH: 'pH', titratableAcidity: 'acidité titrable', analyticalBU: 'BU analytique', unspecified: 'non précisée',
};
const basisShort: Record<V4Intent['comparisonBasis']['kind'], string> = { qualitativeTarget: 'résultat visé', current: 'état actuel', none: 'aucune' };
const subjectShort: Record<V4Intent['subject']['kind'], string> = { beer: 'bière', material: 'matière', culture: 'culture', process: 'procédé', unspecified: 'non précisé' };

export interface V4FieldChange { field: string; before: string; after: string }

export function projectionDiffV4(before: V4Intent, after: V4Intent, labelOf: (id: string) => string): V4FieldChange[] {
  const rows: V4FieldChange[] = [];
  const push = (field: string, left: string, right: string) => { if (left !== right) rows.push({ field, before: left, after: right }); };
  const terms = (ids: readonly string[]) => ids.length ? ids.map((id) => `« ${labelOf(id)} »`).join(', ') : 'aucun';
  const comparison = (intent: V4Intent) => !intent.investigation ? 'aucune'
    : intent.investigation.observationIntentIds.length ? `compensations de ${terms(intent.investigation.observationIntentIds)}` : 'comparaison sans constat';
  const subject = (intent: V4Intent) => `${subjectShort[intent.subject.kind]} · ${intent.subject.label}${intent.subject.materialId ? ` · ${intent.subject.materialId}` : ''}`;
  const partner = (intent: V4Intent) => !intent.partner ? 'rien' : intent.partner.kind === 'material' ? `matière ${intent.partner.id}`
    : intent.partner.kind === 'observation' ? `observation ${intent.partner.id}` : `contexte « ${intent.partner.text} »`;
  const basis = (intent: V4Intent) => `${basisShort[intent.comparisonBasis.kind]}${intent.comparisonBasis.assertionIds.length
    ? ` · ${intent.comparisonBasis.assertionIds.length} fait${intent.comparisonBasis.assertionIds.length === 1 ? '' : 's'}` : ''}`;
  push('Terme retenu', `« ${before.label} »`, `« ${after.label} »`);
  push('Rôle', roleShort[before.role], roleShort[after.role]);
  push('Propriété', propertyShort[before.property], propertyShort[after.property]);
  push('Direction', before.direction ? directionShort[before.direction] : 'aucune', after.direction ? directionShort[after.direction] : 'aucune');
  push('Qualificatif', before.qualification ?? 'aucun', after.qualification ?? 'aucun');
  push('Liens', terms(before.relatedIntentIds), terms(after.relatedIntentIds));
  push('Comparaison', comparison(before), comparison(after));
  push('Appréciation', metricShort[before.metric], metricShort[after.metric]);
  push('Par rapport à', basis(before), basis(after));
  push('Sujet', subject(before), subject(after));
  push('Comparé à', partner(before), partner(after));
  push('Essentiel', before.required ? 'oui' : 'non', after.required ? 'oui' : 'non');
  push('Famille', before.familyId ?? 'aucune', after.familyId ?? 'aucune');
  push('Motif de lecture', before.basis, after.basis);
  if (!rows.length && projectionChangedV4(before, after)) rows.push({ field: 'Précision', before: 'valeur enregistrée', after: 'valeur modifiée' });
  return rows;
}

/* ---------- résumé des gestes : il alimente la liste de confirmation et le motif prérempli ---------- */
export interface V4ChangeItem {
  key: string;
  title: string;
  changes: V4FieldChange[];
  reason?: string;
  /** Ligne du motif prérempli. */
  line: string;
}

const describeChanges = (changes: readonly V4FieldChange[]) => changes.map((change) =>
  `${change.field.toLocaleLowerCase('fr-CH')} : ${change.before} → ${change.after}`).join(' ; ');

export function changeItemsV4(rows: readonly V4AnnotationRow[], draft: V4AnnotationDraft, base: V4ReadingContext): V4ChangeItem[] {
  const labels = new Map(rows.map((row) => [row.annotationId, row.intent.label]));
  const labelOf = (id: string) => labels.get(id) ?? 'terme hors de cette lecture';
  const items: V4ChangeItem[] = [];
  for (const row of rows) {
    const id = row.annotationId, term = `« ${row.intent.label} »`;
    if (row.state === 'rejecting') {
      const reason = draft.rejections[id] ?? '';
      items.push({ key: `reject:${id}`, title: `Écarter ${term}`, reason,
        changes: [{ field: 'Lecture', before: readingSentenceV4(row.intent, labelOf), after: 'écartée, trace conservée' }],
        line: `Écarter ${term} : ${sentence(reason)}.` });
    } else if (row.state === 'revised' && row.base?.active) {
      const reason = draft.revisionReasons[id]?.trim();
      const changes = projectionDiffV4(row.base.active, row.intent, labelOf);
      items.push({ key: `revise:${id}`, title: `Corriger « ${row.base.active.label} »`, changes, ...(reason ? { reason } : {}),
        line: `Corriger « ${row.base.active.label} » (${describeChanges(changes)})${reason ? ` : ${sentence(reason)}` : ''}.` });
    } else if (row.state === 'restored') {
      const reason = draft.restorations[id] ?? '';
      items.push({ key: `restore:${id}`, title: `Restaurer ${term}`, reason,
        changes: [{ field: 'Lecture', before: 'écartée', after: readingSentenceV4(row.intent, labelOf) }],
        line: `Restaurer ${term} : ${sentence(reason)}.` });
    } else if (row.state === 'added') {
      items.push({ key: `add:${id}`, title: `Ajouter ${term}`, reason: row.intent.basis,
        changes: [{ field: 'Lecture', before: 'absente', after: readingSentenceV4(row.intent, labelOf) },
          { field: 'Passage exact', before: '—', after: row.intent.sourceSpans.map((span) => `« ${span.text} » (${span.start}–${span.end})`).join(' · ') || 'aucun' }],
        line: `Ajouter ${term} : ${sentence(row.intent.basis)}.` });
    }
  }
  for (const scope of ACCESS_SCOPES_V4) {
    const before = base.context.access[scope], after = draft.readingContext.context.access[scope];
    if (sameV4(before, after)) continue;
    const note = draft.accessNotes[scope];
    items.push({ key: `access:${scope}`, title: `Accès · ${accessScopeLabelsV4[scope]}`, reason: after.basis,
      changes: [{ field: 'État', before: accessStateLabelsV4[before.state], after: accessStateLabelsV4[after.state] }],
      line: note ? `Accès ${note}.` : `Accès ${accessScopeLabelsV4[scope].toLocaleLowerCase('fr-CH')} : ${accessStateLabelsV4[after.state].toLocaleLowerCase('fr-CH')}.` });
  }
  if (!sameV4(draft.readingContext.candidatePolicy, base.candidatePolicy)) {
    const policy = (row: V4ReadingContext['candidatePolicy']) => `${row.kind === 'explicit' ? 'liste explicite' : 'recherche'} · ${row.materialIds.length} identité${row.materialIds.length === 1 ? '' : 's'}`;
    const changes = [{ field: 'Périmètre', before: policy(base.candidatePolicy), after: policy(draft.readingContext.candidatePolicy) }];
    items.push({ key: 'policy', title: 'Matières prises en compte', changes, line: `Modifier les matières prises en compte (${describeChanges(changes)}).` });
  }
  for (const exclusion of base.exclusions) {
    const next = draft.readingContext.exclusions.find((row) => row.id === exclusion.id);
    if (next && sameV4(next, exclusion)) continue;
    const title = `Exclusion « ${interventionLabels[exclusion.intervention]} »`;
    const changes = next ? [{ field: 'Termes cités', before: exclusion.intentIds.map((id) => `« ${labelOf(id)} »`).join(', '),
      after: next.intentIds.map((id) => `« ${labelOf(id)} »`).join(', ') || 'aucun' }] : [{ field: 'Exclusion', before: 'présente', after: 'retirée' }];
    items.push({ key: `exclusion:${exclusion.id}`, title, changes, line: `${title} (${describeChanges(changes)}).` });
  }
  return items;
}

export function changeLinesV4(rows: readonly V4AnnotationRow[], draft: V4AnnotationDraft, base: V4ReadingContext): string[] {
  return changeItemsV4(rows, draft, base).map((item) => item.line);
}

export function readingSentenceV4(intent: V4Intent, labelOf: (id: string) => string): string {
  const parts = [`${roleShort[intent.role]} · ${propertyShort[intent.property]}`];
  if (intent.direction && intent.direction !== 'investigate') parts.push(directionShort[intent.direction]);
  if (intent.investigation?.kind === COMPENSATION_KIND) {
    const observed = intent.investigation.observationIntentIds.map((id) => `« ${labelOf(id)} »`).join(', ');
    parts.push(`comparer des compensations de ${observed || 'aucun constat'}`);
  }
  return parts.join(' · ');
}

/* ---------- question avec ses passages annotés ---------- */
const fragmentRank: Record<V4RowState, number> = { kept: 5, revised: 5, restored: 5, added: 4, rejecting: 2, rejected: 1 };

export function QuestionFragmentsV4({ question, rows }: { question: string; rows: readonly V4AnnotationRow[] }) {
  const spans = rows.flatMap((row) => row.intent.sourceSpans
    .filter((span) => span.end > span.start && question.slice(span.start, span.end) === span.text)
    .map((span) => ({ start: span.start, end: span.end, row })));
  const cuts = [...new Set([0, question.length, ...spans.flatMap((span) => [span.start, span.end])])].sort((a, b) => a - b);
  const parts: ReactNode[] = [];
  for (let index = 0; index < cuts.length - 1; index += 1) {
    const start = cuts[index], end = cuts[index + 1];
    if (start === end) continue;
    const text = question.slice(start, end);
    const covering = spans.filter((span) => span.start <= start && span.end >= end);
    if (!covering.length) { parts.push(<React.Fragment key={start}>{text}</React.Fragment>); continue; }
    const top = covering.reduce((best, span) => fragmentRank[span.row.state] > fragmentRank[best.row.state] ? span : best);
    const status = top.row.state === 'kept' || top.row.state === 'revised' || top.row.state === 'restored' ? 'active' : top.row.state;
    parts.push(<mark key={start} className={`hv4-frag is-${status}`} title={covering.map((span) => `« ${span.row.intent.label} »`).join(' · ')}>{text}</mark>);
  }
  return <blockquote className="hv4-question" aria-label="Question originale, mot pour mot">{parts}</blockquote>;
}

/* ---------- trace d’un terme ---------- */
function TraceV4({ base }: { base: V4LedgerAnnotation }) {
  return <details className="hv4-trace">
    <summary>Trace de ce terme ({base.entries.length})</summary>
    <ol>{base.entries.map((entry) => <li key={entry.reference}>
      <b>{decisionLabels[entry.decision.kind]}</b>
      <span>{formatInstantV4(entry.decision.recordedAt)} · {entry.decision.recordedBy.label}</span>
      <p>{entry.decision.reason}</p>
      <details><summary>Références exactes</summary>
        <code>Entrée · {entry.entryId}</code><code>Référence · {entry.reference}</code>
        {entry.decision.predecessorEntryReference ? <code>Précédente · {entry.decision.predecessorEntryReference}</code> : null}
        <code>Acte · {entry.decision.actId}</code>
        {entry.additionActId ? <code>Acte d’ajout · {entry.additionActId}</code> : null}
      </details>
    </li>)}</ol>
    <p className="hv4-help">{base.source.sourceSpans.length
      ? `Passage exact : ${base.source.sourceSpans.map((span) => `« ${span.text} » (${span.start}–${span.end})`).join(' · ')}`
      : 'Aucun passage exact transmis pour ce terme.'} · {base.sourceKind === 'added' ? 'ajouté par un acte explicite' : 'lu dans la question'}</p>
    <code>Identité · {base.annotationId}</code>
  </details>;
}

/* ---------- liens et gardes à résoudre avant confirmation ---------- */
export function DraftBlockersV4({ blockers, rows, readingContext, onUpdateDraft, disabled = false }: {
  blockers: V4DraftBlockers;
  rows: readonly V4AnnotationRow[];
  readingContext: V4ReadingContext;
  onUpdateDraft(update: (draft: V4AnnotationDraft) => V4AnnotationDraft): void;
  disabled?: boolean;
}) {
  const byId = new Map(rows.map((row) => [row.annotationId, row]));
  const label = (id: string) => byId.get(id)?.intent.label ?? 'terme absent';
  const activeRows = rows.filter(isActiveRowV4);
  const count = blockers.links.length + blockers.compensation.length;
  if (!count) return null;
  const targetFixes = (targetId: string, owner?: string) => {
    const target = byId.get(targetId);
    if (target?.state === 'rejecting') {
      return <button type="button" className="hv4-act" disabled={disabled} aria-label={`Ne pas écarter « ${label(targetId)} »`}
        onClick={() => onUpdateDraft((draft) => cancelRejectionV4(draft, targetId))}>Ne pas écarter « {label(targetId)} »</button>;
    }
    if (target?.state === 'rejected' && target.base) {
      const base = target.base;
      return <button type="button" className="hv4-act" disabled={disabled} aria-label={`Restaurer aussi « ${label(targetId)} »`}
        onClick={() => onUpdateDraft((draft) => restoreV4(draft, base, owner ? `Restauré pour garder son lien avec « ${owner} »` : 'Restauré pour garder un lien de la lecture'))}>
        Restaurer aussi « {label(targetId)} »</button>;
    }
    return null;
  };
  const applyFix = (ownerId: string, fix: CompensationFix) => onUpdateDraft((draft) => {
    const replacements = applyCompensationFix(projectedActiveV4(annotationRowsFromDraft(rows, draft)), ownerId, fix);
    return replacements.reduce((next, row) => setProjectionV4(next, row.id, row), draft);
  });
  return <div className="hv4-blockers" role="group" aria-label="À résoudre avant de confirmer">
    <b>À résoudre avant de confirmer · {count}</b>
    <ul>
      {blockers.links.map((link) => {
        if (link.kind === 'intent') {
          const owner = byId.get(link.ownerId);
          const via = link.via.map((row) => row === 'related' ? 'lien' : row === 'observation' ? 'constat comparé' : 'partenaire').join(', ');
          const state = byId.get(link.targetId)?.state === 'rejecting' ? 'que tu écartes' : 'déjà écarté';
          return <li key={`intent:${link.ownerId}:${link.targetId}`}>
            <p>« {label(link.ownerId)} » reste relié à « {label(link.targetId)} » ({via}), {state}.</p>
            <div className="hv4-fix-row">
              {owner ? <button type="button" className="hv4-act" disabled={disabled} aria-label={`Délier « ${label(link.targetId)} » de « ${label(link.ownerId)} »`}
                onClick={() => onUpdateDraft((draft) => unlinkV4(draft, owner.intent, link.targetId))}>Délier</button> : null}
              {targetFixes(link.targetId, label(link.ownerId))}
            </div>
          </li>;
        }
        const exclusion = readingContext.exclusions.find((row) => row.id === link.exclusionId);
        const name = exclusion ? interventionLabels[exclusion.intervention] : 'exclusion';
        return <li key={`exclusion:${link.exclusionId}:${link.targetId}`}>
          <p>L’exclusion « {name} »{exclusion ? ` (${certaintyLabels[exclusion.certainty]})` : ''} cite « {label(link.targetId)} », {byId.get(link.targetId)?.state === 'rejecting' ? 'que tu écartes' : 'écarté'}. Une réponse exige qu’elle cite des termes retenus.</p>
          {exclusion ? <small>Motif de l’exclusion : {exclusion.reason}</small> : null}
          <div className="hv4-fix-row">
            {activeRows.length ? <label className="hv4-inline-select"><span>Relier à</span>
              <select aria-label={`Relier l’exclusion « ${name} » à un terme retenu`} value="" disabled={disabled}
                onChange={(event) => { const toId = event.target.value; if (toId) onUpdateDraft((draft) => relinkExclusionV4(draft, link.exclusionId, link.targetId, toId)); }}>
                <option value="">Choisir un terme…</option>
                {activeRows.map((row) => <option key={row.annotationId} value={row.annotationId}>« {row.intent.label} »</option>)}
              </select></label> : null}
            {exclusion && exclusion.intentIds.length > 1 ? <button type="button" className="hv4-act" disabled={disabled}
              onClick={() => onUpdateDraft((draft) => unlinkExclusionV4(draft, link.exclusionId, link.targetId))}>Retirer « {label(link.targetId)} » de l’exclusion</button> : null}
            <button type="button" className="hv4-act is-danger" disabled={disabled} aria-label={`Retirer l’exclusion « ${name} »`}
              onClick={() => onUpdateDraft((draft) => removeExclusionV4(draft, link.exclusionId))}>Retirer l’exclusion</button>
            {targetFixes(link.targetId)}
          </div>
          <small>Retirer l’exclusion rend cette intervention de nouveau envisageable dans la réponse.</small>
        </li>;
      })}
      {blockers.compensation.map((issue, index) => <li key={`compensation:${issue.intentId}:${issue.code}:${index}`}>
        <p>« {label(issue.intentId)} » : {issue.message}</p>
        <div className="hv4-fix-row">{issue.fixes.map((option, fixIndex) => <button type="button" className="hv4-act" key={fixIndex} disabled={disabled}
          onClick={() => applyFix(issue.intentId, option.fix)}>{option.label}</button>)}</div>
      </li>)}
    </ul>
    <p className="hv4-help">Rien n’est retiré à ta place : chaque lien se corrige par ton choix.</p>
  </div>;
}

/* Les corrections de compensation s’appliquent au brouillon courant, pas à une copie périmée des lignes affichées. */
function annotationRowsFromDraft(rows: readonly V4AnnotationRow[], draft: V4AnnotationDraft): V4AnnotationRow[] {
  return rows.map((row) => {
    if (row.state === 'added') return { ...row, intent: draft.additions.find((addition) => addition.id === row.annotationId) ?? row.intent };
    const edit = draft.edits[row.annotationId];
    return edit && isActiveRowV4(row) ? { ...row, intent: edit } : row;
  });
}

/* ---------- accès déclarés ---------- */
interface AccessForm {
  state: '' | 'yes' | 'no' | 'unknown';
  statement: string;
  title: string;
  author: string;
  editIdentity: boolean;
  external: boolean;
  kind: HopSourceKind | '';
  year: string;
  reference: string;
}
const emptyAccessForm = (scope: V4AccessScope): AccessForm => ({ state: '', statement: '', title: `Accès déclaré · ${accessScopeLabelsV4[scope]}`,
  author: 'Brasseur', editIdentity: false, external: false, kind: '', year: '', reference: '' });
const yearValue = (value: string): number | null | undefined => {
  if (!value.trim()) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= 0 && year <= 9999 ? year : undefined;
};
const accessFormReady = (form: AccessForm): boolean => {
  if (!form.state) return false;
  if (form.state === 'unknown') return true;
  if (!form.statement.trim() || !form.title.trim() || !form.author.trim()) return false;
  return !form.external || (!!form.kind && !!form.reference.trim() && yearValue(form.year) !== undefined);
};

function AccessStripV4({ rootId, base, context, draft, editable, disabled, requestNonce, onUpdateDraft }: {
  rootId: string;
  base: V4ReadingContext;
  context: V4ReadingContext;
  draft?: V4AnnotationDraft;
  editable: boolean;
  disabled: boolean;
  requestNonce?: number;
  onUpdateDraft?(update: (draft: V4AnnotationDraft) => V4AnnotationDraft): void;
}) {
  const [openScope, setOpenScope] = useState<V4AccessScope>();
  const [form, setForm] = useState<AccessForm>(emptyAccessForm('bulkBeer'));
  const [error, setError] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const handledNonce = useRef(requestNonce);
  const open = (scope: V4AccessScope) => {
    if (openScope === scope) { setOpenScope(undefined); return; }
    setOpenScope(scope); setForm(emptyAccessForm(scope)); setError('');
  };
  useEffect(() => {
    if (!requestNonce || requestNonce === handledNonce.current || !editable) return;
    handledNonce.current = requestNonce;
    const scope = ACCESS_SCOPES_V4.find((row) => context.context.access[row].state === 'unknown') ?? 'bulkBeer';
    setOpenScope(scope); setForm(emptyAccessForm(scope)); setError('');
    const run = () => formRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run); else run();
  }, [requestNonce]);
  const update = (change: Partial<AccessForm>) => { setForm((current) => ({ ...current, ...change })); setError(''); };
  const apply = () => {
    if (!openScope || !onUpdateDraft || !form.state || !accessFormReady(form)) return;
    try {
      const assertionId = `property-access-assertion:${crypto.randomUUID()}`;
      const year = yearValue(form.year);
      const declaration = accessDeclarationV4(openScope, { state: form.state, statement: form.statement, title: form.title, author: form.author,
        ...(form.external && form.kind ? { external: { kind: form.kind, reference: form.reference, year: year ?? null } } : {}) }, assertionId);
      const scope = openScope;
      onUpdateDraft((current) => applyAccessDeclarationV4(current, scope, declaration));
      setOpenScope(undefined);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'La déclaration n’a pas été ajoutée.'); }
  };
  return <div className="hv4-access-block">
    <div className="hv4-access" role="group" aria-label="Accès déclarés pour cette lecture">
      <span className="hv4-access-label">Accès</span>
      {ACCESS_SCOPES_V4.map((scope) => {
        const state = context.context.access[scope].state;
        const changed = !!draft && !sameV4(context.context.access[scope], base.context.access[scope]);
        const text = `${accessScopeLabelsV4[scope]} · ${accessStateLabelsV4[state]}${changed ? ' · modifié' : ''}`;
        return editable ? <button type="button" key={scope} className={`hv4-access-chip is-${state}${changed ? ' is-changed' : ''}`} aria-expanded={openScope === scope}
          aria-label={`Préciser l’accès · ${text}`} disabled={disabled} onClick={() => open(scope)}>{text}</button>
          : <span key={scope} className={`hv4-access-chip is-${state}`}>{text}</span>;
      })}
    </div>
    {editable && openScope ? <div className="hv4-inline-form" role="group" aria-label={`Déclarer l’accès · ${accessScopeLabelsV4[openScope]}`} ref={formRef}>
      <p className="hv4-help">Choisis explicitement. Rien n’est déduit du stade, du style, d’un texte libre ou d’une recette.</p>
      <div className="hv4-segment" role="radiogroup" aria-label={`État de l’accès · ${accessScopeLabelsV4[openScope]}`}>
        {(['yes', 'no', 'unknown'] as const).map((state) => <label key={state} className={form.state === state ? 'is-on' : ''}>
          <input type="radio" name={`${rootId}-access-${openScope}`} checked={form.state === state} disabled={disabled}
            onChange={() => update({ state })} /><span>{accessStateLabelsV4[state]}</span></label>)}
      </div>
      {form.state ? <label className="hv4-field"><span>{form.state === 'unknown' ? 'Précision · facultative' : 'Ce que tu constates'}</span>
        <Textarea rows={2} value={form.statement} disabled={disabled} aria-label={form.state === 'unknown' ? 'Précision · facultative' : 'Ce que tu constates'}
          placeholder={form.state === 'unknown' ? 'Ex. : je ne sais pas encore si un prélèvement est possible.' : 'Ex. : je peux prélever un échantillon au robinet du fermenteur.'}
          onChange={(event) => update({ statement: event.target.value })} /></label> : null}
      {form.state === 'yes' || form.state === 'no' ? <div className="hv4-source-line">
        {form.external ? <p>Source externe citée pour cette déclaration.</p>
          : <p>Source : ta déclaration locale · « {form.title || 'sans titre'} » · {form.author || 'sans auteur'}. Elle reprend ce que tu constates comme motif; aucune référence externe n’est inventée.</p>}
        <div className="hv4-fix-row">
          <button type="button" className="hv4-link" disabled={disabled} aria-expanded={form.editIdentity} onClick={() => update({ editIdentity: !form.editIdentity })}>
            {form.editIdentity ? 'Masquer titre et auteur' : 'Modifier titre et auteur'}</button>
          <button type="button" className="hv4-link" disabled={disabled} onClick={() => update({ external: !form.external, kind: '', reference: '', year: '' })}>
            {form.external ? 'Revenir à ma déclaration locale' : 'Citer plutôt une source externe'}</button>
        </div>
        {form.editIdentity || form.external ? <div className="hv4-grid">
          <label className="hv4-field"><span>Titre</span><Input value={form.title} disabled={disabled} aria-label="Titre de la source d’accès" onChange={(event) => update({ title: event.target.value })} /></label>
          <label className="hv4-field"><span>Auteur ou acteur</span><Input value={form.author} disabled={disabled} aria-label="Auteur de la source d’accès" onChange={(event) => update({ author: event.target.value })} /></label>
          {form.external ? <>
            <label className="hv4-field"><span>Type de source</span><select value={form.kind} disabled={disabled} aria-label="Type de source d’accès"
              onChange={(event) => update({ kind: event.target.value as HopSourceKind | '' })}>
              <option value="">À préciser</option>{sourceKindRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
            </select></label>
            <label className="hv4-field"><span>Référence exacte</span><Input value={form.reference} disabled={disabled} aria-label="Référence exacte de la source d’accès" onChange={(event) => update({ reference: event.target.value })} /></label>
            <label className="hv4-field"><span>Année · facultative</span><Input value={form.year} disabled={disabled} aria-label="Année de la source d’accès" onChange={(event) => update({ year: event.target.value })} /></label>
          </> : null}
        </div> : null}
      </div> : null}
      {form.state === 'unknown' ? <p className="hv4-help">L’accès reste inconnu; aucune attestation n’est créée.</p> : null}
      {error ? <p className="hv-property-error" role="alert">{error}</p> : null}
      <div className="hv4-actions">
        <button type="button" className="hv4-primary" disabled={disabled || !accessFormReady(form)} onClick={apply}>Appliquer à la lecture</button>
        {draft && !sameV4(context.context.access[openScope], base.context.access[openScope]) ? <button type="button" className="hv4-secondary" disabled={disabled}
          onClick={() => { const scope = openScope; onUpdateDraft?.((current) => resetAccessV4(current, scope, base)); setOpenScope(undefined); }}>Revenir à l’accès enregistré</button> : null}
        <button type="button" className="hv4-secondary" disabled={disabled} onClick={() => setOpenScope(undefined)}>Fermer</button>
      </div>
    </div> : null}
  </div>;
}

/* ---------- composant ---------- */
export interface HopV55PropertyAdviceAnnotationEditorV4Props {
  rootId: string;
  question: string;
  annotations: readonly V4LedgerAnnotation[];
  /** Contexte de lecture de la version affichée (jamais le dernier contexte actif). */
  readingContext: V4ReadingContext;
  draft?: V4AnnotationDraft;
  /** Absent : lecture seule (historique, readOnly ou aucun callback parent). */
  onUpdateDraft?(update: (draft: V4AnnotationDraft) => V4AnnotationDraft): void;
  materials: readonly HopDecisionMaterial[];
  materialChoices?: readonly HopDecisionMaterial[];
  onSearchMaterials?(query: string, exactScopeIds: readonly string[]): Promise<HopDecisionMaterial[]>;
  onSelectMaterials?(ids: string[]): Promise<HopDecisionMaterial[]>;
  disabled?: boolean;
  /** Incrémenté par le parent pour ouvrir la déclaration d’accès (repère de réexamen). */
  accessRequest?: number;
  sectionRef?: React.Ref<HTMLElement>;
  children?: ReactNode;
}

type RowMode = 'edit' | 'reject' | 'restore';
interface ReasonForm { preset: string; precision: string; projection: 'lastActive' | 'source' }
const emptyReasonForm = (): ReasonForm => ({ preset: '', precision: '', projection: 'lastActive' });
const reasonOf = (form: ReasonForm): string => [form.preset, form.precision.trim()].filter(Boolean).join(' — ');

export function HopV55PropertyAdviceAnnotationEditorV4({ rootId, question, annotations, readingContext, draft, onUpdateDraft,
  materials, materialChoices = [], onSearchMaterials, onSelectMaterials, disabled = false, accessRequest, sectionRef, children }: HopV55PropertyAdviceAnnotationEditorV4Props) {
  const editable = !!onUpdateDraft;
  const rows = useMemo(() => annotationRowsV4(annotations, draft), [annotations, draft]);
  const active = useMemo(() => projectedActiveV4(rows), [rows]);
  const context = draft?.readingContext ?? readingContext;
  const labels = useMemo(() => new Map(rows.map((row) => [row.annotationId, row.intent.label])), [rows]);
  const outsideLabels = useMemo(() => new Map(rows.filter((row) => !isActiveRowV4(row)).map((row) => [row.annotationId, row.intent.label])), [rows]);
  const labelOf = (id: string): string => labels.get(id) ?? 'terme hors de cette lecture';
  const pending = useMemo(() => pendingLinksV4(active, context, new Set(labels.keys())), [active, context, labels]);
  const [modes, setModes] = useState<Record<string, RowMode | undefined>>({});
  const [forms, setForms] = useState<Record<string, ReasonForm>>({});
  const shownRows = rows.filter((row) => row.state !== 'rejected');
  const rejectedRows = rows.filter((row) => row.state === 'rejected');
  const update = (fn: (current: V4AnnotationDraft) => V4AnnotationDraft) => { if (onUpdateDraft && !disabled) onUpdateDraft(fn); };
  const toggle = (id: string, mode: RowMode) => {
    setModes((current) => ({ ...current, [id]: current[id] === mode ? undefined : mode }));
    if (mode !== 'edit') setForms((current) => ({ ...current, [id]: emptyReasonForm() }));
  };
  const close = (id: string) => setModes((current) => ({ ...current, [id]: undefined }));
  const formOf = (id: string): ReasonForm => forms[id] ?? emptyReasonForm();
  const setForm = (id: string, change: Partial<ReasonForm>) => setForms((current) => ({ ...current, [id]: { ...(current[id] ?? emptyReasonForm()), ...change } }));
  const editorRequest = { originalQuestion: question, interpretation: context.interpretation, propertyIntents: active,
    context: context.context, materials: draft?.materials ?? materials };
  const coreCallbacks = {
    onChangeIntent: (intentId: string, replacement: V4Intent) => update((current) => setProjectionV4(current, intentId, replacement)),
    onAddIntent: (intent: V4Intent) => update((current) => current.additions.some((row) => row.id === intent.id)
      || annotations.some((row) => row.annotationId === intent.id) ? current : { ...current, additions: [...current.additions, structuredClone(intent)] }),
    onChangeCandidatePolicy: (policy: V4ReadingContext['candidatePolicy']) => update((current) => ({ ...current,
      readingContext: { ...current.readingContext, candidatePolicy: structuredClone(policy) } })),
    onChangeMaterials: (next: HopDecisionMaterial[]) => update((current) => ({ ...current, materials: [...next] })),
    onChangeAccess: (scope: V4AccessScope, value: V4Access) => update((current) => ({ ...current, readingContext: { ...current.readingContext,
      context: { ...current.readingContext.context, access: { ...current.readingContext.context.access, [scope]: structuredClone(value) } as V4ReadingContext['context']['access'] } } })),
    onChangeAssertions: (assertions: HopAdviceAssertion[]) => update((current) => ({ ...current, readingContext: { ...current.readingContext,
      context: { ...current.readingContext.context, assertions: structuredClone(assertions) } } })),
  };
  const coreShared = { mode: 'v3' as const, request: editorRequest, candidatePolicy: context.candidatePolicy, materialChoices,
    onSearchMaterials, onSelectMaterials, disabled, lockInterpretationOrigin: true, intentLabels: outsideLabels, ...coreCallbacks };

  const linkedFrom = (id: string): string[] => active.filter((intent) => intent.id !== id && (intent.relatedIntentIds.includes(id)
    || intent.investigation?.observationIntentIds.includes(id) || intent.partner?.kind === 'observation' && intent.partner.id === id)).map((intent) => intent.label);

  const renderReasonForm = (row: V4AnnotationRow, kind: 'reject' | 'restore') => {
    const id = row.annotationId, term = `« ${row.intent.label} »`, form = formOf(id), reason = reasonOf(form);
    const presets = kind === 'reject' ? rejectPresetsV4 : restorePresetsV4;
    const from = kind === 'reject' ? linkedFrom(id) : [];
    const base = row.base;
    const lastActive = base?.lastActive;
    const offerProjection = kind === 'restore' && base !== undefined && lastActive !== undefined && projectionChangedV4(base.source, lastActive);
    return <div className="hv4-inline-form" role="group" aria-label={kind === 'reject' ? `Écarter ${term}` : `Restaurer ${term}`}>
      <p className="hv4-help">{kind === 'reject'
        ? 'Écarter garde la trace : passage exact, motif, date et auteur. Rien n’est supprimé; tu pourras restaurer ce terme.'
        : 'Restaurer crée un nouvel acte; l’écart et son motif restent dans la trace.'}</p>
      {offerProjection ? <fieldset className="hv4-picks"><legend>Lecture à reprendre</legend>
        {([['lastActive', 'Comme avant l’écart'], ['source', 'Lecture d’origine']] as const).map(([value, text]) =>
          <label key={value} className={`hv4-pick ${form.projection === value ? 'is-on' : ''}`}>
            <input type="radio" name={`${rootId}-projection-${id}`} checked={form.projection === value} disabled={disabled}
              onChange={() => setForm(id, { projection: value })} /><span>{text}</span></label>)}
      </fieldset> : null}
      <fieldset className="hv4-picks"><legend>{kind === 'reject' ? 'Pourquoi cette lecture est-elle erronée ?' : 'Pourquoi restaurer ce terme ?'}</legend>
        {presets.map((preset) => <label key={preset} className={`hv4-pick ${form.preset === preset ? 'is-on' : ''}`}>
          <input type="radio" name={`${rootId}-${kind}-${id}`} checked={form.preset === preset} disabled={disabled}
            onChange={() => setForm(id, { preset })} /><span>{preset}</span></label>)}
      </fieldset>
      <label className="hv4-field"><span>{form.preset ? 'Précision · facultative' : 'Ou motif libre'}</span>
        <Input value={form.precision} disabled={disabled} aria-label={`Précision du motif · ${term}`}
          onChange={(event) => setForm(id, { precision: event.target.value })} /></label>
      {from.length ? <p className="hv4-warn">{from.map((labelText) => `« ${labelText} »`).join(', ')} {from.length === 1 ? 'est relié' : 'sont reliés'} à ce terme : tu choisiras ensuite de délier ou de garder ce terme.</p> : null}
      <div className="hv4-actions">
        <button type="button" className="hv4-primary" disabled={disabled || !reason} onClick={() => {
          if (!reason) return;
          if (kind === 'reject') update((current) => ({ ...current, rejections: { ...current.rejections, [id]: reason } }));
          else if (base) { const target = base, projection = form.projection; update((current) => restoreV4(current, target, reason, projection)); }
          close(id);
        }}>{kind === 'reject' ? 'Écarter ce terme' : 'Restaurer ce terme'}</button>
        <button type="button" className="hv4-secondary" disabled={disabled} onClick={() => close(id)}>Annuler</button>
      </div>
    </div>;
  };

  const renderRow = (row: V4AnnotationRow, number: number | null) => {
    const id = row.annotationId, term = `« ${row.intent.label} »`, mode = modes[id];
    const fragments = row.intent.sourceSpans.map((span) => span.text).join(' … ');
    const related = row.intent.relatedIntentIds.filter((relatedId) => row.intent.investigation?.observationIntentIds.includes(relatedId) !== true);
    const hasPending = pending.some((link) => link.kind === 'intent' ? link.ownerId === id || link.targetId === id : link.targetId === id);
    const badge = row.state === 'revised' ? 'Corrigé · à confirmer' : row.state === 'restored' ? 'Restauré · à confirmer'
      : row.state === 'added' ? 'Ajouté · à confirmer' : row.state === 'rejecting' ? 'À écarter' : row.state === 'rejected' ? 'Écarté' : null;
    const lastDecision = row.base?.latest.decision;
    return <li className={`hv4-term is-${row.state}`} key={id}>
      <div className="hv4-term-line">
        <span className={`hv4-term-index${number === null ? ' is-muted' : ''}`} aria-hidden="true">{number ?? '×'}</span>
        <div className="hv4-term-text">
          <span className="hv4-term-title"><b>{term}</b>{badge ? <span className={`hv4-badge is-${row.state}`}>{badge}</span> : null}</span>
          <span className="hv4-term-reading">{readingSentenceV4(row.intent, labelOf)}</span>
          {fragments && fragments !== row.intent.label ? <small>Passage : « {fragments} »</small> : null}
          {related.length ? <small>Lié à {related.map((relatedId) => `« ${labelOf(relatedId)} »`).join(', ')}</small> : null}
          {row.state === 'rejecting' ? <small className="hv4-term-motive">Motif : {draft?.rejections[id]}</small> : null}
          {row.state === 'restored' ? <small className="hv4-term-motive">Motif : {draft?.restorations[id]}</small> : null}
          {row.state === 'rejected' && lastDecision ? <small className="hv4-term-motive">Écarté le {formatInstantV4(lastDecision.recordedAt)} · {lastDecision.reason}</small> : null}
          {hasPending ? <small className="hv4-term-warn">Lien à résoudre avant confirmation</small> : null}
        </div>
        {editable ? <div className="hv4-term-actions">
          {isActiveRowV4(row) ? <button type="button" className="hv4-act" aria-expanded={mode === 'edit'} aria-label={`Corriger ${term}`} disabled={disabled}
            onClick={() => toggle(id, 'edit')}>{mode === 'edit' ? 'Fermer' : 'Corriger'}</button> : null}
          {row.state === 'kept' || row.state === 'revised' ? <button type="button" className="hv4-act is-danger" aria-expanded={mode === 'reject'} aria-label={`Écarter ${term}`}
            disabled={disabled} onClick={() => toggle(id, 'reject')}>Écarter</button> : null}
          {row.state === 'revised' ? <button type="button" className="hv4-act is-quiet" aria-label={`Annuler la correction de ${term}`} disabled={disabled}
            onClick={() => update((current) => ({ ...current, edits: omitKey(current.edits, id), revisionReasons: omitKey(current.revisionReasons, id) }))}>Annuler la correction</button> : null}
          {row.state === 'rejecting' ? <button type="button" className="hv4-act" aria-label={`Garder ${term}`} disabled={disabled}
            onClick={() => update((current) => cancelRejectionV4(current, id))}>Garder ce terme</button> : null}
          {row.state === 'restored' ? <button type="button" className="hv4-act is-quiet" aria-label={`Annuler la restauration de ${term}`} disabled={disabled}
            onClick={() => update((current) => ({ ...current, restorations: omitKey(current.restorations, id), edits: omitKey(current.edits, id) }))}>Annuler la restauration</button> : null}
          {row.state === 'added' ? <button type="button" className="hv4-act is-quiet" aria-label={`Retirer l’ajout ${term}`} disabled={disabled}
            onClick={() => update((current) => ({ ...current, additions: current.additions.filter((addition) => addition.id !== id) }))}>Retirer l’ajout</button> : null}
          {row.state === 'rejected' ? <button type="button" className="hv4-act" aria-expanded={mode === 'restore'} aria-label={`Restaurer ${term}`} disabled={disabled}
            onClick={() => toggle(id, 'restore')}>Restaurer</button> : null}
        </div> : null}
      </div>
      {editable && mode === 'edit' && isActiveRowV4(row) ? <div className="hv4-edit">
        <PropertyAdviceIntentEditorCore {...coreShared} sections={['intents']} visibleIntentIds={[id]} />
        {row.state === 'kept' || row.state === 'revised' ? <label className="hv4-field"><span>Pourquoi cette correction ? · facultatif</span>
          <Input value={draft?.revisionReasons[id] ?? ''} disabled={disabled} aria-label={`Motif de correction de ${term}`}
            onChange={(event) => { const value = event.target.value; update((current) => ({ ...current, revisionReasons: { ...current.revisionReasons, [id]: value } })); }} /></label> : null}
      </div> : null}
      {editable && mode === 'reject' && (row.state === 'kept' || row.state === 'revised') ? renderReasonForm(row, 'reject') : null}
      {editable && mode === 'restore' && row.state === 'rejected' ? renderReasonForm(row, 'restore') : null}
      {row.base ? <TraceV4 base={row.base} /> : <p className="hv4-help">Ajout pas encore enregistré · passage exact {row.intent.sourceSpans.map((span) => `« ${span.text} » (${span.start}–${span.end})`).join(' · ')}</p>}
    </li>;
  };

  const activeCount = rows.filter(isActiveRowV4).length;
  const rejectedCount = rows.length - activeCount;
  return <section className="hv-property-section hv4-reading" aria-labelledby={`${rootId}-reading-title`} ref={sectionRef}>
    <div className="hv4-section-head"><h3 id={`${rootId}-reading-title`}>Ta question et sa lecture</h3>
      <span className="hv4-count">{`${activeCount} terme${activeCount === 1 ? '' : 's'} retenu${activeCount === 1 ? '' : 's'} · ${rejectedCount} écarté${rejectedCount === 1 ? '' : 's'}`}</span></div>
    <QuestionFragmentsV4 question={question} rows={rows} />
    <p className="hv4-legend"><span className="hv4-frag is-active">surligné</span> retenu · <span className="hv4-frag is-added">pointillé</span> ajouté · <span className="hv4-frag is-rejected">barré</span> écarté</p>
    <p className="hv4-reading-text"><b>{context.interpretation.origin === 'user' ? 'Résumé formulé par toi' : 'Résumé proposé'} :</b> {context.interpretation.text}</p>
    {shownRows.length ? <ol className="hv4-terms" aria-label="Termes de la lecture">{shownRows.map((row, index) => renderRow(row, index + 1))}</ol>
      : <p className="hv4-empty">Aucun terme retenu. La question reste conservée; restaure un terme écarté ou ajoute un passage exact.</p>}
    {rejectedRows.length ? <div className="hv4-rejected">
      <h4>{`Écartés · ${rejectedRows.length}`}</h4>
      <p className="hv4-help">Ils gardent leur passage, leur motif et leur trace. Restaurer crée un nouvel acte.</p>
      <ul className="hv4-terms" aria-label="Termes écartés">{rejectedRows.map((row) => renderRow(row, null))}</ul>
    </div> : null}
    {editable ? <div className="hv4-more">
      <PropertyAdviceIntentEditorCore {...coreShared} sections={['add', 'policy']} />
    </div> : null}
    <AccessStripV4 rootId={rootId} base={readingContext} context={context} draft={draft} editable={editable} disabled={disabled}
      requestNonce={accessRequest} onUpdateDraft={onUpdateDraft} />
    {children}
  </section>;
}
