# p4a2 — a1, froide : interpolé dessiné, chaleur ou CO₂, levure (voie dh4a, passe 4 de Dryhopper sur a1, 24.10)

**Chaleur : froide.** Base : a1 passe 3 (`serie-a/passe3/a1`), y1b affiné, plancher à enrichir (L07).
Page : `etat.html` ; captures : `../captures/p4a2-premier-ecran.png`, `-pendant.png`, `-apres.png` ; geste : `geste.json`.

## Améliorations du brief prises
- **1. L'arôme entre deux moments** : le moteur ne simule l'arôme qu'à 60′, 10′, au whirlpool et à froid (`parcours/src/moteur/index.ts` : « le moteur simule l'arôme à 60′ et 10′ seulement »). Le profil du dock le dessine : crans calculés pleins et pointés, crans interpolés en fantôme pointillé sur la droite qui relie deux crans calculés ; la ligne du doigt dit « ≈ 60′–10′ ».
- **2. Le contour « chaleur ou CO₂ »** : le contour blanc d'a1 porte au bout son picto, la flamme à chaud, les bulles en fermentation active (ce que le moment perd face au dry hop après, mêmes jours).
- **3. La courbe de levure** : une bande sous le profil, une colline sur l'actif (la levure travaille, fin vers J+5), hachurée là où la biotransformation est possible mais non chiffrée, la levure en picto à son pied ; après, un trait plat (au repos).
- **4.** Noyau et Baies hachurés de leur couleur, écart « ? ».

## Greffes et leur source
la courbe d'activité de la levure (f5, g6), en bande au lieu du trait fin d'a1.

**Obligatoire, tenu** : la baseline d'a1 (pictos au trait, épicé en cannelle et clou croisés, couleurs des familles,
barres l5b, au style / absolu, α du lot puis plage, « mixte » en mot, stock en icône, fiche à l'appui long avec le
certificat du lot), le thème blanc de ses maquettes (D106 : page blanche, gris neutres), « ~ » simulé, « ≈ » interpolé,
l'inconnu jamais zéro (Noyau, Baies : ma bière avant non décrite, barre hachurée de leur couleur, écart « ? »), un seul
facteur libre (le moment), la levure en contexte et en pont (« Puis la levure »), rien de Levure en outil propre.

## Ce qui tient
a1 tel quel, ses boutons de jours compris (1 · 2 · 3 · 7 j, « sans gain » en pointillé).

## Ce qui casse
trois signes de plus (point, pointillé, picto au bout du contour) : à 12 px la flamme reste petite à côté de la barre ; la colline se lit sans légende comme « il se passe quelque chose ici », pas encore comme « biotransformation ».

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
Régénérer : `node ../p4a-outil/generer.mjs p4a2 --captures` (socle : `../p4a-outil/socle.mjs`, repris d'a1 passe 3).
