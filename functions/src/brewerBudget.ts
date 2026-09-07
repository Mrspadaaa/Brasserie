import { randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { requireBrewer } from './brewSession.js';
import { DEFAULT_BREWER_LIMITS, BrewerBudgetError } from './brewerLimits.js';
import type { BrewerAiLimits } from './brewerLimits.js';
import { GeminiApiError } from './geminiErrors.js';

const controlPath = 'brewerAiControls/current';
const emptyUsage = () => ({ calls: 0, proCalls: 0, tokens: 0 });
export const brewerBudgetDay = (at = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(at);
function readControls(data: any = {}) {
  const limits = { ...DEFAULT_BREWER_LIMITS, ...data.limits };
  if (
    typeof (data.paused ?? false) !== 'boolean' ||
    Object.values(limits).some((n) => !Number.isSafeInteger(n) || Number(n) < 0)
  )
    throw new BrewerBudgetError(
      'ai-budget-unavailable',
      'Les limites IA ne peuvent pas être vérifiées. Aucun nouvel appel Gemini.'
    );
  return { paused: data.paused === true, limits: limits as BrewerAiLimits };
}
const unavailable = () =>
  new BrewerBudgetError(
    'ai-budget-unavailable',
    'Le contrôle de consommation est indisponible. Aucun nouvel appel Gemini ; tu peux réessayer plus tard.'
  );

export const getBrewerAiBudget = onCall(
  { region: 'europe-west6', maxInstances: 3 },
  async (request) => {
    requireBrewer(request);
    const db = getFirestore(),
      day = brewerBudgetDay();
    const [controls, daily] = await Promise.all([
      db.doc(controlPath).get(),
      db.doc(`brewerAiUsage/${day}`).get()
    ]);
    return {
      ...readControls(controls.data()),
      day,
      usage: { ...emptyUsage(), ...daily.data()?.usage }
    };
  }
);

export const setBrewerAiBudget = onCall(
  { region: 'europe-west6', maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request),
      input = request.data;
    if (
      !input ||
      (input.paused != null && typeof input.paused !== 'boolean') ||
      (input.paused == null && input.limits == null)
    )
      throw new HttpsError('invalid-argument', 'État IA invalide.');
    const bounds: Record<keyof BrewerAiLimits, [number, number]> = {
      dailyCalls: [1, 1000],
      dailyProCalls: [0, 500],
      dailyTokens: [50000, 5000000],
      questionCalls: [4, 20],
      questionTokens: [50000, 1000000]
    };
    if (
      input.limits != null &&
      (typeof input.limits !== 'object' ||
        Array.isArray(input.limits) ||
        Object.entries(input.limits).some(
          ([key, value]) =>
            !bounds[key as keyof BrewerAiLimits] ||
            !Number.isSafeInteger(value) ||
            Number(value) < bounds[key as keyof BrewerAiLimits][0] ||
            Number(value) > bounds[key as keyof BrewerAiLimits][1]
        ))
    )
      throw new HttpsError('invalid-argument', 'Plafonds IA invalides.');
    const db = getFirestore(),
      ref = db.doc(controlPath);
    await db.runTransaction(async (tx) => {
      const previous = readControls((await tx.get(ref)).data());
      tx.set(ref, {
        paused: input.paused ?? previous.paused,
        limits: { ...previous.limits, ...input.limits },
        updatedAt: Date.now(),
        updatedBy: uid
      });
    });
    return getBrewerAiBudget.run(request);
  }
);

type Generate = (model: string, body: Record<string, unknown>, signal: AbortSignal) => Promise<any>;

/** Reserve BEFORE each paid request. Retries share the same durable question budget.
 * A timeout keeps its reservation, since the provider may have billed the request.
 */
export function budgetedBrewerTransport(generate: Generate, jobId: string, fence: string) {
  const db = getFirestore(),
    jobRef = db.doc(`brewerJobs/${jobId}`);
  const stopped = new AbortController();
  const unsubscribe = db.doc(controlPath).onSnapshot(
    (snapshot) => {
      try {
        if (readControls(snapshot.data()).paused)
          stopped.abort(
            new BrewerBudgetError(
              'ai-paused',
              'Le compagnon est suspendu. Réactive-le dans « Limites IA » pour relancer la question.'
            )
          );
      } catch {
        stopped.abort(unavailable());
      }
    },
    () => stopped.abort(unavailable())
  );
  return {
    close: unsubscribe,
    generate: async (model: string, body: Record<string, unknown>, signal: AbortSignal) => {
      if (stopped.signal.aborted) throw stopped.signal.reason;
      const day = brewerBudgetDay(),
        dailyRef = db.doc(`brewerAiUsage/${day}`),
        callId = randomUUID();
      // Text-only companion requests. UTF-8 bytes provide a conservative input
      // allowance; output includes the model's thinking budget. No extra token API call.
      const requestedOutput = Number((body.generationConfig as any)?.maxOutputTokens ?? 12000);
      if (!Number.isSafeInteger(requestedOutput) || requestedOutput <= 0) throw unavailable();
      const output = Math.min(12000, requestedOutput);
      const requestBody = {
        ...body,
        generationConfig: { ...(body.generationConfig as object), maxOutputTokens: output }
      };
      const reserve = Buffer.byteLength(JSON.stringify(requestBody)) + output;
      const pro = model.includes('pro') ? 1 : 0;
      try {
        await db.runTransaction(async (tx) => {
          const [controls, daily, job] = await Promise.all([
            tx.get(db.doc(controlPath)),
            tx.get(dailyRef),
            tx.get(jobRef)
          ]);
          const { paused, limits } = readControls(controls.data()),
            current = job.data();
          if (paused)
            throw new BrewerBudgetError(
              'ai-paused',
              'Le compagnon est suspendu. Réactive-le dans « Limites IA » pour relancer la question.'
            );
          if (current?.status !== 'running' || current?.fence !== fence)
            throw new HttpsError('aborted', 'Cette analyse a été arrêtée.');
          const usage = { ...emptyUsage(), ...daily.data()?.usage },
            question = { ...emptyUsage(), ...current.budget?.usage };
          if (
            usage.calls + 1 > limits.dailyCalls ||
            usage.proCalls + pro > limits.dailyProCalls ||
            usage.tokens + reserve > limits.dailyTokens
          )
            throw new BrewerBudgetError(
              'ai-daily-limit',
              'Plafond quotidien du compagnon atteint. Aucun nouvel appel Gemini. Consulte « Limites IA » ou réessaie demain.'
            );
          if (
            question.calls + 1 > limits.questionCalls ||
            question.tokens + reserve > limits.questionTokens
          )
            throw new BrewerBudgetError(
              'ai-question-limit',
              'Cette question a atteint sa limite de calcul. L’analyse est arrêtée pour protéger ton quota ; cible un seul ajustement à la fois.'
            );
          tx.set(dailyRef, {
            day,
            usage: {
              calls: usage.calls + 1,
              proCalls: usage.proCalls + pro,
              tokens: usage.tokens + reserve
            },
            updatedAt: Date.now()
          });
          tx.update(jobRef, {
            budget: {
              usage: {
                calls: question.calls + 1,
                proCalls: question.proCalls + pro,
                tokens: question.tokens + reserve
              },
              calls: {
                ...current.budget?.calls,
                [callId]: { day, model, reserved: reserve, status: 'reserved' }
              }
            }
          });
        });
      } catch (e) {
        if (e instanceof BrewerBudgetError || e instanceof HttpsError) throw e;
        throw unavailable();
      }
      const settle = async (
        charged: number,
        status: 'completed' | 'rejected',
        failure?: GeminiApiError
      ) => {
        await db
          .runTransaction(async (tx) => {
            const [daily, job] = await Promise.all([tx.get(dailyRef), tx.get(jobRef)]),
              current = job.data();
            if (current?.budget?.calls?.[callId]?.status !== 'reserved') return;
            tx.update(dailyRef, {
              'usage.tokens': Math.max(0, daily.data()!.usage.tokens - reserve + charged)
            });
            tx.update(jobRef, {
              'budget.usage.tokens': Math.max(0, current.budget.usage.tokens - reserve + charged),
              [`budget.calls.${callId}`]: {
                day,
                model,
                reserved: reserve,
                charged,
                status,
                ...(failure ? { provider: failure.diagnostic() } : {})
              }
            });
          })
          .catch(() => {
            // The full reservation still protects both limits. Never pay for a
            // second generation just because reconciliation could not be saved.
            logger.warn('brewer-budget-reservation-kept', { jobId, callId });
          });
      };
      try {
        const result = await generate(
          model,
          requestBody,
          AbortSignal.any([signal, stopped.signal])
        );
        const reported = result.usageMetadata?.totalTokenCount;
        const charged = Number.isSafeInteger(reported) && reported > 0 ? reported : reserve;
        await settle(charged, 'completed');
        if (stopped.signal.aborted) throw stopped.signal.reason;
        return result;
      } catch (e) {
        // Google explicitly rejected these requests before generation. Keep the
        // attempted-call counter to bound loops, but release the unused tokens.
        // Timeouts, transport failures and 5xx keep their conservative reservation.
        if (e instanceof GeminiApiError && e.rejectedBeforeGeneration) await settle(0, 'rejected', e);
        if (stopped.signal.aborted) throw stopped.signal.reason;
        throw e;
      }
    }
  };
}
