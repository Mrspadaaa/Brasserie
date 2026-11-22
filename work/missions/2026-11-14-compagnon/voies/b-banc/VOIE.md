# Voie b-banc — banc local du compagnon : chaque état, 4 formats

- Mission : 2026-11-14-compagnon
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Un script puppeteer qui ouvre le compagnon brasseur de l'app locale, simule toutes les réponses serveur, et capture 17 états en 4 formats (390 tactile et 1280 ; clair et cave), plus 4 planches.

## Entrées
- `scripts/check-brewer-jobs-mobile.mjs` — banc existant : interception des callables (`askBrewer`, `getBrewerConversation`, `getBrewerActivity`, `markBrewerRead`, `getBrewerAiBudget`, `setBrewerAiBudget`, `resetBrewerConversation`), ouverture par le bouton flottant, `?preview=brew&view=assistant`. Partir de lui.
- `functions/src/companionTypes.ts` — forme exacte de `BrewerTurn`, `BrewerJob`, preuves, propositions.
- `src/ui/BrewerChat.tsx` (états affichés ; `BrewerWorkCard` vers la ligne 1816), `src/ui/BrewerProposalCard.tsx`, `src/ui/BrewerActivity.tsx` (« Mes conversations » s'ouvre par `window.dispatchEvent(new Event('brewer-inbox-open'))`), `src/ui/finance/FinanceAssistant.tsx`.
- `cerveau/agents/verification-locale.md` — `?dev-local`, recharger après redimensionnement, mouvement réduit.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-compagnon/voies/b-banc` (script `banc.mjs`, journaux)
- `work/missions/2026-11-14-compagnon/analyse/cap` (captures, `etats.json`, `reseau.json`, planches)

## Consignes
- Serveur : `npx vite --port 3007 --strictPort` lancé en arrière-plan depuis la racine (pas `npm run dev` sur 3000, d'autres sessions l'utilisent). Ne modifier aucun fichier de `src/`. L'arrêter à la fin.
- **Gemini jamais réel** : toute requête vers une fonction (`cloudfunctions`, `/askBrewer`…) est interceptée et répondue par le script. Compter dans `reseau.json` : `{ "intercepte": n, "nonIntercepte": n, "urls": [...] }` (non interceptés = requêtes vers un domaine `cloudfunctions.net` ou `run.app` ou un chemin de callable non répondu). Firestore refusé (`permission-denied`) est normal, pas compté.
- Thème cave = `page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])` ; si l'app a un autre réglage de thème, le trouver (`grep -rn "cave" src/index.css src/main.tsx`) et l'appliquer. Vérifier sur une capture que le fond change.
- 390 : `{ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }` ; 1280 : `{ width: 1280, height: 860 }`. Redimensionner puis recharger.
- Chaque capture montre la feuille du compagnon ouverte, plein écran (pas `fullPage` si la feuille défile : faire défiler la feuille jusqu'à l'élément de l'état, puis capturer).
- Modèles dans les données simulées, comme en production depuis le 14.11 : `turn.model = 'gemini-4-hydrogen'`, `reviewModel = 'gemini-3.8-flash'`, preuve de recherche `model = 'gemini-3.8-flash'` ; job en cours `model = 'gemini-4-hydrogen'`. Textes en français réalistes de brasseur (NEIPA, pH de maische, dry hop) ; le contenu exact est libre mais plausible.
- États (id, ce qu'on voit) — écrire cette liste dans `analyse/cap/etats.json` (`[{id, titre, geste}]`) :
  - e01 accueil recette : bienvenue, questions suggérées, modes Rapide/Auto/Approfondi, budget, champ vide
  - e02 accueil finances : ouvert comme depuis Finances « Vérifier mes opérations » (portée `{kind:'app', id:'finances'}`, question pré-remplie) ; si le banc preview ne monte pas Finances, monter `FinanceAssistant` n'est pas exigé : ouvrir le compagnon avec la même question tapée et le noter dans RESULTAT.md
  - e03 question tapée, mode Approfondi choisi, avant envoi
  - e04 envoi en cours (accusé pas encore reçu : retarder la réponse de `askBrewer` de 20 s et capturer pendant)
  - e05 attente courte : job `running`, stage `research`, detail « Recherche de sources… », 0:12
  - e06 attente longue : job `running` dont `createdAt` et `updatedAt` sont 2 min dans le passé (message « Cette étape prend du temps »)
  - e07 deux questions : la 1re en cours, la 2e `queued`
  - e08 réponse courte, niveau `info`, détails repliés
  - e09 réponse longue, niveau `attention` : `why` de 6 phrases, `watch`, `question` de suivi, 3 preuves avec faits, limites et 3 sources https ; détails « Conseil relu · calculs et sources » OUVERTS
  - e10 réponse `urgent` (ex. température de fermentation qui s'emballe)
  - e11 réponse avec proposition applicable (`proposal` à 3 champs, avant/après) — voir `BrewerProposalCard.tsx`
  - e12 réponse avec fournisseurs (`evidence[].products`, 2 produits, stock et prix)
  - e13 erreur relançable (`status: 'error'`, `error.retryable: true`, message serveur)
  - e14 plafond de dépense (`error.code: 'gemini-spend-cap'`)
  - e15 hors ligne : envoi échoué (`page.setOfflineMode(true)` avant envoi, ou `sendError`) ; capturer aussi le bandeau `connectionError` s'il paraît
  - e16 confirmation « Repartir à zéro ? »
  - e17 « Mes conversations » (boîte des conversations ouverte, 2 ou 3 conversations simulées si la forme le permet)
- Planches : pour chaque format, une image `planche-<format>.png` qui assemble les 17 captures réduites, chacune titrée de son id (page HTML locale rendue par puppeteer).
- Ouvrir au moins 4 captures (une par format) avant de rendre, et dire dans RESULTAT.md ce qui s'y voit.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Aucun appel Gemini réel (CLAUDE.md). Rien écrit dans `src/`. Fichiers de travail dans « Possède » ou `os.tmpdir()`.
- Une capture non regardée ne prouve rien (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil : un état par ligne (id, capturé oui/non, écart avec la consigne).
- Tests : pas de Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-compagnon/outils/controle-banc.mjs > work/missions/2026-11-14-compagnon/voies/b-banc/tests.txt`.
- Captures 390 tactile et 1280, clair et cave.
Réponse finale au pilote : une ligne.
