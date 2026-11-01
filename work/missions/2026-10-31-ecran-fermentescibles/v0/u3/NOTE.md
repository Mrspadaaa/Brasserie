# u3 — le verre se compose (v0, série u, 31.10)

- **Chaleur** : chaude. Forme libre.
- **Axes** : A4 la teinte de la bière qui se compose au-dessus (option c), et la couleur se pose en touchant une règle des teintes ;
  A1 la liste, en gouttes ; A2 la masse tapée ; A3 un champ toujours prêt, les habituels en puces au-dessus.
- **L'idée** : un grand verre en tête d'écran ; il reste hachuré et marqué « ? » tant qu'un malt n'a pas sa couleur, et se teinte sous
  les yeux quand il les renseigne (« le graphique beaucoup plus grand », PORTRAIT § 1.2 ; « pas de chimie nue », § 4).

## Ce qui se voit et se touche
- La scène : le verre, l'échelle des teintes de bière (paille → cuivrée, 0–40 EBC), la plage du style en trait noir (21C, EBC 6–14),
  le mot de la teinte (« Paille ») et « dans le style » ; l'EBC chiffré reste au bandeau (un chiffre, une fois).
- Inconnu : verre hachuré, « ? », pas de repère sur l'échelle, la marque « 3 couleurs à renseigner ».
- Chaque malt est une goutte à sa couleur ; « ? » tiretée si inconnue. Toucher la goutte ouvre la règle des teintes de malt (1 à
  1500 EBC, logarithmique) : toucher ou glisser pose la couleur, ou la taper ; Entrée passe au malt suivant. Le verre suit.
- Sous la liste : les habituels (stock, icône verte), puis le champ « Ajouter un malt, un sucre » et sa famille.

## Baseline (plancher à enrichir)
- [x] Éléments communs tels quels ; bandeau absent sur la recette vide (le verre vide reste, sans repère).
- [x] La ligne : nom, moment, part, masse. [x] 5 familles. [x] Famille figée. [x] Masse à zéro à l'ajout. [x] J+ en fermentation.
- [x] Lactose (sous la ligne), densité (annexe). [x] Clavier : nom, Entrée, masse, Entrée.

## Honnêteté
- Le verre ne se teinte qu'avec toutes les couleurs du grain (règle de `computeBeerColor`) ; sa hauteur ne dit rien, il est plein dès
  qu'il y a du grain. Les sucres n'entrent pas dans la teinte (comme l'app). La règle des teintes est une échelle de saisie : la
  valeur posée est la sienne. Plage du style : BJCP 2021, 21C (SRM 3–7). Stock fictif dit.

## Boosters UX
- verre — lire : hachuré « ? » → paille, dans le style (`cap-recette` → `cap-couleurs`).
- regle-teintes — régler : toucher ou glisser pose l'EBC sous le doigt (`cap-couleur-pendant`).
- teinte (goutte), masse, moment, ajout-clavier, famille-ajout, puces-habituelles, a-renseigner.
- B1 OK · B2 OK (le verre domine) · B3 OK (59 mots) · B4 OK · B5 OK · B6 partiel (24 px pour le mot de teinte et le « ? » : 4 tailles) ·
  B7 OK (pire 5,27:1) · B8 OK (inconnu, vide, 8 grains, lactose ; hors ligne non dessiné) · B9 OK (teinte et repère en 250 ms,
  `prefers-reduced-motion` respecté) · B10 OK · B11 « une NEIPA dont la couleur est encore inconnue ; trois malts à renseigner » ·
  B12 OK (STANDARD OK) · B13 OK à l'œil.

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK. Au premier essai, COULEURS ECHEC (2 teintes franches) : l'icône verte du
  stock ajoutée ; CONTRASTE signalait 4 textes sur dégradé : le fond de la scène est devenu plein.
- `mots-premier-ecran --max=80` : 59, MOTS OK. `controle-contraste` : CONTRASTE OK. `verifier-page` : PAGE OK.
- Hauteur : 0,73 écran ; 8 grains : 1,04 écran (à la limite de D5).

## Ce qui tient, ce qui casse
- Tient : sa vraie recette, sans couleur, devient une question visible et frappante ; renseigner se fait en touchant une teinte.
- Casse : la scène prend 190 px pour une seule réponse ; avec 8 grains on touche 1,04 écran. La règle des teintes est longue à lire
  au doigt pour les malts très pâles (2 à 5 EBC serrés à gauche).

Captures : `cap-*.png`, `verif-haut.png`.
