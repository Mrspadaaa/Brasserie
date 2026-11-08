/**
 * Ajouts non signalés (voie k7-ajouts, 08.11) — l'inverse du faux vert.
 *
 * Sa question (08.11) : « est-ce que il y a l'inverse, des données présente qui devrait pas l'être et qui sont pas flaggé comme telle ».
 * Le juge du banc (`banc-lecture-facture-juger.ts`) compte les valeurs fausses et les valeurs manquantes ; il ne regardait pas une valeur
 * RENDUE alors que la vérité dit qu'elle n'est pas sur le document. Trois cas :
 *   1. champ d'en-tête non vide quand la vérité est vide ou null (date, n° de facture, n° de commande, HT, TVA, taux, TTC,
 *      devise ; paiement « paid » ou « unpaid » quand la vérité ne l'admet pas) ;
 *   2. ligne en plus de la vérité ;
 *   3. valeur de ligne (quantité, prix, montant) quand la vérité dit null.
 * Une absence n'est jamais un ajout : un champ vide ou null du résultat ne compte pas, et l'inconnu n'est jamais 0.
 *
 * « SIGNALÉ » = ce que le brasseur voit sur l'écran Dépense (`ExpenseSheet.tsx`, r2b) : la case est en doute (jaune ou rouge) si un point qui
 * PÈSE (`peserPoint` : `pese` du point, sinon la table) la vise. La règle est celle de l'écran, pas une copie : `ciblesDuPoint` et la table
 * `TABLE_POINTS` viennent de `src/ui/depense/confiance.ts` ; les points sont ceux que l'écran recalcule (`recomputeInvoicePoints`, comme
 * `recalculerLecture`). Un point « désaccord » dont `pese` est faux (une majorité a tranché) ne signale rien : l'écran ne le montre pas.
 *   - en-tête : la case de l'écran (`date`, `numero`, `tva`, `total`, `fournisseur`, `document`) est visée par un point de l'en-tête
 *     (`ligne` nulle, ou `lignes-non-rapprochees`) ; la case « numéro » porte le n° de facture ET celui de commande, la case « TVA » porte
 *     HT, TVA et taux, la case « total » porte le TTC et la devise, la case « document » porte le paiement. Un `fieldWarnings` du même champ,
 *     ou une valeur rejetée (`rejets`) du même champ, signalent aussi (l'écran en tire un indice de champ) ;
 *   - ligne en plus : un point qui pèse la vise (`ligne` = son rang, ou son rang dans `lignes` pour l'écart de somme et la jonction
 *     des lectures), ou la lecture la dit ambiguë (`ambiguity`, qui pose un point `ambiguite-ligne`) ;
 *   - valeur de ligne : un point qui pèse vise cette case (quantité, prix, montant) de cette ligne.
 * Mesure double : `signalee` = la règle de l'écran (la case) ; `precise` = un point qui nomme CE champ (`champ` ou `champs`), plus étroit.
 * Un ajout « non signalé » est celui que le brasseur ne voit pas en doute : il est dans la dépense comme une lecture sûre.
 *
 * Le tableau publiable ne contient AUCUNE valeur des documents : des comptes et des noms de champs. Les valeurs vont dans un fichier
 * privé (hors Git, dans le dossier de la sortie du banc).
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-ajouts.ts -- --ajouts=<sortie>[,<autre>…] [--cas=cas.json,cas-2.json…] [--out=<fichier.md>] [--prive=<fichier.json>]
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-ajouts.ts -- --qr-pièce=doc1     (ce que le QR-facture de la pièce porte : champs et valeurs, sur la console seulement)
 * (la forme `--clé=valeur` : le jugement importé ne prend jamais un argument nu pour un dossier de banc.)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ligneDepuisId, type ScanPoint } from '../functions/src/invoiceControls';
import { peserPoint, recomputeInvoicePoints } from '../src/domain/finance/invoicePoints';
import { ciblesDuPoint, totalCorrobore, type Cible } from '../src/ui/depense/confiance';
import { CAS_FILES, casPath, loadCases, orderVariants, type BenchCase, type DrawRecord } from './banc-lecture-facture';
import { canon, lignesSansPort, shortLabel, variantIds } from './banc-lecture-facture-juger';

// ---------------------------------------------------------------------------------------------------------------------
// Les champs
// ---------------------------------------------------------------------------------------------------------------------
export type GenreAjout = 'entete' | 'ligne' | 'valeur-ligne';
export const CHAMPS_ENTETE = ['date', 'invoiceNumber', 'orderNumber', 'amountHT', 'tvaAmount', 'tvaRate', 'amountTTC', 'currency', 'paymentEvidence'] as const;
/** Le fournisseur n'y est pas : une vérité vide pour `vendor` veut dire « non jugé » dans le juge (nom du fournisseur non retenu), pas « absent du document ». */
export type ChampEnteteAjout = typeof CHAMPS_ENTETE[number];
/** La case de l'écran qui montre ce champ d'en-tête (`CHAMP_ENTETE_DE` de confiance.ts : la table de l'écran, recopiée ici car non exportée). */
export const CASE_DE_ENTETE: Record<ChampEnteteAjout, string> = {
  date: 'date', invoiceNumber: 'numero', orderNumber: 'numero', amountTTC: 'total', currency: 'total',
  amountHT: 'tva', tvaAmount: 'tva', tvaRate: 'tva', paymentEvidence: 'document',
};
export const CHAMPS_VALEUR_LIGNE = ['quantity', 'price', 'amountTTC'] as const;
export type ChampValeurLigne = typeof CHAMPS_VALEUR_LIGNE[number];
const CASE_DE_LIGNE: Record<ChampValeurLigne, string> = { quantity: 'quantite', price: 'prix', amountTTC: 'montant' };

