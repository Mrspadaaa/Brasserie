OK — v7 améliorée : thème de l'app, arbre en 13 lignes, champ ✦ +, Comparer dédié à 6 offres, images, Relire, IA forte

## Fichiers
- `jouable/m4b-v7.html` : construit par `node cap-amelio/build.mjs` à partir de `cap-amelio/src/base.html` (la v7 publiée, HEAD du 26.11), de `src/amelio.css` et de `src/amelio.js`.
  - La couche est posée dans la portée du jouable, avant le démarrage. Les fonctions de même nom sont remplacées (elles sont hissées).
  - Correctifs par split/join : clés de comparaison A à H, 8 articles et 8 options gardés à la validation, lecture escaladée en `modelTier: "complex"`.
- Moteur et acquis gardés : Claude via sample, journal, liens/ et demandes/, lecture automatique, Organisé par défaut, noms réels, aucune question au pouce.
- Banc : `node cap-amelio/banc/banc.mjs avant|apres`. Il tourne sur Chrome 9222, dans son propre onglet, avec page.close() puis disconnect et `window.claude` simulé.
  - Les mesures vont dans `cap-amelio/banc/avant.json` et `apres.json`.
  - Captures : `cap-amelio/avant-*.png` (9) et `cap-amelio/apres-*.png` (37).

## Sorties décisives
- Après : 27 gestes sur 27 « ok », 0 erreur de console.
- Cas 6 offres : `{"offres":6,"colonnes":6,"barres":6}`.
- Escalade : le dernier appel sample porte `modelTier` = `complex`. Relire écrit `demandes/<id>` avec `type:"relire"`, et `ia:"forte"` pour l'escalade.
- Liste : 13 carnets entièrement visibles à 390 × 844 (12 avant), alors que l'en-tête de l'app et la barre d'onglets ont été ajoutés. Aucun débordement horizontal.
- Cibles de moins de 44 px encore mesurées :
  - la puce de catégorie (30 px) et les onglets Mes notes | Organisé (34 px) : leur zone de toucher est étendue à 44 px par un pseudo-élément, que le banc ne compte pas ;
  - le champ de la liste (42 px).
- Plus petit texte : 11 px. Ce sont les « ? » et « ✓ » dans leur rond de 16 px (des pictos). Le texte courant fait 13 px au moins.

## Les points
| # | Point | Fait / pourquoi pas | Avant → après |
|---|---|---|---|
| 1 | Moins enfantin, toujours visuel | Fait. Emoji 3D géants, bulles rondes et hachures retirés ; icônes au trait ; emoji à 16 px au plus (pistes, Aide) ; jauges, anneau trouvé et barres de prix gardés | avant-org-eco → apres-org-eco, apres-14-eco-aide |
| 2 | Arbre compact, catégorie › sous-catégorie | Fait. Une ligne de 44 px par carnet. La sous-catégorie est écrite au-dessus du premier carnet de son groupe, sur un rail d'arbre. Résolus repliés en une ligne. 13 carnets visibles | avant-01-liste → apres-01-liste, apres-02-liste-bas |
| 3 | Champ texte en bas, + et ✦ | Fait, sur la liste et dans le carnet. Le champ (photo et micro dans le champ) est toujours actif. ✦ ouvre les suggestions de l'IA, ou l'Aide dans le carnet ; + ajoute | apres-04, 05, 12, 13 |
| 4 | Comparer en vue dédiée (h04-7, v03-4, g05-8, g01-8, h06-7) | Fait. La vue contient : barres du critère classées (puces de critère), Côte à côte avec le meilleur en vert, Compromis, Écartés (Reprendre), toutes les caractéristiques, « + Ajouter une caractéristique », « ✦ Proposer ». Elle tient 6 offres (défilement horizontal, première colonne fixe). Organisé garde « qui gagne quoi » à quantité égale (total pour N livrées, par unité utile) | avant-org-bt → apres-org-bt, 20 à 26, 31 à 34 |
| 5 | Tableau seulement là où il compare | Fait. Le tableau a quitté Organisé et ne vit plus que dans Comparer. Ailleurs : tuiles, barres, puces | avant-org-bt → apres-org-bt |
| 6 | Précis | Fait :<br>– dates « dans 5 j · ma 1.12 » ou « en retard de n j », jour de la semaine calculé, et « samedi 6 déc. » signalé comme un dimanche ;<br>– heure de rangement à l'heure suisse (Europe/Zurich) ;<br>– trouvé (rond vert), pas trouvé (?), à vérifier (? tireté), estimé (≈ bleu tireté), « exemple » ;<br>– chaque valeur renvoie à sa ligne ;<br>– « ≈ 150 CHF estimé · exemple » sur l'écoulement | apres-org-eco, apres-51-cave-date, apres-22-bt-cellule |
| 7 | Pratique | Fait. L'action principale est dans une barre au-dessus du champ (Fait, Prendre X, Commandé, Comparer). Prendre depuis Comparer revient à « Commander chez ». Cibles de 44 px | avant-org-eco → apres-org-eco, 27, 28 |
| 8 | En-tête utile, pas de frise | Fait. En-tête : ‹, titre court, sous-catégorie (toucher : Ranger), ⋯. Puis Mes notes \| Organisé et « ✦ 10:43 ». Le héros donne l'état, l'étape, la date et la ligne. Il n'y a pas de frise | avant-org-co2 → apres-50-co2-tete |
| 9 | Jetons communs | Fait. Couleurs, tailles, rayons, barre du pouce (champ, ✦, +) et barre d'onglets de COMMUN.md | toutes |
| 10 | Thème de l'application | Fait. En-tête L'Affinée (logo A), coup d'œil des états, cartes du panneau, barre d'onglets Bord…Clients (Stocks actif, masquée quand le clavier est ouvert), Source Sans 3, palette cave forcée | avant-notes-eco → apres-notes-eco, apres-01-liste |
| 11 | Idées des maquettes classées | En partie. Repris :<br>– des mini p5 : en-tête, rail d'arbre, barres d'état, pouce, tuiles « qui gagne quoi » (O-options-b), barres classées (O-comparer) ;<br>– de ses choix du 17.11 (h04-7, g05-8, h06-7) : critère classé, côte à côte vert, compromis, écartés ;<br>– de v01, son rang 1 « glisser » : l'appui long pour ranger est gardé.<br>Non greffé : v04 « Mes notes, on écrit », l'autre rang 1. Je ne l'ai pas relu, faute de contexte | — |
| 12 | Vraies images | Fait. `liens/<id>.image` (https) s'affiche dans la section Liens, dans les options et dans les colonnes de Comparer. Sans image : l'icône au trait de la catégorie, jamais un emoji. Banc : image simulée sur Brau und Rauchshop | avant-org-citra → apres-40-citra-liens |
| 13 | Relire et Escalader | Fait :<br>– sur chaque lien : Relire, IA forte (« en lecture · IA forte ») ;<br>– sur le carnet, depuis ⋯ : Relire la note et Escalader à l'IA forte (`modelTier` complex, « IA forte 10:40 » dans l'en-tête) | apres-41, 42, 43 |
| 14 | Historique en critères | Voir le tableau ci-dessous | — |

