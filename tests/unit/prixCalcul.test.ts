import { describe, expect, it } from 'vitest';
import { brassinEnUnites, formatDuTarif, lirePrix, resteAnnuel, seuilsRegle, tarifsDuFormat, unitesParAn, zoneDe } from '../../src/ui/prix/calculPrix';
import type { PricingItem } from '../../src/types';

/**
 * Fixture de c3a (d1) : 202,77 = 22,41 + 64,26 + 116,10 ; 27 L nets ; emballage 24,00 ; impôt 6,84 ; litre liquide exact (202,77 − 24,00 − 6,84) ÷ 27.
 * Impôt de l'unité à 12 °P, 25,32 CHF/hl : 0,33 L → 0,083556 ; 0,75 L → 0,1899 ; 20 L → 5,064. Toutes les valeurs attendues sont calculées à la main.
 */
const LITRE = (202.77 - 24 - 6.84) / 27;
const IMPOT = { '33cl': 0.0033 * 25.32, '75cl': 0.0075 * 25.32, fut: 0.2 * 25.32 };

describe('calculPrix : la chaîne du litre au reste (c7c)', () => {
  it('33 cl, emballage saisi 0,30 : coût 2,48, reste 2,52, 50 % du prix', () => {
    const l = lirePrix({ litreLiquide: LITRE, volumeL: 0.33, emballageUnite: 0.30, impotUnite: IMPOT['33cl'], prixHT: 5 });
    expect(l.cout).toEqual({ exact: true, affiche: 2.48 });
    expect(l.reste).toEqual({ valeur: 2.52, borne: false });
    expect(l.partPrix).toBe(50);
    expect(l.zone).toBe('ok');
  });
  it('emballage vide : le coût est un plancher (≥ 2,18), le reste un plafond (≤ 2,82), jamais exact', () => {
    const l = lirePrix({ litreLiquide: LITRE, volumeL: 0.33, emballageUnite: null, impotUnite: IMPOT['33cl'], prixHT: 5 });
    expect(l.cout).toEqual({ exact: false, affiche: 2.18 });
    expect(l.reste).toEqual({ valeur: 2.82, borne: true });
    expect(l.zone).toBe('inconnu');
  });
  it('tuiles ≤ : 75 cl 5,03 et fût 27,58 (le litre n\'est jamais arrondi avant de multiplier : 27,54 de la maquette est écarté)', () => {
    const t75 = lirePrix({ litreLiquide: LITRE, volumeL: 0.75, emballageUnite: null, impotUnite: IMPOT['75cl'], prixHT: 10 });
    const fut = lirePrix({ litreLiquide: LITRE, volumeL: 20, emballageUnite: null, impotUnite: IMPOT.fut, prixHT: 160 });
    expect(t75.reste).toEqual({ valeur: 5.03, borne: true });
    expect(fut.reste).toEqual({ valeur: 27.58, borne: true });
  });
  it('par an : 3 636 unités ; 9 162,72 ; 75 cl 8 048,00 ; fût 1 654,80 ; volume inconnu → null, jamais 0', () => {
    expect(unitesParAn(1200, 0.33)).toBe(3636);
    expect(unitesParAn(1200, 0.75)).toBe(1600);
    expect(unitesParAn(1200, 20)).toBe(60);
    expect(resteAnnuel(2.52, 3636)).toBe(9162.72);
    expect(resteAnnuel(5.03, 1600)).toBe(8048);
    expect(resteAnnuel(27.58, 60)).toBe(1654.8);
    expect(resteAnnuel(0.1, 3636)).toBe(363.6);
    expect(unitesParAn(undefined, 0.33)).toBeNull();
    expect(unitesParAn(0, 0.33)).toBeNull();
  });
  it('le reste se soustrait au coût AFFICHÉ : coût exact 2,485 → 2,49 → reste 2,51 (pas 2,52) ; la part se lit sur le reste affiché', () => {
    const l = lirePrix({ litreLiquide: 4.97, volumeL: 0.5, emballageUnite: 0, impotUnite: 0, prixHT: 5 });
    expect(l.cout.affiche).toBe(2.49);
    expect(l.reste?.valeur).toBe(2.51);
    expect(l.partPrix).toBe(50);
  });
  it('zones : à perte sous le coût, mince sous coût ÷ (1 − ⅓), sinon ok ; seuils 2,48 et 3,72', () => {
    const s = seuilsRegle(2.48);
    expect(s).toEqual({ perte: 2.48, mince: 3.72 });
    expect(zoneDe(2.3, s)).toBe('perte');
    expect(zoneDe(3, s)).toBe('mince');
    expect(zoneDe(5, s)).toBe('ok');
    const perte = lirePrix({ litreLiquide: LITRE, volumeL: 0.33, emballageUnite: 0.3, impotUnite: IMPOT['33cl'], prixHT: 2.3 });
    expect(perte.zone).toBe('perte');
    expect(perte.reste?.valeur).toBe(-0.18);
  });
  it('inconnus : coût du litre null → rien d\'exact, aucun 0 ; prix absent → pas de reste mais le coût reste lu', () => {
    const sans = lirePrix({ litreLiquide: null, volumeL: 0.33, emballageUnite: 0.3, impotUnite: IMPOT['33cl'], prixHT: 5 });
    expect(sans.cout).toBeNull(); expect(sans.reste).toBeNull(); expect(sans.partPrix).toBeNull(); expect(sans.zone).toBe('inconnu');
    const sansImpot = lirePrix({ litreLiquide: LITRE, volumeL: 0.33, emballageUnite: 0.3, impotUnite: null, prixHT: 5 });
    expect(sansImpot.cout).toBeNull();
    const sansPrix = lirePrix({ litreLiquide: LITRE, volumeL: 0.33, emballageUnite: 0.3, impotUnite: IMPOT['33cl'], prixHT: null });
    expect(sansPrix.cout).toEqual({ exact: true, affiche: 2.48 }); expect(sansPrix.reste).toBeNull(); expect(sansPrix.zone).toBe('inconnu');
  });
  it('le brassin : 81 bouteilles, 41 paient (⌈202,77 ÷ 5⌉), 40 pour toi, vendu 405,00, reste 202,23 (405,00 − 202,77)', () => {
    const b = brassinEnUnites({ coutBrassin: 202.77, prixHT: 5, litresNets: 27, volumeL: 0.33 });
    expect(b).toEqual({ n: 81, paient: 41, pourToi: 40, vendu: 405, resteBrassin: 202.23, estime: true, couvert: true });
    expect(brassinEnUnites({ coutBrassin: 202.77, prixHT: 5, litresNets: 27, volumeL: 0.33, unitesReelles: 81 })?.estime).toBe(false);
    expect(brassinEnUnites({ coutBrassin: 202.77, prixHT: 1, litresNets: 27, volumeL: 0.33 })?.couvert).toBe(false);
    expect(brassinEnUnites({ coutBrassin: 202.77, prixHT: null, litresNets: 27, volumeL: 0.33 })).toBeNull();
    expect(brassinEnUnites({ coutBrassin: 202.77, prixHT: 5, litresNets: null, volumeL: 0.33 })).toBeNull();
  });
});