export interface Ajout {
  genre: GenreAjout;
  /** `date`, `invoiceNumber`…, `items.3.quantity` (ligne 4, position), `items.5` (une ligne en plus). */
  champ: string;
  /** Rang du point (`line-N`) de la ligne concernée. */
  rang?: number;
  /** La règle de l'écran : la case est en doute. */
  signalee: boolean;
  /** Plus étroit : un point nomme ce champ lui-même. */
  precise: boolean;
  /** Pour une ligne en trop : le doute porte seulement sur la liste (un chip « Lignes »), pas sur la ligne. Information, jamais comptée. */
  listeSignalee?: boolean;
  /** D'où vient le signal (codes de point, `fieldWarnings`, `rejets`, `ambiguity`) : des noms, jamais de valeurs. */
  via: string[];
  /** PRIVÉ : la valeur rendue. Jamais dans le tableau publiable. */
  valeur: unknown;
}

// ---------------------------------------------------------------------------------------------------------------------
// Ce que l'écran verrait en doute
// ---------------------------------------------------------------------------------------------------------------------
const nombre = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const vide = (value: unknown) => value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
const alternatives = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]);

/** Les points que l'écran tient après son recalcul (`recalculerLecture`) ; une lecture sans `points` (ancien format) n'en a pas. */
export function pointsDeLEcran(result: any): ScanPoint[] {
  if (!Array.isArray(result?.points)) return [];
  const items: any[] = Array.isArray(result.items) ? result.items : [];
  try {
    return recomputeInvoicePoints({
      items: items.map((item, index) => ({ id: item.id ?? `line-${index + 1}`, name: item.name ?? '', kind: item.kind ?? 'stock', quantity: nombre(item.quantity), unit: item.unit ?? '', price: nombre(item.price), amountTTC: nombre(item.amountTTC) })),
      amountTTC: nombre(result.amountTTC), amountHT: nombre(result.amountHT), tvaAmount: nombre(result.tvaAmount),
      linesLost: result.linesLost, points: result.points, controls: result.controls, review: result.review,
    }).points;
  } catch {
    return result.points;
  }
}

