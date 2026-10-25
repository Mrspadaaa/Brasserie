# Voie t15b-comparer-app — Comparer (cmc2k) branché dans la vraie app (#174)

Agent : auteur (Sonnet), car c'est un port de code. Le dessin est déjà fixé : son choix cmc2k, qui vit maintenant dans
`src/ui/hopIndex/comparer/` (commit 3202ada2). On porte, on ne redessine pas.

## À lire d'abord
- `work/missions/2026-10-25-integration-houblons/voies/t15a-comparer/VOIE.md`, § Phase 2 : c'est ton contrat.
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/NOTE.md`, § « Pour le port dans l'app » : la passation, les fichiers et
  les pièges.
- Le modèle à suivre : Ma bière dans l'app (`src/ui/hopIndex/maBiere/hote.tsx`, `src/pages/BrewWizard.tsx` `applyHopV4Change`).
- L'architecture : `cerveau/decisions/2026-10-25-integration-architecture.md` (pile, porte unique, client asynchrone, chunk paresseux).

## À faire
1. La route `hopCompare` de `src/ui/hopIndex/HopToolLayer.tsx` monte le vrai Comparer (l'hôte de l'app) à la place de l'écran
   provisoire, sous le drapeau `hopV4`. Il est chargé à la demande, dans le chunk des outils.
2. Les données viennent du moteur de l'app par son client asynchrone ou `useHopData`. Les houblons comparés sont ceux de la route,
   et la recette est le brouillon ouvert dessous.
3. « Placer <houblon> » passe par la porte unique, `applyHopV4Change` → `writeRecipeDraft`.
4. Mesurer la fluidité : l'ouverture et un changement de moment, ×4, sur le banc `?dev-local&etape=houblons`, et donner les
   nombres. Sa règle : « SI Des étape bloque vraiment sur la fluidité. Tu peux skip trouvé une solution et compromis et me
   propose ça ». Donc si ça bloque, propose un compromis mesuré, en DÉCISION À PRENDRE.
5. Test d'intégration : l'ouverture de Comparer depuis l'étape Houblons, un changement de moment, Placer. Garder `npm run build`
   vert et le démarrage ≤ 919 ko gzip (`node scripts/check-hop-budget.mjs`).
6. Captures dans Chrome (`scripts/with_server.mjs`, `VITE_HOP_V4=on`), 390 × 844 : repos, 60′, Absolu, « Ses mots », après
   Placer. Ouvre-les, à côté de `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/cmc2k.png`.

## Critères
- `npx vitest run tests/unit/hopIndexV4 tests/integration` → vert ;
- `npm run build` → vert ;
- `node scripts/check-hop-budget.mjs` → démarrage inchangé (919 ko au plus) ;
- maquette inchangée : `node work/refonte-frontend/v4/tournoi/outils/controle-mots-tous.mjs prototypes/houblons-v4/maquettes/parcours comparer` → `MOTS-TOUS OK`, après `construire.mjs`.

## Possède
`src/ui/hopIndex/comparer/`, `src/ui/hopIndex/HopToolLayer.tsx`, `src/ui/hopIndex/outils.ts`, `src/ui/hopIndex/chargement.ts`,
`src/pages/BrewWizard.tsx` (pour brancher la porte, rien d'autre), `tests/unit/hopIndexV4/`, `tests/integration/`,
`work/missions/2026-10-25-integration-houblons/voies/t15b-comparer-app/`.
Fichiers de travail dans `os.tmpdir()`. `git status --short` à la fin. Pas de `git mv` : copie, puis suppression, dans tes fichiers.

Retour en une ligne ; RESULTAT.md avec les preuves, les nombres de fluidité et les captures ouvertes. Si tu approches ta limite de
tours, écris RESULTAT.md avec ce qui reste.
