/**
 * Banc d'embeddings Gemini (15.11) : Fuse seul, embeddings (cosinus kNN), hybride (fusion RRF), Flash-Lite en classeur, et hybride + Flash-Lite
 * en réordonnancement. Trois tâches : T1 ligne de devis -> besoin « À venir », T2 note -> rubrique de l'Atelier, T3 houblon proche
 * (a : « proche de X », vérité = substituts de la source ; b : description libre, vérité écrite à la main).
 *
 *   npx vite-node --config vitest.config.ts work/missions/2026-11-15-embeddings/banc.ts -- --simuler
 *   npx vite-node --config vitest.config.ts work/missions/2026-11-15-embeddings/banc.ts -- --payant --budget-chf 4.5 --confirm-paid-ai [--limite 3]
 *
 * Jamais dans `npm test`. Clé lue par `readLocalKey` (jamais affichée). Coût réservé avant chaque appel, arrêt dur au plafond (4,5 CHF).
 * Cache des appels déjà payés : `os.tmpdir()/embeddings-banc-cache.json` (un appel payé ne l'est pas deux fois). Journal : section 15.11 de
 * `work/missions/2026-11-08-enrichissement/journal-gemini.md`. Les sorties (`resultats.json`) ne portent que des données fictives ou publiques.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSearch, normalize } from '../../../src/services/search';
import { quoteGeminiCost, observedGeminiCostDetails } from '../../../functions/src/geminiCosts';
import { GEMINI_LITE_MODEL } from '../../../functions/src/models';
// @ts-ignore module .mjs sans types
import { readLocalKey, redact, observedModelMatches } from '../../../scripts/gemini-usage-bench-guard.mjs';
import { BESOINS, LIGNES, RUBRIQUES, NOTES, HOUBLONS_LIBRES, type Doc, type Query } from './corpus';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const JOURNAL = path.join(ROOT, 'work/missions/2026-11-08-enrichissement/journal-gemini.md');
const CACHE = path.join(os.tmpdir(), 'embeddings-banc-cache.json');
const OUT = path.join(HERE, process.argv.includes('--payant') ? 'resultats.json' : 'resultats-simule.json');
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const CHF_PER_USD = 1.25;
const DIM = 768;
const EMB_MODELS: Record<string, { usdPerM: number }> = { 'gemini-embedding-2': { usdPerM: 0.20 }, 'gemini-embedding-001': { usdPerM: 0.15 } };
const MAIN_EMB = 'gemini-embedding-2';
const LLM = GEMINI_LITE_MODEL;
const HARD_CAP_CHF = 4.5;
const RRF_K = 60;

// ------------------------------------------------------------------------------------------------ arguments
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const PAID = flag('--payant');
const SIM = !PAID;
if (PAID && !flag('--confirm-paid-ai')) throw new Error('Mode payant : --confirm-paid-ai exigé. Aucun appel.');
const budgetChf = Number(value('--budget-chf') ?? HARD_CAP_CHF);
if (PAID && !(budgetChf > 0 && budgetChf <= HARD_CAP_CHF)) throw new Error(`--budget-chf attendu entre 0 et ${HARD_CAP_CHF}. Aucun appel.`);
const LIMIT = value('--limite') ? Number(value('--limite')) : undefined;
const ONLY = value('--taches')?.split(',');

// ------------------------------------------------------------------------------------------------ budget et cache
class BudgetStop extends Error {}
const cache: { emb: Record<string, any>; llm: Record<string, any>; spentMicro: number } = fs.existsSync(CACHE) && PAID
  ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { emb: {}, llm: {}, spentMicro: 0 };
let dirty = 0;
const saveCache = () => { if (PAID) { fs.writeFileSync(CACHE, JSON.stringify(cache)); dirty = 0; } };
const limitMicro = Math.round(budgetChf * 1e6);
let reserved = 0;
function reserve(micro: number) {
  if (cache.spentMicro + reserved + micro > limitMicro) throw new BudgetStop(`Budget atteint : ${(cache.spentMicro / 1e6).toFixed(4)} CHF dépensés, cet appel en réserverait ${(micro / 1e6).toFixed(4)} sur ${budgetChf} CHF. Arrêt net.`);
  reserved += micro;
}
function settle(reservedMicro: number, actual: number) { reserved -= reservedMicro; cache.spentMicro += actual; }

const key: string | undefined = PAID ? readLocalKey() : undefined;
if (PAID && !key) throw new Error('Aucune clé Gemini locale. Aucun appel.');
const clean = (text: string) => (key ? redact(text, key) : text);

// ------------------------------------------------------------------------------------------------ journal
const SECTION = '## 15.11 — banc d\'embeddings (mission 2026-11-15-embeddings)';
function journal(row: string) {
  if (SIM) return;
  let text = fs.readFileSync(JOURNAL, 'utf8');
  if (!text.includes(SECTION)) {
    text = text.replace(/\s*$/, '\n') + `\n${SECTION}\n\nUne ligne par appel de classeur (Flash-Lite) et par lot d'embeddings (tâche × modèle × rôle). Aucune valeur personnelle : pièces fictives ou publiques. Coûts au tarif provisionné (1,25 CHF/USD ; embeddings : 0,20 $ le million de jetons pour gemini-embedding-2, 0,15 $ pour gemini-embedding-001, tarif payant lu sur ai.google.dev/gemini-api/docs/pricing le 15.11 ; Flash-Lite via \`geminiCosts.ts\`). Plafond de ce banc : ${HARD_CAP_CHF} CHF.\n\n| date | tâche | variante | modèle | durée | entrée | sortie | coût CHF | cumul CHF | état |\n|---|---|---|---|---|---|---|---|---|---|\n`;
    fs.writeFileSync(JOURNAL, text);
  }
  fs.appendFileSync(JOURNAL, row + '\n');
}
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const chf6 = (micro: number) => (micro / 1e6).toFixed(6);

// ------------------------------------------------------------------------------------------------ outils
async function pool<T, R>(items: T[], size: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function post(url: string, body: unknown): Promise<{ ok: boolean; status: number; json: any; ms: number }> {
  let last: any;
  for (let attempt = 0; attempt < 4; attempt++) {
    const t0 = performance.now();
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key! }, body: JSON.stringify(body) });
    const ms = Math.round(performance.now() - t0);
    const json: any = await res.json().catch(() => ({}));
    last = { ok: res.ok, status: res.status, json, ms };
    if (res.ok || ![429, 500, 502, 503, 504].includes(res.status)) return last;
    await sleep(1500 * (attempt + 1));
  }
  return last;
}
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };
const p95 = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)] : 0; };
const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

// ------------------------------------------------------------------------------------------------ embeddings
const fmt = (model: string, role: 'query' | 'doc', title: string, text: string) =>
  model === 'gemini-embedding-2' ? (role === 'query' ? `task: search result | query: ${text}` : `title: ${title || 'none'} | text: ${text}`) : text;

/** Vecteur simulé (aucun réseau) : trigrammes de caractères hachés. Sert seulement à prouver la tuyauterie. */
function fakeVector(text: string): number[] {
  const v = new Array(256).fill(0);
  const s = normalize(text);
  for (let i = 0; i + 3 <= s.length; i++) { let h = 7; for (const c of s.slice(i, i + 3)) h = (h * 31 + c.charCodeAt(0)) % 256; v[h] += 1; }
  return v;
}
interface Emb { v: number[]; ms: number; tok: number; micro: number }
async function embed(model: string, role: 'query' | 'doc', title: string, text: string): Promise<Emb> {
  if (SIM) return { v: fakeVector(`${title} ${text}`), ms: 1, tok: 0, micro: 0 };
  const sent = fmt(model, role, title, text);
  const ck = `${model}|${role}|${sent}`;
  if (cache.emb[ck]) return cache.emb[ck];
  const estTok = Math.ceil(Buffer.byteLength(sent) / 2);
  const rate = EMB_MODELS[model].usdPerM * CHF_PER_USD; // micro-CHF par jeton
  const hold = Math.ceil(estTok * rate);
  reserve(hold);
  try {
    const body: any = { model: `models/${model}`, content: { parts: [{ text: sent }] }, outputDimensionality: DIM };
    if (model === 'gemini-embedding-001') { body.taskType = role === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT'; if (role === 'doc' && title) body.title = title; }
    const r = await post(`${BASE}/${model}:embedContent`, body);
    if (!r.ok) throw new Error(`embedContent ${model} HTTP ${r.status} ${clean(JSON.stringify(r.json?.error ?? r.json).slice(0, 200))}`);
    const values: number[] | undefined = r.json?.embedding?.values ?? r.json?.embeddings?.[0]?.values;
    if (!Array.isArray(values) || !values.length) throw new Error(`embedContent ${model} : réponse sans vecteur`);
    const tok = Number(r.json?.usageMetadata?.promptTokenCount) || estTok; // sans relevé, le plafond estimé (jamais zéro)
    const micro = Math.ceil(tok * rate);
    const e: Emb = { v: values.map(x => Math.round(x * 1e5) / 1e5), ms: r.ms, tok, micro };
    cache.emb[ck] = e;
    settle(hold, micro);
    if (++dirty >= 40) saveCache();
    return e;
  } catch (error) { reserved -= hold; throw error; }
}
const cosine = (a: number[], b: number[]) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / (Math.sqrt(x * y) || 1); };

