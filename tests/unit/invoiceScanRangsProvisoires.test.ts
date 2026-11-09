/**
 * p3, bloquant 4 (jeu en ligne 5, BAUHAUS : « GANTS DE TRAVAIL » posé sur « METRE AUGA » à un autre montant, « ROBAN DE MASQUAGE » sur « PINCEAU PLAT »). Lignes FICTIVES (aucune pièce réelle).
 * L'ancien repli rapprochait par la position toute ligne sans paire au même rang des deux côtés dès que les deux listes avaient la même longueur : sur une photo tachée, des lignes sans rapport.
 */
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { ressemblance, rangsProvisoires, retireesParLaTroisieme } from '../../functions/src/invoiceScanVote';

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
