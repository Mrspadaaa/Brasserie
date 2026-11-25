/**
 * C69-1 : le titre court d'une phrase tapée (« Garder à part », quand l'IA n'en propose pas) : la première proposition, jamais la phrase entière
 * (« trop de vapeur pendant l'ébullition, ça coule sur les murs » → « Trop de vapeur pendant l'ébullition »). Coupée à la première virgule,
 * point-virgule, deux-points ou point suivi d'un espace ; au besoin au dernier mot entier avant `max` caractères. La marque des données de test
 * (« ZZ TEST — ») est gardée devant, et ne compte pas dans le titre (L05).
 */
import { titreDePhrase } from './modele';

const MARQUE = /^\s*ZZ TEST\s*[—–-]\s*/i;

export function titreCourt(phrase: string, max = 60): string {
  const entiere = titreDePhrase(phrase);
  const marque = MARQUE.exec(entiere)?.[0].replace(/\s+$/, ' ') ?? '';
  let corps = entiere.slice(marque.length).trim();
  const coupe = /^(.{8,}?)\s*(?:[,;:]|\.(?=\s))\s/u.exec(`${corps} `);
  if (coupe) corps = coupe[1].trim();
  const place = Math.max(12, max - marque.length);
  if (corps.length > place) {
    const mots = corps.slice(0, place).split(/\s+/);
    if (mots.length > 1) mots.pop();
    corps = mots.join(' ').replace(/[\s,;:.–—-]+$/, '');
  }
  return `${marque}${corps}`.trim();
}
