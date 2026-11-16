REPRISE — OK — 7 problèmes, 1 bloquant, retrait INCOMPLET (script prêt, non lancé) : étapes 1, 2, 3 jouées et vérifiées ; 4 jouée jusqu'à l'ensemencement (stock jamais déstocké) ; 5 non enregistrée (Encaisser désactivé) ; 6 à lancer : `node work/missions/2026-11-10-parcours-complet/jouer/etape5e-retrait.mjs` (contexte de l'agent épuisé avant le lancement).

Version : https://brasserie-l-affinee.web.app, bundle servi `index-VrVTbdai.js` (lu à chaque passage), tag en-ligne/2026-11-10-compta10, profil connecté du jeu 9, 390 tactile clair, 10.11. Scripts `jouer/lib.mjs`, `etape1`, `etape2h` (reprise), `etape3`, `etape3b`, `etape4`, `etape4b…4f`, `etape5e-retrait.mjs` ; captures `captures/` (préfixes 2h-, 3-, 3b-, 4-, 4b- à 4f-). Aucune lecture Gemini. Aucun geste sur une donnée réelle : seuls des ZZ TEST ont été enregistrés.

## DONNÉES ZZ TEST ENCORE EN LIGNE (à retirer, dans cet ordre)
| donnée | identifiant | geste de retrait (vu dans l'app) |
|---|---|---|
| brassin « ZZ TEST — parcours 10.11 », Brassage en cours, étape 9 | LOT-016 | Brassins › Brassins (…) › ouvrir LOT-016 (pas « Reprendre ») › Dossier › « Supprimer ce brassin » › « Supprimer le brassin » |
| dépense « ZZ TEST — parcours 10.11 achat », 12,50 CHF, Brassage, payée 10.11 | Opérations novembre | Finances › Opérations › ligne › Supprimer › confirmer (geste non encore vu : le script lit les boutons) |
| recette « ZZ TEST — parcours 10.11 » (American Pale Ale, 24 L, malt ZZ 5 kg, sans houblon ni levure) | REC-MWADJ1XU, V1 | page de la recette › « Supprimer la recette » › confirmer (geste prouvé par `retrait.mjs`, r-02) |
| articles ZZ malt (Malt, kg, stock 5 kg) / houblon (Houblon, g) / levure (Levure, sachet) | MP-036, MP-037, MP-038 | Stocks › fiche › Supprimer › « Supprimer l'article » ; le malt refuse tant que la recette et le brassin existent (3b-06 : « ne peut pas être supprimé : la recette… l'utilise ») : après la recette et le brassin |
| client « ZZ TEST — parcours 10.11 », Pro, Prospect | CL-006 | Clients › Carnet › ligne › Supprimer (geste non encore vu ; le script lit les boutons) |
| vente ZZ | aucune (jamais enregistrée) | — |

État de départ à retrouver après le retrait (etape1 + 3-01 à 3-04, compta10) : Synthèse nov. Entré 5 695,00, Dépensé 0,00, En caisse 5 663,00 ; Opérations nov. 1 opération (+5 695,00) ; Prévisions 5 035,32 au 7 févr. ; Annuel −70,40, Dépensé + usure 5 765,40 ; Stock Tous · 53, À commander · 17 ; Brassins 3 (LOT-013 à 015 planifiés) ; 24 recettes ; 5 clients. Le script `etape5e-retrait.mjs` tente d'abord la vente avec TWINT (si Encaisser reste désactivé : abandon du panier, rien d'écrit), puis retire tout et relève l'état final (NOTE fin.*). Comparer mot à mot.

