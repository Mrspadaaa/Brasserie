import type { ScannedInvoiceResult } from './geminiScanner';
import type { PurchaseDraft } from './purchaseEntry';
import { canonicalStockCategory, STOCK_CATEGORIES } from './stockLineMatching';
import { normalize } from './search';
import { inferNature } from './ingredientIdentity';
import { familleDe } from '../ui/depense/familles';
import { LIGNES_HT_PASSEES_AU_TTC } from './lignesHt';

const MILLING_WORDS = /\b(?:schrot\w*|mouture\w*|moulage|moulu\w*|crush\w*|milling|gemahlen)\b/;
/** Une ligne de mouture : un service dont le libellé ou la référence porte un mot de mouture (liste fermée, sans accent ni casse). */
export function isMillingSurcharge(line: { kind?: string; description?: string; sourceReference?: string }): boolean {
  return line.kind === 'service' && MILLING_WORDS.test(normalize(`${line.description ?? ''} ${line.sourceReference ?? ''}`));
}

const PLURAL_FAMILIES: Record<string, string> = { Malt: 'malts', Houblon: 'houblons', Levure: 'levures', Sucre: 'sucres', Additif: 'additifs', Emballage: 'emballages', Consommable: 'consommables' };
const KIND_FAMILIES: Record<string, string> = { stock: 'ingrédients', packaging: 'emballages', shipping: 'port', equipment: 'matériel', service: 'services' };
const DESCRIPTION_MAX = 60;
const FAMILLES_MATIERES = new Set(['malts', 'houblons', 'levures', 'sucres', 'additifs', 'ingrédients']);
const INGREDIENTS = 'ingrédients';

/**
 * « Pour quoi ? » proposé par le code : `Fournisseur · N° · familles`, 60 caractères au plus, sans la prose du modèle.
 * Les familles viennent de la catégorie de stock lue, sinon de la nature de la ligne, uniques ; une ligne de mouture n'ajoute rien.
 * Elles reflètent la majorité des lignes (lecture en ligne du 08.11, doc8 et doc10 : « matériel, emballages » sur une facture de malts et de houblons) :
 *  - les matières (malts, houblons, levures, sucres, additifs, ingrédients) passent devant, ce pour quoi on achète (LP-4) ;
 *  - dans chaque groupe, la famille qui a le plus de lignes vient d'abord, la première apparition ne départageant que les égalités ;
 *  - des matières de plusieurs familles qui ne tiennent pas en 60 caractères se disent « ingrédients », le mot de l'app pour les lignes de stock.
 * Rien n'est inventé : fournisseur, numéro ou familles absents sont omis.
 */
