/**
 * Voie p1 (mission stock, 12.11) — ce que la fiche « page entière » lit de plus qu'un article : sa famille (l'article et ses lots « bis »),
 * l'entrée de chaque lot (la date du premier achat enregistré) et le dernier prix. Aucun champ neuf : tout vient des articles et des mouvements.
 */
import type { StockItem } from '../../types';
import { canonicalStockCategory } from '../../services/stockLineMatching';
import { sansBis } from './donnees';
import type { MouvementBrut } from './mouvementsArticle';
import { nombreFr } from '../nombreAffiche';
import { Units } from '../../services/units';
import type { BrewPrice } from '../finance/brewBudget';

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

/**
 * Le dernier prix de l'article, par unité de l'article, lu depuis ses achats (cx, ST-T24) : le prix de la dernière ligne de facture rattachée à l'article
 * (`latestBrewPrices`, factures annulées exclues) ramené à l'unité du stock (« 2,30 CHF / kg » pour deux achats à 2,30). Une ligne dans une unité qui
 * ne se convertit pas en celle de l'article ne donne rien. Sans achat lu, le prix de la fiche de l'article (ancien champ) ; sinon null : jamais 0.
 */
export function prixDernierAchat(article: Pick<StockItem, 'ref' | 'unit' | 'pricePerUnit'>, achats: Readonly<Record<string, BrewPrice>>): number | null {
  const a = achats[article.ref];
  if (a && a.amount > 0 && a.quantity > 0 && a.unit) {
    const quantite = Units.convert(a.quantity, a.unit, article.unit);
    if (quantite !== null && quantite > 0) return a.amount / quantite;
  }
  return typeof article.pricePerUnit === 'number' && article.pricePerUnit > 0 ? article.pricePerUnit : null;
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

/** « 1 200,5 » : virgule suisse, espace fine en milliers, deux décimales au plus (le format de la maquette B4, `fmt`). */
export function nombreSuisse(v: number): string {
  const r = Math.round(v * 100) / 100;
  const [ent, dec] = String(Math.abs(r)).split('.');
  const e = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (r < 0 ? '−' : '') + e + (dec ? `,${dec}` : '');
}

/** La quantité dans l'unité de l'article, sans conversion (« 1 200 g », « 0,35 kg », « 2 sachets ») ; « ? » si inconnue, jamais 0. */
export function quantiteArticle(v: number | null | undefined, unite: string): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '?';
  const u = unite === 'sachet' && Math.abs(v) > 1 ? 'sachets' : unite;
  return `${nombreSuisse(v)} ${u}`.trim();
}

/** « +30 », « −110 », « ±0 » : la variation d'un mouvement. */
export function variation(v: number): string {
  return v > 0 ? `+${nombreSuisse(v)}` : v < 0 ? `−${nombreSuisse(-v)}` : '±0';
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
/** « août » d'une date AAAA-MM-JJ ; null si illisible. */
export function nomDuMois(iso: string | null | undefined): string | null {
  const m = iso ? /^\d{4}-(\d{2})-\d{2}/.exec(iso) : null;
  return m ? MOIS[Number(m[1]) - 1] ?? null : null;
}

/** Le remplaçant que la fiche k2 d'un houblon montre (« ou Mosaic · en stock 250 g · proche ») : le meilleur remplaçant du moteur de substitution v4
 * (`substitutes()`), le premier en stock s'il y en a un, sinon le premier tout court (« à acheter »). Rien n'est inventé : variété inconnue du catalogue = null. */
export interface RemplacantFiche {
  cle: string;
  nom: string;
  etat: 'en stock' | 'épuisé' | 'à acheter';
  /** Grammes libres en stock ; null = pas en stock. */
  libre: number | null;
  /** « très proche », « proche », « partiel » ou « éloigné » : le palier du score du moteur, dit tel quel. */
  palier: string;
  score: number;
}

/** Le moteur est chargé à la demande (il pèse lourd) ; le stock injecté est celui des articles « Houblon » de l'app. */
export async function remplacantDe(item: StockItem, tous: StockItem[]): Promise<RemplacantFiche | null> {
  if (canonicalStockCategory(item.category) !== 'Houblon') return null;
  const [{ creerMoteur }, { catalogue }, { relierStock, varieteDe }] = await Promise.all([
    import('../hopIndex/v4/moteur'), import('../hopIndex/v4/data'), import('../hopIndex/v4/donneesApp')
  ]);
  const fiches = catalogue();
  const v = varieteDe(item.name, fiches);
  if ('raison' in v) return null;
  const cle = v.h.id + (/cryo/i.test(item.name) ? ':cryo' : '');
  const stock = relierStock(tous.filter(a => canonicalStockCategory(a.category) === 'Houblon'), fiches).stock;
  try {
    const res = creerMoteur({ catalogue: fiches, stock }).substitutes(cle, { stockFirst: true, limit: 60 });
    const ok = res.remplacants.filter(s => !s.memeVariete);
    const choisi = ok.find(s => s.stock.etat === 'en stock' && s.palier !== 'éloigné') ?? ok[0];
    return choisi ? { cle: choisi.key, nom: choisi.name, etat: choisi.stock.etat, libre: choisi.stock.etat === 'en stock' ? choisi.stock.libre : null, palier: choisi.palier, score: choisi.score } : null;
  } catch { return null; } // une clé que le moteur ne connaît pas (cryo sans fiche) : pas de remplaçant plutôt qu'un faux
}

/** « ou Mosaic · en stock 250 g · proche » (maquette k2) ; « ou Mosaic · à acheter · proche » quand aucun n'est en stock. */
export function phraseRemplacant(r: RemplacantFiche): { nom: string; reste: string } {
  const stock = r.etat === 'en stock' && r.libre !== null ? `en stock ${quantiteArticle(r.libre, 'g')}` : r.etat === 'épuisé' ? 'épuisé' : 'à acheter';
  return { nom: `ou ${r.nom}`, reste: ` · ${stock} · ${r.palier}` };
}
