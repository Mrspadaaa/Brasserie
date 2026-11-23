import {
  assertBrewingScenarioRequest,
  buildBrewingScenarioRequest,
  brewingScenarioCurrentReference,
  type BrewingScenarioAssumption,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioRequest,
} from '../../domain/brewingScenario';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55Intent } from './contracts';

type RequestFieldState = { present: boolean; value?: unknown };
type BranchPathChoice = { newChoice: boolean; selected: BrewingScenarioAssumption[] };

const clone = <T,>(value: T): T => structuredClone(value);
const stableSuffix = (value: unknown): string => hopAdviceContentReference('hop-v55-scenario-adapter-id-v1', value).slice(-24);
const same = (left: unknown, right: unknown): boolean =>
  hopAdviceContentReference('hop-v55-scenario-adapter-value-v1', left) === hopAdviceContentReference('hop-v55-scenario-adapter-value-v1', right);
const scopedAssumptionId = (sourceId: string, branchId: string) => `scoped-${stableSuffix({ sourceId, branchId })}`;
const programReasonId = (branchId: string) => `ui-program-${stableSuffix({ branchId })}`;
const scopeablePath = (path: string) => path.startsWith('recipe.') || path.startsWith('program.');

function selectedAtPath(branch: BrewingScenarioBranchRequest, path: string): BrewingScenarioAssumption[] {
  return branch.assumptions.filter(row => row.path === path && row.status === 'selected');
}

function own(value: object | undefined, key: string): boolean {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}

function branchValueAtPath(branch: BrewingScenarioBranchRequest, path: string): RequestFieldState {
  if (path === 'program.changes') return branch.programChanges?.length
    ? { present: true, value: branch.programChanges } : { present: false };
  const [domain, ...segments] = path.split('.');
  if (domain === 'recipe' && segments.length === 1) {
    const field = segments[0] as keyof NonNullable<BrewingScenarioBranchRequest['inputOverrides']>;
    if (own(branch.inputOverrides, field)) return { present: true, value: branch.inputOverrides![field] };
    if (branch.input && own(branch.input, field)) return { present: true, value: branch.input[field as keyof typeof branch.input] };
    return { present: false };
  }
  if (domain === 'program' && segments.length === 1) {
    const field = segments[0] as keyof NonNullable<BrewingScenarioBranchRequest['programOverrides']>;
    if (own(branch.programOverrides, field)) return { present: true, value: branch.programOverrides![field] };
    return { present: false };
  }
  return { present: false };
}

function parseAssumptionJson(value: unknown): { parsed: boolean; value?: unknown } {
  if (typeof value !== 'string') return { parsed: false };
  try { return { parsed: true, value: JSON.parse(value) }; }
  catch { return { parsed: false }; }
}

/** Only an exact point (or degenerate exact range) is an inherited choice. A
 * broader interval does not pick the branch's concrete value for the user. */
function exactValueMatch(assumption: BrewingScenarioAssumption, value: unknown): boolean {
  if (same(assumption.value, value)) return true;
  const parsed = parseAssumptionJson(assumption.value);
  if (parsed.parsed && same(parsed.value, value)) return true;
  return typeof value === 'number' && assumption.range?.min === value && assumption.range.max === value;
}

function choiceAtPath(branch: BrewingScenarioBranchRequest, path: string, source: BrewingScenarioAssumption): BranchPathChoice {
  const selected = selectedAtPath(branch, path);
  if (selected.length > 1) throw new Error(`La branche ${branch.id} porte plusieurs choix sélectionnés pour ${path}; la fusion est ambiguë.`);
  if (path === 'program.changes' && branch.programChanges?.length) return { newChoice: true, selected };

  const value = branchValueAtPath(branch, path);
  if (value.present) {
    if (selected.length) {
      if (!exactValueMatch(selected[0], value.value)) {
        throw new Error(`La branche ${branch.id} modifie ${path} sans hypothèse sélectionnée qui couvre exactement sa valeur.`);
      }
      return { newChoice: !exactValueMatch(source, value.value), selected };
    }
    if (exactValueMatch(source, value.value)) return { newChoice: false, selected };
    throw new Error(`La branche ${branch.id} change ${path}, mais aucune hypothèse locale explicite ne permet de remplacer la valeur globale.`);
  }

  if (!selected.length) return { newChoice: false, selected };
  return { newChoice: !exactValueMatch(selected[0], source.value), selected };
}

function hasNestedAssumptionReference(value: unknown, id: string): boolean {
  if (Array.isArray(value)) return value.some(row => hasNestedAssumptionReference(row, id));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => key === 'assumptionId' && child === id
    || hasNestedAssumptionReference(child, id));
}

function remapNestedAssumptionReferences<T>(value: T, mapping: Map<string, string>): T {
  if (Array.isArray(value)) return value.map(row => remapNestedAssumptionReferences(row, mapping)) as T;
  if (!value || typeof value !== 'object') return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] = key === 'assumptionId' && typeof child === 'string' && mapping.has(child)
      ? mapping.get(child) : remapNestedAssumptionReferences(child, mapping);
  }
  return result as T;
}

function replaceBranchAssumption(branch: BrewingScenarioBranchRequest, assumption: BrewingScenarioAssumption): void {
  const existing = branch.assumptions.find(row => row.id === assumption.id);
  if (existing && existing.path !== assumption.path) throw new Error(`L’identifiant d’hypothèse ${assumption.id} est déjà lié à un autre chemin.`);
  branch.assumptions = branch.assumptions.filter(row => row.id !== assumption.id);
  branch.assumptions.push(clone(assumption));
}

