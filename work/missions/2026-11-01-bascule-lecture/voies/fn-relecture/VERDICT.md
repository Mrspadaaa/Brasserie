# VERDICT fn-relecture — relecture de fn-csv8 (D247, D251)

Preuves rejouées : commande complète du VOIE (29 fichiers, **626 tests verts**, y compris `tests/integration/invoiceReview.test.ts`, rejoué deux fois, vert au dernier rejeu) ;
`npx tsc -p functions --noEmit` sortie 0 ; mon test `parite-bout-en-bout.test.ts` (29 tests verts, config `vitest.relecture.config.ts`) ;
les tests de l'auteur rejoués sur A (config `vitest.sur-A.config.ts`, copie de `git archive HEAD functions/src` dans `os.tmpdir()/headsrc`, aucun fichier du dépôt remis à HEAD).
Aucun appel Gemini réel.

## Q1 — Parité : OK
- Lecture du code : `finalOfTwo`, `finalOfLite`, `finalOfStar`, `finalOfStarVote`, `needsThird`, `needsThirdLite`, `singleOfTwo` de `functions/src/invoiceScanVote.ts` sont ligne à ligne celles du banc (`scripts/banc-lecture-facture.ts:487-583`), `force` à `false`.
- Mon test, **de bout en bout** (`scanInvoiceSafely` avec fetch simulé contre `finalOfStarVote` du banc sur lectures `withCodesNormalized`), `finalOfStarVote` rendu `toEqual` champ par champ, et la 3.8 appelée exactement quand le banc la demande :
  lecture vide (`items: []`) des deux côtés / d'un côté, texte vide, une seule ligne (accord et désaccord), devise absente / null / nombre / vide / « fr », « S Fr. », « chf.. », total absent / null, 35, 36, 40 lignes (plafond), 40 contre 38, 37 lignes avec Flash-Lite coupée, deux coupées, délais (AbortError), 3.8 coupée / vide / en délai, rien de lisible (erreur), N qui supprime le désaccord de devise ; puis **300 triplets pseudo-aléatoires** (graine fixe) mêlant coupures, refus 503, textes vides, délais, devises, totaux, 0 à 40 lignes, TVA. Statuts atteints : checked/2, checked/3, disputed/2, disputed/3, unavailable/1, erreur. Tous égaux au banc.
- Divergences assumées : `failure` (texte) — sans effet : « pas de finale » ⇔ le banc donne `result: null` ⇔ la production lève l'erreur de la première lecture rejetée (vérifié dans mon test « rien de lisible »). Option `force` — sans effet sur `Csv8` (appelée à `false` au banc, ligne 577 avec défaut `false`).

