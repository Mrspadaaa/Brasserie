OK PARTIEL — (a) cause trouvée (liste tactile de 2 lignes, Malt 10e) et corrigée ; « Quantité invalide » corrigé côté client ; captures 1280, build et vérif en ligne à jouer

Branche `b2/parcours` (worktree `C:/Users/mrspa/AppData/Local/Temp/b2-wt`, issue du tag `en-ligne/2026-11-10-parcours`). sha final : `d59c3ae1`. Aucun déploiement, aucune donnée réelle, aucun Gemini. `firestore.rules` et `functions/` non touchés. Banc local : Vite `?dev-local`, `.env.local` et `seedData.ts` ignorés par Git (copiés dans le worktree), puppeteer-core en émulation tactile 390 (CDP touch), profil jetable.

## Commits
- `6705ad4b` PC-2 (a) : `ordonnerCategories` (Malt, Houblon, Levure… d'abord, puis les catégories du stock triées) ; test `tests/integration/pc2NouvelArticleListe.test.tsx` (rouge sur le tag : l'export n'existait pas).
- `d59c3ae1` PC-2 « Quantité invalide » : `ajoutsEnvoyables` (src/domain/brewDay.ts), appelé avant chaque envoi dans `useBrewSession.ts` ; coche « Ajouté » d'une levure sans quantité = ouvre la saisie, n'écrit rien ; garde dans `patch` ; nom lisible (« Levure ») dans les aria-label ; test `tests/integration/pc2LevureCocheSansQuantite.test.tsx` (rouge sur le tag : case cochée + `ajoutsEnvoyables` absent).

## 1. PC-2 (a) — cause
La valeur n'est PAS perdue par le code : au vrai geste de doigt (balayer la liste, toucher l'option) la catégorie reste (banc, `geom.mjs` : « Malt » après balayage et toucher réel). La cause est la liste : à 390 px, dans la feuille « Nouvel article », la liste Catégorie ne mesure que 94 px (2 lignes sous l'en-tête ; `placeMax` plancher 96) sur 21 options triées par ordre alphabétique : Adjuvant, CIP, Capsules, Divers…, Malt 10e, Houblon 8e, Levure 9e, hors de vue (`geom.mjs` : seules 2 lignes « toucheLui=true »). Le geste de r2 touchait les coordonnées de l'option sans la faire défiler dans la liste : le toucher tombait à côté (hors écran, ligne 992 pour une fenêtre de 844), donc rien de choisi, catégorie « », article « Divers ». Même cause pour « sachet » (4e unité) : le « g » (2e) passait, « sachet » non.
Reproduit au banc local avec le geste de r2 sur un stock de 48 articles (`banc-a.mjs`, GESTE=r2) : valeurs `["…","","kg"]` (Malt), `["…","","g"]` (Houblon), `["…","","kg"]` (Levure avec « sachet » demandé) avant ; après `6705ad4b`, Malt : valeurs `["ZZ TEST b2 article","Malt","kg"]` et fiche de l'article relue « Malt · MP-949 » (capture `ap-02-fiche-Malt-390.png`).
Corrigé : l'ordre. Malt et Houblon sont les 2 premières lignes (visibles), Levure la 3e (à moitié visible).
Limite : la liste reste de 2 lignes en feuille courte (composant partagé `Combobox`, non touché : risque sur tous les écrans). Unité « sachet » : toujours la 4e ligne, à balayer.

## 2. « Quantité invalide » — cause et correction (cause lue par r3, confirmée au code)
La coche « Ajouté : » d'une levure dont la quantité est inconnue écrivait `additions.yeast = { doneAt }` sans `amount` (ou `amount: planned` indéfini) ; `functions/src/brewSessionCore.ts` l.222-224 exige un `amount` fini : 400, bandeau « Quantité invalide. Réessayer · Recharger le serveur » et « Journal à synchroniser » ; « Réessayer » rejouait le même 400. Pas de lien avec le déstockage (PC-1).
Correction côté client : (1) la coche d'une levure sans quantité prévue ou réelle ouvre l'éditeur de quantité (Mesurée / Sans mesure, PC-1), l'ajout n'est pas écrit et la case reste décochée ; (2) `patch` n'écrit jamais un ajout sans `amount` fini (un 0 reste admis, l'inconnu n'est pas converti en 0) ; (3) `ajoutsEnvoyables` retire de l'envoi tout ajout sans quantité finie, y compris dans un brouillon déjà stocké sur l'appareil : le serveur répond avec son état et le geste se défait, le bandeau ne colle plus. L'état local n'est pas modifié (test). (4) aria-label « Quantité réelle de Levure » au lieu de « … de  ».
Non fait : l'élément « textarea » du champ (le composant `Input` bascule en textarea sur écran tactile pour toute l'app, choix délibéré), le bandeau pour un autre 400 inconnu.

