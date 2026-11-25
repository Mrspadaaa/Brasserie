TESTS ROUGES 29 rouges / 39 au total — R77, R78, R79, R80 chacune a des tests rouges ; aucun fichier de src/ ni functions/ modifié

# RESULTAT c69-tests

## Fichiers écrits
- `tests/unit/c69Regles.test.tsx` (39 tests, un bloc `describe` par règle : « R77 », « R77 bis », « R77 ter », « R78 », « R79 · C69-3 » à « R79 · C69-6 », « R80 · C69-7 » à « R80 · C69-13 »).
- `work/missions/2026-11-23-reprise-soir/voies/c69-tests/tests-rouge.log` (sortie `--reporter=dot`) et ce RESULTAT.md.
- Aucun fichier de `src/` ni `functions/` écrit (le `src/ui/finance/UpgradeWorkspace.tsx` modifié du `git status` est antérieur à la voie). `tests/fixtures/c69/` : dossier créé vide, aucune fixture de plus (les réponses réelles sont celles de `tests/fixtures/c68/`). `tsc --noEmit` : 0 erreur dans mon fichier.
- Le `.skip` du cas R4 de `c48Regles.test.tsx` n'est pas touché : il porte déjà sa justification (« CADUC (c56-tests) », réponse « Oui » à C50-5, règle R30 de c56Regles).

