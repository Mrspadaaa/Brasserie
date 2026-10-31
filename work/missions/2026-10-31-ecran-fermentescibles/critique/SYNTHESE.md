OK — tri : r4, z2, u2

# Tri du panel v0 — Malts/sucres 2/7 (critique calibré, 31.10)

Jugé à la place du brasseur, portrait v2 (88 % / 75 %). Captures ouvertes : les 12 premiers écrans de `panel-v0.html`, puis
`-couleurs` (r2, r3, r4, z2, z3, u3, u4), `-sucre` (r4, z2, z3, z4), 8 grains (r1, r2, r3, r4, u2, u3, u4), saisie et clavier
(r1 geste-ajout, z1 saisie, u1 clavier-après, u2 clavier-pendant), z4 glisser-après, r2 ordinateur. Références : la baseline
`fermentescibles-vide-390.png` et sa langue r4-a.

## Niveau du panel
- **Pas de relance globale.** Huit formes réellement distinctes (balance, curseurs sur règle commune, colonne, verre en couches, pavés,
  frise des moments, verre + échelle de teintes, sacs), la baseline suivie partout (en-tête, fil, bandeau, pied, +, familles, masse à 0,
  clavier joué dans les trois séries), les données honnêtes partout (« ? », EBC « — », « repère »). C'est au-dessus du lot 22 et au niveau
  des premiers écrans du lot 21 : il verra tout.
