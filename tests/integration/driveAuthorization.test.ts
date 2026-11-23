// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ docs: new Map<string, any>(), verify: vi.fn(), fetch: vi.fn(), getUser: vi.fn(), key: Buffer.alloc(32, 7).toString('base64') }));
vi.mock('../../functions/node_modules/google-auth-library/build/src/index.js', () => ({ OAuth2Client: class { async verifyIdToken(input: any) { return { getPayload: () => state.verify(input) }; } } }));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/auth/index.js', () => ({ getAuth: () => ({ getUser: state.getUser }) }));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({ getFirestore: () => ({
  doc: (path: string) => ({ path, get: async () => ({ data: () => state.docs.get(path) }) }),
  runTransaction: async (callback: any) => callback({ get: async (ref: any) => ({ data: () => state.docs.get(ref.path) }), set: (ref: any, data: any) => state.docs.set(ref.path, data), update: (ref: any, data: any) => state.docs.set(ref.path, { ...state.docs.get(ref.path), ...data }) })
}) }));
import { driveAuthorization } from '../../functions/src/driveAuthorization';
import { DRIVE_FILE_SCOPE, openDriveCredentials, sealDriveCredentials } from '../../functions/src/driveAuthorizationCore';
const handler = (input: any) => driveAuthorization.run(input);
const auth = { uid: 'firebase-brewer', token: { email: 'brewer@example.invalid', email_verified: true } };
const request = (data: any, authenticated = true, origin = 'https://test-brew.web.app') => ({ data, auth: authenticated ? auth : undefined, rawRequest: { get: () => origin } });
const tokenResult = (extra = {}) => new Response(JSON.stringify({ access_token: 'new-access', refresh_token: 'offline-grant', expires_in: 3600, id_token: 'google-id', scope: `openid email ${DRIVE_FILE_SCOPE}`, ...extra }), { status: 200 });
beforeEach(() => {
  state.docs.clear(); vi.clearAllMocks();
  vi.stubEnv('GCLOUD_PROJECT', 'test-brew'); vi.stubEnv('AUTHORIZED_ACCOUNTS', auth.token.email);
  vi.stubEnv('DRIVE_OAUTH_CONFIG', JSON.stringify({ clientId: 'test-client', clientSecret: 'test-secret', encryptionKey: state.key }));
  vi.stubGlobal('fetch', state.fetch);
  state.getUser.mockResolvedValue({ providerData: [{ providerId: 'google.com', uid: 'google-brewer' }] });
  state.verify.mockReturnValue({ sub: 'google-brewer', email: auth.token.email, email_verified: true });
  state.fetch.mockImplementation(async () => tokenResult());
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Connexion Google et persistance Drive côté serveur', () => {
  it('échange le code de connexion, conserve le grant chiffré et ne renvoie que des jetons temporaires', async () => {
    const result = await handler(request({ action: 'exchange', code: 'one-use-google-code' }, false));
    expect(result).toMatchObject({ idToken: 'google-id', accessToken: 'new-access', persistent: true });
    expect(JSON.stringify(result)).not.toContain('offline-grant');
    const saved = state.docs.get('driveAuthorizations/google-brewer');
    expect(JSON.stringify(saved)).not.toContain('offline-grant');
    expect(openDriveCredentials(saved.sealed, state.key, 'google-brewer').refreshToken).toBe('offline-grant');
    expect(state.verify).toHaveBeenCalledWith({ idToken: 'google-id', audience: 'test-client' });
    expect(String(state.fetch.mock.calls[0][1].body)).toContain('redirect_uri=https%3A%2F%2Ftest-brew.web.app');
  });
  it('retrouve le grant au rechargement, renouvelle après expiration et reprend après 401', async () => {
    await handler(request({ action: 'exchange', code: 'one-use-google-code' }));
    state.fetch.mockClear();
    expect(await handler(request({ action: 'token' }))).toMatchObject({ accessToken: 'new-access' });
    expect(state.fetch).not.toHaveBeenCalled();
    const saved = state.docs.get('driveAuthorizations/google-brewer');
    saved.sealed = sealDriveCredentials({ refreshToken: 'offline-grant', accessToken: 'expired', expiresAt: 1 }, state.key, 'google-brewer');
    expect(await handler(request({ action: 'token' }))).toMatchObject({ accessToken: 'new-access' });
    expect(String(state.fetch.mock.calls[0][1].body)).toContain('grant_type=refresh_token');
    await handler(request({ action: 'token', rejectedToken: 'new-access' })); expect(state.fetch).toHaveBeenCalledTimes(2);
  });
  it('refuse un autre compte Google et une origine étrangère avant toute persistance', async () => {
    state.verify.mockReturnValue({ sub: 'different-google-user', email: auth.token.email, email_verified: true });
    await expect(handler(request({ action: 'exchange', code: 'one-use-google-code' }))).rejects.toMatchObject({ code: 'permission-denied' });
    expect(state.docs.size).toBe(0);
    await expect(handler(request({ action: 'config' }, false, 'https://attacker.invalid'))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(handler(request({ action: 'token' }, false))).rejects.toMatchObject({ code: 'unauthenticated' });
  });
  it('traite une révocation sans fuite de secret et sans effacer les documents métier', async () => {
    await handler(request({ action: 'exchange', code: 'one-use-google-code' }));
    state.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'private-google-detail' }), { status: 400 }));
    await expect(handler(request({ action: 'token', rejectedToken: 'new-access' }))).rejects.toMatchObject({ code: 'failed-precondition', details: { reason: 'drive-consent-required' } });
    expect([...state.docs.keys()]).toEqual(['driveAuthorizations/google-brewer']);
  });
  it('préserve le renouvellement précédent si Google ne réémet pas de refresh token', async () => {
    await handler(request({ action: 'exchange', code: 'first-google-code' }));
    state.fetch.mockResolvedValueOnce(tokenResult({ refresh_token: undefined }));
    expect(await handler(request({ action: 'exchange', code: 'second-google-code' }))).toMatchObject({ persistent: true });
    expect(openDriveCredentials(state.docs.get('driveAuthorizations/google-brewer').sealed, state.key, 'google-brewer').refreshToken).toBe('offline-grant');
  });
});
