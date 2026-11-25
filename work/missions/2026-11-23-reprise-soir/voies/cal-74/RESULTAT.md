OK partiel — CAL bord 91→126 ms/image (défilement 2,6→6,7 sem./s, pire image 585→325 ms) ; ouvrir 627→612 ms (tâche 367→307) ; K73 3/5 83d0b18e1

Cibles non tenues (honnêtes) : images au bord ≤ 50 ms (60 % ≤ 17 ms) : non (17 % ≤ 17 ms, 19 % ≤ 50 ms à ×6) ; relâcher ≤ 100 ms : 123 ms médian (178 avant) ; ouvrir, tâche longue ≤ 200 ms : 307 ms (367 avant). Le défilement est 2,6 fois plus rapide, donc la fenêtre grandit plus vite et chaque image rend plus de choses : le ms/image moyen ne baisse pas, la pire image oui.

## État de l'art (L29)
- Problème type : (1) « layout thrashing » : lectures de mise en page (`getBoundingClientRect`, `innerWidth`, `getComputedStyle`) entrelacées avec des écritures du DOM, ici dans des `useLayoutEffect` sans dépendances, donc après chaque rendu ; (2) rendu React coûteux répété pendant un glisser ; (3) auto-défilement au bord à pas de temps borné.
- Méthodes standard : lire après la peinture, regrouper (une lecture par rafale) et espacer (throttle avec dernière demande toujours servie) ; mémoïser le pur (largeur de texte au canevas, conversions de dates) ; mettre en cache ce qui ne bouge pas pendant un geste (cadre de la frise) ; profil CPU V8 (Chrome DevTools Protocol) pour nommer les coûts. Virtualisation : écartée (la frise montre 6 semaines à 6 mois, quelques dizaines de choses ; le coût est la mise en page, non le nombre de nœuds). `useTransition`/`memo` des rangées : écartés ici, la tranche de props change à chaque image (fenêtre, colonnes).
- Bibliothèque : aucune ajoutée (rien dans package.json qui convienne ; `requestAnimationFrame`, `setTimeout`, `Map` suffisent). Décision : planificateur de 40 lignes (`useApresRendu.ts`), mémoires bornées (`cacheTexte.ts`, `dates.ts`).

## Les 3 plus gros coûts (profil CPU, processeur ×6, build non minifié, fixture du parcours Calendrier)
1. Mises en page forcées dans la phase de rendu : `useRentree` (Frise et En-tête), `taireSousPoignees` (Courbe) et la mesure de l'en-tête (`mesurer`, EnTete.tsx) lisaient les boîtes dans des `useLayoutEffect` à chaque image : 138 à 190 ms à l'ouverture et au relâcher, 569 ms et 170 ms sur 2 s de barre tenue au bord.
2. `BulleIci` (Rangee.tsx) : à chaque image, relecture de chaque texte et de chaque barre de la frise, puis recherche tops × gauches × obstacles : 295 ms inclusif sur 2 s au bord. Et `axeDuMoment` (usePointeur) : une mise en page forcée par rendu de la barre tenue, 449 ms sur 2 s ; `cadreDe` relu deux fois par image.
3. Ouverture : le rendu lui-même (`renderWithHooks` ~30 ms), puis `largeurTexte` (Courbe relisait `getComputedStyle(document.body)` à chaque texte : 27 + 15 ms), `utc`/`versIso` (17 + 12 ms) et le placement du message d'annulation au relâcher (`placerMessage`, 167 ms ×6, une fois par geste, non corrigé).
Une cause de la « trop lente » (Q-4) : le pas de temps d'une image du défilement était borné à 50 ms ; à 216–279 ms par image, la barre avançait au quart de sa vitesse.

