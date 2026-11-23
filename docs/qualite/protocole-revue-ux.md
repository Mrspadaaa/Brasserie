# Protocole de revue UX — houblons

Phase 4 de la mission #119, 18.10.2026. Ce protocole casse les causes H2, H4, H5
et H6 de [causes-racines.md](causes-racines.md) : les revues jugeaient le ticket,
partaient du rapport de l'auteur, ne chronométraient aucune tâche et ne
regardaient aucun concurrent.

## Qui relit

- Un relecteur qui n'a pas conçu l'écran : une session neuve (Opus, ou Fable 5.1
  pour la critique de la phase 7), ou le brasseur lui-même.
- Jamais l'auteur, jamais une session qui a lu son rapport.

## Ce que le relecteur reçoit

- L'écran qui tourne : banc QA avec `?catalogue=production` et le stock de
  production, ou le prototype, ou l'app en ligne (lecture seule).
- [La banque de questions](../besoins/banque-de-questions.md) et les règles U1 à
  U7 de [parcours-cles.md](../besoins/parcours-cles.md).
- La liste des tâches ci-dessous.

## Ce qu'il ne reçoit pas

- Le rapport de l'auteur, ses captures, son diff, sa liste de défauts connus.
- Le ticket comme critère : le ticket dit quoi relire, pas comment juger.

## Ce qu'il joue

Fenêtre 390 × 844 px, écran tactile, données de production. Le chronomètre
part à l'arrivée sur l'étape Houblons et s'arrête quand la tâche est réussie.
Chaque toucher compte, défilement compris.

| Tâche | Réussite | Touchers au plus | Temps au plus |
|---|---|---|---|
| T1 Choisir | Le meilleur houblon pour la stout est ajouté à la recette, sa quantité en stock vue avant l'ajout. | 1 pour voir mes houblons, 1 pour ajouter | 20 s |
| T2 Comparer | 2 houblons de mon stock sont lus côte à côte, avec leurs écarts. | 3 | 30 s |
| T3 Remplacer | Un ajout est remplacé par un houblon que j'ai en quantité suffisante, à IBU égal. | 2 | 30 s |
| T4 Questions | 3 questions tirées au sort dans la banque reçoivent une réponse ou un « non documenté » explicite. | — | 60 s chacune |
| T5 Bureau | T1 rejouée à 1280 × 800. | 1 pour voir mes houblons, 1 pour ajouter | 20 s |

Pour chaque tâche, le relecteur note : réussie ou non, temps, touchers, ce
qu'il a cherché sans le trouver, ce qui l'a ralenti.

## Ce qu'il décrit

Avant tout jugement, chaque capture reçoit 1 à 3 lignes « ce que je vois » :
le premier élément lu, la réponse ou l'action visible, ce qui est sous le pli.
Une capture sans description ne compte pas.

## Ce qu'il compare

La tâche T1 ou T2 est jouée aussi dans un outil concurrent (tableau Homebrew
Academy, BeerSmith Hop Control, Beer Maverick s'il est accessible). Le relecteur
note le temps, les touchers et ce que le concurrent montre que l'app ne montre
pas. Références : `work/refonte-frontend/phase2/concurrence.md`.

## Ce qui bloque

- Une tâche T1, T2 ou T3 échouée, ou hors de ses touchers ou de son temps.
- Une question clé sans réponse ni « non documenté » : Q01, Q02, Q03, Q05, Q06.
- Une règle U1 à U7 en échec.
- Un défaut vu pendant le parcours, même hors du diff : il bloque aussi.

Un bloquant ouvert empêche la clôture du ticket
(`scripts/check-issue-closure.mjs`). « Décision produit » n'est pas une
catégorie de sortie : un écart au besoin du brasseur est un défaut.

## Verdict à rendre

Fichier `ux-verdict.md`, dans cet ordre :

1. Écran relu, données, largeurs, date.
2. Tableau des tâches T1 à T5 : réussie, temps, touchers, remarque.
3. Règles U1 à U7 : tenue ou non, avec la capture qui le montre.
4. Questions tirées au sort et réponse lue.
5. Comparaison au concurrent.
6. Captures, chacune avec « ce que je vois ».
7. Bloquants (cases à cocher), puis mineurs.
8. Verdict : « aucun bloquant » ou « N bloquants ».

## Brief type du relecteur

> Tu relis l'étape Houblons de L'Affinée, sans avoir vu sa conception. Ouvre
> l'écran à 390 × 844 avec les données de production. Joue les tâches T1 à T5
> de `docs/qualite/protocole-revue-ux.md`, chronomètre et compte les touchers.
> Décris chaque capture avant de juger. Juge contre la banque de questions et
> les règles U1 à U7, pas contre le ticket. Rends `ux-verdict.md` au format du
> protocole. Tu ne reçois ni le rapport de l'auteur ni ses captures.
