import { createHash, randomUUID } from 'node:crypto';
import { FieldPath, getFirestore, Timestamp, type Firestore, type Transaction, type DocumentReference } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { requireBrewer } from './brewSession.js';
import { BACKUP_COLLECTIONS, IMMUTABLE_COLLECTIONS, type BackupCollection } from './dataSchema.js';
import { parseBackup, preserveOperationalState, stableJson, type BackupDocument, type BreweryBackup } from './backupCore.js';
import { paymentGuardFromRegister } from './financePaymentGuard.js';
import { BACKUP_PAGE_BYTES, BACKUP_PAGE_DOCUMENTS, BACKUP_FINANCE_GROUP_PAYMENTS, type BackupRestoreProgress } from './backupTransferTypes.js';
import { driveFinanceMetadata, isDriveFinanceOriginal, sameOriginalContent, type DriveFinanceOriginal } from './financeOriginalCore.js';
import { decodeOriginal, originalSha, verifyDriveOriginal } from './driveOriginalVerification.js';

const options = { region: 'europe-west6', timeoutSeconds: 120, memory: '512MiB' as const, maxInstances: 2 };
const DAY = 86_400_000, EXPORT_TTL = 45 * 60_000;
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
const fail = (message: string): never => { throw new HttpsError('failed-precondition', message); };
const validId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length < 1500 && !value.includes('/') && !/^\.{1,2}$/.test(value) && !/^__.*__$/.test(value);
type Row = BackupDocument & { collection: BackupCollection; transactionId?: string };
type Work = { kind: 'row'; key: string } | { kind: 'finance'; transactionId: string } | { kind: 'original'; documentId: string };
type Cursor = { collection: number; after: string };
const rowKey = (collection: string, id: string) => sha(`${collection}/${id}`);
const immutable = (row: Row) => IMMUTABLE_COLLECTIONS.has(row.collection) || row.collection === 'financialClosings' && !!row.data.report;
const rowsRef = (session: DocumentReference) => session.collection('backupTransferRows');
const workRef = (session: DocumentReference) => session.collection('backupTransferWork');
const pageRef = (session: DocumentReference) => session.collection('backupTransferPages');
const clean = (row: any): Row => ({ id: row.id, collection: row.collection, data: row.data });

function sessionRef(db: Firestore, id: unknown) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{16,160}$/.test(id)) throw new HttpsError('invalid-argument', 'Session de sauvegarde invalide.');
  return db.collection('backupTransfers').doc(id);
}
function authorize(data: any, uid: string, kind: 'export' | 'restore') {
  if (!data || data.uid !== uid || data.kind !== kind) throw new HttpsError('permission-denied', 'Cette session de sauvegarde ne vous appartient pas.');
  if (data.expiresAt.toMillis() <= Date.now()) throw new HttpsError('deadline-exceeded', 'La session de sauvegarde a expiré. Recommencez avec les mêmes fichiers.');
  return data;
}
function progress(id: string, data: any): BackupRestoreProgress {
  return { sessionId: id, phase: data.phase, nextPageIndex: data.nextPageIndex, checked: data.checked ?? 0,
    processed: data.processed ?? 0, totalDocuments: data.totalDocuments, changed: data.changed ?? 0, journalsPreserved: data.journalsPreserved ?? 0, operationalPreserved: data.operationalPreserved ?? 0 };
}

async function startExport(db: Firestore, uid: string) {
  // The read timestamp comes from Firestore, never the browser clock. All later pages use it.
  const readTime = await db.runTransaction(async tx => (await tx.get(db.collection(BACKUP_COLLECTIONS[0]).limit(1))).readTime, { readOnly: true });
  const ref = db.collection('backupTransfers').doc(randomUUID());
  const exportedAt = readTime.toDate().toISOString(), expiresAt = Timestamp.fromMillis(Date.now() + EXPORT_TTL);
  await ref.create({ uid, kind: 'export', readTime, exportedAt, expiresAt, nextPageIndex: 0, totalDocuments: 0, cursor: { collection: 0, after: '' } });
  return { sessionId: ref.id, exportedAt, expiresAt: expiresAt.toDate().toISOString(), pageBytes: BACKUP_PAGE_BYTES, pageDocuments: BACKUP_PAGE_DOCUMENTS };
}

