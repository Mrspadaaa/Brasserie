# Voie n1-moteur — RC-9, inventaires controle-choix, images l5b et s5a

Agent : auteur (Sonnet), plafond 120 tours.
Dépôt de travail : `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/` (branche `claude/nuit-recette-1611b` du worktree epic-banach, parti du tag `en-ligne/2026-11-15-recette3`, qui est en ligne). Tout le code s'écrit ici. Les documents de la mission d'origine sont à lire, sans y écrire, dans `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-14-recette/` (MISSION.md, BUGS dans `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/BUGS.md`, RESULTAT des voies port-*).
Carte blanche du brasseur pour la nuit (relayée) : aucune question. Fable interdit. Stock, jour de brassage, Brassins et Finances ne se touchent pas. Ne jamais toucher `.codex/hooks.json`, `functions/.env`, `firestore.rules`, `.firebaserc`. Aucun déploiement, aucun commit (le pilote commite par chemins), pas de `git stash`, aucun code par heredoc ni `node -e`.

## Faire
1. **RC-9** (BUGS.md : le moteur d'eau 21A sur-acidifie, AR −25 → −126, sous la bande −49 à 10, pH ≈ 5,55 annoncé). D'abord l'**État de l'art** (L29) dans RESULTAT : nommer le problème (dose d'acide visant le bicarbonate à 0 au lieu d'un AR ou d'un pH cible ; méthode standard : alcalinité résiduelle de Kolbach, dose d'acide pour atteindre un pH de maische cible, cf. Bru'n Water / Palmer), lire `src/domain/water/` (proposal.ts, acid*, residualAlkalinity…). Puis **un test qui échoue** sur la recette de démo 21A (Villars-sur-Glâne, 28,7 + 13,8 L, 8 kg Pilsner, Gypse 16 g, KCl 3 g) : après la proposition, AR dans la bande du style (−49 à 10) et pH estimé cohérent avec l'AR. Puis corriger, avec des tests existants de l'eau verts (`tests/unit/*water*`, `tests/integration/water*`, `eauW1b`, `eauPrechargement`, `minimumOsmosee`). Le moteur ne change que par ce test.
2. **Inventaires controle-choix** pour Paliers et pour la page de la recette : lire `work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs` (ce qu'il attend d'une ligne du registre : inventaire, contrôles), compléter `work/refonte-frontend/v4/choix/ecrans-app.json` (lignes paliers r2, recette r1, et recap m2, eau-onglet w1b si présentes) de sorte qu'il passe sur l'app ; s'il exige une page construite, la produire comme le font les autres écrans choisis (lire comment levure l5b est contrôlé). Sortie dans RESULTAT.
3. **Images l5b-cadres.png et s5a-cadres.png** absentes (`work/missions/2026-11-09-ecran-levure/p2/l5b/`, `…/s5a/`), citées par le registre : les régénérer depuis leurs etat.html avec `scripts/agents/verifier-page.mjs` (ou le script qui les a faites, s'il existe), ouvrir chacune.

## Critères
- Test RC-9 rouge avant, vert après ; tests de l'eau verts ; `npx tsc --noEmit -p .` 0 erreur.
- controle-choix vert pour paliers et recette (ou l'écart exact écrit).
- Les deux images présentes et ouvertes.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-16-nuit-recette/voies/n1-moteur/RESULTAT.md`.
- Tests : `npx vitest run <fichiers> --reporter=dot > C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-16-nuit-recette/voies/n1-moteur/tests.txt` ; jamais la sortie entière dans le contexte.
- À 180 k de contexte : l'état dans RESULTAT, puis « REPRISE : <fichier> ».

## Possède
`src/domain/water/`, tests de l'eau, `work/refonte-frontend/v4/choix/ecrans-app.json`, `work/missions/2026-11-09-ecran-levure/p2/l5b/`, `…/s5a/`, `work/missions/2026-11-16-nuit-recette/voies/n1-moteur/`. Rien ailleurs. Rends une ligne.
