/**
 * Une réponse Gemini complète, ou un refus clair.
 *
 * Banc réel #91 (13 octobre 2026) : la fiche de la levure S-04 a bouclé sur
 * `"tempMinC": 18.000…` jusqu'au plafond de sortie, en 3.8 comme en 3.5
 * Flash-Lite. La réponse coupée ne se lit pas, et une nouvelle tentative à
 * température 0 reboucle : elle doublait le délai et le coût pour rien. Une
 * telle réponse est donc refusée sans nouvelle tentative, avec un message que
 * le brasseur comprend. Module pur : le client affiche les mêmes textes.
 */

export type GeminiUnusableReason = 'degenerate' | 'truncated';

/**
 * Never « relance la demande »: the same request loops or is cut again, and is billed again.
 * The lookup screens append « — à saisir à la main. » themselves. No provider name (DESIGN.md).
 * Non-breaking spaces keep « ; » and « : » off the start of a line at 390 px.
 */
export const GEMINI_UNUSABLE_MESSAGES: Record<GeminiUnusableReason, string> = {
  degenerate: 'L’IA a rendu une réponse inutilisable (un nombre répété sans fin). Rien n’est appliqué ; la même demande bouclerait encore : modifie-la avant de relancer.',
  truncated: 'La réponse de l’IA a été coupée au plafond de sortie. Rien n’est appliqué ; la même demande serait coupée encore : modifie-la avant de relancer.'
};

export class GeminiUnusableOutputError extends Error {
  constructor(readonly reason: GeminiUnusableReason) {
    super(GEMINI_UNUSABLE_MESSAGES[reason]);
    this.name = 'GeminiUnusableOutputError';
  }
}

/** A JSON number needs at most 17 significant digits; 32 in a row is the token loop, not a value. */
const NUMBER_LOOP = /[:[,]\s*-?\d*\.?\d{32,}/;

/** The visible answer: every text part except the model's thoughts. */
export function geminiAnswerText(response: any): string {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.filter((part: any) => part?.thought !== true && typeof part?.text === 'string').map((part: any) => part.text).join('');
}

function parses(text: string): boolean {
  try { JSON.parse(text); return true; } catch { return false; }
}

/**
 * Refuses an answer cut by the output cap, or a numeric loop that does not
 * parse. A complete JSON answer passes, even if a number was written long.
 */
export function unusableGeminiOutput(response: any): GeminiUnusableOutputError | undefined {
  const text = geminiAnswerText(response);
  const loop = NUMBER_LOOP.test(text);
  if (response?.candidates?.[0]?.finishReason === 'MAX_TOKENS') return new GeminiUnusableOutputError(loop ? 'degenerate' : 'truncated');
  if (loop && !parses(text.replace(/```json/g, '').replace(/```/g, '').trim())) return new GeminiUnusableOutputError('degenerate');
  return undefined;
}
