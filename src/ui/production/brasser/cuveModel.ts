// d1b : la cuve, jour par jour. Tout se calcule depuis les brassins ; une date que le modèle n'a pas est dite en mots, jamais inventée.
// Le modèle ne connaît qu'UNE capacité de fermenteur par installation (`fermenterCapacityL`, cf. domain/batchFermenter) : « pleine » veut dire
// « le volume de ce brassin ne tient plus avec ceux qui l'occupent ». Les cuves F1, F2, F3 de la maquette ne sont pas dans les données (ACCORD 1).
import type { Batch, HopIngredient } from '../../../types';
import { normalizeHop } from '../../../domain/hopStage';
import { fermentationStartedAt } from '../../../domain/productionInsights';
import { normalizeBrewDate } from '../../../domain/batchSchedule';

export const debutDeJour = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const plusJours = (t: number, n: number) => { const d = new Date(t); d.setDate(d.getDate() + n); return debutDeJour(d.getTime()); };
export const ecartJours = (a: number, b: number) => Math.round((debutDeJour(b) - debutDeJour(a)) / 86400000);

const dd = (n: number) => String(n).padStart(2, '0');
/** « 21.11.2026 » : le format que `planRecipeBatch` et la fiche lisent. */
export const dateSuisse = (t: number) => { const d = new Date(t); return `${dd(d.getDate())}.${dd(d.getMonth() + 1)}.${d.getFullYear()}`; };
const jourDe = (v?: string): number | undefined => {
  const n = normalizeBrewDate(v);
  if (!n) return undefined;
  const [j, m, a] = n.split('.').map(Number);
  return new Date(a, m - 1, j).getTime();
};

const SEMAINE = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const nomMois = (t: number) => MOIS[new Date(t).getMonth()];
/** « mer. 18 » */
export const jourCourt = (t: number) => `${SEMAINE[new Date(t).getDay()]} ${new Date(t).getDate()}`;
/** « mer. 18.11 » : sur le bouton. */
export const jourBouton = (t: number) => `${SEMAINE[new Date(t).getDay()]} ${new Date(t).getDate()}.${dd(new Date(t).getMonth() + 1)}`;
/** « mercredi 18 novembre » : le nom accessible d'une case. */
export const jourLong = (t: number) => `${JOURS_LONGS[new Date(t).getDay()]} ${new Date(t).getDate()} ${nomMois(t)}`;
const ddmm = (t: number) => `${dd(new Date(t).getDate())}.${dd(new Date(t).getMonth() + 1)}`;

export interface Occupation {
  lot: string;
  nom: string;
  /** Litres tenus dans la cuve ; `undefined` : inconnu, compté comme toute la cuve (jamais 0). */
  litres?: number;
  debut: number;
  /** Dernier jour où la cuve est prise (la mise en bouteille, ou la fin du plan) ; absent : pas de date. */
  fin?: number;
  finSource: 'bouteille' | 'plan' | 'inconnue';
  statut: Batch['status'];
}

export type GenreEvenement = 'houblon' | 'bouteille' | 'garde';
export interface Evenement { jour: number; genre: GenreEvenement; lot: string; nom: string }

const nomDe = (b: Batch) => (b.recipeSnapshot?.name ?? b.name ?? '').trim() || b.id;
const litresDe = (b: Batch): number | undefined => {
  const v = b.volumeBrewedL ?? b.volumeL;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;
};
const joursDuPlan = (b: Batch): number => (b.recipeSnapshot?.fermentation ?? []).reduce((s, p) => s + (Number.isFinite(p.days) && p.days > 0 ? p.days : 0), 0);

/** Le jour où le brassin entre dans la cuve : l'ensemencement (en cours) ou le jour prévu (planifié). `undefined` : pas de date. */
function entreeEnCuve(b: Batch): number | undefined {
  if (b.status === 'planifie') return jourDe(b.plannedBrewDate);
  if (b.status === 'fermentation' || b.status === 'garde') {
    const d = fermentationStartedAt(b)?.at;
    return d === undefined ? Number.NEGATIVE_INFINITY : debutDeJour(d);
  }
  return undefined;
}

export function occupations(batches: Batch[]): Occupation[] {
  const sortie: Occupation[] = [];
  for (const b of batches) {
    const debut = entreeEnCuve(b);
    if (debut === undefined) continue;
    const mise = jourDe(b.bottlingDate);
    const plan = joursDuPlan(b);
    const fin = mise ?? (plan > 0 && Number.isFinite(debut) ? plusJours(debut, plan) : undefined);
    sortie.push({ lot: b.id, nom: nomDe(b), litres: litresDe(b), debut, fin, finSource: mise !== undefined ? 'bouteille' : fin !== undefined ? 'plan' : 'inconnue', statut: b.status });
  }
  return sortie;
}

