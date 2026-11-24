OK — 16 problèmes, 6 bloquants

RESULTAT critique-ecritures : 16 problèmes (B 6, m 7, D 3) — soldes identiques oui (après suppression à la main des prévisions restées, E35-1) — BUGS OK

Version : index-r1awkHAF.js (commit 307577f47, déployé à 21:02 en cours de test). A1 à A7 et R1 saisis d'abord sur index-CG1fQ0aV.js, puis leurs fiches rejouées sur r1awkHAF sans enregistrer (A1b, A2b, A5b, A6b, R1b) ; R2, R3, A8, Calendrier, modification et suppression faits sur r1awkHAF.
Tests : sans objet (test d'écran). Registre : `bugs.log` → « BUGS OK : 2168 bugs, 522 ouverts, 202 sources ».
Thème clair, 390 × 844 seulement ; 1280 et sombre non faits. Facture lue par l'IA : non couverte (coût).

## Soldes
| | avant (20:51) | ZZ en place | après retrait des écritures | après retrait des prévisions (21:27) |
|---|---|---|---|---|
| à dépenser (6 sem., S53) | −463 | −478 | **−481** | −463 |
| En caisse | 1 145,00, libre 1 145,00 | — | — | 1 145,00, libre 1 145,00 |
| Synthèse, Entré / Dépensé | 0,00 / 265,40 | — | 265,40 dépensé | 0,00 / 265,40 |
| Solde de départ, aujourd'hui | 1 145,00 | — | — | 1 145,00 |
Les 11 écritures ZZ sont retirées par « Retirer cette écriture » (elles passent en annulées). Les 3 prévisions ZZ restées ont été supprimées dans Finances › Prévisions. La frise est remise à 6 sem. Aucun ZZ ne reste au Calendrier. Onglet fermé, Chrome laissé ouvert.

## Combien et quels problèmes ? 16
1. **B** — Quand on retire une écriture qui revient (Salaire, Abonnement, Loyer), ses prévisions restent : au Calendrier, « −5 / mois », « −2 / mois » et « Loyer −4 à payer 23 nov. » sont toujours là, et il reste « −481 » à dépenser au lieu de −463. Toucher la barre mène aux Opérations, où elle n'est plus. Pour l'enlever, il faut passer par Prévisions, et le Loyer y est caché dans « 6 sorties le 23.11 » (E35-1).
2. **B** — La rangée Ventes affiche « +1 205 à encaisser », dont « De ma poche +1 200 » : c'est un apport, et il est déjà encaissé (E35-2).
3. **B** — « Autre » (Ça rentre, pas un prêt) est rangée en « Ventes » (étiquette, Opérations, barre Ventes +5,90), avec le titre « Recette du… » (E35-3).
4. **B** — Curseur de date : on voit « 8 oct. » au moment où le doigt s'arrête, mais c'est le 06.10 qui est enregistré. La date continue de glisser après l'arrêt du doigt (E35-4).
5. **B** — « + autre » (Client, Chez, Bailleur, Service) n'ouvre rien : le texte tapé remplace le titre, et les 4 clients ne sont pas proposés (E35-5).
6. **B** — Si l'on corrige le montant d'un achat déjà payé (3,50 → 4,50), il apparaît « Reste 1,00 CHF à payer · sans échéance » (E35-6).
7. m — Pour une Vente « À recevoir », le bouton dit « À payer +4,80 » (E35-7).
8. m — Curseur vers l'avant : la pastille et le titre suivent pendant le glisser, puis tout revient au 23.11 sans un mot (E35-8).
9. m — Au Calendrier et dans la Liste, une écriture unique à payer ou à recevoir (Loyer, Impôts, Vente, 1er Salaire) n'est pas marquée comme prévue (E35-9).
10. m — Les sorties déjà payées (Achat, Pour moi, Autre) n'apparaissent pas au Calendrier, alors que les rentrées de la même semaine y sont (E35-10).
11. m — « Modifier » ouvre une autre fiche que celle de la saisie : pas de compte, ni Payé/À payer, ni Revient, ni note, et la référence y devient « Fournisseur » (E35-11).
12. m — « Ouvrir » depuis le Calendrier met « MAIN-545e015f-… » dans la recherche des Opérations, et ce filtre reste quand on y revient (E35-12).
13. m — Apport : toujours pas de « Revient ? », alors que les données ont des versements mensuels. Sa carte de fin a une ligne de compte que les autres sortes n'ont pas, donc elle diffère encore. Pour moi n'a ni Revient ni TVA (E35-13).
14. D — Toucher la piste du curseur ne fait rien (E35-14).
15. D — Pour moi est noté « Apports privés » dans les Opérations (E35-15).
16. D — L'impôt sur la bière est étiqueté « Autres frais » (E35-16).

Bloquants : 1 (valeur fausse), 2 (valeur fausse), 3 (valeur fausse), 4 (valeur fausse), 5 (geste sans effet), 6 (valeur fausse).

### Ses plaintes du soir, sur r1awkHAF
- Apport au Calendrier : il y apparaît maintenant, mais dans la rangée Ventes et compté « à encaisser » (n° 2).
- Coche « pas de justificatif » : présente dans les 11 sortes et sur la fiche détail. Elle a été vue, mais pas cochée.
- Curseur : la pastille et le titre suivent en direct. Restent les n° 4 et 8, et « dès le » de Revient ne suit qu'au lâcher.
- Avis « Nouvelle version » : non revu, aucun déploiement n'a eu lieu après r1awkHAF.

### Doutes (non comptés)
- Le déploiement de 21:02 a rechargé l'onglet pendant la saisie d'un apport (titre et 5 CHF tapés), et la saisie a été perdue. Je l'ai vu sur l'ancien paquet, et je ne sais pas si le nouveau recharge seul.
- Remboursement : « Aucune pièce à rembourser » alors que des achats payés existent. Vu sur CG1fQ0aV seulement.
- Compte « Banque ⌄ » : le chevron annonce une liste, mais le toucher passe directement à « Espèces ».
- « Mon mois » se touche sans effet. C'est peut-être un simple indicateur.
- Salaire à payer : au Calendrier, deux « −5 » le 23 déc. (l'échéance du 1er et la date du 2e). Je ne sais pas si c'est voulu.
- « 3,80 » est affiché « +4 » au Calendrier (arrondi).
- Modifier la date de la Vente (16.12) laisse « 23 déc. », mais c'est peut-être l'échéance qui est montrée.

## Matrice sorte × actionneur (J = joué, V = vu ; – = absent de la sorte)
| sorte | titre | montant | Payé/À payer | date pastille | curseur | compte | catégorie | tiers + autre | Revient / durée | TVA, réf. | note | coche justif. | Mon mois | enregistrer, carte de fin | Calendrier | modifier | retirer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Achat (A1, A8, A1b) | J V | J V | V | J V | J V (−) | J V | J V | J V (5) | V | J V | J V | V | J V | J V | absent (10) | J V Finances (11, 6) | J V |
| Loyer (A2, A2b) | J V | J V | J V | J V | J V (+, 8) | – (à payer) | – | J V | J V Trim. 6 mois | J V | J V | V | V | J V | V (9) | – | J V + prévision (1) |
| Abonnement (A3) | J V | J V | V | J V | J V | J V | – | J V | J V Mois 6 mois | J V | J V | – | V | J V | V | – | J V + prévision (1) |
| Salaire (A4) | J V | J V | J V | J V | J V (+, 8) | – | – | – | V Mois sans fin | J V | J V | – | V | J V | V (doute) | – | J V + prévision (1) |
| Impôts (A5, A5b) | J V | J V | J V | J V | J V | – | J V (16) | – | – | J V | J V | V | V | J V | V (9) | – | J V |
| Pour moi (A6, A6b) | J V | J V | V | J V | J V | J V | – | – | – | – | J V | V | V « inchangé » | J V | absent (10) | – | J V |
| Autre sortie (A7) | J V | J V | V | J V | J V | J V | – | – | V | J V | J V | – | V | J V | absent (10) | – | J V |
| Vente (R1, R1b, curseur) | J V | J V | J V (7) | J V | J V (4, 8, 14) | – (à recevoir) | – | J V (5) | V | J V | J V | V | V | J V | V (9) | J V Calendrier › Ouvrir (12) | J V |
| Apport (R2) | J V | J V | V | J V | J V | J V | – | – | absent (13) | – | J V | V | V « inchangé » | J V (13) | V Ventes (2) | – | J V |
| Autre entrée (R3) | J V | J V | V | J V | J V | J V | (3) | – | V | J V | J V | V | V | J V | V | – | J V |
| Remboursement | ouvert sur CG1fQ0aV seulement : « Aucune pièce » (doute) | | | | | | | | | | | | | | | | |
Non joués : « Annuler » et « Saisir un autre » de la carte de fin, le fait de cocher « sans justificatif », la facture lue par l'IA.

## Captures (toutes dans cap/)
- Saisie : A1-03, A1-08, A1-11, A1-15, A1-17, A1-18-fin, A2-14, A2b-05, A3-18-fin, A5-18-fin, A6/Pour moi D1-06, R1-11, R1-18-fin, R1b-11, R2-05, R2-17-bas, R2-18-fin, R3-18-fin, T1-autre-tape, C3/C5 et NC5 (curseur).
- Calendrier : K0-0, K1-1, X2-etat (filtre), P0-previsions, P4-groupe (prévisions restées), M3-cal-touche.
- Modifier : M1-ouvert, M2-modifier-ouvert, M4-enregistre.
- Journal des gestes : `journal.txt` ; scripts : un par sorte d'écriture (jouer.mjs pour la saisie de chaque sorte, curseur.mjs, tiers.mjs, cal.mjs et cal2.mjs, mod2.mjs et mod3.mjs, supprimer.mjs, prev.mjs et loyer.mjs, fin.mjs et fin2.mjs).

LEÇON PROPOSÉE : au test des écritures, « soldes identiques après suppression » se vérifie aussi après les prévisions. Une écriture récurrente laisse des prévisions que « Retirer cette écriture » n'enlève pas, et seul le Calendrier (le solde à dépenser) le montre : relever le solde à dépenser avant et après chaque retrait.
