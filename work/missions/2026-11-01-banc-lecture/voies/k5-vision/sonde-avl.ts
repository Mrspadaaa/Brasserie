// Sonde de k5 (01.11, L20) : Gemini 3.5 Flash-Lite accepte-t-il l'outil d'exécution de code (Avl) ? Image de 1 × 1 px, aucune pièce du brasseur.
// Deux essais, dans l'ordre, arrêt au premier qui passe : (1) l'outil ET le schéma de production (`responseSchema`) ; (2) l'outil et le JSON demandé dans le texte
// (`--av-sans-schema`). Un refus (HTTP 400) ne coûte rien ; une réussite coûte quelques dixièmes de centime, journalisée dans journal-gemini.md.
// Le pilote la lance AVANT la passe payante :
//   npx vite-node --config vitest.config.ts work/missions/2026-11-01-banc-lecture/voies/k5-vision/sonde-avl.ts
// Sortie : le statut HTTP, les sortes de parties de la réponse (texte, code, résultat du code), la décision (avec ou sans `--av-sans-schema`) ; jamais la clé.
import { appendFileSync } from 'node:fs';
import { buildReadBody, LITE_MODEL, LITE_RAISED_OUTPUT, AV_NOTE, MISSION_JOURNAL, parseReadResponse, spentInJournal, withToolTokens } from '../../../../../scripts/banc-lecture-facture';
// @ts-ignore — module JavaScript sans déclarations
import { readLocalKey, redact } from '../../../../../scripts/gemini-usage-bench-guard.mjs';
import { observedGeminiCostDetails, quoteGeminiCost } from '../../../../../functions/src/geminiCosts';
import { INVOICE_SCAN_PROMPTS } from '../../../../../functions/src/invoiceScanPrompts';

const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const key = readLocalKey();
if (!key) throw new Error('Aucune clé locale.');

const prompt = `${INVOICE_SCAN_PROMPTS[0]}\n\n${AV_NOTE}`;
const probes: Array<[string, boolean]> = [['avec-schema', false], ['sans-schema', true]];
let decided = '';
for (const [name, freeJson] of probes) {
  const body = buildReadBody({ data: PIXEL, mimeType: 'image/png' }, prompt, LITE_RAISED_OUTPUT, 'LOW', { codeExecution: true, freeJson }) as Record<string, unknown> & { tools?: unknown };
  const { tools, ...quotable } = body;
  const quote = quoteGeminiCost(LITE_MODEL, quotable);
  const started = Date.now();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${LITE_MODEL}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ ...quote.body, tools }) });
  const json: any = await response.json().catch(() => ({}));
  if (!response.ok) { console.log(name, 'HTTP', response.status, redact(String(json?.error?.message ?? ''), key).slice(0, 300)); continue; }
  const kinds = (json?.candidates?.[0]?.content?.parts ?? []).map((part: any) => (part.executableCode ? 'code' : part.codeExecutionResult ? 'résultat' : part.thought ? 'réflexion' : typeof part.text === 'string' ? 'texte' : 'autre'));
  let readable = 'illisible';
  try { parseReadResponse(json, { lastTextPart: true, validate: freeJson }); readable = 'lisible par le banc'; } catch { readable = 'JSON non exploitable (normal pour une image blanche)'; }
  const cost = observedGeminiCostDetails(quote, withToolTokens(json))?.chargedMicroChf ?? 0;
  const cumul = (spentInJournal(MISSION_JOURNAL) + cost) / 1e6; // spentInJournal rend des micro-CHF
  appendFileSync(MISSION_JOURNAL, `| ${new Date().toISOString().replace('T', ' ').slice(0, 19)} | sonde 1 px | 1 | Avl-${name} | 1 | ${LITE_MODEL} | ${Date.now() - started} ms | ${json.usageMetadata?.promptTokenCount ?? '?'} | ${json.usageMetadata?.candidatesTokenCount ?? '?'} | ${(cost / 1e6).toFixed(6)} | ${cumul.toFixed(6)} | OK (sonde du pilote, k5) |\n`);
  console.log(name, 'OK', (cost / 1e6).toFixed(6), 'CHF ; parties :', kinds.join(', ') || 'aucune', '; finishReason', json?.candidates?.[0]?.finishReason, '; réponse', readable);
  decided = freeJson ? '--av-sans-schema' : '(sans option : le schéma de production passe avec l’outil)';
  break;
}
console.log(decided ? `DÉCISION : lancer Avl ${decided}` : 'DÉCISION : les deux essais refusés — Avl ne peut pas se mesurer (écrire le motif au rapport).');
