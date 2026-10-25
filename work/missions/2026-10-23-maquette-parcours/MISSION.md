baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 tiède, 3 chaude) |baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 tiède, 3 chaude) |baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 tiède, 3 chaude) |baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |# Mission 2026-10-23-maquette-parcours

## Objectif
L'utilisateur, le 23.10 : « fait une maquette fonctionne de bout en bout », puis « Continue ensuite avec le tout
interactif comme si c'était sur la vrai app. Afin de préparer sa vrai implemtation ».

Une maquette jouable, publiée dans un artefact neuf, où le brasseur suit sa stout export 16D (« trop résineuse,
je la veux plus florale ») dans l'ordre de la carte des outils (`fils22-carte`) :
1. Ma bière, étape Houblons. L'appui long sur un houblon ouvre sa fiche.
2. « + floral » → Suggérer → cocher → « Comparer les 3 » → Comparer (r6a) → « Placer Idaho 7 ».
3. Dryhopper : le moment glissé par 5′, jusqu'aux jours de contact. « Puis la levure » → Levure → « Ajouter à ma
   bière ».
4. Retour à Ma bière, recalculée : IBU, barres au style, la ligne Idaho 7 ajoutée.
5. Nugget → Substituer (la porte) → « Remplacer » → Ma bière recalculée.

« Comme sur la vraie app » veut dire :
- les composants, les jetons de style et le thème de l'app (`src/ui`, `tailwind.config.js`), importés et jamais
  recopiés ;
- le moteur v4, qui importe le moteur V5.5 de l'app, calculé en direct dans le navigateur (`simulerCas` : 1,4 ms
  par geste, [[cout-calcul-moteur]]), sans grille précalculée ;
- un seul état de recette partagé par tous les écrans : un geste dans un outil change Ma bière ;
- retour arrière, appui long, glisser, toucher, comme au téléphone.

« Préparer la vraie implémentation » veut dire : le code est rangé comme il le sera dans l'app, et
`ARCHITECTURE.md` donne, pour chaque fichier, sa place future dans `src/`, le type de l'app qu'il emploie ou
qu'il faudra créer, et ce qui manque (persistance Dexie, Firestore, catalogue réel).

Aucun fichier de l'app n'est modifié : la porte B reste fermée ([[le-brasseur-choisit]]). Le code vit dans
`prototypes/houblons-v4/parcours/`.

**Fini** veut dire :
- les sept écrans passent leurs contrôles ;
- `jouer-parcours.mjs` joue le parcours entier dans Chrome au format téléphone, et vérifie l'état après chaque
  geste (PARCOURS OK) ;
