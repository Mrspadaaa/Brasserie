# Protocole du pont Claude / Sol

Ce guide décrit le lancement, les transferts et la récupération. Le rôle Claude
a une source unique, `.claude/roles/expert.md`, injectée par
`scripts/claude-expert-contract.mjs`, y compris en safe-mode. Les paramètres
techniques OpenAI sont documentés dans `docs/openai-setup.md` ; les instructions
privées des deux fournisseurs ne sont pas copiées d'un côté à l'autre.

## Préparer et lancer

### Profil Team, profil Pro conservé

Consigne humaine du 6 octobre : les prochains travaux Claude utilisent
uniquement Team. Aucun lancement, préflight ni repli Pro, y compris après une
vraie limite Team : conserver le travail et remonter le retour natif au
contrôleur, sans changer de compte, de modèle ni d'effort. L'annonce d'un quota
« quasi illimité » n'est pas une mesure native.

`team` conserve le dossier existant `~/.claude`, ses conversations et la
disposition par défaut de ses métadonnées publiques : aucun override de ce
répertoire. Le profil personnel `pro` (`CLAUDE_CONFIG_DIR` vers `~/.claude-pro`,
dans l'environnement du seul processus enfant) reste en place avec ses
artefacts ; ses credentials et sa configuration ne sont ni modifiés ni
supprimés. Les commandes humaines Pro `status` et `login` restent disponibles.
Les nouveaux lots, sessions interactives et préflights Pro sont refusés avant
toute découverte du CLI ou inspection du compte. Les leases Pro historiques
restent lisibles et protégées. Aucun credential n'est copié et aucune variable
globale n'est modifiée.

Depuis le dépôt :

```powershell
node scripts/claude-account.mjs team status
node scripts/claude-account.mjs team
```

La commande sans sous-commande ouvre le CLI interactif Opus 5.5/xhigh après
contrôle du profil. Elle passe par la même admission machine que les lots (voir
« Coordination de plusieurs lots ») : sa portée (fichiers, `/resume` interne)
n'étant pas déclarable, elle est exclusive, refusée si un lot est actif et
bloquant tout autre lot jusqu'à sa fermeture. `status` ne réserve rien ; une
commande `login`, toujours humaine, réserve exclusivement son profil sans
compter comme lot Opus et est refusée tant qu'un lot utilise ce profil.

Les lots utilisent `--account team` (défaut).
Le préflight vérifie le plan exact et le dossier réellement annoncé par le
client, puis expose le profil, l'adresse et l'organisation publics. Même adresse
ou même organisation ne suffit pas à accepter le mauvais plan. Un profil absent
ou incorrect provoque un refus, sans bascule vers l'autre compte ni vers une API.
Les quotas et historiques se relisent dans le profil choisi. Une reprise reste
attachée à son profil et à son UUID ; aucune copie de credentials ou d'historique
entre profils pour la forcer.

Ni deux profils connectables, ni un libellé ou marqueur d'interface n'activent
plusieurs lots : seule l'activation enregistrée par le contrôleur le fait. Un
lot déjà lancé continue dans son processus existant.

Référence : [plusieurs comptes dans le CLI officiel](https://code.claude.com/docs/en/authentication#log-in-with-multiple-accounts).

### Lot confié à Claude

Distinguer les copies à réaliser et les références à lire : répéter
`--allow-file chemin/relatif.ts` pour chaque fichier modifiable, et
`--reference-file references/chemin.ts` pour chaque entrée en lecture seule.
Un dossier présent dans le candidat n'est pas transféré implicitement :
chaque fichier de référence doit être déclaré. Les chemins relatifs gardent
leur emplacement sous le workspace restreint ; une référence absolue extérieure
est copiée sous `attachments/`, au chemin annoncé par le manifeste.

La préflight `--dry-run` et `request.json` listent les deux catégories avec
taille, SHA256 et `readOnly`. Les références sont archivées dans `inputs/`,
copiées et vérifiées dans `workspace/`, disponibles à Read, exclues des
autorisations d'édition et explicitement refusées par une règle Edit(path).
Le report vers les sources ne les copie jamais : si une copie de référence
a néanmoins changé, tout report est refusé avant la première écriture et
la récupération conserve la distinction `readOnly`. Cela ne transforme pas
les permissions du CLI en isolation système générale.

Les limites restent communes aux deux catégories : 128 fichiers, 128 Kio
par texte, 8 Mio par image et 32 Mio au total. Un fichier trop grand provoque
un refus explicite ; aucun dossier n'est silencieusement omis. Pour une copie
récupérée trop grande, fournir des fragments complets ordonnés ou un diff
complet, avec empreinte du fichier reconstitué, sans troncature. Avant une
reprise utile, comparer la liste des entrées attendues au manifeste et vérifier
les copies réellement préparées, sans appel modèle de diagnostic.

Préparer `docs/prompts/consultation-claude.md` avec livrable, feedbacks/réserves,
état de référence, ownership et preuves utiles. Garder les sources nécessaires
accessibles ; une tranche exploitable peut précéder les autres raccords.

Le pont utilise uniquement le CLI officiel et l'authentification native
`claude.ai` par abonnement (Pro, Max, Team ou Enterprise), avec Opus 5.5 xhigh.
Le navigateur ne sert plus à envoyer ou réaliser les lots Claude. Les anciens
noms de transport « pont Pro » ne prouvent pas l'identité du compte.
Aucun SDK facturé ni changement de modèle/effort implicite.
`--safe-mode` exclut les personnalisations hors politique administrée ;
`--restricted` borne les outils aux copies. Les variables d'API tierces sont
retirées de l'environnement enfant, pas de l'environnement utilisateur.
Ces modes ne sont pas une isolation système des commandes relayées : celles-ci
restent limitées par leur commande autorisée et le sandbox propre au relais.
Ne pas utiliser `--bare`, qui change le mode d'authentification. Le diagnostic
CLI ne confirme pas les crédits supplémentaires : vérifier leur désactivation
dans Claude Usage avant un travail susceptible de dépasser le quota, en réutilisant
une mesure récente fiable. Si le quota manque, conserver le travail et reprendre
plus tard ; aucune bascule vers une clé/API facturée, vers Pro, un autre modèle
ou un autre effort. Le retour de quota reste le retour natif : aucun tour génératif
de diagnostic ni pause déduite d'un pourcentage.

`node scripts/claude-expert.mjs --diagnose` lit seulement la version et
`auth status --json`. Il affiche le chemin du CLI et l'identité publique
disponible (adresse, organisation), sans appel modèle ni lecture de credentials.
Il trouve aussi les installations Desktop Windows sous version/empreinte/claude.exe.
L'organisation observée compte autant que l'adresse pour comparer deux connexions ;
une même adresse peut appartenir à plusieurs espaces. Un libellé d'abonnement
n'est pas une mesure du quota restant.

```powershell
node scripts/claude-expert.mjs --brief work/mission/brief.md --output work/mission/avis-01.json --sol-thread <UUID-du-Sol-existant> --allow-file src/exemple.ts --dry-run
node scripts/claude-expert.mjs --brief work/mission/brief.md --output work/mission/avis-01.json --sol-thread <UUID-du-Sol-existant> --allow-file src/exemple.ts
```

`--dry-run` valide la préparation et les arguments sans appeler le modèle ; il
ne prouve pas la disponibilité du quota ou les outils effectivement exposés.
Le destinataire peut venir de `CODEX_THREAD_ID`. Sans UUID, ou si l'UUID fourni
diffère du Sol appelant, le lanceur refuse ; ne pas contourner ce garde.

Pour une réalisation, ajouter `--mode edit` et les fichiers explicites du lot.
Sol prépare les fichiers nouveaux autorisés si nécessaire. Limites actuelles :
128 fichiers, brief 24 Kio, texte 128 Kio/fichier, image 8 Mio/fichier,
ensemble 32 Mio ; ces protections ne sont pas des objectifs de taille.
Le plafond par défaut est de 30 tours en revue, 60 en réalisation, ajustable par
`--max-turns` selon le besoin. Une valeur explicite reste exacte. Un arrêt
`error_max_turns` indique cette limite locale, pas l'épuisement de l'abonnement.
Sur le PC, un lot du pont Claude à la fois par défaut. Après qualification et
activation explicite par le contrôleur, jusqu'à deux lots Team Opus 5.5/xhigh
simultanés, avec conversations, sorties et fichiers modifiables disjoints (voir
« Coordination de plusieurs lots »). Une troisième admission, une ressource en
collision ou un état ambigu est refusé avant lancement. Ne supprimer aucun
verrou ou lease actif et ne pas arrêter une session tierce pour contourner un refus.

Le mode edit travaille sur des copies ; le report vérifie les empreintes des
originaux. Un résultat `blocked`, une interruption ou un conflit ne vaut pas
autorisation d'intégrer. Examiner les diffs, rendre et jouer le parcours après
report. Le navigateur n'est pas fourni au Claude isolé.

## Coordination de plusieurs lots

`scripts/claude-coordination.mjs` admet chaque lot (`claude-expert.mjs`,
`claude-frontend.mjs`) et chaque session `claude-account.mjs` avant toute
archive ou processus. État machine sous `%TEMP%/laffinee-claude-coordination/` :
mutex court `mutex.lock`, leases `active/<id>.json`, leases terminées
`released/`, activations et mutex récupérés `history/`. Rien n'est supprimé
automatiquement. Tous les ponts doivent partager le même `%TEMP%`, comme
l'ancien verrou ; `--dry-run` affiche la racine utilisée et un instantané
d'admission (`coordination`), qui ne réserve rien.

**Ressources réservées** de l'admission jusqu'au report terminé ou à une
récupération explicite :

- conversation `session:<UUID>` exclusive. Une session neuve reçoit son UUID
  avant le spawn (`--session-id`, documenté par la référence CLI officielle ;
  fixable par `--session-id <UUID>` au lanceur) ; une reprise réserve l'UUID de
  `--resume`. `session.json` enregistre `reservedSessionId` et
  `sessionMatchesReservation` ; un écart bloque la publication, conserve le
  résultat, les copies et le manifeste de récupération, et retient les originaux
  modifiables jusqu'à inspection explicite (`claude_session_mismatch`) ;
- sortie et ses fichiers associés (`.progress`, `.recovery`, `.expert`,
  `.artifacts`), exclusifs ;
- originaux modifiables, exclusifs : ce sont les cibles réelles du report, pas
  les copies. Deux copies différentes d'un même original entrent en conflit ;
- références en lecture seule, partagées : plusieurs lots peuvent les lire,
  mais un lot qui les modifierait est refusé ;
- profil, partagé par les lots, exclusif pour `login`.

Le Sol parent (`solThread`) est seulement enregistré : plusieurs lots d'un même
Sol sont admis si leurs ressources sont disjointes. La session interactive ne
peut pas déclarer ses ressources : elle est exclusive.

**Domaine d'identité : fichier physique.** Chemin réel natif (liens
symboliques, jonctions, noms courts 8.3, casse Windows, chemins relatifs, points
et espaces finaux) plus identité volume/index du fichier (liens durs). Le même
chemin logique dans deux worktrees désigne deux fichiers physiques distincts :
pas de conflit au pont, la convergence se traite à l'intégration Git selon
l'ownership attribué par Sol.

**Capacité.** Un lot par défaut. Deux seulement avec une activation valide et
non expirée, et seulement si tous les lots comptés sont Team /
`claude-opus-5-5` / `xhigh` ; plafond codé à deux. Une activation illisible,
élargie ou expirée vaut un. Aucun libellé, marqueur d'interface ou compte
connecté n'en tient lieu.

**Activation par le contrôleur**, après réception de la qualification locale et
selon son propre registre (`agent-checks.json` n'est pas modifié par le pont) :

```powershell
node scripts/claude-coordination.mjs status
node scripts/claude-coordination.mjs activate --until "<fin ISO8601 de la fenêtre autorisée>" --authorized-by "<référence de la décision humaine>" --evidence "<rapport de qualification>"
node scripts/claude-coordination.mjs deactivate
```

La fin respecte toujours la fenêtre autorisée et l'arrêt coordonné du projet.
L'activation dure au plus 72 h, se renouvelle explicitement et ne survit pas
implicitement à un arrêt de maintenance : la désactiver avant l'arrêt et ne la
réactiver qu'après nouvelle décision. Les lots déjà admis ne sont jamais
interrompus par une désactivation ; seules les nouvelles admissions sont limitées.

**Verrou historique.** `%TEMP%/laffinee-claude-frontend.lock` reste la barrière
des anciens lanceurs : tant qu'une lease existe, la coordination y maintient
son marqueur, qui fait refuser l'ancienne version. Un verrou numérique (ancien
lanceur), vide (création interrompue) ou inconnu fait refuser toute admission,
sans modification. La migration se fait donc à une frontière où les anciens
lanceurs sont arrêtés et leurs artefacts conservés.

**Cycle d'une lease.** `admitted` → `spawning` (écrit avant le spawn) →
`running` (PID et heure de création du processus Claude) → libérée après report
ou réponse. Si des brouillons modifiés n'ont pas été reportés (blocage, budget,
quota, conflit, report partiel), la lease devient `retained` : capacité et
conversation sont libérées pour une reprise, les originaux restent réservés.
Une libération n'agit que sur la lease de son propriétaire (jeton).

