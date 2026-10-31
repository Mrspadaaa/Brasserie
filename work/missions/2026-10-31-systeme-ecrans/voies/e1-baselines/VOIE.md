# Voie e1-baselines — figer ce que le brasseur a validé

Agent : auteur (Sonnet). Un outil de contrôle, rien dans `src/`. Écris RESULTAT.md tôt.

## Pourquoi
Le risque du programme « refaire tous les écrans », c'est qu'un écran déjà choisi régresse. Le rail a déjà perdu des fonctions (D124,
M16). Une capture de référence par écran et par état, comparée automatiquement, complète les `controle-*.mjs`. Elle ne remplace jamais le
regard (L12) : un écart se signale, puis se regarde.

## Ce qui est demandé
1. `scripts/agents/baseline-visuelle.mjs`, avec deux modes :
   - `--prendre` capture les références ;
   - `--comparer` capture de nouveau et compare.
   Le diff de pixels se fait **dans Chrome** : on charge les deux PNG dans un canvas et on compare les données. Aucune dépendance neuve
   (pas de pixelmatch ni de pngjs). Prévois :
   - une tolérance par pixel et en part de l'image ;
   - des masques par sélecteur, pour une heure ou un compteur qui bouge ;
   - une image de diff écrite à côté, que l'on ouvre.
2. Les écrans, et pas leurs noms : prends les écrans **choisis** de `work/refonte-frontend/v4/choix/ecrans.json` (7 au statut « choisi »),
   dans l'app à 390 × 844. Pour chacun, une capture au repos et ses états principaux : liste vide, ouvert, Absolu, radar…
   - Réemploie les gestes des contrôles existants : `tests/integration/controle-*.mjs` et
     `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/ecran-bannir.mjs`.
   - Mets les écrans et leurs états dans un fichier de cas lisible, `scripts/agents/baseline-cas.json`.
3. Les références vont dans `work/refonte-frontend/v4/choix/baselines/<ecran>/<etat>.png`, avec un `MANIFESTE.json` : commit de prise,
   date, viewport, tolérance.
4. Les serveurs tournent **dans la copie `C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans`**, au commit de production ae7c7a8d. Les
   références sont donc celles de la production. Ton code et tes sorties restent dans l'arbre principal. N'y modifie aucun fichier suivi.

## Critères
- `--prendre` puis `--comparer` sur la même copie : `BASELINE OK`, tous les écarts sous la tolérance. Fais-le deux fois pour mesurer la
  stabilité : polices, animations.
- Témoin négatif : un écart volontaire dans la copie, puis remis. Par exemple, un CSS injecté par la page de test, sans fichier modifié,
  qui décale un bloc de 8 px. Attendu : `BASELINE ECHEC`, avec l'image de diff. Ouvre-la (L12).
- Les images de référence ouvertes une à une, avec une ligne par image dans RESULTAT.md.
- Un mode d'emploi court dans RESULTAT.md, et une ligne à ajouter dans `docs/agents/systeme.md` (§ contrôles), proposée sans l'écrire.

## Possède
- `scripts/agents/baseline-visuelle.mjs`, `scripts/agents/baseline-cas.json`.
- `work/refonte-frontend/v4/choix/baselines/`.
- `work/missions/2026-10-31-systeme-ecrans/voies/e1-baselines/`.

N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
