import { readYeastTechnicalFacts } from './yeastTechnicalFacts.js';

/** A lookup cites a readable product page or document, never its social image.
 * This checks the transport, not whether the source proves the claimed value. */
function documentUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password &&
      !/\.(?:png|jpe?g|gif|webp|avif|svg|ico)(?:\/|$)/i.test(url.pathname);
  } catch { return false; }
}

export function yeastLookupResultError(value: unknown): string | undefined {
  const result = value as Record<string, unknown> | null;
  if (!result || typeof result !== 'object' || Array.isArray(result) || typeof result.found !== 'boolean')
    return 'La réponse ne contient pas de fiche de levure exploitable. Complète les données manuellement.';
  if (!result.found) return undefined;
  const facts = readYeastTechnicalFacts(result.technicalFacts);
  if (!facts || !documentUrl(result.sourceUrl) ||
      facts.some(fact => !fact.source?.trim() || !documentUrl(fact.sourceUrl)))
    return 'La fiche de levure renvoyée ne fournit pas de sources documentaires exploitables. Aucune donnée appliquée ; vérifie la fiche fabricant ou complète manuellement.';
  return undefined;
}
