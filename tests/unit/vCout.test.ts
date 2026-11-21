import { describe, expect, it } from 'vitest';
import { pointBasAVenir, type ForecastItem } from '../../src/domain/finance/forecast';
import { margePar33cl } from '../../src/domain/finance/prixDuStock';
import { vueHorizon } from '../../src/domain/stock/horizon';
import type { Batch } from '../../src/types';

const item = (id: string, date: string, amountCents: number, direction: 'in' | 'out', extra: Partial<ForecastItem> = {}): ForecastItem =>
  ({ id, date, label: id, amountCents, direction, source: 'plan', category: 'divers', ...extra });

describe('K4 : point le plus bas à venir, sur les sorties de Finances', () => {
  const items = [item('malt', '2026-11-26', 42000, 'out'), item('vente', '2026-12-01', 28000, 'in'), item('hotte', '2026-12-09', 90000, 'out')];
  it('600 − 420 + 280 − 900 : −440 le 09.12', () => {
    expect(pointBasAVenir({ items, cashComplete: true, openingCashCents: 60000 }, '2026-11-21', '2027-02-18')).toEqual({ date: '2026-12-09', soldeCents: -44000, estime: false, partiel: false });
  });
  it('solde inconnu ou incomplet : null, jamais 0', () => {
    expect(pointBasAVenir({ items, cashComplete: false, openingCashCents: 60000 }, '2026-11-21', '2027-02-18')).toBeNull();
    expect(pointBasAVenir({ items, cashComplete: true, openingCashCents: null }, '2026-11-21', '2027-02-18')).toBeNull();
  });
  it('au-delà de la fin : ignoré ; rien ne baisse : aujourd’hui', () => {
    expect(pointBasAVenir({ items, cashComplete: true, openingCashCents: 60000 }, '2026-11-21', '2026-11-25')).toMatchObject({ date: '2026-11-21', soldeCents: 60000 });
  });
  it('un même jour fait une seule marche ; brassin estimé et part sans montant marqués', () => {
    const r = pointBasAVenir({ items: [item('in', '2026-11-25', 50000, 'in'), item('out', '2026-11-25', 70000, 'out', { source: 'brew' }), item('emb', '2026-12-20', 0, 'out', { source: 'brew', partial: ['emballage'] })], cashComplete: true, openingCashCents: 30000 }, '2026-11-21', '2027-02-18');
    expect(r).toEqual({ date: '2026-11-25', soldeCents: 10000, estime: true, partiel: true });
  });
});

describe('N6 : marge par 33 cl', () => {
  it('coût du litre × 0,33, prix HT − coût', () => expect(margePar33cl({ litreComplet: 7.51, prixHT: 4.8 })).toEqual({ prixHT: 4.8, cout: 2.48, marge: 2.32 }));
  it('litre ou tarif inconnu : marge null, jamais 0', () => {
    expect(margePar33cl({ litreComplet: null, prixHT: 4.8 }).marge).toBeNull();
    expect(margePar33cl({ litreComplet: 7.51, prixHT: undefined })).toEqual({ prixHT: null, cout: 2.48, marge: null });
  });
});

describe('K3 : Courses date le manque d’un brassin planifié à la date suisse', () => {
  it('« 30.11.2026 » date le besoin : compté avant le prochain brassin', () => {
    const b = { id: 'B', name: 'ZZ TEST Brune', status: 'planifie', plannedBrewDate: '30.11.2026', brewDate: '' } as unknown as Batch;
    const a = { item: { name: 'ZZ TEST Caramünch Typ 2', unit: 'kg' }, missing: 2.4, rupture: true, sources: [{ genre: 'brassin', nom: 'ZZ TEST Brune', date: '30.11.2026' }] } as never;
    const v = vueHorizon([a], [b], '2026-11-21');
    expect(v.brassin?.nom).toBe('ZZ TEST Brune');
    expect(v.comptes.brassin).toBe(1);
  });
});
