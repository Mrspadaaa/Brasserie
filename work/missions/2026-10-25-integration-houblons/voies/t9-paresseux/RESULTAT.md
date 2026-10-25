OK — Outils v4 en chunk à la demande, préchargé au repos en ligne ; démarrage +21 octets gzip ; ouvre hors ligne

## Fichiers écrits
- `src/ui/hopIndex/outils.ts` : point d'entrée paresseux, seul à importer statiquement le moteur v4 (`export * as moteur`), ses données et le client.
- `src/ui/hopIndex/chargement.ts` : `chargerOutils()` (import dynamique mémorisé, échec non gardé), `outilsCharges()`.
- `src/ui/hopIndex/precharge.ts` : `programmerPrechargement` (pur, testable) et `prechargerOutilsAuRepos` (requestIdleCallback ; en ligne ; ni saveData ; page chargée).
- `src/ui/hopIndex/HopToolLayer.tsx` : charge les outils à l'ouverture (`useOutils`), prête au premier rendu si préchargés, message et « Réessayer » si le réseau manque.
- `src/App.tsx` : un effet de préchargement et une fabrique `lazy` qui rend la couche d'un coup quand elle est préchargée.
- `scripts/check-hop-budget.mjs` : option `--chunk-outils <préfixe> [--deja a,b]` (B5).
- `tests/unit/hopIndexV4/chargementOutils.test.tsx` : 20 tests. `vite.config.ts` non touché (le découpage automatique suffit).

## Conception
- Drapeau lu en clair dans App (`import.meta.env.VITE_HOP_V4 !== 'on'`) : éteint, Vite retire tout le bloc. Constaté : aucun chunk `precharge` dans le build par défaut, aucune requête. Allumé : un petit chunk `precharge` (1,5 ko) est demandé après le montage ; il attend la fin du chargement de page, un instant de repos, le réseau, puis charge couche et outils.
- Trouvaille : même préchargée, la couche mettait 311 ms à s'ouvrir (le repli de Suspense que React garde 300 ms). `lazy` reçoit donc, une fois la couche préchargée, un thenable synchrone : première ouverture 311 → 16 ms.

