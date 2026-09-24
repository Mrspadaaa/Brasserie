# Base OpenAI de L'Affinée

Cette branche repart avec un `AGENTS.md` court, zéro skill local, zéro agent
personnalisé et zéro hook de projet. Le code de l'application, `CLAUDE.md` et
`.claude/` sont conservés. Les documents produit et design restent des références
métier communes, indépendantes du fournisseur de modèle.

## Démarrer

1. Redémarrer Codex pour recharger le réglage global de synchronisation, puis
   ouvrir le dossier de travail de la branche `codex/openai-clean-start` dans
   Codex. Ne pas continuer dans l'ancien dossier sur `main`.
2. Démarrer une nouvelle tâche dans ce dossier avec le modèle OpenAI souhaité,
   par exemple Astra. Ne pas reprendre ou forker une conversation antérieure :
   ses anciennes instructions font déjà partie de son historique.
3. Décrire le résultat attendu, le périmètre et un exemple qui permet de vérifier
   le résultat. Il n'est pas nécessaire de coller un préprompt de rôles ou de
   demander une liste de skills.

Exemple de demande :

> Dans l'étape Levure, rends le choix actuel et les différences entre candidats
> faciles à comprendre sur téléphone. Limite les changements à cette étape,
> préserve les calculs et termine l'implémentation ainsi que la vérification du
> parcours de sélection et d'enregistrement.

## Ce qui est chargé

| Source | Rôle |
| --- | --- |
| `AGENTS.md` | Consignes OpenAI propres au dépôt |
| `.codex/config.toml` | Isolation des plugins et mémoires pour ce projet |
| `.agents/skills/` | Répertoire de skills OpenAI, vide au départ |
| `PRODUCT.md`, `DESIGN.md`, `docs/ui-compacte.md` | Références produit à lire selon la tâche |
| `CLAUDE.md`, `.claude/` | Configuration réservée à Claude, sans import dans OpenAI |

Les instructions natives de Codex et les réglages de modèle, raisonnement et
permissions de l'utilisateur sont conservés. Aucun remplacement du prompt
système via `model_instructions_file` n'est introduit.

## Préserver la séparation

Le projet désactive les cinq plugins `@claude-plugins-official` présents lors de
l'audit, interdit les noms de fichier de repli pour les consignes et désactive
l'utilisation ainsi que la génération de mémoires Codex. Il ne désinstalle rien
du compte et ne supprime aucune mémoire. Les plugins OpenAI restent disponibles.

La synchronisation d'agents externes est un réglage de l'application Codex,
distinct de Git. Sur cette machine, `desktop.external-agent-import-sync-enabled`
a été mis à `false` dans `~/.codex/config.toml`, après sauvegarde. Ce changement
concerne Codex globalement et ne modifie pas Claude. L'option « mises à jour
automatiques » de Réglages > Import doit rester désactivée pour empêcher de
recopier les fichiers Claude dans `.agents/` ou `.codex/`.

La valeur enregistrée a été relue par un nouveau processus Codex. Son application
immédiate dans la fenêtre desktop déjà ouverte n'est pas établie : le redémarrage
ci-dessus garantit son rechargement. Le rapport de validation distingue ces deux
points.

Sur une autre machine, vérifier les consignes globales, les skills utilisateur,
les plugins installés et cette synchronisation. La configuration du dépôt
s'applique aux projets approuvés par Codex ; un projet non approuvé peut ignorer
sa configuration `.codex/`. Ne pas déclarer l'isolation effective sur la seule
base de la présence d'un fichier.

Ne pas recopier dans cette branche les anciens dossiers `.agents/skills/`,
`.codex/agents/` ou `.codex/hooks.json` depuis un autre checkout. En particulier,
Git conserve les fichiers non suivis lors d'un changement de branche : utiliser
le worktree propre évite de reprendre les essais non versionnés de `main`.

Cette séparation de configuration n'est pas un contrôle d'accès au disque.
Elle ne retire pas non plus le contexte déjà présent dans une conversation.

## Sources et validation

Les recommandations OpenAI pour Astra privilégient les consignes spécifiques au
projet, des skills ciblés et une définition claire du résultat, sans empiler les
anciennes recettes de travail : [Rethinking skills and prompts for GPT-6 Astra](https://learn.chatgpt.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).

La découverte des consignes et des skills, ainsi que les options de configuration,
sont documentées par OpenAI : [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[skills](https://learn.chatgpt.com/docs/build-skills),
[configuration](https://learn.chatgpt.com/docs/config-file/config-reference).
Le réglage global d'import est décrit dans [Import from another agent](https://learn.chatgpt.com/docs/import).

Voir [les critères et les résultats vérifiés](validation/openai-clean-start.md).
