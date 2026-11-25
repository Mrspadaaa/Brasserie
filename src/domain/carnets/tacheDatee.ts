/**
 * C69-9 : une phrase qui pose une ÉCHÉANCE (« appeler l'électricien … avant le 12 décembre ») est une tâche datée de « À faire », même quand l'IA est éteinte.
 * Motif fermé : un marqueur d'échéance (avant, pour, d'ici, au plus tard), « le » facultatif, un jour et un mois français, en toutes lettres OU abrégé
 * (« déc. », « janv. », « sept. » : R110, c79, les phrases du brasseur disent « déc. »). Aucune autre forme n'est devinée ici (« fin du mois »,
 * « semaine prochaine » : l'IA les propose, avec son OK) ; une date sans marqueur reste une note.
 * La date se pose comme les autres tâches : le lundi de sa semaine (`echeanceDe`, taches.ts). Un jour déjà passé cette année vaut l'an prochain.
 * État de l'art : voir RESULTAT.md de c69-fix (chrono-node reconnaît ces formes mais n'est pas au projet ; ici douze noms de mois et leurs abréviations, rien d'autre).
 */
import type { PrecisionTache } from './modele';
import { echeanceDe } from './taches';

const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const sansAccent = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/**
 * Le mois qu'un mot dit : le nom entier, ou une abréviation d'au moins trois lettres qui ne désigne qu'un mois (« déc », « janv », « sept », « juil » ;
 * « jui » est ambigu : juin ou juillet, rien n'est deviné). -1 : ce n'est pas un mois.
 */
