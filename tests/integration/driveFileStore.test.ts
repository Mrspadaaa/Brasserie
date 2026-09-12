import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { Blob as NodeBlob } from 'node:buffer';

const identity = vi.hoisted(() => ({ uid: 'brewer-one', token: 'test-memory-token' as string | null }));
vi.mock('../../src/services/firebaseAuth', () => ({
  FirebaseAuthService: {
    getCurrentUser: () => identity.uid ? { uid: identity.uid } : null,
    getDriveAccessToken: () => identity.token, ensureDriveAccessToken: async () => identity.token
  }
}));

type Stored = { id: string; name: string; mimeType: string; size?: string; sha256Checksum?: string; parents?: string[]; appProperties?: Record<string, string>; trashed?: boolean; owner: string; content?: Uint8Array };
type Upload = { metadata: Stored; received: Uint8Array; offset: number };
const pdf = (text = 'Facture brasserie synthétique') => new TextEncoder().encode(`%PDF-1.4\n${text}\n%%EOF`);
const sha = async (bytes: Uint8Array) => Buffer.from(await webcrypto.subtle.digest('SHA-256', bytes)).toString('hex');
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const failure = (status: number, reason = '') => json({ error: { errors: [{ reason }] } }, status);

function fakeDrive() {
  const files = new Map<string, Stored>();
  const uploads = new Map<string, Upload>();
  const sent: { url: URL; init: RequestInit; owner: string }[] = [];
  const behavior = { loseFinal: false, failChunkAt: -1, forbiddenReason: '', forbiddenStatus: 0, unsafeLocation: false, omitChecksum: false, downloadOverride: undefined as Uint8Array | undefined };
  let nextId = 0;
  const fetcher = vi.fn(async (urlInput: string, init: RequestInit = {}) => {
    const url = new URL(urlInput);
    sent.push({ url, init, owner: identity.uid });
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${identity.token}`);
    if (behavior.forbiddenStatus) return failure(behavior.forbiddenStatus, behavior.forbiddenReason);
    if (url.pathname.endsWith('/generateIds')) return json({ ids: [`drive-file-${++nextId}`] });
    if (url.pathname === '/drive/v3/files' && (!init.method || init.method === 'GET')) {
      const q = url.searchParams.get('q') || '';
      const predicates = [...q.matchAll(/key='([^']+)' and value='([^']+)'/g)];
      const parent = /and '([^']+)' in parents/.exec(q)?.[1];
      return json({ files: [...files.values()].filter(file => file.owner === identity.uid && !file.trashed && predicates.every(([, key, value]) => file.appProperties?.[key] === value) && (!parent || file.parents?.includes(parent))) });
    }
    if (url.pathname === '/drive/v3/files' && init.method === 'POST') {
      const value: Stored = { ...JSON.parse(init.body as string), owner: identity.uid };
      files.set(value.id, value);
      return json(value);
    }
    if (url.pathname === '/upload/drive/v3/files' && init.method === 'POST') {
      const value: Stored = { ...JSON.parse(init.body as string), owner: identity.uid };
      if (files.has(value.id)) return failure(409);
      const location = `https://www.googleapis.com/upload/drive/v3/files?upload_id=${value.id}`;
      uploads.set(value.id, { metadata: value, received: new Uint8Array(Number((init.headers as any)['X-Upload-Content-Length'])), offset: 0 });
      return new Response(null, { status: 200, headers: { Location: behavior.unsafeLocation ? 'https://evil.example/steal' : location } });
    }
    if (url.pathname === '/upload/drive/v3/files' && init.method === 'PUT') {
      const upload = uploads.get(url.searchParams.get('upload_id')!);
      if (!upload) return failure(404);
      const range = (init.headers as any)['Content-Range'] as string;
      if (range.startsWith('bytes */')) return upload.offset === upload.received.length ? json(files.get(upload.metadata.id)) : new Response(null, { status: 308, headers: upload.offset ? { Range: `bytes=0-${upload.offset - 1}` } : {} });
      const start = Number(/^bytes (\d+)-/.exec(range)?.[1]);
      if (start === behavior.failChunkAt) { behavior.failChunkAt = -1; throw new TypeError('Synthetic lost connection'); }
      const bytes = new Uint8Array(await (init.body as Blob).arrayBuffer());
      upload.received.set(bytes, start);
      upload.offset = start + bytes.length;
      if (upload.offset < upload.received.length) return new Response(null, { status: 308, headers: { Range: `bytes=0-${upload.offset - 1}` } });
      const complete = { ...upload.metadata, content: upload.received, size: String(upload.received.length), ...(!behavior.omitChecksum ? { sha256Checksum: await sha(upload.received) } : {}) };
      files.set(complete.id, complete);
      if (behavior.loseFinal) { behavior.loseFinal = false; throw new TypeError('Synthetic lost acknowledgement'); }
      return json(complete);
    }
    const id = url.pathname.split('/').at(-1)!;
    const file = files.get(id);
    if (!file || file.owner !== identity.uid) return failure(404);
    if (url.searchParams.get('alt') === 'media') return new Response(behavior.downloadOverride || file.content);
    return json(file);
  });
  return { files, uploads, sent, behavior, fetcher };
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  identity.uid = 'brewer-one';
  identity.token = 'test-memory-token';
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('Blob', NodeBlob);
});
afterEach(() => vi.unstubAllGlobals());