async function exportPage(db: Firestore, uid: string, input: any) {
  const ref = sessionRef(db, input.sessionId), state = authorize((await ref.get()).data(), uid, 'export');
  if (!Number.isSafeInteger(input.pageIndex) || input.pageIndex < 0 || ![state.nextPageIndex, state.nextPageIndex - 1].includes(input.pageIndex)) throw new HttpsError('invalid-argument', 'La page demandée ne suit pas le curseur serveur.');
  const retry = input.pageIndex < state.nextPageIndex;
  if (!retry && state.done) fail('Toutes les pages ont déjà été exportées.');
  let cursor: Cursor = { ...(retry ? state.previousCursor : state.cursor) }, documents = 0;
  const collections: BreweryBackup['collections'] = {};
  const wrap = () => ({ schemaVersion: 3 as const, source: 'server' as const, exportedAt: state.exportedAt, collections });
  await db.runTransaction(async tx => {
    while (cursor.collection < BACKUP_COLLECTIONS.length && documents < BACKUP_PAGE_DOCUMENTS) {
      const collection = BACKUP_COLLECTIONS[cursor.collection];
      const limit = Math.min(20, BACKUP_PAGE_DOCUMENTS - documents);
      let query = db.collection(collection).orderBy(FieldPath.documentId()).limit(limit);
      if (cursor.after) query = query.startAfter(cursor.after);
      const snapshot = await tx.get(query);
      collections[collection] ??= [];
      if (!snapshot.docs.length) { cursor = { collection: cursor.collection + 1, after: '' }; continue; }
      for (const doc of snapshot.docs) {
        const row = { id: doc.id, data: doc.data() };
        collections[collection]!.push(row);
        if (bytes(wrap()) > BACKUP_PAGE_BYTES) {
          collections[collection]!.pop();
          if (!documents) fail(`La fiche ${collection}/${doc.id} dépasse la taille d’une page de sauvegarde.`);
          return;
        }
        documents++; cursor.after = doc.id;
      }
      if (snapshot.docs.length < limit) cursor = { collection: cursor.collection + 1, after: '' };
    }
  }, { readOnly: true, readTime: state.readTime });
  const json = JSON.stringify(wrap()), done = cursor.collection >= BACKUP_COLLECTIONS.length;
  const totalDocuments = (retry ? state.previousTotal : state.totalDocuments) + documents;
  await db.runTransaction(async tx => {
    const current = authorize((await tx.get(ref)).data(), uid, 'export');
    if (current.nextPageIndex === input.pageIndex) tx.update(ref, { previousCursor: state.cursor, previousTotal: state.totalDocuments, cursor,
      nextPageIndex: input.pageIndex + 1, totalDocuments, done });
    else if (current.nextPageIndex !== input.pageIndex + 1) fail('Le curseur a avancé dans un autre onglet.');
  });
  return { pageIndex: input.pageIndex, json, sha256: sha(json), done, documents, totalDocuments };
}