/** Les rendez-vous de la cave que le modèle date : dry hop (décalage de la recette depuis l'ensemencement), mise en bouteille datée, début de garde (plan). */
export function evenements(batches: Batch[]): Evenement[] {
  const sortie: Evenement[] = [];
  for (const b of batches) {
    const depart = entreeEnCuve(b);
    if (depart === undefined || !Number.isFinite(depart)) {
      const mise = jourDe(b.bottlingDate);
      if (mise !== undefined && (b.status === 'fermentation' || b.status === 'garde')) sortie.push({ jour: mise, genre: 'bouteille', lot: b.id, nom: nomDe(b) });
      continue;
    }
    const hops: HopIngredient[] = (b.recipeSnapshot?.hops ?? []).map(normalizeHop).filter(h => h.stage === 'dryHop' && h.dayOffset != null && h.dayOffset >= 0);
    new Set(hops.map(h => h.dayOffset!)).forEach(o => sortie.push({ jour: plusJours(depart, o), genre: 'houblon', lot: b.id, nom: nomDe(b) }));
    const mise = jourDe(b.bottlingDate);
    if (mise !== undefined) sortie.push({ jour: mise, genre: 'bouteille', lot: b.id, nom: nomDe(b) });
    let cumul = 0;
    for (const p of b.recipeSnapshot?.fermentation ?? []) {
      if (p.kind === 'garde') { sortie.push({ jour: plusJours(depart, cumul), genre: 'garde', lot: b.id, nom: nomDe(b) }); break; }
      cumul += Number.isFinite(p.days) && p.days > 0 ? p.days : 0;
    }
  }
  return sortie;
}

export interface EtatJour {
  etat: 'pleine' | 'libre' | 'inconnu';
  par: Occupation[];
  /** Vrai quand la cuve n'est pleine que parce qu'un brassin n'a aucune fin datée (ni mise en bouteille, ni plan) : la case le dit, elle ne prétend pas savoir quand la cuve se libère. */
  finNonDatee: boolean;
}

/** La cuve un jour donné pour un brassin de `volumeL` : pleine si les brassins qui l'occupent et celui-ci ne tiennent pas dans la capacité. */
export function etatCuve(occ: Occupation[], jour: number, capaciteL: number | undefined, volumeL: number): EtatJour {
  const par = occ.filter(o => o.debut <= jour && (o.fin === undefined || jour <= o.fin));
  if (capaciteL === undefined || !(capaciteL > 0)) return { etat: 'inconnu', par, finNonDatee: false };
  const prisPar = (liste: Occupation[]) => liste.reduce((s, o) => s + (o.litres ?? capaciteL), 0);
  const pleinePar = (liste: Occupation[]) => prisPar(liste) + volumeL > capaciteL + 1e-9;
  const pleine = pleinePar(par);
  // Les brassins à fin inconnue suffisent-ils seuls à la remplir ? Alors aucune date ne la libère. Sinon, la cuve se
  // libère au départ d'un brassin daté (la Pils en bouteille le 17) : sa fin est datée, même si d'autres ne le sont pas.
  const finNonDatee = pleine && pleinePar(par.filter(o => o.fin === undefined));
  return { etat: pleine ? 'pleine' : 'libre', par, finNonDatee };
}

export interface Contexte {
  occ: Occupation[];
  evts: Evenement[];
  capaciteL?: number;
  volumeL: number;
  aujourdhui: number;
}

export const evenementsDuJour = (c: Contexte, jour: number) => c.evts.filter(e => e.jour === jour);
export const houblonLe = (c: Contexte, jour: number) => evenementsDuJour(c, jour).find(e => e.genre === 'houblon');

/** Le premier jour, d'aujourd'hui à 12 semaines, où la cuve est libre et où aucun dry hop ne tombe ; `undefined` s'il n'y en a pas (ou cuve inconnue). */
export function premierLibre(c: Contexte, depuis = c.aujourdhui): number | undefined {
  for (let i = 0; i < 84; i++) {
    const j = plusJours(depuis, i);
    if (etatCuve(c.occ, j, c.capaciteL, c.volumeL).etat === 'libre' && !houblonLe(c, j)) return j;
  }
  return undefined;
}

export interface Raison { gras: string; reste: string; conflit: boolean; alternative?: number; loin: boolean }

const pluriel = (n: number, un: string, pl: string) => (n > 1 ? pl : un);

