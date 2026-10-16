export type GeminiFailureKind =
  | 'spend-cap'
  | 'daily-quota'
  | 'rate-limit'
  | 'authentication'
  | 'invalid-request'
  | 'model-unavailable'
  | 'server';

type GeminiProviderStatus =
  | 'INVALID_ARGUMENT' | 'UNAUTHENTICATED' | 'PERMISSION_DENIED' | 'RESOURCE_EXHAUSTED'
  | 'NOT_FOUND' | 'FAILED_PRECONDITION' | 'UNAVAILABLE' | 'INTERNAL' | 'DEADLINE_EXCEEDED'
  | 'CANCELLED' | 'UNKNOWN' | 'OUT_OF_RANGE' | 'ALREADY_EXISTS' | 'ABORTED' | 'DATA_LOSS';

type GeminiProviderReason = 'API_KEY_INVALID';

export interface GeminiProviderDiagnostic {
  code?: number;
  status?: GeminiProviderStatus;
  reasons?: GeminiProviderReason[];
  fieldPaths?: string[];
}

const PROVIDER_STATUSES = new Set<GeminiProviderStatus>([
  'INVALID_ARGUMENT', 'UNAUTHENTICATED', 'PERMISSION_DENIED', 'RESOURCE_EXHAUSTED',
  'NOT_FOUND', 'FAILED_PRECONDITION', 'UNAVAILABLE', 'INTERNAL', 'DEADLINE_EXCEEDED',
  'CANCELLED', 'UNKNOWN', 'OUT_OF_RANGE', 'ALREADY_EXISTS', 'ABORTED', 'DATA_LOSS'
]);
const PROVIDER_REASONS = new Set<GeminiProviderReason>(['API_KEY_INVALID']);
const PROVIDER_HTTP_CODES = new Set([400, 401, 403, 404, 408, 409, 413, 415, 422, 429, 500, 501, 502, 503, 504]);
const MAX_PROVIDER_FIELD_PATHS = 8;
const MAX_PROVIDER_DETAILS = 32;
const MAX_PROVIDER_FIELD_PATH_LENGTH = 240;

/** Server-only proof that transport never started. Throw this before fetch, never for an
 * aborted/timed-out fetch: Google may already have generated and charged that request.
 */
export class GeminiRequestNotSentError extends Error {
  constructor(cause?: unknown) {
    super(cause instanceof Error ? cause.message : 'La requête IA a été annulée avant son envoi.', { cause });
    this.name = 'GeminiRequestNotSentError';
  }
}

/** Free-form provider text is used only for classification; diagnostics retain only bounded allowlisted fields. */
export class GeminiApiError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly model: string,
    readonly kind: GeminiFailureKind,
    readonly retryAfterMs?: number,
    readonly provider?: GeminiProviderDiagnostic
  ) {
    super(`Gemini HTTP ${httpStatus} · ${kind}`);
  }

  get rejectedBeforeGeneration() {
    return [400, 401, 403, 404, 413, 429].includes(this.httpStatus);
  }

  get canTryAnotherModel() {
    return ['rate-limit', 'model-unavailable', 'server'].includes(this.kind);
  }

  diagnostic() {
    return {
      httpStatus: this.httpStatus,
      model: this.model,
      kind: this.kind,
      ...(this.retryAfterMs != null ? { retryAfterMs: this.retryAfterMs } : {}),
      ...(this.provider ? { provider: this.provider } : {})
    };
  }

  /** Shown to the brewer: no provider or model name (DESIGN.md), but the console to act in stays named. */
  publicError() {
    const messages: Record<GeminiFailureKind, string> = {
      'spend-cap': 'Le service IA bloque les appels : le plafond de dépenses IA du projet est atteint. Vérifie le plafond mensuel dans la console AI Studio → Dépenses. Les limites « Limites IA » de cette application sont distinctes. Après régularisation, relance cette question.',
      'daily-quota': 'Le quota quotidien du service IA est atteint. Vérifie les limites du projet et du modèle dans la console AI Studio, puis relance après leur renouvellement ou leur modification.',
      'rate-limit': `Le service IA limite temporairement le débit.${this.retryAfterMs ? ` Attends environ ${Math.ceil(this.retryAfterMs / 1000)} secondes avant de relancer.` : ' Réessaie dans quelques instants.'} Ce n’est pas le plafond de tokens de l’application.`,
      'authentication': 'Le service IA refuse l’accès. Vérifie la clé API, ses restrictions et les autorisations du projet côté serveur.',
      'invalid-request': 'Le service IA a refusé le format de la requête. Le diagnostic technique est enregistré côté serveur ; augmenter les plafonds ne résout pas ce problème.',
      // The model id stays in the server diagnostic (`diagnostic().model`).
      'model-unavailable': 'Le modèle IA configuré est indisponible pour ce projet. La configuration des modèles doit être vérifiée.',
      'server': 'Le service IA est temporairement indisponible. Ta question est conservée ; tu peux relancer.'
    };
    return {
      code: `gemini-${this.kind}`,
      message: messages[this.kind],
      retryable: this.kind !== 'invalid-request'
    };
  }
}

