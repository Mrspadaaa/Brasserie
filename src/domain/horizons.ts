/**
 * K1 (D393, choix C1 et D2, 21.11) : une intention se saisit en ordres de grandeur. Ses mots : « juste, aujourd'hui, dans 1 mois, dans
 * 3 mois. Ou plus... Et plus reporté à dans 6m 1 ans » ; « on peut aussi lui donner ou estimer directement un prix ».
 *
 * Date (C1) : un horizon (aujourd'hui, 1 mois, 3 mois, 6 mois, 1 an, plus tard) d'un toucher ; la semaine se précise ensuite au glisser
 * sur la frise, le jour à Brasser. État de l'art (PORT, 21.11) : ni EDTF ni bibliothèque. Les mois s'ajoutent en mois civils bornés à la
 * fin de mois (règle d'`addMonths` de date-fns : 31 janv. + 1 mois = 28 ou 29 févr.), puis la date se ramène à un lundi ISO. Le lundi
 * retenu est celui de la semaine dont le jeudi tombe dans le mois visé (règle ISO 8601 : une semaine appartient au mois de son jeudi),
 * pour que « vers mai » et la semaine posée sur la frise disent le même mois. Une date passée se refuse.
 *
 * Prix (D2) : le dernier achat semblable (« Pompe 2025 : 420 »), marqué « estimé », remplacé par la facture. Semblable = même
 * référence de stock, sinon un mot du nom proche (fuse.js, comme `carnets/doublons.ts`). Rien de semblable : les ordres de grandeur de
 * D1. Jamais 0, jamais l'IA (D393 : un chiffre inventé et facturé).
 */
import Fuse from 'fuse.js';
import { ajouterJours, lundiDe, numeroSemaine } from './calendrier';

export type Horizon = 'aujourdhui' | '1-mois' | '3-mois' | '6-mois' | '1-an' | 'plus-tard';

/** Les horizons, dans l'ordre de ses mots. `mois` absent : aujourd'hui (0) ou plus tard (aucune date). */
export const HORIZONS: readonly { cle: Horizon; libelle: string; mois?: number }[] = [
  { cle: 'aujourdhui', libelle: "Aujourd'hui", mois: 0 },
  { cle: '1-mois', libelle: '1 mois', mois: 1 },
  { cle: '3-mois', libelle: '3 mois', mois: 3 },
  { cle: '6-mois', libelle: '6 mois', mois: 6 },
  { cle: '1-an', libelle: '1 an', mois: 12 },
  { cle: 'plus-tard', libelle: 'Plus tard' }
];

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const deux = (n: number) => String(n).padStart(2, '0');
const joursDuMois = (annee: number, mois1: number) => new Date(Date.UTC(annee, mois1, 0)).getUTCDate();

