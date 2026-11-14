ECHEC — PANEL (remplissage des fiches sous 0,50) ; 12 images, 4 NOTE, COMMUN OK

REPRISE : arrêt à 200 k (hook). Fait, preuves et reste ci-dessous.

## Fichiers écrits
- `M/v0/r/_src/build.mjs` (coquille commune, split/join, L26), `_src/rq1..rq4.html` (fragments), `_src/planche.mjs` (planche des 12).
- `M/v0/r/rq{1,2,3,4}/etat.html`, `NOTE.md`, captures `rqN-repos-390.png`, `rqN-geste-390.png`, `rqN-repos-cave-390.png`.
- Reconstruire : `node M/v0/r/_src/build.mjs rq1 rq2 rq3 rq4 && node M/socle/capt.mjs v0/r repos,geste rq1 rq2 rq3 rq4`.

## Critères
- G1 : rejoué avant les NOTE → `SERIE ECHEC rq1-NOTE…` ; les quatre NOTE sont écrites depuis : à rejouer (attendu SERIE OK).
- controle-commun `--page=etat.html --sans=mots --profil=sans-houblons` : **COMMUN OK** (dernière passe ; contraste et rayons corrigés).
- mots-premier-ecran `--profil=sans-houblons --sans-lignes --max=60` : rq1 54, rq2 23, rq3 33, rq4 27 → **MOTS OK**.
- controle-panel sur les 12 : ressemblance 0,55, 0 paire identique ; **REMPLISSAGE ECHEC** : médiane 0,54 (< 0,55), 4 sous 0,50
  (les 4 gestes : rq4 0,33, rq1 0,37, rq3 0,38, rq2 0,40). Les fiches ont des blancs entre sections.
- controle-choix : Stocks › Matériel absent d'`ecrans.json` (aucun choix du brasseur sur cet écran) ; rien à reprendre.
- Tests : sans objet (maquettes statiques).

## Captures (toutes ouvertes en planche avant la dernière passe ; la dernière passe n'a pas été rouverte)
`M/v0/r/rq1/…`, `rq2/…`, `rq3/…`, `rq4/…` (3 chacune) ; planche `M/v0/r/_src/planche.png`.
Corrigé à la dernière passe, non revu à l'œil : libellés sous la jauge de la fiche rq1, frise rq3 (4 couloirs), pictos et badges des
tuiles rq4 (picto à gauche), « Enregistrer » sur une ligne (rq2, rq4), rayons 10/16 px, fond des barres rq1 à 11 %.

## DEMANDE EXECUTANT
1. `node M/v0/r/_src/planche.mjs rq1 rq2 rq3 rq4` puis ouvrir `M/v0/r/_src/planche.png` : chevauchements, texte coupé.
2. Rejouer G1 (GATES.md) → `SERIE OK`.
Puis un concepteur neuf : densifier les quatre fiches (geste) pour PANEL OK (remplissage ≥ 0,50 : moins de blancs entre sections).

Prédiction : « Là je vois enfin quoi faire et quand ; l'étagère rq4 me parle, rq1 ressemble à mes Articles. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un concepteur qui ouvre ses captures en planche (une image pour 12) tient son budget ; une image par capture l'épuise avant la fin.
