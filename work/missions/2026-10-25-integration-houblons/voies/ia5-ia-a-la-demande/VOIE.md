# Voie ia5-ia-a-la-demande — l'IA de Suggérer sur Gemini 3.8 Flash, à la demande

Agent : auteur (Sonnet). Le port de sa décision dans l'app, côté serveur et côté écran. La voie s'arrête au code, aux tests, au build, à
l'essai simulé avec captures, et à un petit essai réel. Le pilote déploie. **Économise les tours.** Écris RESULTAT.md tôt.

## Ses mots (27.10)
Après le banc (D131 : 3.5 Flash-Lite +5, 3.8 Flash en réflexion basse +6,7, en réflexion haute +5,8 en 90 s) :
« Mettre 3.8 Flash et je peux l'activer à la demande » (D132).

Lecture du pilote : le modèle est Gemini 3.8 Flash en réflexion basse, le meilleur au banc (4,7 s de médiane). L'IA ne part plus seule à
l'ouverture : elle part quand il touche la puce.

## Base
- Sa maquette choisie pour l'IA de Suggérer (règle n° 1) : m6, la puce « ✦ ordre IA prêt », pointillée, étoile bleue, sur le groupe des
  ex æquo, et la phrase au toucher d'une rangée. Voir `voies/m6-suggerer-moment/img/m1m2-ia.png` et `m1m2-ia-phrase.png`, ainsi que le
  complément au registre `work/refonte-frontend/v4/choix/ecrans.json`.
- Le code d'ia3 et d'ia4 : `voies/ia3-ia-suggerer/RESULTAT.md`, `voies/ia4-ia-ex-aequo/RESULTAT.md`. Il comprend :
  - le pool des ex æquo (3 à 12) ;
  - l'invite `suggerer-v2` et ses phrases fondées sur la fiche ;
  - les gardes ;
  - l'interrupteur `VITE_IA_SUGGERER` (D126).

## Ce qui est demandé
1. **Serveur** (`functions/src/hopReclasserIA.ts`) : le mode `suggerer` passe à `GEMINI_MODEL` (3.8 Flash), en réflexion basse.
   - Mêmes gardes : budget mensuel et quotidien, devis à 12 000 jetons de sortie au plus, réponse invalide = `ok:false`.
   - Le mode de Substituer (`v1`, Flash-Lite) ne bouge pas.
   - Vérifie que le délai de la fonction (30 s) et celui du client couvrent une réponse lente : la médiane du banc est de 4,7 s ; prends le
     maximum mesuré dans `voies/ia4-ia-ex-aequo/ia4-banc/resultats-gemini-3.8-flash-low.json`.
2. **Écran, à la demande** (`src/ui/hopIndex/suggerer/`) :
   - Aucun appel à l'ouverture ni au repos. La puce de m6 est visible sur un groupe d'au moins 3 ex æquo, en ligne seulement.
   - Au repos, la puce dit « ✦ classer par l'IA ». Toucher la puce lance l'appel. Pendant l'attente, elle garde sa taille et sa place
     (décalage 0 px) et dit « ✦ l'IA classe… ».
   - L'ordre arrive et s'applique ; la puce dit « classé par l'IA ». La toucher de nouveau rend l'ordre du moteur, et un autre toucher remet
     l'ordre IA sans nouvel appel.
   - En cas d'échec, la puce revient au repos et dit, une seule fois, « IA indisponible » (12 px au moins). Hors ligne, il n'y a pas de puce.
   - La phrase au toucher d'une rangée reste celle de m6. Les scores, effets et doses restent ceux du moteur.
   - Une réponse est gardée pour la séance, par demande : un retour à la même demande ne refacture pas.
   - Retire la porte `VITE_IA_SUGGERER` : l'appel n'a lieu qu'à la demande. Sous Vitest, il n'y a toujours aucun transport par défaut.
3. **Tests sans Gemini** : rien n'est appelé à l'ouverture ; un toucher fait un appel ; un double toucher n'en fait pas un second ; la
   bascule ; l'échec ; le modèle du mode `suggerer`.
4. **Essai simulé** sur émulateur : mets à jour `scripts/eval-hop/ia3-emulateur.ts` (`suggerer-v2`, à la demande, fournisseur simulé qui
   cite la fiche). Captures à 390 × 844 sur une recette de fixture, toutes ouvertes (L12) :
   - le repos ;
   - l'attente ;
   - l'ordre appliqué ;
   - la phrase ;
   - le retour au moteur ;
   - l'échec.
   Jeton : `IA5-EMULATEUR-OK`.
5. **Petit essai réel** (accord D130, il reste 6,27 CHF) : 3 appels au plus, sur l'émulateur avec le vrai fournisseur, journal « ia5 » dans
   `work/finalisation-tickets-2026-10-08/gemini-journal.md`. Note la latence et le modèle observé.

## Critères
- `npx vitest run tests/unit/hopIndexV4 --maxWorkers=2` : vert ; le test d'identité de `v1` est vert.
- `npx tsc --noEmit` et `npx tsc --noEmit -p functions` : sans sortie.
- `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-ia5` : vert.
- `node scripts/check-hop-budget.mjs --dist <ce dossier> --chunk-outils profil-simule` : B5 ≤ 164 ko.
- `IA5-EMULATEUR-OK`, captures ouvertes ; essai réel journalisé, 3 appels au plus.

## Possède
- `functions/src/hopReclasserIA.ts`, et `functions/src/hopReclassCore.ts` si nécessaire, sans toucher à `v1`.
- `src/ui/hopIndex/suggerer/ia.ts`, `index.tsx`, `reprise.css`.
- `tests/unit/hopIndexV4/hopReclasserIA.test.ts`, `suggererIA.test.tsx`.
- `scripts/eval-hop/ia3-emulateur.ts`.
- La section « ia5 » de `gemini-journal.md`.
- `work/missions/2026-10-25-integration-houblons/voies/ia5-ia-a-la-demande/`.

Rien dans `src/domain/`. Ne lis jamais `functions/.env`. Pas de déploiement. Ne touche ni à `.codex/`, ni à
`source4-portable-bundle-manifest-01.json`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une
ligne.
