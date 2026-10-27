# Voie t2-typicite-defaut — la typicité du style devient le défaut

Agent : auteur (Sonnet). Le moteur et son câblage, pas l'écran. La voie s'arrête au code, aux tests, au build, aux états de la maquette et
aux mesures. Pour la suite mécanique, écris une `DEMANDE EXECUTANT :`.

## Décision du pilote (D120, `work/refonte-frontend/decisions.md`)
La typicité seule (`typicite: true`, `intensite: false`) devient le défaut de `proposeVoies`. C'est réversible : l'option reste.
- Elle ramène East Kent Goldings en tête du stout S1. C'est l'acquis D105 : « Goldings ou Celeia devant Citra cryo ». f8 le masquait par
  `departage: 'aucun'` dans ses tests.
- En Double IPA, elle fait mieux en tropicaux (2 de ses 6 au lieu de 1).
- Elle ne pousse pas Citra cryo (D174).
A3 reste une option, éteinte : avec la typicité, il remonte Citra cryo. Le brasseur verra les quatre combinaisons en mini maquettes et
choisira ; tu ne fais rien pour l'écran.

## Base, à lire
- `voies/f9-intensite-typicite/RESULTAT.md` en entier, dont « Le worker n'est pas câblé » et les causes mesurées.
- `src/domain/hopIndex/v4/typicite-acces.ts`, `typicite.ts`, `voies.ts`, `departage.ts` (commit 372b9be5).
- La convention des attendus d'états : `voies/e3-etats-donnees/RESULTAT.md`. `verif.attendu` prend la nouvelle valeur ;
  `verif.choisie` garde l'ancienne, jouée sur la maquette choisie ; `verif.note` dit pourquoi.

## Ce qui est demandé
1. Le défaut `TYPICITE_DEFAUT = true`.
2. Le câblage. Charge la table (`chargerTypicite()`) dans le worker (`src/ui/hopIndex/parcours/donneesWorker.ts`). Charge-la aussi sur le
   fil principal, partout où `proposeVoies` y tourne encore.
   - Le chargement part avec la préchauffe, au montage de l'étape, avant l'ouverture de Suggérer.
   - La liste ne saute pas quand la table arrive. Prends le modèle de `siCataloguePleinArrive` : caches vidés, puis la configuration rejouée
     avant le premier affichage.
   - Hors ligne : la table est servie comme les autres morceaux, et le précache de la PWA l'inclut (vérifie-le).
3. Retire le masque `departage: 'aucun'` des tests D105 : ils doivent tenir avec le défaut.
4. Adapte les empreintes du banc et les tests que le changement impose, chacun avec la raison « D120 ».
5. Reconstruis la maquette, puis lance les états :
   `node prototypes/houblons-v4/parcours/outils/construire.mjs`, puis
   `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours`.
   - `etat-acquis-picto-epice` et `etat-sugg-gr5-cran` repassent tels quels.
   - Dans `etat-acquis-q2b-suite-s5`, « Hallertau Tradition » et « Huell Melon » venaient de l'ordre alphabétique de l'ancien départage.
     Ils s'actualisent selon la convention e3, avec la note « D120 ». « East Kent Goldings » reste attendu.
   - Lance aussi `--choisie` : le témoin positif reste vert.

## Critères
- `ETATS OK` (138 sur 138, ou le total courant), avec et sans `--choisie`.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : vert.
- `npx tsc --noEmit` : sans sortie. `npm run build` avec `VITE_HOP_V4=on` : vert.
- `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` : ta part n'ajoute rien à B5. B5 est à 164,9 ko et c'est la
  voie c8 qui le ramène sous le plafond ; donne la valeur.
- `node work/missions/2026-10-25-integration-houblons/voies/w1-worker-app/fumee-worker-prod.mjs` : `WORKER PROD OK`.
- `npm run check:hop-perf` : pas de dépassement nouveau (les 6 de la référence restent tolérés).
- Non-régressions, en tableau avant/après :
  - `npx vite-node scripts/eval-hop/f9-nonreg.ts`, complet ;
  - `f2-phares.ts`, `f5-phares.ts`, `f2-borne.ts` ;
  - Citra cryo n'est pas premier plus souvent qu'avant ;
  - D106 : le recul de l'usage « arôme » à 60′ tient.

## Possède
- `src/domain/hopIndex/v4/voies.ts`, `departage.ts`, `typicite.ts`, `typicite-acces.ts`, `intensite.ts`.
- `src/ui/hopIndex/parcours/donneesWorker.ts`, `clientWorker.ts`.
- Les tests du moteur concernés (`tests/unit/hopIndexV4/`, `prototypes/houblons-v4/tests/`), et `prototypes/houblons-v4/data/pack-*.json`
  s'ils sont régénérés par `build-pack.ts`.
- Dans `work/refonte-frontend/v4/choix/etats/*.json` : les seuls états concernés.
- `work/missions/2026-10-25-integration-houblons/voies/t2-typicite-defaut/`.

**La voie c8 travaille en même temps.** Elle possède `pouvoir.ts`, `profil-simule.ts`, `froid.ts`, `src/ui/hopIndex/precharge.ts`,
`src/ui/hopIndex/parcours/calcul.worker.ts`, ainsi que les lignes qui importent `composes-houblon.json`. N'y touche pas. Si tu en as
besoin, écris-le dans RESULTAT.md (`BESOIN C8 : …`). Avant ton build final, relis `git status` et `git diff` : les fichiers de c8 bougent.

Ne touche ni à `.codex/`, ni à `source4-portable-bundle-manifest-01.json`, ni à `functions/.env`. Aucun appel Gemini. N'écris aucun code
par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Écris RESULTAT.md tôt et tiens-le à jour. Rends une ligne.

## Build à part (deux voies en même temps)
Les deux voies construisent dans le même arbre. Construis donc dans ton propre dossier, hors du dépôt :
`VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-t2`.
Passe-le aux contrôles : `check-hop-budget.mjs --dist <dossier>` et `fumee-worker-prod.mjs --dist=<dossier>`. Garde `npm run build` (avec `tsc`)
pour ton dernier passage, et relance aussitôt le budget sur `dist`. Lance vitest avec `--maxWorkers=2`.
