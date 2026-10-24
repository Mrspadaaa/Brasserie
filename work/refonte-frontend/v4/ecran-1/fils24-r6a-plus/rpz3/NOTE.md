# rpz3 · Un radar par colonne

Lot « r6a++ » (24.10, soir), série rpz (libre, brief minimal). Chaleur : **chaude**. Greffe : `radar-par-colonne`.
Page `etat.html` : r6a reprise telle quelle (split/join, L26) ; classes `rpz3-…`. Captures `../captures/rpz3.png`
(premier écran), `rpz3-390.png` (page entière), `rpz3-galaxy.png` (Galaxy touché), `rpz3-absolu.png` (lentille Absolu).

## L'idée, une seule
Ses mots sur le radar r2 de Comparer : « À revoir, on va en parler » ; plus tôt : « très compliqué à voir les
différence avec les cileur sur le spider graph » (D77). Le grand radar superposé devient **trois petits radars, un par
houblon**, dans l'ordre des colonnes et dans leur couleur : chacun plein, avec sa bande d'incertitude, la zone verte de
ta 16D, ta stout en trait noir, et **ses propres inconnus hachurés** (le grand radar ne hachurait que les familles
inconnues des trois à la fois ; ici Galaxy montre herbacé et terreux inconnus, Cascade terreux et noyau). Les douze
pictos à 12 px autour de chaque radar. Le radar du houblon mis en avant prend le fond gris de sa colonne. Même
pastille « ~ simulé », même lentille Au style / Absolu (les trois se redessinent).

## Ce qui tient
- r6a entière sous les radars : contexte, trois têtes, neuf rangées, chimie, panel OSU, pont, légende.
- Acquis « radar » : la section `data-acquis="radar"` reste, avec trois `svg[data-radar][data-serie]` au lieu d'un.
- Honnêteté : mêmes chiffres `RD` que r6a (centres, bandes, zone, ta stout) ; inconnu hachuré, jamais zéro.
- 72 mots au premier écran ; le tableau entier tient dans le premier écran (bas à 648 px), plus « Chimie » et le début
  du panel OSU.
- Geste : toucher Galaxy → son radar prend le fond gris (Galaxy:true, 3 séries) ; Absolu → les trois rétrécissent.

## Ce qui casse ou reste douteux
- **Écart à la baseline, voulu** : le radar r2 (acquis) n'est plus superposé. Raison : ses mots « À revoir » et D77 ; le
  superposé reste à un toucher dans r6a/r6n2, pas ici (une idée par page). À lui de dire si c'est ce qu'il voulait
  revoir.
- Les pictos à 12 px sont au plancher (D60) ; à 118 px par radar, les polygones sont petits : la forme se lit, le détail
  d'un cran non. Les rangées dessous donnent le détail.
- Les radars ne sont pas alignés au pixel sur les colonnes (les colonnes commencent après 76 px de libellés) ; l'ordre
  et la couleur font le lien.
- Première version : nom en couleur sur gris (4,24:1) et une mini légende écrite sous les radars ; corrigés (nom en
  encre avec sa pastille, légende dans le « ? »).

## Contrôles joués
- TRAIT OK (28 pictos, 0 faute). COMMUN OK (--sans=mots) ; premier essai : contraste ECHEC sur « Idaho 7 », corrigé.
- PANEL ECHEC sur les quatre captures (ressemblance 0,93) : attendu, même base r6a imposée.
