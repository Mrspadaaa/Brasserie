OK — 4 bloquants de k9 corrigés, e8na refondue, 31 images régénérées ; G1 et G2 verts

## Bloquants
- [x] e8na n° 1 : refonte du premier écran ; tuile EBC 68 × 46 px portant le degré à gauche, lots en chiffre et en points à droite (un point par lot, le dernier à la couleur de son état, rond creux pour le prévu). e8nb reste un tableau à en-têtes, e8na se lit comme un nuancier.
- [x] e8nc n° 1 : réglettes en deux pistes ; plage = bande (FG 1,010–1,014 et 1,010–1,012 empilées, alcool 6,3–6,8 % en bande), valeur = point.
- [x] e8nd n° 1 : étiquettes collées à leur point, sinon trait de rappel ; points confondus nommés ensemble ; 35/35 nommés à 390 et 1280.
- [x] e9nb n° 1 : vide → « Contacts 0 ».
- [x] e9nd n° 1 : Saison à l'épeautre « couleur ? » (étiquette neutre), Pils fumée en or. (provisoire dans k9, traité comme bloquant)
- [x] e9nd n° 3 : Nelson en Tropicaux + Baies ; pastilles d'arômes aux couleurs des familles de l'app.

## Non bloquants faits
- e8na : « Jamais 11 » + fondu au bord ; Comparer en ⇆ (SVG lucide arrow-left-right) ; vide avec 3 lignes fantômes ; liseré clair des tuiles foncées en cave.
- e8nc n° 2 à 8 (zone de toucher 46 px dite dans NOTE, légende et explication retirées, degré dans le jeton, titres au neutre, deux Ouvrir, liseré).
- e8nd n° 2 à 5 ; e9nb n° 2 ; e9nd n° 2 (arômes sur capsule blanche).
- Non fait : rien des non bloquants de e8nb (hors voie : e8nb n'est pas dans la liste). Reste dans e8nd : deux traits de rappel se croisent dans l'amas 5,8 % (Saison au thym, English IPA), dit dans NOTE.

## Fichiers écrits
- e8n/e8na/etat.html, NOTE.md et 6 PNG ; e8n/e8nc et e8n/e8nd : etat.html, NOTE.md, 6 PNG chacune ; e9n/e9nb et e9n/e9nd : etat.html, NOTE.md, PNG (captures régénérées par capture.mjs de la série).
- g9/RESULTAT.md, g9/tests.txt.

## Critères (sorties dans g9/tests.txt)
- G1 : COCHE OK 6. G2 : IMAGES OK. G3 : HORS KO attendu (fichiers src/ d'autres voies, consigne du pilote : ignoré).
- controle-identite : e8n IDENTITE OK 4/4 ; e9n IDENTITE ECHEC 3/4, e9nd 8 % hors palette (couleurs des familles d'arômes, voir DÉCISION).

## Captures ouvertes
- e8na : repos-390-clair, repos-390-cave, geste, historique, comparer, vide.
- e8nc-comparer-390-clair ; e8nd-repos-390-clair ; e9nb-vide-390-clair ; e9nd (5 images, passe précédente : idee, geste, tarifs, vide, cave ; HTML inchangé depuis).
- Chemins : work/missions/2026-11-14-brassins/voies/e8n/<id>/*.png, work/missions/2026-11-14-brassins/voies/e9n/<id>/*.png.

Prédiction : « Là je vois la couleur et le degré d'un coup, c'est plus la même liste que le tableau. »

DÉCISION À PRENDRE : `controle-identite.mjs` ne lit pas `src/data/hopV4/jetons-familles.json` (table des 12 familles d'arômes de l'app, DESIGN.md : « les couleurs des familles d'arômes ne changent pas »). e9nd échoue à 8 % pour ces seules couleurs. Ajouter ce fichier à la palette du contrôle (une boucle sur les `base`/`texte`/`fond`), fichier hors de ma voie.
CONNAISSANCE : les couleurs des familles d'arômes vivent dans `src/data/hopV4/jetons-familles.json` (lu par `src/ui/hopIndex/familyTokens.ts`), pas dans DESIGN.md.
LEÇON PROPOSÉE : aucune
