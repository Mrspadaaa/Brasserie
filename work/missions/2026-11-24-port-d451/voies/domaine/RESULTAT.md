OK — Domaine du suivi : passe-plat (81072809e), types, lecteurs, intentions annulables, projections, fixture (402d1a8a9).

## Commits
- Passe-plat seul, à mettre en ligne d'abord : `81072809e` « D451 domaine : passe-plat » (modele.ts + tests/unit/carnetsSuiviPassePlat.test.ts).
- Suivi : `402d1a8a9` « D451 domaine : modèle du suivi, lecteurs, intentions et projections ».
- Ce RESULTAT.md et les journaux (tests.log, tsc-*.log) restent dans le dossier de voie, non commités.

## Fichiers écrits
modele.ts, operations.ts, fixture.ts (modifiés) ; neufs : src/domain/carnets/{suivi,fil,taches,arbre}.ts ; tests/unit/{carnetsSuiviPassePlat,carnetsSuivi,carnetsSuiviProjections}.test.ts. Aucun autre fichier. Aucune assertion d'un test existant modifiée.

## Plan tenu (PLAN § Interfaces → fichier → test)
- Types et lecteurs tolérants (GenreCarnet, CategoriePosee, EtatSuivi, EvenementSuivi, SuiviCarnet, SuiviFacon, Tache, Etiquette, Rattache, PropositionSuivi ; `inconnues`, `ajouterEvenement`) : modele.ts ; carnetsSuiviPassePlat, carnetsSuiviProjections (lecteurs tolérants).
- `suiviDe`, `etatDe`, `genreDe`, `categorieDe`, `etatOption`, `suiviFacon`, `foisEcartee`, `optionRetenue`, `dureeDe`, `avantApresDe`, `pourquoiDe` ; intentions `changerEtat`, `rouvrir`, `changerOption`, `retenirOption`, `fermerParAchat`, `resoudre`, `poserVeille`, `repondreRelu`, `poserAvantApres`, `poserGenre`, `etiqueter`, `retirerEtiquette` : suivi.ts ; carnetsSuivi + Projections.
- `ajouterTache`, `cocherTache`, `poserEcheance`, `aFaireDe`, `tachesDe`, `notePlanningDe` : taches.ts.
- `arbreDe`, `coupDOeil`, `poserCategorie`, `rapprocherChemin`, `distanceEdition` : arbre.ts.
- `filDe(c, messages)`, `accepterPropositionSuivi`, `refuserPropositionSuivi` : fil.ts. (`filDe` existe aussi dans modele.ts avec une autre signature, `(items, carnetId, carnets)` : un fichier qui importe les deux doit en renommer un.)
- Fixture : `fixtureSuivi()`, `IDS_SUIVI`, `OPTIONS_VAPEUR`, `OPTIONS_MALT`, `MAINTENANT_SUIVI`, `ANNEE_SUIVI` (fixture.ts).

