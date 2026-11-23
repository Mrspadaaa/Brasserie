OK — série z : huit concepts chauds pour la liste de la fiche, baseline tenue, PANEL OK

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flz1..flz8/etat.html` et `NOTE.md` (chaleur, idée, ce qui tient,
  ce qui casse, sorties des contrôles)
- `flz1/generer-flz.mjs` (générateur des huit pages, données lues dans pack-fiches.json et style-bands.json) ;
  `flz1/capturer-flz.mjs` (captures)
- `fils24-fiche-liste/captures/flz<n>-premier-ecran.png`, `flz<n>-page.png` ; états : `flz3-range.png` (un mot
  rangé par le brasseur), `flz6-tropicaux.png` (loupe déplacée), `flz4-fiche-courte.png` (appui long sur un cousin)

## Les huit concepts (une ligne chacun)
- flz1 — chaleur chaude — **Hors du dessin** (Nelson Sauvin) : le radar dessine 2 mots ; les 5 idées sans famille
  deviennent le premier plan, en aplat dans la couleur du houblon, avec leur n/N. Tient : Nelson n'est plus ordinaire,
  rien d'inventé. Casse : peu de matière sur un houblon bien décrit ; un aplat de couleur sur page blanche.
- flz2 — chaleur chaude — **Le radar des mots** (Nelson Sauvin) : un second radar dont les axes sont ses mots, rayon =
  fiches qui le citent. Tient : forme pleine contre forme vide, en une image. Casse : deux radars ; rayon pris pour une force.
- flz3 — chaleur chaude — **À toi de ranger** (Nelson Sauvin) : les mots sans famille en jetons, les 12 familles en
  cibles ; posé, le mot prend la famille en « ~ toi » pointillé sur le radar. Tient : le brasseur corrige le lexique
  lui-même, hypothèse distincte des fiches. Casse : rayon « ~ » à mi-hauteur par convention ; bac vide sans orphelins.
- flz4 — chaleur chaude — **Par ses cousins** (Cascade) : chaque mot avec les houblons du pack qui le disent aussi, les
  rares en tête ; appui long sur un cousin → sa fiche courte. Tient : situe un mot par des houblons connus, rareté
  comptée « sur 32 ». Casse : 32 houblons seulement ; page longue.
- flz5 — chaleur chaude — **Dans ta stout** (Nugget) : les mots rangés face à la 16D d'après le BJCP : à sa place /
  ressort / sans famille ; en absolu, une seule liste. Tient : la question « pour ma stout » mot à mot, citation à
  l'appui. Casse : « ressort » peut se lire comme un défaut.
- flz6 — chaleur chaude — **La loupe sur l'axe** (Motueka) : pas de liste ; une loupe lit l'axe touché (famille, fiches,
  mots) ; mojito au centre, ruban des 12 pictos. Tient : les mots sans quitter le radar, Motueka pas gonflé. Casse : un
  toucher pour les autres axes ; la loupe cache une étiquette.
- flz7 — chaleur chaude — **Dans l'ordre du nez** (Citra cryo) : les 9 mots dans l'ordre de la fiche, en escalier
  numéroté, le mot sans famille à sa marche. Tient : « pas d'intensité, un ordre », écrit. Casse : la contremarche se lit
  comme une barre ; deux fiches demanderaient deux escaliers.
- flz8 — chaleur chaude — **Une idée, pas trois mots** (Motueka) : brut à gauche (anglais barré), idée française à
  droite avec ×n ; 12 mots → 8 idées, phrase finale « agrumes, surtout ». Tient : montre d'où venait « ultra fruité ».
  Casse : colonne brute encombrante ; phrase écrite à la main.

Chaleurs : 8 chaudes, 0 tiède, 0 froide (contrat de la voie). Ses exemples (la liste p22) : 0 concept sur 8 les reprend.

## Critères
- G1 : voir ci-dessous (SERIE-BIEN-8).
- G2 : `controle-commun … --sans=mots` : voir ci-dessous (COMMUN OK).
- G3 : cette note contient flz1…flz8 et « chaleur ».
- Panel (M14) : `controle-panel.mjs` sur les 8 premiers écrans : voir ci-dessous (PANEL OK).
- Indicatifs, joués une fois, sorties recopiées dans chaque NOTE : une-question, sans-famille, mots-premier-ecran.

## Sorties décisives
- G1 : `SERIE-BIEN-8`.
- G2 : `controle-commun … --page=etat.html --sans=mots` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste,
  fiche, standard, trait, legende, parlant, brutes : tous OK).
- G3 : `NOTE OK`.
- Panel : `8 captures · remplissage médian 0,64, 0 sous 0,50 · ressemblance moyenne 0,86 · paires presque identiques
  0/28 (0 %)` → `PANEL OK` (lot 21 : 0,62 et 0,88).
- Indicatifs (sorties dans chaque NOTE, sans chercher à les faire passer) : UNE-QUESTION ECHEC 24 (une fiche n'a ni
  titre-question ni facteur libre : contrôle d'écran d'outil, hors portée d'une fiche) ; SANS-FAMILLE ECHEC 3 (flz3 ✓ ;
  flz1 et flz2 dessinent la part « autres » en barre grise nommée, non reconnue par le contrôle ; flz4 : Hallertau
  Blanc n'est qu'un nom de cousin) ; MOTS hors données 65 à 117 (flz7 65, flz3 72, flz1 80 ; flz2 117, flz4 106,
  flz8 102 : les trois les plus bavards, à serrer en passe 2) ; bruts 96 à 182 (> 80, comme la fiche g1 de Citra cryo
  approuvée à 84).
- `git status --short` : rien de la voie hors de ses dossiers (les fichiers `prototypes/…` et `pistes-l5f.png` sont
  d'autres voies, antérieurs).

## Prédiction de la réaction du brasseur
« flz1 et flz3 : ça, c'est Nelson Sauvin ; la loupe (flz6) est pas mal mais il faut toucher ; flz8 explique bien
Motueka mais trop de texte à gauche ; flz5 pour ma stout, très bien, à mélanger avec flz1. »

DÉCISION À PRENDRE : aucune dans le contrat ; deux choix de goût à montrer en variantes plutôt qu'à trancher :
(1) la couleur propre au houblon sur la fiche (flz1, flz2, flz3, flz6, flz8), comme dans Comparer, ou le noir de g1 ;
(2) le rayon « ~ toi » de flz3 à mi-hauteur ou au niveau que le brasseur choisit.

CONNAISSANCE : le contrôle de panel ignore les fonds #f5f5f5 (écart < 60 au fond) et voit surtout la masse tonale : un
panel de pages blanches à texte fin se ressemble à 0,93 quelle que soit la composition ; il faut une masse (aplat,
bloc sombre, radar plein) placée à un endroit différent par concept pour passer sous 0,90.

LEÇON PROPOSÉE : un voile de fermeture (`fermer-fiche`) sous le doigt reçoit le `click` synthétisé à la fin d'un appui
long et referme la fiche aussitôt ouverte ; tout appui long qui ouvre une feuille doit ignorer le click qui le suit
(fenêtre de 600 ms) — aucun contrôle ne le voyait avant FICHE ECHEC × 8.