## Étapes jouées, attendu / lu
### 1. État de départ — OK (etape1, 1-01 à 1-07 ; refait pour les finances sous compta10 : 3-01 à 3-04, identiques).
### 2. Recette — OK avec 3 problèmes déjà notés (P1 à P3, inchangés). Reprise 2h : 3 articles créés (catégorie perdue à la création, corrigée par la fiche : D1 reproduit une 2e fois → problème P4), recette enregistrée avec le malt ZZ 5 kg seul (2h-02, 2h-03 : Récap « Stock 1 ingrédient à commander », Levure « Souche à préciser »).
### 3. Achat — OK. Attendu : stock +5 kg, Courses, finances. Lu (3b-05 à 3b-11) : fiche MP-036 « Stock actuel 5 kg » ; Synthèse Dépensé 12,50 · Brassage 12,50, En caisse 5 650,50 ; Opérations « Brassage 12,50 ZZ TEST — parcours 10.11 achat ✓ payé aujourd'hui · banque sans pièce » ; Prévisions 5 022,82 (−12,50) ; Annuel −82,90, Dépensé + usure 5 777,90 (+12,50) ; Courses sans ZZ (plus en rupture). Chiffres justes champ par champ. Premier essai (etape3, 3-05 à 3-07) refusé par le formulaire, rien d'écrit : voir P5, P6.
### 4. Brassage — PARTIEL. Attendu : stock −5 kg, lot créé. Lu : LOT-016 créé (4-05), besoins mis à jour (fiche malt « 1 brassin d'avance · Besoin moyen 5 kg par brassin planifié », 4-07 : la recette seule ne crée pas de besoin, le brassin planifié oui → P3 tranché : voulu, mais le Récap de la recette dit « à commander » : incohérence maintenue). Jour de brassage conduit : Commencer aujourd'hui → 4 ingrédients cochés → Concassage → paliers (minuteurs : « Terminer maintenant ») → Rinçage → Contrôle → « Ébullition atteinte » → « Couper le feu et continuer » → Refroidissement → Étape 9 Ensemencement (4b-02 à 4d-04). « J'ai ajouté la levure » touché 6 fois en tout : l'écran reste à l'étape 9 avec le bandeau « Consigne la quantité réellement ajoutée dans le guide Levure avant de clôturer » (4d-03, 4f-04) ; le stock ZZ malt reste à 5 kg après tout le jour de brassage (4f-06) → P7 (bloquant).
### 5. Vente — NON ENREGISTRÉE. Feuille « Vendre » : client ZZ créé par « + client » (CL-006, 4d-09 ; un client Pro bascule la feuille en « Facture QR / Facturer »), « ✓ Payé ici », ligne « Autre » (Désignation ZZ, 1 × 45,00) ajoutée, panier « 45,00 CHF », quittance aperçue ; mais « Encaisser 45,00 CHF » est désactivé (4f-07, 4f-08 : `BUTTON … :off`) ; à la fermeture « Le panier (1 ligne) sera perdu » (4e). Non compté bloquant tant qu'un moyen (TWINT / Espèces) n'a pas été choisi : `etape5e-retrait.mjs` le rejoue avec TWINT. Finances inchangées après l'essai (4f-09 à 4f-11).
### 6. Retrait — NON LANCÉ (voir table). Rien de réel touché.

