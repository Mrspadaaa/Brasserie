# Revue UX/UI de la page 5 « Brassins · tes choix et la suite » (15.11)

Critique seule, aucune maquette neuve. Skills `boosters-ux` et `impeccable` (critique). Méthode dégradée : un seul contexte,
car un sous-agent ne peut pas en lancer d'autres ; le détecteur d'impeccable a tourné à part (fin de note).

- Page : `page5/index.html`, ouverte dans Chrome sans écran, en clair, à 390 px tactile et à 1280 px.
- Maquettes : leurs captures dans `page5/img/` (repos, geste, cave, vide, 1280), plus les `voies/*/<id>/etat.html` mesurés à
  390 × 844.
- Parents regardés : s4a, s6c, e6a, e6c.
- Captures de revue (temporaires) : `C:\Users\mrspa\AppData\Local\Temp\claude\2574149e6fd34767\16fc09ec-4e69-48a9-9744-5912b6ef6552\scratchpad\p5\`
  (`p390-s0..s4.png`, `p1280-s0..s2.png`, et les planches `m-gf-repos.png`, `m-gf-geste.png`, `m-g6-*.png`, `m-e5n-*.png`,
  `m-parents.png`, `m-cave.png`).

Ses mots : « Toujours pas très clair ».

## Pourquoi « pas très clair » : la réponse courte

Le flou vient d'abord de la page, ensuite des maquettes.
- **La page.** À 390 px, elle déborde et se coupe. Elle montre chaque variante en vignette de 149 px, où l'on ne lit rien.
  Elle parle en codes et en verdicts du critique au lieu de dire ce qui change. Elle pose trois questions neuves et cinq
  anciennes sur 23 écrans.
- **Les maquettes.** Dans chaque famille, les variantes se ressemblent à 90 % à cette taille : la différence ne se voit pas.
  Chaque écran redit la même information deux à cinq fois.

## Mesures (lues au rendu)

| Mesure | 390 tactile | 1280 |
|---|---|---|
| Largeur rendue (`scrollWidth`) | **980 px** pour 390 de vue, `overflow-x: hidden` sur body : tout est coupé, rien ne défile | 1280, sans débordement |
| Vignette d'une variante | **149 px** (0,38 × l'écran réel) | 199 px (0,51 ×) |
| Hauteur de page | **19 792 px** (≈ 23 écrans) | 24 553 px |
| Vignettes et liens | 182, en 11 sections | idem |
| Tailles de texte de la page | 24, 20, 17, 16, 14 (h2 et h3 font tous deux 20 px) | idem |

Les mesures ci-dessous portent sur le premier écran (390 × 844) de chaque `etat.html`, chrome de l'app compris.

| Maquette | Mots visibles | Tailles de texte | Cibles | Cibles < 24 px |
|---|---|---|---|---|
| gfa | 154 | 12/13/14/16/18/28 | 27 | 0 |
| gfb | 142 | idem + **10 px** | 26 | 0 |
| gfc | 140 | 12/13/14/16/18/28 | 25 | 0 |
| gfd | 130 | 12/14/16/28 + **10 px** | 26 | 0 |
| g6a | 124 | 12/13/14/16/18/28 | 39 | 0 |
| g6b | 111 | idem | 36 | 0 |
| g6c | 104 | 12/13/14/16/18/20 | 34 | 0 |
| e5na | 80 | 12/13/14/16/18 | 18 | 0 |
| e5nb | 127 | 12/13/14/16/18/28 | 39 | 0 |
| e5nc | **46** | 12/13/14/15/16/28 | 16 | 0 |
| e5nd | 79 | 12/13/14/16/18/28 + **11 px** | 25 | 0 |

- B13, les cibles : bon partout.
- B6, la règle des trois tailles : dépassée partout, avec six tailles et plus. Une part revient au chrome de l'app.
- Sous le plancher de 12 px : gfb, gfd et e5nd.

---

## La page

**Hiérarchie.** Rien ne domine. Le cadre « Tes choix sont gardés » est le seul élément accentué, mais il ne dit pas *quoi*
regarder. Les trois sujets du jour (gf, g6, e5n) commencent à y = 1 700 environ, après trois cartes « Tes choix, retenus ». Ils
sont suivis de cinq groupes « Encore sans réponse » (e2, e3, e8, e10, e11), soit environ 15 écrans de plus.

**Premier plan à 390.** Le titre, l'intro et la consigne « Dis un nom par vue (ex. gfa, g6b) » sont **coupés à droite**
(capture `p390-s0`). Dans chaque rangée, on voit au mieux deux vignettes et demie sur quatre à six. Les états Thème (cave),
Vide et 1280 sont invisibles et hors d'atteinte, puisque body coupe sans défiler. La consigne même du choix est tronquée.

**Ce qui se lit en 3 s.**
- « Une page de vignettes. » On ne lit pas le contenu des maquettes : texte de 12 px réduit à 4,6 px.
- On ne voit pas leurs différences : gfa, gfb, gfc et gfd sont quatre feuilles « Dry hop demain » à peu près identiques en
  vignette.

**Doublons et jargon.**
- Chaque variante porte un code, un titre, puis « Classement : 1er sur 4 · s4a en propre, ses houblons de s6c dessous ».
- On y lit le verdict du critique en codes (« l'axe à pas variable fausse la pente », « la tête de e6a est perdue »). Il
  faut traduire s4a, s6c, e6a et e6c de mémoire.
- Aucune phrase ne dit, en mots de brasseur, ce qui change par rapport à son choix.
- « Après le geste » ne dit pas quel geste.

**Référence côte à côte (D126).**
- gf : s4a et s6c sont montrées une fois, au-dessus. Bien, mais en vignettes de 149 px elles aussi.
- g6 : e6a et e6c, idem.
- e5n : les quatre « premières » refusées ne sont pas remontrées. Il ne peut pas juger si l'idée est « d'un autre genre ».

**Gestes.** Choisir = taper un code dans le fil. Aucun toucher « je prends celle-ci » sur la page.

**Cohérence.** La page est en `system-ui`, pas en Source Sans 3 ou IBM Plex Mono. Cela reste accessoire pour une page de
choix, mais les vignettes et la page n'ont pas la même voix.

### Recommandations, page (par priorité)

1. **Réparer le 390.**
   - Les vignettes en rangée qui défile (`overflow-x: auto`, `scroll-snap`), ou deux colonnes.
   - Aucun ancêtre plus large que la vue.
   - Contrôle : `scrollWidth` = 390, et la consigne lisible en entier sur la capture.
2. **Un écran = une question.**
   - Garder seulement les trois sujets ouverts (fiche en fermentation, filtres, Créer un brassin).
   - « Tes choix, retenus » tient en une ligne de pastilles (e1a, e4c, e7a).
   - « Encore sans réponse » passe sur une page à part, ou dans un repli fermé. Hauteur visée : 6 écrans au plus à 390.
3. **Montrer la maquette en grand, et la différence dessinée.**
   - À 390, l'image au repos de chaque variante en pleine colonne : 358 px ou plus, au lieu de 149.
   - Sur cette image, un ou deux repères (cercle ou flèche) sur la zone qui diffère des autres. Exemple pour gfc : l'accolade
     qui relie les houblons à J+6.
   - Les autres états en rangée défilante dessous.
4. **Des mots de brasseur à la place des codes et du classement.**
   - Une ligne « Ce qui change : le graphique en haut, les houblons accrochés à leur jour ».
   - Le classement du critique en petit, en fin de carte, ou retiré : c'est une proposition (L27).
   - Nommer le geste : « après "Ajouté auj." sur Citra ».
5. **La référence à côté.** Pour chaque famille, sa maquette parent à gauche, à la même taille que la variante, comme
   l'impose D126. Pour e5n, remonter une vignette des quatre refusées, afin qu'il voie le « autre genre ». Puis un toucher
   « Je prends » par variante, qui compose la réponse (« gfa, g6b, aucune ») à copier.

Nielsen (la page comme outil de choix), en bref : statut 1, langage du métier 1, contrôle 2, cohérence 2, prévention
d'erreur 2, reconnaissance plutôt que mémoire **0** (codes), efficacité 1, minimalisme 1, récupération s.o., aide 2.
Total **12/36**, bande « faible ».

---

## Fiche en fermentation : gfa à gfd (s4a × s6c)

Ses mots : « Dans l'idéal mais s4a est beaucoup trop chargé. Mais j'aime bien le graph sur le temps ».
- **À garder** : le graphique de densité dans le temps, de s4a.
- **À retirer** : la charge de s4a (rangée °C, consignes, case +, etc.).
- **De s6c** : les houblons en colonnes, avec leurs barres d'arômes.

Les barres viennent de son choix s6c : elles restent (règle n° 1).

**Constat commun.**
- **Un squelette pour quatre.** Les quatre partagent la même feuille et ne diffèrent que par l'ordre et le lien entre le
  graphique et les houblons. À la taille de la page, rien ne les distingue.
- **J+6 redit cinq fois.** Le titre « Dry hop demain », « dim. 15.11 », la colonne J+6 teintée, les pictos dans la
  colonne, puis « Dry hop · J+6 » ou « Quand ajouter ? ». Le bouton « Quand ajouter ? » pose une question dont le titre
  donne déjà la réponse.
- **La barre du bas change dans chaque variante :**
  - « Mesurer » avec « cuve — / 19 °C » ;
  - « Densité / °C cuve » ;
  - « Mesurer densité · °C cuve — / 19 ».

  Le « — » de « cuve — » se lit comme un moins, pas comme « non mesuré ».

### gfa — Le tableau s4a réduit au graphique

- **Hiérarchie.** Trois masses de 28 px se battent : le titre, 100 g et 80 g. Le graphique, ce qu'il aime, est bien
  au centre, sous une frise de jours et une bande de phases.
- **Premier plan.** Neuf blocs, au-delà des 7 visés :
  - en-tête de la feuille ;
  - ligne J+5 avec alc. et att. sur 3 lignes grises ;
  - titre ;
  - frise ;
  - bande des phases ;
  - courbe ;
  - ligne « Dry hop · J+6 / Quand ajouter ? » ;
  - deux cartes houblon ;
  - tâches J+7 et J+10, coupées sous la barre.
- **En 3 s** : « dry hop demain ; la densité est à 1,018 et descend vers 1,010–1,014 ». C'est juste et rapide.
- **Doublons.** J+6 cinq fois ; J+5 deux fois (« J+5 · levuré », « J+5 auj. »).
- **Densité.** 154 mots, le plus chargé des quatre. Les tâches J+7 et J+10 sont à moitié cachées.
- **Gestes.** « Mesurer » ouvre une feuille avec − et +, un curseur et la bande FG visée. « encore 0,002 jusqu'à la bande »
  est le meilleur booster de la famille. Le point 1,016 s'ajoute à la courbe. « Taper » est un libellé obscur (pour « au
  clavier »).
- **Cohérence.**
  - Six tailles de texte.
  - « auj. » en mono : un mot en mono, et non une mesure.
  - Les tâches J+7 et J+10 ont le même fond gris que les boutons « Ajouté auj. » : on ne sait plus ce qui est une action.
  - À 1280, la frise s'étire bien (J+0 à J+12, OG 1,062 visible).

Recommandations :
1. **La date dans le titre.**
   - Fusionner « Dry hop · J+6 / Quand ajouter ? » dans le titre, rendu touchable : « Dry hop demain · dim. 15.11 › ».
   - Supprimer la ligne. Les 40 px gagnés rendent les tâches J+7 et J+10 entières.
2. **Les tâches comme une liste à cocher.** Sans fond de bouton, ou posées dans leur colonne de la frise (J+7, J+10) : la
   frise sert alors de calendrier.
3. **Une mesure absente se dit.** « cuve — / 19 °C » devient « °C cuve non mesurée · consigne 19 », ou une pastille
   creuse. Cela vaut pour toute la famille.
4. **Trois tailles.** Titre 28, données 14, libellés 12 ; doses en 18 px mono. Le titre redevient la seule masse
   dominante.
5. **Greffes à prendre ailleurs.**
   - L'accolade houblons ↔ J+6 de gfc.
   - Le titre réécrit après le geste (« Citra ajouté, Mosaic demain ») et l'annonce « Stock Citra −100 g · Annuler » de gfb.

### gfb — Le houblon d'abord, la frise ensuite

- **Hiérarchie.** Deux dominantes : le titre et une grande tuile ocre « J+6 dim. 15.11 ». Le graphique passe second et
  plus petit, à l'inverse de « j'aime bien le graph ».
- **Premier plan.** Titre, tuile J+6, « Quand ajouter ? », deux cartes houblon, graphique, deux boutons égaux en bas. Les
  tâches sont coupées.
- **En 3 s** : « Citra 100 g, Mosaic 80 g ». La tendance de densité se lit en second.
- **Doublons.** Tuile J+6, colonne J+6 et « Quand ajouter ? ». Titre de 28 px et tuile se répondent.
- **Gestes.** Le meilleur retour de la famille : le titre devient « Citra ajouté, Mosaic demain », la carte passe au vert
  « 14.11 · −100 g », et une annonce noire dit « Stock Citra −100 g · Annuler ».
- **Cohérence.** Texte de 10 px mesuré, sous le plancher. Deux boutons de bas de même poids : pas d'action primaire.

Recommandations :
1. Ne pas la retenir comme base : elle relègue le graphique qu'il a aimé.
2. Greffer son retour de geste (titre réécrit, annonce de stock et annulation) dans la candidate.
3. Retirer la tuile J+6 : la date tient dans le sous-titre.
4. Un primaire unique en bas, « Mesurer », comme gfa ; le 10 px passe à 12.

### gfc — Houblons pendus à leur jour

- **Hiérarchie.** La plus nette des quatre : le titre, puis le graphique pleine largeur, puis les houblons. Une seule
  barre primaire, « Mesurer ».
- **Premier plan.** Titre, ligne « densité 1,018 13.11 », graphique, bande des phases, règle des jours sous l'axe, accolade,
  deux houblons. Sept blocs.
- **En 3 s** : « la densité tombe ; Citra et Mosaic, c'est J+6 ». L'accolade qui pend du jour J+6 aux deux cartes est le
  booster relationnel le plus fort de la page.
- **Doublons.** La bande des phases, la règle des jours et le losange J+6 sur la bande redisent le jour. « J+6 » est aussi
  écrit sur chaque carte, et « Quand ajouter ? » reste en haut à droite.
- **Densité.** Correcte, 140 mots. Le graphique perd sa grille verticale de jours : on ne compte plus les jours dans la
  courbe.
- **Gestes.** « Ajouté auj. » : la carte passe au vert « −100 g au stock », le titre se réécrit, l'accolade suit.
- **Cohérence.** Règle des jours sous l'axe : la convention de lecture d'un graphique. Bien.

Recommandations :
1. Rendre au graphique de fines lignes verticales par jour, alignées sur la règle (celles de s4a).
2. C'est la meilleure base de lecture ; l'accolade est sa signature. En faire la candidate, ou la greffer sur gfa.
3. Retirer « Quand ajouter ? » et le « J+6 » répété sur les cartes : l'accolade suffit.
4. Fondre la bande des phases dans la règle (fond teinté sous les jours) : une bande de moins.

### gfd — Le jour J+6 s'ouvre

- **Hiérarchie.** Le graphique est haut et pleine largeur, mais au repos la colonne J+6 est **déjà ouverte** en surcouche :
  « Quand ajouter ? » et deux cartes houblon étroites cachent la moitié droite de la courbe, là où vont le dry hop et la FG.
- **En 3 s** : on lit une fenêtre, pas la réponse. « Dry hop demain » et le contenu de la surcouche se disputent.
- **Honnêteté.** L'axe à pas variable fausse la pente. Le produit refuse d'inventer : une pente faussée est un chiffre
  trompeur.
- **Densité.** Barres d'arômes de 80 px environ dans la surcouche : illisibles. Texte de 10 px mesuré.
- **Gestes.** Le seul où toucher un jour ouvre ce jour. C'est une bonne idée de geste, mal placée au repos.

Recommandations :
1. Axe régulier, obligatoire.
2. Surcouche fermée au repos ; ouverte au toucher d'une colonne, puis refermée.
3. Ne pas la retenir comme base.
4. Greffe possible : toucher une colonne de jour ouvre ses tâches (J+7 « Cuve à 21 °C », etc.) dans la candidate.

---

## Retrouver et filtrer : g6a à g6c (e6a × e6c)

Ses mots exacts (SPEC, 15.11) : « e7a — e6a — e6c Des filtres qui comptent — ».
- **La lecture du pilote** : « e6a greffée des filtres qui comptent de e6c ». Les trois variantes ont donc sorti les
  filtres comptés de e6c sur la surface de la liste.
- **Une autre lecture, littérale** : deux choix, e6a pour la liste et e6c, telle quelle, pour la feuille « Filtrer » qui
  s'ouvre de son bouton. Le compliment porterait alors sur e6c.
- e6a comptait déjà ses puces (« Tous 5, En cuve 2… »). La lecture littérale manque à la série. C'est sans doute la plus
  claire, et la seule qui reprend ses deux maquettes telles quelles (règle n° 1).

**→ remarque au pilote**, pas tranchée ici.

### g6a — Puces qui comptent, sous la recherche

- **Hiérarchie.** Le titre « 2 en cuve / 1 à brasser » domine, comme dans e6a. Viennent ensuite **trois rangées de puces** :
  cinq états, puis quatre ou cinq styles (la rangée des styles est coupée à droite, sans indice de défilement), le tri et la
  période.
- **Premier plan.** La liste commence vers y = 380 : **45 % de l'écran sert au filtre**, avant le premier brassin.
- **En 3 s** : « 2 en cuve, 1 à brasser ». Juste.
- **Doublons.**
  - « 2 en cuve » dans le titre et « En cuve 2 » dans la puce.
  - « 1 à brasser » dans le titre et « À brasser 1 » dans la puce.
  - « 5 brassins » et « Tout voir 5 ».
  - Le point de couleur des puces répète le liseré gauche des cartes et la pastille d'état.
- **Gestes.** Excellent retour au toucher :
  - la puce passe au noir avec × ;
  - les autres affichent 0 et s'éteignent ;
  - le titre devient « 2 en cuve, NEIPA et Pils » ;
  - « 3 autres hors du filtre » vient en liste fantôme.

  L'état vide (« Rien pour Stout en cuve » et « Retirer "Stout" 2 / Retirer "En cuve" 1 ») est le meilleur état de récupération
  de la page.
- **Cohérence.** Trois façons de tout remettre à zéro : « Plus », le × d'une puce, « Tout voir 5 × ». À 1280, les
  filtres passent en colonne gauche de boutons empilés, propre.

Recommandations :
1. Une seule rangée de puces (les états, comme e6a) ; les styles vont dans la feuille. La liste commence alors vers
   y = 260.
2. Le titre résume, les puces filtrent : retirer le nombre des puces que le titre dit déjà, ou rendre le titre neutre.
3. « Plus » devient l'icône filtre avec son badge (déjà vu au geste : « 1 »).
4. Garder tels quels l'état vide et la liste « hors du filtre » : à greffer dans la candidate, quelle qu'elle soit.

### g6b — La phrase qui filtre

- **Hiérarchie.** Une phrase de 28 px, « 2 en cuve / 1 à brasser / 1 conditionnée · 1 écoulée · 1 ★ », dont chaque terme est
  un filtre ; le terme choisi devient une pilule noire avec ×.
- **Premier plan.** C'est **la seule variante sans doublon** : le résumé *est* le filtre. La liste commence vers y = 280,
  plus haut que g6a, ce qui contredit le « trop lourde avant la liste » du classement.
- **En 3 s** : juste.
- **Faiblesse.** Seul un souligné de couleur dit que c'est touchable : sans indice, on peut lire du texte. La recherche
  et « Filtres » restent dessous. « Nov. + en cours » flotte à droite de la phrase. Les styles ne sont pas visibles.
- **Gestes.** Pilule noire, « Tout voir 5 », liste « 3 autres hors du filtre » : clair.

Recommandations :
1. Phrase sur deux lignes, en 22 px ; la ligne secondaire (conditionnée, écoulée, ★) en 14.
2. Un indice de toucher : chevron fin ou fond très pâle sous chaque terme. Un souligné seul ne suffit pas au doigt.
3. « Nov. + en cours » passe dans la rangée du tri.
4. À ne pas classer dernière : c'est la plus économe des trois.

### g6c — Chaque section se compte

- **Hiérarchie.** La tête de e6a, qu'il a choisie, est perdue : pas de « 2 en cuve ». Trois menus déroulants (Style,
  Favoris, Houblon), puis des sections « En cuve 2 · Seule ⌄ ».
- **Premier plan.** Les menus cachent les options : deux touchers pour voir. Le « 5 » au coin de « Style Tous » ne dit pas
  ce qu'il compte.
- **En 3 s** : « une liste en sections ». La réponse (combien en cuve) se lit dans un en-tête de section.
- **Doublons.** « Seule » sur chaque section, avec un chevron à côté : deux commandes par section.
- **Gestes.** Style Pilsner : « En cuve 1 sur 2 », puis « Sections vides pour ce filtre ». Honnête. L'état vide « La Stout
  n'a pas d'étoile » est clair.

Recommandations :
1. Rendre la tête de e6a (règle n° 1).
2. « Seule » est ambigu : toucher le titre de section filtre, le chevron replie ; un seul libellé.
3. Remplacer les menus déroulants par les puces comptées de e6c, dans la feuille.
4. À greffer : les sections comptées « 1 sur 2 » dans la liste de la candidate.

---

## Créer un brassin : e5na à e5nd

Ses mots : « Créer un brassin ?? Pas convaincu ». Il faut fixer quatre choses : la bière (recette), la date, le volume et
la cuve.

### e5na — Le brassin naît dans sa frise

- **Hiérarchie.** Le bloc « Planifier » (NEIPA ▾, 24 L ✎, « quand ? ») domine, puis cinq étapes en pointillés. **Aucun
  bouton primaire au repos** : on ne sait pas comment finir.
- **Premier plan.** Six cartes, toutes en pointillés, avec des ronds pointillés : un bruit de traits.
- **En 3 s** : « un nouveau brassin NEIPA de 24 L, et sa vie à venir ». Bien.
- **Doublons.**
  - Deux demandes de date : « quand ? » (Planifier) et « date ? » (Brassage). Laquelle ?
  - « ≈ 22 L à tirer » en bas, 24 L en haut.
  - À 1280, le panneau gauche « Planifier LOT-021 » (tuiles de recette et curseur de volume) **redit** la carte Planifier
    de droite : deux endroits pour la même saisie.
- **Gestes.** La cuve se choisit dans la carte « Fermentation » (F1 et F2 hachurées, F3 « après la Pils »), loin du reste.
  Après « quand », la carte passe au vert « Planifié » et « Commencer le brassage » apparaît.

Recommandations :
1. Une seule date, celle du brassage, dans Planifier ; la carte Brassage l'affiche en lecture.
2. Toute la saisie sur une rangée : « NEIPA ▾ · 24 L · F3 ▾ · quand ? ».
3. Un primaire visible dès le repos (« Planifier », accepté avec « à définir »).
4. Les étapes futures en texte atténué, avec une bordure pleine et fine : un seul pointillé, celui de ce qui manque.
5. À 1280, supprimer l'un des deux panneaux Planifier.

### e5nb — La carte fantôme dans la liste

- **Hiérarchie.** Une carte pointillée en tête de liste, avec trois rangées de puces (Bière, Quand, Cuve) et l'annonce
  « LOT-021 ajouté en tête · Annuler » **dès le repos** : créé avant d'être voulu.
- **Premier plan.** Les rangées de puces débordent à droite (« Pils », « sam. 21 » coupés), sans indice. « OK » est petit et
  secondaire.
- **Honnêteté.** Le titre passe à « 2 à brasser » alors que le brouillon n'est pas confirmé : un compte gonflé.
- **Doublons.** Trois statuts : la pastille « Planifié · date à définir », la bordure pointillée et l'annonce.
- **Gestes.** Tout se passe sur place, dans la liste, et c'est l'atout : il voit F3 occupée par la Pils.

Recommandations :
1. Ne pas compter le brouillon avant la confirmation.
2. Remplacer « OK » par un primaire « Planifier » dans la carte ; l'annonce ne vient qu'après.
3. Les puces sur deux lignes, ou un indice de défilement (fondu à droite).
4. Un seul statut visible.

### e5nc — Une question par écran

- **Hiérarchie.** La plus claire de la page : « Quelle bière ? » et cinq verres à la couleur de la bière. « dernier brassin
  09.11 » et « prévue » ajoutent le contexte. **46 mots** au premier écran.
- **En 3 s** : « choisis ta bière ». Sans hésitation.
- **Doublons.** La barre « 1 sur 3 » et la liste récapitulative des étapes (1 Bière, 2 Quand, 3 Volume et cuve) disent la
  même progression. La liste a pourtant son utilité : elle montre les valeurs par défaut (« 24 L de la recette »).
- **Gestes.**
  - Le calendrier marque « dry hop » le dim. 15 : un conflit visible avant le choix. Excellent.
  - Le volume se règle au curseur, avec ≈ 22 L à tirer.
  - Les cuves occupées sont hachurées, et F3 dit « libre une fois la Pils tirée ».
  - L'écran final récapitule, montre la carte « Dans la liste » et la frise « Ce qui vient ».
- **Nombre de touchers.** Verre, jour, cuve : trois touchers. Le « trop de touchers » du classement est discutable,
  e5na en demande autant.

Recommandations :
1. Avance automatique et sauts : si la recette porte un volume et qu'une seule cuve est libre, l'étape 3 se saute (deux
   touchers).
2. Garder la liste récapitulative et retirer la barre de progression, ou l'inverse.
3. Calendrier compact : deux semaines en tuiles de 56 px au lieu de 80. La teinte des week-ends est sans légende : la
   retirer, ou la dire.
4. La remonter dans le classement : c'est la réponse la plus directe à « pas très clair ».

### e5nd — Penser en bouteilles

- **Hiérarchie.** La bouteille, ≈ 40 % du premier écran, porte « NEIPA LOT-021 date ? ». À côté : « ≈ 66 × 33 cl », « ≈ 22 L à
  tirer », « 24 L brassés », « lie et dry hop ≈ 2 L ». C'est le seul genre vraiment neuf, et il est honnête (le ≈ partout).
- **Premier plan.**
  - Une rangée de pastilles de bière, coupée à droite (« No… »).
  - Le curseur double, litres dessus et bouteilles dessous (24 bt., 54, 66, 84 bt.) : un très bon booster.
  - Des puces de date, puis « Planifier LOT-021 ».
- **En 3 s** : « ≈ 66 bouteilles de NEIPA ».
- **Gestes.** Après Planifier, « Préparer le brassage » passe **sous la barre d'onglets et le + flottant**, qui le
  chevauchent.
- **Cohérence.**
  - Le + flottant sur l'écran de création fait doublon.
  - Texte de 11 px mesuré.
  - La cuve n'est pas choisie au repos : elle n'apparaît qu'au geste (« cuve F3 »).

Recommandations :
1. Masquer le + flottant sur cet écran, et garder le primaire au-dessus de la barre d'onglets.
2. La bouteille réduite d'un tiers environ ; les pastilles sur deux lignes, ou avec indice de défilement.
3. Montrer la cuve choisie (F3 · après la Pils) sous le curseur.
4. 11 px → 12 px.
5. Greffe possible sur e5nc ou e5na : le curseur litres ↔ bouteilles.

---

## Détecteur impeccable (une passe, à titre d'indice)

- page5 : 54 constats.
  - 45 « low-contrast » : faux positifs, la variable sombre `--mute` est lue sur fond blanc.
  - 1 « broken-image » : le `<img src="">` de la boîte `<dialog id="vue">`, faux positif.
  - Le reste : couleurs, rayon et tailles hors DESIGN.md (page outil, accessoire).
- gfa : 16 constats, dont 2 « border-accent-on-rounded » (le liseré de couleur des cartes houblon, qui vient de s6c, son
  choix : à garder).
- g6a : 2 constats.
- e5nd : 12 constats, dont « repeating-stripes-gradient » (les hachures de la cuve pleine, qui ont un sens : à garder).

## Synthèse pour le pilote (par priorité)

1. **Page.** Réparer le débordement à 390 (980 px coupés). Puis une maquette en grand avec la différence entourée, en mots
   de brasseur, sa référence à côté, sans codes ni classement. Trois sujets seulement.
2. **gf.**
   - Base : gfc pour la lecture (graphique, puis houblons accrochés à leur jour), avec la grille de jours rendue, ou gfa
     avec l'accolade de gfc.
   - Greffe de gfb : son retour de geste.
   - Partout : retirer « Quand ajouter ? » et dire « non mesurée » au lieu de « — ».
3. **g6.** Montrer la lecture littérale manquante : e6a telle quelle et e6c telle quelle en feuille. Garder de g6a son état
   vide et la liste « hors du filtre ». g6b est sous-classée.
4. **e5n.** e5nc est la plus claire en 3 s, avec le moins de mots. Lui greffer le curseur en bouteilles de e5nd. e5na
   demande un primaire et une seule date ; e5nb ne doit pas compter un brouillon.

DÉCISION À PRENDRE : la lecture de « e6a — e6c Des filtres qui comptent ». Soit la greffe actuelle (filtres sur la liste),
soit les deux maquettes telles quelles, liste et feuille. À montrer en variantes (L24), pas à trancher.
