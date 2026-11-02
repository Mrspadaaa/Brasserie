# ÉTAT — f4-enrichir, correction de REVUE-code.md (01.11)

Objectif : M1, M2, M3, D1 à D5 ; test rouge d'abord pour chacun (L13) ; RESULTAT.md à jour ; tsc, tests et build rejoués dans la copie isolée
(`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<cmd>"`).

## Décisions
- M2, M3 : la logique du branchement 2 passe dans un module de f4, `src/services/enrichissementRecette.ts` (`apprendreSurFicheRetenue`) ;
  `storage.ts` n'appelle plus qu'une ligne. `ficheRetenueDe` : Malt et Levure seulement. Toute valeur écrite par ce chemin porte `remplis`.
  `proche` : faits gardés dans un travail f4 `aControler` (raison `proche`, ref `RECETTE-…`), ligne de journal.
  Test à travers `learnIngredient` : une copie de `storage.ts` branchée par split/join, écrite dans `os.tmpdir()` par le test lui-même.
- M1 : try/catch par travail dans `runOnce` (sauf `ExecutantInterdit`) ; la réponse brute gardée (`reponses.put`) avant l'adaptation.

- D2 : `enrichissementLevures.ts` (neuf) porte les imports du catalogue des levures ; `enrichissementCatalogues` le charge par `import()`.
- Trouvé au rejeu branché (E4 resté rouge) : un journal qui lève APRÈS l'écriture faisait rendre `false` → `FICHE-…` en double. Corrigé
  (`noter` gardé, une écriture faite rend toujours `true`) ; test rouge puis vert dans `learn.test.ts`.

## Avancement
- [x] tests rouges écrits (M1, M2, M3, D1, D2, D3, D4, D5) + journal qui lève
- [x] corrections
- [x] rejeu copie isolée : vitest enrichir, tsc, build ; copie BRANCHÉE (`sondes/brancher-copie.mjs`) : tests, tsc, build (poids)
- [x] RESULTAT.md

## Preuves (verts, 01.11 23:2x)
- worktree `vitest run tests/unit/depense/enrichir` : `Tests 5 failed | 102 passed (107)`, les 5 = témoins (a), (b), (c2), (d), E4.
- copie isolée, non branchée : même compte ; `tsc` exit 0 ; build exit 0, App 3 139,42 kB (gzip 801,18).
- copie isolée BRANCHÉE (branchements 1 à 5) : `Test Files 28 passed (28)`, `Tests 381 passed (381)` (enrichir, fiche, purchaseEntry, ecran) ;
  `tsc` exit 0 ; build exit 0, App 3 157,70 kB (gzip 808,43) → +18,28 kB min., +7,25 kB gzip ; morceaux `import()` : enrichissementTravail
  10,52, enrichissementCatalogues 2,54, enrichissementLevures 0,72 kB.

## Preuves
- Rouges AVANT correction (vitest, worktree) : M1 `expected { ref: 'MP-f4-banc-00020-1' … } to match object { etat: 'introuvable' }` (le 2ᵉ
  travail jamais traité) ; D1 `expected 'fait' to be 'attend'` ; D2 (source) `not to match /^import …yeastReferences|localIngredientFacts/` ;
  D3 `expected 'emulateur' to be 'eteinte'` ; D4 `expected 'manufacturer' to be 'ai'` ; M2 houblon `expected [[ 'stockItems', 'MP-h-0', … ]] to
  deeply equal []` ; M2 malt `expected 3 to be undefined` (α écrit sur un malt, sans trace) ; M3 `expected false to be true` (aucun journal).
  D5 : test renforcé (`compteur.size === 0`), vert avant et après (la tentative n'était pas comptée ; le test était vrai par vacuité).
