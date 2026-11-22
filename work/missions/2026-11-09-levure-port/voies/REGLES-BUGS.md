# Règles communes des voies de bugs (b-dep, b-stock, b-divers, b-houblons, b-assistant), 09.11

Ses mots : « Et fait les fixes », « Tout les fixe ». Tu reçois la liste des bugs ouverts de ta zone : `BUGS-<zone>.md` dans ton
dossier (extrait de `work/missions/BUGS.md`). Lis d'abord `CLAUDE.md`, `cerveau/LECONS.md` (L11, L12, L13, L17, L28 surtout),
et pour une interface `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md`.

## Pour chaque bug, dans l'ordre B, puis G, puis D ; les notes (gravité « — ») en dernier
1. **Existe-t-il encore ?** Lis le code actuel (HEAD), et rejoue le geste quand il le faut (test, ou banc `?dev-local` dans Chrome
   sans écran, skill `webapp-testing` ; jamais l'app en ligne, jamais de données réelles).
   - S'il n'existe plus : `déjà corrigé`, avec la preuve (commit ou ligne de code).
   - Une note sans constat jouable : `non jouable`, avec la raison.
2. **Un test qui échoue d'abord** (L13) : unitaire ou d'intégration, sur la version actuelle. Ensuite seulement, corriger.
   - Un défaut visuel : une capture avant et après, ouvertes et regardées (L12).
3. **Corriger à la cause**, sans couche parallèle ni rustine. À la deuxième rustine sur un même module, arrête-toi et écris le
   problème type (L29).
4. **Hors de ta zone, ou choix de goût du brasseur** : `à trancher`, avec la question en une ligne. Une maquette choisie
   (`work/refonte-frontend/v4/choix/ecrans-app.json`) fait foi (règle n° 1).

## Interdits
- `src/pages/BrewWizard.tsx` au bloc Levure ; `src/ui/etapeLevure/**`, `src/domain/levure/**` (voies u1, u2, d1) ; `src/App.tsx` (u1).
  Un bug qui demande ces fichiers : `à trancher`, et dis pourquoi.
- Les fichiers protégés :
  - `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json` ;
  - `functions/.env`, `functions/.secret.local`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `firebase.json` ;
  - le déploiement ; Gemini réel ; les données réelles.
- `work/missions/BUGS.md` : c'est le pilote qui l'écrit à partir de ton RESULTAT.md.
- `git commit`, `git stash`, `git checkout -- <fichier>` : le pilote commite par chemins.

## Contrôles avant de rendre
- `npx tsc --noEmit -p .` : aucune erreur nouvelle dans tes fichiers.
- `npx vitest run <tes tests et les tests des fichiers touchés>` : vert. Rends la ligne « Tests … » telle quelle.
- `git status --short` : seulement tes fichiers (L17).

Tests et serveur de développement se lancent dans ce dépôt (dépendances complètes depuis le 09.11). D'autres agents travaillent en même temps : vitest avec `--maxWorkers=2`, un port de serveur à toi (`PORT=56xx`), lancé et arrêté par toi.

## RESULTAT.md (dans ton dossier)
Un tableau `| id | issue | preuve (test, capture, commit ou ligne) | fichiers |`, où issue vaut l'un de :
- corrigé ;
- déjà corrigé ;
- non jouable ;
- à trancher : <question> ;
- doublon de <id>.

Puis les fichiers modifiés, les tests ajoutés, et les lignes `LEÇON PROPOSÉE :` ou `CONNAISSANCE :`. Rends une ligne.
