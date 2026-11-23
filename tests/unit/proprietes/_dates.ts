import fc from 'fast-check';

/**
 * Socle des tests par propriétés des dates de la frise (mission calendrier-en-ligne, FAST-CHECK.md).
 *
 * Le modèle de référence ne passe JAMAIS par `Date` : il compte en jours depuis 1970-01-01 (rata die) avec l'algorithme de Howard Hinnant
 * (civil_from_days / days_from_civil) et la définition ISO 8601 (la semaine 1 contient le 4 janvier ; une semaine est dans l'année de son jeudi).
 * Il est donc indépendant du code testé (`Date.UTC`, `getUTCDay`) et du fuseau de la machine.
 */

export const RUNS = 1000;
export const ANNEE_MIN = 2020;
export const ANNEE_MAX = 2035;

/* ---------- référence : jours depuis 1970-01-01 ---------- */

export function joursDepuisCivil(a: number, m: number, j: number): number {
  const y = m <= 2 ? a - 1 : a;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + j - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function civilDepuisJours(z0: number): { a: number; m: number; j: number } {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const j = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return { a: m <= 2 ? y + 1 : y, m, j };
}

const deux = (n: number) => String(n).padStart(2, '0');
export const enIso = (jours: number): string => { const c = civilDepuisJours(jours); return `${String(c.a).padStart(4, '0')}-${deux(c.m)}-${deux(c.j)}`; };
export const deIso = (iso: string): number => joursDepuisCivil(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), Number(iso.slice(8, 10)));

/** 0 = lundi … 6 = dimanche (le 1970-01-01 était un jeudi). */
export const jourDeSemaine = (jours: number): number => (((jours + 3) % 7) + 7) % 7;

export const estBissextile = (a: number): boolean => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
export const joursDuMois = (a: number, m: number): number => [31, estBissextile(a) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

/** Semaine ISO 8601 d'un jour : `{ annee, numero }`. */
export function semaineIso(jours: number): { annee: number; numero: number; lundi: number } {
  const lundi = jours - jourDeSemaine(jours);
  const jeudi = lundi + 3;
  const annee = civilDepuisJours(jeudi).a;
  const debut = joursDepuisCivil(annee, 1, 1);
  return { annee, numero: Math.floor((jeudi - debut) / 7) + 1, lundi };
}

/** Nombre de semaines ISO d'une année : 53 quand le 28 décembre est en semaine 53, sinon 52. */
export const semainesDeLAnnee = (a: number): number => semaineIso(joursDepuisCivil(a, 12, 28)).numero;

/* ---------- générateurs ---------- */

const J_MIN = joursDepuisCivil(ANNEE_MIN, 1, 1);
const J_MAX = joursDepuisCivil(ANNEE_MAX, 12, 31);

/** Le dernier dimanche d'un mois (jours) : les deux dimanches de changement d'heure de la Suisse sont ceux de mars et d'octobre. */
const dernierDimanche = (a: number, m: number): number => { const fin = joursDepuisCivil(a, m, joursDuMois(a, m)); return fin - ((jourDeSemaine(fin) + 1) % 7); };

/** Les jours qui ont déjà fait trébucher des calendriers : fins d'année, années à 53 semaines, 29 février, changements d'heure (±1 jour). */
export const JOURS_PIEGES: number[] = (() => {
  const s = new Set<number>();
  for (let a = ANNEE_MIN; a <= ANNEE_MAX; a++) {
    for (let d = -5; d <= 5; d++) { s.add(joursDepuisCivil(a, 1, 1) + d); s.add(joursDepuisCivil(a, 12, 31) + d); s.add(joursDepuisCivil(a, 1, 4) + d); }
    for (const m of [3, 10]) { const dd = dernierDimanche(a, m); for (let d = -2; d <= 2; d++) s.add(dd + d); }
    if (estBissextile(a)) for (let d = -2; d <= 2; d++) s.add(joursDepuisCivil(a, 2, 29) + d);
  }
  // la fenêtre citée par la mission : 28 déc. 2026 → 4 janv. 2027 (S53 puis S1)
  for (let d = joursDepuisCivil(2026, 12, 28); d <= joursDepuisCivil(2027, 1, 4); d++) s.add(d);
  return [...s].filter(d => d >= J_MIN && d <= J_MAX).sort((a, b) => a - b);
})();

/** Un jour (nombre de jours depuis 1970) de 2020 à 2035, avec un quart des tirages sur les jours pièges. */
export const arbJours: fc.Arbitrary<number> = fc.oneof(
  { weight: 3, arbitrary: fc.integer({ min: J_MIN, max: J_MAX }) },
  { weight: 1, arbitrary: fc.constantFrom(...JOURS_PIEGES) }
);
export const arbJour: fc.Arbitrary<string> = arbJours.map(enIso);
export const arbLundi: fc.Arbitrary<string> = arbJours.map(j => enIso(j - jourDeSemaine(j)));

/** Années à 53 semaines ISO entre 2020 et 2035 (attendu : 2020, 2026, 2032). */
export const ANNEES_53 = Array.from({ length: ANNEE_MAX - ANNEE_MIN + 1 }, (_, i) => ANNEE_MIN + i).filter(a => semainesDeLAnnee(a) === 53);

export const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const;

/** Tous les jours de 2020 à 2035 (exhaustif : 5 844 jours, quelques ms). */
export const TOUS_LES_JOURS: number[] = Array.from({ length: J_MAX - J_MIN + 1 }, (_, i) => J_MIN + i);
