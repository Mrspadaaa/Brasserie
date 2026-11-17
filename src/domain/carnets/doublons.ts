/**
 * Carnet d'idées : quasi-doublons de notes courtes (G11 « Même chose que la note du … », G33 « ✻ doublon ? »).
 *
 * État de l'art (MISSION) : normalisation (NFD, minuscules, mots vides retirés, racine légère), similarité de Jaccard sur les jetons, un
 * jeton d'au moins 5 lettres pouvant correspondre par fuse.js (faute de frappe, accord) ; seuil réglé sur une moitié des paires de
 * `carnetsDoublons.test.ts` et jugé sur l'autre (L20, critère A10). MinHash et simhash écartés (inutiles à 50 notes).
 */
import Fuse from 'fuse.js';
import { jetons } from './analyseLocale';
import type { CarnetDoc, Note } from './modele';

/** Seuil réglé sur la première moitié des paires (A10). */
export const SEUIL_DOUBLON = 0.4;

/** Correspondances un à un entre deux jeux de jetons : même racine, sinon proche par fuse.js (≥ 5 lettres). */
function correspondances(a: readonly string[], b: readonly string[]): number {
  const restants = [...b];
  let n = 0;
  for (const j of a) {
    let i = restants.indexOf(j);
    if (i < 0 && j.length >= 5 && restants.length) {
      const r = new Fuse(restants.filter(x => x.length >= 5), { includeScore: true, threshold: 0.2, ignoreLocation: true }).search(j)[0];
      if (r) i = restants.indexOf(r.item);
    }
    if (i >= 0) { n += 1; restants.splice(i, 1); }
  }
  return n;
}

/** Similarité de Jaccard entre deux textes (0 à 1). */
export function similarite(a: string, b: string): number {
  const ja = [...new Set(jetons(a))], jb = [...new Set(jetons(b))];
  if (!ja.length || !jb.length) return 0;
  const communs = correspondances(ja, jb);
  return communs / (ja.length + jb.length - communs);
}

export interface Doublon { noteId: string; score: number }

/** Les notes qui doublent un texte, de la plus proche à la moins proche. */
export function doublonsDe(texte: string, notes: readonly Note[], seuil = SEUIL_DOUBLON): Doublon[] {
  return notes
    .map(n => ({ noteId: n.id, score: Math.round(similarite(texte, n.texte) * 1000) / 1000 }))
    .filter(d => d.score >= seuil)
    .sort((x, y) => y.score - x.score);
}

/** Les paires de notes en double dans un carnet (G33), chaque paire une fois, la plus ancienne d'abord. */
export function notesEnDouble(c: CarnetDoc, seuil = SEUIL_DOUBLON): [string, string][] {
  const notes = c.carnet.notes;
  const paires: [string, string][] = [];
  for (let i = 0; i < notes.length; i += 1) for (let j = i + 1; j < notes.length; j += 1) {
    if (similarite(notes[i].texte, notes[j].texte) >= seuil) paires.push([notes[i].id, notes[j].id]);
  }
  return paires;
}
