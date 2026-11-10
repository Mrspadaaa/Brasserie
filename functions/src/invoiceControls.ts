// Module pur (aucun import `node:`) : les règles de calcul de la lecture d'une facture, partagées par les fonctions (`invoiceScanCore.ts`)
// et par le client (`src/domain/finance/invoicePoints.ts`). Voie l2-rapprochement (31.10) : ces règles ont été DÉPLACÉES de
// `invoiceScanCore.ts` sans changement de comportement ; `invoiceScanCore.ts` les importe et les ré-exporte.
export const INVOICE_FIELDS = ['vendor', 'date', 'currency', 'invoiceNumber', 'amountHT', 'amountTTC', 'tvaRate', 'tvaAmount', 'category', 'items', 'documentType', 'paymentEvidence'] as const;
export type InvoiceField = typeof INVOICE_FIELDS[number];
type CoreItem = { id: string; name: string; kind: string; quantity: number | null; unit: string; price: number | null; amountTTC: number | null };

// ---------------------------------------------------------------------------------------------------------------------
// Contrat du point typé (voie l1-lecture, PLAN.md § 0 et § 2.1). Tout est AJOUTÉ au résultat ; `issues` reste rempli.
// `points` est un instantané de la lecture : il ne se recalcule pas quand le brasseur corrige une valeur (recalcul client : l2).
// Montants en centimes entiers. `lu` = toujours un nombre imprimé ; `calcule` = toujours le résultat du code ; `ecart = lu − calcule`.
// ---------------------------------------------------------------------------------------------------------------------
export const SCAN_POINT_CODES = [
  'ligne-montant',       // C1  quantité × prix ≠ montant de la ligne
  'ligne-prix-par-lot',  // C1  prix probablement par 100 g ou par kg : inverifiable, jamais un écart
  'somme-ecart',         // C2  somme des lignes ≠ total imprimé
  'somme-incomplete',    // C2b une ligne sans montant lisible : la somme ne peut pas être vérifiée
  'tva-incoherente',     // C3  le bloc TVA imprimé ne se recoupe pas (détails dans `details`)
  'ht-tva-ttc',          // C4  HT + TVA ≠ TTC
  'lignes-perdues',      // P2  des lignes n'ont pas été conservées
  'lignes-annoncees',    // P2  le modèle annonce plus de lignes qu'il n'en a transcrit, mais la somme tombe juste
  'lignes-absentes',     // LO-3  un total imprimé et aucune ligne lue (une page ou une partie du document manque peut-être)
  'pro-forma-non-payee', // A6  pro-forma sans paiement imprimé
  'type-deduit',         // A6  pro-forma payée lue « devis » : `documentTypeRetenu` = invoice, `documentType` reste tel que lu
  'devis',               // un vrai devis (pas une pro-forma) : à vérifier
  'alpha-libelle',       // A9  α lu ≠ pourcentage imprimé dans le libellé
  'unite-absente',       // D213  ligne sans unité lisible : aucune unité devinée, elle est à préciser (D214)
  'forme-rejetee',       // une valeur lue a été rejetée à la mise en forme (hors plage, coupée) : elle est tracée dans `rejets`
  // l2 (31.10) : les phrases d'`issues` qui n'avaient pas de point, et le rapprochement des lectures
  'date-absente', 'devise-non-chf', 'total-absent', 'taux-tva-hors-plage', 'document-livraison', 'avoir',
  'nature-a-preciser', 'ambiguite-ligne',
  'lectures-divergentes',   // deux lectures (ou plus) ne lisent pas la même valeur : `valeurs` les garde toutes
  'lignes-non-rapprochees', // des lignes n'ont pas de vis-à-vis dans l'autre lecture
  'lecture-coupee',         // une lecture a été coupée (sortie, délai) ou la troisième n'a pas eu lieu
] as const;
export type ScanPointCode = typeof SCAN_POINT_CODES[number];
export type ScanSource = 'désaccord' | 'contrôle' | 'modèle';
/** Ce que la lecture n° `lecture` (1 à 3) a lu ; `retenue` = la valeur qui est dans le résultat ; `null` = absent (jamais 0). */
export interface ScanValue { lecture: number; valeur: number | string | boolean | null; retenue: boolean; motif?: 'recoupée' | 'majorité'; ligne?: number }