function moisDe(mot: string): number {
  const m = sansAccent(mot).replace(/\.$/, '');
  const exact = MOIS.indexOf(m);
  if (exact >= 0) return exact;
  if (m.length < 3) return -1;
  const candidats = MOIS.flatMap((x, i) => (x.startsWith(m) ? [i] : []));
  return candidats.length === 1 ? candidats[0] : -1;
}
/* C73-1 (R97) : « la semaine du 14 décembre » dit sa date comme « avant le 14 décembre » (le lundi de sa semaine) */
const MARQUE = /\b(?:avant|pour|d['’]ici|au plus tard|(?:la\s+)?semaine\s+du)\s+(?:le\s+)?(1er|\d{1,2})\s+([a-zéûè]+)\b/iu;

export interface TacheDatee { texte: string; echeance: string }

const iso = (annee: number, mois: number, jour: number): string => `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
const debutDuJour = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Un jour et un mois dits (sans année) : cette année, ou l'an prochain quand `suivant` et que le jour est passé ; `null` : jour impossible (31 février), ou passé sans `suivant`. */
function jourDit(jour: number, mois: number, maintenant: Date, suivant: boolean): string | null {
  if (mois < 0 || jour < 1 || jour > 31) return null;
  const an = maintenant.getFullYear();
  const passe = new Date(an, mois, jour).getTime() < debutDuJour(maintenant);
  if (passe && !suivant) return null;
  const annee = passe ? an + 1 : an;
  if (new Date(annee, mois, jour).getMonth() !== mois) return null;
  return iso(annee, mois, jour);
}

/**
 * R110 : le jour que l'IA a recopié de la phrase (« MM-JJ », sans année) devient l'échéance (lundi de sa semaine) ; le prochain jour de ce nom. Une forme illisible, ou un
 * jour qui n'existe pas (« 02-31 ») : `null` (l'IA garde la période qu'elle a dite).
 */
export function echeanceDeMoisJour(moisJour: string, maintenant: Date): string | null {
  const m = /^(\d{2})-(\d{2})$/.exec(moisJour.trim());
  if (!m) return null;
  const jourIso = jourDit(Number(m[2]), Number(m[1]) - 1, maintenant, true);
  return jourIso ? echeanceDe(jourIso, 'semaine') : null;
}

export function tacheDatee(phrase: string, maintenant: Date): TacheDatee | null {
  const texte = phrase.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim();
  const m = MARQUE.exec(texte);
  if (!m) return null;
  const jour = m[1] === '1er' ? 1 : Number(m[1]);
  const jourIso = jourDit(jour, moisDe(m[2]), maintenant, true);
  if (!jourIso) return null;
  const echeance = echeanceDe(jourIso, 'semaine');
  return echeance ? { texte, echeance } : null;
}

const EN_MOIS = new RegExp(String.raw`\ben\s+(${MOIS.join('|')})\b`);
const JOURS_SEMAINE = 'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche';
/** R110 : « le samedi 6 déc. au matin », « le 6 déc. » : un jour dit sans marqueur d'échéance, avec « le » ou un jour de la semaine devant. */
const JOUR_DIT = new RegExp(String.raw`\b(?:le|${JOURS_SEMAINE})\s+(?:(?:${JOURS_SEMAINE})\s+)?(1er|\d{1,2})\s+([a-zéûè]+)\b`, 'iu');
const NOMBRES: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };
/** R110 : « dans 2 semaines », « dans 3 jours », « dans un mois » : un délai dit depuis aujourd'hui. */
const DANS = /\bdans\s+(\d{1,2}|une?|deux|trois|quatre|cinq|six)\s+(jours?|semaines?|mois)\b/iu;

export interface EcheanceDite { echeance: string; precision: 'semaine' | 'mois' }

/**
 * C70-5 puis R110 (c79) : la date que le brasseur a DITE dans sa phrase prime sur celle qu'une réponse de l'IA suppose (l'IA range « avant le 12 décembre » dans « semaine »,
 * « en mai » dans « mois » du mois courant : la date se perdait). Formes fermées, dans cet ordre : une échéance avec jour et mois en toutes lettres ou abrégé (`tacheDatee`, précision
 * semaine) ; un jour précédé de « le » ou d'un jour de la semaine (« le samedi 6 déc. », jamais une date déjà passée : c'est un fait, pas une échéance) ; un délai (« dans 2 semaines »,
 * depuis `maintenant`) ; « en <mois> » (précision mois : le lundi de la dernière semaine de ce mois, l'an prochain si le mois est passé). Rien d'autre n'est deviné ; `null` :
 * la phrase ne dit pas de date, l'IA garde la main.
 */
export function echeanceDite(phrase: string, maintenant: Date): EcheanceDite | null {
  const datee = tacheDatee(phrase, maintenant);
  if (datee) return { echeance: datee.echeance, precision: 'semaine' };
  const nu = JOUR_DIT.exec(phrase);
  if (nu) {
    const jourIso = jourDit(nu[1] === '1er' ? 1 : Number(nu[1]), moisDe(nu[2]), maintenant, false);
    const echeance = jourIso ? echeanceDe(jourIso, 'semaine') : null;
    if (echeance) return { echeance, precision: 'semaine' };
  }
  const dans = DANS.exec(phrase);
  if (dans) {
    const n = NOMBRES[dans[1].toLowerCase()] ?? Number(dans[1]);
    const unite = dans[2].toLowerCase();
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    if (unite.startsWith('mois')) d.setMonth(d.getMonth() + n); else d.setDate(d.getDate() + n * (unite.startsWith('semaine') ? 7 : 1));
    const jourIso = iso(d.getFullYear(), d.getMonth(), d.getDate());
    const precision = unite.startsWith('mois') ? 'mois' : 'semaine';
    const echeance = echeanceDe(jourIso, precision);
    if (echeance) return { echeance, precision };
  }
  const m = EN_MOIS.exec(sansAccent(phrase));
  if (!m) return null;
  const mois = MOIS.indexOf(m[1]);
  const an = maintenant.getFullYear() + (mois < maintenant.getMonth() ? 1 : 0);
  const echeance = echeanceDe(`${an}-${String(mois + 1).padStart(2, '0')}-01`, 'mois');
  return echeance ? { echeance, precision: 'mois' } : null;
}

/**
 * R110 : la date qu'une tâche (ou la proposition de l'IA) doit porter : celle que sa phrase dit si elle en dit une, sinon la sienne. Une date que le brasseur a posée à la main
 * (`echeancePosee`) ne se retouche jamais. Rend ce que `ajouterTache` attend : `echeance` et `precision` (absents : « Un jour »).
 */
export function echeanceDeLaPhrase(t: { echeance?: string; precision?: PrecisionTache; echeancePosee?: boolean }, phrase: string | undefined, maintenant: Date): { echeance?: string; precision?: PrecisionTache } {
  const dite = !t.echeancePosee && phrase ? echeanceDite(phrase, maintenant) : null;
  if (dite) return { echeance: dite.echeance, precision: dite.precision };
  return { ...(t.echeance !== undefined ? { echeance: t.echeance } : {}), ...(t.precision !== undefined ? { precision: t.precision } : {}) };
}
