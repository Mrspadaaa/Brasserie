// Liste les modèles d'embedding offerts par l'API (lecture seule, aucun coût). Clé jamais affichée.
import { readLocalKey, redact } from '../../../scripts/gemini-usage-bench-guard.mjs';
const key = readLocalKey();
if (!key) { console.log('Aucune clé locale'); process.exit(1); }
let url = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200';
const out = [];
for (let i = 0; i < 5 && url; i++) {
  const r = await fetch(url, { headers: { 'x-goog-api-key': key } });
  const j = await r.json();
  if (!r.ok) { console.log(redact(JSON.stringify(j).slice(0, 300), key)); process.exit(1); }
  out.push(...(j.models ?? []));
  url = j.nextPageToken ? `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&pageToken=${j.nextPageToken}` : '';
}
for (const m of out) {
  const methods = m.supportedGenerationMethods ?? [];
  if (methods.some(x => /embed/i.test(x)) || /embed/i.test(m.name) || /flash-lite/i.test(m.name))
    console.log(m.name, '|', m.version, '|', methods.join(','), '| in', m.inputTokenLimit, '| dims', m.outputDimensionality ?? '-');
}
console.log('total', out.length);
