# p4a4 — a1 retourné : la réponse, puis les quatre étapes (voie dh4a, passe 4 de Dryhopper sur a1, 24.10)

**Chaleur : tiède — la réponse d'abord.** Base : a1 passe 3 (`serie-a/passe3/a1`), y1b affiné, plancher à enrichir (L07).
Page : `etat.html` ; captures : `../captures/p4a4-premier-ecran.png`, `-pendant.png`, `-apres.png` ; geste : `geste.json`.

## Améliorations du brief prises
- **2.** Ce que la chaleur ou le CO₂ emporte devient une ligne de chaque étape, flamme ou bulles et floral emporté face au dry hop après : 60′ −21, whirlpool −9, actif −1.
- **6.** La réponse se lit par ses chiffres (★ actif · 2 j, floral ~+22, résineux ~+14, 60+? IBU) ; étapes en picto et en mots entiers, « trop » dans la case orangée.
- **5.** Les jours sont les crans du rail (pas de boutons).
- **4.** Noyau, Baies hachurés, « ? ».

## Greffes et leur source
les quatre pastilles d'étape (a4), « trop amer » dans la case (a8), le meilleur rappelé quand on s'en écarte (g4, b4), la case du doigt qui s'ouvre (e3), le profil du dock (e1).

**Obligatoire, tenu** : la baseline d'a1 (pictos au trait, épicé en cannelle et clou croisés, couleurs des familles,
barres l5b, au style / absolu, α du lot puis plage, « mixte » en mot, stock en icône, fiche à l'appui long avec le
certificat du lot), le thème blanc de ses maquettes (D106 : page blanche, gris neutres), « ~ » simulé, « ≈ » interpolé,
l'inconnu jamais zéro (Noyau, Baies : ma bière avant non décrite, barre hachurée de leur couleur, « ? → ~+21 »), un seul
facteur libre (le moment), la levure en contexte et en pont (« Puis la levure »), rien de Levure en outil propre.

## Ce qui tient
a1 : barres l5b, amertume, loupe ×5,6, vraie valeur, pont ; le doigt affine par 5′ et la case de l'étape suit (à 20′ : ≈+11, ≈119 trop, −12).

## Ce qui casse
les rubans par famille d'a1 sont remplacés par deux mini-barres par étape (floral, résineux) ; « −21 » se lit sans légende comme une perte, mais « face au dry hop après » reste derrière le « ? ».

## Geste (joué au doigt, `geste.json`)
De ★ actif · 2 j (floral ~+22, 60+? IBU, Pomona ~+13 agrumes, linalol 38 µg/L McCabe 2023) à 20′ (floral ≈+11, ≈119 IBU
trop amer, « contre ★ actif · 2 j : floral ≈−11 », « jamais mesuré à ce moment »). Aucune erreur, 390 px sans défilement.

## Contrôles (rejoués depuis la racine, 24.10, sur les six pages de la voie)

| critère | sortie |
|---|---|
| G2 `controle-commun --page=etat.html --sans=mots` | **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) |
| G3 `controle-une-question --page=etat.html` | **UNE-QUESTION OK (1 groupe libre : moment)** ; contexte : houblon, dose, levure, base |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 36 mots hors données |
| `controle-panel` (6 premiers écrans de la voie) | **PANEL OK** : remplissage médian 0,67, ressemblance 0,88, 0/15 paires presque identiques |

`--sans=mots` : prévu par le brief (le plafond de la passe est 80 mots hors données, joué par G4). Aucun écart à la baseline.
Régénérer : `node ../p4a-outil/generer.mjs p4a4 --captures` (socle : `../p4a-outil/socle.mjs`, repris d'a1 passe 3).

## Retouches du conseil dh4 (`conseil-dh4/verdict.md`, 24.10)
- Noyau et Baies : l'avant est inconnu (Nugget ne les décrit pas), le gain d'Idaho 7 est connu. La valeur dit « ?→~+8 » et « ?→~+21 » à actif · 2 j (« ?→≈+4 », « ?→≈+11 » à 20′), dans la couleur de la famille. Jamais « 0 », jamais un « ? » seul. Barre hachurée de sa couleur, sans rond « avant ».
- Loupe à 0 px d'intersection avec la figure (`[data-figure]`), mesurée au DOM doigt posé : 20′ 0 px · whirlpool 0 px (8,8 px avant retouche) · après · 7 j 0 px.
- Rubans d'a1 sous chaque barre (24 cases, cerclé au pouce) dans les 73 px vides : vide carte → dock 73 → 22 px au repos (mesuré au DOM : bas de carte 681, haut du dock 703).
- Bandeau de réponse sur fond clair (plan gris, bord encre), plus de fond noir.
- Boutons de jours d'a1 (1 · 2 · 3 · 7 j, pointillé sans gain) au dock, dans le groupe du moment.
- Aucune greffe croisée entre variantes. Captures refaites et ouvertes ; G1 à G5 rejoués (COMMUN OK, UNE-QUESTION OK, MOTS OK, PANEL OK).
