# Remise à zéro OpenAI — critères de réussite

Ce document conserve la preuve de la première passe de remise à zéro.
La mise en place des nouveaux rôles, skills et écrans est suivie dans
[le contrat Houblons/Levure](recipe-ux-gates.md). Les résultats ci-dessous
décrivent le commit initial, avant cette seconde passe.

Demande : disposer d'une branche utilisable par Codex / GPT / Astra avec des
consignes propres à OpenAI, sans réimporter la configuration Claude.

## Critères définis avant modification

- [x] Branche isolée ; code applicatif, configuration Claude et travail en cours
  dans le dossier d'origine préservés.
- [x] `AGENTS.md` réécrit : contexte métier utile, autonomie dans le périmètre,
  preuves adaptées ; aucune méthode ni lecture de skill Claude imposée.
- [x] Aucun ancien skill, agent personnalisé ou hook actif dans les emplacements
  OpenAI du dépôt ; aucun renvoi automatique vers les sources Claude.
- [x] Configuration effective contrôlée : plugins Claude désactivés pour ce
  projet, mémoires antérieures non injectées, import automatique traité.
- [x] Procédure de démarrage dans une nouvelle tâche documentée, avec les limites
  entre configuration du dépôt, réglages de l'application et historique existant.

## Vérification prévue

Inspection du diff Git et des fichiers découverts, puis interrogation en lecture
seule de `config/read` et `skills/list` sur le serveur local Codex. Aucun appel de
génération, déploiement ou test sur les données de la brasserie n'est nécessaire.
## Résultats du 24 septembre 2026

La branche `codex/openai-clean-start` a été rebasée sans conflit sur
`e6204aae8c23ec4f700c38f38a781005e9fdf330` (`origin/main`, PR #11 et #12 fusionnées),
après confirmation de la tâche responsable de la remise à jour Git. Celle-ci a
préservé les 299 fichiers locaux dans le stash nommé
`codex: preserve pre-sync Brasserie worktree 2026-09-24`. Cette refonte n'a ni
appliqué ni supprimé ce stash.

Le diff par rapport à cette base ne modifie ni `src/`, ni `functions/`, ni
`tests/`, ni `CLAUDE.md`, ni `.claude/`, ni les trois documents métier. Le checkout
principal est propre et synchronisé avec `origin/main`. `git diff --check` et
le contrôle d'ascendance de la branche réussissent.

Le skill local `unlazy` a été retiré de `.agents/skills/`. Les sept autres copies
de skills, quatre agents et le hook importés n'étaient pas versionnés dans la
base : ils n'ont pas été copiés dans ce worktree. La copie Claude d'unlazy reste
intacte. Aucun nouveau skill générique ne remplace ces workflows.

Le contrôle utilise `codex-cli 0.155.0-alpha.16.4`, dans un processus enfant
`codex app-server --stdio` lancé depuis le worktree, sans override de configuration.
Après `initialize`, les requêtes sont :

```json
{"method":"config/read","params":{"cwd":"<worktree OpenAI>","includeLayers":true}}
{"method":"skills/list","params":{"cwds":["<worktree OpenAI>"],"forceReload":true}}
```

| Contrôle | Résultat observé |
| --- | --- |
| Configuration projet | Couche `.codex/config.toml` chargée, non ignorée |
| Consignes de repli | `project_doc_fallback_filenames = []` |
| Plugins du catalogue Claude | Les cinq entrées sont `enabled = false`, origine projet |
| Mémoire | `features.memories`, `memories.use_memories` et `memories.generate_memories` à `false`, origine projet |
| Catalogue de skills | 14 entrées actives : 6 système, 8 plugins OpenAI ; 0 skill local ou Claude ; aucune erreur de découverte |
| Agents et hooks locaux | Aucun `.codex/agents/` ni `.codex/hooks.json` |
| Configuration globale | `AGENTS.md` global vide ; aucun agent, hook ou skill utilisateur externe détecté lors de l'audit |

La seule modification hors Git est la désactivation de
`desktop.external-agent-import-sync-enabled` dans la configuration utilisateur
Codex, par `config/value/write` avec contrôle de version. Une copie du fichier
avant modification est conservée localement sous
`~/.codex/.tmp/openai-clean-start-20260924/`. Comparaison avant/après : cette seule
valeur passe de `true` à `false` ; aucun autre réglage n'est changé. La relecture
`config/read` confirme `false`.

Une revue indépendante des nouveaux fichiers n'a relevé aucune dépendance Claude
ni promesse d'isolation excessive. Aucun appel de génération, déploiement ou test
applicatif n'a été lancé pour cette refonte de configuration.

## Limites de cette preuve

Le contrôle établit la configuration lue par un processus Codex neuf sur cette
machine. Il ne mesure pas la qualité d'une future réalisation frontend avec
Astra. Il ne garantit pas un contrôle d'accès au disque ni les réglages d'une
autre machine.

La fenêtre Codex déjà ouverte peut conserver le réglage de synchronisation en
mémoire. Redémarrer l'application, puis commencer une nouvelle tâche dans le
worktree de la branche : une conversation reprise ou forkée conserverait son
ancien contexte. Ce redémarrage n'a pas été imposé pendant les tâches actives.
