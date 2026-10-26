OK — phase 1 : Comparer de la maquette en cmc2k, Ses mots complets et triés, MOTS-TOUS OK

## Phase 1 — la maquette passe à cmc2k

Fichiers : `prototypes/houblons-v4/parcours/src/ecrans/comparer/` (index.tsx, Ensemble.tsx, Etapes.tsx, comparer.css repris de
cmc2k ; Radar.tsx gardé sur RadarBase avec le moment ; NOTE.md réécrite en tête + § Reprise de rc-registres-comparer ;
`data-ouvre-element` x3b-biotransfo et x3b-plans sur les boutons du volet), `work/refonte-frontend/v4/tournoi/outils/controle-mots-tous.mjs`,
`prototypes/houblons-v4/maquettes/parcours/` (construit).

Force d'un mot (« Ses mots », D151) : (1) nombre de fiches qui le citent ; (2) l'apport de sa famille chez ce houblon selon le
moteur, au moment comparé (dCran de sa rangée « Par famille ») ; hors familles ou famille inconnue : après ; (3) lui seul d'abord.
Au catalogue actuel chaque mot n'a qu'une fiche : la force moteur ordonne, et l'ordre suit le moment.

Sorties :
- `controle-mots-tous.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cmc2k` → `MOTS-TOUS ECHEC (1)` (« +2 » d'Idaho 7, data-n-mots absent)
- `controle-mots-tous.mjs prototypes/houblons-v4/maquettes/parcours comparer` → `MOTS-TOUS OK` (Cascade 4/4, Idaho 7 8/8, Galaxy 5/5)
- `controle-quand-comparer` → QUAND OK ; `controle-normalise-moment` → NORMALISE OK ; `controle-centre-plus` → CENTRE OK ;
  `controle-radar-base` → RADAR-BASE OK (9 vues)
- `controle-choix.mjs prototypes/houblons-v4/maquettes/parcours` → CHOIX OK (7 écrans ; levure ouverte)
- `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` → ETATS OK (139/139)

Captures (ouvertes) : `work/missions/2026-10-25-integration-houblons/voies/t15a-comparer/captures/p1-maquette-{repos,page,ses-mots}.png`
à côté de `p1-cmc2k-{repos,page,ses-mots}.png` : repos identique à cmc2k ; « Ses mots » : Idaho 7 montre ses 8 mots (cassis,
résine, pin, papaye, orange, pamplemousse, abricot, thé noir), sans « +2 ».

Rejoué après le déménagement (ci-dessous), sur la maquette reconstruite : MOTS-TOUS OK, QUAND OK, NORMALISE OK, CENTRE OK,
RADAR-BASE OK (9 vues), CHOIX OK (7 écrans ; levure ouverte), ETATS OK (139/139) ; `npx tsc --noEmit -p tsconfig.json` : 0 erreur.

## Phase 2 — arrêtée sur consigne du pilote (« La phase 2 … partira chez un agent Sonnet »)

Commencée avant la consigne, et laissée verte : **l'écran est déménagé dans l'app, une seule copie**, `src/ui/hopIndex/comparer/`
(10 fichiers déplacés par `git mv`, imports réécrits vers `parcours/`, `commun/`, `domain/`, `data/`), plus `hote.tsx` (l'hôte,
comme `maBiere/hote.tsx`), `cas.ts`, `commun.ts`. La maquette n'en garde que son hôte (`ecrans/comparer/index.tsx`), un réexport
`calcul.ts` (pour Dryhopper), `jeu.mjs` et NOTE.md. Rien de l'app n'importe encore `comparer/` : démarrage inchangé, rien de
visible dans l'app. Reste (passation détaillée dans NOTE.md, § « Pour le port dans l'app ») : l'hôte de l'app chargé par
HopToolLayer, Placer par la porte, le pont du brouillon, les textes du cas S1, la mesure de fluidité, le test, le build, le budget.

ATTENTION, état git : le commit 46f5326b (L18) a pris les renommages indexés par mon `git mv`, **sans leur contenu modifié**
ni les nouveaux fichiers. Sur HEAD seul, la maquette ne construit pas (plus d'`ecrans/comparer/index.tsx`, imports cassés).
Le reste est dans l'arbre de travail : `src/ui/hopIndex/comparer/*` (M), `cas.ts`, `commun.ts`, `hote.tsx`,
`prototypes/houblons-v4/parcours/src/ecrans/comparer/{index.tsx,calcul.ts}` (??), NOTE.md. À committer ensemble.

Fichiers écrits par la voie : ceux ci-dessus, `work/refonte-frontend/v4/tournoi/outils/controle-mots-tous.mjs`,
`prototypes/houblons-v4/maquettes/parcours/` (construit), `voies/t15a-comparer/captures/`, ce RESULTAT.md. Fichiers de travail
dans le dossier temporaire. Le fichier vide `-` à la racine (25.10, 19:14) n'est pas de cette voie, je crois : non touché.

Prédiction du brasseur : « Là il y a tout », en voyant les 8 mots d'Idaho 7 ; il pourrait demander pourquoi l'ordre change
avec le moment.

DÉCISION À PRENDRE : la force d'un mot suit le moteur au moment comparé, donc l'ordre de « Ses mots » change quand il change
de moment. Une autre option : un ordre fixe, celui du dry hop. Réversible en une ligne (`forceMoteur`). Le pont du brouillon
pour la couche Comparer passe par `maBiere/EtapeHoublons.tsx` (voie rb2) : une ligne d'effet à y ajouter.
CONNAISSANCE : au catalogue actuel, chaque mot de `sesMots` n'est cité que par une seule fiche. Le nombre de sources n'ordonne
donc rien, seule la force moteur départage.
LEÇON PROPOSÉE : `git mv` indexe le renommage : un commit du pilote pendant la voie peut le prendre sans les changements
qui le complètent. Une voie déplace avec `mv` (non indexé), et laisse le pilote indexer à la fin.
