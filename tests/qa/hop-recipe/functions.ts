// Local callable adapter. Attempts remain counted; unexpected (especially paid)
// tasks fail immediately, and this module contains no Firebase transport.
export const qaCalls: string[] = [];
export const qaInputs: { name: string; input: any }[] = [];
export const qaLookup = new Map<string, unknown>();
// Browser regression fixture only: these are synthetic values, never a real
// laboratory recommendation or a substitute for the separately recorded live check.
qaLookup.set('Culture QA R-125', { found: true, name: 'Culture QA R-125', lab: 'Micro laboratoire QA',
  strain: 'R-125', form: 'liquide', attenuationPct: 81, tempMinC: 17, tempMaxC: 24,
  flocculation: 'Moyenne', alcoholTolerancePct: 12.5,
  note: 'Fixture synthétique : données de contrôle, aucune recommandation de brassage.',
  source: 'Fixture QA synthétique · https://example.invalid/r-125', technicalFacts: [
    { key: 'attenuation', reported: '77,25–82,75 %', range: { min: 77.25, max: 82.75 }, unit: '%', qualifier: 'range', origin: 'ai', source: 'Fixture QA synthétique', sourceUrl: 'https://example.invalid/r-125', retrievedAt: '2026-09-20', context: 'Moût témoin QA' },
    { key: 'alcoholTolerance', reported: 'Au moins 12,5 %', range: { min: 12.5, max: 12.5 }, unit: '% v/v', qualifier: 'atLeast', origin: 'ai', source: 'Fixture QA synthétique', sourceUrl: 'https://example.invalid/r-125' },
    { key: 'fermentationTime', reported: '12 jours indicatifs', range: { min: 12, max: 12 }, unit: 'd', qualifier: 'reportedPoint', origin: 'ai', source: 'Fixture QA synthétique', context: 'Moût témoin QA ; aucune fin de fermentation garantie.' },
  ] });
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
