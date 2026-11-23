---
name: agents-sans-openai
description: Depuis le 2026-10-08, plus aucun agent OpenAI (Codex, Sol, Astra, Luna, Root) ; Haiku remplace Luna, Opus remplace Sol/Astra.
type: agents
maj: 2026-10-22
sources: mémoire locale affinee-agents-sans-openai.md ; scripts/claude-expert.mjs ; .claude/roles/expert.md ; docs/claude-expert.md
---

Décision de l'utilisateur, 2026-10-08 : « Plus d'utilisation de open ai Luna ou autre hiku à la place de Luna, opus à la place de sol ou astra ».
- Aucun agent OpenAI : ni Codex CLI, ni threads Sol, Astra, Luna, Root ou « contrôleur ». Rien ne leur est transmis.
- Haiku tient l'ancien rôle de Luna : lectures, vérifications, QA mécanique, fixtures, tests, captures. Opus relit ce qu'il produit.
- Opus tient l'ancien rôle de Sol et d'Astra : pilotage, conception, intégration, qualification, report dans le dépôt.

**Pourquoi** : l'utilisateur veut une chaîne 100 % Claude (Team). L'ancien pont Claude/Sol (`scripts/claude-expert.mjs`, skill `sol-orchestrator`, `.claude/roles/expert.md`) exige un thread Sol : il n'est plus utilisable.

**Comment l'appliquer** : dans les registres de `work/`, une action en attente attribuée à Sol, Astra, Luna, Root ou au contrôleur revient à la session Claude Opus qui pilote. Les consignes de CLAUDE.md et de `docs/claude-expert.md` qui parlent de Sol sont caduques sur ce point tant qu'elles ne sont pas mises à jour. Depuis le 2026-10-09, Sonnet 5.5 xhigh (`claude-sonnet-5-5`) est autorisé pour les tâches trop dures pour Haiku mais qui ne demandent pas Opus. Fable 5.1 max sert aux blocages, à la validation UX et à la supervision. Haiku 5.5 existe (`claude-haiku-5-5`, effort `max`), vérifié le 2026-10-08 dans les flux des sous-sessions avec le CLI 2.1.293 sur Team.
