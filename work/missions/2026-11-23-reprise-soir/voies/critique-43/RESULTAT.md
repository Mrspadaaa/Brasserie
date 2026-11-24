OK — 7 problèmes, 3 bloquants

RESULTAT critique-43 : 7 problèmes (B 3, m 2, D 2) — soldes identiques oui — BUGS OK

Version : index-QdtCMGhp.js (curl). L'onglet servait encore DwEuRObA (cache du service worker) ; l'avis « Nouvelle version · Recharger » est apparu en bas de la feuille Saisir à la main, plus sur l'en-tête ; Recharger → QdtCMGhp.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK).
Couvert : thème clair, 390 × 844, toucher, Chrome de débug (mon onglet fermé à la fin, navigateur laissé ouvert). Non couvert : 1280, sombre, facture lue par l'IA (coût).

## Soldes
| | avant | ZZ en place | après retrait, app rechargée |
|---|---|---|---|
| à dépenser (6 sem., 23 nov. – 3 janv., S53) | −463 | −470, −471 (vente 3,80), −472 (achat 4,50) | **−463** |
| En caisse | 1 145,00, libre 1 145,00 | 1 142,10, libre 1 131,90, à payer 10,20, à encaisser 4,80 (juste) | 1 145,00, libre 1 145,00 |
| Synthèse Entré / Dépensé | 0,00 / 265,40 | 5,90 / 282,10 (juste) | 0,00 / 265,40 |
| Mon mois (saisie) | — | — | — |
| Solde de départ | 1 145,00 | — | 1 145,00 |

Toutes les ZZ sont retirées (Opérations et Calendrier vides de ZZ ; HABITUELS revenu à « De ma poche »). Période du Calendrier jamais changée : 6 sem., 23 nov. 2026 – 3 janv. 2027, localStorage identique au départ.

