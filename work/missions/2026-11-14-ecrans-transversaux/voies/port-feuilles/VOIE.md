# Voie port-feuilles — port 1:1 : Journal des modifications, Connexions cloud et IA, Saisir au nom de, Mes conversations, Encaisser une vente selon d3p2 (mission 2026-11-14-ecrans-transversaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote (le brasseur a choisi d3p2 le 15.11)
- **Dossier de travail : `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`** (worktree à toi et à l'autre voie de port, branche `claude/ecrans-transversaux`, basé sur le tag
  déployé `en-ligne/2026-11-14-atelier-uv4`). Tout le code s'écrit là, jamais dans le dépôt principal. `.env` et `seedData.ts` y sont copiés.
- Lis : `CLAUDE.md` et `.claude/rules/affinee-frontend.md` (règle principale : densité utile, chrome compact) ; `DESIGN.md` lignes 101-200 et
  401-606 ; dans le dépôt principal (lecture seule, `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/`) : `work/missions/2026-11-14-ecrans-transversaux/voies/voie-p2-d3/d3p2.html`,
  `NOTE.md`, `RESULTAT.md` et toutes ses captures (`d3p2-*.png`, dont la planche des dix vues), `work/missions/2026-11-14-ecrans-transversaux/voies/voie-destinations/REPRISE.md`
  (le contenu réel de chaque vue, tiré du code), `work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/PASSE2.md` section d3p2 (défauts restants à corriger au port).
  Skills : `senior-frontend`, `a11y-audit`, `boosters-ux`.

## Règle n° 1 (ses choix)
« C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » d3p2 est **sa** maquette : la reprendre telle quelle (L03),
inventaire de ce qu'elle montre, chaque état, chaque geste ; un port retire ce qu'elle n'a pas. Ses mots : « Dessiné / d3p2 / Le métier dessiné,
bilan des réglages en tête. » Exigences transversales (L05) : densité utile et chrome compact ; même croix à la même place (D109, D129) ;
aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave (jetons DESIGN.md, `data-theme`) ; rien de perdu :
chaque champ et chaque action qui existe aujourd'hui garde sa fonction (enregistrement, validation, Firestore, hors ligne).

## Objectif
Porter dans l'app, 1:1, les vues 5 à 9 de d3p2 : Journal (frise par jour, parts par personne Gaëtan / Aricia touchables comme filtre, état vide sans filtre posé dit juste), Connexions cloud et IA (IA en segment Rapide/Max, Drive), Saisir au nom de (bascule G ↔ A, confirmation), Mes conversations (liste ; hors ligne dit, jamais un geste sans retour), Encaisser une vente (HT/TVA, client, conditionnement, règlement en segments). Les données affichées viennent de l'app (jamais les exemples de la maquette). Ce que d3p2 montre et
que l'app ne sait pas calculer : le dire dans RESULTAT.md (« manque : … ») et l'afficher sans inventer (état vide juste), sans couche parallèle.

## Contrôles (tous écrits dans des fichiers)
- `npx tsc --noEmit -p . > work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/tsc.txt 2>&1` (dans le worktree) → aucune erreur.
- Tests des règles (un test par règle : bilan des réglages, compte des trous, erreurs dites à leur ligne…) :
  `npx vitest run tests/unit/feuilles --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/tests.txt 2>&1` → verts ; puis la suite liée aux fichiers touchés (`npx vitest run tests/unit --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/tests-tout.txt 2>&1`) sans nouvel échec.
- `npm run build > work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/build.txt 2>&1` → vert.
- Captures par la vraie entrée (menu de l'app), serveur `npx vite --port 3032 --strictPort` dans le worktree, `?dev-local` : chaque vue,
  390 tactile (DPR 2) et 1280, clair et cave, dans `work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/captures/`, et une planche côte à côte avec la capture d3p2 de la même vue
  (`work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/captures/cote-a-cote-*.png`). Ouvre-les ; « combien et quels problèmes ? » ; corrige. puppeteer-core :
  `createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- RESULTAT.md tenu au fil (une ligne par vue portée ; une limite de tours ne doit rien perdre). Arrête le serveur à la fin.

## Possède
Dans le worktree seulement : `src/components/AuditLogModal.tsx`, `src/components/CloudConfigModal.tsx`, un dossier neuf `src/components/feuilles/**` (la vente et la saisie au nom y vivent en composants propres), le seul rendu de la vente dans `src/components/QuickActionModal.tsx` (une ligne qui appelle le nouveau composant, rien d'autre : la Dépense appartient à une autre mission), le seul dialogue « Saisir au nom de » dans `src/components/Header.tsx` (remplacé par l'appel au composant ; le reste de l'en-tête sera refait par le port de m3), le composant de la boîte de conversations (événement `brewer-inbox-open` ; trouve-le par grep), `tests/unit/feuilles*.test.ts`. Dans le dépôt principal : `work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/**`. Commit dans le worktree par chemins, message en français,
fin « Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com> ». Aucun déploiement, aucun push, aucune donnée réelle, ni stash ni checkout.

## Rendre
Une ligne : « port-feuilles : OK, <n> vues portées, tsc/tests/build verts, commit <sha> » ou « port-feuilles ECHEC : <raison> ».
