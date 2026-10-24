# a1, passe 2 : « Le rail sous le pouce » (voie r7a2, 23.10)

Question : « Quand ajouter Idaho 7 ? ». Un seul facteur libre, le moment. Chaleur froide : c'est y1b et l'écran de la
carte, affinés. La v0 reste intacte dans `../a1/`. Régénérer : `node generer.mjs`. Les captures et le geste joué au
doigt viennent de `node captures/travail/capturer.mjs`, dont la sortie est dans `captures/travail/geste.json`.
`socle.mjs` est une copie du socle de la série avec trois changements : chemins à un niveau de plus, picto épicé de
la planche et écart Pomona calculé.

## Passe 2

Greffes du tri (`tri/SYNTHESE.md`), une greffe par ligne :
- **Dock-profil** (e1) : le relief de la v0 devient les cases du dock, une par moment. La hauteur dit le floral ; un
  trait orangé au pied dit que l'amertume sort du style. La case du doigt est éclaircie.
- **Quatre pastilles d'étape** (a4) au-dessus du rail : 60′–0′ ~+2, WP ~+14, actif ~+22, après ~+23. Ce sont des
  sauts, et elles gardent les jours en dry hop.
- **Ce que la chaleur ou le CO₂ emporte** (d2) : sur chaque barre, l'écart avec le dry hop après fermentation, aux
  mêmes jours. Exemples : à 20′, floral ≈+11 contre ~+23 ; en actif, le végétal et le résineux que le CO₂ emporte.
- **« le meilleur : actif · 2 j »** (g4), rappelé sous la réponse quand on s'en écarte, caché au repos. Calcul :
  floral gagné moins résineux gagné, amertume dans 50–70 ; à 0,05 près, le plus tôt.
- **« sans gain »** (e2) : les jours hachurés dans le bloc des jours (3 j et 7 j : moins de 0,1 point sur le jour
  d'avant).
- **Le pont levure suit le moment** (g1, g4). En actif : « Pomona ~+13 agrumes ». Ailleurs : « rien ne change ici ».
  L'écart est calculé sur la grille (M07). Pomona contre US-05 : agrumes +12,9 à +13,1 en actif, 0 à chaud et après
  fermentation, comme le dit [[dryhop-moment]].
- **« jamais mesuré à ce moment »** (c5) sur fond hachuré, en ébullition et au whirlpool.

Pas reprises :
- la courbe d'activité de la levure sur le rail (f5, g6) : il faut des mots pour la lire, et le budget de 80 n'en
  laisse pas ;
- les quatre cases qui s'ouvrent (e3) : elles font doublon avec les pastilles, que le tri préférait.

Retouches du tri :
1. **Le vide** (D4, D55) : la page tient la hauteur moins le dock (mesuré au rendu) et la figure s'étire. Il n'y a
   plus de trou entre la source et le dock.
2. **Pastille « par floral »** de y1b, en lecture seule (D104) : « par ✿ floral » à droite de « Face à ta stout ».
   Le critère complet (plus floral, moins résineux, amertume dans le style) est derrière le « ? ».
3. **80 mots au plus** : Pépins, Melon et Épicé sont repliés derrière leurs trois pictos et un chevron. Le pouce dit
   le cran (2 j, 20′, WP) ; l'étape est sur la pastille. Le mot « fixé » est retiré de la ligne de contexte.
   Compte : 79 mots.

Retouches communes :
- une seule unité (points ~) ;
- α du lot puis la plage des fiches (D87) ;
- loupe ×5,4 (64 px contre 11,8) ;
- le meilleur et le piège visibles (cases orangées, jauge) ;
- les conventions derrière le « ? » (interpolé, contour, sans gain).

Autres changements :
- Épicé : cannelle et clou croisés, le symbole `p-spice` de la planche standard, repris tel quel.
- Départ sur le meilleur moment (actif · 2 j) au lieu d'actif 3 j, qui sature.

Levure : la forme du concept est le **pont**, vers `fils22-carte/levure-outil` (outil propre), avec un texte qui
suit le moment.

## Baseline

Repris :
- y1b : le moment glissé par 5′ sur le rail (`data-pas="5"`, joué au clavier et au doigt), « Face à ta stout », la
  jauge d'amertume (zone 50–70, Nugget 60, à cru hachuré « ? ») et le dock sous le pouce avec loupe ;
- x3b réduit en fin de frise : le bloc des jours de contact (1 j, 2 j, 3 j, 7 j) au bout de la frise, sans gain
  hachuré ;
- l'écran de la carte : titre-question, ligne de contexte sans contrôle, au style par défaut avec Absolu, barres
  l5b (zone, rond « avant », barre « avec »), inconnu hachuré « ? » ;
- les acquis : code couleur, pictos au trait (épicé nouveau), α du lot puis plage, rôle en mot (mixte), stock en
  icône, légende derrière « ? », appui long et survol long vers la vraie fiche ;
- honnêteté : « ~ » simulé, « ≈ » interpolé (barre pâlie), vraie valeur avec sa source.
  - En actif : linalol 38 µg/L, McCabe 2023, E03. C'est une co-fermentation au pitch, dans un tableau aplati à
    vérifier.
  - Après fermentation : 1 h ≈ 96 h au nez, Titus 2021, E10.

Écarts, chacun avec sa raison :
- **Pépins, Melon, Épicé repliés** (à un toucher) : pour tenir 80 mots. Ce sont deux inconnues et une famille
  faible (~+2).
- **Le contour de ce que la chaleur ou le CO₂ emporte n'est pas hachuré**, alors que d2 le hachurait. Dans l'app, le
  hachuré veut dire « inconnu » ([[pictos-familles]]) ; un contour ne prête pas à confusion.
- **Second houblon « puis » et levure en pastilles de y1b non repris** : ce sont deux autres facteurs, que D98 et la
  carte excluent de Dryhopper.
- **Radars m4 et h4 seulement dans la fiche** : l'écran lit une évolution selon le moment.
- **Le résineux de ta dégustation** n'est plus écrit sous la figure (mots). Sa barre et son ~+14 orangé le
  montrent, et le « ? » le dit.

## Contrôles (passe 2, tous obligatoires)

| critère | contrôle | sortie |
|---|---|---|
| G1 | `controle-commun … --sans=mots` | **COMMUN OK** : couleurs, au style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes |
| G2 | `mots-premier-ecran … --max=80` | **MOTS OK**, 79 mots |
| G3 | `controle-une-question … --edition` (D98) | **UNE-QUESTION OK (1 groupe libre : moment)** : 9 contrôles ; contexte houblon, dose, levure, base |
| G4 | `controle-acquis … --outil=dryhopper` (D99) | **ACQUIS OK (4/4 : geste, frise, valeurs, levure)**, tout au repos |
| G5 | `verifier-page.mjs` | **PAGE OK** : 390 px, sans erreur |

Geste au doigt (`geste.json`) :
- avant : actif · 2 j, ~+22, 60 IBU tenue, Pomona ~+13 agrumes, linalol 38 µg/L ;
- glissé vers 30 % du rail : 20′, ≈+11, ≈119 IBU trop amer, « rien ne change ici », « jamais mesuré à ce moment »,
  « le meilleur : actif · 2 j » ;
- loupe à 5 voisins, 64 px contre 11,8 px sur le rail.

Captures ouvertes : `captures/a1-premier-ecran.png`, `captures/a1-toucher-390.png`, `captures/a1-390.png`.
