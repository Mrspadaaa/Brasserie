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

/**
 * « Fin janvier » seulement quand le dernier jour retenu est bien le dernier du mois (la maquette) ; sinon la date exacte : « Jusqu’au 7 févr. ».
 * Test d'écran P5B, constat 7 : « Fin février » pour une prévision qui s'arrête le 7.02 faisait chercher le loyer de février. L'année : 12 mois seulement.
 */
export function titreHorizon(fin: string, horizon: 30 | 90 | 365): string {
  const d = new Date(`${fin}T12:00:00Z`), annee = horizon === 365 ? ` ${fin.slice(0, 4)}` : '';
  const dernierDuMois = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate() === d.getUTCDate();
  if (dernierDuMois) return `Fin ${d.toLocaleDateString('fr-CH', { month: 'long', timeZone: 'UTC' })}${annee}`;
  return `Jusqu’au ${d.getUTCDate()} ${d.toLocaleDateString('fr-CH', { month: 'short', timeZone: 'UTC' })}${annee}`;
}

const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'un', 'une', 'et', 'au', 'aux', 'en', 'sur', 'pour', 'à']);
const minuscule = (mot: string) => (mot.length > 1 && mot === mot.toUpperCase() ? mot : mot.charAt(0).toLowerCase() + mot.slice(1));
/**
 * Le mot-clé d'une sortie pour son étiquette (test d'écran P5B, constat 1) : « Loyer de l'atelier » → « loyer », « Fermenteur supplémentaire » → « fermenteur »,
 * « Pale Ale d'hiver · emballage » → « emballage ». Un titre court (14 caractères au plus) reste entier. Le titre complet reste dans la fiche, la liste et l'aria-label.
 */
export function motCle(titre: string, brassin = false): string {
  const morceaux = titre.split(' · ').map(s => s.trim()).filter(Boolean);
  if (brassin && morceaux.length < 2) return 'brassin'; // le budget d'un brassin sans lot : le nom de la recette est dans la fiche
  const base = brassin ? morceaux[1] : morceaux[0] ?? '';
  if ([...base].length <= 14) return minuscule(base);
  const mots = base.split(/[\s'’]+/).filter(Boolean);
  const mot = mots.find(m => !MOTS_VIDES.has(m.toLowerCase()) && m.length > 2) ?? mots[0] ?? base;
  return minuscule([...mot].length > 14 ? `${[...mot].slice(0, 13).join('')}…` : mot);
}

/**
 * Au-delà de 10 sorties, une récurrence (même plan, même montant, au moins 3 fois) se regroupe en une seule étiquette (« loyer −400 ×9, le 25 »),
 * posée sur sa première marche ; les autres marches restent dessinées, sans étiquette (la NOTE de p5b : « il faudrait les regrouper »).
 */
export interface GroupeRecurrent { n: number; premierId: string; jour: string | null }
export function groupesRecurrents(marches: Marche[], seuil = 10): Map<string, GroupeRecurrent> {
  const sorties = marches.flatMap(m => m.items).filter(i => i.direction === 'out');
  const res = new Map<string, GroupeRecurrent>();
  if (sorties.length <= seuil) return res;
  const parCle = new Map<string, ForecastItem[]>();
  for (const i of sorties) { if (i.source !== 'recurring') continue; const c = `${i.planId ?? i.label}|${i.amountCents}`; const l = parCle.get(c); if (l) l.push(i); else parCle.set(c, [i]); }
  for (const l of parCle.values()) {
    if (l.length < 3) continue;
    const jours = new Set(l.map(i => i.date.slice(8)));
    const g: GroupeRecurrent = { n: l.length, premierId: l[0].id, jour: jours.size === 1 ? String(Number([...jours][0])) : null };
    for (const i of l) res.set(i.id, g);
  }
  return res;
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

/**
 * Nombres 1-2-5 × 10^k (Heckbert 1990), cible de 5 graduations ; le zéro est toujours dans l'axe. Valeurs en centimes.
 * Le bas de l'axe est arrondi à la graduation (la zone rouge a besoin de place) ; le haut ne l'est pas : il part juste au-dessus du point le plus haut
 * (+ 4 %), comme p5b, au lieu d'une graduation vide au-dessus du départ (test d'écran P5B, constat 13 : ~60 px vides à 390).
 */
export function graduations(minCents: number, maxCents: number, cible = 5): { ticks: number[]; bas: number; haut: number } {
  let bas = Math.min(0, minCents) / 100, hautDonnee = Math.max(0, maxCents) / 100;
  if (hautDonnee - bas < 1) hautDonnee = bas + 1;
  const brut = (hautDonnee - bas) / Math.max(1, cible - 1), p = 10 ** Math.floor(Math.log10(brut)), f = brut / p;
  const pas = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  bas = Math.floor(bas / pas) * pas;
  let haut = maxCents <= 0 ? 0 : hautDonnee + (hautDonnee - bas) * 0.04;
  if (haut <= bas) haut = bas + pas;
  const ticks: number[] = [], n = Math.floor((haut - bas) / pas + 1e-9);
  for (let i = 0; i <= n; i++) ticks.push(Math.round((bas + i * pas) * 100));
  return { ticks, bas: Math.round(bas * 100), haut: Math.round(haut * 100) };
}
