import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app, auth } from './firebase';
import { authorizeGoogleDrive, prepareGoogleAuthorization, renewGoogleDriveToken } from './googleAuthorization';

export { app, auth };
export { firebaseConfig } from './firebase';

/**
 * Comptes autorisés — copie CÔTÉ CLIENT.
 *
 * ⚠️ Cette liste ne sécurise RIEN : elle est lisible et modifiable depuis les
 * outils de développement du navigateur. Elle sert uniquement à afficher un
 * message clair à quelqu'un qui se tromperait de compte Google, et à éviter de
 * charger une interface qui de toute façon ne renverrait aucune donnée.
 *
 * La véritable autorisation est appliquée par les serveurs de Google :
 *   - `firestore.rules` pour l'accès aux données ;
 *   - la vérification d'e-mail dans les Cloud Functions pour l'IA.
 * Les trois listes doivent rester synchronisées lors de l'ajout d'un compte.
 */
/*
 * ⚠️ L'adresse réelle n'est PAS écrite ici : le dépôt est public, et publier la
 * liste blanche revient à désigner le compte à attaquer. Elle se lit dans
 * `.env` (`VITE_AUTHORIZED_ACCOUNTS`, adresses séparées par des virgules),
 * jamais committé.
 *
 * ⚠️ Le repli était une adresse d'exemple, et c'était une FAUTE : un `.env`
 * oublié au moment du build produisait une application qui refusait son propre
 * propriétaire, avec un message l'accusant de se tromper de compte. Une liste
 * absente ne veut pas dire « personne n'est autorisé », elle veut dire « cette
 * copie ne sait pas » — et dans ce cas c'est aux serveurs de Google de
 * trancher, comme le dit le commentaire ci-dessus. Liste vide = on laisse
 * passer, `firestore.rules` refusera si besoin.
 */
export const AUTHORIZED_ACCOUNTS: string[] = (
  import.meta.env.VITE_AUTHORIZED_ACCOUNTS || ''
)
  .split(',')
  .map((a: string) => a.trim().toLowerCase())
  .filter(Boolean);

/**
 * Portée Google Drive demandée à la connexion.
 *
 * `drive.file` est la portée la plus étroite qui permette de déposer des
 * documents : l'application ne voit QUE les fichiers qu'elle a elle-même créés,
 * jamais le reste du Drive de Gaëtan. Elle est classée non-sensible par Google,
 * ce qui évite l'audit de sécurité annuel CASA (~540 $/an) imposé aux portées
 * Drive étendues.
 */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope(DRIVE_SCOPE);
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Only the short-lived access token lives in browser memory. The offline grant
// is encrypted on the server and strictly bound to the Google/Firebase owner.
let driveAccessToken: string | null = null, driveTokenExpiresAt = 0, driveTokenOwner: string | null = null;
let renewal: { uid: string; promise: Promise<string | null> } | null = null;
function setDriveToken(token: string | null, expiresAt = 0, uid: string | null = null) {
  driveAccessToken = token; driveTokenExpiresAt = expiresAt; driveTokenOwner = uid;
}

function isEmailAuthorized(email?: string | null): boolean {
  if (!email) return false;
  // Liste absente : cette copie ne sait pas qui est autorisé. On laisse Google
  // trancher plutôt que de fermer la porte au propriétaire.
  if (AUTHORIZED_ACCOUNTS.length === 0) return true;
  const clean = email.toLowerCase().trim();
  return AUTHORIZED_ACCOUNTS.some((a) => a.toLowerCase().trim() === clean);
}

export const FirebaseAuthService = {
  getAuth() {
    return auth;
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  isAuthorized(email?: string | null): boolean {
    return isEmailAuthorized(email);
  },

  isUserAuthenticatedAndAuthorized(): boolean {
    const user = auth.currentUser;
    return !!user && isEmailAuthorized(user.email);
  },

  // --- Jeton Google Drive ---

  getDriveAccessToken(): string | null {
    return driveTokenOwner === auth.currentUser?.uid && Date.now() < driveTokenExpiresAt - 60_000 ? driveAccessToken : null;
  },
  driveTokenExpired(): boolean { return driveTokenOwner === auth.currentUser?.uid && Boolean(driveAccessToken) && !this.getDriveAccessToken(); },
  hasDriveAccess(): boolean { return this.getDriveAccessToken() !== null; },
  prepareGoogleLogin: prepareGoogleAuthorization,

  /** Silent renewal after a reload or expiry. Never opens a consent popup. */
  async ensureDriveAccessToken(rejectedToken?: string): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const cached = this.getDriveAccessToken();
    if (cached && cached !== rejectedToken) return cached;
    if (renewal?.uid === user.uid) return renewal.promise;
    const promise = renewGoogleDriveToken(rejectedToken).then(result => {
      if (auth.currentUser?.uid !== user.uid) return null;
      setDriveToken(result.accessToken, result.expiresAt, user.uid);
      return result.accessToken;
    }).catch(error => {
      if (auth.currentUser?.uid === user.uid && error?.code === 'functions/failed-precondition') { setDriveToken(null); return null; }
      throw error;
    }).finally(() => { if (renewal?.promise === promise) renewal = null; });
    renewal = { uid: user.uid, promise };
    return promise;
  },

  /** One-time offline consent for existing sessions, on the same Google account. */
  async refreshDriveAccess(): Promise<{ success: boolean; error?: string }> {
    const current = auth.currentUser;
    if (!current) return { success: false, error: 'Reconnecte-toi à la brasserie avant de connecter Drive.' };
    try {
      const result = await authorizeGoogleDrive(current.email || undefined);
      if (auth.currentUser?.uid !== current.uid) return { success: false, error: 'Le compte a changé. Reconnecte le compte de la brasserie.' };
      if (!result.persistent || !result.accessToken) return { success: false, error: 'Coche l’accès aux fichiers Drive de la brasserie dans la fenêtre Google pour conserver la connexion.' };
      setDriveToken(result.accessToken, result.expiresAt, current.uid);
      return { success: true };
    } catch (error: any) { return { success: false, error: error.message || 'La connexion Google n’a pas abouti.' }; }
  },

  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const grant = await authorizeGoogleDrive();
      if (!grant.idToken) return { success: false, error: 'La connexion Google n’a pas abouti. Réessaie.' };
      const result = await signInWithCredential(auth, GoogleAuthProvider.credential(grant.idToken, grant.accessToken));
      if (!isEmailAuthorized(result.user.email)) {
        await signOut(auth); setDriveToken(null);
        return { success: false, error: 'Accès refusé. Ce compte n’est pas autorisé.' };
      }
      setDriveToken(grant.accessToken, grant.expiresAt, result.user.uid);
      return { success: true, user: result.user };
    } catch (error: any) { return { success: false, error: error.message || 'Erreur lors de la connexion avec Google.' }; }
  },

  async logout(): Promise<void> {
    setDriveToken(null);
    await signOut(auth);
  },

  onUserChange(callback: (user: User | null) => void) {
    try {
      return onAuthStateChanged(
        auth,
        (user) => {
          try {
            if (user && isEmailAuthorized(user.email)) {
              callback(user);
            } else {
              if (user) {
                signOut(auth).catch(() => {});
              }
              setDriveToken(null);
              callback(null);
            }
          } catch {
            callback(null);
          }
        },
        (error) => {
          console.warn('Firebase onAuthStateChanged error:', error);
          callback(null);
        }
      );
    } catch (err) {
      console.warn('Failed to listen to auth state:', err);
      callback(null);
      return () => {};
    }
  }
};
