// Voie f3-rangees (D275, D277) : ce que la rangée de la Dépense montre d'une ligne, en calculs purs. Aucun React, aucun service, aucune écriture.
// Le libellé est la BASE de la désignation (`lireOptions`, voie f1) ; l'imprimé complet reste au brouillon (`imprime`) et au plateau. L'état du malt est
// une pastille, jamais un produit. Chaque valeur porte son niveau (`confiance.ts`, voie f2) : `sur` rien, `repris` jaune, `inconnu` rouge.
import { lireOptions, type OptionsLues } from './optionsDuNom';
import { libelleDeLigne } from './etat';
import { confianceLigne, deduireUnite, pireNiveau, type ConfianceLigne, type ContexteConfiance, type LigneConfiance, type Niveau } from './confiance';
import type { InvoicePoint } from '../../domain/finance/invoicePoints';
import { isReadableUnit, shortUnit } from '../../services/stockLineMatching';
import type { PurchaseDraft, PurchaseLineDraft } from '../../services/purchaseEntry';
import type { StockItem } from '../../types';

/** Le libellé d'une ligne lue : la désignation en français si la lecture la rend (`nameFr`, voie f5), sinon, pour un ingrédient, la base imprimée et ce que lireOptions n'a pas compris
 *  (l'unité du nom, l'état et le supplément vont à la rangée et au plateau) ; hors ingrédient, « nom · variante » (D261a), seul libellé que la ligne enregistrée garde. */
export function libelleLu(item: { name: string; variant?: string; unit: string; nameFr?: string; kind?: string }): { description: string; imprime?: { nom: string; variante?: string } } {
  const nom = (item.name ?? '').trim(), variante = (item.variant ?? '').trim();
  const lu = lireOptions(nom, variante, item.unit ?? ''), base = item.kind === undefined || item.kind === 'stock' ? [lu.base || nom, ...lu.restes].join(' · ') : libelleDeLigne(nom, variante);
  const description = item.nameFr?.trim() || base;
  return description === nom && !variante ? { description } : { description, imprime: { nom, ...(variante ? { variante } : {}) } };
}

/** Les options lues de l'imprimé d'une ligne (rien sans imprimé : une ligne tapée n'a pas d'options). */
export const optionsDe = (line: Pick<PurchaseLineDraft, 'imprime' | 'unit'>): OptionsLues | undefined =>
  line.imprime ? lireOptions(line.imprime.nom, line.imprime.variante, line.unit) : undefined;

/** La ligne telle que la confiance la lit : l'imprimé d'abord (« …, Kg » dans le nom est un indice d'unité), l'unité imprimée ou tapée. */
export const ligneConfianceDe = (line: PurchaseLineDraft): LigneConfiance => ({
  id: line.id, description: line.imprime ? [line.imprime.nom, line.imprime.variante].filter(Boolean).join(' · ') : line.description, kind: line.kind,
  quantity: line.quantity ?? null, unit: line.unit, unitPrice: line.unitPrice ?? null, amount: line.amount ?? null, stockCategory: line.stockCategory,
  sourceReference: line.sourceReference, stockAction: line.stockAction, stockRef: line.stockRef, nameFr: line.nameFr, nomLu: line.nomLu,
});

/** D306 : `category` (« Pour quoi ? ») est lue avec les lignes : l'unité déduite et la bande lisent la même famille. */
export function contexteConfiance(draft: Pick<PurchaseDraft, 'lines' | 'vendor' | 'amount'> & { category?: string }, articles: readonly StockItem[], points?: readonly InvoicePoint[]): ContexteConfiance {
  return { lignes: draft.lines.map(ligneConfianceDe), articles, fournisseur: draft.vendor, total: draft.amount ?? null, ...(draft.category ? { categorie: draft.category } : {}), ...(points ? { points } : {}) };
}

const memeDeduite = (a: PurchaseLineDraft['uniteDeduite'], b: PurchaseLineDraft['uniteDeduite']) =>
  a === b || (!!a && !!b && a.unite === b.unite && a.niveau === b.niveau && a.regle === b.regle && a.raison === b.raison);
/**
 * Le brouillon avec l'unité déduite de chaque ligne à l'unité illisible (D277) : sûre ou reprise seulement ; une unité lisible (imprimée ou tapée) n'en a jamais.
 * Dérivé du brouillon et du stock COURANTS : l'écran et l'enregistrement lisent le même. Rend le même objet si rien ne change.
 */
export function avecUnitesDeduites<D extends Pick<PurchaseDraft, 'lines' | 'vendor' | 'amount'> & { category?: string }>(draft: D, articles: readonly StockItem[]): D {
  const c = contexteConfiance(draft, articles);
  let change = false;
  const lines = draft.lines.map(line => {
    let voulue: PurchaseLineDraft['uniteDeduite'];
    if (!isReadableUnit(line.unit)) {
      const u = deduireUnite(ligneConfianceDe(line), c);
      if (u.niveau !== 'inconnu' && u.valeur && isReadableUnit(u.valeur)) voulue = { unite: u.valeur, niveau: u.niveau, regle: u.regle, raison: u.raison };
    }
    if (memeDeduite(voulue, line.uniteDeduite)) return line;
    change = true;
    const { uniteDeduite: _ancienne, ...reste } = line;
    return voulue ? { ...reste, uniteDeduite: voulue } : reste;
  });
  return change ? { ...draft, lines } : draft;
}

