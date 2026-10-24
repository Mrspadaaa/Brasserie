# Contrat commun des reprises D124 (r1 à r5) — rendre à chaque écran ce que sa maquette choisie montrait

À lire en entier par chaque concepteur de r1 à r5, avec son VOIE.md.

## Pourquoi
Le brasseur, 24.10, sur la maquette 24.10 (construction 5345f6ad), mot pour mot : « Ça a bien avancé mais le rail par
exemple à perdu en fonctionnalités et certaines de mes choix ont été perdue » (D124) ; et « J'avais mis des commentaires,
j'ai la nette impression que ils ont pas tous été pris en compte aussi » (D125). Règle n° 1 (CLAUDE.md) : « C'est
critique que mes choix soient respectés. SI non, rien n'a de valeur. » Sa maquette choisie est la base de l'écran,
reprise telle quelle, **tous ses états compris** (L03).

Les voies p21a et p21b ont joué chaque état de ses maquettes choisies sur 5345f6ad : `work/refonte-frontend/v4/choix/
etats/<ecran>.json` (champs `quoi`, `ecart`, `capture_choisie`, `capture_5345f6ad`, `verif`, `voulu`) et leurs
RESULTAT.md (`voies/p21a-etats-etape-biere-fiche/`, `voies/p21b-etats-suggerer-comparer-acquis/`). La voie p24 a écrit
`work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs`, qui les rejoue.

## Ce que tu fais
1. Ouvre côte à côte, pour chaque état de ton écran, `capture_choisie` et `capture_5345f6ad` (en images), puis joue sa
   maquette choisie dans Chrome (`page_choisie`).
2. Pour chaque état non voulu (`voulu` vide) dont le verdict est `absent` ou `different` : rends-le **comme sa maquette
   choisie le montre** (mêmes mots, mêmes nombres venant du moteur en direct, même forme, même geste). Un état `present`
   ne doit pas régresser.
3. Pose `data-etat="<id>"` sur l'élément déclencheur de chaque état (contrat de `controle-etats.mjs`).
4. Garde les écarts voulus par lui (`voulu` : la croix D109, le « ? » D113, le fil d'étapes D116, l'entrée de l'analyse
   D121, les pictos D74, le radar d'abord dans la fiche D115, Comparer r6a + x3b D107…) et les améliorations qui ne
   contredisent pas sa maquette (listées dans les RESULTAT.md).
5. Rien d'un écran au choix ouvert : Dryhopper, Levure (et Substituer, voir ton VOIE.md). Quand sa maquette choisie
   contenait elle-même un élément de ces sujets (le groupe « Changer de levure » de q2b, la biotransformation de la carte
   froide de la base v4.10), c'est un élément de **sa** maquette : rends-le.
6. Un doute entre deux lectures de sa maquette : la plus proche de sa capture, écrite dans RESULTAT.md (`DÉCISION :`).

## Règles de la maquette jouable (inchangées)
- Code dans `prototypes/houblons-v4/parcours/src/`, composants et jetons de l'app importés (`src/ui`,
  `tailwind.config.js`), jamais recopiés ; moteur v4 en direct (`simulerCas`), aucune grille précalculée ; un seul état
  de recette partagé (`parcours/src/etat/`, en lecture : n'y écris pas, demande au pilote).
- Thème de ses maquettes (`parcours/src/theme-maquettes.css`, D106) ; L26 : classes préfixées par écran.
- Construction : `node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-<ecran>`
  (jamais la sortie par défaut : la batterie du pilote l'emploie). D'autres concepteurs construisent en même temps sur
  le même arbre, chacun ses fichiers : si la construction échoue sur un fichier qui n'est pas à toi, attends une minute
  et relance (3 fois), puis signale-le au pilote.
- Aucune écriture dans `src/` de l'app, ni hors de ton « Possède » (L17) ; scripts de travail dans `os.tmpdir()`.

## Se juger avant de rendre
- Tes captures « après » de chaque état, à côté de `capture_choisie`, ouvertes en images (L12) : la même chose doit se
  voir. Écris dans RESULTAT.md la liste des états rendus, un par ligne, avec le chemin de ta capture.
- `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-<ecran> --ecran=<ecran>` → `ETATS OK`.
- `controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-<ecran> --ecran=<écran du registre>` → `CHOIX OK`.
- `controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-<ecran> <route> --page=etat.html --sans=mots` → `COMMUN OK`,
  `controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-<ecran>` → `TEINTE OK`.
- Le critique (Fable) jugera ensuite ton écran côte à côte avec sa maquette : il refuse par défaut ce que le brasseur
  refuserait.
