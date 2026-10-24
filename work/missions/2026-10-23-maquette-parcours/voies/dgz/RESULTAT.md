OK — quatre greffes jouables sur l'écran Dryhopper de la maquette (frise, trois plans, cuve, carte de chaleur)

## Base
Recalée en cours de voie sur le rendu jouable (message du pilote) : chaque page est le shell de
`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html` (même bundle `assets/parcours.js`, même moteur, mêmes
gestes, croix, pied « Annuler · Levure › »), plus une greffe injectée après le rendu. La greffe reconstruit la frise par
`window.__parcours.moteur` (`cransFrise`, `simulerMoment`, `lireBiere`, `effetLevure`, comme `frise.ts`) et pose le moment
par `window.__parcours.envoyer({ type: 'moment' … })` ; le rail, le bandeau, les barres, la mesure et le pont réagissent.
Rien de la base n'est retouché. `controle-choix --ecran=dryhopper` sur la base jouable : **CHOIX OK**. Captures ouvertes à
côté du rendu jouable sans greffe (même premier écran, la greffe en plus).

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/dgz{1,2,3,4}/etat.html` et `NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/captures/dgz{1,2,3,4}.png` et `dgz{1,2,3,4}-geste.png`
- scripts dans le scratchpad (`generer-dgz2.mjs`, `capturer-dgz2.mjs`, `sonder-jouable.mjs`), rien hors de Possède

## Variantes
| id | chaleur | greffe | l'idée |
|---|---|---|---|
| dgz1 | tiède | `frise-y1b` | la frise de y1b dans le pied, au pouce ; retravaillée : chaque arrêt (60′ · 10′ · WP · actif · après) dit son floral, orangé si trop amer |
| dgz2 | chaude | `trois-plans-w2` | Sage 0′ · Franc actif 2 j ★ · Osé après 3 j : trois moments, un facteur libre ; toucher une carte pose le rail |
| dgz3 | chaude | `cuve-x3b` | « Ma cuve » : ta stout (pointillé) → + Idaho 7 (couleur) → + levure Pomona (hachuré bleu), 12 colonnes, haut de la 16D |
| dgz4 | chaude | `carte-chaleur` (libre) | les 12 familles × 24 moments en cases, alignées sur le rail : où chaque famille monte, et quand |

## Critères
| critère | sortie |
|---|---|
| G1 `variantes.mjs dgz1 dgz2 dgz3 dgz4` | VARIANTES-BIEN-4 |
| G2 `controle-pictos-trait … --page=etat.html` | TRAIT OK (22 · 26 · 29 · 29 pictos, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes) |
| `controle-une-question` | UNE-QUESTION OK (1 groupe libre : moment, sur les quatre) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (4 captures) | remplissage médian 0,73, 0 sous 0,50 ; **DIVERSITÉ ECHEC** (ressemblance 0,95, 3 paires sur 6) : les quatre premiers écrans sont son écran jouable, par contrat (« p4b2f au premier plan, telle quelle ») |
| `controle-choix` (base jouable) | CHOIX OK |
| gestes (capturer-dgz2) | 0 erreur de page ; dgz1 glisser → 20′ ≈+11 ; dgz2 toucher Osé → après · 3 j ; dgz3 rail → whirlpool ~+14 ; dgz4 toucher colonne → après · 3 j |

## Captures
`work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/captures/dgz1.png`, `dgz1-geste.png`, `dgz2.png`, `dgz2-geste.png`,
`dgz3.png`, `dgz3-geste.png`, `dgz4.png`, `dgz4-geste.png` (390 × 844, ×2). Toutes ouvertes (L12).

## Prédiction
Il gardera dgz2 (« très intéressant » sur w2, ici lisible en trois secondes) et notera dgz1 « à retravailler » pour la hauteur
du pied ; dgz4 est la surprise qu'il mélangera avec une autre ; dgz3 lui parlera s'il veut la levure en comparaison.

DÉCISION À PRENDRE : PANEL ECHEC sur la seule diversité, structurelle à ce lot (base commune imposée) : accepter pour les
lots « greffes », ou mesurer la diversité sur la zone greffée seulement.

CONNAISSANCE : une mini maquette peut partir du vrai écran jouable sans le reconstruire : shell de
`maquettes/parcours/<écran>/etat.html` (chemins d'assets relatifs), greffe injectée quand `[data-ecran]` et
`window.__parcours.etat.brouillon` existent, données par `__parcours.moteur`, état posé par `__parcours.envoyer` ; le
moment se suit par MutationObserver sur `aria-valuenow` du rail. Limite : `maquettes/` est ignoré par git ; la page
dépend du bundle construit.

LEÇON PROPOSÉE : `variantes.mjs` lit `data-greffe="…"` dans le texte de la page : une greffe posée par `setAttribute`
passe au rendu et échoue au contrôle ; écrire l'attribut en clair (`insertAdjacentHTML`), ou faire lire le DOM rendu.
