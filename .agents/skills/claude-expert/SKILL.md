---
name: claude-expert
description: Confier depuis Sol un lot précis à Claude Opus 5.5, surtout frontend, de la conception à la réalisation complète, ou une revue ciblée. Traiter le retour sans perte de preuves ni nouveau Sol. Astra reste le collaborateur de premier recours, sans double expertise imposée.
---

# Claude expert auprès de Sol

Lire `docs/claude-expert.md` depuis la racine du dépôt. Sol demeure le seul
orchestrateur. Préparer la décision et les preuves avec le gabarit
`docs/prompts/consultation-claude.md`, puis appeler `scripts/claude-expert.mjs`
avec une nouvelle sortie et l'identifiant de ce Sol. Préserver Opus 5.5 xhigh.

Astra est le collaborateur expert de premier recours de Sol, sans passage
obligatoire avant chaque intervention Claude ni double expertise systématique.
Avant l'appel Claude, nommer le livrable et ce que Claude doit apporter. Ne pas
attendre un échec ; une contribution frontend précise justifie son intervention.
Ne pas doubler un avis déjà suffisant. Une demande explicite de Claude permet
l'appel ciblé sans consultation Astra cérémonielle.

Pour concevoir et réaliser un lot complet, utiliser `--mode edit` avec tous les
fichiers confiés ; ne pas réduire le lot à une retouche. Sol prépare les nouveaux
fichiers vides autorisés si nécessaire, les fixtures et contraintes, puis vérifie
le rendu et le parcours après report des copies. `review` reste la consultation
en lecture seule. Aucune relecture experte supplémentaire automatique.

Le retour est un avis ou une demande de travaux, pas une validation produit.
Traiter `needs_sol` dans cette même session : accuser réception du dossier durable,
prendre les tâches autorisées, déléguer aux Luna si utile et vérifier les résultats.
Ne jamais démarrer un autre Sol pour recevoir le retour ni rappeler Claude en
cascade. Si le canal direct échoue, une Luna peut relayer les faits à ce même Sol.

Conserver toutes les données reçues, même partielles, et leurs sources. Une
limite de quota ou une coupure déclenche une inspection du dossier, pas une
régénération automatique. Un retour en file n'est pas encore accepté ; un travail
accepté n'est pas encore vérifié. Relancer Claude seulement sur une nouvelle
décision avec les différences et preuves correspondantes.
