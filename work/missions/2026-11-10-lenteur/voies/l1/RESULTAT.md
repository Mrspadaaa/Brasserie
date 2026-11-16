OK — lenteur mesurée en ligne (390, Slow 4G ×4 CPU) et au paquet ; causes classées ; deux cases en « n/d ».

# Voie l1 — mesure de la lenteur (10.11)

Version mesurée : `index-CrwXyzuo.js` (déploiement 17:41, tag `en-ligne/2026-11-10-fiches`), un seul bundle vu sur toute la campagne (18:01 à 18:25 puis 18:30 à 18:42, après le 17:41) ; analyse du paquet sur le tag `en-ligne/2026-11-10-mesures` (rien de structurel n'a changé entre les deux, dit le pilote). **0 écriture Firestore** (les `/Write/channel` étaient annulées et comptées : 0 sur toutes les passes). Tableau complet des médianes : `tests.txt` (même dossier). Scripts et sorties JSON : `mesure/`.

## Fichiers écrits
`RESULTAT.md`, `tests.txt`, `mesure/` : `mesure.mjs` (banc), `resume.mjs`, `analyse-paquet.mjs`, `cmp.mjs`, `q.mjs`, `cpu.mjs`, `paquet-mesures.json`, `paquet-03nov.json`, `sortie-*.json`, `log-*.log`. Rien dans `src/`. Worktrees `%TEMP%/l1-mesures` et `l1-03nov` retirés (la jonction `node_modules` était sans effet sur `deploy-bc70/node_modules` : 708 entrées avant et après), profil copié et outils supprimés.

## 1. En ligne : ce qui est mesuré (médiane de 3, contenu utile visible)
| Cas | Slow 4G + CPU ×4, froid | Slow 4G + CPU ×4, chaud | Sans throttling, froid | Sans throttling, chaud |
|---|---|---|---|---|
| Accueil (liste des brassins) | **9,84 s** · 100 req · 1 571 Ko (JS 76 fichiers, 1 480 Ko) | **4,49 s** · 3 Ko | 1,81 s · 1 572 Ko | 1,17 s |
| Atelier Houblons V5.5 | **3,55 s** · 482 Ko | **3,33 s** · 0 Ko | 0,77 s · 516 Ko | 0,80 s |
| Finances › Synthèse (1re visite) | 1,36 s · 202 Ko | 0,52 s | 0,36 s | 0,35 s |
| Finances › Prévisions | 0,78 s | 1,04 s | 0,21 s | 0,24 s |
| Dépense ouverte (rien saisi) | 0,65 s · 53 Ko | 0,53 s | 0,37 s | 0,36 s |
| Clients | 0,46 s · 13 Ko | 0,40 s | 0,34 s | 0,35 s |
| Stocks | n/d (3 échecs) | 0,70 s | 0,38 s | 0,41 s |
| Recettes | 0,14 s · 111 Ko | 0,33 s | 0,07 s | 0,07 s |
| Conduite d'un brassin | **n/d** (marqueur jamais vu, 4 régimes) | n/d | n/d | n/d |
| Finances › Opérations, Annuel ; Houblons (Stocks) ; Ventes (Vendre) ; retour Brassins | 0,03 à 0,16 s | 0,05 à 0,51 s | 0,03 à 0,14 s | 0,03 à 0,14 s |

Lecture : l'accueil froid, premier contact ou premier contact après un déploiement, est la grosse attente (9,8 s ; coque « L'Affinée » à 7,1 s, contenu à 9,8 s). Une fois en cache, il reste 4,5 s : séparé en deux passes (3 mesures chacune, `mesure/sortie-sep-*.json`), le chaud vaut **4,0 s avec CPU ×4 seul, 1,8 s avec réseau Slow 4G seul, 1,17 s sans rien** : le chaud est lié au processeur, pas au réseau. Idem pour V5.5 : 3,2 s en CPU ×4 seul, 0,8 s au réseau seul : c'est du calcul (0,8 s sur PC, ×4 au téléphone), pas du téléchargement (0 Ko en chaud). Les vues déjà ouvertes dans la session coûtent 0,03 à 0,5 s : pas de lenteur de navigation une fois le chunk évalué.

