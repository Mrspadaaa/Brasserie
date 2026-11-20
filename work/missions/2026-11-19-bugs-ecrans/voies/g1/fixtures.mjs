// Voie g1 : range une VRAIE lecture du banc (results.json) en fixture ANONYMISÉE pour Vitest (L28).
// Usage : node fixtures.mjs <dossier du banc> <doc:nom,doc:nom> [variante]   → tests/unit/depense/g1/<nom>.json
// Anonymisé : fournisseur, numéros, moyen de paiement, textes libres. Lignes, montants, quantités, structure : inchangés.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dest = path.resolve(here, '../../../../../tests/unit/depense/g1');
const dir = path.resolve(process.argv[2]);
const wanted = Object.fromEntries(process.argv[3].split(',').map(p => p.split(':')));
const variante = process.argv[4] ?? 'Csv8+N';
const res = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'));
fs.mkdirSync(dest, { recursive: true });

const FICTIF = { vendor: 'Fournisseur Fictif SA', invoiceNumber: '100001', orderNumber: '', description: '', paymentMethod: undefined };
function scrub(value, key = '') {
  if (Array.isArray(value)) return value.map(v => scrub(v, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v, k)]));
  if (typeof value === 'string' && key !== 'reference' && key !== 'evidence') value = value.replace(/\d{8,}/g, '10000001').replace(/\S+@\S+/g, 'x@y.z');
  if (key === 'evidence' && typeof value === 'string') value = value.replace(/\d{8,}/g, '10000001');
  return value;
}
for (const rec of res.records) {
  const nom = wanted[rec.doc];
  if (!nom) continue;
  const v = rec.variants[variante] ?? rec.variants[Object.keys(rec.variants)[0]];
  const result = scrub({ ...v.result, ...FICTIF });
  if (result.paymentEvidence && typeof result.paymentEvidence === 'object') for (const k of Object.keys(result.paymentEvidence)) if (typeof result.paymentEvidence[k] === 'string') result.paymentEvidence[k] = '';
  const file = path.join(dest, `${nom}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 1));
  const texte = JSON.stringify(result);
  console.log(`écrit ${path.relative(process.cwd(), file)} : ${result.items?.length} lignes ; suites de 8 chiffres restantes hors référence : ${(texte.replace(/"reference":"[^"]*"/g, '').match(/\d{8,}/g) ?? []).length}`);
}
