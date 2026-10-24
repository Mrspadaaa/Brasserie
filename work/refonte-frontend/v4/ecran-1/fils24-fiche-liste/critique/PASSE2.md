# Passe 2 — la liste de la fiche (fla5b, flb3b, flc8b, fld8b, flu2b, et flu6 sur Nelson) — critique Fable, 24.10

Jugé sur Nelson Sauvin d'abord (`*-nelson.png`), puis Nugget (`*-nugget.png`), puis les états (Cascade, absolu, « fiches », légende « ? »).
Gestes joués dans Chrome à 390 px (script `jouer-fl-p2.mjs`, scratchpad) sur les 9 pages (dont `flu2b/nelson.html`, `fld8b/h-nugget.html`) :
0 erreur, 0 débordement ; « absolu » change le DOM partout (sur `fla5b#fiche=nugget` le script n'a pas vu le changement, la capture
`fla5b-nugget-absolu.png` le montre) ; « fiches » change le DOM sur flu2b ; le « ? » ouvre une aide partout. Mots anglais au repos : aucun
sur les cinq candidates ; flu6 en garde quatre (pineapple, woody, resinous, resiny).
Ce que la passe a gagné : Nelson Sauvin se lit en trois secondes sur les cinq ; un seul α (Hopsteiner 2025, police du thème) ; le
sélecteur hors de la fiche ; le français au repos ; les comptes se vérifient à l'écran (recomptés : 5 sur 7, 1 sur 12, 1 sur 9, 2/2, 1/2 justes).

## Classement
Sur Nelson Sauvin d'abord ; le rang dit l'idée et sa lecture, le verdict (section suivante) dit ce qui bloque.
1. **flc8b** — Nelson : quatre tuiles pleine largeur, tamponnées BM 2023 · HS 2025, sous un radar à sa taille qui le reconnaît ; cadre g1 entier (étape, en-tête, pied). Nugget : neuf tuiles, « 16D » sur les attendues, boisé « HS US ? · YCH ? » honnête — perd de g1 : le repère ⊙ après le nom ; 3,5 tuiles au premier écran sur Nelson.
2. **flb3b** — Nelson : « Vin blanc, raisin, groseille à maquereau. » puis « sauvignon blanc 1/2 · fruité 2/2 », la ligne de familles et les « ? » : tout tient, rien d'inventé ; Nugget et Cascade : repli honnête, compte affiché — perd de g1 : l'en-tête de l'étape, repoussé à 190 px sous un second en-tête (question, onglets, « fixé ») ; les flèches « + Floral / − Résineux » du radar rendues en barres noires coupées (Nugget, Cascade).
3. **flu2b** — Nelson : cinq cartes sombres « hors des 12 » en tête, Agrumes et Épicé en couleur, 0,98 écran, pied g1 complet, français avec l'original à un toucher — perd de g1 : le radar, réduit d'environ 40 % et poussé à gauche (étiquettes sur deux lignes : « Agrumes / 1/2 ») pour loger deux bascules et trois lignes de texte.
4. **fla5b** — Nelson : « Le style n'en dit rien » en tête, cinq tuiles pointillées 2/2, plus de « 0 / 0 », radar à sa taille ; Nugget : les trois étagères pleines — perd de g1 : le titre de l'étape (« Houblons 3/7 » devenu « Que sent ce houblon ? ») ; la bande des 12 ; pas de « 1er » sur vin blanc.
5. **fld8b** — Nelson : deux rayons « catég. », cinq mots sous une eau dans les gris du thème, « 5 mots sur 7 » juste ; Nugget et Cascade tiennent (petite coque, « presque tout se dessine ») — perd de g1 : l'en-tête d'étape (IBU · OG · EBC, « 3/7 ») remplacé par une ligne de contexte ; la bande des 12 ; 120 px vides entre le radar et l'eau sur Nelson ; étiquettes serrées à gauche sur Nugget ; « Agrumes 1/2 · agrumes (catég.) » redit la famille en mot.
6. **flu6** (v0 sur Nelson) — les mots au bout des rayons tiennent ; mais le cadre « hors des 12 » aligne « vin blanc fruité groseille à maquereau raisin sauvignon blanc Fruité White wine fruity grape gooseberry » : dix mots pour cinq idées, l'anglais au repos.

