/**
 * Schéma de sortie du banc (voie k4-harness, variantes Sv et Uv ; rapport « Lecture de factures par vision », § « Changer la forme de la
 * réponse »). Le banc seulement : ce module ne vit jamais dans `functions/`, la production n'en reçoit rien.
 *
 * Ce que le rapport demande, et ce que le schéma fait :
 *   - en tête, la base des prix (HT ou TTC) et les taux de TVA imprimés, avant toute ligne ;
 *   - pour chaque ligne, sa recopie telle qu'imprimée (`printed`) AVANT ses chiffres ;
 *   - une case par date (facture, début et fin de période, échéance) : la période n'est plus une date de facture possible ;
 *   - la TVA taux par taux (taux, net, TVA, brut) à la place des totaux HT et TVA ;
 *   - la devise dans une liste fermée ;
 *   - l'ordre des clés imposé (`propertyOrdering`) : le modèle écrit dans l'ordre de lecture.
 * Un convertisseur (`svToProduction`) rend le format de production : le vote, les contrôles et le jugement ne voient pas la différence.
 *
 * Aucune valeur d'un document ici : des noms de champs et des consignes de lecture génériques (L20).
 */

const str = (description?: string) => ({ type: 'STRING', ...(description ? { description } : {}) });
const num = (description?: string) => ({ type: 'NUMBER', nullable: true, ...(description ? { description } : {}) });
const obj = (properties: Record<string, unknown>, order: string[], required: string[] = order) =>
  ({ type: 'OBJECT', properties, propertyOrdering: order, required });

/** Le plafond de lignes du schéma du banc : la production plafonne à 35 (SCAN_MAX_ITEMS), un document en imprime davantage. */
export const SV_MAX_ITEMS = 80;
/** Le plafond annoncé au modèle dans la consigne système de Sv : 35 devient 80. */
export const svSystem = (system: string) => system.split('Maximum 35 lignes').join(`Maximum ${SV_MAX_ITEMS} lignes`).split('que 35 ;').join(`que ${SV_MAX_ITEMS} ;`);

/** Les devises que le modèle peut nommer ; « autre » = une devise hors liste, « inconnue » = aucune devise imprimée. */
export const SV_CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP', 'autre', 'inconnue'] as const;
const ISO_CURRENCIES: readonly string[] = ['CHF', 'EUR', 'USD', 'GBP'];
export const SV_PRICE_BASES = ['HT', 'TTC', 'inconnue'] as const;

const ITEM_ORDER = ['printed', 'name', 'kind', 'reference', 'variant', 'quantity', 'unit', 'price', 'amountTTC', 'vatCode', 'stockCategory', 'alphaPct', 'evidence', 'ambiguity'];
const VAT_ORDER = ['code', 'rate', 'net', 'tva', 'brut'];
const WARNING_ORDER = ['field', 'message'];
export const SV_TOP_ORDER = ['priceBase', 'vatRatesPrinted', 'vendor', 'documentType', 'paymentEvidence', 'proForma', 'invoiceDate', 'periodStart', 'periodEnd', 'dueDate',
  'currency', 'invoiceNumber', 'orderNumber', 'printedLineCount', 'items', 'vat', 'amountTTC', 'category', 'subcategory', 'description', 'fieldWarnings'];

