/**
 * Voie s1-stock — la facture 372765 (Brau- und Rauchshop, 23 lignes) contre le stock SIMULÉ de d1 (16 articles, pas le stock réel du
 * brasseur). Fixtures réduites : fixtures/lignes-372765.json (vérité de la facture), fixtures/stock-simule.json.
 * Gemini n'est jamais appelé. Attendu : les 9 lignes appariées avant la voie le restent ; Caramünch, Target, Galaxy et les levures
 * s'apparient quand leur article existe ; Goldings et Hallertauer, absents, n'ont aucune proposition ; la mouture, aucune.
 */
import { describe, expect, it } from 'vitest';
import { proposeStockItem } from '../../../../src/services/stockLineMatching';
import type { StockItem } from '../../../../src/types';
import factureJson from './fixtures/lignes-372765.json';
import stockJson from './fixtures/stock-simule.json';

interface LigneFixture { n: number; code: string; libelle: string; quantite: number; unite: string; kind: string; nomPropre: string }
const lignes = factureJson.lignes as LigneFixture[];
const stock = stockJson.articles as StockItem[];

/** Ce que `proposeStockItem` proposait déjà avant la voie (diagnostic d1 § 4, garde levée). */
const DEJA_APPARIEES: Record<number, string> = {
  1: 'Maris Otter', 3: 'Gerstenflocken', 4: 'Röstgerste', 13: 'Pilsner Malz', 15: 'Weizenmalz hell', 17: 'Haferflocken',
  19: 'Nelson Sauvin 9.6%', 20: 'Sabro 13.4%', 23: 'Motueka 8.1%'
};
/** Ce que la voie ajoute (S2, S3, S4) : leur article existe dans le stock simulé. */
const NOUVELLES: Record<number, string> = { 6: 'Caramünch Typ 2', 8: 'Target', 18: 'Galaxy', 10: 'LALLEMAND Windsor', 11: 'Safale BE-256', 12: 'SafAle US-05', 21: 'Verdant IPA' };
const ABSENTES = [9, 22];

const propose = (l: LigneFixture) => proposeStockItem({
  description: l.libelle, unit: l.unite, quantity: l.quantite, vendor: factureJson.fournisseur, kind: l.kind === 'service' ? 'service' : 'ingredient', reference: l.code, stockCategory: ''
} as never, stock)?.name;

describe('facture 372765 contre le stock simulé de d1 (SIMULÉ)', () => {
  it('compte 23 lignes, 18 de stock, 5 de mouture, 16 articles', () => {
    expect(lignes).toHaveLength(23);
    expect(lignes.filter(l => l.kind === 'stock')).toHaveLength(18);
    expect(lignes.filter(l => l.kind === 'service')).toHaveLength(5);
    expect(stock).toHaveLength(16);
  });
  for (const [n, nom] of Object.entries(DEJA_APPARIEES)) {
    const l = lignes.find(x => x.n === Number(n))!;
    it(`ligne ${n} « ${l.libelle} » : déjà appariée, le reste → ${nom}`, () => expect(propose(l)).toBe(nom));
  }
  for (const [n, nom] of Object.entries(NOUVELLES)) {
    const l = lignes.find(x => x.n === Number(n))!;
    it(`ligne ${n} « ${l.libelle} » ${l.quantite} ${l.unite} → ${nom}`, () => expect(propose(l)).toBe(nom));
  }
  for (const n of ABSENTES) {
    const l = lignes.find(x => x.n === n)!;
    it(`ligne ${n} « ${l.libelle} » : absente du stock → aucune proposition`, () => expect(propose(l)).toBeUndefined());
  }
  for (const l of lignes.filter(x => x.kind === 'service')) {
    it(`ligne ${l.n} « ${l.libelle} » (mouture) → aucune proposition`, () => expect(propose(l)).toBeUndefined());
  }
  it('aucune ligne n’est reliée à un article d’une autre catégorie', () => {
    const cats = (nom: string) => stock.find(a => a.name === nom)?.category;
    const attendu: Record<string, string> = { Malt: 'Malt', Houblon: 'Houblon', Levure: 'Levure' };
    for (const l of lignes.filter(x => x.kind === 'stock')) {
      const nom = propose(l);
      if (!nom) continue;
      const cat = (factureJson.lignes.find(x => x.n === l.n) as { categorieStock: string }).categorieStock;
      expect(cats(nom)).toBe(attendu[cat]);
    }
  });
});
