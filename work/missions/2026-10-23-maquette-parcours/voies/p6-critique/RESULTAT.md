OK — accepté : après les corrections du commit 420cd61e (BATTERIE OK 31/31), les huit écrans sont ceux de ses choix : Ma bière sans ses deux lignes hors base (règle n° 1, D105), la fiche à une seule croix ronde de 44 px (D109), l'étape à 1,04 écran avec ses trois ajouts rapides (D5), les cartes de Suggérer aux teintes de q2b ; les quinze défauts D107 à D121 sont levés sur capture ou par contrôle. Au premier jugement de cette version : 6 ACCEPTÉ, 2 REJET (biere, fiche), levés au rejugement ci-dessous. Restent des réserves, aucune ne cite un refus.

## Version D107 à D121

Critique Fable, 24.10, nuit, sur la page côte à côte `work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/` (12 états, `img/<état>-base.png` face à `img/<état>-maquette.png`, et les `-plein`), les trois variantes D121 (`parcours-p1/captures-etape/d121-a-390.png`, `-b-`, `-c-`) et les NOTE (`## Écarts`). Chaque paire ouverte en image, sa base d'abord. Étalonnage : portrait v2 (88 % / 75 %, L27) ; mes biais connus (clément devant un radar à plusieurs couleurs) sont dits là où ils jouent. Avis précédent (d332792c) : 8 ACCEPTÉ, sans la comparaison côte à côte (L03) ; il est conservé plus bas.

### Les quinze défauts, un par un

- D107 : levé — `comparer-maquette.png` : sous le tableau r6a, trois rangs nommés « 60′ », « 10′ », « dry hop », une colonne « — Nugget α 13 % » (le houblon de base), floral et résineux à chaque étape (« ~0,1 · ~0,5 · ~0,9 » Cascade, « ~0,1 · ~0,7 · ~1,3 » Idaho 7), les trois rangs dans le premier écran à 390 ; puis « Toutes les familles au dry hop, après 3 j ». La forme reste r6a, comme la SPEC le demande ; x3b n'est pas copié, ses étapes le sont.
- D108 : levé — `biere-visee-maquette.png` face à `biere-visee-base.png` : « + » sur Tropicaux pose le losange blanc relié au point par le pointillé, le palier « faible » entre « − » et « + », « × » pour retirer ; le « + » posé est à l'encre pleine (écart écrit dans la NOTE). Même dessin que sa base.
- D109 : levé sur les outils, pas sur la fiche — `biere-`, `suggerer-`, `comparer-`, `dryhopper-`, `levure-`, `substituer-maquette.png` : une croix « × » noire dans un cercle de 44 px, en haut à gauche, à la même place partout. Fiche (`fiche-maquette.png`) : le « × » du `Sheet` de l'app (`src/ui/Sheet.tsx` : `X w-4 h-4`, `text-cave-400`, zone `touch-sm`), 16 px gris, plus un « ‹ » gris à gauche de l'α : deux petits boutons de retour là où sa g1 (`fiche-base.png`) a une seule croix cerclée de 44 px. C'est le bouton « souvent assez petit » de D109 : rejet sur la fiche, ci-dessous.
- D110 : levé — `suggerer-toucher-maquette.png` : un toucher sur le picto Floral de Golding ouvre « Floral +0,9 cran · 1 trait = 1 cran du style » collé au picto ; au repos (`suggerer-maquette.png`) rien de plus sous les pictos, les traits de q2b restent.
- D111 : levé — `etape-glisser-maquette.png` face à `etape-glisser-base.png` et `etape-glisser-base-ref.png` : à 35′ doigt tenu, la carte est repliée en puce « Nugget » à côté de la bulle « 35′ », les graduations 50′ 40′ 30′ 20′ lisibles sans chevaucher 0′, whirlpool ni la levure, IBU recalculée (49), rien de sélectionné. La loupe de sa base est plus serrée autour du doigt (45′, 30′, 25′) ; la maquette ouvre tout le segment à 14 px par 5′ : lisible, RAIL OK, c'est « la version qu'il veut » au sens de ses mots (puce et frise ouverte).
- D112 : levé — `etape-appui-maquette.png` : à 250 ms le nom « Nugget » est rempli de gris ; sa base (`etape-appui-base.png`) ne montre rien à 250 ms (500 ms). La carte entière non sélectionnable : écrit dans la NOTE, non visible sur capture.
- D113 : levé — `etape-maquette.png` : un « ? » au coin de la carte de Nugget, un à côté de « Ajouter — houblon… », un au-dessus des familles ; les icônes restent.
- D114 : levé — `comparer-maquette-plein.png` : « Panel OSU ⌄ » replié, en bas de page après « Chimie et vraies valeurs » et « Égaler », même graisse que les autres blocs ; hors du premier écran (`comparer-maquette.png`).
- D115 : levé — `fiche-maquette.png` : α, puis le grand radar à 12 axes avec sa flèche sur Résineux, puis « + Floral 2/4 − Résineux 2/4 », puis la liste des familles : radar entier dans le premier écran à 390. La liste (« nommé en premier » ×4, « woody, resinous ») reste à revoir en variantes, comme convenu.
- D116 : levé — `etape-maquette.png` : « Houblons 3/7 » et le fil de l'app (Identité · Malts/sucres · Houblons · Levure · Paliers · Eau · Récap., la 3ᵉ active, les deux premières pleines) ; plus de « 16D · hypothèse ».
- D117 : levé — `suggerer-maquette.png` face à `suggerer-base.png` (v4.10) et `suggerer-q2b.png` : onglets en tête (« Comparer (2) »), bandeau IBU · OG · EBC, « Au style / Absolu » et « Barres / Radar », deux cartes d'objectif (« Plus floral · Atteint », « Moins résineux · Aucune voie houblon · Hors houblon › »), pictos d'objectif cerclés, ♡ sur chaque voie, « + » cerclé puis ✓, liste dans son cadre à bord noir, barre « Comparer (2) » pleine largeur et noire ; plus de titre-question ni de ligne « fixé ». Restent, avec leurs mots : l'usage en mot (D90), les pistes l5b sous les cartes (D92), le « ? » (D89).
- D118 : levé par contrôle (RETOUR ×2 dans la batterie), pas vérifiable sur une capture fixe : à jouer une fois au doigt depuis l'onglet et depuis l'étape.
- D119 : levé — `biere-maquette.png`, `suggerer-maquette.png`, `comparer-maquette.png` : même en-tête sur les trois onglets (croix cerclée à gauche, les trois onglets dans la même pilule, même hauteur) ; la question de Comparer passe sous l'en-tête.
- D120 : levé — `dryhopper-maquette.png` (« Annuler | Puis la levure Pomona ~+13 › »), `levure-maquette.png` (« Annuler | Ajouter à ma bière › »), `substituer-maquette.png` (« Annuler | Remplacer › », avec « 46 g de Nugget → 62,5 g de Nelson Sauvin » au-dessus).
- D121 : levé — `etape-maquette.png` : « analyse › » en pilule noire à la place du « › » muet (variante A) ; le bloc entier actif est un contrôle (PROFIL), pas une capture. Variantes ci-dessous.

