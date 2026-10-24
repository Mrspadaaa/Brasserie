# Série F — Dryhopper, « Quand ajouter Idaho 7 ? », créatif à fond (v0 ×8)

Voie r7f-dryhopper (mission 2026-10-22-reprise-lot21), concepteur Fable, 22–23.10. Huit concepts minimalistes,
forme libre, tous sur la baseline, un seul facteur libre : le moment (60′ … 10′ par 5′, whirlpool, dry hop actif
J1–J7, après J1–J7). Contexte fixé sans contrôle : Idaho 7 (α 12,7 % du lot, fiches 9,5–14,9), 4 g/L, US-05,
stout 16D. Générateur : `generer-f.mjs` (données tirées de `profils-simules.json`, grille Idaho 7 à 4 g/L, et du
pack pour l'α, les arômes et les IBU par gramme) ; captures : `capturer-f.mjs` → `captures/`.

## Concepts

Chaleur demandée par VOIE.md : 8 chaudes (0 froide, 0 tiède). La chaleur porte sur la forme ; la baseline est suivie partout.

| id | chaleur | ce qu'il montre | le geste | une vraie valeur | la levure |
|---|---|---|---|---|---|
| f1 La cuve en coupe | chaude | la journée en colonne verticale : chaudière 100 °C (60′…10′), whirlpool ~80 °C, cuve 20 °C (actif / après, J1–J7) ; à droite les 12 familles en barres l5b, zone 16D, rond creux = ma bière avant | le jeton Idaho 7 se glisse de haut en bas dans la colonne (role=slider, par 5′) | E07 Sharp 2014 : ébullition → végétal cuit, herbacé ; dry hop 48 h → tropical, agrumes, noyau, pin (Simcoe 1,5 g/L) | pont « Levure › » |
| f2 La balance de ta dégustation | chaude | « plus floral, moins résineux » (18.10) en deux plateaux ; la balance penche vers le plus lourd ; deux pistes d'objectif (visée en trait noir) ; réponse : Idaho 7 va contre ta dégustation à tout moment, actif vaut mieux qu'après | rail horizontal par 5′ sous les pistes | E03 McCabe 2023 : myrcène Idaho 7 0,085 ± 0,029 mg/L, ×7 sous Azacca (au pitch, S-04, 14 j) ; le moteur suit la fiche (pin, résine) | dernière étape « 3 » : le CO₂ d'US-05 emporte ~−0,6 cran de résineux face à après ; biotransformation non publiée |
| f3 Le cadran | chaude | radar 12 axes au centre (m4/h4, pictos seuls, trait fin = avant, forme pleine = avec Idaho 7, zone 16D grise, « ? » sur pépins et melon) ; les moments en anneau autour (60′ en haut, WP, actif, après) | molette circulaire au doigt sur l'anneau, 22 crans | E10 Titus 2021 : 1 h de contact se distingue du témoin à 30 j (Cascade 1,43 g/L) | pont « Levure › » |
| f4 La carte de chaleur | chaude | 12 familles × 11 moments en cases pleines à la couleur de la famille (plus plein = plus fort), inconnu hachuré, bord orangé hors 16D ; à droite les crans 16D en points (zone) ; la colonne du moment choisi encadrée | le doigt glisse sur le rail d'en-tête, par 5′ (les 11 crans d'ébullition sur les deux premières colonnes) | E08 Schmidt 2019 : l'essentiel passe en 2 jours de contact (Eureka! 2,5 g/L, −1 °C) | dernière étape « 3 » : CO₂ emporte résineux ~−0,6 et végétal ~−0,5 cran face à après |
| f5 L'agenda du brassin | chaude | bande du temps : J0 brassage (60′…10′, WP) puis J+1…J+12, courbe d'activité d'US-05 (~fin J+5, « à confirmer à la densité »), barre de contact d'Idaho 7 ; plan en une ligne (« dans la cuve du J+1 au J+4, US-05 encore active ») | le cône se glisse sur l'agenda | E08 (2 jours) | dernière étape « 3 » : la levure trace la frontière actif / après ; houblons sortis au J+n |
| f6 Le barboteur | chaude | ce que le moment emporte : chaudière fumante (ébullition, WP), barboteur qui bulle (actif), muet (après) ; sur chaque barre l5b, le hachuré = la part perdue face au dry hop après J7 ; « la vapeur emporte ~81 % à 60′ », « le CO₂ emporte ~17 %, surtout végétal, épicé, herbacé » | rail horizontal par 5′ | E05 Wolfe 2012 : hydrocarbures au pic vers 3–6 h puis baisse ; terpénols montent sur 24 h (Cascade 3,86 g/L) | dernière étape « 3 » : US-05 n'emporte que ; Pomona convertirait géraniol → citronellol (agrumes ~+13 points, simulé) |
| f7 Le nez du verre | chaude | ta stout en verre, le nez en 12 bulles au-dessus, une par famille, chacune dans un anneau gris = haut de la 16D (la bulle remplit l'anneau = au haut du style ; au-delà, orangée) ; « ? » pointillé pour l'inconnu | dock fixé sous le pouce (y1b), rail par 5′ | E03 : jury CATA 14–22 personnes sur Idaho 7 au pitch : tropical, ananas, papaye, mangue, lemongrass ; linalol 38 ± 13 µg/L | pont « Levure › » |
| f8 Le compromis | chaude | amertume ajoutée (~IBU, pack 1,27 IBU/g à 60′ × 80 g) contre fruité ajouté (crans 16D) ; chaque moment un point sur la courbe ; rectangle gris = la stout reste dans la 16D (amertume ≤ +10, fruité ≤ 3 crans) ; à cru, IBU non modélisé : points à gauche en pointillé | rail horizontal par 5′ ; le gros point suit | E07 (régimes à dose égale) | pont « Levure › » |

Levure : quatre concepts en dernière étape (f2, f4, f5, f6), quatre avec un pont vers l'outil Levure (f1, f3, f7, f8).
Descripteurs : option B ; la fiche d'Idaho 7 écrit « autres mots : aucun » (ses 12 descripteurs Beer Maverick ont tous une
famille), la part « autres » est donc dite vide plutôt que cachée.

