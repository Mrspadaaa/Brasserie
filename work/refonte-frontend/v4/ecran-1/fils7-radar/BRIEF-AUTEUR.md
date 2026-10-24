# Lot 7 · Une vraie base pour les radars, en fils de fer (brief auteur, une page)

Fils de fer statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.

## Ce que le brasseur a dit (18.10, soir)

- Sur les radars de Suggestions : « Les spidergraph/radar graph resemble a rien, c'est une vrai
  régression... » ; sur celui de Ma bière : « Celui-ci est encore pire ??? ».
- « Comment c'est possible d'avoir autant de problèmes avec ces Spider graph. Fait moi des fils de
  fere avec de lib, third party, custom, ou autre afin de faire une vrai baseline ».

Pourquoi ça a raté (à ne pas refaire) : chaque lot a recodé son radar à la main ; la série
**sautait les familles non situées**, donc le tracé n'était plus un polygone fermé mais une
aiguille vers Résineux avec des segments vers le centre (capture : `ecran-1/base/captures/` ou
`fils5-suggestions/captures/planche-suggestions-radar-390.png`). Référence qui marche : le radar
superposé de Beer Maverick, `work/refonte-frontend/v3/reference/beer-maverick/telephone/t3-radar-3-houblons.jpg`
(ses défauts : libellés rognés au téléphone, chiffres d'échelle couverts par les points).

## Les données, les mêmes pour tous

`work/refonte-frontend/v4/ecran-1/fils7-radar/donnees.json` : 12 axes dans l'ordre de la roue
(`axes`, noms dans `noms`) et trois cas :

1. **Comparer** : Nugget, East Kent Goldings, Fuggle (couleurs données), citations 0–2 des fiches
   (0 non décrit, 1 cité, 2 marqué).
2. **Ma bière** : la zone du style (`zone`), ma bière (0 à 3 : faible, moyen, marqué) ; `null` =
   famille non située (`inconnues`) ; Résineux au-dessus du style (couleur d'alerte #c2410c, pour
   ce sommet seulement) ; familles attendues du style dans `attenduesDuStyle` (en gras).
3. **Suggestions** : zone, ma bière avant, après « Ajouter Golding 10 g à 10′ ».

## Ta variante : une technologie (ton message te donne tes numéros)

p01 **Recharts** (déjà dans l'app, React ; UMD : React 18.3.1 et recharts 2.x sur unpkg ou cdnjs,
l'app est en Recharts 3 et React 19, même API RadarChart) · p02 **Chart.js 4** · p03 **Apache
ECharts 5** (rendu SVG) · p04 **D3 v7** (lineRadial, courbe fermée) · p05 **Plotly.js**
(scatterpolar) · p06 **ApexCharts** · p07 **SVG à la main, fidèle à Beer Maverick**, sans
dépendance · p08 **SVG à la main, échelle au style** (l'anneau du style est la référence lisible ;
au-delà, une graduation par tolérance) · p09 **autre que le radar** : rose polaire ou barres
radiales (même données, mêmes 12 familles) · p10 **Observable Plot** (radar par projection, ou
ce que la bibliothèque fait de mieux pour ces données).

Charge les bibliothèques depuis cdnjs, jsDelivr ou unpkg, en version exacte.

## Le plancher, pour chaque radar

- **Chaque série est un polygone fermé sur les 12 axes**, dans l'ordre donné, sans en sauter.
  Une famille non située se pose **au centre**, avec une marque creuse sur son axe, un secteur
  hachuré léger et la légende « au centre : non situé ».
- Silhouettes pleines translucides, points aux sommets, une couleur par houblon (Comparer) ;
  ma bière pleine, la zone du style en fond gris ; Suggestions : avant en contour, après plein.
- Les 12 libellés entiers à 390 px (rien de rogné) ; les anneaux d'échelle nommés et lisibles,
  jamais couverts par un point ; texte de 12 px au moins.
- Au toucher (ou au survol) d'un sommet : la famille et la valeur en mots.

## Livrable

`fils7-radar/pNN/radar.html` : les trois radars l'un sous l'autre (358 px de large chacun), puis
une fiche de 5 lignes : bibliothèque et version, licence, poids (min + gzip, mesuré :
`curl -sL <url> | gzip -c | wc -c`), rendu (SVG ou canvas), intégration dans l'app (React 19,
hors ligne par npm). `NOTE.md` de 3 lignes : ce qui marche, ce qui coince, ton avis pour la base.

## Contrôles, une fois chacun

`node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <pNN>/radar.html
work/refonte-frontend/v4/ecran-1/fils7-radar/captures/pNN-radar-390.png 2400` (attends le rendu
de la bibliothèque) ; **regarde** la capture, puis corrige une fois. Réponse finale : une ligne par
variante (technologie, ce qui marche, ce qui coince).
