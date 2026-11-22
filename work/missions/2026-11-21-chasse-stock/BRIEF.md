# Chasse aux défauts du Stock (21.11)

Le brasseur : « Il y a beaucoup de choses très bien pour le stock, mais beaucoup de moins bon, déjà il y a des vues et de l'espace gâché. La vue type étagère est incroyablement, mais il y a un ou deux souci, et dans autre stock, j'ai pas cette vue.. Faire passer plusieurs critique et autres agent pour voir tout les problèmes. Notamment l'autre vue de modification ».

## Règles communes
- Version jugée : le tag `en-ligne/2026-11-21-tour8` (dans le worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`). Build depuis `git worktree add --detach` du tag vers os.tmpdir(), jonctions `node_modules` et `functions/node_modules` vers port-carnet, données « ZZ TEST » de `scripts/parcours/fixtures` (stock, ingrédients et autres stocks compris ; compléter la fixture dans ton dossier temporaire si un genre manque). Jamais `src/data/seedData.ts`, jamais les données réelles.
- Lire d'abord : ses captures annotées `01-articles-annote.jpg` et `02-fiche-article.jpg` de ce dossier (01 : onglet Houblons barré, flèche de « Recompter » vers lui, bascule Étagère rayée, rond à droite des filtres) ; lignes STOCK-* et WX2-2 de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` et de `work/missions/BUGS.md` (ne pas recopier un défaut connu) ; la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` ; `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.
- Joue au doigt : 390 tactile puis 1280 souris, thèmes clair et cave. Tous les onglets de Stocks (Articles : Étagère, Recompter, Ingrédients, Autres stocks ; Courses ; Fûts ; Matériel ; Houblons) et la fiche d'un article (lecture, Corriger le stock, Seuil, Modifier la fiche, Commander, Enregistrer).
- Un défaut = ce que le brasseur reprocherait (espace gâché, texte en trop, vue qui saute, geste raté, chiffre faux, doublon). Chaque défaut : id `<PRÉFIXE>-n`, gravité (bloquant / gênant / mineur), geste exact, attendu, constaté, mesure (px, CLS, mots), capture ouverte et regardée.
- Ne touche pas au code. Écris seulement ton fichier `CHASSE-<regard>.md` dans ce dossier, captures dans os.tmpdir(), puis commit par chemins (`git add -f`), message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Retire ton worktree temporaire à la fin (jonctions d'abord).
- Un seul banc Chrome à la fois (la machine sature). Lire par grep, sorties filtrées, ne jamais ouvrir un gros fichier en entier. Vers 150 k : écris ce que tu as et rends.
- Boucle jusqu'à sec : arrête après deux tours sans défaut neuf.
- Retour en une ligne : nombre par gravité, commit.
