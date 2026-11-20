import type { StockItem } from '../../types';
import { Units } from '../../services/units';

/**
 * Règle de l'app « chaque geste décompte ce qu'il use » (L9, choix pe1 · pe3 · pe4 du 16.11).
 * État de l'art : consommation automatique de la nomenclature d'une opération (backflushing des ERP),
 * annulation par écriture compensatoire, rejeu réglé par une clé d'idempotence par geste et par article.
 * Spécification : work/missions/2026-11-15-simplicite/REGLE-CONSOMMATION.md.
 *
 * Tout est pur ici : le stockage écrit les mouvements rendus, dans le même lot que le geste.
 */

export type ParBase = 'geste' | 'litre' | 'unite';

/** Un geste réel. Le type est une chaîne libre (aucune liste fermée) ; objet + cycle en font la clé. */
export interface Geste {
  type: string;
  objet: string;
  cycle: string | number;
  /** Ce que le bandeau dit : « Fût F7 lavé ». */
  libelle: string;
  quantites?: { litres?: number; unites?: number };
}

/** Une ligne de la table réglée une fois par geste. Une dose absente se demande ; elle n'est jamais inventée. */
export interface RegleConsommation {
  id: string;
  geste: string;
  stockItemRef: string;
  quantite?: number;
  unite: string;
  par: ParBase;
  active: boolean;
}

export interface MouvementConsommation {
  id: string;
  type: 'consommation' | 'consommation-annulee';
  gesteId: string;
  regleId: string;
  geste: string;
  objet: string;
  libelle: string;
  stockItemRef: string;
  itemRef: string;
  unit: string;
  delta: number;
  previousStock: number;
  newStock: number;
  /** Mouvement annulé (pour une écriture compensatoire). */
  annuleId?: string;
  createdAt: string;
  timestamp: string;
}

export interface EffetLigne { regleId: string; stockItemRef: string; nom: string; unite: string; avant: number; apres: number; repere: number }

export interface PlanConsommation {
  gesteId: string;
  mouvements: MouvementConsommation[];
  effets: EffetLigne[];
  manquantes: RegleConsommation[];
  alertes: string[];
}

/** Ce que chaque genre de geste propose, faute de table : des articles seulement, jamais une dose (pe4). Données, pas de cas codé. */
export const GESTES_CONNUS: Record<string, { categories: string[]; par: ParBase; question: string }> = {
  'lavage-fut': { categories: ['CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent'], par: 'unite', question: 'par fût lavé' },
  brassage: { categories: ['CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent'], par: 'geste', question: 'par brassin' },
  conditionnement: { categories: ['Emballage'], par: 'litre', question: 'par litre conditionné' }
};

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
export const gesteIdDe = (g: Pick<Geste, 'type' | 'objet' | 'cycle'>) => `GESTE-${slug(g.type)}-${slug(g.objet)}-${slug(String(g.cycle))}`;
export const regleIdDe = (geste: string, stockItemRef: string) => `${slug(geste)}-${slug(stockItemRef)}`;

/** Une dose se demande dans l'unité qu'on manie : g pour un article en kg, ml pour un article en L. */
export const uniteDeDose = (unit: string) => ({ kg: 'g', l: 'ml', L: 'ml' } as Record<string, string>)[unit] ?? unit;

/** La table d'un geste : les lignes réglées, puis chaque article des catégories proposées qui n'y est pas encore (sans dose). */
export function tableDuGeste(type: string, regles: RegleConsommation[], stocks: StockItem[]): RegleConsommation[] {
  const reglees = regles.filter(r => r.geste === type);
  const connu = GESTES_CONNUS[type];
  if (!connu) return reglees;
  const deja = new Set(reglees.map(r => r.stockItemRef));
  const proposees = stocks
    .filter(s => connu.categories.includes(s.category) && !deja.has(s.ref))
    .map<RegleConsommation>(s => ({ id: regleIdDe(type, s.ref), geste: type, stockItemRef: s.ref, unite: uniteDeDose(s.unit), par: connu.par, active: true }));
  return [...reglees, ...proposees];
}

