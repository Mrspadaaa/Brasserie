OK — Approfondi (Hydrogen moyen) et diagnostic de brassin (Hydrogen bas) branchés ; deploy/h4-compagnon 3035173e, deploy/h4-aitask 04ee5168 prêts, rien déployé

## Commandes de déploiement (deux fonctions, une chacune)
```
# (a) Approfondi du compagnon
cd C:\Users\mrspa\AppData\Local\Temp\deploy-h4-compagnon
copy <dépôt>\functions\.env functions\.env        # gitignoré, absent du dossier neuf ; non lu ni copié par moi
npx firebase deploy --only functions:processBrewerQuestion --project brasserie-l-affinee

# (b) Diagnostic de brassin
cd C:\Users\mrspa\AppData\Local\Temp\deploy-h4-aitask
copy <dépôt>\functions\.env functions\.env
npx firebase deploy --only functions:aiTask --project brasserie-l-affinee
```
- `processBrewerQuestion` (compagnon, Approfondi compris) ne partage rien avec `aiTask` : deux sources, deux dossiers, deux déploiements indépendants. `deploy-h4-compagnon` part du tag `compagnon/2026-11-14-hydrogen` (= ce qui est EN LIGNE depuis h3, b3786bf9) ; `deploy-h4-aitask` du tag `aitask/2026-11-14-hydrogen` (717c1253, en ligne depuis h2). Chaque dossier ne contient donc que son changement.
- `firebase.json` lance `npm run build` en predeploy et réécrit `source4-portable-bundle-manifest-01.json` (tracké) : le remettre ensuite avec `git checkout --` dans le dossier, jamais le commiter. Je l'ai remis dans les deux dossiers après mon build ; `git status` y est propre (hors fichiers ignorés).
- Après chaque déploiement : `functions:list` (une nouvelle génération pour la seule fonction visée), puis un essai « ZZ TEST » : (a) une question en mode Approfondi, la carte doit afficher `gemini-4-hydrogen` à l'analyse et `gemini-3.8-flash` à la relecture ; (b) « Diagnostiquer » sur un brassin de test, la réponse porte `model: gemini-4-hydrogen` (journal `Tâche IA exécutée`).
- Dossiers : jonctions `node_modules` (racine et `functions/`) vers `deploy-h2`, `seedData.ts` copié de l'exemple (ignoré) : ne pas supprimer avec `rm -rf` ; `rmdir` sur les jonctions d'abord.

## SHA
- Branche courante `claude/refonte-houblons-v4` : **ccb016a1** (a : `functions/src/brewerHarness.ts`, `functions/src/models.ts` commentaires, `tests/unit/brewerHarness.test.ts`, `tests/unit/brewerFlashLimits.test.ts`) puis **18193242** (b : `functions/src/models.ts`, `functions/src/ai.ts`, `tests/unit/geminiModelRouting.test.ts`, `tests/unit/modelsCompagnon.test.ts`). `source4-portable-bundle-manifest-01.json` non commité.
- `deploy/h4-compagnon` : **3035173e** = tag compagnon (b3786bf9) + cherry-pick de ccb016a1, sans conflit.
- `deploy/h4-aitask` : **04ee5168** = tag aitask (717c1253) + cherry-pick de 18193242. Un conflit : `tests/unit/modelsCompagnon.test.ts` n'existe pas sur ce tag (fichier de h3) ; je l'ai écarté de ce commit, ses assertions de route sont reprises dans `geminiModelRouting.test.ts` (qui, lui, est sur le tag).
- Commits terminés par « Co-Authored-By: Claude Opus 5.5 » comme demandé par VOIE.md (le modèle réel de cette voie est Sonnet 5.5).

