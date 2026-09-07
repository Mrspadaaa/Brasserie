import type {
  BrewerChatInput,
  BrewerScope,
  BrewerTurn,
  BrewerReply
} from '../../functions/src/companionTypes';
import { awaitBrewerReply, type BrewerRequestOptions } from './brewerRecovery';
export type { BrewerChatInput, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
export const BrewerChat = {
  async userKey() {
    const { auth } = await import('./firebase');
    return auth.currentUser?.uid ?? 'disconnected';
  },
  async history(scope: BrewerScope, before?: number): Promise<BrewerTurn[]> {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    const call = httpsCallable<{ scope: BrewerScope; before?: number }, { turns: BrewerTurn[] }>(
      functions,
      'getBrewerConversation'
    );
    return (await call({ scope, ...(before ? { before } : {}) })).data.turns;
  },
  async status(input: BrewerChatInput): Promise<BrewerReply> {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    return (
      await httpsCallable<unknown, BrewerReply>(functions, 'getBrewerConversation', {
        timeout: 15000
      })({ scope: input.scope, operationId: input.operationId })
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
  const code = String((error as { code?: string })?.code ?? '');
  if (/unauthenticated|permission-denied/.test(code))
    return 'Connecte-toi à la brasserie pour discuter avec le compagnon.';
  if (/aborted/.test(code))
    return 'La connexion à la réponse a été interrompue. Réessayer retrouvera le même échange.';
  if (/resource-exhausted/.test(code))
    return 'Gemini est momentanément occupé. Réessaie dans un instant.';
  return 'Le conseil n’a pas pu être reçu ou vérifié. Ta question est conservée ; tu peux réessayer.';
}
