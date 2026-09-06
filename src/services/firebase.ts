import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

/**
 * Initialisation Firebase unique et partagée par toute l'application.
 *
 * ⚠️ La configuration NE VIT PLUS dans ce fichier. Elle était écrite en clair,
 * clé comprise, et le dépôt est devenu PUBLIC : une clé web Firebase n'est
 * certes pas un secret d'authentification — c'est un identifiant de projet,
 * visible par conception dans tout front-end Firebase, et ce qui protège
 * réellement les données ce sont les règles Firestore, App Check et la
 * restriction par référent HTTP — mais la publier revient à publier l'adresse
 * exacte du projet, et il n'y a aucune raison de le faire.
 *
 * Elle se lit donc dans `.env` (jamais committé ; voir `.env.example` pour la
 * liste des variables). Vite remplace ces `import.meta.env.*` par leur valeur à
 * la compilation : le bundle déployé fonctionne exactement comme avant.
 */
const env = import.meta.env;

export const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

/*
 * ⚠️ Sans `.env`, l'application démarrait sur une configuration vide et
 * échouait plus loin, sur une erreur Firebase illisible. On le dit ici, une
 * fois, avec le geste qui répare.
 */
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    '[Firebase] Configuration absente. Copie `.env.example` en `.env` et ' +
      'remplis les variables VITE_FIREBASE_* avec les valeurs de la console Firebase.'
  );
}

/** Région des Cloud Functions — europe-ouest, au plus près de Fribourg. */
export const FUNCTIONS_REGION = 'europe-west6';

const USE_EMULATORS =
  import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Firestore avec cache persistant.
 *
 * `persistentLocalCache` stocke les données dans IndexedDB : l'application
 * fonctionne intégralement hors-ligne (indispensable dans la cave, où le réseau
 * ne passe pas), puis rejoue automatiquement les écritures au retour du réseau.
 * `persistentMultipleTabManager` permet d'avoir plusieurs onglets ouverts sans
 * conflit de verrou.
 *
 * `initializeFirestore` DOIT être appelé avant toute lecture ou écriture, d'où
 * cette initialisation au chargement du module.
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth: Auth = getAuth(app);
export const functions: Functions = getFunctions(app, FUNCTIONS_REGION);

/**
 * App Check — atteste que les requêtes proviennent bien de notre application et
 * pas d'un script tiers qui aurait recopié la configuration publique.
 *
 * La clé de site reCAPTCHA Enterprise se crée dans la console Google Cloud puis
 * s'injecte via `VITE_RECAPTCHA_SITE_KEY`. Tant qu'elle est absente, App Check
 * reste inactif : l'application continue de fonctionner (les règles Firestore
 * protègent déjà les données), on perd seulement cette couche supplémentaire.
 */
export function initAppCheck(): void {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (import.meta.env.DEV) {
    const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
    if (debugToken) {
      // Jeton de debug : autorise le poste de développement sans reCAPTCHA.
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }
  }

  if (!siteKey) {
    if (import.meta.env.DEV) {
      console.info(
        '[AppCheck] VITE_RECAPTCHA_SITE_KEY absente — App Check désactivé (normal en développement).'
      );
    }
    return;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn('[AppCheck] initialisation impossible', err);
  }
}

/** Branche les émulateurs locaux quand VITE_USE_FIREBASE_EMULATORS=true. */
export function connectEmulators(): void {
  if (!USE_EMULATORS) return;
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.info('[Firebase] Émulateurs locaux connectés (Firestore, Functions, Auth).');
  } catch (err) {
    console.warn('[Firebase] connexion aux émulateurs impossible', err);
  }
}

export const isUsingEmulators = () => USE_EMULATORS;
