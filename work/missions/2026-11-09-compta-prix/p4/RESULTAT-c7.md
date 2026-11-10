OK — Prix passe 5 : c7a–c7c, c5b retouchée (aiguille franche, axe nommé, valeurs sur la courbe)

## Fichiers écrits
`p4/c7a/`, `p4/c7b/`, `p4/c7c/` : chacun `etat.html` (statique, classes et globales préfixées), `NOTE.md`, `<id>-haut.png`, `<id>-etat2.png` (par an), `<id>-page.png`, `<id>-1280.png`. Ce fichier. Scripts hors dépôt (scratchpad) : `cap-c4.mjs`, `tout-c4.sh`, `frag-c7b.js`, `frag-c7c.js`. Rien dans `src/`, aucun commit.

Base : `p3/c5b/etat.html`, reprise telle quelle (mêmes cadres, chiffres, règle, pente, tuiles, actions), capture `p3/c5b/c5b-haut.png` mise à côté des miennes.

| id | chaleur | retouche | par an |
|---|---|---|---|
| c7a | froide | c5b au plus près : aiguille pleine, seul l'axe choisi chiffré et nommé, 4,50 · 5,00 · 6,00 posés sur la courbe, bascule collée sous le chiffre | axe droit vert, 9 162,72 en tête |
| c7b | tiède | un seul axe à gauche qui change d'unité ; colonnes retirées, pente aux couleurs de la règle ; bascule dans la phrase « Il te reste [par bouteille · par an] » | même axe : 0 · 5 k · 10 k · 15 k |
| c7c | chaude (dans la retouche) | deux échelles côte à côte à gauche (thermomètre °C/°F), l'échelle lue en gras ; le chiffre est la bascule (« 9 162,72 par an ⇄ » sous 2,52) | les deux chiffres s'échangent |

Communs aux trois : aiguille franche de c4a (trait plein de la règle au point), crans 4,50 et 6,00 sur la règle, « +0,10 → +363,60 /an » descendu dans le coin vide « à perte », tuiles 75 cl et fût avec leur prix d'exemple (10,00 · 160,00 ex.), 1280 dessiné sans cadres 390 résiduels (incohérence 2 de la passe 4).
Corrections transversales tenues : 7,51 CHF/L (lien sous la règle), coût 2,48 = 7,51 × 0,33 ; grille 5,00 · 10,00 · 160,00 « ex. » ; « coût » nommé ; 27 L nets ; « si 1 200 L en 33 cl · estimé » sous chaque annuel ; « ≤ » pour l'emballage inconnu ; « Il te reste » ; aucun cockpit. Nombres : 2,02 · 2,52 · 3,52 ; × 3 636 = 7 344,72 · 9 162,72 · 12 798,72.

## Sorties décisives
- `verifier-page.mjs --captures` ×3 : PAGE OK (390 px, sans erreur). `cap-c4.mjs` : 1280 débord 0 ×3, erreurs 0, texte < 12 px : 0.
- `mots-premier-ecran.mjs … --max=60` : c7a 59 · c7b 58 · c7c 60 → MOTS OK (premiers passages : c7a 66, c7c 62, corrigés).
- `controle-commun.mjs p4 c7a c7b c7c --profil=sans-houblons --sans=mots` : COMMUN OK (premier passage : contraste 9 sur c7a, axe éteint en gris clair ; corrigé : l'axe non choisi perd ses chiffres).
- `controle-panel.mjs` (3 `-haut.png`) : remplissage 0,64, 0 sous 0,50, ressemblance 0,95, 1/3 paires → PANEL ECHEC, **attendu** : la passe 5 demande trois retouches légères de c5b, « pas réinventée » ; la diversité n'est pas le but.
- `type="number"` : 0 ; IBAN : 0.

## Captures (toutes ouvertes)
`p4/c7a/c7a-haut.png`, `c7a-etat2.png`, `c7a-1280.png` ; `p4/c7b/c7b-haut.png`, `c7b-etat2.png`, `c7b-1280.png` ; `p4/c7c/c7c-haut.png`, `c7c-etat2.png`, `c7c-1280.png`. Après la dernière retouche (bulle +0,10), revues : c7c-etat2 et les trois 1280 ; c7a-haut, c7a-etat2, c7b-haut, c7b-etat2, c7c-haut vues juste avant (seule la bulle a bougé, débord 0 mesuré). `-page.png` non ouvertes (débord 0 mesuré).

## Prédiction
« c'est c5b, et là je lis » : il prend c7a, ou c7b s'il trouve que les colonnes chargeaient.

DÉCISION À PRENDRE : aucune nouvelle ; reste ouverte celle de la passe 4 (impôt au taux plein 25,32 CHF/hl contre réduction petit brasseur, à trancher au port).
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
