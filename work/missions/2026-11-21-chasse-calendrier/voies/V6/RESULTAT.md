OK — vite-plugin-pwa commité (9c813d577) : 2e visite 365 → 252 ms (4G), Houblons 451 → 62 ms, hors ligne 0/5 → 5/5 ; boucle locale +17 ms.

## Chiffres (build servi en local par Node ; en-têtes de firebase.json copiés : index.html no-store, le reste immutable ; texte en gzip ; Chrome headless 390×844 tactile ; fixture « ZZ TEST »)
Deux profils : « local » = boucle locale sans latence ; « 4g » = 500 Ko/s PARTAGÉS entre toutes les requêtes (le worker compris) + 80 ms de latence. Hors ligne = serveur arrêté. Médianes ; entre crochets, les essais.

1. Ouverture d'un écran chargé à la demande (toucher → écran sans repli « Chargement de l’écran »)
- Onglets (Calendrier, Brassins, Finances, Stocks, Clients) : plancher d'environ 330 ms (repli de Suspense gardé 300 ms par React, déjà dit dans App.tsx l. 117) ; avant = après au bruit près, en local comme en 4G.
  - local, 3 essais : 1er passage 338/337/329/362/332 → 344/325/341/358/331 ms ; 2e passage 354/354/344/413/338 → 358/356/341/409/339 ms.
  - 4G, 2 essais : 1er passage Calendrier 453 → 460, Brassins 1217 → 1237, Finances 1266 → 1296 ms (réseau, inchangé) ; 2e passage Calendrier 405 → 369 (−36), Brassins 364 → 351, Finances 344 → 350 ms.
  - 4G, ouverture pendant le précache (+7 s) : Calendrier 446 → 521 [425,446] → [521,439] ; Finances 1267 → 1216 ; pas de perte nette (un essai à 521 contre 446 : bruit possible, 2 essais seulement).
- Sous-écran lourd jamais préchargé au repos (Stocks › Houblons, HopIndexWorkspace), 4G, 3 essais :
  - 1er passage 754 [465,754,760] → 763 [762,765,763] ms (même chose) ; pendant le précache 451 → 460 ;
  - **2e passage 451 [451,451,457] → 62 [62,63,58] ms (−86 %).**