## Sa question : « combien et quels problèmes il y a ? »
1. (P1, inchangé) Wizard Houblons : « stock ou catalogue », mais un article Houblon du stock hors catalogue n'est jamais proposé (2e-02). Non bloquant.
2. (P2, inchangé) Wizard Levure : la proposition du stock touchée ne pose pas la levure (2g-06, 2g-09). À rejouer à la main. Non bloquant tant que non confirmé.
3. (P3, précisé) Récap de la recette « Stock 1 ingrédient à commander » alors que Courses et la fiche article ne comptent que les brassins planifiés (fiche malt : besoin apparu seulement avec LOT-016, 4-07). Deux écrans, deux règles. Non bloquant.
4. **Nouvel article : la catégorie choisie dans la liste est perdue à la création** (2h : « Malt », « Houblon », « Levure » choisis, `valeurs` = "" ; les 3 articles créés en « Divers », corrigés par la fiche ; l'unité tient sauf une fois). Reproduit à chaque passage (2a, 2b, 2h) : plus un doute. En brasseur : « je choisis Malt, il me met Divers ». Non bloquant (la fiche corrige).
5. **Dépense sans justificatif : la section « Articles, stock et matériel » est pliée et affiche « 1 entrée en stock » alors qu'aucun article n'est choisi ; Enregistrer renvoie trois lignes « À corriger »** (3-05, 3-07). Le brasseur ne voit pas qu'il a une ligne à remplir avant d'appuyer. Non bloquant.
6. **Dépense : l'unité de la ligne reste vide après le choix d'un article du stock dont l'unité est connue (kg)** ; sans la taper, « unité à préciser · Rien n'entre en stock » (3-07 ; 3b : `Unité ligne 1=` après le choix de MP-036). En brasseur : « il connaît l'unité de mon malt ». Non bloquant.
7. **Brassage : après tout le jour de brassage (malt coché « ajouté en cuve », ébullition coupée, refroidi), le stock n'a pas bougé (5 kg → 5 kg) et le brassin ne passe pas en fermentation : « J'ai ajouté la levure » n'a pas d'effet visible, seul un bandeau « Consigne la quantité réellement ajoutée dans le guide Levure » apparaît, sans bouton ni champ nommé « guide Levure » trouvé par le script** (4d-03, 4f-02 : la zone Levure montre « Quantité prévue absente ou nulle · saisis le réel dans le guide Levure », « Ajout consigné le 10.11.26 08:47 » et un bouton « Modifier la quantité de » au libellé tronqué, que `etape4f` n'a pas retrouvé). Bloquant : geste principal sans effet, et le stock (« met à jour les stock » dans ses mots) ne baisse pas pour une recette sans levure renseignée. À rejouer à la main (toucher « Modifier la quantité de … », saisir, puis « J'ai ajouté la levure ») avant de l'arrêter en règle ; si le geste à la main passe, le défaut devient : « une recette sans levure se brasse jusqu'au bout sans jamais déstocker le malt ».

## Doutes (non comptés)
- D2 (inchangé) : le bouton + reste visible par-dessus le wizard à 390 (2h-02).
- D5 : le brassin planifié crée le besoin en stock, la recette seule non (voulu ? P3).
- D6 : « Encaisser 45,00 CHF » désactivé avec client + ligne + « Payé ici » : attend sans doute le moyen (TWINT / Espèces), mais rien ne le dit (4f-07). À confirmer par `etape5e-retrait.mjs`.
- D7 : un client créé depuis la feuille Vendre est « Pro » par défaut et bascule la vente en facture (4d-09) ; au comptoir, c'est une surprise.
- D8 : console « Failed to load resource: 400 » une fois par passage sur la feuille Vendre (4d, 4e, 4f).

## REPRISE (agent neuf, ~20 tours)
1. `node work/missions/2026-11-10-parcours-complet/jouer/etape5e-retrait.mjs` (vente TWINT puis retrait complet puis état final ; sortie NOTE/CAPTURE ; captures préfixe `6-`). Lire : `vente.boutons`, `vente.apres`, `*.retire`, `*.sheet.boutons` (si un Supprimer manque, adapter la regex), `fin.*` contre l'état de départ ci-dessus ; `stock.apres` doit dire « Rien ne correspond », `brassins.apres` 3 brassins, `recettes.apres` 24, `clients.apres` 5 clients.
2. Si la vente s'enregistre : lire Opérations/Synthèse (NOTE `ops.apresVente`, `synthese.apresVente` : attendu +45,00, caisse 5 695,50) puis vérifier son retrait (`vente.retire`).
3. Leçons d'exécution : BrewDay n'est pas un `[role=dialog]` (le dernier dialog est le panneau « Note ») ; bouton principal = bouton large en bas d'écran ; la feuille Vendre et la fiche article sont des dialogs ; la section Articles de la dépense doit être dépliée (`^Articles, stock et matériel`) avant de toucher le Combobox « Article » (options `li`, texte « ZZ TEST — parcours 10.11 malt0 kg · Malt »).
4. Mettre à jour ce fichier : ligne 1 sans « REPRISE », table des données retirées, état final comparé.

LEÇON PROPOSÉE : sur l'app réelle, un parcours à six étapes coûte un agent par étape ; l'agent qui découvre un écran doit d'abord lire ses boutons et champs (un script de lecture, rien d'enregistré), puis jouer, sinon chaque étape coûte deux à trois passages (ici 3→3b, 4→4b→4c→4d→4e→4f).

## Retrait (10.11, script `jouer/etape5e-retrait.mjs`, 3 essais par étape en échec)