/** Les niveaux que la rangée montre : la quantité (avec son unité), le prix, le montant, et le nom (famille ou article à contrôler). */
export interface NiveauxRangee { qte: Niveau; prix: Niveau; montant: Niveau; nom: Niveau; pire: Niveau; raisons: string[] }
const INGREDIENT = 'ingredient';
export function niveauxRangee(line: PurchaseLineDraft, conf: ConfianceLigne): NiveauxRangee {
  const qte = pireNiveau([conf.unite, conf.quantite]);
  // L'article ne compte que pour un ingrédient : pour l'emballage, le matériel, le nettoyage, « aucun mouvement » est un choix, pas un doute.
  const nom = pireNiveau([conf.famille, ...(line.kind === INGREDIENT ? [conf.article] : [])]);
  const raisons = [
    ...(qte !== 'sur' ? [conf.unite.niveau !== 'sur' ? conf.unite.raison : conf.quantite.raison] : []),
    ...(conf.prix.niveau !== 'sur' ? [conf.prix.raison] : []), ...(conf.montant.niveau !== 'sur' ? [conf.montant.raison] : []),
    ...(nom !== 'sur' ? [conf.famille.niveau !== 'sur' ? conf.famille.raison : conf.article.raison] : []),
  ];
  return { qte, prix: conf.prix.niveau, montant: conf.montant.niveau, nom, pire: pireNiveau([qte, conf.prix, conf.montant, nom]), raisons };
}
export { confianceLigne };

const virgule = (n: number) => String(Math.round(n * 1e6) / 1e6).replace('.', ',');
/** Un supplément tel qu'imprimé, au moins deux décimales (0,10 · 0,0001). */
const prixSup = (n: number) => { const d = (String(n).split('.')[1] ?? '').length; return n.toFixed(Math.max(2, d)).replace('.', ','); };
const fr2 = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

/** La pastille d'état du malt (D275a) : « ↳ 0,20 » pour concassé (le supplément × la quantité, déjà compris dans le prix), « grain » pour grain entier. */
export interface PastilleEtat { cle: 'concasse' | 'grain'; texte: string; aria: string; centsCompris?: number }
export function pastilleEtat(line: PurchaseLineDraft, unite: string): PastilleEtat | undefined {
  const o = optionsDe(line);
  if (!o?.etat) return undefined;
  const u = shortUnit(unite) || 'unité';
  const sup = o.supplement && (!o.supplementPour || o.supplementPour === o.etat.cle) ? o.supplement : undefined;
  const q = line.quantity;
  const cents = sup && q !== undefined && Number.isFinite(q) ? Math.round(sup.montant * q * 100) : undefined;
  if (o.etat.cle === 'grain') return { cle: 'grain', texte: 'grain', aria: 'grain entier' };
  return {
    cle: 'concasse', texte: cents !== undefined ? `↳ ${fr2(cents)}` : '↳',
    aria: `concassé${sup ? `, supplément ${prixSup(sup.montant)} par ${u} compris` : ''}`, ...(cents !== undefined ? { centsCompris: cents } : {}),
  };
}

/** Les options en français pour le plateau : « concassé, +0,10 par Kg, compris », puis les autres ; ce qui n'est pas compris reste tel qu'imprimé. */
export function optionsEnFrancais(line: PurchaseLineDraft, unite: string): { comprises: string[]; restes: string[] } {
  const o = optionsDe(line);
  if (!o) return { comprises: [], restes: [] };
  const u = shortUnit(unite) || 'unité';
  const etat = o.etat ? [`${o.etat.texte}${o.supplement && (!o.supplementPour || o.supplementPour === o.etat.cle) ? `, +${prixSup(o.supplement.montant)} par ${u}, compris` : ''}`] : [];
  const sup = o.supplement && o.supplementPour && o.supplementPour !== o.etat?.cle ? [`supplément +${prixSup(o.supplement.montant)} par ${u}, compris`] : [];
  return { comprises: [...etat, ...o.options.map(x => x.texte), ...sup], restes: o.restes };
}

/** Le texte de la quantité d'une rangée : « 85 g » (unité effective), « 2 » sans unité connue, vide pour une ligne hors stock sans quantité (le port). */
export function texteQuantite(line: PurchaseLineDraft, unite: string, horsStock: boolean): string {
  if (line.quantity === undefined) return horsStock ? '' : '?';
  const u = shortUnit(unite);
  return `${virgule(line.quantity)}${u ? ` ${u === 'sachet' && line.quantity > 1 ? 'sachets' : u}` : ' ?'}`;
}