// ------------------------------------------------------------------------------------------------ classeur Flash-Lite
interface Llm { ranking: string[]; ms: number; inTok: number; outTok: number; micro: number; status: string }
async function classer(task: string, variant: string, qid: string, system: string, user: string, valid: Set<string>): Promise<Llm> {
  if (SIM) return { ranking: [], ms: 1, inTok: 0, outTok: 0, micro: 0, status: 'SIMULÉ' };
  const ck = `${task}|${variant}|${qid}|${user.length}|${system.length}`;
  if (cache.llm[ck]) return cache.llm[ck];
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 1500, responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'LOW' },
      responseSchema: { type: 'OBJECT', properties: { ranking: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['ranking'] } }
  };
  const quote = quoteGeminiCost(LLM, body);
  reserve(quote.reservedMicroChf);
  let status = 'ok', micro = 0, ranking: string[] = [], ms = 0, inTok = 0, outTok = 0;
  try {
    const r = await post(`${BASE}/${LLM}:generateContent`, quote.body);
    ms = r.ms;
    if (!r.ok) { status = `HTTP ${r.status}`; throw new Error(clean(JSON.stringify(r.json?.error ?? r.json).slice(0, 200))); }
    const details = observedGeminiCostDetails(quote, r.json);
    micro = details?.chargedMicroChf ?? quote.reservedMicroChf;
    inTok = r.json.usageMetadata?.promptTokenCount ?? 0;
    outTok = (r.json.usageMetadata?.candidatesTokenCount ?? 0) + (r.json.usageMetadata?.thoughtsTokenCount ?? 0);
    if (!observedModelMatches(LLM, r.json.modelVersion)) status = `modèle inattendu (${r.json.modelVersion})`;
    else {
      const text = r.json.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
      try { const parsed = JSON.parse(text); ranking = (Array.isArray(parsed.ranking) ? parsed.ranking : []).map(String).filter((id: string, i: number, a: string[]) => valid.has(id) && a.indexOf(id) === i).slice(0, 3); }
      catch { status = 'JSON illisible'; }
    }
  } finally { settle(quote.reservedMicroChf, micro); }
  const out: Llm = { ranking, ms, inTok, outTok, micro, status };
  cache.llm[ck] = out;
  journal(`| ${now()} | ${task} | ${variant} ${qid} | ${LLM} | ${ms} ms | ${inTok} | ${outTok} | ${chf6(micro)} | ${chf6(cache.spentMicro)} | ${status} |`);
  if (++dirty >= 40) saveCache();
  return out;
}

