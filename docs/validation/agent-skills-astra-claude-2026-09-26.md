# Revue des skills et du relais Astra / Claude — 26 septembre 2026

## Résultat et périmètre

PR de configuration et d'outillage, préparée depuis `origin/main` (`dd798d8`)
dans un checkout séparé. Aucun fichier applicatif, aucune recette et aucun
déploiement. La branche `poc` et ses corrections Levure restent en place.

- Sol conserve orchestration, intégration et contrôle proportionné.
- Astra Max intervient en lecture seule ; charger un skill ne l'oblige plus
  à installer, déléguer, écrire un registre ou réaliser une maquette avant de
  donner un avis exploitable. Une preuve hors mandat reste ouverte et confiée à Sol.
- Claude Opus 5.5 xhigh peut recevoir un lot frontend complet, sans double avis
  obligatoire. Retour au Sol identifié ; demande envoyée, acceptée et traitée
  sont des états distincts. Aucune nouvelle session Sol créée par le relais.
- Entrées, copies, sorties partielles et identifiants sont conservés. Les sorties
  existantes ne sont pas écrasées et une réalisation déclarée bloquée n'est pas
  reportée sur les sources.

Les packs OpenAI Impeccable et Senior Frontend accompagnent les adaptations de
leurs consignes, avec leurs dépendances locales. Les règles et le relais Claude
restent dans leur propre espace. Les autres packs non suivis, réglages privés,
mémoires personnelles et journaux volumineux ne sont pas importés dans cette PR.

## Corrections issues de cette revue

1. Douze références Impeccable OpenAI appelaient encore le lanceur
   `.claude/skills/impeccable`. Elles ciblent désormais leur copie `.agents/skills/`.
   Le hook local non suivi `.codex/hooks.json`, qui appelle Claude, est exclu de
   cette PR ; il n'est pas une dépendance du fonctionnement décrit ici.
2. Le guide restaurait une ancienne section qui faisait disparaître les conseils
   de reprise et d'économie de quota déjà présents sur main. Ces conseils sont
   conservés : contexte utile, réutilisation des preuves et attentes natives.
3. Le lien de validation Astra pointe sur ce bilan versionné plutôt que sur un
   registre de travail absent de la PR.

## Contrôles exécutés dans le checkout de PR

- `node --test scripts/agent-launchers.test.mjs scripts/claude-expert.test.mjs
  scripts/sol-handoff.test.mjs scripts/luna-review.test.mjs` : **58/58**, sortie 0.
  Ces tests couvrent notamment interruption, récupération, collisions, mauvais
  destinataire, résultat bloqué, transfert de vingt fichiers et statut du relais.
- Six en-têtes YAML de skills validés avec le parseur du projet ; neuf TOML
  d'agents/profils valides avec `tomllib` ; références documentaires contrôlées.
- Diff limité aux consignes, outils, dépendances de skills et preuves associées.
  Pas de test produit ni de build applicatif requis pour ces seuls changements.

## Preuves existantes examinées et limites

Le dossier local `work/claude-pro-2026-09-26` conserve la consultation native
`6e7b44be-5ce1-4185-8222-899bfcf99737`. Les reçus examinés montrent deux demandes
rendues au parent et une demande transmise par queue, toutes terminées par le même
Sol `01a0de88-b523-7ff2-9b56-5db26cfd0f55`. Opus 5.5 et la fenêtre 1000000 sont
observés ; xhigh est configuré, pas exposé séparément comme effort effectif.
L'essai Luna lancé par Claude n'a pas livré de réponse finale : ses traces sont
conservées et une relève native a traité les faits. L'attente TaskOutput corrigée
n'a pas été rejouée par un deuxième appel Claude payant.

Le dossier local `work/astra-skills-2026-09-26` relève pour les sessions
`01a0dec9-8b7b-7ab2-ad00-3bd813a4d50a` et
`01a0decb-0818-71f3-9dfe-f23b9b9a55e4` : **gpt-6-astra, max, read-only,
400000 tokens utiles**. Le profil configure 421053 bruts. Les avis examinés
identifient une estimation présentée comme mesure, puis un double comptage lors
d'un rejeu hors ligne. Ils distinguent le constat des essais d'intégration restants.
La suite et la revue comportementale finale de cette autre tâche sont encore en
cours au moment de cette revue rapide ; elles ne sont pas déclarées validées ici.

Aucun nouvel appel génératif n'a été lancé pour préparer cette PR. Aucun gain
chiffré de quota ni garantie d'absence de dérive n'est revendiqué.

## Suite

Après intégration, reprendre la revue utilisateur Levure conservée sur `poc`
(`docs/validation/levure-revue-utilisateur-2026-09-25.md`) et son registre de
release. Les comportements produit demandés restent à réaliser/vérifier ; cette
PR prépare les agents et les outils, elle ne clôt pas les défauts frontend.
