# Voie r2-details — les cinq détails laissés par la relecture de r1

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (écriture d'une dépense et du stock : argent, quantités, Drive)
- Plafond : 70 tours (dont 20 pour le plan) ; 3 essais par critère
- Dépend de : r1-raccord, commitée (0ec04f8f)
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
La relecture du code de r1 (`voies/r1-raccord/RELECTURE.md`, tableau, lignes 3 à 7) a laissé cinq détails. Après r2, chacun est corrigé
ou prouvé par un test qui échoue d'abord :
- **3** : `stockQuantityFor` (`src/services/purchaseEntry.ts:198`) suit la règle de l'appariement (`stockLineMatching.ts:193-201`) : une
  ligne sans poids face à un article dont le poids connu dépasse `SACHET_MAX_G` est incompatible ; rien n'entre en stock ;
- **4** : un test sur le vrai code prouve le texte « en cours » du rattachement (`PROOF_IN_PROGRESS_ATTACH`) : il contient « Rattacher le
  justificatif », jamais « Confirmer et enregistrer », avec le code `drive/in-progress` ;
- **5** : les témoins R1, R1b et R3 de r1, rouges par le harnais, sont prouvés par mutation (retirer `unitPrice:` à l'écran donne R1 rouge ;
  retirer le test d'unité de `updateLine` donne R1b rouge), puis remis ; la preuve va dans RESULTAT.md ;
- **6** : la branche « rejet confirmé » est testée : `confirmPurchase` rejeté (`isConfirmedWriteRejection` vrai) → le pied ne dit plus
  « Justificatif rangé », et le clic suivant rappelle `savePurchaseWithProofReceipt` ;
- **7** : « Changer » le fichier après un premier envoi resté en attente ne laisse plus un `pendingId` qui ferait sauter l'envoi du nouveau
  fichier. Le plan tranche, et dit pourquoi, entre remettre `pendingId` à zéro dans `attach()` et refuser le changement tant que la
  confirmation est en attente. Le choix sûr : aucun fichier ne doit être annoncé « rangé » sans avoir été envoyé ; aucun achat ne doit
  être écrit deux fois.

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`. Deux temps :
1. tu écris `PLAN.md`, puis tu t'arrêtes et rends `PLAN PRÊT — 5 défauts` ;
2. le pilote fait relire le plan par deux regards neufs et te renvoie la revue triée ; ensuite tu codes.

Le business est juste à 100 % : une proposition perdue est permise, une fausse écriture ne l'est pas. Dans le doute, rien.

L'écran sera refait juste après (voie de port) : tes tests protègent ce comportement pendant le port. Écris-les sur le comportement (ce que
voit et fait le brasseur), pas sur la structure du JSX.

## Possède
- `src/services/purchaseEntry.ts` ;
- `src/ui/finance/ExpenseSheet.tsx`, pour `attach()` et `pendingId` seulement ;
- `tests/unit/purchaseEntry.test.ts`, `tests/integration/expenseSheet.test.tsx` ;
- `tests/unit/depense/raccord/` ;
- `work/missions/2026-10-31-ecran-depense/voies/r2-details/`.

Interdits :
- `src/services/stockLineMatching.ts` (en lecture et pour importer `SACHET_MAX_G` seulement) ;
- `src/services/purchasePrefill.ts`, `src/services/geminiScanner.ts`, `functions/` (voie l2) ;
- `src/ui/finance/InvoiceScanReview.tsx` ;
- `src/pages/BrewWizard.tsx`, `src/domain/fermentables/` ;
- tout ce que COMMUN.md interdit.

## D'abord
Écris `COMPRIS.md` (Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes), lance G1, lis la relecture de r1, puis écris le plan.

## Critères
`GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine. G2 attend la revue triée du pilote.

## Rendre
`RESULTAT.md`, écrit section par section, au format de COMMUN.md (ligne 1 `OK — …` ou `ECHEC — …`, « TEMOIN AVANT : … », un paragraphe
par détail et son test, les fichiers écrits, « Rien ne se perd : … », `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`). Puis une ligne au pilote.
