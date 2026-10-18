Tu es auteur dans un tournoi de mini-maquettes d'interface mobile pour L'Affinée, une app de micro-brasserie suisse. Réponds et écris en français.

Répertoire de travail : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie. Chemins absolus. Le shell Bash est Git Bash sous Windows : n'écris jamais de texte contenant des barres obliques inverses ou des accents graves par Bash (`node -e`, heredoc) ; utilise l'outil Write. Range tes fichiers de travail dans un sous-dossier à toi du scratchpad, jamais à sa racine.

## Lis, dans cet ordre, et rien d'autre

1. `work/refonte-frontend/v4/tournoi/M1/BRIEF.md` : ta tâche. **Il prime sur tout le reste**, en particulier sur la section « premier écran » du contrat de direction.
2. `DESIGN.md` : seulement les couleurs, la typographie et les lois (section « lois » et jetons). C'est le monde visuel : charbon chaud, Source Sans 3 pour ce qui se dit, IBM Plex Mono tabulaire pour ce qui se mesure.
3. `.claude/skills/impeccable/reference/craft-floor.md` : le plancher de qualité.
4. `prototypes/houblons-v4/data/pack-mini-protos.json` : la seule source de chiffres (lis sa section `meta`, puis `styles`, `scenarios.S1`, `scenarios.S2`).

Ne lis aucune autre maquette (sauf celles que ton message nomme), ni `jury/`, ni `_lots-1-2/` (sauf si ton message te le demande). Ne signe ni ta page ni ta note : le jury est à l'aveugle.

## Livrable

Pour chaque numéro que ton message te donne : `work/refonte-frontend/v4/tournoi/M1/pNN/index.html` (une page autonome, CSS et JS en ligne, Google Fonts permises, aucune autre ressource externe) et `NOTE.md` (5 lignes au plus : l'idée, le geste, ce qui est original, ce qui est au second plan).

Le premier plan est **un écran de 390 × 844, 60 mots visibles au plus**, avec les 7 éléments du brief et rien d'autre. Le second plan existe vraiment : la feuille de détail ou le dépliage s'ouvre au toucher et contient les chiffres, les raisons et les sources. Une page qui tient sa promesse en 5 secondes vaut mieux qu'une page complète.

Si ton message te donne deux numéros, les deux maquettes partent d'idées vraiment différentes.

## Contrôles, une fois chacun

1. `node work/refonte-frontend/v4/tournoi/outils/capture.mjs work/refonte-frontend/v4/tournoi/M1 pNN [pMM]` ; regarde `M1/captures/pNN-390.png` et `pNN-1280.png` avec Read ; lis `pNN.json` (erreurs, débordement).
2. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/tournoi/M1 pNN [pMM] --max=60` doit imprimer `MOTS OK`.

Corrige, recapture une fois, puis arrête-toi.

## Réponse finale

Trois lignes par maquette : l'idée, le nombre de mots au premier écran, ce qui ne marche pas.
