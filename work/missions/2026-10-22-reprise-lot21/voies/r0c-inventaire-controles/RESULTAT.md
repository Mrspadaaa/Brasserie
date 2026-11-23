OK — inventaire de 37 éléments notés (y1b d'abord), contrôle D104 et option --ter (D101 ter)

## Fichiers écrits (tous dans « Possède »)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` : 37 éléments, 19 variantes.
- `work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs` (D104, nouveau).
- `work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs` : option `--ter`, en-tête mis à jour. Sans `--ter`, rien ne change.
- Témoins dans `tournoi/outils/temoins/` :
  - `reprise-r6a/` (copie exacte de r6a : etat.html et NOTE.md) ;
  - `reprise-ok/` et `reprise-sans-raison/` (page synthétique et NOTE) ;
  - `planche-r4c-refusee.html` (copie exacte de `fils22-picto-epice-2/planche/etat.html`, qui n'est pas versionnée) ;
  - `planche-ter-ok.html` (8 propositions synthétiques, 7 genres).
- Générateurs des témoins synthétiques : hors du dépôt (`os.tmpdir()`), donc non versionnés. Une copie parasite (`v4/r0c-cap-tmp.mjs`) a été créée par erreur pendant la voie, puis supprimée. `git status` ne montre plus rien hors de « Possède ».

## L'inventaire (id, variante, ses mots en abrégé, facteur)
| id | var. | ses mots (abrégé) | facteur |
|---|---|---|---|
| y1b-face-a-ta-stout | y1b | « y1b est de mon point de vue semble meilleur. » | variété |
| y1b-pastille-critere | y1b | idem | variété |
| y1b-jauge-amertume | y1b | idem | variété |
| y1b-dock-pouce | y1b | idem | outil : Dryhopper |
| y1b-plan-d-avant | y1b | idem | variété |
| y1b-bandes-style | y1b | idem | variété |
| y1b-ligne-contexte | y1b | idem | contexte |
| y1b-defi | y1b | idem | variété |
| y1b-tirage-preuve | y1b | idem | variété |
| y1b-levure-pastilles | y1b | idem | outil : Levure |
| y1b-second-houblon-puis | y1b | idem | outil : Dryhopper |
| y3-panel-osu | y3 | « la panel osu j'aime assez » | variété |
| y3-pour-egaler | y3 | « j'aime bien aussi la y3 même si la molette… » | variété |
| v1-vraies-valeurs, v1-en-a-plus, v1-linalol-en-biere | v1 | « …meilleur vu de comparaison sur des vrai valeur… trop ostère » | variété |
| w2-piste-commune, w2-cartes-verdict | w2 | « …pas trop mal dans la manière de comparé » | variété |
| x3b-cuve-jour-apres-jour | x3b | « La x3b est aussi interessant mais dur à lire… » | outil : Dryhopper |
| a2b-ce-que-la-levure-change | a2b | « voir ce que la levure change reset vraiment interessant » | outil : Levure |
| d1-tout-ouvert | d1 | « d1, tout ouvert était aussi interessant mais trop bordélique. » | variété |
| l5b-barres-voie | l5b | « Meilleures bar » | variété |
| l5b-pistes-objectif | l5b | « Les bar de ce type sont plus informative donc meilleur » (L03, D92) | variété |
| l8-disposition | l8 | « Visuellement horrible, mais la manière dont sont disposés… » | variété |
| l8b-verdicts-pictos-trait | l8b | « C'est la meilleure version mais le glowing… type fil » | variété |
| l8b-legende-cachee | l8b | « …un bouton légende un peu caché pour pas que ça gêne » | variété |
| l5f-carte-role-alpha | l5f | « pour l5f très bien mais manque des info… » | variété |
| m4-radar-degustation | m4 | « Radar: m4 h4 très bien… » | contexte |
| h4-radar-demande | h4 | idem | variété |
| p03-plages-sources | p03 | « J'aime beaucoup la variante 3 mais ça manque d'intervalle… » | variété |
| p03-radar-superpose | p03 | « Je pense que c'est aussi la 3… » | variété |
| p06-grille-familles | p06 | « Comparé: p06 » | variété |
| p02-radar-intervalle | p02 | « Comparé : radar p2 mais avec ajoute d'intervalle de confiance » | variété |
| s5-deux-objectifs | s5 | « s5 semble vraiment le mieux dans ce cas » | outil : Suggérer |
| p4-plus-comparaison | p4 | « …plutôt un + qui ajoute le houblon à la comparaison » | variété |
| g1-fiche | g1 | « Inutile mais la v1 est la meilleure » | outil : fiche |
| fiche-citra-cryo | g1 | « Ça c'est très bien » | outil : fiche |

Chaque capture citée a été ouverte en image. Les éléments refusés ensuite n'entrent pas. Le « glowing » de l8b est écrit en réserve, et seule la version corrigée « type fil » est retenue. La table des IBU par moment de g1 est exclue (« Inutile »).

Où vivent les variantes, hors des dossiers du brief :
- d1 est dans `fils20-dryhop/` (lot 20) ;
- la variante 3 est `fils5-comparer/p03` ;
- p06 et p02 sont dans `fils6-comparer/` ;
- p4/p4b sont dans `fils15-s5-complexe/` ;
- la fiche Citra cryo est `fils13-carte-fiche/captures/g1-fiche-citra-390.png` (intégrée à la base v4.9).

## Sorties décisives (rejouées depuis la racine)
- G1 : `INVENTAIRE OK (37 éléments, 19 variantes)`. Contre-essai sur une copie faussée (mots changés, capture absente, facteur inconnu, id en double) : `INVENTAIRE ECHEC 4 problème(s)`.
- G2 : `COUVERTURE OK (37 elements)`.
- G3 : `ECHOUE OK (REPRISE ECHEC, code 1)` sur la copie de r6a.
- G4 : `ECHOUE OK (REPRISE ECHEC, code 1)` sur r6a elle-même : 38 problèmes, pas de section « ## Reprise » et 37 éléments sans ligne. r6a n'a aucun `data-element`.
- G5 : `REPRISE OK (26 repris, 2 en contexte, 8 en pont, 1 écartés)`. `y1b-tirage-preuve` passe « à un toucher ».
- G6 : `ECHOUE OK`. Seule cause : « y1b-tirage-preuve (repris) : pas visible au repos dans les 844 premiers pixels (à un toucher) ».
- G7 : `ECHOUE OK`. Seule cause : « d1-tout-ouvert : écarté sans raison écrite (0 mot(s) ; six au moins…) ».
- Contre-essai de D104 (hors critères) : `REPRISE ECHEC` sur cinq cas, chacun avec sa bonne cause :
  - un id inconnu ;
  - un élément « en contexte » hors de `data-role="contexte"` ;
  - un élément à deux touchers ;
  - deux ponts sans lien.
- G8 : `ECHOUE OK (PLANCHE ECHEC, code 1)` sur la copie de r4c. Il y a 13 problèmes :
  - 4 variantes, 2 genres ;
  - le piment est une idée refusée ;
  - les dessins sont déjà refusés ;
  - aucune vraie carte ;
  - « même dessin, à l'unité près : p1-crochet, p3-couche ».
- G9 : `ECHOUE OK` sur la planche r4c elle-même.
- G10 : `ECHOUE OK` sur r4. La cannelle et la vanille ne sont plus refusées comme idées, mais leurs dessins de r4 le restent.
- G11 : `PLANCHE OK (8 variantes)`.
- G12 : `PLANCHE OK (4 variantes)`, inchangé. La planche r4 d'origine passe toujours (`PLANCHE OK (7 variantes)`).
- Précision du pilote, en cours de voie : sous `--ter`, `--genres` et `--nombre` remplacent les défauts.
  - `planche-ter-ok.html --ter --genres=2 --nombre=8-8` donne `PLANCHE OK (8 variantes)`.
  - r4c avec `--ter --genres=1 --nombre=1-9` échoue encore (11 problèmes). Les autres règles tiennent donc.
- Contre-essai de `--ter` : un dessin décalé de 0,2 et un nom « Piment » donnent `PLANCHE ECHEC` (quasiment identique, idée refusée).
- `systeme.mjs cablage` : `CABLAGE OK`. Aucun caractère de contrôle dans les deux scripts.
- Captures ouvertes : `planche-ter-ok` (8 blocs, pictos à 12/16/24 px, carte Saaz) et `reprise-ok` (puces, ligne de contexte, liens de pont, bouton « Plus »). Elles sont dans `os.tmpdir()` (`r0c-ter-ok.png`, `r0c-reprise-ok.png`).

Essais : G1 à G12 tenus au premier passage. Une seule correction en cours de route : `\b` après « écarté » ne marche pas avec un é final, il a été remplacé par une anticipation.

## Doutes et limites
- **g1, « la v1 est la meilleure »** : je suis la lecture du registre et d'acquis-valides (la phrase désigne g1, dont la table était barrée). Le mot « v1 » reste ambigu.
- **Les éléments de y1b portent tous sa seule phrase** : il n'a jamais nommé ces éléments un par un. Leur choix vient des captures, de D104 et de sa NOTE.
- **Les témoins synthétiques suivent l'inventaire** : `reprise-ok` et `reprise-sans-raison` sont à régénérer si un élément change (la NOTE du témoin le dit).
- **Repérer un houblon sur une carte** (`--ter`) : une liste fermée d'environ 60 noms. Un houblon rare non listé ferait échouer une vraie carte. Il suffit d'élargir la liste.
- **Lien de pont** : D104 vérifie qu'un lien ou un bouton nomme l'outil (texte, aria-label, href ou `data-outil`). Il ne vérifie pas que la cible existe.
- **Absents de l'inventaire, faute d'outil admis dans `facteur`** :
  - u4 (« Substitution, ça serait plus du u4 ») ;
  - le radar de Suggestions p10 ;
  - le code couleur des arômes, qui est déjà une exigence transversale.

DÉCISION À PRENDRE : faut-il ajouter « outil : Substituer » aux facteurs admis, pour inscrire u4 comme pont depuis Comparer ? Options : (a) l'ajouter, avec u4 en élément « en pont » ; (b) laisser Substituer hors de Comparer. Ma recommandation est (b) pour le lot 22 bis, pour rester sur un seul facteur et éviter une ligne de plus. Puis (a) quand l'outil Substituer sera construit. Décideur : pilote.

CONNAISSANCE : l'inventaire des éléments notés vit dans `fils22-comparer/donnees/elements-notes.json` (37 éléments, 19 variantes, 22.10). Les variantes de reprise le prouvent par une section « ## Reprise » et des marqueurs `data-element`, contrôlés par `controle-reprise.mjs` (D104). p1-crochet et p3-couche de r4c ont le même dessin à l'unité près : c'est la mesure de son « quasiment identique ».

LEÇON PROPOSÉE : sous Git Bash, un `cp` vers un chemin calculé (`$O/../../…`) peut écrire hors du périmètre sans qu'on le voie. Écrire les fichiers de travail par un chemin absolu vers `os.tmpdir()`, et lancer `git status --short` avant de rendre (L17). Ici, une copie parasite créée dans `v4/` a été vue et supprimée avant la remise.
