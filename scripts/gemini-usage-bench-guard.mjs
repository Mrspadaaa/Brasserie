/**
 * Garde-fous du banc d'usage Gemini (#91, scripts/gemini-usage-bench.ts).
 *
 * Module sans effet de bord à l'import, en JavaScript pur pour que
 * `node --test scripts/gemini-usage-bench.test.mjs` le vérifie sans vite-node.
 *
 * - Sans enveloppe nommée, seul `gemini-3.8-flash` part, dans l'enveloppe
 *   partagée de gemini-journal.md : 5 appels par lancement, 40 au total (décision 63 ;
 *   même compteur et même lecture que scripts/gemini38LiveCore.ts).
 * - Avec `--h9` (banc #91) ou `--h12` (usages complexes, AI07-C), une ligne
 *   `H9-AUTORISATION : …` ou `H12-AUTORISATION : …` de decisions-humaines.md fixe une borne
 *   par modèle, une borne par lancement, un plafond en CHF et une échéance. Sans cette
 *   ligne, ou si elle est invalide ou échue : refus. Chaque enveloppe a sa section dans
 *   le journal (compteur et tableau propres) ; une ligne n'autorise que son enveloppe.
 * - Chaque appel est réservé dans le compteur AVANT l'envoi, sous verrou :
 *   un arrêt brutal ou une session concurrente ne peut pas dépasser la borne.
 * - La clé ne passe jamais par ces fonctions, sauf `redact` qui la masque.
 */
import { mkdirSync, readFileSync, rmdirSync, writeFileSync } from 'node:fs';

export const APP_MODEL = 'gemini-3.8-flash';
/** Les deux seuls modèles que #91 compare. Tout autre modèle est toujours refusé. */
export const BENCH_MODELS = Object.freeze(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
export const THINKING_LEVELS = Object.freeze(['minimal', 'low', 'medium', 'high']);
/**
 * Niveaux acceptés par modèle (https://ai.google.dev/gemini-api/docs/thinking, lu le 2026-10-12) :
 * 3.8 Flash « low, medium, high » (minimal renvoie une erreur), 3.5 Flash-Lite « minimal, low, medium, high ».
 * Un appel voué à l'erreur coûterait une place du compteur : il est refusé avant le réseau.
 */
/**
 * Modèle d'essai de la décision 69 (16.10, 16:07 : « tu peux même tester Argon pour de vrai »), admis sous H12 seulement,
 * jamais par l'app. Identifiant vérifié par la liste des modèles de l'API avant tout appel (AI07-C/logs/modeles-api.md).
 */
export const ARGON_MODEL = 'gemini-4-argon';
/** H12 compare ces trois modèles, et seulement eux ; H9 et l'enveloppe partagée gardent BENCH_MODELS. */
export const H12_MODELS = Object.freeze([...BENCH_MODELS, ARGON_MODEL]);
const modelsOf = envelopeId => envelopeId === 'H12' ? H12_MODELS : BENCH_MODELS;
export const SUPPORTED_THINKING = Object.freeze({
  'gemini-3.8-flash': Object.freeze(['low', 'medium', 'high']),
  'gemini-3.5-flash-lite': Object.freeze(['minimal', 'low', 'medium', 'high']),
  // Prudence tant que la documentation d'Argon n'est pas lue : les niveaux de 3.8, sans `minimal`.
  [ARGON_MODEL]: Object.freeze(['low', 'medium', 'high'])
});
/** Enveloppe des tests réels d'intégration, relevée de 3 / 10 à 5 / 40 par la décision 63 (16.10, ~12:30). */
export const SHARED_LAUNCH_CAP = 5;
export const SHARED_TOTAL_CAP = 40;
/** Bornes de vraisemblance d'une autorisation H9 lue dans un fichier. */
export const H9_MAX_PER_MODEL = 400;
export const H9_MAX_PER_LAUNCH = 60;
export const GEMINI_HOST = 'generativelanguage.googleapis.com';
/** Étiquette des lignes du banc dans gemini-journal.md (colonne Issue). */
export const H9_TAG = '#91 (AI07)';
export const endpointFor = model => `https://${GEMINI_HOST}/v1beta/models/${model}:generateContent`;

export class BenchRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'BenchRefusal';
  }
}
const refuse = message => { throw new BenchRefusal(`${message} Aucun appel.`); };

