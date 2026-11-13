// Rayon du mur (Malts, Houblons, Levures) d'un article du stock : une seule règle, lue par le mur (murDonnees) ET par la liste sous le mur
// (StocksTab), pour que « Malts 7 » au mur montre 7 articles dans la liste. Fichier léger : StocksTab l'importe sans charger le mur.
import type { StockItem } from '../../types';

const sansAccent = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Un sucre est un fermentescible : il se range dans le rayon Malts (forme « creux » de sa légende), pas dans Additifs. */
const EST_SUCRE = /sucre|sugar|candi|dextrose|saccharose|glucose|sirop|\bmiel\b|honey/;
export const estSucre = (i: StockItem): boolean => !/^(houblon|levure)/i.test(i.category) && (/^sucre/i.test(sansAccent(i.category)) || EST_SUCRE.test(sansAccent(i.name)));

export type RayonMurNom = 'Malts' | 'Houblons' | 'Levures';
/** Le rayon du mur où l'article est rangé ; null : il va dans « Autres stocks ». */
export function rayonDuMur(i: StockItem): RayonMurNom | null {
  const c = i.category.toLowerCase();
  if (/^houblon/.test(c)) return 'Houblons';
  if (/^levure/.test(c)) return 'Levures';
  if (/^malt/.test(c) || estSucre(i)) return 'Malts';
  return null;
}
