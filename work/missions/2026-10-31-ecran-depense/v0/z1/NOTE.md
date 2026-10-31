# z1 — le compteur à la place du bandeau (v0, série z, 31.10)

**Chaleur : froide.** La feuille « Nouvelle dépense » de la baseline, dans son ordre ; une seule idée : le bandeau ambre
« Facture · 23 articles · Lecture à confirmer » et ses sept puces deviennent un **compteur chiffré** (« 86,50 CHF · 23 lignes
recoupées · 3 points ») suivi de trois chips, une par point, qui sautent à la place du point ; chaque point se règle là où il vit.

**Axes** : A1 (le doute vit sur le champ ou la ligne, et un fil trié par risque le rejoint : argent, stock, stock), A2 (les 23 lignes
groupées par famille, repliées, les douteuses surlignées en ambre quand on ouvre), A3 (une icône de lien par ligne : chaîne = relié,
cercle pointillé + = nouveau, deux carrés = bis, trait = service ; la mouture se rattache d'un « rattacher ↑ »), A5 (le verdict).

**Les trois points sur sa facture** : TVA imprimée incohérente (2,80 · 4,15 côte à côte, « vide » proposé, le calcul dessous :
bases 110,40 ≠ 86,50, MWST 4,15 ≠ 2,80, HT laissé vide) ; mouture ×5 à rattacher au malt du dessus (ligne par ligne) ; Target α 11,3
lue contre 11,8 au stock (article bis ou même lot). Stock de la maquette : simulé (Maris Otter, Pilsner Malz, Weizenmalz hell,
Haferflocken, Nelson Sauvin, Safale US-05, Target 11,8 %, Hallertauer Blanc). « Payé le » porte « supposée » (= date de la facture,
non imprimée, dit dans le pli) ; « Pour quoi ? » porte « proposé » ; HT « non imprimé » et vide.

## Baseline cochée
- [x] justificatif : nom lisible, Voir, Changer, Drive prêt
- [x] Total TTC (tapable) · [x] Pour quoi ? · [x] Achat du (pli : mois, raccourcis) · [x] Déjà payé / À payer (bascule)
- [x] Payé le + moyen (pli) · [x] Échéance (apparaît avec « À payer ») · [x] Fournisseur et catégorie (pli) · [x] Lier à une
  dépense prévue (dans le pli Fournisseur)
- [x] lignes : famille, article, quantité, unité, montant, lien au stock ; type d'achat porté par la famille (Malts, Houblons,
  Levures, mouture = service) · [x] + ligne · [x] regrouper · [x] Détail 86,50 / 86,50 · [x] n° facture, n° commande, TVA, taux
  (N 8,1 / R 2,6 dans le calcul) · [x] Confirmer et enregistrer · [x] ×
- matériel : non montré (aucune ligne de matériel sur sa facture) ; retirer une ligne : à un toucher sur la ligne, non dessiné.

## Boosters UX (boosters-ux)
- Boosters : `compteur-points` — suivre ; compteur + chips ; saute à la place, barre le point réglé. `edition-sur-place` — ajuster ;
  champ mono souligné. `bascule-reglement` — choisir ; segment. `familles-repliables` — lire ; famille → lignes. `deux-valeurs` —
  choisir ; 2,80 · 4,15 · vide. `drive-pret` — suivre ; pastille. `action-unique` — déclencher.
- B1 OK (6 boosters, captures haut / regle diffèrent : TVA barrée, compteur 2) · B2 OK (le 86,50, un seul primary) · B3 alerte :
  95 mots au premier écran (seuil 70, toléré jusqu'à 98) · B4 OK · B5 OK (4–8 px) · B6 OK (14 / 16 / 30, deux familles, mono tabulaire)
  · B7 OK (CONTRASTE OK, pire 4,85:1) · B8 OK (9 états en annexe) · B9 OK (scale .97 à l'appui, flash 0,8 s) · B10 OK (inputmode,
  aucun type=number) · B11 : « 86,50 CHF, 23 lignes recoupées, 3 points à régler, le premier est la TVA » · B12 OK (chevron, rayons
  10/16) · B13 OK (28 px).
- Écarts voulus : aucun.

## Contrôles (sorties)
`verifier-page` : PAGE OK (390 px, sans erreur, sans débord). `controle-commun --profil=sans-houblons` : COMMUN OK (mots 95, modéré).
`mots-premier-ecran` : 95 (> 70, ≤ 98). `controle-contraste` : OK. `controle-panel` (les 4 z) : remplissage 0,42 (sous 0,50) —
la feuille a le blanc d'un formulaire ; ressemblance 0,90.

## Ce qui tient, ce qui casse
Tient : la baseline intacte et plus honnête ; trois secondes suffisent au verdict. Casse : avec 12 points, la rangée de chips
défile ; le remplissage est faible (formulaire).
