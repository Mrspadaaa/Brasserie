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
  it('T-E2 : le premier input de type fichier du DOM est « Importer un justificatif » ; l\'input des pages vient après', async () => {
    const view = await monter();
    const tous = [...view.container.querySelectorAll('input[type="file"]')];
    expect(tous[0].getAttribute('aria-label')).toBe('Importer un justificatif');
    expect(tous.indexOf(champPages(view))).toBeGreaterThan(tous.indexOf(champFichier(view)));
    expect(champPages(view).hasAttribute('capture')).toBe(false);
    expect(champPages(view).multiple).toBe(false);
    expect(champPages(view).accept).toBe('image/*');
  });
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

describe('T-E4 les jetons du bouton, aucune couleur littérale', () => {
  it('« Un document » : bg-ebc-straw text-cave-950, data-primary ; « Plusieurs » : mêmes jetons', async () => {
    await monter();
    const un = bouton('Un document'), plusieurs = bouton('Plusieurs');
    expect(un.hasAttribute('data-primary')).toBe(true);
    for (const b of [un, plusieurs]) {
      const classes = (b.closest('[data-dp="entree"]') ?? b.parentElement!).outerHTML + b.className;
      expect(classes).toMatch(/bg-ebc-straw/);
      expect(classes).toMatch(/text-cave-950/);
      expect(classes).not.toMatch(/#[0-9a-fA-F]{3,6}\b|bg-black|bg-\[#/);
    }
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
  it('T-E6 : un seul fichier lâché → lu comme aujourd\'hui', async () => {
    etat.scanned.mockResolvedValue(lectureOk());
    await monter();
    const f = pdf();
    fireEvent.drop(section(), { dataTransfer: { files: [f], types: ['Files'] } });
    await waitFor(() => expect(etat.scanned).toHaveBeenCalledTimes(1));
    expect(etat.scanned.mock.calls[0][0]).toBe(f);
  });
});

describe('Preuve : une rangée ne sort pas de sa case (« · Quantité × prix non contrôlé » sortait de la carte à 390 et à 1280)', () => {
  it('le libellé est « Qté × prix » sans contrôle comme avec ; chaque rangée peut rétrécir (bouton min-w-0), la valeur est tronquée, le libellé ne pousse pas', async () => {
    const view = await monter();
    etat.pages.mockResolvedValue(lectureOk(3));
    fireEvent.click(bouton('Plusieurs'));
    for (const [i, f] of [image('a.jpg'), image('b.jpg')].entries()) { fireEvent.change(champPages(view), { target: { files: [f] } }); await waitFor(() => expect(view.container.querySelectorAll('[data-dp="rangee-pages"] [data-dp="page"]')).toHaveLength(i + 1)); }
    fireEvent.click(bouton('Lire 2 pages'));
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    const preuve = document.querySelector('section[aria-label="Preuve de la lecture"]') as HTMLElement;
    expect(preuve.textContent).not.toContain('Quantité × prix');
    const rangees = [...preuve.querySelectorAll('div.grid > button')];
    /* Non contrôlé : tout est dans le libellé, en clair, sans valeur en mono à droite (sinon « · Qté × p… non contr… » était rogné à 390). */
    const dit = (mot: RegExp) => rangees.find(r => mot.test(r.textContent ?? ''))!;
    expect(dit(/Qté × prix/).querySelector('span:not([class*="w-3.5"])')!.textContent).toBe('Qté × prix non contrôlé');
    expect(dit(/Qté × prix/).querySelector('b')!.textContent).toBe('');
    expect(dit(/Somme/).querySelector('span:not([class*="w-3.5"])')!.textContent).toBe('Somme non contrôlée');
    expect(dit(/Somme/).querySelector('b')!.textContent).toBe('');
    expect(preuve.textContent).not.toContain('Somme des lignes');
    expect(rangees.length).toBeGreaterThan(1);
    for (const r of rangees) {
      expect(r.className).toMatch(/(^| )min-w-0( |$)/);
      expect(r.className).toContain('overflow-hidden');
      const [libelle, valeur] = [r.querySelector('span:not([class*="w-3.5"])') as HTMLElement, r.querySelector('b') as HTMLElement];
      expect(valeur.className).toContain('truncate');
      expect(libelle.className).toContain('min-w-0');
      /* Une rangée sans valeur passe à la ligne (son libellé dit tout) ; avec une valeur, le libellé est tronqué en dernier. */
      if (valeur.textContent) expect(libelle.className).toContain('truncate');
      else { expect(libelle.className).toContain('whitespace-normal'); expect(libelle.className).not.toContain('truncate'); }
      expect(libelle.className).not.toMatch(/(^| )shrink-0( |$)/);
    }
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