Limites (honnêtes) :
- **Conduite d'un brassin : non mesurée.** Le marqueur « Ensemencement » n'est jamais devenu visible dans le texte de la page (il est dans un `[role=dialog]` que `innerText` ne voit pas) ; je n'ai pas eu d'autre marqueur sûr. À refaire avec un marqueur propre à `BrewDayPage` (voie suivante). Ce n'est pas un constat sur l'app.
- **Stocks, froid Slow 4G** : 3 échecs ; l'onglet restauré (Houblons) cachait « Articles » le temps de mon toucher : défaut de mon banc très probablement, pas de l'app (en chaud, même banc : 0,70 s). « n/d », pas de conclusion.
- Plancher du banc ≈ 0,03 s (toucher + interrogation à 40 ms) : lire les valeurs sous 0,1 s comme « instantané ».
- « Accueil » = la liste des brassins (dernière vue restaurée : chaque passe finit dessus). La vue « Brassins » seule n'est pas mesurée (déjà là).
- « Octets » = transfert réseau CDP (0 pour le cache disque). Ce profil est celui du jeu de test (données de test + 4 lots).

## 2. Paquet (build Vite 6 + `rollup-plugin-visualizer` 7.1.3, tailles réelles gzip du fichier ; mesure `mesure/paquet-*.json`)
- Tag `mesures` : 232 JS, **20,27 Mo brut / 4,74 Mo gzip**. Commit 065a3102 (03.11, aucun tag `en-ligne/` n'existe avant le 09.11) : 209 JS, 19,38 Mo / 4,43 Mo. **+4,6 % brut, +6,9 % gzip en une semaine** : le paquet n'a pas explosé. Ce qui a changé de place : `recipeStepContext` (+505 Ko) remplace `readings` (−506 Ko) ; `BatchDetailSheet` (+428 Ko, recharts) remplace `CartesianChart` (−359 Ko) ; vraiment nouveaux : `FinancesTab` +142 Ko, `ExpenseSheet` +126 Ko, `BrewWizardEntry` +126 Ko, `App` +77 Ko, `EntityList` +60 Ko, `PrixEcran`, `qr.worker`, `Caisse`, `EtapeLevure`, `pieceDeDepense` (25 à 39 Ko chacun).
- `index-*.js` : 199 Ko / 63 Ko gz, seul fichier statique ; `index.html` n'a aucun `modulepreload`. `main.tsx` : `Promise.all([import('./App'), import('./services/firebase')])`.
- **`App` : 3,25 Mo / 842 Ko gz.** **2,18 Mo brut / 466 Ko gz de JSON importés en statique (67 % du brut, 55 % du gz)** : `yeastCatalogueLibrary.json` 1,43 Mo / 393 Ko gz (lu en synchrone par ~20 modules via `yeastReferences.ts`), `brewingStylesBootstrap.json` 241 Ko, `yeastRecipeReferences.json` 149 Ko, `fermentationScienceBootstrap.json` 135 Ko, `fermentationGuideBootstrap.json` 61 Ko, trois `yeastEnrichment*.json` ~55 Ko. Le commentaire de `enrichissementLevures.ts` annonce déjà « 1,4 Mo, importé seulement par f4 » : le catalogue n'est lazy que pour ce module.
- `Host` (V5.5) 1,79 Mo / 447 Ko gz : `services/hopV55` 1,55 Mo, `ui/hopV55` 0,74 Mo, `domain/hopDecision` 0,29 Mo. Bootstraps houblons : `hopBeerMaverickBootstrap` 1,44 Mo (45 Ko gz, un JSON), `hopDatabaseBootstrap` 0,89 Mo (29 Ko gz), `data` 0,56 Mo (78 Ko gz), `complements` 438 Ko. `calcul.worker` 1,28 Mo / 265 Ko gz. `firebase` 637 Ko / 152 Ko gz (hash identique au 03.11 : stable d'un déploiement à l'autre).
- **Chargé à l'accueil sans y servir** (liste des URL de l'accueil froid, `sortie-slow-froid.json`, en transfert brotli) : `BatchDetailSheet` (recharts) 106 Ko, `BrewerChat` 78 Ko, `data` 56 Ko, `complements` 56 Ko, `profil-simule` 50 Ko, `NoloFermentationWorkshop` 34 Ko, `composes-houblon` 18 Ko, `HopTechnicalPanel` 14 Ko = **≈ 412 Ko** (en plus de `App` 629 Ko, `firebase` 124 Ko, `index` 53 Ko). Ce sont des préchargements de dépendances dynamiques (helper `__vite__mapDeps`) ajoutés à `ProductionTab` : ils partent avec l'accueil.
- Cache HTTP (`firebase.json`) : JS/CSS/polices/images `public, max-age=31536000, immutable` ; `index.html` et `/` sans cache. Correct. Aucun service worker.

