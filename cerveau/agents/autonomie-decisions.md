---
name: autonomie-decisions
description: L'utilisateur veut le moins d'intervention possible ; les décisions courantes sont tranchées par le pilote, les lourdes par le skill conseil ; le goût revient au brasseur, en variantes.
type: agents
maj: 2026-11-08
sources: mémoire locale affinee-autonomie-decisions.md
---

L'utilisateur, 2026-10-08 : « Ça va pas du tout, si je dois répondre à chaque question... délègue ça à toi ou à une autre session. » Il a aussi demandé « le moins d'intervention possible de ma part », avec un vrai système de validation. Le validateur imaginé ce jour-là, censé remplacer son coup d'œil, a été remplacé : le critique Fable reste indicatif tant qu'il n'est pas étalonné (L27), et le brasseur voit chaque lot ([[le-brasseur-choisit]]).

**Pourquoi** : les questions à choix bloquent les sessions autonomes et le dérangent. Il a accepté l'option recommandée et prudente à chaque fois.

**Comment l'appliquer** : trancher selon PRODUCT.md, DESIGN.md, les issues, le code et ses choix connus, en prenant par défaut l'option prudente et réversible. Une décision lourde va au skill `conseil` ; un choix de goût devient des variantes montrées au brasseur, sans bloquer (L24). Journaliser, puis continuer. Ne garder pour lui que les gestes irréversibles ou externes, regroupés et sans bloquer : déploiement, push/PR/merge, données réelles, Gemini facturé en production, suppression, comptes et réglages.

Quota : il veut qu'on l'optimise, sans perte de qualité ni plafond de contexte (refusé le 2026-10-08 : « un grand contexte peut être utile »). Économies acceptées : aucun sondage, Haiku pour le travail de masse, pas de journal brut entier, pas de travail en double, et des pauses aux paliers.

Voir (leçon L11) et [[agents-sans-openai]].

**Tests sur l'app déployée** (31.10) : « une fois implémente, jouer et faire des test sur la vrai application déployer. Tu peux modifier les données de recette, c'est pas trop gênant mais ne génère pas des quantités de données inutile ». Un écran porté se joue donc aussi sur l'app en ligne, après le déploiement de hosting.
- On peut modifier une recette existante, de préférence un brouillon de test.
- On ne crée pas de série de recettes : une seule recette de test, réutilisée, et rien d'autre (ni brassins, ni stock, ni comptes, ni réglages).

**Dans le cadre d'une tâche qu'il a demandée** (02.11, sur « Rien ne sera déployé côté serveur sans votre accord », écran Dépense) : « Pourquoi ? Il faut deployé pour pouvoir testé... », puis « Non pas besoin de mon accord dans ce cadre de tâche là ». Les gestes externes qu'exige la tâche pour être finie et essayée ne s'annoncent pas en attente : redéployer la fonction et l'app qu'elle change, l'essai en ligne selon D210/D217, allumer en ligne ce qu'elle construit, dans le budget IA fixé. Ils se font après la vérification locale et se journalisent (D297, D298). Restent à lui : données réelles écrites ou supprimées (fusion de doublons), push, PR et merge non accordés, règles Firestore, autres fonctions, dépassement du budget.

**Boucle de déploiement** (08.11) : « Pourquoi tu attends mon accord ??? », « N'attends pas mon accord pour déployer, tu dois itérer dessus en fixant les bugs ??? », puis « Oui » dans le fil de la pilote. Déployer l'app et les fonctions qu'un correctif change, relire ses pièces avec Gemini (facturé, journalisé), corriger et redéployer en boucle : sans attendre. Les fonctions partent du dépôt principal (seul lui a ). Une seule session déploie à la fois, depuis le dernier commit, et le dit à l'autre.
- Tests en ligne (07.11 : « Non non justement il doit! Juste faire ça sur des données de test, flaggé comme telle ») : chaque actionneur se joue sur des données « ZZ TEST — … » créées pour l'essai, Enregistrer compris, puis retirées ; regarder seul = non couvert.
- Rien ne retient un déploiement prêt (08.11 : « pourquoi ? pourquoi ça attends `??? ») : les captures locales et les suites longues se font après, en ligne.
- Relais (08.11, dans le fil de la pilote : « Le relais de l'autre branche suffit.... ») : son accord relayé mot pour mot par la session de monitoring vaut accord écrit ; ne pas lui faire répéter un oui déjà donné ailleurs.
- Restent à son oui (direct ou relayé) : modifier ou retirer ses vraies écritures (en lot surtout : l'outil le refuse sans accord explicite), push, PR, merge, règles Firestore.
