// Liste les modèles « gemini » de la clé locale (models.list). La clé vient de readLocalKey, jamais affichée.
// Lancer depuis le dépôt Brasserie (readLocalKey lit functions/.secret.local relatif au dossier courant).
import { pathToFileURL } from 'node:url';
const GUARD = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/scripts/gemini-usage-bench-guard.mjs';
const { readLocalKey, redact } = await import(pathToFileURL(GUARD).href);
const key = readLocalKey();
if (!key) { console.log('AUCUNE CLE'); process.exit(2); }
const out = [];
let token = '';
do {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200${token ? '&pageToken=' + token : ''}`, { headers: { 'x-goog-api-key': key } });
  const j = await r.json();
  if (!r.ok) { console.log(redact(`HTTP ${r.status} ${JSON.stringify(j).slice(0, 300)}`, key)); process.exit(1); }
  for (const m of j.models || []) out.push(m.name.replace('models/', ''));
  token = j.nextPageToken || '';
} while (token);
console.log(out.filter((n) => /gemini/.test(n)).join('\n'));
