# Conseil : l'architecture d'intégration de l'outil houblons dans l'app, fluide avec beaucoup de données

## Question cadrée

Le brasseur ouvre l'intégration (24.10, nuit). L'outil houblons de la maquette jouable (`prototypes/houblons-v4/parcours/`,
React/TS, moteur v4) doit entrer dans l'app (`src/` : React, TypeScript, Vite, Firestore avec cache IndexedDB, Dexie). Il
remplace l'atelier V5.5 à l'étape Houblons. Il doit rester fluide quand les données grandissent. Quelle architecture adopter,
et dans quel ordre la poser ? Cinq décisions, chacune avec ses options connues :

1. **Hôte et persistance.** L'étape Houblons de ses maquettes choisies est l'étape 3 du `BrewWizard`. Elle travaille sur un
   brouillon (`build()`, `setHops`), déjà écrit en local à chaque changement (`writeRecipeDraft`, relu à l'ouverture) : il
   survit à un démontage du wizard. Restent la clé gardée à la sortie d'un outil, le retour à la bonne étape et l'écriture des
   changements de l'outil dans ce brouillon. Les outils (Suggérer, Comparer, Dryhopper, Levure, Substituer, la fiche)
   s'ouvrent en plein écran et s'enchaînent sur quatre niveaux. Options :
   - (a) une route plein écran par outil, le brouillon remonté dans un état partagé au-dessus des vues ;
   - (b) les outils en couches par-dessus le wizard monté, sans quitter sa vue ;
   - (c) un brouillon persistant (Dexie) que chaque outil lit et écrit.
   S'y ajoute `RecipePage` (recette enregistrée), qui ouvre aussi l'outil.
2. **Calcul.** Le moteur tourne aujourd'hui sur le fil principal, avec des singletons de données et des caches sans borne.
   Options :
   - (a) tout le moteur dans un Web Worker (précédent : `src/ui/hopIndex/hopSolver.worker.ts`) ;
   - (b) seulement les calculs lourds dans un worker (`proposer`, `suggerer`, `remplacants`, préchauffage), et `lireBiere`, qui
     prend de 0,3 à 7 ms, sur le fil principal ;
   - (c) tout sur le fil principal, avec `useDeferredValue` et découpage du travail.
   S'y ajoutent : une fabrique sans singleton, des caches bornés, et `substitutes` réécrit pour ne calculer que les 8 rendus.
3. **Données et hors ligne.** Il y a deux catalogues : Beer Maverick (318 variétés, moteur) et l'index de l'app (≈ 136). La
   production n'a que 12 variétés (#120). Les JSON pèsent de 0,5 à 2 Mo bruts. L'app n'a aucun service worker de code : le hors
   ligne vient du cache Firestore, et un chunk chargé à la demande manque hors ligne s'il n'a jamais été chargé. 27 écoutes
   Firestore s'ouvrent au démarrage, sur tous les écrans. Options :
   - (a) un catalogue unique réduit, en JSON découpé et chargé à la demande, avec préchargement des chunks d'outils au premier
     lancement en ligne ;
   - (b) le catalogue dans Dexie, indexé, avec des lectures partielles ;
   - (c) un service worker qui met le code et les données en cache.
   Et dans tous les cas : des écoutes Firestore par écran.
4. **Coexistence avec V5.5.** Options :
   - (a) un drapeau : V5.5 reste jusqu'à la bascule, puis il est retiré sur son accord ;
   - (b) V5.5 est gardé derrière un bouton ;
   - (c) V5.5 est remplacé d'un coup.
   Dans tous les cas, `hopV55Applications` et `hopV55ColdEvidenceAssociations` doivent survivre dans les recettes.
5. **Ordre et premier geste.** L'état des lieux propose 18 tâches (T1 à T18). Lesquelles d'abord, et quel est le premier
   geste ? Faut-il un jeu « beaucoup de données » et un contrôle bloquant avant le premier écran porté ? Comment les contrôles de
   ses choix (71 scripts, qui lisent tous `<dossier>/<route>/etat.html`) vérifieront-ils l'app (mode `--url`) ?

### Contexte chiffré

Source : `ETAT-DES-LIEUX.md`, voie i0, mesures faites sur un PC rapide ; un téléphone sera plus lent.

**Poids**
- Le démarrage de l'app pèse 918 ko gzip, pour un budget de 350.
- L'étape Houblons ajoute 772 ko gzip, pour un budget de 150 ; l'atelier V5.5 à lui seul fait 479 ko gzip.
- La maquette tient en un seul fichier JS de 403 ko gzip, dont 45 % de JSON.

**Moteur à ×1 (318 houblons)**
- Un ajout se simule en 0,05 à 0,9 ms, et en 4,4 ms au premier appel.
- `lireBiere` : 3,6 ms à froid, 0,27 ms ensuite.
- `suggerer` : 17 ms à froid, 3,9 ms par cran de dose.
- `substitutes` : 92 ms à froid, 2,1 ms à chaud.
- Le classement de tout le catalogue prend 478 ms en léger et 1 188 ms en complet.

**Moteur à ×10 (3 180 houblons, stock ×10)**
- `substitutes` : 1 522 ms à froid. Le recouvrement stock × catalogue est en O(n²).
- `suggerer` : 132 ms par cran de dose, soit environ 530 ms sous processeur ×4.
- Le classement complet prend 19,5 s.
- `houblon()` sur tout le catalogue prend 4,5 s.
- Un geste sur une recette ne dépend pas de la taille du catalogue.

**Mesures dans le navigateur (maquette, 23.10, ×4)**
- Toucher de Ma bière vers Suggérer : 782 ms, pour un budget de 100.
- Chargement : 565 à 1 348 ms.

**Risques relevés** (détail dans le document)
- R1 : un houblon inconnu du moteur fait planter Ma bière (2 tests rouges).
- R2 : les tests du moteur sont hors de `npm test`.
- R4 : le hors ligne des chunks n'est pas assuré.
- R6 : le brouillon du wizard est persisté en local, mais son passage par un outil plein écran n'est pas vérifié.
- R7 : l'historique V5.5 risque de se perdre dans la recette.
- R8 : aucun contrôle de ses choix ne lit l'app.
- R9 : catalogue de production de 12 variétés.

### Enjeu

Si l'architecture est fausse, tout le portage des huit écrans est à refaire, la fluidité se perd quand les données grandissent,
ou des données sont perdues : le brouillon du wizard, l'historique V5.5, le hors ligne.

### Contraintes

- Hors ligne et données préservés. Aucune donnée réelle pour tester.
- Téléphone. Budgets fixés :
  - réponse à un toucher : 100 ms au plus ;
  - image d'un glisser : 16 ms en médiane, 33 ms au 95e centile ;
  - écran : 2,5 s à froid au plus ;
  - processeur ×4 ;
  - sortie du rail : 50 ms au plus.
- Règle n° 1 : ses maquettes choisies restent la base, rien ne se simplifie au portage.
- Fini veut dire branché, atteint par un vrai parcours dans Chrome, typé, testé, build vert.
- Rien n'est supprimé sans son accord. Gemini n'est jamais appelé dans les tests.
- Le quota d'agents est limité.

## Ses mots, mot pour mot

Source : `work/refonte-frontend/v4/SPEC-BRASSEUR.md` et les issues citées.

- 24.10, nuit : « Tu peux commencer la mise en place pour l'intégration dans la vrai application. Faire une liste des tâche,
  mettre à jour git et suivre tout ça. Jusqu'à l'intégration. La fluidité, l'optimisation de code est très importante vu qu'il
  y aura beaucoup de données !! »
- 23.10 (#143) : « Vérifie que pour la mise en place, ce soit aussi facile » ; « La vraie intégration » ; « Bien mettre en place
  l'architecture de base avant d'implemnter ».
- 17.10 (#121) : « l'app est devenu très lente... Beaucoup d'info sont chargés pour rien... » ; 13.09 : « Vérifie que les
  écrans qui du coup charge ces données les charges intelligemment et que ça prenne pas plus que quelques secondes ».
- 24.10, soir (D138, #148) : « c'est pas ultra réactif, ça lag un peu certaines actions ont du délais... » ; (D139, #149)
  : « un choix sur un endroit, semble pas toujours être reporté partout ».
- Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. »

## Sources (n'ouvrir que pour vérifier un point précis)

- `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` — l'état des lieux mesuré : classement, écarts B1 à B9,
  mesures, beaucoup de données, risques R1 à R10, découpage T1 à T18. **À lire en entier** (sauf le Regard neuf).
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` — la carte de la maquette vers l'app (voie p8).
- `work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md` — les mesures navigateur du 23.10.
- `work/refonte-frontend/v4/choix/ecrans.json` — ses choix, écran par écran.
- `src/pages/useFullScreenRoute.ts`, `src/pages/BrewWizard.tsx` (lignes 398-406, 1410-1420, 2705-2720),
  `src/services/firestoreRepo.ts` (ligne 520), `src/ui/hopIndex/hopSolver.worker.ts`.
