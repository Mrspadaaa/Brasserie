OK — m2 et le geste portés ; retouche pilote faite (ordre, Suivi thermique en bas, phrase retirée) ; p1/mesures sha 0da8e635

Worktree `C:/Users/mrspa/AppData/Local/Temp/p1-wt`, branche `p1/mesures`, base tag `en-ligne/2026-11-10-parcours2` (6d9a584d).
Commits : 4e6d75c0 (WIP) · 5b65e412 · f8a69651 · 5340eb6b · 0cb79bde (final). Aucun déploiement, aucune donnée réelle, aucun Gemini.
Skills `boosters-ux`, `senior-frontend`, `a11y-audit` : l'outil Skill n'était pas disponible à cette voie, non invoqués.

## Fichiers (dans p1-wt)
`src/domain/measureSlider.ts` (pas, bornes, départ, format, traits, qualificatif) · `src/domain/brewMeasures.ts` (mesures attendues, « pourquoi maintenant ») ·
`src/ui/BrewReadingsSummary.tsx` (carte à vide, une case « ? » par mesure) · `src/ui/BrewDayMeasurements.tsx` (curseur, pouce, ±pas, crayon, verdict) ·
`src/ui/BrewThermalControl.tsx` (« montée » seulement si ≥ 1 min) · `src/pages/BrewDayPage.tsx` (carte en colonne principale, « relevé ? », bilan de clôture partagé) · `src/pages/brew-day.css`.
Tests : `tests/unit/brewMeasuresAttendues.test.ts`, `tests/integration/brewMesuresCurseur.test.tsx` (14), `tests/integration/brewSuiviThermiquePremierPlan.test.tsx`. Rouges sur le tag : `rouge-avant.txt`.
Dans la voie : `banc.mjs` (banc Chrome), `cote-a-cote.mjs`, `liste-rouges.mjs`, `captures/`.

## Critères
- `tsc --noEmit` : 2 erreurs, `firebase-admin/firestore` dans `functions/` (environnement, identiques sur le tag, vérifié sur `p1-tag-wt`). `seedData.ts` (ignoré par Git) copié depuis `seedData.example.ts` dans les deux worktrees.
- Suite complète `tests/unit tests/integration` (`tests.txt`, `tests.json`) : 59 fichiers rouges dont ~50 « 0 test » (chargement : `firebase-admin` absent). Les 7 fichiers avec tests rouges (`rouges-p1.txt`) rejoués sur p1 et sur le tag (`rouges-*-rejeu.txt`) :
  - déjà rouges sur le tag : `designTokens`, `fuzzSaisie`, `recipeAiWorkflow`, `recipeEditing`, `virgule-transversale` ;
  - NOUVEAU rouge dû à p1 : `brewWorkspace` (3 tests : titre du pH « à confirmer à froid / à remesurer » et « Bilan du brassage » perdus). Cause dans le code, corrigée (f8a69651) : le titre neutre revient dans la ligne, le bilan de clôture passe aussi à la carte « Relevés du jour ».
  - Après correction : les 22 fichiers qui touchent BrewDayPage, BrewDayMeasurements, BrewReadingsSummary ou BrewThermalControl : 154 tests verts (`tests-brassage.txt`). La suite complète n'a pas été relancée en entier après la correction.
