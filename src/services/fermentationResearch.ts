/** Loaded only on request; Firebase sends the signed-in user's ID token. */
export async function loadFermentationResearch(): Promise<string> {
  const [{ httpsCallable }, { functions }] = await Promise.all([
    import('firebase/functions'), import('./firebase')
  ]);
  const result = await httpsCallable<void, { markdown: string }>(
    functions, 'getFermentationResearch', { timeout: 25000 }
  )();
  if (typeof result.data?.markdown !== 'string') throw new Error('Rapport indisponible.');
  return result.data.markdown;
}