/** Ce qui pèse dans le statut (PLAN.md § 2.2, P1) : tout ce qui rendait la lecture « à confirmer » avant l2 continue de peser ;
 * `type-deduit` ne pèse pas (pro-forma payée retenue comme facture). `lectures-divergentes` pèse sauf quand une majorité a tranché. */
export const PESE_PAR_CODE: Record<ScanPointCode, boolean> = {
  'ligne-montant': true, 'ligne-prix-par-lot': true, 'somme-ecart': true, 'somme-incomplete': true, 'tva-incoherente': true, 'ht-tva-ttc': true,
  'lignes-perdues': true, 'lignes-annoncees': true, 'lignes-absentes': true,'pro-forma-non-payee': true, 'type-deduit': false, 'devis': true, 'alpha-libelle': true,
  'unite-absente': true, 'forme-rejetee': true, 'date-absente': true, 'devise-non-chf': true, 'total-absent': true, 'taux-tva-hors-plage': true,
  'document-livraison': true, 'avoir': true, 'nature-a-preciser': true, 'ambiguite-ligne': true, 'lectures-divergentes': true,
  'lignes-non-rapprochees': true, 'lecture-coupee': true,
};
/** `pese` posé sur le point : explicite s'il est déjà là (désaccord résolu), sinon la table. */
export const peserPoint = (point: Pick<ScanPoint, 'code'> & { pese?: boolean }): boolean => point.pese ?? PESE_PAR_CODE[point.code] ?? true;
/** Empreinte des valeurs d'un point : même `cle` mais autres valeurs = autre point (un « revu » ne vaut que pour la même signature). */
export const signerPoint = (point: Pick<ScanPoint, 'lu' | 'calcule' | 'luTexte' | 'valeurs'>): string =>
  [point.lu, point.calcule, point.luTexte ?? '', (point.valeurs ?? []).map(v => `${v.lecture}:${v.valeur}`).join(',')].join('|');
/** Le rang d'une ligne vient de son `id` (`line-7` → 7), pas de sa position : une suppression ne décale rien. */
export const ligneDepuisId = (id: string): number | null => { const m = /^line-(\d+)$/.exec(id); return m ? Number(m[1]) : null; };
/** Le statut ne dépend que des points qui pèsent. */
export const statutDesPoints = (points: Array<{ code: ScanPointCode; pese?: boolean }>): 'disputed' | 'ok' => points.some(peserPoint) ? 'disputed' : 'ok';
export interface ScanPointDetail {
  relation: string; lu: number | null; calcule: number | null; ecart: number | null; code?: string; arrondiPossible?: boolean;
}
export interface ScanPoint {
  code: ScanPointCode;
  gravite: 'ecart' | 'inverifiable';          // ecart : deux nombres lus ne se recoupent pas ; inverifiable : le contrôle ne peut pas tourner
  origine: 'controle' | 'forme' | 'lecture';  // lecture : vient du rapprochement des lectures (l2)
  enjeu: 'argent' | 'stock' | 'info';
  bloque: boolean;                            // le client refuserait d'enregistrer en l'état (somme-ecart seulement)
  bloqueLiaison?: boolean;                    // l2 : pas de liaison automatique au stock (nom, unité, taille, catégorie en désaccord)
  source?: ScanSource;                        // l2 : absent = « contrôle »
  valeurs?: ScanValue[];                      // l2 : ce que chaque lecture a lu
  pese?: boolean;                             // l2 : le point compte dans le statut (table PESE_PAR_CODE)
  signature?: string;                         // l2 : empreinte des valeurs ; « revu » ne vaut que pour la même
  champ: InvoiceField | 'vat' | 'orderNumber' | 'proForma';
  champs: string[];                           // les cellules en cause, ex. ['items.1.quantity', 'items.1.price', 'items.1.amountTTC']
  ligne: number | null;                       // 1-based (id `line-<n>`), null pour l'en-tête
  lignes?: number[];
  cle: string;                                // `<code>:<ligne|->:<champ>` : stable, pour marquer « revu »
  regle: string;
  lu: number | null; calcule: number | null; ecart: number | null;
  unite: 'centimes' | 'pourcent' | 'lignes' | 'texte' | 'nombre';
  luTexte?: string;                           // valeur lue qui est un texte
  candidats?: number[];                       // réservé (l2) : non rempli ici
  message: string;                            // la phrase poussée aussi dans `issues`
  details?: ScanPointDetail[];
}
export type ControlStatus = 'ok' | 'ecart' | 'incomplet' | 'non-verifiable';
export interface ScanControls {
  lines: { checked: number; failed: number; skipped: number; skippedIds: string[] };
  sum: { statut: ControlStatus; base: 'TTC' | 'HT' | null };
  vat: { statut: ControlStatus; base: 'TTC' | 'HT' | null };
  totals: { statut: ControlStatus };
}
export interface ScanVatRow { code: string; rate: number | null; base: number | null; amount: number | null }
export interface ScanRejet { champ: string; ligne: number | null; luTexte: string; raison: string }

