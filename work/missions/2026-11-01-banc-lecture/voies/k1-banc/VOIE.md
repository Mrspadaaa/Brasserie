# Voie k1-banc — trois façons de lire une facture, mesurées sur ses vraies factures

Agent : auteur (Sonnet). Plafond : 60 tours. Pilote : Opus. Date : 01.11. Décisions : D233 (« plutôt lent »), D234 (5 CHF accordés).

## La question du brasseur (01.11, mot pour mot)
« Est-ce que on pourrait faire 2 lecture en parallèle de 3.5 flash et si ça diverge une relecture par 3.8 ? C'est quoi l'architecture
actuellement ? Pourquoi on a choisi ça ? » Puis : « 5chf de budget accordé ».

## Ce qu'on sait déjà (ne pas le refaire)
- Production (`functions/src/ai.ts:98-157`, `scanInvoiceSafely`) : 2 lectures `gemini-3.8-flash` en parallèle (deux consignes), réflexion
  `low`, température 0, `MEDIA_RESOLUTION_HIGH`, sortie ≤ 5 100 jetons ; `reconcileInvoiceVision` ; si `needsCorrection`, une 3ᵉ lecture
  3.8 (3ᵉ consigne), vote. Journaux de ce matin : lectures de 9 s chacune (≈ 1 300 jetons de sortie), puis 3ᵉ de 8,6 s : ≈ 18 s.
- Banc du 13 au 17.10 (`work/finalisation-tickets-2026-10-08/AI07-B/resultat.md`, `AI07-C/resultat.md`, `H13R-2/rapport.md`) : une seule
  lecture 3.8 `low` aussi juste que la production (12/12, 6/6, 13/13 champs sur doc5), 2,2 fois plus rapide ; Flash-Lite `low` 7/10, trois
  échecs graves (unité « x » inventée sur toutes les lignes, HT absent). Ces bancs ont 2 semaines : consignes et rapprochement ont changé
  depuis (invoice-v5, voies l1 et l2 du 31.10). On remesure tout sur le code d'aujourd'hui.

## Les variantes
- **A, production** : exactement les requêtes de `scanInvoiceSafely` (mêmes corps, mêmes consignes, même ordre), puis la même
  réconciliation et le même déclencheur de 3ᵉ lecture.