/** Une date ISO `AAAA-MM-JJ` valide ; sinon `null` (rien ne s'invente). */
export function lireIso(iso: string | undefined | null): string | null {
  const m = iso ? ISO.exec(iso.slice(0, 10)) : null;
  if (!m) return null;
  const a = Number(m[1]), mo = Number(m[2]), j = Number(m[3]);
  return mo >= 1 && mo <= 12 && j >= 1 && j <= joursDuMois(a, mo) ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** `iso` + `n` mois civils, le jour borné à la fin du mois visé (31 janv. + 1 = 28 ou 29 févr. ; 29 févr. + 12 = 28 févr.). */
export function ajouterMois(iso: string, n: number): string {
  const [a, m, j] = iso.split('-').map(Number);
  const total = a * 12 + (m - 1) + n;
  const annee = Math.floor(total / 12), mois1 = (total % 12) + 1;
  return `${annee}-${deux(mois1)}-${deux(Math.min(j, joursDuMois(annee, mois1)))}`;
}

/** Le jeudi de la semaine de `iso` : c'est lui qui dit à quel mois (et à quelle année) la semaine appartient (ISO 8601). */
export const jeudiDe = (iso: string): string => ajouterJours(lundiDe(iso), 3);

/** Le lundi de la semaine de `cible` ramené dans le mois de `cible` : si son jeudi tombe dans un autre mois, la semaine voisine. */
export function lundiDansLeMois(cible: string): string {
  const lundi = lundiDe(cible);
  const mois = cible.slice(0, 7), moisJeudi = jeudiDe(lundi).slice(0, 7);
  if (moisJeudi === mois) return lundi;
  return ajouterJours(lundi, moisJeudi < mois ? 7 : -7);
}

/** Une semaine passée : son dimanche est avant aujourd'hui. La semaine en cours n'est jamais passée. */
export const estPassee = (lundi: string, aujourdhui: string): boolean => ajouterJours(lundiDe(lundi), 6) < aujourdhui;

/**
 * Le lundi ISO d'un horizon, compté depuis `aujourdhui` ; « plus tard » : `null` (aucune date, la chose reste sans date).
 * Jamais une semaine passée : au pire la semaine en cours.
 */
export function lundiDHorizon(h: Horizon, aujourdhui: string): string | null {
  const jour = lireIso(aujourdhui);
  if (!jour) throw new Error(`Date du jour illisible : ${aujourdhui}`);
  const def = HORIZONS.find(x => x.cle === h);
  if (!def || def.mois === undefined) return null;
  if (def.mois === 0) return lundiDe(jour);
  const lundi = lundiDansLeMois(ajouterMois(jour, def.mois));
  return estPassee(lundi, jour) ? lundiDe(jour) : lundi;
}

/** L'horizon d'une date posée : celui dont le lundi est le sien (pour montrer la puce choisie) ; sinon `null`. */
export function horizonDe(date: string | undefined, aujourdhui: string): Horizon | null {
  const d = lireIso(date);
  if (!d) return null;
  const lundi = lundiDe(d);
  return HORIZONS.find(x => x.mois !== undefined && lundiDHorizon(x.cle, aujourdhui) === lundi)?.cle ?? null;
}

/**
 * Une date d'intention dite en clair : « cette semaine », « vers févr. », « vers nov. 2027 » (l'année quand le mois reviendrait dans
 * l'année en cours), « semaine passée » pour une date dépassée. Le mois est celui du jeudi de la semaine. Rien de lisible : `null`.
 */
export function texteIntention(date: string | undefined, aujourdhui: string, precision?: 'semaine' | 'mois'): string | null {
  const d = lireIso(date), jour = lireIso(aujourdhui);
  if (!d || !jour) return null;
  const lundi = lundiDe(d);
  if (lundi === lundiDe(jour)) return 'cette semaine';
  if (estPassee(lundi, jour)) return `passé · S${numeroSemaine(lundi)}`;
  const jeudi = jeudiDe(lundi);
  const a = Number(jeudi.slice(0, 4)), m = Number(jeudi.slice(5, 7));
  const loin = (a - Number(jour.slice(0, 4))) * 12 + m - Number(jour.slice(5, 7)) >= 12;
  /* la précision suit la connaissance (R2) : une semaine posée se dit « S48 », un horizon « vers févr. » ; l'année quand elle est loin */
  if (precision === 'semaine') return `S${numeroSemaine(lundi)}${loin ? ` ${a}` : ''}`;
  return `vers ${MOIS_COURTS[m - 1]}${loin ? ` ${a}` : ''}`;
}

/* ---------- prix estimé (D2) ---------- */

/** Un achat passé, lu dans les écritures (une ligne de facture) : montant en centimes, positif. */
export interface AchatPasse { libelle: string; centimes: number; date: string; ref?: string; categorie?: string }
export interface PrixEstime { centimes: number; /** « Pompe 2025 » : ce qu'il lit, d'où vient le chiffre. */ source: string; achat: AchatPasse }

/** D1 : les ordres de grandeur quand rien n'est semblable (centimes). */
export const ORDRES_DE_GRANDEUR: readonly number[] = [10_000, 20_000, 50_000, 100_000, 500_000];

const VIDES = new Set(['pour', 'avec', 'sans', 'dans', 'des', 'les', 'une', 'aux', 'sur', 'neuf', 'neuve', 'nouveau', 'nouvelle', 'achat', 'acheter', 'projet']);
/** Les mots porteurs d'un nom : minuscules, sans accents, 4 lettres au moins, hors mots vides. */
export function motsPorteurs(nom: string): string[] {
  return [...new Set(nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(m => m.length >= 4 && !VIDES.has(m) && !/^\d+$/.test(m)))];
}

/** Seuil de fuse.js (0 = identique) : celui de `carnets/doublons.ts` (fautes de frappe, accords), non réglé sur ses achats (estimé). */
export const SEUIL_SEMBLABLE = 0.2;

/**
 * Le dernier achat semblable : même référence d'abord ; sinon le plus de mots porteurs proches (un au moins), puis le plus récent.
 * Un achat sans montant positif ne compte pas. Rien : `null` (l'écran propose alors les ordres de grandeur, jamais 0).
 */
export function prixSemblable(cible: { nom: string; ref?: string; categorie?: string }, achats: readonly AchatPasse[]): PrixEstime | null {
  const valides = achats.filter(a => Number.isFinite(a.centimes) && a.centimes > 0 && lireIso(a.date));
  const recent = (l: readonly AchatPasse[]) => [...l].sort((x, y) => y.date.localeCompare(x.date))[0];
  const dire = (a: AchatPasse): PrixEstime => ({ centimes: a.centimes, source: `${a.libelle.trim()} ${a.date.slice(0, 4)}`, achat: a });
  if (cible.ref) {
    const memes = valides.filter(a => a.ref === cible.ref);
    if (memes.length) return dire(recent(memes));
  }
  const mots = motsPorteurs(cible.nom);
  if (!mots.length) return null;
  let meilleurs: AchatPasse[] = [], score = 0;
  for (const a of valides) {
    const siens = motsPorteurs(a.libelle);
    if (!siens.length) continue;
    const fuse = new Fuse(siens, { includeScore: true, threshold: SEUIL_SEMBLABLE, ignoreLocation: true });
    let s = mots.filter(m => siens.includes(m) || fuse.search(m).length > 0).length;
    if (s && cible.categorie && a.categorie === cible.categorie) s += 0.5;
    if (s > score) { score = s; meilleurs = [a]; } else if (s && s === score) meilleurs.push(a);
  }
  return meilleurs.length ? dire(recent(meilleurs)) : null;
}
