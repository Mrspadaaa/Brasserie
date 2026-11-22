// Autres stocks, version A (D423, D424 ; liste du port : Brasserie/work/missions/2026-11-21-stock-maquettes/A-PORT-LISTE.md).
// Adaptateur pur « articles d'Autres stocks → trois rangées (Additifs, Emballage, Nettoyage), une colonne par famille, un pot par article ».
// Classement par mots-clés sur la catégorie puis le nom (problème type : classification par règles ; un inconnu va en « Autres », en gris,
// comme la colonne Autres des levures ; jamais deviné). Hauteurs en fraction de la hauteur du mur : le tiret de seuil est à 14/22 (n° 2).
import type { StockItem } from '../../types';
import { familleRecompter } from './liste';
import { FAMILLES_AUTRES, estFamilleAutre, type FamilleAutre } from './murDonnees';

export type FormePot = 'bouteille' | 'canette' | 'flacon' | 'bidon' | null;
interface DefColonne { id: string; mot: string; court?: string; fill: string; forme: FormePot; motif: RegExp | null }

/** Hauteur du tiret de seuil, en fraction de la hauteur du pot plein (14 px sur 22, modèle d2a). */
export const TIRET = 14 / 22;
const GRIS = '#9a958b';
const sa = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// n° 13 et 14 : une gamme par rangée (L 36 à 70), quatre silhouettes seulement.
export const COLONNES_AUTRES: Record<FamilleAutre, DefColonne[]> = {
  Additifs: [
    { id: 'sels', mot: 'Sels', fill: '#46617c', forme: null, motif: /gypse|chlorure|sulfate|\bsels?\b|epsom|bicarbonate|chaux|carbonate|calcium|magnesium/ },
    { id: 'acides', mot: 'Acides', fill: '#567899', forme: 'flacon', motif: /acide|lactique|phosphori|citrique|tartrique|malique/ },
    { id: 'clarif', mot: 'Clarification', court: 'Clarif.', fill: '#6f8fae', forme: null, motif: /mousse irl|irish moss|whirlfloc|protafloc|gelatine|biofine|polyclar|pvpp|kieselsol|silice|isinglass|clarif/ },
    { id: 'enzymes', mot: 'Levure · enzymes', court: 'Enzymes', fill: '#86a1bb', forme: null, motif: /nutriment|nutrient|servomyces|zinc|enzyme|amylase|clarex|pectinase|levure/ },
    { id: 'epices', mot: 'Épices', fill: '#9db3c8', forme: null, motif: /coriandre|orange|citron|vanille|cacao|cannelle|epice|gingembre|poivre|cafe|feve|zeste|reglisse|camomille|lavande/ },
  ],
  Emballage: [
    { id: 'bouteilles', mot: 'Bouteilles', court: 'Bout.', fill: '#855632', forme: 'bouteille', motif: /bouteille|bottle|growler|flacon/ },
    { id: 'canettes', mot: 'Canettes', court: 'Canet.', fill: '#a66c3f', forme: 'canette', motif: /canette|\bcans?\b|couvercle|\blids?\b/ },
    { id: 'capsules', mot: 'Capsules', court: 'Caps.', fill: '#be8355', forme: null, motif: /capsule|bouchon|crown|\bcap\b/ },
    { id: 'etiquettes', mot: 'Étiquettes', court: 'Étiq.', fill: '#ca9872', forme: null, motif: /etiquette|label/ },
    { id: 'cartons', mot: 'Cartons', fill: '#d5ae90', forme: null, motif: /carton|caisse|box|plateau/ },
  ],
  Nettoyage: [
    { id: 'acides', mot: 'Acides', fill: '#407765', forme: 'flacon', motif: /cip acide|acide|peracet|star ?san|detartr|desinfect/ },
    { id: 'alcalins', mot: 'Alcalins', fill: '#59a68c', forme: 'bidon', motif: /alcalin|soude|pbw|chlore|percarbonate|detergent|caustique/ },
    { id: 'conso', mot: 'Consommables', court: 'Conso.', fill: '#88bfac', forme: null, motif: /consommable|epi|sols|gant|eponge|joint|filtre|chiffon|brosse/ },
  ],
};
const AUTRE: DefColonne = { id: 'autres', mot: 'Autres', fill: GRIS, forme: null, motif: null };

