# Voie v-pm1-tests — les anciens tests de la carte « Maintenant » sur la carte d'appel pm1

- Agent : auteur · Modèle : sonnet · Plafond : 40 tours · Décideur : pilote
- Racine : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`. Lire `voies/v-pm1/RESULTAT.md` (§ Tests rouges, DÉCISION À PRENDRE) et la figure pm1 de `maquette/index.html`.

## Objectif
Les tests `brewOrdreM2`, `brewPageI1b` (2) et `brewPageK2` protègent des choix du brasseur (m2 : « Relevés du jour » avant Grains ; i1b, k2 : relevé dû, Enregistrer). D'abord JUGER : chaque assertion rouge protège-t-elle un choix encore valable que la carte d'appel pm1 a cassé (régression : corriger `src/ui/brassage/AppelMesure.tsx` ou la zone du palier de `BrewDayPage.tsx` pour le rendre), ou un détail que pm1 remplace (réécrire l'assertion sur la carte d'appel, même intention) ? Écris la réponse par assertion dans RESULTAT.md, puis fais-le. Puis `yeastPitchingExecution` (2 rouges, ensemencement) : le rejouer sur HEAD dans un worktree détaché temporaire (`git worktree add --detach <os.tmpdir()>/wt-pm1 HEAD`, puis `git worktree remove`) pour savoir s'il est rouge avant nos voies ; s'il l'est, le dire ; sinon trouver le fichier de voie qui le casse et le dire (ne pas corriger hors Possède).
Décision pilote : `brewAssist.ts` garde sa fenêtre 10 min (alerte « dès »), non touché.

## Possède
- `tests/unit/brewOrdreM2*`, `tests/unit/brewPageI1b*`, `tests/unit/brewPageK2*` (chemins exacts par grep ; ils peuvent être sous tests/integration), `src/ui/brassage/AppelMesure.tsx`, `src/pages/BrewDayPage.tsx` (zone du palier), `work/missions/2026-11-20-port-simplicite/voies/v-pm1-tests/`

## Consignes
Exigences transversales de `voies/v-pm1/VOIE.md` : elles valent ici mot pour mot. Interdits : StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx, tout hors Possède ; aucun commit, stash, checkout ; pas de npm run build.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- Ligne « Tests » écrite dans un fichier : `npx vitest run <les 4 fichiers> tests/unit/appelMesure.test.ts tests/unit/appelMesureVue.test.tsx --reporter=dot > work/missions/2026-11-20-port-simplicite/voies/v-pm1-tests/tests.txt`
- Si la vue change : captures 390 tactile et 1280, clair et cave (banc `voies/v-pm1/outils/banc.mjs`), ouvertes. Réponse finale : une ligne.
