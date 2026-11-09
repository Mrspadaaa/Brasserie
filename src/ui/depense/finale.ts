// Lenteur D (D308) : la fusion « sa saisie l'emporte » du final sur le provisoire. PURE : aucun état d'écran, aucun service, aucune écriture. Le contrat est `l1-plan/PLAN.md` § 4 bis.
//   - la BASE de comparaison est le brouillon tel que `applyOutcome` du provisoire l'a posé (jamais la valeur brute de la lecture) : `baseDeBrouillon` ;
//   - le final passe par les MÊMES transformations (`lignesDeLecture`, `enteteDeLecture`, extraites d'`applyOutcome`) avant toute comparaison ;
//   - une cellule est « touchée » si `courant ≠ base` ou si son registre la nomme (jamais pour un simple focus : ouvrir une rangée ou y poser le curseur ne la fige pas, PLAN § 4 bis B2) : une cellule touchée ne change jamais, sans fond bleu ;
//   - une seule table « rang final → id du brouillon » (B3) s'applique à tous les champs qui portent une ligne ;
//   - la fusion n'appelle jamais `applyOutcome` (qui remet tout à zéro) : elle rend le brouillon, le résultat remappé, les corrections, les lignes ajoutées et pas retrouvées.
import { makePoint, signerPoint } from '../../../functions/src/invoiceControls';
import type { ScannedInvoiceResult, ScannedLineKind } from '../../services/geminiScanner';
import { applyScannedDescription, applyScannedPayment, invoiceTotalProposal, patchPurchaseDraft } from '../../services/purchasePrefill';
import { sansCetteSaisie, uniteEffective, type PurchaseDraft, type PurchaseLineDraft } from '../../services/purchaseEntry';
import { PROPOSAL_WEIGHT_MARK, STOCK_LINE_PROPOSALS_ENABLED, STOCK_PROPOSAL_KINDS, donneesDeLigne, matchStockLine, regleProduit, shortUnit } from '../../services/stockLineMatching';
import { ligneDeBrouillon } from '../../domain/stock/articleNeuf';
import { lireOptions } from './optionsDuNom';
import { libelleDeLigne, voisinEtMarque } from './etat';
import { avecUnitesDeduites, libelleLu, texteQuantite } from './rangees';
import { groupeDe } from './groupes';
import { tvaImprimee } from './tva';
import { familleAUnStock, NATURE_DE_FAMILLE, type FamilleCle } from './familles';
import type { StockItem } from '../../types';

// Le point « lecture coupée » (R1) : recopié du serveur (`functions/src/invoiceVisionReview.ts`, `phraseCoupure`, `pointLectureCoupee`, `ajouterCoupure`) en fonctions pures, parce que ce module tire `invoiceScanCore`, `models` et `node:*`
// dans le paquet du client. `finale.test.ts` compare leurs sorties à celles du serveur : toute dérive casse ce test.
export const PHRASE_DELAI_SAUTE = 'Le contrôle complémentaire n’a pas abouti. Les divergences restent à vérifier sur le justificatif.';
export const phraseCoupure = (_cause: 'delai-saute') => PHRASE_DELAI_SAUTE;
export function pointLectureCoupee(cause: 'delai-saute', message: string) {
  const p = { ...makePoint('lecture-coupee', 'ecart', 'items', null, { regle: 'chaque lecture demandée arrive à son terme', message, unite: 'texte', enjeu: 'argent', origine: 'lecture', luTexte: cause }), source: 'contrôle' as const, pese: true };
  return { ...p, signature: signerPoint(p) };
}
export function ajouterCoupure<R extends { points: any[]; issues: string[]; review: { status: string; findings: string[] } }>(result: R, cause: 'delai-saute', message: string): R {
  result.points = [...result.points, pointLectureCoupee(cause, message)];
  if (!result.issues.includes(message)) result.issues = [...result.issues, message];
  if (!result.review.findings.includes(message)) result.review.findings = [...result.review.findings, message];
  if (result.review.status !== 'unavailable') result.review.status = 'disputed';
  return result;
}

