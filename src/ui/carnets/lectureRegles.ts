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

/**
 * T30-1, T30-3 : la carte des étapes (entière) n'a sa place que dans la vue où le lien a été collé : le carnet du lien, ou la liste si le
 * lien y a été collé. Partout ailleurs (autre carnet, liste d'un lien collé dans un carnet) la lecture vit dans la barre repliée (v01), en bas.
 * `carnetDuLien` : le carnet de collage gardé avec la lecture (`null` : collé depuis la liste ; `undefined` : inconnu) ; `carnetDuMessage` :
 * le carnet où le message a rangé son article, s'il y en a un déjà.
 */
export function lectureIci(o: { carnetDuLien: string | null | undefined; carnetDuMessage?: string | undefined; idOuvert: string | null }): boolean {
  const { carnetDuLien, carnetDuMessage, idOuvert } = o;
  if (carnetDuLien === null && idOuvert === null) return true;
  const lieu = carnetDuMessage ?? carnetDuLien ?? undefined;
  if (lieu === undefined) return true;
  return idOuvert === lieu;
}

/** La carte est repliée en barre si le brasseur l'a repliée, ou s'il n'est pas dans la vue du lien. */
export const carteEnBarre = (replie: boolean, ici: boolean): boolean => replie || !ici;

/** T30-5 : les questions de la carte de fin auxquelles le brasseur a répondu « C'est le bon », par message (gardées : la question ne revient pas). */
export type Bons = Readonly<Record<string, readonly string[]>>;
export const CLE_BONS = 'affinee.carnets.lecturesBonnes';
const MAX_MESSAGES_BONS = 60;

export function avecBon(bons: Bons, messageId: string, cle: string): Bons {
  if (bons[messageId]?.includes(cle)) return bons;
  const suite = { ...bons, [messageId]: [...(bons[messageId] ?? []), cle] };
  const ids = Object.keys(suite);
  /* garde les plus récents : un objet garde l'ordre d'insertion */
  return ids.length > MAX_MESSAGES_BONS ? Object.fromEntries(ids.slice(-MAX_MESSAGES_BONS).map(id => [id, suite[id]])) : suite;
}

/** Lu sur l'appareil ; tout ce qui n'est pas une liste de textes par message est ignoré (jamais une erreur). */
export function lireBons(stock: Pick<Storage, 'getItem'> | undefined): Bons {
  try {
    const brut = stock?.getItem(CLE_BONS);
    const v: unknown = brut ? JSON.parse(brut) : null;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const sortie: Record<string, string[]> = {};
    for (const [id, l] of Object.entries(v as Record<string, unknown>)) if (Array.isArray(l)) sortie[id] = l.filter((x): x is string => typeof x === 'string');
    return sortie;
  } catch { return {}; }
}

export function garderBons(stock: Pick<Storage, 'setItem'> | undefined, bons: Bons): void {
  try { stock?.setItem(CLE_BONS, JSON.stringify(bons)); } catch { /* stockage plein ou refusé : la réponse reste valable pour la session */ }
}
