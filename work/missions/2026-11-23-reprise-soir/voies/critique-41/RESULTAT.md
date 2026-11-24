OK — 6 problèmes, 2 bloquants

RESULTAT critique-41 : 6 problèmes (B 2, m 4, D 0) — soldes identiques oui — BUGS OK

Version : index-DwEuRObA.js. L'onglet a d'abord servi CRA3EhuZ (cache du service worker), puis l'app s'est rechargée seule sur DwEuRObA. L'avis « Nouvelle version » n'est pas apparu cette fois.
Tests : sans objet (test d'écran). Registre : `bugs.log`, qui donne « BUGS OK : 2192 bugs, 523 ouverts, 202 sources ».
Couvert : thème clair, 390 × 844, toucher, Chrome de débug (mon onglet a été fermé à la fin, le navigateur est resté ouvert). Non couvert : 1280, thème sombre, facture lue par l'IA (coût).

## Soldes
| | avant | ZZ en place | après retrait |
|---|---|---|---|
| à dépenser (6 sem., 23 nov. – 3 janv., S53) | −463 | −471, puis −473 après modifications, puis −472 après le remboursement (juste) | **−463** |
| En caisse | 1 145,00, libre 1 145,00 | 1 141,50, libre 1 131,30, à payer 10,20, à encaisser 4,80 (juste) | 1 145,00, libre 1 145,00 |
| Synthèse : Entré / Dépensé | 0,00 / 265,40 | 5,90 / 282,70 | 0,00 / 265,40 |
| Solde de départ, aujourd'hui | 1 145,00 | — | 1 145,00 |

J'ai retiré 14 écritures ZZ et le remboursement. Il ne reste aucune ZZ ni aux Opérations, ni au Calendrier, ni aux Prévisions. Période du Calendrier : au départ, 6 sem., du 23 nov. 2026 au 3 janv. 2027, avec le même localStorage. Je l'ai passée à 3 mois pour E38-6, puis remise à l'identique (ls et cadre vérifiés).

## Sortes jouées (une ligne par sorte)
- Achat (A1) : titre, montant, curseur, Chez + autre, catégorie, TVA et réf., note, enregistré. Modifié depuis Finances (3,50 → 4,50, date 19.11 → 04.11). Remboursement lié. Retiré.
- Loyer (A2) : à payer, échéance 24.12, Trim. 6 mois, enregistré. Calendrier : 24 déc. Retiré.
- Abonnement (A3) : Mois 6 mois, Service + autre, coche, enregistré. Calendrier : 22 nov. ✓ puis 22 déc. Retiré.
- Salaire (A4) : à payer, Mois 6 mois. Calendrier : 24 déc., puis 24 janv. à 3 mois. Retiré.
- Impôts (A5) : à payer, « Impôt sur la bière », période et réf., coche, enregistré. Étiquette Impôts. Retiré.
- Pour moi (A6) : Mois 6 mois, coche, Mon mois « inchangé ». Calendrier : 22 nov., puis 22 déc. « prévu », hors du total des Papiers. Retiré.
- Autre sortie (A7) : enregistrée, Autres frais. Retirée.
- Vente (R1) : à recevoir, échéance 24.12, coche. Modifiée depuis le Calendrier (4,80 → 3,80) : la pastille Ventes passe de +5 à +4. Retirée.
- Apport (R2) : Mois 6 mois, coche, Mon mois « inchangé ». Calendrier : 22 nov., puis 22 déc., hors du total des Ventes. La bande ouvre sa carte. Retiré.
- Autre entrée (R3) : comptes (Banque, Espèces, TWINT, Autre), enregistrée, étiquette « Autre entrée ». Retirée.
- Remboursement : liste « De quelle pièce ? », recherche, choix de l'achat ZZ, +1,00 enregistré (« Brassage réduit de 1,00 », net 3,50). Retiré.
- Habituel ZZ Apport : prérempli avec +5 et « solde l'échéance de décembre ». Non enregistré.
- Carte de fin : Annuler (« Écriture annulée : rien n'est compté ») et Saisir un autre fonctionnent. changer garde le montant (0,70).

## Combien et quels problèmes ? 6
1. **B** — On ne peut pas retirer un achat qui a un remboursement lié. Sur ZZ TEST — Achat, j'ai touché « Confirmer le retrait » 15 fois : l'achat reste aux Opérations et rien ne dit pourquoi (journal `supp.log`). Une fois le remboursement retiré, l'achat part au premier essai (`supp2.log`). Attendu : le retrait se fait et l'app dit ce que devient l'avoir, ou elle dit pourquoi elle refuse (E41-1).
2. **B** — Remboursement › « De quelle pièce ? » : ses vraies pièces payées n'y sont pas. Les recherches « masque », « 23 » et « Brau » donnent « Aucune pièce ne correspond ». Pourtant « consomable ( masque gant) 23,00, payé 19 nov. » et « Brau- und Rauchshop 110,40, payé 27 avr. » existent. La liste ne montre que les écritures ZZ saisies à la main (E41-2).
3. m — Au Calendrier, la carte de la bande Apport propose « › Facturer ». On ne se facture pas un apport privé. Pour moi et Abonnement proposent « Ouvrir » (E41-3).
4. m — Modifier n'est toujours pas la feuille de saisie. Il manque le bouton « changer » et le grand montant (on lit −3,50 en petit). Payé, À payer et le compte sont sortis de la carte, dans « Règlement ». Le bloc « Pas encore de pièce » est en tête. L'en-tête, la pastille et le curseur de date sont bien là (E41-4, suite de E40-4).
5. m — Modifier, date d'un achat payé : glissé du 19.11 au 04.11, seul l'en-tête de la fiche dit « 4 nov. ». Les Opérations disent « payé 19 nov. », le Calendrier « 19 nov. », les paiements « 19 nov. ». En saisie, la date choisie est celle du paiement : on croit avoir déplacé l'achat (E41-5).
6. m — Le curseur de date bute au 24.11, avec « Pas de date après le 24 nov. ». Toute la partie après aujourd'hui (repère « déc. ») ne sert à rien. Le seul mois écrit est « déc. », alors que la date est en novembre. Vu sur toutes les sortes (E41-6).

Bloquants : 1 et 2 (geste sans effet).

### Constats rejoués (corrigés au tour 41)
- Vérifiés en ligne : E40-1, E40-2 (hors du total ; l'apport reste dessiné dans la rangée Ventes), E40-3, E40-5 (voir n° 3), E40-6 (voir n° 2), E40-7. Registre mis à jour.
- En partie : E40-4 (voir n° 4), passé « en cours ».
- E38-6 aussi vérifié : à 3 mois, Salaire « à payer » le 24 déc. puis le 24 janv., chacun à son échéance, sans doublon. La ligne E38-6 est hors de ma liste : au pilote de la passer.
- E35-3 (titre « Autre entrée du 13.11 », étiquette « Autre entrée »), E35-4 (pastille, titre et bouton suivent le curseur en direct) et E35-16 (étiquette Impôts) : réglés.

### Ses plaintes du soir
- L'apport s'affiche au Calendrier : la réelle « De ma poche +1 200 » et les ZZ, avec la tirelire, hors du total des Ventes.
- Sa vue est comme les autres : Revient, coche, carte de fin de même forme.
- La coche « Sans justificatif, c'est normal » est présente dans les 11 sortes.
- Le curseur met la date à jour en direct.
- L'avis « Nouvelle version » n'a pas été revu ce soir.

### Doutes (non comptés)
- Dans HABITUELS, les prévisions ZZ (Apport, Pour moi, Salaire) ont pris la place de son vrai « De ma poche ». Leur sous-ligne « prévu le 22.12 · le solde » est obscure.
- Prévisions de Finances : les étiquettes de la courbe disent « TEST +5 » et « TEST +4,80 », le début du nom est coupé.
- Après le remboursement de +1, la liste « De quelle pièce ? » montre encore l'achat à −4,50, et non le net de 3,50.
- Modifier le montant avec « le paiement suit » ajoute un second paiement de −1,00, au lieu de corriger le premier de 3,50.
- Le Calendrier arrondit à l'entier : 4,80 devient +5, 1,20 devient −1.
- Un apport futur est marqué « à recevoir », un Pour moi futur « prévu ».

## Table (captures 390 ouvertes en planches, cap/PL*.png)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| PL1, PL2, PL3, PL4, PL5 | clair | 390 | 10 sortes : forme, curseur, Chez, revient, avant et après enregistrement | 1 (6) | 0 |
| PL6 | clair | 390 | comptes, changer, échéance, liste Remboursement | 0 (2 se voit en PLX2) | 0 |
| PL7 | clair | 390 | Annuler, Saisir un autre, curseur Impôts | 1 (6) | 0 |
| PLC, PLR | clair | 390 | Calendrier 6 sem. avec ZZ, bandes Apport et Pour moi, Prévisions, Synthèse | 1 (3) | 0 |
| PLM, PLN, PLN2 | clair | 390 | Modifier depuis le Calendrier et Finances, curseur dans Modifier | 2 (4, 5) | 0 |
| PLX, PLX2 | clair | 390 | détail de l'achat, Remboursement, habituel, menu de période, 3 mois | 2 (2, 5) | 1 |
| T-achat-apres-1, T9-operations | clair | 390 | retrait | 1 (1) | 1 |

## Matrice sorte × actionneur (J = joué, V = vu ; – = absent de la sorte)
| sorte | titre | montant | Payé/À payer | pastille + curseur | compte | catégorie | tiers + autre | Revient / durée | TVA, réf. | note | coche | carte de fin | Calendrier | modifier | retirer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Achat | J V | J V | V | J V | V | V | J V | V | J V | J V | V | J V | J V | J V (4, 5) | J V (1) |
| Loyer | J V | J V | J V | J V | – échéance | – | V | J V | V | V | V | J V | J V | – | J V |
| Abonnement | J V | J V | V | J V | V | – | J V | J V | J V | J V | J V | J V | J V | – | J V |
| Salaire | J V | J V | J V | J V | – échéance | – | V | J V | J V | J V | V | J V | J V (3 mois) | – | J V |
| Impôts | J V | J V | J V | J V | – | J V | – | – | J V | V | J V | J V | J V | – | J V |
| Pour moi | J V | J V | V | J V | V | – | – | J V | V | V | J V | J V | J V | – | J V |
| Autre sortie | J V | J V | V | J V | V | – | – | V | J V | J V | V | J V | J V | – | J V |
| Vente | J V | J V | J V | J V | – échéance J V | – | V | V | J V | J V | J V | J V | J V | J V depuis le Calendrier (4) | J V |
| Apport | J V | J V | V | J V | V | – | – | J V | V | V | J V | J V | J V (3) | – | J V |
| Autre entrée | J V | J V | V | J V | J V | – | – | V | J V | J V | V | J V | J V | – | J V |
| Remboursement | – | J V | V | V | V | – | pièce J V (2) | – | – | – | – | J V | – | – | J V |

LEÇON PROPOSÉE : un script de retrait en boucle doit noter chaque cible qui survit à « Confirmer » (même aria avant et après) et passer à la suivante. Le 24.11, la boucle a touché 15 fois le même achat sans s'arrêter, et le refus n'a été compris qu'au second script.