## Critères (sorties décisives)
- tsc racine : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register). tsc functions/ : sortie 0, aucune erreur.
- Tests : carnetsSuivi*.test.ts : 3 fichiers, 110 tests verts (passe-plat 6, suivi, projections). carnets*, c48 à c64Regles, planning-vers-carnet, lot11Carnet, lot3CarnetOuvert, port-q4-carnet : 65 fichiers, 1519 tests verts, 3 ignorés (déjà ignorés).
- `npm run build` : non rejoué (échoue sur les 2 erreurs connues hors de ma voie, consigne du pilote : la porte est tsc).
- `git status --short` : rien hors Possède (les fichiers non commités de src/domain/stock, src/ui/stock et le reste sont ceux d'avant, non touchés). Deux commits par chemins.
- Essais : aucun critère n'a demandé plus d'un correctif (un tsc corrigé, 4 attentes de test corrigées : tri des tâches à échéance égale, Planning rangé dans Meuble, plusieurs formes de 2e citation, pluriel « Eaux » → « Eau »).

## Règles du DOSSIER → tests
1 passe-plat : carnetsSuiviPassePlat (carnet, critère, façon, article, valeur, veille, note, photo, message, effet, titre proposé, proposition) et carnetsSuivi « règle 1 » (suivi, événement, option, tâche, étiquette) ; 2 dérivation sans suivi, lecture sans écriture ; 3 les 16 couples d'état + Rouvrir ; 4 les 16 couples d'option, une seule retenue, « écartée 2e fois » (2 dans la fixture, 3 après un nouvel écart), option née avant le suivi ; 5 fermerParAchat (inverse identique, document pour document) ; 6 veille (IA refusée, sans article, avec article, pas de releveLe) ; 7 à 12 : carnetsSuiviProjections ; 13 plafonds : 207 changements d'état → 200 événements au plus, somme des `fusionnes` = 207 ; 13e photo refusée. Plus : aucune valeur `undefined` dans les écritures (Firestore les refuse), cartes OK · Non.

## Choix faits (à relire)
1. **`propositionsSuivi`, champ voisin de `propositions`** (PLAN disait « étendu ») : `pucesDuCarnet` (src/ui/carnets/lignesRegles.ts, hors de ma voie) lit `propositions` comme des critères avec `.texte` ; y mêler des tâches aurait cassé le typage ou montré une tâche comme un critère. V2 (ia) écrit `propositionsSuivi`, `etiquettes`, `rattache` via `MessageARanger` (champs facultatifs, `ranger` les garde sur le message, refuse une citation qui n'est pas dans le texte).
2. **Cartes OK · Non** : `accepterPropositionSuivi` applique tâche, dater, retenir, résoudre (avec option : fermé par l'achat), veiller (de lui), retire la carte, une seule écriture annulable. `deplacer` (« Rattacher à … ? ») n'est pas appliqué ici : déplacer des lignes d'un carnet à l'autre appartient au rangement (refus explicite).
3. **13e photo** : le PLAN disait « règle existante » ; elle n'existait que pour les photos d'un article. Ajoutée dans `ranger` (`PHOTOS_CARNET_MAX` = 12, refus « Ce carnet garde 12 photos au plus. »). L'écran (V4) doit afficher ce refus.
4. **Échéance** : toujours un lundi ; précision « mois » = le lundi de la dernière semaine du mois (le mois se relit). Groupes de `aFaireDe` : cette-semaine, fin-du-mois, **plus-loin** (ajouté : sans lui, une tâche datée de janvier n'aurait aucun groupe), un-jour. Une note du Planning est une tâche dérivée à son début (`du`), jamais écrite, jamais cochée ici.
5. **`facon.etat` prime** sur `facon.suivi.etat` pour retenue/écartée (un vieux client ou `choisir` le change seul) ; la veille vit dans `suivi`. `archive` prime sur `suivi.etat` (état résolu) ; `rouvrir` ou changer d'état depuis Résolu lève l'archive.
6. **`choisir`** (comparatif, operations.ts) fait passer un carnet déjà suivi de note/cherche à Décidé avec un événement ; un carnet sans suivi reste dérivé.
7. **Historique d'option née avant le suivi** : l'état d'avant est gardé sans `le` (date inconnue, jamais inventée) pour que « 2e fois » compte juste.
8. **Rapprochement des chemins** : Levenshtein à la main (Wagner–Fischer, dix lignes, la définition ; `fuse.js` classe, il ne fixe pas un seuil de fautes), seuil 2 fautes et au plus le quart du mot (« vis » ne devient pas « via »).
9. **`pourquoiDe`** : deux citations au plus, dans l'ordre du temps ; priorité : « pourquoi » du choix posé (ADR, ses mots), retenu, pourquoi, achat, veille. Étiquette sans phrase : première phrase du message (sous-chaîne exacte). Aucune : `null`.
10. **`avantApresDe(c, messages)`** prend les messages (la date d'une photo est celle de son message) ; sans eux, pas d'« après ». Une photo sans date n'est jamais « après ».
11. **Genre ou catégorie posés par lui** ne se laissent pas écraser par l'IA (refus), comme le domaine.
12. **Lecture sans écriture** : un événement de sorte inconnue (version future) est écarté à la lecture ; c'est la limite du passe-plat (il garde les clés, pas les éléments de liste illisibles).

## Doutes et limites
- Un carnet du Planning « Rangement et étagères inox » est rangé par `domaineDe` dans Meuble (règle D437 existante) ; la fixture le montre.
- Fuseaux : les jours du fil se calculent à l'heure locale ; les tests utilisent midi UTC.
- `suivi` écrit au premier geste figé l'état d'alors : un article ajouté ensuite par les anciens gestes ne fait plus passer seul « noté » à « je cherche ». V3/V4 : la barre d'état et l'IA proposent le changement.
- Rien n'a été vu à l'écran : voie sans écran (aucune capture requise).

CONNAISSANCE : une clé inconnue qu'un client sans passe-plat réécrit est perdue ; le passe-plat (`inconnues(brut, connues)` dans modele.ts) doit partir en ligne et se recharger sur tous les appareils avant tout champ neuf du suivi (PLAN § Risques 1). À verser au cerveau par le pilote.
LEÇON PROPOSÉE : aucune