async function startRestore(db: Firestore, uid: string, input: any) {
  const { operationId, pageCount, totalDocuments, exportedAt, digest } = input;
  if (typeof operationId !== 'string' || !/^[\w-]{16,100}$/.test(operationId) || !Number.isSafeInteger(pageCount) || pageCount < 1 ||
    !Number.isSafeInteger(totalDocuments) || totalDocuments < 0 || !Number.isFinite(Date.parse(exportedAt)) || !/^[a-f0-9]{64}$/.test(digest)) throw new HttpsError('invalid-argument', 'Manifeste de restauration invalide.');
  const ref = sessionRef(db, `restore-${sha(`${uid}/${operationId}`)}`);
  return db.runTransaction(async tx => {
    const old = (await tx.get(ref)).data();
    if (old) {
      authorize(old, uid, 'restore');
      if (old.digest !== digest || old.exportedAt !== exportedAt || old.totalDocuments !== totalDocuments || old.pageCount !== pageCount) throw new HttpsError('already-exists', 'Cette opération correspond à une autre sauvegarde.');
      return progress(ref.id, old);
    }
    const data = { uid, kind: 'restore', digest, pageCount, totalDocuments, exportedAt, phase: 'uploading', nextPageIndex: 0,
      uploaded: 0, checked: 0, processed: 0, changed: 0, journalsPreserved: 0, operationalPreserved: 0, validateCursor: '', applyCursor: '', expiresAt: Timestamp.fromMillis(Date.now() + 7 * DAY) };
    tx.create(ref, data); return progress(ref.id, data);
  });
}

async function uploadRestorePage(db: Firestore, uid: string, input: any) {
  if (typeof input.json !== 'string' || Buffer.byteLength(input.json) > BACKUP_PAGE_BYTES || sha(input.json) !== input.sha256 || !Number.isSafeInteger(input.pageIndex) || input.pageIndex < 0) throw new HttpsError('invalid-argument', 'Page de sauvegarde invalide ou empreinte incorrecte.');
  let backup: BreweryBackup;
  try { backup = parseBackup(input.json); } catch (error) { throw new HttpsError('invalid-argument', (error as Error).message); }
  const rows: Row[] = Object.entries(backup.collections).flatMap(([collection, entries]) => (entries ?? []).map(row => ({ ...row, collection: collection as BackupCollection })));
  if (rows.length > BACKUP_PAGE_DOCUMENTS) throw new HttpsError('invalid-argument', 'Une page ne peut pas dépasser 100 fiches.');
  for (const row of rows) if (row.collection === 'financialPayments' && !validId(row.data.transactionId)) throw new HttpsError('invalid-argument', 'Chaque règlement doit référencer une pièce valide.');
  const ref = sessionRef(db, input.sessionId);
  return db.runTransaction(async tx => {
    const data = authorize((await tx.get(ref)).data(), uid, 'restore');
    if (input.pageIndex === data.nextPageIndex - 1 && input.sha256 === data.lastPageSha) return progress(ref.id, data);
    if (data.phase !== 'uploading' || input.pageIndex !== data.nextPageIndex || input.pageIndex >= data.pageCount || backup.exportedAt !== data.exportedAt) fail('Cette page ne correspond pas à la suite de la restauration.');
    const refs = rows.map(row => rowsRef(ref).doc(rowKey(row.collection, row.id)));
    const existing = refs.length ? await tx.getAll(...refs) : [];
    if (existing.some(s => s.exists)) fail('Une même fiche apparaît dans plusieurs pages. Aucune donnée métier n’a été modifiée.');
    if (data.uploaded + rows.length > data.totalDocuments) fail('Le nombre de fiches dépasse celui du manifeste.');
    const work = new Map<string, Work>();
    rows.forEach((row, index) => {
      const financial = row.collection === 'transactions' || row.collection === 'financialPayments';
      const transactionId = row.collection === 'transactions' ? row.id : row.data.transactionId;
      const originalId = row.collection === 'financeDocuments' ? row.data.documentId ?? row.id : null;
      if (originalId !== null && (typeof originalId !== 'string' || !/^[A-Za-z0-9-]{8,100}$/.test(originalId))) fail('Identifiant de justificatif invalide.');
      tx.create(refs[index], { ...row, ...(row.collection === 'financialPayments' ? { transactionId } : {}), ...(originalId ? { originalId } : {}) });
      const key = originalId ? `00-${sha(originalId)}` : financial ? `1-${sha(transactionId)}` : `${immutable(row) ? '01' : '2'}-${rowKey(row.collection, row.id)}`;
      work.set(key, originalId ? { kind: 'original', documentId: originalId } : financial ? { kind: 'finance', transactionId } : { kind: 'row', key: refs[index].id });
    });
    for (const [key, task] of work) tx.set(workRef(ref).doc(key), task);
    tx.create(pageRef(ref).doc(String(input.pageIndex).padStart(12, '0')), { sha256: input.sha256, documents: rows.length });
    const next = { ...data, nextPageIndex: input.pageIndex + 1, uploaded: data.uploaded + rows.length, lastPageSha: input.sha256 };
    tx.update(ref, { nextPageIndex: next.nextPageIndex, uploaded: next.uploaded, lastPageSha: next.lastPageSha });
    return progress(ref.id, next);
  });
}

