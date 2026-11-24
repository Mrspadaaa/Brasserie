/**
 * Les dates du calendrier (D444, découpe de `domain/calendrier.ts`) : semaines ISO 8601, jours lisibles, en UTC (aucun jour ne glisse à l'heure
 * d'été). Réexportées par `domain/calendrier.ts` : les importeurs ne changent pas. Le temps de la frise (fenêtre, échelle) : `./temps.ts`.
 */

export const JOUR = 86400000;
export const utc = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const versIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Le lundi de la semaine qui contient `iso`. */
export function lundiDe(iso: string): string {
  const ms = utc(iso);
  const jour = (new Date(ms).getUTCDay() + 6) % 7; // lundi = 0
  return versIso(ms - jour * JOUR);
}

/** Numéro ISO 8601 de la semaine qui contient `iso`. */
export function numeroSemaine(iso: string): number {
  const jeudi = utc(lundiDe(iso)) + 3 * JOUR;
  const debutAnnee = Date.UTC(new Date(jeudi).getUTCFullYear(), 0, 1);
  return Math.floor((jeudi - debutAnnee) / JOUR / 7) + 1;
}


export const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const;

export const ajouterJours = (iso: string, n: number): string => versIso(utc(iso) + n * JOUR);
export const dimancheDe = (iso: string): string => ajouterJours(lundiDe(iso), 6);
export const ecartJours = (de: string, a: string): number => Math.round((utc(a) - utc(de)) / JOUR);
/** Semaines entières entre le lundi de `de` et le lundi de `a` (négatif si `a` est avant). */
export const ecartSemaines = (de: string, a: string): number => Math.round((utc(lundiDe(a)) - utc(lundiDe(de))) / (7 * JOUR));
export const etiquetteS = (iso: string): string => `S${numeroSemaine(iso)}`;
/** « 14 déc. » */
export const jourLisible = (iso: string): string => `${Number(iso.slice(8, 10))} ${MOIS_COURTS[Number(iso.slice(5, 7)) - 1]}`;
/** L-15 (T10-15) : aujourd'hui, en jour local ; `jourAvecAnnee` et `semaineAvecAn` s'y réfèrent par défaut. */
export const aujourdhuiLocal = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** CT4-A-13 : « 20 déc. 2025 » quand l'année n'est pas celle d'`aujourdhui` ; « 3 nov. » dans l'année (jamais l'année partout). */
export const jourAvecAnnee = (iso: string, aujourdhui: string = aujourdhuiLocal()): string => `${jourLisible(iso)}${iso.slice(0, 4) !== aujourdhui.slice(0, 4) ? ` ${iso.slice(0, 4)}` : ''}`;
/** E04, i3 : « S50, 7 – 13 déc. » */
export function dateDeSemaine(jour: string): string {
  /* CRITIQUE-4 n° 14 : les vraies bornes lundi – dimanche de la semaine ISO, quel que soit le jour reçu (jamais 7 jours comptés depuis la date) */
  const lundi = lundiDe(jour);
  const fin = ajouterJours(lundi, 6);
  const m1 = Number(lundi.slice(5, 7)) - 1, m2 = Number(fin.slice(5, 7)) - 1;
  const plage = m1 === m2 ? `${Number(lundi.slice(8))} – ${Number(fin.slice(8))} ${MOIS_COURTS[m2]}` : `${Number(lundi.slice(8))} ${MOIS_COURTS[m1]} – ${Number(fin.slice(8))} ${MOIS_COURTS[m2]}`;
  return `S${numeroSemaine(lundi)}, ${plage}`;
}
/** La Liste (E40, CRITIQUE-4 n° 14) : la date de la chose et sa vraie semaine ISO, « 26 août · S34 ». */
export function etiquetteListe(jour: string): string {
  return `${jourLisible(jour)} · ${etiquetteS(jour)}`;
}

/**
 * La semaine dite avec son année quand elle n'est pas celle de la semaine de référence (CRITIQUE-5 n° 2) : « S44 2027 » vu de S47 2026,
 * « S50 » dans la même année ISO. L'année est celle du jeudi de la semaine (ISO 8601).
 */
export function semaineAvecAn(lundi: string, reference: string = aujourdhuiLocal()): string {
  const an = (iso: string) => ajouterJours(lundiDe(iso), 3).slice(0, 4);
  return an(lundi) === an(reference) ? etiquetteS(lundi) : `${etiquetteS(lundi)} ${an(lundi)}`;
}
