import { describe, expect, it } from 'vitest';
import { escalierDe, geometrieEscalier, mouvementsDeFamille, type MouvementBrut } from '../../../src/domain/stock/mouvementsArticle';
import { familleDe, jourSemaine, lotsDe, prixLu } from '../../../src/domain/stock/ficheArticle';
import type { StockItem } from '../../../src/types';

/**
 * Voie p1 (mission stock, 12.11) — la règle de « Ce qui a bougé » : l'escalier se lit des vrais mouvements (achat sans stock avant/après,
 * brassage, inventaire, correction), du stock actuel remonté de proche en proche ; le besoin et le seuil sont dits quand ils manquent.
 * Fixture : le Citra de la maquette B4 (200 → 700 → 550 → 550 → 450 g), estimée, aucune donnée réelle.
 */
const citra = [{ ref: 'MP-CITRA', currentStock: 450, supplier: 'Hopfen der Welt' }];
const mouvements: MouvementBrut[] = [
  { id: 'receipt-1', type: 'receipt', stockItemRef: 'MP-CITRA', quantity: 500, unit: 'g', transactionId: 'TX-1', date: '2026-08-25', createdAt: '2026-08-25T08:00:00.000Z' },
  { id: 'brew-17', batchId: 'LOT-017', stockItemRef: 'MP-CITRA', itemRef: 'MP-CITRA', unit: 'g', delta: -150, previousStock: 700, newStock: 550, reason: 'Brassage terminé', timestamp: '2026-09-28T10:00:00.000Z' },
  { id: 'inv-1', type: 'inventory-adjustment', stockItemRef: 'MP-CITRA', delta: 0, previousStock: 550, newStock: 550, reasonCode: 'comptage', reason: 'Inventaire physique', date: '2026-11-01', createdAt: '2026-11-01T09:00:00.000Z' },
  { id: 'brew-18', batchId: 'LOT-018', stockItemRef: 'MP-CITRA', itemRef: 'MP-CITRA', unit: 'g', delta: -100, previousStock: 550, newStock: 450, reason: 'Brassage terminé', timestamp: '2026-11-09T10:00:00.000Z' },
  { id: 'autre-article', type: 'receipt', stockItemRef: 'MP-AUTRE', quantity: 99, date: '2026-10-01', createdAt: '2026-10-01T08:00:00.000Z' },
  { id: 'marqueur', type: 'purchase-confirmation', transactionId: 'TX-1', createdAt: '2026-08-25T08:00:01.000Z' }
];
const lots = [{ id: 'LOT-017', name: 'Hazy Pale' }, { id: 'LOT-018', name: 'Session IPA' }];

