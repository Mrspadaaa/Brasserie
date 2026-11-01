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
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CAS_FILES, MISSION_DIR, N_SUFFIX, baseOfId, isNId, loadCases, orderVariants, valueAtPath, variantLabel, type AppliedFault, type BenchCase, type DrawRecord } from './banc-lecture-facture';

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

export interface Verdict {
  /** champs d'en-tête et de totaux jugés / justes, plus le nombre de lignes */
  judged: number; right: number;
  /** lignes attendues / lignes entièrement justes (nom, quantité, unité, prix, montant, nature) */
  lineJudged: number; lineRight: number;
  /** chemins des champs faux : `date`, `amountTTC`, `items.3.unit` (ligne 4), `items.count` */
  wrong: string[];
}

export function judgeResult(result: any, expected: Record<string, any>): Verdict {
  const wrong: string[] = [];
  let judged = 0, right = 0;
  const check = (route: string, ok: boolean) => { judged++; if (ok) right++; else wrong.push(route); };
  const has = (key: string) => Object.prototype.hasOwnProperty.call(expected, key);
  // Fournisseur : une chaîne ou des alternatives ; vide = non jugé. Date : `null` ou vide attendu = date non imprimée, rien d'inventé.
  const vendors: string[] = (Array.isArray(expected.vendor) ? expected.vendor : [expected.vendor]).filter((name: unknown) => typeof name === 'string' && name);
  if (has('vendor') && vendors.length) check('vendor', vendors.some(name => canon(result.vendor).includes(canon(name))));
  if (has('documentType')) check('documentType', result.documentType === expected.documentType);
  if (has('date')) check('date', expected.date ? result.date === expected.date : !result.date);
  if (has('currency')) check('currency', canon(result.currency) === canon(expected.currency));
  if (has('invoiceNumber')) check('invoiceNumber', (Array.isArray(expected.invoiceNumber) ? expected.invoiceNumber : [expected.invoiceNumber]).map(canon).includes(canon(result.invoiceNumber)));
  if (has('orderNumber')) check('orderNumber', canon(result.orderNumber) === canon(expected.orderNumber));
  for (const field of ['amountHT', 'tvaAmount', 'amountTTC'] as const) if (has(field)) check(field, money(result[field], expected[field]));
  if (has('tvaRate')) check('tvaRate', exactish(result.tvaRate, expected.tvaRate));
  if (has('paymentEvidence')) {
    // « paid » ou « unpaid » affirmés sans être attendus = inventé ; « unknown » est prudent, jamais compté faux.
    const allowed: string[] = Array.isArray(expected.paymentEvidence) ? expected.paymentEvidence : [expected.paymentEvidence];
    check('paymentEvidence', !(['paid', 'unpaid'].includes(result.paymentEvidence) && !allowed.includes(result.paymentEvidence)));
  }
  const items: any[] = Array.isArray(result.items) ? result.items : [];
  const expectedItems: any[] = Array.isArray(expected.items) ? expected.items : [];
  let lineRight = 0;
  if (Array.isArray(expected.items)) check('items.count', items.length === expectedItems.length);
  expectedItems.forEach((line, index) => {
    const actual = items[index];
    if (!actual) { wrong.push(`items.${index}`); return; }
    const fails: string[] = [], on = (key: string) => Object.prototype.hasOwnProperty.call(line, key);
    // Un cas peut ne juger que certains champs de ligne (doc7 : nom, nature, montant) : seul ce qui est écrit est jugé.
    if (on('name') && !canon(actual.name).includes(canon(line.name))) fails.push('name');
    if (on('quantity') && !exactish(actual.quantity, line.quantity ?? null)) fails.push('quantity');
    if (on('unit') && !(line.unit === '' ? !actual.unit : unitCanon(actual.unit) === unitCanon(line.unit))) fails.push('unit');
    if (on('price') && !money(actual.price, line.price ?? null)) fails.push('price');
    if (on('amountTTC') && !money(actual.amountTTC, line.amountTTC ?? null)) fails.push('amountTTC');
    if (Array.isArray(line.kind) && !line.kind.includes(actual.kind)) fails.push('kind');
    if (!fails.length) lineRight++;
    fails.forEach(field => wrong.push(`items.${index}.${field}`));
  });
  return { judged, right, lineJudged: expectedItems.length, lineRight, wrong };
}

// ---------------------------------------------------------------------------------------------------------------------
// Agrégation par variante
// ---------------------------------------------------------------------------------------------------------------------
export interface VariantStats {
  draws: number; failures: number; judged: number; right: number; lineJudged: number; lineRight: number;
  fauxVerts: number; fauxCorriges: number; alertesJustes: number; alertesInutiles: number; vraisVerts: number;
  statuts: Record<string, number>; inutilesCodes: Record<string, number>; ms: number[]; costMicro: number[]; calls: number[]; thirdFrom: Record<string, number>; secondRead: number; defects: string[];
}
export interface DrawVerdict { doc: string; tirage: number; variant: string; status: string | null; wrong: string[]; verdict: Verdict | null }

