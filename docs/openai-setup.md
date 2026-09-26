# Agents de L'Affinée

## Socle natif et séparation

`AGENTS.md` contient les consignes OpenAI. Les skills de `.agents/skills/`, dont
Unlazy, Caveman lite, Brasserie frontend et Conception générique, sont choisis
selon le mandat. Aucun hook ou
remplacement des instructions système. L'import externe est désactivé ; les
cinq plugins du catalogue Claude sont désactivés dans Codex, globalement et
pour ce projet. Leurs caches et la configuration/authentification Claude restent
préservés. Les consignes et mémoires des fournisseurs ne sont pas échangées.
Les besoins métier, documents produit, code, captures et résultats sont communs.

Une conversation ancienne conserve son contexte. Une nouvelle tâche dans le
worktree propre charge les nouveaux réglages ; si l'interface conserve un choix
manuel de modèle, sélectionner Sol Max. Redémarrer Codex si l'import reste en
mémoire, sans interrompre une autre tâche active.

## Modèles et délégation

| Rôle | Modèle / effort | Contexte configuré | Délégation |
| --- | --- | --- | --- |
| Défaut du PC et pilote | GPT-6 Sol Max | 872000 bruts, 828400 utiles | Au plus 9 Luna utiles |
| Profil `sol-full` | GPT-6 Sol Max | 872000 bruts, 828400 utiles | Au plus 9 Luna utiles |
| Profil `astra-review` | GPT-6 Astra Max | 421053 bruts, 400000 utiles | Aucun enfant ; avis ciblé |
| Profil `luna-full` | GPT-6 Luna Max | 872000 bruts, 828400 utiles | Sous-tâche terminale |
| Claude, tâches précises surtout frontend | Claude Opus 5.5 xhigh | CLI natif | Retour au même Sol ; relais Luna facultatif |

Les fenêtres Sol/Luna correspondent au maximum du catalogue Codex local vérifié
le 24 septembre 2026 : 872000 tokens bruts, dont 95 % utiles (828400). À la demande
du 26 septembre, Astra passe à 421053 bruts pour disposer de 400000 tokens utiles.
Le catalogue local annonce pour Astra un maximum de 872000 bruts et une part
utile de 95 % ; la valeur utile est arrondie à l'entier inférieur. La compaction conserve le comportement
natif ; aucun seuil Astra n'est copié à Sol ou Luna. Recontrôler ces valeurs lors
d'un changement du runtime. Le maximum API annoncé ailleurs ne prouve pas sa
disponibilité dans Codex. Les métadonnées `modelContextWindow` observées avant
ce réglage corroborent les valeurs Sol/Luna, sans constituer un essai de charge
de la fenêtre entière. La confirmation du nouveau profil Astra et les limites
de l'essai figurent dans le [registre de validation](validation/agent-skills-astra-claude-2026-09-26.md).

**Limite constatée du CLI 0.155.0-alpha.16.4 :** les rôles changent bien le modèle
et l'effort, mais leur `model_context_window` ne remplace pas la fenêtre du
parent. Un essai antérieur Astra → Sol → Luna a conservé 258400 tokens utiles.
Ne pas confondre une valeur écrite dans le TOML avec une valeur appliquée.

Les profils natifs `sol-full.config.toml`, `astra-review.config.toml` et
`luna-full.config.toml`, installés à la racine de `$CODEX_HOME`
(habituellement `~/.codex`), démarrent leur propre
processus avec leur propre fenêtre. Les gabarits versionnés sont dans
`.codex/profiles/`. Le projet ne redéfinit pas modèle, fenêtre ou plafond total,
car sa priorité masquerait le profil ; le fichier utilisateur choisit Sol Max,
872000 tokens bruts et au plus 9 enfants. Les profils ne copient aucun secret,
catalogue système ou réglage de permission.

```powershell
codex exec --cd C:/chemin/Brasserie "Mission précise, fichiers attribués et vérifications attendues"
codex exec --profile sol-full --cd C:/chemin/Brasserie "Mission Sol explicite"
codex exec --profile astra-review --sandbox read-only --cd C:/chemin/Brasserie "Décision ciblée, options et preuves pertinentes"
codex exec --profile luna-full --cd C:/chemin/Brasserie "Vérification indépendante et bornée"
```

