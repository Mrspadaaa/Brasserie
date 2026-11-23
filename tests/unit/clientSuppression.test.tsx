// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { refusSuppressionClient } from '../../src/domain/clientSuppression';
import type { Client, Transaction } from '../../src/types';

const hoisted = vi.hoisted(() => ({ clients: [] as unknown[], txs: [] as unknown[], deleted: [] as string[], archives: [] as string[], rendus: [] as string[] }));
vi.mock('../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/storage')>('../../src/services/storage');
  return {
    ...actual,
    StorageService: {
      ...actual.StorageService, getClients: () => hoisted.clients, getTransactions: () => hoisted.txs,
      getBatches: () => [], getStocks: () => ({ kegs: [], rawMaterials: [], cleaning: [], equipment: [] }),
      deleteClient: (id: string) => { hoisted.deleted.push(id); }, updateClient: (c: { id: string }) => { hoisted.rendus.push(c.id); },
      setArchivedEntity: (_k: string, id: string, archived: boolean) => { if (archived) hoisted.archives.push(id); return true; }
    }
  };
});
const { EditClientModal } = await import('../../src/components/EditClientModal');
const { effacerBandeau } = await import('../../src/ui/suppression/bandeau');

afterEach(() => { act(() => effacerBandeau()); cleanup(); hoisted.deleted.length = 0; hoisted.archives.length = 0; hoisted.rendus.length = 0; });
const client = { id: 'CL-ZZ', name: 'ZZ TEST client', type: 'Pro', contact: '', phone: '', email: '', address: '' } as Client;
const vente = (over: Record<string, unknown> = {}) => ({ id: 'V1', date: '10.11.2026', description: 'Vente ZZ TEST client', category: 'recettes', amountHT: 45, amountTTC: 45, tvaRate: 0, clientId: 'CL-ZZ', finance: { version: 1, kind: 'sale', amountCents: 4500, lines: [] }, ...over }) as unknown as Transaction;

describe('PC-2 (d) : supprimer un client', () => {
  it('refus avec la raison si une vente non annulée existe, accord sinon', () => {
    expect(refusSuppressionClient(client, [vente()])).toMatch(/1 vente non annulée/);
    expect(refusSuppressionClient(client, [])).toBeNull();
    expect(refusSuppressionClient(client, [vente({ finance: { version: 1, kind: 'sale', amountCents: 4500, lines: [], voidedAt: '2026-11-10' } })])).toBeNull();
  });

  it('sans lien, « Supprimer ce client » supprime tout de suite ; le bandeau « Annuler » rétablit le client', () => {
    hoisted.clients = [client]; hoisted.txs = [];
    const onClose = vi.fn();
    render(<EditClientModal isOpen client={client} onClose={onClose} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce client' }));
    expect(hoisted.deleted).toEqual(['CL-ZZ']);
    expect(onClose).toHaveBeenCalled();
    const bandeau = screen.getByTestId('bandeau-suppression');
    expect(bandeau.textContent).toMatch(/ZZ TEST client supprimé/);
    fireEvent.click(within(bandeau).getByRole('button', { name: /Annuler/ }));
    expect(hoisted.rendus).toEqual(['CL-ZZ']);
    expect(screen.queryByTestId('bandeau-suppression')).toBeNull();
  });

  it('avec une vente, la feuille compte le lien, verrouille Supprimer et propose d’archiver', () => {
    hoisted.clients = [client]; hoisted.txs = [vente()];
    const onClose = vi.fn();
    render(<EditClientModal isOpen client={client} onClose={onClose} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce client' }));
    expect(hoisted.deleted).toEqual([]);
    const feuille = screen.getByRole('dialog', { name: /Supprimer ZZ TEST client/ });
    expect(feuille.textContent).toMatch(/1\s*lien le retient/);
    expect(feuille.textContent).toMatch(/1 vente/);
    expect(feuille.textContent).toMatch(/reste dans les comptes/);
    expect(screen.queryByRole('button', { name: /^Supprimer · encore/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Archiver ZZ TEST client' }));
    expect(hoisted.archives).toEqual(['CL-ZZ']);
    expect(hoisted.deleted).toEqual([]);
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByTestId('bandeau-suppression').textContent).toMatch(/archivé, liens gardés/);
  });
});
