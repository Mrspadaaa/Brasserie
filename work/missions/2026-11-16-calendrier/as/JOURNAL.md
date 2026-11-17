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

## Passe 5 (17.11, ses mots : « Trop d'info quand on bouge qqch, ça devient illisible... Les boutons+ (général) et ajout fonctionne pas »)
Défauts CAL-GESTE-BRUIT et CAL-PLUS-MORT. Base z2s et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css` (copies de la passe 4 : scratchpad
`as-gestes.passe4.*`), assemblés par `src/build.mjs`.

**Contrôles écrits avant la correction** (`scripts/agents/`) : `controle-plus-agit.mjs` (le + volant et le + du carré de chaque rangée, 390 tactile,
page neuve à chaque toucher : feuille avec champ ou choix, déjà sur sa rangée, ou élément posé ; zéro case « + » visible) et `controle-geste-bruit.mjs`
(f6-b seul, puis f1-a suivi de f6-b : 1 message au plus, 2 lignes au plus hors boutons, aucun texte sur un autre, le fantôme sur aucun texte).
Témoins négatifs sur l'état de la passe 4 : `TEMOINS-1711.txt` — PLUS-AGIT ECHEC (16/16 KO : rien d'ouvert, 12 cases « + » par rangée) ;
BRUIT ECHEC (alerte sur 3 lignes, 2 messages empilés après f1-a puis f6-b, fantôme sur « Blonde d'automne »).

| # | Correction | Preuve |
|---|---|---|
| 1 | Un seul message : le bandeau ferme l'alerte, l'alerte ferme le bandeau (plus de « Blonde d'automne : 2… Annuler » sous une alerte) | p-f1a-puis-f6b, l-… : 1 message |
| 2 | L'alerte de promesse remplace le bandeau, avec Annuler dedans : « **3 fûts promis le 15 déc.** · prête le 4 janv. » puis [Livrer le 5 janv.] [Annuler] ; La Cigogne, la date de brassage et la ligne Caisse (S47 4 032 → 4 180) passent dans le détail, au toucher de la ligne (chevron) ; même forme pour f2-a | p-f6b-apres, p-f6b-detail, p-f2a-apres ; paysage : alerte ≤ 560 px |
| 3 | Fantôme : simple contour pointillé, premier enfant de la rangée (z 0), sous les barres et les noms, sans hachures | p-f6b-pendant, p-f1a-pendant |
| 4 | Pastille de date seulement si elle ne touche ni texte, ni repère, ni barre, ni le bord | p-f6b-apres : « 15 déc. » posée, rien dessous |
| 5 | + volant : feuille d'ajout (Brassin, Vente, Fête, Achat, Travaux, Activité, Papier ; puis Nom, CHF sauf Activité, la semaine ; « Ajouter en S49 ») ; Ajouter pose une barre d'une semaine dans sa rangée, première ligne libre pour elle et son nom, la caisse suit, bandeau « S49 : 4 132 → 4 070 · Annuler » | p-plus-feuille, -rempli, -pose (Houblon Citra 1 kg −62 en Achats, tête 113 → 51) |
| 6 | + du carré : la même feuille, déjà sur sa rangée ; Ventes propose la vente probable du repère pointillé (Café du Pont, 1 fût · 10 déc., +130, S50) ; Ajouter la pose et retire le repère pointillé | p-ventes-feuille, -pose (S50 : 5 120 → 5 250) ; p-activites-* (sans montant, « 1 j ») |
| 7 | Plus aucune case pointillée : l'ouverture de rangée de la base (k14-ouv, `.ps`) est neutralisée ; le + volant n'a pas bougé | controle-plus-agit : 0 case ; controle-plus-rangees OK |

Rejoué au doigt par `cap/passe5/jouer.mjs` : 14 parcours, 390 × 844 tactile et 844 × 390, clair, plus la feuille et f6-b en cave ; **0 erreur de page**
(`cap/passe5/_jeu.json`). Captures `cap/passe5/` toutes ouvertes (planches `_p5-f6b`, `_p5-plus`, `_p5-p2`, `_p5-p3`, `_p5-l`, `_p5-l2`, `_p5-l3`).

### Contrôles (depuis la racine, sortie complète : `cap/passe5/_controles.txt`)
- controle-plus-agit cal.html cal-paysage.html : **PLUS-AGIT OK** (16/16)
- controle-geste-bruit cal.html cal-paysage.html : **BRUIT OK** (6/6)
- controle-bande-semaine cal.html : **BANDE OK** ; cal-paysage.html --paysage : **BANDE OK**
- controle-entete-cal cal.html : **ENTETE OK**
- controle-plus-rangees cal.html : **PLUS OK**

Reste à voir :
- le fantôme, simple contour sous la barre, se lit peu quand la barre ne s'est déplacée que d'une semaine (il dépasse d'une semaine à gauche) ;
- après « Livrer le 5 janv. », le repère des 3 fûts part en S53, hors des 6 semaines (comme en passe 4) ;
- en paysage, le bandeau du bas recouvre parfois un repère de la rangée Ventes (+260) tant qu'il est là (7 s) ;
- la feuille ne propose une chose probable que pour Ventes (seule donnée probable de l'exemple) ; une barre posée par le + n'a pas de détail de brassin au toucher.

## Passe 6 (17.11, CRITIQUE5 : 11 problèmes, 5 bloquants ; ses mots : « Trop d'info quand on bouge qqch… Les boutons+ (général) et ajout fonctionne pas »)
Base z2s et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css` (copies de la passe 5 : `%TEMP%/as-gestes.passe5.*`), assemblés par `src/build.mjs`.

