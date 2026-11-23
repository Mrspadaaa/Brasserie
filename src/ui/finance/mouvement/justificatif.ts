import { prepareFinanceDocument, saveFinanceDocumentConfirmed } from '../../../services/financeDocuments';
import { dropQueuedProof, enqueueProof, proofQueueAvailable, runProofQueue } from '../../../services/proofQueue';

/**
 * Le justificatif d'un apport ou d'un prélèvement privé (m5ap-a : « relevé ou quittance »).
 * C'est le mécanisme de pièce jointe des dépenses et des ventes, sans chemin parallèle : le fichier est contrôlé par `prepareFinanceDocument`,
 * puis mis dans la file locale des justificatifs (envoi au Drive en arrière-plan, lien posé sur l'écriture une fois l'envoi fait, hors ligne compris) ;
 * sans file (pas d'IndexedDB, pleine, pas de session) il est confirmé dans Drive AVANT l'écriture, comme pour une dépense.
 * L'identifiant du document est `proof-<id de l'écriture>` : une écriture, un justificatif.
 */
export const PIECE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const PIECE_MAX_OCTETS = 4 * 1024 * 1024;
export const PIECE_REFUS = 'Choisis un JPG, PNG, WebP ou PDF de 4 Mo maximum.';

export interface PieceJointe { name: string; mime: string; dataUrl: string; size: number }

const mimeDe = (file: File): string => file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '');

/** Lit le fichier choisi ; un format ou un poids refusé se dit en clair, rien n'est gardé. */
export async function lirePiece(file: File): Promise<PieceJointe> {
  const mime = mimeDe(file);
  if (!PIECE_TYPES.includes(mime) || file.size > PIECE_MAX_OCTETS) throw new Error(PIECE_REFUS);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result));
    lecteur.onerror = () => reject(new Error('Le justificatif ne peut pas être lu. Choisis-le à nouveau.'));
    lecteur.readAsDataURL(file);
  });
  return { name: file.name, mime, dataUrl, size: file.size };
}

export interface EnvoiPiece {
  proof: ReturnType<typeof prepareFinanceDocument>;
  driveName: string; originalName: string; mime: string; year: number;
}
/** Contrôle le fichier (format, contenu, 4 Mo) et lui donne son nom lisible de Drive : « 2026-11-09 Apport privé.pdf ». Lève sans rien écrire si le fichier est invalide. */
export async function preparerEnvoi(piece: PieceJointe, id: string, date: string, libelle: string): Promise<EnvoiPiece> {
  const { driveProofFileName } = await import('../../../services/purchaseEntry');
  const driveName = driveProofFileName({ date, vendor: libelle, invoiceNumber: '', mimeType: piece.mime, originalName: piece.name });
  const proof = prepareFinanceDocument(`proof-${id}`, piece.dataUrl, driveName, piece.mime);
  return { proof, driveName, originalName: piece.name, mime: piece.mime, year: Number(date.slice(0, 4)) };
}

/**
 * Met le fichier à l'abri avant d'écrire l'opération. `file` : il attend dans la file locale, l'écriture porte `finance.proofUpload` ;
 * `drive` : il est confirmé dans Drive, l'écriture porte `finance.proofDocumentId`. Une erreur (Drive refuse, hors connexion sans file) remonte : rien n'est écrit.
 */
export async function placerPiece(envoi: EnvoiPiece, id: string): Promise<{ voie: 'file'; uid: string } | { voie: 'drive' }> {
  if (proofQueueAvailable()) {
    try {
      const uid = (await import('../../../services/firebaseAuth')).FirebaseAuthService.getCurrentUser()?.uid;
      if (uid) {
        await enqueueProof({ submissionId: id, transactionId: id, dataUrl: envoi.proof.parts.join(''), mimeType: envoi.mime, driveName: envoi.driveName, originalName: envoi.originalName, year: envoi.year, uid });
        return { voie: 'file', uid };
      }
    } catch { /* file indisponible ou pleine : chemin synchrone, rien ne se perd */ }
  }
  await saveFinanceDocumentConfirmed(envoi.proof, envoi.year);
  return { voie: 'drive' };
}

/** L'écriture n'a pas eu lieu : la ligne de la file n'a plus d'objet (le fichier est encore dans la feuille). */
export async function retirerDeLaFile(id: string): Promise<void> { await dropQueuedProof(id); }
/** Une fois l'écriture posée : un tour de la file, qui envoie le fichier au Drive puis pose le lien sur l'écriture. Ne lève jamais. */
export function lancerEnvoi(): void { void runProofQueue('save'); }