const median = (values: number[]) => { if (!values.length) return null; const s = [...values].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function judgeBench(records: DrawRecord[], cases: BenchCase[]): { stats: Record<string, VariantStats>; draws: DrawVerdict[] } {
  const byId = new Map(cases.map(c => [c.id, c]));
  const blank = (): VariantStats => ({ draws: 0, failures: 0, judged: 0, right: 0, lineJudged: 0, lineRight: 0, fauxVerts: 0, fauxCorriges: 0, alertesJustes: 0, alertesInutiles: 0, vraisVerts: 0,
    statuts: {}, inutilesCodes: {}, ms: [], costMicro: [], calls: [], thirdFrom: {}, secondRead: 0, defects: [] });
  const stats: Record<string, VariantStats> = Object.fromEntries(variantIds(records).map(v => [v, blank()]));
  const draws: DrawVerdict[] = [];
  for (const record of records) {
    const expected = byId.get(record.doc)?.expected;
    if (!expected) throw new Error(`Cas inconnu : ${record.doc}.`);
    for (const variant of orderVariants(Object.keys(record.variants))) {
      const run = record.variants[variant], stat = stats[variant];
      stat.draws++;
      stat.ms.push(run.ms); stat.costMicro.push(run.costMicroChf); stat.calls.push(run.calls);
      if (run.thirdFrom) stat.thirdFrom[run.thirdFrom] = (stat.thirdFrom[run.thirdFrom] ?? 0) + 1;
      if (run.ids.length >= 2 && run.ids.some(id => /2$/.test(id))) stat.secondRead++;
      if (!run.result) { stat.failures++; draws.push({ doc: record.doc, tirage: record.tirage, variant, status: null, wrong: [], verdict: null }); continue; }
      const verdict = judgeResult(run.result, expected), status: string = run.result.review?.status ?? 'inconnu';
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
      draws.push({ doc: record.doc, tirage: record.tirage, variant, status, wrong: verdict.wrong, verdict });
    }
  }
  return { stats, draws };
}

// ---------------------------------------------------------------------------------------------------------------------
// Contrôle de la sortie simulée : chaque fausse réponse fabriquée qui atteint un résultat final est retrouvée
// ---------------------------------------------------------------------------------------------------------------------
export interface SimulationCheck { present: number; found: number; missed: string[]; cleanDraws: number; cleanWrong: string[]; fauxVerts: number; ok: boolean }
export function checkSimulation(records: DrawRecord[], draws: DrawVerdict[], applied: AppliedFault[]): SimulationCheck {
  let present = 0, found = 0;
  const missed: string[] = [];
  for (const entry of applied) {
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
  const cleanWrong = clean.filter(item => item.wrong.length).map(item => `${item.doc} tirage ${item.tirage} ${item.variant} : ${item.wrong.join(', ')}`);
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
  lines.push(L('Durée médiane du parcours', s => sec(median0(s.ms))));
  lines.push(L('Durée maximale du parcours', s => sec(s.ms.length ? Math.max(...s.ms) : null)));
  lines.push(L('Appels (total · moyenne par parcours)', s => `${totalOf(s.calls)} · ${s.calls.length ? (totalOf(s.calls) / s.calls.length).toFixed(2).replace('.', ',') : '—'}`));
  lines.push(L('Coût médian par parcours (CHF)', s => francs(median0(s.costMicro))));
  lines.push(L('Coût total comme en production (CHF)', s => francs(totalOf(s.costMicro))));
  lines.push('', `Dépense réelle de cette passe (appels distincts, 3ᵉ lectures partagées comptées une fois${lentCount ? `, ${lentCount} lectures prêtées par ${meta.reprendre ?? 'une sortie précédente'} non comptées` : ''}) : ${francs(realCost)} CHF pour ${real.length} appels.`, '');
  lines.push('## Statuts finaux', '', heads, rule);
  for (const status of ['checked', 'corrected', 'disputed', 'unavailable']) lines.push(L(status, s => String(s.statuts[status] ?? 0)));
  if (draws.length) lines.push('', '## Par document (champs justes/jugés · lignes justes/jugées · FV = faux verts)', '', ...renderPerDocument(draws, ids));
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
  lines.push('', '## Par document (champs justes/jugés · lignes justes/jugées · FV = faux verts)', '', ...renderPerDocument(draws, ids), '');

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
function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--');
  const valueOfMd = args.indexOf('--hors-ligne-md') >= 0 ? args.indexOf('--hors-ligne-md') + 1 : -1;
  const dir = args.find((arg, index) => !arg.startsWith('--') && index !== valueOfMd);
  if (!dir) throw new Error('Dossier de sortie du banc manquant.');
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8'));
  const cases = loadCases(file.meta.casFiles?.length ? file.meta.casFiles.map((name: string) => CAS_FILES.find(candidate => path.basename(candidate) === name) ?? name) : CAS_FILES);
  const { stats, draws } = judgeBench(file.records, cases);
  const faultsPath = path.join(dir, 'faults.json');
  const simulation = existsSync(faultsPath) ? checkSimulation(file.records, draws, JSON.parse(readFileSync(faultsPath, 'utf8')).applied) : undefined;
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
    if (simulation.ok) console.log(`BANC SIMULE OK — ${simulation.found}/${simulation.present} fausses réponses fabriquées retrouvées, ${simulation.fauxVerts} faux verts comptés, ${simulation.cleanDraws} parcours propres sans champ faux, aucun réseau.`);
    else { console.log(`BANC SIMULE ECHEC — retrouvées ${simulation.found}/${simulation.present}, manquées : ${simulation.missed.join(' ; ') || 'aucune'}, champs faux sur parcours propres : ${simulation.cleanWrong.join(' ; ') || 'aucun'}, faux verts ${simulation.fauxVerts}.`); process.exit(1); }
  } else console.log(`Tableau : ${target}`);
}
/** vite-node ne laisse pas le nom du script dans process.argv : le jugement se lance avec un dossier de banc, jamais sous vitest. */
const rest = process.argv.slice(2).filter(arg => arg !== '--');
if (!process.env.VITEST && rest.some(arg => !arg.startsWith('--')) && !rest.includes('--simuler') && !rest.includes('--payant') && !rest.includes('--hors-ligne')) main();