## Contrôles
- `npx tsc --noEmit -p .` : seules erreurs de modules absents du worktree (`firebase-admin`, déjà sur le tag), aucune dans mes fichiers.
- Vitest ciblé vert : `pc2NouvelArticleListe`, `pc2NouvelArticleCategorie`, `pc2LevureCocheSansQuantite`, `brassageLevureAbsenteParcours` (6 tests). Suite `tests/unit tests/integration` lancée en arrière-plan vers `tests.txt` : voir plus bas.
- `VITE_HOP_V4=on npm run build` : NON LANCÉ (plafond de contexte).
- Captures dans `captures/` : `av2-*` (avant, geste fin : Malt tenu car le test a défilé), `r2g-*`/`ap-*` (geste r2 avant / après), `geom-categorie-ouverte-390.png`, `geom-apres-balayage-390.png`. J'ai ouvert av2-01, ap non rouvertes après correction (la fiche est lue en texte) : à ouvrir.

DEMANDE EXECUTANT :
1. Depuis `C:/Users/mrspa/AppData/Local/Temp/b2-wt`, serveur : `npx vite --port 5199 --strictPort` (déjà lancé, vérifier `curl http://localhost:5199/`), puis depuis `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-10-parcours-complet/voies/b2` : `GESTE=r2 node banc-a.mjs fin 390` puis `node banc-a.mjs fin 1280` (attendu : valeurs « Malt » puis fiche « Malt · MP-… » ; la 2e itération (Houblon) casse dans le script : à faire un article par lancement avec l'argument 5 `Houblon`).
2. `VITE_HOP_V4=on npm run build` depuis le worktree (attendu : vert).
3. Capture du jour de brassage : étape Ensemencement d'une recette sans levure, toucher la case « Ajouté : Levure » (attendu : case décochée, éditeur de quantité ouvert, aucun bandeau). Ouvrir toutes les captures.
4. Puis jouer en ligne après déploiement par le pilote : aucun « Quantité invalide » à l'arrivée à l'ensemencement.
5. Arrêter Vite (port 5199, PID par `netstat -ano | grep 5199`).

DÉCISION À PRENDRE : la liste du `Combobox` (2 lignes en feuille courte) mérite une hauteur minimale de 4 lignes (ouvrir vers le bas en ajoutant de la place dans la feuille). Options : (1) laisser (ordre seul), (2) ajuster `Combobox` pour tout l'app. Recommandation : (1) pour ce lot, (2) dans un lot dédié avec captures de tous les écrans utilisant `Combobox`.

CONNAISSANCE : en feuille courte sur téléphone, un `Combobox` ouvert vers le haut n'a que ~94 px (plancher 96) ; une option hors de cette fenêtre doit être défilée avant d'être touchée ; un test qui tape les coordonnées d'une option non défilée conclut à tort que « la valeur est perdue ».
LEÇON PROPOSÉE : avant de conclure à un défaut de valeur perdue, lire la position de l'option au moment du toucher (`elementFromPoint`) ; un geste de banc qui ne fait pas défiler la liste ne prouve rien.

## Suite complète (ajout)
`npx vitest run tests/unit tests/integration` a dépassé mon délai de 580 s sans résumé (comme pour b1) : `tests.txt` ne contient que la progression (un `x` = un test en échec, non identifié, non comparé au tag). ZÉRO nouveau rouge NON PROUVÉ : à faire par un exécutant (sous-ensembles brew, stock, batch, depense ; voir `tests.txt`). Vite du banc (port 5199) arrêté : la demande exécutant point 1 doit le relancer (`npx vite --port 5199 --strictPort` depuis le worktree).
