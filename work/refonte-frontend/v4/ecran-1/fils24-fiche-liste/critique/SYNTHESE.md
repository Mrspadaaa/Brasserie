# Tri du panel v0 — la liste de la fiche (lot D125, 48 concepts) — critique Fable, 24.10

Étalonnage (voie e1, 24.10) : paires 89 %, classes 73 % ; biais connu : trop clément. Ce classement est une proposition ; le brasseur voit
les 48. Aucun REJET au tri ; les classes « rejette » ci-dessous sont des verdicts prédits, et quand j'hésitais entre « mitigé » et « rejette »
j'ai pris « rejette » et dit pourquoi. Chaque citation du brasseur a été retrouvée dans `SPEC-BRASSEUR.md` ou `DEFAUTS-COURT.md`.

## Niveau du panel
`controle-panel.mjs` sur les 48 `*-premier-ecran.png` : **PANEL OK — remplissage médian 0,64, 1 sous 0,50, ressemblance moyenne 0,86,
0 paire presque identique sur 1128**. Lot 21 (étalon) : 0,62 et 0,88 ; lot 23 (ECHEC) : 0,41 et 0,92. À l'œil : des pages pleines, six
approches reconnaissables, pas de squelette commun (les en-têtes diffèrent même entre séries). Pas de relance de série pour le niveau.
Les exemples du brasseur (g1, la liste p22) : 10 froides sur 48 (21 %), sous le tiers.
Gestes : les 48 `etat.html` chargés dans Chrome à 390 px (script `jouer-fl.mjs`, scratchpad) : 0 erreur de page, 0 débordement, la
bascule « absolu » trouvée et efficace (DOM changé) sur les 48.

## Baseline : à signaler en premier
1. **Série u, les 8 pages : mots anglais au premier plan** (« woody ×2 · resinous », « pineapple », « resiny »), relevés par script. C'est le défaut
   qu'il a entouré sur Cascade le 23.10 (D115 : « mots anglais « woody, resinous » ») et D97 ; le brief l'exigeait. flu3 ajoute « floral ·
   herbal · earthy » du BJCP ; flz5 une citation BJCP en anglais ; flc5 « woody ». Retouche obligatoire avant toute passe.
2. **Série u : un seul houblon capturé (Nugget)**. Nelson Sauvin, le cas de L14, n'y est montré nulle part.
3. **Séries b et c : un sélecteur de houblons dans la fiche** (puces ou onglets), absent de g1 ; flc3 à flc8 perdent aussi le pied g1
   (♡ ⊘ Comparer, Styles › Huiles › Sources › Substituts) et l'étape derrière la feuille.
4. **Trois α pour un même houblon dans le panel** : Nugget 11–14 % (a, c, u : Hopsteiner 2025, comme g1) contre 9,5–16 % (d, z : Beer Maverick)
   ; Cascade 4,5–9 / 4,5–7 ; Motueka 6,5–8,5 / 5–8,5 ; Nelson 12–14 / 10–14 (b : ni l'un ni l'autre). Police mono pour l'α en b, c, d.
5. Radars : fla2 repeint les secteurs en 7 teintes, la série b pose trois secteurs colorés au style (mon biais : je les note en défaut, D77) ;
   la zone 16D en pointillé gris de la série z fait le même travail avec une seule teinte.

