import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';
import type { Batch, Client, KegItem } from '../../src/types';

const batch: Batch = {
  id: 'LOT-028', name: 'Blonde d’automne', style: 'Blonde', volumeL: 100, status: 'conditionne', brewDate: '12.10.2026', bottlingDate: '02.11.2026',
  packaging: { bottles33: 48, bottles75: 0, kegIds: ['F-22', 'F-24', 'F-27'] }
};
const clients: Client[] = [
  { id: 'CL-1', name: 'Café du Pont', type: 'Pro', contact: 'Mme Rochat', phone: '079 412 33 05', email: '' },
  { id: 'CL-2', name: 'La Cave à Jules', type: 'Pro', contact: 'Jules Perret', phone: '', email: '' },
  { id: 'CL-9', name: 'Bar du Lac', type: 'Pro', contact: '', phone: '076 000 00 00', email: '' }
];
const rempli = { date: '02.11.2026', quoi: 'rempli' as const, detail: 'Blonde d’automne LOT-028' };
let kegs: KegItem[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 16, 12));
  kegs = [
    { id: 'F-22', capacityL: 20, state: 'livre', batchRef: 'LOT-028', clientId: 'CL-1', clientName: 'Café du Pont', deliveryDate: '11.11.2026',
      historique: [rempli, { date: '04.11.2026', quoi: 'livre', detail: 'Café du Pont' }, { date: '09.11.2026', quoi: 'retour-vide', detail: 'Café du Pont' },
        { date: '10.11.2026', quoi: 'lave' }, { ...rempli, date: '10.11.2026' }, { date: '11.11.2026', quoi: 'livre', detail: 'Café du Pont' }] },
    { id: 'F-24', capacityL: 20, state: 'livre', batchRef: 'LOT-028', clientId: 'CL-2', clientName: 'La Cave à Jules', deliveryDate: '06.11.2026',
      historique: [rempli, { date: '06.11.2026', quoi: 'livre', detail: 'La Cave à Jules' }] },
    { id: 'F-27', capacityL: 20, state: 'plein', batchRef: 'LOT-028', historique: [rempli] }
  ];
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], equipment: [], kegs } as never));
  vi.spyOn(StorageService, 'getClients').mockImplementation(() => clients);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
  vi.spyOn(StorageService, 'subscribe').mockImplementation(() => () => {});
  vi.spyOn(StorageService, 'updateKeg').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const ouvrir = (b: Batch = batch) => render(<BatchDetailSheet batch={b} onClose={vi.fn()} />);

describe('Qui a reçu ce lot — maquette lot/v1, dans la fiche du brassin', () => {
  it('dit combien de clients l’ont reçu et combien de fûts sont encore chez eux', () => {
    ouvrir();
    const s = screen.getByRole('region', { name: 'Qui a reçu ce lot' });
    expect(s).toHaveTextContent('2 clients l’ont reçu · 2 fûts encore chez eux');
    expect(within(s).getByText('Café du Pont')).toBeInTheDocument();
    expect(within(s).getByText('Encore en cave')).toBeInTheDocument();
  });

  it('une branche s’ouvre sur place : Appeler avec le numéro de la fiche, ou le dire quand il manque', () => {
    ouvrir();
    const s = screen.getByRole('region', { name: 'Qui a reçu ce lot' });
    fireEvent.click(within(s).getByRole('button', { name: /Café du Pont/ }));
    const appel = within(s).getByRole('link', { name: /Appeler/ });
    expect(appel).toHaveAttribute('href', 'tel:0794123305');
    expect(s).toHaveTextContent('Mme Rochat');
    expect(s).toHaveTextContent('F-22');
    expect(s).toHaveTextContent('rentré le 9 nov.');
    fireEvent.click(within(s).getByRole('button', { name: /La Cave à Jules/ }));
    expect(within(s).queryByRole('link', { name: /Appeler/ })).toBeNull();
    expect(s).toHaveTextContent('Aucun numéro sur sa fiche client.');
  });

  it('« Livrer » : le client le plus récent est proposé, la livraison s’écrit et s’annule', () => {
    ouvrir();
    const s = screen.getByRole('region', { name: 'Qui a reçu ce lot' });
    fireEvent.click(within(s).getByRole('button', { name: /Encore en cave/ }));
    expect(screen.getByText('Livrer F-27')).toBeInTheDocument();
    const proposé = screen.getByRole('button', { name: /Café du Pont.*proposé/ });
    fireEvent.click(proposé);
    const [ecrit] = vi.mocked(StorageService.updateKeg).mock.calls[0];
    expect(ecrit).toMatchObject({ id: 'F-27', state: 'livre', clientId: 'CL-1', clientName: 'Café du Pont', deliveryDate: '16.11.2026' });
    expect(within(screen.getByRole('region', { name: 'Qui a reçu ce lot' })).getByRole('status')).toHaveTextContent('F-27 livré à Café du Pont');
    fireEvent.click(within(screen.getByRole('region', { name: 'Qui a reçu ce lot' })).getByRole('button', { name: 'Annuler' }));
    expect(vi.mocked(StorageService.updateKeg).mock.calls[1][0]).toEqual(kegs[2]);
  });

  it('« Rentrer un fût » depuis le menu Plus : le fût revient vide, à laver ; rien n’est écrit tant qu’on ne choisit pas', () => {
    ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rentrer un fût' }));
    expect(screen.getByText('lequel revient ?', { exact: false })).toBeInTheDocument();
    expect(StorageService.updateKeg).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /F-24.*La Cave à Jules/ }));
    expect(vi.mocked(StorageService.updateKeg).mock.calls[0][0]).toMatchObject({ id: 'F-24', state: 'lavage' });
    expect(within(screen.getByRole('region', { name: 'Qui a reçu ce lot' })).getByRole('status')).toHaveTextContent('F-24 rentré de chez La Cave à Jules');
  });

  it('lot jamais sorti : « Personne pour l’instant », rien d’inventé', () => {
    kegs = [{ id: 'F-27', capacityL: 20, state: 'plein', batchRef: 'LOT-028', historique: [rempli] }];
    ouvrir();
    const s = screen.getByRole('region', { name: 'Qui a reçu ce lot' });
    expect(s).toHaveTextContent('Personne pour l’instant');
    expect(s).toHaveTextContent('Aucun fût livré.');
    expect(s).toHaveTextContent('F-27');
  });
});
