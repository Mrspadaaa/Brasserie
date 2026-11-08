// LO-2 : le décodeur de QR (zxing-wasm) HORS du fil de la page. Le décodage d'une photo (essais en rotation, inversion, réduction : 0,1 à 0,2 s sur un PC mesurés,
// plus sur un téléphone) et l'agrandissement de la seconde passe (canevas de 14 Mpx) ne gèlent plus l'onglet. Le wasm est un fichier de l'app (`?url`), jamais d'un CDN.
// Reçoit `{ id, op: 'lire', entree }` ou `{ id, op: 'lireAgrandie', image }` ; répond `{ id, codes }` ou `{ id, erreur }`.
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import adresseWasm from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { facteurAgrandi, OPTIONS_ZXING } from './qrOptions';

export type DemandeQr = { id: number; op: 'lire'; entree: Blob } | { id: number; op: 'lireAgrandie'; image: Blob };
/** `codes: null` : la seconde passe n'a pas lieu (image déjà grande, ou canevas absent). */
export type ReponseQr = { id: number; codes: Array<{ texte: string; decode: boolean }> | null } | { id: number; erreur: string };

prepareZXingModule({ overrides: { locateFile: (chemin: string, prefixe: string) => (chemin.endsWith('.wasm') ? adresseWasm : prefixe + chemin) } });

const codesDe = (resultats: Awaited<ReturnType<typeof readBarcodes>>) => resultats.filter(r => r.format === 'QRCode').map(r => ({ texte: r.text ?? '', decode: r.isValid }));

async function agrandie(image: Blob): Promise<ImageData | null> {
  const bitmap = await createImageBitmap(image);
  try {
    const facteur = facteurAgrandi(bitmap.width, bitmap.height);
    if (facteur === null) return null;
    const canevas = new OffscreenCanvas(Math.round(bitmap.width * facteur), Math.round(bitmap.height * facteur));
    const contexte = canevas.getContext('2d', { willReadFrequently: true });
    if (!contexte) return null;
    contexte.imageSmoothingEnabled = true; contexte.imageSmoothingQuality = 'high';
    contexte.drawImage(bitmap, 0, 0, canevas.width, canevas.height);
    return contexte.getImageData(0, 0, canevas.width, canevas.height);
  } finally { bitmap.close(); }
}

self.onmessage = async (message: MessageEvent<DemandeQr>) => {
  const demande = message.data;
  let reponse: ReponseQr;
  try {
    if (demande.op === 'lire') reponse = { id: demande.id, codes: codesDe(await readBarcodes(demande.entree, OPTIONS_ZXING)) };
    else {
      const grande = await agrandie(demande.image);
      reponse = { id: demande.id, codes: grande ? codesDe(await readBarcodes(grande, OPTIONS_ZXING)) : null };
    }
  } catch (erreur) {
    reponse = { id: demande.id, erreur: erreur instanceof Error ? erreur.message : String(erreur) };
  }
  (self as unknown as { postMessage(m: ReponseQr): void }).postMessage(reponse);
};
