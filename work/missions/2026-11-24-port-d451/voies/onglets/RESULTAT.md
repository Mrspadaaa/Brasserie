OK — Stocks › Matériel : une seule rangée « Matériel ▾ · Parc · À venir · Carnets · Réalisés », drapeau MATERIEL_UNE_RANGEE.

## Plan (écrit avant le code)
- Avant : deux rangées dans Matériel. Rangée 1 « Vue des stocks » (Articles · Recompter · Courses · Fûts · Matériel), rangée 2 « Vue du matériel » (Parc · À venir n · Carnets n · Réalisés n).
- Change, dans Matériel seulement : rangée 1 retirée ; rangée 2 reçoit à gauche « Matériel ▾ » (menu : Articles, Recompter, Courses, Fûts), un filet, puis les 4 segments. Maquette : `maquettes3/cap/v01-liste.png`.
- Ne change pas : Articles, Recompter, Courses, Fûts gardent la rangée de cinq ; `onSubTabChange`, `openCarnetRequest`, état gardé `stocks_subtab` / `stocks_materiel`, comptes, barre en colonne à ≥ 900 px, ancre du + volant (`cn-barre-materiel`), `nav[aria-label="Vue du matériel"]` (les parcours le visent).
- Drapeau : `const MATERIEL_UNE_RANGEE = true` en tête de `StocksTab.tsx` (après les imports). `false` : ancien JSX repris tel quel (deux blocs gardés, un par état).

## Fichiers
- src/components/tabs/StocksTab.tsx (drapeau, composant local `RangeeMateriel`, deux conditions de rendu, `LIBELLE_SEG_MATERIEL`)
- tests/integration/stocksMaterielUneRangee.test.tsx (5 tests, neuf)
- ce dossier : banc-onglets.mjs, banc*.log, cap/ (fixture Stocks), cap-carnet/ (fixture Carnet), tests.log, tsc.log, choix.log

## Menu ▾ (le besoin, le contrôle)
Le brasseur est dans Matériel et veut passer à une autre vue de Stocks sans que deux rangées mangent l'écran. Menu déroulant (`aria-haspopup="menu"`, `role="menu"` / `menuitem`) : un toucher l'ouvre, ↑ ↓ naviguent, Échap et un toucher dehors le ferment, le focus va au premier article. Il est hors du défilement horizontal des segments (sinon rogné). Chaque entrée garde son icône (celles de l'ancienne rangée). Rangée : 38 px de haut au lieu de 2 × ~40 ; aucun défilement horizontal des segments à 390 (268/268 px, après avoir passé les segments de px-2 à px-1.5).

## Critères
- tsc : `npx tsc --noEmit` = 2 erreurs, les connues (seedData GanttTask ; `virtual:pwa-register`). Aucune neuve.
- Tests : `npx vitest run tests/integration/stocksMaterielUneRangee.test.tsx tests/unit/stockLineMatching.test.ts` = 2 fichiers, 101 tests verts (tests.log). Les 5 tests couvrent : une rangée, le menu à quatre entrées, chaque sous-onglet atteint puis retour, Échap / dehors, segments et `onSubTabChange` (« carnets » puis « materiel »), `openCarnetRequest` → Carnets, ailleurs la rangée de cinq.
- `tests/ux-mobile/stockRecipeFlow.test.tsx` (seul autre test qui monte StocksTab) n'est dans aucun `include` de vitest.config.ts : il ne tourne pas dans `npm test`. Joué à la main en jsdom : échoue sur `getByText('Comparer une recette')` (c'est un aria-label), sur la vue Articles, que je ne touche pas : cassé avant moi, non réparé (hors Possède).
- `npm run build` : impossible sur ce poste, `vite-plugin-pwa` n'est installé nulle part (même cause que l'erreur tsc `virtual:pwa-register`). Build de banc équivalent (scratchpad, même config sans le plugin PWA) : vert, servi en local.
- `controle-choix.mjs` : le registre `ecrans.json` ne porte aucun écran Stocks / Matériel ; aucune ligne ne concerne cette rangée. Lancé sur le build de banc, il sort « CHOIX ECHEC (0 conforme) » avec des « page absente » / « capture absente » pour les écrans houblons, levure, menu : absences de maquettes dans un build de banc, sans rapport avec cette voie, rien de neuf.
- Banc Chrome 9222 (mon onglet, fermé ensuite, jamais browser.close()), 390 puis 1280, thème clair, fixtures « ZZ TEST » :
  - fixture Stocks : 40 ok ; 2 KO attendus (la fixture n'a aucun carnet, donc pas de « Ouvrir le carnet »).
  - fixture Carnet : « BANC OK », 42 ok, dont « Ouvrir le carnet » depuis À venir → Carnets actif, fiche ouverte (cap-carnet/390-05-ouvrir-carnet.png).
  - Joués à 390 et 1280 : Articles garde la rangée de cinq ; Matériel = une rangée (plus de « Vue des stocks ») ; menu ouvert (4 entrées, visible, non rogné) ; Échap ferme ; chaque entrée (Articles, Recompter, Courses, Fûts) atteinte, rangée de cinq avec le bon onglet actif, puis retour par Matériel vers la rangée unique ; Parc, À venir, Carnets, Réalisés actifs chacun ; pas de débordement horizontal.
- Captures ouvertes : 390-01-materiel-parc, 390-02-menu-ouvert (fixture Stocks) ; 390-04-seg-Carnets, 390-05-ouvrir-carnet, 1280-02-menu-ouvert, 1280-04-seg-Carnets (fixture Carnet). Rendu conforme à la maquette : « Matériel ▾ », filet, quatre segments, actif en pastille.

## Essais
Banc : 4 passes (le 1er KO était mon script : filtre de rangées, bouton « Stocks » avec pastille ; corrigé dans le script, pas dans l'app). Rangée à 390 : un ajustement (9 px de défilement, corrigé). Aucun critère n'a dépassé 3 essais.

## Doutes et limites
- Le bouton d'action (+) : sa libellé reste « Actions rapides » dans tous les segments de ce banc ; la preuve que l'action suit le sous-onglet est le test `onSubTabChange` (« carnets » sur Carnets, « materiel » ailleurs, effet inchangé) ; son contenu par segment n'a pas été ouvert un à un en ligne.
- Icône d'idée du calendrier (autre chemin de `openCarnetRequest`) : joué seulement par le test du composant, pas par le calendrier du banc.
- Thème sombre et 390 × 660 / 844 × 340 non joués ; en ligne : au pilote et au critique (ZZ TEST).
- Le menu est étroit (176 px) et ancré à gauche de la barre ; au-dessus du contenu, il masque quelques lignes le temps qu'il est ouvert.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : tests/ux-mobile/ n'est pas dans vitest.config.ts (stockRecipeFlow.test.tsx orphelin et cassé) ; `vite-plugin-pwa` absent de ce poste : `npm run build` y est impossible, build de banc par config sans PWA.
LEÇON PROPOSÉE : aucune
