# REPRISE V-STOCK (21.11, session 2, arrêt à ~170 k)

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Index partagé : commit seulement par `GIT_INDEX_FILE` temporaire + `update-ref`, puis `git reset -q -- <mes fichiers>` (sinon l'index partagé garde l'ancien blob et paraît « revenir en arrière »).

## Commité
- `f512c59e3` F2 (listeFiltres, RecompterStock, recompter.css, StocksTab `compterRayon`). `chaines.mjs --etape F2` : KO sur `en-ligne/2026-11-21-tour7` (« ne propose pas ✓ le reste du rayon »), `PARCOURS CHAINES OK` sur l'arbre.
- `p: 1` de principes (ligne Stocks) : déjà commité par une autre session dans `39a433454` (D407), rien à faire.
- `03f6de08d` VUE-SAUTE : StocksTab (liste invisible 3 images + `key={ongletMur}` ; le `murMin` de la session 1 est retiré : il laissait 48 px vides sous « Autres stocks », changement au repos), EntityList (`computeItemKey` = resetKey + index : Pleins, Livré à 0), KegBoard (liste invisible 3 images à l'arrivée : Fûts à 0). Essayés et rejetés : `skipAnimationFrameInResizeObserver` (pire, 0,167), `defaultItemHeight` (sans effet).

## Preuves
- principes (copie `diag.mjs`, build privé HEAD + mes fichiers) : session 0,352 → 0,038. Restent : « Épingler ZZ TEST Munich » KO (doigt 38 px, CLS 0,029) et « Replier Malts » 0,009 (le `top: -72px` du viewport de GroupedVirtuoso suit l'en-tête collant une image en retard : 72 → 63 px quand Malts se plie).
- Repos avant/après : 32 paires (8 états × 390/1280 × clair/cave, ref = HEAD avec F2) : toutes identiques au pixel. Script : scratchpad `avap.mjs`.
- Vision F2 (390/1280, clair/cave, saisie puis « le reste du rayon ») : 4/4 « 5/5 comptés · 0/3 », message « Malts : 5 comptés, dont 1 écart. ». Captures ouvertes : 390 cave saisie, 1280 clair saisie, 1280 cave fini, 390 clair fini.
- Build `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` : vert (36,95 s) dans une copie privée `C:/Users/mrspa/AppData/Local/Temp/vs-wt` (HEAD + mes fichiers + seedData local) ; l'arbre partagé ne construit pas : `src/ui/calendrier/entete/EnTete.tsx:793` est en cours d'édition par la session Calendrier.
- `controle-choix.mjs` : PAS ENCORE SORTI OK. Lancé sur `dist`, il attend une maquette (pages `etat.html` absentes) ; trouver la bonne forme (`--url=<app servie> --ecran=stocks` ?).

## Défauts vus (F2, à verser à BUGS.md)
1. L'écart sous le nom n'a pas d'unité : « prévu 600 g » puis « +5,9 » (kg ? g ?). Le champ est en kg alors que le prévu est en g.
2. « Le reste du rayon comme prévu · 5 » alors qu'un article est déjà tapé : le reste est 4 ; le 5 compte toutes les lignes enregistrées.
3. L'écart n'est pas rouge sur les captures (blanc en cave, noir en clair).
4. 390 : le « + » flottant couvre le ✓ de la dernière ligne du rayon ouvert (à vérifier sur la ref).

## DÉCISION À PRENDRE (pilote)
« Épingler » : la pastille « ★ épinglés » n'apparaît qu'au premier épinglé et passe seule à la ligne (+38 px sous le doigt). Aucune correction ne garde tous les états au repos identiques. Options :
- A. `exception` D407 dans principes (règle n° 1, si la maquette sy/fA montre la pastille seulement s'il y a des épinglés) ; la session tombe à 0,009 ;
- B. « ★ épinglés 0 » toujours visible (+38 px au repos à 390) ;
- C. « ★ 1 » court, qui tient sur la première ligne à 390 (passe encore à la ligne sous 380 px).
Recommandation : A.
- **Tranché (21.11, pilote) : A**, exception D407 dans principes pour « Épingler » (la pastille n'existe qu'avec un épinglé).

## Session 3 (21.11)
- `31f89044d` : A appliqué dans `scripts/parcours/principes.mjs` (`STOCK_EPINGLER`, `exception`). `principes.mjs --ref HEAD --controle VUE-SAUTE --seul stocks` : PRINCIPES OK, session 0,009 (Replier Malts), Épingler « exception » (doigt 38 px, CLS 0,029). Captures ouvertes : `%TEMP%/vs-principes/vue-stocks-0.png` (repos, pas de pastille ★), `%TEMP%/vs-principes2/vue-stocks-5-apres.png` (« ★ épinglés 1 » seule sur sa ligne). La maquette sy/fA n'a pas été retrouvée pour confirmer « pastille seulement s'il y a des épinglés » : A repose sur la décision du pilote.
- Build `VITE_HOP_V4=on VITE_CARNET_IA=production` dans `%TEMP%/vs-wt` remis à HEAD `31f89044d`, propre (status vide) : vert, 42,8 s. EnTete.tsx de HEAD ne casse pas.
- `controle-choix.mjs` : NE PEUT PAS sortir OK. (1) Le registre échoue avant tout écran : port-carnet 47 fautes (captures `work/refonte-frontend/**/captures/` ignorées par .gitignore, absentes du worktree), Brasserie 8 fautes (ma-levure, menu-entete : mots absents de SPEC ; 5 écrans sans inventaire ; simplicite : capture absente). (2) Stocks n'est pas dans `ecrans.json` (son choix « stocks-pastille » C est dans `maquettes.json`). (3) Le contrôle lit des pages `<route>/etat.html` de maquette, pas le build de l'app. Rien de V-STOCK en cause ; à trancher par le pilote.

## Prochaine action
1. Pilote : trancher Épingler, puis rejouer `principes.mjs --controle VUE-SAUTE --seul stocks` (sur un build privé tant qu'EnTete est cassé).
2. Sortir `controle-choix.mjs` OK sur la bonne cible.
3. Verser les défauts 1 à 4 à `work/missions/BUGS.md`.
4. Nettoyage : `git worktree remove C:/Users/mrspa/AppData/Local/Temp/vs-wt` (sa jonction node_modules d'abord).
