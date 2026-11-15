// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { refusSuppressionClient } from '../../src/domain/clientSuppression';
import type { Client, Transaction } from '../../src/types';

const hoisted = vi.hoisted(() => ({ clients: [] as unknown[], txs: [] as unknown[], deleted: [] as string[] }));
vi.mock('../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/storage')>('../../src/services/storage');
  return { ...actual, StorageService: { ...actual.StorageService, getClients: () => hoisted.clients, getTransactions: () => hoisted.txs, deleteClient: (id: string) => { hoisted.deleted.push(id); }, updateClient: () => {} } };
});
const { EditClientModal } = await import('../../src/components/EditClientModal');

afterEach(() => { cleanup(); hoisted.deleted.length = 0; });
const client = { id: 'CL-ZZ', name: 'ZZ TEST client', type: 'Pro', contact: '', phone: '', email: '', address: '' } as Client;
const vente = (over: Record<string, unknown> = {}) => ({ id: 'V1', date: '10.11.2026', description: 'Vente ZZ TEST client', category: 'recettes', amountHT: 45, amountTTC: 45, tvaRate: 0, clientId: 'CL-ZZ', finance: { version: 1, kind: 'sale', amountCents: 4500, lines: [] }, ...over }) as unknown as Transaction;

describe('PC-2 (d) : supprimer un client', () => {
  it('refus avec la raison si une vente non annulée existe, accord sinon', () => {
    expect(refusSuppressionClient(client, [vente()])).toMatch(/1 vente non annulée/);
    expect(refusSuppressionClient(client, [])).toBeNull();
    expect(refusSuppressionClient(client, [vente({ finance: { version: 1, kind: 'sale', amountCents: 4500, lines: [], voidedAt: '2026-11-10' } })])).toBeNull();
  });
  it('la fiche propose « Supprimer ce client », confirme, puis supprime', () => {
    hoisted.clients = [client]; hoisted.txs = [];
    const onClose = vi.fn();
    render(<EditClientModal isOpen client={client} onClose={onClose} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce client' }));
    expect(hoisted.deleted).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le client' }));
    expect(hoisted.deleted).toEqual(['CL-ZZ']);
    expect(onClose).toHaveBeenCalled();
  });
  it('avec une vente, la fiche refuse et dit pourquoi', () => {
    hoisted.clients = [client]; hoisted.txs = [vente()];
    render(<EditClientModal isOpen client={client} onClose={() => {}} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce client' }));
    expect(screen.getByRole('alert').textContent).toMatch(/1 vente non annulée/);
    expect(screen.queryByRole('button', { name: 'Supprimer le client' })).toBeNull();
    expect(hoisted.deleted).toEqual([]);
  });
});