Vente TWINT ZZ jouée à l'essai 1 : « Encaisser 45,00 CHF » actif avec TWINT ; enregistrée « encaissé aujourd'hui · TWINT », client ZZ. Elle persiste : elle ne se rejoue pas.

**Retiré (vérifié)**
- LOT-016 (brassin ZZ, « Supprimer le brassin ») : Brassins 3, LOT-013 à 015.
- Recette REC-MWADJ1XU : 24 recettes, ZZ absent.
- MP-036 (malt), MP-037 (houblon), MP-038 (levure) : « Supprimer l'article » ×3 ; stock « Rien ne correspond à « ZZ TEST » », Tous · 53, À commander · 17.

**Reste (non retiré)**
- Vente « ZZ TEST — parcours 10.11 vente », 45,00 CHF, TWINT, encaissée 10.11 : identifiant non lu. La fiche n'a pas de « Supprimer » ; « Annuler cette écriture » ouvre un flux « Garder » / « Confirmer la correction ». Le script a cliqué « Confirmer la correction » sans lire ce flux (voir Incidents). Opérations et Synthèse lues après ce clic : +45,00 et 12,50 encore là, aucune écriture de contre-passation visible.
- Dépense « ZZ TEST — parcours 10.11 achat », 12,50 CHF, Brassage, payée : identifiant non lu. Même flux, même état après clic.
- Client CL-006 « ZZ TEST — parcours 10.11 », Pro, Actif, 1 vente (la vente ci-dessus) : non supprimé. « Modifier ZZ TEST » n'a ouvert aucune fiche avec « Supprimer » (client.ouvert vide, « Supprimer absent »).

**État final comparé au départ**

| Donnée | Départ | Final | Écart |
|---|---|---|---|
| Caisse | 5 663,00 | 5 695,50 | +32,50 = +45,00 vente − 12,50 dépense |
| Tous · 53 / À commander · 17 | 53 / 17 | 53 / 17 | aucun |
| Brassins | 3 | 3 | aucun |
| Recettes | 24 | 24 | aucun |
| Clients | 5 | 6 | +1 : CL-006 |
| Entré (Synthèse nov.) | 5 695,00 | 5 740,00 | +45,00 : vente |
| Dépensé | 0,00 | 12,50 | +12,50 : dépense |
| Opérations nov. | 1 | 3 | +2 : vente, dépense |

Prévisions 5 035,32 → 5 067,82 et Annuel −70,40 → −37,90 : écarts cohérents avec la seule vente et la seule dépense restantes.

**Incidents**
1. Essai 2 : le repli `document.body` de `dlgBtn` a cliqué « Modifier Restaurant du Lac », un vrai client. Ouverture seulement : liste de boutons inchangée, aucune écriture détectée. Repli retiré.
2. Essai 3 : `^Confirmer` a cliqué « Confirmer la correction » sur la vente puis sur la dépense, flux non lu. Données ZZ seulement ; aucun changement visible. À vérifier à la main : fiche vente et fiche dépense, « Corriger ce paiement erroné » et « Garder ».
3. Le retrait par « Supprimer » n'existe pas sur les écritures : le geste reste à trouver (hypothèse : suppression d'écriture hors fiche, ou règle d'annulation à lire).

LEÇON PROPOSÉE : un bouton de confirmation ne se choisit pas par une regex large (`^Confirmer`) ; lire le flux complet (texte et boutons) avant tout clic de confirmation, et borner le motif au libellé attendu. Cause : le flux « Corriger » a été confirmé sans lecture.

**Réponse : RETRAIT INCOMPLET — vente ZZ 45,00 CHF (TWINT), dépense ZZ 12,50 CHF, client CL-006 restent.**

## Retrait, fin (10.11, scripts `jouer/fin1-lire`, `fin2-annuler-lire`, `fin3-annuler`, `fin4-paiement`, `fin5-client` à `fin7-etat`)

Règles tenues : chaque clic visé sur une fiche dont le texte contient « ZZ TEST — parcours 10.11 vente/achat » (vérifié par le script avant le clic) ; libellés de boutons exacts (`=== 'Confirmer la correction'`, jamais de regex) ; confirmation seulement si le dialogue contient le texte ZZ. Aucune autre fiche ouverte, aucune lecture Gemini.