### D121 : laquelle montrer en premier

- **A** (`d121-a-390.png`, dans la version) : « analyse › » noir à la place du « › » de sa base, le bloc entier touchable. À montrer en premier : c'est sa base « plancher à enrichir » (L07), un mot de plus là où il a dit « peut être amélioré », rien ne bouge d'autre.
- **B** (`d121-b-390.png`) : une barre pleine largeur « Ouvrir l'analyse de ma bière › » sous les 12 familles. Il dira : « c'est quoi ce gros bloc ? » (D82) ; elle allonge encore une page déjà trop longue (ci-dessous) et éloigne l'entrée de l'alerte qu'elle commente.
- **C** (`d121-c-390.png`) : « Résineux trop marqué · détail › » en texte gris sur la ligne de l'alerte. Le plus discret, mais il risque de ne pas voir que ça s'ouvre : « Seul bouton qui ouvre vraiment l'analyse » reviendra. Indicatif (L27) : A, puis C, puis B.

### Avis par écran

- ma-biere : ACCEPTÉ — `etape-maquette.png` face à `etape-base.png` : même ordre que sa base (« Ça c'est le bon ») : bandeau, frise, carte Nugget (ébullition ⟳, − 46 g +, ×, α 13 % puis 9,5–16, usage, « résine 2/4 », 60 IBU, bande des 12 familles et ses traits), US-05, « Ajouter — houblon… », ajouts rapides, alerte, 12 familles ; en plus, ce qu'il a demandé (D111, D112, D113, D116, D121). Tous les écarts ont leurs mots dans la NOTE (`Sans Nugget ›`, « ? », « + floral », « Au style / Absolu »).
  - Phrase prédite : « Là c'est le bon, avec le vrai stepper. Le slider marche. »
  - Réserve forte, mesurée : `etape-maquette-plein.png` fait 960 px pour 844 (1,14 écran ; D5 : ≤ 1,05) ; sa base tient en 1,00 avec trois ajouts rapides. Neuf familles sur douze passent sous le pli (`etape-maquette.png` coupe après Terreux / Melon) là où sa base montrait les douze. Avant publication : regagner ~120 px (le rang « ? · + floral · Au style / Absolu » replié sur la ligne de l'alerte, ou la pilule du bandeau moins haute). Je ne rejette pas : les éléments ajoutés sont ses demandes, et aucun refus ne rejoue.
  - Réserves : deux ajouts rapides (`Ajouter.tsx` : « deux houblons du stock ») alors que la NOTE écrit « trois » et que sa base en a trois ; « mixte » où sa base écrit « double » (la fiche dit « double usage ») ; chiffres à chasse fixe (« 46 g », « 1,066 ») où sa capture est en chiffres proportionnels.

- biere : ACCEPTÉ après correction (420cd61e, voir « Rejugement ») ; au premier jugement de cette version, REJET — `biere-maquette.png` face à `biere-base.png` : l'écran est le sien (onglets, bandeau, alerte, « Barres / Radar », décompte, légende, 11 barres, Résineux ouvert « bannir · − · sans visée · + », « ×2,8 », puces et levure au pied dans `biere-maquette-plein.png`), et D108, D109, D119 sont levés. Mais deux lignes n'existent ni dans sa base ni dans `ecrans/biere/NOTE.md` (`## Écarts`) : « surtout Nugget, 46 g à 60′ » sous l'alerte (`biere/index.tsx` : `data-role="cause"`) et « , et Nugget 46 g à 60′ » ajouté à « Prévu avec SafAle US-05, caractérisée » au pied. Règle n° 1 (D105) et la consigne de cette passe : un écart à sa base sans ses mots est un rejet.
  - Phrase prédite : « Ça aussi c'est bon. » — il reconnaîtrait l'écran ; la ligne « surtout Nugget » l'aiderait plutôt (elle dit d'où vient l'alerte et ouvre la fiche). Le rejet est de règle, pas de goût.
  - Correction attendue : écrire ces deux écarts dans `## Écarts` avec leur raison (la cause de l'alerte, penser brasseur ; lien vers la fiche), ou les retirer. Rien d'autre à toucher.
  - Réserve : « 7 au style · 4 non situées » contre « 6 · 5 » dans sa base (Végétal devenu « prévu ») : le moteur en direct, à dire dans la NOTE.

- fiche : ACCEPTÉ après correction (420cd61e, voir « Rejugement ») ; au premier jugement de cette version, REJET — `fiche-maquette.png` face à `fiche-base.png` et `fiche-base-ref.png` : c'est g1, radar d'abord comme il l'a demandé (D115), α en plage avec le lot et sa jauge, « double usage », « + Floral 2/4 − Résineux 2/4 », bande des familles, liste avec pictos, « sans famille … autres 14 % », « 5 non décrites » (`fiche-maquette-plein.png`), ♡ ⊘ et « Comparer » au pied. Mais la fermeture : sa g1 a une croix noire cerclée de 44 px en haut à droite ; la maquette a le « × » du `Sheet` de l'app, 16 px, gris, zone `touch-sm`, et un second « ‹ » gris à gauche de l'α. « Bouton retour souvent assez petit et pas très intuitif » ; « Juste une croix bien positionné, facile, dans le thème suffirait » (D109) ; et sa capture choisie montre la bonne (règle n° 1).
  - Phrase prédite : « Pour la fiche, on est bon avec le radar devant. Mais le bouton retour toujours pas au point ??? »
  - Correction attendue : la même croix cerclée de 44 px que les outils (icône 20 px, encre du texte), une seule ; retirer le « ‹ » ou le fondre dans la croix.
  - Réserves : « nommé en premier » quatre fois sur sept lignes (D73, à compter sur `fiche/etat.html`) ; α « 9,5–16 % » où sa capture dit « 11–14 % » (enveloppe des fiches, à nommer d'un mot si l'écart reste).

- suggerer : ACCEPTÉ — `suggerer-maquette.png` face à `suggerer-base.png` et `suggerer-q2b.png` : D117 levé point par point (ci-dessus), D110, D109, D119 levés. Les voies : usage en mot, nom, α, stock en icône, pictos cerclés et traits, « + » cerclé, ✓ sur Motueka, le groupe Motueka + Citra cryo « 5+5 g ≈ », barre « Comparer (2) ».
  - Phrase prédite : « Ça c'est q2b, bien. »
  - Réserves : les cartes d'objectif sont plus pâles que celles de q2b et de sa base (violet et vert francs là, teintes lavées ici ; TEINTE OK parce que le contrôle borne par le haut) : il peut dire « trop limité au niveau des couleurs » (D74) ; à montrer en deux teintes s'il le dit. Le dry hop d'Idaho 7 n'est pas dans le premier écran.

- comparer : ACCEPTÉ — `comparer-maquette.png` face à `comparer-base.png` (r6a) et `comparer-x3b.png` : c'est r6a (question, contexte fixé, « ★ Idaho 7 devant Cascade ~+0,4 cran », « ~ simulé », « Au style / Absolu », radar r2 dans la zone du style, tableau ta stout / Cascade / Idaho 7 / Galaxy avec α, usage, pictos, verdict, « + »), plus les étapes et la référence (D107), le panel replié (D114), la croix (D109), l'en-tête commun (D119).
  - Phrase prédite : « r6a avec les étapes, très bien. Manque peut-être les autres familles à 60′ et 10′. »
  - Réserves : à chaque étape, seules floral et résineux (ses deux objectifs) ; x3b montrait plusieurs familles monter au moment de l'ajout : il peut demander les autres à un toucher. Radar : trois houblons (bordeaux, rouge, violet) se croisent au centre ; `controle-radar-series` est vert et je suis clément devant ce cas : je prédis la remarque D77 sans rejeter.

- dryhopper : ACCEPTÉ — `dryhopper-maquette.png` face à `dryhopper-base.png` (a1, choix ouvert) : même écran (« Quand ajouter Idaho 7 ? », contexte fixé, « Face à ta stout ❀ ~+22 », 9 familles en barres avec leur ruban, amertume « 60 +? », pépins / melon / épicé en « › »), croix (D109), « Annuler » à côté de « Puis la levure Pomona ~+13 › » (D120), dock 60′–0′ / WP / actif / après avec 1 j à 7 j et la frise.
  - Phrase prédite : « C'est y1b en mieux ; j'aime bien mais il y a des améliorations à faire » (#146, ses mots).
  - Réserves : le dock est plus lourd qu'a1 (quatre pastilles chiffrées, quatre jours, la frise : ~250 px au repos) ; la ligne « mesuré : … Schmidt 2019 » d'a1 n'est plus dans le premier écran.

- levure : ACCEPTÉ — `levure-maquette.png` face à `levure-base.png` (carte des outils, choix ouvert) : « Quand · Levure », contexte fixé, tuiles US-05 « = » / Pomona ~+13 agrumes / Verdant ? / Diamond ?, « confiance moyenne », géraniol → citronellol « ? », cinq familles (barre du houblon, barre de la levure), tableau Nugget / +Idaho 7, « Annuler | Ajouter à ma bière › » (D120), croix (D109) ; rempli jusqu'au pied (D4 levé depuis le premier passage).
  - Phrase prédite : « Pas mal, on voit ce que la levure change. »
  - Réserve : aucune nouvelle.

- substituer : ACCEPTÉ — `substituer-maquette.png` face à `substituer-base.png` (v4.10, choix ouvert : porte ou outil u4) : « Lequel à la place de Nugget ? », fixé « Stout 16D · à 60′ · 60 IBU égal », Nugget épinglé, colonnes (α et « ≠ », usage, dose à IBU égal, arômes et « autres 83 % », perd / gagne, ma bière après, proximité 86 · arôme 100 · huiles 72 · amer 86), « Annuler | Remplacer › » sous « 46 g de Nugget → 62,5 g de Nelson Sauvin » (D120), croix (D109).
  - Phrase prédite : « Pas mal, on voit ce qu'on perd et ce qu'on gagne. Mais pourquoi Nelson Sauvin et pas Magnat à 99 ? Et il perd tout et gagne rien ??? »
  - Réserves : sa base v4.10 classe huit remplaçants avec leur score et leur intervalle (Magnat et Yeoman 99, Altus 79–99) — « la liste chiffrée qui classe les remplaçants », qu'il avait retenue — et la maquette n'en montre que deux colonnes, la troisième coupée (« ~−», « 8 ») ; Nelson Sauvin, premier proposé, paraît le pire (perd 6, gagne « — », « autres 83 % » : L14, mettre vin blanc et groseille à côté du 83 %) ; le tiers bas reste vide sous le tableau (D4 à la limite). Ticket #145 : « substituer à faire ».

### Le parcours

- Il retrouve sa stout (16D, IBU 60, US-05), son Nugget et son Idaho 7 d'un écran à l'autre, ses pictos (« épicé » cannelle et clou), la page blanche et l'action noire (TEINTE OK 5/5). Le même en-tête sur les trois onglets et la même croix sur six outils : c'est ce qu'il a demandé le 23.10.
- Les trois croix de la fiche et de Ma bière mises à part, chaque écart à ses bases a ses mots dans les NOTE.

### Rejugement après corrections (24.10)

Commit 420cd61e, BATTERIE OK 31/31, page côte à côte refaite sur la construction finale ; chaque capture rouverte en image.

1. biere : ACCEPTÉ — `biere-maquette.png`, `biere-maquette-plein.png`, `biere-visee-maquette.png` face à `biere-base.png` : la ligne « surtout Nugget, 46 g à 60′ » a disparu sous l'alerte, le pied redit « Prévu avec SafAle US-05, caractérisée » sans « et Nugget » ; `ecrans/biere/NOTE.md` (lignes 32–33) dit le retrait et sa raison, et `index.tsx` n'a plus de `data-role="cause"`. Les crans de la zone du style sur les familles non attendues (Agrumes, Tropicaux, Résineux, Épicé, Végétal : deux traits fins couleur de la page) sont ceux de sa base (`biere-base.png`), écrits dans la NOTE (biere-crans-style) ; la visée sur Tropicaux garde losange, pointillé, « faible » et « × » par-dessus les crans. Plus aucun écart sans ses mots. Phrase prédite : « Ça aussi c'est bon. »
2. fiche : ACCEPTÉ — `fiche-maquette.png` face à `fiche-base.png` : une seule croix « × » noire dans un cercle de 44 px en haut à droite, à la place de celle de sa g1 ; plus de « ‹ » à gauche de l'α (`FicheHoublon.tsx` n'a plus `fermer-fiche`) ; RETOUR OK (`--fiche`). Radar d'abord, « + Floral 2/4 − Résineux 2/4 », liste ensuite : D115 et D109 tenus ensemble. Phrase prédite : « Pour la fiche, on est bon. »
3. ma-biere (étape) : ACCEPTÉ — `etape-maquette.png`, `etape-maquette-plein.png` : trois ajouts rapides (Cascade, Citra cryo, Idaho 7 « α 12,7 % · mixte · 10 g · +5 IBU »), page entière de 875 px pour 844 (1,04 écran ; HAUTEUR OK ; D5 ≤ 1,05), dix familles sur douze dans le premier écran, Noyau et Végétal juste sous le pli. Mots : 26 hors données contre 24 pour sa base, l'écart vient des données (D1 tenu). Réserve : la légende « ? » des ajouts rapides écrit encore « deux houblons du stock » (`Ajouter.tsx`, ligne 90) alors qu'il y en a trois.
4. suggerer : ACCEPTÉ — `suggerer-maquette.png` face à `suggerer-q2b.png` : mesuré au pixel (fast-png), la carte « Plus floral » de q2b est à (234, 218, 244), celle de sa base v4.10 à (234, 217, 244), celle de la maquette à (238, 222, 244) au plus teinté, en dégradé vers (242, 231, 247) ; la carte « Moins résineux » à (229, 239, 237). Ce sont les teintes de q2b, à 4 près au point le plus teinté ; le dégradé éclaircit le bord droit, ce qu'il peut remarquer sans que ce soit un écart (q2b a des aplats). Réserve D74 levée.

Compte final de la version D107 à D121 : 8 ACCEPTÉ, 0 REJET.

### Résumé pour `systeme.mjs voies`

ma-biere : ACCEPTÉ · biere : ACCEPTÉ · fiche : ACCEPTÉ · suggerer : ACCEPTÉ · comparer : ACCEPTÉ · dryhopper : ACCEPTÉ · levure : ACCEPTÉ · substituer : ACCEPTÉ

- **ma-biere** (étape Houblons) — ACCEPTÉ
- **biere** (Ma bière) — ACCEPTÉ (après 420cd61e : lignes hors base retirées et dites en écart)
- **fiche** (g1) — ACCEPTÉ (après 420cd61e : une seule croix ronde de 44 px)
- **suggerer** (q2b) — ACCEPTÉ
- **comparer** (r6a + étapes) — ACCEPTÉ
- **dryhopper** (a1, ouvert) — ACCEPTÉ
- **levure** (ouvert) — ACCEPTÉ
- **substituer** (ouvert) — ACCEPTÉ

Avant publication (réserve, pas de rejet) : le texte de la légende « ? » des ajouts rapides (`Ajouter.tsx`, ligne 90 : « deux houblons du stock ») à mettre à « trois ».

LEÇON PROPOSÉE : un composant de l'app réemployé dans la maquette (ici le `Sheet` et son « × » de 16 px) apporte ses propres boutons, qui échappent au contrôle écrit pour les routes (`controle-retour.mjs`) ; quand une plainte vise un genre d'élément (« bouton retour »), le contrôle inventorie tous les éléments de ce genre dans la construction, feuilles et fiches comprises, pas seulement ceux des routes.

---

## Avis précédent (23.10 soir, version d332792c)

OK — accepté : les huit écrans sont ceux de ses maquettes choisies (règle n° 1), sur page blanche et action noire comme ses captures (D106) ; les quatre rejets du premier passage sont levés et vérifiés sur capture (D55, D10, D4) ou dans le code (D32) ; il reste des réserves, aucune ne cite un refus.

Critique Fable, 23.10 soir, deuxième passage, sur les 76 captures fraîches de `voies/p5-parcours/captures/` (20 h 31 ; 31 étapes × 390 et 1280, plus les « -bas »), chaque écran choisi posé à côté de la capture du registre `work/refonte-frontend/v4/choix/ecrans.json` avant tout autre jugement. Étalonnage : portrait v2 (88 % / 75 %, L27) ; mes biais connus sont dits là où ils jouent. Premier passage : 4 REJET (ma-biere D105/D55, biere D32, fiche D10, levure D4), 4 ACCEPTÉ.

### Avis par écran

- **ma-biere** (étape Houblons, base v4.10 : « Ça c'est le bon ») — ACCEPTÉ. `01-ma-biere-390.png` face à `base/captures/consolide-390.png` : même page blanche, même ordre — « Houblons 3/7 », pastille « 16D · hypothèse », bandeau IBU 60 / OG 1,066 / EBC 70, frise compacte (« 0′ » juste sous la carte Nugget, whirlpool, US-05, fermentation, post-fermentation), carte Nugget (ébullition ⟳, − 46 g +, ×, α 13 % puis 9,5–16, rôle en mot, « résine 2/4 », 60 IBU, bande des 12 familles), « Ajouter — houblon… », ajouts rapides à 10 g et 10′ avec « + » et ♡, « Résineux trop marqué », puis les 12 familles en deux colonnes dont le début est déjà dans le premier écran. Le vide du premier passage a disparu (D55) ; `01-ma-biere-1280.png` tient dans son cadre sans trou. Recalculée (`20-ma-biere-recalculee-390.png`) : Idaho 7 « nouveau » à 2 j, 80 g, « ? IBU », bande de familles avec ses traits ; remplacée : Galaxy « à la place de Nugget » ; `31-recommencer-390.png` revient à la capture 01.
  - Phrase prédite : « Là c'est le bon. Le "Sans Nugget" et le "+ floral" c'est bien, c'est les ponts. »
  - Réserves : 2 ajouts rapides (Cascade, Citra cryo) au lieu de 3 ; « mixte » où sa base écrit « double » (la fiche dit « double usage » : un seul mot pour les deux) ; après Idaho 7 le résineux monte de ~+14 sur une stout « trop marquée » et l'alerte ne le dit pas (D30, penser brasseur).

- **biere** (onglet Ma bière, base v4.10 : « Ça aussi ») — ACCEPTÉ. `04-biere-390.png` face à `consolide-biere-390.png` : onglets « Ma bière · Suggestions · Comparer », bandeau, alerte et « Barres / Radar », décompte « 7 au style · 4 non situées » et « Au style / Absolu » (segments actifs en noir, comme sa capture), légende « dégusté 18.10 · prévu · non situé », 11 barres (4 hachurées), Résineux ouvert « bannir · − · + » avec « ×2,8 », objectifs et levure en bas. Bannir le floral (`05-biere-floral-bannir-390.png`) ouvre la famille, écrit « bannie » et remplace « + floral » par « bannir floral ».
  - D32, levé : la visée vit dans l'état commun (`etat/reducteur.ts`, `visee/fixer`, `useVisee`) ; Suggérer la lit (`ecrans/suggerer/voies.ts` : `objectifsDe`, `bannisDe` ; `index.tsx` : carte « Bannie » par famille bannie, voies des houblons qui la citent écartées). Vérifié dans le code, pas sur capture : le parcours revise la visée en « + » avant d'ouvrir Suggérer (`06-…`), et aucune capture ne montre Suggérer en état banni. Le RESULTAT de p5 (défaut 4) et `ecrans/biere/NOTE.md` (« La visée n'est pas encore lue par Suggérer ») sont restés d'avant la correction : à mettre à jour, et une capture « bannir → Suggérer : Bannie » à ajouter au parcours.
  - Phrase prédite : « Ça aussi c'est bon. »
  - Réserve : à 1280 (`04-biere-1280.png`), l'en-tête « ‹ Ma bière » au-dessus des onglets qui ont leur propre « ‹ » : deux retours l'un sous l'autre (D79, « le "ma bière" en haut sert à rien »). À 390 il n'y en a qu'un.

- **fiche** (g1, et la fiche courte type Citra cryo) — ACCEPTÉ. `02-fiche-nugget-390.png` face à `consolide-fiche-390.png` : c'est g1 — feuille sur l'étape floutée, « Nugget ⊙ », « × », « α 9,5–16 % lot 13 % » avec la jauge, « double usage », bande des 12 familles, sept familles « 2/4 » et « 1/4 » avec leurs mots et « nommé en premier », « sans famille : gingembre, resiny · autres 14 % », « 5 non décrites », le grand radar à 12 axes nommés avec les inconnus hachurés et la flèche sur Résineux, ♡ ⊘ et « Comparer ». À 1280 (`02-fiche-nugget-1280.png`) la feuille est bornée au cadre de 768 px et centrée, sans anneau de focus : D10 levé.
  - Phrase prédite : « Pour la fiche, on est bon. »
  - Réserves : « nommé en premier » quatre fois sur sept lignes, ce qui approche les 45 mots d'étiquettes (D73) : à compter sur `fiche/etat.html` ; sa capture écrit « + Floral 2/4 − Résineux 2/4 » sous le radar (face à sa demande) : la capture 390 coupe sous Épicé, je ne peux pas dire si la ligne y est.

- **suggerer** (q2b : « Ça oui, c'est effectivement l'un de mes choix ») — ACCEPTÉ. `07-suggerer-390.png` et `07-suggerer-1280.png` face à `q2b-b-390.png` : onglets avec « Comparer (2) », « Au style / Absolu » et « Barres / Radar », cartes d'objectif teintées (« Moins résineux : Aucune voie houblon · Hors houblon › », « Plus floral : Atteint »), pistes l5b des deux objectifs, « = même effet sur tes objectifs · 10 g · 10′ » avec l'effet une fois (« ~+0,9 »), une ligne par voie (usage en mot, nom, α, stock en icône, pictos et crans), « + » → ✓, dock « Comparer (2) › ». Le dry hop d'Idaho 7 (~+1,3) dans son groupe. Page blanche comme q2b.
  - Phrase prédite : « q2b, avec le dry hop : bien. »
  - Réserves : `24-abandon-suggerer-390.png` repropose Idaho 7 déjà dans la bière sans le dire, et « Atteint » passe à Motueka parce que la visée se compte depuis la bière actuelle : il dira « il est déjà dedans ??? ». La ligne « fixé · Stout 16D · US-05 » vient de la carte : discrète, elle passe.

- **comparer** (r6a : « r6a reste le meilleur […] avec les quelques petites améliorations des autres versions ») — ACCEPTÉ. `10-comparer-390.png` et `10-comparer-1280.png` face à `r6a-premier-ecran.png` : c'est r6a, à peine amélioré — titre en question, contexte fixé, « ~ simulé », « Au style / Absolu », radar r2 dans la zone du style, puis le tableau (ta stout ♣ ↓ ❀ ↑, α du lot ou plage des fiches, usage en mot, familles, verdict, une rangée par famille en barres l5b avec intervalle, « ~+1,3 » Floral, « ~+2 » Résineux, inconnus hachurés), Chimie et panel OSU à un toucher. Améliorations : « ★ Idaho 7 devant Target ~+0,4 cran », 4ᵉ colonne par « + », dock « Placer Idaho 7 › » noir qui suit la colonne touchée (`11-comparer-target-retenu-390.png`).
  - Phrase prédite : « r6a, très bien. »
  - Réserve, avec mon biais (trop clément devant un radar à plusieurs couleurs) : à 4 séries, Motueka (olive), Target (ardoise) et Cascade (bordeaux) sont trois traits sombres qui se croisent au centre ; D77, « très compliqué à voir les différence avec les cileur sur le spider graph ». `controle-radar-series` est vert ; je prédis la remarque sans rejeter. Piste : séries non retenues plus claires dès la 4ᵉ.

- **dryhopper** (a1, choix ouvert : a1, b4, d8, e5, g1 ; « y1b est de mon point de vue semble meilleur ») — ACCEPTÉ. `13-dryhopper-390.png` face à `a1-390.png` : même écran — « Quand ajouter Idaho 7 ? », contexte fixé, « Face à ta stout ❀ ~+22 », 9 familles en barres l5b avec leur ruban, l'amertume « 60 +? », « mesuré linalol 38 µg/L (McCabe 2023) », « Puis la levure Pomona ~+13 », dock (60′–0′ / WP / actif / après, 1 j à 7 j, frise, aucune graduation au repos : D47). Le geste à 60′ (`14-dryhopper-60-390.png`) fait monter l'amertume à 161 « trop amer » et écrit « jamais mesuré à ce moment ». `13-dryhopper-1280.png` : frise au bas du cadre.
  - Phrase prédite : « C'est y1b en mieux, le slider marche. »
  - Réserves : « 1 j / 2 j / 3 j / 7 j » à 40 × 20 px sous le doigt (D46) ; « Placer » un houblon déjà dans la recette (`26-abandon-dryhopper-390.png`) ne prévient pas : à lui d'arbitrer.

- **levure** (étape de Dryhopper, choix ouvert : étape ou outil a2b) — ACCEPTÉ. `17-levure-390.png` : avec US-05 à l'arrivée, l'écran est rempli jusqu'au tableau (tuiles US-05 « = » / Pomona ~+13 agrumes / Verdant ? / Diamond ?, « confiance moyenne », biotransformation « ? », cinq familles avec la barre de l'ajout et celle de la levure, tableau Nugget / +Idaho 7) : 0,84 du premier écran, D4 levé ; `17-levure-1280.png` idem. Pomona (`18-levure-pomona-390.png`) : agrumes ~+13, floral ~+5, « ~50 % », « confiance faible », huit familles, la chaîne x3b.
  - Phrase prédite : « Pas mal, on voit ce que la levure change. »
  - Réserve : la colonne « +US-05 » du tableau a disparu dans l'état US-05 (elle était égale à « +Idaho 7 ») : cohérent, mais la chaîne x3b « 1 dry hop, 2 levure » n'a plus que deux maillons à l'arrivée.

- **substituer** (la porte, choix ouvert : porte ou outil u4) — ACCEPTÉ. `21-substituer-390.png` et `21-substituer-1280.png` face à `fils22-carte/captures/substituer-porte-390.png` : même écran — « Lequel à la place de Nugget ? », fixé, Nugget épinglé, colonnes au toucher (α et « ≠ » quand le lot sort des fiches, usage, dose à IBU égal, arômes et « autres », perd / gagne, ma bière après remplacement, proximité), dock « 62,5 g de Nelson Sauvin · Remplacer › » noir. Choix de Galaxy (`22-substituer-choix-390.png`) puis `23-ma-biere-remplacee-390.png`.
  - Phrase prédite : « Pas mal, on voit ce qu'on perd et ce qu'on gagne. Mais Nelson Sauvin qui perd tout et gagne rien ??? »
  - Réserves : le premier choix du moteur paraît le pire à l'écran (perd 6, gagne « — », « autres 83 % ») : D100 tenu par la part visible, mais c'est la plainte de L14 — mettre ses mots (vin blanc, groseille) à côté du 83 % ; après le choix, la colonne Galaxy reste coupée (« alaxy ») sous la colonne épinglée ; tiers bas vide à 390 (0,77, D4 à la limite).

### Le parcours

- D'un écran à l'autre il retrouve sa stout (16D, IBU 60, US-05), son houblon (Idaho 7 de Suggérer à Comparer, Dryhopper, Levure, puis « nouveau » dans la frise) et ses couleurs (mêmes pictos partout, « épicé » cannelle et clou croisés). Les nombres se suivent : floral ~+22 dans Dryhopper, ~24 dans Levure, point « prévu » déplacé sur l'étape.
- Les gestes font ce qu'il attend : « + » puis « Comparer (4) » ; toucher une colonne déplace « Placer » ; glisser à 60′ fait monter l'amertume ; « Ajouter à ma bière » et « Remplacer » inscrivent ; « ‹ » abandonne le brouillon sans toucher la recette ; « Recommencer » rend la recette du départ. Bannir agit désormais sur Suggérer (code) ; un houblon déjà présent reste reproposé (réserve).
- Comparer est bien r6a, à peine amélioré.
- Thème : page blanche, gris neutres, action noire sur les sept pages, comme ses captures choisies (D106, TEINTE OK 5/5) ; les chiffres restent à chasse fixe (« 46 g », « α 13 % ») là où ses captures sont en chiffres proportionnels — il peut le remarquer, ce n'est pas un refus.

### Résumé du 23.10 pour `systeme.mjs voies`

ma-biere : ACCEPTÉ · biere : ACCEPTÉ · fiche : ACCEPTÉ · suggerer : ACCEPTÉ · comparer : ACCEPTÉ · dryhopper : ACCEPTÉ · levure : ACCEPTÉ · substituer : ACCEPTÉ

Avant publication : une capture « bannir floral → Suggérer : Bannie » dans le parcours, et le RESULTAT de p5 et `ecrans/biere/NOTE.md` remis à jour (ils décrivent encore le défaut D32).

LEÇON PROPOSÉE (23.10) : un contrôle écrit pour « pendant le geste » (D55, 80 px) laisse passer le même vide au repos ; quand une plainte vise une capture fixe, le contrôle se joue aussi à l'état de repos et à chaque retour sur l'écran. Et une correction de geste (D32) n'est prouvée que si le parcours la joue et la capture : le script doit aller dans Suggérer en état banni, pas revenir à « + » avant.
