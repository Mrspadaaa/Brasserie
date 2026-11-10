// D381 : « Ça reste un processus de facturation, c'est ultra critique. On peut pas se permettre de perdre ou "gagner" de l'information » (03.11).
// Le recollage par le texte (D380, retiré) perdait une ligne répétée : le témoin le montre. Les voisins visibles marqués par l'IA (retirés après la
// mesure du 03.11 : 306 lignes sur 300) doublaient des lignes. Aujourd'hui : morceaux bord à bord sans voisins, rien n'est retiré, une suite
// d'article coupé est recollée et signalée, chaque coupe est recoupée par une bande de contrôle lue à part, qui ne peut que lever une alerte.
import { describe, expect, it } from 'vitest';
import { assemblerMorceaux, jonctionsRecues, morceauxRecus } from '../../../../functions/src/invoiceAssemblage';
import { CONTEXT_LINES, jonctionConcorde, linePitch, mergeDecoded, morceauNote, planJonctions, planMorceaux } from '../../../../functions/src/invoiceMorceaux';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';

const art = (name: string, amountTTC: number | null, extra: any = {}) => ({ name, kind: 'stock', quantity: 1, unit: 'Stk', price: amountTTC, amountTTC, ...extra });
const partie = (k: number, n: number, items: any[], extra: any = {}) => ({
  vendor: k === 1 ? 'Fictif SA' : '', date: k === 1 ? '03.11.2026' : '', currency: k === 1 ? 'CHF' : '', documentType: 'invoice', amountTTC: null,
  items, morceau: { k, n }, review: { status: 'checked', readers: 2 }, points: [], ...extra,
});
const bandes = (...liste: Array<[number, any[]]>) => jonctionsRecues({ jonctions: liste.map(([k, items]) => ({ k, items })) });
const noms = (r: any) => r.items.map((i: any) => i.name);
const pesent = (r: any) => r.points.filter((p: any) => p.pese);

