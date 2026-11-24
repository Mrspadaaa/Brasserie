OK — 9 problèmes, 3 bloquants

RESULTAT critique-38e : 9 problèmes (B 3, m 4, D 2) — soldes identiques oui — BUGS OK

Version : index-DU-8kJuj.js. L'onglet servait d'abord r1awkHAF ; je l'ai rechargé sans cache, puis vérifié.
Tests : sans objet (test d'écran). Registre : `bugs.log`, qui donne « BUGS OK : 2179 bugs, 522 ouverts, 202 sources ».
Couvert : thème clair, 390 × 844, toucher. Non couvert : 1280, thème sombre, facture lue par l'IA (coût), Remboursement (ouvert mais non joué), avis « Nouvelle version » (aucun déploiement pendant le test).

## Soldes
| | avant (22:55) | ZZ en place | après retrait (23:4x) |
|---|---|---|---|
| à dépenser (6 sem., 23 nov.–3 janv., S53) | −463 | −479, puis −481 après les modifications | **−463** |
| En caisse | 1 145,00, libre 1 145,00 | — | 1 145,00, libre 1 145,00 |
| Synthèse : Entré / Dépensé | 0,00 / 265,40 | 5,90 / 284,10 | 0,00 / 265,40 |
| Solde de départ, aujourd'hui | 1 145,00 | — | 1 145,00 |
| Mon mois (saisie vide) | — | — | — |
J'ai retiré les 11 écritures ZZ par « Retirer cette écriture ». Finances › Prévisions : aucune prévision ZZ ne reste, donc E35-1 est tenu sans retouche à la main. La carte de fin « Annuler » a bien annulé ZZ TEST — Annuler (« Écriture annulée : rien n'est compté »).
Effet de bord : mes scripts ont remis la période partagée du Calendrier de 19 mois à 6 sem., alignée sur aujourd'hui. L'autre critique la trouvera ainsi.

## Combien et quels problèmes ? 9
1. **B** — Calendrier, rangée Ventes : les apports y sont dessinés, le ZZ Apport (+5) comme le vrai « De ma poche +1 200 ». Sans vente à encaisser, l'en-tête dit « +1 200 reçu S48–S53 » : un apport est compté comme une vente reçue (E38-1, suite de E35-2).
2. **B** — « Autre » (Ça rentre, pas un prêt) est encore comptée comme une vente. On le voit à l'étiquette « Ventes » dans la saisie et sur la carte de fin, et à Mon mois +1,10. Aux Opérations, elle est rangée sous « Ventes +5,90 », la Synthèse affiche « Entré 5,90 · 2 ventes » et la pastille dit « +6 Ventes ». Seul le libellé de la ligne dit « Autre entrée » (E38-2, suite de E35-3).
3. **B** — Je corrige le montant d'un achat payé le 18.11 (3,50 → 4,50), avec le choix par défaut « Le paiement suit ». Le paiement devient « payé aujourd'hui », et le Calendrier ajoute « Achat 23 nov. −1 » à côté de « 18 nov. −4 ». Une faute de frappe corrigée crée donc un paiement daté d'aujourd'hui (E38-3, suite de E35-6).
4. m — Apport et Pour moi diffèrent encore des autres sortes : ni « Revient ? », ni « TVA, référence ». Leur carte de fin porte une ligne de compte (« Espèces +5,00 argent dispo ») que les autres n'ont pas (E35-13, toujours présent).
5. m — « Modifier » ouvre une autre fiche que la saisie : champs en colonnes, « Précision », « Montant sans TVA », pas de Revient, ni pastille de date, ni curseur. Elle porte maintenant Règlement, compte, note et coche (E38-4, suite de E35-11).
6. m — Pendant que le curseur de date glisse, la pastille et le titre suivent (18.11), mais le bouton reste « Payé aujourd'hui » / « Reçu aujourd'hui » jusqu'au lâcher (E38-5 ; reste de sa plainte « le slider met pas à jour la date en dynamique »).
7. m — Récurrentes à payer : la 1re occurrence est placée à son échéance (23 déc.), les suivantes à leur date. Cela donne deux « Salaire −5 » le 23 déc. et le 2e Loyer au 23 févr. au lieu du 23 mars. « À dépenser » compte donc deux salaires en S52 (E38-6).
8. D — Impôt sur la bière : étiquette « Autres frais » dans la saisie et sur la carte de fin, et ligne rangée sous « Autres frais » aux Opérations (E38-7, suite de E35-16).
9. D — Le compte « Banque ⌄ » a un chevron qui annonce une liste, mais le toucher fait tourner Banque → Espèces → TWINT → Autre (E38-8).

Bloquants : 1, 2 et 3 (valeur fausse).

### Constats E35 rejoués (état au registre)
- Vérifiés en ligne : E35-1, 5, 7, 8, 9, 10, 12, 14, 15 (commits 1761845a5 et 8eb141472).
- Corrigés en partie, « en cours » avec renvoi vers E38 : E35-2 (E38-1), E35-3 (E38-2), E35-6 (E38-3), E35-11 (E38-4), E35-16 (E38-7).
- Toujours présent : E35-13.
- Non reproduit hors du bord : E35-4. Avec 80 pas lents, la date montrée au lâcher est celle enregistrée. Au bord gauche, la date continue de défiler tant que le doigt tient (13.10 lu, 12.10 lâché) : voir les doutes.

