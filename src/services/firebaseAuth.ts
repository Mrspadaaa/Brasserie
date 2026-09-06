import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app, auth } from './firebase';

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
// Force le ré-affichage du sélecteur de compte : évite qu'un mauvais compte
// reste collé en session, et redonne un jeton Drive frais.
googleProvider.setCustomParameters({ prompt: 'consent select_account' });

/**
 * Jeton d'accès Google (Drive) issu de la connexion.
 *
 * Gardé EN MÉMOIRE uniquement, jamais dans localStorage : un jeton OAuth donne
 * accès au Drive de Gaëtan, il n'a rien à faire dans un stockage persistant que
 * n'importe quel script de la page peut relire. Il vit environ une heure ; à
 * l'expiration, `driveTokenExpired()` le signale et l'interface propose une
 * reconnexion.
 */
let driveAccessToken: string | null = null;
let driveTokenExpiresAt = 0;

function setDriveToken(token: string | null, lifetimeSeconds = 3600) {
  driveAccessToken = token;
  driveTokenExpiresAt = token ? Date.now() + lifetimeSeconds * 1000 : 0;
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
    if (!driveAccessToken) return null;
    if (Date.now() >= driveTokenExpiresAt) return null;
    return driveAccessToken;
  },

  /** Vrai si un jeton a existé mais a expiré : l'interface doit proposer de se reconnecter. */
  driveTokenExpired(): boolean {
    return driveAccessToken !== null && Date.now() >= driveTokenExpiresAt;
  },

  hasDriveAccess(): boolean {
    return this.getDriveAccessToken() !== null;
  },

  /**
   * Redemande un jeton Drive sans changer de compte. Utilisé quand un envoi
   * échoue parce que le jeton d'une heure a expiré.
   */
  async refreshDriveAccess(): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope(DRIVE_SCOPE);
      const currentEmail = auth.currentUser?.email;
      provider.setCustomParameters(
        currentEmail ? { login_hint: currentEmail } : { prompt: 'select_account' }
      );

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        return { success: false, error: "Google n'a pas renvoyé d'autorisation Drive." };
      }
      setDriveToken(credential.accessToken);
      return { success: true };
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Reconnexion annulée.' };
      }
      return { success: false, error: err?.message || 'Reconnexion à Google Drive impossible.' };
    }
  },

  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!isEmailAuthorized(user.email)) {
        await signOut(auth);
        setDriveToken(null);
        return {
          success: false,
          error: "Accès refusé. Ce compte n'est pas autorisé."
        };
      }

      // Le jeton Drive arrive avec la connexion : plus rien à coller à la main.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      setDriveToken(credential?.accessToken ?? null);

      return { success: true, user };
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Connexion annulée.' };
      }
      return {
        success: false,
        error: err.message || 'Erreur lors de la connexion avec Google.'
      };
    }
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