describe('D381 : rien de perdu, rien de gagné aux jonctions', () => {
  it('témoin (recollage par le texte, retiré) : 4 lignes identiques autour de la jonction, une est perdue', () => {
    const l = (n: string) => ({ name: n, amountTTC: 3.5 });
    const fusion = mergeDecoded([{ items: ['X', 'A', 'A', 'A'].map(l) }, { items: ['A', 'A', 'B'].map(l) }], { dedupe: true });
    expect(fusion.items).toHaveLength(5); // la vérité en a 6 : X A A A A B
  });

  it('lignes identiques de part et d’autre de la coupe : toutes rendues, bande concordante, aucun point', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('X', 3.5), art('A', 3.5), art('A', 3.5)]),
      partie(2, 2, [art('A', 3.5), art('A', 3.5), art('B', 3.5)], { amountTTC: 21 }),
    ], bandes([1, [art('A', 3.5), art('A', 3.5), art('A', 3.5), art('A', 3.5)]]));
    expect(noms(r)).toEqual(['X', 'A', 'A', 'A', 'A', 'B']);
    expect(pesent(r)).toEqual([]);
    expect(r.review.status).toBe('checked');
  });

  it('une ligne à 0.00 perdue pile sur la coupe (la somme ne la voit pas) : la bande la voit, point qui pèse', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('A', 10), art('B', 5)]),
      partie(2, 2, [art('D', 7)], { amountTTC: 22 }),
    ], bandes([1, [art('B', 5), art('Échantillon offert', 0), art('D', 7)]]));
    expect(pesent(r).some((p: any) => p.code === 'somme-ecart')).toBe(false);
    expect(pesent(r).find((p: any) => /bande de contrôle ne retrouve pas/.test(p.message))?.lignes).toEqual([2, 3]);
    expect(r.review.status).toBe('disputed');
  });

  it('une coupe sans bande de contrôle : signalée, jamais tenue pour vérifiée ; un saut de page n’en demande pas', () => {
    const deux = [partie(1, 2, [art('A', 1)]), partie(2, 2, [art('B', 2)], { amountTTC: 3 })];
    expect(pesent(assemblerMorceaux(deux)).some((p: any) => /non recoupée/.test(p.message))).toBe(true);
    expect(pesent(assemblerMorceaux(deux, jonctionsRecues({ jonctions: [{ k: 1, sautDePage: true }] })))).toEqual([]);
  });

  it('un article coupé entre deux parties : la suite complète l’article, une ligne, point qui pèse', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('Houblon Citra', 30), art('Malt Pilsner 25 kg', null, { quantity: null, price: null, unit: '' })]),
      partie(2, 2, [art('', 63, { suite: true, quantity: 2, price: 31.5, unit: 'Stk' }), art('Levure US-05', 4)], { amountTTC: 97 }),
    ], bandes([1, [art('Houblon Citra', 30), art('Malt Pilsner 25 kg', 63), art('Levure US-05', 4)]]));
    expect(noms(r)).toEqual(['Houblon Citra', 'Malt Pilsner 25 kg', 'Levure US-05']);
    expect(r.items[1]).toMatchObject({ quantity: 2, price: 31.5, amountTTC: 63 });
    expect(pesent(r).find((p: any) => /coupé entre les parties 1 et 2, recollé/.test(p.message))?.lignes).toEqual([2]);
    expect(pesent(r).some((p: any) => /bande de contrôle/.test(p.message))).toBe(false);
  });

  it('un article coupé que l’IA n’a pas marqué « suite » : la bande ne retrouve pas les lignes, point qui pèse', () => {
    const r = assemblerMorceaux([
      partie(1, 2, [art('Houblon Citra', 30), art('Malt Pilsner 25 kg', null, { quantity: null, price: null })]),
      partie(2, 2, [art('2 x 31.50', 63), art('Levure US-05', 4)], { amountTTC: 97 }),
    ], bandes([1, [art('Houblon Citra', 30), art('Malt Pilsner 25 kg', 63), art('Levure US-05', 4)]]));
    expect(pesent(r).some((p: any) => /bande de contrôle ne retrouve pas/.test(p.message))).toBe(true);
  });

  it('une « suite » qui n’est pas en tête reste une ligne, et elle est signalée', () => {
    const r = assemblerMorceaux([partie(1, 1, [art('A', 1), art('', 2, { suite: true })], { amountTTC: 3 })]);
    expect(r.items).toHaveLength(2);
    expect(pesent(r).some((p: any) => /sans article à compléter/.test(p.message))).toBe(true);
  });

  it('une ligne prise en trop : la somme et la bande la voient', () => {
    const r = assemblerMorceaux([partie(1, 2, [art('Y', 9.9)]), partie(2, 2, [art('Y', 9.9), art('Z', 5)], { amountTTC: 14.9 })], bandes([1, [art('Y', 9.9), art('Z', 5)]]));
    expect(pesent(r).some((p: any) => p.code === 'somme-ecart')).toBe(true);
    expect(pesent(r).some((p: any) => /bande de contrôle ne retrouve pas/.test(p.message))).toBe(true);
  });

  it('une coupe à travers une ligne est signalée', () => {
    const r = assemblerMorceaux([partie(1, 2, [art('A', 1)], { coupeForcee: true }), partie(2, 2, [art('B', 2)], { amountTTC: 3 })], bandes([1, [art('A', 1), art('B', 2)]]));
    expect(pesent(r).some((p: any) => /sans espace blanc/.test(p.message))).toBe(true);
  });

  it('un morceau manquant ou déplacé : l’assemblage refuse, rien n’est rendu', () => {
    expect(() => morceauxRecus({ parties: [partie(1, 3, []), partie(3, 3, [])] })).toThrow(/n'est pas à sa place/);
    expect(() => morceauxRecus({ parties: [partie(1, 2, [])] })).toThrow(/manque/);
  });

  it('300 lignes en 12 morceaux et 11 bandes : 300 lignes exactes, somme = total, aucun point', () => {
    const vraies = Array.from({ length: 300 }, (_, i) => art(`Article ${i + 1}`, i + 1.5));
    const total = vraies.reduce((s, a) => s + (a.amountTTC as number), 0);
    const parties = Array.from({ length: 12 }, (_, k) => partie(k + 1, 12, vraies.slice(k * 25, k * 25 + 25), k === 11 ? { amountTTC: total } : {}));
    const jonctions = Array.from({ length: 11 }, (_, k) => [k + 1, vraies.slice((k + 1) * 25 - 2, (k + 1) * 25 + 2)] as [number, any[]]);
    const r = assemblerMorceaux(morceauxRecus({ parties }), bandes(...jonctions));
    expect(noms(r)).toEqual(vraies.map(a => a.name));
    expect(r.amountTTC).toBe(total);
    expect(pesent(r)).toEqual([]);
    expect(r.review.status).toBe('checked');
  });

  it('un désaccord de lecture d’une ligne suit sa ligne au rang global', () => {
    const point = (ligne: number) => ({ code: 'lectures-divergentes', origine: 'lecture', pese: true, champ: 'items', champs: [`items.${ligne}.amountTTC`], ligne, cle: `lectures-divergentes:${ligne}:items`, message: `désaccord ${ligne}` });
    const r = assemblerMorceaux([
      partie(1, 2, [art('A', 1), art('B', 2)]),
      partie(2, 2, [art('C', 3), art('D', 4)], { amountTTC: 10, points: [point(2)] }),
    ], bandes([1, [art('B', 2), art('C', 3)]]));
    expect(r.points.filter((p: any) => p.origine === 'lecture').map((p: any) => [p.ligne, p.champs[0]])).toEqual([[4, 'items.4.amountTTC']]);
  });

  it('`suite` survit à la normalisation seulement quand elle vaut true ; la consigne n’en parle pas sur la première partie', () => {
    const n = normalizeInvoiceScan({ items: [{ name: '', amountTTC: 1, suite: true }, { name: 'B', amountTTC: 2, suite: false }] });
    expect(n.items.map((i: any) => i.suite)).toEqual([true, undefined]);
    expect(morceauNote(1, 3)).not.toContain('suite = true');
    expect(morceauNote(2, 3)).toContain('suite = true');
  });

  it('jonctionConcorde : la suite des montants de la bande, d’un seul tenant, dans l’ordre', () => {
    const a = (m: number | null) => ({ amountTTC: m });
    expect(jonctionConcorde([a(2), a(3)], [a(1), a(2)], [a(3), a(4)])).toBe(true);
    expect(jonctionConcorde([a(3), a(2)], [a(1), a(2)], [a(3), a(4)])).toBe(false);
    expect(jonctionConcorde([a(2), a(0), a(3)], [a(1), a(2)], [a(3), a(4)])).toBe(false);
    expect(jonctionConcorde([], [a(1)], [a(2)])).toBe(false);
    expect(jonctionConcorde([], [], [a(2)])).toBe(false);
    expect(jonctionConcorde([], [], [])).toBe(true);
    expect(jonctionConcorde([a(2)], [], [a(2), a(3)])).toBe(true);
    expect(jonctionConcorde([a(1), a(2)], [a(1), a(2)], [a(3)])).toBe(false);
  });
});

