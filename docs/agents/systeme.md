# Système d'agents de L'Affinée

Mis en place le 22.10.2026, à la demande de l'utilisateur. Il comprend quatre briques, adaptées à
notre usage :
- un **second cerveau** ;
- les **leçons des agents** ;
- un **conseil** pour les décisions lourdes ;
- des **voies** : séparation des tâches, décision et boucles de correction.

Il remplace le pont Sol/Codex (caduc depuis le 08.10) et la « session arbitre » de CLAUDE.md.

## Pourquoi
Ce qui a coûté cher jusqu'ici, et la brique qui répond :

| Problème vécu | Leçon | Réponse |
|---|---|---|
| Les mêmes défauts reviennent de lot en lot | L13 | une plainte devient un contrôle ; une erreur de méthode devient une leçon chargée à chaque session |
| Un acquis ou une exigence se perd entre deux lots | L05, L06 | cerveau (`acquis-valides`), exigences recopiées dans chaque VOIE.md |
| 41 variantes sans carte des outils | L10 | le conseil sur l'architecture avant l'éventail |
| 8 à 12 auteurs Opus, sorties brutes lues par le pilote | L18 | voies plafonnées, Haiku et Sonnet, retour en une ligne |
| Livrables annoncés mais absents, agents sans trace | L16 | RESULTAT.md obligatoire, critères rejoués par le pilote |
| Savoir dispersé (mémoire locale, registre, recherches) | — | second cerveau versionné, lu par tous les agents |

## Vue d'ensemble

```
            cerveau/ (INDEX + LECONS chargés partout ; notes à la demande)
                 │ lire                                      ▲ capturer
                 ▼                                           │
 demande ──► PILOTE (Opus) ── planifie une fois ──► MISSION.md + VOIE.md + GATES.md
                 │                                   │
                 │ décision lourde ─► CONSEIL         │ un seul message, en arrière-plan
                 │ goût ─► BRASSEUR                   ▼
                 │ irréversible ─► UTILISATEUR   voies : executant (Haiku) · auteur (Sonnet)
                 │                                     · relecteur (Sonnet)
                 │                                    se contrôlent, 3 essais, RESULTAT.md
                 ◄──── une ligne par voie ────────────┘
   rejoue les critères (systeme.mjs voies) ─► signe ─► commit local
                 │
                 └─► LEÇON PROPOSÉE → LECONS.md · CONNAISSANCE → note · plainte → contrôle
```

## Rôles et modèles

