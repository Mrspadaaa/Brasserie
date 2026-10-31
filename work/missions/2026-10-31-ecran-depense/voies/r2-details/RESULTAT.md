OK — détails 3 à 6 prouvés par mutation, détail 7 corrigé (fichier figé dès qu'il est sûrement parti, relecture traitée), 866 tests verts. G3 et G4 : voir limite.

## TEMOIN AVANT
- HEAD `86a8b698` : G5 (commande de GATES.md) = `Test Files 39 passed`, `Tests 850 passed` (rejeu du pilote) ; `tests/unit/depense/raccord` = 4 fichiers, 63 verts avant mon travail.
- Détails 3 à 6 : **déjà dans HEAD** (commit `0ec04f8f`, corrections de la relecture de r1). Le plan l'a constaté dans le code avant d'écrire une ligne ; rien n'a été réécrit. Leur « témoin avant » est la mutation qui retire la correction : le test devient rouge.
- Détail 7, avant la garde : `changer-fichier.test.tsx` 6 rouges sur 9 (`Unable to find role="alert"` : `attach()` vidait l'erreur, lançait un second scan et remettait le reçu à zéro), 3 verts (témoins). `autre-original.test.ts` (service) : 2 verts dès le départ (le service tenait déjà).

## Détail 3 — `stockQuantityFor` suit l'appariement (`SACHET_MAX_G`) — prouvé, déjà dans HEAD
`purchaseEntry.ts:221-226` : poids des deux côtés différents → refus ; ligne sans poids face à un article au poids connu → refus (plus strict que « > SACHET_MAX_G ») ; ligne avec poids face à un article sans poids → refus si > `SACHET_MAX_G` (importé de `stockLineMatching`, jamais recopié). Mutation (une à la fois, `try/finally`, copie juste avant, remise octet à octet vérifiée : OUI) :
- M1 `else if (!lineWeight && itemWeight) return` → `else if (false) return` : `unites-enregistrement` 1 rouge, « n° 3 : une ligne sans poids face à un article au poids connu : refus » (22:06:35).
- M2 `if (grams>SACHET_MAX_G)` → `if (false)` : 1 rouge, « poids du libellé : « Safale US-05 500 g » 2 Stk refusé… » (22:06:36).
- M3 retirer `MULTIPLIER.test(label) || ` : 1 rouge, « n° 2 : conditionnement multiple (« 10 x 11,5 g »…) » (22:06:37).
- M4 `measures>(lineWeight?1:0)` → `false` : 2 rouges, « n° 1 : une mesure en kg… » et « le refus empêche toute écriture » (22:06:38).

## Détail 4 — `PROOF_IN_PROGRESS_ATTACH` (« Rattacher le justificatif ») — prouvé, déjà dans HEAD
`rattachement-en-cours.test.ts` appelle le vrai `attachProofToPurchase` avec `drive/in-progress` : le message contient « Rattacher le justificatif », jamais « Confirmer et enregistrer », code gardé ; témoin : l'achat garde son texte.
- M5 : au rattachement `PROOF_IN_PROGRESS_ATTACH` → `PROOF_IN_PROGRESS` : 1 rouge, ce test (22:06:39).

## Détail 5 — témoins R1, R1b, R3 prouvés par mutation (`ExpenseSheet.tsx`, remis octet à octet)
- M6 retirer `unitPrice:result.currency==='CHF'?(item.price??undefined):undefined,` (`:169`, la lecture) : 3 rouges, R1, R1b, « retaper la MÊME unité » (22:06:43).
- M7 retirer le spread `...(value.unit!==undefined&&value.unit!==line.unit?{unitPrice:undefined}:{})` (`updateLine`, `:104`) : 1 rouge, R1b (22:06:46).
- M8 `:180` `...applyScannedPayment(previous,result,swissToday())` → `...scannedPayment(result,swissToday())` (+ import temporaire) : 1 rouge, R3 « date de paiement tapée » (22:06:49).
- Le témoin R3 « date supposée remplacée » est vert avant et après r1 : il était rouge sur l'ancien code par le harnais (mock sans export), pas par le comportement ; la preuve du comportement est M8.
- Exception du Possède (notée) : mutations temporaires de `ExpenseSheet.tsx` aux lignes 104, 169 et 180 (la 169 en plus des deux autorisées, même nature) ; chaque remise comparée octet à octet : OUI ; `diff` du fichier après les 12 mutations = seulement la garde du détail 7.

## Détail 6 — branche `isConfirmedWriteRejection` — prouvé, déjà dans HEAD
`ecran-recu.test.tsx` « rejet confirmé de la dépense » : `confirmPurchase` rejeté avec `{status:'rejected'}` → alerte, plus de « Justificatif rangé », le pied redit « sera rangé », le clic suivant rappelle `savePurchaseWithProofReceipt` (2 appels), `onSaved` reçoit le reçu.
- M9a retirer `setReceipt(undefined)` (`:195`, nouveau n° de ligne après D7 : même instruction) : 1 rouge (22:06:52).
- M9b retirer `setPendingId(null)` : 1 rouge (22:06:54).

## Détail 7 — `pendingId` / « Changer » : corrigé (décision du pilote)
Avant : le bouton « Changer » était déjà désactivé tant que `pendingId` était posé, mais `attach()` n'avait aucune garde et reste atteignable (champ fichier caché, caméra, dépôt du port à venir). Un second fichier aurait remis le reçu à zéro (pied « sera rangé »), changé `documentHash` (la confirmation ne pouvait plus jamais aboutir) et n'aurait jamais été envoyé (`save()` saute l'envoi).
Choix : **refuser**, pas remettre `pendingId` à zéro (qui rappellerait le service avec le même `submissionId` : retour anticipé sans envoi, ou seconde dépense). Code (`ExpenseSheet.tsx`, `attach()`, `save()`, `pendingId` seulement) : deux références `pendingRef` (suit `setPendingId`, remise à faux au rejet confirmé) et `proofSent` (posée au départ de l'envoi si le brouillon porte un justificatif, jamais remise à faux : le `submissionId` n'est pas renouvelé). Deux textes, par `setError`, aucun élément neuf :
- `pendingRef` : « L’enregistrement attend sa confirmation : le fichier ne peut plus être changé. Touche « Vérifier la synchronisation ». » ;
- sinon `proofSent` : « Ce fichier est déjà parti pour cette saisie. Pour en joindre un autre, ferme et rouvre : rien n’a été enregistré. »
Le fichier refusé n'est ni lu, ni scanné, ni posé. Tests (`changer-fichier.test.tsx`, 9, tous verts après la garde) : deux échecs de confirmation de suite avec un refus entre les deux, puis succès (un seul appel à `savePurchaseWithProofReceipt`, trois `confirmPurchase` avec l'empreinte du premier fichier, `onSaved` avec son reçu, second fichier de contenu et d'empreinte différents) ; entrée caméra ; zone de dépôt et « Joindre » absents ; rejet confirmé → second texte ; `drive/in-progress` → second texte ; échec réseau avant envoi → second texte ; sans justificatif : texte 1 sans « rouvre » ni « déjà parti » ; sans enregistrement tenté un fichier s'ajoute ; témoin : « Changer » fonctionne avant tout enregistrement. Service (`autre-original.test.ts`, 2) : un second fichier refusé par Drive (`otherOriginal`) n'écrit rien (ni dépense, ni mouvement, ni ajustement).
- (Remplacé par « Corrections après la relecture » plus bas : `proofSent` ne se pose plus avant l'appel.) Premier jeu : M10 retirer la pose de `proofSent` : 3 rouges (22:08:46). M11 désactiver la garde `pendingRef` : 3 rouges (22:08:52). Remise : OUI.

## Critères
- G1 `COMPRIS OK (3 doutes)` ; G2 `REVUE OK` (pilote, 0 bloquant, tout « corrigée ») ; G5 `Test Files 41 passed (41)`, `Tests 861 passed (861)`, `TESTS DETAILS OK` (commande de GATES.md, `equipmentProjects` compris).
- G3 : `npm run build` s'arrête à son `tsc` sur des fichiers d'autres voies (voir limite) ; `npx vite build` seul (sortie hors dépôt) : `✓ built in 25.50s`.
- G4 : `npx tsc --noEmit -p .` donne 2 erreurs, aucune dans mes fichiers : `src/domain/fermentables/typicite.ts(78)` (`typicite-styles.json` absent, voie en cours) et `src/pages/BrewWizard.tsx(2342-2344)` (port en cours). Aucune erreur dans `ExpenseSheet.tsx`, `purchaseEntry.ts` ni les tests de `raccord`. Je ne peux pas écrire `TYPES OK` tant que ces deux voies ne sont pas finies : à rejouer par le pilote.

## Fichiers écrits
`src/ui/finance/ExpenseSheet.tsx` (la garde : 7 lignes ajoutées, 3 modifiées), `tests/unit/depense/raccord/changer-fichier.test.tsx`, `tests/unit/depense/raccord/autre-original.test.ts`, `work/missions/2026-10-31-ecran-depense/voies/r2-details/{COMPRIS.md, PLAN.md, RESULTAT.md, tsconfig.mes-fichiers.json}`. Script de mutation hors dépôt (`scratchpad/mutate.mjs`). `purchaseEntry.ts` et `stockLineMatching.ts` : inchangés.

## Rien ne se perd
Aucun champ de document Firestore ajouté ni retiré ; la garde est un état d'écran. Les 850 tests d'avant restent verts (861 avec les 11 nouveaux). Une dépense enregistrée avant reste lisible. Aucune mutation ne reste dans l'arbre (`diff` octet à octet après chacune). Aucun Drive ni Gemini réel, aucun commit.

## Doutes et limites
- (LEVÉE par la relecture n° 1, voir plus bas : le texte ne s'affiche plus dans ces cas.) Le second texte (« déjà parti ») s'affichait aussi après un échec réseau avant tout envoi (`unavailable`) ou une erreur du service avant l'envoi (validation) : l'écran ne les distingue pas (`proofSent` est posée au départ, comme tranché). Refus par prudence, jamais une écriture ; le brasseur doit fermer et rouvrir pour joindre un autre fichier. Si on veut relâcher ce cas, il faut un signal du service.
- Le fichier laissé dans le Drive après un rejet confirmé ou un envoi long reste là (limite notée, `submissionId` non renouvelé dans cette voie).
- jsdom seulement : une garde et un texte d'erreur, pas de nouveau rendu ; aucune capture ni parcours Chrome (l'interface n'a pas de nouvel élément). Les textes sont à relire par le pilote.
- Le contrôleur `comprendre` ne lit pas `tests/integration/expenseSheet.test.tsx` dans le Possède : non modifié, vert.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `attach()` de `ExpenseSheet` refuse un autre fichier dès qu'un justificatif est sûrement parti sous un `submissionId` (retour de `savePurchaseWithProofReceipt`, `drive/in-progress`, rattachement abouti ou en cours : `proofSent`, `proofAttached`) ou que la dépense attend sa confirmation (`pendingRef`). Si le premier original est déjà confirmé dans Drive, Drive refuse un autre original sous le même identifiant (`otherOriginal`, `financeDocuments.ts:104,109`) ; `autre-original.test.ts` prouve seulement que `purchaseEntry` n'écrit rien en local quand Drive refuse, pas que Drive refuse. Après un échec avant l'envoi (`drive/auth-required`, réseau, prévol), rien n'est parti et le changement de fichier reste permis.

## Corrections après la relecture (RELECTURE.md : 0 bloquant, 1 majeur, 3 détails, tout « corrigée »)
- **n° 1 (majeur)** : `proofSent` ne se pose plus avant l'appel. Elle se pose (a) au retour de `savePurchaseWithProofReceipt` (justificatif confirmé dans Drive), (b) sur `drive/in-progress` à l'enregistrement. Après `drive/auth-required`, un échec réseau (`unavailable`) ou un prévol refusé (« Ce justificatif est déjà enregistré »), le changement de fichier est permis, sans aucun texte de refus (le second scan a lieu). Test `it.each` de 3 cas dans `changer-fichier.test.tsx`. Mutation M12 (remettre la pose avant l'appel) : 3 rouges (22:21:54) ; M10 (retirer la pose au retour) : 1 rouge, « rejet confirmé » (22:21:49).
- **n° 2** : `attachToExisting` arme la même garde : `drive/in-progress` → `proofSent` (même second texte, vrai : rien n'est rattaché) ; rattachement abouti → `proofAttached`, un troisième texte vrai (« Le justificatif est déjà rattaché à cette dépense : le fichier ne peut plus être changé. »), car « rien n'a été enregistré » aurait été faux après un succès. Tests : un cas par chemin. Mutations M13 (retirer `proofSent` au rattachement) 1 rouge (22:22:01), M14 (retirer `proofAttached`) 1 rouge (22:22:04).
- **n° 3** : CONNAISSANCE reformulée (ci-dessus) ; `autre-original.test.ts` n'est présenté que comme preuve de l'absence d'écriture locale.
- **n° 4** : `confirmPurchase` rejeté avec `code:'unavailable'` → texte d'attente `WAITING`, ni « rouvre » ni « déjà parti » ; « Vérifier la synchronisation » cliqué ensuite aboutit, `savePurchaseWithProofReceipt` appelé une seule fois.
- Remises octet à octet : OUI pour les quatre mutations. G5 rejoué : `Test Files 41 passed (41)`, `Tests 866 passed (866)`, `TESTS DETAILS OK` ; `changer-fichier.test.tsx` = 14 tests ; `tsc` ne signale rien dans `ExpenseSheet.tsx`, `purchaseEntry.ts` ni `raccord/` (les 2 erreurs de G4 restent celles des voies Malts). G3 et G4 : le pilote les rejoue quand ces voies auront fini.
LEÇON PROPOSÉE : avant de coder une voie « à corriger », relire le code de HEAD contre la relecture citée : trois détails sur cinq étaient déjà corrigés et testés ; la preuve utile était la mutation, pas un nouveau code.
