# Carte des outils houblons — fil de fer (voie r1-carte, 22.10)

Le premier geste du conseil (`cerveau/decisions/2026-10-22-carte-outils-houblons.md`) : une page qui suit
la **stout export 16D** (« trop résineuse, je la veux plus florale », 18.10) de l'étape Houblons de Ma
bière jusqu'à Dryhopper et Levure. Un écran par outil, une question dans le titre, un seul facteur libre,
les autres fixés sur une ligne de contexte, le pont vers l'outil suivant dans un `nav`.

Ouvrir `carte.html` (390 px). Chaque vignette est la vraie page, réduite ; un toucher l'ouvre. Dans la
carte, le facteur libre est encadré en bleu et le contexte en pointillé (`?carte`). Régénérer :
`node generer.mjs --captures`.

## La carte

| Écran | Question (titre) | Facteur libre | Facteurs en contexte | Pont | Éléments admis |
|---|---|---|---|---|---|
| Ma bière, étape Houblons (`ma-biere`) | point d'entrée, sans question | aucun (lecture) | — | « + floral » → Suggérer ; Nugget → Substituer (deux façons) ; la ligne Nugget → Dryhopper ; « US-05 · levure » → Levure | IBU/OG/EBC, alerte dégustée, barres l5b au style (radar m4/h4 en lentille), ingrédient : α, rôle en mot, dose, moment, IBU |
| Suggérer (`suggerer`) | Quel houblon ajouter à ma bière ? | houblon (les candidats, à cocher) | base 16D, dose 4 g/L, moment après 3 j, levure US-05 | « Comparer les 3 » → Comparer | visée « Plus floral », α, rôle, barre floral au style, effet sur le résineux, « fiche partielle » |
| Comparer (`comparer`) | Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? | houblon (la variété retenue, colonne touchée ; « + » ajoute une colonne) | base, dose, moment, levure | « Placer <gagnant> » → Dryhopper | α (lot, plage, ≠) et rôle en tête, radar à 12 axes au style (zone du 16D), floral / tropicaux / résineux chiffrés ; « Chimie, panel OSU, vraies valeurs : lot 22 » en gris, pas en commande |
| Substituer, la porte (`substituer-porte`) | Lequel à la place de Nugget ? | houblon (le remplaçant) ; Nugget épinglé en colonne 1 | base, moment à 60′, dose à IBU égal | « Remplacer » → Ma bière ; « Tous les remplaçants » → outil | α, rôle, dose, stock en icône, familles citées en couleur, les 3 familles du 16D soulignées |
| Substituer, l'outil (`substituer-outil`, u4) | Par quoi remplacer Nugget ? | houblon (les remplaçants cochés) | base, moment à 60′, dose à IBU égal | « Face à face » → la porte (Comparer) | les 8 remplaçants de u4 : α, familles, proximité, dose, stock |
| Dryhopper (`dryhopper`) | Quand ajouter Idaho 7 ? | moment (frise au pouce : ébullition par 5′, whirlpool, dry hop actif / après en jours) | houblon Idaho 7, dose 4 g/L, levure US-05, base | « Puis la levure » → Levure | 6 familles au style, IBU qui suit le moment, x3b réduit « ma bière → +1 dry hop → +2 » |
| Levure, étape (`levure-etape`) | Et avec quelle levure ? | levure (US-05, Pomona) | houblon, dose, moment actif 3 j, base | « Ajouter à ma bière » | étape 2/2 de Dryhopper, 5 familles qui bougent, confiance, « après fermentation, rien ne change » |
| Levure, outil (`levure-outil`, a2b) | Que change ma levure ? | levure (US-05, Pomona) | houblon, moment, dose, base | « Garder » ; « Changer le moment » → Dryhopper | tableau a2b : ce que le houblon apporte, ce que la levure ajoute |

Les deux façons de Substituer et de Levure sont côte à côte dans la carte, sous « deux façons, à toi de
choisir en regardant ». Aucune question fermée (L24).

## Passe 2 (critique r5-critique-carte, 22.10)

Structure gardée : questions, « varie » / « fixé », deux façons côte à côte. Écrans repris :
- **Radar de Comparer** : 12 axes dans l'ordre de la roue de la base (lot 16 r2, agrumes en haut) ;
  `data-radar`, `data-axes`, séries `data-serie`. La zone du style est la seule surface pleine. Un trait
  de 2,5 px par houblon, sans tiret ni série noire sans nom (D48, D57, D39, D77 : RADAR-SERIES OK). Les
  secteurs non situés sont hachurés. Au-delà de ×2 la zone, un trait sort du cercle.
