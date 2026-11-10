// La normalisation rejouée sur une lecture déjà normalisée rend-elle la même lecture ? (pour recalculer les contrôles d'une lecture fusionnée)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { parseReadResponse } from '../../../../scripts/banc-lecture-facture';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { isoCurrency } from '../../../../functions/src/invoiceScanVote';
const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
let n = 0, ok = 0; const diff = new Map<string, number>();
for (const d of readdirSync(R).filter(d => d.startsWith('banc-') && existsSync(`${R}/${d}/raw`)))
  for (const f of readdirSync(`${R}/${d}/raw`).filter(f => /Csv8\d\.json$/.test(f))) {
    let a: any; try { const b = parseReadResponse(JSON.parse(readFileSync(`${R}/${d}/raw/${f}`, 'utf8')), { codes: true }); b.currency = isoCurrency(b.currency); a = normalizeInvoiceScan(b); } catch { continue; }
    const b = normalizeInvoiceScan(JSON.parse(JSON.stringify(a))); n++;
    if (isDeepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)))) ok++;
    else for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (!isDeepStrictEqual(JSON.parse(JSON.stringify(a[k] ?? null)), JSON.parse(JSON.stringify(b[k] ?? null)))) diff.set(k, (diff.get(k) ?? 0) + 1);
  }
console.log('lectures', n, 'identiques', ok, JSON.stringify([...diff]));
