OK — controle-etats.mjs rejoue 103 états choisis (10 voulus) : ETATS OK sur ses maquettes, ECHEC sur 5345f6ad, CHOIX ECHEC

Voie p24, 24.10. Plafond de tours atteint : G2 à G6 rejoués une fois chacun en fin de voie, tous tenus.

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs` (nouveau).
- `work/refonte-frontend/v4/choix/etats/{etape,biere,fiche,suggerer,comparer,acquis}.json` : ajout de `voulu` et (états non voulus) `verif` ; vérifié : le contenu ancien est identique à HEAD une fois ces deux clés retirées.
- `work/refonte-frontend/v4/choix/ecrans.json` : lignes `controles` seulement (`controle-etats.mjs {dossier} --ecran=etape|biere|suggerer|comparer|fiche` ; sur l'étape Houblons aussi `controle-fonctions-rail.mjs {dossier}` et `controle-geste-etape.mjs {dossier} --froid`, les deux fichiers existent). Les acquis se rejouent sur leur écran (`verif.route`), via `--ecran=acquis` (non branché : pas d'écran « acquis » au registre).
- Scripts de travail (spec des états, sondes) : `%TEMP%\p24\`.

## Critères (sorties décisives)
- G1 : `VERIF-BIEN-103` (113 états, 10 voulus, 103 avec `verif` complète).
- G2 : `node controle-etats.mjs --choisie` → `ETATS OK (103/103) ; 10 voulu(s) non rejoué(s) sur ses maquettes choisies` (160 s).
- G3 : `ECHOUE OK (ETATS ECHEC, code 1)` sur 5345f6ad : les 103 états échouent, car la maquette ne pose aucun `data-etat` (le contrat n'existe pas encore).
- G4 : `ECHOUE OK (CHOIX ECHEC, code 1)` : le registre échoue désormais sur 5345f6ad (il passait).
- G5 : `REGISTRE OK (8 écrans)`. G6 : `CABLAGE OK`.
- Essais : G2 4 passages (échecs corrigés : redessin de nœud après un toucher, valeur de champ absente de l'empreinte, couleurs, `avant` récursif) ; G3 à G6 1er essai.

## États voulus (10, non rejoués)
`etape-levure` (écran Levure ouvert, D123), `etape-entete` (D116), `biere-onglet-suggestions` (q2b), `biere-onglet-comparer` (D107), `sugg-croix`, `comp-croix`, `acquis-croix-retour` (D109 : leurs pages statiques ne jouent pas le retour), `sugg-legende` (D113), `acquis-maniere-w2` (r6a ne la reprend pas), et **`sugg-levure` = D35** (décision du pilote : le groupe « Changer de levure » ne revient pas dans Suggérer, L10). Conséquence : `acquis-levure-bio-cumul` n'attend plus la levure, seulement « creep » et « Biotransformation » (D35 en note). La règle « ‹ visée | visée › » (D91) ne figure dans aucun `attendu` (vérifié). Aucun `attendu` ne porte un décompte (« 6 au style · 5 non situées », rôle « mixte »/« double ») ; le champ « Ajouter » n'attend que « cit » et « catalogue » (pas de filtre au stock).

## Contrat posé pour les concepteurs
L'élément déclencheur de chaque état porte `data-etat="<id>"` (pour un état « repos », l'élément qui le montre ; pour `fiche-fermer-fond`, le fond `.f-voile`, touché au point (195, 40)). La page jouée est `<dossier>/<route>/etat.html` (ou `verif.page_construite` : `cas-k2.html`, `cas-k3.html`). Les `avant` (ouvrir la ligne avant « + ») se jouent dans l'ordre sur les mêmes `data-etat`.

## Mesure sur 5345f6ad (diagnostic `--repli`, hors critères)
`--repli` rejoue, faute de `data-etat`, le sélecteur relevé par p21a/p21b : 86 des 103 états échouent encore, 17 passent. Pertes réelles lues : pas de dose 1 g au lieu de 2 g (`dose-plus`, `dose-moins`) ; whirlpool « WP » sans « 80 °C » ni « 20 min » ; froid sans « J+3 », « aucun IBU », biotransformation, avec « ? IBU » ; cœur sans « exclure » ; tableau pas senti · faible · moyen · marqué absent (radar, absolu) ; plus de « Autres directions », de « Effet prévu » ; page cas-k2 absente ; panel OSU sans Brülosophy ni « retenu par les auteurs » ; appui long sans effet à 800 ms. Beaucoup d'autres échecs viennent du seul contrat absent (non distinguables sans `data-etat`).

## Doutes et limites
- Le contrôle ne lit que du texte et des libellés accessibles (aria-label, title), plus trois mesures (`couleurs_min`, `fond`, `max_mots`). Une perte purement graphique (barre l5b sur l'axe central, axe, forme d'un picto) n'est vue que par son texte voisin : à doubler par les captures côte à côte (L12).
- Pages choisies statiques : q2b, r6a, r6n2 ne jouent pas le retour ni la fiche ; le mode Radar de Suggérer est mesuré sur `suggestions-radar.html` (v4.10, validée m4/h4) et l'appui long de Comparer sur la fiche g1 de `index.html` (D25). Chaque cas porte une `note`.
- `fiche-appui-en-cours` : p21a notait la fiche ouverte à 420 ms ; en rejeu elle s'ouvre entre 450 et 600 ms (l'état est joué doigt posé 800 ms). Écart de relevé à connaître (D112).
- Le Bash du poste supprime les barres obliques inverses des scripts passés en entrée standard (trois regex cassées, corrigées par l'outil d'édition ; `cablage` OK).
- Durée : 160 s pour `--choisie` (4 pages à la fois).

DÉCISION À PRENDRE : `acquis-maniere-w2` est marqué voulu faute de maquette choisie qui la porte (r6a ne la reprend pas). Options : (a) la laisser voulue ; (b) lui faire choisir la manière w2 (variantes, L24). Recommandation : (b) à l'entonnoir suivant ; en attendant (a).

CONNAISSANCE : un contrôle d'états se prouve par trois témoins : ses maquettes choisies (ETATS OK), la maquette perdante (ECHEC) et le diagnostic `--repli` qui sépare la perte réelle du contrat non posé. Tout sélecteur d'un état vient d'une page jouée, jamais d'un nom deviné.

LEÇON PROPOSÉE : un script passé au shell par entrée standard perd ses barres obliques inverses ; écrire les fichiers avec l'outil Write ou Edit et relancer `node --check` (renforce M10).