export function invoicePurchaseDescription(scan: ScannedInvoiceResult): string {
  const nombres = new Map<string, number>();
  for (const item of scan.items) {
    if (isMillingSurcharge({ kind: item.kind, description: item.name, sourceReference: item.reference })) continue;
    // k7 (D271) : une catégorie lue dans une autre langue (« yeast », « Hefe ») est ramenée à son nom français ; une catégorie inconnue n'est jamais recopiée
    // telle quelle dans « Pour quoi ? » : la nature de la ligne la remplace.
    const category = canonicalStockCategory(item.stockCategory);
    const known = STOCK_CATEGORIES.includes(category);
    const deduced = !known && item.kind === 'stock' ? inferNature(item.name).strong : undefined;
    // D306 : une ligne de la famille Rénovation dit « travaux », un nettoyant sans catégorie lue « nettoyage », jamais « ingrédients » (lus `stock`).
    const famille = familleDe({ nom: item.name, kind: item.kind, stockCategory: item.stockCategory, categorie: scan.category });
    const family = famille === 'renovation' ? 'travaux' : !known && famille === 'nettoyage' ? 'nettoyage' : known ? (PLURAL_FAMILIES[category] ?? category.toLowerCase()) : deduced && PLURAL_FAMILIES[deduced] ? PLURAL_FAMILIES[deduced] : (KIND_FAMILIES[item.kind] ?? '');
    if (family) nombres.set(family, (nombres.get(family) ?? 0) + 1);
  }
  // Le tri est stable : à nombre de lignes égal, l'ordre de première apparition (celui des clés de la Map) reste.
  const parNombre = (liste: string[]) => [...liste].sort((a, b) => nombres.get(b)! - nombres.get(a)!);
  const families = [...nombres.keys()];
  const vendor = (scan.vendor ?? '').replace(/\s+/g, ' ').trim(), number = (scan.invoiceNumber ?? '').replace(/\s+/g, ' ').trim();
  const join = (parts: string[]) => parts.filter(Boolean).join(' · ');
  // LP-4 : une commande commence souvent par du matériel et finit par les malts, houblons et levures ; au plafond de 60 caractères, les ingrédients, ce pour quoi
  // on achète, ne doivent pas être coupés avant le matériel. Les matières passent devant, chaque groupe par nombre de lignes décroissant.
  // « ingrédients » (lignes de stock sans catégorie lue) englobe malts, houblons, levures… : à côté d'eux, il les dit tous.
  const matieres = parNombre(families.filter(family => FAMILLES_MATIERES.has(family))), autres = parNombre(families.filter(family => !FAMILLES_MATIERES.has(family)));
  const matieresDites = matieres.includes(INGREDIENTS) ? [INGREDIENTS] : matieres;
  const complete = [...matieresDites, ...autres];
  // Tout tient : chaque famille nommée. Sinon, plusieurs familles de matières se disent ensemble (« ingrédients ») plutôt que d'en garder une seule, et les autres
  // familles suivent tant qu'elles tiennent, les plus nombreuses d'abord.
  // RF-15 : « ingrédients » ne remplace plus toutes les familles dès qu'elles ne tiennent pas ensemble : on garde les plus nombreuses qui tiennent (deux au moins) ; « ingrédients » reste le repli quand deux ne tiennent pas.
  const tient = (liste: string[]) => join([vendor, number, liste.join(', ')]).length <= DESCRIPTION_MAX;
  // Quand des familles de matières sont coupées, la description le dit (« malts, houblons… ») et les autres familles, qui viennent après, ne sont plus nommées.
  let gardees = matieresDites.length;
  while (gardees > 2 && !tient([...matieresDites.slice(0, gardees), '…'])) gardees--;
  const toutesTiennent = tient(matieresDites);
  const coupe = !toutesTiennent && matieresDites.length >= 2 && tient([...matieresDites.slice(0, gardees), '…']);
  const retenues = toutesTiennent || matieresDites.length < 2 ? complete : coupe ? matieresDites.slice(0, gardees) : [INGREDIENTS, ...autres];
  for (let kept = retenues.length; kept >= 0; kept--) {
    const text = join([vendor, number, retenues.slice(0, kept).join(', ') + (coupe && kept === retenues.length ? '…' : '')]);
    if (text.length <= DESCRIPTION_MAX) return text;
  }
  // Trop long même sans familles : le fournisseur est coupé à un mot pour que le numéro reste lisible.
  const room = DESCRIPTION_MAX - (number ? number.length + 3 : 0);
  let cut = vendor.slice(0, Math.max(room, 0));
  if (vendor.length > cut.length) cut = cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut;
  return join([cut.trim(), number]).slice(0, DESCRIPTION_MAX);
}

/**
 * Ce que la lecture propose pour « Pour quoi ? ». Une description tapée, ou d'origine inconnue et non vide, n'est jamais remplacée ;
 * vide ou venue d'une lecture, elle l'est. Rend un patch à passer à `patchPurchaseDraft`.
 */
export function applyScannedDescription(previous: PurchaseDraft, scan: ScannedInvoiceResult): Partial<PurchaseDraft> {
  const current = (previous.description ?? '').trim();
  if (current && previous.descriptionSource !== 'scan') return {};
  return { description: invoicePurchaseDescription(scan), descriptionSource: 'scan' };
}

/** A proposed sum is distinct from a total actually printed on the original. */
export function invoiceTotalProposal(scan: ScannedInvoiceResult): { amount?: number; calculated: boolean } {
  if (scan.currency !== 'CHF') return { calculated: false };
  if (typeof scan.amountTTC === 'number' && Number.isFinite(scan.amountTTC))
    return { amount: scan.amountTTC, calculated: false };
  const incomplete = [...scan.issues, ...(scan.review?.findings ?? []), ...(scan.fieldWarnings ?? []).filter(w => w.field === 'items').map(w => w.message)]
    .some(message => /Plus de \d+ lignes|lignes au plus|tronqu|incomplet|manquant|coup[ée]|illisible/i.test(message));
  if (!scan.items.length || incomplete || scan.items.some(item => typeof item.amountTTC !== 'number' || !Number.isFinite(item.amountTTC)))
    return { calculated: false };
  const amount = scan.items.reduce((sum, item) => sum + Math.round(item.amountTTC! * 100), 0) / 100;
  return amount > 0 ? { amount, calculated: true } : { calculated: false };
}

