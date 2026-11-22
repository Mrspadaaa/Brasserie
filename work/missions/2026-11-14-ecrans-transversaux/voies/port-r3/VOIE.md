# Voie port-r3 — port 1:1 : la recherche r3p2 (le geste d'abord, au pouce) (mission 2026-11-14-ecrans-transversaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote (son choix du 15.11)
- **Dossier de travail : `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`** (worktree partagé avec les autres voies de port, branche `claude/ecrans-transversaux`, basée sur le tag
  déployé `en-ligne/2026-11-14-atelier-uv4` ; node_modules et functions/node_modules installés ; `.env` et `seedData.ts` copiés).
  Tout le code s'écrit là. Une autre voie peut coder en même temps : ne touche que tes fichiers ; avant `npm run build`, crée `build.lock`
  à la racine du worktree (attends s'il existe), supprime-le après ; ne commite que tes chemins (jamais npm-ci*.log ni build.lock).
- Lis : `CLAUDE.md`, `.claude/rules/affinee-frontend.md` ; `DESIGN.md` lignes 101-200 et 401-606 ; dans le dépôt principal (lecture seule,
  `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-ecrans-transversaux/`) : `voies/voie-p2-r3/r3p2.html`, `NOTE.md`, `RESULTAT.md` et toutes ses captures (`r3p2-*.png` : ouverte sans rien taper, « cit » tapé, rien trouvé, cave, ordinateur) ; `voies/voie-critique/PASSE2.md` section r3p2 (problèmes 1 à 5 à corriger au port : l'action de l'écran identique à la zone « Sur cet écran » du + porté, mêmes α, pas de doublon dans Aller à). Skills : `senior-frontend`, `a11y-audit`, `boosters-ux`.

## Règle n° 1 (ses choix)
« C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Sa maquette est reprise telle quelle (L03) : inventaire de
chaque élément, état et geste ; un port retire ce qu'elle n'a pas. Ses mots : « r3p2 top » (15.11).
Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même place du + sur tous les écrans (D119, D129, BX-4) ;
aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ; rien de perdu (chaque action d'aujourd'hui garde sa
fonction, hors ligne compris) ; la caisse v3a (+ › Vendre) et la Dépense ne changent pas ; Bord et Clients : seuls leur onglet et leur +.

## Objectif
Porter la recherche r3p2 : feuille au pouce à 390, champ collé au clavier, pastille de la rubrique d'où elle s'ouvre, « Ici » avec les gestes de l'écran (réemploie la table par écran de `src/domain/fabActions.ts` portée par port-b1, jamais une seconde liste), Reprendre (récents), Créer, Aller à, résultats par type avec leur valeur utile et leurs gestes sur la ligne (seulement ceux que l'app sait faire : Retirer, Brasser, Mesure…), archives en pointillé « N de plus dans les archives », rien trouvé, et au 1280 la palette clavier avec l'aperçu de la ligne choisie. cmdk et fuse.js sont déjà en place (État de l'art de MISSION.md) : aucun moteur de recherche neuf. Les données viennent de l'app, jamais des exemples de la maquette. Ce que la maquette montre et que l'app ne sait pas :
« manque : … » dans RESULTAT.md, sans couche parallèle.

## Contrôles (tous écrits dans des fichiers)
- `npx tsc --noEmit -p . > work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/tsc.txt 2>&1` → aucune erreur.
- `npx vitest run tests/unit/recherche --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/tests.txt 2>&1` → verts ; `npx vitest run tests/unit --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/tests-tout.txt 2>&1` sans nouvel échec.
- `npm run build > work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/build.txt 2>&1` → vert.
- Captures par la vraie entrée, serveur `npx vite --port 3035 --strictPort` dans le worktree, `?dev-local` : chaque état, 390 tactile
  (DPR 2) et 1280, clair et cave, dans `work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/captures/`, et des planches côte à côte avec la maquette (`work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/captures/cote-a-cote-*.png`).
  Si ton contexte dépasse 140 k avant les captures, écris une section `DEMANDE EXECUTANT :` (liste exacte des captures et planches) dans
  RESULTAT.md et rends la main. puppeteer-core : `createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- RESULTAT.md tenu au fil (une ligne par étape ; une limite de tours ne doit rien perdre). Arrête ton serveur à la fin.

## Possède
Dans le worktree : `src/ui/CommandPalette.tsx`, la construction des groupes de la palette (trouve-la par grep « searchCommandGroups » ; seulement elle), un dossier neuf `src/components/recherche/**`, de petites éditions ciblées de `src/App.tsx` (Edit seulement, relire avant chaque édition : la voie port-m3 peut y écrire aussi), `tests/unit/recherche*.test.ts`. Dans le dépôt principal : `work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/**`. Commit dans le worktree par chemins, en français, fin
« Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com> ». Aucun déploiement, aucun push, aucune donnée réelle, ni stash ni checkout.

## Rendre
Une ligne : « port-r3 : OK, tsc/tests/build verts, commit <sha> » ou « port-r3 ECHEC : <raison> » ou « REPRISE : <RESULTAT.md> ».
