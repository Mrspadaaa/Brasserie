// D381 : « Ça reste un processus de facturation, c'est ultra critique. On peut pas se permettre de perdre ou "gagner" de l'information » (03.11).
// Le recollage par le texte (D380, retiré) perdait une ligne répétée et doublait une ligne lue « 25kg » / « 25 kg » : le témoin le montre.
// L'assemblage garde chaque article dans un seul morceau (celui de sa première ligne) et recoupe chaque jonction des deux côtés.
import { describe, expect, it } from 'vitest';
import { assemblerMorceaux, morceauxRecus } from '../../../../functions/src/invoiceAssemblage';
import { mergeDecoded, planMorceaux, linePitch } from '../../../../functions/src/invoiceMorceaux';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';

const art = (name: string, amountTTC: number | null, zone: 'avant' | 'dedans' | 'apres' = 'dedans') => ({ name, kind: 'stock', quantity: 1, unit: 'Stk', price: amountTTC, amountTTC, zone });
const partie = (k: number, n: number, items: any[], extra: any = {}) => ({ vendor: k === 1 ? 'Fictif SA' : '', date: k === 1 ? '03.11.2026' : '', currency: k === 1 ? 'CHF' : '', documentType: 'invoice', amountTTC: null, items, morceau: { k, n }, review: { status: 'checked', readers: 2 }, points: [], ...extra });
const noms = (r: any) => r.items.map((i: any) => i.name);
const pesent = (r: any) => r.points.filter((p: any) => p.pese);

describe('D381 : rien de perdu, rien de gagné aux jonctions', () => {
  it('témoin (recollage par le texte, retiré) : 4 lignes identiques autour de la jonction, une est perdue', () => {
    const l = (n: string) => ({ name: n, amountTTC: 3.5 });
    const fusion = mergeDecoded([{ items: ['X', 'A', 'A', 'A'].map(l) }, { items: ['A', 'A', 'B'].map(l) }], { dedupe: true });
    expect(fusion.items).toHaveLength(5); // la vérité en a 6 : X A A A A B
  });

  it('lignes identiques à la jonction : toutes rendues, jonction concordante', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('X', 3.5), art('A', 3.5), art('A', 3.5), art('A', 3.5), art('A', 3.5, 'apres')]),
      partie(2, 2, [art('A', 3.5, 'avant'), art('A', 3.5), art('B', 3.5)], { amountTTC: 21 }),
    ]);
    expect(noms(r)).toEqual(['X', 'A', 'A', 'A', 'A', 'B']);
    expect(pesent(r)).toEqual([]);
    expect(r.review.status).toBe('checked');
  });

  it('« 25kg » d’un côté, « 25 kg » de l’autre : une seule ligne, jonction concordante', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('Houblon Citra 1kg', 30), art('Malt Pilsner 25kg', 42), art('Levure US-05', 4, 'apres')]),
      partie(2, 2, [art('Malt Pilsner 25 kg', 42, 'avant'), art('Levure US-05', 4)], { amountTTC: 76 }),
    ]);
    expect(noms(r)).toEqual(['Houblon Citra 1kg', 'Malt Pilsner 25kg', 'Levure US-05']);
    expect(pesent(r)).toEqual([]);
  });

  it('les deux côtés ne voient pas le même article : point qui pèse, lecture à vérifier', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('A', 1), art('B', 10, 'apres')]),
      partie(2, 2, [art('C', 7)], { amountTTC: 8 }),
    ]);
    const jonction = pesent(r).find((p: any) => /Jonction des parties 1 et 2/.test(p.message));
    expect(jonction?.lignes).toEqual([1, 2]);
    expect(r.review.status).toBe('disputed');
    expect(r.review.findings.join(' ')).toMatch(/manquer ou être doublée/);
  });

  it('une suite d’article prise pour un article (gain) : la somme des lignes ne tombe plus sur le total, point qui pèse', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('Article Y', 9.9)]),
      partie(2, 2, [art('Article Y', 9.9, 'avant'), art('2 x 4.95', 9.9), art('Z', 5)], { amountTTC: 14.9 }),
    ]);
    expect(r.items).toHaveLength(3);
    expect(pesent(r).some((p: any) => p.code === 'somme-ecart')).toBe(true);
    expect(r.review.status).toBe('disputed');
  });

  it('une coupe à travers une ligne est signalée', () => {
    const r = assemblerMorceaux([partie(1, 2, [art('A', 1)], { coupeForcee: true }), partie(2, 2, [art('B', 2)], { amountTTC: 3 })]);
    expect(pesent(r).some((p: any) => /sans espace blanc/.test(p.message))).toBe(true);
  });

  it('un morceau manquant ou déplacé : l’assemblage refuse, rien n’est rendu', () => {
    expect(() => morceauxRecus({ parties: [partie(1, 3, []), partie(3, 3, [])] })).toThrow(/morceau 2 sur 2|n'est pas à sa place/);
    expect(() => morceauxRecus({ parties: [partie(1, 2, [])] })).toThrow(/manque/);
  });

  it('300 lignes en 12 morceaux avec voisins visibles : 300 lignes exactes, somme = total, aucun point', () => {
    const vraies = Array.from({ length: 300 }, (_, i) => art(`Article ${i + 1}`, i + 1.5));
    const total = vraies.reduce((s, a) => s + (a.amountTTC as number), 0);
    const parties = Array.from({ length: 12 }, (_, k) => {
      const debut = k * 25, fin = debut + 25;
      const items = [
        ...vraies.slice(Math.max(0, debut - 2), debut).map(a => ({ ...a, zone: 'avant' })),
        ...vraies.slice(debut, fin),
        ...vraies.slice(fin, Math.min(300, fin + 2)).map(a => ({ ...a, zone: 'apres' })),
      ];
      return partie(k + 1, 12, items, k === 11 ? { amountTTC: total } : {});
    });
    const r = assemblerMorceaux(morceauxRecus({ parties }));
    expect(noms(r)).toEqual(vraies.map(a => a.name));
    expect(r.amountTTC).toBe(total);
    expect(pesent(r)).toEqual([]);
    expect(r.review.status).toBe('checked');
  });

  it('un désaccord de lecture d’une ligne suit sa ligne au rang global ; ceux des voisins (contexte) sont laissés', () => {
    const point = (ligne: number) => ({ code: 'lectures-divergentes', origine: 'lecture', pese: true, champ: 'items', champs: [`items.${ligne}.amountTTC`], ligne, cle: `lectures-divergentes:${ligne}:items`, message: `désaccord ${ligne}` });
    const r = assemblerMorceaux([
      partie(1, 2, [art('A', 1), art('B', 2), art('C', 3, 'apres')]),
      partie(2, 2, [art('B', 2, 'avant'), art('C', 3), art('D', 4)], { amountTTC: 10, points: [point(1), point(3)] }),
    ]);
    const lus = r.points.filter((p: any) => p.origine === 'lecture');
    expect(lus.map((p: any) => [p.ligne, p.champs[0]])).toEqual([[4, 'items.4.amountTTC']]);
  });

  it('la zone d’un article survit à la normalisation ; une zone inconnue est ignorée', () => {
    const n = normalizeInvoiceScan({ items: [{ name: 'A', amountTTC: 1, zone: 'apres' }, { name: 'B', amountTTC: 2, zone: 'ailleurs' }] });
    expect(n.items.map((i: any) => i.zone)).toEqual(['apres', undefined]);
  });
});

