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
import { CAS_FILES, MISSION_DIR, VARIANTS, VARIANT_LABEL, loadCases, valueAtPath, type AppliedFault, type BenchCase, type DrawRecord, type VariantId } from './banc-lecture-facture';

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
export interface DrawVerdict { doc: string; tirage: number; variant: VariantId; status: string | null; wrong: string[]; verdict: Verdict | null }

const median = (values: number[]) => { if (!values.length) return null; const s = [...values].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function judgeBench(records: DrawRecord[], cases: BenchCase[]): { stats: Record<VariantId, VariantStats>; draws: DrawVerdict[] } {
  const byId = new Map(cases.map(c => [c.id, c]));
  const blank = (): VariantStats => ({ draws: 0, failures: 0, judged: 0, right: 0, lineJudged: 0, lineRight: 0, fauxVerts: 0, fauxCorriges: 0, alertesJustes: 0, alertesInutiles: 0, vraisVerts: 0,
    statuts: {}, inutilesCodes: {}, ms: [], costMicro: [], calls: [], thirdFrom: {}, secondRead: 0, defects: [] });
  const stats = Object.fromEntries(VARIANTS.map(v => [v, blank()])) as Record<VariantId, VariantStats>;
  const draws: DrawVerdict[] = [];
  for (const record of records) {
    const expected = byId.get(record.doc)?.expected;
    if (!expected) throw new Error(`Cas inconnu : ${record.doc}.`);
    for (const variant of VARIANTS) {
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
      const label = variant === 'Cp' ? 'C′' : variant;
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
    for (const variant of VARIANTS) {
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

export function renderTable(file: { meta: any; records: DrawRecord[] }, stats: Record<VariantId, VariantStats>, simulation?: SimulationCheck): string {
  const { meta, records } = file;
  const L = (label: string, pick: (s: VariantStats) => string) => `| ${label} | ${VARIANTS.map(v => pick(stats[v])).join(' | ')} |`;
  const total = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const real = records.flatMap(r => r.readings), realCost = total(real.map(r => r.costMicroChf ?? 0));
  const docs = [...new Set(records.map(r => r.doc))];
  const lines: string[] = [];
  lines.push(`# Banc de lecture des factures — résultat${meta.mode === 'simuler' ? ' (SIMULÉ, réponses fabriquées : ne prouve rien sur les modèles)' : ''}`, '');
  lines.push(`Mode ${meta.mode} · ${records.length} parcours (${docs.length} documents × ${meta.repeat} tirages${meta.stopped ? `, arrêté : ${meta.stopped}` : ''}) · modèles ${meta.models.strong} (A, B, 3ᵉ lecture) et ${meta.models.lite} (C, C′) · réflexion LOW, température 0, haute résolution.`);
  lines.push('Aucune valeur des documents ici : des comptes, des durées, des coûts et le nom du champ en défaut. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD), pas une facture.', '');
  lines.push(`| | ${VARIANTS.map(v => VARIANT_LABEL[v]).join(' | ')} |`, `|---|${VARIANTS.map(() => '---').join('|')}|`);
  lines.push(L('Parcours lus (échecs sans résultat)', s => `${s.draws - s.failures} (${s.failures})`));
  lines.push(L('Champs justes / jugés', s => ratio(s.right, s.judged)));
  lines.push(L('Lignes justes / jugées', s => ratio(s.lineRight, s.lineJudged)));
  lines.push(L('**Faux verts** (checked, un champ faux)', s => `**${s.fauxVerts}**`));
  lines.push(L('Faux « corrigés » (corrected, un champ faux)', s => String(s.fauxCorriges)));
  lines.push(L('Alertes justes (disputed / unavailable, vraie erreur)', s => String(s.alertesJustes)));
  lines.push(L('Alertes inutiles (rien de faux)', s => String(s.alertesInutiles)));
  lines.push(L('Verts justes (checked / corrected, tout juste)', s => String(s.vraisVerts)));
  lines.push(L('Durée médiane du parcours', s => sec(median(s.ms))));
  lines.push(L('Durée maximale du parcours', s => sec(s.ms.length ? Math.max(...s.ms) : null)));
  lines.push(L('Appels (total · moyenne par parcours)', s => `${total(s.calls)} · ${s.calls.length ? (total(s.calls) / s.calls.length).toFixed(2).replace('.', ',') : '—'}`));
  lines.push(L('Coût médian par parcours (CHF)', s => francs(median(s.costMicro))));
  lines.push(L('Coût total comme en production (CHF)', s => francs(total(s.costMicro))));
  lines.push('', `Dépense réelle du banc (appels distincts, 3ᵉ lectures prêtées comptées une fois) : ${francs(realCost)} CHF pour ${real.length} appels.`, '');
  lines.push('## Statuts finaux', '', `| | ${VARIANTS.map(v => VARIANT_LABEL[v]).join(' | ')} |`, `|---|${VARIANTS.map(() => '---').join('|')}|`);
  for (const status of ['checked', 'corrected', 'disputed', 'unavailable']) lines.push(L(status, s => String(s.statuts[status] ?? 0)));
  lines.push('', '## Pourquoi sonnent les alertes inutiles (points qui pèsent, tous champs justes)', '');
  for (const v of VARIANTS) lines.push(`- ${VARIANT_LABEL[v]} : ${Object.entries(stats[v].inutilesCodes).sort((a, b) => b[1] - a[1]).map(([code, n]) => `${code} ×${n}`).join(', ') || 'aucune'}`);
  lines.push('', '## Ce que chaque variante a appelé', '');
  lines.push(`- B : la lecture 2 a été appelée dans ${stats.B.secondRead} parcours sur ${stats.B.draws}.`);
  for (const v of ['C', 'Cp'] as const) lines.push(`- ${VARIANT_LABEL[v]} : 3.8 prêtée par A ${stats[v].thirdFrom.A ?? 0} fois, appel 3.8 neuf ${stats[v].thirdFrom.neuf ?? 0} fois, sans 3ᵉ lecture ${stats[v].draws - (stats[v].thirdFrom.A ?? 0) - (stats[v].thirdFrom.neuf ?? 0)} fois.`);
  lines.push('', '## Défauts relevés (nom du champ seulement)', '');
  for (const v of VARIANTS) {
    lines.push(`### ${VARIANT_LABEL[v]}`);
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
    '- B et C′ sont calculés hors ligne depuis les appels réels de A et de C : mêmes réponses, aucun appel de plus (sauf une 3.8 neuve quand C′ en a besoin et que ni A ni C n’en ont).',
    '- La durée d’un parcours est la somme des durées mesurées appel par appel : le plus long des deux appels parallèles, puis la 3ᵉ lecture (A, C, C′) ; la somme séquentielle (B).', '');
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--');
  const dir = args.find(arg => !arg.startsWith('--'));
  if (!dir) throw new Error('Dossier de sortie du banc manquant.');
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8'));
  const cases = loadCases(file.meta.casFiles?.length ? file.meta.casFiles.map((name: string) => CAS_FILES.find(candidate => path.basename(candidate) === name) ?? name) : CAS_FILES);
  const { stats, draws } = judgeBench(file.records, cases);
  const faultsPath = path.join(dir, 'faults.json');
  const simulation = existsSync(faultsPath) ? checkSimulation(file.records, draws, JSON.parse(readFileSync(faultsPath, 'utf8')).applied) : undefined;
  const table = renderTable(file, stats, simulation);
  const target = path.join(dir, 'RESULTAT-BANC.md');
  writeFileSync(target, table);
  for (const v of VARIANTS) {
    const s = stats[v];
    console.log(`${VARIANT_LABEL[v]} : champs ${ratio(s.right, s.judged)}, lignes ${ratio(s.lineRight, s.lineJudged)}, faux verts ${s.fauxVerts}, alertes justes ${s.alertesJustes}, inutiles ${s.alertesInutiles}, échecs ${s.failures}, durée médiane ${sec(median(s.ms))}, coût total ${francs(s.costMicro.reduce((a, b) => a + b, 0))} CHF`);
  }
  if (args.includes('--publier')) {
    if (file.meta.mode !== 'payant') throw new Error('Un tableau simulé ne se publie pas.');
    copyFileSync(target, path.join(MISSION_DIR, 'RESULTAT-BANC.md'));
    console.log(`Publié : ${path.join(MISSION_DIR, 'RESULTAT-BANC.md')}`);
  }
  if (simulation) {
    if (simulation.ok) console.log(`BANC SIMULE OK — ${simulation.found}/${simulation.present} fausses réponses fabriquées retrouvées, ${simulation.fauxVerts} faux verts comptés, ${simulation.cleanDraws} parcours propres sans champ faux, aucun réseau.`);
    else { console.log(`BANC SIMULE ECHEC — retrouvées ${simulation.found}/${simulation.present}, manquées : ${simulation.missed.join(' ; ') || 'aucune'}, champs faux sur parcours propres : ${simulation.cleanWrong.join(' ; ') || 'aucun'}, faux verts ${simulation.fauxVerts}.`); process.exit(1); }
  } else console.log(`Tableau : ${target}`);
}
/** vite-node ne laisse pas le nom du script dans process.argv : le jugement se lance avec un dossier de banc, jamais sous vitest. */
const rest = process.argv.slice(2).filter(arg => arg !== '--');
if (!process.env.VITEST && rest.some(arg => !arg.startsWith('--')) && !rest.includes('--simuler') && !rest.includes('--payant')) main();
