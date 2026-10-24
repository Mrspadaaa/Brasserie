OK — gr5, groupe levure de q2b et mots hors 16D dans Suggérer ; 18/18 états

## Suite (D44, D130) : le groupe levure de q2b et ce qui est propre à chacun
Ses mots, sur sa q2b : « Celle ci aussi est toujours meilleures. Mais aussi ajouter les spec en plus type comme matrice
nettoyée flb5b · de flb5 ». Sur flb5b : « Les type spéciaux des houblons hors 16d ! C'est très important surtout dans la
comparaison !!!! ».

Fichiers :
- `…/suggerer/voies.ts` : `levuresDe`, les voies « Changer de levure » du levier R43 du moteur (`yeastChange`). Le mémo des leviers sert aussi `dryhopActif`, dont la signature ne change pas.
- `…/suggerer/hors16d.ts` (neuf) : `motsHors`, `tousMots`, `horsDesFamilles` et `motsLevure`.
- `…/suggerer/index.tsx` : `BlocLevure` après le dry hop, la ligne `Hors16D` sous le nom (au-dessus des pictos) sur la première ligne de chaque houblon, l'en-tête mis à jour.
- `…/suggerer/bulle.tsx` : la bulle monte au-dessus du nom tant qu'elle reste à 110 px du picto au plus ; sinon, juste au-dessus de la case.
- `…/suggerer/suggerer.css` : style de la ligne hors 16D.
- `…/suggerer/NOTE.md` : section « D44 et D130 ».
- `work/refonte-frontend/v4/choix/etats/suggerer.json` : `etat-sugg-levure` perd son « voulu » D35. Son `verif` est relevé sur sa q2b : sélecteur `[data-moment="levure"]`, au repos, attendu « Changer de levure », « LalBrew Verdant IPA », « LalBrew Pomona », « estimé ». Son `ecart` porte D44.

Rendu :
- Le groupe « Changer de levure · levure · estimé » apparaît, avec LalBrew Verdant IPA et LalBrew Pomona, chacune avec ses pictos, ses traits (crans comptés), sa barre et son « + ». Les nombres viennent du moteur et sont ceux de q2b : Verdant agrumes +1,3, tropicaux +2,2, noyau +4,4 hors style ; Pomona +2,8, +3,1 et +4,3, tous hors style. Floral et résineux ne sont pas établis (hachures).
- Houblons, à la première ligne où chacun paraît : Motueka « lui seul : mojito » ; Aurum « hors 16D : noble » ; East Kent Goldings « lui seul : miel, thym » ; Columbus « lui seul : curry, piquant » ; Celeia « hors 16D : noble » ; Citra cryo « hors 16D : groseille à maquereau » ; Nelson Sauvin « hors 16D : vin blanc, groseille à maquereau » ; Galaxy « hors 16D : cannabis, dank » ; Hallertau Blanc « lui seul : café ». Tous ces mots sont tirés de ses fiches (`sansFamille` du moteur). Les mots génériques sont écartés (« fruité », « net » pour clean) et les mots anglais sûrs traduits (coffee → café).
- Levures : Verdant « elle : abricot dominant, POF négative » ; Pomona « elle : pêche, POF négative ». Ces mots viennent de la fiche technique Lallemand relevée par le modèle. Une souche sans fiche afficherait « ? ».

