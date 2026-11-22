# Reprise : mini maquettes du Stock, tour 1 (21.11, D416)

Arrêt à environ 150 k de contexte (captures lues). Rien n'est montré au brasseur, rien n'est publié.

## Fait
- Sources lues : capture 01 annotée, capture 02, VOIES-CORRECTION (D1, D2, D3, D8), fin de SPEC-BRASSEUR, AMELIORATIONS.
- Aucune clé « stock » dans `ecrans.json` ; `maquettes.json` n'a que `stocks-pastille` (la pastille C). Base retenue : l'écran
  en ligne du tour 8 (sa capture 01), étagère gardée partout. Matériel : segment Parc · À venir · Carnets · Réalisés gardé (p2:g05-1).
- `st1-build.mjs` : 20 pages `st1-<v>-<état>.html`. Versions :
  - D1 : d1a (Recompter en onglet, ★ dans son rond), d1b (Recompter dans le rond, badge « 1 »), d1c (une rangée : recherche, rond Comparer, rond Recompter) ; états repos et recompter.
  - D2 (entrée de d1a, Comparer en rond) : d2a (le mur est l'en-tête, un rayon touché montre sa liste), d2b (mur mince, pictos, une bande tri + échelle), d2c (mur seul + « À faire », bulle au toucher) ; captures à 390 × 660.
  - D3 : d3a (bande de légende sous le mur ; 1280 : trois rayons côte à côte, une table par rayon), d3b (rond « ? », bulle près de lui ; 1280 : mur collant à gauche, table à droite).
  - D8 : d8a (Matériel sans rangée Tout/À traiter ; Fûts : 4 tuiles-filtres à picto de fût, lignes bordées de couleur), d8b (Matériel en tuiles ; Fûts en râtelier).
- `st1-capture.mjs` : captures dans `st1-captures/`, signale débords et rangées au premier écran. Références copiées dans `st1-ref/`
  (sa 01 annotée, tour 8 Articles, Recompter, Matériel, 1280 du banc V2).
- Diagnostic : `scratchpad/st1-diag.mjs` (hors dépôt), à recopier si besoin.

## Défauts ouverts (mesurés, 390)
1. Rangée de pastilles 400/370 px : DDM et le rond débordent. Remède : `.pl` à 13–14 px sans espace interne, ou masquer
   « DDM 0 » dans d1b/d1c seulement (d1a garde tout, c'est son dessin) ; viser ≤ 370.
2. Chaque rangée du mur fait 75 px (cible ≈ 52) : la colonne de nom (nom, compte, lien 136, Légende) l'allonge. Remède :
   lien « 136 » et compte sur une ligne ; `.bars` 30 px ; Légende hors de la colonne sauf d1.
3. D2 à 660 : d2a 2 rangées, d2c 2 (cible ≥ 3), d2b 4. Dépend de 2.
4. d3a-1280 : rangée Levures coupée (`.rg`), à élargir (colonne 1fr) ou réduire `w`.
5. Captures non encore ouvertes après correctifs : toutes sauf d1a-repos et d2a-repos-660 (premier jet).

## Prochaines actions
1. Corriger 1 à 4 dans `st1-build.mjs`, `node st1-build.mjs && node st1-capture.mjs` (attendu : « ok » partout, rangées ≥ 3 pour les -660).
2. Ouvrir chaque capture (20), juger « je comprends en 3 s ? », refaire ce qui ne tient pas.
3. Écrire à la main `choix-stock-1.html` sur le modèle de `../2026-11-21-calendrier-fiche/choix-fiche.html` :
   docs `stock1-<id>` (`db.doc('choix/stock1-'+v)`), clé localStorage `choix-stock-1`, une section par axe D1, D2, D3, D8
   avec sa référence (`st1-ref/`) et ses versions, titre daté « 21.11 », bloc `#a-choisir` en tête ; images de 340 px.
4. `node scripts/agents/verifier-page.mjs work/missions/2026-11-21-stock-maquettes/choix-stock-1.html --page-lot` → PAGE OK.
5. Commit par chemins (dossier `work/missions/2026-11-21-stock-maquettes/`), sans publier.
