# Voie port-b1 — port 1:1 : la barre du bas et le + selon l'écran (b1r) (mission 2026-11-14-ecrans-transversaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote (son choix du 15.11)
- **Dossier de travail : `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`** (worktree partagé avec les autres voies de port, branche `claude/ecrans-transversaux`, basée sur le tag
  déployé `en-ligne/2026-11-14-atelier-uv4` ; node_modules et functions/node_modules installés ; `.env` et `seedData.ts` copiés).
  Tout le code s'écrit là. Une autre voie peut coder en même temps : ne touche que tes fichiers ; avant `npm run build`, crée `build.lock`
  à la racine du worktree (attends s'il existe), supprime-le après ; ne commite que tes chemins (jamais npm-ci*.log ni build.lock).
- Lis : `CLAUDE.md`, `.claude/rules/affinee-frontend.md` ; `DESIGN.md` lignes 101-200 et 401-606 ; dans le dépôt principal (lecture seule,
  `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-ecrans-transversaux/`) : `voies/voie-r-b1/b1r.html`, `NOTE.md` (menu de chaque écran, pour le port), toutes ses captures dont `b1r-ecrans-390.png` ; sa base `voies/voie-barre/b1*.png` ; `voies/voie-critique/REPRISES.md` section b1r (corrections 2 à 5 à faire au port : même action et même libellé aux deux largeurs ; Impôt bière et Prix et marges ont aussi leur menu). Skills : `senior-frontend`, `a11y-audit`, `boosters-ux`.

## Règle n° 1 (ses choix)
« C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Sa maquette est reprise telle quelle (L03) : inventaire de
chaque élément, état et geste ; un port retire ce qu'elle n'a pas. Ses mots : « Le + à ordre figé / b1 -> le + doit être dynamique en fonction de l'écran ou on est » ; BX-4 (09.11) : « sur plein d'écran il est pas au bon endroit. Différents, donne pas les bonnes actions ».
Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même place du + sur tous les écrans (D119, D129, BX-4) ;
aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ; rien de perdu (chaque action d'aujourd'hui garde sa
fonction, hors ligne compris) ; la caisse v3a (+ › Vendre) et la Dépense ne changent pas ; Bord et Clients : seuls leur onglet et leur +.

## Objectif
Porter la feuille du + de b1 (zone « Sur cet écran » à la couleur de la rubrique, puis ce qui sert depuis cet écran), un menu propre à chaque écran et sous-écran (`src/domain/fabActions.ts` étendu, une table par écran, testée), un seul + à l'écran (l'Atelier perd son + interne au profit du flottant), au 1280 le rail latéral de b1 avec les lettres de raccourci N, E, F, V, le toast rangé au-dessus de la barre sans couvrir l'en-tête, « Hors connexion » dans l'entrée Compagnon (plus de pastille flottante). Contrôle ET-PLUS : étends `work/missions/2026-11-09-bouton-plus/audit-plus.mjs` (copie dans ta voie) pour exiger que le menu diffère d'un écran à l'autre au-delà de la première ligne ; il doit échouer sur le tag de départ et passer sur ton port. Les données viennent de l'app, jamais des exemples de la maquette. Ce que la maquette montre et que l'app ne sait pas :
« manque : … » dans RESULTAT.md, sans couche parallèle.

## Contrôles (tous écrits dans des fichiers)
- `npx tsc --noEmit -p . > work/missions/2026-11-14-ecrans-transversaux/voies/port-b1/tsc.txt 2>&1` → aucune erreur.
- `npx vitest run tests/unit/plus-ecran --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-b1/tests.txt 2>&1` → verts ; `npx vitest run tests/unit --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-b1/tests-tout.txt 2>&1` sans nouvel échec.
- `npm run build > work/missions/2026-11-14-ecrans-transversaux/voies/port-b1/build.txt 2>&1` → vert.
- Captures par la vraie entrée, serveur `npx vite --port 3033 --strictPort` dans le worktree, `?dev-local` : chaque état, 390 tactile
  (DPR 2) et 1280, clair et cave, dans `work/missions/2026-11-14-ecrans-transversaux/voies/port-b1/captures/`, et des planches côte à côte avec la maquette (`work/missions/2026-11-14-ecrans-transversaux/voies/port-b1/captures/cote-a-cote-*.png`).
  Si ton contexte dépasse 140 k avant les captures, écris une section `DEMANDE EXECUTANT :` (liste exacte des captures et planches) dans
  RESULTAT.md et rends la main. puppeteer-core : `createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- RESULTAT.md tenu au fil (une ligne par étape ; une limite de tours ne doit rien perdre). Arrête ton serveur à la fin.

## Possède
Dans le worktree : `src/components/BottomNav.tsx`, `src/domain/fabActions.ts`, le menu du + (trouve son composant par grep « Actions rapides » ; la Dépense et la caisse v3a ne changent pas), le + interne de l'Atelier, de petites éditions ciblées de `src/App.tsx` (rail et place du toast ; Edit seulement, relire avant chaque édition : la voie port-m3 peut y écrire aussi), un dossier neuf `src/components/navigation/**`, `tests/unit/plus-ecran*.test.ts`. Dans le dépôt principal : `work/missions/2026-11-14-ecrans-transversaux/voies/port-b1/**`. Commit dans le worktree par chemins, en français, fin
« Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com> ». Aucun déploiement, aucun push, aucune donnée réelle, ni stash ni checkout.

## Rendre
Une ligne : « port-b1 : OK, tsc/tests/build verts, commit <sha> » ou « port-b1 ECHEC : <raison> » ou « REPRISE : <RESULTAT.md> ».
