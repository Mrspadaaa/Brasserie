/**
 * Garde-fous du banc d'usage Gemini (#91). Aucun réseau : chaque `fetch` est un espion local.
 *   node --test scripts/gemini-usage-bench.test.mjs
 * Hors de `npm test` (Vitest ne lit que tests/unit, tests/integration et tests/fuzz).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  APP_MODEL, ARGON_MODEL, BenchRefusal, H12_MODELS, SHARED_LAUNCH_CAP, appendEnvelopeRow, appendJournalRow, appendRow91, authorizeLaunch, blankCounter, blankCounter91, endpointFor,
  guardBenchFetch, h9Expired, journalRow, journalRow91, observedModelMatches, parseAuthorization, parseH9Authorization, readCounter91,
  readEnvelopeCounter, readLocalKey, readSharedCounter, redact, reserveCall, spent91, spentIn, withLock
} from './gemini-usage-bench-guard.mjs';

const LITE = 'gemini-3.5-flash-lite';
const journalText = used => `# Journal des appels Gemini réels\n\n**Compteur : ${used} / 40**\n\n| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |\n|---|---|---|---|---|---|---|---|\n`;
/** Section #91 du journal (décision 57) : compteur et tableau propres au banc réel. */
const SECTION = (counter = '**Compteur #91 : 0 / 100 · 0 CHF / 5**', rows = '') => `\n## Banc réel #91 (H9) — enveloppe séparée\n\n${counter}\n\n| # | Heure | Lancement | Usage · cas | Architecture | Modèle observé | Réflexion | Tokens entrée / sortie | Latence | Coût estimé | Résultat |\n|---|---|---|---|---|---|---|---|---|---|---|\n${rows}`;
const journal91 = (used = 0, counter, rows) => `${journalText(used)}${SECTION(counter, rows)}`;
const row91 = cost => `| 1 | 13.10 10:00 | R1 | coa · coa-simple | agent unique | ${LITE} | minimal | 10 / 5 | 900 ms | ${cost} | HTTP 200 |`;
const H9_LINE = `H9-AUTORISATION : ${APP_MODEL}=6 ; ${LITE}=4 ; par-lancement=5 ; échéance=2026-11-30`;
const decisions = line => `# Décisions réservées à l'humain\n\n| # | Sujet |\n|---|---|\n| H9 | banc #91 |\n\n${line}\n`;
const NOW = Date.parse('2026-10-12T22:00:00Z');
const plan = (...models) => models.map(model => ({ model }));
const refused = (fn, pattern) => assert.throws(fn, error => error instanceof BenchRefusal && pattern.test(error.message) && /Aucun appel\.$/.test(error.message));

function workspace(used = 0, with91 = false) {
  const dir = mkdtempSync(join(tmpdir(), 'gemini-bench-test-'));
  const journalPath = join(dir, 'gemini-journal.md');
  writeFileSync(journalPath, with91 ? journal91(used) : journalText(used));
  return { dir, journalPath, lockDir: join(dir, 'gemini-journal.lock') };
}

test('sans H9 : tout modèle autre que 3.8 est refusé avant le réseau, même en plan mixte', () => {
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journalText(0), now: NOW }), /exige l'autorisation humaine H9/);
  refused(() => authorizeLaunch({ plan: plan(APP_MODEL, LITE), journal: journalText(0), now: NOW }), /gemini-3\.5-flash-lite exige/);
  // H9 inscrite mais option absente : toujours refusé, l'autorisation n'est jamais implicite.
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journalText(0), decisions: decisions(H9_LINE), now: NOW }), /exige l'autorisation humaine H9/);
});

