# Journal Gemini — tests Dépense en ligne (D210, D217)

Plafond (D278, 01.11, nuit : « hausse aussi le total à 49chd pour l'ia », « Chf* ») : 49 CHF cumulés pour le banc et les essais en ligne réunis (au 01.11, 22 h : 7,99 CHF au banc, environ 0,67 CHF en ligne) ; une passe au plus 3 CHF, lancée par le pilote seul.

Bornes : 10 CHF en tout (D217), 40 lectures au plus, une seule dépense « TEST pilote » à la fois, supprimée avec son fichier Drive
dans la même séance, rien en stock. Cumul relu avant chaque appel. Jamais dans `npm test`.

Tarif lu dans `functions/src/geminiCosts.ts` : la lecture (`SCAN_MODEL`, gemini-3.8-flash) coûte 1,5 CHF par million de jetons
en entrée et 7,5 CHF en sortie ; 3 appels de 5 100 jetons de sortie au plus, donc environ 0,13 CHF au pire par lecture.

| n° | Date | Objet | Fichier | Coût | Cumul |
|---|---|---|---|---|---|
| — | — | (aucun appel avant le 01.11) | — | 0 | 0 CHF |
| 1 | 01.11.2026 06:57 (UTC+1) | lecture d'une facture fictive, version 5f224fc3 en ligne ; « Lectures d'accord 2/2 » | `ticket-test-pilote.png` (fictif, une ligne de service, 35 CHF) | 0,0155 CHF | 0,0155 CHF |
| 2 | 01.11.2026 15:31 (UTC+1) | C★v8 + QR en ligne (D254, D255) : deux Flash-Lite (1 819 et 3 043 ms), pas de 3.8 ; QR lu, état « écart » sur la date | `src/ui/depense/apercu/qr/facture-qr.png` (fictive, section de paiement seule) | 0,0031 CHF | 0,0186 CHF |
| 3 | 01.11.2026 15:33 (UTC+1) | même chose sur le PDF (pdf.js en ligne) : deux Flash-Lite en désaccord (3 808 et 4 542 ms), la 3.8 (8 933 ms) ; QR lu, tout « = lu » | `src/ui/depense/apercu/qr/facture-qr.pdf` (fictive, 7 lignes, 110,40 CHF) | 0,0270 CHF | 0,0456 CHF |

Lectures 2 et 3 : coût calculé depuis les jetons des journaux d'`aiTask` au tarif de `geminiCosts.ts` (`amount`), car le document du
mois (`brewerAiCosts/2026-11`, 186 369 µCHF à 15:34) compte aussi l'usage IA du brasseur pendant la journée. Le même PDF renvoyé deux
fois de plus est servi par le cache (`cached: true`) : aucun appel, aucun coût. Aucune dépense enregistrée (feuilles fermées sans
« Confirmer ») ; Finances › Opérations : « À payer 0 », rien en stock, rien dans le Drive.

Défaut vu à la lecture 3 : les sept montants de ligne sont lus (somme 110,40 = total imprimé), mais la 3.8 les range en `price` avec
`quantity` et `amountTTC` vides ; l'écran montre « TTC (CHF) — » sur chaque ligne, « Quantité × prix 0/7 », « Somme des lignes non
vérifiée ». La fixture n'a qu'une colonne de montants, sans en-tête. Suite : voie `fn-montant-seul` (mission 2026-11-01-bascule-lecture).

| 4 | 01.11.2026 16:34 (UTC+1) | contrôle après le déploiement du correctif (D257, révision aitask-00043-raz) : deux Flash-Lite (3 451 et 4 459 ms), pas de 3.8 ; 7 montants de ligne, « Somme des lignes = imprimé 110,40 » | `voies/fn-montant-seul/facture-qr-d257.pdf` (la fixture du PDF, un commentaire ajouté après `%%EOF` pour une empreinte neuve) | 0,0096 CHF | 0,0552 CHF |

Lecture 4 : les deux Flash-Lite ont rangé les montants en `amountTTC` (`price` vide) : la règle `montantDeLigne` n'a pas eu à jouer sur
cette lecture ; elle est prouvée par les tests et le rejeu du banc (D256). Feuille fermée sans « Confirmer » ; « À payer 0 ».

Coût lu dans Firestore, en lecture seule : `brewerAiCosts/2026-11`, `usedMicroChf` = 15 509, `reservedMicroChf` = 0. Le document du mois
a été créé par cet appel (05:57:29 UTC) : tout son montant vient de ce test.

Résultat : fournisseur, date, total 35,00, TVA 2,62 à 8,1 %, une ligne « Service », « 1 sans stock », « Lecture vérifiée ». Dépense
« TEST pilote » enregistrée, justificatif « 2026-11-01 Atelier Mesure Fictif Sàrl 7.png » rangé dans le Drive (23 999 octets, empreinte
vérifiée). Suppression : voir plus bas.

## Suppression de la dépense de test (même séance, 01.11 vers 07 h 10)
- Dans l'app, une dépense payée ne s'efface pas : elle se corrige en gardant son historique (`StorageService.revertTransaction`).
  Ordre imposé par l'app : d'abord « Corriger ce paiement erroné » (contre-écriture + 35,00, même date), puis « Annuler cette écriture ».
  Message de l'app : « Écriture annulée. Justificatif et historique conservés. » ; Finances › Opérations › Courantes : 0 opération.
  Reste dans le journal comptable : l'écriture annulée et ses deux paiements, qui s'annulent (net 0). Un effacement définitif du document
  Firestore serait une suppression de données réelles : il n'a pas été fait et reste au choix du brasseur.
- Drive : fichier `2026-11-01 Atelier Mesure Fictif Sàrl 7.png` mis à la corbeille ; vérifié sur la page Corbeille de Drive (présent) et
  dans le dossier « L'Affinée / Justificatifs / 2026 » (absent). Corbeille non vidée.
- Rien en stock : la ligne était « Service », « 1 sans stock » ; aucun article créé, aucun mouvement.

## 02.11 — appels réels de l'IA des fiches en ligne (D299, D302)
Par aiTask `lookupIngredient` déployé, depuis l'app ouverte dans son Chrome ; coût lu au registre du mois (`brewerAiCosts/2026-11/calls`).
Rien d'appliqué ni d'écrit dans le stock.

| Heure (UTC) | Produit | Durée | Jetons (µCHF) | Recherches | Compté (µCHF) |
|---|---|---|---|---|---|
| 09:32 | Gerstenflocken (D299, introuvable) | — | 3 379 | 20 provisionnées | 353 379 |
| 09:47 | BEST Red X | 7,6 s | 5 080 | 1 | 22 580 |
| 09:47 | Château Cara Ruby | 6,5 s | 3 441 | 20 provisionnées | 353 441 |
| 09:47 | Crisp Chevallier Heritage Malt | 7,4 s | 4 512 | 2 | 39 512 |
| 09:47 | Candi Syrup D-180 | 14,1 s | 5 620 | 2 | 40 620 |
| 09:48 | Bulldog B4 English Ale | 10,4 s | 12 284 | 20 provisionnées | 362 284 |

Total 1,171 CHF (D299 0,353 ; D302 0,818). Cumul des appels payants : 8,653 + 1,171 = **9,824 CHF sur 49**.
Réponses brutes : `tests/unit/depense/enrichir/reponses-reelles-d302.json`.

## 02.11 — mêmes 5 appels après le déploiement de f4-malts (D303, aiTask 4725e187)
Même voie (son Chrome, son module `AiClient` du bundle `index-B9U_rN65.js`), mêmes requêtes que D302 sans `supplier`, en parallèle, 10:50 UTC. Rien d’appliqué.

| Produit | Durée | Jetons (µCHF) | Recherches | Compté (µCHF) | Rendu |
|---|---|---|---|---|---|
| BEST Red X | 8,0 s | 3 994 | 20 provisionnées | 353 994 | trouvé ; ni plage ni extrait ; `tempMinC` −5 et `tempMaxC` 60 (les bornes du schéma) |
| Château Cara Ruby | 7,9 s | 3 810 à 13 009 | 20 provisionnées | — | trouvé ; ni plage ni extrait |
| Crisp Chevallier Heritage Malt | 6,7 s | idem | 20 provisionnées | — | trouvé ; ni plage ni extrait ; `tempMinC` 60 |
| Candi Syrup D-180 | 7,5 s | idem | 20 provisionnées | — | trouvé ; ni plage ni extrait |
| Bulldog B4 English Ale | 11,7 s | idem | 20 provisionnées | — | refusé par la garde des levures (« pas de sources documentaires exploitables ») |

Le registre ne dit pas quel appel est lequel (5 lignes de 10:50) : 353 994, 353 810, 363 009, 353 987, 354 137 µCHF, total **1,779 CHF** (20 recherches provisionnées chacun). Cumul des appels payants : 9,824 + 1,779 = **11,603 CHF sur 49**.
**Défaut** : le modèle obéit à « aucun nombre dans usage » mais ne remplit ni `colorEbcMin`, ni `colorEbcMax`, ni `extractPct` (facultatifs, ajoutés en fin d’un schéma qui garde tous les champs des houblons et des levures). Fiches des malts toujours vides en vrai. Suite : f4b-malts (schéma des malts restreint, champs exigés et nullables), sonde d’un appel avant les cinq.

## 02.11 — lecture 17 : une pièce de trois pages par « Plusieurs » (n2, D297, aiTask et hébergement 4725e187)
Son Chrome, l'app en ligne, Actions rapides › « Entrer une facture » › « Plusieurs ». Pièce : trois pages JPEG fabriquées pour le test
(« TEST pilote Services Sàrl », F-TEST-0211, bruit de fond, environ 3,67 Mo chacune), aucune pièce du brasseur.

| Heure (UTC) | Appel | Modèle | Compté (µCHF) |
|---|---|---|---|
| 10:56:21 | lecture des 3 pages | gemini-3.5-flash-lite | 4 131 |
| 10:56:22 | lecture des 3 pages | gemini-3.5-flash-lite | 4 152 |
| 10:56:26 | résolution | gemini-3.8-flash | 1 767 |

Total **0,010 CHF** (10 050 µCHF, aucune recherche). Cumul des appels payants : 11,603 + 0,010 = **11,613 CHF sur 49**. Lectures : 17 sur 40.
Au registre, `inputTokens` = 1 048 576 sur les deux lectures : c'est le devis de réservation (`MODEL_CONTEXT` pour un média,
`geminiCosts.ts:112`), pas l'usage ; le compté vient de l'usage réel.

