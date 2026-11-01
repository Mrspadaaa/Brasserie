# r4b — la balance, passe 2 (Malts/sucres 2/7, 31.10)

OK — r4b : plateau noir réduit d'un tiers, collé au pied ; ligne active cernée ; « ? » sur place ; remplissage 0,47

**Choix du pilote (31.10)** : il retient l'autre option du critique, le plateau **noir** réduit d'un tiers (lecture de 40 px,
règle de 36 px), qui reste plus proche de r4 et remplit l'écran. Il écarte le plateau clair. Tout le reste de r4b est gardé. La
correction 1 ci-dessous décrivait d'abord le plateau clair ; elle est remplacée par la section « Plateau noir » plus bas.

- **Base** : `v0/r4/etat.html`, non modifié. Même concept : ticket de pesée, plateau sous le pouce, lecture tapable, − +,
  règle qui défile sous l'aiguille, ajout qui arrive sur le plateau à 0.
- **Chaleur** : chaude (passe 2 de la chaude r4).

## Les 3 corrections du critique (`critique/SYNTHESE.md`, § r4)
1. **Le plateau ne pèse plus plus que le ticket.** Il passe en clair (fond blanc, cerne de 1 px) et il est réduit d'un tiers : lecture de 40 px (au lieu de 48 à 56), règle de 36 px (au lieu de 44 à 64), − + de 28 px. Hauteur au repos : 121 px pour le plateau et 160 px pour le ticket (`r4b-haut.png`).
2. **La ligne active se voit sans chercher.** Elle porte un cerne de 2 px, un fond voilé à la teinte de son malt (gris tant que la couleur manque) et une encoche vers le plateau (`r4b-couleurs.png`, `r4b-huit.png`). Le plateau est collé au pied, juste au-dessus : à 8 lignes, il est en 642–763 px, dans le premier écran, et il ne passe pas sous le + (782–830 px). Pour gagner la place, la rangée des sacs se replie quand elle est vide.
3. **Le « ? » du plateau ouvre la couleur sur place.** Un toucher le change en champ EBC, à côté du nom ; on tape 3,5 puis Entrée, et la pastille, le fond de la ligne, sa barre et la barre de composition se teintent (`r4b-geste-couleur-ouvert.png`, `r4b-geste-couleur.png`).

## Greffes
- **r2** : la barre de composition, 8 px de haut, sous le bandeau. Elle est hachurée pour une couleur inconnue et pointillée pour un sucre.
- **u4** : les habituels en sacs dessinés. La toile reste blanche tant que la couleur n'est pas connue ; un sucre porte un cube.
- **u2** : on tape « munch 0,25 » et l'aperçu « Münchner 0,25 kg ⏎ » s'affiche avant Entrée. Entrée ajoute la ligne avec sa masse, et le focus revient au champ. On peut aussi taper le nom seul : Entrée, puis la masse sur le plateau (`r4b-clavier-*.png`). La recherche ignore les accents (« munch » trouve « Münchner »).
- **z4** : en fermentation, le plateau ajoute une règle des jours, de J0 à J14, avec un curseur et « J+3 » tapable (`r4b-fruit.png`).

