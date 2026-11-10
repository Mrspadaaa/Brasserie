// Les champs de contrôle lus par chaque lecture d'un tirage (terminal seulement). Usage : npx tsx comptes.ts <dossier> <doc> <t>
import { existsSync, readFileSync } from 'node:fs';
import { parseReadResponse } from '../../../../scripts/banc-lecture-facture';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const [d, doc, t] = process.argv.slice(2);
for (const k of [1, 2, 3]) {
  const f = `${R}/${d}/raw/${doc}-${t}-C${k}.json`; if (!existsSync(f)) { console.log(k, 'absente'); continue; }
  const x: any = normalizeInvoiceScan(parseReadResponse(JSON.parse(readFileSync(f, 'utf8')), { codes: true }));
  console.log(k, 'lignes', x.items.length, 'total', x.amountTTC, 'payé', x.amountPaid, 'terminal', x.terminalAmount, 'counted', x.countedAmounts, 'printedItem', x.printedItemCount, 'printedLine', x.printedLineCount);
}
