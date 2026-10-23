# Ma bière, étape Houblons (voie p1-ma-biere, 23.10)

## Base

- Disposition l8 et barres l5b de la base v4.10 : `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html`.
  Captures regardées : `base/captures/consolide-390.png`, `consolide-biere-390.png`, `consolide-biere-radar-390.png`,
  `consolide-glisser-120-2-pendant.png`, `consolide-1280.png`.
- La carte des outils : `fils22-carte/ma-biere/etat.html`, capture `fils22-carte/captures/ma-biere-390.png` (ordre
  du contenu et ponts : « + floral », « Je n'ai pas Nugget », la levure).
- Radar m4 (« Radar: m4 h4 très bien »), picto « épicé » f1 (symboles de la planche standard, via le socle).

## Idées reprises

- En tête IBU, OG, EBC, avec la jauge IBU face à la bande du style ; l'alerte de dégustation (« Trop résineuse ·
  dégustée 18.10 ») et, sur la même ligne, l'action « + floral › » (pont vers Suggérer).
- Les 12 familles en barres l5b au style (zone du style = moitié gauche), l'absolu et le radar m4 à un toucher
  (lentilles SegmentedControl de l'app, balisées `data-e` et `data-vue`) ; l'inconnu hachuré, jamais 0.
- Chaque houblon dans l'ordre du brasseur : nom (appui long → fiche), α du lot puis plage des fiches, usage en mot,
  stock en icône seule, IBU de l'ajout recalculé en direct ; puis le rail du moment et la dose (− / +) ; puis les
  familles qu'il fait bouger (picto, sens, crans du style : D80) et la part « autres » au-delà de 25 % (D100).
- Le moment glissé par 5′ (D27, D34) : les crans du moteur (`cransFrise`, comme Dryhopper), ébullition de la
  durée à 0′, whirlpool, dry hop actif et après en jours ; loupe au-dessus du doigt (D47) ; 14 px de doigt au
  moins par cran (D46) ; au clavier ← →.
- Repère de ce qui vient de changer, au retour d'un outil : « nouveau », « à la place de Nugget », l'IBU d'avant
  barré, le rond « avant » et l'écart simulé « ~+27 » sur les barres, un liseré paille qui s'éteint.
- Arôme hors du simulateur (ébullition hors 60′ et 10′) : « ? arôme » sur la ligne et sous les barres.

## Écarts

- Le rail est horizontal, sur la ligne du houblon, et non le rail vertical des étapes de l8 : chaque ligne garde
  son geste, le même modèle que la frise de Dryhopper (y1b), et le geste se joue au script (glisser horizontal).
- Ordre : profil avant les houblons (consigne de la voie et carte fils22), alors que l8 mettait le rail d'abord.
- Le toucher court sur une ligne ouvre Dryhopper (carte : « la ligne d'un houblon → Dryhopper ») ; l'appui long
  sur toute la carte ouvre la fiche (D49) ; le survol de 600 ms sur le nom, à l'ordinateur (D25).
- La levure ouvre l'étape Levure de l'ajout à froid le plus récent (biotransformation), sinon du premier ajout.
- La dose se règle au gramme ; la dose à IBU égal de Substituer se pose au demi-gramme (voir sa NOTE).

## Pour l'app

- `src/ui/hops/RecipeHops.tsx` dans `RecipePage` ; la recette lue et écrite dans Dexie (la maquette garde l'état en
  mémoire) ; l'instantané du repère (`repere.ts`) devient un champ du brouillon (`useRecipeDraft`).
- `SegmentedControl` doit accepter un attribut par option (`data-e`, `data-vue`) : la maquette le pose après rendu.
- La dégustation (18.10), l'α des lots et le stock viennent de la fixture du moteur v4 : à brancher sur Dexie.
- Le rail : un composant `MomentRail` de `src/ui/hops/`, partagé avec Dryhopper.
