// Voie pz part z : filtres, groupes et comptes de la liste (maquette sy/fA) : un filtre à la fois, comptes du mur = comptes de la liste, Recompter.
import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import { infoLigne } from '../../../src/domain/stock/liste';
import { construireMur } from '../../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../../src/domain/stock/murSources';
import { comptesFamilles, comptesRecompter, groupeListe, GROUPES_LISTE, lignesRetenues, lireQuantite, texteFiltre, trierRecompter } from '../../../src/domain/stock/listeFiltres';

const art = (ref: string, name: string, category: string, q: number, extra: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, currentStock: q, minStock: 0, unit: 'kg', category, reorder: false, ...extra } as StockItem);
const STOCK: StockItem[] = [
  art('m1', 'Pilsner Malz', 'Malt', 120, { colorEbc: 3.5 }),
  art('m2', 'Maris Otter', 'Malt', Number.NaN, { colorEbc: 6 }),
  art('m3', 'Avoine floconnée', 'Malt', 1.2, { minStock: 1.6 }),
  art('s1', 'Sucre candi blanc', 'Sucre', 0.4),
  art('s2', 'Gypse (CaSO4)', 'Additif', 2),
  art('h1', 'Citra', 'Houblon', 450, { unit: 'g', alphaPct: 12.4, minStock: 500 }),
  art('h2', 'Idaho 7', 'Houblon', 0, { unit: 'g', alphaPct: 13.1, minStock: 200 }),
  art('y1', 'SafAle US-05', 'Levure', 4, { unit: 'sachets' }),
  art('e1', 'Bouteille 33 cl brune', 'Emballage', 480, { unit: 'pièces' }),
  art('n1', 'Acide citrique', 'CIP acide', 1),
];
const aCommander = new Map([['m3', { item: STOCK[2], missing: 0.4, rupture: false, auMoins: false, sources: [] }], ['h2', { item: STOCK[6], missing: 100, rupture: true, auMoins: false, sources: [] }]]);
const infos = new Map(STOCK.map((i) => [i.ref, infoLigne(i, aCommander as never, '2026-11-14')]));
const sans = { filtre: null, recherche: null } as const;

describe('groupes de la liste : les six familles de la maquette', () => {
  it('un sucre est rangé dans Malts, comme au mur ; additifs, emballage, nettoyage ont leur titre', () => {
    expect(groupeListe(STOCK[3])).toBe('Malts');
    expect(groupeListe(STOCK[4])).toBe('Sels et additifs');
    expect(groupeListe(STOCK[8])).toBe('Emballage');
    expect(groupeListe(STOCK[9])).toBe('Nettoyage et gaz');
    expect(GROUPES_LISTE).toEqual(['Malts', 'Houblons', 'Levures', 'Sels et additifs', 'Emballage', 'Nettoyage et gaz']);
  });
  it('Malts 14 contre 12 : le compte du mur est le nombre de lignes du groupe de la liste', () => {
    const mur = construireMur(STOCK, sourcesDeLApp, [], []);
    const c = comptesFamilles(STOCK);
    for (const r of mur.rayons) {
      expect(c[r.nom as 'Malts' | 'Houblons' | 'Levures']).toBe(r.total);
      expect(STOCK.filter((i) => groupeListe(i) === r.nom).length).toBe(r.total);
    }
    expect(c.Malts).toBe(4); // 3 malts + 1 sucre
  });
});

describe('filtres : un seul à la fois, la recherche en plus', () => {
  const refs = (c: Parameters<typeof lignesRetenues>[2]) => lignesRetenues(STOCK, infos, c).map((i) => i.ref);
  it('manque, épuisés, à compter : les états de la ligne', () => {
    expect(refs({ ...sans, filtre: 'manque' })).toEqual(['m3', 'h2']);
    expect(refs({ ...sans, filtre: 'epuise' })).toEqual(['h2']);
    expect(refs({ ...sans, filtre: 'compter' })).toEqual(['m2']);
  });
  it('un rayon touché ne change aucun compte : seule la liste est filtrée', () => {
    expect(refs({ ...sans, filtre: 'Houblons' })).toEqual(['h1', 'h2']);
    expect(comptesFamilles(STOCK).Houblons).toBe(2);
  });
  it('la recherche garde les références trouvées et se combine au filtre', () => {
    expect(refs({ filtre: 'Houblons', recherche: new Set(['h1', 'm1']) })).toEqual(['h1']);
    expect(refs({ filtre: null, recherche: new Set() })).toEqual([]);
  });
  it('épinglés : seuls les articles épinglés', () => {
    const f = [{ ...STOCK[0], favorite: true }, STOCK[1]];
    expect(lignesRetenues(f, infos, { filtre: 'epingles', recherche: null }).map((i) => i.ref)).toEqual(['m1']);
  });
});

describe('ligne « Filtre … : N articles »', () => {
  it('sans filtre ni recherche de deux lettres : aucune ligne', () => { expect(texteFiltre({ filtre: null, q: 'c' }, 4)).toBeNull(); });
  it('filtre seul, recherche seule, les deux', () => {
    expect(texteFiltre({ filtre: 'Houblons', q: '' }, 19)).toEqual({ filtre: 'Houblons', recherche: null, n: 19 });
    expect(texteFiltre({ filtre: null, q: ' cit ' }, 1)).toEqual({ filtre: null, recherche: 'cit', n: 1 });
    expect(texteFiltre({ filtre: 'epuise', q: 'id' }, 1)).toEqual({ filtre: 'épuisés', recherche: 'id', n: 1 });
  });
});

describe('Recompter', () => {
  it('« 6/15 comptés · 02.11 » : un comptage par article, le dernier jour du rayon', () => {
    const mv = [
      { type: 'inventory-adjustment', reasonCode: 'comptage', stockItemRef: 'm1', date: '2026-11-01T10:00:00Z' },
      { type: 'inventory-adjustment', reasonCode: 'comptage', stockItemRef: 'm3', date: '2026-11-02T10:00:00Z' },
      { type: 'inventory-adjustment', reasonCode: 'casse', stockItemRef: 'm2', date: '2026-11-05T10:00:00Z' },
    ];
    const c = comptesRecompter(STOCK, mv);
    expect(c.Malts).toEqual({ compte: 2, total: 4, dernier: '2026-11-02' });
    expect(c.Houblons).toEqual({ compte: 0, total: 2, dernier: null });
  });
  it('nom A → Z, les épuisés en fin de rayon', () => {
    const h = STOCK.filter((i) => i.category === 'Houblon');
    expect(trierRecompter(h, infos).map((i) => i.ref)).toEqual(['h1', 'h2']);
    expect(trierRecompter([STOCK[6], STOCK[5]], infos).map((i) => i.ref)).toEqual(['h1', 'h2']);
  });
  it('saisie : virgule ou point, un champ vide ou illisible n\'est jamais 0', () => {
    expect(lireQuantite('1,2')).toBe(1.2);
    expect(lireQuantite(' 3 ')).toBe(3);
    expect(lireQuantite('')).toBeNull();
    expect(lireQuantite('abc')).toBeNull();
    expect(lireQuantite('-2')).toBeNull();
    expect(lireQuantite('0')).toBe(0);
  });
});