**Incident n° 2, vérifié** : fiches vente et dépense lues (fin1) : montants et statut inchangés (vente 45,00 « Soldé », dépense 12,50 « Soldé »), « Historique des paiements » avec le seul paiement d'origine, aucune contre-écriture. Le « Confirmer la correction » du 3e essai n'avait donc rien changé ; Opérations (3 lignes) et Synthèse égales au constat d'alors.

**Dialogues lus (texte entier)**
1. « Annuler cette écriture » (dans « Corriger une erreur de saisie », section pliée : le texte lit « Une annulation conserve la pièce et son historique. Un achat déjà consommé ou lié à un amortissement demande d’abord une correction de ses liens. ») puis « Confirmer l’annulation de cette écriture erronée ? » ; boutons « Garder », « Confirmer la correction ».
2. Premier « Confirmer la correction » sur la vente : refus de l'app, message « Annule d’abord le paiement erroné, ou enregistre un remboursement si l’argent a réellement circulé. » ; rien changé.
3. « Corriger ce paiement erroné » (dans « Historique des paiements ») : « Ce paiement a été saisi par erreur. Sa contre-écriture reprendra la date d’origine ; pour un remboursement réel, utilise un avoir. » ; boutons « Garder », « Confirmer la correction ».

**Gestes faits**
- Vente ZZ 45,00 CHF TWINT : « Corriger ce paiement erroné » > « Confirmer la correction » (historique : TWINT +45,00 puis Correction −45,00 ; fiche « À encaisser 45,00 ») ; puis « Annuler cette écriture » > « Confirmer la correction » : « Écriture annulée. Justificatif et historique conservés. » La ligne a quitté Opérations (pas affichée barrée « Annulé » dans la liste du mois). RETIRÉE.
- Dépense ZZ 12,50 CHF : « Corriger ce paiement erroné » > « Confirmer la correction » (Compte bancaire/carte −12,50 puis Correction +12,50 ; fiche « À payer 12,50 »). Puis « Annuler cette écriture » > « Confirmer la correction », deux fois : l'app affiche « Le stock de cet achat a été consommé ou corrigé. Vérifie l’inventaire avant d’annuler ; aucune quantité ne sera effacée. » et garde le dialogue ouvert, l'écriture n'est pas annulée. NON RETIRÉE. Cause probable : lien vers MP-036 (article ZZ supprimé avant) ; le brouillon « correction de ses liens » n'a pas de geste visible dans la fiche. Effet de bord de mon geste : la dépense est maintenant « à payer 12,50 » (non payée) au lieu de « payée ».
- Client CL-006 : ligne dépliée, « Modifier » ouvre « Modifier le client » avec seulement « Annuler » et « Enregistrer » ; aucun « Supprimer » dans l'app. Ligne maintenant « Prospect — Aucune vente ». NON RETIRÉ.

**État final contre le départ**
| Donnée | Départ | Final |
|---|---|---|
| Caisse | 5 663,00 | 5 663,00 (libre 5 650,50 ; à payer 12,50) |
| Entré nov. | 5 695,00 | 5 695,00 |
| Dépensé nov. | 0,00 | 12,50 (dépense ZZ « à payer ») |
| Opérations nov. | 1 | 2 (+ la dépense ZZ « à payer ») |
| Clients | 5 | 6 (CL-006) |
| Annuel | −70,40 | −82,90 (−12,50 dépense ZZ) |
| Prévisions | 5 035,32 | 5 035,32 |
| Tous / À commander, Brassins, Recettes | 53 / 17, 3, 24 | inchangés |

LEÇON PROPOSÉE : annuler un achat dont l'article de stock a déjà été supprimé est refusé ; retirer l'écriture d'achat AVANT l'article lié, ou prévoir un geste « délier » dans la fiche.

**Réponse : RETRAIT INCOMPLET — dépense ZZ 12,50 CHF (annulation refusée par l'app : stock de l'achat « consommé ou corrigé », elle reste « à payer ») ; client CL-006 (aucun geste Supprimer dans l'app).**
