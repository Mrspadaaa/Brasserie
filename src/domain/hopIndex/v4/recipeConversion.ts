// Conversion de la recette de l'app vers la recette du moteur, et retour par un PATCH (B5, voie p8, 23.10), puis la
// règle d'écriture unique des outils v4 (#165, t6a). Une seule copie : le prototype et l'app importent d'ici.
// Écrite contre le vrai type `Recipe` de l'app (src/types/index.ts, import de type seulement). Décrite dans
// prototypes/houblons-v4/parcours/ARCHITECTURE.md (« ## Conversion de recette ») ; tests :
// prototypes/houblons-v4/tests/conversion-recette.test.ts et tests/unit/hopIndexV4/.
//
// Règles :
// - aller : `toHopRecipe(recette de l'app)` rend la recette du moteur (RecetteParcours), un id stable par ajout
//   (`a1`, `a2`… : la position dans `recipe.hops`, l'app n'a pas d'id) et ce que la conversion a dû supposer ;
// - retour : `versPatch(conversion, recette du moteur)` rend un patch de `hops` (et de `yeast` si la levure a changé),
//   JAMAIS une recette entière : fermentescibles, eau, déroulé, applications V5.5… restent ceux de l'app. Un ajout
//   inchangé revient à l'identique (son objet d'origine) : l'aller-retour est sans perte ;
// - écriture : `appliquerPatchHoublons(recette, patch)` est la seule règle qui pose un patch dans une recette
//   (brouillon du wizard ou recette enregistrée) ; `preparerEcritureHoublons` y ajoute les refus du wizard
//   (lecture seule, profil, autre brouillon). Ni `hopV55Applications` ni `hopV55ColdEvidenceAssociations` n'y changent ;
// - un houblon remplacé ou retiré perd son lot (stockItemRef, hopLotId, α) : les notes du patch le disent ;
// - l'α est celui du LOT de la recette (HopIngredient.alpha), comme la page recette (hotBitterness) ; un α hors de
//   ]0 ; 100] est inconnu (null), jamais 0 ;
// - un moment incomplet (durée d'ébullition, de whirlpool ou température de whirlpool absentes) rend l'IBU de l'ajout
//   inconnu, comme hotBitterness ; une DI d'ébullition inconnue rend l'IBU à chaud de toute la recette inconnu.
import type { HopIngredient, Recipe as RecetteApp, YeastSpec } from '../../../types';
import type { RecipeWizardDraft } from '../../../services/recipeDraft';
import protoData from '../../../data/hopV4/proto-data.json';
import { CATALOGUE, MOMENTS, STOCK, hopRef, yeastInfo, type Addition, type MomentId, type Recipe as RecetteMoteur } from './index';

/** Un ajout de houblon du parcours : un Addition du moteur et ce que le parcours règle librement (même forme que
 * `AjoutParcours` de prototypes/houblons-v4/parcours/src/etat/types.ts, qui peut la réexporter d'ici). */
export interface AjoutParcours extends Addition {
  /** Ébullition : minute d'ajout (fait foi). Whirlpool : durée de contact (minutes), venue de la recette de l'app. */
  minutes?: number;
  jours?: number;
  /** α du lot de la recette (HopIngredient.alpha), en % m/m : null = inconnu ; absent = l'α du stock ou de la plage
   * variétale. Posé par la conversion ; effacé quand le houblon change. */
  alphaLot?: number | null;
  /** Whirlpool : température de contact (°C) de la recette de l'app ; absente = le préréglage du moteur (80 °C). */
  tempC?: number;
  /** Raison pour laquelle le moment de la recette de l'app est incomplet : l'IBU de l'ajout est alors inconnu. */
  momentInconnu?: string;
}
export interface RecetteParcours extends RecetteMoteur {
  additions: AjoutParcours[];
  /** Raison pour laquelle l'IBU à chaud est incalculable pour toute la recette (densité initiale inconnue). */
  ibuInconnu?: string;
}

