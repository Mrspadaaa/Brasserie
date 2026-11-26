# Jouable passe 5 : SES choix de la passe 4, écran par écran (26.11)

Sa demande, mot pour mot : « Mais tu as jamais fait comme demandé un carnets jouable en partant ces des choix Carnet passe 4, classement par
écran (25.11) ». Le jouable p4 (jouable/p4.html) suivait la recette des juges (p4b), pas son classement. Celui-ci suit SON classement :
`CLASSEMENT-4.md` (rang 1 = meilleur). Règle n° 1 : sa version choisie pour un écran est reprise telle quelle (visuel et geste), pas réinventée.

## Recette (écran → SA version → source)
Sources : `v01.html … v06.html` (ce dossier), la page passe 4 `page/index.html` (M4, base, passe 3), captures `cap/`, `../2026-11-26-liens/img/p4-*`.
| Écran | Pris de | Note |
|---|---|---|
| Liste des carnets, au repos | v02 (rang 2) | arbre catégorie › sous-catégorie gardé |
| Ranger en glissant (D455) | v01 glisser (rang 1) | geste réel, à la souris et au doigt |
| Noter vite | v01 / v02 / v06 (rang 2) + M4 « Directement écrit dans le carnet » | on écrit dans le carnet, pas dans une fenêtre |
| Note rangée par l'IA | v01 / v02 (3) | |
| Mes notes, on écrit | v04 (rang 1) | tel quel |
| Mes notes, sa ligne retrouvée | M4 / v01 / v02 (rang 2) | + « On peut quand même un peu organiser les notes » (v03) |
| L'IA lit | v03 (rang 2) | |
| Organisé : un problème | v04 (rang 2, son meilleur) | « base : Pas encore ça mais mieux » → c'est l'écran à soigner |
| Feuille « Changé par l'IA » | v05 (3) | |
| Options et Comparer | v02 / v06 (3) | défaut COMPARER-BEAUCOUP-D-OPTIONS : tenir 6 options et plus |
| Décider (devis reçu) | v01 (3) | |
| À faire, tous les carnets | v01 / v03 / v05 (3) | |
| Résoudre sur preuve | M4 / v01 / v02 / v03 / v05 / v06 (3) | prendre v01 par défaut |
| Résolu, fermé grâce à l'achat | v01 (3) | |
| Relecture « pourquoi » | v03 (3, « Bof ») | garder simple |
| Mémo, rien à faire | v02 / v03 (3) | |
| L'IA n'a pas pu lire | v01 / v02 / v03 (3) | |
Quand il a mis plusieurs versions au même rang : la première citée, sauf la note ci-dessus. Écran non classé : celui de la même version
que l'écran voisin du parcours.

## Gardé du jouable p4 (moteur et acquis, sans les changer)
Base de code : `jouable/p4.html` (Claude par sample, journal db, liens/ et demandes/ lus par la session, consigne avec règles 1c et 1d, citations
validées, lecture auto quand il arrête d'écrire, Organisé par défaut, « + » et ✦ suggestion à côté, Aide check/tâche/suggestion, 19 exemples,
anti-harcèlement, noms réels). On remplace l'interface par celle de la recette ; on garde le moteur.
Règles dures (DEFAUTS-RECURRENTS) : PAS-DE-HARCELEMENT, TROP-ENFANTIN (noms réels 2–5 mots, emoji ≤ 16 px qui accompagne), LIENS-NON-LUS,
FRISE-GENERIQUE, ENTETE-PEU-UTILE, ORGANISE-TROP-TEXTUEL, CARNET-LISTE-COMPACTE, COMPARER-BEAUCOUP-D-OPTIONS. Aucune valeur absente de ses notes.

## Contrat
Possède : `jouable/p5.html`, `jouable/cap-p5/`, `jouable/RESULTAT-P5.md`. Rien d'autre.
Preuve : un tableau dans RESULTAT-P5.md, une ligne par écran de la recette : capture de SA version (source) à côté de la capture p5, verdict
« identique / adapté (pourquoi) ». Gestes joués sur Chrome 9222 (puppeteer-core, ton onglet, page.close() puis browser.disconnect(), jamais
browser.close()), `window.claude` simulé : glisser un carnet, noter vite, écrire dans Mes notes, rangement IA, Organisé écoulement, Comparer
avec 6 options, décider, tâche, résoudre, relecture, IA en erreur. Captures 390 × 844, toutes ouvertes. Commit local de tes chemins.
Rends une ligne : écrans repris / adaptés, gestes n/n, commit.

## Mise à jour 26.11 ~09:10 : le jouable part des mini maquettes p5
Sa question : « Et les modifications des maquettes jouable ?? ». Le jouable p5 se construit MAINTENANT, sans attendre son regard sur la page.
Interface : les mini maquettes corrigées `mini/S-*.html` et `mini/O-*.html` (page https://claude.ai/artifact/6ds7soVDsMyA9xgo4CZAvm),
jetons `mini/COMMUN.md`, données `mini/DONNEES.md`, défauts levés `mini/CRITIQUE-P5.md`. Elles remplacent la colonne « Pris de » ci-dessus
(qui reste leur source). Organisé : la variante a (sa v04 reprise) par défaut. Comparer : SON choix figé du 17.11 (maquettes.json ›
ecrans_choisis.figes.comparer : h04-7, v03-4, g05-8, g01-8, h06-7 ; images work/missions/2026-11-17-carnet-retouches/maquettes/page2/img/),
défaut COMPARER-PAS-SON-CHOIX ; un autre concepteur refait en ce moment mini/O-comparer-caracteristiques.html et mini/O-options-b.html sur ce
choix : relis-les à la fin et aligne ta vue Comparer dessus. Visuel pour un TDAH, moins enfantin, tableau seulement adapté (Comparer).
Preuve : capture de chaque écran du jouable à côté de sa mini maquette. Publication : par le pilote, artefact neuf.