/** Un montant en CHF devient un entier de centimes, ou `null` s'il n'en est pas un (1,345 : jamais arrondi sans trace). */
export function toCents(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const cents = value * 100, rounded = Math.round(cents);
  return Math.abs(cents - rounded) <= 1e-7 * Math.max(1, Math.abs(cents)) ? rounded : null;
}
export const chf = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
export const defined = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
/** Le produit exact tombe sur un demi-centime : les deux voisins sont acceptés (l'arrondi du fournisseur est inconnu). */
export const withinRounding = (read: number, expected: number, tolerance = 0.5) => Math.abs(read - expected) <= tolerance + 1e-9;


export function makePoint(code: ScanPointCode, gravite: ScanPoint['gravite'], champ: ScanPoint['champ'], ligne: number | null, rest: {
  regle: string; message: string; unite: ScanPoint['unite']; enjeu: ScanPoint['enjeu']; lu?: number | null; calcule?: number | null; bloque?: boolean;
  origine?: ScanPoint['origine']; champs?: string[]; lignes?: number[]; luTexte?: string; details?: ScanPointDetail[];
}): ScanPoint {
  const lu = rest.lu ?? null, calcule = rest.calcule ?? null;
  return defined({
    code, gravite, origine: rest.origine ?? 'controle', enjeu: rest.enjeu, bloque: rest.bloque ?? false, champ, champs: rest.champs ?? [champ], ligne,
    lignes: rest.lignes, cle: `${code}:${ligne ?? '-'}:${champ}`, regle: rest.regle, lu, calcule, ecart: lu !== null && calcule !== null ? lu - calcule : null,
    unite: rest.unite, luTexte: rest.luTexte, message: rest.message.slice(0, 250), details: rest.details,
  });
}

/** C1 — quantité × prix unitaire = montant de la ligne, au centime. Remise : valeurs absolues. Sans prix, sans quantité ou sans montant :
 * non vérifiable (comptée, jamais un point : un port ou un forfait est normal). Un rapport de 1/100 ou 1/1000 sur une unité de poids ou
 * de volume est un prix par 100 g ou par kg : point inverifiable, jamais un écart. */
