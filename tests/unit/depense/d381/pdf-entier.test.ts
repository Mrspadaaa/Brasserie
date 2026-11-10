// D381, 08.11 : un PDF de 1 à 4 pages se lit ENTIER, comme PDF (couche de texte native), jamais en tranches d'image. En ligne le 08.11, la facture B&R
// de 4 pages (doc8) a été coupée en 14 morceaux par le seuil de 90 rangées de texte, alors que la lecture entière était juste au banc (C★v8).
// pdf.js est simulé : aucune page n'est rendue ici ; un rendu demandé lève « rendu demandé » (le chemin des morceaux).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const etat = vi.hoisted(() => ({ pages: 4, rangees: 40, ouvertes: 0, rendus: 0 }));

vi.mock('../../../../src/services/pdfjs', () => ({
  chargerPdfjs: async () => ({
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: etat.pages,
        getPage: async () => {
          etat.ouvertes++;
          return {
            // Une page dense de factures : `rangees` lignes de texte, une ordonnée chacune (8 points d'écart).
            getTextContent: async () => ({ items: Array.from({ length: etat.rangees }, (_, i) => ({ str: `Article ${i} 12.50`, transform: [1, 0, 0, 1, 40, 800 - 8 * i] })) }),
            getViewport: () => { etat.rendus++; throw new Error('rendu demandé'); },
            cleanup: () => {},
          };
        },
        destroy: async () => {},
      }),
    }),
  }),
}));

import { decouperPiece, PDF_PAGES_MAX } from '../../../../src/services/decoupe';

const pdf = () => new File([new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55])], 'facture.pdf', { type: 'application/pdf' });

describe('PDF : la page est l’unité, jamais la tranche sans besoin', () => {
  beforeEach(() => { etat.pages = 4; etat.rangees = 40; etat.ouvertes = 0; etat.rendus = 0; });

  it('doc8 : 4 pages denses (160 rangées de texte) → lu entier (null), sans ouvrir ni rendre une page', async () => {
    expect(PDF_PAGES_MAX).toBe(4);
    await expect(decouperPiece(pdf())).resolves.toBeNull();
    expect(etat.ouvertes).toBe(0);
    expect(etat.rendus).toBe(0);
  });

  it('1 page de 120 rangées → lu entier : la lecture coupée est rattrapée par le déclencheur « après », exact', async () => {
    etat.pages = 1; etat.rangees = 120;
    await expect(decouperPiece(pdf())).resolves.toBeNull();
    expect(etat.rendus).toBe(0);
  });

  it('5 pages (au-delà du plafond du serveur) → découpé page par page : le rendu est demandé', async () => {
    etat.pages = 5;
    await expect(decouperPiece(pdf())).rejects.toThrow('rendu demandé');
  });

  it('relecture forcée (lecture entière coupée) d’un PDF de 2 pages → découpé : le rendu est demandé', async () => {
    etat.pages = 2;
    await expect(decouperPiece(pdf(), { force: true })).rejects.toThrow('rendu demandé');
  });
});
