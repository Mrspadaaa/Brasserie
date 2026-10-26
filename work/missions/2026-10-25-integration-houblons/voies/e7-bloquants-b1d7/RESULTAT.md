OK — NaN du texte copié corrigé (x2), 6 états Substituer mis à jour (D115), radar-base était un faux rouge ; 138/138

Dépôt de travail : le worktree `claude/refonte-houblons-v4` (HEAD 2cf568d0). `Documents/Brasserie` est sur `main` sans ces commits.

## 1. « NaN » de la graine 11 (vrai bug)
- **Geste fautif** : dans l'assistant, « champ Durée de Froid court ← «  » » (champ vidé). `InlineNum` de la durée de fermentation a `emptyValue={Number.NaN}` (inconnu, voulu). Le texte copié (« Copier la recette en texte », textarea « Texte complet de la recette ») écrivait `NaN j`.
- **Commit** : x2, `7f811c2c`. Bissection jouée sur deux worktrees jetables (le test seul, 3 graines de l'assistant) : `7f811c2c^` → 3/3 verts (graine 11 : 17,4 s) ; `7f811c2c` → graine 11 rouge, même message « NaN dans <textarea aria-label="Texte complet de la recette"> ». u2, u3, w1, c7, f5 : hors cause.
- **Cause** : x2 a réécrit `readableLines` avec des gardes `!= null` (`s.days != null ? `${s.days} j` : 'durée inconnue'`). NaN passe `!= null`. Avant x2, la branche `recipe` passait par `writeRecipeText`, qui ne l'écrivait pas.
- **Correction** (`src/domain/recipeText.ts`) : helper `fini()` (nombre fini) à la place de `!= null` pour tous les nombres optionnels de la partie lisible : durée et température des phases de fermentation, des paliers d'empâtage ; minutes, température et jour de dry hop des houblons ; ébullition ; couleur, PPG, jour, fermentescibilité des fermentescibles ; part en % du grain ; quantité d'un ajout ; OG, FG, ABV, IBU, EBC, rendement. Un champ vide s'écrit « durée inconnue » / « T° inconnue » / « quantité inconnue » ; jamais NaN, jamais 0. Le NaN n'est pas masqué : c'est la valeur inconnue qui est dite.
- **Test neuf** : `tests/unit/recipeTextChampVide.test.ts` (5 cas : phase de fermentation sans durée, sans température ; palier sans T° ni durée ; houblons sans minutes/température/jour ; ébullition et fermentescible vides). Rouge sur HEAD (5/5), vert après.
- **Preuves** : `monkey.test.tsx` complet : 6/6 (assistant 3, 11, 99 ; atelier 1, 7, 42). Les 42 fichiers de tests qui touchent `recipeText`/`recipeTransfer`/export : 42/42, 499 tests. `npx tsc --noEmit` : sans sortie.

## 2. Six états de Substituer
- **La seule différence vient de D115** : à 60′ le face à face ne prend plus Citra cryo (24 g, « aromatique », produit d'arôme) mais Galaxy (35 g, double usage, premier du stock qui suffit). Établi : (a) liste identique à celle d'e6 (Trident 99, Yeoman 99, Helios 97, Centennial 96, Magnat 96, Citra cryo 95, Motueka 80, Galaxy 77) ; (b) cartes, α, β, huiles, fiches lues de Nugget et de Trident identiques (46 g, 59,7 IBU, 9–16 lot 13, 43–54 g, 11–14, 3–8, 4–5, myrcène 27–60, 10 et 2 fiches) ; (c) les six échecs de `controle-etats` portent tous sur un mot de la 3e carte : « 24 g », « aromatique », « 10–15 », « article 24,8 », « Citra cryo 7 », « Radar des citations : … Citra cryo », « 2,7–4,5 », « garde floral (marqué), perd herbacé et terreux » ; (d) w1 ne touche que `substituer/donnees.ts` et `index.tsx` pour Substituer ; p7 (radar) ne change aucun mot. Aucune autre différence trouvée.
- **Mis à jour** (`work/refonte-frontend/v4/choix/etats/substituer.json`, par `maj-e7.mjs`, JSON relu à l'identique avant écriture) : `verif.attendu` des six ; `verif.choisie.attendu` intact (maquette choisie) ; `verif.note` : « e7, 26.10 : D115 : face à face sans produit d'arôme à 60′ … » avec les deux captures. Nouveaux mots : Galaxy, 35 g, « double usage » (plus « aromatique ») ; α « 11–19,8 », « lot 17,2 » ; « Galaxy 5 » ; « Radar des citations : Nugget, Trident, Galaxy » ; β « 5–11,6 » ; ligne de Galaxy « ne cite aucune des trois … cannabis », « Employé en IPA, NEIPA ».
- **Captures regardées** (face, alpha, aromes, radar, beta, style) : `voies/e7-bloquants-b1d7/captures/etat-subst-*-construite.png` ; avant : `voies/e6-ecarts-lot/paires/etat-subst-*.png`.
- Vu en passant, pas touché : la `note` de `etat-subst-actions` dit encore « le pied propose 46 g de Nugget → 24 g de Citra cryo » ; le pied dit « 35 g de Galaxy » ; l'état passe (son attendu est « Ajouter Trident aux achats », « Remplacer », « Citra cryo », ce dernier mot restant dans la liste). À corriger à l'occasion.

## 3. `controle-radar-base.mjs` : faux rouge, rien à corriger
- Les 9 « page absente (comparer/etat.html) » viennent du rejeu : le contrôle veut le dossier construit en argument (`node …/controle-radar-base.mjs <dossier>`) ; sans argument il cherche dans le dossier courant. `data-radar="base"` est intact dans `RadarBase.tsx` (p7 ne l'a pas renommé ni retiré). `RadarBase.tsx` et `radar-base.css` : inchangés par moi.
- Rejeu : `construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-e7` → `CONSTRUIT OK (9 pages)` ; `controle-radar-base.mjs prototypes/houblons-v4/maquettes/parcours-e7` → `RADAR-BASE OK (9 vues)`.

## Critères
- Monkey graine 11 : verte (6/6 du fichier). `npx vitest run tests/unit/hopIndexV4` : 86 fichiers, 802 tests verts.
- `npm run build` : vert (EXIT 0, « built in 20.28s »).
- `RADAR-BASE OK (9 vues)` ; `ETATS OK (138/138)` sur la maquette construite ; témoin `--choisie` : `ETATS OK (138/138)`.

## Essais, doutes, limites
- Un essai par critère, tous passés. Aucune écriture hors de mon périmètre ; `git status` : `recipeText.ts` et `substituer.json` modifiés par moi, le reste de la liste était déjà là.
- **Erreur vitest « Unhandled Error : Timeout calling "onTaskUpdate »** : présente à chaque lancement de `monkey.test.tsx` et de `hopIndexV4` (aussi dans `rejeu-b1d7/03c` et dans `e6-ecarts-lot/vitest-hopindexv4.log`). Tous les tests passent, mais le code de sortie de vitest reste 1. Cause : un test synchrone de 15 à 18 s bloque l'échange du worker avec vitest. Ce n'est pas un test rouge ; je n'y ai pas touché (hors périmètre).
- Fichiers de contrôle de ma voie dans `construire` : la maquette jetable est `prototypes/houblons-v4/maquettes/parcours-e7/` (dossier ignoré par git).
- Deux worktrees jetables de bissection (Temp) supprimés ; `git worktree prune` a refusé de supprimer `.git/worktrees/head` (celui d'une autre session, pas le mien).

## Fichiers écrits
- `src/domain/recipeText.ts` (modifié)
- `tests/unit/recipeTextChampVide.test.ts` (neuf)
- `work/refonte-frontend/v4/choix/etats/substituer.json` (6 états)
- Dossier de la voie : `RESULTAT.md`, `maj-e7.mjs`, `lire-substituer.mjs`, `etats-substituer-montre.log`, `texte-actuel.txt`, `captures/` (14 PNG)

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle à argument (`<dossier construit>`) rejoué sans argument donne « page absente » partout : le rejeu doit citer la commande exacte, et le contrôle devrait refuser un dossier vide par un message d'usage au lieu de lire le dossier courant. Et : `!= null` laisse passer NaN quand un champ vidé vaut `emptyValue = NaN` ; tester `Number.isFinite` pour tout nombre affiché.