## Mesures
Build de production, 3 fichiers de démarrage (`index, App, firebase`), gzip niveau 9 comme `check-hop-budget`.
- Démarrage B1 : avant (HEAD) 919 059 octets ; après 919 080 octets, soit +21 octets, affiché 919 ko (budget de la voie ≤ 919 ; budget B1 d'origine 350 ko, déjà dépassé avant la voie).
- Un premier essai avec un import statique du préchargement donnait 920 ko (échec) : d'où le drapeau en clair et l'import dynamique.
- Chunk des outils (fermeture hors démarrage) : 150,3 ko gzip = `profil-simule` 116,3 (données `proto-data.json` 45 ko gzip + bootstraps V5.5 connaissances, levures, essais, solveur, moteur de couche) + `outils` 18,5 (le moteur et le client) + `hopExtrapolationBootstrap` 8,2 (partagé avec l'atelier V5.5) + `styleSelection` 6,5 (partagé avec le wizard et le jour de brassage) + `solver` 0,8. La vérification (chunk qui contient le moteur, gzip niveau 6) : 117 ko ≤ 150. Avec `--deja` on retire ce que l'écran dessous a déjà chargé.
- Ouverture d'une couche, build de production servi en local, 390 × 844 :
  - préchargée, CPU ×1 : 9 ms ; première ouverture CPU ×4 : 36 ms ; ouvertures suivantes ×4 : 39 à 59 ms (budget #162 : 100 ms ; mesuré ~400 ms sur le serveur de dev).
  - à froid (drapeau éteint, rien préchargé), CPU ×1 : 350 ms ; ×4 : 614 ms (300 ms de repli Suspense, chargement du chunk, évaluation de ~660 ko de données).
- Chronologie, drapeau allumé, CPU ×4 : premier rendu (FCP) 248 ms ; `precharge` demandé à 384 ms ; couche et outils à 542 ms ; rien avant.

## Hors ligne
Build de production (minifié, même découpage) servi en local ; `import.meta.env.DEV` forcé à `true` dans un build de test (config dans le dossier temporaire, sortie hors `dist/`) pour avoir `?dev-local` et `window.__hopPile`. Drapeau allumé : lancement en ligne, attente du préchargement, réseau coupé (`setOfflineMode(true)` ; un `fetch` échoue, vérifié), ouverture des couches `hopBeer` puis 5 × `hopCompare`.
- Premier écran en ligne : `work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/captures/on-1-premier-ecran.png`
- Réseau coupé, couche « Ma bière » ouverte, moteur chargé : `work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/captures/on-2-couche-hors-ligne.png`
- Réseau coupé, « Comparer » ouvert à CPU ×4 : `work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/captures/on-3-comparer-x4-hors-ligne.png`
- Témoin, drapeau éteint (rien préchargé), même geste réseau coupé : la couche ne s'ouvre pas, « Écran indisponible » (comportement existant de `LazySurface`) : `work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/captures/off-2-couche-hors-ligne.png`

Toutes les captures ont été ouvertes en image (L12). Drapeau éteint : aucune requête `precharge`, `outils`, `profil-simule` après 6 s de repos.
Limite écrite : un tout premier lancement hors ligne n'est pas couvert (pas de service worker, décision de l'utilisateur). Un rechargement hors ligne dépend du cache HTTP du navigateur, non garanti.

## Critères
- G1 : `node work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/verifier.mjs` → « démarrage : 919 ko gzip ; chunk des outils : 117.2 ko gzip (profil-simule) ; PARESSEUX OK ». Tests de la voie : 20/20 ; avec AppRoutePile et AppQuickActionReturn : 46/46 ; `tsc --noEmit` vert.

## Essais utilisés
Démarrage 920 ko (essai 1, import statique) → corrigé au 2e ; couche à 311 ms → corrigé au 2e. Test de structure : regex `export … from` oubliée → corrigée.

## Doutes et limites
- Le chunk des outils pèse 150,3 ko gzip niveau 9 (fermeture complète hors démarrage), 0,3 ko au-dessus du budget lu strictement, mais 143,8 ko si le wizard est dessous (`styleSelection` déjà chargé), cas normal. Ce qui pèse : `proto-data.json` (varieties 403 ko bruts, 45 ko gzip) et les bootstraps V5.5. Je n'ai rien tordu.
- DÉCISION À PRENDRE : le wizard (`src/pages/BrewWizard.tsx`, T6a) importe statiquement `src/domain/hopIndex/v4/recipeConversion.ts`, qui importe `./index` (tout le moteur) et `proto-data.json`. Le chunk du wizard tire donc `profil-simule` (116 ko gzip) et `outils` n'est plus la seule porte : à l'ouverture du wizard, même drapeau éteint, ces 116 ko se chargent. Ce n'est pas le démarrage (la vérification passe) mais c'est le contraire de l'esprit de #167 et cela change le poids du wizard sans que l'utilisateur voie rien de neuf. Options : (a) `applyHopV4Change` charge `recipeConversion` par `import()` à l'écriture (recommandé : l'outil est de toute façon ouvert, donc préchargé) ; (b) laisser. Hors de mon périmètre (BrewWizard.tsx, recipeConversion.ts) : au pilote.
- Le test Chrome est sur un build de test à `DEV` forcé : le vrai build n'a ni `?dev-local` ni `__hopPile`. Seules les branches `DEV` diffèrent ; le découpage (outils, profil-simule, hopExtrapolationBootstrap, styleSelection, solver) est le même.
- `Object.keys(outils.moteur).length` (« 157 fonctions et tables ») sert de signe de vie du moteur dans la couche provisoire ; T12 le remplacera.
- Aucun appel Gemini, aucune donnée réelle, `functions/` intact. Le dossier `captures/` est dans le périmètre de la voie.

CONNAISSANCE : `React.lazy` garde 300 ms le repli de Suspense, même quand le module est déjà en mémoire (première ouverture 311 ms) ; une fabrique qui rend un thenable synchrone pour un module préchargé supprime l'attente (311 → 16 ms). Utile à tout écran porté (T12).
LEÇON PROPOSÉE : aucune
