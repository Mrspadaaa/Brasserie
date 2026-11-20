# Captures et relectures g1 (exécutant, 20.11)

Cumul dépensé : **0,6831 CHF** (inchangé : aucun appel Gemini réel, aucune ligne ajoutée au journal). Plafond 6,80 CHF.

## Chemin qui marche
`?dev-local&depense=<état>` seul n'ouvre pas la feuille : il faut cliquer le bouton « + » flottant (coin bas-droit), puis « Nouvelle écriture » dans le menu. Au premier chargement à froid, `montant-deduit` affiche une fois « Impossible de charger la brasserie » ; un rechargement suffit. Script : `scratchpad/capturer-g1.mjs` (hors voie, car voies/g1 n'est pas écrit par l'exécutant).

## Captures (8 PNG dans captures/, chaque image ouverte)
- montant-deduit-390-clair : erreurs 0 ; Sédation présente, 0,00 souligné en pointillé jaune ; « 3 à contrôler » jaune ; pas de « à remplir » rouge, pas de « + ? ». Libellé « repris » non visible à l'écran.
- montant-deduit-390-cave : idem, erreurs 0.
- montant-deduit-1280-clair : idem, erreurs 0.
- montant-deduit-1280-cave : idem, erreurs 0.
- port-390-clair : **défaut LR2-4 visible** : « 23 lignes » dans l'en-tête (« dont port 8,50 ») mais « Articles lus 24 » ; le port est compté dans la rangée Articles.
- port-390-cave : idem.
- port-1280-clair : idem.
- port-1280-cave : idem.

Cause probable du 24 : `apercuDev.ts` (état `port`) pose `printedLineCount: items.length` après avoir ajouté la ligne Port. Le test LR2-4 vert ne couvre pas cette rangée à l'écran.

## Verdicts et tests
- `verdicts.mjs g1` : VERDICTS OK (16)
- `verdicts.mjs g1 --tests` : TESTS OK

## Relectures payantes LR1-NOTE-1 à 3 : non faites
Le lanceur s'arrête sans appel : « Aucune clé Gemini locale ». L'estimation (`G1_MODE=estimer`, doc15, doc24, doc25) donne une réserve maximale de 0,4313 CHF, cumul au pire 1,11 CHF : budget suffisant, clé absente. Je n'ai pas cherché la clé ailleurs.

Noms attendus (BUGS.md) : LR1-NOTE-1 « Lame de ragréage » pour LAME DE GABRAGE (doc15) ; LR1-NOTE-2 noms OCR bruts « TAETS, TURGTNE MELRANEUR » ; LR1-NOTE-3 « BAC A en pièce / L » (BAUHAUS). Lectures réelles : aucune. Le document qui porte BAUHAUS n'est pas identifié (doc15, doc24, doc25 choisis par la demande).

LL-8 et TL-NOTE-2 : non joués (app en ligne demandée, hors consigne).

## Douteux
- Le libellé « repris » du montant déduit n'est pas lisible sur les captures : seule la pastille « à contrôler » l'est.
- LR2-4 : à rejouer après correction de la rangée Articles.
