OK — Modifier = m5mo-c porté : montant payé modifiable, plan de correction testé ; captures à faire (DEMANDE EXECUTANT)

## Plan (fait)
1. Domaine pur `planCorrection` + `effetCorrection` + `verrouMontant` + `erreurNouveauMontant` (centimes, aucune horloge).
2. Exécution par les services existants (`executerPlan` : contre-paiement, `updateTransaction`, paiement), dans l'ordre des règles Firestore.
3. Écran m5mo-c : `EditTransactionModal` réécrit (pièce en tête, champs de m2mo-a, choix du paiement, aperçu avant / après, Drive en mots).
4. Tests Vitest (unit + parcours réel en `?dev-local`), typage.
5. Captures : à faire par l'exécutant (section ci-dessous). Non faites par moi : plafond de contexte.

## Fichiers écrits
- `src/domain/finance/correctionMontant.ts` (nouveau)
- `src/components/EditTransactionModal.tsx` (réécrit)
- `src/ui/finance/modifier/ApercuRangee.tsx`, `executerCorrection.ts`, `modifier.css` (nouveaux)
- `tests/unit/correctionMontant.test.ts` (27 tests), `tests/integration/modifierMontant.test.tsx` (7 tests)
- `work/missions/2026-11-14-finances/voies/q4/tests.txt`, ce RESULTAT.md

