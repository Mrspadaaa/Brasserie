OK — r6g : trois verres à 10 IBU, radar r3 sous chaque verre, quatre acquis, 76 mots

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/generer.mjs` : le générateur. Il lit seulement `donnees/comparer-stout.json` et le socle de `fils21-choisir/v1/socle.mjs` (pictos, fiche g1, légende, lentille).
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/etat.html` : la page.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/NOTE.md` : la note.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/captures.mjs` : le script des captures.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6g-*.png` : 8 captures.

## Critères (rejoués depuis la racine)
- G1 : `COMMUN OK`. MOTS est sauté. COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE, PARLANT et BRUTES sont OK.
- G2 : `r6g 76 mots` puis `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`. Contexte : base, moment, bière, levure.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Le radar r3 est visible au repos ; chimie, OSU et valeurs s'ouvrent d'un toucher.
- G5 : `ALPHA OK` (3 houblons, 3 avec leur α).
- G6 : `EXISTENT OK 7`.
- G7 : `NOTE OK`.
- G8 : `NOTE OK` sur ce fichier.
- En plus : `SANS-FAMILLE OK`. Pire contraste : 5,18:1.

Essais : G4 a demandé 2 essais (au premier, le balisage `data-acquis="radar"` manquait). Tous les autres critères ont passé au premier essai.

## Captures ouvertes et jugées
Toutes dans `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/` :
- `r6g-premier-ecran.png` et `r6g-390.png` : la page entière tient dans le premier écran.
- `r6g-fiche-390.png` : appui long sur Galaxy, fiche g1 ; on y lit α 17,2 % ≠ 11–16 % et « sans famille : cannabis, dank ».
- `r6g-toucher-390.png` : la chimie ouverte.
- `r6g-valeurs-390.png`, `r6g-osu-390.png`, `r6g-absolu-390.png`, `r6g-legende-390.png`.

Défauts vus sur les captures et corrigés :
- un tiroir était ouvert au repos (`[hidden]` écrasé par le CSS) ;
- la réponse était coupée en colonnes (collision avec la classe `.rep` de la baseline) ;
- l'icône du verre débordait dans la légende (collision avec `.lg-v`) ;
- les noms de sources étaient tronqués (« John I ») ;
- les unités cassaient les lignes ;
- les valeurs restaient en crans quand la page s'ouvrait en absolu ;
- le cadre rouge d'Idaho 7 se lisait comme une alerte : il est passé à l'encre.

Ma prédiction, dans sa voix : « Les trois verres c'est parlant, on voit tout de suite qu'il faut 2× plus de cascade pour la même amertume. Mais si tout est sous un cran à 10′, ça m'aide pas à choisir : c'est en dry hop qu'il faut comparer. »

## Doutes et limites
- Avec cette base, la réponse est faible : tous les gains simulés restent sous 1 cran. « Idaho 7 ≈ Galaxy » vient d'un écart de 0,02 cran, du bruit. La page le dit (« ≈ », « tous sous 1 cran ») ; la NOTE aussi.
- Le gain est une droite entre 0, 1 et 2 g/L de la grille (b10, US-05). La courbe du moteur est concave, donc Galaxy (0,81 g/L) est un peu sous-estimé.
- Le radar montre le bas et le centre du moteur, pas le haut. Le haut de la grille vient de la plage de la stout (Nugget en « haut partiel ») et ne mesure pas le gain du houblon.
- La règle de classement est la mienne et reste à valider : floral, herbacé et terreux gagnés, moins le résineux gagné, en crans. Elle est écrite derrière « ? ».
- Descripteurs A : invisible sur cette page, car elle ne montre pas Nelson Sauvin. La NOTE le dit.

DÉCISION À PRENDRE : faut-il garder « IBU égal » comme base d'un écran Comparer, alors qu'à 10′ elle ne sépare pas les houblons à plus d'un cran ?
- Option a : la garder comme lecture secondaire (« à même amertume »), à côté de « dose égale » ou « effet égal ».
- Option b : l'abandonner.
- Ma recommandation : a. Elle apprend une chose vraie et utile (moins d'α, plus de houblon, huile du même ordre), mais elle ne doit pas servir de base principale.
- Qui tranche : le brasseur, en comparant les variantes.

CONNAISSANCE : à IBU égal (10 IBU à 10′, stout 16D de 20 L), le moteur v4 donne moins d'un cran de gain à Cascade (41,6 g), Idaho 7 (21,8 g) et Galaxy (16,2 g). Le plus fort est le tropical de Galaxy, à 0,9 cran. L'huile apportée reste du même ordre : 1,1 à 5,2 mL/hL. Cascade est celui qui ajoute le plus de résineux, +0,44 cran, à une stout déjà trop résineuse.

LEÇON PROPOSÉE : avant de réutiliser le CSS d'un socle de baseline, préfixer ses propres classes (par exemple `r6-…`). Ici, `.rep`, `.lg-v`, `.lg-p` et `.c` du socle l8g ont cassé trois rendus. Aucun contrôle ne l'a vu : seules les captures ouvertes l'ont montré.