**Récupération, toujours manuelle :**

```powershell
node scripts/claude-coordination.mjs status
node scripts/claude-coordination.mjs recover --lease <id>
node scripts/claude-coordination.mjs recover --lease <id> --confirm-no-child
node scripts/claude-coordination.mjs release --lease <id> --reason "<inspection des copies>"
node scripts/claude-coordination.mjs recover-mutex
```

`recover` exige que le propriétaire et, s'il est enregistré, le processus Claude
soient absents ou remplacés (PID présent mais heure de création différente) ;
un état vivant ou non résolu est refusé. Une lease `spawning` sans PID exige la
vérification humaine `--confirm-no-child`. La lease récupérée devient `retained`
si elle réservait des originaux. `release` libère une lease `retained` après
inspection de l'archive et du manifeste, avec motif conservé. `recover-mutex`
suit la même preuve ; un `recovery.lock` résiduel se vérifie manuellement.

Pour reprendre un lot interrompu sur les mêmes fichiers : inspecter, `release`,
puis relancer avec `--resume <UUID>` et une nouvelle sortie.

Limites : protocole coopératif local, pas une frontière contre un processus
malveillant ; un enfant Claude orphelin après un arrêt brutal du lanceur garde
sa lease jusqu'à récupération. Les tests locaux utilisent des processus Node
inertes : ils ne prouvent ni deux sessions natives simultanées, ni la portée
native de `--session-id`, à confirmer par `sessionMatchesReservation` lors des
premiers lots réels, après activation.

