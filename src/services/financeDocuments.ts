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
const pendingOriginals = new Map<string, Promise<void>>();
async function waitForOriginal(work: Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Confirmation du justificatif en attente. Le brouillon est conservé ; réessaie lorsque la connexion est rétablie.')), 15_000); })]);
  } finally { if (timer) clearTimeout(timer); }
}
/** Upload and verify one private Drive original, then confirm its tiny immutable
 * Firestore reference. Read-back safely recovers an uncertain metadata write. */
export async function saveFinanceDocumentConfirmed(prepared: PreparedFinanceDocument, year = new Date().getFullYear()): Promise<void> {
  const checked = prepareFinanceDocument(prepared.id, prepared.parts.join(''), prepared.fileName, prepared.mimeType);
  const { id, fileName, mimeType, parts } = checked;
  const existingWork = pendingOriginals.get(id);
  if (existingWork) { await waitForOriginal(existingWork); return saveFinanceDocumentConfirmed(checked, year); }
  const work = (async () => {
    if (import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local')) {
      const existing = FirestoreRepo.find('financeDocuments', id);
      if (existing) {
        const saved = await loadFinanceDocument(id);
        if (saved.dataUrl !== parts.join('') || saved.fileName !== fileName || saved.mimeType !== mimeType) throw Error('Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.');
        return;
      }
      saveFinanceDocument(checked);
      await FirestoreRepo.waitForDocument('financeDocuments', id);
      return;
    }
    const ref = doc(db, 'financeDocuments', id);
    const metadata = await getDocFromServer(ref);
    if (metadata.exists()) {
      const saved = metadata.data();
      if (isDriveFinanceOriginal(saved)) {
        const { loadDriveOriginal } = await import('./driveFileStore');
        const dataUrl = await loadDriveOriginal(saved);
        if (dataUrl !== parts.join('') || saved.fileName !== fileName || saved.mimeType !== mimeType) throw Error('Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.');
        return;
      }
      if (saved.id !== id || saved.fileName !== fileName || saved.mimeType !== mimeType || saved.chunkCount !== parts.length || saved.length !== parts.join('').length)
        throw Error('Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.');
      const chunks = await Promise.all(parts.map((_, index) => getDocFromServer(doc(db, 'financeDocuments', `${id}-${index}`))));
      if (chunks.some((chunk, index) => !chunk.exists() || chunk.data().documentId !== id || chunk.data().index !== index || chunk.data().data !== parts[index]))
        throw Error('Cet original est incomplet ou différent sur le serveur. Le brouillon est conservé, sans remplacement du fichier.');
      return;
    }
    const { uploadDriveOriginal } = await import('./driveFileStore');
    const original = await uploadDriveOriginal({ documentId: id, dataUrl: parts.join(''), fileName, mimeType, year });
    const value = driveFinanceMetadata(original, id, fileName, new Date().toISOString());
    if (!isDriveFinanceOriginal(value)) throw Error('La confirmation Drive est invalide. Aucun achat n’a été enregistré.');
    const batch = writeBatch(db);
    batch.set(ref, value);
    try { await batch.commit(); }
    catch (error) {
      // Another device can acknowledge the same original while this upload runs.
      const current = await getDocFromServer(ref);
      const stored = current.data();
      if (!current.exists() || !isDriveFinanceOriginal(stored) || stored.sha256 !== value.sha256 || stored.bytes !== value.bytes || stored.mimeType !== value.mimeType || stored.fileName !== value.fileName) throw error;
    }
  })();
  pendingOriginals.set(id, work);
  // A timeout does not cancel an SDK write. Keep tracking that exact promise so a
  // second click cannot submit the same immutable original while it is pending.
  void work.finally(() => { if (pendingOriginals.get(id) === work) pendingOriginals.delete(id); }).catch(() => {});
  await waitForOriginal(work);
}
async function read(id:string):Promise<any> {
  const local=FirestoreRepo.find('financeDocuments',id);
  if (local) return local;
  const snapshot=await getDoc(doc(db,'financeDocuments',id));
  if (!snapshot.exists()) throw new Error('Une partie du justificatif est indisponible. Réessaie après synchronisation.');
  return snapshot.data();
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
