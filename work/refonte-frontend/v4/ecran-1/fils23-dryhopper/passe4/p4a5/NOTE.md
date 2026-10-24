# p4a5 — a1 sous ses preuves : mesuré, plage, simulé (voie dh4a, passe 4 de Dryhopper sur a1, 24.10)

**Chaleur : tiède — les vraies valeurs d'abord.** Base : a1 passe 3 (`serie-a/passe3/a1`), y1b affiné, plancher à enrichir (L07).
Page : `etat.html` ; captures : `../captures/p4a5-premier-ecran.png`, `-pendant.png`, `-apres.png` ; geste : `geste.json`.

## Améliorations du brief prises
- **1.** La plage et l'écart sont interpolés entre deux crans calculés, et c'est dit : « ≈ 60′–10′ » sous la table, plage en pointillé.
- **4.** Noyau, Baies : avant inconnu hachuré, « ? » ; le whirlpool « jamais mesuré » hachuré ; l'amertume à cru « 60+? ».
- **2.** Sous chaque étape de la table, le floral que la chaleur ou le CO₂ emporte (flamme, bulles).

## Greffes et leur source
la table des preuves alignée sur les étapes (c7), « jamais mesuré » hachuré (c5), la mesure qui suit le doigt (c7, d1), le certificat du lot (d5), la plage du moteur derrière la barre (x3b), les fioles sur le rail (c2).

**Obligatoire, tenu** : la baseline d'a1 (pictos au trait, épicé en cannelle et clou croisés, couleurs des familles,
barres l5b, au style / absolu, α du lot puis plage, « mixte » en mot, stock en icône, fiche à l'appui long avec le
certificat du lot), le thème blanc de ses maquettes (D106 : page blanche, gris neutres), « ~ » simulé, « ≈ » interpolé,
l'inconnu jamais zéro (Noyau, Baies : ma bière avant non décrite, barre hachurée de leur couleur, « ? → ~+21 »), un seul
facteur libre (le moment), la levure en contexte et en pont (« Puis la levure »), rien de Levure en outil propre.

## Ce qui tient
les barres l5b d'a1, l'avant, le style, « contre ★ », la loupe ×5,6. Les plages sont celles de la grille du moteur (profils-simules.json) : floral actif 2 j 0,1–63.

## Ce qui casse
l'honnêteté fait peur : les plages vont de 0 à 63 (floral), 0 à 123 (herbacé), et une barre de ~+22 paraît petite à côté ; la mesure d'après est sur Cascade (Lafontaine 2018), pas sur Idaho 7, et c'est écrit ; 52 mots, le plus bavard des six.

## Geste (joué au doigt, `geste.json`)
De ★ actif · 2 j (floral ~+22, 60+? IBU, Pomona ~+13 agrumes, linalol 38 µg/L McCabe 2023) à 20′ (floral ≈+11, ≈119 IBU
trop amer, « contre ★ actif · 2 j : floral ≈−11 », « jamais mesuré à ce moment »). Aucune erreur, 390 px sans défilement.

## Contrôles (rejoués depuis la racine, 24.10, sur les six pages de la voie)

| critère | sortie |
|---|---|
| G2 `controle-commun --page=etat.html --sans=mots` | **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) |
| G3 `controle-une-question --page=etat.html` | **UNE-QUESTION OK (1 groupe libre : moment)** ; contexte : houblon, dose, levure, base |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 52 mots hors données |
| `controle-panel` (6 premiers écrans de la voie) | **PANEL OK** : remplissage médian 0,67, ressemblance 0,88, 0/15 paires presque identiques |

`--sans=mots` : prévu par le brief (le plafond de la passe est 80 mots hors données, joué par G4). Aucun écart à la baseline.
Régénérer : `node ../p4a-outil/generer.mjs p4a5 --captures` (socle : `../p4a-outil/socle.mjs`, repris d'a1 passe 3).

## Retouches du conseil dh4 (`conseil-dh4/verdict.md`, 24.10)
- Noyau et Baies : l'avant est inconnu (Nugget ne les décrit pas), le gain d'Idaho 7 est connu. La valeur dit « ?→~+8 » et « ?→~+21 » à actif · 2 j (« ?→≈+4 », « ?→≈+11 » à 20′), dans la couleur de la famille. Jamais « 0 », jamais un « ? » seul. Barre hachurée de sa couleur, sans rond « avant ».
- Loupe à 0 px d'intersection avec la figure (`[data-figure]`), mesurée au DOM doigt posé : 20′ 0 px · whirlpool 0 px · après · 7 j 0 px (15 px avant retouche).
- Loupe abaissée (top −60 → −36 px, 52 px) : elle couvre le pont et les fioles pendant le geste, plus la carte.
- Aucune greffe croisée entre variantes. Captures refaites et ouvertes ; G1 à G5 rejoués (COMMUN OK, UNE-QUESTION OK, MOTS OK, PANEL OK).
