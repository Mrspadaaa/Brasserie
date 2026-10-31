# r4 — l'étagère : ce qui entre au stock

- **Chaleur** : chaude (forme libre : un ruban de caisse dentelé pour l'argent, une étagère de tuiles pour le stock).
- **Axes** : A2 groupées par famille, en tuiles ; A3 le lien au stock porté par la tuile (icône, tuile double pour un « bis », « ? » pour l'unité, étiquette « + mouture » en pointillé sur le malt) ; A1 sur la tuile même, plus le compteur qui saute ; argent séparé du stock.
- **L'idée** : la facture vue comme ce qui va entrer au stock, un carton par article ; l'argent tient sur un ruban au-dessus, avec ses deux doutes.

## Baseline (inventaire) — cochée
- [x] justificatif (icône : Voir l'original, Changer) · [x] Total TTC (ruban) · [x] Pour quoi ? · [x] Achat du
- [x] Déjà payé / À payer, payé le (supposée), moyen E-Finance, échéance déduite (chip « Payé 27.04 ») · [x] Fournisseur et catégorie · [x] Lier
- [x] lignes en tuiles ; au toucher, plateau : `quantité × prix = montant` qui se tapent, contrôle au centime, mouture et son prix au kg, `Stk = sachets`, article ⇄, type, aucun mouvement, retirer · [x] ajouter · [x] regrouper · [x] Détail (rubrique Lignes)
- [x] Référence et TVA · [x] pied · [x] ×
- [~] fiche matériel non dessinée

## Honnêteté
La somme d'une famille ne compte une mouture qu'une fois rattachée ; le reste s'affiche à part, « +1,50 » en pointillé. TVA `2,80 · 4,15`, calcul et bases dans son panneau, HT vide ; « supposée » sur la date de paiement ; α sur chaque houblon ; Target et Hallertauer en tuile double, à régler dans le plateau ; Sabro « 30 ? » (**simulé**) ; un nouvel article (Goldings, Verdant IPA) a sa pastille bleue, jamais deviné.

## Boosters UX (boosters-ux)
- Boosters : `tuile` (plateau) ; `mouture` (étiquette qui s'attache, le prix au kg remplace « mouture ») ; `etagere` ; `paye`, `tva`, `preuve`, `compteur` ; `drive` ; `confirmer`. Captures : `r4-repos`, `r4-tuile-ouverte`, `r4-mouture`, `r4-tous-regles`, `r4-enregistre`, `r4-1280`, `r4-1280-annexe`.
- B1 OK — l'étiquette de mouture et la tuile changent au toucher.
- B2 OK — 86,50 en 28 px ; une action noire.
- B3 OK — 97 mots ; les montants de ligne passent au plateau (écart voulu : l'étagère montre ce qui entre au stock, l'argent est sur le ruban et par famille).
- B4 OK — familles. B5 OK. B6 OK — 12 / 14 / 16 / 28. B7 OK — pire 5,13:1. B8 OK — 9 états. B9 OK. B10 OK — 0 `type="number"`. B11 OK. B12 OK. B13 OK — tuiles de 96 px.

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK
- `mots-premier-ecran --profil=sans-houblons --max=100` : r4 97 mots, MOTS OK
- `controle-contraste --profil=sans-houblons` : pire « TVA » 5,13:1, CONTRASTE OK
- `verifier-page --min-images 0` : PAGE OK ; `controle-panel` (série) : PANEL OK

## Ce qui tient, ce qui casse
- Tient : le stock, son souci (« plein de fiche du même produit »), se voit d'un coup : relié, nouveau, bis, mouture.
- Casse : les montants par ligne sont à un toucher, ce qui ne compare pas le papier ligne à ligne ; la raison d'un « bis » (α 11,8, origine DE) n'apparaît qu'au plateau ; 3 colonnes coupent les noms longs sur deux lignes.
