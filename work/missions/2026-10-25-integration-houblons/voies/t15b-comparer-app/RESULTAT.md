OK — Comparer (cmc2k) branché dans l'app : route hopCompare, Placer par la porte unique, captures ouvertes ; 12 tests hors voie en échec

## Fichiers écrits
- Nouveaux : `src/ui/hopIndex/comparer/EcranApp.tsx` (hôte de l'app), `CadreApp.tsx` (PageShell, onglets), `porte.ts` (pont brouillon + `applyHopV4Change`), `cadre-app.css`, `tests/unit/hopIndexV4/comparerApp.test.tsx`, `banc-comparer.mjs` + `captures/` (cette voie).
- Lanceur flottant (demande du pilote, après coup) : `src/App.tsx` seul, `<FloatingActions>` n'est rendu que si aucune couche autre que `hopV55` n'est ouverte (`!layerRoutes.some(l => l.view !== 'hopV55')`). Le wizard et sa rangée `endActions` ne changent pas ; l'atelier V5.5 garde son lanceur. Test : `tests/integration/AppLanceurOutilsHoublons.test.tsx` (vraie App : couche ouverte puis deuxième couche, aucun lanceur ; retour, il revient ; l'atelier V5.5 le garde).
- Modifiés : `HopToolLayer.tsx` (hopCompare monte l'écran en `lazy`, drapeau hopV4 allumé seulement ; éteint : couche provisoire inchangée), `BrewWizard.tsx` (un effet pose la porte, un autre la retire ; rien d'autre), `comparer/hote.tsx` (`houblon?` sur dryhopper/levure, `termes`), et les mots S1 de `index.tsx`, `Ensemble.tsx`, `Etapes.tsx`, `Feuilles.tsx`, `Radar.tsx`.
- Le dessin n'est pas changé. Seuls les mots du cas S1 (« ma stout », « ta 16D », « dégustation du 18.10 », `style('16D')` de la légende) passent par `termes()` : sans `termes`, l'hôte maquette garde exactement S1.

## Critères
- `npx vitest run tests/unit/hopIndexV4 tests/integration` : 2259 passés, 12 en échec dans 9 fichiers hors voie. `monkey.test.tsx` (2) et `YeastRecipeChoice` (1) échouent aussi avec le `BrewWizard.tsx` de HEAD (rejoué : 3 échecs identiques). Les 7 fichiers `hopV55*` n'importent aucun fichier touché ; ils échouent par délai dépassé (15 à 120 s) ou sur un texte absent. Je ne les ai pas rejoués sur HEAD. Mes tests : `comparerApp` 8/8, `etapeHoublons` + `chargementOutils` 44/44 en tout ; `AppLanceurOutilsHoublons` 2/2, avec `AppRoutePile`, `FloatingActions.behavior` et `floatingActionsShellLayout` : 28/28. `tsc` vert.
- `npm run build` : vert.
- `check-hop-budget.mjs` : B1 démarrage 920 ko. HEAD, mesuré ici, donne aussi 920 ko (925 963 o contre 926 012 o : +49 o). Le 919 ko du brief est déjà dépassé sur HEAD. Le nouveau chunk `EcranApp` pèse 45 ko gzip (+ son CSS), à la demande.
- `construire.mjs` puis `controle-mots-tous.mjs … comparer` : `MOTS-TOUS OK`.

## Fluidité (banc `?dev-local&etape=houblons`, VITE_HOP_V4=on, serveur de développement : React en mode dev, modules non groupés, donc pessimiste)
- Ouverture à froid, chunk de l'écran compris : 0,9 à 1,1 s.
- Ouverture ×4 (fermer, rouvrir), dernière prise après le correctif du lanceur : sans bridage 526 / 289 / 208 / 319 ms (médiane 319) ; processeur ×4 plus lent 763 / 858 / 866 / 865 ms (médiane 865). Première prise : médianes 500 et 886 ms.
- Changement de moment, 5 moments jamais vus : médiane 59 ms (80 / 59 / 52 / 111 / 51) ; ×4 : médiane 129 ms. Revenir sur un moment déjà calculé : 37 à 73 ms ; ×4 : 103 à 163 ms.
- Profil d'une ouverture à chaud : `lireColonnes` 7 ms, `lireEtapes` 3 ms, `comparer` 10 ms. Le coût est le rendu React (commit 289 ms sur 871 ms échantillonnés ; `SesMots` 43 ms), pas le moteur. L'ouverture à froid n'a pas pu être profilée (le script a expiré une fois, 30 s).
- Tas JS : 92 à 104 Mo (budget 120).
- Aucune erreur de page.
- Budgets de `check-hop-tools-perf` (toucher 25 ms, premier écran 625 ms une fois divisés par 4) : l'ouverture les dépasse en mode dev. Ce n'est pas une mesure de production. Le banc `?dev-local` n'existe qu'en développement.