export function lineMathCheck(items: Array<Pick<CoreItem, 'id' | 'name' | 'kind' | 'quantity' | 'unit' | 'price' | 'amountTTC'>>): { points: ScanPoint[]; lines: ScanControls['lines'] } {
  const points: ScanPoint[] = [], lines: ScanControls['lines'] = { checked: 0, failed: 0, skipped: 0, skippedIds: [] };
  items.forEach((item, index) => {
    const n = index + 1, amount = toCents(item.amountTTC);
    if (item.quantity === null || item.price === null || item.amountTTC === null || amount === null) {
      lines.skipped++; lines.skippedIds.push(item.id); return;
    }
    const discount = item.kind === 'discount';
    const expected = item.quantity * item.price * 100, read = discount ? Math.abs(amount) : amount, wanted = discount ? Math.abs(expected) : expected;
    if (withinRounding(read, wanted)) { lines.checked++; return; }
    const ratio = wanted > 0 ? read / wanted : NaN;
    // D213 : un prix se lit pour son unité. Quantité en g/ml avec un prix par 100 g ou par kg (rapport 1/100, 1/1000) ; quantité en kg/l
    // avec un prix par 100 g (rapport 10). Un autre rapport (60 lu pour 6 : 1/10) reste un écart.
    const small = /^(g|gr|gramm?e?s?|ml|cl)$/i.test(item.unit.trim()), large = /^(kg|kilos?|l|lt|litres?)$/i.test(item.unit.trim());
    const perLot = (small && [0.01, 0.001].some(factor => Math.abs(ratio / factor - 1) < 0.06)) || (large && Math.abs(ratio / 10 - 1) < 0.06);
    const label = `Ligne ${n} (${item.name.slice(0, 40)})`;
    const cells = [`items.${n}.quantity`, `items.${n}.price`, `items.${n}.amountTTC`];
    if (perLot) {
      lines.skipped++; lines.skippedIds.push(item.id);
      points.push(makePoint('ligne-prix-par-lot', 'inverifiable', 'items', n, {
        regle: 'quantité × prix unitaire = montant de la ligne', unite: 'centimes', enjeu: 'argent', lu: read, calcule: Math.round(wanted), champs: cells,
        message: `${label} : le prix semble donné par 100 g ou par kg (${chf(read)} CHF lu pour ${chf(Math.round(wanted))} CHF au prix affiché) : lignes non vérifiées.`,
      }));
      return;
    }
    lines.checked++; lines.failed++;
    points.push(makePoint('ligne-montant', 'ecart', 'items', n, {
      regle: 'quantité × prix unitaire = montant de la ligne', unite: 'centimes', enjeu: 'argent', lu: read, calcule: Math.round(wanted), champs: cells,
      message: `${label} : quantité × prix = ${chf(Math.round(wanted))} CHF, montant lu ${chf(read)} CHF (lignes à vérifier).`,
    }));
  });
  return { points, lines };
}

/**
 * D381 — les lignes qui expliqueraient SEULES l'écart de la somme (« un item est en trop et point sur le ou les potentiels coupable ? ») : son montant
 * est l'écart (ligne en trop, ou doublée), ou deux fois son montant l'est (signe inversé : une remise lue positive). `ecart` = total − somme, en
 * centimes. Positions (base 1), au plus 5 chacune ; une ligne qui a une jumelle voisine (même désignation, même montant) passe en tête.
 */
export function coupablesDeLEcart(items: Array<{ amountTTC: number | null; name?: string }>, ecart: number): { enTrop: number[]; signe: number[] } {
  const montants = items.map(item => toCents(item.amountTTC));
  const jumelle = (i: number) => [i - 1, i + 1].some(j => montants[j] === montants[i] && (items[j]?.name ?? '').trim() === (items[i]?.name ?? '').trim());
  const ranger = (positions: number[]) => [...positions.filter(n => jumelle(n - 1)), ...positions.filter(n => !jumelle(n - 1))].slice(0, 5);
  const ou = (test: (m: number) => boolean) => ranger(montants.flatMap((m, i) => (m !== null && m !== 0 && test(m) ? [i + 1] : [])));
  return { enTrop: ecart === 0 ? [] : ou(m => m === -ecart), signe: ecart === 0 || ecart % 2 !== 0 ? [] : ou(m => 2 * m === -ecart) };
}
const designer = (items: Array<{ amountTTC: number | null; name?: string }>, positions: number[]) => {
  const noms = positions.slice(0, 3).map(n => { const nom = (items[n - 1]?.name ?? '').trim(); return nom ? `« ${nom.slice(0, 24)} »` : `ligne ${n}`; });
  return positions.length > 3 ? `${noms.join(', ')} et ${positions.length - 3} autre(s)` : noms.join(', ');
};