export const SV_SCHEMA: Record<string, any> = obj({
  priceBase: { type: 'STRING', enum: [...SV_PRICE_BASES], description: 'Les prix des lignes sont imprimés hors taxe (HT) ou toutes taxes comprises (TTC) ; inconnue si le document ne le dit pas.' },
  vatRatesPrinted: { type: 'ARRAY', items: { type: 'NUMBER' }, description: 'Chaque taux de TVA imprimé sur le document, en fraction (8,1 % = 0.081), sans doublon ; [] s’il n’y en a pas.' },
  vendor: str(),
  documentType: { type: 'STRING', enum: ['invoice', 'receipt', 'delivery_note', 'quote', 'credit_note', 'other'] },
  paymentEvidence: { type: 'STRING', enum: ['paid', 'unpaid', 'unknown'] },
  proForma: { type: 'BOOLEAN' },
  invoiceDate: str('Date d’émission du document, JJ.MM.AAAA ; "" si aucune date d’émission n’est imprimée. Jamais une date de période ni d’échéance.'),
  periodStart: str('Début de la période facturée (JJ.MM.AAAA) ; "" s’il n’y en a pas.'),
  periodEnd: str('Fin de la période facturée (JJ.MM.AAAA) ; "" s’il n’y en a pas.'),
  dueDate: str('Date d’échéance du paiement (JJ.MM.AAAA) ; "" s’il n’y en a pas.'),
  currency: { type: 'STRING', enum: [...SV_CURRENCIES], description: 'Devise imprimée ; autre si elle n’est pas dans la liste, inconnue si aucune n’est imprimée.' },
  invoiceNumber: str(),
  orderNumber: str(),
  printedLineCount: { type: 'INTEGER', nullable: true, description: 'Nombre de lignes d’articles imprimées (ni totaux ni TVA) ; null si pas clair.' },
  // Pas de `maxItems` : Gemini 3.5 Flash-Lite refuse la requête entière (HTTP 400, sonde du 01.11) ; le plafond vit dans la description.
  items: { type: 'ARRAY', description:`Toutes les lignes imprimées, au plus ${SV_MAX_ITEMS}.`, items: obj({
    printed: str('La ligne recopiée telle qu’imprimée, cellule après cellule, AVANT d’en tirer les chiffres.'),
    name: str(), kind: { type: 'STRING', enum: ['equipment', 'maintenance', 'stock', 'service', 'packaging', 'shipping', 'discount', 'other', 'unknown'] },
    reference: str(), variant: str(), quantity: num(), unit: str(), price: num(), amountTTC: num(), vatCode: str(), stockCategory: str(), alphaPct: num(), evidence: str(), ambiguity: str()
  }, ITEM_ORDER, ITEM_ORDER.filter(key => key !== 'stockCategory')) },
  vat: { type: 'ARRAY', description: 'La TVA imprimée taux par taux ; [] s’il n’y a pas de récapitulatif.', items: obj({ code: str(), rate: num(), net: num('Montant hors taxe de ce taux'), tva: num('Montant de TVA de ce taux'), brut: num('Montant toutes taxes comprises de ce taux') }, VAT_ORDER) },
  amountTTC: num(),
  category: { type: 'STRING', enum: ['brassage', 'materiel', 'nettoyage', 'chargesFixes', 'renovation', 'divers'] },
  subcategory: str(), description: str(),
  fieldWarnings: { type: 'ARRAY', items: obj({ field: { type: 'STRING', enum: ['vendor', 'date', 'currency', 'invoiceNumber', 'amountHT', 'amountTTC', 'tvaRate', 'tvaAmount', 'category', 'items', 'documentType', 'paymentEvidence'] }, message: str() }, WARNING_ORDER) }
}, SV_TOP_ORDER, SV_TOP_ORDER.filter(key => !['subcategory'].includes(key)));

/** Le nombre de champs d'un schéma (toutes les clés `properties`, à tout niveau) : le plafond « production + 8 » se compte ici. */
export function countSchemaFields(schema: any): number {
  if (!schema || typeof schema !== 'object') return 0;
  let count = 0;
  if (schema.properties && typeof schema.properties === 'object') for (const child of Object.values(schema.properties)) count += 1 + countSchemaFields(child);
  if (schema.items) count += countSchemaFields(schema.items);
  return count;
}

// ---------------------------------------------------------------------------------------------------------------------
// Convertisseur : réponse au schéma du banc → réponse au format de production
// ---------------------------------------------------------------------------------------------------------------------
const numberOrNull = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const round2 = (value: number) => Math.round(value * 100) / 100;
const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Somme d'un champ sur toutes les rangées de TVA ; une rangée sans ce champ rend la somme inconnue (null), jamais une somme partielle. */
function sumRows(rows: any[], key: string): number | null {
  if (!rows.length) return null;
  let total = 0;
  for (const row of rows) { const value = numberOrNull(row?.[key]); if (value === null) return null; total += value; }
  return round2(total);
}

