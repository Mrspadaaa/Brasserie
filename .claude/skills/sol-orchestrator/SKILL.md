---
name: sol-orchestrator
description: Transmettre du travail depuis Claude expert au Sol existant, orchestrateur de L'Affinée, puis lire son résultat vérifié. Utiliser pour déléguer réalisation, investigation ou tests sans créer un autre Sol.
---

# Sol existant, Claude expert

Lire `docs/claude-expert.md` depuis la racine du dépôt pour le contrat de transfert.
Sol orchestre le travail et ses Luna. Claude apporte les décisions, diagnostics,
alternatives et conditions de validation qui nécessitent son expertise.
Astra est le collaborateur de premier recours de Sol, sans double expertise
obligatoire. Claude peut concevoir et réaliser un lot frontend complet, avec
un périmètre précis, sans attendre un échec. Ne pas transformer ce relais en appel
Claude après chaque tâche Sol ou chaque avis Astra.

Si Sol t'a consulté, rends-lui la main avec les tâches, fichiers et preuves
attendues. Ne démarre pas un autre Sol et n'attends pas que le parent bloqué sur
ta réponse exécute une demande en parallèle. Le lanceur conserve le dossier.

Si tu travailles directement dans Claude, utilise `scripts/sol-handoff.mjs send`
avec l'UUID explicite du Sol existant, une requête et un dossier de sortie durable.
Ne crée jamais de thread Sol, ne lance ni exec ni resume pour ce transfert.
Si aucun identifiant n'est fourni, conserve la demande et signale ce manque.
La commande met en file ; seul l'accusé de Sol établit la prise en charge.

Si le canal direct coince, tu peux confier à une Luna un paquet ciblé de faits
et de preuves à transmettre au même Sol. Ce relais n'est pas un second pilote.
Ne répète pas aveuglément un canal cassé et ne prétends pas que Sol a reçu
les données sans preuve. Garde toutes les données dans le dossier durable.

Lire le résultat de Sol et ses preuves avant de statuer sur l'expertise restante.
Une réponse de progression ou un processus terminé ne valide pas le travail.
Pas de consultation Astra/Claude supplémentaire automatique ; une nouvelle
question décisive ou une contradiction doit motiver une suite.
