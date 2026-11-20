# Voie v-pm1 — pm1 — le palier appelle la mesure

- Mission : 2026-11-20-port-simplicite
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 90 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (option prudente et réversible, écrite dans RESULTAT.md)

## Objectif
Au palier d'empâtage du jour J : la carte warn « Température du palier · à relever » avec un curseur posé sur la cible (repère vert), « 67 °C · proposé, à confirmer » ; la carte « pH d'empâtage · à 15′ » au curseur sur la cible, « 5,3 · cible 5,2 à 5,4 » ; « Relever » et « Plus tard ». Rien n'est noté sans son toucher.

## Entrées
- `src/ui/BrewThermalControl.tsx` — l. 86 « à mesurer », l. 109 « Relever le moût »
- `src/pages/BrewDayPage.tsx` — l. 1608 « maintien 67 °C · relevé — »
- `src/ui/BrewDayMeasurements.tsx` — l'écriture d'une mesure (avec src/services/brewTimer.ts)
- `work/missions/2026-11-20-port-simplicite/maquette/index.html` — maquette choisie, figure « pm1 » ; captures `work/missions/2026-11-20-port-simplicite/maquette/captures/`

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/BrewThermalControl.tsx`
- `src/ui/brassage/AppelMesure.tsx`
- `src/pages/BrewDayPage.tsx`
- `src/domain/appelMesure.ts`
- `tests/unit/appelMesure.test.ts`
- `tests/unit/appelMesureVue.test.tsx`
- `work/missions/2026-11-20-port-simplicite/voies/v-pm1/`

## Consignes
Racine du dépôt : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche `claude/port-carnet-1711`). Ton port de banc : 3116.
- `src/pages/BrewDayPage.tsx` : la zone du palier seulement.
- Le curseur part sur la cible (température du palier de la recette ; pH : milieu de la plage cible, grep targetPh), la valeur affichée est « proposé, à confirmer » tant qu'il n'a pas touché « Relever » ; « Relever » écrit la valeur du curseur par le chemin existant des mesures ; « Plus tard » ne note rien et laisse « à relever ». Cible inconnue : pas de valeur proposée (« — »), jamais inventée.
- Le pH « à 15′ » : 15 min après l'empâtage ; s'il existe une donnée de procédé à ce sujet, l'utiliser.
- Retouche gardée (registre) : « pm1 montre la valeur proposée (67 °C, à confirmer) et un curseur de pH, dans le compagnon p2a ». Le compagnon est la vue du jour de brassage (BrewSheetWithCompanion / BrewDayPage) : la carte se place au palier en cours et remplace le petit bouton actuel.
- Banc : `?preview=brew&view=brassage` (verification-locale), phase empâtage via `.brew-phase`.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- **Règle n° 1 (CLAUDE.md)** : sa maquette choisie est la base, reprise telle quelle (éléments, ordre, mots, couleurs de rôle : warn, ok, acc, gh). Avant le code, écris dans RESULTAT.md l'« Inventaire » de chaque élément et de chaque état de la figure ; à la fin, chaque ligne de l'inventaire dit où elle est dans l'app. Rien d'ajouté que la maquette n'a pas, sauf ce qu'exige une fonction existante (rien ne se perd : aucune fonction ni donnée retirée ; le détail reste à un toucher).
- Maquette : `work/missions/2026-11-20-port-simplicite/maquette/index.html` (figure `data-variante="<id>"`), captures `work/missions/2026-11-20-port-simplicite/maquette/captures/<id>-clair.png` et `-sombre.png`. Contexte de la mission d'origine : `work/missions/2026-11-20-port-simplicite/maquette/RESULTAT.md`, `work/missions/2026-11-20-port-simplicite/maquette/REGLE-CONSOMMATION.md`.
- Frontend : lire une fois `.claude/rules/affinee-frontend.md`, puis les parties utiles de `DESIGN.md` (tokens, échelle) et `docs/ui-compacte.md`. Skills `boosters-ux` et `impeccable` avant l'écran (lire leur SKILL.md si l'outil Skill manque). Jetons de l'app seulement (classes cave-*, ebc-*, attention, hop, water…), deux thèmes.
- Saisie au téléphone : jamais `type="number"` (cerveau/produit/saisie-mobile.md) ; un nombre au doigt se donne au curseur (« utilise des slider », 10.11).
- Inconnu ≠ 0 : une valeur inconnue s'affiche « — » ou « à relever », jamais 0, jamais inventée.
- Moins de gestes partout, sans perte de qualité (SPEC-BRASSEUR 20.11).
- L'IA reste simulée : aucun appel Gemini réel, ni en test ni en banc.
- Worktree partagé avec d'autres voies et sessions : n'écris QUE dans « Possède ». Interdit : `src/components/tabs/StocksTab.tsx`, `src/domain/stock/articleACreer.ts`, `tests/unit/stockArticleNeufE11.test.ts`, `tests/unit/wizardTour3Bw.test.tsx` (travail E1-1 non commité) et tout fichier modifié non commité que tu n'as pas créé (`git status --short` au début, garde la liste). Aucun commit, aucun stash, aucun `git checkout`/`restore` : le pilote commite par chemins. Pas de `npm run build` (dist/ partagé) : `npx tsc --noEmit -p tsconfig.json` pour le typage ; le pilote fait le build.
- Banc : `npx vite --port <ton port> --strictPort` en arrière-plan, puis `http://localhost:<port>/?dev-local` (cerveau/agents/verification-locale.md : recharger dur, redimensionner PUIS recharger ; fixtures par `import('/src/services/firestoreRepo.ts')` puis `FirestoreRepo.put`). Captures puppeteer-core (Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`, skill webapp-testing) : 390×844 tactile (`hasTouch`, `isMobile`) et 1280×800, thème clair et cave, chaque état de l'inventaire. Chaque capture OUVERTE (Read) et posée à côté de la capture de maquette ; écris pour chaque paire « écarts : … » dans RESULTAT.md. Arrête ton serveur à la fin.
- Un test qui échoue AVANT ton code (le lancer et noter la sortie rouge dans RESULTAT.md), vert après.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments (Inventaire, test rouge puis vert, écarts par capture, DEMANDE PILOTE, LEÇON PROPOSÉE / CONNAISSANCE éventuelles).
- `npx vitest run tests/unit/appelMesure.test.ts tests/unit/appelMesureVue.test.tsx --reporter=dot > work/missions/2026-11-20-port-simplicite/voies/v-pm1/tests.txt`, et les tests existants des fichiers touchés rejoués, rouges hors zone dits.
- Captures dans `work/missions/2026-11-20-port-simplicite/voies/v-pm1/captures/` : 390 tactile et 1280, clair et cave, chaque état, ouvertes, à côté de la maquette.
Réponse finale au pilote : une ligne.
