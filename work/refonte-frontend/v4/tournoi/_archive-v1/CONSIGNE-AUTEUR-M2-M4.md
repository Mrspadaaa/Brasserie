Tu es auteur dans un tournoi de mini-maquettes d'interface pour L'Affinée, une app de micro-brasserie suisse. Réponds et écris en français.

Répertoire de travail : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie. Utilise des chemins absolus. Le shell Bash est Git Bash sous Windows : n'écris jamais de texte contenant des barres obliques inverses ou des accents graves par Bash (`node -e`, heredoc) ; utilise l'outil Write.

Ton étape est __M__ (voir le message qui t'a donné cette consigne).

## Lis, dans cet ordre

1. `work/refonte-frontend/v4/tournoi/REGLES.md`, section « Règles pour les auteurs » (et la grille, pour savoir ce qui est récompensé).
2. `work/refonte-frontend/v4/tournoi/__M__/BRIEF.md` : ta tâche.
3. `work/refonte-frontend/v4/tournoi/M1/consolide/index.html` et `M1/consolide/NOTE.md` : la grammaire de la feuille « au style », retenue au tournoi M1. Ouvre aussi sa capture `M1/captures/consolide-390.png` si elle existe.
4. `.impeccable/surfaces/prototypes-houblons-v4-index-html.md` : le contrat de direction.
5. `DESIGN.md` : le monde visuel (couleurs, polices, densité, les 4 couleurs de comparaison vérifiées en daltonisme). Lis les sections utiles, pas tout.
6. `.claude/skills/impeccable/reference/craft-floor.md` : le plancher de qualité et les interdits.
7. Le jeu de données : `prototypes/houblons-v4/data/pack-mini-protos.json` (et sa section `meta`). C'est la seule source de chiffres. Copie en ligne dans ta page seulement ce dont tu as besoin.

Ne lis pas les autres dossiers `pNN/` de ton étape, ni `jury/`, ni `calibration/`. Ne signe pas ta page ni ta note (pas de nom de modèle) : le jury est à l'aveugle.

## Tes deux mini-maquettes

Pour chacune : `work/refonte-frontend/v4/tournoi/__M__/pNN/index.html` (une seule page autonome, CSS et JS en ligne, polices Google Fonts permises, aucune autre ressource externe) et `NOTE.md` (5 lignes au plus : l'idée, le geste, ce qui est original, ce qui est sacrifié, et si la forme a mal servi la tâche, pourquoi).

Les deux maquettes doivent être vraiment différentes l'une de l'autre. Prends un parti fort : on récompense la rupture et l'intelligence du geste, pas la finition.

## Vérité des données, éliminatoire

Aucun chiffre inventé ; une inconnue s'affiche « inconnu », un effet non établi « non établi » (jamais 0) ; un écart n'est jamais montré plus fin que les plages de prédiction ; IBU, g, g/L et intensités ne sont jamais sur la même échelle ; pas de texte anglais visible, pas de « (s) », virgule décimale ; IBU en entier, intensités en crans ou en entiers, pas de décimales de repère central. La mention « échelles au style : hypothèse BJCP, à valider » reste visible.

Le modèle V5.5 situe mal la bière (plages larges) et distingue surtout « cité » ou « non cité » pour un houblon : montre ce flou, ne le cache pas derrière des points nets.

## Contrôle, une seule fois

`node work/refonte-frontend/v4/tournoi/outils/capture.mjs work/refonte-frontend/v4/tournoi/__M__ pNN pMM` (tes deux numéros).

Regarde tes captures (`__M__/captures/pNN-390.png`, `pNN-390-page.png`, `pNN-1280.png`) avec l'outil Read, et lis `pNN.json` (erreurs, débordement horizontal). Corrige ce qui est cassé, recapture une fois, puis arrête-toi.

## Réponse finale

Trois lignes par maquette : l'idée, ce qui marche à 390, ce qui ne marche pas. Rien d'autre.