## Classement
Format : rang. **id** (série, chaleur) — classe prédite — raison — ce qu'il perd de g1.
1. **fla5** (a, tiède) — aime — « 4 mots que ta stout attend · 2 déjà trop marqués chez toi » : la seule qui lit les mots face à SA stout et SA dégustation ; au style par défaut (D75) — perd : le radar étiqueté (vignette), la bande des 12 ; vide sur Nelson Sauvin.
2. **flu2** (u, froide) — aime — cartes pleines à la couleur de la famille, dense, au doigt, 3 secondes ; « Tu t'es trop limité, m'eme au niveau des couleurs » n'est plus vrai — perd : rien de g1 (radar, α, pied) ; anglais à traduire.
3. **flc8** (c, chaude) — aime — l'accord des fiches en tuiles tamponnées BM 2023 · HS 2025 ; Nelson : 4 tuiles pleine largeur — perd : le pied g1, l'étape derrière, les étiquettes du radar (petit).
4. **flb3** (b, tiède) — aime — « Vin blanc, raisin, groseille à maquereau. » : la signature en une phrase, lue en 3 secondes — perd : la liste des familles (réduite à « le radar dit aussi ») ; sélecteur dans la fiche.
5. **fld8** (d, chaude) — aime — l'iceberg : on comprend en une image pourquoi le radar sous-dit Nelson ; il a demandé « créatif, disrutif » — perd : la liste des familles ; eau bleu pâle hors thème (D106).
6. **flu6** (u, chaude) — aime — les mots au bout des rayons du radar g1 entier, tout au premier écran, pied g1 complet — perd : la liste sous le radar (D115, écart assumé) ; anglais.
7. **fla4** (a, tiède) — aime — rubans des mots aux familles, « la manière dont sont disposés les choses j'aime beaucoup » (l8) — perd : radar en vignette ; bas vide sur Nelson.
8. **fla1** (a, froide) — aime — g1 avec le mot en tête, la famille après, les fiches en points ; « 1er » une fois — perd : la bande des 12 ; radar un peu réduit.
9. **flb5** (b, tiède) — aime avec réserve — « Lui seul dit vin blanc, raisin… » face à 4 remplaçants : la preuve par contraste — perd : un seul facteur (D98 : 4 houblons de plus, territoire de Substituer).
10. **flz4** (z, chaude) — aime — « citron vert · rare · 3 sur 32 · aussi Citra cryo, Motueka » : situer un mot par des houblons connus — perd : les familles comme axe ; paragraphe en tête (D3).
11. **flz5** (z, chaude) — aime — « À sa place dans ta 16D / Ressort / Sans famille » : même idée que fla5, étagères plus nettes, citation BJCP (en anglais) — perd : rien de g1 ; doublon de fla5.
12. **flb1** (b, froide) — aime — g1 + cadre « SIGNE » — perd : rien ; la signature sous le pli.
13. **fld5** (d, tiède) — aime — le radar devient la carte, mots au bout des pointes, « Hors carte » — perd : rayon du radar (78 px) ; bas vide.
14. **flc1** (c, froide) — aime — g1, chaque mot tamponné de sa fiche, « 4 fiches lues » — perd : rien ; dense (D73 guette).
15. **flc2** (c, froide) — aime — par accord : « Les 2 fiches le disent » en cadre noir — perd : la famille comme axe ; sélecteur dans la fiche.
16. **fld1** (d, froide) — aime sans élan — g1 corrigé de ses quatre défauts, « Que sent-il ? » — perd : rien ; « une copie déçoit » (L07).
17. **flu1** (u, froide) — aime sans élan — g1 resserré, une ligne par famille, crans — perd : rien ; anglais.
18. **flb7** (b, chaude) — mitigé-aime — pyramide sommet / cœur / fond — perd : la liste des familles ; légende au repos (D89).
19. **flc6** (c, chaude) — mitigé-aime — flux fiches → mots → familles, « 2 mots sur 7 dans le radar » — perd : pied g1, étape ; rubans gris lourds.
20. **fla7** (a, chaude) — mitigé-aime — le cône, bractées à la couleur des familles : objet reconnaissable — perd : radar en vignette ; une page pour 9 mots.
21. **flu7** (u, chaude) — mitigé-aime — mouillettes trempées, longueur = fiches — perd : étiquettes du radar (D115) ; anglais.
22. **fld7** (d, chaude) — mitigé-aime — la cible au style, la seule où « au style » change la forme — perd : la liste ; gros anneau sombre (D82), plus d'un écran (D5).
23. **flc7** (c, chaude) — mitigé-aime — « pas d'autre fiche lue · une seule voix : à confirmer » : honnête — perd : pied g1, étape ; carte penchée « gadget ».
24. **flu4** (u, tiède) — mitigé-aime — quatre tuiles, « ce que le radar ne dessine pas », désaccords entre fiches — perd : rien ; moitié sous le pli ; anglais.
25. **fld2** (d, froide) — mitigé-aime — barre des mots par famille + puces — perd : la bande des 12 (remplacée) ; deux lectures de la même part.
26. **fld3** (d, tiède) — mitigé-aime — nuage, vin blanc en très gros — perd : la liste ; nuage noir, place sans sens.
27. **flz1** (z, chaude) — mitigé-aime — « hors du dessin » en grand — perd : radar réduit ; aplat bleu (D106), compteurs de méthode, phrase explicative (D3).
28. **flb2** (b, froide) — mitigé — rareté « chez /318 » : vraie valeur, barre à apprendre — perd : rien ; chiffres sans titre.
29. **fla3** (a, tiède) — mitigé — les mots en très grand (Georgia) : « plus d'information utile bat plus de vide » joue contre — perd : radar en timbre sans étiquette, familles, 45 % vide.
30. **flb6** (b, chaude) — mitigé — carte d'identité : thiols, sosie ; mais linalol nu (lot 20) et deux radars — perd : le radar étiqueté en « photo » ; « Ça c'est inutile » pour la bande machine.
31. **flz3** (z, chaude) — mitigé — « à toi de ranger » : geste malin, « ~ toi » honnête — perd : la liste ; demande un travail avant de lire ; phrases au repos.
32. **fla8** (a, chaude) — mitigé — touches ; le geste (un mot allume son rayon, nomme la fiche) est bon — perd : rien ; « c'est quoi ces gors bloque ? » (D82).
33. **flz6** (z, chaude) — mitigé — loupe sur l'axe, qu'il aime sur le rail ; mais « un écran qui demande un toucher pour voir l'essentiel perd » ; sur `flz6-tropicaux.png` la loupe cache les étiquettes Résineux et Agrumes — perd : la liste.
34. **fla6** (a, chaude) — mitigé — roue des mots, gris dominant — perd : rien ; légende au repos, bas vide.
35. **flu5** (u, tiède) — mitigé — précis / vague : règle à nous ; « pineapple » et « ananas » côte à côte — perd : rien ; anglais.
36. **fla2** (a, « froide ») — mitigé — mots au bout des rayons, mais radar repeint en 7 teintes et 40 % vide — perd : le radar g1 (froide qui change le radar).
37. **flc4** (c, tiède) — mitigé — fermeture éclair : fils qui se croisent, « ça bouge à l'œil » ; l'idée du milieu est bonne — perd : pied g1, étape.
38. **flb8** (b, chaude) — mitigé — orbite : la place ne veut rien dire, phrase explicative — perd : la liste ; vide.
39. **flb4** (b, tiède) — rejette — échelle logarithmique non dite, chiffres de méthode ; « aussi chez » est la partie utile — perd : la liste.
40. **flu3** (u, tiède) — rejette — BJCP en anglais au premier plan (D97), bloc hachuré sombre (D82) — perd : rien de g1.
41. **fld4** (d, tiède) — rejette — échelle à barreaux, case sombre vide « — » (D82) — perd : la liste ; dépasse l'écran à 4 fiches.
42. **fld6** (d, chaude) — rejette — éventail, texte en rayon à pencher la tête — perd : la liste.
43. **flz2** (z, chaude) — rejette — second radar à 6 axes lu comme une force (« Il y a pas 12 radar ? », D65) ; légende au repos — perd : le radar g1 en grand.
44. **flc5** (c, tiède) — rejette — fiches brutes surlignées : « énormément d'information pour rien » ; radar sans étiquette — perd : pied g1, étape, étiquettes.
45. **flz7** (z, chaude) — rejette — escalier dont la 9ᵉ marche a la plus grande barre : la forme contredit « pas d'intensité, un ordre » — perd : la liste ; compteurs de méthode.
46. **flc3** (c, tiède) — rejette — table de cases : « Inutile » (la table des moments de g1) ; moitié vide — perd : pied g1, étape.
47. **flz8** (z, chaude) — rejette — « 12 mots bruts → 8 idées » : la cuisine interne au premier plan ; la phrase-bilan du bas est bonne — perd : la liste.
48. **flu8** (u, chaude) — rejette — entrée de dictionnaire : « Attention, trop de texte » (D73), pas moderne — perd : rien de g1 ; anglais.

