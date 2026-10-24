# p4a3 — a1 debout : la colonne du brassin sous le pouce (voie dh4a, passe 4 de Dryhopper sur a1, 24.10)

**Chaleur : tiède — le geste d'abord.** Base : a1 passe 3 (`serie-a/passe3/a1`), y1b affiné, plancher à enrichir (L07).
Page : `etat.html` ; captures : `../captures/p4a3-premier-ecran.png`, `-pendant.png`, `-apres.png` ; geste : `geste.json`.

## Améliorations du brief prises
- **1.** Dans la colonne, crans calculés pleins et pointés, interpolés en fantôme pointillé.
- **5.** Les jours sont les derniers crans de la colonne (actif, après) ; un jour sans gain est pâle. Aucun second réglage.
- **6.** Chaque étape de la colonne porte son picto (flamme, tourbillon, bulles, cuve), sans mot ; le pouce dit le moment.
- **4.** Noyau, Baies hachurés, « ? ».

## Greffes et leur source
le rail vertical (c3, a3) sous le pouce droit, d'une main ; la loupe chiffre floral et IBU (table d'IBU de b4) ; trait orangé si trop amer (e1).

**Obligatoire, tenu** : la baseline d'a1 (pictos au trait, épicé en cannelle et clou croisés, couleurs des familles,
barres l5b, au style / absolu, α du lot puis plage, « mixte » en mot, stock en icône, fiche à l'appui long avec le
certificat du lot), le thème blanc de ses maquettes (D106 : page blanche, gris neutres), « ~ » simulé, « ≈ » interpolé,
l'inconnu jamais zéro (Noyau, Baies : ma bière avant non décrite, barre hachurée de leur couleur, écart « ? »), un seul
facteur libre (le moment), la levure en contexte et en pont (« Puis la levure »), rien de Levure en outil propre.

## Ce qui tient
les barres l5b au style, l'amertume et sa bande, « contre ★ », la vraie valeur, le pont qui suit le moment ; le pas de 5′ (24 crans sur ~560 px, ~21 px par cran, loupe à 72 px : ×3,4).

## Ce qui casse
la colonne et les mini-colonnes disent la même chose pour le floral ; ×3,4 reste juste au-dessus du ×3 ; « 1 j · 2 j… » au repos
sont des graduations (demandées par le critique, contre D47 qui les voulait doigt posé seulement).

## Relance après le REJET du critique (`../critique/PASSE4.md`, 24.10)
- **Loupe hors de la figure** : elle s'ouvre à gauche du rail, au niveau du doigt, 92 px de large, sur la colonne du brassin
  seulement ; les neuf barres l5b restent visibles et bougent pendant le geste (`p4a3-pendant.png`). Deux lignes par voisin :
  moment et barre de floral, puis floral et IBU.
- **La carte remplie** : à la place des 86 px de vide, une mini-colonne par famille, plus l'IBU (le ruban d'a1 tourné de 90°,
  24 cases alignées sur la colonne du brassin, trait orangé hors du style) ; un trait noir passe au moment du pouce.
- **La colonne écrit ses étapes et ses jours** : « 60′ » et « 0′ » aux bouts de l'ébullition, « WP », « actif », « après » sous
  leur picto, « 1 j · 2 j · 3 j · 5 j · 7 j » dans les barres du dry hop.

## Geste (joué au doigt, `geste.json`)
De ★ actif · 2 j (floral ~+22, 60+? IBU, Pomona ~+13 agrumes, linalol 38 µg/L McCabe 2023) à 20′ (floral ≈+11, ≈119 IBU
trop amer, « contre ★ actif · 2 j : floral ≈−11 », « jamais mesuré à ce moment »). Aucune erreur, 390 px sans défilement.

## Contrôles (rejoués depuis la racine, 24.10, sur les six pages de la voie)

| critère | sortie |
|---|---|
| G2 `controle-commun --page=etat.html --sans=mots` | **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) |
| G3 `controle-une-question --page=etat.html` | **UNE-QUESTION OK (1 groupe libre : moment)** ; contexte : houblon, dose, levure, base |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 38 mots hors données |
| `controle-panel` (6 premiers écrans de la voie) | **PANEL OK** : remplissage médian 0,67, ressemblance 0,88, 0/15 paires presque identiques |

`--sans=mots` : prévu par le brief (le plafond de la passe est 80 mots hors données, joué par G4). Aucun écart à la baseline.
Régénérer : `node ../p4a-outil/generer.mjs p4a3 --captures` (socle : `../p4a-outil/socle.mjs`, repris d'a1 passe 3).
