TESTS ROUGES 22 rouges / 32 au total — R81 (C70-1) et R82 (C70-2, 4, 5, 6, 7, 8, 9, 10) et R83 (C70-3, part de l'app) ont chacun au moins un test rouge ; aucun fichier de src/ ni functions/ modifié

# RESULTAT c70-tests

## Fichiers écrits
- `tests/unit/c70Regles.test.tsx` (32 tests). Un seul fichier ; `tests/fixtures/c70/` : aucune fixture de plus (carnet de houblons = `tests/fixtures/c67b/pellets.ts` `pelletsTrois()` moins Hopfenmarkt ; réponse réelle = `tests/fixtures/c68/rangement-1.json`).
- `work/missions/2026-11-23-reprise-soir/voies/c70-tests/tests-rouge.log` (sortie `--reporter=dot`) et ce RESULTAT.md.
- `.skip` du cas R4 de `c48Regles.test.tsx` : non touché (déjà justifié « CADUC c56-tests », R30).
- `tsc --noEmit -p .` : aucune erreur dans c70Regles.test.tsx. `git status` : seul mon fichier de test et mon dossier de voie sont à moi.

## Sortie décisive
`npx vitest run tests/unit/c70Regles* --reporter=dot` : `Tests 22 failed | 10 passed (32)`.

## Rouges par règle (et la cause, lue dans le log)
- **R81 · C70-1 (B)** — le chemin exact, joué par `CarnetsVue` monté, 3 parcours : depuis COMPARER, depuis la fiche (feuille Articles), depuis la carte du carnet.
  - Depuis Comparer : 5 rouges. Le bouton dit bien « Choisir · MotlerHops, 1 kg » (vert), mais l'écran Choisir dit « 50 g · 73,80 CHF/kg … ≈4 CHF » et « Part dans À venir : ≈4 CHF » ; le choix écrit n'a ni quantité ni prix (`{articleId, pourquoi…}`) ; le plan À venir a `amountCents: 0`, `budgetKnown: false` (« à estimer ») et pas de quantité ; l'écran Choisi redit « ≈4 CHF ». Cause : `Comparer.tsx` appelle `onChoisir(premier?.articleId)` sans la quantité, `ecransCarnet.tsx` ne la porte donc pas (r54 ne couvrait que la fiche).
  - Depuis la fiche et depuis la carte : le choix, le plan et l'écran Choisi sont justes (1 kg, ≈40, 4 tests verts : garde-fous). Rouges (2 par parcours) : l'écran Choisir et « Part dans À venir » disent « 40 CHF » sans « ≈ », alors que le prix en euros converti avec la TVA d'import est une estimation (la règle dit ≈40 CHF partout). Écart mineur, à trancher si le pilote juge « ≈ » trop strict pour ces deux parcours.
- **R82**
  - C70-2 (1 rouge) : depuis Comparer, les bornes du curseur sont « 68 » et « 80 » alors que l'écran montre 73,80 et 80 (68 = le prix sans TVA d'import) ; la même chose du côté du kilo (≈40) disparaît avec la quantité. Un test depuis la fiche aurait été rouge pour la mauvaise raison (R54 retire la place « Prix » quand une quantité est cochée : pas de curseur) : non écrit.
  - C70-4 (3 rouges) : les 4 carnets sans catégorie (houblons, froid, frigo, embouteillage) sont repliés sous « Autres 4 », sans nom ; ni « Froid 2 » ni aucun sous-domaine ; un groupe replié ne dit le nom d'aucun carnet.
  - C70-5 (2 rouges) : une réponse IA simulée `tachePropose: {quand:'semaine'}` sur « avant le 12 décembre » donne une tâche du 23 nov. ; « en mai » avec `quand:'mois'` donne le 30 nov. (le test clique « À faire » dans la bulle « tâche proposée »).
  - C70-6 (1 rouge) : groupes « Cette semaine · Fin du mois · Plus loin · Un jour » ; la maquette n'a que les trois autres.
  - C70-7 (1 rouge) : la bulle « ailleurs ? » apparaît pour le ventilateur mural quand l'IA désigne le carnet « malt pilsner en rupture ».
  - C70-8 (1 rouge, 1 vert) : `sousDomaineParMots('un client du marché veut 20 bouteilles…')` = « Conditionnement » (mot « bouteilles »). Vert voulu : avec l'IA éteinte, le carnet créé n'a aucun chemin « Conditionnement » aujourd'hui (garde-fou pour le correctif).
  - C70-9 (1 rouge) : « Ses autres valeurs », feuilles de style réelles injectées : la valeur d'Arômes est en `cn-mono` (police à chasse fixe) ; Prix et Arômes ont `overflow-wrap: anywhere` (mot coupé au milieu).
  - C70-10 (1 rouge) : avec 5 résolus, le dernier (en vert) est la tuile 5 sur 5 d'une bande `overflow-x: auto` ; il n'est ni premier ni amené par `scrollIntoView` / `scrollLeft`.