### Ses plaintes du soir
- Apport au Calendrier : il y est, mais dans la rangée Ventes et compté « reçu » (n° 1).
- Apport « diffère des autres vues » : toujours vrai (n° 4). La coche « Sans justificatif, c'est normal » est présente dans les 10 sortes et sur la fiche détail. Je l'ai cochée sur Abonnement, Vente et Apport, et elle est restée cochée.
- Curseur : la pastille et le titre suivent en direct, et toucher la piste fonctionne. Reste le bouton « … aujourd'hui » (n° 6).
- Avis « Nouvelle version » : non revu, aucun déploiement n'a eu lieu pendant le test.

### Doutes (non comptés)
- Au bord du curseur, la date défile seule tant qu'on tient. Le mouvement est visible, mais je ne sais pas s'il est voulu (E35-4).
- « changer » de sorte garde la date choisie avant : 12.10, choisi pour la Vente, reste pour l'Achat, et « Saisir un autre » a été enregistré au 12.10.
- Le Calendrier arrondit à l'entier : 3,50 → −4, 2,50 → −3, 1,10 → +1.
- Mon mois d'un Loyer à payer (échéance 23.12) compte −4,00 « prévu » en novembre.
- HABITUELS : pendant le test, les prévisions ZZ (« prévu le 23.02 · le solde ») ont pris la place de « De ma poche ».
- La mention « sans TVA » devant le montant dans Modifier, pour une brasserie hors TVA.

## Matrice sorte × actionneur (J = joué, V = vu ; – = absent de la sorte)
| sorte | titre | montant | Payé/À payer | pastille | curseur | compte | catégorie | tiers + autre | Revient / durée | TVA, réf. | note | coche justif. | Mon mois | carte de fin | Calendrier | modifier | retirer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Achat (A1) | J V | J V | V | J V | J V (6) | J V (9) | V | J V | V | J V | J V | V | J V | J V, Annuler J V, Saisir un autre J V | V | J V Finances (3, 5) | J V |
| Loyer (A2) | J V | J V | J V | J V | J V borne | – échéance | – | V | J V Trim. 6 mois (7) | J V | J V | V | J V | J V | V (7) | – | J V, prévisions parties |
| Abonnement (A3) | J V | J V | V | J V | J V | J V | – | V | J V Mois 6 mois | J V | J V | J V cochée | J V | J V | V | – | J V, prévisions parties |
| Salaire (A4) | J V | J V | J V | J V | J V borne | – échéance | – | V | J V Mois sans fin (7) | J V | J V | V | J V | J V | V (7) | – | J V, prévisions parties |
| Impôts (A5) | J V | J V | J V | J V | J V borne | – | J V (8) | – | – | J V | J V | V | J V | J V (8) | V | – | J V |
| Pour moi (A6) | J V | J V | V | J V | J V | J V | – | – | absent (4) | absent (4) | J V | V | V « inchangé » | J V (4) | V | – | J V |
| Autre sortie (A7) | J V | J V | V | J V | J V | J V | – | – | V | J V | J V | V | J V | J V | V | – | J V |
| Vente (R1, G1, G3, G7) | J V | J V | J V | J V | J V court, long, piste | – échéance | – | J V « Créer « ZZ » » | V | J V | J V | J V cochée | J V | J V | V pointillé | J V Calendrier › Ouvrir (5) | J V |
| Apport (R2) | J V | J V | V | J V | J V | J V | – | – | absent (4) | absent (4) | J V | J V cochée | V « inchangé » | J V (4) | V rangée Ventes (1) | – | J V |
| Autre entrée (R3) | J V | J V | V | J V | J V | J V | (2) | – | V | J V | J V | V | J V (2) | J V (2) | V rangée Ventes (1) | – | J V |
| Remboursement | ouvert, non joué | | | | | | | | | | | | | | | | |

## Captures (cap/ ; planches PL-* = captures 390 côte à côte, toutes ouvertes)
- Saisie : PL-A1a, PL-forme1, PL-forme2, PL-fin1, PL-fin2 ; gestes : PL-G (+ autre, curseur, piste, Annuler), PL-F (Saisir un autre, curseur long, Prévisions vidées, Calendrier après).
- Calendrier : PL-K0 (19 mois, avec les ZZ), M1-cal-6sem, N8-cal (6 sem., avec les ZZ), F2-cal (après).
- Modifier : PL-M, PL-N (Achat 3,50 → 4,50 depuis Finances ; Vente 4,80 → 3,80 depuis le Calendrier › Ouvrir).
- Scripts, un par sorte de geste : e0 (soldes), e1 (sortes), jouer + lot.sh (chaque sorte), geste, geste2 (gestes fins), cal, mod, mod2, mod3 (Calendrier, modifier), supprimer, fin, fin2 (retrait, soldes) ; journal : journal.txt et lot.log.

LEÇON PROPOSÉE : deux critiques dans le même Chrome de débug partagent la période du Calendrier et leurs fenêtres se recouvrent. Une fenêtre recouverte bloque `Input.dispatchTouchEvent` sans erreur, et le script attend sans fin. Dans chaque brief de test parallèle, il faut placer chaque fenêtre à part (`Browser.setWindowBounds`), mettre un délai de garde dans chaque script, et relire, puis rendre, la période du Calendrier avant de mesurer « à dépenser ».
