# Voie t15a-comparer — Comparer (cmc2k, son choix) dans la vraie app (#174)

Agent : concepteur (Opus). Mission : `work/missions/2026-10-25-integration-houblons/MISSION.md`, architecture D65
(`cerveau/decisions/2026-10-25-integration-architecture.md`).

## Ses mots
- « Parfait pour Une bande teintée cmc2k »
- « Parcontre: dans ces mots Le +2 de idao7 ça va pas du tout, il doit tout y avoir avec en ordre décroissant du plus fort au plus faible. »
- « Tu peux implémenter ça directement dans la vrai app »
- Règle D68 : « Au style », lecture au style, échelle au moment ; « Absolu », aucune normalisation.

## Phase 1 — la maquette passe à cmc2k (règle n° 1)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/` porte aujourd'hui cmc2h, avec `RadarBase` (commit b0d517c1). Fais-le
  passer à **cmc2k**, qui reprend cmc2i et la bande teintée continue (`work/refonte-frontend/v4/ecran-1/fils25-comparer/cmc2k/source/`).
  Garde le radar par `RadarBase` (`@app/ui/hopIndex/commun/RadarBase` s'il y a été déplacé, sinon le commun de la maquette).
- **« Ses mots » (D151)** : tous les mots de chaque houblon, sans « +n », triés du plus fort au plus faible. La force d'un mot est
  celle que donne le moteur ou la fiche (poids, nombre de sources, mot « gras : lui seul » d'abord). Dis dans la NOTE quelle force
  tu prends.
- Écris `work/refonte-frontend/v4/tournoi/outils/controle-mots-tous.mjs <dossier> <ids…>`. Dans « Ses mots », il vérifie :
  - aucun « +n » ;
  - le nombre de mots de chaque houblon égal à sa liste ;
  - l'ordre décroissant de la force.

  Il imprime `MOTS-TOUS OK` ou `MOTS-TOUS ECHEC (n)`. Il doit échouer sur cmc2k et passer sur la maquette construite.
- Construis la maquette, rejoue `controle-quand-comparer`, `controle-normalise-moment`, `controle-centre-plus` et `controle-radar-base`,
  et prends tes captures (repos, page entière, « Ses mots »). Ouvre-les.
- RESULTAT.md, § Phase 1.

## Phase 2 — Comparer dans l'app, sous le drapeau `hopV4`
- La route `hopCompare` de la pile (`src/ui/hopIndex/HopToolLayer.tsx`, provisoire aujourd'hui) ouvre le vrai écran Comparer,
  porté de la maquette dans `src/ui/hopIndex/comparer/`. Ce code est chargé à la demande, dans le chunk des outils, hors du démarrage.
- **Données** : le moteur de l'app par son client asynchrone (`src/domain/hopIndex/v4/client.ts`, `useHopData`), jamais de recalcul
  inutile. Les houblons comparés sont ceux qu'on lui passe (depuis Ma bière ou Suggérer, « Comparer (n) »), et la recette est le
  brouillon ouvert dessous.
- **Écriture** : « Placer <houblon> » écrit par la porte unique (`applyHopV4Change` → `writeRecipeDraft`), comme Ma bière.
- **Fluidité** (son exigence, « beaucoup de données ») : changer de moment ou de mode ne recalcule que ce qui change. Mesure
  l'ouverture et un changement de moment ×4 sur le banc (`scripts/check-hop-tools-perf.mjs` ou ta mesure), et donne les nombres.
- **Drapeau éteint** : rien ne change.
- Banc local : `?dev-local&etape=houblons`, puis l'ouverture de Comparer. Capture 390 × 844 dans Chrome (`scripts/with_server.mjs`,
  `VITE_HOP_V4=on`) : repos, 60′, Absolu, « Ses mots », Placer. Ouvre les captures, à côté de celles de cmc2k.
- Tests : un test d'intégration de l'ouverture et de Placer, `npm run build` vert, démarrage ≤ 919 ko gzip
  (`scripts/check-hop-budget.mjs`).
- RESULTAT.md, § Phase 2.

## Possède
- Phase 1 : `prototypes/houblons-v4/parcours/src/ecrans/comparer/`, `prototypes/houblons-v4/maquettes/parcours/`,
  `work/refonte-frontend/v4/tournoi/outils/controle-mots-tous.mjs`.
- Phase 2 : `src/ui/hopIndex/comparer/`, `src/ui/hopIndex/HopToolLayer.tsx`, `src/ui/hopIndex/outils.ts`,
  `src/ui/hopIndex/chargement.ts`, `tests/unit/hopIndexV4/`, `tests/integration/`.
- Toujours : `work/missions/2026-10-25-integration-houblons/voies/t15a-comparer/`.

Pas `src/ui/hopIndex/commun/` ni `maBiere/` (voie rb2-ma-biere en cours), pas `work/refonte-frontend/v4/choix/` (voie
rc-registres-comparer). Fichiers de travail dans `os.tmpdir()`. `git status --short` à la fin de chaque phase.

Retour en une ligne par phase. Si tu approches ta limite de tours, écris RESULTAT.md avec ce qui reste.