## Sortie décisive (npx vitest run tests/unit/c69Regles* --reporter=dot)
`Tests 29 failed | 10 passed (39)` ; un seul fichier. Rouges par règle (voir le log) :
- **R77 (C69-1, B)** — vraie réponse `rangement-1` (la phrase « vapeur », l'IA désigne le carnet existant `ZZ TEST — trop de vapeur au brassage`). Le test MONTE `CarnetsVue`, tape la phrase, joue `aiTask` avec la VRAIE réponse. Rouge : un carnet « ZZ TEST — c68 trop de vapeur pendant l'ébullition, ça coule sur les murs » (phrase entière en titre, sans genre ni catégorie) est créé AVANT tout geste, alors que la carte propose « Rattacher à ce carnet ? » (les deux à la fois : le bug du relevé en ligne, reproduit à l'identique) ; après « Rattacher », le carnet-phrase reste ; « Garder à part » donne le titre-phrase. 5 rouges. Verts voulus : requête jouée, carte posée, rien n'est écrit dans le carnet voisin avant le geste, et R77 ter (un problème neuf : fusible `rangement-2`, étiquettes `rangement-4` ; titre court, chemin Brassage › Électricité / Conditionnement › Étiquettes, genre problème : déjà juste, garde-fou).
- **R78 (C69-2, B)** — carnet « idée » avec une note rangée par un mémo (message qui reste dans le fil). Rouges : par le domaine (`supprimerNote` laisse la bulle dans `filDe`) ; par l'écriture, Firestore simulé (`magasinSur` + port `poser/retirer` : seul `poser:<carnet>` est écrit, le message reste, effet vers la note morte compris) ; par le composant (··· › Supprimer : la bulle `[data-message]` reste) ; composant + magasin ; « Note supprimée » ne dit pas vrai (bulle toujours là) ; rechargement (écran démonté, remonté sur les documents gardés) : la bulle revient. 6 rouges. Verts voulus (gardes) : les autres notes restent, Annuler rend la note et la bulle (composant et inverse d'écriture à l'identique).
- **R79 (C69-3 à 6)** — état du relevé après c68-fix (3 options, articles liés, jetons) : coût en tête vide après Retenir (`.cnp-total` = « ») et rien au Résolu ; jetons « 690 CHF » doublés (étiquette locale avec option + étiquette de l'IA sans option) ; condenseurs au picto « hotte » (le titre « vapeur » l'emporte sur le nom de l'option), sans prix ni « plus en stock » sur la tuile, et au Résolu ; ligne du résolu « Résolu · retenu · 200 CHF » sans nom de la retenue. 8 rouges. Vert voulu : « Piste : condenseur A, 690 CHF » tapé (IA simulée) donne un seul jeton (garde-fou : le doublon ne naît que de la double étiquette ci-dessus).
- **R80 (C69-7 à 13)** — 10 rouges :
  - C69-7 : les 5 anciens résolus sont des carnets ARCHIVÉS (`carnet.archive`, état « résolu » déduit) : le coup d'œil compte 6, `resolusRealises` n'en voit qu'1 (`lireCarnets` sans `archives: true`). 2 rouges.
  - C69-8 : le coût d'un projet du Planning vient du critère « Budget 400 CHF » (comme la liste des carnets : `prixSansArticle`), `tachesDe` ne lit que les notes : « Frigo + congel · au Planning » sans coût. 1 rouge.
  - C69-9 : « appeler l'électricien … avant le 12 décembre » tapé dans le problème (IA éteinte, analyse locale) : aucune tâche écrite. 1 rouge.
  - C69-10 : Houblons citra, Chambre froide, Frigo + congel, Embouteillage (sans catégorie) à plat sous Brasserie. 1 rouge.
  - C69-11 : Alpha « 10 % - 15 % » contre 13,6 % sans ✓ ; « Aucune valeur lue pour : vendeur » (MotlerHops lu sans nom de vendeur). 2 rouges.
  - C69-12 : le plan écrit pour À venir se nomme « CITRA® (US) · 1 kg » (message du test = le relevé K8, MotlerHops lu sans vendeur, adresse `motlerhops.fr`). 1 rouge.
  - C69-13 : « Ses autres valeurs » : le libellé et la valeur d'arômes sont deux cellules voisines de la même ligne de tableau (CSS réel injecté, `display: table-cell`) ; l'en-tête « place parmi les 2 » reste alors que la colonne est vide. 2 rouges.
  - Verts voulus (garde-fous ou déjà justes) : aucun dans R80.

## Essais utilisés
Un essai par bloc ; 3 corrections de test (fixture C69-11 recalée sur le relevé K3, regex du bouton Choisir, libellé sans vendeur C69-12) avant les rouges justes. Aucun critère épuisé.

## DEMANDE RELEVE (réponses réelles de l'IA manquantes : rien n'a été inventé)
Les tests de rangement n'ont que `rangement-1` (vapeur) comme réponse réelle pour R77 ; pour le reste de la règle (« Valable pour toute phrase ») il manque, à relever en ligne sur un carnet « ZZ TEST — c70 … » (jamais un carnet du brasseur) :
1. « ZZ TEST — c69 houblon Citra pour l'IPA de Noël, comparer deux vendeurs » (l'IA proposait Houblons citra).
2. Les deux phrases neuves du relevé critique-69 qui ont gardé un titre court (tireuse, boucheuse) : pour fixer qu'un carnet voisin ne les rattache pas.
3. « Commander 25 kg de malt Munich chez Weyermann avant le 10 décembre » (C69-8 : rangée dans « Cette semaine » au lieu de « Plus loin ») : l'échéance posée par l'IA / la tâche proposée.
4. « appeler l'électricien pour poser la hotte avant le 12 décembre » tapée dans un problème (C69-9) : la réponse de l'IA (le test C69-9 n'exerce que l'analyse locale).
5. Le mémo « le sol époxy… » dans un carnet ZZ créé pour lui (C69-2 : le geste Supprimer a été joué sur un mémo rangé par l'IA ; `rangement-3` désigne `Carnet réel 3`).

## Doutes et limites
- jsdom ne mesure aucune boîte : C69-13 se juge à la structure (cellule voisine du libellé en `table-cell`, colonne vide), pas à la largeur réelle à 390 px.
- C69-8 : l'appui long (rien après 1,6 s en ligne) n'est pas rejoué ici : c68Regles R76 le joue déjà au toucher sur une tâche écrite ; en ligne l'appui portait peut-être sur une tâche DÉRIVÉE du Planning (`onContextMenu` ignore `derivee`). À trancher par le pilote : « Quand ? » d'une tâche dérivée, oui ou non (DÉCISION ci-dessous). Le groupe « Fin du mois · Un jour » de la maquette n'est pas testé : il dépend des dates.
- C69-7 : jugé sur le domaine (`resolusRealises` / `coupDOeil`), pas sur `StocksTab` (App entière) ; le onglet lui-même est à rejouer en ligne par la voie de contrôle.
- C69-10 : le critère « repliés par sous-domaine » est lu comme « aucun de ces carnets n'est une ligne visible à plat sous le domaine » ; la forme du repli (« ▸ À ranger 4 », sous-domaine dérivé) reste au concepteur selon la maquette v01-liste.
- C69-5 : « picto propre » = jamais `hotte` sur un condenseur ; le choix du picto de remplacement n'est pas prescrit.

DÉCISION À PRENDRE : une tâche DÉRIVÉE du Planning (« Frigo + congel · au Planning ») s'ouvre-t-elle à « Quand ? » par un appui long (maquette v01-afaire) ? Options : oui (la date du Planning se change depuis À faire) ou non (le Planning garde sa date). Recommandation : non, tant que le Planning est la source de la date ; l'appui long reste pour les tâches écrites (déjà couvert par c68Regles R76).

CONNAISSANCE : les « anciens résolus » de Résolus 2026 sont des carnets archivés (`carnet.archive`) ; `etatDe` les lit « résolu », mais `lireCarnets` sans `{ archives: true }` les cache : tout compte sur « résolus » doit les lire.
LEÇON PROPOSÉE : aucune
