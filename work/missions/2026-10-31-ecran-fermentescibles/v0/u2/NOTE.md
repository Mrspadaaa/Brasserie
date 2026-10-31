# u2 — nom et masse d'un trait (v0, série u, 31.10)

- **Chaleur** : tiède. Forme de l'approche libre : une ligne de saisie qui comprend « pils 5 », au-dessus d'une facture à points.
- **Axes** : A1 la liste en facture (nom à gauche, points de conduite, masse à droite) ; A2 la masse tapée, ou donnée dans la même
  frappe que le nom ; A3 un champ toujours ouvert, en tête, et les habituels en puces ; A4 une pastille de teinte, « ? » si inconnue.
- **L'idée** : « je veux juste avoir à taper le nom et la quantité au clavier » (l. 1279) pris au mot — une seule frappe, `pils 5`,
  et l'aperçu montre ce qu'Entrée va poser avant de le poser.

## Ce qui se voit et se touche
- En tête, la ligne de saisie : famille (Grain ⇄) · champ en chiffres mono, exemple `pils 5` · touche Entrée.
- Pendant la frappe, l'aperçu ambré : la ligne qui va naître (teinte, nom, moment, marque, masse) ; ↑ ↓ ou un toucher choisit un
  autre nom. Un nom absent : « Créer · grain, stock à zéro ». Un nom déjà là : « déjà dans la recette, la masse change ».
- `pils` seul → 0 kg, le curseur passe à la masse (l'acquis) ; `pils 5` → 5 kg ; `dextrose 400g` → 0,4 kg.
- Dessous, la facture : nom ··········· 5,0 kg ; en petit, le moment (pastille de couleur), la part, la marque.
- La marque « 3 couleurs à renseigner » au pied de la facture ; un toucher ouvre le champ couleur de la ligne, Entrée passe au suivant.

## Baseline (plancher à enrichir)
- [x] Éléments communs tels quels (en-tête, fil, bandeau, pied, +) ; bandeau absent sur la recette vide.
- [x] La ligne : nom, moment, part, masse. [x] 5 familles. [x] Famille figée sur la ligne. [x] Masse à zéro à l'ajout (sans masse tapée).
- [x] Jour d'ajout en fermentation. [x] Lactose et densité (annexe). [x] Clavier : nom, Entrée, masse, Entrée ; en plus, nom et masse d'un coup.

## Honnêteté
- « ? » pour une couleur inconnue, EBC « — », Morey de l'app ; rendement replié ; stock fictif dit. Une masse tapée dans la ligne est
  la sienne, pas une valeur plausible proposée : l'acquis « zéro à l'ajout » tient quand il ne tape pas de masse.

## Boosters UX
- ligne-de-saisie + apercu-entree — déclencher : l'aperçu change à chaque lettre (`cap-clavier-pendant`), Entrée pose la ligne (`-apres`).
- famille-ajout, puces-habituelles, masse, teinte, moment, a-renseigner : comme u1.
- B1 OK · B2 OK (la ligne de saisie domine le haut, la facture le corps) · B3 OK (57 mots) · B4 OK · B5 OK · B6 OK · B7 OK (pire
  5,27:1) · B8 OK (annexe : vide, 8 grains, lactose, fruit J+3 ; hors ligne non dessiné) · B9 partiel · B10 OK (aucun `type="number"`,
  `autocapitalize="off"`) · B11 « trois malts, ce qu'ils pèsent, une ligne pour en ajouter » · B12 OK (STANDARD OK) · B13 OK à l'œil.

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK (STANDARD ECHEC au premier essai, rayons de 2 px des pastilles de moment,
  corrigé en ronds). `mots-premier-ecran --max=80` : 57, MOTS OK. `controle-contraste` : CONTRASTE OK. `verifier-page` : PAGE OK.
- Hauteur : 0,65 écran ; 8 grains : 1,01 écran.

## Ce qui tient, ce qui casse
- Tient : au PC, c'est le plus rapide (une frappe par malt) ; l'aperçu évite la mauvaise ligne.
- Casse : au téléphone, la grammaire « nom masse » ne se devine pas sans l'exemple ; la facture à points évoque le papier, à juger.

Captures : `cap-*.png` (mêmes noms que u1), `verif-haut.png`.
