OK — quatre mini maquettes dgb : trois plans de w2 greffés sur Dryhopper jouable

## Fichiers écrits
Dossier `work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/` :
- `dgb1/` (froide, « Trois plans en bandeau ») : `etat.html`, `generer.mjs`, `NOTE.md`, `socle-dgb.mjs` (socle commun de la série) ;
- `dgb2/` (tiède, « Les trois plans sur les 12 familles »), `dgb3/` (tiède, « Trois épingles sur le rail »), `dgb4/` (chaude,
  « Trois verres ») : `etat.html`, `generer.mjs`, `NOTE.md` chacun ;
- `captures/dgb1.png`, `dgb1-geste.png`, `dgb2.png`, `dgb2-geste.png`, `dgb2-barres.png`, `dgb3.png`, `dgb3-geste.png`,
  `dgb4.png`, `dgb4-geste.png` (390 × 844, DPR 2, toutes ouvertes).
Scripts de capture et de mesure dans `os.tmpdir()/dgb/`. Aucun fichier écrit hors de la voie (`git status` vérifié).

## Base (recalée en cours de voie)
J'avais commencé sur la page p4b2f ; quand le message du pilote est arrivé, j'ai tout refait sur l'écran Dryhopper de la
maquette jouable (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`, « la meilleure version est celle de l'app
jouable »). Chaque variante charge le même bundle, sur la même route : l'écran se joue tel quel, et la greffe y ajoute ses
éléments sans rien retirer. Un seul facteur libre, le moment : Sage = 0′, Franc = actif · 2 j (★), Osé = après · 3 j, avec la
même dose et la même levure. Aucun chiffre n'est recopié : au chargement, la greffe pose le rail sur chaque plan, lit ce
qu'affiche le moteur, puis revient sur ★.

## Critères
- G1 `variantes.mjs dgb1 dgb2 dgb3 dgb4` → **VARIANTES-BIEN-4**
- G2 `controle-pictos-trait … dgb1 dgb2 dgb3 dgb4 --page=etat.html` → **TRAIT OK** (26, 17, 23 et 26 pictos, 0 faute)
- Joués en plus, recopiés dans chaque NOTE :
  - `controle-commun --sans=mots` → COMMUN OK ;
  - `controle-une-question` → UNE-QUESTION OK (1 groupe libre : moment) ;
  - `mots-premier-ecran --max=80 --sans-donnees` → MOTS OK ;
  - `controle-panel` → PANEL OK (médiane 0,74 ; ressemblance 0,90, à la limite ; 0/6 paires presque identiques).
- `controle-choix --ecran=dryhopper`, joué sur une copie de chaque page en route `dryhopper` : la base seule est CHOIX OK.
  Les quatre variantes ont 20 états sur 21 OK. Le seul échec est `etat-dryh-repos` : 127, 115, 117 et 114 mots au premier
  écran, pour 96 au plus. La base en compte exactement 96 : tout chiffre ajouté au premier écran dépasse le plafond.

## Prédiction
« dgb2, les S F O sous chaque barre, c'est vraiment intéressant pour voir ce que coûte Osé en résineux, mais ça allonge les
barres ; dgb4, les verres, ça donne vraiment bien. »

DÉCISION À PRENDRE : le plafond de 96 mots de l'état `etat-dryh-repos`, dans `choix/etats/dryhopper.json`, est atteint par
la base seule. Toute greffe chiffrée le dépasse. Faut-il le relever pour une greffe retenue, ou la greffe doit-elle prendre
des mots à l'écran ? En v0, j'ai suivi `--sans=mots`.

CONNAISSANCE : on peut greffer une mini maquette sur un écran de la maquette jouable sans toucher au bundle. La page
recharge `assets/parcours.js` sur la même route, puis un script attend l'écran. Il pose le rail par ses touches, un cran par
rendu (deux touches envoyées dans le même rendu ne font qu'un cran). Il attend que le rail se stabilise : l'écran s'ouvre
sur 16, puis passe à ★ = 15. Enfin, il remet en place tout élément qu'un rendu React détache. Pour styler une ligne de
React, utiliser `:has()` plutôt qu'une classe ajoutée : React réécrit `className` à chaque rendu.

LEÇON PROPOSÉE : aucune
