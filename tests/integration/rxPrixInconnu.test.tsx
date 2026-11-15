// Voie RX (08.11), TE-6 : un prix inconnu n'est jamais « 0 » (nouveau tarif, article de facture). Fixtures simulées.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { Caisse } from '../../src/ui/vente/Caisse';
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
  it('un nouveau tarif ouvre ses montants vides (ni « 0 » ni message d’erreur avant d’avoir touché), et l’enregistrement sans prix est refusé', () => {
    render(<ClientsTab clients={[client]} batches={[]} tarifs={[]} config={defaultConfig} onOpenQuickAction={() => {}} createRequest={{ kind: 'newTarif', at: 1 }} />);
    const feuille = screen.getByRole('dialog', { name: 'Fixer le prix' });
    for (const id of ['tf-priceHT', 'tf-emballageUnite']) {
      const champ = feuille.querySelector<HTMLInputElement>(`#${id}`)!;
      expect(champ.value, id).toBe('');
    }
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(feuille.querySelector<HTMLInputElement>('#tf-biere')!, { target: { value: 'Pale Ale' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getAllByRole('alert').map((n) => n.textContent).join(' ')).toMatch(/montant/);
    expect(StorageService.getTarifs()).toHaveLength(0);
  });
  it('un article de la caisse (ligne libre) montre un prix vide et un repère « — », pas « 0,00 » ; un tarif absent dit « prix ? »', () => {
    render(<Caisse clientIdInitial="C-1" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /^33 cl/ })).toHaveTextContent('prix ?');
    fireEvent.click(screen.getByRole('button', { name: /^Autre/ }));
    const prix = screen.getByLabelText('Prix unitaire') as HTMLInputElement;
    expect(prix.value).toBe('');
    expect(prix.placeholder).not.toMatch(/0/);
    expect(screen.getByLabelText('Total')).toHaveTextContent('—');
  });

});
