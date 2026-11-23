# F — Boosters UX : catalogue, bascule de lentille, application aux houblons

Recherche du 18.10.2026 (chercheur et designer d'interaction, Opus). Sources web consultées
le 18.10.2026. Le catalogue de travail qui en découle est [docs/ux-boosters.md](../../../../docs/ux-boosters.md).

Ce rapport complète B ([B-pratiques-ui.md](B-pratiques-ui.md)) sans le refaire. B couvre :
- les normes des plateformes et la lecture au coup d'œil ;
- le bullet graph et l'incertitude ;
- les critiques du radar et les apps de référence (Météo, Signes vitaux, Oura, YNAB, Vivino).

Les marques **[sec.]** signalent une source secondaire, à vérifier sur l'app.

**Demande d'origine** (SPEC-BRASSEUR § 3 et 4) :
- « plein d'outils UI à dispo autre que les boutons ou champs text » ;
- « Je vois aussi aucun slider ou autre UX booster » ;
- « si j'appuie dessus celà change et fait une rotation. utilise ce principe PARTOUT » ;
- « basculer d'un affichage à un autre, type bare graph à radar graph » ;
- « C'est pas assez encourager ».

---

## 1. Ce qu'est un booster, et le test pour l'admettre

**Fondement.** Shneiderman a défini la manipulation directe par trois traits
([*Direct Manipulation*, IEEE Computer, 1983](https://doi.org/10.1109/MC.1983.1654471)) :
- une représentation continue de l'objet ;
- des actions physiques plutôt qu'une syntaxe ;
- des opérations rapides, incrémentales et réversibles, dont l'effet se voit tout de suite.

C'est exactement « on agit, on voit ». Deux autres cadres s'y ajoutent :
- **Saffer** (*Microinteractions*, O'Reilly, 2013) découpe une micro-interaction en
  déclencheur, règles, retour, puis boucles et modes. Un booster raté a souvent un
  déclencheur invisible ou un retour absent.
- **Bret Victor** ([*Explorable Explanations*, 2011](https://worrydream.com/ExplorableExplanations/))
  rend le lecteur actif : il clique et glisse sur le modèle au lieu de lire son résultat.
  [Tangle](https://worrydream.com/Tangle) en est l'outil, avec des nombres qu'on glisse
  dans le texte.

**« Frappant » n'est pas « décoratif ».** Les embellissements portés par la donnée aident
la mémorisation sans nuire à la lecture (Bateman et al., *Useful Junk?*, CHI 2010) ; les
autres consomment l'attention. Le brasseur a sanctionné l'excès comme le manque :
- d'un côté, « écrans de central nucléaire ou cockpit d'avion » (D23) ;
- de l'autre, « trop textuel » (C094).

**Test d'admission.** Il est repris dans le catalogue ; un « non » écarte le booster.
1. Quelle relation, conséquence ou quel choix devient immédiat ?
2. Remplace-t-il du texte ou des gestes ?
3. Un indice visible dit-il qu'on peut agir ?
4. A-t-il son alternative : toucher simple, clavier, mouvement réduit, lecteur d'écran ?

## 2. Le catalogue : 37 boosters en 6 intentions

Le détail opérationnel est dans [docs/ux-boosters.md](../../../../docs/ux-boosters.md) :
quand oui ou non, exemple, alternative, mise en œuvre. Ici, la solidité de chaque
famille de preuves :
- **R** : recherche publiée ;
- **G** : guide de plateforme ou norme ;
- **A** : observation d'une app réelle.

| Intention | Boosters | Ce qui les fonde |
|---|---|---|
| **Lire** | L1 piste au style · L2 exception seule marquée · L3 mini-profil · L4 jauge à bande · L5 chiffre qui roule et delta · L6 compteur-déclencheur | **R** : position sur échelle commune, bullet graph, sparkline (B § 3, 6). **G** : `<meter>`, `<output>`. **A** : Météo, Signes vitaux, YNAB, Whoop, Function Health (B § 4) ; Robinhood, dont les cours flashent vert ou rouge ([Bloomberg, 2021](https://www.bloomberg.com/features/2021-robinhood-stock-trading-design)) |
| **Comparer** | C1 bascule de lentille · C2 superposition avec bascule · C3 haltère avant → après · C4 petits multiples · C5 panier de comparaison · C6 focus et contexte · C7 carrousel à crans | **R** : transitions animées, cohérence entre vues, petits multiples (§ 3). **A** : OWID, ECharts, [Datawrapper Multiple Lines](https://www.datawrapper.de/blog/small-multiple-line-charts), [flèches et plages Datawrapper](https://www.datawrapper.de/blog/new-arrow-and-range-plots), [Sofascore](https://www.sofascore.com/news/sofascores-attribute-overview-the-ultimate-tool-for-player-analysis), [Apple Bourse](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios), [Apple comparer les iPhone](https://www.apple.com/iphone/compare/), [Apple Météo](https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/ios) |
| **Choisir** | H1 segmenté · H2 pastille qui tourne · H3 puces de suggestion · H4 filtres avec compteur · H5 verrou et relance · H6 toucher la donnée | **G** : [M3 Chips](https://m3.material.io/components/chips/guidelines) (suggestion = choix générés ; filtres = noms ; 20 caractères ; puces en groupe ; la progression reste un bouton) ; HIG segmented controls (B). **A** : [Apple Santé](https://support.apple.com/en-ca/guide/iphone/iphe3d379c32/ios), [Apple Musique, Répéter](https://support.apple.com/guide/iphone/shuffle-or-repeat-songs-iphe22408524/ios), [Google Maps](https://support.google.com/maps/answer/4610185), [Coolors](https://coolors.co) (cadenas et régénération ; description par des sources tierces **[sec.]**) |
| **Ajuster** | J1 glisser une cible · J2 curseur à crans · J3 stepper · J4 nombre à glisser · J5 édition sur place · J6 aperçu fantôme · J7 curseur sur distribution | **G** : [NN/g, sliders, 13.09.2015](https://www.nngroup.com/articles/gui-slider-controls/) (curseur seulement quand la valeur exacte importe peu, valeur affichée au-dessus du doigt, saisie si la précision compte) ; [MDN range](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range) (`step`, crans par `datalist`) ; [HIG haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics). **A** : [thermostat Nest](https://support.google.com/googlehome/answer/10178773), [Appareil photo iPhone](https://support.apple.com/guide/iphone/camera-basics-iph263472f78/ios), [Figma](https://help.figma.com/hc/en-us/articles/360039956914-Adjust-alignment-rotation-position-and-dimensions), [Lightroom](https://www.adobe.com/learn/lightroom-cc/web/compare-photo-edits-lightroom-mobile), [Google Photos](https://support.google.com/photos/answer/6128850), Airbnb ([description](https://babich.biz/blog/slider-concepts/) **[sec.]**) |
| **Explorer** | X1 dépliage en place · X2 feuille à crans · X3 appui long pour prévisualiser · X4 scrubbing · X5 valeur exacte au toucher · X6 la réponse puis le pourquoi | **G** : [HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts) (« don't require interaction to reveal critical information » ; zone de toucher étendue à tout le tracé ; parcours clavier le long de l'axe) ; [HIG Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus) ; feuilles et accordéons (B § 6.2). **A** : Apple Bourse, [Robinhood](https://robinhood.com/us/en/support/articles/using-advanced-charts) (appui long pour démarrer le scrubbing), [Oura](https://support.ouraring.com/hc/en-us/articles/360057791533-Readiness-Contributors) |
| **Agir et annuler** | A1 balayer pour marquer · A2 annuler en un geste · A3 glisser pour placer · A4 ranger par glisser · A5 état vide qui propose l'action | **G** : [M3 Snackbar](https://m3.material.io/components/snackbar/guidelines) (une action « Annuler » ; pas d'auto-fermeture sur le web sans retour en ligne) ; [NN/g, confirmations, 18.02.2018](https://www.nngroup.com/articles/confirmation-dialog/) (offrir l'annulation, réserver la confirmation à l'irréversible, sinon l'habitude la vide de sens) ; [NN/g, états vides, 19.09.2021](https://www.nngroup.com/articles/empty-state-interface-design/) (donner un chemin direct vers la tâche). **A** : [Apple Mail](https://support.apple.com/guide/iphone/flag-or-block-emails-iph3caefa61/ios), [Things 3](https://www.culturedcode.com/things/support/articles/2803582), Apple Bourse (rangement) |

**Deux constats sur le dépôt.**
- **Ce qui existe déjà** : `CycleTag`, `SegmentedControl`, `PresetChips`, `SliderField`,
  `RatioSlider`, `QuantityStepper`, `SwipeRow` (avec Motion), `LevelGauge`, `WaterRadar`,
  `HopRangePlot` et l'annulation en ligne du journal de brassage.
- **Ce qui manque** :
  - aucune animation de rotation dans `CycleTag`, pourtant demandée « mot pour mot »
    dans son propre commentaire (seul un `active:scale` existe) ;
  - aucune sparkline réutilisable, aucun aperçu fantôme ;
  - le toast d'`App.tsx` n'a pas d'action et disparaît en 4 s.

## 3. Bascule de lentille : comment font les meilleurs

### 3.1 Les outils

- **ECharts 5.2, `universalTransition`** ([notes de version](https://echarts.apache.org/handbook/en/basics/release-note/5-2-0)).
  Il morphe entre types de séries, par exemple barres ↔ secteurs. Le même `id` de série et
  une clé de correspondance (`seriesKey`) font que chaque donnée reste le même objet
  pendant le passage.
- **Flourish** ([centre d'aide](https://helpcenter.flourish.studio/hc/en-us/articles/8761559565455-Different-ways-to-create-animated-visualizations)).
  Le modèle Line Bar Pie anime le changement de type. L'option « n'animer que les séries
  de même nom » rend explicite la règle de correspondance par clé. Entre deux visuels de
  types différents, Flourish n'anime pas.
- **Our World in Data** ([refonte](https://ourworldindata.org/redesigning-our-interactive-data-visualizations),
  [vue tableau, 2020](https://ourworldindata.org/whats-new-june-july-2020)). Chart, Map
  et Table sont des onglets du même objet. Pays et période vivent dans l'URL
  (`?tab=…&country=…`) : l'état survit au changement de lentille. Aucune source ne
  confirme explicitement la conservation ; elle se déduit de l'URL **[sec.]**.
- **Apple Bourse** ([aide](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios)).
  Changer de période garde le même graphique ; la forme se recompose sur place.
- **FlowingData** ([tutoriel](https://flowingdata.com/?p=28232)). Il bascule entre
  graphiques D3 avec un bouton : la même jointure de données à clé est déplacée d'une
  disposition à l'autre.
- **Recharts 3.10, installé.** Il ne morphe pas entre `BarChart` et `RadarChart`, qui sont
  deux arbres distincts : le morphing demande un composant SVG maison.

### 3.2 Ce que dit la recherche

1. **Les transitions animées bien faites aident.** Heer et Robertson
   ([InfoVis 2007](https://idl.uw.edu/papers/animated-transitions)) montrent que des
   transitions bien conçues améliorent la perception graphique.
   - Leurs principes : garder la **constance d'objet** (chaque donnée reste le même
     objet) et garder des états intermédiaires valides.
   - Ils **découpent en étapes** une transition complexe : dans leur exemple, les points
     prennent d'abord leur position, puis deviennent des barres.
2. **Pas d'échelonnement.** Décaler les départs n'aide pas à suivre les objets, et peut
   nuire : on perd les indices de trajectoires communes
   ([Chevalier, Dragicevic et Franconeri, TVCG 2014](https://visualcognition.psych.northwestern.edu/publications/ChevalierDragicevicFranconeri2014.pdf)).
   Tout bouge ensemble.
3. **L'animation oriente, elle ne compare pas.**
   - Pour analyser, les vues statiques sont plus rapides que l'animation, et les petits
     multiples plus exacts ([Robertson et al., InfoVis 2008](https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf)).
   - Sur téléphone, avec 96 participants, les petits multiples sont plus rapides dans 7
     tâches sur 9 ([Brehmer et al., 2019](https://arxiv.org/abs/1907.03919)).
   - Le morphing sert donc à ne pas perdre le fil ; la comparaison se fait sur la vue
     arrivée, immobile.
4. **La cohérence entre vues est une contrainte, pas un style**
   ([Qu et Hullman, TVCG 2018](https://idl.uw.edu/papers/consistency)) :
   - un même champ garde la même échelle d'une vue à l'autre ;
   - un même champ nominal garde les mêmes couleurs ;
   - des champs différents ne partagent pas une teinte.
5. **Signaler le changement autrement que par le mouvement.** Apple
   ([HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts)) :
   « Animating such changes can help people notice them », à condition de le signaler
   aussi à VoiceOver et à qui coupe les animations.
6. **Ne rien enfermer dans une vue cachée.** Datawrapper refuse les onglets de graphique
   parce que de larges parts du public ne trouvent pas ce qui est derrière un clic
   ([Academy, mis à jour le 07.01.2025](https://www.datawrapper.de/academy/alternatives-for-drop-down-menus-and-tabs) ;
   aucune donnée citée). Une lentille est une autre forme de la même information, jamais
   un dépôt d'information exclusive.

### 3.3 Quand un radar est acceptable

B classe le radar dernier en exactitude :
- la barre linéaire est la plus exacte et la préférée de non-experts (Waldner et al.,
  TVCG 2019) ;
- l'aire et la forme du radar dépendent de l'ordre arbitraire des axes ;
- mais le radar est le langage des fiches de houblon, avec 6 à 12 axes de 0 à 5
  ([BeerSmith](https://beersmith.com/blog/?p=14787)).

Les guides praticiens convergent :
- [Highcharts](https://www.highcharts.com/blog/tutorials/radar-chart-explained-when-they-work-when-they-fail-and-how-to-use-them-right/)
  conseille 4 à 8 variables et 2 à 3 groupes, une échelle normalisée commune et les
  variables liées côte à côte ; les petits multiples de radars valent mieux qu'une pile
  de polygones ;
- [Flourish](https://flourish.studio/2020/10/21/create-online-radar-spider-charts/)
  va dans le même sens ;
- une étude de 2019 sur l'ordre des axes trouve qu'un ordre qui fait ressortir les formes
  saillantes aide la lecture ([arXiv 1908.00576](https://arxiv.org/abs/1908.00576)).

**Règle retenue.** Le radar est acceptable pour la question « à quoi ressemble ce
profil ? », aux conditions suivantes :
- **2 profils superposés au plus** ;
- 12 axes au plus, dans un ordre fixe où les familles voisines restent voisines ;
- échelle commune relative au style, bande du style dessinée ;
- valeurs exactes à un toucher.

Il est refusé pour juger un petit écart (→ barres), pour plus de 2 profils (→ petits
multiples) et comme vue par défaut (→ barres).

### 3.4 Spécification pour L'Affinée

Elle est reprise dans le catalogue, section « Bascule de lentille » :
1. **Mêmes données, même sélection, même bande du style, même échelle**, dans les deux
   lentilles. Barres par défaut ; le choix est mémorisé localement.
2. **Ordre fixe** : de haut en bas en barres, dans le sens horaire depuis midi en radar.
3. **Couleurs d'identité stables** par voie ; la référence est en pointillé, pas
   seulement d'une autre teinte.
4. **Morphing par clé**. Chaque famille est interpolée par un paramètre `t` entre sa
   rangée et son sommet, en 250 à 300 ms, tout ensemble.
   - Si nécessaire, deux étapes : les axes, puis les marques.
   - La sélection reste allumée.
5. **Mouvement réduit** : fondu de 150 ms au plus ou bascule instantanée.
6. **`SegmentedControl` de 2 segments** ; la même description accessible dans les deux
   lentilles.

### 3.5 Mise en œuvre

Versions lues dans `node_modules` le 18.10.2026 : React 19.2.8, motion 13.2.0,
recharts 3.10.1, tailwindcss 3.4.19.

- **Option retenue** : un composant SVG maison.
  - Les positions sont calculées selon `t` (cartésien ↔ polaire) et animées par `animate`
    de `motion`.
  - `MotionConfig reducedMotion="user"` à la racine : par défaut, Motion vaut `"never"`
    et ignore la préférence ([doc Motion](https://motion.dev/docs/react-motion-config)).
  - Avec `"user"`, les animations de transformation et de mise en page sont coupées ;
    l'opacité continue.
- **`<ViewTransition>`** : stable depuis React 19.3
  ([react.dev, 09.09.2026](https://react.dev/blog/2026/09/09/react-19-3)).
  - Il ne se déclenche que dans `startTransition`, `useDeferredValue` ou un Suspense.
  - L'API navigateur est Baseline : Chrome 111, Safari 18, Firefox 144
    ([Chrome](https://developer.chrome.com/docs/web-platform/view-transitions),
    [web.dev, 10.2025](https://web.dev/blog/web-platform-10-2025)).
  - Elle procède par captures : bonne pour un fondu ou un déplacement de blocs HTML, non
    prouvée pour morpher les formes internes d'un SVG. Elle demande une montée de React.
- **`layout` et `layoutId` de Motion** : pour Liste ↔ Carte, qui sont des blocs HTML.
  Pas pour la géométrie SVG.

## 4. Application à l'écran houblons

La table complète « ici : … » (28 boosters) est dans le catalogue. Les choix tiennent
compte du budget du lot 2 : 7 éléments au plan 1, 80 mots, remplissage d'au moins 0,80
(PRIORITE.md). Un booster remplace du texte ; il ne s'y ajoute pas.

**Les dix mis en avant, et pourquoi :**

1. **L1 Piste au style.** La question de l'écran est « où est ma bière face au style ? ».
   La position sur une échelle commune est le codage le plus exact (B § 3.1). C'est aussi
   le support de J1, C3 et J6.
2. **C1 Barres ↔ Radar en morphing.** C'est l'exigence R45, et le radar est le langage des
   fiches de houblon. La constance d'objet empêche de se perdre au changement (§ 3.2).
3. **H3 Puces « + floral » / « − résineux ».** C'est le récit 2 en un toucher, avec des
   puces générées par l'écart au style (rôle exact de la puce de suggestion M3).
4. **J1 et J2 Glisser la cible, à crans.** C'est le « slider » réclamé (C092), mais posé
   sur la piste du style plutôt qu'ajouté à côté. Toucher la piste et − / + donnent
   l'alternative de WCAG 2.5.7.
5. **J6 et C3 Fantôme de voie.** Toucher une voie montre son effet sur toutes les pistes
   avant de la poser : c'est l'appui long de Lightroom et Google Photos, converti en
   bascule visible.
6. **H2 et L5 Pastilles qui tournent, IBU qui roule.** C'est le « principe PARTOUT » du
   brasseur, appliqué au moment et à la dose. La conséquence (IBU, intensité) se voit dans
   le même geste.
7. **L6 et L2 Compteurs-déclencheurs, exception seule marquée.** La réponse tient en
   comptes touchables, et seul l'écart parle (Signes vitaux, ISA-101 ; B § 4 et 5).
8. **C5 puis C4 Panier, puis petits multiples.** Le récit 3 (« on peut ensuite comparé ») :
   la mémoire de travail tient environ 4 éléments (B § 2). La comparaison se fait en
   statique, pas en animation (§ 3.2).
9. **L3 Mini-profils** dans les lignes de houblon et de voie : la densité vient du dessin
   et non des mots (Tufte, B § 6.1).
10. **H5 Verrou garder / exclure, puis relance.** C'est « confronté mes idées […] avoir le
    choix » (C062). Le solveur gère déjà préférences et exclusions
    ([hop-solver.md](../../../../docs/hop-solver.md), « Contraintes ») ; le branchement
    sur le moteur v4 reste à vérifier.

**Ailleurs dans l'app**, six transverses, détaillés dans le catalogue :
- **Recettes** : pistes au style pour OG, FG, IBU, EBC et ABV, avec chiffres qui roulent.
- **Stock** : fantôme de la consommation planifiée sur la jauge, puis annulation.
- **Brassage** : frise avec scrubbing ; annuler un relevé.
- **Eau** : radar ionique ↔ barres de plage, crans du style sur SO₄/Cl, avant / après.
  L'exigence de visibilité simultanée à 390 × 844 (ui-compacte) reste prioritaire.
- **Levure** : petits multiples, panier, plage glissée sur la bande de la souche.
- **Fermentation** : borne de palier glissée sur la frise, avec − / +.

## 5. Pièges

| Piège | Ce qu'en disent les sources | Parade |
|---|---|---|
| **Gadget** | « Useful junk » seulement s'il porte la donnée (Bateman 2010) ; « un radar décoratif » proscrit (ui-compacte) ; le nombre de widgets n'est pas un critère | Test d'admission en 4 questions ; retirer ce qui ne change ni lecture ni geste |
| **Geste caché** | NN/g ([balayage contextuel, 12.02.2017](https://www.nngroup.com/articles/contextual-swipe/)) : sans signifiant, l'action reste cachée ; un seul sens par geste ; annulation saillante. HIG ([Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), 09.09.2024) : un geste personnalisé n'est jamais le seul chemin, ni un geste familier détourné | Indice visible (chevron, poignée, bord) et équivalent visible ; appui long et balayage seulement comme raccourcis |
| **Surcharge d'animation** | NN/g ([durées, 09.02.2020](https://www.nngroup.com/articles/animation-duration/)) : environ 100 ms pour un retour, 200–300 ms pour un changement de vue, lent dès 400 ms ; plus c'est fréquent, plus c'est court ; retrait si « réduire les animations ». WCAG [2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) (AAA) : le mouvement déclenché doit pouvoir être coupé ; [2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) pour le mouvement automatique | Une seule chose bouge par action ; aucune boucle au repos ; `reducedMotion="user"` |
| **Conflit avec le défilement** | Le scrubbing de Robinhood démarre sur un appui long ; Apple étend la zone de scrubbing à tout le tracé (HIG Charts) | `touch-action: pan-y` sur les rangées ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)) ; `none` seulement sur une poignée ; `overscroll-behavior` sur carrousels et feuilles ; aucun geste depuis le bord de l'écran |
| **Information enfermée** | Datawrapper (§ 3.2) ; HIG Charts ; [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) pour le contenu au survol | La donnée décisive reste au plan 1 dans toutes les lentilles |
| **Retour promis, absent** | Safari iOS n'a pas l'API Vibration ; l'astuce `switch` (iOS 18) serait cassée en iOS 26.5, selon une source unique ([azukiazusa, 2026](https://azukiazusa.dev/en/blog/ios-safari-web-haptics) **[sec.]** ; [Ionic #29942](https://github.com/ionic-team/ionic-framework/issues/29942)). HIG : haptique complémentaire, cohérente, désactivable | Le retour visuel suffit seul ; `vibrate` en amélioration progressive sur Android |
| **Annulation inaccessible** | M3 : pas de snackbar auto-fermée sur le web sans retour en ligne ; [WCAG 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) pour les messages d'état | « Annuler » tient jusqu'à l'action suivante, en `role="status"`, jamais posé sur des éléments focusables |

**Accessibilité transverse** :
- [2.5.7 Mouvements de glissement](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) (AA) :
  « All functionality that uses a dragging movement for operation can be achieved by a
  single pointer without dragging ». Les exemples du W3C sont nos parades : toucher la
  piste, ↑ / ↓ dans une liste triable, boutons sur une carte.
- [2.5.1 Gestes](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html) ;
- [2.5.2 Annulation du pointeur](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html) :
  activer au relâchement ;
- [1.4.1 Couleur](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

## 6. Limites

- **Aucun essai utilisateur.** Ce rapport classe des options ; l'essai des maquettes et le
  coup d'œil du brasseur tranchent (ui-compacte, E3).
- **Exemples d'apps vérifiés sur pages d'aide officielles**, sauf ceux marqués **[sec.]** :
  - Airbnb (histogramme), Coolors (cadenas), OWID (conservation de l'état) ;
  - la limite de 3 modèles d'Apple Comparer, non confirmée ;
  - le comportement exact de Spotify (écarté au profit d'Apple Musique).
- **Morphing SVG par `<ViewTransition>`** : non éprouvé. Il demande un prototype avant
  d'être retenu.
- **Solveur v4** : la relance avec verrou (H5) suppose qu'il accepte préférences et
  exclusions ; c'est documenté pour le solveur actuel, pas vérifié pour le moteur v4.
- **Écart relevé, hors périmètre** : `src/ui/Sheet.tsx` importe `vaul`, alors que
  PRODUCT.md (« Pile ») le déclare refusé.