/** La colonne d'un article d'Autres stocks : catégorie puis nom ; rien de lu : « autres ». */
export function colonneAutre(i: Pick<StockItem, 'name' | 'category'>, famille: FamilleAutre): string {
  const cat = sa(i.category ?? ''); const nom = sa(i.name ?? '');
  // Le nom d'abord (Chlore actif, rangé en « Désinfectant », est un alcalin), puis la catégorie.
  for (const t of [nom, cat]) for (const c of COLONNES_AUTRES[famille]) if (c.motif && c.motif.test(t)) return c.id;
  return 'autres';
}

// ---------- unités et quantités ----------
type Base = { u: string; f: number };
const PIECES = new Set(['', 'pc', 'pce', 'pcs', 'piece', 'pieces', 'u', 'unite', 'unites']);
function base(unit: string): Base {
  const u = sa(unit.trim());
  if (u === 'kg') return { u: 'g', f: 1000 }; if (u === 'g') return { u: 'g', f: 1 };
  if (u === 'l') return { u: 'ml', f: 1000 }; if (u === 'cl') return { u: 'ml', f: 10 }; if (u === 'ml') return { u: 'ml', f: 1 };
  if (PIECES.has(u)) return { u: 'pc', f: 1 };
  return { u: unit.trim(), f: 1 };
}
const nf = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
const NB = ' ';
/** Quantité en unité de base → texte (« 1,7 kg », « 2,3 L », « 248 », « 0 g »). */
export function texteQuantite(q: number, u: string): string {
  if (u === 'g') return q >= 1000 ? `${nf(q / 1000)}${NB}kg` : `${nf(q)}${NB}g`;
  if (u === 'ml') return q >= 1000 ? `${nf(q / 1000)}${NB}L` : `${nf(q)}${NB}ml`;
  if (u === 'pc') return nf(q);
  return `${nf(q)}${NB}${u}`;
}

// ---------- sorties ----------
export interface PotAutre {
  ref: string; nom: string;
  /** Fraction (0 à 1) de la hauteur du pot plein ; 0 pour un épuisé. */
  hauteur: number;
  /** Fraction où tombe le tiret de seuil (TIRET), null sans seuil. */
  seuil: number | null;
  etat: 'epuise' | 'compter' | 'bas' | null;
  ddmDepassee: boolean;
}
export interface ColonneAutre { id: string; mot: string; court?: string; fill: string; forme: FormePot; total: string; tiret: 'continu' | 'pots' | null; pots: PotAutre[] }
export interface RangeeAutre { id: FamilleAutre; nom: FamilleAutre; k: string; total: number; colonnes: ColonneAutre[]; vides: string[] }

const quantite = (i: StockItem) => (Number.isFinite(i.currentStock) ? i.currentStock : null);

/** Le pot d'un article (n° 2, 4, 16 à 18). `max` : le plus gros article de la colonne, même unité de base (pour les pots sans seuil). */
export function potAutre(i: StockItem, max: number, ddmDepassee = false): PotAutre {
  const b = base(i.unit); const q = quantite(i);
  const s = i.minStock != null && i.minStock > 0 ? i.minStock : null;
  const seuil = s != null ? TIRET : null;
  if (q == null) return { ref: i.ref, nom: i.name, hauteur: 0.5, seuil, etat: 'compter', ddmDepassee };
  if (q <= 0) return { ref: i.ref, nom: i.name, hauteur: 0, seuil, etat: 'epuise', ddmDepassee };
  const hauteur = s != null ? Math.min(1, (TIRET * q) / s) : Math.max(0.12, max > 0 ? (0.9 * q * b.f) / max : 0.12);
  return { ref: i.ref, nom: i.name, hauteur: Math.round(hauteur * 1000) / 1000, seuil, etat: s != null && q < s ? 'bas' : null, ddmDepassee };
}

