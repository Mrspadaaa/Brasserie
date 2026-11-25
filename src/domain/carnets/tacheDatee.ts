/**
 * C69-9 : une phrase qui pose une ÉCHÉANCE (« appeler l'électricien … avant le 12 décembre ») est une tâche datée de « À faire », même quand l'IA est éteinte.
 * Motif fermé : un marqueur d'échéance (avant, pour, d'ici, au plus tard), « le » facultatif, un jour et un NOM de mois français. Aucune autre forme n'est
 * devinée (« fin du mois », « semaine prochaine » : l'IA les propose, avec son OK) ; une date sans marqueur reste une note.
 * La date se pose comme les autres tâches : le lundi de sa semaine (`echeanceDe`, taches.ts). Un jour déjà passé cette année vaut l'an prochain.
 * État de l'art : voir RESULTAT.md de c69-fix (chrono-node reconnaît ces formes mais n'est pas au projet ; ici douze noms de mois, rien d'autre).
 */
import { echeanceDe } from './taches';

const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const sansAccent = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const MARQUE = /\b(?:avant|pour|d['’]ici|au plus tard)\s+(?:le\s+)?(1er|\d{1,2})\s+([a-zéûè]+)\b/iu;

export interface TacheDatee { texte: string; echeance: string }

export function tacheDatee(phrase: string, maintenant: Date): TacheDatee | null {
  const texte = phrase.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim();
  const m = MARQUE.exec(texte);
  if (!m) return null;
  const jour = m[1] === '1er' ? 1 : Number(m[1]);
  const mois = MOIS.indexOf(sansAccent(m[2]));
  if (mois < 0 || jour < 1 || jour > 31) return null;
  const an = maintenant.getFullYear();
  const aujourdhui = new Date(an, maintenant.getMonth(), maintenant.getDate()).getTime();
  const annee = new Date(an, mois, jour).getTime() < aujourdhui ? an + 1 : an;
  const date = new Date(annee, mois, jour);
  if (date.getMonth() !== mois) return null;
  const iso = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
  const echeance = echeanceDe(iso, 'semaine');
  return echeance ? { texte, echeance } : null;
}