export const scanKind = (kind: ScannedLineKind): PurchaseLineDraft['kind'] => (kind === 'stock' ? 'ingredient' : kind === 'unknown' ? 'other' : kind);
/** Le prix lu, au moins deux décimales (2,30 et non 2,3), trois sous 0,10 : une mise en forme, jamais un chiffre ajouté. */
export const prixImprime = (p: number) => { const d = (String(p).split('.')[1] ?? '').length; return p.toFixed(Math.max(Math.abs(p) < 0.1 ? 3 : 2, d)).replace('.', ','); };
const fr2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// Le calcul d'`applyOutcome`, extrait : les lignes d'une lecture et l'en-tête qu'elle propose.
// ------------------------------------------------------------------------------------------------------------------------------------------------------------
export interface Propositions {
  proposedStock: Set<string>; proposedRef: Map<string, string>; voisins: Map<string, { article: StockItem; marque: string }>; relieAuto: Map<string, string>; neufDOffice: Set<string>;
}
const propositionsVides = (): Propositions => ({ proposedStock: new Set(), proposedRef: new Map(), voisins: new Map(), relieAuto: new Map(), neufDOffice: new Set() });

/**
 * Les lignes du brouillon d'une lecture (D275, D277, D306) et ce que la lecture PROPOSE (articles liés, voisins, « nouvel article » d'office). Le calcul d'`applyOutcome`, sans changement :
 * libellé lu, Rénovation, unités déduites, rapprochement du stock, nouvel article d'office.
 */
