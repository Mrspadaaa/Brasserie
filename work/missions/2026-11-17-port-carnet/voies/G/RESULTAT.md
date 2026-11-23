ECHEC — G1, G4 à G6 : lots A, B, D non rendus, déploiement au pilote ; G3 OK 16/16, G2 estimé

Lot G, rendu de l'auteur le 17.11. Je n'ai fait aucun déploiement, aucun push, aucun appel Gemini et aucune écriture en ligne. Mon
brief me les interdit, et le prérequis 1 du lot G n'est pas rempli. Ce qui se fait hors ligne est fait. Le reste est écrit plus bas
sous forme de commandes prêtes, pour le pilote puis pour l'exécutant.

## Fichiers écrits

- `port-carnet/scripts/check-carnets-emulator.mjs` (neuf, non suivi). C'est le critère G3.
- `Brasserie/work/missions/2026-11-17-port-carnet/voies/G/RESULTAT.md` (ce fichier).
- `voies/G/journal-gemini.md` : gabarit, 0 appel.
- `voies/G/cout-estime.mjs` : l'estimation G2, à rejouer sur `fixture.ts`.

Rien d'autre n'est touché. `git status --short` du worktree port-carnet montre, hors des fichiers modifiés existants :
`?? scripts/check-carnets-emulator.mjs` (le mien) et `?? src/ui/carnets/` (lot C, en cours). Les fichiers `firestore.rules`, `.env` et
`firebase.json` sont inchangés : le script travaille dans `os.tmpdir()` et efface son dossier.

## Prérequis (ordre 1) : non rempli au 17.11

- Lots A, B et D : aucun fichier. `src/domain/carnets/`, `functions/src/carnetIA.ts` et `functions/src/lireLien.ts` n'existent pas.
- Lot C : `src/ui/carnets/` vient d'apparaître, il est en cours.
- Pas de critique sur les captures de V. La page de la voie E n'est pas vérifiée par moi.
- Aucune construction ni aucun déploiement ne peut porter le carnet aujourd'hui.

## Critères

**G3 Règles : tenu.** Commande : `node scripts/check-carnets-emulator.mjs` (racine port-carnet, 15 s, sortie 0).
- Les règles viennent du vrai `scripts/build-rules.mjs`, lancé sur une copie dans un dossier temporaire avec un `.env` d'essai (un
  compte). Gabarit sha `a66184ee3434`, règles sha `77835af1e504`.
- L'émulateur est `demo-carnets`, Firestore seul, sur le port 8187.
- Le compte autorisé crée, lit, modifie et supprime un `carnet` puis un `carnet-message`. Chaque geste est relu par l'administrateur.
- Le compte intrus a un courriel vérifié mais absent de la liste. Il est refusé sur les 8 gestes (HTTP 403). Rien n'est créé et le
  témoin reste identique.
- Sortie décisive :
```
  ✓ autorisé · carnet · créer … ✓ non autorisé · carnet-message · supprimer refusé   (16 lignes ✓)
REGLES CARNET OK 16/16 (règles sha 77835af1e504)
```
- Conclusion : aucune règle neuve. `firestore.rules.template` n'est pas à toucher, et le déploiement des règles n'est pas nécessaire
  pour le carnet.

**G2 Coût : estimé, pas mesuré** (L20). `rangerCarnet` n'existe pas encore. La méthode tient dans `cout-estime.mjs` :
- **Textes.** Les 3 notes `ref/` sont transcrites des images (146, 113 et 81 caractères). `fixture.ts` n'existe pas : les 4 phrases de
  la fixture sont donc remplacées par 4 phrases du métier tirées de MISSION (embouteillage, frigo, ventilation, évier ; 62 à
  132 caractères).
- **Contexte compact.** Il suit le format de MISSION § IA. Deux cas : 4 carnets (la fixture) et 30 (le plafond). Chaque carnet porte
  3 critères, 2 façons et 4 articles.
- **Consigne.** Elle vaut 2,5 fois celle de `rangerNote` (environ 3 600 caractères). Le schéma, compté en entrée, fait environ
  1 800 caractères.
- **Sortie.** Environ 170 caractères par ligne rangée, plus 300 jetons de réflexion basse, faute de chiffre.
- **Jetons.** 3,5 à 4 caractères par jeton, en français.
- **Tarif.** Il vient de `functions/src/geminiCosts.ts`, table « vérifiée le 2026-09-09 » sur https://ai.google.dev/gemini-api/docs/pricing,
  avec 1 USD compté 1,25 CHF.
  - 3.5 Flash-Lite : 0,30 CHF par million de jetons en entrée, 2,50 CHF en sortie.
  - 3.8 Flash : 1,50 CHF en entrée, 7,50 CHF en sortie.
  - **Cette table est périmée depuis le 09.10** (`validUntil`). Je n'ai pas pu la revérifier, faute d'accès au web. Le pilote la
    relit sur la page source avant le build.

