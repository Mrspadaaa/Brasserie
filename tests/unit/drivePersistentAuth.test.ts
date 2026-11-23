import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ auth: { currentUser: { uid: 'brewer-user', email: 'brewer@example.invalid' } as any }, authorize: vi.fn(), renew: vi.fn(), signIn: vi.fn() }));
vi.mock('../../src/services/firebase', () => ({ app: {}, auth: state.auth, firebaseConfig: {} }));
vi.mock('../../src/services/googleAuthorization', () => ({ authorizeGoogleDrive: state.authorize, renewGoogleDriveToken: state.renew, prepareGoogleAuthorization: vi.fn() }));
vi.mock('firebase/auth', () => ({ GoogleAuthProvider: class { static credential = vi.fn(); addScope() {} setCustomParameters() {} }, signInWithCredential: state.signIn, signOut: vi.fn(), onAuthStateChanged: vi.fn() }));
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  state.auth.currentUser = { uid: 'brewer-user', email: 'brewer@example.invalid' };
  state.authorize.mockResolvedValue({ accessToken: 'synthetic-drive-token', expiresAt: Date.now() + 3600_000, persistent: true });
  state.renew.mockResolvedValue({ accessToken: 'renewed-token', expiresAt: Date.now() + 3600_000, persistent: true });
});
describe('Drive persistant, lié au compte Google connecté', () => {
  it('consent une fois sur le compte connecté sans ouvrir une autre session Firebase', async () => {
    const { FirebaseAuthService: service } = await import('../../src/services/firebaseAuth');
    expect(await service.refreshDriveAccess()).toEqual({ success: true });
    expect(state.authorize).toHaveBeenCalledWith('brewer@example.invalid');
    expect(state.signIn).not.toHaveBeenCalled(); expect(service.getDriveAccessToken()).toBe('synthetic-drive-token');
  });
  it('restaure le jeton après rechargement, mutualise les demandes et renouvelle après un 401', async () => {
    const { FirebaseAuthService: service } = await import('../../src/services/firebaseAuth');
    expect(service.getDriveAccessToken()).toBeNull();
    expect(await Promise.all([service.ensureDriveAccessToken(), service.ensureDriveAccessToken()])).toEqual(['renewed-token', 'renewed-token']);
    expect(state.renew).toHaveBeenCalledOnce(); expect(state.authorize).not.toHaveBeenCalled();
    await service.ensureDriveAccessToken(); expect(state.renew).toHaveBeenCalledOnce();
    await service.ensureDriveAccessToken('renewed-token'); expect(state.renew).toHaveBeenCalledTimes(2);
  });
  it('ne partage jamais le jeton avec un compte qui change pendant la demande', async () => {
    const { FirebaseAuthService: service } = await import('../../src/services/firebaseAuth');
    state.authorize.mockImplementationOnce(async () => { state.auth.currentUser = { uid: 'other' }; return { accessToken: 'wrong', expiresAt: Date.now()+3600_000, persistent: true }; });
    expect((await service.refreshDriveAccess()).success).toBe(false); expect(service.getDriveAccessToken()).toBeNull();
    state.renew.mockImplementationOnce(async () => { state.auth.currentUser = { uid: 'third' }; return { accessToken: 'wrong', expiresAt: Date.now()+3600_000 }; });
    expect(await service.ensureDriveAccessToken()).toBeNull(); expect(service.getDriveAccessToken()).toBeNull();
  });
  it('demande un nouveau consentement seulement après révocation, conserve les erreurs réseau', async () => {
    const { FirebaseAuthService: service } = await import('../../src/services/firebaseAuth');
    state.renew.mockRejectedValueOnce({ code: 'functions/failed-precondition' });
    expect(await service.ensureDriveAccessToken()).toBeNull(); expect(state.authorize).not.toHaveBeenCalled();
    state.renew.mockRejectedValueOnce({ code: 'functions/unavailable' });
    await expect(service.ensureDriveAccessToken()).rejects.toMatchObject({ code: 'functions/unavailable' });
    state.auth.currentUser = null; expect((await service.refreshDriveAccess()).success).toBe(false);
  });
});