const BOUILLIR: MomentId[] = ['b60', 'b30', 'b15', 'b10', 'b5', 'b0'];
/** Classe de moment du moteur la plus proche d'une minute d'ébullition (la minute, elle, fait foi). */
export function classeEbullition(minutes: number): MomentId {
  return BOUILLIR.reduce((m, x) => (Math.abs(MOMENTS[x].minutes! - minutes) < Math.abs(MOMENTS[m].minutes! - minutes) ? x : m), 'b60');
}
/** Où se trouve un ajout, en clair (le strict nécessaire à l'écriture ; la forme riche vit dans le parcours). */
type Lieu = { type: 'premierMout' } | { type: 'ebullition'; minutes: number } | { type: 'whirlpool' } | { type: 'dryhop'; phase: 'actif' | 'apres' };
function lieuDe(a: AjoutParcours, recette: RecetteParcours): Lieu {
  const t = MOMENTS[a.moment].timing;
  if (t === 'firstWort') return { type: 'premierMout' };
  if (t === 'boil') return { type: 'ebullition', minutes: a.minutes ?? MOMENTS[a.moment].minutes ?? recette.boilMin };
  if (t === 'whirlpool') return { type: 'whirlpool' };
  return { type: 'dryhop', phase: a.moment === 'dryActive' ? 'actif' : 'apres' };
}

export type { RecetteApp };

export interface OptionsConversion {
  /** DI d'ébullition de l'app (RecipePage.tsx : `yeastRecipeBoilOg`, la DI moins les apports prévus en fermentation).
   * Absente : `ogTarget`, avec une supposition écrite si des fermentescibles entrent en fermentation. null : inconnue. */
  boilOg?: number | null;
  /** α (% m/m) d'un houblon du stock du brasseur, par clé du moteur ; null : pas de lot connu. Sert à poser l'α d'un
   * houblon remplacé. Défaut : le stock de la fixture du moteur. L'app passe son stock réel. */
  alphaDuStock?: (cle: string) => number | null;
}
/** Le lien d'un ajout du moteur avec la recette de l'app. */
export interface LienAjout {
  /** Position dans `recipe.hops` (null : ajout neuf, posé par un outil). */
  index: number | null;
  /** Comment le houblon a été relié à une variété du moteur : l'identifiant de l'index, le nom exact, ou rien. */
  relie: 'hopVarietyId' | 'nom' | null;
  /** Ce que la conversion a supposé pour cet ajout (moment de dry hop, durée de contact…). */
  suppositions: string[];
}
export interface Conversion {
  recette: RecetteParcours;
  /** La recette de l'app d'origine (le patch part d'elle). */
  origine: RecetteApp;
  ajouts: Record<string, LienAjout>;
  /** Suppositions de niveau recette (style, levure, DI). */
  suppositions: string[];
  /** L'α de stock utilisé pour les houblons remplacés (voir OptionsConversion). */
  alphaDuStock: (cle: string) => number | null;
}
/** Ce qui s'écrit dans la recette de l'app (saveRecipeConfirmed({ ...recette, ...patch })). */
export interface PatchRecette { hops: HopIngredient[]; yeast?: YeastSpec }

/** Identifiant stable d'un ajout : sa position dans `recipe.hops` (a1, a2…), comme la maquette (Nugget = a1). */
export const idAjout = (index: number) => `a${index + 1}`;

const alphaDuStockParDefaut = (cle: string): number | null => STOCK.find((s) => s.key === cle)?.alpha ?? null;
const fini = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const plier = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Variétés du moteur par nom et alias pliés (correspondance EXACTE : jamais un nom partiel, comme l'index de l'app).
const PAR_NOM = new Map<string, string>();
for (const h of CATALOGUE) for (const n of [h.name, ...h.aliases]) if (!PAR_NOM.has(plier(n))) PAR_NOM.set(plier(n), h.id);
// Styles BJCP du moteur par code, identifiant et nom pliés.
const STYLES = protoData.styles as unknown as { id: string; code: string; name: string }[];

