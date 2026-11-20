// Voie g1 : range les lectures BRUTES du modèle (raw/*.json du banc) en fixtures ANONYMISÉES pour Vitest (L28) : la vraie réponse, avant normalisation.
// Usage : node fixtures-brut.mjs   → tests/unit/depense/g1/brut/<nom>.json  = { lectures: [lecture1, lecture2, lecture3?] }
// Anonymisé : fournisseur, numéros, textes libres, suites de 8 chiffres hors `reference`. Lignes, montants, quantités, structure : inchangés.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dest = path.resolve(here, '../../../../../tests/unit/depense/g1/brut');
const REELS = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const SETS = [
  ['doc14-port-en-ligne', 'banc-g1bugs-lot2', 'doc14-t2'],
  ['doc25-ticket-t1', 'banc-g1bugs-lot1', 'doc25-t1'],
  ['doc25-provisoire-t1', 'banc-g1bugs-lot2', 'doc25-t1'],
  ['doc25-provisoire-t2', 'banc-g1bugs-lot2', 'doc25-t2'],
  ['doc2-sedation', 'banc-g1bugs-lot1', 'doc2-t1'],
];
const FICTIF = { vendor: 'Fournisseur Fictif SA', invoiceNumber: '100001', orderNumber: '', description: '', paymentEvidence: undefined };
function scrub(value, key = '') {
  if (Array.isArray(value)) return value.map(v => scrub(v, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v, k)]));
  if (typeof value === 'string' && key !== 'reference') value = value.replace(/\d{8,}/g, '10000001').replace(/\S+@\S+/g, 'x@y.z').replace(/BAUHAUS/gi, 'MAGASIN');
  return value;
}
fs.mkdirSync(dest, { recursive: true });
for (const [nom, lot, base] of SETS) {
  const lectures = [];
  for (const n of [1, 2, 3]) {
    const f = path.join(REELS, lot, 'raw', `${base}-Csv8${n}.json`);
    if (!fs.existsSync(f)) continue;
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const texte = j.candidates[0].content.parts.filter(p => p.thought !== true).map(p => p.text).join('');
    const lecture = scrub({ ...JSON.parse(texte), ...FICTIF });
    if (typeof lecture.paymentEvidence !== 'string') lecture.paymentEvidence = JSON.parse(texte).paymentEvidence;
    lectures.push(lecture);
  }
  fs.writeFileSync(path.join(dest, `${nom}.json`), JSON.stringify({ lectures }, null, 1));
  const t = JSON.stringify(lectures);
  console.log(`écrit ${nom} : ${lectures.length} lectures, ${lectures.map(l => l.items.length).join('/')} lignes ; suites de 8 chiffres hors référence : ${(t.replace(/"reference":"[^"]*"/g, '').match(/\d{8,}/g) ?? []).length}`);
}