async function validateManifest(ref: DocumentReference, state: any) {
  if (state.nextPageIndex !== state.pageCount || state.uploaded !== state.totalDocuments) fail('Des pages ou des fiches manquent. Aucune donnée métier n’a été modifiée.');
  const hash = createHash('sha256').update(`{"exportedAt":${JSON.stringify(state.exportedAt)},"pages":[`);
  let after = '', count = 0;
  while (true) {
    let query = pageRef(ref).orderBy(FieldPath.documentId()).limit(1000);
    if (after) query = query.startAfter(after);
    const page = await query.get();
    for (const row of page.docs) { hash.update(`${count ? ',' : ''}${JSON.stringify(row.data().sha256)}`); count++; after = row.id; }
    if (page.docs.length < 1000) break;
  }
  hash.update(`],"totalDocuments":${state.totalDocuments}}`);
  if (count !== state.pageCount || hash.digest('hex') !== state.digest) fail('L’empreinte globale ne correspond pas aux pages reçues. Aucune donnée métier n’a été modifiée.');
}

/** Read the effective original: immutable server documents always win over an older import. */
async function effectiveDocument(db: Firestore, session: DocumentReference, id: string) {
  const [existing, staged] = await Promise.all([db.doc(`financeDocuments/${id}`).get(), rowsRef(session).doc(rowKey('financeDocuments', id)).get()]);
  const incoming = staged.data()?.data;
  if (existing.exists && incoming && stableJson(existing.data()) !== stableJson(incoming)) fail(`Le justificatif ${id} existe déjà avec un contenu différent. Restauration bloquée pour éviter d’associer une facture au mauvais original.`);
  return existing.exists ? existing.data()! : incoming;
}
async function validateOriginal(db: Firestore, session: DocumentReference, id: string) {
  if (!/^[A-Za-z0-9-]{8,100}$/.test(id)) fail('Identifiant de justificatif invalide.');
  const [current, staged] = await Promise.all([db.doc(`financeDocuments/${id}`).get(), rowsRef(session).doc(rowKey('financeDocuments', id)).get()]);
  if (isDriveFinanceOriginal(current.data())) {
    if (staged.exists) {
      const portable = await portableOriginal(session, id);
      if (!sameOriginalContent(current.data() as DriveFinanceOriginal, portable) || current.data()!.fileName !== portable.fileName) fail(`Le justificatif ${id} existe déjà avec un contenu différent.`);
    }
    return;
  }
  const meta = await effectiveDocument(db, session, id);
  if (!meta || !Number.isInteger(meta.chunkCount) || meta.chunkCount < 1 || meta.chunkCount > 14 || typeof meta.fileName !== 'string' || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(meta.mimeType)) fail(`Justificatif incomplet : ${id}.`);
  const parts = await Promise.all(Array.from({ length: meta.chunkCount }, (_, i) => effectiveDocument(db, session, `${id}-${i}`)));
  if (parts.some((part, i) => !part || part.documentId !== id || part.index !== i || typeof part.data !== 'string' || part.data.length > 400_000)) fail(`Une partie du justificatif ${id} manque ou est invalide.`);
  const dataUrl = parts.map(p => p!.data).join('');
  if (dataUrl.length !== meta.length || dataUrl.length > 5_600_000 || !dataUrl.startsWith(`data:${meta.mimeType};base64,`) || !/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/]+=*$/.test(dataUrl)) fail(`Le justificatif ${id} est incomplet ou altéré.`);
  const content = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  if (content.toString('base64') !== dataUrl.slice(dataUrl.indexOf(',') + 1)) fail(`Encodage du justificatif ${id} invalide.`);
  const valid = meta.mimeType === 'application/pdf' ? content.subarray(0, 5).toString() === '%PDF-' && content.subarray(-2048).includes(Buffer.from('%%EOF'))
    : meta.mimeType === 'image/png' ? content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : meta.mimeType === 'image/jpeg' ? content[0] === 255 && content[1] === 216 && content.at(-2) === 255 && content.at(-1) === 217
        : content.subarray(0, 4).toString() === 'RIFF' && content.subarray(8, 12).toString() === 'WEBP';
  if (!valid) fail(`Le contenu du justificatif ${id} ne correspond pas à son format.`);
}

