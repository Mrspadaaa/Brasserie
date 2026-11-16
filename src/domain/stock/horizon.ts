import type { Batch } from '../../types';
import type { ArticleACommander } from '../stockLevel';

/**
 * Pastille C (choisie le 16.11, « C tel quel ») : UN horizon commun règle le chiffre clé du Stocks ET la pastille de l'onglet.
 * « S49 · 6 sem. · Tout » : ce qui manque avant le prochain brassin planifié, d'ici six semaines, ou tout (seuil compris).
 *
 * Les données viennent de `articlesACommander` (le seul comptage du manque) ; ici on ne fait que dater chaque besoin.
 * Honnêteté : une date vient d'un brassin planifié (`plannedBrewDate`) ou d'ajouts restants déjà dus. La date d'une recette
 * écrite est celle de sa CRÉATION, pas celle d'un besoin : elle ne date rien. Un article sans date de besoin
 * (au seuil, ou recette écrite seule) tombe dans la colonne « seuil » et ne compte que dans « Tout » : jamais une semaine inventée.
 *
 * Semaines : numéro ISO 8601 (la semaine qui contient le jeudi), comparées par un indice absolu (lundi de la semaine ÷ 7),
 * donc sans souci au passage d'une année.
 */

export type Horizon = 'brassin' | 'six' | 'tout';
export const HORIZONS: readonly Horizon[] = ['brassin', 'six', 'tout'];
/** Six semaines : la semaine en cours et les cinq suivantes. */
export const SEMAINES_FENETRE = 6;

const MS_JOUR = 86_400_000;

/** Un jour « AAAA-MM-JJ » (ou une date ISO complète) en jours UTC depuis 1970 ; `null` si illisible. */
function jourUtc(date: string | null | undefined): number | null {
  const m = date ? /^(\d{4})-(\d{2})-(\d{2})/.exec(date) : null;
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Number.isFinite(t) ? Math.floor(t / MS_JOUR) : null;
}

/** Indice absolu de la semaine (lundi = début) : le 1er janvier 1970 est un jeudi, donc le lundi précédent est le jour -3. */
export const indiceSemaine = (jour: number): number => Math.floor((jour + 3) / 7);

/** Numéro de semaine ISO 8601 d'un indice absolu : le jeudi de cette semaine fixe l'année, la semaine 1 contient le 4 janvier. */
export function numeroSemaineIso(indice: number): number {
  const jeudi = indice * 7; // le 1er janvier 1970 est un jeudi : le jeudi de la semaine d'indice i est le jour 7i
  const annee = new Date(jeudi * MS_JOUR).getUTCFullYear();
  const lundiSemaine1 = indiceSemaine(jourUtc(`${annee}-01-04`)!);
  return indice - lundiSemaine1 + 1;
}

export const etiquetteSemaine = (indice: number): string => `S${numeroSemaineIso(indice)}`;

/** Le brassin planifié, pas encore déstocké, dont la date est la plus proche (jamais dans le passé : un retard compte pour cette semaine). */
export function prochainBrassin(batches: Batch[], aujourdhui: string): { semaine: number; nom: string } | null {
  const maintenant = jourUtc(aujourdhui);
  if (maintenant === null) return null;
  const courante = indiceSemaine(maintenant);
  let meilleur: { semaine: number; jour: number; nom: string } | null = null;
  for (const b of batches) {
    if (b.status !== 'planifie' || b.stockConsumption?.appliedAt) continue;
    const jour = jourUtc(b.plannedBrewDate || b.brewDate);
    if (jour === null) continue;
    if (!meilleur || jour < meilleur.jour) meilleur = { semaine: Math.max(courante, indiceSemaine(jour)), jour, nom: b.name || b.id };
  }
  return meilleur ? { semaine: meilleur.semaine, nom: meilleur.nom } : null;
}

export interface LigneHorizon extends ArticleACommander {
  /** Indice absolu de la semaine du besoin ; `null` = pas de date de besoin (au seuil, ou recette écrite seule). */
  semaine: number | null;
  /** Le brassin (ou la recette) qui date ou nomme le besoin ; `null` = au seuil, aucun brassin prévu. */
  pour: string | null;
  /** Un besoin seulement porté par une recette écrite (sans date de besoin). */
  recetteSeule: boolean;
}

