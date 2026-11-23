OK — r6m : une phrase calculée par houblon, trois barres de gain, radars r3, IBU égal

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/generer.mjs` : il lit seulement `donnees/comparer-stout.json` et importe le socle du lot 21 (`fils21-choisir/v1/socle.mjs`, lu, pas modifié) pour la fiche g1, les pictos, l'α, l'usage, le stock et la légende.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/etat.html` : la page générée.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/captures.mjs` : l'appui long y est réel (750 ms, sur Galaxy).
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/NOTE.md` : avec la section « Choix portés ».
- Captures dans `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/` :
  - `r6m-390.png`, `r6m-premier-ecran.png`, `r6m-fiche-390.png`, `r6m-toucher-390.png` ;
  - en plus : `r6m-absolu-390.png`, `r6m-fiche-pleine.png`.
- `git status` : rien d'écrit hors de « Possède ». `etat.html` et les captures sont ignorés par git (règle `.gitignore` de `work/refonte-frontend/**`) ; `generer.mjs` et `captures.mjs` sont suivis et régénèrent tout.

## Critères (rejoués le 22.10, depuis la racine)
- G1 : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes).
- G2 : `r6m 79 mots` puis `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Le radar r3, la chimie et l'OSU sont au repos ; les valeurs s'ouvrent d'un toucher.
- G5 : `ALPHA OK`.
- G6 : `SANS-FAMILLE OK (1 houblon(s) au-dessus de 25 %, part « autres » visible)` (Galaxy 29 %).
- G7 : `EXISTENT OK 7`.
- G8 : `NOTE OK`.

Essais utilisés :
- G2 : 3 (98, puis 85, puis 81 mots ; 79 au dernier lancement) ;
- G3 : 2 (« Les fiches et le calcul de la dose » était lu comme le facteur dose ; renommé « Les vraies valeurs des fiches ») ;
- G4 : 2 (séries du radar sans polygone enfant : elles sont maintenant enveloppées dans un `g`) ;
- les autres critères : 1.

## Captures ouvertes et jugées
- `r6m-premier-ecran.png` : la question, le contexte, puis « Même floral, ~+0,2 à +0,3 cran. ». Ensuite, trois cartes : Idaho 7 « Le plus sage, moitié moins de fruit. », Galaxy « Le moins résineux, mais du tropical. », Cascade « Un rien plus floral, le plus résineux. ». Chaque carte porte ses grammes (22, 16, 42 g) et trois barres. Viennent ensuite le pont « Idaho 7 en dry hop » et le haut des radars.
- `r6m-390.png` (page entière) : radars r3 lisibles près du centre (Galaxy tire vers agrumes et tropical, Cascade vers agrumes et baies, Idaho 7 reste petit), puis la chimie en bandes, la ligne « Les vraies valeurs des fiches » et le panel OSU.
- `r6m-fiche-390.png` : la fiche g1 de Galaxy. L'option B y remplace « sans famille » : une barre aux couleurs des familles, avec une part grise, puis « autres 29 % : cannabis, dank » et « seuil 25 %, plafond 33 % : à corriger par le brasseur ».
  - Un défaut a été trouvé sur cette capture et corrigé : ma classe `.r-bord` masquait les hachures de la roue de la fiche. Mes classes de radar sont renommées `q-*`.
- `r6m-toucher-390.png` : les vraies valeurs ouvertes. On y lit α, β et huile avec source et année, l'origine de l'α retenu (« fiche de stock », « lu sur l'article »), et le calcul de la dose (10 IBU ÷ 0,62 IBU/g = 16 g).
- `r6m-absolu-390.png` : en absolu, les barres et les radars passent en points sur 100 (« Même floral, ~+4 à +5 points »).

Prédiction (une phrase, dans sa voix) : « pas mal, je comprends direct que les trois se valent en floral à 10′ et que la différence c'est la résine et le fruit, mais les radars avec tous ces rayons pâles c'est chargé ».

## Doutes et limites
- Les intervalles du moteur débordent sur presque tous les axes (haut de 55 à 110 points en bière noire). Les rayons pâles chargent les radars : c'est honnête, mais lourd.
- La résine colle au bord sur tous les radars. Le rayon en racine (bord à 4,5 crans) n'est dit que dans la légende.
- Les écarts entre houblons sont inférieurs à un cran et la confiance du moteur est « moyenne ». Le classement (moins d'arômes hors de ce que la 16D attend) est une lecture, pas un verdict.
- US-05 reste dans le contexte alors qu'il ne change rien à 10′ (la grille est simulée avec cette levure).
- La fiche g1 lit `pack-fiches.json` (la source de `comparer-stout.json`) au travers du socle.
- Rôle « mixte » d'Idaho 7 et de Galaxy (règle v1, à valider), α d'Idaho 7 « lu sur l'article », α de Galaxy hors de ses fiches : repris tels quels de ENTREES (douteux 2 et 3).

DÉCISION À PRENDRE : la base IBU égal à 10′ donne des écarts inférieurs à un cran, et la réponse honnête devient « même floral, choisis sur le reste ». Faut-il garder IBU égal pour Comparer, ou le réserver à la question de l'amertume et comparer l'arôme à dose ou effet égal ? Options : (a) garder IBU égal, qui apprend que l'amertume fixe la masse de cône (16 contre 42 g) ; (b) IBU égal au whirlpool (5 IBU, données présentes) ; (c) une autre base pour l'arôme. Recommandation : (a) pour cette variante, le brasseur tranche en regardant les autres variantes du lot (L24).

CONNAISSANCE : à 10 IBU à 10′ dans la stout 16D (20 L, US-05, moteur profil-simulé, interpolation), Cascade 42 g, Idaho 7 22 g et Galaxy 16 g donnent presque le même floral : +0,29, +0,24 et +0,24 cran de la 16D. Les différences tiennent au résineux (+0,44, +0,24, +0,14) et au fruit (Idaho 7 environ moitié moins). À amertume égale, l'huile apportée est du même ordre : 1,0–5,4, 1,1–3,3 et 1,5–4,1 mL/hL.

LEÇON PROPOSÉE : quand une variante réutilise la fiche ou le script d'un socle, préfixer ses propres classes CSS. Ici, `.r-bord { fill: #fff }` de la page a effacé sans bruit les hachures « inconnu » de la roue de la fiche g1, et seul l'examen de la capture de la fiche l'a montré (aucun contrôle ne l'a vu). Rôles : concepteur, auteur. Contrôle possible : sur la fiche ouverte, les secteurs inconnus `r-inc` doivent rester visibles.