/** La phrase du jour choisi : sa raison (ou son conflit), dite avec les données ; aucun choix silencieux. */
export function raisonDe(c: Contexte, jour: number): Raison {
  const { etat, par, finNonDatee } = etatCuve(c.occ, jour, c.capaciteL, c.volumeL);
  const houblon = houblonLe(c, jour);
  const ecart = ecartJours(c.aujourdhui, jour);
  const loin = ecart > 7;
  const alternative = premierLibre(c, jour);
  const choisi = premierLibre(c);

  if (etat === 'pleine') {
    // Le premier à quitter la cuve est celui dont on attend la fin ; sans aucune date, un brassin non daté.
    // Pleine seulement sur la parole d'un brassin sans fin datée : on le nomme, et on dit que rien ne dit quand la cuve se libère.
    const o = finNonDatee ? par.find(x => x.fin === undefined) : [...par].sort((a, b) => (a.fin ?? Infinity) - (b.fin ?? Infinity))[0];
    const quand = !o ? '' : o.finSource === 'bouteille' ? `${o.nom} n'est en bouteille que ${jourCourt(o.fin!)}.`
      : o.finSource === 'plan' ? `${o.nom} y reste jusqu'au ${ddmm(o.fin!)}, selon son plan de fermentation.`
      : `${o.nom} n'a pas de mise en bouteille datée : rien ne dit quand la cuve se libère.`;
    return { gras: finNonDatee ? 'La cuve est pleine, sa fin n\'est pas datée' : 'La cuve est encore pleine', reste: `${quand ? ' : ' + quand : ''}${houblon ? ` Et c'est le dry hop de ${houblon.nom}.` : ''}`, conflit: true, alternative, loin };
  }
  if (houblon) {
    return { gras: `C'est le dry hop de ${houblon.nom}`, reste: ' : la cuve est libre, mais tu seras à la cave ce jour-là.', conflit: true, alternative, loin };
  }
  if (etat === 'inconnu') {
    return { gras: 'La capacité de la cuve n\'est pas connue', reste: ' : rien n\'est dit sur sa place. À toi de juger.', conflit: false, loin };
  }
  // Libre : depuis quand ?
  let depuis = jour;
  while (depuis > c.aujourdhui && etatCuve(c.occ, plusJours(depuis, -1), c.capaciteL, c.volumeL).etat === 'libre') depuis = plusJours(depuis, -1);
  const vide = ecartJours(depuis, jour);
  const veille = c.occ.filter(o => o.fin !== undefined && plusJours(o.fin, 1) === depuis).sort((a, b) => a.fin! - b.fin!)[0];
  const duJour = evenementsDuJour(c, jour).map(e => e.genre === 'bouteille' ? `${e.nom} passe en bouteille` : e.genre === 'garde' ? `${e.nom} passe en garde` : '');
  const autre = duJour.filter(Boolean).join(' ; ');
  if (jour === choisi) {
    const origine = !veille ? 'la cuve est libre dès aujourd\'hui.'
      : veille.finSource === 'bouteille' ? `${veille.nom} passe en bouteille la veille.`
      : `${veille.nom} finit son plan de fermentation la veille.`;
    return { gras: !veille ? 'Libre dès aujourd\'hui' : 'Le premier jour où la cuve est libre', reste: !veille ? ' : rien ne l\'occupe.' : ` : ${origine}`, conflit: false, loin };
  }
  const depuisTexte = depuis === c.aujourdhui ? 'aujourd\'hui' : `le ${new Date(depuis).getDate()}`;
  const tete = loin ? `Dans ${ecart} jours.` : `La cuve est libre depuis ${depuisTexte}`;
  // Ce qui se passe à la cave à ce jour (la maquette : « la NEIPA est en garde depuis le 19 ») : une garde commencée avant, pas encore suivie de sa mise en bouteille.
  const enGarde = c.evts
    .filter(e => e.genre === 'garde' && e.jour < jour && !c.evts.some(b => b.genre === 'bouteille' && b.lot === e.lot && b.jour > e.jour && b.jour <= jour))
    .map(e => `${e.nom} est en garde depuis le ${new Date(e.jour).getDate()}`);
  const caveEnCours = enGarde.length ? ` ; ${enGarde.join(' ; ')}` : '';
  const corps = loin
    ? ` La cuve est libre depuis ${depuisTexte}${vide > 0 ? `, vide ${vide} ${pluriel(vide, 'jour', 'jours')}` : ''}${caveEnCours}${autre ? ` ; ${autre} ce jour-là` : ''}.`
    : `${vide > 0 ? `, vide ${vide} ${pluriel(vide, 'jour', 'jours')}` : ''} ; ${autre ? autre + ' ce jour-là' : 'rien d\'autre ce jour-là'}.`;
  return { gras: tete, reste: corps, conflit: false, loin };
}

/** Lundi de la semaine de `t`. */
export const lundiDe = (t: number) => { const d = debutDeJour(t); const k = (new Date(d).getDay() + 6) % 7; return plusJours(d, -k); };