## Q2 — N, sans élargissement : OK
`isoCurrency` identique au caractère près à `banc-lecture-facture.ts:338-342` (table testée aussi par l'auteur). Application : `decoded.currency = isoCurrency(decoded.currency)` dans `parse` (`ai.ts:128`), avant `normalizeInvoiceScan`, pour les trois lectures, comme `withCodesNormalized` → `parseReadResponse(…, codes)` (banc :368) puis `normalizeInvoiceScan` (banc :412). Le plafond de 35 lignes est celui, partagé, de `normalizeInvoiceScan` (`SCAN_MAX_ITEMS`), rien de plus. Cas EUR, null, nombre, vide : mêmes résultats que le banc (mon test).

## Q3 — Appels : OK
Corps de chaque appel : `ai.ts:131-136` = corps du banc (`callSpec('Csv8')`, banc :195 ; 3.8 :181) — schéma, `temperature: 0`, `mediaResolution HIGH`, `thinkingLevel: LOW`, consigne `INVOICE_SCAN_PROMPTS[lecture-1]`, `[2]` pour la 3.8 ; `maxOutputTokens` 8 192 (`LITE_SCAN_MAX_OUTPUT`) / 5 100 ; modèle par appel (URL). Le test du banc `k1 — le corps du banc pour Csv8…` compare le JSON octet pour octet. Trois appels au plus : `lireCsv8` (2 + 1) et `SCAN_MAX_CALLS = 3` dans le registre (et mon test compte les appels).

## Q4 — Ce qui ne devait pas changer : OK
Budget : réserve avant chaque appel intacte ; `runWithMonthlyAiBudget(model, …)` reçoit le modèle de l'appel (coût réservé par `geminiCosts.ts`) ; plafond de sortie par modèle (`outputCap`), modèle hors liste blanche refusé avant réservation ; tests ajoutés dans `invoiceScanBudget.test.ts`. Réserve par justificatif ≈ 220 k pour 1 M par défaut (`brewerLimits.ts:7`). Délais 100 s / 45 s inchangés. `ligneJournalLecture` non modifiée (aucune diff dans `invoiceVisionReview.ts`), `model` ajouté à côté. `phraseCoupure`, `pointLectureCoupee` réutilisés ; la phrase « contrôle complémentaire n'a pas abouti » est la même qu'avant (`PHRASE_COUPURE['delai-saute']`). Cache, `degraded`, forme d'`AiTaskResult` (`model: SCAN_MODEL`) et autres chemins d'`aiTask` : diff limité à `scanInvoiceSafely`.

## Q5 — Pannes : OK
Flash-Lite en délai ou refusée (503) → la 3.8 est appelée (mon test + ceux de l'auteur) ; au pire 45 s + 45 s < 100 s, et la 3.8 porte aussi le signal global ; délai global atteint → 3.8 sautée, « delai-saute » dit. 3.8 en échec après désaccord ou après une Flash-Lite manquante → repli avec coupure dite (`lecture-coupee`, `luTexte`). Jamais « Lecture indisponible » quand la 3.8 a lu : seule l'absence totale de lecture lève (erreur de la première lecture rejetée).

## Q6 — Tests : OK
Contre A (`headsrc`) : 5 fichiers rouges, 37 tests en échec (Csv8 15+, Budget 5, Transport 6, banc 5, lecture-coupee 3), sur des écarts réels (modèle de l'URL, appels 2 au lieu de 3, 8 192, devise). Les tests adaptés gardent leur intention (relu en diff) : transport, lecture-coupee, banc, et `invoiceReview.test.ts` (3ᵉ réponse ajoutée pour une 3.8 qui échoue aussi, comptes d'appels 3, valeurs de la 3.8). Seul changement de sens, assumé et documenté dans le test : avec trois lectures divergentes, la 3.8 tranche les champs d'en-tête (A gardait la valeur initiale) — c'est `finalOfStarVote` du banc.

## Défauts
Aucun bloquant. Non bloquants, à connaître :
1. `functions/src/models.ts` (hors Possède de fn-csv8) porte un changement de commentaire sur les justificatifs ; l'auteur disait le laisser au pilote : à confirmer que c'est le pilote. Aucun effet sur le code.
2. Non vérifié : `npm --prefix functions run build` — je ne l'ai pas lancé, car il réécrit `source4-portable-bundle-manifest-01.json`, fichier que ma voie ne doit pas toucher ; `tsc -p functions --noEmit` est à 0.
3. Non vérifié : mon propre test n'a pas été rejoué sur A (sa config `vitest.sur-A.config.ts` n'inclut que les tests de l'auteur) ; la preuve « échoue sur A » porte sur les tests de l'auteur.
4. `scripts/eval-expense-vision.mjs` (essai payant) : le plafond d'évaluation s'applique désormais aux trois appels ; à relire avant tout essai réel (signalé par l'auteur, non vérifié par moi).
5. La coupure d'une Flash-Lite remplacée par la 3.8 ne laisse aucune trace à l'écran (vote à deux possible `checked`), seulement les journaux (`coupee`, `model`) : conforme au repli `finalOfLite`, à surveiller après déploiement.

Fichiers de ma voie : `parite-bout-en-bout.test.ts`, `vitest.relecture.config.ts`, `vitest.sur-A.config.ts` (la copie de HEAD se refait par `git archive HEAD functions/src | tar -x -C "$TMP/headsrc"`). Si ces tests doivent entrer dans `tests/`, je le propose (ils ne dépendent que d'imports relatifs).

LEÇON PROPOSÉE : aucune

FN-RELECTURE ACCEPTE — parité de bout en bout avec le banc sur 29 cas + 300 tirages, N, appels, budget et pannes conformes, 626 tests verts, tsc 0 ; build et mon test sur A non vérifiés (défauts non bloquants)
