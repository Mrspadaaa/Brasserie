/**
 * Banc de tri d'une facture (voie « ta », 14.11) : de vraies lectures REJOUÉES (jamais Gemini) passent par le code de l'app, ligne par ligne :
 * lecture → brouillon (`brouillonDeLecture`) → articles neufs ou rattachés (`articlesNeufsDe`, `stockQuantityFor`) → mur (`construireMur`, `rayonDuMur`).
 * Les lectures sont hors Git : ce test ne tourne que si TRI_LECTURES (JSON { docN: { result } }) est posé ; il écrit TRI_SORTIE (JSON). Sans variable : ignoré.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../src/services/purchaseEntry';
import { articlesNeufsDe, stockQuantityFor, uniteEffective } from '../../../src/services/purchaseEntry';
import type { ScannedInvoiceResult } from '../../../src/services/geminiScanner';
import { brouillonDeLecture } from '../../../src/ui/depense/finale';
import { construireMur } from '../../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../../src/domain/stock/murSources';
import { rayonDuMur } from '../../../src/domain/stock/murRayon';
import type { StockItem } from '../../../src/types';

const LECTURES = process.env.TRI_LECTURES, SORTIE = process.env.TRI_SORTIE;
const ORDRE = (process.env.TRI_DOCS ?? 'doc5,doc6,doc9,doc11,doc12,doc14,doc8,doc10').split(',');
const AUJOURDHUI = '14.11.2026';
const vide = (n: string): PurchaseDraft => ({ submissionId: n, date: AUJOURDHUI, vendor: '', invoiceNumber: '', description: '', category: 'brassage', lines: [], paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: AUJOURDHUI, dueDate: '', sourceCurrency: 'CHF' });
const ligneVide = (): PurchaseLineDraft => ({ id: 'x', description: '', kind: 'ingredient', unit: '', stockAction: 'none', equipmentAction: 'none' });

describe.skipIf(!LECTURES)('banc de tri des factures', () => {
  it('rejoue les lectures et écrit le tri', async () => {
    const lectures = JSON.parse(readFileSync(LECTURES!, 'utf8')) as Record<string, { result: ScannedInvoiceResult }>;
    const data = await import('../../../src/domain/hopIndex/v4/data');
    const catalogues = { houblons: await data.chargerCataloguePlein() };
    let stock: StockItem[] = [];
    const lignes: Array<Record<string, unknown>> = [];
    for (const doc of ORDRE) {
      const result = lectures[doc]?.result; if (!result) continue;
      const { draft } = brouillonDeLecture(vide(`B${doc}`), result, { stockItems: stock, today: AUJOURDHUI, ligneVide });
      const neufs = articlesNeufsDe(draft, stock, catalogues);
      const parLigne = new Map(neufs.map(n => [n.lineId, n]));
      const avant = stock;
      const ajoutes: StockItem[] = neufs.map(n => n.item);
      const incr = new Map<string, number>();
      const infos = draft.lines.map((l, idx) => {
        const info: Record<string, unknown> = { doc, n: idx + 1, lu: result.items[idx]?.name, kindLu: result.items[idx]?.kind, stockCategoryLu: result.items[idx]?.stockCategory, kind: l.kind, qte: l.quantity, unite: l.unit || (l.uniteDeduite ? `(${l.uniteDeduite.unite})` : ''), action: l.stockAction, desc: l.description };
        if (l.stockAction === 'new') { const n = parLigne.get(l.id); info.ref = n?.ref; }
        if (l.stockAction === 'existing') {
          const it = avant.find(s => s.ref === l.stockRef);
          info.ref = l.stockRef; info.rattacheA = it?.name;
          if (it && l.quantity !== undefined) { const c = stockQuantityFor({ description: l.description, quantity: l.quantity, unit: uniteEffective(l) }, it); info.qteAjoutee = c.ok ? c.quantity : `KO:${c.reason}`; info.uniteArticle = it.unit; if (c.ok) incr.set(it.ref, (incr.get(it.ref) ?? 0) + c.quantity); }
        }
        return info;
      });
      stock = [...avant.map(s => (incr.has(s.ref) ? { ...s, currentStock: s.currentStock + incr.get(s.ref)! } : s)), ...ajoutes];
      const mur = construireMur(stock, sourcesDeLApp);
      const place = new Map<string, { rayon: string; colonne: string; parDefaut?: boolean }>();
      for (const r of mur.rayons) for (const g of r.groupes) for (const m of g.marques) place.set(m.ref, { rayon: r.nom, colonne: g.mot, ...(m.parDefaut ? { parDefaut: true } : {}) });
      for (const info of infos) {
        const it = stock.find(s => s.ref === info.ref);
        if (!it) { lignes.push({ ...info, article: null }); continue; }
        const p = place.get(it.ref);
        lignes.push({ ...info, article: it.name, categorie: it.category, uniteArticle: it.unit, alphaPct: it.alphaPct, colorEbc: it.colorEbc, origine: it.origin, fiche: it.fiche?.id, rayonRegle: rayonDuMur(it), rayonMur: p?.rayon ?? 'Autres stocks', colonne: p?.colonne ?? null, parDefaut: p?.parDefaut ?? false });
      }
    }
    if (SORTIE) writeFileSync(SORTIE, JSON.stringify({ lignes, stock }, null, 1));
    expect(lignes.length).toBeGreaterThan(0);
  }, 120000);
});
