# Protocole du pont Claude / Sol

Ce guide décrit le lancement, les transferts et la récupération. Le rôle Claude
a une source unique, `.claude/roles/expert.md`, injectée par
`scripts/claude-expert-contract.mjs`, y compris en safe-mode. Les paramètres
techniques OpenAI sont documentés dans `docs/openai-setup.md` ; les instructions
privées des deux fournisseurs ne sont pas copiées d'un côté à l'autre.

## Préparer et lancer

Préparer `docs/prompts/consultation-claude.md` avec livrable, feedbacks/réserves,
état de référence, ownership et preuves utiles. Garder les sources nécessaires
accessibles ; une tranche exploitable peut précéder les autres raccords.

Le pont utilise le CLI officiel et l'authentification native `claude.ai` Pro,
Opus 5.5 xhigh. Aucun SDK facturé ni changement de modèle/effort implicite.
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
Le plafond est de 30 tours par défaut, ajustable par `--max-turns` selon le besoin.
Un seul processus de travail du pont Claude à la fois sur le PC, toutes missions
confondues. Ne pas arrêter une session tierce pour contourner ce verrou.

Le mode edit travaille sur des copies ; le report vérifie les empreintes des
originaux. Un résultat `blocked`, une interruption ou un conflit ne vaut pas
autorisation d'intégrer. Examiner les diffs, rendre et jouer le parcours après
report. Le navigateur n'est pas fourni au Claude isolé.

## Relais Luna optionnel

`--with-luna` fournit la commande exacte de `scripts/luna-review.mjs`, pour
1 à 9 investigations indépendantes en lecture seule. Claude écrit les missions
dans `luna-tasks.json`. Les opérations mécaniques relèvent des outils ; les
tests et travaux de réalisation peuvent revenir à Sol pour attribution.

Bash est limité à ce relais, pas à un terminal général. L'exécuter au premier
plan. Si le CLI le bascule en arrière-plan, TaskOutput ne peut servir que s'il
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
Un verrou résiduel demande vérification du processus et de l'archive ; il n'est
pas supprimé automatiquement. Un manifeste `recovery.json` signale des copies,
pas leur validation ou leur report. Ce qui n'est jamais arrivé du serveur n'est
pas récupérable ; sauvegarder les dossiers contre une perte de disque.

Les fichiers de progression peuvent être incomplets : confronter processus,
résultat et artefacts en cas de contradiction. Ne pas relancer sur un compteur seul.
Lire un état natif de quota ou une mesure datée ; tokens, cache et prix API estimé
ne mesurent pas directement le quota Pro. Aucun gain chiffré promis sans mesure.
Une session neuve ne réinitialise pas le quota du compte.

Références techniques : [CLI Claude](https://code.claude.com/docs/en/cli-reference),
[usage et cache](https://code.claude.com/docs/en/costs).
