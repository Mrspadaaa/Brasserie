// L'état pur de l'écran « Nouvelle dépense » (r2b, le ticket). Aucune écriture, aucun service : des fonctions testées.
// Une seule source par règle : les points viennent de `invoicePoints.ts` (celui du serveur, recalculé au client), jamais refaits ici.
import { PESE_PAR_CODE, SCAN_POINT_CODES, peserPoint, recomputeInvoicePoints, statutDeLecture, type InvoicePoint, type ResultatRecalcul, type StatutLecture } from '../../domain/finance/invoicePoints';
import { toCents } from '../../../functions/src/invoiceControls';
import { hasHopWord, hasYeastWord, readProductLabel } from '../../services/ingredientIdentity';
import { isMillingSurcharge } from '../../services/purchasePrefill';
import { millingParentIndex, stockQuantityFor, type PurchaseLineDraft } from '../../services/purchaseEntry';
import { contexteDeArticle, donneesDArticle, donneesDeLigne, formatUnitLink, isReadableUnit, regleProduit, type RegleProduit } from '../../services/stockLineMatching';
import { nomPropre } from '../../domain/stock/donnees';
import { ligneDeBrouillon } from '../../domain/stock/articleNeuf';
import type { ScannedInvoiceResult } from '../../services/geminiScanner';
import type { StockItem } from '../../types';

type Code = InvoicePoint['code'];
export type Enjeu = 'argent' | 'stock' | 'info';
export interface ChipDef { nom: string; enjeu: Enjeu }
export interface Chip { id: string; nom: string; enjeu: Enjeu; ligne: number | null; codes: string[]; source: 'point' | 'paiement' | 'mouture' | 'voisin' | 'unite'; cible?: string }

/** Le nom court de chaque code qui pèse (T3). Un code qui ne pèse pas (`type-deduit`) n'a pas de chip. */
const NOMS: Partial<Record<Code, ChipDef>> = {
  'ligne-montant': { nom: 'Ligne', enjeu: 'argent' }, 'ligne-prix-par-lot': { nom: 'Prix par lot', enjeu: 'argent' },
  'somme-ecart': { nom: 'Total', enjeu: 'argent' }, 'somme-incomplete': { nom: 'Total', enjeu: 'argent' }, 'total-absent': { nom: 'Total', enjeu: 'argent' },
  'tva-incoherente': { nom: 'TVA', enjeu: 'argent' }, 'ht-tva-ttc': { nom: 'TVA', enjeu: 'argent' }, 'taux-tva-hors-plage': { nom: 'TVA', enjeu: 'argent' },
  'lignes-perdues': { nom: 'Lignes', enjeu: 'argent' }, 'lignes-annoncees': { nom: 'Lignes', enjeu: 'argent' }, 'lignes-non-rapprochees': { nom: 'Lignes', enjeu: 'argent' },
  'pro-forma-non-payee': { nom: 'Pro-forma', enjeu: 'argent' }, devis: { nom: 'Devis', enjeu: 'argent' }, 'document-livraison': { nom: 'Document', enjeu: 'argent' },
  avoir: { nom: 'Avoir', enjeu: 'argent' }, 'devise-non-chf': { nom: 'Devise', enjeu: 'argent' }, 'date-absente': { nom: 'Date', enjeu: 'argent' },
  'alpha-libelle': { nom: 'α', enjeu: 'stock' }, 'unite-absente': { nom: 'Unité', enjeu: 'stock' }, 'nature-a-preciser': { nom: 'Nature', enjeu: 'stock' }, 'ambiguite-ligne': { nom: 'Ligne ?', enjeu: 'stock' },
  'forme-rejetee': { nom: 'Valeur', enjeu: 'info' }, 'lectures-divergentes': { nom: 'Désaccord', enjeu: 'info' }, 'lecture-coupee': { nom: 'Lecture coupée', enjeu: 'info' },
};
const GENERIQUE: ChipDef = { nom: 'À revoir', enjeu: 'info' };
export const CHIP_PAR_CODE: Partial<Record<Code, ChipDef>> = Object.fromEntries(SCAN_POINT_CODES.filter(code => PESE_PAR_CODE[code]).map(code => [code, NOMS[code] ?? GENERIQUE])) as Partial<Record<Code, ChipDef>>;

