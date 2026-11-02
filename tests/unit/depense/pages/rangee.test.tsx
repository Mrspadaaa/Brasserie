// @vitest-environment jsdom
/**
 * Voie n2-pages, P2 : la rangée de pages (maquette `retenue/img/3` et `4`).
 * T-R1 vignettes, × et ordre · T-R2 retrait jusqu'à l'entrée · T-R3 plafonds · T-R4 deux ajouts sans attente · T-R5 même page deux fois
 * T-R6 l'input remis à zéro · T-R7 dépôt sur la rangée · T-R8 la frise ne coche rien avant l'envoi · T-R9 `busy` dès « Lire ».
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { etat, preparer, monter, champPages, champFichier, nbPages, bouton, image, lectureOk, ouvrirRangee, MO, fireEvent, screen, waitFor } from './cadre';

vi.mock('../../../../src/services/storage', async () => (await import('./cadre')).storageMock());
vi.mock('../../../../src/services/financeService', async () => (await import('./cadre')).financeMock());
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./cadre')).firestoreMock());
vi.mock('../../../../src/services/geminiScanner', async () => (await import('./cadre')).scannerMock());
vi.mock('../../../../src/services/qrLecture', async () => (await import('./cadre')).qrMock());
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => (await import('./cadre')).purchaseMock(await importOriginal()));
vi.mock('../../../../src/services/pagesJustificatif', async importOriginal => (await import('./cadre')).pagesMock(await importOriginal()));
vi.mock('../../../../src/ui/useViewport', async importOriginal => (await import('./cadre')).viewportMock(await importOriginal()));
beforeEach(preparer);
const [a, b, c] = ['a.jpg', 'b.jpg', 'c.jpg'].map(n => image(n));
const noms = (view: { container: HTMLElement }) => [...view.container.querySelectorAll('[data-dp="rangee-pages"] [data-dp="page"]')].map(p => p.getAttribute('data-dp-nom'));
const frise = () => document.querySelector('[data-dp="frise"]') as HTMLElement;
const alerte = async (texte: string | RegExp) => expect(await screen.findByRole('alert')).toHaveTextContent(texte);

describe('T-R1 / T-R2 la rangée', () => {
  it('« Plusieurs » ouvre le sélecteur des pages ; trois choix → trois vignettes numérotées, un × chacune, « + page », « Lire 3 pages »', async () => {
    const view = await monter();
    const ouverts: Array<string | null> = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { ouverts.push(this.getAttribute('aria-label')); });
    fireEvent.click(bouton('Plusieurs'));
    expect(ouverts).toEqual(['Ajouter une page']);
    expect(nbPages(view)).toBe(0);
    for (const f of [a, b, c]) fireEvent.change(champPages(view), { target: { files: [f] } });
    await waitFor(() => expect(nbPages(view)).toBe(3));
    expect(noms(view)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    for (const n of [1, 2, 3]) expect(bouton(`Retirer la page ${n}`)).toBeTruthy();
    expect(bouton('+ page')).toBeTruthy();
    expect(bouton('Lire 3 pages')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Saisir sans justificatif' })).toBeNull();
    expect(etat.pages).not.toHaveBeenCalled();
  });
  it('× de la 2ᵉ : l\'ordre devient [a, c], numérotées 1 et 2 ; « Lire 2 pages » ; une seule page : « Lire 1 page »', async () => {
    const view = await monter();
    await ouvrirRangee(view, [a, b, c]);
    fireEvent.click(bouton('Retirer la page 2'));
    expect(noms(view)).toEqual(['a.jpg', 'c.jpg']);
    expect(bouton('Lire 2 pages')).toBeTruthy();
    fireEvent.click(bouton('Retirer la page 2'));
    expect(bouton('Lire 1 page')).toBeTruthy();
  });
  it('T-R2 : tout retiré → l\'entrée et « Saisir sans justificatif » reviennent, rien n\'a été lu', async () => {
    const view = await monter();
    await ouvrirRangee(view, [a, b]);
    fireEvent.click(bouton('Retirer la page 1')); fireEvent.click(bouton('Retirer la page 1'));
    expect(bouton('Un document')).toBeTruthy();
    expect(bouton('Plusieurs')).toBeTruthy();
    expect(bouton('Saisir sans justificatif')).toBeTruthy();
    expect(etat.pages).not.toHaveBeenCalled();
    expect(etat.scanned).not.toHaveBeenCalled();
  });
});

describe('T-R3 les plafonds, dits', () => {
  it('4 pages au plus ; la tuile « + page » disparaît à 4', async () => {
    const view = await monter();
    await ouvrirRangee(view, ['a', 'b', 'c', 'd'].map(n => image(`${n}.jpg`)));
    expect(screen.queryByRole('button', { name: '+ page' })).toBeNull();
    fireEvent.change(champPages(view), { target: { files: [image('e.jpg')] } });
    await alerte('4 pages au plus.');
    expect(nbPages(view)).toBe(4);
  });
  it('un PDF se lit par « Un document » ; une page de plus de 4 Mo est refusée avec son poids', async () => {
    const view = await monter();
    await ouvrirRangee(view, [a]);
    fireEvent.change(champPages(view), { target: { files: [image('f.pdf', 'pdf', undefined, 'application/pdf')] } });
    await alerte('Un PDF se lit avec « Un document ».');
    fireEvent.change(champPages(view), { target: { files: [image('gros.jpg', 'gros', 4 * MO + 1)] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Cette page pèse 4,1 Mo : 4 Mo au plus\./));
    expect(nbPages(view)).toBe(1);
  });
  it('12 Mo au total', async () => {
    const view = await monter();
    await ouvrirRangee(view, [image('a.jpg', 'a', 3_900_000), image('b.jpg', 'b', 3_900_000), image('c.jpg', 'c', 3_900_000)]);
    fireEvent.change(champPages(view), { target: { files: [image('d.jpg', 'd', 400_000)] } });
    await alerte('Les pages pèsent 12,1 Mo : 12 Mo au plus.');
    expect(nbPages(view)).toBe(3);
    fireEvent.change(champPages(view), { target: { files: [image('e.jpg', 'e', 300_000)] } });
    await waitFor(() => expect(nbPages(view)).toBe(4));
  });
});

describe('T-R4 deux ajouts sans attendre', () => {
  it('à 3 pages, deux choix lancés d\'un coup : un seul passe (jamais 5 pages)', async () => {
    const view = await monter();
    await ouvrirRangee(view, [a, b, c]);
    fireEvent.change(champPages(view), { target: { files: [image('d.jpg')] } });
    fireEvent.change(champPages(view), { target: { files: [image('e.jpg')] } });
    await alerte('4 pages au plus.');
    await waitFor(() => expect(nbPages(view)).toBe(4));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(nbPages(view)).toBe(4);
  });
});

describe('T-R5 / T-R6 la même page, l\'input', () => {
  it('T-R5 : un autre nom, le même contenu → « Cette page est déjà ajoutée. »', async () => {
    const view = await monter();
    await ouvrirRangee(view, [image('a.jpg', 'même page')]);
    fireEvent.change(champPages(view), { target: { files: [image('copie.jpg', 'même page')] } });
    await alerte('Cette page est déjà ajoutée.');
    expect(nbPages(view)).toBe(1);
  });
  it('T-R6 : la valeur de l\'input est remise à vide après chaque choix (le même fichier peut être rechoisi)', async () => {
    const view = await monter();
    const valeurs: string[] = [];
    Object.defineProperty(champPages(view), 'value', { configurable: true, get: () => '', set: v => { valeurs.push(v); } });
    fireEvent.click(bouton('Plusieurs'));
    fireEvent.change(champPages(view), { target: { files: [a] } });
    await waitFor(() => expect(nbPages(view)).toBe(1));
    expect(valeurs).toContain('');
  });
});

describe('T-R7 le dépôt sur la rangée', () => {
  it('un fichier lâché = une page ajoutée, jamais attach ; plusieurs lâchés = le refus de l\'entrée', async () => {
    const view = await monter();
    await ouvrirRangee(view, [a]);
    const rangee = view.container.querySelector('[data-dp="rangee-pages"]')!;
    fireEvent.drop(rangee, { dataTransfer: { files: [b], types: ['Files'] } });
    await waitFor(() => expect(nbPages(view)).toBe(2));
    expect(etat.scanned).not.toHaveBeenCalled();
    fireEvent.drop(rangee, { dataTransfer: { files: [c, image('d.jpg')], types: ['Files'] } });
    await alerte('Dépose un seul document à la fois. Pour plusieurs pages, touche « Plusieurs ».');
    expect(nbPages(view)).toBe(2);
    expect(etat.scanned).not.toHaveBeenCalled();
  });
});

describe('T-R8 / T-R9 la frise et l\'état occupé', () => {
  const enCours = () => frise().querySelector('.dp-p3c-frise-cours');
  it('T-R8 : au repos dès la première page « N pages ✓ » (premier segment plein, lecture et vérification grises, jamais « envoi ») ; après « Lire », « lecture » en gras et pointillé ; « Préparation des pages… » dès le toucher', async () => {
    let finAssemblage!: (v: unknown) => void;
    etat.assembler.mockImplementation(() => new Promise(ok => { finAssemblage = ok; }));
    etat.pages.mockReturnValue(new Promise(() => undefined));
    const view = await monter();
    await ouvrirRangee(view, [a]);
    expect(frise().textContent).toBe('1 page ✓lecturevérification');
    fireEvent.change(champPages(view), { target: { files: [b] } });
    await waitFor(() => expect(nbPages(view)).toBe(2));
    expect(frise().textContent).toBe('2 pages ✓lecturevérification');
    const [premier, lecture, verif] = [...frise().children] as HTMLElement[];
    expect(premier.querySelector('i')!.className).toContain('bg-cave-200');
    expect(lecture.querySelector('i')!.className).toContain('bg-cave-800');
    expect(verif.querySelector('i')!.className).toContain('bg-cave-800');
    expect(enCours()).toBeNull();
    expect(lecture.className).not.toContain('font-semibold');
    fireEvent.click(bouton('Lire 2 pages'));
    expect(await screen.findByText('Préparation des pages…')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Lire/ })).toBeNull();
    expect(frise().textContent).toBe('2 pages ✓lecturevérification');
    expect(enCours()).toBeTruthy();
    expect(([...frise().children] as HTMLElement[])[1].className).toContain('font-semibold');
    expect(etat.pages).not.toHaveBeenCalled();
    await act(async () => { finAssemblage({ file: new File(['%PDF-1.4'], 'Justificatif-2-pages.pdf', { type: 'application/pdf' }), octets: 1_800_000, reduite: true }); });
    await waitFor(() => expect(etat.pages).toHaveBeenCalledTimes(1));
    expect(frise().textContent).toBe('2 pages ✓lecturevérification');
    expect(frise().textContent).not.toContain('envoi');
    expect((document.querySelector('[data-dp="lecture"]') as HTMLElement).textContent).toMatch(/2 pages.*1,8 Mo.*réduites/);
    expect(lectureOk).toBeTruthy();
  });
  it('T-R8b : un document seul garde sa frise d\'aujourd\'hui (« envoi ✓ », « lecture » en cours)', async () => {
    etat.scanned.mockReturnValue(new Promise(() => undefined));
    const view = await monter();
    const f = image('facture.pdf', '%PDF-1.4\nx\n', undefined, 'application/pdf');
    fireEvent.change(champFichier(view), { target: { files: [f] } });
    await waitFor(() => expect(frise()).toBeTruthy());
    expect(frise().textContent).toBe('envoi ✓lecturevérification');
    expect(enCours()).toBeTruthy();
  });
});

describe('T-R10 une page ajoutée pendant « Lire » n\'entre ni dans la pile ni dans « N pages »', () => {
  it('l\'empreinte de la 3ᵉ page arrive après le toucher de « Lire 2 pages » : la lecture, le PDF et la carte restent à 2 pages', async () => {
    etat.pages.mockReturnValue(new Promise(() => undefined));
    const view = await monter();
    await ouvrirRangee(view, [a, b]);
    const lente = new File(['lente'], 'lente.jpg', { type: 'image/jpeg' });
    let livrer: (() => void) | undefined;
    Object.defineProperty(lente, 'arrayBuffer', { value: () => new Promise<ArrayBuffer>(ok => { livrer = () => ok(new TextEncoder().encode('lente').buffer); }) });
    fireEvent.change(champPages(view), { target: { files: [lente] } });
    await waitFor(() => expect(livrer).toBeTypeOf('function'));
    fireEvent.click(bouton('Lire 2 pages'));
    await waitFor(() => expect(etat.pages).toHaveBeenCalledTimes(1));
    await act(async () => { livrer!(); await new Promise(r => setTimeout(r, 20)); });
    expect(etat.pages.mock.calls[0][0]).toHaveLength(2);
    const carte = document.querySelector('[data-dp="lecture"]') as HTMLElement;
    expect(carte.textContent).toContain('2 pages');
    expect(carte.textContent).not.toContain('3 pages');
    expect(carte.querySelectorAll('[data-dp="mini-pages"] > div')).toHaveLength(2);
    expect(frise().textContent).toBe('2 pages ✓lecturevérification');
  });
});

describe('T-R11 l\'assemblage échoue : une issue, sans retirer toutes les pages', () => {
  it('le message reste ; sous lui, « Saisir sans justificatif » (le lien de l\'entrée) ouvre le formulaire, pages retirées, rien n\'est lu', async () => {
    etat.assembler.mockRejectedValue(new Error('Ces pages sont trop lourdes pour le Drive même réduites : retire une page.'));
    const view = await monter();
    await ouvrirRangee(view, [a, b, c]);
    expect(screen.queryByRole('button', { name: 'Saisir sans justificatif' })).toBeNull();
    fireEvent.click(bouton('Lire 3 pages'));
    await alerte('trop lourdes pour le Drive');
    const rangee = document.querySelector('[data-dp="rangee-pages"]') as HTMLElement;
    expect(rangee).toBeTruthy();
    const lien = bouton('Saisir sans justificatif');
    expect(rangee.contains(lien)).toBe(true);
    expect(lien.className).toContain('underline');
    expect(document.querySelector('#purchase-total')).toBeNull();
    fireEvent.click(lien);
    await waitFor(() => expect(document.querySelector('#purchase-total')).toBeTruthy());
    expect(document.querySelector('[data-dp="rangee-pages"]')).toBeNull();
    expect(nbPages(view)).toBe(0);
    expect(etat.pages).not.toHaveBeenCalled();
    expect(etat.scanned).not.toHaveBeenCalled();
  });
  it('retirer une page après l\'échec fait disparaître le lien (la rangée est de nouveau à lire)', async () => {
    etat.assembler.mockRejectedValueOnce(new Error('Ces pages sont trop lourdes pour le Drive même réduites : retire une page.'));
    const view = await monter();
    await ouvrirRangee(view, [a, b, c]);
    fireEvent.click(bouton('Lire 3 pages'));
    await alerte('trop lourdes pour le Drive');
    expect(bouton('Saisir sans justificatif')).toBeTruthy();
    fireEvent.click(bouton('Retirer la page 3'));
    expect(screen.queryByRole('button', { name: 'Saisir sans justificatif' })).toBeNull();
  });
});
