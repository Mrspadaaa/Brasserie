// @vitest-environment jsdom
/**
 * En ligne le 02.11 : son ticket photographié au téléphone (3072 × 4096, 8,1 Mo) était refusé, « 4 Mo maximum », par « Un document » comme par
 * « Plusieurs ». Une photo de plus de 4 Mo est maintenant réencodée dans le téléphone, au plus haut niveau qui tient, avant l'empreinte et la lecture.
 * T-A1 à T-A4 : `allegerPhoto` seul, encodeur simulé · T-A5 « Un document » · T-A6 « Plusieurs » · le refus d'aujourd'hui quand rien ne lit l'image (rangee).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allegerPhoto, NIVEAUX_PHOTO, PAGE_OCTETS_MAX, type Encodeur } from '../../../../src/services/pagesJustificatif';
import { etat, preparer, monter, champFichier, champPages, nbPages, image, lectureOk, ouvrirRangee, MO, fireEvent, screen, waitFor } from './cadre';

vi.mock('../../../../src/services/storage', async () => (await import('./cadre')).storageMock());
vi.mock('../../../../src/services/financeService', async () => (await import('./cadre')).financeMock());
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./cadre')).firestoreMock());
vi.mock('../../../../src/services/geminiScanner', async () => (await import('./cadre')).scannerMock());
vi.mock('../../../../src/services/qrLecture', async () => (await import('./cadre')).qrMock());
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => (await import('./cadre')).purchaseMock(await importOriginal()));
vi.mock('../../../../src/services/pagesJustificatif', async importOriginal => (await import('./cadre')).pagesMock(await importOriginal()));
vi.mock('../../../../src/ui/useViewport', async importOriginal => (await import('./cadre')).viewportMock(await importOriginal()));
beforeEach(() => {
  preparer();
  // Le File de jsdom n'a pas `arrayBuffer` ; celui du navigateur l'a (l'empreinte de « Un document » le lit).
  if (typeof File.prototype.arrayBuffer !== 'function') Object.defineProperty(File.prototype, 'arrayBuffer', { configurable: true, value(this: Blob) { return new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsArrayBuffer(this); }); } });
});
afterEach(() => vi.unstubAllGlobals());

/** Un encodeur simulé : le poids rendu à chaque niveau, dans l'ordre des niveaux. */
const encodeurDe = (poids: number[]): Encodeur & { mock: { calls: unknown[][] } } =>
  vi.fn(async (_f: File, niveau: { cote: number }) => ({ octets: new Uint8Array(poids[NIVEAUX_PHOTO.findIndex(n => n === niveau)] ?? 1), largeur: niveau.cote, hauteur: niveau.cote })) as any;
const photo = (nom = 'ticket.jpg', taille = 8_346_000) => image(nom, `photo ${nom}`, taille);

describe('T-A1 à T-A4 allegerPhoto', () => {
  it('T-A1 : une photo de 8,1 Mo est réencodée au premier niveau qui tient sous 4 Mo, en JPEG, sous son nom', async () => {
    const encoder = encodeurDe([5 * MO, 2 * MO]);
    const sortie = await allegerPhoto(photo(), encoder);
    expect(encoder.mock.calls.length).toBe(2);
    expect(sortie.size).toBe(2 * MO);
    expect(sortie.size).toBeLessThanOrEqual(PAGE_OCTETS_MAX);
    expect([sortie.type, sortie.name]).toEqual(['image/jpeg', 'ticket.jpg']);
  });
  it('T-A2 : le premier niveau garde la taille de la photo (côté long 4096), la qualité baisse ensuite par paliers', () => {
    expect(NIVEAUX_PHOTO[0].cote).toBeGreaterThanOrEqual(4096);
    expect(NIVEAUX_PHOTO.map(n => n.cote)).toEqual([...NIVEAUX_PHOTO.map(n => n.cote)].sort((a, b) => b - a));
  });
  it('T-A3 : une image de 4 Mo ou moins, et un PDF, repartent tels quels, sans encodage', async () => {
    const encoder = encodeurDe([1]);
    const legere = image('leger.jpg', 'leger', PAGE_OCTETS_MAX);
    const pdf = image('f.pdf', 'pdf', 6 * MO, 'application/pdf');
    expect(await allegerPhoto(legere, encoder)).toBe(legere);
    expect(await allegerPhoto(pdf, encoder)).toBe(pdf);
    expect(encoder.mock.calls.length).toBe(0);
  });
  it('T-A4 : trop lourde à tous les niveaux, ou illisible ici : la photo d\'origine revient (le refus d\'aujourd\'hui, avec son poids)', async () => {
    const lourde = photo();
    expect(await allegerPhoto(lourde, encodeurDe(NIVEAUX_PHOTO.map(() => 5 * MO)))).toBe(lourde);
    expect(await allegerPhoto(lourde, vi.fn(async () => { throw new Error('pas de canvas'); }))).toBe(lourde);
  });
});

/** Le canvas simulé (comme encodeur.test.ts) : le VRAI encodeur réduit la photo à un petit JPEG ; l'encodeur du cadre rend le même poids. */
const JPEG_URL = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')}`;
const canvasSimule = () => {
  vi.stubGlobal('createImageBitmap', async () => ({ width: 3072, height: 4096, close: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '' } as any);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(JPEG_URL);
  etat.encodeur.mockImplementation(encodeurDe([4]));
};

describe('T-A5 / T-A6 dans la fiche', () => {
  it('T-A5 : « Un document » avec la photo de 8,1 Mo → lue une fois, allégée en JPEG, sans le refus « 4 Mo maximum »', async () => {
    canvasSimule();
    etat.scanned.mockResolvedValue(lectureOk());
    const view = await monter();
    fireEvent.change(champFichier(view), { target: { files: [photo()] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(etat.scanned).toHaveBeenCalledTimes(1);
    const lu = etat.scanned.mock.calls[0][0] as File;
    expect([lu.type, lu.name, lu.size]).toEqual(['image/jpeg', 'ticket.jpg', 4]);
    expect(screen.queryByText(/4 Mo maximum/)).toBeNull();
  });
  it('T-A6 : « Plusieurs » avec une page de 8,1 Mo → la page entre dans la rangée, allégée', async () => {
    canvasSimule();
    const view = await monter();
    await ouvrirRangee(view, [image('a.jpg')]);
    fireEvent.change(champPages(view), { target: { files: [photo('page2.jpg')] } });
    await waitFor(() => expect(nbPages(view)).toBe(2));
    expect(screen.queryByText(/4 Mo au plus/)).toBeNull();
  });
});
