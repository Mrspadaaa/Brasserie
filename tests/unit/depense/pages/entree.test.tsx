// @vitest-environment jsdom
/**
 * Voie n2-pages, P1 : l'entrée, le bouton noir coupé en deux (forme 3 de `choix-captures/retenue`, « Celle là que je veux »).
 * T-E1 deux boutons · T-E2 l'ordre des inputs · T-E3 « Un document » comme aujourd'hui · T-E4 les jetons · T-E5 deux fichiers lâchés · T-E6 un seul lâché
 * + P1 de la pastille du bandeau : « 1 ligne », « N lignes » dès 2.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Bandeau } from '../../../../src/ui/depense/Recap';
import { etat, preparer, monter, champFichier, champPages, bouton, image, lectureOk, fireEvent, screen, waitFor } from './cadre';

vi.mock('../../../../src/services/storage', async () => (await import('./cadre')).storageMock());
vi.mock('../../../../src/services/financeService', async () => (await import('./cadre')).financeMock());
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./cadre')).firestoreMock());
vi.mock('../../../../src/services/geminiScanner', async () => (await import('./cadre')).scannerMock());
vi.mock('../../../../src/services/qrLecture', async () => (await import('./cadre')).qrMock());
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => (await import('./cadre')).purchaseMock(await importOriginal()));
vi.mock('../../../../src/services/pagesJustificatif', async importOriginal => (await import('./cadre')).pagesMock(await importOriginal()));
vi.mock('../../../../src/ui/useViewport', async importOriginal => (await import('./cadre')).viewportMock(await importOriginal()));
beforeEach(preparer);
const pdf = () => { const f = new File(['%PDF-1.4\nfacture\n'], 'facture.pdf', { type: 'application/pdf' }); Object.defineProperty(f, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\nfacture\n').buffer }); return f; };

describe('T-E1 le bouton coupé en deux', () => {
  it('« Un document » (nom accessible = texte visible) et « Plusieurs » dans le même conteneur ; « Photographier le ticket » seulement en tactile', async () => {
    const view = await monter();
    const un = bouton('Un document'), plusieurs = bouton('Plusieurs');
    expect(un.getAttribute('aria-label')).toBeNull();
    expect(un.parentElement).toBe(plusieurs.parentElement);
    expect(screen.queryByRole('button', { name: 'Choisir le document' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Photographier le ticket' })).toBeNull();
    expect(bouton('Saisir sans justificatif')).toBeTruthy();
    view.unmount();
    etat.coarse = true;
    await monter();
    expect(bouton('Photographier le ticket')).toBeTruthy();
  });
});

describe('T-E2 / T-E3 « Un document » : le parcours d\'aujourd\'hui', () => {

  it('T-E3 : un toucher ouvre le sélecteur du fichier ; un fichier → scanDocument une fois, scanPages jamais ; l\'en-tête garde son nom d\'avant', async () => {
    etat.scanned.mockResolvedValue(lectureOk());
    const view = await monter();
    const ouverts: Array<string | null> = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { ouverts.push(this.getAttribute('aria-label')); });
    fireEvent.click(bouton('Un document'));
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
  it('T-E5 : deux fichiers lâchés d\'un coup → refus qui dit quoi faire ; rien n\'est lu, la page 2 n\'est pas perdue en silence', async () => {
    await monter();
    fireEvent.drop(section(), { dataTransfer: { files: [pdf(), image('b.jpg')], types: ['Files'] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Dépose un seul document à la fois. Pour plusieurs pages, touche « Plusieurs ».');
    expect(etat.scanned).not.toHaveBeenCalled();
    expect(etat.pages).not.toHaveBeenCalled();
  });
  it('LO-6 : trois captures dans « Importer un justificatif » d\'un coup → le même refus ; la capture 1 n\'est jamais lue seule en silence', async () => {
    const view = await monter();
    fireEvent.change(champFichier(view), { target: { files: [image('c1.png'), image('c2.png'), image('c3.png')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Dépose un seul document à la fois. Pour plusieurs pages, touche « Plusieurs ».');
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
