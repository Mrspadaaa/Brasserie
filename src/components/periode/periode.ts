import type { TimeFilterPeriod } from '../../types';
import { DateUtils } from '../../services/dateUtils';

/**
 * LA période de l'application (m3r-a, choisie provisoirement le 15.11) : une seule, réglable partout, lue partout.
 *
 * Ce module est isolé exprès : si le brasseur choisit m3r-b ou m3r-c, seul le dessin (pastille, grille) change ;
 * le modèle, la lecture d'une date et le passage à Finances restent.
 *
 * Elle se garde sous la clé historique `app_global_time_filter`, en texte :
 * `all`, `month-2026-11`, `quarter-2026-4`, `year-2026`, `range-2026-10-12_2026-11-03`.
 * Les anciennes valeurs (`this-month`, `last-month`, `q1`…`q4`, `year`, `m-01`, `m-04`) sont relues sans perte.
 */
export type Periode =
  | { genre: 'tout' }
  | { genre: 'mois'; annee: number; mois: number }
  | { genre: 'trimestre'; annee: number; trimestre: 1 | 2 | 3 | 4 }
  | { genre: 'annee'; annee: number }
  /** Dates libres : jours ISO `AAAA-MM-JJ`, bornes incluses. */
  | { genre: 'dates'; du: string; au: string };

/** Ce que les écrans reçoivent : la période d'aujourd'hui, ou une ancienne valeur (tests, aperçus). */
export type PeriodeEntree = Periode | TimeFilterPeriod;

const deux = (n: number) => String(n).padStart(2, '0');
export const MOIS_COURTS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'] as const;
export const MOIS_LONGS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'] as const;
export const INITIALES = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] as const;

export const moisDe = (d: Date): Periode => ({ genre: 'mois', annee: d.getFullYear(), mois: d.getMonth() + 1 });
export const PAR_DEFAUT = (maintenant = new Date()): Periode => moisDe(maintenant);

const jourISO = (annee: number, mois: number, jour: number) => `${annee}-${deux(mois)}-${deux(jour)}`;
const dernierJour = (annee: number, mois: number) => new Date(annee, mois, 0).getDate();

export function serialiser(p: Periode): string {
  switch (p.genre) {
    case 'tout': return 'all';
    case 'mois': return `month-${p.annee}-${deux(p.mois)}`;
    case 'trimestre': return `quarter-${p.annee}-${p.trimestre}`;
    case 'annee': return `year-${p.annee}`;
    case 'dates': return `range-${p.du}_${p.au}`;
  }
}