const SHARED_COUNTER = /\*\*Compteur : (\d+) \/ (\d+)\*\*/;

/** Compteur partagé de gemini-journal.md, lu comme scripts/gemini38LiveCore.ts. */
export function readSharedCounter(journal) {
  const match = SHARED_COUNTER.exec(journal);
  if (!match) refuse('Compteur introuvable dans gemini-journal.md.');
  const used = Number(match[1]), total = Number(match[2]);
  if (!Number.isSafeInteger(used) || used < 0 || total !== SHARED_TOTAL_CAP) refuse('Compteur de gemini-journal.md illisible.');
  return { used, total };
}

function withSharedCounter(journal, used) {
  readSharedCounter(journal);
  return journal.replace(SHARED_COUNTER, `**Compteur : ${used} / ${SHARED_TOTAL_CAP}**`);
}

/**
 * Enveloppes nommées, chacune avec sa ligne d'autorisation dans decisions-humaines.md et sa section dans
 * gemini-journal.md (compteur, tableau et coût cumulé propres) :
 * - H9 : banc réel #91 (décision 57), `**Compteur #91 : 3 / 100 · 0.0412 CHF / 5** (gemini-3.8-flash 2 / 50 ; …)` ;
 * - H12 : banc des usages complexes (AI07-C, décision 68), `**Compteur H12 : 3 / 120 · 0.0412 CHF / 8** (…)`.
 * Le détail par modèle, absent avant le premier appel, est écrit par le banc.
 */
export const ENVELOPES = Object.freeze({
  H9: Object.freeze({ id: 'H9', authLine: 'H9-AUTORISATION', section: '## Banc réel #91', counter: '#91' }),
  H12: Object.freeze({ id: 'H12', authLine: 'H12-AUTORISATION', section: '## Banc réel des usages complexes', counter: 'H12' })
});
export const SECTION_91 = ENVELOPES.H9.section;
const envelopeOf = id => ENVELOPES[id] ?? refuse(`Enveloppe inconnue : ${id}.`);
const counterPattern = env =>
  new RegExp(`\\*\\*Compteur ${env.counter} : (\\d+) \\/ (\\d+) · (\\d+(?:\\.\\d+)?) CHF \\/ (\\d+(?:\\.\\d+)?)\\*\\*(?: \\(([^)\\n]*)\\))?`);

function sectionOf(journal, env) {
  const heading = journal.indexOf(`\n${env.section}`);
  if (heading < 0) refuse(`Section « ${env.section.replace(/^## /, '')} » introuvable dans gemini-journal.md.`);
  const next = journal.indexOf('\n## ', heading + 1);
  return { start: heading + 1, end: next < 0 ? journal.length : next };
}

/**
 * Coût cumulé (colonne « Coût estimé ») des seules lignes à 11 colonnes du tableau de la section. Une ligne du
 * tableau partagé (8 colonnes), que scripts/gemini38LiveCore.ts ajoute en fin de fichier, peut tomber dans la
 * dernière section (D100, 16.10) : elle ne compte pas.
 */
export function spentIn(journal, envelope) {
  const { start, end } = sectionOf(journal, envelopeOf(envelope));
  let total = 0;
  for (const line of journal.slice(start, end).split(/\r?\n/)) {
    const cost = line.startsWith('|') && line.trim().split('|').length === 13 ? /\| (\d+\.\d+) CHF \|/.exec(line) : null;
    if (cost) total += Number(cost[1]);
  }
  return Math.round(total * 10_000) / 10_000;
}
export const spent91 = journal => spentIn(journal, 'H9');

