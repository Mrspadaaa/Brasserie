// R4 — le recalcul client des points de ligne et de somme, avec les MÊMES fonctions que le serveur (P7) ; l'inconnu n'est jamais « sans doute » (P9).
import { describe, expect, it } from 'vitest';
import * as serveur from '../../../../functions/src/invoiceScanCore';
import * as client from '../../../../src/domain/finance/invoicePoints';
import { recomputeInvoicePoints, statutDeLecture } from '../../../../src/domain/finance/invoicePoints';

const l = (n: number, over: Record<string, unknown> = {}) => ({ id: `line-${n}`, name: `Article ${n}`, kind: 'stock', quantity: 1, unit: 'Kg', price: 1, amountTTC: 1, ...over });
const scan = (over: Record<string, unknown> = {}) => ({ items: [l(1, { quantity: 60, price: 2.3, amountTTC: 13.8 }), l(2, { price: 0.1, amountTTC: 0.1 })], amountTTC: 13.9, amountHT: null, tvaAmount: null, linesLost: 0, points: [], controls: undefined, review: { status: 'disputed', findings: [] }, ...over }) as any;

describe('R4 — même source de règles que le serveur', () => {
  it('lineMathCheck et sumCheck du client sont les fonctions du serveur', () => {
    expect(client.lineMathCheck).toBe(serveur.lineMathCheck);
    expect(client.sumCheck).toBe(serveur.sumCheck);
    expect(client.SCAN_POINT_CODES).toEqual(serveur.SCAN_POINT_CODES);
  });
});

describe('R4 — corriger une valeur recalcule les points', () => {
  it('60 Kg lus pour 6 : ligne-montant ; corrigé en 6 : le point disparaît et plus rien ne pèse', () => {
    const faux = recomputeInvoicePoints(scan());
    expect(faux.points.map((p: any) => [p.code, p.ligne, p.pese])).toEqual([['ligne-montant', 1, true]]);
    expect(faux.statut).toBe('disputed');
    const juste = recomputeInvoicePoints(scan({ items: [l(1, { quantity: 6, price: 2.3, amountTTC: 13.8 }), l(2, { price: 0.1, amountTTC: 0.1 })] }));
    expect(juste.points).toEqual([]);
    expect(juste.controls.lines.failed).toBe(0);
    expect(juste.statut).toBe('ok');
  });

  it('un total tapé faux donne somme-ecart au centime ; le bon total la fait disparaître', () => {
    const items = [l(1, { amountTTC: 13.8, price: 13.8 }), l(2, { price: 0.1, amountTTC: 0.1 })];
    const faux = recomputeInvoicePoints(scan({ items, amountTTC: 14.0 }));
    expect(faux.points.find((p: any) => p.code === 'somme-ecart')).toMatchObject({ lu: 1400, calcule: 1390, ecart: 10, bloque: true, pese: true });
    expect(recomputeInvoicePoints(scan({ items, amountTTC: 13.9 })).points).toEqual([]);
  });

  it('un prix par 100 g n\'est jamais un écart ; une fraction de centime n\'est pas vérifiée', () => {
    const lot = recomputeInvoicePoints(scan({ items: [l(1, { quantity: 250, unit: 'g', price: 8, amountTTC: 20 })], amountTTC: 20 }));
    expect(lot.points.map((p: any) => p.code)).toEqual(['ligne-prix-par-lot']);
    const fraction = recomputeInvoicePoints(scan({ items: [l(1, { quantity: 1, price: 1.345, amountTTC: 1.345 })], amountTTC: 1.345 }));
    expect(fraction.points).toEqual([]);
  });

  it('linesLost > 0 : la somme est incomplète', () => {
    expect(recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: 1, linesLost: 2 })).controls.sum.statut).toBe('incomplet');
  });

  it('une ligne supprimée : son point part, les rangs des autres ne bougent pas (rang par id)', () => {
    const precedents = [
      { code: 'lectures-divergentes', ligne: 1, cle: 'lectures-divergentes:1:quantity', pese: true },
      { code: 'lectures-divergentes', ligne: 2, cle: 'lectures-divergentes:2:quantity', pese: true },
      { code: 'tva-incoherente', ligne: null, cle: 'tva-incoherente:-:vat' },
    ];
    const r = recomputeInvoicePoints(scan({ items: [l(2, { quantity: 2, price: 0.1, amountTTC: 0.1 })], amountTTC: 0.1, points: precedents }));
    const cles = r.points.map((p: any) => p.cle);
    expect(cles).toContain('lectures-divergentes:2:quantity');
    expect(cles).toContain('tva-incoherente:-:vat');
    expect(cles).not.toContain('lectures-divergentes:1:quantity');
    const montant = r.points.find((p: any) => p.code === 'ligne-montant');
    expect(montant).toMatchObject({ ligne: 2, cle: 'ligne-montant:2:items', champs: ['items.2.quantity', 'items.2.price', 'items.2.amountTTC'] });
    expect(montant.message).toMatch(/^Ligne 2 \(/);
  });

  it('une ligne déplacée garde ses cles', () => {
    const ordre = (items: any[]) => recomputeInvoicePoints(scan({ items, amountTTC: 0.4 })).points.map((p: any) => p.cle).sort();
    const a = l(1, { quantity: 2, price: 0.1, amountTTC: 0.1 }), b = l(2, { quantity: 3, price: 0.1, amountTTC: 0.1 });
    expect(ordre([a, b])).toEqual(ordre([b, a]));
  });

  it('« revu » ne vaut que pour la même signature', () => {
    const un = recomputeInvoicePoints(scan({ items: [l(1, { quantity: 2, price: 1, amountTTC: 3 })], amountTTC: 3 })).points[0] as any;
    const deux = recomputeInvoicePoints(scan({ items: [l(1, { quantity: 2, price: 1, amountTTC: 4 })], amountTTC: 4 })).points[0] as any;
    expect(un.cle).toBe(deux.cle);
    expect(un.signature).not.toBe(deux.signature);
  });

  it('les autres points (TVA, désaccord) sont gardés tels quels', () => {
    const tva = { code: 'tva-incoherente', ligne: null, cle: 'tva-incoherente:-:vat', pese: true, message: 'TVA' };
    expect(recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: 1, points: [tva] })).points).toContainEqual(tva);
  });
});

