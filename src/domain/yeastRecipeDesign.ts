import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import { YEAST_PRACTICAL_GUIDES } from '../data/yeastPracticalGuides';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { agreedFermentationFact, fermentationProgramIssues, type FermentationRange } from '../../functions/src/fermentationContext';
import { readYeastTechnicalFacts } from '../../functions/src/yeastTechnicalFacts';
import type { FermentationStep, TempStep, YeastSpec } from '../types';
import type { TrialRecipe } from './hopIndex/trials';
import type { YeastReference } from './yeastReferences';
import { resolveFermentationYeast } from './fermentationScenario';
import { fermentationStateKey } from './fermentationGuide';
import { normalizeHop } from './hopStage';
import { hotBitterness } from './hopBitterness';
import { resolveBrewingStyle } from './brewingStyles';
import { BrewingMath } from '../services/brewingMath';
import { yeastStyleEvidence } from './yeastStyleEvidence';
import { projectYeastRecipe, resolveYeastDossier, yeastRecipeStyleText, type YeastRecipeProjection, type YeastFermentationProcess, type YeastCultureRole, type YeastAttenuationBasis } from './yeastProjection';
import guides from '../data/fermentationGuideBootstrap.json';
import { YEAST_RECIPE_PROFILES, YEAST_RECIPE_SOURCES, YEAST_STYLE_FAMILIES, YEAST_RECIPE_GOAL_LABELS, type YeastRecipeGoal, type YeastStyleId } from '../data/yeastRecipeProfiles';
import type { YeastBeerTarget } from './yeastBeerTarget';

export { YEAST_STYLE_FAMILIES, YEAST_RECIPE_GOAL_LABELS };
export type { YeastRecipeGoal, YeastStyleId };
export type { YeastFermentationProcess, YeastCultureRole } from './yeastProjection';

