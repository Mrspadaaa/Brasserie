import type { BrewerContext } from '../../../functions/src/companionTypes';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingReferenceIdentityV1 } from '../../domain/brewingReference';
import type { BrewingScenarioBaseline } from '../../domain/brewingScenario';
import type { HopV55Workspace } from './contracts';
import {
  resolveHopV55AdoptedContext,
  type HopV55AdoptedContextBindingV1,
  type HopV55AdoptedContextResolutionV1,
} from './adoptedContextResolution';

type WorkspaceJournalInput = Pick<HopV55Workspace, 'id' | 'ownerKey' | 'referenceJournal'>;

export type HopV55AdoptedContextPreparationV1 =
  | {
      sourcePrepared: PreparedBrewingScenarioContext;
      resolution: Extract<HopV55AdoptedContextResolutionV1, { status: 'resolved' }>;
      /** The same sealed binding instance consumed by both downstream preparations. */
      cultureBinding: HopV55AdoptedContextBindingV1;
      /** Exact adopted comparison baseline. The physical `sourcePrepared` remains separate. */
      comparisonBaseline: BrewingScenarioBaseline;
    }
  | {
      sourcePrepared: PreparedBrewingScenarioContext;
      resolution: Exclude<HopV55AdoptedContextResolutionV1, { status: 'resolved' }>;
    };

/**
 * Prepares the actual recipe/batch context once, then resolves the requested NR
 * adoption once. The adopted hypothesis is returned only as a comparison
 * baseline and never passed as a culture override to the physical preparation.
 */
export function prepareHopV55AdoptedContext(input: {
  context: BrewerContext;
  workspace: WorkspaceJournalInput;
  expected: BrewingReferenceIdentityV1 | null;
}): HopV55AdoptedContextPreparationV1 {
  const sourcePrepared = prepareBrewingScenarioContext(input.context);
  const resolution = resolveHopV55AdoptedContext({ workspace: input.workspace, expected: input.expected });
  if (resolution.status !== 'resolved') return { sourcePrepared, resolution };
  return {
    sourcePrepared,
    resolution,
    cultureBinding: resolution.binding,
    comparisonBaseline: structuredClone(resolution.binding.baseline),
  };
}
