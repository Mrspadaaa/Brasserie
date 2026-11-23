# Voies de correction — chasse Calendrier (21.11)

Lecture et analyse seulement. Source : `work/missions/BUGS.md` (CHG, CHV, CHE, CHD, CHN) et `CHASSE-*.md`. Code : worktree `port-carnet` (HEAD `bf1f6bc6b`).
Chemins `src/…` et `scripts/…` : relatifs à `port-carnet`. Version de référence des contrôles : tag `en-ligne/2026-11-21-tour8`.

## Périmètre

- Retenus : 40 défauts. Écartés : « en cours » (CHG-4, 5, 6 ; CHV-1, 2, 3, 11) et doublons reliés (CHG-1, 2 ; CHV-6 ; CHD-6 ; CHN-2, 4).
- Hors voie, **attend choix fiche** : CHE-2 (Supprimer / Retirer dans la fiche et Modifier) et CHE-5 (Modifier d'un brassin). Fichier : `frise/DetailChose.tsx`. Pas de maquette de fiche choisie, donc rien ne s'y pose (règle n° 1).
- Fichiers déjà pris par d'autres voies : gestes au jour et bord (`calendrierGestes.ts`, `echelle.ts`, `calendrierAjout.ts`, feuille d'ajout, `usePointeur`), frise prix (`Fenetre.tsx`, `EnTete.tsx`, courbe des prix = `Courbe.tsx`, `toucheLeTrace`), PERIODE-PARTOUT (`FrisePeriode.tsx`), `principes.mjs`. Un défaut qui en touche un est dans une voie « après » de son propriétaire.
- `git status` du worktree montre déjà `CalendrierTab.tsx`, `EnTete.tsx`, `Fenetre.tsx`, `DashboardTab.tsx`, `Header.tsx` modifiés (voies en cours) : les voies qui les touchent partent de leur commit, pas avant.

## Règles des contrôles

- Un contrôle est une étape qui doit être **rouge sur tour8** (`--ref en-ligne/2026-11-21-tour8`), puis verte sur l'arbre. Il se joue au doigt (390 tactile, plus 1280 souris si la plainte le dit), fixtures « ZZ TEST » / simulées, jamais `seedData.ts`, aucun Gemini.
- Données du Calendrier (Jhhh ×2, neipa v3 ×3, T-ZZ-POMPE, loyer) : `scripts/parcours/fixtures/calendrier.mjs`, déjà chargée par `geste.mjs`. Étapes sur cette fixture : `geste.mjs --endroits <nouveau>` pour les gestes, `chaines.mjs` (étape `CH-<id>`) pour lire des chiffres, des textes et des cadres. Chaînes sans le Calendrier (Carnet, CHF, hors ligne) : `chaines.mjs`.
- `principes.mjs` est pris : aucun contrôle neuf n'y est ajouté. Une règle transversale (étiquette qui en recouvre une autre, texte rogné) s'écrit en étape de `chaines.mjs` et se joue sur les cinq échelles ; le pilote décide ensuite de la remonter dans `principes.mjs`, après son propriétaire.
- `geste.mjs` et `chaines.mjs` sont écrits par plusieurs voies : chacune ajoute un bloc distinct, id préfixé `CH-<id>`, sans toucher aux blocs voisins ; le pilote fusionne.
- Une capture se prend ET s'ouvre (L12). Deux thèmes pour les défauts visuels.

## Ordre d'ensemble

1. Vague 1, en parallèle (aucun fichier pris, aucun recouvrement) : **V1, V2, V3, V4, V5, V6**.
2. Vague 2, quand les voies prises sont rendues : **V7** après V1 ; **V8** après la frise prix et V7 ; **V9** après V8 ; **V10** après la frise prix ; **V11** après V9 et V10 ; **V12** après V4 et V8 ; **V13** après V12 et après gestes au jour et bord.