## Aide native Sonnet optionnelle

L'autorisation humaine du 3 octobre permet à Opus 5.5 d'utiliser Sonnet 5.5.
Ajouter `--with-sonnet` à un lot utile pour lui exposer le sous-agent natif
`general-purpose`. Le modèle enfant est explicitement configuré
`claude-sonnet-5-5`, avec la variable native de forçage ; le pilote reste
`claude-opus-5-5` / xhigh. Ces réglages ne modifient que l'environnement enfant.
Il s'agit d'une aide sur le même compte, pas d'une réserve de quota distincte.

Le sous-agent reçoit les outils et permissions déjà bornés du lot : lecture
seule en revue, copies explicitement autorisées en réalisation. L'option
n'ajoute ni terminal général, ni MCP, ni navigateur. Le relais Luna reste une
option séparée avec sa commande exacte. Le helper travaille au premier plan,
sans redélégation ; Opus lui attribue une tâche et des fichiers sans écriture
concurrente, puis reçoit son résultat. Opus garde la conception et la livraison.
Le helper natif évite de dépendre de définitions personnalisées désactivées
par `--safe-mode`.

Le préflight prouve la configuration, pas l'utilisation de Sonnet. Relever les
événements Agent et les modèles effectivement retournés par le prochain travail
utile. Ne pas lancer une sonde générative pour obtenir cette preuve, ni masquer
un refus ou une substitution native de modèle.

