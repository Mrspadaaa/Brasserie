import type { HopSource } from '../../../functions/src/hopIndexSchema';
import { assertHopKnowledge, type HopKnowledge, type HopModel } from '../../../functions/src/hopPredictionSchema';

export const LAFONTAINE_BASIS_REVIEW = 'lafontaine-basis-unknown-lf01-2026-10-01' as const;
const doiReference = '10.23763/brsc18-19lafontaine';
const reconstructionReference = 'docs/index-houblon-etalonnage.md';

export interface HopKnowledgeRawVariant {
  id: string;
  origin: 'proposed' | 'saved';
  index: number;
  /** Stable content identity; equal documents share a reference across array permutations. */
  variantReference: string;
  raw: HopKnowledge;
}

export interface HopModelEligibility {
  id: string;
  status: 'eligible' | 'disabled' | 'suspended' | 'insufficient' | 'invalid' | 'conflict';
  resolution: 'proposed-current' | 'proposed-equivalent' | 'saved-current' | 'saved-equivalent' | 'saved-selected' | 'conflict';
  selectedVariant: { origin: 'proposed' | 'saved'; index: number } | null;
  reason: string | null;
  qualificationRevision: string | null;
  /** Parameter-level references for the selected variant, or all variants on conflict. */
  provenanceReferences: string[];
  effective: HopModel | null;
  /** Each raw revision is qualified on its own evidence before current revision resolution. */
  rawVariants: HopModelVariantQualification[];
}

export interface HopModelVariantQualification extends HopKnowledgeRawVariant {
  status: 'eligible' | 'disabled' | 'suspended' | 'insufficient' | 'invalid';
  reason: string | null;
  qualificationRevision: string | null;
  /** References attached to this variant's calibration parameters, never to sibling variants. */
  provenanceReferences: string[];
  effective: HopModel | null;
}

export interface HopPredictionKnowledgeView {
  /** One effective row per ID, suitable for a new calculator call. */
  knowledge: HopKnowledge[];
  /** All proposed and saved inputs before the by-ID resolution, copied for inspection. */
  rawVariants: HopKnowledgeRawVariant[];
  /** Model-specific eligibility, resolution, reason and raw revisions. */
  modelQualifications: HopModelEligibility[];
}

export type HopSavedModelSelection = Readonly<Record<string, string>>;

function calibrationParameterSources(model: HopModel): HopSource[] {
  const outputs = Array.isArray((model as HopModel | null)?.outputs) ? (model as HopModel).outputs : [];
  const sources = outputs.flatMap(output => {
    const calibration = output?.calibration;
    if (!calibration || typeof calibration !== 'object') return [];
    const candidates = [calibration.intercept?.source, calibration.residual?.source,
      ...(Array.isArray(calibration.terms) ? calibration.terms.map(term => term?.coefficient?.source) : [])];
    return candidates.filter(source => source && typeof source === 'object' && typeof source.reference === 'string') as HopSource[];
  });
  return sources;
}

function parameterReferences(model: HopModel): string[] {
  return [...new Set(calibrationParameterSources(model).map(source => source.reference.trim()).filter(Boolean))];
}

function normalizedLocator(source: HopSource): string {
  // Locator is optional in the real source contract. Malformed values must be
  // left for assertHopKnowledge to reject, not coerced into evidence here.
  return typeof source.locator === 'string' ? source.locator.toLocaleLowerCase('en') : '';
}

/**
 * Only calibration provenance can trigger this review. A model-level citation in
 * `source`, a name, ID, version, coefficient, or support bound is not enough.
 */
function unresolvedLafontaineCalibrationSources(model: HopModel): HopSource[] {
  return calibrationParameterSources(model).filter(source => {
    const reference = source.reference.trim().toLocaleLowerCase('en');
    const locator = normalizedLocator(source);
    const primaryTableReference = reference.includes(doiReference) && /\bs12\b/u.test(locator);
    const localDerivedReference = reference === reconstructionReference && /\bs12\b/u.test(locator);
    return primaryTableReference || localDerivedReference;
  });
}

/** Article/reconstruction references without a table locator are ambiguous, not independent evidence. */
function insufficientLafontaineCalibrationSources(model: HopModel): HopSource[] {
  return calibrationParameterSources(model).filter(source => {
    const reference = source.reference.trim().toLocaleLowerCase('en');
    const hintsLafontaine = reference === reconstructionReference || reference.includes(doiReference);
    return hintsLafontaine && !/\bs12\b/u.test(normalizedLocator(source));
  });
}

function validModel(value: HopKnowledge): value is HopModel {
  try { assertHopKnowledge(value); return value.kind === 'model'; }
  catch { return false; }
}

