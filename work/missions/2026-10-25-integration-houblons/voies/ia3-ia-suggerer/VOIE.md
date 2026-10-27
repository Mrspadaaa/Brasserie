# Voie ia3-ia-suggerer — l'IA dans Suggérer, sur sa maquette choisie

Agent : auteur (Sonnet). Le port dans l'app d'un écran qu'il a choisi, et le callable. La voie s'arrête au code, aux tests, au build, à
l'essai simulé, aux captures et à l'essai réel borné. Le déploiement de la fonction revient au pilote. Pour les séries de captures,
écris une `DEMANDE EXECUTANT :`. Le critique (Fable) jugera tes captures après toi.

## Ses mots
- 27.10 : « dans suggestions , j'ai l'impression que il y a pas l'ia ? » (D188) ; puis « Regarde surtout pour l'algo et implemtation avec
  l'ai » (D124).
- Sa base choisie, à reprendre telle quelle (règle n° 1) : page m6, « M1 + M2 · avec l'IA semble le mieux » (26.10). Le complément est au
  registre `work/refonte-frontend/v4/choix/ecrans.json` (écran Suggérer). Ses captures :
  - `voies/m6-suggerer-moment/img/m1m2-ia.png` : la puce « ✦ ordre IA prêt », pointillée, étoile bleue, sur le groupe du dry hop, là où
    sont les ex æquo ;
  - `voies/m6-suggerer-moment/img/m1m2-ia-phrase.png` : un toucher sur une rangée ouvre la phrase « IA … ».
  Ouvre les deux. Lis `voies/m6-suggerer-moment/RESULTAT.md`. Dans m6, la phrase était un exemple ; ici, elle vient de l'IA.
- « Il faudra évidemment enlever le panel des six houblons dans la vrai app » : « Tes six » de la page m9 ne vient **pas** dans l'app.

## Base de code (D92 : le callable est en production)
- `voies/i2-ia-substituer/RESULTAT.md` en entier : c'est le modèle.
  - Appel à l'ouverture, en ligne. Une réponse en moins de 3 s, sur une liste non touchée, s'applique une fois, sans décalage (0 px).
    Sinon, la puce « appliquer l'ordre IA ».
  - Hors ligne ou en échec : l'ordre du moteur, sans message. Les scores restent ceux du moteur.
  - L'ordre IA s'applique avant le choix des rangées affichées.
- `functions/src/hopReclassCore.ts` (invite `v1`, figée par un test d'identité sur 78 messages : **ne la change pas**),
  `functions/src/hopReclasserIA.ts`, `src/ui/hopIndex/substituer/ia.ts`.
- Les gardes : `assertAuthorized` et `runWithMonthlyAiBudget` (plafonds mensuel et quotidien), le modèle choisi par le serveur
  (Flash-Lite), une réponse invalide qui rend `ok:false` (jamais un ordre), `guardLiveFetch`.

## Ce qui est demandé
1. **Un mode « suggérer » du callable.** C'est une invite neuve, versionnée (`suggerer-v1`) ; l'invite `v1` de Substituer ne bouge pas.
   - Entrée : le style (code et nom), la recette en bref (OG, IBU, houblons déjà là, moments), la demande (« plus d'agrumes », d'un cran,
     au moment visé), et les candidats du groupe, en fiches courtes.
   - Sortie : l'ordre de tous les candidats donnés et une phrase courte par candidat.
   - L'invite peut demander à l'IA son savoir du style (« typé IPA ») ; elle ne doit pas inventer de valeur chiffrée.
   - Taille du pool : à toi de la fixer et de la justifier, coût compris. Elle doit couvrir ses houblons quand ils sont dans les 20 à 30
     premiers du moteur (Mosaic 10e, Idaho 7 11e, Mandarina 18e, Pacific Jade 27e en agrumes).
2. **Le client dans Suggérer.** Sur le groupe des ex æquo (« même effet sur tes objectifs »), la puce et la phrase de sa maquette m6, au
   comportement de i2.
   - L'ordre IA choisit les rangées affichées (aujourd'hui 4).
   - Un toucher sur la puce rend l'ordre du moteur.
   - Aucun élément neuf qui ne soit pas dans sa maquette : pas de cockpit, texte à 12 px au moins (phrase à 14 px, comme i2).
