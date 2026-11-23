/**
 * Photo du carnet (§ Points ouverts 8) : réduction par canvas, 1 280 px au plus sur le grand côté, 150 ko au plus, en JPEG.
 * Méthode standard (MISSION § État de l'art, ligne « Photo ») : `createImageBitmap`, canvas, `toBlob('image/jpeg')`, qualité
 * descendante puis côté réduit si le poids dépasse encore. La photo n'est pas lue par l'IA (accord) : « photo non lue ».
 */
export const COTE_MAX = 1280;
export const POIDS_MAX = 150_000;
const QUALITES = [0.82, 0.72, 0.62, 0.52, 0.42];

/** Dimensions cibles, proportions gardées ; jamais d'agrandissement. */
export function dimensionsCible(largeur: number, hauteur: number, max = COTE_MAX): { largeur: number; hauteur: number } {
  if (!(largeur > 0) || !(hauteur > 0)) return { largeur: 0, hauteur: 0 };
  const k = Math.min(1, max / Math.max(largeur, hauteur));
  return { largeur: Math.max(1, Math.round(largeur * k)), hauteur: Math.max(1, Math.round(hauteur * k)) };
}

/** Poids réel d'une URL de données base64 (en octets). */
export function poidsDataUrl(url: string): number {
  const i = url.indexOf(',');
  const b64 = i >= 0 ? url.slice(i + 1) : url;
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

function versDataUrl(blob: Blob): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const r = new FileReader();
    r.onload = () => resoudre(String(r.result));
    r.onerror = () => rejeter(r.error ?? new Error('lecture impossible'));
    r.readAsDataURL(blob);
  });
}

function encoder(canvas: HTMLCanvasElement, qualite: number): Promise<Blob | null> {
  return new Promise(resoudre => canvas.toBlob(b => resoudre(b), 'image/jpeg', qualite));
}

/**
 * Réduit une photo en JPEG ≤ 150 ko. Rend l'URL de données, ou `null` si le navigateur ne sait pas la lire
 * (rien n'est inventé : l'écran dit alors que la photo n'a pas pu être gardée).
 */
export async function reduirePhoto(fichier: Blob, max = COTE_MAX, poidsMax = POIDS_MAX): Promise<string | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;
  let image: ImageBitmap;
  try { image = await createImageBitmap(fichier); } catch { return null; }
  let { largeur, hauteur } = dimensionsCible(image.width, image.height, max);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx || !largeur) { image.close?.(); return null; }
  try {
    for (let essai = 0; essai < 4; essai += 1) {
      canvas.width = largeur; canvas.height = hauteur;
      ctx.drawImage(image, 0, 0, largeur, hauteur);
      for (const q of QUALITES) {
        const blob = await encoder(canvas, q);
        if (blob && blob.size <= poidsMax) return await versDataUrl(blob);
      }
      ({ largeur, hauteur } = dimensionsCible(largeur, hauteur, Math.round(Math.max(largeur, hauteur) * 0.75)));
    }
    return null;
  } finally {
    image.close?.();
  }
}
