OK — carnet p1 jouable : 4 écrans lisibles, 15 tâches en 2 touchers sans clavier

## Fichiers (tous dans f9/p1)
proto.src.html, proto.html (build.mjs), GESTES.md, gestes.mjs, mesure.mjs (copie de f9/mesure-lisibilite.mjs, jeu p1), capt.mjs (copie de calendrier/p8/capt.mjs, lit proto.html, écrit captures/), planche.mjs, captures/ (34 états × clair et cave à 390, 5 à 1280, 3 de la démo).

## Sorties décisives
- `node f9/p1/mesure.mjs` : 30 OK, 0 ECHEC (15 écrans × 2 thèmes). Mots au repos : liste 40, carnet 36, articles 40, comparer 39, pourquoi 39 ; rien sous 14 px ; contraste 0 échec ; un seul titre ; 0 pastille. Tailles 14, 16, 24.
- `node f9/p1/gestes.mjs` : GESTES OK. T1 0 toucher ; T8, T9, T11 1 ; T2 à T7, T10, T12 à T15 2 ; clavier 0 ; volant « Dans … puis Partout » ; aucun type="number" ; console propre.
- `?demo=1` : T4 jouée seule, « T4 faite : 1,2 s, 2 touchers ».

## Ce qui a été tranché (FUSION, puis mesure)
- dc : segments Journal · Articles · Comparer, liste à vignette du choix, décision remplacée barrée. da : bannière du choix, Comparer en barres épaisses (barre longue = meilleur), fil daté en marge.
- Neuf : la bannière ne vit que dans Journal (sinon Articles et Comparer dépassent 40 mots). Les notes se replient en « 3 notes ⌄ » entre deux jalons, sauf la plus récente. L'échéance du calendrier devient le premier jalon du fil (« 2.12 Achat prévu »). Une seule caractéristique à l'écran, avec ‹ › et le sélecteur. Pourquoi met le fournisseur en tête ; la raison de chaque écarté s'ouvre d'un toucher. Fiche : courbe datée, offre ailleurs avec « Ajouter », œil et interrupteur. Choisir : raisons et écartés proposés, « 2ᵉ sur débit » si l'article n'est pas le meneur, veille des écartés arrêtée.
- Écart à FUSION : « ★ critère » et « 3 écartés › » quittent la bannière d'un carnet choisi (le pourquoi y est déjà, et Pourquoi montre les écartés). Ils restent dans la bannière d'un carnet qui compare.
- Pictos dessinés (statut en anneau qui se remplit, coche verte au choix) ; photos d'objets dessinées en SVG pour simuler og:image.

## Captures (f9/p1/captures)
p1-repos-390, p1-carnet-390, p1-articles-390, p1-comparer-390, p1-fiche-390, p1-pourquoi-390, p1-choisir-390, p1-ventilation-390, p1-evier-390, p1-dial-390, p1-partage-feuille-390, p1-cal-390, p1-demo-liste-390, avec leurs -cave-390, et p1-*-1280.

## Prédiction
« Là je comprends en 3 secondes : un statut, le choix et son pourquoi. Par contre, les petites dates 14.11 et 22.10 en haut de Pourquoi, je ne vois pas à quoi elles servent. »

DÉCISION À PRENDRE : la place du carnet (Finances › Matériel ou À venir) et la forme de l'alerte restent à montrer en variantes. Par défaut ici : onglet Finances et « −600 » sur la ligne.
CONNAISSANCE : `mesure-lisibilite.mjs` compte chaque nœud texte à part. Un séparateur de milliers mis dans un `<span>` coupe donc « 11’700 » en 2 mots. Le séparateur ’ doit rester dans le même nœud.
LEÇON PROPOSÉE : aucune
