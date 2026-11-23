// @vitest-environment jsdom
/**
 * Voie n2-pages, P4 : l'encodeur de pages par défaut (canvas). jsdom n'a ni canvas ni décodeur d'image : ils sont simulés.
 * T-P6 le repli par <img> quand `createImageBitmap` manque (Safari ancien), le refus clair quand rien ne lit la page.
 * L'orientation EXIF elle-même se contrôle dans Chrome, au banc de bout en bout (cas `pages` : la page 2 est une photo à tag 6).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodeurCanvas } from '../../../../src/services/pagesJustificatif';

const JPEG_URL = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')}`;
const page = (nom: string) => new File(['x'], nom, { type: 'image/jpeg' });
afterEach(() => vi.unstubAllGlobals());
const poser = (image: 'ok' | 'erreur', bitmap?: 'ok' | 'refus') => {
  const dessin = vi.fn();
  vi.stubGlobal('createImageBitmap', bitmap === 'ok' ? async () => ({ width: 4000, height: 3000, close: vi.fn() }) : bitmap === 'refus' ? async () => { throw new Error('option non reconnue'); } : undefined);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: dessin, fillRect: vi.fn(), fillStyle: '' } as any);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(JPEG_URL);
  (URL as any).createObjectURL = vi.fn(() => 'blob:page'); (URL as any).revokeObjectURL = vi.fn();
  class FausseImage { onload: () => void = () => undefined; onerror: () => void = () => undefined; naturalWidth = 4000; naturalHeight = 3000; width = 4000; height = 3000;
    set src(_v: string) { setTimeout(() => (image === 'ok' ? this.onload() : this.onerror()), 0); } }
  vi.stubGlobal('Image', FausseImage);
  return dessin;
};

describe('T-P6 l\'encodeur par défaut', () => {
  it('avec createImageBitmap : la page est décodée par lui, ramenée au côté long du niveau', async () => {
    const dessin = poser('erreur', 'ok');
    const sortie = await encodeurCanvas(page('photo.jpg'), { cote: 2400, qualite: 0.9 });
    expect(dessin).toHaveBeenCalled();
    expect([sortie.largeur, sortie.hauteur]).toEqual([2400, 1800]);
  });
  it('sans createImageBitmap : la page passe par <img> et le canvas', async () => {
    const dessin = poser('ok');
    const sortie = await encodeurCanvas(page('photo.jpg'), { cote: 2400, qualite: 0.9 });
    expect(dessin).toHaveBeenCalled();
    expect([sortie.largeur, sortie.hauteur]).toEqual([2400, 1800]);
    expect(sortie.octets[0]).toBe(0xff);
    expect((URL as any).revokeObjectURL).toHaveBeenCalled();
  });
  it('createImageBitmap refuse l\'option : le repli par <img> prend le relais', async () => {
    poser('ok', 'refus');
    expect((await encodeurCanvas(page('photo.jpg'), { cote: 1600, qualite: 0.75 })).largeur).toBe(1600);
  });
  it('ni createImageBitmap ni <img> : refus clair', async () => {
    poser('erreur');
    await expect(encodeurCanvas(page('x.jpg'), { cote: 2400, qualite: 0.9 })).rejects.toThrow(/image lisible/);
  });
});
