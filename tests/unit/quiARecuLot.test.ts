import { describe, expect, it } from 'vitest';
import type { Client, KegItem } from '../../src/types';
import { clientPropose, jourCourt, numeroDuLot, quiARecuLot } from '../../src/domain/lot/quiARecuLot';

const lot = { id: 'LOT-028', bottlingDate: '02.11.2026', packaging: undefined };
const cl = (id: string, name: string, phone = '', contact = ''): Client => ({ id, name, type: 'Pro', contact, phone, email: '' });
const clients = [cl('CL-1', 'Café du Pont', '079 412 33 05', 'Mme Rochat'), cl('CL-2', 'La Cave à Jules', ''), cl('CL-3', 'Bar Le Tilleul', '076 301 88 42')];
const fut = (id: string, p: Partial<KegItem>): KegItem => ({ id, capacityL: 20, state: 'plein', ...p });
const rempli = { date: '02.11.2026', quoi: 'rempli' as const, detail: 'Blonde d’automne LOT-028' };

describe('quiARecuLot : du lot à ses fûts, des fûts à leurs clients', () => {
  it('un fût livré est chez son client ; un fût rentré garde sa livraison ; un fût plein est en cave', () => {
    const kegs = [
      fut('F-22', { state: 'livre', batchRef: 'LOT-028', clientId: 'CL-1', clientName: 'Café du Pont', deliveryDate: '11.11.2026',
        historique: [rempli, { date: '04.11.2026', quoi: 'livre', detail: 'Café du Pont' }, { date: '09.11.2026', quoi: 'retour-vide', detail: 'Café du Pont' },
          { date: '10.11.2026', quoi: 'lave' }, { date: '10.11.2026', quoi: 'rempli', detail: 'Blonde d’automne LOT-028' }, { date: '11.11.2026', quoi: 'livre', detail: 'Café du Pont' }] }),
      fut('F-24', { state: 'livre', batchRef: 'LOT-028', clientId: 'CL-2', clientName: 'La Cave à Jules', deliveryDate: '06.11.2026', historique: [rempli, { date: '06.11.2026', quoi: 'livre', detail: 'La Cave à Jules' }] }),
      fut('F-25', { state: 'plein', batchRef: 'LOT-028', historique: [rempli] }),
      fut('F-30', { state: 'plein', batchRef: 'LOT-099' })
    ];
    const r = quiARecuLot(lot, kegs, clients);
    expect(r.enCave).toEqual(['F-25']);
    expect(r.branches.map((b) => b.nom)).toEqual(['Café du Pont', 'La Cave à Jules']);
    const pont = r.branches[0];
    expect(pont.chezLui).toBe(1);
    expect(pont.futs.map((f) => [f.id, f.etat, f.livre, f.rentre])).toEqual([['F-22', 'chez-lui', '11.11.2026', undefined], ['F-22', 'rentre', '04.11.2026', '09.11.2026']]);
    expect(pont.tel).toBe('079 412 33 05');
    expect(pont.contact).toBe('Mme Rochat');
    expect(r.branches[1].tel).toBeUndefined(); // numéro vide : jamais inventé
    expect(r.chezEux).toBe(2);
    expect(r.livres).toBe(3);
  });

  it('les livraisons d’un autre lot dans le même fût ne comptent pas', () => {
    const k = fut('F-23', { state: 'livre', batchRef: 'LOT-030', clientName: 'Bar Le Tilleul', deliveryDate: '12.11.2026',
      historique: [rempli, { date: '04.11.2026', quoi: 'livre', detail: 'Bar Le Tilleul' }, { date: '08.11.2026', quoi: 'retour-vide', detail: 'Bar Le Tilleul' },
        { date: '09.11.2026', quoi: 'lave' }, { date: '09.11.2026', quoi: 'rempli', detail: 'IPA LOT-030' }, { date: '12.11.2026', quoi: 'livre', detail: 'Bar Le Tilleul' }] });
    const r = quiARecuLot(lot, [k], clients);
    expect(r.branches).toHaveLength(1);
    expect(r.branches[0].futs).toHaveLength(1);
    expect(r.branches[0].futs[0]).toMatchObject({ etat: 'rentre', rentre: '08.11.2026' });
    expect(r.chezEux).toBe(0);
  });

  it('fût du conditionnement sans « rempli » : rattaché par packaging.kegIds et la date de conditionnement', () => {
    const l = { ...lot, packaging: { kegIds: ['F-26'] } as never };
    const k = fut('F-26', { state: 'livre', batchRef: 'LOT-028', clientName: 'Fête de Corcelles', deliveryDate: '08.11.2026',
      historique: [{ date: '01.10.2026', quoi: 'livre', detail: 'Autre bar' }, { date: '08.11.2026', quoi: 'livre', detail: 'Fête de Corcelles' }] });
    const r = quiARecuLot(l, [k], clients);
    expect(r.branches.map((b) => b.nom)).toEqual(['Fête de Corcelles']);
    expect(r.branches[0].tel).toBeUndefined();
  });

  it('un fût livré sans historique (ancien fût) reste chez son client, date non devinée', () => {
    const k = fut('F-01', { state: 'livre', batchRef: 'LOT-028', clientName: 'Bar Le Tilleul', clientId: 'CL-3' });
    const r = quiARecuLot(lot, [k], clients);
    expect(r.branches[0].futs[0]).toMatchObject({ etat: 'chez-lui', livre: undefined });
    expect(r.branches[0].derniereLivraison).toBeUndefined();
  });

  it('une livraison dont le retour est sorti de l’historique reste « retour non noté »', () => {
    const k = fut('F-02', { state: 'propre', historique: [rempli, { date: '04.11.2026', quoi: 'livre', detail: 'Bar Le Tilleul' }] });
    const r = quiARecuLot(lot, [k], clients);
    expect(r.branches[0].futs[0].etat).toBe('retour-non-note');
    expect(r.branches[0].chezLui).toBe(0);
  });

  it('lot en cuve : personne, rien en cave ; le client est proposé selon la livraison la plus récente', () => {
    expect(quiARecuLot(lot, [], clients)).toEqual({ branches: [], enCave: [], livres: 0, chezEux: 0 });
    const kegs = [
      fut('F-1', { state: 'livre', batchRef: 'LOT-028', clientName: 'Bar Le Tilleul', clientId: 'CL-3', deliveryDate: '14.11.2026', historique: [rempli, { date: '14.11.2026', quoi: 'livre', detail: 'Bar Le Tilleul' }] }),
      fut('F-2', { state: 'livre', batchRef: 'LOT-028', clientName: 'Café du Pont', clientId: 'CL-1', deliveryDate: '06.11.2026', historique: [rempli, { date: '06.11.2026', quoi: 'livre', detail: 'Café du Pont' }] })
    ];
    expect(clientPropose(quiARecuLot(lot, kegs, clients))?.nom).toBe('Bar Le Tilleul');
    expect(clientPropose(quiARecuLot(lot, [], clients))).toBeUndefined();
  });

  it('dates et numéro : jamais 0 ni date devinée', () => {
    expect(jourCourt('11.11.2026', '16.11.2026')).toBe('11 nov.');
    expect(jourCourt('11.11.2025', '16.11.2026')).toBe('11 nov. 2025');
    expect(jourCourt('2026-11-02')).toBe('2 nov.');
    expect(jourCourt('31.02.2026')).toBe('date non notée');
    expect(jourCourt(undefined)).toBe('date non notée');
    expect(numeroDuLot('LOT-014')).toBe('14');
    expect(numeroDuLot('Brassin')).toBeUndefined();
  });
});
