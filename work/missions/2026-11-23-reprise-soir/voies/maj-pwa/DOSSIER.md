# Dossier maj-pwa

## Constat
- Tests en ligne des tours 28, 29, 30 (23.11) : les deux critiques ont trouvé l'onglet servant l'ANCIEN paquet (tour 26, puis 28) longtemps après la mise en ligne ; ils ont dû forcer la mise à jour. État des tâches : « Mise à jour de l'app : prend ~60 s au 1er chargement (service worker) ; à raccourcir. »
- Le brasseur teste sur son téléphone juste après chaque mise en ligne (« déployer souvent ») : il doit voir la nouvelle version vite, sans jamais perdre une saisie en cours.

## Code actuel
```
      if (!importer || !/[\\/]functions[\\/]src[\\/]brewerHopAdviceContextBinding\.ts(?:\?|$)/.test(importer)) return null;
      if (source !== './brewerTools.js' && !/[\\/]src[\\/]domain[\\/]brewerTools\.ts$/.test(source)) return null;
      return fileURLToPath(new URL('./src/domain/recipeSnapshot.ts', import.meta.url));
    }
  }, ...VitePWA({
    // CHN-7 (21.11, D413) : hors ligne par Workbox (`generateSW`), pas de worker écrit à la main (L29). Un seul `/sw.js`, qui importe
    // `brew-alerts-sw.js` (une portée ne tient qu'un worker). Enregistré par `src/services/precacheHorsLigne.ts`, après le premier affichage.
    // T10-M2-1 (D429) : `prompt` garde l'ancienne version active tant que la page n'a pas dit SKIP_WAITING (`updateSW(true)`, src/services/miseAJour.ts) ;
    // jamais d'activation de force pendant une saisie. `clientsClaim` : la nouvelle version prend la main sur la page ouverte dès qu'elle s'active.
    registerType: 'prompt',
    injectRegister: false,
    manifest: false,
    workbox: {
      clientsClaim: true,
      importScripts: ['brew-alerts-sw.js'],
      globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
      globIgnores: ['brew-alerts-sw.js'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // le plus gros morceau (App) fait 2,5 Mo
      cleanupOutdatedCaches: true,
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/__\//], // gestionnaire d'authentification Firebase, réservé par l'hébergement
      // pdf.worker (.mjs) et .wasm : pas dans le précache (hors CHN-7), gardés à l'usage. Aucun cache pour Firestore, Auth, fonctions.
      runtimeCaching: [{
        urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) => sameOrigin && /\.(?:wasm|mjs)$/.test(url.pathname),
        handler: 'CacheFirst',
        options: { cacheName: 'affinee-lourds', expiration: { maxEntries: 20 } }
      }]
    },
    devOptions: { enabled: false }
  }), {
    name: 'exclude-private-initial-data',
```
### src/services/enregistrerPwa.ts (7 lignes)
5:export function enregistrerPwa(): void {
### src/services/miseAJour.ts (212 lignes)
3: * (« Prompt for new content refreshing »), `registration.update()` pour chercher une version, `updateSW(true)` pour la prendre
6: *  - on cherche une nouvelle version au lancement, à chaque retour sur l'app (visibilitychange, pageshow, retour du réseau)
16:export const CALME_MS = 1500;         // libre depuis ce délai avant d'appliquer : une écriture qui part n'est pas coupée
17:export const SONDE_MS = 500;          // pendant qu'une version attend
18:export const VERIFICATION_MS = 30 * 60_000;
19:export const INTERVALLE_MIN_MS = 15_000; // deux vérifications ne se suivent pas de plus près
20:export const GARDE_BOUCLE_MS = 15_000;   // un rechargement automatique ne suit pas un autre de moins de 15 s
22:export interface EntreeMiseAJour {
32:export interface MiseAJour {
43:export function creerMiseAJour(e: EntreeMiseAJour): MiseAJour {
47:  let sonde: ReturnType<typeof setInterval> | null = null;
66:    if (!appliquee && sonde === null) sonde = setInterval(pas, SONDE_MS);
86:    document.addEventListener('visibilitychange', surVisibilite);
89:    const minuterie = setInterval(verifier, VERIFICATION_MS);
91:      document.removeEventListener('visibilitychange', surVisibilite);

## État de l'art (à confirmer)
- Workbox / vite-plugin-pwa : registerType prompt + updateSW(true) quand l'app est au repos ; registration.update() au retour au premier plan (visibilitychange) et à intervalle ; index.html servi sans cache (Cache-Control no-cache dans firebase.json) ; navigateFallback.
