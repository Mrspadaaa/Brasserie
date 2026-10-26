---
name: fermeture-et-quota
description: Fermer une issue dès qu'elle est utilisable sans bloquant (mineurs en sous-issues) ; travailler jusqu'aux paliers de quota, sessions neuves au-delà de 450 k.
type: agents
maj: 2026-10-26
sources: mémoire locale affinee-fermeture-et-quota.md ; work/finalisation-tickets-2026-10-08/mission-orchestrateur.md ; veille/STOP (absent de ce worktree)
---

Choix de l'utilisateur, 2026-10-12 (« Fait en sorte de fixer ce mécanisme ») : une issue GitHub se ferme dès qu'elle est utilisable et prouvée sans aucun bloquant (V3 favorable, V4 OK, parcours réel, captures regardées, émulateurs si Firestore, règles ou Functions sont touchés). Les mineurs restants vont dans une sous-issue liée ; ils ne relancent pas un cycle complet de correction, revue et validation UX.

**Pourquoi** : en 4 jours, aucune issue n'avait été fermée. Chaque mineur relançait correction, revue et validation UX. Le quota Team (5 h et semaine) est la vraie limite.

**Comment l'appliquer** :
- Faire passer en premier les issues les plus proches de la fermeture.
- Découper les zones trop grosses en lots menés jusqu'à la fermeture.
- Relancer en session neuve (`--new` depuis le handoff) toute sous-session au-delà d'environ 450 k tokens.
- Quand toutes les issues d'une épopée sont fermées, une session indépendante fait une passe complète de bout en bout (vrai Chrome 390/1280, émulateurs, suite complète, build). Pour chaque bloquant : rouvrir l'issue ou créer une sous-issue, corriger seulement celles-là, refaire une passe, jusqu'à une passe propre. Ensuite seulement, fermer l'épopée.
- Semaine : aucun plafond hebdomadaire. L'ancien seuil est retiré par l'utilisateur le 26.10 : « Oublie la règle 80% elle est fausse, tu peux la supprimer » (voir REMPLACES.md).
- Ne jamais mettre en pause sous 95 % de la fenêtre 5 h : de 80 à 95 %, on continue l'engagé ; à 98 %, arrêt propre. L'utilisateur a réagi vivement à une pause à 89 %.

Détail actuel : section « Mécanismes d'accélération » de `work/finalisation-tickets-2026-10-08/mission-orchestrateur.md`.

Voir [[autonomie-decisions]] et (leçon L11).
