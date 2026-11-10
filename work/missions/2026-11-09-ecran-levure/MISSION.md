# Mission 2026-11-09-ecran-levure — refaire l'étape « Levure 4/7 » de la création de recette

## Objectif
L'écran suivant du programme « refaire tous les écrans un à un », après Identité (r4-a) et Malts/sucres (s1 sur p6-b2). Ses mots du 09.11 :
« Ensuite fait moi des mini maquettes pour la partie levures. Avec le bon workflow » ; « Économie de token. Que pour la qualité !!! ».
L'entonnoir est allégé (D204) : 12 concepts v0 en 3 séries, un tri par le critique, puis une page publiée. La passe 2 vient après ses commentaires.

## Décisions
| Décision | Décideur |
|---|---|
| Lecture étroite de « la partie levures » : l'étape Levure 4/7 de la création de recette, suivante du programme (L01) | pilote |
| Jury rapide (Brasseur en Fable, Contradicteur en Opus), comme Malts/sucres | pilote |
| La dose est le cœur ; « ce que la levure change » est l'axe A4 (désaccord du jury, fiche) | pilote |
| La conduite s'écrit en une ligne résumée vers Paliers ; son propriétaire dans le code se tranche au port | pilote |
| Passe 2 (09.11, ses mots) : base r3 resserrée et sobre, r1 en second ; conduite = le graphe actuel tel quel (acquis) ; maquettes statiques ; vues Chercher, Comparer, Suggérer ; recherche classée offre CH/FR/DE puis fabricant européen ; donnée manquante touchée = recherche IA à confirmer | brasseur |
| p2l : les graduations du graphe de conduite comptent en données, pas en mots ; ressemblance 0,93 due aux éléments communs imposés, acceptée ; garde à froid hors plage de la levure sans alerte (hors fermentation) | pilote |
| p2c : Chercher est une vue de données ; le plafond de 72 mots vaut hors données (c1 75, c4 74 hors données : acceptés). Erreur du brief : Lallemand (CA) et Mangrove Jack's (NZ) rangés « fabricant européen » ; au port, le 2e rang devient « fabricant présent en Europe », validé par les offres relevées | pilote |
| Les valeurs de la maquette sont celles de la fiche US-05 et de `yeastPitching.ts` : la dose en plage de sachets, FG et alcool en plage | pilote |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| i1 | inventaire et captures de l'écran actuel | mécanique | executant | haiku | 40 | work/missions/2026-11-09-ecran-levure/inventaire/** | — | inventaire-levure.md, captures ouvertes | pilote | — |
| r | série r, représentations distinctes (A1, A2, A4) | conception | concepteur | opus | 60 | work/missions/2026-11-09-ecran-levure/v0/r*/** | i1 | controle-commun --profil=sans-houblons, captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| z | série z, créative à fond | conception | concepteur | fable | 60 | work/missions/2026-11-09-ecran-levure/v0/z*/** | i1 | controle-commun --profil=sans-houblons, captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| u | série u, libre au brief minimal | conception | concepteur | opus | 60 | work/missions/2026-11-09-ecran-levure/v0/u*/** | i1 | controle-commun --profil=sans-houblons, captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| t | tri des 12 concepts (classement, 3 candidates, greffes) | jugement | critique | fable | 30 | work/missions/2026-11-09-ecran-levure/critique/** | r, z, u | captures ouvertes | pilote | tri |
| p2l | passe 2 de l'étape : r3 resserré, r1, conduite acquise, recherche IA au toucher | conception | concepteur | opus | 50 | work/missions/2026-11-09-ecran-levure/p2/l*/** | t | controle-choix.mjs, baseline (BRIEF-PASSE2), captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| p2c | vue Chercher, disponibilité CH/FR/DE d'abord | conception | concepteur | opus | 50 | work/missions/2026-11-09-ecran-levure/p2/c*/** | t | controle-choix.mjs, baseline (BRIEF-PASSE2), captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| p2s | vues Comparer et Suggérer | conception | concepteur | fable | 50 | work/missions/2026-11-09-ecran-levure/p2/s*/** | t | controle-choix.mjs, baseline (BRIEF-PASSE2), captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| t2 | critique de la passe 2 (verdict par maquette) | jugement | critique | fable | 30 | work/missions/2026-11-09-ecran-levure/critique/p2/** | p2l, p2c, p2s | controle-panel.mjs, captures ouvertes | pilote | tri |

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md, une plainte va dans DEFAUTS-RECURRENTS.md avec son contrôle, et son choix va dans
`choix/ecrans-app.json`.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Levure · panel v0 (12 concepts, tri du critique : r2, r3, u4) | 09.11 v1 | https://claude.ai/artifact/DJkJFqKMkfY5LTeqAyWVM7 | `work/missions/2026-11-09-ecran-levure/panel-v0.html` |
| Levure · passe 2 (étape, Chercher, Comparer, Suggérer ; candidates l3b, c4, s1b, s3b) | 09.11 v2 | https://claude.ai/artifact/BCuZb4L8dtQWwWvP1qoBHE | `work/missions/2026-11-09-ecran-levure/panel-p2.html` |
| Levure · passe 3 (l5, c5, s5, s6 ; candidates l5b, c5a, s5a, s6a ; c5b et s5c écartées, montrées) | 09.11 v3 | https://claude.ai/artifact/XeAsjYdnSkosrRTTWR23Gz | `work/missions/2026-11-09-ecran-levure/panel-p3.html` |
| Levure · passe 4 (Chercher c6a/c6b, Suggérer s7a/s7b ; candidates c6b, s7a ; l5b, s5a, s6a choisies) | 09.11 v4 | https://claude.ai/artifact/DW4PfrQci56fx2YJ9hCAHd | `work/missions/2026-11-09-ecran-levure/panel-p4.html` |

c5b écartée : taper une levure US posait ses plages en filtres et cachait l'US-05 (idée « le style pose ses plages » greffée vers c5a).
s5c écartée : le ⊕ flottant recouvrait le × d'une colonne (idée « le ⊕ devient la colonne des puces » greffée vers s5a).
Pilote : après une levure US tapée, la liste garde l'ordre de c4 (l'achetable la plus proche d'abord), ses plages restent un repère, pas des filtres ; sous « sèche », les 1 417 fiches sans forme sont exclues mais comptées (« + 1 417 forme inconnue »).

## Sources
- `work/missions/2026-11-09-ecran-levure/jury-levure/fiche.md`, `work/missions/2026-11-09-ecran-levure/BRIEF-AUTEUR.md`, `work/missions/2026-11-09-ecran-levure/BRIEF-PASSE2.md`, `work/missions/2026-11-09-ecran-levure/inventaire/inventaire-levure.md`