## Renfort Luna lorsque le lot s'y prête

Décision humaine du 3 octobre : Opus doit employer Luna `gpt-6-luna` / MAX
dès qu'une sous-tâche utile et autonome s'y prête, en réutilisant les acteurs
et résultats déjà disponibles. Opus conserve sa capacité de conception et de
réalisation, ainsi que la réception et la synthèse ; déléguer ne le réduit pas
à un planificateur. Une impossibilité ou l'absence de décomposition utile se
signale brièvement, sans inventer une consultation pour remplir un quota.

`--with-luna` fournit la commande exacte de `scripts/luna-review.mjs`, pour
1 à 9 investigations indépendantes en lecture seule. Claude écrit les missions
dans `luna-tasks.json`. Les opérations mécaniques relèvent des outils ; les
tests et travaux de réalisation avec écriture reviennent au même Sol pour
attribution aux Luna, puis leurs preuves à Opus. Le relais direct reste en
lecture seule. Sonnet 5.5 est complémentaire, pas un remplacement implicite
de Luna. Choisir les sous-tâches selon leur utilité et les quotas réellement
observés des deux fournisseurs ; aucun gain chiffré n'est garanti.

Le pont déclare seulement la commande exacte de ce relais pour Bash. Cette
configuration ne prouve pas une frontière stricte : le vrai flux FOND du
3 octobre a aussi accepté des commandes de lecture générales dans le workspace
et une lecture Git de HEAD. Ne pas les prendre pour les sources courantes fournies,
ni affirmer que tout autre Bash est techniquement impossible. Aucune ouverture
générale supplémentaire n'est autorisée ; vérifier les diffs contre les originaux
courants et conserver cette réserve jusqu'à correction du transport.

