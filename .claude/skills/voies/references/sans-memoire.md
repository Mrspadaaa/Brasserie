# Relire sans mémoire : trois usages

Idée reprise de `google/elephant-goldfish-model` (Apache 2.0), adoptée le 31.10 (« Tous »). L'auteur, ici le pilote, garde tout le
contexte (l'« éléphant »). Un relecteur neuf (le « poisson rouge ») ne lit que le document et ce qu'il cite : il voit ce qui n'est pas
écrit, parce qu'il ne l'a jamais entendu. Adapté à nos règles : aucune pause pour l'utilisateur (le jury répond à sa place), pas
d'installation du plugin, un coût plafonné.

- **Neuf** veut dire un nouvel `Agent`, dont le prompt pointe les fichiers et rien d'autre. Ni `SendMessage` à un agent qui a vu le
  travail, ni le pilote lui-même : une relecture dans le même contexte n'en est pas une.
- **Ne jamais approuver par défaut** : chaque relecteur cherche ce qui manque ; « rien à signaler » se prouve aussi.
- Ce qu'il trouve corrige le document (la consigne, le plan, la doc), jamais une explication orale à l'agent suivant.

## 1. Le test de compréhension, avant de lancer une voie
- **Quand** : obligatoire pour une voie dont le brasseur verra le livrable, pour une relance après une consigne mal lue (L01, L03), et
  pour une voie qui touche l'argent, le stock, les données réelles ou le moteur. Facultatif ailleurs ; jamais pour un simple rejeu.
- **Qui** : un `executant` (Haiku) neuf, 10 tours au plus. Il lit `VOIE.md` et `GATES.md`, et les fichiers cités seulement pour
  comprendre. Il n'exécute rien et n'écrit que `voies/<id>/COMPRIS.md`.
- **Prompt** : « Test de compréhension de la voie <id> (mission <m>) : suis `.claude/skills/voies/references/sans-memoire.md` § 1.
  Lis seulement work/missions/<m>/voies/<id>/VOIE.md et GATES.md. N'exécute rien. Écris COMPRIS.md, puis rends une ligne. »
- **COMPRIS.md**, cinq parties, dans ses mots à lui :
  - `## Objectif` : ce qu'il va livrer, en une ou deux phrases ;
  - `## Écrit dans` : un chemin par ligne, entre accents graves ;
  - `## Fini quand` : chaque critère, dit en clair ;
  - `## Ne fait pas` : ce que la consigne exclut ;
  - `## Doutes` : chaque endroit où il a dû deviner, ou « aucun ».
- **Contrôle** : `node scripts/agents/systeme.mjs comprendre work/missions/<m>/voies/<id>` → `COMPRIS OK` si les cinq parties sont là et
  si chaque chemin de « Écrit dans » est sous le « Possède » de VOIE.md. Les doutes sont comptés, pas jugés.
- **Le pilote** compare l'objectif à son intention. Un écart ou un doute : il réécrit VOIE.md, puis lance un test neuf, une fois au plus.
  Ensuite seulement, la voie part.

## 2. La revue du plan, avant le code
- **Quand** : une voie de code qui touche les finances, le stock, l'écriture ou le schéma Firestore, le Drive ou le moteur. Pas pour
  une maquette (le critique) ni pour une petite correction sans choix.
- **Le plan** : l'auteur (ou le pilote) écrit `voies/<id>/PLAN.md` avant toute ligne de code :
  - les défauts visés (ids du diagnostic) ;
  - les changements, avec fichier et fonction ;
  - les tests qui échouent d'abord (données, attendu) ;
  - les tests et scripts hors Possède qui appellent une fonction ou rendent un écran changé (`grep` sur `tests/` et `scripts/`
    entiers, fixtures relues contre les nouvelles règles), rejoués sur HEAD, et ceux qui changeraient (31.10 : oublié par les quatre
    plans de Dépense) ;
  - les risques : données existantes, hors ligne, double clic, arrondis ;
  - le hors périmètre.
- **Deux `relecteur` (Sonnet) neufs, en parallèle**. Chacun lit PLAN.md, le diagnostic qu'il cite et le code. Les deux regards :
  - **Conception** : chaque défaut est-il corrigé à sa cause ? Les cas limites (vide, hors ligne, données anciennes, centimes, TVA)
    sont-ils couverts ? Un chiffre est-il inventé, un goût du brasseur tranché à sa place ?
  - **Prêt à coder** : chaque fichier et chaque fonction existent-ils (fichier:ligne) ? Chaque test se fait-il sur fixtures, Gemini
    simulé ? Où un codeur devrait-il deviner ?
- **REVUE-PLAN.md** (`voies/<id>/`) : une section `## Conception`, une section `## Prêt à coder`, chacune avec un tableau
  `| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |`. Gravité : `bloquant`, `majeur` ou `détail`.
- **Le sort** est donné par le pilote : `corrigée` (PLAN.md changé), `contestée` (raison prouvée) ou `acceptée` (compromis assumé).
  Un bloquant n'est jamais accepté. Une seule revue neuve du plan corrigé, sur les bloquants. Un bloquant qui reste va à l'avis croisé
  (skill `conseil`), ou aux accords de l'utilisateur s'il est irréversible.
- **Contrôle** : `node scripts/agents/systeme.mjs revue work/missions/<m>/voies/<id>/REVUE-PLAN.md` → `REVUE OK` si les deux sections
  existent, si chaque ligne a un sort parmi les trois, une raison quand elle est contestée ou acceptée, et si aucun bloquant n'est
  accepté ni laissé sans sort.

## 3. Le rapport d'écart entre la doc et le code
- **Quand** : au début d'une mission sur un domaine, avant le diagnostic, et avant de signer une mission qui en a changé le code.
  Documents : les sections de PRODUCT.md et DESIGN.md du domaine, ses `docs/*.md`, les notes du cerveau dont les `sources` citent
  du code.
- **Mécanique** : `node scripts/agents/systeme.mjs ecarts <doc…>` vérifie que ce que chaque document cite entre accents graves existe :
  - un chemin existe ;
  - un `fichier:ligne` ne dépasse pas la fin du fichier ;
  - un identifiant de code se trouve dans `src/`, `functions/src/`, `scripts/` ou `tests/`.
  Il rend `ECARTS OK`, ou `ECARTS ECHEC <n>` avec `doc:ligne`. Il ne juge pas le sens.
  Mesuré le 31.10 (voie o1) : 1 écart vrai sur les 5 docs des finances ; sur les notes du cerveau et les règles, 12 écarts dont
  5 faux (42 %). Hors du domaine et de ses notes à `sources` de code, le résultat est un indice, que le relecteur tranche.
- **Sens** : un `relecteur` neuf par groupe de deux ou trois documents (son plafond est de 30 tours) lit chaque document et le code
  qu'il décrit, et écrit chaque section dès qu'elle est prête. Il ne rapporte **que les
  écarts**, chacun avec `doc:ligne`, l'affirmation citée en moins de 15 mots, `code:ligne`, et sa classe :
  - `absent` : décrit, mais pas dans le code ;
  - `incomplet` : un champ ou un cas manque ;
  - `figé` : une valeur en dur là où la doc dit calcul ou réglage ;
  - `autre architecture` : un autre chemin, un autre stockage ;
  - `non documenté` : un comportement qui compte, absent de la doc.
  Un document sans écart reçoit « Aucun écart ».
- **Suite** : pour ce qui existe, le code fait foi. La doc se corrige dans la même mission. Si c'est le code qui est faux (ses mots,
  PRODUCT.md), l'écart devient un défaut du diagnostic, avec son test qui échoue d'abord. On ne change jamais le code pour coller
  à une vieille doc.
- **À l'utilisateur**, un écart se dit avec le côté qui tient et ce qui change : « le code fait X, comme tu l'as demandé ; la doc sera
  corrigée ». Le 31.10, « la doc dit Firestore, le code envoie sur ton Drive », dit seul, a été lu comme une proposition de
  ranger ses PDF en base : « J'avais déjà spécifié ça ».
- **Fichier** : `work/missions/<m>/ecarts/<AAAA-MM-JJ>-<domaine>.md`, une section par document.
