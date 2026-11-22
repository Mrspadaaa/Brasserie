# Voie port-m3 — port 1:1 : l'en-tête et la page « Plus » (m3) avec la période m3r-a (mission 2026-11-14-ecrans-transversaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote (son choix du 15.11)
- **Dossier de travail : `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`** (worktree partagé avec les autres voies de port, branche `claude/ecrans-transversaux`, basée sur le tag
  déployé `en-ligne/2026-11-14-atelier-uv4` ; node_modules et functions/node_modules installés ; `.env` et `seedData.ts` copiés).
  Tout le code s'écrit là. Une autre voie peut coder en même temps : ne touche que tes fichiers ; avant `npm run build`, crée `build.lock`
  à la racine du worktree (attends s'il existe), supprime-le après ; ne commite que tes chemins (jamais npm-ci*.log ni build.lock).
- Lis : `CLAUDE.md`, `.claude/rules/affinee-frontend.md` ; `DESIGN.md` lignes 101-200 et 401-606 ; dans le dépôt principal (lecture seule,
  `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-ecrans-transversaux/`) : `voies/voie-menu/m3.html` et ses captures (sa maquette choisie, telle quelle), `voies/voie-r-m3/m3r-a.html` et ses captures (la période : provisoire tant qu'il n'a pas choisi entre m3r-a, b et c — https://claude.ai/artifact/H9K7tsC6CKoQHQNZW9pL6P ; garde le code de la période isolé pour en changer sans perte), `voies/voie-critique/REPRISES.md` section m3r-a (corrections 1 à 4 : flèches et mois à 44 px, chiffres, Bord actif au 1280) et la section m3 de `voies/voie-critique/RESULTAT.md`. Skills : `senior-frontend`, `a11y-audit`, `boosters-ux`.

## Règle n° 1 (ses choix)
« C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Sa maquette est reprise telle quelle (L03) : inventaire de
chaque élément, état et geste ; un port retire ce qu'elle n'a pas. Ses mots : « Page « Plus » / m3 -> attention pour l'interval de temps ça doit être mieux fait. Et on peut le réglés à plusieurs endroits, attention à ce détails très important !! / Duo d'avatars, page plein écran. ».
Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même place du + sur tous les écrans (D119, D129, BX-4) ;
aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ; rien de perdu (chaque action d'aujourd'hui garde sa
fonction, hors ligne compris) ; la caisse v3a (+ › Vendre) et la Dépense ne changent pas ; Bord et Clients : seuls leur onglet et leur +.

## Objectif
Porter l'en-tête de m3 (duo d'avatars G/A à la place du ⋮ ; la loupe garde sa place ; le thème va dans la page Plus comme m3), la page « Plus » plein écran à sections de m3 (qui saisit avec la bascule, Thème, outils Assistant de brassage et Atelier R&D, administration Journal, Connexions cloud et IA, Réglages — ils ouvrent les feuilles déjà portées par les voies port-reglages et port-feuilles —, Se déconnecter), et la période m3r-a : **une seule période**, la même pastille « ‹ Nov. › » dans l'en-tête de chaque écran, réglable partout, qui change partout (une seule source dans l'app : les filtres locaux de Finances, Brassins (CatalogToolbar), Bord lisent la même ; grep TimeFilterPeriod). Contrôle ET-PER : un test Vitest qui échoue sur le tag de départ (deux sources indépendantes) et passe sur ton port, plus un parcours Chrome qui change la période dans l'en-tête puis lit Finances et Brassins. Les données viennent de l'app, jamais des exemples de la maquette. Ce que la maquette montre et que l'app ne sait pas :
« manque : … » dans RESULTAT.md, sans couche parallèle.

## Contrôles (tous écrits dans des fichiers)
- `npx tsc --noEmit -p . > work/missions/2026-11-14-ecrans-transversaux/voies/port-m3/tsc.txt 2>&1` → aucune erreur.
- `npx vitest run tests/unit/periode --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-m3/tests.txt 2>&1` → verts ; `npx vitest run tests/unit --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-m3/tests-tout.txt 2>&1` sans nouvel échec.
- `npm run build > work/missions/2026-11-14-ecrans-transversaux/voies/port-m3/build.txt 2>&1` → vert.
- Captures par la vraie entrée, serveur `npx vite --port 3034 --strictPort` dans le worktree, `?dev-local` : chaque état, 390 tactile
  (DPR 2) et 1280, clair et cave, dans `work/missions/2026-11-14-ecrans-transversaux/voies/port-m3/captures/`, et des planches côte à côte avec la maquette (`work/missions/2026-11-14-ecrans-transversaux/voies/port-m3/captures/cote-a-cote-*.png`).
  Si ton contexte dépasse 140 k avant les captures, écris une section `DEMANDE EXECUTANT :` (liste exacte des captures et planches) dans
  RESULTAT.md et rends la main. puppeteer-core : `createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- RESULTAT.md tenu au fil (une ligne par étape ; une limite de tours ne doit rien perdre). Arrête ton serveur à la fin.

## Possède
Dans le worktree : `src/components/Header.tsx` (le dialogue « Saisir au nom de » vient d'être extrait par port-feuilles : réutilise son composant), un dossier neuf `src/components/plus/**` et `src/components/periode/**`, les lecteurs de la période (`src/components/tabs/FinancesTab.tsx`, `ProductionTab.tsx`, `DashboardTab.tsx`, `src/ui/production/CatalogToolbar.tsx`, `ProductionCatalog.tsx` : seulement la source de la période), de petites éditions ciblées de `src/App.tsx` (Edit seulement, relire avant chaque édition : la voie port-b1 peut y écrire aussi), `tests/unit/periode*.test.ts`. Dans le dépôt principal : `work/missions/2026-11-14-ecrans-transversaux/voies/port-m3/**`. Commit dans le worktree par chemins, en français, fin
« Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com> ». Aucun déploiement, aucun push, aucune donnée réelle, ni stash ni checkout.

## Rendre
Une ligne : « port-m3 : OK, tsc/tests/build verts, commit <sha> » ou « port-m3 ECHEC : <raison> » ou « REPRISE : <RESULTAT.md> ».
