REPRISE — page6 écrite à la main, critères G1 à G3 pas encore rejoués (contexte 155 k)

## Fait
- `work/missions/2026-11-14-brassins/page6/index.html` : accueil `#a-choisir` (≈ 44 mots : 6 vignettes data-vignette/data-agrandir e1a e2a e4c e7a e10c e11a, légendes en mots ; 6 gros boutons numérotés), six `<section data-question>` (`#fermentation` gfd gfa gfc ; `#filtres` e6a+e6c, g6a, g6b ; `#creer` e5ga e5gb, réf. e5na e5nb ; `#carnet` e3gb e3gd e3gc e3ga, réf. e3a e3b ; `#recettes` e8nc e8nb e8nd e8na ; `#atelier` e9nc e9nd e9nb e9na), ordre des VERDICT k7, k8, k9. Chaque écran : retour en haut, « n sur 6 », ses mots exacts, `data-ask` « Laquelle garder : … ou aucune ? » + bouton Aucune, référence en petit, variantes (titre sans code, id en petit, repos 390 clair pleine colonne, « Ce qui change » `data-change` ≤ 20 mots repris des NOTE, rangée `.etats` overflow-x + scroll-snap à 340 px, gestes nommés, « Je prends »), lien « Question suivante ». Barre en bas : réponse composée (« Fermentation : gfa · Créer : aucune ») + Copier (clipboard, repli sélection). Visionneuse `<dialog>`. Deux thèmes (prefers-color-scheme).
- Images : `page6/img/` (117 fichiers, 18 Mo), mêmes noms, depuis `voies/<série>/<id>/` (après g7, g8, g9) et `page5/img/` pour les références.
- Choix technique : les images des écrans cachés portent `data-src` (+ `loading="lazy"`) et reçoivent `src` à l'ouverture de l'écran. Raison mesurée : une image lazy dans un écran caché reste `complete=false` (test scratchpad), et `verifier-page.mjs` la compterait « non chargée ».
- `voies/pg6/capture.mjs` : captures accueil + 6 écrans en 390 clair, 390 cave, 1280 dans `voies/pg6/verif/`, mesures par écran (texte < 14 px, blocs > 45 mots, débord, image la plus étroite, mots de l'accueil), puis geste Je prends / Aucune, accueil après choix, visionneuse. Premier essai : accueil 390 clair `{"petits":[],"longs":[],"debord":0,"motsAccueil":44}`, puis arrêt (`Runtime.callFunctionOn timed out` : `decode()` d'une image lazy hors champ ne se résout jamais). Script corrigé (eager sur le premier écran, attente plafonnée à 4 s), pas relancé.

## DEMANDE EXECUTANT (Haiku), depuis la racine du dépôt, dans l'ordre
1. `node work/missions/2026-11-14-brassins/voies/pg6/capture.mjs > work/missions/2026-11-14-brassins/voies/pg6/verif/mesures.txt 2>&1` (≈ 2 à 3 min) ; attendu par ligne : `petits:[]`, `longs:[]`, `debord:0`, `imgMin` ≥ 340 sur les écrans de question, `motsAccueil` ≤ 45 ; ligne `barre` = « Fermentation : gfa · Créer : aucune ».
2. G1 : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page6/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg6/verif` → `PAGE OK`.
3. G2 : `node work/missions/2026-11-14-brassins/outils/controle-page-claire.mjs work/missions/2026-11-14-brassins/page6/index.html` → `PAGE CLAIRE OK 6`.
4. G3 : la commande CHECK de `voies/pg6/GATES.md` → `CONTENU OK`.
5. Écrire les sorties des étapes 1 à 4 dans `voies/pg6/tests.txt`.
6. Rendre au concepteur (agent neuf ou repris) : les sorties, et les captures à ouvrir : `verif/accueil-390-clair.png`, `verif/<écran>-390-clair.png` et `-390-cave.png` pour fermentation, filtres, creer, carnet, recettes, atelier, `verif/fermentation-1280-clair.png`, `verif/geste-prendre-390-clair.png`, `verif/visionneuse-390-clair.png`, `verif-haut.png`, `verif-ordinateur.png`.
Si un critère échoue : corriger seulement `page6/index.html` (texte ou CSS), jamais le contrôle.

## Reste au concepteur
- Ouvrir chaque capture : la question et la première variante (titre, id, haut du repos) au premier écran ; rien de coupé à 390 ; cave lisible.
- Points à vérifier sur image : légendes « rangement » de e3gd, e3gc, e3ga (« Après « Accepter les 5 » … ») et « idée » de e9nd, e9nb, e9na (« l'idée ouverte ») écrites d'après NOTE, captures non ouvertes.
- Puis RESULTAT.md final (ligne 1 OK/ECHEC).

Prédiction : « Là c'est clair : une question, je vois la maquette en grand, je touche Je prends. »
CONNAISSANCE : une image `loading="lazy"` dans un bloc `hidden` n'est jamais chargée (complete=false) ; une page à écrans cachés doit poser `src` à l'ouverture, sinon verifier-page la compte non chargée.
LEÇON PROPOSÉE : aucune