function cleDe(h: HopIngredient): { cle: string; relie: LienAjout['relie'] } {
  if (h.hopVarietyId && hopRef(h.hopVarietyId)) return { cle: h.hopVarietyId, relie: 'hopVarietyId' };
  const nom = plier(h.name);
  const cryo = /\bcryo\b/.test(nom);
  const id = PAR_NOM.get(cryo ? nom.split('cryo').join(' ').split('hops').join(' ').replace(/\s+/g, ' ').trim() : nom);
  if (id) return { cle: cryo ? `${id}:cryo` : id, relie: 'nom' };
  return { cle: `inconnu:${nom.split(' ').join('-')}`, relie: null };
}

function styleDe(r: RecetteApp): { code: string; supposition: string | null } {
  const id = r.styleRef?.styleId ?? '';
  const parId = STYLES.find((s) => id && (s.id === id || id.endsWith(s.id)));
  if (parId) return { code: parId.code, supposition: null };
  const t = plier(r.style ?? '');
  const parNom = STYLES.find((s) => plier(s.name) === t || plier(s.code) === t);
  if (parNom) return { code: parNom.code, supposition: null };
  return { code: '', supposition: `style « ${r.style} » absent des styles BJCP du moteur : échelle absolue, sans bande de style` };
}

/** α du lot : un nombre dans ]0 ; 100], sinon inconnu (null), jamais 0. */
const alphaDuLot = (a: number) => (fini(a) && a > 0 && a <= 100 ? a : null);

function ajoutDe(h: HopIngredient, i: number, boilMin: number): { ajout: AjoutParcours; lien: LienAjout } {
  const { cle, relie } = cleDe(h);
  const suppositions: string[] = [];
  if (!relie) suppositions.push(`« ${h.name} » n'est relié à aucune variété du moteur (ni hopVarietyId, ni nom exact) : arôme non simulé`);
  const base: AjoutParcours = { id: idAjout(i), hopKey: cle, moment: 'b60', grams: h.weightG, alphaLot: alphaDuLot(h.alpha) };
  let ajout: AjoutParcours;
  switch (h.stage) {
    case 'firstWort': ajout = { ...base, moment: 'fwh' }; break;
    case 'boil': {
      if (!fini(h.timeMin) || h.timeMin < 0) { ajout = { ...base, momentInconnu: 'durée d’ébullition inconnue : IBU incalculable' }; break; }
      ajout = { ...base, moment: classeEbullition(h.timeMin), minutes: h.timeMin };
      if (h.timeMin > boilMin) ajout.momentInconnu = `ajout à ${h.timeMin} min, supérieur aux ${boilMin} min d’ébullition`;
      break;
    }
    case 'whirlpool': {
      ajout = { ...base, moment: 'wp', ...(fini(h.timeMin) ? { minutes: h.timeMin } : {}), ...(fini(h.tempC) ? { tempC: h.tempC } : {}) };
      if (!fini(h.timeMin) || h.timeMin < 0) ajout.momentInconnu = 'durée de whirlpool inconnue : IBU incalculable';
      else if (!fini(h.tempC) || h.tempC < 0 || h.tempC > 100) ajout.momentInconnu = 'température de whirlpool inconnue : IBU incalculable';
      break;
    }
    case 'dryHop': {
      const actif = h.aromaTiming === 'fermentation';
      if (h.aromaTiming !== 'fermentation' && h.aromaTiming !== 'postFermentation') suppositions.push('moment du dry hop non dit : « après fermentation » supposé pour l’arôme');
      ajout = { ...base, moment: actif ? 'dryActive' : 'dryPost' };
      if (fini(h.dayOffset)) ajout.day = h.dayOffset;
      if (fini(h.aromaContactHours) && h.aromaContactHours > 0) ajout.jours = h.aromaContactHours / 24;
      else suppositions.push('durée de contact du dry hop inconnue : 3 j supposés pour l’arôme (conditions de la carte)');
      break;
    }
    default: ajout = { ...base, momentInconnu: 'moment d’ajout inconnu : IBU incalculable' };
  }
  return { ajout, lien: { index: i, relie, suppositions } };
}

