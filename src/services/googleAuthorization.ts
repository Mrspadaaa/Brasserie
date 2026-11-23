import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface GoogleAuthorization { idToken?: string; accessToken: string | null; expiresAt: number; persistent: boolean }
type CodeResponse = { code?: string; state?: string; error?: string };
type GoogleIdentity = { accounts: { oauth2: { initCodeClient(config: {
  client_id: string; scope: string; ux_mode: 'popup'; state: string; login_hint?: string; select_account: boolean;
  callback: (response: CodeResponse) => void; error_callback: (error: { type: string }) => void;
}): { requestCode(): void } } } };
const api = () => (window as Window & { google?: GoogleIdentity }).google;
let preparation: Promise<void> | null = null, clientId = '';
const call = async <T>(data: Record<string, unknown>) => (await httpsCallable<Record<string, unknown>, T>(functions, 'driveAuthorization')(data)).data;

/** Prepared before the click so mobile browsers allow Google's popup. */
export function prepareGoogleAuthorization(): Promise<void> {
  if (preparation) return preparation;
  preparation = Promise.all([
    call<{ clientId: string }>({ action: 'config' }).then(value => { clientId = value.clientId; }),
    api()?.accounts?.oauth2 ? Promise.resolve() : new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
      const timer = setTimeout(() => { script.remove(); reject(new Error('Google met trop de temps à répondre. Réessaie.')); }, 20_000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('La connexion Google ne peut pas être chargée.')); };
      document.head.appendChild(script);
    })
  ]).then(() => undefined).catch(error => { preparation = null; throw error; });
  return preparation;
}

export function authorizeGoogleDrive(loginHint?: string): Promise<GoogleAuthorization> {
  const google = api();
  if (!clientId || !google?.accounts?.oauth2) return Promise.reject(new Error('La connexion Google se prépare. Réessaie dans un instant.'));
  return new Promise((resolve, reject) => {
    const state = crypto.randomUUID();
    const client = google.accounts.oauth2.initCodeClient({
      client_id: clientId, scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
      ux_mode: 'popup', login_hint: loginHint, select_account: !loginHint, state,
      callback: response => {
        if (response.error || !response.code) { reject(new Error('Autorisation annulée. Tu peux réessayer.')); return; }
        if (response.state !== state) { reject(new Error('La connexion Google n’a pas pu être vérifiée. Réessaie.')); return; }
        void call<GoogleAuthorization>({ action: 'exchange', code: response.code }).then(resolve, reject);
      },
      error_callback: error => reject(new Error(error.type === 'popup_closed' ? 'Connexion annulée.' : 'Autorise la fenêtre Google pour connecter ton compte.'))
    });
    client.requestCode();
  });
}
export const renewGoogleDriveToken = (rejectedToken?: string) => call<GoogleAuthorization>({ action: 'token', ...(rejectedToken ? { rejectedToken } : {}) });
