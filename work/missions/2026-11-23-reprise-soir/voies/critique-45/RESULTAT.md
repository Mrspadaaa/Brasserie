OK — 3 problèmes, 0 bloquants

RESULTAT critique-45 : 3 problèmes (B 0, m 2, D 1) — soldes identiques oui — BUGS OK

Version : index-Ba6_cMq7.js. Le curl sert ce paquet ; l'onglet avait encore Cz4Lt44o et est passé à Ba6_cMq7 après mise à jour (maj.mjs). Chaînes du tour dans le paquet : « Référence, facultatif », « Référence (n° de facture) » (SaisieMain-CwMCtWns.js), « le serveur refuse », « erreur du serveur » (App-XPkmq1_6.js).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2203 bugs, 518 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222, mon onglet seulement (fermé à la fin, navigateur gardé). Console lue pendant Modifier et les retraits : aucune erreur. Non couvert : 1280, sombre, erreur serveur provoquée (aucun moyen sans toucher règles ou données réelles ; aucun texte anglais vu ; textes français présents dans le paquet), Référence du Remboursement.

## Soldes
| | avant | après retrait, app rechargée |
|---|---|---|
| à dépenser | −463 (S53) | **−463** (S53) |
| En caisse | 1 145,00, libre 1 145,00 | 1 145,00, libre 1 145,00 |
| Entré / Dépensé | 0,00 / 265,40 | 0,00 / 265,40 |
| Solde de départ | 1 145,00 | 1 145,00 |
| Mon mois (saisie) | — | — |
| période du Calendrier | 6 sem., 23 nov. 2026 – 3 janv. 2027, localStorage noté | identique (localStorage égal à l'octet, remis après la vue 3 puis 6 mois) |
Avec les ZZ : à dépenser −467. HABITUELS revenu à De ma poche, Vêtements…, Versement mensuel. Aucune ZZ dans Opérations ni au Calendrier.

## Joué
- Saisie : Salaire 5,00 à payer d'ici le 24.12, Mois 6 mois ; Loyer 4,00 à payer d'ici le 24.12, Trim. 6 mois ; Abonnement 2,00 payé 22.11, TWINT, Mois 6 mois ; Apport 5,00 Espèces, Mois 6 mois ; Pour moi 2,50 ; Achat lié 2,00 payé 20.11, Espèces, Nettoyage, Chez ; Vente 3,00 à recevoir d'ici le 24.12 ; Remboursement 0,50 lié à l'Achat lié (« net 1,50 »). Chaque saisie : titre, montant, statut, pastille et curseur, compte, catégorie, Chez, Revient et durée, Référence, carte de fin.
- Calendrier (6 sem., puis 3 mois et 6 mois) : chaque ZZ dans sa rangée et sur la courbe (étiquettes « ZZ TEST — Loyer −4 ») ; Salaire 24 déc. puis bande « / mois » au 24 janv. ; Loyer 24 déc. et 24 mars ; Abonnement 22 nov. et bande 22 déc. ; Apport 23 nov. et bande 23 déc. ; Vente 24 déc. ; carte du Salaire : « Échéance : 24.12.2026 », À payer 5,00.
- Modifier ouvert (rien enregistré) : Apport, Pour moi, Vente, Achat lié, Salaire.
- Retrait : Achat lié (avec son remboursement), puis Loyer, Salaire, Abonnement, Vente, Pour moi, Apport, chacun au premier toucher avec son texte.

## Corrigés rejoués (BUGS.md mis à jour)
- E44-1 vérifié : la carte de fin et l'aperçu annoncent 24.12 · 24.01 … (Salaire) et 24.12 · 24.03 (Loyer), dates que le Calendrier montre ; écriture payée : 22.11 ✓ · 22.12 … comme sa pièce. Reste la fin de série (n° 1) et HABITUELS (n° 2).
- E44-2 vérifié : « Son remboursement lié (Remboursement ZZ TEST — Achat lié 0,50 CHF) est retiré avec elle, paiement inversé compris » ; après Confirmer : achat « Écriture annulée », le remboursement quitte Opérations, soldes justes (U1-avant, U1-apres).
- E44-3 vérifié : « Référence, facultatif » pour Apport et Pour moi (saisie et Modifier, M1-modifier) ; « Référence (n° de facture) » pour Vente et Achat (M3-modifier).
- Erreurs serveur : non provoquées (non couvert) ; aucun texte anglais vu.

## Combien et quels problèmes ? 3
1. m — E45-1 — Fin de série fausse dans l'aperçu et la carte de fin d'une récurrente « à payer d'ici ». Loyer Trim. 6 mois : « 24.12 · 24.03 … 24.02.27 · 2 fois » et « → févr. 2027 », une fin avant la deuxième date. Salaire Mois 6 mois : « 24.12 … 24.04.27 · 6 fois », « → avr. 2027 », alors que six mois depuis le 24.12 finissent le 24.05. La fin suit encore l'ancienne règle (pièce du 24.11). (L-18-fin, S-16-avant-enregistrer, S-18-fin.) Le brasseur : « 24 mars, et ça finit en février ? ».
2. m — E45-2 — HABITUELS : « ZZ TEST — Loyer · échéance le 24.02 · à enregistrer ». Le Calendrier la met au 24 déc., puis au 24 mars, rien au 24.02. (C1-0, D4-0.)
3. D — E45-3 — Salaire : indication « Référence (n° de facture) » en saisie et dans Modifier, coupée en « Référence (n° de facture » (M5-modifier). Un salaire n'a pas de facture.

Bloquants : 0. Les n° 1 et 2 sont des dates affichées fausses, mais les montants, Σ 12 mois et le Calendrier sont justes. Classés m comme E44-1, dont ils sont le reste.

### Doutes (non comptés)
- Salaire : la fiche et Modifier portent l'icône maison, la saisie la mallette (D2-carte-S, M5-modifier).
- Revient « dès le 24.11.26 » alors que la première date du Calendrier est le 24.12 (S-16).
- Écriture annulée : l'icône × à gauche du titre ressemble à un second bouton Fermer (U1-apres).
- Prévisions : les étiquettes coupent toujours le début du nom (« TEST +5, 23.12 », P0-previsions).

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| S-16, S-18-fin, L-18-fin | clair | 390 | aperçu Revient, carte de fin à payer | 1 (n° 1) | 0 |
| PL1 (B, P, Q, H fin) | clair | 390 | cartes de fin payée, apport, pour moi, achat | 0 | 0 |
| PL2 (V fin, V2 remb., M3, D2 carte) | clair | 390 | vente, remboursement lié, Modifier vente, fiche salaire | 0 | 0 |
| C1-0 | clair | 390 | HABITUELS avec ZZ | 1 (n° 2) | 0 |
| C2-carte-B, C3-menu, C4-0, D4-4 | clair | 390 | Calendrier 6 sem., 3 mois, 6 mois, carte | 0 | 0 |
| P0-previsions | clair | 390 | Prévisions 90 j | 0 | 0 |
| M1-modifier, M5-modifier | clair | 390 | Modifier Apport, Salaire | 1 (n° 3) | 0 |
| P-15, P-16 | clair | 390 | saisie Apport | 0 | 0 |
| U1-avant, U1-apres | clair | 390 | retrait achat + remboursement lié | 0 | 0 |

Note de méthode : dans la saisie, mon script n'a pas déplié « Référence, note » (libellé différent de « TVA, référence »). La référence n'a pas été saisie pour Salaire, Loyer, Abonnement, Apport et Pour moi, et un toucher a coché « Sans justificatif » (P-15/P-16). C'est un artefact du script, pas de l'app. L'indication a été lue dans le DOM et dans Modifier.

LEÇON PROPOSÉE : aucune.
