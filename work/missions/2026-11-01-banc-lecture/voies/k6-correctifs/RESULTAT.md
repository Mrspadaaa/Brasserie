OK — D261b, D262a, D262c (contexte), D264a posés ; D261c et bandes non posés ; banc hors ligne sans perte

Voie k6-correctifs, mission 2026-11-01-banc-lecture. Aucun `GATES.md` n'existait dans le dossier de la voie : les critères sont les « Contrôles » de VOIE.md. Aucune valeur de ses pièces ni de ses données ici (fixtures inventées). Aucun appel Gemini, aucun commit, aucun déploiement.

## Fichiers écrits
- `functions/src/invoiceControls.ts` : `sumCheck`, un total multiple de 5 centimes égal à la somme arrondie au 5 centimes le plus proche (écart ≤ 2) est `ok` (D261b). Le client (`recomputeInvoicePoints` → `sumCheck`) importe la même fonction : une seule règle, rien à changer dans `invoicePoints.ts` ni `etat.ts`.
- `functions/src/invoiceVisionReview.ts` : boucle d'en-tête, `tvaAmount` valeur contre `null` quand la valeur vaut la somme du bloc de TVA de sa propre lecture : plus de `lectures-divergentes`, la valeur est gardée, sans `correctedFields` (sinon `invoiceFieldHints` aurait posé « Valeur corrigée… À confirmer » sur la TVA) (D262a).
- `src/services/purchasePrefill.ts` : `invoiceFieldHints` n'ajoute plus la remarque `tvaRate` du modèle (« plusieurs taux ») quand le bloc imprimé compte ≥ 2 taux et que `controls.vat` n'est pas en écart (D262a).
- `src/services/stockLineMatching.ts` : `contexteDe` : emballage, nettoyage, matériel, entretien, service, port, remise → « autre » ; un ingrédient resté « autre » prend le contexte du préfixe de référence (MA, HO, HE) (D262c).
- `src/services/purchaseEntry.ts` : `historicDuplicates` + `purchaseDuplicates` / `purchaseDuplicateReasons` (D264a, détail plus bas).
- `tests/unit/depense/banc-k6/` : `historique-d264a.test.ts` (neuf, 13 tests) ; les 4 autres fichiers mis à jour (tests « AUJOURD'HUI » des correctifs posés retirés ou remplacés, « ÉCHOUE aujourd'hui » renommés « Correctif posé »). `scripts/banc-lecture-facture.ts` : non touché par cette voie (le relevé `releveDivergences` lit les points de `reconcileInvoiceVision` : il suit le code posé sans changement, parité verte).
- ce RESULTAT.md.

## Critères
Toutes les commandes dans la copie isolée (`copie.mjs`).
- Rouge d'abord (HEAD) : `vitest run tests/unit/depense/banc-k6` → `12 failed | 23 passed` ; `historique-d264a` seul → `6 failed | 7 passed` (les 7 verts sont les non-régressions).
- `npx tsc --noEmit -p .` → `TSC-ROOT-OK` ; `cd functions && npx tsc --noEmit -p .` → `TSC-FUNCTIONS-OK`.
- La liste complète de VOIE.md (dont `tests/unit/depense` entier) : `Test Files 95 passed (95)`, `Tests 1747 passed | 3 skipped | 1 todo`. Aucun rouge.
- Tests couvrant les fichiers touchés (les tests de `functions/` vivent dans `tests/`, `grep` fait) : `invoiceReview`, `invoiceVisionReview`, `invoiceScanCore`, `invoiceScanCsv8`, `invoiceScanBudget`, `invoiceScanMontantSeul`, `invoiceScanTransport`, `geminiModelRouting`, `financeArchiveContinuity`, `tests/unit/stock*`, `tests/unit/ingredient*` → `Test Files 11 passed`, `Tests 327 passed`.
- Les 3 `skipped` sont les tests de contrat D261c (voir plus bas) ; le `todo` est celui des bandes neuves. Rien d'autre n'est suspendu.