Recouvrements assumés et ordonnés : `useDonneesCalendrier.ts` et `domain/calendrier.ts` (V1 puis V7), `Rangee.tsx` (V7 puis V8), `EnTete.tsx` (V8 puis V9), `entete.css` (V10 puis V11 ; V9 n'y écrit pas), `CalendrierTab.tsx` (V4 puis V12 puis V13), `Fenetre.tsx` (V8 puis V12).

---

## V1 — Les chiffres disent l'inconnu et le vrai nom (vague 1)

- **Ids** : CHD-1, CHD-9, CHD-10, CHD-11.
- **Fichiers** : `src/ui/calendrier/useDonneesCalendrier.ts` (CHD-1 lignes 115, 190, 204 : tester aussi `cashComplete` comme le Bord, `forecast.ts:58` en lecture ; CHD-11 ligne 171), `src/domain/calendrier.ts` (CHD-9 `dureeBrassin` l. 500 ; CHD-10 l. 123 `nom = id + name`). Tests : `tests/unit/calendrier.test.ts`.
- **Contrôle** (`chaines.mjs`, fixture calendrier) :
  - `CH-D1` : pièce T-ZZ-POMPE payée sans paiement ; Finances dit « solde pas connu », donc le titre du Calendrier ne doit pas contenir « CHF à dépenser » chiffré. Rouge : tour8 écrit « −6 925 CHF à dépenser ». Contre-épreuve : fixture sans la pièce, le chiffre reste.
  - `CH-D9` : Jhhh brassé à J−40 ; le texte de la barre contient « J40 » ou « prête depuis 6 j », jamais « J34 / 34 ». Rouge sur tour8.
  - `CH-D10` : le Bord ne nomme plus « B-NEIPA-1 » ; il dit « neipa v3 ». Rouge sur tour8.
  - `CH-D11` : un brassin en cuve avec emballage non renseigné dit « coût à venir » (jamais 0) au Calendrier. Rouge sur tour8.
- **Doute** : la limite de CHD-1 est la même que celle de `semainesPassees(…, soldeConnu)` (`useDonneesCalendrier.ts:88`) : vérifier que le recul de la fenêtre ne bouge pas quand le solde devient « inconnu ».

## V2 — Barres, étiquettes, bulle d'étape (vague 1)

- **Ids** : CHV-8, CHV-10, CHV-15, CHV-18.
- **Fichiers** : `src/ui/calendrier/frise/Barre.tsx` (CHV-8 l. 492 `cal-lbl-${cote}` ; CHV-10 coupe « J0 / … » alors que le nom est dehors ; CHV-15 bulle `cal-point-bulle` l. 464 qui se pose sur la barre voisine), `src/ui/calendrier/frise/Marque.tsx` (CHV-18 côté de l'étiquette d'un jalon, `LibelleMarque.cote` l. 216). CSS : `frise.css`.
- **Contrôle** (`chaines.mjs`, 390, 5 échelles, deux thèmes) :
  - `CH-V8` : pour chaque barre dont la largeur ≥ 100 px, le nom n'est pas à plus de 24 px de la barre qu'il nomme (bords du rectangle texte et du rectangle barre) et jamais sur la grille vide. Rouge sur tour8 (4 barres de S48–S49).
  - `CH-V10` : aucun `.cal-lbl-t` de durée n'a `text-overflow` actif (scrollWidth > clientWidth) quand son nom est écrit hors de la barre. Rouge sur tour8 (6 mois).
  - `CH-V15` : toucher le picto d'étape de « Ssr » ; la bulle ne recouvre aucun `.cal-lbl-t` (nom) d'une autre barre. Rouge sur tour8.
  - `CH-V18` : le côté d'un jalon est constant (même côté pour tous sauf bord de fenêtre, raison lisible) ; en An, « Impôt sur la bière · Fruty » n'est plus à gauche de son picto. Rouge sur tour8.
- **Attention** : la voie « gestes au jour et bord » peut toucher `Barre.tsx` (bord de début, CHG-4 en cours). Prendre son dernier commit. Ne rien changer à la poignée ni à `usePointeur`.

## V3 — Message du glisser et menu d'appui long (vague 1)

- **Ids** : CHV-7, CHV-9.
- **Fichiers** : `src/ui/calendrier/message.css` (l. 26, coupe « Seul le jalon de fin se glisse. » à la limite de deux lignes), `src/ui/calendrier/frise/Message.tsx`, `src/ui/calendrier/frise/MenuAppuiLong.tsx` (trois tuiles de 3 à 4 lignes, paragraphe de 3 lignes). Le texte du message vient de `calendrierGestes.ts` (pris) : on change la mise en page, pas la phrase. Si CHG-6 (en cours) réécrit la phrase, repartir de son commit.
- **Contrôle** (`chaines.mjs` ; 390 et 1280) :
  - `CH-V7` : glisser le brassin « neipa v3 » en cuve ; le message n'est coupé en aucun point (aucune ligne ne finit sur « Seul le jalon de fin se glisse. » en tête de deuxième ligne ; hauteur du message identique avant/après le défilement, texte entier visible). Rouge sur tour8.
  - `CH-V9` : appui long sur « Ssr » ; le menu fait ≤ 1/3 de la hauteur des pistes, au plus 4 lignes de texte, et à 1280 ne recouvre pas la barre voisine (rectangles sans intersection). Rouge sur tour8. Règle n° 1 : si une maquette choisie du menu existe, elle prime (vérifier `choix/ecrans.json` avant de dessiner).

## V4 — Saut vers une chose, retour, recherche (vague 1)

- **Ids** : CHN-5, CHN-6, CHN-8, CHN-11, CHN-12.
- **Fichiers** : `src/App.tsx` (l. 975-988 `ouvrirChoseCalendrier`, `setGlobalTimeFilter` ; l. 1368 `poserRetour('calendrier')` ; palette l. 1060, 1068), `src/ui/carnets/CarnetsVue.tsx` (l. 1386-1391 `auCalendrier` : événement `{ date }` sans identifiant de chose), `src/ui/calendrier/entete/Retards.tsx` et `onOuvrirRetard` de `CalendrierTab.tsx` (l. 962), `src/components/Header.tsx` (CHN-11 : l'en-tête de l'app n'est pas collé ; le fichier est déjà modifié, partir de son état). `src/domain/calendrier.ts:906` (icône d'idée) en lecture.
- **Contrôle** (`chaines.mjs`, 390 tactile, fixture carnet + calendrier) :
  - `CH-N5` : Carnet › « ZZ TEST Projet chambre froide » › « Au calendrier » ; la chose est visible (barre, jalon ou sélection) dans la fenêtre ouverte, sans toucher ±. Rouge sur tour8 (Calendrier en février, rien).
  - `CH-N6` : la barre de période de l'app avant et après le saut et le retour téléphone est la même (« Nov. »). Rouge sur tour8 (« Févr. »).
  - `CH-N8` : compteur de retards › « Hefe » › croix de la fiche ; on est sur le Calendrier. Rouge sur tour8 (liste Brassins).
  - `CH-N11` : 6 sem., défiler de 268 px ; ‹ › et la loupe restent dans la fenêtre (rectangle visible, top ≥ 0). Rouge sur tour8 (top = −268).
  - `CH-N12` : loupe › « Marché » › Entrée ; la fête est sélectionnée ou sa fiche ouverte. Rouge sur tour8.
- **Doute** : CHN-11 change l'en-tête de tous les onglets (VUE-SAUTE, VUE-FOND, hauteur de la zone). Garder le correctif limité à la barre de période, ou le dire au pilote.

## V5 — Champ CHF (vague 1)

- **Ids** : CHE-3, CHE-4.
- **Fichiers** : `src/ui/finance/ChampMontant.tsx` (l. 48 `enterKeyHint="next"` sans action ; l. 67-71 le blur remplace « 1000 » par « 1 000 » et redessine le champ, le premier toucher sur Nom est perdu). Tests : `tests/unit` du champ si présents.
- **Contrôle** (`chaines.mjs`, feuille d'ajout Papiers, 390 tactile, toucher CDP) :
  - `CH-E3` : taper `1000` dans CHF, toucher Nom ; `document.activeElement` est le champ Nom au premier toucher, et le nom tapé ensuite est gardé après Entrée. Rouge sur tour8 (focus resté sur un DIV). Banc sans clavier logiciel : à confirmer sur un vrai téléphone, le dire.
  - `CH-E4` : Entrée dans CHF passe à Nom (ou valide si le nom est posé). Rouge sur tour8 (focus resté dans CHF).
- **Attention** : `ChampMontant` sert aussi Finances ; rejouer les chaînes qui l'utilisent (VENDRE, ACHETER). La feuille d'ajout est prise, mais ce fichier ne l'est pas : on ne modifie pas `FeuilleAjout.tsx`.

## V6 — Hors ligne (vague 1, **état de l'art d'abord**)

- **Ids** : CHN-7.
- **Fichiers** : `public/` (seul `brew-alerts-sw.js` existe), `vite.config.ts`, `src/main.tsx`, `src/ui/LazySurface.tsx` (message « Impossible de charger cet écran »), `src/services/brewAlarms.ts:22`.
- **Avant tout code** : problème type « précache d'une application web hors ligne » (service worker, stratégie de cache, mise à jour). Écrire dans « ## État de l'art » de la mission la décision (Workbox / `vite-plugin-pwa`, méthode standard) ; sans elle la voie rend `ECHEC — état de l'art à faire` (L29). Ne pas écrire un service worker à la main.
- **Contrôle** (`chaines.mjs`, banc avec le service worker servi sur localhost) : premier lancement en ligne, puis `setOfflineMode(true)`, toucher un retard (« Hefe ») ; l'écran du brassin s'ouvre ; recharger : l'app rend. Rouge sur tour8 (bandeau puis page « dinosaure », `ERR_INTERNET_DISCONNECTED`).
- **Limite** : le constat est « à rejouer en ligne » (le banc sert sans en-têtes de cache). Il touche tout le déploiement : mise en ligne avec l'accord du brasseur, lecture seule des données ; jamais de données réelles pour tester.

### État de l'art (V6, 21.11, L29)

- **Problème d'école** : précache d'une PWA (application web progressive) Vite à écrans chargés à la demande (`React.lazy`, découpe en morceaux) : un service worker met en cache, à l'installation, la coquille (`index.html`) et tous les morceaux hachés, répond aux navigations hors ligne par la coquille précachée, et se met à jour par version. C'est le cas type « app shell + précache révisionné + route de navigation ».
- **Constat sur le code (port-carnet, `bf1f6bc6b`)** :
  - Aucun cache de l'application : `public/` ne contient que `brew-alerts-sw.js` (push et clic de notification, 146 lignes, sans `fetch`), enregistré **à la demande** par `brewAlarms.ts:22` (portée `/`). Sans service worker, `/` et `/index.html` sont servis `no-store` (`firebase.json`) : hors ligne, la page « dinosaure » est certaine, quels que soient les morceaux déjà vus. Les assets hachés (`immutable`, 1 an) ne sauvent que les morceaux déjà visités.
  - Une portée ne tient qu'**un** service worker : en ajouter un second à `/` remplace ou est remplacé par `brew-alerts-sw.js` (alarmes de brassage perdues). Il faut un seul worker qui porte les deux.
  - `brewNotifications.ts:200` reconnaît le worker par `scriptURL.endsWith('/brew-alerts-sw.js')` ; `brewerPush.test.ts` et `brewNotifications.test.ts` lisent `public/brew-alerts-sw.js` comme source.
  - Build mesuré (`dist`, 21.11) : 348 fichiers, 26,1 Mo non compressés (JS 22,0 ; CSS 1,7 ; `.mjs` 1,4 ; `.wasm` 1,0). Six fichiers > 1 Mo (`App` 2,5 ; `Host` 1,9 ; `hopBeerMaverickBootstrap` 1,4 ; `yeastReferences` 1,4 ; `pdf.worker.min` 1,4 ; `calcul.worker` 1,3). Le transfert compressé est plus petit ; le chiffre n'est pas mesuré.
- **Méthodes examinées** :
  1. **Workbox 7.4.1 (`workbox-build`) par `vite-plugin-pwa` 2.0.0** (pair de Vite 3 à 8 ; l'arbre a Vite 6.4.3). Standard de fait (Google ; le plugin est la voie documentée par Vite). Deux modes : `generateSW` (le plugin écrit le worker depuis une configuration) et `injectManifest` (on écrit le worker, le plugin injecte la liste). Fournit : liste de précache hachée issue du build, `cleanupOutdatedCaches`, `navigateFallback` (+ liste d'exclusion), mise à jour par comparaison des révisions, `importScripts` d'un script existant.
  2. **Worker écrit à la main** (liste de fichiers, cache, `fetch`, nettoyage) : refusé, c'est la rustine que L29 interdit (versions de cache, course entre installation et activation, 404 des morceaux d'une ancienne version, navigation hors ligne).
  3. **Pas de service worker, cache HTTP seul** : ne couvre pas la navigation (`/` en `no-store`) ; et changer les en-têtes est un accord. Insuffisant seul pour CHN-7.
  4. **`workbox-build` appelé à la main après `vite build`** : même dépendance que 1, sans le branchement Vite ; plus de code à nous, aucun gain.
- **Décision** : méthode 1, mode `generateSW` du plugin.
  - Un seul worker `sw.js` (écrit par le plugin) qui **importe** l'existant par `workbox.importScripts: ['brew-alerts-sw.js']` ; `public/brew-alerts-sw.js` ne change pas (tests des alarmes intacts). `brewAlarms.ts` et `main.tsx` enregistrent `/sw.js` ; `brewNotifications.ts:200` reconnaît `/sw.js` aussi.
  - Précache : `js, css, html, woff2, svg, png` ; `maximumFileSizeToCacheInBytes` à 3 Mo (le plus gros, `App`, fait 2,5 Mo) ; `pdf.worker.min` (`.mjs`) et `.wasm` hors précache, en `CacheFirst` à l'usage (le PDF et le QR hors ligne ne sont pas dans CHN-7). `cleanupOutdatedCaches: true`.
  - Navigation : `navigateFallback: '/index.html'`, `navigateFallbackDenylist: [/^\/__\//]` (gestionnaire d'authentification Firebase, réservé par l'hébergement). Aucune `runtimeCaching` pour Firestore, Auth ou les fonctions : les données restent à Dexie et au cache Firestore (IndexedDB), pas au worker.
  - Mise à jour : `registerType: 'autoUpdate'` (`skipWaiting`, `clientsClaim`), comme le worker d'alarmes actuel (`skipWaiting`, `clients.claim`). Après une mise en ligne, une page ouverte garde ses anciens morceaux jusqu'au rechargement ; un morceau d'une ancienne version déjà purgé tombe sur `LazySurface` (« Recharger l'application ») : comportement actuel, pas aggravé.
