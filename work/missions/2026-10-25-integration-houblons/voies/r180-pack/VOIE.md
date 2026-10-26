# Voie r180-pack — la régression du pack Beer Maverick (d2), en ligne depuis D76

Agent : auteur (Sonnet), pour corriger du code et des données.

## Le défaut (trouvé par la voie r177, cause lue par le pilote)
- La voie d2 (commit 79ca35f5, déployé en D76) a ajouté la clé `hopBeerMaverickFiches` dans `src/data/hopBeerMaverickBootstrap.json`.
- Ce fichier est aussi un **pack que l'app installe** :
  - `src/ui/hopIndex/HopKnowledgePanel.tsx`, `installCommunity('maverick')` → `installPack(pack.default)` ;
  - la validation de `functions/src/backupCore.ts` (l. 74) refuse toute collection hors de `BUSINESS_COLLECTIONS` :
    « Collection invalide : hopBeerMaverickFiches. ».
- Donc, en production, le bouton d'installation de Beer Maverick du panneau « Sources et modèles » échoue.
- En test :
  - `tests/integration/hopStudy.test.ts` échoue ;
  - 6 tests de `prototypes/houblons-v4/tests/` (client-async ×3, donnees, pack, worker-calculs : empreintes) échouent depuis d2.

## À faire
1. **Un test qui échoue d'abord** : le pack `hopBeerMaverickBootstrap.json` passe la validation de l'installation, c'est-à-dire le chemin
   de `installPack` ou la validation de `backupCore` qu'il emprunte. Rouge sur HEAD, vert après.
2. **Sortir les fiches du pack** : `hopBeerMaverickFiches` va dans un fichier à part, `src/data/hopBeerMaverickFiches.json`.
   - Le pack redevient exactement ce qu'il était avant d2 : `hopVarieties` identique, aucune autre clé ;
   - mets à jour son producteur (`scripts/scrape-hop-community.mjs`, mode hors ligne), ses lecteurs
     (`prototypes/houblons-v4/scripts/build-data.mjs`, et tout autre lecteur : cherche `hopBeerMaverickFiches` dans tout le dépôt) et
     les tests de d2 ;
   - `src/data/hopV4/proto-data.json`, régénéré, doit rester identique octet pour octet. Sinon, explique chaque différence.
3. **Les 6 tests du prototype** :
   - rejoue `prototypes/houblons-v4/tests/` après le point 2 ;
   - pour chacun encore rouge : est-ce une empreinte de données qui a légitimement changé avec d2 (le catalogue s'est enrichi), ou
     un comportement du moteur qui a bougé ?
   - `tests/unit/hopIndexV4/moteurInchange.test.ts` dit que le moteur rend les mêmes résultats : vérifie-le contre ces tests ;
   - une empreinte ne se met à jour qu'avec la preuve que seul l'apport de données la change. Écris la preuve dans RESULTAT.md.
4. **Rejeux** :
   - `npx vitest run tests/integration/hopStudy.test.ts` ;
   - les tests du prototype (trouve leur commande dans `package.json` ou `prototypes/houblons-v4/`) ;
   - `npx vitest run tests/unit/hopIndexV4` ;
   - `node scripts/collecte-hop/fusion.mjs --sans-ecriture` : les compléments ne doivent pas changer ;
   - `npm run build`.
5. **Vrai rendu** : dans Chrome, `?dev-local` (émulateurs, jamais la production), ouvre le panneau « Sources et modèles » et lance
   l'installation du pack Beer Maverick. Elle réussit. Capture ouverte.

## Possède
- `src/data/hopBeerMaverickBootstrap.json`, `src/data/hopBeerMaverickFiches.json`, `scripts/scrape-hop-community.mjs`.
- `prototypes/houblons-v4/scripts/build-data.mjs`, `prototypes/houblons-v4/tests/` (empreintes, avec preuve seulement).
- `src/data/hopV4/proto-data.json` (régénération seulement).
- `tests/unit/hopIndexV4/`, `tests/integration/hopStudy.test.ts` (lecture, sans affaiblir le test).
- `work/missions/2026-10-25-integration-houblons/voies/r180-pack/`.

La voie d3b corrige en ce moment `tests/integration/comparerValeurs.chrome.mjs` et `src/ui/hopIndex/fiche/complements-ui.ts` : n'y
touche pas. N'écris aucun code par heredoc ni par `node -e` : Write ou Edit seulement. Pas de `git mv`, pas de `git stash`.

Écris RESULTAT.md tôt. Retour en une ligne.
