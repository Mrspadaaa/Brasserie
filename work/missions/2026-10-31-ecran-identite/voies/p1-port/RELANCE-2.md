# Relance 2 du port r4-a (31.10, pilote) — agent neuf (D207)

Tu reprends la voie p1-port. Lis d'abord `VOIE.md` (son choix, la base r4-a, ce qui est demandé, Possède), puis `RESULTAT-chrome.md` :
le premier vrai rendu de la relance 1 dans Chrome. Il rend `IDENTITE ECHEC 19` et `BASELINE ECHEC 28`. Le code, les tests et le build
étaient verts : seul le rendu a parlé (L11, L12).

## Ce qui est à corriger, dans l'ordre
1. **La baseline des autres étapes** : `node scripts/with_server.mjs --server "npm run dev -- --port 5611 --strictPort" --port 5611 --
   node scripts/agents/baseline-visuelle.mjs --comparer` échoue 28 fois sur `[data-ecran='ma-biere']` introuvable (`?dev-local&etape=houblons`).
   Trouve la cause dans le rendu (DOM, console de la page). Si elle tient au port (une étape qui ne s'ouvre plus, une erreur de rendu), corrige-la :
   un port d'Identité ne casse aucune autre étape. Si elle n'y tient pas, prouve-le (l'étape et l'erreur), sans rien corriger hors Possède.
   Fini quand `BASELINE OK`, ou quand la cause hors port est prouvée dans RESULTAT.md.
2. **La recette de démonstration** : la fixture `?dev-local` est « Stout export » (`src/ui/hopIndex/maBiere/apercuDev.ts`), **sans grain**.
   Sans grain, ni moût avant ébullition, ni cuve qui déborde : la série ne peut pas les jouer. Ne change pas cette fixture (elle sert la
   baseline des Houblons). Ajoute une fixture d'Identité avec des grains et un plan d'eau dans `src/ui/identite/`, ouverte par un paramètre
   (`&recette=identite`, à côté de `recette=vide`), et fais-la jouer par `capturer-identite.mjs`. Une ligne dans le fichier qui lit `recette=`
   est permise hors Possède : nomme-la dans RESULTAT.md.
3. **Les défauts du port**, lignes `ECHEC` de `RESULTAT-chrome.md`, à 390 et à 1280 :
   - Espace libre et Matériel **fermés au repos et côte à côte** (Matériel s'ouvre aujourd'hui seul, pleine largeur) ;
   - le pied Retour/Suivant **visible sans défiler** à 390 (bas 1212 px pour 844) ;
   - le « + » trouvé, et sans texte dessous ;
   - la pastille du style **teintée de sa famille**, et son chevron sans recouvrir le texte ;
   - les marqueurs `r4a-plages` et `r4a-reperes` présents (`src/ui/identite/PlagesStyle.tsx` les pose : pourquoi ne sont-ils pas rendus ?) ;
   - la cuve qui dit son dépassement (« +N L de trop »), sur la nouvelle fixture.
   La règle : r4-a telle quelle (`v1/r4-a/etat.html` et ses captures). Compare chaque état à sa capture de r4-a, côte à côte.

## Comment
- Tu lances toi-même le serveur et la série (commande de la « DEMANDE EXECUTANT » de RESULTAT.md), dans ce worktree, jamais dans
  `C:/Users/mrspa/Documents/Brasserie`. Écris dans un dossier neuf, `captures/r2/` ; ne supprime rien.
- Ouvre chaque capture en image avant de dire OK (L12). La série doit finir sur `IDENTITE OK`.
- Ensuite : `npm test -- tests/unit/identite`, `npm run build`, `node scripts/agents/systeme.mjs cablage`. Ne touche ni `.codex/hooks.json`,
  ni `source4-portable-bundle-manifest-01.json`, ni `functions/.env`. Aucune donnée réelle, aucun appel hors localhost.
- Plafond : 120 tours. Écris RESULTAT.md **section par section dès le début** (ligne 1 provisoire), pour qu'un arrêt au plafond laisse l'état.

## Rendre
`RESULTAT.md` réécrit : ligne 1 `OK — relance 2 : IDENTITE OK, BASELINE OK` (ou `ECHEC — <ce qui reste>`), puis, par point ci-dessus, ce qui
est fait avec la ligne de sortie et la capture ouverte ; les fichiers écrits ; les écarts restants avec r4-a ; `LEÇON PROPOSÉE : …` ou
`aucune`. Réponse au pilote : une ligne.
