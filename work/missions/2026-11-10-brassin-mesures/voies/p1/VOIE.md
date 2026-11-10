# Voie p1 — porter m2 et le geste au curseur dans la vue de brassin (mission 2026-11-10-brassin-mesures)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote
- Choix du brasseur (10.11) : la section « Le geste, joué au doigt (commun aux 10) » puis « non part là dessus » (m2). Règle n° 1 :
  m2 et le geste se portent tels quels (L03) ; rien d'autre de z1 ne change.
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L03, L11, L12, L13, L17, L29), `.claude/rules/affinee-frontend.md`, `DESIGN.md`,
  `cerveau/produit/saisie-mobile.md` ; SPEC (fin, 10.11) et VB-1 ; `../v2/RESULTAT.md` (passe 2b comprise), `../v2/etat.html`
  (source de m2 et du geste), `../../page-v2/img/m2-*` et `ref-*` (ouvre-les) ; `../../critique/SYNTHESE-v2.md` (défauts restants de m2).
  Skills à invoquer avant de coder : `boosters-ux`, `senior-frontend`, `a11y-audit` (ses mots : « utilise les ux, ui booster »).
- Base : tag `en-ligne/2026-11-10-parcours2` (en ligne). `git worktree add <os.tmpdir()>/p1-wt -b p1/mesures en-ligne/2026-11-10-parcours2`,
  `node_modules` par jonction vers `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`.
- Code : `src/pages/BrewDayPage.tsx` (horloge « relevé », `requestMeasure`, `openCapture`), `src/ui/BrewThermalControl.tsx`,
  `src/ui/BrewReadingsSummary.tsx`, `src/ui/BrewDayMeasurements.tsx` (`MeasureScaleView`, mesures attendues par étape), `src/ui/BrewCapturePanel.tsx`,
  `src/pages/brew-day.css`.

## Objectif
Un test qui échoue sur le tag avant chaque correction (L13).
1. **m2** : dès qu'une étape attend une mesure, la carte « Relevés du jour » de z1 est là, à vide : une case « ? » par mesure attendue
   (nom, cible, moment) ; toucher la case ouvre Mesurer sur le bon onglet ; « relevé ? » de l'horloge fait de même ; après le relevé,
   la valeur à ses deux places z1 (horloge, Relevés du jour). « Pourquoi maintenant » à un toucher. « Suivi thermique » : rien d'inutile
   au premier plan (« montée 0,1 min » ne s'affiche plus : durée absurde, défaut de l'app actuelle).
2. **Le geste** : dans Mesurer (pH, Temp., Densité, Volume), au téléphone, curseur sur l'échelle cible (`MeasureScaleView`) comme geste
   principal, pouce en pointillé tant qu'aucune valeur n'est posée, un toucher sur le pouce pose sa valeur (la cible ou le dernier relevé)
   et active Enregistrer ; toucher ou glisser la piste ; ±0,1 (pas : pH 0,01, °C 0,1, densité 0,001, L 0,1) ; la valeur tapée à un
   toucher (crayon), jamais `type="number"` ; jamais une valeur enregistrée sans geste ; clavier et lecteur d'écran (role="slider",
   flèches) ; à 1280 le champ peut rester à côté.
Préserve : hors ligne, journal, alertes de bornes (AM-41 à 43), virgule décimale, tests existants.

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-brassin-mesures/voies/p1/tests.txt`
  (zéro nouveau rouge contre le tag ; liste ceux déjà présents ; si la suite dépasse le délai, lance-la en arrière-plan et attends) ;
  `VITE_HOP_V4=on npm run build` vert.
- Captures Chrome réel (banc local, puppeteer-core, émulation tactile 390 puis 1280, clair et cave) : repos sans relevé, Mesurer ouvert,
  toucher du pouce, hors cible, après ; côte à côte avec `m2-*` (même état), toutes ouvertes, dans `voies/p1/captures/`.

## Possède
Le worktree `p1-wt` et sa branche `p1/mesures` ; `work/missions/2026-11-10-brassin-mesures/voies/p1/**` (dans ce dépôt).
Aucun déploiement, aucune donnée réelle, aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir(). À 150 k : « REPRISE : <fichier> ».

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments) : écarts au port (aucun sans raison), commits (sha), tests, captures. Réponse finale : une
ligne avec le sha final de `p1/mesures`.