describe('D381 : morceaux sans recouvrement de propriété', () => {
  const rangees = (() => { const rows: number[] = new Array(40).fill(0); for (let i = 0; i < 300; i++) rows.push(...new Array(14).fill(0.2), ...new Array(10).fill(0)); return rows; })();
  it('les zones propres se suivent bord à bord, coupées dans le blanc ; les voisins visibles bordés de blanc', () => {
    const m = planMorceaux(rangees, 1200);
    expect(m[0].top).toBe(0);
    expect(m.at(-1)!.bottom).toBe(rangees.length);
    m.slice(1).forEach((b, i) => expect(b.top).toBe(m[i].bottom));
    m.forEach(b => {
      expect(b.forced).toBe(false);
      expect(b.viewTop).toBeLessThanOrEqual(b.top);
      expect(b.viewBottom).toBeGreaterThanOrEqual(b.bottom);
      if (b.viewTop > 0) expect(rangees[b.viewTop]).toBe(0);
      if (b.viewBottom < rangees.length) expect(rangees[b.viewBottom - 1]).toBe(0);
    });
    // Au plus 25 lignes propres, environ 3 lignes de voisins de chaque côté.
    const pas = linePitch(rangees)!;
    m.forEach(b => expect((b.bottom - b.top) / pas).toBeLessThanOrEqual(25.5));
    m.slice(1, -1).forEach(b => { expect(Math.round((b.top - b.viewTop) / pas)).toBeGreaterThanOrEqual(3); expect(Math.round((b.viewBottom - b.bottom) / pas)).toBeGreaterThanOrEqual(3); });
  });
});