/** La recette de l'app lue par le moteur. */
export function toHopRecipe(app: RecetteApp, options: OptionsConversion = {}): Conversion {
  const boilMin = fini(app.boilMin) ? app.boilMin : 60; // le défaut de l'app (RecipePage : recipe.boilMin ?? 60)
  const suppositions: string[] = [];
  const st = styleDe(app);
  if (st.supposition) suppositions.push(st.supposition);
  let og: number | null;
  if (options.boilOg !== undefined) og = options.boilOg;
  else {
    og = fini(app.ogTarget) && app.ogTarget >= 1 ? app.ogTarget : null;
    if (og != null && (app.fermentables ?? []).some((f) => f.use === 'fermentation' && f.weightKg !== 0)) {
      suppositions.push('DI de recette prise pour l’ébullition alors que des fermentescibles entrent en fermentation : passer la DI d’ébullition de l’app (boilOg) pour le même IBU que la page recette');
    }
  }
  const yeastId = app.yeast?.hopIndexId ?? null;
  if (!yeastId) suppositions.push(`levure « ${app.yeast?.name ?? '?'} » sans identifiant de l’index (yeast.hopIndexId) : le moteur suppose US-05 pour l’arôme`);
  const ajouts: Record<string, LienAjout> = {};
  const additions = (app.hops ?? []).map((h, i) => {
    const { ajout, lien } = ajoutDe(h, i, boilMin);
    ajouts[ajout.id] = lien;
    return ajout;
  });
  const recette: RecetteParcours = {
    name: app.name, styleCode: st.code, volumeL: app.volumeL, og: og ?? Number.NaN, boilMin, yeastId,
    ...(fini(app.colorEbc) ? { ebc: app.colorEbc } : {}),
    ...(fini(app.fgTarget) ? { fg: app.fgTarget } : {}),
    ...(fini(app.abvTarget) ? { abv: app.abvTarget } : {}),
    additions,
    ...(og == null ? { ibuInconnu: 'densité initiale inconnue : IBU à chaud incalculables' } : {}),
  };
  return { recette, origine: app, ajouts, suppositions, alphaDuStock: options.alphaDuStock ?? alphaDuStockParDefaut };
}

// ---------- Retour : le patch ----------
const canon = (a: object) => JSON.stringify(Object.entries(a).filter(([, v]) => v !== undefined).sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)));
const CHAMPS_DE_MOMENT = ['timeMin', 'tempC', 'dayOffset', 'aromaTiming', 'aromaContactHours', 'aromaTemperatureC', 'step'] as const;

/** Le patch de la recette de l'app : `hops` (et `yeast` si la levure a changé), et ce qu'il a fallu écrire faute de
 * mieux (notes). Un ajout inchangé revient tel quel ; un ajout changé garde ses autres champs. */
export function versPatch(conv: Conversion, recette: RecetteParcours): { patch: PatchRecette; notes: string[] } {
  const notes: string[] = [];
  const hops = recette.additions.map((a) => {
    const lien = conv.ajouts[a.id];
    const origine = lien && lien.index != null ? conv.origine.hops[lien.index] : null;
    const avant = conv.recette.additions.find((x) => x.id === a.id) ?? null;
    if (origine && avant && canon(avant) === canon(a)) return origine;
    return ingredientDe(a, recette, origine, avant, notes, conv.alphaDuStock);
  });
  // Une ligne de la recette de l'app qu'aucun ajout ne reprend a été retirée : elle disparaît du patch, la note le dit.
  const reprises = new Set(recette.additions.map((a) => conv.ajouts[a.id]?.index).filter((i): i is number => i != null));
  const retires = conv.origine.hops.filter((_, i) => !reprises.has(i));
  for (const h of retires) notes.push(`« ${h.name} » retiré : ${perdu(h)} de la ligne ne sont plus dans la recette`);
  const traces = (conv.origine.hopV55Applications ?? []).length;
  const remplaces = recette.additions.some((x) => conv.ajouts[x.id]?.index != null && conv.recette.additions.find((y) => y.id === x.id)?.hopKey !== x.hopKey);
  if (traces > 0 && (retires.length > 0 || remplaces)) {
    notes.push(`${traces} application(s) V5.5 gardée(s) comme historique : elles décrivent les houblons d’avant ce changement, plus ceux du brouillon`);
  }
  const patch: PatchRecette = { hops };
  if (recette.yeastId !== conv.recette.yeastId && recette.yeastId) {
    const y = yeastInfo(recette.yeastId);
    patch.yeast = { name: y.name ?? recette.yeastId, hopIndexId: recette.yeastId };
    notes.push(`levure changée pour ${patch.yeast.name} : labo, forme, quantité et températures de l’ancienne souche ne sont pas repris`);
  }
  return { patch, notes };
}

