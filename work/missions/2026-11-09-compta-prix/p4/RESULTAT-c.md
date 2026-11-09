OK — 7 concepts passe 4 : Prix c6a–c6d (type c5b avec c5a), rangement e3a–e3c (e1b amélioré)

## Fichiers écrits (voie c seulement)
`p4/c6a/`, `p4/c6b/`, `p4/c6c/`, `p4/c6d/`, `p4/e3a/`, `p4/e3b/`, `p4/e3c/` : chacun `etat.html` (statique, classes et globales préfixées), `NOTE.md`, `<id>-haut.png`, `<id>-etat2.png`, `<id>-page.png`, `<id>-1280.png`. Ce fichier. Scripts hors dépôt (scratchpad) : `cap-c4.mjs`, `tout-c4.sh`. Rien dans `src/`, aucun commit.

| id | écran | chaleur | idée | état 2 |
|---|---|---|---|---|
| c6a | Prix | froide | c5b réparé : bascule collée au chiffre, règle de c4a en tête (aiguille franche), l'aiguille descend dans une pente à un seul axe | par an : 9 162,72, axe en k CHF |
| c6b | Prix | tiède | le mur de l'année : l'aiguille est le bord droit d'un mur de 3 636 bouteilles (coût 9 017,28 / reste 9 162,72) ; une rangée = un brassin | l'année allumée, mur à 4,50 et 6,00 en pointillé |
| c6c | Prix | tiède | la règle à calcul : réglette du reste, zéro posé sur le coût ; le chiffre de tête coupé en deux est la bascule ; 75 cl et fût en petites règles | réglette par an |
| c6d | Prix | chaude | le compteur : la règle courbée en cadran, vraie aiguille, chiffre et bascule au pivot | couronne par an |
| e3a | Rangement | froide | e1b tel quel, chaque marche avec l'image de l'écran choisi (c3a, p2b, c4a, c5b, c5a) | brassin planifié : « ? », ≥/≤, Prévisions 57,42 + 6,84 |
| e3b | Rangement | tiède | les six marches en une cascade sur une seule échelle | liste des brassins, une cascade par fiche ; impôt de l'an 13,68 |
| e3c | Rangement | chaude | la bouteille tranchée à l'échelle de son prix, marches en étiquettes, caisse de 81 | 75 cl : verre « ? » hachuré |

Corrections tenues : 7,51 CHF/L seul en tête (6,37 dit « bière seule ») ; grille 5,00 · 10,00 · 160,00 exemple ; trois notions (payé 0,83 · à payer 2,38 · année 4,30) ; 27 L nets ; « si 1 200 L en 33 cl · estimé » sous chaque annuel ; inconnu = « ? », hachures, ≥/≤ ; 57,42 avant le brassage + 6,84 à la sortie de cave (critique, incohérence 6) ; impôt de l'an 13,68 pour deux brassins (rejet d'e2c) ; 1280 dessiné pour chaque concept (incohérence 7), plus de planche de deux 390 en tête.

## Sorties décisives
- `verifier-page.mjs --min-images 0` ×7 : PAGE OK (390 px, sans erreur). `cap-c4.mjs` : 1280 débord 0 ×7, erreurs 0, texte < 12 px : 0.
- `mots-premier-ecran.mjs … --max=60` : c6a 57 · c6b 43 · c6c 55 · c6d 51 · e3a 60 · e3b 57 · e3c 45 → MOTS OK (premiers passages : c6a 61, e3a 78, e3b 68, corrigés).
- `controle-commun.mjs p4 … --profil=sans-houblons --sans=mots` : COMMUN OK (premiers passages : contraste c6a 5, c6b 4, c6c 5, c6d 2, e3a 4, e3b 6, e3c 5 ; rayons c6a ; tous corrigés).
- `controle-panel.mjs` (7 `-haut.png`) : remplissage médian 0,66, 0 sous 0,50, ressemblance 0,88, 0/21 paires → PANEL OK.
- `type="number"` : 0 ; IBAN : 0.

## Captures (ouvertes)
`p4/c6a/c6a-haut.png`, `c6a-etat2.png`, `c6a-1280.png` ; `p4/c6b/c6b-haut.png`, `c6b-etat2.png`, `c6b-1280.png` ; `p4/c6c/c6c-haut.png`, `c6c-etat2.png`, `c6c-1280.png` ; `p4/c6d/c6d-haut.png`, `c6d-etat2.png`, `c6d-1280.png` ; `p4/e3a/e3a-haut.png`, `e3a-etat2.png` ; `p4/e3b/e3b-haut.png`, `e3b-etat2.png`, `e3b-1280.png` ; `p4/e3c/e3c-haut.png`, `e3c-etat2.png`. Pas rouvertes après la dernière retouche : `e3a-1280.png`, `e3c-1280.png`, `c6b-haut.png` (hauteur de tête refaite, vue en état 2), `e3c-etat2.png` (carte 3 refaite), les `-page.png` (débord 0 mesuré).

## Prédiction
Pour le prix, il prendra c6a (« c'est c5b, et la règle est de retour ») ou c6c s'il aime l'objet ; pour le rangement, e3a (« c'est e1b, en mieux ») avec la liste de e3b en greffe.

DÉCISION À PRENDRE : l'impôt bière reste au taux plein 25,32 CHF/hl (6,84 par brassin, comme c3a choisi) ; la réduction petit brasseur (critique, incohérence 1) et le volume 27 L contre 26,6 L (p2b) restent à trancher au port, un seul chiffre partout.
CONNAISSANCE : le reste annuel est une aire : (prix − coût) × bouteilles ; à volume fixe, c'est une largeur sur la règle du prix fois une hauteur constante (c6b). Une 75 cl coûte au moins 4,97 (bière 4,78 + impôt 0,19), son verre est inconnu.
LEÇON PROPOSÉE : aucune.
