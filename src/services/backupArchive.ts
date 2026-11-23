import { Unzip, Zip, ZipPassThrough, strToU8 } from 'fflate';
import { parseBackup, stableJson, type BreweryBackup } from '../../functions/src/backupCore';

export const BACKUP_VOLUME_BYTES = 32 * 1024 * 1024;
export const BACKUP_PAGE_BYTES = 3_000_000;
export const BACKUP_VOLUME_PAGES = 100;
const MAX_VOLUME_BYTES = BACKUP_VOLUME_BYTES + BACKUP_PAGE_BYTES + 1_000_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
export const backupHash = async (value: string | Uint8Array): Promise<string> => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value)))).map(b => b.toString(16).padStart(2, '0')).join('');
export function checkBackupAbort(signal?: AbortSignal): void { if (signal?.aborted) throw Error('Opération interrompue. Les fichiers restent disponibles pour reprendre.'); }
export const backupDocumentCount = (backup: BreweryBackup) => Object.values(backup.collections).reduce((sum, rows) => sum + (rows?.length ?? 0), 0);

export interface BackupPage { pageIndex: number; json: string; sha256: string }
export interface BackupPageDescriptor { index: number; path: string; sha256: string; bytes: number; documents: number }
export interface BackupVolumeManifest {
  format: 'laffinee-backup'; version: 1; backupId: string; exportedAt: string; volume: number;
  previousDigest: string | null; final: boolean; totalDocuments: number; pages: BackupPageDescriptor[];
}
export interface BackupVolume {
  blob: Blob; fileName: string; volume: number; final: boolean; documentCount: number;
  totalDocuments: number; exportedAt: string; digest: string; warnings?: string[];
}
const validHash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
export async function createBackupVolume(input: Omit<BackupVolumeManifest, 'format' | 'version' | 'pages'> & { pages: BackupPage[] }): Promise<BackupVolume> {
  const chunks: BlobPart[] = []; let failure: Error | undefined;
  const zip = new Zip((error, bytes) => { if (error) failure = error; else chunks.push(new Uint8Array(bytes).buffer); });
  const add = (path: string, bytes: Uint8Array) => { const part = new ZipPassThrough(path); zip.add(part); part.push(bytes, true); };
  const pages: BackupPageDescriptor[] = [];
  for (const page of input.pages) {
    const bytes = encoder.encode(page.json), backup = parseBackup(page.json);
    if (bytes.length > BACKUP_PAGE_BYTES || backup.exportedAt !== input.exportedAt || await backupHash(bytes) !== page.sha256) throw Error('Page de sauvegarde incohérente.');
    const path = `pages/${String(page.pageIndex).padStart(8, '0')}.json`;
    pages.push({ index: page.pageIndex, path, sha256: page.sha256, bytes: bytes.length, documents: backupDocumentCount(backup) });
    add(path, bytes);
  }
  const manifest: BackupVolumeManifest = { format: 'laffinee-backup', version: 1, backupId: input.backupId, exportedAt: input.exportedAt, volume: input.volume, previousDigest: input.previousDigest, final: input.final, totalDocuments: input.totalDocuments, pages };
  validateManifest(manifest);
  add('manifest.json', strToU8(JSON.stringify(manifest))); zip.end();
  if (failure) throw failure;
  const blob = new Blob(chunks, { type: 'application/zip' });
  if (blob.size > MAX_VOLUME_BYTES) throw Error('Volume trop gros. Réessaie la préparation.');
  return { blob, fileName: `Laffinee-sauvegarde-${input.exportedAt.slice(0, 10)}-${input.backupId.slice(0, 8)}-volume-${String(input.volume).padStart(3, '0')}.zip`, volume: input.volume, final: input.final, documentCount: pages.reduce((n, p) => n + p.documents, 0), totalDocuments: input.totalDocuments, exportedAt: input.exportedAt, digest: await backupHash(stableJson(manifest)) };
}
function validateManifest(m: any): asserts m is BackupVolumeManifest {
  if (!m || m.format !== 'laffinee-backup' || m.version !== 1 || typeof m.backupId !== 'string' || !/^[\w-]{8,150}$/.test(m.backupId) || !Number.isFinite(Date.parse(m.exportedAt)) || !Number.isSafeInteger(m.volume) || m.volume < 1 || typeof m.final !== 'boolean' || !Number.isSafeInteger(m.totalDocuments) || m.totalDocuments < 0 || !(m.previousDigest === null || validHash(m.previousDigest)) || !Array.isArray(m.pages) || m.pages.length < 1 || m.pages.length > BACKUP_VOLUME_PAGES) throw Error('Ce ZIP n’est pas un volume de sauvegarde pris en charge.');
  for (const p of m.pages) if (!p || !Number.isSafeInteger(p.index) || p.index < 0 || p.path !== `pages/${String(p.index).padStart(8, '0')}.json` || !validHash(p.sha256) || !Number.isSafeInteger(p.bytes) || p.bytes < 1 || p.bytes > BACKUP_PAGE_BYTES || !Number.isSafeInteger(p.documents) || p.documents < 0) throw Error('Index de sauvegarde invalide.');
  if (new Set(m.pages.map((p: BackupPageDescriptor) => p.index)).size !== m.pages.length) throw Error('Une page est présente plusieurs fois dans le volume.');
}

