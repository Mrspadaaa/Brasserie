/**
 * Jugement du banc de lecture des factures (voie k1-banc).
 *
 * Lit une sortie du banc (`results.json`), compare le résultat FINAL de chaque variante (A, B, C, C′) à `expected` des cas
 * (mêmes tolérances que les bancs d'octobre, `scripts/gemini-usage-bench.ts` : montants au centime, noms par inclusion
 * insensible à la casse et aux accents, alternatives en tableau, `null` attendu = rien d'inventé) et rend, par variante :
 * champs justes / jugés, lignes justes, FAUX VERTS (statut final `checked` alors qu'un champ jugé est faux : le pire cas),
 * alertes justes (`disputed`/`unavailable` avec une erreur réelle), alertes inutiles, durée médiane et maximale, appels, coût.
 *
 * Le tableau publiable (`RESULTAT-BANC.md`) ne contient AUCUNE valeur des documents : des comptes, des durées, des coûts et le nom
 * du champ en défaut (« doc2 : tvaAmount faux en C, tirage 2 »).
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- <dossier du banc> [--publier]
 *
 * Sortie simulée (présence de faults.json) : le jugement doit retrouver chaque fausse réponse fabriquée qui atteint un résultat
 * final, et ne rien trouver sur les parcours propres ; `BANC SIMULE OK` seulement alors.
 */
import { SCAN_MAX_ITEMS } from '../functions/src/invoiceScanCore';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CAS_FILES, GENRES, LEXIQUE_FR, OPTION_MOTS, UNITE_SUFFIXE, casPath, MISSION_DIR, N_SUFFIX, baseOfId, canonMot, genreOfCase, isNId, loadCases, motsDe, orderVariants, valueAtPath, variantLabel, type AppliedFault, type BenchCase, type DrawRecord } from './banc-lecture-facture';

/** Les ids de variante présents dans les parcours (`Cs`, `Cs+N`…), dans l'ordre des tableaux. */
export const variantIds = (records: DrawRecord[]): string[] => orderVariants(new Set(records.flatMap(record => Object.keys(record.variants))));
/** Court : `C′`, `C★`, `Lm+N` (pour les défauts et les journaux). */
export const shortLabel = (id: string) => baseOfId(id).replace('Csp', 'C★′').replace('Csv', 'C★v').replace('Cs', 'C★').replace('Cp', 'C′') + (isNId(id) ? N_SUFFIX : '');

// ---------------------------------------------------------------------------------------------------------------------
// Tolérances d'octobre
// ---------------------------------------------------------------------------------------------------------------------
export const canon = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const unitCanon = (value: unknown) => {
  const text = canon(value).replace(/\.$/, '');
  if (/^(pieces?|pces?|pcs?|unites?|u)$/.test(text)) return 'piece';
  if (/^(h|heures?|hrs?)$/.test(text)) return 'h';
  if (/^cartons?$/.test(text)) return 'carton';
  if (/^sacs?$/.test(text)) return 'sac';
  if (/^bidons?$/.test(text)) return 'bidon';
  return text;
};
/** `null` attendu : rien d'inventé. Sinon un nombre à `delta` près. */
const close = (actual: unknown, expected: number | null, delta: number) =>
  expected === null ? actual === null || actual === undefined : typeof actual === 'number' && Math.abs(actual - expected) <= delta + 1e-9;
const money = (actual: unknown, expected: number | null) => close(actual, expected, 0.005);
const exactish = (actual: unknown, expected: number | null) => close(actual, expected, expected === null ? 0 : Math.max(1e-6 * Math.abs(expected), 1e-6));

/** Une valeur attendue ou une liste de valeurs justes. */
const alternatives = (value: unknown): any[] => (Array.isArray(value) ? value : [value]);
const isAbsent = (value: unknown) => value === null || value === undefined || value === '';
/** Le prix unitaire : 0,005 au plus, mais 0,5 % de la valeur attendue si c'est moins (un prix au gramme à 4 décimales), plancher 0,00005. Le montant de ligne et les totaux gardent 0,005. */
export const priceTolerance = (expected: unknown) => (typeof expected === 'number' ? Math.max(0.00005, Math.min(0.005, 0.005 * Math.abs(expected))) : 0.005);

export interface Verdict {
  /** champs d'en-tête et de totaux jugés / justes, plus le nombre de lignes */
  judged: number; right: number;
  /** lignes attendues / lignes entièrement justes (nom, quantité, unité, prix, montant, nature) */
  lineJudged: number; lineRight: number;
  /** chemins des champs faux : `date`, `amountTTC`, `items.3.unit` (ligne 4), `items.count` */
  wrong: string[];
}

/** Réglage du jugement. `portEnLigne: true` rend EXACTEMENT le jugement d'avant la règle du port (D249) : il ne sert qu'à rejouer « avant » et à prouver que le reste n'a pas bougé. */
export interface JudgeOptions { portEnLigne?: boolean }

/**
 * D249 : le port est « Total seulement » — il compte dans le total, jamais comme une ligne. Une ligne est du port si sa nature est `shipping`
 * (lecture : une chaîne ; vérité : la liste `['shipping']` seule), si son montant (`amountTTC`) est un nombre fini ≥ 0, et si toutes les lignes ne sont pas
 * du port (un document réduit à son port garde sa ligne). Même règle que l'écran (voie p3c-port, décision 7), sauf les centimes entiers, sans objet pour les vérités du banc.
 * Un port sans montant, négatif, ou d'une autre nature (lu en `service`) reste une ligne ordinaire : le juge ne devine rien.
 */
export function lignesSansPort<T = any>(items: readonly T[] | undefined): T[] {
  const lignes: any[] = Array.isArray(items) ? [...items] : [];
  const estPort = (ligne: any) => {
    const kind = ligne?.kind;
    const shipping = kind === 'shipping' || (Array.isArray(kind) && kind.length === 1 && kind[0] === 'shipping');
    return shipping && typeof ligne.amountTTC === 'number' && Number.isFinite(ligne.amountTTC) && ligne.amountTTC >= 0;
  };
  if (lignes.length && lignes.every(estPort)) return lignes;
  return lignes.filter(ligne => !estPort(ligne));
}

export function judgeResult(result: any, expected: Record<string, any>, options: JudgeOptions = {}): Verdict {
  const wrong: string[] = [];
  let judged = 0, right = 0;
  const check = (route: string, ok: boolean) => { judged++; if (ok) right++; else wrong.push(route); };
  const has = (key: string) => Object.prototype.hasOwnProperty.call(expected, key);
  // Fournisseur : une chaîne ou des alternatives ; vide = non jugé. Date : `null` ou vide attendu = date non imprimée, rien d'inventé.
  const vendors: string[] = (Array.isArray(expected.vendor) ? expected.vendor : [expected.vendor]).filter((name: unknown) => typeof name === 'string' && name);
  if (has('vendor') && vendors.length) check('vendor', vendors.some(name => canon(result.vendor).includes(canon(name))));
  if (has('documentType')) check('documentType', alternatives(expected.documentType).some(value => (isAbsent(value) ? !result.documentType : result.documentType === value)));
  // Un champ scalaire d'en-tête peut porter une LISTE de valeurs justes ; null (ou vide) dans la liste = champ absent admis. Un scalaire se juge comme avant.
  if (has('date')) check('date', alternatives(expected.date).some(value => (isAbsent(value) ? !result.date : result.date === value)));
  if (has('currency')) check('currency', alternatives(expected.currency).some(value => (isAbsent(value) ? !result.currency : canon(result.currency) === canon(value))));
  if (has('invoiceNumber')) check('invoiceNumber', (Array.isArray(expected.invoiceNumber) ? expected.invoiceNumber : [expected.invoiceNumber]).map(canon).includes(canon(result.invoiceNumber)));
  if (has('orderNumber')) check('orderNumber', alternatives(expected.orderNumber).some(value => (isAbsent(value) ? !canon(result.orderNumber) : canon(result.orderNumber) === canon(value))));
  for (const field of ['amountHT', 'tvaAmount', 'amountTTC'] as const) if (has(field)) check(field, alternatives(expected[field]).some(value => money(result[field], value ?? null)));
  if (has('tvaRate')) check('tvaRate', alternatives(expected.tvaRate).some(value => exactish(result.tvaRate, value ?? null)));
  if (has('paymentEvidence')) {
    // « paid » ou « unpaid » affirmés sans être attendus = inventé ; « unknown » est prudent, jamais compté faux.
    const allowed: string[] = Array.isArray(expected.paymentEvidence) ? expected.paymentEvidence : [expected.paymentEvidence];
    check('paymentEvidence', !(['paid', 'unpaid'].includes(result.paymentEvidence) && !allowed.includes(result.paymentEvidence)));
  }
  // D249 : le port compte dans le total (jugé plus haut) mais n'est pas une ligne, des deux côtés ; `portEnLigne` rend le jugement d'avant.
  const sansPort = (lignes: any) => (options.portEnLigne ? lignes : lignesSansPort(lignes));
  const items: any[] = Array.isArray(result.items) ? sansPort(result.items) : [];
  const attendues: any[] | undefined = Array.isArray(expected.items) ? sansPort(expected.items) : undefined;
  // Lignes visibles sur aucune capture : une ligne attendue marquée `invisible: true` est écartée avant l'alignement ; sinon `lignesInvisibles: n`
  // pardonne jusqu'à n lignes attendues absentes du résultat (elles ne comptent ni comme justes ni comme manquées), et le compte de lignes
  // est juste s'il vaut le total attendu ou ce total moins n.
  const flagged = attendues ? attendues.filter((line: any) => line?.invisible === true).length : 0;
  const expectedItems: any[] = attendues ? attendues.filter((line: any) => line?.invisible !== true) : [];
  const hidden = Math.max(0, (Number.isInteger(expected.lignesInvisibles) ? expected.lignesInvisibles : 0) - flagged);
  let lineRight = 0, forgiven = 0;
  if (Array.isArray(expected.items)) check('items.count', items.length === expectedItems.length || (hidden > 0 && items.length === expectedItems.length - hidden));
  expectedItems.forEach((line, index) => {
    const actual = items[index];
    if (!actual && forgiven < hidden && index >= items.length) { forgiven++; return; }
    if (!actual) { wrong.push(`items.${index}`); return; }
    const fails: string[] = [], on = (key: string) => Object.prototype.hasOwnProperty.call(line, key);
    // Un cas peut ne juger que certains champs de ligne (doc7 : nom, nature, montant) : seul ce qui est écrit est jugé.
    if (on('name') && !canon(actual.name).includes(canon(line.name))) fails.push('name');
    if (on('quantity') && !exactish(actual.quantity, line.quantity ?? null)) fails.push('quantity');
    if (on('unit') && !alternatives(line.unit).some(unit => (isAbsent(unit) ? !actual.unit : unitCanon(actual.unit) === unitCanon(unit)))) fails.push('unit');
    if (on('price') && !close(actual.price, line.price ?? null, priceTolerance(line.price))) fails.push('price');
    if (on('amountTTC') && !money(actual.amountTTC, line.amountTTC ?? null)) fails.push('amountTTC');
    if (Array.isArray(line.kind) && !line.kind.includes(actual.kind)) fails.push('kind');
    if (!fails.length) lineRight++;
    fails.forEach(field => wrong.push(`items.${index}.${field}`));
  });
  return { judged, right, lineJudged: expectedItems.length - forgiven, lineRight, wrong };
}