## Captures (390 × 844, ouvertes une par une)
`captures/repos.png`, `60min.png`, `absolu.png`, `ses-mots.png`, `apres-placer.png`, `placer-dryhopper.png`. Je n'ai pas ouvert `placer-dryhopper.png` (couche provisoire de Dryhopper).
Comparées à `fils25-comparer/captures/cmc2k.png` : tête à onglets, question, pastilles 16D / 4 g/L / US-05, radar, colonnes, bande des étapes et dock sont identiques. Deux défauts vus sur la première prise et corrigés : anneau de focus noir autour de la page, et pastilles sans fond (fond du `main` à `cave-850` au lieu de la page blanche) ; règles reprises du thème maquette dans `cadre-app.css`.
Écarts qui restent, tous des données et non du dessin :
- l'α affiche la plage des fiches (« 4,5–9% ») parce que le stock du banc est vide (cmc2k lit un lot de la fixture S1), et l'icône de stock manque ;
- le point Résineux de Cascade n'est pas orangé : aucune dégustation dans l'app ;
- le lanceur flottant ne recouvre plus rien (corrigé, voir ci-dessus ; `repos.png`, `ses-mots.png`, `apres-placer.png` reprises et ouvertes). `ses-mots.png` et `apres-placer.png` ne sont pas défilées jusqu'en bas : « Placer Idaho 7 » n'y est qu'à moitié visible, sous le bord du dock. Je n'ai pas rejoué le défilement jusqu'au bout de la page.

## Doutes et limites
- Placer écrit tout de suite l'ajout (4 g/L, dry hop actif 3 j, par `versPatch` puis `applyHopV4Change`), puis ouvre `hopTiming` sur `a<n>` (sa position, non son nom de maquette). Le test le vérifie (patch de 2 `hops`, `a2`, 80 g). Dryhopper est encore la couche provisoire.
- Même chose pour la feuille « Souche » (Levure) : elle écrit l'ajout avant d'ouvrir.
- La fiche d'un houblon (appui long) n'ouvre rien : la fiche de la maquette n'est pas encore dans l'app (`Fiche` absente de l'hôte).
- L'écran n'a pas d'entrée « Comparer (n) » dans Ma bière ni dans Suggérer (voie rb2-ma-biere, `maBiere/` non possédé) : on l'atteint seulement par la route ou `window.__hopPile`. L'onglet « Suggestions » empile sa couche, il ne remplace pas la couche courante.
- Comparer lit la porte posée par le wizard. Sans brouillon dessous, ou avec un autre `recipeId`, il écrit « Comparer travaille sur le brouillon de l’étape Houblons » (page enregistrée : à faire en T13).
- La visée (plus floral, moins résineux) reste la constante `DEMANDE_DEGUSTEE`, comme dans Ma bière. Sans dégustation, les textes disent « ta demande » (sans date ni citation) ; avec, la date vient de `useHopData().degustation`.
- Je n'ai pas rejoué `controle-choix.mjs`, ETATS ni CENTRE sur l'app, faute de tours. L'écran n'a pas changé, mais ce n'est pas prouvé par ces contrôles.
- Essais : un par critère, sauf la capture (3 passes de banc pour le CSS et le sélecteur « Absolu »).

DÉCISION À PRENDRE : la fluidité à l'ouverture (500 ms, 886 ms à ×4 en développement) dépasse les budgets de `check-hop-tools-perf`, mais le moteur n'y pèse presque rien (20 ms). Options : (a) ne rien faire et mesurer sur un build de production avec un banc qui ne dépend pas de `?dev-local` ; (b) différer ce qui n'est pas au premier écran (étapes, « Ses mots », huiles, après le premier rendu) ; (c) mettre le calcul des moments au worker. Recommandation : (a) d'abord, puis (b) si la mesure de production dépasse encore. Je ne propose pas (c), car le moteur n'est pas la cause.

DÉCISION À PRENDRE : « Placer » et « Souche » écrivent dans le brouillon avant que Dryhopper ou Levure soit confirmé, alors que la maquette tenait un brouillon à part. Options : écrire tout de suite (fait, simple, annulable par Dryhopper) ou attendre la confirmation (demande un brouillon d'outil dans la pile, T13). Recommandation : garder tel quel pour Placer ; pour Souche, ne pas écrire si l'ajout n'existe pas, à trancher avec le brasseur.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