/** C2 et P2 — somme des lignes = total, au centime. `ok` seulement si rien ne manque : lignes toutes lisibles, aucune perdue. */
export function sumCheck(items: Array<Pick<CoreItem, 'amountTTC'> & { name?: string }>, amountTTC: number | null, amountHT: number | null, linesLost: number): { points: ScanPoint[]; sum: ScanControls['sum'] } {
  const none = { points: [] as ScanPoint[], sum: { statut: 'non-verifiable' as ControlStatus, base: null } };
  const ttc = toCents(amountTTC);
  if (!items.length || ttc === null) return none;
  const missing: number[] = [];
  let sum = 0;
  items.forEach((item, index) => { const cents = toCents(item.amountTTC); if (cents === null) missing.push(index + 1); else sum += cents; });
  if (linesLost > 0) return { points: [], sum: { statut: 'incomplet', base: null } };
  if (missing.length) {
    return {
      points: [makePoint('somme-incomplete', 'inverifiable', 'amountTTC', null, {
        regle: 'somme des lignes = total TTC', unite: 'centimes', enjeu: 'argent', lu: ttc, calcule: sum, lignes: missing, champs: ['amountTTC', ...missing.map(n => `items.${n}.amountTTC`)],
        message: `Total des lignes non vérifiable : ${missing.length} ligne(s) sans montant lisible (lignes ${missing.join(', ')}).`,
      })], sum: { statut: 'incomplet', base: null },
    };
  }
  if (sum === ttc) return { points: [], sum: { statut: 'ok', base: 'TTC' } };
  const ht = toCents(amountHT);
  if (ht !== null && sum === ht) return { points: [], sum: { statut: 'ok', base: 'HT' } };
  const gap = ttc - sum;
  // D261b : un total imprimé multiple de 5 centimes qui est la somme des lignes arrondie au 5 centimes le plus proche (Rundung suisse) n'est pas un écart.
  if (ttc % 5 === 0 && Math.abs(gap) <= 2 && Math.round(sum / 5) * 5 === ttc) return { points: [], sum: { statut: 'ok', base: 'TTC' } };
  const hint = Math.abs(gap) <= 5 ? ' (un arrondi imprimé, Rundung, est-il une ligne omise ?)' : '';
  // D381 : les coupables possibles, nommés et surlignés (`lignes`) ; sans coupable, ce qui manquerait.
  const { enTrop, signe } = Math.abs(gap) <= 5 ? { enTrop: [], signe: [] } : coupablesDeLEcart(items, gap);
  const pistes = [
    ...(enTrop.length ? [`En trop ? ${designer(items, enTrop)} : montant égal à l'écart.`] : []),
    ...(signe.length ? [`Signe inversé ? ${designer(items, signe)}.`] : []),
    ...(!enTrop.length && !signe.length && Math.abs(gap) > 5 ? [gap > 0 ? `Une ligne de ${chf(gap)} CHF manque peut-être.` : `Une remise de ${chf(-gap)} CHF manque peut-être.`] : []),
  ];
  const coupables = [...new Set([...enTrop, ...signe])];
  return {
    points: [makePoint('somme-ecart', 'ecart', 'amountTTC', null, {
      regle: 'somme des lignes = total TTC', unite: 'centimes', enjeu: 'argent', lu: ttc, calcule: sum, bloque: true,
      champs: ['amountTTC', ...items.map((_, i) => `items.${i + 1}.amountTTC`)], ...(coupables.length ? { lignes: coupables } : {}),
      message: `La somme des lignes ne correspond pas au total TTC. Écart ${chf(gap)} CHF (lignes ${chf(sum)}, document ${chf(ttc)})${hint}.${pistes.length ? ` ${pistes.join(' ')}` : ''}`,
    })], sum: { statut: 'ecart', base: 'TTC' },
  };
}