/** Appels déjà réservés dans une enveloppe : total, plafond du compteur et détail par modèle (somme exigée égale au total). */
export function readEnvelopeCounter(journal, envelope) {
  const env = envelopeOf(envelope);
  const { start, end } = sectionOf(journal, env);
  const match = counterPattern(env).exec(journal.slice(start, end));
  if (!match) refuse(`Compteur ${env.counter} introuvable dans gemini-journal.md.`);
  const used = Number(match[1]), cap = Number(match[2]);
  const perModel = {};
  for (const part of (match[5] ?? '').split(';').map(item => item.trim()).filter(Boolean)) {
    const entry = /^(gemini-[a-z0-9.-]+) (\d+) \/ (\d+)$/.exec(part);
    if (!entry || entry[1] in perModel) refuse(`Compteur ${env.counter} par modèle illisible : « ${part} ».`);
    perModel[entry[1]] = Number(entry[2]);
  }
  if (!Number.isSafeInteger(used) || !Number.isSafeInteger(cap) || Object.values(perModel).reduce((a, b) => a + b, 0) !== used)
    refuse(`Compteur ${env.counter} incohérent : le total diffère de la somme par modèle.`);
  return { used, cap, maxChf: Number(match[4]), perModel, at: start + match.index, length: match[0].length };
}
export const readCounter91 = journal => readEnvelopeCounter(journal, 'H9');

/** Simulation seulement : copie du journal dont le compteur de l'enveloppe repart de zéro (le fichier réel n'est jamais réécrit). */
export function blankCounter(journal, envelope) {
  const env = envelopeOf(envelope);
  const counter = readEnvelopeCounter(journal, env.id);
  return `${journal.slice(0, counter.at)}**Compteur ${env.counter} : 0 / ${counter.cap} · 0 CHF / ${counter.maxChf}**${journal.slice(counter.at + counter.length)}`;
}
export const blankCounter91 = journal => blankCounter(journal, 'H9');

function withCounter(journal, perModel, bounds, env) {
  const counter = readEnvelopeCounter(journal, env.id);
  const used = Object.values(perModel).reduce((a, b) => a + b, 0);
  const detail = Object.entries(bounds).map(([model, bound]) => `${model} ${perModel[model] ?? 0} / ${bound}`).join(' ; ');
  const line = `**Compteur ${env.counter} : ${used} / ${counter.cap} · ${spentIn(journal, env.id).toFixed(4)} CHF / ${counter.maxChf}** (${detail})`;
  return `${journal.slice(0, counter.at)}${line}${journal.slice(counter.at + counter.length)}`;
}

/** Lignes hors blocs de code : un exemple cité entre ``` n'autorise rien. */
function linesOutsideFences(text) {
  const lines = [];
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (marker && (!fence || (marker[0] === fence[0] && marker.length >= fence.length))) {
      fence = fence ? null : marker;
      continue;
    }
    if (!fence) lines.push(line);
  }
  return lines;
}

/**
 * Autorisation d'une enveloppe (H9 ou H12) inscrite par l'humain dans decisions-humaines.md, sur une seule ligne :
 *   H12-AUTORISATION : gemini-3.8-flash=60 ; gemini-3.5-flash-lite=60 ; par-lancement=25 ; plafond-chf=8 ; échéance=2026-10-31
 * `plafond-chf`, facultatif, borne le coût cumulé des appels du banc au tarif provisionné de geminiCosts.ts.
 * Seuls les modèles de l'enveloppe sont admis (H9 : 3.8 et Flash-Lite ; H12 : en plus le modèle d'essai de la décision 69).
 * Renvoie null si la ligne est absente. Toute ligne présente mais invalide est refusée.
 */
