import type { BrewerScenarioCommand, BrewerScenarioReceipt } from '../../functions/src/brewerScenarioStore';
import type { BrewingScenarioRecordResult } from '../domain/brewingScenarioDossier';

/** Online transport of the same domain as brewingScenarioLocalRepository.
 * The local repository remains available offline; this API never fabricates a sync receipt. */
export const BrewingScenarios = {
  async read(scenarioId: string): Promise<(BrewingScenarioRecordResult & { scope: 'serverConfirmed' }) | null> {
    const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
    return (await httpsCallable<{ scenarioId: string }, (BrewingScenarioRecordResult & { scope: 'serverConfirmed' }) | null>(functions, 'readBrewingScenario', { timeout: 65_000 })({ scenarioId })).data;
  },
  async write(command: BrewerScenarioCommand): Promise<{ status: 'applied' | 'duplicate'; receipt: BrewerScenarioReceipt; record: BrewingScenarioRecordResult & { scope: 'serverConfirmed' } }> {
    const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
    return (await httpsCallable<BrewerScenarioCommand, { status: 'applied' | 'duplicate'; receipt: BrewerScenarioReceipt; record: BrewingScenarioRecordResult & { scope: 'serverConfirmed' } }>(functions, 'writeBrewingScenario', { timeout: 65_000 })(command)).data;
  }
};