### Démarrage et suivi d'une session

La demande courante définit le travail. « Lis ton .md » renvoie à `AGENTS.md`
et à ce guide de fonctionnement ; les missions ci-dessous sont des exemples à
activer explicitement. Un POC UX ne devient pas une refonte complète de Levure.

Au démarrage et au premier retour de chaque délégué, noter le modèle, l'effort,
la fenêtre et le mode de lancement réellement observables. Le TOML seul prouve
une intention. Dans les journaux natifs, `turn_context` expose modèle/effort ;
`event_msg.token_count.info.model_context_window` expose la fenêtre utile quand
elle est présente. Extraire ces champs et les résultats nécessaires sans charger
les journaux entiers dans la conversation. Une valeur absente reste non vérifiée ;
ne pas multiplier les tours de diagnostic si une session de travail fournit la preuve.

Conserver dans le registre de mission le moyen de suivi correspondant au lancement :

| Lancement | Suivi et suite |
| --- | --- |
| Agent natif de collaboration | Identifiant retourné ; outils de statut et de message de cette collaboration. |
| Processus `codex exec --profile ...` | Session de commande pour attendre sa sortie ; UUID natif pour une suite CLI ; rapport de fin et preuve du résultat. |

Le 24 septembre 2026, l'app a refusé un message vers une session CLI active avec
`already has an active writer`. Le canal installé `codex queue` a accepté la suite :

```powershell
codex queue --profile luna-full --sandbox workspace-write --thread <UUID-natif> --message "Suite précise de la mission"
```

L'exemple conserve le profil et le sandbox de la Luna concernée ; utiliser ceux
du destinataire réel. Vérifier l'identifiant de message retourné, puis sa lecture
ou son traitement dans la session/le bilan. Une mise en file ne prouve pas une
prise en compte immédiate. Ne pas lancer un deuxième processus écrivain ou un
agent remplaçant pour le même travail. Une session terminée peut être reprise
avec `codex exec --profile <profil> resume <UUID-natif>` et une mission ciblée.

Ces règles de suivi s'appliquent indépendamment des prototypes et de leurs
rapports, qui restent dans leurs branches de travail.

Pour passer d'une exploration à une implémentation, ouvrir une session Sol Max
avec un relais court : concept retenu et chemin des artefacts, décisions métier,
interactions à conserver, fichiers concernés, tests déjà joués et défauts ouverts.
La nouvelle session vérifie les sources actuelles sans relire tout l'historique
ni refaire les variantes validées. Une contradiction nouvelle justifie une
consultation ciblée. La capacité de contexte complète n'est pas un objectif
de remplissage et une session neuve ne réinitialise pas le quota du compte.

Exécuter directement tests, builds et captures par outils. Déléguer les travaux
autonomes qui demandent un jugement, pas une simple attente. Utiliser les
notifications ou attentes natives plutôt que des tours répétés de surveillance ;
un changement, un échec ou une décision justifie la reprise. Les rapports courts
renvoient aux preuves sur disque, sans recopier les journaux volumineux.

### Exemple de nouvelle session pour la refonte Levure

Après la fusion de la PR14, ouvrir une nouvelle session sur `main` synchronisé.
Prompt exact à donner à Sol Max :

> Exécute la mission `docs/prompts/refonte-levure.md` après la fusion de la PR14, depuis `main` synchronisé.

Option si l'utilisateur demande explicitement un [Goal](https://learn.chatgpt.com/docs/long-running-work) pour cette mission longue et bornée :

> Crée un goal pour exécuter `docs/prompts/refonte-levure.md` jusqu'aux critères de livraison vérifiés, sans déploiement ni modification des données réelles.

Le mode `/goal`, disponible en desktop/CLI selon cette documentation, suit
résultat, contraintes, vérification et pause/reprise. Il ne garantit ni qualité
ni économie et ne change pas modèle ou effort. Ne créer un goal que sur demande
explicite ; aucun goal dans les consultations Astra ou tâches ponctuelles par
défaut, et aucune limite de tokens inventée. Le prompt normal reste valide.

