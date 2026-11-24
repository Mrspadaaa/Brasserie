OK — 3 problèmes, 0 bloquants

RESULTAT critique-44 : 3 problèmes (B 0, m 2, D 1) — soldes identiques oui — BUGS OK

Version : index-Cz4Lt44o.js. Le curl montre que ce paquet contient ecr5 cd9db1da8 (« échéance le … · à enregistrer » dans SaisieMain-Zv0CpVqY.js). L'onglet servait encore QdtCMGhp. L'avis « Nouvelle version · Recharger » est apparu en bas, et non plus sur l'en-tête ; Recharger a chargé Cz4Lt44o.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2200 bugs, 518 ouverts).
Couvert : thème clair, 390 × 844, au toucher, dans le Chrome de débug 9222. Mon onglet est fermé à la fin, le navigateur reste ouvert. La console a été lue à chaque enregistrement : aucune erreur. Non couvert : 1280, thème sombre, facture lue par l'IA (coût), Revient « Année ».

## Soldes
| | avant | ZZ en place | après retrait, app rechargée |
|---|---|---|---|
| à dépenser (6 sem., S53) | −463 | −470, −471 (vente 3,80), −472 (achat 4,50) | **−463** |
| En caisse | 1 145,00, libre 1 145,00 | 1 142,10, libre 1 131,90, à payer 10,20, à encaisser 4,80 ; puis 1 141,10 (achat 4,50) | 1 145,00, libre 1 145,00 |
| Entré / Dépensé | 0,00 / 265,40 | 5,90 / 282,10, puis 4,90 (vente 3,80) | 0,00 / 265,40 |
| Solde de départ | 1 145,00 | — | 1 145,00 |
| Apports (Opérations) | +9 490,00 | +9 492,50 (Apport +5, Pour moi −2,50) | — (En caisse identique) |

Toutes les ZZ sont retirées : Opérations et Calendrier n'en montrent plus, et HABITUELS est revenu à De ma poche, Vêtements, Versement mensuel. La période du Calendrier n'a jamais changé : 6 sem., 23 nov. 2026 – 3 janv. 2027, et le localStorage `laffinee.calendrier.fenetre-locale` est identique au départ. Le filtre « Écritures annulées uniquement » est remis sur Tout.

## Sortes jouées (une ligne par sorte)
- Départ (E0, paquet Cz4Lt44o) : à dépenser −463 (S53) ; En caisse 1 145,00, libre 1 145,00 ; Entré / Dépensé 0,00 / 265,40 ; Solde de départ 1 145,00 ; Apports +9 490,00 ; aucune ZZ.
- Achat (A1) : titre, montant 3,50, curseur 24.11 → 18.11 (la pastille suit le doigt), Chez ouvert, catégorie Nettoyage, TVA et référence, note. Payé −3,50 le 18.11, carte de fin juste.
- Loyer (A2) : à payer, échéance 24.12, Trim. 6 mois · 2 fois. Abonnement (A3) : Mois 6 mois, coche. Salaire (A4) : à payer, Mois 6 mois. Impôts (A5) : à payer, Impôt sur la bière, coche.
- Pour moi (A6) : Mois 6 mois, « Mon mois inchangé · un prélèvement n'est pas une charge ». Autre sortie (A7) : compte Autre (icône portefeuille).
- Vente (R1) : à recevoir 24.12, coche. Apport (R2) : Espèces (icône billet), Mois 6 mois, « un apport n'est ni une vente ni une recette ». Autre entrée (R3) : TWINT (icône téléphone), étiquette « Autre entrée ».
- Calendrier (C1, K1–K6) : les 10 ZZ sont dans leur rangée, à la bonne date. Les récurrentes montrent le 22 nov. réel et une bande « / mois » au 22 déc. Les « à payer » et « à recevoir » sont au 24 déc. Les cartes donnent le montant exact (Pour moi −2,50) ; les rangées l'arrondissent au franc. Synthèse juste : Entré 5,90, Dépensé 282,10, En caisse 1 142,10, libre 1 131,90.
- HABITUELS (H1) : ZZ Pour moi et ZZ Abonnement (« échéance le 22.12 · à enregistrer »), puis ZZ Vente (dernier mouvement réel).
- Modifier (M, D) : Vente modifiée depuis le Calendrier, 4,80 → 3,80 (rangée +4). Achat modifié depuis Finances, 3,50 → 4,50, puis date 18.11 → 13.11 au curseur : enregistré sans refus. Apport ouvert : « Apports privés ». Loyer ouvert.
- Remboursement (R1–R7) : la recherche trouve ses vraies pièces. +1,00 sur ZZ Achat (« Nettoyage réduit de 1,00 », net 3,50) ; En caisse au milieu 1 141,10, juste.
- Carte de fin (N) : Saisir un autre ouvre une feuille neuve. Annuler affiche « Écriture annulée : rien n'est compté », et la saisie annulée n'apparaît pas dans Opérations.
- Retrait (T, U) : 12 ZZ retirées, chacune avec son texte (paiement inversé, ou « rien à inverser »). L'Achat 4,50 à la date déplacée, puis l'Achat lié 2,00 avec son Remboursement 0,50, sont retirés au premier toucher une fois le bouton amené à l'écran ; les deux sont « Annulé ».

