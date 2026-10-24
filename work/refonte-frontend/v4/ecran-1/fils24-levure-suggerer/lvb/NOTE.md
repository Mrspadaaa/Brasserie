# lvb — tiède : un pont « Et avec une autre levure ? › », son effet chiffré sur une ligne (corrigé après CRITIQUE.md)

Jeu court jc-levure (D35). Page : copie de Suggérer rendue par r4 (bundle dans `../assets/`) ; seul le pont s'ajoute.

## Correction après le critique (REJET du 24.10, `../CRITIQUE.md`)
- **Les barres l5b reviennent dans la feuille** (acquis « Barres de type l5b », L07) : une par souche, celles de lva, sur
  l'axe noir et la visée en tirets de Suggérer ; blanche bordée (sans fiche), pointe orangée hors style, hachures.
- **Pomona n'est plus mise en avant** : la ligne au repos ne nomme plus de souche et commence par l'objectif manquant
  (« floral, résineux : non établis », hachure), puis la fourchette d'agrumes « ~+1,3 à ~+2,8 ». Dans la feuille, Verdant
  IPA vient d'abord ; Pomona dit « agrumes hors style » en petit gris, à côté d'« estimé ».
- **Le pont remonte sous les cartes d'objectif**, visible sans défiler (il était au bout de cinq écrans).
- Greffe de lvc : sous la liste, la hachure a son mot, « floral, résineux : non établis ».

## Ce qui est montré
- Sous les trois cartes : un bloc-bouton à bord noir, icône levure, « Et avec une autre levure ? », chevron, et la ligne
  chiffrée.
- Toucher : une feuille du bas, « Changer de levure » ; « Toute la bière · houblons et IBU 59,7 inchangés » ;
  « Aujourd'hui SafAle US-05 » ; Verdant IPA puis Pomona, cases et barres l5b ; « Ouvrir l'étape Levure › » (copie
  de l'étape rendue, `levure.html`) ; « Fermentation à revoir · stock de levure non suivi ». × ou Échap ferme.

## Données
Moteur en direct (`outils/levures-moteur.ts`, `donnees/levures-moteur.json`) : Verdant agrumes ~+1,3 cran, Pomona
~+2,8 hors style (35,5 > 30) ; noyau ~+4,4 et ~+4,3 hors style ; floral et résineux non établis (null, jamais 0).

## Chaleur : tiède
La forme de l'approche : un pont vers l'étape Levure, avec son effet sur une ligne. Écart : le toucher ouvre d'abord un
aperçu. L'étape Levure rendue est celle de Dryhopper (Idaho 7 fixé, 4 g/L, actif) : y arriver depuis Suggérer
montrerait un houblon qu'il n'a pas choisi.

## Ce qui tient
- Suggérer reste à un facteur : la levure n'est pas une voie de la liste, c'est une sortie.
- La ligne répond avant le toucher : la levure ne dit rien du floral ni du résineux.

## Ce qui casse
- Deux gestes jusqu'à l'étape (pont, puis « Ouvrir l'étape Levure ») au lieu d'un.
- Le bloc du pont pousse la liste de 72 px sous les cartes.
- Les traits hors style des cases restent noirs, comme dans la page rendue (défaut de r4).

## Contrôles
- G1 : JEU-BIEN. G2, `controle-commun.mjs … lva lvb lvc --page=etat.html --sans=mots` : COMMUN OK (rejoué après la
  correction). Premier essai : STANDARD ECHEC (S4, icône levure et × à 2,1 px), redessinées à 1,2 px.
- Captures : `captures/lvb-repos.png`, `captures/lvb-toucher.png` (390 × 844), refaites et ouvertes.
