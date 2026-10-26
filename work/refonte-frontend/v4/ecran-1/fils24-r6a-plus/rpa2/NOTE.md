# rpa2 · « Ma stout, dry hop après dry hop »

Chaleur : **tiède** (la forme de l'approche : la cuve de x3b). Une idée : chaque case de r6a devient une petite cuve
en marches, « ma bière de base -> 1 dry hop, 2 dry hop: levure ».

## Greffes (`data-greffe`)
- `cuve-x3b` : la bande noire en tête, quatre marches touchables : ta stout → 1er dry hop (4 g/L, après, 3 j) →
  2e dry hop du même (+2 g/L) → levure (les deux, le 1er pendant la fermentation, Pomona). Dans chaque case : ta stout
  en pointillé et en première marche sombre, puis les trois marches à la couleur de la famille, l'orangé au-dessus
  de ta 16D. La marche touchée ressort partout ; Floral et Résineux disent son écart en crans.
- `levure-pomona` : une rangée « Pomona » : ce que change la levure face aux deux dry hops après (Idaho 7 : floral
  ~+0,1, résineux ~−0,3). Galaxy : « bio ? » hachuré (biotransformation non publiée), seul l'effet du dry hop actif est
  simulé.
- `etapes` : dans chaque tête, le floral gagné à 60′ · 10′ · dh ; ton Nugget en référence sous « ta stout ».
- `hors-16d` : « lui seul » dans chaque tête. ⇄ × sous les têtes (D137, dessinés).

## Ce qui tient
- Les trois colonnes et les 9 rangées de r6a, lues en travers. Ce qu'on apprend : le 2e dry hop ajoute du floral
  (Idaho 7 ~+1,25 → ~+1,58) mais encore du résineux (~+2 → ~+2,6) ; passer le 1er en fermentation avec Pomona
  rend du floral (~+1,73) et retire du résineux (~+2,3).
- Radar r2 au dry hop sous le premier écran ; chimie, IBU et panel OSU repliés.

## Ce qui casse ou reste douteux
- Le résineux de ta stout (83 sur 100) est déjà au-dessus du domaine au style : la case est pleine dès la première
  marche ; l'absolu la lit mieux.
- Le floral reste bas au style (domaine 82,5) : les marches sont petites ; c'est la vérité du moteur, mais ça se lit
  moins que l'agrume ou le tropical.
- Le 2e dry hop est le même houblon : un 2e houblon différent changerait la question (Dryhopper) ; à trancher.
- 125 mots au premier écran (MOTS sauté en v0).

## Contrôles (24.10)
- `controle-commun --sans=mots` : COMMUN OK. `controle-comparer-etapes` : COMPARER-ETAPES OK (3 houblons + référence
  beermaverick-nugget, b10 b60 dryPost), 390 et 1280. TRAIT OK. PANEL OK (série). Mots : 125.
- `controle-choix --ecran=comparer` : CHOIX ECHEC (inventaire de la maquette construite, à porter en passe 2).

Captures : `captures/rpa2.png` (levure), `captures/rpa2-1er-dry-hop.png`, `captures/rpa2-legende.png`,
`captures/rpa2-fiche-nugget.png` (appui long sur la référence).