2. Premier affichage (FCP / barre d'onglets prête)
- Visite 1 (première de toutes) : inchangée (4G : FCP 388/404 → 392/392, prête 2351/2336 → 2356/2357 ms) ; le worker s'enregistre 4 s après le chargement, au repos.
- Visite 2, 4G (2 essais) : FCP 158 → 82 ms, prête 365 → 252 ms (−113 ms ; index.html n'est plus demandé : 1 036 octets → 0).
- **Visite 2, boucle locale (16 essais par version) : FCP 64 → 68 ms, prête 234 → 251 ms (+17 ms ; avant 215–248, après 207–279).** C'est la perte : le démarrage du worker et la lecture du cache coûtent plus qu'un aller-retour à 0 ms. Aucun réseau réel n'a 0 ms (4G : gain net).
- Transfert à la première visite (gzip) : 2,36 Mo → 6,16 Mo (419 fichiers précachés, 26 Mo non compressés).

3. Hors ligne (visite complète, puis serveur arrêté)
- Rechargement hors ligne : avant, 0/5 onglets (page absente, ERR_CONNECTION_REFUSED) → après, 5/5 (Calendrier, Brassins, Finances, Stocks, Clients, 328–392 ms).
- Sans recharger : avant 5/5 (les morceaux avaient été préchargés au repos) → après 5/5.
- CH-N7 : rouge sur `en-ligne/2026-11-21-tour8` (« aucun service worker d’application ne contrôle la page »), vert sur l'arbre (« Hefe » s'ouvre hors ligne, le rechargement rend l'app, /sw.js, 419 entrées). Capture `CH-N7-1-hors-ligne-brassin.png` (fiche B-HEFE) ouverte.

## Décision du pilote : condition remplie, commit fait
Le pilote tranche : au téléphone le réseau domine (4G −113 ms, Houblons 451 → 62 ms, 5/5 onglets hors ligne) ; les +17 ms de la boucle locale ne se verront pas. Commit `9c813d577` (branche claude/port-carnet-1711), index temporaire, chaines.mjs : 2 hunks de la voie sur 4 ; package.json et lock entiers. BUGS.md CHN-7 « corrigé » (à rejouer en ligne), `controle-bugs` : BUGS OK.

## Fichiers écrits (port-carnet, non commités)
- `package.json`, `package-lock.json` : devDependencies `vite-plugin-pwa ^2.0.0`, `workbox-build ^7.4.1`, `workbox-window ^7.4.1` (verrou : +230 paquets, 13 montées de patch transitives : @babel/*, browserslist, caniuse-lite, electron-to-chromium, node-releases, baseline-browser-mapping).
- `vite.config.ts` : `VitePWA` (generateSW ; `registerType: 'prompt'` : ni skipWaiting ni clientsClaim ; `injectRegister: false` ; `importScripts: ['brew-alerts-sw.js']` ; précache js/css/html/woff2/svg/png ≤ 3 Mo, `.mjs` et `.wasm` hors précache et en CacheFirst à l'usage ; `cleanupOutdatedCaches` ; `navigateFallback /index.html` sauf `/__/` ; aucun cache Firestore/Auth/fonctions).
- `src/services/precacheHorsLigne.ts` (neuf) : `urlServiceWorker`, `estServiceWorkerApp`, `precacherHorsLigne` (enregistre `/sw.js` 4 s après le chargement puis au repos ; ni économie de données, ni 2G, ni hors ligne). `src/main.tsx` : un appel. `src/services/brewAlarms.ts` : enregistre `urlServiceWorker()` (`/sw.js` en production, `/brew-alerts-sw.js` en dev). `src/services/brewNotifications.ts` : reconnaît les deux.
- `public/brew-alerts-sw.js` : une seule ligne retirée, `skipWaiting` à l'installation (sinon la nouvelle version prend la main en pleine saisie et purge les morceaux de la page ouverte). Push, clic, `clients.claim` intacts ; `brewerPush.test.ts` et `brewNotifications.test.ts` : 47 verts.
- `scripts/parcours/chaines-hors-ligne.mjs` (neuf, étape CH-N7) et 2 lignes dans `scripts/parcours/chaines.mjs`.
- Voie : `voies/V6/mesure-precache.mjs` (le banc de mesure ci-dessus).
- Non touchés : `firebase.json`, hébergement, rien déployé.

## Contrôles
- tsc : une erreur, hors voie : `src/ui/calendrier/entete/BandeSemaines.tsx(94,34)` TS2345 (fichier d'une autre voie, présent sans mes fichiers). Aucune erreur dans les miens.
- Build `VITE_HOP_V4=on VITE_CARNET_IA=production vite build --config vite.config.ts` : sw.js + workbox-*.js écrits ; `check-build-flags` DRAPEAUX OK. Piège : `vite build` sans `--config` lit le `vite.config.js` périmé et non suivi (sorti par tsc) et n'écrit pas sw.js ; `npm run build` passe d'abord par `tsc`, qui le régénère.
- Mise à jour : worker jamais `skipWaiting` (une seule occurrence, le message `SKIP_WAITING`, jamais envoyé) : une nouvelle version s'installe en arrière-plan et prend la main quand tous les onglets sont fermés.

## Doutes et limites
- Le banc ne prouve pas l'hébergement (`sw.js` tombe sous la règle `**/*.js` immutable de firebase.json : Chrome relit le script principal du worker hors cache HTTP, sans changement nécessaire ; recommandé : `/sw.js` en `no-cache`, accord à demander). À rejouer en ligne.
- Planchers de Suspense : l'ouverture des onglets ne peut pas descendre sous ~330 ms, avec ou sans worker ; le gain d'ouverture ne se voit que sur les écrans lourds jamais visités (Houblons).
- Gain attendu non mesuré : après une mise en ligne, le worker précharge les morceaux changés avant que le brasseur ouvre l'écran.
- Budget : 6,2 Mo (gzip) supplémentaires à la première visite, 26 Mo une fois décompressés en cache.
- Un essai en 4G pendant le précache (Calendrier 521 contre 446) : non reproduit sur 2 essais ; non conclu.

CONNAISSANCE : la fluidité des onglets est plafonnée à ~330 ms par le repli de Suspense (300 ms) : un cache ne l'abaisse pas ; le gain mesurable d'un service worker est hors ligne, à la 2e visite sur réseau à latence et sur les écrans lourds jamais ouverts.
LEÇON PROPOSÉE : `vite build` sans `--config` lit un `vite.config.js` périmé s'il existe à côté de `vite.config.ts` : une nouvelle entrée de configuration (plugin) est silencieusement absente du build ; toujours `--config vite.config.ts` pour une mesure.