function hasReviewedSuspension(model: HopModel): boolean {
  return model.enabled === false && model.scope.notes.includes(LAFONTAINE_BASIS_REVIEW)
    && model.outputs.some(output => output.calibration?.terms.some(term => term.analyte === 'geraniol'
      && term.unit === 'mg100g' && term.basis === 'unknown'));
}

function projectSuspendedModel(model: HopModel, reason: string): HopModel {
  const suspended = structuredClone(model);
  suspended.enabled = false;
  for (const output of suspended.outputs) {
    for (const term of output.calibration?.terms ?? []) {
      if (term.analyte === 'geraniol' && term.unit === 'mg100g' && term.basis !== 'unknown') {
        term.basis = 'unknown';
      }
    }
  }
  if (!suspended.version.includes('-basis-suspended-lf01')) suspended.version = `${suspended.version}-basis-suspended-lf01`;
  if (!suspended.scope.notes.includes(LAFONTAINE_BASIS_REVIEW)) {
    suspended.scope.notes = `${suspended.scope.notes} ${reason} [${LAFONTAINE_BASIS_REVIEW}]`.trim();
  }
  return suspended;
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]))
    : item);
}

/** Stable, exact content reference for an explicit in-memory saved-variant choice. */
export function hopKnowledgeVariantReference(value: HopKnowledge): string {
  return `variant:${canonical(value)}`;
}

function isModelVariant(variant: HopKnowledgeRawVariant): boolean {
  return (variant.raw as HopKnowledge | null)?.kind === 'model';
}

function qualifyVariant(variant: HopKnowledgeRawVariant): HopModelVariantQualification {
  const raw = variant.raw as HopModel;
  const lineageSources = raw?.kind === 'model' ? unresolvedLafontaineCalibrationSources(raw) : [];
  const insufficientSources = raw?.kind === 'model' ? insufficientLafontaineCalibrationSources(raw) : [];
  const provenanceReferences = raw?.kind === 'model' ? parameterReferences(raw) : [];
  let valid = false;
  try { assertHopKnowledge(raw); valid = raw?.kind === 'model'; } catch { /* preserve invalid rows for diagnostics */ }
  if (!valid) return {
    ...structuredClone(variant), status: 'invalid',
    reason: lineageSources.length
      ? 'Modèle invalide; sa provenance brute reste visible et la base de calibration LF01 n’est pas qualifiée.'
      : 'Modèle invalide; conservé comme variante brute, sans sélection automatique.',
    qualificationRevision: lineageSources.length ? LAFONTAINE_BASIS_REVIEW : null,
    provenanceReferences, effective: null,
  };
  if (lineageSources.length) {
    const reason = 'Base analytique non établie pour les paramètres de calibration Lafontaine/Table S12; nombres, supports et coefficients de cette variante sont conservés, mais elle ne participe pas aux nouveaux calculs.';
    const effective = hasReviewedSuspension(raw) ? structuredClone(raw) : projectSuspendedModel(raw, reason);
    return { ...structuredClone(variant), status: 'suspended', reason,
      qualificationRevision: LAFONTAINE_BASIS_REVIEW, provenanceReferences, effective };
  }
  if (insufficientSources.length && raw.enabled) return {
    ...structuredClone(variant), status: 'insufficient',
    reason: 'La provenance d’un paramètre renvoie à Lafontaine ou à la reconstruction locale, sans locator permettant de confirmer ou d’écarter Table S12. Preuve insuffisante pour attribuer LF01 ou autoriser cette variante active.',
    qualificationRevision: null, provenanceReferences, effective: null,
  };
  const enabled = Boolean(raw.enabled);
  return {
    ...structuredClone(variant), status: enabled ? 'eligible' : 'disabled',
    reason: enabled
      ? 'Aucune provenance de paramètre LF01 reconnue. Cela ne démontre pas une provenance indépendante; l’éligibilité indique seulement que cette variante active satisfait le contrat de forme. Sa validité empirique n’est pas évaluée ici.'
      : insufficientSources.length
        ? 'Modèle désactivé; la provenance de paramètre reste insuffisamment localisée pour confirmer ou écarter Table S12. Une réactivation ne serait pas qualifiée.'
        : 'Modèle désactivé dans cette variante; sa provenance reste distincte de la revue LF01.',
    qualificationRevision: null, provenanceReferences, effective: structuredClone(raw),
  };
}

/**
 * Qualifies every model revision independently, then resolves the current row.
 * A single saved row wins over its proposed seed per saveHopKnowledge. Distinct
 * saved rows require an explicit stable content reference; order and version text never
 * select one. `selectedSavedById` is a transient resolution only, not persistence.
 */
