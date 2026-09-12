// Local callable adapter. Attempts remain counted; unexpected (especially paid)
// tasks fail immediately, and this module contains no Firebase transport.
export const qaCalls: string[] = [];
export const qaInputs: { name: string; input: any }[] = [];
export const qaLookup = new Map<string, unknown>();
export const getFunctions = () => ({});
export const connectFunctionsEmulator = () => {};
export function httpsCallable(_functions: unknown, name: string) {
  return async (input: any) => {
    qaCalls.push(name);
    qaInputs.push({name,input});
    if (name === 'getBrewerActivity') return { data: { jobs: [] } };
    if (name === 'getBrewerConversation') return { data: { turns: [], generation: 0 } };
    if (name === 'aiTask' && input.task === 'lookupIngredient' && qaLookup.has(input.context?.name))
      return { data: {ok:true, data:qaLookup.get(input.context.name)} };
    throw Error(`Appel distant exclu du banc QA : ${name}`);
  };
}