| Cas (estimé) | Entrée | Sortie | Flash-Lite / message | 3.8 Flash / message |
|---|---|---|---|---|
| 4 carnets | 1 700 à 2 200 jetons | 400 à 440 | 0,0015 à 0,0018 CHF (max 0,0021) | 0,0055 à 0,0066 CHF (max 0,0078) |
| 30 carnets | 3 500 à 4 600 jetons | 400 à 440 | 0,0020 à 0,0025 CHF (max 0,0029) | 0,0082 à 0,0102 CHF (max 0,0114) |

En ordre de grandeur, **0,2 à 0,3 centime par message sur Flash-Lite, et environ 4 fois plus sur 3.8**. `lireLien` n'a pas de modèle,
donc pas de coût Gemini. La mesure réelle reste à faire au jeu en ligne (G5) : on relève `usageMetadata` et le montant passé par
`brewerBudget`, et on l'écrit dans `journal-gemini.md`.

**G1 Périmètre : échoue tel qu'il est écrit, et la cause est avant le port.**
`git diff --stat main -- functions/src` donne 46 fichiers. `main` (1df56fa2e, 04.10) est très en retard sur la branche.
- `dispatchBrewerHopAdviceV1` vit dans `functions/src/brewerHopAdviceJobsV1.ts`, qui a **déjà 79 lignes de différence** avec `main`
  (commit 4add7b51f, bien avant le carnet). Le fichier `brewerHopAdviceTransportV1.ts`, qu'il importe, en a aussi.
- `notifyBrewerHopAdviceAnswerV1` vit dans `functions/src/brewerNotifications.ts` : aucune différence.
- Un `firebase deploy --only functions` complet met à jour toutes les fonctions du code, puisque la source a changé. Les deux
  fonctions exclues seraient donc nommées en « update ».
- **Il faut prendre la branche de repli de l'ordre 5 :** `--only functions:aiTask`, puis l'hébergement (voir la décision 1).
- Les points « found N files » et le hash d'`index-*.js` ne sont pas vérifiables sans déploiement.

**G4, G5, G6 : non faits.** Il n'y a ni version en ligne du carnet, ni accord pour moi. Ces critères attendent le pilote et
l'exécutant (voir la demande plus bas).

Essais utilisés : G3, 1 essai (vert du premier coup). G2, 1 essai.

## Constats pour le pilote (hors de mon périmètre)

1. **Routage du modèle.** L'accord dit « `rangerCarnet` en Flash-Lite, comme `rangerNote` ». Or dans le code, `rangerNote` n'est pas
   dans `LITE_ROUTES` (`functions/src/models.ts:71`). `geminiAttempts` l'envoie donc sur **3.8 Flash**, environ 4 fois plus cher.
   `rangerCarnet` fera de même, sauf si on l'ajoute à `LITE_ROUTES`. Ce fichier n'est dans le « Possède » d'aucun lot.
2. **Pas de `.env` dans le worktree port-carnet** (seulement `.env.example`). Sans lui, `build-rules.mjs` s'arrête, et le build de
   production n'a pas la configuration Firebase. Le build et le déploiement se font donc depuis un dossier qui a le `.env` (L17 : un
   dossier que nul autre n'écrit), ou après y avoir copié ce `.env` sans le lire.
3. **Ce qui part avec l'hébergement.** L'hébergement construit depuis `claude/port-carnet-1711` emporte tout ce qui est sur la branche
   (port du calendrier compris), pas seulement le carnet. Même chose pour `aiTask` : il emporte toutes les modifications de
   `functions/src` faites depuis le dernier déploiement (prompts, ai.ts…).

DÉCISION À PRENDRE (1) : comment déployer les fonctions alors que le fichier de `dispatchBrewerHopAdviceV1` diffère déjà de `main` ?
- Option A : `npm run deploy` complet. Il redéploie les deux fonctions exclues, ce que l'accord interdit.
- Option B : `firebase deploy --only functions:aiTask`, puis l'hébergement. Les règles ne sont pas redéployées, puisque G3 prouve
  qu'aucune règle n'est nécessaire.
- Option C : réécrire G1 contre la version en production plutôt que contre `main`.
- Recommandation : **B**, et lire G1 comme « la sortie du déploiement ne nomme que `aiTask` ». Le pilote décide.

DÉCISION À PRENDRE (2) : sur quel modèle tourne `rangerCarnet` ?
- Option A : 3.8, sans toucher au code, environ 0,6 à 1 centime par message.
- Option B : ajouter `rangerCarnet` à `LITE_ROUTES`, ce qui demande une voie qui possède `models.ts`, avec un test de routage. On
  revient à environ 0,2 centime, conformément à l'accord.
- Recommandation : **B**, puisque l'accord est écrit sur Flash-Lite. Le pilote décide (petit coût dans les deux cas).

## DEMANDE EXECUTANT