export function parseAuthorization(decisions, envelope = 'H9', { maxPerModel = H9_MAX_PER_MODEL, maxPerLaunch = H9_MAX_PER_LAUNCH } = {}) {
  const { id, authLine } = envelopeOf(envelope);
  const tag = new RegExp(`^${authLine}\\s*:`);
  const lines = linesOutsideFences(decisions).filter(line => tag.test(line));
  if (!lines.length) return null;
  if (lines.length > 1) refuse(`Plusieurs lignes ${authLine} dans decisions-humaines.md : ambigu.`);
  const perModel = {};
  let perLaunch, until, maxChf;
  for (const part of lines[0].replace(tag, '').split(';').map(item => item.trim()).filter(Boolean)) {
    const [key, value, extra] = part.split('=').map(item => item.trim());
    if (!key || value === undefined || extra !== undefined) refuse(`Élément ${id} illisible : « ${part} ».`);
    if (key === 'échéance') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) refuse(`Échéance ${id} invalide : ${value}.`);
      until = value;
      continue;
    }
    if (key === 'plafond-chf') {
      const chf = /^\d+(?:\.\d{1,2})?$/.test(value) ? Number(value) : NaN;
      if (!(chf > 0 && chf <= 100)) refuse(`Plafond ${id} en CHF invalide : ${value}.`);
      maxChf = chf;
      continue;
    }
    const count = /^\d+$/.test(value) ? Number(value) : NaN;
    if (key === 'par-lancement') {
      if (!Number.isSafeInteger(count) || count < 1 || count > maxPerLaunch) refuse(`Borne par lancement ${id} invalide : ${value}.`);
      perLaunch = count;
    } else if (modelsOf(id).includes(key)) {
      if (key in perModel) refuse(`Modèle ${key} cité deux fois dans ${id}.`);
      if (!Number.isSafeInteger(count) || count < 1 || count > maxPerModel) refuse(`Borne ${id} invalide pour ${key} : ${value}.`);
      perModel[key] = count;
    } else refuse(`Élément ${id} inconnu : « ${key} ».`);
  }
  if (!Object.keys(perModel).length || perLaunch === undefined || until === undefined)
    refuse(`Autorisation ${id} incomplète : au moins un modèle, par-lancement et échéance sont requis.`);
  return { perModel, perLaunch, until, ...(maxChf === undefined ? {} : { maxChf }) };
}
export const parseH9Authorization = (decisions, limits) => parseAuthorization(decisions, 'H9', limits);

/** Échue après la fin du jour d'échéance, compté large (UTC+14) pour ne jamais raccourcir l'accord. */
export const h9Expired = (auth, now = Date.now()) => now >= Date.parse(`${auth.until}T00:00:00Z`) + 86_400_000 + 14 * 3_600_000;

/**
 * Décide, avant tout réseau, si un lancement entier peut partir. Un plan qui ne
 * tient pas dans ses bornes est refusé en bloc : jamais d'exécution partielle.
 * `envelope` : 'H9' (ou `useH9`, compatibilité) ou 'H12' ; absente, l'enveloppe partagée (3.8 seul).
 * `limits` relève les bornes de vraisemblance : réservé à la simulation, qui travaille sur une copie du journal.
 * `estimatedChf` : coût estimé du lancement (tarif provisionné) ; avec le déjà dépensé, il doit tenir sous le plafond.
 * @param {{ plan: { model: string, thinking?: string }[], journal: string, decisions?: string, useH9?: boolean, envelope?: 'H9' | 'H12', now?: number, estimatedChf?: number, limits?: { maxPerModel?: number, maxPerLaunch?: number } }} input
 */
