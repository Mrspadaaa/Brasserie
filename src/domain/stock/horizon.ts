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

/* ───────── La fenêtre réglable (demande du 16.11 : « Je veux pouvoir au doigt faire bouger cet encadrement… jusqu'à S50 par exemple, ou juste 50 51 ») ─────────
 * L'histogramme a sept colonnes : les six semaines (position 0 = la semaine en cours) puis « seuil » (position 6).
 * Une fenêtre {a, b} prend les colonnes a à b, bornes comprises. « S49 · 6 sem. · Tout » restent des raccourcis :
 * ce sont des fenêtres qui commencent à la semaine en cours (0 à n, 0 à 5, 0 à 6).
 * Une fenêtre libre se garde en semaines absolues (`null` = la colonne seuil) : ce qui est choisi ne glisse pas d'un jour à l'autre. */

export const POSITION_SEUIL = SEMAINES_FENETRE; // 6
export interface Fenetre { a: number; b: number }
/** Réglage gardé : un raccourci (qui suit le prochain brassin) ou une fenêtre libre en semaines absolues. */
export type FenetreGardee = { de: number | null; a: number | null };
export type Reglage = Horizon | FenetreGardee;

const entierOuNul = (v: unknown) => v === null || (typeof v === 'number' && Number.isInteger(v));
export const reglageValide = (v: unknown): v is Reglage =>
  horizonValide(v) || (typeof v === 'object' && v !== null && 'de' in v && 'a' in v
    && entierOuNul((v as FenetreGardee).de) && entierOuNul((v as FenetreGardee).a));

const borne = (p: number) => Math.max(0, Math.min(POSITION_SEUIL, p));

/** Position (0 à 6) de la colonne qui porte une ligne : sa semaine si elle tient dans les six semaines, sinon « seuil ». */
export function colonneDeLigne(vue: VueHorizon, l: LigneHorizon): number {
  return l.semaine !== null && l.semaine <= vue.limiteSix ? l.semaine - vue.courante : POSITION_SEUIL;
}

/** La fenêtre d'un raccourci : « avant le prochain brassin » s'arrête à la dernière colonne datée. */
export function fenetreDeHorizon(vue: VueHorizon, h: Horizon): Fenetre {
  if (h === 'tout') return { a: 0, b: POSITION_SEUIL };
  if (h === 'six') return { a: 0, b: POSITION_SEUIL - 1 };
  return { a: 0, b: borne(Math.min(vue.limiteBrassin - vue.courante, POSITION_SEUIL - 1)) };
}

/** La fenêtre (positions) d'un réglage gardé ; une semaine passée revient à la semaine en cours. */
export function fenetreDeReglage(vue: VueHorizon, r: Reglage): Fenetre {
  if (typeof r === 'string') return fenetreDeHorizon(vue, r);
  const pos = (s: number | null) => s === null ? POSITION_SEUIL : borne(Math.min(s - vue.courante, POSITION_SEUIL - 1));
  const a = pos(r.de); const b = pos(r.a);
  return { a: Math.min(a, b), b: Math.max(a, b) };
}

/** Garder une fenêtre : un raccourci s'il la dessine exactement (il suit alors le prochain brassin), sinon une fenêtre libre. */
export function reglageDeFenetre(vue: VueHorizon, f: Fenetre): Reglage {
  const g = (h: Horizon) => { const w = fenetreDeHorizon(vue, h); return w.a === f.a && w.b === f.b; };
  if (g('six')) return 'six';
  if (g('brassin') && vue.limiteBrassin <= vue.limiteSix) return 'brassin';
  if (g('tout')) return 'tout';
  const sem = (p: number) => p >= POSITION_SEUIL ? null : vue.courante + p;
  return { de: sem(f.a), a: sem(f.b) };
}

/** Les lignes d'une fenêtre libre : celles dont la colonne y tombe. */
export function lignesDeFenetre(vue: VueHorizon, f: Fenetre): LigneHorizon[] {
  return vue.lignes.filter((l) => { const c = colonneDeLigne(vue, l); return c >= f.a && c <= f.b; });
}

/** La somme des colonnes d'une fenêtre : le gros chiffre et la pastille (rien d'autre ne compte). */
export function sommeFenetre(vue: VueHorizon, f: Fenetre): number {
  return vue.colonnes.slice(f.a, f.b + 1).reduce((n, c) => n + c.n, 0);
}

/** Les lignes comptées par un réglage : un raccourci garde son compte, une fenêtre libre compte ses colonnes. */
export function lignesDeReglage(vue: VueHorizon, r: Reglage): LigneHorizon[] {
  return typeof r === 'string' ? lignesDeHorizon(vue, r) : lignesDeFenetre(vue, fenetreDeReglage(vue, r));
}
export const compteDeReglage = (vue: VueHorizon, r: Reglage): number => lignesDeReglage(vue, r).length;

const nomColonne = (vue: VueHorizon, p: number) => vue.colonnes[p]?.semaine == null ? 'seuil' : vue.colonnes[p].etiquette;

/** « S50 », « jusqu'à S50 », « S50–S51 », « S51 → seuil » : le nom d'une fenêtre libre. */
export function libelleFenetre(vue: VueHorizon, f: Fenetre): string {
  if (f.a === f.b) return nomColonne(vue, f.a);
  if (f.a === 0) return `jusqu’à ${nomColonne(vue, f.b)}`;
  if (f.b === POSITION_SEUIL) return `${nomColonne(vue, f.a)} → seuil`;
  return `${nomColonne(vue, f.a)}–${nomColonne(vue, f.b)}`;
}

/** La deuxième ligne du chiffre clé, pour un raccourci (phrase du brassin) ou une fenêtre libre (son nom). */
export function phraseReglage(vue: VueHorizon, r: Reglage): string {
  return typeof r === 'string' ? phraseHorizon(vue, r) : libelleFenetre(vue, fenetreDeReglage(vue, r));
}