/** Le total des lignes tombe-t-il sur le total imprimé ? (la même question que l'écran : un montant corroboré n'est pas douteux.) */
function corrobore(result: any): boolean {
  const items: any[] = Array.isArray(result?.items) ? result.items : [];
  return totalCorrobore({ lignes: items.map((item, index) => ({ id: item.id ?? `line-${index + 1}`, description: item.name ?? '', amount: nombre(item.amountTTC) })), total: nombre(result?.amountTTC) });
}

const ENTETE_PRECIS: Record<ChampEnteteAjout, readonly string[]> = {
  date: ['date'], invoiceNumber: ['invoiceNumber'], orderNumber: ['orderNumber'], amountHT: ['amountHT'], tvaAmount: ['tvaAmount', 'vat'], tvaRate: ['tvaRate', 'vat'],
  amountTTC: ['amountTTC'], currency: ['currency'], paymentEvidence: ['paymentEvidence', 'proForma'],
};

interface Signaux {
  points: ScanPoint[];
  /** Cases d'en-tête en doute, avec les codes qui les visent. */
  entete: Map<string, string[]>;
  /** Points de l'en-tête qui pèsent. */
  pointsEntete: ScanPoint[];
  warnings: Set<string>;
  rejets: Set<string>;
  /** Par rang de ligne : cases en doute (`quantite`, `prix`, `montant`, `ligne` = n'importe quelle case) avec les codes. */
  lignes: Map<number, Map<string, string[]>>;
  /** Cases de la liste (chip « Lignes ») en doute. */
  liste: string[];
  ambigues: Set<number>;
}
const empile = (map: Map<string, string[]>, key: string, code: string) => map.set(key, [...(map.get(key) ?? []), code]);

/** Les lignes que visent l'écart de somme et la jonction des lectures (`SUR_LES_LIGNES` de confiance.ts) en plus de leur propre `ligne`. */
const CODES_SUR_LES_LIGNES: ReadonlySet<string> = new Set(['somme-ecart', 'lignes-non-rapprochees']);

export function signauxDe(result: any): Signaux {
  const points = pointsDeLEcran(result), corroboree = corrobore(result);
  const s: Signaux = { points, entete: new Map(), pointsEntete: [], warnings: new Set(), rejets: new Set(), lignes: new Map(), liste: [], ambigues: new Set() };
  for (const p of points) {
    if (!peserPoint(p)) continue;
    const cibles: Cible[] = ciblesDuPoint(p, corroboree).filter(cible => cible.niveau !== 'sur');
    if (!cibles.length) continue;
    if (p.ligne === null || p.ligne === undefined || p.code === 'lignes-non-rapprochees') {
      s.pointsEntete.push(p);
      for (const cible of cibles) { empile(s.entete, cible.champ, p.code); if (cible.champ === 'lignes') s.liste.push(p.code); }
    }
    if (p.ligne !== null && p.ligne !== undefined) {
      const par = s.lignes.get(p.ligne) ?? new Map<string, string[]>();
      s.lignes.set(p.ligne, par);
      for (const cible of cibles) { empile(par, cible.champ, p.code); empile(par, 'ligne', p.code); }
    }
    if (CODES_SUR_LES_LIGNES.has(p.code)) for (const rang of p.lignes ?? []) {
      const par = s.lignes.get(rang) ?? new Map<string, string[]>();
      s.lignes.set(rang, par);
      empile(par, 'ligne', p.code);
      if (p.code === 'somme-ecart') empile(par, 'montant', p.code);
    }
  }
  for (const w of Array.isArray(result?.fieldWarnings) ? result.fieldWarnings : []) if (typeof w?.field === 'string') s.warnings.add(w.field);
  for (const r of Array.isArray(result?.rejets) ? result.rejets : []) if (typeof r?.champ === 'string' && (r.ligne === null || r.ligne === undefined)) s.rejets.add(r.champ);
  (Array.isArray(result?.items) ? result.items : []).forEach((item: any, index: number) => { if (typeof item?.ambiguity === 'string' && item.ambiguity.trim()) s.ambigues.add(ligneDepuisId(item.id ?? '') ?? index + 1); });
  return s;
}

