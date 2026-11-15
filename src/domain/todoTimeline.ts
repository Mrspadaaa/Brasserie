/**
 * Le fil du temps de « À faire » (maquette kd4, choisie le 15.11) : fonction pure, sans React ni horloge.
 *
 * L'échelle est le point qui compte : 10 px par jour jusqu'à 6 semaines, et la même distance entre deux dates
 * quoi qu'il y ait autour (une tâche sans date ne pousse jamais le fil : elle sort du fil, dans sa poche).
 * Au-delà de 6 semaines, l'échelle se resserre (logarithme, continue en position) : un marché à six mois reste à l'écran.
 *
 * Rien n'est inventé : une date illisible reste « sans date » (avec le texte saisi), jamais un jour deviné.
 * Les dates stockées sont `JJ.MM.AAAA` (format de l'app) ou `AAAA-MM-JJ` ; `DateUtils.parseDate` les lit de la même façon.
 */

export const PX_PAR_JOUR = 10;
/** Six semaines : au-delà, l'échelle se resserre. */
export const JOURS_ECHELLE = 42;
/** Marge entre le trait « aujourd'hui » et le jour 0 du fil. */
export const MARGE_HAUT = 20;
export const HAUT_CARTE = 56;
export const ECART_CARTES = 8;
/** Resserrement : y(j) = 420 + A·ln(1 + (j − 42)/B) au-delà de 42 jours ; 6 mois ≈ 630 px, 1 an ≈ 715 px. */
const A = 120;
const B = 30;
const JOUR_MS = 86_400_000;
/** Hauteur minimale du fil quand rien n'est daté dans l'avenir (la carte « Le fil est libre »). */
export const HAUTEUR_VIDE = 300;

export const JOURS_SEMAINE = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const;
export const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const;

export interface TacheEntree {
  id: string;
  title: string;
  /** `JJ.MM.AAAA`, `AAAA-MM-JJ`, vide ou illisible. */
  date?: string;
  status: string;
}

export interface Retard { id: string; titre: string; jours: number; etiquette: string; relatif: string }
export interface SansDate { id: string; titre: string; /** Texte saisi mais illisible, montré tel quel. */ brut?: string }
export interface Faite { id: string; titre: string }
export interface Pose {
  id: string;
  titre: string;
  jours: number;
  /** Position vraie sur le fil (px depuis le jour 0, marge comprise). */
  y: number;
  /** Position de la carte : égale à `y`, ou plus bas si deux cartes se chevauchent. */
  yCarte: number;
  decale: boolean;
  etiquette: string;
  jourSemaine: string;
  relatif: string;
}
export interface Repere { y: number; etiquette: string; jours: number; /** Repère de changement d'échelle. */ rupture?: boolean }
export interface EcartLibre { y: number; jours: number; texte: string }
export interface Fil {
  retard: Retard[];
  futur: Pose[];
  sansDate: SansDate[];
  faites: Faite[];
  reperes: Repere[];
  ecarts: EcartLibre[];
  /** Hauteur du fil (px), du jour 0 à la fin. */
  hauteur: number;
  /** Centre du bouton « Poser » en bas du fil ; `null` quand le fil est libre (le bouton est alors dans la carte). */
  yPoser: number | null;
  /** Rien à faire, ni en retard, ni daté, ni sans date. */
  vide: boolean;
  /** L'échelle se resserre quelque part (un repère de rupture est posé). */
  resserre: boolean;
}

/** Position (px depuis le jour 0, sans marge) d'un jour d'avenir. */
export function positionY(jours: number): number {
  const j = Math.max(0, jours);
  if (j <= JOURS_ECHELLE) return j * PX_PAR_JOUR;
  return JOURS_ECHELLE * PX_PAR_JOUR + A * Math.log(1 + (j - JOURS_ECHELLE) / B);
}

/** Inverse de `positionY` : le jour le plus proche d'une position (px depuis le jour 0, sans marge). */
export function joursDepuisY(y: number): number {
  if (!(y > 0)) return 0;
  if (y <= JOURS_ECHELLE * PX_PAR_JOUR) return Math.round(y / PX_PAR_JOUR);
  return Math.round(JOURS_ECHELLE + B * (Math.exp((y - JOURS_ECHELLE * PX_PAR_JOUR) / A) - 1));
}

