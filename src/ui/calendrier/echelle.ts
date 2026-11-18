import { ajouterJours, ecartJours, jourLisible } from '../../domain/calendrier';
import type { Colonne } from './frise/Rangee';

/**
 * L'axe en jours, semaines, mois (D385, 18.11, ses mots : « Échelle au menu / Déplier une semaine. / Pincer pour zoomer / Les 3 »).
 *
 * État de l'art (RESULTAT de la voie axe-port) : une échelle de temps zoomable avec une région agrandie (focus + contexte) se fait par une
 * échelle date → px linéaire par morceaux. Le calendrier en a déjà une : ses colonnes (`Colonne {debut, fin}`, de largeur égale, une date
 * interpolée dans sa colonne). L'échelle ne change donc que les colonnes : des jours (Jour, 2 semaines), des semaines (Semaine, défaut), des
 * mois (Mois) ; une semaine dépliée devient ses sept jours au milieu des autres semaines (variante C). Le pincement se reconnaît au rapport des
 * distances entre deux doigts (Hammer.js, @use-gesture : seuil, un cran par geste), sans dépendance.
 */

export type Echelle = 'jour' | 'semaine' | 'mois';

export const ECHELLES: ReadonlyArray<{ id: Echelle; nom: string }> = [
  { id: 'jour', nom: 'Jour' },
  { id: 'semaine', nom: 'Semaine' },
  { id: 'mois', nom: 'Mois' }
];

/** La période que prend chaque échelle choisie (maquette D, ses crans : « 2 sem. · j », « 6 sem. », « 6 mois »), en semaines. */
export const PERIODE_DE_L_ECHELLE: Readonly<Record<Echelle, number>> = { jour: 2, semaine: 6, mois: 26 };
/** Au-delà de 3 semaines, une colonne d'un jour devient trop étroite au téléphone (moins de 16 px à 390) : l'axe repasse en semaines. */
export const JOUR_SEMAINES_MAX = 3;
/** En deçà de 3 mois, des colonnes d'un mois n'ont pas de sens (une ou deux colonnes) : l'axe repasse en semaines. */
export const MOIS_SEMAINES_MIN = 13;
/** Une semaine ne se déplie que si ses jours gardent au moins cette largeur (à 390 : 6 sem. et 3 mois, pas 6 mois). */
export const LARGEUR_JOUR_MIN = 16;

/** L'échelle montrée : celle voulue, si la période la permet ; l'An est toujours en mois, comme avant. */
export function echelleEffective(voulue: Echelle, semaines: number, annee: boolean): Echelle {
  if (annee) return 'mois';
  if (voulue === 'jour' && semaines <= JOUR_SEMAINES_MAX) return 'jour';
  if (voulue === 'mois' && semaines >= MOIS_SEMAINES_MIN) return 'mois';
  return 'semaine';
}

export type UniteColonne = 'jour' | 'semaine' | 'mois';

/** Une colonne d'un jour a `debut === fin` ; une semaine, 7 jours ; au-delà, un mois. */
export function uniteColonne(c: Pick<Colonne, 'debut' | 'fin'>): UniteColonne {
  const n = ecartJours(c.debut, c.fin);
  return n <= 0 ? 'jour' : n <= 6 ? 'semaine' : 'mois';
}

/** L'axe porte-t-il au moins une colonne d'un jour (Jour, ou une semaine dépliée) ? */
export const aDesJours = (colonnes: readonly Colonne[]): boolean => colonnes.some(c => c.debut === c.fin);

