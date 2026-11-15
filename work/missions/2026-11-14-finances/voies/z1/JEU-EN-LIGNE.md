# Jeu en ligne — Finances, 15.11.2026

App : https://brasserie-l-affinee.web.app/ (version 80249f3f), Chrome du brasseur (Claude in Chrome), connecté.
Accord : « Oui autorise le à utiliser chrome » (MISSION.md, contrat réécrit 15.11).
Taille : la fenêtre n'a pas pu passer à 390 (redimensionnement accepté, sans effet). Tout est joué à 1408 × 840, thème clair. Aucune capture tactile à 390.

## Nombres réels (novembre)

| Nombre | Avant | Après retrait |
|---|---|---|
| Ventes (Opérations) | +5 695,00 | +5 695,00 |
| payé | 0,00 | 0,00 |
| à payer | 0,00 | 0,00 |
| dépensé | 0,00 | 0,00 |
| en retard | non affiché (0) | non affiché (0) |
| En caisse (Synthèse) | 5 663,00 CHF, libre 5 663,00 | 5 663,00 CHF, libre 5 663,00 |
| CHF gagnés (Synthèse) | +5 695,00 | +5 695,00 |
| Pièces exclues à confirmer | 6 | 6 |

Les nombres réels sont intacts. Aucune pièce, aucun paiement ni aucun fournisseur réel n'a été touché. Aucun justificatif n'a été déposé.

## Gestes

### 1. Deux dépenses à payer (+ › Nouvelle facture › Saisir sans justificatif) : fait
- A « ZZ TEST — pièce A » 10,00 et B « ZZ TEST — pièce B » 15,00. Fournisseur « ZZ TEST — Fournisseur », catégorie Autre, règlement « À payer », échéance 16.11.2026, sans mouvement de stock.
- Vu : Opérations montre Autres frais 25,00, payé 0,00, à payer 25,00, dépensé 25,00. Synthèse : Dépensé 10,00 dès A, en caisse inchangé.
- Problèmes :
  1. Le règlement vaut « Payé » par défaut. Il faut l'ouvrir pour choisir « À payer ».