export function lignesDeLecture(result: ScannedInvoiceResult, stockItems: readonly StockItem[], submissionId: string): { lines: PurchaseLineDraft[]; propositions: Propositions } {
  const propositions = propositionsVides();
  const total = invoiceTotalProposal(result);
  const lues0: PurchaseLineDraft[] = result.items.map(item => {
    /* d2, bloquant 1 (critique) : une remise n'a ni quantité ni unité ni prix unitaire (« 1 pièce × −0,68 » comptait 2 pièces de plus) ; elle reste un montant négatif. */
    /* P4 (banc b1) : une remise s'appelle « Rabais », jamais le libellé de taxe que le ticket imprime sous l'article (« NoVatTax - 0% ») ; ce libellé reste sous « Imprimé » (rien n'est perdu). */
    const nomImprime = String(item.name ?? '').trim(), lu: ReturnType<typeof libelleLu> = item.kind === 'discount' ? { description: 'Rabais', ...(nomImprime ? { imprime: { nom: nomImprime, ...(item.variant ? { variante: String(item.variant).trim() } : {}) } } : {}) } : libelleLu(item);
    const nomLu = lireOptions(String(item.name ?? ''), item.variant ? String(item.variant) : undefined, String(item.unit ?? '')).base.trim().slice(0, 80);
    return { id: item.id, description: lu.description, ...(nomLu ? { nomLu } : {}), ...(lu.imprime ? { imprime: lu.imprime } : {}), kind: scanKind(item.kind), amount: result.currency === 'CHF' ? (item.amountTTC ?? undefined) : undefined, quantity: item.kind === 'discount' ? undefined : item.quantity ?? undefined, unit: item.kind === 'discount' ? '' : item.unit, unitPrice: result.currency === 'CHF' && item.kind !== 'discount' ? (item.price ?? undefined) : undefined, stockAction: 'none' as const, equipmentAction: 'none' as const, stockCategory: item.stockCategory, sourceReference: item.reference, evidence: [item.reference ? `Réf. ${item.reference}` : '', lu.imprime ? `Imprimé : ${libelleDeLigne(item.name, item.variant)}` : '', item.evidence].filter(Boolean).join(' · ') };
  });
  const existantsLus = sansCetteSaisie(stockItems, submissionId);
  const familleDeLigne = (l: PurchaseLineDraft): FamilleCle => groupeDe(donneesDeLigne(ligneDeBrouillon({ ...l, unit: uniteEffective(l) }, result.vendor ?? undefined)).contexte, l.kind, l.description, l.stockCategory, undefined, result.category);
  /* D328c : une famille SANS stock (matériel, rénovation, services, « Autres ») dont un article existe déjà au stock, relié par son nom (même produit) ou par la ressemblance que `matchStockLine`
     retient, garde la ligne en ingrédient (liée à lui : le lien d'un article du brasseur ne se perd pas). Les familles AVEC stock (nettoyage, emballage, consommable) prennent leur nature
     (cleaning, packaging) : le rapprochement qui suit relie le même article, pour ces natures aussi. */
  const dejaAuStock = (l: PurchaseLineDraft, famille: FamilleCle): boolean => {
    if (familleAUnStock(famille)) return false;
    const unit = uniteEffective(l);
    if (regleProduit(ligneDeBrouillon({ ...l, unit }, result.vendor ?? undefined), existantsLus).cas === 'meme') return true;
    return STOCK_LINE_PROPOSALS_ENABLED && matchStockLine({ description: l.description, unit, quantity: l.quantity, vendor: result.vendor ?? undefined, stockCategory: l.stockCategory, reference: l.sourceReference, kind: l.kind, ...(l.nomLu ? { nomLu: l.nomLu } : {}) }, stockItems as StockItem[]) !== undefined;
  };
  /* D306, D328c : une ligne que la lecture dit « stock » (kind ingredient) prend la nature de sa famille quand ce n'est pas un ingrédient (`NATURE_DE_FAMILLE` : nettoyant → cleaning, emballage → packaging,
     matériel et rénovation → equipment, inclassable → other) : la bande et le type d'achat disent la même chose. Sans catégorie de stock (matériel, rénovation, services, « Autres »), aucun article, et
     jamais de « nouvel article » d'office (nettoyage et emballage non plus : seul un article déjà là se relie). Exceptions : un article déjà au stock la garde en ingrédient (familles sans stock) ;
     une ligne « Autres » d'une dépense de brassage (un adjuvant que nul mot ne classe) reste un ingrédient, jamais perdue. */
  const lues: PurchaseLineDraft[] = lues0.map(l => {
    if (l.kind !== 'ingredient') return l;
    const famille = familleDeLigne(l), nature = NATURE_DE_FAMILLE[famille];
    if (!nature || (famille === 'autres' && result.category === 'brassage') || dejaAuStock(l, famille)) return l;
    return { ...l, kind: nature, stockAction: 'none' as const };
  });
  /* D277 : l'unité absente se déduit avant le rapprochement ; l'imprimé reste vide (D213). */
  const deduites = avecUnitesDeduites({ lines: lues, vendor: result.vendor ?? '', amount: total.amount, category: result.category }, stockItems as StockItem[]).lines;
  const lines = deduites.map(line => {
    const unit = uniteEffective(line);
    /* D306 : une ligne de Rénovation (lue emballage, nettoyage…) ne se relie à rien ; D328c : un ingrédient qui est resté tel (article déjà au stock) suit le rapprochement. */
    if (line.kind !== 'ingredient' && familleDeLigne({ ...line, unit }) === 'renovation') return { ...line, stockAction: 'none' as const };
    const match = STOCK_LINE_PROPOSALS_ENABLED && (STOCK_PROPOSAL_KINDS as readonly string[]).includes(line.kind) ? matchStockLine({ description: line.description, unit, quantity: line.quantity, vendor: result.vendor ?? undefined, stockCategory: line.stockCategory, reference: line.sourceReference, kind: line.kind, ...(line.nomLu ? { nomLu: line.nomLu } : {}) }, stockItems as StockItem[]) : undefined;
    if (!match) {
      const voisin = (STOCK_PROPOSAL_KINDS as readonly string[]).includes(line.kind) ? voisinEtMarque({ ...line, unit }, stockItems, result.vendor ?? undefined) : undefined;
      if (voisin) propositions.voisins.set(line.id, voisin);
      if (line.kind === 'ingredient' && line.description.trim()) {
        const regle = regleProduit(ligneDeBrouillon({ ...line, unit }, result.vendor ?? undefined), existantsLus);
        if (regle.cas === 'meme') { propositions.relieAuto.set(line.id, regle.article.name); return { ...line, stockAction: 'existing' as const, stockRef: regle.article.ref }; }
        if (regle.cas !== 'ambigu') { propositions.neufDOffice.add(line.id); return { ...line, stockAction: 'new' as const }; }
      }
      return line;
    }
    propositions.proposedStock.add(line.id); propositions.proposedRef.set(line.id, match.item.ref);
    if (match.weightUnconfirmed) propositions.proposedStock.add(line.id + PROPOSAL_WEIGHT_MARK);
    return { ...line, stockAction: 'existing' as const, stockRef: match.item.ref, evidence: [line.evidence, ...(match.deduced.length ? [`Libellé : ${line.description}`, ...match.deduced] : [])].filter(Boolean).join(' · ') };
  });
  return { lines, propositions };
}

/** Ce que la lecture propose pour l'en-tête (sans les lignes) : le patch que `applyOutcome` passe à `patchPurchaseDraft`. */
export function enteteDeLecture(previous: PurchaseDraft, result: ScannedInvoiceResult, today: string): Partial<PurchaseDraft> {
  const total = invoiceTotalProposal(result), proposed = applyScannedDescription(previous, result);
  return { vendor: result.vendor, date: result.date, ...applyScannedPayment(previous, result, today), invoiceNumber: result.invoiceNumber, ...proposed, category: result.category, amount: total.amount, sourceCurrency: result.currency, sourceAmount: result.amountTTC ?? undefined, sourceDocumentType: result.documentType, sourceOrderNumber: result.orderNumber, sourceTotalBasis: total.calculated ? 'line_sum' : result.amountTTC !== null ? 'printed' : undefined, sourceNetAmount: result.amountHT ?? undefined, sourceVatRate: result.tvaRate ?? undefined, sourceVatAmount: tvaImprimee(result)?.montant };
}

