# Voie fn-csv8 — la lecture de facture en production passe à C★v8 + N (D247)

Agent `auteur` (Sonnet), 60 tours au plus. Décideur : pilote. Son accord : « Yes ok » (01.11, soir) à la bascule mesurée au banc.

## Ce qui est mesuré (banc, `work/missions/2026-11-01-banc-lecture/GESTES.md`)
C★v8 : 275/306 champs, 399/422 lignes, 0 faux vert sur 13 pièces × 2 tirages, comme C★v ; plus aucune lecture coupée ; 0,044 CHF par
facture contre 0,078 pour la production (A). N (normalisation de code) : +1 champ, +3 lignes sur C★v, aucun champ perdu.

## À faire
Dans `functions/src/ai.ts`, `scanInvoiceSafely` (aujourd'hui A : deux lectures 3.8 en parallèle, une 3ᵉ si elles divergent, vote à
trois par `reconcileInvoiceVision`) devient exactement la variante `Csv8` du banc, lue avec N :
1. deux lectures `GEMINI_LITE_MODEL` (`functions/src/models.ts`) en parallèle, prompts `INVOICE_SCAN_PROMPTS[0]` et `[1]`, réflexion LOW,
   température 0, haute résolution, **8 192 jetons de sortie** (`LITE_RAISED_OUTPUT` du banc) ; même schéma, même parsing ;
2. la 3.8 (`SCAN_MODEL`) avec `INVOICE_SCAN_PROMPTS[2]` quand les deux divergent (`needsThird` du banc) **ou** quand une Flash-Lite
   manque (coupée, refusée, délai) : `needsThirdLite` ;
3. le résultat : `finalOfStarVote` (les valeurs de la 3.8 quand elle tranche, le statut et les constats du vote à trois, les points de
   désaccord ajoutés) avec le repli `finalOfLite` (une Flash-Lite lisible et la 3.8 votent à deux ; aucune Flash-Lite, la 3.8 seule en
   « unavailable » à un lecteur ; jamais « Lecture indisponible » quand la 3.8 a lu) ;
4. N : chaque lecture passe par la normalisation de `withCodesNormalized` (`parseOptionsOf(meta, true)` : devise en code ISO, lignes
   au-delà du plafond écartées, etc.). Lis le banc pour la porter **à l'identique**, sans l'élargir.
Porte la logique dans un module de `functions/src` (pur, testable), et non en important `scripts/` : le banc reste l'oracle, la production
ne dépend pas de lui. Le banc peut ensuite importer le module de production si c'est simple ; sinon, laisse-le tel quel.

## Ce qui ne change pas
Budget et journal (`runBudgetedInvoiceScan`, réserve avant chaque appel ; le fournisseur doit accepter le modèle **par appel** et le coût
de chaque appel suit son modèle, `geminiCosts.ts`), délais (100 s en tout, 45 s par lecture), journal par lecture (`ligneJournalLecture`,
sans contenu de facture), coupures dites telles quelles (`phraseCoupure`, `pointLectureCoupee`), cache par empreinte du document, forme de
la réponse au client (`AiTaskResult` : `model`, `tier`, `review`, `points`, `issues`…). Aucun autre chemin d'`aiTask` ne change.

## Tests (Gemini toujours simulé ; jamais d'appel réel)
- Écris d'abord les tests qui échouent sur le code d'aujourd'hui (L13) : deux Flash-Lite d'accord → aucune 3.8, statut du vote ; désaccord
  → la 3.8 appelée, ses valeurs, statut « disputed » ; une Flash-Lite coupée → la 3.8 appelée, résultat à deux ; les deux coupées → la 3.8
  seule ; la 3.8 en échec → repli et coupure dite ; modèle et `maxOutputTokens` de chaque appel (lite 8 192, 3.8 inchangé) ; coût réservé
  par modèle ; devise « Fr. » → « CHF » (N).
- **Parité** : rejoue `finalOfStarVote` du banc et ton module sur les mêmes lectures simulées (au moins les cas ci-dessus) : résultats
  égaux champ par champ.
- Repère les tests existants de la lecture (`grep -rln "scanInvoiceSafely\|reconcileInvoiceVision" tests functions`) et garde-les verts
  ou adapte ceux qui décrivaient A, en le disant.
- `npm --prefix functions run build` vert ; `npx tsc -p functions --noEmit` si le build ne le couvre pas.

## Possède
`functions/src/ai.ts`, `functions/src/invoiceScan*.ts`, `functions/src/invoiceVision*.ts`, un nouveau module de `functions/src` pour le
vote, les tests de la lecture de facture, `work/missions/2026-11-01-bascule-lecture/voies/fn-csv8/**`. Rien d'autre. Aucun déploiement,
aucune installation, aucun commit, pas de `git stash`. Ne touche jamais `firebase.json`, `.firebaserc`, `firestore.rules`,
`firestore.indexes.json`, `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env` ; ne lis ni `functions/.env`
ni `functions/.secret.local`. Chemins absolus dans Bash, pas de `cd` hors d'un sous-shell ; aucun code écrit par heredoc ni `node -e`.

## Retour
`voies/fn-csv8/RESULTAT.md` : fichiers changés, tests ajoutés (et qu'ils échouaient avant), sorties des tests et du build, parité, ce qui
reste à surveiller. Puis une ligne : `FN-CSV8 OK — …` ou `FN-CSV8 ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.