Le relais synchrone a aussi atteint la limite de 600000 ms du Bash natif : un
index encore running après ce timeout ne prouve ni activité ni décès des enfants,
et aucun rapport ne doit être déclaré reçu sans sa trace finale. Inventorier et
récupérer la vague existante avant toute relance. Le correctif du cycle durable
reste à recevoir ; ne pas modifier un processus en cours pour contourner le timeout.

Si le CLI bascule un travail en arrière-plan, TaskOutput ne peut servir que s'il
est effectivement exposé ; sa présence dans les arguments ne le prouve pas.
Sinon, conserver les références et rendre la main au même Sol. Aucun polling
Read ou parcours du JSONL complet pour attendre. Lire `luna/results.json` puis
la synthèse utile. Les Luna lisent le dépôt courant, Claude des copies : vérifier
la correspondance avant de prendre leurs résultats pour validation de ces copies.

## Retour au Sol appelant

`<sortie>.expert.json` expose `advice_ready`, `needs_sol` ou `blocked`.
Ces statuts décrivent un avis, des travaux ou une limite, pas une livraison produit.
Pour `needs_sol`, le pont rend la main au parent sans mise en file ni attente
circulaire. Sol lit et accuse réception des dossiers `requestDir` :

```powershell
node scripts/sol-handoff.mjs accept --request-dir <dossier-de-la-demande>
node scripts/sol-handoff.mjs complete --request-dir <dossier-de-la-demande> --result work/mission/resultat-sol.json
```

