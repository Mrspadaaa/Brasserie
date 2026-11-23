import { nombreFr } from '../../../domain/nombreAffiche';
import type { Batch, FermentationStep, HopIngredient, StockItem } from '../../../types';
import type { HopKnowledge } from '../../../../functions/src/hopPredictionSchema';
import { breweryDay } from '../../../domain/batchSchedule';
import { abvFromGravities } from '../../../domain/gravityBounds';
import { projectYeastRecipe } from '../../../domain/yeastProjection';
import { resolveFermentationYeast } from '../../../domain/fermentationScenario';
import { yeastReferences } from '../../../domain/yeastReferences';
import { parseDecimal } from '../../numericInput';
import { describeFamilies, engineVarieties } from '../../../domain/hopIndex/v4/hops';
import { hopRef } from '../../../domain/hopIndex/v4/data';
import { hopAlpha, hopRole } from '../../../domain/hopIndex/v4/roles';
import { FAMILIES, type FamilyId } from '../../../domain/hopIndex/v4/families';
import { ecartJours, fgBande, jourN, releves } from '../fiche/ficheModel';
import { avecEntree, ecrireBlocs, lireBlocs, instantSuisse } from '../carnet/carnetModel';
import { cuveDansNotes, notesAvecCuve } from './cuve';
import { refDuHoublon } from './destockage';

/**
 * Modèle pur de la fiche en fermentation (port de gfc, 15.11) : tout sort du brassin et de ses fonctions existantes,
 * aucune donnée neuve. Ce que le brassin ne sait pas reste `null` ou absent, jamais 0.
 */