function addProgramReason(branch: BrewingScenarioBranchRequest, intent: HopV55Intent): void {
  if (!branch.programChanges?.length || branch.assumptions.some(row => row.status === 'selected' && row.path === 'program.changes')) return;
  const id = programReasonId(branch.id);
  const existing = branch.assumptions.find(row => row.id === id);
  if (existing && existing.path !== 'program.changes') throw new Error(`L’identifiant ${id} est déjà utilisé par une hypothèse non liée au programme.`);
  const explanation = intent.question
    ? `${branch.label} · Demande conservée : ${intent.question}`
    : `${branch.label} · Réglage explicite dans l’éditeur, avant toute application.`;
  replaceBranchAssumption(branch, existing ? { ...existing, status: 'selected' } : {
    id, path: 'program.changes', label: 'Programme choisi pour la comparaison', status: 'selected', origin: 'userHypothesis',
    value: branch.label, explanation,
  });
}

function reconcileRootAssumptions(
  rootAssumptions: BrewingScenarioAssumption[],
  branches: BrewingScenarioBranchRequest[],
): BrewingScenarioAssumption[] {
  const root = clone(rootAssumptions);
  const scoped = root.filter(row => row.status === 'selected' && scopeablePath(row.path));
  const byPath = new Map<string, BrewingScenarioAssumption[]>();
  for (const assumption of scoped) byPath.set(assumption.path, [...(byPath.get(assumption.path) ?? []), assumption]);
  for (const [path, assumptions] of byPath) {
    if (assumptions.length > 1 && branches.some(branch => branchValueAtPath(branch, path).present || selectedAtPath(branch, path).length)) {
      throw new Error(`Plusieurs hypothèses globales sélectionnées se disputent ${path}; résous ce conflit avant le scénario.`);
    }
  }

  for (const source of scoped) {
    const choices = branches.map(branch => ({ branch, choice: choiceAtPath(branch, source.path, source) }));
    const anyNewChoice = choices.some(row => row.choice.newChoice);
    if (!anyNewChoice) {
      for (const { branch, choice } of choices) {
        if (!choice.selected.length) continue;
        const local = choice.selected[0];
        branch.assumptions = branch.assumptions.map(row => row.id === local.id ? { ...row, status: 'proposed' } : row);
        Object.assign(branch, remapNestedAssumptionReferences(branch, new Map([[local.id, source.id]])));
      }
      continue;
    }

    const rootSource = root.find(row => row.id === source.id);
    if (rootSource) rootSource.status = 'proposed';
    for (const { branch, choice } of choices) {
      const cloneId = scopedAssumptionId(source.id, branch.id);
      const nestedUsesSource = hasNestedAssumptionReference(branch, source.id);
      if (choice.newChoice && nestedUsesSource) {
        throw new Error(`La branche ${branch.id} choisit une nouvelle valeur pour ${source.path}, mais une opération imbriquée référence encore l’hypothèse globale remplacée.`);
      }

      const aliases = new Map<string, string>();
      if (!choice.newChoice) {
        for (const local of choice.selected) {
          branch.assumptions = branch.assumptions.map(row => row.id === local.id ? { ...row, status: 'proposed' } : row);
          aliases.set(local.id, cloneId);
        }
        aliases.set(source.id, cloneId);
      }
      const scopedAssumption: BrewingScenarioAssumption = { ...clone(source), id: cloneId,
        status: choice.newChoice ? 'proposed' : 'selected' };
      replaceBranchAssumption(branch, scopedAssumption);
      if (aliases.size) {
        const remapped = remapNestedAssumptionReferences(branch, aliases);
        branch.assumptions = remapped.assumptions;
        branch.programChanges = remapped.programChanges;
        branch.modelOverrides = remapped.modelOverrides;
        branch.analogies = remapped.analogies;
        branch.biologicalContext = remapped.biologicalContext;
        branch.biologicalInputs = remapped.biologicalInputs;
        branch.materials = remapped.materials;
      }
    }
  }
  return root;
}

/** Translate explicit editor state, preserve global explanations, and validate
 * only after the final branch, reason, targets, and scoped assumptions coexist. */
export function createHopV55ScenarioRequest({ prepared, scenarioId, revision, branches, intent, reference, target, assumptions }: {
  prepared: PreparedBrewingScenarioContext; scenarioId: string; revision: number;
  branches: BrewingScenarioBranchRequest[]; intent: HopV55Intent; reference?: BrewingScenarioRequest['baseline'];
  target?: BrewingScenarioRequest['target']; assumptions?: BrewingScenarioRequest['assumptions'];
}): BrewingScenarioRequest {
  const current = prepared.runtime.current;
  if (!current && reference?.kind !== 'hypothetical') throw Error('Déclare une référence hypothétique avant le calcul. L’absence de programme ne signifie pas zéro houblon.');
  const sourceAssumptions = clone(assumptions ?? []);
  const request: BrewingScenarioRequest = current ? buildBrewingScenarioRequest({ scenarioId, revision,
    baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
      contextReference: brewingScenarioCurrentReference(current) }, assumptions: sourceAssumptions, ...(target ? { target } : {}) }) : {
      version: 'brewing-scenario-v1' as const, scenarioId, revision,
      baseline: clone(reference!), assumptions: sourceAssumptions, branches: [], ...(target ? { target: clone(target) } : {}),
    };
  const nextBranches = branches.map(branch => clone(branch));
  for (const branch of nextBranches) addProgramReason(branch, intent);
  request.assumptions = reconcileRootAssumptions(request.assumptions, nextBranches);
  request.branches = nextBranches;
  if (target !== undefined) request.target = clone(target);
  assertBrewingScenarioRequest(request);
  return request;
}
