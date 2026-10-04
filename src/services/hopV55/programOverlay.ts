import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { brewingScenarioCurrentReference } from '../../domain/brewingScenario';
import { previewHopProgramChanges } from '../../domain/hopDecision/programs';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { HopDecisionProgram, HopProgramChange } from '../../domain/hopDecision/types';
import type { HopV55ProgramCopy } from './programCopy';

/** Rebase an explicitly edited local future plan onto its unchanged physical source. */
export function rebaseHopV55ProgramCopy(prepared: PreparedBrewingScenarioContext, copy: HopV55ProgramCopy,
  changes: HopProgramChange[]): HopProgramChange[] {
  const current = prepared.runtime.current;
  if (!current?.program || brewingScenarioCurrentReference(current) !== copy.contextReference) {
    throw Error('Le journal ou le stock a changé depuis cette copie future. Relis la source et prépare un nouvel aperçu ; la copie historique est conservée.');
  }
  const after = previewHopProgramChanges(copy.programAfter, changes, prepared.runtime.materials).program;
  return programDelta(current.program, after);
}

export function programDelta(before: HopDecisionProgram, after: HopDecisionProgram): HopProgramChange[] {
  if (before.id !== after.id || before.stage !== after.stage || before.volumeL !== after.volumeL) throw Error('Une correction de programme futur ne change pas l’identité, le stade ou le volume physique.');
  const result: HopProgramChange[] = [];
  for (const row of before.additions) {
    const next = after.additions.find(item => item.id === row.id);
    if (row.status === 'performed' && (!next || hopDecisionReference(row) !== hopDecisionReference(next))) throw Error('Une opération effectuée ne peut pas être réécrite dans une correction future.');
    if (!next) result.push({ kind: 'remove', additionId: row.id });
    else if (hopDecisionReference(row) !== hopDecisionReference(next)) result.push({ kind: 'replace', additionId: row.id, additions: [structuredClone(next)] });
  }
  for (const row of after.additions) if (!before.additions.some(item => item.id === row.id)) {
    if (row.status !== 'planned') throw Error('Une copie future ne crée aucun fait effectué.');
    result.push({ kind: 'append', addition: structuredClone(row) });
  }
  if (!result.length) throw Error('Le programme reste identique à la source ; aucune correction à comparer.');
  return result;
}
