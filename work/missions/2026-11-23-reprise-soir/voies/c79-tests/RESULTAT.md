TESTS ROUGES 32 rouges / 32 total (hash au commit : voir la réponse)

# RESULTAT c79-tests : les tests rouges de R110 à R112 sur les vrais documents des 12 carnets ZZ (25.11)

## Fait
- `tests/unit/c79Regles.test.tsx` : 32 tests, tous ROUGES sur le code actuel (`tests-rouge.log` : « 32 failed (32) »). Aucun fichier de `src/` ni de `functions/` modifié par la voie (`UpgradeWorkspace.tsx` était déjà modifié avant ; `src/fermenter`, `src/finance`, `src/stock` : autres sessions).
- Données : les 12 fichiers `tests/fixtures/c79/*.json` chargés TELS QUELS dans le magasin et montés par `CarnetsVue` (geste réel : taper, toucher « À faire », ouvrir l'onglet « À faire », ouvrir ⋯). Aucun réseau, aucun Gemini.
- Les cas SIMULÉS sont dits dans le fichier : (1) la proposition de l'IA rejouée (forme de `propositionsSuivi`, texte et date que la tâche écrite porte : 30.11 « mois », 23.11 « semaine ») ; (2) « Chambre froide » réduit à la note que dit le message du frigo (EXA-2) ; (3) la phrase « la semaine du 14 déc. » (variante de la phrase réelle d'EXA-11) ; (4) le carnet de malt d'ancien format (EXA-3) vient de `tests/fixtures/c75/zz-malt-pilsner.json` (document réel d'avant le tour 78).

## Critère par critère : ce que l'écran montre au rouge
- R110 (EXA-11, EXA-9), assurance, cave, soufre, chacun 3 tests (9) + « semaine du 14 déc. » (1) :
  - la carte « tâche proposée » ne dit aucune date : elle ajoute « tâche proposée · À faire · Plus tard » au texte de la tâche ;
  - après « À faire », la ligne de la liste est rangée sous « fin-du-mois » (assurance, cave, 14 déc.) ou « cette-semaine » (soufre) et sa sous-ligne ne dit que « ZZ TEST — <carnet> » ;
  - la donnée déjà écrite (30.11 « mois », 23.11 « semaine ») s'affiche de la même façon : aucune date, ni « date à revoir ».
