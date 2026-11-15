/**
 * Colonne « Dernier mouvement » de la liste du Stock à partir de 900 px (maquette sy/fA g6 : « achat · 06.11 · +0,5 kg », « LOT-018 · 09.11 · −0,2 kg »,
 * « inventaire · 01.11 · ±0 »). Source : les mouvements réels de l'article (`mouvementsDeFamille`, du plus récent au plus ancien) ; aucun mouvement :
 * « — », jamais « 0 ». Une date ou une variation que le mouvement ne porte pas n'est pas dite (jamais inventée).
 */
import type { Batch, StockItem } from '../../types';
import { mouvementsDeFamille, type MouvementArticle, type MouvementBrut } from './mouvementsArticle';
import { quantiteDite } from './ligne';

/** Regroupe les mouvements bruts par référence d'article (une fois par liste, pas une fois par ligne). */
export function mouvementsParRef(bruts: ReadonlyArray<MouvementBrut>): Map<string, MouvementBrut[]> {
  const m = new Map<string, MouvementBrut[]>();
  for (const b of bruts) {
    const ref = b.stockItemRef ?? b.itemRef;
    if (!ref) continue;
    const l = m.get(ref);
    if (l) l.push(b); else m.set(ref, [b]);
  }
  return m;
}

const MOT: Record<MouvementArticle['genre'], string> = { achat: 'achat', annulation: 'achat annulé', brassage: 'brassin', inventaire: 'inventaire', correction: 'correction' };

/** « +0,5 kg », « −0,2 kg » (vrai signe moins), « ±0 » ; null quand la variation est inconnue. */
function variationDite(delta: number | null, unite: string): string | null {
  if (delta === null) return null;
  if (Math.abs(delta) < 1e-9) return '±0';
  return `${delta > 0 ? '+' : '−'}${quantiteDite(Math.abs(delta), unite)}`;
}

/** La phrase du dernier mouvement d'un article, ou « — » quand aucun mouvement n'est connu. */
export function dernierMouvementDit(item: Pick<StockItem, 'ref' | 'currentStock' | 'supplier' | 'unit'>, brutsDeLArticle: ReadonlyArray<MouvementBrut>, batches: Pick<Batch, 'id' | 'name'>[] = []): string {
  if (brutsDeLArticle.length === 0) return '—';
  const { liste } = mouvementsDeFamille([{ ref: item.ref, currentStock: item.currentStock, supplier: item.supplier }], [...brutsDeLArticle], batches);
  const m = liste[0]; // `liste` va du plus récent au plus ancien
  if (!m) return '—';
  const nom = m.genre === 'brassage' ? (m.titre.split(' · ')[0] || MOT.brassage) : MOT[m.genre];
  const jour = m.date ? `${m.date.slice(8, 10)}.${m.date.slice(5, 7)}` : null;
  return [nom, jour, variationDite(m.delta, item.unit)].filter((x): x is string => x !== null).join(' · ');
}