## Candidates
Cinq, une par série (cinq séries sur six), trois chaleurs : froide (flu2), tiède (fla5, flb3), chaude (flc8, fld8). flz5 fusionne dans fla5.

1. **fla5 — au style, en mots** (a, tiède). Retouches : (1) sur Nelson Sauvin (0 / 0), remplir le premier écran avec les mots hors des 12 en grand
   dès la première étagère, remplissage ≥ 0,80 (D4) sur `fla5-nelson-sauvin` ; (2) le radar g1 à sa taille et étiqueté (D115), la bande des 12
   reprise ; (3) intitulés d'étagère en trois mots (« Ta stout attend », « Déjà trop marqué », « Toléré », « Hors des 12 »), les mentions
   « ta dégustation 18.10 », « zone basse » et la citation BJCP (greffe flz5, traduite) derrière le « ? » (D89).
2. **flu2 — cartes de famille** (u, froide). Retouches : (1) traduire woody, resinous, pineapple, resiny (D97) ; (2) un état Nelson Sauvin
   capturé : les mots hors des 12 en carte pleine (noire ou grise) au même rang qu'une famille, rangée par fiches (L14) ; (3) « attendu en
   stout » en liseré de carte plutôt qu'en étiquette, cartes rangées par fiches puis par 16D, tout dans 1,05 écran (D5).
