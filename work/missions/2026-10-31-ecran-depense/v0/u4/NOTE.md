# u4 — le pont : chaque ligne de la facture câblée à son article du stock (v0, 31.10)

- **Chaleur** : chaude (forme libre).
- **Axes** : A3 le lien au stock comme dessin (un câble par ligne) ; A2 malts repliés en un faisceau (aucun doute) ; A1 l'argent
  en deux pastilles au-dessus.
- **L'idée** : à gauche la facture, à droite le stock rangé par famille, des câbles entre les deux. Plein vert : relié ; tireté
  bleu : nouvel article ; violet vers un « bis » posé sous l'article existant, jamais dessus ; ambre coupé d'un « ? » : unité à
  préciser. Le mapping se voit ; un doublon de fiche aussi.

## Sa facture, et ce qui est simulé
Ses lignes (les 5 moutures suivent leur malt, icône ⛓). Simulé, et dit : le stock d'essai, « Target α 11,8 » et « Hallertauer
Blanc DE » (articles existants, en tireté gris, sans câble), l'unité illisible de Sabro (sa facture : « g »), la prévision de
90,00, le doublon 380001 ; moyen « déduit », échéance « déduite ».

## Baseline, cochée
- [x] justificatif (vignette du bandeau) · [x] Total TTC (se tape ; « 23 lignes … ≠ … écart » au bandeau)
- [x] Pour quoi ?, date, Déjà payé / À payer, payé le et moyen, échéance, fournisseur et catégorie, dépense prévue (la fiche,
  sous le pont) · [x] lignes : toucher une ligne ou son article ouvre l'inspecteur (quantité × prix = montant, type d'achat,
  réception : article, autre article, nouvel article, aucun mouvement, matériel ; retirer) ; ajouter, regrouper, « Détail »
- [x] référence et TVA (référence, document, taux lus, TVA, HT) · [x] pied · [x] ×

## Honnêteté
- Aucun lien deviné en silence : chaque câble se voit, sa couleur dit sa nature ; un « bis » ou une unité manquante reste tireté
  tant qu'il n'est pas réglé.
- TVA : « 1,95 + 2,20 = 4,15 ≠ 2,80 colonne · bases 26,20 + 84,20 = 110,40 ≠ 86,50 » ; Payé le « 27.04 supposée ».
- Ligne : « 40 g × 0,04 = 1,60 ✓ au centime » et l'imprimé « Target 11.3% » ; levures « (= 2 sachets) ».
- Écarts : le prix unitaire s'affiche « 0,04 » au lieu de l'imprimé « 0,040 » ; « Pour quoi ? » sans marque « proposé ».

## États (annexe, sur le pont)
1 lecture (le stock est déjà là, les câbles attendent) · 2 tous les câbles pleins (illustration) · 3 premier écran · 4 un câble
tireté devenu plein · 5 erreur · 6 Drive à connecter · 7 envoi puis reçu · 8 doublon : ce document câblé à l'autre dépense
(n°, commande, total) · 9 hors ligne.

## Boosters UX
- `pont-stock` — lire et choisir ; câbles SVG, toucher une ligne surligne son câble et ouvre l'inspecteur (`u4-cable-target.png`,
  `u4-target-regle.png`) · faisceau des malts (`data-u4-malts`) — déplier · `argent` — deux pastilles qui s'ouvrent
  (`u4-argent-tva.png`) · bouton ⛓ 5 (`u4-cable-mouture.png`, `u4-mouture-reglee.png`) · `compteur` · `drive-pret`
- B1 OK · B2 OK — le pont domine · B3 OK — 98 mots (au bord du seuil de 98 du lot) · B4 OK · B5 non mesuré · B6 OK — 28/14/13/12
  (4 tailles : la colonne du stock est à 13 px pour garder « Hallertauer Blanc CH » entier : écart voulu) · B7 OK — CONTRASTE OK
- B8 OK · B9 partiel · B10 OK · B11 « chaque ligne va à son article ; 4 câbles en pointillé » · B12 OK · B13 OK — rangées de 30 px

## Contrôles (sorties)
- PAGE OK · COMMUN OK (série) · MOTS OK (98) · CONTRASTE OK (pire 4,94:1) · PANEL OK (série)

## Ce qui tient, ce qui casse
- Tient : il voit le mapping (« plein de fiche du même produit » devient visible) ; le bis est posé à côté de l'existant.
- Casse : 98 mots, sans marge ; les câbles se croisent beaucoup au milieu ; le bandeau sombre change l'habillage de la feuille.

Captures : `u4-haut.png`, `u4-page.png`, `u4-repos.png`, `u4-argent-tva.png`, `u4-cable-mouture.png`, `u4-mouture-reglee.png`,
`u4-cable-target.png`, `u4-target-regle.png`, `u4-enregistre.png`, `u4-1280.png`.
