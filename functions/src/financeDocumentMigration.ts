import { FieldPath, FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireBrewer } from './brewSession.js';
import { stableJson } from './backupCore.js';
import { driveFinanceMetadata, isDriveFinanceOriginal, sameOriginalContent } from './financeOriginalCore.js';
import { decodeOriginal, originalSha, verifyDriveOriginal } from './driveOriginalVerification.js';

type Source = { kind: 'document' | 'transaction'; id: string };
function source(value: any): Source {
  if (!value || !['document', 'transaction'].includes(value.kind) || typeof value.id !== 'string' || !value.id.length || value.id.length > 200 || value.id.includes('/'))
    throw new HttpsError('invalid-argument', 'Source du justificatif invalide.');
  return value;
}
const originalId = (s: Source) => s.kind === 'document' ? s.id : `DOC-MIG-${originalSha(Buffer.from(s.id)).slice(0, 40)}`;
async function readSource(db: Firestore, s: Source) {
  const root = await db.doc(`${s.kind === 'document' ? 'financeDocuments' : 'transactions'}/${s.id}`).get();
  const value = root.data();
  if (!value) throw new HttpsError('not-found', 'Ce justificatif n’existe plus.');
  const id = originalId(s);
  if (isDriveFinanceOriginal(value) || s.kind === 'transaction' && !value.proofUrl?.startsWith('data:') && value.finance?.proofDocumentId === id) return { done: true as const, id };
  let docs = [root], dataUrl: string, fileName: string, mimeType: string;
  if (s.kind === 'transaction') {
    dataUrl = value.proofUrl; mimeType = /^data:([^;]+);/.exec(dataUrl ?? '')?.[1] ?? '';
    fileName = (value.proofFileName || `justificatif-${id}.${mimeType === 'application/pdf' ? 'pdf' : mimeType.split('/')[1]}`).slice(0, 200);
  } else {
    if (!Number.isInteger(value.chunkCount) || value.chunkCount < 1 || value.chunkCount > 14) throw new HttpsError('failed-precondition', 'Justificatif incomplet.');
    const chunks = await db.getAll(...Array.from({ length: value.chunkCount }, (_, i) => db.doc(`financeDocuments/${id}-${i}`)));
    if (chunks.some((row, i) => !row.exists || row.data()?.documentId !== id || row.data()?.index !== i || typeof row.data()?.data !== 'string')) throw new HttpsError('failed-precondition', 'Une partie du justificatif manque.');
    docs = [root, ...chunks]; dataUrl = chunks.map(row => row.data()!.data).join(''); fileName = value.fileName; mimeType = value.mimeType;
    if (dataUrl.length !== value.length) throw new HttpsError('failed-precondition', 'La longueur du justificatif est invalide.');
  }
  // Older jsPDF receipts carry an extra filename parameter; it is not part of
  // the original PDF bytes. Keep the source snapshot unchanged for concurrency.
  if (mimeType === 'application/pdf' && typeof dataUrl === 'string') dataUrl = dataUrl.replace(/^data:application\/pdf;filename=[^;,]*;base64,/, 'data:application/pdf;base64,');
  const content = decodeOriginal(dataUrl, mimeType), sha256 = originalSha(content);
  const year = /(?:19|20)\d{2}/.exec(value.date || value.createdAt || '')?.[0];
  return { done: false as const, id, dataUrl, fileName, mimeType, year: year ? Number(year) : new Date().getFullYear(), sha256, bytes: content.length, docs,
    createdAt: typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) ? value.createdAt : new Date().toISOString() };
}
export const migrateFinanceDocuments = onCall({ region: 'europe-west6', timeoutSeconds: 120, memory: '512MiB', maxInstances: 2 }, async request => {
  const uid = requireBrewer(request), db = getFirestore(), input = request.data ?? {};
  if (input.action === 'list') {
    const kind = input.kind === 'transaction' ? 'transaction' : 'document';
    let query = db.collection(kind === 'document' ? 'financeDocuments' : 'transactions').orderBy(FieldPath.documentId()).limit(30);
    if (input.after) { source({ kind, id: input.after }); query = query.startAfter(input.after); }
    const page = await query.get();
    const candidates = page.docs.flatMap(row => {
      const value = row.data();
      return (kind === 'document' ? Number.isInteger(value.chunkCount) && value.chunkCount > 0 : typeof value.proofUrl === 'string' && value.proofUrl.startsWith('data:'))
        ? [{ kind, id: row.id, fileName: value.fileName || value.proofFileName || value.description || 'Justificatif' }] : [];
    });
    return { candidates, after: page.docs.at(-1)?.id ?? input.after ?? '', done: page.size < 30, inspected: page.size };
  }
  const selected = source(input.source), original = await readSource(db, selected);
  if (input.action === 'read') {
    if (original.done) return { done: true };
    const { docs, createdAt, ...publicOriginal } = original; return publicOriginal;
  }
  if (input.action !== 'migrate') throw new HttpsError('invalid-argument', 'Action de migration inconnue.');
  if (original.done) return { done: true, migrated: false };
  const metadata = driveFinanceMetadata(input.driveOriginal, original.id, original.fileName, original.createdAt);
  if (!sameOriginalContent(metadata, original)) throw new HttpsError('failed-precondition', 'Le fichier envoyé ne correspond pas à l’original.');
  await verifyDriveOriginal(metadata, input.driveAccessToken);
  await db.runTransaction(async tx => {
    const live = await tx.getAll(...original.docs.map(d => d.ref));
    if (live.some((row, i) => stableJson(row.data()) !== stableJson(original.docs[i].data()))) throw new HttpsError('aborted', 'La pièce a changé pendant l’envoi. Réessaie pour reprendre la dernière version.');
    const target = db.doc(`financeDocuments/${original.id}`);
    if (selected.kind === 'transaction') {
      const oldTarget = (await tx.get(target)).data();
      if (oldTarget && (!isDriveFinanceOriginal(oldTarget) || !sameOriginalContent(oldTarget, metadata))) throw new HttpsError('already-exists', 'Un autre original utilise cet identifiant.');
      if (!oldTarget) tx.create(target, metadata);
      tx.update(live[0].ref, { proofUrl: FieldValue.delete(), syncedToDrive: true, 'finance.proofDocumentId': original.id });
    } else {
      tx.set(target, metadata);
      for (const chunk of live.slice(1)) tx.delete(chunk.ref);
    }
    const receipt = db.doc(`financeDocumentMigrations/${original.id}`);
    tx.set(receipt, { id: original.id, source: selected, uid, migratedAt: new Date().toISOString(), sha256: original.sha256, bytes: original.bytes, driveFileId: metadata.driveFileId });
  });
  return { done: true, migrated: true, bytes: original.bytes };
});
