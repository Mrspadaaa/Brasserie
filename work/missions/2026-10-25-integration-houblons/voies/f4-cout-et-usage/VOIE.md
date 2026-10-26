# Voie f4-cout-et-usage — ramener le coût de Suggérer, et l'usage à 60′ dans Substituer

Agent : auteur (Sonnet). Le moteur, sans changer l'écran. La voie s'arrête au code, aux tests, au build et aux mesures. Pour la suite
mécanique, écris une `DEMANDE EXECUTANT :`.

## Base
Lis la voie f2 (`voies/f2-affinage-a-b1-c-d/RESULTAT.md`), en entier : elle est finie mais non commitée, et ses fichiers sont dans l'arbre
de travail. Lis aussi les décisions D102 et D105 (`work/refonte-frontend/decisions.md`).

## Décision du pilote (D106)
1. **Le coût est bloquant.** Le brasseur : « Attention au délais ajouter, la Responsive, réactivité ». Avec la borne de 80 de f2, Suggérer
   prend 86 → 113 ms à chaud et 206 → 449 ms à froid. Fais l'option (c) de f2 :
   - les remplacements « à IBU égal », qui portent les deux tiers du surcoût, se calculent **au repos ou après le premier affichage**, par
     le client asynchrone ou le préchauffage (`src/ui/hopIndex/precharge.ts`) ;
   - la liste principale s'affiche d'abord, sans eux, puis ils arrivent sans faire sauter la liste : leur place est réservée, ou ils
     entrent sous la ligne de flottaison ;
   - objectif : `check:hop-perf` et `scripts/eval-hop/f2-perf.ts` ne régressent pas au-delà du bruit par rapport à HEAD (b41a8194 ou
     plus récent), au premier affichage. Tableau au ms près. Ne relève aucun budget.
2. **Départage : l'option (a) de f2.** Adapte les trois tests de `departage.test.ts`, avec `tete` = les voies de rang 1 à ordre de
   pool égal. Le moteur ne change pas pour ça.
3. **L'usage à 60′ dans Substituer.** Avec J1, Falconer's Flight, Altus, Akoya, Loral et Sequoia Blend (usage « arôme » chez Beer
   Maverick) entrent dans les 10 premiers de Nugget à 60′. Le moteur lit le rôle par l'α, alors que Suggérer lit l'usage.
   - Fais reculer à 60′ un remplaçant d'usage « arôme » (la même lecture que Suggérer), comme les produits d'arôme (`demotionDe`),
     avec sa raison écrite.
   - Le témoin de D105 doit passer à la lettre : aucun houblon d'usage « arôme » dans les 10 premiers de Nugget à 60′, sauf démotion
     écrite.
   - Rejoue le banc D (`scripts/eval-hop/banc-justesse.ts`), avant et après.

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : vert.
- `npm run build` : vert.
- `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`, sur un build fait avec `VITE_HOP_V4=on` : B5 à 162 ko au plus (D104).
- Mesures de fluidité au niveau de HEAD.
- Houblons phares (L14) : `scripts/eval-hop/f2-borne.ts`, mêmes résultats que f2.

## Possède
- `src/domain/hopIndex/v4/voies.ts`, `substitution.ts`, `palier.ts`.
- Le client asynchrone et `src/ui/hopIndex/precharge.ts`.
- `src/ui/hopIndex/suggerer/` : seulement l'arrivée différée des remplacements.
- `tests/unit/hopIndexV4/departage.test.ts`, `affinageD102.test.ts`, et des tests neufs.
- `scripts/eval-hop/`.
- `work/missions/2026-10-25-integration-houblons/voies/f4-cout-et-usage/`.

La voie f3 (diagnostic de quickAdd) lit `quickAdd.ts` : n'y touche pas. N'écris aucun code par heredoc ni par `node -e`. Pas de
`git stash`. Écris RESULTAT.md tôt. Rends une ligne.
