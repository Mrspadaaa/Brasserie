/**
 * Voie p1 (mission stock, 12.11) — « Ce qui a bougé » de la fiche d'article : les mouvements réels d'un article (ou de tous ses lots « bis »),
 * leur avant → après, et l'escalier du solde de la maquette B4 (une marche par mouvement), avec le besoin et le seuil.
 *
 * Les mouvements viennent de la collection `movements` : achat (`receipt`, sans stock avant/après), annulation d'achat (`receipt-reversal`),
 * inventaire (`inventory-adjustment`, R4) et brassage (écrit par `completeBrewStock`, avec `batchId`, `previousStock`, `newStock`).
 * Un mouvement sans stock avant/après se déduit de son voisin plus récent, en partant du stock actuel. Quand la chaîne ne se recolle pas
 * (une fiche enregistrée à la main entre deux mouvements), l'écart est dit (`ecart`), jamais effacé ni mis à 0.
 */
import type { Batch } from '../../types';

export type GenreMouvement = 'achat' | 'annulation' | 'brassage' | 'inventaire' | 'correction';

export interface MouvementBrut {
  id?: string; type?: string;
  stockItemRef?: string; itemRef?: string; batchId?: string;
  quantity?: number; delta?: number; previousStock?: number; newStock?: number; unit?: string;
  transactionId?: string; date?: string; createdAt?: string; timestamp?: string;
  reasonCode?: string; reason?: string; note?: string;
}

export interface MouvementArticle {
  id: string;
  ref: string;
  genre: GenreMouvement;
  titre: string;
  /** AAAA-MM-JJ ; null si le mouvement ne porte aucune date lisible. */
  date: string | null;
  /** Stock de la famille (l'article et ses lots « bis ») avant et après ; null = inconnu, jamais 0. */
  avant: number | null;
  apres: number | null;
  delta: number | null;
  detail: string | null;
  lien: { genre: 'facture'; id: string } | { genre: 'brassin'; id: string } | null;
  /** Le stock de cet article juste avant ce mouvement diffère de ce que disait le mouvement précédent : la quantité de l'écart, sinon null. */
  ecart: number | null;
}

const nombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const arrondi = (v: number) => Math.round(v * 1e6) / 1e6;
const cleTemps = (m: MouvementBrut) => m.createdAt ?? m.timestamp ?? m.date ?? '';
const jourDe = (m: MouvementBrut): string | null => {
  const brut = m.date ?? m.createdAt ?? m.timestamp ?? '';
  return /^\d{4}-\d{2}-\d{2}/.test(brut) ? brut.slice(0, 10) : null;
};

function genreDe(m: MouvementBrut): GenreMouvement | null {
  if (m.type === 'receipt') return 'achat';
  if (m.type === 'receipt-reversal') return 'annulation';
  if (m.type === 'inventory-adjustment') return m.reasonCode === 'comptage' ? 'inventaire' : 'correction';
  if (!m.type && m.batchId) return 'brassage';
  return null;
}
const deltaDe = (m: MouvementBrut, genre: GenreMouvement): number | null => {
  if (genre === 'achat') return nombre(m.quantity) ? m.quantity : nombre(m.delta) ? m.delta : null;
  if (nombre(m.delta)) return m.delta;
  return nombre(m.previousStock) && nombre(m.newStock) ? arrondi(m.newStock - m.previousStock) : null;
};

interface Chaine { brut: MouvementBrut; genre: GenreMouvement; ref: string; delta: number | null; avant: number | null; apres: number | null; ecart: number | null }