export interface OptionsLecture { stockItems: readonly StockItem[]; today: string; model?: string; documentHash?: string; ligneVide: () => PurchaseLineDraft }
/** Le brouillon que pose une lecture : ce que fait `applyOutcome`, en pur (la même sortie, les propositions en plus). */
export function brouillonDeLecture(previous: PurchaseDraft, result: ScannedInvoiceResult, o: OptionsLecture): { draft: PurchaseDraft; propositions: Propositions } {
  const { lines, propositions } = lignesDeLecture(result, o.stockItems, previous.submissionId), entete = enteteDeLecture(previous, result, o.today);
  const description = entete.description ?? previous.description;
  const draft = patchPurchaseDraft(previous, { ...entete, lines: lines.length ? lines : [{ ...o.ligneVide(), description: description || 'Achat', amount: entete.amount }], scanModel: o.model, documentHash: o.documentHash }, o.today);
  return { draft, propositions };
}

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// La base (B1) et les cellules (B2)
// ------------------------------------------------------------------------------------------------------------------------------------------------------------
/** Les cellules d'une rangée que la fusion compare. `evidence` suit sa ligne et n'est jamais une correction montrée ; `nameFr` vient de la traduction (M6). */
export const CELLULES_LIGNE = ['description', 'nomLu', 'imprime', 'kind', 'quantity', 'unit', 'unitPrice', 'amount', 'stockCategory', 'sourceReference', 'stockAction', 'stockRef', 'articleName', 'equipmentAction'] as const;
export type Cellule = typeof CELLULES_LIGNE[number];
const NOM_CELLULES: readonly Cellule[] = ['description', 'nomLu', 'imprime'];
const LIEN_CELLULES: readonly Cellule[] = ['stockAction', 'stockRef', 'articleName', 'equipmentAction'];
export type CellulesLigne = Partial<Pick<PurchaseLineDraft, Cellule | 'evidence' | 'nameFr' | 'uniteDeduite'>>;
/** Les groupes d'en-tête : une cellule d'écran peut être posée par plusieurs champs du brouillon (le total : trois ; la TVA : deux). `registre` : ce qui dit « il l'a touchée ». */
const GROUPES_ENTETE: Array<{ cle: string; champs: Array<keyof PurchaseDraft>; registre: string[] }> = [
  { cle: 'vendor', champs: ['vendor'], registre: ['vendor'] }, { cle: 'date', champs: ['date'], registre: ['date'] }, { cle: 'invoiceNumber', champs: ['invoiceNumber'], registre: ['invoiceNumber'] },
  { cle: 'total', champs: ['amount', 'sourceAmount', 'sourceTotalBasis'], registre: ['amountTTC'] }, { cle: 'tva', champs: ['sourceVatAmount', 'sourceVatRate'], registre: ['tvaAmount'] },
  { cle: 'ht', champs: ['sourceNetAmount'], registre: ['amountHT'] }, { cle: 'paiement', champs: ['paymentStatus', 'paymentMethod'], registre: ['paymentEvidence'] }, { cle: 'description', champs: ['description', 'descriptionSource'], registre: [] },
  { cle: 'category', champs: ['category'], registre: ['category'] }, { cle: 'currency', champs: ['sourceCurrency'], registre: ['currency'] },
  { cle: 'documentType', champs: ['sourceDocumentType'], registre: [] }, { cle: 'order', champs: ['sourceOrderNumber'], registre: [] },
];
/** Les groupes d'en-tête qui ont une case à l'écran (bandeau : fournisseur, date, total ; tuiles : TVA, Règlement) : seuls ceux-là se marquent en bleu et entrent dans le compte de la puce. */
export const CASES_ENTETE = ['vendor', 'date', 'total', 'tva', 'paiement'] as const;
export interface BaseFusion {
  jeton: string; nProvisoire: number;
  lignes: Record<string, CellulesLigne>; entete: Partial<PurchaseDraft>;
  /** Les ids de lignes dont l'article est proposé, ou fait « nouvel article » d'office, au moment de la base : un id qui en sort est un geste du brasseur (« Garder », ⇄…). */
  proposes: string[]; neufsOffice: string[];
}
const memes = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const prendre = <T extends object>(o: T, cles: readonly string[]): Record<string, unknown> => Object.fromEntries(cles.map(k => [k, (o as Record<string, unknown>)[k]]));
/** L'instantané du brouillon posé : par id de ligne et par cellule, pour toutes les cellules (B1). Il se met à jour de la seule écriture du programme entre les deux (la traduction). */
export function baseDeBrouillon(draft: PurchaseDraft, jeton: string, propositions: Propositions, nProvisoire: number): BaseFusion {
  return {
    jeton, nProvisoire,
    lignes: Object.fromEntries(draft.lines.map(l => [l.id, { ...prendre(l, [...CELLULES_LIGNE, 'evidence', 'nameFr', 'uniteDeduite']) } as CellulesLigne])),
    entete: prendre(draft, GROUPES_ENTETE.flatMap(g => g.champs as string[])) as Partial<PurchaseDraft>,
    proposes: [...propositions.proposedStock].filter(x => !x.endsWith(PROPOSAL_WEIGHT_MARK)), neufsOffice: [...propositions.neufDOffice],
  };
}