/** Relit une valeur gardée : la nouvelle forme, ou l'une des anciennes. Illisible : le mois courant. */
export function lire(brut: unknown, maintenant = new Date()): Periode {
  if (brut && typeof brut === 'object' && 'genre' in brut) return brut as Periode;
  if (typeof brut !== 'string') return PAR_DEFAUT(maintenant);
  const y = maintenant.getFullYear();
  let m: RegExpExecArray | null;
  if (brut === 'all') return { genre: 'tout' };
  if ((m = /^month-(\d{4})-(\d{2})$/.exec(brut))) { const mois = Number(m[2]); if (mois >= 1 && mois <= 12) return { genre: 'mois', annee: Number(m[1]), mois }; }
  if ((m = /^quarter-(\d{4})-([1-4])$/.exec(brut))) return { genre: 'trimestre', annee: Number(m[1]), trimestre: Number(m[2]) as 1 | 2 | 3 | 4 };
  if ((m = /^year-(\d{4})$/.exec(brut))) return { genre: 'annee', annee: Number(m[1]) };
  if ((m = /^range-(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/.exec(brut)) && DateUtils.parseDate(m[1]) && DateUtils.parseDate(m[2]) && m[1] <= m[2]) return { genre: 'dates', du: m[1], au: m[2] };
  if (brut === 'this-month') return moisDe(maintenant);
  if (brut === 'last-month') return moisDe(new Date(y, maintenant.getMonth() - 1, 1));
  if (brut === 'year') return { genre: 'annee', annee: y };
  if (brut === 'm-01') return { genre: 'mois', annee: y, mois: 1 };
  if (brut === 'm-04') return { genre: 'mois', annee: y, mois: 4 };
  if ((m = /^q([1-4])$/.exec(brut))) return { genre: 'trimestre', annee: y, trimestre: Number(m[1]) as 1 | 2 | 3 | 4 };
  return PAR_DEFAUT(maintenant);
}

/** Une valeur d'écran (nouvelle ou ancienne) devient la période. */
export const enPeriode = (entree: PeriodeEntree | undefined, maintenant = new Date()): Periode =>
  typeof entree === 'object' && entree && 'genre' in entree ? entree : lire(entree, maintenant);

/** Premier et dernier jour (ISO) ; `null` des deux côtés pour « tout ». */
export function bornes(p: Periode): { du: string | null; au: string | null } {
  switch (p.genre) {
    case 'tout': return { du: null, au: null };
    case 'mois': return { du: jourISO(p.annee, p.mois, 1), au: jourISO(p.annee, p.mois, dernierJour(p.annee, p.mois)) };
    case 'trimestre': {
      const premier = (p.trimestre - 1) * 3 + 1;
      return { du: jourISO(p.annee, premier, 1), au: jourISO(p.annee, premier + 2, dernierJour(p.annee, premier + 2)) };
    }
    case 'annee': return { du: jourISO(p.annee, 1, 1), au: jourISO(p.annee, 12, 31) };
    case 'dates': return { du: p.du, au: p.au };
  }
}

/** La date (suisse `jj.mm.aaaa` ou ISO) est-elle dans la période ? Date illisible ou absente : non, sauf « tout ». */
export function dansPeriode(date: string | undefined, entree: PeriodeEntree, maintenant = new Date()): boolean {
  const p = enPeriode(entree, maintenant);
  if (p.genre === 'tout') return true;
  const d = DateUtils.parseDate(date);
  if (!d) return false;
  const iso = jourISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const { du, au } = bornes(p);
  return iso >= (du as string) && iso <= (au as string);
}

/** « Nov. », « T4 », « 2026 », « 12.10 – 03.11 », « Tout » : le contenu de la pastille. */
export function etiquetteCourte(p: Periode): string {
  switch (p.genre) {
    case 'tout': return 'Tout';
    case 'mois': return MOIS_COURTS[p.mois - 1];
    case 'trimestre': return `T${p.trimestre}`;
    case 'annee': return String(p.annee);
    case 'dates': return `${p.du.slice(8)}.${p.du.slice(5, 7)} – ${p.au.slice(8)}.${p.au.slice(5, 7)}`;
  }
}

/** « Novembre 2026 », « 4e trimestre 2026 », « Exercice 2026 » : la période se lit en titre. */
export function titre(p: Periode): string {
  switch (p.genre) {
    case 'tout': return 'Tout l’historique';
    case 'mois': return `${MOIS_LONGS[p.mois - 1]} ${p.annee}`;
    case 'trimestre': return `${p.trimestre === 1 ? '1er' : `${p.trimestre}e`} trimestre ${p.annee}`;
    case 'annee': return `Exercice ${p.annee}`;
    case 'dates': return `Du ${p.du.slice(8)}.${p.du.slice(5, 7)}.${p.du.slice(0, 4)} au ${p.au.slice(8)}.${p.au.slice(5, 7)}.${p.au.slice(0, 4)}`;
  }
}

/** Le pas des flèches : un mois, ou un trimestre si un trimestre est choisi, une année pour un exercice. « Tout » et les dates libres ne s'avancent pas d'un cran : le mois du début les remplace. */
export function pas(p: Periode, sens: -1 | 1): Periode {
  switch (p.genre) {
    case 'tout': return p;
    case 'mois': {
      const n = p.annee * 12 + (p.mois - 1) + sens;
      return { genre: 'mois', annee: Math.floor(n / 12), mois: (n % 12) + 1 };
    }
    case 'trimestre': {
      const n = p.annee * 4 + (p.trimestre - 1) + sens;
      return { genre: 'trimestre', annee: Math.floor(n / 4), trimestre: ((n % 4) + 1) as 1 | 2 | 3 | 4 };
    }
    case 'annee': return { genre: 'annee', annee: p.annee + sens };
    case 'dates': {
      const mois = Number(p.du.slice(5, 7)), annee = Number(p.du.slice(0, 4));
      return pas({ genre: 'mois', annee, mois }, sens);
    }
  }
}

/** Les flèches sont-elles utiles ? (« Tout » : rien à avancer.) */
export const avance = (p: Periode) => p.genre !== 'tout';

/** `jj.mm` ou `jj.mm.aaaa` → ISO ; l'année manquante est celle donnée. Date inexistante : `null`. */
export function jourSaisi(texte: string, anneeParDefaut: number): string | null {
  const m = /^\s*(\d{1,2})[./\-\s](\d{1,2})(?:[./\-\s](\d{4}))?\s*$/.exec(texte);
  if (!m) return null;
  const annee = m[3] ? Number(m[3]) : anneeParDefaut;
  const d = new Date(annee, Number(m[2]) - 1, Number(m[1]), 12);
  if (d.getFullYear() !== annee || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[1])) return null;
  return jourISO(annee, Number(m[2]), Number(m[1]));
}

