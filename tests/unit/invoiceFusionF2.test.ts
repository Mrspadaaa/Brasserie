/**
 * Voie f2 de la mission 2026-11-10-fusion-lectures (jeu en ligne 8, VERDICT-EN-LIGNE-8) : les bloquants 1 à 5. Lignes FICTIVES (aucune pièce réelle).
 *   1 + 4 : un nom de la 3.8 posé sur le montant d'une voisine ne l'emporte pas sur le nom que les deux Flash-Lite lisent à ce montant (vote du NOM, ROVER) ;
 *   2     : « annoncés 23 » (`printedLineCount`) est voté comme un comptage ;
 *   3     : un prix ou une unité nul de la 3.8 ne l'emporte pas sur la valeur lue au même montant ;
 *   5     : un rabais total (somme d'autres rabais) ou un sous-total que la 3.8 ne rend pas n'est pas une ligne « retirée » à proposer.
 */
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { lectureFusionnee, retireesParLaTroisieme } from '../../functions/src/invoiceScanVote';

const noms = ['Seau bleu', 'Turbine rotative', 'Mètre ruban', 'Gants de travail', 'Éponge chantier', 'Crayons gras', 'Serre-joint', 'Jeu de clés', 'Brosse radiateur'];
const montants = [1.2, 8.85, 7.9, 8.5, 3.1, 2.45, 14.9, 8.9, 4.95];
const liste = (n = noms, m = montants, q: number | null = 1) => n.map((name, i) => ({ name, kind: 'other', amountTTC: m[i], price: q === null ? null : m[i], quantity: q, unit: q === null ? '' : 'pc', reference: '' }));
const lu = (items: any[], over: Record<string, unknown> = {}) => normalizeInvoiceScan({ vendor: 'Quincaillerie Test', date: '2026-11-01', currency: 'CHF', amountTTC: Math.round(items.reduce((t, l) => t + l.amountTTC, 0) * 100) / 100, items, ...over }) as any;
const decale = (n: string[], de: number, a: number) => n.map((x, i) => (i >= de && i < a ? n[i - 1] : x)); // les noms de la 3.8 glissent d'un rang entre de et a, les montants restent

describe('vote du nom (jeu en ligne 8, bloquants 1 et 4)', () => {
  it('la 3.8 a glissé les noms d’un rang (les montants sont justes) : le nom que les deux Flash-Lite lisent à ce montant l’emporte', () => {
    const troisieme = liste(decale(noms, 3, 8));
    expect(troisieme.map(x => x.name)).not.toEqual(noms);
    const f = lectureFusionnee(lu(liste()), lu(liste()), lu(troisieme));
    expect(f.items.map((x: any) => x.amountTTC)).toEqual(montants);
    expect(f.items.map((x: any) => x.name)).toEqual(noms);
  });
  it('une Flash-Lite lit le même nom que la 3.8 : le nom de la 3.8 reste (elle n’est pas contredite par une majorité)', () => {
    const a = liste(), b = liste(noms.map((n, i) => (i === 3 ? 'Gantelets cuir' : n))), c = liste(noms.map((n, i) => (i === 3 ? 'Gants de travail L' : n)));
    expect(lectureFusionnee(lu(a), lu(b), lu(c)).items[3].name).toBe('Gants de travail L');
  });
  it('une 3.8 qui corrige un nom sans en prendre un d’une autre ligne (traduction, nom complété) garde le sien', () => {
    const troisieme = liste(noms.map((n, i) => (i === 6 ? 'Serre-joint à vis 150 mm' : i === 0 ? 'Seau en plastique bleu 10 L' : n)));
    const f = lectureFusionnee(lu(liste()), lu(liste()), lu(troisieme));
    expect([f.items[0].name, f.items[6].name]).toEqual(['Seau en plastique bleu 10 L', 'Serre-joint à vis 150 mm']);
  });
  it('les trois lectures se contredisent (aucune majorité) : la 3.8 reste, rien n’est inventé', () => {
    const pas = (n: string[], de: number, k: number) => n.map((x, i) => (i >= de ? n[i - k] : x));
    const a = liste(), b = liste(pas(noms, 3, 2)), c = liste(pas(noms, 3, 1));
    const f = lectureFusionnee(lu(a), lu(b), lu(c));
    expect(f.items.map((x: any) => x.name)).toEqual(c.map(x => x.name));
    expect(f.items.map((x: any) => x.amountTTC)).toEqual(montants);
  });
});