test('un modèle hors du banc est refusé, avec ou sans H9', () => {
  for (const useH9 of [false, true])
    refused(() => authorizeLaunch({ plan: plan('gemini-3.1-pro-preview'), journal: journalText(0), decisions: decisions(H9_LINE), useH9, now: NOW }),
      /n'est pas comparé par ce banc/);
  refused(() => authorizeLaunch({ plan: [], journal: journalText(0), now: NOW }), /Plan vide/);
});

test('réflexion non acceptée par le modèle : refus avant le réseau (minimal sur 3.8)', () => {
  refused(() => authorizeLaunch({ plan: [{ model: APP_MODEL, thinking: 'minimal' }], journal: journalText(0), now: NOW }), /Réflexion « minimal » non acceptée par gemini-3\.8-flash/);
  refused(() => authorizeLaunch({ plan: [{ model: LITE, thinking: 'max' }], journal: journalText(0), decisions: decisions(H9_LINE), useH9: true, now: NOW }), /non acceptée par gemini-3\.5-flash-lite/);
  assert.equal(authorizeLaunch({ plan: [{ model: APP_MODEL, thinking: 'LOW' }, { model: APP_MODEL, thinking: 'high' }], journal: journalText(0), now: NOW }).cap, 2);
  assert.equal(authorizeLaunch({ plan: [{ model: LITE, thinking: 'minimal' }], journal: journal91(), decisions: decisions(H9_LINE), useH9: true, now: NOW }).cap, 1);
});

test('H9 : borne lue dans decisions-humaines.md, refus par défaut ; compteur #91 propre', () => {
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journal91(), decisions: decisions(''), useH9: true, now: NOW }), /H9 non inscrite/);
  const ok = authorizeLaunch({ plan: plan(LITE, LITE, APP_MODEL), journal: journal91(10), decisions: decisions(H9_LINE), useH9: true, now: NOW });
  assert.equal(ok.envelope, 'H9');
  assert.deepEqual(ok.auth, { perModel: { [APP_MODEL]: 6, [LITE]: 4 }, perLaunch: 5, until: '2026-11-30' });
  // L'enveloppe partagée épuisée (10 / 10) ne bloque pas H9, qui a son propre compteur (section #91).
  refused(() => authorizeLaunch({ plan: plan(LITE, LITE, LITE, LITE, LITE, LITE), journal: journal91(), decisions: decisions(H9_LINE), useH9: true, now: NOW }), /H9 en permet 5 par lancement/);
  const used3 = journal91(0, `**Compteur #91 : 3 / 100 · 0 CHF / 5** (${APP_MODEL} 0 / 6 ; ${LITE} 3 / 4)`);
  refused(() => authorizeLaunch({ plan: plan(LITE, LITE), journal: used3, decisions: decisions(H9_LINE), useH9: true, now: NOW }), /3 \/ 4 déjà utilisés sous H9/);
  const liteOnly = `H9-AUTORISATION : ${LITE}=4 ; par-lancement=5 ; échéance=2026-11-30`;
  refused(() => authorizeLaunch({ plan: plan(APP_MODEL), journal: journal91(), decisions: decisions(liteOnly), useH9: true, now: NOW }), /n'est pas couvert par H9/);
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journal91(), decisions: decisions(H9_LINE), useH9: true, now: Date.parse('2026-12-02T00:00:00Z') }), /échue le 2026-11-30/);
  assert.equal(h9Expired({ until: '2026-11-30' }, Date.parse('2026-11-30T21:00:00Z')), false);
  // Sans section #91, ou avec un compteur incohérent, rien ne part ; le total du compteur (100) est tenu.
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journalText(0), decisions: decisions(H9_LINE), useH9: true, now: NOW }), /Section « Banc réel #91 » introuvable/);
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journal91(0, `**Compteur #91 : 2 / 100 · 0 CHF / 5** (${LITE} 1 / 4)`), decisions: decisions(H9_LINE), useH9: true, now: NOW }), /incohérent/);
  const full = journal91(0, `**Compteur #91 : 100 / 100 · 0 CHF / 5** (${APP_MODEL} 50 / 60 ; ${LITE} 50 / 60)`);
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: full, decisions: decisions(`H9-AUTORISATION : ${APP_MODEL}=60 ; ${LITE}=60 ; par-lancement=5 ; échéance=2026-11-30`), useH9: true, now: NOW }), /100 \/ 100 déjà utilisés sous #91/);
  // La simulation repart d'un compteur nul, sur sa copie.
  assert.equal(readCounter91(blankCounter91(used3)).used, 0);
});

