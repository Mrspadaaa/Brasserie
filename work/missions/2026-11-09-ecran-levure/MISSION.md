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
| Les valeurs de la maquette sont celles de la fiche US-05 et de `yeastPitching.ts` : la dose en plage de sachets, FG et alcool en plage | pilote |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| i1 | inventaire et captures de l'écran actuel | mécanique | executant | haiku | 40 | work/missions/2026-11-09-ecran-levure/inventaire/** | — | inventaire-levure.md, captures ouvertes | pilote | — |
| r | série r, représentations distinctes (A1, A2, A4) | conception | concepteur | opus | 60 | work/missions/2026-11-09-ecran-levure/v0/r*/** | i1 | controle-commun --profil=sans-houblons, captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| z | série z, créative à fond | conception | concepteur | fable | 60 | work/missions/2026-11-09-ecran-levure/v0/z*/** | i1 | controle-commun --profil=sans-houblons, captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| u | série u, libre au brief minimal | conception | concepteur | opus | 60 | work/missions/2026-11-09-ecran-levure/v0/u*/** | i1 | controle-commun --profil=sans-houblons, captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| t | tri des 12 concepts (classement, 3 candidates, greffes) | jugement | critique | fable | 30 | work/missions/2026-11-09-ecran-levure/critique/** | r, z, u | captures ouvertes | pilote | tri |

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md, une plainte va dans DEFAUTS-RECURRENTS.md avec son contrôle, et son choix va dans
`choix/ecrans-app.json`.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Levure · panel v0 (12 concepts, tri du critique : r2, r3, u4) | 09.11 v1 | https://claude.ai/artifact/DJkJFqKMkfY5LTeqAyWVM7 | `work/missions/2026-11-09-ecran-levure/panel-v0.html` |

## Sources
- `jury-levure/fiche.md`, `BRIEF-AUTEUR.md`, `inventaire/inventaire-levure.md`
