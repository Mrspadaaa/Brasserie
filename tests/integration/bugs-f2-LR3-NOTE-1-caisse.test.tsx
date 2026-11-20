// Voie f2 (20.11), LR3-NOTE-1 : la caisse alerte (sans refuser) quand le prix d'une ligne de format sort de l'ordinaire. Fixtures simulées.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Caisse } from '../../src/ui/vente/Caisse';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import type { Client, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null,
  ConfirmSheet: () => null,
}));

const client: Client = { id: 'C-1', name: 'Restaurant du Lac', type: 'Pro', contact: '', phone: '', email: '' };
beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
  StorageService.saveClients([client]);
  // Tarif faux (569,50 la bouteille de 75 cl) : la tuile ne le propose pas, la ligne libre du format attend le prix.
  StorageService.saveTarifs([{ id: 't75', product: 'Pale Ale 75 cl', priceHT: 569.5 } as unknown as PricingItem]);
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('LR3-NOTE-1 — prix de ligne à vérifier', () => {
  it('un 75 cl saisi à 569,50 alerte (prix au litre), et la ligne reste ajoutable ; à 9,50 aucune alerte', () => {
    render(<Caisse clientIdInitial="C-1" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^75 cl/ }));
    const prix = screen.getByLabelText('Prix unitaire') as HTMLInputElement;
    fireEvent.change(prix, { target: { value: '569,50' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/759,33 CHF le litre/);
    fireEvent.change(prix, { target: { value: '9,50' } });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(prix, { target: { value: '569,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
    expect(screen.getByText(/à vérifier : .*759,33 CHF le litre/)).toBeTruthy();
  });
});
