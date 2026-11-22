// Sonde jetable (comptes seulement) : où le provisoire et le final diffèrent, par pièce. Aucune valeur écrite.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readingFromResponse } from '../../../../../../scripts/banc-lecture-facture';
import { finalOfStarVote, needsThirdLite, provisoireDeDeux, rangsProvisoires } from '../../../../../../functions/src/invoiceScanVote';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const REELS = path.join(RACINE, 'work/finalisation-tickets-2026-10-08/H13-reels');
const banc = JSON.parse(readFileSync(path.join(REELS, 'banc-k6-C/results.json'), 'utf8'));
for (const doc of ['doc1','doc2','doc3','doc4','doc5','doc6','doc14']) {
  const rec = banc.records.find((r: any) => r.doc === doc && r.tirage === 1) ?? banc.records.find((r: any) => r.doc === doc);
  const run = rec.variants['Csv8+N'] ?? rec.variants['Csv8'];
  const rs = rec.readings.filter((r: any) => run.ids.includes(r.meta.id));
  const by = (k: number) => rs.find((r: any) => r.meta.lecture === k);
  const mk = (r: any) => { const f = path.join(REELS, 'banc-k6-C/raw', `${doc}-t${rec.tirage}-${r.meta.id}.json`); const x = readingFromResponse(r.meta, JSON.parse(readFileSync(f, 'utf8')), r.ms, r.costMicroChf, true); return { normalized: x.normalized as any, cause: x.cause }; };
  const l1 = mk(by(1)), l2 = mk(by(2)), l3 = by(3) ? mk(by(3)) : undefined;
  const need = needsThirdLite(l1, l2);
  if (!l3 || !need) { console.log(doc, 'sans 3.8', need, !!l3); continue; }
  const prov = provisoireDeDeux(l1, l2), fin = finalOfStarVote(l1, l2, l3).result;
  const rangs = rangsProvisoires(prov.items, fin.items);
  const champs = ['quantity', 'unit', 'unitPrice', 'amount', 'name'];
  const diffs: Record<string, number> = {};
  fin.items.forEach((it: any, i: number) => { const r = rangs[i]; if (r === null) return; for (const c of champs) if (JSON.stringify(prov.items[r]?.[c]) !== JSON.stringify(it[c])) diffs[c] = (diffs[c] ?? 0) + 1; });
  const ent = ['total', 'amountTTC', 'date', 'vendor', 'invoiceNumber', 'amountHT', 'vat'].filter(k => JSON.stringify(prov[k]) !== JSON.stringify(fin[k]));
  console.log(doc, 'tirage', rec.tirage, 'prov', prov.items.length, 'fin', fin.items.length, 'nulles', rangs.filter(r => r === null).length, 'diffs', JSON.stringify(diffs), 'entete', ent.join(','), 'cles', Object.keys(prov).slice(0, 30).join(','));
  console.log('  rang0 prov/fin items cles', Object.keys(prov.items[0]).join(','));
}
