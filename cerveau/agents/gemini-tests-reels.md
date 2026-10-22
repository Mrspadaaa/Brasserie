---
name: gemini-tests-reels
description: Appels Gemini réels autorisés en test, journalisés ; depuis le 16.10, pas de règle « 3.8 seul » : par usage, le plus rapide sans perte de qualité (3.8 ou 3.5-flash-lite).
type: agents
maj: 2026-10-22
sources: mémoire locale affinee-gemini-tests-reels.md ; gemini-journal.md (absent de ce worktree)
---

Utilisateur, 2026-10-12 : « J'autorise quelques appels Gemini pour les tests d'intégration. Seul 3.8 peut être utilisé. »

**Pourquoi** : il faut prouver les parcours Gemini réels (V55-AI, passes de bout en bout), mais la facturation et le choix du modèle restent contrôlés. La production appelle d'autres modèles (3.5-flash-lite par défaut, 3.1-pro-preview en mode approfondi).

**Comment l'appliquer** (règles posées le 12.10) :
- Forcer `gemini-3.8-flash` dans le test spécial, sans changer le routage de production.
- Refuser tout autre modèle et vérifier le champ `model` de chaque réponse.
- Au départ, au plus 3 appels par lancement et 10 au total. Le 16.10, l'utilisateur a autorisé « une hausse du budget pour les appels Gemini si cela aide et augmente la qualité pour la vraie app » : Claude l'a bornée à 40 appels au total, 5 par lancement et 15 CHF estimés, toujours en 3.8 seul. Jamais un appel « pour voir ». Le budget mensuel de l'app en production est un réglage que l'utilisateur relève lui-même.
- Jamais dans `npm test` ; données de fixtures ou d'émulateurs seulement. Ne jamais afficher la clé. Noter chaque appel dans `gemini-journal.md`.

Le déploiement et l'activation en production (H1, H3) ne sont pas autorisés par ce message.

**Correction du 16.10.** La phrase « seul 3.8 peut être utilisé » avait été lue comme règle pour toute l'app (lot G38 : 3.8 partout, sans repli). L'utilisateur : « ce n'est pas une règle mais une mauvaise interprétation ; si sur certains cas 3.5 est plus rapide sans perdre en qualité, go ». Règle actuelle : par usage, le modèle et la réflexion les plus rapides sans perte de qualité mesurée (3.8 ou 3.5 Flash-Lite), choisis par le serveur ; à qualité meilleure, la qualité prime. Ne pas reprendre « 3.8 seul » comme contrainte.

Le 13.10, pour l'issue #91, l'utilisateur a autorisé « plus de tests et d'appels » réels, avec agents et sous-agents, sur des cas simples et très compliqués, et sur la vision (extraction et triage de tickets de caisse et d'autres documents). Les deux modèles 3.5-flash-lite et 3.8 sont permis dans ce banc seulement. Enveloppe fixée par Claude : 100 appels, 25 par lancement et 5 CHF estimés, sur fixtures synthétiques. Le verrou de production 3.8 reste intact jusqu'à sa décision sur la recommandation.

Voir [[export-et-ia]] et [[fermeture-et-quota]].
