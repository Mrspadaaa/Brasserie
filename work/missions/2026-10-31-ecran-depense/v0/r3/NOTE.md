# r3 — 86,50 en une barre, les points en cartes

- **Chaleur** : chaude (forme libre : bandeau de nuit, paquet de cartes qui glisse).
- **Axes** : A1 le fil « à régler » (une carte par point, argent puis stock, les pastilles en avancement) ; A2 lignes groupées par famille (Malts 35,35 · Mouture 1,50 · Houblons 20,05 · Levures 29,60), au second plan ; A5 le verdict poussé : le total en 40 px, la barre des 23 lignes à la largeur de leur montant, hachurée sur les doutes, et la preuve « Recoupé » en trois rangées.
- **L'idée** : la confiance d'abord (le total et ce qui est recoupé), puis un seul point à la fois, réglé d'un geste, la carte suivante arrivant seule.

## Baseline (inventaire) — cochée
- [x] justificatif (icône : Voir l'original, Changer) · [x] Total TTC · [x] Pour quoi ? · [x] Achat du
- [x] Déjà payé / À payer, payé le et moyen, échéance déduite (rubrique Paiement) · [x] Fournisseur et catégorie · [x] Lier
- [x] lignes par famille ; au toucher : type, article ⇄, aucun mouvement, retirer · [x] ajouter · [x] regrouper · [x] Détail 86,50 / 86,50
- [x] Référence et TVA (n° facture, commande, TVA, taux, HT « — ») · [x] pied (désactivé en gris tant qu'il reste un point ; il saute au point) · [x] ×
- [~] fiche matériel non dessinée ; [~] les montants des lignes ne se tapent pas ici (dans r1, r2, r4 oui)

## Honnêteté
Carte TVA : « colonne MWST 2,80 » contre « N + R 4,15 », `1,95 + 2,20 = 4,15 ≠ 2,80`, HT vide ; carte Payé le : « supposée 27.04 » contre « facture 27.04 », non imprimée ; carte Mouture : 5 malts, « +0,60 » puis « 2,40/kg » une fois rattachée ; Target α 11,3 contre 11,8 en stock ; Hallertauer CH contre DE ; Sabro « ? » (**simulé**). La barre hachure exactement les lignes non réglées.

## Boosters UX (boosters-ux)
- Boosters : `barre` (touche = la ligne et son calcul) ; `points` (pastilles, ›) ; `cartes` (paquet qui défile, s'avance seul) ; `total` ; `justificatif` ; `drive` ; `confirmer`. Captures : `r3-repos`, `r3-carte-2`, `r3-regle-1`, `r3-tous-regles`, `r3-enregistre`, `r3-1280`, `r3-1280-annexe`, `r3-flou`.
- B1 OK — la carte réglée avance la suivante, la barre perd ses hachures.
- B2 OK — le total en nuit domine nettement (capture floue).
- B3 OK — 97 mots, une carte à la fois. B4 OK. B5 OK. B6 — 12 / 14 / 16 / 24 / 40 (écart voulu : le verdict et les valeurs comparées).
- B7 OK — pire 5,74:1 ; couleurs des familles avec leur libellé. B8 OK — 9 états. B9 OK — défilement fluide, mouvement réduit respecté.
- B10 OK — 0 `type="number"`. B11 OK. B12 OK — l'étiquette « argent / stock ». B13 OK.

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK
- `mots-premier-ecran --profil=sans-houblons --max=100` : r3 97 mots, MOTS OK
- `controle-contraste --profil=sans-houblons` : pire « colonne MWST » 5,74:1, CONTRASTE OK
- `verifier-page --min-images 0` : PAGE OK ; `controle-panel` (série) : PANEL OK

## Ce qui tient, ce qui casse
- Tient : le plus « frappant » de la série ; le doute se règle comme une pile, sans chercher.
- Casse : les lignes ne sont plus dans l'ordre du papier (par famille) ; une carte à la fois cache les autres points (pastilles seulement) ; les montants de ligne ne se tapent pas ; le pied gris tant qu'il reste un point peut se lire comme bloqué.
