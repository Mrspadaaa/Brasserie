// @vitest-environment jsdom
/**
 * Voie n2-pages, P1 : l'entrée (forme 3 de `choix-captures/retenue`). D382 (09.11, « un seul bouton Documents ») : un seul bouton noir « Documents »,
 * un seul sélecteur (PDF ou image, plusieurs fichiers permis, sans `capture`).
 * T-E1 un seul bouton · T-E3 un fichier, comme aujourd'hui · T-E5 un PDF parmi plusieurs lâchés · T-E6 un seul lâché · D382 plusieurs images = les pages, au sélecteur comme au dépôt
 * + P1 de la pastille du bandeau : « 1 ligne », « N lignes » dès 2.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Bandeau } from '../../../../src/ui/depense/Recap';
import { etat, preparer, monter, champFichier, bouton, image, lectureOk, fireEvent, screen, waitFor } from './cadre';

vi.mock('../../../../src/services/storage', async () => (await import('./cadre')).storageMock());
vi.mock('../../../../src/services/financeService', async () => (await import('./cadre')).financeMock());
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./cadre')).firestoreMock());
vi.mock('../../../../src/services/geminiScanner', async () => (await import('./cadre')).scannerMock());
vi.mock('../../../../src/services/qrLecture', async () => (await import('./cadre')).qrMock());
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => (await import('./cadre')).purchaseMock(await importOriginal()));
vi.mock('../../../../src/services/pagesJustificatif', async importOriginal => (await import('./cadre')).pagesMock(await importOriginal()));
vi.mock('../../../../src/ui/useViewport', async importOriginal => (await import('./cadre')).viewportMock(await importOriginal()));
const MESSAGE = 'Un PDF se lit seul : dépose-le sans autre fichier. Plusieurs fichiers ne se prennent qu’en images (les pages).';
beforeEach(preparer);
const pdf = () => { const f = new File(['%PDF-1.4\nfacture\n'], 'facture.pdf', { type: 'application/pdf' }); Object.defineProperty(f, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\nfacture\n').buffer }); return f; };
const noms = (view: { container: HTMLElement }) => [...view.container.querySelectorAll('[data-dp="rangee-pages"] [data-dp="page"]')].map(n => n.getAttribute('data-dp-nom'));

describe('T-E1 un seul bouton « Documents »', () => {
  it('« Documents » (nom accessible = texte visible), ni « Un document » ni « Plusieurs » ; un seul sélecteur sans capture ; « Photographier le ticket » seulement en tactile', async () => {
    const view = await monter();
    const docs = bouton('Documents');
    expect(docs.getAttribute('aria-label')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Un document' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Plusieurs' })).toBeNull();
    expect(champFichier(view).getAttribute('accept')).toBe('application/pdf,image/*');
    expect(champFichier(view).multiple).toBe(true);
    expect(champFichier(view).hasAttribute('capture')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Choisir le document' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Photographier le ticket' })).toBeNull();
    expect(bouton('Saisir sans justificatif')).toBeTruthy();
    expect(screen.getByText('Un fichier, ou plusieurs photos du même ticket · PDF ou image · 4 Mo max.')).toBeTruthy(); // p1 relance : la règle du bouton est dite
    view.unmount();
    etat.coarse = true;
    await monter();
    expect(bouton('Photographier le ticket')).toBeTruthy();
  });
});

describe('T-E3 « Documents » avec un fichier : le parcours d\'aujourd\'hui', () => {
  it('T-E3 : un toucher ouvre le sélecteur ; un fichier → scanDocument une fois, scanPages jamais ; l\'en-tête garde son nom d\'avant', async () => {
    etat.scanned.mockResolvedValue(lectureOk());
    const view = await monter();
    const ouverts: Array<string | null> = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { ouverts.push(this.getAttribute('aria-label')); });
    fireEvent.click(bouton('Documents'));
    expect(ouverts).toEqual(['Importer un justificatif']);
    const f = pdf();
    fireEvent.change(champFichier(view), { target: { files: [f] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(etat.scanned).toHaveBeenCalledTimes(1);
    expect(etat.scanned.mock.calls[0][0]).toBe(f);
    expect(etat.pages).not.toHaveBeenCalled();
    expect(bouton('Justificatif : voir l’original, changer')).toBeTruthy();
  });
});

describe('T-E5 / T-E6 le dépôt par glisser sur l\'entrée', () => {
  const section = () => screen.getByRole('region', { name: 'Justificatif de la dépense' });
  it('T-E5 : un PDF et une image lâchés d\'un coup → refus qui dit quoi faire ; rien n\'est lu, la page 2 n\'est pas perdue en silence', async () => {
    await monter();
    fireEvent.drop(section(), { dataTransfer: { files: [pdf(), image('b.jpg')], types: ['Files'] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGE);
    expect(etat.scanned).not.toHaveBeenCalled();
    expect(etat.pages).not.toHaveBeenCalled();
  });
  it('LO-6 : un PDF parmi trois fichiers dans « Importer un justificatif » → le même refus ; le premier fichier n\'est jamais lu seul en silence', async () => {
    const view = await monter();
    fireEvent.change(champFichier(view), { target: { files: [image('c1.png'), pdf(), image('c3.png')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGE);
    expect(noms(view)).toEqual([]);
    expect(etat.scanned).not.toHaveBeenCalled();
    expect(etat.pages).not.toHaveBeenCalled();
  });
  it('T-E6 : un seul fichier lâché → lu comme aujourd\'hui', async () => {
    etat.scanned.mockResolvedValue(lectureOk());
    await monter();
    const f = pdf();
    fireEvent.drop(section(), { dataTransfer: { files: [f], types: ['Files'] } });
    await waitFor(() => expect(etat.scanned).toHaveBeenCalledTimes(1));
    expect(etat.scanned.mock.calls[0][0]).toBe(f);
  });
});

describe('D382 plusieurs images par « Documents » = les pages ; même règle au sélecteur, au dépôt et à « Joindre »', () => {
  it('trois captures choisies d\'un coup dans le sélecteur unique → trois pages dans l\'ordre numérique des noms ; rien n\'est lu (LO-7)', async () => {
    const view = await monter();
    fireEvent.change(champFichier(view), { target: { files: [image('capture-10.png'), image('capture-2.png'), image('capture-1.png')] } });
    await waitFor(() => expect(noms(view)).toEqual(['capture-1.png', 'capture-2.png', 'capture-10.png']));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(etat.scanned).not.toHaveBeenCalled();
    expect(etat.pages).not.toHaveBeenCalled();
  });
  it('deux images lâchées sur l\'entrée → deux pages, aucun refus', async () => {
    const view = await monter();
    fireEvent.drop(screen.getByRole('region', { name: 'Justificatif de la dépense' }), { dataTransfer: { files: [image('a.jpg'), image('b.jpg')], types: ['Files'] } });
    await waitFor(() => expect(noms(view)).toEqual(['a.jpg', 'b.jpg']));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(etat.scanned).not.toHaveBeenCalled();
  });
  it('une image seule choisie → lue tout de suite, comme aujourd\'hui (pas une page)', async () => {
    etat.scanned.mockResolvedValue(lectureOk());
    const view = await monter();
    fireEvent.change(champFichier(view), { target: { files: [image('ticket.jpg')] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(etat.scanned).toHaveBeenCalledTimes(1);
    expect(noms(view)).toEqual([]);
  });
  it('un PDF et deux images au sélecteur → refus dit, aucune page posée, rien lu', async () => {
    const view = await monter();
    fireEvent.change(champFichier(view), { target: { files: [image('a.jpg'), image('b.jpg'), pdf()] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGE);
    expect(noms(view)).toEqual([]);
    expect(etat.scanned).not.toHaveBeenCalled();
    expect(etat.pages).not.toHaveBeenCalled();
  });
  it('le formulaire ouvert garde un seul bouton discret « Joindre des documents », qui ouvre le même sélecteur', async () => {
    await monter({ startWithScan: false });
    const ouverts: Array<string | null> = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { ouverts.push(this.getAttribute('aria-label')); });
    fireEvent.click(screen.getByRole('button', { name: 'Joindre des documents' }));
    expect(ouverts).toEqual(['Importer un justificatif']);
  });
});

describe('Pastille du bandeau : le pluriel', () => {
  const props = (nLignes: number) => ({ vendor: 'Malzhaus Nord', date: '14.10.2026', totalField: <span>48,70</span>, sommeDesLignes: false, portCents: null, portOuvert: false, onPort: () => undefined,
    statut: 'checked' as const, nLignes, onLignes: () => undefined, onDate: () => undefined, barre: [], onBarre: () => undefined, drive: null, onDrive: () => undefined });
  it.each([[1, '1 ligne'], [2, '2 lignes'], [6, '6 lignes']])('%i → « %s »', (n, attendu) => {
    const { container } = render(<Bandeau {...props(n)}/>);
    const pastille = [...container.querySelectorAll('button')].find(b => /ligne/.test(b.getAttribute('aria-label') ?? ''))!;
    expect(pastille.textContent!.replace(/ /g, ' ').trim()).toBe(attendu);
    expect(pastille.getAttribute('aria-label')).toMatch(new RegExp(`${n} ligne${n > 1 ? 's' : ''}$`));
  });
});
