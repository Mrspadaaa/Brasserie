OK — Analyse du compagnon sur Hydrogen@low (repli 3.8) : branche courante dc5c7385, deploy/h3-compagnon b3786bf9 ; à déployer : processBrewerQuestion seule

## Commande de déploiement (liste vérifiée)
```
cd C:\Users\mrspa\AppData\Local\Temp\deploy-h3
copy <dépôt>\functions\.env functions\.env        # gitignoré, absent du dossier neuf ; non lu ni copié par moi
npx firebase deploy --only functions:processBrewerQuestion --project brasserie-l-affinee
```
- **Une seule fonction.** Seul `processBrewerJobTask` appelle `runBrewerHarness` (`brewerJobs.ts:414`). En ligne, il n'est exposé que par `processBrewerQuestion` (tâche Cloud Tasks, europe-west6, source du 09.11 02:22 UTC, gén. 1794190970125784). `askBrewer`, `dispatchBrewerQuestion` et `retryBrewerQuestion` ne font que mettre en file : aucun appel Gemini, rien à redéployer.
- `processBrewerHopAdviceV1` (voie « houblon assistée », même harnais) est dans le code mais PAS en ligne (absent de `functions:list`) : hors liste, un `--only functions` global la créerait. `dispatchBrewerHopAdviceV1` et `notifyBrewerHopAdviceAnswerV1` : hors liste (jamais).
- `firebase.json` lance `npm run build` en predeploy : il réécrit `source4-portable-bundle-manifest-01.json` dans `deploy-h3` (tracké ; le remettre avec `git checkout --` après, ne pas commiter). `aiTask` (14.11) n'est pas touchée.
- Après le déploiement : `functions:list` doit montrer une nouvelle génération pour `processBrewerQuestion` seule, et `AUTHORIZED_ACCOUNTS` présent (le journal de h2 disait « AUTHORIZED_ACCOUNTS est vide » : sans `functions/.env` dans le dossier, la passerelle refuserait tout le monde). Puis jouer une question du compagnon (« ZZ TEST ») et lire dans la carte le modèle `gemini-4-hydrogen` ; tout appel qui bascule sur 3.8 laisse `gemini-3.8-flash`.

## SHA
- Branche courante `claude/refonte-houblons-v4` : **dc5c7385** (5 fichiers : `functions/src/models.ts`, `functions/src/brewerHarness.ts`, `tests/unit/brewerHarness.test.ts`, `tests/unit/brewerFlashLimits.test.ts`, nouveau `tests/unit/modelsCompagnon.test.ts`). `source4-portable-bundle-manifest-01.json` non commité.
- `deploy/h3-compagnon` : **b3786bf99d87334971b80591d6dd1348b1e4005b** = `aitask/2026-11-14-hydrogen` (717c1253) + cherry-pick de dc5c7385 (même patch-id `2d648ab81a43`, sans conflit). Dossier : `C:\Users\mrspa\AppData\Local\Temp\deploy-h3` ; référence nue : `deploy-h3-base` (tag seul). Les deux ont des jonctions `node_modules` (racine et `functions/`) vers `deploy-h2` et un `seedData.ts` copié de l'exemple (ignoré par Git) : ne pas supprimer avec `rm -rf`, `rmdir` sur les jonctions d'abord. `git status` propre dans `deploy-h3`.
- Commits terminés par « Co-Authored-By: Claude Sonnet 5.5 » (le modèle réel de cette voie), non « Opus 5.5 » comme écrit dans VOIE.md.

## Pourquoi le tag `aitask/2026-11-14-hydrogen` comme socle
`functions/src` entre le dernier commit d'avant le 09.11 03:22 (8f9afa75) et 717c1253 ne diffère que par `ai.ts`, `geminiCosts.ts`, `invoice*.ts`, `models.ts`, `prompts.ts` (pièces justificatives, Hydrogen/Argon, tarifs). `brewerHarness.ts`, `brewerJobs.ts`, `brewerLimits.ts`, `brewerResearch.ts`, `brewerReview.ts` ont les mêmes blobs git sur 717c1253, a48789d9, a59b9dfb, c76481aa. `prompts.ts` n'ajoute que des consignes de facture ; `geminiCosts.ts` apporte le tarif Hydrogen (1,5 / 7,5 $, comme 3.8) dont le garde-fou de coût a besoin. Le tag a Hydrogen dans `models.ts` : le changement se porte tel quel.

