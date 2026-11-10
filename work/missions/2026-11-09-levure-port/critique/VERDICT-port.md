OK — 24 problèmes, 9 bloquants

# Verdict du port Levure (voie t1) — l'app servie contre les maquettes choisies l5b, c6b, s5a, s7a

Version : dd39fe8e (arbre de travail non commité, 458 fichiers modifiés ; les vues jugées sont celles de u1 et u2 telles que servies le 09.11).
Serveur : `npx vite --port 5660` (VITE_HOP_V4=on), banc `?dev-local&etape=levure` (US-05, OG 1,066, 30 L, 19 °C, 4 paliers).
Captures : `critique/captures/` (88 : 22 états × 390 tactile / 1280 × clair / cave, 0 erreur de page, aucun réseau hors localhost ; `journal*.json` : le texte de chaque état). Côte à côte avec la maquette : `critique/montages/<état>.png` (21). Script : `capturer-port.mjs`, `montage.mjs`. Toutes ouvertes.
Thème : la clé `laffinee.theme` de `src/theme/theme.ts`, celle que pose le bouton de l'app.

Règle de lecture : un problème est compté une fois par vue, même s'il se voit aux quatre formats ; « 390 seul » quand il n'apparaît qu'au téléphone. Bloquant : geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible (D342 à D344). Clair et cave : mêmes défauts partout, le thème cave est propre (contrastes, pastilles, jauges, FAB).

## Table

| capture (état) | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| l1-repos | clair = cave | 390 · 1280 | Ma levure au repos (l5b c1) | 3 (L4, L5, L6) + L7 à 390 | 0 |
| l2-palier2-touche | clair = cave | 390 · 1280 | palier 2 touché, son × (l5b c4) | 1 (L5) | 0 |
| l3-croix | clair = cave | 390 · 1280 | × touché : 3 paliers, fin J9, « Annuler » (l5b c5) | 0 | 0 |
| l4-plus-entre | clair = cave | 390 · 1280 | « + » entre les paliers 2 et 3 (l5b c6) | 1 (L1) | 1 |
| l5-plus-fin | clair = cave | 390 · 1280 | « + » sur la fin J12 (l5b c6) | 1 (L2) | 1 |
| l6-loupe | clair = cave | 390 · 1280 | « ⌕ » de la floculation (l5b « se touche pour chercher ») | 1 (L3) | 1 |
| m1c-pied-malevure-bas | clair = cave | 390 seul | pied au bas de Ma levure, une levure dans Comparer | 1 (L7) | 0 |
| c1-1056 | clair = cave | 390 · 1280 | « 1056 » tapé (c6b c1) | 2 (C1, C2) | 1 |
| c2-feuille | clair = cave | 390 · 1280 | feuille des filtres sur Tolérance (c6b c2) | 1 (C1 : trait 7 %, bascule ≥ 7 %, ○ repère absents) | 0 (déjà compté en C1) |
| c3-feuille-3filtres | clair = cave | 390 · 1280 | feuille, 3 filtres posés : famille, °C, sans STA1 | 0 | 0 |
| c3-3filtres | clair = cave | 390 · 1280 | phrase noire, 58, rayons, 4 lignes « STA1 ? » (c6b c3) | 2 (C3 à 390, C4) | 0 |
| m1-repos | clair = cave | 390 · 1280 | Comparer, référence seule, ⊕ (s5a c1 / c3) | 0 | 0 |
| m1-plus-feuille | clair = cave | 390 · 1280 | ⊕ touché : feuille « Ajouter à Comparer » | 0 | 0 |
| m1-feuille-tape-verdant | clair = cave | 390 · 1280 | « Verdant » tapé dans la feuille | 1 (M1) | 1 |
| m1-verdant-ajoute | clair = cave | 390 · 1280 | Verdant ajoutée, 2 colonnes (s5a c1) | 1 (M3) | 1 |
| m2-trois-colonnes | clair = cave | 390 · 1280 | US-05 · Verdant · 1056 (s5a c1) | 2 (M3, M5) | 1 (M3, déjà compté) |
| m2-croix | clair = cave | 390 · 1280 | × de Verdant : 2 colonnes, ⊕ revient (s5a c3) | 1 (M2, 390 seul) | 1 |
| m3-loupe | clair = cave | 390 · 1280 | « ⌕ » des phénols US-05 (s5a c2) | 1 (M4) | 1 |
| s1-repos | clair = cave | 390 · 1280 | Suggérer au repos, 12 cartes (s7a c1) | 2 (S1, S6) | 1 |
| s2-moins-attenuation | clair = cave | 390 · 1280 | « − » atténuation (s7a c2) | 2 (S5, S7) | 0 |
| s3-deux-axes | clair = cave | 390 · 1280 | « + » thiols puis « + » clarté (s7a c3) | 2 (S2, S3) | 0 |

