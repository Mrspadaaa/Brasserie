OK — galerie de 1172 mini maquettes (54 lots) et page Dryhopper (96), à publier

## Fichiers écrits (tous dans « Possède »)
- `work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/index.html` : une rangée par lot, du 17.10 (phase 2) au 24.10 soir, nom en mots du brasseur, date, dossier en petit ; sommaire à ancres et total en tête ; `#a-choisir` au premier écran.
- `…/2026-10-24-galerie/inventaire.json` : 1172 objets `{ source, lot, id, titre, image, case, choix }` (et `verdict`, `mots` pour « bien » et « avec réserve »).
- `…/2026-10-24-galerie/planches/*.jpg` : 82 planches JPEG (q 62), cases de 390 × 844, 24 au plus par planche (6 × 4).
- `…/2026-10-24-dryhopper-tout/index.html` et `planches/*.jpg` (14) : rangées « Ton choix : p4b2f et sa lignée » (p4b2f, p4b2, p4b2d, p4b2e), v3 dry hop, lot 20, lot 21 (y1, y1b, a2b), carte, séries A à G, passes 2-3, passes 4-5.
- `…/2026-10-24-galerie/outils/generer.mjs` (génère tout : planches, inventaire, deux pages statiques) et `outils/regarder.mjs` (captures de contrôle dans os.tmpdir()).

Les vignettes sont des découpes de leur planche (`<img>` décalée dans un cadre `overflow: hidden`), chacune avec son `data-source`. La visionneuse ouvre la case à 390 px, à côté de « ton choix » du même écran (étape v4.10, q2b, r6a, g1, flb5b, u4, p4b2f, épicé série F). Pastilles « ton choix » (8 : registre `ecrans.json`, épicé), « bien » et « avec réserve » (ses mots de SPEC § 1 et § 6, `acquis.json`, `image-etat-global.mjs`).

## Critères (rejoués à 22:11, après la dernière génération)
- G1 : `COUVERTURE OK (1002 mini maquettes ; Dryhopper 93)`
- G2 : `PAGE OK (1172 images chargées, lisible à 390 et 1280 px, sans erreur)`
- G3 : `PAGE OK (100 images chargées, lisible à 390 et 1280 px, sans erreur)`
- G4 : `POIDS OK (99 fichiers, 44.9 Mo)`

## Captures regardées (os.tmpdir()/affinee-galerie/)
`gal-tel-haut.png`, `gal-tel-rangee.png` (lot 22), `gal-ordi-rangee.png` (v3), `gal-ordi-visionneuse.png` (r6b à côté de r6a), `gal-tel-visionneuse.png`, `gal2-ordi-rangee.png` (lots 8 et 9), `gal3-ordi-rangee.png` (pictos hors 16D), `gal3-tel-visionneuse.png` (u2), `fin-ordi-haut.png` (sommaire) ; `dry-haut.png`, `dry-ordinateur.png`, `dry-ordi-rangee.png` (série C), `dry-tel-ecran2.png` (sa lignée). `verifier-page --captures` sur la galerie échoue à cause de la hauteur (« Page is too large ») ; G2 tourne sans `--captures`, d'où les captures par `regarder.mjs`.

## À savoir
- Champ : 1002 sources de la couverture (488 etat*.html v4 au départ, puis les lots en cours ; 494 captures v3), plus 61 pages de variantes des lots sans etat (fils6, 7, 9 à 13, 16), plus 109 captures des phases 2, 7 et 8. Pas d'images : fils19-choix (des documents seulement), phase2/actuel-1280 (l'app en ligne, pas une création), phases 3 à 6.
- Image : la capture existante du premier écran (`-premier-ecran`, `-b-390`, `-390`, `-vue-390`, `-page`…) ; 27 sans capture, rendues à 390 × 844 dans Chrome. Les captures à 1280 px (v3, phase 2) sont réduites à 390 de large.
- Les voies leg, legz, rca, rcb et rcc écrivaient encore leurs etat.html pendant la voie (fils24-legendes, fils24-recherche, rangées « (en cours) »). Pour les inclure toutes avant de publier, relancer `node work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/outils/generer.mjs` (2 min ; un nouveau lot reçoit un nom tiré de son brief), puis G1 à G4.
- Écart : la consigne dit « une planche par lot » ; les lots de plus de 24 mini maquettes ont plusieurs planches (3 376 px de haut au plus), pour qu'un téléphone n'ait pas à décoder une image de 30 mégapixels. Le budget reste tenu (99 fichiers).

Prédiction : « Enfin tout d'un coup d'œil » ; il ira droit à Dryhopper et au lot 21. Les vignettes de la v3 à 1280 px, réduites, lui paraîtront petites.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : une découpe de planche (`<img>` en `position: absolute`, `width: cols×100 %`, `left: −x×100 %`, `top: −y×100 %` dans un cadre `aspect-ratio: 390/844`) permet de montrer 1 172 vignettes en 82 fichiers ; `verifier-page --captures` ne capture pas une page aussi longue (limite de Chrome).
LEÇON PROPOSÉE : aucune
