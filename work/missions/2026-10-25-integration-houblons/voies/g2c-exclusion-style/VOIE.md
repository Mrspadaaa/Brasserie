# Voie g2c-exclusion-style — une seule fiche ne doit plus exclure Nelson Sauvin d'une Hazy

Agent : auteur (Sonnet), pour un diagnostic et une correction du moteur. **Cette voie bloque le prochain déploiement.**

## Le défaut (relevé par g2a, `voies/g2a-departage/rapport.md`, l. 29)
Dans Suggérer, sur la recette 21C (Hazy IPA), le style classe « herbacé » et « végétal vert » comme indésirables. Le moteur exclut alors
du pool tout houblon dont **une seule fiche** cite l'une de ces deux familles :
- Nelson Sauvin cite végétal vert ;
- Motueka cite herbacé ;
- Mosaic cite végétal vert ;
- Hallertau Blanc et Cascade citent les deux.

Ces cinq houblons sortent ainsi d'une Hazy. Pour un brasseur, ce résultat est absurde (L14 : « nelson sauvin est un houbon ordinaire »).

La cause est dans le code :
- `src/domain/hopIndex/v4/voies.ts` l. 107 (`cites`) et l. 185 à 197 (`avoid`, `bad`) ;
- `src/domain/hopIndex/v4/hops.ts` l. 77 (`citations`) : une famille est « citée » dès qu'**une** fiche la cite.

Depuis d4 (ca7e1afd), les fiches de 12 sources sont entrées dans le catalogue. Il y a beaucoup plus de fiches par houblon, donc beaucoup plus
de chances qu'une seule cite une famille indésirable. **d4 n'est pas encore en production** : la production tourne sur 49907352.

## Décision du pilote (D90, réversible)
Une famille indésirable du style, ou une famille « moins » de la visée, exclut un houblon seulement si elle est **marquée** :
- « marqué » veut dire citée par la moitié au moins des fiches lues pour ce houblon ;
- c'est le niveau `marqué` de `FamilyDescription` dans `hops.ts`, celui des gros points de la fiche (« gros : la moitié au moins ») ;
- une citation minoritaire n'exclut plus.

C'est la même convention que l'écran montre déjà. Rien n'est ajouté à l'écran.

## À faire
1. **Mesurer d'abord** (nouveau script dans `scripts/eval-hop/`, déterministe). Compare la production (49907352, à extraire par
   `git show 49907352:<f>` vers `os.tmpdir()` ou par un worktree temporaire, jamais en remplaçant un fichier du dépôt, L17), HEAD et
   HEAD + D90. Mesure, pour la 21C, la stout 16D et trois autres styles des fixtures qui ont des familles indésirables :
   - le nombre de houblons exclus du pool par le style, et par une visée « moins de résineux » ;
   - le sort des houblons phares : Citra, Nelson Sauvin, Motueka, Galaxy, Mosaic, Hallertau Blanc, Cascade, Idaho 7, Simcoe,
     Strata. Pour chacun : exclu ou non, et sur combien de fiches sur combien ;
   - les 10 premières voies de Suggérer, « plus d'agrumes » et « plus de tropical », sur la 21C.
2. **Les autres lecteurs de `cites`** dans le moteur : `grep` sur tout le dépôt (L17).
   - Dans Substituer (`substitution.ts`, conflitsStyle), lis comment le conflit de style est décidé. S'il souffre du même défaut,
     applique la même règle et mesure-le de la même façon : rangs des remplaçants de Galaxy et de Nelson Sauvin, avant et après.
   - Dans Ma bière, la fiche et le prototype : ne change que ce qui exclut ou pénalise. L'affichage des points cités reste tel quel.
3. **Corriger** selon D90, avec des tests :
   - un houblon cité par 1 fiche sur 8 pour une famille indésirable reste dans le pool ;
   - cité par 4 sur 8, il est exclu ;
   - sans fiche, le comportement d'aujourd'hui est gardé et écrit dans le test.
4. **Les empreintes** : celles de `moteurInchange.test.ts`, de `prototypes/houblons-v4/tests/client-async.test.ts` et de
   `worker-calculs.test.ts` changent. Mets-les à jour, avec une ligne de raison dans chaque test, comme les commentaires existants
   (« D90, g2c »).
5. **La maquette** : reconstruis-la (`node prototypes/houblons-v4/parcours/outils/construire.mjs`), puis lance
   `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours`. Si un état change, mets-le à jour dans
   `work/refonte-frontend/v4/choix/etats/` avec la preuve avant et après, comme e3.

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : vert.
- `npm run build` : vert.
- Le script de mesure rend la même sortie deux fois (même sha256).
- `rapport.md` contient trois tables : production, HEAD, HEAD + D90.
- Sur la 21C, avec D90, Nelson Sauvin, Motueka, Mosaic et Citra ne sont plus exclus. Si l'un l'est encore, dis par quelle règle.
- `controle-etats.mjs` OK.

## Possède
- `src/domain/hopIndex/v4/voies.ts` et `src/domain/hopIndex/v4/hops.ts` : les exclusions seulement.
- `src/domain/hopIndex/v4/substitution.ts` : le conflit de style seulement, si l'étape 2 le demande.
- Les tests d'empreinte nommés ci-dessus, et des tests neufs dans `tests/unit/hopIndexV4/`.
- `scripts/eval-hop/` : nouveaux fichiers seulement.
- `work/refonte-frontend/v4/choix/etats/`, seulement si un état change.
- `work/missions/2026-10-25-integration-houblons/voies/g2c-exclusion-style/`.

Ne touche pas `src/ui/hopIndex/dryhopper/` : la voie p5 est en cours. N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas
de `git stash`. Écris RESULTAT.md tôt. Retour en une ligne.
