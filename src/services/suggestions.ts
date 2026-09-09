import { FinanceCategory, StockItem, Transaction, Batch } from '../types';
import { StorageService } from './storage';
import { brewingStyles } from '../domain/brewingStyles';

/**
 * Préremplissage des formulaires, DÉRIVÉ DES DONNÉES RÉELLES.
 *
 * Règle absolue : **rien n'est inventé**. Chaque valeur proposée vient d'une
 * écriture, d'un article ou d'un brassin qui existe dans la base. Un champ qu'on
 * ne peut pas déduire reste vide — jamais rempli d'une valeur plausible.
 *
 * Ce module remplace les « gabarits 1 clic » qui étaient cinq lignes codées en
 * dur avec des montants fixes (110.39 CHF chez Brau-Rauchshop…). Un gabarit
 * devient un fournisseur RÉELLEMENT récurrent, avec ses valeurs habituelles.
 */

export interface VendorSuggestion {
  name: string;
  category: FinanceCategory;
  tvaRate: number;
  /** Nombre d'écritures qui le mentionnent — sert à trier et à justifier. */
  count: number;
  /** Dernier montant HT facturé, à titre d'ordre de grandeur. Jamais pré-rempli. */
  lastAmountHT?: number;
  lastDate?: string;
  /** Articles habituellement reçus de ce fournisseur, du plus fréquent au moins. */
  usualItems: Array<{ ref: string; name: string; unit: string; typicalQty: number }>;
}

export interface ItemSuggestion {
  ref: string;
  name: string;
  unit: string;
  category: string;
  supplier?: string;
  currentStock: number;
  favorite?: boolean;
  /** Dernière quantité reçue de cet article. */
  lastQty?: number;
  /** Dernier prix unitaire connu. */
  lastPricePerUnit?: number;
}

/** Nom de fournisseur tel qu'il est stocké dans `proofNotes`. */
function vendorOf(tx: Transaction): string {
  return (tx.proofNotes?.replace(/^Fournisseur:\s*/i, '') || '').split('·')[0].trim();
}

function mostFrequent<T>(m: Map<T, number>, fallback: T): T {
  let best = fallback;
  let bestCount = 0;
  m.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  });
  return best;
}

/** Compare deux dates JJ.MM.AAAA. */
function isAfter(a: string, b: string): boolean {
  const p = (d: string) => {
    const [dd, mm, yy] = (d || '').split('.');
    return `${yy || '0000'}${(mm || '00').padStart(2, '0')}${(dd || '00').padStart(2, '0')}`;
  };
  return p(a) > p(b);
}

