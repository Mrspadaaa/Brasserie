# Voie g2 — Gemini 4 dans l'aide au brasseur (compagnon), au banc (mission 2026-11-14-gemini4)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote (brasseur, 14.11 : « surtout regarde pour l'aide au brasseur » ; budget total 10 CHF, 4,03 dépensés, part de g2 : 3,5 CHF au plus)
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L20, L28, L29), `cerveau/agents/gemini-tests-reels.md`, `../../MISSION.md`, `../g1/RESULTAT.md`
  (identifiants, prix, réflexion déjà vérifiés : ne refais pas la recherche), `functions/src/models.ts`, `functions/src/brewerHarness.ts`
  (rôles analysis / review / research, `geminiAttempts`), `scripts/eval-brewer.mjs`, `scripts/fixtures/brewerCases.mjs`.
  Ne lis jamais `functions/.env` ni `functions/.secret.local` (les scripts chargent la clé eux-mêmes, comme le banc g1).

## Objectif
1. Option du banc (pas de la production) : remplacer le modèle et la réflexion de chaque rôle du compagnon (analyse, relecture, recherche)
   par {3.8 actuel, Hydrogen, Argon, Carbon} × {basse, moyenne, haute} selon ce que chaque modèle accepte. Test unitaire simulé.
2. Juger la qualité sans deviner : pour chaque cas de `brewerCases.mjs`, une grille écrite AVANT les passes (faits attendus, chiffres justes,
   proposition valide, aucune invention, ton du brasseur : court, actionnable). Juge à l'aveugle (sorties anonymisées), par toi, puis rejoué
   par un second regard (script ou relecture) ; désaccords notés. Moitié des cas pour choisir, l'autre pour juger (L20).
3. Mesurer par case : score qualité, réponses inutilisables / erreurs, temps p50 et p90 par question, coût par question, nombre d'appels.
4. Passe courte d'abord (≈ 1 CHF) pour éliminer, puis approfondir les meilleures. Chaque passe journalisée dans
   `work/missions/2026-11-14-gemini4/journal-gemini.md` (cumul ≤ 10 CHF pour la mission). HTTP 429 (plafond Google) : arrêt immédiat, ECHEC
   avec ce qui est mesuré.

## Contrôles
- Tests : `npx vitest run tests/unit/brewerHarness.test.ts tests/unit/brewerFlashLimits.test.ts tests/unit/banc-lecture-modeles.test.ts --reporter=dot > work/missions/2026-11-14-gemini4/voies/g2/tests.txt`
- `npx tsc --noEmit -p .` racine et `functions/`.
- Journal : total mission ≤ 10 CHF, g2 ≤ 3,5 CHF.

## Possède
`scripts/eval-brewer*.mjs`, nouveaux `scripts/banc-compagnon*`, leurs tests, `work/missions/2026-11-14-gemini4/voies/g2/**`, lignes ajoutées
au journal. `functions/lib` peut être reconstruit (`npm --prefix functions run build`). Rien dans `src/` ni `functions/src/` (diff proposé
seulement), aucun déploiement, aucune donnée réelle. Ni stash. Commits par chemins, terminés par
« Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Rendre
`RESULTAT.md` au fil (après chaque passe) : grille, tableaux, coût cumulé, recommandation par rôle (modèle, réflexion, gain mesuré), diff de
`models.ts` proposé, non déployé. À 150 k : « REPRISE : <fichier> ». Une ligne.