- **Ce que la décision exige (accords à demander, donc arrêt avant le code)** :
  1. **Nouvelle dépendance de développement** : `vite-plugin-pwa@2.0.0` (+ `workbox-build@7.4.1` et `workbox-window@7.4.1`, ses pairs), `package.json` et `package-lock.json`. Absentes de `node_modules` et du verrou aujourd'hui.
  2. **Hébergement** (`firebase.json`, interdit à la voie) : `sw.js` tomberait sous la règle `**/*.js` (`immutable`, 1 an). Chrome relit le script principal d'un worker sans le cache HTTP (`updateViaCache: 'imports'` par défaut, plafond 24 h) : ça marche sans changement, mais la règle sûre est d'ajouter `/sw.js` en `no-cache, max-age=0`, comme `/brew-alerts-sw.js`. Recommandé, non bloquant pour le premier essai.
  3. **Budget** : précache d'environ 24 Mo non compressés à la première visite (puis seulement les morceaux changés à chaque version). Réglable (`globIgnores`) si le brasseur le juge lourd sur mobile.
- **Contrôle prévu** (après accord) : étape `CH-N7` de `chaines.mjs`, banc servant le build de la voie (le worker n'existe pas en `vite dev`) sur `localhost` : premier lancement en ligne, attente du worker `activated` et de la fin du précache, `setOfflineMode(true)`, toucher « Hefe » (l'écran du brassin s'ouvre), recharger (l'app rend, pas de `ERR_INTERNET_DISCONNECTED`). Rouge sur tour8 (pas de worker d'application), vert sur l'arbre. Le banc ne prouve pas l'hébergement : « à rejouer en ligne » reste dit.

## V7 — Pastilles de rangée justes (vague 2, après V1)

- **Ids** : CHD-3, CHD-4, CHD-5, CHV-12.
- **Fichiers** : `src/ui/calendrier/frise/Rangee.tsx` (CHD-3 l. 578-600 `pastille` somme le budget des barres, pas les mouvements de la fenêtre ; CHD-4 l. 582 `fermes` exclut le loyer `probable` ; CHD-5 l. 895 mot « confirmé » posé dès `confirme` ; CHV-12 résumé coupé par la pastille « coût à venir »), `src/domain/calendrier.ts` (l. 540 `budgetBrassin`), `src/ui/calendrier/useDonneesCalendrier.ts` (l. 118 `echeancesProposees`). Tests : `calendrier.test.ts`.
- **Contrôle** (`chaines.mjs`, fixture calendrier ; valeurs de référence recalculées dans CHASSE-donnees.md) :
  - `CH-D3` : 2 sem. posées sur 26.10–08.11 : pas de « −90 » ni de « confirmé » (aucun mouvement dans la fenêtre) ; 6 sem. : Brassins « −183 » (par date), pas « −228 ». Rouge sur tour8.
  - `CH-D4` : An : la pastille Papiers compte le loyer, −4 800 (12 × 400) dit « prévu » ; 6 sem. : −1 000 (loyer −400 + lol −600). Rouge sur tour8 (« −1 051 », « −600 »).
  - `CH-D5` : 3 mois : Ventes et Achats ne disent « confirmé » que pour ce qui est encaissé ou payé ; le reste est « à encaisser », « à payer » ou « prévu » (les mots de Finances). Rouge sur tour8 (« +2 257 confirmé », « −960 confirmé »).
  - `CH-V12` : à 390, An et 6 mois : aucun résumé « confirmé … » n'est tronqué (scrollWidth ≤ clientWidth) ; la pastille « coût à venir » passe à la ligne ou cède. Rouge sur tour8.
- **Doute** : CHD-3 touche la définition de la pastille (somme du solde de la période, plus le budget des barres). Si les deux sens coexistent, les nommer sur l'écran ; ne rien chiffrer 0 quand c'est inconnu.

## V8 — Période et An cohérents, après la frise prix (vague 2)

- **Propriétaire à attendre** : frise prix (`Fenetre.tsx`, `EnTete.tsx`). Aussi après V7 (`Rangee.tsx`).
- **Ids** : CHG-3, CHG-7, CHV-4, CHD-7, CHN-1.
- **Fichiers** : `src/ui/calendrier/entete/Fenetre.tsx` (CHG-3 l. 280, 303 : en An un toucher sur la poignée jette l'année ; CHG-7 bulle « S40 – S40 » sur le coin du début ; CHV-4 l. 111 `etiquetteCadre` branche année ; CHD-7 l. 112 ; CHN-1 l. 31-49 `fenetreDePeriode`), `src/ui/calendrier/entete/EnTete.tsx` (l. 585-590 `etiquetteAnnee`), `src/ui/calendrier/frise/Rangee.tsx` (étiquette de pastille `colonnes[0].etiquette` : « oct.–oct. » sans année), `src/components/periode/periode.ts` (l. 122-137 `pas` sans borne ; partagé avec `FrisePeriode.tsx` de PERIODE-PARTOUT : ne pas en changer la forme), `src/components/periode/PastillePeriode.tsx` (l. 47 `disabled={!ok}`).
- **Contrôle** :
  - `geste.mjs --endroits calendrier` (nouvelle étape `CH-G3`) : An ; toucher la poignée de début sans bouger ; la fenêtre reste An. Rouge sur tour8 (passe à « S49 – S50 »).
  - `CH-G7` (`geste.mjs`) : 1 semaine, tirer le début ; la bulle dit « S40 » (une semaine, pas « S40 – S40 »), ne couvre ni le coin du début ni la poignée, et l'en-tête, la bande et la bulle disent la même semaine. Rouge sur tour8.
  - `CH-V4` + `CH-D7` (`chaines.mjs`) : An ; le bouton de période, le cadre de la courbe et les pastilles de rangée nomment la même fenêtre (bornes oct. 2026 – oct. 2027 avec l'année) ; touche › puis ‹ : le cadre change avec elle. Rouge sur tour8 (« janv. – nov. 2027 », « oct.–oct. »).
  - `CH-N1` (`chaines.mjs`) : An, › une fois puis dix fois ; 6 sem. › trente fois : la barre et la frise disent la même période à chaque pas, et la flèche s'éteint ou le Calendrier dit la borne. Rouge sur tour8 (barre « 2029 », frise passée à 2 sem.).

## V9 — Plein écran et horizon de la caisse (vague 2, après V8)

- **Propriétaire à attendre** : frise prix (`EnTete.tsx`).
- **Ids** : CHV-5, CHN-10, CHD-8.
- **Fichiers** : `src/ui/calendrier/entete/EnTete.tsx` (CHV-5 l. 705 `libelle` pris de la période de l'app, pas de la fenêtre ; CHN-10 l. 725 ; titre « CHF à dépenser S43 ’27 » pour CHD-8), `src/ui/calendrier/pleinEcran.ts`, `src/ui/calendrier/entete/DetailCreux.tsx`, `src/domain/calendrierCaisse.ts` (`creuxDepuis`), `src/components/tabs/DashboardTab.tsx` (l. 184-190 `pointBasAVenir`, déjà modifié : partir de son état ; l. 341 « Point le plus bas »). `entete.css` : non, c'est V10 puis V11.
- **Contrôle** (`chaines.mjs`) :
  - `CH-V5` : à l'arrivée, la pastille dit ce que la frise montre (6 semaines S44–S49), pas « Nov. ». Rouge sur tour8.
  - `CH-N10` : plein écran en portrait, 6 sem. ; ‹ › et la loupe restent atteignables, et le bandeau « Tourne le téléphone » ne couvre aucune ligne (rectangles sans intersection). Rouge sur tour8 (couvre « Loyer du local »).
  - `CH-D8` : le Bord, Finances › Prévisions et le Calendrier écrivent chacun l'horizon de leur point bas (« 90 j », « au 18.02 », « 52 sem. ») ; une même grandeur au même horizon, ou le mot « horizon » sur chacune. Rouge sur tour8 (aucun ne le dit).
- **Doute** : CHD-8 est aussi un latent de calcul (`creuxDepuis` au pas de la semaine, −3 624 au lieu de −3 729 sur 90 j) : le test Vitest `calendrierCaisse.test.ts` couvre le calcul, le contrôle ne couvre que le texte.

## V10 — Courbe : étiquette, points, 2 semaines (vague 2, après la frise prix)

- **Propriétaire à attendre** : frise prix (`Courbe.tsx`, `toucheLeTrace`).
- **Ids** : CHD-2, CHV-16, CHV-17.
- **Fichiers** : `src/ui/calendrier/entete/Courbe.tsx` (CHD-2 l. 259-266 `parNom` indexé sur `m.nom` ; CHV-16 les cercles `ent-pt` l. 596-597 en An aligné ; CHV-17 cadre tout rose, trait collé au bord bas), `src/ui/calendrier/entete/entete.css` (l. 100 `.ent-pt`, calques de la courbe), `src/ui/calendrier/entete/GrandeCourbe.tsx` (lecture), `src/domain/calendrierCaisse.ts` (`mouvementsDeSemaine`, lecture : il regroupe déjà). Tests : `calendrierCaisse.test.ts`.
- **Contrôle** (`chaines.mjs`, fixture calendrier) :
  - `CH-D2` : 6 sem., semaine S47 : l'étiquette sur la courbe et la marche disent la même somme (« −90 », ou « Emballage ×2 −90 »), jamais « −45 ». Rouge sur tour8.
  - `CH-V16` : en An aligné, aucun jeu de points gris n'est dessiné sans légende ; soit supprimé, soit nommé. Rouge sur tour8 (cercles `ent-pt` présents sans texte associé).
  - `CH-V17` : 2 sem. : le trait du solde est à ≥ 4 px du bord du cadre, au moins une étiquette lisible, cadre non uniformément rose. Rouge sur tour8.

## V11 — Graduations et bande des semaines (vague 2, après V9 et V10)

- **Propriétaire à attendre** : frise prix (`entete.css` partagé avec la courbe) et V8 (An).
- **Ids** : CHV-13, CHV-14.
- **Fichiers** : `src/ui/calendrier/entete/BandeSemaines.tsx` (l. 79 : un repère par semaine dont le numéro est multiple du pas, S53 et S1 sautés), `src/ui/calendrier/entete/BandeAnnee.tsx` (mois en lettres, sans année), `src/ui/calendrier/entete/BandeColonnes.tsx` (l. 111 légende de semaine dépliée), `src/ui/calendrier/entete/entete.css` (l. 270).
- **Contrôle** (`chaines.mjs`, deux thèmes) :
  - `CH-V13` : 6 mois : les repères sont à pas régulier (écart entre deux repères voisins constant) et passent le changement d'année (S53/S1 comptés) ; An : une marque d'année à chaque janvier (ou « 2027 » sur le premier J). Rouge sur tour8 (« S50 S52 · S2 S4 »).
  - `CH-V14` : toucher S47 ; la légende « S47 16–22 nov. · toucher pour replier » a un corps ≥ 11 px (R : les textes de la frise), ne déborde pas sur S46 ni S48 (rectangles sans intersection). Rouge sur tour8 (≈ 9 px, déborde).

## V12 — Menu de période (vague 2, après V4 et V8)

- **Ids** : CHN-3, CHN-9, CHN-13.
- **Fichiers** : `src/ui/calendrier/entete/MenuPeriode.tsx` (CHN-13 l. 128-146 : la ligne « Échelle » double les durées ; CHN-3 l. 128-135 `onChoisir`, `onEchelle('jour')`), `src/components/tabs/CalendrierTab.tsx` (CHN-3 l. 212-228 `fenetre` / `periodeLocale` ; CHN-9 l. 229 `useState(false)` : ± passe par `useEtatGarde` comme l. 230-233 ; déjà modifié : partir de son état), `src/ui/calendrier/entete/Fenetre.tsx` (`fenetreDePeriode`, seulement si le début de la fenêtre y est décidé : après V8). `useDonneesCalendrier.ts:88` `semainesPassees` en lecture (le recul de 3 semaines).
- **Contrôle** (`chaines.mjs`) :
  - `CH-N3` : depuis « Nov. », « 2 sem. » pose une fenêtre qui contient aujourd'hui (21.11) ; depuis An puis « Jour », même règle ; la pastille ne dit pas « · j ». Rouge sur tour8 (26.10–8.11, hors champ).
  - `CH-N13` : une seule ligne coche une durée à la fois ; « Jour » et « 2 sem. » ne sont jamais cochés ensemble. Rouge sur tour8.
  - `CH-N9` : ± allumé, recharger : ± reste allumé (`aria-pressed=true`), comme la courbe cachée et la rangée masquée. Rouge sur tour8.
- **Attention** : la durée choisie fixe la période de toute l'app (Finances aussi) ; ne pas changer cette règle ici.

## V13 — Ajout et feuille, après gestes au jour et bord (vague 2)

- **Propriétaire à attendre** : gestes au jour et bord (`calendrierAjout.ts`, feuille d'ajout). Aussi après V12 (`CalendrierTab.tsx`).
- **Ids** : CHE-1, CHV-19.
- **Fichiers** : `src/components/tabs/CalendrierTab.tsx` (CHE-1 : remise au point de la fenêtre après `onAjouter`, non localisée à la ligne), `src/domain/calendrierAjout.ts` et `src/ui/calendrier/frise/FeuilleAjout.tsx` (CHE-1 : horizon préréglé sur S40 2027 au + suivant), `src/ui/calendrier/frise/DureeFenetre.tsx` et `frise/feuille.css` (CHV-19 l. 59-62 `.cal-f-duree-rep small` 11 px, `--cave-200`).
- **Contrôle** :
  - `CH-E1` (`chaines.mjs`, 3 mois, 390) : Ventes › + › CHF 12,5, horizon « 1 an », nom « ZZ TEST vente 1:1 », Entrée ; la vue garde « 3 mois » et la chose est visible, ou le message dit « posée en nov. 2027 · Voir » ; le + suivant s'ouvre sur aujourd'hui, pas sur S40 2027. Rouge sur tour8 (vue en 6 sem. S40–S45 2027, rien à l'écran).
  - `CH-V19` (`chaines.mjs`, cave et clair) : feuille d'ajout, frise Durée ; les graduations « nov. déc. janv. » ont un corps ≥ 12 px et un contraste ≥ 4,5:1 sur le fond de la piste. Rouge sur tour8.

---

## Fiche : attend choix fiche

- **CHE-2** Supprimer / Retirer manquant dans la fiche et dans Modifier ; décision « on ne supprime jamais » (`MenuAppuiLong.tsx:24`), `DetailChose.tsx:346-348`.
- **CHE-5** Modifier d'un brassin (renommer, changer la date) ; `DetailChose.tsx`.
- Ils attendent le choix du brasseur sur la page fiche (maquettes à lui montrer, jamais en mots seuls). Aucune voie, aucune ligne de code.

## Tableau de contrôle

| Voie | Vague | Ids | Nb |
|---|---|---|---|
| V1 | 1 | CHD-1, 9, 10, 11 | 4 |
| V2 | 1 | CHV-8, 10, 15, 18 | 4 |
| V3 | 1 | CHV-7, 9 | 2 |
| V4 | 1 | CHN-5, 6, 8, 11, 12 | 5 |
| V5 | 1 | CHE-3, 4 | 2 |
| V6 | 1 | CHN-7 | 1 |
| V7 | 2 (après V1) | CHD-3, 4, 5 ; CHV-12 | 4 |
| V8 | 2 (après frise prix, V7) | CHG-3, 7 ; CHV-4 ; CHD-7 ; CHN-1 | 5 |
| V9 | 2 (après V8) | CHV-5 ; CHN-10 ; CHD-8 | 3 |
| V10 | 2 (après frise prix) | CHD-2 ; CHV-16, 17 | 3 |
| V11 | 2 (après V9, V10) | CHV-13, 14 | 2 |
| V12 | 2 (après V4, V8) | CHN-3, 9, 13 | 3 |
| V13 | 2 (après V12, gestes au jour et bord) | CHE-1 ; CHV-19 | 2 |
| Fiche | attend choix | CHE-2, 5 | 2 |
| **Total** | | | **42 (40 en voies)** |