const RANG: Record<Enjeu, number> = { argent: 0, stock: 1, info: 2 };
const nomDuPoint = (p: InvoicePoint, def: ChipDef): string =>
  p.code === 'ligne-montant' && p.ligne ? `Ligne ${p.ligne}` : p.code === 'lectures-divergentes' && /tva/i.test(p.champ) ? 'TVA' : def.nom;

/** Les chips des points typés qui pèsent, plus celles que l'écran tire d'ailleurs (`extras`), l'argent d'abord (T3). */
export function chipsDeLecture(points: readonly InvoicePoint[] | undefined, extras: readonly Chip[]): Chip[] {
  const groupes = new Map<string, Chip>();
  for (const p of points ?? []) {
    if (!peserPoint(p)) continue;
    const def = CHIP_PAR_CODE[p.code] ?? GENERIQUE;
    const nom = nomDuPoint(p, def), cle = `${nom}|${p.code === 'ligne-montant' ? p.ligne : ''}`;
    const dejà = groupes.get(cle);
    if (dejà) dejà.codes.push(p.code);
    else groupes.set(cle, { id: cle, nom, enjeu: def.enjeu, ligne: p.ligne ?? null, codes: [p.code], source: 'point' });
  }
  return [...groupes.values(), ...extras].map((chip, ordre) => ({ chip, ordre })).sort((a, b) => RANG[a.chip.enjeu] - RANG[b.chip.enjeu] || a.ordre - b.ordre).map(x => x.chip);
}

export interface BrouillonLecture { lines: readonly PurchaseLineDraft[]; amount?: number; sourceVatAmount?: number; sourceNetAmount?: number }
/** Le recalcul des points sur le brouillon COURANT (T1) : seulement si la lecture porte des `points` (format l1) ; sinon rien. */
export function recalculerLecture(result: ScannedInvoiceResult, draft: BrouillonLecture): ResultatRecalcul | undefined {
  if (!result.points) return undefined;
  return recomputeInvoicePoints({
    items: draft.lines.map(line => ({ id: line.id, name: line.description, kind: line.kind, quantity: line.quantity ?? null, unit: line.unit, price: line.unitPrice ?? null, amountTTC: line.amount ?? null })),
    amountTTC: draft.amount ?? null, amountHT: draft.sourceNetAmount ?? null, tvaAmount: draft.sourceVatAmount ?? null,
    linesLost: result.linesLost, points: result.points, controls: result.controls, review: result.review,
  });
}
/** Le statut affiché (T1) : sans `points`, le plancher de l2 (« à confirmer »), jamais « vérifié ». Un geste du brasseur ne le change pas. */
const RANG_STATUT: Record<StatutLecture, number> = { checked: 0, corrected: 1, disputed: 2, unavailable: 3 };
/** R10 (D229) : le titre est le PIRE du statut de départ (la lecture telle que reçue) et du recalcul : un geste ne le fait jamais monter
 *  (vider la TVA ne « vérifie » pas la lecture) ; une valeur tapée qui crée un point le fait descendre. « Points revus » est dit par la chip. */
export function statutAffiche(result: ScannedInvoiceResult, recalcul: ResultatRecalcul | undefined): StatutLecture {
  const depart = statutDeLecture(result, undefined);
  const courant = result.points && recalcul ? statutDeLecture(result, recalcul) : depart;
  return RANG_STATUT[courant] > RANG_STATUT[depart] ? courant : depart;
}

