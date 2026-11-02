// Plusieurs pages pour une seule dépense (n2-pages, son choix D291) : les plafonds, l'empreinte des pages et le justificatif PDF.
// La lecture reçoit les images ORIGINALES (une part par page, comme le banc) ; le PDF assemblé ici est la PREUVE gardée au Drive (4 Mo au plus).
// Aucun réseau, aucun Gemini : tout se passe dans le téléphone.

export const PAGES_MAX = 4;
const MO = 1024 * 1024;
/** Une page : la règle de « Un document » aujourd'hui. */
export const PAGE_OCTETS_MAX = 4 * MO;
/** Toutes les pages : « 12 Mo » décimal, une seule borne. Le serveur (`MAX_PAGES_B64` de `functions/src/ai.ts`) la lit en caractères de base64 : `CARACTERES_B64_MAX`. */
export const TOTAL_OCTETS_MAX = 12_000_000;
/** La borne du serveur, en caractères de base64 (la même constante que `MAX_PAGES_B64`) ; le test T-S8 relie les deux. */
export const CARACTERES_B64_MAX = 16_000_000;
/** Ce que ces pages pèsent une fois envoyées : chaque page est encodée à part, avec son rembourrage. */
export const caracteresB64 = (tailles: ReadonlyArray<number>) => tailles.reduce((somme, octets) => somme + 4 * Math.ceil(octets / 3), 0);
/** Le total des pages respecte la borne unique (octets décimaux ET caractères du serveur). */
export const totalAdmis = (tailles: ReadonlyArray<number>) => tailles.reduce((somme, octets) => somme + octets, 0) <= TOTAL_OCTETS_MAX && caracteresB64(tailles) <= CARACTERES_B64_MAX;
/** Le PDF doit tenir dans les 4 Mo du Drive (`MAX_DRIVE_ORIGINAL_BYTES`) avec une marge. */
export const PLAFOND_PDF_OCTETS = Math.floor(3.9 * MO);
/** Du moins coûteux au plus fort : côté long en pixels, qualité JPEG. Le premier niveau dont le PDF tient gagne. */
export const NIVEAUX: ReadonlyArray<{ cote: number; qualite: number }> = [{ cote: 2400, qualite: 0.9 }, { cote: 2000, qualite: 0.82 }, { cote: 1600, qualite: 0.75 }, { cote: 1280, qualite: 0.68 }];
export const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

/** Une page de la rangée : le fichier original, sa vignette (URL d'objet) et son empreinte sha256 (hex). */
export interface PageRangee { id: string; file: File; url: string; empreinte: string }

/** Un poids en Mo, arrondi vers le haut à un chiffre : la page en Mo binaire (comme « Un document »), le total en Mo décimal (`unite`). */
const fr1 = (octets: number, unite = MO) => (Math.ceil(octets / unite * 10) / 10).toFixed(1).replace('.', ',');

/** Pourquoi cette page n'entre pas dans la rangée, ou `null`. Les plafonds se lisent sur `deja` (les pages déjà prises, dans l'ordre). */
export function refuserPage(file: File, deja: ReadonlyArray<{ file: File; empreinte: string }>, empreinte?: string): string | null {
  const type = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : '');
  if (type === 'application/pdf') return 'Un PDF se lit avec « Un document ».';
  if (!TYPES_IMAGE.includes(type)) return 'Choisis une image JPG, PNG ou WebP.';
  if (deja.length >= PAGES_MAX) return `${PAGES_MAX} pages au plus.`;
  if (file.size > PAGE_OCTETS_MAX) return `Cette page pèse ${fr1(file.size)} Mo : 4 Mo au plus.`;
  const tailles = [...deja.map(page => page.file.size), file.size];
  if (!totalAdmis(tailles)) return `Les pages pèsent ${fr1(tailles.reduce((somme, octets) => somme + octets, 0), 1e6)} Mo : 12 Mo au plus.`;
  if (empreinte && deja.some(page => page.empreinte === empreinte)) return 'Cette page est déjà ajoutée.';
  return null;
}

const octetsDe = (file: Blob): Promise<ArrayBuffer> => typeof (file as File).arrayBuffer === 'function'
  ? (file as File).arrayBuffer()
  : new Promise((ok, ko) => { const lecteur = new FileReader(); lecteur.onload = () => ok(lecteur.result as ArrayBuffer); lecteur.onerror = () => ko(new Error('Cette page ne peut pas être lue.')); lecteur.readAsArrayBuffer(file); });
const hex = (octets: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(octets as ArrayBuffer), b => b.toString(16).padStart(2, '0')).join('');

/** L'empreinte sha256 (hex) d'une page. */
export async function empreinteDePage(file: File): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', await octetsDe(file)));
}

/**
 * L'empreinte d'un lot de pages : sha256 de la suite des empreintes BRUTES (32 octets chacune, dans l'ordre), pas des chaînes hex.
 * C'est la formule du serveur (`cleDePages` puis `invoiceDocumentHash`) : mêmes pages dans le même ordre = même empreinte, autre ordre = autre lecture.
 * Pas d'empreinte du PDF : jsPDF y écrit la date de création, le même justificatif aurait deux empreintes.
 */