3. **flc8 — tuiles tamponnées** (c, chaude). Retouches : (1) police du thème pour l'α, « α 11–14 % lot 13 % » comme g1, sélecteur de houblons
   sorti de la fiche, pied g1 et étape derrière la feuille rétablis ; (2) les tuiles « personne » repliées en une ligne de pictos « ? » (D48 bis)
   pour rendre six cases ; (3) radar g1 à sa taille avec ses étiquettes au-dessus des tuiles (D115).
4. **flb3 — la signature en une phrase** (b, tiède). Retouches : (1) sous la phrase, la liste des autres mots en pastilles de famille (fla1 /
   flc2) pour remplir le tiers vide (D4) ; (2) le sélecteur de houblons sorti de la fiche, α en police du thème avec la plage de g1 ;
   (3) « Lui seul dit … » (flb5) et « aussi chez Hallertau Blanc, Ariana » (flb4, flz4) en une ligne chacune, à un toucher.
5. **fld8 — l'iceberg** (d, chaude). Retouches : (1) l'eau et la coque mesurées par `controle-teinte` (D106) : eau dans les gris du thème, coque
   plus claire ; (2) états Nugget et Cascade capturés (petite coque « gingembre », « 0 % ») pour vérifier que la forme tient quand presque tout
   émerge ; (3) à la surface, les mots des familles au bout des rayons (greffe flu6 / fld5) pour que le haut porte aussi la liste.