export function invoiceFieldHints(scan: ScannedInvoiceResult): Record<string, string> {
  const hints: Record<string, string> = {};
  // D262a : « plusieurs taux, taux global fixé à null » n'est pas un doute quand le bloc de TVA imprimé par taux (≥ 2 taux) ne se contredit pas.
  const tauxImprimes = new Set((scan.vat ?? []).map(row => row.rate).filter((rate): rate is number => typeof rate === 'number')).size;
  const blocJuste = tauxImprimes >= 2 && (scan as { controls?: { vat?: { statut?: string } } }).controls?.vat?.statut !== 'ecart';
  for (const warning of scan.fieldWarnings ?? []) if (!hints[warning.field] && !(warning.field === 'tvaRate' && blocJuste)) hints[warning.field] = warning.message;
  for (const message of [...scan.issues, ...(scan.review?.findings ?? [])]) {
    const field = /^(?:Date)\s|^Date\s*:/i.test(message) ? 'date'
      : /^(?:Fournisseur)\s*:/i.test(message) ? 'vendor'
      : /total|totaux|somme des lignes|montant TTC|montant final/i.test(message) ? 'amountTTC'
      : /devise|document en [A-Z]{3}/i.test(message) ? 'currency'
      : /^Catégorie\s*:/i.test(message) ? 'category'
      : /lignes|articles|conditionnement/i.test(message) ? 'items' : '';
    if (field && !hints[field]) hints[field] = message;
  }
  for (const field of scan.review?.correctedFields ?? []) {
    const key = field.startsWith('items') ? 'items' : field;
    if (!hints[key]) hints[key] = 'Valeur corrigée après relecture. À confirmer sur le justificatif.';
  }
  if (scan.items.some(item => item.ambiguity || item.kind === 'unknown')) hints.items ||= 'La nature ou la lecture de certains articles reste à confirmer.';
  const proposal = invoiceTotalProposal(scan);
  if (proposal.calculated) hints.amountTTC = `Somme des ${scan.items.length} lignes. Le total final n’est pas imprimé.`;
  else if (proposal.amount === undefined && scan.currency === 'CHF') hints.amountTTC ||= 'Total absent ou illisible. Indique le montant facturé.';
  if (!scan.date) hints.date = 'Date absente ou illisible. Indique la date de l’achat.';
  if (scan.currency !== 'CHF') hints.amountTTC = scan.currency ? `Document en ${scan.currency}. Indique le montant réellement débité en CHF et adapte les lignes.` : 'Devise absente. Vérifie que le montant est bien en CHF.';
  if (!scan.review || scan.review.status === 'unavailable') {
    hints.amountTTC ||= 'Vérification incomplète. Confirme ce montant sur le document.';
    hints.date ||= 'Vérification incomplète. Confirme la date imprimée.';
  }
  // n3-ht : dit ce qui a été fait, sans jamais remplacer un indice plus grave déjà posé (d'où `||=`, en dernier).
  if (scan.lignesPasseesAuTtc) hints.amountTTC ||= LIGNES_HT_PASSEES_AU_TTC;
  return hints;
}

const iso = (value: string) => value.replace(/^(\d{2})\.(\d{2})\.(\d{4})$/, '$3-$2-$1');

/**
 * Follow the purchase date unless the user has chosen a different payment date.
 * La base de la date de paiement : une clé `paymentDateBasis` dans le patch (la lecture) prime ; sans elle, une date donnée seule
 * est tapée, sauf quand le patch change aussi le statut (la date du jour substituée n'est jamais « typed » : base inconnue).
 * Une description donnée sans `descriptionSource` est tapée.
 */