// ------------------------------------------------------------------------------------------------ tâches
interface TaskDef {
  name: string; docs: Doc[]; queries: Query[]; system: string; abstain: boolean; rerank: boolean;
  /** Ce que le classeur voit d'une liste d'entrées (ids = classes). */
  listing: (shown: Doc[]) => string;
}
const listDefault = (shown: Doc[]) => shown.map(d => `${d.cls ?? d.id} | ${d.title} | ${d.text}`).join('\n');
const SYS_BASE = 'Tu es un classeur pour la gestion d\'une micro-brasserie. Réponds uniquement par un objet JSON {"ranking":[...]} : les identifiants des entrées qui conviennent, de la meilleure à la moins bonne, trois au plus. ';

function hopDesc(f: any): string {
  const fr: Record<string, string> = { citrus: 'agrumes', tropicalFruit: 'fruits tropicaux', stoneFruit: 'fruits à noyau', berry: 'baies', floral: 'floral', grassy: 'herbe', herbal: 'herbes', spice: 'épices', resinPine: 'résine et pin' };
  const purpose: Record<string, string> = { aroma: 'aromatique', dual: 'double usage', bittering: 'amérisant' };
  const aromas = Object.entries(f.aroma).filter(([, v]) => Number(v) > 0).map(([k, v]) => `${fr[k] ?? k} ${v}`).join(', ');
  return `${purpose[f.purpose] ?? f.purpose ?? 'usage inconnu'}. Arômes (0 à 5) : ${aromas || 'aucun noté'}. Styles : ${(f.styles ?? []).slice(0, 4).join(', ') || 'non renseignés'}.`;
}
function buildTasks(): TaskDef[] {
  const fiches: any[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/hopBeerMaverickFiches.json'), 'utf8')).filter((f: any) => f.aroma && Object.keys(f.aroma).length);
  const hopDocs: Doc[] = fiches.map(f => ({ id: f.id, title: f.name, text: hopDesc(f) }));
  const byName = new Map(fiches.map(f => [f.name, f.id]));
  const ids = new Set(fiches.map(f => f.id));
  // Les substituts d'un houblon d'amérisation se choisissent sur l'alpha, que les fiches du corpus ne portent pas (1re passe, tous les houblons : 4/30 au rang 1
  // pour chaque méthode, la vérité n'était pas dans les documents). On ne garde donc que les houblons aromatiques ou à double usage, dont les arômes disent la proximité.
  const candidats = fiches.filter(f => f.purpose !== 'bittering' && (f.substituts ?? []).filter((s: any) => ids.has(s.id) && s.id !== f.id).length >= 2).sort((a, b) => a.name.localeCompare(b.name));
  const procheDe: Query[] = candidats.filter((_, i) => i % 3 === 0).slice(0, 30).map((f, i) => ({
    id: `P${String(i + 1).padStart(2, '0')}`, text: `Houblon proche de ${f.name} : ${hopDesc(f)}`, exclude: f.id,
    truth: f.substituts.filter((s: any) => ids.has(s.id) && s.id !== f.id).map((s: any) => s.id), src: `substituts publiés par la source pour ${f.name}`
  }));
  const libres: Query[] = HOUBLONS_LIBRES.map(h => ({ ...h, truth: h.truth!.map(name => { const id = byName.get(name); if (!id) throw new Error(`Houblon hors corpus dans la vérité ${h.id} : ${name}`); return id; }) }));
  const t2docs: Doc[] = [
    ...RUBRIQUES.map(r => ({ id: `R-${r.id}`, cls: r.id, title: r.label, text: r.description })),
    ...RUBRIQUES.flatMap(r => r.exemples.map((e, i) => ({ id: `E-${r.id}-${i}`, cls: r.id, title: r.label, text: e })))
  ];
  const t2list = () => RUBRIQUES.map(r => `${r.id} | ${r.label} | ${r.description} Exemples : ${r.exemples.join(' / ')}`).join('\n');
  return [
    { name: 'T1', docs: BESOINS, queries: LIGNES, abstain: true, rerank: true, listing: listDefault,
      system: SYS_BASE + 'La demande est une ligne de devis ou de facture d\'un fournisseur (français, allemand ou italien, souvent sans accents). La liste donne les besoins d\'achat « À venir » de la brasserie : renvoie le besoin que cette ligne sert à payer. Une marchandise courante (malt, houblon, levure, nettoyage, frais de port, remise, livraison) n\'est liée à aucun besoin : renvoie alors une liste vide.' },
    { name: 'T2', docs: t2docs, queries: NOTES, abstain: false, rerank: false, listing: t2list,
      system: SYS_BASE + 'La demande est une note en vrac d\'un brasseur. La liste donne les rubriques de son Atelier, avec des exemples : renvoie la rubrique où ranger la note.' },
    { name: 'T3a', docs: hopDocs, queries: procheDe, abstain: false, rerank: true, listing: listDefault,
      system: SYS_BASE + 'La demande décrit un houblon de référence. La liste donne des houblons avec leurs arômes : renvoie les houblons les plus proches du houblon de référence, sans jamais renvoyer le houblon de référence lui-même.' },
    { name: 'T3b', docs: hopDocs, queries: libres, abstain: false, rerank: true, listing: listDefault,
      system: SYS_BASE + 'La demande décrit en mots libres le houblon cherché. La liste donne des houblons avec leurs arômes : renvoie ceux qui conviennent le mieux.' }
  ];
}

// ------------------------------------------------------------------------------------------------ évaluation
const METHODES = ['fuse', 'emb2', 'emb001', 'hybride', 'classeur', 'hybride+llm'] as const;
type Methode = typeof METHODES[number];
interface Run { ranks: string[]; score: number; ms: number; micro: number; status?: string }

function uniqueClasses(docs: Doc[], order: number[], exclude?: string): string[] {
  const out: string[] = [];
  for (const i of order) { const c = docs[i].cls ?? docs[i].id; if (c === exclude || (docs[i].id === exclude)) continue; if (!out.includes(c)) out.push(c); }
  return out;
}
function rrf(lists: string[][]): { ranks: string[]; top: number } {
  const score = new Map<string, number>();
  for (const l of lists) l.forEach((c, r) => score.set(c, (score.get(c) ?? 0) + 1 / (RRF_K + r + 1)));
  const ranks = [...score.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
  return { ranks, top: ranks.length ? score.get(ranks[0])! : 0 };
}
const hit = (ranks: string[], truth: string[] | null, k: number) => !!truth && ranks.slice(0, k).some(c => truth.includes(c));

async function evalTask(t: TaskDef) {
  const queries = LIMIT ? t.queries.slice(0, LIMIT) : t.queries;
  console.log(`[${t.name}] ${t.docs.length} entrées, ${queries.length} requêtes`);
  const fuse = createSearch(t.docs, ['title', 'text']);
  const emb: Record<string, { docs: Emb[]; queries: Emb[] }> = {};
  for (const model of Object.keys(EMB_MODELS)) {
    const spent0 = cache.spentMicro;
    const docs = await pool(t.docs, 6, d => embed(model, 'doc', d.title, d.text));
    const qs = await pool(queries, 6, q => embed(model, 'query', '', q.text));
    emb[model] = { docs, queries: qs };
    journal(`| ${now()} | ${t.name} | embeddings ×${t.docs.length} entrées + ×${queries.length} requêtes | ${model} | ${Math.round(mean(qs.map(e => e.ms)))} ms/requête | ${[...docs, ...qs].reduce((s, e) => s + e.tok, 0)} | - | ${chf6(cache.spentMicro - spent0)} | ${chf6(cache.spentMicro)} | ok |`);
  }
  const hybridTopFor = (qi: number) => {
    const q = queries[qi];
    const t0 = performance.now();
    const res = fuse.search(normalize(q.text));
    const fuseMs = performance.now() - t0;
    const fuseRanks = uniqueClasses(t.docs, res.map(r => r.refIndex), q.exclude);
    const sims = emb[MAIN_EMB].docs.map(d => cosine(emb[MAIN_EMB].queries[qi].v, d.v));
    const embRanks = uniqueClasses(t.docs, sims.map((_, i) => i).sort((a, b) => sims[b] - sims[a]), q.exclude);
    return { fuseRanks, fuseTop: res.length ? 1 - (res[0].score ?? 1) : 0, fuseMs, embRanks, h: rrf([fuseRanks, embRanks]) };
  };
  const runs: Record<Methode, Run[]> = { fuse: [], emb2: [], emb001: [], hybride: [], classeur: [], 'hybride+llm': [] };
  const validIds = new Set(t.docs.map(d => d.cls ?? d.id));
  const firstDocOf = (c: string) => t.docs.find(d => (d.cls ?? d.id) === c)!;
  // Le classeur et le réordonnancement : appels groupés par trois.
  const llmFull = await pool(queries, 3, (q, i) => classer(t.name, 'classeur', q.id, t.system, `Demande : ${q.text}\n\nListe :\n${t.listing(t.docs.filter(d => (d.cls ?? d.id) !== q.exclude))}`, validIds));
  const llmRerank = t.rerank ? await pool(queries, 3, (q, i) => {
    const top = hybridTopFor(i).h.ranks.slice(0, 10).map(firstDocOf);
    return classer(t.name, 'hybride+llm', q.id, t.system, `Demande : ${q.text}\n\nListe (présélection) :\n${t.listing(top)}`, new Set(top.map(d => d.cls ?? d.id)));
  }) : [];
  queries.forEach((q, i) => {
    const h = hybridTopFor(i);
    runs.fuse.push({ ranks: h.fuseRanks, score: h.fuseTop, ms: h.fuseMs, micro: 0 });
    for (const [m, label] of [[MAIN_EMB, 'emb2'], ['gemini-embedding-001', 'emb001']] as const) {
      const sims = emb[m].docs.map(d => cosine(emb[m].queries[i].v, d.v));
      const ranks = uniqueClasses(t.docs, sims.map((_, k) => k).sort((a, b) => sims[b] - sims[a]), q.exclude);
      const top = Math.max(...sims.filter((_, k) => (t.docs[k].cls ?? t.docs[k].id) !== q.exclude));
      runs[label].push({ ranks, score: top, ms: emb[m].queries[i].ms, micro: emb[m].queries[i].micro });
    }
    runs.hybride.push({ ranks: h.h.ranks, score: h.h.top, ms: emb[MAIN_EMB].queries[i].ms + h.fuseMs, micro: emb[MAIN_EMB].queries[i].micro });
    runs.classeur.push({ ranks: llmFull[i].ranking, score: llmFull[i].ranking.length ? 1 : 0, ms: llmFull[i].ms, micro: llmFull[i].micro, status: llmFull[i].status });
    if (t.rerank) runs['hybride+llm'].push({ ranks: llmRerank[i].ranking, score: llmRerank[i].ranking.length ? 1 : 0, ms: emb[MAIN_EMB].queries[i].ms + h.fuseMs + llmRerank[i].ms, micro: emb[MAIN_EMB].queries[i].micro + llmRerank[i].micro, status: llmRerank[i].status });
  });

  const withTruth = queries.map((q, i) => i).filter(i => queries[i].truth);
  const rows: Record<string, any> = {};
  for (const m of METHODES) {
    if (m === 'hybride+llm' && !t.rerank) continue;
    const r = runs[m];
    const entry: any = {
      n: withTruth.length,
      rappel1: withTruth.filter(i => hit(r[i].ranks, queries[i].truth, 1)).length,
      rappel3: withTruth.filter(i => hit(r[i].ranks, queries[i].truth, 3)).length,
      latenceMedianeMs: median(r.map(x => x.ms)), latenceP95Ms: p95(r.map(x => x.ms)),
      coutParPieceChf: mean(r.map(x => x.micro)) / 1e6,
      erreurs: r.filter(x => x.status && x.status !== 'ok' && x.status !== 'SIMULÉ').length
    };
    if (t.abstain) {
      // Abstention : seuil choisi sur les lignes de rang pair, jugé sur les lignes de rang impair (L20).
      const labelled = queries.map((q, i) => ({ i, has: !!q.truth }));
      const best = (() => {
        const train = labelled.filter(x => x.i % 2 === 0);
        const cuts = [...new Set(train.map(x => r[x.i].score))].sort((a, b) => a - b);
        let bestCut = 0, bestAcc = -1;
        for (const c of cuts.concat([Infinity])) {
          const pos = train.filter(x => x.has), neg = train.filter(x => !x.has);
          const acc = (pos.filter(x => r[x.i].score >= c).length / Math.max(1, pos.length) + neg.filter(x => r[x.i].score < c).length / Math.max(1, neg.length)) / 2;
          if (acc > bestAcc) { bestAcc = acc; bestCut = c; }
        }
        return bestCut;
      })();
      const test = labelled.filter(x => x.i % 2 === 1);
      const pos = test.filter(x => x.has), neg = test.filter(x => !x.has);
      const accepts = (i: number) => m === 'classeur' || m === 'hybride+llm' ? r[i].ranks.length > 0 : r[i].score >= best;
      entry.abstention = { seuil: Number.isFinite(best) ? Math.round(best * 1000) / 1000 : null, sansBesoinRejetes: neg.filter(x => !accepts(x.i)).length, sansBesoin: neg.length, avecBesoinAcceptes: pos.filter(x => accepts(x.i)).length, avecBesoin: pos.length };
      // Lien juste : accepté ET premier rang correct, sur la moitié impaire.
      entry.abstention.liensJustes = pos.filter(x => accepts(x.i) && hit(r[x.i].ranks, queries[x.i].truth, 1)).length;
      entry.abstention.fauxLiens = neg.filter(x => accepts(x.i)).length;
    }
    rows[m] = entry;
  }
  // Détail par requête (pour relire les ratés) : jamais de données personnelles, corpus fictif ou public.
  const detail = queries.map((q, i) => ({ id: q.id, texte: q.text.slice(0, 90), vérité: q.truth, fuse: runs.fuse[i].ranks.slice(0, 3), emb2: runs.emb2[i].ranks.slice(0, 3), hybride: runs.hybride[i].ranks.slice(0, 3), classeur: runs.classeur[i].ranks, ...(t.rerank ? { 'hybride+llm': runs['hybride+llm'][i].ranks } : {}) }));
  const indexation: Record<string, any> = {};
  for (const m of Object.keys(EMB_MODELS)) indexation[m] = { jetons: emb[m].docs.reduce((s, e) => s + e.tok, 0), chf: emb[m].docs.reduce((s, e) => s + e.micro, 0) / 1e6 };
  return { tache: t.name, entrees: t.docs.length, requetes: queries.length, avecVerite: withTruth.length, methodes: rows, indexation, detail };
}

async function main() {
  const tasks = buildTasks().filter(t => !ONLY || ONLY.includes(t.name));
  const results: any[] = [];
  let stopped: string | undefined;
  try { for (const t of tasks) results.push(await evalTask(t)); }
  catch (error) { if (error instanceof BudgetStop) stopped = error.message; else { saveCache(); throw new Error(clean(String((error as Error)?.message ?? error))); } }
  saveCache();
  const report = { date: now(), mode: SIM ? 'simulé' : 'payant', modeles: { embeddings: Object.keys(EMB_MODELS), dimensions: DIM, classeur: LLM }, depenseChf: cache.spentMicro / 1e6, plafondChf: budgetChf, arretBudget: stopped ?? null, taches: results };
  if (!LIMIT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  for (const r of results) {
    console.log(`\n${r.tache} (${r.avecVerite} requêtes avec vérité)`);
    for (const [m, e] of Object.entries<any>(r.methodes))
      console.log(`  ${m.padEnd(12)} @1 ${e.rappel1}/${e.n}  @3 ${e.rappel3}/${e.n}  p50 ${e.latenceMedianeMs} ms  p95 ${e.latenceP95Ms} ms  ${(e.coutParPieceChf * 1000).toFixed(4)} mCHF/pièce${e.erreurs ? `  ERREURS ${e.erreurs}` : ''}${e.abstention ? `  abst. ${e.abstention.sansBesoinRejetes}/${e.abstention.sansBesoin} rejets, ${e.abstention.liensJustes}/${e.abstention.avecBesoin} liens justes` : ''}`);
  }
  console.log(`\nDépense cumulée : ${(cache.spentMicro / 1e6).toFixed(4)} CHF sur ${budgetChf}${stopped ? `\nARRÊT BUDGET : ${stopped}` : ''}`);
  console.log(SIM ? 'BANC SIMULE OK' : 'BANC PAYANT FINI');
}
main().catch(error => { console.error(clean(String(error?.message ?? error))); process.exit(1); });
