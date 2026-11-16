OK — 4 mini maquettes Retrouver/trier/filtrer/ranger : liste d'aplomb, frise, facettes, cave en plan

Fichiers écrits (tous dans `voies/e6/`) : `capture.mjs`, `tests.txt`, et pour chaque variante `e6a` à `e6d` : `etat.html`, `NOTE.md`, PNG.

| Variante | Chaleur | Idée |
|---|---|---|
| e6a | froide | La liste actuelle, remise d'aplomb (phrase-réponse, recherche ouverte, puces chiffrées, période « Nov. + en cours ») |
| e6b | tiède (meilleure) | La période devient une frise : barres de vie, plage à poignées, punaise « en cours » qui corrige « Ce mois » |
| e6c | tiède | Des filtres qui comptent : feuille en écran, nombre géant, bande des 5 brassins, conflit nommé à vide |
| e6d | chaude | La cave en plan : cuves, bouteilles et fût dessinés, zone touchée = filtre, carton Archives = Ranger |

Critères (sortie dans `tests.txt`) : G1 `SERIE OK` · G2 `ETATS OK` · G3 `HORS OK`.

Captures (390 × 844 tactile ; ouvertes avec Read) :
- `e6a/e6a-repos-390-clair.png`, `e6a-geste-390-clair.png`, `e6a-vide-390-clair.png`
- `e6b/e6b-repos-390-clair.png`, `e6b-geste-390-clair.png`, `e6b-vide-390-clair.png`, `e6b-repos-390-cave.png`, `e6b-repos-1280-clair.png`
- `e6c/e6c-repos-390-clair.png`, `e6c-geste-390-clair.png`, `e6c-vide-390-clair.png`
- `e6d/e6d-repos-390-clair.png`, `e6d-geste-390-clair.png`, `e6d-vide-390-clair.png`

Les dernières retouches, mineures, n'ont pas été rouvertes : e6c (libellés de la plage d'alcool, hauteur des tuiles, bouton « Tout effacer · 5 » à vide) et e6d au geste (puce Archives en double retirée). Mêmes captures à rouvrir avant de montrer.

Défauts restants vus :
- e6d au repos et à vide : un quart bas vide à 390.
- e6a au repos : la liste dépasse 844 et défile, ce qui est normal pour une liste.

Prédiction : « La frise, là je vois enfin pourquoi la Pils disparaissait ; la cave en plan, c'est osé mais je retrouve mes cuves. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la cause du bug « Ce mois cache 3 brassins sur 5 » vient probablement d'un filtre posé sur la date de brassage ; je ne l'ai pas vérifié dans le code. Dans les maquettes, le défaut est corrigé par la règle : un brassin est retenu si sa vie croise la période, et un brassin en cours est toujours retenu (App.tsx l. 171, défaut `this-month`).
LEÇON PROPOSÉE : aucune.