| # | Correction | Preuve (cap/passe6/_jeu.json) |
|---|---|---|
| 1 | La durée tirée (f2-a) est retenue sur la barre (`data-as-du`) ; après un décalage, la barre redit « J0 / 35 · prête 28 déc. », même date que l'alerte ; si le texte ne tient pas dans l'écran, « J0 / 35 » seul | p/l-blonde : em = alerte, emDedans true ; p-f2a-f6b, l-f2a-f6b |
| 2 | Toucher une chose ajoutée ouvre son détail : brassin comme le Porter (brassage, en cuve, prête ; stock « à vérifier ») ; vente, fête, achat, travaux, activité, papier : semaine, date, libre de la semaine ; Modifier (la feuille, pré-remplie) et Retirer (avec Annuler) | det non vide sur les 14 parcours + et fab ; p-fab-touche, p-r-*-touche, l-fab-touche |
| 3 | La pastille de la rangée suit ajout, retrait, Annuler et la copie de f5-a (dans la vue seulement : « solde confirmé S47 – S52 ») | Brassins −324 → −424, Ventes +900 → +1 030, Papiers −806 → −906 (paysage −1 986 → −2 086), retour exact après Retirer |
| 4 | Pose sans chevauchement : la chose et son nom évitent barres, noms, repères, liens et titres (celui de la rangée et celui de la suivante, Fêtes remonte de 26 px), 8 px de marge ; sinon une ligne neuve sous les repères de la rangée (les liens commande/promesse restent attachés) | chev = [] sur les 28 poses ; l-r-achat-pose : Houblon Citra sous Frigo, plus sur « + Achats » |
| 5 | Un brassin a sa recette (puces des recettes), son temps en cuve (21, 28, 35, 42 j ; « prête le 4 janv. » en direct dans la feuille) et sa barre : brassage, garde, conditionnement sur la durée, coupée au bord comme le Porter | p-fab-rempli, p-fab-pose (Blonde d'automne S50, 28 j, prête le 4 janv.) |
| 6 | Messages sur deux lignes au plus, jamais coupés | « Ranger la réserve : S48 → S49 », « Charge fixe : elle se règle dans Finances » entiers (p/l-autre-t, -c) |
| 7 | Paysage : l'alerte se pose au bout de la rangée de la barre bougée, en une rangée (texte, Livrer, Annuler) ; la vue ne descend jamais au point de cacher la barre (bas de la bande des semaines collée) | barreVue true après f2-a et après f6-b (p et l) ; l-f2a-apres, l-f2a-f6b |
| 8 | Le message (Annuler) se pose sur la barre d'onglets, comme le toast de la base en paysage (`body.land .toast{bottom:12px}`) ; il ne couvre plus la frise | toastSurNav true sur toutes les poses |
| 9 | La feuille propose 13 semaines (S47 → S6) en portrait aussi, qui défilent ; hors des 6 semaines, la chose se pose (caisse, pastille hors vue inchangée) et un renvoi « Malt de janvier −540 S2 › » au bord droit de sa rangée l'ouvre | p-hors-feuille, p-hors-pose, p-hors-touche |
| 10 | Une vente est une pastille, comme les livraisons : la vente probable choisie devient pleine à sa place (bouteille, +130) ; une autre vente, une pastille neuve | p/l-r-vente-pose |
| 11 | Le brassin en S50 se pose sous le chariot du Porter avec 12 px d'écart, avant le titre Fêtes | ecartChariot 12 ; p-fab-pose |

Rejoué au doigt par `cap/passe6/jouer.mjs` : 22 parcours par sens (390 × 844 tactile, 844 × 390), clair, plus la cave ; **0 erreur de page**.
Captures `cap/passe6/` ouvertes sur les planches `_p6-p1` à `_p6-p3`, `_p6-l1` à `_p6-l4`.

### Contrôles (depuis la racine, sortie : `cap/passe6/_controles.txt`)
- controle-plus-agit cal.html cal-paysage.html : **PLUS-AGIT OK**
- controle-geste-bruit cal.html cal-paysage.html : **BRUIT OK**
- controle-bande-semaine cal.html : **BANDE OK** ; cal-paysage.html --paysage : **BANDE OK**
- controle-entete-cal cal.html : **ENTETE OK**
- controle-plus-rangees cal.html : **PLUS OK**

Reste à voir :
- le message sur la barre d'onglets cache Bord, Finances et Calendrier pendant 7 s (choix : la frise d'abord) ;
- en portrait, l'alerte reste dans Ventes, près de la promesse (comme en passe 5) ; en paysage, elle passe sous la Blonde ;
- une chose posée hors vue n'entre pas dans la pastille (« solde S47 – S52 ») ; l'année ouverte avant l'ajout ne la montre qu'en la rouvrant ;
- deux ventes la même semaine : deux pastilles côte à côte, non décalées.

