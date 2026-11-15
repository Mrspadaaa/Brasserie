# Voie pc — Prix : chaque donnée manquante a son renvoi et son explication (CP-3)

Agent : auteur (Sonnet), plafond 80. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, capture de Clients › Prix en ligne)
« Je comprends pas les données manquantes, comment je fais pour les entré, il faudrait un renvoi et une explication »
Sur sa capture : « Il te reste ? coût du litre à compléter », graphe hachuré, « ? CHF/L · à compléter › », « ? L nets · ? paient le
brassin », tuiles « 75 cl prix ? » et « Fût 20 L prix ? », rangée « À compléter » d'anciens tarifs (« Amber Ale 50L (67 btl) · 603,00 › »).

## Portée (L01, lecture étroite)
L'écran Clients › Prix seul (`src/ui/prix/PrixEcran.tsx`, maquette choisie c7c, port déjà fait). On n'ajoute ni carte ni écran : le
bloc existant « À compléter » (rangée en pointillé sous les tuiles de format) devient la liste de ce qui manque, dans la même langue
(pointillé = inconnu, chevron › = s'ouvre). Le reste de l'écran ne bouge pas (règle n° 1 : sa maquette c7c, `work/missions/2026-11-09-compta-prix/p4/`
ou `p5/` selon c7c, captures `critique/cote-a-cote/`). Acquis à copier : les lignes-tâches « Confirmer les paiements (n) › » qu'il aime
(`voies/COMMUN.md`, capture `critique/brasseur-10-11-taches-filtres.jpg`) : une ligne = ce qui manque + › , un toucher ouvre l'endroit filtré.

## Ce qu'il faut (plancher à enrichir)
Le bloc « À compléter » : une phrase courte qui dit l'effet (« Il manque ces données pour savoir ce qu'il te reste : »), puis UNE ligne par
donnée manquante, dans l'ordre du calcul, chacune avec : ce qui manque (nommé, avec le brassin ou le format), une explication courte de
son effet (ex. « sans eux, pas de coût du litre »), et un toucher qui ouvre directement l'endroit où la saisir. Seulement les manques réels :
- **Litres conditionnés** du brassin inconnus (`chiffrage.litres === null` ou `notions.manque` contient « litres nets ») → ouvre la fiche
  du brassin (`BatchDetailSheet`, lazy, comme `src/ui/production/impotAnnee/ImpotAnnee.tsx` le fait) sur la rubrique où on les note
  (trouve-la par grep : conditionnement / mesures).
- **Ingrédients sans prix** (les autres noms de `chiffrage.notions.manque`) → ligne « Prix de N ingrédients · noms » ; ouvre le coût du
  brassin (`BrewBudgetDialog`, déjà branché par « ? CHF/L · à compléter › ») où le nœud « ? » se touche.
- **Densité** inconnue si elle empêche l'impôt du format (`impotUnite` null) → fiche du brassin sur Mesures (même geste que la feuille p2b,
  `onNoteDensity`).
- **Prix d'un format** absent (tuile « prix ? ») → ouvre `TarifSheet` sur ce format (le geste de « Fixer le prix »).
- **Emballage de l'unité** manquant (`prx-aide` actuel) → devient une ligne qui ouvre le tarif.
- **Anciens tarifs sans format** (`completer`) : garder leurs puces telles quelles, précédées d'une explication d'une ligne (« sans format,
  ce prix n'entre pas dans le calcul : choisis 33 cl, 75 cl ou fût ») ; chaque puce ouvre son tarif (déjà).
- **Volume annuel** (« volume annuel à renseigner ») : renvoi s'il existe un chemin (événement ou ouverture déjà dans l'app, grep) ; sinon
  l'explication dit où (Finances › profil) et le RESULTAT le liste.
- « coût du litre à compléter » de la tête et « ? CHF/L · à compléter › » : inchangés de forme ; la tête peut renvoyer au bloc (ancre) si
  simple. Rien n'invente un chiffre (inconnu ≠ 0).
Budget : premier plan léger (DESIGN.md « Deux régimes ») ; les lignes ne répètent pas ce que la ligne voisine dit déjà.

## Possède
`src/ui/prix/PrixEcran.tsx`, `src/ui/prix/prix.css`, `src/ui/prix/donneesPrix.ts` (un calcul pur `manquesPrix(...)` si utile),
`tests/integration/prixACompleter.test.tsx` (neuf), les tests existants de l'écran Prix qui lisent le bloc « À compléter » (grep),
`work/missions/2026-11-09-compta-prix/voies/pc/**`.

## Étapes
1. Lire PrixEcran.tsx, donneesPrix.ts, chaineLitre.ts (`troisNotions`, `manque`), BatchDetailSheet (rubriques), TarifSheet (props).
2. Test rouge d'abord : `tests/integration/prixACompleter.test.tsx`, une règle par manque (nommé, explication, toucher qui ouvre le bon
   endroit), sur une fixture minimale (brassin sans litres conditionnés, un ingrédient sans prix, tarif 75 cl absent, un ancien tarif sans
   format). Il doit échouer sur HEAD (sortie dans `voies/pc/tests-rouge.txt`).
3. Code, puis vert : `npx vitest run tests/integration/prixACompleter.test.tsx <tests Prix existants> --reporter=dot > voies/pc/tests.txt 2>&1`.
   `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ; `npx vite build --outDir "$TEMP/pc-build"`.
4. Captures 390 tactile et 1280, clair et cave, sur `?dev-local&finance-demo=reel` (le jeu qui imite ses données) : écran Prix au repos,
   et après le toucher de chaque ligne (la fiche ouverte). Serveur : `npx vite --port 3001 --strictPort` en arrière-plan ; l'arrêter à la fin.
   Ouvre chaque capture (L12) ; une liste « combien et quels problèmes ? » dans RESULTAT.md.

RESULTAT.md tenu au fil dans `voies/pc/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle.
Rends une ligne.