- `controle-panel` : **r ECHEC** (r1 à 0,45), **z ECHEC** (z1 0,40, z4 0,33), **u non lancé** (à rejouer). Les trois froides sont les
  planchers attendus ; z4 est vide par ses données (tout à l'empâtage). Aucune série n'est restée sur ses exemples : toutes montrent sa
  recette, comme le brief l'impose.
- **Manque mécanique** : la série z n'a aucune capture à 8 grains (« ~1,0 écran » est une estimation de la NOTE, pas une preuve, L12).
  À produire avant la passe 2 : `z1..z4` à 8 grains, et `controle-panel` sur `u1..u4`.
- Aucun REJET : au tri, le classement ordonne, il n'écarte rien.

## Garde-fous (vérifiés sur les captures et les RESULTAT)
| id | clavier nom → Entrée → masse | « ? » / EBC « — » / « repère » | mots | 8 grains (D5) |
|---|---|---|---|---|
| r1 | joué (`r1-geste-ajout`, Carapils 0,30) | oui / oui / oui | 68 | 1,03 vu |
| r2 | joué (capturer.mjs) | oui / oui / oui | 65 | 1,03 vu |
| r3 | joué | oui / oui / oui | 64 | 0,96 vu |
| r4 | joué | oui / oui / oui | 69 | 1,01 vu |
| z1 | joué (`z1-saisie`, focus masse) | oui / oui / oui | 76 | **non capturé** |
| z2 | joué | oui / oui / oui | 55 | **non capturé** |
| z3 | joué | oui / oui / oui | 59 | **non capturé** |
| z4 | joué | oui / oui / oui | 57 | **non capturé** |
| u1 | joué (`cap-clavier-apres`) | oui / oui / replié (absent) | 58 | 0,86 |
| u2 | joué (`cap-clavier-pendant`, aperçu) | oui / oui / replié | 57 | 1,01 vu |
| u3 | joué | oui / oui / replié | 59 | 1,04 vu, **le + flottant recouvre le champ d'ajout** (D164) |
| u4 | joué | oui / oui / replié | 55 | 1,01 vu |

Aucun cockpit au repos. Aucune phrase d'aide au repos ; l'avertissement lactose n'apparaît qu'avec un lactose (acquis J5).

## Classement
Verdicts dans son échelle : « très bien » (il garde), « moyen » (idée + un défaut qui gêne), « très mauvais » (rien d'utilisable ou refus
explicite rejoué). Aucun très mauvais dans ce panel.

| rang | id | verdict | raison | phrase prédite |
|---|---|---|---|---|
| 1 | r4 | très bien | Le ticket calme (nom, moment, part en barre, masse en mono) et un seul instrument sous le pouce : la grande lecture tapable de r4-a, − +, la règle qui défile. L'ajout arrive sur le plateau à 0 : « je pèse ». 8 grains à 1,01. | « Le plateau de pesée, ça c'est vachement bien, je pèse mon malt comme à la balance. Mais le noir prend la moitié de l'écran, et il faut toucher la ligne pour changer. » |
| 2 | z2 | très bien | En trois secondes : un verre, trois couches à leur part, hachurées « ? », reliées à leur ligne ; renseignées, la bière devient paille et l'EBC ~7,6. 55 mots. | « Le verre avec les couches, je comprends tout de suite ce que j'ai. Manque la couleur mais c'est ma recette. Les trois cartes EBC en bas, c'est à mettre sur la ligne. » |
| 3 | u3 | très bien | Le grand verre hachuré « ? », l'échelle des teintes avec la plage du style (6–14) et le mot « Paille » : la relation au style, qu'il retient. La règle des teintes pose la couleur au doigt. Liste nette dessous. | « Le verre et l'échelle avec la plage du style, très très bien. Mais le verre me dit rien des quantités, c'est que la couleur. » |
| 4 | r3 | très bien | La colonne graduée en kg, une couche par malt, le verre au sommet : le plus informatif (masse, part, couleur, bière). Mais le Pilsner est en bas et les étiquettes flottent avec des fils courbes ; à 8 grains, lisible mais tordu. | « La colonne donne bien, on voit tout. Mais le Pilsner en bas ??? et les traits qui partent de travers avec 8 malts. » |
| 5 | r2 | moyen | Sa langue r4-a ligne par ligne, les longueurs se comparent. Mais la règle commune 0–6 kg écrase 0,3 kg, et la grande barre hachurée du haut ne dit rien tant que les couleurs manquent (c'est son cas). Deux lignes par malt. | « C'est mes curseurs, pas mal. Mais la barre hachurée en haut sert à quoi, et 0,3 kg on voit rien sur le curseur. » |
| 6 | u2 | moyen | « pils 5 » : nom et masse d'un trait, l'aperçu ambré montre la ligne avant Entrée ; au PC, c'est mot pour mot sa demande (l. 1279). Au téléphone, la grammaire ne se devine pas ; la facture à points fait papier. | « Taper « pils 5 » et c'est posé, c'est exactement ce que je voulais au PC. Les pointillés comme une facture, bof, mais la liste est claire. » |
| 7 | u4 | moyen | Les sacs disent la proportion sans lire, l'étagère de sacs colorés est le meilleur rayon de stock du panel. Mais « un sac = 1 kg » sort de nulle part (ses sacs font 25 kg) ; 0,1 kg n'est qu'un fond de sac. | « Les sacs c'est parlant, et l'étagère j'aime bien. Mais 5 sacs de 1 kg ça sort de nulle part, mes sacs font 25. » |
| 8 | z3 | moyen | Les pavés à l'aire de la part : grand et immédiat, la couleur remplit l'écran. Mais trois pavés presque vides, et à 8 grains les petits perdent le moment ; à 1280 la surface s'étire. | « Les pavés c'est grand, on voit la proportion direct. Mais c'est beaucoup de jaune pour rien, et à 8 malts c'est illisible. » |
| 9 | z4 | moyen | Son rail appliqué aux moments, la puce glisse, J+n sur la règle des jours : malin, et le glisser est joué. Mais deux moments sur trois sont vides sur sa recette (0,33) : l'écran répond à une question qu'il ne se pose pas ici. | « Le rail des moments pour les malts, c'est malin. Mais tout est à l'empâtage, c'est vide. » |
| 10 | r1 | moyen | La baseline nettoyée : familles en segments, − champ +, barre de part, rayon ouvert. Propre, rien de plus ; 0,45 de remplissage. | « C'est propre, c'est la base avec les familles. Rien de plus. » |
| 11 | u1 | moyen | Le registre dont la dernière ligne attend : juste, le doublon refusé est un bon détail, mais la moitié basse est blanche et la marque « 3 couleurs » est petite. | « Correct, c'est la liste actuelle en mieux. Tu t'es trop limité. » |
| 12 | z1 | moyen | Même info écrite quatre fois (« à renseigner » ×3 + bandeau), cartes Rendement et Volume au repos qui n'ajoutent rien à cette étape, 0,40 de remplissage. La ligne « Créer « Dextrose » · sucre : à l'ébullition » est le bon détail. | « Propre mais la moitié de l'écran est vide, et « à renseigner » partout, c'est de l'info pour rien. » |

## Candidates
Trois, une par approche : le réglage (r4), la composition dessinée (z2, qui absorbe r3 et u3), l'ajout au clavier (u2). u3 et r3 sont
plus haut que u2 au classement, mais ils sont la même famille que z2 ; u2 porte l'axe A3, sa demande explicite.

### r4 — la balance (réglage, sa langue r4-a)
- Greffes : barre de composition fine (8 px) en teintes sous le bandeau (r2) ; étagère de sacs colorés comme rayon d'habituels (u4) ;
  « pils 5 » accepté dans le champ, l'aperçu avant Entrée (u2) ; J+n sur une règle des jours dans le plateau quand le moment est
  fermentation (z4).
- Corrections : 1) le plateau noir : le réduire d'un tiers (lecture 40 px, règle 36 px) ou le passer en clair, pour qu'il ne pèse pas plus
  que le ticket ; 2) le plateau suit la ligne touchée, mais la ligne active doit se voir sans chercher (cerne + teinte) et le plateau doit
  rester sous le pouce quand la liste fait 8 lignes (collé au pied) ; 3) la pastille « ? » reste sur le plateau : un toucher dessus ouvre
  la couleur sur place (r1 `geste-teinte`).

### z2 — le verre en couches (composition et couleur)
- Greffes : la graduation en kg le long du verre et l'ajout dans le vide au-dessus de la mousse (r3) ; l'échelle des teintes avec la plage
  du style et le mot « Paille », et la règle des teintes pour poser la couleur au doigt (u3) ; le plateau de r4 comme réglage de la couche
  touchée ; « Créer « X » · sucre : à l'ébullition » (z1).