- **B, une lecture d'abord** (H13, accepté par lui le 16.10, jamais appliqué) : la lecture 1 seule ; si un contrôle arithmétique de cette
  lecture échoue (points d'origine `controle` qui pèsent : somme, montant de ligne, TVA, total absent ; PAS la date absente seule), la
  lecture 2 puis la réconciliation des deux ; si elles divergent (`needsCorrection`), la lecture 3 et le vote.
  **B se calcule hors ligne à partir des appels de A** (mêmes appels, mêmes consignes) : aucun appel payé de plus. Sa durée est la somme
  séquentielle des durées mesurées (t1, puis t2 si déclenchée, puis t3).
- **C, sa proposition** : lectures 1 et 2 (mêmes consignes que A) sur `gemini-3.5-flash-lite`, réflexion `low`, en parallèle ; si la
  réconciliation des deux diverge (`needsCorrection`), une lecture 3.8 avec la 3ᵉ consigne, puis le vote à trois. Quand A a déjà fait sa
  3ᵉ lecture 3.8 sur ce document et ce tirage, elle est réutilisée (même consigne, indépendante des autres) ; sinon un appel 3.8 neuf.
- **C′, sa proposition gardée par les contrôles** (hors ligne, mêmes appels que C) : comme C, mais un contrôle arithmétique en échec
  déclenche aussi la 3.8.

## À faire
1. **Rien ne change en production.** Les trois consignes de lecture sont aujourd'hui écrites dans `ai.ts`. Les déplacer telles quelles
   dans un module exporté (par exemple `functions/src/invoiceScanPrompts.ts`), importé par `ai.ts` : simple déplacement, même texte à
   l'octet près. Le banc importe ce module et `TASKS.scanInvoice`, `normalizeInvoiceScan`, `reconcileInvoiceVision`, les contrôles et
   `quoteGeminiCost`/`observedGeminiCostDetails` : jamais une copie des consignes. **Preuve** : un test qui fait passer
   `scanInvoiceSafely` par un fournisseur simulé (montage de `tests/unit/invoiceScanTransport.test.ts`), capture ses corps de requête, et
   vérifie que le corps du banc pour A est identique, champ par champ, pour les lectures 1, 2 et 3. Tous les tests de `functions/` et
   `tests/unit/invoice*` restent verts.
2. **Le banc** `scripts/banc-lecture-facture.ts` (lancé par `npx vite-node --config vitest.config.ts …`) :
   - cas : `work/finalisation-tickets-2026-10-08/H13-reels/cas.json`, `cas-2.json`, `cas-3.json` (doc1 à doc7 ; images dans ce même dossier,
     ignoré par Git) ; `--repeat 3` par défaut ;
   - par document et par tirage : A (2 ou 3 appels 3.8), C (2 appels lite, et la 3.8 réutilisée ou neuve) ; B et C′ calculés hors ligne ;
   - appels A en parallèle comme la production ; C aussi ; documents l'un après l'autre (débit raisonnable) ;
   - **mode `--simuler`** (défaut) : aucun réseau, aucune clé lue, réponses fabriquées depuis la vérité (et quelques réponses fausses pour
     éprouver le jugement) ; **mode `--payant`** seulement avec `--budget-chf 4.5` : clé lue par `readLocalKey` de
     `scripts/gemini-usage-bench-guard.mjs` (jamais affichée, jamais journalisée, jamais copiée ; ne lis jamais `functions/.env` ni
     `functions/.secret.local` toi-même), coût réservé AVANT chaque appel au tarif maximal (sortie au plafond) et arrêt net si la réserve
     dépasse le budget ; coût réel relu après, depuis `usageMetadata` ;
   - **journal** : une ligne par appel, écrite juste après, dans `work/missions/2026-11-01-banc-lecture/journal-gemini.md` (date, doc,
     variante, lecture, modèle, durée, jetons entrée/sortie, coût, cumul) ; aucune valeur des documents ;
   - sorties : réponses brutes et résultats par variante dans `work/finalisation-tickets-2026-10-08/H13-reels/banc-k1-<horodatage>/`
     (données personnelles : jamais ailleurs, jamais dans Git).
3. **Le jugement** `scripts/banc-lecture-facture-juger.ts` : lit une sortie du banc, compare le résultat FINAL de chaque variante à
   `expected` (même tolérance que les bancs d'octobre : montants au centime, noms par inclusion insensible à la casse et aux accents,
   alternatives en tableau, `null` attendu = rien d'inventé) et rend, par variante : champs justes / jugés, lignes justes, **faux verts**
   (statut final `checked` alors qu'au moins un champ jugé est faux — le pire cas), alertes justes (statut `disputed`/`unavailable` avec
   une erreur réelle), alertes inutiles, durée médiane et maximale du parcours, appels, coût médian et total. Le tableau publiable
   (`work/missions/2026-11-01-banc-lecture/RESULTAT-BANC.md`) ne contient **aucune valeur des documents** : seulement des comptes, des
   durées, des coûts et le nom du champ en défaut (par exemple « doc2 : tvaAmount faux en C, tirage 2 »).
4. Tester le jugement sur la sortie simulée : il doit compter les fausses réponses fabriquées comme fausses (témoin négatif).

## Possède
`functions/src/invoiceScanPrompts.ts` (neuf), `functions/src/ai.ts` (le seul déplacement des consignes), `scripts/banc-lecture-facture.ts`,
`scripts/banc-lecture-facture-juger.ts`, `tests/unit/banc-lecture-facture.test.ts`, `work/missions/2026-11-01-banc-lecture/`,
`work/finalisation-tickets-2026-10-08/H13-reels/banc-k1-*/`. Rien d'autre. **Pas d'appel payé** : le pilote lance lui-même `--payant` après
ta voie. Pas de commit, pas de déploiement. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`,
`functions/.env`, `functions/.secret.local`. Une autre voie travaille en même temps sur `src/ui/` (Dépense) : n'y touche pas.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK ; `npm --prefix functions run build && echo FONCTIONS OK` → FONCTIONS OK
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceScanCore.test.ts tests/unit/invoiceVisionReview.test.ts tests/unit/invoiceScanBudget.test.ts tests/unit/depense/lecture tests/unit/depense/rapprochement --maxWorkers=2 && echo TESTS LECTURE OK` → TESTS LECTURE OK
- `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --simuler --out <os.tmpdir()>/k1-sim && npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- <os.tmpdir()>/k1-sim` → `BANC SIMULE OK` (le jugement retrouve chaque fausse réponse fabriquée, aucun réseau)
- `git diff -w HEAD -- functions/src/ai.ts` ne montre que le déplacement des consignes (le pilote le lit).

## Retour
`voies/k1-banc/RESULTAT.md` : ce qui a été écrit, les sorties des critères, la commande exacte de la passe payante, son coût estimé
(réserve maximale et estimation probable). Puis une ligne : `K1 OK — <résumé>` ou `K1 ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.