async function portableOriginal(session: DocumentReference, id: string) {
  const rows = await originalGroup(session, id), meta = rows.find(row => row.id === id)?.data;
  if (!meta) throw new HttpsError('failed-precondition', `L’archive doit contenir le fichier original complet : ${id}.`);
  if (!Number.isInteger(meta.chunkCount) || meta.chunkCount < 1 || meta.chunkCount > 14 || rows.length !== meta.chunkCount + 1)
    fail(`L’archive doit contenir le fichier original complet : ${id}.`);
  const parts = Array.from({ length: meta.chunkCount }, (_, i) => rows.find(row => row.id === `${id}-${i}`)?.data);
  if (parts.some((part, i) => !part || part.documentId !== id || part.index !== i || typeof part.data !== 'string')) fail(`Une partie du justificatif ${id} manque.`);
  const dataUrl = parts.map(part => part!.data).join('');
  if (dataUrl.length !== meta.length) fail(`Le justificatif ${id} est incomplet.`);
  const content = decodeOriginal(dataUrl, meta.mimeType), sha256 = originalSha(content);
  if (meta.sha256 && meta.sha256 !== sha256) fail(`L’empreinte du justificatif ${id} ne correspond pas à son contenu.`);
  return { id, dataUrl, fileName: meta.fileName, mimeType: meta.mimeType, createdAt: meta.createdAt,
    year: Number(/(?:19|20)\d{2}/.exec(meta.createdAt ?? '')?.[0] ?? new Date().getFullYear()), sha256, bytes: content.length };
}
function documentIds(row: Row): string[] {
  if (!['transactions', 'financialClosings'].includes(row.collection)) return [];
  const ids = new Set<string>();
  const walk = (value: any) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.proofDocumentId === 'string') ids.add(value.proofDocumentId);
    if (Array.isArray(value.attachments)) for (const attachment of value.attachments) if (typeof attachment?.documentId === 'string') ids.add(attachment.documentId);
    for (const child of Object.values(value)) walk(child);
  };
  walk(row.data); return [...ids];
}

