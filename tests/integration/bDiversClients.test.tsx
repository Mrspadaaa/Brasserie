import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TarifSheet } from '../../src/ui/TarifSheet';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { nextClientId } from '../../src/services/refs';
import type { Client } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null,
  ConfirmSheet: () => null
}));

const clients: Client[] = ['CL-001', 'CL-002', 'CL-003', 'CL-004', 'CL-005'].map((id, i) => ({ id, name: `Client ${i + 1}`, type: 'Pro', contact: '', phone: '', email: '' }) as Client);

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
  StorageService.setUiState('clients_subtab', 'crm');
  StorageService.saveClients(clients);
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('TE-5 : la référence d’un nouveau client ne se consomme pas à l’annulation', () => {
  it('calcule la suivante sur les clients enregistrés seulement', () => {
    expect(nextClientId(clients.map(c => c.id))).toBe('CL-006');
  });

  it('rouvre « Nouveau client » après annulation avec la même référence CL-006', () => {
    const { rerender } = render(<ClientsTab clients={clients} batches={[]} tarifs={[]} config={defaultConfig} onOpenQuickAction={() => {}} createRequest={{ kind: 'newClient', at: 1 }} />);
    expect(screen.getByText(/Réf\. CL-006/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByText(/Réf\. CL-006/)).toBeNull();
    rerender(<ClientsTab clients={clients} batches={[]} tarifs={[]} config={defaultConfig} onOpenQuickAction={() => {}} createRequest={{ kind: 'newClient', at: 2 }} />);
    expect(screen.getByText(/Réf\. CL-006/)).toBeVisible();
  });
});

describe('Nouveau tarif : « À renseigner » tant que le prix manque', () => {
  it('le prix TTC vide dit « À renseigner » et le reste n’est pas affiché', () => {
    render(<TarifSheet item={{ product: '', costIngredients: undefined, costFixed: undefined, costLabor: undefined, costTotal: undefined, priceHT: undefined, marginCHF: undefined, marginPercent: undefined } as any} config={defaultConfig} onClose={() => {}} onSave={() => {}} onDelete={() => {}} />);
    expect(screen.getByLabelText('Prix TTC')).toHaveTextContent('À renseigner');
    expect(screen.queryByLabelText('Il te reste')).toBeNull();
  });
});