export interface Registres {
  reviewedFields: readonly string[]; manuallyClassified: ReadonlySet<string>;
  /** Les ids dont l'article est encore proposé, ou « nouvel article » d'office, MAINTENANT. */
  proposes: ReadonlySet<string>; neufsOffice: ReadonlySet<string>;
  reglees: ReadonlySet<string>;
  /** IGNORÉ depuis e-finitions : un focus posé sans changer la valeur ne rend ni la rangée ni la cellule « touchée » (seule une valeur changée est gardée). Champ conservé pour les appelants et les tests d'avant. */
  focus?: string | null;
}
export interface Correction { id: string; champ: Cellule; avant: unknown; apres: unknown }
export interface Perdue { ligne: PurchaseLineDraft; /** La ligne gardée qui la précède dans le brouillon (`null` : en tête). */ apres: string | null }
export interface SortieFusion {
  etat: 'finie' | 'echec';
  draft: PurchaseDraft; result: ScannedInvoiceResult;
  /** id du final → id du brouillon (B3). */
  table: Map<string, string>;
  corrections: { lignes: Record<string, Correction[]>; entete: Record<string, { avant: unknown; apres: unknown }> };
  /** Les ids du brouillon que la 3.8 ajoute (son choix 1 B). */
  ajoutees: string[];
  /** Les lignes que la 3.8 ne lit plus (son choix 2 D) : hors du brouillon, donc hors de toute somme, jusqu'à « Garder ». « Confirmer » sans trancher : elles partent. */
  perdues: Perdue[];
  /** m2 : le nombre de CIBLES corrigées : une rangée avec au moins une cellule corrigée, un champ d'en-tête corrigé, une ligne ajoutée. Les lignes pas retrouvées n'y sont pas. */
  nCorrigees: number;
  /** M6 : les lignes dont le nom de base change, et les lignes ajoutées : à traduire. */
  aRetraduire: string[];
  /** Les lignes dont les propositions (article lié, voisin…) viennent du final : leurs anciennes marques s'effacent, ces nouvelles les remplacent. */
  reprises: string[]; propositions: Propositions;
}
export interface EntreeFusion {
  base: BaseFusion; courant: PurchaseDraft; provisoire: ScannedInvoiceResult; final: ScannedInvoiceResult; stockItems: readonly StockItem[]; today: string; registres: Registres; ligneVide: () => PurchaseLineDraft; model?: string;
}

const rangDe = (id: string): number => { const m = /^line-(\d+)$/.exec(id); return m ? Number(m[1]) : Number.NaN; };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** B3 : « rang final → id du brouillon ». `fiable` : le jeton du morceau reçu est celui du final et chaque ligne dit son rang ; sinon (M4) la position, si les deux listes ont la même longueur. */
export function tableDeRangs(final: ScannedInvoiceResult, nProvisoire: number, jeton: string): { ok: boolean; table: Map<string, string>; ajoutees: string[]; paires: Set<number> } {
  const table = new Map<string, string>(), ajoutees: string[] = [], paires = new Set<number>();
  const fiable = final.provisoireJeton === jeton && final.items.length > 0 && final.items.every(i => i.rangProvisoire !== undefined);
  const parPosition = !fiable && final.items.length === nProvisoire && nProvisoire > 0;
  if (!fiable && !parPosition) return { ok: false, table, ajoutees, paires };
  let k = 0;
  final.items.forEach((item, j) => {
    const r = fiable ? item.rangProvisoire : j;
    if (typeof r === 'number' && r >= 0 && r < nProvisoire && !paires.has(r)) { paires.add(r); table.set(item.id, `line-${r + 1}`); }
    else { k += 1; const id = `line-${nProvisoire + k}`; table.set(item.id, id); ajoutees.push(id); }
  });
  return { ok: true, table, ajoutees, paires };
}

