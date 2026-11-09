import { describe, expect, it } from 'vitest';
import type { Batch, Client, KegItem, PricingItem, Transaction } from '../../src/types';
import { totauxPanier, problemePanier, messageBornes, resumePanier, type LignePanier } from '../../src/ui/vente/panier';
import { formatDepuisTarif, formatsDuBrassin, tarifDuFormat } from '../../src/ui/vente/formatsVente';
import { decoderLigneVente, encoderLigneVente } from '../../src/ui/vente/ligneVente';
import { jaugeBrassin, litresVendus } from '../../src/ui/vente/brassinsVendables';
import { debiteurDe } from '../../src/ui/vente/enregistrerVente';
import { adresseBrasserie, companyFraiche, uidValide } from '../../src/domain/companyDefaults';

const ligne = (over: Partial<LignePanier>): LignePanier => ({ cle: 'k', formatId: '33cl', designation: 'Pale Ale · 33 cl', litresUnite: 0.33, quantite: 1, prixHT: 5, ...over });
const tarif = (product: string, priceHT: number): PricingItem => ({ product, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT, marginCHF: 0, marginPercent: 0 });
const recette = (id: string, lines: { ref?: string; qte: number }[], voided = false): Transaction => ({
  id, date: '2026-11-09', description: 'v', amountHT: 1, amountTTC: 1, tvaAmount: 0, tvaRate: 0, category: 'recettes', subcategory: '',
  finance: { version: 1, kind: 'income', amountCents: 100, ...(voided ? { voidedAt: '2026-11-10T00:00:00Z' } : {}), lines: lines.map((l, i) => ({ id: `${id}-${i}`, description: 'x', kind: 'other' as const, amountCents: 100, quantity: l.qte, sourceReference: l.ref })) }
} as Transaction);

describe('caisse — panier en centimes', () => {
  it('24 × 5,00 + 6 × 10,00 = 18 000 ct', () => {
    const t = totauxPanier([ligne({ quantite: 24, prixHT: 5 }), ligne({ cle: 'b', formatId: '75cl', quantite: 6, prixHT: 10 })], false, 0.081);
    expect(t?.totalCents).toBe(18_000);
    expect(t?.vatCents).toBe(0);
  });
  it('2,135 × 1 = 214 ct (arrondi décimale-sûr)', () => {
    expect(totauxPanier([ligne({ prixHT: 2.135 })], false, 0.081)?.totalCents).toBe(214);
  });
  it('un prix inconnu donne un total null, jamais 0 ; un article à 0 CHF ne se facture pas', () => {
    expect(totauxPanier([ligne({ prixHT: null })], false, 0.081)).toBeNull();
    expect(problemePanier([ligne({ prixHT: null })])).toMatch(/Article 1 : indique son prix/);
    expect(problemePanier([ligne({ prixHT: 0 })])).toMatch(/Article 1 : indique son prix/);
    expect(problemePanier([])).toMatch(/vide/);
  });
  it('assujetti : la TVA par ligne, en centimes, somme exacte', () => {
    const t = totauxPanier([ligne({ quantite: 3, prixHT: 10 }), ligne({ cle: 'b', quantite: 1, prixHT: 0.07 })], true, 0.081)!;
    expect(t.lines.map(l => l.vatCents)).toEqual([243, 1]);
    expect(t.totalCents).toBe(t.lines.reduce((n, l) => n + l.totalCents, 0));
    expect(t.netCents + t.vatCents).toBe(t.totalCents);
  });
  it('au-delà de 50 000 CHF : le message de borne (MV-38) ; en dessous : aucun', () => {
    expect(messageBornes(99_999_900)).toMatch(/dépasse/);
    expect(messageBornes(20_000)).toBeNull();
    expect(messageBornes(null)).toBeNull();
  });
  it('le résumé du panier garde tous les articles, 140 caractères au plus', () => {
    expect(resumePanier([{ designation: 'Pale Ale · 33 cl', quantite: 24 }, { designation: 'Pale Ale · 75 cl', quantite: 6 }])).toBe('24 × Pale Ale · 33 cl · 6 × Pale Ale · 75 cl');
    const long = resumePanier(Array.from({ length: 20 }, (_, i) => ({ designation: `Bière numéro ${i}`, quantite: 12 })));
    expect(long.length).toBeLessThanOrEqual(140);
    expect(long).toMatch(/et \d+ autres?/);
  });
});

