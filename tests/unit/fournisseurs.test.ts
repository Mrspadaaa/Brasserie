// Fiche fournisseur (maquette fournisseur/v1) : règles pures. Fixtures simulées.
import { describe, expect, it } from 'vitest';
import {
  analyserFournisseurs, apresReunion, delaiAppris, nomDeAdresseWeb, preuveMemeNom, REGLAGES_VIDES, reglagesValides, resoudre, reunir, tendance
} from '../../src/domain/fournisseurs';
import { vendorKey } from '../../src/domain/finance/duplicates';
import type { StockItem, Transaction } from '../../src/types';

const nom = (n: string) => ({ cle: vendorKey(n), nom: n });
const ligne = (ref: string, desc: string, prixCents: number, unite = 'kg', qte = 10) =>
  ({ id: `${ref}-${prixCents}`, description: desc, kind: 'ingredient', amountCents: prixCents * qte, quantity: qte, unit: unite, unitPriceCents: prixCents, stockItemRef: ref });
const depense = (id: string, date: string, vendor: string, cents: number, lignes: unknown[] = []): Transaction => ({
  id, date, description: `Achat ${vendor}`, amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, category: 'matieres', subcategory: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: lignes, vendor }
} as unknown as Transaction);
const art = (ref: string, name: string, category: string, supplier?: string): StockItem =>
  ({ id: ref, ref, name, category, unit: 'kg', currentStock: 1, reorder: false, supplier } as StockItem);

const STOCK = [art('us05', 'Levure US-05', 'Levure'), art('pils', 'Malt Pilsner', 'Malt', 'Brouwland'), art('citra', 'Citra T90', 'Houblon'), art('lac', 'Malt du Lac', 'Malt', 'Malterie du Lac')];
const TX: Transaction[] = [
  depense('t1', '14.01.2026', 'Brouwland', 34020, [ligne('pils', 'Pilsner', 3650)]),
  depense('t2', '19.03.2026', 'Brouwland', 40530, [ligne('pils', 'Pilsner', 3650)]),
  depense('t3', '08.06.2026', 'BROUWLAND BV', 73190, [ligne('pils', 'Pilsner', 3780), ligne('citra', 'Citra', 3950, 'kg', 5)]),
  depense('t4', '08.11.2026', 'brouwland.com', 38460, [ligne('pils', 'Pilsner', 3890), ligne('us05', 'Levure', 520, 'sachet', 4)]),
  depense('t5', '30.05.2025', 'Brouwland Belgique', 20510),
  depense('t6', '12.03.2026', 'Hopsteiner GmbH', 51000, [ligne('citra', 'Citra', 3990)]),
  depense('t7', '01.01.2026', 'Hopsteiner', 10000)
];

describe('preuveMemeNom', () => {
  it('« un mot en plus » : les mots du nom court sont tous dans le long', () => {
    expect(preuveMemeNom(nom('Brouwland'), nom('Brouwland Belgique'))).toBe('même nom, un mot en plus');
    expect(preuveMemeNom(nom('Brouwland Belgique'), nom('Brouwland'))).toBe('même nom, un mot de moins');
  });
  it('lit une adresse web comme le nom qu\'elle porte', () => {
    expect(nomDeAdresseWeb('www.brouwland.com')).toBe('brouwland');
    expect(nomDeAdresseWeb('Brouwland SA')).toBeNull();
    expect(nomDeAdresseWeb('S.à r.l.')).toBeNull();
    expect(preuveMemeNom(nom('Brouwland'), nom('brouwland.com'))).toBe('même nom, écrit comme une adresse web');
  });
  it('ne rapproche pas des noms sans mot commun, ni deux écritures d\'une même clé', () => {
    expect(preuveMemeNom(nom('Brouwland'), nom('Hopsteiner'))).toBeNull();
    expect(preuveMemeNom(nom('Brouwland'), nom('BROUWLAND SA'))).toBeNull();
    expect(preuveMemeNom(nom('Bio'), nom('Bio Suisse Hop'))).toBeNull();
  });
});