Résultat : frise « 3 pages ✓ », lecture d'un corps d'environ 11 Mo acceptée en ligne, preuve « ✓ 3 pages lues ». « Confirmer » refusé :
les lignes de la pièce sont HT et le client exige qu'elles fassent le total TTC (`purchaseEntry.ts:466`), alors que le serveur accepte la base HT
(défaut noté dans D304). Enregistrée par « Regrouper en une dépense » : « À payer » 108,10. Drive : **un seul PDF de trois pages**
(« 2026-11-02 TEST pilote Services Sàrl F-TEST-0211.pdf », 2 039 798 octets, « page 1/3 » à « page 3/3 » dans l'ordre).

Suppression (même séance, vers 11 h 20 UTC) :
- App : dépense non payée, donc « Corriger une erreur de saisie » › « Annuler cette écriture » › « Confirmer la correction ». Message de l'app :
  « Écriture annulée. Justificatif et historique conservés. » ; Finances : « 0 opération ». L'écriture annulée reste au journal comptable
  (aucun paiement) ; un effacement définitif du document Firestore reste au choix du brasseur.
- Drive : le PDF mis à la corbeille ; vérifié sur la page Corbeille (présent) et dans le dossier « 2026 » (absent). Corbeille non vidée.
- Stock : lignes « services, port », aucun article « TEST » parmi les 50 articles ; aucun mouvement.

## 02.11 — les 5 appels après f4b-malts (D303 suite, aiTask 670a2c1d)
Même voie que D303 (son Chrome, module `AiClient` du bundle en ligne, mêmes requêtes que D302 sans `supplier`). Une sonde d'abord (BEST Red X,
11:11 UTC), puis les 4 autres en parallèle (11:11). Rien d'appliqué ni d'écrit dans le stock. Réponses brutes :
`tests/unit/depense/enrichir/reponses-reelles-f4b.json` (rejouées par `malts.test.ts`, bloc « D303 suite »).

