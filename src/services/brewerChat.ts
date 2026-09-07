import type {
  BrewerChatInput,
  BrewerScope,
  BrewerTurn,
  BrewerReply
} from '../../functions/src/companionTypes';
import { awaitBrewerReply, type BrewerRequestOptions } from './brewerRecovery';
export type { BrewerChatInput, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
export type BrewerHistory = BrewerTurn[] & { generation?: number };
export const BrewerChat = {
  async userKey() {
    const { auth } = await import('./firebase');
    return auth.currentUser?.uid ?? 'disconnected';
  },
  async history(scope: BrewerScope, before?: number): Promise<BrewerHistory> {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    const call = httpsCallable<
      { scope: BrewerScope; before?: number },
      { turns: BrewerTurn[]; generation: number }
    >(functions, 'getBrewerConversation');
    const result = (await call({ scope, ...(before ? { before } : {}) })).data;
    return Object.assign(result.turns, { generation: result.generation ?? 0 });
  },
  async status(input: BrewerChatInput): Promise<BrewerReply> {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    return (
      await httpsCallable<unknown, BrewerReply>(functions, 'getBrewerConversation', {
        timeout: 15000
      })({ scope: input.scope, operationId: input.operationId, generation: input.generation ?? 0 })
    ).data;
  },
  async reset(scope: BrewerScope, generation: number, operationId: string) {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    return (
      await httpsCallable<unknown, { generation: number }>(functions, 'resetBrewerConversation', {
        timeout: 65000
      })({ scope, generation, operationId })
    ).data;
  },
  async apply(
    scope: BrewerScope,
    turnId: string,
    selectedIds: string[],
    decision: 'apply' | 'dismiss',
    draft?: unknown
  ) {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    const { StorageService } = await import('./storage');
    return (
      await httpsCallable<unknown, { turn: BrewerTurn; value?: any }>(
        functions,
        'applyBrewerProposal'
      )({
        scope,
        turnId,
        selectedIds,
        decision,
        confirmed: true,
        actor: StorageService.getCurrentUser(),
        ...(draft ? { draft } : {})
      })
    ).data;
  },
  async ask(input: BrewerChatInput, options?: BrewerRequestOptions): Promise<BrewerTurn> {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    const send = httpsCallable<BrewerChatInput, BrewerReply>(functions, 'askBrewer', {
      timeout: 300000
    });
    return awaitBrewerReply(
      input,
      {
        send: async (data) => (await send(data)).data,
        status: (data) => BrewerChat.status(data)
      },
      options
    );
  }
};
export function brewerChatError(error: unknown) {
  const reason = (error as { details?: { reason?: string } })?.details?.reason;
  if (reason === 'chat-reset')
    return 'La conversation a été réinitialisée. Rouvre le compagnon pour repartir à zéro.';
  if (reason === 'proposal-stale')
    return (error as Error).message || 'Les champs ont changé. Demande une proposition actualisée.';
  if ((error as { details?: { reason?: string } })?.details?.reason === 'pro-unavailable')
    return 'Gemini 3.1 Pro est momentanément indisponible. Ta question est conservée ; réessaie dans un instant.';
  const code = String((error as { code?: string })?.code ?? '');
  if (/unauthenticated|permission-denied/.test(code))
    return 'Connecte-toi à la brasserie pour discuter avec le compagnon.';
  if (/aborted/.test(code))
    return 'La connexion à la réponse a été interrompue. Réessayer retrouvera le même échange.';
  if (/resource-exhausted/.test(code))
    return 'Gemini est momentanément occupé. Réessaie dans un instant.';
  return 'Le conseil n’a pas pu être reçu ou vérifié. Ta question est conservée ; tu peux réessayer.';
}
