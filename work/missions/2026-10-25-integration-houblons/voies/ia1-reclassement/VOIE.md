# Voie ia1-reclassement — essai réel d'IA pour re-classer les substituts (#181)

Agent : auteur (Sonnet). Un essai mesuré, journalisé, hors `npm test`. Rien n'est branché dans l'app.

## Son accord (26.10, matin)
« Donner ton accord ou non pour un essai d'IA sur le classement des substituts. Le protocole est écrit, aucun appel n'a été fait. »
→ « Je donne mon accord pour les deux. »

## Le protocole (déjà écrit)
Lis le § 7 de `voies/e1-banc-eval/resultats/rapport.md`, et le § 2 pour les chiffres à battre.
- Le moteur garde la liste. Le modèle reçoit les 20 premiers candidats de `substitutes()`, avec leurs fiches (mots, α, huiles,
  usage), et rend l'ordre des 10 premiers, avec une phrase par choix.
- Le banc : les 30 premiers houblons de l'échantillon de e1 (graine 181), aux deux moments (60′ et dry hop), plus les 9 houblons
  phares, soit 78 requêtes au plus.
- À battre, sur les mêmes cas :
  - le moteur seul ;
  - l'option 1 de e1, hors ligne (les mots hors famille, λ = 0,25), que tu recalcules si e1 n'a pas gardé les rangs par cas.

  Seuil pour continuer : +0,05 de MRR, ou +5 points de rappel@10, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin.
  Juge aussi sur les cinq cas du brasseur, K1 à K5, qui ne viennent pas de Beer Maverick (le modèle a pu lire Beer Maverick).

## Règles des appels réels (`cerveau/agents/gemini-tests-reels.md`)
- Réemploie les garde-fous existants, lis-les d'abord : `scripts/gemini38LiveCore.ts` (modèle résolu, hôte refusé s'il n'est
  pas le bon, journal `gemini-journal.md` réservé avant l'envoi) et `scripts/paid-ai-test-guard.mjs` (consentement explicite).
  Modèles : `functions/src/models.ts`.
- La clé se lit dans l'environnement ou dans `functions/.secret.local`, par ces garde-fous.
  - Elle n'est jamais affichée ni journalisée.
  - Ne lis jamais `functions/.env`.
- Modèle : `gemini-3.8-flash`. `3.5-flash-lite` est permis s'il est mesuré aussi bon et plus rapide. Vérifie le champ `model` de
  chaque réponse.
- Enveloppe : 100 appels au plus en tout, 5 CHF estimés au plus. Chaque appel est journalisé : entrée, sortie, durée et jetons.
- D'abord une passe à vide avec un fournisseur simulé, qui valide l'invite, l'analyse de la réponse et les métriques. Ensuite
  seulement, les appels réels.
- Le fichier des requêtes est figé et versionné, pour rejouer et comparer deux invites hors ligne.

## Livrables
- `scripts/eval-hop/ia-reclassement.ts` (`--simule` et `--reel`), les requêtes figées, et les réponses dans
  `voies/ia1-reclassement/resultats/<date>/`.
- `resultats/rapport.md` : MRR, rappel@10 et rang médian (moteur, option 1, IA), les 9 phares avec les 10 premiers de chacun,
  K1 à K5, la durée au p95, les jetons et le coût estimé.
- En DÉCISION À PRENDRE : brancher l'IA (où, avec quel repli hors ligne, à quel coût par usage), l'option 1 seule, ou les deux.

## Critères
- La passe simulée rend les métriques du moteur seul à l'identique de e1 sur ces cas.
- Le journal compte autant d'appels réels que de lignes, sous l'enveloppe ; aucun autre modèle que ceux permis.
- `npx vitest run tests/unit/hopIndexV4` vert ; `npm run build` vert ; `git diff --stat -- src/domain src/ui` vide.

## Possède
`scripts/eval-hop/ia-*`, `gemini-journal.md` (en ajout, par les garde-fous),
`work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/`.

Aucun autre fichier : `scripts/eval-hop/banc-eval.ts` et `metriques.ts` se lisent et s'importent, mais ne se modifient pas. Pas de
`git mv`. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec les chiffres et le coût.