export function authorizeLaunch({ plan, journal, decisions = '', useH9 = false, envelope = useH9 ? 'H9' : undefined, now = Date.now(), estimatedChf, limits }) {
  if (!Array.isArray(plan) || !plan.length) refuse('Plan vide.');
  const planned = {};
  const admitted = envelope ? modelsOf(envelopeOf(envelope).id) : BENCH_MODELS;
  for (const { model, thinking } of plan) {
    if (!admitted.includes(model)) refuse(`Modèle refusé : ${model} n'est pas comparé par ce banc.`);
    if (thinking !== undefined && !SUPPORTED_THINKING[model].includes(String(thinking).toLowerCase()))
      refuse(`Réflexion « ${thinking} » non acceptée par ${model} (niveaux : ${SUPPORTED_THINKING[model].join(', ')}).`);
    planned[model] = (planned[model] ?? 0) + 1;
  }
  if (!envelope) {
    const other = Object.keys(planned).find(model => model !== APP_MODEL);
    if (other) refuse(`Modèle refusé : ${other} exige l'autorisation humaine H9 (option --h9 et ligne H9-AUTORISATION dans decisions-humaines.md).`);
    const { used } = readSharedCounter(journal);
    const left = Math.max(0, Math.min(SHARED_LAUNCH_CAP, SHARED_TOTAL_CAP - used));
    if (plan.length > left)
      refuse(`Ce lancement prévoit ${plan.length} appel(s) ; l'enveloppe partagée n'en permet que ${left} (${SHARED_LAUNCH_CAP} par lancement, ${used} / ${SHARED_TOTAL_CAP} déjà utilisés).`);
    return { envelope: 'partagée', cap: plan.length, planned };
  }
  const env = envelopeOf(envelope);
  const auth = parseAuthorization(decisions, env.id, limits);
  if (!auth) refuse(`Autorisation ${env.id} non inscrite dans decisions-humaines.md.`);
  if (h9Expired(auth, now)) refuse(`Autorisation ${env.id} échue le ${auth.until}.`);
  if (plan.length > auth.perLaunch) refuse(`Ce lancement prévoit ${plan.length} appels ; ${env.id} en permet ${auth.perLaunch} par lancement.`);
  readSharedCounter(journal);
  const counter = readEnvelopeCounter(journal, env.id);
  const spent = spentIn(journal, env.id);
  if (auth.maxChf !== undefined && spent >= auth.maxChf) refuse(`Plafond ${env.id} atteint : ${spent} CHF dépensés sur ${auth.maxChf} CHF.`);
  if (auth.maxChf !== undefined && estimatedChf !== undefined && spent + estimatedChf > auth.maxChf)
    refuse(`Coût estimé du lancement ${estimatedChf.toFixed(4)} CHF : avec ${spent} CHF dépensés, il dépasserait le plafond ${env.id} de ${auth.maxChf} CHF.`);
  if (counter.used + plan.length > counter.cap) refuse(`Ce lancement prévoit ${plan.length} appels ; ${counter.used} / ${counter.cap} déjà utilisés sous ${env.counter}.`);
  for (const [model, count] of Object.entries(planned)) {
    const bound = auth.perModel[model];
    if (!bound) refuse(`Modèle refusé : ${model} n'est pas couvert par ${env.id}.`);
    if ((counter.perModel[model] ?? 0) + count > bound)
      refuse(`${model} : ${count} appel(s) prévu(s), ${counter.perModel[model] ?? 0} / ${bound} déjà utilisés sous ${env.id}.`);
  }
  return { envelope: env.id, cap: plan.length, planned, auth };
}

const sleepSync = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Verrou par création de dossier, comme les verrous `locks/` de la mission. */
export function withLock(lockDir, action, { timeoutMs = 5000, sleep = sleepSync } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      mkdirSync(lockDir);
      break;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) refuse(`Verrou ${lockDir} occupé.`);
      sleep(50);
    }
  }
  try {
    return action();
  } finally {
    rmdirSync(lockDir);
  }
}

/**
 * Réserve un appel dans gemini-journal.md, avant l'envoi : le compteur est relu
 * sous verrou, contrôlé contre sa borne, puis incrémenté et réécrit.
 * Sous H9 ou H12, `costChf` (coût estimé de cet appel) s'ajoute au coût déjà journalisé dans la section de
 * l'enveloppe : au-delà du plafond en CHF, l'appel est refusé avant l'envoi.
 * @returns {{ label: string }} numéro de l'appel pour la ligne du journal
 */
