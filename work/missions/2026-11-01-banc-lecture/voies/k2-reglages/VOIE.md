# Voie k2-reglages — faire mieux lire 3.5 Flash-Lite : réflexion, consignes, et la 3.8 qui tranche

Agent : auteur (Sonnet). Plafond : 70 tours. Pilote : Opus. Date : 01.11. Suite de k1 (`voies/k1-banc/`, commit a20ae1fe) ; D234 (5 CHF,
1,39 CHF déjà journalisés : le budget du banc est cumulatif).

## Sa question (01.11, mot pour mot)
« 3.5 Flash-Lite, il y a pas moyen de le faire mieux fonctionner ? Avec un meilleur Harness, guideline, ou une utilisation plus haute de son
intelligence ? Genre en Max ou xhigh ? Et si il y a probablement fallback sur 3.8 ? »

## Ce qu'on sait (ne pas le refaire)
- `RESULTAT-BANC.md` (k1, payant) : C (2 Flash-Lite `low` puis 3.8 sur désaccord, vote à trois) : 0 faux vert, 219/243 champs, 166/207
  lignes (A : 182/207), 10,4 s, 0,025 CHF. La 3.8 a été appelée dans 17 parcours sur 21 ; quand les deux Flash-Lite s'accordent sur une
  valeur fausse, le vote la garde (doc1 : 3 appels à chaque tirage, prix des lignes faux ×7).
- Google (page « thinking », 01.11) : `gemini-3.5-flash-lite` accepte `minimal`, `low`, `medium`, `high` (défaut `minimal`) ; ni max ni
  xhigh. La réflexion compte dans `maxOutputTokens` (5 100 aujourd'hui) : à `high`, une coupure `MAX_TOKENS` est possible.

## Les variantes
1. **C★, hors ligne, 0 appel** : les appels de C (k1), mais quand la 3.8 est appelée, son résultat **tranche seul** (plus de vote à trois) ;
   et **C★′** : la 3.8 appelée aussi quand un contrôle arithmétique échoue (comme C′), puis tranche seule. Depuis la sortie payante de k1
   (`work/finalisation-tickets-2026-10-08/H13-reels/banc-k1-20261101-081144/`), sans nouvel appel.
2. **Lm et Lh, payantes** : C★′ avec les deux lectures Flash-Lite en `medium`, puis en `high` ; pour ces deux-là seulement, un plafond de
   sortie relevé (8 192) ; les coupures sont comptées. La 3.8 qui tranche est prêtée par k1 quand elle existe (même document, même tirage),
   sinon neuve.
3. **Lp, payante** : C★′, Flash-Lite `low`, avec une **consigne propre à Flash-Lite**, écrite dans un module du banc
   (`scripts/banc-lecture-consignes-lite.ts`, jamais dans `functions/`). Règles **génériques de facture**, valables pour toute facture et
   non taillées sur ces sept-là (L20) : la colonne du montant de ligne (TTC si imprimé) ; un prix barré ou une remise n'est pas le prix ; un
   prix unitaire non imprimé reste vide ; une période (du… au…) n'est pas la date de la facture ; la devise est un code ISO (CHF, EUR) ;
   chaque ligne imprimée, une ligne lue, dans l'ordre. Tu ne lis **aucune valeur** des documents pour l'écrire : seulement les noms des
   champs en défaut de `RESULTAT-BANC.md`.
4. **N, hors ligne** : une normalisation de code, appliquée après la lecture à toutes les variantes (devise « Fr. », « SFr. », « CHF. » →
   « CHF »), pour voir ce qu'elle rattrape seule ; dans le banc seulement.
Jugement : le même que k1 (`banc-lecture-facture-juger.ts`), étendu aux nouvelles variantes ; **par document** en plus du total, pour qu'on
voie si un gain vient d'un seul document.

## À faire
- Étendre `scripts/banc-lecture-facture.ts` (options `--variantes`, `--reprendre <sortie k1>` pour prêter les appels déjà payés), le
  jugement, et `tests/unit/banc-lecture-facture.test.ts` (C★ et C★′ calculés juste sur des réponses fabriquées ; la 3.8 tranche seule ;
  plafond relevé seulement pour Lm et Lh ; la consigne Lp n'est jamais envoyée à A).
- Mode `--simuler` comme k1 (aucun réseau, aucune clé lue) ; `BANC SIMULE OK` ; témoin négatif comme k1.
- Calculer C★, C★′ et N sur la sortie payante de k1, sans appel, et écrire le tableau dans `voies/k2-reglages/HORS-LIGNE.md`, sans
  aucune valeur des documents.
- Donner la commande payante et sa réserve maximale. **Pas d'appel payé** : le pilote la lance.

## Possède
`scripts/banc-lecture-facture.ts`, `scripts/banc-lecture-facture-juger.ts`, `scripts/banc-lecture-consignes-lite.ts` (neuf),
`tests/unit/banc-lecture-facture.test.ts`, `work/missions/2026-11-01-banc-lecture/voies/k2-reglages/**`,
`work/finalisation-tickets-2026-10-08/H13-reels/banc-k2-*/`. Rien d'autre : ni `functions/`, ni `src/`. Clé seulement par `readLocalKey`
(jamais lue, affichée ni journalisée par toi) ; ne lis jamais `functions/.env` ni `functions/.secret.local`. Pas de commit, pas de
déploiement. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceVisionReview.test.ts --maxWorkers=2 && echo TESTS BANC OK` → TESTS BANC OK
- la simulation et son jugement (commande exacte dans RESULTAT.md) → `BANC SIMULE OK`
- `voies/k2-reglages/HORS-LIGNE.md` existe, avec C★, C★′ et N par document ; `grep` d'un montant à deux décimales à trois chiffres ou plus n'y trouve rien

## Retour
`voies/k2-reglages/RESULTAT.md` : ce qui a été écrit, les sorties, le tableau hors ligne en bref, la commande payante, sa réserve maximale
et son estimation. Puis une ligne : `K2 OK — …` ou `K2 ECHEC — …`. `LEÇON PROPOSÉE : …` au besoin.