describe('caisse — formats et tarifs (D3)', () => {
  it('reconnaît le format dans le nom du tarif, sinon null', () => {
    expect(formatDepuisTarif('Pale Ale 33 cl')).toBe('33cl');
    expect(formatDepuisTarif('Bouteille 75cl')).toBe('75cl');
    expect(formatDepuisTarif('Fût 20 L')).toBe('fut');
    expect(formatDepuisTarif('Carton de verres')).toBeNull();
  });
  it('format ET nom de la bière : un seul candidat = son prix ; plusieurs ou aucun = null (« prix ? »)', () => {
    const t = [tarif('Pale Ale 33 cl', 5), tarif('IPA 33 cl', 6), tarif('Pale Ale 75 cl', 10)];
    expect(tarifDuFormat(t, '33cl', 'Pale Ale de septembre')?.priceHT).toBe(5);
    expect(tarifDuFormat(t, '33cl', 'IPA')?.priceHT).toBe(6);
    expect(tarifDuFormat(t, '33cl', 'Stout')).toBeNull();
    expect(tarifDuFormat([tarif('33 cl', 4), tarif('Bouteille 33 cl', 5)], '33cl', 'Pale Ale')).toBeNull();
    expect(tarifDuFormat(t, 'fut', 'Pale Ale')).toBeNull();
  });
  it('un tarif porté depuis l\'écran Prix : son format et sa bière écrits priment sur le nom (Prix → Caisse)', () => {
    const porte = { ...tarif('Saison de la Sarine', 7), biere: 'Saison de la Sarine', format: { id: '75cl' as const, volumeL: 0.75 } };
    const t = [porte, tarif('Pale Ale 75 cl', 10)];
    expect(tarifDuFormat(t, '75cl', 'Saison de la Sarine')?.priceHT).toBe(7);
    expect(tarifDuFormat(t, '75cl', 'Pale Ale')?.priceHT).toBe(10);
    expect(tarifDuFormat(t, '33cl', 'Saison de la Sarine')).toBeNull();
    // le format écrit l'emporte sur un nom qui en dirait un autre
    expect(tarifDuFormat([{ ...tarif('Saison 33 cl', 4), biere: 'Saison', format: { id: 'fut' as const, volumeL: 20 } }], 'fut', 'Saison')?.priceHT).toBe(4);
  });
  it('le fût prend la capacité des fûts du brassin (30 L), sinon 20 L « à vérifier » ; un format absent est marqué', () => {
    const batch = { id: 'B1', packaging: { bottles33: 10, bottles75: 0, kegIds: ['F-1'] } } as unknown as Batch;
    const f30 = formatsDuBrassin(batch, [{ id: 'F-1', capacityL: 30 } as KegItem]);
    expect(f30[2].format.volumeL).toBe(30);
    expect(f30[2].aVerifier).toBe(false);
    expect(f30[1].present).toBe(false);
    const sans = formatsDuBrassin(batch, []);
    expect(sans[2].format.volumeL).toBe(20);
    expect(sans[2].aVerifier).toBe(true);
  });
});

