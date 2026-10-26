OK — Banc de production mesuré : outils houblons 2 à 5× plus rapides que le dev à ×1, tous encore hors budget ; coût = recalcul de style, pas le moteur

## Fichiers écrits
- `scripts/bench-hop-prod.mjs` : banc (build, `vite preview` via `scripts/with_server.mjs`, Chrome puppeteer-core, CPU ×1 puis ×4, médiane et p95, profil CPU, expériences A/B).
- `scripts/vite-banc.config.mjs` : mode de build « banc » (voie sûre pour `?dev-local`, voir plus bas).
- Dans la voie : `resultats/` (`resultats.json`, `profil.json`, `ab-has.json`, journal du run complet), `resultats-reference/`, `resultats-sans-has/` (runs de comparaison, journaux).
- Rien dans `src/`. Le dossier de la voie n'avait ni VOIE.md ni GATES.md : j'ai suivi la demande du pilote ; critères = les trois points de la demande.

## Voie sûre pour `?dev-local`
`vite build --mode banc -c scripts/vite-banc.config.mjs` : build de production (React prod, minifié, chunks), seule différence `define: { 'import.meta.env.DEV': 'true' }` (fixtures `?dev-local&etape=houblons` et `window.__hopPile` existent). Sortie TOUJOURS hors `dist/` (`%TEMP%/affinee-banc-hop-prod/dist`) ; le fichier refuse un dossier `dist` du dépôt et tout mode autre que `banc`. `npm run build` ne le lit pas. Le banc coupe toute requête hors localhost (seule tentative vue : `fonts.googleapis.com`) : ni Firebase, ni Gemini, aucune donnée réelle.
Preuve : le build banc contient `dev-local` et `__hopPile` (grep dans `assets/App-*.js`) ; le build normal n'en contient aucune trace.

