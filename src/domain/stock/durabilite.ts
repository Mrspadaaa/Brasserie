import type { StockItem } from '../../types';
import { rayonDuMur } from './murRayon';
import { libelleDurabilite, statutDurabilite, type StatutDurabilite } from './regles';

/**
 * AM-56 : les levures en stock dont la date de durabilité (DDM, `yeastLot.expiresOn`) est dépassée ou à moins de 30 jours.
 * Sert au Bord : un sachet périmé ne doit pas se brasser sans que le brasseur l'ait vu. Les règles (périmé le lendemain de la date,
 * « bientôt » = 30 jours) viennent de `regles.ts`, une seule maison. Une levure sans date lisible, épuisée, ou valide n'en fait pas partie :
 * l'inconnu n'est ni périmé ni valide, il ne se signale pas ici (la fiche dit « DDM ? »).
 */
export interface LevureADateProche { item: StockItem; statut: Extract<StatutDurabilite, 'perime' | 'bientot'>; jours: number; texte: string }

export function levuresADateProche(items: readonly StockItem[], aujourdhuiIso: string): LevureADateProche[] {
  const out: LevureADateProche[] = [];
  for (const item of items) {
    if (rayonDuMur(item) !== 'Levures' || !(item.currentStock > 0)) continue;
    const { statut, jours } = statutDurabilite(item.yeastLot?.expiresOn, aujourdhuiIso);
    const dit = libelleDurabilite(item.yeastLot?.expiresOn, aujourdhuiIso);
    if ((statut === 'perime' || statut === 'bientot') && jours !== null && dit) out.push({ item, statut, jours, texte: dit.texte });
  }
  return out.sort((a, b) => a.jours - b.jours);
}