## Greffes
Idée — origine → candidate(s).
- « 1er » en pastille, une seule fois sur le mot — fla1, flb1 → toutes.
- Tampons de fiche BM 2023 · HS 2025 sur chaque mot — flc1, flc8 → flu2 (en petit dans la carte), flb3.
- « aussi chez Hallertau Blanc, Ariana, Marco Polo » et « rare · 3 sur 32 » — flb4, flz4 → flb3, flc8 (au toucher d'une tuile).
- « Lui seul dit vin blanc, raisin, groseille à maquereau » en une ligne — flb5 → flb3 ; la matrice entière, à proposer au lot Substituer.
- « 2 mots sur 7 dans le radar · 5 restent dehors » / « 83 % de ses mots hors des 12 » — flc6, fld3, fld8 → flu2, fla5.
- Citation BJCP 2021 (traduite) derrière le « ? » — flz5 → fla5.
- Étagère « Ressort dans ta 16D » (le style n'en parle pas) — flz5 → fla5.
- La zone 16D en pointillé gris sur le radar, une seule teinte — série z → toutes (à la place des secteurs colorés de b et fla2).
- Toucher un mot : son rayon s'allume et la fiche qui l'écrit s'affiche — fla8 → flc8, flu2.
- La loupe sur l'axe, façon rail — flz6 → flu6 (relance) : toucher une étiquette du radar lit ses mots, sans cacher l'étiquette voisine.
- « À toi de ranger » (un mot hors des 12 posé sur une famille, rayon « ~ toi » en pointillé) — flz3 → fld8, à un toucher sur un mot sous l'eau.
- « Sosie : Hallertau Blanc » — flb6 → flb3.
- « pas d'autre fiche lue · une seule voix : à confirmer » — flc7 → toutes (Citra cryo, 1 fiche).
- La phrase-bilan générée (« Agrumes, surtout · un peu de tropical et de floral · mojito ») — flz8, fla3 → fla5 (vue absolu), flb3.
- Longueur trempée = fiches (mouillettes) / crans en ligne — flu7, flu1 → flu2 (une barre de crans par carte).
- Les désaccords entre fiches (résineux : boutique US oui, fiche variété non) — flu4 → flc8 (au toucher du tampon).
- La cible au style (centre = attendu au 16D) — fld7 → fla5 : une bascule « étagères / cible » à un toucher, si la passe 2 a la place.
- La barre des mots par famille sous la bande des 12 — fld2 → flu2.

## Retouches communes au lot
1. Tout mot en français au repos (D97, D115) : série u (8), flc5, flu3, flz5 ; l'original anglais seulement à un toucher ou en petit sous le mot (flc3 le fait).
2. Un seul α par houblon : la plage de g1 (Hopsteiner 2025) avec le lot, ou la source nommée comme flc1 ; police du thème (b, c, d).
3. Le sélecteur de houblons hors de la fiche (b, c, dock de flb7) : la fiche s'ouvre par l'appui long sur une carte (D25, D49) ; le pied g1 et l'étape derrière la feuille (flc3–flc8).
4. Le radar avant, à sa taille et étiqueté (D115) : pas de vignette (fla3, fla4, fla5, fla7, flu7, flz1) ; une seule teinte de zone au style.
5. Le premier écran rempli aussi sur Nelson Sauvin (D4 ≥ 0,80) : fla2, fla3, fla5, fla6, flb8, fld5 ; chaque candidate capturée sur les 5 houblons, Nelson Sauvin et Nugget d'abord (L14).
6. Légendes et explications derrière « ? » (D89, D1, D3) : fla6, flb7, flb8, flz1, flz2, flz3, flz6, flz4 (paragraphe), fla4/fla7 (3 lignes à côté du radar).
7. Compteurs de méthode (fiches lues, idées, familles jamais décrites) hors du premier plan : flz1, flz7.
8. Blocs sombres vides ou pleine largeur (D82) : fld4, fld7, fla8, flu3 ; thème blanc mesuré (D106) : flz1, flz2, flz7, fld8.

## Relances ciblées
- **flu6** (mots au bout des rayons) — nouvel agent : en français, testé sur Nugget (12 mots) et Nelson Sauvin ; si les étiquettes se chevauchent (D56), 3 mots + « +n » par rayon ; loupe flz6 au toucher d'une étiquette, sans masquer la voisine.
- **flb5** (matrice face aux remplaçants) — pas de relance ici : à verser au lot Substituer (#145) comme preuve « lui seul dit ».
- **fld7** (cible au style) — relance légère seulement si fla5 veut une seconde vue au style : anneau clair, demi-hauteur.

## Fusions
- fla5 + flz5 : fla5 garde ses trois étagères et sa dégustation ; prend de flz5 le mot « Ressort » et la citation BJCP traduite derrière « ? ».
- flu6 + fld5 + fla2 : une seule « radar qui parle » (relance flu6) : radar g1 à sa taille, mots au bout des pointes, pas de secteurs colorés, « hors des 12 » en bloc sous le radar.
- flb1 + flb3 : si le pilote veut une froide de la série b, le cadre SIGNE de flb1 reçoit la phrase de flb3.

## Gestes et ce qu'ils cachent
- flz6 (`flz6-tropicaux.png`, premier écran) : la loupe recouvre les étiquettes Résineux et Agrumes du radar, et le centre « mojito » reste sous elle : la figure perd sa lecture sous le geste. Défaut majeur pour cette forme ; à corriger dans la greffe (loupe décalée hors du radar, comme sur le rail).
- fla8 (`fla8-geste-famille`, `fla8-geste-hors`) : la ligne de source s'affiche au-dessus des touches, sans rien cacher ; le pointillé « hors du dessin » entoure le radar, lisible.
- flz3 (`flz3-range.png`) : le jeton rangé prend la couleur de la famille et le rayon « ~ toi » apparaît en pointillé ; le bloc noir des 12 familles reste, lourd.
- fla5 / flu2 / flu6 (absolu) : la bascule change la liste sans toucher au radar ni à l'en-tête ; rien n'est caché.
