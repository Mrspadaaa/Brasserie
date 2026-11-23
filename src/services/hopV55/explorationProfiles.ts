import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';

export const HOP_V55_EXPLORATION_PROFILE_FORMAT = 'hop-v55-exploration-profile-v1' as const;

export type HopV55ConfrontationDirection = 'seek' | 'reduce' | 'avoid' | 'keep' | 'investigate';
export type HopV55ExplorationProfileStatus = 'target' | 'hypothesis';

export interface HopV55ExplorationProfileCriterionV1 {
  id: string;
  direction: HopV55ConfrontationDirection;
  label: string;
  family?: { key: string; axisId: string; version: string; name: string; terms: string[] };
  freeTerm?: string;
}

export interface HopV55ExplorationProfileV1 {
  format: typeof HOP_V55_EXPLORATION_PROFILE_FORMAT;
  profileId: string;
  version: number;
  previousReference: string | null;
  label: string;
  status: HopV55ExplorationProfileStatus;
  /** Brewer wording kept verbatim; never parsed into numbers or a style. */
  description: string;
  criteria: HopV55ExplorationProfileCriterionV1[];
  scope: 'explorationOnly';
  /** Always null: proximity of a name never creates a guide reference. */
  styleGuideRef: null;
  actor: { kind: 'brewer'; label: 'Brasseur' };
  recordedAt: string;
  reference: string;
}

export interface HopV55ExplorationProfileDraft {
  label: string;
  status: HopV55ExplorationProfileStatus | '';
  description: string;
  criteria: Array<Omit<HopV55ExplorationProfileCriterionV1, 'id'> & { id?: string }>;
}

const DIRECTIONS = new Set<HopV55ConfrontationDirection>(['seek', 'reduce', 'avoid', 'keep', 'investigate']);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isExactText = (value: unknown): value is string => isText(value) && value.trim() === value;
const isRow = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = <T,>(value: T): T => structuredClone(value);
const validInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));
const onlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).every(key => keys.includes(key));

export function hopV55ExplorationProfileDraftErrors(draft: HopV55ExplorationProfileDraft): string[] {
  const errors: string[] = [];
  if (!draft.label.trim()) errors.push('Nomme ce profil.');
  if (draft.label.trim().length > 120) errors.push('Le nom du profil dépasse 120 caractères.');
  if (draft.status !== 'target' && draft.status !== 'hypothesis') errors.push('Choisis si ce profil est une cible ou une hypothèse.');
  if (!draft.description.trim() && !draft.criteria.length) errors.push('Décris le profil ou ajoute au moins un critère.');
  const criterionIds = new Set<string>();
  draft.criteria.forEach((criterion, index) => {
    const position = `Critère ${index + 1}`;
    if (!DIRECTIONS.has(criterion.direction)) errors.push(`${position} : choisis une relation.`);
    if (!criterion.label.trim()) errors.push(`${position} : formule ce que tu vises.`);
    const hasFamily = !!criterion.family;
    const hasTerm = isText(criterion.freeTerm);
    if (hasFamily === hasTerm) errors.push(`${position} : relie-le soit à une famille documentée, soit à un terme exact.`);
    if (hasTerm && criterion.freeTerm!.trim().length > 80) errors.push(`${position} : le terme exact dépasse 80 caractères.`);
    if (criterion.id !== undefined) {
      if (!isExactText(criterion.id) || criterionIds.has(criterion.id)) errors.push(`${position} : identifiant dupliqué ou invalide.`);
      criterionIds.add(criterion.id);
    }
  });
  return errors;
}

function profileContent(profile: Omit<HopV55ExplorationProfileV1, 'reference'>): Omit<HopV55ExplorationProfileV1, 'reference'> {
  return clone(profile);
}