export function patchPurchaseDraft(previous: PurchaseDraft, value: Partial<PurchaseDraft>, today: string): PurchaseDraft {
  const next = { ...previous, ...value, duplicateConfirmed: false };
  if (value.paymentDate !== undefined && !('paymentDateBasis' in value))
    next.paymentDateBasis = 'paymentStatus' in value ? undefined : 'typed';
  if (value.description !== undefined && !('descriptionSource' in value)) next.descriptionSource = 'typed';
  if (value.date !== undefined && value.paymentDate === undefined && previous.paymentDateBasis !== 'typed' && (!previous.paymentDate || previous.paymentDate === previous.date || previous.paymentDateBasis === 'document_date')) {
    /* dp (10.11, « 2 endroits qui ne font pas le lien ») : une date de paiement SUPPOSÉE (`document_date`) est la date de l'achat : elle la suit, même si elle en différait (date du jour par défaut, puis lecture). Seule une date choisie (`typed`) rompt le lien. */
    next.paymentDate = value.date;
    next.paymentDateBasis = value.date ? 'document_date' : undefined;
  }
  // An ordinary purchase is paid by default, but a future payment is never recorded as completed.
  if (next.paymentStatus === 'paid' && next.paymentDate && iso(next.paymentDate) > iso(today)) next.paymentStatus = 'unpaid';
  return next;
}

/**
 * Le statut vient de la preuve de paiement lue ; la date de paiement n'est jamais imprimée : elle reprend la date du document et
 * est marquée `document_date` (supposée). Sans date lue, pas de base (la clé reste présente pour que le patch la prenne en compte).
 */
/** RL-8 : le moyen lu sur le document (« TWINT ») → le moyen du règlement ; une carte et un virement passent par le compte (« Compte bancaire / carte »). `unknown` : rien (le défaut du brouillon reste, jamais une valeur devinée). */
export const MOYEN_LU: Record<string, PurchaseDraft['paymentMethod'] | undefined> = { twint: 'twint', cash: 'cash', card: 'bank', bank_transfer: 'bank', other: 'other' };
export function scannedPayment(scan: ScannedInvoiceResult, today: string): Pick<PurchaseDraft, 'paymentStatus' | 'paymentDate' | 'paymentDateBasis'> & Partial<Pick<PurchaseDraft, 'paymentMethod'>> {
  const base = scannedPaymentStatus(scan, today), moyen = MOYEN_LU[scan.paymentMethod ?? 'unknown'];
  return base.paymentStatus === 'paid' && moyen ? { ...base, paymentMethod: moyen } : base;
}
function scannedPaymentStatus(scan: ScannedInvoiceResult, today: string): Pick<PurchaseDraft, 'paymentStatus' | 'paymentDate' | 'paymentDateBasis'> {
  // Une pro-forma sans preuve de paiement imprimée est une demande de paiement : jamais préremplie comme payée (relecture l2, point 7).
  // Le type RETENU décide (l2, relais n° 3) : une pro-forma payée lue « devis » est une facture réglée ; sans lui (ancien résultat), le type lu.
  const type = scan.documentTypeRetenu ?? scan.documentType;
  return { paymentDate: scan.date, paymentDateBasis: scan.date ? 'document_date' : undefined, paymentStatus: scan.paymentEvidence === 'unpaid' || scan.proForma && scan.paymentEvidence !== 'paid' || type === 'quote' || type === 'credit_note' || scan.date && iso(scan.date) > iso(today) ? 'unpaid' : 'paid' };
}

/**
 * Ce que la lecture propose pour le règlement. Comme pour la description, une valeur tapée n'est jamais écrasée : si le brasseur a
 * tapé une date de paiement (base `typed`, date non vide), un second scan ne touche ni la date ni sa base ; seul le statut lu suit.
 * Vide, supposée (`document_date`) ou d'origine inconnue (la date du jour par défaut), la date du scan la remplace.
 * Rend un patch à passer à `patchPurchaseDraft`.
 */
export function applyScannedPayment(previous: PurchaseDraft, scan: ScannedInvoiceResult, today: string): Partial<PurchaseDraft> {
  const proposed = scannedPayment(scan, today);
  if (previous.paymentDateBasis === 'typed' && (previous.paymentDate ?? '').trim()) return { paymentStatus: proposed.paymentStatus };
  return proposed;
}