## Combien et quels problèmes ? 3
1. m — La carte de fin d'une récurrente à payer annonce des dates que le Calendrier ne montre pas. Salaire 5,00 (Mois) : « Calendrier 24.11 · 24.12 · 24.01 … » ; Loyer 4,00 (Trim.) : « 24.11 · 24.02 ». Le Calendrier n'a rien au 24.11 et met chacune au 24 déc. (« à payer, 24 déc. »). C'est la même écriture avec deux dates (E44-1 ; PFIN, PC1). Le brasseur : « elle me dit le 24, le calendrier la met en décembre ».
2. m — Retrait d'un achat dont le remboursement vient d'être saisi. Opérations ne montre pas encore le Remboursement 0,50. Le texte dit seulement « Son paiement de 2,00 CHF est d'abord inversé… ». « Confirmer le retrait » annule pourtant aussi le remboursement : on le voit dans « Écritures annulées uniquement ». Pour ZZ Achat, le texte l'annonçait. Joué une seule fois (E44-2 ; PV, W2-annulees).
3. D — Dans Modifier d'un Apport, le champ Référence propose « N° de facture ». Or la carte de fin dit « un apport n'est ni une vente ni une recette » (E44-3 ; PM1).

Bloquants : 0.

### Constats rejoués (tous vérifiés en ligne, registre mis à jour)
- E43-1 : un achat payé, passé de 3,50 à 4,50, puis déplacé du 18.11 au 13.11 : aucun refus, console vide. Opérations et fiche disent « 13 nov. », les paiements sont au 13 nov., En caisse est juste.
- E43-2 : la carte donne le montant exact (Pour moi −2,50). Les rangées restent arrondies au franc, ce que l'attendu admettait (« au moins dans la carte »).
- E43-3 : deux prévisions au plus ; la 3e place va au dernier mouvement réel.
- E43-4 : une icône par compte : Banque, Espèces (billet), TWINT (téléphone), Autre (portefeuille).
- E43-5 : « Apports privés », sans champ Tiers. Reste le n° 3.
- E41-1 : l'achat et son remboursement lié sont retirés ensemble au premier toucher. Reste le n° 2 (le texte).
- E41-2 : « masque », « 23 », « Brau » trouvent consomable 23,00 et Brau- und Rauchshop 110,40.

### Ses plaintes du soir
- Apport au Calendrier : réglé. Il est dans la rangée Ventes, au 22 nov., avec une bande « / mois » au 22 déc., et sa carte propose « Ouvrir ». La vue Apport a la même structure que les autres, avec la coche « Sans justificatif, c'est normal ». Curseur : la pastille de date suit le doigt (A1-05). Avis « Nouvelle version » : en bas, plus sur l'en-tête.

