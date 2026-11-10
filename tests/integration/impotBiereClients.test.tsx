import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('clients_subtab', 'ofdf'); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Clients › Impôt sur la bière : le barème vient de la donnée (défaut 14)', () => {
  it('18. aucun taux du barème écrit en dur dans la section', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../src/components/tabs/ClientsTab.tsx'), 'utf8');
    expect(source).not.toMatch(/16[,.]88|25[,.]32|33[,.]76/);
  });

  it('18c. ni les taux ni la phrase ne sont écrits en dur dans le dossier de l’écran de l’année (i1a)', () => {
    const dossier = path.resolve(__dirname, '../../src/ui/production/impotAnnee');
    for (const nom of fs.readdirSync(dossier)) expect(fs.readFileSync(path.join(dossier, nom), 'utf8'), nom).not.toMatch(/16[,.]88|25[,.]32|33[,.]76/);
  });

  it('18b. la phrase rendue reste celle de HEAD, mot pour mot (elle vit dans « Comprendre le barème »)', () => {
    render(<ClientsTab clients={[]} batches={[]} tarifs={[]} config={defaultConfig} onOpenQuickAction={() => {}} />);
    const tax = within(screen.getByRole('region', { name: 'Impôt bière de l’année' }));
    fireEvent.click(tax.getByText('Comprendre le barème'));
    expect(tax.getByText('Barème par hectolitre : 16,88 CHF jusqu’à 10 °P ; 25,32 CHF de 10,1 à 14 °P ; 33,76 CHF dès 14,1 °P.')).toBeVisible();
  });
});
