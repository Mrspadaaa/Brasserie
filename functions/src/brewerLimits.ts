/** These limits are enforced by the server, never by the model's instructions. */
export const DEFAULT_BREWER_LIMITS = {
  dailyCalls: 120,
  dailyProCalls: 40,
  dailyTokens: 1_500_000,
  questionCalls: 12,
  questionTokens: 240_000
};
export type BrewerAiLimits = typeof DEFAULT_BREWER_LIMITS;
/**
 * Bornes acceptées à l'édition, côté serveur comme à l'écran. Elles vivent ici,
 * à côté des valeurs par défaut, pour que le formulaire ne puisse pas proposer
 * un plafond que `setBrewerAiBudget` refusera : deux listes séparées auraient
 * divergé à la première retouche.
 */
export const BREWER_LIMIT_BOUNDS: Record<keyof BrewerAiLimits, { min: number; max: number }> = {
  dailyCalls: { min: 1, max: 1000 },
  dailyProCalls: { min: 0, max: 500 },
  dailyTokens: { min: 50_000, max: 5_000_000 },
  questionCalls: { min: 4, max: 20 },
  questionTokens: { min: 50_000, max: 1_000_000 }
};
export interface BrewerAiBudget {
  paused: boolean;
  limits: BrewerAiLimits;
  day: string;
  usage: { calls: number; proCalls: number; tokens: number };
}
export class BrewerBudgetError extends Error {
  constructor(
    readonly code: 'ai-paused' | 'ai-stopped' | 'ai-daily-limit' | 'ai-question-limit' | 'ai-budget-unavailable',
    message: string
  ) {
    super(message);
  }
}