## 3. Causes classées (gain estimé au téléphone Slow 4G + CPU ×4 ; aucune correction faite)
Chiffres « mesuré » = tableau ci-dessus ; « estimé » = octets / 200 Ko/s (débit simulé), sans nouvelle mesure.

1. **Octets de l'accueil froid (premier contact et après chaque déploiement) : mesuré 9,8 s, 1,57 Mo.**
   - 1a. 8 chunks préchargés à l'accueil qui n'y servent pas, 412 Ko → **gain estimé ≈ 2,1 s**. Méthode : `build.modulePreload.resolveDependencies` pour ne pas précharger les dépendances de `ProductionTab` qui ne s'affichent pas (ou `import()` au geste) ; vérifier avant/après sur la liste des URL de l'accueil. Risque faible.
   - 1b. JSON de levures et de références dans `App` : ≈ 55 % du gzip de `App` ≈ 345 Ko transférés (estimation proportionnelle sur 629 Ko transférés) → **gain estimé ≈ 1,7 s** à chaque premier contact ; et **à chaque déploiement** s'ils sont isolés dans un chunk à contenu stable (comme `firebase`, dont l'empreinte n'a pas bougé) : ils ne se retéléchargent plus. Méthode : `import()` dynamique du catalogue à la première vue levure, ou à défaut `manualChunks` ; le parse n'est pas en cause (`JSON.parse` de 1,4 Mo : 4 ms ×1, 18 ms ×4, mesuré). Risque moyen : ~20 modules lisent `yeastReferences` en synchrone, il faut une porte asynchrone (cf. `enrichissementLevures.ts`).
