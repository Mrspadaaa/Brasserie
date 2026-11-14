# Voie g1 — Gemini 4 (Hydrogen, Argon, Carbon) à la place de 3.8, au banc (mission 2026-11-14-gemini4)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote (accord du brasseur : 10 CHF, 14.11)
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L20, L28, L29), `cerveau/agents/gemini-tests-reels.md`, `.claude/skills/banc-lecture/SKILL.md` et
  ses références (`work/missions/2026-11-01-banc-lecture/GESTES.md`, rapport de fond), `../../MISSION.md`. Où 3.8 sert aujourd'hui :
  `functions/src/ai.ts`, `functions/src/invoice*.ts`, `functions/src/prompts.ts` (lecture seule ; trouve chaque appel au modèle 3.8 :
  zoom, deuxième lecture, vote…). Ne lis jamais `functions/.env` ni `functions/.secret.local` (les scripts du banc chargent la clé eux-mêmes).

## Objectif
1. Vérifie sur la page officielle Google (ai.google.dev, modèles et tarifs) les identifiants exacts (`gemini-4-hydrogen`, `-argon`, `-carbon`),
   l'accès de ta clé (offre gratuite ou payante), les prix, et le paramètre de réflexion (`thinkingLevel` / budget). Écris-le avec l'URL.
2. Ajoute au banc (option, sans changer la production) la possibilité de remplacer le modèle de chaque rôle de 3.8 et de fixer le niveau de
   réflexion. Test unitaire simulé (Gemini toujours simulé dans `npm test`).
3. `--simuler`, puis `--estimer` sur la grille prévue ; grille : pour le rôle de 3.8, {3.8 actuel, Hydrogen, Argon, Carbon} × réflexion
   {basse, moyenne, haute} selon ce que chaque modèle accepte, sur les pièces à vérité du banc. Choisis la taille pour tenir **10 CHF au
   total, cumul journalisé** (`journal-gemini.md` de cette mission) ; commence par une passe courte (≈ 2 CHF) qui élimine les cases
   perdantes, puis approfondis les meilleures. Passes payantes : `--payant --budget-chf <reste> --confirm-paid-ai`.
4. Pour chaque case : lignes justes / perdues / inventées, total juste, temps p50 et p90 par pièce, coût par pièce ; réglage choisi sur une
   moitié des pièces, jugé sur l'autre (L20). Aucun document en recul toléré sans le dire.

## Contrôles
- Tests du banc simulés verts : `npx vitest run tests/unit/banc-lecture* tests/unit/invoice* --reporter=dot > work/missions/2026-11-14-gemini4/voies/g1/tests.txt`.
- `npx tsc --noEmit -p .` racine et `functions/`.
- Journal de coût : total ≤ 10 CHF, chaque passe une ligne.

## Possède
`scripts/banc-lecture*`, `scripts/` du banc et leurs tests, `work/missions/2026-11-14-gemini4/**`. Rien dans `src/`, aucun déploiement, aucune
donnée réelle. Pièces réelles et réponses brutes hors Git (anonymisées si versées). Ni stash.

## Rendre
`RESULTAT.md` au fil (après chaque passe) : tableaux, coût cumulé, recommandation (quel modèle, quelle réflexion, à quelle place, gain
mesuré) ; si un déploiement de `aiTask` est recommandé, le diff proposé, non déployé. À 150 k : « REPRISE : <fichier> ». Une ligne.