function signalEntete(s: Signaux, champ: ChampEnteteAjout): { signalee: boolean; precise: boolean; via: string[] } {
  const via: string[] = [...(s.entete.get(CASE_DE_ENTETE[champ]) ?? [])];
  const precis = s.pointsEntete.filter(p => ENTETE_PRECIS[champ].includes(p.champ) || (p.champs ?? []).some(c => ENTETE_PRECIS[champ].includes(c)));
  const avertie = s.warnings.has(champ), rejetee = s.rejets.has(champ);
  if (avertie) via.push('fieldWarnings');
  if (rejetee) via.push('rejets');
  return { signalee: via.length > 0, precise: precis.length > 0 || avertie || rejetee, via: [...new Set(via)] };
}

// ---------------------------------------------------------------------------------------------------------------------
// Les trois mesures
// ---------------------------------------------------------------------------------------------------------------------
/** Les lignes du résultat qui n'ont pas de vis-à-vis dans la vérité, en nombre égal à l'excédent : on apparie dans l'ordre par nom (inclusion, insensible à la casse et aux accents) ; les restantes, les dernières d'abord. */
export function lignesEnTrop(items: any[], attendues: any[]): number[] {
  const excedent = items.length - attendues.length;
  if (excedent <= 0) return [];
  const pris = new Set<number>();
  for (const attendue of attendues) {
    if (typeof attendue?.name !== 'string' || !canon(attendue.name)) continue;
    const trouve = items.findIndex((item, index) => !pris.has(index) && canon(item?.name).includes(canon(attendue.name)));
    if (trouve >= 0) pris.add(trouve);
  }
  const libres = items.map((_, index) => index).filter(index => !pris.has(index));
  return libres.slice(Math.max(0, libres.length - excedent));
}

/**
 * Les ajouts d'une lecture finale contre la vérité, signalés ou non. Seul ce que la vérité JUGE est mesuré (une clé absente de `expected` n'est pas jugée).
 * `expected.items` : les lignes visibles sur aucune capture (`invisible: true`) existent dans la vérité, les lire n'est pas un ajout ; le port n'est pas une ligne (D249), des deux côtés.
 */
