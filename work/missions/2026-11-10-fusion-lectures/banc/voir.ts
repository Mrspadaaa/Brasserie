// Vue d'un tirage (terminal seulement, rien d'écrit) : colonnes de la fusion, lignes fausses et appariements faux. Usage : npx tsx voir.ts <dossier> <doc> <t>
import { readFileSync } from 'node:fs';
import { parseReadResponse } from '../../../../scripts/banc-lecture-facture';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { colonnesDeTrois, isoCurrency, lectureFusionnee } from '../../../../functions/src/invoiceScanVote';
const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const [d, doc, t] = process.argv.slice(2);
const L = [1, 2, 3].map(k => { const b = parseReadResponse(JSON.parse(readFileSync(`${R}/${d}/raw/${doc}-${t}-${process.env.P ?? "Csv8"}${k}.json`, 'utf8')), { codes: true }); b.currency = isoCurrency(b.currency); return normalizeInvoiceScan(b) as any; });
const V: any[] = [];
for (const f of ['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json', 'cas-5.json', 'cas-6.json', 'cas-7.json']) { try { for (const c of (JSON.parse(readFileSync(`${R}/${f}`, 'utf8')).cases ?? [])) if (c.id === doc) V.push(...c.expected.items); } catch { /* */ } }
const cols = colonnesDeTrois(L[0], L[1], L[2]), fus = lectureFusionnee(L[0], L[1], L[2]) as any;
const c = (x: any) => (x ? `${String(x.name).slice(0, 22).padEnd(22)} ${String(x.amountTTC).padStart(6)} q${x.quantity ?? '-'}` : ''.padEnd(32));
console.log('vérité', V.map(v => `${v.name.slice(0, 14)} ${v.amountTTC}`).join(' | '));
cols.forEach((col, k) => console.log(String(k).padStart(2), col.map((r, i) => (r === null ? '·'.padEnd(32) : c(L[i].items[r]))).join(' │ '), '→', fus.items[k]?.amountTTC, 'q' + (fus.items[k]?.quantity ?? '-')));
console.log('totaux', L.map(x => x.amountTTC).join(' / '), '→', fus.amountTTC, '; payé', L.map(x => x.amountPaid).join(' / '), '→', fus.amountPaid);
