OK — 4 variantes du plateau, six cas chacune ; PANEL ECHEC en diversité (cadre commun imposé)

## Fichiers écrits
- `plateau/v0/pg1/` à `pg4/` : `etat.html`, `NOTE.md`, captures `pgN-{repos,a,b,c,d,e,f}.png` (390 × 844, clair), `pgN-<cas>-cave.png`
  (pg1 et pg3 : b ; pg2 et pg4 : d), `pgN-1280-b.png` ; pg2 a en plus `pg2-a2.png` (détails ouverts).
- `plateau/voies/pg/` : `captures.mjs` (captures et planches, aucune requête réseau acceptée), `planche-pg1.png` à `planche-pg4.png`,
  `controles.log`, `controles-2.log`, ce RESULTAT.

## Les quatre
- pg1, froide : p3c-3 affinée, chaque chose dite une fois, le geste peint sur le champ, gestes rares derrière « ⋯ ».
- pg2, tiède : le geste en tête (RIEN / CHOISIR / REMPLIR / GARDER ?), le reste sur une ligne de résumé, « détails ⌄ ».
- pg3, chaude : le relevé dans la rangée, le geste dans un dock au pouce, posé sur le pied, avec « 1 sur 2 à régler ‹ › ».
- pg4, chaude : le pont facture → stock, et son trait (plein, tireté jaune, rompu rouge, ∅) qui dit l'état du mapping.

## Critères de VOIE.md
1. Quatre `etat.html` avec les six cas et le repos ; captures à 390 (clair, plus un cas en cave) et à 1280, ouvertes (planches, puis en plein :
   pg2-d, pg3-d, pg4-f, pg3-1280-b). Sortie de `captures.mjs` : « pgN 9 captures sans erreur » (pg2 : 10).
2. Chaque NOTE dit sa chaleur, son idée, la baseline cochée (écarts nommés pour pg2, pg3 et pg4) et les sorties des contrôles.
3. `git status --short` : seulement `plateau/v0/pg*/` et `plateau/voies/pg/` (vérifié au rendu).

## Contrôles du lot (sorties décisives)
- `controle-commun <v0> pg1 pg2 pg3 pg4 --page=etat.html --profil=sans-houblons --sans-lignes` : COMMUN OK. Sans `--sans-lignes` : MOTS ECHEC
  4/4 (115 à 117 mots au repos ; les lignes de facture sont marquées `data-mots="lignes"`, comme D238).
- `controle-contraste --profil=sans-houblons` : 79 textes par page, pire « CHF » 5,27:1, CONTRASTE OK (clair ; le thème cave n'est pas mesuré
  par l'outil, jetons de `themes.css`, vu sur les captures).
- `verifier-page --min-images 0` : PAGE OK ×4 (sans l'option : « 0 images (1 au moins) », ce sont des maquettes sans image).
- `type="number"` : 0 partout.
- `controle-panel` sur les cas b des quatre : remplissage médian 0,59, 0 sous 0,50, ressemblance 0,92, 1 paire sur 6 au-dessus de 0,95
  (pg2-b ~ pg4-b) : **PANEL ECHEC**. Sur les cas d : 0,95. Cause : le brief impose la même liste groupée, le même récap et le même pied
  autour du plateau, sur la même fixture ; le plateau fait 30 à 45 % du premier écran, et la vignette 24 × 52 voit surtout le cadre.
  Essayé : récap plié en pg3 (0,93 → 0,92) ; rangée montée en haut en pg4 (le remplissage tombait sous 0,50, annulé).

## Prédiction
« pg4, le pont, je comprends tout de suite ce qui est relié ou pas ; pg3 c'est pratique au pouce ; pg1 c'est mon p3c-3 en propre. »

DÉCISION À PRENDRE : juger la diversité du panel sur le plateau seul (une capture rognée de la rangée au pied), puisque le cadre commun est
obligatoire. Sinon, assouplir le cadre en passe 2 (récap plié pour toutes les variantes ?), ce qui toucherait sa baseline.

CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un lot dont le brief impose le même écran autour de la pièce étudiée ne peut pas passer `controle-panel` en plein écran ;
le contrôle devrait accepter une zone (le plateau), sinon il pousse à déformer le cadre choisi.