## Ce qui est posé, et ce qui ne l'est pas
- **D261b posé.** Les non-régressions tiennent : 1 centime d'écart sur un total non multiple de 5, un multiple de 5 qui n'est pas l'arrondi (7 centimes) et un arrondi dans le mauvais sens (3 centimes) restent des `somme-ecart` bloquants. Aucune mention « arrondi » ajoutée (statut `ok`, comme demandé).
- **D262a posé (deux correctifs).** Un vrai écart reste un désaccord : test vert dans les deux ordres (valeur ≠ somme du bloc contre `null`).
- **D262c posé pour `contexteDe` seul.** `groupes.ts` et `ExpenseSheet.tsx` non touchés. Test des bandes neuves : `it.todo` (« bandes sucre, matériel, emballage… choix de dessin du brasseur, en attente », L24). Tests de contexte pour chaque ligne de la pièce imitée (levure, malt sans mot « malt », houblon, le reste « autre ») verts.
- **D264a posé.** `duplicateMatch` n'est pas modifié (il ne sait lire qu'une transaction à la fois) ; une fonction `historicDuplicates` regarde la liste. Forme retenue des écritures historiques (déduite de l'AUDIT : aucun code d'import `B-…` n'existe dans le dépôt, `grep` vide) : id `<lettres>-<chiffres>`, pas de `finance`, `description` qui commence par la référence d'article, `amountTTC`, `date` JJ.MM.AAAA, catégorie ≠ apports/recettes. Une pièce = les écritures de même série et de même date. Signalée quand : somme des écritures = total du brouillon à 5 centimes près (arrondi), références en commun (au moins la moitié du plus petit jeu), dates à 14 jours au plus. Une entrée par pièce (sa première écriture), motif « Même total et mêmes références qu'un achat déjà au registre / N écritures historiques (B-001 à B-0NN) / n références d'article en commun / jours d'écart ». `validatePurchase` bloque comme pour tout doublon (`duplicateConfirmed` le lève). Aucun schéma, aucune donnée touchés.
- **D261c non posé** (consigne). Les 3 tests de contrat sont en `it.skip` avec leur corps (à rallumer avec le correctif) ; les 3 tests « AUJOURD'HUI » qui décrivent la cause sur le code actuel restent verts. Le correctif de `SOFT_KINDS`, du nom et de l'ancre n'est pas écrit.

## Banc, sans appel (étape 7)
Commandes : `--hors-ligne --reprendre …/banc-k6-AC --variantes A,Csv8 --normaliser --repeat 1 --cas cas.json…cas-5.json` puis `banc-lecture-facture-juger.ts` ; sortie `%TEMP%/banc-k6-apres` (hors Git). Deux détails de lancement : les `--cas` sont lus depuis le dossier courant de la copie, donc passés en chemins absolus ; le juge relit ces mêmes fichiers `cas*.json` que j'ai copiés dans la copie isolée (`%TEMP%/qr-app-copie/work/…/H13-reels/`), jamais dans le dépôt.

| Avant (`banc-k6-jug`) | A | C★v8 |
|---|---|---|
| Parcours lus (échecs) | 13 (1) | 14 (0) |
| Champs justes / jugés | 140 / 153 | 153 / 165 |
| Lignes justes / jugées | 182 / 188 | 217 / 224 |
| Faux verts | 0 | 1 |
| Alertes justes / inutiles | 9 / 3 | 7 / 4 |
| Verts justes | 1 | 2 |

| Après (`banc-k6-apres`) | A | C★v8 |
|---|---|---|
| Parcours lus (échecs) | 13 (1) | 14 (0) |
| Champs justes / jugés | 140 / 153 | 153 / 165 |
| Lignes justes / jugées | 182 / 188 | 217 / 224 |
| Faux verts | 0 | 1 |
| Alertes justes / inutiles | 9 / 3 | 7 / 4 |
| Verts justes | 1 | 2 |

Les colonnes « + N » sont identiques aux colonnes sans N, avant et après. Durées, appels et coûts identiques. Le seul écart du `diff` des deux `RESULTAT-BANC.md` : la liste des codes de points de C★v8 perd un `somme-ecart ×1` (le D261b : une somme arrondie n'est plus un écart). Aucun champ ni ligne juste de moins, aucun faux vert de plus. Le faux vert de C★v8 existait avant et n'est pas lié à ces correctifs.

## Essais utilisés
D261b 1, D262a 1 (une première rédaction poussait `correctedFields`, ce qui aurait posé « Valeur corrigée » sur la TVA : retirée avant le test), D262c 1, D264a 2 (deux erreurs de mes tests : un brouillon recréé entre deux appels, et un jour d'écart qui reste la même pièce par conception). Banc : 3 lancements (chemins des `cas`, puis du juge).

## Doutes et limites
- D264a, la forme exacte des écritures `B-…` n'est connue que par l'AUDIT et par DEFAUTS (libellé « commence par la référence »). Si leur libellé place la référence ailleurs qu'en premier mot, la règle ne reconnaît rien (échec silencieux, pas de faux doublon). À vérifier une fois en lecture seule sur la production, sur la forme du libellé seulement.
- D264a ne compare pas le fournisseur (ces écritures n'en ont pas) : la preuve est total + références + date, jamais le total seul. Une autre commande de la même série le même jour fausse la somme : rien n'est signalé (test).
- D264a : le motif d'une pièce historique est relié au brouillon par une table faible (`WeakMap`) remplie par `purchaseDuplicates` ; `ExpenseSheet` appelle déjà les deux avec le même brouillon dans le même rendu. Un autre brouillon n'hérite pas d'un motif périmé (test). `ExpenseSheet` n'a pas été touché ni joué dans Chrome : la ligne « déjà enregistré » d'une écriture sans `finance` (ce qu'elle affiche pour une transaction sans fournisseur ni lignes) n'a pas été vue en rendu.
- D262c : le repli sur le préfixe MA/HO/HE reste la convention d'un seul fournisseur ; il ne joue que pour un ingrédient sans mot de famille ni catégorie lue. `contexteDe` sert aussi à l'article neuf et au rapprochement du stock : tests verts, mais l'effet sur d'autres fournisseurs n'est pas mesuré.
- D262a : la lecture réelle de sa pièce n'a pas été revue ; l'effet sur sa tuile ④ se juge au prochain passage de la pièce au banc (le relevé `divergences` n'y montre plus `tvaAmount` si c'est bien la cause).
- Rien joué dans Chrome (aucune interface écrite).

## git status (L17)
Fichiers à moi : `functions/src/invoiceControls.ts`, `functions/src/invoiceVisionReview.ts`, `src/services/purchasePrefill.ts`, `src/services/stockLineMatching.ts`, `src/services/purchaseEntry.ts`, `tests/unit/depense/banc-k6/` (neuf, non suivi), ce dossier. `scripts/banc-lecture-facture.ts` : modifié par la voie k6-diagnostic, pas par celle-ci. Autres lignes de `git status` (hooks, manifeste, GATES d'essai, GESTES.md, journal-gemini, décisions, DEFAUTS, hopSources, rénovation, e-reel, p3c-port…) : à d'autres voies ou au pilote, non touchées.

DÉCISION À PRENDRE : D261c, jusqu'où exempter la divergence de `kind` de la 3e lecture (options A, B, C du diagnostic). Rien n'est posé. Recommandation inchangée : C (mesurer d'abord au banc avec le relevé, la pièce doc14), puis A ; les 3 tests de contrat sont prêts en `it.skip`.
DÉCISION À PRENDRE : D262c, trois bandes de plus (sucre, matériel de brassage, emballage) : à montrer en variantes au brasseur (L24) avant de toucher `groupes.ts` et `ExpenseSheet.tsx`. Le contexte est corrigé sans dessin ; l'écran garde ses 4 bandes.

CONNAISSANCE : `sumCheck` est la seule règle de somme (serveur et client) : un correctif d'arrondi s'y pose une fois. Les écritures historiques `B-…` n'ont ni `finance` ni fournisseur : un rapprochement ne peut s'appuyer que sur total de série, références du libellé et date.
LEÇON PROPOSÉE : aucune