/** Le pied d'une colonne (n° 10) : somme si une seule unité de base, sinon le nombre d'articles en stock. Jamais un nom. */
export function totalColonne(items: StockItem[]): string {
  const unites = new Set(items.map((i) => base(i.unit).u));
  if (unites.size === 1) {
    const u = [...unites][0];
    return texteQuantite(items.reduce((n, i) => n + Math.max(0, quantite(i) ?? 0) * base(i.unit).f, 0), u);
  }
  return String(items.filter((i) => (quantite(i) ?? 0) > 0).length);
}

/** Les trois rangées d'Autres stocks (bloc 3 et 4). `ddm` : vrai si la DDM de l'article est dépassée. */
export function construireMurAutres(items: StockItem[], ddm: (i: StockItem) => boolean = () => false): RangeeAutre[] {
  const rangees: RangeeAutre[] = [];
  for (const nom of FAMILLES_AUTRES) {
    const li = items.filter((i) => familleRecompter(i) === nom && estFamilleAutre(nom));
    const defs = [...COLONNES_AUTRES[nom], AUTRE];
    const colonnes: ColonneAutre[] = []; const vides: string[] = [];
    for (const d of defs) {
      const ci = li.filter((i) => colonneAutre(i, nom) === d.id).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      if (!ci.length) { if (d.id !== 'autres') vides.push(d.mot); continue; }
      const max = Math.max(...ci.map((i) => Math.max(0, quantite(i) ?? 0) * base(i.unit).f));
      const pots = ci.map((i) => potAutre(i, max, ddm(i)));
      const avec = pots.filter((p) => p.seuil != null).length;
      colonnes.push({ id: d.id, mot: d.mot, court: d.court, fill: d.fill, forme: d.forme, total: totalColonne(ci), tiret: avec === 0 ? null : avec === pots.length ? 'continu' : 'pots', pots });
    }
    rangees.push({ id: nom, nom, k: COLONNES_AUTRES[nom][0].fill, total: li.length, colonnes, vides });
  }
  return rangees;
}

// ---------- ligne de liste (D424) ----------
export interface BesoinBrassin { manque: number; unite: string; brassin: string }
/** La pastille utile (n° 29, D424) : manque pour un brassin prévu, sinon ≈ N brassins, sinon la DDM proche, sinon rien. */
export function pastilleAutre(o: { besoin?: BesoinBrassin | null; brassins?: number | null; ddmProche?: string | null }): string | null {
  if (o.besoin && o.besoin.manque > 0) { const b = base(o.besoin.unite); return `manque ${texteQuantite(o.besoin.manque * b.f, b.u)} pour ${o.besoin.brassin}`; }
  if (o.brassins != null && o.brassins > 0) return `≈${NB}${Math.floor(o.brassins)} brassin${Math.floor(o.brassins) > 1 ? 's' : ''}`;
  if (o.ddmProche) return `DDM ${o.ddmProche}`;
  return null;
}
/** La 2e ligne (n° 6 et 30) : le mot d'état puis le seuil ; « sans seuil » sinon. */
export function etatEtSeuil(i: StockItem): { mot: 'épuisé' | 'bas' | 'assez' | 'à compter' | null; seuil: string } {
  const q = quantite(i); const s = i.minStock != null && i.minStock > 0 ? i.minStock : null; const b = base(i.unit);
  const seuil = s != null ? `seuil ${texteQuantite(s * b.f, b.u)}` : 'sans seuil';
  if (q == null) return { mot: 'à compter', seuil };
  if (q <= 0) return { mot: 'épuisé', seuil };
  if (s == null) return { mot: null, seuil };
  return { mot: q < s ? 'bas' : 'assez', seuil };
}
