import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
import { defaultConfig, StorageService } from '../../src/services/storage';
import { SettingsModal } from '../../src/components/SettingsModal';
import { EditClientModal } from '../../src/components/EditClientModal';
import { IdentiteBrasserieFeuille } from '../../src/ui/vente/IdentiteBrasserie';
import { brewerJobs } from '../../src/services/brewerJobs';
import type { AppConfig, Client } from '../../src/types';

afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

const IBAN_TEST = 'CH93 0076 2011 6238 5295 7'; // exemple public du guide SIX

describe('A1 — l\'adresse écrite depuis la caisse survit à Réglages (instantané périmé)', () => {
  it('la feuille de la caisse écrit company seulement ; Réglages ouvert avec l\'ancienne config puis enregistré garde adresse et IBAN', async () => {
    const perime: AppConfig = { ...defaultConfig, company: { ...defaultConfig.company, iban: IBAN_TEST } };
    let stocke: AppConfig = structuredClone(perime);
    vi.spyOn(StorageService, 'getConfig').mockImplementation(() => stocke);
    const saveConfig = vi.spyOn(StorageService, 'saveConfig').mockImplementation(c => { stocke = structuredClone(c); });
    vi.spyOn(StorageService, 'confirmPendingWrites').mockResolvedValue();

    // 1. la caisse : « + adresse » de la brasserie
    const saved = vi.fn(), fermer = vi.fn();
    const feuille = render(<IdentiteBrasserieFeuille onClose={fermer} onSaved={saved} />);
    fireEvent.change(screen.getByLabelText('Rue'), { target: { value: 'Rue du Test' } });
    fireEvent.change(screen.getByLabelText('N°'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('NPA'), { target: { value: '1700' } });
    fireEvent.change(screen.getByLabelText('Localité'), { target: { value: 'Fribourg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).toHaveBeenCalled();
    expect(stocke.company.adresse).toMatchObject({ rue: 'Rue du Test', numero: '12', npa: '1700', localite: 'Fribourg' });
    expect(stocke.company.iban).toBe(IBAN_TEST); // l'IBAN, non touché, n'est pas réécrit
    feuille.unmount();

    // 2. Réglages ouvert avec la config PÉRIMÉE du parent (sans adresse) : enregistrer un autre réglage
    const maj = vi.fn();
    render(<SettingsModal isOpen onClose={vi.fn()} config={perime} onConfigUpdated={maj} onOpenAuditLogs={vi.fn()} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' })));
    const dernier = saveConfig.mock.calls.at(-1)![0];
    expect(dernier.company.adresse).toMatchObject({ rue: 'Rue du Test', numero: '12', localite: 'Fribourg' });
    expect(dernier.company.iban).toBe(IBAN_TEST);
    expect(maj.mock.calls.at(-1)![0].company.adresse?.rue).toBe('Rue du Test');
  });

  it('l\'IBAN de repli de l\'app n\'est écrit que s\'il est tapé ; un IBAN faux tapé bloque la feuille', () => {
    let stocke: AppConfig = structuredClone({ ...defaultConfig, company: { ...defaultConfig.company, iban: undefined } });
    vi.spyOn(StorageService, 'getConfig').mockImplementation(() => stocke);
    const saveConfig = vi.spyOn(StorageService, 'saveConfig').mockImplementation(c => { stocke = structuredClone(c); });
    render(<IdentiteBrasserieFeuille onClose={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(stocke.company.iban).toBeUndefined();
    fireEvent.change(screen.getByLabelText('IBAN Brasserie (factures par virement)'), { target: { value: 'CH93 0076 2011 6238 5295 8' } });
    saveConfig.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saveConfig).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('le gabarit de départ (« 1000 Ville ») s\'affiche découpé, sans rien inventer', () => {
    vi.spyOn(StorageService, 'getConfig').mockReturnValue(defaultConfig);
    render(<IdentiteBrasserieFeuille onClose={vi.fn()} onSaved={vi.fn()} />);
    expect((screen.getByLabelText('Localité') as HTMLInputElement).value).toBe('Ville');
    expect((screen.getByLabelText('N°') as HTMLInputElement).value).toBe('1');
  });
});

describe('B3 — une fiche client ne perd pas son adresse', () => {
  const client = (over: Partial<Client> = {}): Client => ({ id: 'C1', name: 'Café du Pont', type: 'Pro', contact: '', phone: '', email: '', ...over });
  const ouvrir = (c: Client) => {
    const update = vi.spyOn(StorageService, 'updateClient').mockImplementation(() => {});
    render(<EditClientModal isOpen client={c} onClose={vi.fn()} onSave={vi.fn()} />);
    return update;
  };
  it('« Case postale 123 » non découpable : enregistrer un téléphone laisse address intacte, sans adresse structurée', () => {
    const update = ouvrir(client({ address: 'Case postale 123' }));
    expect(screen.getByText(/Adresse enregistrée : Case postale 123/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Téléphone / mobile'), { target: { value: '026 408 33 33' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const ecrit = update.mock.calls[0][0];
    expect(ecrit.address).toBe('Case postale 123');
    expect(ecrit.adresse).toBeUndefined();
  });
  it('une adresse découpable, non touchée : address inchangée (pas reformatée)', () => {
    const update = ouvrir(client({ address: 'Rue du Lac 5,  1700 Fribourg' }));
    expect((screen.getByLabelText('Rue') as HTMLInputElement).value).toBe('Rue du Lac');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(update.mock.calls[0][0].address).toBe('Rue du Lac 5,  1700 Fribourg');
    expect(update.mock.calls[0][0].adresse).toBeUndefined();
  });
  it('une adresse complète saisie : adresse structurée ET chaîne dérivée sont écrites', () => {
    const update = ouvrir(client());
    fireEvent.change(screen.getByLabelText('Rue'), { target: { value: 'Rue du Lac' } });
    fireEvent.change(screen.getByLabelText('N°'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('NPA'), { target: { value: '1700' } });
    fireEvent.change(screen.getByLabelText('Localité'), { target: { value: 'Fribourg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const ecrit = update.mock.calls[0][0];
    expect(ecrit.adresse).toEqual({ rue: 'Rue du Lac', numero: '5', npa: '1700', localite: 'Fribourg', pays: 'CH' });
    expect(ecrit.address).toBe('Rue du Lac 5, 1700 Fribourg');
  });
  it('une adresse incomplète saisie (rue sans NPA) n\'écrase pas la chaîne d\'origine', () => {
    const update = ouvrir(client({ address: 'Case postale 123' }));
    fireEvent.change(screen.getByLabelText('Rue'), { target: { value: 'Rue du Lac' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(update.mock.calls[0][0].address).toBe('Case postale 123');
    expect(update.mock.calls[0][0].adresse).toBeUndefined();
  });
});
