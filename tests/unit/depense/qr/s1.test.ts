// parseSwicoS1 : information de facturation Swico S1.
import { describe, expect, it } from 'vitest';
import { parseSwicoS1 } from '../../../../src/services/qrFacture';
import { S1_EXEMPLE } from './aide';

describe('parseSwicoS1', () => {
  it('exemple complet : numéro, date, client, IDE, prestation, TVA, conditions', () => {
    expect(parseSwicoS1(S1_EXEMPLE)).toEqual({
      numero: '10201409',
      date: { debut: '2019-05-12', fin: null, brut: '190512' },
      referenceClient: '1400.000-53',
      ide: '106017086',
      prestation: { debut: '2018-05-08', fin: null, brut: '180508' },
      tva: [{ taux: 7.7, montant: null }],
      tva33: [],
      conditions: [{ escomptePct: 2, jours: 10 }, { escomptePct: 0, jours: 30 }],
      inconnus: {},
    });
  });

  it('barre oblique échappée \\/ dans le numéro, antislash échappé', () => {
    const s1 = parseSwicoS1('//S1/10/FA\\/2026\\/0417/11/261031/20/a\\\\b')!;
    expect(s1.numero).toBe('FA/2026/0417');
    expect(s1.date?.debut).toBe('2026-10-31');
    expect(s1.referenceClient).toBe('a\\b');
  });

  it('/11/ en période AAMMJJAAMMJJ : début et fin', () => {
    const s1 = parseSwicoS1('//S1/10/77/11/260101260331')!;
    expect(s1.date).toEqual({ debut: '2026-01-01', fin: '2026-03-31', brut: '260101260331' });
  });

  it('/32/ à deux taux avec montants, et un taux seul décimal', () => {
    expect(parseSwicoS1('//S1/10/1/32/8.1:100.00;2.6:50.50')!.tva).toEqual([{ taux: 8.1, montant: 100 }, { taux: 2.6, montant: 50.5 }]);
    expect(parseSwicoS1('//S1/10/1/32/8.1')!.tva).toEqual([{ taux: 8.1, montant: null }]);
  });

  it('codes inconnus gardés bruts, dates impossibles sans debut inventé', () => {
    const s1 = parseSwicoS1('//S1/10/1/99/xyz/11/261340')!;
    expect(s1.inconnus).toEqual({ '99': 'xyz' });
    expect(s1.date).toEqual({ debut: null, fin: null, brut: '261340' });
  });

  it('champs absents : null ou vide, jamais 0', () => {
    const s1 = parseSwicoS1('//S1/10/1')!;
    expect(s1).toMatchObject({ numero: '1', date: null, referenceClient: null, ide: null, prestation: null, tva: [], conditions: [] });
  });

  it('ce qui n\'est pas du S1 rend null', () => {
    expect(parseSwicoS1('')).toBeNull();
    expect(parseSwicoS1('Facture 12')).toBeNull();
    expect(parseSwicoS1('/S1/10/1')).toBeNull();
    expect(parseSwicoS1('//S2/10/1')).toBeNull();
  });
});
