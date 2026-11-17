# as : calendrier jouable, base z2s et ses gestes du 17.11

Base reprise telle quelle : `se/z2s.html` → `cal.html` (390 × 844), `se/z2s-paysage.html` → `cal-paysage.html` (844 × 390).
On n'a rien retiré. Assemblage par indices (`src/build.mjs`) : un `<style id="as-gestes">` avant `</head>`, un `<script id="as-gestes-js">`
(fonction immédiate, classes et globales `as-`) avant `</body>`. Sources : `src/as-gestes.css`, `src/as-gestes.js`. Joué par `src/jouer.mjs`
(puppeteer-core, isMobile, hasTouch, gestes au doigt par CDP `Input.dispatchTouchEvent`), états lus dans `cap/_jeu.json`. Captures dans `cap/` ;
`p-` = portrait, `l-` = paysage, `base-*.png` = la base seule pour comparer côte à côte.

Données : la courbe est relue dans le tracé de la base (libre et caisse, 52 semaines), recalée sur les soldes connus (S47 4 032 … S52 5 550,
creux 113). L'année en barres (c1d) et le détail d'une semaine (c2b, c3a) viennent d'une liste d'exemple, cohérente avec les noms de la courbe
(Hotte S13, Six fûts inox S18, Embouteilleuse S22, Fête de village S26…). Le reste d'une semaine sans nom devient « Ventes de la semaine » ou
« Petits frais ». La base reste marquée « exemple ».

| Geste | État joué | Captures |
|---|---|---|
| f1-a Déplacer en direct | malt glissé S52 → S51, même longueur. Pendant le glisser, la courbe se zoome sur les semaines visibles : avant en pointillé, si tu lâches en plein, « S51 : 5 064 → 4 524 » ; un fantôme reste à l'ancienne place. Au lâcher, le toast tient sur une ligne, avant le + : « S51 : 5 064 → 4 524 · Annuler ». La courbe, le creux et les ± de la bande sont recalculés. Les charges fixes ne se déplacent pas : le toast renvoie à Finances. | p/l-f1a-avant, -pendant, -apres |
| f2-a Allonger | fin de la Blonde tirée de 7 j : « J0 / 35 · prête 21 déc. » ; jours actifs en points sur la piste, le dernier en rouge s'il touche une promesse. Alerte sous les Ventes : « 3 fûts promis à La Cigogne le 15 déc. Mise en fût de la Blonde le 21 déc. », avec Livrer le 22 déc. et Annuler l'allongement ; étiquette « 15 déc. » rouge contre le fût promis. | p/l-f2a-* |
| f4-b Ouvrir un brassin | un toucher sur le Porter ouvre son détail sous la barre : Brassage lun. 14 déc., En cuve 15 → 28 déc., Prête 11 janv. ; « Munich 4 kg, Fuggles 200 g : manquent au stock, à acheter avant le 7 déc. » ; Ouvrir le brassin, Commander ; × à 44 px. En paysage, la barre du Porter dure 5 semaines dans la base, d'où Prête 18 janv. | p/l-f4b-*, p-cave-f4b |
| f5-a Appui long | menu sous la barre (Marché de Noël) : Épingler (« visible, rangée masquée »), Étoile (« sur la courbe »), Fêtes seules (« 6 rangées masquées »), Dupliquer en S51 « S51 : 5 064 → 6 244 », Lier à un brassin, un client « un trait les relie », Retirer « S50 : 5 120 → 3 940 ». Retirer est joué : toast et Annuler ; le chiffre de tête passe à −1 067, car le creux suit. | p/l-f5a-avant, -apres, -retirer, p-cave-f5a |
| f6-b Une promesse prévient | Blonde glissée d'une semaine par le milieu : « dès 23 nov. · prête 21 déc. ». Alerte : Livrer le 22 déc. ou Annuler le décalage, avec « Caisse : S47 4 032 → 4 180, la suite inchangée ». Livrer est joué : le fût promis passe en S52, toast « La Cigogne : 22 déc. · Annuler ». | p/l-f6b-*, -livrer |
| c1-d Poignée jusqu'au bout | la poignée droite de la fenêtre est tirée jusqu'au bout. Pendant, l'étiquette de la fenêtre suit, puis se cache. Au lâcher sur plus de 80 % : An. Bande en 12 mois (N … O) en barres, juin cerclé avec 113 ; frise de l'année avec ses montants écrits (−148, −176, +420…) ; bouton période « An ». Lâcher plus tôt : la fenêtre revient et un toast dit « Tire jusqu'au bout : l'année ». Retour : toucher « An » ou retirer la poignée. Le + d'une rangée ramène aux semaines et ouvre la pose. | p/l-c1d-*, -apres-bas |
| c2-b Glisser sur la courbe | la tête lit la semaine sous le doigt, « 3 801 CHF · S12 · 22 mars −487 » ; bulle des deux plus gros mouvements et « +1 autre » ; curseur et point sur la courbe. Un toucher ailleurs rend la tête. | p/l-c2b-* |
| c3-a Appui long sur la courbe | la courbe prend la place de la frise, avec axes 0 à 7 500 et mois. La semaine sous le doigt se détaille, « S24 · 14 → 20 juin, libre 113 » : Sols : colle et joints −320, Ventes de la semaine +128, la semaine −192. Le doigt continue de lire ; × pour revenir. En paysage, la courbe et la fiche sont côte à côte. | p/l-c3a-* |
| F3 | aucun geste nouveau. Le + du carré de rangée garde son comportement de base (pose ouverte, `k14-ouv`) ; aucun + ajouté (0 élément as- après le toucher). | p/l-f3-plus |