// ---------------------------------------------------------------------------------------------------------------------
// Agrégation par variante
// ---------------------------------------------------------------------------------------------------------------------
export interface VariantStats {
  draws: number; failures: number; judged: number; right: number; lineJudged: number; lineRight: number;
  fauxVerts: number; fauxCorriges: number; alertesJustes: number; alertesInutiles: number; vraisVerts: number;
  statuts: Record<string, number>; inutilesCodes: Record<string, number>; ms: number[]; costMicro: number[]; calls: number[]; thirdFrom: Record<string, number>; secondRead: number; defects: string[];
  /** Lignes écrites au-delà du plafond de 35 de la production (la plus longue lecture du parcours), et parcours touchés. */
  capLost: number; capDraws: number;
}
/** `ms` : la durée murale du parcours (appels parallèles comptés une fois). */
export interface DrawVerdict { doc: string; genre: string; tirage: number; variant: string; status: string | null; wrong: string[]; verdict: Verdict | null; ms?: number }

const median = (values: number[]) => { if (!values.length) return null; const s = [...values].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function judgeBench(records: DrawRecord[], cases: BenchCase[], options: JudgeOptions = {}): { stats: Record<string, VariantStats>; draws: DrawVerdict[] } {
  const byId = new Map(cases.map(c => [c.id, c]));
  const blank = (): VariantStats => ({ draws: 0, failures: 0, judged: 0, right: 0, lineJudged: 0, lineRight: 0, fauxVerts: 0, fauxCorriges: 0, alertesJustes: 0, alertesInutiles: 0, vraisVerts: 0,
    statuts: {}, inutilesCodes: {}, ms: [], costMicro: [], calls: [], thirdFrom: {}, secondRead: 0, defects: [], capLost: 0, capDraws: 0 });
  const stats: Record<string, VariantStats> = Object.fromEntries(variantIds(records).map(v => [v, blank()]));
  const draws: DrawVerdict[] = [];
  for (const record of records) {
    const expected = byId.get(record.doc)?.expected;
    if (!expected) throw new Error(`Cas inconnu : ${record.doc}.`);
    const genre = genreOfCase(byId.get(record.doc)!);
    for (const variant of orderVariants(Object.keys(record.variants))) {
      const run = record.variants[variant], stat = stats[variant];
      stat.draws++;
      if (run.capLost) { stat.capLost += run.capLost; stat.capDraws++; }
      stat.ms.push(run.ms); stat.costMicro.push(run.costMicroChf); stat.calls.push(run.calls);
      if (run.thirdFrom) stat.thirdFrom[run.thirdFrom] = (stat.thirdFrom[run.thirdFrom] ?? 0) + 1;
      if (run.ids.length >= 2 && run.ids.some(id => /2$/.test(id))) stat.secondRead++;
      if (!run.result) { stat.failures++; draws.push({ doc: record.doc, genre, tirage: record.tirage, variant, status: null, wrong: [], verdict: null, ms: run.ms }); continue; }
      const verdict = judgeResult(run.result, expected, options), status: string = run.result.review?.status ?? 'inconnu';
      stat.judged += verdict.judged; stat.right += verdict.right; stat.lineJudged += verdict.lineJudged; stat.lineRight += verdict.lineRight;
      stat.statuts[status] = (stat.statuts[status] ?? 0) + 1;
      const bad = verdict.wrong.length > 0, alert = status === 'disputed' || status === 'unavailable';
      if (status === 'checked' && bad) stat.fauxVerts++;
      else if (status === 'corrected' && bad) stat.fauxCorriges++;
      else if (alert && bad) stat.alertesJustes++;
      else if (alert) {
        stat.alertesInutiles++;
        // Pourquoi l'alerte sonne alors que rien n'est faux : les codes des points qui pèsent (une date ou un total vraiment absents du document, etc.).
        for (const code of new Set<string>((run.result.points ?? []).filter((point: any) => point.pese).map((point: any) => point.code))) stat.inutilesCodes[code] = (stat.inutilesCodes[code] ?? 0) + 1;
      } else stat.vraisVerts++;
      // Défauts : par champ, les lignes d'un même champ sont regroupées (« unit faux sur 26 lignes »).
      const label = shortLabel(variant);
      const grouped = new Map<string, number>();
      for (const route of verdict.wrong) {
        const parts = route.split('.');
        const name = parts[0] === 'items' ? (parts[1] === 'count' ? 'items.count' : parts[2] ? `lignes : ${parts[2]}` : 'ligne manquante') : route;
        grouped.set(name, (grouped.get(name) ?? 0) + 1);
      }
      for (const [name, count] of grouped) stat.defects.push(`${record.doc} : ${name}${count > 1 ? ` (×${count})` : ''} faux en ${label}, tirage ${record.tirage}${status === 'checked' ? ' — FAUX VERT' : ''}`);
      draws.push({ doc: record.doc, genre, tirage: record.tirage, variant, status, wrong: verdict.wrong, verdict, ms: run.ms });
    }
  }
  return { stats, draws };
}

// ---------------------------------------------------------------------------------------------------------------------
// Avant / après une règle du juge (D249, voie port-total) : aucune pièce ne doit perdre un point
// ---------------------------------------------------------------------------------------------------------------------
export interface ComptesCellule { judged: number; right: number; lineJudged: number; lineRight: number }
export interface CelluleComparee {
  /** `doc/variante` */ cellule: string; tirages: number; avant: ComptesCellule; apres: ComptesCellule;
  /** Chemins fautifs présents après et absents avant, par tirage (`t1:items.count`) ; et l'inverse. */ ajoutes: string[]; retires: string[];
  /** Les chemins ajoutés sur une cellule dont la lecture lit le port sous un autre genre : signalés à part, jamais comptés comme perte du juge. */ signales: string[];
  perte: boolean;
}
const zero = (): ComptesCellule => ({ judged: 0, right: 0, lineJudged: 0, lineRight: 0 });

/**
 * Perte, par cellule `doc/variante` (tous les tirages additionnés) : `judged − right` augmente, ou `lineJudged − lineRight` augmente, ou un chemin fautif est ajouté
 * (hors `autreGenre`), ou la cellule disparaît. Retirer une ligne jugée (le port) n'est pas une perte tant que ces écarts ne grandissent pas. Des comptes seulement : aucune valeur de pièce.
 */
export function comparerJugements(avant: readonly DrawVerdict[], apres: readonly DrawVerdict[], autreGenre: ReadonlySet<string> = new Set()): CelluleComparee[] {
  const grouper = (draws: readonly DrawVerdict[]) => {
    const cellules = new Map<string, { comptes: ComptesCellule; chemins: Set<string>; tirages: number }>();
    for (const draw of draws) {
      if (!draw.verdict) continue;
      const cle = `${draw.doc}/${draw.variant}`, cellule = cellules.get(cle) ?? { comptes: zero(), chemins: new Set<string>(), tirages: 0 };
      cellule.tirages++;
      for (const champ of ['judged', 'right', 'lineJudged', 'lineRight'] as const) cellule.comptes[champ] += draw.verdict[champ];
      for (const chemin of draw.verdict.wrong) cellule.chemins.add(`t${draw.tirage}:${chemin}`);
      cellules.set(cle, cellule);
    }
    return cellules;
  };
  const a = grouper(avant), b = grouper(apres);
  return [...new Set([...a.keys(), ...b.keys()])].sort().map(cle => {
    const x = a.get(cle), y = b.get(cle);
    const ajoutes = [...(y?.chemins ?? [])].filter(chemin => !x?.chemins.has(chemin)).sort(), retires = [...(x?.chemins ?? [])].filter(chemin => !y?.chemins.has(chemin)).sort();
    const signales = autreGenre.has(cle) ? ajoutes : [];
    const cA = x?.comptes ?? zero(), cB = y?.comptes ?? zero();
    const perte = !x || !y || x.tirages !== y.tirages
      || cB.judged - cB.right > cA.judged - cA.right || cB.lineJudged - cB.lineRight > cA.lineJudged - cA.lineRight
      || ajoutes.some(chemin => !signales.includes(chemin));
    return { cellule: cle, tirages: Math.max(x?.tirages ?? 0, y?.tirages ?? 0), avant: cA, apres: cB, ajoutes, retires, signales, perte };
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Durée murale (k5) : « toujours plutôt lent » — par pièce, puis la médiane par genre de pièce
// ---------------------------------------------------------------------------------------------------------------------
/** Médiane des durées des tirages d'un (document, variante). Les appels parallèles sont comptés une fois (la durée du parcours est celle du banc). */
export function durationPerDocument(draws: DrawVerdict[]): Map<string, Map<string, number>> {
  const lists = new Map<string, Map<string, number[]>>();
  for (const draw of draws) {
    if (typeof draw.ms !== 'number') continue;
    const row = lists.get(draw.doc) ?? new Map<string, number[]>();
    lists.set(draw.doc, row);
    row.set(draw.variant, [...(row.get(draw.variant) ?? []), draw.ms]);
  }
  return new Map([...lists].map(([doc, row]) => [doc, new Map([...row].map(([variant, list]) => [variant, median(list)!]))]));
}
/** Médiane, par genre de pièce, de la durée de tous les parcours (document × tirage) du genre. */
export function durationPerGenre(draws: DrawVerdict[]): Map<string, Map<string, number>> {
  const lists = new Map<string, Map<string, number[]>>();
  for (const draw of draws) {
    if (typeof draw.ms !== 'number') continue;
    const row = lists.get(draw.genre) ?? new Map<string, number[]>();
    lists.set(draw.genre, row);
    row.set(draw.variant, [...(row.get(draw.variant) ?? []), draw.ms]);
  }
  return new Map([...lists].map(([genre, row]) => [genre, new Map([...row].map(([variant, list]) => [variant, median(list)!]))]));
}
export function renderDurations(draws: DrawVerdict[], ids: string[]): string[] {
  const head = (first: string) => [`| ${first} | ${ids.map(shortLabel).join(' | ')} |`, `|---|${ids.map(() => '---').join('|')}|`];
  const cell = (row: Map<string, number> | undefined, id: string) => { const ms = row?.get(id); return ms === undefined ? '—' : `${(ms / 1000).toFixed(1).replace('.', ',')} s`; };
  const perDoc = durationPerDocument(draws), perGenreTable = durationPerGenre(draws);
  const lines = ['## Durée murale par pièce (médiane des tirages ; appels parallèles comptés une fois)', '', ...head('document')];
  for (const doc of [...perDoc.keys()].sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')))) lines.push(`| ${doc} | ${ids.map(id => cell(perDoc.get(doc), id)).join(' | ')} |`);
  lines.push('', '## Durée murale médiane par genre de pièce', '', ...head('genre de pièce'));
  for (const genre of [...GENRES, ...[...perGenreTable.keys()].filter(key => !(GENRES as readonly string[]).includes(key))]) if (perGenreTable.has(genre)) lines.push(`| ${genre} | ${ids.map(id => cell(perGenreTable.get(genre), id)).join(' | ')} |`);
  return lines;
}

// ---------------------------------------------------------------------------------------------------------------------
// Contrôle de la sortie simulée : chaque fausse réponse fabriquée qui atteint un résultat final est retrouvée
// ---------------------------------------------------------------------------------------------------------------------
export interface SimulationCheck { present: number; found: number; missed: string[]; cleanDraws: number; cleanWrong: string[]; fauxVerts: number; ok: boolean }
export function checkSimulation(records: DrawRecord[], draws: DrawVerdict[], applied: AppliedFault[]): SimulationCheck {
  let present = 0, found = 0;
  const missed: string[] = [];
  // f5 : une fausse désignation (`items.N.nameFr`) ne se juge pas ici (judgeResult ne lit pas nameFr) : son contrôle est `checkNomsFrSimulation`
  for (const entry of applied.filter(item => !/^items\.\d+\.nameFr$/.test(item.path))) {
    const record = records.find(item => item.doc === entry.doc && item.tirage === entry.tirage);
    if (!record) continue;
    for (const variant of orderVariants(Object.keys(record.variants))) {
      const result = record.variants[variant].result;
      if (!result || JSON.stringify(valueAtPath(result, entry.path)) !== JSON.stringify(entry.wrongValue)) continue;
      present++;
      const verdict = draws.find(item => item.doc === entry.doc && item.tirage === entry.tirage && item.variant === variant);
      if (verdict?.wrong.includes(entry.path)) found++;
      else missed.push(`${entry.fault} (${entry.doc}, tirage ${entry.tirage}, ${variant}) : ${entry.path}`);
    }
  }
  const faulty = new Set(applied.map(entry => `${entry.doc}|${entry.tirage}`));
  const clean = draws.filter(item => item.verdict && !faulty.has(`${item.doc}|${item.tirage}`));
  // Un document de plus de 35 lignes perd les suivantes au plafond de la production (le résultat le déclare : linesLost) : ce n'est pas une erreur du jugement.
  const capExplained = (item: DrawVerdict, route: string) => {
    const lost = records.find(r => r.doc === item.doc && r.tirage === item.tirage)?.variants[item.variant]?.result?.linesLost ?? 0;
    const found = /^items\.(count|(\d+))(\..*)?$/.exec(route);
    return lost > 0 && !!found && (found[1] === 'count' || Number(found[2]) >= SCAN_MAX_ITEMS);
  };
  const cleanWrong = clean.map(item => ({ item, wrong: item.wrong.filter(route => !capExplained(item, route)) })).filter(entry => entry.wrong.length).map(({ item, wrong }) => `${item.doc} tirage ${item.tirage} ${item.variant} : ${wrong.join(', ')}`);
  const fauxVerts = draws.filter(item => item.status === 'checked' && item.wrong.length).length;
  return { present, found, missed, cleanDraws: clean.length, cleanWrong, fauxVerts, ok: present > 0 && found === present && !cleanWrong.length && fauxVerts > 0 };
}

// ---------------------------------------------------------------------------------------------------------------------
// Tableau publiable : aucune valeur des documents
// ---------------------------------------------------------------------------------------------------------------------
const sec = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1).replace('.', ',')} s`);
const francs = (micro: number | null) => (micro === null ? '—' : `${(micro / 1e6).toFixed(4).replace('.', ',')}`);
const ratio = (a: number, b: number) => `${a} / ${b}`;

const median0 = median;
const totalOf = (values: number[]) => values.reduce((a, b) => a + b, 0);
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** Nom d'un chemin faux, comme dans les défauts : `lignes : price`, `ligne manquante`, `items.count`, ou le champ d'en-tête. */
function fieldName(route: string): string {
  const parts = route.split('.');
  return parts[0] === 'items' ? (parts[1] === 'count' ? 'items.count' : parts[2] ? `lignes : ${parts[2]}` : 'ligne manquante') : route;
}

// ---------------------------------------------------------------------------------------------------------------------
// Par document : pour voir si un gain vient d'un seul document
// ---------------------------------------------------------------------------------------------------------------------
export interface DocCell { draws: number; failures: number; judged: number; right: number; lineJudged: number; lineRight: number; fauxVerts: number }
export function perDocument(draws: DrawVerdict[]): Map<string, Map<string, DocCell>> {
  const out = new Map<string, Map<string, DocCell>>();
  for (const draw of draws) {
    const row = out.get(draw.doc) ?? new Map<string, DocCell>();
    out.set(draw.doc, row);
    const cell = row.get(draw.variant) ?? { draws: 0, failures: 0, judged: 0, right: 0, lineJudged: 0, lineRight: 0, fauxVerts: 0 };
    row.set(draw.variant, cell);
    cell.draws++;
    if (!draw.verdict) { cell.failures++; continue; }
    cell.judged += draw.verdict.judged; cell.right += draw.verdict.right; cell.lineJudged += draw.verdict.lineJudged; cell.lineRight += draw.verdict.lineRight;
    if (draw.status === 'checked' && draw.wrong.length) cell.fauxVerts++;
  }
  return out;
}
export function renderPerDocument(draws: DrawVerdict[], ids: string[]): string[] {
  const table = perDocument(draws);
  const lines = [`| document | ${ids.map(shortLabel).join(' | ')} |`, `|---|${ids.map(() => '---').join('|')}|`];
  for (const doc of [...table.keys()].sort()) {
    const row = table.get(doc)!;
    lines.push(`| ${doc} | ${ids.map(id => { const c = row.get(id); return c ? `${c.right}/${c.judged} · ${c.lineRight}/${c.lineJudged}${c.fauxVerts ? ` · FV ${c.fauxVerts}` : ''}${c.failures ? ` · ${c.failures} sans résultat` : ''}` : '—'; }).join(' | ')} |`);
  }
  return lines;
}

// ---------------------------------------------------------------------------------------------------------------------
// Par genre de pièce : photo, capture, plusieurs captures, PDF
// ---------------------------------------------------------------------------------------------------------------------
export interface GenreCell extends DocCell { docs: Set<string> }
export function perGenre(draws: DrawVerdict[]): Map<string, Map<string, GenreCell>> {
  const out = new Map<string, Map<string, GenreCell>>();
  for (const draw of draws) {
    const row = out.get(draw.genre) ?? new Map<string, GenreCell>();
    out.set(draw.genre, row);
    const cell = row.get(draw.variant) ?? { draws: 0, failures: 0, judged: 0, right: 0, lineJudged: 0, lineRight: 0, fauxVerts: 0, docs: new Set<string>() };
    row.set(draw.variant, cell);
    cell.draws++; cell.docs.add(draw.doc);
    if (!draw.verdict) { cell.failures++; continue; }
    cell.judged += draw.verdict.judged; cell.right += draw.verdict.right; cell.lineJudged += draw.verdict.lineJudged; cell.lineRight += draw.verdict.lineRight;
    if (draw.status === 'checked' && draw.wrong.length) cell.fauxVerts++;
  }
  return out;
}
export function renderPerGenre(draws: DrawVerdict[], ids: string[]): string[] {
  const table = perGenre(draws);
  const lines = [`| genre de pièce | ${ids.map(shortLabel).join(' | ')} |`, `|---|${ids.map(() => '---').join('|')}|`];
  for (const genre of [...GENRES, ...[...table.keys()].filter(key => !(GENRES as readonly string[]).includes(key))]) {
    const row = table.get(genre);
    if (!row) continue;
    lines.push(`| ${genre} (${Math.max(...[...row.values()].map(cell => cell.docs.size))} doc.) | ${ids.map(id => { const c = row.get(id); return c ? `${c.right}/${c.judged} · ${c.lineRight}/${c.lineJudged}${c.fauxVerts ? ` · FV ${c.fauxVerts}` : ''}${c.failures ? ` · ${c.failures} sans résultat` : ''}` : '—'; }).join(' | ')} |`);
  }
  return lines;
}

/** Les champs qui changent d'état entre deux variantes, parcours par parcours : `doc2 : currency (×3)`. */
export function fieldDiff(draws: DrawVerdict[], from: string, to: string): { fixed: string[]; broken: string[] } {
  const wrongOf = (id: string) => new Map(draws.filter(d => d.variant === id && d.verdict).map(d => [`${d.doc}|${d.tirage}`, new Set(d.wrong.map(fieldName))]));
  const a = wrongOf(from), b = wrongOf(to);
  const fixed = new Map<string, number>(), broken = new Map<string, number>();
  for (const [key, wrongFrom] of a) {
    const wrongTo = b.get(key);
    if (!wrongTo) continue;
    const doc = key.split('|')[0];
    for (const name of wrongFrom) if (!wrongTo.has(name)) fixed.set(`${doc} : ${name}`, (fixed.get(`${doc} : ${name}`) ?? 0) + 1);
    for (const name of wrongTo) if (!wrongFrom.has(name)) broken.set(`${doc} : ${name}`, (broken.get(`${doc} : ${name}`) ?? 0) + 1);
  }
  const show = (map: Map<string, number>) => [...map].sort().map(([name, n]) => `${name}${n > 1 ? ` (×${n} parcours)` : ''}`);
  return { fixed: show(fixed), broken: show(broken) };
}

// ---------------------------------------------------------------------------------------------------------------------
export function renderTable(file: { meta: any; records: DrawRecord[] }, stats: Record<string, VariantStats>, simulation?: SimulationCheck, draws: DrawVerdict[] = []): string {
  const { meta, records } = file;
  const ids = variantIds(records);
  const L = (label: string, pick: (s: VariantStats) => string) => `| ${label} | ${ids.map(v => pick(stats[v])).join(' | ')} |`;
  const heads = `| | ${ids.map(variantLabel).join(' | ')} |`, rule = `|---|${ids.map(() => '---').join('|')}|`;
  const real = records.flatMap(r => r.readings).filter(r => !r.lent), realCost = totalOf(real.map(r => r.costMicroChf ?? 0));
  const lentCount = records.flatMap(r => r.readings).filter(r => r.lent).length;
  const docs = [...new Set(records.map(r => r.doc))];
  const lines: string[] = [];
  lines.push(`# Banc de lecture des factures — résultat${meta.mode === 'simuler' ? ' (SIMULÉ, réponses fabriquées : ne prouve rien sur les modèles)' : ''}`, '');
  lines.push(`Mode ${meta.mode} · ${records.length} parcours (${docs.length} documents × ${meta.repeat} tirages${meta.stopped ? `, arrêté : ${meta.stopped}` : ''}) · modèles ${meta.models.strong} (A, B, 3ᵉ lecture) et ${meta.models.lite} (les autres) · température 0, haute résolution · variantes ${(meta.variantes ?? ['A', 'B', 'C', 'Cp']).map(shortLabel).join(', ')}${meta.normaliser ? ' (chacune aussi avec N)' : ''}.`);
  lines.push('Aucune valeur des documents ici : des comptes, des durées, des coûts et le nom du champ en défaut. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD), pas une facture.', '');
  lines.push(heads, rule);
  lines.push(L('Parcours lus (échecs sans résultat)', s => `${s.draws - s.failures} (${s.failures})`));
  lines.push(L('Champs justes / jugés', s => ratio(s.right, s.judged)));
  lines.push(L('Lignes justes / jugées', s => ratio(s.lineRight, s.lineJudged)));
  lines.push(L('**Faux verts** (checked, un champ faux)', s => `**${s.fauxVerts}**`));
  lines.push(L('Faux « corrigés » (corrected, un champ faux)', s => String(s.fauxCorriges)));
  lines.push(L('Alertes justes (disputed / unavailable, vraie erreur)', s => String(s.alertesJustes)));
  lines.push(L('Alertes inutiles (rien de faux)', s => String(s.alertesInutiles)));
  lines.push(L('Verts justes (checked / corrected, tout juste)', s => String(s.vraisVerts)));
  lines.push(L('Lignes perdues au plafond de 35 (parcours touchés)', s => `${s.capLost} (${s.capDraws})`));
  lines.push(L('Durée médiane du parcours', s => sec(median0(s.ms))));
  lines.push(L('Durée maximale du parcours', s => sec(s.ms.length ? Math.max(...s.ms) : null)));
  lines.push(L('Appels (total · moyenne par parcours)', s => `${totalOf(s.calls)} · ${s.calls.length ? (totalOf(s.calls) / s.calls.length).toFixed(2).replace('.', ',') : '—'}`));
  lines.push(L('Coût médian par parcours (CHF)', s => francs(median0(s.costMicro))));
  lines.push(L('Coût total comme en production (CHF)', s => francs(totalOf(s.costMicro))));
  lines.push('', `Dépense réelle de cette passe (appels distincts, 3ᵉ lectures partagées comptées une fois${lentCount ? `, ${lentCount} lectures prêtées par ${meta.reprendre ?? 'une sortie précédente'} non comptées` : ''}) : ${francs(realCost)} CHF pour ${real.length} appels.`, '');
  lines.push('## Statuts finaux', '', heads, rule);
  for (const status of ['checked', 'corrected', 'disputed', 'unavailable']) lines.push(L(status, s => String(s.statuts[status] ?? 0)));
  if (draws.length) lines.push('', '## Par document (champs justes/jugés · lignes justes/jugées · FV = faux verts)', '', ...renderPerDocument(draws, ids),
    '', '## Par genre de pièce (mêmes comptes, additionnés par genre)', '', ...renderPerGenre(draws, ids), '', ...renderDurations(draws, ids));
  lines.push('', '## Pourquoi sonnent les alertes inutiles (points qui pèsent, tous champs justes)', '');
  for (const v of ids) lines.push(`- ${variantLabel(v)} : ${Object.entries(stats[v].inutilesCodes).sort((a, b) => b[1] - a[1]).map(([code, n]) => `${code} ×${n}`).join(', ') || 'aucune'}`);
  lines.push('', '## Ce que chaque variante a appelé', '');
  if (ids.includes('B')) lines.push(`- B : la lecture 2 a été appelée dans ${stats.B.secondRead} parcours sur ${stats.B.draws}.`);
  for (const v of ids.filter(id => !['A', 'B'].includes(baseOfId(id)))) {
    const t = stats[v].thirdFrom;
    lines.push(`- ${variantLabel(v)} : 3.8 prêtée par A ${t.A ?? 0} fois, prêtée par k1 ${t.k1 ?? 0} fois, appel 3.8 neuf ${t.neuf ?? 0} fois, sans 3ᵉ lecture ${stats[v].draws - (t.A ?? 0) - (t.k1 ?? 0) - (t.neuf ?? 0)} fois.`);
  }
  // Par groupe d'appel (A, C, Lm, Lh, Lp) : coupures, lectures longues, sortie moyenne — les appels distincts de cette passe seulement.
  const byGroup = new Map<string, Array<DrawRecord['readings'][number]>>();
  for (const read of records.flatMap(r => r.readings)) if (read.meta.lecture !== 3) byGroup.set(read.meta.variant, [...(byGroup.get(read.meta.variant) ?? []), read]);
  if (byGroup.size) {
    lines.push('', '## Les lectures, par réglage (lectures 1 et 2)', '');
    for (const [group, reads] of byGroup) {
      const cut = reads.filter(r => /^coupée/.test(r.state)).length, slow = reads.filter(r => r.ms > 45_000).length;
      const outs = reads.map(r => r.outputTokens).filter((n): n is number => n !== null), costs = reads.map(r => r.costMicroChf).filter((n): n is number => n !== null);
      lines.push(`- ${group} : ${reads.length} lectures${reads.some(r => r.lent) ? ' (dont prêtées)' : ''}, ${cut} coupée(s) par la limite de sortie, ${slow} de plus de 45 s, sortie moyenne ${outs.length ? Math.round(totalOf(outs) / outs.length) : '—'} jetons (réflexion comprise), coût moyen ${francs(costs.length ? totalOf(costs) / costs.length : null)} CHF, durée médiane ${sec(median0(reads.map(r => r.ms)))}.`);
    }
  }
  lines.push('', '## Défauts relevés (nom du champ seulement)', '');
  for (const v of ids) {
    lines.push(`### ${variantLabel(v)}`);
    lines.push(...(stats[v].defects.length ? stats[v].defects.map(d => `- ${d}`) : ['- aucun champ faux']));
    lines.push('');
  }
  if (simulation) {
    lines.push('## Contrôle du jugement sur la simulation', '',
      `- fausses réponses fabriquées présentes dans un résultat final : ${simulation.present}, retrouvées : ${simulation.found}${simulation.missed.length ? ` — MANQUÉES : ${simulation.missed.join(' ; ')}` : ''}`,
      `- parcours propres (aucune faute fabriquée) : ${simulation.cleanDraws}, champs faux trouvés à tort : ${simulation.cleanWrong.length}`,
      `- faux verts comptés : ${simulation.fauxVerts}`, '');
  }
  lines.push('## Lecture honnête', '',
    `- ${records.length} parcours par variante : peu pour trancher entre deux taux d'erreur proches ; un faux vert de plus ou de moins se lit comme un indice, pas comme une mesure.`,
    '- B, C′, C★ et C★′ sont calculés hors ligne depuis les appels de A et de C : mêmes réponses, aucun appel de plus (sauf une 3.8 neuve quand une variante en a besoin et qu’aucune n’est prêtée). N relit les mêmes réponses avec la devise en code ISO.',
    '- La durée d’un parcours est la somme des durées mesurées appel par appel : le plus long des deux appels parallèles, puis la 3ᵉ lecture ; la somme séquentielle (B). Pour une 3.8 prêtée, la durée est celle mesurée au banc de k1.', '');
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------------------------------------------------------------
// HORS-LIGNE.md : C★, C★′ et N recalculés sur la sortie payante de k1, sans appel
// ---------------------------------------------------------------------------------------------------------------------
export function renderHorsLigne(file: { meta: any; records: DrawRecord[] }, stats: Record<string, VariantStats>, draws: DrawVerdict[]): string {
  const { meta, records } = file;
  const ids = variantIds(records);
  const L = (label: string, pick: (s: VariantStats) => string) => `| ${label} | ${ids.map(v => pick(stats[v])).join(' | ')} |`;
  const heads = `| | ${ids.map(shortLabel).join(' | ')} |`, rule = `|---|${ids.map(() => '---').join('|')}|`;
  const lines: string[] = [];
  lines.push('# Hors ligne — C★, C★′ et N sur la sortie payante de k1', '');
  lines.push(`Recalcul sans aucun appel ni clé, depuis les ${records.length} parcours déjà payés (${meta.reprendre ?? 'sortie k1'} : 7 documents × ${meta.repeat} tirages). Mêmes lectures, mêmes durées mesurées, mêmes coûts : seule la façon de conclure change.`);
  lines.push('- **C★** : comme C (deux Flash-Lite, la 3.8 sur désaccord), mais la 3.8 **tranche seule** : son résultat remplace le vote à trois. Statut d’une lecture seule : « checked » si aucun point ne pèse, « disputed » sinon.');
  lines.push('- **C★v** : les valeurs de la 3.8 quand elle tranche (comme C★), mais le statut du vote à trois (comme C) : « disputed » dès que les lectures ont divergé sur un champ qui pèse. Décision du pilote du 01.11.');
  lines.push('- **C★′** : comme C★, et la 3.8 est aussi appelée quand les deux Flash-Lite concordent mais que l’arithmétique échoue (comme C′).');
  lines.push('- **+N** : normalisation de code appliquée à chaque lecture avant le vote, pour toutes les variantes : devise « Fr. », « SFr. », « CHF. » → « CHF ». Rien d’autre ; une devise étrangère n’est jamais devinée.');
  lines.push('- Aucune valeur des documents ici : des comptes, des durées, des coûts et des noms de champs. Une lecture des défauts communs à toutes les variantes est dans `RESULTAT-BANC.md` de la mission.', '');
  lines.push('## Total', '', heads, rule);
  lines.push(L('Champs justes / jugés', s => ratio(s.right, s.judged)));
  lines.push(L('Lignes justes / jugées', s => ratio(s.lineRight, s.lineJudged)));
  lines.push(L('**Faux verts**', s => `**${s.fauxVerts}**`));
  lines.push(L('Faux « corrigés »', s => String(s.fauxCorriges)));
  lines.push(L('Alertes justes', s => String(s.alertesJustes)));
  lines.push(L('Alertes inutiles', s => String(s.alertesInutiles)));
  lines.push(L('Verts justes', s => String(s.vraisVerts)));
  lines.push(L('Durée médiane', s => sec(median0(s.ms))));
  lines.push(L('Durée maximale', s => sec(s.ms.length ? Math.max(...s.ms) : null)));
  lines.push(L('Appels (moyenne par parcours)', s => (s.calls.length ? (totalOf(s.calls) / s.calls.length).toFixed(2).replace('.', ',') : '—')));
  lines.push(L('Coût médian par parcours (CHF)', s => francs(median0(s.costMicro))));
  lines.push('', '## Par document (champs justes/jugés · lignes justes/jugées · FV = faux verts)', '', ...renderPerDocument(draws, ids), '', '## Par genre de pièce', '', ...renderPerGenre(draws, ids), '', ...renderDurations(draws, ids), '');

  const delta = (from: string, to: string) => {
    const a = stats[from], b = stats[to];
    if (!a || !b) return null;
    const diff = fieldDiff(draws, from, to);
    return { champs: b.right - a.right, lignes: b.lineRight - a.lineRight, fv: b.fauxVerts - a.fauxVerts, ms: (median0(b.ms) ?? 0) - (median0(a.ms) ?? 0), diff };
  };
  const bullets = (label: string, d: ReturnType<typeof delta>) => d ? [
    `- ${label} : champs ${signed(d.champs)}, lignes ${signed(d.lignes)}, faux verts ${signed(d.fv)}, durée médiane ${d.ms >= 0 ? '+' : '−'}${sec(Math.abs(d.ms))}.`,
    `  - champs qui deviennent justes : ${d.diff.fixed.join(' ; ') || 'aucun'}`,
    `  - champs qui deviennent faux : ${d.diff.broken.join(' ; ') || 'aucun'}`
  ] : [`- ${label} : variante absente de cette sortie.`];

  lines.push('## Ce que la 3.8 qui tranche seule change', '');
  lines.push(...bullets('C★ contre C', delta('C', 'Cs')), ...bullets('C★′ contre C′', delta('Cp', 'Csp')), ...bullets('C★v contre C', delta('C', 'Csv')), ...bullets('C★v contre C★ (le statut seul)', delta('Cs', 'Csv')), '');
  lines.push('## Ce que N rattrape seule', '');
  for (const id of ids.filter(id => !isNId(id))) if (ids.includes(`${id}${N_SUFFIX}`)) lines.push(...bullets(`${shortLabel(id)} + N contre ${shortLabel(id)}`, delta(id, `${id}${N_SUFFIX}`)));
  lines.push('', '## Lecture honnête', '',
    `- ${records.length} parcours par variante, sept documents : un gain porté par un seul document se voit dans le tableau par document ; il ne prouve pas que la règle vaille pour une autre facture.`,
    '- Le vote à trois garde une valeur sur laquelle les deux Flash-Lite s’accordent à tort ; la 3.8 qui tranche seule n’y change rien tant qu’elle n’est pas appelée (accord des deux lectures, arithmétique juste). Seul un désaccord ou un contrôle en échec la fait parler.',
    '- N ne touche que la devise : il ne rattrape rien d’autre, et seulement quand la lecture a écrit une abréviation de franc.', '');
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Voie f5-noms-fr (01.11, D271, D275) : le juge du champ `nameFr` (la désignation en français) de la variante Csv8F
// ---------------------------------------------------------------------------------------------------------------------
/** Les défauts d'une désignation en français : absente, restée dans une autre langue, marque perdue, option ou état gardé, suffixe d'unité gardé, explication trop longue. */
export type DefautNomFr = 'absent' | 'langue' | 'marque' | 'option' | 'unite' | 'long';
export const DEFAUTS_NOM_FR: readonly DefautNomFr[] = ['absent', 'langue', 'marque', 'option', 'unite', 'long'];
const inLexique = (word: string) => Object.prototype.hasOwnProperty.call(LEXIQUE_FR, word);
/** Les jetons d'une désignation imprimée qui doivent survivre tels quels : marque ®/™, référence (lettres et chiffres), nombre à 4 chiffres ou plus, MAJUSCULES de 4 lettres ou plus (hors mots du lexique et d'option). */
export function jetonsGardes(name: string): string[] {
  const out: string[] = [];
  for (const token of name.split(/[\s,;()/]+/).filter(Boolean)) {
    const marked = /[®™]/.test(token), bare = token.replace(/[®™]/g, '').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    const core = canonMot(bare);
    if (!core || (inLexique(core) || OPTION_MOTS.has(core))) continue;
    const letters = bare.replace(/[^\p{L}]/gu, '');
    const reference = /\d/.test(core) && /[a-z]/.test(core) && core.length >= 3, number = /^\d{4,}$/.test(core), caps = letters.length >= 4 && letters === letters.toUpperCase() && !/\d/.test(core);
    if (marked || reference || number || caps) out.push(bare);
  }
  return out;
}
/**
 * Le verdict de `nameFr` sur une ligne du résultat final, par règles (un indice, jamais une traduction) :
 *  - absent : la ligne a une désignation mais pas de `nameFr` ;
 *  - langue : un mot du lexique d'allemand, d'anglais ou d'italien (`LEXIQUE_FR`) reste dans `nameFr` ;
 *  - marque : une marque ®/™, une référence, un nombre à 4 chiffres ou un mot en MAJUSCULES de la désignation imprimée n'est plus dans `nameFr` ;
 *  - option : crochets, deux-points, supplément « +CHF », mot d'état/option (geschrotet, crushed…) ou le texte de `variant` ;
 *  - unite : le suffixe d'unité imprimé (« , Kg ») ou l'unité lue de la ligne en fin de texte ;
 *  - long : bien plus long que l'imprimé (explication ajoutée).
 */
export function jugerNomFr(line: { name?: unknown; nameFr?: unknown; variant?: unknown; unit?: unknown }): DefautNomFr[] {
  const name = String(line.name ?? '').trim(), fr = String(line.nameFr ?? '').trim();
  if (!name) return [];
  if (!fr) return ['absent'];
  const defects: DefautNomFr[] = [], words = motsDe(fr);
  if (words.some(inLexique)) defects.push('langue');
  if (jetonsGardes(name).some(token => { const need = motsDe(token); return need.length > 0 && !need.every(word => words.includes(word)); })) defects.push('marque');
  const variant = canonMot(String(line.variant ?? '')).replace(/\s+/g, ' ').trim();
  // Une ligne qui est elle-même une option imprimée (« Schrotung ») n'est pas accusée d'en porter le mot
  const lineIsOption = motsDe(name).some(word => OPTION_MOTS.has(word));
  if (/\[[^\]]*\]|:|\+\s*(?:chf|fr|eur|€)/i.test(fr) || (!lineIsOption && words.some(word => OPTION_MOTS.has(word))) || (variant.length >= 4 && canonMot(fr).replace(/\s+/g, ' ').includes(variant))) defects.push('option');
  const unit = String(line.unit ?? '').trim().replace(/[.*+?^${}()|[\]\\]/g, match => `\\${match}`);
  if (UNITE_SUFFIXE.test(fr) || (unit && new RegExp(`[,;]\\s*${unit}\\.?\\s*$`, 'i').test(fr))) defects.push('unite');
  if (fr.length > name.length * 1.8 + 20) defects.push('long');
  return defects;
}
/** Une désignation sans mot du lexique dont `nameFr` diffère pourtant : nom propre ou mot déjà français retouché ? Ni défaut ni réussite : à lire dans les paires. */
export function aLireNomFr(line: { name?: unknown; nameFr?: unknown }): boolean {
  const name = String(line.name ?? '').replace(UNITE_SUFFIXE, '').trim(), fr = String(line.nameFr ?? '').trim();
  if (!name || !fr || motsDe(name).some(inLexique)) return false;
  return motsDe(name).filter(word => !OPTION_MOTS.has(word)).join(' ') !== motsDe(fr).join(' ');
}

export interface PaireNomFr { doc: string; tirage: number; variant: string; rang: number; name: string; nameFr: string; defauts: DefautNomFr[]; aLire: boolean }
export interface NomsFrStats { items: number; justes: number; avecNomFr: number; aLire: number; defauts: Record<DefautNomFr, number>; parDoc: Record<string, { items: number; justes: number }>; parGenre: Record<string, { items: number; justes: number }>; paires: PaireNomFr[] }
/** Le jugement de `nameFr` par variante qui le porte (Csv8F, Csv8F+N), sur les lignes du résultat final. Les paires (nom imprimé, nom français) sont PRIVÉES : jamais dans un tableau publiable. */
export function judgeNomsFr(records: DrawRecord[], cases: BenchCase[]): Record<string, NomsFrStats> {
  const genres = new Map(cases.map(c => [c.id, genreOfCase(c)]));
  const out: Record<string, NomsFrStats> = {};
  for (const record of records) for (const variant of orderVariants(Object.keys(record.variants))) {
    if (baseOfId(variant) !== 'Csv8F') continue;
    const stat = (out[variant] ??= { items: 0, justes: 0, avecNomFr: 0, aLire: 0, defauts: { absent: 0, langue: 0, marque: 0, option: 0, unite: 0, long: 0 }, parDoc: {}, parGenre: {}, paires: [] });
    const lines: any[] = record.variants[variant].result?.items ?? [];
    lines.forEach((line, rang) => {
      if (!String(line?.name ?? '').trim()) return;
      const defauts = jugerNomFr(line), aLire = defauts.length === 0 && aLireNomFr(line), genre = genres.get(record.doc) ?? 'photo';
      stat.items++; if (!defauts.length) stat.justes++; if (line.nameFr) stat.avecNomFr++; if (aLire) stat.aLire++;
      for (const code of defauts) stat.defauts[code]++;
      const doc = (stat.parDoc[record.doc] ??= { items: 0, justes: 0 }), gen = (stat.parGenre[genre] ??= { items: 0, justes: 0 });
      doc.items++; gen.items++; if (!defauts.length) { doc.justes++; gen.justes++; }
      stat.paires.push({ doc: record.doc, tirage: record.tirage, variant, rang, name: String(line.name), nameFr: String(line.nameFr ?? ''), defauts, aLire });
    });
  }
  return out;
}
/** Le tableau publiable de `nameFr` : des comptes seulement, aucun nom d'achat. */
export function renderNomsFr(stats: Record<string, NomsFrStats>): string[] {
  const ids = Object.keys(stats);
  if (!ids.length) return ['Aucune variante Csv8F dans cette sortie.'];
  const lines = ['## Désignation en français (nameFr) — comptes seulement', '', `| | ${ids.map(shortLabel).join(' | ')} |`, `|---|${ids.map(() => '---').join('|')}|`];
  const L = (label: string, pick: (s: NomsFrStats) => string) => `| ${label} | ${ids.map(id => pick(stats[id])).join(' | ')} |`;
  lines.push(L('Lignes avec un nameFr / lignes', s => `${s.avecNomFr} / ${s.items}`), L('Lignes sans défaut / lignes', s => `${s.justes} / ${s.items}`));
  for (const code of DEFAUTS_NOM_FR) lines.push(L(`défaut « ${code} »`, s => String(s.defauts[code])));
  lines.push(L('à lire à la main (nom retouché sans mot du lexique)', s => String(s.aLire)));
  for (const id of ids) {
    lines.push('', `### ${shortLabel(id)} — par pièce et par genre (lignes sans défaut / lignes)`, '', '| pièce | lignes |', '|---|---|');
    for (const doc of Object.keys(stats[id].parDoc).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')))) lines.push(`| ${doc} | ${stats[id].parDoc[doc].justes} / ${stats[id].parDoc[doc].items} |`);
    lines.push('', ...Object.entries(stats[id].parGenre).map(([genre, c]) => `- ${genre} : ${c.justes} / ${c.items}`));
  }
  lines.push('', 'Les règles sont des indices (lexique allemand, anglais, italien ; marque, option, unité) : le verdict final est la lecture des paires (nom imprimé, nom français) du fichier privé `noms-fr-paires.json`, par le pilote.');
  return lines;
}

/** Simulation : chaque fausse désignation fabriquée (`items.N.nameFr` d'un plan de fautes) est retrouvée par le juge, sous le bon défaut, et aucune autre ligne n'est accusée. */
const DEFAUT_DE_FAUTE: Record<string, DefautNomFr> = { 'nom-fr-non-traduit': 'langue', 'nom-fr-suffixe-unite': 'unite', 'nom-fr-option': 'option', 'nom-fr-absent': 'absent' };
export const estFauteNomFr = (entry: AppliedFault) => /^items\.\d+\.nameFr$/.test(entry.path);
export interface NomsFrSimulation { present: number; found: number; missed: string[]; accusees: string[]; ok: boolean }
export function checkNomsFrSimulation(records: DrawRecord[], applied: AppliedFault[]): NomsFrSimulation {
  const faults = applied.filter(estFauteNomFr);
  let present = 0, found = 0;
  const missed: string[] = [], accusees: string[] = [], expectedCells = new Set<string>();
  for (const record of records) for (const variant of orderVariants(Object.keys(record.variants))) {
    if (baseOfId(variant) !== 'Csv8F') continue;
    const lines: any[] = record.variants[variant].result?.items ?? [];
    for (const entry of faults.filter(item => item.doc === record.doc && item.tirage === record.tirage)) {
      const rang = Number(entry.path.split('.')[1]), line = lines[rang], code = DEFAUT_DE_FAUTE[entry.fault];
      if (!line) continue;
      const there = code === 'absent' ? !line.nameFr : line.nameFr === entry.wrongValue;
      if (!there) continue;
      expectedCells.add(`${record.doc}|${record.tirage}|${variant}|${rang}`);
      present++;
      if (jugerNomFr(line).includes(code)) found++; else missed.push(`${entry.fault} (${record.doc}, tirage ${record.tirage}, ${shortLabel(variant)}, ligne ${rang + 1})`);
    }
    lines.forEach((line, rang) => {
      if (expectedCells.has(`${record.doc}|${record.tirage}|${variant}|${rang}`)) return;
      const defauts = jugerNomFr(line);
      if (defauts.length) accusees.push(`${record.doc} tirage ${record.tirage} ${shortLabel(variant)} ligne ${rang + 1} : ${defauts.join(', ')}`);
    });
  }
  return { present, found, missed, accusees, ok: present > 0 && found === present && !accusees.length };
}

/** Deux sorties du banc réunies : les variantes de la seconde s'ajoutent, par (pièce, tirage), à celles de la première (la production rejouée et Csv8F payée). */
export function fusionnerSorties(a: DrawRecord[], b: DrawRecord[]): DrawRecord[] {
  const bKey = new Map(b.map(record => [`${record.doc}|${record.tirage}`, record]));
  const merged = a.map(record => { const other = bKey.get(`${record.doc}|${record.tirage}`); return other ? { ...record, readings: [...record.readings, ...other.readings], variants: { ...record.variants, ...other.variants } } : record; });
  const seen = new Set(a.map(record => `${record.doc}|${record.tirage}`));
  return [...merged, ...b.filter(record => !seen.has(`${record.doc}|${record.tirage}`))];
}

export interface PerteNomFr { cellule: string; avant: ComptesCellule; apres: ComptesCellule; ajoutes: string[] }
export interface ComparaisonNomFr {
  /** Les cellules (pièce / variante) où Csv8F perd un champ, une ligne, ou ajoute un champ faux. */ pertes: PerteNomFr[];
  production: VariantStats; avecNomFr: VariantStats; sansPerte: boolean; raisons: string[];
  /** Rapports médians Csv8F / production (durée, coût) : au-delà de 1,25 « à juger » (le champ ajoute des jetons de sortie). */ rapportTemps: number | null; rapportCout: number | null;
}
/** Csv8F+N contre Csv8+N, jugés comme les autres variantes (champs, lignes, faux verts, durée, coût) : « sans perte » seulement si rien n'est pire. */
export function comparerCsv8F(records: DrawRecord[], cases: BenchCase[], production = 'Csv8+N', variante = 'Csv8F+N'): ComparaisonNomFr {
  const { stats, draws } = judgeBench(records, cases);
  const p = stats[production], f = stats[variante];
  if (!p || !f) throw new Error(`Comparaison impossible : il faut ${production} et ${variante} dans les parcours.`);
  const rename = (variant: string) => draws.filter(draw => draw.variant === variant).map(draw => ({ ...draw, variant: 'X' }));
  const cellules = comparerJugements(rename(production), rename(variante));
  const pertes = cellules.filter(cell => cell.perte).map(cell => ({ cellule: cell.cellule, avant: cell.avant, apres: cell.apres, ajoutes: cell.ajoutes }));
  const raisons: string[] = [];
  if (f.right < p.right) raisons.push(`champs justes ${f.right} contre ${p.right}`);
  if (f.lineRight < p.lineRight) raisons.push(`lignes justes ${f.lineRight} contre ${p.lineRight}`);
  if (f.fauxVerts > p.fauxVerts) raisons.push(`faux verts ${f.fauxVerts} contre ${p.fauxVerts}`);
  if (f.failures > p.failures) raisons.push(`parcours sans résultat ${f.failures} contre ${p.failures}`);
  if (pertes.length) raisons.push(`${pertes.length} cellule(s) pièce/variante en perte`);
  const ratioOf = (a: number | null, b: number | null) => (a === null || b === null || b === 0 ? null : a / b);
  return { pertes, production: p, avecNomFr: f, sansPerte: raisons.length === 0, raisons, rapportTemps: ratioOf(median(f.ms), median(p.ms)), rapportCout: ratioOf(median(f.costMicro), median(p.costMicro)) };
}
export function renderComparaison(c: ComparaisonNomFr, production = 'Csv8+N', variante = 'Csv8F+N'): string[] {
  const row = (label: string, pick: (s: VariantStats) => string) => `| ${label} | ${pick(c.production)} | ${pick(c.avecNomFr)} |`;
  const lines = [`## ${shortLabel(variante)} contre ${shortLabel(production)} — rien ne doit être perdu ailleurs`, '', `| | ${shortLabel(production)} | ${shortLabel(variante)} |`, '|---|---|---|'];
  lines.push(row('Champs justes / jugés', s => ratio(s.right, s.judged)), row('Lignes justes / jugées', s => ratio(s.lineRight, s.lineJudged)), row('**Faux verts**', s => `**${s.fauxVerts}**`), row('Parcours sans résultat', s => String(s.failures)),
    row('Durée médiane', s => sec(median(s.ms))), row('Durée maximale', s => sec(s.ms.length ? Math.max(...s.ms) : null)), row('Coût médian par parcours (CHF)', s => francs(median(s.costMicro))), row('Coût total (CHF)', s => francs(totalOf(s.costMicro))));
  const times = (r: number | null) => (r === null ? '—' : `×${r.toFixed(2).replace('.', ',')}`);
  lines.push('', `Durée médiane ${times(c.rapportTemps)}, coût médian ${times(c.rapportCout)} (au-delà de ×1,25 : à juger, le champ ajoute des jetons de sortie).`);
  lines.push('', c.sansPerte ? 'AUCUNE PERTE — champs, lignes, faux verts et parcours : au moins aussi bons, aucune cellule pièce/variante en perte.' : `PERTE — ${c.raisons.join(' ; ')}.`);
  for (const loss of c.pertes) lines.push(`- ${loss.cellule} : champs ${loss.avant.right}/${loss.avant.judged} → ${loss.apres.right}/${loss.apres.judged}, lignes ${loss.avant.lineRight}/${loss.avant.lineJudged} → ${loss.apres.lineRight}/${loss.apres.lineJudged}${loss.ajoutes.length ? `, nouveaux champs faux : ${loss.ajoutes.join(', ')}` : ''}`);
  return lines;
}

/** `--noms-fr <dossier Csv8F> [--contre <dossier production>]` : le jugement de nameFr et la comparaison. Écrit le tableau (comptes) et les paires (privées) dans le dossier de la sortie Csv8F. */
function mainNomsFr(args: string[]) {
  const at = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const dir = at('--noms-fr'), contre = at('--contre');
  if (!dir || dir.startsWith('--')) throw new Error('--noms-fr attend le dossier de la sortie Csv8F.');
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8'));
  const other = contre ? JSON.parse(readFileSync(path.join(contre, 'results.json'), 'utf8')) : undefined;
  const records: DrawRecord[] = other ? fusionnerSorties(other.records, file.records) : file.records;
  const names: string[] = [...new Set<string>([...(file.meta.casFiles ?? []), ...(other?.meta.casFiles ?? [])])];
  const cases = loadCases(names.length ? names.map((name: string) => CAS_FILES.find(candidate => path.basename(candidate) === name) ?? casPath(name)) : CAS_FILES);
  const noms = judgeNomsFr(file.records, cases), lines = renderNomsFr(noms);
  const out: string[] = [];
  let simulation: NomsFrSimulation | undefined;
  const faultsPath = path.join(dir, 'faults.json');
  if (existsSync(faultsPath)) simulation = checkNomsFrSimulation(file.records, JSON.parse(readFileSync(faultsPath, 'utf8')).applied);
  if (other) { const comparison = comparerCsv8F(records, cases, 'Csv8+N', 'Csv8F+N'); out.push('', ...renderComparaison(comparison)); console.log(comparison.sansPerte ? 'AUCUNE PERTE' : `PERTE : ${comparison.raisons.join(' ; ')}`); }
  for (const [id, s] of Object.entries(noms)) console.log(`${shortLabel(id)} : nameFr sans défaut ${s.justes}/${s.items}, absents ${s.defauts.absent}, langue ${s.defauts.langue}, marque ${s.defauts.marque}, option ${s.defauts.option}, unité ${s.defauts.unite}, long ${s.defauts.long}, à lire ${s.aLire}`);
  writeFileSync(path.join(dir, 'RESULTAT-NOMS-FR.md'), `${['# Désignation en français — résultat', '', ...lines, ...out].join('\n')}\n`);
  writeFileSync(path.join(dir, 'noms-fr-paires.json'), `${JSON.stringify(Object.fromEntries(Object.entries(noms).map(([id, s]) => [id, s.paires])), null, 1)}\n`);
  console.log(`Tableau : ${path.join(dir, 'RESULTAT-NOMS-FR.md')} ; paires privées : ${path.join(dir, 'noms-fr-paires.json')}`);
  if (simulation) {
    if (simulation.ok) console.log(`NOMS FR SIMULE OK — ${simulation.found}/${simulation.present} fausses désignations fabriquées retrouvées, aucune autre ligne accusée.`);
    else { console.log(`NOMS FR SIMULE ECHEC — retrouvées ${simulation.found}/${simulation.present}, manquées : ${simulation.missed.join(' ; ') || 'aucune'}, accusées à tort : ${simulation.accusees.join(' ; ') || 'aucune'}.`); process.exit(1); }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--');
  if (args.includes('--noms-fr')) { mainNomsFr(args); return; }
  const valueOfMd = args.indexOf('--hors-ligne-md') >= 0 ? args.indexOf('--hors-ligne-md') + 1 : -1;
  const dir = args.find((arg, index) => !arg.startsWith('--') && index !== valueOfMd);
  if (!dir) throw new Error('Dossier de sortie du banc manquant.');
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8'));
  const cases = loadCases(file.meta.casFiles?.length ? file.meta.casFiles.map((name: string) => CAS_FILES.find(candidate => path.basename(candidate) === name) ?? casPath(name)) : CAS_FILES);
  const { stats, draws } = judgeBench(file.records, cases);
  const faultsPath = path.join(dir, 'faults.json');
  const applied: AppliedFault[] | undefined = existsSync(faultsPath) ? JSON.parse(readFileSync(faultsPath, 'utf8')).applied : undefined;
  // f5 : les fausses désignations (`nameFr`) ne passent pas par `judgeResult` ; leur contrôle est celui de `--noms-fr` (juge des noms)
  const simulation = applied ? checkSimulation(file.records, draws, applied.filter(entry => !estFauteNomFr(entry))) : undefined;
  const nomsFrSimulation = applied && file.records.some((record: DrawRecord) => Object.keys(record.variants).some(id => baseOfId(id) === 'Csv8F')) ? checkNomsFrSimulation(file.records, applied) : undefined;
  const table = renderTable(file, stats, simulation, draws);
  const target = path.join(dir, 'RESULTAT-BANC.md');
  writeFileSync(target, table);
  for (const v of variantIds(file.records)) {
    const s = stats[v];
    console.log(`${variantLabel(v)} : champs ${ratio(s.right, s.judged)}, lignes ${ratio(s.lineRight, s.lineJudged)}, faux verts ${s.fauxVerts}, alertes justes ${s.alertesJustes}, inutiles ${s.alertesInutiles}, échecs ${s.failures}, durée médiane ${sec(median(s.ms))}, coût total ${francs(s.costMicro.reduce((a, b) => a + b, 0))} CHF`);
  }
  // HORS-LIGNE.md : le recalcul sans appel (sortie `--hors-ligne`), écrit où on le demande
  const horsLigneAt = args.indexOf('--hors-ligne-md');
  if (horsLigneAt >= 0) {
    const out = args[horsLigneAt + 1];
    if (!out || out.startsWith('--')) throw new Error('--hors-ligne-md attend un chemin de fichier.');
    writeFileSync(out, renderHorsLigne(file, stats, draws));
    console.log(`Hors ligne : ${out}`);
  }
  if (args.includes('--publier')) {
    if (file.meta.mode !== 'payant') throw new Error('Un tableau simulé ou hors ligne ne se publie pas ici.');
    // k2 : jamais par-dessus le RESULTAT-BANC.md de k1
    const published = path.join(MISSION_DIR, 'voies/k2-reglages/RESULTAT-BANC-K2.md');
    copyFileSync(target, published);
    console.log(`Publié : ${published}`);
  }
  if (simulation) {
    if (nomsFrSimulation && !nomsFrSimulation.ok) { console.log(`BANC SIMULE ECHEC — désignations en français : retrouvées ${nomsFrSimulation.found}/${nomsFrSimulation.present}, manquées : ${nomsFrSimulation.missed.join(' ; ') || 'aucune'}, accusées à tort : ${nomsFrSimulation.accusees.join(' ; ') || 'aucune'}.`); process.exit(1); }
    if (simulation.ok) console.log(`BANC SIMULE OK — ${simulation.found}/${simulation.present} fausses réponses fabriquées retrouvées, ${simulation.fauxVerts} faux verts comptés, ${simulation.cleanDraws} parcours propres sans champ faux, aucun réseau.${nomsFrSimulation ? ` Désignations en français : ${nomsFrSimulation.found}/${nomsFrSimulation.present} fausses fabriquées retrouvées, aucune autre accusée.` : ''}`);
    else { console.log(`BANC SIMULE ECHEC — retrouvées ${simulation.found}/${simulation.present}, manquées : ${simulation.missed.join(' ; ') || 'aucune'}, champs faux sur parcours propres : ${simulation.cleanWrong.join(' ; ') || 'aucun'}, faux verts ${simulation.fauxVerts}.`); process.exit(1); }
  } else console.log(`Tableau : ${target}`);
}
/** vite-node ne laisse pas le nom du script dans process.argv : le jugement se lance avec un dossier de banc, jamais sous vitest. */
const rest = process.argv.slice(2).filter(arg => arg !== '--');
if (!process.env.VITEST && !/banc-noms-fr/.test(process.argv[1] ?? '') && rest.some(arg => !arg.startsWith('--')) && !rest.includes('--simuler') && !rest.includes('--payant') && !rest.includes('--hors-ligne')) main();