async function financeGroup(db: Firestore, session: DocumentReference, work: Extract<Work, { kind: 'finance' }>) {
  const incoming = (await rowsRef(session).doc(rowKey('transactions', work.transactionId)).get()).data()?.data;
  const payments = (await rowsRef(session).where('transactionId', '==', work.transactionId).limit(BACKUP_FINANCE_GROUP_PAYMENTS + 1).get()).docs.map(d => clean(d.data()));
  if (payments.length > BACKUP_FINANCE_GROUP_PAYMENTS) fail(`La pièce ${work.transactionId} comporte plus de 400 règlements. Elle nécessite une restauration dédiée ; aucune fiche métier n’a encore été modifiée pendant la validation.`);
  if (bytes({ incoming, payments }) > 7_000_000) fail(`La pièce ${work.transactionId} et ses règlements dépassent la taille d’un groupe atomique (7 Mo).`);
  return { incoming, payments };
}
async function originalGroup(session: DocumentReference, id: string) {
  const rows = (await rowsRef(session).where('originalId', '==', id).limit(16).get()).docs.map(d => clean(d.data()));
  if (!rows.length || rows.length > 15 || bytes(rows) > 7_000_000) fail(`Le justificatif ${id} dépasse les limites d’un original (14 blocs, 7 Mo).`);
  for (const row of rows) if (row.data.documentId && (!Number.isInteger(row.data.index) || row.data.index < 0 || row.data.index > 13 || row.id !== `${id}-${row.data.index}` || typeof row.data.data !== 'string' || !row.data.data.length || row.data.data.length > 400_000)) fail(`Bloc de justificatif invalide : ${row.id}.`);
  return rows;
}
async function financialWrites(db: Firestore, tx: Transaction, id: string, incoming: any, payments: Row[]) {
  const ref = db.doc(`transactions/${id}`), old = (await tx.get(ref)).data();
  const currentPayments = (await tx.get(db.collection('financialPayments').where('transactionId', '==', id))).docs;
  const requested = payments.length ? await tx.getAll(...payments.map(p => db.doc(`financialPayments/${p.id}`))) : [];
  const merged = new Map(currentPayments.map(p => [p.id, p.data()]));
  payments.forEach((p, index) => { if (!requested[index].exists) merged.set(p.id, p.data); });
  const data = old?.finance?.voidedAt ? old : incoming ?? old;
  if (!data) fail(`Le règlement restauré n’a pas de pièce ${id}.`);
  let guard;
  try { guard = paymentGuardFromRegister(data, [...merged.values()]); } catch (error) { fail((error as Error).message); }
  const value = { ...data, ...guard };
  const writes: Array<{ ref: DocumentReference; data: any; create: boolean }> = [];
  if (!old?.finance?.voidedAt && stableJson(old) !== stableJson(value)) writes.push({ ref, data: value, create: !old });
  payments.forEach((p, index) => { if (!requested[index].exists) writes.push({ ref: db.doc(`financialPayments/${p.id}`), data: p.data, create: true }); });
  if (bytes(writes.map(w => w.data)) > 7_000_000) fail(`La pièce ${id} et ses règlements dépassent la taille d’un groupe atomique.`);
  return writes;
}

async function validateRestore(db: Firestore, uid: string, input: any) {
  const ref = sessionRef(db, input.sessionId);
  let state = authorize((await ref.get()).data(), uid, 'restore');
  if (['ready', 'applying', 'complete'].includes(state.phase)) return progress(ref.id, state);
  if (state.phase === 'uploading') {
    await validateManifest(ref, state);
    await db.runTransaction(async tx => {
      const latest = authorize((await tx.get(ref)).data(), uid, 'restore');
      if (latest.phase === 'uploading') tx.update(ref, { phase: 'validating' });
    });
    state = authorize((await ref.get()).data(), uid, 'restore');
  }
  let query = workRef(ref).orderBy(FieldPath.documentId()).limit(20);
  if (state.validateCursor) query = query.startAfter(state.validateCursor);
  const work = await query.get();
  let checked = 0;
  for (const item of work.docs) {
    const task = item.data() as Work;
    if (task.kind === 'original') {
      const rows = await originalGroup(ref, task.documentId);
      await validateOriginal(db, ref, task.documentId); checked += rows.length;
    } else if (task.kind === 'finance') {
      const { incoming, payments } = await financeGroup(db, ref, task);
      await db.runTransaction(tx => financialWrites(db, tx, task.transactionId, incoming, payments), { readOnly: true });
      if (incoming) for (const id of new Set(documentIds({ id: task.transactionId, collection: 'transactions', data: incoming }))) await validateOriginal(db, ref, id);
      checked += payments.length + (incoming ? 1 : 0);
    } else {
      const row = clean((await rowsRef(ref).doc(task.key).get()).data());
      for (const id of new Set(documentIds(row))) await validateOriginal(db, ref, id);
      checked++;
    }
  }
  return db.runTransaction(async tx => {
    const current = authorize((await tx.get(ref)).data(), uid, 'restore');
    if (current.phase !== 'validating' || current.validateCursor !== state.validateCursor) return progress(ref.id, current);
    const next = { ...current, checked: current.checked + checked, validateCursor: work.docs.at(-1)?.id ?? current.validateCursor, phase: work.docs.length < 20 ? 'ready' : 'validating' };
    if (next.phase === 'ready' && next.checked !== next.totalDocuments) fail('Le nombre de fiches validées ne correspond pas au manifeste.');
    tx.update(ref, { checked: next.checked, validateCursor: next.validateCursor, phase: next.phase });
    return progress(ref.id, next);
  });
}