/** `tempC` : température de l'échantillon (corrections de densité) ; `cuveC` : température de la cuve, rangée dans les notes du relevé (cuve.ts). */
export interface Point { jour: number; sg: number; tempC?: number; cuveC?: number; og?: boolean }
export interface Phase { de: number; a: number; ton: 'hop' | 'attention' | 'water'; titre: string; tempC: number }
export interface Tache { jour: number; date: string; titre: string; faite: boolean }
export interface FamilleBarre { id: FamilyId; part: number; sources: number; sur: number }
export interface Houblon {
  cle: string; nom: string; doseG: number; jour: number | null;
  /** α enregistré dans la recette (le lot), `null` si absent. */
  alpha: number | null;
  /** Plage des fiches du catalogue (min, max), `null` si la variété n'est pas associée. */
  plage: [number, number] | null;
  role: string | null;
  familles: FamilleBarre[];
  signature: FamilyId | null;
  associe: boolean;
  /** Article de stock que la ligne réservée porte, si le contexte de stock le résout. */
  ref: string | null;
  /** `fait` : sorti du stock ; `afaire` : réservé, encore au stock ; `sans` : rien de réservé pour lui. */
  statut: 'fait' | 'afaire' | 'sans';
  /** Jour et date (`JJ.MM`) où ce houblon a été déstocké, si les mouvements le portent. */
  ajout: { jour: number; date: string } | null;
}
export interface ModeleFiche {
  /** Jour courant (J+n depuis le levurage). */
  n: number;
  /** Date de départ, `JJ.MM.AAAA`. */
  depart: string;
  nbJours: number;
  /** Numéro du jour dans le mois, deux chiffres, pour chaque colonne. */
  dates: string[];
  /** Les mêmes jours en `JJ.MM` (pour dire « du 10 au 14.11 »). */
  datesJm?: string[];
  points: Point[];
  fg: [number, number] | null;
  og: number | null;
  dernier: Point | null;
  attenuation: number | null;
  alcool: number | null;
  fgConfirmee: boolean;
  phases: Phase[];
  taches: Tache[];
  houblons: Houblon[];
  /** Les ajouts de fermentation sont déstockés (étape « remaining » faite). */
  ajoutsFaits: boolean;
  /** Des ajouts sont réservés et restent à déstocker. */
  ajoutsAFaire: boolean;
  reserveG: number;
  /** Température de cuve relevée aujourd'hui ; sinon « non relevée ». */
  tempAujourdhui: boolean;
  /** Consigne de la phase du jour (°C), `null` sans phase. */
  consigne: number | null;
  egaux: boolean;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

let rarete: Map<FamilyId, number> | null = null;
/** Part des variétés du catalogue qui citent chaque famille : sert à choisir la marque (liseré) d'un houblon, la famille la plus rare parmi ses marquées. */
function raretes(): Map<FamilyId, number> {
  if (rarete) return rarete;
  const vs = engineVarieties() as Array<{ id: string }>;
  const compte = new Map<FamilyId, number>(FAMILIES.map(f => [f, 0]));
  for (const v of vs) { const d = describeFamilies(v.id); for (const f of FAMILIES) if (d[f].sources > 0) compte.set(f, (compte.get(f) ?? 0) + 1); }
  rarete = new Map(FAMILIES.map(f => [f, (compte.get(f) ?? 0) / Math.max(1, vs.length)]));
  return rarete;
}

/** Variété du catalogue : l'association explicite d'abord, sinon un nom identique (jamais un nom partiel : `HopIngredient.hopVarietyId`). */
export function varieteDe(h: Pick<HopIngredient, 'name' | 'hopVarietyId'>): string | null {
  if (h.hopVarietyId) return hopRef(h.hopVarietyId)?.varietyId ?? null;
  const cle = norm(h.name);
  if (!cle) return null;
  const v = (engineVarieties() as Array<{ id: string; name: string; aliases?: string[] }>).find(x => norm(x.name) === cle || (x.aliases ?? []).some(a => norm(a) === cle));
  return v ? v.id : null;
}

export function houblonDe(h: HopIngredient, i: number): Houblon {
  const id = varieteDe(h);
  const al = id ? hopAlpha(id) : null;
  const desc = id ? describeFamilies(id) : null;
  const barres: FamilleBarre[] = desc
    ? FAMILIES.filter(f => desc[f].sources > 0 && desc[f].of > 0)
        .map(f => ({ id: f, part: desc[f].sources / desc[f].of, sources: desc[f].sources, sur: desc[f].of }))
        .sort((a, b) => b.part - a.part).slice(0, 4)
    : [];
  const r = raretes();
  // Marque : la 1re barre, ou une famille plus rare encore très citée mais moins que la 1re (Mosaic : baies derrière tropicaux). Une égalité garde la 1re.
  const marquees = desc ? barres.filter((b, k) => b.part >= 0.85 && (k === 0 || b.part < barres[0].part)) : [];
  const signature = (marquees.length ? [...marquees].sort((a, b) => (r.get(a.id) ?? 1) - (r.get(b.id) ?? 1))[0] : barres[0])?.id ?? null;
  const role = id ? hopRole(id).value : null;
  return {
    cle: `${h.name}-${i}`, nom: h.name, doseG: h.weightG, jour: typeof h.dayOffset === 'number' ? h.dayOffset : null,
    alpha: h.alpha > 0 ? h.alpha : null, plage: al ? [al.min, al.max] : null, role, familles: barres, signature, associe: !!id,
    ref: null, statut: 'sans', ajout: null
  };
}

const TON: Record<string, Phase['ton']> = { primaire: 'hop', reposDiacetyle: 'attention', refermentation: 'attention', garde: 'water' };
const TITRE = (s: FermentationStep): string => s.kind === 'primaire' ? `Fermenter ${tt(s.tempC)}` : s.kind === 'garde' ? `Garde ${tt(s.tempC)}` : s.kind === 'reposDiacetyle' ? `Repos ${tt(s.tempC)}` : `Refermenter ${tt(s.tempC)}`;
const tt = (c: number) => `${String(c).replace('.', ',')} °C`;

/** Les phases de la recette figée sur l'axe des jours : chaque palier de `recipeSnapshot.fermentation` (sauf les ajouts), à la suite. */
export function phasesDe(batch: Batch): Phase[] {
  const out: Phase[] = [];
  let de = 0;
  for (const s of batch.recipeSnapshot?.fermentation ?? []) {
    if (s.kind === 'ajout' || !Number.isFinite(s.tempC)) continue;
    const jours = Number.isFinite(s.days) && s.days > 0 ? Math.round(s.days) : 1;
    out.push({ de, a: de + jours, ton: TON[s.kind] ?? 'attention', titre: TITRE(s), tempC: s.tempC });
    de += jours;
  }
  return out;
}

/** Une tâche par changement de palier : ce que le brasseur règle ce jour-là. Rien d'inventé hors de la recette. */
/**
 * gfc n° 2 : une tâche cochée est une entrée datée du Carnet, rangée dans `notesBrewDay` (champ existant) : « jj.mm.aaaa · Cuve : Fait : <titre> (J+n) ».
 * Cochée = cette entrée existe ; décochée = elle est retirée. Rien d'autre n'est touché dans les notes.
 */
export const texteTache = (t: Pick<Tache, 'titre' | 'jour'>) => `Fait : ${t.titre} (J+${t.jour})`;
export const tacheFaite = (notesBrewDay: string | undefined, t: Pick<Tache, 'titre' | 'jour'>): boolean =>
  lireBlocs(notesBrewDay).some(b => b.kind === 'entree' && b.type === 'cuve' && b.texte === texteTache(t));
export function avecTacheFaite(notesBrewDay: string | undefined, t: Pick<Tache, 'titre' | 'jour'>, now = Date.now()): string {
  if (tacheFaite(notesBrewDay, t)) return notesBrewDay ?? '';
  const { date, heure } = instantSuisse(now);
  return avecEntree(notesBrewDay, { type: 'cuve', date, heure, texte: texteTache(t) });
}
export function sansTacheFaite(notesBrewDay: string | undefined, t: Pick<Tache, 'titre' | 'jour'>): string {
  const cible = texteTache(t);
  return ecrireBlocs(lireBlocs(notesBrewDay).filter(b => !(b.kind === 'entree' && b.type === 'cuve' && b.texte === cible)));
}

export function tachesDe(phases: Phase[], steps: FermentationStep[], dateDe: (j: number) => string, notesBrewDay?: string): Tache[] {
  const utiles = steps.filter(s => s.kind !== 'ajout' && Number.isFinite(s.tempC));
  return phases.slice(1).map((p, i) => {
    const t = { jour: p.de, date: dateDe(p.de), titre: utiles[i + 1]?.kind === 'garde' ? `Garde ${tt(p.tempC)} si stable` : `Cuve à ${tt(p.tempC)}` };
    return { ...t, faite: tacheFaite(notesBrewDay, t) };
  });
}

export const MAX_JOURS = 21;


/** Ce que le stock sait, pour rendre le statut de chaque houblon (réservé / sorti) : sans lui, tous les houblons restent « à faire » tant qu'une ligne est réservée. */
export interface ContexteStock {
  stocks: StockItem[];
  bindings?: Record<string, string>;
  mouvements?: ReadonlyArray<{ id?: string; timestamp?: string }>;
}

export function modeleFiche(batch: Batch, now: number, ctx?: ContexteStock): ModeleFiche | null {
  const j = jourN(batch, now);
  if (!j) return null;
  const pitch = j.date;
  const steps = batch.recipeSnapshot?.fermentation ?? [];
  const phases = phasesDe(batch);
  const og = parseDecimal(batch.og || '');
  const points: Point[] = [];
  if (og !== null && og > 0) points.push({ jour: 0, sg: og, og: true });
  for (const r of releves(batch)) {
    const e = ecartJours(pitch, r.swiss);
    const cuve = cuveDansNotes(r.notes);
    if (e !== null && e >= 0) points.push({ jour: e, sg: r.sg, ...(typeof r.tempC === 'number' && Number.isFinite(r.tempC) ? { tempC: r.tempC } : {}), ...(cuve !== null ? { cuveC: cuve } : {}) });
  }
  points.sort((a, b) => a.jour - b.jour);
  const sc = batch.stockConsumption;
  const reserve = sc?.pendingItems ?? [];
  const faits = !!sc?.completedStages?.includes('remaining');
  const brutes = (batch.recipeSnapshot?.hops ?? []).filter(h => h.stage === 'dryHop' && h.weightG > 0);
  const houblons = brutes.map((h, i) => {
    const base = houblonDe(h, i);
    const ref = ctx ? refDuHoublon(h, ctx.stocks, ctx.bindings) : null;
    const reserveIci = ref ? reserve.some(l => l.stockItemRef === ref) : reserve.length > 0;
    const mouvement = ref && ctx?.mouvements ? jourAjout(ctx.mouvements, batch, pitch, ref) : null;
    const statut: Houblon['statut'] = faits ? 'fait' : reserveIci ? 'afaire' : ref && mouvement ? 'fait' : 'sans';
    const ajout = statut === 'fait' ? (mouvement ?? (ctx?.mouvements ? jourAjout(ctx.mouvements, batch, pitch) : null)) : null;
    return { ...base, ref, statut, ajout };
  });
  const fin = phases.length ? phases[phases.length - 1].a : 0;
  const maxJour = Math.max(fin, j.n + 1, ...points.map(p => p.jour + 1), ...houblons.map(h => (h.jour ?? 0) + 1), 8);
  const nbJours = Math.min(MAX_JOURS, maxJour);
  const dateDe = (k: number) => breweryDay(now, k - j.n).slice(0, 5);
  const dates = Array.from({ length: nbJours }, (_, k) => dateDe(k).slice(0, 2));
  const datesJm = Array.from({ length: nbJours }, (_, k) => dateDe(k));
  const mesures = points.filter(p => !p.og);
  const dernier = points.length ? points[points.length - 1] : null;
  const att = og !== null && og > 1 && dernier && dernier.sg <= og ? Math.round(((og - dernier.sg) / (og - 1)) * 100) : null;
  const abv = og !== null && dernier && !dernier.og ? abvFromGravities(og, dernier.sg) : null;
  const sg2 = mesures.slice(-2);
  const chauds = phases.filter(p => p.ton !== 'water');
  const consigne = (phases.find(p => p.de <= j.n && j.n < p.a && p.ton !== 'water') ?? chauds[chauds.length - 1])?.tempC ?? null;
  return {
    n: j.n, depart: pitch, nbJours, dates, datesJm, points, fg: fgBande(batch), og, dernier,
    attenuation: att, alcool: abv, fgConfirmee: parseDecimal(batch.fg || '') !== null,
    phases, taches: tachesDe(phases, steps, dateDe, batch.notesBrewDay), houblons,
    ajoutsFaits: faits || (houblons.length > 0 && houblons.every(h => h.statut === 'fait')),
    ajoutsAFaire: houblons.some(h => h.statut === 'afaire'),
    reserveG: reserve.reduce((s, l) => s + (l.unit === 'g' ? l.quantity : 0), 0),
    tempAujourdhui: mesures.some(p => p.jour === j.n && (p.cuveC !== undefined || p.tempC !== undefined)),
    consigne,
    egaux: sg2.length === 2 && Math.abs(sg2[0].sg - sg2[1].sg) < 0.0005
  };
}

/** Quand ? « demain », « dans 3 jours »… pour un houblon encore à ajouter. */
export function quandHoublon(jour: number, n: number): string {
  const e = jour - n;
  return e > 1 ? `dans ${e} jours` : e === 1 ? 'demain' : e === 0 ? 'aujourd’hui' : 'à ajouter';
}

/** Le titre-réponse : ce que le brasseur doit savoir d'abord. */
export function titreReponse(m: ModeleFiche): { repos: string; accent?: string } {
  const h = m.houblons.filter(x => x.jour !== null).sort((a, b) => (a.jour as number) - (b.jour as number) || a.nom.localeCompare(b.nom, 'fr'));
  if (h.length) {
    if (m.ajoutsFaits) return { repos: 'Dry hop ajouté' };
    const faits = h.filter(x => x.statut === 'fait'), restants = h.filter(x => x.statut !== 'fait');
    // Un houblon sorti, l'autre encore au stock : le titre dit les deux (« Citra ajouté, Mosaic demain »).
    if (faits.length && restants.length) {
      const noms = [...new Set(faits.map(x => x.nom))];
      return { repos: `${noms.join(' + ')} ajouté${noms.length > 1 ? 's' : ''},`, accent: `${restants[0].nom} ${quandHoublon(restants[0].jour as number, m.n)}` };
    }
    const e = (h[0].jour as number) - m.n;
    if (e > 1) return { repos: `Dry hop dans ${e} jours` };
    if (e === 1) return { repos: 'Dry hop demain' };
    if (e === 0) return { repos: 'Dry hop aujourd’hui' };
    return { repos: 'Dry hop à ajouter' };
  }
  if (m.houblons.length) return { repos: 'Dry hop : jour à fixer' };
  if (m.egaux && m.fg && m.dernier && m.dernier.sg <= m.fg[1] + 1e-9) return { repos: 'FG stable : à confirmer' };
  if (m.dernier && !m.dernier.og) return { repos: 'Prochain relevé de densité' };
  return { repos: 'Premier relevé à prendre' };
}

/**
 * Jour (J+n) où des ajouts de fermentation ont été déstockés : lu dans les mouvements `BREW-STOCK-<lot>-remaining-<article>` ; `null` si rien n'est écrit.
 * Avec `ref`, seul le mouvement de cet article compte (un houblon à la fois) ; sans, le premier de l'étape.
 */
export function jourAjout(mouvements: ReadonlyArray<{ id?: string; timestamp?: string }>, batch: Pick<Batch, 'id'>, depart: string, ref?: string | null): { jour: number; date: string } | null {
  const prefixe = ref ? `BREW-STOCK-${batch.id}-remaining-${ref}` : `BREW-STOCK-${batch.id}-remaining`;
  const t = mouvements.filter(x => typeof x.id === 'string' && (ref ? x.id === prefixe : x.id.startsWith(prefixe)) && x.timestamp).map(x => Date.parse(x.timestamp as string)).filter(Number.isFinite).sort((a, b) => a - b)[0];
  if (t === undefined) return null;
  const date = breweryDay(t), e = ecartJours(depart, date);
  return e === null ? null : { jour: e, date: date.slice(0, 5) };
}

/**
 * État du curseur « Mesurer » : densité en millièmes (m2), température de l'échantillon (`temp`) et de la cuve (`cuve`) en texte
 * (« » = non relevée), saisie de la densité au clavier.
 */
export interface EtatMesure { milli: number; temp: string; cuve?: string; taper: boolean; saisie: string; erreur: string }

export function mesureInitiale(m: ModeleFiche, fgCible?: number): EtatMesure {
  const dep = m.dernier?.sg ?? fgCible ?? 1.01;
  return { milli: Math.round(dep * 1000), temp: '', cuve: '', taper: false, saisie: '', erreur: '' };
}

/**
 * CT4-B-11 : la plage de FG que la levure de la recette donne (« FG 1,012–1,015 plage » de la fiche recette), pour la saisie d'un relevé quand la
 * recette n'écrit pas de FG. Même calcul que `RecipePage` : `projectYeastRecipe` sur la recette du brassin et la référence de sa levure. Sans levure,
 * sans référence ou sans plage : `null` (l'inconnu n'est jamais inventé).
 */
export function plageFgDeLaLevure(batch: Batch, saved?: HopKnowledge[]): [number, number] | null {
  const recette = batch.recipeSnapshot;
  if (!recette?.yeast?.name) return null;
  try {
    const projection = projectYeastRecipe({ ...recette, efficiencyPct: recette.efficiencyPct ?? 75 } as never,
      { og: recette.ogTarget, reference: resolveFermentationYeast(recette as never, yeastReferences(saved)) });
    const plage = projection.fg.range;
    return plage && Number.isFinite(plage.min) && Number.isFinite(plage.max) && plage.min > 1 ? [plage.min, plage.max] : null;
  } catch { return null; }
}

/** Bornes du curseur : du plancher physique de la FG à la densité de départ, arrondie à la dizaine au-dessus. */
export function bornesMesure(m: ModeleFiche): [number, number] {
  const haut = Math.max(m.og ?? 1.06, m.dernier?.sg ?? 0, 1.05);
  return [1000, Math.ceil(haut * 100) * 10];
}

const TEMP_MIN_C = -5;
const TEMP_MAX_C = 45;
/** Valide la saisie (mêmes bornes que `BatchGravityEntry`) et rend le relevé à ajouter au journal, ou l'erreur en mots. La cuve se range dans les notes (cuve.ts). */
export function construireReleve(milli: number, tempTexte: string, dateIso: string, cuveTexte = ''): { reading: { date: string; sg: number; tempC?: number; notes?: string } } | { erreur: string } {
  const sg = milli / 1000;
  if (!Number.isFinite(sg) || sg < 0.99 || sg > 1.2) return { erreur: 'Saisis une densité entre 0,990 et 1,200, par exemple 1,016.' };
  const lire = (texte: string, de: string): number | null | { erreur: string } => {
    const brut = texte.trim();
    if (!brut) return null;
    const t = parseDecimal(brut);
    if (t === null) return { erreur: `Saisis la température ${de}, ou laisse ce champ vide.` };
    if (t < TEMP_MIN_C || t > TEMP_MAX_C) return { erreur: `Saisis une température entre ${nombreFr(TEMP_MIN_C, 0)} et ${nombreFr(TEMP_MAX_C, 0)} °C (${de}), ou laisse ce champ vide.` };
    return t;
  };
  const ech = lire(tempTexte, 'de l’échantillon'), cuve = lire(cuveTexte, 'de la cuve');
  const erreur = (x: number | null | { erreur: string }): x is { erreur: string } => x !== null && typeof x === 'object';
  if (erreur(ech)) return ech;
  if (erreur(cuve)) return cuve;
  return { reading: { date: dateIso, sg, ...(ech !== null ? { tempC: ech } : {}), ...(cuve !== null ? { notes: notesAvecCuve('', cuve) } : {}) } };
}

/** Le relevé du curseur ou de la saisie au clavier (« 1,016 ») : une saisie illisible rend l'erreur en mots, jamais un 0. */
export function releveDepuisEtat(e: EtatMesure, dateIso: string): ReturnType<typeof construireReleve> {
  if (!e.taper) return construireReleve(e.milli, e.temp, dateIso, e.cuve ?? '');
  const v = parseDecimal(e.saisie);
  return v === null ? { erreur: 'Valeur illisible : tape un nombre, par exemple 1,016.' } : construireReleve(Math.round(v * 1000), e.temp, dateIso, e.cuve ?? '');
}
