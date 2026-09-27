# Déduplication des consignes — état de reprise

## Mandat et critères

Demande utilisateur : clarifier l'organisation existante, avec une source par
rôle, sans changer d'orchestrateur. Checkout isolé `Brasserie-agent-workflow`,
branche `codex/astra-external-feedback-review`, référence `25d71e9` (PR 18).
Le frontend actif sur `poc` et ses propriétaires restent indépendants.

- AGENTS.md conserve les règles communes, les contrats produit et le routage.
- Sol, Astra et Luna ont chacun une source Markdown unique. Leurs profils et
  définitions natives reçoivent le texte généré, jamais une seconde version manuelle.
- Claude conserve sa source privée séparée, injectée par le pont même en safe-mode.
- Les skills décrivent des méthodes, les briefs décrivent la mission et le registre
  conserve les feedbacks/preuves : aucun d'eux ne redéfinit le rôle entier.
- Préserver modèles, efforts, fenêtres, permissions, authentifications, isolation,
  retour au même Sol, conservation des artefacts et critères de clôture.
- Prouver synchronisation, détection de dérive et préservation des réglages par
  contrôles déterministes ; pas de génération payante ni interruption d'un agent.

Refuser si une obligation disparaît, si un rôle charge les consignes privées de
l'autre fournisseur, si les profils restent divergents, ou si une retouche de rôle
nécessite de modifier plusieurs copies à la main.

## Responsabilités

- Pilote : sources des rôles, AGENTS.md, guides/briefs, chargement Claude,
  intégration des profils, validation et PR.
- Luna native `/root/role_sync_luna` : uniquement l'outil
  `scripts/sync-agent-instructions.mjs` et ses tests. Rôle Luna Max configuré,
  lancement confirmé ; modèle/effort/fenêtre effectifs non exposés au lancement.
  Pas de sous-délégation. Le pilote relit et vérifie son intégration.

## État

Sources créées : trois rôles OpenAI et rôle privé Claude. AGENTS.md conserve
les règles communes et le routage explicite d'une tâche sans rôle injecté ; le
nom du modèle seul ne sélectionne pas un rôle. Les deux skills du pont routent
vers leur protocole, les briefs ne redéfinissent plus les responsabilités.

Le générateur Luna et ses 11 tests sont reçus. Le pilote a généré les cinq TOML
dans le checkout de PR, puis vérifié avec `tomllib` que chaque consigne est
exactement le Markdown source et que **tous les autres champs** correspondent
à la référence. Le rôle Claude est lu par son pont relativement au module,
indépendamment du dossier courant, avec UUID et mode de la mission en préfixe.

**69/69 tests** exécutés dans le checkout de PR : 11 générateur + 58 ponts/relais.
Deux skills YAML et liens des guides validés ; `git diff --check` vert.
Avant migration, le contrôle des profils PC a détecté les trois textes anciens
sans les modifier. Pas d'appel Claude/Astra ni d'essai de quota requis.

La même Luna a relu les textes écrits par le pilote, en lecture seule et
indépendamment de leur auteur, sans examiner son propre générateur comme revue
indépendante. Trois protections omises dans la réduction du guide ont été retenues
et restaurées : `--restricted` n'est pas une isolation système des commandes ;
interdiction `--bare`/bascule API et contrôle des crédits supplémentaires ; verrou
Claude global au pont, pas seulement par mission. Aucun autre défaut matériel
signalé dans ce périmètre. Paramètres effectifs du délégué non exposés par l'outil.
La revue est textuelle ; le pilote porte les contrôles du générateur et des TOML.

Volumes UTF-8 normalisés, avant/après (texte, pas mesure de quota) :

| Entrée | Avant | Après |
|---|---:|---:|
| AGENTS.md | 14 292 octets | 6 429 octets |
| Guide de lancement | 24 781 | 8 787 |
| Protocole Claude | 10 435 | 7 553 |
| Brief Astra | 6 081 | 2 172 |

Les responsabilités retirées des entrées communes restent dans les rôles ciblés.
Aucune économie chiffrée de quota ou amélioration comportementale universelle
n'est déduite de ces tailles.

## Migration appliquée

Vingt fichiers portés vers le checkout actif après comparaison aux empreintes
initiales : aucun changement concurrent écrasé, aucune source applicative touchée.
Les sources de rôle ont été posées avant leurs consommateurs. Trois profils
installés synchronisés par option explicite ; leurs textes correspondent aux MD.
Comparaison indépendante avec `tomllib` : tous les autres paramètres sont
inchangés. Le `config.toml` global est identique octet par octet ; son modèle
courant n'a pas été modifié. Aucune authentification publiée ou remplacée.

Les cinq profils/définitions du dépôt et les trois profils installés passent le
contrôle de synchronisation. Les sessions déjà actives ne sont pas redémarrées ;
les valeurs effectives des prochains lancements seront lisibles dans leurs
journaux normaux. La validation ici porte sur les fichiers et leurs invariants,
pas sur une nouvelle évaluation payante des modèles.

Prochaine action : publication de la mise à jour de PR, puis usage normal des
rôles et de leur contrôle déterministe. Aucun chantier frontend inclus.
