# Ma levure : besoins du brasseur (19.11)

## Besoins classés
1. B1 — Voir QUELLE levure et COMBIEN il en a choisi, au repos, sur la ligne : nombre choisi en grand + unité, le conseil de la recette à côté en plus petit, le stock en icône, et le changer en UN geste sur place, comme la ligne d'un malt. Preuves : « je vous même pas combien et quel levure j'ai choisi » ; « je peux en UNE actions modifier ça » ; capture levure-en-ligne-1911b.jpg : seul chiffre « ≥ 15 g » (dose du fabricant) ; capture malts-en-ligne-1911.jpg : « 1,7 kg » en grand, « 62 % du grain », barre à poignée, éditeur « − 1,7 kg + » avec piste 0…3.
2. B1 bis (cause dans la donnée, à régler avant le dessin) : la recette n'a pas de quantité. doseApresChoix ne pose la dose que si advice.packs.min === advice.packs.max (port-carnet/src/ui/etapeLevure/dose.ts l.64) et doseDeLaLevure n'écrit jamais rien (l.46). Aucune mise en page ne montrera un choix qui n'est pas écrit. Le préremplissage (borne basse, conseil, rien) revient au brasseur : à lui montrer en variantes.
3. B2 — Le besoin de la recette à côté du choix, sous la forme d'une part, comme « 62 % du grain » : « couvre le besoin / sous-dosé / sur-dosé ». Ce n'est pas un deuxième gros chiffre. Preuve : « combien j'ai besoin pour ma recette » ; sur la capture malts, le « besoin » est une part, pas un conseil concurrent ; le conseil existe déjà (YeastPitchingAdvice, cité par les regards vues et métier).
4. B3 — Trois états qui ne se confondent pas : choisi (plein), conseil (petit, avec son mot « conseillé »), à choisir (vide, jamais 0, jamais un nombre d'exemple). Preuves : dose.ts l.6-7 (« une plage reste une plage », « l'inconnu n'est jamais 0 ») ; sur la capture, « ≥ 15 g » occupe la place et la taille d'un choix.
5. B4 — Choisir ou changer de levure remplit sa dose, ou dit qu'elle est à choisir : jamais une dose effacée en silence. Preuves : #132, « choisir une levure remplis aussi sa dose (gram, sachet) » ; dose.ts l.58 retire qty et unit.
6. B5 — Compter dans l'unité de l'achat (sachets d'un poids connu, g pris dans une brique, pack liquide). Ce choix revient au brasseur. Preuves : SPEC 10.11, point ouvert « poids du sachet de levure » ; sur la capture, la levure de White Labs est « vendue par Lallemand » et sa forme (sèche ou liquide) n'est pas dite : à vérifier (L14), car c'est elle qui fixe l'unité.
7. B6 — La conduite choisie lue en une ligne (19 °C · 7 j → 4 °C · 8 j), avec le conflit de la fiche (9–11 °C contre 19 °C) et « → 11 °C » au repos. Preuves : capture 19.11 ; ML-VOLETS ; INVENTAIRE.md l.17-18 et l.38 (mini profil en marches) ; 09.11 « la plage de la levure sur ta conduite: ça c'est parfait ».
8. B7 — Le bas de l'étape tient en une vue : rien de choisi derrière un volet ; offres, repères et atelier à un toucher, jamais empilés (R1). Preuves : « Toute cette partie là » ; INVENTAIRE.md l.13-14 (il reste 52 px à 390).
9. B8 — Les effets de fermentation en crans à valeur ; la rangée vide « non documentés » quitte le premier plan. Preuves : 09.11 « plus de tiole, banane, cou de girofle » ; capture : cinq puces sans valeur ; INVENTAIRE.md l.32 (5 × 40 px).
10. B9 — Changer de levure sur place, avec les levures en stock et achetables CH/FR/DE en premier. Preuves : capture (champ « Changer de levure », puce Pomona) ; 09.11 « la recherche de base doit se faire sur le premier écran ».
11. B10 — Stock : une icône, ou un « manque 1 » quand il manque. Jamais une colonne. Preuves : L04, penser-brasseur ; la ligne de malt n'a aucun stock (capture malts).
12. MOTIFS DES AUTRES VUES À REPRENDRE : nombre en mono gras + unité grise à droite de la ligne (capture malts, « 1,7 kg ») ; part sous le nom (« 62 % du grain ») ; barre à poignée teintée de la couleur de l'ingrédient, directement sur la ligne ; éditeur de la ligne active en bas (− nombre souligné en pointillé +, piste graduée avec ses bornes) ; × à droite ; bandeau Grain / OG / IBU / EBC partagé (les deux captures) ; − / + au pas, avec appui long, du houblon (Carte.tsx, d'après le regard vues).
13. DÉSACCORDS : (1) Ordre des travaux. Le regard métier corrige d'abord le domaine (dose.ts l.64, et applyYeastPitchingAdvice qui refuserait une valeur hors plage selon lui, non relu) ; le brasseur et le contradicteur greffent d'abord la ligne. Mon avis : les deux dans le même lot, sinon la maquette ment. (2) Rang du stock : 5 (vues, métier), 6 (contradicteur), 10 (brasseur). (3) Le « besoin » : un conseil chiffré pour les vues (B3), une part pour la capture malts. (4) Dose d'une lager : « ≥ 15 g » sur la capture, 23 g en exemple dans INVENTAIRE.md l.72-73, une estimation de 20 à 33 g chez le contradicteur. À mesurer avec evaluateYeastPitching sur sa recette, pas à recopier. (5) Taux ale/lager par défaut (métier) : hypothèse métier, décision du brasseur.
14. CONSTAT NEUF : les données d'exemple de r2 contredisent sa capture. INVENTAIRE.md l.74 donne « FG 1,018–1,021, ≈ 6,0–6,4 % vol (valeurs de la base, inchangées) », mais sa capture à OG 1,026 montre FG 1,006–1,007, ≈ 2,5–2,7 % vol. Une FG de 1,018 sur une OG de 1,026 n'existe pas en vrai pour une lager (L14). Toute r3 reprend les valeurs de sa capture.
15. DÉCISIONS AU BRASSEUR (non tranchées) : unité par défaut (sachets ou g) ; préremplissage au choix d'une levure ; droit de dépasser la plage du fabricant ; taux ale/lager ; parti retenu parmi les huit, montré en mini maquettes dans un artefact neuf (règle n° 1, L24).
16. Position : autre voie : huit partis de genres différents, tous jugés d'abord sur deux chiffres lus sur sa capture malts : le nombre choisi est visible au repos (oui/non), et il faut 1 geste pour le changer. Le domaine écrit la dose dans le même lot.
17. LEÇON PROPOSÉE : les données d'exemple d'une maquette se tirent de sa capture réelle et du moteur, jamais d'un inventaire précédent (r2 INVENTAIRE.md l.74 : FG 1,018 pour OG 1,026, contre 1,006 sur sa capture) ; contrôle : chaque chiffre « exemple » est confronté à la capture de base avant toute publication.

## Partis pris des maquettes r3
- v01 « 1. Jumeau du malt » : On copie la ligne Pilsner Malz (capture malts) sous le haut de v01 gardé tel quel (pastille, nom, marque, ×). À la place de « ≥ 15 g » en haut à droite : le nombre choisi, « 2 sachets » en mono gras (exemple), « ≈ 23 g » en gris dessous. Sous le nom, la part : « 100 % du besoin » (exemple), puis une barre à poignée teintée or levure, avec le besoin en repère hachuré sur la piste. En bas, l'éditeur de Plateau (− 2 sachets +, piste 0…4, crans par sachet), toujours ouvert pour la levure. Greffes de v01 : bande FG / plage-conduite / floculation et « Caler à 11 °C ». Conduite en une ligne avec le mini profil en marches (INVENTAIRE l.38). États : repos choisi ; à choisir (sa vraie recette : « à choisir » en creux et puce « Poser le conseil » ; plus de ≥ à cette place) ; après + (3 sachets, « 150 % », poignée au-delà du repère) ; stock insuffisant (icône stock barrée et « manque 1 »).
- v02 « 2. Sachets en jetons » : Dans l'unité de l'achat, on compte les sachets un par un. À droite du nom de v01 : une rangée de jetons-sachets. Les pleins sont les choisis ; ceux qui manquent au besoin sont en contour pointillé ; un petit cube (icône Pomona de v01) marque ceux qui sont en stock. Toucher le 3e jeton règle la dose à 3 : un geste, sans éditeur. Le total « 3 sachets · 34,5 g » est en mono à côté (exemple, poids du sachet non confirmé : SPEC 10.11). Greffes : bande v01, conduite en une ligne, crans d'effets (v01) derrière « Effets » à un toucher. États : repos (2 pleins, aucun pointillé) ; à choisir (que des pointillés, besoin de 2) ; après un toucher (3 pleins, le 3e marqué « au-delà du conseil ») ; stock insuffisant (2 choisis, 1 seul cube : le 2e jeton porte « à acheter ») ; cas limite de la brique de 500 g : les jetons cèdent la place à un nombre en g, à montrer.
- v03 « 3. Cellules apportées contre besoin » : Le chiffre de l'école : une seule barre horizontale sous le nom, en milliards de cellules, sur le dessin de la jauge FG hachurée de v01. Le remplissage, c'est ce que la dose choisie apporte ; un trait marque le besoin au taux 1,5 M/mL/°P (étiquette touchable, choix du brasseur ; repère ale 0,75). Le nombre choisi « 2 sachets » reste en haut à droite. Les − / + sur la barre ajoutent un sachet, la barre suit. Sert aussi aux levures liquides et au levain (mL → cellules, besoin 9 chez le métier). États : repos (barre au trait) ; à choisir (barre vide avec « besoin ≈ N G cellules ») ; après − (barre sous le trait, en or « sous-dosé, lager »). Cas limite : produit sans cellules documentées, la barre dit « fiche incomplète » au lieu de 0 (dose.ts l.7). Données : mesurées par evaluateYeastPitching sur sa recette, jamais recopiées de r2.
- v04 « 4. Grammes et sachets liés » : Une piste graduée en g sous la ligne (motif GradueSlider de Eau, piste des malts). Les crans des sachets (11,5 / 23 / 34,5 g) y sont plus marqués et la poignée s'y aimante. Un appui long libère la poignée au g près, pour une brique de 500 g. Le nombre lu en haut à droite est double, « 23 g = 2 sachets ». La zone du conseil du fabricant est en bande claire sur la piste : c'est là que vit le ≥, en petit, avec le mot « conseillé ». Greffes : haut de v01, bande v01, conduite en une ligne. États : repos (sur le cran de 2 sachets) ; à choisir (poignée absente, « à choisir » en creux) ; après glissé (30 g hors cran : « 30 g = 2,6 sachets » signale l'achat de 3) ; hors du conseil du fabricant (sous la bande : trait rouge, comme la conduite hors plage dans v01). La possibilité de dépasser la plage revient au brasseur.
- v05 « 5. Stock et achat sur la ligne » : La décision d'achat portée par la ligne, mais en une demi-ligne pour tenir L04. Le nombre choisi « 2 sachets », avec ses − / +, reste en grand. Dessous, une seule phrase courte : « 1 en stock · 1 à acheter » ; « à acheter » est un lien vers l'offre (Pomona, CH) qui sort le volet « Produit exact et offres » de la pile R1. Quand tout est en stock, la phrase cède la place à l'icône de stock seule. Greffes : puces « Changer de levure » de v01 (stock d'abord), « ↶ Annuler le changement » de la base. États : repos en stock (icône seule) ; stock insuffisant (le cas qui montre la phrase) ; après + (« 2 à acheter ») ; levure hors catalogue sans offre (« pas d'offre relevée », sans prix inventé). Risque : le stock gagne en poids, ce qui va contre L04. À montrer comme parti, pas comme défaut.
- v06 « 6. La consigne de brassage » : Sous le haut de v01, une seule phrase en grand, à la façon d'une fiche de brassage : « Ensemencer [2 sachets] à [11 °C] · [7 j] puis [4 °C] · [8 j] ». Chaque crochet est une puce touchable avec ses − / + au pas. Le nombre de sachets est le plus gros. Dose et conduite tiennent en une vue (ML-VOLETS), sans graphe au repos. Le graphe °C × jours (l5b, acquis) s'ouvre en touchant une température. Le conseil s'écrit en petit sous la puce dose (« conseillé 2 · ≥ 15 g fabricant ») ; le conflit 19 °C hors de 9–11 vient de v01, en trait rouge sous la puce. États : repos ; à choisir (puce dose en pointillé, « ? sachets ») ; après + ; conduite hors plage (puce 19 °C en rouge et « → 11 °C »). Cas réel : la conduite de la capture est à 19 °C pour une lager, et le parti la montre sans la corriger seul.
- v07 « 7. Frise J0 → fin » : Le temps du brassin. Sous le haut de v01, une frise horizontale. Avant J0, un bloc préparation : réhydratation pour une sèche, starter « facultatif » pour une liquide (base, volet Dose). À J0, le bloc ensemencement porte le nombre choisi en grand et ses − / + : un geste. Ensuite les paliers 19 °C 7 j et 4 °C 8 j, en marches, sur la bande de la plage de la fiche (l4b). Ce n'est pas v05 : la frise est le seul endroit du nombre choisi, et le coin haut droit de la carte ne montre plus aucun ≥ (le défaut de v05 était deux nombres à deux endroits). États : repos ; à choisir (J0 vide en pointillé) ; après + ; levure liquide sans starter alors que le besoin dépasse l'apport (bloc préparation en or). Les blocs se déplacent, ils ne s'empilent pas en volets.
- v08 « 8. Doses proposées en puces » : Choisir plutôt que régler : sous le nom de v01, trois puces de dose calculées pour sa recette. Par exemple « 1 sachet · ale », « 2 sachets · lager, conseillé », « 3 sachets » (valeurs à mesurer par evaluateYeastPitching, marquées « exemple » dans la maquette). Un toucher choisit, et la puce choisie devient le nombre en grand en haut à droite. Une 4e puce « autre » ouvre le − / + du parti 1 pour les cas libres (brique en g). Le « conseillé » vient du conseil réel ; s'il est une plage, deux puces sont « conseillé » et aucune n'est choisie d'office (dose.ts l.6). Greffes : bande v01, conduite en une ligne, puces « Changer de levure ». États : repos (puce 2 pleine) ; à choisir (aucune pleine : c'est sa vraie recette) ; après toucher sur 3 ; changement de levure (puces recalculées, ancienne dose rappelée : « avant : 2 sachets »).

## Avis bruts des quatre regards
### brasseur
{
 "besoins": [
  {
   "rang": 1,
   "besoin": "Voir au repos, sur la ligne de la levure, quelle levure et combien il en a choisi (sachets ou g). C'est sa décision au brassage, à lire en 3 secondes.",
   "preuve": "19.11 : « je vous même pas combien et quel levure j'ai choisi » ; « Sur la levure j'ai 0, info sur ça, 0 vision... ». Capture levure-en-ligne-1911b.jpg : le seul chiffre est « ≥ 15 g », c'est la dose du fabricant, pas un choix."
  },
  {
   "rang": 2,
   "besoin": "Voir à côté de son choix ce qu'il faut pour la recette (dose conseillée selon l'OG et le volume), comme les kg et la part du grain sur une ligne de malt.",
   "preuve": "19.11 : « pour les Malts je vois en un coup d'œil les kg et combien j'ai besoin pour ma recette ». Capture malts-en-ligne-1911.jpg : « 1,7 kg » en gros à droite, « 62 % du grain » et une barre sur la même ligne."
  },
  {
   "rang": 3,
   "besoin": "Changer la quantité en un seul geste (− / + ou curseur), sur place, sans ouvrir de volet.",
   "preuve": "19.11 : « Et je peux en UNE actions modifier ça ». Capture malts : éditeur « − 1,7 kg + » avec curseur. DEFAUTS ML-DOSE : aujourd'hui il faut ouvrir « Dose, ensemencement et starter »."
  },
  {
   "rang": 4,
   "besoin": "Choisir ou changer de levure remplit aussitôt sa dose (g, sachets) : jamais une levure sans quantité.",
   "preuve": "Ticket #132 (SPEC l. 668) : « choisir une levure remplis aussi sa dose (gram, sachet) ». Capture 19.11 : Munich Lager Yeast choisie, aucune quantité."
  },
  {
   "rang": 5,
   "besoin": "Compter dans l'unité de l'achat : des sachets dont le poids est connu, avec les grammes en équivalent.",
   "preuve": "10.11 (SPEC l. 1682) : point ouvert « poids du sachet de levure » ; pièce Safale BE-256 (SPEC l. 1350) : « 2 Stk = 2 sachet · poids du sachet non confirmé »."
  },
  {
   "rang": 6,
   "besoin": "Voir la conduite choisie (température × jours, avec la plage de la levure derrière) sans rien ouvrir, et la régler au doigt.",
   "preuve": "09.11 : « Ça j'aime beaucoup, c'est très UX UI » ; « la plage de la levure sur ta conduite: ça c'est parfait ». ML-VOLETS (19.11) : « on voit même pas en une vue, le nombre que j'ai choisi ECT... »."
  },
  {
   "rang": 7,
   "besoin": "Lire les effets de fermentation de la levure (esters, banane, girofle, thiols, épicé, effet sur le houblon) en jauges, pas en mots vides.",
   "preuve": "09.11 : « ça donne pas assez d'infos sur la levure, genre ces caractéristiques durant la fermentation, plus de tiole, banane, cou de girofle, ether, épicé... » ; l5b « effets en jauges » : « Top ! ». Capture 19.11 : cinq puces sans valeur et « non documentés »."
  },
  {
   "rang": 8,
   "besoin": "Changer de levure sur place depuis le premier écran, avec en premier les levures achetables en Suisse, en France et en Allemagne.",
   "preuve": "09.11 : « la recherche de base doit se faire sur le premier écran, comme pour malt et sucre, pas de renvoi » ; « mettre en avant en premier les levures possible à acheter en Suisse, France Allemagne »."
  },
  {
   "rang": 9,
   "besoin": "Le reste à un toucher, pas empilé : finis les huit volets repliés sous la carte.",
   "preuve": "19.11 : « v01 c'est bien mais le rest.... » ; « Toute cette partie là ». Ses mots du 18.10 (pas-de-cockpit.md) : « en premier plan les informations réellement utilise. Ensuite on peut trouver plus d'infos avec des raccords, renvoie, replis »."
  },
  {
   "rang": 10,
   "besoin": "Stock de la levure en simple icône ou badge sur la ligne, jamais au premier plan.",
   "preuve": "penser-brasseur.md : stock « Juste un petit badge » (PORTRAIT § 3). Ses mots du 19.11 ne citent pas le stock : c'est ML-DOSE (texte du pilote) qui l'ajoute, d'où ce rang bas."
  }
 ],
 "constats": [
  "Capture levure : le grand « ≥ 15 g » occupe la place où la ligne de malt montre le choix, il passe pour une quantité alors que c'est un minimum du fabricant. Le défaut vient de la position, pas seulement d'une donnée manquante.",
  "Capture malts : sur une même ligne, le nom, la quantité choisie en gros, la part et la barre. L'éditeur − / + est juste dessous. C'est le patron qu'il désigne lui-même, à reprendre pour la levure.",
  "Capture levure : « fiche · conduite 9–11 · 19 °C » avec « → 11 °C ». Une lager conduite à 19 °C est un vrai conflit de brassage. Ce signal compte et doit rester au repos (L14).",
  "Capture levure : la rangée « esters, phénols, thiols, terpènes, sucres restants » et « non documentés » prend le premier plan sans aucune valeur. C'est du texte inutile au repos (pas-de-cockpit).",
  "Selon lui, r2 a du « meilleur » mais « ça répond pas à la question 1 ». Le haut de v01 reste la base (« v01 c'est bien ») : on l'enrichit de la ligne dose, on ne la remplace pas.",
  "Le code sait déjà proposer une dose (dose.ts : doseDeLaLevure, conseil.packs) mais ne l'écrit pas dans recipe.yeast.qty au choix de la levure. L'écran tombe alors sur la dose du fabricant (MaLevure.tsx, d'après le brief, non relu).",
  "Ce choix revient au brasseur et n'est pas tranché ici : l'unité par défaut (sachets ou g) et la forme du geste (− / + ou curseur). Il faut le lui montrer en mini maquettes, dans un artefact neuf.",
  "Position : autre voie. Ne pas refaire tout l'écran : greffer sur la carte de v01 une ligne dose sur le patron Malts (choisi contre besoin, − / +), remplie au choix de la levure (#132), et contrôlée par ML-DOSE avant d'y mettre un seul volet."
 ]
}

### vues
{
 "constats": [
  "Capture Malts (ouverte) : sur chaque ligne, nombre en grand en mono + « kg » (Pilsner Malz 1,7 kg), « 62 % du grain », barre à poignée teintée de la couleur du malt. Pastille, part et barre se lisent sans rien ouvrir. Ligne.tsx:129-135 (champ kg), 99-103 (part), 152-187 (barre tirée).",
  "Capture Malts : le total est en haut (« Grain 2,75 kg ») et sous les lignes un éditeur « − 1,7 kg + » avec piste graduée 0…3. L'éditeur est toujours montré pour la ligne choisie : Plateau.tsx:80-98, ChampLigne.tsx (saisie directe, ↑↓ au cran).",
  "Un geste = un changement, à trois endroits : taper le nombre (ChampLigne), tirer la barre (Ligne.tsx:158-164, poser() écrit à chaque mouvement, Échap/annulation rend la valeur d'avant 165-174), − / + au cran (Plateau.tsx:80, 87). Le houblon pareil : « − 46 g + » au pas de 2 g, appui long qui répète (hopIndex/maBiere/Carte.tsx:36, 139-147, 54-68). Tout est dans la ligne, sans volet.",
  "Le « besoin de la recette » du malt est la quantité choisie elle-même, plus sa part (« 62 % du grain ») et le total du bandeau. Aucun conseil à côté : il n'y a pas de plage fabricant. Le stock n'est pas sur la ligne de malt : il est dans l'ajout (« 12,5 kg en stock », Ajout.tsx:39-40). Sur le houblon, le stock est une icône sur la carte (Carte.tsx:3, légende 284). La Levure n'a pas d'icône de stock sur sa carte (le Package n'est que dans les tuiles de recherche, MaLevure.tsx:271).",
  "Levure, capture ouverte : « ≥ 15 g » est le plus gros chiffre de la carte, mais ce n'est pas un choix du brasseur. C'est la dose du fabricant au volume (doseDuFabricant, MaLevure.tsx:96-98 ; texte 361). Aucune unité de recette, aucun total, aucune barre, aucun − / +. Le chiffre est de même taille et de même style qu'un choix : il se lit comme un choix et n'en est pas un.",
  "Dans MaLevure.tsx:356-366, trois sources se chaînent sans se distinguer visuellement : prévue (recipe.yeast.qty), plage de sachets (conseil.packs), dose fabricant, puis « ? ». Le bouton lv-dose (l.400) n'a qu'une seule forme et ne dit pas laquelle des trois on lit (seul data-dose le sait). Dose.ts:6 pose que « une plage reste une plage » : c'est juste, mais la plage est montrée comme valeur.",
  "Pour changer la dose, le seul geste est un toucher sur lv-dose qui ouvre le repli « Dose, ensemencement et starter » (onDose ; EtapeLevure.tsx:238, repli fermé par défaut). Ce n'est pas un − / +. YeastPitchingPanel.tsx:515-520 montre que la quantité (yeast.qty) vient d'une saisie à part et « le conseil ne la remplit jamais seul ». Dans Malts, un geste suffit ; ici il faut ouvrir, comprendre, saisir.",
  "Le moteur a déjà de quoi montrer le « besoin » : YeastPitchingAdvice (yeastPitching.ts:77-95) porte packs, range, plannedPacks, availableCellsBillion, balanceCellsBillion, packsToBuy, surplus. dose.ts:47-50 les expose déjà à l'écran (doseDeLaLevure). Rien de neuf à calculer : ce qui manque, c'est de les mettre sur la ligne, à côté d'une quantité réellement choisie. Seul garde-fou : l'inconnu n'est jamais 0 (dose.ts:7), donc une dose non choisie doit se dire « à choisir », pas un nombre."
 ],
 "besoins": [
  {
   "besoin": "B1. Lire combien j'ai CHOISI de levure, en un coup d'œil : nombre en grand + unité (sachets ou g), sur la ligne de la levure. Aujourd'hui rien n'est choisi tant que yeast.qty est vide : la carte montre la dose du fabricant (« ≥ 15 g ») comme si c'était un choix.",
   "preuve": "MaLevure.tsx:356-366 (prevu / sachets / fabricant / « ? »), 400 (bouton lv-dose) ; capture levure-en-ligne-1911b.jpg : « ≥ 15 g », aucun choix. Modèle : Ligne.tsx:129-135 (« 1,7 kg » en grand), capture malts. Défaut ML-DOSE.",
   "rang": 1
  },
  {
   "besoin": "B2. Changer cette quantité en UN geste, sur la ligne, sans ouvrir de volet : − / + au pas du sachet (ou du g), curseur, ou nombre tapé. Doit couvrir clavier et appui long.",
   "preuve": "Aujourd'hui onDose ouvre le repli « Dose, ensemencement et starter » (EtapeLevure.tsx:238 ; MaLevure.tsx:400). Malts : Ligne.tsx:129-187 et Plateau.tsx:80-98 ; Houblon : Carte.tsx:36, 54-68, 139-147 (− / + au pas de 2 g, appui long). Citation : « Et je peux en UNE actions modifier ça ».",
   "rang": 2
  },
  {
   "besoin": "B3. Voir le besoin de la recette à côté du choix : combien il en faut pour CE moût (volume, OG), la plage de sachets, et si mon choix la couvre (juste / sous-dosé / sur-dosé). Un choix + une règle visible, pas deux chiffres concurrents.",
   "preuve": "Le conseil existe déjà : YeastPitchingAdvice (yeastPitching.ts:77-95 : packs, range, plannedPacks, balanceCellsBillion) ; dose.ts:47-50. Il est montré comme valeur au lieu de l'être comme repère. Malts : « 62 % du grain » + total « Grain 2,75 kg » en bandeau (Ligne.tsx:99-103). Citation : « combien j'ai besoin pour ma recette ».",
   "rang": 3
  },
  {
   "besoin": "B4. Distinguer sans ambiguïté ce que je lis : « choisi » (plein), « conseil du fabricant » (plage ou repère, pas plein), « à choisir » (vide). L'inconnu n'est jamais 0 et une plage n'est jamais présentée comme un choix.",
   "preuve": "Trois sources dans un même bouton : MaLevure.tsx:356-366 ; data-dose='prevue'|'sachets'|'fabricant'|'inconnue' existe en data mais pas à l'écran (400). Règle : dose.ts:6-7. Le « ≥ » de la capture est de la même taille que le chiffre d'un choix.",
   "rang": 4
  },
  {
   "besoin": "B5. Savoir si j'ai cette levure en stock, et en quelle quantité, avant de la verser : icône de stock sur la ligne (comme le houblon), « n en stock » au toucher ou à la saisie. Savoir aussi s'il faut en acheter (packsToBuy).",
   "preuve": "Levure : la ligne n'a aucun indice de stock (capture ; le Package n'est que dans les tuiles de recherche, MaLevure.tsx:271). Houblon : « stock en icône » (Carte.tsx:3, 284). Malts : « 12,5 kg en stock » dans l'ajout (Ajout.tsx:39-40). Le moteur donne packsToBuy et availableCellsBillion (yeastPitching.ts:90-89).",
   "rang": 5
  },
  {
   "besoin": "B6. Voir ma part dans la recette, comme « 62 % du grain » : combien du besoin ma dose couvre (barre à poignée, plage hachurée du conseil, poignée = mon choix).",
   "preuve": "Malts : barre teintée et poignée, part en % (Ligne.tsx:75-79, 99-103, 152-187). Levure : un lv-mini décoratif aria-hidden avec une plage figée à left 8 % / right 8 %, qui ne représente aucune donnée (MaLevure.tsx:408). La piste graduée existe aussi côté Eau (water/GradueSlider.tsx:67) et Paliers (paliers/CourbeEmpatage.tsx:226, 234).",
   "rang": 6
  },
  {
   "besoin": "B7. Que ma dose bouge avec la recette : changer le volume ou l'OG met à jour le besoin sans que mon choix s'efface, et le dit si mon choix sort de la plage. Changer de levure ne perd pas ma quantité sans le dire.",
   "preuve": "dose.ts:57-67 (doseApresChoix : la dose n'est reposée que si le conseil est un nombre exact de sachets ; sinon vide). Malts : la part se recalcule à chaque setKg (Ligne.tsx:88-93). Eau : volumes en GradueSlider (WaterVolumes.tsx:153).",
   "rang": 7
  },
  {
   "besoin": "B8. Le bas de l'étape ne cache pas ce que j'ai choisi : dose, température et durée de conduite, levure se lisent sans rien ouvrir. Ce qui reste en volet est du savoir, pas une valeur choisie.",
   "preuve": "Défaut ML-VOLETS ; EtapeLevure.tsx:51 (volets sous « Plus », « la dose reste dehors ») et 238 (dose en repli). Citation : « on voit même pas en une vue, le nombre que j'ai choisi ». Conduite : Paliers montre ses valeurs sur la courbe (CourbeEmpatage.tsx:149-151).",
   "rang": 8
  },
  {
   "besoin": "B9. Cohérence d'une étape à l'autre : même forme de ligne pour toute quantité de la recette (nom, nombre en grand + unité, part, geste), pour que la Levure se lise comme les Malts et les Houblons.",
   "preuve": "Motifs partagés : nombre mono + unité (Ligne.tsx:129-135 ; Carte.tsx dose g), − / + (Plateau.tsx:80,87 ; Carte.tsx:54-68), barre à poignée (Ligne.tsx:152-187 ; GradueSlider.tsx), × retirer (Ligne.tsx:190). La Levure n'a que × (MaLevure.tsx:401).",
   "rang": 9
  },
  {
   "besoin": "B10. Garder le meilleur des 8 versions r2 (FG, plage de température, floculation, effets), mais sous la ligne de quantité, sans la remplacer : la quantité d'abord, l'information ensuite.",
   "preuve": "Citations : « Il y a vraiment du meilleur dans les mini maquettes mais ça répond pas à la question 1 » ; « v01 c'est bien ». La bande FG / °C / floculation (MaLevure.tsx:~420-) est bien lue en capture ; la quantité manque. Règle n° 1 : base = v01 choisie.",
   "rang": 10
  }
 ]
}

### metier
{
 "besoins": [
  {
   "rang": 1,
   "besoin": "Voir et régler en un geste la quantité choisie, dans l'unité du conditionnement réel : sachets de 11,5 g, g pris dans une brique de 500 g, pack liquide ou mL de levain repris. Fréquence : chaque recette. Coût d'une erreur : élevé (sous-ensemencement d'une lager : latence, diacétyle, esters).",
   "preuve": "Sa capture levure-en-ligne-1911b.jpg montre « ≥ 15 g » et aucune quantité prévue. MaLevure.tsx l.356-362 n'affiche une quantité que si recipe.yeast.qty existe ; sinon une plage, ou « ≥ » tiré de la fiche du fabricant. ML-DOSE. Ses mots : « je peux en UNE actions modifier ça »."
  },
  {
   "rang": 2,
   "besoin": "Le besoin de la recette, affiché à côté de la quantité choisie, pour juger « assez / trop peu » : en g pour une levure sèche, en milliards de cellules pour une liquide, selon le volume et les °P.",
   "preuve": "evaluateYeastPitching (yeastPitching.ts l.116 et l.129) calcule range = dose g/hL × volume, ou taux × L × °P. Le résultat n'est montré que comme plage, sans écart avec ce qui est choisi. Ses mots : « combien j'ai besoin pour ma recette »."
  },
  {
   "rang": 3,
   "besoin": "Un taux d'ensemencement par défaut, ale ou lager (repère d'école : environ 0,75 M/mL/°P pour une ale, 1,5 pour une lager), déduit de la plage de température de la souche et modifiable. Sans lui, une levure liquide n'a jamais de besoin calculé. Décision qui revient au brasseur : la valeur du taux est une hypothèse métier.",
   "preuve": "yeastPitching.ts l.126 : sans plan.rate, rien n'est calculé (« aucun taux universel n'est présumé »). La capture montre une lager (fiche 9–11 °C) : c'est le cas où le taux double."
  },
  {
   "rang": 4,
   "besoin": "Quelle levure exactement : souche avec son code, forme (sèche ou liquide) et conditionnement. C'est le format qui fixe l'unité de la quantité.",
   "preuve": "Sur la capture, la sous-ligne dit « White Labs · vendue par Lallemand » mais pas la forme. identiteLevure retire le conditionnement (« 500g ») du nom (MaLevure.tsx l.60-61 et l.76). Le champ YeastSpec.strain existe (types/index.ts l.286). Ses mots : « combien et quel levure »."
  },
  {
   "rang": 5,
   "besoin": "L'état du stock sur la ligne : combien j'en ai, et combien de sachets acheter.",
   "preuve": "evaluateYeastPitching calcule packsToBuy à partir du stock (l.143-157), mais doseDeLaLevure l'appelle sans stock (dose.ts l.49). La valeur n'est donc jamais calculée sur la carte. Le contrôle ML-DOSE exige « l'état du stock »."
  },
  {
   "rang": 6,
   "besoin": "Température de conduite comparée à la plage de la souche, recalable en un geste. C'est un acquis à garder.",
   "preuve": "Capture : « 9–11 · 19 °C » et le bouton « → 11 °C » (MaLevure.tsx l.369-381). Fréquence élevée, coût élevé : une lager conduite à 19 °C."
  },
  {
   "rang": 7,
   "besoin": "Durée et paliers de conduite lisibles sans ouvrir de volet.",
   "preuve": "ML-VOLETS : « la dose, la température et la durée de conduite choisies se lisent sans rien ouvrir ». La conduite vit dans YeastRecipePlan, sous le champ de recherche (MaLevure.tsx l.451-455)."
  },
  {
   "rang": 8,
   "besoin": "Préparation adaptée à la forme : réhydratation pour une sèche, starter avec échéance pour une liquide.",
   "preuve": "createYeastPreparation refuse les levures sèches (yeastPitching.ts l.175). Rien ne guide la réhydratation."
  },
  {
   "rang": 9,
   "besoin": "Viabilité selon la date du lot et reprise de levain (mL de levain converti en cellules). Moins fréquent, coût moyen à élevé quand on repique.",
   "preuve": "yeastPitching.ts l.134 : « no ageing curve is invented ». La forme « levain » existe (types/index.ts l.287) mais aucune conversion mL → cellules."
  },
  {
   "rang": 10,
   "besoin": "Atténuation et FG prévues. Déjà montrées, à garder.",
   "preuve": "Capture : FG 1,006–1,007, ≈ 2,5–2,7 % vol (evaluation.fg, MaLevure.tsx l.347)."
  }
 ],
 "constats": [
  "Cause racine dans la donnée : doseApresChoix ne pose la dose que si packs.min === packs.max (dose.ts l.64). Dans la plupart des cas, la recette n'a donc aucune quantité choisie, et aucune mise en page ne peut montrer ce qui n'est pas écrit.",
  "applyYeastPitchingAdvice (yeastPitching.ts l.163-164) écrit seulement des « sachet » ou « pack » et refuse toute valeur hors de la plage. Impossible d'écrire 20 g pris dans une brique, ou une double dose pour une lager : la règle « UNE action » est bloquée par le domaine.",
  "« ≥ 15 g » vient de doseDuFabricant, qui lit la fiche et n'écrit jamais dans la recette (MaLevure.tsx l.92-95 et l.360). C'est un plancher, pas un choix.",
  "Le bouton de dose ne fait qu'ouvrir un volet (onDose, MaLevure.tsx l.400-402). Il n'y a ni − / + ni saisie sur la ligne, contrairement aux malts (− 1,7 kg +, malts-en-ligne-1911.jpg).",
  "Données présentes : produit, format, plage fabricant g/hL, cellules viables par pack, moût estimé (volume et SG), lot avec cellules viables, stock relié. Données absentes : taux par défaut ale/lager, date et viabilité du lot, rendement d'un levain, unité grammes pour une brique.",
  "Pour concevoir : la quantité devient un champ de la recette (qty + unit du format réel), avec à côté le besoin calculé et le stock. Toute préremplissage (borne basse de la plage ?) revient au brasseur et doit lui être montré en variantes, pas tranché ici.",
  "Le taux par défaut et le droit de dépasser la plage du fabricant sont des décisions de métier qui reviennent au brasseur ; à signaler dans le conseil, pas à coder en silence.",
  "Position : autre voie. Corriger d'abord le domaine (la quantité écrite et modifiable en g ou en sachets, le stock passé au calcul), puis seulement la carte. LEÇON PROPOSÉE : avant de redessiner un écran où « on ne voit pas la valeur », vérifier que le domaine écrit bien cette valeur (dose.ts l.64) ; sinon le défaut est dans la donnée, pas dans la mise en page."
 ]
}

### contradicteur
{
 "besoins": [
  {
   "rang": 1,
   "besoin": "Voir LE nombre choisi (sachets ou g) en grand sur la ligne de la levure, au repos, sans rien ouvrir.",
   "preuve": "« je vous même pas combien et quel levure j'ai choisi » ; capture levure-en-ligne-1911b.jpg : seul nombre « ≥ 15 g » ; MaLevure.tsx l.361 : sans recipe.yeast.qty, la case affiche la plage de sachets ou la dose fabricant à la place du nombre choisi."
  },
  {
   "rang": 2,
   "besoin": "Le changer en UN geste sur la ligne même (− / + par sachet ou curseur), comme Malts.",
   "preuve": "« je peux en UNE actions modifier ça » ; malts-en-ligne-1911.jpg : curseur sur chaque ligne + éditeur − 1,7 kg + ; MaLevure.tsx l.400-401 : la dose est un bouton onDose qui ouvre le volet « Dose, ensemencement et starter » (EtapeLevure.tsx l.218, vaAu('dose')), donc au moins deux gestes."
  },
  {
   "rang": 3,
   "besoin": "Le conseil ne prend jamais la place du choix : à côté ou en repère sur la piste, plus petit, avec son mot (« conseillé ≥ 15 g »).",
   "preuve": "ML-DOSE : « ≥ 15 g », dose du fabricant, sans quantité choisie ; etapeLevure.css l.186-188 : prévue, sachets et fabricant ont le même emplacement et presque la même taille (1,625 rem contre 1,375 rem). Seul le ≥ les distingue."
  },
  {
   "rang": 4,
   "besoin": "Sans dose choisie, le dire franchement (« à choisir ») et proposer le conseil en un toucher. Ne jamais afficher un chiffre d'exemple comme s'il était le sien.",
   "preuve": "Sa recette en ligne n'a aucune qty (capture : « ≥ 15 g ») ; r2 montre « 23 g » partout, marqué « exemple » (INVENTAIRE.md, données d'exemple). v03b montre 55 g ≥ 49 : les nombres changent d'une version à l'autre, ils sont inventés."
  },
  {
   "rang": 5,
   "besoin": "Garder la dose quand on change de levure, ou prévenir qu'elle saute.",
   "preuve": "dose.ts l.57-65 doseApresChoix : la qty est retirée et n'est reposée que si packs.min === packs.max ; sinon elle reste vide sans rien dire."
  },
  {
   "rang": 6,
   "besoin": "Le stock seulement en icône (assez / manque N sachets), pas en colonne de plus.",
   "preuve": "ML-DOSE exige « l'état du stock » ; L04 / [[penser-brasseur]] : « stock en icône seulement ». Ligne.tsx (Malts) ne montre aucun stock : la référence qu'il cite n'en a pas."
  },
  {
   "rang": 7,
   "besoin": "Le nom de la levure choisie reste le titre de la ligne, lisible au premier écran, avec la dose sur la même ligne.",
   "preuve": "« combien et quel levure » ; v01 repos 390 : nom et ≥ 15 g en haut, mais la carte occupe y 90 → 548 (INVENTAIRE.md l.13)."
  },
  {
   "rang": 8,
   "besoin": "La conduite choisie (19 °C · 7 j → 4 °C · 8 j) se lit sans rien ouvrir, en une ligne, sans revenir aux huit volets.",
   "preuve": "ML-VOLETS : « on voit même pas en une vue, le nombre que j'ai choisi ECT... » ; « Toute cette partie là » ; v01 ne montre qu'un seul point, 19 °C (INVENTAIRE.md l.17-18)."
  },
  {
   "rang": 9,
   "besoin": "Vérifier que la dose conseillée existe en vrai pour une lager (lager ≈ 2 fois la dose d'une ale) avant de la montrer comme repère.",
   "preuve": "L14 « est-ce que ça existe en vrai ? » ; capture : lager, 20 L, OG 1,026, « ≥ 15 g » ; INVENTAIRE.md donne 23 g à 1,5 M/mL/°P. Les deux ne concordent pas. Mon estimation (≈ 20 à 33 g de sèche) est à vérifier par yeastPitching.ts."
  },
  {
   "rang": 10,
   "besoin": "Unité du compteur (sachets ou grammes, pas de 1 sachet ou de 1 g) : choix du brasseur, à montrer en mini maquettes, pas à trancher.",
   "preuve": "CLAUDE.md règle n° 1 et L24 ; MaLevure.tsx l.362 : l'unité vient de la qty prévue ou devient « sachets » ; v02 montre « 23 g » et « 2 sachets » ensemble."
  }
 ],
 "constats": [
  "Méthode : je n'ai ni Bash ni node, donc aucune capture neuve. J'ai ouvert celles qui existent : r2/cap/v01-repos-390, v02-A-390, v05-A-repos-390, v03b-vue-390. Le reste vient d'une lecture par grep du HTML de v04, v06, v07 et v08. À reprendre en capture par le pilote.",
  "v01 (base et r2) : le seul nombre est « ≥ 15 g », le conseil du fabricant. Aucun nombre choisi, aucun − / +. Au moins deux gestes (bouton dose, puis volet).",
  "v02 : la plus proche. « 23 g » en grand, « ≥ 15 conseillé · 2 sachets » dessous, le choix bien séparé du conseil. Mais aucun geste sur place, pas de stock, et 23 g est un exemple.",
  "v05 : 23 g se trouve en bas, sur le graphe de conduite (« 23 g » à J0), et « ≥ 15 g » reste en haut à droite de la carte. Deux nombres à deux endroits, on les confond. v06 : même « 23 g / ≥ 15 » (aria-label), réglage sur un écran B séparé.",
  "v07 et v08 : « dose choisie 23 g » visible, mais le toucher ouvre une feuille basse (v07) ou un panneau « dose ouverte » avec − sachet + (v08 l.490-496). Deux gestes, pas un. v03b : « 55 g ≥ 49 ⌄ », un menu à chevron, et des nombres différents des autres versions.",
  "Cause racine dans le code, pas dans le dessin : MaLevure.tsx l.355-366 met le choix, la plage de sachets et la dose du fabricant dans la même case. Sa recette n'a pas de qty. Toute maquette qui montre 23 g ment sur sa vraie recette tant que la dose n'est pas posée.",
  "Pièges d'une solution naïve : (a) cockpit, si on ajoute besoin, stock, cellules et starter sur la ligne ; Malts n'a que nom, kg, %, curseur. (b) Choix et conseil au même endroit et de même taille. (c) Un chiffre d'exemple pris pour le sien. (d) Stock caché derrière un volet, ou au contraire mis en avant contre L04. (e) Une dose effacée en silence au changement de levure (dose.ts l.57-65).",
  "Position : autre voie. Copier la ligne de Malts (nom, nombre choisi, curseur ou − / + par sachet, repère « conseillé » sur la piste, icône de stock), au-dessus de v01 gardée telle quelle, et corriger d'abord la case de MaLevure.tsx. L'unité (sachets ou g) est son choix, en mini maquettes. LEÇON PROPOSÉE : quand il cite un écran de référence (« pour les Malts… »), le brief compte d'abord, sur la capture de cet écran, le nombre visible et les gestes pour le changer, et chaque variante est jugée sur ces deux chiffres avant tout le reste (r2 a visé « une vue », pas « UNE action »)."
 ]
}
