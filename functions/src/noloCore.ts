import type { HopRange, HopSource } from './hopIndexSchema.js';
import { NOLO_SUGARS, assertNoloConfig, assertNoloScience, type NoloConfig, type NoloScience, type NoloStrain, type SugarProfile } from './noloSchema.js';

export const NOLO_ENGINE_VERSION = 'nolo-mass-balance-v1';
export interface NoloInput {
  config: NoloConfig; volumeL: number; yeastId: string | null; yeastName: string;
  fermentation: { kind?: string; tempC?: number; days?: number }[];
  mash: { tempC: number; durationMin: number }[];
  dryHop: boolean; mashRatioLKg?: number; untrackedFermentationAdditions?: boolean;
  fermentableBasis?: string;
}
export interface NoloBound {
  min: number; max: number | null;
  kind: 'physical' | 'measurement' | 'experimental' | 'unknown';
  confidence: 'low' | 'medium' | 'high';
}
export interface NoloResult {
  engineVersion: typeof NOLO_ENGINE_VERSION; scienceRef: { id: string; version: string };
  strain: NoloStrain | null; volumeL: number | null;
  presentAbv: NoloBound; remainingAbv: NoloBound; packagedAbv: NoloBound;
  status: 'within' | 'exceeds' | 'indeterminate'; measuredPackaged: boolean;
  manufacturerEstimate: { range: HopRange; applicable: boolean; source: HopSource; limitation: string } | null;
  alerts: { code: string; message: string }[]; nextAction: string;
  stability: { status: 'unverified' | 'documented'; reference: string; checks: string[] };
  aroma: { banana: string; clove: string; numericalPrediction: null; reason: string };
}
type Bound = { min: number; max: number | null };
const zero = (): Bound => ({ min: 0, max: 0 });
const add = (a: Bound, b: Bound): Bound => ({ min: a.min + b.min, max: a.max === null || b.max === null ? null : a.max + b.max });
const scale = (a: Bound, k: number): Bound => ({ min: a.min * k, max: a.max === null ? null : a.max * k });
const unknown = (): Bound => ({ min: 0, max: null });
const key = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function resolveNoloStrain(input: Pick<NoloInput, 'yeastId' | 'yeastName'>, science: NoloScience): NoloStrain | null {
  if (input.yeastId) return science.strains.find(s => s.yeastId === input.yeastId) ?? null;
  const matches = science.strains.filter(s => [s.name, ...s.aliases].some(n => key(n) === key(input.yeastName)));
  return matches.length === 1 ? matches[0] : null;
}
/** Includes the complete ordered process, not just OG; measured beer stays distinct from a changed recipe. */
export function noloInputBasis(input: NoloInput, afterOperationId?: string): string {
  const through=afterOperationId ? input.config.operations.findIndex(o=>o.id===afterOperationId)+1 : 0;
  return JSON.stringify([input.volumeL, input.yeastId, input.yeastName, input.fermentation, input.mash,
    input.dryHop, input.fermentableBasis??null, input.config.process, input.config.wort, input.config.operations.slice(0,through), input.config.secondRunnings ?? null]);
}
function potential(profile: SugarProfile, complete: boolean, strain: NoloStrain | null, science: NoloScience): Bound {
  let total = zero();
  for (const s of NOLO_SUGARS) {
    const ability = strain?.sugars[s] ?? 'unknown';
    if (ability === 'no') continue;
    const r = profile[s];
    if (!r) { if (!complete || s in profile) total = add(total, unknown()); continue; }
    // Fermentation duration/extent is not identified: zero to the stoichiometric ceiling.
    total = add(total, { min: 0, max: r.max * science.ethanolMaxGPerG[s].value });
  }
  if (strain?.hydrolysis === 'positive') total = add(total, unknown());
  return total;
}
export function evaluateNolo(input: NoloInput, currentScience: NoloScience): NoloResult {
  assertNoloConfig(input.config);
  const science = input.config.scienceSnapshot ?? currentScience;
  assertNoloScience(science);
  const c = input.config, strain = resolveNoloStrain(input, science);
  const alerts: NoloResult['alerts'] = [];
  const warn = (code: string, message: string) => { if (!alerts.some(a => a.code === code)) alerts.push({ code, message }); };
  let volume = Number.isFinite(input.volumeL) && input.volumeL > 0 ? input.volumeL : null;
  let ethanol = zero(), pending = volume ? scale(potential(c.wort.sugarsGL, c.wort.sugarsComplete, strain, science), volume) : unknown();
  let kind: NoloBound['kind'] = 'physical', confidence: NoloBound['confidence'] = 'low';
  let startOperation = 0, measuredPackaged = false;
  if (!science.enabled) { pending = unknown(); warn('disabled-science', 'Référence NOLO désactivée : résultat indéterminé.'); }
  if (!strain) warn('strain', 'Assimilation non documentée pour cette souche : compléter son profil ou mesurer l’alcool.');
  if(strain?.hydrolysis==='unknown')warn('hydrolysis','Hydrolyse non caractérisée : les bornes portent uniquement sur les sucres saisis, à souche et matrice constantes. Elles ne couvrent ni contamination ni libération enzymatique ultérieure.');
  if (!c.wort.sugarsComplete) warn('sugars', 'Profil de sucres partiel : l’extrait total ne remplace pas les sucres accessibles à la souche.');
  const measures = c.measurements.filter(m => {
    if (m.abvPct == null || !['primary', 'packaged'].includes(m.stage)) return false;
    if (!m.method.trim() || !/^\d{4}-\d{2}-\d{2}/.test(m.date) || m.afterOperationId && !c.operations.some(o=>o.id===m.afterOperationId) || m.basis !== noloInputBasis(input,m.afterOperationId)) {
      warn('stale-measurement', 'Une analyse n’a pas de contexte, de date ou de méthode correspondant à ce scénario : elle reste consultable sans remplacer le calcul.');
      return false;
    }
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
  const measured = measures.at(-1);
  if (measured?.abvPct) {
    // Derive the volume at sampling from the operations already included; an
    // explicit measured volume supersedes this additive-volume approximation.
    const through=measured.afterOperationId?c.operations.findIndex(o=>o.id===measured.afterOperationId)+1:0;
    for(const o of c.operations.slice(0,through)){
      if(o.kind==='removal')volume=o.finalVolumeL;
      else {const added=o.kind==='aroma'?(o.volumeML===null?null:o.volumeML/1000):o.volumeL;volume=volume===null||added===null?null:volume+added;}
    }
    if (measured.volumeL != null && measured.volumeL > 0) volume = measured.volumeL;
    ethanol = volume ? scale(measured.abvPct, volume * science.ethanolDensityGL.value / 100) : unknown();
    pending = measured.sugarsGL && volume
      ? scale(potential(measured.sugarsGL, measured.sugarsComplete === true, strain, science), volume) : unknown();
    kind = 'measurement'; confidence = measured.abvPct.min === measured.abvPct.max ? 'low' : 'medium';
    if (confidence === 'low') warn('assay-margin', 'Mesure ponctuelle sans marge analytique fournie : ce point ne constitue pas un intervalle statistique.');
    startOperation = measured.afterOperationId ? c.operations.findIndex(o => o.id === measured.afterOperationId) + 1 : 0;
    measuredPackaged = measured.stage === 'packaged' && startOperation === c.operations.length;
    if (measured.stage === 'packaged' && !measuredPackaged) warn('packaged-operations', 'Des opérations suivent l’analyse au conditionnement : résultat projeté, plus une mesure finale.');
  }
  if (input.untrackedFermentationAdditions && !measured) {
    pending = add(pending, unknown());
    warn('recipe-additions', 'Fruits ou sucres de fermentation : renseigner leur contribution dans les opérations NOLO ou mesurer après ces ajouts.');
  }
  for (const o of c.operations.slice(startOperation)) {
    if (o.kind === 'sugar') {
      pending = add(pending, potential(o.sugarsG, o.complete, strain, science));
      if(o.unclassifiedSugarG!==undefined)pending=add(pending,o.unclassifiedSugarG?{min:0,max:o.unclassifiedSugarG.max*Math.max(...Object.values(science.ethanolMaxGPerG).map(p=>p.value))}:unknown());
      volume=volume===null||o.volumeL===null?null:volume+o.volumeL;
      warn('late-sugar', 'Resucrage ou fruit : l’alcool encore formable est inclus ; la carbonatation forcée évite cet apport de sucre.');
    } else if (o.kind === 'aroma') {
      ethanol = add(ethanol, o.volumeML === 0 ? zero() : o.carrierAbvPct && o.volumeML!==null ? scale(o.carrierAbvPct, o.volumeML / 1000 * science.ethanolDensityGL.value / 100) : unknown());
      // Unknown composition: use the largest physical yield, not glucose by default.
      const maxYield = Math.max(...Object.values(science.ethanolMaxGPerG).map(p => p.value));
      pending = add(pending, o.volumeML === 0 ? zero() : o.sugarG ? { min: 0, max: o.sugarG.max * maxYield } : unknown());
      volume=volume===null||o.volumeML===null?null:volume+o.volumeML/1000;
      warn('aroma', 'Restitution : le support alcoolique et les sucres comptent. La dose de produit ne prédit pas une intensité universelle de banane.');
    } else if (o.kind === 'blend') {
      ethanol = add(ethanol, o.volumeL === 0 ? zero() : o.abvPct && o.volumeL!==null ? scale(o.abvPct, o.volumeL * science.ethanolDensityGL.value / 100) : unknown());
      pending = add(pending, o.volumeL === 0 ? zero() : o.remainingSugarG ? { min: 0, max: o.remainingSugarG.max * Math.max(...Object.values(science.ethanolMaxGPerG).map(p => p.value)) } : unknown());
      volume=volume===null||o.volumeL===null?null:volume+o.volumeL;
    } else if (o.kind === 'dilution') {
      volume=volume===null||o.volumeL===null?null:volume+o.volumeL;
    } else {
      if (!o.ethanolRemovedPct || !o.source.trim()) ethanol = unknown();
      else ethanol = {
        min: ethanol.min * (1 - o.ethanolRemovedPct.max / 100),
        max: ethanol.max === null ? null : ethanol.max * (1 - o.ethanolRemovedPct.min / 100)
      };
      volume = o.finalVolumeL;
      warn('removal', 'Désalcoolisation : la fraction retirée porte sur l’alcool présent. Les sucres résiduels ne sont pas supprimés par cette hypothèse.');
    }
  }
  if (['arrested', 'coldContact', 'dealcoholized'].includes(c.process) && !measured) {
    warn('process-assay', 'Ce procédé exige une relation propre à la souche et au protocole ou une analyse après traitement ; aucun arrêt ou retrait automatique n’est supposé.');
  }
  if (c.process === 'secondRunnings') {
    const r = c.secondRunnings;
    if (!r?.recoveredL || r.sg == null || r.ph == null) warn('runnings', 'Mesurer volume, densité et pH récupérés. Le rendement, l’absorption et le pouvoir tampon du malt neuf ne s’appliquent pas aux drêches.');
  }
  const phases = input.fermentation.filter(p => p.kind === 'primaire');
  if (strain?.temperatureC && phases.some(p => p.tempC != null && (p.tempC < strain.temperatureC!.min || p.tempC > strain.temperatureC!.max)))
    warn('temperature', 'Température primaire hors plage documentée de cette souche. Aucun bonus banane n’est appliqué.');
  if (strain?.yeastId === science.la01.yeastId && input.fermentation.some(p => p.kind === 'reposDiacetyle'))
    warn('diacetyl-rest', 'LA-01 : le protocole fabricant ne prévoit pas de repos diacétyle. Vérifier le programme conservé.');
  if (input.dryHop) warn('hop-creep', 'Houblonnage à cru : les enzymes peuvent libérer de nouveaux sucres. Le plafond calculé sur les sucres saisis ne couvre pas le hop creep.');
  if (input.dryHop) pending = add(pending, unknown());
  if (input.mashRatioLKg != null && input.mashRatioLKg > science.waterMashMaxLKg.value)
    warn('thin-mash', 'Empâtage très dilué : hors plage prise en charge par le calcul actuel de pH. Mesurer ou titrer ; ne pas reprendre sa marge standard.');
  const toAbv = (mass: Bound, k: NoloBound['kind']): NoloBound => ({
    ...(volume ? scale(mass, 100 / science.ethanolDensityGL.value / volume) : unknown()), kind: k, confidence: k === 'measurement' ? confidence : 'low'
  });
  // An ABV assay does not require a volume when no later operation is projected.
  // Preserve its original bounds exactly instead of a mass/volume round trip.
  const presentAbv:NoloBound = measured?.abvPct && startOperation===c.operations.length
    ? {...measured.abvPct,kind:'measurement',confidence}:toAbv(ethanol, kind);
  const remainingAbv = toAbv(pending, 'physical');
  const packagedAbv = measuredPackaged ? presentAbv : toAbv(add(ethanol, pending), kind === 'measurement' && pending.max === 0 ? kind : 'physical');
  const status = packagedAbv.min > c.targetAbvPct ? 'exceeds'
    : packagedAbv.max !== null && packagedAbv.max <= c.targetAbvPct ? 'within' : 'indeterminate';
  if (packagedAbv.max !== null && packagedAbv.max > c.targetAbvPct && packagedAbv.min <= c.targetAbvPct)
    warn('possible-excess', 'La plage dépasse la cible : mesurer après conditionnement ou réduire les sucres accessibles.');
  let manufacturerEstimate: NoloResult['manufacturerEstimate'] = null;
  if (strain?.yeastId === science.la01.yeastId && c.wort.ogPlato) {
    const p = c.wort.ogPlato, model = science.la01;
    const applicable = ['restricted','restored'].includes(c.process) && p.min >= model.plato.min && p.max <= model.plato.max &&
      model.mash.length === input.mash.length && model.mash.every((s, i) => s.tempC === input.mash[i]?.tempC && s.minutes === input.mash[i]?.durationMin) &&
      phases.length > 0 && phases.every(s => s.tempC != null && s.tempC >= model.temperatureC.min && s.tempC <= model.temperatureC.max);
    if (p.min >= model.plato.min && p.max <= model.plato.max) manufacturerEstimate = {
      range: { min: model.slope.value * p.min + model.intercept.value, max: model.slope.value * p.max + model.intercept.value },
      applicable, source: model.source, limitation: model.limitation
    };
    if (!applicable) warn('la01-domain', 'Relation LA-01 hors protocole identique : repère documentaire, exclu de la plage de conditionnement.');
  }
  const checks = ['Sucres résiduels et ajouts tardifs', 'pH et CO₂ mesurés dans la bière', 'Conditionnement et stockage', 'Procédé de stabilisation et analyses adaptées'];
  const stability = { status: c.stabilization.validationReference.trim() ? 'documented' as const : 'unverified' as const,
    reference: c.stabilization.validationReference, checks };
  const nextAction = !volume ? 'Renseigner le volume de bière.' : status === 'exceeds' ? 'Réviser le procédé ou les ajouts : la borne basse dépasse la cible.'
    : packagedAbv.max === null ? 'Compléter les sucres accessibles ou saisir une analyse d’alcool avec sa marge et son étape.'
    : !measuredPackaged ? 'Analyser l’alcool après conditionnement pour vérifier la projection.' : 'Documenter la stabilité et comparer le pilote à une bière de référence.';
  return { engineVersion: NOLO_ENGINE_VERSION, scienceRef: { id: science.id, version: science.version }, strain, volumeL: volume,
    presentAbv, remainingAbv, packagedAbv, status, measuredPackaged, manufacturerEstimate, alerts, nextAction, stability,
    aroma: { banana: c.orientation === 'banana' ? 'Objectif banane : essais comparatifs de restitution ou désalcoolisation d’une base aromatique.' : 'Banane non quantifiée dans cette matrice.',
      clove: strain?.pof === 'positive' ? 'Potentiel phénolique documenté ; dépend aussi des précurseurs du moût.' : strain?.pof === 'negative' ? 'Souche documentée POF négative.' : 'POF non documenté pour cette souche.',
      numericalPrediction: null, reason: 'Les coefficients sensoriels d’une bière alcoolisée ne sont pas transférés automatiquement au NOLO.' } };
}
