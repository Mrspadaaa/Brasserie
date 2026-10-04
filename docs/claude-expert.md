# Protocole du pont Claude / Sol

Ce guide décrit le lancement, les transferts et la récupération. Le rôle Claude
a une source unique, `.claude/roles/expert.md`, injectée par
`scripts/claude-expert-contract.mjs`, y compris en safe-mode. Les paramètres
techniques OpenAI sont documentés dans `docs/openai-setup.md` ; les instructions
privées des deux fournisseurs ne sont pas copiées d'un côté à l'autre.

## Préparer et lancer

### Profils CLI Pro et Team

Deux profils natifs sont préparés. `pro` définit `CLAUDE_CONFIG_DIR` dans
l'environnement du seul processus enfant vers `~/.claude-pro`. `team`
conserve le dossier existant `~/.claude`, ses conversations et la disposition
par défaut de ses métadonnées publiques : aucun override de ce répertoire.
Aucun credential n'est
copié et aucune variable globale n'est modifiée.

Depuis le dépôt :

```powershell
node scripts/claude-account.mjs team status
node scripts/claude-account.mjs pro login
node scripts/claude-account.mjs pro status
node scripts/claude-account.mjs team
node scripts/claude-account.mjs pro
```

La commande login est effectuée par l'humain, qui sélectionne son abonnement
Pro personnel. Les commandes sans sous-commande ouvrent le CLI interactif
Opus 5.5/xhigh après contrôle du profil. La connexion Team actuellement utilisée
ne doit pas être remplacée pour connecter Pro.

Les lots utilisent `--account team` (défaut) ou `--account pro` explicitement.
Le choix de ce drapeau revient automatiquement aux pilotes, selon le lot et
les quotas fiables de chaque profil. Il ne demande ni sélection manuelle du
compte ni nouvelle connexion à chaque changement. La connexion initiale de Pro
reste humaine ; une session expirée ou révoquée exige une nouvelle authentification.
Le préflight vérifie le plan exact et le dossier réellement annoncé par le
client, puis expose le profil, l'adresse et l'organisation publics. Même adresse
ou même organisation ne suffit pas à accepter le mauvais plan. Un profil absent
ou incorrect provoque un refus, sans bascule vers l'autre compte ni vers une API.
Les quotas et historiques se relisent dans le profil choisi. Une reprise reste
attachée à son profil et à son UUID ; aucune copie de credentials ou d'historique
entre profils pour la forcer.

La présence de deux profils connectables ne modifie pas les verrous de travail
ni les conditions humaines d'activation de plusieurs ponts. Le lot Team déjà
lancé continue dans son processus existant.

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
plus tard ; aucune bascule vers une clé/API facturée.

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
Un seul processus de travail du pont Claude à la fois sur le PC, toutes missions
confondues. Ne pas arrêter une session tierce pour contourner ce verrou.

Le mode edit travaille sur des copies ; le report vérifie les empreintes des
originaux. Un résultat `blocked`, une interruption ou un conflit ne vaut pas
autorisation d'intégrer. Examiner les diffs, rendre et jouer le parcours après
report. Le navigateur n'est pas fourni au Claude isolé.

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
Un verrou résiduel demande vérification du processus et de l'archive ; il n'est
pas supprimé automatiquement. Un manifeste `recovery.json` signale des copies,
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
