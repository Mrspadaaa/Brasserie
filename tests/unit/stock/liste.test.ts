import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import type { ArticleACommander } from '../../../src/domain/stockLevel';
import { ECHELLES, PART_COUDE, coupeBarre, compterEtats, derniersComptages, familleRecompter, infoLigne, quantiteBarre, trierArticles, xBarre, type InfoLigne } from '../../../src/domain/stock/liste';

const art = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: o.ref ?? 'x', name: 'A', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o });
const vide = new Map<string, ArticleACommander>();

describe('barres à deux régimes (g6)', () => {
  it('malts : à l\'échelle jusqu\'à 5 kg (0,5 kg = 4,5 % de la règle), au coude 45 %, resserrée au-delà', () => {
    const e = ECHELLES.Malts;
    expect(xBarre(0.5, e)).toBeCloseTo(0.045, 4);
    expect(xBarre(5, e)).toBeCloseTo(PART_COUDE, 6);
    expect(xBarre(20, e)).toBeCloseTo(0.6567, 3);
    expect(xBarre(120, e)).toBeCloseTo(0.9238, 3);
    expect(xBarre(200, e)).toBe(1);
    expect(xBarre(5000, e)).toBe(1);
  });
  it('houblons : le coude est à 250 g ; 450 g est resserré, 100 g à l\'échelle', () => {
    const e = ECHELLES.Houblons;
    expect(xBarre(100, e)).toBeCloseTo(0.18, 6);
    expect(xBarre(250, e)).toBeCloseTo(0.45, 6);
    expect(xBarre(450, e)).toBeGreaterThan(0.45);
    expect(coupeBarre(450, e)).not.toBeNull();
    expect(coupeBarre(100, e)).toBeNull();
  });
  it('la coupure se place au coude dans la barre (Pilsner 120 kg : 48,71 %)', () => {
    expect(coupeBarre(120, ECHELLES.Malts)).toBeCloseTo(48.71, 1);
    expect(coupeBarre(5, ECHELLES.Malts)).toBeNull();
  });
  it('une quantité inconnue n\'a pas de barre (jamais 0)', () => {
    expect(quantiteBarre(art({ currentStock: NaN }))).toBeNull();
    expect(quantiteBarre(art({ unit: 'sachet', currentStock: 3 }))).toBeNull(); // malt en sachets : unité inconvertible
    expect(quantiteBarre(art({ category: 'Houblon', unit: 'kg', currentStock: 0.45 }))).toBe(450);
    expect(quantiteBarre(art({ category: 'Levure', unit: 'sachet', currentStock: 4 }))).toBe(4);
    expect(quantiteBarre(art({ category: 'Emballage', unit: 'pièce', currentStock: 4 }))).toBeNull();
  });
});

describe('états des lignes et compteurs des pastilles', () => {
  const cmd = (item: StockItem, missing: number, auMoins = false): ArticleACommander => ({ item, missing, rupture: item.currentStock <= 0, auMoins, sources: [] });
  it('manque, bas, épuisé, à compter, DDM : une règle pour la liste et ses pastilles', () => {
    const a = art({ ref: 'a', currentStock: 1.2, minStock: 1 });
    const b = art({ ref: 'b', currentStock: 0.5, minStock: 0.5 });
    const c = art({ ref: 'c', currentStock: 0 });
    const d = art({ ref: 'd', currentStock: NaN });
    const e = art({ ref: 'e', category: 'Levure', unit: 'sachet', currentStock: 2, yeastLot: { expiresOn: '2026-10-01' } as never });
    const f = art({ ref: 'f', currentStock: 3, minStock: 2 });
    const aCmd = new Map([['a', cmd(a, 0.4)], ['f', cmd(f, 1, true)]]);
    const infos = [a, b, c, d, e, f].map((i) => infoLigne(i, aCmd, '2026-11-14'));
    const [ia, ib, ic, id, ie, iff] = infos;
    expect(ia.etats).toEqual(['manque']);
    expect(ib.etats).toEqual(['bas']);
    expect(ic.etats).toEqual(['epuise']);
    expect(id.etats).toEqual(['compter']);
    expect(id.pot).toBeNull();
    expect(ie.etats).toEqual(['ddm']);
    expect(iff.manqueAuMoins).toBe(true);
    expect(compterEtats(infos)).toEqual({ manque: 1, manquePlus: 1, bas: 1, epuise: 1, compter: 1, ddm: 1 });
  });
  it('un article sans seuil n\'est jamais « bas » (un seuil absent n\'est pas 0)', () => {
    expect(infoLigne(art({ currentStock: 0.1 }), vide, '2026-11-14').etats).toEqual([]);
    expect(infoLigne(art({ currentStock: 0.1 }), vide, '2026-11-14').classe).toBe('sans');
  });
});

