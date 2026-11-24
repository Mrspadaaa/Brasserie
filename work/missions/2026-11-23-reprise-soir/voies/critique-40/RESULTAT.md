OK — 7 problèmes, 2 bloquants

RESULTAT critique-40 : 7 problèmes (B 2, m 4, D 1) — soldes identiques oui — BUGS OK

Version : index-CRA3EhuZ.js. L'onglet a d'abord reçu DU-8kJuj (cache du service worker). L'avis « Nouvelle version · Recharger » est apparu en bas, au-dessus du pied, sans rien couvrir (cap/M1-avis.png). Recharger a donné CRA3EhuZ.
Tests : sans objet (test d'écran). Registre : `bugs.log`, qui donne « BUGS OK : 2186 bugs, 529 ouverts, 202 sources ».
Couvert : thème clair, 390 × 844, toucher. Non couvert : 1280, thème sombre, facture lue par l'IA (coût). Je n'ai pas revérifié la 2e occurrence de Salaire et Loyer (E38-6) : le script n'a pas trouvé comment avancer la période, et le cadre est resté sur 6 sem.

## Soldes
| | avant (CRA3EhuZ) | ZZ en place | après retrait |
|---|---|---|---|
| à dépenser (6 sem., 23 nov. – 3 janv., S53) | −463 | −468, puis −470 après modifications | **−463** |
| En caisse | 1 145,00, libre 1 145,00 | 1 142,10, libre 1 131,90 (juste) | 1 145,00, libre 1 145,00 |
| Synthèse : Entré / Dépensé | 0,00 / 265,40 | 5,90 / 282,10 | 0,00 / 265,40 |
| Solde de départ, aujourd'hui | 1 145,00 | — | 1 145,00 |
| Mon mois (saisie vide) | — | — | — |

L'app ne montre pas de solde par compte (Banque, Espèces, TWINT) : seul le total En caisse est relevé. J'ai retiré les 12 écritures ZZ, et aucune prévision ZZ ne reste (F1). Période du Calendrier : 6 sem., 23 nov. 2026 – 3 janv. 2027 au départ, la même à la fin. Le jour a changé (24.11) pendant le test, sans effet sur les soldes.

## Combien et quels problèmes ? 7
1. **B** — Apport et Pour moi récurrents (Mois, dès le 21.11) : l'occurrence du 21.11, déjà saisie, revient « à payer » le 23.11. Prévisions : « TEST +5, 23.11 », puis 21.12 et 21.01, et « TEST −2,50 (3 fois) ». Calendrier : « Apport, à payer, 23 nov. +5 / mois ». « À dépenser » passe à −468 au lieu de −470,8. L'Abonnement, avec le même réglage, est juste (21 déc.). Pour un apport, « à payer » est faux aussi (E40-1).
2. **B** — Calendrier, rangée Ventes : l'Apport (tirelire), l'Autre entrée et le vrai « De ma poche +1 200 » y restent. La pastille dit « +15 prévu S48–S53 », c'est-à-dire la vente de 4,80 plus deux apports de 5. Après la modification de la vente, elle dit « +14 ». La décision « hors ventes » n'est pas tenue (E40-2, suite de E38-1 et C38-3).
3. m — Pour moi (privé) est rangé dans Papiers et compté dans « −617 prévu », alors que la saisie dit « Mon mois inchangé : un prélèvement n'est pas une charge » (E40-3).
4. m — Modifier n'ouvre toujours pas la même feuille que la saisie (E40-4, suite de E38-4). Revient, Règlement, Référence, Note et coche y sont maintenant. Il manque l'en-tête « Ça sort / Ça rentre · sorte · changer », le grand montant, la pastille et le curseur de date. Il reste en trop « Montant sans TVA », Nom et « catégorie, précision » en champs.
5. m — Au Calendrier, toucher la bande récurrente ZZ Apport ouvre Finances, au bloc En caisse : ni l'écriture ni sa prévision ne s'ouvrent. Je ne l'ai joué qu'une fois (E40-5).
6. m — Remboursement › « De quelle pièce ? » propose le Salaire, le Loyer et les Impôts encore à payer : on ne rembourse pas ce qui n'est pas payé (E40-6).
7. D — Même liste : toutes les sorties ont le chariot d'Achat, l'Autre entrée a l'étiquette de Vente, et chaque ligne répète son nom en sous-ligne (E40-7).

Bloquants : 1 et 2 (valeur fausse).

### Constats rejoués (tour 40)
- Corrigés en ligne :
  - E38-2 : « Autre entrée » apparaît dans la saisie, sur la carte de fin, aux Opérations et en Synthèse.
  - E38-3 : avec « Le paiement suit », l'achat corrigé reste payé le 18 nov. et n'a qu'un −5 au Calendrier.
  - E38-5 : le bouton Payé / Reçu suit le curseur en direct.
  - E38-7 : les Impôts sont étiquetés Impôts partout.
  - E38-8 : la liste des comptes s'ouvre en ligne (Banque, Espèces, TWINT, Autre).
  - E35-13 : Apport et Pour moi ont Revient, et leur carte de fin a la même forme que les autres, avec Mon mois « inchangé » et une phrase.
  - Titre par défaut : il suit le curseur (« Achat du 16.11 », « Autre entrée du 12.11 »).
- Corrigés en partie : E38-1 (voir n° 2) et E38-4 (voir n° 4).
- Non revérifié : E38-6.

### Ses plaintes du soir
- « L'apport s'affiche pas sur le calendrier » : il s'affiche, avec la tirelire, mais dans la rangée Ventes et compté dans leur total (n° 2). Une occurrence fantôme apparaît aussi aujourd'hui (n° 1).
- « Elle diffère des autres vues » : c'est réglé. Revient est là, et « Référence, note » remplace « TVA, référence », ce qui est normal pour du privé.
- « Pas de coche » pour l'absence de justificatif : la coche « Sans justificatif, c'est normal » est présente dans les 11 sortes. Je l'ai cochée sur Abonnement, Impôts, Pour moi, Vente et Apport.
- « Le slider met pas à jour la date en dynamique » : réglé. La pastille, le titre par défaut et le bouton suivent pendant le glissé.
- Avis « Nouvelle version » : il apparaît sans couvrir le contenu.

### Doutes (non comptés)
- « Mon mois », en pied de saisie, a un cadre de bouton, mais le toucher n'a aucun effet (G3). Je ne sais pas si c'est voulu.
- Le Calendrier arrondit à l'entier : 3,50 devient −4, 4,80 devient +5, 2,50 devient −3.
- Les HABITUELS montrent les prévisions ZZ (« prévu le 21.12 · le solde ») et cachent son vrai « De ma poche ». « le solde » est obscur. Ils disent aussi 21.12 pour Pour moi, alors que les Prévisions comptent le 23.11 (voir n° 1).
- Mon mois d'une vente ou d'un loyer à payer (échéance 23.12) compte « prévu » en novembre.
- Sous le curseur de date, seul « déc. » est écrit quand la date est en novembre.
- L'Abonnement est rangé dans Papiers au Calendrier, alors qu'aux Opérations il est en « Charges fixes ».

## Table (captures 390 ouvertes en planches)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| M1-avis | clair | 390 | avis Nouvelle version | 0 | 0 |
| PL-av1, PL-av2, PL-av3 | clair | 390 | 11 sortes remplies | 0 | 0 |
| PL-fin1, PL-fin2, PL-fin3 | clair | 390 | cartes de fin, curseur | 0 (n° 1 se voit au Calendrier) | 0 |
| PL-G1, G4-changer | clair | 390 | curseur, comptes, échéance, Remboursement, changer | 2 (6, 7) | 0 |
| PL-C0, PL-K | clair | 390 | Calendrier 6 sem. avec ZZ, bande touchée, Synthèse | 4 (1, 2, 3, 5) | 2 |
| PL-M, PL-N | clair | 390 | Modifier depuis Calendrier et Finances | 1 (4) | 0 |
| PL-U | clair | 390 | Annuler, Saisir un autre | 0 | 0 |

## Matrice sorte × actionneur (J = joué, V = vu ; – = absent de la sorte)
| sorte | titre | montant | Payé/À payer | pastille | curseur | compte | catégorie | tiers + autre | Revient / durée | TVA, réf. | note | coche | Mon mois | carte de fin | Calendrier | modifier | retirer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Achat (A1, G1) | J V, défaut J V | J V | V | J V | J V | V | V | J V | V | J V | J V | V | V | J V | V | J V Finances | J V |
| Loyer (A2) | J V | J V | J V | J V | J V borne | – échéance | – | V | J V Trim. 6 mois | V | V | J V | V prévu | J V | V | – | J V |
| Abonnement (A3) | J V | J V | V | J V | J V | V | – | J V | J V Mois 6 mois | J V | J V | J V | V | J V | V | – | J V |
| Salaire (A4) | J V | J V | J V | J V | J V borne | – échéance | – | V | J V Mois 6 mois | J V | J V | V | V prévu | J V | V | – | J V |
| Impôts (A5) | J V | J V | J V | J V | J V borne | – | J V | – | – | V | V | J V | V prévu | J V | V | – | J V |
| Pour moi (A6) | J V | J V | V | J V | J V | V | – | – | J V Mois 6 mois (1) | V | V | J V | V inchangé | J V | V (1, 3) | – | J V |
| Autre sortie (A7, U) | J V | J V | V | J V | J V | V | – | – | V | J V | J V | V | V | J V, Annuler J V, Saisir un autre J V | V | – | J V |
| Vente (R1, G5) | J V | J V | J V | J V | J V borne | – échéance J V | – | V | V | J V | J V | J V | V prévu | J V | V (2) | J V Calendrier › Ouvrir (4) | J V |
| Apport (R2) | J V | J V | V | J V | J V | V | – | – | J V Mois 6 mois (1) | V | V | J V | V inchangé | J V | V (1, 2, 5) | – | J V |
| Autre entrée (R3, G1b, G2) | J V, défaut J V | J V | V | J V | J V | J V liste | – | – | V | J V | J V | V | V | J V | V (2) | – | J V |
| Remboursement (G6) | ouvert, liste vue (6, 7), non enregistré | | | | | | | | | | | | | | | | |
| Habituel « De ma poche » | vu (R2-00), remplacé par les prévisions ZZ pendant le test | | | | | | | | | | | | | | | | |

Scripts, un par sorte de geste : e0, maj, s0 (soldes, avis), jouer + lot.sh (chaque sorte), geste (gestes fins), cal, cal2, recur (Calendrier), mod, mod2 (modifier), annul (carte de fin), supprimer, fin, fin2 (retrait, soldes), clore (onglet fermé, navigateur gardé) ; journal : journal.txt, lot.log.

LEÇON PROPOSÉE : un test de récurrente compare la somme d'une pastille ou de « à dépenser » au calcul à la main. Ici, l'écart de 2,50 sur « à dépenser » (−468 au lieu de −470,8) a seul révélé l'occurrence fantôme, que la liste des marques ne montrait pas.

## Journal des sortes jouées
- 23:41 e0/maj/s0 : paquet DU-8kJuj servi d'abord ; avis « Nouvelle version » en bas, au-dessus du pied, sans couvrir (M1-avis) ; Recharger → CRA3EhuZ. Période au départ : 6 sem., 23 nov. 2026 – 3 janv. 2027.
- lot.sh (11 sortes, A1–A7, R1–R3) : jouées et enregistrées ; planches PL-av1..3, PL-fin1..3 ouvertes. Compte non joué (libellé renommé « Compte de paiement »), Mon mois non touché : repris dans geste.mjs.
- geste.mjs : titre par défaut suit le curseur (Achat du 16.11, Autre entrée du 12.11) ; bouton Payé/Reçu suit en direct ; liste des comptes en ligne ; changer garde le montant ; échéance à curseur ; Remboursement ouvert (liste des pièces) ; Mon mois touché sans effet.
- cal.mjs C0 (6 sem.) : 13 marques ZZ lues ; Apport et Autre entrée dans la rangée Ventes ; bandes Apport et Pour moi « à payer, 23 nov. ».
- cal2.mjs : pastille Ventes « +15 prévu » et Papiers « −617 » ; à dépenser −468 au lieu de −470,8 attendu : occurrence fantôme le 23 nov. pour Apport (+5) et Pour moi (−2,50). Toucher la bande Apport ouvre Finances. Synthèse Entré 5,90, caisse 1 142,10 (juste).
- mod.mjs : Calendrier › Vente › Ouvrir › Modifier et Finances › Achat › Modifier ouverts (PL-M) ; montant non changé (champ non trouvé) : repris dans mod2.mjs.
- mod2.mjs : Achat 3,50 → 4,50 (Finances, « Le paiement suit ») : payé 18 nov. gardé, un seul −5 au Calendrier ; Vente 4,80 → 3,80 (Calendrier › Ouvrir › Modifier) : +4 au Calendrier, à dépenser −468 → −470.
- recur.mjs : « Période suivante » sans effet trouvable par script, cadre resté au départ ; Prévisions (K5) : « TEST +5, 23.11 », « TEST −2,50 (3 fois) » dès le 23.11 : l'occurrence du 21.11 déjà saisie revient aujourd'hui.
- annul.mjs : carte de fin › Annuler : « Écriture annulée : rien n'est compté », rien aux Opérations ; Saisir un autre : saisie vierge (ZZ TEST — Saisir un autre −0,60 enregistrée).
- supprimer.mjs : 12 écritures ZZ retirées (Retirer cette écriture › Confirmer le retrait), aucune ZZ restante aux Opérations.