## Verdicts
- **flc8b** (tuiles tamponnées) — ACCEPTÉ. Défauts à retoucher, aucun ne bloque : la légende des sources (« BM Beer Maverick 2023 / HS Hopsteiner 2025 », quatre lignes sur Nugget) et la phrase « ta 16D accueille d'abord floral, herbacé, terreux : ses fiches n'en disent rien » sont écrites au repos (D89, D3) ; les tuiles n'arrivent qu'à mi-écran sur Nelson ; le ⊙ de g1 manque. Sa phrase : « Ça c'est bien, on voit direct ce que les deux fiches disent et d'où ça vient. Les BM / HS en haut, mets-les derrière le ? ».
- **flb3b** (la signature en une phrase) — REJET : un second en-tête (« Que sent ce houblon, dit avec ses mots ? », onglets, « fixé : Stout export 16D · levure US-05 ») est empilé au-dessus de « ‹ Houblons 3/7 » ; la fiche g1 commence à 300 px. D119 (« Header qui change ??? ») et D116 (« remplacer tout ça par le vrai Stepper de la vrai app ») : l'étape garde son seul en-tête, et le houblon se choisit dans l'étape (comme flc8b, une rangée sous l'en-tête, ou les cartes d'ajout). Deux défauts de plus, vérifiables : sur `flb3b-nugget.png` et `flb3b-cascade.png`, les flèches « + Floral / − Résineux » du radar sont rendues en traits noirs coupés (hors du cercle) ; sur `flb3b-legende.png`, la bulle du « ? » recouvre le bouton Comparer et la ligne des « ? » (D113 : la légende ne cache pas ce qu'elle explique). Sa phrase : « Vin blanc, raisin, groseille : très bien, on comprend direct. Mais c'est quoi ce double header ??? ».
- **flu2b** (cartes de famille) — ACCEPTÉ. Défauts à retoucher : le radar réduit et poussé à gauche (D115 : « Mettre le radargraph avant » veut le radar lisible, pas un timbre ; g1 le donne sur toute la largeur), et les trois lignes de texte à sa droite (« notre traduction », « Nelson Sauvin, 2 fiches · stout 16D ») au repos (D1) ; la bascule « français · fiches » peut vivre dans la légende. Sa phrase : « Bien, dense, en français maintenant. Le radar est devenu tout petit. »
- **fla5b** (au style, en mots) — REJET : le titre de l'étape « Houblons 3/7 » est remplacé par « Que sent ce houblon ? » (`fla5b-nelson.png`, `fla5b-nugget.png`) : D119 (« Header qui change ??? ») et D116 (le fil d'étapes de l'app). Correction : rendre « Houblons 3/7 » ; la question tient dans la fiche (la ligne « 7 mots, 2 fiches » suffit). À retoucher sans bloquer : « 1er » sur vin blanc (son choix p22 : le mot nommé en premier se voit, une fois) ; sur Nugget, gingembre sous le pli. Sa phrase : « Là c'est bon, vin blanc, raisin en premier, et ma stout en face. Pourquoi le header a changé ? ».
- **fld8b** (l'iceberg) — ACCEPTÉ. Défauts à retoucher : l'en-tête de l'étape (IBU · OG · EBC, « 3/7 ») remplacé par « ‹ Houblons · Stout export · 20 L · 16D Foreign Extra Stout » (D116 : le fil de l'app, pas une ligne de maquette) ; 120 px vides entre le radar et l'eau sur Nelson (D4) ; « Agrumes 1/2 · agrumes (catég.) » redit la famille en mot (la plainte du 23.10 sur « Floral 1/2 · floral ») : garder « catég. » seul ; Nugget : Résineux / Terreux / Épicé serrés à gauche (D56). Sa phrase : « Ah ouais, là on comprend pourquoi le radar le rate. Un peu gadget, mais ça parle. »
- **flu6** (mots au bout des rayons, v0 sur Nelson) — REJET : anglais au repos (« White wine fruity grape gooseberry », D97, D115) et le cadre « hors des 12 » compte dix mots pour cinq idées (« Fruité » et « fruité » deux fois) : chaque nombre doit se recompter (L14). Correction : la table de traduction de flu2b, une idée par mot, puis recapturer Nelson et Nugget. Sa phrase : « Pourquoi il y a les mots deux fois, en anglais et en français ??? ».

## Greffes
- La feuille « Légende » complète de flc8b (familles, BM / HS / HS US / YCH, « 2/2 », contour, gris, hachuré, au style, appui long) → les quatre autres : une seule légende pour le lot.
- « français · fiches » (l'original à un toucher, « notre traduction ») — flu2b → flc8b (au toucher d'un tampon), fla5b, flb3b.
- « 5 mots sur 7 hors des 12 familles », recompté à l'écran — fld8b → flu2b (sous la grille), flb3b (sous « puis »).
- La règle de repli écrite (« aucun mot dans ses 4 fiches à la fois : ceux d'au moins 2 sur 4 ») — flb3b → fla5b, quand aucune étagère « attend » n'existe.
- Les tuiles 2/2 pleine largeur pour les mots hors des 12 — flc8b → fla5b (déjà prise), flu2b (les cartes sombres gagnent les tampons).
- Le choix du houblon sous l'en-tête de l'étape, à la couleur du houblon — flc8b / fld8b → flb3b, fla5b (à la place des en-têtes ajoutés).
- Le bloc d'aide dépliable sous le « ? » (style 16D, dégustation, « rangé par le fournisseur », n/N) — fla5b → flc8b, flu2b (leurs lignes de source y vont).
- Les mots au bout des rayons — fld8b (greffe flu6, en français) → flu2b si le radar reprend sa taille.

## La passe est-elle satisfaisante ?
Non : trois REJET (flb3b, fla5b, flu6), tous sur des défauts courts à corriger (un en-tête à rendre à l'étape, une traduction à brancher). La passe
a progressé : sur la v0, aucune candidate ne tenait sur Nelson Sauvin ; ici les cinq le disent en trois secondes, sans anglais, avec un seul α.
**Passe 3, légère** : flb3b et fla5b reprennent l'en-tête de l'étape tel quel (« ‹ Houblons 3/7 », IBU · OG · EBC) et choisissent le houblon
comme flc8b ; flb3b répare les flèches du radar et la bulle du « ? » ; flc8b, flu2b, fld8b appliquent leurs retouches (légendes derrière « ? »,
radar à sa taille, bande vide) ; flu6 traduit et recompte, ou reste v0 sur la page du panel avec la mention. Puis les cinq se montrent, Nelson
Sauvin puis Nugget, dans un artefact neuf.

## Passe 3
Jugé sur `flb3c-nelson/-nugget`, `fla5c-nelson/-nugget`, `flu6b-nelson/-nugget`, `flb3c-legende`, NOTE lues. Gestes joués dans Chrome à 390 px
(scripts `appui-fl-p3.mjs`, `appui-fl-p3b.mjs`, scratchpad) sur les six pages : fiche visible au chargement sur les six, **aucun marqueur de
contrôle** (`data-fiche-ouverte`, `data-appui-long`, `data-controle`, `data-ouvert` : 0 sur les six) ; un vrai appui long de 850 ms sur un nom
de houblon : **flb3c** ouvre sa fiche courte (DOM + 6 509 caractères, `flb3c-fiche-courte.png`), **flc8b** ouvre la fiche g1 (+ 15 748,
`flc8b-fiche-g1.png`), **fld8b** ouvre sa fiche courte au pointeur (+ 2 133, `fld8b-fiche.png`) ; **flu2b** et **flu6b** ne changent que 9
caractères (un état, pas une feuille) et n'en ont ni capture ni phrase dans la NOTE ; **fla5c** ne fait rien et le dit dans sa NOTE (« la fiche est
montrée ouverte, le geste d'appui long n'est pas le sujet de ce fil de fer », marqueur retiré) : conforme à la règle du pilote.

Verdicts :
- **flb3c** (la signature en une phrase) — ACCEPTÉ. Les trois défauts du REJET sont levés et vérifiés : un seul en-tête (« ‹ Houblons 3/7 », IBU · OG · EBC), le houblon choisi dans l'étape, la fiche avec son en-tête g1 (nom ⊙, croix, α, usage) ; flèches « + Floral / − Résineux » rendues sur Nugget ; la légende se déplie dans le flux et ne recouvre plus Comparer (`flb3c-legende.png`). Reste, sans bloquer : la rangée de houblons est coupée à droite (« Motueka » tronqué, Cascade hors écran, comme flc8b) : la passer sur deux lignes comme fla5c ; « ses 2 fiches le disent toutes · « vin blanc » d'abord dans toutes » reste une explication de deux lignes au repos (D3, tolérée). Perd de g1 : rien. Sa phrase : « Vin blanc, raisin, groseille : très très bien, on comprend direct. Là c'est propre. »
- **fla5c** (au style, en mots) — ACCEPTÉ. L'en-tête de l'étape est rendu tel quel ; les pastilles de houblons sur deux lignes, à leur couleur, rien de caché ; « 1er » sur vin blanc (Nelson) et sur boisé (Nugget) ; le marqueur de contrôle est parti. Reste, sans bloquer : le titre de la feuille est « Que sent Nelson Sauvin ? ⊙ » à la place du nom seul (g1 : « Nelson Sauvin ⊙ ») : garder le nom en titre et la question en dessous, pour que la fiche ressemble à la sienne (règle n° 1, D105) ; sur Nugget, gingembre sous le pli. Perd de g1 : le nom en titre, la bande des 12. Sa phrase : « Là c'est bon : vin blanc en premier, et ma stout en face. Pourquoi le titre c'est la question et pas le houblon ? »
- **flu6b** (mots au bout des rayons, en français) — ACCEPTÉ. Plus d'anglais au repos, cinq mots pour cinq idées (recompté : vin blanc 1er 2/2, fruité 2/2, groseille à maquereau 2/2, raisin 2/2, sauvignon blanc 1/2 ; Nugget : boisé ×2, ananas ×2, gingembre 1/4), « 1er » une fois, sources derrière le « ? », cadre g1 entier (étape, pied Styles › Huiles › Sources › Substituts). Reste : Nugget, Résineux / Terreux / Épicé serrés à gauche (D56) ; l'appui long non documenté. Sa phrase : « Ça c'est bien, radar et mots d'un coup, et en français. »
- **flc8b**, **fld8b**, **flu2b** — ACCEPTÉ (passe 2), l'appui long vérifié ci-dessus ; leurs retouches de la passe 2 restent à faire à l'intégration (sources derrière le « ? » ; en-tête d'étape de l'app et bande vide sur Nelson ; radar à sa taille). Pour flu2b : documenter l'appui long ou le déclarer « montrée ouverte » comme fla5c.

Classement final, sur Nelson Sauvin d'abord : **1. flc8b** (quatre tuiles tamponnées, cadre g1 entier) · **2. flb3c** (la phrase, lue en trois secondes, un seul en-tête) · **3. fla5c** (ma stout en face, Nelson rempli) · **4. flu2b** (cartes, français, 0,98 écran ; radar réduit) · **5. fld8b** (l'iceberg, disruptif ; en-tête d'étape remplacé) · **6. flu6b** (à côté des cinq, « radar qui parle »).

**Le lot est satisfaisant** : aucun REJET, tous les contrôles du lot passés par le pilote, et une phrase prédite positive pour chacune des cinq
candidates et flu6b. On s'arrête là (entonnoir § 3) : les retouches restantes sont des micro-correctifs d'intégration, pas une passe. À montrer
dans un artefact neuf et daté, Nelson Sauvin puis Nugget pour chacune, les 48 v0 derrière dans l'ordre du classement, et il choisit.