/** Stored ZIP only, bounded per volume and per entry; no decompression bombs. */
export async function readBackupVolume(file: Blob, signal?: AbortSignal): Promise<{ manifest: BackupVolumeManifest; digest: string; pages: BackupPage[] }> {
  checkBackupAbort(signal);
  if (file.size < 22 || file.size > MAX_VOLUME_BYTES) throw Error('Taille du volume invalide. Sélectionne les ZIP de sauvegarde produits par l’application.');
  const end = new DataView(await file.slice(-22).arrayBuffer());
  if (end.getUint32(0, true) !== 0x06054b50 || end.getUint16(4, true) || end.getUint16(6, true) || end.getUint16(20, true) || end.getUint32(12, true) + end.getUint32(16, true) !== file.size - 22) throw Error('Volume ZIP incomplet ou modifié. Récupère à nouveau ce fichier.');
  const contents = new Map<string, Uint8Array>(); const names = new Set<string>(); let failure: Error | undefined;
  const unzip = new Unzip(entry => {
    if (failure) return;
    if (names.has(entry.name) || names.size >= BACKUP_VOLUME_PAGES + 1 || entry.compression !== 0 || !/^(manifest\.json|pages\/\d{8,}\.json)$/.test(entry.name)) { failure = Error('Contenu ZIP inattendu, compressé ou dupliqué. Utilise les volumes originaux.'); return; }
    names.add(entry.name); const limit = entry.name === 'manifest.json' ? 1_000_000 : BACKUP_PAGE_BYTES;
    if ((entry.originalSize ?? 0) > limit) { failure = Error('Page de sauvegarde trop volumineuse.'); return; }
    const parts: Uint8Array[] = []; let size = 0;
    entry.ondata = (error, bytes, final) => {
      if (error) { failure = error; return; } if (failure) return;
      size += bytes.length; if (size > limit) { failure = Error('Page de sauvegarde trop volumineuse.'); entry.terminate(); return; }
      parts.push(new Uint8Array(bytes));
      if (final) { const all = new Uint8Array(size); let offset = 0; for (const part of parts) { all.set(part, offset); offset += part.length; } contents.set(entry.name, all); }
    };
    entry.start();
  });
  for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
    checkBackupAbort(signal); const finish = Math.min(file.size, offset + 1024 * 1024);
    unzip.push(new Uint8Array(await file.slice(offset, finish).arrayBuffer()), finish === file.size);
    if (failure) throw failure;
  }
  const raw = contents.get('manifest.json'); if (!raw) throw Error('Manifeste de sauvegarde absent.');
  const manifest: unknown = JSON.parse(decoder.decode(raw)); validateManifest(manifest);
  if (contents.size !== names.size || contents.size !== manifest.pages.length + 1 || end.getUint16(10, true) !== contents.size || end.getUint16(8, true) !== contents.size) throw Error('Le volume est incomplet ou contient des fichiers supplémentaires.');
  const pages: BackupPage[] = [];
  for (const descriptor of manifest.pages) {
    checkBackupAbort(signal); const bytes = contents.get(descriptor.path);
    if (!bytes || bytes.length !== descriptor.bytes || await backupHash(bytes) !== descriptor.sha256) throw Error(`Page ${descriptor.index + 1} absente ou altérée.`);
    const json = decoder.decode(bytes), parsed = parseBackup(json);
    if (parsed.exportedAt !== manifest.exportedAt || backupDocumentCount(parsed) !== descriptor.documents) throw Error('Date ou nombre d’éléments incohérent dans la sauvegarde.');
    pages.push({ pageIndex: descriptor.index, json, sha256: descriptor.sha256 });
  }
  return { manifest, digest: await backupHash(stableJson(manifest)), pages };
}

