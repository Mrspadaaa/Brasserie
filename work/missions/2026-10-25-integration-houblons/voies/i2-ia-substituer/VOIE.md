# Voie i2-ia-substituer — l'IA dans Substituer, son choix D (D80)

Agent : auteur (Sonnet), pour du code serveur et client.

## Ses mots
- 26.10 : « non D, C + IA mais je pense que le moteur doit être revue ».
- Plus tard : « Est-ce que l'ia est bien présente pour la substitution ? Elle peut aussi être présente pour la suggestion. »
- Son accord pour Gemini facturé en production sur cet usage : D80, environ 0,003 CHF par recherche, en Flash-Lite.

## Ce qui existe
- **Le moteur v2** de Substituer, branché : `src/domain/hopIndex/v4/substitution.ts`, commit ca7e1afd.
- **L'essai** : `scripts/eval-hop/ia-reclassement.ts`, `voies/ia1-reclassement/`.
  - L'invite, l'analyse de la réponse et le refus d'une réponse invalide (id hors liste, doublon, JSON coupé) y sont prouvés.
  - Flash-Lite : p95 2,2 s, environ 3 800 jetons en entrée et 520 en sortie.
- **L'infrastructure Gemini serveur** : `functions/src/ai.ts` (transport, modèles), `functions/src/models.ts`, `functions/src/brewerBudget.ts`
  (budget), les callables du compagnon. La clé reste côté serveur ; **ne lis jamais `functions/.env`**.

## À faire
1. **Un callable serveur** `hopReclasserIA` (Cloud Function, région `europe-west6` comme les autres).
   - Entrée : l'original, le moment, et les 20 premiers du moteur avec leurs fiches courtes (mots, α, usage, huiles).
   - Sortie : l'ordre des 10 premiers, une phrase courte par choix et le modèle employé.
   - Il réemploie l'invite et l'analyse de l'essai ia1 : un module partagé, pas une copie.
   - Gemini 3.5 Flash-Lite par le routage existant.
   - Contrôles :
     - authentification requise, comme les autres callables ;
     - App Check, si les autres l'exigent ;
     - budget par le mécanisme du compagnon ;
     - réponse invalide : erreur propre, jamais un ordre inventé.
2. **Le client**, dans Substituer :
   - la liste du moteur v2 s'affiche tout de suite, comme aujourd'hui ;
   - l'appel part à l'ouverture, en ligne seulement ;
   - si la réponse arrive en moins de 3 s et que le brasseur n'a pas encore touché la liste, l'ordre de l'IA la remplace, une
     seule fois, avec une courte transition. Une petite puce « classé par l'IA » apparaît, et un toucher dessus rend l'ordre du
     moteur ;
   - si la réponse arrive après un toucher, la liste ne bouge pas. La puce dit « ordre IA prêt », et un toucher l'applique ;
   - hors ligne, ou si l'appel échoue : l'ordre du moteur, sans message d'erreur au premier plan ;
   - la phrase de l'IA pour un remplaçant se lit à un toucher de sa rangée, là où l'écran montre déjà un détail. Rien n'est ajouté
     au premier plan.
   - Les scores affichés restent ceux du moteur : l'IA ne donne pas de score.
3. **Tests**, jamais d'appel réel dans `npm test` :
   - le callable, avec un fournisseur simulé ;
   - les cas du client : réponse rapide, lente, après un toucher, hors ligne, invalide ;
   - le contrôle de frontière `scripts/check-test-boundary.mjs` doit passer.
4. **Émulateurs** : le callable dans l'émulateur des fonctions, appelé par l'app en `?dev-local`, avec le fournisseur simulé.
   Captures de Substituer, avant et après la réponse simulée, en 390 × 844, ouvertes.
5. **Un essai réel**, une seule fois, journalisé : 3 appels au plus, sur l'émulateur, par les garde-fous de `gemini38LiveCore.ts`.
   Il prouve que le chemin bout à bout marche.
6. **Le déploiement** des fonctions n'est pas dans cette voie. Écris dans RESULTAT.md la commande exacte et ce qu'elle déploie
   (seulement ce callable), pour le pilote.

## Critères
- `npx vitest run tests/unit/hopIndexV4` vert ; les tests des fonctions (`npm --prefix functions test` ou équivalent) verts ;
  `npm run build` vert ; `node scripts/check-no-dev-auth.mjs` ; `node scripts/check-test-boundary.mjs`.
- Captures ouvertes. Essai réel journalisé, 3 appels au plus.

## Possède
- `functions/src/` : le nouveau callable et le module partagé ; son export dans l'index des fonctions.
- `src/ui/hopIndex/substituer/` (le client, la puce).
- `scripts/eval-hop/ia-reclassement.ts`, pour en extraire le module partagé sans changer son comportement.
- `tests/unit/hopIndexV4/`, les tests des fonctions.
- `work/missions/2026-10-25-integration-houblons/voies/i2-ia-substituer/`.

La voie e3 met à jour les états de la maquette : si un état de Substituer change, dis lequel. Ne touche ni `functions/.env`, ni
`.codex/hooks.json`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`.

Écris RESULTAT.md tôt. Retour en une ligne.
