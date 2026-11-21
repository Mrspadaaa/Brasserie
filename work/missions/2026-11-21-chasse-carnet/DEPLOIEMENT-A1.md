# Déploiement A1 : lecture des liens du Carnet (21.11)

Accord du brasseur (21.11, « Oui évidemment ») : mettre en ligne la lecture des liens du Carnet (A1), pour que le prix arrive.
Code : worktree `port-carnet`, branche `claude/port-carnet-1711`, commit `e26a46f36` (`functions/src/lireLien.ts`, `functions/src/carnetIA.ts`).

## Verdict : NON DÉPLOYÉ (arrêt au point 3)

Le diff de `functions/` entre la version en ligne et `e26a46f36` ne se limite pas à la lecture des liens et du carnet.
Déployer `aiTask` depuis `e26a46f36` mettrait aussi en ligne quatre changements de la lecture des factures, que l'accord A1 ne couvre pas.

## Fonction concernée

- `lireLien` et `carnetIA` ne sont importés que par `functions/src/ai.ts`, exporté comme `aiTask` (`functions/src/index.ts:9`). Seule fonction à redéployer : `aiTask`.

## Ce qui est en ligne (lecture seule)

- `functions_list_functions` : 40 fonctions, `aiTask` v2 callable, europe-west6, 512 Mo, nodejs22.
- Journal d'audit (`UpdateFunction`) : dernier déploiement d'`aiTask` le 2026-11-18 13:55:19 UTC (14:55 heure suisse), révision `aitask-00080-wol`, `firebase-functions-hash` `cee0765c94d002e3498dbb90359d9162786b199c`. Les requêtes du 21.11 à 20:14 UTC portent toujours ce hash, et la tâche `rangerCarnet` y tourne déjà (gemini-3.8-flash, 2,2 s).
- Commit le plus probable : `dfdcd6977` (18.11 14:51, « Carnet : la tâche du carnet passe par geminiBody »), dernier commit de `functions/` avant le déploiement de 14:55. Aucun tag `aitask/*` ni journal écrit pour ce déploiement. Le dernier tag `aitask/` date du 15.11 (`aitask/2026-11-15-rangernote`). Les tags `en-ligne/2026-11-19…21-tour*` correspondent à l'hébergement : `aiTask` n'a pas bougé depuis le 18.11.

## Diff de `functions/` entre `dfdcd6977` (en ligne) et `e26a46f36`

6 fichiers modifiés, 220 lignes ajoutées et 41 supprimées. `package.json`, `package-lock.json` et `tsconfig.json` de `functions` n'ont pas changé.

Carnet (couvert par A1) :
- `lireLien.ts` (+100/−14) : prix localisé, « dès », entités, libellés (`e26a46f36`).
- `carnetIA.ts` (+2) : champ `prixDes?: boolean` dans `PageLue`.

Autres changements, hors A1, tous dans la lecture des factures :
1. `9c2966ba1` (20.11, SU-NOTE-6) : `aiTaskDeadline.ts` et `ai.ts`. La 3.8 passe à 60 s, les Flash-Lite restent à 45 s, le total reste à 100 s.
2. `fc0d78b32`, `29177f4b3` et `cacacd120` (20.11, g1, LR3-1, LR1-8, LR2-6 et LR2-9) : `invoiceScanCore.ts` et `invoiceVisionReview.ts`. Une ligne sans montant vaut 0,00 « déduit (somme = total) », la quantité « 1 » déduite d'un ticket est retirée. Changement côté serveur, avec sa part côté client (brouillon, jaune « repris »).
3. `424a074c0` (20.11, al1) : `invoiceVisionReview.ts`. Les lignes de deux lectures sont alignées par Needleman-Wunsch, à la place du rapprochement par la référence.
4. `02bdcffba` (21.11, D273c) : `invoiceScanCore.ts`. L'empreinte du moteur lit la source des modules générés. Au déploiement, toutes les lectures gardées en cache deviennent inaccessibles : chaque pièce renvoyée sera relue et payée.

Ces quatre changements modifient la lecture réelle de ses factures, et le 4 invalide le cache. Le passé du projet (D278, D267, D257) montre qu'un redéploiement d'`aiTask` qui touche la lecture demande son accord propre, ou un banc sans perte. Ils ne sont donc pas « sûrs » au sens du brief.

## Rien n'a été fait

Aucun worktree créé, aucun test ni build lancé, aucun déploiement. `firestore.rules`, `.firebaserc`, les index, `functions/.env` et `.secret.local` n'ont été ni lus ni touchés.

## Options pour le pilote

- A (prudente, couverte par A1) : déployer le carnet seul, sur la version en ligne. Partir d'une branche sur `dfdcd6977`, puis `git checkout e26a46f36 -- functions/src/lireLien.ts functions/src/carnetIA.ts`, et committer. Les deux fichiers n'importent rien de neuf : `cheerio/slim`, `stockStatus` de `brewerSuppliers` (inchangé) et le type `PageLue`. `ai.ts` n'a pas changé côté carnet. Ensuite : `npx vitest run tests/unit/carnetsLireLien.test.ts`, build de `functions`, puis `firebase deploy --only functions:aiTask --project brasserie-l-affinee`. Retour arrière : redéployer depuis `dfdcd6977`.
- B : demander au brasseur l'accord pour les quatre changements de lecture (le 4 coûte des relectures), après un banc de lecture sur les pièces réelles (skill `banc-lecture`). Ensuite, déployer `e26a46f36` tel quel.
