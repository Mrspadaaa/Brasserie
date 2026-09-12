import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export interface DriveCredentials { refreshToken: string; accessToken: string; expiresAt: number }

/** Credentials are authenticated to their Google owner as well as encrypted. */
export function sealDriveCredentials(value: DriveCredentials, key: string, googleUid: string): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);
  cipher.setAAD(Buffer.from(googleUid));
  const body = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
}
export function openDriveCredentials(value: string, key: string, googleUid: string): DriveCredentials {
  const bytes = Buffer.from(value, 'base64');
  const cipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64'), bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(googleUid)); cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8'));
}
export function driveOriginAllowed(origin: string, project: string): boolean {
  return origin === `https://${project}.web.app` || origin === `https://${project}.firebaseapp.com` ||
    (process.env.FUNCTIONS_EMULATOR === 'true' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
}
export function authorizedGoogleIdentity(payload: { sub?: string; email?: string; email_verified?: boolean } | undefined, allowed: string[], expectedGoogleUid?: string): string | null {
  if (!payload?.sub || !/^[a-zA-Z0-9_-]{1,128}$/.test(payload.sub) || payload.email_verified !== true ||
    !allowed.includes((payload.email || '').toLowerCase()) || expectedGoogleUid && expectedGoogleUid !== payload.sub) return null;
  return payload.sub;
}
