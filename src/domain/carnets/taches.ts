/**
 * D451 : les tâches d'un carnet (« À faire », « Plus tard », case cochée) et leur liste groupée.
 *
 * Dates relatives (PLAN § État de l'art) : l'échéance est un lundi ISO plus une précision (`semaine`, ou `mois` = le lundi de la dernière semaine
 * du mois : « fin du mois » reste un lundi, et son mois se relit), le patron des dates d'intention (`lundiDe`, `planAuCalendrier`). Les groupes
 * (Cette semaine, Fin du mois, Un jour) se calculent à la lecture, avec les helpers de `calendrier/dates`. Une tâche n'est jamais écrite par l'IA
 * seule : l'IA propose (`propositionsSuivi`), son geste écrit. Une note du Planning (« À faire du … au … (Planning, …) ») se lit comme une tâche
 * dérivée, sans réécriture.
 */
import { dimancheDe, lundiDe } from '../calendrier/dates';
import { ajouterEvenement, nouvelIdCarnet, sansIndefinis, type CarnetDoc, type Origine, type PrecisionTache, type Tache } from './modele';
import { prixDe } from './analyseLocale';
import { Brouillon, refus, type Etat, type Resultat } from './operations';
import { assurerSuivi, etatDe, jourLocal } from './suivi';

const JOUR_VALIDE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Le dernier jour du mois d'une date (AAAA-MM-JJ). */
export function finDuMois(iso: string): string {
  const m = JOUR_VALIDE.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).toISOString().slice(0, 10);
}

/** L'échéance stockée : le lundi de la semaine de la date, ou (précision mois) le lundi de la dernière semaine de son mois. `null` : date illisible. */
export function echeanceDe(date: string, precision: PrecisionTache): string | null {
  const m = JOUR_VALIDE.exec(date);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12 || Number(m[3]) < 1 || Number(m[3]) > 31) return null;
  return precision === 'mois' ? lundiDe(finDuMois(date)) : lundiDe(date);
}

/** « À faire du 01.08.2026 au 01.05.2027 (Planning, Équipements) » : les dates et la catégorie ; `null` si ce n'en est pas une. */
export function notePlanningDe(texte: string): { du: string; au?: string; categorie: string } | null {
  const m = /^\s*À faire du (\d{2})\.(\d{2})\.(\d{4})(?: au (\d{2})\.(\d{2})\.(\d{4}))?\s*\(Planning, ([^)]+)\)\s*$/.exec(texte);
  if (!m) return null;
  const du = `${m[3]}-${m[2]}-${m[1]}`;
  if (echeanceDe(du, 'semaine') === null) return null;
  const au = m[4] ? `${m[6]}-${m[5]}-${m[4]}` : undefined;
  return sansIndefinis({ du, au, categorie: m[7].trim() });
}

export interface TacheVue extends Tache { carnetId: string; carnetTitre: string; /** lue d'une note du Planning : jamais écrite, jamais cochée ici */ derivee?: true;
  /** C68-9 : le dernier jour du projet du Planning (« au 15.09.2026 ») ; passé, il n'y a plus rien à faire */ finPlanning?: string }

export const idTachePlanning = (noteId: string): string => `planning:${noteId}`;

/** Les tâches d'un carnet : les siennes, puis celles que disent ses notes du Planning (dérivées, lecture seule). */
export function tachesDe(c: CarnetDoc): TacheVue[] {
  const siennes: TacheVue[] = (c.carnet.taches ?? []).map(t => ({ ...t, carnetId: c.id, carnetTitre: c.title }));
  const planning: TacheVue[] = [];
  /* C68-9 : « Budget 200 CHF » dans les notes du projet : son coût, dit « ≈ » (un budget est une limite, pas un prix ferme) ; absent sans budget écrit */
  /* C69-8 : le budget s'écrit aussi en critère (« Budget 400 CHF », Ce qui compte), comme la liste des carnets le lit */
  const budget = [...c.carnet.notes.filter(n => /\bbudget\b/i.test(n.texte)).map(n => n.texte), ...c.carnet.criteres.filter(k => /^\s*budget\b/i.test(k.texte)).map(k => k.texte)]
    .map(t => prixDe(t)).find(x => x && x.centimes > 0);
  for (const n of c.carnet.notes) {
    const p = notePlanningDe(n.texte);
    if (!p) continue;
    planning.push({
      id: idTachePlanning(n.id), texte: c.title, echeance: lundiDe(p.du), precision: 'semaine', origine: 'locale', creeeLe: c.carnet.creeLe, carnetId: c.id, carnetTitre: c.title, derivee: true,
      ...(p.au ? { finPlanning: p.au } : {}), ...(budget ? { coutCentimes: budget.centimes, devise: budget.devise, coutEstime: true } : {})
    });
  }
  return [...siennes, ...planning];
}