describe('tri écrit en clair', () => {
  const infos = new Map<string, InfoLigne>();
  it('par défaut : EBC croissant, inconnu en fin ; houblons par α décroissant', () => {
    const m = [art({ ref: '1', name: 'Noir', colorEbc: 900 }), art({ ref: '2', name: 'Inconnu' }), art({ ref: '3', name: 'Pâle', colorEbc: 3 })];
    expect(trierArticles(m, 'defaut', infos).map((x) => x.ref)).toEqual(['3', '1', '2']);
    const h = [art({ ref: 'a', category: 'Houblon', unit: 'g', name: 'Saaz', alphaPct: 3.5 }), art({ ref: 'b', category: 'Houblon', unit: 'g', name: 'Magnum', alphaPct: 14 }), art({ ref: 'c', category: 'Houblon', unit: 'g', name: 'Mystère' })];
    expect(trierArticles(h, 'defaut', infos).map((x) => x.ref)).toEqual(['b', 'a', 'c']);
  });
  it('nom A → Z et quantité décroissante (inconnue en fin)', () => {
    const m = [art({ ref: '1', name: 'Zythos', currentStock: 5 }), art({ ref: '2', name: 'Acacia', currentStock: NaN }), art({ ref: '3', name: 'Miel', currentStock: 50 })];
    expect(trierArticles(m, 'nom', infos).map((x) => x.ref)).toEqual(['2', '3', '1']);
    expect(trierArticles(m, 'quantite', infos).map((x) => x.ref)).toEqual(['3', '1', '2']);
  });
});

describe('Recompter : familles et comptés', () => {
  it('six familles ; les sucres vont avec les malts (même règle que le mur)', () => {
    expect(familleRecompter(art({ category: 'Houblon' }))).toBe('Houblons');
    expect(familleRecompter(art({ category: 'Sucre', name: 'Sucre de canne' }))).toBe('Malts');
    expect(familleRecompter(art({ category: 'Emballage', name: 'Capsules' }))).toBe('Emballage');
    expect(familleRecompter(art({ category: 'Désinfectant', name: 'Saniclean' }))).toBe('Nettoyage');
    expect(familleRecompter(art({ category: 'Additif', name: 'Gypse' }))).toBe('Additifs');
  });
  it('dernier comptage : le jour du mouvement « comptage » le plus récent ; une casse n\'est pas un comptage', () => {
    const m = [
      { type: 'inventory-adjustment', reasonCode: 'comptage', stockItemRef: 'a', createdAt: '2026-11-01T10:00:00Z' },
      { type: 'inventory-adjustment', reasonCode: 'comptage', stockItemRef: 'a', createdAt: '2026-11-02T10:00:00Z' },
      { type: 'inventory-adjustment', reasonCode: 'casse', stockItemRef: 'b', createdAt: '2026-11-03T10:00:00Z' },
      { type: 'receipt', stockItemRef: 'c', createdAt: '2026-11-04T10:00:00Z' },
    ];
    const r = derniersComptages(m);
    expect(r.get('a')).toBe('2026-11-02');
    expect(r.has('b')).toBe(false);
    expect(r.has('c')).toBe(false);
  });
});