function minuit(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Lit `JJ.MM.AAAA` ou `AAAA-MM-JJ` (valide : le 31.02 n'existe pas). `null` sinon. */
export function lireDate(valeur?: string): Date | null {
  const v = (valeur ?? '').trim();
  if (!v) return null;
  const suisse = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(v);
  if (!suisse && !iso) return null;
  const [an, mois, jour] = suisse ? [+suisse[3], +suisse[2], +suisse[1]] : [+iso![1], +iso![2], +iso![3]];
  const d = new Date(an, mois - 1, jour, 12);
  return d.getFullYear() === an && d.getMonth() === mois - 1 && d.getDate() === jour ? d : null;
}

/** Nombre de jours entiers de `base` à `date` (négatif : passé). Indépendant de l'heure d'été. */
export function ecartJours(base: Date, date: Date): number {
  return Math.round((minuit(date) - minuit(base)) / JOUR_MS);
}

export function ajouterJours(base: Date, jours: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + jours, 12);
}

/** `28 nov.` */
export function jourMois(d: Date): string {
  return `${d.getDate()} ${MOIS_COURTS[d.getMonth()]}`;
}

/** `sam. 28 nov.` */
export function jourComplet(d: Date): string {
  return `${JOURS_SEMAINE[d.getDay()]} ${jourMois(d)}`;
}

/** `JJ.MM.AAAA`, le format stocké par l'app. */
export function enSuisse(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

/** « dans 29 jours », « demain », « il y a 35 jours » ; au-delà de 60 jours, en mois (approchés : « environ »). */
export function relatif(jours: number): string {
  if (jours === 0) return 'aujourd’hui';
  if (jours === 1) return 'demain';
  if (jours === -1) return 'hier';
  const n = Math.abs(jours);
  const duree = n > 60 ? `environ ${Math.round(n / 30)} mois` : `${n} jours`;
  return jours > 0 ? `dans ${duree}` : `il y a ${duree}`;
}

function texteLibre(jours: number): string {
  if (jours >= 60) return `environ ${Math.round(jours / 30)} mois libres`;
  return `${Math.floor(jours / 7)} semaines libres`;
}

/**
 * Pose les tâches sur le fil. `aujourdhui` est injecté (jamais d'horloge ici).
 * - faites : hors du fil (en haut, en perles) ;
 * - en retard (date passée, non faite) : poche rouge au-dessus du trait « aujourd'hui », la plus ancienne en haut ;
 * - sans date : poche à part (le composant la place hors du fil : elle ne change aucune distance) ;
 * - datées à venir (aujourd'hui compris) : sur le fil, à l'échelle.
 */
export function construireFil(taches: readonly TacheEntree[], aujourdhui: Date): Fil {
  const retard: Retard[] = [];
  const sansDate: SansDate[] = [];
  const faites: Faite[] = [];
  const avenir: Array<{ t: TacheEntree; d: Date; jours: number }> = [];

  for (const t of taches) {
    if (t.status === 'done') { faites.push({ id: t.id, titre: t.title }); continue; }
    const d = lireDate(t.date);
    if (!d) { sansDate.push({ id: t.id, titre: t.title, brut: (t.date ?? '').trim() || undefined }); continue; }
    const jours = ecartJours(aujourdhui, d);
    if (jours < 0) retard.push({ id: t.id, titre: t.title, jours, etiquette: jourMois(d), relatif: relatif(jours) });
    else avenir.push({ t, d, jours });
  }
  retard.sort((a, b) => a.jours - b.jours);
  avenir.sort((a, b) => a.jours - b.jours);

  // Cartes : à leur position vraie, repoussées vers le bas si elles se chevauchent. L'ordre ne change jamais.
  const futur: Pose[] = [];
  let basPrecedent = -Infinity;
  for (const { t, d, jours } of avenir) {
    const y = MARGE_HAUT + positionY(jours);
    const yCarte = Math.max(y, basPrecedent + ECART_CARTES + HAUT_CARTE / 2);
    futur.push({
      id: t.id, titre: t.title, jours, y, yCarte, decale: yCarte !== y,
      etiquette: jourMois(d), jourSemaine: JOURS_SEMAINE[d.getDay()], relatif: relatif(jours)
    });
    basPrecedent = yCarte + HAUT_CARTE / 2;
  }

  const dernierJour = avenir.length ? avenir[avenir.length - 1].jours : 0;
  const reperes: Repere[] = [];
  const maxHebdo = Math.min(JOURS_ECHELLE, Math.max(21, Math.ceil((dernierJour + 1) / 7) * 7));
  for (let j = 7; j <= maxHebdo; j += 7) {
    reperes.push({ y: MARGE_HAUT + positionY(j), jours: j, etiquette: jourMois(ajouterJours(aujourdhui, j)) });
  }
  let resserre = false;
  if (dernierJour > JOURS_ECHELLE) {
    resserre = true;
    reperes.push({ y: MARGE_HAUT + positionY(JOURS_ECHELLE), jours: JOURS_ECHELLE, etiquette: '6 semaines', rupture: true });
    // Au-delà : le 1er de chaque mois, au plus un repère tous les 30 px.
    let dernierY = MARGE_HAUT + positionY(JOURS_ECHELLE);
    const fin = ajouterJours(aujourdhui, dernierJour);
    for (let m = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 1, 12); m <= fin; m = new Date(m.getFullYear(), m.getMonth() + 1, 1, 12)) {
      const j = ecartJours(aujourdhui, m);
      if (j <= JOURS_ECHELLE) continue;
      const y = MARGE_HAUT + positionY(j);
      if (y - dernierY < 30) continue;
      reperes.push({ y, jours: j, etiquette: `1 ${MOIS_COURTS[m.getMonth()]}` });
      dernierY = y;
    }
  }

  // Un repère à moins de 34 px d'une carte est superflu : la carte porte sa date, et les deux textes se chevaucheraient.
  const reperesVisibles = reperes.filter((r) => r.rupture || !futur.some((p) => Math.abs(p.yCarte - r.y) < 34));

  // Espaces libres entre deux ancres (aujourd'hui, puis chaque carte) : dits en semaines, jamais devinés.
  const ecarts: EcartLibre[] = [];
  let ancreJour = 0;
  let ancreBas = MARGE_HAUT;
  for (const p of futur) {
    const jours = p.jours - ancreJour;
    const haut = p.yCarte - HAUT_CARTE / 2;
    if (jours >= 14 && haut - ancreBas >= 40) ecarts.push({ y: (ancreBas + haut) / 2, jours, texte: texteLibre(jours) });
    ancreJour = p.jours;
    ancreBas = p.yCarte + HAUT_CARTE / 2;
  }

  const vide = !retard.length && !futur.length && !sansDate.length;
  let hauteur: number;
  let yPoser: number | null = null;
  if (futur.length === 0) {
    hauteur = Math.max(HAUTEUR_VIDE, MARGE_HAUT + positionY(maxHebdo) + 40);
  } else {
    yPoser = futur[futur.length - 1].yCarte + HAUT_CARTE / 2 + 52;
    hauteur = yPoser + 30;
  }
  return { retard, futur, sansDate, faites, reperes: reperesVisibles, ecarts, hauteur, yPoser, vide, resserre };
}
