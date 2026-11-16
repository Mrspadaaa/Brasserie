// e11a : la phrase-réponse en tête de l'onglet (« Pils à confirmer, NEIPA dry hop demain »). Chaque fragment sort d'une donnée du
// brassin ; rien n'est inventé. Aucun fragment vrai : aucune phrase (jamais une phrase de remplissage).
import type { Batch, HopIngredient } from '../../../types';
import { normalizeHop } from '../../../domain/hopStage';
import { fermentationStartedAt } from '../../../domain/productionInsights';

export interface Fragment { texte: string; ton: 'neutre' | 'hop' | 'alerte'; /** fin de phrase en alerte (le retard seul est rouge, e11a) */ fin?: string }

const JOUR = 86400000;
const debutDeJour = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
/** « 2026-11-08 » (ou un horodatage) en début de jour local ; undefined si illisible. */
function dateLocale(v: string | number | undefined | null): number | undefined {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') return debutDeJour(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}
const nom = (b: Batch) => (b.recipeSnapshot?.name ?? b.name ?? '').trim();

/** Planifié dont la date prévue est passée : jours de retard (≥ 1), sinon undefined. */
export function retardDe(b: Batch, maintenant = Date.now()): number | undefined {
  if (b.status !== 'planifie') return undefined;
  const prevue = dateLocale(b.plannedBrewDate);
  if (prevue === undefined) return undefined;
  const jours = Math.round((debutDeJour(maintenant) - prevue) / JOUR);
  return jours >= 1 ? jours : undefined;
}

/** Densité stable : les deux derniers relevés sont à moins de 0,0005 l'un de l'autre, à des jours différents, et la FG n'est pas posée. */
export function fgAConfirmer(b: Batch): boolean {
  if (b.status !== 'fermentation' && b.status !== 'garde') return false;
  if (String(b.fg ?? '').trim()) return false;
  const releves = (b.gravityLog ?? []).filter(r => Number.isFinite(r.sg));
  if (releves.length < 2) return false;
  const [a, z] = releves.slice(-2);
  return Math.abs(z.sg - a.sg) < 0.0005 && a.date !== z.date;
}

/** Jours avant le prochain dry hop prévu (0 = aujourd'hui), pour un brassin en fermentation ; undefined sans date. */
export function dryHopDans(b: Batch, maintenant = Date.now()): number | undefined {
  if (b.status !== 'fermentation') return undefined;
  const depart = fermentationStartedAt(b)?.at;
  if (depart === undefined) return undefined;
  const hops: HopIngredient[] = (b.recipeSnapshot?.hops ?? []).map(normalizeHop).filter(h => h.stage === 'dryHop' && h.dayOffset != null && h.dayOffset >= 0);
  const jours = hops.map(h => Math.round((debutDeJour(depart) + h.dayOffset! * JOUR - debutDeJour(maintenant)) / JOUR)).filter(j => j >= 0);
  return jours.length ? Math.min(...jours) : undefined;
}

/** Les fragments de la phrase de la liste des brassins : à confirmer, dry hop proche, retard. Au plus deux, les retards en premier. */
export function phraseBrassins(batches: Batch[], maintenant = Date.now()): Fragment[] {
  const sortie: Fragment[] = [];
  const retards = batches.filter(b => retardDe(b, maintenant) !== undefined).sort((a, b) => retardDe(b, maintenant)! - retardDe(a, maintenant)!);
  if (retards[0]) sortie.push({ texte: `${nom(retards[0])} en retard de ${retardDe(retards[0], maintenant)} j`, ton: 'alerte' });
  const confirmer = batches.find(fgAConfirmer);
  if (confirmer) sortie.push({ texte: `${nom(confirmer)} à confirmer`, ton: 'neutre' });
  const dry = batches.map(b => ({ b, j: dryHopDans(b, maintenant) })).filter(x => x.j !== undefined && x.j <= 1).sort((a, b) => a.j! - b.j!)[0];
  if (dry) sortie.push({ texte: `${nom(dry.b)} dry hop ${dry.j === 0 ? 'aujourd’hui' : 'demain'}`, ton: 'hop' });
  return sortie.slice(0, 2);
}

/** La phrase de la liste des recettes : une recette dont le brassin planifié attend depuis plus d'un jour. */
export function phraseRecettes(batches: Batch[], maintenant = Date.now()): Fragment[] {
  const retard = batches.filter(b => retardDe(b, maintenant) !== undefined).sort((a, b) => retardDe(b, maintenant)! - retardDe(a, maintenant)!)[0];
  return retard ? [{ texte: `${nom(retard)} attend son brassin`, ton: 'neutre', fin: `depuis ${retardDe(retard, maintenant)} j` }] : [];
}
