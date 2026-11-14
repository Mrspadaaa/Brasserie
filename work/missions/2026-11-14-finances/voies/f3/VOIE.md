# Voie f3 — Les 3 bloquants du test d'écran final, et les mineurs sûrs

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : f2 (commité c398e064)
- Décideur en cas de doute : pilote

## Objectif
Corriger les bloquants 1, 2, 3 et les mineurs 4, 8, 11, 14 du verdict `work/missions/2026-10-31-ecran-depense/avant-deploiement/c398e064/VERDICT.md` (captures dans ce dossier), sans rien changer d'autre.

## Entrées
- Le VERDICT ci-dessus : lire les points 1, 2, 3, 4, 8, 11, 14 et leurs captures.
- `work/missions/2026-11-14-finances/voies/p2a/s2ap2/s2ap2-apres.png`, `NOTE.md` — la maquette choisie (le loyer à payer posé au 25, « hors plage » pour 1er → 15).
- `work/missions/2026-11-14-finances/voies/f1/RESULTAT.md`, `voies/f1/controle-frise.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/operations`, `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/operations.css`
- `src/ui/finance/annuel`, `src/ui/finance/TaxWorkspace.tsx`
- `tests/unit/operationsPlageJours.test.ts`, `tests/integration/operationsPeriode.test.tsx`
- `work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs`, `work/missions/2026-11-14-finances/voies/f3`

## Consignes
- **1** (Annuel, `?finance-demo`, brasserie complète) : la puce « Stock au 31 déc. ? » ne couvre plus le résultat ; « −506,40 » entier et « CHF perdus » visibles, comme g6 (`work/missions/2026-11-14-finances/ref/g6/g6-page.png` : la puce sous le nombre, dans le haut de la colonne).
- **2** (règle n° 1, s2ap2) : dans la frise et la plage, une opération **à payer** se place à son **échéance**, une opération **payée** à la date de son **paiement** (v6a écrit « payé 9 nov. », « à payer · 25 nov. ») ; le loyer à payer le 25 sort de « 1er → 14 nov. » en ligne « hors plage », à payer recalculé. Lis d'abord quelle date la vue du mois utilise ; si elle diffère, n'y touche pas et dis-le dans RESULTAT.md. Corrige `controle-frise.mjs` pour qu'il vérifie cette règle (rouge sur c398e064, puis vert) et un test Vitest.
- **3** : Archives n'écrit plus « Ni vente ni dépense sur tout l'historique » quand l'historique a des opérations (dire ce qui est archivé ou qu'aucune année n'est archivée, sans phrase fausse).
- **4** : à « 1er → 14 nov. », la poignée ne cache plus la seule barre du jour : barre visible au-dessus ou à côté de la poignée.
- **8** : la ligne TVA et sa feuille disent le même nombre (même arrondi).
- **11** : un mois vide n'a qu'une carte vide, pas deux.
- **14** : « Doublons » désactivé lisible en sombre à 1280 (contraste ≥ 4,5:1 ou 3:1 pour un texte désactivé selon DESIGN.md).
Les autres points du verdict (5, 6, 7, 9, 10, 12, 13) restent ouverts : ne pas y toucher.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : v6a, s2ap2, g3a, g6 telles quelles. Contrôles qui restent verts : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000`, `voies/y1/controle-synthese.mjs 3000`, `voies/a1/controle-annuel.mjs 3000`, `voies/r1/controle-r1.mjs 3000`, et `voies/f1/controle-frise.mjs 3000` (corrigé au point 2).
- Montants : aucune règle du domaine changée ; aucune donnée réelle (banc `?dev-local&finance-demo=reel` et `?dev-local&finance-demo`).
- Rien hors de « Possède » ; `git status --short` à la fin. Pas de Fable, aucun sous-agent. Banc : http://localhost:3000 (ne pas relancer). `npx tsc` : ignorer les 2 erreurs de `functions/`.
- Captures de chaque point corrigé, 390 et 1280, clair et cave, dans `f3/cap/`, ouvertes.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour à chaque point.
- La ligne « Tests » : `npx vitest run tests/unit/operationsPlageJours.test.ts tests/integration/operationsPeriode.test.tsx tests/integration/f2ReelAnnuel.test.tsx tests/unit/annuelPiecesAClasser.test.ts --reporter=dot > work/missions/2026-11-14-finances/voies/f3/tests.txt`.
Ne commite pas. Réponse finale au pilote : une ligne.