/** La chaîne d'un article : du plus récent au plus ancien, chaque mouvement avec son stock avant et après, rien d'inventé. */
function chaineDeArticle(ref: string, bruts: MouvementBrut[], stockActuel: number | null): Chaine[] {
  const propres = bruts
    .filter(m => (m.stockItemRef ?? m.itemRef) === ref)
    .map(brut => ({ brut, genre: genreDe(brut) }))
    .filter((x): x is { brut: MouvementBrut; genre: GenreMouvement } => x.genre !== null)
    .sort((a, b) => cleTemps(b.brut).localeCompare(cleTemps(a.brut)) || String(b.brut.id ?? '').localeCompare(String(a.brut.id ?? '')));
  const sortie: Chaine[] = [];
  let apresVoisin: number | null = stockActuel; // le stock juste après le mouvement en cours, lu du voisin plus récent
  for (const { brut, genre } of propres) {
    const delta = deltaDe(brut, genre);
    const apres = nombre(brut.newStock) ? brut.newStock : apresVoisin;
    const avant = nombre(brut.previousStock) ? brut.previousStock : apres !== null && delta !== null ? arrondi(apres - delta) : null;
    // Écart : ce mouvement dit « après = X » mais le voisin plus récent partait de Y.
    const ecart = nombre(brut.newStock) && apresVoisin !== null && Math.abs(brut.newStock - apresVoisin) > 1e-9 ? arrondi(apresVoisin - brut.newStock) : null;
    sortie.push({ brut, genre, ref, delta, avant, apres, ecart });
    apresVoisin = avant;
  }
  return sortie;
}

export interface MouvementsDeFamille {
  /** Du plus récent au plus ancien. */
  liste: MouvementArticle[];
  /** Le stock de la famille avant le plus ancien mouvement connu (null = inconnu). */
  avantLePlusAncien: number | null;
  /** Le stock actuel de la famille s'écarte du dernier « après » connu (fiche enregistrée à la main après) : la différence, sinon null. */
  ecartFinal: number | null;
}

export interface ArticleDeFamille { ref: string; currentStock: number; supplier?: string }

/**
 * Les mouvements de la famille (l'article et ses lots « bis »), avec le stock total avant et après chacun.
 * `batches` donne le nom des brassins ; `fournisseurParRef` le titre d'un achat.
 */
export function mouvementsDeFamille(famille: ArticleDeFamille[], bruts: MouvementBrut[], batches: Pick<Batch, 'id' | 'name'>[] = []): MouvementsDeFamille {
  const chaines = famille.map(a => chaineDeArticle(a.ref, bruts, Number.isFinite(a.currentStock) ? a.currentStock : null));
  const tous = chaines.flat().sort((a, b) => cleTemps(a.brut).localeCompare(cleTemps(b.brut)) || String(a.brut.id ?? '').localeCompare(String(b.brut.id ?? '')));
  // Le total courant de chaque article au fil du temps : avant son premier mouvement, son « avant » ; ensuite son « après ».
  const courant = new Map<string, number | null>();
  for (const a of famille) {
    const plusAncien = chaines[famille.indexOf(a)].at(-1);
    courant.set(a.ref, plusAncien ? plusAncien.avant : Number.isFinite(a.currentStock) ? a.currentStock : null);
  }
  const somme = (): number | null => { let s = 0; for (const v of courant.values()) { if (v === null) return null; s += v; } return arrondi(s); };
  const avantLePlusAncien = somme();
  const chrono: MouvementArticle[] = [];
  for (const c of tous) {
    const avant = somme();
    courant.set(c.ref, c.apres);
    const apres = somme();
    const art = famille.find(a => a.ref === c.ref);
    const lot = c.brut.batchId ? batches.find(b => b.id === c.brut.batchId) : undefined;
    const raison = (c.brut.reason ?? '').trim();
    let titre: string; let detail: string | null = null; let lien: MouvementArticle['lien'] = null;
    if (c.genre === 'achat') { titre = art?.supplier ? `Achat · ${art.supplier}` : 'Achat'; lien = c.brut.transactionId ? { genre: 'facture', id: c.brut.transactionId } : null; }
    else if (c.genre === 'annulation') { titre = 'Achat annulé'; lien = c.brut.transactionId ? { genre: 'facture', id: c.brut.transactionId } : null; }
    else if (c.genre === 'brassage') { titre = lot ? `${lot.id} · ${lot.name}` : String(c.brut.batchId); lien = { genre: 'brassin', id: String(c.brut.batchId) }; detail = raison || null; }
    else if (c.genre === 'inventaire') { titre = 'Inventaire'; detail = c.brut.note?.trim() || 'compté'; }
    else { titre = `Correction · ${raison ? raison.charAt(0).toLowerCase() + raison.slice(1) : 'sans motif'}`; detail = c.brut.note?.trim() || null; }
    chrono.push({
      id: String(c.brut.id ?? `${c.ref}-${cleTemps(c.brut)}`), ref: c.ref, genre: c.genre, titre, date: jourDe(c.brut),
      avant, apres, delta: avant !== null && apres !== null ? arrondi(apres - avant) : c.delta, detail, lien, ecart: c.ecart
    });
  }
  const actuel = famille.every(a => Number.isFinite(a.currentStock)) ? arrondi(famille.reduce((s, a) => s + a.currentStock, 0)) : null;
  const dernier = chrono.at(-1)?.apres ?? null;
  const ecartFinal = actuel !== null && dernier !== null && Math.abs(actuel - dernier) > 1e-9 ? arrondi(actuel - dernier) : null;
  return { liste: chrono.reverse(), avantLePlusAncien, ecartFinal };
}