3. **Les tests, sans Gemini** : unitaires avec un transport simulé ; jamais d'appel réel dans `npm test`.
4. **L'essai simulé** sur émulateur, comme `voies/i2-ia-substituer/emulateur/emulateur.ts` en `--mode=simule`, sans aucun appel réel.
   Captures à 390 × 844 sur sa recette neipa v3 (`voies/f9-intensite-typicite/recette-neipa-v3.txt`), toutes ouvertes (L12) :
   - l'ouverture ;
   - la puce ;
   - l'ordre appliqué ;
   - la phrase au toucher ;
   - la puce touchée (retour à l'ordre du moteur) ;
   - une réponse tardive ;
   - hors ligne.
5. **L'essai réel**, accordé (D100) : 30 appels et 0,5 CHF au plus en tout, par `guardLiveFetch`, sur l'émulateur avec le vrai
   fournisseur, comme l'essai réel de i2.
   - Les cas : sa neipa v3 (agrumes, tropicaux ; dry hop actif), le stout S1 et une 21C.
   - Journal : une section « ia3 » dans `work/finalisation-tickets-2026-10-08/gemini-journal.md`, avec les appels, les CHF, les durées et
     le modèle.
   - Rapport : l'ordre IA contre l'ordre du moteur, et le rang de ses six dans chacun.
   - Arrête-toi au premier dépassement de budget ou à la première erreur répétée.

## Critères
- `npx vitest run tests/unit/hopIndexV4 --maxWorkers=2` : vert. Le test d'identité de l'invite `v1` est vert. Les nouveaux tests du mode
  « suggérer » couvrent : invite, schéma, réponse invalide, hors liste, doublon, budget.
- Les tests de `functions/` touchés : verts (`npm --prefix functions test`, s'il existe, ou le script du dépôt). `npx tsc --noEmit` et
  `npx tsc --noEmit -p functions` : sans sortie.
- Build à part :
  - construis avec `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-ia3` ;
  - `node scripts/check-no-dev-auth.mjs` : propre ;
  - B5 ≤ 164 ko ;
  - `fumee-worker-prod.mjs --dist=<ce dossier>` : `WORKER PROD OK`.
- Essai simulé : un jeton `IA3-EMULATEUR-OK`, imprimé seulement si tout a été constaté, et les captures ouvertes.
- Essai réel : le journal est écrit, et le total est de 0,5 CHF au plus.
- `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours --ecran=suggerer`, après
  `construire.mjs` : `ETATS OK`.

## Possède
- `functions/src/hopReclassCore.ts`, `functions/src/hopReclasserIA.ts`, leurs tests.
- `src/ui/hopIndex/suggerer/` (client IA, puce, phrase, CSS), `src/ui/hopIndex/parcours/adaptateur.ts` (seulement pour donner le pool du
  groupe).
- `tests/unit/hopIndexV4/suggererIA*.test.tsx`, `hopReclasserIA.test.ts`.
- `scripts/eval-hop/ia3-*` (neufs).
- La section « ia3 » de `gemini-journal.md`.
- `work/missions/2026-10-25-integration-houblons/voies/ia3-ia-suggerer/`.

**La voie a4 travaille en même temps.** Elle possède `src/domain/hopIndex/v4/` et les états de la maquette. N'y touche pas. Si tu en as
besoin, écris-le dans RESULTAT.md (`BESOIN A4 : …`). Relis `git status` avant ton build final. Lance vitest avec `--maxWorkers=2`.

**Pas de déploiement** : ni `firebase deploy`, ni rien en production. Ne touche ni à `.codex/`, ni à
`source4-portable-bundle-manifest-01.json` ; ne lis jamais `functions/.env`. N'écris aucun code par heredoc ni par `node -e`. Pas de
`git stash`, aucun commit. Écris RESULTAT.md tôt et tiens-le à jour. Rends une ligne.
