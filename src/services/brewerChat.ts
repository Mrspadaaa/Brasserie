import type { BrewerChatInput, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
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
  async ask(input: BrewerChatInput): Promise<BrewerTurn> {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('./firebase')
    ]);
    return (
      await httpsCallable<BrewerChatInput, { turn: BrewerTurn }>(functions, 'askBrewer', {
        timeout: 300000
      })(input)
    ).data.turn;
  }
};
export function brewerChatError(error: unknown) {
  const code = String((error as { code?: string })?.code ?? '');
  if (/unauthenticated|permission-denied/.test(code))
    return 'Connecte-toi à la brasserie pour discuter avec le compagnon.';
  if (/aborted/.test(code))
    return 'Une réponse est encore en cours. Réessaie dans quelques instants pour la retrouver.';
  if (/resource-exhausted/.test(code))
    return 'Gemini est momentanément occupé. Réessaie dans un instant.';
  return 'Le conseil n’a pas pu être reçu ou vérifié. Ta question est conservée ; tu peux réessayer.';
}