/* ---------- intentions ---------- */

interface ArgsTache {
  carnetId: string; texte: string; le: string; echeance?: string; precision?: PrecisionTache; coutCentimes?: number; devise?: string; coutEstime?: boolean;
  optionId?: string; planId?: string; messageId?: string; origine?: Origine; id?: string;
}

/** « À faire » (avec une date) ou « Plus tard » (sans : « Un jour »). Sans échéance, la précision est ignorée ; un coût absent reste absent (jamais 0). */
export function ajouterTache(etat: Etat, args: ArgsTache): Resultat {
  const texte = args.texte.trim();
  if (!texte) return refus('Une tâche a un texte.');
  let echeance: string | undefined;
  const precision: PrecisionTache = args.precision ?? 'semaine';
  if (args.echeance !== undefined) {
    const e = echeanceDe(args.echeance, precision);
    if (e === null) return refus('Date illisible.');
    echeance = e;
  }
  if (args.coutCentimes !== undefined && !(Number.isSafeInteger(args.coutCentimes) && args.coutCentimes >= 0)) return refus('Coût illisible.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (args.optionId && !c.carnet.facons.some(f => f.id === args.optionId)) return refus('Option introuvable.');
  const sansAccent = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  if ((c.carnet.taches ?? []).some(t => !t.faiteLe && sansAccent(t.texte) === sansAccent(texte))) return b.resultat('Déjà dans À faire');
  const s = assurerSuivi(c);
  const t: Tache = sansIndefinis({
    id: args.id ?? nouvelIdCarnet('TACHE'), texte, echeance, precision: echeance ? precision : undefined, coutCentimes: args.coutCentimes,
    devise: args.coutCentimes !== undefined ? args.devise ?? 'CHF' : undefined, coutEstime: args.coutCentimes !== undefined && args.coutEstime ? (true as const) : undefined,
    optionId: args.optionId, planId: args.planId, messageId: args.messageId, origine: args.origine ?? 'vous', creeeLe: args.le
  });
  c.carnet.taches = [...(c.carnet.taches ?? []), t];
  ajouterEvenement(s, sansIndefinis({ id: nouvelIdCarnet('EVT'), le: args.le, sorte: 'tache' as const, tacheId: t.id, vers: 'ajoutee', optionId: args.optionId, messageId: args.messageId, origine: t.origine }));
  b.ecrire(c);
  return b.resultat(echeance ? '✓ À faire' : '✓ Plus tard');
}

/** La case : cochée (datée) ou décochée. Une tâche lue du Planning ne se coche pas ici. */
export function cocherTache(etat: Etat, args: { carnetId: string; tacheId: string; le: string; faite?: boolean }): Resultat {
  if (args.tacheId.startsWith('planning:')) return refus('Tâche du Planning : elle se coche au Planning.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const t = c?.carnet.taches?.find(x => x.id === args.tacheId);
  if (!c || !t) return refus('Tâche introuvable.');
  const faite = args.faite ?? !t.faiteLe;
  if (faite === !!t.faiteLe) return b.resultat(faite ? 'Déjà faite' : 'Déjà à faire');
  const s = assurerSuivi(c);
  if (faite) t.faiteLe = args.le; else delete t.faiteLe;
  ajouterEvenement(s, sansIndefinis({ id: nouvelIdCarnet('EVT'), le: args.le, sorte: 'tache' as const, tacheId: t.id, vers: faite ? 'faite' : 'rouverte', origine: 'vous' }));
  b.ecrire(c);
  return b.resultat(faite ? '✓ Fait' : 'À refaire');
}

/** Dater une tâche, ou la remettre à « Un jour » (`echeance: null`). */
export function poserEcheance(etat: Etat, args: { carnetId: string; tacheId: string; echeance: string | null; precision?: PrecisionTache }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const t = c?.carnet.taches?.find(x => x.id === args.tacheId);
  if (!c || !t) return refus('Tâche introuvable.');
  if (args.echeance === null) {
    if (!t.echeance) return b.resultat('Déjà sans date');
    delete t.echeance; delete t.precision;
    b.ecrire(c);
    return b.resultat('✓ Un jour');
  }
  const precision = args.precision ?? 'semaine';
  const e = echeanceDe(args.echeance, precision);
  if (e === null) return refus('Date illisible.');
  if (t.echeance === e && (t.precision ?? 'semaine') === precision) return b.resultat('Même date');
  t.echeance = e; t.precision = precision;
  b.ecrire(c);
  return b.resultat('✓ Daté');
}

/* ---------- la liste « À faire » ---------- */

export type CleGroupe = 'cette-semaine' | 'fin-du-mois' | 'plus-loin' | 'un-jour';
/** Le total des coûts connus (CHF) : `connus` sur `sur` tâches ; `estime` quand il en manque ou qu'un coût est estimé (le « ≈ »). */
export interface CoutListe { centimes: number; connus: number; sur: number; estime: boolean }
export interface GroupeAFaire { cle: CleGroupe; taches: TacheVue[]; cout: CoutListe | null }
export interface AFaire { groupes: GroupeAFaire[]; total: number; cout: CoutListe | null }

const ORDRE: readonly CleGroupe[] = ['cette-semaine', 'fin-du-mois', 'plus-loin', 'un-jour'];

export function coutDe(taches: readonly TacheVue[]): CoutListe | null {
  const connues = taches.filter(t => t.coutCentimes !== undefined && (t.devise ?? 'CHF') === 'CHF');
  if (!connues.length) return null;
  return { centimes: connues.reduce((s, t) => s + t.coutCentimes!, 0), connus: connues.length, sur: taches.length, estime: connues.length < taches.length || connues.some(t => t.coutEstime) };
}

/**
 * La liste « À faire » : les tâches ouvertes des carnets non résolus (une tâche d'un résolu ne se réclame plus). Cette semaine : échéance au plus
 * le dimanche courant, retard compris, sans reproche (aucune marque « en retard ») ; Fin du mois : plus tard, dans le mois courant ; Plus loin :
 * les mois suivants (absent de la maquette, sinon ces tâches datées seraient perdues) ; Un jour : sans échéance. Groupes vides omis.
 */
export function aFaireDe(carnets: readonly CarnetDoc[], maintenant: string | number | Date): AFaire {
  const aujourdhui = typeof maintenant === 'string' ? jourLocal(maintenant) : jourLocal(new Date(maintenant).toISOString());
  const dimanche = dimancheDe(aujourdhui), fin = finDuMois(aujourdhui);
  const groupes = new Map<CleGroupe, TacheVue[]>();
  for (const c of carnets) {
    if (etatDe(c) === 'resolu') continue;
    for (const t of tachesDe(c)) {
      if (t.faiteLe) continue;
      /* C68-9 : un projet du Planning fini avant aujourd'hui n'est pas « Cette semaine » : il n'y a plus rien à faire (une tâche écrite en retard, elle, reste sans reproche) */
      if (t.derivee && t.finPlanning && t.finPlanning < aujourdhui) continue;
      const cle: CleGroupe = !t.echeance ? 'un-jour' : t.echeance <= dimanche ? 'cette-semaine' : t.echeance <= fin ? 'fin-du-mois' : 'plus-loin';
      groupes.set(cle, [...(groupes.get(cle) ?? []), t]);
    }
  }
  const trie = (l: TacheVue[]) => [...l].sort((a, b) => (a.echeance ?? '9999').localeCompare(b.echeance ?? '9999') || a.creeeLe.localeCompare(b.creeeLe) || a.id.localeCompare(b.id));
  const sortie = ORDRE.flatMap(cle => (groupes.has(cle) ? [{ cle, taches: trie(groupes.get(cle)!), cout: coutDe(groupes.get(cle)!) }] : []));
  const toutes = sortie.flatMap(g => g.taches);
  return { groupes: sortie, total: toutes.length, cout: coutDe(toutes) };
}
