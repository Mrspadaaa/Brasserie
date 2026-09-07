export type GeminiFailureKind =
  | 'spend-cap'
  | 'daily-quota'
  | 'rate-limit'
  | 'authentication'
  | 'invalid-request'
  | 'model-unavailable'
  | 'server';

/** Provider text is used for classification only; prompts, keys and raw responses are never retained. */
export class GeminiApiError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly model: string,
    readonly kind: GeminiFailureKind,
    readonly retryAfterMs?: number
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
      ...(this.retryAfterMs != null ? { retryAfterMs: this.retryAfterMs } : {})
    };
  }

  publicError() {
    const messages: Record<GeminiFailureKind, string> = {
      'spend-cap': 'Google bloque les appels : le plafond de dépenses Gemini du projet est atteint. Vérifie le plafond mensuel dans Google AI Studio → Dépenses. Les limites « Limites IA » de cette application sont distinctes. Après régularisation, relance cette question.',
      'daily-quota': 'Le quota quotidien Gemini de Google est atteint. Vérifie les limites du projet et du modèle dans Google AI Studio, puis relance après leur renouvellement ou leur modification.',
      'rate-limit': `Google limite temporairement le débit Gemini.${this.retryAfterMs ? ` Attends environ ${Math.ceil(this.retryAfterMs / 1000)} secondes avant de relancer.` : ' Réessaie dans quelques instants.'} Ce n’est pas le plafond de tokens de l’application.`,
      'authentication': 'Google refuse l’accès à Gemini. Vérifie la clé API, ses restrictions et les autorisations du projet côté serveur.',
      'invalid-request': 'Google a refusé le format de la requête Gemini. Le diagnostic technique est enregistré côté serveur ; augmenter les plafonds ne résout pas ce problème.',
      'model-unavailable': `Le modèle ${this.model} est indisponible pour ce projet Google. La configuration des modèles doit être vérifiée.`,
      'server': 'Le service Gemini est temporairement indisponible chez Google. Ta question est conservée ; tu peux relancer.'
    };
    return {
      code: `gemini-${this.kind}`,
      message: messages[this.kind],
      retryable: this.kind !== 'invalid-request'
    };
  }
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
  const kind: GeminiFailureKind = status === 429
    ? spend ? 'spend-cap' : daily ? 'daily-quota' : 'rate-limit'
    : [401, 403].includes(status) ? 'authentication'
    : status === 404 ? 'model-unavailable'
    : status >= 400 && status < 500 ? 'invalid-request' : 'server';
  return new GeminiApiError(status, model, kind, retryAfterMs);
}