Critères (rejoués après la dernière construction) :
- construire → `CONSTRUIT OK (9 pages)`
- `controle-hors-16d.mjs …/suggerer/etat.html --min=2` → `HORS-16D OK (11 : …)`
- `controle-etats.mjs …/parcours-suggerer --ecran=suggerer` → `ETATS OK (18/18) ; 2 voulu(s) non rejoué(s)`, levure comprise ; `--choisie` → `ETATS OK (18/18)` sur ses maquettes choisies.
- `controle-commun.mjs … suggerer --page=etat.html` (avec mots) → `COMMUN OK` ; `mots-premier-ecran --max=70 --modere` → `MOTS OK (alerte modérée : suggerer 95 au-dessus de 70)`. Le premier écran en comptait 77 avant ; deux mots au plus par houblon, une seule fois.
- `controle-traits.mjs` → `TRAITS OK (6 touchés, 2 largeurs)` ; `jouer-parcours --etape=suggerer` → `ETAPE OK` ; `verifier-types` → `TYPES OK`.
- Essais ratés, corrigés :
  - `standard` S4 : l'icône levure de q2b avait des traits de 1,6 et 1,8 px ; ramenés à 1,2 px, comme le dry hop.
  - Règle 2 de D110 : la ligne hors 16D était sous les pictos ; elle passe sous le nom.
  - Règle 3 de D110 : la bulle était à 121 px du picto ; son placement s'adapte.