## (a) Approfondi : ce qui change (`brewerHarness.ts`)
- Le rôle analyse, mode `deep`, passe par `brewerAnalysisAttempts()` comme hors Approfondi : Hydrogen d'abord, repli une fois sur 3.8 (et, après un échec d'Hydrogen, les étapes suivantes restent sur 3.8, comme en h3).
- Niveau : Hydrogen en `medium` à toutes les étapes d'analyse (décision, suites, réparation), au lieu de `high` à la décision ; hors Approfondi `low`, inchangé. Si Hydrogen flanche, la 3.8 reprend l'ancienne règle d'Approfondi (haute à la décision et à la réparation, moyenne aux suites, 12 000 jetons). Relecture 3.8 inchangée (haute si conseil refusé/sensible, sinon moyenne), recherche inchangée.
- Plafond de sortie 12 000 inchangé (le même que la production ; `quoteGeminiCost` l'accepte pour Hydrogen).
- Délai : Hydrogen coupé à **40 s** en Approfondi (25 s ailleurs) dans les 60 s de l'appel ; mesure t2c : p50 14,0 s, p90 23,3 s (6 cas, un tirage). Il reste 20 s à la 3.8 pour le repli.
- L'invite système du mode disait « Gemini 3.8 Flash assure analyse et relecture » : mise à jour (Hydrogen analyse en réflexion moyenne, 3.8 relit).
- Non touché : `src/` (libellés « vérifié avec Flash » de la carte, déjà signalés en h3).

## (b) Diagnostic de brassin en Rapide : ce qui change (`models.ts`, `ai.ts`)
- Route : **Hydrogen `low`, puis Flash-Lite `low` (la production d'aujourd'hui), puis 3.8 `low`.** Choix défendable et le plus court à tenir : Flash-Lite est déjà en production et mesuré (94 %, p50 1,5 s) ; il sert de repli rapide si Hydrogen est en panne, sans attendre 5 s de plus, et la 3.8 ferme la chaîne comme avant. Option plus simple si tu préfères : Hydrogen puis 3.8 seulement (deux essais, comme le compagnon) ; non retenue car le premier repli gagne ~3 s et reste mesuré.
- `geminiAttempts('diagnoseBatch', 'fast')` renvoie `diagnosticAttempts()` ; Max (`tier: 'max'`) garde 3.8 `high` deux fois ; `readHopCoa`, recherche de référence et tous les autres usages inchangés. `LITE_ROUTES.diagnoseBatch` est conservé : il fixe la réflexion du repli Flash-Lite.
- `ai.ts` (boucle de `aiTask`, route du diagnostic seulement par effet) : Hydrogen est traité comme Flash-Lite pour la reprise : réponse coupée/illisible/refus de schéma (HTTP 400)/panne → essai suivant sans redemander au brasseur ; son essai est coupé à `DIAGNOSTIC_STRONG_TIMEOUT_MS` = **20 s** (p90 mesuré 6,4 s) et ce délai-là ne termine pas la tâche (les 120 s restent bornées par `AI_TASK_DEADLINE_MS`) ; un refus de budget ou d'accès n'est jamais contourné. Réponse Hydrogen « terminée autrement que STOP » = inutilisable (comme Flash-Lite).
- Mesure t2b : Hydrogen 100 % juste (14/14) contre 94 % pour Flash-Lite, seul à tenir le cas « lager sous-ensemencé » ; p50 4,7 s contre 1,5 s ; 0,0103 contre 0,0010 CHF l'appel (même tarif que 3.8).

## Critères
- L13, rouges sur HEAD : `tests-rouge-sur-head.txt`, 4 fichiers (harnais, limites, modèles du compagnon, routage Gemini) avec les sources de HEAD et les tests de h4 : **19 échecs sur 116** (brewerHarness 6, brewerFlashLimits 1, geminiModelRouting 11, modelsCompagnon 1). Verts après : les mêmes 4 fichiers, **116/116**.
- Commande de VOIE.md (branche courante) : `tests.txt` : 5 fichiers (`brewerHarness`, `brewerFlashLimits`, `modelsCompagnon`, `aiClientYeastGuard`, `aiTaskMonthlyBudget` ; `tests/unit/models*` ne trouve que `modelsCompagnon`, et `ai*` deux fichiers), **92/92 verts**. `geminiModelRouting` n'entre dans aucun des motifs : je l'ai rejoué à part (dans les 116).
- tsc : branche courante `tsc -p .` 0 et `-p functions` 0 (`tsc-racine.txt`, `tsc-functions.txt`) ; `deploy-h4-aitask` et `deploy-h4-compagnon` : 0 et 0 (`tsc-*-aitask.txt`, `tsc-*-compagnon.txt`).
- Tests ciblés dans chaque dossier (gemini*, ai*, brewer*, d100*, models*, monthlyAiBudget, invoiceScan*) : aitask **729/729** (58 fichiers), compagnon **732/732** (59) : `tests-deploy-aitask.txt`, `tests-deploy-compagnon.txt`.
- `npm --prefix functions run build` : 0 dans les deux dossiers (`build-aitask.txt`, `build-compagnon.txt`) ; `lib/models.js` contient `diagnosticAttempts`, `lib/ai.js` `DIAGNOSTIC_STRONG_TIMEOUT_MS`, `lib/brewerHarness.js` `brewerAnalysisAttempts`.
- Suite complète contre le socle nu : 11 rouges identiques aux socles, aucun nouveau (voir « SUITES »).
- Aucun appel Gemini, aucun déploiement, aucun push, aucun stash ; `functions/.env` et `.secret.local` non lus.

## SUITES (suite complète, comparée au socle nu ; terminée)
- `deploy-h4-aitask` (`suite-aitask.txt`, 1 490 s) : 11 rouges, 13 205 verts. Socle nu = tag aitask 717c1253, mesuré en h3 : 11 rouges, 13 196 verts. `diff suite-aitask.fails ../h3/suite-base.fails` : vide. +9 verts = tests ajoutés par la voie.
- `deploy-h4-compagnon` (`suite-compagnon.txt`, 1 341 s) : 11 rouges, 13 208 verts. Socle nu = tag compagnon b3786bf9, mesuré en h3 : 11 rouges, 13 204 verts. `diff suite-compagnon.fails ../h3/suite-h3.fails` : vide. +4 verts = tests ajoutés par la voie.
- Les 11 rouges sont les mêmes qu'en h2 et h3 (invoiceReview 1, recipeAiWorkflow 2, recipeEditing 6, designTokens 1, virgule-transversale 1). Aucun rouge nouveau.
- Les socles nus n'ont pas été rejoués : leurs mesures de h3 portent sur les mêmes commits.

## Essais
Tests de la voie : 2 essais (un dossier de test lisait `diagnosis` pour le délai de Flash-Lite : repris sur `readHopCoa`). Un incident de manipulation : un `git add -N .` de ma part a marqué en « intent to add » les fichiers non suivis ; annulé aussitôt par `git reset -q` (index remis à HEAD, aucun fichier du dépôt modifié ni perdu ; avant comme après, aucun fichier n'était indexé).

## Doutes et limites
- Un tirage, 6 cas de jugement pour l'Approfondi (t2c, juge = l'auteur, l'écart de qualité de 0,07 est dans le bruit) : le seul résultat solide est le gain de coût (−53 %) et de durée (p90 ÷ 3). Second tirage conseillé par t2c (≈ 1 CHF, hors budget de la voie, non joué ici).
- Diagnostic : 10 cas fictifs, 14 appels ; +0,009 CHF et +3 s par bouton explicite pour +6 points de justesse. Bouton « Diagnostiquer » du jour de brassage : `BrewDayPage.tsx:382`.
- En Approfondi, si Hydrogen est coupé à 40 s, la 3.8 n'a que 20 s sur les 60 s de l'appel : sa décision haute a eu un p90 de 70 s en production. Le cas est rare (p90 d'Hydrogen 23 s) ; il se traduirait par une erreur de délai, comme un Approfondi lent aujourd'hui.
- La bascule en milieu de question d'Approfondi (étape 2 sur 3.8 avec les `thoughtSignature` d'Hydrogen dans l'historique) n'est couverte que par des tests simulés, comme en h3 : à regarder au premier essai réel.
- La source en ligne n'a pas été téléchargée (ni `gcloud` ni `gsutil`) : l'identité de chaque tag avec ce qui tourne est déduite des commits (h2 et h3 ont déployé ces tags).
- Le critère « tests sur HEAD rouges » compte les 4 fichiers touchés, pas les 5 de la commande de VOIE.md : les deux fichiers `ai*` ne changent pas.
- `src/` : les libellés de la carte du compagnon ne disent pas Hydrogen (hors de ma voie).

DÉCISION À PRENDRE : aucune bloquante. Recommandation : déployer (b) `aiTask` puis (a) `processBrewerQuestion` quand le brasseur est d'accord, un à la fois, avec un essai « ZZ TEST » après chacun ; (b) est peu risqué (bouton explicite, repli en 3 temps), (a) à rejouer deux fois en Approfondi avant de le garder.
CONNAISSANCE : en Approfondi, avec Hydrogen, `thinkingLevel` suit une règle plate (medium) : l'ancien « haut à la décision » appartenait à la 3.8 et reste son repli ; `aiTask` n'a que le diagnostic de brassin sur Hydrogen, la 3ᵉ lecture des justificatifs étant dans `invoiceScanVote.ts`.
LEÇON PROPOSÉE : aucune
