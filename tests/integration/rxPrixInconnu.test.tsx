// Voie RX (08.11), TE-6 : un prix inconnu n'est jamais « 0 » (nouveau tarif, article de facture). Fixtures simulées.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { InvoiceSheet } from '../../src/ui/finance/InvoiceSheet';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import type { Client } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null,
  ConfirmSheet: () => null,
}));

const client: Client = { id: 'C-1', name: 'Auberge du Lac', type: 'Pro', contact: 'Claire', phone: '', email: '' };

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
  StorageService.setUiState('clients_subtab', 'tarifs');
  StorageService.saveClients([client]);
  StorageService.saveTarifs([]);
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('TE-6 — un prix inconnu reste vide', () => {
  it('un nouveau tarif ouvre ses trois montants vides (ni « 0 » ni message d’erreur avant d’avoir touché), et l’enregistrement sans prix est refusé', () => {
    render(<ClientsTab clients={[client]} batches={[]} tarifs={[]} config={defaultConfig} onOpenQuickAction={() => {}} createRequest={{ kind: 'newTarif', at: 1 }} />);
    const feuille = screen.getByRole('dialog', { name: 'Nouveau tarif' });
    for (const id of ['tf-costIngredients', 'tf-costFixed', 'tf-priceHT']) {
      const champ = feuille.querySelector<HTMLInputElement>(`#${id}`)!;
      expect(champ.value, id).toBe('');
    }
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(feuille.querySelector<HTMLInputElement>('#tf-product')!, { target: { value: 'Bouteille 50 cl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getAllByRole('alert').map((n) => n.textContent).join(' ')).toMatch(/montant/);
    expect(StorageService.getTarifs()).toHaveLength(0);
  });
  it('un article de facture neuf montre un prix vide et un repère « — », pas « 0,00 »', () => {
    render(<InvoiceSheet client={client} config={defaultConfig} tarifs={[]} onClose={() => {}} />);
    const prix = screen.getByLabelText('Prix unitaire article 1') as HTMLInputElement;
    expect(prix.value).toBe('');
    expect(prix.placeholder).not.toMatch(/0/);
  });
});
