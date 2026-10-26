OK — controle-quand-comparer.mjs : OK sur le témoin, ECHEC sur la base jouable et sur un sélecteur immobile

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/quand-comparer-ok/etat.html` (3 boutons 60′ / 10′ / Dry hop, valeurs fictives qui changent)
- `work/refonte-frontend/v4/tournoi/outils/temoins/quand-comparer-immobile/etat.html` (même page, le toucher ne change que l'état actif)

## Ce que le contrôle fait
Usage : `node controle-quand-comparer.mjs <dossier> <id…> [--page=etat.html]` (page lue : `<dossier>/<id>/<page>`).
À 390 × 844, par page : (1) `[data-role="quand-comparer"]` existe et se voit ; (2) il porte au moins 3 moments dont 60′,
10′ et dry hop (`data-moment`, sinon texte ; boutons, onglets, feuilles de texte) ; (3) il touche chaque moment, attend que la
page se stabilise, et compare la signature des valeurs : texte de la page hors sélecteur, plus largeurs/hauteurs/tracés inline
et attributs SVG, mentions « 60′ / 10′ / dry hop » retirées. Les trois signatures doivent être deux à deux différentes.
Une page qui bouge seule, un moment qui disparaît, une page absente ou qui plante : ECHEC. Une ligne par page, aucun arrêt au
premier échec (M16), puis `QUAND OK` ou `QUAND ECHEC (n)` (n = pages en échec). Le jeton n'est écrit que dans la ligne finale
(assemblé à l'exécution) ; usage sans jeton, code 2. Aucun caractère de contrôle.

## Critères
- G1 : `QUAND OK` — `quand-comparer-ok : OK — 3 moments (60′, 10′, dry hop), les valeurs changent d'un moment à l'autre`.
- G2 : `ECHOUE OK (QUAND, code 1)` — `comparer : ECHEC — aucun élément [data-role="quand-comparer"]`.
- G3 : `ECHOUE OK (QUAND, code 1)` — `ECHEC — toucher un autre moment ne change pas les valeurs comparées (identiques : 60 = 10 ; 60 = dryhop ; 10 = dryhop)`.
Essais : 1 par critère.

## Pour les concepteurs (cma, cmb, cmz)
Poser `data-role="quand-comparer"` sur le sélecteur et `data-moment="60"`, `"10"`, `"dryhop"` (ou texte 60′ / 10′ / Dry hop)
sur chaque choix cliquable ; le toucher doit changer les nombres, les barres ou les rangées hors du sélecteur (pas seulement
un titre ou un état actif). Les trois critères `appels` de cma, cmb, cmz sont rouges tant que leurs pages n'existent pas.

## Doutes et limites
- Seuls 60′, 10′ et dry hop sont obligatoires et testés ; d'autres moments (whirlpool…) sont comptés, non testés.
- Les valeurs portées par un canvas ou une image ne sont pas lues (seulement texte, styles inline, attributs SVG).
- Un sélecteur en curseur (`input[type=range]`) n'est pas reconnu : le contrôle demande un toucher.
- `systeme.mjs cablage` est rouge pour une autre raison (DEFAUTS-COURT.md en retard), sans lien avec cette voie.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