## Baseline

Repris partout (`controle-commun --sans=mots` : COMMUN OK sur f1–f8) :
- le titre en question, la ligne de contexte sans contrôle (houblon avec α du lot puis plage des fiches, rôle en mot
  « double », stock en icône grise 12 px, dose, levure, base) ;
- la lentille au style / absolu, au style par défaut, et une zone 16D visible sur chaque représentation (barres, pistes,
  polygone, points, rectangle, anneaux) ;
- le code couleur des arômes (tons des jetons de famille), pictos au trait sans halo, légende derrière « ? » (fermée) ;
- l'appui long sur Idaho 7 → la fiche (α du lot et des fiches, silhouette radar des fiches, arômes sourcés « 1/1 fiche »,
  huile, geste de goût), survol 650 ms à l'ordinateur, Échap ou × ferme ; un toucher court ne l'ouvre pas ;
- le geste d'y1b : glisser le moment par 5′, au premier écran, avec une bulle qui nomme le moment ; « face à ta stout » en
  une ligne (familles en couleur, « dans la 16D » ou n hors style, amertume) ; le simulé marqué « ~ », l'inconnu hachuré et
  écrit « inconnu », l'interpolé (55′ … 15′) marqué « ≈ interpolé », l'IBU à cru dit « non modélisé », jamais 0.

Écarts, et leur raison :
- **Le dock fixé en bas** n'est repris que dans f7 : dans les sept autres, le geste a une autre forme (colonne f1, rail
  f2/f6/f8, molette f3, rail d'en-tête f4, agenda f5), parce que la forme du geste est le concept. Il reste au premier écran.
- **La loupe ×3 sous le doigt** est remplacée en v0 par une bulle qui nomme le moment ; greffe à faire en passe 2 (D63/D67).
- **La jauge d'amertume de toute la stout** est réduite à une ligne « ~ IBU 60 → N » (f8 en fait un axe entier).
- **La pastille de critère et « puis »** (second houblon) ne sont pas repris : un seul facteur libre et pas de second houblon
  dans Dryhopper (carte du conseil du 22.10).
- **x3b réduit** (ma bière → 1 dry hop → 2) n'est pas repris en v0 : la comparaison de cuves sort du facteur unique ;
  **a2b** survit en texte dans les étapes levure (le CO₂ emporte) et par le pont.
- **Barres l5b** : f1 et f6 les portent entières ; f2 en pistes d'objectif ; f4 les remplace par des cases + points de
  crans ; f3 par le radar ; f7 par des bulles ; f8 par un point. Raison : la série est « créatif à fond », chaque concept
  doit répondre par une représentation différente.
- **Mots** : 95 à 159 au premier écran (indicatif en v0, cf. MOTS ci-dessous) ; la ligne « mesuré » et l'étape levure
  pèsent ; à alléger en passe 2 (un toucher).

## Contrôles joués une fois (v0)

- **D98** `controle-une-question.mjs … f1 f2 f3 f4 f5 f6 f7 f8 --page=etat.html` : `UNE-QUESTION OK (1 groupe libre : moment)` ;
  chaque page : « libres : moment · 1 contrôle(s) · contexte : houblon, dose, levure, base ».
- **Commun (baseline)** `controle-commun.mjs … --sans=mots` : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste,
  fiche, standard, trait, légende, parlant, brutes OK). Deux pièges levés en route : le délai d'appui long doit être
  inférieur à celui du contrôle (500 ms contre 650), le clic synthétisé après le relâchement est avalé 350 ms (sinon il
  touche le voile et referme la fiche) ; survol 650 ms contre 900.
- **D99** `controle-acquis.mjs … --page=etat.html` : `ACQUIS ECHEC` sur les huit (radar, chimie, osu, valeurs « absent »).
  Ne s'applique pas : ce sont les quatre acquis de Comparer ; Dryhopper n'a ni panel OSU ni chimie côte à côte. Recopié
  pour mémoire, rien à corriger ici.
- **MOTS** `mots-premier-ecran.mjs … --max=80 --page=etat.html` : f1 129 · f2 159 · f3 95 · f4 122 · f5 146 · f6 131 ·
  f7 103 · f8 121 → `MOTS ECHEC 8/8 au-dessus de 80` (indicatif en v0 ; y1b était à 134).

## Captures (ouvertes)

`captures/f1-390.png` … `f8-390.png` (premier écran, départ actif · J3), `f1-60-390.png` … `f8-60-390.png` (le moment
glissé à 60′ : barres qui tombent, « trop amère », IBU 60 → 162, chaudière qui fume dans f6, point en bas à droite dans
f8), `f1-fiche-390.png` (la fiche d'Idaho 7 ouverte à l'appui long). Aucune erreur de page, aucun défilement horizontal ;
f6 déborde d'un écran (925 px) : l'étape levure demande un petit défilement.
