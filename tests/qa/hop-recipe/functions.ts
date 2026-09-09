// Local callable adapter. Attempts remain counted; unexpected (especially paid)
// tasks fail immediately, and this module contains no Firebase transport.
export const qaCalls: string[] = [];
export const getFunctions = () => ({});
export const connectFunctionsEmulator = () => {};
export function httpsCallable(_functions: unknown, name: string) {
  return async () => {
    qaCalls.push(name);
    if (name === 'getBrewerActivity') return { data: { jobs: [] } };
    throw Error(`Appel distant exclu du banc QA : ${name}`);
  };
}