| Produit | Durée | Rendu | Fiche déduite par l'app |
|---|---|---|---|
| BEST Red X (sonde) | 6,8 s | plage 28 à 32 EBC, extrait 79 %, `colorEbc` et `potentialPpg` à null | 30 EBC, 36,3 PPG, règles citées |
| Château Cara Ruby | 7,2 s | plage 45 à 55 EBC, extrait 75 % | 50 EBC, 34,5 PPG |
| Crisp Chevallier Heritage Malt | 6,5 s | plage 5,5 à 11 EBC, extrait 76,7 % | 8,3 EBC, 35,3 PPG |
| Candi Syrup D-180 | 7,6 s | points publiés : 354,6 EBC (180 SRM × 1,97), 32 PPG ; plage et extrait à null | 354,6 EBC, 32 PPG (points gardés) |
| Bulldog B4 English Ale | 10,2 s | trouvée cette fois : labo, souche B4, sèche, 16 à 21 °C, floculation haute, atténuation 65-70 % en plage | champs de levure remplis |

Aucune réponse de malt ne porte plus de champ de levure ni de houblon (`tempMinC` disparu). Coût au registre : 354 334 (sonde), puis 354 422,
354 073, 362 719, 354 589 µCHF, total **1,780 CHF** (20 recherches provisionnées chacun). Cumul des appels payants : 11,613 + 1,780 =
**13,393 CHF sur 49**.