| Rôle | Fichier | Modèle | Plafond | Fait | Ne fait pas |
|---|---|---|---|---|---|
| Pilote | CLAUDE.md, skill `voies` | Opus | session | planifie, route les décisions, vérifie, signe, écrit le cerveau et les leçons | lire les sorties brutes, exécuter le mécanique |
| Exécutant | `.claude/agents/executant.md` | Haiku | 40 tours | lectures, extractions, conversions, contrôles, tests, captures, régénérations | décider, écrire hors de « Possède » |
| Concepteur | `.claude/agents/concepteur.md` | Opus | 80 tours | tout ce que le brasseur verra : maquettes, fils de fer, pictos, cartes ; dans une vraie carte de la base ; se juge sur ses captures avec PORTRAIT.md | déléguer le goût à un modèle plus faible (L25) |
| Critique | `.claude/agents/critique.md` | Fable | 30 tours | juge une voie d'interface comme le brasseur (calibré sur `fils21-choisir/critique/PORTRAIT.md`) ; refuse par défaut | accepter par politesse : un rejet coûte une passe, une mauvaise planche coûte sa confiance |
| Auteur | `.claude/agents/auteur.md` | Sonnet | 80 tours | diagnostic, analyse, contrôles, code avec un choix | concevoir une interface (L25) ; trancher hors contrat (il écrit `DÉCISION À PRENDRE`) |
| Relecteur | `.claude/agents/relecteur.md` | Sonnet | 30 tours | juge une voie finie hors interface (code, données, analyse), questions fermées | relire une interface (c'est le critique) ; refaire le travail |
| Conseiller | `.claude/agents/conseiller.md` | selon le regard | 15 tours | un avis tranché depuis un regard, ou une revue anonyme | écrire, exécuter |
| Président du conseil | idem | Fable pour une décision produit, Opus pour une décision technique | 15 tours | verdict en cinq parties | décider à la place du brasseur |
| Brasseur | — | — | — | choisit (goût, variante, ce qu'il voit) | — |
| Utilisateur | — | — | — | accorde push, PR, déploiement, données réelles, Gemini facturé, suppressions, réglages | — |

Les quatre agents `impeccable-*` restent, pour le skill `impeccable`. `sol-orchestrator`,
`.claude/roles/expert.md` et `scripts/claude-expert.mjs` sont caducs, mais restent en place
jusqu'à l'accord de l'utilisateur pour les archiver.

## Le second cerveau (`cerveau/`)
- `INDEX.md` donne la carte et la façon de s'en servir ; `LECONS.md` contient les leçons. CLAUDE.md
  importe les deux, donc toute session et tout sous-agent qui charge CLAUDE.md les a en contexte.
- Les dossiers : `brasseur/` (comment il juge), `metier/` (houblons, levures, eau, chimie, moteur),
  `produit/` (outils, écrans, acquis), `agents/` (façon de travailler, environnement), `sources/`
  (références externes), `decisions/` (transcriptions du conseil).
- Une note porte une seule idée, un en-tête (`name`, `description`, `type`, `maj`, `sources`) et 50
  lignes au plus. Elle est listée dans INDEX. Elle pointe les documents canoniques sans les recopier
  (SPEC-BRASSEUR, DEFAUTS-RECURRENTS, decisions.md, registre, PRODUCT.md, DESIGN.md).
- Retrouver une note : `node scripts/agents/systeme.mjs chercher <mots>`. Contrôler le cerveau :
  `node scripts/agents/systeme.mjs cerveau`. Le hook le relance après chaque écriture dans `cerveau/`.
- La mémoire locale de Claude (`~/.claude/projects/…/memory/`) ne garde que ce qui est propre à la
  machine et un renvoi au cerveau. Son ancien index recopiait le cerveau, et une copie restée en arrière
  le contredisait (22.10).
- **Miroir NotebookLM, en lecture pour le brasseur** (22.10) : le carnet est
  https://notebook.google.com/notebook/4908c56c-371e-42c9-a8af-e2ab7fb597ac, compte de l'utilisateur.
  - Le miroir va dans un seul sens : `node scripts/agents/systeme.mjs exporter [--avec-spec]` écrit
    `work/export-notebook/cerveau-affinee.md`, un fichier local ignoré par git.
  - L'utilisateur l'ajoute comme source du carnet. Le dépôt chez Google reste son geste : c'est un
    envoi externe.
  - Pas d'API grand public : l'API officielle est réservée à l'offre Enterprise, sur Google Cloud.
    Pour automatiser, il faut Google Drive pour ordinateur et un script Apps Script qui recopie le
    fichier dans un Google Doc ; NotebookLM resynchronise seul une source Google Docs.
  - Ce que le brasseur conclut dans le carnet revient par la conversation : SPEC, contrôle, leçon.
    Le carnet n'est jamais une source pour les agents.

## Les leçons (`cerveau/LECONS.md`)
L'équivalent d'AGENT_LEARNINGS.md : erreur, cause, règle, rôles, contrôle. On en écrit une après une
correction, une voie rejetée, une hypothèse fausse ou un travail refait. Le pilote seul écrit ; les
agents proposent par `LEÇON PROPOSÉE`. 30 leçons actives au plus. Une leçon devenue contrôle
automatique passe en une ligne sous « Mécanisées ». Le hook `UserPromptSubmit` repère les phrases de
correction ou de plainte et rappelle d'en tirer un contrôle ou une leçon avant de clore le tour.

## Élaguer : une maison par fait, une sortie pour chaque entrée
Au 22.10, rien ne sortait jamais. Ce qui est chargé partout pesait environ 9 600 jetons, et un critique
lisait environ 29 000 jetons avant de juger. Des copies restées en arrière contredisaient l'original :
- la description du relecteur, antérieure à L25 ;
- l'arbitre de la mémoire locale ;
- la consigne de rejet par défaut du critique, contraire à L27.
- **Une maison par fait** :
  - les paroles du brasseur vont dans SPEC ;
  - un défaut et son contrôle, dans DEFAUTS ;
  - une erreur de méthode, dans LECONS ;
  - un savoir durable, dans une note ;
  - l'état en cours, dans le registre ou MISSION.md.
  Ailleurs, on met un lien et jamais une copie, car la copie vieillit.
- **Une règle remplacée** s'inscrit dans `cerveau/REMPLACES.md`, avec le motif de l'ancienne formulation.
  `systeme.mjs remplaces` échoue tant qu'une copie survit dans CLAUDE.md, le cerveau, les agents, les
  skills `voies` et `conseil`, les règles, `docs/agents/` ou la mémoire locale.
- **Des plafonds qui imposent une sortie** :
  - `systeme.mjs charge` : CLAUDE.md et ses imports, 30 000 caractères au plus ;
  - LECONS.md : 170 lignes, 30 leçons et 8 lignes mécanisées au plus ; les plus anciennes passent dans
    `controles-mecanises` ;
  - une note : 50 lignes au plus.
  Le hook rejoue ces plafonds à chaque écriture dans `cerveau/`.
- **À la signature** de chaque mission, `charge` et `remplaces` passent. Toute règle changée pendant la
  mission est inscrite dans REMPLACES.md.
- **Les gros documents** (fait le 22.10) :
  - SPEC a un § 0 « Ce qui vaut aujourd'hui », lu d'abord ;
  - DEFAUTS a sa vue courte générée, `DEFAUTS-COURT.md` (27 000 caractères contre 63 000) ;
  - le registre ne garde que l'état en cours, et l'historique est archivé tel quel dans
    `registre-archive-2026-10-17-au-20.md`.
  Reste decisions.md (486 lignes), qu'aucun agent ne lit en entier par défaut.

## Décider : la grille

| Type de décision | Exemples | Décideur | Trace |
|---|---|---|---|
| Vérifiable | un chemin, un format, un test, une valeur mesurable | la **voie** (son critère) | GATES.md |
| Technique réversible | structure d'un fichier, ordre des voies, choix d'outil | le **pilote** | MISSION.md ; `decisions.md` si structurant |
| Lourde, déléguée, réversible | architecture d'un outil, conventions du moteur, rattachement des données, coût de calcul, priorités | le **conseil** puis le pilote applique | `cerveau/decisions/…`, ligne D-n |
| Goût et choix | quelle variante, quel picto, l8 ou l5, ce qu'il voit au doigt | le **brasseur**, sur des variantes montrées (le conseil prépare et filtre). Un choix ouvert devient un axe de variantes du lot suivant, jamais une question qui bloque le lot (L24) | SPEC-BRASSEUR, mot pour mot |
| Irréversible ou externe | push, PR, merge, déploiement, données réelles, Gemini facturé, suppression, comptes, réglages | l'**utilisateur**, groupé, sans bloquer le reste | registre, « en attente » |

Sans réponse, on applique la lecture étroite et réversible (L01) et on continue. On ne pose aucune
question bloquante. Une question de cadrage va au jury (skill `jury`, D198), jamais au brasseur.

**Filtre des lignes D-n** (31.10, adapté des ADR de mattpocock). Une décision technique reçoit sa ligne dans `decisions.md` seulement si
elle remplit au moins un de ces critères :
- elle est dure à inverser ;
- elle surprendrait un lecteur sans contexte ;
- c'est un vrai arbitrage, une option écartée qui avait ses raisons.
Sinon, une ligne de reprise dans MISSION.md suffit. Les paroles du brasseur, les accords de l'utilisateur et les choix de goût gardent
toujours leur trace.

### Quand le conseil intervient
Il n'est jamais réuni par habitude. Le pilote décide seul tout le reste. Le niveau (avis croisé,
rapide, complet) et le dossier de conseil sont décrits dans le skill `conseil`.

| Moment du déroulé | Déclencheur | Niveau |
|---|---|---|
| Planification d'une mission ou d'un lot (skill `voies`, étape 1) | le lot fixe une direction que les suivants suivront : carte des outils, nouvel outil, convention du moteur | complet |
| Pendant les voies | une voie rend `DÉCISION À PRENDRE`, qui dépasse le pilote et n'est pas un goût | avis croisé ou rapide |
| Boucle moyenne (voies, étape 5) | deux relances d'une voie ont échoué : le contrat est en cause | avis croisé |
| Retour du brasseur | sa remarque remet en cause l'architecture, pas un détail | complet ; un détail va directement en contrôle (boucle longue) |
| Jamais | un goût (le brasseur choisit sur variantes), un fait vérifiable (un test le tranche), un geste irréversible (l'utilisateur décide) | — |

Ordre de grandeur : un conseil complet par lot qui change de direction, zéro à deux avis croisés par
lot. Le critique Fable, lui, passe après chaque voie d'interface. Ce n'est pas le conseil.

## Les voies (skill `voies`)
1. **Planifier une fois** : `work/missions/<date>-<sujet>/MISSION.md`, une voie par livrable qui se
   vérifie seul, des périmètres d'écriture disjoints, chaque décision routée.
   `systeme.mjs mission` → MISSION OK.
2. **Contrats** : `voies/<id>/VOIE.md` (objectif, entrées vérifiées, « Possède », exigences
   transversales recopiées) et `voies/<id>/GATES.md` (critères au format unlazy : CHECK, EXPECT).
   La voie ne modifie jamais ses critères.
3. **Essaim** : toutes les voies prêtes partent dans un seul message, en arrière-plan. Le prompt pointe
   VOIE.md sans le recopier.
4. **Plafonds** : `maxTurns` par agent, comme plafond dur. Budget de mission noté dans MISSION.md.
   On s'arrête vers 95 % de la fenêtre de 5 h.
5. **Retour** : RESULTAT.md (ligne 1 `OK —` ou `ECHEC —`, preuves, `CONNAISSANCE`, `LEÇON PROPOSÉE`,
   `DÉCISION À PRENDRE`). La réponse au pilote tient en une ligne.
6. **Vérification** : `systeme.mjs voies <mission>` rejoue les critères de chaque voie avec le
   `gate-check` d'unlazy et ne croit pas le rapport. Ensuite `git status --short` contre « Possède ».
   Une voie d'interface passe par le critique.
7. **Signature** : la section « Signature » de MISSION.md, puis un commit local.

### Règle n° 1 : ses choix
« C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » (23.10, D105 : la maquette jouable
reprenait la carte en fil de fer au lieu de ses maquettes choisies, tous contrôles verts.)
- Ses choix vivent dans un seul registre : `work/refonte-frontend/v4/choix/ecrans.json`. Chaque écran y a sa maquette
  choisie, ses mots, sa capture et son inventaire, ou ses options ouvertes.
- `controle-choix.mjs <dossier>` compare chaque écran construit à son choix. `systeme.mjs mission` refuse une voie
  montrée au brasseur (interface, concepteur, étape v0, passe ou reprise) qui ne le nomme pas dans ses contrôles.
  `systeme.mjs voies` rejoue `controle-choix.mjs --registre` à chaque rejeu.
- Une revue de conformité se fait sur les captures, côte à côte avec la maquette choisie, jamais sur les seuls contrats
  (L03).

### Ce que le brasseur verra : l'entonnoir
Méthode : `.claude/skills/voies/references/entonnoir.md`. Contrôle : `systeme.mjs mission` (M13).
- Elle reprend la méthode du lot 21 : 44 variantes v0 en 10 séries, puis 5 candidates améliorées. L'utilisateur l'a
  jugée « vraiment plus qualitatif » que celle du lot 22 (12 variantes, une par agent, contraintes dès la v0, sans
  amélioration).
- **v0** : des concepts minimalistes (une idée sur un écran plein, sa propre composition ; M14), en séries de 4 à 12,
  un concepteur par série, 48 au moins en 6 séries
  au moins (« Et plus de diversité et de nombre de mini proto »). La chaleur varie dans chaque série : froide, tiède
  ou chaude (D22).
  - Une série Fable « créative à fond », et une série libre au brief minimal.
  - Obligatoires : la baseline (toujours suivie, `controle-commun --sans=mots`), l'honnêteté, le doigt, les interdits
    et la question.
- **Tri** : un seul critique, repris à chaque série. Il rend une SYNTHESE en trois parties :
  - le classement de tout le panel (« vaste panel et ensuite ranking »), qui est une proposition ;
  - 5 candidates, une par approche ;
  - les greffes, prises partout, « même les plus extravagantes ».
  Aucun rejet au tri.
- **Passes 2, 3…** : les mêmes agents, repris par `SendMessage`. Tous les contrôles s'appliquent. Après chaque passe,
  le critique reclasse, regreffe et rend son verdict. On s'arrête dès que l'une de ces conditions est atteinte : c'est
  satisfaisant, il n'y a plus de gain, ou quatre passes ont été faites.
- **Montrer** : la dernière passe, puis toutes les v0 dans l'ordre du classement. Le brasseur choisit ; ensuite,
  `reprise` de la variante choisie avec les éléments qu'il a notés (D104).
- Le coût est voisin de celui du lot 22, pour trois fois plus de choix. Le plafond (L18) porte sur les agents et les
  tours, pas sur les variantes.

## Corriger : trois boucles

| Boucle | Déclencheur | Qui corrige | Limite | Ce qui reste |
|---|---|---|---|---|
| Courte | un critère de la voie échoue | la voie elle-même | 3 essais par critère | RESULTAT.md (essais utilisés) |
| Moyenne | le rejeu du pilote échoue, ou le relecteur rejette | le même agent, relancé par SendMessage avec le défaut | 2 relances | au-delà : contrat réécrit, conseil, ou brasseur |
| Longue | plainte du brasseur, correction de l'utilisateur | le pilote | — | SPEC (mot pour mot), DEFAUTS + contrôle qui échoue sur la version rejetée, leçon, note |

Un contrôle né d'une plainte entre dans les GATES des voies suivantes. C'est ce qui empêche le défaut
de revenir.

## Commandes

| Commande | Rôle |
|---|---|
| `node scripts/agents/systeme.mjs cerveau` | cerveau et leçons valides |
| `node scripts/agents/systeme.mjs chercher <mots>` | retrouver une note ou une leçon |
| `node scripts/agents/systeme.mjs mission <MISSION.md>` | plan routé, voies complètes, sources existantes |
| `node scripts/agents/systeme.mjs voies <mission> [--approuver]` | rejeu des critères de chaque voie |
| `node scripts/agents/systeme.mjs conseil --dernier` | transcription du conseil complète |
| `node scripts/agents/systeme.mjs agents` / `hooks` / `cablage` | agents, hooks, branchement |
| `node scripts/agents/systeme.mjs fidelite <source> <notes…>` | condenser sans perdre citations ni nombres |
| `node scripts/agents/systeme.mjs note <f> --exiger … --contient …` / `existent <f…>` | critères usuels des voies |
| `node scripts/agents/systeme.mjs temoins` | chaque contrôle échoue sur son témoin négatif |
| `node scripts/agents/systeme.mjs appels <script> [--rejouer]` | avant de commiter un contrôle partagé : les critères des GATES qui l'appellent, rejoués (le hook cerveau le rappelle ; M15) |
| `node scripts/agents/verifier-page.mjs <page.html> [--page-lot] --captures <préfixe>` | une maquette (`etat.html`, GATES des voies) : rendu Chrome à 390 px, sans erreur de script ni défilement, images chargées. Avec `--page-lot` (ou une source sous `outils/pages/`), une page de version avant publication (un artefact neuf, 23.10) : en plus, lisible à 390 et 1280 px (date au titre, `#a-choisir` au premier écran, captures ≥ 340 px, texte ≥ 14 px, blocs ≤ 45 mots) |
| `node scripts/agents/systeme.mjs echoue "<JETON> ECHEC" -- node <contrôle> <args…>` | témoin négatif dans un GATES : tient si le contrôle échoue (code non nul) en imprimant son jeton ; un plantage ne compte pas |

Les contrôles d'interface vivent dans `work/refonte-frontend/v4/tournoi/outils/` (les `.mjs` y sont
versionnés), leurs pages témoins dans `tournoi/outils/temoins/` (versionnées par exception dans
`.gitignore`). Un script de critère posé dans `work/missions/` serait ignoré par git : seuls les
`.md` et `.json` des missions sont suivis.

## Limites connues
- Les types d'agents (`executant`, `auteur`, `relecteur`, `conseiller`) peuvent n'apparaître qu'au
  bout d'un moment, ou dans une session neuve. Avant cela, utiliser le repli `general-purpose` avec
  le modèle de la voie. `maxTurns` ne s'applique pas dans ce repli.
- Une session ouverte avant l'ajout des imports à CLAUDE.md garde l'ancienne copie de CLAUDE.md, et
  ses sous-agents aussi (essai du 22.10 : « ABSENT »). Une session neuve et ses sous-agents ont bien
  les leçons (essai `claude -p`, L09, L14 et L17 cités sans lecture).
- Les hooks sont repris en cours de session dès que `.claude/settings.json` existe. Pendant l'écriture
  d'un lot de notes qui se citent, le hook signale des liens vers des notes pas encore écrites : ces
  erreurs sont transitoires, et `systeme.mjs cerveau` fait foi à la fin.
- `systeme.mjs fidelite` vérifie la présence des chaînes, pas leur sens. Une valeur convertie
  (0.75rem → 12 px) est signalée : le pilote juge chaque alerte.
- L'approbation des commandes de critères (unlazy) est liée au PATH et au dossier. Une première
  vérification se fait avec `--approuver`, par le pilote qui a écrit ces commandes.
- Le conseil coûte dix appels (sept en mode rapide). Il ne se réunit pas deux fois sur la même
  question sans fait nouveau.