- Test écrit puis corrigé à la cause : `brewMesuresCurseur` (le palier ouvre Mesurer sur pH, le test cliquait sans choisir l'onglet Température : défaut du test).
- Build : `npm run build` s'arrête sur le `tsc` d'environnement (même erreur sur le tag). `VITE_HOP_V4=on vite build` + `check-private-research` + `check-build-flags` : EXIT 0, « DRAPEAUX OK » (`build-vite.txt`).
- Captures : Chrome réel (puppeteer-core, tactile 390 puis 1280, clair et cave), banc local `?preview=brew&view=brassage&stage=mash-0`, clés Firebase factices, aucune donnée réelle. Dans `captures/` : `p1-{repos,mesurer,pouce,hors,apres}-{390,1280}-{clair,cave}.png` (20) et `cote-a-cote-*.png` (9, maquette `page-v2/img/m2-*` à gauche, app à droite). Ouvertes : repos 390 clair, mesurer 390 clair/cave/1280, pouce 390, hors 390 clair/cave/1280, après 390 (certaines avant la dernière retouche CSS ; mesurer 1280 rouvert après).

## Fait, vu au rendu (conforme à m2)
Carte « Relevés du jour » à vide dès que l'étape attend (Maische « ? °C » ambre « maintenant », pH « ? » gris « dès 15 h 21 ») ; horloge « relevé ? » ; Suivi thermique replié, plus de « montée 0,1 min » ; Mesurer : pouce pointillé, toucher le pouce pose 67,0 et active Enregistrer, toucher la piste pose (65,1), ±0,1, crayon, verdict unique « ⚠ −0,9 sous la cible 66–68 °C » / « ✓ dans la cible », traits sous le rail, « maische à cœur », pied « Aucun relevé ce palier · un toucher sur le pouce pose 67,0 », « Pourquoi maintenant » ; après le relevé, « à l'instant · ✓ dans la cible 66,6 °C » dans la carte. `role="slider"`, flèches, Entrée sur le pouce, jamais `type="number"`.

## Écarts au port
1. Le curseur de densité/volume prend la bande du code (OG ± 2 points, volume ± 5 %), la maquette n'avait qu'un repère. Volume attendu seulement à l'ensemencement et avant ébullition (pas de cible de volume au refroidissement dans le code).
2. Raison de la température : texte générique (la maquette citait 66/68, faux pour un autre palier).
3. Gardés de l'app, absents de la maquette : bouton « Volume + densité » dans Mesurer ; la feuille reste ouverte après Enregistrer (message « ajouté au journal » + « Corriger le relevé »). La maquette « après » montre la feuille fermée.
4. Ligne « cible 66–68 °C » sans « · maintenant » ambre (la maquette l'ajoute).
5. Pas de « loin » ambre (cas sans bande de la maquette : le code a toujours une bande).
6. Pied « Aucun relevé … » ne dit pas « exemple » (marque de maquette). En police mono, « 67,0 » a un espace visible.
7. Le champ tapé à 1280 reste affiché, qualificatif à sa gauche ; dans la maquette il est à droite du champ.

## Doutes
- Hors des captures : pas de test Chrome du refroidissement/ensemencement (carte avec bilan de clôture), couvert seulement par `brewWorkspace`.
- Toucher/glisser testés par tap puppeteer, pas sur un vrai téléphone.

## Retouche pilote (agent neuf, sur 0cb79bde) — sha final 0da8e635
Test écrit d'abord, rouge sur 0cb79bde : `tests/integration/brewOrdreM2.test.tsx` (4 rouges sur 6 : Suivi thermique hors de l'horloge et après À anticiper, ordre CSS à 390 des deux blocs, phrase au premier plan). Maintenant 6 verts.
1. Ordre : à 390, `.brew-readings-summary[data-attendues]` passe au rang 3, avant Grains (4) (`brew-day.css`, bloc z1 final). À 1280 le DOM mettait déjà Relevés avant Grains. Sans mesure attendue, l'ancienne carte garde sa place après « Ensuite ».
2. Suivi thermique : sorti de l'horloge (`BrewDayPage.tsx`) et rendu dans la colonne latérale, après À anticiper, avant Aides et repères ; rang 8 à 390 (`details.bz-suivi`). Il reste ouvert d'emblée pendant la montée.
3. Feuille Mesurer : « Température sous la consigne. Homogénéise… » n'est plus au premier plan quand l'échelle dit déjà l'écart (titre « Écart… ») ; elle s'ajoute au texte de « Pourquoi maintenant » (`BrewDayMeasurements.tsx`). Les alertes de bornes (AM-41 à 43) gardent leur phrase.
Tests : 24 fichiers (les 22 des écrans, brewOrdreM2, brewMeasuresAttendues) : 24 passés (`tests-retouche.txt`). `tsc` : seules les 2 erreurs d'environnement (`firebase-admin/firestore`, identiques sur le tag). Suite complète non relancée.
Captures (banc `banc-sortie-retouche.txt`, Chrome réel, serveur local sur le port 3012, arrêté ensuite) : `p1-*` refaites (390 et 1280, clair et cave) ; côte à côte `cote-a-cote-{repos,hors,apres}-390-{clair,cave}`, `repos-1280-clair`, `hors-1280-clair`, `mesurer-*`, `pouce-390-clair`. Ouvertes : repos 390 clair, hors 390 clair, après 390 cave, repos 1280 clair : ordre conforme à m2 (horloge, Relevés, Grains, À anticiper, Suivi thermique, Aides et repères), phrase absente. Non ouvertes une à une : repos 390 cave, hors 390 cave, après 390 clair, hors 1280 clair (même code que les ouvertes).
Limites : repos cave, après cave et repos 1280 n'ont pas de maquette m2 : comparés à la maquette claire ou à `curseur-1280` la plus proche. Dans m2, « Pourquoi maintenant » est ouvert ; dans l'app il est replié (non demandé). La feuille reste ouverte après Enregistrer (décision plus bas).

DÉCISION À PRENDRE : la feuille Mesurer doit-elle se fermer après Enregistrer, comme la maquette « après » ? Options : (a) rester ouverte (comportement actuel, permet pH puis température d'affilée) ; (b) se fermer et laisser voir la valeur dans la carte. Recommandation : (a), à confirmer en montrant les deux au brasseur.

CONNAISSANCE : `src/data/seedData.ts` est ignoré par Git : un worktree neuf ne démarre pas (banc, tsc) sans copie de `seedData.example.ts` ; le banc `?preview=brew` veut aussi des `VITE_FIREBASE_*` factices.
LEÇON PROPOSÉE : aucune