- **α** (D87, L14) : l'α du lot, puis la plage des fiches. « ≠ » en orangé quand le lot sort des fiches
  (Galaxy 17,2 ≠ 11–16 ; Nelson Sauvin 9,6 ≠ 10–14). Sans lot, la plage seule (Magnat 11–16 %). Il
  figure aussi dans Dryhopper et les deux Levure, dans le jeton « Idaho 7 » du contexte. ALPHA OK.
- **Rôle en mot** : « mixte » pour le « double » de la règle rôle-α v1.
- **Suggérer, extras** (D76) : sous chaque candidat, toutes les familles hors objectif qui apportent au
  moins 0,5 point (picto et barre à la couleur de la famille, souligné orangé si hors style). La plus
  forte est chiffrée.
- **Écrans pleins** (D4) : du contenu sur 0,80 à 0,83 du premier écran (`captures/mesures.json`), avec
  70 mots au plus.
  - Ma bière : les 12 familles, avec le profil en couleur.
  - Dryhopper : 12 familles, rail collé au contenu.
  - Substituer : perd / gagne, huile totale, proximité par composante (base u4).
  - Levure : familles qui bougent, puis « sans effet ».
- **Rail de Dryhopper** (D47, L12) : aucune graduation au repos. Doigt posé : les 13 graduations du
  segment et une loupe des moments voisins, à 64 px d'écart contre 10,8 px sur le rail (×5,9 dans
  l'ébullition).
- **Légendes** derrière « ? », fermées au repos, Échap les ferme (LEGENDE OK). Aucun mot de stock au
  premier écran : une icône seule (D23 ter).
- **Carte** : les six étapes sont numérotées. Chaque vignette est rognée à la hauteur de sa page
  (postMessage).

## Ce qui tient

- Les huit écrans passent UNE-QUESTION (un groupe libre chacun : houblon ×4, moment, levure ×2) et COMMUN
  (mots ≤ 70, couleurs, au style, survol, blocs, contraste, standard, trait, parlant, brutes).
- Les données suivent un seul cas : grille de `comparer-stout.json` à 4 g/L, US-05, après 3 j (Suggérer,
  Comparer), actif 3 j (Dryhopper, Levure) ; remplaçants, doses à IBU égal, α et stock de
  `base/consolide/substitution.html` ; IBU 60, OG 1,066, EBC 70 de `biere.html`.
- Ce qu'apprend le parcours, sans texte : chaque dry hop ajoute ~+8 à ~+20 au résineux déjà hors style ;
  Galaxy sort les tropicaux du style (~+39) ; Idaho 7 donne le plus de floral (~+23) ; Pomona n'ajoute
  qu'en dry hop actif (agrumes ~+13), rien après fermentation ; Idaho 7 à 60′ porterait l'IBU à ~162.
- Honnêteté : tout le simulé porte « ~ » ; entre deux points de la grille, la frise montre des barres
  hachurées et « ? » ; l'IBU à cru est « non modélisé » ; le « +2 dry hops » est « ? » (pas simulé).

## Ce qui casse ou reste ouvert

- Dryhopper glisse par 5′, mais la grille n'a l'arôme qu'à 60′, 10′, whirlpool et aux jours 1, 2, 3, 5,
  7 : la maquette montre « ? » ailleurs. L'app calculera en direct (`simulerCas` ~1,4 ms, [[cout-calcul-moteur]]).
- Le radar de Comparer s'arrête à ×2 la zone. Au résineux, les trois houblons sortent du cercle : c'est
  vrai (la stout est déjà hors style), mais leur différence ne s'y lit pas. Elle se lit dans les lignes
  chiffrées dessous. Le choix entre r2 (superposé) et r3 (petits multiples) reste au lot 22.
- Substituer est un outil d'amérisant à 60′ : les familles « perd » pèsent peu à ce moment-là. Elles
  viennent des fiches (base u4), pas de la bière.
- Rôles « double » de la règle rôle-α v1 (prototype) ; α de Galaxy 17,2 et de Nelson Sauvin 9,6 hors des
  plages des fiches (ENTREES.md, « Douteux »). Montrés tels quels.
- Nelson Sauvin porte « fiche partielle » (83 % de mots hors familles, L14) : sa barre floral le sous-estime.
- Levure : seules US-05 et Pomona sont simulées ; Verdant et Diamond (a2b) sont dites « non simulées ».

## Fiche et légende laissées aux lots d'outil

COMMUN se joue ici avec `--sans=fiche,legende`. La **fiche** au long appui (D25, g1 / Citra cryo) et la
**légende** derrière un bouton (D89) appartiennent au contenu détaillé de chaque outil : ce fil de fer
fixe l'ordre, les questions, le facteur libre et les ponts, pas le détail. Les ajouter ici doublerait le
travail des lots d'outil (le lot 22 pour Comparer, voies r6a à r6m) et brouillerait la lecture de la carte.
Les noms de houblon restent des cibles évidentes pour la fiche.
