import { FirebaseAuthService } from './firebaseAuth';

/** Originals remain private in the signed-in user's Drive. No public permissions,
 * OAuth tokens, file contents or resumable session URLs are persisted here. */
export interface DriveOriginalReference {
  driveFileId: string;
  sha256: string;
  bytes: number;
  mimeType: string;
  fileName: string;
}

export interface DriveOriginalUpload {
  documentId: string;
  dataUrl?: string;
  bytes?: Uint8Array;
  mimeType?: string;
  fileName: string;
  year: number;
  signal?: AbortSignal;
}

export interface DriveOriginalMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  sha256Checksum?: string;
  trashed?: boolean;
  parents?: string[];
  appProperties?: Record<string, string>;
}

export class DriveFileError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'DriveFileError';
  }
}

export const MAX_DRIVE_ORIGINAL_BYTES = 4 * 1024 * 1024;
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER = 'application/vnd.google-apps.folder';
const MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const FIELDS = 'id,name,mimeType,size,sha256Checksum,trashed,parents,appProperties';
const STORAGE_PREFIX = 'laffinee.drive.original.v1.';
const pending = new Map<string, Promise<DriveOriginalReference>>();
const pendingIds = new Map<string, PendingId>();
const folders = new Map<string, Promise<string>>();
const sessions = new Map<string, string>();
type PendingId = { id: string; sha256: string; bytes: number; mimeType: string; confirmed?: boolean };
type Session = { uid: string; signal?: AbortSignal };

function error(code: string, message: string): never { throw new DriveFileError(`drive/${code}`, message); }
function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Envoi annulé. Le fichier peut être renvoyé sans doublon.', 'AbortError');
}
function session(signal?: AbortSignal): Session {
  assertNotAborted(signal);
  const user = FirebaseAuthService.getCurrentUser();
  if (!user)
    error('auth-required', 'Reconnecte Google Drive pour enregistrer ou ouvrir ce justificatif. Ton brouillon est conservé.');
  return { uid: user.uid, signal };
}

