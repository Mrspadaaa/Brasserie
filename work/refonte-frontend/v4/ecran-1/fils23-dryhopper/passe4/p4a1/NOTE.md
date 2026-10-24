# p4a1 — a1, froide : inconnu, jours au rail, lecture (voie dh4a, passe 4 de Dryhopper sur a1, 24.10)

**Chaleur : froide.** Base : a1 passe 3 (`serie-a/passe3/a1`), y1b affiné, plancher à enrichir (L07).
Page : `etat.html` ; captures : `../captures/p4a1-premier-ecran.png`, `-pendant.png`, `-apres.png` ; geste : `geste.json`.

## Améliorations du brief prises
- **4. L'inconnu n'est jamais zéro** : Noyau et Baies n'ont plus de rond « avant » ni de barre pleine ; la barre est hachurée de leur couleur (le niveau avec Idaho 7 est connu), l'écart est « ? » en gris (sur `p22-dryhopper-repos.png`, « ? » avec barre pleine).
- **5. Deux facteurs à l'écran** : les boutons de jours d'a1 disparaissent. Les jours sont les derniers crans du rail (actif et après, 1 à 7 j) ; sur le profil du dock, un jour qui ne gagne plus rien est pâle et en pointillé. La durée est la suite du moment, sans second réglage.
- **6. La lecture** : un fil vertical noir relie les rubans à la colonne du pouce, derrière les barres (on voit que la colonne cerclée est « là où tu es ») ; les étapes du dock portent leur picto (flamme, tourbillon, bulles, cuve au repos) et « whirlpool » en entier au lieu de « WP ».

## Greffes et leur source
aucune de plus qu'a1 (froide) ; le pont dit « Puis la levure » (brief).

**Obligatoire, tenu** : la baseline d'a1 (pictos au trait, épicé en cannelle et clou croisés, couleurs des familles,
barres l5b, au style / absolu, α du lot puis plage, « mixte » en mot, stock en icône, fiche à l'appui long avec le
certificat du lot), le thème blanc de ses maquettes (D106 : page blanche, gris neutres), « ~ » simulé, « ≈ » interpolé,
l'inconnu jamais zéro (Noyau, Baies : ma bière avant non décrite, barre hachurée de leur couleur, écart « ? »), un seul
facteur libre (le moment), la levure en contexte et en pont (« Puis la levure »), rien de Levure en outil propre.

## Ce qui tient
tout a1 : « Face à ta stout », rubans par famille, contour chaleur ou CO₂, amertume en ligne de figure avec son ruban, loupe chiffrée ×5,6, « contre ★ », vraie valeur sourcée, Pépins / Melon / Épicé repliés.

## Ce qui casse
le fil traverse les barres en fond : à 9 familles il se voit comme un curseur, mais il double la case cerclée ; sans les boutons de jours, aller de 2 j à 7 j demande un glisser plus fin dans le dry hop (la loupe aide).

## Geste (joué au doigt, `geste.json`)
De ★ actif · 2 j (floral ~+22, 60+? IBU, Pomona ~+13 agrumes, linalol 38 µg/L McCabe 2023) à 20′ (floral ≈+11, ≈119 IBU
trop amer, « contre ★ actif · 2 j : floral ≈−11 », « jamais mesuré à ce moment »). Aucune erreur, 390 px sans défilement.

## Contrôles (rejoués depuis la racine, 24.10, sur les six pages de la voie)

| critère | sortie |
|---|---|
| G2 `controle-commun --page=etat.html --sans=mots` | **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) |
| G3 `controle-une-question --page=etat.html` | **UNE-QUESTION OK (1 groupe libre : moment)** ; contexte : houblon, dose, levure, base |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 29 mots hors données |
| `controle-panel` (6 premiers écrans de la voie) | **PANEL OK** : remplissage médian 0,67, ressemblance 0,88, 0/15 paires presque identiques |

`--sans=mots` : prévu par le brief (le plafond de la passe est 80 mots hors données, joué par G4). Aucun écart à la baseline.
Régénérer : `node ../p4a-outil/generer.mjs p4a1 --captures` (socle : `../p4a-outil/socle.mjs`, repris d'a1 passe 3).
