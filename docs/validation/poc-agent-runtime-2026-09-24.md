# Audit des agents du POC UX mobile — 24 septembre 2026

## Critères et responsabilité

Vérifier les valeurs d'exécution du pilote et de ses délégués, corriger un écart
observé sans redémarrer les travaux valides, puis documenter le démarrage et le
suivi fiables. Cet audit possède uniquement `AGENTS.md`, `docs/openai-setup.md`
et ce registre. Le pilote POC conserve sources, fixtures, tests et son registre
`ux-mobile-poc-implementation.md`. La refonte complète Levure reste distincte.

## Preuves observées avant correction

Les journaux natifs de `~/.codex/sessions/2026/09/24/` donnent les valeurs de
`turn_context` (modèle et effort) et de `event_msg.token_count` (fenêtre utile).
Les extraits utiles sont conservés hors dépôt dans
`C:/Users/mrspa/AppData/Local/Temp/laffinee-yeast-prep-20260924/poc-session-evidence.json`
et `poc-children-evidence.json`. Aucun jeton d'authentification ni journal complet
n'est copié dans le dépôt.

| Session | Modèle | Effort | Fenêtre utile constatée |
| --- | --- | --- | ---: |
| Pilote `01a0d4a6-841d-7ae3-bfa6-9d5a228eff90` | gpt-6-sol | max | 828400 |
| Levures `01a0d4aa-eab2-78c0-b4e9-6bdd9fcb8282` | gpt-6-luna | max | 828400 |
| Fermentation `01a0d4aa-eab7-7111-93dc-230526c88769` | gpt-6-luna | max | 828400 |
| Stocks `01a0d4aa-eab0-7062-9281-b6e856aeebb4` | gpt-6-luna | max | 828400 |
| Eau `01a0d4aa-eab0-77b2-b3c3-191f67086e3b` | gpt-6-luna | max | 828400 |
| Finances `01a0d4aa-eab7-79e3-b0f7-97162af925da` | gpt-6-luna | max | 828400 |

Observations du 24 septembre entre 20:21 et 20:34, heure suisse ; client
`0.155.0-alpha.16.4`. Le pilote a lancé les cinq processus avec `luna-full`.
Ces valeurs sont mesurées sur les sessions de travail ; elles ne constituent
pas un essai de charge à pleine fenêtre. Aucun changement de modèle nécessaire.

Le message du pilote à Luna Finances via `codex_app.send_message_to_thread`
a échoué avec `already has an active writer`. L'identifiant de session était
valide : le conflit concernait son processus CLI actif. Le relais
`codex queue --profile luna-full --sandbox workspace-write --thread <UUID> --message <texte>`
a accepté la même précision métier, message `01a0d4b4-acf5-7960-810c-72db4f17b827`.
L'acceptation dans la file ne prouve pas encore sa prise en compte.

## Corrections et contrôle final

- `AGENTS.md` distingue désormais consignes de fonctionnement et mission produit,
  demande une preuve des paramètres et décrit le suivi des processus CLI.
- `docs/openai-setup.md` documente les métadonnées utiles, les canaux selon le
  lancement, `codex queue`, ses accusés et ses limites. Le guide présente la
  refonte Levure comme un exemple explicitement demandé.
- Les trois messages de coordination au pilote ont été acceptés par l'app :
  paramètres conformes, diagnostic corrigé du conflit d'écrivain, canal CLI
  confirmé et responsabilité de fichiers séparée. Aucun appel Astra n'avait été
  observé pendant l'inspection initiale ; une contre-expertise ciblée du POC a
  été demandée au pilote. Son démarrage reste à confirmer dans cette tâche active.
- Au contrôle de 20:38:56, la précision Finances n'apparaissait pas encore comme
  nouveau message utilisateur dans son journal ; son modèle restait Luna Max.
  La consigne est mise en file, sans prétendre qu'elle est déjà appliquée au code.
- `git diff --check` réussi. Le commit d'audit ne contient que les trois fichiers
  attribués ; les sources, tests et fixtures en cours du POC sont préservés.

Aucun goal n'a été créé pour cet audit ; aucun test applicatif, changement de
modèle, d'authentification ou de permission n'a été nécessaire. Le fonctionnement
et la qualité visuelle du POC restent à vérifier dans sa tâche de réalisation.