async function applyRestore(db: Firestore, uid: string, input: any) {
  const ref = sessionRef(db, input.sessionId), state = authorize((await ref.get()).data(), uid, 'restore');
  if (state.phase === 'complete') return progress(ref.id, state);
  if (!['ready', 'applying'].includes(state.phase)) fail('La validation complète est obligatoire avant la restauration.');
  let query = workRef(ref).orderBy(FieldPath.documentId()).limit(BACKUP_PAGE_DOCUMENTS);
  if (state.applyCursor) query = query.startAfter(state.applyCursor);
  const snapshot = await query.get();
  const selected: Array<{ key: string; work: Work; row?: Row }> = [];
  let size = 0;
  for (const item of snapshot.docs) {
    const work = item.data() as Work;
    if (work.kind !== 'row') { if (!selected.length) selected.push({ key: item.id, work }); break; }
    const row = clean((await rowsRef(ref).doc(work.key).get()).data()), amount = bytes(row);
    if (selected.length && size + amount > BACKUP_PAGE_BYTES) break;
    selected.push({ key: item.id, work, row }); size += amount;
  }
  const group = selected[0]?.work.kind === 'finance' ? await financeGroup(db, ref, selected[0].work) : null;
  const original = selected[0]?.work.kind === 'original' ? await originalGroup(ref, selected[0].work.documentId) : null;
  const portable = selected[0]?.work.kind === 'original' ? await portableOriginal(ref, selected[0].work.documentId) : null;
  let drive: DriveFinanceOriginal | null = null;
  if (portable) {
    drive = driveFinanceMetadata(input.driveOriginal, portable.id, portable.fileName,
      typeof portable.createdAt === 'string' && Number.isFinite(Date.parse(portable.createdAt)) ? portable.createdAt : state.exportedAt);
    if (!sameOriginalContent(drive!, portable)) fail('Le fichier Drive ne correspond pas au justificatif à restaurer.');
    await verifyDriveOriginal(drive, input.driveAccessToken);
  }
  return db.runTransaction(async tx => {
    const current = authorize((await tx.get(ref)).data(), uid, 'restore');
    if (current.phase === 'complete' || current.applyCursor !== state.applyCursor) return progress(ref.id, current);
    const writes: Array<{ ref: DocumentReference; data: any; create: boolean }> = [];
    const removals: DocumentReference[] = [];
    let processed = 0, journalsPreserved = 0, operationalPreserved = 0;
    if (original) {
      const existing = await tx.getAll(...original.map(row => db.doc(`financeDocuments/${row.id}`)));
      original.forEach((row, index) => {
        const previous = existing[index].data();
        if (isDriveFinanceOriginal(previous)) {
          if (!sameOriginalContent(previous, drive!) || previous.fileName !== drive!.fileName) fail(`Le justificatif ${row.id} existe déjà avec un contenu différent.`);
        } else if (existing[index].exists && stableJson(previous) !== stableJson(row.data)) fail(`Le justificatif ${row.id} existe déjà avec un contenu différent. Ce groupe n’a pas été restauré.`);
      });
      const metadata = existing.find(row => row.id === drive!.id);
      if (!isDriveFinanceOriginal(metadata?.data()) || metadata!.data()!.driveFileId !== drive!.driveFileId)
        writes.push({ ref: db.doc(`financeDocuments/${drive!.id}`), data: drive, create: !metadata?.exists });
      existing.forEach(row => { if (row.id !== drive!.id && row.exists) removals.push(row.ref); });
      processed = original.length;
    } else if (group && selected[0].work.kind === 'finance') {
      writes.push(...await financialWrites(db, tx, selected[0].work.transactionId, group.incoming, group.payments));
      processed = group.payments.length + (group.incoming ? 1 : 0);
    } else {
      const currentRows = selected.length ? await tx.getAll(...selected.map(item => db.doc(`${item.row!.collection}/${item.row!.id}`))) : [];
      selected.forEach((item, index) => {
        const row = item.row!, old = currentRows[index].data(), data = { ...row.data };
        processed++;
        if (immutable(row) && old || row.collection === 'financialClosings' && old?.report) return;
        if (preserveOperationalState(row.collection, old)) { operationalPreserved++; if (row.collection === 'batches' && old?.brewDay) journalsPreserved++; return; }
        if (row.collection === 'batches') {
          if (data.brewDay) data.brewDay = { ...data.brewDay, restoredFromBackup: true };
        }
        if (stableJson(old) !== stableJson(data)) writes.push({ ref: db.doc(`${row.collection}/${row.id}`), data, create: !old });
      });
    }
    const next = { ...current, phase: selected.length ? 'applying' : 'complete', applyCursor: selected.at(-1)?.key ?? current.applyCursor,
      processed: current.processed + processed, changed: current.changed + writes.length, journalsPreserved: current.journalsPreserved + journalsPreserved, operationalPreserved: (current.operationalPreserved ?? 0) + operationalPreserved };
    if (next.phase === 'complete' && next.processed !== next.totalDocuments) fail('La restauration n’a pas traité toutes les fiches.');
    for (const write of writes) write.create ? tx.create(write.ref, write.data) : tx.set(write.ref, write.data);
    for (const removal of removals) tx.delete(removal);
    tx.update(ref, { phase: next.phase, applyCursor: next.applyCursor, processed: next.processed, changed: next.changed, journalsPreserved: next.journalsPreserved, operationalPreserved: next.operationalPreserved });
    return progress(ref.id, next);
  });
}

