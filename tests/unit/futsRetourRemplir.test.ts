import { describe, expect, it } from 'vitest';
import type { KegItem } from '../../src/types';
import { futsDuClient, futsQuiTiennent, libelleRetourTous, phraseALaver, retourVide } from '../../src/domain/stock/futsFiche';

const fut = (id: string, state: KegItem['state'], extra: Partial<KegItem> = {}): KegItem => ({ id, capacityL: 20, state, ...extra } as KegItem);
const chez = (id: string, clientId?: string, clientName = 'ZZ TEST La Cigogne') => fut(id, 'livre', { clientId, clientName, batchRef: 'LOT-PA', beerName: 'ZZ TEST Pale Ale' });

describe('N4 : ses fûts reviennent tous du client', () => {
  it('rend ce fût d\'abord, puis les autres fûts livrés au même client, par numéro', () => {
    const parc = [chez('F-010', 'CL-C'), chez('F-004', 'CL-C'), chez('F-009', 'CL-C'), chez('F-011', 'CL-AUTRE', 'Autre'), fut('F-012', 'plein', { clientId: 'CL-C' })];
    expect(futsDuClient(parc[1], parc).map((k) => k.id)).toEqual(['F-004', 'F-009', 'F-010']);
  });
  it('sans client connu, le nom fait foi (accents et casse ignorés) ; un nom vide ne relie rien', () => {
    const parc = [chez('F-1', undefined, 'Café du Pont'), chez('F-2', undefined, 'cafe du pont'), chez('F-3', undefined, ''), chez('F-4', undefined, '')];
    expect(futsDuClient(parc[0], parc).map((k) => k.id)).toEqual(['F-1', 'F-2']);
    expect(futsDuClient(parc[2], parc).map((k) => k.id)).toEqual(['F-3']);
  });
  it('un fût qui n\'est pas livré reste seul', () => {
    expect(futsDuClient(fut('F-1', 'plein'), [fut('F-1', 'plein'), chez('F-2', 'CL-C')]).map((k) => k.id)).toEqual(['F-1']);
  });
  it('le libellé suit le nombre de fûts cochés', () => {
    expect(libelleRetourTous(3)).toBe('Ses 3 fûts sont revenus');
    expect(libelleRetourTous(1, 'F-009')).toBe('Retour vide · F-009');
    expect(libelleRetourTous(0)).toBe('Aucun fût coché');
  });
  it('chaque fût rentré passe à laver, sans client ni bière, daté du jour', () => {
    const k = retourVide(chez('F-004', 'CL-C'), '21.11.2026');
    expect(k).toMatchObject({ state: 'lavage' });
    expect(k.clientId).toBeUndefined();
    expect(k.batchRef).toBeUndefined();
    expect(k.historique?.at(-1)).toMatchObject({ quoi: 'retour-vide', date: '21.11.2026' });
  });
});

describe('K7 : les fûts qui tiennent le volume, lavage compris', () => {
  it('96 L, 2 propres et 2 à laver de 20 L : les quatre, dont 2 à laver', () => {
    const p = futsQuiTiennent(96, [fut('F-005', 'propre'), fut('F-006', 'propre'), fut('F-007', 'lavage'), fut('F-008', 'lavage'), fut('F-001', 'plein')]);
    expect(p.futs.map((k) => k.id)).toEqual(['F-005', 'F-006', 'F-007', 'F-008']);
    expect(p.aLaver.map((k) => k.id)).toEqual(['F-007', 'F-008']);
    expect(p.litres).toBe(80);
    expect(p.manque).toBe(16);
    expect(phraseALaver(p.aLaver.length)).toBe('2 à laver · marquer propres');
  });
  it('les propres suffisent : aucun fût à laver proposé', () => {
    const p = futsQuiTiennent(35, [fut('F-1', 'propre'), fut('F-2', 'propre'), fut('F-3', 'propre'), fut('F-4', 'lavage')]);
    expect(p.futs).toHaveLength(2);
    expect(p.aLaver).toHaveLength(0);
  });
  it('le dernier fût est le plus petit qui couvre le reste (un seul fût en partie vide)', () => {
    const p = futsQuiTiennent(45, [fut('G-50', 'propre', { capacityL: 50 }), fut('P-30', 'propre', { capacityL: 30 }), fut('P-20', 'propre', { capacityL: 20 })]);
    expect(p.futs.map((k) => k.id)).toEqual(['G-50']);
    const q = futsQuiTiennent(60, [fut('G-50', 'propre', { capacityL: 50 }), fut('P-30', 'propre', { capacityL: 30 }), fut('P-20', 'propre', { capacityL: 20 })]);
    expect(q.futs.map((k) => k.id)).toEqual(['G-50', 'P-20']);
  });
  it('volume inconnu ou nul : rien proposé (jamais 0 L inventé)', () => {
    expect(futsQuiTiennent(undefined, [fut('F-1', 'propre')]).futs).toHaveLength(0);
    expect(futsQuiTiennent(0, [fut('F-1', 'propre')]).futs).toHaveLength(0);
  });
  it('un fût archivé n\'est jamais proposé', () => {
    expect(futsQuiTiennent(40, [fut('F-1', 'propre', { archivedAt: '2026-11-01' } as Partial<KegItem>), fut('F-2', 'lavage')]).futs.map((k) => k.id)).toEqual(['F-2']);
  });
});
