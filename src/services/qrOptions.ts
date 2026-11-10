// Les réglages du décodeur de QR (zxing-wasm), partagés par la page (`qrLecture.ts`) et le Worker (`qr.worker.ts`) : un seul endroit, jamais deux copies qui divergent.
export const OPTIONS_ZXING = { formats: ['QRCode' as const], tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 4, returnErrors: true };

/** Au plus ×2, et jamais au-delà de 4 000 px de côté (mémoire d'un téléphone). `null` : le gain serait trop faible, pas de seconde passe. */
export function facteurAgrandi(largeur: number, hauteur: number): number | null {
  const facteur = Math.min(2, 4000 / Math.max(largeur, hauteur));
  return facteur <= 1.05 ? null : facteur;
}

/**
 * LO-5 (08.11, doc5) : un QR vu net mais barré (le tampon « bereits dankend » imprimé sur la pièce) n'est pas relu par une nouvelle photo. Mesuré au banc : 5 px par
 * module, Reed-Solomon dépassé ; recadrage, agrandissement ×1 à ×6, canaux, binariseurs, débruitage, comblement du rouge : 0 lecture sur 164 essais
 * (`work/missions/2026-11-09-banc-gemini/MISSION.md`). Au-delà de ce pas, l'échec ne vient pas de la résolution : « Photographier le QR » ne sert à rien.
 */
export const PAS_LISIBLE_PX = 4;
type Coin = { x: number; y: number };
/** Ce que zxing rend d'un symbole, réduit à ce dont on a besoin (zxing-wasm `ReadResult`). */
export interface SymboleZxing { text?: string; isValid: boolean; version?: string; position?: { topLeft: Coin; topRight: Coin; bottomLeft: Coin; bottomRight: Coin } }
const distance = (a: Coin, b: Coin) => Math.hypot(a.x - b.x, a.y - b.y);
/** Pixels par module d'un QR vu : côté moyen des quatre bords ÷ (4 × version + 17). `undefined` sans version ni position lisibles. */
export function pasDuModule(symbole: SymboleZxing): number | undefined {
  const version = Number(symbole.version), p = symbole.position;
  if (!Number.isInteger(version) || version < 1 || version > 40 || !p) return undefined;
  const cote = (distance(p.topLeft, p.topRight) + distance(p.topRight, p.bottomRight) + distance(p.bottomRight, p.bottomLeft) + distance(p.bottomLeft, p.topLeft)) / 4;
  const pas = cote / (4 * version + 17);
  return Number.isFinite(pas) && pas > 0 ? Math.round(pas * 10) / 10 : undefined;
}
/** Un symbole lu par zxing, tel que la lecture du QR le range : son texte, s'il est décodé, et (vu sans être décodé) le pas de ses modules. */
export function codeDeZxing(symbole: SymboleZxing): { texte: string; decode: boolean; pasPx?: number } {
  const pas = symbole.isValid ? undefined : pasDuModule(symbole);
  return { texte: symbole.text ?? '', decode: symbole.isValid, ...(pas !== undefined ? { pasPx: pas } : {}) };
}
