// Voie f2, tour 2 (critique k3, 20.11), points 14 et 15 : une seule ligne d'avis dans la ligne libre ; la tuile au tarif faux dit son motif sans « prix ? ». Fixtures simulées.
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
  StorageService.saveTarifs([{ id: 't75', product: 'Pale Ale 75 cl', priceHT: 569.5 } as unknown as PricingItem]);
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('k3 n° 14 et 15 — caisse, tarif 75 cl faussé', () => {
  it('la tuile 75 cl au tarif faux ne dit pas « prix ? » : elle dit le tarif et son prix au litre', () => {
    render(<Caisse clientIdInitial="C-1" onClose={() => {}} />);
    const tuile = screen.getByRole('button', { name: /^75 cl/ });
    expect(tuile.textContent).not.toMatch(/prix \?/);
    expect(tuile.textContent).toMatch(/tarif à corriger/);
    expect(tuile.textContent).toMatch(/759,33 CHF le litre/);
  });

  it('prix saisi à 569,50 : une seule ligne d’avis (l’alerte), pas la note du tarif en plus', () => {
    render(<Caisse clientIdInitial="C-1" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^75 cl/ }));
    const libre = screen.getByRole('group', { name: 'Ligne libre' });
    // Avant le prix : la note du tarif est seule.
    expect(libre.querySelectorAll('.cs-libre-note').length).toBe(1);
    fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: '569,50' } });
    expect(libre.querySelectorAll('.cs-libre-note').length).toBe(1);
    expect(screen.getByRole('alert')).toHaveTextContent(/759,33 CHF le litre/);
    // Prix corrigé : l'alerte part, la note du tarif revient.
    fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: '9,50' } });
    expect(libre.querySelectorAll('.cs-libre-note').length).toBe(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('n° 16 : « Encaisser » grisé tant que le moyen manque le dit en mots ; le moyen choisi, l’indice part et le bouton s’active', () => {
    render(<Caisse onClose={() => {}} />); // Comptoir : « Payé ici », le moyen reste à choisir
    fireEvent.click(screen.getByRole('button', { name: /^75 cl/ }));
    fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: '9,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
    const encaisser = document.querySelector('.cs-go') as HTMLButtonElement;
    expect(encaisser.disabled).toBe(true);
    expect(screen.getByText(/Choisis TWINT ou Espèces pour encaisser/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'TWINT' }));
    expect(screen.queryByText(/Choisis TWINT ou Espèces/)).toBeNull();
  });
});