async function prepareRestoreStep(db: Firestore, uid: string, input: any) {
  const ref = sessionRef(db, input.sessionId), state = authorize((await ref.get()).data(), uid, 'restore');
  if (state.phase === 'complete') return { phase: 'complete' };
  if (!['ready', 'applying'].includes(state.phase)) fail('La validation complète est obligatoire avant la restauration.');
  let query = workRef(ref).orderBy(FieldPath.documentId()).limit(1);
  if (state.applyCursor) query = query.startAfter(state.applyCursor);
  const work = (await query.get()).docs[0]?.data() as Work | undefined;
  if (work?.kind !== 'original') return { phase: 'restoring' };
  const { createdAt, ...original } = await portableOriginal(ref, work.documentId);
  return { phase: 'restoring', original };
}

export const transferBreweryData = onCall(options, async request => {
  const uid = requireBrewer(request), db = getFirestore(), input = request.data ?? {};
  switch (input.action) {
    case 'startExport': return startExport(db, uid);
    case 'exportPage': return exportPage(db, uid, input);
    case 'startRestore': return startRestore(db, uid, input);
    case 'uploadRestorePage': return uploadRestorePage(db, uid, input);
    case 'validateRestore': return validateRestore(db, uid, input);
    case 'prepareRestoreStep': return prepareRestoreStep(db, uid, input);
    case 'applyRestore': return applyRestore(db, uid, input);
    default: throw new HttpsError('invalid-argument', 'Action de sauvegarde inconnue.');
  }
});

// Temporary staging is server-only and removed recursively, including nested file chunks.
export const cleanupBreweryTransfers = onSchedule({ region: 'europe-west6', schedule: 'every 24 hours', timeZone: 'Europe/Zurich', timeoutSeconds: 540, memory: '256MiB' }, async () => {
  const db = getFirestore();
  const expired = await db.collection('backupTransfers').where('expiresAt', '<=', Timestamp.now()).limit(25).get();
  for (const session of expired.docs) await db.recursiveDelete(session.ref);
});