const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;
/** « L », « M »… : la lettre du jour (lundi = 0), comme la bande de la maquette. */
export const lettreDuJour = (iso: string): string => LETTRES[((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7)];
export const estWeekEnd = (iso: string): boolean => { const d = new Date(`${iso}T00:00:00Z`).getUTCDay(); return d === 0 || d === 6; };

const septJours = (lundi: string): Colonne[] => Array.from({ length: 7 }, (_, i) => {
  const j = ajouterJours(lundi, i);
  return { debut: j, fin: j, etiquette: jourLisible(j) };
});

export interface SemaineAxe { debut: string; numero: number }
export interface MoisAxe { debut: string; fin: string; court: string }

/**
 * Les colonnes de la frise pour une échelle, hors An (l'An garde ses douze mois, `CalendrierTab`).
 * - semaine : les semaines de la fenêtre ; `deplie` (le lundi d'une semaine de la fenêtre) est remplacée par ses sept jours ;
 * - jour : chaque semaine de la fenêtre en sept jours ;
 * - mois : les mois que la fenêtre touche, entiers.
 */
export function colonnesDeLAxe(o: { echelle: Echelle; semaines: readonly SemaineAxe[]; mois: readonly MoisAxe[]; du: string; nombre: number; deplie?: string | null }): Colonne[] {
  const i = Math.max(0, o.semaines.findIndex(s => s.debut >= o.du));
  const vues = o.semaines.slice(i, i + Math.max(1, o.nombre));
  if (o.echelle === 'jour') return vues.flatMap(s => septJours(s.debut));
  if (o.echelle === 'mois' && vues.length) {
    const du = vues[0].debut, au = ajouterJours(vues[vues.length - 1].debut, 6);
    const mois = o.mois.filter(m => m.fin >= du && m.debut <= au).map(m => ({ debut: m.debut, fin: m.fin, etiquette: m.court }));
    if (mois.length) return mois;
  }
  return vues.flatMap(s => (o.deplie && s.debut === o.deplie ? septJours(s.debut) : [{ debut: s.debut, fin: ajouterJours(s.debut, 6), etiquette: `S${s.numero}` }]));
}

/** Une semaine se déplie-t-elle à cette largeur ? Ses 7 jours prennent 6 colonnes de plus ; chacune garde `LARGEUR_JOUR_MIN`. */
export function peutDeplier(largeur: number, semaines: number): boolean {
  return largeur / (Math.max(1, semaines) + 6) >= LARGEUR_JOUR_MIN;
}

/**
 * Le glisser d'une barre de `k` colonnes, sur un axe qui porte des jours : la date visée et l'écart en jours. La barre part de `ancre` (son début,
 * ou le bord gauche de la vue si elle est coupée), dans la colonne `a`. Une colonne d'un jour vise ce jour ; une colonne de semaine garde le
 * jour de la semaine (comme le glisser en semaines), ou son lundi quand on vient d'un jour.
 */
export function cibleDuGlisse(colonnes: readonly Colonne[], a: number, k: number, ancre: string): { cible: string; jours: number } | null {
  if (!colonnes.length || a < 0 || a >= colonnes.length) return null;
  const b = Math.max(0, Math.min(colonnes.length - 1, a + k));
  const ca = colonnes[a], cb = colonnes[b];
  const cible = uniteColonne(cb) === 'jour' || uniteColonne(ca) === 'jour'
    ? cb.debut
    : ajouterJours(cb.debut, Math.max(0, Math.min(6, ecartJours(ca.debut, ancre))));
  return { cible, jours: ecartJours(ancre, cible) };
}

/* ---------- le pincement (variante B) ---------- */

export type SensPincement = 'ecarter' | 'pincer';
/** Seuils du rapport des distances (doigts écartés de 25 %, ou rapprochés de 20 %) : un cran par geste. */
export const SEUIL_ECARTER = 1.25;
export const SEUIL_PINCER = 0.8;

export function sensPincement(distanceDepart: number, distance: number): SensPincement | null {
  if (!(distanceDepart > 0) || !(distance >= 0)) return null;
  const r = distance / distanceDepart;
  return r >= SEUIL_ECARTER ? 'ecarter' : r <= SEUIL_PINCER ? 'pincer' : null;
}

/** Écarter : mois → semaines → jours ; pincer : jours → semaines → mois. `null` : déjà au bout. */
export function echelleApres(e: Echelle, sens: SensPincement): Echelle | null {
  const ordre: Echelle[] = ['jour', 'semaine', 'mois'];
  const i = ordre.indexOf(e) + (sens === 'ecarter' ? -1 : 1);
  return i >= 0 && i < ordre.length ? ordre[i] : null;
}
