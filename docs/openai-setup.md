# Configuration et lancement OpenAI du projet

## Où modifier quoi

| Source maintenue | Contenu | Chargement |
|---|---|---|
| `AGENTS.md` | Règles communes, contrats produit et routage | Entrée automatique du dépôt |
| `.agents/roles/sol.md` | Orchestration et intégration | Injecté dans le rôle natif Sol et le profil `sol-full` |
| `.agents/roles/astra.md` | Conception et revue externe | Injecté dans le profil `astra-review` |
| `.agents/roles/luna.md` | Livrable autonome délimité | Injecté dans le rôle natif Luna et le profil `luna-full` |
| `.agents/skills/*/SKILL.md` | Méthodes selon la tâche | Chargement ciblé, pas tous les skills |
| `docs/prompts/consultation-*.md` | Entrées d'une mission d'expertise | Brief rempli par le pilote |
| Registre propre à la mission | Dernières demandes, décisions, agents, preuves et reprise | Relu aux jalons et reprises utiles |

Les paramètres de modèle/effort/fenêtre restent dans les TOML natifs. Les blocs
`developer_instructions` sont générés depuis les rôles Markdown et portent leur
source : ne pas les maintenir comme une seconde version du rôle. Les définitions
des autres agents spécialisés restent indépendantes.

Choisir un modèle dans l'app n'applique pas à lui seul un rôle ou un profil CLI.
Dans une tâche principale sans rôle injecté, AGENTS.md route explicitement vers
le rôle de pilotage ; une consultation ou une sous-tâche explicite reçoit son rôle
propre. Le modèle global du PC est préservé par cette migration, pas remplacé par
une valeur déduite de cette table.

Claude conserve ses instructions dans `CLAUDE.md`/`.claude/`. Son rôle privé est
injecté par son pont ; OpenAI ne charge pas ces fichiers comme ses instructions.
Le protocole commun de transport est décrit dans [le guide du pont](claude-expert.md).
Partager documents métier, missions, sources et preuves, pas les préprompts privés.

## Modifier un rôle et vérifier la synchronisation

```powershell
node scripts/sync-agent-instructions.mjs --check
node scripts/sync-agent-instructions.mjs --write
node --test scripts/sync-agent-instructions.test.mjs
```

Le contrôle par défaut n'écrit rien et échoue en cas de dérive. La génération
modifie seulement les blocs de consignes et leur commentaire source dans les
cinq destinations connues. Elle ne remplace ni instructions système, ni modèles,
efforts, fenêtres, droits ou authentifications. Aucun hook ou framework ajouté.

Pour les profils déjà installés sur ce PC, passer explicitement leur dossier :

```powershell
node scripts/sync-agent-instructions.mjs --check --installed-root C:/Users/mrspa/.codex
node scripts/sync-agent-instructions.mjs --write --installed-root C:/Users/mrspa/.codex
```

Cela couvre les trois fichiers de profil existants, pas le `config.toml` global
ni une installation automatique. Pour une première installation, copier les
gabarits `.codex/profiles/*.config.toml` à la racine de `$CODEX_HOME` (ou
`~/.codex`), après inspection du contenu existant ; ne pas écraser des réglages
personnels. Le `config.toml` de projet ne définit pas de modèle/fenêtre, car ces
clés masqueraient les profils.

Les sessions actives ne rechargent pas les TOML. Transmettre le changement dans
la prochaine suite utile, sans recréer l'agent, interrompre son travail ou lancer
un modèle uniquement pour diagnostiquer la migration. Utiliser les métadonnées
d'une vraie mission pour confirmer le chargement effectif.

## Réglages conservés et limites observées

| Lancement | Modèle / effort | Fenêtre configurée / utile observée | Délégation |
|---|---|---|---|
| Profil `sol-full` et rôle Sol | GPT-6 Sol Max | 872000 / 828400 | Jusqu'à 9 Luna utiles |
| Profil `astra-review` | GPT-6 Astra Max | 421053 / 400000 | Aucune, lecture seule |
| Profil `luna-full` et rôle Luna | GPT-6 Luna Max | 872000 / 828400 | Aucune |
| Pont Claude | Opus 5.5 xhigh, Pro natif | Selon runtime ; 1M observé | Un Claude, relais Luna facultatif |

Les chiffres proviennent du catalogue local et des journaux du 24–26 septembre
2026. La part utile observée est de 95 %, arrondie à l'entier inférieur. Ce n'est
ni un essai de charge de la fenêtre entière ni une promesse pour un autre runtime.
Conserver la compaction native ; ne pas copier un seuil Astra vers Sol/Luna.