test('H9 : une ligne invalide, ambiguë ou citée en exemple n\'autorise rien', () => {
  assert.equal(parseH9Authorization(decisions(`\`\`\`text\n${H9_LINE}\n\`\`\``)), null);
  assert.equal(parseH9Authorization(decisions(`  ${H9_LINE}`)), null);
  refused(() => parseH9Authorization(decisions(`${H9_LINE}\n${H9_LINE}`)), /Plusieurs lignes/);
  refused(() => parseH9Authorization(decisions(H9_LINE.replace('=6', '=6.5'))), /Borne H9 invalide/);
  refused(() => parseH9Authorization(decisions(H9_LINE.replace('=6', '=4000'))), /Borne H9 invalide/);
  refused(() => parseH9Authorization(decisions(H9_LINE.replace(APP_MODEL, 'gemini-3.1-pro-preview'))), /Élément H9 inconnu/);
  refused(() => parseH9Authorization(decisions(H9_LINE.replace('par-lancement=5', 'par-lancement=0'))), /par lancement H9 invalide/);
  refused(() => parseH9Authorization(decisions(H9_LINE.replace(' ; échéance=2026-11-30', ''))), /incomplète/);
  refused(() => parseH9Authorization(decisions(H9_LINE.replace('2026-11-30', '30.11.2026'))), /Échéance H9 invalide/);
  refused(() => parseH9Authorization(decisions(`${H9_LINE} ; ${LITE}=2`)), /cité deux fois/);
  // Bornes de vraisemblance : 60 par lancement et 400 par modèle, relevées seulement sur demande explicite (simulation).
  refused(() => parseH9Authorization(decisions(H9_LINE.replace('par-lancement=5', 'par-lancement=61'))), /par lancement H9 invalide/);
  refused(() => parseH9Authorization(decisions(H9_LINE.replace('=6', '=401'))), /Borne H9 invalide/);
  assert.equal(parseH9Authorization(decisions(H9_LINE.replace('par-lancement=5', 'par-lancement=200')), { maxPerLaunch: 200 }).perLaunch, 200);
  refused(() => authorizeLaunch({ plan: Array.from({ length: 61 }, () => ({ model: APP_MODEL })), journal: journalText(0),
    decisions: decisions(`H9-AUTORISATION : ${APP_MODEL}=100 ; par-lancement=61 ; échéance=2026-11-30`), useH9: true, now: NOW }), /par lancement H9 invalide/);
});

test('H9 : plafond en CHF — déjà dépensé (section #91 seule) plus coût estimé du lancement', () => {
  const capped = `${H9_LINE.replace(' ; échéance', ' ; plafond-chf=0.05 ; échéance')}`;
  assert.equal(parseH9Authorization(decisions(capped)).maxChf, 0.05);
  assert.equal('maxChf' in parseH9Authorization(decisions(H9_LINE)), false);
  for (const bad of ['0', '-1', '101', '1.234', 'dix'])
    refused(() => parseH9Authorization(decisions(H9_LINE.replace(' ; échéance', ` ; plafond-chf=${bad} ; échéance`))), /Plafond H9 en CHF invalide/);
  // Une ligne G38 hors de la section #91 ne compte pas ; un coût inconnu non plus.
  const g38 = `| 9 | 12.10 23:40 | #22 (G38) | test | ${APP_MODEL} | 10 / 5 | 0.9000 CHF | HTTP 200 |\n`;
  const journal = `${journalText(1)}${g38}${SECTION(undefined, `${row91('0.0300 CHF')}\n${row91('inconnu')}\n${row91('0.0150 CHF')}\n`)}`;
  assert.equal(spent91(journal), 0.045);
  const launch = estimatedChf => authorizeLaunch({ plan: plan(LITE), journal, decisions: decisions(capped), useH9: true, now: NOW, estimatedChf });
  assert.equal(launch(undefined).auth.maxChf, 0.05);
  assert.equal(launch(0.004).envelope, 'H9');
  refused(() => launch(0.006), /Coût estimé du lancement 0\.0060 CHF : avec 0\.045 CHF dépensés, il dépasserait le plafond H9 de 0\.05 CHF/);
  const over = `${journal}${row91('0.0050 CHF')}\n`;
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: over, decisions: decisions(capped), useH9: true, now: NOW }), /Plafond H9 atteint : 0\.05 CHF/);
});