async function setup() {
  const drive = fakeDrive();
  vi.stubGlobal('fetch', drive.fetcher);
  const store = await import('../../src/services/driveFileStore');
  const input = { documentId: 'invoice-original-2026', bytes: pdf(), fileName: 'facture.pdf', mimeType: 'application/pdf', year: 2026 };
  return { ...drive, store, input };
}

describe('Drive originals: private storage, bounded transfers and integrity', () => {
  it('requires a memory OAuth token, never reports a simulated successful upload', async () => {
    const { store, input, fetcher } = await setup();
    identity.token = null;
    await expect(store.uploadDriveOriginal(input)).rejects.toMatchObject({ code: 'drive/auth-required' });
    localStorage.setItem('laffinee_gdrive_access_token', 'obsolete-token');
    const { GoogleDriveService } = await import('../../src/services/googleDriveService');
    expect(await GoogleDriveService.uploadInvoiceFile({}, 'data:application/pdf;base64,JVBERi0=')).toMatchObject({ success: false });
    expect(localStorage.getItem('laffinee_gdrive_access_token')).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uploads under the private yearly hierarchy and verifies exact bytes on demand', async () => {
    const { store, input, files, sent } = await setup();
    const ref = await store.uploadDriveOriginal(input);
    expect(ref).toEqual({ driveFileId: expect.any(String), sha256: await sha(input.bytes), bytes: input.bytes.length, mimeType: 'application/pdf', fileName: 'facture.pdf' });
    const directories = [...files.values()].filter(file => file.mimeType.includes('folder'));
    expect(directories.map(file => file.name)).toEqual(['L’Affinée', 'Justificatifs', '2026']);
    expect(files.get(ref.driveFileId)?.parents).toEqual([directories[2].id]);
    expect(sent.every(({ url, init }) => !url.pathname.includes('permissions') && !(typeof init.body === 'string' && init.body.includes('anyone')))).toBe(true);
    expect(Array.from(await store.getDriveOriginalBytes(ref))).toEqual(Array.from(input.bytes));
    expect(await store.loadDriveOriginal(ref)).toBe(`data:application/pdf;base64,${Buffer.from(input.bytes).toString('base64')}`);
    expect(JSON.stringify(localStorage)).not.toContain('test-memory-token');
    expect(JSON.stringify(localStorage)).not.toContain('Facture');
  });

  it('recovers a lost final acknowledgement without duplicate files', async () => {
    const { store, input, files, behavior, sent } = await setup();
    behavior.loseFinal = true;
    const first = await store.uploadDriveOriginal(input);
    const second = await store.uploadDriveOriginal(input);
    expect(second).toEqual(first);
    expect([...files.values()].filter(file => file.content)).toHaveLength(1);
    expect(sent.filter(({ url, init }) => url.pathname.includes('/upload/') && init.method === 'POST')).toHaveLength(1);
  });

  it('resumes confirmed chunks after a mobile connection failure', async () => {
    const { store, input, behavior, sent } = await setup();
    input.bytes = new Uint8Array(2 * 1024 * 1024 + 7).fill(65);
    behavior.failChunkAt = 1024 * 1024;
    await expect(store.uploadDriveOriginal(input)).rejects.toMatchObject({ code: 'drive/network' });
    const ref = await store.uploadDriveOriginal(input);
    expect(ref.bytes).toBe(input.bytes.length);
    const contents = sent.filter(({ init }) => init.method === 'PUT' && init.body);
    expect(contents.map(({ init }) => (init.headers as any)['Content-Range'])).toEqual([
      `bytes 0-1048575/${input.bytes.length}`,
      `bytes 1048576-2097151/${input.bytes.length}`,
      `bytes 1048576-2097151/${input.bytes.length}`,
      `bytes 2097152-${input.bytes.length - 1}/${input.bytes.length}`
    ]);
  });

  it('finds completed originals after module reload or an unavailable local cache', async () => {
    const { store, input, sent } = await setup();
    const ref = await store.uploadDriveOriginal(input);
    localStorage.clear();
    vi.resetModules();
    const reloaded = await import('../../src/services/driveFileStore');
    expect(await reloaded.uploadDriveOriginal(input)).toEqual(ref);
    expect(sent.filter(({ url, init }) => url.pathname.includes('/upload/') && init.method === 'POST')).toHaveLength(1);
  });

  it.each(['trashed', 'deleted'])('repairs a previously confirmed original that was %s using one new ID', async (kind) => {
    const { store, input, files, behavior } = await setup();
    const first = await store.uploadDriveOriginal(input);
    if (kind === 'trashed') files.get(first.driveFileId)!.trashed = true;
    else files.delete(first.driveFileId);
    behavior.loseFinal = true;
    const repaired = await store.uploadDriveOriginal(input);
    expect(repaired.driveFileId).not.toBe(first.driveFileId);
    expect(repaired.sha256).toBe(first.sha256);
    expect(await store.uploadDriveOriginal(input)).toEqual(repaired);
    expect([...files.values()].filter(file => file.content && !file.trashed)).toHaveLength(1);
  });

  it('refuses a changed original under the same stable document ID', async () => {
    const { store, input, files } = await setup();
    await store.uploadDriveOriginal(input);
    await expect(store.uploadDriveOriginal({ ...input, bytes: pdf('Autre facture') })).rejects.toMatchObject({ code: 'drive/integrity' });
    expect([...files.values()].filter(file => file.content)).toHaveLength(1);
  });

  it('deduplicates simultaneous clicks and rejects different concurrent bytes', async () => {
    const { store, input, files } = await setup();
    const results = await Promise.allSettled([store.uploadDriveOriginal(input), store.uploadDriveOriginal(input), store.uploadDriveOriginal({ ...input, bytes: pdf('Autre') })]);
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'fulfilled', 'rejected']);
    expect([...files.values()].filter(file => file.content)).toHaveLength(1);
  });

  it('separates caches and Drive IDs by signed-in user', async () => {
    const { store, input, files } = await setup();
    const first = await store.uploadDriveOriginal(input);
    identity.uid = 'brewer-two';
    const second = await store.uploadDriveOriginal(input);
    expect(second.driveFileId).not.toBe(first.driveFileId);
    expect([...files.values()].filter(file => file.mimeType.includes('folder'))).toHaveLength(6);
    await expect(store.loadDriveOriginal(first)).rejects.toMatchObject({ code: 'drive/not-found' });
  });

  it('uses downloaded SHA-256 when Drive omits its computed checksum', async () => {
    const { store, input, behavior, sent } = await setup();
    behavior.omitChecksum = true;
    await store.uploadDriveOriginal(input);
    expect(sent.some(({ url }) => url.searchParams.get('alt') === 'media')).toBe(true);
  });

  it('rejects changed metadata, content and oversized replacement streams', async () => {
    const { store, input, files, behavior } = await setup();
    const ref = await store.uploadDriveOriginal(input);
    files.get(ref.driveFileId)!.sha256Checksum = 'f'.repeat(64);
    await expect(store.getDriveOriginalBytes(ref)).rejects.toMatchObject({ code: 'drive/integrity' });
    files.get(ref.driveFileId)!.sha256Checksum = ref.sha256;
    behavior.downloadOverride = new Uint8Array(ref.bytes);
    await expect(store.getDriveOriginalBytes(ref)).rejects.toMatchObject({ code: 'drive/integrity' });
    behavior.downloadOverride = new Uint8Array(ref.bytes + 1);
    await expect(store.getDriveOriginalBytes(ref)).rejects.toMatchObject({ code: 'drive/integrity' });
    files.get(ref.driveFileId)!.mimeType = 'text/html';
    await expect(store.getDriveOriginalMetadata(ref)).rejects.toMatchObject({ code: 'drive/integrity' });
  });

  it.each([
    [401, 'authError', 'drive/auth-required'],
    [403, 'storageQuotaExceeded', 'drive/quota'],
    [429, 'userRateLimitExceeded', 'drive/rate-limit'],
    [403, 'insufficientFilePermissions', 'drive/forbidden']
  ])('shows a bounded actionable error for status %s / %s', async (status, reason, code) => {
    const { store, input, behavior } = await setup();
    behavior.forbiddenStatus = Number(status);
    behavior.forbiddenReason = reason as string;
    await expect(store.uploadDriveOriginal(input)).rejects.toMatchObject({ code });
  });

  it('rejects forged references, invalid MIME, oversized content and abort before network', async () => {
    const { store, input, fetcher } = await setup();
    await expect(store.uploadDriveOriginal({ ...input, mimeType: 'text/html' })).rejects.toMatchObject({ code: 'drive/invalid-file' });
    await expect(store.uploadDriveOriginal({ ...input, bytes: new Uint8Array(store.MAX_DRIVE_ORIGINAL_BYTES + 1) })).rejects.toMatchObject({ code: 'drive/invalid-file' });
    await expect(store.uploadDriveOriginal({ ...input, bytes: undefined, dataUrl: 'data:image/png;base64,YQ==' })).rejects.toMatchObject({ code: 'drive/invalid-file' });
    expect(store.validateDriveOriginalReference({})).toBe(false);
    await expect(store.loadDriveOriginal({ driveFileId: '../../secret' } as any)).rejects.toMatchObject({ code: 'drive/invalid-reference' });
    const controller = new AbortController(); controller.abort();
    await expect(store.uploadDriveOriginal({ ...input, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('never forwards authorization to an untrusted resumable URL', async () => {
    const { store, input, behavior, sent } = await setup();
    behavior.unsafeLocation = true;
    await expect(store.uploadDriveOriginal(input)).rejects.toMatchObject({ code: 'drive/invalid-response' });
    expect(sent.every(({ url }) => url.hostname === 'www.googleapis.com')).toBe(true);
  });
});