## Passe 7 (17.11, RECONTROLE6 : 4 problèmes, 1 bloquant ; et la rotation, ses mots : « Ça forcé pas à renverser le téléphone ??? Ça devrait si non c'est pas vraiment utilisable ? »)
Base z2s et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css` (copies de la passe 6 : `%TEMP%/as-gestes.passe6.*`), assemblés par `src/build.mjs`, qui écrit aussi `pub/portrait.html` et `pub/paysage.html` (`<html data-vue>`).

| # | Correction | Preuve (cap/passe7/_jeu.json) |
|---|---|---|
| 1 | Deux ventes la même semaine : la pastille neuve ne se pose jamais sur une autre (ni sur un nom, un lien, une barre, 3 px) ; sinon une ligne dessous, dans sa semaine ; la ligne se retire avec elle. Le jeu mesure les pastilles neuves contre les pastilles posées | p/l-z-deuxventes : +260 y 373–416, +200 y 464–507, chevPins [] ; Ventes +900 → +1 100 → +900 après Retirer ; toucher : détail (Bar du Lac, S49, lun. 30 nov.) |
| 2 | Modifier : le message se calcule sur toute la courbe, première semaine qui bouge : « S47 → S51 · S47 : 3 932 → 4 032 » ; un ajout simple dit aussi sa première semaine changée | p/l-z-modifie |
| 3 | Le message suit le geste dans la frise, au bout de la rangée de la chose touchée (comme l'alerte) ; à gauche du + volant ; juste sous la chose si le bout de rangée reste sous les onglets ; Ouvrir et Commander ferment le détail d'abord. Il ne couvre ni la frise ni la barre d'onglets ; quand il part (7 s), la chose ne bouge pas à l'écran | toastSurNav false et toastSurFrise [] sur les 34 poses ; p/l-z-depart : y 427 → 427 (p), 175 → 175 (l), onglets libres pendant le message ; aucun message coupé |
| 4 | Livrer hors des 6 semaines (portrait) : la pastille devient un renvoi « La Cigogne 3 fûts S53 › » au bord de Ventes (comme « Malt de janvier −540 S2 › »), qui ouvre son détail (S53, mar. 29 déc., Blonde prête 28 déc.) ; Annuler remet la pastille | p-z-livrer, p-z-livrer-touche ; paysage : S53 dans la vue, pastille déplacée (l-z-livrer) |
| 5 | Le message d'un brassin posé : « Prête le 4 janv. · S50 : 5 120 → 4 700 » (le nom est sur la barre), deux lignes au plus | p-fab-pose |
| B | `pub/calendrier.html` : une adresse, deux cadres (portrait 100vmin × 100vmax, paysage 100vmax × 100vmin), l'un visible selon `matchMedia('(orientation: landscape)')`, au changement, sans recharger ni recalculer | `scripts/agents/controle-rotation.mjs` : ROTATION OK ; témoin `pub/portrait.html` : ROTATION ECHEC ; rot-portrait, rot-paysage, rot-retour |

Rejoué au doigt par `cap/passe7/jouer.mjs` (passe 6 entière + 5 parcours z par sens + rotation + cave) : **0 erreur de page**, 0 faute mesurée. Planches ouvertes : `_p7a` à `_p7e`, rot-paysage.

### Contrôles (depuis la racine, sortie : `cap/passe7/_controles.txt`)
- controle-plus-agit cal.html : **PLUS-AGIT OK** (paysage aussi)
- controle-geste-bruit cal.html : **BRUIT OK** (paysage aussi)
- controle-bande-semaine cal.html : **BANDE OK** (paysage --paysage aussi)
- controle-entete-cal cal.html : **ENTETE OK**
- controle-plus-rangees cal.html : **PLUS OK**
- controle-rotation pub/calendrier.html : **ROTATION OK** ; témoin pub/portrait.html : ROTATION ECHEC (attendu)

Reste à voir :
- le message dans la rangée pousse les rangées du dessous de sa hauteur (≈ 56 px) pendant 7 s ;
- « S47 → S51 · S47 : … » redit S47 quand la chose part de la semaine qui bouge ;
- la deuxième pastille d'une semaine agrandit la rangée Ventes d'une ligne (46 px).

## Passe 8 (17.11, CRITIQUE7 : 3 problèmes, 2 bloquants ; et les restes de RECONTROLE6)
Base z2s et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css` (copies de la passe 7 hors du dossier), assemblés par `src/build.mjs` ; `pub/calendrier.html` réécrit.

