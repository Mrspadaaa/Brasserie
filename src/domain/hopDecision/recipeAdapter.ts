import type { HopIngredient } from '../../types';
import { hopDecisionReference, numericBounds, readHopAnalysis } from './measurements';
import { readHopAlphaForAddition } from './modelInputs';
import { applyHopProgramProposal, programFingerprint } from './programs';
import { HOP_DECISION_VERSION, type HopAlphaModelParameter, type HopDecisionMaterial, type HopDecisionProgram, type HopIbuModelContext, type HopProgramApplication, type HopProcessStage, type HopUse } from './types';

export interface HopRecipeLike { id: string; volumeL: number; hops: HopIngredient[]; hopPredictionIds?: string[]; hopTrialId?: string }
export interface HopRecipeBinding {
  version: typeof HOP_DECISION_VERSION;
  recipeReference: string;
  program: HopDecisionProgram;
  materials: HopDecisionMaterial[];
  originalHops: Record<string, HopIngredient>;
  /** A phase must be supplied explicitly where the old recipe does not say it. */
  assumptions: string[];
}

export interface HopRecipeFutureProcurementChoice {
  /** Identity of this declaration, scoped to the exact programme in the preview. */
  id: string;
  reason: string;
}

export interface HopRecipeDraftOptions {
  futureProcurement?: HopRecipeFutureProcurementChoice;
}

/** Runtime validation for the explicit, local future-procurement declaration. */
export function validateHopRecipeDraftOptions(value: unknown = {}): HopRecipeDraftOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Options du brouillon de recette invalides.');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw Error('Options du brouillon de recette invalides.');
  const options = value as Record<string, unknown>;
  if (Reflect.ownKeys(options).some(key => key !== 'futureProcurement')) throw Error('Option inconnue pour le brouillon de recette.');
  const choice = options.futureProcurement;
  if (choice === undefined) return {};
  if (!choice || typeof choice !== 'object' || Array.isArray(choice)) throw Error('Déclaration d’approvisionnement futur invalide.');
  const choicePrototype = Object.getPrototypeOf(choice);
  if (choicePrototype !== Object.prototype && choicePrototype !== null) throw Error('Déclaration d’approvisionnement futur invalide.');
  const declaration = choice as Record<string, unknown>;
  if (Reflect.ownKeys(declaration).some(key => key !== 'id' && key !== 'reason')
    || typeof declaration.id !== 'string' || !declaration.id.trim() || declaration.id.trim() !== declaration.id
    || typeof declaration.reason !== 'string' || !declaration.reason.trim()) {
    throw Error('Déclaration d’approvisionnement futur invalide : identifiant et raison lisible requis.');
  }
  return { futureProcurement: structuredClone({ id: declaration.id, reason: declaration.reason }) };
}

export function hopRecipeFutureProcurementCondition(choice: HopRecipeFutureProcurementChoice): string {
  return `Approvisionnement futur déclaré pour le programme (${choice.id}) : ${choice.reason}. La copie reste un brouillon local ; aucun achat, aucune réservation ni écriture de stock n’a lieu.`;
}

