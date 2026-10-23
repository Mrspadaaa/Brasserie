# Étape Houblons (route ma-biere ; voie p1-ma-biere, reprise D105, 23.10)

## Base

- La base v4.10 qu'il a choisie : `work/refonte-frontend/v4/ecran-1/base/consolide/index.html`. Captures
  regardées : `base/captures/consolide-390.png` (repos), `consolide-glisser-120-2-pendant.png` (geste),
  `consolide-1280.png`.
- Inventaire : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-etape.json` (7 éléments).
- La carte en fil de fer (`fils22-carte/ma-biere`) n'est PAS une base (D105) : elle ne donne que les ponts.

## Reprise

- etape-titre : repris — en-tête « Houblons 3/7 », le style « 16D · hypothèse » en pastille à droite
- etape-bandeau : repris — le bandeau IBU (jauge au style), OG, EBC, en pilule
- etape-frise : repris — la frise verticale : ébullition 60′, 0′, whirlpool, levure, fermentation, post-fermentation ; chaque ajout à son moment, son repère « 60′ » glissé par 5′
- etape-carte-ajout : repris — la carte de l'ajout : nom, « ébullition ⟳ », « − 46 g + », ×, α, rôle, « résine 2/4 », IBU, bande des 12 familles
- etape-levure : repris — « SafAle US-05 caractérisée » posée dans la frise ; elle ouvre l'étape Levure
- etape-ajouter : repris — « Ajouter — houblon… » (champ texte qui filtre le stock) et trois ajouts rapides à 10 g et 10′, « + », ♡
- etape-profil : repris — « Résineux trop marqué › » puis les 12 familles en deux colonnes ; « › » ouvre l'onglet Ma bière

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
- Un « ? » de légende et « Au style / Absolu » au-dessus des familles : exigences de toute l'app (D75, D89).
- L'ébullition est à l'échelle du temps : 14 px par 5′, l'endroit où le doigt lâche le repère (D61) ; le reste de la frise
  est en étapes. Le repère est une piste verticale (role=slider, aria-orientation=vertical) qui ne bouge pas pendant le
  geste : la frise garde sa place jusqu'au lâcher (D68), le repère suit le doigt en continu (D46), un cran = min(14 px,
  place à l'écran ÷ crans) (D69), et seules les graduations du segment sous le doigt s'ouvrent, en loupe (D47, D63).

## Pour l'app

- `src/ui/hops/RecipeHops.tsx` dans `RecipePage` (étape 3/7) ; la frise et le repère glissé deviennent un composant
  `BrewTimeline` partagé avec Dryhopper ; la recette s'écrit dans Dexie.
- Les ajouts rapides viennent du vrai stock (Dexie) ; ♡ et les goûts, des préférences du brasseur.
- `jouer-parcours.mjs` ne glisse qu'à l'horizontale : le geste vertical est joué dans la page (événements de pointeur).
  Une option `axe: 'y'` dans le socle le jouerait au vrai doigt.