À lancer seulement quand les lots A à D sont rendus OK et leurs critères rejoués. Les étapes 1 à 3 reviennent au pilote, à cause des
gestes externes. Les étapes 4 à 6 vont à l'exécutant Haiku. `<P>` désigne le dossier de build qui a le `.env`.

1. Contrôles avant le build (pilote, depuis `<P>`) :
   - `node scripts/check-carnets-emulator.mjs` → `REGLES CARNET OK 16/16`.
   - `node <mission>/voies/G/cout-estime.mjs`, après y avoir remplacé les 4 phrases par celles de `src/domain/carnets/fixture.ts` →
     les chiffres vont dans ce fichier, sous G2.
   - Relire le tarif de Flash-Lite sur https://ai.google.dev/gemini-api/docs/pricing, et noter la date.
   - `git diff --stat main -- functions/src/brewerNotifications.ts` → vide.
2. Build de production (PowerShell, depuis `<P>`) :
   ```
   $env:VITE_CARNET_IA='production'; Remove-Item Env:VITE_CARNET_AIDES -ErrorAction SilentlyContinue; npm run build
   ```
   Contrôles sur le paquet :
   - `grep -c "VITE_CARNET_AIDES" dist/assets/*.js` → 0 partout ;
   - `grep -c "preview=carnets\|CarnetsPreview" dist/assets/*.js` → 0 ;
   - `node scripts/check-build-flags.mjs` → vert ;
   - noter `ls dist/assets/index-*.js` (le hash) et `find dist -type f | wc -l` (le nombre N).
3. Déploiement (pilote, option B) :
   ```
   npx firebase deploy --only functions:aiTask --non-interactive 2>&1 | tee <mission>/voies/G/deploy-functions.log
   node scripts/garder-morceaux.mjs dist
   npx firebase deploy --only hosting --non-interactive 2>&1 | tee <mission>/voies/G/deploy-hosting.log
   ```
   Sorties attendues :
   - `grep -i "HopAdvice" deploy-functions.log` → vide ;
   - `grep -i "aiTask" deploy-functions.log` → « Successful update » ;
   - `grep "found" deploy-hosting.log` → `found N files`, avec le N de l'étape 2 (augmenté des morceaux gardés : à vérifier) ;
   - `curl -s https://brasserie-l-affinee.web.app/ | grep -o 'index-[A-Za-z0-9_-]*\.js'` → le même hash que `dist/`.
4. G4, lecture seule (exécutant, Chrome, adresse de production, compte du brasseur déjà connecté) :
   - aller de Stocks › Matériel › Carnets depuis le menu, à 390 tactile en défilant et à 1280, en thème clair puis sombre ;
   - lire la console : 0 erreur ;
   - n'écrire sur aucun carnet ni aucun plan existant.
   - Captures (8) : `voies/G/g4-<390|1280>-<clair|sombre>-<liste|carnet>.png`.
5. G5, actionneurs, sur « ZZ TEST — … » seulement. Les gestes, dans l'ordre :
   - créer « ZZ TEST — embouteillage » ;
   - ajouter un texte ;
   - ajouter 1 lien public, puis 1 autre (2 au plus) ;
   - ajouter une note en vrac ;
   - modifier une note, renommer une note, renommer l'idée ;
   - comparer ;
   - choisir, avec son pourquoi ;
   - envoyer dans À venir ;
   - Suppression v2 : détacher, puis supprimer ;
   - Annuler après un geste.
   Règles du jeu :
   - au plus 8 messages envoyés à l'IA ;
   - pour chaque appel, une ligne dans `journal-gemini.md` (heure, tâche, durée, jetons d'entrée et de sortie, modèle, coût) ;
   - une capture par geste : `voies/G/g5-<nn>-<geste>.png`.
   Ensuite :
   - retirer chaque « ZZ TEST — … » (idées, messages, plan d'À venir) ;
   - chercher « ZZ TEST » dans l'app → 0 résultat, capture `g5-fin-recherche.png`.
6. G6 : ouvrir chaque capture à côté de celle du banc (lot D, V) ; puis critique et pilote : « combien et quels problèmes ? ». Chaque
   constat va dans `work/missions/BUGS.md`. Les captures à ouvrir sont toutes celles de G4 et G5.

CONNAISSANCE : `rangerNote` ne passe pas par Flash-Lite : il n'est pas dans `LITE_ROUTES`, donc `geminiAttempts` le sert sur 3.8. La
table des tarifs de `geminiCosts.ts` est périmée depuis le 09.10 (`pricing: 'expired'`). Les règles en place couvrent déjà le carnet
(G3 : 16/16).
LEÇON PROPOSÉE : un critère de périmètre qui compare à `main` doit d'abord être joué sur la base de la branche avant le lot. Ici, G1
échouait avant le premier fichier du port, parce que `main` a 6 semaines de retard. Il vaut mieux comparer à ce qui est en production,
ou à la base du lot.
