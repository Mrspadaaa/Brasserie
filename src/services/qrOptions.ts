// Les réglages du décodeur de QR (zxing-wasm), partagés par la page (`qrLecture.ts`) et le Worker (`qr.worker.ts`) : un seul endroit, jamais deux copies qui divergent.
export const OPTIONS_ZXING = { formats: ['QRCode' as const], tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 4, returnErrors: true };

/** Au plus ×2, et jamais au-delà de 4 000 px de côté (mémoire d'un téléphone). `null` : le gain serait trop faible, pas de seconde passe. */
export function facteurAgrandi(largeur: number, hauteur: number): number | null {
  const facteur = Math.min(2, 4000 / Math.max(largeur, hauteur));
  return facteur <= 1.05 ? null : facteur;
}
