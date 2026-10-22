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
| Président du conseil | idem | Opus (Fable si lourd) | 15 tours | verdict en cinq parties | décider à la place du brasseur |
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
- La mémoire locale de Claude (`~/.claude/projects/…/memory/`) reste en place. Le cerveau en est la
  copie partagée et versionnée. En cas d'écart, le cerveau prime pour les agents.
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

## Décider : la grille

| Type de décision | Exemples | Décideur | Trace |
|---|---|---|---|
| Vérifiable | un chemin, un format, un test, une valeur mesurable | la **voie** (son critère) | GATES.md |
| Technique réversible | structure d'un fichier, ordre des voies, choix d'outil | le **pilote** | MISSION.md ; `decisions.md` si structurant |
| Lourde, déléguée, réversible | architecture d'un outil, conventions du moteur, rattachement des données, coût de calcul, priorités | le **conseil** puis le pilote applique | `cerveau/decisions/…`, ligne D-n |
| Goût et choix | quelle variante, quel picto, l8 ou l5, ce qu'il voit au doigt | le **brasseur**, sur des variantes montrées (le conseil prépare et filtre). Un choix ouvert devient un axe de variantes du lot suivant, jamais une question qui bloque le lot (L24) | SPEC-BRASSEUR, mot pour mot |
| Irréversible ou externe | push, PR, merge, déploiement, données réelles, Gemini facturé, suppression, comptes, réglages | l'**utilisateur**, groupé, sans bloquer le reste | registre, « en attente » |

Sans réponse, on applique la lecture étroite et réversible (L01) et on continue. On ne pose aucune
question bloquante.

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
   Une voie d'interface passe par un relecteur.
7. **Signature** : la section « Signature » de MISSION.md, puis un commit local.

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