test('H9 : un appel qui porterait le coût #91 au-delà du plafond est refusé avant l\'envoi, sans réserver', () => {
  const { journalPath, lockDir } = workspace(0, true);
  const auth = parseH9Authorization(decisions(H9_LINE.replace(' ; échéance', ' ; plafond-chf=0.05 ; échéance')));
  appendRow91(journalPath, row91('0.0400 CHF'), lockDir, auth.perModel);
  assert.equal(reserveCall(journalPath, { envelope: 'H9', model: LITE, auth, lockDir, costChf: 0.009 }).label, '1');
  refused(() => reserveCall(journalPath, { envelope: 'H9', model: LITE, auth, lockDir, costChf: 0.011 }), /porterait le coût #91 de 0\.04 CHF au-delà de 0\.05 CHF/);
  assert.equal(readCounter91(readFileSync(journalPath, 'utf8')).used, 1);
});

test('réservation avant l\'envoi : le compteur est déjà incrémenté quand fetch part', async () => {
  const { journalPath, lockDir } = workspace(4);
  const seen = [];
  const spy = async () => {
    seen.push(readSharedCounter(readFileSync(journalPath, 'utf8')).used);
    return new Response(JSON.stringify({ modelVersion: APP_MODEL, usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 2, totalTokenCount: 17 } }));
  };
  const onCall = [];
  const guard = guardBenchFetch(spy, {
    allowedModels: [APP_MODEL], cap: 2, onCall: call => onCall.push(call),
    reserve: model => reserveCall(journalPath, { envelope: 'partagée', model, lockDir })
  });
  await guard.fetch(endpointFor(APP_MODEL), { method: 'POST', body: '{}' });
  await guard.fetch(endpointFor(APP_MODEL), { method: 'POST', body: '{}' });
  assert.deepEqual(seen, [5, 6]);
  assert.deepEqual(onCall.map(call => [call.label, call.inputTokens, call.outputTokens, call.thoughtsTokens]), [['5', 10, 7, 2], ['6', 10, 7, 2]]);
  await assert.rejects(guard.fetch(endpointFor(APP_MODEL), { method: 'POST', body: '{}' }), /Plafond d'appels de ce lancement/);
  assert.equal(seen.length, 2);
});

test('compteur épuisé entre l\'autorisation et l\'envoi (session concurrente) : rien ne part', async () => {
  const { journalPath, lockDir } = workspace(40);
  let sent = 0;
  const guard = guardBenchFetch(async () => { sent += 1; return new Response('{}'); }, {
    allowedModels: [APP_MODEL], cap: 3, onCall: () => {},
    reserve: model => reserveCall(journalPath, { envelope: 'partagée', model, lockDir })
  });
  await assert.rejects(guard.fetch(endpointFor(APP_MODEL), { body: '{}' }), /Enveloppe partagée épuisée/);
  assert.equal(sent, 0);
  assert.equal(readSharedCounter(readFileSync(journalPath, 'utf8')).used, 40);
});

test('H9 : compteur #91 par modèle réservé puis incrémenté, bornes tenues, compteur partagé intact ; ligne au tableau #91', () => {
  const { journalPath, lockDir } = workspace(7, true);
  const auth = parseH9Authorization(decisions(H9_LINE));
  const labels = [1, 2, 3, 4].map(() => reserveCall(journalPath, { envelope: 'H9', model: LITE, auth, lockDir }).label);
  assert.deepEqual(labels, ['1', '2', '3', '4']);
  refused(() => reserveCall(journalPath, { envelope: 'H9', model: LITE, auth, lockDir }), /Borne H9 atteinte/);
  assert.equal(reserveCall(journalPath, { envelope: 'H9', model: APP_MODEL, auth, lockDir }).label, '5');
  let journal = readFileSync(journalPath, 'utf8');
  assert.deepEqual(readCounter91(journal).perModel, { [APP_MODEL]: 1, [LITE]: 4 });
  assert.match(journal, /\*\*Compteur #91 : 5 \/ 100 · 0\.0000 CHF \/ 5\*\* \(gemini-3\.8-flash 1 \/ 6 ; gemini-3\.5-flash-lite 4 \/ 4\)/);
  assert.equal(readSharedCounter(journal).used, 7);
  refused(() => reserveCall(journalPath, { envelope: 'partagée', model: LITE, lockDir }), /hors enveloppe partagée/);
  // Ligne au bout du tableau #91, coût reporté au compteur, section suivante intacte, clé masquée.
  writeFileSync(journalPath, `${journal}\n## Après\n\ntexte\n`);
  const key = 'AIzaFAKE-not-a-secret-456';
  appendRow91(journalPath, journalRow91({ label: '5', at: new Date('2026-10-13T08:00:00Z'), launch: 'R1', test: 'coa · coa-simple', architecture: 'agent | unique',
    modelVersion: APP_MODEL, thinking: 'low', inputTokens: 10, outputTokens: 5, latencyMs: 900, costMicroChf: 12_300, result: redact(`HTTP 200 ${key}`, key) }), lockDir, auth.perModel);
  journal = readFileSync(journalPath, 'utf8');
  assert.match(journal, /\| 5 \| 13\.10\.? 10:00 \| R1 \| coa · coa-simple \| agent \/ unique \| gemini-3\.8-flash \| low \| 10 \/ 5 \| 900 ms \| 0\.0123 CHF \| HTTP 200 «clé masquée» \|\n\n## Après/);
  assert.equal(journal.includes(key), false);
  assert.equal(spent91(journal), 0.0123);
  assert.match(journal, /Compteur #91 : 5 \/ 100 · 0\.0123 CHF \/ 5\*\*/);
});

test('fetch gardé : autre hôte, autre modèle ou autre chemin refusés avant l\'envoi', async () => {
  let sent = 0, reserved = 0;
  const guard = guardBenchFetch(async () => { sent += 1; return new Response('{}'); }, {
    allowedModels: [APP_MODEL], cap: 3, onCall: () => {}, reserve: () => { reserved += 1; return { label: 'x' }; }
  });
  await assert.rejects(guard.fetch('https://example.com/v1beta/models/gemini-3.8-flash:generateContent', {}), /Hôte refusé/);
  await assert.rejects(guard.fetch(endpointFor(LITE), {}), /modèle ou chemin non autorisé/);
  await assert.rejects(guard.fetch(endpointFor('gemini-3.1-pro-preview'), {}), /modèle ou chemin non autorisé/);
  await assert.rejects(guard.fetch(`${endpointFor(APP_MODEL)}?alt=sse`, {}), /modèle ou chemin non autorisé/);
  await assert.rejects(guard.fetch(endpointFor(APP_MODEL).replace('generateContent', 'streamGenerateContent'), {}), /non autorisé/);
  assert.equal(sent, 0);
  assert.equal(reserved, 0);
});

test('modèle observé : version du même modèle admise, variante ou absence refusées', () => {
  assert.equal(observedModelMatches(APP_MODEL, APP_MODEL), true);
  assert.equal(observedModelMatches(APP_MODEL, `${APP_MODEL}-001`), true);
  assert.equal(observedModelMatches(LITE, `${LITE}-preview-09-2026`), true);
  assert.equal(observedModelMatches(APP_MODEL, 'gemini-3.8-flash-lite'), false);
  assert.equal(observedModelMatches(APP_MODEL, 'gemini-3.8-flash-lite-preview'), false);
  assert.equal(observedModelMatches(APP_MODEL, 'gemini-3.8-flash-preview-lite'), false);
  assert.equal(observedModelMatches(APP_MODEL, 'gemini-3.5-flash-lite'), false);
  assert.equal(observedModelMatches(APP_MODEL, undefined), false);
});

test('verrou occupé : refus sans écrire ; libéré après usage', () => {
  const { dir } = workspace(0);
  const lockDir = join(dir, 'held.lock');
  mkdirSync(lockDir);
  refused(() => withLock(lockDir, () => assert.fail('ne doit pas tourner'), { timeoutMs: 30, sleep: () => {} }), /Verrou .* occupé/);
  const free = join(dir, 'free.lock');
  assert.equal(withLock(free, () => 42), 42);
  assert.equal(withLock(free, () => 43), 43);
});

test('journal : une ligne par appel, colonnes de G38, clé jamais écrite', () => {
  const { journalPath, lockDir } = workspace(0);
  const key = 'AIzaFAKE-not-a-secret-123';
  const row = journalRow({
    label: '1', at: new Date('2026-10-12T21:40:00Z'), issue: '#91 (AI07)', test: 'gemini-usage-bench · coa | low',
    modelVersion: APP_MODEL, inputTokens: 1200, outputTokens: 300, costMicroChf: 4100, result: redact(`HTTP 200, clé ${key}`, key)
  });
  appendJournalRow(journalPath, row, lockDir);
  const journal = readFileSync(journalPath, 'utf8');
  assert.match(journal, /\| 1 \| 12\.10\.? 23:40 \| #91 \(AI07\) \| gemini-usage-bench · coa \/ low \| gemini-3\.8-flash \| 1200 \/ 300 \| 0\.0041 CHF \| HTTP 200, clé «clé masquée» \|\n$/);
  assert.equal(journal.includes(key), false);
  assert.equal(row.split('|').length, 10);
});

// --- Enveloppe H12 (AI07-C, décision 68) : banc des usages complexes, section et compteur propres -------------
const H12_LINE = `H12-AUTORISATION : ${APP_MODEL}=60 ; ${LITE}=60 ; par-lancement=25 ; plafond-chf=8 ; échéance=2026-10-31`;
const SECTION_H12 = (counter = '**Compteur H12 : 0 / 120 · 0 CHF / 8**', rows = '') => `\n## Banc réel des usages complexes (H12, AI07-C) — enveloppe séparée\n\n${counter}\n\n| # | Heure | Lancement | Usage · cas | Architecture | Modèle observé | Réflexion | Tokens entrée / sortie | Latence | Coût estimé | Résultat |\n|---|---|---|---|---|---|---|---|---|---|---|\n${rows}`;
/** Journal réel du 16.10 : compteur partagé 5 / 40 (décision 63), section H12 avant la section #91, lignes G38 ajoutées en fin de fichier. */
const journalH12 = ({ shared = 5, counter, rows, tail = '' } = {}) =>
  `${journalText(shared)}${SECTION_H12(counter, rows)}${SECTION(undefined, row91('0.0300 CHF'))}\n${tail}`;
const g38Row = cost => `| 6 | 16.10 17:00 | #100 (D100) | d100-gemini-live.ts · fiche | ${APP_MODEL} | 10 / 5 | ${cost} | HTTP 200 |`;
const decisionsBoth = `${decisions(H9_LINE)}${H12_LINE}\n`;
const NOW_H12 = Date.parse('2026-10-16T16:00:00Z');

test('enveloppe partagée relevée par la décision 63 : 5 par lancement, 40 au total, lancement refusé en bloc', () => {
  assert.equal(SHARED_LAUNCH_CAP, 5);
  assert.deepEqual(readSharedCounter(journalText(5)), { used: 5, total: 40 });
  assert.equal(authorizeLaunch({ plan: plan(...Array(5).fill(APP_MODEL)), journal: journalText(5), now: NOW }).cap, 5);
  refused(() => authorizeLaunch({ plan: plan(...Array(6).fill(APP_MODEL)), journal: journalText(5), now: NOW }), /n'en permet que 5/);
  refused(() => authorizeLaunch({ plan: plan(APP_MODEL, APP_MODEL), journal: journalText(39), now: NOW }), /n'en permet que 1/);
  refused(() => authorizeLaunch({ plan: plan(APP_MODEL), journal: journalText(40), now: NOW }), /n'en permet que 0/);
  refused(() => readSharedCounter('# sans compteur'), /Compteur introuvable/);
  // L'ancien plafond (10) n'est plus lisible : un journal non mis à jour ne laisse rien partir.
  refused(() => readSharedCounter('**Compteur : 1 / 10**'), /illisible/);
});

test('H12 : borne lue dans sa propre ligne, refus par défaut, H9 et H12 jamais confondues', () => {
  assert.deepEqual(parseAuthorization(decisions(H12_LINE), 'H12'), { perModel: { [APP_MODEL]: 60, [LITE]: 60 }, perLaunch: 25, until: '2026-10-31', maxChf: 8 });
  // Chaque enveloppe ne lit que sa ligne : H9 n'autorise pas H12, ni l'inverse.
  assert.equal(parseAuthorization(decisions(H9_LINE), 'H12'), null);
  assert.equal(parseAuthorization(decisions(H12_LINE), 'H9'), null);
  assert.equal(parseH9Authorization(decisions(H12_LINE)), null);
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journalH12(), decisions: decisions(H9_LINE), envelope: 'H12', now: NOW_H12 }), /H12 non inscrite/);
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journalH12(), decisions: decisions(H12_LINE), useH9: true, now: NOW_H12 }), /H9 non inscrite/);
  refused(() => parseAuthorization(decisions(H12_LINE.replace('=60', '=60.5')), 'H12'), /Borne H12 invalide/);
  refused(() => parseAuthorization(decisions(`${H12_LINE}\n${H12_LINE}`), 'H12'), /Plusieurs lignes H12-AUTORISATION/);
  refused(() => parseAuthorization(decisions(H12_LINE), 'H10'), /Enveloppe inconnue/);
  const ok = authorizeLaunch({ plan: plan(LITE, APP_MODEL), journal: journalH12(), decisions: decisionsBoth, envelope: 'H12', now: NOW_H12, estimatedChf: 0.5 });
  assert.equal(ok.envelope, 'H12');
  assert.equal(ok.auth.maxChf, 8);
  refused(() => authorizeLaunch({ plan: plan(...Array(26).fill(LITE)), journal: journalH12(), decisions: decisionsBoth, envelope: 'H12', now: NOW_H12 }), /H12 en permet 25 par lancement/);
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journalH12(), decisions: decisionsBoth, envelope: 'H12', now: Date.parse('2026-11-02T00:00:00Z') }), /H12 échue le 2026-10-31/);
  const used59 = journalH12({ counter: `**Compteur H12 : 59 / 120 · 0 CHF / 8** (${APP_MODEL} 59 / 60 ; ${LITE} 0 / 60)` });
  refused(() => authorizeLaunch({ plan: plan(APP_MODEL, APP_MODEL), journal: used59, decisions: decisionsBoth, envelope: 'H12', now: NOW_H12 }), /59 \/ 60 déjà utilisés sous H12/);
  refused(() => authorizeLaunch({ plan: plan('gemini-3.1-pro-preview'), journal: journalH12(), decisions: decisionsBoth, envelope: 'H12', now: NOW_H12 }), /n'est pas comparé par ce banc/);
  // Sans section H12, rien ne part ; le compteur #91 n'en tient pas lieu.
  refused(() => authorizeLaunch({ plan: plan(LITE), journal: journal91(), decisions: decisionsBoth, envelope: 'H12', now: NOW_H12 }), /Section « Banc réel des usages complexes » introuvable/);
  assert.equal(readEnvelopeCounter(blankCounter(used59, 'H12'), 'H12').used, 0);
});