## 02.11 soir — essais en ligne D321 et D322 (son app déployée, son Chrome, bundle index-DTmoQW-7)
Par l'entrée de l'app (« Entrer une facture »), sur ses vraies pièces ; heures UTC. Coûts estimés au tarif connu (le détail par appel du
registre `brewerAiCosts` n'est pas lisible ici).

| Heure | Geste | Modèles | Résultat | Coût estimé |
|---|---|---|---|---|
| 16:15:43 | doc9 (PDF), doublon | 2 Flash-Lite | « Même facture n° … », « Même achat / Autre achat » ; rien d'écrit, fermé | 0,045 |
| 16:18:07 | doc14, lecture lente | 2 Flash-Lite + 3.8 | provisoire 10,0 s (16 lignes, Confirmer gris), saisie gardée, « Fermer » à 19,2 s | 0,045 |
| 16:19:02 | doc14 rouvert | aucun | final en 2,7 s, « Lecture déjà disponible · aucun nouvel appel IA. » | 0 |
| 16:20:19 | doc10, 3 pages HT, essai 1 « TEST pilote » | 2 Flash-Lite + 3.8 | provisoire 12,3 s, final 41,1 s ; **la 3.8 coupée** (MAX_TOKENS, 5 085 sur 5 100, D325) ; indice HT, Confirmer accepté | 0,05 |
| 16:2x | traduireNoms (2 appels) | 3.8 | noms en français de l'essai 1 | 0,002 |
| 16:25:59 | lookupIngredient, article créé par l'essai 1 | 3.8 + recherche | fiche : EBC, PPG, source | 0,354 |

Essai 1 annulé par l'app à 16:28:15 (contre-écritures `VOID-…`), PDF du Drive à la corbeille non vidée (absent de son dossier, vérifié).
Le ticket de l'essai 2 (photo du téléphone, 8,1 Mo) a d'abord été refusé par l'app, « 4 Mo maximum », **sans appel** (D324).
Sous-total : environ **0,50 CHF**. Lectures en ligne : 20 sur 40. Cumul des appels payants : 13,393 + 0,50 ≈ **13,89 CHF sur 49**.