describe('p1 — les mouvements d’un article', () => {
  const m = mouvementsDeFamille(citra, mouvements, lots);

  it('ne garde que les mouvements de l’article, du plus récent au plus ancien, avec avant → après', () => {
    expect(m.liste.map(x => x.id)).toEqual(['brew-18', 'inv-1', 'brew-17', 'receipt-1']);
    expect(m.liste.map(x => [x.avant, x.apres])).toEqual([[550, 450], [550, 550], [700, 550], [200, 700]]);
    expect(m.avantLePlusAncien).toBe(200);
    expect(m.ecartFinal).toBeNull();
  });

  it('un achat sans stock avant/après se déduit du stock actuel remonté de proche en proche', () => {
    const achat = m.liste.at(-1)!;
    expect(achat.genre).toBe('achat');
    expect(achat.delta).toBe(500);
    expect(achat.titre).toBe('Achat · Hopfen der Welt');
    expect(achat.lien).toEqual({ genre: 'facture', id: 'TX-1' });
  });

  it('nomme le brassin et le genre de chaque mouvement', () => {
    expect(m.liste[0]).toMatchObject({ genre: 'brassage', titre: 'LOT-018 · Session IPA', lien: { genre: 'brassin', id: 'LOT-018' }, delta: -100 });
    expect(m.liste[1]).toMatchObject({ genre: 'inventaire', titre: 'Inventaire', delta: 0 });
  });

  it('un motif de perte est une correction, pas un inventaire', () => {
    const x = mouvementsDeFamille([{ ref: 'A', currentStock: 120 }], [
      { id: 'c', type: 'inventory-adjustment', stockItemRef: 'A', delta: -30, previousStock: 150, newStock: 120, reasonCode: 'perte', reason: 'Perte ou péremption', date: '2026-11-01', createdAt: '2026-11-01T08:00:00Z' }]);
    expect(x.liste[0]).toMatchObject({ genre: 'correction', titre: 'Correction · perte ou péremption', avant: 150, apres: 120 });
  });

  it('le stock actuel qui s’écarte du dernier « après » est dit, pas effacé', () => {
    const x = mouvementsDeFamille([{ ref: 'MP-CITRA', currentStock: 460 }], mouvements, lots);
    expect(x.ecartFinal).toBe(10);
  });

  it('une chaîne qui ne se recolle pas dit l’écart du mouvement', () => {
    const casse = mouvements.map(mv => mv.id === 'inv-1' ? { ...mv, newStock: 540, delta: -10 } : mv);
    const x = mouvementsDeFamille(citra, casse, lots);
    expect(x.liste.find(l => l.id === 'inv-1')!.ecart).toBe(10);
  });

  it('une quantité d’achat inconnue reste inconnue : ni 0 ni escalier tracé', () => {
    const x = mouvementsDeFamille([{ ref: 'B', currentStock: 100 }], [{ id: 'r', type: 'receipt', stockItemRef: 'B', date: '2026-08-25', createdAt: '2026-08-25T08:00:00Z' }]);
    expect(x.liste[0].avant).toBeNull();
    expect(x.liste[0].delta).toBeNull();
    expect(escalierDe([...x.liste].reverse(), { besoin: null, seuil: 50 })).toBeNull();
  });

  it('les lots « bis » s’additionnent : le stock de la famille avant et après chaque mouvement', () => {
    const famille = [{ ref: 'C1', currentStock: 120 }, { ref: 'C2', currentStock: 200 }];
    const x = mouvementsDeFamille(famille, [
      { id: 'a1', type: 'receipt', stockItemRef: 'C1', quantity: 120, date: '2026-08-25', createdAt: '2026-08-25T08:00:00Z' },
      { id: 'a2', type: 'receipt', stockItemRef: 'C2', quantity: 200, date: '2026-11-06', createdAt: '2026-11-06T08:00:00Z' }]);
    expect(x.liste.map(l => [l.avant, l.apres])).toEqual([[120, 320], [0, 120]]);
    expect(x.avantLePlusAncien).toBe(0);
  });
});

