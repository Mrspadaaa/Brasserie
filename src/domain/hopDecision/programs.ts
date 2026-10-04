import type {
  HopAlphaModelParameter,
  HopDecisionMaterial,
  HopDecisionProgram,
  HopProgramAddition,
  HopProgramApplication,
  HopProgramChange,
  HopProgramProposal,
  HopProcessStage,
  HopUse,
} from './types';
import { HOP_DECISION_VERSION } from './types';
import { HOP_FORMS } from '../../../functions/src/hopIndexSchema';
import { hopAlphaModelParameterError } from './modelInputs';

type StockLine = HopProgramProposal['stock'][number];
type ApplyOptions = { allowFutureProcurement?: boolean };
export type HopProgramAvailability = Pick<HopProgramProposal, 'applicability' | 'stock' | 'conditions'>;

const processStages: readonly HopProcessStage[] = ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'];
const uses: readonly HopUse[] = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
const useOrder: Record<HopUse, number> = {
  firstWort: 0,
  boil: 1,
  whirlpool: 2,
  fermentation: 3,
  postFermentation: 4,
};
// A process stage is a coarse boundary. At hotSide the first-wort opportunity
// has passed; at fermenting, all hot-side additions have passed, and so on.
const earliestUse: Record<HopProcessStage, number> = {
  planning: 0,
  hotSide: 1,
  fermenting: 3,
  conditioning: 4,
  packaged: 5,
};

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nonnegativeOrNull = (value: unknown): value is number | null => value === null || (finite(value) && value >= 0);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
function check(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error(reason);
}
const onlyKeys = (value: Record<string, unknown>, allowed: readonly string[], label: string) =>
  check(Object.keys(value).every(key => allowed.includes(key)), `${label} : champ inconnu.`);

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(',')}}`;
}

function equal(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function assertAddition(value: unknown, label = 'Ajout'): asserts value is HopProgramAddition {
  check(object(value), `${label} invalide.`);
  onlyKeys(value, ['id', 'materialId', 'grams', 'use', 'status', 'boilMinutes', 'contactHours', 'temperatureC', 'dayOffset', 'alphaForModel'], label);
  check(text(value.id) && text(value.materialId), `${label} : identifiant ou matière absents.`);
  check(value.grams === null || (finite(value.grams) && value.grams >= 0), `${label} : masse invalide.`);
  check(uses.includes(value.use as HopUse), `${label} : emploi inconnu.`);
  check(value.status === 'planned' || value.status === 'performed', `${label} : état invalide.`);
  if (value.alphaForModel !== undefined) {
    check(object(value.alphaForModel), `${label} : paramètre alpha invalide.`);
    onlyKeys(value.alphaForModel, ['analyte', 'unit', 'kind', 'value', 'range', 'analyticalBasis', 'origin', 'source', 'selectionReason', 'observationRef'], 'Paramètre alpha');
    check(!hopAlphaModelParameterError(value.alphaForModel as unknown as HopAlphaModelParameter), `${label} : paramètre alpha incomplet ou invalide.`);
  }
  for (const field of ['boilMinutes', 'contactHours', 'dayOffset'] as const) {
    check(value[field] === undefined || nonnegativeOrNull(value[field]), `${label} : ${field} invalide.`);
  }
  check(value.temperatureC === undefined || value.temperatureC === null || (finite(value.temperatureC) && value.temperatureC >= -273.15), `${label} : température invalide.`);
}

function assertProgram(value: unknown): asserts value is HopDecisionProgram {
  check(object(value), 'Programme houblon invalide.');
  onlyKeys(value, ['id', 'revision', 'stage', 'volumeL', 'wortGravity', 'additions', 'ibuModelContext'], 'Programme houblon');
  check(text(value.id), 'Programme houblon : identifiant absent.');
  check(Number.isSafeInteger(value.revision) && (value.revision as number) >= 0, 'Programme houblon : révision invalide.');
  check(processStages.includes(value.stage as HopProcessStage), 'Programme houblon : étape inconnue.');
  check(value.volumeL === null || (finite(value.volumeL) && value.volumeL > 0), 'Programme houblon : volume invalide.');
  check(value.wortGravity === null || finite(value.wortGravity), 'Programme houblon : densité invalide.');
  if (value.ibuModelContext !== undefined) {
    const c = value.ibuModelContext;
    check(object(c), 'Contexte IBU invalide.');
    onlyKeys(c, ['variant', 'volumeL', 'volumeReference', 'gravity', 'gravityReference', 'explanation'], 'Contexte IBU');
    check(['tinseth-original', 'tinseth-declared-variant'].includes(c.variant as string), 'Variante IBU inconnue.');
    check(finite(c.volumeL) && c.volumeL > 0 && finite(c.gravity) && c.gravity >= 1, 'Entrées de contexte IBU invalides.');
    check(['finishedBeer', 'fermenter', 'kettleHot', 'kettleCold'].includes(c.volumeReference as string)
      && ['averageBoil', 'atAddition', 'originalGravity'].includes(c.gravityReference as string) && text(c.explanation), 'Rôles ou convention IBU incomplets.');
    check(c.variant !== 'tinseth-original' || c.volumeReference === 'finishedBeer' && c.gravityReference === 'averageBoil', 'Les rôles ne correspondent pas à Tinseth original ; nommer une variante.');
  }
  check(Array.isArray(value.additions), 'Programme houblon : liste des ajouts absente.');
  const ids = new Set<string>();
  for (const addition of value.additions) {
    assertAddition(addition);
    check(!ids.has(addition.id), `Programme houblon : identifiant d’ajout répété « ${addition.id} ».`);
    ids.add(addition.id);
  }
}

function assertMaterials(materials: readonly HopDecisionMaterial[]): Map<string, HopDecisionMaterial> {
  check(Array.isArray(materials), 'Catalogue de matières invalide.');
  const byId = new Map<string, HopDecisionMaterial>();
  for (const input of materials) {
    check(object(input), 'Matière invalide.');
    const material = input as unknown as HopDecisionMaterial;
    check(text(material.id), 'Matière sans identifiant.');
    check(HOP_FORMS.includes(material.form), `Forme invalide pour « ${material.id} ».`);
    check(material.availableGrams === undefined || material.availableGrams === null || (finite(material.availableGrams) && material.availableGrams >= 0), `Stock invalide pour « ${material.id} ».`);
    if (material.product) {
      check(HOP_FORMS.includes(material.product.form), `Forme de produit invalide pour « ${material.id} ».`);
      check(Array.isArray(material.product.supportedUses) && material.product.supportedUses.every(use => uses.includes(use)), `Usages du produit invalides pour « ${material.id} ».`);
      check(material.form === 'unknown' || material.product.form === 'unknown' || material.form === material.product.form,
        `La forme du produit commercial contredit la matière « ${material.id} ».`);
      if (material.product.replacement) {
        check(Array.isArray(material.product.replacement.uses) && material.product.replacement.uses.every(use => uses.includes(use)), `Portée d’emploi invalide pour « ${material.id} ».`);
        const maximum = material.product.replacement.maxDoseGL;
        check(maximum === undefined || (finite(maximum) && maximum >= 0), `Dose maximale fabricant invalide pour « ${material.id} ».`);
      }
    }
    if (material.lot) {
      check(HOP_FORMS.includes(material.lot.form), `Forme de lot invalide pour « ${material.id} ».`);
      check(material.form === 'unknown' || material.lot.form === 'unknown' || material.form === material.lot.form,
        `La forme du lot contredit la matière « ${material.id} ».`);
      check(material.stockItemRef === undefined || material.lot.stockItemRef === undefined || material.stockItemRef === material.lot.stockItemRef,
        `Deux références de stock contradictoires pour « ${material.id} ».`);
    }
    check(material.stockItemRef === undefined || text(material.stockItemRef), `Référence de stock invalide pour « ${material.id} ».`);
    check(!byId.has(material.id), `Matière répétée « ${material.id} ».`);
    byId.set(material.id, material);
  }
  return byId;
}

/** Facts that affect a decision, excluding the separately checked live stock quantity. */
function materialReference(id: string, materials: Map<string, HopDecisionMaterial>): string {
  const material = materials.get(id);
  if (!material) return `${HOP_DECISION_VERSION}:missing:${canonical(id)}`;
  const { id: identity, name, form, variety, lot, product, declaredAnalysis, alphaForModel, stockItemRef } = material;
  return `${HOP_DECISION_VERSION}:material:${canonical({ id: identity, name, form, variety, lot, product, declaredAnalysis, alphaForModel, stockItemRef })}`;
}

function captureMaterialReferences(programs: HopDecisionProgram[], materials: Map<string, HopDecisionMaterial>): Record<string, string> {
  const ids = [...new Set(programs.flatMap(program => program.additions.map(addition => addition.materialId)))].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return Object.fromEntries(ids.map(id => [id, materialReference(id, materials)]));
}

function assertMaterialCanBePlanned(addition: HopProgramAddition, materials: Map<string, HopDecisionMaterial>) {
  const material = materials.get(addition.materialId);
  check(material, `Matière indisponible dans le catalogue : ${addition.materialId}.`);
  check(!material.variety?.archived && !material.lot?.archived, `Matière archivée : ${addition.materialId}.`);
  check(!material.lot || !material.variety || material.lot.varietyId === material.variety.id, `Le lot ${material.lot?.id ?? ''} ne correspond pas à sa variété.`);
  check(!material.product || material.product.supportedUses.includes(addition.use), `Le produit ${material.product?.name ?? ''} ne documente pas l’emploi « ${addition.use} ».`);
}

function assertChangedUseIsStillAhead(addition: HopProgramAddition, stage: HopProcessStage) {
  check(stage !== 'packaged', 'Programme conditionné : aucune action immédiate. Crée un nouveau programme pour une bière future.');
  check(useOrder[addition.use] >= earliestUse[stage], `L’emploi « ${addition.use} » est déjà passé à l’étape « ${stage} ».`);
}

function actionAvailability(addition: HopProgramAddition, materials: Map<string, HopDecisionMaterial>, lines: string[]) {
  if (addition.grams === null) lines.push(`${addition.id} : masse à choisir avant application.`);
  const material = materials.get(addition.materialId);
  if (!material) lines.push(`${addition.id} : matière non résolue.`);
  else if (material.product && !material.product.supportedUses.includes(addition.use)) {
    lines.push(`${addition.id} : emploi non documenté pour le produit commercial choisi.`);
  }
  if (addition.use === 'boil' && addition.boilMinutes == null) lines.push(`${addition.id} : temps restant d’ébullition non précisé.`);
  if (addition.use === 'whirlpool') {
    if (addition.contactHours == null) lines.push(`${addition.id} : durée de whirlpool non précisée.`);
    if (addition.temperatureC == null) lines.push(`${addition.id} : température de whirlpool non précisée.`);
  }
  if (addition.use === 'fermentation' || addition.use === 'postFermentation') {
    if (addition.contactHours == null) lines.push(`${addition.id} : durée de contact non précisée.`);
    if (addition.temperatureC == null) lines.push(`${addition.id} : température de contact non précisée.`);
  }
}

function summarizeRemainingStock(program: HopDecisionProgram, materials: Map<string, HopDecisionMaterial>): { stock: StockLine[]; conditions: string[] } {
  const floor = earliestUse[program.stage];
  const demand = new Map<string, { materialIds: Set<string>; stockItemRef?: string; needed: number | null; materials: Array<HopDecisionMaterial | undefined> }>();
  const conditions: string[] = [];
  for (const addition of program.additions) {
    if (addition.status !== 'planned') continue;
    if (useOrder[addition.use] < floor) {
      conditions.push(`${addition.id} : emploi prévu déjà passé sans confirmation ; exclu du stock restant.`);
      continue;
    }
    const material = materials.get(addition.materialId);
    // Multiple catalogue identities can point at one physical stock item.
    // Documentary samples never share or claim an inventory balance.
    const stockItemRef = material?.lot?.referenceOnly ? undefined : material?.stockItemRef ?? material?.lot?.stockItemRef;
    const groupKey = stockItemRef ? `stock:${stockItemRef}` : `material:${addition.materialId}`;
    const entry = demand.get(groupKey) ?? { materialIds: new Set<string>(), ...(stockItemRef ? { stockItemRef } : {}), needed: 0, materials: [] };
    entry.materialIds.add(addition.materialId);
    entry.materials.push(material);
    entry.needed = entry.needed === null || addition.grams === null ? null : entry.needed + addition.grams;
    demand.set(groupKey, entry);
  }

  const stock = [...demand.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, entry]): StockLine => {
    const materialIds = [...entry.materialIds].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    const materialId = materialIds[0];
    const neededGrams = entry.needed !== null && Number.isFinite(entry.needed) ? entry.needed : null;
    const isReferenceOnly = entry.materials.some(material => material?.lot?.referenceOnly);
    const balanceEvidence = [...entry.materials];
    if (entry.stockItemRef) {
      // A candidate scope is not a licence to discard a known, conflicting balance for the same inventory item.
      // Unused references with no balance add no observation; documentary/archived references are not live stock.
      for (const alias of materials.values()) {
        if (alias.lot?.referenceOnly || alias.lot?.archived || alias.variety?.archived || alias.availableGrams == null) continue;
        if ((alias.stockItemRef ?? alias.lot?.stockItemRef) !== entry.stockItemRef || balanceEvidence.some(row => row?.id === alias.id)) continue;
        balanceEvidence.push(alias);
      }
    }
    const reportedBalances = balanceEvidence.map(material => material?.availableGrams ?? null);
    const knownBalances = reportedBalances.filter((value): value is number => value !== null);
    const conflictingBalances = new Set(knownBalances).size > 1 || knownBalances.length > 0 && knownBalances.length !== reportedBalances.length;
    const availableGrams = knownBalances.length && !conflictingBalances ? knownBalances[0] : null;
    let status: StockLine['status'];
    if (isReferenceOnly) {
      status = 'referenceOnly';
      conditions.push(`${materialId} : lot documentaire uniquement ; il ne prouve pas un stock possédé.`);
    } else if (conflictingBalances) {
      status = 'unknown';
      const references = [...new Set(balanceEvidence.map(material => `${material?.id ?? 'référence absente'}=${material?.availableGrams ?? 'non renseigné'} g`))];
      conditions.push(`${entry.stockItemRef ?? materialId} : matières liées au même stock avec quantités inconnues ou contradictoires (${references.join(' ; ')}).`);
    } else if (neededGrams === 0) status = 'available';
    else if (!entry.materials.every(Boolean) || neededGrams === null || availableGrams === null) {
      status = 'unknown';
      conditions.push(`${entry.stockItemRef ?? materialId} : besoin ou stock restant inconnu.`);
    } else if (availableGrams + Number.EPSILON * Math.max(1, availableGrams, neededGrams) * 4 < neededGrams) {
      status = 'insufficient';
      conditions.push(`${entry.stockItemRef ?? materialId} : ${neededGrams} g prévus, ${availableGrams} g disponibles.`);
    } else status = 'available';
    if (materialIds.length > 1) conditions.push(`${entry.stockItemRef} : besoin cumulé sur ${materialIds.join(', ')}.`);
    return { materialId, ...(materialIds.length > 1 ? { materialIds } : {}), ...(entry.stockItemRef ? { stockItemRef: entry.stockItemRef } : {}),
      neededGrams, availableGrams: isReferenceOnly || conflictingBalances ? null : availableGrams, status };
  });
  return { stock, conditions };
}

interface AvailabilityEvaluation extends HopProgramAvailability {
  stockInsufficient: boolean;
  productDoseExceeded: boolean;
}

function assessProductDoseLimits(program: HopDecisionProgram, materials: Map<string, HopDecisionMaterial>): { conditions: string[]; exceeded: boolean } {
  const conditions: string[] = [];
  const productCopies = new Map<string, Set<string>>();
  const limitedProducts = new Map<string, { product: NonNullable<HopDecisionMaterial['product']>; rows: HopProgramAddition[] }>();
  const floor = earliestUse[program.stage];

  for (const addition of program.additions) {
    const product = materials.get(addition.materialId)?.product;
    if (!product) continue;
    const copies = productCopies.get(product.id) ?? new Set<string>();
    copies.add(canonical(product));
    productCopies.set(product.id, copies);
    if (product.replacement?.maxDoseGL === undefined) continue;
    if (!product.replacement.uses.includes(addition.use)) {
      if (addition.status === 'planned' && useOrder[addition.use] >= floor) {
        conditions.push(`${product.name} : la convention de dose maximale ne couvre pas l’emploi « ${addition.use} » ; aucune limite transférée.`);
      }
      continue;
    }
    const group = limitedProducts.get(product.id) ?? { product, rows: [] };
    group.rows.push(addition);
    limitedProducts.set(product.id, group);
  }

  let exceeded = false;
  for (const [productId, group] of limitedProducts) {
    if ((productCopies.get(productId)?.size ?? 0) > 1) {
      conditions.push(`${group.product.name} : fiches alias contradictoires sur le plafond ou sa portée ; dose cumulée non classée.`);
      continue;
    }
    const rule = group.product.replacement!;
    const maxDoseGL = rule.maxDoseGL!;
    const historical = group.rows.filter(addition => addition.status === 'performed' || useOrder[addition.use] < floor);
    const remaining = group.rows.filter(addition => addition.status === 'planned' && useOrder[addition.use] >= floor);
    const hasUnknownHistoricalMass = historical.some(addition => addition.grams === null);
    const hasUnknownRemainingMass = remaining.some(addition => addition.grams === null);
    const historicalGrams = historical.reduce((sum, addition) => sum + (addition.grams ?? 0), 0);
    const remainingGrams = remaining.reduce((sum, addition) => sum + (addition.grams ?? 0), 0);
    if (program.volumeL === null) {
      if (historicalGrams > 0 || remainingGrams > 0 || hasUnknownHistoricalMass || hasUnknownRemainingMass) {
        conditions.push(`${group.product.name} : volume inconnu ; plafond de ${maxDoseGL} g/L non évaluable.`);
      }
      continue;
    }
    const historicalGL = historicalGrams / program.volumeL;
    const remainingGL = remainingGrams / program.volumeL;
    const pastExceeded = historicalGL > maxDoseGL;
    if (pastExceeded) {
      conditions.push(`${group.product.name} : ${historicalGL} g/L figurent déjà dans les opérations effectuées ou passées ; elles sont conservées.`);
      if (remainingGL > 0) exceeded = true;
    }
    if (historicalGL + remainingGL > maxDoseGL && remainingGL > 0) {
      exceeded = true;
      conditions.push(`${group.product.name} : dose planifiée cumulée (${historicalGL + remainingGL} g/L) au-delà du maximum documenté de ${maxDoseGL} g/L pour ${rule.uses.join(', ')}.`);
    }
    if (hasUnknownHistoricalMass || hasUnknownRemainingMass) {
      conditions.push(`${group.product.name} : une masse comprise dans le plafond cumulé est inconnue.`);
    }
  }
  return { conditions, exceeded };
}

function evaluateProgramAvailability(program: HopDecisionProgram, materials: Map<string, HopDecisionMaterial>): AvailabilityEvaluation {
  const stockResult = summarizeRemainingStock(program, materials);
  const conditions = [...stockResult.conditions];
  for (const addition of program.additions) {
    if (addition.status === 'planned' && useOrder[addition.use] >= earliestUse[program.stage]) actionAvailability(addition, materials, conditions);
  }
  const doseLimits = assessProductDoseLimits(program, materials);
  conditions.push(...doseLimits.conditions);
  const uniqueConditions = [...new Set(conditions)];
  const stockInsufficient = stockResult.stock.some(item => item.status === 'insufficient');
  const applicability: HopProgramAvailability['applicability'] = stockInsufficient || doseLimits.exceeded ? 'unavailable'
    : stockResult.stock.some(item => item.status === 'unknown' || item.status === 'referenceOnly') || uniqueConditions.length ? 'conditional' : 'available';
  return { applicability, stock: stockResult.stock, conditions: uniqueConditions, stockInsufficient, productDoseExceeded: doseLimits.exceeded };
}

/** Read-only assessment. Unlike preview it accepts packaged programs and emits no change proposal. */
export function inspectHopProgramAvailability(program: HopDecisionProgram, materials: HopDecisionMaterial[]): HopProgramAvailability {
  assertProgram(program);
  return evaluateProgramAvailability(program, assertMaterials(materials));
}

/** Stable local content reference; useful for staleness checks, not authorization. */
export function programFingerprint(program: HopDecisionProgram): string {
  assertProgram(program);
  return `${HOP_DECISION_VERSION}:${canonical(program)}`;
}

function applyChangesToProgram(program: HopDecisionProgram, changes: HopProgramChange[]): { program: HopDecisionProgram; changed: HopProgramAddition[] } {
  assertProgram(program);
  check(program.stage !== 'packaged', 'Programme conditionné : aucune action immédiate. Crée un nouveau programme pour une bière future.');
  check(Array.isArray(changes) && changes.length > 0, 'Choisis au moins un changement de programme.');
  const next = clone(program);
  const targets = new Set<string>();
  const originalIds = new Set(program.additions.map(addition => addition.id));
  const introducedIds = new Set<string>();
  const changed: HopProgramAddition[] = [];

  for (const change of changes) {
    check(object(change), 'Changement de programme invalide.');
    if (change.kind === 'append') {
      onlyKeys(change, ['kind', 'addition'], 'Ajout proposé');
      assertAddition(change.addition, 'Ajout proposé');
      check(change.addition.status === 'planned', 'Un ajout proposé doit rester prévu, jamais déjà effectué.');
      check(!originalIds.has(change.addition.id) && !introducedIds.has(change.addition.id), `Identifiant d’ajout déjà utilisé : ${change.addition.id}.`);
      introducedIds.add(change.addition.id);
      changed.push(change.addition);
      next.additions.push(clone(change.addition));
      continue;
    }
    check(change.kind === 'replace' || change.kind === 'remove', 'Type de changement inconnu.');
    onlyKeys(change, change.kind === 'replace' ? ['kind', 'additionId', 'additions'] : ['kind', 'additionId'], 'Changement de programme');
    check(text(change.additionId) && !targets.has(change.additionId), `Ajout ciblé plusieurs fois : ${change.additionId}.`);
    targets.add(change.additionId);
    const index = next.additions.findIndex(addition => addition.id === change.additionId);
    check(index >= 0, `Ajout introuvable : ${change.additionId}.`);
    check(next.additions[index].status === 'planned', `L’ajout ${change.additionId} est effectué et ne peut être remplacé ou supprimé.`);
    if (change.kind === 'remove') {
      next.additions.splice(index, 1);
      continue;
    }
    check(Array.isArray(change.additions) && change.additions.length > 0, 'Un remplacement doit contenir au moins un ajout ; utilise remove pour retirer la ligne.');
    for (const addition of change.additions) {
      assertAddition(addition, 'Remplacement proposé');
      check(addition.status === 'planned', 'Un remplacement proposé doit rester prévu, jamais déjà effectué.');
      check(!introducedIds.has(addition.id), `Identifiant proposé plusieurs fois : ${addition.id}.`);
      check(!originalIds.has(addition.id) || addition.id === change.additionId, `Identifiant d’ajout déjà utilisé : ${addition.id}.`);
      introducedIds.add(addition.id);
      changed.push(addition);
    }
    next.additions.splice(index, 1, ...change.additions.map(clone));
  }

  check(new Set(next.additions.map(addition => addition.id)).size === next.additions.length, 'Identifiants d’ajout répétés dans le programme proposé.');
  for (const addition of changed) {
    assertChangedUseIsStillAhead(addition, program.stage);
    check(addition.grams !== null, `Masse inconnue pour ${addition.id} : choisis une dose avant de préparer ce programme.`);
  }
  next.revision = program.revision + 1;
  return { program: next, changed };
}

/** Structural transformation only, used before qualifying the proposed program's material dependencies. */
export function deriveHopProgramDraft(program: HopDecisionProgram, changes: HopProgramChange[]): HopDecisionProgram {
  return applyChangesToProgram(program, changes).program;
}

/** Preview only: never edits the input or writes stock. */
export function previewHopProgramChanges(
  program: HopDecisionProgram,
  changes: HopProgramChange[],
  materials: HopDecisionMaterial[],
): HopProgramProposal {
  const { program: next, changed } = applyChangesToProgram(program, changes);
  const materialById = assertMaterials(materials);
  for (const addition of changed) {
    assertMaterialCanBePlanned(addition, materialById);
  }
  const availability = evaluateProgramAvailability(next, materialById);
  return {
    version: HOP_DECISION_VERSION,
    baseline: programFingerprint(program),
    program: next,
    changes: clone(changes),
    materialReferences: captureMaterialReferences([program, next], materialById),
    applicability: availability.applicability,
    stock: availability.stock,
    conditions: availability.conditions,
  };
}

function assertProposal(value: unknown): asserts value is HopProgramProposal {
  check(object(value), 'Proposition de programme invalide.');
  onlyKeys(value, ['version', 'baseline', 'program', 'changes', 'materialReferences', 'applicability', 'stock', 'conditions'], 'Proposition de programme');
  check(value.version === HOP_DECISION_VERSION && text(value.baseline), 'Version ou référence de base de la proposition invalide.');
  assertProgram(value.program);
  check(Array.isArray(value.changes) && object(value.materialReferences) && Array.isArray(value.stock) && Array.isArray(value.conditions), 'Détails de proposition absents.');
  check(Object.entries(value.materialReferences).every(([id, reference]) => text(id) && text(reference)), 'Références de matière invalides.');
  check(['available', 'conditional', 'unavailable'].includes(value.applicability as string), 'Applicabilité inconnue.');
  check(value.conditions.every(text), 'Condition de proposition invalide.');
  for (const line of value.stock) {
    check(object(line), 'Besoin de stock invalide.');
    onlyKeys(line, ['materialId', 'materialIds', 'stockItemRef', 'neededGrams', 'availableGrams', 'status'], 'Besoin de stock');
    check(text(line.materialId) && nonnegativeOrNull(line.neededGrams) && nonnegativeOrNull(line.availableGrams), 'Quantité de stock invalide.');
    check(line.materialIds === undefined || Array.isArray(line.materialIds) && line.materialIds.length > 1 && line.materialIds.every(text), 'Identités de matière regroupées invalides.');
    check(line.stockItemRef === undefined || text(line.stockItemRef), 'Référence de stock invalide.');
    check(['available', 'unknown', 'insufficient', 'referenceOnly'].includes(line.status as string), 'État de stock inconnu.');
  }
}

function verifyProposal(current: HopDecisionProgram, proposal: HopProgramProposal, materials: HopDecisionMaterial[]): HopProgramProposal {
  assertProgram(current);
  assertProposal(proposal);
  check(proposal.baseline === programFingerprint(current), 'Le programme a changé depuis l’aperçu ; recalcule la proposition.');
  const expected = previewHopProgramChanges(current, proposal.changes, materials);
  check(equal(proposal, expected), 'La proposition ne correspond plus à l’aperçu calculé ; recalcule-la.');
  return expected;
}

/** Applies an unchanged preview to a local plan. No database or inventory write occurs. */
export function applyHopProgramProposal(
  current: HopDecisionProgram,
  proposal: HopProgramProposal,
  materials: HopDecisionMaterial[],
  options: ApplyOptions = {},
): HopProgramApplication {
  const verified = verifyProposal(current, proposal, materials);
  if (verified.applicability === 'unavailable') {
    const evaluation = evaluateProgramAvailability(verified.program, assertMaterials(materials));
    check(!evaluation.productDoseExceeded, 'Plafond fabricant dépassé : le programme ne peut pas être appliqué avec cette dose cumulée.');
    check(options.allowFutureProcurement === true && current.stage === 'planning' && evaluation.stockInsufficient,
      'Stock insuffisant : le programme ne peut pas être appliqué à cette étape.');
  }
  check(options.allowFutureProcurement === undefined || typeof options.allowFutureProcurement === 'boolean', 'Option d’approvisionnement futur invalide.');
  return { version: HOP_DECISION_VERSION, before: clone(current), after: clone(verified.program), proposal: clone(verified) };
}

/** Shared integrity checks for reverting the last local plan, independently of its current stock feasibility. */
function verifiedPreviousProgram(
  current: HopDecisionProgram,
  application: HopProgramApplication,
  materials: HopDecisionMaterial[],
): HopDecisionProgram {
  assertProgram(current);
  check(object(application), 'Application à annuler invalide.');
  onlyKeys(application, ['version', 'before', 'after', 'proposal'], 'Application');
  check(application.version === HOP_DECISION_VERSION, 'Version de l’application inconnue.');
  assertProgram(application.before);
  assertProgram(application.after);
  check(programFingerprint(current) === programFingerprint(application.after), 'Le programme a changé depuis l’application ; annulation refusée.');
  assertProposal(application.proposal);
  check(application.proposal.baseline === programFingerprint(application.before) && equal(application.proposal.program, application.after),
    'L’application ne correspond pas à son aperçu ; annulation refusée.');
  const currentReferences = captureMaterialReferences([application.before, application.after], assertMaterials(materials));
  check(equal(application.proposal.materialReferences, currentReferences), 'Les faits ou l’identité d’une matière ont changé depuis l’aperçu ; annulation refusée.');
  const replayed = applyChangesToProgram(application.before, application.proposal.changes).program;
  check(equal(replayed, application.after), 'Les changements de l’aperçu ne produisent pas l’état appliqué.');
  const beforePerformed = application.before.additions.filter(addition => addition.status === 'performed');
  const afterPerformed = application.after.additions.filter(addition => addition.status === 'performed');
  check(equal(beforePerformed, afterPerformed), 'Une opération effectuée a changé ; annulation refusée.');
  const restored = clone(application.before);
  restored.revision = current.revision + 1;
  return restored;
}

/** Undo only the exact last application into a stock-feasible programme. */
export function undoHopProgramApplication(
  current: HopDecisionProgram,
  application: HopProgramApplication,
  materials: HopDecisionMaterial[],
): HopDecisionProgram {
  const restored = verifiedPreviousProgram(current, application, materials);
  const restoredStock = summarizeRemainingStock(restored, assertMaterials(materials));
  check(!restoredStock.stock.some(line => line.status === 'insufficient'), 'Stock insuffisant pour restaurer le programme précédent.');
  return restored;
}

/** Restore a local draft, including the future plan of a batch already underway. No operational action is replayed. */
export function restoreHopProgramDraft(
  current: HopDecisionProgram,
  application: HopProgramApplication,
  materials: HopDecisionMaterial[],
) {
  const program = verifiedPreviousProgram(current, application, materials);
  return { format: 'hop-program-draft-restoration-v1' as const, scope: 'localDraft' as const, program,
    feasibility: inspectHopProgramAvailability(program, materials), restoredFrom: programFingerprint(current),
    effects: { writesRecipe: false as const, writesBrewDay: false as const, writesStock: false as const },
    conditions: ['Le brouillon antérieur est restauré avec sa faisabilité actuelle, sans réservation ni opération de brassage.',
      'Le stade réel reste inchangé. Une nouvelle application doit vérifier de nouveau l’état opérationnel et les matières.'] };
}
