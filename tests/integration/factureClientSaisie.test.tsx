import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn(), generate: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...args: any[]) => state.save(...args) }));
vi.mock('../../src/ui/finance/DriveConnection', () => ({ DriveConnection: () => <p>Drive privé</p> }));
vi.mock('../../src/services/swissQrBill', async importOriginal => ({ ...await importOriginal<any>(), SwissQrBillService: { generateInvoicePdf: (...args: any[]) => state.generate(...args) } }));
import { InvoiceSheet } from '../../src/ui/finance/InvoiceSheet';
import type { AppConfig, Client } from '../../src/types';

// TE-6 : « Prix unitaire » valait « 0 » au départ. TE-7 : « −1 » devenait 0 sans un mot. AM-67 : article à 0 CHF, date sans borne.
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: .081 }, brewhouses: [] } as unknown as AppConfig;
const client = { id: 'c', name: 'Restaurant local' } as Client;
beforeEach(() => { state.save.mockReset(); state.generate.mockReset(); });
afterEach(() => cleanup());

const ouvrir = () => render(<InvoiceSheet client={client} config={config} tarifs={[{ product: 'Pale Ale 33 cl', priceHT: 2.5 } as any]} onClose={() => {}} />);
const remplir = (date: string, echeance: string) => {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
  fireEvent.change(screen.getByLabelText('Échéance'), { target: { value: echeance } });
  fireEvent.change(screen.getByLabelText('Désignation'), { target: { value: 'Carton' } });
};

describe('Facturer un client', () => {
  it('le prix unitaire est vide au départ, le total reste « À compléter »', () => {
    ouvrir();
    expect((screen.getByLabelText('Prix unitaire article 1') as HTMLInputElement).value).toBe('');
    expect(screen.getByText('À compléter')).toBeTruthy();
  });
  it('un prix négatif ou illisible est refusé en le disant, et ne part pas', () => {
    ouvrir();
    const prix = screen.getByLabelText('Prix unitaire article 1') as HTMLInputElement;
    fireEvent.change(prix, { target: { value: '-1' } });
    expect(prix.getAttribute('aria-invalid')).toBe('true');
    expect(prix.title).toMatch(/négative/);
    fireEvent.change(prix, { target: { value: 'abc' } });
    expect(prix.title).toMatch(/Pas un nombre/);
  });
  it('un article sans prix ou à 0 CHF ne se facture pas', () => {
    ouvrir();
    remplir('2026-11-08', '2026-12-08');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et télécharger' }));
    expect(screen.getByRole('alert').textContent).toMatch(/Article 1 : indique son prix/);
    fireEvent.change(screen.getByLabelText('Prix unitaire article 1'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et télécharger' }));
    expect(screen.getByRole('alert').textContent).toMatch(/Article 1 : indique son prix/);
    expect(state.save).not.toHaveBeenCalled();
  });
  it('une date en 2062 est refusée', () => {
    ouvrir();
    remplir('2062-11-08', '2062-12-08');
    fireEvent.change(screen.getByLabelText('Prix unitaire article 1'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et télécharger' }));
    expect(screen.getByRole('alert').textContent).toMatch(/plus d’un an/);
    expect(state.generate).not.toHaveBeenCalled();
  });
  it('le produit choisi reste affiché dans la liste', () => {
    ouvrir();
    const liste = screen.getByLabelText('Produit') as HTMLSelectElement;
    fireEvent.change(liste, { target: { value: 'Pale Ale 33 cl' } });
    expect(liste.value).toBe('Pale Ale 33 cl');
    expect((screen.getByLabelText('Prix unitaire article 1') as HTMLInputElement).value).toBe('2,5');
  });
});
