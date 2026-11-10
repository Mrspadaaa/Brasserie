/**
 * p3, bloquant 4 (jeu en ligne 5, BAUHAUS : « GANTS DE TRAVAIL » posé sur « METRE AUGA » à un autre montant, « ROBAN DE MASQUAGE » sur « PINCEAU PLAT »). Lignes FICTIVES (aucune pièce réelle).
 * L'ancien repli rapprochait par la position toute ligne sans paire au même rang des deux côtés dès que les deux listes avaient la même longueur : sur une photo tachée, des lignes sans rapport.
 */
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { lectureFusionnee, ressemblance, rangsProvisoires, retireesParLaTroisieme } from '../../functions/src/invoiceScanVote';

const ligne = (name: string, amountTTC: number, quantity = 1) => ({ name, kind: 'stock', quantity, unit: 'pc', amountTTC, reference: '' });
const ancre = (n: number) => ligne(`Article sûr ${n}`, 10 + n);

describe('p3 : rangsProvisoires rapproche sur preuve, jamais sur la seule position', () => {
  it('trois lignes sans rapport de chaque côté (même longueur) : aucune paire, ni correction inventée', () => {
    const prov = [ancre(1), ligne('Mètre ruban', 7.9), ligne('Turbine rotative', 12.2), ligne('Seau bleu', 1.2), ancre(2)];
    const final = [ancre(1), ligne('Gants de travail', 4.25), ligne('Tablier cuir', 8.85), ligne('Ruban de masquage', 4.5), ancre(2)];
    expect(rangsProvisoires(prov, final)).toEqual([0, null, null, null, 4]);
  });
  it('une faute d’OCR corrigée (nom très proche, même montant) se rapproche, à son vrai rang, même décalé', () => {
    const prov = [ancre(1), ligne('Mètre ruban', 7.9), ligne('BNOSEE NEY ORANCR', 4.55), ancre(2)];
    const final = [ancre(1), ligne('BROSSE NEY ORANCR', 4.55), ancre(2)];
    expect(rangsProvisoires(prov, final)).toEqual([0, 2, 3]);
  });
  it('une seule ligne sans paire de chaque côté, noms sans rapport : aucune paire ; noms proches : une paire', () => {
    expect(rangsProvisoires([ancre(1), ligne('Pinceau plat 40mm', 3.4), ancre(2)], [ancre(1), ligne('Ruban de masquage', 4.5), ancre(2)])).toEqual([0, null, 2]);
    expect(rangsProvisoires([ancre(1), ligne('Pinceau plat 40 mm', 3.4), ancre(2)], [ancre(1), ligne('Pinceau plat 40mm', 3.6), ancre(2)])).toEqual([0, 1, 2]);
  });
  it('une pièce d’une ligne dont la 3.8 change le nom et le montant : la paire reste (doc13)', () => {
    expect(rangsProvisoires([ligne('Malt Pilsner', 26)], [ligne('Malt Pilsner bio, sac de 25 kg', 52)])).toEqual([0]);
  });
  it('un nom très proche ne suffit pas à rapprocher deux lignes qui ont déjà leur paire exacte', () => {
    const prov = [ligne('Vis bois 4x40', 5.2), ligne('Vis bois 4x40', 5.2)];
    expect(rangsProvisoires(prov, prov.map(l => ({ ...l })))).toEqual([0, 1]);
  });
  it('ressemblance : 1 pour deux noms égaux à l’accent et à la casse près, 0 pour un nom vide', () => {
    expect(ressemblance('Éther', 'ether')).toBe(1);
    expect(ressemblance('', 'x')).toBe(0);
    expect(ressemblance('BNOSEE NEY', 'BROSSE NEY')).toBeGreaterThan(0.7);
    expect(ressemblance('Pinceau plat', 'Ruban de masquage')).toBeLessThan(0.4);
  });
});

describe('p3 : les lignes « retirées » écrites pour le cache sont celles que le flux ne rapproche pas', () => {
  const lecture = (items: any[], over: Record<string, unknown> = {}) => ({ normalized: normalizeInvoiceScan({ vendor: 'Quincaillerie Test', date: '2026-11-01', currency: 'CHF', amountTTC: 100, items: items.map((l, i) => ({ id: `line-${i + 1}`, price: l.amountTTC, vatCode: 'N', ...l })), ...over }) as any, cause: null });
  it('une ligne corrigée par la 3.8 (faute d’OCR) n’est pas « retirée » ; une ligne que la 3.8 ne rend plus l’est', () => {
    const prov = [ancre(1), ligne('BNOSEE NEY ORANCR', 4.55), ligne('Seau bleu', 1.2)];
    const l1 = lecture(prov), l2 = lecture(prov, { amountTTC: 99 });
    const final = { items: [ancre(1), ligne('BROSSE NEY ORANCR', 4.55)], amountTTC: 100, tvaAmount: 0 };
    const r = retireesParLaTroisieme(l1 as any, l2 as any, lecture(final.items) as any, final);
    expect(r?.lignes.map(x => x.rang)).toEqual([2]);
  });
});

