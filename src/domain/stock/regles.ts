import type { Batch, Recipe, StockItem } from '../../types';
import { Units } from '../../services/units';
import { allocatedBatches } from '../stockLevel';
import { normalizeRecipe } from '../recipeSnapshot';

/**
 * Les règles des Stocks qui ne dépendent d'aucun écran : une seule maison pour chaque (voie d-stocks, 08.11).
 * L'écran et le service d'écriture appellent les mêmes fonctions, donc l'un ne peut pas laisser passer ce que l'autre refuse.
 */

/* ───────────── Correction d'inventaire (AM-54) ───────────── */

export type MotifInventaire = 'comptage' | 'casse' | 'perte' | 'saisie' | 'don';

/** Un motif de PERTE dit que la quantité a diminué : il n'a pas de sens quand le compté dépasse le théorique. */
const MOTIFS_DE_PERTE: readonly MotifInventaire[] = ['casse', 'perte', 'don'];

/** Les motifs permis pour un écart : un gain se déclare par un comptage ou une erreur de saisie, jamais par une casse. */
export function motifsAdmis(ecart: number): MotifInventaire[] {
  const tous: MotifInventaire[] = ['comptage', 'casse', 'perte', 'saisie', 'don'];
  return ecart > 0 ? tous.filter(m => !MOTIFS_DE_PERTE.includes(m)) : tous;
}

export type VerdictCorrection = { ok: true; ecart: number } | { ok: false; refus: string };

/** Le stock compté est un nombre fini, jamais négatif, et son motif est compatible avec le signe de l'écart. */
export function verifierCorrection(item: Pick<StockItem, 'currentStock' | 'unit'>, compte: number, motif: MotifInventaire): VerdictCorrection {
  if (typeof compte !== 'number' || !Number.isFinite(compte)) return { ok: false, refus: 'Le stock compté doit être un nombre.' };
  if (compte < 0) return { ok: false, refus: 'Le stock compté ne peut pas être négatif.' };
  const ecart = Units.round(compte - item.currentStock, item.unit);
  if (!motifsAdmis(ecart).includes(motif)) {
    return { ok: false, refus: 'Un stock compté supérieur au théorique ne peut pas être une casse, une perte ou un don : choisis « Inventaire physique » ou « Erreur de saisie ».' };
  }
  return { ok: true, ecart };
}

/* ───────────── Suppression d'un article (AM-55) ───────────── */

export interface LiensArticle { brassins: string[]; recettes: string[] }

const nom = (s: string | undefined) => (s ?? '').trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ');

/**
 * Ce qui tient encore à l'article : les brassins qui le réservent (planifié non déstocké, ou ajouts restants) et les recettes qui le citent
 * (par référence, ou par nom quand le nom est celui d'un seul article). Supprimer un article lié orphelinerait ces lignes en silence.
 */
export function liensArticle(item: StockItem, batches: Batch[], recipes: Recipe[], stockItems: StockItem[] = [item]): LiensArticle {
  const brassins = allocatedBatches(item, batches, stockItems).map(b => b.name || b.id);
  const unique = stockItems.filter(s => nom(s.name) === nom(item.name)).length <= 1;
  const cite = (ligne: { name?: string; stockItemRef?: string } | undefined | null) =>
    !!ligne && (ligne.stockItemRef ? ligne.stockItemRef === item.ref : unique && !!nom(ligne.name) && nom(ligne.name) === nom(item.name));
  const recettes = recipes.filter(r => {
    const n = normalizeRecipe(r);
    return [...(n.fermentables ?? []), ...(n.hops ?? []), ...(n.adjuncts ?? []), ...(n.yeast ? [n.yeast] : [])].some(cite);
  }).map(r => r.name || r.id);
  return { brassins, recettes };
}

/** La phrase qui explique pourquoi l'article ne se supprime pas ; chaîne vide quand rien ne le retient. */
export function motifNonSuppression(liens: LiensArticle): string {
  const morceaux: string[] = [];
  if (liens.brassins.length) morceaux.push(`${liens.brassins.length === 1 ? 'le brassin' : 'les brassins'} ${liens.brassins.slice(0, 3).join(', ')}${liens.brassins.length > 3 ? '…' : ''} le réserve${liens.brassins.length === 1 ? '' : 'nt'}`);
  if (liens.recettes.length) morceaux.push(`${liens.recettes.length === 1 ? 'la recette' : 'les recettes'} ${liens.recettes.slice(0, 3).join(', ')}${liens.recettes.length > 3 ? '…' : ''} l’utilise${liens.recettes.length === 1 ? '' : 'nt'}`);
  return morceaux.length ? `Cet article ne peut pas être supprimé : ${morceaux.join(' ; ')}. Retire-le d’abord de ${liens.recettes.length ? 'la recette' : 'ce brassin'}.` : '';
}

/* ───────────── Fiche enregistrée sans écraser la quantité (AM-53) ───────────── */

/**
 * Ce que « Enregistrer » écrit. La fiche ouverte est une copie ancienne de l'article : un achat reçu pendant qu'elle était ouverte a déjà changé `currentStock`.
 * Le stock vivant est donc gardé tel quel ; il ne change que si l'unité a changé dans la fiche (kg → g), et alors par la même conversion appliquée au stock VIVANT
 * (jamais la valeur périmée de la fiche). Le seuil et le maximum, eux, viennent de la fiche : c'est le brasseur qui vient de les saisir.
 */