/** Un numéro de ligne (`points[].ligne`) passé par la table : le numéro de l'id du brouillon (R4). */
const renumeroter = (n: number | null | undefined, table: ReadonlyMap<string, string>): number | null | undefined => {
  if (typeof n !== 'number') return n;
  const id = table.get(`line-${n}`);
  return id ? rangDe(id) : n;
};
function remapperPoints(points: any[] | undefined, table: ReadonlyMap<string, string>): any[] | undefined {
  if (!points) return points;
  return points.map(p => {
    if (p.ligne === null || p.ligne === undefined) return p;
    const ligne = renumeroter(p.ligne, table) as number;
    const sans = { ...p, ligne, ...(Array.isArray(p.lignes) ? { lignes: p.lignes.map((n: number) => renumeroter(n, table)) } : {}),
      champs: (p.champs ?? []).map((c: string) => c.replace(/^items\.(\d+)\./, (_m, n) => `items.${renumeroter(Number(n), table)}.`)),
      cle: String(p.cle).replace(/:(\d+):/, (_m, n) => `:${renumeroter(Number(n), table)}:`) };
    const { signature: _ancienne, ...reste } = sans;
    return { ...reste, signature: signerPoint(reste) };
  });
}

/** Le texte de l'ancienne valeur d'une rangée corrigée (sa maquette : « 10 Kg × 1,45 », « 30 ? », « 4 Kg × 1,80 · 7,20 »). */
export function libelleAvant(base: CellulesLigne, corrections: readonly Pick<Correction, 'champ'>[], courant?: Pick<PurchaseLineDraft, 'quantity' | 'unit' | 'uniteDeduite'>): string {
  const champs = new Set(corrections.map(c => c.champ));
  /* La quantité d'une rangée dont seul le prix est corrigé est celle d'aujourd'hui (celle qu'il a tapée, le cas échéant) : on ne barre jamais une valeur qui n'a pas été corrigée. */
  const qteCorrigee = champs.has('quantity') || champs.has('unit');
  /* e-finitions (mineur 2) : quand la quantité d'aujourd'hui n'est ni la lue ni une correction, elle est la sienne : le barré ne montre alors que le prix (« × 1,45 »), jamais un produit qui n'a pas existé (« 12 Kg × 1,45 »). */
  const qteLaSienne = !qteCorrigee && courant !== undefined && !(memes(courant.quantity, base.quantity) && (courant.unit ?? '') === (base.unit ?? ''));
  const ligne = { quantity: base.quantity, unit: base.unit ?? '', uniteDeduite: base.uniteDeduite } as PurchaseLineDraft;
  // Le barré dit « ? » pour une unité ou une quantité qui n'était pas lue : `horsStock` faux (la rangée n'ajoute plus « ? » à une ligne hors stock, g2a, mais ici l'ancienne valeur est à dire).
  const qte = qteLaSienne ? '' : texteQuantite(ligne, uniteEffective(ligne), false);
  const parts: string[] = [];
  if (champs.has('unitPrice')) parts.push(`${qte ? `${qte} ` : ''}× ${base.unitPrice === undefined ? '?' : prixImprime(base.unitPrice)}`);
  else if (champs.has('quantity') || champs.has('unit')) parts.push(qte);
  if (champs.has('amount')) parts.push(base.amount === undefined ? '?' : fr2(base.amount));
  if (NOM_CELLULES.some(c => champs.has(c)) && base.description) parts.unshift(base.description);
  return parts.join(' · ');
}

/** « Garder » : la ligne pas retrouvée revient à sa place (après la ligne qui la précédait, avant les lignes de rang plus haut). */
export function rangerLaPerdue(lignes: readonly PurchaseLineDraft[], perdue: Perdue, ligne: PurchaseLineDraft): PurchaseLineDraft[] {
  const rang = rangDe(perdue.ligne.id), sortie = [...lignes];
  let i = perdue.apres === null ? 0 : sortie.findIndex(l => l.id === perdue.apres) + 1;
  if (perdue.apres !== null && i === 0) i = sortie.length;
  while (i < sortie.length && rangDe(sortie[i].id) < rang) i += 1;
  sortie.splice(i, 0, ligne);
  return sortie;
}

