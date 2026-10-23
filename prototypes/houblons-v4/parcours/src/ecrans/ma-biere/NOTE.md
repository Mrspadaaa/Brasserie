# Étape Houblons (route ma-biere ; voie p1-ma-biere, reprise D105, 23.10)

## Base

- La base v4.10 qu'il a choisie : `work/refonte-frontend/v4/ecran-1/base/consolide/index.html`. Captures
  regardées : `base/captures/consolide-390.png` (repos), `consolide-glisser-120-2-pendant.png` (geste),
  `consolide-1280.png`.
- Inventaire : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-etape.json` (7 éléments).
- La carte en fil de fer (`fils22-carte/ma-biere`) n'est PAS une base (D105) : elle ne donne que les ponts.

## Reprise

- etape-titre : repris — en-tête « Houblons 3/7 », désormais le fil d'étapes de l'app (D116) ; la pastille « 16D · hypothèse » est retirée
- etape-bandeau : repris — le bandeau IBU (jauge au style), OG, EBC, en pilule
- etape-frise : repris — la frise verticale : ébullition 60′, 0′, whirlpool, levure, fermentation, post-fermentation ; chaque ajout à son moment, son repère « 60′ » glissé par 5′
- etape-carte-ajout : repris — la carte de l'ajout : nom, « ébullition ⟳ », « − 46 g + », ×, α, rôle, « résine 2/4 », IBU, bande des 12 familles
- etape-levure : repris — « SafAle US-05 caractérisée » posée dans la frise ; elle ouvre l'étape Levure
- etape-ajouter : repris — « Ajouter — houblon… » (champ texte qui filtre le stock) et trois ajouts rapides à 10 g et 10′, « + », ♡
- etape-profil : repris — « Résineux trop marqué › » puis les 12 familles en deux colonnes ; le « › » dit « analyse » et tout le bloc ouvre l'onglet Ma bière (D121)

## Idées reprises

- Moteur en direct : glisser le repère, changer la dose ou le type, ajouter ou retirer recalcule l'IBU de l'ajout,
  l'IBU total et les barres.
- Sous la bande des familles d'une carte, un trait pour chaque famille que l'ajout fait bouger dans ma bière, de la
  longueur de ses crans du style (D80 : data-famille, data-crans).
- Repère de ce qui vient de changer au retour d'un outil : « nouveau », « à la place de Nugget », l'IBU d'avant barré,
  un point gris « avant » sur la barre, un liseré paille qui s'éteint.
- Arôme hors du simulateur (ébullition hors 60′ et 10′) : « ? arôme » sur la carte, jamais 0.

## Écarts

- « + floral » (pont vers Suggérer) à côté de l'alerte : le pont de la carte des outils, que le parcours joue depuis
  l'étape ; la base le met dans l'onglet Ma bière, où il est aussi.
- « Je n'ai pas Nugget › » sous la carte : le pont vers Substituer (la porte), absent de la base.
- Un « ? » de légende et « Au style / Absolu » au-dessus des familles : exigences de toute l'app (D75, D89). « + floral »
  passe sur ce rang (sous l'alerte), pour laisser à « analyse › » la place du « › » de la base.
- Un « ? » de plus au coin de la carte de l'ajout et à côté de « Ajouter — houblon… » (D113) : la base n'en avait pas.
- Toute la carte de l'ajout est non sélectionnable (`user-select` et `-webkit-touch-callout` à `none`) ; la base ne
  protégeait que le nom (D112, décision du pilote : c'est la carte que l'iPhone sélectionnait).
- Le geste (D111) suit sa base sans son moteur de dock : la ligne tenue s'ouvre à 14 px par 5′ jusqu'à 0′ (les étapes
  d'après descendent), la carte se replie en puce « Nugget » à côté de la bulle, les minutes s'écrivent à droite du trait,
  à 22 px du doigt au moins et 24 px entre deux. Hors du segment de départ (dry hop), la ligne se referme au pas du doigt
  (deux fois sa vitesse) et la carte revient : aucun houblon ne saute (D61 bis), pas de vide (D55).
- L'annonce de WizardStepName (sr-only) est à 1 px de police : ses glyphes, mesurés pleine largeur, passaient pour un
  texte posé sur le nom de l'étape (D56).
- D5 (critique p6, 24.10 : 1,14 écran depuis le fil de l'app) : les rangs sont resserrés, sans rien retirer. Nœuds
  sans ajout de la frise à 24 px, familles du profil à 24 px, ajouts rapides, champ, levure et espacements plus serrés,
  « ? » du profil à zone tactile débordante (44 px sans prendre de place). Trois ajouts rapides comme sa base : 881 px
  pour 844, soit 1,04 écran (`controle-hauteur`) ; avec deux, l'écran ferait environ 57 px de moins.
- Toucher une autre étape du fil ne fait rien : seule l'étape Houblons existe dans la maquette.
- L'ébullition est à l'échelle du temps : 14 px par 5′, l'endroit où le doigt lâche le repère (D61) ; le reste de la frise
  est en étapes. Le repère est une piste verticale (role=slider, aria-orientation=vertical) qui ne bouge pas pendant le
  geste : la frise garde sa place jusqu'au lâcher (D68), le repère suit le doigt en continu (D46), un cran = min(14 px,
  place à l'écran ÷ crans) (D69), et seules les graduations du segment sous le doigt s'ouvrent, en loupe (D47, D63).

## Reprise de l'étape (23.10, nuit) — D111, D112, D113, D116, D121

- D111 « Le slider est pas dans la version que je veux... » : le geste de sa base (consolide-nugget-35-pendant.png) :
  carte repliée en puce à côté de la bulle, frise ouverte autour du doigt, minutes lisibles, rien de sélectionnable.
- D112 « L'appui prolonger fait pas l'effet escompté » : le nom se remplit dès le doigt posé (500 ms, comme la base), puis
  la fiche g1 ; la carte ne se sélectionne pas.
- D113 « il manque à un endroit un bouton légende » : un « ? » par groupe d'icônes (carte de l'ajout, ajouts rapides,
  familles), qui nomme les 12 couleurs de la bande, les traits, ⟳, « résine 2/4 », α, le cube, l'inconnu hachuré.
- D116 « remplacer tout ça par le vrai Stepper de la vrai app » : `WizardStepName` et `WizardStepRail` importés de
  `src/ui/WizardStepBar.tsx`, posés comme BrewWizard (nom et 3/7 dans le titre, le fil sur son rang, showLabels,
  compactLabels ; à l'ordinateur, le fil en « progress »).
- D121 « Seul bouton qui ouvre vraiment l'analyse. Peut, être amélioré » : tout le bloc ouvre l'onglet Ma bière, et la
  variante A (dans la version) écrit « analyse › » à la place du « › ». Planche : `variantes-d121/planche.html` (A, B, C).

## Pour l'app

- `src/ui/hops/RecipeHops.tsx` dans `RecipePage` (étape 3/7) ; la frise et le repère glissé deviennent un composant
  `BrewTimeline` partagé avec Dryhopper ; la recette s'écrit dans Dexie.
- Les ajouts rapides viennent du vrai stock (Dexie) ; ♡ et les goûts, des préférences du brasseur.
- `jouer-parcours.mjs` ne glisse qu'à l'horizontale : le geste vertical est joué dans la page (événements de pointeur).
  Une option `axe: 'y'` dans le socle le jouerait au vrai doigt.
