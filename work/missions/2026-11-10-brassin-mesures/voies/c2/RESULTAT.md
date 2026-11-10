OK (partiel, reste la série mécanique) — toute mesure a son curseur sans cible ; champ tapé au doigt visible et non coupé ; c2/curseur 10f5fd33

Worktree `C:/Users/mrspa/AppData/Local/Temp/c2-wt`, branche `c2/curseur`, base tag `en-ligne/2026-11-10-fiches`. Aucun déploiement, donnée réelle, ni Gemini.
Worktree de référence (tag, détaché) : `C:/Users/mrspa/AppData/Local/Temp/c2-tag-wt` (à retirer après : `git worktree remove --force`).

## Causes (vues au rendu, `captures/avant-*`, `banc-avant.txt`)
1. Sans cible, `measureScale` rendait `null` : aucun curseur (ébullition : pas de `tempC` ; pH hors empâtage ; densité hors OG ; volume sans cible).
2. Champ coupé / disparu : au doigt, `Input` rend un `<textarea>` (une ligne) ; `brew-day.css` ne stylait que `.bz-saisie input`. Le textarea restait sans bord ni fond (`border 0px`) : « plus aucun champ » ; focus en contour hors champ, rogné à gauche par la feuille.

## Fichiers écrits (dans c2-wt, commit 10f5fd33)
- `src/domain/measureSlider.ts` : `bornesPlausibles(kind, step, recipe)` (pH 4,8–6,0, eau 5–9 ; température ébullition 90–102, refroidi 10–30, whirlpool 60–100, rinçage/avant chauffe 50–90, ailleurs 10–100 ; densité 1,000–1,120 ; volume 0,6×–1,4× le volume prévu de l'étape, sinon 1–60 L), `departCurseur` accepte `milieu`, `traitsCurseur` plafonné à 24 traits.
- `src/ui/BrewDayMeasurements.tsx` : `measureScale` ne rend plus `null` ; `cible: boolean`, `milieu`. Sans cible : pas de bande, pas de « cible a–b », pas de verdict « dans/sous la cible », pouce pointillé au milieu. Avec cible : inchangé.
- `src/pages/brew-day.css` : `.bz-saisie :is(input, textarea)` (bord, fond, hauteur, police), contour de focus en `outline-offset: -2px` (jamais rogné).
- Tests : `tests/integration/brewMesuresSansCible.test.tsx` (nouveau, 17 tests, tous ROUGES sur le tag : `c2-rouge-avant` 17/17), `tests/integration/brewMesuresCurseur.test.tsx` (un test change : « sans échelle documentée… pas de curseur » devient « bornes plausibles, sans bande » : il encodait le défaut).
- Dans la voie : `banc.mjs` (banc Chrome 390 tactile), `banc-avant.txt`, `banc-apres.txt` (premier jeu), `tests.txt`, `captures/`.

## Critères
- Tests ciblés (nouveau + brewMesuresCurseur + brewMeasuresAttendues) : 3 fichiers, 44 verts.
- `tsc --noEmit` : seules les 2 erreurs d'environnement `firebase-admin/firestore` (`functions/`), identiques sur le tag.
- Suite complète (`tests.txt`, lancée avant la dernière retouche des traits) : 12 tests rouges, 12 994 verts. Les 12 sont dans les 5 fichiers déjà rouges sur le tag (fuzzSaisie 2, recipeAiWorkflow 2, recipeEditing 6, designTokens 1, virgule-transversale 1) ; zéro fichier nouveau (les autres « FAIL » sont des fichiers à 0 test, `firebase-admin` absent). Le rouge virgule-transversale cite le même offenseur (`BrewDayMeasurements.tsx` `{…} %`) sur le tag et sur c2 : identique. Le VOIE.md annonçait 11 ; le compte exact est 12. À rejouer après le dernier commit (DEMANDE EXECUTANT n° 1).
- Build : non lancé. Voir DEMANDE EXECUTANT.
- Captures : premier jeu `captures/apres-*` pris AVANT la dernière retouche (traits ≤ 24) et avec un artefact de banc (« 96,096,5 » : la frappe s'ajoutait à la valeur posée). Ouvertes : boil-0 temp repos clair, pouce clair, champ-ferme cave : curseur 90–102, pouce pointillé puis posé 96,0, champ visible avec bord, plus rien de coupé. Non ouvertes : volume, densité, pH, clavier (même code).

## DEMANDE EXECUTANT
1. `cd C:/Users/mrspa/AppData/Local/Temp/c2-wt` puis `npx vitest run tests/unit tests/integration --reporter=dot > <voie>/tests.txt 2>&1` (voie = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-10-brassin-mesures/voies/c2`). Attendu : exactement les 11 rouges du tag (fuzzSaisie, recipeAiWorkflow, recipeEditing, designTokens, virgule-transversale), zéro nouveau, `brewMesuresSansCible` vert. Si un nouveau rouge apparaît : me le renvoyer (fichier + message), sans corriger.
2. `VITE_HOP_V4=on npx vite build` dans c2-wt : attendu EXIT 0 (sortie dans `<voie>/build-vite.txt`).
3. Vite de dev déjà lancé sur http://127.0.0.1:3021 (relancer si absent : `VITE_FIREBASE_API_KEY=fake VITE_FIREBASE_PROJECT_ID=demo VITE_FIREBASE_APP_ID=1:1:web:1 VITE_FIREBASE_AUTH_DOMAIN=demo.firebaseapp.com VITE_FIREBASE_STORAGE_BUCKET=demo.appspot.com VITE_FIREBASE_MESSAGING_SENDER_ID=1 VITE_HOP_V4=on npx vite --port 3021 --host 127.0.0.1` dans c2-wt). Supprimer `<voie>/captures/apres-*`, puis `cd <voie> && node banc.mjs http://127.0.0.1:3021 captures apres > banc-apres.txt` (≈ 5 min, lancer en arrière-plan). Fichiers : `captures/apres-<étape>-<mesure>-<état>[-kb]-390-<clair|cave>.png` (états repos, pouce, champ-clavier, champ-ferme). Attendu dans `banc-apres.txt` : `curseur` non nul partout, `cible:false` pour boil-0 temp / volume, preboil densité / pH ; `champ.visible:true` et `bord:1px` à champ-ferme ; aucun `pageerror`, aucun « introuvable ».
4. Ouvrir en image et décrire (sans juger) : boil-0 temp (repos, pouce, champ-clavier-kb, champ-ferme) clair et cave ; boil-0 volume repos ; refroidi densité repos ; preboil densité repos et pouce ; preboil pH repos. Me renvoyer les chemins et ce qui se voit (le champ coupé ou absent, des traits trop serrés, une valeur « 96,096,5 » restante).
5. Arrêter le serveur de dev ; `git -C <repo> worktree remove --force C:/Users/mrspa/AppData/Local/Temp/c2-tag-wt`. Dans c2-wt : `git status --short` doit être vide hors `seedData.ts` (ignoré) ; committer toute retouche par chemins.

## Doutes et limites
- Densité et température « au refroidi » ont une cible dans le banc (OG visée, pitch 18 °C) : leur bande reste (non touchée). Le cas sans cible de la densité se voit à l'avant-chauffe (preboil).
- Volume sans cible : étendue 0,6×–1,4× du volume prévu de l'étape (heuristique de plausibilité, pas une cible) ; pH de l'eau (étape « eau ») 5–9 : ajouté par moi, hors liste du VOIE.md, à valider.
- Un relevé tapé hors de l'étendue étire l'échelle (un « 96,5 » de volume fait un rail de 11 à 98 L) : voulu (jamais un trait collé au bord), mais l'échelle devient peu précise.
- Toucher/glisser testés par tap Chrome émulé, pas sur un téléphone réel. Aucun contrôle « clavier réel » (`?keyboard=330` ne simule que l'inset).
- Le test CSS lit `brew-day.css` (textuel) : il garde la règle textarea, pas le rendu.

CONNAISSANCE : au doigt, `Input` (src/ui/Input.tsx) rend un `<textarea>` ; toute règle CSS écrite pour `input` seul y manque, donc `.bz-saisie`, `.bz-heure-reelle input` et `.bz-moutajout-val input` (brew-day.css) sont à vérifier aussi (non touchés).
LEÇON PROPOSÉE : un test de rendu en jsdom ne voit pas le CSS : pour un champ « invisible », lire le style calculé dans Chrome (`getComputedStyle` bord/hauteur) dans le banc, pas seulement le DOM.