test('H12 : le modèle d\'essai de la décision 69 (Argon) admis sous H12 seulement, et seulement ces trois modèles', () => {
  const line = H12_LINE.replace(' ; par-lancement', ` ; ${ARGON_MODEL}=30 ; par-lancement`).replace('plafond-chf=8', 'plafond-chf=15');
  const auth = parseAuthorization(decisions(line), 'H12');
  assert.deepEqual(auth.perModel, { [APP_MODEL]: 60, [LITE]: 60, [ARGON_MODEL]: 30 });
  assert.equal(auth.maxChf, 15);
  const counter = `**Compteur H12 : 0 / 150 · 0 CHF / 15**`;
  assert.equal(authorizeLaunch({ plan: [{ model: ARGON_MODEL, thinking: 'high' }, { model: LITE }], journal: journalH12({ counter }), decisions: decisions(line), envelope: 'H12', now: NOW_H12 }).envelope, 'H12');
  // Jamais sous H9 ni dans l'enveloppe partagée ; jamais un autre modèle « 4 » ; borne propre de 30.
  refused(() => parseAuthorization(decisions(H9_LINE.replace(' ; par-lancement', ` ; ${ARGON_MODEL}=3 ; par-lancement`)), 'H9'), /Élément H9 inconnu/);
  refused(() => authorizeLaunch({ plan: plan(ARGON_MODEL), journal: journal91(), decisions: decisions(`${H9_LINE}\n${line}`), useH9: true, now: NOW_H12 }), /n'est pas comparé par ce banc/);
  refused(() => authorizeLaunch({ plan: plan(ARGON_MODEL), journal: journalText(0), now: NOW_H12 }), /n'est pas comparé par ce banc/);
  refused(() => parseAuthorization(decisions(line.replace(ARGON_MODEL, 'gemini-4-pro')), 'H12'), /Élément H12 inconnu/);
  refused(() => authorizeLaunch({ plan: [{ model: ARGON_MODEL, thinking: 'minimal' }], journal: journalH12({ counter }), decisions: decisions(line), envelope: 'H12', now: NOW_H12 }), /non acceptée par gemini-4-argon/);
  const used30 = journalH12({ counter: `**Compteur H12 : 30 / 150 · 0 CHF / 15** (${ARGON_MODEL} 30 / 30)` });
  refused(() => authorizeLaunch({ plan: plan(ARGON_MODEL), journal: used30, decisions: decisions(line), envelope: 'H12', now: NOW_H12 }), /30 \/ 30 déjà utilisés sous H12/);
  assert.deepEqual(H12_MODELS, [APP_MODEL, LITE, ARGON_MODEL]);
});

test('H12 : dépense lue dans la seule section H12 ; lignes #91 et G38 (8 colonnes, ajoutées en fin de fichier) exclues', () => {
  const rows = `${row91('0.2000 CHF')}\n${g38Row('0.3662 CHF')}\n`;
  const journal = journalH12({ rows, tail: `${g38Row('0.3597 CHF')}\n` });
  assert.equal(spentIn(journal, 'H12'), 0.2);
  // La section #91 ne compte plus une ligne G38 tombée dans son tableau (D100, 16.10).
  assert.equal(spent91(journal), 0.03);
  assert.equal(spentIn(journal, 'H9'), 0.03);
  const capped = H12_LINE.replace('plafond-chf=8', 'plafond-chf=0.5');
  const launch = estimatedChf => authorizeLaunch({ plan: plan(LITE), journal, decisions: decisions(capped), envelope: 'H12', now: NOW_H12, estimatedChf });
  assert.equal(launch(0.3).envelope, 'H12');
  refused(() => launch(0.31), /il dépasserait le plafond H12 de 0\.5 CHF/);
});

test('H12 : réservation avant l\'envoi, ligne au tableau H12, compteurs #91 et partagé intacts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gemini-bench-h12-'));
  const journalPath = join(dir, 'gemini-journal.md'), lockDir = join(dir, 'gemini-journal.lock');
  writeFileSync(journalPath, journalH12({ tail: '' }));
  const auth = parseAuthorization(decisions(H12_LINE.replace(`${LITE}=60`, `${LITE}=2`)), 'H12');
  assert.deepEqual([1, 2].map(() => reserveCall(journalPath, { envelope: 'H12', model: LITE, auth, lockDir }).label), ['1', '2']);
  refused(() => reserveCall(journalPath, { envelope: 'H12', model: LITE, auth, lockDir }), /Borne H12 atteinte/);
  refused(() => reserveCall(journalPath, { envelope: 'H12', model: APP_MODEL, auth, lockDir, costChf: 8.01 }), /Plafond H12/);
  assert.equal(reserveCall(journalPath, { envelope: 'H12', model: APP_MODEL, auth, lockDir, costChf: 0.01 }).label, '3');
  appendEnvelopeRow(journalPath, journalRow91({ label: '3', at: new Date('2026-10-16T15:00:00Z'), launch: 'C1', test: 'compagnon-complet · cc-puissance',
    architecture: `${APP_MODEL} · low · compagnon`, modelVersion: APP_MODEL, thinking: 'low', inputTokens: 10, outputTokens: 5, latencyMs: 900, costMicroChf: 12_300, result: 'HTTP 200' }),
  lockDir, auth.perModel, 'H12');
  const journal = readFileSync(journalPath, 'utf8');
  assert.match(journal, /\*\*Compteur H12 : 3 \/ 120 · 0\.0123 CHF \/ 8\*\* \(gemini-3\.8-flash 1 \/ 60 ; gemini-3\.5-flash-lite 2 \/ 2\)/);
  // La ligne finit le tableau H12, avant la section #91, dont le compteur et le tableau restent intacts.
  assert.match(journal, /\| 3 \| 16\.10\.? 17:00 \| C1 \| compagnon-complet · cc-puissance \| [^\n]+\| 0\.0123 CHF \| HTTP 200 \|\n\n## Banc réel #91/);
  assert.equal(readCounter91(journal).used, 0);
  assert.equal(spent91(journal), 0.03);
  assert.equal(readSharedCounter(journal).used, 5);
});

test('clé locale : environnement d\'abord, puis functions/.secret.local ; absente sinon', () => {
  assert.equal(readLocalKey({ env: { GEMINI_API_KEY: ' from-env ' }, readFile: () => assert.fail() }), 'from-env');
  assert.equal(readLocalKey({ env: {}, readFile: () => 'OTHER=1\nGEMINI_API_KEY="from-file"\n' }), 'from-file');
  assert.equal(readLocalKey({ env: {}, readFile: () => { throw new Error('ENOENT'); } }), undefined);
  assert.equal(readLocalKey({ env: { GEMINI_API_KEY: '  ' }, readFile: () => 'GEMINI_API_KEY=' }), undefined);
});
