// @vitest-environment jsdom
/**
 * Voie n2-pages, P2 à P5 : le parcours complet d'une dépense à plusieurs pages (Gemini, Drive et PDF simulés ; le reste est le vrai code).
 * T-A1 `attachment` = le PDF dès l'assemblage · T-A2 échec → « Relire » relit les pages · T-A3 déjà saisi · T-A4 hors ligne · T-A5 la trace après un échec
 * T-A6 « Changer » ne détruit rien · T-A7 la remise à zéro au premier fichier · T-A8 « Changer » refusé quand le fichier est parti · T-A9 la preuve
 * T-A10 Confirmer : un seul justificatif · T-A11 double clic · T-A12 l'en-tête sans pages · T-A13 un seul fichier : rien ne bouge.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, within } from '@testing-library/react';
import { Entete, Justificatif } from '../../../../src/ui/depense/Entete';
import { parseSwissQr } from '../../../../src/services/qrFacture';
import { charge } from '../qr/aide';
import { etat, empreinteAttendue, preparer, monter, champPages, champFichier, bouton, image, lectureOk, ouvrirRangee, RECEIPT, fireEvent, screen, waitFor } from './cadre';

vi.mock('../../../../src/services/storage', async () => (await import('./cadre')).storageMock());
vi.mock('../../../../src/services/financeService', async () => (await import('./cadre')).financeMock());
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./cadre')).firestoreMock());
vi.mock('../../../../src/services/geminiScanner', async () => (await import('./cadre')).scannerMock());
vi.mock('../../../../src/services/qrLecture', async () => (await import('./cadre')).qrMock());
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => (await import('./cadre')).purchaseMock(await importOriginal()));
vi.mock('../../../../src/services/pagesJustificatif', async importOriginal => (await import('./cadre')).pagesMock(await importOriginal()));
vi.mock('../../../../src/ui/useViewport', async importOriginal => (await import('./cadre')).viewportMock(await importOriginal()));
beforeEach(preparer);
const trois = () => ['a.jpg', 'b.jpg', 'c.jpg'].map(n => image(n));
const VIEUX_SERVEUR = { ok: false, error: 'La lecture de plusieurs pages n’est pas encore disponible sur le serveur. Lis-les avec « Un document », ou saisis à la main.', proofDataUrl: '', fileName: '3 pages', mimeType: 'image/jpeg' };
const lire = async (view: { container: HTMLElement }, pages = trois()) => {
  await ouvrirRangee(view, pages);
  fireEvent.click(bouton(`Lire ${pages.length} pages`));
  return pages;
};
const lue = async (view: { container: HTMLElement }, sortie: any = lectureOk(3)) => { etat.pages.mockResolvedValue(sortie); const p = await lire(view); await screen.findByRole('region', { name: 'Vérification du justificatif' }); return p; };
const pile = () => screen.getByRole('button', { name: /^Justificatif, 3 pages/ });
const entreeVisible = () => screen.queryByRole('button', { name: 'Plusieurs' }) !== null;

describe('T-A1 attachment = le PDF dès l\'assemblage', () => {
  it('scanPages reçoit les 3 originales dans l\'ordre ; la carte dit « 3 pages » pendant la lecture ; applyOutcome reçoit l\'empreinte des pages', async () => {
    let fin!: (v: unknown) => void;
    etat.pages.mockReturnValue(new Promise(ok => { fin = ok; }));
    const view = await monter();
    const pages = await lire(view);
    await waitFor(() => expect(etat.pages).toHaveBeenCalledTimes(1));
    expect(etat.pages.mock.calls[0][0]).toHaveLength(3);
    pages.forEach((f, i) => expect(etat.pages.mock.calls[0][0][i]).toBe(f));
    const carte = document.querySelector('[data-dp="lecture"]') as HTMLElement;
    expect(carte.textContent).toContain('3 pages');
    expect(carte.textContent).not.toContain('Justificatif-3-pages.pdf');
    expect(document.querySelector('[data-dp="rangee-pages"]')).toBeNull();
    await act(async () => { fin(lectureOk(3)); });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    fireEvent.click(bouton('Confirmer et enregistrer'));
    await waitFor(() => expect(etat.save).toHaveBeenCalled());
    const attendu = await empreinteAttendue(pages);
    expect(etat.save.mock.calls[0][0].documentHash).toBe(attendu);
  });
});

describe('T-A2 / T-A3 / T-A4 les sorties d\'une lecture qui n\'aboutit pas', () => {
  it('T-A2 : la lecture échoue → « 3 pages », « Relire » relit les 3 originales (jamais scanDocument avec le PDF), « Saisir à la main » reste', async () => {
    etat.pages.mockResolvedValue(VIEUX_SERVEUR);
    const view = await monter();
    const pages = await lire(view);
    const ligne = await waitFor(() => { const l = document.querySelector('[data-dp="erreur-lecture"]') as HTMLElement; expect(l).toBeTruthy(); return l; });
    expect(ligne.textContent).toContain('3 pages');
    expect(within(ligne).getByRole('button', { name: 'Saisir à la main' })).toBeTruthy();
    fireEvent.click(within(ligne).getByRole('button', { name: 'Relire' }));
    await waitFor(() => expect(etat.pages).toHaveBeenCalledTimes(2));
    pages.forEach((f, i) => expect(etat.pages.mock.calls[1][0][i]).toBe(f));
    expect(etat.scanned).not.toHaveBeenCalled();
  });
  it('T-A3 : les mêmes pages déjà saisies → rien n\'est lu ; « Lire quand même » relit les pages', async () => {
    const pages = trois();
    const hash = await empreinteAttendue(pages);
    etat.transactions = [{ id: 'TX-fictive-1', date: '12.10.2026', amountTTC: 48.7, description: 'Malt', category: 'brassage',
      finance: { version: 1, kind: 'expense', amountCents: 4870, vendor: 'Malzhaus Nord', invoiceNumber: 'F-1', paymentStatus: 'paid', recordedAt: new Date().toISOString(), lines: [], sourceDocumentHash: hash } }];
    etat.pages.mockResolvedValue(lectureOk(3));
    const view = await monter();
    await lire(view, pages);
    fireEvent.click(await screen.findByRole('button', { name: 'Lire quand même' }));
    expect(etat.pages).not.toHaveBeenCalled();
    await waitFor(() => expect(etat.pages).toHaveBeenCalledTimes(1));
    expect(etat.pages.mock.calls[0][0]).toHaveLength(3);
    expect(etat.scanned).not.toHaveBeenCalled();
  });
  it('T-A4 : hors ligne, la lecture échoue, le formulaire s\'ouvre avec le PDF posé et « Relire »', async () => {
    etat.pages.mockResolvedValue({ ...VIEUX_SERVEUR, error: 'Service IA momentanément indisponible.' });
    const view = await monter();
    act(() => { window.dispatchEvent(new Event('offline')); });
    await lire(view);
    await waitFor(() => expect(document.querySelector('#purchase-total')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Relire' })).toBeTruthy();
    expect(pile()).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent('Service IA momentanément indisponible.');
  });
});

describe('T-A5 la trace des pages jointes, lue ou non', () => {
  it('après un échec : la pile « 3 » dans l\'en-tête, le panneau (3 vignettes, « Changer ») ; « Changer » ouvre l\'entrée, jamais le sélecteur d\'un fichier', async () => {
    etat.pages.mockResolvedValue(VIEUX_SERVEUR);
    const view = await monter();
    await lire(view);
    await waitFor(() => expect(pile()).toBeTruthy());
    expect(pile().textContent).toContain('3');
    expect(screen.queryByRole('button', { name: 'Justificatif : voir l’original, changer' })).toBeNull();
    fireEvent.click(pile());
    const panneau = document.querySelector('[data-dp="pages-panneau"]') as HTMLElement;
    expect(panneau.querySelectorAll('[data-dp="vignette"]')).toHaveLength(3);
    const ouverts: Array<string | null> = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { ouverts.push(this.getAttribute('aria-label')); });
    fireEvent.click(within(panneau).getByRole('button', { name: 'Changer' }));
    expect(entreeVisible()).toBe(true);
    expect(ouverts).toEqual([]);
    expect(champFichier(view)).toBeTruthy();
  });
});

describe('T-A6 / T-A7 / T-A8 « Changer »', () => {
  it('T-A6 : « Changer » puis refermer le panneau → le brouillon est identique (bandeau, lignes, pile) ; aucune lecture de plus', async () => {
    const view = await monter();
    await lue(view);
    const avant = (document.querySelector('[data-dp="bandeau"]') as HTMLElement).textContent;
    fireEvent.click(pile());
    fireEvent.click(within(document.querySelector('[data-dp="pages-panneau"]') as HTMLElement).getByRole('button', { name: 'Changer' }));
    expect(entreeVisible()).toBe(true);
    expect((document.querySelector('[data-dp="bandeau"]') as HTMLElement).textContent).toBe(avant);
    fireEvent.click(pile());
    expect(entreeVisible()).toBe(false);
    expect((document.querySelector('[data-dp="bandeau"]') as HTMLElement).textContent).toBe(avant);
    expect(pile()).toBeTruthy();
    expect(etat.pages).toHaveBeenCalledTimes(1);
    expect(etat.scanned).not.toHaveBeenCalled();
  });
  it('T-A7 : la première page d\'un nouveau lot remet tout à zéro (lecture, pages, URL d\'objet révoquées)', async () => {
    const view = await monter();
    await lue(view);
    fireEvent.click(pile());
    fireEvent.click(within(document.querySelector('[data-dp="pages-panneau"]') as HTMLElement).getByRole('button', { name: 'Changer' }));
    fireEvent.click(bouton('Plusieurs'));
    fireEvent.change(champPages(view), { target: { files: [image('neuve.jpg')] } });
    await waitFor(() => expect(document.querySelectorAll('[data-dp="rangee-pages"] [data-dp="page"]')).toHaveLength(1));
    expect(screen.queryByRole('region', { name: 'Vérification du justificatif' })).toBeNull();
    expect((URL as any).revokeObjectURL).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^Justificatif, 3 pages/ })).toBeNull();
    expect(bouton('Lire 1 page')).toBeTruthy();
  });
  it('T-A8 : le fichier est parti (confirmation en attente) → « Changer » désactivé, une page refusée avec le message d\'avant', async () => {
    etat.confirmed.mockRejectedValueOnce(new Error('Confirmation ciblée'));
    const view = await monter();
    await lue(view);
    fireEvent.click(bouton('Confirmer et enregistrer'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation ciblée');
    expect(screen.getByRole('button', { name: 'Changer' })).toBeDisabled();
    fireEvent.change(champPages(view), { target: { files: [image('tard.jpg')] } });
    expect(await screen.findByText(/L’enregistrement attend sa confirmation : le fichier ne peut plus être changé/)).toBeTruthy();
    expect(document.querySelector('[data-dp="rangee-pages"]')).toBeNull();
  });
});

/** Un point de désaccord entre les lectures (origine « lecture », qui pèse). */
const DESACCORD = { code: 'lectures-divergentes', cle: 'k', message: 'Les lectures divergent sur la TVA.', champ: 'tvaAmount', champs: ['tvaAmount'], ligne: null, lu: null, calcule: null, ecart: null, unite: 'nombre', gravite: 'ecart', origine: 'lecture', enjeu: 'info', bloque: false, regle: 'r' };
const preuve = () => document.querySelector('section[aria-label="Preuve de la lecture"]') as HTMLElement;
const rangeeDe = (mot: RegExp) => [...preuve().querySelectorAll('button')].find(b => mot.test(b.textContent ?? ''))!;