describe('analyserFournisseurs', () => {
  const a = analyserFournisseurs(TX, STOCK, REGLAGES_VIDES);
  const brouwland = a.fiches.get(vendorKey('Brouwland'))!;

  it('regroupe par nom normalisé (forme juridique ignorée) et compte les factures', () => {
    const hop = a.fiches.get(vendorKey('Hopsteiner'))!;
    expect(hop.factures).toHaveLength(2);
    expect(hop.totalCents).toBe(61000);
    expect(brouwland.factures).toHaveLength(3); // Brouwland (2) et BROUWLAND BV (1) : même clé
    expect(brouwland.totalCents).toBe(147740);
    expect(brouwland.aussiEcrit).toEqual(['BROUWLAND BV']);
  });
  it('propose les noms proches avec leur preuve, sans toucher aux factures', () => {
    expect(brouwland.candidats.map(c => [c.nom, c.factures, c.preuve]).sort()).toEqual([
      ['Brouwland Belgique', 1, 'même nom, un mot en plus'],
      ['brouwland.com', 1, 'même nom, écrit comme une adresse web']
    ]);
  });
  it('la liste n’a qu’une ligne par fournisseur : les noms proches se lisent dans la fiche', () => {
    const l = Object.fromEntries(a.liste.map(x => [x.nom, x]));
    expect(l['Brouwland'].procheDe).toBeUndefined();
    expect(l['Brouwland'].noms).toBe(3);
    expect(l['brouwland.com']).toBeUndefined();
    expect(l['Brouwland Belgique']).toBeUndefined();
    expect(l['Hopsteiner'].procheDe).toBeUndefined();
    // la fiche du nom proche existe toujours (une facture n'est jamais perdue)
    expect(a.fiches.has(vendorKey('brouwland.com'))).toBe(true);
  });
  it('« Pas maintenant » remet les noms proches en ligne, avec de qui ils semblent l’écriture', () => {
    const b = analyserFournisseurs(TX, STOCK, { ...REGLAGES_VIDES, plusTard: [vendorKey('Brouwland')] });
    const l = Object.fromEntries(b.liste.map(x => [x.nom, x]));
    expect(l['brouwland.com'].procheDe).toBe('Brouwland');
    expect(l['Brouwland Belgique'].procheDe).toBe('Brouwland');
  });
  it('le délai est inconnu, jamais 0, tant qu’aucune commande n’est reçue', () => {
    expect(brouwland.delaiJours).toBeNull();
    expect(a.liste.every(l => l.delaiJours === null)).toBe(true);
    expect(delaiAppris(undefined)).toBeNull();
    expect(delaiAppris([{ le: '2026-11-10' }])).toBeNull();
  });
  it('le délai s’apprend des commandes reçues (médiane) ; la commande ouverte se dit', () => {
    expect(delaiAppris([{ le: '2026-11-01', recue: '2026-11-07' }, { le: '2026-11-10', recue: '2026-11-19' }, { le: '2026-11-20', recue: '2026-11-26' }])).toEqual({ jours: 6, sur: 3 });
    const k = vendorKey('Brouwland');
    const f = analyserFournisseurs(TX, STOCK, { ...REGLAGES_VIDES, commandes: { [k]: [{ le: '2026-11-01', recue: '2026-11-08' }, { le: '2026-11-16' }] } }).fiches.get(k)!;
    expect(f.delaiJours).toBe(7);
    expect(f.delaiSur).toBe(1);
    expect(f.commandeOuverte).toMatchObject({ index: 1, le: '2026-11-16' });
  });
  it('un fournisseur ajouté à la main a sa fiche, avec pays et site', () => {
    const f = analyserFournisseurs(TX, STOCK, { ...REGLAGES_VIDES, ajoutes: [{ nom: 'Moulin Rey', pays: 'Suisse', site: 'moulinrey.ch' }] }).fiches.get(vendorKey('Moulin Rey'))!;
    expect(f.sansFacture).toBe(true);
    expect(f.infos).toEqual({ pays: 'Suisse', site: 'moulinrey.ch' });
  });
  it('le fournisseur du stock sans facture a sa fiche vide', () => {
    const lac = a.fiches.get(vendorKey('Malterie du Lac'))!;
    expect(lac.sansFacture).toBe(true);
    expect(lac.factures).toEqual([]);
    expect(lac.articles).toEqual([]);
  });
  it('les prix viennent des lignes de facture (dernier prix, courbe du plus ancien au plus récent)', () => {
    const pils = brouwland.articles.find(x => x.nom === 'Malt Pilsner')!;
    expect(pils.points.map(p => p.cents)).toEqual([3650, 3650, 3780]);
    expect(pils.unite).toBe('kg');
    expect(brouwland.familles).toEqual(['malts', 'houblons']);
  });
  it('un article de facture sans prix unitaire exact n\'a pas de prix (l\'inconnu n\'est pas 0)', () => {
    const sans = analyserFournisseurs([depense('x', '01.02.2026', 'Moulin X', 5000, [{ id: 'l', description: 'Malt', kind: 'ingredient', amountCents: 5000 }])], [], REGLAGES_VIDES);
    expect(sans.fiches.get(vendorKey('Moulin X'))!.articles).toEqual([]);
  });
  it('réunir des noms : factures, totaux et prix suivent ; « Ailleurs » et les articles cachés se mettent à jour', () => {
    const cle = vendorKey('Brouwland');
    expect(brouwland.articlesCaches).toBe(1); // la levure, vue seulement sous brouwland.com
    const reg = reunir(REGLAGES_VIDES, cle, [vendorKey('brouwland.com'), vendorKey('Brouwland Belgique')]);
    const b = analyserFournisseurs(TX, STOCK, reg).fiches.get(cle)!;
    expect(b.factures).toHaveLength(5);
    expect(b.totalCents).toBe(34020 + 40530 + 73190 + 38460 + 20510);
    expect([...b.aussiEcrit].sort()).toEqual(['BROUWLAND BV', 'Brouwland Belgique', 'brouwland.com']);
    expect(b.candidats).toEqual([]);
    expect(b.articlesCaches).toBe(0);
    const pils = b.articles.find(x => x.nom === 'Malt Pilsner')!;
    expect(pils.points.map(p => p.cents)).toEqual([3650, 3650, 3780, 3890]);
    expect(b.articles.map(x => x.nom)).toContain('Levure US-05');
    // le Citra de Brouwland coûte 39,50 ; Hopsteiner le vend 39,90 : « Ailleurs » le dit.
    const citra = b.articles.find(x => x.nom === 'Citra T90')!;
    expect(citra.ailleurs.map(x => [x.fournisseur, x.cents])).toEqual([['Hopsteiner', 3990]]);
    expect(analyserFournisseurs(TX, STOCK, reg).liste.map(l => l.nom)).not.toContain('brouwland.com');
  });
  it('annuler une réunion (réglages d\'avant) rend les deux fiches', () => {
    const reg = reunir(REGLAGES_VIDES, vendorKey('Brouwland'), [vendorKey('brouwland.com')]);
    expect(analyserFournisseurs(TX, STOCK, reg).fiches.has(vendorKey('brouwland.com'))).toBe(false);
    expect(analyserFournisseurs(TX, STOCK, REGLAGES_VIDES).fiches.has(vendorKey('brouwland.com'))).toBe(true);
  });
  it('une dépense annulée ou une recette ne compte pas', () => {
    const annulee = { ...depense('v', '01.02.2026', 'Brouwland', 9999), finance: { version: 1, kind: 'expense', amountCents: 9999, lines: [], vendor: 'Brouwland', voidedAt: '2026-02-02' } } as unknown as Transaction;
    const recette = { ...depense('r', '01.02.2026', 'Client SA', 100), category: 'recettes', finance: { version: 1, kind: 'income', amountCents: 100, lines: [], vendor: 'Client SA' } } as unknown as Transaction;
    expect(analyserFournisseurs([annulee, recette], [], REGLAGES_VIDES).liste).toEqual([]);
  });
});

