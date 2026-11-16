OK — s6a, s6b, s6c rhabillées à l'identité (trousse, feuilles, chrome), 13 images refaites

## Variantes
- [x] s6a : la trousse est chargée, les couleurs en dur deviennent des jetons, la police et l'échelle viennent de la trousse (titre-réponse en `id-display` 28/600, J+5 en `id-reading-grand`, rayons à 10). La fiche est une feuille de l'app (94 dvh) posée sur la liste. Les onglets Conduite / Recette / Journal passent en `id-segments`, le pied en `id-btn`. Le geste est une feuille Mesurer posée sur la fiche, avec le curseur m2 de la trousse (`id-curseur`) et le repère 1,018. La liste est un écran de l'onglet, avec l'en-tête, les sous-onglets, la barre du bas et le bouton + · écart restant : les unités en mono (« 19 °C ») gardent l'espace large de z1, et l'app écrit les unités en sans ; des cases de 44 px restent plus grosses que les champs compacts de l'app.
- [x] s6b : mêmes jetons et échelle. J+5 et la phrase sont tous deux à 28 px (avant : 44 px et 23 px). À 390, la fiche est une feuille posée sur la liste des cuves. À 1280, le poste de cave (cuves, colonne, dry hop, bilan) reste dans l'onglet, avec le chrome complet ; le main est élargi à 76 rem. « double » et « actif » deviennent des `id-pastille`, « + densité » est le seul bouton primaire. Le geste « sur place » est gardé · écart restant : la colonne garde ses barres pleines vertes, plus chargées que la fiche réelle, et le main élargi s'écarte des 56 rem de l'app.
- [x] s6c : jetons des deux thèmes, alors qu'elle n'avait pas de mode cave jusqu'ici. Le segment de moment prend la couleur paille de l'app, la fenêtre « actif » passe au jeton attention à 28 %, les cartes houblon passent au rayon 10 et les grammes à 28 px mono. La fiche est une feuille posée sur trois `id-carte` de la liste. J+5 · levuré 09.11 passe au-dessus de la phrase, et le toast du geste reste au-dessus du pied · écart restant : le liseré de famille (6 px en haut des cartes) et les barres Beer Maverick n'ont pas d'équivalent dans l'app.

Les couleurs des familles (`jetons-familles.json` : #d9b414, #ee9b2f, #bf86d6, #2f6b5f, #7a4e3a) sont gardées, comme LISEZMOI le permet. Aucun chiffre ni aucun texte n'a changé, sauf trois déplacements imposés par le chrome :
- s6a : le titre de liste « Brassins · » devient « 2 en cours · 1 à brasser » ;
- s6a et s6b : le bouton « + Brassin » devient le + de la barre du bas ;
- s6c : J+5 passe de l'en-tête au corps de la fiche.

Deux boutons perdent leur fond plein pour qu'il ne reste qu'un bouton primaire par écran : « Confirmer FG » (s6a) et « °C » (s6c) sont maintenant secondaires.

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/s6/s6a/etat.html`, `s6b/etat.html`, `s6c/etat.html`
- PNG : `s6a-{repos,geste,liste}-390-clair`, `s6a-repos-390-cave`, `s6a-repos-1280-clair` ; `s6b-{repos,geste}-390-clair`, `s6b-repos-390-cave`, `s6b-repos-1280-clair` ; `s6c-{repos,geste}-390-clair`, `s6c-repos-390-cave`, `s6c-repos-1280-clair`. Les nouveaux noms sont ceux en cave et en 1280.
- `work/missions/2026-11-14-brassins/voies/rs6/tests.txt`, `RESULTAT.md`
- Je n'ai pas touché aux NOTE.md de s6 ; le pilote peut y reporter les écarts ci-dessus.

## Critères (sortie dans tests.txt)
- G1 : `IDENTITE OK 3/3` (avant : `IDENTITE ECHEC 0/3`, avec 34, 44 et 30 px, la graisse 900 et 6 % de couleurs hors palette)
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest, rien n'a changé dans `src/`.

## Captures ouvertes (Read)
- s6a : repos, geste et liste en 390 clair.
- s6b : repos et geste en 390 clair, repos en 1280 clair.
- s6c : repos en 390 cave.
- Comparées à `a1-banc/captures/fiche-fermentation-390-clair.png` : même feuille (poignée, titre et sous-titre, ×, fond cave-900, en-tête de l'app flou derrière).
- Non ouvertes, faute de contexte : s6a en cave et en 1280, s6b en cave, s6c en 390 clair (repos et geste) et en 1280. À ouvrir par le pilote.

## Prédiction
« Là ça ressemble à l'app » ; il jugera de nouveau l'idée, et peut-être la colonne de s6b, trop dense.

DÉCISION À PRENDRE : à 1280, s6b met la fiche dans l'onglet sur 76 rem plutôt que dans une feuille de 42 rem, pour garder les trois colonnes du poste de cave. À valider ou à ramener en feuille.
CONNAISSANCE : avec la trousse, un titre `id-reading-grand` placé dans un `span` est écrasé par une règle `.x span{font-size}` de la maquette. Il faut exclure `.id-reading`. Dans une feuille, les enfants du corps (flex en colonne) se tassent sans `flex-shrink:0`.
LEÇON PROPOSÉE : aucune