## Sortes jouées (une ligne par sorte)
- Achat (A1) : titre, montant, Payé aujourd'hui → Payé, curseur (butée au 24.11, « oct. » et « nov. » écrits), Chez + autre, TVA et réf., note ; enregistré −3,50 le 19.11. Modifié depuis Finances : montant 4,50 (ok), puis date 19.11 → 14.11 (refus, n° 1). Remboursement +1 lié. Retrait (n° 2).
- Loyer (A2) : à payer, échéance 24.12, Trim. 6 mois · 2 fois ; Calendrier 24 déc. Modifier ouvert. Retiré.
- Abonnement (A3) : Mois 6 mois, coche ; Calendrier 22 nov. puis bande 22 déc. Retiré.
- Salaire (A4) : à payer, Mois 6 mois ; Calendrier 24 déc. Retiré.
- Impôts (A5) : à payer, « Impôt sur la bière », coche. Retiré.
- Pour moi (A6) : Mois 6 mois, coche ; Mon mois « inchangé » ; hors du total des Papiers. Retiré.
- Autre sortie (A7) : enregistrée −1,00. Retirée.
- Vente (R1) : à recevoir, échéance 24.12, coche ; modifiée depuis le Calendrier 4,80 → 3,80 (pastille Ventes +5 → +4). Retirée.
- Apport (R2) : Revient, Référence et note, coche (sa plainte 2334 réglée) ; Mois 6 mois ; Calendrier 22 nov. et bande 22 déc. ; Modifier ouvert. Retiré.
- Autre entrée (R3) : enregistrée +1,10. Retirée.
- Remboursement : liste « De quelle pièce ? » (n° 3), +1,00 sur ZZ Achat enregistré (« Brassage réduit de 1,00 », net 3,50). Retiré seul.
- Compte (H6) : Banque, Espèces, TWINT, Autre ; TWINT choisi.
- Titre par défaut (H1–H4) : « Vente du 24.11 » devient « Vente du 15.11 » en glissant ; pastille aussi (sa plainte 2339 réglée).
- Carte de fin : Saisir un autre (feuille neuve), Annuler (rien d'enregistré), Fermer.

## Combien et quels problèmes ? 7
1. **B** — Modifier › date d'un achat payé : glissé du 19.11 au 14.11, montant inchangé, Enregistrer → bandeau rouge « Enregistrement refusé : Missing or insufficient permissions. » (en anglais, en haut, resté jusqu'au rechargement). Résultat à moitié : Opérations « payé 14 nov. », fiche « Brassage · 19 nov. 2026 », paiements « 19 nov. 3,50 corrigé · 1,00 corrigé » puis « 14 nov. −3,50 · −1,00 » (E43-1). Cause probable : firestore.rules:77 exige `payment.date >= original.date` pour un contre-paiement ; déplacer vers une date antérieure est refusé.
2. **B** — Retirer ZZ TEST — Achat avec son remboursement lié : le texte annonce bien « Son remboursement lié … est retiré avec elle », mais « Confirmer le retrait » touché deux fois : l'achat reste, rien sous le bouton. Remboursement retiré seul, l'achat part au 3e essai (E41-1 encore présent ; l'achat portait aussi les paiements à moitié écrits du n° 1).
3. **B** — Remboursement › « De quelle pièce ? » : seules les ZZ saisies à la main ; « masque », « 23 », « Brau » → « Aucune pièce ne correspond », alors que consomable 23,00 et Brau- und Rauchshop 110,40 sont « payé » aux Opérations (E41-2 encore présent).
4. m — Calendrier arrondi au franc, carte comprise : Pour moi 2,50 → « −3 » (et la carte « −3 »), Achat 3,50 → −4, puis 4,50 → −5, Vente 4,80 → +5, Autre entrée 1,10 → +1 (E43-2).
5. m — HABITUELS : dès trois récurrentes, les ZZ Apport, Salaire et Pour moi prennent toute la place, « De ma poche » disparaît ; sous-ligne « prévu le 22.12 · le solde » obscure (E43-3).
6. D — Compte TWINT affiché avec l'icône de banque (« 🏛 TWINT ») (E43-4).
7. D — Modifier d'un Apport : étiquette « Privé » au lieu de « Apports privés », champ « Tiers / Nom » absent de sa saisie, pas de « changer » (E43-5).

Bloquants : 1 (valeur fausse, geste refusé), 2 (geste sans effet), 3 (geste sans effet).

### Constats rejoués
- Vérifiés en ligne : E40-4 et E41-4 (Modifier = feuille de saisie : en-tête et « changer », grand montant, Reçu/À recevoir et compte dans la carte, pièce après ; depuis le Calendrier et Finances), E41-3 (bande Apport → « Ouvrir », sans Facturer), E41-6 (piste arrêtée au 24.11, « oct. » et « nov. » écrits).
- Encore présents : E41-1 (n° 2), E41-2 (n° 3).
- Régression : E41-5 (n° 1, E43-1).

### Ses plaintes du soir
- Apport au Calendrier : oui (rangée Ventes, hors du total). Vue Apport comme les autres, avec Revient, coche « Sans justificatif, c'est normal ». Curseur : date et titre suivent en direct. Avis « Nouvelle version » : en bas, plus sur l'en-tête.

### Doutes (non comptés)
- L'avis « Nouvelle version · Recharger » se pose par-dessus une saisie en cours : Recharger perd-il la saisie ?
- Loyer a pour titre par défaut « Loyer », les autres « X du 24.11 ».
- Prévisions : étiquettes « TEST +5 » (début du nom coupé) ; « achats ≥ 2,40, 13.12 » sans source lisible.
- Écriture à payer : la date de la pièce ne passe pas aujourd'hui ; seule l'échéance est future (choix probable).

## Table (captures 390 ouvertes en planches)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| PA1, P-00-forme-a/b | clair | 390 | 10 sortes : forme, curseur | 0 | 0 |
| P-18-fin-a/b | clair | 390 | cartes de fin, récurrences, Mon mois | 0 | 0 |
| PH6, H5-habituel | clair | 390 | comptes, titre qui suit, habituels | 2 (5, 6) | 0 |
| PC | clair | 390 | Calendrier 6 sem., bandes Apport et Pour moi, Prévisions | 1 (4) | 0 |
| PM | clair | 390 | Modifier Vente, changer, Achat, montant, Apport | 1 (7) | 0 |
| PD | clair | 390 | Modifier › date d'un achat payé | 1 (1) | 1 |
| PR | clair | 390 | Remboursement, recherche | 1 (3) | 1 |
| PT, F2-apres-confirmer | clair | 390 | remboursement lié, retrait | 1 (2) | 1 |

## Matrice sorte × actionneur (J = joué, V = vu ; – = absent)
| sorte | titre | montant | Payé/À payer | pastille + curseur | compte | catégorie | tiers | Revient | TVA, réf. | note | coche | fin | Calendrier | modifier | retirer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Achat | J V | J V | V | J V | J V | V | J V | V | J V | J V | V | J V | J V | J V (1) | J V (2) |
| Loyer | J V | J V | J V | J V | – échéance | – | V | J V | V | V | V | J V | J V | V | J V |
| Abonnement | J V | J V | V | J V | V | – | V | J V | V | V | J V | J V | J V | – | J V |
| Salaire | J V | J V | J V | J V | – échéance | – | V | J V | V | V | V | J V | J V | – | J V |
| Impôts | J V | J V | J V | J V | – échéance | J V | – | – | V | V | J V | J V | J V | – | J V |
| Pour moi | J V | J V | V | J V | V | – | – | J V | V | V | J V | J V | J V (4) | – | J V |
| Autre sortie | J V | J V | V | J V | V | – | – | V | J V | J V | V | J V | J V | – | J V |
| Vente | J V | J V | J V | J V | – échéance | – | V | V | J V | J V | J V | J V | J V | J V | J V |
| Apport | J V | J V | V | J V | V | – | – | J V | V | V | J V | J V | J V | V (7) | J V |
| Autre entrée | J V | J V | V | J V | V | – | – | V | J V | J V | V | J V | J V | – | J V |
| Remboursement | – | J V | V | V | V | – | pièce J V (3) | – | – | – | – | J V | – | – | J V |

LEÇON PROPOSÉE : une correction qui écrit des paiements se rejoue avant mise en ligne contre les règles Firestore (émulateur), pas seulement en Vitest. Le 24.11, E41-5 vert en local a été refusé en ligne (« Missing or insufficient permissions ») et a laissé une écriture à moitié faite.