export function reserveCall(journalPath, { envelope, model, auth, lockDir, costChf = 0 }) {
  return withLock(lockDir, () => {
    const journal = readFileSync(journalPath, 'utf8');
    if (envelope === 'partagée') {
      if (model !== APP_MODEL) refuse(`Modèle refusé : ${model} hors enveloppe partagée.`);
      const next = readSharedCounter(journal).used + 1;
      if (next > SHARED_TOTAL_CAP) refuse(`Enveloppe partagée épuisée (${SHARED_TOTAL_CAP} / ${SHARED_TOTAL_CAP}).`);
      writeFileSync(journalPath, withSharedCounter(journal, next));
      return { label: String(next) };
    }
    const env = ENVELOPES[envelope];
    if (!env || !auth) refuse('Enveloppe inconnue.');
    const bound = auth.perModel[model];
    if (!bound) refuse(`Modèle refusé : ${model} n'est pas couvert par ${env.id}.`);
    const counter = readEnvelopeCounter(journal, env.id);
    const next = (counter.perModel[model] ?? 0) + 1;
    if (next > bound) refuse(`Borne ${env.id} atteinte pour ${model} (${bound}).`);
    if (counter.used + 1 > counter.cap) refuse(`Compteur ${env.counter} épuisé (${counter.cap} / ${counter.cap}).`);
    const spent = spentIn(journal, env.id);
    if (auth.maxChf !== undefined && spent + costChf > auth.maxChf)
      refuse(`Plafond ${env.id} : cet appel (≈ ${costChf.toFixed(4)} CHF) porterait le coût ${env.counter} de ${spent} CHF au-delà de ${auth.maxChf} CHF.`);
    writeFileSync(journalPath, withCounter(journal, { ...counter.perModel, [model]: next }, auth.perModel, env));
    return { label: String(counter.used + 1), ordinal: next };
  });
}

/** Ajoute une ligne au tableau de gemini-journal.md, sous le même verrou. */
export function appendJournalRow(journalPath, row, lockDir) {
  withLock(lockDir, () => {
    const journal = readFileSync(journalPath, 'utf8');
    writeFileSync(journalPath, `${journal.replace(/\n*$/, '\n')}${row}\n`);
  });
}

/**
 * Ajoute une ligne à la fin du tableau de la section de l'enveloppe, puis remet à jour le coût de son compteur, sous verrou.
 * `bounds` : bornes de l'enveloppe par modèle, pour réécrire le détail du compteur.
 */
export function appendEnvelopeRow(journalPath, row, lockDir, bounds, envelope) {
  const env = envelopeOf(envelope);
  withLock(lockDir, () => {
    const journal = readFileSync(journalPath, 'utf8');
    const { start, end } = sectionOf(journal, env);
    const body = journal.slice(start, end).replace(/\s*$/, '');
    const next = `${journal.slice(0, start)}${body}\n${row}\n${journal.slice(end)}`;
    writeFileSync(journalPath, withCounter(next, readEnvelopeCounter(next, env.id).perModel, bounds, env));
  });
}
export const appendRow91 = (journalPath, row, lockDir, bounds) => appendEnvelopeRow(journalPath, row, lockDir, bounds, 'H9');

const chf = micro => micro == null ? 'inconnu' : `${(micro / 1_000_000).toFixed(4)} CHF`;

/** Colonnes du tableau #91 : #, heure, lancement, usage · cas, architecture, modèle observé, réflexion, tokens, latence, coût, résultat. */
export function journalRow91({ label, at, launch, test, architecture, modelVersion, thinking, inputTokens, outputTokens, latencyMs, costMicroChf, result }) {
  const time = at.toLocaleTimeString('fr-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });
  const date = at.toLocaleDateString('fr-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit' });
  const tokens = inputTokens == null ? 'inconnus' : `${inputTokens} / ${outputTokens}`;
  const cell = value => String(value).replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  return `| ${cell(label)} | ${date} ${time} | ${cell(launch)} | ${cell(test)} | ${cell(architecture)} | ${cell(modelVersion ?? 'non fourni')} | ${cell(thinking)} | ${tokens} | ${latencyMs} ms | ${chf(costMicroChf)} | ${cell(result)} |`;
}

