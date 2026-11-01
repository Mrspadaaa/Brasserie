# r2 — le ticket de la facture

- **Chaleur** : tiède (l'approche de la série : la ligne de ticket de Malts s1, le bandeau et les tuiles d'Identité r4-a, appliqués à la facture).
- **Axes** : A1 sur la ligne même (fond ambre, rangée de réglage dessous) ; A2 un ticket compact des 23 lignes dans l'ordre du papier ; A3 l'icône de lien par ligne, la mouture pendue au malt du dessus en sous-ligne pointillée ; A5 le bandeau « Brau- und Rauchshop · 27.04.2026 · 86,50 CHF · ✓ 23 lignes · 6 à régler » et la barre des 23 montants (hachurée là où il y a doute).
- **L'idée** : il lit sa facture ligne à ligne comme le papier, et seules les lignes douteuses changent de couleur et portent leur geste.

## Baseline (inventaire) — cochée
- [x] justificatif (icône d'en-tête : Voir l'original, Changer) · [x] Total TTC (bandeau, se tape) · [x] Pour quoi ? · [x] Achat du
- [x] Déjà payé / À payer · [x] Payé le (tuile « supposée ») et moyen E-Finance · [x] Échéance (déduite, si À payer)
- [x] Fournisseur et catégorie · [x] Lier à une dépense prévue
- [x] lignes ; au toucher, plateau : imprimé et code, `quantité × prix = montant` qui se tapent avec le contrôle au centime, type Ingrédient / Service / Matériel, article ⇄, aucun mouvement, retirer · [x] ajouter · [x] regrouper · [x] Détail X / Y (écart si un montant change)
- [x] Référence et TVA : n° facture (pro-forma), commande, TVA, taux, HT « — »
- [x] pied « Confirmer et enregistrer » avec l'état du Drive · [x] ×
- [~] fiche matériel non dessinée (aucune ligne matériel)

## Honnêteté
Mêmes règles que la série : TVA `2,80 · 4,15` en tuile, calcul et bases dans son panneau, HT vide ; « supposée » sur la date ; α du nom ; `= 2 sachets` ; Target bis, Hallertauer Blanc CH ; Sabro « unité ? » (**simulé**) ; prix au kg mouture comprise (2,40/kg) montré seulement une fois la mouture rattachée ; la barre et le Détail recalculent ce qu'il tape.

## Boosters UX (boosters-ux)
- Boosters : `compteur` (saute au point suivant) ; `preuve` ; `barre` (23 segments, touche = la ligne) ; `paye`, `tva`, `tva-choix`, `reglement` ; `ligne` (plateau) ; `mouture` (rattacher d'un toucher, le prix au kg apparaît) ; `bis` ; `unite` ; `stock` ; `drive` ; `confirmer`. Captures : `r2-repos`, `r2-ligne-ouverte`, `r2-tva-ouverte`, `r2-moutures`, `r2-tous-regles`, `r2-enregistre`, `r2-1280`, `r2-1280-annexe`.
- B1 OK — la barre et les sous-lignes de mouture changent au toucher.
- B2 OK — 86,50 à 32 px domine ; une seule action noire.
- B3 OK (à la limite) — 98 mots ; aucune phrase d'aide.
- B4 OK — verdict, argent, ticket, reste replié.
- B5 OK. B6 — 12 / 14 / 16 / 32 (le total en plus, voulu). B7 OK — pire 5,24:1. B8 OK — 9 états. B9 OK. B10 OK — 0 `type="number"`. B11 OK. B12 OK. B13 OK — cibles 24–32 px.

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK
- `mots-premier-ecran --profil=sans-houblons --max=100` : r2 98 mots, MOTS OK
- `controle-contraste --profil=sans-houblons` : pire « Payé » 5,24:1, CONTRASTE OK
- `verifier-page --min-images 0` : PAGE OK ; `controle-panel` (série) : PANEL OK

## Ce qui tient, ce qui casse
- Tient : sa langue (ticket s1, tuiles r4-a) ; le ticket se compare au papier ; la mouture se voit pendue à son malt.
- Casse : 98 mots, au plafond ; 23 lignes demandent du défilement pour trouver Sabro et Hallertauer (le compteur y saute) ; la barre colorée peut paraître décorative tant qu'on ne la touche pas.
