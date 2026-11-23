OK — ACQUIS OK --outil=dryhopper, D98 --edition, data-libre sur le curseur ; 14 témoins, 12 critères tenus

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` : option `--outil=dryhopper` (en-tête mis à jour, règle et témoins).
- `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs` : option `--edition` et curseur qui porte lui-même `data-libre` (en-tête mis à jour).
- Témoins neufs, `etat.html` chacun, sous `work/refonte-frontend/v4/tournoi/outils/temoins/` :
  - acquis Dryhopper, positifs : `dryhopper-acquis-ok` (tout au repos, pont vers Levure), `dryhopper-acquis-toucher-ok` (frise et valeurs à un toucher, levure en dernière étape) ;
  - acquis Dryhopper, négatifs : `-sans-frise`, `-sans-levure`, `-sans-valeurs`, `-pas-1` (curseur par 1′ non déclaré), `-pas-declare-faux` (`data-pas="5"` mais 1′ mesuré), `-jours-au-debut` ;
  - curseur : `dryhopper-curseur-ok`, `dryhopper-curseur-ko` (ni bornes ni `data-options`) ;
  - `--edition` : `une-question-edition-ok`, `-ko` (deux contrôles pour la dose), `-direct-ko` (« − » et « + » dans la ligne), `-ouverte-ko` (feuille ouverte au repos).
- Générateur des témoins : fichier de travail dans le dossier temporaire de la session, hors dépôt (les pages sont dans le dépôt, la source de génération non).

## Règles écrites
**`--outil=dryhopper`** (même convention D99 : au repos ou un seul toucher sur un déclencheur déclaré) :
- `geste` : curseur `[role="slider"]` ou input range, large d'au moins 120 px, JOUÉ pour de vrai : clavier de bout en bout, puis glissé au doigt (touchscreen) sur toute la largeur, au moins 3 états. Pas de 5′ déclaré (`data-pas="5"`, vérifié : un écart de 1′ mesuré contredit la balise) ou mesuré (trois valeurs d'ébullition, écarts voisins = 5).
- `frise` : au moins 3 `[data-etape]` visibles, et un groupe `[data-jours]` (au moins 2 `[data-jour]` « n j ») placé après la dernière étape sur l'axe de la frise.
- `valeurs` : règle de D99, minimum 1 au lieu de 3.
- `levure` : pont (lien ou bouton qui nomme la levure ; href relatif vers un fichier qui existe) ou dernière étape `data-forme="etape"` (nomme la levure, porte un nombre, suit toutes les `[data-etape]`).

**`--edition`** : un seul `button[data-edite="<facteur>"]` par `[data-contexte]` du même facteur, `aria-controls` vers une feuille invisible au repos ; le contrôle joue un tap (page rechargée) : la feuille doit s'ouvrir et ne régler que ce facteur. Échecs : deux contrôles pour un facteur, contrôle direct (radio, curseur, select, champ, bouton sans `data-edite`), feuille ouverte au repos, qui ne s'ouvre pas, ou qui règle un autre facteur.

**Curseur** : l'élément balisé compte lui-même (crans par `aria-valuemin`, `aria-valuemax` et le pas `aria-step` / `data-pas`, ou `data-options`). Sans bornes ni `data-options` : « 0 option ».

## Sortie décisive de chaque critère (depuis la racine)
- G1 : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G2 : `ECHOUE OK (UNE-QUESTION ECHEC, code 1)` (y1b)
- G3 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)` (r6n1)
- G4 : `ECHOUE OK (ACQUIS ECHEC, code 1)` (acquis-deux-touchers)
- G5 : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`
- G6 : `ECHOUE OK` ; cause : « frise : absent (pas de frise du brassin avec les jours de contact en bout) »
- G7 : `UNE-QUESTION OK (1 groupe libre : moment)`
- G8 : `ECHOUE OK` ; cause : « contexte « dose » : 2 contrôles d'édition pour un même facteur (un seul) »
- G9 : `ECHOUE OK` ; cause : « 2 facteurs libres : dose (…) ; moment (…) » et « la ligne de contexte contient 1 contrôle(s) »
- G10 : `UNE-QUESTION OK (1 groupe libre : moment)`. Preuve que le défaut était réel : l'ancien script (version du dernier commit, rejoué en copie hors dépôt) donne sur ce même témoin « groupe libre « moment » : 0 option (deux au moins) ».
- G11 : `UNE-QUESTION OK (1 groupe libre : moment)` (e1 à e4 ; e5 et a1 aussi)
- G12 : `CABLAGE OK`
- G13 : voir la ligne de rapport vérifiée en dernier (contient « ACQUIS OK », « --edition », « --outil=dryhopper », « LEÇON PROPOSÉE »).

Négatifs supplémentaires (tous `ECHOUE OK`) : les six négatifs d'acquis ci-dessus, `-direct-ko`, `-ouverte-ko`, `dryhopper-curseur-ko`. Variantes jouées hors dépôt : feuille qui règle aussi le moment (« la feuille règle aussi moment ») et bouton sans effet (« n'ouvre pas la feuille »). Non-régressions : acquis-ok, acquis-toucher-ok (D99), y3 et y1b toujours en échec D99, `fils22-carte/dryhopper` passe D98 avec et sans `--edition`.

## Essais utilisés
Un essai par critère (aucune reprise). Une retouche de forme sur les témoins (frise trop large dans la capture) et un rejeu complet.

## Doutes et limites
- Preuve sur pages réelles : en posant `data-acquis="geste"` sur des copies temporaires (hors dépôt) de a1 (le dock) et e5 (le curseur), le geste passe sur les deux, pas mesuré au clavier. Elles échouent sur frise, valeurs et levure faute de balisage, ce qui est attendu avant les passes 2 (a1 et e5 ne sont pas modifiées).
- Convention nouvelle que les passes 2 devront suivre : `[data-etape]` (étape de la frise), `[data-jours]` et `[data-jour]` (jours de contact), `data-forme="pont|etape"` sur la levure, `data-pas="5"` sur le curseur. À recopier dans les brefs des passes 2.
- Le glissé au doigt suppose des événements pointeur (touchstart converti en pointerdown), comme a1, e5 et y1b. Un curseur qui n'écoute que les événements `touch*` ou un `<input type=range>` mal exposé serait jugé immobile.
- `--edition` ne juge pas le contenu visuel de la feuille (mise en page, fond), seulement son ouverture et le facteur qu'elle règle.
- La part « dernière étape » de la levure se juge sur l'ordre du DOM, pas sur la position écran.
- Les pages témoins sont des fixtures, pas des maquettes montrées au brasseur ; captures de deux d'entre elles ouvertes (rendu correct à 390 px).

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : D99 existe désormais en deux jeux d'acquis (Comparer par défaut, Dryhopper par `--outil=dryhopper`) ; D98 admet un bouton `data-edite` par facteur de contexte avec `--edition` (la règle stricte reste le défaut) ; `data-libre` peut se poser sur le curseur lui-même.

LEÇON PROPOSÉE : un contrôle qui cherche seulement dans les descendants rate l'élément balisé lui-même (r7a, r7e) ; quand on écrit un sélecteur de balisage, tester le cas « la balise est sur l'élément porteur » avec un témoin positif dédié.
