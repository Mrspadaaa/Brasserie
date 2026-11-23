/**
 * Les règles d'état de la lecture d'un lien, sans dessin (test en ligne du tour 28, côté app) : où mène la barre repliée (T28-2), ce que dit
 * le bandeau quand on n'est pas dans le carnet du lien (T28-15), ce que « Compléter » et « Escalader » ont le droit de faire (T28-3, T28-4).
 * Pur : testé sans écran (`tests/unit/carnetsFix28App.test.ts`).
 */
import type { BandeauV } from './Bandeau';

/**
 * T28-2 : la barre repliée touchée depuis un autre carnet ouvre le carnet du lien (celui où il a été collé), pas le carnet d'à présent.
 * Rend l'id du carnet à ouvrir ; `null` : on y est déjà, ou le carnet du lien est inconnu (collé depuis la liste : on reste où l'on est).
 */
export function carnetAOuvrirDepuisBarre(carnetDuLien: string | null | undefined, carnetOuvert: string | null): string | null {
  if (!carnetDuLien || carnetDuLien === carnetOuvert) return null;
  return carnetDuLien;
}

/**
 * T28-15 : le retour « Rangé ici, à l'instant » dit « ici » ; sur la liste des Carnets (ou dans un autre carnet) « ici » ne veut rien dire :
 * le bandeau nomme le carnet où l'article est rangé. Sans nom de carnet connu, le bandeau reste tel quel.
 */
export function bandeauNommantLeCarnet(b: BandeauV, titre: string | undefined): BandeauV {
  if (!titre) return b;
  switch (b.sorte) {
    case 'range': return { sorte: 'ailleurs', carnet: titre };
    case 'article': return { sorte: 'ailleurs', carnet: titre, ...(b.rang ? { rang: b.rang } : {}) };
    case 'lien': return b.lu ? { sorte: 'ailleurs', carnet: titre } : b;
    case 'doublon': return { sorte: 'doublon', carnet: titre };
    default: return b;
  }
}

/** Ce que montre la carte d'échec d'un lien mort pendant et après une relecture « IA plus forte » (T28-4). */
export type Relecture = 'aucune' | 'en-cours' | 'finie';

/**
 * T28-4 : « Escalader » se joue une fois par échec : pendant la relecture le bouton est là mais éteint ; une fois la relecture finie sur un
 * lien toujours mort, il ne revient pas (la même IA forte ne dira pas autre chose).
 */
export function boutonEscalader(r: Relecture): 'actif' | 'attente' | 'absent' {
  return r === 'aucune' ? 'actif' : r === 'en-cours' ? 'attente' : 'absent';
}
