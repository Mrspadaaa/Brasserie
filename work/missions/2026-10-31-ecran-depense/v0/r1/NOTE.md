# r1 — la feuille d'aujourd'hui, ses doutes à leur place

- **Chaleur** : froide (affine la baseline : même feuille, même ordre des champs, même pied).
- **Axes** : A1 sur le champ même (le doute vit sur « Payé le », sur la rangée TVA, sur chaque ligne douteuse), plus la liste « 6 à régler » triée argent puis stock qui saute à sa place ; A2 repliées sauf les douteuses (la rubrique Articles reste fermée, ses 4 doutes de stock sont posés dessous) ; A3 une icône par lien (relié, nouveau, bis, unité à préciser, mouture) et leur compte dans le résumé ; A5 le verdict à la place de « Lecture à confirmer ».
- **L'idée** : la feuille qu'il connaît, où la carte jaune de sept phrases devient un verdict d'une ligne et où chaque doute se règle sur son propre champ, rubriques fermées.

## Baseline (inventaire) — cochée
- [x] justificatif : « Voir le justificatif ⌄ » et « Changer »
- [x] Total TTC (champ, 86,50, mono 24 px) · [x] Pour quoi ? (proposé en code, sans prose)
- [x] Achat du (replié, date, Hier / Aujourd'hui) · [x] Déjà payé / À payer
- [x] Payé le (supposée, Confirmer ou ⇄) et moyen (E-Finance, lu) · [x] Échéance (si À payer, « déduite · 10 Tage netto »)
- [x] Fournisseur et catégorie · [x] Lier à une dépense prévue
- [x] lignes : n°, libellé, montant, type, icône du lien ; au toucher : type, article ⇄, aucun mouvement, retirer · [x] ajouter · [x] regrouper · [x] Détail 86,50 / 86,50 (écart montré si un montant change)
- [x] Référence et TVA : n° de facture, n° de commande, TVA source, taux N 8,1 % · R 2,6 %, HT « — »
- [x] pied « Confirmer et enregistrer » · [x] × qui ferme
- [~] matériel : le type « Matériel » existe, la fiche matériel n'est pas dessinée (aucune ligne matériel sur sa facture)

## Honnêteté
Date de paiement « supposée » (A7) ; TVA « 2,80 · 4,15 » côte à côte avec son calcul `1,95 + 2,20 = 4,15 ≠ 2,80`, bases `110,40 ≠ 86,50`, HT vide (C3) ; pro-forma payée reste « Déjà payé » (A6) ; α tirée du nom (A9) ; levures `2 Stk = 2 sachets` (S4) ; Target α 11,3 ≠ 11,8 → « Target bis » (D215) ; Hallertauer Blanc CH ≠ DE → « Créer CH » (D216) ; Sabro « unité ? », aucune unité préchoisie, rien en stock sans elle (D214, **simulé** : sa facture imprime « g ») ; 5 moutures rattachées seulement par son geste (S5). Taille du fichier : 0,7 Mo (mesure d2, 735 721 octets).

## Boosters UX (boosters-ux)
- Boosters : `points` (liste triée qui saute) ; `preuve` (23 lignes ✓, la preuve à un toucher) ; `date-supposee` (Confirmer / ⇄) ; `doutes-stock` (rangées qui se règlent sans ouvrir les 23 lignes) ; `tva` (choix 2,80 / 4,15 / vide) ; `articles` (compte par icône) ; `drive` ; `confirmer` (envoi non bloquant puis reçu). Captures avant/après : `r1-repos.png`, `r1-point-tva.png`, `r1-articles.png`, `r1-tous-regles.png`, `r1-enregistre.png`.
- B1 OK — 8 boosters marqués, chacun change l'écran (compteur 6 → 5, rangée qui disparaît).
- B2 OK (partiel) — le total à 24 px et le compteur dominent ; une seule action noire.
- B3 OK — 97 mots, aucune phrase d'aide au repos ; détail à un toucher.
- B4 OK — rubriques en boîtes ; doutes collés à leur rubrique.
- B5 OK — gaps 6 / 8 px.
- B6 OK — 12 / 14 / 16 + total 24 (4 tailles : écart voulu, le total domine).
- B7 OK — CONTRASTE OK, pire 5,22:1 ; une seule couleur de doute (ambre).
- B8 OK — 9 états en annexe.
- B9 OK — flash sur le point atteint, `prefers-reduced-motion` respecté.
- B10 OK — 0 `type="number"`, `inputmode` decimal / numeric.
- B11 OK — « Brau- und Rauchshop, 27.04.2026, 86,50, 23 lignes, 6 à régler » se lit en 3 s.
- B12 OK — mêmes icônes de stock dans les 4 concepts de la série, chevron ⌄ partout.
- B13 OK — cibles 28–32 px.

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes OK)
- `mots-premier-ecran --profil=sans-houblons --max=100` : r1 97 mots, MOTS OK
- `controle-contraste --profil=sans-houblons` : pire « Total TTC en CHF » 5,22:1, CONTRASTE OK
- `verifier-page --min-images 0` : PAGE OK ; `controle-panel` (série) : PANEL OK, remplissage médian 0,57, ressemblance 0,82
- `controle-choix` : sans objet, aucun choix du brasseur pour cet écran au registre

## Ce qui tient, ce qui casse
- Tient : c'est sa feuille, tout est à sa place connue ; les 6 points visibles au premier écran sans ouvrir une rubrique.
- Casse : peu de « booster » visuel (c'est une feuille) ; la TVA vit en bas, loin de l'argent du haut ; le résumé des icônes demande d'apprendre 5 pictos.