Thème cave vérifié (`p-cave-*`). Aucune erreur de page sur les 19 parcours (`cap/_jeu.json`). Tous les textes ajoutés font 14 px ou plus.
Le + volant n'est pas touché ; le toast s'arrête avant lui.

## Contrôles (depuis la racine)
- controle-bande-semaine cal.html : **BANDE OK** ; cal-paysage.html --paysage : **BANDE OK**
- controle-entete-cal cal.html : **ENTETE OK**
- controle-plus-rangees cal.html : **PLUS ECHEC**, « 0 rangées ». L'échec vient de la base : même sortie sur `se/z2s.html`. Le contrôle cherche
  `.k14-pl`, alors que le + de la base z2s est `.g2-c` dans le carré de couleur, son choix F3. Base gardée, contrôle à mettre à jour.
- controle-base calendrier cal.html : **BASE ECHEC**. G3 : chips filtres non visibles ; G5 : « 8 semaines » en paysage. Sortie identique sur
  `se/z2s.html`, donc échec venu de la base telle quelle, laissé.
- controle-pays-compact cal-paysage.html : **COMPACT ECHEC**, hauteur médiane 86 px. Sortie identique sur `se/z2s-paysage.html`. Base laissée.

## Passe de correction (17.11, CRITIQUE.md : 19 problèmes)
Base z2s et gestes retenus intacts ; tout passe par `src/as-gestes.js` et `src/as-gestes.css`, assemblés par `src/build.mjs`. Rejoué par
`src/jouer.mjs` (19 parcours, portrait et paysage, plus la cave), **0 erreur de page**. Captures refaites dans `cap/`, ouvertes côte à côte avec page14.

| # | Correction | Preuve (cap/_jeu.json, captures) |
|---|---|---|
| 1 | f1-a pendant : la tête reste (clone de la ligne de tête, creux recalculé « 113 · S24 ») ; axe des montants ; marche « −540 » en rouge ; colonne S51 éclairée dans la frise, S51 en pointillé dans la bande ; « S51 · 14 déc. · lâcher ici » sous le doigt | p/l-f1a-pendant ; `ici` = « S51 · 14 déc. · lâcher ici », `cible` = 2 |
| 2 | courbe zoomée calée sur les colonnes de la frise (mêmes x, NC colonnes : 6 en portrait, 13 en paysage) | p/l-f1a-pendant |
| 3, 18 | « 5 064 → 4 524 » sort de la courbe, dans la légende du bas ; le nom de la barre glissée a un fond, au-dessus du fantôme | p/l-f1a-pendant |
| 4, 17 | durée du brassin lue dans ses données (J0 / n, sinon l'année : Porter 5 sem.), pas dans la partie visible : « 15 déc. → 11 janv. · Prête 18 janv. » dans les deux sens | p-f4b, l-f4b identiques |
| 5 | une seule série (libre, caisse) pour les deux fichiers : S24 = Ventes +128, la semaine −192 en portrait comme en paysage | p-c3a = l-c3a |
| 6, 19 | la grande courbe remplace la petite dans la tête (une seule courbe), la frise s'efface dessous ; mois coupés au bord retirés ; hauteur paysage tenue au-dessus des onglets | p/l-c3a-apres |
| 7 | tête longue ou négative : « −1 067 CHF · S24 » en rouge, les boutons restent dans l'écran | p-f5a-retirer |
| 8 | les noms de la courbe suivent la courbe recalculée ; sans place libre, un fond les détache du tracé (Hotte, Frigo lisibles) | p-f5a-retirer |
| 9, 10 | menu toujours sous la barre (la page remonte si besoin), pointe sur la barre, ancré à droite des noms de rangées (+ et noms visibles) ; plus large en paysage | p/l-f5a-apres |
| 11, 12 | l'année : noms sur fond (les traits de mois ne les barrent plus) ; barres fines, plusieurs par ligne ; faute de place le montant seul (nom au survol et à la lecture d'écran), comme c5-b ; Ventes au-dessus du pli | p/l-c1d-apres |
| 13 | bulle posée à côté du point lu (cerclé en pointillé), jamais dessus | p/l-c2b-pendant |
| 14 | f6-b : le fantôme hachuré reste à S47 tant que la promesse attend ; retiré par Livrer ou Annuler | p/l-f6b-apres, `fant` = 1 |
| 15 | f4-b : icônes houblon, cuve, fût sur les étapes ; trait pointillé de la barre au panneau | p-f4b-apres, p-cave-f4b |
| 16 | alerte f2-a : « Livrer le 22 déc. » et « Annuler » côte à côte (121 px au lieu de 340) | `alH` : h 121, boutons même ligne |