export function bindHopRecipe(recipe: HopRecipeLike, input: {
  materials: HopDecisionMaterial[];
  materialByIndex?: Record<number, string>;
  useByIndex?: Record<number, HopUse>;
  performedIndices?: number[];
  stage: HopProcessStage;
  revision: number;
  wortGravity: number | null;
  ibuModelContext?: HopIbuModelContext;
}): HopRecipeBinding {
  const catalogue = structuredClone(input.materials);
  const materials = [...catalogue];
  const originalHops: Record<string, HopIngredient> = {};
  const assumptions: string[] = [];
  const additions = recipe.hops.map((hop, index) => {
    const id = `recipe-hop:${index}`;
    const selected = input.materialByIndex?.[index];
    let material = selected ? catalogue.find(m => m.id === selected) : undefined;
    if (selected && !material) throw Error('L’association explicite de matière est introuvable.');
    if (!material) {
      const matches = catalogue.filter(m => hop.hopLotId ? m.lot?.id === hop.hopLotId
        : hop.hopVarietyId ? m.variety?.id === hop.hopVarietyId && !m.lot && !m.product : false);
      if (matches.length === 1) material = matches[0];
    }
    if (material && hop.hopLotId && material.lot?.id !== hop.hopLotId) throw Error('Le lot acquis de la recette contredit la référence sélectionnée ; préparer un remplacement explicite.');
    const selectedVarietyId = material?.variety?.id ?? material?.lot?.varietyId;
    if (material && hop.hopVarietyId && selectedVarietyId !== hop.hopVarietyId) throw Error('La variété acquise de la recette contredit la référence sélectionnée ; préparer un remplacement explicite.');
    // Each recipe declaration gets its own identity: two entries can refer to distinct stock.
    const boundId = `${recipe.id}:${id}`;
    const materialStockRef = material?.stockItemRef ?? material?.lot?.stockItemRef;
    if (hop.stockItemRef && materialStockRef && hop.stockItemRef !== materialStockRef) throw Error('Le lien de stock de la recette contredit celui de la matière sélectionnée.');
    const bound: HopDecisionMaterial = { ...material, id: boundId, name: hop.name, form: material?.form ?? 'unknown',
      stockItemRef: hop.stockItemRef ?? materialStockRef };
    if (hop.stockItemRef && !materialStockRef && material?.availableGrams != null) {
      bound.availableGrams = null;
      assumptions.push(`${id} : quantité disponible sans lien au stock de la recette ; disponibilité laissée inconnue.`);
    }
    if (Number.isFinite(hop.alpha) && hop.alpha > 0 && hop.alpha <= 100) {
      bound.alphaForModel = { analyte: 'alpha', unit: 'percentAlpha', kind: 'point', value: hop.alpha, analyticalBasis: 'unknown', origin: 'recipe',
        source: { title: 'Paramètre alpha enregistré dans la recette', author: 'Recette', year: null, kind: 'observation',
          reference: `recipe:${recipe.id}:${index}`, locator: 'Valeur de travail enregistrée ; provenance analytique et base non renseignées.' },
        selectionReason: 'Valeur du champ alpha de cette recette retenue pour une estimation conventionnelle.' };
      assumptions.push(`${id} : alpha conservé comme paramètre de modèle ; aucune analyse sur produit tel quel créée.`);
    }
    materials.push(bound);
    let use = input.useByIndex?.[index] ?? (hop.stage === 'dryHop' ? hop.aromaTiming : hop.stage);
    if (!use || hop.stage === 'dryHop' && !['fermentation', 'postFermentation'].includes(use)) throw Error(`Phase de l’ajout ${index + 1} à préciser ; aucune phase à cru inventée.`);
    if (input.useByIndex?.[index]) assumptions.push(`${id} : emploi explicitement choisi pour le scénario (${use}).`);
    originalHops[id] = structuredClone(hop);
    return { id, materialId: boundId, grams: Number.isFinite(hop.weightG) && hop.weightG >= 0 ? hop.weightG : null,
      use, status: input.performedIndices?.includes(index) ? 'performed' as const : 'planned' as const,
      boilMinutes: use === 'boil' ? hop.timeMin ?? null : undefined,
      contactHours: hop.aromaContactHours ?? (use === 'whirlpool' && hop.timeMin != null ? hop.timeMin / 60 : undefined),
      temperatureC: hop.aromaTemperatureC ?? hop.tempC, dayOffset: hop.dayOffset };
  });
  const program: HopDecisionProgram = { id: recipe.id, revision: input.revision, stage: input.stage,
    volumeL: Number.isFinite(recipe.volumeL) && recipe.volumeL > 0 ? recipe.volumeL : null, wortGravity: input.wortGravity, additions,
    ...(input.ibuModelContext ? { ibuModelContext: structuredClone(input.ibuModelContext) } : {}) };
  programFingerprint(program); // Runtime validation, not only a TypeScript assertion.
  return { version: HOP_DECISION_VERSION, recipeReference: hopDecisionReference(recipe), program, materials, originalHops, assumptions };
}

export type HopRecipeDraftResult<T> = { status: 'needsAlphaSelection'; materialIds: string[]; reasons: string[]; futureProcurement?: HopRecipeFutureProcurementChoice; conditions?: string[] }
  | { status: 'ready'; recipe: T; dossier: { version: typeof HOP_DECISION_VERSION; before: HopDecisionProgram; after: HopDecisionProgram; assumptions: string[]; materials: HopDecisionMaterial[]; recipeModelAlpha: Record<string, HopAlphaModelParameter>; futureProcurement?: HopRecipeFutureProcurementChoice; conditions?: string[] } };