/** Small inventory of references and chunk lengths; never retain all originals in RAM. */
export class BackupInventory {
  private paths = new Set<string>();
  private referenced = new Set<string>();
  private originals = new Map<string, { mimeType: string; fileName: string; chunkCount: number; length: number }>();
  private chunks = new Map<string, Map<number, { length: number; prefix: string; padding: boolean }>>();
  documentCount = 0; originalCount = 0; externalLinks = 0;
  add(backup: BreweryBackup): void {
    const references = (value: any): void => {
      if (!value || typeof value !== 'object') return;
      if (typeof value.proofDocumentId === 'string') this.referenced.add(value.proofDocumentId);
      if (typeof value.proofUrl === 'string' && /^https?:/.test(value.proofUrl)) this.externalLinks++;
      if (Array.isArray(value.attachments)) for (const a of value.attachments) if (typeof a?.documentId === 'string') this.referenced.add(a.documentId);
      for (const child of Object.values(value)) if (typeof child === 'object') references(child);
    };
    for (const [collection, rows] of Object.entries(backup.collections)) for (const { id, data } of rows ?? []) {
      const path = `${collection}/${id}`; if (this.paths.has(path)) throw Error(`Élément présent plusieurs fois : ${path}.`);
      this.paths.add(path); this.documentCount++;
      if (collection !== 'financeDocuments') { references(data); continue; }
      if (typeof data.documentId === 'string') {
        if (!Number.isInteger(data.index) || data.index < 0 || data.index > 13 || id !== `${data.documentId}-${data.index}` || typeof data.data !== 'string' || data.data.length > 400_000 || !data.data.length) throw Error('Bloc de justificatif invalide.');
        const source: string = data.data;
        const match = data.index === 0 ? /^(data:(?:application\/pdf|image\/(?:png|jpeg|webp));base64,)([A-Za-z0-9+/]*={0,2})$/.exec(source) : null;
        const body = data.index === 0 ? match?.[2] : source;
        if (body == null || !/^[A-Za-z0-9+/]*={0,2}$/.test(body)) throw Error('Encodage du justificatif invalide.');
        const parts = this.chunks.get(data.documentId) ?? new Map();
        if (parts.has(data.index)) throw Error('Bloc de justificatif dupliqué.');
        parts.set(data.index, { length: source.length, prefix: match?.[1] ?? '', padding: body.includes('=') }); this.chunks.set(data.documentId, parts);
      } else {
        if (!Number.isInteger(data.chunkCount) || data.chunkCount < 1 || data.chunkCount > 14 || !Number.isInteger(data.length) || data.length < 1 || data.length > 5_600_000 || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(data.mimeType) || typeof data.fileName !== 'string') throw Error('Description du justificatif invalide.');
        this.originals.set(id, data as any); this.originalCount++;
      }
    }
  }
  finish(): string[] {
    for (const id of this.referenced) if (!this.originals.has(id)) throw Error(`L’original ${id} manque à la sauvegarde. Utilise une copie serveur complète.`);
    for (const id of this.chunks.keys()) if (!this.originals.has(id)) throw Error(`Description manquante pour le justificatif ${id}.`);
    for (const [id, meta] of this.originals) {
      const parts = this.chunks.get(id), prefix = `data:${meta.mimeType};base64,`;
      if (!parts || parts.size !== meta.chunkCount || parts.get(0)?.prefix !== prefix) throw Error(`Justificatif incomplet : ${meta.fileName}.`);
      let length = 0;
      for (let i = 0; i < meta.chunkCount; i++) { const part = parts.get(i); if (!part || (i < meta.chunkCount - 1 && (part.padding || part.length !== 400_000))) throw Error(`Bloc manquant ou invalide : ${meta.fileName}.`); length += part.length; }
      if (length !== meta.length || (length - prefix.length) % 4 !== 0) throw Error(`Taille du justificatif incohérente : ${meta.fileName}.`);
    }
    return this.externalLinks ? [`${this.externalLinks} référence(s) à des fichiers externes : leurs liens sont conservés, les fichiers restent chez leur hébergeur.`] : [];
  }
}

export function splitLegacyBackup(backup: BreweryBackup): string[] {
  const pages: string[] = []; let collections: BreweryBackup['collections'] = {}, size = 0, count = 0;
  const flush = () => { if (Object.keys(collections).length) pages.push(JSON.stringify({ schemaVersion: 3, source: backup.source, exportedAt: backup.exportedAt, collections })); collections = {}; size = 0; count = 0; };
  for (const [name, rows] of Object.entries(backup.collections)) {
    if (!rows?.length) { (collections as any)[name] ??= []; continue; }
    for (const row of rows) {
      const bytes = encoder.encode(JSON.stringify(row)).length + name.length + 200;
      if (size + bytes > BACKUP_PAGE_BYTES - 1000 || count >= 100) flush();
      ((collections as any)[name] ??= []).push(row); size += bytes; count++;
    }
  }
  flush(); return pages;
}