export function svToProduction(raw: any): any {
  const rows: any[] = Array.isArray(raw?.vat) ? raw.vat : [];
  const priceBase = raw?.priceBase;
  const baseOf = (row: any) => (priceBase === 'TTC' ? numberOrNull(row?.brut) : priceBase === 'HT' ? numberOrNull(row?.net) : numberOrNull(row?.net) ?? numberOrNull(row?.brut));
  const rates = rows.map(row => numberOrNull(row?.rate));
  const printedRates = [...new Set((Array.isArray(raw?.vatRatesPrinted) ? raw.vatRatesPrinted : []).map(numberOrNull).filter((rate: number | null): rate is number => rate !== null))] as number[];
  let tvaRate: number | null = null;
  if (rows.length && rates.every(rate => rate !== null) && new Set(rates).size === 1) tvaRate = rates[0];
  else if (!rows.length && printedRates.length === 1) tvaRate = printedRates[0];
  const { priceBase: _p, vatRatesPrinted: _v, invoiceDate, periodStart: _s, periodEnd: _e, dueDate: _d, vat: _vat, ...rest } = raw ?? {};
  return {
    ...rest,
    date: text(invoiceDate),
    currency: ISO_CURRENCIES.includes(raw?.currency) ? raw.currency : '',
    amountHT: sumRows(rows, 'net'),
    tvaAmount: sumRows(rows, 'tva'),
    tvaRate,
    vat: rows.map(row => ({ code: text(row?.code), rate: numberOrNull(row?.rate), base: baseOf(row), amount: numberOrNull(row?.tva) })),
    items: Array.isArray(raw?.items) ? raw.items.map((item: any) => { const { printed: _printed, ...line } = item ?? {}; return line; }) : raw?.items
  };
}

/** Pour la simulation seulement : la réponse qu'un modèle docile ferait au schéma du banc, tirée d'une réponse au format de production. */
export function productionToSv(raw: any): any {
  const { date, amountHT, tvaAmount, tvaRate, vat, currency, items, ...rest } = raw;
  const rows: any[] = Array.isArray(vat) && vat.length ? vat.map((row: any) => ({ code: row.code ?? '', rate: row.rate ?? null, net: row.base ?? null, tva: row.amount ?? null, brut: null }))
    : amountHT !== null && amountHT !== undefined || tvaAmount !== null && tvaAmount !== undefined || tvaRate !== null && tvaRate !== undefined
      ? [{ code: '', rate: tvaRate ?? null, net: amountHT ?? null, tva: tvaAmount ?? null, brut: raw.amountTTC ?? null }] : [];
  return {
    priceBase: 'inconnue', vatRatesPrinted: [...new Set(rows.map(row => row.rate).filter((rate: unknown) => typeof rate === 'number'))],
    ...rest, invoiceDate: date ?? '', periodStart: '', periodEnd: '', dueDate: '',
    currency: ISO_CURRENCIES.includes(currency) ? currency : currency ? 'autre' : 'inconnue',
    items: (items ?? []).map((item: any) => ({ printed: [item.name, item.quantity, item.unit, item.price, item.amountTTC].filter(part => part !== null && part !== undefined && part !== '').join(' '), ...item })),
    vat: rows
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Validation d'un JSON lu dans le texte (option --av-sans-schema) par le même schéma
// ---------------------------------------------------------------------------------------------------------------------
/** Les écarts d'une valeur à un schéma Gemini (OBJECT, ARRAY, STRING, NUMBER, INTEGER, BOOLEAN, enum, nullable, required) ; [] = conforme. */
export function schemaProblems(value: unknown, schema: any, at = '$'): string[] {
  if (value === null) return schema?.nullable ? [] : [`${at} : null refusé`];
  const type = schema?.type;
  const problems: string[] = [];
  if (type === 'OBJECT') {
    if (typeof value !== 'object' || Array.isArray(value)) return [`${at} : objet attendu`];
    for (const key of schema.required ?? []) if (!(key in (value as any))) problems.push(`${at}.${key} : absent`);
    for (const [key, child] of Object.entries(schema.properties ?? {})) if (key in (value as any)) problems.push(...schemaProblems((value as any)[key], child, `${at}.${key}`));
  } else if (type === 'ARRAY') {
    if (!Array.isArray(value)) return [`${at} : tableau attendu`];
    value.forEach((entry, index) => problems.push(...schemaProblems(entry, schema.items, `${at}.${index}`)));
  } else if (type === 'STRING') {
    if (typeof value !== 'string') problems.push(`${at} : texte attendu`);
    else if (schema.enum && !schema.enum.includes(value)) problems.push(`${at} : hors liste`);
  } else if (type === 'NUMBER') { if (typeof value !== 'number' || !Number.isFinite(value)) problems.push(`${at} : nombre attendu`); }
  else if (type === 'INTEGER') { if (!Number.isInteger(value)) problems.push(`${at} : entier attendu`); }
  else if (type === 'BOOLEAN') { if (typeof value !== 'boolean') problems.push(`${at} : booléen attendu`); }
  return problems;
}