/** Only explicit server preflight cancellation or a definite provider rejection has zero cost. */
export function isGeminiRequestUncharged(error: unknown): boolean {
  return error instanceof GeminiRequestNotSentError || error instanceof GeminiApiError && error.rejectedBeforeGeneration;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProviderDetail(value: unknown, type: string): value is Record<string, unknown> {
  return isRecord(value) && typeof value['@type'] === 'string' && value['@type'].endsWith(`/google.rpc.${type}`);
}

function safeProviderFieldPath(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_PROVIDER_FIELD_PATH_LENGTH &&
    /^[a-z][A-Za-z0-9]*(?:\[\d+\])?(?:\.[a-z][A-Za-z0-9]*(?:\[\d+\])?)*$/u.test(value) &&
    !/(?:api[_-]?key|secret|credential|token|prompt|thought|AIza|Bearer)/iu.test(value);
}

/** Keep only fixed provider enums, a matching HTTP code, and protobuf-style field paths. */
function safeProviderDiagnostic(status: number, error: unknown): GeminiProviderDiagnostic | undefined {
  if (!isRecord(error)) return undefined;
  const diagnostic: GeminiProviderDiagnostic = {};
  if (Number.isInteger(error.code) && error.code === status && PROVIDER_HTTP_CODES.has(status)) {
    diagnostic.code = status;
  }
  if (typeof error.status === 'string' && PROVIDER_STATUSES.has(error.status as GeminiProviderStatus)) {
    diagnostic.status = error.status as GeminiProviderStatus;
  }

  const details = Array.isArray(error.details) ? error.details.slice(0, MAX_PROVIDER_DETAILS) : [];
  const reasons = new Set<GeminiProviderReason>();
  const fieldPaths = new Set<string>();
  for (const detail of details) {
    if (fieldPaths.size >= MAX_PROVIDER_FIELD_PATHS) break;
    if (isProviderDetail(detail, 'ErrorInfo') && PROVIDER_REASONS.has(detail.reason as GeminiProviderReason)) {
      reasons.add(detail.reason as GeminiProviderReason);
    }
    if (!isProviderDetail(detail, 'BadRequest') || !Array.isArray(detail.fieldViolations)) continue;
    for (const violation of detail.fieldViolations.slice(0, MAX_PROVIDER_DETAILS)) {
      if (!isRecord(violation) || !safeProviderFieldPath(violation.field)) continue;
      fieldPaths.add(violation.field);
      if (fieldPaths.size >= MAX_PROVIDER_FIELD_PATHS) break;
    }
  }
  if (reasons.size) diagnostic.reasons = [...reasons];
  if (fieldPaths.size) diagnostic.fieldPaths = [...fieldPaths];
  return Object.keys(diagnostic).length ? diagnostic : undefined;
}

export function parseGeminiError(
  status: number,
  model: string,
  payload: unknown,
  retryAfter: string | null = null
) {
  const error = (payload as any)?.error;
  const message = typeof error?.message === 'string' ? error.message : '';
  const details = Array.isArray(error?.details) ? error.details : [];
  const isDetail = (value: any, type: string) =>
    typeof value?.['@type'] === 'string' && value['@type'].endsWith(`/google.rpc.${type}`);
  const quotas = details
    .filter((d: any) => isDetail(d, 'QuotaFailure'))
    .flatMap((d: any) => Array.isArray(d.violations) ? d.violations : []);
  const daily =
    quotas.some((q: any) => /perday|daily/i.test(String(q?.quotaId ?? ''))) ||
    /daily quota|quota.{0,30}per day/i.test(message);
  const spend = /(?:monthly (?:spend(?:ing)? )?|project spend(?:ing)? |billing(?: tier| account)? (?:spend(?:ing)? )?|spend(?:ing)? )(?:cap|limit)|spend-based (?:rate )?limit|insufficient (?:credits|balance)|credit balance.{0,30}(?:zero|depleted)/i.test(message);
  const delay = details.find((d: any) => isDetail(d, 'RetryInfo'))?.retryDelay;
  const seconds = typeof delay === 'string' && /^\d+(\.\d+)?s$/.test(delay)
    ? parseFloat(delay)
    : Number(retryAfter);
  const retryAfterMs = Number.isFinite(seconds) && seconds > 0
    ? Math.min(3600000, Math.ceil(seconds * 1000))
    : undefined;
  const provider = safeProviderDiagnostic(status, error);
  const invalidApiKey = provider?.reasons?.includes('API_KEY_INVALID') ?? false;
  const kind: GeminiFailureKind = status === 400 && invalidApiKey ? 'authentication'
    : status === 429
    ? spend ? 'spend-cap' : daily ? 'daily-quota' : 'rate-limit'
    : [401, 403].includes(status) ? 'authentication'
    : status === 404 ? 'model-unavailable'
    : status >= 400 && status < 500 ? 'invalid-request' : 'server';
  return new GeminiApiError(status, model, kind, retryAfterMs, provider);
}
