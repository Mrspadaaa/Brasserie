OK — u2b : « pils 5 » gardé, 4 greffes, 3 corrections ; COMMUN OK, PANEL ECHEC remplissage 0,46

## Fichiers écrits (tous sous `v1/u2b/`, `v0/u2` intact)
`etat.html`, `NOTE.md`, `capturer.mjs`, `cap-*.png` (15), `verif-haut.png`, `verif-page.png`, sorties `captures.txt`, `commun.txt`,
`mots.txt`, `contraste.txt`, `panel.txt`.

## Sorties décisives (`--profil=sans-houblons`)
- `controle-commun v1 u2b --page=etat.html` : COMMUN OK (STANDARD ECHEC au premier essai : trait de 2,1 px des sacs, corrigé).
- `mots-premier-ecran --max=80` : 57 mots, MOTS OK. `controle-contraste` : CONTRASTE OK, pire 5,27:1. `verifier-page` : PAGE OK.
- `controle-panel` (repos, couleurs, sucre, 8 grains) : PANEL ECHEC. Le remplissage médian est de 0,46 (v0/u2 : 0,42). Le bas reste
  vide sous le pied, parce que sa recette n'a que 3 malts. La ressemblance vaut 0,96, mais ce sont quatre états du même écran.
- Clavier : `pils 5` + Entrée sur la recette vide donne Grain 5 kg ; avec `weizen 1,5` et `hafer 1,5`, on retrouve 8 kg, sa recette.
  `pale` + Entrée met le focus sur la masse de Pale Ale Malz, puis `0,5` + Entrée le rend au champ.
- Couleurs : la marque ouvre la première couleur, puis on tape 3,5 · 4 · 2, chacune suivie d'Entrée → EBC 7,3.
- Hauteur avec 8 grains : 0,98 écran (D5). Aucune erreur de script. 0 `type="number"`.

## Captures à ouvrir
`cap-recette.png`, `cap-1280.png`, `cap-huit.png`, `cap-couleurs.png`, `cap-sucre.png`, `cap-premiere-lettre.png`,
`cap-clavier-pendant.png`, `cap-clavier-apres.png`, `cap-couleur-pendant.png`, `cap-couleur-apres.png`.

## Prédiction
« Taper pils 5 et c'est posé, et je vois tout de suite ce qui manque. Les sacs en haut, j'aime bien. »

DÉCISION À PRENDRE : 1) le PANEL bloque-t-il une candidate à 3 malts ? Combler le bas sans donnée irait contre « pas de cockpit » ;
proposition : juger le remplissage sur l'état à 8 grains (0,98 écran, plein). 2) La part d'un sucre se compte sur le grain (5 %),
comme le code ; décision ouverte, à trancher au port.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : `controle-panel` sur une seule candidate et ses états mesure une diversité qui n'a pas de sens ; pour une passe 2,
ne garder que le remplissage.
