# cmz4 · Comparer, qui gagne quand

Série cmz (libre, brief minimal). **Chaleur : chaude** (forme libre : la réponse d'abord). Base : l'écran Comparer de la
maquette jouable, reprise en entier (liste dans `../cmz1/NOTE.md`).

## L'idée (une seule) — `data-greffe="echelle-qui-gagne-quand"`
Avant le radar, une échelle de cinq barreaux, un par moment, qui répond à sa question à chaque moment : qui mène le
floral (★ et sa couleur), de combien devant le suivant (~+0,2 cran), s'il sort de ta 16D (⚠ et la famille), et l'IBU de
l'ajout à ce moment, du plus bas au plus haut des houblons comparés (« ? » à froid). À 60′ : « = ~+0,1 », égalité, pas
d'étoile. Le barreau touché est noir et déplie la base à ce moment (radar, têtes, rangées) ; la ligne de réponse de la base
n'est plus répétée sous le tableau, l'échelle la porte. Ce que ça apprend sans toucher : à chaud Galaxy, au froid Idaho 7,
et le whirlpool fait sortir Galaxy (tropicaux).

## Ce qu'il a demandé, et où c'est
1. Choisir quand : l'échelle, `[data-role="quand-comparer"]`, barreaux `data-moment`.
2. Hors 16D : chip noir `[data-role="hors-16d"]` sous chaque tête, liste dans la fiche.
3. Huiles : `data-greffe="huiles"` dans chaque tête.
4. Moins de texte : 100 mots au premier écran (base : 114), au plafond : l'étoile et le « = » sont en CSS, « IBU » n'est
   écrit qu'une fois.
5. ⇄ × ＋ recherche, Nugget en pointillé, « ~ simulé » à un toucher.

## Données
Les mêmes que cmz1 (`../cmz1/donnees-moteur.ts`). L'écart du barreau = meneur − deuxième, en crans de la famille ; l'IBU
du barreau = min–max des houblons comparés à ce moment (60′ : 52–137 ; 10′ : 19–50 ; whirlpool : 8–21).

## Ce qui tient
- La question « quand ? » est répondue cinq fois en lecture directe, chiffrée, sans toucher ; le reste de la base intact.
- À quatre houblons ou deux (Motueka · Nelson Sauvin), l'échelle reste la même hauteur.

## Ce qui casse ou reste douteux
- 100 mots exactement : tout mot de plus déborde ; l'échelle coûte 170 px, le radar est réduit à 214 px.
- L'écart d'un barreau est « meneur devant le deuxième », pas « retenu contre ★ » comme la réponse de la base : à dire.
- Radar r2 superposé gardé ; dock présent, feuilles non jouées.

## Contrôles (joués une fois, depuis la racine)
- `mots-premier-ecran --max=100` : 100 mots, MOTS OK. `controle-pictos-trait` : 50 pictos, 0 faute, TRAIT OK.
- `controle-quand-comparer` : OK — 4 moments, les valeurs changent. QUAND OK.
- `controle-hors-16d --min=3 --premier-ecran` : HORS-16D OK. `controle-panel` (série) : PANEL OK.
- `controle-commun --sans=mots` : tout OK sauf standard (indicatif). `controle-alpha` : 1 voie sans α (Nugget, référence,
  α à l'appui long).
- Gestes joués au doigt : GESTES OK ; largeur 390, 0 erreur.

Captures : `captures/cmz4.png`, `cmz4-moment.png` (10′), `cmz4-long.png`, `cmz4-nelson.png`, `cmz4-plus.png`.