- Corrections : 1) les trois cartes « Pilsner Malz 3,5 EBC » sous le verre disparaissent, l'EBC va sur la ligne, dans la pastille
  (chaque chiffre une fois, J4) ; 2) retirer la carte « Volume 30 L » (chiffre d'Identité, inutile ici) ; 3) le verre grandit avec la liste
  et une couche < 18 px garde son « ? » dans la marge : à prouver par la capture à 8 grains, absente aujourd'hui.

### u2 — nom et masse d'un trait (ajout, PC et téléphone)
- Greffes : les 5 familles en segments sous le champ (r1, z1) au lieu de la pastille qui tourne ; l'étagère de sacs colorés (u4) à la
  place des puces ; la barre de composition en teintes (r2) sous le bandeau pour remplir le premier écran ; la marque « 3 couleurs à
  renseigner » qui ouvre la première et passe à la suivante par Entrée (u1).
- Corrections : 1) au téléphone, montrer la grammaire sans l'exemple : le placeholder alterne « Nom, puis Entrée » / « Nom 5 kg », et
  l'aperçu ambré s'affiche dès la première lettre ; 2) la facture à points : garder l'alignement, ôter les points (ou un filet) : il dira
  « papier » ; 3) remplir le premier écran (0,65) : masse en grand tapable et barre de part sous le nom, comme le ticket de r4.

## Greffes
| idée | id d'origine | candidate qui la reçoit |
|---|---|---|
| Graduation kg le long de la figure ; l'ajout vit dans le vide au-dessus (« on remplit la cuve ») | r3 | z2 |
| Échelle des teintes 0–40 EBC avec la plage du style et le mot de la teinte ; règle des teintes tactile pour poser la couleur | u3 | z2 (et r4, repliée sous le bandeau) |
| Plateau de pesée : grande lecture, − +, règle qui défile, l'ajout arrive à 0 | r4 | z2 (couche touchée) |
| Barre de composition en teintes, hachurée où la couleur manque, sucre en pointillé | r2 | r4, u2 |
| Étagère de sacs du stock, sac à la couleur du malt, hachuré « ? » | u4 | r4, u2 |
| « pils 5 » et l'aperçu ambré avant Entrée ; « déjà dans la recette, la masse change » | u2 | r4, z2 |
| 5 familles en segments sous le champ (choix visible, pas une pastille qui tourne) | r1, z1 | u2 |
| Ligne de création qui dit famille et moment : « Créer « Dextrose » · sucre : à l'ébullition » | z1 | z2, r4 |
| Règle des jours J+0…14 pour la fermentation, J+n tapable | z4 | r4 (dans le plateau), z2 |
| Doublon refusé : le même malt renvoie à sa masse | u1 | les trois |
| Marque « n couleurs à renseigner » qui ouvre la première ; Entrée passe à la suivante | u1, z1 | les trois |
| Pastille « ? » → champ EBC sur place, la pastille et la barre prennent la teinte | r1 | r4, u2 |
| Pavé à l'aire de la part comme miniature (vignette de récap, pas l'écran) | z3 | aucune en v2 ; à garder pour le Récap. |

## Retouches communes (à passer dans les trois)
- Le bandeau commun de z et u affiche « IBU 24 » avec un curseur sur une recette sans houblon ; r l'affiche sans curseur. Hors périmètre
  (J12), déjà signalé par le jury au port d'Identité : ne pas le redessiner ici.
- u3 à 8 grains : le + flottant recouvre le bord du champ d'ajout (D164). Dans toute candidate, le champ garde 56 px à droite ou passe
  au-dessus du pied.
- Marques « 3 couleurs à renseigner » (u1, u2) et « Weyermann » (z3, u) paraissent sous 12 px : mesurer, remonter à 12.
- « 1 couleurs à renseigner » (z1 saisie) : accord.
- Les cartes Rendement et Volume au repos (z1 à z4) : le rendement reste replié « repère », le volume part.

## Relances ciblées (mécanique, pour un exécutant)
- `z1..z4` : capture à 8 grains (`v0/z1/captures-etats.mjs` à étendre), sortie attendue hauteur ≤ 1,05 ; ouvrir les quatre.
- `controle-panel.mjs` sur `u1..u4` (`cap-recette.png`), sortie attendue PANEL OK ou le remplissage par id.
- Fusion à préparer pour la passe 2 : z2 + u3 (« le verre complet »), r3 versé dans z2 (colonne → verre gradué).

## Ce que je prête au brasseur sans pouvoir le citer (signalé, ne classe pas)
- Que le noir du plateau r4 lui pèse : sa r4-a a un curseur noir, pas un panneau noir ; il peut aussi l'aimer (« en grand »).
- Que l'échelle multicolore de u3 lui parle d'emblée : c'est l'échelle SRM qu'il connaît, mais mon étalonnage me dit trop clément devant
  plusieurs couleurs ; à vérifier sur son verdict.
- Que « 1 sac = 1 kg » l'irrite : « sort de nulle part » est son refus, mais sur un dessin, pas sur une unité de lecture.

LEÇON PROPOSÉE : aucune.
