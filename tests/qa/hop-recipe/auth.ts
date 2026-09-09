// Adapter for the isolated QA build, never an application authentication route.
export { app, auth, firebaseConfig } from '../../../src/services/firebase';
const user = { uid: '__HOP_RECIPE_QA_ONLY__', email: 'qa@localhost', displayName: 'Banc local', photoURL: null };
export const AUTHORIZED_ACCOUNTS = ['qa@localhost'];
export const FirebaseAuthService = {
  onUserChange(cb: (user: any) => void) { const timer = setTimeout(() => cb(user), 0); return () => clearTimeout(timer); },
  getCurrentUser: () => user, isAuthorized: () => true, isUserAuthenticatedAndAuthorized: () => true,
  getAuth: () => ({ currentUser: user }), getDriveAccessToken: () => null, driveTokenExpired: () => false, hasDriveAccess: () => false,
  async loginWithGoogle() { return { success: true, user }; }, async logout() {},
  async refreshDriveAccess() { return { success: false, error: 'Drive hors banc QA' }; }
};