/* ---------- l'escalier du solde (B4 : escalier()) ---------- */

export interface Escalier {
  /** Le stock avant la première marche, puis le stock après chaque mouvement, du plus ancien au plus récent. */
  pts: number[];
  /** Les dates (AAAA-MM-JJ ou null) des marches, mêmes indices que `pts` moins un. */
  dates: (string | null)[];
  besoin: number | null;
  seuil: number | null;
  /** Le besoin dépasse le stock final : le manque se hachure entre les deux. */
  manque: boolean;
  /** Seuil et besoin écrits quand ils manquent (« seuil à fixer », « aucun besoin »). */
  seuilEtat: 'fixe' | 'a-fixer';
  besoinEtat: 'connu' | 'aucun' | 'inconnu';
}

/** Le tracé de B4 : une marche par mouvement (ordinal, pas une échelle de temps). `null` si un seul stock est inconnu : on ne trace pas un 0. */
export function escalierDe(chronoAsc: Pick<MouvementArticle, 'avant' | 'apres' | 'date'>[], opts: { besoin: number | null | 'inconnu'; seuil: number | null | undefined }): Escalier | null {
  if (chronoAsc.length === 0) return null;
  const pts: number[] = [];
  const premier = chronoAsc[0].avant;
  if (premier === null) return null;
  pts.push(premier);
  for (const m of chronoAsc) { if (m.apres === null) return null; pts.push(m.apres); }
  const besoinConnu = typeof opts.besoin === 'number' ? opts.besoin : null;
  const seuil = typeof opts.seuil === 'number' && Number.isFinite(opts.seuil) && opts.seuil > 0 ? opts.seuil : null;
  const fin = pts[pts.length - 1];
  return {
    pts, dates: chronoAsc.map(m => m.date), besoin: besoinConnu, seuil,
    manque: besoinConnu !== null && besoinConnu > 0 && fin < besoinConnu,
    seuilEtat: seuil !== null ? 'fixe' : 'a-fixer',
    besoinEtat: opts.besoin === 'inconnu' ? 'inconnu' : besoinConnu !== null && besoinConnu > 0 ? 'connu' : 'aucun'
  };
}

export const ESC = { W: 340, H: 92, x0: 6, x1: 252, yb: 74 } as const;

/** La géométrie de B4 : hauteur = max des points, du besoin et du seuil, plus 12 % ; abscisses réparties sur une marche par mouvement. */
export function geometrieEscalier(e: Escalier) {
  const { x0, x1, yb } = ESC;
  const top = Math.max(...e.pts, e.besoin ?? 0, e.seuil ?? 0) * 1.12 || 1;
  const y = (v: number) => yb - (v / top) * (yb - 8);
  const xs = e.pts.map((_, i) => x0 + (i / e.pts.length) * (x1 - x0));
  xs.push(x1);
  let d = `M${x0} ${y(e.pts[0])}`;
  e.pts.forEach((v, i) => { d += ` H${xs[i + 1]}`; if (i + 1 < e.pts.length) d += ` V${y(e.pts[i + 1])}`; });
  return { top, y, xs, d, aire: `${d} V${yb} H${x0} Z` };
}