export interface ColonneHorizon {
  /** Indice absolu de la semaine, ou `null` pour la colonne « seuil ». */
  semaine: number | null;
  etiquette: string;
  n: number;
}

export interface VueHorizon {
  lignes: LigneHorizon[];
  colonnes: ColonneHorizon[];
  courante: number;
  /** Dernière semaine comptée par « avant le prochain brassin » (la semaine en cours s'il n'y en a pas). */
  limiteBrassin: number;
  brassin: { semaine: number; nom: string } | null;
  limiteSix: number;
  /** Les trois comptes, pour le chiffre, la pastille et les boutons. */
  comptes: Record<Horizon, number>;
}

/** Dater chaque article à commander. `aujourdhui` : « AAAA-MM-JJ » (injecté, pour des tests sans horloge). */
export function vueHorizon(aCommander: ArticleACommander[], batches: Batch[], aujourdhui: string): VueHorizon {
  const jourAujourdhui = jourUtc(aujourdhui) ?? 0;
  const courante = indiceSemaine(jourAujourdhui);
  const brassin = prochainBrassin(batches, aujourdhui);
  const limiteBrassin = brassin?.semaine ?? courante;
  const limiteSix = courante + SEMAINES_FENETRE - 1;

  const lignes: LigneHorizon[] = aCommander.map((a) => {
    let semaine: number | null = null;
    let pour: string | null = null;
    for (const s of a.sources) {
      if (s.genre === 'recette') continue;
      // Un brassin planifié date son besoin ; des ajouts restants (dry hop, sucre) sont dus tout de suite.
      const jour = s.genre === 'ajouts-restants' ? jourAujourdhui : jourUtc(s.date);
      if (jour === null) continue;
      const w = Math.max(courante, indiceSemaine(jour));
      if (semaine === null || w < semaine) { semaine = w; pour = s.genre === 'ajouts-restants' ? `${s.nom} : ajouts restants` : s.nom; }
    }
    const recettes = a.sources.filter((s) => s.genre === 'recette');
    if (semaine === null && recettes.length > 0) pour = `recette écrite : ${recettes[0].nom}`;
    return { ...a, semaine, pour, recetteSeule: semaine === null && recettes.length > 0 };
  });
  lignes.sort((x, y) =>
    (x.semaine ?? Infinity) - (y.semaine ?? Infinity) || Number(y.rupture) - Number(x.rupture) || x.item.name.localeCompare(y.item.name, 'fr'));

  const dans = (limite: number) => lignes.filter((l) => l.semaine !== null && l.semaine <= limite).length;
  const colonnes: ColonneHorizon[] = Array.from({ length: SEMAINES_FENETRE }, (_, i) => {
    const semaine = courante + i;
    return { semaine, etiquette: etiquetteSemaine(semaine), n: lignes.filter((l) => l.semaine === semaine).length };
  });
  colonnes.push({ semaine: null, etiquette: 'seuil', n: lignes.filter((l) => l.semaine === null || l.semaine > limiteSix).length });

  return {
    lignes, colonnes, courante, limiteBrassin, brassin, limiteSix,
    comptes: { brassin: dans(limiteBrassin), six: dans(limiteSix), tout: lignes.length }
  };
}

/** Les lignes comptées par un horizon. */
export function lignesDeHorizon(vue: VueHorizon, h: Horizon): LigneHorizon[] {
  if (h === 'tout') return vue.lignes;
  const limite = h === 'brassin' ? vue.limiteBrassin : vue.limiteSix;
  return vue.lignes.filter((l) => l.semaine !== null && l.semaine <= limite);
}

/** « avant S49 · Porter », « d'ici S52 · 6 sem. », « tout, seuil compris » : la deuxième ligne du chiffre clé. */
export function phraseHorizon(vue: VueHorizon, h: Horizon): string {
  if (h === 'tout') return 'tout, seuil compris';
  if (h === 'six') return `d’ici ${etiquetteSemaine(vue.limiteSix)} · 6 sem.`;
  return vue.brassin ? `avant ${etiquetteSemaine(vue.limiteBrassin)} · ${vue.brassin.nom}` : 'cette semaine · aucun brassin prévu';
}

export const horizonValide = (v: unknown): v is Horizon => v === 'brassin' || v === 'six' || v === 'tout';
