/**
 * C69-1 : le titre court d'une phrase tapée (« Garder à part », quand l'IA n'en propose pas) : la première proposition, jamais la phrase entière
 * (« trop de vapeur pendant l'ébullition, ça coule sur les murs » → « Trop de vapeur pendant l'ébullition »). Coupée à la première virgule,
 * point-virgule, deux-points ou point suivi d'un espace ; au besoin au dernier mot entier avant `max` caractères. La marque des données de test
 * (« ZZ TEST — ») est gardée devant, et ne compte pas dans le titre (L05).
 *
 * C71-5 : la maquette v01-saisie dit « Écart réfractomètre et densimètre » (33 caractères) : un titre fait au plus 40 caractères, et ne finit jamais
 * sur un mot-outil (verbe auxiliaire, article, préposition) : « la condensation de l'ébullition fait goutter … » → « la condensation de l'ébullition ».
 */
import { titreDePhrase } from './modele';

const MARQUE = /^\s*ZZ TEST\s*[—–-]\s*/i;

export const TITRE_COURT_MAX = 40;

/** Le dernier mot (ou l'élision « l' », « d' ») ne dit rien seul : il appelle la suite que le titre n'a pas. */
const MOT_OUTIL_FINAL = /(?:^|[\s'’])(?:fait|font|est|sont|a|ont|va|vont|de|du|des|d|la|le|les|l|un|une|et|ou|qui|que|qu|dans|sur|pour|par|à|au|aux|en|ne|se|ce|goutter|couler)$/iu;

/** Sans le dernier mot (et son apostrophe d'élision), ni ponctuation de fin. */
const sansDernierMot = (t: string): string => t.replace(/[\s'’]*[^\s'’]+$/u, '').replace(/[\s,;:.–—-]+$/u, '');

export function titreCourt(phrase: string, max = TITRE_COURT_MAX): string {
  const entiere = titreDePhrase(phrase);
  const marque = MARQUE.exec(entiere)?.[0].replace(/\s+$/, ' ') ?? '';
  let corps = entiere.slice(marque.length).trim();
  const coupe = /^(.{8,}?)\s*(?:[,;:]|\.(?=\s))\s/u.exec(`${corps} `);
  if (coupe) corps = coupe[1].trim();
  const place = Math.max(12, max);
  if (corps.length > place) {
    /* au dernier mot entier qui tient : si le caractère qui suit les `place` premiers est une espace, le dernier mot est entier */
    const mots = corps.slice(0, place).split(/\s+/);
    if (mots.length > 1 && !/\s/u.test(corps.charAt(place))) mots.pop();
    corps = mots.join(' ').replace(/[\s,;:.–—-]+$/u, '');
    for (let i = 0; i < 4 && MOT_OUTIL_FINAL.test(corps); i++) {
      const moins = sansDernierMot(corps);
      if (moins.length < 12) break;
      corps = moins;
    }
  }
  return `${marque}${corps}`.trim();
}
