/**
 * Voie p1 (mission stock, 12.11) — ce que la fiche « page entière » lit de plus qu'un article : sa famille (l'article et ses lots « bis »),
 * l'entrée de chaque lot (la date du premier achat enregistré) et le dernier prix. Aucun champ neuf : tout vient des articles et des mouvements.
 */
import type { StockItem } from '../../types';
import { canonicalStockCategory } from '../../services/stockLineMatching';
import { sansBis } from './donnees';
import type { MouvementBrut } from './mouvementsArticle';
import { nombreFr } from '../nombreAffiche';

const cle = (nom: string) => sansBis(nom).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Les articles « bis » d'une même variété et d'une même catégorie : l'article ouvert d'abord, puis les autres par nom. */
export function familleDe(item: StockItem, tous: StockItem[]): StockItem[] {
  const categorie = canonicalStockCategory(item.category);
  const freres = tous.filter(a => a.ref !== item.ref && canonicalStockCategory(a.category) === categorie && cle(a.name) === cle(item.name));
  return [item, ...freres.sort((a, b) => a.name.localeCompare(b.name, 'fr'))];
}

export interface Lot {
  ref: string;
  nom: string;
  stock: number;
  unite: string;
  alpha: number | null;
  /** AAAA-MM-JJ du premier achat enregistré pour cet article ; null = inconnue (jamais inventée). */
  entree: string | null;
  fournisseur: string | null;
  factureId: string | null;
  prix: number | null;
}

/** Les lots de la famille, le plus ancien d'abord (un lot sans date connue passe après les autres). */
export function lotsDe(famille: StockItem[], bruts: MouvementBrut[]): Lot[] {
  return famille.map(a => {
    const achats = bruts.filter(m => m.type === 'receipt' && (m.stockItemRef ?? m.itemRef) === a.ref && /^\d{4}-\d{2}-\d{2}/.test(m.date ?? m.createdAt ?? ''))
      .sort((x, y) => (x.date ?? x.createdAt ?? '').localeCompare(y.date ?? y.createdAt ?? ''));
    const premier = achats[0];
    return {
      ref: a.ref, nom: a.name, stock: a.currentStock, unite: a.unit,
      alpha: typeof a.alphaPct === 'number' && Number.isFinite(a.alphaPct) ? a.alphaPct : null,
      entree: premier ? (premier.date ?? premier.createdAt ?? '').slice(0, 10) : null,
      fournisseur: a.supplier?.trim() || null,
      factureId: premier?.transactionId ?? null,
      prix: typeof a.pricePerUnit === 'number' && a.pricePerUnit > 0 ? a.pricePerUnit : null
    };
  }).sort((a, b) => a.entree === null ? (b.entree === null ? 0 : 1) : b.entree === null ? -1 : a.entree.localeCompare(b.entree));
}

/** « 100 g · 10,10 CHF » : le prix d'une quantité ronde (100 g pour un houblon, 1 unité sinon). Null = prix inconnu. */
export function prixLu(prixParUnite: number | null | undefined, unite: string): string | null {
  if (typeof prixParUnite !== 'number' || !(prixParUnite > 0)) return null;
  const base = unite === 'g' ? 100 : 1;
  const montant = Math.round(prixParUnite * base * 100) / 100;
  return `${base} ${unite} · ${nombreFr(montant, 2)} CHF`;
}

/** « 25.08 » (JJ.MM) d'une date AAAA-MM-JJ ; « 25.08.2026 » si l'année n'est pas celle de `aujourdhui`. */
export function jourCourt(iso: string | null | undefined, aujourdhui: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const [a, m, j] = iso.slice(0, 10).split('-');
  return a === aujourdhui.slice(0, 4) ? `${j}.${m}` : `${j}.${m}.${a}`;
}

const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
/** « ven. 06.11 » comme B4. */
export function jourSemaine(iso: string | null | undefined, aujourdhui: string): string | null {
  const court = jourCourt(iso, aujourdhui);
  if (!court || !iso) return null;
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return `${JOURS[new Date(Date.UTC(a, m - 1, j)).getUTCDay()]} ${court}`;
}
