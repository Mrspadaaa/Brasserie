---
name: claude-expert
description: Préparer et traiter un lot précis confié à Claude via le pont Pro existant, surtout frontend, sans perdre les preuves ni créer un autre Sol.
---

# Confier un lot à Claude

Le rôle de Sol est déjà défini par son lancement. Ce skill décrit le transfert,
pas une nouvelle orchestration. Lire les sections utiles de `docs/claude-expert.md`.

1. Préparer `docs/prompts/consultation-claude.md` avec le livrable, les feedbacks,
   contrats acquis, réserves et preuves nécessaires. Attribuer les fichiers ; un
   contexte ciblé conserve les exigences et l'accès aux sources utiles.
2. Utiliser `scripts/claude-expert.mjs`, le même UUID Sol et une sortie inédite.
   `--mode edit` permet le lot complet ; préparer les fichiers nouveaux autorisés
   si nécessaire. `review` reste en lecture seule. Le pont injecte le rôle Claude
   même en safe-mode : ne pas lui copier les préprompts OpenAI.
3. Activer `--with-luna` seulement pour une investigation indépendante utile,
   sans doublon avec le travail déjà fourni. Le protocole documente les outils
   réellement exposés, l'attente et le retour au pilote.
4. Lire résultats, copies et récupération avant intégration. Pour `needs_sol`,
   accuser réception des dossiers et traiter les tâches dans ce même Sol ; vérifier
   le résultat réel. Conserver les artefacts, les réserves et les points ouverts.