- **R83 · C70-3, part de l'app (2 rouges)** — réponse réelle `rangement-1` (carnetId du voisin) + champs SIMULÉS `genreCarnet: probleme`, `chemin: [Brassage, Vapeur]`, `etatPropose: cherche`, `domaine: brasserie` : la carte dit « Brasserie · Rattacher à ce carnet ? » sans « nouveau problème · Je cherche » ni le chemin à 3 niveaux ; « Garder à part » crée un carnet dont le genre est vide (pas « problème »).

## Verts voulus (10)
3 × « le bouton dit la quantité » ; fiche et carte : choix écrit, plan À venir, écran Choisi justes (6) ; C70-8 : carnet créé hors Conditionnement (1).

## Essais utilisés
Un essai par bloc ; 3 corrections de test (C70-5 : la bulle propose « À faire » au lieu d'une feuille OK ; C70-2 : Comparer seulement ; C70-9 : critère sur les cellules à libellé) avant les rouges justes. Aucun critère épuisé.

## Doutes et limites
- jsdom ne mesure aucune boîte : C70-9 se juge aux feuilles réelles (famille de police, `overflow-wrap`), C70-10 à la structure (premier ou amené par scroll). Le rendu réel à 390 px reste à voir en ligne.
- Réponses de l'IA des phrases de ce tour (hotte, ventilateur, mariage) : INVENTÉES à la forme de `ia.ts` (aucun relevé réel dans le dépôt ; `critique-70/ia.txt` ne garde que les URL). Seule `rangement-1` est réelle. Marqué dans les tests.
- C70-4 : le test ne fige pas le NOM du sous-domaine (« Froid » de la maquette ou « Fermentation » du vocabulaire de l'app) ; il exige un groupe nommé, jamais « Autres », avec les noms de ses carnets.

## DÉCISION À PRENDRE : groupe « Plus loin » de À faire (C70-6)
La maquette v01-afaire n'a que « Cette semaine · Fin du mois · Un jour » ; l'app ajoute « Plus loin » pour les mois suivants (afaireRegles.ts : « que la maquette ne montre pas »). Options : (a) tout ce qui dépasse la semaine va sous « Fin du mois » (le test l'exige) ; (b) garder « Plus loin » seulement quand la tâche est à plus d'un mois, et l'écrire dans la maquette. Recommandation : (a), règle n° 1 (sa maquette). Si le pilote préfère (b), le test C70-6 est à réécrire.

## DEMANDE RELEVE (réponses réelles de l'IA manquantes : rien n'est inventé en production)
Pour que ces tests s'appuient sur du réel (voie c70-ia) : « ZZ TEST — c70 vapeur … » (genre, chemin, état rendus), « appeler le chaudronnier pour poser la hotte avant le 12 décembre » (`tachePropose`), le ventilateur mural (`carnetId` désigné), le client du mariage (domaine, chemin).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un test de mise en page jugé par jsdom sans feuille de style (C69-13) était vert alors que le défaut persistait ; le correctif suivant doit injecter les feuilles réelles et lire les propriétés calculées (police, overflow-wrap) : appliqué ici en C70-9.
