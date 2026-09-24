# Agents de L'Affinée

## Socle natif et séparation

`AGENTS.md` contient les consignes OpenAI. Trois skills ciblés : Unlazy,
Caveman lite et Brasserie frontend, dans `.agents/skills/`. Aucun hook ou
remplacement des instructions système. L'import externe est désactivé ; les
cinq plugins du catalogue Claude sont désactivés dans Codex, globalement et
pour ce projet. Leurs caches et la configuration/authentification Claude restent
préservés. Les consignes et mémoires des fournisseurs ne sont pas échangées.
Les besoins métier, documents produit, code, captures et résultats sont communs.

Une conversation ancienne conserve son contexte. Une nouvelle tâche dans le
worktree propre charge les nouveaux réglages ; redémarrer Codex si l'import
reste en mémoire, sans interrompre une autre tâche active.

## Modèles et délégation

| Rôle | Modèle / effort | Contexte configuré | Délégation |
| --- | --- | --- | --- |
| Pilote | GPT-6 Astra Max | 272000 bruts, ~258400 utiles | Au plus 2 Sol et 9 Luna directs |
| Profil `sol-full` | GPT-6 Sol Max | 872000 bruts, 828400 utiles | Au plus 9 Luna |
| Profil `luna-full` | GPT-6 Luna Max | 872000 bruts, 828400 utiles | Sous-tâche terminale |
| Frontend Claude | Claude Opus 5.5 Max | CLI natif | Un Claude ; jusqu'à 9 Luna via relais |

Les fenêtres Sol/Luna correspondent au maximum du catalogue Codex local vérifié
le 24 septembre 2026. La compaction conserve le comportement natif ; aucun seuil
Astra n'est copié. Recontrôler ces valeurs lors d'un changement du runtime.
Le maximum API annoncé ailleurs ne prouve pas sa disponibilité dans Codex.
Deux tours natifs éphémères ont confirmé ces modèles, l'effort Max et
`modelContextWindow = 828400` avec les valeurs de rôle passées explicitement.
Ce contrôle de configuration ne constitue pas un essai de charge à 828400 tokens.

**Limite constatée du CLI 0.155.0-alpha.16.4 :** les rôles changent bien le modèle
et l'effort, mais leur `model_context_window` ne remplace pas la fenêtre du
parent. Un vrai essai Astra → Sol → Luna a conservé 258400 tokens utiles.
Ne pas confondre une valeur écrite dans le TOML avec une valeur appliquée.

Les profils natifs `sol-full.config.toml` et `luna-full.config.toml`, installés
à la racine de `$CODEX_HOME` (habituellement `~/.codex`), démarrent leur propre
processus avec la grande fenêtre. Les gabarits versionnés sont dans
`.codex/profiles/`. Le projet ne redéfinit pas modèle, fenêtre ou plafond total,
car sa priorité masquerait le profil ; le fichier utilisateur conserve Astra
Max avec 272000 tokens bruts et 11 enfants. Les profils ne copient aucun secret,
catalogue système ou réglage de permission.

```powershell
codex exec --profile sol-full --cd C:/chemin/Brasserie "Mission précise, fichiers attribués et vérifications attendues"
codex exec --profile luna-full --cd C:/chemin/Brasserie "Vérification indépendante et bornée"
```

Depuis Sol avec sa fenêtre complète, le rôle `luna` garde cette fenêtre et
désactive toute délégation supplémentaire. Le serveur natif `app-server`
refuse `--profile` dans cette version : passer les mêmes valeurs avec `-c`
si cet outil est utilisé. La chaîne Sol → Luna ainsi lancée a été vérifiée à
828400 tokens utiles pour les deux modèles. Les fichiers de rôle gardent
l'intention de fenêtre, sans prétendre résoudre le défaut du runtime à eux seuls.

Le profil CLI a aussi été vérifié directement : un Sol Max a lancé une Luna Max
pour une lecture indépendante, tous deux à 828400 tokens utiles. Luna a terminé ;
le contrôleur du diagnostic a ensuite arrêté le parent à 120 s, sans attendre
son bilan. Ce délai appartient au diagnostic, pas aux profils de travail.
Un lancement direct `luna-full` a terminé normalement. Les instructions propres
aux profils et au rôle enfant figurent dans les métadonnées de ces sessions.

Les plafonds natifs sont 11 enfants pour Astra et 9 pour Sol ; la répartition
2 Sol / 9 Luna est inscrite aux consignes : le runtime ne fournit pas de quota
distinct par modèle, le pilote doit donc respecter cette répartition. Deux niveaux permettent
Astra → Sol → Luna. La capacité du client déjà lancé peut rester inférieure :
procéder par vagues, sans réduire le travail utile ni lancer le maximum par défaut.

Chaque délégation précise résultat, fichiers, dépendances et preuves. Pour le
frontend, joindre les trois documents produit/design et les composants concernés,
avec l'objectif de boosters UX/UI, richesse métier et densité lisible.

## Claude natif sur abonnement

`scripts/claude-frontend.mjs` utilise le CLI officiel et son authentification
`claude.ai`, avec `--model claude-opus-5-5 --effort max`. `--safe-mode` écarte
les anciens prompts, skills, hooks et MCP. Aucun jeton n'est extrait ou transmis
à un SDK. Les variables d'API/fournisseur tiers sont retirées seulement de
l'environnement enfant. Ne pas employer `--bare`, qui désactive l'abonnement.

Avant une session, vérifier dans Claude → Usage que les crédits supplémentaires
sont désactivés. Le diagnostic CLI confirme l'abonnement, pas ce réglage de
facturation. Un échec de quota reste un échec, sans basculement API.

```powershell
node scripts/claude-frontend.mjs --diagnose
node scripts/claude-frontend.mjs --brief C:/temp/mission.txt --output C:/temp/revue.json
```

La revue dispose uniquement de lecture/recherche. Pour une correction, utiliser
un checkout isolé et `--mode edit --allow-file src/ui/Fichier.tsx` pour chaque
fichier confié. Relire les changements, les intégrer puis les retester. Le
lanceur impose un seul processus de travail Claude à la fois.
Il fournit aussi une consigne Caveman lite propre à cette session : compte rendu
concis, profondeur et preuves conservées, sans importer les skills OpenAI.

## Assistance Luna depuis Claude

`scripts/luna-review.mjs` lance 1 à 9 missions via le CLI Codex natif,
GPT-6 Luna Max, en lecture seule, au maximum du catalogue local. Chaque mission
exprime un besoin de travail ; les préprompts Claude ne sont pas importés.
L'authentification et les instructions restent celles de Codex.

Le fichier JSON contient une liste d'objets `id` et `prompt`. Le parent prépare
les missions dans un dossier temporaire. Avec `--with-luna`, Claude peut lancer
ce relais comme unique commande shell autorisée puis lire ses résultats Markdown.
Il peut demander une autre vague justifiée ; un verrou de processus impose
d'attendre la précédente et conserve au plus neuf Luna dans ce relais Claude.
Chaque Sol utilise ses propres sous-agents natifs, avec son plafond de neuf.
Aucun plafond artificiel de tokens, de temps ou de passes utiles.

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
[effort Claude](https://code.claude.com/docs/en/model-config#adjust-effort-level).