/** Ce que perd une ligne remplacée ou retirée : son lot au stock, son lot de réception et son α. */
function perdu(h: HopIngredient): string {
  const morceaux = [h.stockItemRef ? `stockItemRef ${h.stockItemRef}` : null, h.hopLotId ? `hopLotId ${h.hopLotId}` : null,
    fini(h.alpha) && h.alpha > 0 ? `α ${h.alpha} %` : null].filter((x): x is string => !!x);
  return morceaux.length ? morceaux.join(', ') : 'aucun lien de lot ni α';
}

function ingredientDe(a: AjoutParcours, recette: RecetteParcours, origine: HopIngredient | null, avant: AjoutParcours | null, notes: string[],
  alphaDuStock: (cle: string) => number | null): HopIngredient {
  const memeHoublon = !!origine && avant?.hopKey === a.hopKey;
  const ref = hopRef(a.hopKey);
  let h: HopIngredient;
  if (memeHoublon) h = { ...origine! };
  else {
    // Un autre houblon (ou un ajout neuf) : nom et variété du moteur, α de SON lot ; les liens au lot d'origine
    // (stockItemRef, hopLotId) ne valent plus.
    const alpha = alphaDuStock(a.hopKey);
    h = { name: ref?.name ?? a.hopKey, alpha: alpha ?? 0, weightG: a.grams, stage: 'boil', ...(ref ? { hopVarietyId: ref.varietyId } : {}) };
    if (origine) notes.push(`« ${origine.name} » remplacé par « ${h.name} » : ${perdu(origine)} de l’ancienne ligne ne sont pas repris`);
    if (alpha == null) notes.push(`${h.name} : α du lot inconnu, écrit 0 (convention de l’app : α ≤ 0 = inconnu, IBU non calculé)`);
  }
  h.weightG = a.grams;
  if (memeHoublon && fini(a.alphaLot)) h.alpha = a.alphaLot;
  const q = lieuDe(a, recette);
  const stage: HopIngredient['stage'] = q.type === 'premierMout' ? 'firstWort' : q.type === 'ebullition' ? 'boil' : q.type === 'whirlpool' ? 'whirlpool' : 'dryHop';
  // Le moment n'a pas bougé (seule la dose a changé) : les champs de moment de l'app restent tels quels.
  const moment = (x: AjoutParcours) => canon({ m: x.moment, min: x.minutes, j: x.jours, d: x.day, t: x.tempC, i: x.momentInconnu });
  const memeMoment = !!avant && memeHoublon && origine!.stage === stage && moment(avant) === moment(a);
  if (!memeMoment) {
    if (h.stage !== stage) for (const k of CHAMPS_DE_MOMENT) delete h[k];
    h.stage = stage;
    if (q.type === 'ebullition') h.timeMin = q.minutes;
    if (q.type === 'whirlpool') {
      // Le préréglage du moteur (20 min, 80 °C) est écrit s'il manque : ce qui a été calculé est ce qui s'enregistre.
      h.timeMin = a.minutes ?? h.timeMin ?? 20;
      h.tempC = a.tempC ?? h.tempC ?? 80;
    }
    if (q.type === 'dryhop') {
      h.aromaTiming = q.phase === 'actif' ? 'fermentation' : 'postFermentation';
      if (a.jours != null) h.aromaContactHours = a.jours * 24;
      if (a.day != null) h.dayOffset = a.day;
    }
  }
  return h;
}

