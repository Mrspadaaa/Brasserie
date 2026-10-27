# Voie m9-dipa-listes — sa Double IPA : quelle liste dans Suggérer ?

Agent : concepteur (Opus). C'est ce que le brasseur verra : une page de choix, faite de mini maquettes dans **son vrai écran Suggérer**.
Rien ne change dans l'app.

## Ses mots (27.10)
- « pour la double IPA, les houblons d'agrume sont pas vraiment ceux attendu. Je m'attendais à des houblon plus typé IPA El dorado, mosaic.
  Mandarina Bavaria, calypso, Pacifique jade ou même idao7 » (D191). Sa référence : le radar Beer Maverick d'Idaho 7,
  `voies/brasseur-ref-bm-idaho7.jpg`. Sa capture de Suggérer : `voies/brasseur-suggerer-dipa.jpg`. Ouvre les deux.
- À « mini maquettes d'abord, ou directement ? » : « Les deux ». Le « directement » est fait (voie f9). Cette page fait le reste.
- Plus anciens, à respecter :
  - « Citra cryo semble toujours être en tête pour beaucoup de choses » ;
  - « elle récompense même surtout l'α c'est pas la bonne métrique » ;
  - « Il faudrait pas que l'algo trie trop ou exclue trop tôt ».

## Les données : ne calcule rien, lis-les
`voies/f9-intensite-typicite/listes.json`, sur sa vraie recette « neipa v3 » (`voies/f9-intensite-typicite/recette-neipa-v3.txt`) :
22A, 24 L, OG 1,081, Lotus 84 g à 40′, Verdant IPA. Lis aussi `voies/f9-intensite-typicite/RESULTAT.md` pour comprendre les quatre
combinaisons et leurs limites.

Les quatre combinaisons :
- **A, l'actuel** (en production) ;
- **B, l'intensité par variété** (A3 ; les barres changent) ;
- **C, la typicité du style**, d'après Beer Analytics. Elle devient le défaut (décision D120 du pilote), mais reste à son choix ;
- **D, les deux.**

## Ce qui est demandé
- Une page dont l'en-tête tient en une phrase : « Quelle liste pour ta Double IPA ? »
- A en référence, puis B, C et D, côte à côte, pour « plus d'agrumes » et « plus de tropicaux » au dry hop.
- Chaque vignette est son écran Suggérer tel qu'il est dans l'app :
  - les premières rangées de la liste ;
  - ses six houblons repérés là où ils tombent, avec leur rang quand ils sont plus bas, par exemple « Mosaic 10e » ;
  - les barres au style après l'ajout du premier (`barresApresLePremier`).
- Une seule ligne honnête sur ce que les données disent. Exemples : Calypso dans 1 % des Double IPA chez Beer Analytics ; Pacific Jade ne
  cite pas le tropical ; El Dorado est freiné par sa poire en 22A. Pas de cockpit ([[pas-de-cockpit]]), aucun texte sous 12 px.
- Une idée à toi pour rendre la différence entre les listes lisible d'un coup d'œil, par exemple ses six surlignés, ou l'écart de rang.
  Elle doit rester dans son écran, pas dans une carte à part.

## Méthode
- Rends l'app depuis la copie propre `C:/Users/mrspa/AppData/Local/Temp/deploy-63130965` : elle est au commit 645c17f4, et personne
  d'autre n'y écrit pendant ta voie. Ne modifie aucun de ses fichiers suivis par git. Tes fichiers de travail vont dans ta voie ou dans
  `os.tmpdir()`.
- Clone dans la page rendue de l'app, avec des classes préfixées `m9r-…` que tu retires après la capture (L26). Modèles :
  `voies/m6-suggerer-moment/capturer.mjs` et `voies/m8-radar-manque-partiel/`. Le contrôle
  `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs` doit passer.
- Écris une `DEMANDE EXECUTANT :` pour les séries de captures au-delà d'un premier essai (voir ta définition d'agent).
- Lis `.claude/rules/affinee-frontend.md`, DESIGN.md et le portrait du critique (`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`).

## Livrable
- `voies/m9-dipa-listes/page.html`. Critère : `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m9`
  doit rendre `PAGE OK`, et tu as ouvert les captures (L12).
- `RESULTAT.md` : les vignettes, les captures ouvertes, et ta préférence argumentée comme le brasseur la jugerait.

## Possède
`work/missions/2026-10-25-integration-houblons/voies/m9-dipa-listes/` seulement. Rien dans `src/`. N'écris aucun code par heredoc ni par
`node -e`. Retour en une ligne.