export function mesurerAjouts(result: any, expected: Record<string, any>): Ajout[] {
  if (!result) return [];
  const s = signauxDe(result), out: Ajout[] = [];
  const has = (key: string) => Object.prototype.hasOwnProperty.call(expected, key);

  // 1. En-tête
  for (const champ of CHAMPS_ENTETE) {
    if (!has(champ)) continue;
    let ajoute = false;
    const lu = result[champ];
    if (champ === 'paymentEvidence') {
      // « paid » ou « unpaid » affirmés sans que la vérité les admette ; « unknown » est prudent (le juge ne le compte jamais faux).
      const admis = alternatives(expected.paymentEvidence);
      ajoute = (lu === 'paid' || lu === 'unpaid') && !admis.includes(lu);
    } else if (['amountHT', 'tvaAmount', 'tvaRate', 'amountTTC'].includes(champ)) ajoute = nombre(lu) !== null && alternatives(expected[champ]).every(vide);
    else ajoute = !vide(lu) && alternatives(expected[champ]).every(vide);
    if (!ajoute) continue;
    out.push({ genre: 'entete', champ, ...signalEntete(s, champ), valeur: lu });
  }

  // 2 et 3. Lignes
  if (!Array.isArray(expected.items)) return out;
  const brutes: any[] = Array.isArray(result.items) ? result.items : [];
  const rangDe = (item: any) => ligneDepuisId(item?.id ?? '') ?? brutes.indexOf(item) + 1;
  const items = lignesSansPort(brutes), attendues = lignesSansPort(expected.items);
  const signalLigne = (rang: number, cases: string[]) => {
    const par = s.lignes.get(rang), via = cases.flatMap(c => par?.get(c) ?? []);
    if (cases.includes('ligne') && s.ambigues.has(rang)) via.push('ambiguity');
    return [...new Set(via)];
  };
  for (const index of lignesEnTrop(items, attendues)) {
    const rang = rangDe(items[index]), via = signalLigne(rang, ['ligne']);
    out.push({ genre: 'ligne', champ: `items.${index}`, rang, signalee: via.length > 0, precise: via.length > 0, listeSignalee: s.liste.length > 0, via, valeur: items[index]?.name });
  }
  // Valeur de ligne : l'alignement est celui du juge (position, lignes invisibles écartées).
  const jugees = attendues.filter((line: any) => line?.invisible !== true);
  jugees.forEach((vraie: any, index: number) => {
    const lue = items[index];
    if (!lue) return;
    for (const champ of CHAMPS_VALEUR_LIGNE) {
      if (!Object.prototype.hasOwnProperty.call(vraie, champ) || !alternatives(vraie[champ]).every(vide) || nombre(lue[champ]) === null) continue;
      const rang = rangDe(lue), via = signalLigne(rang, [CASE_DE_LIGNE[champ]]);
      const precis = s.points.some(p => peserPoint(p) && p.ligne === rang && (p.champs ?? []).includes(`items.${rang}.${champ}`));
      out.push({ genre: 'valeur-ligne', champ: `items.${index}.${champ}`, rang, signalee: via.length > 0, precise: precis, via, valeur: lue[champ] });
    }
  });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Le banc : par variante, par pièce, par champ
// ---------------------------------------------------------------------------------------------------------------------
export interface AjoutsTirage { doc: string; tirage: number; variant: string; status: string | null; ajouts: Ajout[] }
export function ajoutsDuBanc(records: DrawRecord[], cases: BenchCase[]): AjoutsTirage[] {
  const byId = new Map(cases.map(c => [c.id, c]));
  const out: AjoutsTirage[] = [];
  for (const record of records) {
    const expected = byId.get(record.doc)?.expected;
    if (!expected) throw new Error(`Cas inconnu : ${record.doc}.`);
    for (const variant of orderVariants(Object.keys(record.variants))) {
      const run = record.variants[variant];
      if (!run.result) continue;
      out.push({ doc: record.doc, tirage: record.tirage, variant, status: run.result.review?.status ?? 'inconnu', ajouts: mesurerAjouts(run.result, expected) });
    }
  }
  return out;
}

export interface CompteAjouts { tirages: number; ajouts: number; nonSignales: number; nonSignalesPrecis: number; sousVert: number; parGenre: Record<GenreAjout, [number, number]> }
export function compterAjouts(tirages: readonly AjoutsTirage[]): Record<string, CompteAjouts> {
  const out: Record<string, CompteAjouts> = {};
  for (const t of tirages) {
    const c = out[t.variant] ??= { tirages: 0, ajouts: 0, nonSignales: 0, nonSignalesPrecis: 0, sousVert: 0, parGenre: { entete: [0, 0], ligne: [0, 0], 'valeur-ligne': [0, 0] } };
    c.tirages++;
    for (const a of t.ajouts) {
      c.ajouts++; c.parGenre[a.genre][0]++;
      if (!a.signalee) { c.nonSignales++; c.parGenre[a.genre][1]++; if (t.status === 'checked') c.sousVert++; }
      if (!a.precise) c.nonSignalesPrecis++;
    }
  }
  return out;
}
/** `doc : champ` regroupés (les lignes d'un même champ s'additionnent), pour les non signalés, sans valeur. */
const nomDeChamp = (a: Ajout) => (a.genre === 'entete' ? a.champ : a.genre === 'ligne' ? 'ligne en plus' : `ligne : ${a.champ.split('.')[2]}`);

export function renderAjouts(tirages: readonly AjoutsTirage[], sources: string[]): string {
  const ids = orderVariants(new Set(tirages.map(t => t.variant)));
  const compte = compterAjouts(tirages);
  const lines = ['# Ajouts non signalés — l’inverse du faux vert', '',
    `Sorties rejouées sans aucun appel : ${sources.join(', ')}. Aucune valeur des documents ici : des comptes et des noms de champs.`,
    'Un ajout est une valeur rendue alors que la vérité dit qu’elle n’est pas sur le document (en-tête non vide, ligne en plus, quantité / prix / montant de ligne là où la vérité dit null). « Signalé » = la case est en doute sur l’écran Dépense (un point qui pèse la vise ; règle de `confiance.ts`). Une absence n’est jamais un ajout.', '',
    `| | ${ids.map(shortLabel).join(' | ')} |`, `|---|${ids.map(() => '---').join('|')}|`];
  const L = (label: string, pick: (c: CompteAjouts) => string) => lines.push(`| ${label} | ${ids.map(id => (compte[id] ? pick(compte[id]) : '—')).join(' | ')} |`);
  L('Parcours lus', c => String(c.tirages));
  L('Ajouts (valeurs rendues que la vérité n’a pas)', c => String(c.ajouts));
  L('**Ajouts NON signalés** (case non en doute)', c => `**${c.nonSignales}**`);
  L('… dont sous un statut « vérifié »', c => String(c.sousVert));
  L('Ajouts non signalés, mesure étroite (aucun point ne nomme ce champ)', c => String(c.nonSignalesPrecis));
  L('En-tête : ajouts / non signalés', c => `${c.parGenre.entete[0]} / ${c.parGenre.entete[1]}`);
  L('Lignes en plus : ajouts / non signalés', c => `${c.parGenre.ligne[0]} / ${c.parGenre.ligne[1]}`);
  L('Valeurs de ligne : ajouts / non signalés', c => `${c.parGenre['valeur-ligne'][0]} / ${c.parGenre['valeur-ligne'][1]}`);
  lines.push('', '## Par pièce et par champ (nom du champ seulement ; S = signalé, N = non signalé, N* = non signalé même sur la mesure étroite)', '');
  for (const id of ids) {
    lines.push(`### ${shortLabel(id)}`);
    const rows = tirages.filter(t => t.variant === id && t.ajouts.length).map(t => `- ${t.doc}${t.tirage > 1 ? ` (tirage ${t.tirage})` : ''} [${t.status}] : ${t.ajouts.map(a => `${nomDeChamp(a)} ${a.signalee ? 'S' : a.precise ? 'N' : 'N*'}`).join(', ')}`);
    lines.push(...(rows.length ? rows : ['- aucun ajout']), '');
  }
  lines.push('## Lecture honnête', '',
    '- Peu de pièces (16 vérités, 14 lues à ce jour) : un compte est un indice, pas une mesure ; un seul document peut porter plusieurs ajouts du même genre.',
    '- Une ligne en plus est repérée par nom (appariement dans l’ordre) puis, à défaut, par la queue de la liste ; deux lignes lues pour une seule peuvent être confondues avec une dérive de l’ordre.',
    '- « Non signalé » dit seulement que l’écran ne met pas la case en doute ; l’ajout peut être vrai (la vérité à corriger, voir la ligne du rapport de la voie), ce que ce tableau ne tranche pas.', '');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------------------------------
// Ligne de commande
// ---------------------------------------------------------------------------------------------------------------------
async function qrDeLaPiece(id: string, casNames: string[] | undefined) {
  const { zxingSource, qrOfTexts } = await import('./banc-lecture-qr');
  const cases = loadCases(casNames ? casNames.map(casPath) : CAS_FILES).filter(c => c.id === id);
  if (!cases.length) throw new Error(`Pièce inconnue : ${id}.`);
  const texts = await zxingSource()(cases[0]);
  const qrs = qrOfTexts(texts);
  console.log(`${id} : ${texts.length} texte(s) QR lus, ${qrs.length} QR-facture(s) suisse(s).`);
  for (const [i, qr] of qrs.entries()) {
    console.log(`QR ${i + 1} : valide=${qr.valid} problemes=${JSON.stringify(qr.problemes)} montant=${qr.montant} devise=${qr.devise}`);
    console.log(`  infosFacturation (brut) = ${JSON.stringify(qr.infosFacturation)}`);
    console.log(`  S1 = ${qr.s1 ? JSON.stringify({ numero: qr.s1.numero, date: qr.s1.date, prestation: qr.s1.prestation, tva: qr.s1.tva, tva33: qr.s1.tva33, conditions: qr.s1.conditions, inconnus: qr.s1.inconnus }) : 'aucun'}`);
  }
}

async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--');
  const value = (flag: string) => args.find(arg => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);
  const casNames = value('--cas')?.split(',').map(item => item.trim()).filter(Boolean);
  const piece = value('--qr-pièce');
  if (piece) { await qrDeLaPiece(piece, casNames); return; }
  const dirs = (value('--ajouts') ?? '').split(',').map(item => item.trim()).filter(Boolean).map(item => path.resolve(item));
  if (!dirs.length) throw new Error('--ajouts=<sortie du banc>[,<autre>] manquant.');
  const cases = loadCases(casNames ? casNames.map(casPath) : ['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json', 'cas-5.json', 'cas-6.json'].map(casPath).filter(file => existsSync(file)));
  const tables: string[] = [], prive: Record<string, unknown> = {};
  for (const dir of dirs) {
    const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { records: DrawRecord[] };
    const records = file.records.filter(record => cases.some(c => c.id === record.doc));
    const tirages = ajoutsDuBanc(records, cases);
    tables.push(`## ${path.basename(dir)}\n\n${renderAjouts(tirages, [path.basename(dir)]).split('\n').slice(2).join('\n')}`);
    prive[path.basename(dir)] = tirages.filter(t => t.ajouts.length).map(t => ({ doc: t.doc, tirage: t.tirage, variant: t.variant, status: t.status, ajouts: t.ajouts }));
    const compte = compterAjouts(tirages);
    for (const id of variantIds(records)) if (compte[id]) console.log(`${path.basename(dir)} ${shortLabel(id)} : ajouts ${compte[id].ajouts}, non signalés ${compte[id].nonSignales} (sous « vérifié » ${compte[id].sousVert}, étroit ${compte[id].nonSignalesPrecis}), en-tête ${compte[id].parGenre.entete.join('/')}, lignes en plus ${compte[id].parGenre.ligne.join('/')}, valeurs de ligne ${compte[id].parGenre['valeur-ligne'].join('/')}`);
  }
  const out = value('--out');
  const text = `# Ajouts non signalés — sorties déjà payées, jugées hors ligne\n\n${tables.join('\n')}`;
  if (out) writeFileSync(path.resolve(out), text);
  const privePath = value('--prive') ?? path.join(dirs[0], 'ajouts-non-signales.json');
  writeFileSync(privePath, `${JSON.stringify(prive, null, 1)}\n`);
  console.log(`AJOUTS MESURES — ${dirs.length} sortie(s), aucun appel. Tableau : ${out ?? '(non écrit)'} ; valeurs (privées, hors Git) : ${privePath}`);
}
const lancer = !process.env.VITEST && process.argv.some(arg => arg.startsWith('--ajouts=') || arg.startsWith('--qr-pièce='));
if (lancer) main().then(() => process.exit(0), error => { console.error(`AJOUTS ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