2. **Calcul au téléphone une fois en cache : accueil chaud 4,5 s (4,0 s en CPU ×4 seul contre 1,17 s sans throttling, mesuré) → ≈ 2,8 s de CPU.** Cause non attribuée : l'évaluation de l'`App` en cache ne coûte que 265 ms ×1 / 303 ms ×4 (`import()` d'une copie neuve, médiane de 3, mesuré) ; le reste est rendu React, initialisation Firebase/Auth, abonnements Firestore. **Il faut un profil Chrome Performance (trace) avant toute correction** : méthode standard (Performance panel / `Tracing`, tâches longues > 50 ms), voie suivante. Gain à attendre : jusqu'à ~2 s, risque inconnu tant que non attribué.
3. **Atelier Houblons V5.5 : 3,3 s, même en chaud, 0 Ko (mesuré) ; 3,2 s en CPU ×4 seul, 0,8 s sans throttling** : c'est l'évaluation du `Host` (1,79 Mo) et de ses données, pas le réseau. Méthode : trace (comme n° 2), puis fractionner `Host`/`hopV55` par onglet (`React.lazy` interne), `Suspense` avec un état de chargement ; gain estimé ≈ 1,5 à 2,5 s ; risque moyen (cœur de l'outil houblons, ses écrans choisis ne bougent pas).
4. **Première ouverture des vues après un déploiement** : Finances 202 Ko (1,36 s froid contre 0,52 s chaud), Dépense 53 Ko (0,65 s), V5.5 482 Ko (3,55 s), Clients 13 Ko ; chaque déploiement (six le 10.11) invalide le chunk `App` et les chunks qui changent. Méthode : préchargement à l'inactivité (`requestIdleCallback`) des vues probables après l'affichage de l'accueil, et service worker de précache (`vite-plugin-pwa`/Workbox) qui met à jour en arrière-plan ; gain ≈ 0,5 à 1,5 s par première ouverture (estimé) ; risque moyen pour le service worker (mise à jour, mode hors ligne déjà géré par Dexie), faible pour le préchargement.
5. **Cascade HTML → index → App ∥ firebase sans `modulepreload`** : coque à 7,1 s, contenu à 9,8 s en froid Slow 4G ; l'ordre est imposé par `main.tsx`. Méthode : `<link rel="modulepreload">` de `App` et `firebase` dans `index.html` ; gain estimé ≈ 1 RTT (150 ms) à 0,3 s ; risque faible. Peu de gain, mais quasi gratuit.
6. **Hors cause principale** : la croissance du paquet depuis le 03.11 (+6,9 % gzip) ne l'explique pas ; la navigation entre vues déjà ouvertes est instantanée.

Plan chiffré proposé pour la voie suivante, dans l'ordre : trace Performance de l'accueil et de V5.5 (attribuer le CPU) ; corriger 1a (un jour, risque faible), puis 1b ; mesurer avant/après avec `mesure.mjs` (même banc, mêmes cases, médiane de 3, un bundle).

## Critères
- « Tests » : pas de vitest ; `tests.txt` contient le tableau des mesures. Chaque chiffre est mesuré, ou « estimé » avec sa source.
- Lecture seule respectée en ligne : 0 écriture bloquée sur toutes les passes. **Réserve** : le profil copié contenait `brew-outbox-…-LOT-016` et `…-LOT-017-conflict-backup` (la consigne demandait un profil sans `brew-outbox-*`). Je l'ai vu après un premier chargement (`explore.mjs`, supprimé) ; aucune écriture n'a été vue partir, mais je ne peux pas l'exclure pour ce chargement-là ; ensuite chaque passe annulait et comptait les `/Write/channel`. Profil copié supprimé.
- Incident de poste : un `New-Item` mal cité a créé `%LOCALAPPDATA%\Temp$d` (jonction vers `deploy-bc70/node_modules`) : retiré proprement (jonction supprimée, cible intacte) ; un `Stop-Process` trop large a tué des `bash.exe` de ce poste.

## Essais, doutes
Boucle de banc réécrite 6 fois (marqueurs, restauration de la vue, `waitForNetworkIdle` bloqué par les flux Firestore → `concurrency: 2`). Pas de trace Chrome : le CPU n'est pas attribué (cause n° 2 et 3).

DÉCISION À PRENDRE : aucune ; je recommande au pilote de lancer d'abord une voie « trace Performance + correction 1a » (faible risque, ≈ 2 s au premier contact), puis 1b.

CONNAISSANCE : en chaud, l'accueil et l'atelier V5.5 sont liés au processeur (accueil 1,17 s PC → 4,0 s avec CPU ×4 seul ; V5.5 0,8 s → 3,2 s), pas au réseau ; en froid 80 % de l'attente est du téléchargement (1,57 Mo) ; `JSON.parse` de 1,4 Mo coûte 4 ms (×4 : 18 ms) : les JSON pèsent par leurs octets, pas leur parse. L'App chunk change à chaque déploiement, `firebase` non.

LEÇON PROPOSÉE : (1) un chemin Windows passé à PowerShell depuis Bash avec `$d` entre guillemets crée un autre dossier sans erreur : passer par des chemins littéraux ou un `.mjs`. (2) `page.waitForNetworkIdle` ne revient pas quand Firestore garde un flux ouvert : régler `concurrency` et `timeout`. (3) `document.body.innerText` ne voit pas un `[role=dialog]` masqué : choisir un marqueur visible.
