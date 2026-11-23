import { doc, getDoc, getDocFromServer, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreRepo } from './firestoreRepo';
import { driveFinanceMetadata, isDriveFinanceOriginal } from '../../functions/src/financeOriginalCore';

const CHUNK=400_000, MAX=5_600_000;
export function prepareFinanceDocument(id:string,dataUrl:string,fileName:string,mimeType:string) {
  if (!/^[A-Za-z0-9-]{8,100}$/.test(id) || dataUrl.length>MAX || !/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/]+=*$/.test(dataUrl)) throw new Error('Justificatif invalide (4 Mo maximum).');
  if(!dataUrl.startsWith(`data:${mimeType};base64,`))throw new Error('Le format du justificatif ne correspond pas à son contenu.');
  const parts=Array.from({length:Math.ceil(dataUrl.length/CHUNK)},(_,index)=>dataUrl.slice(index*CHUNK,(index+1)*CHUNK));
  return {id,fileName:fileName.slice(0,200),mimeType,parts};
}
/** Legacy encoding retained for local previews and portable archive fixtures. */
export function saveFinanceDocument(prepared:ReturnType<typeof prepareFinanceDocument>) {
  const {id,fileName,mimeType,parts}=prepared;
  FirestoreRepo.put('financeDocuments',id,{id,fileName,mimeType,chunkCount:parts.length,length:parts.join('').length,createdAt:new Date().toISOString()});
  parts.forEach((data,index)=>FirestoreRepo.put('financeDocuments',`${id}-${index}`,{id:`${id}-${index}`,documentId:id,index,data}));
}
type PreparedFinanceDocument = ReturnType<typeof prepareFinanceDocument>;
/**
 * La preuve qu'un original est rangé dans Drive, telle qu'on la montre au brasseur. Chaque champ est lu : le dossier et le lien
 * viennent de Drive (absents s'ils sont illisibles, jamais déduits), `verified` dit que taille et empreinte ont été recoupées.
 */
export interface DriveProofReceipt {
  driveFileId: string;
  /** Le nom du fichier lu sur Drive (métadonnées) ; absent quand Drive ne le rend pas, jamais déduit de la saisie. */
  fileName?: string;
  bytes: number;
  sha256: string;
  verified: boolean;
  folder?: string;
  webViewLink?: string;
  /** Posé par l'appelant (achat) : le nom du fichier tel que reçu du téléphone. */
  originalFileName?: string;
}
type ProofDetails = { fileName?: string; folder?: string; webViewLink?: string; checksumVerified?: boolean };
// Le nom du reçu est celui que Drive rend (`details.fileName`) : la référence, le document Firestore et la saisie ne le disent pas.
const proofReceipt = (reference: { driveFileId: string; bytes: number; sha256: string }, details: ProofDetails, verified: boolean): DriveProofReceipt => ({
  driveFileId: reference.driveFileId, bytes: reference.bytes, sha256: reference.sha256, verified,
  ...(details.fileName ? { fileName: details.fileName } : {}),
  ...(details.folder ? { folder: details.folder } : {}), ...(details.webViewLink ? { webViewLink: details.webViewLink } : {})
});
/** Message neutre : cette attente sert aussi les ventes, remboursements et clôtures. Chaque appelant peut préciser son texte à partir du code. */
export const DRIVE_IN_PROGRESS_CODE = 'drive/in-progress';
const pendingOriginals = new Map<string, Promise<DriveProofReceipt | undefined>>();
async function waitForOriginal(work: Promise<DriveProofReceipt | undefined>): Promise<DriveProofReceipt | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Object.assign(Error('L’envoi du justificatif sur Drive prend plus de temps que prévu et peut encore aboutir. Rien n’est confirmé pour l’instant : réessaie dans un instant. Si l’envoi a échoué, tu verras l’erreur à la prochaine tentative. Le brouillon est conservé.'), { code: DRIVE_IN_PROGRESS_CODE })), 15_000); })]);
  } finally { if (timer) clearTimeout(timer); }
}
/** Without a network, Firestore and fetch answer in English (« client is offline », « Failed to fetch »). */
function offlineOriginalError(error: unknown): Error | undefined {
  // Only network failures: the « en cours » timeout is accurate (the upload may still complete) and stays.
  const offline = (error as { code?: string })?.code === 'unavailable'
    || (error instanceof Error && /client is offline|failed to fetch|networkerror|network request failed|load failed/i.test(error.message));
  return offline ? Object.assign(Error('Hors connexion : l’original n’a pas pu être envoyé sur Drive, donc rien n’est enregistré. Réessaie une fois en ligne.'), { code: 'unavailable' }) : undefined;
}
/** Empreinte et taille du fichier du brouillon, calculées ici : comparer un original déjà confirmé ne demande aucun téléchargement. */
async function localDigest(dataUrl: string): Promise<{ sha256: string; bytes: number } | undefined> {
  const subtle = globalThis.crypto?.subtle;
  const body = dataUrl.slice(dataUrl.indexOf(',') + 1);
  if (!subtle || !body) return undefined;
  const raw = atob(body), bytes = Uint8Array.from(raw, char => char.charCodeAt(0));
  const hash = new Uint8Array(await subtle.digest('SHA-256', bytes));
  return { sha256: Array.from(hash, value => value.toString(16).padStart(2, '0')).join(''), bytes: bytes.byteLength };
}
const otherOriginal = () => Error('Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.');
/** Upload and verify one private Drive original, then confirm its tiny immutable
 * Firestore reference. Read-back safely recovers an uncertain metadata write.
 * Rend la preuve Drive ; `undefined` pour une copie locale (`?dev-local`) ou un ancien original en blocs. */