Limite observée du CLI 0.155.0-alpha.16.4 : les rôles directs changeaient modèle
et effort mais héritaient encore de la fenêtre du parent. Le processus séparé
`astra-review` a confirmé 400000 utiles. Garder cette voie pour Astra tant qu'une
nouvelle preuve ne justifie pas sa migration ; ne pas créer un rôle direct en
supposant la fenêtre isolée. La capacité maximale n'est pas un contexte à remplir.
[Bilan des profils et du pont](validation/agent-skills-astra-claude-2026-09-26.md).

## Lancer et reprendre sans créer un second pilote

```powershell
codex --profile sol-full
codex exec --profile astra-review --sandbox read-only --disable hooks --cd C:/Users/mrspa/Documents/Brasserie --output-last-message work/mission/astra-avis.md -
codex exec --profile luna-full --sandbox read-only --cd C:/Users/mrspa/Documents/Brasserie --output-last-message work/mission/luna-resultat.md -
```

Le dernier `-` lit un brief par stdin. Adapter le sandbox au mandat d'une Luna
de réalisation ; l'avis Astra reste en lecture seule. Ne pas importer un ancien
hook Codex qui appelle `.claude/` ; son absence de Git ne prouve pas sa désactivation
locale. L'ancien état de confiance signalé sur ce PC reste une limite documentée.

Pour une session CLI active, conserver son profil, son identité et son canal :

```powershell
codex queue --profile astra-review --sandbox read-only --thread <UUID-natif> --message "Différence et décision restantes"
```

Une mise en file n'est pas un travail reçu ou terminé. Vérifier réception ou
traitement dans les journaux de travail. En cas de refus `active writer`, résoudre
le canal existant, pas créer un remplaçant. Une session terminée peut être reprise
par `codex exec --profile <profil> resume <UUID-natif>` selon son mandat ; ne jamais
l'utiliser pour créer un second écrivain sur le Sol déjà actif.

Les agents natifs de Codex restent préférés pour les sous-tâches du pilote. Les
sessions séparées n'ont pas automatiquement la mémoire de l'app : transmettre un
relais utile, pas tout l'historique. La copie PC du profil et un nom de rôle ne
prouvent pas le modèle effectif : distinguer demandé, lancé et observé, conserver
UUID et session de commande, signaler toute valeur non exposée.

## Méthodes et expertise selon la mission

Les rôles définissent les responsabilités. Les briefs Astra/Claude préparent
demande, feedbacks, état des preuves et décision restante. Un skill apporte une
méthode sans changer le mandat ; ne pas réécrire le rôle dans chaque brief.

Le skill `unlazy` garde la profondeur du travail ; `caveman-lite` garde les bilans
concis. `brasserie-frontend` et `conception-generique` guident le résultat et sa
couverture. Les sources métier communes restent PRODUCT, DESIGN et le guide UI.

Choisir recherche locale, documentation officielle, navigateur, mesures ou
recherche approfondie selon l'incertitude. Deep Research n'est pas une étape
automatique ; vérifier l'outil réellement disponible et ses conditions avant de
le proposer. Un `/goal` suit un résultat explicite demandé, pas une garantie de
qualité ou de quota. Les contrôles de résultat restent nécessaires.

Pour passer d'un prototype à sa réalisation, garder dans le registre concept
retenu, contrats, interactions, sources actuelles, preuves et défauts ouverts.
Une session neuve reprend ce dossier ; elle ne réinitialise pas le quota.
Réutiliser les recherches datées ; actualiser seulement ce qui peut changer la
décision. Tests, builds et mesures mécaniques passent directement par les outils.
Les attentes natives évitent les tours répétés de surveillance.

## Vérification de la configuration

```powershell
node scripts/sync-agent-instructions.mjs --check
node --test scripts/sync-agent-instructions.test.mjs scripts/agent-launchers.test.mjs scripts/claude-expert.test.mjs scripts/sol-handoff.test.mjs scripts/luna-review.test.mjs
```

Contrôler YAML/TOML, liens, isolement et préservation des paramètres, puis utiliser
les journaux des prochains vrais travaux. Aucun appel modèle payant n'est requis
pour vérifier la génération. Les fichiers personnels d'authentification ne sont
ni copiés, ni régénérés, ni publiés. Les mémoires et plugins Claude restent séparés ;
les règles d'import de `.codex/config.toml` sont conservées.

[Registre de cette déduplication](validation/agent-instructions-dedup-2026-09-27.md).
