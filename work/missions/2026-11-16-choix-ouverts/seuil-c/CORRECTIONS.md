OK — c6b, c3b, c1b corrigées depuis C, états repos, geste et Tout capturés, CAPTURES OK

Passe 2 du 16.11 sur les trois versions gardées (c6, c3, c1, dans cet ordre). La v0 n'a pas été touchée : les nouveaux dossiers sont `c6b/`, `c3b/` et `c1b/`.

## Fichiers
- Sources : `src/communb.html` (données corrigées, pictos et brassins partagés), `src/c6b.html`, `src/c3b.html`, `src/c1b.html`
- Outils : `buildb.mjs` (assemblage par split/join, L26) et `captb.mjs` (390×844, DPR 2, tactile ; contrôles police ≥ 14 px, texte coupé, chevauchement, position du +, onglets)
- Livrables : `c6b/proto.html`, `c3b/proto.html`, `c1b/proto.html`

## Données (correction du bloquant n° 10, valable pour les trois)
- L'acide peracétique passe au **Lavage S48**, avec la soude : on lave à la soude, puis on désinfecte au peracétique.
- Le Citra quitte le Porter et passe au seuil, sans brassin. Le doute « Citra dans un Porter » est donc levé.
- Les étiquettes Blonde passent à la **mise en bouteille S50**, avec les capsules. Avant, des étiquettes pour la Blonde étaient classées « sans brassin ».
- Les comptes ne changent pas : 5 jusqu'à S49 (Lavage 2, Porter 3), 6 de S50 à S52 (Blonde 2, Pils 3, Marché 1) et 13 au seuil. Les totaux cumulés valent 2, 5, 7, 10, 11 et 24.
- Chaque événement a son picto : vaporisateur pour le lavage, chope pour Porter et Pils, bouteille pour la Blonde, fût pour le Marché, bac à niveau bas pour « Sans brassin ». Le lavage et les fûts n'ont plus le même picto, et l'ancienne courbe muette a disparu.
- Le gros chiffre a la forme de la pastille (greffe de c1). Il reste bleu dans tous les états, comme la pastille de l'onglet, même en mode Tout.

## c6b · La pastille s'explique
1. Le menu « d'ici S49 » est remplacé par trois choix visibles au repos : S49 (5), 6 sem. (11) et Tout (24). Chaque choix porte son nombre en pastille.
2. Toucher une ligne de brassin y déplace le trait « comptés dans la pastille ». La capture « geste » montre un toucher sur Pils de Noël : 10.
3. Le bouton dit « Commander jusqu'à Porter 5 », puis « … jusqu'à Pils 10 », puis « Commander tout 24 ».
4. Les barres sont retirées. Chaque ligne affiche « +k » et, à droite, une pastille qui donne le total si l'on coupe là (2, 5, 7, 10, 11, 24). Cette pastille est pleine sur la ligne de coupe. Chaque ligne nomme aussi ses articles (« Malt chocolat, Munich, US-05 »).
5. En mode Tout, la ligne « Sans brassin » est comptée, en ambre, avec « tout est compté dans la pastille ». Le + reste dans la barre opaque et ne couvre aucune quantité.
6. La bulle « La pastille compte » s'ouvre toujours au toucher de la pastille de l'onglet (état `pastille`).
7. Greffe de c4 : sous la liste des articles comptés, les autres sont grisés dans « Pas encore comptés · N ».

## c3b · Un brassin par colonne
1. Lien avec la pastille : au-dessus des colonnes, le mini-onglet Stocks avec sa pastille, puis « **pastille** si tu coupes là ». En haut de chaque colonne, le total cumulé en pastille (2, 5, 7, 10, 11, 24) : chaque choix montre son nombre avant d'être touché.
2. Les barres portent « +k », repris de l'escalier de c5.
3. L'acide peracétique est au Lavage. La colonne S50 s'appelle « Blonde » et sa liste dit « mise en bouteille ».
4. Le lavage a le picto du vaporisateur, les fûts du Marché celui du fût, et « Sans brassin » celui du bac à niveau bas.
5. Le geste « Sans brassin → 24 » est capturé (`c3b-tout`), ainsi que le toucher sur Pils (10).

## c1b · La même bulle
1. Le bandeau « même bulle sur l'onglet Stocks » est retiré : la forme ronde suffit.
2. L'histogramme n'a plus de colonne S47 vide. Chaque colonne porte sa semaine, son picto et son nom : Lavage, Porter, Blonde, Pils, Marché, sans brassin.
3. Le bouton dit « Commander jusqu'à Porter », « jusqu'à S52 » ou « Commander tout ».
4. L'état Tout est capturé.

## Sortie décisive
`node buildb.mjs` → `BUILD OK`. `node captb.mjs` → 20 captures, toutes « ok », puis `CAPTURES OK`. Pastilles relevées : c1b 5, 11, 24 ; c3b 5, 10, 24 ; c6b 5, 10, 24, et 5 avec la bulle ouverte. Aucune police sous 14 px, aucun texte coupé ni chevauché, + entre 4 et 24 px au-dessus des onglets, onglets inchangés.
Au premier passage, `captb` signalait « coupé : jusqu'à Pils de Noël · S51 » sur c6b. J'ai corrigé en laissant le titre passer à la ligne et en déplaçant « exemple » vers le titre de la liste.

## Captures (`seuil-c/cap/`, ouvertes et jugées sur planches)
- c6b : `c6b-repos`, `c6b-geste`, `c6b-tout`, `c6b-pastille`, chacune aussi en `-cave`
- c3b : `c3b-repos`, `c3b-geste`, `c3b-tout`, chacune aussi en `-cave`
- c1b : `c1b-repos`, `c1b-geste`, `c1b-tout`, chacune aussi en `-cave`
- Base de comparaison : `C-repos.png`

## Ce qui reste discutable
- c6b et c3b disent la même chose de deux façons : en lignes (c6b) ou en colonnes (c3b). Le pilote peut n'en montrer qu'une.
- Dans c6b, toucher une ligne qui n'est pas S49, S52 ou seuil (par exemple Pils, 10) ne sélectionne aucun des trois choix. Le trait et la pastille suivent quand même. Je trouve cela juste, mais le brasseur peut être surpris.
- Dans c3b, les barres sont basses, car les 13 du seuil fixent l'échelle. L'information est portée par les pastilles cumulées, pas par la hauteur des barres.
- La poignée qu'on glisse (c2) n'est pas greffée : les colonnes se touchent déjà.

Prédiction : sur c6b, « Là je vois ce que compte la pastille, et je coupe où je veux ».

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
