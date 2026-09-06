/**
 * Compression des justificatifs avant écriture.
 *
 * ⚠️ Pourquoi c'est indispensable : un justificatif est stocké encodé en base64
 * dans le document Firestore, dont le plafond est **1 Mio**. L'encodage base64
 * gonfle le fichier d'environ 37 %. Une photo de téléphone pèse 2 à 5 Mo, soit
 * 2.7 à 6.9 Mo encodée : AUCUNE ne passe, et comme l'écriture est atomique,
 * l'échec emporte la facture entière avec elle.
 *
 * Redimensionnée à 1600 px et réencodée en JPEG qualité 0.75, la même photo
 * tombe autour de 200 Ko — largement sous le plafond, et parfaitement lisible
 * pour une facture. Aucune dépendance : `canvas` suffit.
 *
 * Les PDF ne sont pas compressibles ici ; ils sont refusés au-delà de la limite
 * avec un message explicite, plutôt que de faire échouer l'enregistrement.
 */

/** Marge de sécurité sous le plafond Firestore de 1 Mio. */
const MAX_ENCODED_BYTES = 700 * 1024;

/** Au-delà, une facture n'est pas plus lisible — seulement plus lourde. */
const MAX_DIMENSION = 1600;

export interface CompressionResult {
  ok: boolean;
  /** Data URL prête à être stockée. */
  dataUrl?: string;
  mimeType?: string;
  originalBytes: number;
  finalBytes?: number;
  /** Message explicite quand le fichier ne peut pas être conservé. */
  error?: string;
  /** Résumé lisible, affiché à l'utilisateur. */
  summary?: string;
}

/** Taille réelle d'une Data URL une fois décodée du base64. */
function encodedBytes(dataUrl: string): number {
  const payload = dataUrl.split(',')[1] ?? '';
  return Math.ceil((payload.length * 3) / 4);
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Ce fichier n'est pas une image lisible."));
    img.src = dataUrl;
  });
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export const ImageCompression = {
  /**
   * Prépare un justificatif pour l'enregistrement.
   *
   * Les images sont redimensionnées et recompressées jusqu'à tenir sous la
   * limite ; la qualité baisse par paliers plutôt que d'échouer d'emblée.
   */
  async prepare(file: File): Promise<CompressionResult> {
    const originalBytes = file.size;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const dataUrl = await readAsDataUrl(file);
      const size = encodedBytes(dataUrl);
      if (size > MAX_ENCODED_BYTES) {
        return {
          ok: false,
          originalBytes,
          error:
            `Ce PDF pèse ${humanSize(originalBytes)}, au-delà de ce qui peut être conservé ` +
            `dans l'écriture (${humanSize(MAX_ENCODED_BYTES)}). Un PDF ne peut pas être ` +
            `compressé ici : photographie plutôt le document, ou allège-le avant de le joindre.`
        };
      }
      return {
        ok: true,
        dataUrl,
        mimeType: 'application/pdf',
        originalBytes,
        finalBytes: size,
        summary: `PDF conservé tel quel (${humanSize(size)}).`
      };
    }

    let source: string;
    try {
      source = await readAsDataUrl(file);
    } catch (err: any) {
      return { ok: false, originalBytes, error: err.message };
    }

    let img: HTMLImageElement;
    try {
      img = await loadImage(source);
    } catch (err: any) {
      return { ok: false, originalBytes, error: err.message };
    }

    // Redimensionnement proportionnel sur le plus grand côté.
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ok: false, originalBytes, error: 'Compression impossible sur ce navigateur.' };
    }

    // Fond blanc : un JPEG n'a pas de transparence, sans ça un PNG transparent
    // ressortirait sur fond noir et deviendrait illisible.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // On descend la qualité par paliers jusqu'à tenir sous la limite.
    for (const quality of [0.75, 0.6, 0.45, 0.3]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const size = encodedBytes(dataUrl);
      if (size <= MAX_ENCODED_BYTES) {
        const saved = Math.max(0, Math.round((1 - size / originalBytes) * 100));
        return {
          ok: true,
          dataUrl,
          mimeType: 'image/jpeg',
          originalBytes,
          finalBytes: size,
          summary:
            `Photo allégée de ${humanSize(originalBytes)} à ${humanSize(size)}` +
            (saved > 0 ? ` (−${saved} %)` : '') +
            `, ${width}×${height} px.`
        };
      }
    }

    return {
      ok: false,
      originalBytes,
      error:
        `Cette image reste trop lourde même très compressée (${humanSize(originalBytes)} au ` +
        `départ). Reprends la photo de plus près, en cadrant uniquement le document.`
    };
  },

  /** Reconvertit une Data URL en Blob, pour l'envoi vers Drive ou le téléchargement. */
  dataUrlToBlob(dataUrl: string): Blob {
    const [header, payload] = dataUrl.split(',');
    const mime = /data:([^;]+)/.exec(header)?.[1] ?? 'application/octet-stream';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  },

  humanSize
};
