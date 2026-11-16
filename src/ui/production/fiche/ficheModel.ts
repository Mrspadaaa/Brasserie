import type { Batch } from '../../../types';
import { breweryDay, normalizeBrewDate } from '../../../domain/batchSchedule';
import { recipeBeerColor, type ColorBand } from '../../../domain/beerColor';
import type { YeastPreparationPlan } from '../../../../functions/src/yeastSupplySchema';

/**
 * Modèle pur du port p1 (e1a, e2a, e4c) : aucune donnée neuve, tout sort du brassin et de ses fonctions existantes.
 * Testé par `__tests__/port-p1-modele.test.ts` (à écrire).
 */

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const parse = (swiss: string): Date | null => {
  const n = normalizeBrewDate(swiss);
  if (!n) return null;
  const [d, m, y] = n.split('.').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
/** « Lundi 16.11 » depuis `16.11.2026` (e1a : le titre du bloc de date). */
export function titreDeDate(swiss: string): string {
  const d = parse(swiss);
  if (!d) return '—';
  const j = JOURS[d.getUTCDay()];
  return `${j[0].toUpperCase()}${j.slice(1)} ${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
/** Jour court des graduations du curseur : « lu 16 ». */
export function jourCourt(swiss: string): { nom: string; n: string } {
  const d = parse(swiss);
  if (!d) return { nom: '', n: '' };
  return { nom: JOURS[d.getUTCDay()].slice(0, 2), n: String(d.getUTCDate()) };
}
/** Écart en jours entre deux dates suisses (b − a), `null` si l'une est illisible. */
export function ecartJours(a: string, b: string): number | null {
  const da = parse(a), db = parse(b);
  return da && db ? Math.round((db.getTime() - da.getTime()) / 86400000) : null;
}
/** Les huit jours du curseur de e1a : de la veille de la date dépassée, ou d'aujourd'hui, sur 8 jours. */
export function joursDuCurseur(now: number, depart?: string): string[] {
  const aujourdhui = breweryDay(now);
  const debut = depart && (ecartJours(aujourdhui, depart) ?? 0) < 0 ? aujourdhui : aujourdhui;
  const base = Math.round(((parse(debut) ?? new Date()).getTime() - (parse(aujourdhui) ?? new Date()).getTime()) / 86400000);
  return Array.from({ length: 8 }, (_, i) => breweryDay(now, base + i));
}

export type Faisabilite = 'non' | 'court' | 'oui';
/**
 * Bande du curseur de e1a : le starter (plan de levure du brassin) tient-il le jour choisi ?
 * Même logique que `yeastPreparationState` : sous `leadHours.min` avant l'ensemencement = trop tard ; entre min et max = court.
 * Sans plan de starter : `null` (inconnu, pas de bande inventée).
 */
export function faisabilite(plan: YeastPreparationPlan | undefined, jour: string, now: number): Faisabilite | null {
  if (!plan) return null;
  const cible = Date.parse(plan.targetPitchAt);
  const d = parse(jour);
  if (!d || !Number.isFinite(cible)) return null;
  const heure = new Date(cible);
  const pitch = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), heure.getHours(), heure.getMinutes()).getTime();
  const h = (pitch - now) / 3600000;
  if (h < plan.protocol.leadHours.min) return 'non';
  return h < plan.protocol.leadHours.max ? 'court' : 'oui';
}

/**
 * e1a, le jour proposé quand la date prévue est dépassée : le premier jour (demain ou après) où le starter tient (`faisabilite` = 'oui').
 * Calculé, jamais inventé : sans plan de starter, sans date prévue, ou date pas encore dépassée, `null` (le bloc garde ses deux puces).
 */
export function jourPropose(plan: YeastPreparationPlan | undefined, prevue: string | null, now: number): string | null {
  if (!plan || !prevue) return null;
  if ((ecartJours(prevue, breweryDay(now)) ?? 0) <= 0) return null;
  return joursDuCurseur(now).slice(1).find(j => faisabilite(plan, j, now) === 'oui') ?? null;
}

/**
 * e1a, aperçu du starter : le même plan, décalé pour que l'ensemencement tombe le jour `jour` du curseur.
 * Décalage en jours entiers (24 h) sur `startAt`, `targetPitchAt` et chaque `dueAt` ; rien d'autre ne change.
 */
export function planDecale(plan: YeastPreparationPlan, jour: string): YeastPreparationPlan {
  const cible = Date.parse(plan.targetPitchAt);
  const actuel = Number.isFinite(cible) ? breweryDay(cible) : null;
  const ecart = actuel ? ecartJours(actuel, jour) : null;
  if (!ecart) return plan;
  const dec = (iso: string) => { const t = Date.parse(iso); return Number.isFinite(t) ? new Date(t + ecart * 86400000).toISOString() : iso; };
  return { ...plan, startAt: dec(plan.startAt), targetPitchAt: dec(plan.targetPitchAt), steps: plan.steps.map(s => s.dueAt ? { ...s, dueAt: dec(s.dueAt) } : s) };
}

/** FG visée en bande (jamais un point) : ± 0,002 autour de la FG cible de la recette. Hypothèse de la maquette e2a (1,008 – 1,012 autour de 1,010), à confirmer. */
export const FG_TOLERANCE = 0.002;
export function fgBande(batch: Batch): [number, number] | null {
  const cible = batch.recipeSnapshot?.fgTarget;
  return typeof cible === 'number' && cible > 0 ? [Math.round((cible - FG_TOLERANCE) * 1000) / 1000, Math.round((cible + FG_TOLERANCE) * 1000) / 1000] : null;
}

const asSwiss = (d: string): string | undefined => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  return normalizeBrewDate(iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : d);
};
/** Relevés triés par date, avec leur date suisse. */
export function releves(batch: Batch) {
  return (batch.gravityLog ?? [])
    .map(r => ({ ...r, swiss: asSwiss(r.date) }))
    .filter((r): r is typeof r & { swiss: string } => !!r.swiss && Number.isFinite(r.sg))
    .sort((a, b) => (ecartJours(b.swiss, a.swiss) ?? 0));
}
/** Les derniers relevés égaux (à 0,0005 près) : le palier stable de la garde. */
export function palierStable(batch: Batch, now: number) {
  const r = releves(batch);
  if (!r.length) return null;
  const dernier = r[r.length - 1].sg;
  let i = r.length - 1;
  while (i > 0 && Math.abs(r[i - 1].sg - dernier) < 0.0005) i--;
  const serie = r.slice(i);
  return { sg: dernier, releves: serie, depuis: serie[0].swiss, jours: Math.max(0, ecartJours(serie[0].swiss, breweryDay(now)) ?? 0), egaux: serie.length >= 2 };
}
/** J+n depuis le levurage (ou le brassage) ; `null` si aucune date. */
export function jourN(batch: Batch, now: number): { n: number; date: string } | null {
  const at = batch.brewDay?.pitchedAt;
  const date = at != null ? breweryDay(at) : normalizeBrewDate(batch.brewDate);
  const n = date ? ecartJours(date, breweryDay(now)) : null;
  return date && n !== null ? { n, date } : null;
}

export type Marche = 'fermentation' | 'garde' | 'conditionne' | 'termine';
export const MARCHES: Marche[] = ['fermentation', 'garde', 'conditionne', 'termine'];
export const marcheActuelle = (batch: Batch): number => MARCHES.indexOf(batch.status as Marche);

/**
 * e4c : répartition bouteilles de 33 cl + fûts, bornée par le volume en cuve. Le reste est la perte.
 * Un fût se remplit dans la limite de sa capacité et du volume restant ; les bouteilles prennent d'abord.
 */
export function repartition(cuveL: number, bouteilles33: number, futs: Array<{ id: string; capacityL: number }>) {
  const bt = Math.min(bouteilles33 * 0.33, cuveL);
  let reste = Math.max(0, cuveL - bt);
  const parFut = futs.map(f => { const l = Math.min(f.capacityL, reste); reste -= l; return { ...f, litres: Math.round(l * 100) / 100 }; });
  const total = Math.round((bt + parFut.reduce((s, f) => s + f.litres, 0)) * 100) / 100;
  return { bouteillesL: Math.round(bt * 100) / 100, futs: parFut, totalL: total, pertesL: Math.round((cuveL - total) * 100) / 100 };
}
/**
 * e2a et e4c, volumes d'un brassin conditionné, tous dérivés de `volumePackagedL` (écrit à la mise en bouteille) :
 * bouteilles = n × 0,33 L, reste = ce qui n'est pas en bouteille, capacité des fûts liés.
 * `nonRepartisL` > 0 : le volume conditionné dépasse les contenants. `enFutL` : le litrage du fût quand il n'y en a qu'un et que le reste y tient.
 */
export function volumesConditionnes(batch: Batch, futs: Array<{ capacityL: number }>) {
  const v = batch.volumePackagedL;
  if (v == null || !Number.isFinite(v)) return null;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const bouteillesL = r2((batch.packaging?.bottles33 ?? 0) * 0.33);
  const resteL = r2(Math.max(0, v - bouteillesL));
  const capFutsL = r2(futs.reduce((s, f) => s + f.capacityL, 0));
  return {
    bouteillesL, resteL, capFutsL,
    nonRepartisL: resteL > capFutsL + 0.05 ? r2(resteL - capFutsL) : 0,
    enFutL: futs.length === 1 && resteL > 0 && resteL <= futs[0].capacityL + 0.05 ? resteL : null
  };
}

/**
 * e4c, les dates à droite des marches : seulement ce que le brassin sait. La date d'entrée en garde n'existe pas dans le modèle (jamais inventée) :
 * la garde ne montre que sa fin, la date de conditionnement, quand l'étape est passée.
 */
export function datesDeMarches(batch: Batch, now: number): Record<Marche, string | null> {
  const c = marcheActuelle(batch);
  const debut = jourN(batch, now)?.date;
  const cond = batch.bottlingDate ? asSwiss(batch.bottlingDate) : undefined;
  return {
    fermentation: debut ? `dès ${debut.slice(0, 5)}` : null,
    garde: c > 1 && cond ? `→ ${cond.slice(0, 5)}` : null,
    conditionne: c >= 2 && cond ? cond.slice(0, 5) : null,
    termine: null
  };
}

/** e4c, la teinte de la carte Conditionné : la bande de couleur de la bière, calculée depuis les malts figés. `null` sans couleur de malt (pas de teinte inventée). */
export function teinteBiere(batch: Batch): ColorBand | null {
  const r = batch.recipeSnapshot;
  if (!r) return null;
  return recipeBeerColor(r.fermentables, r.volumeL ?? batch.volumeL)?.band ?? null;
}

/** Bouteilles qui tiennent encore dans la cuve (bande verte du curseur). */
export const bouteillesMax = (cuveL: number, futsL = 0) => Math.max(0, Math.floor((cuveL - futsL) / 0.33 + 1e-9));

export const VERDICTS = ['à refaire', 'à corriger', 'sans suite'] as const;
export type Verdict = (typeof VERDICTS)[number];
const LIGNE_VERDICT = /^Verdict : (à refaire|à corriger|sans suite)\s*$/m;
/**
 * e2a, le verdict du brassin sans champ neuf : une ligne « Verdict : à refaire » dans `notesTasting` (le champ « Dégustation et prochain essai »).
 * `null` = aucun verdict posé.
 */
export const verdictDe = (notes: string | undefined): Verdict | null => (LIGNE_VERDICT.exec(notes ?? '')?.[1] as Verdict | undefined) ?? null;
/** Pose, remplace ou retire (`null`) la ligne de verdict ; le reste de la note ne bouge pas. */
export function avecVerdict(notes: string | undefined, verdict: Verdict | null): string {
  const sans = (notes ?? '').replace(new RegExp(LIGNE_VERDICT.source + '\n?', 'gm'), '').replace(/\n+$/, '');
  if (!verdict) return sans;
  return sans ? `${sans}\nVerdict : ${verdict}` : `Verdict : ${verdict}`;
}