| # | Correction | Preuve |
|---|---|---|
| 1 | **Un seul calendrier.** Chaque vue écrit ses données à chaque changement (sessionStorage commun + message au cadre parent, qui garde le dernier état et le passe à l'autre vue, puis à la vue qui redevient visible) ; chaque vue relit l'état reçu, au redimensionnement (on tourne) et quand elle redevient visible, et redessine à sa largeur. État : courbe, choses posées, barres de la base (semaine, durée, retrait, copies, marques), livraison promise, écarts des pastilles (chaque vue compte ses semaines), rangées masquées | `controle-rotation.mjs` étendu (poser un papier et décaler la Blonde en hauteur, tourner, vérifier chose, pastille, tête, Blonde ; puis l'inverse) : ROTATION OK ; témoin passe 7 : ROTATION ECHEC (TEMOINS-1711.txt). Jeu : tête 313 en hauteur → 313 en largeur → 223 au retour avec l'achat posé en largeur |
| 2 | 1280 × 800 : la vue en largeur reste à 844 px, centrée (marges au fond du thème) ; hauteurs en 100dvh | `controle-bande-semaine.mjs --large` (nouveau : chaque semaine de la bande au centre de sa colonne) : BANDE OK ; témoin passe 7 : S48 à x 157 pour la colonne 75–138, BANDE ECHEC |
| 3 | Le message se pose par-dessus la frise (fixe), sans réserver de hauteur : près de la chose là où il ne cache aucun texte, sinon en bas au-dessus des onglets ; sous les onglets et à gauche du + volant ; il part dès qu'on ouvre un détail, un menu ou la feuille | `controle-geste-bruit.mjs` étendu (rangées à la même place, message hors des onglets) : BRUIT OK ; témoin passe 7 : « rangées poussées de 60 px ». Jeu : rangées [185…609] identiques avant et après f1-a |
| 4 | Deux ventes la même semaine : la pastille neuve porte son nom (« Bar du Lac +200 »), une ligne dessous (pas de 50 px, place laissée au titre suivant) | geste-bruit « deux ventes en S49 » : ok ; témoin passe 7 : pastilles sans nom |
| 5 | Modifier : « Stand au marché : S49 → S51 » (plus de semaine redite) | 07-p-modifier |
| 6 | Livrer hors des 6 semaines : renvoi « Livraison La Cigogne · S1 › » (la Blonde décalée de 3 semaines est prête le 4 janv.) ; en largeur la pastille est dans la vue | 03-p-livrer-renvoi, 08b-l-ventes |
| 7 | Brassin posé : jauge et « J0 / 28 · prête 4 janv. » comme la Blonde ; la feuille a un signe à toucher (+ rentrée, − dépense : « Stand au marché −150 ») ; vente posée nommée | 04-p-brassin, 05a-p-feuille-moins, 05-p-fete-moins, 06-p-deux-ventes |

Contrôles (sorties : `cap/passe8/_controles.txt`) : ROTATION OK, PLUS-AGIT OK, BRUIT OK (portrait et paysage), BANDE OK (portrait, paysage 844 seul et en cadre, 1280), ENTETE OK, PLUS OK. `controle-entete-cal --paysage` sur `cal-paysage.html` : ECHEC identique à la passe 7 (en-tête 182 px, base inchangée, hors de cette passe).
Rejoué au doigt par `cap/passe8/jouer.mjs` : une session sur `pub/calendrier.html`, 390 tactile → 844 × 390 → 390 → 1280 × 800, puis la cave dans les trois ; **0 erreur de page** ; 20 captures, toutes ouvertes (planches `cap/_p8a` à `_p8i`).
Reste à voir : la page seule `cal-paysage.html` ouverte en 1280 reste dessinée pour 844 (la vue de l'adresse unique est bornée) ; sur un vrai téléphone, la hauteur 100dvh avec la barre d'adresse.

## Passe 9 (17.11, CRITIQUE8 : 6 problèmes, 3 bloquants)
Base z2s et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css` (copie de la passe 8 hors du dossier), assemblés par `src/build.mjs` ; `pub/` réécrit.

| # | Correction | Preuve |
|---|---|---|
| 1 | Le message part dès que la frise défile (24 px) ; son texte laisse passer le doigt (seul Annuler se touche) ; il évite la chose annoncée (poids 400) et les + des rangées (poids 200), avec plus de places essayées le long de la rangée, et jamais au-dessus du bas de la bande des semaines | geste-bruit n° 7 (nouveau : vente posée, puis on défile par pas de 30 px jusqu'à 450 px) : « parti » ; témoin passe 8 : KO « message sur −312 en défilant ». Jeu : les 7 + agissent (18 à 28), 0 erreur ; 48-l-fab-pose : message à droite de la barre posée, aucun nom couvert |
| 2 | Feuille en 844 × 390 : la ligne du montant rétrécit (`.as-fmr` min-width 0), les semaines défilent dans leur bande dans les deux sens, plus de scrollIntoView | plus-agit (nouveau) : largeur 840 pour 840, glisse 0 px, titre entier (cal.html et cal-paysage.html) ; témoin : 1008 pour 840, glisse 168 px, titre coupé. m-l-feuille-vente, 47, 49 |
| 3 | Les points des jours actifs vivent dans la piste (en % de sa largeur) : même place à 844 et 1280, jamais sous « J0 / … » | geste-bruit n° 8 (nouveau, 844 × 390) : 4 points, 0 sur le texte ; 58-d-1280 et 51-l-f2a |
| 4 | Feuille Vente : champs vides, Café du Pont reste une puce qu'on touche ; un champ rempli se sélectionne au toucher ; plus de 10 fois la plus grosse somme de la rangée : une ligne d'alerte et « Oui, 200 130 CHF en S47 » à confirmer | plus-agit (nouveau) : champs « / », 200 130 → feuille gardée, alerte ; témoin : « Café du Pont / 130 », posée sans alerte |
| 5 | Une étiquette de barre qui touche une autre barre passe de l'autre côté de sa barre, sinon dedans ; elle revient quand la voie est libre | geste-bruit n° 8 : aucune étiquette dans une autre barre ; témoin : « IPA houblon à cru −232 » dans la Blonde. 48, 51, 58 : IPA dans sa barre |
| 6 | Au bord de la vue, la date passe dans l'étiquette : « Blonde d’automne −380 · prête 18 janv. » ; la barre est replacée avec son étiquette allongée | plus-agit (nouveau) : brassin S52 « J0 / 28 Saison · prête 18 janv. » ; témoin : « J0 / 28 Saison ». 54-p-retour-milieu |

Contrôles (sortie : `cap/passe9/_controles.txt`) : ROTATION OK, PLUS-AGIT OK, BRUIT OK, BANDE OK, ENTETE OK, PLUS OK. Témoins passe 8 (copie hors du dossier) : BRUIT ECHEC et PLUS-AGIT ECHEC sur chaque point neuf.
Rejoué au doigt par `cap/passe9/jouer.mjs` (le jeu de la critique 8 ; la vente du + de Ventes touche la puce Café du Pont, comme le brasseur) et `mesure.mjs` : 58 + 6 captures, **0 erreur de page**, planches `_p9a` à `_p9f` ouvertes.
Reste à voir : en hauteur, le message posé en bas couvre parfois une pastille de Papiers (−312) jusqu'au premier défilement ; c2-b pousse toujours la frise (doute de la critique 8).

## Passe 10 (17.11, ses mots : « Le bouton+ ici n'a pas du tout la bonne fonctionne, juste fix ça et tu peux faire le portage dans la vraie app. Avec tout ce qui a été retenue ECT... »)
Base z2s et gestes retenus intacts ; tout dans `src/as-gestes.js` et `.css` (copie de la passe 9 : `%TEMP%/as-p9/`), assemblés par `src/build.mjs` ; `pub/` réécrit.
Sa règle du + : « certaines actions doivent toujours être possible, juste celle de l'écran actuel sont plus mis en avant. Et le bouton doit toujours être flottant.... » (15.11) ; « le bouton+ dépend de son action principal en fonction de là où il est » (16.11).

| # | Changement | Preuve (`cap/passe10/_jeu.json`) |
|---|---|---|
| 1 | Le + volant n'ouvre plus la feuille « Ajouter » : il ouvre les **actions rapides**, à l'habit de l'app (b1s-b2 « La pile au pouce », `FloatingActions.tsx`, `PlusSheet.tsx`, `navigation.css`) : pilules alignées à droite qui montent du +, voile, fond flouté derrière la pile, le + devient × neutre | p-clair-ouvert, p-sombre-ouvert : 13 lignes, pile 39–339 × 128–722, rien ne déborde ; aria-expanded true ; le focus va à la première ligne |
| 2 | « **Sur le calendrier** », contre le pouce : une ligne par rangée, dans l'ordre de la frise ; Poser un brassin pleine (couleur de Brassins, « S47 · prête le 14 déc. »), puis Poser une fête, Poser une vente, Prévoir un achat, Prévoir des travaux, Noter une activité, Prévoir un papier, chacune teintée de sa rangée. Chacune ouvre la feuille d'ajout existante **déjà sur sa rangée** (`ouvreAjout(v)`) | p-*-fete : « Ajouter dans Fêtes », Fête pressé, Ajouter en S47 ; p-*-brassin : Brassin pressé ; l-*-papier : Papier pressé |
| 3 | « **Partout** », au-dessus : les gestes communs de l'app dans son ordre (`COMMUNS` de `plusEcran.ts`) : Écriture, Facture, Vente, Recette, Brassin, Compagnon, deux colonnes de pilules de 44 px. Dans le jouable, un message court « Ouvre Entrer une facture » | p-*-facture |
| 4 | **Plus d'étiquette de semaine** sur le + (#fabl retiré, refus i7 « + S47 dans le bouton volant ») ; le + garde sa place (droite, 295–339 × 730–774, 14 px au-dessus des onglets) et sa forme ; nom « Actions rapides » | p-*-ferme |
| 5 | Fermer : le +, le voile, Échap (focus rendu au +), Tab, un choix, la rotation. Flèches et Début/Fin dans la pile | p-*-voile, p-*-refait : pile fermée |
| 6 | En largeur (844 × 390, `cal.html` comme `cal-paysage.html`) : les deux groupes côte à côte, le calendrier contre le +, ses lignes en deux colonnes au nom de leur rangée seul (Fête, Vente…), Poser un brassin pleine en bas | l-clair-ouvert, l-sombre-ouvert : pile 232–832 × 48–268, rien de coupé |

Le + du carré de rangée ne change pas ; aucune case pointillée (refus R2 : « cases + visibles : 0 »).
Les lignes du calendrier portent `as-ty` et `data-v` (le rôle des choix de la feuille : choisir la rangée), si bien que les contrôles qui posent par le + volant (rotation, feuille en largeur) font le vrai chemin : + → Papier → feuille sur Papiers. Aucun contrôle modifié.

Rejoué au toucher par `cap/passe10/jouer.mjs` (390 × 844 tactile clair et sombre, 844 × 390 clair et sombre) : **0 erreur de page**. Captures ouvertes : p-clair-ferme, p-clair-ouvert, p-sombre-ouvert, p-sombre-fete, p-clair-facture, l-clair-ouvert, l-sombre-ouvert.

### Contrôles (depuis la racine, sortie : `cap/passe10/_controles.txt`)
- controle-plus-agit cal.html et cal-paysage.html : **PLUS-AGIT OK** (+ volant : « feuille, 13 choix »)
- controle-geste-bruit cal.html : **BRUIT OK** ; cal-paysage.html : BRUIT ECHEC, **identique sur le témoin passe 9** (copie hors du dossier, même sortie : « f1-a puis f6-b … Achats × Commande groupée de malt ») : pas de cette passe
- controle-bande-semaine cal.html, cal-paysage.html --paysage, pub/calendrier.html --large : **BANDE OK**
- controle-entete-cal cal.html : **ENTETE OK** ; controle-plus-rangees cal.html : **PLUS OK**
- controle-rotation pub/calendrier.html : **ROTATION OK** (le papier se pose par + → Papier)

Reste à voir :
- `cal-paysage.html` seul : le message de f1-a puis f6-b chevauche « Commande groupée de malt » (BRUIT, déjà là en passe 9) ;
- au port : la pile de l'app (`PlusSheet`) reçoit les sept lignes du calendrier par `usePlusPage` (aujourd'hui trois : brassin, fête, dépense) ; « Brassin » et « Vente » de Partout ne sont pas les mêmes gestes que « Poser un brassin / une vente » du calendrier (lancer et encaisser, contre poser au calendrier).
