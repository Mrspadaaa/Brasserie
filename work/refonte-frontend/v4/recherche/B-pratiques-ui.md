# B — Pratiques UI actuelles pour l'écran « houblons lus au style »

Recherche du 18.10.2026 (chercheur design, Opus). Sources web consultées le 18.10.2026.
Les pages Apple HIG ont été lues dans leurs données publiques (`developer.apple.com/tutorials/data/design/human-interface-guidelines/*.json`).
Les pages m3.material.io ne s'affichent pas sans JavaScript : leurs valeurs viennent de la
documentation Material Components ou de sources secondaires, marquées **[sec.]**.
Sur iPhone, 1 px CSS correspond à 1 pt ; sur Android, à environ 1 dp.

---

## 1. Normes des plateformes (2024–2026)

| Rôle | Apple iOS (taille par défaut « Large ») | Material 3 | DESIGN.md actuel |
|---|---|---|---|
| Lecture courante | Body 17 pt, Callout 16, Subhead 15 | bodyLarge 16 sp, bodyMedium 14 sp | body 14 px |
| Données, notes | Footnote 13 pt | bodySmall 12 sp | 13–14 px |
| Légende | Caption 1 : 12 pt, Caption 2 : 11 pt ; **minimum iOS 11 pt** | labelMedium 12 sp, labelSmall 11 sp | label 12 px (13) |
| Cible tactile | **par défaut 44×44 pt, minimum 28×28 pt** ; environ 12 pt de marge autour d'un élément avec fond | 48×48 dp, au moins 8 dp entre deux cibles | 24 / 28 / 32 px |
| Contraste | au moins 4,5:1 ; viser 7:1 pour les couleurs personnalisées, surtout en petit texte | WCAG AA ; en sombre, couleurs primaires désaturées | — |