Total : 24 problèmes distincts (L1 à L7, C1 à C5, M1 à M6, S1 à S6), 9 bloquants (L1, L2, L3, C1, M1, M2, M3, M4, S1).

## Ma levure (l5b) — « combien et quels problèmes ? » : 7, dont 3 bloquants

1. **L1 · bloquant** — « + » entre deux paliers (l4) : le palier neuf n'est pas dessiné et tout ce qui suit disparaît du graphe (fin J7, plus de 4 °C), remplacé par trois cartes de texte « Palier 3 · Garde / début J7, fin inconnue / durée inconnue · position non calculable » et un paragraphe « Calendrier partiel : les températures inconnues ne sont pas dessinées… ». Sa maquette (l5b cadre 6) garde les paliers à leur place et pose le neuf en boîte pointillée « ? °C · ? j ». Il dirait : « je touche + et mon graphe disparaît ??? ». Règles : L03 (sa maquette telle quelle), D1 et D3 (de l'explication au premier plan au lieu d'actionnable). À changer : dessiner le palier neuf comme une colonne pointillée « ? °C · ? j » à l'endroit touché, en gardant les paliers suivants dessinés avec leurs durées connues ; supprimer les trois cartes et le paragraphe ; ne pas inférer de nom (« Garde ») — la maquette ne dit rien.
2. **L2 · bloquant** — « + » sur la fin (l5) : le palier neuf est un point noir à 0 °C sur J12, lu comme 0 °C ; sa boîte « ? °C · ? j » manque, et trois lignes d'explication s'ajoutent (« Calendrier partiel… », « Programme à compléter… une valeur vide reste inconnue, jamais 0 »). L'inconnu dessiné à zéro : D14, D65 (« l'inconnu n'est jamais 0 »). À changer : pas de point sur l'axe ; une colonne pointillée après J12 avec « ? °C · ? j », « fin ? » (l5b cadre 6) ; une seule phrase, ou aucune.
3. **L3 · bloquant** — « ⌕ » d'une donnée (l6, floculation « à chercher » ; idem « non documenté ») : rien n'est cherché ; l'écran déroule vers un encadré de quatre lignes (« Donnée cherchée : floculation · SafAle US-05 (Fermentis). Ouvre la recherche avec l'IA dans la fiche ou l'atelier ci-dessous : elle ne se lance qu'à ton toucher… ») et ouvre le repli « Fiche » : un paragraphe, un picto IA seul sur sa ligne au-dessus de « Rechercher la fiche avec l'IA », puis des rangées collées sans espace « Température de fermentation18–26 °CplageFabricant · SafAle US-05™ · 08.09.2026Corriger » (illisible, 390 et 1280). Sa maquette : « ⌕ non documenté, qui se touche pour chercher » ; s5a cadre 2 : « recherche… · 3/20 » dans la cellule. Il dirait : « je touche chercher, ça cherche pas, ça m'explique ». Règles : L03, D1, D3. À changer : le toucher du « ⌕ » lance la recherche IA de cette donnée (un geste explicite, donc pas d'appel caché) et la ligne dit « recherche… » puis la valeur sourcée ou « introuvable » ; le repli Fiche se répare (picto et libellé sur une ligne, rangées en colonnes).
4. **L4** — Sous « Changer de levure », une seule puce « Hors catalogue » ; sa maquette en a trois (« Nottingham » proposée, « ↺ SafAle S-04 » précédente, « Hors catalogue »). Le banc n'a ni stock ni levure précédente, et les propositions de d1 ne sont pas branchées (RESULTAT u1). À changer : 2 à 3 levures proposées vendues en CH · FR · DE (API de d1), la précédente quand il y en a une.
5. **L5** — La plage de la levure : un bloc gris sur le premier palier seulement (J0–J4, « plage levure 18–26 °C » lisible à 1280), alors que la légende dit « ▭ US-05 · 18–26 °C » en pointillé ocre et que sa maquette tire deux pointillés 18 et 26 sur toute la conduite. Ses mots (09.11) : « la plage de la levure sur ta conduite : ça c'est parfait ». À changer : la bande 18–26 pointillée sur toute la largeur, même trait que la légende.
6. **L6** — Ligne « sèche · 15–24 g » sans le fabricant (maquette : « sèche · Fermentis · 15–24 g »). À changer : ajouter le fabricant.
7. **L7 · 390 seul** — Le pied « Retour · Comparer (1) · Suivant — Paliers » n'est visible qu'au bas du défilement (à l'ouverture il est à 1 330 px pour un écran de 844) et, une fois là, le « + » flottant recouvre le bord droit de « Suivant — Paliers ». À 1280 le pied est fixe et visible. Sa maquette : pied en bas de l'écran, le + à sa droite. À changer : pied collant au bas à 390, le FAB posé au-dessus de lui, sans chevauchement.

Doutes (non comptés) : l'étiquette « J7 » de l'axe descend sous les autres (J0 J4 … J9) ; le palier touché au repos (palier 1) porte déjà son × comme dans la maquette, mais le ↕ et le × se superposent presque au premier palier à 390.

## Chercher (c6b) — 5, dont 1 bloquant

1. **C1 · bloquant** — Le repère « 7 % · ta bière » n'existe nulle part : résumé « bière · repères 19 °C · proche de 1056 » (maquette : « repères 19 °C · 7 % »), histogramme Tolérance sans le trait rouge « ≈ 7 % · ta bière », bascule « ne garder que ≥ 7 % » absente, pas de ○ repère sur « Tolérance » dans l'index. Cause lue : `abvVise = recipe.abvTarget` (EtapeLevure.tsx:119), rarement saisi, alors que Ma levure affiche déjà « ≈ 6,9–7,2 % vol » calculé de l'OG et de l'atténuation. Élément de sa maquette absent (L03) et la question du brasseur (« ma levure tient-elle mon alcool ? ») reste sans repère. À changer : repère = alcool estimé quand la cible n'est pas saisie ; le trait rouge et la bascule reviennent.
2. **C2** — Carte « Wyeast 1056 American Ale » : « liquide · NL · 27.09 · stock ? » absents ; effets « neutre · houblon ? · épicé ? » là où la maquette dit « très propre · fruité faible · esters légers · épicé ? ». La forme (badge, pistes °C et atténuation, fantôme bleu, trait rouge 19) tient. À changer : forme (liquide/sèche) et date de la fiche sous le nom ; les descripteurs d'esters de la fiche en pastilles (d1).
3. **C3 · 390 seul** — Titre du rayon « Vendue CH · FR · DE · à vérifier » sur deux lignes, le compte « 4 » flotte entre le titre et l'axe « 10 19 30 65 % 90 » ; même chose pour « Fabricant présent en Europe 13 ». À changer : titre court (« Vendue CH · FR · DE », « à vérifier » en badge), compte collé au titre.
4. **C4** — Les quatre lignes « STA1 ? » (Pomona, Verdant, US-05, 1007) ne sont pas pâles (maquette : « une ligne pâle chacune ») et 1007 n'a pas « épuisée 27.09 ». À changer : opacité réduite ; champ « épuisée + date » quand la disponibilité le sait.
5. **C5** — Index : « Laboratoire ⌕ 1 » (une fiche bière sans laboratoire ?), « Disponibilité » et « En stock » sans compte ni état. À changer : « — » ou « estimé » comme les autres ; vérifier le compte.

Doutes : les comptes diffèrent de la maquette (1 308 / 1 339 ; 4 · 57 · 262 · 327 / 4 · 57 · 263 · 346) — données d1, pas un défaut de vue ; 1056 « fabricant présent en Europe » là où la maquette disait « rare » (d1 a changé le rang, voulu).

## Comparer (s5a) — 6, dont 4 bloquants

1. **M1 · bloquant** — ⊕ puis taper « Verdant » dans « Ajouter à Comparer » : Verdant IPA disparaît de la liste (Pomona, 1084, NovaLager, 1007, Yeastflow…) ; idem « 1056 ». La levure tapée est rendue par l'API comme `tapee`, et la feuille ne la dessine pas (Comparer.tsx, `Ajouter`, `api.chercher(q).liste`). Geste sans effet : on ne peut pas ajouter la levure qu'on nomme. Il dirait : « je tape Verdant et Verdant est pas là ??? ». À changer : `tapee` en tête de la liste, puis les proches.
2. **M2 · bloquant, 390 seul** — Ligne « Dose » : « 2–3 sachets » et « à renseigner » s'impriment l'un sur l'autre (m2-croix 390, US-05 · 1056) : illisible. À changer : la cellule Dose en deux lignes ou taille réduite ; jamais de débordement entre colonnes.
3. **M3 · bloquant** — Esters de LalBrew Verdant IPA sourcés « Escarpment Labs · fiche » (Verdant IPA est de Lallemand ; Escarpment Labs est une autre maison, « Escarpment Labs American Ale » figure au rayon « Rare en Europe »). Source fausse sous une valeur : son critère n° 4 (« vraies valeurs », D65). À changer : la source de l'effet est celle de la fiche de la levure ; vérifier `valeurAxe` / la jointure des descripteurs.
4. **M4 · bloquant** — « ⌕ » sur une cellule (phénols US-05) : quitte Comparer pour Ma levure (data-vue = ma-levure) et ouvre le repli Fiche décrit en L3, sans chercher ; sa maquette (cadre 2) : « recherche… · 3/20 » dans la cellule, Comparer reste à l'écran. Même cause que L3. À changer : recherche lancée depuis la cellule, état « recherche… » sur place, Comparer gardé.
5. **M5** — En-tête « 1056 American Ale » sur trois lignes à 390 (maquette : « 1056 » puis « Wyeast » dessous) ; Verdant « Lallemand Bre… » tronqué. À changer : nom court (code) en titre, fabricant en sous-titre.
6. **M6** — Phénols US-05 « non déclarés » alors que US-05 est POF− (DÉCISION À PRENDRE de u1, encore ouverte chez d1) ; 1056 floculation « moyenne » (maquette : « faible–moy. »). Données, à trancher par d1 ; comptées une fois comme valeur à vérifier.

Doutes : « Comparer (1) » apparaît aussi dans le segment d'onglets (pas dans la maquette, utile) ; le cas « 19 hors » (W-34/70) n'a pas pu être rejoué — W-34/70 du catalogue n'a pas de plage °C (RESULTAT u2), à rejouer sur une levure lager à plage connue (Diamond 10–15 °C).

## Suggérer (s7a) — 6, dont 1 bloquant

1. **S1 · bloquant** — Au repos, la liste « Vendue CH · FR · DE 5 » commence par 1007 German Ale ; sa maquette (cadre 1) ouvre sur « US-05 · ta levure · la référence », puis Verdant, Pomona. La référence manque, et avec elle le point de comparaison des pistes °C et %. Élément de sa maquette absent (L03). À changer : US-05 en première ligne, « ta levure · la référence », ⊕ grisé.
2. **S2** — « + thiols » : le levier °C est une phrase (« levier : °C : plus chaud, dans la fenêtre de la levure » + boîte « 3SH +33 à +72 % de 15 à 30 °C, Samia 2026 ») ; sa maquette (cadre 3) dessine la piste 15–30 °C avec le repère 19 et la bande qui monte. L'information y est, le dessin non. À changer : la piste °C avec le 19 et la zone « plus chaud » (RESULTAT u2 : l'API ne rend qu'une phrase — ajouter bornes et sens au contrat).
3. **S3** — Diamond (lager, 10–15 °C) proposée pour « plus de thiols · plus clair » sans « 10–15 °C · 19 hors plage · perçu faible · soufre » (maquette cadre 3) : en brasseur, une lager à 19 °C sans alerte. À changer : sur chaque ligne de Suggérer, l'écart de la conduite à la plage de la levure, en rouge quand elle sort (comme Comparer « 19 hors »).
4. **S4** — « + thiols · + clair » : aucune vendue ici (maquette : Verdant thiols élevés · floculation moyenne, Pomona, US-05 « ⌕ thiols ? ⌕ floculation ? »). Avec US-05 muette sur les deux axes, l'app exige un niveau élevé ; la maquette gardait les vendues ici documentées et montrait leur niveau. À changer : quand la référence est muette, garder les vendues ici documentées sur l'axe, triées par niveau, et la référence avec ses « ⌕ ? ».
5. **S5** — Carte ouverte : « levier : empâtage → Malts/sucres » dans l'en-tête et, dessous, une boîte « Levier · atténuation — l'atténuation dépend de l'empâtage » : doublon (D1). À changer : garder l'en-tête, la boîte seulement quand elle apporte une preuve (cadre 3 : Samia 2026).
6. **S6** — En-tête « US-05 · Je veux… · 19 °C » sans « 30 L » (maquette : « 30 L · 19 °C ») ; 1007 sans « épuisée 27.09 ». À changer : volume dans l'en-tête ; champ « épuisée » (voir C4).

Doutes : les comptes (−75 / +307 ; −492 / +124) diffèrent de la maquette — ce sont ceux de d1 sur le catalogue réel, pas un défaut de vue ; « − 0 » et « + 0 » grisés, conformes.

## Ce qui tient, pour mémoire (pas des problèmes)
Ma levure : la carte (nom, sachets 2–3 et jauge hachurée, FG + alcool, fiche · conduite avec le 19 sur le dégradé, floculation « à chercher »), les effets en jauges et « ⌕ non documenté », la conduite avec un « + » par frontière et le × du palier touché, le retrait (3 paliers, fin J9, « Annuler »). Chercher : le résumé d'une ligne, les puces, la carte tapée avec fantôme bleu et trait rouge 19, US-05 en tête, la feuille à index des 18 filtres avec légende et « ⌕ n », l'histogramme, la phrase noire retirable, la barre des rayons, la bande « STA1 non documentée 80 · dont 4 vendues ici ». Comparer : les colonnes, référence teintée, effets en tête, pistes sur axe commun, ⇄ ×, trois colonnes à 390, « Comparer (n) » au pied. Suggérer : les 12 cartes − / + groupées, la carte qui s'ouvre en grand, « + un 2ᵉ axe », « Effacer », pistes au repos, jauges des deux axes par ligne, Nutriments replié. Thème cave : propre partout.
