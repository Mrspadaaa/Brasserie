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
/**
 * L'article ne compte que pour un ingrédient : pour l'emballage, le matériel, le nettoyage, « aucun mouvement » est un choix, pas un doute. Une exception (D334, g7-reste) : « ⇄ Choisir un
 * autre article » touché sans choisir laisse un lien demandé et vide (`existing`, sans `stockRef`), quelle que soit la nature : le champ est à remplir (le plateau le dit déjà en rouge).
 */
export const articleCompte = (line: Pick<PurchaseLineDraft, 'kind' | 'stockAction' | 'stockRef'>): boolean =>
  line.kind === INGREDIENT || (line.stockAction === 'existing' && !line.stockRef);
export function niveauxRangee(line: PurchaseLineDraft, conf: ConfianceLigne): NiveauxRangee {
  const qte = pireNiveau([conf.unite, conf.quantite]);
  const nom = pireNiveau([conf.famille, ...(articleCompte(line) ? [conf.article] : [])]);
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
  return `${virgule(line.quantity)}${u ? ` ${u === 'sachet' && line.quantity > 1 ? 'sachets' : u}` : horsStock ? '' : ' ?'}`;
}

// ——— Voie g2a (D328g, D328h, D334, D329) ———

/** D328g : les mots d'un nom, sans casse, accents, ponctuation ni ordre (« BAC A PEINTURE 32X36 » et « Bac à peinture 32X36 » : mêmes mots). */
const motsDuNom = (s: string): string => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean).sort().join(' ');
export const memesMots = (a: string, b: string): boolean => motsDuNom(a) !== '' && motsDuNom(a) === motsDuNom(b);

/**
 * B1 (remplace D328g) : le français que la 3e lecture rend d'un nom (`nameFr` de la lecture : la description change, le nom IMPRIMÉ non) est une traduction, pas une correction : ni bleue, ni barrée, ni comptée.
 * Les cellules de nom (description, nomLu, imprime) ne restent une correction que si le nom imprimé a été LU autrement (mêmes mots à la casse, aux accents, à la ponctuation et à l'ordre près : pas lu autrement).
 * `base` : les cellules du provisoire ; une cellule absente de la liste est restée celle de la base.
 */
export function sansTraductions<C extends { champ: string; avant: unknown; apres: unknown }>(cs: readonly C[], base: { description?: string; imprime?: { nom: string; variante?: string } } | undefined): C[] {
  const NOM = ['description', 'nomLu', 'imprime'];
  if (!cs.some(c => NOM.includes(c.champ))) return [...cs];
  const imprimeDe = (v: { nom: string; variante?: string } | undefined, description: string | undefined) => (v ? [v.nom, v.variante].filter(Boolean).join(' ') : description ?? '');
  const apresDe = <T,>(champ: string, repli: T): T => { const c = cs.find(x => x.champ === champ); return (c ? c.apres : repli) as T; };
  const avant = imprimeDe(base?.imprime, base?.description);
  const apres = imprimeDe(apresDe('imprime', base?.imprime), apresDe('description', base?.description));
  return memesMots(avant, apres) ? cs.filter(c => !NOM.includes(c.champ)) : [...cs];
}

/** D328h : un prix ou un montant au repos : deux décimales au moins, davantage quand il en porte (« 9,50 », « 0,098 » reste). */
export const decimalesAuRepos = (n: number | undefined): number => {
  if (n === undefined || !Number.isFinite(n)) return 2;
  return Math.max(2, (String(Math.round(n * 1e6) / 1e6).split('.')[1] ?? '').length);
};

/** D335 : le segment « Ingrédient | Service | Matériel » allume toujours l'un de ses trois mots ; une remise n'en montre aucun. */
export type NatureSegment = 'ingredient' | 'service' | 'equipment';
export function natureDuSegment(kind: PurchaseLineDraft['kind']): NatureSegment | undefined {
  if (kind === 'discount') return undefined;
  if (kind === 'ingredient') return 'ingredient';
  if (kind === 'service' || kind === 'shipping') return 'service';
  return 'equipment'; // equipment, packaging, cleaning, maintenance, other
}

/** D334 : un champ qui manque à la rangée, et le mot court qui le nomme au plateau. */
export interface ChampARemplir { champ: 'quantite' | 'unite' | 'prix' | 'montant' | 'article' | 'libelle'; mot: string }
export function champsARemplir(conf: ConfianceLigne, o: { libelleVide: boolean; ingredient: boolean }): ChampARemplir[] {
  return [
    ...(o.libelleVide ? [{ champ: 'libelle' as const, mot: 'libellé à remplir' }] : []),
    ...(conf.quantite.niveau === 'inconnu' ? [{ champ: 'quantite' as const, mot: 'quantité à remplir' }] : []),
    ...(conf.unite.niveau === 'inconnu' ? [{ champ: 'unite' as const, mot: 'unité à remplir' }] : []),
    ...(conf.prix.niveau === 'inconnu' ? [{ champ: 'prix' as const, mot: 'prix à remplir' }] : []),
    ...(conf.montant.niveau === 'inconnu' ? [{ champ: 'montant' as const, mot: 'montant à remplir' }] : []),
    ...(o.ingredient && conf.article.niveau === 'inconnu' ? [{ champ: 'article' as const, mot: 'article à choisir' }] : []),
  ];
}

/**
 * D329 : un changement de la 3e lecture encore à trancher, dans l'ordre du papier : une ligne pas retrouvée, une valeur corrigée, une ligne ajoutée, un désaccord qui pèse.
 * `mot` : ce que dit le bandeau (« pas retrouvée », « nom corrigé », « ajoutée », « désaccord »).
 */
export type Changement =
  | { type: 'perdue'; cle: string; id: string; mot: string }
  | { type: 'corrigee'; cle: string; id: string; mot: string }
  | { type: 'ajoutee'; cle: string; id: string; mot: string }
  | { type: 'desaccord'; cle: string; id: string; mot: string };

/** « nom corrigé », « quantité corrigée », « prix corrigé », « montant corrigé », ou « 2 valeurs corrigées ». */
export function motDeCorrection(champs: { qte: boolean; prix: boolean; montant: boolean; nom: boolean }): string {
  const dits = [champs.nom ? 'nom corrigé' : '', champs.qte ? 'quantité corrigée' : '', champs.prix ? 'prix corrigé' : '', champs.montant ? 'montant corrigé' : ''].filter(Boolean);
  return dits.length === 1 ? dits[0] : `${dits.length} valeurs corrigées`;
}