export function ficheAEnregistrer(vivant: StockItem, ouverte: StockItem, saisie: StockItem): StockItem {
  // Fusion à trois : seuls les champs que le brasseur a changés dans la fiche s'appliquent au document vivant ; le reste (noms de facture appris, stock reçu) reste tel quel.
  const resultat: Record<string, unknown> = { ...vivant };
  const cles = new Set([...Object.keys(ouverte), ...Object.keys(saisie)]);
  for (const cle of cles) {
    if (cle === 'currentStock') continue;
    const avant = (ouverte as unknown as Record<string, unknown>)[cle], apres = (saisie as unknown as Record<string, unknown>)[cle];
    if (JSON.stringify(avant) !== JSON.stringify(apres)) resultat[cle] = apres;
  }
  let currentStock = vivant.currentStock;
  if (saisie.unit !== ouverte.unit) {
    const facteur = Units.convert(1, ouverte.unit, saisie.unit);
    // Pas de conversion possible : le changement d'unité a déjà été refusé à l'écran ; par sécurité le stock vivant n'est pas touché.
    if (facteur !== null && vivant.unit === ouverte.unit) currentStock = Math.round(vivant.currentStock * facteur * 1e6) / 1e6;
  }
  return { ...(resultat as unknown as StockItem), currentStock, reorder: currentStock <= (resultat.minStock as number) };
}

/* ───────────── Seuil minimum plausible (MV-43, BR-76) ───────────── */

/** Plafond d'un seuil minimum, dans l'unité de l'article : en kg 1 000 kg (une tonne), en g 1 000 000 g, ailleurs 100 000. Au-delà, c'est une faute de frappe. */
export function plafondSeuil(unit: string): number {
  const enKg = Units.convert(1, unit, 'kg');
  return enKg ? Math.round(1000 / enKg) : 100_000;
}

export type VerdictSeuil = { ok: true } | { ok: false; refus: string };
export function verifierSeuil(seuil: unknown, unit: string, stockActuel?: number): VerdictSeuil {
  if (typeof seuil !== 'number' || !Number.isFinite(seuil) || seuil < 0) return { ok: false, refus: 'Le seuil minimum est un nombre positif ou nul.' };
  const plafond = plafondSeuil(unit);
  if (seuil > plafond) return { ok: false, refus: `Seuil trop haut : ${Units.format(seuil, unit)} dépasse ${Units.format(plafond, unit)}. Vérifie l’unité ou la virgule.` };
  void stockActuel;
  return { ok: true };
}

/* ───────────── Durabilité (AM-56) ───────────── */

export type StatutDurabilite = 'perime' | 'bientot' | 'valide' | 'inconnu';

/** Jours d'avance sous lesquels le produit est dit « bientôt périmé ». */
export const JOURS_AVANT_PEREMPTION = 30;

/** `expiresOn` en `AAAA-MM-JJ` ; une date illisible ou absente est « inconnu », jamais « valide ». Un produit est périmé le lendemain de sa date. */
export function statutDurabilite(expiresOn: string | undefined, aujourdhuiIso: string): { statut: StatutDurabilite; jours: number | null } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((expiresOn ?? '').trim());
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(aujourdhuiIso);
  if (!m || !t) return { statut: 'inconnu', jours: null };
  const jour = (r: RegExpExecArray) => Date.UTC(+r[1], +r[2] - 1, +r[3]) / 86_400_000;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return { statut: 'inconnu', jours: null };
  const jours = Math.round(jour(m) - jour(t));
  return { statut: jours < 0 ? 'perime' : jours <= JOURS_AVANT_PEREMPTION ? 'bientot' : 'valide', jours };
}

/** La phrase à montrer pour une date de durabilité ; `null` quand il n'y a rien à dire (valide, ou date inconnue). */
export function libelleDurabilite(expiresOn: string | undefined, aujourdhuiIso: string): { texte: string; perime: boolean } | null {
  const { statut, jours } = statutDurabilite(expiresOn, aujourdhuiIso);
  if (statut === 'perime') return { texte: `Périmé depuis ${-jours!} j`, perime: true };
  if (statut === 'bientot') return { texte: jours === 0 ? 'Périme aujourd’hui' : `Périme dans ${jours} j`, perime: false };
  return null;
}

/* ───────────── Libellé d'une référence (TE-23) ───────────── */

/** Les fiches apprises portent `FICHE-Houblon%3Aariana` : identifiant interne, jamais à montrer. Les vraies références (`MP-001`) se montrent telles quelles. */
export function refAffichable(ref: string | undefined): string {
  if (!ref) return '';
  return /^FICHE-/i.test(ref) || /%[0-9A-F]{2}/i.test(ref) ? '' : ref;
}

/** « 136 références », « aucun lot », « 3 lots dont 1 analysé » : un zéro se dit « aucun », jamais deux « 0 » à la suite (TE-50). */
export function resumeIndexHoublon(references: number, lots: number, analyses: number): string[] {
  const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;
  const parties = [references > 0 ? pluriel(references, 'référence', 'références') : 'aucune référence'];
  if (lots <= 0) parties.push('aucun lot');
  else {
    parties.push(pluriel(lots, 'lot', 'lots'));
    parties.push(analyses > 0 ? pluriel(analyses, 'analysé', 'analysés') : 'aucun analysé');
  }
  return parties;
}

/** Une quantité, un seuil ou une valeur d'EBC avec la virgule suisse (BR-71) : « 3,5 », jamais « 3.5 ». */
export function nombreFr(valeur: number, decimales = 2): string {
  if (!Number.isFinite(valeur)) return '';
  return String(Math.round(valeur * 10 ** decimales) / 10 ** decimales).replace('.', ',');
}