export interface YeastRecipeDraft {
  yeastId: string; styleId: YeastStyleId; goal: YeastRecipeGoal;
  /** Physical product confirmed by the brewer; never changes the catalogue's documented form. */
  form?: YeastSpec['form'];
  formYeastId?: string;
  temperatureC?: number; days?: number; pitchTempC?: number; pressureBar?: number; quantityG?: number;
  /** Complete, explicitly previewed programme. Conditions are persisted in each phase's note. */
  programme?: FermentationStep[];
  /** Desired beer, not a measured result or a sensory prediction. */
  beerTarget?: YeastBeerTarget;
  attenuationPct?: number; attenuationBasis?: YeastAttenuationBasis;
  /** Prevent an inherited assumption from following a later strain-ID change. */
  attenuationYeastId?: string;
  process: YeastFermentationProcess;
  cultureRoles?: YeastCultureRole[];
  pitchRateMillionPerMlPlato?: number; viableCellsBillion?: number;
  /** Explicit opt-in: keep each active addition's temperature unless requested. */
  alignActiveHopTemperature?: boolean;
  /** Requests an editorial 44 °C / 15 min rest; never removes an existing mash step. */
  ferulicRest: boolean;
}
export interface YeastRecipeCandidate {
  yeastId: string; label: string; lab: string; descriptor: string; reason: string; preferred: boolean;
  form?: YeastSpec['form'];
  styleMatch: 'documented' | 'other-style' | 'unclassified' | 'excluded';
  evidence: ReturnType<typeof yeastStyleEvidence>;
  reference: YeastReference; temperature?: FermentationRange; attenuation?: FermentationRange; doseG?: FermentationRange; sources: HopSource[];
}
export interface YeastRecipeEffect {
  id: string; label: string; impact: string; detail: string;
  state: 'documented' | 'conditional' | 'unknown' | 'warning'; source?: HopSource;
}
export interface YeastRecipeChange { id: string; label: string; before: string; after: string }
export interface YeastRecipeHopAddition {
  name: string; phase: 'active' | 'post' | 'unknown'; weightG?: number; doseGL?: number; dayOffset?: number; contactHours?: number; temperatureC?: number;
}
export interface YeastRecipeHopSummary {
  totalG?: number; doseGL?: number; activeG?: number; postG?: number; unknownG?: number; unknownCount: number; additions: YeastRecipeHopAddition[];
}
export interface YeastRecipeEstimate { range: HopRange | null; reasons: string[]; sources: HopSource[]; confidence: 'low' | 'medium' | 'high' }
export interface YeastRecipeEvaluation {
  candidate?: YeastRecipeCandidate; effects: YeastRecipeEffect[]; fg: YeastRecipeEstimate; abv: YeastRecipeEstimate; doseG?: FermentationRange;
  hops: YeastRecipeHopSummary; warnings: string[]; errors: string[]; changes: YeastRecipeChange[]; sources: HopSource[];
  projection: YeastRecipeProjection;
  activeHopTemperatureConflicts: YeastRecipeHopAddition[];
}
export interface YeastRecipeDesignSnapshot {
  modelVersion: 'yeast-recipe-1' | 'yeast-recipe-2'; yeastId: string; styleId: YeastStyleId; goal: YeastRecipeGoal;
  pressureBar?: number; ferulicRest: boolean;
  process?: YeastFermentationProcess;
  cultureRoles?: YeastCultureRole[];
  pitchRateMillionPerMlPlato?: number; viableCellsBillion?: number;
  applied: {
    yeast: YeastSpec; volumeL: number; fermentation: FermentationStep[]; mashSteps: TempStep[];
    /** Recipe identity is distinct from the brewer's comparison-family filter. Optional for older snapshots. */
    style?: string; styleRef?: TrialRecipe['styleRef'];
    hops?: TrialRecipe['hops'];
    /** Optional baseline for explicitly adopted beer-target variations. */
    fermentables?: TrialRecipe['fermentables']; efficiencyPct?: number | null; ogTarget?: number | null; boilMin?: number;
  };
  /** Optional for existing v1/v2 records; records the complete programme explicitly adopted. */
  programme?: FermentationStep[];
  beerTarget?: YeastBeerTarget;
}
type RecipeWithDesign = TrialRecipe & { yeastDesign?: YeastRecipeDesignSnapshot };
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: unknown): n is number => finite(n) && n > 0;
const textKey = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const uniqueSources = (sources: (HopSource | undefined)[]) => [...new Map(sources.filter((s): s is HopSource => !!s).map(s => [s.reference, s])).values()];
const profileFor = (id: string) => YEAST_RECIPE_PROFILES.find(p => p.yeastId === id);
const format = (v: unknown, unit = '') => finite(v) ? `${v.toLocaleString('fr-FR', { maximumFractionDigits: 3 })}${unit ? ` ${unit}` : ''}` : 'À renseigner';
const defaultGoal = (styleId: YeastStyleId) => YEAST_STYLE_FAMILIES.find(s => s.id === styleId)?.goals[0] ?? 'balanced';
const knownGoal = (goal: unknown) => typeof goal === 'string' && Object.prototype.hasOwnProperty.call(YEAST_RECIPE_GOAL_LABELS, goal);
const draftForm = (draft: YeastRecipeDraft, reference: YeastReference) => draft.formYeastId === reference.id ? draft.form : reference.form;
export function readYeastBeerTarget(value: unknown): YeastBeerTarget | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const v = value as YeastBeerTarget;
  const band = (r: unknown, max = Infinity) => !!r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).every(k => k === 'min' || k === 'max') &&
    finite((r as HopRange).min) && finite((r as HopRange).max) && (r as HopRange).min >= 0 && (r as HopRange).min <= (r as HopRange).max && (r as HopRange).max <= max;
  if (Object.keys(v).some(k => !['modelVersion', 'abv', 'ibu', 'finish', 'accent', 'sparkling', 'label'].includes(k)) ||
    v.modelVersion !== undefined && v.modelVersion !== 'yeast-beer-target-1' || v.abv !== undefined && !band(v.abv, 100) || v.ibu !== undefined && !band(v.ibu) ||
    v.finish !== undefined && !['unspecified', 'dry', 'round', 'sweet'].includes(v.finish) || v.accent !== undefined && !['none', 'chocolate'].includes(v.accent) ||
    v.sparkling !== undefined && typeof v.sparkling !== 'boolean' || v.label !== undefined && typeof v.label !== 'string') return;
  return { ...structuredClone(v), modelVersion: 'yeast-beer-target-1' };
}
const validProgramme = (value: unknown): value is FermentationStep[] => Array.isArray(value) && value.length > 0 && value.some(p => p?.kind === 'primaire') && value.every(p => p &&
  typeof p.name === 'string' && p.name.trim() && ['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(p.kind) &&
  finite(p.tempC) && p.tempC >= 0 && p.tempC <= 60 && finite(p.days) && (p.kind === 'primaire' ? p.days > 0 : p.days >= 0) &&
  (p.note === undefined || typeof p.note === 'string'));
const withProgrammePrimary = (draft: YeastRecipeDraft): YeastRecipeDraft => {
  const primary = Array.isArray(draft.programme) ? draft.programme.find(p => p?.kind === 'primaire') : undefined;
  return primary ? { ...draft, temperatureC: draft.temperatureC ?? primary.tempC, days: draft.days ?? primary.days } : draft;
};

/** Primary edits stay authoritative after preparing a complete programme. */
export function yeastRecipeProgramme(recipe: TrialRecipe, draft: YeastRecipeDraft): FermentationStep[] {
  const phases = (draft.programme ?? recipe.fermentation ?? []).map(p => ({ ...p }));
  const primary = phases.find(s => s.kind === 'primaire');
  if (primary) {
    if (draft.temperatureC !== undefined) primary.tempC = draft.temperatureC;
    if (draft.days !== undefined) primary.days = draft.days;
  } else if (finite(draft.temperatureC) && positive(draft.days)) phases.unshift({
    name: 'Fermentation principale', kind: 'primaire', tempC: draft.temperatureC, days: draft.days,
    note: 'Durée indicative choisie pour ce scénario. Contrôler la densité et les défauts avant refroidissement ou conditionnement.'
  });
  return phases;
}

function yeastTrait(reference: YeastReference | undefined, key: 'pof' | 'diastatic', yeast?: YeastSpec): { value?: boolean; source?: HopSource; conflict: boolean } {
  const local = yeast?.technicalFacts?.filter(f => f.key === key || key === 'diastatic' && f.key === 'sta1') ?? [];
  const facts = local.length ? local : reference?.catalogue?.facts.filter(f => f.key === key || key === 'diastatic' && f.key === 'sta1') ?? [];
  if (facts.length) {
    const values = facts.map(f => /^(?:positive|yes|pof\s*\+|sta1\s*\+|\+)$/i.test(f.reported.trim()) ? true :
      /^(?:negative|no|non[ -]?(?:phenolic|diastatic)|pof\s*[-−]|sta1\s*[-−]|[-−])$/i.test(f.reported.trim()) ? false : undefined);
    const agreed = values[0] !== undefined && values.every(v => v === values[0]);
    const first = facts[0], source = typeof first.source === 'object' ? first.source : first.source || 'sourceUrl' in first && first.sourceUrl ? {
      author: 'Fiche saisie', title: 'Caractère de la souche', reference: ('sourceUrl' in first ? first.sourceUrl : undefined) ?? first.source as string, kind: 'observation' as const, year: null
    } : undefined;
    return { value: agreed ? values[0] : undefined, source, conflict: !agreed };
  }
  if (!reference) return { conflict: false };
  const profile = profileFor(reference.id);
  return { value: key === 'pof' ? profile?.phenolic : profile?.diastatic, source: profile?.traitSource ?? profile?.source, conflict: false };
}

/** Explicit style identity wins over an ambiguous marketing name. Unknown is not a clean-ale default. */
export function inferYeastRecipeStyle(recipe: TrialRecipe): YeastStyleId {
  const infer = (raw: string): YeastStyleId => {
    const s = textKey(raw);
    if (/\b(sour|berliner weisse|gose|lambic|gueuze|geuze|oud bruin|flanders|mixed fermentation|wild ale)\b/.test(s)) return 'sour';
    if (/\b(witbier|wit beer|belgian wit|blanche belge)\b/.test(s)) return 'witbier';
    if (/\b(american wheat|american hefeweizen|ble americain)\b/.test(s)) return 'american-wheat';
    if (/\b(weissbier|hefeweizen|hefeweiss|hefeweisse|weizenbock|weizen|dunkelweizen|kristallweizen)\b/.test(s)) return 'weissbier';
    if (/\b(hazy|neipa|new england|juicy ipa)\b/.test(s)) return 'hazy-ipa';
    if (/\b(saison|farmhouse)\b/.test(s)) return 'saison';
    if (/\b(kolsch|koelsch|altbier|alt beer)\b/.test(s)) return 'kolsch-alt';
    if (/\b(lager|pils|pilsner|pilsener|helles|dunkel|bock|marzen|festbier|schwarzbier|vienna|dortmunder|czech premium|czech pale|czech amber|czech dark)\b/.test(s)) return 'lager';
    if (/\b(tripel|dubbel|quadrupel|abbaye|abbey|belgian|belge)\b/.test(s)) return 'belgian-ale';
    if (/\b(stout|porter)\b/.test(s)) return 'stout-porter';
    if (/\b(english|anglaise|british|bitter|esb|mild|scottish|scotch|irish red|barley[ -]?wine)\b/.test(s)) return 'english-ale';
    if (/\b(american|west coast|pale ale|ipa|india pale ale)\b/.test(s)) return 'clean-ale';
    return 'unknown';
  };
  return infer(yeastRecipeStyleText(recipe));
}

function candidateFor(reference: YeastReference, goal: YeastRecipeGoal, volumeL?: number, styleId: YeastStyleId = 'unknown', form = reference.form): YeastRecipeCandidate {
  const profile = profileFor(reference.id), evidence = yeastStyleEvidence(reference), pitch = agreedFermentationFact(reference, 'pitchRate', 'g/hL');
  const doseG = form === 'sèche' && reference.form === 'sèche' && pitch && positive(volumeL) ? {
    range: { min: pitch.range.min * volumeL / 100, max: pitch.range.max * volumeL / 100 }, source: pitch.source
  } : undefined;
  const temperature = agreedFermentationFact(reference, 'temperature', '°C'), attenuation = agreedFermentationFact(reference, 'attenuation', '%');
  const styleMatch = evidence.exclusions.some(e => e.styleId === styleId) ? 'excluded'
    : evidence.styles.includes(styleId) ? 'documented' : evidence.styles.length ? 'other-style' : 'unclassified';
  const goalReason = evidence.goalReasons[goal];
  const lab = reference.catalogue?.manufacturer ?? reference.source.author;
  const suffix = ` (${lab})`;
  const label = reference.name.startsWith(`${lab} · `) ? reference.name.slice(lab.length + 3)
    : reference.name.endsWith(suffix) ? reference.name.slice(0, -suffix.length) : reference.name;
  return { yeastId: reference.id, label: profile?.label ?? label, lab,
    descriptor: evidence.descriptor ?? 'Caractère aromatique non documenté.',
    reason: goalReason?.text ?? (styleMatch === 'documented' ? 'Usage documenté pour cette famille. Aucun effet spécifique de cet objectif n’est décrit.' : 'Adéquation au style à confirmer à partir des usages et conditions de cette fiche.'),
    preferred: !!goalReason, form, styleMatch, evidence, reference, temperature, attenuation, doseG,
    sources: uniqueSources([evidence.descriptorSource, goalReason?.source, ...evidence.styleMatches.map(e => e.source),
      ...evidence.exclusions.map(e => e.source), temperature?.source, attenuation?.source, doseG?.source, reference.source]) };
}

export function yeastRecipeCandidates(styleId: YeastStyleId, goal: YeastRecipeGoal, refs: YeastReference[], volumeL?: number, options: { includeOtherStyles?: boolean } = {}): YeastRecipeCandidate[] {
  return refs.filter(r => styleId === 'unknown' || options.includeOtherStyles || yeastStyleEvidence(r).styles.includes(styleId))
    .map(r => candidateFor(r, goal, volumeL, styleId))
    .sort((a, b) => Number(b.preferred) - Number(a.preferred) ||
      Number(b.styleMatch === 'documented') - Number(a.styleMatch === 'documented') || a.label.localeCompare(b.label, 'fr'));
}

/** A catalogue dose describes its product form, not a propagated culture of that strain. */
export function yeastRecipeFormWarning(recipe: TrialRecipe, reference?: YeastReference): string | undefined {
  if (!reference?.form) return undefined;
  if (!recipe.yeast.form) return 'Forme de la levure à préciser avant d’utiliser les repères de dose.';
  if (recipe.yeast.form !== reference.form) return `Forme prévue : ${recipe.yeast.form} ; référence : ${reference.form}. Confirmer le produit avant d’utiliser ses repères de dose.`;
  return undefined;
}

function ferulicRestIndex(steps: TempStep[]): number {
  const saccharification = steps.findIndex(s => finite(s.tempC) && s.tempC >= 60 && s.tempC <= 75 && positive(s.durationMin));
  if (saccharification < 0) return -1;
  return steps.findIndex((s, i) => i < saccharification && s.tempC >= 43 && s.tempC <= 45 && positive(s.durationMin) && !steps.slice(0, i).some(p => p.tempC >= 60));
}

function recipeStyleUnchanged(recipe: TrialRecipe, snapshot: YeastRecipeDesignSnapshot): boolean {
  if (snapshot.applied.style === undefined) {
    // A legacy snapshot cannot distinguish a personal style from a comparison filter.
    // A newly recognised family still wins over that older, incomplete context.
    const inferred = inferYeastRecipeStyle(recipe);
    return inferred === 'unknown' || inferred === snapshot.styleId;
  }
  return textKey(recipe.style ?? '') === textKey(snapshot.applied.style) &&
    fermentationStateKey(recipe.styleRef ?? null) === fermentationStateKey(snapshot.applied.styleRef ?? null);
}

export function createYeastRecipeDraft(recipe: TrialRecipe, refs: YeastReference[], styleId?: YeastStyleId, yeastId?: string): YeastRecipeDraft {
  const resolved = resolveFermentationYeast(recipe, refs), currentId = recipe.yeast.hopIndexId ?? resolved?.id ?? '', selected = yeastId ?? currentId;
  const snapshot = readYeastRecipeDesign(recipe), primary = recipe.fermentation?.find(s => s.kind === 'primaire');
  const same = selected === currentId, saved = same && snapshot?.yeastId === selected ? snapshot : undefined;
  const sameStyle = !!saved && recipeStyleUnchanged(recipe, saved);
  const selectedStyle = styleId ?? (sameStyle ? saved!.styleId : inferYeastRecipeStyle(recipe));
  return { yeastId: selected, styleId: selectedStyle, goal: sameStyle && saved!.styleId === selectedStyle ? saved!.goal : defaultGoal(selectedStyle),
    form: same ? recipe.yeast.form : refs.find(r => r.id === selected)?.form, formYeastId: selected,
    temperatureC: finite(primary?.tempC) ? primary.tempC : undefined, days: positive(primary?.days) ? primary.days : undefined,
    ...(saved?.programme && !yeastRecipeDesignChanged(recipe, saved) ? { programme: structuredClone(recipe.fermentation ?? []) } : {}),
    ...(snapshot?.beerTarget ? { beerTarget: structuredClone(snapshot.beerTarget) } : {}),
    pitchTempC: same && finite(recipe.yeast.pitchTempC) ? recipe.yeast.pitchTempC : undefined,
    quantityG: same && recipe.yeast.form === 'sèche' && recipe.yeast.unit === 'g' && positive(recipe.yeast.qty) ? recipe.yeast.qty : undefined,
    attenuationPct: same ? recipe.yeast.attenuationPct : undefined, attenuationBasis: same ? recipe.yeast.attenuationBasis : undefined,
    attenuationYeastId: selected,
    process: saved?.process ?? 'unspecified', cultureRoles: saved?.cultureRoles ? structuredClone(saved.cultureRoles) : undefined,
    pitchRateMillionPerMlPlato: saved?.pitchRateMillionPerMlPlato, viableCellsBillion: saved?.viableCellsBillion,
    pressureBar: saved?.pressureBar, ferulicRest: ferulicRestIndex(recipe.mash?.steps ?? []) >= 0 };
}

/** Returns a proposal to preview. Calling this helper does not mutate the draft or adopt settings. */
export function proposeYeastGoalSettings(recipe: TrialRecipe, draft: YeastRecipeDraft, refs: YeastReference[]): {
  patch: Partial<YeastRecipeDraft>; label: string; rationale: string; source?: HopSource;
} | undefined {
  const reference = refs.find(r => r.id === draft.yeastId), profile = profileFor(draft.yeastId);
  const current = draft.yeastId === (recipe.yeast.hopIndexId ?? resolveFermentationYeast(recipe, refs)?.id ?? '');
  const dossier = resolveYeastDossier(current ? recipe.yeast : { name: reference?.name ?? '' }, reference);
  const temperature = dossier.temperature?.qualifier === 'range' ? dossier.temperature : undefined;
  if (draft.goal === 'clove' && draft.styleId === 'weissbier' && yeastTrait(reference, 'pof', current ? recipe.yeast : undefined).value === true) {
    const steps = recipe.mash?.steps ?? [];
    const patch: Partial<YeastRecipeDraft> = {};
    if (ferulicRestIndex(steps) < 0 && !steps.some(s => s.tempC >= 43 && s.tempC <= 45 && positive(s.durationMin)) &&
      steps.some(s => s.tempC >= 60 && s.tempC <= 75 && positive(s.durationMin))) patch.ferulicRest = true;
    if (profile?.temperatureEsters && temperature && temperature.range.min <= 18 && temperature.range.max >= 18) patch.temperatureC = 18;
    if (!Object.keys(patch).length) return undefined;
    return { patch, label: 'Préparer un essai girofle', rationale: 'Proposition L’Affinée : repos 44 °C / 15 min si absent ; pour les Wyeast documentées, 18 °C comme point de départ dans leur fenêtre afin de limiter les esters. Ni durée de repos optimale ni hausse de 4-VG démontrée. La dose et la pression restent à choisir.',
      source: { title: 'Choix de scénario girofle — preuves et limites', author: 'L’Affinée', year: 2026, kind: 'judgment', reference: 'docs/research/yeast-wheat-style-evidence.md' } };
  }
  const guide = guides.find(g => g.kind === 'fermentation' && g.yeastId === draft.yeastId && g.enabled);
  const plan = guide?.plans?.find(p => p.goal === draft.goal);
  const first = plan?.phases.find(p => p.kind === 'primaire');
  if (!first || !temperature || first.temperatureC.central < temperature.range.min || first.temperatureC.central > temperature.range.max) {
    if (draft.temperatureC === undefined && temperature) {
      const middle = (temperature.range.min + temperature.range.max) / 2;
      return { patch: { temperatureC: middle }, label: `Préparer ${format(middle, '°C')} · point de départ`,
        rationale: 'Point médian de la fenêtre renseignée pour préparer la conduite. Ce repère éditorial ne prédit pas un profil aromatique ; ajuste-le selon le protocole de cette souche et tes essais.', source: temperature.sources[0] };
    }
    return { patch: {}, label: 'Consigne conservée', rationale: `Aucun réglage de température documenté pour cet objectif. ${finite(draft.temperatureC) ? `Consigne actuelle conservée : ${format(draft.temperatureC, '°C')}.` : 'Plage de conduite à renseigner.'}` };
  }
  const patch: Partial<YeastRecipeDraft> = { temperatureC: first.temperatureC.central };
  if (draft.pitchTempC === undefined) patch.pitchTempC = plan!.pitchTemperatureC.central;
  if (draft.days === undefined) patch.days = first.days.central;
  return { patch, label: `Essayer ${format(first.temperatureC.central, '°C')} · point de départ`,
    rationale: `Consigne éditoriale du guide L’Affinée, dans la fenêtre de cette souche. ${draft.days === undefined ? `${first.days.central} jours proposés pour planifier la phase principale, à réévaluer aux mesures ; aucune fin de fermentation garantie. ` : 'La durée saisie est conservée. '}Aucune baisse automatique de dose. Les autres phases restent en place.`, source: guide!.source as HopSource };
}

/** Summarise only real dry-hop ingredients. A day number does not identify a biological phase. */
export function yeastRecipeHopSummary(recipe: TrialRecipe): YeastRecipeHopSummary {
  const additions: YeastRecipeHopAddition[] = recipe.hops.filter(h => normalizeHop(h).stage === 'dryHop' && (h.weightG !== 0 || !finite(h.weightG))).map(h => ({
    name: h.name, phase: h.aromaTiming === 'fermentation' ? 'active' : h.aromaTiming === 'postFermentation' ? 'post' : 'unknown',
    weightG: positive(h.weightG) ? h.weightG : undefined, doseGL: positive(h.weightG) && positive(recipe.volumeL) ? h.weightG / recipe.volumeL : undefined,
    dayOffset: finite(h.dayOffset) && h.dayOffset >= 0 ? h.dayOffset : undefined,
    contactHours: positive(h.aromaContactHours) ? h.aromaContactHours : undefined,
    temperatureC: finite(h.aromaTemperatureC ?? h.tempC) ? h.aromaTemperatureC ?? h.tempC : undefined
  }));
  const sum = (rows: YeastRecipeHopAddition[]) => rows.every(h => positive(h.weightG)) ? rows.reduce((s, h) => s + h.weightG!, 0) : undefined;
  const totalG = sum(additions);
  return { additions, totalG, doseGL: totalG !== undefined && positive(recipe.volumeL) ? totalG / recipe.volumeL : undefined,
    activeG: sum(additions.filter(h => h.phase === 'active')), postG: sum(additions.filter(h => h.phase === 'post')),
    unknownG: sum(additions.filter(h => h.phase === 'unknown')), unknownCount: additions.filter(h => h.phase === 'unknown').length };
}

function draftErrors(recipe: TrialRecipe, draft: YeastRecipeDraft, candidate: YeastRecipeCandidate | undefined, mode: 'strain' | 'settings'): string[] {
  const errors: string[] = [];
  if (!candidate && (mode === 'strain' || draft.yeastId && draft.yeastId !== recipe.yeast.hopIndexId || !recipe.yeast.name.trim())) errors.push('Choisis une levure ou renseigne le nom de ta souche.');
  if (!YEAST_STYLE_FAMILIES.some(s => s.id === draft.styleId)) errors.push('Le style sélectionné est inconnu.');
  if (!knownGoal(draft.goal)) errors.push('L’objectif sélectionné est inconnu.');
  if (draft.beerTarget !== undefined && !readYeastBeerTarget(draft.beerTarget)) errors.push('Cible de bière invalide : vérifier les plages et leurs unités.');
  if (mode === 'strain') return errors;
  for (const [label, value] of [['Température', draft.temperatureC], ['Ensemencement', draft.pitchTempC]] as const) {
    if (value === undefined) continue;
    if (!finite(value) || value < 0 || value > 60) errors.push(`${label} : saisis une température valide en °C.`);
  }
  if (draft.days !== undefined && !positive(draft.days)) errors.push('La durée indicative doit être positive ou rester à renseigner.');
  if (draft.programme !== undefined && !validProgramme(draft.programme)) errors.push('Programme incomplet : chaque phase exige un nom, une température et une durée valides, avec une primaire.');
  if (draft.pressureBar !== undefined && (!finite(draft.pressureBar) || draft.pressureBar < 0)) errors.push('La pression en fermentation doit être positive ou nulle, en bar relatif.');
  if (draft.attenuationPct !== undefined && (!finite(draft.attenuationPct) || draft.attenuationPct < 0 || draft.attenuationPct > 100)) errors.push('Atténuation : saisis une valeur entre 0 et 100 %.');
  if (draft.process !== undefined && !['unspecified', 'preacidified', 'acidifying-yeast', 'mixed-culture'].includes(draft.process)) errors.push('Procédé de fermentation inconnu.');
  if (draft.cultureRoles?.some(c => !c.name.trim() || !['alcoholic', 'acidifying', 'conditioning', 'mixed'].includes(c.role))) errors.push('Chaque culture exige un nom et un rôle explicites.');
  if (draft.pitchRateMillionPerMlPlato !== undefined && !positive(draft.pitchRateMillionPerMlPlato)) errors.push('Taux d’ensemencement cible positif requis.');
  if (draft.viableCellsBillion !== undefined && (!finite(draft.viableCellsBillion) || draft.viableCellsBillion < 0)) errors.push('Cellules viables : saisis une valeur positive ou nulle.');
  if (draft.quantityG !== undefined && (!positive(draft.quantityG) || (candidate?.form ?? recipe.yeast.form) !== 'sèche')) errors.push('La quantité en grammes doit être positive et concerne une levure sèche.');
  if (!(Array.isArray(draft.programme) ? draft.programme : recipe.fermentation)?.some(s => s.kind === 'primaire') && (draft.temperatureC !== undefined || draft.days !== undefined) && (!finite(draft.temperatureC) || !positive(draft.days))) errors.push('Pour créer une phase principale, renseigne sa température et sa durée indicative.');
  const steps = recipe.mash?.steps ?? [];
  if (draft.ferulicRest && ferulicRestIndex(steps) < 0) {
    if (!steps.some(s => finite(s.tempC) && s.tempC >= 60 && s.tempC <= 75 && positive(s.durationMin))) errors.push('Prépare d’abord un palier de saccharification (60–75 °C) dans l’empâtage avant d’ajouter le repos férulique.');
    if (steps.some(s => s.tempC >= 43 && s.tempC <= 45 && positive(s.durationMin))) errors.push('Un repos à 43–45 °C existe après la chauffe : replace-le avant la saccharification dans l’empâtage.');
    if (yeastTrait(candidate?.reference, 'pof', !candidate || resolveFermentationYeast(recipe, [candidate.reference])?.id === candidate.yeastId ? recipe.yeast : undefined).value !== true) errors.push('L’effet de ce repos exige une capacité phénolique documentée pour cette souche.');
  }
  return errors;
}

function proposedRecipe<T extends TrialRecipe>(recipe: T, draft: YeastRecipeDraft, candidate: YeastRecipeCandidate | undefined, refs: YeastReference[], mode: 'strain' | 'settings'): T {
  const same = !candidate || resolveFermentationYeast(recipe, refs)?.id === candidate.yeastId;
  const nextYeast: YeastSpec = same ? { ...recipe.yeast, ...(candidate ? { hopIndexId: candidate.yeastId, ...(candidate.form ? { form: candidate.form } : {}) } : {}) } : {
    name: candidate!.label, hopIndexId: candidate!.yeastId, ...(candidate!.form ? { form: candidate!.form } : {}), lab: candidate!.lab,
    technicalFacts: resolveYeastDossier({ name: candidate!.label }, candidate!.reference).facts, attenuationBasis: 'declared',
    ...(candidate!.reference.catalogue?.productCode ? { strain: candidate!.reference.catalogue.productCode } : {})
  };
  let fermentation = recipe.fermentation?.map(s => ({ ...s })), mash = recipe.mash;
  if (mode === 'settings') {
    if (nextYeast.form === 'sèche' && draft.quantityG !== undefined) { nextYeast.qty = draft.quantityG; nextYeast.unit = 'g'; }
    else if (nextYeast.form === 'sèche' && nextYeast.unit === 'g') delete nextYeast.qty;
    const ownAttenuation = draft.attenuationYeastId === undefined || draft.attenuationYeastId === draft.yeastId;
    if (ownAttenuation && draft.attenuationPct !== undefined) { nextYeast.attenuationPct = draft.attenuationPct; nextYeast.attenuationBasis = draft.attenuationBasis ?? 'recipe'; }
    else if (ownAttenuation && draft.attenuationBasis === 'declared') { delete nextYeast.attenuationPct; nextYeast.attenuationBasis = 'declared'; }
    if (draft.pitchTempC !== undefined) nextYeast.pitchTempC = draft.pitchTempC;
    else delete nextYeast.pitchTempC;
    if (candidate?.temperature && !same) { nextYeast.fermTempMinC = candidate.temperature.range.min; nextYeast.fermTempMaxC = candidate.temperature.range.max; }
    if (draft.programme || fermentation || finite(draft.temperatureC) && positive(draft.days)) fermentation = yeastRecipeProgramme(recipe, draft);
    if (draft.ferulicRest && ferulicRestIndex(mash?.steps ?? []) < 0) {
      mash = { ...mash, steps: [{ name: 'Repos férulique · proposition L’Affinée', tempC: 44, durationMin: 15 }, ...mash?.steps ?? []] };
    }
  }
  const hops = mode === 'settings' && draft.alignActiveHopTemperature && finite(draft.temperatureC)
    ? recipe.hops.map(h => normalizeHop(h).stage === 'dryHop' && h.aromaTiming === 'fermentation' ? { ...h, aromaTemperatureC: draft.temperatureC, tempC: draft.temperatureC } : h)
    : recipe.hops;
  const previous = readYeastRecipeDesign(recipe);
  const pressureChanged = mode === 'settings' && (previous?.pressureBar !== draft.pressureBar || (previous?.process ?? 'unspecified') !== draft.process || fermentationStateKey(previous?.cultureRoles) !== fermentationStateKey(draft.cultureRoles));
  const changed = !same || pressureChanged || fermentationStateKey(nextYeast) !== fermentationStateKey(recipe.yeast) ||
    fermentationStateKey(fermentation) !== fermentationStateKey(recipe.fermentation) || fermentationStateKey(mash) !== fermentationStateKey(recipe.mash) || fermentationStateKey(hops) !== fermentationStateKey(recipe.hops);
  return { ...recipe, yeast: nextYeast, fermentation, mash, hops,
    ...(changed ? { yeastGuide: undefined, hopPredictionIds: undefined, hopMatrixId: undefined, hopTrialId: undefined } : {}),
    ...(mode === 'settings' && recipe.yeastGuide && recipe.yeastGuide.goal !== (draft.goal === 'clove' ? 'phenolic' : draft.goal) ? { yeastGuide: undefined } : {}) };
}

function changesFor(recipe: TrialRecipe, draft: YeastRecipeDraft, candidate: YeastRecipeCandidate | undefined, refs: YeastReference[]): YeastRecipeChange[] {
  const changes: YeastRecipeChange[] = [], primary = recipe.fermentation?.find(s => s.kind === 'primaire');
  const add = (id: string, label: string, before: string, after: string) => { if (before !== after) changes.push({ id, label, before, after }); };
  if (candidate) {
    const same = resolveFermentationYeast(recipe, refs)?.id === candidate.yeastId;
    add('yeast', 'Levure', recipe.yeast.name || 'À choisir', same ? recipe.yeast.name : candidate.label);
    add('form', 'Forme de levure', recipe.yeast.form || 'À confirmer', candidate.form || (same ? recipe.yeast.form : undefined) || 'À confirmer');
  }
  if (draft.programme && validProgramme(draft.programme)) {
    const planned = yeastRecipeProgramme(recipe, draft), before = recipe.fermentation ?? [];
    const phaseLabel = (phase: FermentationStep | undefined) => phase ? `${phase.name} · ${format(phase.tempC, '°C')} · ${format(phase.days, 'j')}` : 'Aucune phase';
    const coldDescent = (phase: FermentationStep) => phase.kind === 'garde' && /refroid|cold[ -]?crash/i.test(phase.name);
    const used = new Set<number>(), order: number[] = [];
    planned.forEach((phase, index) => {
      let match = before.findIndex((p, i) => !used.has(i) && p.kind === phase.kind && p.name === phase.name);
      if (match < 0 && ['primaire', 'reposDiacetyle', 'garde'].includes(phase.kind)) match = before.findIndex((p, i) => !used.has(i) && p.kind === phase.kind && coldDescent(p) === coldDescent(phase));
      const previous = match >= 0 ? before[match] : undefined;
      if (match >= 0) { used.add(match); order.push(match); }
      add(`programme-${index}`, phase.name, phaseLabel(previous), `${phaseLabel(phase)}${previous && previous.note !== phase.note ? ' · consignes modifiées' : ''}`);
    });
    before.forEach((phase, index) => { if (!used.has(index)) add(`programme-removed-${index}`, phase.name, phaseLabel(phase), 'Phase retirée'); });
    if (order.some((value, index) => index > 0 && value < order[index - 1])) add('programme-order', 'Ordre des phases', before.map(p => p.name).join(' → '), planned.map(p => p.name).join(' → '));
  } else {
    if (draft.temperatureC !== undefined) add('temperature', 'Primaire', format(primary?.tempC, '°C'), format(draft.temperatureC, '°C'));
    if (draft.days !== undefined) add('duration', 'Durée indicative', format(primary?.days, 'j'), format(draft.days, 'j'));
  }
  add('pitch', 'Ensemencement', format(recipe.yeast.pitchTempC, '°C'), format(draft.pitchTempC, '°C'));
  if ((candidate?.form ?? recipe.yeast.form) === 'sèche' && (draft.quantityG !== undefined || recipe.yeast.unit === 'g')) add('quantity', 'Levure sèche', positive(recipe.yeast.qty) ? format(recipe.yeast.qty, recipe.yeast.unit) : 'À renseigner', format(draft.quantityG, 'g'));
  else if (candidate && resolveFermentationYeast(recipe, refs)?.id !== candidate.yeastId && positive(recipe.yeast.qty)) add('quantity', 'Quantité', format(recipe.yeast.qty, recipe.yeast.unit), 'À renseigner pour la nouvelle souche');
  add('pressure', 'Pression précoce · scénario', format(readYeastRecipeDesign(recipe)?.pressureBar, 'bar rel.'), format(draft.pressureBar, 'bar rel.'));
  add('goal', 'Profil recherché', YEAST_RECIPE_GOAL_LABELS[readYeastRecipeDesign(recipe)?.goal ?? createYeastRecipeDraft(recipe, refs).goal], YEAST_RECIPE_GOAL_LABELS[draft.goal]);
  if (draft.attenuationPct !== undefined && (draft.attenuationYeastId === undefined || draft.attenuationYeastId === draft.yeastId)) add('attenuation', 'Atténuation choisie', format(recipe.yeast.attenuationPct, '%'), format(draft.attenuationPct, '%'));
  const processLabels = { unspecified: 'À préciser', preacidified: 'Moût pré-acidifié', 'acidifying-yeast': 'Levure acidifiante', 'mixed-culture': 'Cultures mixtes' };
  add('process', 'Procédé acidulé', processLabels[readYeastRecipeDesign(recipe)?.process ?? 'unspecified'], processLabels[draft.process ?? 'unspecified']);
  add('cultureRoles', 'Cultures et rôles', (readYeastRecipeDesign(recipe)?.cultureRoles ?? []).map(c => `${c.name} · ${c.role}`).join(', ') || 'Non renseignés', (draft.cultureRoles ?? []).map(c => `${c.name} · ${c.role}`).join(', ') || 'Non renseignés');
  add('pitchRate', 'Taux cible', format(readYeastRecipeDesign(recipe)?.pitchRateMillionPerMlPlato, 'M cellules/mL/°P'), format(draft.pitchRateMillionPerMlPlato, 'M cellules/mL/°P'));
  add('viableCells', 'Cellules viables', format(readYeastRecipeDesign(recipe)?.viableCellsBillion, 'milliards'), format(draft.viableCellsBillion, 'milliards'));
  if (draft.alignActiveHopTemperature && finite(draft.temperatureC)) yeastRecipeHopSummary(recipe).additions.filter(h => h.phase === 'active' && h.temperatureC !== draft.temperatureC).forEach((h, i) => add(`hop-temperature-${i}`, `${h.name} · contact actif`, format(h.temperatureC, '°C'), format(draft.temperatureC, '°C')));
  if (draft.ferulicRest && ferulicRestIndex(recipe.mash?.steps ?? []) < 0) changes.push({ id: 'mash', label: 'Empâtage', before: 'Sans repos férulique avant saccharification', after: 'Ajouter 44 °C · 15 min au début (proposition éditoriale)' });
  return changes;
}

export function evaluateYeastRecipeDesign(recipe: TrialRecipe, draft: YeastRecipeDraft, refs: YeastReference[]): YeastRecipeEvaluation {
  draft = withProgrammePrimary(draft);
  const reference = refs.find(r => r.id === draft.yeastId), candidate = reference && candidateFor(reference, draft.goal, recipe.volumeL, draft.styleId, draftForm(draft, reference)), profile = profileFor(draft.yeastId);
  const currentYeast = !draft.yeastId || draft.yeastId === (recipe.yeast.hopIndexId ?? resolveFermentationYeast(recipe, refs)?.id) ? recipe.yeast : undefined;
  const phenolic = yeastTrait(reference, 'pof', currentYeast), diastatic = yeastTrait(reference, 'diastatic', currentYeast);
  const dossier = resolveYeastDossier(currentYeast ?? { name: reference?.name ?? '' }, reference);
  const selectedTemperature = dossier.temperature?.qualifier === 'range' ? dossier.temperature : undefined;
  const effects: YeastRecipeEffect[] = [], warnings: string[] = [], errors = draftErrors(recipe, draft, candidate, 'settings'), hops = yeastRecipeHopSummary(recipe);
  const effect = (e: YeastRecipeEffect) => effects.push(e);
  const source = profile?.source ?? reference?.source;
  const directPitchGuide = reference && YEAST_PRACTICAL_GUIDES[reference.id];
  const directPitch = directPitchGuide?.form === candidate?.form ? directPitchGuide?.directPitchTemperatureC : undefined;
  if (directPitch && finite(draft.pitchTempC) && selectedTemperature &&
    (draft.pitchTempC < selectedTemperature.range.min || draft.pitchTempC > selectedTemperature.range.max) &&
    draft.pitchTempC >= directPitch.min && draft.pitchTempC <= directPitch.max) {
    warnings.push(`${format(draft.pitchTempC, '°C')} à l’ajout : plage documentée pour l’ensemencement direct de ce produit. Vérifier la méthode prévue ; la consigne principale conserve sa propre fenêtre.`);
    effect({ id: 'direct-pitch', label: 'Préparation de la levure', impact: 'Méthode d’ajout direct à confirmer', detail: 'La plage d’ajout direct ne remplace ni la température de réhydratation ni la fenêtre de fermentation.', state: 'conditional', source: directPitchGuide?.notes.find(n => n.id === 'direct-pitch')?.source });
  }
  if (!reference && draft.yeastId) warnings.push('Référence de souche introuvable ; les propriétés d’une autre souche ne sont pas substituées.');
  if (phenolic.conflict && (draft.goal === 'clove' || draft.ferulicRest || ferulicRestIndex(recipe.mash?.steps ?? []) >= 0)) warnings.push('Capacité phénolique non concordante ou non interprétable : aucun effet du repos férulique n’est affirmé.');
  if (diastatic.conflict) warnings.push('Statut diastatique / STA1 non concordant ou non interprétable : vérifier les sources de la référence.');
  if (candidate?.form === 'sèche' && draft.quantityG === undefined) warnings.push('Quantité de levure sèche à renseigner en grammes ; consulter la plage puis saisir la quantité réellement prévue.');
  if (reference?.form && candidate?.form && reference.form !== candidate.form) warnings.push(`Forme choisie : ${candidate.form} ; produit documenté : ${reference.form}. Les doses et protocoles de ce conditionnement ne sont pas transférés.`);
  if (recipe.fermentation?.some(s => s.kind === 'primaire') && (draft.temperatureC === undefined || draft.days === undefined)) warnings.push('Une température ou durée laissée vide conserve la phase existante ; modifier son programme dans Fermentation.');
  if (draft.styleId === 'unknown') warnings.push('Style non reconnu : choisis une famille ou conserve explicitement un choix libre.');
  if (candidate && draft.styleId !== 'unknown' && candidate.styleMatch !== 'documented') warnings.push(candidate.styleMatch === 'excluded'
    ? 'Une source déconseille cette famille pour cette culture. Consulte les usages avant de la choisir.'
    : 'Usage non documenté pour cette famille. Le scénario reste accessible ; confirme la compatibilité avec ton style.');
  warnings.push(...candidate?.evidence.warnings ?? []);
  if (candidate) effect({ id: 'strain', label: 'Souche', impact: candidate.descriptor, detail: candidate.reason, state: candidate.evidence.descriptor ? 'documented' : 'unknown', source: candidate.evidence.descriptorSource });
  const oldT = recipe.fermentation?.find(s => s.kind === 'primaire')?.tempC, t = draft.temperatureC;
  if (!finite(t)) effect({ id: 'temperature', label: 'Température', impact: 'Consigne à renseigner', detail: 'La plage de conduite ne choisit pas ta consigne.', state: 'unknown', source: selectedTemperature?.sources[0] });
  else if (profile?.temperatureEsters && candidate?.temperature && t >= candidate.temperature.range.min && t <= candidate.temperature.range.max) {
    const delta = finite(oldT) ? t - oldT : undefined;
    effect({ id: 'temperature', label: 'Température', impact: delta === undefined || delta === 0 ? 'Tendance documentée, sans gain chiffré' : delta > 0 ? 'Esters potentiellement favorisés' : 'Esters potentiellement moins présents',
      detail: `Pour cette souche, Wyeast associe une température accrue à davantage d’esters. ${draft.goal === 'clove' ? 'Moins d’esters peut rendre le girofle plus perceptible ; cela ne prédit pas davantage de 4-VG.' : 'Dose, densité et moût interviennent aussi ; aucune intensité de banane n’est calculée.'}`, state: 'conditional', source });
  } else effect({ id: 'temperature', label: 'Température', impact: selectedTemperature ? `${format(t, '°C')} · ${t >= selectedTemperature.range.min && t <= selectedTemperature.range.max ? 'dans la fenêtre' : 'hors fenêtre'}` : 'Fenêtre absente ou contradictoire',
    detail: 'Pas de relation température–goût calibrée pour cette souche et ce moût. Les tendances d’une autre souche ne sont pas transférées.',
    state: selectedTemperature && (t < selectedTemperature.range.min || t > selectedTemperature.range.max) ? 'warning' : 'unknown', source: selectedTemperature?.sources[0] });
  if (draft.goal === 'banana' && ['wyeast-3068', 'wyeast-3638'].includes(draft.yeastId)) effect({ id: 'pitch-esters', label: 'Ensemencement', impact: 'Dose et viabilité comptent', detail: 'Wyeast relie un inoculum moindre aux esters et signale l’effet inverse d’un surensemencement. Ne réduis pas automatiquement la dose : commence par connaître les cellules viables.', state: 'conditional', source });
  if (draft.goal === 'banana' && draft.yeastId === 'lallemand-munich-classic') effect({ id: 'pitch-esters', label: 'Ensemencement', impact: 'Effet propre à Munich Classic observé', detail: 'Des essais Lallemand sur moût à 12 °P relient une dose plus faible à davantage d’acétate d’isoamyle. Ce résultat ne fixe pas une dose aromatique optimale pour ta recette.', state: 'conditional', source: YEAST_RECIPE_SOURCES.ferulic });
  const steps = recipe.mash?.steps ?? [], hasRest = ferulicRestIndex(steps) >= 0;
  if (draft.goal === 'clove' || draft.ferulicRest || hasRest) effect({ id: 'ferulic', label: 'Empâtage · girofle',
    impact: hasRest ? 'Repos déjà présent avant saccharification' : draft.ferulicRest ? 'Précurseur potentiellement favorisé' : 'Repos férulique absent',
    detail: phenolic.value === true ? `${hasRest ? 'Le repos existant est conservé.' : draft.ferulicRest ? 'Proposition L’Affinée : 44 °C / 15 min avant saccharification ; la durée est éditoriale.' : 'Un repos vers 43–45 °C est un levier possible.'} Il peut libérer du précurseur de 4-VG ; ni proportion de blé ni durée ne prédisent un goût chiffré. Le pH de l’eau n’est pas modifié.` : 'Capacité phénolique non documentée ici : le repos ne garantit pas un caractère girofle.',
    state: phenolic.value === true ? 'conditional' : 'unknown', source: YEAST_RECIPE_SOURCES.ferulic });
  if (draft.pressureBar !== undefined) effect({ id: 'pressure', label: 'Pression pendant la fermentation',
    impact: positive(draft.pressureBar) ? 'Esters potentiellement freinés' : 'Sans surpression déclarée',
    detail: positive(draft.pressureBar) ? 'L’acétate d’isoamyle (banane) peut être freiné par le CO₂ ; la réponse dépend de la souche et de la cuve. Pas de seuil ni de perte par bar validés pour ce scénario. Ce réglage décrit la phase de production des arômes, pas la carbonatation finale.' : '0 bar relatif ne garantit pas une production d’esters : souche, dose et moût restent déterminants.',
    state: positive(draft.pressureBar) && (draft.goal === 'banana' || draft.goal === 'fruit') ? 'warning' : 'conditional', source: YEAST_RECIPE_SOURCES.pressure });
  if (diastatic.value !== undefined) effect({ id: 'diastatic', label: 'Finition', impact: diastatic.value ? 'Souche diastatique / STA1 positif documenté' : 'Souche non diastatique / STA1 négatif documenté',
    detail: diastatic.value ? 'La baisse de densité peut continuer après l’activité principale. Suivre sa stabilité et maîtriser la contamination croisée ; aucun jour de fin automatique.' : 'Ce caractère ne dispense pas du contrôle de fin, notamment après un houblonnage à cru.', state: diastatic.value ? 'warning' : 'documented', source: diastatic.source });
  if (profile?.headspacePct) effect({ id: 'headspace', label: 'Cuve et mousse', impact: `${profile.headspacePct} % d’espace libre demandé`, detail: 'Wyeast signale une fermentation haute vigoureuse. Vérifie la capacité utile de la cuve face au volume réellement ensemencé.', state: 'documented', source });
  if (candidate?.doseG) {
    const dose = candidate.doseG.range, q = draft.quantityG;
    effect({ id: 'dose', label: 'Dose sèche', impact: `${format(dose.min)}–${format(dose.max, 'g')} pour ${format(recipe.volumeL, 'L')}`,
      detail: `${finite(q) && (q < dose.min || q > dose.max) ? 'Quantité saisie hors de ce repère. ' : ''}Conversion des g/hL fabricant si ce volume de moût entre au fermenteur. Adapter au moût et au lot ; aucune masse de sachet ni viabilité supposée.`, state: finite(q) && (q < dose.min || q > dose.max) ? 'warning' : 'documented', source: candidate.doseG.source });
  } else effect({ id: 'dose', label: 'Ensemencement', impact: candidate?.form === 'sèche' ? 'Dose sèche non documentée ou volume manquant' : 'Besoin en cellules à calculer', detail: candidate?.form === 'sèche' ? 'Aucune quantité n’est déduite de la taille supposée d’un sachet.' : 'Saisis un taux cible et des cellules viables connues ; mL, âge ou nombre de flacons ne suffisent pas.', state: 'unknown' });
  if (hops.additions.length) {
    effect({ id: 'hop-creep', label: 'Houblons · fin de fermentation', impact: 'Recontrôler après le dernier ajout à cru', detail: 'Les enzymes du houblon peuvent libérer des sucres puis relancer la fermentation. Vérifier séparément stabilité de densité et diacétyle avant conditionnement ; le froid et le retrait des houblons ne prouvent pas l’arrêt.', state: 'warning', source: YEAST_RECIPE_SOURCES.hopCreep });
    if (hops.additions.some(h => h.phase === 'active')) effect({ id: 'hop-active', label: 'Houblons · contact actif', impact: 'Contact avec la levure et pertes possibles', detail: 'La fermentation active permet certains contacts et transformations ; le CO₂ et l’adsorption peuvent aussi retirer des arômes. Effets différents selon les molécules, sans gain ni perte universels.', state: 'conditional', source: YEAST_RECIPE_SOURCES.hopContact });
    if (hops.additions.some(h => h.phase === 'post')) effect({ id: 'hop-post', label: 'Houblons · après fermentation', impact: 'Contrôle de densité après cet ajout', detail: '« Après fermentation » ne signifie pas absence de levure. Prévoir une nouvelle vérification après le contact, sans date de fin déduite du calendrier.', state: 'conditional', source: YEAST_RECIPE_SOURCES.hopCreep });
    if (hops.unknownCount) warnings.push(`${hops.unknownCount} ajout(s) à cru : contexte actif / après fermentation inconnu. Un numéro de jour ne permet pas de le déduire.`);
    if (hops.additions.some(h => h.contactHours === undefined)) warnings.push('Durée de contact manquante pour un ajout à cru ; à préciser dans Houblons.');
    if (hops.totalG === undefined) warnings.push('Masse de houblon à cru manquante ou invalide : le total et les g/L restent inconnus.');
  }
  if (draft.goal === 'hops' || draft.styleId === 'hazy-ipa') effect({ id: 'hop-sensory', label: 'Houblons · fruité', impact: 'Thiols mesurés ≠ fruité prédit', detail: 'Les précurseurs du lot, la souche et le procédé interagissent. Une activité β-lyase ou une concentration de thiols ne produit pas un score de goût.', state: 'conditional', source: YEAST_RECIPE_SOURCES.sensoryLimit });
  const wheatVariant = /\b(dunkles|dunkelweizen|weizenbock)\b/.test(textKey(resolveBrewingStyle(recipe.style, recipe.styleRef)?.name ?? recipe.styleRef?.styleId ?? `${recipe.style} ${recipe.name}`));
  const currentIbu = hotBitterness(recipe.hops, recipe.volumeL, recipe.ogTarget, recipe.boilMin).total;
  if (draft.styleId === 'weissbier' && (hops.additions.length || !wheatVariant && (finite(currentIbu) && currentIbu > 15 || finite(recipe.ibuTarget) && recipe.ibuTarget > 15))) effect({ id: 'style-hops', label: 'Weizen · équilibre', impact: 'Houblonnage à comparer à l’expression levure',
    detail: `${wheatVariant ? 'Le repère d’amertume dépend du style exact : Dunkles Weissbier et Weizenbock ont leurs propres plages.' : 'Le repère BJCP Weissbier clair donne 8–15 IBU et privilégie le caractère de fermentation.'} IBU calculés à chaud : ${format(currentIbu)} ; cible saisie : ${format(recipe.ibuTarget)}. Un dry-hop modifie aussi la lecture aromatique, même sans IBU élevés ; aucune pénalité de banane calculée.`, state: 'conditional', source: YEAST_RECIPE_SOURCES.weissbier });
  if (draft.styleId === 'witbier' && recipe.adjuncts?.length) effect({ id: 'wit-adjuncts', label: 'Wit · ingrédients', impact: 'Comparer épices ajoutées et phénols de la souche', detail: `Ajouts présents : ${recipe.adjuncts.map(a => a.name).join(', ')}. Leur présence ne mesure pas l’intensité finale ; régler les apports dans leur étape.`, state: 'conditional', source });
  const proposed = !errors.length ? proposedRecipe(recipe, draft, candidate, refs, 'settings') : recipe;
  const projection = projectYeastRecipe(proposed, { reference, process: draft.process, cultureRoles: draft.cultureRoles ?? [] });
  const temperature = projection.dossier.temperature;
  warnings.push(...fermentationProgramIssues(proposed.fermentation ?? [], temperature?.qualifier === 'range' ? { range: temperature.range, source: temperature.sources[0] } : undefined,
    { pitchTempC: proposed.yeast.pitchTempC, hasDryHop: !!hops.additions.length, requireWindow: false, windowLabel: 'plage de conduite retenue' }).map(i => i.message), ...projection.warnings);
  if (draft.programme && draft.styleId === 'lager') {
    const primary = proposed.fermentation?.find(p => p.kind === 'primaire'), cleanup = proposed.fermentation?.find(p => p.kind === 'reposDiacetyle');
    if (primary && cleanup && finite(primary.tempC) && finite(cleanup.tempC) && (cleanup.tempC - primary.tempC < 2 || cleanup.tempC - primary.tempC > 4)) warnings.push(`Repos : écart de ${format(cleanup.tempC - primary.tempC, '°C')} avec la primaire, hors du repère documentaire +2–4 °C. Ne pas supposer le même effet de nettoyage.`);
  }
  const activeHopTemperatureConflicts = hops.additions.filter(h => h.phase === 'active' && finite(draft.temperatureC) && h.temperatureC !== draft.temperatureC);
  if (activeHopTemperatureConflicts.length && !draft.alignActiveHopTemperature) warnings.push(`Température de contact distincte pour ${activeHopTemperatureConflicts.map(h => h.name).join(', ')} : conserver ces consignes ou les aligner explicitement sur la primaire.`);
  if (draft.styleId === 'sour' && draft.process === 'unspecified') warnings.push('Procédé acidulé à préciser : moût pré-acidifié, levure acidifiante ou cultures mixtes. Le style seul ne définit pas la fermentation.');
  return { candidate, effects, fg: projection.fg, abv: projection.abv, projection, activeHopTemperatureConflicts, doseG: candidate?.doseG, hops, warnings: [...new Set(warnings)], errors: [...new Set(errors)], changes: changesFor(recipe, draft, candidate, refs), sources: uniqueSources([...candidate?.sources ?? [], ...effects.map(e => e.source), ...projection.fg.sources]) };
}

/** The explicit commit boundary. Goals alone never rewrite hops, saccharification, targets, conditioning or ingredient events. */
export function applyYeastRecipeDesign<T extends TrialRecipe>(recipe: T, draft: YeastRecipeDraft, refs: YeastReference[], mode: 'strain' | 'settings' = 'settings'): T {
  if (mode === 'settings') draft = withProgrammePrimary(draft);
  const reference = refs.find(r => r.id === draft.yeastId), candidate = reference && candidateFor(reference, draft.goal, recipe.volumeL, draft.styleId, draftForm(draft, reference));
  if (reference) { const { aliases: _aliases, ...knowledge } = reference; assertHopKnowledge(knowledge); }
  const errors = draftErrors(recipe, draft, candidate, mode); if (errors.length) throw Error(errors[0]);
  const next = proposedRecipe(recipe, draft, candidate, refs, mode);
  const previous = readYeastRecipeDesign(recipe);
  const scenario = mode === 'settings' ? draft : previous?.yeastId === draft.yeastId ? previous : undefined;
  const snapshot: YeastRecipeDesignSnapshot = { modelVersion: 'yeast-recipe-2', yeastId: draft.yeastId, styleId: draft.styleId, goal: draft.goal,
    ...(mode === 'settings' && draft.pressureBar !== undefined ? { pressureBar: draft.pressureBar } : mode === 'strain' && previous?.yeastId === draft.yeastId && previous.pressureBar !== undefined ? { pressureBar: previous.pressureBar } : {}),
    ferulicRest: ferulicRestIndex(next.mash?.steps ?? []) >= 0,
    process: scenario?.process ?? 'unspecified',
    ...(scenario?.cultureRoles ? { cultureRoles: structuredClone(scenario.cultureRoles) } : {}),
    ...(scenario?.pitchRateMillionPerMlPlato !== undefined ? { pitchRateMillionPerMlPlato: scenario.pitchRateMillionPerMlPlato } : {}),
    ...(scenario?.viableCellsBillion !== undefined ? { viableCellsBillion: scenario.viableCellsBillion } : {}),
    ...(scenario?.programme ? { programme: structuredClone(next.fermentation ?? []) } : {}),
    ...(draft.beerTarget ? { beerTarget: readYeastBeerTarget(draft.beerTarget)! } : {}),
    applied: { yeast: next.yeast, volumeL: next.volumeL, fermentation: next.fermentation ?? [], mashSteps: next.mash?.steps ?? [],
      ...(draft.beerTarget ? { fermentables: next.fermentables, efficiencyPct: next.efficiencyPct ?? null, ogTarget: next.ogTarget ?? null, boilMin: next.boilMin } : {}),
      hops: next.hops, style: next.style ?? '', ...(next.styleRef ? { styleRef: next.styleRef } : {}) } };
  return { ...next, yeastDesign: structuredClone(snapshot) };
}

export function readYeastRecipeDesign(recipe: TrialRecipe): YeastRecipeDesignSnapshot | undefined {
  const s = (recipe as RecipeWithDesign).yeastDesign;
  const optionalNumber = (value: unknown, min = -Infinity, max = Infinity) => value == null || finite(value) && value >= min && value <= max;
  const optionalText = (value: unknown) => value === undefined || typeof value === 'string';
  if (!s || !['yeast-recipe-1', 'yeast-recipe-2'].includes(s.modelVersion) || typeof s.yeastId !== 'string' || s.modelVersion === 'yeast-recipe-1' && !s.yeastId || !YEAST_STYLE_FAMILIES.some(f => f.id === s.styleId) ||
    !knownGoal(s.goal) || typeof s.ferulicRest !== 'boolean' ||
    s.pressureBar !== undefined && (!finite(s.pressureBar) || s.pressureBar < 0) || !s.applied || typeof s.applied.yeast?.name !== 'string' ||
    !finite(s.applied.volumeL) || s.applied.volumeL < 0 || (s.applied.yeast.hopIndexId ?? '') !== s.yeastId || !Array.isArray(s.applied.fermentation) || !Array.isArray(s.applied.mashSteps) ||
    !optionalNumber(s.applied.yeast.qty, 0) || !optionalText(s.applied.yeast.unit) ||
    s.applied.yeast.form !== undefined && !['sèche', 'liquide', 'levain', ''].includes(s.applied.yeast.form) ||
    !(['pitchTempC', 'fermTempMinC', 'fermTempMaxC'] as const).every(key => optionalNumber(s.applied.yeast[key])) ||
    !optionalNumber(s.applied.yeast.attenuationPct, 0, 100) || !optionalNumber(s.applied.yeast.fermentDays, 0) ||
    !optionalNumber(s.applied.yeast.alcoholTolerancePct, 0, 100) || !optionalText(s.applied.yeast.flocculation) || !optionalText(s.applied.yeast.technicalSource) ||
    s.applied.yeast.technicalFacts !== undefined && !readYeastTechnicalFacts(s.applied.yeast.technicalFacts) ||
    s.applied.yeast.attenuationBasis !== undefined && !['declared', 'recipe', 'measured'].includes(s.applied.yeast.attenuationBasis) ||
    s.process !== undefined && !['unspecified', 'preacidified', 'acidifying-yeast', 'mixed-culture'].includes(s.process) ||
    !optionalNumber(s.pitchRateMillionPerMlPlato, Number.MIN_VALUE) || !optionalNumber(s.viableCellsBillion, 0) ||
    s.cultureRoles !== undefined && (!Array.isArray(s.cultureRoles) || !s.cultureRoles.every(c => c && typeof c.name === 'string' && c.name.trim() && ['alcoholic', 'acidifying', 'conditioning', 'mixed'].includes(c.role))) ||
    s.programme !== undefined && (!validProgramme(s.programme) || fermentationStateKey(s.programme) !== fermentationStateKey(s.applied.fermentation)) ||
    s.beerTarget !== undefined && !readYeastBeerTarget(s.beerTarget) ||
    s.applied.fermentables !== undefined && (!Array.isArray(s.applied.fermentables) || !s.applied.fermentables.every(f => f && typeof f.name === 'string' && optionalNumber(f.weightKg, 0) && optionalNumber(f.potentialPpg, 0) && optionalNumber(f.fermentabilityPct, 0, 100))) ||
    !optionalNumber(s.applied.efficiencyPct, 0, 100) || !optionalNumber(s.applied.ogTarget) || !optionalNumber(s.applied.boilMin, 0) ||
    s.applied.hops !== undefined && (!Array.isArray(s.applied.hops) || !s.applied.hops.every(h => h && typeof h.name === 'string' && optionalNumber(h.weightG, 0) && optionalNumber(h.aromaTemperatureC) && optionalNumber(h.tempC))) ||
    !(['lab', 'strain', 'notes', 'stockItemRef'] as const).every(key => optionalText(s.applied.yeast[key])) ||
    s.applied.style !== undefined && typeof s.applied.style !== 'string' ||
    s.applied.styleRef !== undefined && (!s.applied.styleRef || typeof s.applied.styleRef.guideId !== 'string' || typeof s.applied.styleRef.version !== 'string' || typeof s.applied.styleRef.styleId !== 'string') ||
    !s.applied.fermentation.every(p => p && typeof p.name === 'string' && ['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(p.kind) && optionalNumber(p.tempC) && optionalNumber(p.days, 0) && optionalText(p.note)) ||
    !s.applied.mashSteps.every(p => p && typeof p.name === 'string' && optionalNumber(p.tempC) && optionalNumber(p.durationMin, 0))) return undefined;
  return s;
}

export function yeastRecipeDesignChanged(recipe: TrialRecipe, snapshot: YeastRecipeDesignSnapshot): boolean {
  return !recipeStyleUnchanged(recipe, snapshot) || fermentationStateKey(recipe.yeast) !== fermentationStateKey(snapshot.applied.yeast) || recipe.volumeL !== snapshot.applied.volumeL ||
    fermentationStateKey(recipe.fermentation ?? []) !== fermentationStateKey(snapshot.applied.fermentation) ||
    fermentationStateKey(recipe.mash?.steps ?? []) !== fermentationStateKey(snapshot.applied.mashSteps) ||
    snapshot.applied.hops !== undefined && fermentationStateKey(recipe.hops) !== fermentationStateKey(snapshot.applied.hops) ||
    snapshot.applied.fermentables !== undefined && (fermentationStateKey(recipe.fermentables) !== fermentationStateKey(snapshot.applied.fermentables) ||
      (recipe.efficiencyPct ?? null) !== snapshot.applied.efficiencyPct || (recipe.ogTarget ?? null) !== snapshot.applied.ogTarget || recipe.boilMin !== snapshot.applied.boilMin);
}

/** Save only the target and its comparison baseline, without normalising legacy
 * quantities, culture settings or other pending recipe-design edits. */
export function applyYeastBeerTargetIntent<T extends TrialRecipe>(recipe: T, target: YeastBeerTarget | undefined, refs: YeastReference[]): T {
  const clean = target === undefined ? undefined : readYeastBeerTarget(target);
  if (target !== undefined && !clean) throw Error('Cible de bière invalide : vérifier les plages et leurs unités.');
  const draft = createYeastRecipeDraft(recipe, refs), previous = readYeastRecipeDesign(recipe);
  const snapshot: YeastRecipeDesignSnapshot = { modelVersion: 'yeast-recipe-2', yeastId: recipe.yeast.hopIndexId ?? '', styleId: draft.styleId, goal: draft.goal,
    ferulicRest: draft.ferulicRest, process: draft.process,
    ...(draft.cultureRoles ? { cultureRoles: structuredClone(draft.cultureRoles) } : {}),
    ...(draft.pressureBar !== undefined ? { pressureBar: draft.pressureBar } : {}),
    ...(draft.pitchRateMillionPerMlPlato !== undefined ? { pitchRateMillionPerMlPlato: draft.pitchRateMillionPerMlPlato } : {}),
    ...(draft.viableCellsBillion !== undefined ? { viableCellsBillion: draft.viableCellsBillion } : {}),
    ...(previous?.programme && fermentationStateKey(previous.programme) === fermentationStateKey(recipe.fermentation ?? []) ? { programme: structuredClone(previous.programme) } : {}),
    ...(clean ? { beerTarget: clean } : {}),
    applied: { yeast: structuredClone(recipe.yeast), volumeL: recipe.volumeL, fermentation: structuredClone(recipe.fermentation ?? []), mashSteps: structuredClone(recipe.mash?.steps ?? []),
      hops: structuredClone(recipe.hops), fermentables: structuredClone(recipe.fermentables), efficiencyPct: recipe.efficiencyPct ?? null, ogTarget: recipe.ogTarget ?? null, boilMin: recipe.boilMin,
      style: recipe.style ?? '', ...(recipe.styleRef ? { styleRef: structuredClone(recipe.styleRef) } : {}) } };
  return { ...recipe, yeastDesign: snapshot };
}

/** Complete local reference facts in the same transaction as an explicit application.
 * A later edit must retain its original comparison baseline. Never call this from
 * an enrichment effect: only a still-current proposal can adopt the completed facts. */
export function completeYeastRecipeDesignApplication<T extends TrialRecipe>(recipe: T, yeast: YeastSpec): T {
  const snapshot = readYeastRecipeDesign(recipe);
  const completed = { ...recipe, yeast };
  if (!snapshot || yeastRecipeDesignChanged(recipe, snapshot)) return completed;
  return { ...completed, yeastDesign: { ...snapshot, applied: { ...snapshot.applied, yeast: structuredClone(yeast) } } };
}

/** Arithmetic helper with an explicit viable-cell pitch target. Never guesses viability, packet count or starter growth. */
export function calculateYeastCellRequirement(input: { volumeL: number; og: number | null; pitchRateMillionPerMlPlato?: number; viableCellsBillion?: number }): {
  plato?: number; requiredBillion?: number; availableBillion?: number; balanceBillion?: number; errors: string[]; reasons: string[];
} {
  const errors: string[] = [], reasons = ['Le taux cible est choisi par le brasseur pour le moût et la souche. La viabilité disponible doit être mesurée ou déclarée ; aucune conversion de flacon ou de starter.'];
  if (!positive(input.volumeL)) errors.push('Volume de moût à ensemencer requis, en litres.');
  if (!finite(input.og) || input.og <= 1 || input.og > 1.25) errors.push('DI requise entre 1,000 et 1,250 SG.');
  if (input.pitchRateMillionPerMlPlato !== undefined && !positive(input.pitchRateMillionPerMlPlato)) errors.push('Taux cible positif requis, en millions de cellules viables/mL/°P.');
  if (input.viableCellsBillion !== undefined && (!finite(input.viableCellsBillion) || input.viableCellsBillion < 0)) errors.push('Nombre de cellules viables positif ou nul, en milliards.');
  const converted = finite(input.og) && input.og > 1 && input.og <= 1.25 ? BrewingMath.sgToPlato(input.og) : undefined;
  const plato = positive(converted) ? converted : undefined;
  if (converted === 0) errors.push('DI trop faible pour la résolution de la conversion en °P ; aucun besoin nul n’est déduit.');
  const requiredBillion = !errors.length && positive(input.pitchRateMillionPerMlPlato) && plato !== undefined ? input.pitchRateMillionPerMlPlato * input.volumeL * plato : undefined;
  const availableBillion = finite(input.viableCellsBillion) && input.viableCellsBillion >= 0 ? input.viableCellsBillion : undefined;
  if (input.pitchRateMillionPerMlPlato === undefined) reasons.push('Taux cible manquant : besoin en cellules inconnu.');
  if (availableBillion === undefined) reasons.push('Cellules viables disponibles inconnues : ni déficit ni excédent déduit.');
  return { plato, requiredBillion, availableBillion, balanceBillion: requiredBillion !== undefined && availableBillion !== undefined ? availableBillion - requiredBillion : undefined, errors, reasons };
}
