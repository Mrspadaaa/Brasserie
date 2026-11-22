OK — tri : r2, r3, u4

# Tri du lot v0 « Levure 4/7 » (critique calibré, 09.11)

Vu : les 12 premiers écrans à 390, les 12 vues 1280, et 13 états ou gestes (r1 à r4 geste-après, z2 hors catalogue, z3 vide et sachet,
z4 liquide, u1 dose, u2 changer et liquide, u3 Voss, u4 Voss). Baseline : `inventaire/captures/levure-choisie-390.png` (dossier d'achat :
« Brouillon », Paliers, offres et prix avant la levure, pas de dose). Sa langue : p6-b2 / s1. Registre des choix : `levure` est **ouvert**, aucune
maquette choisie à comparer (D105 ne s'applique pas ; la règle n° 1 porte ici sur le chrome de s1, repris par les 12).

## Niveau du panel : relancer le remplissage, pas les idées
`controle-panel.mjs` sur les 12 premiers écrans : **PANEL ECHEC**. Remplissage médian 0,52 (lot 21 : 0,62 ; plancher 0,55), **6 sur 12 sous
0,50** : z1 0,27, z4 0,36, z2 0,43, u1 0,46, u4 0,48, r2 0,49. Ressemblance 0,89 (limite 0,90) ; 7 paires presque identiques sur 66, toutes
par le bas d'écran vide de la série z (même chrome, rien sous les liens). Ce qui manque : la moitié basse des z et de u1, u4. Les idées, elles,
sont là et diverses (12 formes distinctes, 0 paire identique entre séries) : un classement a un sens, mais la passe 2 remplit d'abord.
Aucune série n'est restée sur ses exemples : r suit p6-b2 par consigne (sa langue), z et u s'en écartent franchement.

Honnêteté, vérifiée chiffre à chiffre : 50–80 g/hL × 30 L = 15–24 g → 2–3 sachets de 11,5 g ; 2 sachets = 23 g = 77 g/hL (dans la plage),
3 = 34,5 g = 115 g/hL (au-dessus) ; FG 1,012–1,015 et 6,8–7,1 % vol depuis 78–82 % ; Nottingham 78–83 %, 10–25 °C, haute, 14 % ; Voss
25–40 °C, très haute ; WLP002 1,020–1,024, 5,5–6,1 %. **Aucune dose exacte au repos, aucun FG unique, aucune floculation remplie hors fiche,
aucun mot anglais hors noms de produit.** Les seuls nombres exacts (23 g, 34,5 g) viennent d'un geste du brasseur et disent dans ou hors plage.
Deux valeurs à demi : z4 pose chaque levure à sa température **médiane** (Voss à 32, Belle Saison à 27) alors que la fiche donne une plage ;
u4 montre WLP001 en pointillé sans dire pourquoi (« sort de nulle part »). Fixture incohérente entre séries : bandeau « 8,8 kg · EBC 12 » (r),
« 8,0 kg · EBC — » (z), « 8,0 kg · EBC 7,3 » (u) pour la même recette.

## Classement
| Rang | id | Ce qui tient | Ce qui casse (390 sauf mention) | Sa phrase, prédite |
|---|---|---|---|---|
| 1 | **r2** sachets + jauge fabricant | On **voit** pourquoi « 2–3 » : deux sachets pleins, un hachuré, et la jauge 0–120 g/hL où ② tombe dans la plage, ③ au-dessus ; au geste « 115 g/hL au-dessus de la plage ». Intervalles, vraies valeurs, pastilles sobres. | Bas d'écran clair (0,49) ; le nom est le champ (toucher efface « SafAle US-05 ») ; « fabricant 50–80 » collé au curseur. | « Ça c'est très bien, on comprend la dose. Mais pourquoi le nom s'efface ? » |
| 2 | **r3** l'établi | Trois instruments disent ce que la levure change sans texte : 1,066 → 1,012–1,015, 78–82 %, 6,8–7,1 % ; thermomètre fiche 18–26 + conduite ; éprouvette « ? ». Segments 1–4 avec plage hachurée ; champ et puces au repos. | La dose (le cœur, J4) est petite, en haut à droite ; établi sombre dans un thème clair ; 80 mots, au plafond ; le thermomètre se lit comme une mesure en cours. | « Vachement bien, ça c'est parlant. Mais la dose on la voit à peine. » |
| 3 | **u3** la cuve claire | OG en haut, flèche d'atténuation 78–82 % vers la FG hachurée, alcool en face, double enveloppe bleue = température, cône = floculation ; ‹ › feuillette ; en Voss l'enveloppe passe ambre « conduite 18–20 °C hors plage ». | **Pas de champ « Changer » au repos** (hypothèse 4 ; ‹ › sur 5 levures seulement) ; dose petite à côté du trou d'homme ; une seule couleur ; 1280 : en-tête étalé pleine largeur hors colonne (écart s1). | « Très très bien, on voit ce que la levure fait. Mais je change comment si c'est pas dans les 5 ? » |
| 4 | **u4** l'échelle des températures | Répond à « laquelle tient ma conduite » d'un coup : colonne bleue 18–20, barres 10–40 ; Voss tout à droite, et à son toucher « Conduite 18–20 °C hors de sa plage » ; 70 mots. | Les six autres levures au repos frôlent J2 (« comparer jamais au repos ») ; tout gris ; WLP001 pointillé muet ; ni FG ni alcool au repos ; « Fermentis · sèche » absents ; bas vide (0,48) ; 1280 : en-tête étalé. | « Utile pour la température. Mais c'est gris, et pourquoi les autres sont déjà là ? » |
| 5 | **z3** le fermenteur ambré | Image forte : moût dégradé, plaque nom dans la cuve, sachets qui tombent, FG en bande, alcool au robinet, dépôt hachuré ; état vide « touche ici pour choisir » juste. | La hauteur de la bande FG = une échelle de densité dans un niveau de liquide : se lit « la bière baisse » ; conduite étiquetée « 18 °C » seul (c'est 18–20) ; 400 px de SVG puis bas vide ; 1280 : le + couvre la puce « Catalogue » (superposition). | « Pas mal du tout. Mais le trait FG là, c'est le niveau ou la densité ? » |
| 6 | **r1** la ligne p6-b2 | Sa langue exacte : ligne nom · sèche · 2–3 sachets · 15–24 g · ×, champ + puces, pistes atténuation (FG, alcool), température dégradé avec conduite, floculation ; carte Dose − + et règle 0–40 g hachurée ; le mieux rempli (75 mots, rien de vide). | La dose deux fois (ligne et carte Dose) ; « Catalogue ⇄ » : la bascule ne se devine pas ; mini-jauge de la ligne illisible. | « On est bon, c'est la base. Mais pourquoi deux fois 2–3 ? » |
| 7 | **r4** l'étiquette du sachet | Tableau à filets avec jauges ; **Comparer ajoute une colonne sur place** (Nottingham 78–83 %, 10–25 °C, haute, 14 %), contours sur les jauges : la meilleure idée de comparaison du lot. | Tampon tourné = gadget ; mini-sachets bleu / rouge / violet sans sens ; « Nottingham » mal aligné sur sa colonne ; en-tête or dentelé lourd. | « Visuellement bof le tampon, mais le comparer dans la colonne j'aime beaucoup. » |
| 8 | **z4** la même bière, sept levures | L'idée la plus neuve : changer = choisir un **effet** sur ce moût (FG × température) ; segments de FG honnêtes ; en liquide « choisis le paquet pour la dose ». | Comparatif au repos (J2) ; température **médiane** écrase la plage ; US-05 se perd parmi six barres bleues ; Verdant chevauche US-05 ; 7 levures sur 1 734, et une seule puce « Catalogue » ; bas vide (0,36). | « Intéressant mais bordélique. Et les autres levures ? » |
| 9 | **u2** l'étagère | La levure comme objet dans la main (sachet, bocal pour la liquide) ; « ×2–3 sachets » ; planches En stock / Habituelles ; **le stock compté (×3, ×1)** dit s'il a assez de sachets pour la dose. | Tout gris-mauve : Verdant, Voss, Nottingham sont le même dessin ; nom long à 16 px ; A4 absent au repos ; 1280 : en-tête étalé. | « Tu t'es trop limité au niveau des couleurs. Les sachets se ressemblent tous. » |
| 10 | **z2** la roue | Six repères d'un coup, plages en bande violette, tout en français ; hors catalogue : six secteurs « à renseigner ». | 2 secteurs sur 6 **hachurés** : contre son choix G sur les radars (« le trou du o » : gris uni très clair, sans hachures) ; esters « faibles » = un point au centre, lu zéro ([[beermaverick-radar]]) ; 260 px pour quatre valeurs ; bas vide (0,43). | « Le radar j'aime, mais la moitié est rayée, on dirait qu'elle est pas documentée. » |
| 11 | **u1** la baseline resserrée | Fidèle, tout à un toucher, station Objectifs (FG, alcool, esters) ; la dose ouverte montre le calcul « 50–80 × 30 L = 15–24 g ». | Texte et chiffres, aucune représentation ; **la levure courante dans ses propres puces** (« SafAle US-05 » sélectionnée sous « Changer ») ; 79 mots ; 0,46 ; 1280 : en-tête étalé. | « Propre mais c'est pareil qu'avant. » |
| 12 | **z1** la carte compactée | Juste et lisible en 3 s : dose 2–3 en gros, trois cases, « Donne FG · % vol », puces stock d'abord. | 55 % de l'écran vide (0,27) ; sachets dessinés de 20 px, muets. | « Tu t'es trop limité. » |

Aucun REJET : le brasseur voit les 12.

## Candidates (3, une par approche, trois chaleurs)
### r2 — la dose en sachets et la jauge du fabricant (série r, tiède) · question : combien ?
1. Remplacer le nom-champ par la **ligne de r1** (picto · SafAle US-05 · sèche · Fermentis · ×), le champ toujours prêt dessous avec ses puces
   (stock d'abord) : plus rien ne s'efface au toucher.
2. Remplir le bas : remonter FG / alcool sous la jauge, la piste température de r1 avec la conduite 18–20 dans la case Température, les plis
   Fiche · Produit · Comparer en ligne pleine largeur. Cible : remplissage ≥ 0,55.
3. Décoller « fabricant 50–80 » du curseur (au-dessus de la plage hachurée, en 12 px) ; garder le verdict du geste « 115 g/hL au-dessus ».

### r3 — l'établi, ce que la levure change (série r, chaud) · question : qu'est-ce qu'elle fait à ma bière ?
1. La dose au cœur (J4) : les **sachets dessinés de r2** (2 pleins, 1 hachuré, 2–3 en 24 px) à la place des segments 1–4, sur toute la largeur
   au-dessus des instruments.
2. Une version **thème clair** (l'établi en gris clair, ou la cuve de u3 en premier instrument) à côté de la sombre : son choix, pas le nôtre.
3. Sous 72 mots : fusionner « esters faibles · alcool toléré 9–11 % · biotransformation non documentée » en une ligne, et le thermomètre
   marque la conduite en crochet (pas en mercure plein) pour qu'il ne se lise pas comme une mesure.

### u4 — l'échelle des températures (série u, chaud) · question : laquelle tient ma conduite ?
1. Tête de r1 : « SafAle US-05 · Fermentis · sèche · **2–3 sachets** · 15–24 g · × » avant l'échelle, la dose en 24 px.
2. J2 en deux variantes (L24) : (a) les autres rangées repliées derrière « Comparer la température › » ; (b) gardées, en gris très pâle, la
   recette seule en couleur. Nommer WLP001 (« liquide · plage à renseigner ») ou l'ôter.
3. Couleur et effet : barres sur le dégradé froid → chaud de r1 ; « Donne FG 1,012–1,015 · 6,8–7,1 % vol » (z1) dans la rangée ouverte.

Réserve froide si le pilote veut une quatrième : **r1**, avec la carte Dose fusionnée dans la ligne.

## Greffes (idée → id d'origine → candidate)
- Comparer **en colonne sur place**, contours de la seconde levure sur les jauges → r4 → r3 (sur les instruments) et r2 (sur les pastilles).
- Alerte ambre « conduite 18–20 °C hors de sa plage » → u4 / u3 → r2 (case Température) et r3 (thermomètre).
- **Stock compté** « ×3 » sur la puce d'une levure en stock, qui dit « assez pour 2–3 sachets » → u2 → r2 et u4.
- « Donne FG 1,012–1,015 · 6,8–7,1 % vol » en une ligne sous la dose → z1 → u4 (rangée ouverte) et r2.
- Flèche d'atténuation OG → FG dans l'instrument → u3 → r3 (densimètre).
- Changer de levure = choisir un **effet** : l'axe FG de z4 en seconde échelle de u4 (bascule Température / FG) → z4 → u4.
- Sachets qui **tombent** dans la cuve au choix d'une dose (animation 220 ms) → z3 → r3.
- La roue de z2 **derrière « Fiche »** (à un toucher), avec l'inconnu en gris uni clair (son choix G), jamais au repos → z2 → r2, r3.
- Puces à **icône de forme** (sachet, bocal, poche) distinguant sèche / liquide → u2 → r2, u4.
- État vide « Pas de levure · touche ici pour choisir » dans l'image → z3 → r3.

## Défauts à corriger en passe 2
1. **Remplissage** (PANEL ECHEC) : rien sous les liens dans z1 à z4, u1, u4 ; r2 à 0,49. Le pied et le + ne comptent pas. Cible : médiane ≥ 0,55,
   0 écran sous 0,50 ; rejouer `controle-panel.mjs` sur les 12 (ou les 3 + leurs retouches).
2. **Fixture unique** : bandeau Grain · OG 1,066 · IBU · EBC identique dans les trois séries (une recette, 30 L).
3. **La dose au cœur** (J4) dans r3, u3, z3 : aujourd'hui petite, à côté de l'image.
4. **Comparatif au repos** (J2) dans u4 et z4 : trancher par deux variantes, pas par un rejet.
5. **Champ toujours prêt** (hypothèse 4) absent au repos de u3 ; en r2 le nom ne doit pas être le champ.
6. **Hachures sur un radar** (z2) : contre son choix G (gris uni très clair, sans hachures ni mot) ; le point d'esters au centre se lit zéro.
7. **1280** : série u, en-tête et icônes hors de la colonne 560 (écart s1, « l'en-tête qui change ») ; z3, le + couvre « Catalogue » (superposition).
8. **Couleur sans sens ou absente** : r4 mini-sachets bleu / rouge / violet ; u2 et u4 monochromes (« trop limité au niveau des couleurs »).
9. **Valeurs à demi** : z4 température médiane (écrire la plage ou la barre verticale) ; u4 WLP001 pointillé sans nom ; z3 « 18 °C » pour 18–20.
10. **Doublons** : r1 dose dans la ligne et la carte ; u1 la levure courante dans ses propres puces.
11. **Mots** : r3 et z4 à 80, au plafond ; viser ≤ 72.
12. Non joués en v0, à faire en passe 2 sur les candidates : thème sombre (série r et z : aucune capture cave), hauteur 844 en défilant, B9.

LEÇON PROPOSÉE : aucune.
