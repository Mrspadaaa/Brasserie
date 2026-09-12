import { createHash } from 'node:crypto';
import { HttpsError } from 'firebase-functions/v2/https';
import { isDriveFinanceOriginal, type DriveFinanceOriginal } from './financeOriginalCore.js';

export const originalSha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
/** The archive always contains the original bytes, independently of its provider. */
export function decodeOriginal(dataUrl: unknown, mimeType: string): Buffer {
  const fail = () => { throw new HttpsError('failed-precondition', 'Justificatif incomplet ou format invalide.'); };
  if (typeof dataUrl !== 'string' || dataUrl.length > 5_600_000 || !dataUrl.startsWith(`data:${mimeType};base64,`)) return fail();
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1), content = Buffer.from(base64, 'base64');
  if (!content.length || content.length > 4 * 1024 * 1024 || content.toString('base64') !== base64) return fail();
  const valid = mimeType === 'application/pdf' ? content.subarray(0, 5).toString() === '%PDF-' && content.subarray(-2048).includes(Buffer.from('%%EOF'))
    : mimeType === 'image/png' ? content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : mimeType === 'image/jpeg' ? content[0] === 255 && content[1] === 216 && content.at(-2) === 255 && content.at(-1) === 217
        : mimeType === 'image/webp' && content.subarray(0, 4).toString() === 'RIFF' && content.subarray(8, 12).toString() === 'WEBP';
  if (!valid) return fail();
  return content;
}

/** OAuth credentials stay in this request only. Verify actual Drive content before
 * removing any Firestore binary; a client-supplied checksum is not sufficient. */
export async function verifyDriveOriginal(value: unknown, token: unknown): Promise<DriveFinanceOriginal> {
  if (!isDriveFinanceOriginal(value)) throw new HttpsError('invalid-argument', 'Référence Drive invalide.');
  if (typeof token !== 'string' || token.length < 10 || token.length > 8192 || /[\r\n]/.test(token)) throw new HttpsError('failed-precondition', 'Connecte Drive pour confirmer le fichier.');
  const get = async (suffix: string) => {
    let response: Response;
    try { response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(value.driveFileId)}${suffix}`, {
      headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(60_000)
    }); } catch { throw new HttpsError('unavailable', 'Drive ne répond pas. L’original conservé dans la base n’a pas été supprimé.'); }
    if ([401, 403].includes(response.status)) throw new HttpsError('permission-denied', 'Reconnecte Drive puis réessaie.');
    if (!response.ok) throw new HttpsError('unavailable', 'Le fichier Drive est indisponible. Réessaie sans supprimer l’original.');
    return response;
  };
  const meta = await (await get('?fields=id,mimeType,size,trashed,sha256Checksum')).json() as any;
  if (meta.trashed || meta.id !== value.driveFileId || meta.mimeType !== value.mimeType || Number(meta.size) !== value.bytes || meta.sha256Checksum && meta.sha256Checksum !== value.sha256)
    throw new HttpsError('failed-precondition', 'Le fichier Drive ne correspond pas à cet original.');
  const response = await get('?alt=media'), reader = response.body?.getReader();
  if (!reader) throw new HttpsError('unavailable', 'Le fichier Drive est vide.');
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { value: chunk, done } = await reader.read(); if (done) break;
      length += chunk.byteLength;
      if (length > value.bytes) throw new HttpsError('failed-precondition', 'La taille du fichier Drive ne correspond pas à l’original.');
      chunks.push(chunk);
    }
  } finally { await reader.cancel().catch(() => {}); }
  if (length !== value.bytes || originalSha(Buffer.concat(chunks)) !== value.sha256) throw new HttpsError('failed-precondition', 'Le contenu du fichier Drive a changé. Aucun original n’a été supprimé.');
  return value;
}