## Corrigés
- K73-1 bouton de durée : `EnTete.tsx` dit la fenêtre sous le doigt (`tiree`) dans la pastille pendant le geste. Test : garde de code (cal74Regles). Non vérifié par capture à la main (voir doutes).
- K73-2 « S53 2026 » : une seule semaine se dit « S53 » (`etiquetteSemainesAnnees`). Test de valeur (cal74Regles, calendrierCadre).
- CALP-6 homonymes : `distinguerHomonymes` distingue aussi les brassins de même nom, même rangée, même montant et même état de coût (jour, puis rang). Tests de valeur ; les loyers (série) restent intacts. Capture mf-apres/bord-0.png : « Jhhh · 16 oct. » et « Jhhh · 23 oct. » au lieu de deux « Jhhh » (deux brassins d'états différents y sont aussi distingués : à valider par le brasseur).
- K73-3 lenteur : voir cibles ci-dessus ; partiellement tenu.
- Q-4 / POI-1 vitesse au bord : bande de 72 px, vitesse pleine à 24 px du bord (hors geste retour d'Android), ×1 à ×1,6 en 1,2 s tenu, plafond de colonnes multiplié de même, pas de temps 0,1 s. Barres, cadre de l'en-tête, durée de la fiche. Mesuré : 2,6 → 6,7 sem./s.
- CALP-13 (Stocks et Matériel sans calendrier de section) : NON fait, hors de mon périmètre (`src/ui/stock`, `StocksTab`, que la voie interdit). Texte proposé pour BUGS : « ouvert — présent, à poser par la voie qui possède Stocks ».

## Mesures (scripts/mesure-calendrier.mjs, build minifié de la fixture, processeur ×6, 4 essais, 390×844 tactile, mon onglet du Chrome 9222 ; avant = HEAD 85655dc1f, après = 83d0b18e1)
| geste | avant (médiane) | après (médiane) |
|---|---|---|
| Ouvrir, jusqu'au cadre | 627 ms (625 à 1 064) | 612 ms (514 à 761) |
| Ouvrir, tâche longue max | 367 ms (283 à 817) | 307 ms (166 à 389) |
| Relâcher, image gelée | 178 ms (169 à 530) | 123 ms (109 à 434) |
| Bord, image moyenne | 91 ms | 126 ms |
| Bord, pire image | 585 ms | 325 ms |
| Bord, images ≤ 17 ms | 37 % | 17 % |
| Bord, images (2 s) | 19 à 25 | 14 à 19 |
| Bord, défilement | 2,6 sem./s | 6,7 sem./s |
Le premier essai de chaque série est à froid (le plus lent). À ×1 sur mon poste, les images tiennent à 8 ms (écran 120 Hz) : le gel n'apparaît qu'à ×6, qui reproduit à peu près les chiffres de cal-73 (ses données réelles sont plus lourdes que la fixture).
Pourquoi les images moyennes ne baissent pas : la fenêtre grandit 2,6 fois plus vite, donc plus de barres à poser par image ; le coût restant est le rendu React de tout l'onglet à chaque image (aucune rangée mémoïsée) et la mise en page de la fenêtre agrandie.

## Fichiers écrits
Code : `src/ui/calendrier/useApresRendu.ts` (neuf), `src/ui/calendrier/cacheTexte.ts` (neuf), `src/ui/calendrier/frise/{useRentree,Rangee,Marque,usePointeur,defileBord,DureeFenetre}.ts(x)`, `src/ui/calendrier/entete/{Courbe,EnTete,Fenetre}.tsx`, `src/domain/calendrier/dates.ts`. Tests : `tests/unit/cal74Regles.test.tsx` (neuf, 21 tests), `calendrierCadre.test.ts` (S53), `k57PoigneeFenetre.test.tsx` (plafond avec accélération : 2,84 au lieu de 2 ; linéarité ×1,8). Outils : `scripts/mesure-calendrier.mjs` et `scripts/mesure-calendrier.vite.mjs` (neufs : `vite-plugin-pwa` n'est pas installé sur ce poste, le build du parcours échouait ; le script le remplace par un module vide, sans toucher au dépôt). Commit `83d0b18e1`, par chemins.

## Critères
- `npx tsc --noEmit` : 2 erreurs connues seulement (`seedData.ts` GanttTask, `virtual:pwa-register`).
- Tests : 48 fichiers, 566 verts (calendrier, cadre, k57, poignées, défilement, proprietes, ct4, ecr3, ecr4, todoTimelineFrise, bugsWorkflowsCalendrier, cal74Regles) ; `virgule-transversale` 8/8.
- Essais : trois builds de mesure, quatre profils ; aucune donnée réelle, aucun déploiement, aucun appel IA.

## Doutes et limites
- K73-1 : prouvé par garde de code, pas par geste au doigt sur un rendu (la mesure scripte tire une barre, non la poignée du cadre). À rejouer par le critique en ligne.
- Effet de bord attendu : la marge de toucher (`--rentre-g/d`) et les noms tus sous une poignée se posent au plus 250 ms après le rendu ; la mesure de l'en-tête, 500 ms (la première reste immédiate).
- La bulle « lâcher ici » garde sa hauteur et suit le doigt entre deux placements complets (120 ms) : elle peut quelques instants recouvrir un texte avant d'être replacée.
- Les 2 captures ouvertes : mf-apres/bord-0.png (6 mois, bulle S23) et m-avant/avant-glisser-0.png ; pas de comparaison 390/1280 de chaque constat (budget de tours).
- Reste de lenteur : rendu de tout l'onglet à chaque image ; piste suivante : mémoïser `Rangee` par rangée et sortir l'en-tête du rendu du geste.

DÉCISION À PRENDRE : poser CALP-13 (liens de calendrier Stocks et Matériel) : voie qui possède `src/ui/stock` ; je recommande de la confier à la voie Carnets/Stocks en cours.
CONNAISSANCE : à ×6, la fixture reproduit les gels mesurés en ligne par cal-73 ; sur ce poste, `vite-plugin-pwa` manque : tout build local passe par `scripts/mesure-calendrier.vite.mjs`.
LEÇON PROPOSÉE : un effet de rendu sans dépendances qui lit la mise en page (`getBoundingClientRect`, `innerWidth`) refait une mise en page par image pendant un glisser ; lire après la peinture, regroupé et espacé (profil CPU avant de corriger).
