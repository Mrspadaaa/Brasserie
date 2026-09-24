# Pilotage Sol et consultation Astra — validation

Demande du 24 septembre 2026 : Sol Max pilote avec la fenêtre complète ; Astra
Max donne un avis sur les décisions dans un processus séparé, à environ 258400
tokens utiles ; Luna Max soutient Sol avec la fenêtre complète. Claude Opus 5.5
xhigh sur Pro et son relais restent inchangés.

## Critères et responsabilités

- [x] Défaut du PC Sol Max installé ; seules les clés de modèle/fenêtre et le
  plafond d'enfants autorisé ont changé dans la configuration utilisateur.
- [x] Profil `astra-review` séparé à 272000 tokens bruts, sans sous-agent ;
  profils Sol/Luna à 872000 tokens bruts.
- [x] `AGENTS.md`, les profils et la mission Levure décrivent Sol pilote,
  Astra consultant et les Luna ciblées, sans nouveau rôle Astra trompeur.
- [x] Configuration résolue et tours natifs courts vérifiés ; limites des
  métadonnées d'exécution consignées ci-dessous.
- [x] Revue Luna ciblée et contrôle final du diff.

Sol possède `.codex/config.toml`, `.codex/agents/sol.toml`, les commentaires du
rôle Luna, `.codex/profiles/sol-full.config.toml`, le nouveau profil Astra,
`AGENTS.md`, `docs/openai-setup.md`, la mission Levure et ce registre. Les copies
installées sont `C:/Users/mrspa/.codex/config.toml`, `sol-full.config.toml` et
`astra-review.config.toml`. Luna relit seulement le diff et les preuves ; elle
ne modifie aucun fichier. Aucune UI applicative n'a été touchée.

## Valeurs et méthode

| Cible | Modèle / effort | Fenêtre brute | Fenêtre utile |
| --- | --- | ---: | ---: |
| Défaut du PC et `sol-full` | `gpt-6-sol` / `max` | 872000 | 828400 |
| `astra-review` | `gpt-6-astra` / `max` | 272000 | 258400 |
| `luna-full` et enfants du pilote Sol | `gpt-6-luna` / `max` | 872000 | 828400 |

Le catalogue local `C:/Users/mrspa/.codex/models_cache.json`, récupéré le
24 septembre 2026 à 17:33 UTC pour le client 0.155.0, annonce un maximum de
872000 tokens bruts et 95 % de fenêtre utile pour les trois modèles. Les
valeurs utiles ci-dessus correspondent à ce pourcentage, et concordent avec
les métadonnées `modelContextWindow` déjà observées : Sol/Luna 828400 dans
`laffinee-recipe-ux/model-windows-new-process.json` (14:27 UTC, valeurs de
fenêtre passées explicitement) ; Astra Max 258400 dans
`laffinee-recipe-ux/native-role-flags-result.json` (15:02 UTC, alors configuré
à 272000). Ces mesures antérieures ne prouvent pas, à elles seules, le
chargement des profils nouvellement installés et ne sont pas des essais de
charge à pleine fenêtre.

## Contrôles effectués sur la nouvelle installation

- Sauvegardes **avant écriture** hors dépôt dans
  `C:/Users/mrspa/AppData/Local/Temp/laffinee-yeast-prep-20260924/sol-pilot-backup-20260924`.
  La comparaison octet par octet a confirmé que, dans `~/.codex/config.toml`,
  seules `model`, `model_context_window` et
  `agents.max_concurrent_threads_per_session` ont changé. L'effort `max`,
  `agents.max_depth = 2`, les clés d'authentification, permissions et connexions
  restent tels qu'avant.
- `app-server config/read` dans un processus neuf, avec couches chargées :
  projet, utilisateur et système ; défaut résolu `gpt-6-sol`, `max`, 872000,
  agents activés, plafond 9, profondeur 2, sous-agent par défaut `gpt-6-luna`
  en `max`. `thread/start` sans génération a rapporté `gpt-6-sol` / `max` pour
  ce défaut.
- `codex exec --strict-config --ephemeral --json` a exécuté un tour minimal
  « OK, aucun outil » avec le défaut puis avec `--profile astra-review`, en
  lecture seule pour ce dernier. Les deux tours ont terminé avec code 0, sans
  outil ni enfant. Le profil Astra utilisé est le fichier natif
  `~/.codex/astra-review.config.toml`, identique au gabarit versionné ; il
  fixe `gpt-6-astra`, `max`, 272000 et `agents.enabled = false`. La référence
  [Codex config](https://learn.chatgpt.com/docs/config-file/config-reference)
  définit ce chargement par `--profile` depuis `$CODEX_HOME`.
- Le flux JSON de `codex exec` ne publie pas directement son modèle, son effort
  ni `modelContextWindow`. Un `thread/start` supplémentaire, **sans génération**,
  avec les valeurs Astra passées explicitement, a rapporté `gpt-6-astra` /
  `max` ; ce résultat valide ces valeurs dans le client, sans prouver le profil.
  `app-server --stdio` n'accepte pas `--profile` dans cette version, et
  `-c profile=...` est rejeté comme ancien format. La preuve de la fenêtre
  utile de la nouvelle invocation CLI demeure donc le catalogue à 95 % et les
  observations antérieures aux mêmes fenêtres brutes, pas une nouvelle mesure
  `modelContextWindow` du processus profilé.
- Aucun tour de charge longue n'a été exécuté. Aucun appel Claude, build,
  test applicatif, commit, push ou PR n'a été lancé.

Le profil est sélectionné au démarrage d'un **nouveau** processus. Dans une
nouvelle tâche de l'interface, sélectionner Sol Max si un choix manuel de modèle
persiste ; la configuration du PC ne transforme pas une conversation active.

## Contrôle final

- Configuration globale identique à la sauvegarde après exactement trois
  substitutions : `gpt-6-astra` → `gpt-6-sol`, 272000 → 872000, 11 → 9.
  Profils Sol et Astra installés identiques octet par octet aux gabarits.
- Parsing natif validé par `config/read` et les tours `--strict-config` ; aucun
  parseur TOML tiers installé. `git diff --check` retourne 0 ; les deux fichiers
  nouveaux n'ont pas de whitespace final.
- Branche de travail `codex/yeast-refactor-preparation` ; lecture seule du
  checkout principal confirme qu'il est toujours sur `poc`.
- Revue Luna en lecture seule : aucun défaut de configuration ou délégation
  trouvé ; copies installées, trois substitutions globales et diff confirmés.
  Elle signale la même limite d'observabilité du nouveau profil Astra.