### Doutes (non comptés)
- Paiements d'un achat : un paiement actif s'affiche « −2,00 », le même barré « corrigé » s'affiche « 2,00 ». Le signe change selon l'état.
- Calendrier : les apports (ZZ Apport, De ma poche) sont rangés dans Ventes.
- HABITUELS : « De ma poche » disparaît dès qu'un mouvement plus récent existe. « Échéance » est employé pour un prélèvement Pour moi.
- « De quelle pièce ? » : consomable 23,00 est daté « 01.01 », alors qu'Opérations le dit payé le 19 nov. Plomberie et sol brasserie, encore « Paiement à confirmer », sont proposés au remboursement.
- Sur une longue fiche, « Confirmer le retrait » apparaît sous le bas de l'écran : il faut défiler. Mes premiers touchers tombaient hors écran.
- Prévisions : les étiquettes coupent le début du nom (« TEST +5 »).

## Table (captures 390 ouvertes en planches)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| PA1, PF1, PF2 | clair | 390 | 10 sortes : forme, curseur, Chez, fin | 0 | 0 |
| PFIN | clair | 390 | cartes de fin, récurrences, Mon mois | 1 (1) | 0 |
| PCPT | clair | 390 | comptes et icônes | 0 | 0 |
| PC1, PC2 | clair | 390 | Calendrier, bandes, Prévisions, habituels, Synthèse | 1 (1) | 0 |
| PM1, PM2 | clair | 390 | Modifier Vente (Calendrier), Achat, date, Apport, Loyer | 1 (3) | 0 |
| PR | clair | 390 | Remboursement, recherche, Annuler | 0 | 0 |
| PT, PU, PV, W2-annulees | clair | 390 | retrait, avis, soldes | 1 (2) | 0 |

## Matrice sorte × actionneur (J = joué, V = vu ; – = absent)
| sorte | titre | montant | Payé/À payer | pastille + curseur | compte | catégorie | tiers | Revient | TVA, réf. | note | coche | fin | Calendrier | modifier | retirer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Achat | J V | J V | V | J V | V | J V | J V | V | J V | J V | V | J V | J V | J V (date, montant) | J V |
| Loyer | J V | J V | J V | J V | – échéance | – | V | J V | V | V | V | J V (1) | J V | V | J V |
| Abonnement | J V | J V | V | J V | V | – | V | J V | V | V | J V | J V | J V | – | J V |
| Salaire | J V | J V | J V | J V | – échéance | – | V | J V | V | V | V | J V (1) | J V | – | J V |
| Impôts | J V | J V | J V | J V | – échéance | J V | – | – | V | V | J V | J V | J V | – | J V |
| Pour moi | J V | J V | V | J V | V | – | – | J V | V | V | J V | J V | J V | – | J V |
| Autre sortie | J V | J V | V | J V | J V | – | – | V | J V | J V | V | J V | J V | – | J V |
| Vente | J V | J V | J V | J V | – échéance | – | V | V | J V | J V | J V | J V | J V | J V (Calendrier) | J V |
| Apport | J V | J V | V | J V | J V | – | – | J V | V | V | J V | J V | J V | V (3) | J V |
| Autre entrée | J V | J V | V | J V | J V | – | – | V | J V | J V | V | J V | J V | – | J V |
| Remboursement | – | J V | V | V | V | – | pièce J V | – | – | – | – | J V | – | – | J V (2) |

LEÇON PROPOSÉE : un script de test qui touche un bouton doit d'abord l'amener à l'écran (scrollIntoView), et vérifier qu'il y est, avant de conclure à un geste sans effet. Le 24.11, E41-1 semblait encore présent parce que le toucher tombait sous le bas d'une longue fiche ; avec le bouton visible, le retrait passait au premier essai.