const cts = (c: number | null | undefined) => (c === null || c === undefined ? '—' : (Math.abs(c) / 100).toFixed(2).replace('.', ','));
/** C2, R4 : la relation d'un contrôle de TVA en phrase ; une clé inconnue reçoit un libellé neutre, jamais la clé. */
export function phraseRelation(d: { relation: string; lu: number | null; calcule: number | null; ecart: number | null }): string {
  const ecart = d.ecart ? ` (${d.ecart > 0 ? '+' : '−'}${cts(d.ecart)})` : '';
  if (d.relation === 'somme-bases') return `Bases N + R : imprimé ${cts(d.lu)} · lignes ${cts(d.calcule)}${ecart}`;
  const base = /^base-par-code:(.+)$/.exec(d.relation);
  if (base) return `Base ${base[1]} : imprimée ${cts(d.lu)} · lignes ${cts(d.calcule)}${ecart}`;
  if (d.relation === 'somme-tva') return `TVA : colonne ${cts(d.lu)} · N + R ${cts(d.calcule)}`;
  const taux = /^tva-du-taux:(.+)$/.exec(d.relation);
  if (taux) return `TVA du taux ${taux[1]} : imprimée ${cts(d.lu)} · calculée ${cts(d.calcule)}${ecart}`;
  return `Autre contrôle de la TVA : lu ${cts(d.lu)} · calculé ${cts(d.calcule)}`;
}

/**
 * R6 : un article du stock est-il CE produit ? La règle unique de `stockLineMatching.ts` (S6, R9) : « même article » seulement si l'appariement de s1 relie cet
 * article ; une autre α, une autre origine ou un autre EBC n'est jamais fusionné (D215), une donnée connue d'un seul côté non plus (cas « incertain »).
 */
export function memeProduit(description: string, unit: string, items: readonly StockItem[], quantity?: number, vendor?: string): StockItem | undefined {
  const regle = regleProduit({ description, unit, quantity: quantity !== undefined && quantity > 0 ? quantity : 1, ...(vendor?.trim() ? { vendor: vendor.trim() } : {}) }, items);
  return regle.cas === 'meme' ? regle.article : undefined;
}
/** C5 : le nom que la ligne montre au repos (affichage seul) : l'article relié, sinon le nom propre lu ; l'imprimé reste dans le plateau. */
export const nomAffiche = (description: string, article?: StockItem): string => article?.name ?? (readProductLabel(description, { hop: hasHopWord(description), yeast: hasYeastWord(description), side: 'line' }).name || description);

export interface CompteLiens { relie: number; neuf: number; precis: number; mouture: number; autre: number }
/** Le compte des liens de la preuve : chaque ligne y est une fois, donc la somme vaut le nombre de lignes. */
export function compteLiens(lines: readonly Pick<PurchaseLineDraft, 'id' | 'stockAction' | 'stockRef' | 'kind' | 'description'>[], precis: ReadonlySet<string>): CompteLiens {
  const c: CompteLiens = { relie: 0, neuf: 0, precis: 0, mouture: 0, autre: 0 };
  for (const line of lines) {
    if (isMillingSurcharge(line as any)) c.mouture++;
    else if (precis.has(line.id)) c.precis++;
    else if (line.stockAction === 'existing' && line.stockRef) c.relie++;
    else if (line.stockAction === 'new') c.neuf++;
    else c.autre++;
  }
  return c;
}

const num = (n: number) => { const r = Math.round(n * 1e6) / 1e6; const [w, d] = String(r).split('.'); return w.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : ''); };
/** La pastille-mot de l'effet au stock (critique n° 1) : ce que l'enregistrement fera, jamais plus. `null` : rien à dire (mouture, service). */
export function effetStock(line: PurchaseLineDraft, article: StockItem | undefined): string | null {
  if (!['ingredient', 'packaging', 'cleaning'].includes(line.kind) || isMillingSurcharge(line)) return null;
  if (line.stockAction === 'none') return null;
  if (line.stockAction === 'new') return isReadableUnit(line.unit) ? 'nouveau' : 'unité à préciser';
  if (!article) return 'article ?';
  if (!isReadableUnit(line.unit) || line.quantity === undefined) return 'unité à préciser';
  const q = stockQuantityFor({ description: line.description, quantity: line.quantity, unit: line.unit }, article);
  return q.ok ? `+${num(q.quantity)} ${article.unit}` : 'unité ?';
}
export const conversionDe = (line: PurchaseLineDraft, article: StockItem | undefined): string | undefined =>
  article && line.quantity !== undefined && isReadableUnit(line.unit) ? formatUnitLink(line.quantity, line.unit, article.unit, article.category) : undefined;

