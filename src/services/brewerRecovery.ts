import type { BrewerChatInput, BrewerReply, BrewerTurn } from '../../functions/src/companionTypes';

export type BrewerProgress = 'answering' | 'waiting' | 'recovering';
export interface BrewerRequestOptions {
  signal?: AbortSignal;
  onProgress?: (progress: BrewerProgress) => void;
  pollMs?: number;
  maxWaitMs?: number;
}
const terminal = (error: unknown) =>
  /unauthenticated|permission-denied|invalid-argument|already-exists|not-found/.test(
    String((error as { code?: string })?.code)
  );
function pause(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Observation interrompue', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

/** A transport interruption never creates another operation. Poll the durable receipt while
 * the original request runs, join retries, and queue a follow-up behind the preceding answer. */
export async function awaitBrewerReply(
  input: BrewerChatInput,
  transport: {
    send: (input: BrewerChatInput) => Promise<BrewerReply>;
    status: (input: BrewerChatInput) => Promise<BrewerReply>;
  },
  options: BrewerRequestOptions = {}
): Promise<BrewerTurn> {
  const deadline = Date.now() + (options.maxWaitMs ?? 330000);
  let outcome: { reply?: BrewerReply; error?: unknown } | undefined;
  let sending: Promise<void>;
  let dispatches = 0,
    statusFailures = 0;
  const dispatch = () => {
    dispatches++;
    outcome = undefined;
    options.onProgress?.('answering');
    sending = transport.send(input).then(
      (reply) => {
        outcome = { reply };
      },
      (error) => {
        outcome = { error };
      }
    );
  };
  dispatch();
  while (Date.now() < deadline) {
    options.signal?.throwIfAborted();
    if (!outcome) await Promise.race([sending!, pause(options.pollMs ?? 2500, options.signal)]);
    else await pause(options.pollMs ?? 2500, options.signal);
    options.signal?.throwIfAborted();
    if (outcome?.reply?.turn) return outcome.reply.turn;
    if (outcome?.error && terminal(outcome.error)) throw outcome.error;
    let state: BrewerReply;
    try {
      state = await transport.status(input);
      statusFailures = 0;
    } catch (error) {
      if (terminal(error) || ++statusFailures >= 3) throw error;
      options.onProgress?.('recovering');
      continue;
    }
    if (state.turn) return state.turn;
    if (state.pending) {
      options.onProgress?.(
        state.pending.operationId === input.operationId ? 'answering' : 'waiting'
      );
      continue;
    }
    // The server is idle: a queued question (or an expired lease) may now acquire its own lease.
    if (outcome?.reply?.pending && dispatches < 3) {
      dispatch();
      continue;
    }
    if (outcome?.error) throw outcome.error;
    if (outcome) throw new Error('Réponse absente du serveur.');
  }
  throw new Error('Délai de récupération dépassé. La question reste conservée.');
}
