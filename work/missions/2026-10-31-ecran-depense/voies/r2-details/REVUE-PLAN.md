# Revue du plan r2-details, triée par le pilote (31.10, nuit)

Deux relecteurs neufs : `REVUE-conception.md` et `REVUE-pret.md` (les preuves et le détail y restent). « corrigée » : l'auteur corrige PLAN.md
selon la colonne « Correction attendue », précisée par la Raison quand le pilote tranche, avant toute ligne de code. Règle de la voie :
une proposition perdue est permise, une fausse écriture ne l'est pas ; dans le doute, rien.

**Ce que le pilote tranche pour le détail 7 (Conception 1 et 2, Prêt 4 et 8)** : la garde refuse le changement de fichier dès qu'un
justificatif a été envoyé sous ce `submissionId` (une référence `proofSent`, posée au départ de l'envoi dans `save()`, en plus de
`pendingId`). Le `submissionId` n'est pas renouvelé dans cette voie. Deux textes, vrais chacun dans leur cas, sans « déjà envoyé » quand
aucun fichier n'est parti :
- `pendingId` posé (la dépense est écrite sur l'appareil, en attente) : « L'enregistrement attend sa confirmation : le fichier ne peut
  plus être changé. Touche « Vérifier la synchronisation ». » ; jamais « ferme et rouvre », qui mène à une seconde dépense ;
- un envoi tenté, rien d'écrit (rejet confirmé, `drive/in-progress`, échec avant `savePurchase`) : « Ce fichier est déjà parti pour cette
  saisie. Pour en joindre un autre, ferme et rouvre : rien n'a été enregistré. » Le fichier laissé dans le Drive est une limite notée dans
  RESULTAT.md.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | majeur | Le texte du détail 7 dit « déjà envoyé » même sans fichier, et « ferme et rouvre » mène à « Autre achat », soit une seconde dépense et un second mouvement de stock | texte vrai dans chaque cas, jamais « rouvre » quand la dépense est écrite ; test : ni « rouvre » ni « déjà envoyé » quand `proofDataUrl` est vide | corrigée | les deux textes du pilote, ci-dessus |
| 2 | majeur | Le même `submissionId` mène à `otherOriginal` après un rejet, un `drive/in-progress` ou un échec après envoi ; « rien n'est écrit » sans test | test au niveau du service (`purchaseEntry.ts` réel, `financeDocuments` simulé qui lève `otherOriginal`) : aucune écriture (`put`, `adjustNumber`, `addTransaction` jamais appelés) ; refuser aussi le changement dès qu'un envoi a été tenté | corrigée | option la plus sûre retenue (`proofSent`) ; `submissionId` non renouvelé |
| 3 | majeur | La remise depuis `git show HEAD` effacerait la garde de D7 | copie du fichier juste avant chaque mutation, empreinte vérifiée avant et après ; ou les mutations avant D7 ; fin : `git diff --stat` des deux fichiers, seule la garde reste | corrigée | les deux : mutations d'abord, et copie juste avant (voir Prêt 1) |
| 4 | détail | Dépôt et caméra non atteignables pendant une confirmation en attente | D7 décrit comme défense en profondeur ; test sur l'`input` caché ; pas de test « dépôt » | corrigée | le port à venir peut recréer le chemin : la garde reste |
| 5 | détail | La garde lit `pendingId` du rendu, pas une référence | une référence suivie avec `setPendingId` | corrigée | `proofSent` est une référence aussi ; même idiome que `saveLocked` |
| 6 | détail | Les mutations du détail 3 laissent `MULTIPLIER` et le décompte `measures` sans preuve ; la mutation R3 n'est pas nommée | deux mutations de plus, test rouge attendu ; ligne et remplacement exacts de la mutation R3 | corrigée | — |
| 7 | détail | Mutations sur un arbre partagé par d'autres voies | mutation, test et remise dans un seul appel (`try/finally`), une à la fois ; heure et fichiers dans RESULTAT.md | corrigée | trois voies tournent dans cet arbre cette nuit |
| 8 | détail | Deux échecs de suite de `confirmPurchase` non testés | test 1 : deux rejets sans `status`, un refus de changement entre les deux, puis succès ; `onSaved` reçoit le reçu du premier fichier ; un seul appel à `savePurchaseWithProofReceipt` | corrigée | — |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | majeur | Remise du code fausse dès que D7 est codé ; pas de `try/finally` | copie dans `os.tmpdir()` juste avant la mutation ; restauration dans un `finally` ; `git diff --stat -- src/` ne montre que la garde ; `diff` octet à octet contre la copie | corrigée | même correction que Conception 3 |
| 2 | majeur | Le test « dépôt » n'est pas écrivable : la zone n'est jamais rendue avec `pendingId` | défense en profondeur ; test : la zone de dépôt n'est pas rendue quand `pendingId` est posé ; fichier et caméra par `input[type=file]` et `input[capture]` | corrigée | même correction que Conception 4 |
| 3 | majeur | Mutations D5 sous-déterminées ; `updateLine` (`:104`) et `:180` hors du Possède | mutation exacte par ligne (R3 → `...scannedPayment(result,swissToday())`, import temporaire ; R1b → retirer tout le spread `unitPrice:undefined`) ; exception du Possède notée | corrigée | le pilote permet des mutations **temporaires** de `ExpenseSheet.tsx:104` et `:180`, remises octet à octet ; aucun changement durable hors `attach()`, `save()` (pose de `proofSent`) et `pendingId` |
| 4 | détail | « Le justificatif est déjà envoyé » est faux sans fichier | formulation neutre | corrigée | les textes du pilote ; « ferme et rouvre » seulement quand rien n'est écrit (Conception 1) |
| 5 | détail | Le second fichier du test a le même contenu ; le second `scanDocument` n'est pas simulé | second fichier de contenu différent, hashs différents affirmés ; `mockResolvedValueOnce(scan())` au second appel ; rouge pour la bonne raison | corrigée | — |
| 6 | détail | Liste fausse des écrans qui rendent `ExpenseSheet` ; témoin G5 non consigné | corriger la liste ; consigner le témoin G5 sur HEAD | corrigée | — |
| 7 | détail | Base `ba7310a4` au lieu de `86a8b698` ; G3 et G4 non planifiés | base à jour ; G3 et G4 dans les étapes de fin | corrigée | — |
| 8 | détail | Après un rejet confirmé, le changement permis aboutit à coup sûr à `otherOriginal` | ne rien affirmer sur la suite | corrigée | remplacé par la garde `proofSent` : après un rejet confirmé, le changement est refusé avec le second texte |
