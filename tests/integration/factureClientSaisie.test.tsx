import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn(), generate: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...args: any[]) => state.save(...args), saveIncomeEntryInBackground: async (...args: any[]) => ({ receipt: await state.save(...args), queued: false, confirmed: true }) }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('../../src/services/swissQrBill', async importOriginal => ({ ...await importOriginal<any>(), SwissQrBillService: { generateInvoicePdf: (...args: any[]) => state.generate(...args) } }));
import { Caisse } from '../../src/ui/vente/Caisse';
import { StorageService } from '../../src/services/storage';
import { effacerBrouillon } from '../../src/ui/vente/brouillon';
import type { AppConfig, Client, PricingItem } from '../../src/types';

// Repris sur la caisse (v3a) : TE-6 prix inconnu ≠ 0, TE-7 prix négatif, article à 0 CHF, AM-67 date hors bornes. La ligne libre « Autre » porte la saisie d'un article.
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: .081 }, company: { name: 'Brasserie Test', iban: 'CH93 0076 2011 6238 5295 7', adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, brewhouses: [] } as unknown as AppConfig;
const client: Client = { id: 'c', name: 'Restaurant local', type: 'Pro', contact: '', phone: '', email: '', adresse: { rue: 'Rue du Lac', numero: '5', npa: '1700', localite: 'Fribourg', pays: 'CH' } };
const tarifs = [{ product: 'Bouteille 33 cl', priceHT: 2.5 } as PricingItem];
beforeEach(() => {
  effacerBrouillon(); state.save.mockReset(); state.generate.mockReset();
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
  vi.spyOn(StorageService, 'getClients').mockReturnValue([client]);
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'getTarifs').mockReturnValue(tarifs);
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue([]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ouvrir = () => render(<Caisse clientIdInitial="c" onClose={() => {}} />);
const autre = (designation = 'Carton') => {
  fireEvent.click(screen.getByRole('button', { name: /^Autre/ }));
  fireEvent.change(screen.getByPlaceholderText('Consigne, verres…'), { target: { value: designation } });
};

describe('Facturer un client (la caisse)', () => {
  it('le prix unitaire est vide au départ, le total reste « — »', () => {
    ouvrir(); autre();
    expect((screen.getByLabelText('Prix unitaire') as HTMLInputElement).value).toBe('');
    expect(screen.getByLabelText('Total')).toHaveTextContent('—');
  });
  it('un prix négatif ou illisible est refusé en le disant, et ne part pas', () => {
    ouvrir(); autre();
    const prix = screen.getByLabelText('Prix unitaire') as HTMLInputElement;
    fireEvent.change(prix, { target: { value: '-1' } });
    expect(prix.getAttribute('aria-invalid')).toBe('true');
    expect(prix.title).toMatch(/négative/);
    fireEvent.change(prix, { target: { value: 'abc' } });
    expect(prix.title).toMatch(/Pas un nombre/);
  });
  it('un article sans prix ou à 0 CHF ne se facture pas', () => {
    ouvrir(); autre();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
    expect(screen.getByRole('alert').textContent).toMatch(/ndique son prix/);
    fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
    expect(screen.getByRole('alert').textContent).toMatch(/ndique son prix/);
    expect(state.save).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Total')).toHaveTextContent('—');
  });
  it('une date en 2062 est refusée', () => {
    ouvrir(); autre();
    fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
    fireEvent.click(screen.getByRole('button', { name: 'Date de la facture' }));
    fireEvent.change(screen.getByLabelText('Choisir la date'), { target: { value: '2062-11-08' } });
    expect(screen.getByRole('alert').textContent).toMatch(/plus d’un an/);
    expect(screen.getByRole('button', { name: /^Facturer/ })).toBeDisabled();
    expect(state.generate).not.toHaveBeenCalled();
  });
  it('le tarif reconnu s’affiche sur sa tuile avec son prix', () => {
    ouvrir();
    expect(screen.getByRole('button', { name: /^33 cl/ })).toHaveTextContent('2,50');
  });
});