/** Builds a separate recipe draft. No persistence, stock write or Batch argument is accepted. */
export function buildHopRecipeDraft<T extends HopRecipeLike>(current: T, binding: HopRecipeBinding, application: HopProgramApplication,
  materials: HopDecisionMaterial[], alphaSelections: Record<string, number> = {}, options: HopRecipeDraftOptions = {}): HopRecipeDraftResult<T> {
  const validatedOptions = validateHopRecipeDraftOptions(options);
  const futureProcurement = validatedOptions.futureProcurement;
  if (binding.version !== HOP_DECISION_VERSION || application.version !== HOP_DECISION_VERSION) throw Error('Version de décision non reconnue.');
  if (hopDecisionReference(current) !== binding.recipeReference) throw Error('La recette a changé ; reconstruire la simulation avant de l’appliquer.');
  if (binding.program.stage !== 'planning' || application.after.stage !== 'planning') throw Error('Cet adaptateur prépare une recette ; une conduite en cours utilise un programme séparé sans réécrire son brassin.');
  if (programFingerprint(binding.program) !== programFingerprint(application.before)) throw Error('Le résultat appliqué ne correspond pas à cette recette.');
  const verified = applyHopProgramProposal(binding.program, application.proposal, materials,
    futureProcurement ? { allowFutureProcurement: true } : {});
  if (programFingerprint(verified.after) !== programFingerprint(application.after)) throw Error('Le programme à copier ne correspond pas à la proposition vérifiée.');
  const missing = new Set<string>();
  const assumptions = [...binding.assumptions];
  const recipeModelAlpha: Record<string, HopAlphaModelParameter> = {};
  const hops = application.after.additions.map(addition => {
    const material = materials.find(m => m.id === addition.materialId);
    if (!material || addition.grams === null) throw Error('Matière ou masse absente du programme appliqué.');
    const original = binding.originalHops[addition.id];
    const originalAddition = binding.program.additions.find(a => a.id === addition.id);
    const sameMaterial = original && originalAddition?.materialId === addition.materialId;
    let alpha = sameMaterial && !addition.alphaForModel ? original.alpha : null;
    if (!sameMaterial || addition.alphaForModel) {
      const reading = readHopAlphaForAddition(material, addition);
      if (addition.alphaForModel) recipeModelAlpha[addition.id] = structuredClone(addition.alphaForModel);
      const selected = Object.prototype.hasOwnProperty.call(alphaSelections, material.id) ? alphaSelections[material.id] : undefined;
      if (selected !== undefined) {
        const range = numericBounds(reading);
        if (!Number.isFinite(selected) || selected < 0 || selected > 100 || range && (selected < range.min || selected > range.max)) throw Error('Alpha choisi hors du domaine documenté.');
        alpha = selected;
        assumptions.push(`${material.name} : alpha de travail choisi explicitement (${selected} %), sans créer de mesure du lot.`);
        recipeModelAlpha[addition.id] = { analyte: 'alpha', unit: 'percentAlpha', kind: 'point', value: selected, analyticalBasis: 'unknown', origin: 'workingHypothesis',
          source: { title: 'Choix scalaire pour le brouillon de recette', author: 'Choix de formulation', year: null, kind: 'judgment', reference: `recipe-draft:${current.id}:${addition.id}` },
          selectionReason: 'Nominal de travail choisi pour le champ de recette ; les observations et le programme appliqué restent figés séparément.' };
      } else if (reading.status === 'nominal') alpha = reading.value;
      if (alpha === null) missing.add(material.id);
    }
    const dry = ['fermentation', 'postFermentation'].includes(addition.use);
    return { ...(sameMaterial ? original : {}), name: sameMaterial ? original.name : material.name, weightG: addition.grams,
      alpha: alpha as number, stage: dry ? 'dryHop' as const : addition.use as HopIngredient['stage'],
      stockItemRef: sameMaterial ? original.stockItemRef : material.stockItemRef,
      hopVarietyId: sameMaterial ? original.hopVarietyId : material.variety?.id,
      hopLotId: sameMaterial ? original.hopLotId : material.lot?.referenceOnly ? undefined : material.lot?.id,
      timeMin: addition.use === 'boil' ? addition.boilMinutes ?? undefined : addition.use === 'whirlpool' && addition.contactHours != null ? addition.contactHours * 60 : undefined,
      tempC: addition.use === 'whirlpool' ? addition.temperatureC ?? undefined : undefined,
      aromaTiming: dry ? addition.use : undefined, aromaContactHours: addition.contactHours ?? undefined,
      aromaTemperatureC: addition.temperatureC ?? undefined, dayOffset: dry ? addition.dayOffset ?? undefined : undefined };
  });
  const conditions = futureProcurement ? [hopRecipeFutureProcurementCondition(futureProcurement)] : undefined;
  if (missing.size) return { status: 'needsAlphaSelection', materialIds: [...missing],
    reasons: ['Le schéma de recette exige un alpha scalaire ; choisir un nominal justifié avant copie. Une plage ou une inconnue ne devient pas zéro.'],
    ...(futureProcurement ? { futureProcurement: structuredClone(futureProcurement), conditions } : {}) };
  return { status: 'ready', recipe: { ...structuredClone(current), hops, hopPredictionIds: undefined, hopTrialId: undefined },
    dossier: { version: HOP_DECISION_VERSION, before: structuredClone(application.before), after: structuredClone(application.after), assumptions, materials: structuredClone(materials), recipeModelAlpha,
      ...(futureProcurement ? { futureProcurement: structuredClone(futureProcurement), conditions } : {}) } };
}