describe('« annoncés N » est un comptage voté (bloquant 2)', () => {
  it('la 3.8 est seule à annoncer 23 : le nombre n’est pas gardé', () => {
    const f = lectureFusionnee(lu(liste(), { printedLineCount: 9 }), lu(liste(), { printedLineCount: 8 }), lu(liste(), { printedLineCount: 23 }));
    expect((f as any).printedLineCount).toBeNull();
  });
  it('la 3.8 annonce le nombre qu’une autre lecture annonce : gardé', () => {
    const f = lectureFusionnee(lu(liste(), { printedLineCount: 9 }), lu(liste(), { printedLineCount: 8 }), lu(liste(), { printedLineCount: 9 }));
    expect((f as any).printedLineCount).toBe(9);
  });
  it('aucune lecture n’annonce rien : rien n’est inventé', () => {
    expect((lectureFusionnee(lu(liste()), lu(liste()), lu(liste())) as any).printedLineCount).toBeNull();
  });
});

describe('le prix et l’unité lus au même montant ne se perdent pas (bloquant 3)', () => {
  it('la 3.8 écrit « 1 », sans unité ni prix ; les deux Flash-Lite lisent « 1 pièce × prix » au même montant : le prix et l’unité reviennent', () => {
    const troisieme = liste().map(x => ({ ...x, price: null, unit: '' }));
    const f = lectureFusionnee(lu(liste()), lu(liste()), lu(troisieme));
    expect(f.items.every((x: any) => x.quantity === 1 && x.price === x.amountTTC && x.unit === 'pc')).toBe(true);
  });
  it('une seule Flash-Lite lit le prix, et il tient (quantité × prix = montant) : il revient ; une unité contredite entre les lectures ne s’invente pas', () => {
    const a = liste(), b = liste().map(x => ({ ...x, price: null, unit: 'kg' })), c = liste().map(x => ({ ...x, price: null, unit: '' }));
    const f = lectureFusionnee(lu(a), lu(b), lu(c));
    expect(f.items.every((x: any) => x.price === x.amountTTC)).toBe(true);
    expect(f.items.every((x: any) => x.unit === '')).toBe(true); // « pc » (lecture 1) et « kg » (lecture 2) : aucune majorité, l’unité reste à préciser
  });
  it('la 3.8 lit un prix et une unité : ils restent, même quand une Flash-Lite lit autre chose', () => {
    const troisieme = liste().map(x => ({ ...x, unit: 'pièce' })), b = liste().map(x => ({ ...x, unit: 'kg' }));
    const f = lectureFusionnee(lu(liste()), lu(b), lu(troisieme));
    expect(f.items.every((x: any) => x.unit === 'pièce' && x.price === x.amountTTC)).toBe(true);
  });
});

describe('un rabais total n’est pas une ligne « retirée » (bloquant 5)', () => {
  const rang = (name: string, amountTTC: number, kind = 'other') => ({ name, kind, quantity: 1, unit: 'pc', price: amountTTC, amountTTC, reference: '' });
  const lecture = (items: any[], over: Record<string, unknown> = {}) => ({ normalized: lu(items, over), cause: null });
  const ticket = [rang('Paracétamol 500 mg', 5.4), rang('Vaxigrip', 26.68), rang('Rabais', -0.68, 'discount'), rang('Comirnaty', 75.15), rang('Rabais', -1.9, 'discount')];
  it('le « Rabais total » (somme de deux rabais) lu par les deux Flash-Lite et absent de la 3.8 n’est pas proposé', () => {
    const avecTotal = [...ticket, rang('Rabais total CHF', -2.58, 'discount')];
    const final = lu(ticket, { amountTTC: 104.65 }), l1 = lecture(avecTotal, { amountTTC: 104.65 }), l2 = lecture(avecTotal, { amountTTC: 99 });
    expect(retireesParLaTroisieme(l1 as any, l2 as any, lecture(ticket, { amountTTC: 104.65 }) as any, { items: final.items, amountTTC: 104.65, tvaAmount: 0 })).toBeNull();
  });
  it('une ligne d’article que la 3.8 ne rend pas reste proposée, et un sous-total ne l’est pas', () => {
    const avec = [...ticket, rang('Sous-total', 105.43), rang('Seringue', 3.2)];
    const final = lu(ticket, { amountTTC: 104.65 }), l1 = lecture(avec, { amountTTC: 111 }), l2 = lecture(avec, { amountTTC: 99 });
    const r = retireesParLaTroisieme(l1 as any, l2 as any, lecture(ticket, { amountTTC: 104.65 }) as any, { items: final.items, amountTTC: 104.65, tvaAmount: 0 });
    expect(r?.lignes.map(x => x.ligne.name)).toEqual(['Seringue']);
  });
});