describe('T-A9 la preuve : « ✓ N pages lues » (sa maquette 6), sinon les lectures telles quelles', () => {
  it('lectures d\'accord et plus d\'une page → « 3 pages lues » avec ✓, sans valeur à droite, ni « Lectures » ni 2/2', async () => {
    const view = await monter();
    await lue(view);
    const rang = rangeeDe(/pages lues/);
    expect(rang.textContent!.replace(/\s+/g, ' ').trim()).toBe('3 pages lues');
    expect(rang.querySelector('svg')).toBeTruthy();
    expect(rang.querySelector('b')!.textContent).toBe('');
    expect(preuve().textContent).not.toContain('Lectures');
    expect(preuve().textContent).not.toContain('2/2');
  });
  it('lectures en désaccord → inchangé : « Lectures · 3 pages » et « 2 lectures »', async () => {
    const view = await monter();
    await lue(view, lectureOk(3, { points: [DESACCORD] }));
    const rang = rangeeDe(/Lectures/);
    expect(rang.textContent).toContain('Lectures · 3 pages');
    expect(rang.textContent).toContain('2 lectures');
    expect(preuve().textContent).not.toMatch(/pages lues/);
  });
  it('un document seul → inchangé : « Lectures » et 2/2', async () => {
    etat.scanned.mockResolvedValue(lectureOk());
    const view = await monter();
    const f = new File(['%PDF-1.4\nx\n'], 'facture.pdf', { type: 'application/pdf' });
    Object.defineProperty(f, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\nx\n').buffer });
    fireEvent.change(champFichier(view), { target: { files: [f] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    const rang = rangeeDe(/Lectures/);
    expect(rang.textContent).toContain('2/2');
    expect(preuve().textContent).not.toMatch(/pages lues/);
  });
  it('sans lectures annoncées, aucune rangée inventée', async () => {
    const view = await monter();
    await lue(view, lectureOk(3, {}, null));
    expect(preuve().textContent).not.toMatch(/Lectures|pages lues/);
  });
});

describe('T-Q1 l\'ordre du QR : les pages se lisent de la dernière à la première, jusqu\'au premier QR lu', () => {
  const qrLu = () => ({ statut: 'lu' as const, ms: 500, qr: parseSwissQr(charge({ creancier: ['S', 'Malterie Fictive SA', 'Route de la Malterie', '1', '1000', 'Lausanne', 'CH'], debiteur: ['', '', '', '', '', '', ''], montant: '110.40', s1: '//S1/10/F-1001/11/261012/32/8.1/40/0:30' }))! });
  const noms = () => etat.qr.mock.calls.map(appel => (appel[0] as File).name);
  it('le QR est seulement sur la page 3 → premier appel avec la page 3, arrêt là', async () => {
    etat.qr.mockImplementation(async (f: File) => (f.name === 'c.jpg' ? qrLu() : { statut: 'sans' }));
    const view = await monter();
    await lue(view);
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });
    expect(noms()).toEqual(['c.jpg']);
  });
  it('le QR est seulement sur la page 1 → c, b, puis a', async () => {
    etat.qr.mockImplementation(async (f: File) => (f.name === 'a.jpg' ? qrLu() : { statut: 'sans' }));
    const view = await monter();
    await lue(view);
    await waitFor(() => expect(noms()).toEqual(['c.jpg', 'b.jpg', 'a.jpg']));
  });
});

describe('T-A10 un seul justificatif', () => {
  it('Confirmer envoie un brouillon PDF : un fichier, pas trois ; l\'empreinte est celle des pages', async () => {
    const view = await monter();
    const pages = await lue(view);
    fireEvent.click(bouton('Confirmer et enregistrer'));
    await waitFor(() => expect(etat.save).toHaveBeenCalledTimes(1));
    const brouillon = etat.save.mock.calls[0][0];
    expect(brouillon.proofType).toBe('application/pdf');
    expect(brouillon.proofDataUrl.startsWith('data:application/pdf')).toBe(true);
    expect(brouillon.proofFileName).toBe('Justificatif-3-pages.pdf');
    expect(brouillon.documentHash).toBe(await empreinteAttendue(pages));
    expect(etat.assembler).toHaveBeenCalledTimes(1);
    expect(RECEIPT.verified).toBe(true);
  });
});

describe('T-A11 le double clic', () => {
  it('deux clics sur « Lire 3 pages » : un assemblage, une lecture', async () => {
    etat.pages.mockReturnValue(new Promise(() => undefined));
    const view = await monter();
    await ouvrirRangee(view, trois());
    const lireBtn = bouton('Lire 3 pages');
    fireEvent.click(lireBtn); fireEvent.click(lireBtn);
    await waitFor(() => expect(etat.pages).toHaveBeenCalledTimes(1));
    expect(etat.assembler).toHaveBeenCalledTimes(1);
  });
});

describe('T-A12 / T-A13 sans pages, rien ne change', () => {
  it('T-A12 : l\'en-tête et le panneau d\'un fichier seul ont leurs noms et leur rendu d\'avant', () => {
    const fichier = { nom: 'facture.pdf', url: 'blob:x', type: 'application/pdf' };
    const { container } = render(<><Entete titleId="t" titre="Nouvelle dépense" horsLigne={false} fichier={fichier} ouvert={false} fermerOff={false} onFermer={() => undefined} onBasculer={() => undefined}/>
      <Justificatif fichier={fichier} ouvert changerOff={false} onChanger={() => undefined}/></>);
    expect(screen.getByRole('button', { name: 'Justificatif : voir l’original, changer' })).toBeTruthy();
    expect(container.querySelector('header')!.textContent).toBe('Nouvelle dépense');
    expect(screen.getByRole('link', { name: 'Ouvrir le PDF original' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Changer' })).toBeTruthy();
    expect(container.querySelector('[data-dp="pages-panneau"]')).toBeNull();
  });
  it('T-A13 : un fichier seul → scanDocument, jamais scanPages ; pas de pile', async () => {
    etat.scanned.mockResolvedValue(lectureOk());
    const view = await monter();
    const f = new File(['%PDF-1.4\nx\n'], 'facture.pdf', { type: 'application/pdf' });
    Object.defineProperty(f, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\nx\n').buffer });
    fireEvent.change(champFichier(view), { target: { files: [f] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(etat.scanned).toHaveBeenCalledTimes(1);
    expect(etat.pages).not.toHaveBeenCalled();
    expect(etat.assembler).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^Justificatif, \d+ pages/ })).toBeNull();
    expect(bouton('Justificatif : voir l’original, changer')).toBeTruthy();
  });
});