## Critères tirés de l'historique (ses mots récents priment ; seules les règles dures bloquent)
| Plainte ou défaut | Tenu ? |
|---|---|
| « Aucune comparaison ?? » (citra, 26.11) | Oui. Le prix est lu sur le lien (245.70 CHF / 5 kg), avec l'image, et Comparer 2 offres est proposé |
| PAS-DE-HARCELEMENT | Oui. Aucune question au pouce |
| TROP-ENFANTIN, PRO-MAIS-PAS-CLAIR | Oui. Icônes au trait, chaque état dit en mots (trouvé, pas trouvé, à vérifier, estimé) |
| COMPARER-PAS-SON-CHOIX, COMPARER-BEAUCOUP-D-OPTIONS, COMPARER-QUI-GAGNE | Oui. Vue sur le modèle de h04-7, cas 6 offres joué, résumé « qui gagne quoi » à quantité égale |
| ENTETE-PEU-UTILE, FRISE-GENERIQUE, ORGANISE-TROP-TEXTUEL | Oui, en partie : 45 à 85 mots au repos, selon les cas (les tuiles et les liens ajoutent du texte) |
| CARNET-LISTE-COMPACTE, « Je préfère la vue en arbre mais pas assez compact » | Oui. 13 carnets visibles |
| CARNET-THEME (17.11) | Oui. Habit de l'app |
| CARNET-CLAV | Oui. La barre d'onglets s'efface au clavier ; pas mesuré avec un clavier simulé |
| CARNET-CARTE-MUETTE | Oui. Une option ou une colonne montre image ou icône, nom, prix (trouvé ou estimé), d'où il vient et sa ligne |
| « Le champs text aussi toujours actif » (25.11) | Oui |
| « Avoir une autre action pour de la suggestion de l'ia » | Oui (✦) |
| CARNET-LIS : 40 mots au plus | Non, sur les cas qui comparent ou qui ont des liens : contre-indiqué par sa demande de tout comparer et de voir l'objet |

## Limites
- Les réponses de l'IA sont écrites à la main (reponses-v7) ; le cas 6 offres est écrit par le banc.
- L'image du lien est simulée dans le banc : le pilote remplira `image`.
- « ✦ Proposer » attend `{"caracteristiques":[…]}` de sample ; les valeurs restent « à remplir », jamais inventées.
- Toutes les captures après n'ont pas été ouvertes une par une. Ouvertes : 01, 05, 14, 20, 22, 25, 28, 31, 32, 34, 40, 43, 50, 51, org-eco, org-bt, org-vap, org-citra, notes-eco, et avant-org-citra. Les autres ne sont vérifiées que par les mesures.
- Pendant le travail, un `cat` bloqué sur l'entrée standard a été tué avec trois vieux processus `cat` orphelins (du 25.11) d'autres sessions.

Prédiction : « Là ça ressemble à l'app et je vois enfin la comparaison ; reste à voir avec mes vrais carnets. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un jouable se thématise sans toucher son moteur par une couche de fonctions hissées, injectée avant le démarrage dans la même portée (cap-amelio/build.mjs).
LEÇON PROPOSÉE : jamais `cat > "$VAR/f"` avec une variable possiblement vide dans un appel groupé : le `cat` attend l'entrée standard et bloque tout le lot.
