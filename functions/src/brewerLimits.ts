/** These limits are enforced by the server, never by the model's instructions. */
export const DEFAULT_BREWER_LIMITS = {
  dailyCalls: 120,
  dailyProCalls: 40,
  dailyTokens: 1_500_000,
  questionCalls: 12,
  questionTokens: 240_000
};
export type BrewerAiLimits = typeof DEFAULT_BREWER_LIMITS;
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