- les captures de chaque étape ont été regardées ;
- le critique a rendu son avis ;
- l'artefact est publié et son lien est dans la table « Pages ».

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Où vit le code | dans `src/` ; à côté, dans `prototypes/houblons-v4/parcours/` | pilote | tranchée : à côté. Porte B fermée, et rien dans l'app sans son essai |
| Comparer | r6a ; r6n2 ; r6p1 à r6p4 | brasseur | tranchée le 23.10 : r6a, « avec les quelques petites améliorations des autres versions » |
| Dryhopper | a1, b4, d8, e5, g1 | brasseur | ouverte. Base a1 : c'est y1b affiné, et y1b est un acquis (« y1b est de mon point de vue semble meilleur »). Son choix remplacera l'écran |
| Substituer | la porte vers Comparer ; un outil propre (u4) | brasseur | ouverte. La porte, recommandée par le conseil (houblon manquant épinglé dans Comparer) |
| Levure | étape de Dryhopper ; outil propre (a2b) | brasseur | ouverte. L'étape (carte : « Puis la levure ») |
| Thème | clair ; cave (le thème actuel de l'app) | brasseur | ouverte. Clair par défaut, comme les maquettes qu'il a jugées. La cave se choisit d'un toucher dans la coquille |
| Persistance | Dexie, comme l'app ; en mémoire | pilote | tranchée : en mémoire, avec un bouton « Recommencer ». La persistance est décrite dans ARCHITECTURE.md |
| Ma bière et Suggérer (D105, 23.10 soir) | la carte en fil de fer ; ses maquettes choisies | brasseur | tranchée : ses maquettes. « Mais ça semble pas du tout correspondre aux choix que j'ai fait de maquette de base ??? ». Étape Houblons et onglet Ma bière de la base v4.10 (« Ça aussi »), q2b (« Ça oui, c'est effectivement l'un de mes choix »). La carte ne donne que les ponts. Contrôle : controle-reprise avec les inventaires de ses maquettes |
| Comparer aux étapes (D107, 23.10, soir) | le Comparer de la base v4.10 ; x3b (lot 21) | brasseur | tranchée : x3b. « Non pas cette version, une version du dryhopping, dans un des top. Montrait vraiment l'état du moment de l'ajout facile, je l'avais juste fait noté !! » ; sa note du 20.10 : « ça peut être interessant de l'utiliser jsute pour de la comparaison entre ma bière de base -> 1 dry hop, 2 dry hop: levure ». r6a garde la forme ; les étapes, l'état au moment de l'ajout et la référence viennent de x3b |
| α inconnu d'un houblon écrit dans la recette de l'app (p8) | écrire 0, la convention actuelle de l'app ; rendre `HopIngredient.alpha` facultatif | pilote | tranchée : facultatif à l'intégration (inconnu ≠ 0) ; d'ici là, la conversion n'est employée que dans les tests ; inscrit dans #143 |

Variantes choisies, dont repartent les écrans :
- r6a choisie : « r6a reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des autres versions » (23.10)
- y1b choisie : « y1b est de mon point de vue semble meilleur. » (20.10)
- q2b choisie : « C'est effectivement qb2 reprise le mieux » (19.10, soir ; après q2, « cella là », 14 h 34) ; base v4.10 (`work/refonte-frontend/v4/ecran-1/base/consolide/`)
- f1 choisie : « Mon Picto préféré est cannelley clou croisé. Ça doit être changé dans la baseline » (23.10)
- base v4.10 choisie : « Ça aussi » (23.10, sur la capture de l'onglet Ma bière)
- x3b choisie pour les étapes de Comparer : « Montrait vraiment l'état du moment de l'ajout facile, je l'avais juste fait noté !! » (23.10, D107)

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| p0-socle | socle de la maquette : coquille de l'app, routes, état partagé, adaptateur du moteur en direct, données du cas, construction en pages par route, script de parcours, ARCHITECTURE.md | conception | auteur | opus | 150 | `prototypes/houblons-v4/parcours/**` (hors `src/ecrans/`), `prototypes/houblons-v4/package.json`, `voies/p0-socle/RESULTAT.md` | — | typecheck ; construire.mjs (CONSTRUIT OK) ; app-intacte.mjs ; jouer-parcours.mjs --routes ; verifier-page.mjs | pilote | — |
| p1-ma-biere | Ma bière : l'étape Houblons et l'onglet Ma bière de la base v4.10 (D105), sa fiche au long appui (g1, fiche courte), et Substituer en porte ; reprise D108 : la visée de sa base posée sur la piste (losange, pointillé, paliers, ×, nom barré), lue par Suggérer en crans, bannir = visée à 0 ; puis l'étape Houblons : le geste de sa base (D111), l'appui long (D112), un « ? » par groupe d'icônes (D113), le fil d'étapes de l'app (D116), le profil qui ouvre l'analyse en 2 ou 3 variantes (D121) ; la fiche et Substituer passent à p17 | conception | concepteur | opus | 120 | `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**`, `…/ecrans/biere/**`, `…/ecrans/fiche/**`, `…/ecrans/substituer/**`, `voies/p1-ma-biere/RESULTAT.md`, la visée dans `prototypes/houblons-v4/parcours/src/etat/**`, `…/ecrans/suggerer/voies.ts`, les lignes de la visée de `…/coquille/Coquille.tsx` | p0-socle, p10-controle-visee, p13-controles-etape, p14-controles-fiche-fil | controle-commun ; controle-ma-biere ; controle-fiche ; controle-fiche-baseline ; controle-alpha ; controle-sans-famille ; tolerance (vitest) ; jouer-parcours.mjs --etape=ma-biere --etape=fiche --etape=substituer ; sans controle-usage-intensite : liés aux cas figés du lot 15 (data-cas, donnees/<cas>.json), le moteur calcule ici en direct ; D80 (intensité en crans, usage) vérifié en direct par jeu.mjs ; controle-reprise --inventaire=inventaire-etape.json et inventaire-ma-biere.json (D105) ; controle-choix.mjs (règle n° 1) ; controle-rail --parcours (D27, D35 à D37, D46, D47, D69) ; page fiche/etat.html : controle-commun --sans=fiche,legende (sans controle-fiche, controle-legende : page d'état feuille déjà ouverte ; le geste D25, D49 et la légende se jouent depuis l'étape Houblons) ; controle-visee (D108) ; parcours-complet.mjs ; controle-geste-etape (D111) ; controle-appui A9 (D112) ; controle-legende (D113) ; controle-stepper (D116) ; controle-profil-ouvre (D121) | brasseur | reprise |
| p2-suggerer | Suggérer de q2b tel qu'il l'a choisi (D105) : onglets, cartes d'objectif, voies du moteur groupées par effet (ajouter, assembler, remplacer), « + », « Comparer (n) » ; reprise D110 (les traits de q2b lus au toucher, rien de plus au repos) et D109 (le retour des outils, 44 px, nommé) | conception | concepteur | opus | 100 | `prototypes/houblons-v4/parcours/src/ecrans/suggerer/**`, `voies/p2-suggerer/RESULTAT.md`, `prototypes/houblons-v4/parcours/src/commun/Cadres.tsx`, `…/commun/retour.css`, une lecture dans `…/coquille/navigation.tsx` (sans `…/ecrans/suggerer/voies.ts`, à p1) | p0-socle, p11-controle-retour, p12-controle-traits | controle-commun ; controle-autres-ajouts ; controle-ma-biere ; controle-alpha ; controle-piste-objectif ; controle-place-voies ; controle-une-question ; tolerance (vitest) ; jouer-parcours.mjs --etape=suggerer ; sans controle-moments : liés aux cas figés du lot 15 (data-cas, donnees/<cas>.json), le moteur calcule ici en direct ; le « + » vers Comparer est vérifié par jeu.mjs ; sans controle-usage-intensite : idem, D80 (intensité en crans, usage) vérifié en direct par jeu.mjs ; sans controle-cumul-levure : Suggérer ne fait varier que le houblon (L10), la levure est contrôlée dans son étape (p4) ; controle-reprise --inventaire=inventaire-q2b.json (D105) ; controle-choix.mjs (règle n° 1) ; controle-traits (D110) ; controle-retour (D109) ; parcours-complet.mjs | brasseur | reprise |
| p3-comparer | Comparer de r6a, en direct, avec les petites améliorations des autres versions (r6n1, r6n2, r6p1 à r6p4) : colonnes au toucher, « + » pour une 4ᵉ, « Placer <gagnant> » ; reprise D107 : les étapes (60′, 10′, dry hop) et la référence, à la manière de x3b | conception | concepteur | opus | 120 | `prototypes/houblons-v4/parcours/src/ecrans/comparer/**`, `voies/p3-comparer/RESULTAT.md`, les étapes de Comparer de `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs` | p0-socle, p9-controle-etapes | controle-commun ; controle-radar-series ; controle-alpha ; controle-lisible ; controle-simulation ; controle-une-question ; controle-acquis ; controle-sans-famille ; controle-reprise ; jouer-parcours.mjs --etape=comparer ; sans controle-autres-ajouts : il compare les voies ([data-voie]) aux voies d'un cas figé (S1, lot 15) et Comparer n'a pas de voies ; D76 tient par construction (chaque famille de chaque houblon a sa rangée) et jeu.mjs compare le floral au moteur sur 4 colonnes ; controle-choix.mjs (règle n° 1) ; controle-comparer-etapes (D107) ; parcours-complet.mjs | brasseur | reprise |
| p4-dryhopper | Dryhopper de a1 (y1b affiné) : le moment glissé par 5′ jusqu'aux jours de contact, calculé à chaque geste ; puis l'étape Levure et « Ajouter à ma bière » | conception | concepteur | opus | 120 | `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**`, `…/ecrans/levure/**`, `voies/p4-dryhopper/RESULTAT.md` | p0-socle | controle-commun ; controle-alpha ; controle-lisible ; controle-simulation ; controle-une-question ; controle-acquis --outil=dryhopper ; controle-cumul-levure (étape Levure) ; pouvoir (vitest) ; jouer-parcours.mjs --etape=dryhopper --etape=levure ; sans controle-moments : liés aux cas figés du lot 15 (data-cas, donnees/<cas>.json), le moteur calcule ici en direct ; le rail est vérifié par controle-acquis --outil=dryhopper (geste, frise) et par jeu.mjs (loupe ×3 sous le doigt, L12) ; controle-rail --parcours (D27, D35 à D37, D46, D47, D69) | brasseur | reprise |
| p5-parcours | le parcours entier joué au téléphone, l'état vérifié après chaque geste, les captures de chaque étape | jugement | auteur | sonnet | 80 | `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs`, `voies/p5-parcours/**` | p1-ma-biere, p2-suggerer, p3-comparer, p4-dryhopper | parcours-complet.mjs (PARCOURS OK) ; verifier-page.mjs ; controle-choix.mjs (règle n° 1) ; controle-teinte.mjs (D106) | pilote | — |
| p6-critique | avis du critique sur le parcours, écran par écran, en défauts vérifiables | jugement | critique | fable | 40 | `voies/p6-critique/RESULTAT.md` | p5-parcours | note RESULTAT (un avis par écran) | pilote | — |
| p7-implementation | relecture indépendante : la maquette est-elle prête à porter dans l'app (architecture, types, état, moteur, conventions, ce qui manque), à la demande « que c'est facile après pour l'implémentation » | jugement | relecteur | sonnet | 60 | `voies/p7-implementation/RESULTAT.md` | p1-ma-biere, p2-suggerer, p3-comparer, p4-dryhopper | note RESULTAT (verdict par zone, bloquants, effort) | pilote | — |
| p8-portabilite | lever dans la maquette les bloquants d'intégration prouvés par p7 : moteur portable (B3, B4), données injectables (B2), conversion de la recette de l'app testée (B5), navigation en pile sur l'API de useFullScreenRoute (B1), données hors de work/ (B8), crochet de test ; rien ne change à l'écran | conception | auteur | opus | 150 | `prototypes/houblons-v4/src/**`, `…/data/**`, `…/tests/**`, `…/parcours/src/{moteur,etat,coquille,commun,integration}/**`, deux lignes d'import de deux outils (VOIE.md), `…/parcours/ARCHITECTURE.md`, `voies/p8-portabilite/RESULTAT.md` | p1-ma-biere, p5-parcours | portabilite.mjs (--process, --alias, --work) ; check:engine ; conversion-recette.test.ts ; construire ; jouer-parcours --ponts ; controle-choix.mjs (règle n° 1) ; app-intacte | pilote | — |
| p9-controle-etapes | le contrôle D107 (Comparer aux étapes 60′, 10′, dry hop, visibles ensemble, avec une référence), ses témoins, la ligne D107 de la portée ; il échoue sur la construction publiée d332792c | jugement | auteur | sonnet | 80 | `work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs`, `work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-*/**`, la ligne D107 de `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` et de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, `voies/p9-controle-etapes/RESULTAT.md` | — | systeme.mjs echoue sur d332792c et quatre témoins ; deux témoins OK ; systeme.mjs temoins | pilote | — |
| p10-controle-visee | le contrôle D108 (la visée de Ma bière se dessine sur la piste, comme sa base : losange, trait, palier, ×, nom barré), ses témoins (sa base balisée), la ligne D108 de la portée ; il échoue sur d332792c | jugement | auteur | sonnet | 80 | `work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs`, `…/temoins/visee-*/**`, la ligne D108 de `…/portee-defauts.json`, `voies/p10-controle-visee/RESULTAT.md` | — | systeme.mjs echoue sur d332792c et deux témoins ; sa base balisée OK ; systeme.mjs temoins | pilote | — |
| p11-controle-retour | le contrôle D109 (le retour de chaque outil : 44 px, icône 20 px à l'encre, nommé, quitte l'outil), ses témoins, la ligne D109 de la portée ; il échoue sur d332792c | jugement | auteur | sonnet | 60 | `work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs`, `…/temoins/retour-*/**`, la ligne D109 de `…/portee-defauts.json`, `voies/p11-controle-retour/RESULTAT.md` | — | systeme.mjs echoue sur d332792c et deux témoins ; un témoin OK ; systeme.mjs temoins | pilote | — |
| p12-controle-traits | le contrôle D110 (les traits de Suggérer muets au repos, leur famille et leur valeur au toucher, près du picto), ses témoins, la ligne D110 de la portée ; il échoue sur d332792c | jugement | auteur | sonnet | 60 | `work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs`, `…/temoins/traits-*/**`, la ligne D110 de `…/portee-defauts.json`, `voies/p12-controle-traits/RESULTAT.md` | — | systeme.mjs echoue sur d332792c et trois témoins ; un témoin OK ; systeme.mjs temoins | pilote | — |
| p13-controles-etape | les contrôles de l'étape Houblons : D111 (glisser replié et lisible, controle-geste-etape), D112 (retour pendant l'appui long, controle-appui A9), D113 (un « ? » près de chaque groupe d'icônes, controle-legende) ; en échec sur d332792c | jugement | auteur | sonnet | 100 | `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs`, `…/controle-appui.mjs`, `…/controle-legende.mjs`, `…/temoins/{geste,appui,legende}-etape-*/**`, les lignes D111 à D113 de `…/portee-defauts.json`, `voies/p13-controles-etape/RESULTAT.md` | — | systeme.mjs echoue sur d332792c et les témoins ; sa base OK ; appels rejoués (M15) ; systeme.mjs temoins | pilote | — |
| p14-controles-fiche-fil | les contrôles D115 (le radar avant la liste dans la fiche) et D116 (le fil d'étapes de l'app en tête de l'étape) ; en échec sur d332792c | jugement | auteur | sonnet | 70 | `…/controle-fiche.mjs` ou `…/controle-fiche-radar.mjs`, `…/controle-stepper.mjs`, `…/temoins/{fiche-radar,stepper}-*/**`, les lignes D115 et D116 de `…/portee-defauts.json`, `voies/p14-controles-fiche-fil/RESULTAT.md` | — | systeme.mjs echoue sur d332792c et les témoins ; appels rejoués (M15) ; systeme.mjs temoins | pilote | — |
| p15-controle-annuler | le contrôle D120 (« Annuler » à côté de l'action qui change la recette, sans effet sur elle : Substituer, Levure, Dryhopper) ; en échec sur d332792c | jugement | auteur | sonnet | 50 | `…/controle-annuler.mjs`, `…/temoins/annuler-*/**`, la ligne D120 de `…/portee-defauts.json`, `voies/p15-controle-annuler/RESULTAT.md` | — | systeme.mjs echoue sur d332792c et deux témoins ; un témoin OK ; systeme.mjs temoins | pilote | — |
| p17-fiche-annuler | la fiche g1, le radar avant la liste (D115) ; « Annuler » sans effet à côté de l'action sur Substituer, Levure, Dryhopper (D120) | conception | concepteur | opus | 100 | `prototypes/houblons-v4/parcours/src/ecrans/fiche/**`, `…/ecrans/substituer/**`, le pied de `…/ecrans/levure/` et `…/ecrans/dryhopper/`, `prototypes/houblons-v4/maquettes/parcours-p17/`, `voies/p17-fiche-annuler/RESULTAT.md` | p1-ma-biere, p14-controles-fiche-fil, p15-controle-annuler | controle-fiche-radar (D115) ; controle-annuler (D120) ; controle-choix ; parcours-complet.mjs ; app-intacte ; controle-commun, controle-teinte, controle-rail, controle-retour : batterie du pilote sur la construction commune | brasseur | reprise |
| p18-cote-a-cote | l'outil qui capture sa base et la maquette aux mêmes états (douze, 390 px), et la page « sa base, la maquette » demandée par la supervision avant toute publication | jugement | auteur | sonnet | 90 | `prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs`, `work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/**`, `voies/p18-cote-a-cote/RESULTAT.md` | — | captures des douze états ; verifier-page.mjs --page-lot (PAGE OK) | pilote | — |
| p19-controle-rail-froid | le contrôle D123 : le rail de l'étape vers le whirlpool, la fermentation et la post-fermentation comme sa base (carte en puce, J+n réguliers, rien qui déborde ; « à froid », « aucun IBU », J+n et son réglage) ; échoue sur 5345f6ad | jugement | auteur | sonnet | 80 | `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs`, `…/temoins/geste-froid-*/**`, la ligne D123 de `…/portee-defauts.json`, `voies/p19-controle-rail-froid/RESULTAT.md` | — | systeme.mjs echoue sur 5345f6ad et un témoin ; sa base OK ; appels rejoués (M15) ; cablage | pilote | — |
| p20-inventaire-rail | D124 : chaque fonction du rail de l'étape dans sa base v4.10 (loupe, segments, whirlpool, levure, J+n, 45′ à 200′, plusieurs houblons), jouée sur sa base et sur 5345f6ad ; le contrôle qui les rejoue | jugement | auteur | sonnet | 100 | `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json`, `…/base/captures/rail-inventaire/**`, `work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs`, `…/temoins/fonctions-rail-*/**`, la ligne D124 de `…/portee-defauts.json`, `voies/p20-inventaire-rail/RESULTAT.md` | — | systeme.mjs echoue sur 5345f6ad et un témoin ; sa base OK ; cablage | pilote | — |
| p21a-etats-etape-biere-fiche | D124 : chaque état de l'étape (hors rail), de Ma bière et de la fiche choisies, joué sur 5345f6ad, en captures côte à côte | jugement | auteur | sonnet | 90 | `work/refonte-frontend/v4/choix/etats/{etape,biere,fiche}.json`, `…/etats/captures/etat-{etape,biere,fiche}-*`, `voies/p21a-etats-etape-biere-fiche/RESULTAT.md` | — | relevés complets (node), note RESULTAT | pilote | — |
| p21b-etats-suggerer-comparer-acquis | D124 : chaque état de Suggérer (q2b) et de Comparer (r6a, x3b), et chacun de ses acquis et choix écrits, joués sur 5345f6ad | jugement | auteur | sonnet | 90 | `work/refonte-frontend/v4/choix/etats/{suggerer,comparer,acquis}.json`, `…/etats/captures/etat-{sugg,comp,acquis}-*`, `voies/p21b-etats-suggerer-comparer-acquis/RESULTAT.md` | — | relevés complets (node), note RESULTAT | pilote | — |
| p22-commentaires | D125 : chacun de ses commentaires sur les artefacts (56 fils relevés dans les transcriptions), sa trace (SPEC, défaut, contrôle, ticket) et son effet dans 5345f6ad ; la liste des vues dont il n'est pas convaincu | jugement | auteur | sonnet | 90 | `work/refonte-frontend/v4/choix/commentaires/{fils-2026-10-24.json,vues-a-revoir.md,captures/**}`, `voies/p22-commentaires/RESULTAT.md` | — | relevé complet (node), notes | pilote | — |
| p23-tickets | « Vérifie aussi au le git et issues sont à jour » : chaque ticket houblons ouvert face à l'état réel, brouillons de mise à jour et tickets manquants ; rien publié | jugement | auteur | sonnet | 60 | `work/refonte-frontend/tickets-2026-10-24.md`, `voies/p23-tickets/RESULTAT.md` | — | sections et verdicts (node), note | pilote | — |
| p24-controle-etats | D124 : `controle-etats.mjs` rejoue chaque état relevé par p21a et p21b (contrat `data-etat` dans la maquette), branché dans le registre des choix ; échoue sur 5345f6ad, passe sur ses maquettes | jugement | auteur | sonnet | 100 | `work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs`, `work/refonte-frontend/v4/choix/etats/*.json` (voulu, verif), les `controles` de `work/refonte-frontend/v4/choix/ecrans.json`, `voies/p24-controle-etats/RESULTAT.md` | p21a, p21b | systeme.mjs echoue sur 5345f6ad ; --choisie OK ; controle-choix échoue sur 5345f6ad ; registre ; cablage | pilote | — |
| r1-etape | D123, D124 : l'étape Houblons de la base v4.10, son rail tel quel (39 fonctions de p20 : loupe ×3, whirlpool en °C et durée, J+0 à J+14 et réglage, IBU au lâcher, geste interrompu, 200′) et tous ses états (repères de changement, cas-k2, cartes par type, ♡ à trois choix, survol 1280) | conception | concepteur | opus | 130 | `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**` (sans `RadarBiere.tsx`), `…/ecrans/fiche/gestes.ts`, les lignes de cas de `…/parcours/vite.config.ts` et `…/src/main.tsx`, `…/src/donnees/**`, `prototypes/houblons-v4/maquettes/parcours-etape/**`, `voies/r1-etape/RESULTAT.md` | p19, p20, p21a, p24 | construire ; controle-fonctions-rail ; controle-geste-etape (et --froid) ; controle-etats --ecran=etape ; controle-choix (règle n° 1) ; controle-commun ; controle-teinte ; types | brasseur | reprise |
| r2-biere | D124 : l'onglet Ma bière de la base v4.10, tous ses états (radar m4 et son tableau, sommet au toucher, objectifs qui posent la visée, absolu) ; contrat commun `voies/REPRISE-D124.md` | conception | concepteur | opus | 100 | `prototypes/houblons-v4/parcours/src/ecrans/biere/**`, `…/ecrans/ma-biere/RadarBiere.tsx`, `prototypes/houblons-v4/maquettes/parcours-biere/**`, `voies/r2-biere/RESULTAT.md` | p21a, p24 | construire ; controle-etats --ecran=biere ; controle-choix (règle n° 1) ; controle-commun ; controle-teinte ; types | brasseur | reprise |
| r3-fiche | D124 : la fiche g1 et la fiche courte de Citra cryo, tous leurs états (Styles, Huiles, Sources, Substituts ; notes de source ; sommet du radar) | conception | concepteur | opus | 100 | `prototypes/houblons-v4/parcours/src/ecrans/fiche/**` (sans `gestes.ts`), `prototypes/houblons-v4/maquettes/parcours-fiche/**`, `voies/r3-fiche/RESULTAT.md` | p21a, p24 | construire ; controle-etats --ecran=fiche ; controle-choix (règle n° 1) ; controle-commun ; controle-teinte ; types | brasseur | reprise |
| r4-suggerer | D124 : Suggérer de q2b, tous ses états (barres l5b sur l'axe, groupes par effet, levure, IBU par voie, dry hop actif, remplacer, mode Radar, exclure) | conception | concepteur | opus | 110 | `prototypes/houblons-v4/parcours/src/ecrans/suggerer/**`, `prototypes/houblons-v4/maquettes/parcours-suggerer/**`, `voies/r4-suggerer/RESULTAT.md` | p21b, p24 | construire ; controle-etats --ecran=suggerer ; controle-choix (règle n° 1) ; controle-commun ; controle-teinte ; types | brasseur | reprise |
| r5-comparer | D124 : Comparer de r6a et ses améliorations (dock r6n2, colonne +, éléments notés, biotransformation de x3b) | conception | concepteur | opus | 100 | `prototypes/houblons-v4/parcours/src/ecrans/comparer/**`, `prototypes/houblons-v4/maquettes/parcours-comparer/**`, `voies/r5-comparer/RESULTAT.md` | p21b, p24 | construire ; controle-etats --ecran=comparer ; controle-choix (règle n° 1) ; controle-commun ; controle-teinte ; types | brasseur | reprise |
| r7-batterie | D124 : les six reprises construites ensemble (`maquettes/parcours`), la batterie entière au vert sans rien perdre de r1 à r6 | conception | concepteur | opus | 120 | `prototypes/houblons-v4/parcours/src/**`, `prototypes/houblons-v4/parcours/outils/{parcours-complet,jouer-parcours,batterie}.mjs`, `prototypes/houblons-v4/maquettes/parcours/**`, `voies/r7-batterie/RESULTAT.md` | r1 à r6 | batterie ; controle-etats (tous les écrans) ; controle-fonctions-rail ; controle-geste-etape | pilote | reprise |
| r8a-critique | D124 : la reprise de l'étape et de l'onglet Ma bière, état par état, en images (sa maquette, 5345f6ad, aujourd'hui) ; contrat `voies/CRITIQUE-REPRISES.md` | jugement | critique | fable | 30 | `voies/r8a-critique/RESULTAT.md` | r7-batterie | verdict par état (node) ; note | pilote | reprise |
| r8b-critique | D124 : la reprise de la fiche, de Suggérer et de Substituer, état par état, en images ; contrat `voies/CRITIQUE-REPRISES.md` | jugement | critique | fable | 30 | `voies/r8b-critique/RESULTAT.md` | r7-batterie | verdict par état (node) ; note | pilote | reprise |
| r8c-critique | D124 : la reprise de Comparer et des acquis transversaux, état par état, en images ; contrat `voies/CRITIQUE-REPRISES.md` | jugement | critique | fable | 30 | `voies/r8c-critique/RESULTAT.md` | r7-batterie | verdict par état (node) ; note | pilote | reprise |
| pg-etats | D124 : la page « États · 24.10 », chaque état de ses maquettes choisies à côté de la maquette du jour (128 états) | jugement | auteur | sonnet | 100 | `work/refonte-frontend/v4/outils/pages/2026-10-24-etats/index.html`, `…/2026-10-24-etats/img/*-choisie.png`, `voies/pg-etats/RESULTAT.md` | r7 passe 3 | verifier-page (PAGE OK) ; chaque état et image (node) | pilote | — |
| d126-pva | D126 : la pastille « ~ simulé » de Comparer, série pva (v0 ×4) ; brief `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/BRIEF-AUTEUR.md` | conception | concepteur | opus | 90 | `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/pva[1-4]/**`, `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/pva*`, `voies/d126-pva/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| d126-pvz | D126 : la pastille « ~ simulé » de Comparer, série pvz (v0 ×4), libre au brief minimal ; brief `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/BRIEF-AUTEUR.md` | conception | concepteur | fable | 90 | `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/pvz[1-4]/**`, `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/pvz*`, `voies/d126-pvz/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| d126-lsa | D126 : le levier levure dans Suggérer, série lsa (v0 ×4) ; brief `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/BRIEF-AUTEUR.md` | conception | concepteur | opus | 90 | `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/lsa[1-4]/**`, `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/lsa*`, `voies/d126-lsa/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| d126-lsz | D126 : le levier levure dans Suggérer, série lsz (v0 ×4), libre au brief minimal ; brief `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/BRIEF-AUTEUR.md` | conception | concepteur | fable | 90 | `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/lsz[1-4]/**`, `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/lsz*`, `voies/d126-lsz/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| d126-ana | D126 : l'entrée de l'analyse depuis l'étape Houblons, série ana (v0 ×4) ; brief `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/BRIEF-AUTEUR.md` | conception | concepteur | opus | 90 | `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/ana[1-4]/**`, `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/ana*`, `voies/d126-ana/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| d126-anz | D126 : l'entrée de l'analyse depuis l'étape Houblons, série anz (v0 ×4), libre au brief minimal ; brief `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/BRIEF-AUTEUR.md` | conception | concepteur | fable | 90 | `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/anz[1-4]/**`, `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/anz*`, `voies/d126-anz/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| d126-critique | D126 : les 24 concepts neufs (pastille, levure, entrée de l'analyse), un verdict chacun comme le brasseur, défauts vérifiables ; sans classement qui écarte (onze par vue, tout lui est montré) | jugement | critique | fable | 30 | `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/critique/**`, `voies/d126-critique/RESULTAT.md` | d126-pva, d126-pvz, d126-lsa, d126-lsz, d126-ana, d126-anz | un verdict par concept (node) ; note | pilote | tri |
| pg-planches | D126 : une page par vue (Dryhopper, Substituer, liste de la fiche, pastille, levure, entrée de l'analyse, graphes), onze mini maquettes côte à côte avec sa référence, agrandies au toucher | conception | concepteur | opus | 120 | `work/refonte-frontend/v4/outils/pages/2026-10-24-planche-*/**`, `voies/pg-planches/RESULTAT.md` | d126-critique (pour pastille, levure, analyse) | verifier-page (PAGE OK) ; controle-page-choix (PAGE-CHOIX OK) | pilote | — |
| s1-lecons | signature : trier les « LEÇON PROPOSÉE » et « CONNAISSANCE » des voies (couvertes, à fusionner, nouvelles, savoirs, sans suite) ; le pilote applique | jugement | auteur | sonnet | 40 | `voies/s1-lecons/RESULTAT.md` | — | note ; chaque voie citée (node) | pilote | — |
| r9-substituer | D127 : u4 enrichi : moins centré sur l'IBU (le tableau « Arômes 16D », acquis), le dry hop, ajouter à Comparer, remplacer et fermer d'un toucher | conception | concepteur | opus | 100 | `prototypes/houblons-v4/parcours/src/ecrans/substituer/**`, `prototypes/houblons-v4/maquettes/parcours-substituer/**`, `voies/r9-substituer/RESULTAT.md` | r7-batterie | construire ; controle-substituer-gestes ; controle-etats --ecran=substituer ; controle-commun ; controle-choix (règle n° 1) ; controle-teinte | brasseur | reprise |
| r10-comparer | D128 : Comparer redevient r6a au premier écran (ses rangées de familles), les étapes 60′, 10′, dry hop de x3b en sélecteur, sans rien perdre | conception | concepteur | opus | 100 | `prototypes/houblons-v4/parcours/src/ecrans/comparer/**`, `prototypes/houblons-v4/maquettes/parcours-comparer/**`, `voies/r10-comparer/RESULTAT.md` | r7-batterie | construire ; controle-comparer-familles ; controle-comparer-etapes ; controle-etats --ecran=comparer ; controle-choix (règle n° 1) ; controle-commun | brasseur | reprise |
| r11-suggerer-gr5 | « Ça c'est top à mettre dans la vraie version » (gr5) : les lectures b (le cran au doigt) et c (les crans comptés) dans Suggérer de q2b | conception | concepteur | opus | 80 | `prototypes/houblons-v4/parcours/src/ecrans/suggerer/**`, `prototypes/houblons-v4/maquettes/parcours-suggerer/**`, `work/refonte-frontend/v4/choix/etats/suggerer.json`, `voies/r11-suggerer-gr5/RESULTAT.md` | r7-batterie | construire ; controle-etats --choisie et sur la maquette ; controle-choix (règle n° 1) ; controle-commun | brasseur | reprise |
| ret-critique | les retouches de ses préférées (p4b2d à f, flb5b à d, u4e1 à u4e5), chacune à côté de celle qu'il a aimée : sa réserve levée sans perdre ce qu'il aimait | jugement | critique | fable | 30 | `voies/ret-critique/RESULTAT.md` | dh4b, fl-b, r9-substituer | un verdict par retouche (node) | pilote | — |
| r12-continuite | D129 : le même en-tête (titre 18 px, DESIGN.md) et le même pied (en bas) sur chaque outil ; D42 | conception | concepteur | opus | 80 | `prototypes/houblons-v4/parcours/src/commun/**`, `…/ecrans/dryhopper/**`, `…/ecrans/levure/**`, `prototypes/houblons-v4/maquettes/parcours-continuite/**`, `voies/r12-continuite/RESULTAT.md` | r9-substituer, r10-comparer | construire ; controle-continuite ; controle-annuler ; controle-rail ; controle-etats ; controle-choix (règle n° 1) | brasseur | reprise |
| r13-dryhopper | D43 : Dryhopper devient p4b2f, son choix (« Partir sur cette version ») : ses états relevés puis rendus, la continuité (D129), l'acquis y1b | conception | concepteur | opus | 130 | `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**`, `prototypes/houblons-v4/maquettes/parcours-dryhopper/**`, `work/refonte-frontend/v4/choix/etats/dryhopper.json`, `voies/r13-dryhopper/RESULTAT.md` | — | construire ; controle-etats (--choisie et maquette) ; controle-rail ; controle-continuite ; controle-commun ; controle-annuler ; controle-choix (règle n° 1) | brasseur | reprise |
| r14-fiche-flb5b | D130 : la liste de la fiche devient flb5b (son choix), le bandeau « Lui seul : … » des types hors 16D | conception | concepteur | opus | 90 | `prototypes/houblons-v4/parcours/src/ecrans/fiche/**`, `prototypes/houblons-v4/maquettes/parcours-fiche/**`, `voies/r14-fiche-flb5b/RESULTAT.md` | — | construire ; controle-hors-16d ; controle-etats --ecran=fiche ; controle-choix (règle n° 1) ; controle-commun | brasseur | reprise |
| r15a-critique | La maquette du soir avant de la montrer : Dryhopper (p4b2f), la fiche (flb5b, pied flu2b, pics), l'étape (B), état par état en images ; contrats `voies/CRITIQUE-REPRISES.md` et `voies/CRITIQUE-SOIR.md` | jugement | critique | fable | 40 | `voies/r15a-critique/RESULTAT.md` | r13-dryhopper, r14-fiche-flb5b | verdict par état (node) ; note | pilote | reprise |
| r15b-critique | La maquette du soir avant de la montrer : Comparer (r6a et l'étape), Substituer (u4e5, dry hop), Suggérer (gr5, levure de q2b), état par état en images ; mêmes contrats | jugement | critique | fable | 40 | `voies/r15b-critique/RESULTAT.md` | r9-substituer, r10-comparer, r11-suggerer-gr5 | verdict par état (node) ; note | pilote | reprise |
| tickets-soir | Les issues GitHub à jour (« Met bien à jour les issues git », 24.10, soir) : verdicts, commentaires, fermetures justifiées, issues des points ouverts | jugement | auteur | sonnet | 80 | `work/refonte-frontend/tickets-2026-10-24-soir.md`, `voies/tickets-soir/RESULTAT.md` | — | publications vérifiées (node, gh) | pilote | — |
| galerie | Toutes les créations depuis le début (une rangée par lot, ses choix marqués) et toutes les mini maquettes de Dryhopper, dans sa disposition ; deux pages | conception | concepteur | opus | 120 | `work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/**`, `work/refonte-frontend/v4/outils/pages/2026-10-24-dryhopper-tout/**`, `voies/galerie/RESULTAT.md` | — | couverture (node) ; verifier-page --page-lot ; poids (node) | pilote | — |
| rca | Recherche avancée de houblons, série rca (v0 ×4) ; brief `work/refonte-frontend/v4/ecran-1/fils24-recherche/BRIEF-AUTEUR.md` | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils24-recherche/rca[1-4]/**`, `voies/rca/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; concepts (node) | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| rcb | Recherche avancée de houblons, série rcb (v0 ×4), libre au brief minimal ; brief `work/refonte-frontend/v4/ecran-1/fils24-recherche/BRIEF-AUTEUR.md` | conception | concepteur | fable | 110 | `work/refonte-frontend/v4/ecran-1/fils24-recherche/rcb[1-4]/**`, `voies/rcb/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; concepts (node) | brasseur | v0 ×4 (2 tiède, 2 chaude) |
| rcc | Recherche avancée de houblons, série rcc (v0 ×4) ; brief `work/refonte-frontend/v4/ecran-1/fils24-recherche/BRIEF-AUTEUR.md` | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils24-recherche/rcc[1-4]/**`, `voies/rcc/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; concepts (node) | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| rc-critique | Les douze concepts de recherche avancée jugés comme le brasseur, une tête proposée, sans écarter | jugement | critique | fable | 30 | `work/refonte-frontend/v4/ecran-1/fils24-recherche/critique/**`, `voies/rc-critique/RESULTAT.md` | rca, rcb, rcc | un verdict par concept (node) | pilote | tri |
| leg | La légende sous les pastilles (carte du rail, ligne d'ajout), en pictos, série leg ; brief `work/refonte-frontend/v4/ecran-1/fils24-legendes/BRIEF-AUTEUR.md` | conception | concepteur | opus | 90 | `work/refonte-frontend/v4/ecran-1/fils24-legendes/leg[1-4]/**`, `voies/leg/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; légendes (node) | brasseur | v0 ×4 (2 froide, 2 tiède) |
| legz | La légende sous les pastilles, série legz, libre au brief minimal | conception | concepteur | fable | 90 | `work/refonte-frontend/v4/ecran-1/fils24-legendes/legz[1-4]/**`, `voies/legz/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; légendes (node) | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| leg-critique | Les huit légendes jugées comme le brasseur, une tête proposée, sans écarter | jugement | critique | fable | 25 | `work/refonte-frontend/v4/ecran-1/fils24-legendes/critique/**`, `voies/leg-critique/RESULTAT.md` | leg, legz | un verdict par variante (node) | pilote | tri |
| dga | Dryhopper avec ses retours, série dga : p4b2f et la frise de y1b ; brief `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/BRIEF-AUTEUR.md` | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/dga[1-4]/**`, `voies/dga/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; variantes (node) | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| dgb | Dryhopper avec ses retours, série dgb : p4b2f et les trois plans de w2 | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/dgb[1-4]/**`, `voies/dgb/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; variantes (node) | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| dgz | Dryhopper avec ses retours, série dgz, libre au brief minimal | conception | concepteur | fable | 110 | `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/dgz[1-4]/**`, `voies/dgz/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; variantes (node) | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| dg-critique | Les douze Dryhopper avec ses retours jugés comme le brasseur, une tête proposée, sans écarter | jugement | critique | fable | 30 | `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/critique/**`, `voies/dg-critique/RESULTAT.md` | dga, dgb, dgz | un verdict par variante (node) | pilote | tri |
| rpa | r6a++, série rpa : r6a et les étapes, la cuve de x3b ; brief `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/BRIEF-AUTEUR.md` | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/dga[1-4]/**`, `voies/dga/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; variantes (node) | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| rpb | r6a++, série rpb : r6a, les trois plans de w2 et la frise de y1b | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/dgb[1-4]/**`, `voies/dgb/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; variantes (node) | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| rpz | r6a++, série rpz, libre au brief minimal | conception | concepteur | fable | 110 | `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/dgz[1-4]/**`, `voies/dgz/RESULTAT.md` | — | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; variantes (node) | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| rp-critique | Les douze r6a++ jugés comme le brasseur, une tête proposée, sans écarter | jugement | critique | fable | 30 | `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/critique/**`, `voies/rp-critique/RESULTAT.md` | rpa, rpb, rpz | un verdict par variante (node) | pilote | tri |
| cm-quand | D141 : le contrôle « choisir quand comparer » (sélecteur 60′ · 10′ · dry hop qui change les valeurs), témoins | jugement | auteur | sonnet | 50 | `work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs`, `…/temoins/quand-comparer-*/`, `voies/cm-quand/RESULTAT.md` | — | QUAND OK sur le témoin ; ECHOUE sur la base et sur un sélecteur immobile | pilote | — |
| cma | Comparer depuis la maquette jouable, série cma ; brief `work/refonte-frontend/v4/ecran-1/fils25-comparer/BRIEF-AUTEUR.md` | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils25-comparer/cma[1-4]/**`, `voies/cma/RESULTAT.md` | — | baseline : controle-pictos-trait ; variantes (node) ; controle-quand-comparer ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| cmb | Comparer depuis la maquette jouable, série cmb (greffes de r6a++ sur la base jouable) | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb[1-4]/**`, `voies/cmb/RESULTAT.md` | — | baseline : controle-pictos-trait ; variantes (node) ; controle-quand-comparer ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×4 (2 tiède, 2 chaude) |
| cmz | Comparer depuis la maquette jouable, série cmz, libre au brief minimal | conception | concepteur | fable | 110 | `work/refonte-frontend/v4/ecran-1/fils25-comparer/cmz[1-4]/**`, `voies/cmz/RESULTAT.md` | — | baseline : controle-pictos-trait ; variantes (node) ; controle-quand-comparer ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| cm-critique | Les douze Comparer depuis la maquette jouable jugés comme le brasseur, une tête proposée, sans écarter | jugement | critique | fable | 40 | `work/refonte-frontend/v4/ecran-1/fils25-comparer/critique/**`, `voies/cm-critique/RESULTAT.md` | cma, cmb, cmz | un verdict par variante (node) | pilote | tri |
| d131-pha | D131 : les pictos des types hors 16D, série pha (v0 ×4), au trait de la baseline ; brief `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/BRIEF-AUTEUR.md` | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/pha[1-4]/**`, `voies/d131-pha/RESULTAT.md` | ph-donnees | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| d131-phz | D131 : les pictos des types hors 16D, série phz (v0 ×4), libre au brief minimal | conception | concepteur | fable | 110 | `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/phz[1-4]/**`, `voies/d131-phz/RESULTAT.md` | ph-donnees | baseline : controle-pictos-trait ; controle-choix (règle n° 1 : rien dans la maquette) ; note | brasseur | v0 ×4 (2 tiède, 2 chaude) |
| d131-critique | D131 : les huit jeux de pictos jugés comme le brasseur, une tête proposée, sans écarter | jugement | critique | fable | 30 | `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/critique/**`, `voies/d131-critique/RESULTAT.md` | d131-pha, d131-phz | un verdict par jeu (node) | pilote | tri |
| r6-substituer | D34 : Substituer de u4 (« Substitution, ça serait plus du u4 », 19.10), inventaire joué de ses états puis reprise, honnêteté (« arôme 100 », colonne coupée, 60′) | conception | concepteur | opus | 110 | `prototypes/houblons-v4/parcours/src/ecrans/substituer/**`, `prototypes/houblons-v4/maquettes/parcours-substituer/**`, `work/refonte-frontend/v4/choix/etats/substituer.json`, `…/etats/captures/etat-subst-*`, `voies/r6-substituer/RESULTAT.md` | p24 | inventaire (node) ; construire ; controle-etats --ecran=substituer ; controle-annuler ; controle-commun ; controle-teinte ; types ; controle-choix (règle n° 1) au rejeu du pilote | brasseur | reprise |
| dh4a | D34 : Dryhopper, passe 4 sur a1, froides et tièdes (p4a1 à p4a6) ; brief `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/BRIEF-PASSE4.md` | conception | concepteur | opus | 110 | `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4a*/**`, `…/passe4/captures/p4a*`, `voies/dh4a/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-une-question ; mots ; controle-choix (règle n° 1 : écran ouvert, rien dans la maquette) | brasseur | passe 4 |
| dh4b | D34 : Dryhopper, passe 4 sur a1, chaudes (p4b1 à p4b5), en Fable | conception | concepteur | fable | 110 | `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4b*/**`, `…/passe4/captures/p4b*`, `voies/dh4b/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-une-question ; mots ; controle-choix (règle n° 1 : écran ouvert, rien dans la maquette) | brasseur | passe 4 |
| e1-etalonnage | L27 : ses verdicts du 23 et du 24.10 versés au jeu d'étalonnage, épreuve rejouée avant les tris D125 | jugement | auteur | sonnet | 70 | `work/refonte-frontend/v4/etalonnage/jeu.json` (ajouts), `…/etalonnage/epreuve/**`, `voies/e1-etalonnage/RESULTAT.md` | p22 | jeu (node), note | pilote | — |
| fl-a | D125 : la liste de la fiche, série a, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/fla[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/fla*`, `voies/fl-a/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| fl-b | D125 : la liste de la fiche, série b, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flb[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flb*`, `voies/fl-b/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| fl-c | D125 : la liste de la fiche, série c, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flc[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flc*`, `voies/fl-c/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| fl-d | D125 : la liste de la fiche, série d, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/fld[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/fld*`, `voies/fl-d/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| fl-z | D125 : la liste de la fiche, série z, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/BRIEF-AUTEUR.md` | conception | concepteur | fable | 100 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flz[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flz*`, `voies/fl-z/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (0 tiède, 8 chaude, 0 froide) |
| fl-u | D125 : la liste de la fiche, série u, série libre au brief minimal, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flu[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flu*`, `voies/fl-u/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| fl-tri | D125 : tri du panel v0 de la liste de la fiche (48), niveau mesuré par controle-panel, classement, candidates, greffes | jugement | critique | fable | 80 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/critique/**`, `voies/fl-tri/RESULTAT.md` | fl-a, fl-b, fl-c, fl-d, fl-z, fl-u, e1-etalonnage | SYNTHESE (Classement, Candidates, Greffes) ; controle-panel | pilote | tri |
| fl-passe2 | D125 : passe 2 de la liste de la fiche, les 5 candidates du conseil (fl-conseil) par les agents de leur série (SendMessage), tous les contrôles du lot | conception | concepteur | opus | 80 | `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/*b/**`, `voies/fl-passe2/RESULTAT.md` | fl-tri, fl-conseil | controle-commun ; controle-une-question ; mots ; controle-fiche-baseline ; controle-fiche-radar ; controle-teinte ; controle-choix (règle n° 1) | brasseur | passe 2 |
| sb-a | D125 : Substituer (u4 en plancher), série a, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-substituer/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/sba[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sba*`, `voies/sb-a/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| sb-b | D125 : Substituer (u4 en plancher), série b, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-substituer/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbb[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbb*`, `voies/sb-b/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| sb-c | D125 : Substituer (u4 en plancher), série c, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-substituer/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbc[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbc*`, `voies/sb-c/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| sb-d | D125 : Substituer (u4 en plancher), série d, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-substituer/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbd[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbd*`, `voies/sb-d/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| sb-z | D125 : Substituer (u4 en plancher), série z, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-substituer/BRIEF-AUTEUR.md` | conception | concepteur | fable | 100 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbz[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbz*`, `voies/sb-z/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (0 tiède, 8 chaude, 0 froide) |
| sb-u | D125 : Substituer (u4 en plancher), série u, série libre au brief minimal, huit concepts ; brief `work/refonte-frontend/v4/ecran-1/fils24-substituer/BRIEF-AUTEUR.md` | conception | concepteur | opus | 100 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbu[1-8]/**`, `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbu*`, `voies/sb-u/RESULTAT.md` | — | baseline : controle-commun --sans=mots ; controle-choix (règle n° 1 : rien dans la maquette) | brasseur | v0 ×8 (3 tiède, 3 chaude, 2 froide) |
| sb-tri | D125 : tri du panel v0 de Substituer (u4 en plancher) (48), niveau mesuré par controle-panel, classement, candidates, greffes | jugement | critique | fable | 80 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/critique/**`, `voies/sb-tri/RESULTAT.md` | sb-a, sb-b, sb-c, sb-d, sb-z, sb-u, e1-etalonnage | SYNTHESE (Classement, Candidates, Greffes) ; controle-panel | pilote | tri |
| sb-passe2 | D125 : passe 2 de Substituer (u4 en plancher), les 5 candidates du conseil (sb-conseil) par les agents de leur série (SendMessage), tous les contrôles du lot | conception | concepteur | opus | 80 | `work/refonte-frontend/v4/ecran-1/fils24-substituer/*b/**`, `voies/sb-passe2/RESULTAT.md` | sb-tri, sb-conseil | controle-commun ; controle-une-question ; mots ; controle-teinte ; controle-retour ; controle-annuler ; controle-choix (règle n° 1) | brasseur | passe 2 |
| fl-conseil | « Faire intervenir le conseil aussi pour la partie création » (24.10) : conseil rapide (six regards, Brasseur en Fable, président Opus) sur la liste de la fiche après le tri : il conteste le classement, choisit les 5 candidates et les greffes ; le brasseur voit tout | jugement | conseiller | sonnet | 30 | `work/missions/2026-10-23-maquette-parcours/conseil-fl/**`, `voies/fl-conseil/RESULTAT.md` | fl-tri | verdict en cinq parties (note) | pilote | — |
| sb-conseil | « Faire intervenir le conseil aussi pour la partie création » (24.10) : conseil rapide (six regards, Brasseur en Fable, président Opus) sur Substituer après le tri : il conteste le classement, choisit les 5 candidates et les greffes ; le brasseur voit tout | jugement | conseiller | sonnet | 30 | `work/missions/2026-10-23-maquette-parcours/conseil-sb/**`, `voies/sb-conseil/RESULTAT.md` | sb-tri | verdict en cinq parties (note) | pilote | — |
| dh4-conseil | « Faire intervenir le conseil aussi pour la partie création » (24.10) : conseil rapide (six regards, Brasseur en Fable, président Opus) sur Dryhopper, passe 4 après le tri : il conteste le classement, choisit les 5 candidates et les greffes ; le brasseur voit tout | jugement | conseiller | sonnet | 30 | `work/missions/2026-10-23-maquette-parcours/conseil-dh4/**`, `voies/dh4-conseil/RESULTAT.md` | dh4a, dh4b | verdict en cinq parties (note) | pilote | — |

Dérogation M13 : d126-critique : « Pas besoin d'autant, représente moi aussi les mini maquettes déjà faites pour ces vues. Je dirais 11 par vue » (24.10, soir ; D126 : huit concepts neufs par vue, plus les trois déjà faits ; ni éventail de 48, ni passe 2 ; le critique juge chaque concept avant qu'il le voie).

Dérogation M13 : d131-critique : « Pas besoin d'autant, représente moi aussi les mini maquettes déjà faites pour ces vues. Je dirais 11 par vue » (24.10, soir ; repris pour le petit lot de pictos D131 : huit jeux de quinze pictos et du picto « en plus », demandés « Peut être » ; ni éventail de 48 ni passe 2 ; le critique juge chaque jeu).

Dérogation M13 : rc-critique : « Pas besoin d'autant, représente moi aussi les mini maquettes déjà faites pour ces vues. Je dirais 11 par vue » (24.10, soir ; repris pour le lot « recherche avancée » qu'il demande : « Ensuite fait un artefacts de mini maquettes pour de la recherche avancée de houblons. » ; douze concepts en trois séries, ni éventail de 48 ni passe 2 d'office ; le critique juge chaque concept).

Dérogation M13 : leg-critique : « Bien mais mettre la légende juste en dessous des pastilles. Fait moi des mini maquettes de ça dans un artefacts » (24.10, soir ; un petit lot de huit légendes, ni éventail de 48 ni passe 2 d'office ; le critique juge chaque variante).

legz2 écartée : elle remplace la bande de sa base par des pictos sur deux cartes sur quatre (D83, D105, règle n° 1) ; montrée quand même, marquée, sur la planche des légendes (L27 : rien ne lui est caché sur la seule foi du critique).

Dérogation M13 : dg-critique : « Faire des mini maquettes du dryhopping avec mes feedback » (24.10, soir ; avec « Je dirais 11 par vue » du même soir : douze variantes en trois séries sur sa p4b2f, ni éventail de 48 ni passe 2 d'office ; le critique juge chaque variante).

Dérogation M13 : cm-critique : « Refait une série avec ça et mes commentaires sur toutes les maquettes comparé et mes commentaires sur la maquette de base sur cette vue » (25.10 ; trois séries de quatre sur la base jouable, le critique juge chaque variante).

Dérogation M13 : rp-critique : « Faire des version r6a ++ avec tout les commentaires du dryhopping » (24.10, soir ; avec « Je dirais 11 par vue » du même soir : douze variantes en trois séries sur sa r6a, ni éventail de 48 ni passe 2 d'office ; le critique juge chaque variante).

cmz1 à cmz4 écartées : elles perdent Biotransformation, Enchaîner et le panel OSU de sa base (D22, D96) ; montrées marquées sur la planche.

rpa1 écartée : « ses mots » au premier écran, qu'il trouvait inutiles (« ce texte là est inutile ») ; montrée marquée sur la planche.

dga4 écartée : des jours de cuve chiffrés qui ne viennent pas du moteur (honnêteté) ; montrée marquée sur la planche.

## Agents (24.10) — l'agent de chaque série fait sa passe 2 (SendMessage)
fl-a a8c5f7e0d32261f36 ; fl-b a4ead6849b2b323a5 ; fl-c a0704f0045129d1c8 ; fl-d a3013a7e47611d7e3 ; fl-z afc100b2d937e62ba ;
fl-u ae528f8f496d0dd59 ; sb-a a044770567ed230d2 ; sb-b a8ccd7c02df1405fb ; sb-c a91947513ec3ec00f ; sb-d aa8295f7fe8bc2428 ;
sb-z a25c1b996e40ec8b1 ; sb-u a4daa06f45d93aa5b ; e1 a7c108234cb9656c8 ; dh4a a013463c187a07a34 ; dh4b aa2bba31019b7a234 ;
p24 a893b35e28274ce36 ; r1 a91adcd1f7bd093c6 ; r2 a55a6a31ce25fd388 ; r3 a3747e39a4b6451ce ; r4 a566c86b70c15b04b ;
r5 ab3ea7c3209d1f1e7 ; épreuve du critique a791dcdd88b387f6f. r6 à lancer dès qu'une place se libère (20 agents au plus en même
temps).

Chemins de « Possède » : relatifs à la racine du dépôt ; `voies/…` est relatif au dossier de cette mission.

## Pages
Une version, un artefact (`work/refonte-frontend/v4/outils/pages/PUBLIER.md`).

| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Maquette jouable | parcours de bout en bout, construction d332792c ; 23.10 | https://claude.ai/artifact/52UBb4F7iME2k3ZzsAv4x1 | `work/refonte-frontend/v4/outils/pages/2026-10-23-maquette/index.html` |
| Maquette jouable | version D107 à D121, construction 5345f6ad ; 24.10 | https://claude.ai/artifact/2BktuZzij8q2DAsrxQS5iX | `work/refonte-frontend/v4/outils/pages/2026-10-24-maquette/index.html` |
| Côte à côte | sa base et la maquette, 12 états à 390 px, et le choix D121 ; 24.10 | https://claude.ai/artifact/Q8H8dx98NhqibJkJzv1isW | `work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/index.html` |
| D121, entrer dans l'analyse | trois variantes en mini maquettes, à côté de sa base ; 24.10 | https://claude.ai/artifact/6V21JEc5CqsjpLWrp184be | `work/refonte-frontend/v4/outils/pages/2026-10-24-d121/index.html` |
| Choix de vues | sept choix ouverts côte à côte avec leur référence, et les deux panels de 48 ; 24.10 | https://claude.ai/artifact/5nrApsrrY7yhnqK1gU7wYp | `work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/index.html` |
| Planche Dryhopper | a1 et les onze de la passe 4, côte à côte (D126) ; 24.10 | https://claude.ai/artifact/ULZkzFyvgc3Chv6hmYDWA7 | `work/refonte-frontend/v4/outils/pages/2026-10-24-planche-dryhopper/index.html` |
| Planche Substituer | u4 et onze vues à greffer (D126, D127) ; 24.10 | https://claude.ai/artifact/QVfyarrN8m68dTvnq2PF4X | `work/refonte-frontend/v4/outils/pages/2026-10-24-planche-substituer/index.html` |
| Planche de la fiche | g1 et onze vues de la liste (D126) ; 24.10 | https://claude.ai/artifact/2vUzuyzUpsShrYnkp1PUPZ | `work/refonte-frontend/v4/outils/pages/2026-10-24-planche-fiche/index.html` |
| Planche des graphes | six graphes côte à côte, deux lectures chacun (D126) ; 24.10 | https://claude.ai/artifact/JSiBVNWUJqJD8zdkvpKN9t | `work/refonte-frontend/v4/outils/pages/2026-10-24-planche-graphes/index.html` |
| Planches | toutes les vues à choisir sur une page, dans sa disposition (une rangée par vue, vignettes serrées) ; 24.10 | https://claude.ai/artifact/X1RqagDtEqS4L2yZ63PFBy | `work/refonte-frontend/v4/outils/pages/2026-10-24-planches/index.html` |
| Pictos hors 16D | huit jeux (pha, phz) en deux passes, critique d131 ; Comparer, Galaxy face à Saaz, la fiche, la planche ; 24.10, soir | https://claude.ai/artifact/Y7jV3JyYZw3VdPmDittgwW | `work/refonte-frontend/v4/outils/pages/2026-10-24-pictos-hors16d/index.html` |
| Maquette jouable | le soir du 24.10 : Dryhopper p4b2f, fiche flb5b (pied flu2b, exhaustive, radar en pics), Suggérer gr5, Comparer r6a, Substituer u4e5, entrée B ; BATTERIE 42/42, ETATS 141/141, critiques 110/111 | https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN | `work/refonte-frontend/v4/outils/pages/2026-10-24-maquette-reprise/index.html` |
| Toutes les mini maquettes | 1 172 mini maquettes en 54 lots depuis le 17.10, ses choix marqués ; 24.10, soir | https://claude.ai/artifact/HEiJX4ipJhYUXwnrgizkSd | `work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/index.html` |
| Dryhopper, tout | 96 mini maquettes de Dryhopper depuis le 19.10, sa p4b2f en tête ; 24.10, soir | https://claude.ai/artifact/VXa3fDxdzm9eWxPBsD8Pvf | `work/refonte-frontend/v4/outils/pages/2026-10-24-dryhopper-tout/index.html` |
| Recherche avancée | douze concepts (rca, rcb, rcc), critique rc : 12 acceptés ; 24.10, soir | https://claude.ai/artifact/3A9jrMwgFK2feHWKkr4t2w | `work/refonte-frontend/v4/outils/pages/2026-10-24-recherche-avancee/index.html` |
| Dryhopper, tes retours | douze greffes sur la base jouable (frise y1b, trois plans w2, cuve x3b), critique dg : 11 acceptées, dga4 écartée et montrée ; 24.10, nuit | https://claude.ai/artifact/4dnWwTDjKjZoPmngX7GTvm | `work/refonte-frontend/v4/outils/pages/2026-10-24-dryhopper-retours/index.html` |
| Comparer r6a++ | douze versions de Comparer sur r6a avec ses retours (moment, frise y1b, trois plans w2, cuve x3b, différences), critique rp : 11 acceptées, rpa1 écartée et montrée ; 24.10, nuit | https://claude.ai/artifact/WJBxNSr9CCDVBy8jbJXpDC | `work/refonte-frontend/v4/outils/pages/2026-10-24-r6a-plus/index.html` |
| Maquette | 25.10 : légende v2a avec les barres de v2e (D140), houblon inconnu sans plantage (#160) ; BATTERIE 45/45 hors app-intacte adaptée, ETATS 141/141 | https://claude.ai/artifact/HP2He7tNjqPMsAHSCtrRgx | `work/refonte-frontend/v4/outils/pages/2026-10-25-maquette/index.html` |
| Comparer, depuis ta base | douze versions sur l'écran Comparer de la maquette jouable (D141), le moment au choix ; critique cm : 8 acceptées, cmz1 à cmz4 écartées et montrées, tête cmb2 ; 25.10 | https://claude.ai/artifact/8tFBhx1DYEybS8tvNw1B8V | `work/refonte-frontend/v4/outils/pages/2026-10-25-comparer/index.html` |
| Légendes sous les pastilles | huit variantes (leg, legz), critique : 7 acceptées, legz2 écartée et montrée ; 24.10, soir | https://claude.ai/artifact/TeKjPQDVHmxSwwMhGLWkKH | `work/refonte-frontend/v4/outils/pages/2026-10-24-legendes/index.html` |
| Légendes v2 | passe 2 : cinq versions de leg3, v2 de leg1, leg2, leg4 ; 8 acceptées ; 24.10, soir | https://claude.ai/artifact/QFyJ5vPu2cLho29yCtUyQn | `work/refonte-frontend/v4/outils/pages/2026-10-24-legendes-v2/index.html` |

## Boucle de retour
- Un critère rouge : l'agent corrige dans sa voie, 3 essais. Au-delà, SendMessage au même agent avec le défaut
  précis (2 relances), puis le pilote réécrit le contrat.
- Un écran rejeté par le critique : relancé (même agent) ou écarté, jamais laissé en plan (M12).
- Son choix sur Dryhopper (b4, d8, e5 ou g1 au lieu de a1) : une `reprise` de l'écran concerné par le même
  concepteur, dans le socle inchangé.
- Sa plainte : SPEC-BRASSEUR mot pour mot, une ligne dans DEFAUTS-RECURRENTS, et un contrôle qui échoue sur la
  version rejetée, ajouté au parcours.

## État de reprise (23.10, soir)
- Fait et vérifié : p0 socle ; p1 étape Houblons et onglet Ma bière de la base v4.10, fiche, Substituer, rail de la
  frise (RAIL OK) ; p2 Suggérer de q2b ; p3 Comparer de r6a (CHOIX OK, 35 repris) ; p4 Dryhopper a1 et Levure (RAIL OK
  à 60′, 45′, 120′) ; p5 parcours complet (31 gestes, PARCOURS OK) ; p7 relecture d'implémentation (prêt avec
  réserves). Règle n° 1 (CLAUDE.md, SPEC § 0, agents), registre `v4/choix/ecrans.json`, `controle-choix.mjs` (D105).
- En cours : batterie finale sur `maquettes/parcours` (CHOIX, RAIL avec cas-ebu45, cas-ebu120 et cas-k3, ROUTES,
  PONTS, PARCOURS) ; puis p6 critique (Fable) sur les captures de p5, côte à côte avec ses maquettes.
- Publication : par la supervision, dans un artefact neuf, seulement après CHOIX OK et PARCOURS OK ; son adresse
  entre dans « ## Pages ».
- Ensuite : p8-portabilite (phase 1 de #143), lancée à la remise à zéro de la fenêtre de 5 h (85 % à 16 h 18 UTC).
  Puis la vraie intégration, au feu vert du brasseur (porte B).
- Choix encore ouverts (registre) : Dryhopper (a1, b4, d8, e5, g1), Substituer (porte ou outil), Levure (étape ou
  outil). Thème : tranché par lui (#144, le clair des maquettes pour toute l'app ; mission de la supervision).

### Reprise après la remise à zéro de la fenêtre de 5 h (97 % à 16 h 31 UTC, remise à 18 h UTC)
Publication suspendue (supervision), jusqu'à : D55 corrigé, batterie verte avec TEINTE OK 5/5, p6 sans REJET.
1. p1 (même agent) : D55 en cours (vide au repos sous la carte de Nugget) ; puis bannir sans effet sur l'onglet Ma
   bière (D32, p6) ; puis la fiche reprise de g1 (base/captures/consolide-fiche-390.png : feuille presque pleine, α en
   plage avec lot et jauge, familles et mots dans un bloc gris, sans famille, non décrites, grand radar légendé,
   « + Floral − Résineux », ♡ ⊘ et Comparer ; pictos au trait D93) avec un inventaire g1 au registre, et la fiche à
   1280 dans le cadre (D10, p6).
2. p4 : Levure à moitié vide (D4, p6).
3. p2 : cartes d'objectif à la hauteur de q2b (TEINTE suggerer : teinte 12 contre 4).
4. Batterie finale : construire, controle-choix, controle-teinte (TEINTE OK 5/5), controle-rail, routes, ponts,
   parcours-complet, app-intacte ; puis p6 (même agent) ; puis message à la supervision pour publier.
5. p8-portabilite (phase 1 de #143), cases de #143 cochées à mesure.

### Reprise D107 (23.10, nuit) : Comparer aux étapes, à la manière de x3b
- Ses mots : SPEC § 1 « Comparer aux étapes, avec une référence » ; D107. Sa source : x3b (lot 21), pas le Comparer de la
  base v4.10 (barré). Registre : écran comparer, 3 compléments ; inventaire : 3 éléments « d107- » (52).
- Version rejetée : la construction publiée d332792c, rassemblée dans `prototypes/houblons-v4/maquettes/parcours-d332792c/`
  (assets lus sur l'artefact) : CHOIX ECHEC sur Comparer (les éléments d107 absents).
- Voies : p9-controle-etapes (auteur) et la reprise de p3 (concepteur), en même temps, sur un même contrat de marqueurs ;
  puis la batterie (CHOIX, TEINTE 5/5, COMMUN, COMPARER-ETAPES, RAIL, ROUTES, PONTS, PARCOURS), p6 (critique) sur
  Comparer, et un artefact neuf (`outils/pages/2026-10-24-maquette/`).
- D108 à D110 confiés par la supervision pour la même version (un seul artefact neuf) : p10 à p12 écrivent les contrôles ;
  p1 reprend la visée (D108), p2 les traits de Suggérer (D110) et le retour des outils (D109).
- État au 23.10, 23 h 15 (version D107 à D121, un seul artefact neuf) :
  - contrôles écrits et rejoués par le pilote, tous en échec sur d332792c : p9 (D107, D114) 11/11, p10 (D108), p11 (D109,
    D118, D119) 8/8, p12 (D110) 8/8, p13 (D111, D112 A9, D113, D121) 7/7, p14 (D115, D116) 6/6, p15 (D120) 7/7 ;
    commits 2c2d58cc, 6c220537 ;
  - reprises : p3 Comparer fini (x3b, Nugget en référence, panel OSU replié ; commit 0da46e5b) ; p1 D108 fini (visée de la
    base ; 16 voies au lieu de 1), puis l'étape Houblons en cours (D111 à D113, D116, D121 en variantes) ; p2 Suggérer
    (D117 sur consolide-b, D110, en-tête commun et croix D109, D118, D119) en cours ; p17 fiche (D115) et Annuler (D120)
    en cours ; p18 la page côte à côte (outil captures-cote-a-cote.mjs) en cours ;
  - scripts du parcours alignés sur D118 (la croix ramène à l'étape) : PONTS OK, PARCOURS OK sur parcours-p3 ;
  - décisions du pilote : D114 = panel replié au repos ; D112 = contrôle sur le nom (la base), carte entière non
    sélectionnable dans la maquette ; D115 = radar d'abord, variantes de la liste plus tard (accord supervision) ;
  - 24.10, nuit : toutes les reprises rendues (p1 étape, p2, p3, p17) ; batterie sur maquettes/parcours :
    **BATTERIE OK 28/28** (`node prototypes/houblons-v4/parcours/outils/batterie.mjs` : CONSTRUIT, TYPES, APP INTACTE,
    CHOIX OK 5 + 3 ouverts, TEINTE OK 5/5, COMMUN ×7, RAIL OK 2/2, COMPARER-ETAPES, VISEE, RETOUR ×2, TRAITS, GESTE-ETAPE,
    APPUI-ETAPE, LEGENDE, FICHE-RADAR, STEPPER, ANNULER, PROFIL, ROUTES 8/8, PONTS, PARCOURS 29 + 29) ; page côte à côte
    recapturée (12 états, PAGE OK) ; p6 critique lancé ;
  - reste (avant) : batterie sur la construction commune (construire, CHOIX, TEINTE, COMMUN, RAIL, ROUTES, PONTS, PARCOURS et les
    contrôles D107 à D121), p6 critique côte à côte, page côte à côte envoyée à la supervision (son OK avant
    publication), artefact neuf, version figée dans outils/pages/2026-10-24-maquette/ (publie.html et assets), note
    cerveau/produit/maquette-jouable.md, portées à normaliser (suggerer → suggestions, biere → ma-biere, sujet
    substituer dans systeme.mjs, puis les G5 des voies p10 à p12 et p15).

## Budget
Avant (23.10, après-midi) : 5 h à 11 %, semaine à 52 %, Fable à 29 %. Plafond visé : 5 h sous 80 %.

## Sources
- `work/refonte-frontend/v4/ecran-1/fils22-carte/NOTE.md` — la carte : écrans, questions, facteur libre, ponts
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html` — Comparer choisi (« r6a reste le meilleur »)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/a1/etat.html` — Dryhopper, base a1
- `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/q2b/NOTE.md` — Suggérer choisi (q2b), intégré dans `work/refonte-frontend/v4/ecran-1/base/consolide/` (v4.10)
- `work/refonte-frontend/v4/ecran-1/base/consolide/fiche.html` — fiche g1
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/noyau.mjs` — la baseline l8g
- `prototypes/houblons-v4/ENGINE.md` — le moteur v4 et son API
- `prototypes/houblons-v4/ecran/vite.config.ts` — la construction qui importe l'app sans la modifier
- `cerveau/produit/acquis-valides.md` — les acquis à garder
- `DESIGN.md`, `docs/ui-compacte.md`, `PRODUCT.md`, `.claude/rules/affinee-frontend.md`

## Signature

Rejeu du pilote (23.10, nuit), `node scripts/agents/systeme.mjs voies work/missions/2026-10-23-maquette-parcours --approuver` :
**VOIES OK 9/9** (p0 à p8).

- **Livré** : la maquette jouable de bout en bout, publiée à https://claude.ai/artifact/52UBb4F7iME2k3ZzsAv4x1 (construction
  d332792c). Ses écrans sont ceux qu'il a choisis : l'étape Houblons et l'onglet Ma bière de la base v4.10, q2b, r6a, a1,
  la fiche g1 et Substituer en porte.
  - Contrôles : CHOIX OK (5 conformes, 3 ouverts), TEINTE OK 5/5, RAIL OK, PARCOURS OK 31+31.
  - Critique : 8 ACCEPTÉ.
  - Puis la maquette rendue portable (p8, phase 1 de #143), sans que rien ne change à l'écran.
- **Ses mots, et ce qu'ils ont produit** :
  - « Mais ça semble pas du tout correspondre aux choix que j'ai fait de maquette de base ??? » : D105 ;
  - « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur » : la règle n° 1 (CLAUDE.md, SPEC § 0,
    agents), le registre `v4/choix/ecrans.json` et `controle-choix.mjs`. `systeme.mjs mission` refuse désormais un
    écran montré sans ce contrôle (supervision) ;
  - « Pourquoi c'est en thème pastel horrible ??? » : D106, `theme-maquettes.css` et `controle-teinte.mjs` (supervision) ;
  - D55 revenu au rail : controle-rail le garde désormais (supervision).
- **Décisions** :
  - pilote : le code à côté de l'app ; la persistance en mémoire ; `controle-autres-ajouts` écarté pour Comparer ;
    l'α inconnu, facultatif à l'intégration ;
  - brasseur : r6a, q2b, base v4.10 (D105) ; le thème de ses maquettes (D106, #144).
- **Leçons** : L03 enrichie (une maquette choisie est la base ; D105, D106). Les leçons proposées par les voies sont
  traitées : l'écran du dessous lu par les contrôles l'est dans le socle (Ma bière démontée sous un outil) ; un document
  d'implémentation se confronte au code de l'app, ce que p7 a fait et p8 corrigé.
- **Reste** :
  - à lui : Dryhopper (a1, b4, d8, e5, g1), Substituer (porte ou outil), Levure (étape ou outil), puis la porte B ;
  - à faire : #143, B6 (atelier V5.5 remplacé ou gardé) et B9 à B11 ; rendu d'écran 93 à 118 ms contre 100 ms ;
  - à l'utilisateur : le push des commits locaux.

### Version D107 à D121 (24.10, nuit)

Rejeu du pilote, `node scripts/agents/systeme.mjs voies work/missions/2026-10-23-maquette-parcours --approuver` :
**VOIES OK 18/18** (p0 à p18 ; p16 non attribuée).

- **Livré** :
  - la maquette https://claude.ai/artifact/2BktuZzij8q2DAsrxQS5iX (construction 5345f6ad), figée dans
    `work/refonte-frontend/v4/outils/pages/2026-10-24-maquette/` ;
  - la page côte à côte https://claude.ai/artifact/Q8H8dx98NhqibJkJzv1isW (publiée par la supervision) ;
  - les preuves :
    - `outils/batterie.mjs` → BATTERIE OK 31/31 ;
    - critique p6 : 8 ACCEPTÉ, 0 REJET, après corrections ;
    - rejeu de la supervision : 31/31 et 19 gestes.
- **Ses mots, et ce qu'ils ont produit** : quinze commentaires sur d332792c, D107 à D121 (SPEC § 1, DEFAUTS-RECURRENTS).
  Chacun a son contrôle, qui échoue sur d332792c :
  - comparer-etapes (D107, D114) ; visee (D108) ; retour, dont `--fiche` (D109, D118, D119) ; traits (D110) ;
  - geste-etape (D111) ; appui A9 (D112) ; legende `--etape` (D113) ; fiche-radar (D115) ; stepper (D116) ;
  - choix, avec l'inventaire q2b complété (D117) ; annuler (D120) ; profil-ouvre (D121) ;
  - hauteur (D5, rendu vivant ; l'étape à 1,04 écran).
  Sur la capture barrée du Comparer v4.10 : « Non pas cette version, une version du dryhopping, dans un des top » → la
  source de D107 est x3b (lot 21).
- **Décisions** :
  - brasseur : x3b pour les étapes de Comparer ; la croix (D109, « Juste une croix bien positionné ») ;
  - supervision : D118 (retour à l'étape) ; trois ajouts rapides comme sa base ; publication après sa page côte à côte ;
  - pilote :
    - D114, panel replié au repos ;
    - D112, contrôle sur le nom comme la base, carte entière non sélectionnable dans la maquette ;
    - D115, radar d'abord, variantes de la liste plus tard ;
    - D117, « ? » gardé (D89, D113), `controle-une-question --regle-n1` ;
    - mots de l'étape et de Dryhopper comptés hors données, au plus sa base + 6 et d332792c + « Annuler », et hors
      en-tête de l'app (`--sans-coquille`) ;
    - Dryhopper, Annuler à côté de « Puis la levure › » ;
    - Ma bière, « surtout Nugget » retiré.
- **Leçons** : L03 enrichie (« comme la maquette de base » lu base v4.10 ; c'était x3b, notée pour cela).
  Les leçons suivantes restent à intégrer par la supervision, car la charge est au plafond (30 000 caractères) :
  - LEÇON PROPOSÉE : un composant de l'app réemployé (le `Sheet` et son « × » de 16 px) apporte ses propres boutons. Ils
    échappent aux contrôles écrits pour les routes. Une plainte sur un genre d'élément (« bouton retour ») se contrôle
    sur tous les éléments de ce genre, composants de l'app compris (critique p6).
  - LEÇON PROPOSÉE : M10 est revenu deux fois cette nuit : le `\b` de controle-annuler, devenu 0x08 ; un critère du
    pilote dont l'échappement s'est perdu, et dont le message d'erreur, qui recopiait le code, contenait le jeton
    attendu : faux vert.
    - Une voie qui écrit un contrôle rejoue `systeme.mjs cablage` dans ses GATES.
    - Le jeton attendu d'un critère ne doit pas figurer dans le texte de sa commande ; gate-lint pourrait le refuser.
  - LEÇON PROPOSÉE : une voie qui touche un écran porte dans ses GATES tous les contrôles qui gardent cet écran. p17
    n'avait pas le rail de Dryhopper : régression D35, vue seulement par la batterie. `systeme.mjs mission` ne rejuge pas
    une voie déjà contractée ; une reprise ajoutée devrait l'être.
  - LEÇON PROPOSÉE : un critère n'écrit jamais dans un livrable. Le G1 de p18 recapturait dans les images de la page
    publiée ; il écrit désormais dans un dossier d'essai.
- **Reste** :
  - au brasseur :
    - son choix D121 (A, B ou C ; la version porte A) ;
    - les variantes de la liste de la fiche (D115, à faire) ;
    - l'effet attendu de l'appui long (D112, question dans le fil) ;
    - Dryhopper, Substituer et Levure (#145, #146) ;
    - la porte B ;
  - à faire :
    - normaliser les portées de `portee-defauts.json` : « suggerer » devient « suggestions », « biere » devient
      « ma-biere », et le sujet « substituer » s'ajoute à `systeme.mjs`. Les critères G5 de p10 à p12 et p15 suivront ;
    - les réserves reportées (`cerveau/produit/maquette-jouable.md`) ;
  - à l'utilisateur : le push des commits locaux.

### Suite (24.10, matin) : état de reprise

- **D123, le rail côté froid** (son message, SPEC § 1, DEFAUTS ; commit 8576066f). Cause trouvée : `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/Frise.tsx` (l. 4-5, « dry hop en jours, comme
  Dryhopper ») et `…/ma-biere/Carte.tsx` (l. 34, « dry hop ») ont pris l'échelle et les mots de Dryhopper (choix ouvert)
  depuis c62ad129 (23.10, 18 h 23). Reproduit sur la version publiée (glisser Nugget vers la post-fermentation) :
  pendant, carte entière en haut, jours « 3 j, 4 j, 5 j, 7 j » qui débordent sur « Ajouter » et Cascade ; après,
  « dry hop », « ? IBU », « 4 j ». Sa base : `work/refonte-frontend/v4/ecran-1/base/captures/v4-geste-fermentation-1-avant.png`,
  `…-2-pendant.png`, `…-3-apres.png`, `consolide-nugget-p14-620-pendant.png`, et `work/refonte-frontend/v4/ecran-1/base/BRIEF-RAIL.md` :
  carte en puce, J+0 à J+14 réguliers dans la hauteur du repos, « à froid », « aucun IBU », J+n et −/+, « biotransformation
  possible, non quantifiée ».
  - À faire : contrôle d'abord (auteur) : `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs` en mode froid (whirlpool, fermentation,
    post-fermentation), qui passe sur la base et échoue sur la construction 5345f6ad ; inventaire-etape.json complété du
    côté froid ; puis reprise de l'étape (concepteur), côte à côte avec la base, et RAIL, GESTE-ETAPE, CHOIX.
- **Thème sombre** sur son téléphone : l'enveloppe (`work/refonte-frontend/v4/outils/pages/2026-10-24-maquette/index.html`) ne pose « clair » que si
  rien n'est posé ; l'hôte pose son thème. À corriger dans la prochaine enveloppe : toujours « clair » (D106).
- **D122** (la pastille « ~ simulé », confié par la supervision) et **D115** (2 ou 3 variantes de la liste de la fiche,
  page à part) : à faire, protocole habituel (contrôle d'abord, concepteur, critique).
- **Règle** (son message, SPEC § 1, CLAUDE.md règle n° 1) : un choix qu'on lui demande se montre en mini maquettes dans
  un artefact neuf. D121 publié ainsi : https://claude.ai/artifact/6V21JEc5CqsjpLWrp184be (commit 8cbfa708).
- Pas de publication de la maquette avant ses réponses et l'OK de la supervision (même protocole que le 24.10, nuit).
- Construction rejetée pour D123 : rassembler `prototypes/houblons-v4/maquettes/parcours-5345f6ad/` depuis les assets figés
  de `work/refonte-frontend/v4/outils/pages/2026-10-24-maquette/` et les pages de route de `prototypes/houblons-v4/maquettes/parcours/`
  (comme parcours-d332792c).
- Budget au 24.10, 08 h : 5 h à 7 %, semaine à 86 % (remise le 29.10) ; contexte du pilote à 89 %.
- Exigences de la supervision pour la prochaine version (10d09c27) :
  - page côte à côte : tous les états de geste que sa base montre en captures, pris par `captures-cote-a-cote.mjs`
    depuis `work/refonte-frontend/v4/ecran-1/base/captures/` (ébullition : `consolide-nugget-*-pendant`, `consolide-glisser-60-*`,
    `consolide-glisser-120-*` ; whirlpool : `consolide-nugget-wp75-pendant` ; froid : `v4-geste-fermentation-*`), pour ne plus
    en oublier ;
  - enveloppe : `data-theme="clair"` posé toujours ; vérifié au rejeu en émulant `prefers-color-scheme: dark` ;
  - D123 reprend sa base : pas de mini maquettes (ce n'est pas un nouveau choix). Ordre : D123, puis D122 et D115.
  - La supervision rejouera elle-même le glisser côté froid avant son OK.

### État de reprise (24.10, après-midi)
- Fait et rejoué par le pilote : p19 à p24 (contrôles et relevés) ; reprises r1 (rail 37/37, froid, 15 états), r2 (15/15, CHOIX
  OK), r3 (fiche, 13 + 3 appuis posés par r1), r4 (15/15, CHOIX OK), r5 (18/18), r6 (u4, 14/14, CHOIX OK) ; registre Substituer
  « choisi u4 » (D34) ; conseil complet D125 (D34), avis croisé (D35), conseil dans la création (D36), étalonnage (D37), passe 4
  de Dryhopper (11 ACCEPTÉ, conseil rapide, D38 ; retouches faites par dh4a, dh4b en cours) ; lot liste de la fiche (48 v0, tri,
  conseil rapide : candidates flb3, flc8, fld8, flu2, fla5 sur Nelson Sauvin ; passe 2 en cours) ; lot Substituer (48 v0, tri :
  sbc1, sbc3, sbb7, sbu7, sbz7 ; conseil rapide en cours).
- En cours : batterie sur la construction commune (sortie dans le scratchpad du pilote, `batterie-d124.txt`) ; critique des six
  reprises à lancer après la batterie ; page côte à côte de tous les états de geste de sa base ; puis les deux artefacts neufs
  (maquette complète, et « Choix de vues » : passe 4 de Dryhopper, D121 A/B/C, liste de la fiche, Substituer, pastille, levure,
  planche des graphes).
- Restent à faire : pastille « ~ simulé » (3 mini maquettes, sur Comparer rendu), groupe levure de Suggérer en variantes (D35),
  planche des graphes (Q4) ; tickets et push sur accord de l'utilisateur.

### Arrêt sur limite d'usage (24.10, soir)
- Fini et rejoué : reprises r1 à r6 (chacune dans sa sortie) ; Dryhopper passe 4 prête (11 ACCEPTÉ, tête p4a4, p4b2, p4a3, p4b3, p4a2) ;
  liste de la fiche : flc8b, flu2b, fld8b ACCEPTÉ, flb3c et fla5c (passe 3) et flu6b à faire juger (critique relancé) ; Substituer :
  sbc1b, sbb5b ACCEPTÉ, sbz7c, sbz6c, sbb7c en passe 3 (agents stoppés, à relancer).
- Interrompus (à relancer par SendMessage ou un agent neuf) : r7-batterie (construction commune 23/31 : FICHE dryhopper et levure,
  MOTS étape, RAIL, RETOUR, PONTS Idaho 7) ; jc-pastille, jc-levure, jc-graphes ; critique de la passe 3 de la liste ; passe 3 de
  Substituer (sbz7c, sbz6c, sbb7c).
- Puis : batterie verte, critique des six reprises, page côte à côte, les deux artefacts neufs (maquette complète ; « Choix de vues »).
- Accords de l'utilisateur en attente : push (≈ 90 commits locaux), tickets (`work/refonte-frontend/tickets-2026-10-24.md`).

### Reprise après la limite (24.10, fin d'après-midi)
- Publié : « Choix de vues · 24.10 » (https://claude.ai/artifact/5nrApsrrY7yhnqK1gU7wYp, PAGE OK, ligne dans « ## Pages »).
- r7 rendu : BATTERIE OK 33/33 sur `maquettes/parcours` ; ETATS 113/117. Pilote (D39) : m4 joué depuis les barres (passe),
  y1b `attend_choix: dryhopper` (D123), traits de q2b rendus (contour, orange hors style), `parcours-fiche` reconstruite depuis
  le code commun (r3 : ETATS OK 16/16). Reste : `etat-etape-dose-plus` et `-moins` dépassent 180 s dans le rejeu complet seul,
  passent avec `--ecran=etape` (15/15, 23 s) : diagnostic en cours (`ETATS_TRACE=1`).
- `controle-etats.mjs` : `--captures=<dossier>` et `--avec-voulus` (une capture par état, pour la page côte à côte et la
  critique), `attend_choix`, `ETATS_TRACE`. Signature : s1-lecons appliqué (D39).
- Ensuite : captures des 128 états sur `maquettes/parcours` (`outils/pages/2026-10-24-etats/img/<id>-construite.png`) ; r8a,
  r8b, r8c (critique Fable, `voies/CRITIQUE-REPRISES.md`) ; écarts repris par le même concepteur (r7, SendMessage) ; page
  « États · 24.10 » (sa maquette | 5345f6ad | aujourd'hui) ; maquette complète dans un artefact neuf
  (`outils/pages/2026-10-24-maquette-reprise/`, enveloppe prête, thème clair forcé).

### Publication demandée (24.10, matin), mot pour mot
« Tu me mettra à jour la base en me publiant l'artefact complet de bout en bout avec les update. Et pour les choix de vue,
un artefacts annexe qui montre bien les différentes vue côté à côté ». Donc, après les reprises r1 à r6, leur critique et la
batterie (CHOIX, ETATS, FONCTIONS-RAIL, GESTE-ETAPE --froid, TEINTE, PARCOURS…) :
1. la maquette jouable complète, construction commune, dans un artefact neuf (enveloppe de `outils/pages/2026-10-24-maquette/`
   copiée sous une nouvelle date, `data-theme="clair"` toujours) ;
2. un artefact annexe « Choix de vues » : chaque choix ouvert en mini maquettes côte à côte avec sa référence (Dryhopper passe 4
   dh4a et dh4b à côté d'a1, D121 A/B/C, pastille « ~ simulé », liste de la fiche, groupe levure de Suggérer, planche des
   graphes), chacun avec son canal de retour (commentaire sur l'artefact, lu par cette session).
Publiés depuis la session « Houblons v4 maquette » : ses commentaires y seront lisibles (les artefacts du 23 et du 24.10 sont
sur un autre compte).

### D124 (24.10, 8 h) : fonctions et choix perdus
- Ses mots : « Ça a bien avancé mais le rail par exemple à perdu en fonctionnalités et certaines de mes choix ont été
  perdue » ; puis « Aide toi de sous agent. Je peux aussi lancé une autre session si il faut » (SPEC § 1, D124 ; commit
  40fab88d). Cause : les inventaires de ses maquettes ne relèvent que l'état au repos ; CHOIX OK et RAIL OK aveugles aux
  gestes et aux états.
- Lancées en même temps (auteurs Sonnet, 08 h 10) : p19 (D123, contrôle du côté froid), p20 (inventaire joué du rail de
  sa base, `controle-fonctions-rail.mjs`), p21a (états de l'étape hors rail, de Ma bière, de la fiche), p21b (états de
  Suggérer, de Comparer, de ses acquis). Version rejetée : `prototypes/houblons-v4/maquettes/parcours-5345f6ad/`.
- Ensuite (pilote) : relire les relevés et les captures côte à côte ; reporter les sorties de p19 dans la ligne D123 de
  la portée ; `controle-choix.mjs` rejoue les relevés `choix/etats/*.json` (contrôle d'abord, L13) ; reprise de l'étape et
  des écrans touchés par le concepteur (Opus), depuis sa base ; critique (Fable) côte à côte ; page côte à côte de tous
  les états ; artefact neuf (enveloppe toujours en clair). D122 et D115 après.


## Reprise (24.10, nuit)

- Mis à jour le 25.10 vers 7 h 30. Maquette publiée du 25.10 : https://claude.ai/artifact/HP2He7tNjqPMsAHSCtrRgx (légende v2a avec les barres de v2e, D140).
- Lot fils25-comparer (D141, D66) en vol : cma et cmb (concepteur opus), cmz (fable), cm-quand (contrôle `controle-quand-comparer.mjs`). Base de reprise = l'écran Comparer de la maquette jouable (`maquettes/parcours-cmp-base`, captures `fils25-comparer/captures/base-jouable*.png`, sa capture `brasseur-base-reprise.jpg`). Ensuite : rejouer `outils/variantes.mjs` et les GATES des séries, lancer cm-critique (contrat prêt), monter la planche (référence = base jouable et sa capture), la publier dans un artefact neuf, l'inscrire dans « ## Pages ».
- Planches du soir et de la nuit : Dryhopper (4dnWwTDjKjZoPmngX7GTvm, y1b et w2 greffés par erreur, marqué) ; Comparer r6a++ (WJBxNSr9CCDVBy8jbJXpDC, bâtie sur r6a, marquée) ; fils galerie fermés.
- Ouverts chez lui : radar r2 de Comparer (« À revoir, on va en parler ») ; choix de Dryhopper, Comparer, Levure.

## Signature (24.10, soir)

- Rejoué par le pilote (gate-check, sans croire les rapports) : r11 4/4, r13 5/5, r14 5/5, d131-pha 2/2, d131-phz 2/2, d131-critique 1/1 ; r15a et r15b G1/G2 (avis complets). `systeme.mjs voies` sur toute la mission non relancé ce soir (plus de 60 voies) : à faire en ouverture de la prochaine session.
- Construction commune : BATTERIE OK 42/42 (dont D127 à D133), ETATS OK 141/141, critiques Fable 110/111 reconnus (écart : etat-etape-ajout-rapide, D53).
- Décisions : D43 à D45 (le brasseur : p4b2f, levure de q2b, B) ; D46, D49 à D51, D53 (pilote) ; D47, D48, D52 (le brasseur : fiche exhaustive, pictos, radar en pics).
- Contrôles neufs : controle-fiche-exhaustive (D132), controle-radar-pics (D133), jeux.mjs (pictos), avis-complet.mjs (critiques).
- Leçon : L13 complétée (rejouer chaque critère sur HEAD avant la voie). CHARGE OK, CERVEAU OK.
- Ouvert : son choix de pictos (planche publiée) ; rendre mots, fiche et légende conscients d'une feuille ouverte (D49) ; captures d'états en pleine page sous le pli (D53) ; l'article de stock « Nuget » (orthographe du dépôt, montrée telle quelle) ; push des commits locaux et mise à jour des tickets : accord de l'utilisateur.