describe('p1 — l’escalier de B4', () => {
  const chrono = [...mouvementsDeFamille(citra, mouvements, lots).liste].reverse();

  it('une marche par mouvement : 200, 700, 550, 550, 450 ; le besoin au-dessus du stock final hachure le manque', () => {
    const e = escalierDe(chrono, { besoin: 500, seuil: 200 })!;
    expect(e.pts).toEqual([200, 700, 550, 550, 450]);
    expect(e.manque).toBe(true);
    expect(e.besoinEtat).toBe('connu');
    expect(e.seuilEtat).toBe('fixe');
    expect(e.dates).toEqual(['2026-08-25', '2026-09-28', '2026-11-01', '2026-11-09']);
  });

  it('le besoin couvert ne hachure rien ; « aucun besoin » et « seuil à fixer » sont écrits quand ils manquent, jamais 0', () => {
    const e = escalierDe(chrono, { besoin: 0, seuil: undefined })!;
    expect(e.manque).toBe(false);
    expect(e.besoinEtat).toBe('aucun');
    expect(e.seuilEtat).toBe('a-fixer');
    expect(e.seuil).toBeNull();
    expect(escalierDe(chrono, { besoin: 'inconnu', seuil: 200 })!.besoinEtat).toBe('inconnu');
    expect(escalierDe(chrono, { besoin: 300, seuil: 200 })!.manque).toBe(false);
  });

  it('sans mouvement : pas d’escalier inventé', () => {
    expect(escalierDe([], { besoin: 500, seuil: 200 })).toBeNull();
  });

  it('la géométrie de B4 : même hauteur 12 % au-dessus du plus haut, le besoin au-dessus du seuil, la marche suit le stock', () => {
    const e = escalierDe(chrono, { besoin: 500, seuil: 200 })!;
    const g = geometrieEscalier(e);
    expect(g.top).toBeCloseTo(700 * 1.12, 6);
    expect(g.y(500)).toBeLessThan(g.y(200));
    expect(g.y(700)).toBeLessThan(g.y(450));
    expect(g.xs).toHaveLength(e.pts.length + 1);
    expect(g.d.startsWith(`M6 ${g.y(200)}`)).toBe(true);
    expect(g.d.match(/V/g)).toHaveLength(e.pts.length - 1);
  });
});

describe('p1 — la famille et ses lots', () => {
  const art = (o: Partial<StockItem>): StockItem => ({ id: o.ref!, ref: o.ref!, name: 'Centennial', category: 'Houblon', unit: 'g', currentStock: 100, reorder: false, ...o } as StockItem);
  const tous = [art({ ref: 'H1', name: 'Centennial', currentStock: 120, alphaPct: 9.8, supplier: 'Hopfen der Welt', pricePerUnit: 0.101 }),
    art({ ref: 'H2', name: 'Centennial bis', currentStock: 200, alphaPct: 10.4 }),
    art({ ref: 'H3', name: 'Cascade' }), art({ ref: 'M1', name: 'Centennial', category: 'Malt' })];

  it('l’article ouvert d’abord, puis ses « bis » de même catégorie ; jamais une autre variété', () => {
    expect(familleDe(tous[1], tous).map(a => a.ref)).toEqual(['H2', 'H1']);
    expect(familleDe(tous[2], tous).map(a => a.ref)).toEqual(['H3']);
  });

  it('les lots, le plus ancien d’abord ; une date d’entrée inconnue passe après et reste vide', () => {
    const l = lotsDe(familleDe(tous[0], tous), [
      { id: 'r1', type: 'receipt', stockItemRef: 'H2', quantity: 200, date: '2026-11-06', transactionId: 'TX-6' },
      { id: 'r0', type: 'receipt', stockItemRef: 'H1', quantity: 120, date: '2026-08-25', transactionId: 'TX-25' }]);
    expect(l.map(x => [x.ref, x.entree, x.alpha, x.factureId])).toEqual([['H1', '2026-08-25', 9.8, 'TX-25'], ['H2', '2026-11-06', 10.4, 'TX-6']]);
    const sans = lotsDe(familleDe(tous[0], tous), []);
    expect(sans.every(x => x.entree === null && x.factureId === null)).toBe(true);
  });

  it('le prix d’une quantité ronde, ou rien quand il est inconnu', () => {
    expect(prixLu(0.101, 'g')).toBe('100 g · 10,1 CHF');
    expect(prixLu(4.2, 'kg')).toBe('1 kg · 4,2 CHF');
    expect(prixLu(undefined, 'kg')).toBeNull();
    expect(prixLu(0, 'kg')).toBeNull();
  });

  it('les dates à la manière de B4', () => {
    expect(jourSemaine('2026-11-06', '2026-11-12')).toBe('ven. 06.11');
    expect(jourSemaine('2025-08-25', '2026-11-12')).toBe('lun. 25.08.2025');
    expect(jourSemaine(null, '2026-11-12')).toBeNull();
  });
});