describe('caisse — la ligne de vente et les litres sortis', () => {
  it('aller-retour de la référence ; entrée illisible = null', () => {
    const ref = encoderLigneVente('LOT-001', 'fut', 30);
    expect(ref).toBe('vente:LOT-001:fut:30');
    expect(decoderLigneVente(ref)).toEqual({ batchId: 'LOT-001', formatId: 'fut', litresUnite: 30 });
    expect(decoderLigneVente(encoderLigneVente(undefined, '33cl', 0.33))?.batchId).toBeUndefined();
    expect(decoderLigneVente('vente:x')).toBeNull();
    expect(decoderLigneVente(undefined)).toBeNull();
  });
  it('24 × 0,33 + 6 × 0,75 = 12,42 L ; annulée et autre brassin exclus ; fût de 30 L = 30 L', () => {
    const t = [
      recette('T1', [{ ref: 'vente:B1:33cl:0.33', qte: 24 }, { ref: 'vente:B1:75cl:0.75', qte: 6 }]),
      recette('T2', [{ ref: 'vente:B1:33cl:0.33', qte: 100 }], true),
      recette('T3', [{ ref: 'vente:B2:33cl:0.33', qte: 100 }]),
      recette('T4', [{ qte: 50 }]) // vente saisie avant la caisse : sans référence, non comptée
    ];
    expect(litresVendus(t, 'B1')).toBe(12.42);
    expect(litresVendus([recette('T5', [{ ref: 'vente:B1:fut:30', qte: 1 }])], 'B1')).toBe(30);
  });
  it('la jauge : litres notés sur les litres nets ; nets inconnus = pas de rapport ; au-delà = barre pleine, signalé', () => {
    const j = jaugeBrassin({ volumePackagedL: 27 } as Batch, 12.42);
    expect(j.nets).toBe(27);
    expect(j.ratio).toBeCloseTo(0.46, 2);
    expect(j.depasse).toBe(false);
    expect(jaugeBrassin({} as Batch, 5)).toMatchObject({ nets: null, ratio: null });
    const trop = jaugeBrassin({ volumePackagedL: 27 } as Batch, 30);
    expect(trop.ratio).toBe(1);
    expect(trop.depasse).toBe(true);
  });
});

describe('caisse — adresses et identité', () => {
  const client = (over: Partial<Client>): Client => ({ id: 'C', name: 'Café du Bourg', type: 'Pro', contact: '', phone: '', email: '', ...over });
  it('le débiteur : adresse complète = oui ; incomplète (NPA sans localité) ou absente = undefined, jamais un refus de toute la facture', () => {
    expect(debiteurDe(client({ adresse: { rue: 'Rue du Lac', numero: '5', npa: '1700', localite: 'Fribourg', pays: 'CH' } }))?.nom).toBe('Café du Bourg');
    expect(debiteurDe(client({ adresse: { rue: 'Rue du Lac', numero: '5', npa: '1700', localite: '', pays: 'CH' } }))).toBeUndefined();
    expect(debiteurDe(client({}))).toBeUndefined();
    expect(debiteurDe(client({ address: 'Rue du Lac 5, 1700 Fribourg' }))?.localite).toBe('Fribourg');
    expect(debiteurDe(null)).toBeUndefined();
  });
  it('l\'adresse de la brasserie : structurée, sinon la chaîne découpée, sinon null', () => {
    expect(adresseBrasserie({ name: 'B', address: '', npa: '', adresse: { rue: 'Rue A', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, {})?.localite).toBe('Fribourg');
    expect(adresseBrasserie({ name: 'B', address: 'Rue B 2', npa: '1630 Bulle' }, {})?.numero).toBe('2');
    expect(adresseBrasserie({ name: 'B', address: '', npa: '' }, {})).toBeNull();
  });
  it('l\'UID : CHE-123.456.789 oui ; le gabarit CHE-XXX.XXX.XXX non', () => {
    expect(uidValide('CHE-123.456.789')).toBe(true);
    expect(uidValide('CHE-XXX.XXX.XXX')).toBe(false);
    expect(uidValide('')).toBe(false);
  });
  it('companyFraiche : un champ non touché reprend le stockage, un champ touché garde sa saisie', () => {
    const initial = { name: 'A', owner: '', uid: '', address: '', npa: '', canton: '', founded: '', activity: '', communeContact: '' };
    const adresse = { rue: 'Rue A', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' };
    const frais = { ...initial, adresse, iban: 'CH93 0076 2011 6238 5295 7' };
    expect(companyFraiche(initial, { ...initial }, frais).adresse).toEqual(adresse);
    expect(companyFraiche(initial, { ...initial }, frais).iban).toBe('CH93 0076 2011 6238 5295 7');
    expect(companyFraiche(initial, { ...initial, name: 'B' }, frais).name).toBe('B');
    const touchee = { ...adresse, rue: 'Rue C' };
    expect(companyFraiche(initial, { ...initial, adresse: touchee }, frais).adresse).toEqual(touchee);
  });
});
