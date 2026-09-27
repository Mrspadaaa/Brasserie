---
name: sol-orchestrator
description: Transmettre une tâche de Claude au Sol existant et lire son résultat vérifié, sans créer un autre pilote.
---

# Transfert au Sol existant

Le rôle est défini dans `.claude/roles/expert.md`. Les formats et commandes du
transfert sont dans `docs/claude-expert.md` ; lire seulement le chemin concerné.

- Consulté par Sol : retourner `needs_sol` avec les tâches et références utiles,
  puis rendre la main. Le parent traite les dossiers conservés par le pont.
- Claude autonome : utiliser `scripts/sol-handoff.mjs send` avec l'UUID du Sol
  existant et un dossier durable. Pas de création de thread, de `exec` ou de `resume`.
- Un envoi en file n'est pas une réception. Lire l'accusé et le résultat avec
  `status` ; si le canal échoue, conserver les faits et diagnostiquer avant reprise.
  Une Luna peut relayer au même destinataire, sans répéter un canal refusé.
- Examiner preuves et limites avant de demander une nouvelle expertise. Aucun
  nettoyage des données ni validation déduite d'un simple statut de processus.
