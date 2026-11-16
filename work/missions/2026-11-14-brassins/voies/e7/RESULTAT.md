OK — 4 mini maquettes du bilan (froide, 2 tièdes, chaude), repos et geste FG

Voie e7, concepteur Opus (Fable interdit), 14.11.2026.

## Variantes
| id | chaleur | idée | images (toutes ouvertes) |
|---|---|---|---|
| e7a | froide | l'écran actuel, réponse en tête (4 boutons de mesure, barres d'écart, bande verte) | `e7a/e7a-repos-390-clair.png`, `e7a/e7a-geste-390-clair.png` |
| e7b | tiède | un carton de tir, OG × FG (bascule Alcool × Volume) | `e7b/e7b-repos-390-clair.png`, `e7b/e7b-geste-390-clair.png` |
| e7c (meilleure) | tiède | brassins × mesures en cases pleines ; la colonne Volume répond | `e7c/e7c-repos-390-clair.png`, `e7c/e7c-geste-390-clair.png`, `e7c/e7c-repos-390-cave.png`, `e7c/e7c-repos-1280-clair.png` |
| e7d | chaude | quatre cuves remplies, un trait de cible ; densimètre au geste FG | `e7d/e7d-repos-390-clair.png`, `e7d/e7d-geste-390-clair.png` |

Geste commun : la mesure FG choisie ; la bande visée et l'écart de chaque brassin en résultent (NEIPA en cours, 1,018 à J+5).
Fonctions de l'écran actuel : gardées ou déplacées à un toucher, dites dans chaque NOTE.md (aucune perdue en silence ; Archives à rebrancher dans e7c et e7d).

## Fichiers écrits
`e7a/`, `e7b/`, `e7c/`, `e7d/` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`, `tests.txt`, ce fichier. Rien hors de `voies/e7/`.

## Critères (sortie dans `tests.txt`)
- G1 : `SERIE OK`
- G2 : `ETATS OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`).

## Défauts vus sur les captures, laissés à la passe 2
1. e7c à 1280 : le tiers bas reste vide (cause c3 n° 7) ; il faudrait rallonger le tableau ou y loger les dégustations.
2. e7d geste : la page fait 857 px, et le bas de la barre de mesure est rogné de 13 px.
3. e7b geste : le libellé « −1 % alc. » touche l'anneau ; dans les jauges OG et FG, Pils est caché sous Stout et Saison (même écart).
4. e7b repos : une bande vide de 40 px au-dessus de la barre du bas.

Prédiction : « Le tableau en cases, je vois tout de suite que je perds du volume ; les cuves, c'est fun mais je lis moins bien les chiffres. »

DÉCISION À PRENDRE : les tolérances « dans la cible » (densité ±0,002, alcool ±0,3, volume ±0,5 L) sont une proposition, car le code n'en a pas ; à montrer au brasseur en variante (curseur de tolérance) si la cible doit devenir une plage.
CONNAISSANCE : les cibles de recette des brassins Pils, Stout et Saison n'existent pas dans BRIEF-AUTEUR ; la fixture `a1-banc/banc.mjs` donne 45 L et IBU 55 partout, ce qui contredit le brief (24 L). Le bilan a besoin d'un jeu de données cible/réel cohérent.
LEÇON PROPOSÉE : aucune
