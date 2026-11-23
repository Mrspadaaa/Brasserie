import type { TierConfig } from './models.js';

/**
 * Le corps d'une requête `generateContent` d'une tâche de `aiTask`, et le texte de l'utilisateur : tirés de `ai.ts` pour que le banc de
 * l'enrichissement (`scripts/banc-enrichissement.ts`) envoie EXACTEMENT ce que la production envoie, sans en recopier une ligne.
 * Module pur : aucun réseau, aucun secret, aucune dépendance Firebase.
 */

/** Sortie minimale du niveau Max : la réflexion haute et la réponse se partagent ce plafond. */
export const HIGH_REASONING_OUTPUT_TOKENS = 12000;
/** Plafond de sortie d'une fiche en Rapide (#100) quand la tâche n'a pas le sien. */
export const DEFAULT_MAX_OUTPUT_TOKENS = 4500;

/** Le message de l'utilisateur : la demande libre, puis les données du contexte (une chaîne telle quelle, tout le reste en JSON). */
export function userTextOf(instruction: string | undefined, context: unknown): string {
  return [
    instruction?.trim() ? `Demande : ${instruction.trim()}` : '',
    context !== undefined && context !== null
      ? `Données :\n${typeof context === 'string' ? context : JSON.stringify(context)}`
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');
}

export interface GeminiBodyInput {
  systemPrompt: string;
  userText: string;
  schema: Record<string, unknown>;
  settings: Pick<TierConfig, 'temperature' | 'thinkingLevel'>;
  file?: { data: string; mimeType: string };
  /** Recherche Google ancrée (acceptée avec le schéma de réponse par Gemini 3). */
  grounded?: boolean;
  maxOutputTokens?: number;
}

/** Le corps envoyé à Gemini, avant le chiffrage du budget (`runWithMonthlyAiBudget`) qui le normalise. */
export function geminiBody({ systemPrompt, userText, schema, settings, file, grounded = false, maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS }: GeminiBodyInput): Record<string, unknown> {
  const parts: unknown[] = [{ text: userText }];
  if (file) {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
  }
  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    ...(grounded ? { tools: [{ googleSearch: {} }] } : {}),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: settings.temperature,
      // High reasoning shares maxOutputTokens with the JSON answer: on 3.8, a one-page COA read
      // at Max spent 4486 of 4500 tokens and its answer was cut (real call of 13 October 2026).
      maxOutputTokens: settings.thinkingLevel === 'high' ? Math.max(maxOutputTokens, HIGH_REASONING_OUTPUT_TOKENS) : maxOutputTokens,
      thinkingConfig: { thinkingLevel: settings.thinkingLevel }
    }
  };
}