## Acquis de la baseline (cochés)
- [x] Éléments communs de r4-a : l'en-tête « ‹ Fermentescibles 2/7 » avec l'import et le thème, le fil (Malts/sucres courant), le bandeau, le pied « Retour · Suivant — Houblons » et le +.
- [x] La ligne : nom, moment (tons de l'app), part et masse.
- [x] Les 5 familles, avec « Grain ⇄ » qui tourne.
- [x] La famille figée sur la ligne, en étiquette.
- [x] La masse à 0 à l'ajout, en ocre.
- [x] Le jour d'ajout en fermentation.
- [x] Les avertissements du lactose (`#huit`) et de la densité (annexe).
- [x] Le parcours au clavier : nom, Entrée, masse, Entrée.

## Honnêteté
- Sa recette : 3 grains, couleurs « ? », EBC « — », OG « — », IBU 24.
- `#couleurs` : 3,5, 4 et 2 EBC, soit 7,3 EBC par Morey sur 30 L. `#sucre` : dextrose 0,4 kg à l'ébullition.
- Le rendement « 75 % repère » est replié. Le stock est un stock de démonstration (des noms, sans couleur).

## Contrôles (31.10, `--profil=sans-houblons`)
- `verifier-page.mjs` : PAGE OK.
- `mots-premier-ecran --max=80` : 72 mots, MOTS OK.
- `controle-commun` : COMMUN ECHEC, 1 contrôle.
  - **couleurs ECHEC** : 1 teinte franche, l'ocre. C'est l'écart voulu de la v0 : sa recette n'a aucune couleur connue (J7).
  - mots, survol, blocs, contraste, standard, parlant et brutes : OK.
- `controle-contraste` : CONTRASTE OK, pire 4,85:1.
- `controle-panel` :
  - sur les quatre états de r4b : PANEL ECHEC, ce qui est attendu, car les quatre captures montrent un même concept (ressemblance 0,95) ;
  - (plateau clair, remplacé par le noir) r4b-haut à 0,42 ; r4 à 0,53.
- `type="number"` : 0.
- `capturer.mjs` : CAPTURES OK. À 8 lignes, la page fait 0,96 écran. Aucune valeur brute ; les gestes couleur et clavier sont vérifiés.

## Captures (ouvertes)
- 390 px : `r4b-haut.png` (repos), `r4b-page.png`, `r4b-couleurs.png`, `r4b-sucre.png`, `r4b-huit.png`, `r4b-fruit.png`, `r4b-vide.png`.
- Gestes : `r4b-geste-couleur-ouvert.png`, `r4b-geste-couleur.png`, `r4b-clavier-nom.png`, `r4b-clavier-masse.png`, `r4b-clavier-fin.png`, `r4b-clavier-apercu.png`.
- 1280 px : `r4b-ordinateur.png` (repos), `r4b-ordinateur-sucre.png`.

## Ce qui casse encore
- Avec 3 grains, le remplissage tombe à 0,42. Il faut choisir entre « plateau clair » (correction 1) et la densité. L'autre voie du critique (plateau sombre réduit d'un tiers) garderait environ 0,55.
- Dans le ticket, une ligne longue (« Purée de mangue », Fruit, fermentation J+3) tronque son nom.

## Boosters UX
- balance et regle-defilante : ajuster la masse (glisser ou taper).
- ticket-selection : choisir la ligne.
- teinte-plateau et teinte-pastille : saisir la couleur sur place.
- regle-jours : ajuster le jour.
- barre-composition : lire la composition.
- sacs-habituels et ajout-clavier : déclencher un ajout.
- moment-cycle et familles : choisir.
- Grille B :
  - OK : B1, B2 (le plateau, sans dominer le ticket), B3 (72 mots), B4, B6, B7, B8, B10, B12, B13 ;
  - partiel : B9 ;
  - non mesuré : B5 ;
  - B11 : « Je pèse le Pilsner, 5 kg ; trois couleurs à dire. »

## Plateau noir, réduit d'un tiers (choix du pilote, 31.10) : captures et contrôles rejoués
- Le plateau est noir comme dans r4, réduit d'un tiers : lecture de 40 px, règle de 36 px, − + de 28 px, 121 px de haut au repos.
  Tout le reste de r4b est gardé : ligne active cernée, plateau collé au pied, « ? » sur place, greffes.
  Sur le noir, le « ? » est en tirets ocre clair ; la masse à 0 de l'ajout s'affiche en or.
- Captures refaites et ouvertes :
  - `r4b-haut.png` (390, repos) ;
  - `r4b-ordinateur.png` (1280, repos) ;
  - `r4b-huit.png` (8 lignes : 0,96 écran, plateau en 642–763 px, hors du + en 782–830 px) ;
  - les autres états et gestes, refaits avec le même script (`capturer.mjs` : CAPTURES OK, sans erreur).
- `verifier-page.mjs` : PAGE OK.
- `controle-commun --profil=sans-houblons` : **COMMUN ECHEC 1 contrôle**.
  - couleurs ECHEC : 1 teinte franche (38°), il en faut 3. Écart voulu : aucune couleur n'est connue dans sa recette (J7).
  - mots, survol, blocs, contraste, standard, parlant et brutes : OK.
- `controle-panel` :
  - r4b-haut avec r4-haut : **PANEL ECHEC**. Médiane 0,50 ; **r4b-haut à 0,47**, contre 0,42 avec le plateau clair et 0,53 pour r4 ;
    ressemblance 0,90 ; aucune paire presque identique.
  - r4b-haut avec r4b-huit : PANEL ECHEC (0,47 et 0,50).
  - Avec 3 grains, il reste environ 220 px vides sous le pied : le plateau réduit rend un tiers de la hauteur de r4.
