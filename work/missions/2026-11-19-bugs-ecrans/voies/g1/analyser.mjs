// Voie g1 : lit une sortie du banc (results.json) et la compare à la vérité (g1-cas.json), par pièce. Aucune valeur de pièce n'est écrite dans Git.
// Usage : node analyser.mjs <dossier du banc> [variante, défaut Csv8+N] [doc,doc]
import fs from 'node:fs';
import path from 'node:path';

const REELS = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const dir = path.resolve(process.argv[2]);
const variante = process.argv[3] ?? 'Csv8+N';
const only = process.argv[4]?.split(',');
const cas = new Map(JSON.parse(fs.readFileSync(path.join(REELS, 'g1-cas.json'), 'utf8')).cases.map(c => [c.id, c]));
const res = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'));
const cents = n => (typeof n === 'number' ? Math.round(n * 100) : null);
const amountOf = it => (it.amountTTC ?? it.amount ?? null);

function multiset(values) { const m = new Map(); for (const v of values) m.set(v, (m.get(v) ?? 0) + 1); return m; }
function diff(a, b) { // éléments de a absents de b (multiensemble)
  const out = []; const mb = multiset(b);
  for (const v of a) { if ((mb.get(v) ?? 0) > 0) mb.set(v, mb.get(v) - 1); else out.push(v); }
  return out;
}

for (const rec of res.records) {
  if (only && !only.includes(rec.doc)) continue;
  const c = cas.get(rec.doc);
  const v = rec.variants[variante] ?? rec.variants[Object.keys(rec.variants)[0]];
  const r = v.result ?? {};
  const items = r.items ?? [];
  const truth = c.expected?.items ?? [];
  const lu = items.map(i => cents(amountOf(i)));
  const vrai = truth.map(i => cents(amountOf(i)));
  const manquants = diff(vrai, lu), enPlus = diff(lu, vrai);
  const sansQte = items.filter(i => i.quantity == null || i.quantity === '').length;
  const sansPrix = items.filter(i => i.price == null).length;
  const sansMontant = items.filter(i => amountOf(i) == null).length;
  const incoherent = items.filter(i => i.quantity != null && i.price != null && amountOf(i) != null && Math.abs(i.quantity * i.price - amountOf(i)) > 0.02 + 0.005 * amountOf(i)).length;
  const somme = items.reduce((s, i) => s + (amountOf(i) ?? 0), 0);
  console.log(`\n== ${rec.doc} t${rec.tirage} ${variante} : ${items.length} lignes lues / ${truth.length} vraies ; somme ${somme.toFixed(2)} ; total lu ${r.amountTTC ?? '—'} (vrai ${c.expected?.amountTTC ?? '—'}) ; ${v.ms} ms ; 3.8 ${v.thirdFrom ?? '—'}`);
  console.log(`   date lue : ${r.date ?? 'ABSENTE'} (vraie : ${JSON.stringify(c.expected?.date ?? null)}) ; vendeur lu : ${r.vendor ? 'oui' : 'NON'} ; TVA ${r.tvaAmount ?? '—'} (vraie ${c.expected?.tvaAmount ?? '—'}) ; devise ${r.currency ?? '—'}`);
  console.log(`   montants vrais non retrouvés : ${manquants.map(x => x / 100).join(' ') || 'aucun'} ; montants lus en trop : ${enPlus.map(x => x / 100).join(' ') || 'aucun'}`);
  console.log(`   sans quantité ${sansQte} ; sans prix ${sansPrix} ; sans montant ${sansMontant} ; qté × prix ≠ montant ${incoherent}`);
  if (process.env.DETAIL) for (const [k, i] of items.entries()) console.log(`     ${k + 1}. ${String(i.name).slice(0, 34)} | qté ${i.quantity ?? '∅'} ${i.unit ?? ''} | prix ${i.price ?? '∅'} | montant ${amountOf(i) ?? '∅'} | ${i.nameFr ?? ''}`);
  for (const lecture of rec.readings ?? []) {
    const l = lecture.result ?? lecture.data ?? lecture;
    if (l?.items) console.log(`   lecture ${lecture.lecture ?? lecture.meta?.lecture ?? '?'} (${lecture.model ?? lecture.meta?.model ?? '?'}) : ${l.items.length} lignes, date ${l.date ?? 'ABSENTE'}, printedLineCount ${l.printedLineCount ?? '—'}`);
  }
}