Sources : [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography),
[HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility),
[HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) (lus le 18.10.2026) ;
[échelle typographique M3, Material Components Android](https://github.com/material-components/material-components-android/blob/master/docs/theming/Typography.md) ;
[Google, taille des cibles tactiles](https://support.google.com/accessibility/android/answer/7101858) ;
[M2 Dark theme](https://m2.material.io/design/color/dark-theme) ;
[WCAG 2.2, 2.5.8 Target Size (Minimum), 24×24 px CSS](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

**Ce que disent les guides, motif par motif :**

- **Hiérarchie.** Apple : la graisse, la taille et la couleur servent à faire ressortir
  l'important. Il conseille peu de polices et d'éviter les graisses Light, Thin et Ultralight
  en petit corps. Dans un graphique, la donnée domine ; les axes et les descriptions restent
  en retrait ([HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts)).
- **Divulgation progressive.** Apple
  ([Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data)) :
  garder le graphique simple, laisser choisir quand voir le détail, ne pas tout y entasser.
  Un court titre-résumé au-dessus du graphique fait saisir l'essentiel d'un coup d'œil ;
  l'exemple est Météo, qui annonce en tête la pluie de l'heure à venir.
  [Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls) :
  le plus utilisé reste visible en haut, l'avancé est caché par défaut, avec au plus un
  bouton de divulgation par vue.
- **Feuilles.** Apple ([Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets),
  mise à jour du 24.03.2026) :
  - la détente moyenne (environ la moitié de la hauteur) est recommandée sur iPhone pour
    la divulgation progressive ;
  - une seule feuille à la fois, une poignée si elle est redimensionnable, le balayage
    vers le bas pour fermer ;
  - une feuille non modale convient au contenu complémentaire qui agit sur la vue parente.

  Material distingue la feuille *standard*, qui coexiste avec le contenu, de la feuille
  *modale*, qui le bloque ([material.io](https://material.io/components/sheets-bottom)).
- **Cartes et listes.** NN/g ([Laubheimer, 06.11.2016](https://www.nngroup.com/articles/cards-component/)) :
  la carte convient à un contenu hétérogène qu'on parcourt. Pour des éléments homogènes à
  balayer ou à comparer, la liste est meilleure ; les cartes prennent plus de place et
  chargent la mémoire.
- **Contrôle segmenté.** Apple
  ([Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)) :
  - environ 5 segments au plus sur iPhone ;
  - du texte ou des icônes, sans mélanger les deux ;
  - des largeurs égales ;
  - il bascule entre des vues proches ; des sections séparées vont dans une barre d'onglets.

  Côté M3, les sources secondaires donnent 2 à 5 options
  ([Flutter SegmentedButton](https://api.flutter.dev/flutter/material/SegmentedButton-class.html)) **[sec.]**.
- **Puces.** M3 en a quatre types : assistance, filtre, saisie et suggestion. Les puces
  de suggestion proposent des choix générés dynamiquement, et les puces apparaissent en
  groupe ([material-web](https://material-web.dev/components/chip/)) **[sec.]**.
- **Un seul appel à l'action.** Apple
  ([Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), mise à jour Liquid Glass du 16.12.2025) :
  - 1 ou 2 boutons proéminents par vue au plus ;
  - au-delà, la charge cognitive augmente ;
  - on distingue le choix préféré par le style, pas par la taille.

  M3 Expressive ([Google Design, I/O 2025](https://design.google/library/expressive-material-design-google-research)) :
  46 études et plus de 18 000 participants. L'action clé y est repérée jusqu'à 4 fois plus
  vite grâce à la taille, la couleur, la forme et le contenant, et l'écart dû à l'âge
  disparaît. Les auteurs en donnent aussi les limites : casser un motif familier nuit, et
  une minorité préfère des écrans calmes.
- **Densité (Material, page bêta).** La haute densité aide quand on consulte beaucoup
  d'informations (listes, tableaux) ; les tâches et les alertes ne doivent pas être
  densifiées ([Applying density](https://material.io/design/layout/applying-density.html)).
- **Mode sombre.** Apple :
  - fonds *base*, qui reculent, et *élevés*, qui avancent ;
  - les couleurs sombres ne sont pas de simples inversions ;
  - le contraste se vérifie dans les deux apparences.

  Material : plus une surface est élevée, plus elle est claire ; les couleurs vives sont
  désaturées.
- **Liquid Glass (iOS 26).** C'est une couche fonctionnelle flottante pour les commandes
  et la navigation, au-dessus du contenu. Apple l'exclut de la couche de contenu et en
  demande un usage parcimonieux
  ([HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)).
  Pour une PWA, on retient le principe (les commandes flottent, le contenu domine),
  pas l'effet de verre.

## 2. Charge cognitive et lecture au coup d'œil

**Données chiffrées :**

- **Peu de lecture.** Les internautes lisent au plus 28 % des mots d'une page, plus
  probablement 20 %. Chaque tranche de 100 mots ajoutée ne coûte que 4,4 s, donc environ
  18 % de ce texte est lu. On ne lit la moitié de l'information que sur les pages de
  111 mots ou moins ([Nielsen, 05.05.2008](https://www.nngroup.com/articles/how-little-do-users-read/), 45 237 pages vues).
- **Mobile.** En 2011, la compréhension tombait de 39 % à 19 % sur petit écran. En 2016,
  elle est équivalente pour un texte simple, mais un texte difficile ralentit sur mobile ;
  NN/g maintient la consigne de brièveté
  ([Moran, 11.12.2016](https://www.nngroup.com/articles/mobile-content/)).
- **Balayage.** Le motif en F est un mode d'échec plutôt qu'un modèle de mise en page
  ([Pernice, 2017](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)).
  Les lecteurs sautent vers ce qui se distingue : chiffres, mots en gras, styles différents
  (motif « tacheté »), ou vers les titres (« mille-feuille »).
  → L'information utile doit vivre dans des éléments repérables, pas dans des phrases.
- **Impression avant la lecture.** La complexité visuelle influe sur l'attrait dès 17 à
  50 ms. Les sites peu complexes et conformes aux habitudes sont jugés les plus attrayants
  ([Tuch et al., Google, 2012](https://research.google/pubs/pub38315/)).
  → L'effet « cockpit » se décide avant que le brasseur lise un mot.
- **Mémoire de travail.** Environ 4 unités, contre le « 7 ± 2 » de Miller
  ([Cowan, 2001](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/44023F1147D4A1D44BDC0AD226838496/S0140525X01003922a.pdf/magical_number_4_in_shortterm_memory_a_reconsideration_of_mental_storage_capacity.pdf)).
  → Comparer 2 à 4 voies reste possible de tête ; au-delà, il faut que l'écran garde la
  comparaison.
- **Coup d'œil.** Plus de 70 % des sessions sur un traqueur d'activité sont des coups d'œil
  d'environ 5 s ([Gouveia et al., 2015](https://digital.lib.washington.edu/researchworks/handle/1773/51003)).
  Sur une montre, une comparaison prend moins de 300 ms avec des barres et moins de 220 ms
  avec un anneau, mais jusqu'à 1 780 ms avec des barres radiales
  ([Blascheck et al., IEEE TVCG 2019](https://www.microsoft.com/en-us/research/uploads/prod/2018/08/GlanceableVis-InfoVis2018.pdf)).
- **Test des 5 secondes.** On montre l'écran 5 s, puis on demande ce qui reste
  (Perfetti, milieu des années 2000). La durée de 5 s repose surtout sur l'expérience
  des praticiens ([Smashing, 12.2023](https://smashingmagazine.com/2023/12/five-second-testing-case-study)).
  Il mesure la compréhension première, pas l'utilisabilité.
- **Divulgation progressive.** Elle améliore l'apprentissage, l'efficacité et le taux
  d'erreur, à trois conditions ([Nielsen, 03.12.2006](https://www.nngroup.com/articles/progressive-disclosure/)) :
  un bon partage entre premier et second plan, un passage évident de l'un à l'autre, et
  **pas plus de 2 niveaux**.

**Budget de texte (déduit, pas une norme).** Le premier écran actuel affiche 166 à 383 mots.
Au seuil de 111 mots, le brasseur n'en lirait qu'environ la moitié. Viser **≤ 60 mots
visibles hors chiffres** est faisable : 12 noms de famille, moins de 10 mots de
verdict, environ 8 mots d'en-tête, 5 noms de houblons et 2 libellés de lentille.

## 3. Représentations de données adaptées

### 3.1 Une valeur face à une plage de référence

- **Bullet graph** ([Few, spécification 2013](http://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf)).
  Il compte cinq parties :
  - un libellé ;
  - une échelle linéaire ;
  - la mesure vedette ;
  - 1 ou 2 repères de comparaison ;
  - 2 à 5 bandes qualitatives en fond, dans des teintes discrètes d'une même couleur.

  Few l'a conçu pour remplacer les jauges : plus d'information dans moins de place.
  C'est la grammaire naturelle de notre piste : la bande du style est la plage
  qualitative, la cible est le repère et la plage prédite est la mesure vedette.
- **Position sur une échelle commune.** C'est le codage le plus précis, devant la
  longueur, l'angle, l'aire et la couleur
  ([Cleveland & McGill, JASA 1984](https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html)).
  → Les **jauges circulaires et les radars** (angle, aire) sont moins exacts que des points
  ou des barres alignés.
- **Range plot / haltère (dumbbell).** Deux points reliés montrent un avant/après ou un
  écart ; c'est l'outil naturel pour « ce que la voie change ».

### 3.2 Montrer l'incertitude à un non-statisticien

Synthèse de [Padilla, Kay & Hullman, *Handbook of Computational Statistics*, 2020–2022](https://moodle2.units.it/pluginfile.php/466375/mod_resource/content/0/Uncertainty_Visualization_Padilla_Kay_Hullman_2020.pdf) :

- **Un intervalle seul se lit comme une catégorie.** Les bornes nettes font croire que
  l'intérieur et l'extérieur diffèrent par nature ; c'est le biais « dans la barre » de
  Newman et Scholl.
- **Erreur de lecture déterministe.** Avec des barres d'erreur, des lecteurs prennent
  l'intervalle à 95 % pour les températures minimale et maximale. L'erreur persiste
  même avec une légende explicite (Joslyn & LeClerc).
- **Si un intervalle est nécessaire,** les auteurs recommandent d'y joindre une forme
  plus représentative : gradient, violon, nuage de points, ensemble, quantile dotplot
  ou HOP.
- **Cadrage en fréquence.** « 7 fois sur 10 » se comprend mieux que « 70 % » (Gigerenzer).

**Résultats d'études :**

- **Gradient ou violon plutôt que barres d'erreur** pour l'inférence
  ([Correll & Gleicher, IEEE TVCG, 12.2014](https://graphics.cs.wisc.edu/Papers/2014/CG14/Error%20Bars%20Considered%20Harmful%20Exploring%20Alternate%20Encodings%20for%20Mean%20and%20Error.pdf)).
- **Quantile dotplot.** Conçu pour petit écran, chaque point y vaut une tranche de
  probabilité, et on répond en comptant. La variance des estimations baisse d'environ
  1,15 fois par rapport à une densité
  ([Kay et al., CHI 2016](https://idl.uw.edu/papers/when-ish-is-my-bus)).
- **Décisions.** Avec un quantile dotplot de 50 points, les décisions atteignent environ
  97 % du gain optimal, 5 points au-dessus du témoin. La fonction cumulative fait presque
  aussi bien ; le texte fait moins bien
  ([Fernandes et al., CHI 2018](https://mucollective.northwestern.edu/project/uncertainty-bus)).
- **HOPs (tirages animés).** Ils surpassent barres d'erreur et violons pour juger l'ordre
  de 2 ou 3 quantités, mais pas pour une seule
  ([Hullman et al., PLOS ONE, 16.11.2015](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4646698/)).
  Ils demandent du temps et de l'attention : ils ont leur place dans le détail, pas au
  premier plan.

### 3.3 Comparer 2 à 4 profils

- **Petits multiples.** Même échelle et mêmes axes, pour comparer d'un coup d'œil
  ([Tufte, *Envisioning Information*, 1990](https://en.wikipedia.org/wiki/Small_multiple)).
  La question de fond est « comparé à quoi ? ».
- **Points groupés par famille.** Les 2 à 4 options sont des points ou des formes sur la
  même piste que la bande du style ; on compare par position. C'est plus lisible que des
  barres groupées, qui répètent des longueurs et des fonds.
- **Critiques du radar.**
  - Few le range parmi les graphiques à abandonner
    ([résumé, Visualising Data, 2010](https://visualisingdata.com/2010/05/radard-to-death/)).
  - Les axes ont des échelles indépendantes, et la forme et l'aire dépendent de l'ordre
    arbitraire des axes ([Scott Logic, 2011](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts)).
  - Le radar s'est montré le moins efficace et le moins apprécié face à d'autres vues
    radiales en petits multiples
    ([IBM Research](https://research.ibm.com/publications/off-the-radar-comparative-evaluation-of-radial-visualization-solutions-for-composite-indicators)).
  - La barre linéaire est la plus exacte et la préférée de 92 non-experts
    ([Waldner et al., TVCG 2019](https://www.cg.tuwien.ac.at/research/publications/2019/waldner-2019-rld/)).
- **Contexte métier.** Les fiches des fournisseurs de houblon utilisent des radars de 6 à
  12 axes notés de 0 à 5 par un panel sensoriel
  ([BeerSmith](https://beersmith.com/blog/?p=14787)). Le radar est donc attendu dans le
  domaine, et la bascule Barres / Radar est une exigence acquise : la garder, avec les
  barres par défaut.

## 4. Apps grand public qui le font bien

| App | Motif | Pourquoi il marche | Incertitude et détail |
|---|---|---|---|
| **Apple Météo**, prévisions sur 10 jours ([iPhone Life](https://iphonelife.com/content/what-do-iphone-weather-symbols-and-color-bars-mean), [MacRumors](https://www.macrumors.com/guide/ios-15-weather-app/amp)) | Une barre de plage par jour, placée dans la fourchette des 10 jours ; un point pour l'instant présent ; une phrase-résumé en tête de module | Toutes les lignes partagent une échelle : on compare les jours par position, sans lire de chiffre | Le détail horaire s'ouvre au toucher, dans des modules à une idée chacun |
| **Apple Signes vitaux** (watchOS 11 ; [Tom's Guide](https://www.tomsguide.com/wellness/smartwatches/watchos-11-public-beta-i-tried-the-new-apple-watch-vitals-health-app-heres-how-it-works-and-first-impressions), [Wareable](https://www.wareable.com/apple/how-vitals-app-finally-makes-apple-watch-a-wellness-powerhouse)) | Chaque mesure est « Habituelle » ou « Inhabituelle » face à **ta** plage ; 5 points sur le cadran, pleins ou évidés | On n'étiquette que l'exception ; l'alerte ne part que si au moins 2 mesures sortent | La base se construit en environ 7 nuits ; Apple précise que ce n'est pas un usage médical |
| **Apple Santé, Tendances** (iOS 15, [Newsroom, 07.06.2021](https://www.apple.com/newsroom/2021/06/apple-advances-personal-health-by-introducing-secure-sharing-and-new-insights/)) | Seuls les changements significatifs sont mis en avant, sur 20 types de données | Le tri est fait par l'app, pas par l'œil | Graphique complet au toucher. L'affichage des plages de référence des analyses n'a pas pu être vérifié sur une source Apple |
| **Oura** ([support](https://support.ouraring.com/hc/articles/360057791533), [Readiness](https://ouraring.com/blog/readiness-score/)) | Un score sur 100 et 7 contributeurs en barres ; paliers Optimal ≥ 85, Bon 70–84, Moyen 60–69, À surveiller < 60 | Une réponse, puis le pourquoi ; le rouge ne sert qu'au palier « à surveiller » | Les 100 sont rares par conception ; chaque contributeur s'ouvre en détail |
| **Whoop** ([The Locker](https://www.whoop.com/thelocker/how-does-whoop-recovery-work-101)) | Récupération en %, vert 67–99, jaune 34–66, rouge 1–33 | Lisible en 1 s | Whoop dit lui-même que les couleurs simplifient une échelle continue (66 et 67 ne diffèrent pas) |
| **YNAB** ([aide](https://support.ynab.com/en_us/colors-and-icons-in-your-plan-HJQv_XHko.md)) | La pastille « Disponible » change de couleur : rouge = agir, jaune = sous-financé, vert = couvert, gris = zéro | La couleur code l'**action requise**, pas la valeur | Une icône précise la cause |
| **Monzo** ([communauté](https://community.monzo.com/t/show-how-much-ive-spend-over-budget/145590)) | Barre « reste à dépenser » | Montant restant en clair | Les utilisateurs se divisent entre barre qui se vide et barre qui se remplit : le sens doit être évident |
| **Withings** ([blog](https://www.withings.com/us/en/blog/heart/why-is-health-mate-the-most-advanced-health-management-app)) | Résultats avec plages de normalité tirées des recommandations officielles et code couleur | La référence est nommée | Score global avec sous-scores (Withings+) |
| **Function Health** ([App Store](https://apps.apple.com/app/id6471280307), [revue](https://healnourishgrow.com/function-health-review/)) | Biomarqueurs « dans la plage » ou « hors plage », avec des compteurs par catégorie | Le tableau de bord se lit par compteurs | Un avis d'utilisateur relevé par la recherche, mais plus visible le 18.10, critique la barre : elle montre la plage du laboratoire et le texte la plage « optimale » **[sec.]**. **Deux références non distinguées induisent en erreur** |
| **Vivino** ([SF Chronicle](https://preview-prod.w.sfchronicle.com/food/wine/article/vivino-app-top-wines-17408037.php), [SommTV](https://mag.sommtv.com/2021/06/vivino-wine/)) | Curseurs bipolaires (léger↔corsé, souple↔tannique, sec↔doux, doux↔acide) avec un repère ; notes d'arôme tirées des avis | Pas de chiffre : une position entre deux mots du métier | Les 3 descripteurs les plus cités recoupent ceux d'un critique ; la méthode de calcul n'est pas publiée |
| **Untappd** ([exemple](https://untappd.com/user/WinterVball/checkin/1570611780)) | « Flavor profile » : 3 à 5 étiquettes (Malty, Citrus…) | Des puces plutôt que des phrases | Pas d'intensité |

## 5. Écran sombre dense sans effet « cockpit »

| Effet cockpit / industriel | Interface dense moderne |
|---|---|
| Tout a le même poids ; chaque valeur a son cadre | La donnée domine. La structure tient par la proximité et l'alignement ; Linear veut qu'elle se sente sans se voir ([Linear, 12.03.2026](https://linear.app/now/behind-the-latest-design-refresh)) |
| Couleurs saturées pour les états normaux | Base neutre, un accent, la couleur réservée à l'anormal. C'est le principe des IHM industrielles « haute performance » ISA-101 elles-mêmes ([livre blanc IPD 2023](https://resources.ipd.com.au/documents/white-papers/Best-practices-for-high-performance-HMI-design_White%20Paper_ENUS_2023.pdf), [ISA](https://blog.isa.org/the-high-performance-hmi)) |
| Libellé : valeur partout, en capitales | Peu de libellés ; le format et le contexte disent ce qu'est la donnée ([Refactoring UI](https://www.refactoringui.com/previews/labels-are-a-last-resort)) |
| Monospace pour tout | Sans proportionnelle avec chiffres tabulaires (`font-variant-numeric: tabular-nums`) dans les colonnes ([MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-numeric)). Linear utilise Inter et Inter Display ([Linear, 28.03.2024](https://linear.app/now/how-we-redesigned-the-linear-ui)) |
| Navigation et chrome au même niveau que le travail | Linear a atténué la barre latérale et réduit les icônes, leur taille et leurs fonds colorés ; il est passé à un gris plus chaud et moins saturé (2026) |
| Thème réglé à la main | Thèmes générés en LCH à partir de 3 entrées (base, accent, contraste) au lieu de 98 variables, avec un contraste du texte relevé (Linear 2024) |
| Jauges, cadrans, hachures, biseaux | Barres plates, points, sparklines ; la différence visuelle la plus petite qui reste nette (Tufte, *Visual Explanations*, 1997) |

**Robinhood et Apple Bourse** suivent la même recette : un grand nombre, une courbe simple
et une seule couleur sémantique (hausse ou baisse). Le reste est blanc ou noir
([critique Pratt, 02.2025](https://ixd.prattsi.org/2025/02/design-critique-robinhood-ios-app/)).
Le contre-exemple utile est celui de Linear : son gris le plus pâle aurait un contraste
d'environ 3,6:1, sous le seuil AA du texte selon un tiers non vérifié
([buildmvpfast](https://www.buildmvpfast.com/blog/linear-aesthetic-tokens-density-keyboard-first-ux-2026)).
L'atténuation a donc une limite.

## 6. Densité utile et second plan

Le brasseur demande : dense, avec un maximum d'informations au même endroit, sans
surcharge. Au premier plan, seulement l'utile ; le reste par renvois, replis et autres.

### 6.1 Densité d'information plutôt que densité visuelle

- **Plusieurs densités** ([Ström, *UI Density*, vers 2024](https://mattstromawn.com/writing/ui-density)) :
  - *visuelle* : le nombre de choses par surface, une impression peu fiable ;
  - *d'information* : le data-ink de Tufte, l'encre qui porte des données ;
  - *de conception* : la part des décisions vraiment nécessaires ;
  - *temporelle* : les actions utiles par unité de temps.

  La synthèse est la **densité de valeur** : la plus grande valeur dans le moins de
  temps, de place et d'encre. Google, visuellement vide, est très dense en valeur.
- **Data-ink et sparklines.** Chaque trait doit porter une donnée. Une sparkline est un
  graphique de la taille d'un mot, riche en données et sobre
  ([Tufte, 2004–2006](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/)).
  Un mini-profil de 12 cellules dans une ligne de houblon en est un exemple.
- **Coder visuellement plutôt qu'écrire.** La position la plus précise vient d'abord
  (§ 3.1), puis la longueur, puis la couleur. Un verdict écrit sur chaque rangée double
  l'information ; on peut le réserver aux exceptions (Signes vitaux, Oura, ISA-101).
- **Superposer et séparer** (Tufte, 1990) : le fond (bande du style) est sourd et la
  figure (ma bière, les voies) est vive, pour que 3 couches se lisent sans cadres.
- **Ne pas densifier l'alerte** (Material) ; ne jamais cacher une information nécessaire
  à la décision (PRODUCT.md, NN/g).

### 6.2 Motifs de second plan et leurs règles

| Motif | Usage juste | Règles | Source |
|---|---|---|---|
| **Feuille non modale, détente moyenne** | Détail d'une famille ou d'une voie, en gardant la feuille visible derrière | Une seule feuille ; poignée et bouton Fermer visibles ; Retour la ferme ; pas de parcours de pages dans une feuille ; contenu court | [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) ; [NN/g, Laubheimer, 11.06.2023](https://www.nngroup.com/articles/bottom-sheet/) |
| **Repli (accordéon)** | Sections indépendantes lues au choix (source BJCP, confiance, méthode) | Fermé par défaut ; en-tête collant si le contenu est long ; ne pas sauter en haut ; pas d'imbrication | [NN/g, Budiu, 31.05.2015](https://www.nngroup.com/articles/mobile-accordions/) |
| **Navigation en profondeur** | Fiche d'un houblon, contenu long ou durable | 2 niveaux au plus ; parfum d'information clair (« Saaz · 3 voies ») | [NN/g 2006](https://www.nngroup.com/articles/progressive-disclosure/), [information scent](https://www.nngroup.com/articles/information-scent/) |
| **Info-bulle ou popover au toucher** | Définition d'un terme (« bande du style », « ≈ ») | Jamais d'information essentielle ; pas de survol au toucher ; brève ; pas sur le contenu qu'elle décrit | [NN/g, Kendrick, 27.01.2019](https://www.nngroup.com/articles/tooltip-guidelines/) |
| **« Voir les N autres »** | Familles absentes du style, houblons du bas du classement | Annoncer le nombre ; un seul geste pour tout voir ; le texte reste accessible au lecteur d'écran | [SAP Fiori, texte extensible](https://www.sap.com/design-system/fiori-design-web/v1-136/ui-elements/expandable-text/usage) **[sec.]** |
| **Contrôle segmenté** | Lentilles Liste / Carte, Barres / Radar | 2 à 5 segments ; texte seul ; effet immédiat | HIG Segmented controls |
| **Puces de suggestion** | Directions (« + floral », « − résine ») | En groupe, générées selon l'écart au style | M3 Chips **[sec.]** |

## 7. Ce que cela implique pour notre écran

1. **Une question au premier plan :** « où est ma bière face au style ? ». La feuille
   montre 12 pistes en bullet graph adapté : bande du style en fond sourd, plage prédite,
   cible creuse. En tête, une phrase-résumé d'une ligne (« 2 familles hors style : résine
   haute, floral bas »). Viser ≤ 60 mots visibles hors chiffres, contre 166 à 383
   aujourd'hui.
2. **N'étiqueter que l'exception.** Le mot de verdict et la couleur d'alerte ne
   s'affichent que pour les familles hors bande ou au-delà du seuil ; les familles au
   style restent neutres. La couleur est toujours doublée d'une forme ou d'un mot.
3. **La bande du style est nette, la prédiction est floue.** La bande est une norme ; la
   plage prédite est une incertitude, dessinée en gradient d'intensité, sans bornes dures
   ni moustaches. Dans le détail : un quantile dotplot de 20 points et une phrase en
   fréquence (« environ 7 fois sur 10 entre … »). Afficher « ≈ » quand l'écart est
   inférieur à l'incertitude.
4. **Une échelle commune par famille, zoomée sur le style.** Ma bière et les voies sont
   des points ou des formes sur la même piste ; on compare par position, sans lire de
   chiffre. L'effet d'une voie est une haltère fantôme, de l'actuel au prévu.
5. **Comparaison de 2 à 4 voies, pas plus** (mémoire de travail d'environ 4). Points
   groupés ou petits multiples alignés, triés par écart au style. Garder la bascule
   Barres / Radar acquise, avec les barres par défaut ; le radar sert à la silhouette,
   avec 2 superpositions au plus et un ordre d'axes fixe.
6. **Direction en un geste et une seule action proéminente.** Puces de suggestion
   générées par l'écart (« + floral », « − résine »). La poignée ↑ / ↓ garde une
   alternative au toucher, comme l'exige WCAG 2.5.7. « Poser la voie » est le seul bouton
   plein, et il n'apparaît qu'une fois la voie choisie.
7. **Second plan à 2 niveaux au plus.** Toucher une famille ou une voie ouvre une feuille
   non modale à détente moyenne : chiffres, source BJCP, confiance, simulation. Pas de
   feuille empilée, un Fermer visible, et Retour qui ferme. Les replis restent fermés par
   défaut ; aucune information de décision n'est cachée dans une info-bulle.
8. **« Mes houblons » en liste, pas en cartes.** Chaque ligne porte le nom, un mini-profil
   de 12 cellules à l'échelle du style et le stock en chiffres tabulaires. Elle est triée
   du + au −, avec « voir les N autres » en repli. Liste / Carte se choisit dans un
   contrôle segmenté de 2 segments.
9. **Anti-cockpit.**
   - Couleurs : fond neutre, un accent, les 4 couleurs de comparaison réservées aux voies
     et une seule couleur d'alerte.
   - Structure : hiérarchie par graisse, opacité et proximité, sans cadres ; zones hors
     style en fond légèrement plus sombre plutôt qu'en hachures marquées.
   - Texte : 3 tailles au plus. Plex Mono limité aux colonnes de chiffres alignés ;
     libellés et verdicts en sans à chiffres tabulaires (le `tnum` de Source Sans 3 est à
     vérifier).
10. **Valider sur rendu, pas sur intention.**
    - Captures à 390 × 844 avec le nombre de mots compté.
    - Test des 5 secondes avec le brasseur : quelle famille pose problème, et dans quel sens ?
    - Contraste : au moins 4,5:1 pour tout texte, en visant 7:1 à 12 px, et au moins 3:1
      pour la bande du style, élément graphique porteur de sens (WCAG 1.4.11).
    - Cibles : zone effective de 28 à 32 px pour toute commande d'une rangée de 24 px.

## 8. Conflits avec la règle de densité forte (12–13 px)

- **Taille de texte : pas de conflit avec les minima, conflit pour la lecture.** 12 px
  correspond à Caption 1 chez Apple (minimum 11 pt) et à bodySmall / labelMedium chez
  Material. La lecture courante est à 17 pt chez Apple et à 14–16 sp chez Material. Le
  14 px de DESIGN.md est donc au bas de la fourchette Material. La phrase-résumé et les
  explications des feuilles ne doivent pas descendre à 12–13 px.
- **Contraste : risque réel.** Un gris « cave » atténué à 12 px descend vite sous 4,5:1
  (cf. Linear, environ 3,6:1 selon un tiers). Pour les petits textes de couleur
  personnalisée, Apple demande de viser 7:1.
- **Cibles : conflit réel pour des rangées de 24 px avec une poignée.**
  - 24 px est le minimum WCAG AA, sous le minimum Apple de 28 pt et la moitié des 48 dp
    de Material.
  - Correctif : la rangée entière est la cible du toucher (sélection et feuille). La
    poignée ou les flèches vivent dans la rangée active, agrandie à 28–32 px, ou dans la
    feuille.
- **Glisser :** WCAG 2.2 (2.5.7) exige une alternative sans glisser ; le ↑ / ↓ prévu y
  répond.
- **Agrandissement :** Apple demande de supporter au moins 200 %. À 12 px, les pistes
  doivent garder leur sens quand la rangée s'agrandit, avec le nom de famille qui passe
  à la ligne plutôt que tronqué.
- **Alertes :** Material exclut de densifier tâches et alertes. Les verdicts hors style
  peuvent prendre une rangée un peu plus haute ou plus contrastée que les rangées au style.