/** Plan pur d'un geste. Rejouer le même geste ne décompte rien de plus ; un stock court ne bloque jamais, il alerte. */
export function planifierConsommation(geste: Geste, table: RegleConsommation[], stocks: StockItem[], existants: Array<{ id: string }>, now = new Date().toISOString()): PlanConsommation {
  const gesteId = gesteIdDe(geste);
  const faits = new Set(existants.map(m => m.id));
  const courant = new Map<string, number>();
  const plan: PlanConsommation = { gesteId, mouvements: [], effets: [], manquantes: [], alertes: [] };
  for (const regle of table) {
    if (!regle.active || regle.geste !== geste.type) continue;
    const id = `${gesteId}-${regle.id}`;
    if (faits.has(id)) continue;
    if (regle.quantite == null || !Number.isFinite(regle.quantite) || regle.quantite < 0) { plan.manquantes.push(regle); continue; }
    if (regle.quantite === 0) continue;
    const item = stocks.find(s => s.ref === regle.stockItemRef);
    if (!item) { plan.alertes.push(`${regle.stockItemRef} : article introuvable dans le stock.`); continue; }
    const base = regle.par === 'geste' ? 1 : regle.par === 'litre' ? geste.quantites?.litres : geste.quantites?.unites;
    if (base == null || !Number.isFinite(base) || base < 0) { plan.alertes.push(`${item.name} : ${regle.par === 'litre' ? 'volume' : 'nombre'} du geste inconnu, rien décompté.`); continue; }
    const voulu = Units.convert(regle.quantite * base, regle.unite, item.unit);
    if (voulu === null) { plan.alertes.push(`${item.name} : ${regle.unite} incompatible avec ${item.unit}.`); continue; }
    if (!(voulu > 0)) continue;
    const avant = courant.get(item.ref) ?? (Number.isFinite(item.currentStock) ? item.currentStock : 0);
    const dispo = Math.max(0, avant);
    const pris = Math.min(voulu, dispo);
    if (pris + 1e-9 < voulu) plan.alertes.push(`${item.name} : ${Units.format(voulu, item.unit)} à décompter, ${Units.format(dispo, item.unit)} en stock. Corriger l'inventaire.`);
    if (!(pris > 0)) continue;
    const apres = Units.round(Math.max(0, avant - pris), item.unit);
    courant.set(item.ref, apres);
    plan.mouvements.push({ id, type: 'consommation', gesteId, regleId: regle.id, geste: geste.type, objet: geste.objet, libelle: geste.libelle,
      stockItemRef: item.ref, itemRef: item.ref, unit: item.unit, delta: Units.round(apres - avant, item.unit), previousStock: avant, newStock: apres, createdAt: now, timestamp: now });
    plan.effets.push({ regleId: regle.id, stockItemRef: item.ref, nom: item.name, unite: item.unit, avant, apres, repere: Math.max(item.maxStock ?? 0, avant, item.minStock * 3, 1e-9) });
  }
  return plan;
}

/**
 * Annulation : les mouvements inverses de tout le geste, jamais un effacement. Refusée avec son motif si l'article
 * a été compté (inventaire) depuis : le compte dit déjà la vérité, rendre la quantité la doublerait.
 */
export function planifierAnnulation(gesteId: string, existants: MouvementConsommation[], stocks: StockItem[], corrections: Array<{ stockItemRef: string; at: number }> = [], now = new Date().toISOString()):
  { mouvements: MouvementConsommation[]; refus?: string } {
  const annules = new Set(existants.filter(m => m.type === 'consommation-annulee').map(m => m.annuleId));
  const aRendre = existants.filter(m => m.type === 'consommation' && m.gesteId === gesteId && !annules.has(m.id));
  if (!aRendre.length) return { mouvements: [] };
  for (const m of aRendre) {
    const item = stocks.find(s => s.ref === m.stockItemRef);
    if (!item) return { mouvements: [], refus: `${m.stockItemRef} : article retiré du stock ; rien n'est rendu.` };
    if (corrections.some(c => c.stockItemRef === m.stockItemRef && c.at > Date.parse(m.createdAt)))
      return { mouvements: [], refus: `${item.name} a été compté depuis : le stock dit déjà la vérité. Rien n'est rendu.` };
  }
  const courant = new Map<string, number>();
  return { mouvements: aRendre.map(m => {
    const item = stocks.find(s => s.ref === m.stockItemRef)!;
    const avant = courant.get(item.ref) ?? item.currentStock;
    const apres = Units.round(avant - m.delta, item.unit);
    courant.set(item.ref, apres);
    return { ...m, id: `ANNUL-${m.id}`, type: 'consommation-annulee' as const, annuleId: m.id, delta: -m.delta, previousStock: avant, newStock: apres, createdAt: now, timestamp: now };
  }) };
}

/** La trace sur place (pe3) : le dernier geste qui a bougé cet article, s'il n'est pas annulé. */
export function traceDeLArticle(ref: string, existants: MouvementConsommation[]): { texte: string; gesteId: string } | null {
  const annules = new Set(existants.filter(m => m.type === 'consommation-annulee').map(m => m.annuleId));
  const dernier = existants
    .filter(m => m.type === 'consommation' && m.stockItemRef === ref && !annules.has(m.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!dernier) return null;
  return { texte: `−${Units.format(-dernier.delta, dernier.unit)} · ${dernier.libelle}`, gesteId: dernier.gesteId };
}

/** Toutes les traces en un passage, pour une liste de stock. */
export function tracesDesArticles(existants: MouvementConsommation[]): Map<string, { texte: string; gesteId: string }> {
  const annules = new Set(existants.filter(m => m.type === 'consommation-annulee').map(m => m.annuleId));
  const derniers = new Map<string, MouvementConsommation>();
  for (const m of existants) {
    if (m.type !== 'consommation' || annules.has(m.id)) continue;
    const vu = derniers.get(m.stockItemRef);
    if (!vu || m.createdAt > vu.createdAt) derniers.set(m.stockItemRef, m);
  }
  return new Map([...derniers].map(([ref, m]) => [ref, { texte: `−${Units.format(-m.delta, m.unit)} · ${m.libelle}`, gesteId: m.gesteId }]));
}
