# Revue du plan — voie port-total (01.11, nuit)

Deux relecteurs neufs (Sonnet) : Conception (`REVUE-conception.md`), Prêt à coder (`REVUE-pret.md`). Tri du pilote ci-dessous. Les
décisions qui en sortent sont écrites dans `VOIE.md` § « Décisions du pilote sur le plan » (D1 refait, règle du port) et dans `GATES.md`
(G3 avec `banc-lecture-k5`, G5 hors des deux erreurs connues de `qrLecture.ts`, portée). **PLAN.md est à réécrire en entier en A′ avant
la moindre ligne de code**, à partir de ce tri.

En bref, ce qui reste à ta voie : (1) des tests qui épinglent l'enregistrement d'une ligne `shipping` tel qu'il est (refus d'une action
de stock ou de matériel, entrée `shipping` sans référence ni mouvement, TVA inchangée) ; (2) le juge du banc qui écarte le port des deux
côtés, avec `comparerJugements` ; (3) le comptage des ports lus sous un autre genre ; (4) les vérités de doc5, doc8, doc9 ; (5) le rejeu
hors ligne avant/après ; (6) les deux lignes de GESTES.md. Aucune fonction du brouillon (`estPort`, `portDe`, `portEnregistre`) :
le critère de l'écran vit chez p3c-port, l'affichage d'une dépense enregistrée ira à la voie p3c-finances.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | `kind === 'shipping'` seul cache une ligne sans montant ou négative que la validation refuse ensuite : impasse (`purchaseEntry.ts:349`) | critère : `shipping`, montant valide ≥ 0, pas tout le document ; sinon rangée ordinaire | corrigée | règle écrite dans les deux VOIE.md ; le critère vit chez p3c-port (`lignesDePort`), qui le teste ; ta voie ne code plus de critère |
| 2 | majeur | aucun geste de retour pour une ligne classée port à tort | « dont port » ouvre les lignes, « Type d'achat » les en sort | corrigée | p3c-port décision 8 (écran) ; rien dans ta voie |
| 3 | majeur | PLAN.md non réécrit après D1 ; tests prévus sur `draft.port`, plafond « 35 hors port » faux | réécrire PLAN.md en A′ | corrigée | à faire avant le code (voir « En bref ») |
| 4 | majeur | P3 n'est pas un défaut : `validatePurchase` refuse déjà, le garde-fou serait inatteignable | pas de branche dans `savePurchase` ; tests qui épinglent, TEMOIN AVANT honnête | corrigée | D1 refait : `savePurchase` ne change pas |
| 5 | majeur | `portEnregistre` sans appelant (L11) | sortir de la voie | corrigée | ira à la voie p3c-finances (`TransactionDetails`, `PieceDejaSaisie`) |
| 6 | majeur | `portDe` : somme partielle, port 0,00, centimes | spécifier | corrigée | spécifié chez p3c-port (décision 7 : centimes entiers, 0,00 affiché, sans montant = rangée) |
| 7 | majeur | document réduit à son port : plus de garde-fou | une règle en un seul endroit | corrigée | « toutes les lignes ne sont pas du port » dans le critère (p3c-port) |
| 8 | majeur | (a) comptage des ports d'autre genre non planifié, et les vérités le perdent ; (b) port lu en `service` décale l'alignement du juge | (a) compter avant d'éditer ; (b) deux tests du juge (dernier, milieu) | corrigée | à écrire dans PLAN.md ; voir aussi Prêt 8 |
| 9 | détail | deux changements mêlés dans le rejeu (juge et vérités) | cellule de contrôle juge nouveau × vérités anciennes | corrigée | rejeu hors ligne, sans coût : à ajouter |
| 10 | détail | VOIE et GATES disaient « jamais une ligne de la dépense », contraire à D1 | préciser | corrigée | VOIE.md Objectif et GATES.md Scope corrigés par le pilote |
| 11 | détail | `portDe` typé sur `PurchaseDraft`, l'écran a `BrouillonLecture` | type minimal | corrigée | le critère est chez p3c-port, typé `{ id, kind, amount }` |
| 12 | détail | TVA du port non prouvée hors périmètre | test d'enregistrement : mêmes TTC, TVA, HT qu'avec un `service` | corrigée | à ajouter aux tests qui épinglent |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | PLAN.md décrit la conception abandonnée ; aucun test de la conception retenue | réécrire en A′, nouveau tableau de tests | corrigée | même correction que Conception 3 ; le tableau porte donnée, attendu, « échoue aujourd'hui parce que » ou « passe déjà (épingle) » |
| 2 | majeur | garde-fou d'écriture inatteignable ; refuser ou effacer à deviner | trancher | corrigée | (a) : le refus reste, `tests/unit/purchaseEntry.test.ts:40-42` inchangé, aucune branche ajoutée ; témoin de non-régression de `finance.lines` |
| 3 | majeur | `estPort`, `portDe`, `portEnregistre` sans appelant | nommer le consommateur ou retirer | corrigée | retirées de la voie (D1 refait) |
| 4 | majeur | `banc-lecture-qr.ts` et `banc-lecture-k5.test.ts` appellent `judgeResult`, hors G3 | les lister, rejouer k5 avant/après | corrigée | k5 entre au Possède (attente du port seulement) et à G3 ; vert sur HEAD (40 tests, rejoué par le pilote) ; un changement de verdict de `banc-lecture-qr.ts` est voulu, à dire |
| 5 | majeur | G5 `tsc` échoue sur HEAD (deux erreurs de `qrLecture.ts`, dépendances absentes) | base G5 = ces deux erreurs | corrigée | G5 réécrit : aucune autre erreur ; rejoué par le pilote sur HEAD → `TYPES OK` |
| 6 | majeur | rejeu : origine de la commande fausse, doc8 et doc9 absents du rejeu k5 | précondition et cellules attendues par pièce et variante | corrigée | à écrire dans PLAN.md (doc5 : variantes lues ; doc8 : A ; doc9 : A, Csv, Av), avec `--docs doc5,doc8,doc9` si besoin ; hors ligne seulement |
| 7 | majeur | « aucune pièce ne perd » sans chemins fautifs ; `comparerJugements` flou | l'exporter et le tester ; définir la perte | corrigée | `comparerJugements(avant, apres)` dans le juge, test dans `tests/unit/depense/port/port-banc-juge.test.ts` ; un chemin ajouté sur une cellule dont la lecture lit le port sous un autre genre est signalé à part ; comptes seulement dans RESULTAT.md |
| 8 | majeur | comptage des ports d'autre genre : source, critère, lieu non fixés | les fixer ; 0 est une réponse | corrigée | source : lectures des sorties prêtées contre les vérités d'avant (copies `.avant-port`) ; critère : ligne alignée sur la `shipping` de la vérité avec un autre `kind`, plus la liste fermée port, livraison, versand, fracht, porto, frais d'envoi sur les lignes non `shipping` ; script sous `os.tmpdir()` écrit par Write ; « 0 » avec la couverture |
| 9 | détail | D4 sur une prémisse fausse : `banc-lecture-facture.test.ts` n'a pas d'attente du port | corriger D4 | corrigée | Possède amendé (« s'il y en a une ; sinon non modifié ») |
| 10 | détail | citations imprécises (`storage.ts:536`, lignes de `purchaseEntry.ts`, chemin de `mouture-prix.test.ts`) | corriger | corrigée | à corriger dans PLAN.md, argument (a) compris : l'invariant joue à l'édition et au paiement |
| 11 | détail | harnais des tests d'enregistrement non nommé | le nommer | corrigée | reprendre les mocks de `tests/unit/purchaseEntry.test.ts:2-9` (ou `depense/enregistrement/paiement-prix.test.ts`) ; observer `adjustNumber` et l'écriture `movements` par leurs espions |
| 12 | détail | termes de G6 et phrases de GESTES.md | gabarit de RESULTAT.md ; remplacer les deux lignes | corrigée | titres de RESULTAT.md avec les quatre termes exacts ; les deux lignes de GESTES.md remplacées, pas complétées |