describe('apresReunion, tendance, réglages', () => {
  it('« Après » somme les noms cochés', () => {
    const f = analyserFournisseurs(TX, STOCK, REGLAGES_VIDES).fiches.get(vendorKey('Brouwland'))!;
    expect(apresReunion(f, [])).toEqual({ factures: 3, cents: 147740 });
    expect(apresReunion(f, f.candidats.map(c => c.cle))).toEqual({ factures: 5, cents: 206710 });
  });
  it('tendance : plus cher ↑, moins cher ↓, même, premier prix', () => {
    expect(tendance([{ cents: 100 }])).toEqual({ sens: 'premier', centimes: 0 });
    expect(tendance([{ cents: 3650 }, { cents: 3780 }])).toEqual({ sens: 'haut', centimes: 130 });
    expect(tendance([{ cents: 3950 }, { cents: 3480 }])).toEqual({ sens: 'bas', centimes: 470 });
    expect(tendance([{ cents: 3650 }, { cents: 3650 }])).toEqual({ sens: 'egal', centimes: 0 });
  });
  it('réglages abîmés : jamais une erreur', () => {
    expect(reglagesValides(null)).toEqual(REGLAGES_VIDES);
    expect(reglagesValides('x')).toEqual(REGLAGES_VIDES);
    expect(reglagesValides({ reunis: { a: 'b', c: 3, d: 'd' }, raisons: { a: { raisons: ['x'], le: '2026-11-16' }, b: { raisons: 3 } }, plusTard: ['a', 4] }))
      .toEqual({ reunis: { a: 'b' }, raisons: { a: { raisons: ['x'], le: '2026-11-16' } }, plusTard: ['a'], ajoutes: [], commandes: {} });
    expect(reglagesValides({ ajoutes: [{ nom: 'X', pays: 3 }, 4], commandes: { k: [{ le: '2026-11-01', recue: 'hier' }, { le: 'x' }] } }))
      .toEqual({ reunis: {}, raisons: {}, plusTard: [], ajoutes: [{ nom: 'X' }], commandes: { k: [{ le: '2026-11-01' }] } });
  });
  it('un cycle de renvois ne boucle pas ; les noms déjà réunis suivent', () => {
    expect(resoudre('a', { a: 'b', b: 'a' })).toBe('b');
    const r = reunir(reunir(REGLAGES_VIDES, 'b', ['c']), 'a', ['b']);
    expect(resoudre('c', r.reunis)).toBe('a');
  });
});
