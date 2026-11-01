# Plan : voie r2-details (détails 3 à 7 de la relecture de r1)

Rédigé avant tout code. Base : HEAD `ba7310a4` (r1 commitée en `0ec04f8f`). Aucun fichier du dépôt n'est modifié par ce temps du plan.
Témoin de départ : `npx vitest run tests/unit/depense/raccord` = `Test Files 4 passed (4)`, `Tests 63 passed (63)` (rejoué avant d'écrire ce plan).

## 0. Constat qui change la forme de la voie (lu dans le code, pas dans le résumé)

La consigne décrit les détails 3 à 6 comme à corriger. Or `RELECTURE.md` (r1) date d'avant les « corrections de la relecture » de r1, et ces
corrections sont **déjà dans HEAD** (`0ec04f8f`). Vérifié ligne à ligne :

| n | État dans HEAD | Preuve |
|---|---|---|
| 3 | **fait** | `purchaseEntry.ts:221-226` : poids des deux côtés différents → refus ; ligne sans poids face à un article au poids connu → refus (`:222`, plus strict que « > SACHET_MAX_G » demandé) ; ligne avec poids face à un article sans poids → refus si > `SACHET_MAX_G` (importé de `stockLineMatching`, `:11`). Test : `unites-enregistrement.test.ts:187-188` (« Safale US-05 » face à « … 500 g »). |
| 4 | **fait** | `PROOF_IN_PROGRESS_ATTACH` (`purchaseEntry.ts:332`), lu par `attachProofToPurchase` (`:360`). Test sur le vrai code : `rattachement-en-cours.test.ts:22-33` (contient « Rattacher le justificatif », jamais « Confirmer et enregistrer », code `drive/in-progress` ; témoin : l'achat garde son texte). |
| 5 | **fait en mutation, à rejouer et à consigner** | RESULTAT de r1 cite des mutations faites hors dépôt ; la consigne de r2 demande que la preuve soit dans RESULTAT.md **de r2**. |
| 6 | **fait** | `ExpenseSheet.tsx:195` (`isConfirmedWriteRejection` → `setPendingId(null)`, `setReceipt(undefined)`). Test : `ecran-recu.test.tsx:89-101` (alerte, plus de « Justificatif rangé », pied « sera rangé », clic suivant = 2e appel de `savePurchaseWithProofReceipt`). |
| 7 | **à faire** | voir § 2 : le bouton « Changer » est déjà `disabled` tant que `pendingId` est posé (`ExpenseSheet.tsx:242,256,258`), mais `attach()` (`:149`) n'a aucune garde et reste atteignable par les deux `<input type=file>` cachés (`:240-241`) et le dépôt (`onDrop`, `:247`). Aucun test ne le couvre. |

Conséquence : la voie ne réécrit pas 3, 4, 6 (elle les prouve encore, en les rejouant et en les citant), elle **rejoue les mutations du 5** et **corrige le 7**.
Un test qui « échoue d'abord » n'existe que pour le 7 ; pour les autres, le témoin AVANT est la mutation qui retire la correction (le test devient rouge),
ce qui prouve que le test mesure bien le comportement, pas une structure.

## 1. Défauts visés

| Id | Défaut | Où | Cause |
|---|---|---|---|
| D3 | `stockQuantityFor` plus laxiste que l'appariement | `purchaseEntry.ts:198-231` | (corrigé dans HEAD) à prouver par mutation |
| D4 | texte « en cours » du rattachement non prouvé sur le vrai code | `purchaseEntry.ts:332,360` | (corrigé dans HEAD) à prouver par mutation |
| D5 | témoins R1, R1b, R3 rouges pour la mauvaise raison (harnais) | `r1-raccord/r1-rouge.txt` | prouver par mutation, consigner |
| D6 | branche « rejet confirmé » | `ExpenseSheet.tsx:195` | (corrigé dans HEAD) à prouver par mutation |
| D7 | un fichier changé pendant une confirmation en attente | `ExpenseSheet.tsx:149` `attach()` | **aucune garde** : le nouveau fichier remplace `proofDataUrl`, `documentHash` et `receipt` alors que `pendingId` reste |

### Pourquoi D7 est un vrai défaut (pas seulement un texte faux)
Après un premier `save()` dont `confirmPurchase` n'a pas abouti, la dépense est déjà écrite localement avec le **premier** fichier
(`savePurchase` a lu `confirmedProofs` et posé `sourceDocumentHash` du brouillon). Si `attach()` accepte un second fichier :
1. `patch({proofDataUrl, proofFileName, documentHash})` change l'empreinte du brouillon ;
2. `confirmPurchase(draft)` attend un document dont `tx.finance.sourceDocumentHash === draft.documentHash` (`purchaseEntry.ts:379`) : il n'existera jamais, la
   confirmation échoue pour toujours (« L'enregistrement reste à confirmer ») ;
3. `save()` saute l'envoi (`if(!pendingId)`, `:192`), donc le **nouveau fichier n'est jamais envoyé** alors que le pied dit « sera rangé dans ton Drive privé
   à l'enregistrement » (`:308`, `receipt` remis à `undefined` par `attach()`), et `onSaved(undefined)` ne porterait aucun reçu.
Un fichier annoncé « rangé » sans avoir été envoyé : interdit par la consigne.

## 2. Décision du plan (D7) : refuser, ne pas remettre `pendingId` à zéro

Deux options de la consigne :
- **(A) `setPendingId(null)` dans `attach()`** : `save()` rappellerait `savePurchaseWithProofReceipt(draft)` avec le **même** `submissionId`.
  Dans le service, `submitted.has(submissionId)` (ou la transaction `TX-…` déjà dans le stockage) fait **retourner tôt** sans envoyer
  (`purchaseEntry.ts:304`) : le nouveau fichier ne partirait pas, ou bien (si `submitted` était vidé) une **seconde** dépense serait écrite pour la même saisie.
  Dans les deux cas : soit un fichier annoncé rangé sans envoi, soit un achat écrit deux fois. Rejeté.
- **(B) refuser le changement tant que la confirmation est en attente** : retenu. Le fichier déjà envoyé et la dépense déjà écrite restent liés ; le brasseur
  termine d'abord (« Vérifier la synchronisation »). Ce que l'écran fait déjà (boutons et formulaire `disabled`) devient vrai aussi pour le code.

Changement (une garde, deux lignes) dans `attach()` de `ExpenseSheet.tsx`, **avant** toute remise à zéro d'état :
```
if(pendingId){setError('Le justificatif est déjà envoyé et la dépense attend sa confirmation : termine d’abord avec « Vérifier la synchronisation ». Pour un autre fichier, ferme et rouvre la saisie.');return;}
```
- Aucun élément neuf : `setError` écrit dans la boîte d'erreur déjà là (texte seulement). Pas de bouton, pas de style.
- La garde passe après `scanLocked/saveLocked` et avant la validation du fichier ; le fichier refusé n'est ni lu, ni scanné, ni posé dans le brouillon.
- Le chemin « rejet confirmé » (`:195`) remet `pendingId` et `receipt` à zéro : le changement redevient permis (rien n'est écrit, voir risque R-b).
- « ferme et rouvre la saisie » : vrai, la saisie est perdue mais la dépense est déjà écrite (c'est le cas où la confirmation reste en attente, pas où elle manque).
  Texte à relire par le pilote (L25 : texte visible court ; aucun autre changement d'interface).

`purchaseEntry.ts` n'est pas modifié (rien à y corriger : D3 à D6 sont déjà dans HEAD). Le Possède l'autorise si la revue demande un durcissement.

## 3. Tests

### 3.1 D7 : le seul test qui échoue d'abord (`tests/unit/depense/raccord/changer-fichier.test.tsx`, nouveau)
Harnais copié de `ecran-recu.test.tsx` (mêmes mocks : `savePurchaseWithProofReceipt`, `confirmPurchase`, Gemini simulé ; aucun Drive, aucun Gemini réel).
Écrit sur le comportement vu par le brasseur :
1. **« Changer » le fichier pendant une confirmation en attente est refusé** : premier clic `Confirmer et enregistrer` ; `confirmPurchase` rejette (sans `status:'rejected'`) ;
   `pendingId` posé, le pied dit « Justificatif rangé… » (reçu). Puis un second fichier est déposé dans l'`input[type=file]` caché.
   Attendu : `scanDocument` appelé **une seule fois** (pas de second scan) ; une alerte contient « Vérifier la synchronisation » ; le pied dit toujours « Justificatif rangé » (jamais
   « sera rangé ») ; le bouton reste « Vérifier la synchronisation » ; `savePurchaseWithProofReceipt` appelé 1 fois ; au clic suivant, `confirmPurchase` rappelé avec le brouillon **du premier fichier**
   (même `documentHash`), `onSaved` reçoit le reçu du premier fichier.
   Rouge aujourd'hui : un second scan a lieu, le reçu disparaît, le pied dit « sera rangé ».
2. **même chose par la caméra et par le dépôt** (`input[capture]`, événement `drop` quand la zone est visible) : même refus.
3. **témoin : sans confirmation en attente, « Changer » fonctionne** (premier fichier scanné, pas d'enregistrement, second fichier → second scan, brouillon remis à zéro comme aujourd'hui).
4. **témoin : après un rejet confirmé** (`status:'rejected'`), le changement de fichier est permis (la garde ne suit que `pendingId`).
5. **aucun achat écrit deux fois** : après le refus, un clic de reprise ne rappelle pas `savePurchaseWithProofReceipt` (`toHaveBeenCalledTimes(1)`).

### 3.2 D3, D4, D5, D6 : preuves par mutation (script hors dépôt, dans le dossier temporaire ; code remis ensuite, `git diff` vide sur `src/` hors D7)
Un script (`os.tmpdir()`, écrit avec Write, `node --check`) applique une mutation, lance le test cité, note la ligne `failed`, remet le fichier d'origine (copie `git show HEAD:<f>`), relance et note `passed`.
| Mutation | Test attendu rouge |
|---|---|
| D3 : retirer `else if (!lineWeight && itemWeight) return … ` (`purchaseEntry.ts:222`) | `unites-enregistrement.test.ts` « n° 3 … sans poids face à un article au poids connu » |
| D3 : retirer la comparaison à `SACHET_MAX_G` (`:225`) | « poids du libellé : … 500 g » |
| D4 : remplacer `PROOF_IN_PROGRESS_ATTACH` par `PROOF_IN_PROGRESS` dans l'appel (`:360`) | `rattachement-en-cours.test.ts` « le message nomme « Rattacher le justificatif » » |
| D5 : retirer `unitPrice:` à la lecture (`ExpenseSheet.tsx:169`) | `ecran-lecture.test.tsx` R1, R1b, « même unité » |
| D5 : retirer le test d'unité de `updateLine` | R1b |
| D5 : R3 : remplacer `applyScannedPayment(previous,…)` par un étalement sans garde de la date tapée | R3 « date tapée » (le témoin « supposée remplacée » reste vert : il est vert avant et après r1, ce que RESULTAT dit en clair) |
| D6 : retirer `setReceipt(undefined)` ou `setPendingId(null)` au rejet confirmé (`:195`) | `ecran-recu.test.tsx` « rejet confirmé… » |
Chaque ligne : sortie `failed` collée dans RESULTAT.md sous « mutation », puis la même commande verte après remise.
Si une mutation ne rend rien rouge : le test est faible, il est renforcé dans `tests/unit/depense/raccord/` (3 essais), jamais ignoré.

D5 précisément : les témoins R1, R1b, R3 étaient rouges sur HEAD-avant-r1 « pour la mauvaise raison » (mock sans export). La preuve qu'ils mesurent le comportement est la mutation ci-dessus.

## 4. Tests et scripts hors Possède qui touchent ce qui change
`grep` sur `tests/` et `scripts/` : `attach(` n'est appelé que par `ExpenseSheet.tsx`. Écrans qui rendent `ExpenseSheet` : `jus0Journey.test.tsx`, `expenseSheet.test.tsx`,
`equipmentProjects.test.tsx`, `tests/unit/depense/stock/{ecran,unites}.test.ts`, `raccord/*`. Aucun ne dépose un second fichier après un enregistrement en attente
(vérifié par `grep -n "pendingId\|Vérifier la synchronisation" tests/`), donc la garde ne peut en casser aucun ; rejoués après le changement (G5). Parcours navigateur
(`scripts/check-fix114-ui.mjs`, `tests/ux-mobile/*`) : n'appelle pas `attach` après une confirmation en attente, non rejoués (en ligne).

## 5. Risques
- **Données existantes** : aucun champ Firestore ajouté ou retiré ; la garde est un état d'écran. Une dépense enregistrée avant reste lisible.
- **Double clic** : `saveLocked` inchangé ; la garde précède et ne pose aucun état.
- **Hors ligne** : la confirmation « en attente » est justement le cas hors ligne ; le brasseur est renvoyé à « Vérifier la synchronisation », qui rappelle
  `confirmPurchase` seul (aucun envoi, aucune seconde écriture).
- **R-b : rejet confirmé puis autre fichier** : `pendingId` est remis à zéro, le brasseur peut changer de fichier. Le service retrouve alors `proof-<submissionId>`
  déjà posé sur Drive avec le premier fichier : `saveFinanceDocumentConfirmed` compare les octets et lève `otherOriginal` (`financeDocuments.ts:104,109`) : un **refus**
  (« autre original »), pas une écriture. Rien n'est perdu ni écrit ; le brasseur voit l'erreur. Limite assumée et notée dans RESULTAT.md (le nom `submissionId` d'un nouveau
  fichier après rejet n'est pas renouvelé : hors Possède, voie écran).
- **Arrondis** : sans objet (aucun montant touché).
- **Texte de l'erreur** : visible, court ; le pilote peut le remplacer sans toucher à la logique.

## 6. Hors périmètre
`stockLineMatching.ts` (lecture seule), `purchasePrefill.ts`, `geminiScanner.ts`, `functions/`, `InvoiceScanReview.tsx`, `BrewWizard.tsx`, `src/domain/fermentables/`; tout nouvel élément visible;
un nouveau `submissionId` après rejet (voie écran); parcours Chrome (jsdom seulement : un texte d'erreur et une garde, pas de rendu nouveau); tout commit.

## 7. Décisions que le plan tranche, et pourquoi
1. **D7 : refuser (B)**, pas remettre à zéro (A) : (A) donnerait soit un fichier jamais envoyé annoncé rangé, soit une seconde dépense. La consigne : « aucun fichier annoncé rangé sans envoi, aucun achat écrit deux fois ».
2. **Message par `setError`**, pas un élément neuf : l'écran est refait ensuite.
3. **D3, D4, D6 : prouvés, non réécrits**, parce que HEAD les contient déjà ; les réécrire ajouterait du bruit à du code relu deux fois.
4. **Un fichier de test neuf** dans `raccord/` plutôt que `expenseSheet.test.tsx` (mocks incompatibles, et le contrôleur de COMPRIS ne lit pas ce second chemin du Possède).

## 8. Corrections après la revue (REVUE-PLAN.md, 31.10 nuit) : elles PRIMENT sur les §1 à §7 quand elles diffèrent

Base mise à jour : HEAD `86a8b698` (les deux commits suivants `ba7310a4`→`86a8b698` ne touchent ni `ExpenseSheet.tsx`, ni `purchaseEntry.ts`, ni `tests/unit/depense`). Témoin G5 sur HEAD
(rejeu du pilote) : `39 passed (39)` fichiers, `850 passed (850)` tests.

**Ordre** : (1) mutations D3 à D6, une à la fois ; (2) seulement ensuite D7 ; (3) G3, G4, G5, G6.

**Mutations (Conception 3 et 7, Prêt 1 et 3)** : un script hors dépôt (`os.tmpdir()`, écrit avec Write, `node --check`). Par mutation, dans un seul appel :
copie du fichier tel qu'il est à cet instant dans `os.tmpdir()`, mutation (une chaîne exacte, trouvée une fois), un seul fichier de test lancé, `try/finally` qui remet le fichier,
`Buffer.equals` contre la copie (octet à octet), heure et fichier consignés dans RESULTAT.md. Une mutation dure quelques secondes (trois autres voies tournent dans l'arbre).
Exception au Possède, notée : mutations **temporaires** de `ExpenseSheet.tsx` (`:104` `updateLine`, `:169` lecture du prix, `:180` `applyScannedPayment`, `:195` rejet), remises octet à octet ; changements durables seulement dans `attach()`,
`save()` (pose de `proofSent`) et `pendingId`.
| Id | Mutation (chaîne exacte) | Test attendu rouge |
|---|---|---|
| M1 (D3) | `purchaseEntry.ts` : `else if (!lineWeight && itemWeight) return` → `else if (false) return` | `unites-enregistrement` n° 3 |
| M2 (D3) | `if (grams>SACHET_MAX_G)` → `if (false)` | « poids du libellé… 500 g » |
| M3 (D3) | retirer `MULTIPLIER.test(label) || ` | n° 2 « 10 x 11,5 g » |
| M4 (D3) | `measures>(lineWeight?1:0)` → `false` | n° 1 « 0,5 kg » |
| M5 (D4) | au rattachement `PROOF_IN_PROGRESS_ATTACH` → `PROOF_IN_PROGRESS` | `rattachement-en-cours` |
| M6 (D5, R1) | `ExpenseSheet.tsx:169` retirer `unitPrice:result.currency==='CHF'?(item.price??undefined):undefined,` | `ecran-lecture` R1 |
| M7 (D5, R1b) | `:104` retirer tout le spread `...(value.unit!==undefined&&value.unit!==line.unit?{unitPrice:undefined}:{})` | R1b |
| M8 (D5, R3) | `:180` `...applyScannedPayment(previous,result,swissToday()),` → `...scannedPayment(result,swissToday()),` + import temporaire de `scannedPayment` | R3 « date tapée » |
| M9 (D6) | `:195` `setReceipt(undefined)` retiré, puis `setPendingId(null)` retiré (deux mutations) | `ecran-recu` « rejet confirmé » |
Une mutation qui ne rend rien rouge → le test est renforcé (3 essais). R1b rouge « par la raison de R1 » (ligne 2, `0.04`) : on lit la raison dans la sortie.

**D7 (décision du pilote, Conception 1, 2 et 5, Prêt 4)** : la garde refuse le changement dès qu'un justificatif a été envoyé sous ce `submissionId`, pas seulement quand `pendingId` est posé.
- Deux références (`useRef`, même idiome que `saveLocked`) : `pendingRef` suit `setPendingId` ; `proofSent` est posée dans `save()` au départ de l'envoi (`!pendingId` et `draft.proofDataUrl`), jamais remise à faux (le `submissionId` n'est pas renouvelé).
- `attach()`, avant toute remise à zéro : `pendingRef.current` → « L’enregistrement attend sa confirmation : le fichier ne peut plus être changé. Touche « Vérifier la synchronisation ». » ;
  sinon `proofSent.current` → « Ce fichier est déjà parti pour cette saisie. Pour en joindre un autre, ferme et rouvre : rien n’a été enregistré. ». Jamais « rouvre » quand la dépense est écrite ; jamais « déjà parti » sans fichier (`proofSent` exige `proofDataUrl`).
- Le texte 2 est dit aussi après un échec réseau avant tout envoi (cas non distinguable côté écran, `confirmProof`) : refus par prudence, notée en limite ; le fichier laissé dans Drive est une limite notée.
- `setError` seulement, aucun élément neuf. La zone de dépôt n'est jamais rendue quand `pendingId` est posé (`ExpenseSheet.tsx:242`) : D7 est une défense en profondeur (le port peut recréer le chemin) ; tests par `input[type=file]` et `input[capture]` ; test « la zone de dépôt n'est pas rendue ».
- Tests (`changer-fichier.test.tsx`) : second fichier de **contenu différent** (hashs affirmés différents), `scanDocument` simulé pour un second appel (rouge pour la bonne raison : un second scan a lieu aujourd'hui) ; deux rejets de `confirmPurchase` sans `status` avec un refus de changement entre les deux, puis succès, `onSaved` reçoit le reçu du premier fichier, un seul appel à `savePurchaseWithProofReceipt` ; rejet confirmé → texte 2 (aucune affirmation sur la suite) ;
  `drive/in-progress` → texte 2 ; sans `proofDataUrl` ni `proofSent` : ni « rouvre » ni « déjà parti » ; témoin : sans enregistrement, « Changer » fonctionne.
- Test de service (Conception 2), `tests/unit/depense/raccord/` : `purchaseEntry` réel, `financeDocuments` simulé qui lève `otherOriginal` : aucune écriture (`put`, `adjustNumber`, `addTransaction` jamais appelés).

**Hors Possède, rectifié (Prêt 6)** : rendent `ExpenseSheet` : `expenseSheet`, `jus0Journey`, `stock/ecran`, `stock/unites`, `raccord/ecran-lecture`, `raccord/ecran-recu` ; `equipmentProjects` passe par `FinancesTab`/`UpgradeWorkspace` ; `stockQuantityFor` : `raccord/unites-enregistrement` seulement.
Fin : `git diff --stat` des deux fichiers (seules la garde et `proofSent`/`pendingRef` restent), G3 `npm run build`, G4 `npx tsc --noEmit -p .`, G5, G6.