describe('calculPrix : le format et le tarif d\'un format', () => {
  const t = (over: Partial<PricingItem>): PricingItem => ({ product: 'x', priceHT: 5, ...over });
  it('formatDuTarif : le champ l\'emporte sur le libellé ; sinon le libellé ; sinon null', () => {
    expect(formatDuTarif(t({ product: 'Ma blonde', format: { id: '33cl', volumeL: 0.33 } }))).toBe('33cl');
    expect(formatDuTarif(t({ product: 'Pale Ale 75 cl' }))).toBe('75cl');
    expect(formatDuTarif(t({ product: 'Bouteille consignée' }))).toBeNull();
  });
  it('tarifsDuFormat : un, aucun, plusieurs, sans prix', () => {
    const pale = t({ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 } });
    expect(tarifsDuFormat([pale], '33cl', 'Pale Ale')).toMatchObject({ kind: 'un', tarif: pale });
    expect(tarifsDuFormat([pale], '75cl', 'Pale Ale').kind).toBe('aucun');
    expect(tarifsDuFormat([pale], '33cl', 'Stout').kind).toBe('aucun');
    expect(tarifsDuFormat([pale, { ...pale, product: 'Pale Ale 33 cl bis' }], '33cl', 'Pale Ale').kind).toBe('plusieurs');
    expect(tarifsDuFormat([{ ...pale, priceHT: 0 }], '33cl', 'Pale Ale').kind).toBe('sans-prix');
  });
  it('un ancien tarif « Bouteille 33 cl », sans bière : lisible pour toute bière, et signalé à compléter', () => {
    const ancien = t({ product: 'Bouteille 33 cl', priceHT: 2.5 });
    const r = tarifsDuFormat([ancien], '33cl', 'Pale Ale');
    expect(r.kind).toBe('un'); expect(r.aCompleter).toBe(true);
    expect(tarifsDuFormat([ancien], '75cl', 'Pale Ale').kind).toBe('aucun');
  });
  it('« Pale Ale » retrouve le tarif d\'un lot « Pale Ale d\'octobre » (le nom du lot n\'est pas la bière)', () => {
    const pale = t({ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 } });
    expect(tarifsDuFormat([pale], '33cl', 'Pale Ale').kind).toBe('un');
  });
});