export const Suggestions = {
  /**
   * Fournisseurs récurrents, avec ce qu'on leur commande d'habitude.
   *
   * Remplace les gabarits codés en dur : ici tout provient des écritures
   * réellement enregistrées, y compris les articles, déduits du `stockImpact`
   * que chaque achat conserve.
   */
  vendors(): VendorSuggestion[] {
    const txs = StorageService.getTransactions();
    const map = new Map<
      string,
      {
        count: number;
        categories: Map<FinanceCategory, number>;
        rates: Map<number, number>;
        lastAmountHT?: number;
        lastDate?: string;
        items: Map<string, { name: string; unit: string; qtys: number[] }>;
      }
    >();

    txs.forEach((t) => {
      if (t.category === 'recettes' || t.category === 'apports') return;
      const name = vendorOf(t);
      if (!name || name.length < 3) return;

      const e =
        map.get(name) ??
        {
          count: 0,
          categories: new Map<FinanceCategory, number>(),
          rates: new Map<number, number>(),
          items: new Map<string, { name: string; unit: string; qtys: number[] }>()
        };

      e.count += 1;
      e.categories.set(t.category, (e.categories.get(t.category) ?? 0) + 1);
      e.rates.set(t.tvaRate, (e.rates.get(t.tvaRate) ?? 0) + 1);

      if (!e.lastDate || isAfter(t.date, e.lastDate)) {
        e.lastDate = t.date;
        e.lastAmountHT = t.amountHT;
      }

      // Les articles réellement reçus, tirés de l'impact stock de l'écriture.
      t.stockImpact?.forEach((imp) => {
        const it = e.items.get(imp.itemRef) ?? { name: imp.itemName, unit: imp.unit, qtys: [] };
        it.qtys.push(imp.addedQty);
        e.items.set(imp.itemRef, it);
      });

      map.set(name, e);
    });

    return Array.from(map.entries())
      .map(([name, d]) => ({
        name,
        count: d.count,
        category: mostFrequent<FinanceCategory>(d.categories, 'divers'),
        tvaRate: mostFrequent<number>(d.rates, 0.081),
        lastAmountHT: d.lastAmountHT,
        lastDate: d.lastDate,
        usualItems: Array.from(d.items.entries())
          .map(([ref, it]) => ({
            ref,
            name: it.name,
            unit: it.unit,
            // Quantité typique = médiane des quantités reçues, plus robuste
            // qu'une moyenne face à une commande exceptionnelle.
            typicalQty: median(it.qtys)
          }))
          .sort((a, b) => b.typicalQty - a.typicalQty)
      }))
      .sort((a, b) => b.count - a.count);
  },

  /** Tout ce qui peut être reçu en stock, enrichi de son historique d'achat. */
  stockItems(): ItemSuggestion[] {
    const stocks = StorageService.getStocks();
    const txs = StorageService.getTransactions();

    // Dernier achat connu par référence d'article.
    const lastByRef = new Map<string, { qty: number; date: string; price?: number }>();
    txs.forEach((t) => {
      t.stockImpact?.forEach((imp) => {
        const prev = lastByRef.get(imp.itemRef);
        if (!prev || isAfter(t.date, prev.date)) {
          lastByRef.set(imp.itemRef, { qty: imp.addedQty, date: t.date });
        }
      });
    });

    const all = [...stocks.rawMaterials, ...stocks.cleaning];
    return all
      .map((i) => ({
        ref: i.ref,
        name: i.name,
        unit: i.unit,
        category: i.category,
        supplier: i.supplier,
        currentStock: i.currentStock,
        favorite: i.favorite,
        lastQty: lastByRef.get(i.ref)?.qty,
        lastPricePerUnit: i.pricePerUnit
      }))
      .sort(byFavoriteThenName);
  },

  /** Articles habituellement reçus de ce fournisseur, prêts à être ajoutés. */
  itemsForVendor(vendorName: string): ItemSuggestion[] {
    const vendor = this.vendors().find(
      (v) => v.name.toLowerCase() === vendorName.trim().toLowerCase()
    );
    const items = this.stockItems();

    if (!vendor || vendor.usualItems.length === 0) {
      // Pas d'historique avec ce fournisseur : on propose ce qui lui est
      // rattaché dans la fiche article, et rien de plus.
      return items.filter(
        (i) => i.supplier && i.supplier.toLowerCase() === vendorName.trim().toLowerCase()
      );
    }

    const order = new Map<string, number>(vendor.usualItems.map((u, idx) => [u.ref, idx] as [string, number]));
    return items
      .filter((i) => order.has(i.ref))
      .sort((a, b) => (order.get(a.ref) ?? 0) - (order.get(b.ref) ?? 0))
      .map((i) => ({
        ...i,
        lastQty: vendor.usualItems.find((u) => u.ref === i.ref)?.typicalQty ?? i.lastQty
      }));
  },

  /**
   * Ingrédients du dernier brassin de ce style — point de départ d'une nouvelle
   * recette, à partir de ce qui a réellement été brassé.
   */
  lastBatchOfStyle(style: string): Batch | undefined {
    const s = style.trim().toLowerCase();
    if (!s) return undefined;
    return StorageService.getBatches()
      .filter((b) => b.status !== 'annule' && b.style?.toLowerCase().includes(s))
      .sort((a, b) => (isAfter(a.brewDate, b.brewDate) ? -1 : 1))[0];
  },

  /** Styles déjà brassés, pour proposer sans rien inventer. */
  knownStyles(): string[] {
    const set = new Set<string>();
    StorageService.getBatches().forEach((b) => b.style && set.add(b.style.trim()));
    StorageService.getRecipes().forEach((r) => r.style && set.add(r.style.trim()));
    return Array.from(set).sort();
  },

  /** Unités déjà employées dans le stock, pour proposer les bonnes. */
  recipeStyles(): string[] {
    return [...new Set([...this.knownStyles(), ...brewingStyles(StorageService.getHopKnowledge()).flatMap(s => [s.name, ...s.aliases])])].sort((a,b)=>a.localeCompare(b,'fr'));
  },

  knownUnits(): string[] {
    const stocks = StorageService.getStocks();
    const set = new Set<string>(['kg', 'g', 'L', 'sachet', 'pièce']);
    [...stocks.rawMaterials, ...stocks.cleaning].forEach((i) => i.unit && set.add(i.unit));
    return Array.from(set);
  },

  /** Catégories réellement présentes dans le stock. */
  knownCategories(): string[] {
    const stocks = StorageService.getStocks();
    const set = new Set<string>();
    [...stocks.rawMaterials, ...stocks.cleaning].forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Tri commun : les épinglés d'abord, puis par ordre alphabétique. */
export function byFavoriteThenName<T extends { favorite?: boolean; name: string }>(
  a: T,
  b: T
): number {
  if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1;
  return a.name.localeCompare(b.name, 'fr');
}