Le résultat suit `scripts/sol-handoff-result.schema.json` : `completed`,
`needs_expert` ou `blocked`, résumé, preuves `{ref, detail}` et questions ouvertes.
`completed` exige une preuve, dont la pertinence reste à vérifier par le pilote.
Identité du thread et empreinte de requête sont contrôlées ; ce protocole coopératif
n'est pas une frontière contre un processus local malveillant.

L'avis expert reste l'instantané du retour. Lire `sol-handoff status` pour l'état
courant des demandes et garder l'original, même après leur traitement.

## Claude autonome vers le Sol existant

Préparer `{objective, mode, ownedFiles, checks, sourceArtifacts}`. `mode` vaut
`review` ou `implement` ; une réalisation attribue ses fichiers. `checks` contient
des critères à examiner, jamais des commandes à exécuter aveuglément.

```powershell
node scripts/sol-handoff.mjs send --thread <UUID-du-Sol-existant> --request work/mission/demande-sol.json --output-dir work/mission/transferts --cwd C:/Users/mrspa/Documents/Brasserie
node scripts/sol-handoff.mjs status --request-dir <dossier-UUID-retourné>
```

Le relais emploie uniquement `codex queue` : aucun nouveau Sol ni second écrivain
`exec/resume`. `queued` ne veut pas dire accepté ou terminé ; une sortie ambiguë
vaut `unknown`, sans nouvel essai automatique. Sans UUID ou canal disponible,
garder le dossier et signaler le blocage. Une Luna peut relayer les faits par un
canal natif disponible vers ce même Sol, avec preuve de réception ; ne pas répéter
sans diagnostic la commande déjà refusée. Le transfert ne modifie pas les droits.

## Artefacts, quotas et reprise

Chaque sortie réserve exclusivement `<sortie>.artifacts/` : brief, prompt injecté,
empreintes/originaux `inputs/`, copies `workspace/`, `transcript.jsonl`, réponse
brute et identifiant natif. Vagues Luna et transferts gardent traces et résultats.
La persistance native Claude reste activée. Aucun nettoyage automatique ni
réutilisation d'une sortie existante après réussite, échec ou réception.

Après interruption, inspecter ces données avant une suite avec nouvelle sortie.
Pour continuer la même conversation, transmettre `--resume <UUID-Claude-natif>`
et un nouveau chemin `--output`. La reprise de conversation ne reporte pas les
fichiers : examiner d'abord les copies sauvegardées et leur manifeste, préparer
les entrées exactes de la suite et préserver les originaux. Un `sourceDiffers`
à `false` signifie que la source n'a pas changé depuis le lancement ; cela ne
signifie pas que la copie produite est identique à cette source.
Un verrou historique, un mutex ou une lease résiduels demandent vérification du
processus (PID et heure de création) et de l'archive ; ils ne sont pas supprimés
automatiquement (voir « Coordination de plusieurs lots »). Après un arrêt de
maintenance, aucune reprise n'est automatique. Un manifeste `recovery.json` signale des copies,
pas leur validation ou leur report. Ce qui n'est jamais arrivé du serveur n'est
pas récupérable ; sauvegarder les dossiers contre une perte de disque.

Les fichiers de progression peuvent être incomplets : confronter processus,
résultat et artefacts en cas de contradiction. Ne pas relancer sur un compteur seul.
Une erreur d'écriture de progression est signalée et retentée à l'événement
ou au battement suivant ; elle ne désactive plus définitivement les mises à jour.
Le résultat natif terminal reste la référence si le fichier de progression
n'a pas pu être écrit. Conserver les anciennes traces, même périmées.
Lire un état natif de quota ou une mesure datée ; tokens, cache et prix API estimé
ne mesurent pas directement le quota Pro. Aucun gain chiffré promis sans mesure.
Une session neuve ne réinitialise pas le quota du compte.

Références techniques : [CLI Claude](https://code.claude.com/docs/en/cli-reference),
[sous-agents natifs](https://code.claude.com/docs/en/sub-agents),
[usage et cache](https://code.claude.com/docs/en/costs).
