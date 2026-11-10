# Lenteur des vues (10.11)

Ses mots : « Tout les nouvelles vue on mis du temps à chargé, il semblerait qu'il y aille un peu de lenteur dans l'app ».
Indice (non mesuré) : `App-*.js` pèse 3,25 Mo non compressé, `Host` 1,79 Mo, `hopBeerMaverickBootstrap` 1,44 Mo, `calcul.worker` 1,28 Mo ;
232 fichiers JS ; aucun `modulepreload` ; six déploiements le 10.11 (chaque déploiement change les empreintes : tout se retélécharge).

## État de l'art (L29)
Problème type : performance de chargement d'une SPA (Core Web Vitals : LCP, INP ; temps de navigation entre vues). Méthodes standard :
mesure d'abord (Lighthouse / Chrome DevTools Performance, throttling « Slow 4G » + CPU ×4, cache froid et chaud) ; analyse du paquet
(`rollup-plugin-visualizer` ou `source-map-explorer`) ; découpage par route (`React.lazy` + `Suspense`, `import()` dynamique),
`build.rollupOptions.output.manualChunks` pour isoler les dépendances lourdes, préchargement des vues probables (`modulepreload`,
préchargement au survol / à l'inactivité), cache long immuable des fichiers à empreinte + service worker de précache (Workbox /
`vite-plugin-pwa`) pour que la vue suivante ne repasse pas par le réseau. Décision : mesurer (voie l1), puis corriger la plus grosse cause
mesurée, avant / après chiffré, dans une voie suivante.

| Voie | Agent | Modèle | Livrable |
|---|---|---|---|
| l1 | auteur | sonnet | mesure en ligne et analyse du paquet, causes classées, plan chiffré |

## Signature (10.11, pilote)
En ligne : tag en-ligne/2026-11-10-rapide (index-KIK8T_uv.js). Accueil à froid −29 % (6,07 → 4,32 s, banc l2), Finances sous le tag, vues
préchargées à l'inactivité ~0,4 s. Reste connu : l'atelier V5.5 touché dans les premières secondes d'un démarrage à froid +1,9 s (au niveau
du tag après repos) ; choix du pilote : déployer, le gain à chaque ouverture l'emporte. Pas de service worker (décision à part).
