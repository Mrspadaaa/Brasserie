# REPRISE p1 (état au 154 k, 10.11)

Worktree : `C:/Users/mrspa/AppData/Local/Temp/p1-wt`, branche `p1/mesures` (base tag `en-ligne/2026-11-10-parcours2`, HEAD 6d9a584d), jonction node_modules faite. AUCUN COMMIT encore.
Skills (boosters-ux, senior-frontend, a11y-audit) : l'outil Skill n'est pas disponible à cette voie ; non invoqués, à dire dans RESULTAT.

## Lu (ne pas relire)
Maquette m2 = `voies/v2/etat.html` (CSS `.vm-*` lignes 124-260, feuilleMesurer l.316-358, brancher l.361-385, R.m2 l.414) ; captures `page-v2/img/m2-palier-{repos,curseur,hors,apres,pouce}-390.png`, `-curseur-1280.png`. Port z1 de l'app : classes `.brew-page.bz .bz-*`, jetons `--bz-hop/alert/warn/border2/t2/page/raised/action`, CSS à la fin de `src/pages/brew-day.css` (3238 l.).
Décisions : m2 = carte « Relevés du jour » dans la colonne principale entre l'horloge (+ prompt) et `<BrewIngredients` (BrewDayPage ~l.1530) quand `mesuresAttendues(...)` non vide (!isConsulting, !displayRecipe) ; sinon l'ancienne carte reste dans `.brew-side-column` (~l.1573). Cacher le bouton `.brew-reading-prompt` (l.1508) si `prompt.kind` est dans les attendues. Horloge l.1325-1346 : « relevé — » devient « relevé ? » (bouton `bz-releve-lien`), rendre aussi un bouton quand non démarré.

## Fait (fichiers dans p1-wt, non commités)
- `src/domain/measureSlider.ts` (pasCurseur, poserSurPas, departCurseur, formatCurseur, bornesCurseur)
- `src/domain/brewMeasures.ts` (mesuresAttendues, raisonMesure, type MesureAttendue)
- `src/ui/BrewReadingsSummary.tsx` réécrit (props `attendues`, `onMeasure(kind)`, `now`) ; il faut encore : afficher le titre neutre du pH (« à confirmer à froid ») pour une ligne faite ; classes CSS `.is-mesure` (grid `minmax(0,1fr) auto`), `.bz-attendu` (bordure pointillée ambre, `[data-tard]` gris), `.bz-mesure-ok` (vert hop), `.bz-mesure-hors` (alert), `.bz-mesure-du` (warn 600), `.bz-mesure-tard` (t2).
- Tests écrits, rouges sur le tag (preuve : `voies/p1/rouge-avant.txt`) : `tests/unit/brewMeasuresAttendues.test.ts`, `tests/integration/brewMesuresCurseur.test.tsx` (à corriger : « dans la cible » se teste par `getByText('dans la cible')`, pas par label), `tests/integration/brewSuiviThermiquePremierPlan.test.tsx`.

## MISE À JOUR (182 k) : commit WIP `4e6d75c0` sur p1/mesures
Fait en plus : `BrewDayMeasurements.tsx` (MeasureSlider, ligne `.bz-lecture`, pas ±, Pourquoi maintenant, ligne « cible » à vide), `BrewThermalControl.tsx` (Montée si rampMin ≥ 1), `BrewDayPage.tsx` (`attendues` après `isConsulting`, carte avant `<BrewIngredients`, prompt masqué, « relevé ? », ancienne carte seulement si aucune attendue), CSS ajouté en fin de `brew-day.css`. `tsc` : seuls 4 rouges d'environnement déjà présents (firebase-admin ×2, seedData ×2). Tests : `brewMeasuresAttendues` (unit) VERT, `brewSuiviThermiquePremierPlan` VERT, `brewMesuresCurseur` 9 rouges de TEST, pas de code : le palier `mash-1` à 67 °C ouvre Mesurer sur **pH** (defaultReading), donc dans le harness il faut d'abord `fireEvent.click(screen.getByRole('button', { name: 'Température' }))` avant de chercher le slider « Température » ; le test « cible » du résumé : `getAllByText`/cibler `Maische` (deux cibles) ; le test du pH n'a pas besoin du clic. Corriger ces tests, relancer, puis le reste ci-dessous (1 à 3 sont faits côté code ; ne reste que leur vérification dans Chrome).

## Reste à faire
1. `src/ui/BrewDayMeasurements.tsx` : remplacer `MeasureScaleView` par un curseur interactif (`<input type=range>` natif transparent 44 px de haut sur l'échelle, pouce dessiné `.bz-pouce` pointillé `data-vide` tant que `raw` est vide, classes hors/loin) ; `onChange` → `setRaw(formatCurseur(...))` ; `onPointerUp` et Entrée/Espace → si `raw` vide, poser `departCurseur(kind, scale, last?.value)` ; boutons `moins 0,1`/`plus 0,1` (aria-label `moins ${pas}`, texte `−0,1`) ; ligne `.bz-lecture` : bouton `Taper la valeur` (28 px, « ? » tant que vide, crayon) qui ouvre le champ `#brew-reading` (type text, inputmode decimal ; à ≥ 901 px le champ est toujours visible et le bouton caché) ; sans échelle (`measureScale` null) : champ seul comme aujourd'hui. Range : `min/max` = `bornesCurseur`, `step` = pas, `aria-valuetext`. Ligne « cible 66–68 °C » à vide (`bz-ecart` data-k=vide). Bouton « Pourquoi maintenant » (`aria-expanded`, texte `raisonMesure(kind, step)`). Pied « Aucun relevé … un toucher sur le pouce pose X » s'efface au premier geste. Garder `Input id=brew-reading`, labels, `bz-verdict`, tests existants (rl9-bornes-mesure, bStockJourBrassage, brewDayCssB).
2. `src/ui/BrewThermalControl.tsx` : n'afficher le bloc `Montée/Refroidissement` que si `rampMin >= 1`.
3. `src/pages/BrewDayPage.tsx` : brancher (voir Décisions) ; `onMeasure={requestMeasure}`.
4. `src/pages/brew-day.css` : styles ci-dessus + curseur (port de `.vm-curseur/.vm-zone/.vm-pouce/.vm-range/.vm-lecture/.vm-pas/.vm-val/.vm-pourquoi/.vm-raison`, en `.brew-page.bz .bz-*`) ; `prefers-reduced-motion`.
5. Contrôles : `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > voies/p1/tests.txt` (comparer au tag : liste des rouges déjà présents) ; `VITE_HOP_V4=on npm run build`.
6. Captures Chrome (banc local puppeteer-core, tactile 390 puis 1280, clair et cave) : repos sans relevé, Mesurer ouvert, toucher du pouce, hors cible, après ; côte à côte avec `m2-*` ; dans `voies/p1/captures/` ; DEMANDE EXECUTANT possible (Haiku) pour la série.
7. Commit(s) dans p1-wt, RESULTAT.md (5 éléments : écarts, sha, tests, captures, doutes).

## Écarts au port à dire dans RESULTAT
- Volume attendu seulement à l'ensemencement et avant ébullition (le code n'a pas de cible de volume au refroidissement) ; densité au refroidissement « moût refroidi » (gris).
- Densité/volume : la bande de l'app (OG ± 2 points, volume ± 5 %) vient du code (`measureScale`) ; la maquette n'avait qu'un repère.
- Raison de la température : texte générique (la maquette citait 66/68, faux pour un autre palier).