export async function saveFinanceDocumentConfirmed(prepared: PreparedFinanceDocument, year = new Date().getFullYear()): Promise<DriveProofReceipt | undefined> {
  try { return await confirmOriginal(prepared, year); }
  catch (error) { throw offlineOriginalError(error) ?? error; }
}
async function confirmOriginal(prepared: PreparedFinanceDocument, year: number): Promise<DriveProofReceipt | undefined> {
  const checked = prepareFinanceDocument(prepared.id, prepared.parts.join(''), prepared.fileName, prepared.mimeType);
  const { id, fileName, mimeType, parts } = checked;
  const existingWork = pendingOriginals.get(id);
  if (existingWork) { await waitForOriginal(existingWork); return confirmOriginal(checked, year); }
  const work = (async (): Promise<DriveProofReceipt | undefined> => {
    if (import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local')) {
      const existing = FirestoreRepo.find('financeDocuments', id);
      if (existing) {
        const saved = await loadFinanceDocument(id);
        // Le contenu fait l'identité ; le nom (lisible depuis DR5) peut différer d'une tentative à l'autre.
        if (saved.dataUrl !== parts.join('') || saved.mimeType !== mimeType) throw otherOriginal();
        return undefined;
      }
      saveFinanceDocument(checked);
      await FirestoreRepo.waitForDocument('financeDocuments', id);
      return undefined;
    }
    const ref = doc(db, 'financeDocuments', id);
    const metadata = await getDocFromServer(ref);
    if (metadata.exists()) {
      const saved = metadata.data();
      if (isDriveFinanceOriginal(saved)) {
        const driveStore = await import('./driveFileStore');
        const local = await localDigest(parts.join(''));
        if (local) {
          // Identique par l'empreinte, les octets et le type : le nom ne compte pas. Un seul appel de métadonnées Drive,
          // et le téléchargement complet seulement quand Drive ne donne pas d'empreinte à recouper.
          if (local.sha256 !== saved.sha256 || local.bytes !== saved.bytes || saved.mimeType !== mimeType) throw otherOriginal();
          const details = await driveStore.getDriveProofDetails(saved);
          if (!details.checksumVerified && (await driveStore.loadDriveOriginal(saved)) !== parts.join('')) throw otherOriginal();
          return proofReceipt(saved, details, true);
        }
        if ((await driveStore.loadDriveOriginal(saved)) !== parts.join('') || saved.mimeType !== mimeType) throw otherOriginal();
        return proofReceipt(saved, await driveStore.getDriveProofDetails(saved).catch(() => ({})), true);
      }
      if (saved.id !== id || saved.mimeType !== mimeType || saved.chunkCount !== parts.length || saved.length !== parts.join('').length) throw otherOriginal();
      const chunks = await Promise.all(parts.map((_, index) => getDocFromServer(doc(db, 'financeDocuments', `${id}-${index}`))));
      if (chunks.some((chunk, index) => !chunk.exists() || chunk.data().documentId !== id || chunk.data().index !== index || chunk.data().data !== parts[index]))
        throw Error('Cet original est incomplet ou différent sur le serveur. Le brouillon est conservé, sans remplacement du fichier.');
      return undefined;
    }
    const driveStore = await import('./driveFileStore');
    const original = await driveStore.uploadDriveOriginal({ documentId: id, dataUrl: parts.join(''), fileName, mimeType, year });
    // Le nom, le dossier et le lien sont lus sur Drive : un fichier déjà rangé garde le nom de son premier envoi, pas celui de cet appel.
    // Si cette lecture échoue, l'achat n'échoue pas : le reçu n'a ni nom, ni dossier, ni lien.
    const details: ProofDetails = await driveStore.getDriveProofDetails(original).catch(() => ({}));
    // Le document de l'original dit le nom de Drive ; le nom demandé n'y figure que si Drive ne rend rien (le champ est obligatoire).
    const value = driveFinanceMetadata(original, id, details.fileName ?? fileName, new Date().toISOString());
    if (!isDriveFinanceOriginal(value)) throw Error('La confirmation Drive est invalide. Aucun achat n’a été enregistré.');
    const batch = writeBatch(db);
    batch.set(ref, value);
    try { await batch.commit(); }
    catch (error) {
      // Another device can acknowledge the same original while this upload runs.
      const current = await getDocFromServer(ref);
      const stored = current.data();
      if (!current.exists() || !isDriveFinanceOriginal(stored) || stored.sha256 !== value.sha256 || stored.bytes !== value.bytes || stored.mimeType !== value.mimeType) throw error;
    }
    return proofReceipt(value, details, true);
  })();
  pendingOriginals.set(id, work);
  // A timeout does not cancel an SDK write. Keep tracking that exact promise so a
  // second click cannot submit the same immutable original while it is pending.
  void work.finally(() => { if (pendingOriginals.get(id) === work) pendingOriginals.delete(id); }).catch(() => {});
  return waitForOriginal(work);
}
async function read(id:string):Promise<any> {
  const local=FirestoreRepo.find('financeDocuments',id);
  if (local) return local;
  const snapshot=await getDoc(doc(db,'financeDocuments',id));
  if (!snapshot.exists()) throw new Error('Une partie du justificatif est indisponible. Réessaie après synchronisation.');
  return snapshot.data();
}
/** Relit la preuve d'un original déjà rangé (après rechargement). Sans jeton, hors ligne ou fichier introuvable : `undefined`, jamais un faux reçu. */
export async function loadDriveProofReceipt(id: string): Promise<DriveProofReceipt | undefined> {
  try {
    if (!/^[A-Za-z0-9-]{8,100}$/.test(id)) return undefined;
    const metadata = await read(id);
    if (!isDriveFinanceOriginal(metadata)) return undefined;
    const { getDriveProofDetails } = await import('./driveFileStore');
    const details = await getDriveProofDetails(metadata);
    return proofReceipt(metadata, details, !!details.checksumVerified);
  } catch { return undefined; }
}
export async function loadFinanceDocument(id:string):Promise<{dataUrl:string;fileName:string;mimeType:string}> {
  if(!/^[A-Za-z0-9-]{8,100}$/.test(id))throw new Error('Identifiant de justificatif invalide.');
  const metadata=await read(id);
  if (isDriveFinanceOriginal(metadata)) {
    const { loadDriveOriginal } = await import('./driveFileStore');
    return { dataUrl: await loadDriveOriginal(metadata), fileName: metadata.fileName, mimeType: metadata.mimeType };
  }
  if (!Number.isInteger(metadata.chunkCount) || metadata.chunkCount<1 || metadata.chunkCount>14) throw new Error('Justificatif incomplet.');
  const parts=await Promise.all(Array.from({length:metadata.chunkCount},(_,i)=>read(`${id}-${i}`)));
  if (parts.some((part,i)=>part.documentId!==id || part.index!==i || typeof part.data!=='string' || part.data.length>CHUNK)) throw new Error('Justificatif incomplet.');
  const dataUrl=parts.map(part=>part.data).join('');
  if (dataUrl.length!==metadata.length) throw new Error('Justificatif incomplet.');
  prepareFinanceDocument(id,dataUrl,metadata.fileName,metadata.mimeType);
  return {dataUrl,fileName:metadata.fileName,mimeType:metadata.mimeType};
}
