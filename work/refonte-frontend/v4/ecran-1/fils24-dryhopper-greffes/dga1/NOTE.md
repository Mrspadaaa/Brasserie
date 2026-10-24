# dga1 — « La frise sous le pouce »

**Chaleur : froide.** **Greffe : `data-greffe="frise-y1b"`**, sur la bande de la frise (`#dga1-dock`).

**Base** : l'écran Dryhopper de la maquette jouable, chargé tel quel (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`,
React, moteur en direct). Ses mots : « Pour le dryhopping, la meilleure version est celle de l'app jouable mais il lui faut
quelques améliorations ». Rien n'est recopié : la page charge `assets/parcours.js`, puis pose la greffe (`../dga1/socle-dga.mjs`).

## L'idée, une seule
La frise de y1b (« Une frise de ce type est vraiment intéressant aussi, un peu à retravailler »), posée en bas, sous le
pouce, entre les barres et le pied. Retravaillée :
- **calée au pixel sous le graphique** : le jeton « ● Idaho 7 · actif 2 j » tombe à l'aplomb du trait du doigt (y1b n'avait
  pas de graphique au-dessus) ;
- **les minutes et les jours écrits sous leurs crans** (60′ 45′ 30′ 15′ 0′ · WP · 1 2 3 5 7 · 2 3 5 7), les crans épais là
  où le moteur a simulé, fins là où il interpole ; l'actif en bleu (la levure travaille) ;
- **les jours de contact sont des crans de la frise** : la rangée « 1 j 2 j 3 j 7 j » de la maquette s'y fond, 5 j compris ;
  « sans gain » de la maquette (pointillés) devient un chiffre gris souligné en pointillé ;
- **la loupe de la maquette** (cinq cases à 70 px : moment, barre de floral, valeur ou « sans gain ») s'ouvre au-dessus de la
  frise pendant le geste.

## Comment elle tient la base
Le vrai rail de la maquette reste l'état (retiré de l'écran, pas du DOM) : la frise le pilote aux flèches, comme un
utilisateur. Courbes, aire du floral, quatre chiffres, « contre ★ », barres, mesure, pont Levure : ceux de la maquette,
recalculés par son moteur à chaque cran. Les floraux de la loupe sont lus sur le bandeau de la maquette, cran par cran,
au chargement (24 crans).

## Ce qui tient
- Le geste se fait au pouce, en bas, et tout le haut répond (trait, anneaux, bandeau, barres, « contre ★ ») ; joué : actif
  2 j → whirlpool → 20′ (≈+11, IBU ~121 orangé), loupe ouverte (`captures/dga1-geste.png`), doigt levé (`dga1-apres.png`).
- Les boutons d'étape de la maquette restent vivants, la frise suit (ébullition → 60′, vérifié).
- Hauteur : 1 écran (844 px), comme sa base.

## Ce qui casse
- Les crans de l'actif et de l'après se touchent (≈ 10 px) : « après 1 j » n'est écrit que quand on y est.
- La frise prend 66 px contre 74 pour le rail et les jours qu'elle remplace : quand « contre ★ » s'affiche, la page
  défile de quelques px (comme sa base).
- Mots : 126 au premier écran (sa base : 106) ; hors données 43 (sa base : 41). Les mots ajoutés sont des minutes et des
  jours : des données.

## Contrôles (sorties recopiées)
Voir `RESULTAT.md` de la voie ; même série de commandes pour les quatre variantes.
