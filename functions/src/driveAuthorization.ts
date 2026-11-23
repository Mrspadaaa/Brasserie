import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { OAuth2Client } from 'google-auth-library';
import { requireBrewer } from './brewSession.js';
import { DRIVE_FILE_SCOPE, driveOriginAllowed, authorizedGoogleIdentity, sealDriveCredentials, openDriveCredentials, type DriveCredentials } from './driveAuthorizationCore.js';

const configuration = defineSecret('DRIVE_OAUTH_CONFIG');
type Config = { clientId: string; clientSecret: string; encryptionKey: string };
const consentRequired = () => new HttpsError('failed-precondition', 'Autorise une fois le Drive de ton compte Google. La connexion sera ensuite renouvelée automatiquement.', { reason: 'drive-consent-required' });
const allowedAccounts = () => (process.env.AUTHORIZED_ACCOUNTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
async function owner(request: CallableRequest): Promise<string> {
  const user = await getAuth().getUser(requireBrewer(request));
  if (user.disabled) throw new HttpsError('permission-denied', 'Compte non autorisé.');
  const google = user.providerData.find(provider => provider.providerId === 'google.com');
  if (!google) throw new HttpsError('failed-precondition', 'Connecte-toi avec ton compte Google.');
  return google.uid;
}
async function tokenRequest(config: Config, body: Record<string, string>): Promise<Record<string, any>> {
  let response: Response;
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...body }),
      signal: AbortSignal.timeout(15_000), redirect: 'error'
    });
  } catch { throw new HttpsError('unavailable', 'Google Drive ne répond pas. Réessaie dans un instant.'); }
  const result = await response.json() as Record<string, any>;
  if (result.error === 'invalid_grant') throw consentRequired();
  if (!response.ok || !result.access_token || !Number.isFinite(result.expires_in))
    throw new HttpsError('unavailable', 'L’autorisation Google n’a pas abouti. Réessaie.');
  return result;
}

/** Login exchanges a one-use Google code; only short-lived credentials leave the
 * server. The encrypted offline grant is private and excluded from all exports. */
export const driveAuthorization = onCall({ region: 'europe-west6', secrets: [configuration], maxInstances: 3, timeoutSeconds: 45 }, async request => {
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
  const origin = request.rawRequest.get('origin') || '';
  if (!project || !driveOriginAllowed(origin, project)) throw new HttpsError('permission-denied', 'Origine de connexion refusée.');
  const config = JSON.parse(configuration.value()) as Config;
  const action = request.data?.action;
  if (action === 'config') return { clientId: config.clientId };
  if (action === 'exchange') {
    const code = request.data?.code;
    if (typeof code !== 'string' || code.length < 10 || code.length > 4096) throw new HttpsError('invalid-argument', 'Autorisation Google invalide.');
    const expectedOwner = request.auth ? await owner(request) : undefined;
    const result = await tokenRequest(config, { code, grant_type: 'authorization_code', redirect_uri: origin });
    let payload;
    try { payload = (await new OAuth2Client(config.clientId).verifyIdToken({ idToken: result.id_token, audience: config.clientId })).getPayload(); }
    catch { throw new HttpsError('permission-denied', 'L’identité Google n’a pas pu être vérifiée.'); }
    const googleUid = authorizedGoogleIdentity(payload, allowedAccounts(), expectedOwner);
    if (!googleUid) throw new HttpsError('permission-denied', expectedOwner ? 'Choisis le même compte Google que celui connecté à la brasserie.' : 'Compte non autorisé.');
    const hasDriveScope = String(result.scope || '').split(' ').includes(DRIVE_FILE_SCOPE);
    const ref = getFirestore().doc(`driveAuthorizations/${googleUid}`);
    let persistent = false;
    if (hasDriveScope) {
      persistent = await getFirestore().runTransaction(async tx => {
        const previous = (await tx.get(ref)).data();
        const old = previous?.sealed ? openDriveCredentials(previous.sealed, config.encryptionKey, googleUid) : undefined;
        const refreshToken = result.refresh_token || old?.refreshToken;
        if (!refreshToken) return false;
        const credentials = { refreshToken, accessToken: result.access_token, expiresAt: Date.now() + result.expires_in * 1000 };
        tx.set(ref, { sealed: sealDriveCredentials(credentials, config.encryptionKey, googleUid), updatedAt: Date.now(), connectedAt: previous?.connectedAt || Date.now() });
        return true;
      });
    }
    // Firebase SDK exchanges this Google ID token for the existing Firebase user.
    return { idToken: result.id_token, accessToken: hasDriveScope ? result.access_token : null, expiresAt: Date.now() + result.expires_in * 1000, persistent };
  }
  if (action === 'token') {
    const googleUid = await owner(request), ref = getFirestore().doc(`driveAuthorizations/${googleUid}`);
    const saved = (await ref.get()).data();
    if (!saved?.sealed) throw consentRequired();
    let credentials: DriveCredentials = openDriveCredentials(saved.sealed, config.encryptionKey, googleUid);
    const rejectedToken = typeof request.data?.rejectedToken === 'string' ? request.data.rejectedToken : undefined;
    if (credentials.expiresAt <= Date.now() + 90_000 || rejectedToken === credentials.accessToken) {
      const result = await tokenRequest(config, { refresh_token: credentials.refreshToken, grant_type: 'refresh_token' });
      credentials = { refreshToken: result.refresh_token || credentials.refreshToken, accessToken: result.access_token, expiresAt: Date.now() + result.expires_in * 1000 };
      // A simultaneous new consent wins over renewal of an older grant.
      await getFirestore().runTransaction(async tx => {
        const current = (await tx.get(ref)).data();
        if (current?.sealed !== saved.sealed) {
          if (!current?.sealed) throw consentRequired();
          credentials = openDriveCredentials(current.sealed, config.encryptionKey, googleUid);
          return;
        }
        tx.update(ref, { sealed: sealDriveCredentials(credentials, config.encryptionKey, googleUid), updatedAt: Date.now() });
      });
    }
    return { accessToken: credentials.accessToken, expiresAt: credentials.expiresAt, persistent: true };
  }
  throw new HttpsError('invalid-argument', 'Action Drive inconnue.');
});