/** La fusion. `etat: 'echec'` : aucun rapprochement possible (jeton inégal, longueurs différentes) : le provisoire reste, avec le point « lecture coupée » (R1). */
export function appliquerFinale(e: EntreeFusion): SortieFusion {
  const { base, courant, provisoire, final, registres: reg } = e;
  const vide = (): SortieFusion => ({ etat: 'echec', draft: courant, result: ajouterCoupure(clone(provisoire) as any, 'delai-saute', phraseCoupure('delai-saute')) as ScannedInvoiceResult, table: new Map(), corrections: { lignes: {}, entete: {} }, ajoutees: [], perdues: [], nCorrigees: 0, aRetraduire: [], reprises: [], propositions: propositionsVides() });
  const t = tableDeRangs(final, base.nProvisoire, base.jeton);
  if (!t.ok) return vide();

  // Les lignes du final passent par les MÊMES transformations que celles du provisoire (B1), puis changent d'id par la table.
  const { lines: lignesFinales, propositions: propsFinales } = lignesDeLecture(final, e.stockItems, courant.submissionId);
  const finalParId = new Map(lignesFinales.map(l => [t.table.get(l.id)!, { ...l, id: t.table.get(l.id)! }]));
  const marquesFinales = (idFinal: string, idBrouillon: string, vers: Propositions) => {
    if (propsFinales.proposedStock.has(idFinal)) vers.proposedStock.add(idBrouillon);
    if (propsFinales.proposedStock.has(idFinal + PROPOSAL_WEIGHT_MARK)) vers.proposedStock.add(idBrouillon + PROPOSAL_WEIGHT_MARK);
    const ref = propsFinales.proposedRef.get(idFinal); if (ref !== undefined) vers.proposedRef.set(idBrouillon, ref);
    const v = propsFinales.voisins.get(idFinal); if (v) vers.voisins.set(idBrouillon, v);
    const r = propsFinales.relieAuto.get(idFinal); if (r !== undefined) vers.relieAuto.set(idBrouillon, r);
    if (propsFinales.neufDOffice.has(idFinal)) vers.neufDOffice.add(idBrouillon);
  };
  const idFinalDe = new Map([...t.table].map(([idFinal, idBrouillon]) => [idBrouillon, idFinal]));

  const propositions = propositionsVides(), reprises: string[] = [], aRetraduire: string[] = [];
  const corrections: SortieFusion['corrections'] = { lignes: {}, entete: {} };
  const perdues: Perdue[] = [], gardees: PurchaseLineDraft[] = [];
  let precedente: string | null = null;

  const touchee = (id: string, c: Cellule, l: PurchaseLineDraft, b: CellulesLigne): boolean => {
    if (!memes(l[c], b[c])) return true;
    if (c === 'kind' && reg.manuallyClassified.has(id)) return true;
    if ((LIEN_CELLULES as readonly string[]).includes(c)) {
      if (reg.manuallyClassified.has(id)) return true;
      if (base.proposes.includes(id) && !reg.proposes.has(id)) return true;
      if (base.neufsOffice.includes(id) && !reg.neufsOffice.has(id)) return true;
    }
    return false;
  };

  for (const l of courant.lines) {
    const b = base.lignes[l.id];
    if (!b) { gardees.push(l); precedente = l.id; continue; } // une ligne qu'il a ajoutée : intacte
    const F = finalParId.get(l.id);
    if (!F) {
      // Pas retrouvée : si le brasseur l'a retouchée, elle reste une ligne comme les autres ; sinon elle sort du brouillon et attend sa décision (son choix 2 D).
      if (CELLULES_LIGNE.some(c => touchee(l.id, c, l, b))) { gardees.push(l); precedente = l.id; }
      else perdues.push({ ligne: l, apres: precedente });
      continue;
    }
    const fusionnee: PurchaseLineDraft = { ...l, evidence: F.evidence };
    const faites: Correction[] = [];
    for (const c of CELLULES_LIGNE) {
      if (touchee(l.id, c, l, b)) continue;
      if (memes(F[c], b[c])) continue;
      (fusionnee as unknown as Record<string, unknown>)[c] = F[c];
      faites.push({ id: l.id, champ: c, avant: b[c], apres: F[c] });
    }
    // Les marques de lien viennent du final seulement pour une rangée dont il n'a pas touché le lien.
    if (!LIEN_CELLULES.some(c => touchee(l.id, c, l, b))) { reprises.push(l.id); marquesFinales(idFinalDe.get(l.id)!, l.id, propositions); }
    if (faites.length) corrections.lignes[l.id] = faites.filter(c => c.champ !== 'equipmentAction');
    if (!corrections.lignes[l.id]?.length) delete corrections.lignes[l.id];
    // M6 : le nom de base qui change efface `nameFr`, et la ligne sera traduite à nouveau ; un nom qu'il a retouché reste le sien.
    if (faites.some(c => (NOM_CELLULES as readonly string[]).includes(c.champ))) { delete fusionnee.nameFr; aRetraduire.push(l.id); }
    gardees.push(fusionnee); precedente = l.id;
  }

  // Les lignes ajoutées par la 3.8 : à leur place, après la ligne qui les précède dans le final.
  const ajoutees = t.ajoutees, ajouteesIds: string[] = [];
  const ordre = [...gardees];
  final.items.forEach((item, j) => {
    const id = t.table.get(item.id)!;
    if (!ajoutees.includes(id)) return;
    const F = finalParId.get(id)!;
    let apres = -1;
    for (let k = j - 1; k >= 0 && apres < 0; k -= 1) apres = ordre.findIndex(x => x.id === t.table.get(final.items[k].id));
    ordre.splice(apres + 1, 0, F); ajouteesIds.push(id); reprises.push(id); aRetraduire.push(id);
    marquesFinales(item.id, id, propositions);
  });

  // L'en-tête : chaque groupe non touché prend la valeur du final ; une valeur touchée ne change jamais, et aucune correction n'est comptée.
  const entete = enteteDeLecture(courant, final, e.today);
  const patch: Record<string, unknown> = {};
  for (const g of GROUPES_ENTETE) {
    const avant = prendre(base.entete, g.champs as string[]), maintenant = prendre(courant, g.champs as string[]), apres = prendre(entete, g.champs as string[]);
    const registre = g.registre.some(r => reg.reviewedFields.includes(r)) || (g.cle === 'tva' && reg.reglees.has('TVA|')) || (g.cle === 'description' && courant.descriptionSource === 'typed');
    if (registre || !memes(maintenant, avant)) continue;
    Object.assign(patch, apres);
    /* Une correction se dit sur la valeur que la case MONTRE (le premier champ du groupe : le montant de TVA, l'état du règlement) ; un autre champ du groupe qui change seul s'applique sans marque et sans compte. */
    if (!memes(apres[g.champs[0] as string], avant[g.champs[0] as string])) corrections.entete[g.cle] = { avant: avant[g.champs[0] as string], apres: apres[g.champs[0] as string] };
  }
  const draft = { ...patchPurchaseDraft(courant, { ...patch, lines: ordre, ...(e.model ? { scanModel: e.model } : {}) } as Partial<PurchaseDraft>, e.today), duplicateConfirmed: courant.duplicateConfirmed };

  // B3 : le résultat remappé, ses lignes dans l'ordre du brouillon, avec leur id ; les lignes provisoires gardées gardent leur ligne provisoire.
  const itemsFinaux = new Map(final.items.map(i => [t.table.get(i.id)!, { ...i, id: t.table.get(i.id)! }]));
  const itemsProvisoires = new Map(provisoire.items.map(i => [i.id, i]));
  const items = ordre.map(l => itemsFinaux.get(l.id) ?? itemsProvisoires.get(l.id)).filter((i): i is ScannedInvoiceResult['items'][number] => Boolean(i));
  const controls = final.controls ? { ...final.controls, lines: { ...final.controls.lines, skippedIds: (final.controls.lines.skippedIds ?? []).map(id => t.table.get(id) ?? id) } } : undefined;
  const result: ScannedInvoiceResult = {
    ...final, items, ...(controls ? { controls } : {}), ...(final.points ? { points: remapperPoints(final.points, t.table) as ScannedInvoiceResult['points'] } : {}),
    ...(final.remarques ? { remarques: final.remarques.map(r => ({ ...r, ...(r.ligne !== undefined ? { ligne: renumeroter(r.ligne, t.table) as number } : {}) })) } : {}),
    ...(final.rejets ? { rejets: final.rejets.map(r => ({ ...r, ligne: renumeroter(r.ligne, t.table) as number | null })) } : {}),
  };

  // Le compte de la puce ne porte que ce qui a une marque à l'écran : une correction d'un champ sans case (n° de facture, HT, catégorie…) est appliquée mais n'entre pas dans le compte (VERDICT-e-ecran, majeur 2).
  const nCorrigees = Object.keys(corrections.lignes).length + Object.keys(corrections.entete).filter(k => (CASES_ENTETE as readonly string[]).includes(k)).length + ajouteesIds.length;
  return { etat: 'finie', draft, result, table: t.table, corrections, ajoutees: ajouteesIds, perdues, nCorrigees, aRetraduire, reprises, propositions };
}

/** R1 : la fin de partie (rien du final n'a pu être posé) : le provisoire, avec le point « lecture coupée » (`delai-saute`) qui marque les lignes « reprises ». */
export const provisoireCoupe = (provisoire: ScannedInvoiceResult): ScannedInvoiceResult => ajouterCoupure(clone(provisoire) as any, 'delai-saute', phraseCoupure('delai-saute')) as ScannedInvoiceResult;
export { shortUnit };
