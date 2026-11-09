import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import type { Batch } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));

const annee = new Date().getFullYear();
const brassin: Batch = { id: 'B1', name: 'Brassin', style: 'Ale', volumeL: 100, volumePackagedL: 85.9, brewDate: `01.02.${annee}`, status: 'termine', og: '1.048', abv: '5' } as Batch;

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
  StorageService.setUiState('clients_subtab', 'crm');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Impôt sur la bière : nombres à la virgule (BE-82)', () => {
  it('écrit les litres conditionnés et le montant avec la virgule, jamais le point', () => {
    render(<ClientsTab clients={[]} batches={[brassin]} tarifs={[]} config={defaultConfig} onOpenQuickAction={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Impôt sur la bière' }));
    const tax = within(screen.getByRole('region', { name: 'Réserve pour l’impôt sur la bière' }));
    expect(tax.getByText('Pour 85,9 litres conditionnés')).toBeVisible();
    expect(tax.queryByText(/85\.9/)).toBeNull();
    // Le montant (ex. « 21,75 CHF ») garde sa virgule.
    expect(tax.getByText(/^\d+,\d{2}( – \d+,\d{2})? CHF$/)).toBeVisible();
  });
});
