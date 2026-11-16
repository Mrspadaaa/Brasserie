OK partiel — PC-3 corrigé (liste du Combobox dans le flux, 5 lignes) ; VB-2 non reproductible au code, cause probable établie, tests gardes posés.

Branche `c1/parcours` (worktree `C:/Users/mrspa/AppData/Local/Temp/c1-wt`), commit 3131bed3, base tag `en-ligne/2026-11-10-mesures`.

## Fichiers écrits
- `src/ui/Combobox.tsx` : liste dans le flux (PC-3).
- `tests/unit/comboboxListeFeuilleCourte.test.tsx` (5 tests, 2 rouges sur le tag : « expected 96 to be >= 200 »).
- `tests/integration/brewMesurerOuvertureSansEcriture.test.tsx` (en ligne simulé, `saveBrewSession` espionné) et `brewMesurerOuvertureSansSauvegarde.test.tsx` (hors ligne, `onSave` espionné, 9 étapes x 2 états).
- Voie : `banc-combobox.mjs`, `banc-mesurer.mjs`, `captures/`, `tests.txt`, ce fichier.
- Fichiers ignorés par Git copiés dans le worktree pour le banc : `src/data/seedData.ts`, `.env.local` (depuis b2-wt).

## 1. VB-2 — ouvrir Mesurer n'écrit rien
- Lecture du code : le geste (`openCapture`, `requestMeasure`, `navigate` en consultation, `requestedReading`, pas d'effet qui appelle `update`) ne change aucun état persistant. Seul chemin vers `saveBrewSession` : `pump()` de `useBrewSession`, appelé par `update`, par `refresh()` (montage, `online`, `visibilitychange`) et par `flush`.
- Test en ligne simulé (3 étapes) et hors ligne (18 cas) : aucun POST, aucun `onSave`, à l'ouverture, au toucher de la piste, au ×. Ces tests PASSENT sur le tag : le critère « échoue avant la correction » (L13) n'est donc pas tenable pour VB-2, le défaut ne vient pas du geste.
- Cause la plus probable (test qui la montre) : un brouillon resté dans la file locale `brew-outbox-<uid>-<lot>` est renvoyé au montage de la page par `refresh()` puis `pump()`, avec une `baseRevision` périmée : 409 « changé sur un autre appareil ». Test « le POST précède le premier clic » : vert. Le script e1 ne journalisait que les réponses >= 400 et le profil gardait un « brouillon conservé » : un POST envoyé au chargement a pu être pris pour celui du clic. Non prouvé en ligne (aucun accès réel).
- Chrome (banc local `?dev-local`, brassin `LOT-C1` « ZZ TEST — c1 », 390 tactile) : « Relever » touché, feuille Mesurer ouverte, piste touchée (« dans la cible »), × touché : REQUETES-NON-GET `[]`, ETAT-PERSISTANT-IDENTIQUE `true`, « Relevés du jour 0/2 » et « ? °C » inchangés. Captures ouvertes : `captures/m-02-mesurer-ouvert-390.png`, `m-03-piste-touchee-390.png`, `m-04-ferme-390.png`. 1280 non joué.

## 2. PC-3 — liste à 5 lignes
- Cause : `placeMax = max(96, place)` et liste absolue coincée entre le haut du corps de la feuille et le champ : 96 px = 2 lignes de 40 px (mesuré : `optionsPleines 2` à 390x844 et 390x560).
- Correction : au téléphone (largeur <= 640), si ni au-dessus ni au-dessous il n'y a la place de min(options, 5) lignes (et plus de 96 px), la liste passe dans le flux sous le champ (`relative`), hauteur 5 lignes (+ 8 px), la feuille grandit et la liste se fait voir (`scrollIntoView nearest`). Mesure du champ seul (sinon la liste en flux fausse la place). Inchangé : bureau, champ avec de la place, listes de 4 options ou moins.
- Mesuré après : `optionsPleines 5` à 390x844 et 390x560 (avant : 2). Vrai toucher CDP sur « Additif » (5e ligne) : valeur « Additif », liste fermée.
- Captures ouvertes : `captures/avant-combobox-ouvert-390x844.png` (2 lignes sous la barre), `avant-combobox-ouvert-390x560.png`, `apres-combobox-ouvert-390x844.png`, `apres-combobox-ouvert-390x560.png`, `apres-apres-choix-390x844.png`.

## Contrôles
- `npx tsc --noEmit -p .` : aucune erreur hors `functions/` (modules `firebase-admin` absents du worktree, hors voie).
- `VITE_HOP_V4=on npx vite build` : vert (sortie dans un dossier temporaire).
- Suite `tests/unit tests/integration` : voir « Suite » ci-dessous.

## Doutes et limites
- VB-2 : cause non reproduite ; si le 409 revient SANS brouillon local, la source est ailleurs (ouvrir la console réseau en ligne avant le geste, filtrer `saveBrewSession`, vider `localStorage` `brew-outbox-*` avant).
- PC-3 : les autres écrans qui emploient le Combobox à 390 (BrewWizard, IngredientPicker, dépense, houblons) ne sont pas recapturés ; la règle ne s'active que si la place manque pour 5 lignes. À faire passer à un exécutant : un test de hauteur par écran.
- Liste en flux dans une feuille très haute : la feuille grandit ; à 390x560 elle prend presque tout l'écran (voir capture).

DÉCISION À PRENDRE : VB-2 — (1) clore comme « geste sans écriture, file locale périmée » et ajouter un nettoyage visible de la file quand le serveur répond 409 deux fois ; (2) laisser. Recommandation : (2) pour ce lot, puis rejeu en ligne de e1 avec requêtes non GET journalisées, file locale vidée.

CONNAISSANCE : une liste de Combobox absolue dans un corps de feuille défilant ne peut pas dépasser la place au-dessus du champ (haut du corps) ; en feuille courte, seule la mise dans le flux donne 5 lignes.
LEÇON PROPOSÉE : un bug « écrit à l'ouverture » se confirme en listant toute requête non GET dès le chargement (pas seulement les réponses >= 400) et en vidant la file locale avant le geste ; sinon un renvoi de brouillon au montage passe pour l'effet du geste.

## Suite
- Sous-ensemble Combobox (comboboxLargeurListe, comboboxListeFeuilleCourte, dataEntry, inputProtection, brewWizardDraftFreshness) : 5 fichiers, 93 tests verts.
- Suite complète `tests/unit tests/integration` (terminée, `tests.txt`) : 13 tests rouges, 12 955 verts, 40 ignorés. Les 13 rouges sont les 5 fichiers connus : fuzzSaisie (2), recipeAiWorkflow (3), recipeEditing (6), designTokens (1), virgule-transversale (1). Aucun test rouge nouveau ; les 3 fichiers de la voie sont verts.
- 53 fichiers « échec de chargement » : modules absents du worktree (`firebase-functions`, `firebase-admin`, `cheerio` dans `functions/`), sans lien avec la voie (aucun de ces fichiers ne touche Combobox ni BrewDay). Non comparés un à un au tag : à confirmer par l'exécutant avec les dépendances de `functions/` installées si besoin.

DEMANDE EXECUTANT (réduite : seulement la comparaison des 53 échecs de chargement au tag ; la suite complète n'est plus à relancer) :
0. Rejouer sur `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70` (tag) les mêmes 53 fichiers en échec de chargement et confirmer qu'ils échouent à l'identique.
(Ancienne demande, caduque :)
1. Depuis `C:/Users/mrspa/AppData/Local/Temp/c1-wt` (branche `c1/parcours`, commit 3131bed3), sans autre processus lourd : `npx vitest run tests/unit tests/integration --reporter=dot > C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-10-parcours-complet/voies/c1/tests.txt 2>&1` (délai 15 min ; en arrière-plan, attendre la ligne « Test Files »).
2. Sortie attendue : exactement 11 fichiers rouges déjà présents sur le tag (fuzzSaisie, recipeAiWorkflow, recipeEditing, designTokens, virgule-transversale) ; zéro autre. Les 3 fichiers de la voie doivent être verts : comboboxListeFeuilleCourte, brewMesurerOuvertureSansEcriture, brewMesurerOuvertureSansSauvegarde.
3. Si un rouge hors liste : relever son nom et le premier message, le rejouer seul sur `git stash`-free worktree du tag (`C:/Users/mrspa/AppData/Local/Temp/deploy-bc70`) pour savoir s'il est nouveau.
