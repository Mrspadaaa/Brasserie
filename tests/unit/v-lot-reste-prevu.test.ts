// V-LOT (D393 B1, D396 E2, PI-4) : reste à vendre de la carte du brassin, densité « prévue » lue sur la courbe du lot, « Mesurer » sur la carte.
import { describe, expect, it } from 'vitest';
import type { Batch, KegItem, Transaction } from '../../src/types';
import { resteAVendre, unitesVendues } from '../../src/ui/vente/brassinsVendables';
import { encoderLigneVente } from '../../src/ui/vente/ligneVente';
import { densitePrevue } from '../../src/domain/fermentation/prevision';
import { carteModel } from '../../src/ui/production/liste/listeModel';
import { demanderMesure, prendreMesureDemandee } from '../../src/ui/production/liste/mesureDemandee';
import type { CatalogEntry } from '../../src/domain/productionCatalog';

const lot = { id: 'LOT-PA', name: 'ZZ TEST Pale Ale', status: 'conditionne', packaging: { bottles33: 120, bottles75: 0, kegIds: ['F-001', 'F-002', 'F-004'] } } as unknown as Batch;
const fut = (id: string, state: KegItem['state']): KegItem => ({ id, capacityL: 20, state, batchRef: 'LOT-PA' });
const kegs = [fut('F-001', 'plein'), fut('F-002', 'plein'), fut('F-004', 'livre')];
const vente = (q: number, format = '33cl', litres = 0.33, voided = false): Transaction => ({
  id: `T-${q}-${format}`, finance: { kind: 'income', ...(voided ? { voidedAt: '2026-11-20' } : {}), lines: [{ quantity: q, sourceReference: encoderLigneVente('LOT-PA', format, litres) }] }
} as unknown as Transaction);

describe('B1 : reste à vendre', () => {
  it('conditionné moins vendu ; fûts pleins du stock (un fût livré ne compte plus)', () => {
    expect(resteAVendre(lot, [], kegs)?.texte).toBe('120 × 33 cl · 2 fûts');
    expect(resteAVendre(lot, [vente(6)], kegs)?.texte).toBe('114 × 33 cl · 2 fûts');
  });
  it('une vente annulée ne baisse rien ; les formats se comptent à part', () => {
    expect(unitesVendues([vente(6, '33cl', 0.33, true), vente(1, 'fut', 20)], 'LOT-PA')).toEqual({ fut: 1 });
  });
  it('sans fûts connus du stock : fûts du conditionnement moins les fûts vendus', () => {
    expect(resteAVendre(lot, [vente(1, 'fut', 20)], [])?.futs).toBe(2);
  });
  it('tout vendu se dit, un format épuisé se tait', () => {
    expect(resteAVendre(lot, [vente(120)], kegs)?.texte).toBe('2 fûts');
    const r = resteAVendre(lot, [vente(120)], kegs.map((k) => ({ ...k, state: 'livre' as const })));
    expect(r?.vide).toBe(true);
    expect(r?.texte).toBe('tout vendu');
  });
  it('sans conditionnement en unités : pas de reste (jamais un chiffre inventé)', () => {
    expect(resteAVendre({ ...lot, packaging: undefined } as Batch, [], kegs)).toBeNull();
  });
  it('la carte lit le reste à la place du conditionné, et le toucher est permis', () => {
    const e = { id: 'LOT-PA', name: 'ZZ TEST Pale Ale', style: 'Pale Ale', batch: lot, favorite: false } as unknown as CatalogEntry;
    const m = carteModel(e, Date.now(), kegs, [vente(6)]);
    expect(m.cleUnite).toBe('114 × 33 cl · 2 fûts');
    expect(m.reste).toEqual({ texte: '114 × 33 cl · 2 fûts', vendable: true });
    expect(carteModel(e, Date.now(), kegs).reste).toBeUndefined();
  });
});

describe('E2 : densité prévue sur la courbe du lot', () => {
  const base = { nbJours: 14, fg: [1.010, 1.012] as [number, number] };
  it('sur la courbe entre le dernier relevé et la bande, arrondie au millième', () => {
    const p = densitePrevue({ ...base, n: 6, dernier: { jour: 5, sg: 1.030 } })!;
    expect(p).toBeLessThan(1.030);
    expect(p).toBeGreaterThanOrEqual(1.012);
    expect(Math.round(p * 1000)).toBe(p * 1000);
  });
  it('après l’arrivée de la courbe : le haut de la bande FG', () => {
    expect(densitePrevue({ ...base, n: 12, dernier: { jour: 5, sg: 1.022 } })).toBe(1.012);
  });
  it('sans FG visée, sans relevé, déjà dans la bande ou relevé du jour : pas de prévu', () => {
    expect(densitePrevue({ ...base, fg: null, n: 8, dernier: { jour: 5, sg: 1.022 } })).toBeNull();
    expect(densitePrevue({ ...base, n: 8, dernier: null })).toBeNull();
    expect(densitePrevue({ ...base, n: 8, dernier: { jour: 5, sg: 1.011 } })).toBeNull();
    expect(densitePrevue({ ...base, n: 5, dernier: { jour: 5, sg: 1.022 } })).toBeNull();
    expect(densitePrevue({ ...base, n: 3, dernier: { jour: 0, sg: 1.050, og: true } })).toBeNull();
  });
});

describe('PI-4 : « Mesurer » depuis la carte', () => {
  it('la demande se prend une fois', () => {
    demanderMesure('B-ZZ-FERM');
    expect(prendreMesureDemandee()).toBe(true);
    expect(prendreMesureDemandee()).toBe(false);
  });
});