export function qualifyHopPredictionKnowledge(
  proposed: readonly HopKnowledge[],
  saved: readonly HopKnowledge[],
  selectedSavedById: HopSavedModelSelection = {},
): HopPredictionKnowledgeView {
  const rawVariants: HopKnowledgeRawVariant[] = [
    ...proposed.map((raw, index) => ({ id: raw?.id ?? `invalid-proposed-${index}`, origin: 'proposed' as const, index, variantReference: hopKnowledgeVariantReference(raw), raw: structuredClone(raw) })),
    ...saved.map((raw, index) => ({ id: raw?.id ?? `invalid-saved-${index}`, origin: 'saved' as const, index, variantReference: hopKnowledgeVariantReference(raw), raw: structuredClone(raw) })),
  ];
  const variantsById = new Map<string, HopKnowledgeRawVariant[]>();
  const effectiveById = new Map<string, HopKnowledge>();
  for (const variant of rawVariants) {
    const rows = variantsById.get(variant.id) ?? [];
    rows.push(variant);
    variantsById.set(variant.id, rows);
    effectiveById.set(variant.id, structuredClone(variant.raw));
  }

  const modelQualifications: HopModelEligibility[] = [];
  for (const [id, variants] of variantsById) {
    const modelVariants = variants.filter(isModelVariant);
    if (!modelVariants.length) continue;
    const qualifiedVariants = modelVariants.map(qualifyVariant);
    const savedModels = modelVariants.filter(variant => variant.origin === 'saved');
    const proposedModels = modelVariants.filter(variant => variant.origin === 'proposed');
    let selected: HopKnowledgeRawVariant | null = null;
    let resolution: HopModelEligibility['resolution'] = 'proposed-current';
    let conflictReason: string | null = null;

    if (savedModels.length) {
      const requestedReference = Object.prototype.hasOwnProperty.call(selectedSavedById, id)
        ? selectedSavedById[id]
        : undefined;
      if (requestedReference !== undefined) {
        selected = savedModels.find(variant => variant.variantReference === requestedReference) ?? null;
        if (selected) {
          const distinctSaved = new Set(savedModels.map(variant => variant.variantReference));
          resolution = savedModels.length === 1 ? 'saved-current'
            : distinctSaved.size === 1 ? 'saved-equivalent' : 'saved-selected';
        } else conflictReason = 'La référence choisie ne correspond plus à une variante sauvegardée courante de cet ID.';
      } else {
        const distinctSaved = new Map(savedModels.map(variant => [canonical(variant.raw), variant]));
        if (distinctSaved.size === 1) {
          selected = distinctSaved.values().next().value ?? null;
          resolution = savedModels.length > 1 ? 'saved-equivalent' : 'saved-current';
        } else {
          conflictReason = 'Plusieurs variantes sauvegardées distinctes existent pour cet ID; un choix explicite est requis.';
        }
      }
    } else if (proposedModels.length) {
      const distinctProposed = new Map(proposedModels.map(variant => [canonical(variant.raw), variant]));
      if (distinctProposed.size === 1) {
        selected = distinctProposed.values().next().value ?? null;
        resolution = proposedModels.length > 1 ? 'proposed-equivalent' : 'proposed-current';
      } else {
        conflictReason = 'Plusieurs variantes proposées distinctes existent pour cet ID; aucune ne peut être choisie par leur ordre.';
      }
    }

    if (!selected) {
      const refs = [...new Set(qualifiedVariants.flatMap(variant => variant.provenanceReferences))];
      modelQualifications.push({ id, status: 'conflict', resolution: 'conflict', selectedVariant: null,
        reason: conflictReason ?? 'Aucune variante actuelle ne peut être sélectionnée.',
        qualificationRevision: null, provenanceReferences: refs, effective: null,
        rawVariants: qualifiedVariants });
      // No default seed may remain available behind an unresolved current row.
      effectiveById.delete(id);
      continue;
    }

    const selectedQualification = qualifiedVariants.find(variant =>
      variant.origin === selected!.origin && variant.index === selected!.index)!;
    const status = selectedQualification.status;
    const effective = selectedQualification.effective;
    modelQualifications.push({
      id, status, resolution,
      selectedVariant: { origin: selected.origin, index: selected.index },
      reason: selectedQualification.reason,
      qualificationRevision: selectedQualification.qualificationRevision,
      provenanceReferences: selectedQualification.provenanceReferences,
      effective: effective ? structuredClone(effective) : null,
      rawVariants: qualifiedVariants,
    });
    if (effective) effectiveById.set(id, structuredClone(effective));
    else effectiveById.delete(id);
  }

  return { knowledge: [...effectiveById.values()], rawVariants, modelQualifications };
}