`AGENTS.md` est le point d'entrée automatique ; le prompt désigne la mission à
lire explicitement. Les autres markdown ne sont consultés que si cette mission
ou les consignes applicables les rendent pertinents. La reprise se fait dans le
registre de la mission indiqué par ce prompt.

Depuis Sol avec sa fenêtre complète, le rôle `luna` garde cette fenêtre et
désactive toute délégation supplémentaire. Astra reçoit un brief et les preuves
pertinentes dans un processus `astra-review` distinct ; il peut investiguer les
sources et implémentations pertinentes en lecture seule, sans reprendre
l'implémentation générale ni l'orchestration. Le serveur natif `app-server`
refuse `--profile` dans cette version : un `thread/start` avec des valeurs
explicites ne prouve donc pas à lui seul le chargement d'un profil. Les fichiers
de rôle gardent l'intention de fenêtre, sans résoudre ce défaut du runtime à
eux seuls.

Un contrôle antérieur du profil CLI a montré qu'un Sol Max lance une Luna Max
pour une lecture indépendante, tous deux à 828400 tokens utiles. Luna a terminé ;
le contrôleur du diagnostic a ensuite arrêté le parent à 120 s, sans attendre
son bilan. Ce délai appartient au diagnostic, pas aux profils de travail.
Un lancement direct `luna-full` a terminé normalement. Les instructions propres
aux profils et au rôle enfant figurent dans les métadonnées de ces sessions.

Le plafond natif du pilote Sol est de 9 enfants, sans quota par modèle ; ses
consignes n'autorisent que des Luna utiles. Le profil Astra désactive les
sous-agents. La capacité d'un client déjà lancé peut rester inférieure :
procéder par vagues, sans lancer le maximum par défaut.

Chaque délégation précise résultat, fichiers, dépendances, faits déjà établis et
preuves attendues. Pour le frontend, pointer les parties pertinentes des trois
documents produit/design et les composants concernés, avec l'objectif de boosters
UX/UI, richesse métier et densité lisible. Ne pas recopier l'historique entier.

### Économie de travail sans réduire les exigences

Sol pilote un bloc cohérent jusqu'aux corrections et vérifications. Astra Max
peut éclairer toute mission si l'incertitude, le coût d'une erreur ou le besoin
de recul le justifie : architecture, données, métier/UX, diagnostic, performance
ou options. Pour un travail à risque, l'avis de cadrage avant les choix coûteux
et la revue des risques restants du parcours intégré sont deux jalons utiles,
sans limiter d'autres consultations motivées. Astra enquête en lecture seule et
propose une solution avec preuves et limites ; Sol tranche, réalise et intègre.
En conception frontend importante, faire intervenir Astra dès le cadrage :
objectif du brasseur, données et capacités existantes, défauts observés et
questions ouvertes suffisent à une première mission. Il peut contester les
hypothèses et proposer un meilleur parcours avant la réalisation des maquettes.
Lui transmettre ensuite les concepts évaluables et les différences pertinentes
pour éclairer l'arbitrage de Sol, puis les risques restants dans le parcours intégré. Adapter ces
interventions aux décisions : ni quota minimal d'appels, ni revue finale unique
par défaut. Un audit de raccords techniques ne vaut pas revue métier/UX.
Fournir un dossier court ; tracer les constats, arbitrages et vérifications.
La présence d'une session Astra ou d'un rapport ne valide pas les critères
restés sans preuve. Fréquence utile et taille du contexte sont deux choix
distincts ; ne pas renvoyer tout l'historique pour une nouvelle question ciblée.
Le [préprompt de consultation](prompts/consultation-astra.md) précise les entrées,
le rôle d'expert et la preuve de contribution à reporter par Sol. Les profils
natifs et le rôle Sol renvoient à ce contrat ; les sessions déjà lancées doivent
recevoir la correction explicitement, une édition du TOML ne les recharge pas.
Le brief comporte un socle court et des rubriques conditionnelles ; une question
technique n'impose pas les rubriques de revue visuelle. Un skill apporte ses
critères sans transférer à Astra l'implémentation, les installations ou la
délégation. Astra rend un avis concret et poursuit les lectures utiles ; si une
preuve sort de son mandat, Sol reçoit le contrôle à effectuer et tient le registre.
Les étapes de réalisation et de vérification restent applicables à Sol/Luna.
Pour mettre à jour Astra, comparer le gabarit du dépôt et la copie installée à
la racine de `$CODEX_HOME`, préserver les réglages étrangers à ce profil, puis
vérifier le contrat chargé et la fenêtre utile dans une session de travail neuve.
Luna peut posséder un livrable borné de recherche, réalisation, test ou
vérification, avec contrats clairs, fichiers attribués et preuve. Escalader les
ambiguïtés structurantes ; ne pas confondre la revue de l'auteur avec une
vérification indépendante. Adapter le nombre de Luna aux places et besoins.