describe('P9 — non contrôlé n\'est jamais « vérifié »', () => {
  it('un ancien résultat (sans points ni controls) : statut jamais checked tant que le recalcul n\'a pas tourné', () => {
    const ancien = { items: [l(1)], amountTTC: 1, amountHT: null, review: { status: 'checked', findings: [] } } as any;
    expect(statutDeLecture(ancien)).toBe('disputed');
    const recalcule = recomputeInvoicePoints(ancien);
    expect(recalcule.controls).toBeDefined();
    expect(statutDeLecture({ ...ancien, points: recalcule.points, controls: recalcule.controls })).toBe('checked');
  });
  it('plancher (relecture, point 2) : un serveur qui dit disputed avec points et controls vides n\'est jamais checked tant que le recalcul n\'a pas posé ses points', () => {
    const serveurDit = { review: { status: 'disputed', findings: [] }, points: [], controls: { lines: {}, sum: {}, vat: {}, totals: {} } } as any;
    expect(statutDeLecture(serveurDit)).toBe('disputed');
    // A (contre-vérification) : le plancher ne se lève ni sur un booléen, ni sur un objet forgé : seulement sur le résultat réel de recomputeInvoicePoints
    expect(statutDeLecture(serveurDit, true as any)).toBe('disputed');
    expect(statutDeLecture(serveurDit, { points: [], controls: serveurDit.controls, statut: 'ok' } as any)).toBe('disputed');
    const reel = recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: 1 }));
    expect(statutDeLecture(serveurDit, reel)).toBe('checked');
    const reelLourd = recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: null }));
    expect(statutDeLecture(serveurDit, reelLourd)).toBe('disputed');
    // un recalcul réel mais d'une AUTRE lecture ne ment pas : ses points sont ceux qui comptent, jamais ceux du serveur périmé
    expect(statutDeLecture({ ...serveurDit, points: [{ code: 'total-absent', pese: true }] }, reel)).toBe('checked');
  });
  it('C : sans tvaAmount, le point ht-tva-ttc du serveur est gardé ; avec tvaAmount (même null), la règle est refaite', () => {
    const serveurHt = { code: 'ht-tva-ttc', gravite: 'ecart', ligne: null, cle: 'ht-tva-ttc:-:amountHT', message: 'Les totaux HT + TVA ne correspondent pas au TTC du document.', champs: ['amountHT', 'tvaAmount', 'amountTTC'], pese: true };
    const sans = recomputeInvoicePoints({ items: [l(1)], amountTTC: 1, amountHT: 8, linesLost: 0, points: [serveurHt] } as any);
    expect(sans.points.map((p: any) => p.code)).toContain('ht-tva-ttc');
    const avec = recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: 1, amountHT: 0.92, tvaAmount: 0.08, points: [serveurHt] }));
    expect(avec.points.map((p: any) => p.code)).not.toContain('ht-tva-ttc');
  });
  it('total saisi (relecture, point 5) : total-absent et ht-tva-ttc sont refaits depuis le total courant', () => {
    const absent = { code: 'total-absent', gravite: 'ecart', ligne: null, cle: 'total-absent:-:amountTTC', message: 'Total TTC absent ou non positif : à saisir.', champs: ['amountTTC'], pese: true };
    const sans = recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: null, points: [absent] }));
    expect(sans.points.map((p: any) => p.code)).toContain('total-absent');
    const saisi = recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: 1, points: [absent] }));
    expect(saisi.points.map((p: any) => p.code)).not.toContain('total-absent');
    expect(saisi.statut).toBe('ok');
    const ht = recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: 1, amountHT: 8, tvaAmount: 1 }));
    expect(ht.points.find((p: any) => p.code === 'ht-tva-ttc')).toMatchObject({ pese: true, lu: 100, calcule: 900 });
    const corrige = recomputeInvoicePoints(scan({ items: [l(1)], amountTTC: 1, amountHT: 0.92, tvaAmount: 0.08, points: ht.points }));
    expect(corrige.points.map((p: any) => p.code)).not.toContain('ht-tva-ttc');
  });
  it('une lecture indisponible reste indisponible', () => {
    expect(statutDeLecture({ items: [], review: { status: 'unavailable', findings: [] } } as any)).toBe('unavailable');
  });
});