/** Comptes d'écritures d'une année : 12 mois, puis les 4 trimestres. Une date hors année ou illisible n'est comptée nulle part. */
export function comptesAnnee(dates: ReadonlyArray<string | undefined>, annee: number): { mois: number[]; trimestres: number[] } {
  const mois = Array<number>(12).fill(0);
  for (const brut of dates) {
    const d = DateUtils.parseDate(brut);
    if (d && d.getFullYear() === annee) mois[d.getMonth()] += 1;
  }
  const trimestres = [0, 1, 2, 3].map(t => mois[t * 3] + mois[t * 3 + 1] + mois[t * 3 + 2]);
  return { mois, trimestres };
}

/** Nombre de dates dans la période (le « 23 écritures » sous la grille). */
export const compter = (dates: ReadonlyArray<string | undefined>, p: PeriodeEntree, maintenant = new Date()) =>
  dates.reduce((n, d) => n + (dansPeriode(d, p, maintenant) ? 1 : 0), 0);

/** Les mois (`AAAA-MM`) que couvre une période : Finances compte au mois. `null` pour « tout ». */
export function moisCouverts(p: Periode): { du: string; au: string } | null {
  const { du, au } = bornes(p);
  return du && au ? { du: du.slice(0, 7), au: au.slice(0, 7) } : null;
}

/**
 * Ce que lit Finances (qui compte au mois) : un mois, « tout », ou une plage de mois pour un trimestre, un exercice,
 * des dates libres (arrondies aux mois entiers : Finances ne sait pas compter au jour).
 */
export function pourFinances(p: Periode): { month: string; allDates: boolean; plage: { du: string; au: string } | null } {
  const couverts = moisCouverts(p);
  if (!couverts) return { month: moisCourant(), allDates: true, plage: null };
  if (couverts.du === couverts.au) return { month: couverts.du, allDates: false, plage: null };
  return { month: couverts.du, allDates: false, plage: couverts };
}
const moisCourant = () => { const d = new Date(); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}`; };

/** La période que Finances vient de choisir, remise à la forme la plus parlante : trois mois d'un trimestre sont un trimestre. */
export function depuisPlageFinances(du: string, au: string): Periode {
  const [a1, m1] = du.split('-').map(Number), [a2, m2] = au.split('-').map(Number);
  if (du === au) return { genre: 'mois', annee: a1, mois: m1 };
  if (a1 === a2 && m1 === 1 && m2 === 12) return { genre: 'annee', annee: a1 };
  if (a1 === a2 && (m1 - 1) % 3 === 0 && m2 === m1 + 2) return { genre: 'trimestre', annee: a1, trimestre: (((m1 - 1) / 3) + 1) as 1 | 2 | 3 | 4 };
  return { genre: 'dates', du: `${du}-01`, au: jourISO(a2, m2, dernierJour(a2, m2)) };
}

export const depuisMois = (mois: string): Periode => {
  const [annee, m] = mois.split('-').map(Number);
  return { genre: 'mois', annee, mois: m };
};

export const memePeriode = (a: Periode, b: Periode) => serialiser(a) === serialiser(b);
