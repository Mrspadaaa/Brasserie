# Voie u2 — Chercher (c6b), Comparer (s5a), Suggérer (s7a) dans l'étape Levure (mission 2026-11-09-levure-port)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- **Règle n° 1** : sa maquette choisie est reprise telle quelle, état par état et geste par geste (L03). Les maquettes, toutes dans
  `work/missions/2026-11-09-ecran-levure/p2/`, avec leur etat.html, leur NOTE.md et leurs captures :
  - c6b : la ligne de résumé, les puces et la feuille à index des 18 filtres ;
  - s5a : les colonnes comme Comparer houblons, les effets de fermentation en tête ;
  - s7a : les cartes − / + groupées Arômes · Corps · Conduite, la carte choisie qui s'ouvre en grand, une carte sans donnée
    repliée, les pistes °C et % sous chaque levure.
  Lis aussi `critique/p2/SYNTHESE-P4.md`, où les retouches sont faites, et la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md`.
- Lis : `CLAUDE.md`, `cerveau/LECONS.md`, `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md`, skill `boosters-ux`, les
  contrats `src/domain/levure/contrat.ts` et `src/ui/etapeLevure/props.ts` (fixés par le pilote).

## Objectif
- **Trois composants** : `src/ui/etapeLevure/Chercher.tsx`, `Comparer.tsx` et `Suggerer.tsx`. Chacun prend `PropsVue` et appelle
  l'API du domaine (`src/domain/levure/index.ts`, voie d1). **Aucune règle recopiée** : comptes, ordre, disponibilité et écarts
  viennent de l'API.
  - Tant que d1 n'a pas livré : code contre les types du contrat et teste avec une API simulée ; puis branche la vraie API et rejoue.
- **Comparer** : les colonnes du Comparer houblons (cherche le composant actuel). Reprends ses pièces, ne les recopie pas.
- **Disponibilité et données manquantes** :
  - « vendue en CH · FR · DE » d'abord, puis « fabricant présent en Europe », puis « rare en Europe » ;
  - toucher « ⌕ » appelle `onChercherDonnee` et ne lance rien d'autre.
- **Ordre après une levure US tapée** : celui de c4. Ses plages sont un repère, pas un filtre ; US-05 en tête après « 1056 ».

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/integration/etapeLevure/vues* --maxWorkers=2`. Les tests jouent les gestes des
  maquettes :
  - poser trois filtres donne le compte, et retirer le filtre rend la liste ;
  - ⊕ ajoute une colonne et × la retire ;
  - « − » sur Atténuation reclasse la liste, les vendues ici d'abord ;
  - deux axes se combinent.
- Chrome sans écran (skill `webapp-testing`, port 5657) sur le banc `?dev-local&etape=levure` de la voie u1 : quand il existe, touche
  l'onglet ; sinon, monte tes vues dans un banc à toi, hors du bundle de production.
  - Formats : 390 tactile et 1280, deux thèmes.
  - Pour chaque vue, les trois cadres de sa maquette côte à côte avec l'app, toutes les captures ouvertes (L12).
- `git status --short` : tes fichiers seulement.

## Possède
`src/ui/etapeLevure/Chercher.tsx`, `Comparer.tsx`, `Suggerer.tsx`, `vues.css` (classes `lvv-`), `tests/integration/etapeLevure/vues*.test.tsx`,
`work/missions/2026-11-09-levure-port/voies/u2/**`. La voie u1 a peut-être posé une coquille vide à ces noms : remplace-la.
Ni commit ni stash. Rends une ligne ; RESULTAT.md : ce qui est porté, les captures, les écarts à la maquette et leur raison, `LEÇON PROPOSÉE :`.