### 2. Payer = m5pa-d : fait, après un faux départ
- Faux départ : le bouton « ✓ Payé » de la ligne A, dans Opérations, a payé A en entier (10,00, aujourd'hui, banque) d'un seul toucher, sans ouvrir de feuille. J'ai annulé par le bouton « Annuler » du bandeau. La fiche garde -10,00 et +10,00 « correction ».
- Ensuite fiche A › « Noter un paiement » ouvre bien la feuille m5pa-d : « Payer ZZ TEST — Fournisseur », « 2 pièces à payer au même fournisseur », le virement vaut 25,00 par défaut. À 12,00 : A 10,00 ✓ soldé, B 2,00 « sur 15,00 · reste 13,00 », barre zz 10,00 | zz 2,00 | reste 13,00 hachuré, les deux cases cochées, « Le plus ancien d'abord ». La ligne « Justificatif du virement · sera joint aux 2 pièces » a Photo et Fichier (rien déposé). On voit « Le aujourd'hui / autre avec banque » et le bouton « ✓ Payer 12,00 ».
- Opérations après : payé 12,00, à payer 13,00, dépensé 25,00 ; A « payé aujourd'hui · banque », B « Reste 13,00 CHF à payer ». Justes.
- Problèmes :
  2. Le « ✓ Payé » de la ligne paie toute la pièce d'un toucher. Sans annulation, on ne pouvait pas payer 12,00 sur deux pièces depuis la liste. La feuille m5pa-d ne s'atteint que par la fiche, via « Noter un paiement ».
  3. La barre prend les deux pièces dans le même gris foncé. Rien ne sépare A de B, alors que la maquette donne une couleur par pièce.
  4. Les étiquettes de la barre prennent le premier mot du nom en minuscules : « zz 10,00 », « zz 2,00 ». Avec deux noms qui commencent pareil, on ne sait pas laquelle est laquelle.

### 3. Fiche = m5fo-a : fait (A et B)
- A : en-tête, 10,00 CHF, « ✓ payé aujourd'hui · banque », « Sans justificatif », « Dans la facture · 1 ligne », Modifier, Avoir ou remboursement, Échéance et prévision, Paiements, Corriger une erreur de saisie.
- B : 15,00, « Reste à payer : 13,00 CHF », Échéance 16.11.2026, « Déjà payé : 2,00 CHF », Noter un paiement, Paiements 1 (-2,00).
- Problèmes :
  5. La pastille de catégorie de l'en-tête est un carré gris vide (catégorie « Autres frais » sans icône, même dans Modifier).
  6. Paiements : chaque annulation laisse sa paire -10,00 / +10,00 « correction » dans la liste. Après le jeu, A en affichait 5 puis 6 lignes pour une pièce de 9,00. C'est lourd à lire.
  7. Sur B, la ligne -2,00 ne dit pas qu'elle fait partie d'un virement de 12,00 sur deux pièces.

### 4. Modifier = m5mo-c : fait
- A payée 10,00 › Modifier › montant 11,00. On voit le montant 10,00 barré, la bascule « Le paiement suit · payé 11,00 » / « Reste à payer · payé 10,00 · reste 1,00 » (sélectionnée par défaut), et l'aperçu « Dans Opérations » avant (10,00 barré) et après (11,00, payé 10,00, reste 1,00). Enregistré.
- Opérations après : A 11,00 « Reste 1,00 CHF à payer », payé 12,00, à payer 14,00, dépensé 26,00. Juste.
- A › Modifier › 9,00 : la bascule n'apparaît pas et l'aperçu après montre 9,00 « payé aujourd'hui · banque ». Enregistré. Opérations : payé 11,00, à payer 13,00, dépensé 24,00. Paiements de A : -9,00.
- Problèmes :
  8. Le champ « Fournisseur, n° de pièce » de Modifier est vide (on ne voit que le texte indicatif) alors que la pièce a « ZZ TEST — Fournisseur ». Il reste en place après l'enregistrement, mais l'écran laisse croire qu'il n'existe pas.
  9. « Précision » était vide au premier Modifier et vaut « Divers » au second, sans que je l'aie saisie : l'enregistrement l'a remplie tout seul.
  10. En baissant sous le payé, le paiement suit sans rien demander. Le virement réel de 12,00 n'est plus compté que 11,00 (9,00 + 2,00) : 1,00 CHF sorti de la banque disparaît, sans avoir ni trop-payé signalé.

### 5. Apport = m5ap-a : fait
- « Apport ou prélèvement privé » ouvre « De ta poche à la brasserie » : 1,00, Banque, motif « ZZ TEST — apport », sans justificatif. Caisse +1,00 ; « Ventes − dépenses +5 671,00 · inchangé : un apport n'est pas une vente ». Enregistré.
- Opérations : « Apports et prélèvements +1,00 », Ventes et dépensé inchangés. Synthèse : en caisse 5 653,00 (5 663 − 11 payés + 1), libre 5 640,00. Juste.
- « Dans l'autre sens : je reprends » : la feuille devient « De la brasserie à ta poche », avec une flèche rouge, Caisse -1,00, « inchangé : un prélèvement n'est pas une dépense » et « Enregistrer le prélèvement ». J'ai fermé sans enregistrer.
- Problèmes :
  11. La fiche de l'apport affiche « Échéance et prévision », hors sujet pour un apport.
  12. Une fois son encaissement corrigé, l'apport passe en « À encaisser 1,00 CHF » avec « Noter un encaissement » : un apport qui n'a pas eu lieu devient une créance à encaisser.

### 6. Retrait : fait
- A : « Corriger ce paiement saisi par erreur » (-9,00 → +9,00), puis Corriger une erreur de saisie › Annuler cette écriture › Confirmer. Message : « Écriture annulée. Justificatif et historique conservés. »
- B : correction du -2,00, puis annulation.
- Apport : correction du +1,00, puis annulation.
- Toutes les confirmations sont dans la page, sans dialogue du navigateur.
- Opérations et Synthèse sont revenues exactement aux nombres de départ (tableau ci-dessus).

## Ce qui reste de ZZ TEST
- Trois écritures annulées dans Firestore, avec leurs paiements et contre-écritures : pièce A, pièce B, apport. Les règles interdisent de les supprimer.
- Elles ne sont plus visibles dans Opérations de novembre et ne comptent nulle part : payé, à payer, dépensé et caisse sont revenus. Archives ne les montre pas : c'est l'archive des années, pas des annulées.
- Le nom « ZZ TEST — Fournisseur » peut rester dans la liste des fournisseurs ou leurs suggestions. Je ne l'ai pas vérifié dans « Fournisseurs, matériel ».

## Non joué
- 390 tactile : la fenêtre du brasseur ne s'est pas redimensionnée, tout est vu à 1408.
- Thème sombre : pas joué, pour limiter les gestes sur ses vraies données.
- Dépôt de justificatif : interdit par le contrat. J'ai seulement regardé les zones (feuille Payer, Modifier, Apport).
- « Lier à une dépense prévue » : pas touché, car la liste contient ses prévisions réelles.
