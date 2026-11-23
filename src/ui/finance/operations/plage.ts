import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import { isActiveTransaction, isoDate, transactionKind, validPayment } from '../../../domain/finance/ledger';
import { periodeSynthese, type PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { joursEntre } from './calculs';

/**
 * La plage « du jour au jour » d'Opérations (s2ap2, 14.11). Règles pures : clés ISO `AAAA-MM-JJ`, bornes incluses, calcul en UTC
 * (aucun saut d'heure d'été). Un ancien état `AAAA-MM` (plage de mois d'avant le 14.11) se lit du 1er au dernier jour.
 * Problème type : intervalle fermé de dates et curseur à deux poignées (motif WAI-ARIA « multi-thumb slider »), voir RESULTAT.md.
 */

/** Le premier jour qu'on peut demander : le plancher de la Synthèse (`2000-01`) et des pièces (`bornesFinance`). */
export const PREMIER_JOUR = '2000-01-01';
/** Jour posé sur une pièce qu'on écarte d'un calcul : hors de toute plage (voir `periodeSurJours`). */
const JOUR_MASQUE = '1900-01-01';

export interface Plage { du: string; au: string }

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const MOIS = /^(\d{4})-(\d{2})$/;
const MS_JOUR = 86_400_000;
const utc = (jour: string): number => Date.UTC(Number(jour.slice(0, 4)), Number(jour.slice(5, 7)) - 1, Number(jour.slice(8, 10)));
const enJour = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export const estJour = (valeur: string): boolean => JOUR.test(valeur) && enJour(utc(valeur)) === valeur;
export const ajouterJours = (jour: string, n: number): string => enJour(utc(jour) + n * MS_JOUR);
/** Dernier jour d'un mois `AAAA-MM`. */
export const finDuMois = (mois: string): string => enJour(Date.UTC(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0));
export const joursDuMois = (mois: string): number => Number(finDuMois(mois).slice(8, 10));
/** Nombre de jours de la plage, les deux bornes comptées (le 1er au 15 : 15 jours). */
export const duree = (p: Plage): number => joursEntre(p.du, p.au) + 1;
/** Jours entiers de `de` à `a` (UTC), repris de `calculs`. */
export const joursEntre0 = joursEntre;
export const plageDuMois = (mois: string): Plage => ({ du: `${mois}-01`, au: finDuMois(mois) });
/** Dernier jour qu'on peut demander : un an après aujourd'hui, comme la date d'une pièce (`bornesFinance.joursFutur`). */
export const jourMaxi = (aujourdhui: string): string => ajouterJours(aujourdhui, 366);

/** Le jour est dans [du, au], bornes incluses. Une borne nulle ne borne pas ; une pièce sans date (`''`) n'est jamais dans une plage. */
export const dansJours = (date: string, du: string | null, au: string | null): boolean =>
  (du === null || date >= du) && (au === null || date <= au);

const borne = (valeur: string, fin: boolean): string | null => {
  if (estJour(valeur)) return valeur;
  const m = MOIS.exec(valeur);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return fin ? finDuMois(valeur) : `${valeur}-01`;
};

/**
 * Lit la plage d'un état stocké : jours `AAAA-MM-JJ`, ou ancien `AAAA-MM` (du 1er au dernier jour du mois). `null` si une borne manque ou
 * est invalide. Une fin avant le début se lit comme un jour seul (le début).
 */
export function lirePlage(du: string, au: string): Plage | null {
  const a = borne(du, false), b = borne(au, true);
  if (!a || !b) return null;
  return { du: a, au: b < a ? a : b };
}

/** Pose une plage entre deux bornes en gardant sa durée : un déplacement qui sortirait des bornes est ramené contre elles. */
function cadrer(du: string, au: string, n: number, min: string, max: string): Plage {
  if (du < min) return { du: min, au: ajouterJours(min, n - 1) };
  if (au > max) return { du: ajouterJours(max, -(n - 1)), au: max };
  return { du, au };
}

/** ‹ › : la plage glisse de sa durée (1er au 15 : 15 jours plus tôt, du 17 au 31 du mois d'avant). */
export function glisser(p: Plage, sens: -1 | 1, min: string, max: string): Plage {
  const n = duree(p);
  return cadrer(ajouterJours(p.du, sens * n), ajouterJours(p.au, sens * n), n, min, max);
}
const peutGlisser = (p: Plage, sens: -1 | 1, min: string, max: string): boolean => {
  const g = glisser(p, sens, min, max);
  return g.du !== p.du || g.au !== p.au;
};

/* ---------- Le texte de la plage : « 1er → 15 nov. », « 15 oct. → 10 nov. » ---------- */

const MOIS_ABREGE = new Intl.DateTimeFormat('fr-CH', { month: 'short', timeZone: 'UTC' });
const dateUtc = (jour: string) => new Date(utc(jour));
export const moisAbrege = (jour: string): string => MOIS_ABREGE.format(dateUtc(jour));
/** « 1er », « 15 » ; avec le mois : « 15 oct. » ; avec l'année : « 15 oct. 2025 ». */
export function jourCourt(jour: string, avecMois = false, avecAnnee = false): string {
  const n = Number(jour.slice(8, 10));
  return `${n === 1 ? '1er' : n}${avecMois || avecAnnee ? ` ${moisAbrege(jour)}` : ''}${avecAnnee ? ` ${jour.slice(0, 4)}` : ''}`;
}
/** Le titre d'une plage. L'année ne s'écrit que si la plage sort de l'année en cours. */
export function titreJours(p: Plage, aujourdhui: string): string {
  const courante = aujourdhui.slice(0, 4);
  const [a1, a2] = [p.du.slice(0, 4), p.au.slice(0, 4)];
  const annee = a1 !== courante || a2 !== courante;
  if (p.du === p.au) return jourCourt(p.au, true, annee);
  if (a1 !== a2) return `${jourCourt(p.du, true, true)} → ${jourCourt(p.au, true, true)}`;
  if (p.du.slice(0, 7) === p.au.slice(0, 7)) return `${jourCourt(p.du)} → ${jourCourt(p.au, true, annee)}`;
  return `${jourCourt(p.du, true)} → ${jourCourt(p.au, true, annee)}`;
}

/* ---------- La fenêtre de la frise : les jours qu'on voit, qui glisse quand une poignée pousse contre le bord ---------- */

export interface Fenetre { debut: string; nb: number }
export const finFenetre = (f: Fenetre): string => ajouterJours(f.debut, f.nb - 1);
export const contient = (f: Fenetre, p: Plage): boolean => p.du >= f.debut && p.au <= finFenetre(f);
const entre = (debut: string, fin: string): Fenetre => ({ debut, nb: joursEntre(debut, fin) + 1 });

/** Au départ : le mois de la plage si elle tient dans un mois ; sinon elle commence la fenêtre (15 oct. → 10 nov. : 30 jours dès le 15 oct.). */
export function fenetreInitiale(plage: Plage | null, mois: string): Fenetre {
  if (plage && plage.du.slice(0, 7) !== plage.au.slice(0, 7)) return { debut: plage.du, nb: Math.max(30, duree(plage)) };
  const m = plage ? plage.du.slice(0, 7) : mois;
  return { debut: `${m}-01`, nb: joursDuMois(m) };
}

/**
 * La fenêtre glisse d'un jour vers `sens` (-1 : vers le passé, +1 : vers l'avenir). Elle ne laisse jamais la plage dehors : quand la poignée
 * opposée atteindrait le bord, la fenêtre s'allonge au lieu de glisser.
 */
export function pousser(f: Fenetre, p: Plage, sens: -1 | 1): Fenetre {
  const fin = finFenetre(f);
  if (sens < 0) return entre(ajouterJours(f.debut, -1), ajouterJours(fin, -1) < p.au ? p.au : ajouterJours(fin, -1));
  const debut = ajouterJours(f.debut, 1);
  return entre(debut > p.du ? p.du : debut, ajouterJours(fin, 1));
}

/**
 * FIN-FRISE-AGRANDIR (19.11, « "agrandir" la frize est pas pratique.. ») : une poignée tenue contre le bord avance d'un PALIER d'un mois,
 * jamais jour par jour sans fin. Vers le passé : au 1er de son mois, ou au 1er du mois d'avant s'il y est déjà ; vers l'avenir : au dernier
 * jour de son mois, ou à celui du mois suivant.
 */
export function palierMois(jour: string, sens: -1 | 1): string {
  const mois = jour.slice(0, 7);
  if (sens < 0) return jour.endsWith('-01') ? `${ajouterJours(jour, -1).slice(0, 7)}-01` : `${mois}-01`;
  const fin = finDuMois(mois);
  return jour === fin ? finDuMois(ajouterJours(fin, 1).slice(0, 7)) : fin;
}
/** La fenêtre s'élargit jusqu'au jour atteint, l'autre bord ne bouge pas. */
export const etendre = (f: Fenetre, jour: string): Fenetre => {
  const fin = finFenetre(f);
  return entre(jour < f.debut ? jour : f.debut, jour > fin ? jour : fin);
};

/** Rend visible un jour atteint au clavier : la fenêtre glisse juste ce qu'il faut. */
export function montrer(f: Fenetre, p: Plage, jour: string): Fenetre {
  const fin = finFenetre(f);
  if (jour < f.debut) return entre(jour, ajouterJours(jour, f.nb - 1) < p.au ? p.au : ajouterJours(jour, f.nb - 1));
  if (jour > fin) { const d = ajouterJours(jour, -(f.nb - 1)); return entre(d > p.du ? p.du : d, jour); }
  return f;
}

const jourDeFenetre = (f: Fenetre, indice: number): string => ajouterJours(f.debut, Math.min(Math.max(indice, 0), f.nb - 1));
export const joursDeFenetre = (f: Fenetre): string[] => Array.from({ length: f.nb }, (_, i) => ajouterJours(f.debut, i));
const indiceDe = (f: Fenetre, jour: string): number => joursEntre(f.debut, jour);
/** Position (0 à 1) du bord gauche d'un jour ; la poignée de fin se pose au bord droit de son jour. */
export const xDebut = (f: Fenetre, jour: string): number => indiceDe(f, jour) / f.nb;
export const xFin = (f: Fenetre, jour: string): number => (indiceDe(f, jour) + 1) / f.nb;
/** Lundi : 2026-11-02 est un lundi (repère de la frise). */
export const estLundi = (jour: string): boolean => new Date(utc(jour)).getUTCDay() === 1;

/* ---------- Les étiquettes de l'axe ---------- */

export interface Etiquette { x: number; texte: string; genre: 'poignee' | 'auj' | 'mois' | 'fin'; ancre: 'milieu' | 'gauche' | 'droite' }
const ECART_MINI = 0.1;

/** Poignées d'abord (toujours dites), puis aujourd'hui, les 1er du mois et le dernier jour ; une étiquette trop près d'une plus prioritaire se tait. */
export function etiquettesAxe(f: Fenetre, p: Plage, aujourdhui: string): Etiquette[] {
  const cheval = p.du.slice(0, 7) !== p.au.slice(0, 7);
  const duX = xDebut(f, p.du), auX = xFin(f, p.au);
  const proches = auX - duX < ECART_MINI;
  /* v2 (1) : sur plus d'un an (« Tout l'historique »), les bornes se disent en mois et année (le jour exact est dans « Du … au ») et l'axe marque chaque 1er janvier (« 2025 ») : sans année, « 1er févr. » ne dit pas lequel. */
  const longue = f.nb > 366;
  const res: Etiquette[] = [{ x: duX, texte: longue ? `${moisAbrege(p.du)} ${p.du.slice(0, 4)}` : jourCourt(p.du, cheval), genre: 'poignee', ancre: proches ? 'droite' : 'milieu' }];
  if (p.au !== p.du) res.push({ x: auX, texte: longue ? `${moisAbrege(p.au)} ${p.au.slice(0, 4)}` : jourCourt(p.au), genre: 'poignee', ancre: proches ? 'gauche' : 'milieu' });
  // Une étiquette n'entre que si son texte, une fois posé (centré, ou collé au bord), ne chevauche aucune autre : « 29 oct. » collé à gauche
  // couvre le « 1er nov. » centré à 17 % (relevé en capture, 14.11). Largeur d'un signe : ~6 px sur une piste de ~320 px.
  const SIGNE = 6 / 320, MARGE = 0.012;
  const ancreDe = (x: number, ancre: Etiquette['ancre']) => (x < 0.06 && ancre === 'milieu' ? 'gauche' : x > 0.94 && ancre === 'milieu' ? 'droite' : ancre);
  const etendue = (x: number, texte: string, ancre: Etiquette['ancre']): [number, number] => {
    const l = texte.length * SIGNE, a = ancreDe(x, ancre);
    return a === 'gauche' ? [x, x + l] : a === 'droite' ? [x - l, x] : [x - l / 2, x + l / 2];
  };
  const libre = (x: number, texte: string) => { const [g, d] = etendue(x, texte, 'milieu'); return res.every(e => { const [eg, ed] = etendue(e.x, e.texte, e.ancre); return d + MARGE <= eg || g - MARGE >= ed; }); };
  const ajout = (x: number, texte: string, genre: Etiquette['genre']) => { if (libre(x, texte)) res.push({ x, texte, genre, ancre: 'milieu' }); };
  if (aujourdhui >= f.debut && aujourdhui <= finFenetre(f)) ajout((indiceDe(f, aujourdhui) + 0.5) / f.nb, `auj. ${Number(aujourdhui.slice(8, 10))}`, 'auj');
  for (const jour of joursDeFenetre(f)) {
    if (!jour.endsWith('-01') || jour === f.debut) continue;
    if (!longue) ajout(xDebut(f, jour), jourCourt(jour, true), 'mois');
    else if (jour.endsWith('-01-01')) ajout(xDebut(f, jour), jour.slice(0, 4), 'mois');
  }
  if (!longue) ajout((f.nb - 0.5) / f.nb, String(Number(finFenetre(f).slice(8, 10))), 'fin');
  return res.map(e => ({ ...e, ancre: ancreDe(e.x, e.ancre) }));
}

/** Les jours d'une plage sans la moindre opération saisie dans leur mois, regroupés : « du 15 au 31 oct. ». */
export function plagesInconnues(f: Fenetre, saisi: (mois: string) => boolean): Plage[] {
  const res: Plage[] = [];
  for (const jour of joursDeFenetre(f)) {
    if (saisi(jour.slice(0, 7))) continue;
    const dernier = res[res.length - 1];
    if (dernier && ajouterJours(dernier.au, 1) === jour) dernier.au = jour; else res.push({ du: jour, au: jour });
  }
  return res;
}
export function texteInconnu(p: Plage): string {
  if (p.du === p.au) return `le ${jourCourt(p.du, true)}`;
  return p.du.slice(0, 7) === p.au.slice(0, 7) ? `du ${jourCourt(p.du)} au ${jourCourt(p.au, true)}` : `du ${jourCourt(p.du, true)} au ${jourCourt(p.au, true)}`;
}

/* ---------- Le calcul des piles sur une plage ---------- */

/**
 * Les piles d'une plage de jours. `periodeSynthese` ne filtre que par mois (`dansPeriode`, `AAAA-MM`) : on lui donne les mois entiers qui touchent
 * la plage, après avoir écarté (date remplacée par un jour hors période) les pièces des mois d'extrémité qui tombent hors des jours demandés.
 * La liste complète reste passée telle quelle : les avoirs retrouvent leur facture d'origine, même hors plage. Une seule règle de « dépensé » (voie us).
 * Limite : le contrôle de date d'un avoir (jamais avant sa facture) n'y est pas rejoué quand sa facture est hors plage ; le grand livre le fait.
 */
export function periodeSurJours(entree: { transactions: Transaction[]; payments: FinancialPayment[]; du: string; au: string; aujourdhui: string; jours?: Map<string, string> }): PeriodeSynthese {
  const { du, au } = entree, mDu = du.slice(0, 7), mAu = au.slice(0, 7);
  const transactions = entree.transactions.map(tx => {
    const jour = entree.jours?.get(tx.id) ?? isoDate(tx.date);
    if (!jour) return tx;
    const m = jour.slice(0, 7);
    const date = m >= mDu && m <= mAu && !dansJours(jour, du, au) ? JOUR_MASQUE : jour;
    return date === tx.date ? tx : { ...tx, date };
  });
  return periodeSynthese({ transactions, payments: entree.payments, mois: mDu, jusqua: mAu, aujourdhui: entree.aujourdhui });
}

/* ---------- Le jour où une pièce compte dans la frise et la plage (s2ap2, test d'écran du 14.11, point 2) ---------- */

/**
 * s2ap2 : dans la frise et la plage, une opération À PAYER (ou à encaisser) se place à son ÉCHÉANCE (v6a : « à payer · 25 nov. »), une opération
 * PAYÉE à la date de son DERNIER paiement (« payé 9 nov. »). Une pièce sans échéance, d'état inconnu, un avoir et une facture qui a un avoir
 * (sa date sert à valider l'avoir, `refundLinkIssue`) gardent leur date de pièce : aucun jour n'est inventé. Ne retourne que les pièces qui
 * changent de jour. La vue du MOIS n'utilise pas cette règle : elle range une pièce par sa date (`periodeSynthese`, `dansPeriode`) ; on n'y touche pas.
 */
export function joursDeCompte(
  entrees: Array<{ transaction: Transaction; payment: { state: string } }>, payments: FinancialPayment[], aujourdhui: string,
): Map<string, string> {
  const sortie = new Map<string, string>();
  const cibles = new Set<string>();
  for (const { transaction: tx } of entrees) { const id = tx.finance?.refundOfId; if (id) cibles.add(id); }
  const dernier = new Map<string, string>();
  for (const p of payments) {
    if (!p.transactionId || !validPayment(p)) continue;
    const jour = isoDate(p.date);
    if (!jour || jour > aujourdhui) continue;
    if (!dernier.has(p.transactionId) || jour > dernier.get(p.transactionId)!) dernier.set(p.transactionId, jour);
  }
  for (const { transaction: tx, payment } of entrees) {
    const genre = transactionKind(tx);
    if (!isActiveTransaction(tx) || (genre !== 'expense' && genre !== 'income') || cibles.has(tx.id)) continue;
    const propre = isoDate(tx.date);
    if (!propre) continue;
    const jour = payment.state === 'paid' ? dernier.get(tx.id) : payment.state === 'unpaid' || payment.state === 'partial' ? isoDate(tx.finance?.dueDate) : null;
    if (jour && jour !== propre) sortie.set(tx.id, jour);
  }
  return sortie;
}

/** Les pièces redatées par `joursDeCompte` (copies) ; les autres telles quelles. */
export const redater = (transactions: Transaction[], jours: Map<string, string>): Transaction[] =>
  jours.size ? transactions.map(tx => (jours.has(tx.id) ? { ...tx, date: jours.get(tx.id)! } : tx)) : transactions;