export async function empreinteDesPages(empreintes: string[]): Promise<string> {
  const brut = new Uint8Array(empreintes.length * 32);
  empreintes.forEach((h, i) => { for (let k = 0; k < 32; k++) brut[i * 32 + k] = parseInt(h.slice(k * 2, k * 2 + 2), 16); });
  return hex(await crypto.subtle.digest('SHA-256', brut));
}

export interface PageEncodee { octets: Uint8Array; largeur: number; hauteur: number }
export type Encodeur = (file: File, niveau: { cote: number; qualite: number }) => Promise<PageEncodee>;

async function chargerImage(file: File): Promise<{ source: CanvasImageSource; largeur: number; hauteur: number; fermer: () => void }> {
  // L'orientation EXIF d'une photo de téléphone est appliquée par le décodeur ; sans `createImageBitmap` (Safari ancien) ou si l'option échoue, <img> et son canvas la respectent aussi.
  if (typeof createImageBitmap === 'function') {
    try { const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); return { source: bitmap, largeur: bitmap.width, hauteur: bitmap.height, fermer: () => bitmap.close?.() }; } catch { /* repli par <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((ok, ko) => { image.onload = () => ok(); image.onerror = () => ko(new Error('Cette page n’est pas une image lisible.')); image.src = url; });
    return { source: image, largeur: image.naturalWidth || image.width, hauteur: image.naturalHeight || image.height, fermer: () => URL.revokeObjectURL(url) };
  } catch (erreur) { URL.revokeObjectURL(url); throw erreur; }
}

/** L'encodeur par défaut : la page passe par un canvas (orientation respectée, côté long ramené à `cote`) puis JPEG. */
export const encodeurCanvas: Encodeur = async (file, niveau) => {
  const image = await chargerImage(file);
  try {
    const echelle = Math.min(1, niveau.cote / Math.max(image.largeur, image.hauteur));
    const largeur = Math.max(1, Math.round(image.largeur * echelle)), hauteur = Math.max(1, Math.round(image.hauteur * echelle));
    const canvas = document.createElement('canvas');
    canvas.width = largeur; canvas.height = hauteur;
    const contexte = canvas.getContext('2d');
    if (!contexte) throw new Error('Cette page ne peut pas être préparée sur cet appareil.');
    contexte.fillStyle = '#ffffff'; contexte.fillRect(0, 0, largeur, hauteur);
    contexte.drawImage(image.source, 0, 0, largeur, hauteur);
    const binaire = atob(canvas.toDataURL('image/jpeg', niveau.qualite).split(',')[1] ?? '');
    return { octets: Uint8Array.from(binaire, c => c.charCodeAt(0)), largeur, hauteur };
  } finally { image.fermer(); }
};

export interface PdfAssemble { file: File; octets: number; reduite: boolean }

/**
 * Le justificatif : un PDF d'une page par image, dans l'ordre, largeur 210 mm, hauteur selon l'image. Le premier niveau de réduction dont le PDF tient sous
 * `PLAFOND_PDF_OCTETS` gagne (`reduite` dit si ce n'est pas le premier). Aucun niveau ne tient : refus, avant toute lecture payante.
 */
export async function assemblerPdf(pages: File[], options: { encoder?: Encodeur; plafond?: number } = {}): Promise<PdfAssemble> {
  const encoder = options.encoder ?? encodeurCanvas, plafond = options.plafond ?? PLAFOND_PDF_OCTETS;
  const { jsPDF } = await import('jspdf');
  for (const [rang, niveau] of NIVEAUX.entries()) {
    const encodees: PageEncodee[] = [];
    for (const page of pages) encodees.push(await encoder(page, niveau));
    let doc: InstanceType<typeof jsPDF> | undefined;
    for (const [i, p] of encodees.entries()) {
      const h = Math.round(210 * p.hauteur / p.largeur * 100) / 100, orientation = p.largeur > p.hauteur ? 'landscape' : 'portrait';
      if (!doc) doc = new jsPDF({ unit: 'mm', format: [210, h], orientation, compress: false }); else doc.addPage([210, h], orientation);
      /* Un alias par page : jsPDF réunit sinon deux images qu'il croit identiques (même empreinte de début), et une page disparaîtrait. */
      doc.addImage(p.octets, 'JPEG', 0, 0, 210, h, `page-${i + 1}`);
    }
    const sortie = doc!.output('arraybuffer');
    if (sortie.byteLength <= plafond) {
      return { file: new File([sortie], `Justificatif-${pages.length}-pages.pdf`, { type: 'application/pdf' }), octets: sortie.byteLength, reduite: rang > 0 };
    }
  }
  throw new Error('Ces pages sont trop lourdes pour le Drive même réduites : retire une page.');
}