describe('2026-11-10 : la fusion des trois lectures, par créneau, la 3.8 pour pivot (lectureFusionnee)', () => {
  const noms = ['Seau bleu', 'Turbine rotative', 'Mètre ruban', 'Gants de travail', 'Serre-joint', 'Jeu de clés', 'Brosse radiateur'];
  const montants = [1.2, 8.85, 7.9, 4.25, 14.9, 8.9, 5.6];
  const liste = (m: number[], n = noms, q: number | null = 1) => n.map((name, i) => ({ name, kind: 'other', amountTTC: m[i], price: q === null ? null : m[i], quantity: q, unit: q === null ? '' : 'pc', reference: '' }));
  const lu = (items: any[], over: Record<string, unknown> = {}) => normalizeInvoiceScan({ vendor: 'Quincaillerie Test', date: '2026-11-01', currency: 'CHF', amountTTC: Math.round(items.reduce((t, l) => t + l.amountTTC, 0) * 100) / 100, items, ...over }) as any;
  it('la 3.8 décalée d’un rang sur les montants (trois listes de même longueur) : le montant des deux Flash-Lite revient, le nom de la 3.8 reste', () => {
    const f = lectureFusionnee(lu(liste(montants)), lu(liste(montants)), lu(liste([1.2, 8.85, 4.25, 14.9, 8.9, 5.6, 5.6])));
    expect(f.items.map((x: any) => x.amountTTC)).toEqual(montants);
    expect(f.items.map((x: any) => x.name)).toEqual(noms);
  });
  it('une 3.8 qui corrige un montant sans rapport avec une voisine garde sa valeur ; deux Flash-Lite décalées ensemble (lignes en moins) ne la renversent pas', () => {
    const corrigee = liste(montants); corrigee[3] = { ...corrigee[3], amountTTC: 4.5, price: 4.5 };
    expect(lectureFusionnee(lu(liste(montants)), lu(liste(montants)), lu(corrigee)).items[3].amountTTC).toBe(4.5);
    const decalees = liste([1.2, 8.85, 4.25, 14.9], noms.slice(0, 4));
    expect(lectureFusionnee(lu(decalees), lu(decalees), lu(liste(montants))).items.map((x: any) => x.amountTTC)).toEqual(montants);
  });
  it('la 3.8 n’écrit ni quantité ni prix : le « 1 × prix » lu par les deux Flash-Lite au même montant reste (BAUHAUS, jeu 7 n° 4)', () => {
    const f = lectureFusionnee(lu(liste(montants)), lu(liste(montants)), lu(liste(montants, noms, null)));
    expect(f.items.every((x: any) => x.quantity === 1 && x.price === x.amountTTC)).toBe(true);
  });
  it('deux tickets d’un règlement : la 3.8 ne lit que le second ; les lignes du premier, lues par les deux Flash-Lite, restent, et le total est celui que leurs lignes font', () => {
    const p1 = liste([5.4, 9.2], ['Paracétamol 500 mg', 'Ibuprofène 400 mg']), p2 = liste([26.68, 50, 75.15], ['Vaxigrip', 'Vaccination', 'Comirnaty']);
    const deux = lu([...p1, ...p2], { amountTTC: 166.43, amountPaid: 166.43, terminalAmount: 166.43, countedAmounts: 5 });
    const f = lectureFusionnee(deux, deux, lu(p2, { amountTTC: 151.83, amountPaid: 14.6, countedAmounts: 13 }));
    expect(f.items.map((x: any) => x.name)).toEqual(['Paracétamol 500 mg', 'Ibuprofène 400 mg', 'Vaxigrip', 'Vaccination', 'Comirnaty']);
    expect(f.amountTTC).toBe(166.43);
    expect((f as any).amountPaid).toBe(166.43); // payé lu par deux lectures, jamais celui de la 3.8 seule
    expect((f as any).countedAmounts).toBeUndefined(); // 5 / 5 / 13 : la 3.8 contredit les deux autres, le comptage n'est pas un contrôle sûr
  });
  it('un comptage que la 3.8 est seule à lire n’est pas gardé (« 13 comptés », jeu 7 n° 2)', () => {
    const f = lectureFusionnee(lu(liste(montants)), lu(liste(montants), { countedAmounts: 9 }), lu(liste(montants), { countedAmounts: 13 }));
    expect((f as any).countedAmounts).toBeUndefined();
  });
  it('une faute d’OCR entre les deux Flash-Lite ne fait ni doublon ni ligne « retirée » (jeu 7 n° 3)', () => {
    const a = liste(montants), b = liste(montants, noms.map((n, i) => (i === 2 ? 'METRE RUBAN 1L' : n)));
    const f = lectureFusionnee(lu(a), lu(b), lu(liste(montants)));
    expect(f.items).toHaveLength(7);
    const final = { items: f.items, amountTTC: f.amountTTC, tvaAmount: f.tvaAmount };
    const third = { normalized: lu(liste(montants)), cause: null };
    expect(retireesParLaTroisieme({ normalized: lu(a), cause: null } as any, { normalized: lu(b, { amountTTC: 1 }), cause: null } as any, third as any, final)).toBeNull();
  });
});