## Critères
- `npm run build` : exit 0 (tsc + vite build + check-private-research). `node scripts/check-no-dev-auth.mjs` : « ✅ Bundle de production propre », exit 0. Lancés APRÈS tous mes builds banc : `dist/` normal intact.
- Banc : `node scripts/bench-hop-prod.mjs --n=8 --profil --sortie=<voie>/resultats` → exit 0, « erreurs de page : aucune ». Run 1 : build sur HEAD 36ba5643, arbre propre sous `src/` et `prototypes/`. Les runs suivants (A/B, référence) réutilisent ce même build (`--sans-build`).
- Essais : 4 lancements du banc pour le débogage (1 course entre `mouse.down` et la pose de l'écouteur, corrigée par `armer()`), puis run complet. Aucun critère épuisé.

## Les nombres (médiane · p95 en ms, « posé » = jusqu'au dernier changement du DOM, n = 8 sauf 1re ouverture)
Deux runs complets du même build, l'un après l'autre : **R1** (run complet) et **R2** (run de référence plus tard). Écart R1/R2 jusqu'à ×2 à ×4 : d'autres sessions chargent ce PC. Lire les deux.

| Mesure | CPU ×1 R1 | CPU ×1 R2 | budget ×1 | CPU ×4 R1 | CPU ×4 R2 | budget ×4 |
|---|---|---|---|---|---|---|
| Comparer, réouverture | 112 · 192 | 176 · 206 | p95 ≤ 25 | 495 · 1138 | 1029 · 1491 | p95 ≤ 100 |
| Comparer, 1re ouverture (chunk + calculs à froid) | 465 | 587 | — | 904 | 2409 | — |
| Suggérer, réouverture | 48 · 90 | 72 · 75 | p95 ≤ 25 | 160 · 642 | 439 · 618 | p95 ≤ 100 |
| Suggérer, 1re ouverture | 333 | 370 | — | 433 | 999 | — |
| Fiche (appui long, 450 ms retirées), réouverture | 48 · 134 | 98 · 106 | p95 ≤ 25 | 287 · 604 | 617 · 1168 | p95 ≤ 100 |
| Fiche, 1re ouverture | 126 | 165 | — | 256 | 1145 | — |
| Comparer, changement de moment jamais calculé (n=8) | 17 · 33 | 28 · 37 | 4 · 8,3 | 69 · 270 | 207 · 255 | 16 · 33 |
| Comparer, moment déjà calculé (cache) | 18 · 33 | 30 · 32 | 4 · 8,3 | 105 · 317 | 152 · 275 | 16 · 33 |
| Ma bière, toucher sur + des grammes (posé) | 39 · 69 | 51 · 68 | 4 · 8,3 | 107 · 352 | 222 · 348 | 16 · 33 |
| Ma bière, + des grammes (dose affichée, « image ») | 23 · 43 | 28 · 44 | — | 74 · 205 | 134 · 223 | — |
| Premier écran (navigation → étape Houblons montée) | 490 | 481 | ≤ 625 OK | 1370 | 1441 | ≤ 2500 OK |

- Budgets de `scripts/check-hop-tools-perf.mjs` : à ×1 les budgets divisés par 4 (toucher 25 ms, glisser 4 ms médiane / 8,3 ms p95, écran 625 ms) ; à ×4 le PC bridé joue le téléphone, donc les budgets de l'épopée #159 non divisés (100 ms, 16/33 ms, 2,5 s). Verdict : **18 mesures sur 20 jugées dépassent** ; seuls les deux « premier écran » tiennent. Le tas JS reste à 39–44 Mo (budget 120).
- Ces budgets mesurent le CALCUL seul (`bench-hop-v4.ts`) ; ce banc va jusqu'à l'image peinte, donc plus strict. Mais même lus contre les budgets de téléphone non divisés (×4), les outils sont 1,6 à 14 fois au-dessus.
- Contre le serveur de développement (D70 : Comparer 319 / 865 ms, Suggérer 258–344 / 550–607 ms, moment 59 / 129 ms) : à ×1 la production est 2 à 5× plus rapide (Comparer 112–176, Suggérer 48–72, moment 17–28). À ×4 le gain est dans le bruit de ce PC chargé (Comparer 495–1029 contre 865). La production corrige l'ordre de grandeur à ×1, pas le verdict.
- Plancher du chrono : 0 à 1 ms (action vide). Nœuds DOM : 1 044 au repos, 2 153 avec Comparer, 1 271 avec Suggérer.

## Profil CPU (build à noms conservés, ×4, par répétition ; `resultats/profil.json`)
React en production ne donne pas de durées par composant ; le profil est lu par fichier d'origine (cartes de source), les appels natifs étant rattachés à leur appelant. Chrome : script 93 ms, **style 896 ms**, mise en page 28 ms, tâches 1 174 ms par ouverture de Comparer. Le moteur (`moteur.ts`, `profil-simule.ts`) pèse ~13 ms sur 1 015.
- **Comparer, ouverture** : `src/pages/PageShell.tsx` 614 ms (dont `focus()` 104 ms) ; `src/ui/hopIndex/comparer/index.tsx` 320 ms, dont `getBoundingClientRect` 316 ms (l'effet de mise en page sans tableau de dépendances, `index.tsx` l. 153-168 : trois lectures de rectangles et un `ResizeObserver` recréé à chaque rendu) ; react-dom 37 ms.
- **Suggérer, ouverture** : `PageShell.tsx` 381 ms sur 485 (dont `focus()` 67) ; moteur et prédiction (`hopRecipePrediction.ts`, `hopExtrapolationCore.ts`, `moteur.ts`) ~40 ms.
- **Fiche** : `vaul` 131 ms (`getBoundingClientRect` 104), `@radix-ui/react-focus-scope` 114 (`focus()` 113), react-dom 91 (`removeChild` 69), `PageShell.tsx` 43.
- **Comparer, changement de moment** : `comparer/index.tsx` 43 ms sur 56 (`getBoundingClientRect` 41 : le même effet de mise en page) ; react-dom 9.
- **Ma bière, + des grammes** : `PageShell.tsx` 78 ms sur 104 (fonction anonyme du cadre, à identifier : probable passe d'isolation du `MutationObserver` global sur `document.body`, l. 126 et 369-373, qui lit `getComputedStyle` sur toute la chaîne d'ancêtres).
- Cause commune : les lectures de géométrie ou le focus forcent le recalcul de style avant la peinture. Mesure directe : un restyle complet coûte 26 ms au repos (1 044 nœuds), 70 ms avec Comparer ouvert (2 153 nœuds, 3 175 règles CSS, 52 fichiers CSS chargés, 764 Ko), 215 ms à ×4 : ~33 µs par nœud. C'est ce coût de style, pas React ni le moteur, qui domine.

## Expérience A/B : les règles `:has()` (27 règles retirées du CSSOM, deux pages en alternance, n = 8, `resultats/ab-has.json`)
- Ouvertures : sans effet (Comparer B/A 1,0 ; Suggérer 0,9–1,1). `:has()` n'est PAS la cause des ouvertures lentes.
- Changement de moment : B/A 0,5 (×1) et 0,8 (×4). + des grammes : 0,7 (×1) et 0,6 (×4). Gain réel mais modeste, avec le bruit du poste.

## Doutes et limites
- Aucun vrai téléphone : « ×4 » est un bridage du processeur seul (ni mémoire, ni GPU, ni réseau). Les ×4 de ce PC varient jusqu'à ×2 entre runs (autres sessions) : n'en tirer que des ordres de grandeur ; le A/B alterne justement pour annuler cette dérive.
- La police Google (`fonts.googleapis.com`) est coupée : le texte utilise la police de repli, les métriques peuvent différer un peu.
- Fixture : stock vide, Comparer sur Cascade/Idaho 7/Galaxy puis Citra/Mosaic/Simcoe ; ouvertures par `window.__hopPile.open` (comme les bancs t13/t15b, pour comparer), pas par un bouton ; la fiche par un vrai appui long à la souris. Le p95 de 8 prises est la plus lente.
- Le profil est échantillonné à 200 µs (surcoût) : lire les proportions, pas les millisecondes absolues. Le « fonction anonyme de PageShell » de la dose n'est pas identifié avec certitude. Je n'ai pas modifié l'app pour confirmer les causes : les correctifs ci-dessous sont des hypothèses fondées sur le profil, non vérifiées par un essai.
- `scripts/check-hop-tools-perf.mjs` reste calculé sur le seul moteur ; il ne couvre pas ces coûts de rendu.

DÉCISION À PRENDRE : le rendu des outils (pas le moteur) dépasse les budgets, même contre les budgets téléphone non divisés. Que faire avant de montrer au brasseur ?
- (a) Mesurer d'abord sur un vrai téléphone moyen (le facteur ×4 n'est qu'une hypothèse écrite) avant de toucher au code. Rien de coûteux, mais ne règle rien.
- (b) Une voie de code ciblée, mesurable avec ce banc : (1) `comparer/index.tsx` : donner un tableau de dépendances à l'effet de mise en page et ne mesurer que sur `ResizeObserver` ou changement du nombre de colonnes (le profil attribue ~320 ms/ouverture à ×4 et 41 ms de chaque changement de moment) ; (2) `PageShell.tsx` : ignorer, dans l'observateur d'isolation, les mutations internes à la page de devant (le profil attribue 78 ms de chaque toucher sur + au cadre) et ne pas appeler `focus()` à chaque couche empilée (104 ms à l'ouverture de Comparer) ; (3) remplacer les `body:has(...)` par un attribut posé en JS (−20 à −50 % sur moment et grammes, 0 sur les ouvertures). Chaque point se rejoue avec `node scripts/bench-hop-prod.mjs --n=8` et `--ab-has`.
- (c) Concession d'interface, à montrer au brasseur : l'écran apparaît tout de suite avec son cadre et ses têtes, et les colonnes, le radar et « Ses mots » se montent après la première image (`startTransition`). Total inchangé, ressenti à ~100 ms. Non mesuré ; touche au dessin de ses maquettes choisies (règle n° 1), donc à lui de trancher.
- Recommandation : (b)1 et (b)2 d'abord (sans effet sur le dessin, risque faible, preuve par le banc), puis re-mesurer ; (a) en parallèle ; (c) seulement si (b) laisse Comparer au-dessus de ~200 ms à ×4. Et réviser `check-hop-tools-perf` pour inclure un budget de rendu de bout en bout.

CONNAISSANCE : en production, un restyle complet de Comparer ouvert coûte 70 ms (×1) pour 2 153 nœuds ; le recalcul de style forcé par `getBoundingClientRect` et `focus()` (PageShell, comparer/index.tsx, vaul, radix) domine le temps d'ouverture, le moteur compte ~13 ms (HEAD 36ba5643, 25-26.10).
LEÇON PROPOSÉE : aucune