export function createHopV55ExplorationProfile(draft: HopV55ExplorationProfileDraft, options: {
  recordedAt: string;
  profileId: string;
  previous?: HopV55ExplorationProfileV1;
  newId(): string;
}): HopV55ExplorationProfileV1 {
  const errors = hopV55ExplorationProfileDraftErrors(draft);
  if (errors.length) throw Error(errors.join(' '));
  if (!isExactText(options.profileId) || options.profileId.length > 160 || /[\/\\]/u.test(options.profileId)
    || !validInstant(options.recordedAt)) throw Error('Identité de profil et date exacte requises.');
  if (options.previous) {
    const previousRead = readHopV55ExplorationProfile(options.previous);
    if (previousRead.status !== 'current' || previousRead.profile.profileId !== options.profileId) {
      throw Error('Une révision doit partir du profil V1 exact du même identifiant.');
    }
  }
  const content: Omit<HopV55ExplorationProfileV1, 'reference'> = profileContent({
    format: HOP_V55_EXPLORATION_PROFILE_FORMAT,
    profileId: options.profileId,
    version: options.previous ? options.previous.version + 1 : 1,
    previousReference: options.previous?.reference ?? null,
    label: draft.label.trim(),
    status: draft.status as HopV55ExplorationProfileStatus,
    description: draft.description,
    criteria: draft.criteria.map((criterion) => ({
      id: criterion.id ?? options.newId(),
      direction: criterion.direction,
      label: criterion.label.trim(),
      ...(criterion.family ? { family: { ...criterion.family, terms: [...criterion.family.terms] } } : {}),
      ...(isText(criterion.freeTerm) ? { freeTerm: criterion.freeTerm.trim() } : {}),
    })),
    scope: 'explorationOnly',
    styleGuideRef: null,
    actor: { kind: 'brewer', label: 'Brasseur' },
    recordedAt: options.recordedAt,
  });
  const profile = { ...content, reference: hopAdviceContentReference(HOP_V55_EXPLORATION_PROFILE_FORMAT, content) };
  const read = readHopV55ExplorationProfile(profile);
  if (read.status !== 'current') throw Error(read.status === 'invalid' ? read.reason : 'Format de profil inattendu.');
  return profile;
}

export type HopV55ExplorationProfileRead =
  | { status: 'current'; profile: HopV55ExplorationProfileV1 }
  | { status: 'unsupported'; format: string | null; raw: unknown }
  | { status: 'invalid'; reason: string; raw: unknown };

function criterionError(value: unknown): boolean {
  if (!isRow(value) || !onlyKeys(value, ['id', 'direction', 'label', 'family', 'freeTerm'])
    || !isExactText(value.id) || !DIRECTIONS.has(value.direction as HopV55ConfrontationDirection) || !isExactText(value.label)) return true;
  const family = value.family;
  const hasFamily = family !== undefined;
  const hasTerm = value.freeTerm !== undefined;
  if (hasFamily === hasTerm) return true;
  if (hasTerm && !isExactText(value.freeTerm)) return true;
  if (hasFamily && (!isRow(family) || !onlyKeys(family, ['key', 'axisId', 'version', 'name', 'terms'])
    || !isExactText(family.key) || !isExactText(family.axisId) || !isExactText(family.version) || !isExactText(family.name)
    || !Array.isArray(family.terms) || !family.terms.every(isExactText))) return true;
  return false;
}

