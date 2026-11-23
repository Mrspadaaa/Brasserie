// Banc visuel des fournisseurs : la vraie page, les vrais styles, des dépenses SIMULÉES (« exemple »), thème par ?theme=cave.
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { StockItem, Transaction } from '../../src/types';
import { PageFournisseurs } from '../../src/ui/fournisseurs/PageFournisseurs';
import '../../src/index.css';

// Les malts s'achètent au sac : la ligne de facture dit « sac 25 kg », pas « kg » (critique fournisseur n° 7).
const ligne = (ref: string, desc: string, prix: number, unite = ref === 'pils' || ref === 'munich' ? 'sac 25 kg' : 'kg') =>
  ({ id: `${ref}-${prix}`, description: desc, kind: 'ingredient', amountCents: prix * 10, quantity: 10, unit: unite, unitPriceCents: prix, stockItemRef: ref });
const depense = (id: string, date: string, vendor: string, cents: number, lignes: unknown[] = []): Transaction => ({
  id, date, description: `Achat ${vendor}`, amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, category: 'matieres', subcategory: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: lignes, vendor }
} as unknown as Transaction);
const art = (ref: string, name: string, category: string, supplier?: string): StockItem =>
  ({ id: ref, ref, name, category, unit: 'kg', currentStock: 1, reorder: false, supplier } as StockItem);

const TX = [
  depense('t1', '14.01.2026', 'Brouwland', 34020, [ligne('pils', 'Malt Pilsner', 3650)]),
  depense('t2', '19.03.2026', 'Brouwland', 40530, [ligne('pils', 'Malt Pilsner', 3650), ligne('munich', 'Malt Munich', 4020)]),
  depense('t3', '08.06.2026', 'BROUWLAND BV', 73190, [ligne('pils', 'Malt Pilsner', 3780), ligne('citra', 'Houblon Citra T90', 3950)]),
  depense('t4', '08.11.2026', 'brouwland.com', 38460, [ligne('pils', 'Malt Pilsner', 3890), ligne('us05', 'Levure SafAle US-05', 520, 'sachet')]),
  depense('t5', '30.05.2025', 'Brouwland Belgique', 20510),
  depense('t6', '09.10.2026', 'Hopsteiner', 51000, [ligne('citra', 'Houblon Citra T90', 3480)]),
  depense('t7', '02.10.2026', 'Hopsteiner', 30000)
];
const STOCKS = {
  rawMaterials: [art('pils', 'Malt Pilsner', 'Malt', 'Brouwland'), art('munich', 'Malt Munich', 'Malt'), art('citra', 'Houblon Citra T90', 'Houblon'),
    art('us05', 'Levure SafAle US-05', 'Levure'), art('lac', 'Malt du Lac', 'Malt', 'Malterie du Lac')],
  cleaning: [] as StockItem[]
};

const theme = new URLSearchParams(location.search).get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
createRoot(document.getElementById('root')!).render(
  <main className="mx-auto max-w-4xl px-3 pt-2">
    <PageFournisseurs transactions={TX} stocks={STOCKS} onBack={() => undefined} onScanner={() => undefined} />
  </main>
);
