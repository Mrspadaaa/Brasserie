# Chasse aux défauts du Calendrier (21.11)

Le brasseur : « Il y a vraiment énormément de problème... Jsp SI mettre plusieurs agent pour les tracer et trouver serait envisageable ». Le Calendrier est « de loin celui avec le plus de problème ».

## Règles communes à tous les chasseurs
- Version jugée : le tag `en-ligne/2026-11-21-tour8` (celle qu'il a dans la main). Build depuis `git worktree add --detach` du tag vers os.tmpdir(), avec jonctions node_modules et functions/node_modules vers `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`. Puppeteer (skill webapp-testing), `?dev-local`, fixture ZZ TEST du parcours (`scripts/parcours/fixtures/`), jamais `src/data/seedData.ts`, jamais Gemini.
- Joue au doigt : 390 tactile (Pointer Events touch) puis 1280 souris, thèmes clair et cave. Chaque échelle : 2 sem., 6 sem., 3 mois, 17 sem., An.
- Un défaut = ce que le brasseur reprocherait. Chaque défaut : id `CH-<regard>-n`, gravité (bloquant / gênant / mineur), geste exact pour le reproduire, attendu, constaté, capture ouverte et regardée, fichier:ligne probable si vu.
- Ne pas recopier les défauts déjà connus : lire d'abord les lignes CAL-* de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (CAL-FRISE-PRIX, CAL-ECHELLE-FIGEE, CAL-VIDE, CAL-VIDES-EN-LIGNE, CAL-MODIFIER, CAL-FICHE, CAL-JOUR, CAL-BARRE-BORD, VUE-FOND, PERIODE-PARTOUT) ; un défaut connu n'est cité que si tu en trouves une forme nouvelle.
- Règles de référence : frise B, R1 à R14 en tête de `work/missions/2026-11-20-frise/frise-interactive.html` ; ses mots dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (fin du fichier) ; PORTRAIT.md (`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`).
- Ne touche pas au code. Écris seulement ton fichier `CHASSE-<regard>.md` dans ce dossier, puis commit par chemins (`git add -f`), message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Retire ton worktree temporaire à la fin.
- Boucle jusqu'à sec : quand un tour de gestes ne trouve plus rien de neuf, change d'échelle ou de chose ; arrête après deux tours secs.
- Retour en une ligne : nombre de défauts par gravité, commit.