/** Même colonnes que scripts/gemini38LiveCore.ts (heure, issue, test, modèle observé, tokens, coût, résultat). */
export function journalRow({ label, at, issue, test, modelVersion, inputTokens, outputTokens, costMicroChf, result }) {
  const time = at.toLocaleTimeString('fr-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });
  const date = at.toLocaleDateString('fr-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit' });
  const tokens = inputTokens == null ? 'inconnus' : `${inputTokens} / ${outputTokens}`;
  const cell = value => String(value).replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  return `| ${cell(label)} | ${date} ${time} | ${cell(issue)} | ${cell(test)} | ${cell(modelVersion ?? 'non fourni')} | ${tokens} | ${chf(costMicroChf)} | ${cell(result)} |`;
}

/**
 * Enveloppe `fetch` du banc : seul un endpoint generateContent d'un modèle
 * autorisé part vers Google, dans la limite du lancement, après réservation.
 * Tout autre hôte, modèle ou chemin est refusé avant l'envoi.
 * `onCall(call, init)` suit chaque appel envoyé, réussi ou non ; `init` (qui porte la clé) n'est jamais copié dans `call`.
 */
export function guardBenchFetch(realFetch, { allowedModels, cap, reserve, onCall, now = () => performance.now() }) {
  const calls = [];
  const guarded = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (new URL(url).hostname !== GEMINI_HOST) refuse(`Hôte refusé avant l'envoi : ${new URL(url).hostname}.`);
    const model = allowedModels.find(candidate => url === endpointFor(candidate));
    if (!model) refuse('Requête refusée avant l\'envoi : modèle ou chemin non autorisé.');
    if (calls.length >= cap) refuse('Plafond d\'appels de ce lancement atteint.');
    const { label } = reserve(model);
    const call = { label, model, at: new Date(), latencyMs: 0 };
    calls.push(call);
    const started = now();
    try {
      const response = await realFetch(input, init);
      call.status = response.status;
      call.json = await response.clone().json().catch(() => undefined);
      call.latencyMs = Math.round(now() - started);
      call.modelVersion = typeof call.json?.modelVersion === 'string' ? call.json.modelVersion : undefined;
      const usage = call.json?.usageMetadata;
      if (usage) {
        call.inputTokens = usage.promptTokenCount;
        call.outputTokens = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
        call.thoughtsTokens = usage.thoughtsTokenCount ?? 0;
      }
      return response;
    } catch (error) {
      call.latencyMs = Math.round(now() - started);
      call.error = error instanceof Error ? error.name : 'Erreur';
      throw error;
    } finally {
      onCall(call, init);
    }
  };
  return { fetch: guarded, calls };
}

/**
 * Le modèle observé doit être celui demandé. Une version du même nom est admise
 * (`-001`, `-preview-09-2026`), jamais une variante : `gemini-3.8-flash-lite`
 * ne passe pas pour `gemini-3.8-flash`. Absent : non prouvé, donc refusé.
 */
export const observedModelMatches = (requested, modelVersion) =>
  typeof modelVersion === 'string' && (modelVersion === requested ||
    (modelVersion.startsWith(`${requested}-`) && /^-(?:\d+|preview|latest)(?:-[0-9a-z]+)*$/.test(modelVersion.slice(requested.length)) &&
      !/-(?:lite|pro|flash|nano|image|tts|live)\b/.test(modelVersion.slice(requested.length))));

/** Clé locale : environnement, puis functions/.secret.local. Jamais affichée. */
export function readLocalKey({ env = process.env, secretPath = 'functions/.secret.local', readFile = path => readFileSync(path, 'utf8') } = {}) {
  const fromEnv = env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  let text;
  try {
    text = readFile(secretPath);
  } catch {
    return undefined;
  }
  const line = text.split(/\r?\n/).find(entry => /^\s*GEMINI_API_KEY\s*=/.test(entry));
  return line?.slice(line.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || undefined;
}

/** Masque la clé dans tout texte destiné à un journal ou à la console. */
export const redact = (text, secret) => !secret ? String(text) : String(text).split(secret).join('«clé masquée»');
