# Voie g2d-apport-minoritaire : une seule fiche ne doit pas donner +4,5 crans de végétal à Nelson Sauvin

Agent : auteur (Sonnet). C'est une mesure, suivie d'une option du moteur dont le défaut ne change pas. La voie s'arrête au code, aux tests, au build et au rapport.

## Le défaut (g2b, `voies/g2b-60-et-dryhop/RESULTAT.md`, « Réputation » et DÉCISION À PRENDRE)
Sur la 21C (Hazy), visée « plus d'agrumes », au dry hop actif, rang sur 152 houblons :

| Houblon | Rang | Cause |
|---|---|---|
| Galaxy | 2 (k3) | — |
| Citra | 54 | floral et résineux au-dessus de la bande, 3,4 crans |
| Motueka | 99 | herbacé +4,2 crans |
| Nelson Sauvin | 107 | végétal vert +4,5 crans |
| Mosaic | 134 | 5 familles au-dessus de la bande |

Le brasseur ne reconnaîtra pas ces listes (L14 : « nelson sauvin est un houbon ordinaire »).

La cause mesurée est le débordement de style (`overflowTotal`), une clé de rang placée avant la distance. Mais l'effet lui-même vient de `cites`
(`src/domain/hopIndex/v4/hops.ts`), où une famille compte dès qu'**une** fiche la cite :
- Nelson Sauvin cite végétal vert dans 1 fiche sur 9, et reçoit pourtant l'effet entier de la famille ;
- D90 (g2c) l'a gardé dans le pool, mais l'effet et le rang sont restés les mêmes.

## Ce qu'il faut mesurer (options du moteur, défaut `'aucun'` inchangé à l'octet)
- **(c), rang seul** : le débordement ne compte dans le rang que pour une famille **marquée**, c'est-à-dire citée par la moitié des
  fiches au moins (règle de D90). Les barres affichées ne changent pas.
- **(m), effet si marquée** : une famille citée par moins de la moitié des fiches n'apporte pas d'effet établi. Elle reste visible
  à un toucher comme citée. Les barres changent.
- **(w), effet pondéré** : l'effet d'une famille est multiplié par la part des fiches qui la citent. Les barres changent.

Pour chaque option, mesure sur trois cas :
1. **Suggérer.** Recettes 21C et stout 16D. Visées « plus d'agrumes », « plus de tropical », « plus de floral ». Moments dry hop
   actif et 10′. Relève le rang de Citra, Nelson Sauvin, Motueka, Mosaic, Galaxy, Hallertau Blanc, Cascade, Idaho 7, Strata et
   Simcoe. Pour chacun, dis si le rang est crédible par réputation (L14).
2. **Les barres de q2b.** Combien de barres visibles changent, et de combien, sur les états `choix/etats/suggerer.json` et sur la
   recette de m6. Une barre qui change, c'est ce que le brasseur voit changer.
3. **Substituer v2 et Ma bière.** Lis-les-tu via `cites` ? Si oui, donne leur impact : rangs des remplaçants de Galaxy et de
   Nelson Sauvin, et barres de Ma bière.

Le coût en temps de chaque option, en ms par appel, à chaud et à froid.

## À faire
- Les trois options, dans `hops.ts`, `voies.ts` ou un module voisin. Le défaut doit être prouvé inchangé à l'octet : réemploie
  `scripts/eval-hop/palier-octet.ts` ou `departage-octet.ts`.
- Les tests de chaque option, dans des fichiers neufs.
- Un script de mesure, déterministe, dans `scripts/eval-hop/`.
- `rapport.md`, avec trois tables et une recommandation chiffrée en DÉCISION À PRENDRE. N'active aucun défaut.

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` vert, empreintes inchangées.
- `npm run build` vert.
- Le script de mesure rend deux fois le même sha256.

## Possède
- `src/domain/hopIndex/v4/hops.ts`, `voies.ts`, `palier.ts`, `departage.ts` : options seulement.
- `tests/unit/hopIndexV4/` : nouveaux fichiers seulement.
- `scripts/eval-hop/` : nouveaux fichiers seulement.
- `work/missions/2026-10-25-integration-houblons/voies/g2d-apport-minoritaire/`

La voie g2b ajoute peut-être encore des doses à `scripts/eval-hop/suggerer-m7.ts` : ne touche pas ce fichier. N'écris aucun code
par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`. Écris RESULTAT.md tôt. Retour en une ligne.
