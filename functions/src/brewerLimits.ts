/** These limits are enforced by the server, never by the model's instructions. */
export const DEFAULT_BREWER_LIMITS = {
  dailyCalls: 1000,
  dailyProCalls: 20,
  dailyTokens: 5_000_000,
  questionCalls: 24,
  questionTokens: 1_000_000
};
/** Concurrency gives Flash more coverage without serializing every specialist.
 * These are ceilings, not targets; the monthly reservation still gates each call. */
export const BREWER_AGENT_LIMITS = {
  modelCalls: 24, groundedCalls: 6, shoppingResearchers: 3,
  flashCorrections: 2, proCorrections: 1
} as const;
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
  questionCalls: { min: 4, max: BREWER_AGENT_LIMITS.modelCalls },
  questionTokens: { min: 50_000, max: 1_000_000 }
};
export interface BrewerAiBudget {
  paused: boolean;
  limits: BrewerAiLimits;
  day: string;
  usage: { calls: number; proCalls: number; tokens: number };
  monthly: {
    month: string;
    limitMicroChf: number | null;
    usedMicroChf: number;
    reservedMicroChf: number;
    pricing: 'current' | 'expired';
    pricingVerifiedAt: string;
    pricingValidUntil: string;
  };
}
export class BrewerBudgetError extends Error {
  constructor(
    readonly code: 'ai-paused' | 'ai-stopped' | 'ai-daily-limit' | 'ai-question-limit' | 'ai-budget-unavailable' | 'ai-monthly-unconfigured' | 'ai-monthly-limit' | 'ai-cost-unavailable' | 'ai-grounding-unavailable',
    message: string
  ) {
    super(message);
  }
}
