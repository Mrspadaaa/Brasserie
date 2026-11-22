# za1 — zq1 apaisée, lecture « la couleur » (v2)

Base : `v1/z/zq1/etat.html` reprise telle quelle (règle n° 1), préfixe `zq1-` → `za1-` par split/join (L26), puis une couche
CSS « couleur apaisée » ajoutée en dernier et cinq classes retirées du HTML. Assemblage : `voies/v2-za1/build.mjs`.

Lecture dominante : l'anxiété de zq1 venait de la couleur, pas de la structure. Une seule couleur d'alerte (B7) : le rouge ne
désigne plus que la panne ; tout ce qui est « dû » passe en ambre doux, trait fin, sans tirets ; le fond redevient neutre.

## Ce qui change par rapport à zq1
1. Compteur « À traiter 4 » : le chiffre passe du rouge au gris (comme « Tout 13 »), sans badge.
2. Rail du haut (au-dessus d'aujourd'hui) : plus de dégradé rouge → ambre ; trait gris neutre de 2 px.
3. Pompe (seule panne) : anneau rouge de 2 px, sans le disque rose plein ; badge « panne 9 j » rouge sur fond très pâle (9 %).
4. pH-mètre, refroidisseur, densimètre : anneau ambre à 55 % d'opacité au lieu de l'ambre plein ; badges ambre doux à 11 %, graisse 500.
5. Densimètre « jamais étalonné » : plus de nœud en tirets (hachure retirée) ; même anneau doux que les autres dus.
6. Bande « 30 j » : plus de beige ni de bord en tirets ambrés ; gris très clair, bord plein de 1 px, « 30 j » en gris.
7. « dans 17 j » (déshumidificateur) : plus coloré en ambre ; il n'est pas dû, il est à venir.
8. Gestes de ligne (Réparée, Étalonner, Fait) : bordure fine grise et fond gris clair au lieu du contour noir épais ; 44 px gardés.
   « Achat » reste la seule action forte de la liste (B2).
9. Point « aujourd'hui » : 14 px au lieu de 18.
10. Fiche : « retard 3 j » n'est plus un titre de 22 px ambre gras mais une pastille ambre douce de 15 px.
11. État traiter : la trace du pH-mètre qui descend est un trait vert pâle plein (plus de tirets) ; la mention « pH-mètre étalonné,
    descend au 14.12 » perd son cadre en tirets ; la carte surlignée passe à un vert plus pâle.
12. 1280 : le trait de retard du fil du pH-mètre et le point « 11.11 prévu » passent en ambre doux.
13. Cave : ambre doux propre au thème (206 168 104), texte ambre adouci, rouge de panne garde son contraste.

## Ce qui est gardé (sa maquette, telle quelle)
Le fil vertical à sa vraie distance (3,5 px/j), le point « aujourd'hui 14.11 », l'ordre (panne, puis dus, puis l'avenir, puis
« sans échéance »), les gestes à droite en 44 px, Achat / Déjà possédé / Projets visibles, la valeur du parc « 1 739 CHF · 2 prix
connus », la fiche du pH-mètre en fil (étapes, tampons, lu/écart, rythme, état, dépenses reliées), les sept états, la coque de l'app,
les mots (52 au premier écran hors noms, inchangés), toutes les données et dates (14.11.2026). Aucun mot ni chiffre ne change.

## Emprunts
Aucun : les mots (za3), l'ordre (za2) et la mise en avant (za4) sont laissés aux autres variantes. Seul le poids des boutons (8)
touche à l'emphase, parce qu'un contour noir épais est aussi une couleur d'alarme.

## Contrôles
- G1 : `VARIANTE OK` (sept images et la NOTE).
- Captures : `node socle/capt.mjs v2 repos,geste,traiter,ajout,vide,repos-1280 za1` → `CAPTURES OK`, 7 images, toutes ouvertes.
- Texte ≥ 12 px, `type="number"` : 0, `data-booster` : inchangés depuis zq1 (aucun élément ajouté ni retiré).

## Reste
- En cave, l'ambre doux des dus voisine avec le jaune des actions (onglet Matériel, « + ») : le thème de l'app le veut ainsi.
- Aperçu de la feuille Nouveau matériel : son petit segment ambre est gardé (c'est un aperçu, pas une alerte).

## Prédiction
« Là je respire : je vois tout de suite que seule la pompe est vraiment en panne, le reste c'est juste à faire. »

## Correction 15.11
Verdict v2 : trop proche de zq1 (bloquant). La lecture « couleur » est poussée jusqu'au bout : **une seule tache rouge, la pompe** ;
dans la partie due, plus aucun aplat coloré. Couche `CORR` ajoutée en dernier dans `voies/v2-za1/build.mjs` (la v0 de la couche
`CALME` reste au-dessous).
1. Pastilles des dus (« retard 3 j », « 5/5 brassins », « jamais étalonné ») : plus de fond, texte ambre doux seul, graisse 500 (P1).
   La pastille « panne 9 j » garde seule son fond rouge pâle.
2. Nœuds dus (pH-mètre, refroidisseur, densimètre) : anneau neutre gris 1,5 px et un point ambre de 8 px en haut à droite (P2).
   La pompe : anneau rouge 2,5 px et disque rose pâle : c'est la tache.
3. Rail du haut : trait gris clair (`--trait`) de 2 px. Bande « 30 j » : plus de fond du tout, deux filets gris d'1 px.
4. Gestes dus (Étalonner, Fait, Étalonner) : filet gris clair d'1 px, sans fond, graisse 500 ; 44 px gardés. « Réparée » (la panne)
   garde seule le contour noir de zq1, avec « Achat ».
5. Fiche : « retard 3 j » sans fond, texte ambre ; au 1280, le trait de retard du fil passe au gris et le point « 11.11 prévu » prend
   l'anneau neutre et le point ambre.
Comparaison à zq1 (`v1/z/zq1/zq1-repos-390.png`), à deux mètres : zq1 montre une colonne de quatre anneaux ambre et rouge, quatre
pastilles colorées, un rail rouge-ambre, une bande beige à tirets et quatre boutons noirs ; za1 montre une seule tache rouge en haut
à gauche, une colonne grise ponctuée de trois petits points ambre, et un seul bouton noir dans la liste. Mots, données, structure inchangés.
Prédiction : « Là je vois la pompe et c'est tout ; le reste attend sans me crier dessus. »
