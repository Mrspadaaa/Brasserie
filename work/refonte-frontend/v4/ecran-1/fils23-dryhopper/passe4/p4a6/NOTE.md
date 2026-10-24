# p4a6 — a1 en chaîne : ma bière → Idaho 7 → levure (voie dh4a, passe 4 de Dryhopper sur a1, 24.10)

**Chaleur : tiède — x3b réduit en fin de frise.** Base : a1 passe 3 (`serie-a/passe3/a1`), y1b affiné, plancher à enrichir (L07).
Page : `etat.html` ; captures : `../captures/p4a6-premier-ecran.png`, `-pendant.png`, `-apres.png` ; geste : `geste.json`.

## Améliorations du brief prises
- **7.** x3b réduit en fin de frise : « Ma bière ~1,6 → + Idaho 7 ~24 → + 2ᵉ ? → levure » au-dessus du rail ; l'écran entier se lit en chaîne, Ma bière (niveau avant par famille) → + Idaho 7 (barres l5b, écart) → la levure (ce que Pomona y changerait).
- **3.** La courbe de la levure sous le rail : colline sur l'actif (fin vers J+5), hachurée là où la biotransformation est possible, non chiffrée ; l'en-tête Levure se hachure quand elle travaille.
- **4.** Ma bière « ? » hachuré pour Noyau et Baies, écart « ? ».

## Greffes et leur source
la chaîne en légende (b2, c8), le pont qui suit le moment (g1, g4), a2b (« voir ce que la levure change »).

**Obligatoire, tenu** : la baseline d'a1 (pictos au trait, épicé en cannelle et clou croisés, couleurs des familles,
barres l5b, au style / absolu, α du lot puis plage, « mixte » en mot, stock en icône, fiche à l'appui long avec le
certificat du lot), le thème blanc de ses maquettes (D106 : page blanche, gris neutres), « ~ » simulé, « ≈ » interpolé,
l'inconnu jamais zéro (Noyau, Baies : ma bière avant non décrite, barre hachurée de leur couleur, écart « ? »), un seul
facteur libre (le moment), la levure en contexte et en pont (« Puis la levure »), rien de Levure en outil propre.

## Ce qui tient
barres l5b au style, « contre ★ », amertume, loupe ×5,6 ; la colonne Pomona suit le moment (actif 2 j : agrumes ~+13 ; 20′ : rien).

## Ce qui casse
la colonne Pomona montre la levure avant son étape : elle reste un aperçu en lecture (pas de réglage), mais elle peut se lire comme un second facteur ; le « + 2ᵉ ? » est un fantôme sans geste ; pas de rubans par famille.

## Geste (joué au doigt, `geste.json`)
De ★ actif · 2 j (floral ~+22, 60+? IBU, Pomona ~+13 agrumes, linalol 38 µg/L McCabe 2023) à 20′ (floral ≈+11, ≈119 IBU
trop amer, « contre ★ actif · 2 j : floral ≈−11 », « jamais mesuré à ce moment »). Aucune erreur, 390 px sans défilement.

## Contrôles (rejoués depuis la racine, 24.10, sur les six pages de la voie)

| critère | sortie |
|---|---|
| G2 `controle-commun --page=etat.html --sans=mots` | **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) |
| G3 `controle-une-question --page=etat.html` | **UNE-QUESTION OK (1 groupe libre : moment)** ; contexte : houblon, dose, levure, base |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 45 mots hors données |
| `controle-panel` (6 premiers écrans de la voie) | **PANEL OK** : remplissage médian 0,67, ressemblance 0,88, 0/15 paires presque identiques |

`--sans=mots` : prévu par le brief (le plafond de la passe est 80 mots hors données, joué par G4). Aucun écart à la baseline.
Régénérer : `node ../p4a-outil/generer.mjs p4a6 --captures` (socle : `../p4a-outil/socle.mjs`, repris d'a1 passe 3).