/** Reads an archived profile as stored: it validates, never rebuilds or requalifies it. */
export function readHopV55ExplorationProfile(value: unknown): HopV55ExplorationProfileRead {
  if (!isRow(value)) return { status: 'invalid', reason: 'Profil illisible.', raw: value };
  if (value.format !== HOP_V55_EXPLORATION_PROFILE_FORMAT) {
    return { status: 'unsupported', format: typeof value.format === 'string' ? value.format : null, raw: value };
  }
  const { reference, ...content } = value;
  const topKeys = ['format', 'profileId', 'version', 'previousReference', 'label', 'status', 'description', 'criteria',
    'scope', 'styleGuideRef', 'actor', 'recordedAt', 'reference'];
  if (!onlyKeys(value, topKeys) || !isExactText(reference) || !isExactText(value.profileId) || value.profileId.length > 160
    || /[\/\\]/u.test(value.profileId) || !Number.isSafeInteger(value.version) || (value.version as number) < 1
    || (value.version === 1 ? value.previousReference !== null : !isExactText(value.previousReference)) || !isExactText(value.label)
    || (value.status !== 'target' && value.status !== 'hypothesis') || typeof value.description !== 'string'
    || !Array.isArray(value.criteria) || value.criteria.some(criterionError) || value.scope !== 'explorationOnly'
    || new Set((value.criteria as Array<Record<string, unknown>>).map(criterion => criterion.id)).size !== value.criteria.length
    || value.styleGuideRef !== null || !isRow(value.actor) || !onlyKeys(value.actor, ['kind', 'label'])
    || value.actor.kind !== 'brewer' || value.actor.label !== 'Brasseur' || !validInstant(value.recordedAt)) {
    return { status: 'invalid', reason: 'Profil incomplet ou altéré; il reste conservé tel quel.', raw: value };
  }
  try {
    if (hopAdviceContentReference(HOP_V55_EXPLORATION_PROFILE_FORMAT, content) !== reference) {
      return { status: 'invalid', reason: 'Empreinte du profil différente de son contenu; aucune correction automatique.', raw: value };
    }
  } catch {
    return { status: 'invalid', reason: 'Profil non sérialisable.', raw: value };
  }
  return { status: 'current', profile: clone(value) as unknown as HopV55ExplorationProfileV1 };
}

export interface HopV55ExplorationProfileHistory {
  latest: HopV55ExplorationProfileV1[];
  history: HopV55ExplorationProfileV1[];
  unreadable: Array<Exclude<HopV55ExplorationProfileRead, { status: 'current' }>>;
}

export function hopV55ExplorationProfileHistory(rows: readonly unknown[] | undefined): HopV55ExplorationProfileHistory {
  const reads = (rows ?? []).map(readHopV55ExplorationProfile);
  const history = reads.flatMap((row) => row.status === 'current' ? [row.profile] : []);
  const unreadable = reads.filter((row): row is Exclude<HopV55ExplorationProfileRead, { status: 'current' }> => row.status !== 'current');
  const reservedIds = new Set(unreadable.flatMap(row => isRow(row.raw) && isExactText(row.raw.profileId) ? [row.raw.profileId] : []));
  const profilesById = new Map<string, HopV55ExplorationProfileV1[]>();
  for (const profile of history) profilesById.set(profile.profileId, [...(profilesById.get(profile.profileId) ?? []), profile]);
  const latestById = new Map<string, HopV55ExplorationProfileV1>();
  for (const [profileId, versions] of profilesById) {
    if (reservedIds.has(profileId)) continue;
    const ordered = [...versions].sort((a, b) => a.version - b.version);
    const inconsistentIndex = ordered.findIndex((profile, index) => profile.version !== index + 1
      || profile.previousReference !== (ordered[index - 1]?.reference ?? null));
    if (inconsistentIndex >= 0) {
      const raw = ordered[inconsistentIndex];
      unreadable.push({ status: 'invalid', reason: 'Filiation du profil incohérente; aucune tête n’est choisie automatiquement.', raw });
      continue;
    }
    const latest = ordered.at(-1);
    if (latest) latestById.set(profileId, latest);
  }
  return {
    latest: [...latestById.values()],
    history,
    unreadable,
  };
}

/** Collection reads retain invalid and future raw entries; only new writes are restricted. */
export function assertHopV55ExplorationProfileCollection(rows: unknown): void {
  if (rows === undefined) return;
  if (!Array.isArray(rows)) throw Error('Historique des profils d’exploration invalide; les données restent en lecture seule.');
  const references = new Map<string, unknown>();
  for (const raw of rows) {
    const reference = isRow(raw) && typeof raw.reference === 'string' ? raw.reference : undefined;
    if (!reference) continue;
    const previous = references.get(reference);
    if (previous !== undefined && !exactValue(previous, raw)) throw Error('Référence de profil dupliquée avec un autre contenu.');
    references.set(reference, raw);
  }
}

function exactValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((row, index) => exactValue(row, right[index]));
  }
  const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
  const aKeys = Object.keys(a).sort(), bKeys = Object.keys(b).sort();
  return aKeys.length === bKeys.length && aKeys.every((key, index) => key === bKeys[index] && exactValue(a[key], b[key]));
}

function assertProfileChain(rows: readonly unknown[], profileId: string): HopV55ExplorationProfileV1[] {
  const matching = rows.filter((row) => isRow(row) && row.profileId === profileId);
  const chain: HopV55ExplorationProfileV1[] = [];
  for (const raw of matching) {
    const read = readHopV55ExplorationProfile(raw);
    if (read.status !== 'current') throw Error('Une version inconnue ou altérée réserve déjà cet identifiant de profil; elle reste en lecture seule.');
    chain.push(read.profile);
  }
  chain.sort((a, b) => a.version - b.version);
  chain.forEach((profile, index) => {
    const previous = chain[index - 1];
    if (profile.version !== index + 1 || profile.previousReference !== (previous?.reference ?? null)) {
      throw Error('L’historique du profil ne forme pas une filiation versionnée exacte.');
    }
  });
  return chain;
}

/** Validates additions while preserving every prior and future opaque record verbatim. */
export function assertHopV55ExplorationProfileAppendOnly(previous: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined): void {
  const prior = previous ?? [], incoming = next ?? [];
  if (!Array.isArray(incoming) || incoming.length < prior.length
    || prior.some((row, index) => !exactValue(row, incoming[index]))) {
    throw Error('Les profils d’exploration sont append-only; aucun ancien profil ne peut être remplacé ou supprimé.');
  }
  const references = new Map<string, unknown>();
  for (const raw of incoming) {
    const reference = isRow(raw) && typeof raw.reference === 'string' ? raw.reference : undefined;
    if (!reference) continue;
    const priorReference = references.get(reference);
    if (priorReference !== undefined && !exactValue(priorReference, raw)) throw Error('Référence de profil dupliquée avec un autre contenu.');
    references.set(reference, raw);
  }
  const nextRows = incoming.slice(prior.length);
  const chainById = new Map<string, HopV55ExplorationProfileV1[]>();
  for (const raw of nextRows) {
    const read = readHopV55ExplorationProfile(raw);
    if (read.status !== 'current') throw Error('Un nouveau profil doit être V1 valide; les formats inconnus restent en lecture seule.');
    const chain = chainById.get(read.profile.profileId) ?? assertProfileChain(prior, read.profile.profileId);
    const last = chain.at(-1);
    if (read.profile.version !== (last?.version ?? 0) + 1
      || read.profile.previousReference !== (last?.reference ?? null)) {
      throw Error('Une nouvelle version doit citer exactement le profil précédent; aucune version manquante ou concurrente n’est choisie.');
    }
    chain.push(read.profile);
    chainById.set(read.profile.profileId, chain);
  }
}

/** Pure append/retry helper for a profile write. It never replaces a prior version. */
export function appendHopV55ExplorationProfileRecord(rows: readonly unknown[] | undefined,
  profile: HopV55ExplorationProfileV1): unknown[] {
  const prior = [...(rows ?? [])];
  const existing = prior.find((row) => isRow(row) && row.reference === profile.reference);
  if (existing !== undefined) {
    if (!exactValue(existing, profile)) throw Error('La référence de profil existe déjà avec un contenu différent.');
    return prior;
  }
  const next = [...prior, clone(profile)];
  assertHopV55ExplorationProfileAppendOnly(prior, next);
  return next;
}
