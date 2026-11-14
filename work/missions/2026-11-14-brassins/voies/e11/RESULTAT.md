OK — coque Brassins : 4 mini maquettes (froide, 2 tièdes, chaude), V5.5 masqué, gardé ou retiré

## Variantes
| id | chaleur | idée | Atelier Houblons V5.5 |
|---|---|---|---|
| e11a | froide | l'écran actuel, rangé et nommé | masqué : dans le menu du +, « Outils houblons » |
| e11b | tiède (la meilleure) | les sous-onglets descendent sous le pouce, l'onglet actif porte son + | retiré (encore atteint depuis les fiches recette et brassin, App.tsx l. 848 et 861) |
| e11c | tiède | la liste devient le tableau des cuves ; + scindé en « + Brassin » et Saisie rapide | gardé, renommé « Houblons » |
| e11d | chaude | un classeur : quatre intercalaires au bord droit, liste en agenda des gestes | retiré |

## Fichiers écrits (seulement dans voies/e11/)
- `capture.mjs`, `tests.txt`, `RESULTAT.md`
- `e11a/` à `e11d/` : `etat.html`, `NOTE.md`, les PNG

## Critères (tests.txt, rejoués depuis la racine)
- G1 : SERIE OK
- G2 : ETATS OK
- G3 : HORS OK
- Aucune suite Vitest : rien dans `src/`.

## Captures (390 × 844 tactile, sauf le 1280)
- e11a : `e11a/e11a-repos-390-clair.png`, `-geste-390-clair`, `-recettes-390-clair`
- e11b : `repos-390-clair`, `geste-390-clair`, `recettes-390-clair`, `repos-390-cave`, `repos-1280-clair`
- e11c : `repos-390-clair`, `geste-390-clair` (feuille Saisie rapide), `recettes-390-clair`
- e11d : `repos-390-clair`, `geste-390-clair`, `recettes-390-clair`

## Images ouvertes
- Toutes les images de e11a et de e11b, sauf la dernière capture de `e11b-recettes`, prise après l'ajout de hauteur aux rangées.
- e11c : repos, ouvert avant le dernier correctif (onglets serrés : la police passe à 15 px).
- e11d : repos et geste. Le dernier correctif (place des dates de l'agenda, hauteur des rangées) a été recapturé mais pas
  rouvert.
- Non ouverts : `e11c-geste`, `e11c-recettes`, `e11d-recettes`. Le pilote doit les regarder (L12).

## Prédiction
« e11b, les onglets sous le pouce avec leur +, ça je comprends en trois secondes ; le classeur est osé mais je lis de travers. »

DÉCISION À PRENDRE : le sort de « Atelier Houblons V5.5 », masqué, gardé ou retiré selon les variantes. C'est le brasseur qui
choisit sur la page.
CONNAISSANCE : sur l'onglet Volumes, l'action du + est `quickAction`. FloatingActions ne montre alors pas d'action d'écran,
seulement le menu général : il n'y a pas de « Saisie rapide » propre à Volumes (fabActions.ts l. 75, App.tsx l. 1064).
LEÇON PROPOSÉE : aucune.
