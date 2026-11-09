import type { ForecastItem } from '../../../domain/finance/forecast';
import { forecastHorizonEnd } from '../../../domain/finance/forecast';
import { ajouterJours } from '../../../domain/finance/brewForecast';

/**
 * Prévisions (p5b) : l'escalier. Fonctions pures, centimes entiers, aucune horloge (`debut` passé).
 * Le domaine (d2, d3) est la vérité : chaque marche est une sortie ou une entrée de `buildForecast`, à sa date.
 * Un solde de départ inconnu n'est jamais 0 : `departCents === null` donne un escalier « en écart depuis aujourd'hui », sans solde.
 */

export interface Marche {
  date: string;
  items: ForecastItem[];
  /** Variation de la marche (entrées moins sorties). */
  deltaCents: number;
  /** Cumul depuis le début de l'horizon (toujours connu). */
  ecartCents: number;
  /** Solde après la marche ; `null` si le solde de départ est inconnu. */
  soldeApresCents: number | null;
}
export interface Escalier {
  debut: string;
  /** Dernier jour retenu (inclus). */
  fin: string;
  departCents: number | null;
  marches: Marche[];
  soldeFinCents: number | null;
  ecartFinCents: number;
  premierJourSousZero: string | null;
  pointBas: { date: string; soldeCents: number } | null;
  /** Valeurs dessinées (solde, ou écart si le départ est inconnu), départ compris. */
  min: number;
  max: number;
}

const signe = (i: ForecastItem) => (i.direction === 'out' ? -i.amountCents : i.amountCents);
const MS_JOUR = 86_400_000;
export const joursEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / MS_JOUR);
export const dernierJourInclus = (asOf: string, horizon: 30 | 90 | 365) => ajouterJours(forecastHorizonEnd(asOf, horizon), -1);

/** « Fin février » : mois du dernier jour inclus ; l'année seulement pour 12 mois. */
export function titreHorizon(fin: string, horizon: 30 | 90 | 365): string {
  const mois = new Date(`${fin}T12:00:00Z`).toLocaleDateString('fr-CH', { month: 'long', timeZone: 'UTC' });
  return horizon === 365 ? `Fin ${mois} ${fin.slice(0, 4)}` : `Fin ${mois}`;
}

/** La tendance (une sortie par mois et par catégorie, datée du 1er) devient une seule « dépenses courantes » par mois : p5b ne montre pas douze pastilles de tendance. */
export function regrouperTendance(items: ForecastItem[]): ForecastItem[] {
  const tendance = new Map<string, ForecastItem>(), reste: ForecastItem[] = [];
  for (const item of items) {
    if (item.source !== 'trend') { reste.push(item); continue; }
    const cle = `${item.date.slice(0, 7)}:${item.direction}`, deja = tendance.get(cle);
    if (deja) tendance.set(cle, { ...deja, amountCents: deja.amountCents + item.amountCents, date: deja.date < item.date ? deja.date : item.date });
    else tendance.set(cle, { ...item, id: `trend:${cle}`, label: 'dépenses courantes' });
  }
  return [...reste, ...tendance.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function construireEscalier(input: { departCents: number | null; items: ForecastItem[]; debut: string; fin: string }): Escalier {
  const { departCents, debut, fin } = input;
  const retenus = input.items.filter(i => i.date <= fin).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const parDate = new Map<string, ForecastItem[]>();
  for (const i of retenus) { const l = parDate.get(i.date); if (l) l.push(i); else parDate.set(i.date, [i]); }
  let ecart = 0;
  const marches: Marche[] = [...parDate.entries()].map(([date, items]) => {
    const deltaCents = items.reduce((n, i) => n + signe(i), 0);
    ecart += deltaCents;
    return { date, items, deltaCents, ecartCents: ecart, soldeApresCents: departCents === null ? null : departCents + ecart };
  });
  const valeurs = marches.map(m => (departCents === null ? m.ecartCents : m.soldeApresCents!));
  const depart = departCents === null ? 0 : departCents;
  let pointBas: Escalier['pointBas'] = null, premierJourSousZero: string | null = null;
  if (departCents !== null) {
    for (const m of marches) {
      if (premierJourSousZero === null && m.soldeApresCents! < 0) premierJourSousZero = m.date;
      if (m.soldeApresCents! < (pointBas?.soldeCents ?? Number.POSITIVE_INFINITY) && (m.soldeApresCents! < departCents)) pointBas = { date: m.date, soldeCents: m.soldeApresCents! };
    }
    if (!pointBas) pointBas = { date: debut, soldeCents: departCents };
  }
  return { debut, fin, departCents, marches, soldeFinCents: departCents === null ? null : departCents + ecart, ecartFinCents: ecart, premierJourSousZero, pointBas,
    min: Math.min(depart, ...valeurs), max: Math.max(depart, ...valeurs) };
}

export interface Notions { aPayer: number; prevu: number; brassin: number; projet: number; sorties: number; entrees: number }
/** À payer = factures ; Prévu = plans, récurrents, tendance, projets non testés ; le brassin et le projet testé ont leur propre couleur. La somme des quatre est le total des sorties. */
export function notions(items: ForecastItem[], projetPlanId?: string | null): Notions {
  const n: Notions = { aPayer: 0, prevu: 0, brassin: 0, projet: 0, sorties: 0, entrees: 0 };
  for (const i of items) {
    if (i.direction === 'in') { n.entrees += i.amountCents; continue; }
    n.sorties += i.amountCents;
    if (i.source === 'invoice') n.aPayer += i.amountCents;
    else if (i.source === 'brew') n.brassin += i.amountCents;
    else if (i.source === 'equipment' && projetPlanId && i.planId === projetPlanId) n.projet += i.amountCents;
    else n.prevu += i.amountCents;
  }
  return n;
}

/** Nombres 1-2-5 × 10^k (Heckbert 1990), cible de 5 graduations ; le zéro est toujours dans l'axe. Valeurs en centimes. */
export function graduations(minCents: number, maxCents: number, cible = 5): { ticks: number[]; bas: number; haut: number } {
  let bas = Math.min(0, minCents) / 100, haut = Math.max(0, maxCents) / 100;
  if (haut - bas < 1) haut = bas + 1;
  const brut = (haut - bas) / Math.max(1, cible - 1), p = 10 ** Math.floor(Math.log10(brut)), f = brut / p;
  const pas = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  bas = Math.floor(bas / pas) * pas; haut = Math.ceil(haut / pas) * pas;
  const ticks: number[] = [];
  for (let v = bas; v <= haut + pas / 2; v += pas) ticks.push(Math.round(v * 100));
  return { ticks, bas: Math.round(bas * 100), haut: Math.round(haut * 100) };
}