## Critères
- G1 : `VITEST OK` (34 tests passés). Note : `tests.txt` doit être produit avec `NO_COLOR=1` (sans cela, les codes couleur cassent la regex de `vitest-lu.mjs` et il rend ECHEC alors que 34/34 passent). Commande : `NO_COLOR=1 npx vitest run tests/unit/correctionMontant.test.ts tests/integration/modifierMontant.test.tsx --reporter=dot > work/missions/2026-11-14-finances/voies/q4/tests.txt`.
- G2 : `tsc --noEmit` hors `functions/` : aucune erreur (au dernier passage). `tsc.mjs` rend « TSC ECHEC » à cause des seules erreurs de `functions/` (`firebase-admin/firestore` absent du worktree, déjà connu : ROUGES.md de f2). Pas de défaut de typage dans mes fichiers.
- Essais : 2 (un test d'erreur dupliquée corrigé ; un `tests.txt` recoloré).

## Ce qui est porté de m5mo-c
Pièce en tête (zone pointillée « Pas encore de pièce » + « Photo du ticket » / « Fichier ou PDF » ; avec pièce : vignette, Remplacer, Retirer) ; Nom ; Catégorie (carré v6a) et Précision ; Date ; Montant (champ libre, `inputmode="decimal"`, ancien montant barré à côté du libellé) ; segment « Le paiement suit · payé X » / « Reste à payer · payé X · reste Y » ; aperçu « Dans Opérations » avant (barrée, pâle) / après (hachure « reste 3,50 ») ; Fournisseur, n° de pièce ; « Drive · Novembre › Nettoyage » + « Copier le lien » ; Annuler / Enregistrer. TVA (select + total) seulement si assujetti ; « Quittance PDF » pour une vente.
- Défauts du critique : (2) hachure du « reste » : même hachure que la liste, à vérifier en plein format ; (3) gris pâle : « avant / après » et « Dans Opérations » prennent le texte 200 du thème (plus lisible). (1) « une seule rangée après » : NON suivi, il contredit la maquette (avant / après est son centre, et le brasseur : « Là au moins je vois ce que ça change »).

## Règle du domaine (décision du pilote, appliquée)
Verrou seulement si l'année de la pièce est close (une clôture existe), archivée, ou la pièce annulée ; il dit pourquoi en une ligne. Deux ajouts que je décris : (a) un avoir (borné par sa facture) ; (b) une pièce à plusieurs lignes (le total est la somme des lignes : le changer casserait `validateFinanceTransaction`). Une pièce à une seule ligne : la ligne suit le nouveau total.

## Choix de défaut (écarts à dire)
- Hausse : « Reste à payer » par défaut (aucun paiement inventé, c'est la maquette). Baisse : « Le paiement suit ».
- Le choix n'apparaît que pour une pièce entièrement réglée (rien ne « suit » sur une pièce partielle ou ouverte) ; l'aperçu, lui, se montre toujours quand le montant change.
- Baisse sous le payé + « Reste à payer » : contre-paiement(s) puis montant seul, payé retombe (libellé honnête : « payé 0,00 · reste 40,00 »).
- Plusieurs paiements : on inverse du plus récent au plus ancien, juste ce qu'il faut.
- La pièce vivante est relue avant chaque étape (le solde réglé vient d'être changé ; une copie ancienne ferait refuser l'écriture par les règles).
- Validation de la pièce (`validateFinanceTransaction`) avant la première écriture ; une étape qui échoue arrête la suite et l'erreur dit ce qui est déjà écrit.
- Titre « Modifier l'écriture comptable » et identifiant retirés (m2mo-a) ; émojis des catégories remplacés par les libellés de `CATEGORY_LABELS`.
- « Copier le lien » copie le chemin Drive complet (pas d'URL de dossier connue).

## Tests d'autres voies que ce changement rend obsolètes (hors Possède, à mettre à jour par le pilote)
- `tests/integration/editTransactionBe66.test.tsx` : 2 tests (« TVA et total à la virgule » : lit `0,00 CHF` / `23,80 CHF` ; « Dossier Google Drive » : libellé remplacé par « Drive · mois › catégorie » de la maquette). Le test de date (`05.11.2026`) passe.
- `tests/integration/liveDataViews.test.tsx` ligne 136 : lit `216,20 CHF` (résumé TTC, absent de la maquette hors assujettissement TVA). Le reste du test (enregistrement) n'est pas atteint.
Ces trois assertions décrivent l'ancien écran ; la maquette choisie les retire (règle n° 1).

## DEMANDE EXECUTANT :
Commandes, dans l'ordre (banc `http://localhost:3000/?dev-local&finance-demo`, déjà lancé ; ne pas relancer) :
1. Ouvrir Finances > Opérations, toucher une opération payée (ex. une dépense « payé ») puis « Modifier » ; ouvrir aussi une opération « + pièce » sans justificatif.
2. Pour chacune des 4 combinaisons 390 clair, 390 cave, 1280 clair, 1280 cave : capture (a) feuille ouverte, montant inchangé ; (b) montant changé (ex. +3,50) avec le segment « Reste à payer » choisi et l'aperçu avant / après visible ; (c) après « Enregistrer », la liste Opérations montrant la rangée avec « payé X » + « reste Y » hachuré. Rejouer aussi une baisse (« Le paiement suit ») une fois en 390 clair.
3. Captures dans `work/missions/2026-11-14-finances/voies/q4/cap/` : `mod-390-clair-ouvert.png`, `mod-390-clair-change.png`, `mod-390-clair-apres.png`, idem `390-cave`, `1280-clair`, `1280-cave`, plus `mod-390-clair-baisse.png`. Une capture côte à côte avec `work/missions/2026-11-14-finances/voies/m5/m5mo-c/m5mo-c.png` en 390 clair : `cap/cote-a-cote-390-clair.png`.
4. Ouvrir chaque capture. Relever, par numéro : débordement, hachure du « reste » illisible, cible < 44 px, gris trop pâle, écart de mots/ordre avec la maquette, thème cave cassé (fond du champ, bouton noir/blanc inversé). Ne rien corriger : rendre la liste au pilote.
Sorties attendues : 15 captures ouvertes ; liste numérotée des défauts ou « 0 défaut ».

## Doutes et limites
- Aucune capture ouverte par moi : le rendu est NON validé visuellement (L12). Jamais déclaré fini sans la DEMANDE EXECUTANT ci-dessus.
- Parcours sur `?dev-local` en test (services réels, Dexie/Firestore locaux) ; les règles Firestore ne sont pas jouées (émulateur non lancé) : les étapes respectent leurs invariants (solde ≤ montant, `CONTRE-<id>` identique, seule la paire `settlementBalanceCents` / `lastPaymentId` change à la création d'un paiement), mais jeu en ligne « ZZ TEST » à faire.
- Non atomique : trois écritures successives ; une coupure au milieu laisse une pièce à l'état intermédiaire (dit dans l'erreur).
- Mode d'un nouveau paiement = celui du dernier paiement (« banque » sans paiement) ; date = aujourd'hui.
- Contre-paiement daté du paiement d'origine (convention de la fiche) ; le complément daté d'aujourd'hui.

DÉCISION À PRENDRE : verrou des pièces à plusieurs lignes et des avoirs. Options : (A) verrou expliqué, comme livré (prudent, réversible) ; (B) autoriser et répartir le delta sur la dernière ligne ; (C) ouvrir les lignes à l'édition. Recommandation : A pour ce lot, C plus tard dans la fiche (m5fo-a).

CONNAISSANCE : une correction de montant sur pièce payée doit relire la pièce vivante entre deux étapes (le solde réglé change à chaque paiement) ; une copie du formulaire casse la règle `unchangedPaymentGuard`.
LEÇON PROPOSÉE : un outil qui lit la sortie colorée d'un test (`vitest-lu.mjs`) exige `NO_COLOR=1` dans la ligne de commande du brief.
