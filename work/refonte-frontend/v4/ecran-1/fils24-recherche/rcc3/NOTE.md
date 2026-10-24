# rcc3 — La force du nez

- **Chaleur** : chaude (forme libre).
- **Série** : rcc, « l'arôme d'abord ».
- **Idée** : on pose l'arôme (une famille, dans la rangée de pictos), puis sa force. Tous les houblons de la famille se rangent
  sur leur huile totale (mL pour 100 g, milieu de la plage des fiches). Une fenêtre au doigt choisit entre « discret » et
  « puissant ». Saaz, en pointillé, sert de repère du fade, de haut en bas de l'écran. C'est la réponse à « un moyen de
  différencier un houblon hyper aromatique type Galaxy d'un houblons plus "fade" type saaz » (D131 ter).
- **Vrai cas** : on vient du champ « Ajouter — houblon… » de l'étape (stout export 16D). Tropicaux, dry hop, fenêtre de 2,5 à
  5+ mL : **14 houblons**, dont 2 en stock.
  - Polaris 4–5, Styrian Cardinal 3–4, Sultana, HBC 586.
  - **Galaxy 1,8–5 (60 g, α 17,2 du lot, en orangé hors de sa plage 11–16)**, Ekuanot, Tango, Ahhhroma, Melba, El Dorado, Ella,
    Strata, Sabro (30 g), Styrian Wolf.
  - En tout, 94 houblons tropicaux aromatiques ou doubles ont une huile connue ; 4 n'en ont pas et sont dits « huile ? », jamais
    placés à 0.

## Ce qui tient
- Honnêteté : chaque ligne trace l'intervalle de ses fiches (barre), et non un chiffre seul. La barre est pleine si la famille est
  marquée, pâle si elle n'est que citée.
- Le nuage du haut et les barres partagent la même échelle : on lit d'un coup qui est loin de Saaz.
- Le geste fait la recherche : faire glisser la poignée « discret » de 2,5 à 0,9 mL fait passer la liste de 14 à 90 houblons,
  en direct (D138).
- Le mot précis de la famille sur chaque ligne (« fruit de la passion, ananas »), et un mot hors 16D en ◇ (« ◇ vin de glace »,
  « ◇ cannabis »).
- Au style 16D : un pointillé au-dessus des pictos Floral, Herbacé et Terreux, les familles attendues de la stout export.

## Ce qui casse
- L'huile totale est une mesure de potentiel aromatique, pas l'intensité perçue. La légende le dit (« huile totale »), mais le
  brasseur peut attendre plus (seuils, thiols).
- Toutes les barres de la fenêtre sont à droite : la moitié gauche des lignes reste vide quand on cherche le « puissant ».
- Une seule famille à la fois.

## Baseline : écart déclaré
- `--sans=mots` : 150 mots au premier écran (100 hors données), surtout les noms et mots des 14 houblons trouvés.

## Contrôles (24.10, soir), sorties recopiées
- `concepts.mjs` : CONCEPTS-BIEN-4.
- `controle-pictos-trait.mjs` : rcc3 · 12 pictos de famille · 0 faute ; TRAIT OK.
- `controle-commun.mjs … --sans=mots` : COMMUN OK. Le contraste le plus faible est « α 17,2 », en orangé : 5,18:1.
- `controle-panel.mjs` : PANEL OK.
- Réactivité (D138), geste au doigt sur la poignée : de « 14 dans la fenêtre » à « 90 dans la fenêtre » (250 ms, glissé compris).

Captures : `captures/rcc3.png`, `captures/rcc3-fiche.png`, `captures/rcc3-apres.png` (fenêtre élargie à 0,9 mL).