- R111 EXA-6 (5 carnets) : co2 1 bulle, écoulement 2, fête 3, soufre et frigo sans ⋯ (« expected [ … ] to deeply equal [] »).
- R111 EXA-2 : la bulle « Fûts déplacés… » du frigo n'a pas de ⋯ ; le test continue (Supprimer, puis la note de Chambre froide encore là ou dite) dès que le ⋯ existe.
- R111 EXA-4 : aucune carte « Reclasser ce carnet ? » sur la levure (texte de l'écran cité).
- R111 EXA-5 (co2, vapeur, levure) : hors du fil, l'écran nomme l'option par toute sa phrase (« Pistes : joint du couvercle… », « Plutôt un steam condenser sur la cuve : … », « Pistes : levure sèche… »).
- R111 EXA-7 : picto « frigo » au lieu de « sachet » ; la carte Résolu ne dit pas « Monté à 19 °C… ».
- R111 EXA-10 : « Tes notes ne le disent pas » sur co2, vapeur, malt ; question encore posée sur un carnet Résolu (malt) ; la relecture « Résolus en 2026 » dit « pourquoi : tes notes ne le disent pas ».
- R112 EXA-3 : la carte Reclasser du malt ancien dit l'article → piste et « à acheter → fait », ni « Problème », ni « Résolu », ni la tâche « Brassin du 3 déc. à décaler » (3 tests).
- R112 EXA-8 : rejoué avec le magasin en mémoire (écritures simulées) : après « Ajouter » sous « Déjà un carnet proche », le champ de la liste garde « ZZ TEST — ranger la cave » (brouillon `laffinee.carnet.brouillon:` resté) ; le carnet du soufre montre « va atterrir ici · tiré de votre phrase · Notes : ZZ TEST — ranger la cave » (2 tests).
- Total : R110 10 ; R111 EXA-6 5, EXA-2 1, EXA-4 1, EXA-5 3, EXA-7 2, EXA-10 5 (17) ; R112 EXA-3 3, EXA-8 2 (5) : 32. EXA-1 est sans objet (voir ci-dessous).

## Faux verts expliqués (en tête du fichier, aussi)
1. Les tests de c70, c71 et c73 mettaient le mois en toutes lettres (« avant le 12 décembre », « la semaine du 14 décembre ») : `tacheDatee` ne lit pas « déc. », ni un jour sans marqueur (« le samedi 6 déc. au matin »), ni « dans 2 semaines ». Les phrases du brasseur disent « déc. ».
2. Leur proposition de l'IA disait la même date que la phrase ; en vrai l'IA propose la semaine ou le mois en cours (30.11 « mois », 23.11 « semaine »), et `accepterPropositionSuivi` la garde faute de lire la phrase.
3. Leur liste « À faire » lisait une tâche construite à la main ; la chaîne proposition → « À faire » → donnée → liste n'était pas jouée.
4. La ligne de la liste ne dit sa date que sous « Un jour » (`quandDite`) : « Fin du mois » et « Cette semaine » restent muets.
5. Piège de mon premier jet, corrigé : la date de la phrase est AUSSI dans le texte de la tâche (« … avant le 31 décembre », « … le samedi 6 déc. au matin »). Quatre tests passaient vert pour cette seule raison. Les tests retirent désormais le texte de la tâche (la carte sans son `<p>`, la ligne sans `.af-texte`) et lisent ce que l'écran AJOUTE.

## Sans objet
- EXA-1 : « Modifier » à y −1 et « Changer en façon » à y 51 sous la barre : une position en pixels dans la page à 390 px (`.cn-feuille-ancre` : `position:absolute; top:-10px`, `useEntiere` ne corrige que le bas). jsdom ne mesure aucune boîte et n'applique pas le CSS de l'app : un test passerait ou échouerait quelle que soit la position. À voir en ligne (390 px, `elementFromPoint` sur chaque geste de la feuille). Dit en bas du fichier de test.
- Le `.skip` du cas R4 avec critère de `c48Regles.test.tsx` : laissé tel quel (rien à lever dans cette voie).
- `zz-inspection-electrique-fusible` (un article, aucun critère) et `zz-pompe-qui-chauffe` (référence : son « Fermé : … ») ne sont cités par aucun test : le relevé les a rendus propres, aucune règle R110 à R112 ne les vise.

## Doutes et limites
- EXA-9 sur le soufre repose sur la phrase réelle mêlée du 25.11 (« ZZ TÀ sentir à nouveau dans 2 semaines, avant la mise en fût.EST — ranger la cave ») : le doute « phrase mêlée » de BUGS.md n'est pas levé, il vaut pour ces 3 tests. Écrit le 25.11, « dans 2 semaines » = le 9 déc. : le test accepte « 9 déc. » ou « 7 déc. » (sa semaine).
- Les dates attendues sont des formes larges (« 31 déc. » ou « 28 déc. », « 6 déc. » ou « sem. du 30 nov. ») : une correction qui dit la semaine ou le jour passe ; une ligne muette échoue. Pour la cave, le groupe « Cette semaine » seul est refusé : le 6 déc. 2026 est un dimanche, sa semaine commence le 30.11, et « Fin du mois » reste admis ici (R84 le refuserait : à décider par le correcteur, le test ne tranche pas).
- Le test EXA-2 est rouge d'abord par EXA-6 (pas de ⋯) ; son vrai critère (la note de Chambre froide survit à Supprimer, ou l'écran le dit) ne se joue qu'une fois le ⋯ posé.
- Chaque test rouge est rouge pour sa cause : j'ai lu le message de chaque échec (cités plus haut) ; aucun n'est rouge par une erreur de montage.
- Commande : `npx vitest run tests/unit/c79Regles* --reporter=dot > voies/c79-tests/tests-rouge.log` (la sortie contient les codes couleur de vitest).

## Essais
1 essai pour la plupart ; R110 : 2 (le faux vert n° 5 trouvé à la 1re lecture du rouge). Un fichier de mise au point (`c79Debug.test.tsx`) a servi à rejouer EXA-8 puis a été supprimé.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la date d'une tâche (« le 6 déc. », « avant le 31 déc. ») est à la fois dans son texte ET dans sa phrase : un test qui lit la ligne entière passe vert sans que la date soit dite à part (faux vert vu à l'écriture de c79-tests).
LEÇON PROPOSÉE : un test de l'affichage d'une valeur que le texte porte déjà (date, montant, nom) retire le texte avant de lire ce que l'écran ajoute ; sinon il passe vert sur la donnée brute.