Doute (d) levé : f1-a après est capturé tête en vue, « 113 CHF à dépenser · S24 ».

### Contrôles (depuis la racine, une fois après la passe)
- controle-bande-semaine cal.html : **BANDE OK** (EXIT 0) ; cal-paysage.html --paysage : **BANDE OK** (EXIT 0)
- controle-entete-cal cal.html : **ENTETE OK** (EXIT 0)
- controle-plus-rangees cal.html : **PLUS OK** (EXIT 0)
- controle-base calendrier cal.html : **BASE ECHEC** (EXIT 1), G3 « [data-filtre] : 0 visible(s) » et G5 « à 844 × 390 : 8 semaines ». Sortie identique
  sur `se/z2s.html` : défaut de la base choisie (r2-c met l'œil par rangée, pas de chips ; la capture paysage montre 13 semaines). Base non touchée.
- controle-pays-compact cal-paysage.html : **COMPACT ECHEC** (EXIT 1), « 7 rangées, hauteur médiane 86 px ». Identique sur `se/z2s-paysage.html`. Base non touchée.

## Passe 3 (17.11, RECONTROLE1.md : 7 restes)
Base z2s (courbe complète, bande semaine seule, ±, + dans le carré) et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css`,
assemblés par `src/build.mjs`. Rejoué par `src/jouer.mjs` : 21 parcours, portrait et paysage, plus la cave, **0 erreur de page**. Captures dans `cap/`,
zooms ×3 `cap/z-p-c1d-*.png` et `cap/z-l-c1d-*.png`, toutes ouvertes. Mesures : scratchpad `mesure.mjs` (sortie ci-dessous).

| # | Correction | Preuve |
|---|---|---|
| 1 (13) | c2-b : la bulle flottante est remplacée par le détail de sa maquette c2-b, sous la bande semaine (« S12 · 22 → 28 mars », 3 lignes, « la semaine −487 ») ; il pousse la frise et ne couvre plus rien de la courbe. Le curseur passe sous les noms et s'interrompt à leur passage ; l'anneau ne mange plus « −900 ». | p/l-c2b-pendant, -apres |
| 2 (11) | l'année : noms de rangées (nom, œil) sur fond et au-dessus des traits de mois | z-p-c1d-noms : « Brassins » net |
| 3 (bloquant) | l'année : une nouvelle ligne prend la première forme qui tient (nom et montant, sinon montant seul), jamais une étiquette posée sur sa barre ; barres au-dessus des étiquettes | z-p-c1d-fetes : barre du Marché de printemps visible, « +910 » à côté (nom au survol, lecteur d'écran) ; paysage : nom entier ; contrôle : 0 chevauchement, 27 barres |
| 4 (2) | lecture : les boutons de tête restent (± , 6 sem./3 mois, ⏲2, ⛶ : visibility visible pendant et après) ; la tête prend la forme la plus longue qui tient (portrait « 3 801 S12 −487 », date dans le détail ; paysage « 3 801 CHF · S12 · 22 mars −487 ») | mesure p/l-c2b |
| 5 (3) | menu f5-a comme f5-b : sous-titres retirés (gardés en aria-label), « Dupliquer en S51 +1 180 · 2 j » ; hauteur 226 px (f5-b 220) | p/l-f5a-apres |
| 6 (4) | f6-b après : la barre garde « J0 / 28 » et sa piste entière (165 px sur 241) ; « brassée dès le 23 nov., sera prête le 21 déc. » passe dans l'alerte | p/l-f6b-apres |
| 7 (5) | « lâcher ici » posé là où il cache le moins de texte (frise, bande, courbe zoomée et son tracé) ; faute de place près du doigt, dans la courbe zoomée au-dessus de la colonne d'arrivée, l'écart « +148 » passant de l'autre côté | p-f6b-pendant : « Porter d'hiver −176 » entier ; f1-a inchangé (sous le doigt) |

Mêmes chiffres en portrait et en paysage (S12 : −611, +536, −412, la semaine −487 ; Dupliquer +1 180 · 2 j ; Blonde prête le 21 déc.).
Durée des fêtes (Marché de Noël 2 j, f5-b) : table `JEV` dans les données de l'exemple.

### Contrôles (depuis la racine)
- controle-bande-semaine cal.html : **BANDE OK** ; cal-paysage.html --paysage : **BANDE OK**
- controle-entete-cal cal.html : **ENTETE OK** (courbe 87 px, bande 33 px, en-tête 180 px)
- controle-plus-rangees cal.html : **PLUS OK** (7 rangées, écart 0 px)

Reste à voir : en portrait, « Marché de printemps » n'a que son montant sur l'année (faute de place, comme Fête de village) ; « lâcher ici » touche
le bord de la marche S50 de la courbe zoomée (2 px) dans f6-b portrait.

## Passe 4 (17.11, RECONTROLE2.md : 1 bloquant, 1 nouveau, 2 doutes)
Base z2s et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css` (copies de la passe 3 : scratchpad), assemblés par `src/build.mjs`.
Rejoué par `cap/passe4/jouer.mjs` (copie de `src/jouer.mjs`, mesures en plus) : 21 parcours, 390 × 844 tactile et 844 × 390, clair, plus la cave,
**0 erreur de page** (`cap/passe4/_jeu.json`). Captures dans `cap/passe4/`, toutes ouvertes (une à une ou sur `planche-p`, `planche-l`, `planche-l2`).

| # | Correction | Preuve |
|---|---|---|
| 1 (bloquant) | l'année, Papiers : l'étiquette d'une barre qui couvre toute l'année passe au-dessus d'elle (`.as-il.as-in` z 3 > barre z 2) ; « Loyer du local −400 / mois » se lit sur sa barre | p/l-c1d-papiers ; sonde `elementFromPoint` : l'étiquette est dessus, dans les deux sens |
| 2 | l'année : le nom ne manquait pas par faute de données mais par la règle de rangement (montant seul sur une ligne existante avant une ligne neuve). Ordre nouveau : nom et montant hors du + ; sinon une ligne de plus ; sinon le montant sous le nom (2 lignes) ; le montant seul en tout dernier recours, et alors sans tiret de liaison. Libellés de l'année en 14 px, comme la frise | portrait : 27 étiquettes, **0 sans nom, 0 « — −… »** (avant : 5) ; 2 sur deux lignes (Coffrets Saint-Valentin, Commande groupée de malt) ; paysage : 0 sans nom. Ventes à 688 px en portrait (pli à 789) |
| 3 | 6 sem. / 3 mois : une étiquette posée à gauche d'une barre recule devant la colonne du + volant (8 px de marge), son tiret s'allonge jusqu'à la barre ; recalculé à chaque changement de la frise (MutationObserver). Le + n'a pas bougé (droite, 12 px au-dessus des onglets) | p-f4b-apres : « Commande groupée de malt −540 » entier (63 → 287 px, + à 295) ; mesure : 0 texte d'étiquette sous le + après f4-b, dans les deux sens ; même recul au repos, f1-a, f2-a, f6-b et en cave |
| 4 | f1-a / f6-b : le fantôme passe au-dessus de la barre glissée (z 7 > 6), contour pointillé plein et hachures plus nettes ; la barre se lit au travers | l-f1a-pendant : fantôme S52–S53 net sur la barre ; p-f6b-pendant : fantôme S47 visible, « Blonde d'automne −148 » lisible |

Mêmes chiffres qu'en passe 3 (f1-a S51 : 5 064 → 4 524 ; f5-a S50 : 5 120 → 3 940 ; f6-b S47 4 032 → 4 180 ; c2-b S12 −487 ; c3-a S24 −192).

### Contrôles (depuis la racine)
- controle-bande-semaine cal.html : **BANDE OK** ; cal-paysage.html --paysage : **BANDE OK**
- controle-entete-cal cal.html : **ENTETE OK** (courbe 87 px, bande 33 px, en-tête 180 px)
- controle-plus-rangees cal.html : **PLUS OK** (7 rangées, écart 0 px)

Reste à voir :
- l'année portrait : 4 étiquettes trop longues pour tenir hors de la colonne du + même sur deux lignes (IPA de printemps −412, Dégustation à la
  brasserie +420, Marché de printemps +910, Malt de printemps −540) ; aucune n'est sous le + au repos ni à 400 px de défilement, mais elles y
  passent en défilant. Le nom l'emporte sur la colonne.
- 6 sem. portrait : un nom écrit dans sa barre (« Noël privés +640 », fin à 316 px) reste dans sa barre, comme la base ; il passe sous le + en défilant.
- f6-b portrait pendant : les hachures du fantôme passent sur « Blonde d'automne −148 », lisible.