/** La recette après le patch : SEULS `hops` (et `yeast` si le patch en porte une) changent ; tout le reste de la recette
 * (applications V5.5, preuves de contact à froid, fermentescibles, eau, déroulé…) garde son objet. Pure : la recette
 * reçue n'est pas modifiée. C'est la règle commune du wizard (brouillon) et de la recette enregistrée
 * (`saveRecipeConfirmed(appliquerPatchHoublons(recette, patch))`, branchement T12/T13). */
export function appliquerPatchHoublons(recette: RecetteApp, patch: PatchRecette): RecetteApp {
  return { ...recette, hops: patch.hops, ...(patch.yeast ? { yeast: patch.yeast } : {}) };
}

/** Ce qu'un outil v4 remet au wizard : le brouillon visé et le patch. */
export interface ChangementHoublonsV4 { draftId: string; patch: PatchRecette }
export interface EntreeEcritureHoublons {
  /** Le brouillon conservé est en lecture seule (format futur ou illisible) : rien ne le remplace. */
  draftReadOnly: boolean;
  ownerKey: string | undefined;
  /** L'identifiant du brouillon ouvert dans le wizard. */
  draftRecipeId: string;
  /** Le brouillon courant, tel que le wizard le détient (latestWizardDraft.current). */
  current: RecipeWizardDraft;
  change: ChangementHoublonsV4;
}

const LIENS_PREVISION = ['hopPredictionIds', 'hopTrialId'] as const;
const LIENS_LEVURE = ['yeastGuide', 'yeastDesign', 'hopMatrixId'] as const;
function sans<T extends object>(o: T, cles: readonly string[]): T {
  const copie = { ...o } as Record<string, unknown>;
  for (const c of cles) delete copie[c];
  return copie as T;
}

/**
 * Le brouillon du wizard après un changement d'outil v4 : les mêmes refus que `applyHopV55Change` (lecture seule,
 * profil absent, autre brouillon), puis le brouillon suivant. Rien n'est écrit ici : le wizard sérialise, passe par
 * `writeRecipeDraft` (le point de validation) et seulement ensuite met l'écran à jour.
 * - `hops` (et `yeast`) changent ; `hopV55Applications` et `hopV55ColdEvidenceAssociations` restent, dans la recette
 *   comme dans les détails (l'historique V5.5 n'est jamais effacé par un outil v4) ;
 * - des houblons changés rendent faux les liens de prévision et d'essai (`hopPredictionIds`, `hopTrialId`), comme
 *   dans l'adaptateur J4 de V5.5 : ils sont lâchés ; une levure changée lâche en plus ses guides (selectYeast).
 */
export function preparerEcritureHoublons(e: EntreeEcritureHoublons): { nextDraft: RecipeWizardDraft } {
  if (e.draftReadOnly) throw new Error('Ce brouillon est conservé en lecture seule; aucun outil ne le remplace.');
  if (!e.ownerKey) throw new Error('Le profil propriétaire du brouillon est absent.');
  if (e.change.draftId !== e.draftRecipeId) throw new Error('Ce changement vise un autre brouillon; le brouillon courant n’est pas modifié.');
  const { current } = e;
  const { patch } = e.change;
  const houblonsChangent = patch.hops.length !== current.recipe.hops.length || patch.hops.some((h, i) => h !== current.recipe.hops[i]);
  const levureChange = !!patch.yeast && patch.yeast !== current.recipe.yeast;
  const aLacher = [...(houblonsChangent || levureChange ? LIENS_PREVISION : []), ...(levureChange ? LIENS_LEVURE : [])];
  const recipe = appliquerPatchHoublons(current.recipe, patch);
  return { nextDraft: { ...current, details: sans(current.details, aLacher), recipe: sans(recipe, aLacher) } };
}
