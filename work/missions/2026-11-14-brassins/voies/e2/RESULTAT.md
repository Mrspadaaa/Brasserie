OK — 4 fiches garde, conditionné, terminé, annulé ; e2d chaude, e2c en cave et à 1280

## Fichiers écrits (tous dans voies/e2/)
- `capture.mjs` (repris de s5, plan e2a à e2d)
- `e2a/`, `e2b/`, `e2c/`, `e2d/` : `etat.html` (`?etat=repos|geste|conditionne|termine|annule&theme=clair|cave`), `NOTE.md`, PNG
- `tests.txt` : sorties des CHECK. Aucune suite Vitest, car rien n'est écrit dans `src/`.

## Variantes
| id | chaleur | idée | geste (FG confirmée, Pils) |
|---|---|---|---|
| e2a | froide | La feuille actuelle, avec la réponse en tête : un bloc plein par état, la FG au curseur m2 dans la bande, la courbe avec la garde et le palier stable | bloc vert « Prête à conditionner », alcool final, « Conditionner · bouteilles et fût » |
| e2b | tiède | La vie du lot en frise verticale : un rail coloré par étape, l'étape en cours ouverte avec son geste | bascule « FG confirmée », répartition bouteilles / fût au pouce |
| e2c | tiède | Où est la bière : la cuve dessinée (niveau, givre, densité), puis les bouteilles et le fût qui se remplissent | coche sur la cuve, « Où va la bière ? » (70 × 33 cl + fût F-01) |
| e2d | chaude | L'écran est le verre : le fond a la couleur de la bière, les relevés sont des bulles qui montent vers la bande FG, le verre est vide une fois la bière écoulée | « Prête. On la met en bouteille ? », 5,3 % en très grand |

Pour chaque variante, cinq états : repos (Pils en garde), geste, conditionné (Stout), terminé (Saison) et annulé (Pale Ale LOT-020, état fictif).

## Critères (rejoués depuis la racine, `tests.txt`)
- G1 : `SERIE OK`
- G2 : `ETATS OK`
- G3 : `HORS OK`
- En plus : 0 `type="number"` dans les quatre `etat.html` ; capture sans débord ni erreur JS.

## Captures (23, toutes ouvertes)
- `e2a/e2a-{repos,geste,conditionne,termine,annule}-390-clair.png`
- `e2b/e2b-{repos,geste,conditionne,termine,annule}-390-clair.png`
- `e2c/e2c-{repos,geste,conditionne,termine,annule}-390-clair.png`, `e2c/e2c-repos-390-cave.png`, `e2c/e2c-conditionne-390-cave.png`, `e2c/e2c-repos-1280-clair.png`
- `e2d/e2d-{repos,geste,conditionne,termine,annule}-390-clair.png`

## Défauts connus (v0)
- e2b : sur les états annulé et terminé, un quart à un tiers bas de l'écran reste vide.
- e2c : au 1280, la colonne de gauche reste vide sous la cuve.
- e2d : la couleur de bière vient du style, hors jetons de DESIGN.md, et aucun thème cave n'est rendu.
- Partout, des données fictives sont dites dans chaque NOTE : OG de la Pils, relevés, F3, dates du Stout et de la Saison, état annulé.
- Contrôles du lot non joués en v0 : `controle-panel`, `controle-commun`.
- Skills : seul `boosters-ux` a été chargé. `impeccable` et `ui-design-system` ne l'ont pas été, pour tenir le plafond de tours.

## Prédiction
« Le verre (e2d), là je comprends tout de suite et ça donne envie. La cuve (e2c) est claire. e2a, c'est l'app actuelle en mieux, sans plus. »

DÉCISION À PRENDRE : les deux ajouts neufs, « Rebrasser cette Saison » et le verdict « à refaire / à corriger / sans suite » du Carnet, sont à montrer comme ajouts, pas comme acquis.
CONNAISSANCE : la fixture a1 (Stout OG 1,058, FG 1,014 ; Saison OG 1,052, FG 1,006) redonne exactement les 5,9 % et 6,1 % du brief : on peut l'utiliser comme donnée fictive cohérente.
LEÇON PROPOSÉE : aucune