/** C4 — HT + TVA = TTC (2 centimes de tolérance, chacun des trois arrondi séparément). Un HT n'est jamais calculé. Déplacé de `normalizeInvoiceScan` (relecture l2, point 5) pour que le client le refasse avec la même règle. */
export function totalsCheck(amountHT: number | null, tvaAmount: number | null, amountTTC: number | null): { point: ScanPoint | null; totals: { statut: ControlStatus } } {
  const ht = toCents(amountHT), vatCents = toCents(tvaAmount), ttc = toCents(amountTTC);
  if (ht === null || vatCents === null || ttc === null) return { point: null, totals: { statut: 'non-verifiable' } };
  if (Math.abs(ht + vatCents - ttc) <= 2) return { point: null, totals: { statut: 'ok' } };
  return {
    totals: { statut: 'ecart' },
    point: makePoint('ht-tva-ttc', 'ecart', 'amountHT', null, {
      regle: 'HT + TVA = TTC', unite: 'centimes', enjeu: 'info', lu: ttc, calcule: ht + vatCents, champs: ['amountHT', 'tvaAmount', 'amountTTC'],
      message: 'Les totaux HT + TVA ne correspondent pas au TTC du document.',
    }),
  };
}
/** D272 — Un « HT » lu qui est un sous-total TTC. Sur une facture aux prix TVA comprise, la lecture prend parfois le sous-total des articles
 * (avant port) pour le HT : HT + TVA ≠ TTC, et ce montant égale la somme des lignes hors port, elles-mêmes au TTC (leur somme est le TTC).
 * Il n'est alors pas tenu pour lu (l'appelant le met à null) ; un HT n'est jamais calculé. Un HT faux d'une autre forme garde son écart
 * (un HT égal au TTC aussi : le nullifier dans une seule des deux lectures créerait un désaccord qui paie une 3.8). */
export function htEstUnSousTotalTTC(amountHT: number | null, tvaAmount: number | null, amountTTC: number | null, items: Array<Pick<CoreItem, 'kind' | 'amountTTC'>>): boolean {
  const ht = toCents(amountHT), vatCents = toCents(tvaAmount), ttc = toCents(amountTTC);
  if (ht === null || vatCents === null || ttc === null || vatCents <= 0 || Math.abs(ht + vatCents - ttc) <= 2) return false;
  const lignes = items.map(item => ({ kind: item.kind, cents: toCents(item.amountTTC) }));
  if (!lignes.some(l => l.kind === 'shipping') || lignes.some(l => l.cents === null)) return false;
  const somme = lignes.reduce((s, l) => s + l.cents!, 0), horsPort = lignes.filter(l => l.kind !== 'shipping').reduce((s, l) => s + l.cents!, 0);
  return Math.abs(somme - ttc) <= 2 && Math.abs(ht - horsPort) <= 2;
}
/** Le total TTC est absent ou non positif : le point (message identique à la phrase d'`issues` de `normalizeInvoiceScan`). */
export function totalAbsentPoint(amountTTC: number | null): ScanPoint | null {
  if (amountTTC !== null && amountTTC > 0) return null;
  return makePoint('total-absent', 'ecart', 'amountTTC', null, { regle: 'le code relève ce que la lecture ne permet pas de tenir pour sûr', message: 'Total TTC absent ou non positif : à saisir.', unite: 'texte', enjeu: 'argent' });
}