/** Le malt dont `lines[index]` est la mouture, SEULEMENT si le service l'écrira : parent juste au-dessus ET lien confirmé (Conception 7). */
export function parentDeLaMouture(lines: readonly PurchaseLineDraft[], index: number): number {
  const parent = millingParentIndex(lines as PurchaseLineDraft[], index);
  return parent >= 0 && lines[index].surchargeOf === lines[parent].id ? parent : -1;
}
/** Prix par unité du malt « avec mouture », en centimes entiers ; `exact` faux si la division n'est pas ronde. */
export function prixAvecMouture(malt: Pick<PurchaseLineDraft, 'amount' | 'quantity'>, mouture: Pick<PurchaseLineDraft, 'amount'>): { cents: number; exact: boolean } | undefined {
  const a = toCents(malt.amount), b = toCents(mouture.amount);
  if (a === null || b === null || !(malt.quantity! > 0)) return undefined;
  const brut = (a + b) / malt.quantity!;
  return { cents: Math.round(brut), exact: Math.abs(brut - Math.round(brut)) < 1e-9 };
}

/**
 * Un article du stock du même produit que la ligne mais qui n'est pas le même article (autre α, origine, récolte, EBC, poids ; ou donnée connue d'un seul côté) :
 * montré grisé, JAMAIS lié. La règle unique de `stockLineMatching.ts` (S6, R9) : `neuf`, `incertain` ou `ambigu`.
 */
export function voisinDe(line: Pick<PurchaseLineDraft, 'description' | 'unit' | 'quantity'> & Partial<Pick<PurchaseLineDraft, 'kind' | 'stockCategory' | 'sourceReference'>>, items: readonly StockItem[]): StockItem | undefined {
  const regle = regleProduit(ligneProduit(line), items);
  return regle.cas === 'neuf' || regle.cas === 'incertain' ? regle.voisin : regle.cas === 'ambigu' ? regle.candidats[0] : undefined;
}
export const ligneProduit = ligneDeBrouillon;

/** Le mot court de la chip d'un voisin : la donnée qui diffère (« α », le code d'origine, « EBC »…), « ? » quand rien n'est écarté mais que s1 ne relie pas. */
export function marqueDeVoisin(regle: RegleProduit, origine?: string): string {
  if (regle.cas !== 'neuf') return '?';
  const premier = regle.ecarts[0];
  return premier === 'alpha' ? 'α' : premier === 'origine' ? (origine ?? 'origine') : premier === 'ebc' ? 'EBC' : premier === 'recolte' ? 'récolte' : 'poids';
}
const virgule = (n: number) => String(n).replace('.', ',');
/**
 * Ce que l'article grisé dit (r2b : « Target α 11,8 », « Hallertauer Blanc DE ») : son nom propre et la valeur QUI DIFFÈRE, lue dans ses champs ou son nom. Une valeur
 * inconnue ne s'affiche pas ; sans écart connu (incertain, ambigu), le nom de l'article tel quel.
 */
export function etiquetteVoisin(regle: RegleProduit, voisin: StockItem): string {
  if (regle.cas !== 'neuf') return voisin.name;
  const propre = nomPropre(voisin.name, contexteDeArticle(voisin), { unit: voisin.unit, side: 'item' });
  const d = donneesDArticle(voisin).donnees, ecart = regle.ecarts[0];
  if (ecart === 'alpha' && d.alpha !== undefined) return `${propre} α ${virgule(d.alpha)}`;
  if (ecart === 'ebc' && d.ebc !== undefined) return `${propre} ${virgule(d.ebc)} EBC`;
  if (ecart === 'origine' && d.origine) return `${propre} ${d.origine}`;
  return voisin.name;
}
/** Le voisin d'une ligne et le mot de sa chip, d'une seule lecture de la règle. */
export function voisinEtMarque(line: Parameters<typeof voisinDe>[0], items: readonly StockItem[], vendor?: string): { article: StockItem; marque: string } | undefined {
  const ligne = ligneProduit(line, vendor), regle = regleProduit(ligne, items);
  const article = regle.cas === 'neuf' || regle.cas === 'incertain' ? regle.voisin : regle.cas === 'ambigu' ? regle.candidats[0] : undefined;
  return article ? { article, marque: marqueDeVoisin(regle, donneesDeLigne(ligne).donnees.origine) } : undefined;
}
