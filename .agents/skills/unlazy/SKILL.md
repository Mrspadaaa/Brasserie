---
name: unlazy
description: Mener à terme un travail substantiel ou plusieurs livrables avec critères observables, responsabilités explicites et preuves de vérification. Utiliser pour une implémentation importante, un audit ou une reprise incomplète.
---

# Unlazy pour Codex

Avant l'implémentation, écrire les résultats attendus et leurs vérifications dans
un registre court. Distinguer tests exécutables et revue humaine du rendu.

Décomposer aux frontières de livrables indépendants. Donner à chaque sous-agent
son dossier de travail, ses fichiers, les dépendances et le résultat vérifiable.
Il n'est pas seul : préserver les autres changements. Employer les agents natifs
avec le modèle et l'effort demandés. Aucune limite artificielle de durée, de
tokens, de passes utiles ou de profondeur ; la tâche détermine le travail.
Cette exigence porte sur le résultat utile : elle ne justifie ni exploration
redondante ni multiplication des agents. Confier un livrable cohérent, avec un
contexte ciblé et un retour court lié aux preuves. Une suite liée réutilise
l'agent et les faits établis ; un travail indépendant reçoit son propre contexte.

Réaliser, relire comme spécialiste du domaine, vérifier, corriger les défauts
constatés. Recontrôler les parties affectées par une correction. Le parent vérifie
les retours et l'intégration ; il ne confond pas un rapport avec une preuve.
La vérification du parent cible les contrats, les risques et les preuves
manquantes ; elle ne recommence pas systématiquement la recherche du délégué.
Une nouvelle passe répond à un changement, un défaut ou une incertitude identifiée.

Les contrôles doivent mesurer le comportement attendu et pouvoir échouer.
Exécuter les commandes comprises et nécessaires dans le périmètre autorisé.
Ne pas installer de hooks, de moteur de ledger ou de pipeline pour appliquer
cette discipline. Une petite retouche demande seulement une vérification adaptée.

Avant de conclure, rapprocher la demande et les résultats. Rapporter les preuves,
les limites et tout critère restant ouvert. Un résultat non vérifié reste ouvert.
