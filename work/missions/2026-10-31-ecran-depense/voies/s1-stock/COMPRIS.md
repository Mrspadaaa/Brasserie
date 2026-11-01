# Test de compréhension : voie s1-stock

## Objectif
Rallumer la proposition d'article pour chaque ligne de facture, sans aucune fausse proposition : une ligne n'est reliée qu'au bon article, ou à aucun. Il faut d'abord écrire le plan (PLAN.md), puis, après la revue, corriger les défauts S1 à S4, A8, A9 et B-V3-5 en commençant par un test rouge sur le code actuel.

## Écrit dans
- `src/services/stockLineMatching.ts`
- `src/services/ingredientIdentity.ts`
- `src/ui/finance/ExpenseSheet.tsx`
- `tests/unit/stockLineMatching.test.ts`
- `tests/unit/depense/stock/`
- `work/missions/2026-10-31-ecran-depense/voies/s1-stock/`

## Fini quand
- G1 : `npm run build` affiche « built in ».
- G2 : `npx vitest run` sur les quatre fichiers de test de l'appariement (stockLineMatching, depense/stock, purchaseEntry, purchasePrefill) passe, et la commande affiche « TESTS STOCK OK ».
- G3 : `systeme.mjs revue` sur REVUE-PLAN.md rend « REVUE OK », donc deux relecteurs neufs ont relu le plan sans bloquant laissé.
- G4 : RESULTAT.md contient « TEMOIN AVANT », « 0 fausse proposition », « Rien ne se perd » et « 372765 », et `systeme.mjs note` rend « NOTE OK ».
- Chasse du 17.10 rejouée (27 cas) : 0 fausse proposition. Les cas « manquée » se comptent à part.
- Facture 372765 contre le stock simulé de d1 : les 9 lignes appariées aujourd'hui le restent ; Caramünch, Target, Galaxy et les levures s'apparient si leur article existe ; Goldings et Hallertauer, absents, n'ont aucune proposition ; les lignes « Zuschlag Schrotung » n'en ont aucune.
- Les défauts S1 à S4, A8, A9 et B-V3-5 ont chacun un test rouge sur le code actuel, puis vert après correction.

## Ne fait pas
- Pas d'enregistrement d'un article (prix, mouture, catégorie), pas de création de fiche, pas de changement d'écran autre que l'appel en lecture (ExpenseSheet l. 140 à 160).
- Pas de modification de `units.ts` (lecture seule) ; l'équivalence « Stk » et « sachet » vit dans l'appariement.
- Pas d'appel Gemini réel, pas de Drive réel, pas de déploiement, pas de hors localhost.
- Pas de lecture de `functions/.env`, de `.codex/`, de `source4-portable-bundle-manifest-01.json`, de `work/refonte-frontend/v4/choix/` ni de `work/missions/2026-10-31-ecran-depense/brasseur/`.
- Pas de `git stash`, pas de commit, pas de push, pas de changement de VOIE.md ou GATES.md.
- Pas de confirmation automatique : rien n'entre en stock sans « Confirmer » ; un choix de ligne déjà fait n'est jamais remplacé.

## Doutes
- La définition exacte de « fausse proposition » et de « manquée » vient du VOIE ; je n'ai pas lu les 27 cas de la chasse du 17.10, ni ARB-M4, ni diagnostic d1, que je n'avais pas à lire pour ce test.
- Je ne sais pas où vit la garde `STOCK_LINE_PROPOSALS_ENABLED`, ni si `tests/unit/depense/stock/` existe déjà ; le VOIE ne le dit pas.
- « Typ 2 Kg » contre « Typ 2 » : la règle exacte pour garder un nombre d'identité sans le confondre avec un conditionnement n'est pas écrite ; elle devra être tranchée dans le plan.
- Le séquencement est ambigu : VOIE dit « dépend de d1 », COMMUN dit « PLAN puis arrêt avant le code ». Je lis : écrire PLAN.md, attendre la revue du pilote, puis coder.
- Un nombre « 9 lignes » et « 27 cas » est à reprendre tel quel ; je ne le vérifie pas ici.