async function request(context: Session, url: string, init: RequestInit = {}, rejectedToken?: string): Promise<Response> {
  assertNotAborted(context.signal);
  if (FirebaseAuthService.getCurrentUser()?.uid !== context.uid)
    error('auth-required', 'Le compte a changé. Reconnecte le compte de la brasserie.');
  const token = await FirebaseAuthService.ensureDriveAccessToken(rejectedToken);
  assertNotAborted(context.signal);
  if (!token || FirebaseAuthService.getCurrentUser()?.uid !== context.uid)
    error('auth-required', 'La connexion Google Drive a expiré ou le compte a changé. Reconnecte le bon compte puis réessaie.');
  // Never forward the token to a URL supplied by a document or an unchecked header.
  const target = new URL(url);
  if (target.origin !== 'https://www.googleapis.com' || !/^\/(?:upload\/)?drive\/v3\/files(?:\/|$)/.test(target.pathname))
    error('invalid-response', 'Adresse de transfert Google Drive invalide.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  context.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 45_000);
  try {
    const response = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` }, signal: controller.signal, redirect: 'error' });
    if (response.status === 401 && !rejectedToken) {
      clearTimeout(timer); context.signal?.removeEventListener('abort', abort);
      return request(context, url, init, token);
    }
    return response;
  } catch {
    assertNotAborted(context.signal);
    error('network', 'Google Drive ne répond pas. Le brouillon est conservé ; réessaie pour reprendre le même envoi.');
  } finally {
    clearTimeout(timer);
    context.signal?.removeEventListener('abort', abort);
  }
}

async function check(response: Response): Promise<Response> {
  if (response.ok) return response;
  let reasons: string[] = [];
  try {
    const body = await response.json();
    reasons = (body?.error?.errors || []).map((entry: any) => entry.reason);
  } catch { /* Never expose Google's raw error body or authentication details. */ }
  if (response.status === 401 || reasons.includes('authError'))
    error('auth-required', 'La connexion Google Drive a expiré. Reconnecte Google Drive puis réessaie.');
  if (reasons.includes('storageQuotaExceeded'))
    error('quota', 'Ton espace Google Drive est plein. Libère de la place ou augmente son espace, puis réessaie. Le brouillon est conservé.');
  if (response.status === 429 || reasons.some(reason => ['rateLimitExceeded', 'userRateLimitExceeded', 'dailyLimitExceeded'].includes(reason)))
    error('rate-limit', 'Google Drive limite temporairement les transferts. Réessaie plus tard ; ton brouillon est conservé.');
  if (response.status === 404) error('not-found', 'Le justificatif ou son dossier est introuvable dans ce compte Drive. Vérifie le compte utilisé et la corbeille.');
  if (response.status === 403) error('forbidden', 'Google Drive refuse cet accès. Vérifie l’autorisation Drive et le compte utilisé.');
  error('unavailable', `Le transfert Google Drive n’a pas abouti (${response.status}). Réessaie sans supprimer ton brouillon.`);
}

async function json<T>(context: Session, url: string, init?: RequestInit): Promise<T> {
  const response = await check(await request(context, url, init));
  try { return await response.json(); } catch { error('invalid-response', 'La réponse Google Drive est incomplète. Réessaie.'); }
}

function validId(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z0-9_-]{3,200}$/.test(value); }
function escapeQuery(value: string): string { return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
async function digest(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('');
}
async function keyFor(value: string): Promise<string> { return digest(new TextEncoder().encode(value)); }

async function find(context: Session, query: string): Promise<DriveOriginalMetadata[]> {
  const result: DriveOriginalMetadata[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ q: query, spaces: 'drive', pageSize: '100', fields: `nextPageToken,files(${FIELDS})` });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await json<{ files?: DriveOriginalMetadata[]; nextPageToken?: string }>(context, `${API}?${params}`);
    if (!Array.isArray(page.files)) error('invalid-response', 'La liste Google Drive est incomplète. Réessaie.');
    result.push(...page.files);
    if (result.length > 1000) error('invalid-response', 'Trop de dossiers ou justificatifs correspondent au même identifiant.');
    pageToken = page.nextPageToken;
  } while (pageToken);
  return result;
}

async function generateId(context: Session): Promise<string> {
  const result = await json<{ ids: string[] }>(context, `${API}/generateIds?count=1&space=drive&type=files`);
  if (!Array.isArray(result.ids) || !validId(result.ids[0])) error('invalid-response', 'Google Drive n’a pas fourni d’identifiant de fichier.');
  return result.ids[0];
}

async function metadata(context: Session, id: string): Promise<DriveOriginalMetadata> {
  if (!validId(id)) error('invalid-reference', 'Référence de justificatif Drive invalide.');
  const value = await json<DriveOriginalMetadata>(context, `${API}/${encodeURIComponent(id)}?fields=${FIELDS}`);
  if (value.id !== id || value.trashed) error('not-found', 'Le justificatif est introuvable ou dans la corbeille Google Drive.');
  return value;
}

async function withLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request)
    return navigator.locks.request(`laffinee-drive-${key}`, work);
  return work();
}

async function folder(context: Session, ownerKey: string, path: string, name: string, parent?: string): Promise<string> {
  const key = `${context.uid}:${path}`;
  if (folders.has(key)) return folders.get(key)!;
  const work = withLock(key, async () => {
    const q = `trashed = false and mimeType = '${FOLDER}' and appProperties has { key='laffineeFolder' and value='${escapeQuery(path)}' } and appProperties has { key='laffineeOwner' and value='${ownerKey}' } and '${escapeQuery(parent || 'root')}' in parents`;
    const candidates = await find(context, q);
    const found = candidates.find(value => validId(value.id));
    if (found) return found.id;
    const id = await generateId(context);
    const response = await request(context, API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, mimeType: FOLDER, parents: [parent || 'root'], appProperties: { laffineeFolder: path, laffineeOwner: ownerKey } })
    });
    if (response.status !== 409) await check(response);
    const created = await metadata(context, id);
    if (created.mimeType !== FOLDER || created.appProperties?.laffineeOwner !== ownerKey || created.appProperties?.laffineeFolder !== path)
      error('integrity', 'Le dossier Google Drive ne correspond pas à cette brasserie.');
    return id;
  });
  folders.set(key, work);
  try { return await work; } catch (cause) { folders.delete(key); throw cause; }
}

async function yearFolder(context: Session, year: number): Promise<string> {
  const ownerKey = await keyFor(context.uid);
  const root = await folder(context, ownerKey, 'root-v1', 'L’Affinée');
  const originals = await folder(context, ownerKey, 'originals-v1', 'Justificatifs', root);
  return folder(context, ownerKey, `originals-${year}`, String(year), originals);
}

function readPending(key: string): PendingId | undefined {
  if (pendingIds.has(key)) return pendingIds.get(key);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + key) || 'null');
    if (saved && validId(saved.id) && /^[a-f0-9]{64}$/.test(saved.sha256) && Number.isSafeInteger(saved.bytes) && saved.bytes > 0 && MIME_TYPES.has(saved.mimeType)) return saved;
  } catch { /* Storage can be disabled; Drive appProperties also recover completed uploads. */ }
}
function savePending(key: string, value: PendingId) {
  pendingIds.set(key, value);
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch { /* Memory fallback. */ }
}

export function validateDriveOriginalReference(value: unknown): value is DriveOriginalReference {
  const reference = value as DriveOriginalReference;
  return !!reference && validId(reference.driveFileId) && /^[a-f0-9]{64}$/.test(reference.sha256) &&
    Number.isSafeInteger(reference.bytes) && reference.bytes >= 1 && reference.bytes <= MAX_DRIVE_ORIGINAL_BYTES &&
    MIME_TYPES.has(reference.mimeType) && typeof reference.fileName === 'string' && reference.fileName.length > 0 && reference.fileName.length <= 200;
}
function validateReference(reference: DriveOriginalReference) {
  if (!validateDriveOriginalReference(reference))
    error('invalid-reference', 'Référence de justificatif Drive invalide.');
}
function validateMetadata(value: DriveOriginalMetadata, reference: DriveOriginalReference) {
  if (value.id !== reference.driveFileId || value.trashed || value.mimeType !== reference.mimeType || Number(value.size) !== reference.bytes ||
      (value.sha256Checksum && value.sha256Checksum.toLowerCase() !== reference.sha256))
    error('integrity', 'Le justificatif Drive a été modifié ou est incomplet. Aucun original n’a été remplacé.');
}

/** Reads a bounded response; a replaced document cannot cause an unlimited download. */
async function download(context: Session, reference: DriveOriginalReference): Promise<Uint8Array> {
  const response = await check(await request(context, `${API}/${encodeURIComponent(reference.driveFileId)}?alt=media`));
  const declared = Number(response.headers.get('Content-Length'));
  if (declared && declared !== reference.bytes) error('integrity', 'La taille du justificatif Drive ne correspond plus à l’original.');
  const reader = response.body?.getReader();
  let bytes: Uint8Array;
  if (reader) {
    bytes = new Uint8Array(reference.bytes);
    let offset = 0;
    try {
      for (;;) {
        assertNotAborted(context.signal);
        const part = await reader.read();
        if (part.done) break;
        if (offset + part.value.byteLength > reference.bytes) error('integrity', 'Le justificatif Drive dépasse la taille de l’original.');
        bytes.set(part.value, offset);
        offset += part.value.byteLength;
      }
      if (offset !== reference.bytes) error('integrity', 'Le justificatif Drive est incomplet.');
    } catch (cause) { await reader.cancel().catch(() => {}); throw cause; }
    finally { reader.releaseLock(); }
  } else {
    bytes = new Uint8Array(await response.arrayBuffer());
  }
  if (bytes.byteLength !== reference.bytes || await digest(bytes) !== reference.sha256)
    error('integrity', 'Le contenu du justificatif Drive ne correspond plus à l’original enregistré.');
  return bytes;
}

function prepare(input: DriveOriginalUpload): { bytes: Uint8Array; mimeType: string; fileName: string } {
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(input.documentId) || !Number.isInteger(input.year) || input.year < 1900 || input.year > 2200 ||
      typeof input.fileName !== 'string' || !input.fileName.trim() || (!!input.dataUrl === !!input.bytes))
    error('invalid-file', 'Le justificatif, son nom ou son année est invalide.');
  let bytes: Uint8Array;
  let mimeType = input.mimeType || '';
  if (input.dataUrl) {
    if (input.dataUrl.length > Math.ceil(MAX_DRIVE_ORIGINAL_BYTES / 3) * 4 + 100) error('invalid-file', 'Le justificatif dépasse 4 Mo.');
    const match = /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(input.dataUrl);
    if (!match || (mimeType && mimeType !== match[1]) || !match[2] || match[2].length % 4 !== 0)
      error('invalid-file', 'Le format du justificatif ne correspond pas à son contenu.');
    mimeType = match[1];
    let decoded: string;
    try { decoded = atob(match[2]); } catch { error('invalid-file', 'Le justificatif est incomplet.'); }
    bytes = Uint8Array.from(decoded!, char => char.charCodeAt(0));
  } else {
    bytes = input.bytes!.slice();
  }
  if (!MIME_TYPES.has(mimeType) || bytes.byteLength < 1 || bytes.byteLength > MAX_DRIVE_ORIGINAL_BYTES)
    error('invalid-file', 'Ajoute un PDF ou une image JPEG, PNG ou WebP de 4 Mo maximum.');
  const fileName = input.fileName.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200);
  if (!fileName) error('invalid-file', 'Donne un nom au justificatif.');
  return { bytes, mimeType, fileName };
}

async function verifyUploaded(context: Session, ref: DriveOriginalReference, documentKey: string): Promise<DriveOriginalReference> {
  const current = await metadata(context, ref.driveFileId);
  validateMetadata(current, ref);
  if (current.appProperties?.documentKey !== documentKey || current.appProperties?.sha256 !== ref.sha256)
    error('integrity', 'Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.');
  // Drive's computed checksum is authoritative; appProperties alone are not.
  if (!current.sha256Checksum) await download(context, ref);
  return ref;
}

/** Idempotent upload: reserve a Drive ID before sending bytes, retain it after an
 * uncertain response, and verify the stored binary before returning a reference. */
export async function uploadDriveOriginal(input: DriveOriginalUpload): Promise<DriveOriginalReference> {
  const prepared = prepare(input);
  const context = session(input.signal);
  const documentKey = await keyFor(`${context.uid}\0${input.documentId}`);
  const sha256 = await digest(prepared.bytes);
  const ongoing = pending.get(documentKey);
  if (ongoing) {
    const existing = await ongoing;
    if (existing.sha256 !== sha256 || existing.mimeType !== prepared.mimeType || existing.bytes !== prepared.bytes.byteLength)
      error('integrity', 'Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.');
    return existing;
  }
  const work = withLock(documentKey, async () => {
    const reference = (id: string): DriveOriginalReference => ({ driveFileId: id, sha256, bytes: prepared.bytes.byteLength, mimeType: prepared.mimeType, fileName: prepared.fileName });
    const saved = readPending(documentKey);
    if (saved && (saved.sha256 !== sha256 || saved.bytes !== prepared.bytes.byteLength || saved.mimeType !== prepared.mimeType))
      error('integrity', 'Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.');
    const candidates = await find(context, `trashed = false and appProperties has { key='documentKey' and value='${documentKey}' }`);
    if (candidates.length) {
      const verified = await verifyUploaded(context, reference(candidates[0].id), documentKey);
      savePending(documentKey, { id: verified.driveFileId, sha256, bytes: verified.bytes, mimeType: verified.mimeType, confirmed: true });
      return verified;
    }
    let id = saved?.id || await generateId(context);
    let ref = reference(id);
    savePending(documentKey, { id, sha256, bytes: ref.bytes, mimeType: ref.mimeType, ...(saved?.confirmed ? { confirmed: true } : {}) });
    if (saved) {
      try { return await verifyUploaded(context, ref, documentKey); }
      catch (cause) {
        if (!(cause instanceof DriveFileError) || cause.code !== 'drive/not-found') throw cause;
        if (saved.confirmed) {
          // A ZIP can repair an original deleted after a successful upload. Its
          // old ID is permanently taken, unlike an upload awaiting confirmation.
          // Reserve one new ID and retain it for all retries of this repair.
          id = await generateId(context); ref = reference(id); sessions.delete(documentKey);
          savePending(documentKey, { id, sha256, bytes: ref.bytes, mimeType: ref.mimeType });
        }
      }
    }
    const parent = await yearFolder(context, input.year);
    let uploadUrl = sessions.get(documentKey);
    let offset = 0;
    if (uploadUrl) {
      const state = await request(context, uploadUrl, { method: 'PUT', headers: { 'Content-Range': `bytes */${ref.bytes}` } });
      if (state.ok) return verifyUploaded(context, ref, documentKey);
      if (state.status === 308) {
        const range = /^bytes=0-(\d+)$/.exec(state.headers.get('Range') || '');
        offset = range ? Number(range[1]) + 1 : 0;
        if (offset >= ref.bytes) error('invalid-response', 'La reprise Google Drive est incohérente. Réessaie.');
      } else if (state.status === 404) { sessions.delete(documentKey); uploadUrl = undefined; }
      else { sessions.delete(documentKey); await check(state); }
    }
    if (!uploadUrl) {
      const response = await request(context, `${UPLOAD_API}?uploadType=resumable&fields=${FIELDS}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': ref.mimeType, 'X-Upload-Content-Length': String(ref.bytes) },
        body: JSON.stringify({ id, name: ref.fileName, mimeType: ref.mimeType, parents: [parent], appProperties: { laffineeKind: 'original-v1', documentKey, sha256 } })
      });
      if (response.status === 409) return verifyUploaded(context, ref, documentKey);
      if (response.status === 404) for (const key of folders.keys()) if (key.startsWith(`${context.uid}:`)) folders.delete(key);
      await check(response);
      uploadUrl = response.headers.get('Location') || undefined;
      if (!uploadUrl) error('invalid-response', 'Google Drive n’a pas fourni d’adresse de transfert. Réessaie.');
      sessions.set(documentKey, uploadUrl);
    }
    try {
      while (offset < ref.bytes) {
        const end = Math.min(offset + 1024 * 1024, ref.bytes);
        const response = await request(context, uploadUrl, { method: 'PUT', headers: { 'Content-Type': ref.mimeType, 'Content-Range': `bytes ${offset}-${end - 1}/${ref.bytes}` }, body: new Blob([prepared.bytes.slice(offset, end).buffer], { type: ref.mimeType }) });
        if (response.status === 308) {
          const range = /^bytes=0-(\d+)$/.exec(response.headers.get('Range') || '');
          const next = range ? Number(range[1]) + 1 : 0;
          if (next <= offset || next > end || next >= ref.bytes) error('invalid-response', 'Google Drive n’a pas confirmé les octets envoyés. Réessaie pour reprendre.');
          offset = next;
        } else {
          await check(response);
          offset = ref.bytes;
        }
      }
    } catch (cause) {
      // A lost final acknowledgement is recoverable without uploading twice.
      if (cause instanceof DriveFileError && ['drive/network', 'drive/unavailable'].includes(cause.code)) {
        try { const verified = await verifyUploaded(context, ref, documentKey); sessions.delete(documentKey); return verified; }
        catch { /* Keep the original error and the same reserved ID/session. */ }
      }
      throw cause;
    }
    const verified = await verifyUploaded(context, ref, documentKey);
    sessions.delete(documentKey);
    return verified;
  });
  pending.set(documentKey, work);
  try {
    const value = await work;
    savePending(documentKey, { id: value.driveFileId, sha256: value.sha256, bytes: value.bytes, mimeType: value.mimeType, confirmed: true });
    return value;
  } finally { if (pending.get(documentKey) === work) pending.delete(documentKey); }
}

export async function getDriveOriginalMetadata(reference: DriveOriginalReference, signal?: AbortSignal): Promise<DriveOriginalMetadata> {
  validateReference(reference);
  const value = await metadata(session(signal), reference.driveFileId);
  validateMetadata(value, reference);
  return value;
}

export async function getDriveOriginalBytes(reference: DriveOriginalReference, signal?: AbortSignal): Promise<Uint8Array> {
  validateReference(reference);
  const context = session(signal);
  validateMetadata(await metadata(context, reference.driveFileId), reference);
  return download(context, reference);
}

export async function loadDriveOriginal(reference: DriveOriginalReference, signal?: AbortSignal): Promise<string> {
  const bytes = await getDriveOriginalBytes(reference, signal);
  let binary = '';
  for (let offset = 0; offset < bytes.byteLength; offset += 16_384)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 16_384));
  return `data:${reference.mimeType};base64,${btoa(binary)}`;
}