- `controle-choix … --ecran=suggerer` → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`. Rejoué après la remarque du pilote : son ECHEC « lui seul » sous les pictos venait d'une construction antérieure au déplacement de la ligne sous le nom. La ligne hors 16D est sur la ligne du nom, hors de la rangée des pictos : TRAITS OK, HORS-16D OK (11). `controle-teinte` → `TEINTE ECHEC (6/7)` sur **dryhopper** (teinte 16, choisie 8), hors de ma voie.

Captures (ouvertes) : `prototypes/houblons-v4/maquettes/parcours-suggerer/captures-r11/etat-sugg-repos-construite.png`, `…/etat-sugg-gr5-cran-construite.png` et `…/etat-sugg-levure-construite.png`. La dernière se regarde à côté de `work/refonte-frontend/v4/choix/etats/captures/etat-sugg-levure-choisie.png` : même groupe, mêmes pictos et mêmes barres ; la ligne « elle : … » est en plus.

DÉCISION : le « + » d'une levure la retient sur place, sans l'ajouter à « Comparer (n) ». Comparer ne compare que des houblons (clés de houblon) ; comparer des levures, c'est l'écran Levure, dont le choix est ouvert.
DÉCISION : « lui seul : … » seulement quand aucun autre houblon de l'écran n'a ces mots, comme flb5b face à ses remplaçants ; sinon « hors 16D : … ». Deux mots au plus, et seulement à la première apparition du houblon (D41).
DÉCISION : les mots hors 16D sont calculés dans Suggérer (`hors16d.ts`), et non importés de `substituer/donnees.ts` : ce fichier est en cours de modification dans une autre voie. Ses règles (génériques, noms de famille, traductions) sont reprises. À fusionner au portage.
DÉCISION À PRENDRE : faut-il que le « + » d'une levure entre dans Comparer ? Cela demande que Comparer accepte une souche. C'est hors de ma voie.

## Fichiers écrits
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/bulle.tsx` : la bulle dit une ligne, comme gr5 (« Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka ») ; code du style passé au fournisseur ; signe vrai, « · hors du style », « ne bouge pas », « non établi : inconnu, pas zéro ».
- `…/suggerer/briques.tsx` : `traitsDe` (places de trait dessinées) ; `Traits` reçoit `avec`, `plafond`, `etat`, `etatVide` et dessine les crans vides ; `Calme` et `CaseInconnue` reçoivent `avec`.
- `…/suggerer/index.tsx` : `plafond` par groupe (le plus grand effet du groupe, en places de trait, calculé du moteur) ; `data-etat` des deux états sur la première voie ; une demi-ligne dans la légende du « ? ».
- `…/suggerer/suggerer.css` : crans vides (1 px #8a8a86, comme gr5), case touchée cernée (carré arrondi à l'encre), bulle blanche à bord noir de 1,5 px, sans flèche.
- `…/suggerer/jeu.mjs` : le geste D110 attend la nouvelle phrase.
- `…/suggerer/NOTE.md` : section « Reprise gr5 ».
- `work/refonte-frontend/v4/choix/etats/suggerer.json` : ajout de `etat-sugg-gr5-cran` (toucher, `.jg-l[data-jg="b"] li [data-role="cible"][data-famille="citrus"]`, attendu « Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka », interdit « 1 trait = 1 cran du style ») et de `etat-sugg-gr5-crans-comptes` (repos, `.jg-l[data-jg="c"] li .jg-vide`, attendu « même effet sur tes objectifs », « Motueka », « Agrumes +1,6 cran »). Les deux sont mesurés sur la page gr5. Aucun autre état n'a été touché.

## Critères (rejoués après la dernière construction)
- G1 `construire.mjs --sortie=…/parcours-suggerer` → `CONSTRUIT OK (9 pages)`
- G2 `controle-etats.mjs --choisie --ecran=suggerer` → `ETATS OK (17/17) ; 3 voulu(s) non rejoué(s) sur ses maquettes choisies` (gr5-cran OK, gr5-crans-comptes OK sur sa page gr5)
- G3 → `ETATS OK (17/17) ; 3 voulu(s) non rejoué(s)` (les 15 états de q2b et les 2 de gr5)
- G4 → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))` puis `COMMUN OK` (avec mots sauté)
- En plus : `controle-traits.mjs` → `TRAITS OK (6 touchés, 2 largeurs)` ; `jouer-parcours.mjs --etape=suggerer` → `ETAPE OK (suggerer)` ; `controle-teinte.mjs` → `TEINTE OK 6/6` ; `verifier-types.mjs` → `TYPES OK`.
- Au premier essai, CHOIX ECHEC : `controle-traits` règle 3, bulle à 136 px du picto (largeur 300 px, posée au-dessus du nom). Corrigé avec une largeur de 240 px : la bulle est à 110 px.

## États rendus (captures 390 × 844 tactile, ouvertes à côté de celles de gr5)
- etat-sugg-gr5-cran : `prototypes/houblons-v4/maquettes/parcours-suggerer/captures-gr5/etat-sugg-gr5-cran-construite.png`, à côté de `work/refonte-frontend/v4/ecran-1/fils24-graphes/captures/gr5-toucher.png`. On voit la même chose : la case Agrumes de Motueka cernée et la bulle au-dessus de sa ligne. Seule différence : le retour à la ligne se fait après « 16D · » (gr5 : après « ton objectif · »).
- etat-sugg-gr5-crans-comptes : `…/captures-gr5/etat-sugg-gr5-crans-comptes-construite.png`, à côté de `…/captures/gr5-toucher-c.png`. Mêmes crans vides : Motueka floral 1 + 1 vide, agrumes 2 ; Aurum herbacé demi + 1 vide, terreux 1 + 1 vide.
- Celeia apparaît en 5e voie du premier groupe (moteur en direct ; gr5 en figeait 4). Les groupes du bas ont été regardés : Remplacer Nugget (plafond 1, pas de crans vides, contours de baisse intacts) et Dry hop (1 cran vide, orangé hors style intact).

## Prédiction
« Oui, c’est ça : je compte les crans, et Nelson dit enfin vin blanc » ; il pourrait trouver les crans vides encore fins à 390 px et le premier écran plus chargé (95 mots).

DÉCISION : plafond des crans vides **par groupe**, et non sur toute la liste. Sa page gr5 ne montrait qu'un seul groupe (2). Sur tout l'écran, l'assemblage et le dry hop (2,6 à 2,7 crans) l'auraient porté à 3, et le premier groupe aurait différé de sa capture.
DÉCISION : le compte se fait en places de trait dessinées (un demi compte une place), pas en `ceil(data-crans)` comme sa page. Les résultats sont identiques sur sa page, et le compte reste juste à 2,1 crans.
DÉCISION : la clé « 1 trait = 1 cran du style » (D110) disparaît de la bulle, comme dans gr5. « cran du 16D » dit l'unité.
DÉCISION : bulle de 240 px de large (gr5 : 300) pour tenir la règle 3 de D110 (à 120 px au plus du picto). « ton objectif » et « avec … » ne se coupent pas.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