Le délégué retourne résultat, fichiers, preuves consultables, limites et décisions
attendues. Sol contrôle les contrats à risque sans refaire l'exploration.
Privilégier `rg` ciblé, scripts déterministes, tests/typage/build adaptés et
navigateur réel pour l'UX ; utiliser le connecteur ou CLI déjà pertinent,
regrouper les lectures indépendantes et garder les gros journaux en artefacts.
Réutiliser les agents pour les suites liées, vérifier leur état avant d'en créer
d'autres et ne rejouer un contrôle que pour un changement ou une incertitude.
Les résultats et les appels d'outils ne sont pas supposés gratuits.

### Recherche approfondie et Deep Research

Une recherche approfondie peut combiner `web__run` et des agents quand plusieurs
sources ou hypothèses doivent être confrontées pour décider. Elle se termine
quand les preuves et leurs limites suffisent, pas après un nombre de pages fixé.
Conserver un rapport sourcé avec dates et inconnues, réutiliser les recherches
datées et ne réactualiser que les faits qui l'exigent ; résumer la décision à Sol.

Le produit [Deep Research](https://learn.chatgpt.com/docs/web-search) est décrit
côté Work/plugin et sa disponibilité dépend du compte. Constat de cette tâche :
`web__run` est disponible, mais aucun outil Deep Research dédié ne figure dans
`ALL_TOOLS`. Ne pas supposer un appel natif dans chaque sous-agent ni installer
un plugin ou une API pour cette discipline.

Une fenêtre de 828400 tokens utiles n'oblige pas à la remplir. La brièveté de
Caveman lite concerne la communication ; elle ne plafonne pas le raisonnement.

Les processus natifs résolvent ici l'héritage de fenêtre ; ils ne créent pas de
quota distinct. Selon la [documentation Codex](https://learn.chatgpt.com/docs/pricing),
modèle, contexte, raisonnement, outils et cache influencent l'usage ; le tarif
des crédits ne se convertit pas directement en consommation de l'abonnement.
Ne pas attribuer une variation du quota global à un seul agent lorsque d'autres
tâches tournent. Aucun gain en pourcentage n'est annoncé sans comparaison fiable.

## Claude natif sur abonnement

Le circuit courant est désormais décrit dans [Claude expert](claude-expert.md) :
Sol orchestre ; Astra reste son collaborateur expert de premier recours.
Claude reçoit des lots précis surtout frontend, sans passage Astra préalable ni
double expertise automatiques. Le point d'entrée
`scripts/claude-expert.mjs` utilise le pont ci-dessous en ajoutant ce contrat.

`scripts/claude-frontend.mjs` utilise le CLI officiel (version >= 2.1.280) et
son authentification `claude.ai` **Pro**. Les arguments fixent
`--model claude-opus-5-5 --effort xhigh`, avec la même valeur dans
`CLAUDE_CODE_EFFORT_LEVEL` pour le processus enfant. Ce choix remplace Max à la
demande de l'utilisateur du 24 septembre 2026 ; il ne modifie pas les réglages
globaux d'une session Claude ouverte séparément.
`--safe-mode` écarte les personnalisations Claude hors politique administrée ;
`--restricted` borne les
outils de fichiers au dossier de copies durable de la mission. Aucun jeton n'est extrait
ou transmis à un SDK. Les variables d'API/fournisseur tiers sont retirées
seulement de l'environnement enfant. Ne pas employer `--bare`, qui modifie le
mode d'authentification. Le diagnostic contrôle `authMethod`, `apiProvider`,
`apiKeySource` et la version ; il n'appelle pas le modèle.
Il affiche le modèle et l'effort **configurés**, sans démontrer que le compte
peut terminer une consultation sur ce modèle.

Avant une session, vérifier dans Claude → Usage que les crédits supplémentaires
sont désactivés. Le diagnostic CLI confirme l'abonnement, pas ce réglage de
facturation. Un échec de quota reste un échec, sans basculement API.

```powershell
node scripts/claude-frontend.mjs --diagnose
node scripts/claude-frontend.mjs --brief C:/temp/mission.txt --output C:/temp/revue.json --dry-run
node scripts/claude-frontend.mjs --brief C:/temp/mission.txt --output C:/temp/revue.json --allow-file docs/validation/vue-390.png --max-turns 30
```

`--cwd` choisit la racine des fichiers relatifs. Chaque `--allow-file` fournit
une **copie** ciblée, y compris une capture PNG/JPEG/WebP/GIF/AVIF. En revue,
Claude peut lire ces copies ; sans fichier, aucun outil n'est disponible. Pour
une correction, passer `--mode edit --allow-file src/ui/Fichier.tsx` pour chaque
fichier confié. Claude ne peut éditer que les copies nommées. Le lanceur ne
reporte les fichiers modifiés qu'après avoir vérifié que les originaux n'ont pas
changé depuis leur copie ; une collision conserve les copies et signale un conflit.
Relire ces changements et les retester. Il impose un seul processus de travail
Claude à la fois. En mode édition, il n'ajoute pas de nouveaux fichiers au dépôt.

Le brief est limité à **24 Kio UTF-8** : un dépassement produit une erreur,
sans troncature. Au plus 128 fichiers par mission, chacun limité à 128 Kio de
texte ou 8 Mio d'image, pour 32 Mio au total. Fournir des extraits pertinents
plutôt qu'un gros fichier. `--max-turns` est un budget de **tours de la mission**,
30 en revue comme en édition par défaut ; choisir un entier positif adapté à la
mission. Ce plafond ne demande pas de consommer tous les tours : terminer dès
que le livrable et les critères confiés sont satisfaits. Les appels qui précisent
explicitement une limite plus basse la conservent ; revoir ces arguments pour
les missions substantielles. L'atteinte de ce budget et l'atteinte du quota Claude sont rapportées
séparément. Une autre mission n'est lancée que pour un besoin identifié.

Le résultat final reste dans le JSON demandé. Pendant l'appel,
`<output>.progress.json` expose l'activité utile : état, horodatages, lectures,
tentatives d'édition, erreurs d'outils, refus et reprises. Il ne contient ni le
raisonnement privé, ni le brief, ni le contenu des fichiers. Distinguer la fin
du travail du modèle du report effectif de ses modifications.

Un arrêt sur la limite de tours ne signifie pas qu'aucun fichier n'a été
produit. En cas d'échec, consulter `<output>.recovery.json` et les copies
conservées avant de relancer une génération. Le manifeste indique les fichiers
modifiés, leurs empreintes et les conflits éventuels avec les originaux. Une
copie récupérable reste à examiner et tester ; elle n'est ni validée ni reportée
automatiquement. Récupérer ensemble l'artefact et ses données de référence pour
éviter de l'évaluer avec des fixtures différentes de celles utilisées par Claude.

### Lots frontend complets, expertise ciblée et données conservées

Sol collabore d'abord avec Astra Max. Claude intervient sur des tâches précises,
surtout frontend, sans attendre un échec, en Opus 5.5 xhigh. Employer
`scripts/claude-expert.mjs` et le contrat de [retour au même Sol](claude-expert.md).
Ce lanceur ajoute une sortie structurée et un destinataire existant ; `needs_sol`
rend la main au pilote, sans créer un autre Sol ni attendre en boucle.

Le mode `edit` du lanceur expert permet à Claude de concevoir et réaliser un lot
frontend complet, sur les fichiers explicitement confiés. Sol/Luna préparent les
faits et prennent en charge le navigateur, les tests et l'intégration.
Le lanceur ne donne pas de navigateur à Claude : lui fournir les captures réelles
et les données de référence pertinentes, sans préprompt OpenAI.

Toutes les consultations conservent désormais une archive durable à côté de la
sortie : brief, prompt, sources originales, fichiers de travail, flux partiels,
résultat et identifiants. La persistance native Claude est active. Aucun nettoyage
automatique au succès ou à l'échec ; une sortie existante est refusée. Après
interruption, inspecter les éléments récupérables avant une suite ciblée.

Le budget de tours suit la mission (défaut 30). Garder xhigh et un seul Claude
actif ; les retours ne sont pas des validations produit. Sol/Astra résolvent
d'abord les points ouverts. Reconsulter Claude seulement pour une décision
précise qui justifie son coût, jamais par rituel ou pour régénérer des artefacts.

Le CLI reçoit `--tools` (aucun, `Read`, ou `Read,Edit,Write` selon la mission),
`--allowedTools` pour approuver la lecture des copies et les chemins d'édition
nommés, `--permission-mode dontAsk --permission-prompts none`, et
`--disallowedTools mcp__*`. `--with-luna` ajoute seulement l'écriture du fichier
de missions et la commande exacte du relais. `--safe-mode` et `--restricted`
réduisent le contexte et les capacités CLI ; ils ne constituent pas une isolation
du système d'exploitation pour la commande relayée. `--dry-run` affiche les
arguments, fichiers, tailles et statut d'authentification sans appeler Opus.

Le CLI ne fournit pas de plafond du quota Pro ou des tokens par cette commande.
`--max-budget-usd` plafonne les dépenses **API** en mode print, pas l'abonnement ;
le lanceur ne l'emploie pas. Contrôler les crédits supplémentaires dans Claude →
Usage. Aucun repli vers une clé/API n'est prévu.
Il fournit aussi une consigne Caveman lite propre à cette session : compte rendu
concis, profondeur et preuves conservées, sans importer les skills OpenAI.

## Assistance Luna depuis Claude

`scripts/luna-review.mjs` lance 1 à 9 missions via le CLI Codex natif,
GPT-6 Luna Max, en lecture seule, au maximum du catalogue local. Chaque mission
exprime un besoin de travail ; les préprompts Claude ne sont pas importés.
L'authentification et les instructions restent celles de Codex.

Le fichier JSON contient une liste d'objets `id` et `prompt`. Le parent prépare
les missions dans son dossier durable. Avec `--with-luna`, Claude peut lancer
ce relais comme unique commande shell autorisée puis lire ses résultats Markdown.
Il peut demander une autre vague justifiée ; un verrou de processus impose
d'attendre la précédente et conserve au plus neuf Luna dans ce relais Claude.
Chaque Sol utilise ses propres sous-agents natifs, avec son plafond de neuf.
Chaque vague conserve ses fichiers sous un UUID. `results.json` pointe vers le
manifeste de la dernière vague ; lire les chemins de ce manifeste. Le statut
`response_received` exige une session identifiée, un événement de fin de tour,
une sortie CLI zéro et un résultat frais non vide. Il ne vaut pas validation métier.
Un verrou existant n'est pas supprimé automatiquement. Une réponse ancienne ne
peut pas se substituer au résultat d'une vague en échec.
Les contextes natifs Sol/Luna restent ceux vérifiés plus haut (872000 configurés,
828400 effectifs) ; les bornes de brief et de tours concernent le seul lanceur
Claude et ses missions, pas le travail global de l'équipe.

```powershell
node scripts/luna-review.mjs --tasks C:/temp/missions.json --output-dir C:/temp/luna --dry-run
node scripts/luna-review.mjs --tasks C:/temp/missions.json --output-dir C:/temp/luna
```

## Vérification

Contrôler la configuration et les skills dans un nouveau processus Codex,
valider les rôles et exécuter `node --test scripts/agent-launchers.test.mjs`.
La bonne configuration des agents ne remplace pas la revue visuelle et les
parcours réels de l'application.

Références : [sous-agents Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents),
[configuration Codex](https://learn.chatgpt.com/docs/config-file/config-reference),
[CLI Claude](https://code.claude.com/docs/en/cli-reference),
[permissions Claude](https://code.claude.com/docs/en/permissions#read-and-edit),
[variables d'environnement Claude](https://code.claude.com/docs/en/env-vars),
[effort Claude](https://code.claude.com/docs/en/model-config#adjust-effort-level).
