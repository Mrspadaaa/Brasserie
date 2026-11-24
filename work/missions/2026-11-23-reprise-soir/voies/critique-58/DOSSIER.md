# Dossier — test en ligne du tour 58 (index-CPpfj_-A.js, aiTask à jour), 24.11

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, TOUCHER. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close(). Jamais Claude in Chrome.
- Paquet : vérifie index-CPpfj_-A.js (curl ?nocache=<aléa>) ; ancien paquet dans l'onglet → recharge.

## Son carnet « chambre froide » : regarder seulement (aucun geste qui enregistre, aucun appel IA, aucun Relire validé)
- Corrigés (voies/c56-fix/RESULTAT.md ; règles : voies/c56-tests/DOSSIER.md) : R27 vendeur et prix séparés à l'écran (mesure le TEXTE, pas la boîte : C52-3 avait été vérifié à tort), légende de jauge entière, nombre et unité jamais séparés ; R29 offre groupée ; R30 (sa réponse « Oui » à C50-5) : le compromis dit ce qu'on gagne et ce qu'on perd.

## Sur ZZ TEST (créés puis retirés ; budget IA 0,10 CHF, chaque appel au journal)
- Liens de voies/critique-56/RESULTAT.md (cellules ggmgastro, marmite brewstore, KS240L, Citra hopfenmarkt) : refaire C56-1..3, C56-6, R30 avec et sans critère.
- R28 (C56-4, C56-5) : 3 phrases rangées par l'IA (ex. « ZZ TEST — tuyau silicone 8 mm, 5 m ») : jamais « L'IA n'a pas répondu » quand elle répond ; un échec : UN seul avis avec Relire.
- Calendrier (voies/k57/RESULTAT.md) : K57-1 fenêtre de l'en-tête tenue au bord 2 s : plafonnée (~8 col./s), s'arrête au lâcher, ne dépasse pas la plage ; K57-2 fin d'une barre ZZ prise à 15 et 30 px du bord : ne saute pas, suit le déplacement du doigt ; barre au bord : défile ~6 à 9 col./s (Q4-1) ; poignées au bord faciles (POI-1).
- Rejeu, en regardant : C46-1, C46-2, C46-5, E47-1..4, C48-1..6, C50-1..9, C52-1..3, C53-1..5, C54-1..3, C55-1..4.

## Verdict
« combien et quels problèmes ? », liste numérotée, gravité B/m/D ; chaque problème à BUGS.md (préfixe C58-), format des lignes C56. Non couvert : 1280, thème sombre.