describe('D381 : morceaux bord à bord, sans voisins, et bandes de contrôle', () => {
  const rangees = (() => { const rows: number[] = new Array(40).fill(0); for (let i = 0; i < 300; i++) rows.push(...new Array(14).fill(0.2), ...new Array(10).fill(0)); return rows; })();
  it('les zones se suivent bord à bord, coupées dans le blanc ; la vue est la zone seule', () => {
    expect(CONTEXT_LINES).toBe(0);
    const m = planMorceaux(rangees, 1200);
    expect(m[0].top).toBe(0);
    expect(m.at(-1)!.bottom).toBe(rangees.length);
    m.slice(1).forEach((b, i) => expect(b.top).toBe(m[i].bottom));
    const pas = linePitch(rangees)!;
    m.forEach(b => {
      expect(b.forced).toBe(false);
      expect([b.viewTop, b.viewBottom]).toEqual([b.top, b.bottom]);
      if (b.bottom < rangees.length) expect(rangees[b.bottom - 1]).toBe(0);
      expect((b.bottom - b.top) / pas).toBeLessThanOrEqual(25.5);
    });
  });
  it('une bande par coupe intérieure, à cheval, bords dans le blanc, environ 2 lignes de chaque côté', () => {
    const m = planMorceaux(rangees, 1200), j = planJonctions(m, rangees), pas = linePitch(rangees)!;
    expect(j.map(b => b.k)).toEqual(m.slice(0, -1).map((_, i) => i + 1));
    j.forEach((b, i) => {
      expect(b.top).toBeLessThan(m[i].bottom);
      expect(b.bottom).toBeGreaterThan(m[i].bottom);
      expect(rangees[b.top]).toBe(0);
      expect(rangees[b.bottom - 1]).toBe(0);
      expect(Math.round((m[i].bottom - b.top) / pas)).toBeGreaterThanOrEqual(2);
      expect(Math.round((b.bottom - m[i].bottom) / pas)).toBeGreaterThanOrEqual(2);
    });
  });
});

// Test en ligne du 08.11 (« Il y a pas le total ?? ») : ses factures B&R en PDF, coupées en 14 morceaux, finissaient sur le bulletin de paiement ;
// seule la dernière partie avait le droit de lire les totaux, et le total imprimé plus haut n'était lu par personne (0,00 à l'écran).
describe('Test en ligne 08.11 : le total imprimé ailleurs que sur la dernière partie', () => {
  it('chaque partie lit les totaux qu’elle porte (la consigne ne les réserve plus à la dernière)', () => {
    for (const [k, n] of [[1, 14], [11, 14], [14, 14]]) {
      expect(morceauNote(k, n)).toContain('Si les totaux du document');
      expect(morceauNote(k, n)).not.toContain('ils sont lus sur la dernière partie');
    }
  });
  it('un total lu sur une partie du milieu reste le total de la pièce quand la dernière (le bulletin) n’en porte pas', () => {
    const r = assemblerMorceaux([
      partie(1, 3, [art('A', 100)]),
      partie(2, 3, [art('B', 161.65)], { amountTTC: 261.65, tvaAmount: 16.1 }),
      partie(3, 3, []),
    ], bandes([1, [art('A', 100), art('B', 161.65)]], [2, []]));
    expect(r.amountTTC).toBe(261.65);
    expect(r.tvaAmount).toBe(16.1);
  });
});