## Changement (mêmes sur la branche et sur deploy/h3)
- `models.ts` : `brewerAnalysisAttempts()` = Hydrogen `low`, puis 3.8 `low`, une fois. `geminiAttempts()` n'est pas touchée (`ai.ts` l'appelle aussi : aucune autre route ne bouge).
- `brewerHarness.ts` : le rôle `analysis` hors mode Approfondi prend cette route. Relecture, recherche, Flash-Lite de la référence et Approfondi (analyse haute) inchangés. Plafond de sortie de l'analyse inchangé (4 000, comme au banc g2).
- Ajouts de robustesse (au-delà du diff de g2) : Hydrogen coupé à 25 s (p90 mesuré 14,9 s, max 20 s) pour laisser 20 s à la 3.8 dans les 45 s de l'appel ; réponse vide ou coupée (`MAX_TOKENS`, `unusableGeminiOutput`) reprise sur 3.8 ; refus 400 d'Hydrogen repris sur 3.8 ; après un échec d'Hydrogen, les étapes d'analyse suivantes de la même question restent sur 3.8 (pas de 25 s perdus à chaque outil). Un refus de budget n'est jamais contourné.
- Tests : 8 de plus (5 route/repli/budget, 1 coupure à 25 s, 2 ordre d'essai) ; 19 anciens ajustés aux nouveaux modèles par position (analyse = Hydrogen, relecture/recherche = 3.8).

## Critères
- L13, tests rouges sur HEAD : `tests-rouge-sur-head.txt` : 26 échecs sur 77 (3 fichiers) avec `models.ts`/`brewerHarness.ts` de HEAD ; verts après : `tests.txt`, 3 fichiers, **77 verts**.
- Commande de VOIE.md (branche courante) : `tests.txt` 77/77. Sur `deploy-h3` : `tests-deploy-h3.txt` : 13 fichiers (harnais, limites, modèles, jobs, gemini*, limites, recherche), **203/203 verts**.
- tsc : `tsc -p functions` 0 et `tsc -p .` 0, sur la branche et sur `deploy-h3`. `npm --prefix functions run build` sur `deploy-h3` : 0 (`build.txt`), `lib/brewerHarness.js` importe `brewerAnalysisAttempts`.
- Suite complète contre le socle nu (`suite-h3.txt`, `suite-base.txt`, listes `*.fails`) : `deploy-h3` 11 rouges / 13 204 verts ; `deploy-h3-base` 11 rouges / 13 196 verts ; **les 11 rouges sont identiques** (invoiceReview 1, recipeAiWorkflow 2, recipeEditing 6, designTokens 1, virgule-transversale 1 ; les mêmes que dans h2). +8 verts = mes 8 tests. Aucun rouge nouveau.
- Aucun appel Gemini, aucun déploiement, aucun push. Un seul appel réseau : `firebase functions:list` (lecture).

## Essais
Boucle des tests : 3 essais (modèles attendus mal comptés dans mes propres tests : une relecture au lieu de deux pour un avis non urgent ; le signal d'Hydrogen est dérivé, donc aborté à 25 s). Aucun critère en échec final.

## Doutes et limites
- La source en ligne de `processBrewerQuestion` n'a pas été téléchargée (ni `gcloud` ni `gsutil` ici) : l'identité du harnais avec le tag est déduite des blobs git et de la date (09.11 02:22 UTC), pas lue dans le zip en ligne.
- Le bascule en milieu de question (Hydrogen en panne à l'étape 2 : l'étape 3 sur 3.8 reçoit l'historique avec les `thoughtSignature` d'Hydrogen) n'est couverte que par des tests simulés. Le repli « reste sur 3.8 » le limite à une fois par question ; à regarder au premier essai réel.
- Banc g2 : un tirage par cas, juge = pilote non aveugle sur 9 des 12 cas (g2) ; écart +0,06 modeste. Le banc passait-il par `runBrewerHarness` avec ces délais ? Non vérifié ici.
- La carte du compagnon affiche `t.model` brut (`BrewerChat.tsx` l.1118) : il écrira `gemini-4-hydrogen` ; les libellés « vérifié avec Flash » (l.228-229) ne mentionnent pas Hydrogen : hors de ma voie (`src/`), à décider.
- Les tarifs Hydrogen (1,5 / 7,5 $) viennent de g2 / `geminiCosts.ts`, non revérifiés.
- `functions/.env` : non lu, non copié (consigne).

DÉCISION À PRENDRE : aucune bloquante. Recommandation : copier `functions/.env` dans `deploy-h3/functions`, déployer `functions:processBrewerQuestion` seule, jouer une question « ZZ TEST » et relire le modèle affiché. Libellés de l'UI (« Flash ») : à trancher à part.
CONNAISSANCE : une seule fonction en ligne exécute le compagnon (`processBrewerQuestion`) ; la voie « houblon assistée » (`processBrewerHopAdviceV1`) n'est pas déployée. Le harnais du compagnon est resté identique du 08.11 au 14.11 hors `models.ts`.
LEÇON PROPOSÉE : aucune
