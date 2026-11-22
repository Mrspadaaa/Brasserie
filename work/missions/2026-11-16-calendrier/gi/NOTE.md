# gi — g-d1 + une idée de cd1 à la fois (16.11, retouche 2 : critique en 8 points)

Sa phrase : « g-d1 était mieux dans l'esprit compacte et on voit tout d'un coup d'œil ; cd1 a des bonnes idées mais
c'est trop le fouillis. Surtout l'entête.. » Base : `paliers/g-d1.html`, telle quelle. Chaque `i<N>.html` = g-d1 + une
seule idée, sans rien d'autre. Aucune idée n'ajoute de ligne à l'en-tête.

Outils : `build.mjs` (applique les idées à g-d1 dans Chrome, puis écrit le HTML figé), `cap.mjs` (captures 390 × 844, DPR 2, et
contrôles dans `cap/controle.txt`). Référence : `cap/g-d1.png`. Toutes les captures ont été ouvertes en plein format et
comparées à g-d1.

Mesure de l'en-tête : il va du haut de l'écran au haut de la 1re rangée (`#fb`). Dans g-d1, cela fait **202 px** : 144 px pour
la ligne du chiffre et la courbe, 55 px pour la bande des semaines, plus les bordures.

| fichier | idée (au repos / au toucher) | tête | rangées |
|---|---|---|---|
| i1 | Titres de rangée à gauche, au-dessus de leurs barres. **Brassins** sur une ligne de 18 px, 5 px sous la bande (marge 7 px). **Fêtes** dans la ligne libre du chariot. Le **lien du chariot a repris le tracé de g-d1** : il part du bas du Porter (318), descend 26 px et tourne jusqu'au chariot (331-357). Les 23 px de Brassins se reprennent sur les lignes de titre d'Achats, Travaux, Activités, Papiers (26 → 23) : 11 px de plus que g-d1 au total | 202 | 7 / 7 |
| i2 | Résumé à **une seule place** : sur la ligne du titre, à droite du titre et de son +, et **seulement pour les rangées de plusieurs choses** (Ventes 4 · +900, Papiers 3 · −806). Sans i1, Brassins est titré à droite de la Blonde : pas de place sur sa ligne, donc pas de résumé | 202 | 7 / 7 |
| i3 | Bande de g-d1 inchangée. **La date se montre au toucher de la semaine** : bulle « S50 7 – 13 déc. » sous la bande, colonne grisée (`i3-toucher.png`) | 202 | 7 / 7 |
| i4 | Mouvement de la semaine sous le solde : −148 +120 −20 +988 −56 +486 (inchangé) | 202 | 7 / 7 |
| i5 | **Jauge retirée de la bande.** Au toucher de la semaine : « S50 4 j de travail sur 2 · ♙ manque 2 j » (bulle rouge si la semaine déborde, mots du proto) (`i5-toucher.png`) | 202 | 7 / 7 |
| i6 | **Pastille « ⏲ 2 » de g-d1, 46 × 32.** Les mots « en retard » sont dans la feuille Maintenant qui s'ouvre au toucher (celle du proto, mêmes données : 2 fûts au Café du Pont, en retard de 7 j ; Facture Malterie Suisse, en retard de 4 j) (`i6-toucher.png`) | 202 | 7 / 7 |
| i7 | « + S47 » : le + dit la semaine visée (inchangé) | 202 | 7 / 7 |
| i8 | **Titre simple de g-d1, sans pastille.** Un toucher sur le titre masque la rangée : titre gris, carré vide, sans +, « 4 masquées » ; la rangée se replie sur sa ligne. Un second toucher la réaffiche. Les soldes ne bougent pas (le masque est visuel) (`i8-masque.png`, Ventes masquée) | 202 | 7 / 7 |
| **tout** | **i1 + i4 + i7 + i8** (i8 ne change rien au repos). Sans i2, i3, i5 ni i6 | 202 | 7 / 7 |

Dans toutes les pages : le + au même endroit que g-d1 (295,728, 44 × 44) ; aucun texte sous 14 px ; largeur 390.

## Retouche 2 : les 8 problèmes de la critique
1. **Lien du chariot (i1, tout)** : réparé, tracé de g-d1. Contrôle neuf `LIEN` : le lien part du bas de sa barre (± 1,5 px), fait 25 px au moins et finit dans le chariot ; sur la version rejetée (lien 295→311 pour un Porter qui finit à 315, 16 px de haut), il échoue par calcul : non rejoué, la version n’est plus sur le disque.
2. **Marge sous la bande (tout)** : 7 px entre la bande et « Brassins » (contrôle `MARGE` ≥ 6 sur les pages avec i1).
3. **Jauge (i5, tout)** : retirée de la bande ; jours au toucher de la semaine. Contrôle `JAUGE dans la bande`.
4. **Pastille (i6, tout)** : « ⏲ 2 » de g-d1, 46 × 32 partout ; « en retard » dans la feuille. Contrôle `PASTILLE grossie` (> 48 × 33).
5. **Résumés (i2)** : une place, rangées de plusieurs choses seulement. Contrôle `RESUME` : même ligne que le titre (± 2 px), à sa droite.
6. **Date (i3)** : plus de 3e ligne ; date au toucher de la semaine.
7. **Filtres (i8, tout)** : titre simple, état masqué capturé ; 9 px entre Travaux et Activités (contrôle `RANGEES VIDES` ≥ 8 ; g-d1 : 12).
8. **tout** : i1 + i4 + i7 + i8 ; le coup d'œil de g-d1 revient, seul ajout dans la bande : le mouvement.

## Contrôles (`node gi/build.mjs && node gi/cap.mjs`)
Sortie : **CONTROLE OK**, 16 pages (g-d1, i1 à i8, tout, tout-cave, i3-toucher, i5-toucher, i6-toucher, i8-masque, tout-masque), défauts 0.
- Toutes : tête 202 px (= g-d1), titres 7/7, rangées entières 7/7, pastille 46 × 32.
- i1, tout : `lien 318→344 (barre 317, chariot 331-357) · marge 1re rangée 7 · vides 9` ; g-d1 : `lien 295→321 (barre 294, chariot 308-334) · marge 2 · vides 12`.
- Toujours vérifiés : chevauchements de texte, bords, coupes, nom qui déborde, + qui couvre « −94 » (pris par le contrôle à +12 px, corrigé à +11).
- Les pages ont un petit script (fonction immédiate, `window.GI`) pour les touchers ; `cap.mjs` les joue à la souris.

Captures, toutes ouvertes en plein format : `cap/g-d1.png` (référence), `cap/i1.png` … `cap/i8.png`, `cap/tout.png`, `cap/tout-cave.png`,
`cap/tout-masque.png`, `cap/i3-toucher.png`, `cap/i5-toucher.png`, `cap/i6-toucher.png`, `cap/i8-masque.png`.

## Limites et doutes laissés
- i7 : « + S47 » reste posé sur la colonne S52 (doute du critique, non traité : la place du + est celle de g-d1).
- « −94 » des Papiers reste près du + (comme g-d1 ; contrôle à 2 px vert).
- i4 : le solde de départ (4 180) n'apparaît nulle part.
- i2 : Brassins sans résumé hors i1 (pas de place sur sa ligne).
- Lignes de titre d'Achats, Travaux, Activités, Papiers à 23 px au lieu de 26 dans i1 et tout : c'est là que se reprend la place de Brassins.
- Non retenues : un mot sous chaque picto, Activités en violet, rangée vide repliée ; en-tête de cd1 (segments, paliers, hypothèses, rangée de filtres, légende).
